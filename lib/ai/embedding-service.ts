/**
 * Gemini Embedding Service for AI Course Platform
 * Handles text embedding generation and vector similarity search
 * Using Google's Gemini API (text-embedding-004)
 */

import type { GoogleGenerativeAI as GoogleGenerativeAIType } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

// Types for embedding operations
export interface EmbeddingResult {
  embedding: number[];
  usage: {
    promptTokens: number;
    totalTokens: number;
    estimated: boolean;
  };
}

export interface SearchResult {
  contentId: string;
  contentType: string;
  contentText: string;
  similarity: number;
  metadata?: any;
}

export interface EmbeddingBatchRequest {
  contentType: string;
  contentId: string;
  text: string;
}

export interface SearchOptions {
  contentTypes?: string[];
  limit?: number;
  threshold?: number; // Minimum similarity score (0-1)
  userId?: string;
}

class EmbeddingService {
  private genAI: GoogleGenerativeAIType | null = null;
  private embeddingModel: ReturnType<GoogleGenerativeAIType['getGenerativeModel']> | null = null;
  private prismaClient: PrismaClient | null = null;
  private initialized = false;
  private readonly model = 'text-embedding-004';
  private readonly dimensions = 768; // Gemini embedding dimensions

  constructor() {
    // Delay initialization until first use to avoid build-time side effects.
  }

  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai') as {
      GoogleGenerativeAI: new (key: string) => GoogleGenerativeAIType;
    };

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: this.model });
    this.prismaClient = new PrismaClient();
    this.initialized = true;
  }

  private getEmbeddingModel(): ReturnType<GoogleGenerativeAIType['getGenerativeModel']> {
    this.ensureInitialized();
    if (!this.embeddingModel) {
      throw new Error('Embedding model initialization failed');
    }
    return this.embeddingModel;
  }

  get prisma(): PrismaClient {
    this.ensureInitialized();
    if (!this.prismaClient) {
      throw new Error('Prisma client initialization failed');
    }
    return this.prismaClient;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      // Clean and prepare text
      const cleanText = this.preprocessText(text);
      if (cleanText.length === 0) {
        throw new Error('Text is empty after preprocessing');
      }

      const result = await this.getEmbeddingModel().embedContent(cleanText);

      const embedding = result.embedding.values;

      // Gemini doesn't provide token usage, estimate based on text length
      const estimatedTokens = Math.ceil(cleanText.length / 4);
      const usage = {
        promptTokens: estimatedTokens,
        totalTokens: estimatedTokens,
        estimated: true,
      };

      return { embedding, usage };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      const results: EmbeddingResult[] = [];

      // Process in batches of 100 (Gemini limit)
      const batchSize = 100;

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const cleanTexts = batch.map(text => this.preprocessText(text));
        if (cleanTexts.some(text => text.length === 0)) {
          throw new Error('One or more texts are empty after preprocessing');
        }

        // Gemini batch embedding
        const batchResult = await this.getEmbeddingModel().batchEmbedContents({
          requests: cleanTexts.map(content => ({
            content: { parts: [{ text: content }] },
          })),
        });

        const batchResults = batchResult.embeddings.map((item, index) => ({
          embedding: item.values,
          usage: {
            promptTokens: Math.ceil(cleanTexts[index].length / 4),
            totalTokens: Math.ceil(cleanTexts[index].length / 4),
            estimated: true,
          },
        }));

        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  }

  /**
   * Store embedding in database
   */
  async storeEmbedding(
    contentType: string,
    contentId: string,
    text: string,
    embedding: number[],
  ): Promise<void> {
    try {
      // Convert embedding array to pgvector format
      const vectorString = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        INSERT INTO content_embeddings (
          id, "contentType", "contentId", "contentText", embedding, model, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${contentType},
          ${contentId},
          ${text},
          ${vectorString}::vector,
          ${this.model},
          NOW(),
          NOW()
        ) ON CONFLICT ("contentType", "contentId")
        DO UPDATE SET
          "contentText" = EXCLUDED."contentText",
          embedding = EXCLUDED.embedding,
          "updatedAt" = NOW()
      `;
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw new Error('Failed to store embedding');
    }
  }

  /**
   * Batch store multiple embeddings
   */
  async storeEmbeddingBatch(requests: EmbeddingBatchRequest[], embeddings: number[][]): Promise<void> {
    try {
      if (requests.length !== embeddings.length) {
        throw new Error('Requests and embeddings length mismatch');
      }

      // Insert all embeddings in a single transaction
      await this.prisma.$transaction(async (tx) => {
        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];
          const embedding = embeddings[i];
          const vectorString = `[${embedding.join(',')}]`;

          await tx.$executeRaw`
            INSERT INTO content_embeddings (
              id, "contentType", "contentId", "contentText", embedding, model, "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid()::text,
              ${request.contentType},
              ${request.contentId},
              ${request.text},
              ${vectorString}::vector,
              ${this.model},
              NOW(),
              NOW()
            ) ON CONFLICT ("contentType", "contentId")
            DO UPDATE SET
              "contentText" = EXCLUDED."contentText",
              embedding = EXCLUDED.embedding,
              "updatedAt" = NOW()
          `;
        }
      });
    } catch (error) {
      console.error('Error storing batch embeddings:', error);
      throw new Error('Failed to store batch embeddings');
    }
  }

  /**
   * Search for similar content using vector similarity
   */
  async searchSimilar(
    queryText: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    try {
      const {
        contentTypes,
        limit = 10,
        threshold = 0.7,
        userId,
      } = options;

      // Generate embedding for search query
      const { embedding: queryEmbedding } = await this.generateEmbedding(queryText);
      const queryVectorString = `[${queryEmbedding.join(',')}]`;

      // Track search query for analytics
      if (userId) {
        await this.trackSearchQuery(userId, queryText, queryEmbedding);
      }

      // Perform vector similarity search using cosine similarity
      let results: SearchResult[];

      if (contentTypes && contentTypes.length > 0) {
        // Search with content type filter
        results = await this.prisma.$queryRawUnsafe<SearchResult[]>(`
          SELECT
            "contentId",
            "contentType",
            "contentText",
            1 - (embedding <=> $1::vector) as similarity
          FROM content_embeddings
          WHERE 1 - (embedding <=> $1::vector) > $2
            AND "contentType" = ANY($3::text[])
          ORDER BY embedding <=> $1::vector
          LIMIT $4
        `, queryVectorString, threshold, contentTypes, limit);
      } else {
        // Search without content type filter
        results = await this.prisma.$queryRawUnsafe<SearchResult[]>(`
          SELECT
            "contentId",
            "contentType",
            "contentText",
            1 - (embedding <=> $1::vector) as similarity
          FROM content_embeddings
          WHERE 1 - (embedding <=> $1::vector) > $2
          ORDER BY embedding <=> $1::vector
          LIMIT $3
        `, queryVectorString, threshold, limit);
      }

      return results;
    } catch (error) {
      console.error('Error searching similar content:', error);
      throw new Error('Failed to search similar content');
    }
  }

  /**
   * Get content recommendations based on user's progress
   */
  async getContentRecommendations(
    userId: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    try {
      // Get user's completed courses and lessons to build preference vector
      const userProgress = await this.prisma.userProgress.findMany({
        where: { userId },
        include: {
          course: { select: { title: true, description: true } },
          lesson: { select: { title: true, content: true } },
        },
      });

      if (userProgress.length === 0) {
        // Return popular content for new users
        return this.getPopularContent(limit);
      }

      // Create preference text from user's completed content
      const preferenceTexts = userProgress.map(progress => {
        const courseInfo = `${progress.course.title} ${progress.course.description}`;
        const lessonInfo = progress.lesson ? `${progress.lesson.title}` : '';
        return `${courseInfo} ${lessonInfo}`.trim();
      });

      const combinedPreferences = preferenceTexts.join(' ').slice(0, 2000); // Limit text size

      // Search for similar content
      return this.searchSimilar(combinedPreferences, {
        contentTypes: ['course', 'lesson'],
        limit,
        threshold: 0.6,
      });
    } catch (error) {
      console.error('Error getting content recommendations:', error);
      throw new Error('Failed to get content recommendations');
    }
  }

  /**
   * Get popular content for new users
   */
  private async getPopularContent(limit: number): Promise<SearchResult[]> {
    // This would typically get popular courses based on enrollments, ratings, etc.
    const popularCourses = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED', featured: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    return popularCourses.map(course => ({
      contentId: course.id,
      contentType: 'course',
      contentText: `${course.title} ${course.description}`,
      similarity: 1.0, // Perfect match for featured content
    }));
  }

  /**
   * Track search query for analytics
   */
  private async trackSearchQuery(
    userId: string,
    queryText: string,
    queryEmbedding: number[],
  ): Promise<void> {
    try {
      const vectorString = `[${queryEmbedding.join(',')}]`;

      await this.prisma.$executeRaw`
        INSERT INTO search_queries (
          id, "userId", "queryText", "queryEmbedding", "resultsCount", "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${userId},
          ${queryText},
          ${vectorString}::vector,
          0,
          NOW()
        )
      `;
    } catch (error) {
      console.error('Error tracking search query:', error);
      // Don't throw error for analytics failure
    }
  }

  /**
   * Preprocess text for embedding
   */
  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 8000); // Limit text length for embedding API
  }

  /**
   * Embed course content (title + description + lessons)
   */
  async embedCourse(courseId: string): Promise<void> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          lessons: { select: { title: true, content: true } },
        },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Create combined course text
      const lessonTexts = course.lessons.map(lesson =>
        `${lesson.title}: ${lesson.content}`,
      ).join(' ');

      const courseText = `${course.title}. ${course.description}. ${lessonTexts}`.slice(0, 8000);

      const { embedding } = await this.generateEmbedding(courseText);
      await this.storeEmbedding('course', courseId, courseText, embedding);
    } catch (error) {
      console.error('Error embedding course:', error);
      throw new Error('Failed to embed course');
    }
  }

  /**
   * Embed individual lesson content
   */
  async embedLesson(lessonId: string): Promise<void> {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
          id: true,
          title: true,
          content: true,
          description: true,
          course: { select: { title: true } },
        },
      });

      if (!lesson) {
        throw new Error('Lesson not found');
      }

      const lessonText = `${lesson.course.title}: ${lesson.title}. ${lesson.description || ''}. ${lesson.content}`.slice(0, 8000);

      const { embedding } = await this.generateEmbedding(lessonText);
      await this.storeEmbedding('lesson', lessonId, lessonText, embedding);
    } catch (error) {
      console.error('Error embedding lesson:', error);
      throw new Error('Failed to embed lesson');
    }
  }

  /**
   * Initialize embeddings for all existing content
   */
  async initializeExistingContent(): Promise<void> {
    try {
      console.log('Starting embedding initialization with Gemini...');

      // Get all published courses
      const courses = await this.prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true },
      });

      console.log(`Found ${courses.length} courses to embed`);

      // Embed courses in batches
      const courseBatchSize = 10;
      for (let i = 0; i < courses.length; i += courseBatchSize) {
        const batch = courses.slice(i, i + courseBatchSize);
        await Promise.all(
          batch.map(course => this.embedCourse(course.id)),
        );
        console.log(`Embedded courses ${i + 1}-${i + batch.length} of ${courses.length}`);
      }

      // Get all lessons
      const lessons = await this.prisma.lesson.findMany({
        select: { id: true },
      });

      console.log(`Found ${lessons.length} lessons to embed`);

      // Embed lessons in batches
      const lessonBatchSize = 20;
      for (let i = 0; i < lessons.length; i += lessonBatchSize) {
        const batch = lessons.slice(i, i + lessonBatchSize);
        await Promise.all(
          batch.map(lesson => this.embedLesson(lesson.id)),
        );
        console.log(`Embedded lessons ${i + 1}-${i + batch.length} of ${lessons.length}`);
      }

      console.log('Embedding initialization complete!');
    } catch (error) {
      console.error('Error initializing embeddings:', error);
      throw new Error('Failed to initialize embeddings');
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;

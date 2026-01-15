/**
 * AI Service Manager - Unified AI Operations for Course Platform
 * Integrates multiple AI providers and capabilities into a single interface
 */

import { geminiService } from './gemini-service';
import { embeddingService } from './embedding-service';
import { semanticSearchService } from './semantic-search-service';
import type {
  CourseContentSuggestion,
  LessonContent,
  ContentAnalysis,
  AssessmentGeneration,
} from './gemini-service';
import type {
  SearchResult,
  CourseSearchResult,
  LessonSearchResult,
} from './semantic-search-service';

export interface AIProvider {
  name: string;
  status: 'active' | 'fallback' | 'disabled';
  capabilities: string[];
}

export interface AIOperation {
  id: string;
  type: 'content_generation' | 'embedding' | 'search' | 'analysis';
  provider: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  error?: string;
}

export interface CostTracking {
  daily: number;
  monthly: number;
  provider: Record<string, number>;
  lastReset: Date;
}

export interface AIServiceConfig {
  primaryLLM: 'gemini' | 'openai' | 'claude';
  fallbackLLM?: 'gemini' | 'openai' | 'claude';
  embeddingProvider: 'openai' | 'voyage' | 'cohere';
  costBudget: {
    daily: number;
    monthly: number;
  };
  rateLimits: {
    contentGeneration: number; // requests per minute
    embedding: number;
    search: number;
  };
}

class AIServiceManager {
  private config: AIServiceConfig;
  private operations: Map<string, AIOperation> = new Map();
  private costTracking: CostTracking;
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      primaryLLM: 'gemini',
      fallbackLLM: 'openai',
      embeddingProvider: 'openai',
      costBudget: {
        daily: 10, // $10 per day
        monthly: 300, // $300 per month
      },
      rateLimits: {
        contentGeneration: 60, // 60 requests per minute
        embedding: 100,
        search: 1000,
      },
      ...config,
    };

    this.costTracking = {
      daily: 0,
      monthly: 0,
      provider: {},
      lastReset: new Date(),
    };
  }

  // ============================================================
  // CONTENT GENERATION OPERATIONS
  // ============================================================

  /**
   * Generate course suggestions with fallback support
   */
  async generateCourseSuggestions(
    topic: string,
    targetAudience?: string,
    options?: { useCache?: boolean; priority?: 'speed' | 'quality' },
  ): Promise<CourseContentSuggestion[]> {
    const operationId = this.generateOperationId('content_generation');

    try {
      // Check rate limits and budget
      await this.checkLimitsAndBudget('content_generation');

      // Start operation tracking
      this.startOperation(operationId, 'content_generation', 'gemini');

      // Primary: Use Gemini for content generation
      const suggestions = await geminiService.generateCourseSuggestions(topic, targetAudience);

      // Track successful operation
      this.completeOperation(operationId, { outputTokens: this.estimateTokens(JSON.stringify(suggestions)) });

      // Auto-generate embeddings for suggestions if configured
      if (options?.useCache !== false) {
        this.generateSuggestionEmbeddings(suggestions).catch(console.error);
      }

      return suggestions;

    } catch (error) {
      this.failOperation(operationId, error.message);

      // Fallback logic (could implement Claude or GPT-4 fallback here)
      console.warn('Primary content generation failed, no fallback configured:', error);
      throw error;
    }
  }

  /**
   * Generate lesson content with AI assistance
   */
  async generateLessonContent(
    courseTitle: string,
    lessonTopic: string,
    difficulty: string,
    duration: number,
  ): Promise<LessonContent> {
    const operationId = this.generateOperationId('content_generation');

    try {
      await this.checkLimitsAndBudget('content_generation');
      this.startOperation(operationId, 'content_generation', 'gemini');

      const lesson = await geminiService.generateLessonContent(
        courseTitle,
        lessonTopic,
        difficulty,
        duration,
      );

      this.completeOperation(operationId, { outputTokens: this.estimateTokens(lesson.content) });

      return lesson;

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  /**
   * Analyze content quality with AI
   */
  async analyzeContent(content: string, targetLevel: string): Promise<ContentAnalysis> {
    const operationId = this.generateOperationId('analysis');

    try {
      await this.checkLimitsAndBudget('content_generation');
      this.startOperation(operationId, 'analysis', 'gemini');

      const analysis = await geminiService.analyzeContent(content, targetLevel);

      this.completeOperation(operationId, {
        inputTokens: this.estimateTokens(content),
        outputTokens: this.estimateTokens(JSON.stringify(analysis)),
      });

      return analysis;

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  /**
   * Generate assessment questions
   */
  async generateAssessment(
    content: string,
    questionCount: number = 5,
    questionTypes: string[] = ['multiple_choice', 'short_answer'],
  ): Promise<AssessmentGeneration> {
    const operationId = this.generateOperationId('content_generation');

    try {
      await this.checkLimitsAndBudget('content_generation');
      this.startOperation(operationId, 'content_generation', 'gemini');

      const assessment = await geminiService.generateAssessment(content, questionCount, questionTypes);

      this.completeOperation(operationId, {
        inputTokens: this.estimateTokens(content),
        outputTokens: this.estimateTokens(JSON.stringify(assessment)),
      });

      return assessment;

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  // ============================================================
  // EMBEDDING & SEARCH OPERATIONS
  // ============================================================

  /**
   * Intelligent course search with semantic understanding
   */
  async searchCourses(
    query: string,
    userId?: string,
    options?: {
      level?: string[];
      limit?: number;
      includeRecommendations?: boolean;
      sessionId?: string;
    },
  ): Promise<CourseSearchResult[]> {
    const operationId = this.generateOperationId('search');

    try {
      await this.checkLimitsAndBudget('search');
      this.startOperation(operationId, 'search', 'openai-embedding');

      const searchOptions = {
        userId,
        courseLevel: options?.level,
        limit: options?.limit || 10,
        includeRecommendations: options?.includeRecommendations || false,
        sessionId: options?.sessionId,
      };

      const results = await semanticSearchService.searchCourses(query, searchOptions);

      this.completeOperation(operationId, {
        inputTokens: this.estimateTokens(query),
        outputTokens: results.length * 100, // Estimate based on results
      });

      return results;

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  /**
   * Search lessons within courses
   */
  async searchLessons(
    query: string,
    courseId?: string,
    userId?: string,
    limit: number = 10,
  ): Promise<LessonSearchResult[]> {
    const operationId = this.generateOperationId('search');

    try {
      await this.checkLimitsAndBudget('search');
      this.startOperation(operationId, 'search', 'openai-embedding');

      const results = await semanticSearchService.searchLessons(query, courseId, { userId, limit });

      this.completeOperation(operationId, { inputTokens: this.estimateTokens(query) });

      return results;

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  /**
   * Get personalized content recommendations
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 5,
  ): Promise<CourseSearchResult[]> {
    const operationId = this.generateOperationId('search');

    try {
      await this.checkLimitsAndBudget('search');
      this.startOperation(operationId, 'search', 'openai-embedding');

      const recommendations = await semanticSearchService.getPersonalizedRecommendations(userId, limit);

      this.completeOperation(operationId, { outputTokens: recommendations.length * 50 });

      return recommendations;

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(partialQuery: string, limit: number = 5): Promise<any[]> {
    const operationId = this.generateOperationId('search');

    try {
      await this.checkLimitsAndBudget('search');
      this.startOperation(operationId, 'search', 'local');

      const suggestions = await semanticSearchService.getSearchSuggestions(partialQuery, limit);

      this.completeOperation(operationId, { inputTokens: this.estimateTokens(partialQuery) });

      return suggestions;

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  // ============================================================
  // CONTENT EMBEDDING OPERATIONS
  // ============================================================

  /**
   * Generate and store embedding for course
   */
  async embedCourse(courseId: string): Promise<void> {
    const operationId = this.generateOperationId('embedding');

    try {
      await this.checkLimitsAndBudget('embedding');
      this.startOperation(operationId, 'embedding', 'openai');

      await embeddingService.embedCourse(courseId);

      this.completeOperation(operationId, { inputTokens: 8000 }); // Estimate for course content

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  /**
   * Generate and store embedding for lesson
   */
  async embedLesson(lessonId: string): Promise<void> {
    const operationId = this.generateOperationId('embedding');

    try {
      await this.checkLimitsAndBudget('embedding');
      this.startOperation(operationId, 'embedding', 'openai');

      await embeddingService.embedLesson(lessonId);

      this.completeOperation(operationId, { inputTokens: 4000 }); // Estimate for lesson content

    } catch (error) {
      this.failOperation(operationId, error.message);
      throw error;
    }
  }

  /**
   * Initialize embeddings for all existing content
   */
  async initializeAllEmbeddings(): Promise<void> {
    console.log('Starting embedding initialization via AI Service Manager...');

    try {
      await embeddingService.initializeExistingContent();
      console.log('Embedding initialization completed successfully');
    } catch (error) {
      console.error('Embedding initialization failed:', error);
      throw error;
    }
  }

  // ============================================================
  // MONITORING & ANALYTICS
  // ============================================================

  /**
   * Get current AI service status
   */
  getServiceStatus(): {
    providers: AIProvider[];
    operations: AIOperation[];
    costTracking: CostTracking;
    rateLimits: { [key: string]: { current: number; limit: number; resetTime: number } };
    } {
    const providers: AIProvider[] = [
      {
        name: 'Gemini',
        status: 'active',
        capabilities: ['content_generation', 'analysis', 'chat'],
      },
      {
        name: 'OpenAI Embedding',
        status: 'active',
        capabilities: ['text_embedding', 'semantic_search'],
      },
      {
        name: 'pgvector',
        status: 'active',
        capabilities: ['vector_storage', 'similarity_search'],
      },
    ];

    const operations = Array.from(this.operations.values());

    const rateLimits: { [key: string]: { current: number; limit: number; resetTime: number } } = {};
    this.rateLimitCounters.forEach((counter, key) => {
      rateLimits[key] = {
        current: counter.count,
        limit: this.config.rateLimits[key as keyof typeof this.config.rateLimits] || 100,
        resetTime: counter.resetTime,
      };
    });

    return {
      providers,
      operations,
      costTracking: this.costTracking,
      rateLimits,
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    avgResponseTime: { [key: string]: number };
    successRate: { [key: string]: number };
    totalOperations: number;
    costEfficiency: number;
    } {
    const operations = Array.from(this.operations.values());
    const completedOps = operations.filter(op => op.status === 'completed');

    const avgResponseTime: { [key: string]: number } = {};
    const successRate: { [key: string]: number } = {};

    ['content_generation', 'embedding', 'search', 'analysis'].forEach(type => {
      const typeOps = operations.filter(op => op.type === type);
      const typeCompleted = typeOps.filter(op => op.status === 'completed');

      if (typeCompleted.length > 0) {
        avgResponseTime[type] = typeCompleted.reduce((sum, op) => sum + (op.endTime!.getTime() - op.startTime.getTime()), 0) / typeCompleted.length;
      }

      successRate[type] = typeOps.length > 0 ? typeCompleted.length / typeOps.length : 0;
    });

    const costEfficiency = this.costTracking.monthly > 0 ?
      completedOps.length / this.costTracking.monthly : 0;

    return {
      avgResponseTime,
      successRate,
      totalOperations: operations.length,
      costEfficiency,
    };
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  private generateOperationId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startOperation(id: string, type: AIOperation['type'], provider: string): void {
    this.operations.set(id, {
      id,
      type,
      provider,
      startTime: new Date(),
      status: 'running',
    });
  }

  private completeOperation(id: string, usage?: AIOperation['usage']): void {
    const operation = this.operations.get(id);
    if (operation) {
      operation.endTime = new Date();
      operation.status = 'completed';
      operation.usage = usage;

      // Update cost tracking (simplified calculation)
      if (usage?.totalTokens) {
        const cost = this.calculateCost(operation.provider, usage.totalTokens);
        this.costTracking.daily += cost;
        this.costTracking.monthly += cost;
        this.costTracking.provider[operation.provider] =
          (this.costTracking.provider[operation.provider] || 0) + cost;
      }
    }
  }

  private failOperation(id: string, error: string): void {
    const operation = this.operations.get(id);
    if (operation) {
      operation.endTime = new Date();
      operation.status = 'failed';
      operation.error = error;
    }
  }

  private async checkLimitsAndBudget(operationType: keyof typeof this.config.rateLimits): Promise<void> {
    // Check rate limits
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${operationType}_${minute}`;

    if (!this.rateLimitCounters.has(key)) {
      this.rateLimitCounters.set(key, { count: 0, resetTime: (minute + 1) * 60000 });
    }

    const counter = this.rateLimitCounters.get(key)!;
    if (counter.count >= this.config.rateLimits[operationType]) {
      throw new Error(`Rate limit exceeded for ${operationType}`);
    }

    counter.count++;

    // Check budget
    if (this.costTracking.daily >= this.config.costBudget.daily) {
      throw new Error('Daily cost budget exceeded');
    }

    if (this.costTracking.monthly >= this.config.costBudget.monthly) {
      throw new Error('Monthly cost budget exceeded');
    }
  }

  private calculateCost(provider: string, tokens: number): number {
    // Simplified cost calculation
    const costs = {
      'gemini': 0.0005, // $0.50 per 1M tokens
      'openai': 0.0013, // $1.30 per 1M tokens
      'openai-embedding': 0.00013, // $0.13 per 1M tokens
    };

    const costPerToken = costs[provider as keyof typeof costs] || 0.001;
    return (tokens / 1000000) * costPerToken;
  }

  private estimateTokens(text: string): number {
    // Simple token estimation (approximately 4 characters per token)
    return Math.ceil(text.length / 4);
  }

  private async generateSuggestionEmbeddings(suggestions: CourseContentSuggestion[]): Promise<void> {
    // Generate embeddings for course suggestions to improve future search
    for (const suggestion of suggestions) {
      try {
        const combinedText = `${suggestion.title} ${suggestion.description} ${suggestion.outline.join(' ')}`;
        const { embedding } = await embeddingService.generateEmbedding(combinedText);

        await embeddingService.storeEmbedding(
          'course_suggestion',
          `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          combinedText,
          embedding,
        );
      } catch (error) {
        console.warn('Failed to generate embedding for suggestion:', error);
      }
    }
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager();
export default aiServiceManager;

/**
 * Semantic Search Service for AI Course Platform
 * Provides intelligent content discovery using vector similarity search
 */

import { embeddingService, SearchResult } from './embedding-service';
import { PrismaClient } from '@prisma/client';

export interface CourseSearchResult {
  course: {
    id: string;
    title: string;
    description: string;
    level: string;
    thumbnail?: string;
    estimatedTime?: number;
    creator: {
      displayName?: string;
    };
  };
  similarity: number;
  relevanceScore: number;
}

export interface LessonSearchResult {
  lesson: {
    id: string;
    title: string;
    description?: string;
    course: {
      id: string;
      title: string;
    };
  };
  similarity: number;
  relevanceScore: number;
}

export interface SmartSearchOptions {
  userId?: string;
  courseLevel?: string[];
  contentTypes?: ('course' | 'lesson')[];
  limit?: number;
  includeRecommendations?: boolean;
  sessionId?: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'topic' | 'skill';
  popularity: number;
}

class SemanticSearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Smart course search with semantic understanding
   */
  async searchCourses(
    query: string,
    options: SmartSearchOptions = {}
  ): Promise<CourseSearchResult[]> {
    try {
      const {
        userId,
        courseLevel,
        limit = 10,
        sessionId,
      } = options;

      // Get semantic search results
      const searchResults = await embeddingService.searchSimilar(query, {
        contentTypes: ['course'],
        limit: limit * 2, // Get more results for filtering
        threshold: 0.6,
        userId,
      });

      // Enhance results with course details and filtering
      const enhancedResults: CourseSearchResult[] = [];

      for (const result of searchResults) {
        const course = await this.prisma.course.findUnique({
          where: { id: result.contentId },
          include: {
            creator: { select: { displayName: true } },
            _count: {
              select: {
                enrollments: true,
                reviews: true,
              }
            }
          }
        });

        if (!course || course.status !== 'PUBLISHED') {
          continue;
        }

        // Apply level filter
        if (courseLevel && courseLevel.length > 0) {
          if (!courseLevel.includes(course.level)) {
            continue;
          }
        }

        // Calculate relevance score (combines similarity with popularity metrics)
        const relevanceScore = this.calculateRelevanceScore(
          result.similarity,
          course._count.enrollments,
          course._count.reviews,
          course.featured
        );

        enhancedResults.push({
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            level: course.level,
            thumbnail: course.thumbnail || undefined,
            estimatedTime: course.estimatedTime || undefined,
            creator: {
              displayName: course.creator.displayName || undefined,
            }
          },
          similarity: result.similarity,
          relevanceScore,
        });

        if (enhancedResults.length >= limit) {
          break;
        }
      }

      // Sort by relevance score
      enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Track search for analytics
      if (userId && sessionId) {
        await this.trackSearchResults(userId, query, 'course', enhancedResults.length, sessionId);
      }

      return enhancedResults.slice(0, limit);
    } catch (error) {
      console.error('Error searching courses:', error);
      throw new Error('Failed to search courses');
    }
  }

  /**
   * Smart lesson search within courses
   */
  async searchLessons(
    query: string,
    courseId?: string,
    options: SmartSearchOptions = {}
  ): Promise<LessonSearchResult[]> {
    try {
      const { userId, limit = 10 } = options;

      // Get semantic search results for lessons
      const searchResults = await embeddingService.searchSimilar(query, {
        contentTypes: ['lesson'],
        limit: limit * 2,
        threshold: 0.6,
        userId,
      });

      const enhancedResults: LessonSearchResult[] = [];

      for (const result of searchResults) {
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: result.contentId },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
              }
            }
          }
        });

        if (!lesson || lesson.course.status !== 'PUBLISHED') {
          continue;
        }

        // Filter by course if specified
        if (courseId && lesson.course.id !== courseId) {
          continue;
        }

        enhancedResults.push({
          lesson: {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || undefined,
            course: {
              id: lesson.course.id,
              title: lesson.course.title,
            }
          },
          similarity: result.similarity,
          relevanceScore: result.similarity, // For lessons, similarity is primary factor
        });

        if (enhancedResults.length >= limit) {
          break;
        }
      }

      enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return enhancedResults.slice(0, limit);
    } catch (error) {
      console.error('Error searching lessons:', error);
      throw new Error('Failed to search lessons');
    }
  }

  /**
   * Get personalized content recommendations
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<CourseSearchResult[]> {
    try {
      // Get user's learning preferences and history
      const userProgress = await this.prisma.userProgress.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              title: true,
              description: true,
              tags: true,
              level: true,
            }
          }
        },
        orderBy: { lastAccessedAt: 'desc' },
        take: 10,
      });

      if (userProgress.length === 0) {
        // For new users, return popular courses
        return this.getPopularCourses(limit);
      }

      // Extract user preferences
      const userTags = userProgress.flatMap(p => p.course.tags);
      const preferredLevel = this.getMostCommonLevel(userProgress.map(p => p.course.level));
      const preferenceText = userProgress
        .map(p => `${p.course.title} ${p.course.description}`)
        .join(' ')
        .slice(0, 2000);

      // Get recommendations based on user preferences
      const recommendations = await embeddingService.getContentRecommendations(userId, limit * 2);

      // Filter out already enrolled courses
      const enrolledCourseIds = await this.getEnrolledCourseIds(userId);
      const filteredRecommendations = recommendations.filter(
        rec => !enrolledCourseIds.includes(rec.contentId)
      );

      // Convert to CourseSearchResult format
      const results: CourseSearchResult[] = [];
      for (const rec of filteredRecommendations.slice(0, limit)) {
        const course = await this.prisma.course.findUnique({
          where: { id: rec.contentId },
          include: {
            creator: { select: { displayName: true } },
          }
        });

        if (course) {
          results.push({
            course: {
              id: course.id,
              title: course.title,
              description: course.description,
              level: course.level,
              thumbnail: course.thumbnail || undefined,
              estimatedTime: course.estimatedTime || undefined,
              creator: {
                displayName: course.creator.displayName || undefined,
              }
            },
            similarity: rec.similarity,
            relevanceScore: rec.similarity,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(partialQuery: string, limit: number = 5): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      // Get popular course titles that match the partial query
      const courseMatches = await this.prisma.course.findMany({
        where: {
          AND: [
            { status: 'PUBLISHED' },
            {
              OR: [
                { title: { contains: partialQuery, mode: 'insensitive' } },
                { description: { contains: partialQuery, mode: 'insensitive' } },
              ]
            }
          ]
        },
        select: {
          title: true,
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { enrollments: { _count: 'desc' } },
        take: limit,
      });

      // Add course title suggestions
      courseMatches.forEach(course => {
        suggestions.push({
          text: course.title,
          type: 'query',
          popularity: course._count.enrollments,
        });
      });

      // Get popular search queries from history
      const popularQueries = await this.prisma.searchQuery.groupBy({
        by: ['queryText'],
        where: {
          queryText: { contains: partialQuery, mode: 'insensitive' },
        },
        _count: { queryText: true },
        orderBy: { _count: { queryText: 'desc' } },
        take: Math.max(0, limit - suggestions.length),
      });

      popularQueries.forEach(query => {
        suggestions.push({
          text: query.queryText,
          type: 'query',
          popularity: query._count.queryText,
        });
      });

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Auto-complete search for courses and lessons
   */
  async autocomplete(query: string, limit: number = 10): Promise<string[]> {
    try {
      const results = await this.prisma.$queryRaw<{ title: string }[]>`
        SELECT DISTINCT title
        FROM (
          SELECT title FROM courses WHERE title ILIKE ${`%${query}%`} AND status = 'PUBLISHED'
          UNION ALL
          SELECT title FROM lessons l
          JOIN courses c ON l.course_id = c.id
          WHERE l.title ILIKE ${`%${query}%`} AND c.status = 'PUBLISHED'
        ) AS combined_results
        ORDER BY title
        LIMIT ${limit}
      `;

      return results.map(r => r.title);
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      return [];
    }
  }

  /**
   * Get trending search queries
   */
  async getTrendingQueries(limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      const trending = await this.prisma.searchQuery.groupBy({
        by: ['queryText'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        _count: { queryText: true },
        orderBy: { _count: { queryText: 'desc' } },
        take: limit,
      });

      return trending.map(item => ({
        text: item.queryText,
        type: 'query' as const,
        popularity: item._count.queryText,
      }));
    } catch (error) {
      console.error('Error getting trending queries:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score combining similarity with popularity metrics
   */
  private calculateRelevanceScore(
    similarity: number,
    enrollmentCount: number,
    reviewCount: number,
    featured: boolean
  ): number {
    const popularityBoost = Math.min(Math.log(enrollmentCount + 1) / 10, 0.2);
    const reviewBoost = Math.min(reviewCount / 100, 0.1);
    const featuredBoost = featured ? 0.1 : 0;

    return similarity + popularityBoost + reviewBoost + featuredBoost;
  }

  /**
   * Get popular courses for new users
   */
  private async getPopularCourses(limit: number): Promise<CourseSearchResult[]> {
    const popularCourses = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        creator: { select: { displayName: true } },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { enrollments: { _count: 'desc' } },
      ],
      take: limit,
    });

    return popularCourses.map(course => ({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        thumbnail: course.thumbnail || undefined,
        estimatedTime: course.estimatedTime || undefined,
        creator: {
          displayName: course.creator.displayName || undefined,
        }
      },
      similarity: 1.0,
      relevanceScore: 1.0,
    }));
  }

  /**
   * Get most common level from user's progress
   */
  private getMostCommonLevel(levels: string[]): string {
    const levelCounts = levels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(levelCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'BEGINNER';
  }

  /**
   * Get enrolled course IDs for a user
   */
  private async getEnrolledCourseIds(userId: string): Promise<string[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { courseId: true }
    });
    return enrollments.map(e => e.courseId);
  }

  /**
   * Track search results for analytics
   */
  private async trackSearchResults(
    userId: string,
    query: string,
    contentType: string,
    resultCount: number,
    sessionId: string
  ): Promise<void> {
    try {
      await this.prisma.searchQuery.create({
        data: {
          userId,
          queryText: query,
          resultsCount: resultCount,
          sessionId,
        }
      });
    } catch (error) {
      console.error('Error tracking search results:', error);
      // Don't throw error for analytics failure
    }
  }
}

// Export singleton instance
export const semanticSearchService = new SemanticSearchService();
export default semanticSearchService;
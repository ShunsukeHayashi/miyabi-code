/**
 * API Route: AI-powered semantic search for courses and lessons
 * POST /api/ai/semantic-search
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { semanticSearchService } from '@/lib/ai/semantic-search-service';
import { authenticateRequest } from '@/lib/auth/middleware';

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  type: z.enum(['course', 'lesson', 'both']).default('both'),
  courseId: z.string().uuid().optional(), // For lesson search within a specific course
  level: z.array(z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])).optional(),
  limit: z.number().min(1).max(50).default(10),
  includeRecommendations: z.boolean().default(false),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (optional for search, but helps with personalization)
    const authResult = await authenticateRequest(request);
    const userId = authResult.success ? authResult.user.id : undefined;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    const {
      query,
      type,
      courseId,
      level,
      limit,
      includeRecommendations,
      sessionId,
    } = validatedData;

    // Prepare search options
    const searchOptions = {
      userId,
      courseLevel: level,
      limit,
      includeRecommendations,
      sessionId,
    };

    let results = {};

    // Perform search based on type
    if (type === 'course' || type === 'both') {
      const courseResults = await semanticSearchService.searchCourses(query, searchOptions);
      results = { ...results, courses: courseResults };
    }

    if (type === 'lesson' || type === 'both') {
      const lessonResults = await semanticSearchService.searchLessons(query, courseId, searchOptions);
      results = { ...results, lessons: lessonResults };
    }

    // Get personalized recommendations if requested and user is authenticated
    if (includeRecommendations && userId) {
      const recommendations = await semanticSearchService.getPersonalizedRecommendations(
        userId,
        Math.min(5, limit)
      );
      results = { ...results, recommendations };
    }

    return NextResponse.json({
      success: true,
      data: {
        query,
        results,
        searchId: sessionId,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    console.error('Semantic search error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: 'An error occurred while searching. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'suggestions': {
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '5');

        if (query.length < 2) {
          return NextResponse.json({ suggestions: [] });
        }

        const suggestions = await semanticSearchService.getSearchSuggestions(query, limit);
        return NextResponse.json({ suggestions });
      }

      case 'autocomplete': {
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        if (query.length < 2) {
          return NextResponse.json({ completions: [] });
        }

        const completions = await semanticSearchService.autocomplete(query, limit);
        return NextResponse.json({ completions });
      }

      case 'trending': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const trending = await semanticSearchService.getTrendingQueries(limit);
        return NextResponse.json({ trending });
      }

      case 'recommendations': {
        const authResult = await authenticateRequest(request);
        if (!authResult.success) {
          return NextResponse.json(
            { error: 'Authentication required for recommendations' },
            { status: 401 }
          );
        }

        const limit = parseInt(searchParams.get('limit') || '5');
        const recommendations = await semanticSearchService.getPersonalizedRecommendations(
          authResult.user.id,
          limit
        );
        return NextResponse.json({ recommendations });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}
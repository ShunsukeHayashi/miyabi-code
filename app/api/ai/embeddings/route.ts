/**
 * API Route: Embedding management for AI Course Platform
 * Handles embedding generation, storage, and initialization
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { embeddingService } from '@/lib/ai/embedding-service';
import { authenticateRequest } from '@/lib/auth/middleware';

const embeddingSchema = z.object({
  action: z.enum(['embed_course', 'embed_lesson', 'embed_batch', 'initialize_all']),
  contentId: z.string().uuid().optional(),
  contentIds: z.array(z.string().uuid()).optional(),
  force: z.boolean().default(false), // Force re-embedding existing content
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user - only admins and instructors can manage embeddings
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = embeddingSchema.parse(body);

    const { action, contentId, contentIds, force } = validatedData;

    let result;

    switch (action) {
      case 'embed_course': {
        if (!contentId) {
          return NextResponse.json(
            { error: 'contentId is required for embed_course action' },
            { status: 400 }
          );
        }

        await embeddingService.embedCourse(contentId);
        result = { message: 'Course embedded successfully', courseId: contentId };
        break;
      }

      case 'embed_lesson': {
        if (!contentId) {
          return NextResponse.json(
            { error: 'contentId is required for embed_lesson action' },
            { status: 400 }
          );
        }

        await embeddingService.embedLesson(contentId);
        result = { message: 'Lesson embedded successfully', lessonId: contentId };
        break;
      }

      case 'embed_batch': {
        if (!contentIds || contentIds.length === 0) {
          return NextResponse.json(
            { error: 'contentIds array is required for embed_batch action' },
            { status: 400 }
          );
        }

        const batchResults = {
          successful: [],
          failed: [],
        };

        // Process in parallel with concurrency limit
        const concurrencyLimit = 5;
        for (let i = 0; i < contentIds.length; i += concurrencyLimit) {
          const batch = contentIds.slice(i, i + concurrencyLimit);

          await Promise.allSettled(
            batch.map(async (id) => {
              try {
                // Try to embed as course first, then as lesson
                try {
                  await embeddingService.embedCourse(id);
                  batchResults.successful.push({ id, type: 'course' });
                } catch (courseError) {
                  await embeddingService.embedLesson(id);
                  batchResults.successful.push({ id, type: 'lesson' });
                }
              } catch (error) {
                batchResults.failed.push({ id, error: error.message });
              }
            })
          );
        }

        result = {
          message: 'Batch embedding completed',
          results: batchResults,
          total: contentIds.length,
          successful: batchResults.successful.length,
          failed: batchResults.failed.length,
        };
        break;
      }

      case 'initialize_all': {
        // This is a heavy operation - return immediately and process in background
        // In a production environment, this should be queued as a background job

        // Run initialization in the background
        embeddingService.initializeExistingContent()
          .then(() => {
            console.log('Embedding initialization completed successfully');
          })
          .catch((error) => {
            console.error('Embedding initialization failed:', error);
          });

        result = {
          message: 'Embedding initialization started',
          note: 'This process will run in the background. Check the server logs for progress.',
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    console.error('Embedding API error:', error);
    return NextResponse.json(
      {
        error: 'Embedding operation failed',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats': {
        // Get embedding statistics
        const stats = await embeddingService.prisma.$queryRaw`
          SELECT
            content_type,
            COUNT(*) as count,
            MAX(created_at) as last_updated
          FROM content_embeddings
          GROUP BY content_type
        `;

        return NextResponse.json({
          success: true,
          data: { embeddingStats: stats },
        });
      }

      case 'check': {
        const contentType = searchParams.get('type');
        const contentId = searchParams.get('id');

        if (!contentType || !contentId) {
          return NextResponse.json(
            { error: 'Both type and id parameters are required' },
            { status: 400 }
          );
        }

        const embedding = await embeddingService.prisma.contentEmbedding.findUnique({
          where: {
            contentType_contentId: {
              contentType,
              contentId,
            }
          },
          select: {
            id: true,
            model: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            exists: !!embedding,
            embedding: embedding || null,
          },
        });
      }

      default: {
        // Default: return embedding overview
        const totalEmbeddings = await embeddingService.prisma.contentEmbedding.count();
        const recentSearches = await embeddingService.prisma.searchQuery.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            }
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            totalEmbeddings,
            recentSearches,
            status: 'active',
            model: 'text-embedding-3-large',
          },
        });
      }
    }

  } catch (error) {
    console.error('Embedding GET API error:', error);
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}
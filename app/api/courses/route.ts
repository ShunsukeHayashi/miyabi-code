/**
 * Course Management API - List and Create
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/courses - List courses with filters/pagination
 * POST /api/courses - Create new course (instructor only)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-error';
import {
  parseQuery,
  parseBody,
  createSuccessResponse,
  calculatePagination,
  buildWhereClause,
  withRoles,
  handleOptions
} from '@/lib/api-utils';
import {
  CourseQuerySchema,
  CreateCourseSchema,
  type CourseQuery,
  type CreateCourseInput
} from '@/lib/validation-schemas';

/**
 * GET /api/courses
 * List courses with filters and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const query: CourseQuery = parseQuery(request, CourseQuerySchema);

  const where = buildWhereClause({
    status: query.status || 'PUBLISHED', // Default to published courses
    level: query.level,
    featured: query.featured,
    creatorId: query.creatorId,
    q: query.q, // Search query
  });

  // Add category filter if specified
  if (query.category) {
    where.categories = {
      some: {
        category: {
          slug: query.category,
        },
      },
    };
  }

  const skip = (query.page - 1) * query.limit;

  // Get total count for pagination
  const total = await db.course.count({ where });

  // Get courses
  const courses = await db.course.findMany({
    where,
    skip,
    take: query.limit,
    orderBy: query.sortBy ? { [query.sortBy]: query.sortOrder } : { createdAt: query.sortOrder },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true,
          reviews: true,
        },
      },
    },
  });

  // Transform data for response
  const transformedCourses = courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    status: course.status,
    level: course.level,
    language: course.language,
    estimatedTime: course.estimatedTime,
    price: course.price,
    featured: course.featured,
    slug: course.slug,
    tags: course.tags,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    publishedAt: course.publishedAt,
    creator: course.creator,
    categories: course.categories.map(cc => cc.category),
    stats: {
      lessonsCount: course._count.lessons,
      enrollmentsCount: course._count.enrollments,
      reviewsCount: course._count.reviews,
    },
  }));

  const pagination = calculatePagination(total, query.page, query.limit);

  return createSuccessResponse(transformedCourses, { pagination });
});

/**
 * POST /api/courses
 * Create new course (instructor only)
 */
export const POST = withRoles(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  withErrorHandling(async (user, request: NextRequest) => {
    const input: CreateCourseInput = await parseBody(request, CreateCourseSchema);

    // Check if slug is unique
    const existingCourse = await db.course.findUnique({
      where: { slug: input.slug },
    });

    if (existingCourse) {
      throw new Error('Course with this slug already exists');
    }

    // Create course
    const course = await db.course.create({
      data: {
        ...input,
        creatorId: user.id,
        status: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'PUBLISHED' : 'DRAFT',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Create course categories if specified
    if (input.categories && input.categories.length > 0) {
      await db.courseCategory.createMany({
        data: input.categories.map(categoryId => ({
          courseId: course.id,
          categoryId,
        })),
      });

      // Fetch updated course with categories
      const updatedCourse = await db.course.findUnique({
        where: { id: course.id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      return createSuccessResponse(updatedCourse);
    }

    return createSuccessResponse(course);
  })
);

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
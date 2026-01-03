/**
 * Course Management API - Single Course Operations
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/courses/[id] - Get course details
 * PUT /api/courses/[id] - Update course (instructor only)
 * DELETE /api/courses/[id] - Delete course (admin only)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import { canManageCourse } from '@/lib/auth';
import {
  parseBody,
  createSuccessResponse,
  withAuth,
  withRoles,
  handleOptions
} from '@/lib/api-utils';
import {
  UpdateCourseSchema,
  type UpdateCourseInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/courses/[id]
 * Get course details
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;

  const course = await db.course.findUnique({
    where: { id: courseId },
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
      lessons: {
        where: { OR: [{ isPreview: true }, { type: 'TEXT' }] }, // Only preview lessons for non-enrolled users
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          order: true,
          type: true,
          isPreview: true,
        },
        orderBy: { order: 'asc' },
      },
      instructors: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      },
      prerequisites: {
        include: {
          prerequisiteCourse: {
            select: {
              id: true,
              title: true,
              slug: true,
              level: true,
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

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Get average rating
  const ratingStats = await db.courseReview.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Transform response
  const transformedCourse = {
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
    metaTitle: course.metaTitle,
    metaDescription: course.metaDescription,
    tags: course.tags,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    publishedAt: course.publishedAt,
    creator: course.creator,
    categories: course.categories.map(cc => cc.category),
    lessons: course.lessons,
    instructors: course.instructors.map(ci => ({
      role: ci.role,
      permissions: ci.permissions,
      user: ci.user,
    })),
    prerequisites: course.prerequisites.map(cp => cp.prerequisiteCourse),
    stats: {
      lessonsCount: course._count.lessons,
      enrollmentsCount: course._count.enrollments,
      reviewsCount: course._count.reviews,
      averageRating: ratingStats._avg.rating || 0,
    },
  };

  return createSuccessResponse(transformedCourse);
});

/**
 * PUT /api/courses/[id]
 * Update course (creator or admin only)
 */
export const PUT = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const input: UpdateCourseInput = await parseBody(request, UpdateCourseSchema);

  // Check if course exists
  const existingCourse = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, creatorId: true },
  });

  if (!existingCourse) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, existingCourse.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Update course
  const course = await db.course.update({
    where: { id: courseId },
    data: {
      ...input,
      updatedAt: new Date(),
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

  return createSuccessResponse(course);
}));

/**
 * DELETE /api/courses/[id]
 * Delete course (admin only)
 */
export const DELETE = withRoles(['ADMIN', 'SUPER_ADMIN'],
  withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
    const courseId = params.id;

    // Check if course exists
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, enrollments: { select: { id: true } } },
    });

    if (!existingCourse) {
      throw APIErrors.COURSE_NOT_FOUND;
    }

    // Check if course has enrollments
    if (existingCourse.enrollments.length > 0) {
      throw new Error('Cannot delete course with existing enrollments. Archive it instead.');
    }

    // Delete course (cascade will handle related records)
    await db.course.delete({
      where: { id: courseId },
    });

    return createSuccessResponse({
      message: `Course "${existingCourse.title}" deleted successfully`,
      deletedAt: new Date().toISOString(),
    });
  })
);

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
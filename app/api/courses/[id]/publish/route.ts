/**
 * Course Publishing Workflow API
 * Issue #1298: Course Management REST API Implementation
 *
 * PUT /api/courses/[id]/publish - Publish/unpublish course
 * POST /api/courses/[id]/publish - Submit course for review
 * GET /api/courses/[id]/publish - Get publishing status and requirements
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import { canManageCourse } from '@/lib/auth';
import {
  parseBody,
  createSuccessResponse,
  withAuth,
  handleOptions
} from '@/lib/api-utils';
import {
  PublishCourseSchema,
  type PublishCourseInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/courses/[id]/publish
 * Get course publishing status and requirements
 */
export const GET = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;

  // Check if course exists and user has access
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
      lessons: {
        select: {
          id: true,
          title: true,
          type: true,
          duration: true,
        },
      },
      categories: {
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true,
        },
      },
    },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Check permissions (course creator, instructors, or admin can view)
  const isInstructor = await db.courseInstructor.findFirst({
    where: {
      courseId,
      userId: user.id,
    },
  });

  if (!canManageCourse(user, course.creatorId) && !isInstructor) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Check publishing requirements
  const requirements = {
    hasTitle: !!course.title && course.title.trim().length > 0,
    hasDescription: !!course.description && course.description.trim().length > 0,
    hasThumbnail: !!course.thumbnail,
    hasCategories: course.categories.length > 0,
    hasLessons: course.lessons.length > 0,
    hasMinimumLessons: course.lessons.length >= 3, // Minimum 3 lessons
    hasVideoContent: course.lessons.some(l => l.type === 'VIDEO' && l.duration && l.duration > 0),
    hasValidPrice: course.price !== null && course.price >= 0,
    hasEstimatedTime: !!course.estimatedTime && course.estimatedTime > 0,
  };

  const allRequirementsMet = Object.values(requirements).every(Boolean);

  // Get publishing history/audit log if needed
  const publishingHistory = await db.courseAudit?.findMany({
    where: {
      courseId,
      action: { in: ['PUBLISHED', 'UNPUBLISHED', 'SUBMITTED_FOR_REVIEW', 'REJECTED'] },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  }) || [];

  const publishingStatus = {
    courseId,
    status: course.status,
    publishedAt: course.publishedAt,
    canPublish: allRequirementsMet,
    requirements,
    missingRequirements: Object.entries(requirements)
      .filter(([_, met]) => !met)
      .map(([requirement, _]) => requirement),
    stats: {
      lessonsCount: course._count.lessons,
      enrollmentsCount: course._count.enrollments,
      totalVideoTime: course.lessons
        .filter(l => l.type === 'VIDEO' && l.duration)
        .reduce((acc, l) => acc + (l.duration || 0), 0),
    },
    history: publishingHistory,
  };

  return createSuccessResponse(publishingStatus);
}));

/**
 * PUT /api/courses/[id]/publish
 * Publish or unpublish course (creator/admin only)
 */
export const PUT = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const input: PublishCourseInput = await parseBody(request, PublishCourseSchema);

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        select: { id: true, type: true, duration: true },
      },
      categories: {
        select: { id: true },
      },
    },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // If publishing, validate requirements
  if (input.action === 'PUBLISH') {
    const validationErrors: string[] = [];

    if (!course.title || course.title.trim().length === 0) {
      validationErrors.push('Course title is required');
    }

    if (!course.description || course.description.trim().length === 0) {
      validationErrors.push('Course description is required');
    }

    if (!course.thumbnail) {
      validationErrors.push('Course thumbnail is required');
    }

    if (course.categories.length === 0) {
      validationErrors.push('At least one category is required');
    }

    if (course.lessons.length === 0) {
      validationErrors.push('At least one lesson is required');
    }

    if (course.lessons.length < 3) {
      validationErrors.push('Minimum 3 lessons are required for publishing');
    }

    const hasVideoContent = course.lessons.some(l => l.type === 'VIDEO' && l.duration && l.duration > 0);
    if (!hasVideoContent) {
      validationErrors.push('At least one video lesson with duration is required');
    }

    if (course.price === null || course.price < 0) {
      validationErrors.push('Valid price (including 0 for free) is required');
    }

    if (!course.estimatedTime || course.estimatedTime <= 0) {
      validationErrors.push('Estimated completion time is required');
    }

    if (validationErrors.length > 0) {
      throw new Error(`Cannot publish course: ${validationErrors.join(', ')}`);
    }
  }

  // Update course status
  const updateData: any = {};
  let message = '';
  let auditAction = '';

  switch (input.action) {
    case 'PUBLISH':
      updateData.status = 'PUBLISHED';
      updateData.publishedAt = new Date();
      message = 'Course published successfully';
      auditAction = 'PUBLISHED';
      break;

    case 'UNPUBLISH':
      // Check if course has active enrollments
      const activeEnrollments = await db.enrollment.count({
        where: {
          courseId,
          status: 'ACTIVE',
        },
      });

      if (activeEnrollments > 0) {
        throw new Error(`Cannot unpublish course with ${activeEnrollments} active enrollments. Archive the course instead.`);
      }

      updateData.status = 'DRAFT';
      updateData.publishedAt = null;
      message = 'Course unpublished successfully';
      auditAction = 'UNPUBLISHED';
      break;

    case 'ARCHIVE':
      updateData.status = 'ARCHIVED';
      message = 'Course archived successfully';
      auditAction = 'ARCHIVED';
      break;

    default:
      throw new Error('Invalid action. Use PUBLISH, UNPUBLISH, or ARCHIVE');
  }

  // Update course
  const updatedCourse = await db.course.update({
    where: { id: courseId },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  // Create audit log entry
  try {
    await db.courseAudit?.create({
      data: {
        courseId,
        userId: user.id,
        action: auditAction,
        details: input.reason || `Course ${input.action.toLowerCase()}ed`,
        metadata: {
          previousStatus: course.status,
          newStatus: updateData.status,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    // Audit logging is optional - don't fail the main operation
    console.warn('Failed to create audit log entry:', error);
  }

  return createSuccessResponse({
    course: {
      id: updatedCourse.id,
      title: updatedCourse.title,
      status: updatedCourse.status,
      publishedAt: updatedCourse.publishedAt,
    },
    message,
    action: input.action,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/courses/[id]/publish
 * Submit course for review (if review workflow is enabled)
 */
export const POST = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, creatorId: true, status: true, title: true },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Check if course is in draft status
  if (course.status !== 'DRAFT') {
    throw new Error('Only draft courses can be submitted for review');
  }

  // Update course status to under review
  const updatedCourse = await db.course.update({
    where: { id: courseId },
    data: {
      status: 'UNDER_REVIEW',
      submittedForReviewAt: new Date(),
    },
  });

  // Create audit log entry
  try {
    await db.courseAudit?.create({
      data: {
        courseId,
        userId: user.id,
        action: 'SUBMITTED_FOR_REVIEW',
        details: 'Course submitted for publishing review',
        metadata: {
          previousStatus: course.status,
          newStatus: 'UNDER_REVIEW',
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.warn('Failed to create audit log entry:', error);
  }

  return createSuccessResponse({
    course: {
      id: updatedCourse.id,
      title: updatedCourse.title,
      status: updatedCourse.status,
      submittedForReviewAt: updatedCourse.submittedForReviewAt,
    },
    message: 'Course submitted for review successfully',
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
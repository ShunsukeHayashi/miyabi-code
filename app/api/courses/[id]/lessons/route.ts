/**
 * Course Lessons API
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/courses/[id]/lessons - Get course lessons
 * POST /api/courses/[id]/lessons - Create lesson
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
  CreateLessonSchema,
  type CreateLessonInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/courses/[id]/lessons
 * Get course lessons
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Get lessons
  const lessons = await db.lesson.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      assessments: {
        select: {
          id: true,
          title: true,
          type: true,
          maxScore: true,
        },
      },
      _count: {
        select: {
          assessments: true,
        },
      },
    },
  });

  // Transform response
  const transformedLessons = lessons.map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    duration: lesson.duration,
    order: lesson.order,
    type: lesson.type,
    isPreview: lesson.isPreview,
    attachments: lesson.attachments,
    notes: lesson.notes,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    assessments: lesson.assessments,
    stats: {
      assessmentsCount: lesson._count.assessments,
    },
  }));

  return createSuccessResponse(transformedLessons);
});

/**
 * POST /api/courses/[id]/lessons
 * Create lesson (creator or admin only)
 */
export const POST = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const input: CreateLessonInput = await parseBody(request, CreateLessonSchema);

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, creatorId: true },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Check if lesson order already exists
  const existingLesson = await db.lesson.findFirst({
    where: {
      courseId,
      order: input.order,
    },
  });

  if (existingLesson) {
    throw new Error(`Lesson with order ${input.order} already exists in this course`);
  }

  // Create lesson
  const lesson = await db.lesson.create({
    data: {
      ...input,
      courseId,
    },
    include: {
      assessments: {
        select: {
          id: true,
          title: true,
          type: true,
          maxScore: true,
        },
      },
    },
  });

  return createSuccessResponse(lesson);
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
/**
 * Lesson Management API - Single Lesson Operations
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/lessons/[id] - Get lesson details
 * PUT /api/lessons/[id] - Update lesson
 * DELETE /api/lessons/[id] - Delete lesson
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
  UpdateLessonSchema,
  type UpdateLessonInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/lessons/[id]
 * Get lesson details
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const lessonId = params.id;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          creatorId: true,
          status: true,
        },
      },
      assessments: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          maxScore: true,
          passingScore: true,
          timeLimit: true,
          attempts: true,
        },
      },
      userProgress: {
        select: {
          userId: true,
          completedAt: true,
          timeSpent: true,
        },
      },
    },
  });

  if (!lesson) {
    throw APIErrors.LESSON_NOT_FOUND;
  }

  // Transform response
  const transformedLesson = {
    id: lesson.id,
    courseId: lesson.courseId,
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
    course: lesson.course,
    assessments: lesson.assessments,
    stats: {
      completionsCount: lesson.userProgress.filter(up => up.completedAt).length,
      averageTimeSpent: lesson.userProgress.reduce((acc, up) => acc + (up.timeSpent || 0), 0) / (lesson.userProgress.length || 1),
    },
  };

  return createSuccessResponse(transformedLesson);
});

/**
 * PUT /api/lessons/[id]
 * Update lesson (creator or admin only)
 */
export const PUT = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const lessonId = params.id;
  const input: UpdateLessonInput = await parseBody(request, UpdateLessonSchema);

  // Check if lesson exists and get course info
  const existingLesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        select: { id: true, creatorId: true },
      },
    },
  });

  if (!existingLesson) {
    throw APIErrors.LESSON_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, existingLesson.course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Update lesson
  const lesson = await db.lesson.update({
    where: { id: lessonId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          creatorId: true,
        },
      },
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
 * DELETE /api/lessons/[id]
 * Delete lesson (creator or admin only)
 */
export const DELETE = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const lessonId = params.id;

  // Check if lesson exists and get course info
  const existingLesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        select: { id: true, creatorId: true },
      },
    },
  });

  if (!existingLesson) {
    throw APIErrors.LESSON_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, existingLesson.course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Check if lesson has user progress
  const progressCount = await db.userProgress.count({
    where: { lessonId },
  });

  if (progressCount > 0) {
    throw new Error('Cannot delete lesson with existing user progress. Consider archiving the course instead.');
  }

  // Delete lesson
  await db.lesson.delete({
    where: { id: lessonId },
  });

  return createSuccessResponse({
    message: `Lesson "${existingLesson.title}" deleted successfully`,
    deletedAt: new Date().toISOString(),
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
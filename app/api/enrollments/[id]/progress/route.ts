/**
 * Enrollment Progress API
 * Issue #1298: AI Course API Implementation
 *
 * PUT /api/enrollments/[id]/progress - Update progress
 * GET /api/enrollments/[id]/progress - Get detailed progress
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import {
  parseBody,
  createSuccessResponse,
  withAuth,
  handleOptions
} from '@/lib/api-utils';
import {
  UpdateProgressSchema,
  type UpdateProgressInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/enrollments/[id]/progress
 * Get detailed progress for an enrollment
 */
export const GET = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const enrollmentId = params.id;

  // Check if enrollment exists and user has access
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          lessons: {
            select: {
              id: true,
              title: true,
              order: true,
              duration: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      },
      user: {
        select: { id: true },
      },
    },
  });

  if (!enrollment) {
    throw APIErrors.ENROLLMENT_NOT_FOUND;
  }

  // Users can only view their own progress unless they're admin
  if (user.id !== enrollment.userId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw APIErrors.FORBIDDEN;
  }

  // Get detailed progress for each lesson
  const progressRecords = await db.userProgress.findMany({
    where: {
      userId: enrollment.userId,
      courseId: enrollment.courseId,
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          order: true,
          duration: true,
        },
      },
    },
  });

  // Create progress map
  const progressMap = progressRecords.reduce((acc, p) => {
    if (p.lessonId) {
      acc[p.lessonId] = {
        completedAt: p.completedAt,
        timeSpent: p.timeSpent,
        lastAccessedAt: p.lastAccessedAt,
        bookmarked: p.bookmarked,
        notes: p.notes,
      };
    }
    return acc;
  }, {} as Record<string, any>);

  // Calculate overall progress
  const totalLessons = enrollment.course.lessons.length;
  const completedLessons = progressRecords.filter(p => p.completedAt).length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Create lesson progress array
  const lessonProgress = enrollment.course.lessons.map(lesson => ({
    lesson,
    progress: progressMap[lesson.id] || {
      completedAt: null,
      timeSpent: null,
      lastAccessedAt: null,
      bookmarked: false,
      notes: null,
    },
    isCompleted: !!progressMap[lesson.id]?.completedAt,
  }));

  const response = {
    enrollment: {
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    },
    course: {
      id: enrollment.course.id,
      title: enrollment.course.title,
    },
    overall: {
      progressPercentage,
      completedLessons,
      totalLessons,
      totalTimeSpent: progressRecords.reduce((acc, p) => acc + (p.timeSpent || 0), 0),
    },
    lessons: lessonProgress,
  };

  return createSuccessResponse(response);
}));

/**
 * PUT /api/enrollments/[id]/progress
 * Update progress for a specific lesson
 */
export const PUT = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const enrollmentId = params.id;
  const input: UpdateProgressInput = await parseBody(request, UpdateProgressSchema);

  // Check if enrollment exists and user has access
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        select: {
          id: true,
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw APIErrors.ENROLLMENT_NOT_FOUND;
  }

  if (user.id !== enrollment.userId) {
    throw APIErrors.FORBIDDEN;
  }

  // Validate lesson belongs to course if provided
  if (input.lessonId) {
    const lessonExists = enrollment.course.lessons.some(l => l.id === input.lessonId);
    if (!lessonExists) {
      throw APIErrors.LESSON_NOT_FOUND;
    }
  }

  // Update or create progress record
  const progressData: any = {
    userId: user.id,
    courseId: enrollment.courseId,
    lessonId: input.lessonId,
    lastAccessedAt: new Date(),
  };

  if (input.completedAt) {
    progressData.completedAt = new Date(input.completedAt);
  }

  if (input.timeSpent !== undefined) {
    progressData.timeSpent = input.timeSpent;
  }

  if (input.bookmarked !== undefined) {
    progressData.bookmarked = input.bookmarked;
  }

  if (input.notes !== undefined) {
    progressData.notes = input.notes;
  }

  const progress = await db.userProgress.upsert({
    where: {
      userId_courseId_lessonId: {
        userId: user.id,
        courseId: enrollment.courseId,
        lessonId: input.lessonId || null,
      },
    },
    update: progressData,
    create: progressData,
  });

  // Check if course is completed and update enrollment
  if (input.completedAt && input.lessonId) {
    const totalLessons = enrollment.course.lessons.length;
    const completedLessonsCount = await db.userProgress.count({
      where: {
        userId: user.id,
        courseId: enrollment.courseId,
        completedAt: { not: null },
      },
    });

    // Calculate new progress percentage
    const newProgressPercentage = Math.round((completedLessonsCount / totalLessons) * 100);

    // Update enrollment progress
    const updateData: any = {
      progress: newProgressPercentage,
    };

    // If all lessons are completed, mark enrollment as completed
    if (completedLessonsCount >= totalLessons) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    await db.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
    });

    // Generate certificate if course is completed
    if (completedLessonsCount >= totalLessons) {
      const existingCertificate = await db.certificate.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: enrollment.courseId,
          },
        },
      });

      if (!existingCertificate) {
        await db.certificate.create({
          data: {
            userId: user.id,
            courseId: enrollment.courseId,
            title: `Certificate of Completion`,
            description: `Successfully completed the course`,
            verificationHash: `${user.id}-${enrollment.courseId}-${Date.now()}`,
          },
        });
      }
    }
  }

  return createSuccessResponse({
    progress,
    message: 'Progress updated successfully',
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
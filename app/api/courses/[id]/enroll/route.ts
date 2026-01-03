/**
 * Course Enrollment API
 * Issue #1298: AI Course API Implementation
 *
 * POST /api/courses/[id]/enroll - Enroll in course
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
  EnrollCourseSchema,
  type EnrollCourseInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/courses/[id]/enroll
 * Enroll in course
 */
export const POST = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const input: EnrollCourseInput = await parseBody(request, EnrollCourseSchema);

  // Check if course exists and is published
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      prerequisites: {
        include: {
          prerequisiteCourse: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  if (course.status !== 'PUBLISHED') {
    throw new Error('Course is not available for enrollment');
  }

  // Check if user is already enrolled
  const existingEnrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw APIErrors.ALREADY_ENROLLED;
  }

  // Check prerequisites
  if (course.prerequisites.length > 0) {
    const userCompletedCourses = await db.enrollment.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        courseId: {
          in: course.prerequisites.map(p => p.prerequisiteCourse.id),
        },
      },
    });

    const requiredPrerequisites = course.prerequisites.filter(p => p.required);
    const completedRequiredIds = userCompletedCourses.map(e => e.courseId);
    const missingRequired = requiredPrerequisites.filter(p =>
      !completedRequiredIds.includes(p.prerequisiteCourse.id)
    );

    if (missingRequired.length > 0) {
      throw new Error(`Missing required prerequisites: ${
        missingRequired.map(p => p.prerequisiteCourse.title).join(', ')
      }`);
    }
  }

  // Create enrollment
  const enrollment = await db.enrollment.create({
    data: {
      userId: user.id,
      courseId,
      paymentId: input.paymentId,
      paymentStatus: input.paymentStatus || (course.price && course.price > 0 ? 'PENDING' : 'COMPLETED'),
      amount: input.amount || course.price,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          estimatedTime: true,
          level: true,
        },
      },
    },
  });

  // Create initial course progress entry
  await db.userProgress.create({
    data: {
      userId: user.id,
      courseId,
      lastAccessedAt: new Date(),
    },
  });

  return createSuccessResponse({
    enrollment,
    message: `Successfully enrolled in "${course.title}"`,
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
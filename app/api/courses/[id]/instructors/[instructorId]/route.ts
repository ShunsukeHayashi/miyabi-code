/**
 * Individual Course Instructor Management API
 * Issue #1298: Course Management REST API Implementation
 *
 * PUT /api/courses/[id]/instructors/[instructorId] - Update instructor permissions
 * DELETE /api/courses/[id]/instructors/[instructorId] - Remove instructor from course
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
  UpdateInstructorSchema,
  type UpdateInstructorInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string; instructorId: string };
}

/**
 * PUT /api/courses/[id]/instructors/[instructorId]
 * Update instructor permissions and role (creator or admin only)
 */
export const PUT = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const { id: courseId, instructorId } = params;
  const input: UpdateInstructorInput = await parseBody(request, UpdateInstructorSchema);

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

  // Check if instructor exists for this course
  const existingInstructor = await db.courseInstructor.findUnique({
    where: { id: instructorId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (!existingInstructor || existingInstructor.courseId !== courseId) {
    throw APIErrors.INSTRUCTOR_NOT_FOUND;
  }

  // Validate permissions
  const validPermissions = ['MANAGE_CONTENT', 'MANAGE_LESSONS', 'VIEW_ANALYTICS', 'MANAGE_ENROLLMENTS'];
  const invalidPermissions = input.permissions.filter(p => !validPermissions.includes(p));
  if (invalidPermissions.length > 0) {
    throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
  }

  // Only PRIMARY instructors can have MANAGE_ENROLLMENTS permission
  const newRole = input.role || existingInstructor.role;
  if (newRole === 'ASSISTANT' && input.permissions.includes('MANAGE_ENROLLMENTS')) {
    throw new Error('Assistant instructors cannot have MANAGE_ENROLLMENTS permission');
  }

  // Check if trying to change to PRIMARY when one already exists
  if (input.role === 'PRIMARY' && existingInstructor.role !== 'PRIMARY') {
    const existingPrimary = await db.courseInstructor.findFirst({
      where: {
        courseId,
        role: 'PRIMARY',
        id: { not: instructorId },
      },
    });

    if (existingPrimary) {
      throw new Error('Course already has a primary instructor. Change the current primary instructor to assistant first.');
    }
  }

  // Prevent course creator from removing their own PRIMARY instructor role
  // unless there's another PRIMARY or they're transferring ownership
  if (existingInstructor.userId === course.creatorId &&
      existingInstructor.role === 'PRIMARY' &&
      input.role === 'ASSISTANT') {
    // Allow if there will be another PRIMARY instructor
    const otherPrimary = await db.courseInstructor.findFirst({
      where: {
        courseId,
        role: 'PRIMARY',
        id: { not: instructorId },
      },
    });

    if (!otherPrimary) {
      throw new Error('Course creator cannot be demoted from primary instructor without another primary instructor');
    }
  }

  // Update instructor
  const instructor = await db.courseInstructor.update({
    where: { id: instructorId },
    data: {
      role: input.role,
      permissions: input.permissions,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          role: true,
        },
      },
    },
  });

  return createSuccessResponse({
    instructor,
    message: `${instructor.user.displayName || instructor.user.username} instructor settings updated`,
  });
}));

/**
 * DELETE /api/courses/[id]/instructors/[instructorId]
 * Remove instructor from course (creator or admin only)
 */
export const DELETE = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const { id: courseId, instructorId } = params;

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

  // Check if instructor exists for this course
  const existingInstructor = await db.courseInstructor.findUnique({
    where: { id: instructorId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (!existingInstructor || existingInstructor.courseId !== courseId) {
    throw APIErrors.INSTRUCTOR_NOT_FOUND;
  }

  // Prevent removing the course creator if they're the only PRIMARY instructor
  if (existingInstructor.userId === course.creatorId && existingInstructor.role === 'PRIMARY') {
    const otherPrimary = await db.courseInstructor.findFirst({
      where: {
        courseId,
        role: 'PRIMARY',
        id: { not: instructorId },
      },
    });

    if (!otherPrimary) {
      throw new Error('Cannot remove course creator as primary instructor without another primary instructor');
    }
  }

  // Remove instructor
  await db.courseInstructor.delete({
    where: { id: instructorId },
  });

  return createSuccessResponse({
    message: `${existingInstructor.user.displayName || existingInstructor.user.username} removed as instructor`,
    removedAt: new Date().toISOString(),
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
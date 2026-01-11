/**
 * Course Instructors Management API
 * Issue #1298: Course Management REST API Implementation
 *
 * GET /api/courses/[id]/instructors - Get course instructors
 * POST /api/courses/[id]/instructors - Add instructor to course (creator or admin)
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
  AddInstructorSchema,
  type AddInstructorInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/courses/[id]/instructors
 * Get course instructors
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Get course instructors
  const instructors = await db.courseInstructor.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          role: true,
          isActive: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // PRIMARY first, then ASSISTANT
      { addedAt: 'asc' },
    ],
  });

  // Transform response
  const transformedInstructors = instructors.map(instructor => ({
    id: instructor.id,
    role: instructor.role,
    permissions: instructor.permissions,
    addedAt: instructor.addedAt,
    user: instructor.user,
  }));

  return createSuccessResponse({
    instructors: transformedInstructors,
    course: {
      id: course.id,
      title: course.title,
    },
  });
});

/**
 * POST /api/courses/[id]/instructors
 * Add instructor to course (creator or admin only)
 */
export const POST = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const input: AddInstructorInput = await parseBody(request, AddInstructorSchema);

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, creatorId: true, title: true },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Check permissions
  if (!canManageCourse(user, course.creatorId)) {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Check if user to be added exists and has appropriate role
  const targetUser = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      role: true,
      isActive: true,
    },
  });

  if (!targetUser) {
    throw new Error('User not found');
  }

  if (!targetUser.isActive) {
    throw new Error('Cannot add inactive user as instructor');
  }

  // Only instructors and admins can be added as course instructors
  const allowedRoles = ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'];
  if (!allowedRoles.includes(targetUser.role)) {
    throw new Error('User must be an instructor or admin to be added as course instructor');
  }

  // Check if user is already an instructor for this course
  const existingInstructor = await db.courseInstructor.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: input.userId,
      },
    },
  });

  if (existingInstructor) {
    throw new Error('User is already an instructor for this course');
  }

  // Validate permissions
  const validPermissions = ['MANAGE_CONTENT', 'MANAGE_LESSONS', 'VIEW_ANALYTICS', 'MANAGE_ENROLLMENTS'];
  const invalidPermissions = input.permissions.filter(p => !validPermissions.includes(p));
  if (invalidPermissions.length > 0) {
    throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
  }

  // Only PRIMARY instructors can have MANAGE_ENROLLMENTS permission
  if (input.role === 'ASSISTANT' && input.permissions.includes('MANAGE_ENROLLMENTS')) {
    throw new Error('Assistant instructors cannot have MANAGE_ENROLLMENTS permission');
  }

  // Check if trying to add PRIMARY instructor when one already exists
  if (input.role === 'PRIMARY') {
    const existingPrimary = await db.courseInstructor.findFirst({
      where: {
        courseId,
        role: 'PRIMARY',
      },
    });

    if (existingPrimary) {
      throw new Error('Course already has a primary instructor. Remove the current primary instructor first or add as assistant.');
    }
  }

  // Add instructor
  const instructor = await db.courseInstructor.create({
    data: {
      courseId,
      userId: input.userId,
      role: input.role,
      permissions: input.permissions,
      addedBy: user.id,
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
    message: `${targetUser.displayName || targetUser.username} added as ${input.role.toLowerCase()} instructor`,
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
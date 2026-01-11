/**
 * Individual Course Review Management API
 * Issue #1298: Course Management REST API Implementation
 *
 * GET /api/courses/[id]/reviews/[reviewId] - Get specific review
 * PUT /api/courses/[id]/reviews/[reviewId] - Update review (reviewer only)
 * DELETE /api/courses/[id]/reviews/[reviewId] - Delete review (reviewer or admin)
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
  UpdateReviewSchema,
  type UpdateReviewInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string; reviewId: string };
}

/**
 * GET /api/courses/[id]/reviews/[reviewId]
 * Get specific course review
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id: courseId, reviewId } = params;

  const review = await db.courseReview.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!review || review.courseId !== courseId) {
    throw APIErrors.REVIEW_NOT_FOUND;
  }

  return createSuccessResponse(review);
});

/**
 * PUT /api/courses/[id]/reviews/[reviewId]
 * Update course review (reviewer only)
 */
export const PUT = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const { id: courseId, reviewId } = params;
  const input: UpdateReviewInput = await parseBody(request, UpdateReviewSchema);

  // Check if review exists and belongs to this course
  const existingReview = await db.courseReview.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, courseId: true },
  });

  if (!existingReview || existingReview.courseId !== courseId) {
    throw APIErrors.REVIEW_NOT_FOUND;
  }

  // Check if user owns the review
  if (existingReview.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Update review
  const review = await db.courseReview.update({
    where: { id: reviewId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return createSuccessResponse({
    review,
    message: 'Review updated successfully',
  });
}));

/**
 * DELETE /api/courses/[id]/reviews/[reviewId]
 * Delete course review (reviewer or admin only)
 */
export const DELETE = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const { id: courseId, reviewId } = params;

  // Check if review exists and belongs to this course
  const existingReview = await db.courseReview.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, courseId: true, title: true },
  });

  if (!existingReview || existingReview.courseId !== courseId) {
    throw APIErrors.REVIEW_NOT_FOUND;
  }

  // Check if user owns the review or is admin
  if (existingReview.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw APIErrors.INSUFFICIENT_PERMISSIONS;
  }

  // Delete review
  await db.courseReview.delete({
    where: { id: reviewId },
  });

  return createSuccessResponse({
    message: `Review "${existingReview.title || 'Untitled'}" deleted successfully`,
    deletedAt: new Date().toISOString(),
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
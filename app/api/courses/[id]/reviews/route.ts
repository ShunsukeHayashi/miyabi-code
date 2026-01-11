/**
 * Course Reviews API
 * Issue #1298: Course Management REST API Implementation
 *
 * GET /api/courses/[id]/reviews - Get course reviews
 * POST /api/courses/[id]/reviews - Create review (enrolled users only)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import {
  parseQuery,
  parseBody,
  createSuccessResponse,
  calculatePagination,
  withAuth,
  handleOptions
} from '@/lib/api-utils';
import {
  ReviewQuerySchema,
  CreateReviewSchema,
  type ReviewQuery,
  type CreateReviewInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/courses/[id]/reviews
 * Get course reviews with pagination
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const query: ReviewQuery = parseQuery(request, ReviewQuerySchema);

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  const skip = (query.page - 1) * query.limit;

  // Build where clause
  const where: any = { courseId };

  if (query.rating) {
    where.rating = { gte: query.rating };
  }

  // Get total count for pagination
  const total = await db.courseReview.count({ where });

  // Get reviews
  const reviews = await db.courseReview.findMany({
    where,
    skip,
    take: query.limit,
    orderBy: query.sortBy === 'rating'
      ? { rating: query.sortOrder }
      : query.sortBy === 'helpful'
      ? { helpfulCount: query.sortOrder }
      : { createdAt: query.sortOrder },
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
  });

  // Transform response
  const transformedReviews = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
  }));

  // Calculate rating statistics
  const ratingStats = await db.courseReview.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingDistribution = await db.courseReview.groupBy({
    by: ['rating'],
    where: { courseId },
    _count: { rating: true },
  });

  const pagination = calculatePagination(total, query.page, query.limit);

  return createSuccessResponse({
    reviews: transformedReviews,
    pagination,
    statistics: {
      averageRating: ratingStats._avg.rating || 0,
      totalReviews: ratingStats._count.rating || 0,
      distribution: ratingDistribution.reduce((acc, item) => {
        acc[item.rating] = item._count.rating;
        return acc;
      }, {} as Record<number, number>),
    },
  });
});

/**
 * POST /api/courses/[id]/reviews
 * Create course review (enrolled users only)
 */
export const POST = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const input: CreateReviewInput = await parseBody(request, CreateReviewSchema);

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    throw APIErrors.COURSE_NOT_FOUND;
  }

  // Check if user is enrolled in the course
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error('You must be enrolled in this course to leave a review');
  }

  // Check if user already reviewed this course
  const existingReview = await db.courseReview.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
  });

  if (existingReview) {
    throw new Error('You have already reviewed this course. Use PUT to update your review.');
  }

  // Create review
  const review = await db.courseReview.create({
    data: {
      ...input,
      userId: user.id,
      courseId,
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
    message: 'Review created successfully',
  });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
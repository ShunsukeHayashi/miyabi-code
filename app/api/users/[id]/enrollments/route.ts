/**
 * User Enrollments API
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/users/[id]/enrollments - Get user enrollments
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import {
  parseQuery,
  createSuccessResponse,
  calculatePagination,
  withAuth,
  handleOptions
} from '@/lib/api-utils';
import {
  EnrollmentQuerySchema,
  type EnrollmentQuery
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/users/[id]/enrollments
 * Get user enrollments
 */
export const GET = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const userId = params.id;
  const query: EnrollmentQuery = parseQuery(request, EnrollmentQuerySchema);

  // Users can only view their own enrollments unless they're admin
  if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw APIErrors.FORBIDDEN;
  }

  const where: any = {
    userId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.courseId) {
    where.courseId = query.courseId;
  }

  const skip = (query.page - 1) * query.limit;

  // Get total count
  const total = await db.enrollment.count({ where });

  // Get enrollments
  const enrollments = await db.enrollment.findMany({
    where,
    skip,
    take: query.limit,
    orderBy: query.sortBy ? { [query.sortBy]: query.sortOrder } : { enrolledAt: query.sortOrder },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          level: true,
          estimatedTime: true,
          status: true,
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      },
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

  // Get progress for each enrollment
  const enrollmentIds = enrollments.map(e => e.courseId);
  const progressData = await db.userProgress.groupBy({
    by: ['courseId'],
    where: {
      userId,
      courseId: { in: enrollmentIds },
    },
    _count: {
      lessonId: true,
    },
    _sum: {
      timeSpent: true,
    },
  });

  const progressMap = progressData.reduce((acc, p) => {
    acc[p.courseId] = {
      completedLessons: p._count.lessonId,
      totalTimeSpent: p._sum.timeSpent || 0,
    };
    return acc;
  }, {} as Record<string, any>);

  // Transform response
  const transformedEnrollments = enrollments.map(enrollment => {
    const progress = progressMap[enrollment.courseId] || { completedLessons: 0, totalTimeSpent: 0 };
    const totalLessons = enrollment.course._count.lessons;
    const progressPercentage = totalLessons > 0 ? Math.round((progress.completedLessons / totalLessons) * 100) : 0;

    return {
      id: enrollment.id,
      status: enrollment.status,
      progress: progressPercentage,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      paymentStatus: enrollment.paymentStatus,
      amount: enrollment.amount,
      course: enrollment.course,
      stats: {
        completedLessons: progress.completedLessons,
        totalLessons,
        totalTimeSpent: progress.totalTimeSpent,
        progressPercentage,
      },
    };
  });

  const pagination = calculatePagination(total, query.page, query.limit);

  return createSuccessResponse(transformedEnrollments, { pagination });
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
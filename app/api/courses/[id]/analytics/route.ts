/**
 * Course Analytics API
 * Issue #1298: AI Course API Implementation
 *
 * GET /api/courses/[id]/analytics - Course analytics
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import { canManageCourse } from '@/lib/auth';
import {
  parseQuery,
  createSuccessResponse,
  withAuth,
  handleOptions
} from '@/lib/api-utils';
import {
  AnalyticsQuerySchema,
  type AnalyticsQuery
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/courses/[id]/analytics
 * Get course analytics (creator or admin only)
 */
export const GET = withAuth(withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
  const courseId = params.id;
  const query: AnalyticsQuery = parseQuery(request, AnalyticsQuerySchema);

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

  // Date filters
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  // Basic course statistics
  const [
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    totalLessons,
    averageRating,
    totalRevenue,
  ] = await Promise.all([
    // Total enrollments
    db.enrollment.count({
      where: {
        courseId,
        enrolledAt: startDate ? { gte: startDate, lte: endDate } : undefined,
      },
    }),
    // Active enrollments
    db.enrollment.count({
      where: {
        courseId,
        status: 'ACTIVE',
      },
    }),
    // Completed enrollments
    db.enrollment.count({
      where: {
        courseId,
        status: 'COMPLETED',
        completedAt: startDate ? { gte: startDate, lte: endDate } : undefined,
      },
    }),
    // Total lessons
    db.lesson.count({
      where: { courseId },
    }),
    // Average rating
    db.courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
    }),
    // Total revenue
    db.enrollment.aggregate({
      where: {
        courseId,
        paymentStatus: 'COMPLETED',
        enrolledAt: startDate ? { gte: startDate, lte: endDate } : undefined,
      },
      _sum: { amount: true },
    }),
  ]);

  // Enrollment trends (by day/week/month)
  const enrollmentTrends = await db.enrollment.groupBy({
    by: ['enrolledAt'],
    where: {
      courseId,
      enrolledAt: startDate ? { gte: startDate, lte: endDate } : undefined,
    },
    _count: true,
  });

  // Completion rates by lesson
  const lessonCompletionStats = await db.lesson.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      order: true,
      userProgress: {
        where: {
          completedAt: { not: null },
        },
        select: { id: true },
      },
      _count: {
        select: {
          userProgress: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Student engagement metrics
  const engagementStats = await db.userProgress.aggregate({
    where: { courseId },
    _avg: { timeSpent: true },
    _sum: { timeSpent: true },
  });

  // Top performing lessons (by completion rate)
  const lessonPerformance = lessonCompletionStats.map(lesson => ({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
    },
    totalViews: lesson._count.userProgress,
    completions: lesson.userProgress.length,
    completionRate: lesson._count.userProgress > 0
      ? (lesson.userProgress.length / lesson._count.userProgress) * 100
      : 0,
  })).sort((a, b) => b.completionRate - a.completionRate);

  // Calculate completion rate
  const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

  // Calculate average time to completion
  const completedEnrollmentsWithTime = await db.enrollment.findMany({
    where: {
      courseId,
      status: 'COMPLETED',
      completedAt: { not: null },
    },
    select: {
      enrolledAt: true,
      completedAt: true,
    },
  });

  const averageTimeToCompletion = completedEnrollmentsWithTime.length > 0
    ? completedEnrollmentsWithTime.reduce((acc, enrollment) => {
        const timeDiff = enrollment.completedAt!.getTime() - enrollment.enrolledAt.getTime();
        return acc + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
      }, 0) / completedEnrollmentsWithTime.length
    : 0;

  const analytics = {
    overview: {
      courseId,
      courseTitle: course.title,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalLessons,
      completionRate: Math.round(completionRate * 100) / 100,
      averageRating: averageRating._avg.rating || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      averageTimeToCompletion: Math.round(averageTimeToCompletion * 100) / 100, // days
    },
    engagement: {
      averageTimeSpent: engagementStats._avg.timeSpent || 0, // seconds
      totalTimeSpent: engagementStats._sum.timeSpent || 0, // seconds
      averageSessionTime: totalEnrollments > 0
        ? Math.round((engagementStats._sum.timeSpent || 0) / totalEnrollments)
        : 0,
    },
    trends: {
      enrollmentsByPeriod: enrollmentTrends.map(trend => ({
        date: trend.enrolledAt.toISOString().split('T')[0],
        enrollments: trend._count,
      })),
    },
    lessons: {
      performance: lessonPerformance,
      totalLessons,
      averageCompletionRate: lessonPerformance.length > 0
        ? lessonPerformance.reduce((acc, l) => acc + l.completionRate, 0) / lessonPerformance.length
        : 0,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      period: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    },
  };

  return createSuccessResponse(analytics);
}));

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}
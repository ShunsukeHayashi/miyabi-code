/**
 * API Route: Get course analytics
 * GET /api/analytics/course/[courseId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/analytics-engine';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { courseId } = params;

    // Get course analytics
    const analytics = await analyticsEngine.getCourseAnalytics(courseId);

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Error fetching course analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course analytics' },
      { status: 500 }
    );
  }
}
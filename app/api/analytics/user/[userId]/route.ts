/**
 * API Route: Get user engagement analytics
 * GET /api/analytics/user/[userId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/analytics-engine';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const { userId } = params;
    const requestingUserId = authResult.user.id;

    // Check if user can access this data (own data or admin/instructor)
    if (userId !== requestingUserId && !['admin', 'instructor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access user analytics' },
        { status: 403 }
      );
    }

    // Get user engagement analytics
    const engagement = await analyticsEngine.getUserEngagement(userId);

    return NextResponse.json({
      success: true,
      data: engagement,
    });

  } catch (error) {
    console.error('Error fetching user engagement analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user engagement analytics' },
      { status: 500 }
    );
  }
}
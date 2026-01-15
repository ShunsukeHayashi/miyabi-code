/**
 * API Route: Get platform analytics
 * GET /api/analytics/platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/analytics-engine';
import { authenticateRequest } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user (should be admin/instructor)
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has analytics access (admin/instructor)
    const userRole = authResult.context?.role;
    if (!userRole || !['admin', 'instructor'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for platform analytics' },
        { status: 403 }
      );
    }

    // Get platform analytics
    const analytics = await analyticsEngine.getPlatformAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform analytics' },
      { status: 500 }
    );
  }
}

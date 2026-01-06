/**
 * API Route: Get personalized learning insights
 * GET /api/analytics/insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsEngine } from '@/lib/analytics/analytics-engine';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.context?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Generate personalized learning insights
    const insights = await analyticsEngine.generateLearningInsights(userId);

    return NextResponse.json({
      success: true,
      data: insights,
    });

  } catch (error) {
    console.error('Error generating learning insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning insights' },
      { status: 500 }
    );
  }
}
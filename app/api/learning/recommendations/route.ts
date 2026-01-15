/**
 * API Route: Get personalized learning recommendations
 * GET /api/learning/recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { adaptiveLearningEngine } from '@/lib/learning/adaptive-engine';
import { authenticateRequest } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

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

    const userId = authResult.user.id;

    // Generate personalized recommendations
    const recommendations = await adaptiveLearningEngine.generateRecommendations(userId);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });

  } catch (error) {
    console.error('Error generating learning recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

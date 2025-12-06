import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'not_found', message: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        companyName: analysis.companyName,
        companyUrl: analysis.companyUrl,
        status: analysis.status,
        companyProfile: analysis.companyProfile,
        decisionMakers: analysis.decisionMakers,
        strategy: analysis.strategy,
        deepResearch: analysis.deepResearch,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        completedAt: analysis.completedAt,
        error: analysis.error,
      },
    });
  } catch (error) {
    console.error('[ANALYZE_API] Error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

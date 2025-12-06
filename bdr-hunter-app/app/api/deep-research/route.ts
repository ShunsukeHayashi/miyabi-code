import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getDeepResearchService } from '@/lib/services/deep-research';

export async function POST(request: NextRequest) {
  console.log('[DEEP_RESEARCH_API] Received request');

  try {
    const body = await request.json();
    const { companyName, companyUrl, analysisId } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    console.log(`[DEEP_RESEARCH_API] Starting deep research for: ${companyName}`);

    const deepResearchService = getDeepResearchService();
    const result = await deepResearchService.researchCompany(companyName, companyUrl);

    console.log(`[DEEP_RESEARCH_API] Research complete with ${result.sources.length} sources`);

    // Update analysis if analysisId is provided
    if (analysisId) {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          deepResearch: result as any,
          status: 'completed',
          completedAt: new Date(),
        },
      });
      console.log(`[DEEP_RESEARCH_API] Updated analysis ${analysisId} with deep research`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        sourcesCount: result.sources.length,
        iterations: result.researchMetadata.iterations,
        confidenceScore: result.researchMetadata.confidenceScore,
      },
    });
  } catch (error) {
    console.error('[DEEP_RESEARCH_API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute deep research' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        companyName: true,
        deepResearch: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasDeepResearch: analysis.deepResearch !== null,
      deepResearch: analysis.deepResearch,
      status: analysis.status,
      updatedAt: analysis.updatedAt,
    });
  } catch (error) {
    console.error('[DEEP_RESEARCH_API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deep research' },
      { status: 500 }
    );
  }
}

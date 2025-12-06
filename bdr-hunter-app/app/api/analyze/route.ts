import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getGeminiEnhancedService } from '@/lib/services/gemini-enhanced';
import { getDeepResearchService } from '@/lib/services/deep-research';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, companyUrl } = body;

    // Validation
    if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
      return NextResponse.json(
        { error: 'validation_error', message: 'Company name is required' },
        { status: 400 }
      );
    }

    if (companyUrl && typeof companyUrl === 'string') {
      try {
        new URL(companyUrl);
      } catch {
        return NextResponse.json(
          { error: 'validation_error', message: 'Invalid company URL format' },
          { status: 400 }
        );
      }
    }

    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        companyName: companyName.trim(),
        companyUrl: companyUrl || null,
        status: 'pending',
      },
    });

    // Start async processing
    processAnalysis(analysis.id, companyName.trim(), companyUrl).catch(console.error);

    return NextResponse.json(
      {
        analysisId: analysis.id,
        status: 'pending',
        estimatedCompletionTime: 180,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ANALYZE_API] Error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to create analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          companyName: true,
          companyUrl: true,
          status: true,
          companyProfile: true,
          decisionMakers: true,
          strategy: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    return NextResponse.json({
      analyses,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[ANALYZE_API] Error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

async function processAnalysis(analysisId: string, companyName: string, companyUrl?: string) {
  console.log('[WORKFLOW] Using Gemini Enhanced with Google Search grounding & URL context');

  try {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'processing' },
    });

    const gemini = getGeminiEnhancedService();
    const deepResearch = getDeepResearchService();

    // Stage 1: Company profiling
    console.log(`[WORKFLOW] Stage 1: Profiling company with URL context: ${companyName} at ${companyUrl}`);
    const profile = await gemini.profileCompany(companyName, companyUrl);
    console.log(`[WORKFLOW] Stage 1: Profile complete:`, { industry: profile.industry, size: profile.size, headquarters: profile.headquarters });

    // Stage 2: Decision makers
    console.log('[WORKFLOW] Stage 2: Scouting decision makers...');
    const decisionMakers = await gemini.identifyDecisionMakers(companyName, profile.industry);
    console.log(`[WORKFLOW] Stage 2: Found ${decisionMakers.length} decision makers`);

    // Stage 3: Strategy
    console.log('[WORKFLOW] Stage 3: Generating strategy...');
    const strategy = await gemini.generateBDRStrategy(companyName, profile, decisionMakers);
    console.log('[WORKFLOW] Stage 3: Strategy complete');

    // Stage 4: Deep Research
    console.log(`[WORKFLOW] Stage 4: Starting Deep Research with agentic behavior for ${companyName}`);
    const deepResearchResult = await deepResearch.researchCompany(companyName, companyUrl);
    console.log(`[WORKFLOW] Stage 4: Deep Research complete with ${deepResearchResult.sources.length} sources`);

    // Stage 5: Update analysis
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'completed',
        companyProfile: profile as any,
        decisionMakers: decisionMakers as any,
        strategy: strategy as any,
        deepResearch: deepResearchResult as any,
        completedAt: new Date(),
      },
    });

    console.log(`[WORKFLOW] Stage 5: Analysis complete for ${companyName}`);
  } catch (error) {
    console.error('[WORKFLOW] Error:', error);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

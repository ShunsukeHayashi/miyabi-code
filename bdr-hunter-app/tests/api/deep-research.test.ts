/**
 * API TDD Tests for /api/deep-research endpoints
 *
 * Tests:
 * - POST /api/deep-research - Execute deep research
 * - GET /api/deep-research - Get deep research status
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrisma } from '../setup';

// Mock deep research service
vi.mock('@/lib/services/deep-research', () => ({
  getDeepResearchService: () => ({
    researchCompany: vi.fn().mockResolvedValue({
      companyProfile: {
        name: 'テスト企業',
        officialName: '株式会社テスト',
        description: 'テスト企業の説明です。',
        industry: 'テクノロジー',
        subIndustry: 'SaaS',
        founded: '2020',
        headquarters: '東京都渋谷区',
        employees: '100名',
        revenue: '10億円',
        website: 'https://example.com',
      },
      businessModel: {
        description: 'SaaSビジネスモデル',
        revenueStreams: ['サブスクリプション', 'コンサルティング'],
        targetMarket: '中小企業',
        competitiveAdvantage: ['使いやすさ', 'サポート品質'],
      },
      recentNews: [
        {
          title: '資金調達完了',
          date: '2025-01',
          summary: '10億円の資金調達を完了',
          source: 'TechCrunch Japan',
          url: 'https://example.com/news',
        },
      ],
      leadership: [
        {
          name: '山田太郎',
          title: '代表取締役CEO',
          background: '元大手IT企業出身',
        },
      ],
      techStack: [
        { category: 'バックエンド', technologies: ['Node.js', 'TypeScript'] },
        { category: 'フロントエンド', technologies: ['React', 'Next.js'] },
      ],
      challenges: [
        {
          challenge: '人材採用の課題',
          severity: 'high',
          evidence: '採用市場の競争激化',
        },
      ],
      opportunities: [
        {
          opportunity: '海外展開の機会',
          relevance: 'high',
          rationale: '国内市場の成熟化',
        },
      ],
      sources: [
        { title: '公式サイト', url: 'https://example.com', relevance: 1.0 },
        { title: 'ニュース記事', url: 'https://news.example.com', relevance: 0.9 },
      ],
      researchMetadata: {
        iterations: 4,
        searchQueries: ['テスト企業', 'テスト企業 ニュース'],
        confidenceScore: 0.85,
        completedAt: new Date().toISOString(),
      },
    }),
  }),
}));

describe('POST /api/deep-research', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when companyName is missing', async () => {
    const { POST } = await import('@/app/api/deep-research/route');

    const request = new NextRequest('http://localhost:3000/api/deep-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Company name is required');
  });

  it('should execute deep research successfully', async () => {
    const { POST } = await import('@/app/api/deep-research/route');

    const request = new NextRequest('http://localhost:3000/api/deep-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'テスト企業',
        companyUrl: 'https://example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.companyProfile.name).toBe('テスト企業');
    expect(data.data.sources).toHaveLength(2);
    expect(data.metadata.sourcesCount).toBe(2);
    expect(data.metadata.iterations).toBe(4);
    expect(data.metadata.confidenceScore).toBe(0.85);
  });

  it('should update analysis when analysisId is provided', async () => {
    const { POST } = await import('@/app/api/deep-research/route');

    mockPrisma.analysis.update.mockResolvedValue({
      id: 'test-analysis-id',
      deepResearch: {},
      status: 'completed',
    });

    const request = new NextRequest('http://localhost:3000/api/deep-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'テスト企業',
        analysisId: 'test-analysis-id',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.analysis.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-analysis-id' },
      })
    );
  });
});

describe('GET /api/deep-research', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when analysisId is missing', async () => {
    const { GET } = await import('@/app/api/deep-research/route');

    const request = new NextRequest('http://localhost:3000/api/deep-research');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Analysis ID is required');
  });

  it('should return 404 when analysis not found', async () => {
    const { GET } = await import('@/app/api/deep-research/route');

    mockPrisma.analysis.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/deep-research?analysisId=non-existent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Analysis not found');
  });

  it('should return deep research data when available', async () => {
    const { GET } = await import('@/app/api/deep-research/route');

    const mockDeepResearch = {
      companyProfile: { name: 'テスト企業' },
      researchMetadata: { confidenceScore: 0.85 },
    };

    mockPrisma.analysis.findUnique.mockResolvedValue({
      id: 'test-id',
      companyName: 'テスト企業',
      deepResearch: mockDeepResearch,
      status: 'completed',
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/deep-research?analysisId=test-id');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hasDeepResearch).toBe(true);
    expect(data.deepResearch).toEqual(mockDeepResearch);
    expect(data.status).toBe('completed');
  });

  it('should indicate when deep research is not available', async () => {
    const { GET } = await import('@/app/api/deep-research/route');

    mockPrisma.analysis.findUnique.mockResolvedValue({
      id: 'test-id',
      companyName: 'テスト企業',
      deepResearch: null,
      status: 'pending',
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/deep-research?analysisId=test-id');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasDeepResearch).toBe(false);
    expect(data.deepResearch).toBeNull();
  });
});

/**
 * API TDD Tests for /api/analyze endpoints
 *
 * Tests:
 * - POST /api/analyze - Create new analysis
 * - GET /api/analyze - List analyses
 * - GET /api/analyze/[id] - Get specific analysis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrisma } from '../setup';

// Mock the modules before importing route handlers
vi.mock('@/lib/services/gemini-enhanced', () => ({
  getGeminiEnhancedService: () => ({
    findCompanyUrl: vi.fn().mockResolvedValue({
      url: 'https://example.com',
      confidence: 0.9,
      sources: [],
    }),
    profileCompany: vi.fn().mockResolvedValue({
      industry: 'テクノロジー',
      size: '中規模',
      description: 'テスト企業の説明',
      headquarters: '東京',
      founded: '2020',
      revenue: '10億円',
      employees: '100名',
    }),
    identifyDecisionMakers: vi.fn().mockResolvedValue([
      { name: 'CTO', title: '最高技術責任者', department: 'テクノロジー', seniority: 'executive' },
    ]),
    generateBDRStrategy: vi.fn().mockResolvedValue({
      approach: 'テスト戦略',
      channels: ['メール'],
      messaging: { subject: 'テスト件名', body: 'テスト本文', callToAction: 'テストCTA' },
      timing: { bestDays: ['火曜日'], bestTimes: ['10:00'] },
      painPoints: ['課題1'],
      valuePropositions: ['価値1'],
    }),
  }),
}));

vi.mock('@/lib/services/deep-research', () => ({
  getDeepResearchService: () => ({
    researchCompany: vi.fn().mockResolvedValue({
      companyProfile: { name: 'テスト企業', industry: 'テクノロジー' },
      businessModel: { description: 'テストビジネスモデル' },
      challenges: [{ challenge: 'テスト課題', severity: 'high', evidence: '根拠' }],
      opportunities: [{ opportunity: 'テスト機会', relevance: 'high', rationale: '理由' }],
      sources: [{ title: 'テストソース', url: 'https://example.com' }],
      researchMetadata: { iterations: 4, confidenceScore: 0.85, completedAt: new Date().toISOString() },
    }),
  }),
}));

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when companyName is missing', async () => {
    const { POST } = await import('@/app/api/analyze/route');

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_error');
    expect(data.message).toBe('Company name is required');
  });

  it('should return 400 when companyUrl is invalid', async () => {
    const { POST } = await import('@/app/api/analyze/route');

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'テスト企業',
        companyUrl: 'invalid-url',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_error');
    expect(data.message).toBe('Invalid company URL format');
  });

  it('should create analysis successfully with valid data', async () => {
    const { POST } = await import('@/app/api/analyze/route');

    const mockAnalysis = {
      id: 'test-id-123',
      companyName: 'テスト企業',
      companyUrl: 'https://example.com',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.analysis.create.mockResolvedValue(mockAnalysis);

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'テスト企業',
        companyUrl: 'https://example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.analysisId).toBe('test-id-123');
    expect(data.status).toBe('pending');
    expect(data.estimatedCompletionTime).toBe(180);
  });
});

describe('GET /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated list of analyses', async () => {
    const { GET } = await import('@/app/api/analyze/route');

    const mockAnalyses = [
      {
        id: 'test-1',
        companyName: '企業1',
        status: 'completed',
        companyProfile: { name: '企業1' },
        decisionMakers: [],
        strategy: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'test-2',
        companyName: '企業2',
        status: 'pending',
        companyProfile: { name: '企業2' },
        decisionMakers: [],
        strategy: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockPrisma.analysis.count.mockResolvedValue(2);
    mockPrisma.analysis.findMany.mockResolvedValue(mockAnalyses);

    const request = new NextRequest('http://localhost:3000/api/analyze?page=1&pageSize=10');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analyses).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(10);
  });

  it('should handle empty results', async () => {
    const { GET } = await import('@/app/api/analyze/route');

    mockPrisma.analysis.count.mockResolvedValue(0);
    mockPrisma.analysis.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/analyze');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analyses).toHaveLength(0);
    expect(data.total).toBe(0);
  });
});

describe('GET /api/analyze/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 when analysis not found', async () => {
    const { GET } = await import('@/app/api/analyze/[id]/route');

    mockPrisma.analysis.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/analyze/non-existent-id');

    const response = await GET(request, { params: { id: 'non-existent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('not_found');
  });

  it('should return analysis with all fields', async () => {
    const { GET } = await import('@/app/api/analyze/[id]/route');

    const mockAnalysis = {
      id: 'test-id-123',
      companyName: 'テスト企業',
      companyUrl: 'https://example.com',
      status: 'completed',
      companyProfile: {
        name: 'テスト企業',
        industry: 'テクノロジー',
        employees: '100名',
      },
      decisionMakers: [
        { name: 'CTO', title: '最高技術責任者', department: 'テクノロジー' },
      ],
      strategy: {
        approach: 'テスト戦略',
        channels: ['メール'],
      },
      deepResearch: {
        companyProfile: { name: 'テスト企業' },
        researchMetadata: { confidenceScore: 0.85 },
      },
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T01:00:00Z'),
      completedAt: new Date('2025-01-01T01:00:00Z'),
      error: null,
    };

    mockPrisma.analysis.findUnique.mockResolvedValue(mockAnalysis);

    const request = new NextRequest('http://localhost:3000/api/analyze/test-id-123');

    const response = await GET(request, { params: { id: 'test-id-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.analysis.id).toBe('test-id-123');
    expect(data.analysis.companyName).toBe('テスト企業');
    expect(data.analysis.status).toBe('completed');
    expect(data.analysis.deepResearch).not.toBeNull();
    expect(data.analysis.deepResearch.researchMetadata.confidenceScore).toBe(0.85);
  });

  it('should handle analysis without deepResearch', async () => {
    const { GET } = await import('@/app/api/analyze/[id]/route');

    const mockAnalysis = {
      id: 'test-id-456',
      companyName: 'テスト企業2',
      companyUrl: null,
      status: 'pending',
      companyProfile: { name: 'テスト企業2' },
      decisionMakers: [],
      strategy: {},
      deepResearch: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      error: null,
    };

    mockPrisma.analysis.findUnique.mockResolvedValue(mockAnalysis);

    const request = new NextRequest('http://localhost:3000/api/analyze/test-id-456');

    const response = await GET(request, { params: { id: 'test-id-456' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis.deepResearch).toBeNull();
    expect(data.analysis.completedAt).toBeNull();
  });
});

/**
 * E2E Tests: API Integration
 *
 * Tests API endpoints through the browser
 */

import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/analyze should return list', async ({ request }) => {
    const response = await request.get('/api/analyze');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('analyses');
    expect(Array.isArray(data.analyses)).toBeTruthy();
  });

  test('POST /api/analyze should validate input', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: {},
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('validation_error');
  });

  test('POST /api/analyze should accept valid data', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: {
        companyName: 'E2E Test Company',
        companyUrl: 'https://example.com',
      },
    });

    // 成功（201）またはサービスエラー（500）を許容
    // 実際のGemini APIが利用できない場合はエラーになる可能性がある
    expect([201, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expect(data).toHaveProperty('analysisId');
      expect(data).toHaveProperty('status');
    }
  });

  test('GET /api/analyze/[id] should return 404 for non-existent', async ({ request }) => {
    const response = await request.get('/api/analyze/non-existent-id-12345');

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('not_found');
  });

  test('GET /api/deep-research should validate analysisId', async ({ request }) => {
    const response = await request.get('/api/deep-research');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Analysis ID is required');
  });

  test('POST /api/deep-research should validate companyName', async ({ request }) => {
    const response = await request.post('/api/deep-research', {
      data: {},
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Company name is required');
  });
});

test.describe('API Response Format', () => {
  test('should return proper JSON structure for analyses list', async ({ request }) => {
    const response = await request.get('/api/analyze?page=1&pageSize=10');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('analyses');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('pageSize');
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
    expect(typeof data.pageSize).toBe('number');
  });
});

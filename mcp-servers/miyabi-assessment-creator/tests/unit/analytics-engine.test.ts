/**
 * Simplified Analytics Engine Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsEngine } from '../../src/lib/analytics-engine.js';

// Mock Gemini Client
vi.mock('../../src/lib/gemini-client.js', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    generateStructuredContent: vi.fn().mockResolvedValue({
      insights: ['Test insight'],
      recommendations: ['Test recommendation']
    }),
    validateConnection: vi.fn().mockResolvedValue(true),
    getModelInfo: vi.fn().mockReturnValue({ model: 'test-model' })
  }))
}));

describe('AnalyticsEngine (Simplified)', () => {
  let analytics: AnalyticsEngine;

  beforeEach(() => {
    analytics = new AnalyticsEngine('test-api-key');
  });

  describe('Basic Operations', () => {
    it('should initialize correctly', () => {
      expect(analytics).toBeDefined();
    });

    it('should validate connection', async () => {
      const result = await analytics.validateConnection();
      expect(result).toBe(true);
    });

    it('should return engine information', () => {
      const info = analytics.getEngineInfo();
      expect(info.name).toBe('AnalyticsEngine');
      expect(info.version).toBe('1.0.0');
    });
  });
});
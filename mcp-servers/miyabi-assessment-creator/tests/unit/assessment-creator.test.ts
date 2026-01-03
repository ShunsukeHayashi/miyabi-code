/**
 * Simplified AssessmentCreator Agent Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessmentCreatorAgent } from '../../src/agents/assessment-creator.js';
import { AssessmentInput } from '../../src/types/index.js';

// Mock dependencies
vi.mock('../../src/lib/gemini-client.js', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    validateConnection: vi.fn().mockResolvedValue(true),
    getModelInfo: vi.fn().mockReturnValue({ model: 'test-model' })
  }))
}));

vi.mock('../../src/lib/question-generator.js', () => ({
  QuestionGenerator: vi.fn().mockImplementation(() => ({
    validateConnection: vi.fn().mockResolvedValue(true),
    getGeneratorInfo: vi.fn().mockReturnValue({
      name: 'QuestionGenerator',
      version: '1.0.0'
    })
  }))
}));

vi.mock('../../src/lib/auto-grader.js', () => ({
  AutoGrader: vi.fn().mockImplementation(() => ({
    validateConnection: vi.fn().mockResolvedValue(true),
    getGraderInfo: vi.fn().mockReturnValue({
      name: 'AutoGrader',
      version: '1.0.0'
    })
  }))
}));

vi.mock('../../src/lib/analytics-engine.js', () => ({
  AnalyticsEngine: vi.fn().mockImplementation(() => ({
    validateConnection: vi.fn().mockResolvedValue(true),
    getEngineInfo: vi.fn().mockReturnValue({
      name: 'AnalyticsEngine',
      version: '1.0.0'
    })
  }))
}));

describe('AssessmentCreatorAgent (Simplified)', () => {
  let creator: AssessmentCreatorAgent;

  beforeEach(() => {
    creator = new AssessmentCreatorAgent('test-api-key');
  });

  describe('Basic Operations', () => {
    it('should initialize correctly', () => {
      expect(creator).toBeDefined();
    });

    it('should validate connections', async () => {
      const result = await creator.validateConnections();
      expect(result.questionGenerator).toBe(true);
      expect(result.autoGrader).toBe(true);
      expect(result.analyticsEngine).toBe(true);
      expect(result.geminiClient).toBe(true);
    });

    it('should return agent information', () => {
      const info = creator.getAgentInfo();
      expect(info.name).toBe('AssessmentCreatorAgent');
      expect(info.version).toBe('1.0.0');
      expect(info.capabilities).toContain('Intelligent assessment generation');
    });
  });
});
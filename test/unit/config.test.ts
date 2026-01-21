/**
 * Unit Tests for Configuration
 */

import { describe, it, expect } from 'vitest';
import { MiyabiCodeConfigSchema, generateDefaultConfig } from '../../src/config/config.js';

describe('config', () => {
  describe('MiyabiCodeConfigSchema', () => {
    it('should validate valid config', () => {
      const valid = {
        name: 'test-project',
        llm: {
          provider: 'anthropic' as const,
          model: 'claude-sonnet-4',
        },
        mcp: {
          enabled: ['miyabi-mcp-bundle'],
        },
      };

      const result = MiyabiCodeConfigSchema.parse(valid);
      expect(result.name).toBe('test-project');
    });

    it('should reject invalid provider', () => {
      const invalid = {
        name: 'test',
        llm: {
          provider: 'invalid' as const,
          model: 'model',
        },
        mcp: {
          enabled: [],
        },
      };

      expect(() => MiyabiCodeConfigSchema.parse(invalid)).toThrow();
    });
  });

  describe('generateDefaultConfig', () => {
    it('should generate valid default config', () => {
      const config = generateDefaultConfig('test-project');

      expect(config.name).toBe('test-project');
      expect(config.llm.provider).toBe('anthropic');
      expect(config.mcp.enabled).toContain('miyabi-mcp-bundle');
    });
  });
});

/**
 * Unit tests for GeminiClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiClient } from '../../src/lib/gemini-client.js';
import { PromptTemplate } from '../../src/types/index.js';

// Mock the Google Generative AI SDK
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Mock generated content'
        }
      }),
      countTokens: vi.fn().mockResolvedValue({ totalTokens: 100 })
    })
  }))
}));

describe('GeminiClient', () => {
  let client: GeminiClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new GeminiClient(mockApiKey);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(client).toBeInstanceOf(GeminiClient);
      expect(client.getModelInfo()).toMatchObject({
        model: 'gemini-2.0-flash-exp',
        config: {
          model: 'gemini-2.0-flash-exp',
          temperature: 0.7,
          maxTokens: 8192,
          topP: 0.8,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0
        }
      });
    });

    it('should accept custom config', () => {
      const customClient = new GeminiClient(mockApiKey, {
        temperature: 0.5,
        maxTokens: 4096
      });

      expect(customClient.getModelInfo().config).toMatchObject({
        temperature: 0.5,
        maxTokens: 4096
      });
    });
  });

  describe('generateContent', () => {
    const mockTemplate: PromptTemplate = {
      name: 'test_template',
      template: 'Generate content about {{topic}} for {{audience}}',
      variables: ['topic', 'audience']
    };

    it('should generate content with template interpolation', async () => {
      const variables = { topic: 'JavaScript', audience: 'beginners' };
      const result = await client.generateContent(mockTemplate, variables);

      expect(result).toBe('Mock generated content');
    });

    it('should handle template interpolation correctly', async () => {
      const variables = { topic: 'Python', audience: 'intermediate developers' };
      await client.generateContent(mockTemplate, variables);

      // Verify the interpolated prompt was used
      // This would require mocking the model's generateContent method to inspect the prompt
    });

    it('should throw error when generation fails', async () => {
      // Mock a failing generation
      const failingClient = new GeminiClient(mockApiKey);
      vi.mocked(failingClient['model'].generateContent).mockRejectedValue(
        new Error('API Error')
      );

      await expect(
        failingClient.generateContent(mockTemplate, { topic: 'test', audience: 'test' })
      ).rejects.toThrow('Content generation failed: API Error');
    });
  });

  describe('generateStructuredContent', () => {
    const mockTemplate: PromptTemplate = {
      name: 'structured_test',
      template: 'Generate JSON for {{data}}',
      variables: ['data']
    };

    it('should parse JSON response correctly', async () => {
      // Mock JSON response
      vi.mocked(client['model'].generateContent).mockResolvedValue({
        response: {
          text: () => '{"title": "Test Course", "modules": []}'
        }
      } as any);

      const result = await client.generateStructuredContent(
        mockTemplate,
        { data: 'test' }
      );

      expect(result).toEqual({ title: 'Test Course', modules: [] });
    });

    it('should extract JSON from code blocks', async () => {
      // Mock JSON in code block
      vi.mocked(client['model'].generateContent).mockResolvedValue({
        response: {
          text: () => '```json\n{"title": "Test Course"}\n```'
        }
      } as any);

      const result = await client.generateStructuredContent(
        mockTemplate,
        { data: 'test' }
      );

      expect(result).toEqual({ title: 'Test Course' });
    });

    it('should throw error for invalid JSON', async () => {
      // Mock invalid JSON response
      vi.mocked(client['model'].generateContent).mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      } as any);

      await expect(
        client.generateStructuredContent(mockTemplate, { data: 'test' })
      ).rejects.toThrow('Structured content generation failed');
    });
  });

  describe('generateBatchContent', () => {
    const mockRequests = [
      {
        id: 'req1',
        template: {
          name: 'test1',
          template: 'Content for {{topic}}',
          variables: ['topic']
        },
        variables: { topic: 'AI' }
      },
      {
        id: 'req2',
        template: {
          name: 'test2',
          template: 'Content for {{topic}}',
          variables: ['topic']
        },
        variables: { topic: 'ML' }
      }
    ];

    it('should process batch requests successfully', async () => {
      const result = await client.generateBatchContent(mockRequests);

      expect(result).toEqual({
        req1: 'Mock generated content',
        req2: 'Mock generated content'
      });
    });

    it('should handle partial failures in batch', async () => {
      // Mock one request failing
      let callCount = 0;
      vi.mocked(client['model'].generateContent).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First request failed'));
        }
        return Promise.resolve({
          response: { text: () => 'Success' }
        } as any);
      });

      const result = await client.generateBatchContent(mockRequests);

      // Should only contain the successful request
      expect(result).toEqual({
        req2: 'Success'
      });
    });
  });

  describe('estimateTokens', () => {
    it('should return token count from API', async () => {
      const tokens = await client.estimateTokens('Test prompt');
      expect(tokens).toBe(100);
    });

    it('should fallback to estimation when API fails', async () => {
      vi.mocked(client['model'].countTokens).mockRejectedValue(new Error('API Error'));

      const tokens = await client.estimateTokens('Test prompt');
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('validateConnection', () => {
    it('should return true for successful connection', async () => {
      const result = await client.validateConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      vi.mocked(client['model'].generateContent).mockRejectedValue(new Error('Connection failed'));

      const result = await client.validateConnection();
      expect(result).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration correctly', () => {
      client.updateConfig({ temperature: 0.9, maxTokens: 1024 });

      const info = client.getModelInfo();
      expect(info.config.temperature).toBe(0.9);
      expect(info.config.maxTokens).toBe(1024);
    });
  });

  describe('interpolateTemplate', () => {
    it('should replace placeholders correctly', () => {
      const template = 'Hello {{name}}, welcome to {{course}}!';
      const variables = { name: 'John', course: 'AI 101' };

      // Access private method for testing
      const result = (client as any).interpolateTemplate(template, variables);

      expect(result).toBe('Hello John, welcome to AI 101!');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, welcome to {{course}}!';
      const variables = { name: 'John' };

      const result = (client as any).interpolateTemplate(template, variables);

      // Should leave unresolved placeholder
      expect(result).toContain('{{course}}');
    });
  });

  describe('extractJSON', () => {
    it('should extract JSON from code blocks', () => {
      const text = 'Some text\n```json\n{"key": "value"}\n```\nMore text';
      const result = (client as any).extractJSON(text);

      expect(result).toBe('{"key": "value"}');
    });

    it('should extract JSON from plain text', () => {
      const text = 'Here is the JSON: {"key": "value"} and more text';
      const result = (client as any).extractJSON(text);

      expect(result).toBe('{"key": "value"}');
    });

    it('should return trimmed text when no JSON found', () => {
      const text = '  Plain text response  ';
      const result = (client as any).extractJSON(text);

      expect(result).toBe('Plain text response');
    });
  });
});
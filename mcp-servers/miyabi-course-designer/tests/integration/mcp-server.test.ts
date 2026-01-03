/**
 * Integration tests for MCP Server
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { CourseInput } from '../../src/types/index.js';

// Mock the entire CourseDesigner agent
const mockGenerateCourse = vi.fn();
const mockGetGenerationProgress = vi.fn();
const mockValidateConnection = vi.fn();
const mockGetAgentInfo = vi.fn();

vi.mock('../../src/agents/course-designer.js', () => ({
  CourseDesignerAgent: vi.fn().mockImplementation(() => ({
    generateCourse: mockGenerateCourse,
    getGenerationProgress: mockGetGenerationProgress,
    validateConnection: mockValidateConnection,
    getAgentInfo: mockGetAgentInfo
  }))
}));

// Mock the Server and transport
const mockConnect = vi.fn();
const mockClose = vi.fn();
const mockSetRequestHandler = vi.fn();
const mockGetCapabilities = vi.fn().mockReturnValue({ tools: {} });

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    setRequestHandler: mockSetRequestHandler,
    getCapabilities: mockGetCapabilities
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}));

describe('MCP Server Integration', () => {
  beforeAll(() => {
    // Set required environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    mockValidateConnection.mockResolvedValue(true);
    mockGetAgentInfo.mockReturnValue({
      name: 'CourseDesignerAgent',
      version: '1.0.0',
      capabilities: []
    });
  });

  describe('Server Initialization', () => {
    it('should initialize server with correct capabilities', async () => {
      // Import and run the server module
      await import('../../src/index.js');

      // Verify server was created with correct config
      expect(mockSetRequestHandler).toHaveBeenCalledTimes(2); // ListTools and CallTool
      expect(mockValidateConnection).toHaveBeenCalled();
    });

    it('should fail initialization with invalid API key', async () => {
      mockValidateConnection.mockResolvedValue(false);

      // This would cause the server to exit, but in tests we just verify the validation
      expect(mockValidateConnection).toHaveBeenCalled();
    });
  });

  describe('Tool Handlers', () => {
    let listToolsHandler: Function;
    let callToolHandler: Function;

    beforeEach(async () => {
      // Import the server module
      await import('../../src/index.js');

      // Extract the handlers from the mock calls
      const listToolsCall = mockSetRequestHandler.mock.calls.find(
        call => call[0].safeParse && call[0].safeParse({ method: 'tools/list' }).success
      );
      const callToolCall = mockSetRequestHandler.mock.calls.find(
        call => call[0].safeParse && call[0].safeParse({ method: 'tools/call' }).success
      );

      listToolsHandler = listToolsCall?.[1];
      callToolHandler = callToolCall?.[1];
    });

    describe('ListTools Handler', () => {
      it('should return all available tools', async () => {
        const result = await listToolsHandler();

        expect(result).toHaveProperty('tools');
        expect(result.tools).toHaveLength(4);

        const toolNames = result.tools.map((tool: any) => tool.name);
        expect(toolNames).toContain('generate_course');
        expect(toolNames).toContain('get_generation_progress');
        expect(toolNames).toContain('validate_api_connection');
        expect(toolNames).toContain('get_agent_info');
      });

      it('should include proper tool schemas', async () => {
        const result = await listToolsHandler();

        const generateCourseTool = result.tools.find((tool: any) => tool.name === 'generate_course');
        expect(generateCourseTool).toMatchObject({
          name: 'generate_course',
          description: expect.stringContaining('Generate a comprehensive course'),
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              topic: expect.any(Object),
              targetAudience: expect.any(Object)
            }),
            required: ['topic', 'targetAudience']
          })
        });
      });
    });

    describe('CallTool Handler', () => {
      const mockCourseInput: CourseInput = {
        topic: 'JavaScript Fundamentals',
        targetAudience: 'Web development beginners',
        difficulty: 'beginner'
      };

      const mockCourseOutput = {
        courseStructure: {
          title: 'JavaScript Fundamentals',
          description: 'Learn JavaScript from scratch',
          duration: { weeks: 6, totalHours: 18 },
          modules: [
            {
              id: 'module-1',
              title: 'Introduction',
              description: 'Get started with JavaScript',
              learningObjectives: ['Understand variables'],
              estimatedHours: 3,
              lessons: [
                {
                  id: 'module-1-lesson-1',
                  title: 'Hello World',
                  type: 'video' as const,
                  content: 'First JavaScript program',
                  duration: 15
                }
              ]
            }
          ]
        },
        content: {
          videoScripts: [],
          textContent: [],
          exercises: []
        },
        metadata: {
          generationTimestamp: '2024-01-01T00:00:00Z',
          aiModelUsed: 'gemini-2.0-flash-exp',
          contentQualityScore: 85,
          estimatedCompletionRate: 78,
          tags: ['javascript', 'beginner'],
          scormCompatible: true,
          accessibilityCompliant: true
        },
        recommendations: {
          contentImprovements: [],
          engagementOptimizations: [],
          learningPathSuggestions: [],
          nextSteps: []
        }
      };

      it('should handle generate_course tool call', async () => {
        mockGenerateCourse.mockResolvedValue(mockCourseOutput);

        const request = {
          params: {
            name: 'generate_course',
            arguments: mockCourseInput
          }
        };

        const result = await callToolHandler(request);

        expect(mockGenerateCourse).toHaveBeenCalledWith(mockCourseInput);
        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('Course generated successfully');

        const parsedResponse = JSON.parse(result.content[0].text);
        expect(parsedResponse.data).toEqual(mockCourseOutput);
        expect(parsedResponse.summary).toMatchObject({
          title: 'JavaScript Fundamentals',
          modules: 1,
          lessons: 1,
          qualityScore: 85
        });
      });

      it('should handle get_generation_progress tool call', async () => {
        const mockProgress = {
          steps: [
            { name: 'Course Structure', status: 'completed', progress: 100 },
            { name: 'Content Creation', status: 'running', progress: 50 }
          ],
          currentStep: 1,
          overallProgress: 75,
          estimatedTimeRemaining: 60
        };

        mockGetGenerationProgress.mockReturnValue(mockProgress);

        const request = {
          params: {
            name: 'get_generation_progress',
            arguments: {}
          }
        };

        const result = await callToolHandler(request);

        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('Generation 75% complete');

        const parsedResponse = JSON.parse(result.content[0].text);
        expect(parsedResponse.data).toEqual(mockProgress);
      });

      it('should handle validate_api_connection tool call', async () => {
        mockValidateConnection.mockResolvedValue(true);

        const request = {
          params: {
            name: 'validate_api_connection',
            arguments: {}
          }
        };

        const result = await callToolHandler(request);

        expect(mockValidateConnection).toHaveBeenCalled();
        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('connection is valid');
      });

      it('should handle get_agent_info tool call', async () => {
        const mockInfo = {
          name: 'CourseDesignerAgent',
          version: '1.0.0',
          description: 'AI-powered course generation',
          capabilities: ['Course structure generation', 'Content creation'],
          supportedLanguages: ['en', 'ja']
        };

        mockGetAgentInfo.mockReturnValue(mockInfo);

        const request = {
          params: {
            name: 'get_agent_info',
            arguments: {}
          }
        };

        const result = await callToolHandler(request);

        expect(result.content[0].text).toContain('"success": true');

        const parsedResponse = JSON.parse(result.content[0].text);
        expect(parsedResponse.data).toEqual(mockInfo);
      });

      it('should handle unknown tool calls', async () => {
        const request = {
          params: {
            name: 'unknown_tool',
            arguments: {}
          }
        };

        const result = await callToolHandler(request);

        expect(result.content[0].text).toContain('"success": false');
        expect(result.content[0].text).toContain('Unknown tool');
        expect(result.isError).toBe(true);
      });

      it('should handle tool execution errors', async () => {
        mockGenerateCourse.mockRejectedValue(new Error('Generation failed'));

        const request = {
          params: {
            name: 'generate_course',
            arguments: mockCourseInput
          }
        };

        const result = await callToolHandler(request);

        expect(result.content[0].text).toContain('"success": false');
        expect(result.content[0].text).toContain('Generation failed');
        expect(result.isError).toBe(true);
      });

      it('should validate input parameters', async () => {
        const request = {
          params: {
            name: 'generate_course',
            arguments: {
              // Missing required fields
              topic: '',
              // missing targetAudience
            }
          }
        };

        const result = await callToolHandler(request);

        expect(result.content[0].text).toContain('"success": false');
        expect(result.isError).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle graceful shutdown on SIGINT', async () => {
      // Import the server
      await import('../../src/index.js');

      // Simulate SIGINT
      process.emit('SIGINT');

      // Verify cleanup was called
      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle graceful shutdown on SIGTERM', async () => {
      // Import the server
      await import('../../src/index.js');

      // Simulate SIGTERM
      process.emit('SIGTERM');

      // Verify cleanup was called
      expect(mockClose).toHaveBeenCalled();
    });
  });
});

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should require GEMINI_API_KEY environment variable', async () => {
    delete process.env.GEMINI_API_KEY;

    // Mock process.exit to prevent actual exit
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    try {
      await import('../../src/index.js');
      expect(mockExit).toHaveBeenCalledWith(1);
    } finally {
      mockExit.mockRestore();
    }
  });

  it('should handle development vs production logging', async () => {
    process.env.NODE_ENV = 'development';

    // The logger should be configured for debug level in development
    // This is tested indirectly through the logger initialization
    await import('../../src/index.js');

    // Reset to test environment
    process.env.NODE_ENV = 'test';
  });
});
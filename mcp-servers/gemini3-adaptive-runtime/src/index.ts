#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { Gemini3Client } from './gemini-client.js';
import { DynamicUIGenerator } from './tools/dynamic-ui-generator.js';
import { ReasoningEngine } from './tools/reasoning-engine.js';
import { CodeExecutor } from './tools/code-executor.js';

/**
 * Gemini 3 Adaptive Runtime MCP Server
 *
 * Based on "The Adaptive Runtime" specification, this MCP server provides:
 * - Dynamic UI generation with React/TypeScript
 * - Deep reasoning with Gemini 3's thinking capabilities
 * - Code generation and execution
 * - Google Search integration
 */
class Gemini3AdaptiveRuntimeServer {
  private server: Server;
  private client: Gemini3Client;
  private uiGenerator: DynamicUIGenerator;
  private reasoningEngine: ReasoningEngine;
  private codeExecutor: CodeExecutor;

  constructor() {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    // Initialize Gemini 3 client
    this.client = new Gemini3Client({
      apiKey,
      model: 'gemini-3-pro-preview',
      thinkingLevel: 'high',
    });

    // Initialize tools
    this.uiGenerator = new DynamicUIGenerator(this.client);
    this.reasoningEngine = new ReasoningEngine(this.client);
    this.codeExecutor = new CodeExecutor(this.client);

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'gemini3-adaptive-runtime',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_dynamic_ui':
            return await this.handleGenerateDynamicUI(args);

          case 'iterate_ui':
            return await this.handleIterateUI(args);

          case 'deep_reasoning':
            return await this.handleDeepReasoning(args);

          case 'compare_options':
            return await this.handleCompareOptions(args);

          case 'analyze_decision':
            return await this.handleAnalyzeDecision(args);

          case 'execute_code':
            return await this.handleExecuteCode(args);

          case 'analyze_code':
            return await this.handleAnalyzeCode(args);

          case 'generate_tests':
            return await this.handleGenerateTests(args);

          case 'solve_algorithm':
            return await this.handleSolveAlgorithm(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      // Dynamic UI Generation Tools
      {
        name: 'generate_dynamic_ui',
        description: 'Generate a dynamic React TypeScript UI component based on user intent. Uses Gemini 3\'s deep thinking to create adaptive, functional UIs with Tailwind CSS and Lucide icons.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'User request describing the desired UI (e.g., "Create a dashboard to compare sales data by region")',
            },
            contextUrls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional URLs to reference for context or data',
            },
            currentScreenState: {
              type: 'object',
              description: 'Optional current UI state for context-aware generation',
            },
            thinkingLevel: {
              type: 'string',
              enum: ['low', 'high'],
              description: 'Thinking depth: "high" for complex UIs (default), "low" for simple ones',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'iterate_ui',
        description: 'Improve an existing UI component based on user feedback. Analyzes the current code and makes targeted improvements.',
        inputSchema: {
          type: 'object',
          properties: {
            originalCode: {
              type: 'string',
              description: 'The current React component code',
            },
            feedback: {
              type: 'string',
              description: 'User feedback describing desired changes',
            },
            thinkingLevel: {
              type: 'string',
              enum: ['low', 'high'],
              description: 'Thinking depth (default: high)',
            },
          },
          required: ['originalCode', 'feedback'],
        },
      },

      // Reasoning Tools
      {
        name: 'deep_reasoning',
        description: 'Perform deep reasoning on complex questions using Gemini 3\'s extended thinking. Provides structured analysis with reasoning steps, conclusions, and confidence levels.',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The question or problem to reason about',
            },
            context: {
              type: 'string',
              description: 'Optional additional context or background information',
            },
            includeAlternatives: {
              type: 'boolean',
              description: 'Whether to include alternative perspectives (default: false)',
            },
            thinkingLevel: {
              type: 'string',
              enum: ['low', 'high'],
              description: 'Thinking depth (default: high)',
            },
          },
          required: ['question'],
        },
      },
      {
        name: 'compare_options',
        description: 'Compare multiple options and provide a reasoned recommendation based on specified criteria.',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The decision question',
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  details: { type: 'string' },
                },
                required: ['name', 'details'],
              },
              description: 'Array of options to compare',
            },
            criteria: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional evaluation criteria',
            },
          },
          required: ['question', 'options'],
        },
      },
      {
        name: 'analyze_decision',
        description: 'Analyze a decision with potential consequences, risks, and opportunities.',
        inputSchema: {
          type: 'object',
          properties: {
            decision: {
              type: 'string',
              description: 'The decision to analyze',
            },
            context: {
              type: 'string',
              description: 'Context and background for the decision',
            },
            timeHorizon: {
              type: 'string',
              description: 'Optional time horizon (e.g., "6 months", "5 years")',
            },
          },
          required: ['decision', 'context'],
        },
      },

      // Code Execution Tools
      {
        name: 'execute_code',
        description: 'Generate and execute code to solve computational tasks. Supports multiple languages and uses Gemini 3\'s code execution capability.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'Description of the task to accomplish with code',
            },
            language: {
              type: 'string',
              description: 'Preferred programming language (optional)',
            },
            context: {
              type: 'string',
              description: 'Optional context, data, or constraints',
            },
            thinkingLevel: {
              type: 'string',
              enum: ['low', 'high'],
              description: 'Thinking depth (default: high)',
            },
          },
          required: ['task'],
        },
      },
      {
        name: 'analyze_code',
        description: 'Analyze existing code for bugs, performance issues, security vulnerabilities, and best practices.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code to analyze',
            },
            language: {
              type: 'string',
              description: 'Programming language',
            },
            analysisGoals: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific analysis goals (optional)',
            },
          },
          required: ['code', 'language'],
        },
      },
      {
        name: 'generate_tests',
        description: 'Generate comprehensive test cases for given code.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code to test',
            },
            language: {
              type: 'string',
              description: 'Programming language',
            },
            testFramework: {
              type: 'string',
              description: 'Optional test framework to use',
            },
          },
          required: ['code', 'language'],
        },
      },
      {
        name: 'solve_algorithm',
        description: 'Solve algorithmic problems with optimal solutions and complexity analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            problem: {
              type: 'string',
              description: 'The algorithmic problem to solve',
            },
            constraints: {
              type: 'string',
              description: 'Optional constraints (e.g., time/space limits)',
            },
            language: {
              type: 'string',
              description: 'Preferred programming language',
            },
          },
          required: ['problem'],
        },
      },
    ];
  }

  // Tool Handlers
  private async handleGenerateDynamicUI(args: any) {
    const response = await this.uiGenerator.generateUI(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleIterateUI(args: any) {
    const response = await this.uiGenerator.iterateUI(
      args.originalCode,
      args.feedback,
      args.thinkingLevel
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleDeepReasoning(args: any) {
    const response = await this.reasoningEngine.reason(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleCompareOptions(args: any) {
    const response = await this.reasoningEngine.compareOptions(
      args.question,
      args.options,
      args.criteria
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleAnalyzeDecision(args: any) {
    const response = await this.reasoningEngine.analyzeDecision(
      args.decision,
      args.context,
      args.timeHorizon
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleExecuteCode(args: any) {
    const response = await this.codeExecutor.executeTask(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleAnalyzeCode(args: any) {
    const response = await this.codeExecutor.analyzeCode(
      args.code,
      args.language,
      args.analysisGoals
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleGenerateTests(args: any) {
    const response = await this.codeExecutor.generateTests(
      args.code,
      args.language,
      args.testFramework
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleSolveAlgorithm(args: any) {
    const response = await this.codeExecutor.solveAlgorithm(
      args.problem,
      args.constraints,
      args.language
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gemini 3 Adaptive Runtime MCP Server running on stdio');
    console.error(`Model: ${this.client.getModelInfo()}`);
  }
}

// Start the server
const server = new Gemini3AdaptiveRuntimeServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

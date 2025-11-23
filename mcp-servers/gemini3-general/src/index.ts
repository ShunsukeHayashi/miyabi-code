#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { Gemini3Client } from './gemini-client.js';

/**
 * General-purpose Gemini 3 MCP Server
 * Provides AI assistance for code generation, analysis, and problem-solving
 */
class Gemini3GeneralServer {
  private server: Server;
  private client: Gemini3Client;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    const model = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
    const thinkingLevel = (process.env.GEMINI_THINKING_LEVEL || 'high') as 'low' | 'medium' | 'high';

    this.client = new Gemini3Client({
      apiKey,
      model,
      thinkingLevel,
    });

    this.server = new Server(
      {
        name: 'gemini3-general',
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_code':
            return await this.handleGenerateCode(args);
          case 'analyze_code':
            return await this.handleAnalyzeCode(args);
          case 'explain_concept':
            return await this.handleExplainConcept(args);
          case 'solve_problem':
            return await this.handleSolveProblem(args);
          case 'generate_text':
            return await this.handleGenerateText(args);
          case 'ask_gemini':
            return await this.handleAskGemini(args);
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
      {
        name: 'generate_code',
        description: 'Generate code in any programming language with Gemini 3 Pro Preview. Supports all major languages and frameworks.',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of what the code should do',
            },
            language: {
              type: 'string',
              description: 'Programming language (e.g., typescript, python, rust, java)',
            },
            context: {
              type: 'string',
              description: 'Optional additional context or requirements',
            },
            includeTests: {
              type: 'boolean',
              description: 'Whether to include unit tests (default: false)',
            },
          },
          required: ['description', 'language'],
        },
      },
      {
        name: 'analyze_code',
        description: 'Analyze code for bugs, performance issues, security vulnerabilities, and best practices.',
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
            focusAreas: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional focus areas (bugs, performance, security, style)',
            },
          },
          required: ['code', 'language'],
        },
      },
      {
        name: 'explain_concept',
        description: 'Explain programming concepts, algorithms, design patterns, or technical topics in detail.',
        inputSchema: {
          type: 'object',
          properties: {
            concept: {
              type: 'string',
              description: 'The concept to explain',
            },
            level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'Target audience level (default: intermediate)',
            },
            includeExamples: {
              type: 'boolean',
              description: 'Whether to include code examples (default: true)',
            },
          },
          required: ['concept'],
        },
      },
      {
        name: 'solve_problem',
        description: 'Solve programming problems, debug issues, or provide solutions to technical challenges.',
        inputSchema: {
          type: 'object',
          properties: {
            problem: {
              type: 'string',
              description: 'Description of the problem',
            },
            code: {
              type: 'string',
              description: 'Optional existing code related to the problem',
            },
            errorMessage: {
              type: 'string',
              description: 'Optional error message if debugging',
            },
          },
          required: ['problem'],
        },
      },
      {
        name: 'generate_text',
        description: 'Generate documentation, README files, technical writing, or any text content.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['documentation', 'readme', 'api-docs', 'tutorial', 'blog-post', 'technical-article'],
              description: 'Type of text to generate',
            },
            topic: {
              type: 'string',
              description: 'Topic or subject',
            },
            context: {
              type: 'string',
              description: 'Optional additional context',
            },
            tone: {
              type: 'string',
              enum: ['professional', 'casual', 'technical', 'beginner-friendly'],
              description: 'Tone of writing (default: professional)',
            },
          },
          required: ['type', 'topic'],
        },
      },
      {
        name: 'ask_gemini',
        description: 'Ask Gemini 3 Pro Preview any question. General-purpose AI assistant for any topic.',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'Your question',
            },
            context: {
              type: 'string',
              description: 'Optional context for the question',
            },
          },
          required: ['question'],
        },
      },
    ];
  }

  // Tool Handlers
  private async handleGenerateCode(args: any) {
    const prompt = `Generate ${args.language} code for the following requirement:

${args.description}

${args.context ? `Additional context: ${args.context}` : ''}

Requirements:
- Write clean, well-documented code
- Follow best practices for ${args.language}
- Include inline comments explaining complex logic
${args.includeTests ? '- Include comprehensive unit tests' : ''}

Return the complete code with explanations.`;

    const responseSchema = {
      type: 'object',
      properties: {
        code: { type: 'string' },
        explanation: { type: 'string' },
        language: { type: 'string' },
        features: {
          type: 'array',
          items: { type: 'string' },
        },
        ...(args.includeTests && {
          tests: { type: 'string' },
        }),
      },
      required: ['code', 'explanation', 'language'],
    };

    const response = await this.client.generateStructuredContent(
      prompt,
      responseSchema,
      { thinkingLevel: 'high', tools: { codeExecution: true } }
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
  }

  private async handleAnalyzeCode(args: any) {
    const focusAreas = args.focusAreas?.join(', ') || 'bugs, performance, security, code quality';

    const prompt = `Analyze the following ${args.language} code:

\`\`\`${args.language}
${args.code}
\`\`\`

Focus on: ${focusAreas}

Provide detailed analysis covering:
- Potential bugs or errors
- Performance issues
- Security vulnerabilities
- Code quality and best practices
- Suggested improvements`;

    const responseSchema = {
      type: 'object',
      properties: {
        overall_quality: {
          type: 'string',
          enum: ['excellent', 'good', 'fair', 'poor'],
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              line: { type: 'number' },
              suggestion: { type: 'string' },
            },
          },
        },
        strengths: {
          type: 'array',
          items: { type: 'string' },
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['overall_quality', 'issues', 'recommendations'],
    };

    const response = await this.client.generateStructuredContent(
      prompt,
      responseSchema,
      { thinkingLevel: 'high' }
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
  }

  private async handleExplainConcept(args: any) {
    const level = args.level || 'intermediate';
    const includeExamples = args.includeExamples !== false;

    const prompt = `Explain the following concept to a ${level}-level audience:

${args.concept}

${includeExamples ? 'Include practical code examples to illustrate the concept.' : ''}

Provide a comprehensive explanation covering:
- Definition and purpose
- How it works
- When to use it
- Common patterns or variations
${includeExamples ? '- Code examples' : ''}
- Best practices`;

    const response = await this.client.generateContent(prompt, {
      thinkingLevel: 'high',
    });

    return {
      content: [{ type: 'text', text: response }],
    };
  }

  private async handleSolveProblem(args: any) {
    const prompt = `Help solve the following problem:

Problem: ${args.problem}

${args.code ? `Existing code:\n\`\`\`\n${args.code}\n\`\`\`` : ''}

${args.errorMessage ? `Error message:\n${args.errorMessage}` : ''}

Provide:
- Root cause analysis
- Step-by-step solution
- Corrected code (if applicable)
- Explanation of the fix
- Best practices to avoid similar issues`;

    const response = await this.client.generateContent(prompt, {
      thinkingLevel: 'high',
      tools: { codeExecution: true },
    });

    return {
      content: [{ type: 'text', text: response }],
    };
  }

  private async handleGenerateText(args: any) {
    const tone = args.tone || 'professional';

    const prompt = `Generate ${args.type} content on the following topic:

Topic: ${args.topic}

${args.context ? `Context: ${args.context}` : ''}

Tone: ${tone}

Create comprehensive, well-structured content that:
- Is clear and engaging
- Follows best practices for ${args.type}
- Includes relevant examples
- Is properly formatted with headings and sections`;

    const response = await this.client.generateContent(prompt, {
      thinkingLevel: 'high',
    });

    return {
      content: [{ type: 'text', text: response }],
    };
  }

  private async handleAskGemini(args: any) {
    const prompt = args.context
      ? `Context: ${args.context}\n\nQuestion: ${args.question}`
      : args.question;

    const response = await this.client.generateContent(prompt, {
      thinkingLevel: 'high',
      tools: { googleSearch: true },
    });

    return {
      content: [{ type: 'text', text: response }],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gemini 3 General MCP Server running on stdio');
    console.error(`Model: ${this.client.getModelInfo()}`);
  }
}

const server = new Gemini3GeneralServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

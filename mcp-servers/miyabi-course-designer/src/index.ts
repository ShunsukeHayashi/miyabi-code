#!/usr/bin/env node

/**
 * Miyabi CourseDesigner MCP Server
 * AI-powered course content generation using Google Generative AI
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';

interface ToolSchema {
  name: string;
  description: string;
  inputSchema: any;
}
import { CourseDesignerAgent } from './agents/course-designer.js';
import { CourseInputSchema, CourseInput } from './types/index.js';
import winston from 'winston';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'course-designer-mcp.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Check for required environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize the CourseDesigner agent
const courseDesigner = new CourseDesignerAgent(GEMINI_API_KEY);

// Define available tools
const TOOLS: ToolSchema[] = [
  {
    name: 'generate_course',
    description: 'Generate a comprehensive course with AI-powered content creation',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Main course topic (e.g., "Introduction to Machine Learning", "Advanced JavaScript Programming")'
        },
        targetAudience: {
          type: 'string',
          description: 'Target student demographic and skill level (e.g., "Software developers with 2+ years experience", "Complete beginners to programming")'
        },
        duration: {
          type: 'object',
          properties: {
            weeks: {
              type: 'number',
              minimum: 1,
              maximum: 52,
              description: 'Course duration in weeks'
            },
            hoursPerWeek: {
              type: 'number',
              minimum: 1,
              maximum: 40,
              description: 'Expected study hours per week'
            }
          },
          description: 'Course duration and time commitment'
        },
        learningObjectives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific learning goals and outcomes'
        },
        prerequisites: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required knowledge or skills before taking this course'
        },
        difficulty: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Course difficulty level'
        },
        format: {
          type: 'object',
          properties: {
            includeVideos: {
              type: 'boolean',
              description: 'Include video content and scripts'
            },
            includeAssessments: {
              type: 'boolean',
              description: 'Include quizzes and assessments'
            },
            includeProjects: {
              type: 'boolean',
              description: 'Include hands-on projects'
            },
            includeDiscussions: {
              type: 'boolean',
              description: 'Include discussion prompts and activities'
            }
          },
          description: 'Content formats to include in the course'
        },
        preferences: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              description: 'Content language (default: en)'
            },
            tone: {
              type: 'string',
              enum: ['formal', 'casual', 'academic', 'conversational'],
              description: 'Content tone and style'
            },
            interactivity: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Level of interactive elements'
            }
          },
          description: 'Content generation preferences'
        }
      },
      required: ['topic', 'targetAudience']
    }
  },
  {
    name: 'get_generation_progress',
    description: 'Get the current progress of course generation',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'validate_api_connection',
    description: 'Validate connection to Google Generative AI',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_agent_info',
    description: 'Get information about the CourseDesigner agent capabilities',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'miyabi-course-designer',
    version: '1.0.0',
    description: 'Miyabi CourseDesigner Agent - AI-powered course content generation using Google Generative AI'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Listing available tools');
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  logger.info('Tool called', { name, args });

  try {
    switch (name) {
      case 'generate_course': {
        // Validate input
        const input = CourseInputSchema.parse(args);

        logger.info('Starting course generation', {
          topic: input.topic,
          targetAudience: input.targetAudience,
          difficulty: input.difficulty
        });

        // Generate course
        const result = await courseDesigner.generateCourse(input);

        logger.info('Course generation completed successfully', {
          topic: input.topic,
          modulesGenerated: result.courseStructure.modules.length,
          qualityScore: result.metadata.contentQualityScore
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Course generated successfully',
                data: result,
                summary: {
                  title: result.courseStructure.title,
                  modules: result.courseStructure.modules.length,
                  lessons: result.courseStructure.modules.reduce(
                    (sum, module) => sum + module.lessons.length,
                    0
                  ),
                  qualityScore: result.metadata.contentQualityScore,
                  estimatedHours: result.courseStructure.duration.totalHours
                }
              }, null, 2)
            }
          ]
        };
      }

      case 'get_generation_progress': {
        const progress = courseDesigner.getGenerationProgress();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                data: progress,
                message: progress ?
                  `Generation ${progress.overallProgress}% complete` :
                  'No generation in progress'
              }, null, 2)
            }
          ]
        };
      }

      case 'validate_api_connection': {
        const isValid = await courseDesigner.validateConnection();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: isValid,
                message: isValid ?
                  'Google Generative AI connection is valid' :
                  'Google Generative AI connection failed',
                data: { connected: isValid }
              }, null, 2)
            }
          ]
        };
      }

      case 'get_agent_info': {
        const info = courseDesigner.getAgentInfo();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                data: info,
                message: 'Agent information retrieved successfully'
              }, null, 2)
            }
          ]
        };
      }

      default:
        logger.warn('Unknown tool called', { name });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`,
                availableTools: TOOLS.map(t => t.name)
              }, null, 2)
            }
          ],
          isError: true
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Tool execution failed', {
      tool: name,
      error: errorMessage,
      stack: errorStack,
      args
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            tool: name,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Handle server shutdown gracefully
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

// Start the server
async function main() {
  try {
    // Validate the connection on startup
    const isConnected = await courseDesigner.validateConnection();
    if (!isConnected) {
      logger.error('Failed to connect to Google Generative AI - check your API key');
      process.exit(1);
    }

    logger.info('CourseDesigner agent connection validated');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Miyabi CourseDesigner MCP Server started successfully', {
      tools: TOOLS.length
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', {
    reason: String(reason),
    promise: String(promise)
  });
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error during startup', { error });
    process.exit(1);
  });
}
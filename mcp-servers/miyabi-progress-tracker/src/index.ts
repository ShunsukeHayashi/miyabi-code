#!/usr/bin/env node

/**
 * Miyabi ProgressTracker MCP Server
 * AI-powered learning analytics and progress optimization
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import { ProgressTrackerAgent } from './ProgressTrackerAgent.js';
import {
  TrackProgressInput,
  AnalyzePerformanceInput,
  GenerateRecommendationsInput,
  PredictOutcomesInput,
  GetInsightsInput
} from './types.js';

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
      filename: 'progress-tracker-mcp.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Initialize the ProgressTracker agent
const progressTracker = new ProgressTrackerAgent();

// Define available tools
const TOOLS = [
  {
    name: 'track_progress',
    description: 'Track student learning progress on a course or lesson',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'Unique identifier for the student' },
        courseId: { type: 'string', description: 'Unique identifier for the course' },
        lessonId: { type: 'string', description: 'Unique identifier for the lesson (optional)' },
        status: { type: 'string', enum: ['in_progress', 'completed', 'skipped'], description: 'Current status' },
        progress: { type: 'number', minimum: 0, maximum: 100, description: 'Progress percentage' },
        timeSpent: { type: 'number', description: 'Time spent in seconds' },
        engagementData: { type: 'object', description: 'Additional engagement metrics (optional)' }
      },
      required: ['studentId', 'courseId', 'status', 'progress', 'timeSpent']
    }
  },
  {
    name: 'analyze_performance',
    description: 'Generate performance analytics for specific students or courses',
    inputSchema: {
      type: 'object',
      properties: {
        studentIds: { type: 'array', items: { type: 'string' } },
        courseIds: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'array', items: { type: 'string' } },
        includeComparisons: { type: 'boolean', default: false }
      }
    }
  },
  {
    name: 'generate_recommendations',
    description: 'Generate personalized learning recommendations for a student',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        maxRecommendations: { type: 'number', default: 5 },
        types: { type: 'array', items: { type: 'string', enum: ['next_lesson', 'review_content', 'study_schedule', 'course_suggestion'] } },
        forceRefresh: { type: 'boolean', default: false }
      },
      required: ['studentId']
    }
  },
  {
    name: 'predict_outcomes',
    description: 'Predict learning success and risk levels for students',
    inputSchema: {
      type: 'object',
      properties: {
        studentIds: { type: 'array', items: { type: 'string' } },
        courseIds: { type: 'array', items: { type: 'string' } },
        predictionTypes: { type: 'array', items: { type: 'string', enum: ['completion', 'success', 'risk', 'time_to_complete'] } },
        confidence: { type: 'number', minimum: 0, maximum: 100 }
      },
      required: ['predictionTypes']
    }
  },
  {
    name: 'get_insights',
    description: 'Get actionable insights and dashboard metrics',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', enum: ['student', 'course', 'system'] },
        entityId: { type: 'string' },
        insightTypes: { type: 'array', items: { type: 'string' } },
        priority: { type: 'array', items: { type: 'string', enum: ['info', 'warning', 'critical'] } }
      },
      required: ['scope']
    }
  },
  {
    name: 'get_dashboard_metrics',
    description: 'Get high-level dashboard metrics overview',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'miyabi-progress-tracker',
    version: '1.0.0',
    description: 'Miyabi ProgressTracker Agent - AI-powered learning analytics and progress optimization'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'track_progress': {
        const result = await progressTracker.trackProgress(args as any as TrackProgressInput);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, data: result }, null, 2) }]
        };
      }

      case 'analyze_performance': {
        const result = await progressTracker.analyzePerformance(args as any as AnalyzePerformanceInput);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, data: result }, null, 2) }]
        };
      }

      case 'generate_recommendations': {
        const result = await progressTracker.generateRecommendations(args as any as GenerateRecommendationsInput);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, data: result }, null, 2) }]
        };
      }

      case 'predict_outcomes': {
        const result = await progressTracker.predictOutcomes(args as any as PredictOutcomesInput);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, data: result }, null, 2) }]
        };
      }

      case 'get_insights': {
        const result = await progressTracker.getInsights(args as any as GetInsightsInput);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, data: result }, null, 2) }]
        };
      }

      case 'get_dashboard_metrics': {
        const result = await progressTracker.getDashboardMetrics();
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, data: result }, null, 2) }]
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2) }],
      isError: true
    };
  }
});

// Start the server
async function main() {
  try {
    await progressTracker.initialize();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Miyabi ProgressTracker MCP Server started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error);

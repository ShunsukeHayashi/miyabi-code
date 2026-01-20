/**
 * MCP Course Server
 * Issue #3: MCP Server Development - Course Operation Tools
 *
 * Provides MCP tools for course and lesson management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Course operation schemas
const CreateCourseSchema = z.object({
  title: z.string(),
  description: z.string(),
  thumbnail: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).default('BEGINNER'),
  language: z.string().default('en'),
  estimatedTime: z.number().optional(),
  price: z.number().optional(),
  tags: z.array(z.string()).optional(),
  creatorId: z.string(),
});

const ListCoursesSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).optional(),
  creatorId: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

const GetCourseSchema = z.object({
  courseId: z.string(),
});

const CreateLessonSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  content: z.string(),
  duration: z.number().optional(),
  order: z.number(),
  type: z.enum(['TEXT', 'VIDEO', 'EXERCISE', 'ASSESSMENT']).default('TEXT'),
  videoUrl: z.string().optional(),
  isPreview: z.boolean().default(false),
});

const ListLessonsSchema = z.object({
  courseId: z.string(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

const UpdateLessonSchema = z.object({
  lessonId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
  type: z.enum(['TEXT', 'VIDEO', 'EXERCISE', 'ASSESSMENT']).optional(),
  videoUrl: z.string().optional(),
  isPreview: z.boolean().optional(),
});

/**
 * Course MCP Server
 */
export class CourseMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'miyabi-course-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();

    // Set up tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.handleToolCall(name, args as Record<string, unknown>);
    });

    await this.server.connect(transport);
    console.error('MCP Course Server started');
  }

  /**
   * Get available tools
   */
  private getTools() {
    return [
      {
        name: 'course.create',
        description: '新しいコースを作成します',
        inputSchema: CreateCourseSchema,
      },
      {
        name: 'course.list',
        description: 'コース一覧を取得します',
        inputSchema: ListCoursesSchema,
      },
      {
        name: 'course.get',
        description: 'コース詳細を取得します',
        inputSchema: GetCourseSchema,
      },
      {
        name: 'lesson.create',
        description: '新しいレッスンを作成します',
        inputSchema: CreateLessonSchema,
      },
      {
        name: 'lesson.list',
        description: 'レッスン一覧を取得します',
        inputSchema: ListLessonsSchema,
      },
      {
        name: 'lesson.update',
        description: 'レッスンを更新します',
        inputSchema: UpdateLessonSchema,
      },
    ];
  }

  /**
   * Handle tool calls
   */
  private async handleToolCall(
    name: string,
    args: Record<string, unknown>,
  ) {
    switch (name) {
      case 'course.create':
        return await this.createCourse(args);
      case 'course.list':
        return await this.listCourses(args);
      case 'course.get':
        return await this.getCourse(args);
      case 'lesson.create':
        return await this.createLesson(args);
      case 'lesson.list':
        return await this.listLessons(args);
      case 'lesson.update':
        return await this.updateLesson(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Create a new course
   */
  private async createCourse(args: Record<string, unknown>) {
    const input = CreateCourseSchema.parse(args);

    // TODO: Implement database connection to miyabi-private
    // This is a mock implementation for now
    const mockCourse = {
      id: crypto.randomUUID(),
      ...input,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.error('course.create called with:', input);

    return {
      content: [{
        type: 'text',
        text: `コースを作成しました: ${mockCourse.title}`,
      }],
      data: mockCourse,
    };
  }

  /**
   * List courses
   */
  private async listCourses(args: Record<string, unknown>) {
    const input = ListCoursesSchema.parse(args);

    console.error('course.list called with:', input);

    // TODO: Implement database query
    return {
      content: [{
        type: 'text',
        text: `コース一覧を取得しました (status: ${input.status || 'ALL'}, limit: ${input.limit})`,
      }],
      data: {
        courses: [],
        total: 0,
      },
    };
  }

  /**
   * Get course details
   */
  private async getCourse(args: Record<string, unknown>) {
    const input = GetCourseSchema.parse(args);

    console.error('course.get called with:', input);

    // TODO: Implement database query
    return {
      content: [{
        type: 'text',
        text: `コース詳細を取得しました: ${input.courseId}`,
      }],
      data: null,
    };
  }

  /**
   * Create a new lesson
   */
  private async createLesson(args: Record<string, unknown>) {
    const input = CreateLessonSchema.parse(args);

    console.error('lesson.create called with:', input);

    // TODO: Implement database connection
    const mockLesson = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      content: [{
        type: 'text',
        text: `レッスンを作成しました: ${mockLesson.title}`,
      }],
      data: mockLesson,
    };
  }

  /**
   * List lessons
   */
  private async listLessons(args: Record<string, unknown>) {
    const input = ListLessonsSchema.parse(args);

    console.error('lesson.list called with:', input);

    // TODO: Implement database query
    return {
      content: [{
        type: 'text',
        text: `レッスン一覧を取得しました (courseId: ${input.courseId}, limit: ${input.limit})`,
      }],
      data: {
        lessons: [],
        total: 0,
      },
    };
  }

  /**
   * Update a lesson
   */
  private async updateLesson(args: Record<string, unknown>) {
    const input = UpdateLessonSchema.parse(args);

    console.error('lesson.update called with:', input);

    // TODO: Implement database update
    return {
      content: [{
        type: 'text',
        text: `レッスンを更新しました: ${input.lessonId}`,
      }],
      data: {
        lessonId: input.lessonId,
        updates: input,
      },
    };
  }
}

/**
 * Main entry point
 */
async function main() {
  const server = new CourseMCPServer();
  await server.start();
}

// Start server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

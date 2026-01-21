/**
 * MCP Course Server Tests
 * Issue #3: MCP Server Development
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CourseMCPServer } from '../../src/mcp/course-server.js';

describe('CourseMCPServer', () => {
  let server: CourseMCPServer;

  beforeEach(() => {
    server = new CourseMCPServer();
  });

  describe('ツール定義', () => {
    it('利用可能なツールが定義されている', () => {
      expect(server).toBeDefined();
    });
  });

  describe('course.create', () => {
    it('コースを作成できる', async () => {
      const input = {
        title: 'Test Course',
        description: 'Test Description',
        level: 'BEGINNER',
        language: 'en',
        creatorId: 'test-user-id',
      };

      const result = await server['createCourse'](input);

      expect(result).toBeDefined();
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('title', 'Test Course');
    });

    it('バリデーションエラーを返す', async () => {
      const input = {
        title: '', // Invalid
        description: 'Test',
      };

      await expect(server['createCourse'](input)).rejects.toThrow();
    });
  });

  describe('course.list', () => {
    it('コース一覧を取得できる', async () => {
      const input = {
        limit: 10,
        offset: 0,
      };

      const result = await server['listCourses'](input);

      expect(result).toBeDefined();
      expect(result.data).toHaveProperty('courses');
      expect(result.data).toHaveProperty('total');
    });
  });

  describe('course.get', () => {
    it('コース詳細を取得できる', async () => {
      const input = {
        courseId: 'test-course-id',
      };

      const result = await server['getCourse'](input);

      expect(result).toBeDefined();
    });
  });

  describe('lesson.create', () => {
    it('レッスンを作成できる', async () => {
      const input = {
        courseId: 'test-course-id',
        title: 'Test Lesson',
        content: 'Test content',
        order: 1,
        type: 'TEXT',
      };

      const result = await server['createLesson'](input);

      expect(result).toBeDefined();
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('title', 'Test Lesson');
    });
  });

  describe('lesson.update', () => {
    it('レッスンを更新できる', async () => {
      const input = {
        lessonId: 'test-lesson-id',
        title: 'Updated Lesson',
      };

      const result = await server['updateLesson'](input);

      expect(result).toBeDefined();
      expect(result.data).toHaveProperty('lessonId', 'test-lesson-id');
      expect(result.data.updates).toHaveProperty('title', 'Updated Lesson');
    });
  });
});

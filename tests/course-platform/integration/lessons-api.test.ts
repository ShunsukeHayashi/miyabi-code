/**
 * Integration Tests for Lesson Management API
 * Issue #1298: AI Course API Implementation
 *
 * Tests CRUD operations for /api/lessons endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
const vi = jest;
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Import API route handlers
import { GET as listLessons, POST as createLesson } from '@/app/api/courses/[id]/lessons/route';
import { GET as getLesson, PUT as updateLesson, DELETE as deleteLesson } from '@/app/api/lessons/[id]/route';

// Test data factories
const createTestUser = (overrides: any = {}) => ({
  id: `user_${Math.random().toString(36).substr(2, 9)}`,
  email: `test@example.com`,
  username: 'testuser',
  role: 'STUDENT',
  ...overrides
});

const createTestCourse = (overrides: any = {}) => ({
  id: `course_${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Course',
  status: 'PUBLISHED',
  creatorId: 'instructor-1',
  ...overrides
});

const createTestLesson = (courseId: string, overrides: any = {}) => ({
  id: `lesson_${Math.random().toString(36).substr(2, 9)}`,
  courseId,
  title: 'Test Lesson',
  content: 'This is test lesson content',
  order: 1,
  type: 'TEXT',
  duration: 30,
  isPreview: false,
  ...overrides
});

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    lesson: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    },
    userProgress: {
      count: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  canManageCourse: vi.fn((user, creatorId) =>
    user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.id === creatorId
  ),
}));

import { db } from '@/lib/db';

describe('Lesson Management API', () => {
  let instructor: ReturnType<typeof createTestUser>;
  let student: ReturnType<typeof createTestUser>;
  let instructorToken: string;
  let studentToken: string;
  let testCourse: ReturnType<typeof createTestCourse>;

  beforeEach(() => {
    vi.clearAllMocks();

    instructor = createTestUser({
      id: 'instructor-1',
      role: 'INSTRUCTOR',
      username: 'instructor',
    });
    student = createTestUser({
      id: 'student-1',
      role: 'STUDENT',
      username: 'student',
    });
    testCourse = createTestCourse({
      id: 'course-1',
      creatorId: instructor.id,
    });

    const secret = process.env.JWT_SECRET || 'test-secret';
    instructorToken = jwt.sign(
      { userId: instructor.id, email: instructor.email, role: instructor.role },
      secret,
      { expiresIn: '1h' }
    );
    studentToken = jwt.sign(
      { userId: student.id, email: student.email, role: student.role },
      secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/courses/[id]/lessons', () => {
    it('should return lessons for a course', async () => {
      const mockLessons = [
        { ...createTestLesson('course-1'), id: 'lesson-1', order: 1 },
        { ...createTestLesson('course-1'), id: 'lesson-2', order: 2 },
      ];

      (db.course.findUnique as any).mockResolvedValue(testCourse);
      (db.lesson.findMany as any).mockResolvedValue(mockLessons);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/lessons'),
        { method: 'GET' }
      );

      const response = await listLessons(request, { params: { id: 'course-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('should return lessons ordered by order field', async () => {
      (db.course.findUnique as any).mockResolvedValue(testCourse);
      (db.lesson.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/lessons'),
        { method: 'GET' }
      );

      await listLessons(request, { params: { id: 'course-1' } });

      expect(db.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({ order: 'asc' }),
        })
      );
    });

    it('should return 404 for non-existent course', async () => {
      (db.course.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/non-existent/lessons'),
        { method: 'GET' }
      );

      const response = await listLessons(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/lessons/[id]', () => {
    it('should return lesson details with assessments', async () => {
      const mockLesson = {
        ...createTestLesson('course-1'),
        id: 'lesson-1',
        course: { id: 'course-1', title: 'Test Course', creatorId: instructor.id, status: 'PUBLISHED' },
        assessments: [
          { id: 'assessment-1', title: 'Quiz 1', type: 'QUIZ', maxScore: 100 },
        ],
        userProgress: [],
      };

      (db.lesson.findUnique as any).mockResolvedValue(mockLesson);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/lessons/lesson-1'),
        { method: 'GET' }
      );

      const response = await getLesson(request, { params: { id: 'lesson-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('lesson-1');
      expect(data.data.assessments).toBeDefined();
    });

    it('should return 404 for non-existent lesson', async () => {
      (db.lesson.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/lessons/non-existent'),
        { method: 'GET' }
      );

      const response = await getLesson(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/courses/[id]/lessons', () => {
    it('should create lesson for course owner', async () => {
      const lessonData = {
        title: 'New Lesson',
        content: 'Lesson content here',
        order: 1,
        type: 'TEXT',
      };

      (db.course.findUnique as any).mockResolvedValue(testCourse);
      (db.lesson.create as any).mockResolvedValue({
        id: 'new-lesson-id',
        courseId: 'course-1',
        ...lessonData,
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/lessons'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lessonData),
        }
      );

      const response = await createLesson(request, { params: { id: 'course-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('New Lesson');
    });

    it('should reject lesson creation for non-owner', async () => {
      const anotherInstructorCourse = {
        ...testCourse,
        creatorId: 'another-instructor-id',
      };

      (db.course.findUnique as any).mockResolvedValue(anotherInstructorCourse);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/lessons'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Lesson',
            content: 'Content',
            order: 1,
          }),
        }
      );

      const response = await createLesson(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/lessons/[id]', () => {
    it('should update lesson for course owner', async () => {
      const existingLesson = {
        id: 'lesson-1',
        courseId: 'course-1',
        title: 'Old Title',
        course: { id: 'course-1', creatorId: instructor.id },
      };

      (db.lesson.findUnique as any).mockResolvedValue(existingLesson);
      (db.lesson.update as any).mockResolvedValue({
        ...existingLesson,
        title: 'Updated Title',
        course: { id: 'course-1', title: 'Test Course', creatorId: instructor.id },
        assessments: [],
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/lessons/lesson-1'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated Title' }),
        }
      );

      const response = await updateLesson(request, { params: { id: 'lesson-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.title).toBe('Updated Title');
    });

    it('should reject update for non-owner', async () => {
      const existingLesson = {
        id: 'lesson-1',
        courseId: 'course-1',
        course: { id: 'course-1', creatorId: 'another-user-id' },
      };

      (db.lesson.findUnique as any).mockResolvedValue(existingLesson);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/lessons/lesson-1'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated Title' }),
        }
      );

      const response = await updateLesson(request, { params: { id: 'lesson-1' } });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/lessons/[id]', () => {
    it('should delete lesson without user progress', async () => {
      const existingLesson = {
        id: 'lesson-1',
        title: 'Lesson to Delete',
        courseId: 'course-1',
        course: { id: 'course-1', creatorId: instructor.id },
      };

      (db.lesson.findUnique as any).mockResolvedValue(existingLesson);
      (db.userProgress.count as any).mockResolvedValue(0);
      (db.lesson.delete as any).mockResolvedValue(existingLesson);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/lessons/lesson-1'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
          },
        }
      );

      const response = await deleteLesson(request, { params: { id: 'lesson-1' } });

      expect(response.status).toBe(200);
    });

    it('should reject delete for lesson with user progress', async () => {
      const existingLesson = {
        id: 'lesson-1',
        courseId: 'course-1',
        course: { id: 'course-1', creatorId: instructor.id },
      };

      (db.lesson.findUnique as any).mockResolvedValue(existingLesson);
      (db.userProgress.count as any).mockResolvedValue(5); // Has progress

      const request = new NextRequest(
        new URL('http://localhost:3000/api/lessons/lesson-1'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
          },
        }
      );

      const response = await deleteLesson(request, { params: { id: 'lesson-1' } });

      expect(response.status).toBe(500); // Error due to existing progress
    });

    it('should return 404 for non-existent lesson', async () => {
      (db.lesson.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/lessons/non-existent'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
          },
        }
      );

      const response = await deleteLesson(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('Input Validation', () => {
    it('should validate lesson creation payload', async () => {
      (db.course.findUnique as any).mockResolvedValue(testCourse);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/lessons'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Missing required 'title' and 'content'
            order: 1,
          }),
        }
      );

      const response = await createLesson(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(400);
    });

    it('should validate lesson type enum', async () => {
      (db.course.findUnique as any).mockResolvedValue(testCourse);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/lessons'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Lesson',
            content: 'Content',
            order: 1,
            type: 'INVALID_TYPE',
          }),
        }
      );

      const response = await createLesson(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(400);
    });
  });
});

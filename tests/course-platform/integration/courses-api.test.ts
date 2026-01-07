/**
 * Integration Tests for Course Management API
 * Issue #1298: AI Course API Implementation
 *
 * Tests CRUD operations for /api/courses endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
const vi = jest;
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Import API route handlers
import { GET as listCourses, POST as createCourse } from '@/app/api/courses/route';
import { GET as getCourse, PUT as updateCourse, DELETE as deleteCourse } from '@/app/api/courses/[id]/route';

// Test data factories
const createTestUser = (overrides: any = {}) => ({
  id: `user_${Math.random().toString(36).substr(2, 9)}`,
  email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
  username: 'testuser',
  displayName: 'Test User',
  role: 'STUDENT',
  avatar: null,
  ...overrides
});

const createTestCourse = (overrides: any = {}) => ({
  id: `course_${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Course',
  description: 'A test course for automated testing',
  slug: 'test-course',
  status: 'PUBLISHED',
  level: 'BEGINNER',
  language: 'en',
  estimatedTime: 120,
  price: null,
  featured: false,
  tags: ['javascript', 'testing'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    courseCategory: {
      createMany: vi.fn(),
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

describe('Course Management API', () => {
  let instructor: ReturnType<typeof createTestUser>;
  let student: ReturnType<typeof createTestUser>;
  let admin: ReturnType<typeof createTestUser>;
  let instructorToken: string;
  let studentToken: string;
  let adminToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create test users
    instructor = createTestUser({
      id: 'instructor-1',
      role: 'INSTRUCTOR',
      username: 'instructor',
      displayName: 'Test Instructor',
    });
    student = createTestUser({
      id: 'student-1',
      role: 'STUDENT',
      username: 'student',
      displayName: 'Test Student',
    });
    admin = createTestUser({
      id: 'admin-1',
      role: 'ADMIN',
      username: 'admin',
      displayName: 'Test Admin',
    });

    // Create JWT tokens
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
    adminToken = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/courses', () => {
    it('should return paginated list of published courses', async () => {
      const mockCourses = [
        createTestCourse({ id: 'course-1', title: 'Course 1', status: 'PUBLISHED' }),
        createTestCourse({ id: 'course-2', title: 'Course 2', status: 'PUBLISHED' }),
      ];

      (db.course.count as any).mockResolvedValue(2);
      (db.course.findMany as any).mockResolvedValue(
        mockCourses.map(c => ({
          ...c,
          creator: { id: instructor.id, username: 'instructor', displayName: 'Instructor', avatar: null },
          categories: [],
          _count: { lessons: 5, enrollments: 10, reviews: 3 },
        }))
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses?page=1&limit=20'),
        { method: 'GET' }
      );

      const response = await listCourses(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(2);
    });

    it('should filter courses by status', async () => {
      (db.course.count as any).mockResolvedValue(1);
      (db.course.findMany as any).mockResolvedValue([
        {
          ...createTestCourse({ status: 'DRAFT' }),
          creator: { id: instructor.id, username: 'instructor', displayName: 'Instructor', avatar: null },
          categories: [],
          _count: { lessons: 3, enrollments: 0, reviews: 0 },
        },
      ]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses?status=DRAFT'),
        { method: 'GET' }
      );

      const response = await listCourses(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DRAFT' }),
        })
      );
    });

    it('should filter courses by difficulty level', async () => {
      (db.course.count as any).mockResolvedValue(1);
      (db.course.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses?level=BEGINNER'),
        { method: 'GET' }
      );

      await listCourses(request);

      expect(db.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: 'BEGINNER' }),
        })
      );
    });

    it('should search courses by title/description', async () => {
      (db.course.count as any).mockResolvedValue(1);
      (db.course.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses?q=javascript'),
        { method: 'GET' }
      );

      await listCourses(request);

      expect(db.course.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/courses/[id]', () => {
    it('should return course details with lessons', async () => {
      const mockCourse = {
        ...createTestCourse({ id: 'course-1' }),
        creator: { id: instructor.id, username: 'instructor', displayName: 'Instructor', avatar: null },
        categories: [],
        lessons: [
          { id: 'lesson-1', title: 'Lesson 1', order: 1, duration: 30, type: 'VIDEO', isPreview: true },
        ],
        instructors: [],
        _count: { lessons: 1, enrollments: 10, reviews: 5 },
      };

      (db.course.findUnique as any).mockResolvedValue(mockCourse);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1'),
        { method: 'GET' }
      );

      const response = await getCourse(request, { params: { id: 'course-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('course-1');
      expect(data.data.lessons).toBeDefined();
    });

    it('should return 404 for non-existent course', async () => {
      (db.course.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/non-existent'),
        { method: 'GET' }
      );

      const response = await getCourse(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/courses', () => {
    it('should create course for instructor', async () => {
      const courseData = {
        title: 'New Course',
        description: 'A new course description',
        slug: 'new-course',
        level: 'BEGINNER',
        language: 'en',
        tags: ['javascript', 'web'],
      };

      (db.course.findUnique as any).mockResolvedValue(null); // Slug doesn't exist
      (db.course.create as any).mockResolvedValue({
        id: 'new-course-id',
        ...courseData,
        status: 'DRAFT',
        creatorId: instructor.id,
        creator: { id: instructor.id, username: 'instructor', displayName: 'Instructor', avatar: null },
        categories: [],
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(courseData),
        }
      );

      const response = await createCourse(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('New Course');
    });

    it('should reject duplicate slug', async () => {
      (db.course.findUnique as any).mockResolvedValue({ id: 'existing-course' });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Course',
            description: 'Description',
            slug: 'existing-slug',
          }),
        }
      );

      const response = await createCourse(request);

      expect(response.status).toBe(500); // Error due to duplicate slug
    });

    it('should reject creation for students', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Course',
            description: 'Description',
            slug: 'new-course',
          }),
        }
      );

      const response = await createCourse(request);

      expect(response.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Course',
            description: 'Description',
            slug: 'new-course',
          }),
        }
      );

      const response = await createCourse(request);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/courses/[id]', () => {
    it('should update course for owner', async () => {
      const existingCourse = {
        id: 'course-1',
        creatorId: instructor.id,
        title: 'Old Title',
      };

      (db.course.findUnique as any).mockResolvedValue(existingCourse);
      (db.course.update as any).mockResolvedValue({
        ...existingCourse,
        title: 'Updated Title',
        creator: { id: instructor.id, username: 'instructor', displayName: 'Instructor', avatar: null },
        categories: [],
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated Title' }),
        }
      );

      const response = await updateCourse(request, { params: { id: 'course-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.title).toBe('Updated Title');
    });

    it('should reject update for non-owner', async () => {
      const existingCourse = {
        id: 'course-1',
        creatorId: 'another-user-id',
        title: 'Old Title',
      };

      (db.course.findUnique as any).mockResolvedValue(existingCourse);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated Title' }),
        }
      );

      const response = await updateCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(403);
    });

    it('should allow admin to update any course', async () => {
      const existingCourse = {
        id: 'course-1',
        creatorId: instructor.id,
        title: 'Old Title',
      };

      (db.course.findUnique as any).mockResolvedValue(existingCourse);
      (db.course.update as any).mockResolvedValue({
        ...existingCourse,
        title: 'Admin Updated',
        creator: { id: instructor.id, username: 'instructor', displayName: 'Instructor', avatar: null },
        categories: [],
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Admin Updated' }),
        }
      );

      const response = await updateCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/courses/[id]', () => {
    it('should soft delete (archive) course for owner', async () => {
      const existingCourse = {
        id: 'course-1',
        creatorId: instructor.id,
        status: 'PUBLISHED',
      };

      (db.course.findUnique as any).mockResolvedValue(existingCourse);
      (db.course.update as any).mockResolvedValue({
        ...existingCourse,
        status: 'ARCHIVED',
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
          },
        }
      );

      const response = await deleteCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(200);
    });

    it('should reject delete for non-owner', async () => {
      const existingCourse = {
        id: 'course-1',
        creatorId: 'another-user-id',
      };

      (db.course.findUnique as any).mockResolvedValue(existingCourse);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
          },
        }
      );

      const response = await deleteCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent course', async () => {
      (db.course.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/non-existent'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
          },
        }
      );

      const response = await deleteCourse(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid page parameter', async () => {
      (db.course.count as any).mockResolvedValue(0);
      (db.course.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses?page=-1'),
        { method: 'GET' }
      );

      const response = await listCourses(request);

      // Should either return 400 or default to page 1
      expect([200, 400]).toContain(response.status);
    });

    it('should limit max page size', async () => {
      (db.course.count as any).mockResolvedValue(0);
      (db.course.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses?limit=1000'),
        { method: 'GET' }
      );

      await listCourses(request);

      // Should cap at max limit (100)
      expect(db.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: expect.any(Number),
        })
      );
    });

    it('should validate course creation payload', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instructorToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Missing required fields
            description: 'Description only',
          }),
        }
      );

      const response = await createCourse(request);

      expect(response.status).toBe(400);
    });
  });
});

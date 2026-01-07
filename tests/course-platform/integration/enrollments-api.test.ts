/**
 * Integration Tests for Enrollment & Progress API
 * Issue #1298: AI Course API Implementation
 *
 * Tests enrollment and progress tracking endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
const vi = jest;
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Import API route handlers
import { POST as enrollCourse } from '@/app/api/courses/[id]/enroll/route';
import { GET as getProgress, PUT as updateProgress } from '@/app/api/enrollments/[id]/progress/route';

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
  price: 0,
  ...overrides
});

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    course: {
      findUnique: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userProgress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    certificate: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';

describe('Enrollment & Progress API', () => {
  let student: ReturnType<typeof createTestUser>;
  let anotherStudent: ReturnType<typeof createTestUser>;
  let admin: ReturnType<typeof createTestUser>;
  let studentToken: string;
  let anotherStudentToken: string;
  let adminToken: string;
  let testCourse: ReturnType<typeof createTestCourse>;

  beforeEach(() => {
    vi.clearAllMocks();

    student = createTestUser({
      id: 'student-1',
      role: 'STUDENT',
      username: 'student',
    });
    anotherStudent = createTestUser({
      id: 'student-2',
      role: 'STUDENT',
      username: 'another-student',
    });
    admin = createTestUser({
      id: 'admin-1',
      role: 'ADMIN',
      username: 'admin',
    });
    testCourse = createTestCourse({
      id: 'course-1',
      status: 'PUBLISHED',
      price: 0,
    });

    const secret = process.env.JWT_SECRET || 'test-secret';
    studentToken = jwt.sign(
      { userId: student.id, email: student.email, role: student.role },
      secret,
      { expiresIn: '1h' }
    );
    anotherStudentToken = jwt.sign(
      { userId: anotherStudent.id, email: anotherStudent.email, role: anotherStudent.role },
      secret,
      { expiresIn: '1h' }
    );
    adminToken = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      secret,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/courses/[id]/enroll', () => {
    it('should enroll user in a published course', async () => {
      (db.course.findUnique as any).mockResolvedValue({
        ...testCourse,
        prerequisites: [],
      });
      (db.enrollment.findUnique as any).mockResolvedValue(null); // Not already enrolled
      (db.enrollment.create as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        courseId: 'course-1',
        status: 'ACTIVE',
        course: testCourse,
      });
      (db.userProgress.create as any).mockResolvedValue({});

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/enroll'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await enrollCourse(request, { params: { id: 'course-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.enrollment).toBeDefined();
    });

    it('should reject enrollment in unpublished course', async () => {
      (db.course.findUnique as any).mockResolvedValue({
        ...testCourse,
        status: 'DRAFT',
        prerequisites: [],
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/enroll'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await enrollCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(500); // Error thrown
    });

    it('should reject duplicate enrollment', async () => {
      (db.course.findUnique as any).mockResolvedValue({
        ...testCourse,
        prerequisites: [],
      });
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'existing-enrollment',
        userId: student.id,
        courseId: 'course-1',
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/enroll'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await enrollCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(409); // Already enrolled
    });

    it('should check prerequisites before enrollment', async () => {
      (db.course.findUnique as any).mockResolvedValue({
        ...testCourse,
        prerequisites: [
          {
            required: true,
            prerequisiteCourse: { id: 'prereq-course', title: 'Prerequisite Course' },
          },
        ],
      });
      (db.enrollment.findUnique as any).mockResolvedValue(null);
      (db.enrollment.findMany as any).mockResolvedValue([]); // No completed prerequisites

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/enroll'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await enrollCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(500); // Missing prerequisites
    });

    it('should return 404 for non-existent course', async () => {
      (db.course.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/non-existent/enroll'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await enrollCourse(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });

    it('should reject unauthenticated enrollment', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/courses/course-1/enroll'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      const response = await enrollCourse(request, { params: { id: 'course-1' } });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/enrollments/[id]/progress', () => {
    it('should return detailed progress for own enrollment', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: student.id,
        courseId: 'course-1',
        status: 'ACTIVE',
        enrolledAt: new Date(),
        completedAt: null,
        course: {
          id: 'course-1',
          title: 'Test Course',
          lessons: [
            { id: 'lesson-1', title: 'Lesson 1', order: 1, duration: 30 },
            { id: 'lesson-2', title: 'Lesson 2', order: 2, duration: 45 },
          ],
        },
        user: { id: student.id },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);
      (db.userProgress.findMany as any).mockResolvedValue([
        {
          lessonId: 'lesson-1',
          completedAt: new Date(),
          timeSpent: 1800,
          lastAccessedAt: new Date(),
          bookmarked: false,
          notes: null,
          lesson: { id: 'lesson-1', title: 'Lesson 1', order: 1, duration: 30 },
        },
      ]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
          },
        }
      );

      const response = await getProgress(request, { params: { id: 'enrollment-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.overall).toBeDefined();
      expect(data.data.overall.progressPercentage).toBe(50); // 1 of 2 lessons
      expect(data.data.lessons).toHaveLength(2);
    });

    it('should reject access to others enrollment', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: anotherStudent.id, // Different user
        courseId: 'course-1',
        course: { id: 'course-1', title: 'Test', lessons: [] },
        user: { id: anotherStudent.id },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
          },
        }
      );

      const response = await getProgress(request, { params: { id: 'enrollment-1' } });

      expect(response.status).toBe(403);
    });

    it('should allow admin to view any enrollment', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: student.id,
        courseId: 'course-1',
        course: { id: 'course-1', title: 'Test', lessons: [] },
        user: { id: student.id },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);
      (db.userProgress.findMany as any).mockResolvedValue([]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      );

      const response = await getProgress(request, { params: { id: 'enrollment-1' } });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent enrollment', async () => {
      (db.enrollment.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/non-existent/progress'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
          },
        }
      );

      const response = await getProgress(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/enrollments/[id]/progress', () => {
    it('should update lesson progress', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: student.id,
        courseId: 'course-1',
        course: {
          id: 'course-1',
          lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
        },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);
      (db.userProgress.upsert as any).mockResolvedValue({
        userId: student.id,
        courseId: 'course-1',
        lessonId: 'lesson-1',
        completedAt: new Date(),
        timeSpent: 1800,
      });
      (db.userProgress.count as any).mockResolvedValue(1);
      (db.enrollment.update as any).mockResolvedValue({});

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId: 'lesson-1',
            completedAt: new Date().toISOString(),
            timeSpent: 1800,
          }),
        }
      );

      const response = await updateProgress(request, { params: { id: 'enrollment-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should mark course completed when all lessons done', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: student.id,
        courseId: 'course-1',
        course: {
          id: 'course-1',
          lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
        },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);
      (db.userProgress.upsert as any).mockResolvedValue({});
      (db.userProgress.count as any).mockResolvedValue(2); // All lessons completed
      (db.enrollment.update as any).mockResolvedValue({});
      (db.certificate.findUnique as any).mockResolvedValue(null);
      (db.certificate.create as any).mockResolvedValue({});

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId: 'lesson-2',
            completedAt: new Date().toISOString(),
          }),
        }
      );

      await updateProgress(request, { params: { id: 'enrollment-1' } });

      // Verify enrollment was updated to completed
      expect(db.enrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
          }),
        })
      );

      // Verify certificate was created
      expect(db.certificate.create).toHaveBeenCalled();
    });

    it('should reject updating others enrollment', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: anotherStudent.id,
        courseId: 'course-1',
        course: { id: 'course-1', lessons: [] },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId: 'lesson-1',
            completedAt: new Date().toISOString(),
          }),
        }
      );

      const response = await updateProgress(request, { params: { id: 'enrollment-1' } });

      expect(response.status).toBe(403);
    });

    it('should validate lesson belongs to course', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: student.id,
        courseId: 'course-1',
        course: {
          id: 'course-1',
          lessons: [{ id: 'lesson-1' }], // Only lesson-1 belongs
        },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId: 'lesson-99', // Doesn't belong to course
            completedAt: new Date().toISOString(),
          }),
        }
      );

      const response = await updateProgress(request, { params: { id: 'enrollment-1' } });

      expect(response.status).toBe(404); // Lesson not found
    });

    it('should allow bookmarking lessons', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: student.id,
        courseId: 'course-1',
        course: {
          id: 'course-1',
          lessons: [{ id: 'lesson-1' }],
        },
      };

      (db.enrollment.findUnique as any).mockResolvedValue(mockEnrollment);
      (db.userProgress.upsert as any).mockResolvedValue({
        bookmarked: true,
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/enrollments/enrollment-1/progress'),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId: 'lesson-1',
            bookmarked: true,
          }),
        }
      );

      const response = await updateProgress(request, { params: { id: 'enrollment-1' } });

      expect(response.status).toBe(200);
      expect(db.userProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            bookmarked: true,
          }),
        })
      );
    });
  });
});

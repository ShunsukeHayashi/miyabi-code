/**
 * Integration Tests for Assessment API
 * Issue #1298: AI Course API Implementation
 *
 * Tests assessment submission and results endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
const vi = jest;
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Import API route handlers
import { POST as submitAssessment } from '@/app/api/assessments/[id]/submit/route';

// Test data factories
const createTestUser = (overrides: any = {}) => ({
  id: `user_${Math.random().toString(36).substr(2, 9)}`,
  email: `test@example.com`,
  username: 'testuser',
  role: 'STUDENT',
  ...overrides
});

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    assessment: {
      findUnique: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
    },
    userAnswer: {
      count: vi.fn(),
      create: vi.fn(),
    },
    userProgress: {
      upsert: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';

describe('Assessment API', () => {
  let student: ReturnType<typeof createTestUser>;
  let unenrolledStudent: ReturnType<typeof createTestUser>;
  let studentToken: string;
  let unenrolledToken: string;
  let testAssessment: any;

  beforeEach(() => {
    vi.clearAllMocks();

    student = createTestUser({
      id: 'student-1',
      role: 'STUDENT',
      username: 'student',
    });
    unenrolledStudent = createTestUser({
      id: 'student-2',
      role: 'STUDENT',
      username: 'unenrolled',
    });

    testAssessment = {
      id: 'assessment-1',
      title: 'JavaScript Quiz',
      lessonId: 'lesson-1',
      maxScore: 10,
      passingScore: 7,
      attempts: 3,
      timeLimit: 600,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1, // Index of correct option
          points: 2,
          explanation: '2 + 2 = 4',
        },
        {
          id: 'q2',
          type: 'true_false',
          question: 'JavaScript is a programming language.',
          correctAnswer: true,
          points: 2,
          explanation: 'JavaScript is indeed a programming language.',
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          question: 'Which is a JavaScript data type?',
          options: ['integer', 'float', 'string', 'char'],
          correctAnswer: 2, // 'string'
          points: 3,
          explanation: 'JavaScript has string as a primitive data type.',
        },
        {
          id: 'q4',
          type: 'short_answer',
          question: 'What keyword declares a variable in ES6?',
          correctAnswer: 'let',
          points: 3,
          explanation: 'let is used to declare block-scoped variables.',
        },
      ],
      lesson: {
        id: 'lesson-1',
        course: { id: 'course-1' },
      },
    };

    const secret = process.env.JWT_SECRET || 'test-secret';
    studentToken = jwt.sign(
      { userId: student.id, email: student.email, role: student.role },
      secret,
      { expiresIn: '1h' }
    );
    unenrolledToken = jwt.sign(
      { userId: unenrolledStudent.id, email: unenrolledStudent.email, role: unenrolledStudent.role },
      secret,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/assessments/[id]/submit', () => {
    it('should submit assessment and return graded results', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'ACTIVE',
      });
      (db.userAnswer.count as any).mockResolvedValue(0); // First attempt
      (db.userAnswer.create as any).mockResolvedValue({
        id: 'answer-1',
        completedAt: new Date(),
      });
      (db.userProgress.upsert as any).mockResolvedValue({});

      const answers = {
        q1: 1, // Correct
        q2: true, // Correct
        q3: 2, // Correct
        q4: 'let', // Correct
      };

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers, timeSpent: 300 }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.submission).toBeDefined();
      expect(data.data.submission.score).toBe(10); // All correct
      expect(data.data.submission.passed).toBe(true);
      expect(data.data.results).toHaveLength(4);
    });

    it('should calculate partial score for wrong answers', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'ACTIVE',
      });
      (db.userAnswer.count as any).mockResolvedValue(0);
      (db.userAnswer.create as any).mockResolvedValue({
        id: 'answer-1',
        completedAt: new Date(),
      });

      const answers = {
        q1: 0, // Wrong (should be 1)
        q2: true, // Correct
        q3: 0, // Wrong (should be 2)
        q4: 'const', // Wrong (should be 'let')
      };

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.submission.score).toBe(2); // Only q2 correct (2 points)
      expect(data.data.submission.passed).toBe(false); // 2 < 7
    });

    it('should reject submission for unenrolled user', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${unenrolledToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: { q1: 1 } }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });

      expect(response.status).toBe(500); // Error - not enrolled
    });

    it('should reject when max attempts exceeded', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'ACTIVE',
      });
      (db.userAnswer.count as any).mockResolvedValue(3); // Max attempts reached

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: { q1: 1 } }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });

      expect(response.status).toBe(500); // Error - max attempts exceeded
    });

    it('should track attempt number correctly', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'ACTIVE',
      });
      (db.userAnswer.count as any).mockResolvedValue(1); // One previous attempt
      (db.userAnswer.create as any).mockResolvedValue({
        id: 'answer-2',
        completedAt: new Date(),
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: { q1: 1, q2: true, q3: 2, q4: 'let' } }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.submission.attemptNumber).toBe(2);
      expect(data.data.submission.remainingAttempts).toBe(1);
    });

    it('should return 404 for non-existent assessment', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/non-existent/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: {} }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });

    it('should reject inactive enrollment', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'SUSPENDED', // Not active
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: { q1: 1 } }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });

      expect(response.status).toBe(500); // Error - not active
    });

    it('should update lesson progress on passing', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'ACTIVE',
      });
      (db.userAnswer.count as any).mockResolvedValue(0);
      (db.userAnswer.create as any).mockResolvedValue({
        id: 'answer-1',
        completedAt: new Date(),
      });
      (db.userProgress.upsert as any).mockResolvedValue({});

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers: { q1: 1, q2: true, q3: 2, q4: 'let' },
            timeSpent: 420,
          }),
        }
      );

      await submitAssessment(request, { params: { id: 'assessment-1' } });

      // Verify progress was updated
      expect(db.userProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_courseId_lessonId: expect.any(Object),
          }),
          update: expect.objectContaining({
            completedAt: expect.any(Date),
            timeSpent: 420,
          }),
        })
      );
    });

    it('should handle case-insensitive short answer', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'ACTIVE',
      });
      (db.userAnswer.count as any).mockResolvedValue(0);
      (db.userAnswer.create as any).mockResolvedValue({
        id: 'answer-1',
        completedAt: new Date(),
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers: { q1: 1, q2: true, q3: 2, q4: 'LET' }, // Uppercase
          }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.submission.score).toBe(10); // 'LET' should match 'let'
    });

    it('should provide feedback based on score', async () => {
      (db.assessment.findUnique as any).mockResolvedValue(testAssessment);
      (db.enrollment.findUnique as any).mockResolvedValue({
        id: 'enrollment-1',
        userId: student.id,
        status: 'ACTIVE',
      });
      (db.userAnswer.count as any).mockResolvedValue(0);
      (db.userAnswer.create as any).mockResolvedValue({
        id: 'answer-1',
        completedAt: new Date(),
      });
      (db.userProgress.upsert as any).mockResolvedValue({});

      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers: { q1: 1, q2: true, q3: 2, q4: 'let' },
          }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.submission.feedback).toBeDefined();
      expect(data.data.submission.feedback).toContain('100%');
      expect(data.data.submission.feedback).toContain('Excellent');
    });

    it('should reject unauthenticated submission', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/assessments/assessment-1/submit'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: {} }),
        }
      );

      const response = await submitAssessment(request, { params: { id: 'assessment-1' } });

      expect(response.status).toBe(401);
    });
  });
});

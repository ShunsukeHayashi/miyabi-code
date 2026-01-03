/**
 * Integration Tests for AI Course Platform API Endpoints
 * Tests the full API request/response cycle with authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Import API route handlers
import { POST as courseSuggestionsHandler } from '@/app/api/ai/course-suggestions/route';
import { POST as lessonContentHandler } from '@/app/api/ai/lesson-content/route';
import { POST as analyzeContentHandler } from '@/app/api/ai/analyze-content/route';
import { POST as generateAssessmentHandler } from '@/app/api/ai/generate-assessment/route';
import { POST as chatAssistantHandler } from '@/app/api/ai/chat-assistant/route';

// Import test setup
import { mockGeminiService, createTestUser, createAuthHeaders } from '../setup';

describe('AI Course Platform API Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create test user and auth token
    testUser = createTestUser({ role: 'instructor' });
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/ai/course-suggestions', () => {
    it('should generate course suggestions for authenticated instructor', async () => {
      const requestBody = {
        topic: 'JavaScript',
        targetAudience: 'Beginners'
      };

      mockGeminiService.generateCourseSuggestions.mockResolvedValue([
        {
          title: 'Introduction to JavaScript',
          description: 'Learn JavaScript fundamentals',
          outline: ['Variables', 'Functions', 'Objects'],
          estimatedDuration: 40,
          difficulty: 'beginner',
          prerequisites: []
        }
      ]);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/course-suggestions'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const response = await courseSuggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suggestions).toHaveLength(1);
      expect(data.suggestions[0]).toMatchObject({
        title: 'Introduction to JavaScript',
        difficulty: 'beginner'
      });

      expect(mockGeminiService.generateCourseSuggestions).toHaveBeenCalledWith(
        'JavaScript',
        'Beginners'
      );
    });

    it('should reject requests without authentication', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/course-suggestions'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ topic: 'JavaScript' })
        }
      );

      const response = await courseSuggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate request body and reject invalid data', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/course-suggestions'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ invalidField: 'value' })
        }
      );

      const response = await courseSuggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('validation');
    });

    it('should handle AI service errors gracefully', async () => {
      mockGeminiService.generateCourseSuggestions.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/course-suggestions'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: 'JavaScript',
            targetAudience: 'Beginners'
          })
        }
      );

      const response = await courseSuggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate course suggestions');
    });
  });

  describe('POST /api/ai/lesson-content', () => {
    it('should generate lesson content with valid parameters', async () => {
      const requestBody = {
        courseTitle: 'JavaScript Fundamentals',
        lessonTitle: 'Variables and Data Types',
        difficulty: 'beginner',
        estimatedDuration: 30
      };

      const mockLessonContent = {
        title: 'Variables and Data Types in JavaScript',
        content: 'In this lesson, we will explore...',
        objectives: ['Understand variables', 'Learn data types'],
        activities: ['Code exercises', 'Practice problems'],
        assessmentQuestions: ['What is a variable?', 'Name three data types']
      };

      mockGeminiService.generateLessonContent.mockResolvedValue(mockLessonContent);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/lesson-content'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const response = await lessonContentHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.content).toMatchObject({
        title: 'Variables and Data Types in JavaScript',
        content: expect.stringContaining('lesson'),
        objectives: expect.arrayContaining([expect.stringContaining('variables')])
      });

      expect(mockGeminiService.generateLessonContent).toHaveBeenCalledWith(
        'JavaScript Fundamentals',
        'Variables and Data Types',
        'beginner',
        30
      );
    });

    it('should require instructor role', async () => {
      const studentUser = createTestUser({ role: 'student' });
      const studentToken = jwt.sign(
        { userId: studentUser.id, email: studentUser.email, role: studentUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/lesson-content'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            courseTitle: 'Test Course',
            lessonTitle: 'Test Lesson',
            difficulty: 'beginner',
            estimatedDuration: 30
          })
        }
      );

      const response = await lessonContentHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });
  });

  describe('POST /api/ai/analyze-content', () => {
    it('should analyze content and provide suggestions', async () => {
      const requestBody = {
        content: 'This is sample course content about JavaScript functions.',
        targetLevel: 'beginner'
      };

      const mockAnalysis = {
        readabilityScore: 78,
        difficulty: 'intermediate',
        suggestedImprovements: ['Add more examples', 'Simplify language'],
        missingTopics: ['Error handling', 'Best practices'],
        engagementTips: ['Add interactive exercises', 'Include diagrams']
      };

      mockGeminiService.analyzeContent.mockResolvedValue(mockAnalysis);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/analyze-content'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const response = await analyzeContentHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis.readabilityScore).toBe(78);
      expect(data.analysis.suggestedImprovements).toHaveLength(2);

      expect(mockGeminiService.analyzeContent).toHaveBeenCalledWith(
        'This is sample course content about JavaScript functions.',
        'beginner'
      );
    });
  });

  describe('POST /api/ai/generate-assessment', () => {
    it('should generate assessment questions from content', async () => {
      const requestBody = {
        content: 'JavaScript functions are reusable blocks of code that perform specific tasks.',
        questionCount: 3,
        questionTypes: ['multiple_choice', 'short_answer']
      };

      const mockAssessment = {
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is a JavaScript function?',
            options: ['A variable', 'A block of code', 'A data type', 'An operator'],
            correctAnswer: 1,
            explanation: 'Functions are reusable blocks of code',
            difficulty: 'easy'
          },
          {
            type: 'short_answer',
            question: 'How do you declare a function in JavaScript?',
            correctAnswer: 'function functionName() {}',
            explanation: 'Functions are declared using the function keyword',
            difficulty: 'medium'
          }
        ]
      };

      mockGeminiService.generateAssessment.mockResolvedValue(mockAssessment);

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/generate-assessment'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const response = await generateAssessmentHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.assessment.questions).toHaveLength(2);
      expect(data.assessment.questions[0]).toMatchObject({
        type: 'multiple_choice',
        question: expect.stringContaining('function'),
        options: expect.any(Array)
      });

      expect(mockGeminiService.generateAssessment).toHaveBeenCalledWith(
        'JavaScript functions are reusable blocks of code that perform specific tasks.',
        3,
        ['multiple_choice', 'short_answer']
      );
    });
  });

  describe('POST /api/ai/chat-assistant', () => {
    it('should handle chat conversations', async () => {
      const requestBody = {
        messages: [
          {
            role: 'user',
            parts: [{ text: 'How do I create an effective course?' }]
          },
          {
            role: 'model',
            parts: [{ text: 'To create an effective course...' }]
          },
          {
            role: 'user',
            parts: [{ text: 'What about assessments?' }]
          }
        ]
      };

      mockGeminiService.chatAssistant.mockResolvedValue(
        'Assessment design is crucial for measuring learning outcomes. Consider using a mix of formative and summative assessments.'
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/chat-assistant'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const response = await chatAssistantHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response).toContain('Assessment design');

      expect(mockGeminiService.chatAssistant).toHaveBeenCalledWith(
        requestBody.messages
      );
    });

    it('should validate message format', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/chat-assistant'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: 'invalid format'
          })
        }
      );

      const response = await chatAssistantHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('validation');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/course-suggestions'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: '{ invalid json'
        }
      );

      const response = await courseSuggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle expired JWT tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/ai/course-suggestions'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${expiredToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: 'JavaScript',
            targetAudience: 'Beginners'
          })
        }
      );

      const response = await courseSuggestionsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Token expired');
    });
  });
});
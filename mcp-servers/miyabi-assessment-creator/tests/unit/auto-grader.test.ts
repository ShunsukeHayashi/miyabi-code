/**
 * Unit tests for AutoGrader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoGrader, GradingOptions } from '../../src/lib/auto-grader.js';
import { Question, StudentResponse } from '../../src/types/index.js';

// Mock Gemini Client
vi.mock('../../src/lib/gemini-client.js', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    gradeResponse: vi.fn(),
    generateStructuredContent: vi.fn(),
    validateConnection: vi.fn().mockResolvedValue(true),
    getModelInfo: vi.fn().mockReturnValue({ model: 'test-model' })
  }))
}));

describe('AutoGrader', () => {
  let grader: AutoGrader;
  let gradingOptions: GradingOptions;

  beforeEach(() => {
    grader = new AutoGrader('test-api-key');
    gradingOptions = {
      strictMode: false,
      allowPartialCredit: true,
      includeFeedback: true,
      feedbackLevel: 'standard',
      rubricWeighting: true,
      aiGradingForSubjective: true
    };
  });

  describe('gradeSubmission', () => {
    it('should grade a complete submission', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is 2 + 2?',
          bloomsLevel: 'remember',
          difficulty: 'easy',
          points: 1,
          timeEstimate: 1,
          options: ['3', '4', '5', '6'],
          correctAnswerIndex: 1,
          correctAnswer: '4',
          explanation: '2 + 2 equals 4'
        } as any,
        {
          id: 'q2',
          type: 'true_false',
          question: 'The sky is blue.',
          bloomsLevel: 'remember',
          difficulty: 'easy',
          points: 1,
          timeEstimate: 1,
          correctAnswer: true,
          explanation: 'The sky appears blue due to light scattering'
        } as any
      ];

      const submission = {
        studentId: 'student1',
        submissionId: 'sub1',
        responses: [
          { questionId: 'q1', response: '4', timeSpent: 30, attempts: 1 },
          { questionId: 'q2', response: true, timeSpent: 20, attempts: 1 }
        ],
        submissionTime: '2024-01-01T12:00:00Z',
        timeSpent: 5
      };

      const result = await grader.gradeSubmission('assessment1', questions, submission, gradingOptions);

      expect(result).toBeDefined();
      expect(result.assessmentId).toBe('assessment1');
      expect(result.studentId).toBe('student1');
      expect(result.questionResults).toHaveLength(2);
      expect(result.overallScore).toBe(2);
      expect(result.maxScore).toBe(2);
      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('should handle missing responses', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Test question',
          bloomsLevel: 'remember',
          difficulty: 'easy',
          points: 1,
          timeEstimate: 1
        } as any
      ];

      const submission = {
        studentId: 'student1',
        submissionId: 'sub1',
        responses: [], // No responses
        submissionTime: '2024-01-01T12:00:00Z',
        timeSpent: 5
      };

      const result = await grader.gradeSubmission('assessment1', questions, submission, gradingOptions);

      expect(result.questionResults).toHaveLength(1);
      expect(result.questionResults[0].score).toBe(0);
      expect(result.questionResults[0].feedback).toBe('No response provided');
    });
  });

  describe('gradeQuestion - Multiple Choice', () => {
    it('should correctly grade a multiple choice question', async () => {
      const question = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What is the capital of France?',
        options: ['London', 'Paris', 'Madrid', 'Rome'],
        correctAnswerIndex: 1,
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital of France',
        bloomsLevel: 'remember',
        difficulty: 'easy',
        points: 1,
        timeEstimate: 1
      } as any;

      const correctResponse = { questionId: 'q1', response: 'Paris', attempts: 1 };
      const incorrectResponse = { questionId: 'q1', response: 'London', attempts: 1 };

      const correctResult = await grader.gradeQuestion(question, correctResponse, gradingOptions);
      const incorrectResult = await grader.gradeQuestion(question, incorrectResponse, gradingOptions);

      expect(correctResult.isCorrect).toBe(true);
      expect(correctResult.score).toBe(1);
      expect(correctResult.feedback).toContain('Correct!');

      expect(incorrectResult.isCorrect).toBe(false);
      expect(incorrectResult.score).toBe(0);
      expect(incorrectResult.feedback).toContain('Incorrect');
      expect(incorrectResult.feedback).toContain('Paris');
    });
  });

  describe('gradeQuestion - True/False', () => {
    it('should correctly grade a true/false question', async () => {
      const question = {
        id: 'q1',
        type: 'true_false',
        question: 'Water freezes at 0°C.',
        correctAnswer: true,
        explanation: 'Water freezes at 0 degrees Celsius at standard pressure',
        bloomsLevel: 'remember',
        difficulty: 'easy',
        points: 1,
        timeEstimate: 1
      } as any;

      const correctResponse = { questionId: 'q1', response: true, attempts: 1 };
      const incorrectResponse = { questionId: 'q1', response: false, attempts: 1 };

      const correctResult = await grader.gradeQuestion(question, correctResponse, gradingOptions);
      const incorrectResult = await grader.gradeQuestion(question, incorrectResponse, gradingOptions);

      expect(correctResult.isCorrect).toBe(true);
      expect(correctResult.score).toBe(1);

      expect(incorrectResult.isCorrect).toBe(false);
      expect(incorrectResult.score).toBe(0);
    });
  });

  describe('gradeQuestion - Fill in Blank', () => {
    it('should correctly grade a fill-in-blank question', async () => {
      const question = {
        id: 'q1',
        type: 'fill_in_blank',
        question: 'Complete the sentence',
        questionWithBlanks: 'The capital of France is _____.',
        correctAnswers: ['Paris', 'paris'],
        caseSensitive: false,
        allowPartialCredit: true,
        bloomsLevel: 'remember',
        difficulty: 'easy',
        points: 1,
        timeEstimate: 2
      } as any;

      const correctResponse = { questionId: 'q1', response: 'Paris', attempts: 1 };
      const closeResponse = { questionId: 'q1', response: 'Pari', attempts: 1 };

      const correctResult = await grader.gradeQuestion(question, correctResponse, gradingOptions);
      const closeResult = await grader.gradeQuestion(question, closeResponse, gradingOptions);

      expect(correctResult.isCorrect).toBe(true);
      expect(correctResult.score).toBe(1);

      expect(closeResult.isCorrect).toBe(false);
      expect(closeResult.partialCredit).toBeGreaterThan(0);
    });
  });

  describe('gradeQuestion - Short Answer', () => {
    it('should grade short answer with AI when enabled', async () => {
      const mockGeminiClient = (grader as any).geminiClient;
      mockGeminiClient.gradeResponse.mockResolvedValue({
        score: 2,
        maxScore: 3,
        isCorrect: false,
        partialCredit: 0.67,
        feedback: 'Good understanding but missing key details',
        improvement: 'Include more specific examples'
      });

      const question = {
        id: 'q1',
        type: 'short_answer',
        question: 'Explain photosynthesis.',
        sampleAnswers: ['Photosynthesis is the process by which plants convert light energy into chemical energy.'],
        keyPoints: ['light energy', 'chemical energy', 'chlorophyll', 'carbon dioxide'],
        maxWords: 100,
        rubric: 'Award points for mentioning light energy conversion and key molecules',
        bloomsLevel: 'understand',
        difficulty: 'medium',
        points: 3,
        timeEstimate: 5
      } as any;

      const response = {
        questionId: 'q1',
        response: 'Plants use sunlight to make food through a process in their leaves.',
        attempts: 1
      };

      const result = await grader.gradeQuestion(question, response, gradingOptions);

      expect(result.score).toBe(2);
      expect(result.maxScore).toBe(3);
      expect(result.isCorrect).toBe(false);
      expect(result.partialCredit).toBe(0.67);
      expect(result.feedback).toContain('Good understanding');
    });

    it('should require manual grading when AI grading is disabled', async () => {
      const noAiOptions = { ...gradingOptions, aiGradingForSubjective: false };

      const question = {
        id: 'q1',
        type: 'short_answer',
        question: 'Explain something complex.',
        points: 5,
        timeEstimate: 10
      } as any;

      const response = { questionId: 'q1', response: 'Some answer', attempts: 1 };

      const result = await grader.gradeQuestion(question, response, noAiOptions);

      expect(result.score).toBe(0);
      expect(result.feedback).toContain('manual grading');
    });
  });

  describe('gradeBatch', () => {
    it('should grade multiple submissions in batch', async () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Test question',
          correctAnswer: 'A',
          bloomsLevel: 'remember',
          difficulty: 'easy',
          points: 1,
          timeEstimate: 1
        } as any
      ];

      const submissions = [
        {
          studentId: 'student1',
          submissionId: 'sub1',
          responses: [{ questionId: 'q1', response: 'A', attempts: 1 }],
          submissionTime: '2024-01-01T12:00:00Z',
          timeSpent: 3
        },
        {
          studentId: 'student2',
          submissionId: 'sub2',
          responses: [{ questionId: 'q1', response: 'B', attempts: 1 }],
          submissionTime: '2024-01-01T12:05:00Z',
          timeSpent: 4
        }
      ];

      const batchRequest = {
        assessmentId: 'assessment1',
        questions,
        studentSubmissions: submissions,
        options: gradingOptions
      };

      const result = await grader.gradeBatch(batchRequest);

      expect(result.assessmentId).toBe('assessment1');
      expect(result.results).toHaveLength(2);
      expect(result.metadata.totalSubmissions).toBe(2);
      expect(result.metadata.successfullyGraded).toBe(2);
    });
  });

  describe('validateConnection', () => {
    it('should validate grader connection', async () => {
      const result = await grader.validateConnection();
      expect(result).toBe(true);
    });
  });

  describe('getGraderInfo', () => {
    it('should return grader information', () => {
      const info = grader.getGraderInfo();

      expect(info).toBeDefined();
      expect(info.name).toBe('AutoGrader');
      expect(info.version).toBe('1.0.0');
      expect(info.supportedQuestionTypes).toContain('multiple_choice');
      expect(info.features).toContain('objective-auto-grading');
    });
  });
});
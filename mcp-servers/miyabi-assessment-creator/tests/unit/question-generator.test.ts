/**
 * Unit tests for QuestionGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionGenerator } from '../../src/lib/question-generator.js';
import { AssessmentInput } from '../../src/types/index.js';

// Mock Gemini Client
vi.mock('../../src/lib/gemini-client.js', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    generateStructuredContent: vi.fn(),
    validateConnection: vi.fn().mockResolvedValue(true),
    getModelInfo: vi.fn().mockReturnValue({ model: 'test-model' })
  }))
}));

describe('QuestionGenerator', () => {
  let generator: QuestionGenerator;
  let mockInput: AssessmentInput;

  beforeEach(() => {
    generator = new QuestionGenerator('test-api-key');
    mockInput = {
      topic: 'Machine Learning',
      learningObjectives: ['Understand supervised learning', 'Apply classification algorithms'],
      targetAudience: 'Computer Science students',
      difficulty: 'intermediate',
      assessmentType: 'summative',
      questionTypes: ['multiple_choice', 'short_answer'],
      questionCount: {
        total: 5
      },
      bloomsDistribution: {
        remember: 0.2,
        understand: 0.3,
        apply: 0.3,
        analyze: 0.1,
        evaluate: 0.05,
        create: 0.05
      },
      difficultyDistribution: {
        easy: 0.3,
        medium: 0.5,
        hard: 0.2,
        expert: 0.0
      }
    };
  });

  describe('generateQuestions', () => {
    it('should generate the requested number of questions', async () => {
      // Mock the Gemini client to return sample questions
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.generateStructuredContent.mockResolvedValue({
        id: 'test-question-1',
        type: 'short_answer',
        question: 'What is supervised learning?',
        sampleAnswers: ['Supervised learning is a type of machine learning that uses labeled training data.'],
        keyPoints: ['supervised', 'machine learning', 'labeled data'],
        rubric: 'Award full points for mentioning supervised learning and labeled data.',
        explanation: 'Supervised learning is a type of machine learning.',
        bloomsLevel: 'understand',
        difficulty: 'medium',
        points: 1,
        timeEstimate: 2
      });

      const result = await generator.generateQuestions(mockInput);

      expect(result).toBeDefined();
      expect(result.questions).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.requestedCount).toBe(5);
    });

    it('should distribute questions across specified types', async () => {
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.generateStructuredContent.mockResolvedValue({
        id: 'test-question',
        type: 'short_answer',
        question: 'Test question',
        sampleAnswers: ['Sample answer'],
        keyPoints: ['key point'],
        rubric: 'Test rubric',
        explanation: 'Test explanation',
        bloomsLevel: 'understand',
        difficulty: 'medium',
        points: 1,
        timeEstimate: 2
      });

      const result = await generator.generateQuestions(mockInput);

      expect(result.questions.length).toBeGreaterThan(0);
    });
  });

  describe('generateSingleQuestion', () => {
    it('should generate a single question with specified parameters', async () => {
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.generateStructuredContent.mockResolvedValue({
        id: 'test-question-1',
        type: 'multiple_choice',
        question: 'What is machine learning?',
        options: ['AI subset', 'Programming language', 'Database type', 'Network protocol'],
        correctAnswerIndex: 0,
        correctAnswer: 'AI subset',
        explanation: 'Machine learning is a subset of artificial intelligence.',
        bloomsLevel: 'understand',
        difficulty: 'medium',
        points: 2,
        timeEstimate: 3
      });

      const context = {
        topic: 'Machine Learning',
        learningObjectives: ['Understand ML concepts'],
        targetAudience: 'Students',
        difficulty: 'intermediate',
        language: 'en',
        tone: 'academic',
        assessmentType: 'summative'
      } as const;

      const question = await generator.generateSingleQuestion(
        'multiple_choice',
        'Understand ML concepts',
        'understand',
        'medium',
        'Introduction to machine learning fundamentals',
        context
      );

      expect(question).toBeDefined();
      expect(question.type).toBe('multiple_choice');
      expect(question.difficulty).toBe('medium');
      expect(question.bloomsLevel).toBe('understand');
    });

    it('should throw error for unsupported question type', async () => {
      const context = {
        topic: 'Test',
        learningObjectives: ['Test'],
        targetAudience: 'Students',
        difficulty: 'intermediate',
        language: 'en',
        tone: 'academic',
        assessmentType: 'summative'
      } as const;

      await expect(generator.generateSingleQuestion(
        'unsupported_type',
        'Test objective',
        'understand',
        'medium',
        'Test context',
        context
      )).rejects.toThrow('Unsupported question type: unsupported_type');
    });
  });

  describe('generateDistractors', () => {
    it('should generate plausible distractors for multiple choice questions', async () => {
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.generateStructuredContent.mockResolvedValue({
        distractors: [
          { text: 'Distractor 1', reasoning: 'Common misconception' },
          { text: 'Distractor 2', reasoning: 'Plausible alternative' },
          { text: 'Distractor 3', reasoning: 'Related concept' }
        ]
      });

      const distractors = await generator.generateDistractors(
        'What is supervised learning?',
        'A type of machine learning that uses labeled training data',
        'Machine Learning',
        'Computer Science students'
      );

      expect(distractors).toHaveLength(3);
      expect(distractors[0]).toBe('Distractor 1');
    });

    it('should return fallback distractors on error', async () => {
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.generateStructuredContent.mockRejectedValue(new Error('API Error'));

      const distractors = await generator.generateDistractors(
        'Test question?',
        'Correct answer',
        'Test topic',
        'Students'
      );

      expect(distractors).toHaveLength(3);
      expect(distractors).toEqual(['Option B', 'Option C', 'Option D']);
    });
  });

  describe('analyzeQuestionQuality', () => {
    it('should analyze question quality and return metrics', async () => {
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.generateStructuredContent.mockResolvedValue({
        qualityScore: 85,
        strengths: ['Clear question stem', 'Good alignment with objective'],
        improvements: ['Consider adding more complex distractors'],
        difficultyAlignment: true,
        bloomsAlignment: true,
        detailedFeedback: 'Overall well-constructed question'
      });

      const testQuestion = {
        id: 'test-1',
        type: 'multiple_choice' as const,
        question: 'What is machine learning?',
        bloomsLevel: 'understand' as const,
        difficulty: 'medium' as const,
        points: 1,
        timeEstimate: 2
      };

      const analysis = await generator.analyzeQuestionQuality(testQuestion);

      expect(analysis).toBeDefined();
      expect(analysis.qualityScore).toBe(85);
      expect(analysis.strengths).toHaveLength(2);
      expect(analysis.improvements).toHaveLength(1);
      expect(analysis.difficultyAlignment).toBe(true);
      expect(analysis.bloomsAlignment).toBe(true);
    });

    it('should return default analysis on error', async () => {
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.generateStructuredContent.mockRejectedValue(new Error('Analysis failed'));

      const testQuestion = {
        id: 'test-1',
        type: 'multiple_choice' as const,
        question: 'Test question?',
        bloomsLevel: 'remember' as const,
        difficulty: 'easy' as const,
        points: 1,
        timeEstimate: 1
      };

      const analysis = await generator.analyzeQuestionQuality(testQuestion);

      expect(analysis.qualityScore).toBe(75);
      expect(analysis.strengths).toContain('Question is clear and focused');
      expect(analysis.improvements).toContain('Could not perform detailed analysis');
    });
  });

  describe('validateConnection', () => {
    it('should validate API connection', async () => {
      const result = await generator.validateConnection();
      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      const mockGeminiClient = (generator as any).geminiClient;
      mockGeminiClient.validateConnection.mockRejectedValue(new Error('Connection failed'));

      const result = await generator.validateConnection();
      expect(result).toBe(false);
    });
  });

  describe('getGeneratorInfo', () => {
    it('should return generator information', () => {
      const info = generator.getGeneratorInfo();

      expect(info).toBeDefined();
      expect(info.name).toBe('QuestionGenerator');
      expect(info.version).toBe('1.0.0');
      expect(info.supportedTypes).toBeDefined();
      expect(info.features).toBeDefined();
      expect(info.modelInfo).toBeDefined();
    });
  });
});
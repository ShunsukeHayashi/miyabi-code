/**
 * AI-Powered Question Generation Engine
 * @module lib/question-generator
 */

import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { GeminiClient } from './gemini-client.js';
import {
  getQuestionTemplate,
  validateTemplateVariables,
  getAvailableQuestionTypes
} from './prompt-templates.js';
import {
  Question,
  QuestionSchema,
  AssessmentInput,
  GenerationContext,
  BloomsTaxonomyLevel,
  CognitiveDifficulty,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  ShortAnswerQuestion,
  EssayQuestion,
  CodingChallengeQuestion,
  CaseStudyQuestion
} from '../types/index.js';

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
      filename: 'question-generator.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

export interface QuestionGenerationRequest {
  type: string;
  learningObjective: string;
  bloomsLevel: string;
  difficulty: string;
  contentContext: string;
  count?: number;
}

export interface QuestionGenerationResult {
  questions: Question[];
  metadata: {
    generatedCount: number;
    requestedCount: number;
    successRate: number;
    averageGenerationTime: number;
    errors: string[];
  };
}

export class QuestionGenerator {
  private geminiClient: GeminiClient;

  constructor(geminiApiKey: string) {
    this.geminiClient = new GeminiClient(geminiApiKey, {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.3, // Lower temperature for consistent question quality
      maxTokens: 4096
    });

    logger.info('QuestionGenerator initialized', {
      supportedTypes: getAvailableQuestionTypes()
    });
  }

  /**
   * Generate questions based on assessment input
   */
  async generateQuestions(input: AssessmentInput): Promise<QuestionGenerationResult> {
    const startTime = Date.now();
    const generatedQuestions: Question[] = [];
    const errors: string[] = [];

    try {
      logger.info('Starting question generation', {
        topic: input.topic,
        totalQuestions: input.questionCount.total,
        questionTypes: input.questionTypes
      });

      const context = this.buildGenerationContext(input);
      const questionRequests = this.buildQuestionRequests(input, context);

      // Generate questions in batches by type
      const questionsByType = this.groupRequestsByType(questionRequests);

      for (const [questionType, requests] of questionsByType) {
        try {
          logger.debug('Generating questions of type', {
            type: questionType,
            count: requests.length
          });

          const typeResults = await this.generateQuestionBatch(requests, context);
          generatedQuestions.push(...typeResults.questions);
          errors.push(...typeResults.errors);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error('Failed to generate questions for type', {
            type: questionType,
            error: errorMsg
          });
          errors.push(`${questionType}: ${errorMsg}`);
        }
      }

      // Post-process and validate questions
      const validatedQuestions = await this.validateAndEnhanceQuestions(generatedQuestions);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const result: QuestionGenerationResult = {
        questions: validatedQuestions,
        metadata: {
          generatedCount: validatedQuestions.length,
          requestedCount: input.questionCount.total,
          successRate: validatedQuestions.length / input.questionCount.total,
          averageGenerationTime: totalTime / Math.max(validatedQuestions.length, 1),
          errors
        }
      };

      logger.info('Question generation completed', {
        requested: input.questionCount.total,
        generated: validatedQuestions.length,
        successRate: `${Math.round(result.metadata.successRate * 100)}%`,
        totalTimeMs: totalTime,
        errorsCount: errors.length
      });

      return result;

    } catch (error) {
      logger.error('Question generation failed', {
        topic: input.topic,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Question generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a single question of specified type
   */
  async generateSingleQuestion(
    type: string,
    learningObjective: string,
    bloomsLevel: string,
    difficulty: string,
    contentContext: string,
    context: GenerationContext
  ): Promise<Question> {
    const template = getQuestionTemplate(type);
    if (!template) {
      throw new Error(`Unsupported question type: ${type}`);
    }

    const variables = {
      topic: context.topic,
      learningObjective,
      targetAudience: context.targetAudience,
      difficulty,
      bloomsLevel,
      contentContext,
      programmingLanguage: 'javascript' // Default, can be made configurable
    };

    const validation = validateTemplateVariables(template, variables);
    if (!validation.valid) {
      throw new Error(`Missing template variables: ${validation.missing.join(', ')}`);
    }

    try {
      const generatedQuestion = await this.geminiClient.generateStructuredContent<Question>(
        template,
        variables,
        QuestionSchema
      );

      // Ensure the question has required fields
      const enhancedQuestion = this.enhanceQuestion(generatedQuestion, type, difficulty, bloomsLevel);

      logger.debug('Single question generated', {
        type,
        difficulty,
        bloomsLevel,
        questionId: enhancedQuestion.id
      });

      return enhancedQuestion;

    } catch (error) {
      logger.error('Failed to generate single question', {
        type,
        learningObjective,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate optimized distractors for multiple choice questions
   */
  async generateDistractors(
    question: string,
    correctAnswer: string,
    topic: string,
    targetAudience: string,
    existingOptions: string[] = []
  ): Promise<string[]> {
    const distractorPrompt = `
Generate 3 effective distractors for this multiple choice question.

Question: ${question}
Correct Answer: ${correctAnswer}
Topic: ${topic}
Target Audience: ${targetAudience}
Existing Options: ${existingOptions.join(', ')}

Requirements:
1. Each distractor should be plausible but incorrect
2. Base distractors on common misconceptions or errors
3. Ensure distractors are similar in length/format to correct answer
4. Avoid obviously wrong answers
5. Make distractors challenging but fair

Respond with JSON:
{
  "distractors": [
    {"text": "Distractor 1", "reasoning": "Why this is effective"},
    {"text": "Distractor 2", "reasoning": "Why this is effective"},
    {"text": "Distractor 3", "reasoning": "Why this is effective"}
  ]
}`;

    try {
      const result = await this.geminiClient.generateStructuredContent<{
        distractors: Array<{text: string; reasoning: string}>
      }>({
        name: 'distractor_generation',
        template: distractorPrompt,
        variables: []
      }, {});

      return result.distractors.map(d => d.text);

    } catch (error) {
      logger.error('Failed to generate distractors', {
        question: question.substring(0, 100),
        error: error instanceof Error ? error.message : String(error)
      });

      // Fallback to basic distractors
      return ['Option B', 'Option C', 'Option D'];
    }
  }

  /**
   * Analyze question difficulty and suggest improvements
   */
  async analyzeQuestionQuality(question: Question): Promise<{
    qualityScore: number;
    strengths: string[];
    improvements: string[];
    difficultyAlignment: boolean;
    bloomsAlignment: boolean;
  }> {
    const analysisPrompt = `
Analyze this educational question for quality and alignment.

Question: ${JSON.stringify(question, null, 2)}

Evaluate these aspects:
1. Clarity and unambiguity of the question
2. Alignment with stated difficulty level
3. Alignment with Bloom's taxonomy level
4. Effectiveness of answer options (for MC questions)
5. Educational value and relevance

Provide analysis as JSON:
{
  "qualityScore": <0-100 score>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "difficultyAlignment": true/false,
  "bloomsAlignment": true/false,
  "detailedFeedback": "Comprehensive feedback on question quality"
}`;

    try {
      const analysis = await this.geminiClient.generateStructuredContent<{
        qualityScore: number;
        strengths: string[];
        improvements: string[];
        difficultyAlignment: boolean;
        bloomsAlignment: boolean;
        detailedFeedback: string;
      }>({
        name: 'question_quality_analysis',
        template: analysisPrompt,
        variables: []
      }, {});

      logger.debug('Question quality analyzed', {
        questionId: question.id,
        qualityScore: analysis.qualityScore,
        difficultyAlignment: analysis.difficultyAlignment,
        bloomsAlignment: analysis.bloomsAlignment
      });

      return analysis;

    } catch (error) {
      logger.error('Failed to analyze question quality', {
        questionId: question.id,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return default analysis
      return {
        qualityScore: 75,
        strengths: ['Question is clear and focused'],
        improvements: ['Could not perform detailed analysis'],
        difficultyAlignment: true,
        bloomsAlignment: true
      };
    }
  }

  /**
   * Build generation context from assessment input
   */
  private buildGenerationContext(input: AssessmentInput): GenerationContext {
    return {
      topic: input.topic,
      learningObjectives: input.learningObjectives,
      targetAudience: input.targetAudience,
      difficulty: input.difficulty,
      language: input.preferences?.language || 'en',
      tone: input.preferences?.tone || 'academic',
      assessmentType: input.assessmentType
    };
  }

  /**
   * Build individual question generation requests
   */
  private buildQuestionRequests(
    input: AssessmentInput,
    context: GenerationContext
  ): QuestionGenerationRequest[] {
    const requests: QuestionGenerationRequest[] = [];

    // Calculate questions per type
    const totalQuestions = input.questionCount.total;
    const questionTypes = input.questionTypes;
    const questionsPerType = Math.floor(totalQuestions / questionTypes.length);
    const remainder = totalQuestions % questionTypes.length;

    for (let i = 0; i < questionTypes.length; i++) {
      const type = questionTypes[i];
      const count = questionsPerType + (i < remainder ? 1 : 0);

      // Generate requests for each question of this type
      for (let j = 0; j < count; j++) {
        const bloomsLevel = this.selectBloomsLevel(input.bloomsDistribution);
        const difficulty = this.selectDifficulty(input.difficultyDistribution);
        const learningObjective = this.selectLearningObjective(input.learningObjectives);
        const contentContext = this.buildContentContext(input, learningObjective);

        requests.push({
          type,
          learningObjective,
          bloomsLevel,
          difficulty,
          contentContext
        });
      }
    }

    return requests;
  }

  /**
   * Group generation requests by question type
   */
  private groupRequestsByType(
    requests: QuestionGenerationRequest[]
  ): Map<string, QuestionGenerationRequest[]> {
    const groups = new Map<string, QuestionGenerationRequest[]>();

    for (const request of requests) {
      if (!groups.has(request.type)) {
        groups.set(request.type, []);
      }
      groups.get(request.type)!.push(request);
    }

    return groups;
  }

  /**
   * Generate a batch of questions of the same type
   */
  private async generateQuestionBatch(
    requests: QuestionGenerationRequest[],
    context: GenerationContext
  ): Promise<{ questions: Question[]; errors: string[] }> {
    const questions: Question[] = [];
    const errors: string[] = [];

    // Process requests in smaller batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const batchPromises = batch.map(async (request) => {
        try {
          const question = await this.generateSingleQuestion(
            request.type,
            request.learningObjective,
            request.bloomsLevel,
            request.difficulty,
            request.contentContext,
            context
          );
          return { question, error: null };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          return { question: null, error: `${request.type}: ${errorMsg}` };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.question) {
          questions.push(result.question);
        } else if (result.error) {
          errors.push(result.error);
        }
      }

      // Rate limiting delay between batches
      if (i + batchSize < requests.length) {
        await this.delay(1500);
      }
    }

    return { questions, errors };
  }

  /**
   * Validate and enhance generated questions
   */
  private async validateAndEnhanceQuestions(questions: Question[]): Promise<Question[]> {
    const validatedQuestions: Question[] = [];

    for (const question of questions) {
      try {
        // Validate against schema
        const validated = QuestionSchema.parse(question);

        // Enhance question with additional metadata
        const enhanced = this.enhanceQuestion(
          validated,
          validated.type,
          validated.difficulty,
          validated.bloomsLevel
        );

        validatedQuestions.push(enhanced);
      } catch (error) {
        logger.warn('Question validation failed', {
          questionId: question.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return validatedQuestions;
  }

  /**
   * Enhance question with additional metadata and ensure required fields
   */
  private enhanceQuestion(
    question: any,
    type: string,
    difficulty: string,
    bloomsLevel: string
  ): Question {
    // Ensure ID is present
    if (!question.id) {
      question.id = uuidv4();
    }

    // Set standard fields
    question.type = type;
    question.difficulty = difficulty;
    question.bloomsLevel = bloomsLevel;

    // Add default values for optional fields
    if (!question.points) {
      question.points = this.getDefaultPoints(type);
    }

    if (!question.timeEstimate) {
      question.timeEstimate = this.getDefaultTimeEstimate(type);
    }

    if (!question.tags) {
      question.tags = [type, difficulty, bloomsLevel];
    }

    return question as Question;
  }

  /**
   * Select Bloom's level based on distribution
   */
  private selectBloomsLevel(distribution?: Record<string, number>): string {
    if (!distribution) {
      const levels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
      return levels[Math.floor(Math.random() * levels.length)];
    }

    const random = Math.random();
    let cumulative = 0;

    for (const [level, probability] of Object.entries(distribution)) {
      cumulative += probability;
      if (random <= cumulative) {
        return level;
      }
    }

    return 'understand'; // fallback
  }

  /**
   * Select difficulty based on distribution
   */
  private selectDifficulty(distribution?: Record<string, number>): string {
    if (!distribution) {
      const difficulties = ['easy', 'medium', 'hard'];
      return difficulties[Math.floor(Math.random() * difficulties.length)];
    }

    const random = Math.random();
    let cumulative = 0;

    for (const [difficulty, probability] of Object.entries(distribution)) {
      cumulative += probability;
      if (random <= cumulative) {
        return difficulty;
      }
    }

    return 'medium'; // fallback
  }

  /**
   * Select learning objective
   */
  private selectLearningObjective(objectives: string[]): string {
    return objectives[Math.floor(Math.random() * objectives.length)];
  }

  /**
   * Build content context for question generation
   */
  private buildContentContext(input: AssessmentInput, learningObjective: string): string {
    let context = `Learning Objective: ${learningObjective}\n`;

    if (input.contentSource?.externalContent) {
      context += `Content Context: ${input.contentSource.externalContent}\n`;
    }

    context += `Assessment Type: ${input.assessmentType}\n`;
    context += `Target Audience: ${input.targetAudience}\n`;

    return context;
  }

  /**
   * Get default points for question type
   */
  private getDefaultPoints(type: string): number {
    const pointMap: Record<string, number> = {
      'multiple_choice': 1,
      'true_false': 1,
      'fill_in_blank': 1,
      'short_answer': 3,
      'essay': 10,
      'coding_challenge': 10,
      'matching': 2,
      'ordering': 2,
      'case_study': 15
    };

    return pointMap[type] || 1;
  }

  /**
   * Get default time estimate for question type
   */
  private getDefaultTimeEstimate(type: string): number {
    const timeMap: Record<string, number> = {
      'multiple_choice': 2,
      'true_false': 1,
      'fill_in_blank': 2,
      'short_answer': 5,
      'essay': 20,
      'coding_challenge': 15,
      'matching': 3,
      'ordering': 3,
      'case_study': 25
    };

    return timeMap[type] || 2;
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      return await this.geminiClient.validateConnection();
    } catch (error) {
      logger.error('Question generator connection validation failed', { error });
      return false;
    }
  }

  /**
   * Get generator information
   */
  getGeneratorInfo() {
    return {
      name: 'QuestionGenerator',
      version: '1.0.0',
      supportedTypes: getAvailableQuestionTypes(),
      features: [
        'intelligent-question-generation',
        'blooms-taxonomy-alignment',
        'difficulty-calibration',
        'distractor-generation',
        'quality-analysis',
        'batch-processing'
      ],
      modelInfo: this.geminiClient.getModelInfo()
    };
  }
}
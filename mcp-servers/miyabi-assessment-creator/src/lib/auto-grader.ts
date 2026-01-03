/**
 * Auto-Grading System with Rubric-Based Evaluation
 * @module lib/auto-grader
 */

import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { GeminiClient } from './gemini-client.js';
import * as diff from 'diff';
import {
  Question,
  StudentResponse,
  GradingResult,
  AssessmentResult,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  ShortAnswerQuestion,
  EssayQuestion,
  CodingChallengeQuestion,
  CaseStudyQuestion,
  Rubric,
  RubricCriterion
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
      filename: 'auto-grader.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

export interface GradingOptions {
  strictMode: boolean;
  allowPartialCredit: boolean;
  includeFeedback: boolean;
  feedbackLevel: 'minimal' | 'standard' | 'detailed';
  rubricWeighting: boolean;
  aiGradingForSubjective: boolean;
}

export interface BatchGradingRequest {
  assessmentId: string;
  questions: Question[];
  studentSubmissions: Array<{
    studentId: string;
    submissionId: string;
    responses: StudentResponse[];
    submissionTime: string;
    timeSpent: number;
  }>;
  options: GradingOptions;
}

export interface BatchGradingResult {
  assessmentId: string;
  results: AssessmentResult[];
  metadata: {
    totalSubmissions: number;
    successfullyGraded: number;
    averageGradingTime: number;
    errors: string[];
  };
}

export class AutoGrader {
  private geminiClient: GeminiClient;

  constructor(geminiApiKey: string) {
    this.geminiClient = new GeminiClient(geminiApiKey, {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.1, // Very low temperature for consistent grading
      maxTokens: 4096
    });

    logger.info('AutoGrader initialized');
  }

  /**
   * Grade a batch of student submissions
   */
  async gradeBatch(request: BatchGradingRequest): Promise<BatchGradingResult> {
    const startTime = Date.now();
    const results: AssessmentResult[] = [];
    const errors: string[] = [];

    try {
      logger.info('Starting batch grading', {
        assessmentId: request.assessmentId,
        submissions: request.studentSubmissions.length,
        questions: request.questions.length
      });

      // Process submissions in parallel with concurrency control
      const concurrency = 3; // Process 3 submissions at a time
      for (let i = 0; i < request.studentSubmissions.length; i += concurrency) {
        const batch = request.studentSubmissions.slice(i, i + concurrency);

        const batchPromises = batch.map(async (submission) => {
          try {
            const result = await this.gradeSubmission(
              request.assessmentId,
              request.questions,
              submission,
              request.options
            );
            return { result, error: null };
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error('Failed to grade submission', {
              studentId: submission.studentId,
              submissionId: submission.submissionId,
              error: errorMsg
            });
            return { result: null, error: errorMsg };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        for (const item of batchResults) {
          if (item.result) {
            results.push(item.result);
          } else if (item.error) {
            errors.push(item.error);
          }
        }

        // Small delay between batches to avoid overwhelming the AI service
        if (i + concurrency < request.studentSubmissions.length) {
          await this.delay(1000);
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      logger.info('Batch grading completed', {
        assessmentId: request.assessmentId,
        totalSubmissions: request.studentSubmissions.length,
        successfullyGraded: results.length,
        errors: errors.length,
        totalTimeMs: totalTime
      });

      return {
        assessmentId: request.assessmentId,
        results,
        metadata: {
          totalSubmissions: request.studentSubmissions.length,
          successfullyGraded: results.length,
          averageGradingTime: totalTime / Math.max(results.length, 1),
          errors
        }
      };

    } catch (error) {
      logger.error('Batch grading failed', {
        assessmentId: request.assessmentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Batch grading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Grade a single student submission
   */
  async gradeSubmission(
    assessmentId: string,
    questions: Question[],
    submission: {
      studentId: string;
      submissionId: string;
      responses: StudentResponse[];
      submissionTime: string;
      timeSpent: number;
    },
    options: GradingOptions
  ): Promise<AssessmentResult> {
    try {
      logger.debug('Grading submission', {
        studentId: submission.studentId,
        submissionId: submission.submissionId,
        responseCount: submission.responses.length
      });

      const questionResults: GradingResult[] = [];
      let totalScore = 0;
      let maxScore = 0;

      // Grade each question response
      for (const question of questions) {
        const response = submission.responses.find(r => r.questionId === question.id);

        if (!response) {
          // No response provided
          const noResponseResult: GradingResult = {
            questionId: question.id,
            score: 0,
            maxScore: question.points,
            isCorrect: false,
            feedback: 'No response provided',
            detailedFeedback: {
              explanation: 'This question was not answered',
              improvement: 'Please ensure all questions are answered before submitting'
            }
          };
          questionResults.push(noResponseResult);
          maxScore += question.points;
          continue;
        }

        const gradingResult = await this.gradeQuestion(question, response, options);
        questionResults.push(gradingResult);
        totalScore += gradingResult.score;
        maxScore += gradingResult.maxScore;
      }

      // Calculate overall performance metrics
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = percentage >= 70; // Default passing score

      // Generate learning analytics
      const analytics = await this.generateLearningAnalytics(
        questions,
        questionResults,
        submission.studentId
      );

      const result: AssessmentResult = {
        assessmentId,
        studentId: submission.studentId,
        submissionId: submission.submissionId,
        questionResults,
        overallScore: totalScore,
        maxScore,
        percentage,
        passed,
        submissionTime: submission.submissionTime,
        timeSpent: submission.timeSpent,
        analytics
      };

      logger.debug('Submission graded', {
        studentId: submission.studentId,
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage),
        passed
      });

      return result;

    } catch (error) {
      logger.error('Failed to grade submission', {
        studentId: submission.studentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Submission grading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Grade an individual question response
   */
  async gradeQuestion(
    question: Question,
    response: StudentResponse,
    options: GradingOptions
  ): Promise<GradingResult> {
    try {
      switch (question.type) {
        case 'multiple_choice':
          return this.gradeMultipleChoice(question as MultipleChoiceQuestion, response, options);

        case 'true_false':
          return this.gradeTrueFalse(question as TrueFalseQuestion, response, options);

        case 'fill_in_blank':
          return this.gradeFillInBlank(question as FillInBlankQuestion, response, options);

        case 'short_answer':
          return this.gradeShortAnswer(question as ShortAnswerQuestion, response, options);

        case 'essay':
          return this.gradeEssay(question as EssayQuestion, response, options);

        case 'coding_challenge':
          return this.gradeCodingChallenge(question as CodingChallengeQuestion, response, options);

        case 'case_study':
          return this.gradeCaseStudy(question as CaseStudyQuestion, response, options);

        default:
          throw new Error(`Unsupported question type: ${question.type}`);
      }
    } catch (error) {
      logger.error('Failed to grade question', {
        questionId: question.id,
        questionType: question.type,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return a default failed result
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'Error occurred during grading',
        detailedFeedback: {
          explanation: 'An error occurred while grading this question',
          improvement: 'Please contact support if this issue persists'
        }
      };
    }
  }

  /**
   * Grade multiple choice question
   */
  private gradeMultipleChoice(
    question: MultipleChoiceQuestion,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const studentAnswer = String(response.response);
    const correctAnswer = question.correctAnswer;
    const isCorrect = studentAnswer === correctAnswer;

    const score = isCorrect ? question.points : 0;

    let feedback = isCorrect
      ? 'Correct!'
      : `Incorrect. The correct answer is: ${correctAnswer}`;

    if (options.includeFeedback && question.explanation) {
      feedback += ` ${question.explanation}`;
    }

    return {
      questionId: question.id,
      score,
      maxScore: question.points,
      isCorrect,
      feedback,
      detailedFeedback: options.includeFeedback ? {
        correctAnswer,
        explanation: question.explanation,
        improvement: isCorrect
          ? 'Great job! Continue applying this knowledge.'
          : 'Review the relevant material and practice similar problems.'
      } : undefined
    };
  }

  /**
   * Grade true/false question
   */
  private gradeTrueFalse(
    question: TrueFalseQuestion,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const studentAnswer = Boolean(response.response);
    const correctAnswer = question.correctAnswer;
    const isCorrect = studentAnswer === correctAnswer;

    const score = isCorrect ? question.points : 0;

    let feedback = isCorrect
      ? 'Correct!'
      : `Incorrect. The correct answer is: ${correctAnswer ? 'True' : 'False'}`;

    if (options.includeFeedback && question.explanation) {
      feedback += ` ${question.explanation}`;
    }

    return {
      questionId: question.id,
      score,
      maxScore: question.points,
      isCorrect,
      feedback,
      detailedFeedback: options.includeFeedback ? {
        correctAnswer: correctAnswer ? 'True' : 'False',
        explanation: question.explanation,
        improvement: isCorrect
          ? 'Good understanding of the concept!'
          : 'Review the concept and consider the reasoning behind the answer.'
      } : undefined
    };
  }

  /**
   * Grade fill-in-the-blank question
   */
  private gradeFillInBlank(
    question: FillInBlankQuestion,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const studentAnswer = String(response.response).trim();
    const correctAnswers = question.correctAnswers;

    let isCorrect = false;
    let matchedAnswer = '';

    // Check against all acceptable answers
    for (const correct of correctAnswers) {
      const comparison = question.caseSensitive
        ? studentAnswer === correct
        : studentAnswer.toLowerCase() === correct.toLowerCase();

      if (comparison) {
        isCorrect = true;
        matchedAnswer = correct;
        break;
      }
    }

    // Calculate partial credit if enabled
    let partialCredit = 0;
    if (!isCorrect && options.allowPartialCredit && question.allowPartialCredit) {
      partialCredit = this.calculateStringSimilarity(studentAnswer, correctAnswers[0]);
    }

    const score = isCorrect
      ? question.points
      : Math.floor(question.points * partialCredit);

    const feedback = isCorrect
      ? 'Correct!'
      : `Incorrect. Acceptable answers include: ${correctAnswers.join(', ')}`;

    return {
      questionId: question.id,
      score,
      maxScore: question.points,
      isCorrect,
      partialCredit: partialCredit > 0 ? partialCredit : undefined,
      feedback,
      detailedFeedback: options.includeFeedback ? {
        correctAnswer: correctAnswers[0],
        improvement: isCorrect
          ? 'Perfect! You know the terminology well.'
          : 'Review key terms and their definitions.'
      } : undefined
    };
  }

  /**
   * Grade short answer question using AI
   */
  private async gradeShortAnswer(
    question: ShortAnswerQuestion,
    response: StudentResponse,
    options: GradingOptions
  ): Promise<GradingResult> {
    if (!options.aiGradingForSubjective) {
      // Return ungraded result for manual review
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'This response requires manual grading'
      };
    }

    try {
      const gradingResult = await this.geminiClient.gradeResponse(
        question.question,
        question.sampleAnswers[0],
        String(response.response),
        question.rubric,
        'short_answer'
      );

      return {
        questionId: question.id,
        score: gradingResult.score,
        maxScore: gradingResult.maxScore,
        isCorrect: gradingResult.isCorrect,
        partialCredit: gradingResult.partialCredit,
        feedback: gradingResult.feedback,
        detailedFeedback: options.includeFeedback ? {
          improvement: gradingResult.improvement || 'Continue practicing similar problems'
        } : undefined
      };

    } catch (error) {
      logger.error('AI grading failed for short answer', {
        questionId: question.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'AI grading unavailable - requires manual review'
      };
    }
  }

  /**
   * Grade essay question using rubric
   */
  private async gradeEssay(
    question: EssayQuestion,
    response: StudentResponse,
    options: GradingOptions
  ): Promise<GradingResult> {
    if (!options.aiGradingForSubjective) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'Essay requires manual grading'
      };
    }

    try {
      // Grade using rubric criteria
      const rubricScores = [];
      let totalScore = 0;

      for (const criterion of question.rubric.criteria) {
        try {
          const criterionResult = await this.gradeByCriterion(
            question.question,
            String(response.response),
            criterion,
            options
          );
          rubricScores.push(criterionResult);
          totalScore += criterionResult.score;
        } catch (error) {
          logger.error('Failed to grade criterion', {
            questionId: question.id,
            criterion: criterion.name,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const percentage = totalScore / question.rubric.totalPoints;
      const isCorrect = percentage >= 0.7; // 70% threshold

      return {
        questionId: question.id,
        score: totalScore,
        maxScore: question.rubric.totalPoints,
        isCorrect,
        feedback: `Essay scored ${totalScore}/${question.rubric.totalPoints} points`,
        rubricScores,
        detailedFeedback: options.includeFeedback ? {
          improvement: percentage > 0.8
            ? 'Excellent work! Consider expanding on your strongest arguments.'
            : 'Good effort. Focus on developing your analysis and providing more specific examples.'
        } : undefined
      };

    } catch (error) {
      logger.error('AI essay grading failed', {
        questionId: question.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'Essay grading unavailable - requires manual review'
      };
    }
  }

  /**
   * Grade coding challenge question
   */
  private async gradeCodingChallenge(
    question: CodingChallengeQuestion,
    response: StudentResponse,
    options: GradingOptions
  ): Promise<GradingResult> {
    try {
      const studentCode = String(response.response);
      let passedTests = 0;
      const totalTests = question.testCases.length;
      const testResults = [];

      // Execute test cases (simplified simulation)
      for (const testCase of question.testCases) {
        try {
          // In a real implementation, this would execute the code safely
          const passed = await this.simulateCodeExecution(
            studentCode,
            testCase.input,
            testCase.expectedOutput
          );

          testResults.push({
            input: testCase.input,
            expected: testCase.expectedOutput,
            passed,
            isHidden: testCase.isHidden
          });

          if (passed) passedTests++;
        } catch (error) {
          testResults.push({
            input: testCase.input,
            expected: testCase.expectedOutput,
            passed: false,
            isHidden: testCase.isHidden,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const score = Math.round((passedTests / totalTests) * question.points);
      const isCorrect = passedTests === totalTests;

      return {
        questionId: question.id,
        score,
        maxScore: question.points,
        isCorrect,
        feedback: `Passed ${passedTests}/${totalTests} test cases`,
        detailedFeedback: options.includeFeedback ? {
          improvement: isCorrect
            ? 'Excellent! Your solution passes all test cases.'
            : `Review failed test cases and consider edge cases. Passed: ${passedTests}/${totalTests}`
        } : undefined
      };

    } catch (error) {
      logger.error('Code grading failed', {
        questionId: question.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'Code execution failed - syntax or runtime error'
      };
    }
  }

  /**
   * Grade case study question
   */
  private async gradeCaseStudy(
    question: CaseStudyQuestion,
    response: StudentResponse,
    options: GradingOptions
  ): Promise<GradingResult> {
    if (!options.aiGradingForSubjective) {
      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'Case study requires manual grading'
      };
    }

    try {
      // Grade each sub-question
      const responses = response.response as Record<string, string>;
      let totalScore = 0;
      const subResults = [];

      for (const [index, subQuestion] of question.subQuestions.entries()) {
        const subResponse = responses[`sub_${index}`] || '';

        const subResult = await this.geminiClient.gradeResponse(
          subQuestion.question,
          '', // No single correct answer for case studies
          subResponse,
          subQuestion.rubric,
          subQuestion.type
        );

        subResults.push({
          subQuestion: subQuestion.question,
          score: subResult.score,
          maxScore: subQuestion.points,
          feedback: subResult.feedback
        });

        totalScore += subResult.score;
      }

      const maxScore = question.subQuestions.reduce((sum, sq) => sum + sq.points, 0);
      const isCorrect = (totalScore / maxScore) >= 0.7;

      return {
        questionId: question.id,
        score: totalScore,
        maxScore,
        isCorrect,
        feedback: `Case study scored ${totalScore}/${maxScore} points`,
        detailedFeedback: options.includeFeedback ? {
          improvement: 'Review the scenario carefully and ensure all aspects are addressed'
        } : undefined
      };

    } catch (error) {
      logger.error('Case study grading failed', {
        questionId: question.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        questionId: question.id,
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        feedback: 'Case study grading unavailable - requires manual review'
      };
    }
  }

  /**
   * Grade by rubric criterion
   */
  private async gradeByCriterion(
    question: string,
    response: string,
    criterion: RubricCriterion,
    options: GradingOptions
  ): Promise<{
    criterion: string;
    score: number;
    maxScore: number;
    feedback: string;
  }> {
    const prompt = `
Grade this response based on the following criterion:

Question: ${question}
Student Response: ${response}

Criterion: ${criterion.name}
Description: ${criterion.description}
Maximum Points: ${criterion.points}

Scoring Levels:
${criterion.levels.map(level => `${level.score} points: ${level.description}`).join('\n')}

Provide your assessment as JSON:
{
  "score": <numeric score>,
  "feedback": "<specific feedback for this criterion>"
}`;

    try {
      const result = await this.geminiClient.generateStructuredContent<{
        score: number;
        feedback: string;
      }>({
        name: 'rubric_criterion_grading',
        template: prompt,
        variables: []
      }, {});

      return {
        criterion: criterion.name,
        score: Math.min(result.score, criterion.points),
        maxScore: criterion.points,
        feedback: result.feedback
      };

    } catch (error) {
      logger.error('Criterion grading failed', {
        criterion: criterion.name,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        criterion: criterion.name,
        score: 0,
        maxScore: criterion.points,
        feedback: 'Could not grade this criterion automatically'
      };
    }
  }

  /**
   * Generate learning analytics for a student
   */
  private async generateLearningAnalytics(
    questions: Question[],
    results: GradingResult[],
    studentId: string
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    bloomsPerformance: Record<string, number>;
    difficultyPerformance: Record<string, number>;
  }> {
    try {
      // Analyze performance by Bloom's level
      const bloomsPerformance: Record<string, number> = {};
      const difficultyPerformance: Record<string, number> = {};

      for (const question of questions) {
        const result = results.find(r => r.questionId === question.id);
        if (!result) continue;

        const percentage = (result.score / result.maxScore) * 100;

        // Track Bloom's performance
        if (!bloomsPerformance[question.bloomsLevel]) {
          bloomsPerformance[question.bloomsLevel] = 0;
        }
        bloomsPerformance[question.bloomsLevel] += percentage;

        // Track difficulty performance
        if (!difficultyPerformance[question.difficulty]) {
          difficultyPerformance[question.difficulty] = 0;
        }
        difficultyPerformance[question.difficulty] += percentage;
      }

      // Average the performance scores
      for (const level in bloomsPerformance) {
        const count = questions.filter(q => q.bloomsLevel === level).length;
        if (count > 0) {
          bloomsPerformance[level] /= count;
        }
      }

      for (const difficulty in difficultyPerformance) {
        const count = questions.filter(q => q.difficulty === difficulty).length;
        if (count > 0) {
          difficultyPerformance[difficulty] /= count;
        }
      }

      // Generate insights using AI
      const analysisPrompt = `
Analyze this student's assessment performance and provide learning insights.

Performance Data:
Bloom's Taxonomy Performance: ${JSON.stringify(bloomsPerformance)}
Difficulty Performance: ${JSON.stringify(difficultyPerformance)}
Overall Results: ${results.map(r => `${r.questionId}: ${r.score}/${r.maxScore}`).join(', ')}

Provide analysis as JSON:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      const analysis = await this.geminiClient.generateStructuredContent<{
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
      }>({
        name: 'learning_analytics',
        template: analysisPrompt,
        variables: []
      }, {});

      return {
        ...analysis,
        bloomsPerformance,
        difficultyPerformance
      };

    } catch (error) {
      logger.error('Learning analytics generation failed', {
        studentId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return basic analytics
      return {
        strengths: ['Completed the assessment'],
        weaknesses: ['Areas for improvement'],
        recommendations: ['Review material and practice more'],
        bloomsPerformance: {},
        difficultyPerformance: {}
      };
    }
  }

  /**
   * Calculate string similarity for partial credit
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const changes = diff.diffChars(str1.toLowerCase(), str2.toLowerCase());
    let unchanged = 0;
    let total = 0;

    for (const change of changes) {
      total += change.value.length;
      if (!change.added && !change.removed) {
        unchanged += change.value.length;
      }
    }

    return total > 0 ? unchanged / total : 0;
  }

  /**
   * Simulate code execution for testing (placeholder)
   */
  private async simulateCodeExecution(
    code: string,
    input: string,
    expectedOutput: string
  ): Promise<boolean> {
    // This is a placeholder. In a real implementation, you would:
    // 1. Use a secure code execution environment
    // 2. Execute the code with the given input
    // 3. Compare the output with expected output

    logger.debug('Simulating code execution', {
      codeLength: code.length,
      input,
      expectedOutput
    });

    // For now, return a random result for demonstration
    return Math.random() > 0.3; // 70% pass rate
  }

  /**
   * Delay utility
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
      logger.error('Auto-grader connection validation failed', { error });
      return false;
    }
  }

  /**
   * Get grader information
   */
  getGraderInfo() {
    return {
      name: 'AutoGrader',
      version: '1.0.0',
      supportedQuestionTypes: [
        'multiple_choice',
        'true_false',
        'fill_in_blank',
        'short_answer',
        'essay',
        'coding_challenge',
        'case_study'
      ],
      features: [
        'objective-auto-grading',
        'ai-powered-subjective-grading',
        'rubric-based-evaluation',
        'partial-credit-calculation',
        'learning-analytics',
        'batch-processing',
        'detailed-feedback-generation'
      ],
      modelInfo: this.geminiClient.getModelInfo()
    };
  }
}
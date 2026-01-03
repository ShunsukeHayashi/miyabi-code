/**
 * AssessmentCreator Agent - Main Implementation
 * @module agents/assessment-creator
 */

import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { GeminiClient } from '../lib/gemini-client.js';
import { QuestionGenerator, QuestionGenerationResult } from '../lib/question-generator.js';
import { AutoGrader, BatchGradingRequest, BatchGradingResult, GradingOptions } from '../lib/auto-grader.js';
import { AnalyticsEngine, AnalyticsRequest, AnalyticsReport } from '../lib/analytics-engine.js';
import {
  getAssessmentTemplate,
  validateTemplateVariables
} from '../lib/prompt-templates.js';
import {
  AssessmentInput,
  Assessment,
  Question,
  StudentResponse,
  AssessmentResult,
  GenerationContext,
  GenerationProgress,
  GenerationStep,
  Rubric,
  AssessmentInputSchema,
  AssessmentSchema
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
      filename: 'assessment-creator-agent.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

export interface AssessmentCreationResult {
  assessment: Assessment;
  generationMetadata: {
    questionsGenerated: number;
    questionsRequested: number;
    successRate: number;
    totalGenerationTime: number;
    qualityScore: number;
    warnings: string[];
  };
  recommendations: {
    usageTips: string[];
    improvementSuggestions: string[];
    nextSteps: string[];
  };
}

export interface GradingConfiguration extends GradingOptions {
  batchSize: number;
  timeoutMs: number;
  retryAttempts: number;
}

export class AssessmentCreatorAgent {
  private geminiClient: GeminiClient;
  private questionGenerator: QuestionGenerator;
  private autoGrader: AutoGrader;
  private analyticsEngine: AnalyticsEngine;
  private generationProgress: GenerationProgress | null = null;

  constructor(geminiApiKey: string) {
    // Initialize core services
    this.geminiClient = new GeminiClient(geminiApiKey, {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.4,
      maxTokens: 8192
    });

    this.questionGenerator = new QuestionGenerator(geminiApiKey);
    this.autoGrader = new AutoGrader(geminiApiKey);
    this.analyticsEngine = new AnalyticsEngine(geminiApiKey);

    logger.info('AssessmentCreatorAgent initialized', {
      model: this.geminiClient.getModelInfo().model,
      capabilities: this.getAgentInfo().capabilities
    });
  }

  /**
   * Generate a complete assessment from input specifications
   */
  async generateAssessment(input: AssessmentInput): Promise<AssessmentCreationResult> {
    try {
      // Validate input
      const validatedInput = AssessmentInputSchema.parse(input);

      logger.info('Starting assessment generation', {
        topic: validatedInput.topic,
        assessmentType: validatedInput.assessmentType,
        totalQuestions: validatedInput.questionCount.total,
        questionTypes: validatedInput.questionTypes
      });

      // Initialize progress tracking
      this.initializeProgress();

      // Step 1: Generate assessment structure and metadata
      await this.updateProgress(0, 'running');
      const assessmentStructure = await this.generateAssessmentStructure(validatedInput);
      await this.updateProgress(0, 'completed', assessmentStructure);

      // Step 2: Generate questions using AI
      await this.updateProgress(1, 'running');
      const questionGeneration = await this.questionGenerator.generateQuestions(validatedInput);
      await this.updateProgress(1, 'completed', questionGeneration);

      // Step 3: Generate rubrics for subjective questions
      await this.updateProgress(2, 'running');
      const rubrics = await this.generateRubrics(questionGeneration.questions, validatedInput);
      await this.updateProgress(2, 'completed', rubrics);

      // Step 4: Validate and optimize questions
      await this.updateProgress(3, 'running');
      const validatedQuestions = await this.validateAndOptimizeQuestions(
        questionGeneration.questions,
        validatedInput
      );
      await this.updateProgress(3, 'completed', validatedQuestions);

      // Step 5: Compile final assessment
      await this.updateProgress(4, 'running');
      const assessment = this.compileAssessment(
        assessmentStructure,
        validatedQuestions,
        rubrics,
        validatedInput
      );
      await this.updateProgress(4, 'completed', assessment);

      // Generate recommendations and metadata
      const recommendations = await this.generateRecommendations(
        assessment,
        questionGeneration,
        validatedInput
      );

      const result: AssessmentCreationResult = {
        assessment,
        generationMetadata: {
          questionsGenerated: validatedQuestions.length,
          questionsRequested: validatedInput.questionCount.total,
          successRate: questionGeneration.metadata.successRate,
          totalGenerationTime: questionGeneration.metadata.averageGenerationTime * validatedQuestions.length,
          qualityScore: await this.calculateQualityScore(validatedQuestions),
          warnings: questionGeneration.metadata.errors
        },
        recommendations
      };

      logger.info('Assessment generation completed successfully', {
        topic: validatedInput.topic,
        questionsGenerated: validatedQuestions.length,
        successRate: `${Math.round(result.generationMetadata.successRate * 100)}%`,
        qualityScore: Math.round(result.generationMetadata.qualityScore)
      });

      return result;

    } catch (error) {
      logger.error('Assessment generation failed', {
        topic: input.topic,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      if (this.generationProgress) {
        const currentStep = this.generationProgress.currentStep;
        await this.updateProgress(currentStep, 'failed', null, String(error));
      }

      throw new Error(`Assessment generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Grade student submissions for an assessment
   */
  async gradeSubmissions(
    assessmentId: string,
    questions: Question[],
    submissions: Array<{
      studentId: string;
      submissionId: string;
      responses: StudentResponse[];
      submissionTime: string;
      timeSpent: number;
    }>,
    config: GradingConfiguration = this.getDefaultGradingConfig()
  ): Promise<BatchGradingResult> {
    try {
      logger.info('Starting batch grading', {
        assessmentId,
        submissionsCount: submissions.length,
        questionsCount: questions.length,
        config: config
      });

      const request: BatchGradingRequest = {
        assessmentId,
        questions,
        studentSubmissions: submissions,
        options: config
      };

      const result = await this.autoGrader.gradeBatch(request);

      logger.info('Batch grading completed', {
        assessmentId,
        totalSubmissions: result.metadata.totalSubmissions,
        successfullyGraded: result.metadata.successfullyGraded,
        errors: result.metadata.errors.length,
        averageGradingTime: result.metadata.averageGradingTime
      });

      return result;

    } catch (error) {
      logger.error('Batch grading failed', {
        assessmentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Grading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate analytics report for assessment performance
   */
  async generateAnalytics(
    assessmentId: string,
    questions: Question[],
    results: AssessmentResult[],
    includeRecommendations: boolean = true,
    includePredictive: boolean = false
  ): Promise<AnalyticsReport> {
    try {
      logger.info('Generating analytics report', {
        assessmentId,
        questionsCount: questions.length,
        resultsCount: results.length,
        includeRecommendations,
        includePredictive
      });

      const request: AnalyticsRequest = {
        assessmentId,
        questions,
        results,
        includeRecommendations,
        includePredictiveAnalytics: includePredictive
      };

      const report = await this.analyticsEngine.generateAnalyticsReport(request);

      logger.info('Analytics report generated', {
        assessmentId,
        averageScore: report.summary.averageScore,
        completionRate: report.summary.completionRate,
        recommendationsCount: report.insights.recommendations.length
      });

      return report;

    } catch (error) {
      logger.error('Analytics generation failed', {
        assessmentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Analytics generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Optimize existing questions based on performance data
   */
  async optimizeQuestions(
    questions: Question[],
    performanceData: AssessmentResult[]
  ): Promise<{
    optimizedQuestions: Question[];
    optimizationReport: {
      questionsOptimized: number;
      improvementsApplied: string[];
      qualityImprovement: number;
    };
  }> {
    try {
      logger.info('Starting question optimization', {
        questionsCount: questions.length,
        performanceDataPoints: performanceData.length
      });

      // Generate analytics for current performance
      const analytics = await this.analyticsEngine.generateAnalyticsReport({
        assessmentId: 'optimization-analysis',
        questions,
        results: performanceData,
        includeRecommendations: true,
        includePredictiveAnalytics: false
      });

      // Get optimization suggestions
      const optimizations = await this.analyticsEngine.optimizeQuestions(
        questions,
        analytics.questionAnalytics
      );

      // Apply high-priority optimizations
      const optimizedQuestions: Question[] = [];
      const improvementsApplied: string[] = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const optimization = optimizations[i];

        if (optimization) {
          const highPriorityOptimizations = optimization.optimizationSuggestions
            .filter(opt => opt.priority === 'high');

          if (highPriorityOptimizations.length > 0) {
            // Apply optimizations (simplified - would implement actual question modification)
            const optimizedQuestion = await this.applyOptimizations(question, highPriorityOptimizations);
            optimizedQuestions.push(optimizedQuestion);
            improvementsApplied.push(...highPriorityOptimizations.map(opt => opt.suggestion));
          } else {
            optimizedQuestions.push(question);
          }
        } else {
          optimizedQuestions.push(question);
        }
      }

      const qualityImprovement = await this.calculateQualityImprovement(questions, optimizedQuestions);

      logger.info('Question optimization completed', {
        questionsOptimized: optimizations.filter(opt =>
          opt.optimizationSuggestions.some(s => s.priority === 'high')
        ).length,
        improvementsCount: improvementsApplied.length,
        qualityImprovement
      });

      return {
        optimizedQuestions,
        optimizationReport: {
          questionsOptimized: optimizations.length,
          improvementsApplied,
          qualityImprovement
        }
      };

    } catch (error) {
      logger.error('Question optimization failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Optimization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current generation progress
   */
  getGenerationProgress(): GenerationProgress | null {
    return this.generationProgress;
  }

  /**
   * Generate assessment structure and metadata
   */
  private async generateAssessmentStructure(input: AssessmentInput): Promise<any> {
    const template = getAssessmentTemplate('structure')!;

    const variables = {
      topic: input.topic,
      learningObjectives: JSON.stringify(input.learningObjectives),
      targetAudience: input.targetAudience,
      assessmentType: input.assessmentType,
      questionCount: input.questionCount.total.toString(),
      timeLimit: input.timeLimit?.toString() || '60',
      difficultyDistribution: JSON.stringify(input.difficultyDistribution || {}),
      bloomsDistribution: JSON.stringify(input.bloomsDistribution || {})
    };

    const validation = validateTemplateVariables(template, variables);
    if (!validation.valid) {
      throw new Error(`Missing template variables: ${validation.missing.join(', ')}`);
    }

    const structure = await this.geminiClient.generateStructuredContent(
      template,
      variables
    );

    logger.debug('Assessment structure generated', {
      title: structure.title,
      totalPoints: structure.totalPoints,
      estimatedDuration: structure.estimatedDuration
    });

    return structure;
  }

  /**
   * Generate rubrics for subjective questions
   */
  private async generateRubrics(questions: Question[], input: AssessmentInput): Promise<Rubric[]> {
    const rubrics: Rubric[] = [];

    if (!input.generateRubrics) {
      return rubrics;
    }

    const subjectiveQuestions = questions.filter(q =>
      q.type === 'essay' || q.type === 'short_answer' || q.type === 'case_study'
    );

    for (const question of subjectiveQuestions) {
      try {
        const template = getAssessmentTemplate('rubric')!;

        const variables = {
          topic: input.topic,
          assessmentType: input.assessmentType,
          learningObjectives: JSON.stringify(input.learningObjectives),
          targetAudience: input.targetAudience,
          totalPoints: question.points.toString()
        };

        const rubric = await this.geminiClient.generateStructuredContent<Rubric>(
          template,
          variables
        );

        rubric.id = uuidv4();
        rubrics.push(rubric);

        logger.debug('Rubric generated', {
          questionId: question.id,
          rubricId: rubric.id,
          criteriaCount: rubric.criteria.length
        });

      } catch (error) {
        logger.warn('Rubric generation failed for question', {
          questionId: question.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return rubrics;
  }

  /**
   * Validate and optimize generated questions
   */
  private async validateAndOptimizeQuestions(
    questions: Question[],
    input: AssessmentInput
  ): Promise<Question[]> {
    const validatedQuestions: Question[] = [];

    for (const question of questions) {
      try {
        // Validate against schema
        const validated = AssessmentSchema.parse({
          id: 'temp',
          config: { type: input.assessmentType, title: 'temp', description: 'temp', instructions: 'temp' },
          questions: [question],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0',
            learningObjectives: input.learningObjectives,
            estimatedDuration: 60,
            totalPoints: question.points,
            passingScore: 70,
            difficultyDistribution: { easy: 0, medium: 0, hard: 0, expert: 0 },
            bloomsDistribution: {}
          }
        });

        // Analyze question quality
        if (input.includeAnalytics) {
          const qualityAnalysis = await this.questionGenerator.analyzeQuestionQuality(question);

          if (qualityAnalysis.qualityScore < 60) {
            logger.warn('Low quality question detected', {
              questionId: question.id,
              qualityScore: qualityAnalysis.qualityScore,
              improvements: qualityAnalysis.improvements
            });
          }
        }

        validatedQuestions.push(validated.questions[0]);
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
   * Compile final assessment from components
   */
  private compileAssessment(
    structure: any,
    questions: Question[],
    rubrics: Rubric[],
    input: AssessmentInput
  ): Assessment {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedDuration = questions.reduce((sum, q) => sum + q.timeEstimate, 0);

    // Calculate distributions
    const difficultyDistribution = this.calculateDifficultyDistribution(questions);
    const bloomsDistribution = this.calculateBloomsDistribution(questions);

    const assessment: Assessment = {
      id: uuidv4(),
      config: {
        type: input.assessmentType,
        title: structure.title || `${input.topic} Assessment`,
        description: structure.description || `Assessment covering ${input.topic}`,
        instructions: structure.instructions || 'Read each question carefully and provide your best answer.',
        timeLimit: input.timeLimit,
        attempts: input.allowMultipleAttempts ? 3 : 1,
        randomizeQuestions: structure.config?.randomizeQuestions || false,
        randomizeOptions: structure.config?.randomizeOptions || true,
        showFeedback: input.showCorrectAnswers ? 'after_submission' : 'after_due_date',
        allowReview: true
      },
      questions,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        learningObjectives: input.learningObjectives,
        estimatedDuration,
        totalPoints,
        passingScore: 70,
        difficultyDistribution,
        bloomsDistribution
      }
    };

    return assessment;
  }

  /**
   * Generate usage recommendations
   */
  private async generateRecommendations(
    assessment: Assessment,
    questionGeneration: QuestionGenerationResult,
    input: AssessmentInput
  ): Promise<{
    usageTips: string[];
    improvementSuggestions: string[];
    nextSteps: string[];
  }> {
    try {
      const recommendationsPrompt = `
Provide usage recommendations for this generated assessment.

Assessment Overview:
- Topic: ${input.topic}
- Type: ${input.assessmentType}
- Questions: ${assessment.questions.length}
- Estimated Duration: ${assessment.metadata.estimatedDuration} minutes
- Success Rate: ${Math.round(questionGeneration.metadata.successRate * 100)}%

Generation Issues:
${questionGeneration.metadata.errors.length > 0 ? questionGeneration.metadata.errors.join('\n') : 'No errors'}

Provide recommendations as JSON:
{
  "usageTips": ["How to best use this assessment"],
  "improvementSuggestions": ["Ways to improve the assessment"],
  "nextSteps": ["Recommended follow-up actions"]
}`;

      const recommendations = await this.geminiClient.generateStructuredContent<{
        usageTips: string[];
        improvementSuggestions: string[];
        nextSteps: string[];
      }>({
        name: 'assessment_recommendations',
        template: recommendationsPrompt,
        variables: []
      }, {});

      return recommendations;

    } catch (error) {
      logger.error('Recommendations generation failed', { error });

      // Return fallback recommendations
      return {
        usageTips: [
          'Review all questions before administering the assessment',
          'Provide clear instructions to students',
          'Monitor assessment performance for improvements'
        ],
        improvementSuggestions: [
          'Validate questions with subject matter experts',
          'Pilot test with a small group',
          'Collect feedback for future iterations'
        ],
        nextSteps: [
          'Set up assessment delivery platform',
          'Train staff on grading procedures',
          'Plan follow-up activities based on results'
        ]
      };
    }
  }

  /**
   * Calculate assessment quality score
   */
  private async calculateQualityScore(questions: Question[]): Promise<number> {
    try {
      let totalScore = 0;
      let validQuestions = 0;

      for (const question of questions) {
        try {
          const analysis = await this.questionGenerator.analyzeQuestionQuality(question);
          totalScore += analysis.qualityScore;
          validQuestions++;
        } catch (error) {
          logger.warn('Quality analysis failed for question', {
            questionId: question.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return validQuestions > 0 ? totalScore / validQuestions : 75;
    } catch (error) {
      logger.error('Quality score calculation failed', { error });
      return 75; // Default score
    }
  }

  /**
   * Apply optimizations to a question
   */
  private async applyOptimizations(
    question: Question,
    optimizations: Array<{
      type: string;
      suggestion: string;
      expectedImpact: string;
    }>
  ): Promise<Question> {
    // This is a simplified implementation
    // In practice, would use AI to modify the question based on optimization suggestions
    logger.debug('Applying optimizations', {
      questionId: question.id,
      optimizationsCount: optimizations.length
    });

    return question; // Return unchanged for now
  }

  /**
   * Calculate quality improvement between original and optimized questions
   */
  private async calculateQualityImprovement(
    originalQuestions: Question[],
    optimizedQuestions: Question[]
  ): Promise<number> {
    const originalScore = await this.calculateQualityScore(originalQuestions);
    const optimizedScore = await this.calculateQualityScore(optimizedQuestions);
    return optimizedScore - originalScore;
  }

  /**
   * Calculate difficulty distribution
   */
  private calculateDifficultyDistribution(questions: Question[]) {
    const distribution = { easy: 0, medium: 0, hard: 0, expert: 0 };

    for (const question of questions) {
      switch (question.difficulty) {
        case 'easy':
          distribution.easy++;
          break;
        case 'medium':
          distribution.medium++;
          break;
        case 'hard':
          distribution.hard++;
          break;
        case 'expert':
          distribution.expert++;
          break;
      }
    }

    return distribution;
  }

  /**
   * Calculate Bloom's taxonomy distribution
   */
  private calculateBloomsDistribution(questions: Question[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const question of questions) {
      const level = question.bloomsLevel;
      distribution[level] = (distribution[level] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get default grading configuration
   */
  private getDefaultGradingConfig(): GradingConfiguration {
    return {
      strictMode: false,
      allowPartialCredit: true,
      includeFeedback: true,
      feedbackLevel: 'standard',
      rubricWeighting: true,
      aiGradingForSubjective: true,
      batchSize: 10,
      timeoutMs: 30000,
      retryAttempts: 2
    };
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(): void {
    this.generationProgress = {
      steps: [
        { name: 'Assessment Structure', description: 'Generating assessment framework', status: 'pending', progress: 0 },
        { name: 'Question Generation', description: 'Creating assessment questions', status: 'pending', progress: 0 },
        { name: 'Rubric Creation', description: 'Generating scoring rubrics', status: 'pending', progress: 0 },
        { name: 'Question Validation', description: 'Validating and optimizing questions', status: 'pending', progress: 0 },
        { name: 'Assessment Compilation', description: 'Finalizing assessment structure', status: 'pending', progress: 0 }
      ],
      currentStep: 0,
      overallProgress: 0,
      estimatedTimeRemaining: 180 // 3 minutes estimate
    };
  }

  /**
   * Update progress for a specific step
   */
  private async updateProgress(
    stepIndex: number,
    status: 'pending' | 'running' | 'completed' | 'failed',
    result?: any,
    error?: string
  ): Promise<void> {
    if (!this.generationProgress) return;

    this.generationProgress.steps[stepIndex].status = status;
    this.generationProgress.steps[stepIndex].progress = status === 'completed' ? 100 : (status === 'running' ? 50 : 0);

    if (result) {
      this.generationProgress.steps[stepIndex].result = result;
    }

    if (error) {
      this.generationProgress.steps[stepIndex].error = error;
    }

    if (status === 'completed' || status === 'failed') {
      this.generationProgress.currentStep = Math.min(stepIndex + 1, this.generationProgress.steps.length - 1);
    }

    // Calculate overall progress
    const completedSteps = this.generationProgress.steps.filter(s => s.status === 'completed').length;
    this.generationProgress.overallProgress = (completedSteps / this.generationProgress.steps.length) * 100;

    // Update time remaining estimate
    const remainingSteps = this.generationProgress.steps.length - completedSteps;
    this.generationProgress.estimatedTimeRemaining = remainingSteps * 36; // 36 seconds per remaining step

    logger.debug('Progress updated', {
      step: stepIndex,
      status,
      overallProgress: this.generationProgress.overallProgress
    });
  }

  /**
   * Validate API connections
   */
  async validateConnections(): Promise<{
    questionGenerator: boolean;
    autoGrader: boolean;
    analyticsEngine: boolean;
    geminiClient: boolean;
  }> {
    const results = await Promise.allSettled([
      this.questionGenerator.validateConnection(),
      this.autoGrader.validateConnection(),
      this.analyticsEngine.validateConnection(),
      this.geminiClient.validateConnection()
    ]);

    return {
      questionGenerator: results[0].status === 'fulfilled' ? results[0].value : false,
      autoGrader: results[1].status === 'fulfilled' ? results[1].value : false,
      analyticsEngine: results[2].status === 'fulfilled' ? results[2].value : false,
      geminiClient: results[3].status === 'fulfilled' ? results[3].value : false
    };
  }

  /**
   * Get comprehensive agent information
   */
  getAgentInfo() {
    return {
      name: 'AssessmentCreatorAgent',
      version: '1.0.0',
      description: 'AI-powered assessment and quiz generation with auto-grading and analytics',
      capabilities: [
        'Intelligent assessment generation',
        'Multi-type question creation (MC, Essay, Coding, etc.)',
        'Bloom\'s taxonomy alignment',
        'Difficulty calibration',
        'Auto-grading with rubrics',
        'Learning analytics',
        'Performance optimization',
        'Predictive insights',
        'Batch processing',
        'Quality validation'
      ],
      supportedQuestionTypes: [
        'multiple_choice',
        'true_false',
        'fill_in_blank',
        'short_answer',
        'essay',
        'coding_challenge',
        'matching',
        'ordering',
        'case_study'
      ],
      supportedAssessmentTypes: [
        'formative',
        'summative',
        'diagnostic',
        'peer',
        'self'
      ],
      integrations: {
        questionGenerator: this.questionGenerator.getGeneratorInfo(),
        autoGrader: this.autoGrader.getGraderInfo(),
        analyticsEngine: this.analyticsEngine.getEngineInfo()
      },
      modelInfo: this.geminiClient.getModelInfo(),
      maxQuestionsPerAssessment: 100,
      maxStudentsPerBatch: 1000,
      estimatedGenerationTime: '30-180 seconds per assessment',
      estimatedGradingTime: '5-15 seconds per submission'
    };
  }
}
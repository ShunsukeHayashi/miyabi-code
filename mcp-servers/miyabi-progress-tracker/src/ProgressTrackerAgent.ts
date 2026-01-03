import { EventEmitter } from 'events';
import crypto from 'crypto';
import winston from 'winston';
import { AnalyticsEngine } from './analytics-engine.js';
import { PredictionModel } from './prediction-model.js';
import { RecommendationEngine } from './recommendation-engine.js';
import { Database } from './database.js';
import {
  Student,
  Course,
  ProgressEntry,
  LearningAnalytics,
  Recommendation,
  Insight,
  AnalyticsConfig,
  ModelConfig,
  DashboardMetrics,
  StudentProfile,
  CourseAnalytics,
  TrackProgressInput,
  AnalyzePerformanceInput,
  GenerateRecommendationsInput,
  PredictOutcomesInput,
  GetInsightsInput,
  AnalyticsConfigSchema,
  ModelConfigSchema,
} from './types.js';

export class ProgressTrackerAgent extends EventEmitter {
  private logger: winston.Logger;
  private analyticsEngine: AnalyticsEngine;
  private predictionModel: PredictionModel;
  private recommendationEngine: RecommendationEngine;
  private database: Database;
  private config: AnalyticsConfig;
  private modelConfig: ModelConfig;
  private isInitialized = false;
  private updateInterval?: NodeJS.Timeout;
  private lastUpdate = new Date();

  constructor(
    analyticsConfig: Partial<AnalyticsConfig> = {},
    modelConfig: Partial<ModelConfig> = {}
  ) {
    super();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'progress-tracker-agent' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });

    // Validate and set configuration
    this.config = AnalyticsConfigSchema.parse(analyticsConfig);
    this.modelConfig = ModelConfigSchema.parse(modelConfig);

    // Initialize components
    this.database = new Database();
    this.analyticsEngine = new AnalyticsEngine(this.database, this.config);
    this.predictionModel = new PredictionModel(this.database, this.modelConfig);
    this.recommendationEngine = new RecommendationEngine(this.database, this.modelConfig);
  }

  /**
   * Initialize the ProgressTracker Agent
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing ProgressTracker Agent...');

      // Initialize database connection
      await this.database.initialize();
      this.logger.info('Database initialized');

      // Initialize analytics engine
      await this.analyticsEngine.initialize();
      this.logger.info('Analytics engine initialized');

      // Initialize prediction models
      await this.predictionModel.initialize();
      this.logger.info('Prediction models initialized');

      // Initialize recommendation engine
      await this.recommendationEngine.initialize();
      this.logger.info('Recommendation engine initialized');

      // Start periodic updates
      this.startPeriodicUpdates();

      this.isInitialized = true;
      this.logger.info('ProgressTracker Agent initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Failed to initialize ProgressTracker Agent:', error);
      throw error;
    }
  }

  /**
   * Shutdown the agent gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down ProgressTracker Agent...');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    await this.database.close();
    this.isInitialized = false;
    this.emit('shutdown');
    this.logger.info('ProgressTracker Agent shut down successfully');
  }

  /**
   * Track student progress on a course/lesson
   */
  async trackProgress(input: TrackProgressInput): Promise<ProgressEntry> {
    this.ensureInitialized();

    try {
      this.logger.debug('Tracking progress:', input);

      // Validate input
      if (!input.studentId || input.studentId.trim() === '') {
        throw new Error('studentId is required and cannot be empty');
      }
      if (!input.courseId || input.courseId.trim() === '') {
        throw new Error('courseId is required and cannot be empty');
      }
      if (typeof input.progress !== 'number' || input.progress < 0 || input.progress > 100) {
        throw new Error('progress must be a number between 0 and 100');
      }
      if (typeof input.timeSpent !== 'number' || input.timeSpent < 0) {
        throw new Error('timeSpent must be a non-negative number');
      }
      if (!['not_started', 'in_progress', 'completed', 'skipped'].includes(input.status)) {
        throw new Error('status must be one of: not_started, in_progress, completed, skipped');
      }

      // Create progress entry
      const progressEntry: ProgressEntry = {
        id: crypto.randomUUID(),
        studentId: input.studentId,
        courseId: input.courseId,
        lessonId: input.lessonId,
        status: input.status,
        progress: input.progress,
        timeSpent: input.timeSpent,
        timestamp: new Date(),
        engagementScore: this.calculateEngagementScore(input),
      };

      // Store progress entry
      await this.database.saveProgressEntry(progressEntry);

      // Update analytics in real-time for high-engagement activities
      if (progressEntry.engagementScore && progressEntry.engagementScore > 70) {
        await this.analyticsEngine.updateRealTimeAnalytics(progressEntry);
      }

      // Check for milestone achievements
      await this.checkMilestones(progressEntry);

      // Generate alerts if needed
      await this.checkAlerts(progressEntry);

      this.emit('progressTracked', progressEntry);
      this.logger.info(`Progress tracked for student ${input.studentId}`);

      return progressEntry;

    } catch (error) {
      this.logger.error('Failed to track progress:', error);
      throw error;
    }
  }

  /**
   * Analyze performance for students/courses
   */
  async analyzePerformance(input: AnalyzePerformanceInput): Promise<LearningAnalytics[]> {
    this.ensureInitialized();

    try {
      this.logger.debug('Analyzing performance:', input);

      const analytics = await this.analyticsEngine.generateAnalytics({
        studentIds: input.studentIds,
        courseIds: input.courseIds,
        timeRange: input.timeRange,
        metrics: input.metrics,
      });

      // Add comparative analysis if requested
      if (input.includeComparisons) {
        for (const analytic of analytics) {
          const benchmark = await this.analyticsEngine.getBenchmarkData(
            analytic.studentId,
            analytic.courseId
          );
          analytic.benchmark = benchmark;
        }
      }

      this.emit('performanceAnalyzed', analytics);
      this.logger.info(`Performance analyzed for ${analytics.length} entities`);

      return analytics;

    } catch (error) {
      this.logger.error('Failed to analyze performance:', error);
      throw error;
    }
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(input: GenerateRecommendationsInput): Promise<Recommendation[]> {
    this.ensureInitialized();

    try {
      this.logger.debug('Generating recommendations:', input);

      const recommendations = await this.recommendationEngine.generateRecommendations({
        studentId: input.studentId,
        maxRecommendations: input.maxRecommendations || 5,
        types: input.types,
        forceRefresh: input.forceRefresh,
      });

      // Store recommendations for tracking
      for (const recommendation of recommendations) {
        await this.database.saveRecommendation(recommendation);
      }

      this.emit('recommendationsGenerated', recommendations);
      this.logger.info(`Generated ${recommendations.length} recommendations for student ${input.studentId}`);

      return recommendations;

    } catch (error) {
      this.logger.error('Failed to generate recommendations:', error);
      throw error;
    }
  }

  /**
   * Predict learning outcomes
   */
  async predictOutcomes(input: PredictOutcomesInput): Promise<any[]> {
    this.ensureInitialized();

    try {
      this.logger.debug('Predicting outcomes:', input);

      const predictions = await this.predictionModel.generatePredictions({
        studentIds: input.studentIds,
        courseIds: input.courseIds,
        predictionTypes: input.predictionTypes,
        minConfidence: input.confidence || 70,
      });

      this.emit('outcomesPredicted', predictions);
      this.logger.info(`Generated ${predictions.length} predictions`);

      return predictions;

    } catch (error) {
      this.logger.error('Failed to predict outcomes:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive insights and dashboard data
   */
  async getInsights(input: GetInsightsInput): Promise<Insight[]> {
    this.ensureInitialized();

    try {
      this.logger.debug('Getting insights:', input);

      let insights: Insight[] = [];

      // Generate insights based on scope
      switch (input.scope) {
        case 'student':
          if (input.entityId) {
            insights = await this.analyticsEngine.generateStudentInsights(
              input.entityId,
              input.insightTypes,
              input.timeRange
            );
          }
          break;

        case 'course':
          if (input.entityId) {
            insights = await this.analyticsEngine.generateCourseInsights(
              input.entityId,
              input.insightTypes,
              input.timeRange
            );
          }
          break;

        case 'system':
          insights = await this.analyticsEngine.generateSystemInsights(
            input.insightTypes,
            input.timeRange
          );
          break;
      }

      // Filter by priority if specified
      if (input.priority) {
        insights = insights.filter(insight => input.priority!.includes(insight.priority));
      }

      this.emit('insightsGenerated', insights);
      this.logger.info(`Generated ${insights.length} insights for ${input.scope}`);

      return insights;

    } catch (error) {
      this.logger.error('Failed to get insights:', error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics overview
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    this.ensureInitialized();

    try {
      const metrics = await this.analyticsEngine.getDashboardMetrics();
      this.logger.debug('Retrieved dashboard metrics:', metrics);
      return metrics;
    } catch (error) {
      this.logger.error('Failed to get dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get detailed student profile with analytics
   */
  async getStudentProfile(studentId: string): Promise<StudentProfile> {
    this.ensureInitialized();

    try {
      const profile = await this.analyticsEngine.getStudentProfile(studentId);
      this.logger.debug(`Retrieved profile for student ${studentId}`);
      return profile;
    } catch (error) {
      this.logger.error(`Failed to get student profile for ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Get course analytics
   */
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    this.ensureInitialized();

    try {
      const analytics = await this.analyticsEngine.getCourseAnalytics(courseId);
      this.logger.debug(`Retrieved analytics for course ${courseId}`);
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get course analytics for ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = AnalyticsConfigSchema.parse({ ...this.config, ...newConfig });
    this.analyticsEngine.updateConfig(this.config);
    this.logger.info('Configuration updated');
  }

  /**
   * Get current status
   */
  getStatus(): {
    initialized: boolean;
    lastUpdate: Date;
    stats: Record<string, number>;
  } {
    return {
      initialized: this.isInitialized,
      lastUpdate: this.lastUpdate,
      stats: {
        studentsTracked: this.analyticsEngine.getStudentCount(),
        coursesAnalyzed: this.analyticsEngine.getCourseCount(),
        predictionsGenerated: this.predictionModel.getPredictionCount(),
        recommendationsActive: this.recommendationEngine.getActiveRecommendationCount(),
      },
    };
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ProgressTracker Agent is not initialized. Call initialize() first.');
    }
  }

  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.performPeriodicUpdate();
        this.lastUpdate = new Date();
      } catch (error) {
        this.logger.error('Error during periodic update:', error);
      }
    }, this.config.updateInterval * 1000);
  }

  private async performPeriodicUpdate(): Promise<void> {
    this.logger.debug('Performing periodic update...');

    // Update analytics for active students
    await this.analyticsEngine.updateBatchAnalytics();

    // Retrain prediction models if needed
    await this.predictionModel.updateModels();

    // Refresh recommendations
    await this.recommendationEngine.refreshRecommendations();

    // Generate system insights
    await this.analyticsEngine.generateSystemAlerts();

    this.emit('periodicUpdateCompleted');
  }

  private calculateEngagementScore(input: TrackProgressInput): number {
    // Simple engagement score calculation
    // In a real implementation, this would be more sophisticated
    let score = 50; // Base score

    // Adjust based on time spent vs expected
    if (input.timeSpent > 0) {
      score += Math.min(30, input.timeSpent / 60); // More time = higher engagement (up to 30 points)
    }

    // Adjust based on progress made
    score += input.progress * 0.2; // Up to 20 points for 100% progress

    return Math.min(100, Math.max(0, score));
  }

  private async checkMilestones(progressEntry: ProgressEntry): Promise<void> {
    // Check if this progress entry represents a milestone
    if (progressEntry.status === 'completed' && progressEntry.progress === 100) {
      this.emit('milestoneAchieved', {
        studentId: progressEntry.studentId,
        courseId: progressEntry.courseId,
        lessonId: progressEntry.lessonId,
        timestamp: progressEntry.timestamp,
      });
    }
  }

  private async checkAlerts(progressEntry: ProgressEntry): Promise<void> {
    // Check for low engagement
    if (progressEntry.engagementScore && progressEntry.engagementScore < this.config.alertThresholds.lowEngagement) {
      this.emit('lowEngagementAlert', {
        studentId: progressEntry.studentId,
        courseId: progressEntry.courseId,
        engagementScore: progressEntry.engagementScore,
        timestamp: progressEntry.timestamp,
      });
    }

    // Additional alert checks would go here
  }
}
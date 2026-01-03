import winston from 'winston';
import { Database } from './database.js';
import {
  Recommendation,
  ModelConfig,
  Student,
  Course,
  ProgressEntry,
  LearningAnalytics,
} from './types.js';

interface RecommendationInput {
  studentId: string;
  maxRecommendations: number;
  types?: Recommendation['type'][];
  forceRefresh?: boolean;
}

export class RecommendationEngine {
  private logger: winston.Logger;
  private database: Database;
  private config: ModelConfig;
  private activeRecommendations = new Map<string, Recommendation[]>();

  constructor(database: Database, config: ModelConfig) {
    this.database = database;
    this.config = config;

    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'recommendation-engine' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Recommendation Engine...');
    // Initial recommendation generation for active students could go here
  }

  /**
   * Generate personalized recommendations for a student
   */
  async generateRecommendations(input: RecommendationInput): Promise<Recommendation[]> {
    try {
      this.logger.debug('Generating recommendations for:', input.studentId);

      // Return cached recommendations if available and not forced refresh
      if (!input.forceRefresh && this.activeRecommendations.has(input.studentId)) {
        return this.activeRecommendations.get(input.studentId)!.slice(0, input.maxRecommendations);
      }

      const recommendations: Recommendation[] = [];
      const [student, currentCourses, recentProgress, analytics] = await Promise.all([
        this.database.getStudent(input.studentId),
        this.database.getStudentCurrentCourses(input.studentId),
        this.database.getStudentRecentProgress(input.studentId, 20),
        this.database.getStudentAnalytics(input.studentId),
      ]);

      // 1. Next Lesson Recommendations
      if (!input.types || input.types.includes('next_lesson')) {
        const nextLessons = await this.suggestNextLessons(student, currentCourses, recentProgress);
        recommendations.push(...nextLessons);
      }

      // 2. Review Content Recommendations
      if (!input.types || input.types.includes('review_content')) {
        const reviewItems = await this.suggestReviewContent(student, recentProgress, analytics);
        recommendations.push(...reviewItems);
      }

      // 3. Study Schedule Recommendations
      if (!input.types || input.types.includes('study_schedule')) {
        const schedule = await this.suggestStudySchedule(student, recentProgress);
        if (schedule) recommendations.push(schedule);
      }

      // 4. Course Suggestions
      if (!input.types || input.types.includes('course_suggestion')) {
        const suggestions = await this.suggestNewCourses(student, currentCourses, analytics);
        recommendations.push(...suggestions);
      }

      // Sort by priority and confidence
      const sortedRecommendations = recommendations
        .sort((a, b) => {
          const priorityMap = { urgent: 4, high: 3, medium: 2, low: 1 };
          if (priorityMap[a.priority] !== priorityMap[b.priority]) {
            return priorityMap[b.priority] - priorityMap[a.priority];
          }
          return b.confidence - a.confidence;
        })
        .slice(0, input.maxRecommendations);

      this.activeRecommendations.set(input.studentId, sortedRecommendations);
      return sortedRecommendations;

    } catch (error) {
      this.logger.error(`Failed to generate recommendations for ${input.studentId}:`, error);
      throw error;
    }
  }

  /**
   * Refresh all active recommendations
   */
  async refreshRecommendations(): Promise<void> {
    try {
      this.logger.info('Refreshing recommendations for active students...');
      const activeStudents = await this.database.getActiveStudents(3); // Active in last 3 days

      for (const student of activeStudents) {
        await this.generateRecommendations({
          studentId: student.id,
          maxRecommendations: this.config.recommendationModel.maxRecommendations,
          forceRefresh: true,
        });
      }

      this.logger.info(`Refreshed recommendations for ${activeStudents.length} students`);

    } catch (error) {
      this.logger.error('Failed to refresh recommendations:', error);
      throw error;
    }
  }

  /**
   * Get count of active recommendations
   */
  getActiveRecommendationCount(): number {
    let count = 0;
    for (const recs of this.activeRecommendations.values()) {
      count += recs.length;
    }
    return count;
  }

  // Private suggestion methods

  private async suggestNextLessons(
    student: Student,
    currentCourses: Course[],
    recentProgress: ProgressEntry[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const course of currentCourses) {
      const courseProgress = recentProgress.filter(p => p.courseId === course.id);
      const lastLesson = courseProgress[0];

      if (lastLesson) {
        // Logic to find next lesson in sequence
        // In a real system, you'd query the course structure
        recommendations.push({
          id: crypto.randomUUID(),
          studentId: student.id,
          type: 'next_lesson',
          content: { courseId: course.id, courseTitle: course.title, lastLessonId: lastLesson.lessonId },
          priority: 'high',
          reasoning: `You're making great progress in ${course.title}. Continue where you left off!`,
          confidence: 90,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    }

    return recommendations;
  }

  private async suggestReviewContent(
    student: Student,
    recentProgress: ProgressEntry[],
    analytics: LearningAnalytics[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Identify topics with low scores or engagement
    for (const analytic of analytics) {
      if (analytic.knowledgeRetention < 70) {
        recommendations.push({
          id: crypto.randomUUID(),
          studentId: student.id,
          type: 'review_content',
          content: { courseId: analytic.courseId, area: 'Knowledge Gap' },
          priority: 'medium',
          reasoning: `A quick review of recent concepts in this course will help solidify your understanding.`,
          confidence: 85,
        });
      }
    }

    return recommendations;
  }

  private async suggestStudySchedule(
    student: Student,
    recentProgress: ProgressEntry[]
  ): Promise<Recommendation | null> {
    // Logic to detect peak study times and suggest optimal schedule
    if (recentProgress.length < 5) return null;

    return {
      id: crypto.randomUUID(),
      studentId: student.id,
      type: 'study_schedule',
      content: { optimalTimes: ['19:00', '20:00'], days: ['Monday', 'Wednesday', 'Friday'] },
      priority: 'medium',
      reasoning: `You seem most productive during evening hours. We've optimized a schedule for you.`,
      confidence: 75,
    };
  }

  private async suggestNewCourses(
    student: Student,
    currentCourses: Course[],
    analytics: LearningAnalytics[]
  ): Promise<Recommendation[]> {
    // Collaborative filtering or content-based filtering logic
    return [
      {
        id: crypto.randomUUID(),
        studentId: student.id,
        type: 'course_suggestion',
        content: { courseId: 'suggested-1', title: 'Advanced AI Architectures' },
        priority: 'low',
        reasoning: `Based on your interest in AI, you might enjoy this advanced course.`,
        confidence: 80,
      }
    ];
  }
}

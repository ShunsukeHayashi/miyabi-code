import winston from 'winston';
import { mean, median, standardDeviation } from 'simple-statistics';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import _ from 'lodash';
import { Database } from './database.js';
import {
  ProgressEntry,
  LearningAnalytics,
  Student,
  Course,
  Insight,
  AnalyticsConfig,
  DashboardMetrics,
  StudentProfile,
  CourseAnalytics,
  PerformanceTrend,
  LearningPattern,
} from './types.js';

interface AnalyticsQuery {
  studentIds?: string[];
  courseIds?: string[];
  timeRange?: { start: Date; end: Date };
  metrics?: string[];
}

interface BenchmarkData {
  averageCompletion: number;
  averageEngagement: number;
  averageTimeSpent: number;
  percentileRank: number;
}

export class AnalyticsEngine {
  private logger: winston.Logger;
  private database: Database;
  private config: AnalyticsConfig;
  private cache = new Map<string, { data: any; timestamp: Date }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(database: Database, config: AnalyticsConfig) {
    this.database = database;
    this.config = config;

    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'analytics-engine' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Analytics Engine...');
  }

  async generateAnalytics(query: AnalyticsQuery): Promise<LearningAnalytics[]> {
    try {
      const cacheKey = this.getCacheKey('analytics', query);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const analytics: LearningAnalytics[] = [];

      const progressData = await this.database.getProgressData(query);
      const assessmentData = await this.database.getAssessmentData(query);

      const groupedData = _.groupBy(progressData, (entry) => `${entry.studentId}|${entry.courseId}`);

      for (const [key, entries] of Object.entries(groupedData)) {
        const [studentId, courseId] = key.split('|');
        if (!studentId || !courseId) continue;

        const studentAssessments = assessmentData.filter(
          (a) => a.studentId === studentId && a.assessmentId.includes(courseId)
        );

        const analytic = await this.calculateLearningAnalytics(
          studentId,
          courseId,
          entries,
          studentAssessments
        );

        analytics.push(analytic);
      }

      this.setCache(cacheKey, analytics);
      return analytics;

    } catch (error) {
      this.logger.error('Failed to generate analytics:', error);
      throw error;
    }
  }

  async updateRealTimeAnalytics(progressEntry: ProgressEntry): Promise<void> {
    try {
      this.invalidateCache([
        `analytics-${progressEntry.studentId}`,
        `student-profile-${progressEntry.studentId}`,
        `course-analytics-${progressEntry.courseId}`,
      ]);

      await this.database.updateRunningTotals(progressEntry);
      this.logger.debug('Real-time analytics updated for:', progressEntry.id);
    } catch (error) {
      this.logger.error('Failed to update real-time analytics:', error);
      throw error;
    }
  }

  async generateStudentInsights(
    studentId: string,
    insightTypes?: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<Insight[]> {
    try {
      const insights: Insight[] = [];
      const analytics = await this.getStudentAnalytics(studentId, timeRange);
      const patterns = await this.detectLearningPatterns(studentId, timeRange);

      if (!insightTypes || insightTypes.includes('performance')) {
        insights.push(...this.generatePerformanceInsights(studentId, analytics));
      }

      if (!insightTypes || insightTypes.includes('engagement')) {
        insights.push(...this.generateEngagementInsights(studentId, analytics));
      }

      if (!insightTypes || insightTypes.includes('pattern')) {
        insights.push(...this.generatePatternInsights(studentId, patterns));
      }

      if (!insightTypes || insightTypes.includes('risk')) {
        insights.push(...this.generateRiskInsights(studentId, analytics));
      }

      return insights.sort((a, b) => b.priority.localeCompare(a.priority));
    } catch (error) {
      this.logger.error(`Failed to generate student insights for ${studentId}:`, error);
      throw error;
    }
  }

  async generateCourseInsights(
    courseId: string,
    insightTypes?: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<Insight[]> {
    try {
      const insights: Insight[] = [];
      const courseAnalytics = await this.getCourseAnalytics(courseId, timeRange);
      const progressData = await this.database.getCourseProgressData(courseId, timeRange);

      if (!insightTypes || insightTypes.includes('completion')) {
        insights.push(...this.generateCompletionInsights(courseId, courseAnalytics));
      }

      if (!insightTypes || insightTypes.includes('engagement')) {
        insights.push(...this.generateCourseEngagementInsights(courseId, progressData));
      }

      if (!insightTypes || insightTypes.includes('difficulty')) {
        insights.push(...this.generateDifficultyInsights(courseId, progressData));
      }

      return insights;
    } catch (error) {
      this.logger.error(`Failed to generate course insights for ${courseId}:`, error);
      throw error;
    }
  }

  async generateSystemInsights(
    insightTypes?: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<Insight[]> {
    try {
      const insights: Insight[] = [];
      const systemMetrics = await this.getSystemMetrics(timeRange);

      if (!insightTypes || insightTypes.includes('platform')) {
        insights.push(...this.generatePlatformInsights(systemMetrics));
      }

      if (!insightTypes || insightTypes.includes('trend')) {
        insights.push(...this.generateTrendInsights(systemMetrics));
      }

      return insights;
    } catch (error) {
      this.logger.error('Failed to generate system insights:', error);
      throw error;
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const cacheKey = 'dashboard-metrics';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const [
        totalStudents,
        totalCourses,
        totalProgress,
        recentActivity,
        atRiskStudents,
        topPerformers,
      ] = await Promise.all([
        this.database.getStudentCount(),
        this.database.getCourseCount(),
        this.database.getProgressEntryCount(),
        this.database.getRecentActivityCount(24),
        this.database.getAtRiskStudentCount(),
        this.database.getTopPerformerCount(),
      ]);

      const progressEntries = await this.database.getRecentProgressEntries(1000);
      const averageCompletion = progressEntries.length > 0 ? mean(progressEntries.map(p => p.progress)) : 0;
      const averageEngagement = progressEntries.length > 0 ? mean(
        progressEntries
          .filter(p => p.engagementScore !== undefined)
          .map(p => p.engagementScore!)
      ) : 0;

      const metrics: DashboardMetrics = {
        totalStudents,
        totalCourses,
        totalProgress,
        averageCompletion: Math.round(averageCompletion * 100) / 100,
        averageEngagement: Math.round(averageEngagement * 100) / 100,
        atRiskStudents,
        topPerformers,
        recentActivity,
      };

      this.setCache(cacheKey, metrics, 2 * 60 * 1000);
      return metrics;
    } catch (error) {
      this.logger.error('Failed to get dashboard metrics:', error);
      throw error;
    }
  }

  async getStudentProfile(studentId: string): Promise<StudentProfile> {
    try {
      const cacheKey = `student-profile-${studentId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const [
        student,
        analytics,
        predictions,
        recommendations,
        patterns,
        currentCourses,
        recentProgress,
      ] = await Promise.all([
        this.database.getStudent(studentId),
        this.getStudentAnalytics(studentId),
        this.database.getStudentPredictions(studentId),
        this.database.getStudentRecommendations(studentId),
        this.detectLearningPatterns(studentId),
        this.database.getStudentCurrentCourses(studentId),
        this.database.getStudentRecentProgress(studentId, 10),
      ]);

      const riskLevel = this.calculateRiskLevel(analytics[0] || null);

      const profile: StudentProfile = {
        student,
        analytics: analytics[0] || this.getDefaultAnalytics(studentId),
        predictions,
        recommendations,
        patterns,
        currentCourses,
        recentProgress,
        riskLevel,
      };

      this.setCache(cacheKey, profile);
      return profile;
    } catch (error) {
      this.logger.error(`Failed to get student profile for ${studentId}:`, error);
      throw error;
    }
  }

  async getCourseAnalytics(courseId: string, timeRange?: { start: Date; end: Date }): Promise<CourseAnalytics> {
    try {
      const cacheKey = `course-analytics-${courseId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const [
        course,
        enrollmentCount,
        progressData,
        assessmentData,
      ] = await Promise.all([
        this.database.getCourse(courseId),
        this.database.getCourseEnrollmentCount(courseId),
        this.database.getCourseProgressData(courseId, timeRange),
        this.database.getCourseAssessmentData(courseId, timeRange),
      ]);

      const completedStudents = new Set(
        progressData.filter(p => p.status === 'completed').map(p => p.studentId)
      ).size;
      const completionRate = enrollmentCount > 0 ? (completedStudents / enrollmentCount) * 100 : 0;
      const averageScore = assessmentData.length > 0 ? mean(assessmentData.map(a => a.score)) : 0;
      const averageTimeSpent = progressData.length > 0 ? mean(progressData.map(p => p.timeSpent)) : 0;

      const dropoffPoints = this.calculateDropoffPoints(courseId, progressData);
      const engagementTrends = this.calculateEngagementTrends(progressData);
      const topChallenges = this.identifyTopChallenges(assessmentData, progressData);

      const analytics: CourseAnalytics = {
        course,
        enrollmentCount,
        completionRate: Math.round(completionRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        averageTimeSpent: Math.round(averageTimeSpent),
        dropoffPoints,
        engagementTrends,
        topChallenges,
      };

      this.setCache(cacheKey, analytics);
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get course analytics for ${courseId}:`, error);
      throw error;
    }
  }

  async updateBatchAnalytics(): Promise<void> {
    try {
      this.logger.info('Starting batch analytics update...');
      const activeStudents = await this.database.getActiveStudents(7);
      const batchSize = this.config.batchSize;
      for (let i = 0; i < activeStudents.length; i += batchSize) {
        const batch = activeStudents.slice(i, i + batchSize);
        await Promise.all(batch.map(student => this.updateStudentAnalytics(student.id)));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      this.logger.info(`Batch analytics update completed for ${activeStudents.length} students`);
    } catch (error) {
      this.logger.error('Failed to update batch analytics:', error);
      throw error;
    }
  }

  async generateSystemAlerts(): Promise<Insight[]> {
    try {
      const alerts: Insight[] = [];
      const metrics = await this.getDashboardMetrics();

      if (metrics.atRiskStudents > metrics.totalStudents * 0.2) {
        alerts.push({
          id: crypto.randomUUID(),
          type: 'alert',
          title: 'High At-Risk Student Count',
          description: `${metrics.atRiskStudents} students (${Math.round(metrics.atRiskStudents / metrics.totalStudents * 100)}%) are at risk of dropping out`,
          data: { atRiskCount: metrics.atRiskStudents, percentage: metrics.atRiskStudents / metrics.totalStudents },
          actionable: true,
          priority: 'critical',
          timestamp: new Date(),
          affectedEntities: ['system'],
        });
      }

      if (metrics.averageEngagement < 60) {
        alerts.push({
          id: crypto.randomUUID(),
          type: 'alert',
          title: 'Low Platform Engagement',
          description: `Average engagement is ${metrics.averageEngagement.toFixed(1)}%, below recommended threshold`,
          data: { engagement: metrics.averageEngagement },
          actionable: true,
          priority: 'warning',
          timestamp: new Date(),
          affectedEntities: ['system'],
        });
      }

      return alerts;
    } catch (error) {
      this.logger.error('Failed to generate system alerts:', error);
      throw error;
    }
  }

  async getBenchmarkData(studentId: string, courseId: string): Promise<BenchmarkData> {
    try {
      const [courseData, studentAnalytics] = await Promise.all([
        this.database.getCourseBenchmarkData(courseId),
        this.getStudentAnalytics(studentId, undefined, courseId),
      ]);

      const studentData = studentAnalytics[0];
      if (!studentData || courseData.length === 0) {
        return {
          averageCompletion: 0,
          averageEngagement: 0,
          averageTimeSpent: 0,
          percentileRank: 0,
        };
      }

      const completions = courseData.map(d => d.completionRate);
      const engagements = courseData.map(d => d.averageEngagement);
      const timesSpent = courseData.map(d => d.totalTimeSpent);

      return {
        averageCompletion: mean(completions),
        averageEngagement: mean(engagements),
        averageTimeSpent: mean(timesSpent),
        percentileRank: this.calculatePercentileRank(studentData.completionRate, completions),
      };
    } catch (error) {
      this.logger.error('Failed to get benchmark data:', error);
      throw error;
    }
  }

  updateConfig(config: AnalyticsConfig): void {
    this.config = config;
  }

  getStudentCount(): number {
    return this.cache.get('student-count')?.data || 0;
  }

  getCourseCount(): number {
    return this.cache.get('course-count')?.data || 0;
  }

  private async calculateLearningAnalytics(
    studentId: string,
    courseId: string,
    progressEntries: ProgressEntry[],
    assessmentResults: any[]
  ): Promise<LearningAnalytics> {
    const totalTimeSpent = progressEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    const engagementScores = progressEntries
      .filter(entry => entry.engagementScore !== undefined)
      .map(entry => entry.engagementScore!);

    const averageEngagement = engagementScores.length > 0 ? mean(engagementScores) : 0;
    const completedEntries = progressEntries.filter(entry => entry.status === 'completed');
    const completionRate = progressEntries.length > 0 ? (completedEntries.length / progressEntries.length) * 100 : 0;

    const learningVelocity = totalTimeSpent > 0 ?
      progressEntries.reduce((sum, entry) => sum + entry.progress, 0) / (totalTimeSpent / 3600) : 0;

    const knowledgeRetention = assessmentResults.length > 0 ? mean(assessmentResults.map(r => r.score)) : 0;

    const skillMastery = this.calculateSkillMastery(progressEntries, assessmentResults);

    const lastActivity = progressEntries.length > 0 ?
      new Date(Math.max(...progressEntries.map(entry => entry.timestamp.getTime()))) :
      new Date();

    return {
      studentId,
      courseId,
      totalTimeSpent,
      averageEngagement: Math.round(averageEngagement * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      learningVelocity: Math.round(learningVelocity * 100) / 100,
      knowledgeRetention: Math.round(knowledgeRetention * 100) / 100,
      skillMastery,
      lastActive: lastActivity,
    };
  }

  private calculateSkillMastery(progressEntries: ProgressEntry[], assessmentResults: any[]): Record<string, number> {
    const skills: Record<string, number> = {};
    if (assessmentResults.length > 0) {
      skills['problem_solving'] = mean(assessmentResults.map(r => r.score));
      skills['comprehension'] = mean(progressEntries.map(p => p.progress));
    }
    return skills;
  }

  private async detectLearningPatterns(
    studentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<LearningPattern[]> {
    try {
      const progressData = await this.database.getStudentProgressData(studentId, timeRange);
      const patterns: LearningPattern[] = [];

      const studyTimePattern = this.detectStudyTimePattern(progressData);
      if (studyTimePattern) {
        patterns.push(studyTimePattern);
      }

      const engagementPattern = this.detectEngagementPattern(progressData);
      if (engagementPattern) {
        patterns.push(engagementPattern);
      }

      return patterns;
    } catch (error) {
      this.logger.error('Failed to detect learning patterns:', error);
      return [];
    }
  }

  private detectStudyTimePattern(progressData: ProgressEntry[]): LearningPattern | null {
    if (progressData.length < 5) return null;

    const hourlyActivity = _.groupBy(progressData, entry => entry.timestamp.getHours());
    const peakHours = Object.entries(hourlyActivity)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      studentId: progressData[0]?.studentId || '',
      patternType: 'study_time',
      pattern: { peakHours, distribution: hourlyActivity },
      strength: Math.min(100, (Object.keys(hourlyActivity).length / 24) * 100),
      frequency: progressData.length,
      lastOccurrence: new Date(Math.max(...progressData.map(p => p.timestamp.getTime()))),
    };
  }

  private detectEngagementPattern(progressData: ProgressEntry[]): LearningPattern | null {
    const engagementData = progressData.filter(p => p.engagementScore !== undefined);
    if (engagementData.length < 3) return null;

    const engagementScores = engagementData.map(p => p.engagementScore!);
    const trend = this.calculateTrend(engagementScores);

    return {
      studentId: progressData[0]?.studentId || '',
      patternType: 'engagement',
      pattern: {
        trend,
        average: mean(engagementScores),
        volatility: standardDeviation(engagementScores),
      },
      strength: Math.abs(trend) * 10,
      frequency: engagementData.length,
      lastOccurrence: new Date(Math.max(...engagementData.map(p => p.timestamp.getTime()))),
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = mean(x);
    const yMean = mean(values);
    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * ((values[i] || 0) - yMean), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generatePerformanceInsights(studentId: string, analytics: LearningAnalytics[]): Insight[] {
    const insights: Insight[] = [];
    if (analytics.length === 0) return insights;
    const studentAnalytics = analytics[0];
    if (!studentAnalytics) return insights;

    if (studentAnalytics.completionRate < 60) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'performance',
        title: 'Low Course Completion Rate',
        description: `Completion rate of ${studentAnalytics.completionRate}% is below average`,
        data: { completionRate: studentAnalytics.completionRate },
        actionable: true,
        priority: 'warning',
        timestamp: new Date(),
        affectedEntities: [studentId],
      });
    }
    return insights;
  }

  private generateEngagementInsights(studentId: string, analytics: LearningAnalytics[]): Insight[] {
    const insights: Insight[] = [];
    if (analytics.length === 0) return insights;
    const studentAnalytics = analytics[0];
    if (!studentAnalytics) return insights;

    if (studentAnalytics.averageEngagement < 50) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'engagement',
        title: 'Low Learning Engagement',
        description: `Engagement score of ${studentAnalytics.averageEngagement}% indicates potential attention issues`,
        data: { engagement: studentAnalytics.averageEngagement },
        actionable: true,
        priority: 'warning',
        timestamp: new Date(),
        affectedEntities: [studentId],
      });
    }
    return insights;
  }

  private generatePatternInsights(studentId: string, patterns: LearningPattern[]): Insight[] {
    const insights: Insight[] = [];
    for (const pattern of patterns) {
      if (pattern.patternType === 'study_time' && pattern.strength > 70) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'recommendation',
          title: 'Strong Study Time Pattern Detected',
          description: `Student shows consistent study patterns - optimize content delivery during peak hours`,
          data: pattern.pattern,
          actionable: true,
          priority: 'info',
          timestamp: new Date(),
          affectedEntities: [studentId],
        });
      }
    }
    return insights;
  }

  private generateRiskInsights(studentId: string, analytics: LearningAnalytics[]): Insight[] {
    const insights: Insight[] = [];
    if (analytics.length === 0) return insights;
    const studentAnalytics = analytics[0];
    if (!studentAnalytics) return insights;
    const riskScore = this.calculateRiskScore(studentAnalytics);

    if (riskScore > 70) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'alert',
        title: 'High Dropout Risk',
        description: `Student shows high risk indicators - immediate intervention recommended`,
        data: { riskScore },
        actionable: true,
        priority: 'critical',
        timestamp: new Date(),
        affectedEntities: [studentId],
      });
    }
    return insights;
  }

  private calculateRiskScore(analytics: LearningAnalytics): number {
    let riskScore = 0;
    if (analytics.averageEngagement < 40) riskScore += 30;
    else if (analytics.averageEngagement < 60) riskScore += 15;
    if (analytics.completionRate < 30) riskScore += 25;
    else if (analytics.completionRate < 50) riskScore += 15;
    const daysSinceActive = Math.floor((Date.now() - analytics.lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive > 7) riskScore += 20;
    else if (daysSinceActive > 3) riskScore += 10;
    return Math.min(100, riskScore);
  }

  private calculateRiskLevel(analytics: LearningAnalytics | null): 'low' | 'medium' | 'high' {
    if (!analytics) return 'medium';
    const riskScore = this.calculateRiskScore(analytics);
    if (riskScore < 30) return 'low';
    if (riskScore < 70) return 'medium';
    return 'high';
  }

  private getCacheKey(type: string, query: any): string {
    return `${type}-${JSON.stringify(query)}`;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
    });
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private invalidateCache(keys: string[]): void {
    for (const key of keys) {
      for (const cacheKey of this.cache.keys()) {
        if (keys.some(k => cacheKey.includes(k))) {
          this.cache.delete(cacheKey);
        }
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp.getTime() > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  private async getStudentAnalytics(studentId: string, timeRange?: any, courseId?: string): Promise<LearningAnalytics[]> {
    return this.database.getStudentAnalytics(studentId, timeRange, courseId);
  }

  private async updateStudentAnalytics(studentId: string): Promise<void> {
    this.invalidateCache([`analytics-${studentId}`, `student-profile-${studentId}`]);
  }

  private getDefaultAnalytics(studentId: string): LearningAnalytics {
    return {
      studentId,
      courseId: '',
      totalTimeSpent: 0,
      averageEngagement: 0,
      completionRate: 0,
      learningVelocity: 0,
      knowledgeRetention: 0,
      skillMastery: {},
      lastActive: new Date(),
    };
  }

  private calculatePercentileRank(value: number, distribution: number[]): number {
    const sorted = distribution.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return index === -1 ? 100 : (index / sorted.length) * 100;
  }

  private generateCompletionInsights(courseId: string, analytics: CourseAnalytics): Insight[] { return []; }
  private generateCourseEngagementInsights(courseId: string, progressData: ProgressEntry[]): Insight[] { return []; }
  private generateDifficultyInsights(courseId: string, progressData: ProgressEntry[]): Insight[] { return []; }
  private generatePlatformInsights(metrics: any): Insight[] { return []; }
  private generateTrendInsights(metrics: any): Insight[] { return []; }
  private async getSystemMetrics(timeRange?: any): Promise<any> { return {}; }
  private calculateDropoffPoints(courseId: string, progressData: ProgressEntry[]): any[] { return []; }
  private calculateEngagementTrends(progressData: ProgressEntry[]): PerformanceTrend[] { return []; }
  private identifyTopChallenges(assessmentData: any[], progressData: ProgressEntry[]): any[] { return []; }
}

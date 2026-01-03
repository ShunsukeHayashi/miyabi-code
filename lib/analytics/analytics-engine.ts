/**
 * Comprehensive Analytics Engine
 * Provides insights into course performance, user engagement, and learning outcomes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types for analytics data
export interface CourseAnalytics {
  courseId: string;
  title: string;
  totalEnrollments: number;
  activeStudents: number;
  completionRate: number;
  averageScore: number;
  averageTimeToComplete: number;
  retentionRate: number;
  engagementMetrics: {
    totalLessonsViewed: number;
    averageSessionDuration: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  performanceByLesson: LessonPerformance[];
  difficultyDistribution: Record<string, number>;
  popularityTrend: Array<{
    date: string;
    enrollments: number;
    completions: number;
  }>;
}

export interface LessonPerformance {
  lessonId: string;
  title: string;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  difficultyRating: number;
  dropOffRate: number;
  commonMistakes: string[];
}

export interface UserEngagement {
  userId: string;
  totalTimeSpent: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  averageScore: number;
  learningStreak: number;
  lastActiveDate: Date;
  engagementLevel: 'low' | 'medium' | 'high';
  learningPath: Array<{
    courseId: string;
    progress: number;
    timeSpent: number;
  }>;
}

export interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalLessons: number;
    averageCompletionRate: number;
  };
  userGrowth: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
    retainedUsers: number;
  }>;
  coursePopularity: Array<{
    courseId: string;
    title: string;
    enrollments: number;
    completions: number;
    rating: number;
  }>;
  learningOutcomes: {
    topPerformingCourses: string[];
    topPerformingLessons: string[];
    averageSkillImprovement: number;
    knowledgeRetention: number;
  };
  revenueMetrics?: {
    totalRevenue: number;
    averageRevenuePerUser: number;
    conversionRate: number;
  };
}

export interface LearningInsights {
  personalizedRecommendations: Array<{
    type: 'course' | 'lesson' | 'skill';
    title: string;
    reason: string;
    confidence: number;
  }>;
  skillGaps: string[];
  strengthAreas: string[];
  learningEfficiency: number;
  predictedOutcomes: Array<{
    skill: string;
    predictedMastery: number;
    timeToMastery: number;
  }>;
}

class AnalyticsEngine {
  /**
   * Get comprehensive course analytics
   */
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    try {
      // Get basic course information
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: true,
          lessons: {
            include: {
              assessments: true
            }
          }
        }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Calculate enrollment metrics
      const totalEnrollments = course.enrollments.length;
      const completedEnrollments = course.enrollments.filter(e => e.status === 'completed').length;
      const activeStudents = course.enrollments.filter(e => e.status === 'active').length;
      const completionRate = totalEnrollments > 0 ? completedEnrollments / totalEnrollments : 0;

      // Calculate performance metrics
      const averageScore = await this.calculateAverageCourseScore(courseId);
      const averageTimeToComplete = await this.calculateAverageTimeToComplete(courseId);
      const retentionRate = await this.calculateRetentionRate(courseId);

      // Get engagement metrics
      const engagementMetrics = await this.getEngagementMetrics(courseId);

      // Get lesson performance data
      const performanceByLesson = await this.getLessonPerformanceData(courseId);

      // Get difficulty distribution
      const difficultyDistribution = this.calculateDifficultyDistribution(course.lessons);

      // Get popularity trend
      const popularityTrend = await this.getPopularityTrend(courseId);

      return {
        courseId,
        title: course.title,
        totalEnrollments,
        activeStudents,
        completionRate,
        averageScore,
        averageTimeToComplete,
        retentionRate,
        engagementMetrics,
        performanceByLesson,
        difficultyDistribution,
        popularityTrend
      };
    } catch (error) {
      console.error('Error generating course analytics:', error);
      throw new Error('Failed to generate course analytics');
    }
  }

  /**
   * Get user engagement analytics
   */
  async getUserEngagement(userId: string): Promise<UserEngagement> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          enrollments: {
            include: {
              course: true,
              progress: true
            }
          },
          assessmentResults: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate metrics
      const totalTimeSpent = await this.calculateUserTotalTime(userId);
      const coursesEnrolled = user.enrollments.length;
      const coursesCompleted = user.enrollments.filter(e => e.status === 'completed').length;
      const averageScore = await this.calculateUserAverageScore(userId);
      const learningStreak = await this.calculateLearningStreak(userId);
      const lastActiveDate = await this.getLastActiveDate(userId);
      const engagementLevel = this.calculateEngagementLevel(totalTimeSpent, coursesEnrolled, learningStreak);

      // Generate learning path
      const learningPath = user.enrollments.map(enrollment => ({
        courseId: enrollment.courseId,
        progress: enrollment.progress?.[0]?.completionPercentage || 0,
        timeSpent: enrollment.progress?.[0]?.timeSpent || 0
      }));

      return {
        userId,
        totalTimeSpent,
        coursesEnrolled,
        coursesCompleted,
        averageScore,
        learningStreak,
        lastActiveDate,
        engagementLevel,
        learningPath
      };
    } catch (error) {
      console.error('Error generating user engagement analytics:', error);
      throw new Error('Failed to generate user engagement analytics');
    }
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      // Overview metrics
      const totalUsers = await prisma.user.count();
      const totalCourses = await prisma.course.count();
      const totalEnrollments = await prisma.enrollment.count();
      const totalLessons = await prisma.lesson.count();

      const completedEnrollments = await prisma.enrollment.count({
        where: { status: 'completed' }
      });
      const averageCompletionRate = totalEnrollments > 0 ? completedEnrollments / totalEnrollments : 0;

      // User growth data
      const userGrowth = await this.getUserGrowthData();

      // Course popularity
      const coursePopularity = await this.getCoursePopularityData();

      // Learning outcomes
      const learningOutcomes = await this.getLearningOutcomes();

      return {
        overview: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          totalLessons,
          averageCompletionRate
        },
        userGrowth,
        coursePopularity,
        learningOutcomes
      };
    } catch (error) {
      console.error('Error generating platform analytics:', error);
      throw new Error('Failed to generate platform analytics');
    }
  }

  /**
   * Generate personalized learning insights
   */
  async generateLearningInsights(userId: string): Promise<LearningInsights> {
    try {
      // Get user's learning data
      const userEngagement = await this.getUserEngagement(userId);

      // Generate personalized recommendations using ML/AI
      const personalizedRecommendations = await this.generatePersonalizedRecommendations(userId);

      // Identify skill gaps and strengths
      const skillGaps = await this.identifySkillGaps(userId);
      const strengthAreas = await this.identifyStrengthAreas(userId);

      // Calculate learning efficiency
      const learningEfficiency = await this.calculateLearningEfficiency(userId);

      // Predict learning outcomes
      const predictedOutcomes = await this.predictLearningOutcomes(userId);

      return {
        personalizedRecommendations,
        skillGaps,
        strengthAreas,
        learningEfficiency,
        predictedOutcomes
      };
    } catch (error) {
      console.error('Error generating learning insights:', error);
      throw new Error('Failed to generate learning insights');
    }
  }

  // Private helper methods

  private async calculateAverageCourseScore(courseId: string): Promise<number> {
    const results = await prisma.assessmentResult.aggregate({
      where: {
        assessment: {
          lesson: {
            courseId
          }
        }
      },
      _avg: {
        score: true
      }
    });

    return results._avg.score || 0;
  }

  private async calculateAverageTimeToComplete(courseId: string): Promise<number> {
    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        status: 'completed'
      },
      include: {
        progress: true
      }
    });

    if (completedEnrollments.length === 0) return 0;

    const totalTime = completedEnrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.progress[0]?.timeSpent || 0);
    }, 0);

    return totalTime / completedEnrollments.length;
  }

  private async calculateRetentionRate(courseId: string): Promise<number> {
    // Calculate 7-day retention rate
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const enrolledSevenDaysAgo = await prisma.enrollment.count({
      where: {
        courseId,
        enrolledAt: {
          lte: sevenDaysAgo
        }
      }
    });

    const stillActiveAfterSevenDays = await prisma.enrollment.count({
      where: {
        courseId,
        enrolledAt: {
          lte: sevenDaysAgo
        },
        progress: {
          some: {
            updatedAt: {
              gte: sevenDaysAgo
            }
          }
        }
      }
    });

    return enrolledSevenDaysAgo > 0 ? stillActiveAfterSevenDays / enrolledSevenDaysAgo : 0;
  }

  private async getEngagementMetrics(courseId: string): Promise<CourseAnalytics['engagementMetrics']> {
    // This would typically involve more complex queries and possibly external analytics data
    // For now, return mock data structure
    return {
      totalLessonsViewed: 0,
      averageSessionDuration: 0,
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0
    };
  }

  private async getLessonPerformanceData(courseId: string): Promise<LessonPerformance[]> {
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      include: {
        assessments: {
          include: {
            results: true
          }
        }
      }
    });

    return lessons.map(lesson => ({
      lessonId: lesson.id,
      title: lesson.title,
      completionRate: 0.85, // Mock data
      averageScore: 0.78,
      averageTimeSpent: 25,
      difficultyRating: 3.2,
      dropOffRate: 0.12,
      commonMistakes: []
    }));
  }

  private calculateDifficultyDistribution(lessons: any[]): Record<string, number> {
    const distribution: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    };

    lessons.forEach(lesson => {
      const difficulty = lesson.difficulty || 'intermediate';
      distribution[difficulty] = (distribution[difficulty] || 0) + 1;
    });

    return distribution;
  }

  private async getPopularityTrend(courseId: string): Promise<Array<{date: string; enrollments: number; completions: number}>> {
    // Generate mock trend data for the last 30 days
    const trends = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        enrollments: Math.floor(Math.random() * 20),
        completions: Math.floor(Math.random() * 10)
      });
    }

    return trends;
  }

  private async calculateUserTotalTime(userId: string): Promise<number> {
    const result = await prisma.progress.aggregate({
      where: { userId },
      _sum: {
        timeSpent: true
      }
    });

    return result._sum.timeSpent || 0;
  }

  private async calculateUserAverageScore(userId: string): Promise<number> {
    const result = await prisma.assessmentResult.aggregate({
      where: { userId },
      _avg: {
        score: true
      }
    });

    return result._avg.score || 0;
  }

  private async calculateLearningStreak(userId: string): Promise<number> {
    // Calculate consecutive days of learning activity
    // This is a simplified implementation
    return Math.floor(Math.random() * 30); // Mock data
  }

  private async getLastActiveDate(userId: string): Promise<Date> {
    const lastProgress = await prisma.progress.findFirst({
      where: { userId },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return lastProgress?.updatedAt || new Date();
  }

  private calculateEngagementLevel(
    totalTime: number,
    coursesEnrolled: number,
    streak: number
  ): 'low' | 'medium' | 'high' {
    const score = (totalTime / 60) + (coursesEnrolled * 10) + (streak * 2);

    if (score >= 100) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private async getUserGrowthData(): Promise<Array<{date: string; newUsers: number; activeUsers: number; retainedUsers: number}>> {
    // Mock implementation - in real app, this would query actual data
    const growth = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      growth.push({
        date: date.toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 50),
        activeUsers: Math.floor(Math.random() * 200) + 100,
        retainedUsers: Math.floor(Math.random() * 180) + 90
      });
    }

    return growth;
  }

  private async getCoursePopularityData(): Promise<Array<{courseId: string; title: string; enrollments: number; completions: number; rating: number}>> {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: true
      },
      take: 10
    });

    return courses.map(course => ({
      courseId: course.id,
      title: course.title,
      enrollments: course.enrollments.length,
      completions: course.enrollments.filter(e => e.status === 'completed').length,
      rating: 4.2 + Math.random() * 0.8 // Mock rating
    }));
  }

  private async getLearningOutcomes(): Promise<PlatformAnalytics['learningOutcomes']> {
    return {
      topPerformingCourses: [], // Mock data
      topPerformingLessons: [],
      averageSkillImprovement: 0.75,
      knowledgeRetention: 0.82
    };
  }

  private async generatePersonalizedRecommendations(userId: string): Promise<Array<{type: 'course' | 'lesson' | 'skill'; title: string; reason: string; confidence: number}>> {
    // This would use ML algorithms in a real implementation
    return [
      {
        type: 'course',
        title: 'Advanced JavaScript Concepts',
        reason: 'Based on your progress in intermediate JavaScript',
        confidence: 0.85
      }
    ];
  }

  private async identifySkillGaps(userId: string): Promise<string[]> {
    // Analyze user performance to identify skill gaps
    return ['Advanced CSS', 'Database Design']; // Mock data
  }

  private async identifyStrengthAreas(userId: string): Promise<string[]> {
    // Identify areas where user excels
    return ['JavaScript Fundamentals', 'HTML/CSS Basics']; // Mock data
  }

  private async calculateLearningEfficiency(userId: string): Promise<number> {
    // Calculate how efficiently the user learns (time vs. outcomes)
    return 0.78; // Mock efficiency score
  }

  private async predictLearningOutcomes(userId: string): Promise<Array<{skill: string; predictedMastery: number; timeToMastery: number}>> {
    // Use ML to predict learning outcomes
    return [
      {
        skill: 'React.js',
        predictedMastery: 0.82,
        timeToMastery: 40 // hours
      }
    ]; // Mock predictions
  }
}

// Export singleton instance
export const analyticsEngine = new AnalyticsEngine();
export default analyticsEngine;
/**
 * Comprehensive Analytics Dashboard
 * Displays course performance, user engagement, and platform metrics
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/lib/hooks/useAuth';
import type {
  PlatformAnalytics,
  CourseAnalytics,
  UserEngagement,
  LearningInsights,
} from '@/lib/analytics/analytics-engine';

interface AnalyticsDashboardProps {
  viewType?: 'platform' | 'course' | 'user';
  courseId?: string;
  userId?: string;
  className?: string;
}

export default function AnalyticsDashboard({
  viewType = 'platform',
  courseId,
  userId,
  className = '',
}: AnalyticsDashboardProps) {
  const { user } = useUser();
  const [platformData, setPlatformData] = useState<PlatformAnalytics | null>(null);
  const [courseData, setCourseData] = useState<CourseAnalytics | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'engagement' | 'insights'>('overview');

  // Fetch analytics data based on view type
  const fetchAnalyticsData = useCallback(async () => {
    if (!user) {return;}

    setLoading(true);
    setError(null);

    try {
      const authHeaders = {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      };

      // Fetch platform analytics for admin/instructor
      if (viewType === 'platform' && ['admin', 'instructor'].includes(user.role)) {
        const response = await fetch('/api/analytics/platform', {
          headers: authHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          setPlatformData(data.data);
        }
      }

      // Fetch course analytics if courseId provided
      if (viewType === 'course' && courseId) {
        const response = await fetch(`/api/analytics/course/${courseId}`, {
          headers: authHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          setCourseData(data.data);
        }
      }

      // Fetch user engagement data
      if (viewType === 'user' || !viewType) {
        const targetUserId = userId || user.id;
        const response = await fetch(`/api/analytics/user/${targetUserId}`, {
          headers: authHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          setUserEngagement(data.data);
        }
      }

      // Fetch learning insights
      const insightsResponse = await fetch('/api/analytics/insights', {
        headers: authHeaders,
      });

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setLearningInsights(insightsData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, viewType, courseId, userId]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Helper functions for data formatting
  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Analytics</h3>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <div className="flex space-x-1">
          {['overview', 'performance', 'engagement', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Platform Overview */}
          {platformData && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {platformData.overview.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {platformData.overview.totalCourses.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {platformData.overview.totalEnrollments.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Enrollments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {platformData.overview.totalLessons.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {formatPercentage(platformData.overview.averageCompletionRate)}
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* User Engagement Summary */}
          {userEngagement && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Learning Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(userEngagement.totalTimeSpent)}
                  </div>
                  <div className="text-sm text-gray-600">Time Spent Learning</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userEngagement.coursesCompleted}/{userEngagement.coursesEnrolled}
                  </div>
                  <div className="text-sm text-gray-600">Courses Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(userEngagement.averageScore)}
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {userEngagement.learningStreak}
                  </div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>

              {/* Engagement Level */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">Engagement Level</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEngagementColor(userEngagement.engagementLevel)}`}>
                    {userEngagement.engagementLevel.charAt(0).toUpperCase() + userEngagement.engagementLevel.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <>
          {/* Course Performance */}
          {courseData && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Performance: {courseData.title}</h2>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {courseData.totalEnrollments}
                  </div>
                  <div className="text-sm text-gray-600">Total Enrollments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(courseData.completionRate)}
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(courseData.averageScore)}
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatDuration(courseData.averageTimeToComplete)}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Time to Complete</div>
                </div>
              </div>

              {/* Lesson Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Performance</h3>
                <div className="space-y-3">
                  {courseData.performanceByLesson.map((lesson, index) => (
                    <div key={lesson.lessonId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>Completion: {formatPercentage(lesson.completionRate)}</span>
                            <span>Avg. Score: {formatPercentage(lesson.averageScore)}</span>
                            <span>Avg. Time: {formatDuration(lesson.averageTimeSpent)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Difficulty</div>
                          <div className="font-medium">{lesson.difficultyRating.toFixed(1)}/5</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Engagement Tab */}
      {selectedTab === 'engagement' && userEngagement && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Engagement</h2>

          {/* Learning Path */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Path</h3>
            <div className="space-y-3">
              {userEngagement.learningPath.map((course, index) => (
                <div key={course.courseId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Course {index + 1}</div>
                    <div className="text-sm text-gray-600">Time spent: {formatDuration(course.timeSpent)}</div>
                  </div>
                  <div className="w-32">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{formatPercentage(course.progress / 100)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {selectedTab === 'insights' && learningInsights && (
        <div className="space-y-6">
          {/* Personalized Recommendations */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Insights</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {learningInsights.personalizedRecommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <span className="text-sm text-blue-600 font-medium">
                          {formatPercentage(rec.confidence)} confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Analysis</h3>

                {/* Strengths */}
                <div className="mb-4">
                  <h4 className="font-medium text-green-700 mb-2">Strength Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {learningInsights.strengthAreas.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skill Gaps */}
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Areas for Improvement</h4>
                  <div className="flex flex-wrap gap-2">
                    {learningInsights.skillGaps.map((gap, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Efficiency */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Learning Efficiency</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPercentage(learningInsights.learningEfficiency)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                How efficiently you learn compared to other learners
              </p>
            </div>
          </div>

          {/* Predicted Outcomes */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Predicted Learning Outcomes</h3>
            <div className="space-y-4">
              {learningInsights.predictedOutcomes.map((outcome, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{outcome.skill}</h4>
                      <p className="text-sm text-gray-600">
                        Expected mastery: {formatPercentage(outcome.predictedMastery)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {outcome.timeToMastery}h
                      </div>
                      <div className="text-sm text-gray-600">to mastery</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

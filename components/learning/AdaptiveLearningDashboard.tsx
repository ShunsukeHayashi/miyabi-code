/**
 * Adaptive Learning Dashboard Component
 * Displays personalized learning recommendations and insights
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/lib/hooks/useAuth';
import type {
  LearningRecommendation} from '@/lib/learning/adaptive-engine';
import {
  LearnerProfile,
  AdaptiveContent,
} from '@/lib/learning/adaptive-engine';

interface AdaptiveLearningDashboardProps {
  className?: string;
}

interface KnowledgeGaps {
  gaps: string[];
  suggestions: string[];
}

export default function AdaptiveLearningDashboard({
  className = '',
}: AdaptiveLearningDashboardProps) {
  const { user } = useUser();
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGaps>({ gaps: [], suggestions: [] });
  const [learningInsights, setLearningInsights] = useState<{
    totalTopics: number;
    masteredTopics: number;
    averageScore: number;
    learningStreak: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch learning data
  const fetchLearningData = useCallback(async () => {
    if (!user) {return;}

    setLoading(true);
    setError(null);

    try {
      // Fetch recommendations
      const recommendationsResponse = await fetch('/api/learning/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!recommendationsResponse.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const recommendationsData = await recommendationsResponse.json();
      setRecommendations(recommendationsData.data);

      // Fetch knowledge gaps
      const gapsResponse = await fetch('/api/learning/knowledge-gaps', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (gapsResponse.ok) {
        const gapsData = await gapsResponse.json();
        setKnowledgeGaps(gapsData.data);
      }

      // Fetch learning insights
      const insightsResponse = await fetch('/api/learning/insights', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setLearningInsights(insightsData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch learning data');
      console.error('Error fetching learning data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLearningData();
  }, [fetchLearningData]);

  // Handle recommendation action
  const handleRecommendationAction = async (recommendation: LearningRecommendation) => {
    // Navigate to the recommended lesson or perform action
    window.location.href = `/lessons/${recommendation.lessonId}`;
  };

  // Get recommendation type icon
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'next_lesson':
        return '📚';
      case 'review':
        return '🔄';
      case 'skill_building':
        return '💪';
      case 'challenge':
        return '🏆';
      default:
        return '📖';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) {return 'text-green-600';}
    if (confidence >= 0.6) {return 'text-yellow-600';}
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Learning Data</h3>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={fetchLearningData}
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
      {/* Learning Insights */}
      {learningInsights && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {learningInsights.masteredTopics}
              </div>
              <div className="text-sm text-gray-600">Topics Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(learningInsights.averageScore * 100)}%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {learningInsights.learningStreak}
              </div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {learningInsights.totalTopics}
              </div>
              <div className="text-sm text-gray-600">Total Topics</div>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🎯 Recommended for You
        </h2>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recommendations available yet.</p>
            <p className="text-sm">Complete some lessons to get personalized suggestions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRecommendationAction(recommendation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getRecommendationIcon(recommendation.type)}</span>
                      <h3 className="font-medium text-gray-900">
                        {recommendation.title}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {recommendation.difficulty}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-2">
                      {recommendation.reason}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>⏱️ {recommendation.estimatedDuration} min</span>
                      <span className={`font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                        {Math.round(recommendation.confidence * 100)}% match
                      </span>
                    </div>
                  </div>

                  <button className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Knowledge Gaps */}
      {knowledgeGaps.gaps.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🎯 Areas for Improvement
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Knowledge Gaps</h3>
              <div className="flex flex-wrap gap-2">
                {knowledgeGaps.gaps.map((gap, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>

            {knowledgeGaps.suggestions.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Suggestions</h3>
                <ul className="list-disc list-inside space-y-1">
                  {knowledgeGaps.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-600 text-sm">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Learning Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          💡 Adaptive Learning Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Personalization</h3>
            <p className="text-gray-600">
              Content is automatically adapted to your learning style and pace.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Smart Recommendations</h3>
            <p className="text-gray-600">
              AI analyzes your performance to suggest the best next steps.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Progress Tracking</h3>
            <p className="text-gray-600">
              Your knowledge map updates in real-time as you learn.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Difficulty Adjustment</h3>
            <p className="text-gray-600">
              Content difficulty adjusts based on your mastery level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom React Hook for AI-powered features
 * Provides easy access to all AI services in React components
 */

import { useState, useCallback } from 'react';
import type {
  CourseContentSuggestion,
  LessonContent,
  ContentAnalysis} from '@/lib/ai/gemini-service';
import {
  AssessmentGeneration,
} from '@/lib/ai/gemini-service';

interface UseAIReturn {
  // Course suggestions
  generateCourseSuggestions: (topic: string, targetAudience?: string) => Promise<CourseContentSuggestion[]>;
  courseSuggestionsLoading: boolean;

  // Lesson content
  generateLessonContent: (
    courseTitle: string,
    lessonTopic: string,
    difficulty: string,
    duration: number
  ) => Promise<LessonContent>;
  lessonContentLoading: boolean;

  // Content analysis
  analyzeContent: (content: string, targetLevel: string) => Promise<ContentAnalysis>;
  contentAnalysisLoading: boolean;

  // Chat assistant
  chatWithAssistant: (messages: any[]) => Promise<string>;
  chatLoading: boolean;

  // Error state
  error: string | null;
  clearError: () => void;
}

export function useAI(): UseAIReturn {
  const [courseSuggestionsLoading, setCourseSuggestionsLoading] = useState(false);
  const [lessonContentLoading, setLessonContentLoading] = useState(false);
  const [contentAnalysisLoading, setContentAnalysisLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<Response>,
    setLoading: (loading: boolean) => void,
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateCourseSuggestions = useCallback(
    async (topic: string, targetAudience?: string): Promise<CourseContentSuggestion[]> => handleApiCall<CourseContentSuggestion[]>(
      () => fetch('/api/ai/course-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, targetAudience }),
      }),
      setCourseSuggestionsLoading,
    ),
    [handleApiCall],
  );

  const generateLessonContent = useCallback(
    async (
      courseTitle: string,
      lessonTopic: string,
      difficulty: string,
      duration: number,
    ): Promise<LessonContent> => handleApiCall<LessonContent>(
      () => fetch('/api/ai/lesson-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseTitle, lessonTopic, difficulty, duration }),
      }),
      setLessonContentLoading,
    ),
    [handleApiCall],
  );

  const analyzeContent = useCallback(
    async (content: string, targetLevel: string): Promise<ContentAnalysis> => handleApiCall<ContentAnalysis>(
      () => fetch('/api/ai/content-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, targetLevel }),
      }),
      setContentAnalysisLoading,
    ),
    [handleApiCall],
  );

  const chatWithAssistant = useCallback(
    async (messages: any[]): Promise<string> => handleApiCall<{ response: string }>(
      () => fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      }),
      setChatLoading,
    ).then(data => data.response),
    [handleApiCall],
  );

  return {
    generateCourseSuggestions,
    courseSuggestionsLoading,
    generateLessonContent,
    lessonContentLoading,
    analyzeContent,
    contentAnalysisLoading,
    chatWithAssistant,
    chatLoading,
    error,
    clearError,
  };
}

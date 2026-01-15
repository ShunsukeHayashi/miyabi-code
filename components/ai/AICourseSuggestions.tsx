/**
 * AI Course Suggestions Component
 * Provides AI-generated course ideas and content
 */

'use client';

import { useState } from 'react';
import { useAI } from '@/lib/hooks/useAI';
import type { CourseContentSuggestion } from '@/lib/ai/gemini-service';

interface AICourseSuggestionsProps {
  onSuggestionSelect?: (suggestion: CourseContentSuggestion) => void;
  className?: string;
}

export default function AICourseSuggestions({
  onSuggestionSelect,
  className = '',
}: AICourseSuggestionsProps) {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [suggestions, setSuggestions] = useState<CourseContentSuggestion[]>([]);

  const {
    generateCourseSuggestions,
    courseSuggestionsLoading,
    error,
    clearError,
  } = useAI();

  const handleGenerateSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      return;
    }

    try {
      const newSuggestions = await generateCourseSuggestions(
        topic,
        targetAudience || undefined,
      );
      setSuggestions(newSuggestions);
    } catch (err) {
      // Error is handled by the useAI hook
      console.error('Error generating suggestions:', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Course Suggestions
        </h2>
        <p className="text-gray-600">
          Get AI-powered course ideas based on your topic and audience.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerateSuggestions} className="space-y-4 mb-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Course Topic *
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Python programming, Digital marketing, Photography"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
            Target Audience
          </label>
          <input
            type="text"
            id="audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Beginners, Working professionals, Students"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={courseSuggestionsLoading || !topic.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {courseSuggestionsLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Suggestions...
            </>
          ) : (
            'Generate Course Ideas'
          )}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Display */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Course Suggestions
          </h3>

          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSuggestionSelect?.(suggestion)}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-xl font-semibold text-gray-900">
                  {suggestion.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(suggestion.difficulty)}`}>
                    {suggestion.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">
                    {suggestion.estimatedDuration}h
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                {suggestion.description}
              </p>

              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Course Outline:</h5>
                <ul className="list-disc list-inside space-y-1">
                  {suggestion.outline.map((topic, topicIndex) => (
                    <li key={topicIndex} className="text-gray-600 text-sm">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              {suggestion.prerequisites.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Prerequisites:</h5>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.prerequisites.map((prereq, prereqIndex) => (
                      <span
                        key={prereqIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                      >
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {onSuggestionSelect && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Use This Suggestion →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !courseSuggestionsLoading && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>Enter a topic above to generate AI-powered course suggestions!</p>
        </div>
      )}
    </div>
  );
}

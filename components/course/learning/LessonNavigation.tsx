/**
 * Lesson Navigation Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Play,
  Lock,
  Clock,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import { LessonWithRelations, ProgressData } from '../shared/types';

interface NavigationLesson {
  id: string;
  title: string;
  duration?: number;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  isCompleted: boolean;
  isLocked: boolean;
  order: number;
}

interface LessonNavigationProps {
  currentLesson: LessonWithRelations;
  lessons: NavigationLesson[];
  progress?: ProgressData | null;
  onLessonSelect: (lessonId: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showProgress?: boolean;
  className?: string;
}

export function LessonNavigation({
  currentLesson,
  lessons,
  progress,
  onLessonSelect,
  onPrevious,
  onNext,
  showProgress = true,
  className = ''
}: LessonNavigationProps) {
  const currentIndex = lessons.findIndex(lesson => lesson.id === currentLesson.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < lessons.length - 1;

  const completedLessons = lessons.filter(lesson => lesson.isCompleted).length;
  const totalLessons = lessons.length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLessonIcon = (lesson: NavigationLesson) => {
    if (lesson.isCompleted) {
      return <CheckCircle size={16} className="text-miyabi-green" />;
    }

    if (lesson.isLocked) {
      return <Lock size={16} className="text-gray-500" />;
    }

    switch (lesson.type) {
      case 'video':
        return <Play size={16} className="text-miyabi-blue" />;
      case 'text':
        return <BookOpen size={16} className="text-gray-400" />;
      case 'quiz':
        return <div className="w-4 h-4 bg-miyabi-purple rounded-full flex items-center justify-center">
          <span className="text-xs text-white">?</span>
        </div>;
      case 'assignment':
        return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white">A</span>
        </div>;
      default:
        return <Play size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Course Progress</h3>
          <span className="text-sm text-gray-400">
            {completedLessons}/{totalLessons} lessons
          </span>
        </div>

        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-miyabi-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Current Lesson Info */}
      <div className="p-4 border-b border-gray-700 bg-gray-900/50">
        <div className="flex items-start gap-3">
          {getLessonIcon({
            id: currentLesson.id,
            title: currentLesson.title,
            duration: currentLesson.duration,
            type: currentLesson.type as any,
            isCompleted: false, // You'd check this from progress data
            isLocked: false,
            order: currentLesson.order
          })}
          <div className="flex-grow min-w-0">
            <h4 className="font-medium text-white truncate">{currentLesson.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <span>Lesson {currentLesson.order}</span>
              {currentLesson.duration && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatDuration(currentLesson.duration)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${hasPrevious
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-900 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <button
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            title="Restart lesson"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${hasNext
                ? 'bg-miyabi-blue hover:bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Lesson List */}
      <div className="max-h-96 overflow-y-auto">
        {lessons.map((lesson, index) => {
          const isActive = lesson.id === currentLesson.id;
          const isAccessible = !lesson.isLocked;

          return (
            <button
              key={lesson.id}
              onClick={() => isAccessible && onLessonSelect(lesson.id)}
              disabled={lesson.isLocked}
              className={`
                w-full p-4 text-left border-b border-gray-700 last:border-b-0
                transition-colors
                ${isActive
                  ? 'bg-miyabi-blue/20 border-miyabi-blue/30'
                  : isAccessible
                    ? 'hover:bg-gray-700'
                    : 'cursor-not-allowed opacity-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Lesson Number */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${isActive
                    ? 'bg-miyabi-blue text-white'
                    : lesson.isCompleted
                      ? 'bg-miyabi-green text-white'
                      : lesson.isLocked
                        ? 'bg-gray-600 text-gray-400'
                        : 'bg-gray-700 text-gray-300'
                  }
                `}>
                  {lesson.isCompleted ? (
                    <CheckCircle size={16} />
                  ) : lesson.isLocked ? (
                    <Lock size={12} />
                  ) : (
                    lesson.order
                  )}
                </div>

                {/* Lesson Icon */}
                <div className="flex-shrink-0">
                  {getLessonIcon(lesson)}
                </div>

                {/* Lesson Info */}
                <div className="flex-grow min-w-0">
                  <div className={`font-medium truncate ${
                    isActive ? 'text-miyabi-blue' : 'text-white'
                  }`}>
                    {lesson.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="capitalize">{lesson.type}</span>
                    {lesson.duration && (
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{formatDuration(lesson.duration)}</span>
                      </div>
                    )}
                    {lesson.isCompleted && (
                      <span className="text-miyabi-green">Completed</span>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {isActive && (
                    <div className="w-2 h-2 bg-miyabi-blue rounded-full" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
          <BookOpen size={16} />
          <span>Download Course Notes</span>
        </button>
      </div>
    </div>
  );
}

export default LessonNavigation;
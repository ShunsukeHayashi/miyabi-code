/**
 * Course Syllabus Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Play,
  FileText,
  Clock,
  Lock,
  CheckCircle,
  PlayCircle,
  Download,
  Quiz
} from 'lucide-react';
import { ProgressData } from '../shared/types';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration?: number; // in minutes
  isPreview: boolean;
  isCompleted: boolean;
  videoUrl?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface CourseSyllabusProps {
  courseId: string;
  isEnrolled: boolean;
  progress?: ProgressData | null;
  className?: string;
}

export function CourseSyllabus({
  courseId,
  isEnrolled,
  progress,
  className = ''
}: CourseSyllabusProps) {
  // Mock data - in real app, this would come from API
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      title: 'Getting Started',
      description: 'Introduction to the course and setting up your environment',
      isExpanded: true,
      lessons: [
        {
          id: '1-1',
          title: 'Welcome to the Course',
          description: 'Course overview and what you will learn',
          type: 'video',
          duration: 5,
          isPreview: true,
          isCompleted: true,
          videoUrl: '/videos/welcome.mp4'
        },
        {
          id: '1-2',
          title: 'Setting Up Your Environment',
          description: 'Installing required software and tools',
          type: 'video',
          duration: 15,
          isPreview: false,
          isCompleted: true
        },
        {
          id: '1-3',
          title: 'Course Resources',
          description: 'Download and review course materials',
          type: 'text',
          duration: 5,
          isPreview: false,
          isCompleted: false,
          attachments: [
            {
              id: 'att-1',
              name: 'Course Handbook.pdf',
              url: '/downloads/handbook.pdf',
              type: 'pdf'
            },
            {
              id: 'att-2',
              name: 'Starter Code.zip',
              url: '/downloads/starter-code.zip',
              type: 'zip'
            }
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Core Concepts',
      description: 'Learn the fundamental concepts and principles',
      isExpanded: false,
      lessons: [
        {
          id: '2-1',
          title: 'Understanding the Basics',
          type: 'video',
          duration: 25,
          isPreview: false,
          isCompleted: false
        },
        {
          id: '2-2',
          title: 'Hands-on Exercise 1',
          type: 'assignment',
          duration: 30,
          isPreview: false,
          isCompleted: false
        },
        {
          id: '2-3',
          title: 'Knowledge Check',
          type: 'quiz',
          duration: 10,
          isPreview: false,
          isCompleted: false
        }
      ]
    },
    {
      id: '3',
      title: 'Advanced Topics',
      description: 'Dive deeper into advanced concepts',
      isExpanded: false,
      lessons: [
        {
          id: '3-1',
          title: 'Advanced Techniques',
          type: 'video',
          duration: 35,
          isPreview: false,
          isCompleted: false
        },
        {
          id: '3-2',
          title: 'Real-world Project',
          type: 'assignment',
          duration: 60,
          isPreview: false,
          isCompleted: false
        }
      ]
    }
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!isEnrolled && !lesson.isPreview) {
      // Show enrollment prompt
      return;
    }

    // Navigate to lesson or show lesson content
    console.log('Playing lesson:', lesson.title);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLessonIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle size={20} className="text-miyabi-green" />;
    }

    switch (type) {
      case 'video':
        return <PlayCircle size={20} className="text-miyabi-blue" />;
      case 'text':
        return <FileText size={20} className="text-gray-400" />;
      case 'quiz':
        return <Quiz size={20} className="text-miyabi-purple" />;
      case 'assignment':
        return <FileText size={20} className="text-orange-400" />;
      default:
        return <PlayCircle size={20} className="text-gray-400" />;
    }
  };

  const getTotalDuration = () => {
    return sections.reduce((total, section) => {
      return total + section.lessons.reduce((sectionTotal, lesson) => {
        return sectionTotal + (lesson.duration || 0);
      }, 0);
    }, 0);
  };

  const getCompletedLessons = () => {
    return sections.reduce((total, section) => {
      return total + section.lessons.filter(lesson => lesson.isCompleted).length;
    }, 0);
  };

  const getTotalLessons = () => {
    return sections.reduce((total, section) => total + section.lessons.length, 0);
  };

  const completedLessons = getCompletedLessons();
  const totalLessons = getTotalLessons();
  const totalDuration = getTotalDuration();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Course Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Course Content</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-900/50 rounded-lg">
            <div className="text-xl font-bold text-miyabi-blue mb-1">{sections.length}</div>
            <div className="text-gray-400">Sections</div>
          </div>

          <div className="text-center p-3 bg-gray-900/50 rounded-lg">
            <div className="text-xl font-bold text-miyabi-green mb-1">{totalLessons}</div>
            <div className="text-gray-400">Lessons</div>
          </div>

          <div className="text-center p-3 bg-gray-900/50 rounded-lg">
            <div className="text-xl font-bold text-miyabi-purple mb-1">
              {formatDuration(totalDuration)}
            </div>
            <div className="text-gray-400">Total Duration</div>
          </div>
        </div>

        {isEnrolled && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
              <span>Your Progress</span>
              <span>{completedLessons}/{totalLessons} lessons completed</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-miyabi-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-6 text-left hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {section.isExpanded ? (
                      <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                    <span className="text-lg font-semibold text-white">
                      Section {sectionIndex + 1}: {section.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{section.lessons.length} lessons</span>
                  <span>
                    {formatDuration(
                      section.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0)
                    )}
                  </span>
                </div>
              </div>

              {section.description && (
                <p className="mt-2 text-gray-400 text-sm">{section.description}</p>
              )}
            </button>

            {/* Section Content */}
            {section.isExpanded && (
              <div className="border-t border-gray-700">
                {section.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson.id}
                    className="border-b border-gray-700/50 last:border-b-0"
                  >
                    <button
                      onClick={() => handleLessonClick(lesson)}
                      disabled={!isEnrolled && !lesson.isPreview}
                      className={`
                        w-full p-4 text-left hover:bg-gray-700/30 transition-colors
                        ${(!isEnrolled && !lesson.isPreview) ? 'opacity-50 cursor-not-allowed' : ''}
                        ${lesson.isCompleted ? 'bg-miyabi-green/5' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                          {/* Lesson Number */}
                          <span className="text-sm text-gray-500 w-8 text-center">
                            {sectionIndex + 1}.{lessonIndex + 1}
                          </span>

                          {/* Lesson Icon */}
                          {getLessonIcon(lesson.type, lesson.isCompleted)}

                          {/* Lesson Info */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className={`font-medium truncate ${
                                lesson.isCompleted ? 'text-miyabi-green' : 'text-white'
                              }`}>
                                {lesson.title}
                              </h4>

                              {lesson.isPreview && (
                                <span className="bg-miyabi-blue/20 text-miyabi-blue px-2 py-0.5 rounded text-xs font-medium">
                                  Preview
                                </span>
                              )}

                              {!isEnrolled && !lesson.isPreview && (
                                <Lock size={14} className="text-gray-500" />
                              )}
                            </div>

                            {lesson.description && (
                              <p className="text-sm text-gray-400 truncate mt-1">
                                {lesson.description}
                              </p>
                            )}

                            {/* Attachments */}
                            {lesson.attachments && lesson.attachments.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Download size={14} className="text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  {lesson.attachments.length} attachment{lesson.attachments.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-2 text-sm text-gray-400 ml-4">
                          <Clock size={14} />
                          <span>{lesson.duration ? formatDuration(lesson.duration) : '—'}</span>
                        </div>
                      </div>
                    </button>

                    {/* Lesson Attachments (when expanded) */}
                    {lesson.attachments && lesson.attachments.length > 0 && (isEnrolled || lesson.isPreview) && (
                      <div className="px-4 pb-4 bg-gray-900/50">
                        <div className="ml-12 space-y-2">
                          {lesson.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-miyabi-blue hover:text-blue-400 transition-colors"
                            >
                              <Download size={14} />
                              <span>{attachment.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enrollment CTA */}
      {!isEnrolled && (
        <div className="bg-gradient-to-r from-miyabi-purple/20 to-miyabi-blue/20 border border-miyabi-purple/30 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Get Full Access to All Course Content
          </h3>
          <p className="text-gray-300 mb-4">
            Enroll now to unlock all {totalLessons} lessons and {formatDuration(totalDuration)} of content.
          </p>
          <button className="bg-miyabi-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors">
            Enroll Now
          </button>
        </div>
      )}
    </div>
  );
}

export default CourseSyllabus;
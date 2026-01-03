/**
 * Lesson Sidebar Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Clock,
  Download,
  Share2,
  Flag,
  Heart,
  Users,
  Star,
  Award
} from 'lucide-react';
import LessonNavigation from './LessonNavigation';
import { LessonWithRelations, ProgressData } from '../shared/types';

interface LessonSidebarProps {
  currentLesson: LessonWithRelations;
  courseId: string;
  progress?: ProgressData | null;
  onLessonSelect: (lessonId: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}

interface SidebarSection {
  id: string;
  title: string;
  isOpen: boolean;
}

export function LessonSidebar({
  currentLesson,
  courseId,
  progress,
  onLessonSelect,
  onPrevious,
  onNext,
  className = ''
}: LessonSidebarProps) {
  const [sections, setSections] = useState<SidebarSection[]>([
    { id: 'progress', title: 'Course Progress', isOpen: true },
    { id: 'resources', title: 'Resources', isOpen: false },
    { id: 'discussion', title: 'Discussion', isOpen: false },
    { id: 'announcements', title: 'Announcements', isOpen: false },
  ]);

  // Mock data - in real app, this would come from API
  const mockLessons = [
    {
      id: '1',
      title: 'Introduction to the Course',
      duration: 5,
      type: 'video' as const,
      isCompleted: true,
      isLocked: false,
      order: 1,
    },
    {
      id: '2',
      title: 'Setting Up Your Environment',
      duration: 15,
      type: 'video' as const,
      isCompleted: true,
      isLocked: false,
      order: 2,
    },
    {
      id: '3',
      title: 'Understanding the Basics',
      duration: 25,
      type: 'video' as const,
      isCompleted: false,
      isLocked: false,
      order: 3,
    },
    {
      id: '4',
      title: 'Practice Exercise',
      duration: 30,
      type: 'assignment' as const,
      isCompleted: false,
      isLocked: false,
      order: 4,
    },
    {
      id: '5',
      title: 'Knowledge Check',
      duration: 10,
      type: 'quiz' as const,
      isCompleted: false,
      isLocked: true,
      order: 5,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  const getSection = (sectionId: string) => {
    return sections.find(s => s.id === sectionId);
  };

  return (
    <div className={`bg-gray-800 border-l border-gray-700 flex flex-col h-full ${className}`}>
      {/* Course Progress Section */}
      <div className="flex-shrink-0">
        <button
          onClick={() => toggleSection('progress')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors"
        >
          <span className="font-semibold text-white">
            {getSection('progress')?.title}
          </span>
          {getSection('progress')?.isOpen ? (
            <ChevronDown size={20} className="text-gray-400" />
          ) : (
            <ChevronRight size={20} className="text-gray-400" />
          )}
        </button>

        {getSection('progress')?.isOpen && (
          <div className="border-b border-gray-700">
            <LessonNavigation
              currentLesson={currentLesson}
              lessons={mockLessons}
              progress={progress}
              onLessonSelect={onLessonSelect}
              onPrevious={onPrevious}
              onNext={onNext}
              showProgress={true}
              className="border-0 rounded-none"
            />
          </div>
        )}
      </div>

      {/* Resources Section */}
      <div className="flex-shrink-0">
        <button
          onClick={() => toggleSection('resources')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors"
        >
          <span className="font-semibold text-white flex items-center gap-2">
            <Download size={16} />
            {getSection('resources')?.title}
          </span>
          {getSection('resources')?.isOpen ? (
            <ChevronDown size={20} className="text-gray-400" />
          ) : (
            <ChevronRight size={20} className="text-gray-400" />
          )}
        </button>

        {getSection('resources')?.isOpen && (
          <div className="border-b border-gray-700 p-4 space-y-3">
            {/* Lesson Resources */}
            {currentLesson.attachments && currentLesson.attachments.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Lesson Materials</h4>
                <div className="space-y-2">
                  {currentLesson.attachments.map((attachment: any) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Download size={16} className="text-miyabi-blue" />
                      <div className="flex-grow min-w-0">
                        <div className="text-sm text-white truncate">{attachment.name}</div>
                        <div className="text-xs text-gray-400">{attachment.type}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <BookOpen size={24} className="mx-auto text-gray-500 mb-2" />
                <p className="text-gray-500 text-sm">No resources for this lesson</p>
              </div>
            )}

            {/* Course Resources */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Course Resources</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                  <BookOpen size={16} className="text-miyabi-blue" />
                  <div className="flex-grow">
                    <div className="text-sm text-white">Course Handbook</div>
                    <div className="text-xs text-gray-400">PDF • 2.4 MB</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                  <Download size={16} className="text-miyabi-blue" />
                  <div className="flex-grow">
                    <div className="text-sm text-white">Source Code</div>
                    <div className="text-xs text-gray-400">ZIP • 1.1 MB</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                  <BookOpen size={16} className="text-miyabi-blue" />
                  <div className="flex-grow">
                    <div className="text-sm text-white">Cheat Sheet</div>
                    <div className="text-xs text-gray-400">PDF • 512 KB</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discussion Section */}
      <div className="flex-shrink-0">
        <button
          onClick={() => toggleSection('discussion')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors"
        >
          <span className="font-semibold text-white flex items-center gap-2">
            <MessageSquare size={16} />
            {getSection('discussion')?.title}
            <span className="bg-miyabi-blue text-white text-xs px-2 py-0.5 rounded-full">3</span>
          </span>
          {getSection('discussion')?.isOpen ? (
            <ChevronDown size={20} className="text-gray-400" />
          ) : (
            <ChevronRight size={20} className="text-gray-400" />
          )}
        </button>

        {getSection('discussion')?.isOpen && (
          <div className="border-b border-gray-700 p-4 space-y-3">
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {/* Discussion Items */}
              {[
                {
                  user: 'Sarah Chen',
                  question: 'Can you explain the difference between these two approaches?',
                  time: '2 hours ago',
                  replies: 3
                },
                {
                  user: 'Mike Johnson',
                  question: 'Great explanation! Is there a practice exercise for this?',
                  time: '5 hours ago',
                  replies: 1
                },
                {
                  user: 'Emily Davis',
                  question: 'I\'m getting an error in the code example. Any suggestions?',
                  time: '1 day ago',
                  replies: 2
                }
              ].map((item, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-white">{item.user}</span>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{item.question}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{item.replies} replies</span>
                    <button className="hover:text-miyabi-blue transition-colors">Reply</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 p-3 bg-miyabi-blue hover:bg-blue-600 text-white rounded-lg transition-colors">
              <MessageSquare size={16} />
              Ask a Question
            </button>
          </div>
        )}
      </div>

      {/* Announcements Section */}
      <div className="flex-shrink-0">
        <button
          onClick={() => toggleSection('announcements')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors"
        >
          <span className="font-semibold text-white flex items-center gap-2">
            <Flag size={16} />
            {getSection('announcements')?.title}
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">1</span>
          </span>
          {getSection('announcements')?.isOpen ? (
            <ChevronDown size={20} className="text-gray-400" />
          ) : (
            <ChevronRight size={20} className="text-gray-400" />
          )}
        </button>

        {getSection('announcements')?.isOpen && (
          <div className="border-b border-gray-700 p-4">
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-400">Course Update</span>
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
                <p className="text-sm text-gray-300">
                  New practice exercises have been added to Section 3. Check them out!
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Welcome!</span>
                  <span className="text-xs text-gray-400">1 week ago</span>
                </div>
                <p className="text-sm text-gray-300">
                  Welcome to the course! Don't forget to join our community Discord.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex-grow flex flex-col justify-end">
        <div className="p-4 border-t border-gray-700 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-xs">
              <Share2 size={14} />
              Share
            </button>
            <button className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-xs">
              <Heart size={14} />
              Save
            </button>
          </div>

          {/* Course Stats */}
          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-white mb-2">Course Stats</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Students</span>
                <span className="text-white">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Average Rating</span>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-current" />
                  <span className="text-white">4.8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Completion Rate</span>
                <span className="text-white">89%</span>
              </div>
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="bg-gradient-to-r from-miyabi-purple/20 to-miyabi-blue/20 border border-miyabi-purple/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-miyabi-purple" />
              <span className="text-sm font-medium text-white">Certificate</span>
            </div>
            <p className="text-xs text-gray-300 mb-2">
              Complete this course to earn your certificate
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-miyabi-purple h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress?.overall || 0}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {progress?.overall || 0}% complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonSidebar;
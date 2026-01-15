/**
 * Recent Activity Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  Play,
  BookOpen,
  Award,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  FileText,
  Users,
  Target,
  Zap,
  Trophy,
  Download,
} from 'lucide-react';
import { useUserActivity } from '../shared/hooks';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface RecentActivityProps {
  userId: string;
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'lesson_completed' | 'course_enrolled' | 'achievement_earned' | 'quiz_completed' | 'assignment_submitted' | 'discussion_posted' | 'certificate_earned' | 'streak_milestone';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    courseId?: string;
    courseName?: string;
    lessonId?: string;
    lessonName?: string;
    achievementId?: string;
    points?: number;
    score?: number;
    streakDays?: number;
  };
  icon: React.ReactNode;
  color: string;
}

type ActivityFilter = 'all' | 'courses' | 'achievements' | 'assessments' | 'social';
type TimeFilter = 'today' | 'week' | 'month' | 'all';

export function RecentActivity({ userId, className = '' }: RecentActivityProps) {
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  // Mock activity data
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'lesson_completed',
      title: 'Completed "React Hooks Fundamentals"',
      description: 'You mastered the basics of React Hooks and earned 50 points',
      timestamp: new Date('2024-01-16T14:30:00'),
      metadata: {
        courseId: 'course-1',
        courseName: 'Advanced React Patterns',
        lessonId: 'lesson-3',
        lessonName: 'React Hooks Fundamentals',
        points: 50,
      },
      icon: <Play className="text-miyabi-blue" size={20} />,
      color: 'miyabi-blue',
    },
    {
      id: '2',
      type: 'achievement_earned',
      title: 'Achievement Unlocked: Quick Learner',
      description: 'Completed 3 lessons in a single day',
      timestamp: new Date('2024-01-16T13:15:00'),
      metadata: {
        achievementId: 'quick-learner',
        points: 100,
      },
      icon: <Zap className="text-orange-500" size={20} />,
      color: 'orange-500',
    },
    {
      id: '3',
      type: 'quiz_completed',
      title: 'TypeScript Fundamentals Quiz',
      description: 'Scored 85% on the final assessment',
      timestamp: new Date('2024-01-15T16:45:00'),
      metadata: {
        courseId: 'course-2',
        courseName: 'TypeScript Fundamentals',
        score: 85,
        points: 75,
      },
      icon: <CheckCircle className="text-miyabi-green" size={20} />,
      color: 'miyabi-green',
    },
    {
      id: '4',
      type: 'discussion_posted',
      title: 'Posted in Course Discussion',
      description: 'Asked a question about higher-order components in React',
      timestamp: new Date('2024-01-15T11:20:00'),
      metadata: {
        courseId: 'course-1',
        courseName: 'Advanced React Patterns',
      },
      icon: <MessageSquare className="text-miyabi-purple" size={20} />,
      color: 'miyabi-purple',
    },
    {
      id: '5',
      type: 'course_enrolled',
      title: 'Enrolled in "Node.js Backend Development"',
      description: 'Started a new learning journey with Alex Rivera',
      timestamp: new Date('2024-01-14T09:30:00'),
      metadata: {
        courseId: 'course-3',
        courseName: 'Node.js Backend Development',
      },
      icon: <BookOpen className="text-miyabi-blue" size={20} />,
      color: 'miyabi-blue',
    },
    {
      id: '6',
      type: 'certificate_earned',
      title: 'Certificate Earned: JavaScript Mastery',
      description: 'Completed all requirements for JavaScript Fundamentals course',
      timestamp: new Date('2024-01-13T15:00:00'),
      metadata: {
        courseId: 'course-4',
        courseName: 'JavaScript Fundamentals',
        points: 200,
      },
      icon: <Award className="text-yellow-500" size={20} />,
      color: 'yellow-500',
    },
    {
      id: '7',
      type: 'streak_milestone',
      title: 'Learning Streak: 7 Days',
      description: 'You\'ve maintained a consistent learning schedule for a week!',
      timestamp: new Date('2024-01-12T18:00:00'),
      metadata: {
        streakDays: 7,
        points: 50,
      },
      icon: <Calendar className="text-miyabi-green" size={20} />,
      color: 'miyabi-green',
    },
    {
      id: '8',
      type: 'assignment_submitted',
      title: 'Assignment Submitted: React Todo App',
      description: 'Built a complete todo application using React hooks',
      timestamp: new Date('2024-01-12T14:30:00'),
      metadata: {
        courseId: 'course-1',
        courseName: 'Advanced React Patterns',
        points: 100,
      },
      icon: <FileText className="text-miyabi-purple" size={20} />,
      color: 'miyabi-purple',
    },
  ];

  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lesson_completed': return 'Lesson';
      case 'course_enrolled': return 'Enrollment';
      case 'achievement_earned': return 'Achievement';
      case 'quiz_completed': return 'Quiz';
      case 'assignment_submitted': return 'Assignment';
      case 'discussion_posted': return 'Discussion';
      case 'certificate_earned': return 'Certificate';
      case 'streak_milestone': return 'Streak';
      default: return 'Activity';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const filterActivities = (activities: ActivityItem[]) => {
    let filtered = activities;

    // Filter by activity type
    if (activityFilter !== 'all') {
      switch (activityFilter) {
        case 'courses':
          filtered = filtered.filter(a =>
            ['lesson_completed', 'course_enrolled'].includes(a.type),
          );
          break;
        case 'achievements':
          filtered = filtered.filter(a =>
            ['achievement_earned', 'certificate_earned', 'streak_milestone'].includes(a.type),
          );
          break;
        case 'assessments':
          filtered = filtered.filter(a =>
            ['quiz_completed', 'assignment_submitted'].includes(a.type),
          );
          break;
        case 'social':
          filtered = filtered.filter(a =>
            ['discussion_posted'].includes(a.type),
          );
          break;
      }
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (timeFilter) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(a => a.timestamp >= cutoffDate);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const filteredActivities = filterActivities(mockActivities);

  // Activity stats
  const stats = {
    total: filteredActivities.length,
    lessonsCompleted: filteredActivities.filter(a => a.type === 'lesson_completed').length,
    achievementsEarned: filteredActivities.filter(a => a.type === 'achievement_earned').length,
    totalPoints: filteredActivities.reduce((sum, a) => sum + (a.metadata?.points || 0), 0),
  };

  const ActivityCard = ({ activity }: { activity: ActivityItem }) => (
    <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className={`w-10 h-10 rounded-full bg-${activity.color}/20 flex items-center justify-center flex-shrink-0`}>
        {activity.icon}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-white">{activity.title}</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full bg-${activity.color}/20 text-${activity.color}`}>
              {getActivityTypeLabel(activity.type)}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(activity.timestamp)}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-2">{activity.description}</p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {activity.metadata?.courseName && (
            <div className="flex items-center gap-1">
              <BookOpen size={12} />
              <span>{activity.metadata.courseName}</span>
            </div>
          )}
          {activity.metadata?.points && (
            <div className="flex items-center gap-1">
              <Star size={12} />
              <span>+{activity.metadata.points} points</span>
            </div>
          )}
          {activity.metadata?.score && (
            <div className="flex items-center gap-1">
              <Target size={12} />
              <span>{activity.metadata.score}% score</span>
            </div>
          )}
          {activity.metadata?.streakDays && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{activity.metadata.streakDays} days</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Recent Activity</h1>
        <p className="text-gray-400">Track your learning progress and achievements</p>
      </div>

      {/* Activity Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-blue">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Activities</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-green">{stats.lessonsCompleted}</div>
          <div className="text-sm text-gray-400">Lessons Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{stats.achievementsEarned}</div>
          <div className="text-sm text-gray-400">Achievements</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-purple">{stats.totalPoints}</div>
          <div className="text-sm text-gray-400">Points Earned</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-400 flex items-center">Filter by:</span>
          {(['all', 'courses', 'achievements', 'assessments', 'social'] as ActivityFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActivityFilter(filter)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activityFilter === filter
                  ? 'bg-miyabi-blue text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-400 flex items-center">Time:</span>
          {(['today', 'week', 'month', 'all'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                timeFilter === filter
                  ? 'bg-miyabi-blue text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        {filteredActivities.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <Clock className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No activity found</h3>
            <p className="text-gray-400 mb-4">
              {activityFilter !== 'all' || timeFilter !== 'all'
                ? 'Try adjusting your filters to see more activities.'
                : 'Start learning to see your activity here.'
              }
            </p>
            <button className="bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
              Start Learning
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group activities by date */}
            {Object.entries(
              filteredActivities.reduce((groups, activity) => {
                const dateKey = activity.timestamp.toDateString();
                if (!groups[dateKey]) {
                  groups[dateKey] = [];
                }
                groups[dateKey].push(activity);
                return groups;
              }, {} as Record<string, ActivityItem[]>),
            ).map(([dateKey, activities]) => (
              <div key={dateKey}>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Calendar size={18} />
                  {new Date(dateKey).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-miyabi-blue/20 to-miyabi-purple/20 border border-miyabi-blue/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-miyabi-blue" size={24} />
            <h3 className="text-lg font-semibold text-white">Learning Streak</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            You&apos;re on a 7-day learning streak! Keep it going.
          </p>
          <button className="bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors w-full">
            Continue Streak
          </button>
        </div>

        <div className="bg-gradient-to-r from-miyabi-green/20 to-miyabi-blue/20 border border-miyabi-green/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="text-miyabi-green" size={24} />
            <h3 className="text-lg font-semibold text-white">Next Achievement</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Complete 2 more lessons to unlock &quot;Dedicated Learner&quot;
          </p>
          <button className="bg-miyabi-green hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors w-full">
            View Progress
          </button>
        </div>

        <div className="bg-gradient-to-r from-miyabi-purple/20 to-orange-500/20 border border-miyabi-purple/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-miyabi-purple" size={24} />
            <h3 className="text-lg font-semibold text-white">Join Discussion</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Connect with other learners in course discussions.
          </p>
          <button className="bg-miyabi-purple hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors w-full">
            Join Community
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecentActivity;

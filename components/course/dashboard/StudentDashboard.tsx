/**
 * Student Dashboard Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Play,
  Calendar,
  Target,
  Star,
  ChevronRight,
  BarChart3,
  Users,
  Trophy,
  Zap
} from 'lucide-react';
import { useCourses, useCourseProgress, useUserStats } from '../shared/hooks';
import MyCourses from './MyCourses';
import RecentActivity from './RecentActivity';
import Certificates from './Certificates';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface StudentDashboardProps {
  userId: string;
  className?: string;
}

interface QuickStat {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  deadline: Date;
  icon: React.ReactNode;
}

export function StudentDashboard({ userId, className = '' }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'activity' | 'certificates'>('overview');

  const { data: enrolledCourses, isLoading: coursesLoading } = useCourses({
    filter: { enrolled: true, userId }
  });

  const { data: userStats, isLoading: statsLoading } = useUserStats(userId);

  // Mock data for demonstration
  const quickStats: QuickStat[] = [
    {
      id: 'courses',
      label: 'Active Courses',
      value: enrolledCourses?.length || 0,
      icon: <BookOpen size={20} />,
      color: 'miyabi-blue',
      trend: { value: 2, isPositive: true }
    },
    {
      id: 'hours',
      label: 'Hours This Week',
      value: '12.5h',
      icon: <Clock size={20} />,
      color: 'miyabi-green',
      trend: { value: 15, isPositive: true }
    },
    {
      id: 'streak',
      label: 'Learning Streak',
      value: '7 days',
      icon: <Zap size={20} />,
      color: 'orange-500',
      trend: { value: 7, isPositive: true }
    },
    {
      id: 'certificates',
      label: 'Certificates',
      value: 3,
      icon: <Award size={20} />,
      color: 'miyabi-purple',
      trend: { value: 1, isPositive: true }
    }
  ];

  const learningGoals: LearningGoal[] = [
    {
      id: '1',
      title: 'Complete React Advanced Course',
      description: 'Finish all modules by end of month',
      progress: 75,
      target: 100,
      deadline: new Date('2024-02-28'),
      icon: <BookOpen className="text-miyabi-blue" size={16} />
    },
    {
      id: '2',
      title: 'Study 20 Hours This Month',
      description: 'Maintain consistent learning schedule',
      progress: 16,
      target: 20,
      deadline: new Date('2024-02-29'),
      icon: <Target className="text-miyabi-green" size={16} />
    },
    {
      id: '3',
      title: 'Earn TypeScript Certificate',
      description: 'Complete course and pass final assessment',
      progress: 60,
      target: 100,
      deadline: new Date('2024-03-15'),
      icon: <Award className="text-miyabi-purple" size={16} />
    }
  ];

  const recentAchievements = [
    {
      id: '1',
      title: 'Quick Learner',
      description: 'Completed 3 lessons in one day',
      earnedAt: new Date('2024-01-15'),
      icon: <Zap className="text-orange-500" />,
      rarity: 'common'
    },
    {
      id: '2',
      title: 'Consistent Student',
      description: 'Maintained 7-day learning streak',
      earnedAt: new Date('2024-01-14'),
      icon: <Calendar className="text-miyabi-blue" />,
      rarity: 'uncommon'
    },
    {
      id: '3',
      title: 'Course Completionist',
      description: 'Finished Introduction to JavaScript',
      earnedAt: new Date('2024-01-10'),
      icon: <Trophy className="text-yellow-500" />,
      rarity: 'rare'
    }
  ];

  const upcomingDeadlines = [
    {
      id: '1',
      title: 'React Assignment Due',
      course: 'Advanced React Patterns',
      deadline: new Date('2024-01-20'),
      type: 'assignment' as const
    },
    {
      id: '2',
      title: 'TypeScript Quiz',
      course: 'TypeScript Fundamentals',
      deadline: new Date('2024-01-22'),
      type: 'quiz' as const
    },
    {
      id: '3',
      title: 'Final Project Submission',
      course: 'Full Stack Development',
      deadline: new Date('2024-01-25'),
      type: 'project' as const
    }
  ];

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen size={16} /> },
    { id: 'activity', label: 'Activity', icon: <Clock size={16} /> },
    { id: 'certificates', label: 'Certificates', icon: <Award size={16} /> },
  ];

  if (coursesLoading || statsLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-miyabi-blue to-miyabi-purple rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-white/80">
              Continue your learning journey. You're doing great!
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/60">Current Level</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">12</span>
              <Star className="text-yellow-400 fill-current" size={24} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <div key={stat.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`text-${stat.color}`}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <div className={`text-xs ${stat.trend.isPositive ? 'text-green-300' : 'text-red-300'}`}>
                    {stat.trend.isPositive ? '+' : '-'}{stat.trend.value}%
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-miyabi-blue text-miyabi-blue'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Learning Goals */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Learning Goals</h2>
                  <button className="text-miyabi-blue hover:text-blue-400 transition-colors">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {learningGoals.map((goal) => (
                    <div key={goal.id} className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                            {goal.icon}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{goal.title}</h3>
                            <p className="text-sm text-gray-400">{goal.description}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          Due {formatDate(goal.deadline)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">
                            {goal.progress}/{goal.target} ({Math.round((goal.progress / goal.target) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-miyabi-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Learning */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Continue Learning</h2>
                <div className="space-y-3">
                  {enrolledCourses?.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                        <BookOpen size={24} className="text-miyabi-blue" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-white">{course.title}</h3>
                        <p className="text-sm text-gray-400">{course.instructor}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((course as any).progress || 0)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-miyabi-blue h-1 rounded-full"
                              style={{ width: `${(course as any).progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <button className="text-miyabi-blue hover:text-blue-400 transition-colors">
                        <Play size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Achievements */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Achievements</h3>
                <div className="space-y-3">
                  {recentAchievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        {achievement.icon}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-medium text-white">{achievement.title}</h4>
                        <p className="text-xs text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-miyabi-blue hover:text-blue-400 transition-colors text-sm">
                  View All Achievements
                </button>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines</h3>
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => {
                    const daysLeft = getDaysUntilDeadline(deadline.deadline);
                    const isUrgent = daysLeft <= 3;

                    return (
                      <div key={deadline.id} className="p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-white">{deadline.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isUrgent
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-miyabi-blue/20 text-miyabi-blue'
                          }`}>
                            {daysLeft > 0 ? `${daysLeft} days` : 'Due today'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{deadline.course}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Study Reminder */}
              <div className="bg-gradient-to-r from-miyabi-purple/20 to-miyabi-blue/20 border border-miyabi-purple/30 rounded-lg p-6">
                <div className="text-center">
                  <Calendar className="mx-auto text-miyabi-purple mb-3" size={32} />
                  <h3 className="text-lg font-semibold text-white mb-2">Daily Study Reminder</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    You're on a 7-day streak! Keep it going.
                  </p>
                  <button className="w-full bg-miyabi-purple hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors">
                    Start Today's Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <MyCourses userId={userId} />
        )}

        {activeTab === 'activity' && (
          <RecentActivity userId={userId} />
        )}

        {activeTab === 'certificates' && (
          <Certificates userId={userId} />
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
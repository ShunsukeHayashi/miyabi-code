/**
 * Progress Tracker Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  CheckCircle,
  BarChart3,
  Activity,
  Zap,
  Trophy,
  Star,
  BookOpen,
  PlayCircle
} from 'lucide-react';
import { ProgressData, CourseWithRelations } from '../shared/types';

interface ProgressTrackerProps {
  courseId: string;
  progress: ProgressData;
  course?: CourseWithRelations;
  showDetailed?: boolean;
  className?: string;
}

interface StudySession {
  date: Date;
  duration: number; // in minutes
  lessonsCompleted: number;
  points: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
}

export function ProgressTracker({
  courseId,
  progress,
  course,
  showDetailed = false,
  className = ''
}: ProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'achievements'>('overview');

  // Mock study sessions data
  const studySessions: StudySession[] = [
    { date: new Date('2024-01-15'), duration: 45, lessonsCompleted: 2, points: 150 },
    { date: new Date('2024-01-14'), duration: 60, lessonsCompleted: 3, points: 220 },
    { date: new Date('2024-01-13'), duration: 30, lessonsCompleted: 1, points: 100 },
    { date: new Date('2024-01-12'), duration: 75, lessonsCompleted: 4, points: 300 },
    { date: new Date('2024-01-11'), duration: 40, lessonsCompleted: 2, points: 180 },
    { date: new Date('2024-01-10'), duration: 55, lessonsCompleted: 3, points: 250 },
    { date: new Date('2024-01-09'), duration: 35, lessonsCompleted: 1, points: 120 },
  ];

  // Mock achievements data
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Quick Start',
      description: 'Complete your first lesson',
      icon: <PlayCircle className="text-green-500" />,
      unlockedAt: new Date('2024-01-10')
    },
    {
      id: '2',
      title: 'Dedicated Learner',
      description: 'Study for 5 consecutive days',
      icon: <Calendar className="text-blue-500" />,
      unlockedAt: new Date('2024-01-14')
    },
    {
      id: '3',
      title: 'Knowledge Seeker',
      description: 'Complete 10 lessons',
      icon: <BookOpen className="text-purple-500" />,
      progress: 7,
      target: 10
    },
    {
      id: '4',
      title: 'Time Master',
      description: 'Study for 10 hours total',
      icon: <Clock className="text-orange-500" />,
      progress: 8.5,
      target: 10
    },
    {
      id: '5',
      title: 'Course Champion',
      description: 'Complete the entire course',
      icon: <Trophy className="text-yellow-500" />,
      progress: 45,
      target: 100
    }
  ];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = studySessions.filter(session => session.date >= weekAgo);

    return {
      totalTime: thisWeekSessions.reduce((sum, session) => sum + session.duration, 0),
      totalLessons: thisWeekSessions.reduce((sum, session) => sum + session.lessonsCompleted, 0),
      totalPoints: thisWeekSessions.reduce((sum, session) => sum + session.points, 0),
      sessionsCount: thisWeekSessions.length
    };
  };

  const getStreak = () => {
    // Calculate current streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const hasSession = studySessions.some(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });

      if (hasSession) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const weeklyStats = getWeeklyStats();
  const currentStreak = getStreak();
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'sessions', label: 'Sessions', icon: <Activity size={16} /> },
    { id: 'achievements', label: 'Achievements', icon: <Award size={16} /> },
  ];

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Learning Progress</h3>
            <p className="text-gray-400 text-sm mt-1">Track your journey and achievements</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold text-miyabi-blue">{progress.overall}%</div>
              <div className="text-xs text-gray-400">Complete</div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Course Progress</span>
            <span>{progress.lessonsCompleted}/{progress.totalLessons} lessons</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-miyabi-blue to-miyabi-purple h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.overall}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      {showDetailed && (
        <div className="border-b border-gray-700">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
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
      )}

      {/* Content */}
      <div className="p-6">
        {(!showDetailed || activeTab === 'overview') && (
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-miyabi-blue/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="text-miyabi-blue" size={20} />
                </div>
                <div className="text-xl font-bold text-white">
                  {formatDuration(progress.timeSpent / 60)}
                </div>
                <div className="text-xs text-gray-400">Time Spent</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-miyabi-green/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="text-miyabi-green" size={20} />
                </div>
                <div className="text-xl font-bold text-white">{progress.lessonsCompleted}</div>
                <div className="text-xs text-gray-400">Lessons Done</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="text-orange-500" size={20} />
                </div>
                <div className="text-xl font-bold text-white">{currentStreak}</div>
                <div className="text-xs text-gray-400">Day Streak</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="text-yellow-500" size={20} />
                </div>
                <div className="text-xl font-bold text-white">{unlockedAchievements.length}</div>
                <div className="text-xs text-gray-400">Achievements</div>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-miyabi-blue" size={20} />
                This Week's Progress
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-miyabi-blue">
                    {formatDuration(weeklyStats.totalTime)}
                  </div>
                  <div className="text-sm text-gray-400">Study Time</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-miyabi-green">
                    {weeklyStats.totalLessons}
                  </div>
                  <div className="text-sm text-gray-400">Lessons</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-miyabi-purple">
                    {weeklyStats.totalPoints}
                  </div>
                  <div className="text-sm text-gray-400">Points</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {weeklyStats.sessionsCount}
                  </div>
                  <div className="text-sm text-gray-400">Sessions</div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Recent Achievements</h4>
              <div className="space-y-3">
                {unlockedAchievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      {achievement.icon}
                    </div>
                    <div className="flex-grow">
                      <h5 className="font-medium text-white">{achievement.title}</h5>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {achievement.unlockedAt && formatDate(achievement.unlockedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showDetailed && activeTab === 'sessions' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Study Sessions</h4>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {studySessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">
                      {formatDate(session.date)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {session.lessonsCompleted} lessons completed
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-miyabi-blue">
                      {formatDuration(session.duration)}
                    </div>
                    <div className="text-sm text-gray-400">
                      +{session.points} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showDetailed && activeTab === 'achievements' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Achievements</h4>

            <div className="grid gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${
                    achievement.unlockedAt
                      ? 'bg-gray-900/50 border-miyabi-blue/30'
                      : 'bg-gray-900/30 border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievement.unlockedAt ? 'bg-gray-700' : 'bg-gray-800'
                    }`}>
                      {achievement.icon}
                    </div>

                    <div className="flex-grow">
                      <h5 className={`font-medium ${
                        achievement.unlockedAt ? 'text-white' : 'text-gray-400'
                      }`}>
                        {achievement.title}
                      </h5>
                      <p className="text-sm text-gray-400 mb-2">
                        {achievement.description}
                      </p>

                      {achievement.unlockedAt ? (
                        <div className="flex items-center gap-2 text-sm text-miyabi-blue">
                          <CheckCircle size={14} />
                          <span>Unlocked {formatDate(achievement.unlockedAt)}</span>
                        </div>
                      ) : achievement.progress !== undefined && achievement.target ? (
                        <div>
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.target}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-miyabi-blue h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <Target size={14} className="inline mr-1" />
                          Keep learning to unlock!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressTracker;
/**
 * Instructor Dashboard Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Star,
  MessageSquare,
  Calendar,
  Award,
  Clock,
  Eye,
  Edit,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useInstructorStats, useInstructorCourses } from '../shared/hooks';
import CourseCreator from './CourseCreator';
import StudentManagement from './StudentManagement';
import CourseAnalytics from './CourseAnalytics';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface InstructorDashboardProps {
  instructorId: string;
  className?: string;
}

interface InstructorStats {
  totalStudents: number;
  activeCourses: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  monthlyGrowth: {
    students: number;
    revenue: number;
    enrollments: number;
  };
}

interface CoursePerformance {
  id: string;
  title: string;
  students: number;
  revenue: number;
  rating: number;
  completionRate: number;
  status: 'draft' | 'published' | 'archived';
  lastUpdated: Date;
  thumbnail: string;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'completion' | 'review' | 'question' | 'revenue';
  message: string;
  timestamp: Date;
  metadata?: {
    courseId?: string;
    studentName?: string;
    rating?: number;
    amount?: number;
  };
}

export function InstructorDashboard({ instructorId, className = '' }: InstructorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'analytics' | 'creator'>('overview');

  // Mock instructor stats
  const instructorStats: InstructorStats = {
    totalStudents: 1247,
    activeCourses: 8,
    totalRevenue: 45680,
    averageRating: 4.7,
    totalReviews: 342,
    monthlyGrowth: {
      students: 15.2,
      revenue: 23.1,
      enrollments: 18.7
    }
  };

  // Mock course performance data
  const coursePerformance: CoursePerformance[] = [
    {
      id: '1',
      title: 'Advanced React Patterns',
      students: 456,
      revenue: 18240,
      rating: 4.8,
      completionRate: 87,
      status: 'published',
      lastUpdated: new Date('2024-01-15'),
      thumbnail: '/api/placeholder/400/225'
    },
    {
      id: '2',
      title: 'TypeScript Mastery',
      students: 323,
      revenue: 12920,
      rating: 4.9,
      completionRate: 92,
      status: 'published',
      lastUpdated: new Date('2024-01-12'),
      thumbnail: '/api/placeholder/400/225'
    },
    {
      id: '3',
      title: 'Node.js Backend Development',
      students: 289,
      revenue: 11560,
      rating: 4.6,
      completionRate: 78,
      status: 'published',
      lastUpdated: new Date('2024-01-10'),
      thumbnail: '/api/placeholder/400/225'
    },
    {
      id: '4',
      title: 'Next.js Full Stack Guide',
      students: 0,
      revenue: 0,
      rating: 0,
      completionRate: 0,
      status: 'draft',
      lastUpdated: new Date('2024-01-08'),
      thumbnail: '/api/placeholder/400/225'
    }
  ];

  // Mock recent activity
  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'enrollment',
      message: 'Sarah Johnson enrolled in Advanced React Patterns',
      timestamp: new Date('2024-01-16T14:30:00'),
      metadata: { courseId: '1', studentName: 'Sarah Johnson' }
    },
    {
      id: '2',
      type: 'review',
      message: 'Mike Chen left a 5-star review on TypeScript Mastery',
      timestamp: new Date('2024-01-16T12:15:00'),
      metadata: { courseId: '2', studentName: 'Mike Chen', rating: 5 }
    },
    {
      id: '3',
      type: 'completion',
      message: 'Emma Davis completed Node.js Backend Development',
      timestamp: new Date('2024-01-16T10:45:00'),
      metadata: { courseId: '3', studentName: 'Emma Davis' }
    },
    {
      id: '4',
      type: 'question',
      message: 'New question posted in Advanced React Patterns discussion',
      timestamp: new Date('2024-01-15T16:20:00'),
      metadata: { courseId: '1' }
    },
    {
      id: '5',
      type: 'revenue',
      message: 'Revenue milestone: $45,000 total earnings reached',
      timestamp: new Date('2024-01-15T09:00:00'),
      metadata: { amount: 45000 }
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: CoursePerformance['status']) => {
    switch (status) {
      case 'published':
        return <span className="bg-miyabi-green/20 text-miyabi-green px-2 py-1 rounded-full text-xs">Published</span>;
      case 'draft':
        return <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs">Draft</span>;
      case 'archived':
        return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs">Archived</span>;
      default:
        return null;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'enrollment':
        return <Users className="text-miyabi-blue" size={16} />;
      case 'completion':
        return <CheckCircle className="text-miyabi-green" size={16} />;
      case 'review':
        return <Star className="text-yellow-500" size={16} />;
      case 'question':
        return <MessageSquare className="text-miyabi-purple" size={16} />;
      case 'revenue':
        return <DollarSign className="text-miyabi-green" size={16} />;
      default:
        return <Activity className="text-gray-400" size={16} />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen size={16} /> },
    { id: 'students', label: 'Students', icon: <Users size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <PieChart size={16} /> },
    { id: 'creator', label: 'Create Course', icon: <Plus size={16} /> },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-miyabi-blue to-miyabi-purple rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Instructor Dashboard</h1>
            <p className="text-white/80">
              Manage your courses, track student progress, and grow your teaching business
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/60">Monthly Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(instructorStats.totalRevenue)}</div>
            <div className="text-sm text-green-300">
              +{instructorStats.monthlyGrowth.revenue}% this month
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-miyabi-blue" size={20} />
              <div className="text-xs text-green-300">+{instructorStats.monthlyGrowth.students}%</div>
            </div>
            <div className="text-2xl font-bold">{instructorStats.totalStudents.toLocaleString()}</div>
            <div className="text-sm text-white/70">Total Students</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="text-miyabi-green" size={20} />
            </div>
            <div className="text-2xl font-bold">{instructorStats.activeCourses}</div>
            <div className="text-sm text-white/70">Active Courses</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="text-yellow-400 fill-current" size={20} />
            </div>
            <div className="text-2xl font-bold">{instructorStats.averageRating}</div>
            <div className="text-sm text-white/70">Average Rating</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="text-miyabi-purple" size={20} />
            </div>
            <div className="text-2xl font-bold">{instructorStats.totalReviews}</div>
            <div className="text-sm text-white/70">Reviews</div>
          </div>
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
              {/* Course Performance */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Course Performance</h2>
                  <button className="text-miyabi-blue hover:text-blue-400 transition-colors">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {coursePerformance.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                      <div className="w-16 h-12 bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-white">{course.title}</h3>
                          {getStatusBadge(course.status)}
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Students: </span>
                            <span className="text-white">{course.students}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Revenue: </span>
                            <span className="text-white">{formatCurrency(course.revenue)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Rating: </span>
                            <span className="text-white flex items-center gap-1">
                              <Star className="text-yellow-400 fill-current" size={12} />
                              {course.rating || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Completion: </span>
                            <span className="text-white">{course.completionRate}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Chart Placeholder */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Revenue Trends</h2>
                <div className="h-64 bg-gray-900/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="mx-auto text-miyabi-blue mb-2" size={32} />
                    <p className="text-gray-400">Revenue chart would be displayed here</p>
                    <p className="text-sm text-gray-500">Integration with charting library needed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm text-white">{activity.message}</p>
                        <p className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-miyabi-blue hover:text-blue-400 transition-colors text-sm">
                  View All Activity
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('creator')}
                    className="w-full flex items-center justify-between p-3 bg-miyabi-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Plus size={16} />
                      <span>Create New Course</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} />
                      <span>View Analytics</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button
                    onClick={() => setActiveTab('students')}
                    className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>Manage Students</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Performance Alerts */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Alerts</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                    <AlertCircle className="text-orange-400 flex-shrink-0" size={16} />
                    <div className="text-sm">
                      <p className="text-white font-medium">Low completion rate</p>
                      <p className="text-gray-300">Node.js course has 78% completion rate</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-miyabi-green/20 border border-miyabi-green/30 rounded-lg">
                    <CheckCircle className="text-miyabi-green flex-shrink-0" size={16} />
                    <div className="text-sm">
                      <p className="text-white font-medium">Revenue milestone</p>
                      <p className="text-gray-300">Reached $45K in total earnings!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Courses</h2>
              <button
                onClick={() => setActiveTab('creator')}
                className="flex items-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Create New Course
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursePerformance.map((course) => (
                <div key={course.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="aspect-video bg-gray-700 relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(course.status)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2">{course.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="text-gray-400">Students: <span className="text-white">{course.students}</span></div>
                      <div className="text-gray-400">Revenue: <span className="text-white">{formatCurrency(course.revenue)}</span></div>
                      <div className="text-gray-400">Rating: <span className="text-white">{course.rating || 'N/A'}</span></div>
                      <div className="text-gray-400">Completion: <span className="text-white">{course.completionRate}%</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors text-sm">
                        <Edit size={14} className="inline mr-1" />
                        Edit
                      </button>
                      <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-3 rounded-lg transition-colors">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <StudentManagement instructorId={instructorId} />
        )}

        {activeTab === 'analytics' && (
          <CourseAnalytics instructorId={instructorId} />
        )}

        {activeTab === 'creator' && (
          <CourseCreator instructorId={instructorId} />
        )}
      </div>
    </div>
  );
}

export default InstructorDashboard;
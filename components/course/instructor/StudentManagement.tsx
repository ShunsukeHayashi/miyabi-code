/**
 * Student Management Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  MoreVertical,
  TrendingUp,
  Clock,
  Award,
  MessageSquare,
  Star,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Eye,
  Ban,
  Send,
} from 'lucide-react';
import { useStudentManagement } from '../shared/hooks';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface StudentManagementProps {
  instructorId: string;
  className?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledAt: Date;
  lastActive: Date;
  totalCourses: number;
  completedCourses: number;
  overallProgress: number;
  totalTimeSpent: number; // minutes
  status: 'active' | 'inactive' | 'suspended';
  courses: Array<{
    id: string;
    title: string;
    progress: number;
    lastAccessed: Date;
    timeSpent: number;
    status: 'in-progress' | 'completed' | 'not-started';
  }>;
  stats: {
    averageScore: number;
    questionsAsked: number;
    discussionPosts: number;
    certificatesEarned: number;
  };
}

interface StudentFilter {
  course: string;
  status: 'all' | 'active' | 'inactive' | 'suspended';
  progress: 'all' | 'not-started' | 'in-progress' | 'completed';
  timeRange: 'all' | 'week' | 'month' | 'quarter';
}

type SortOption = 'name' | 'enrolledAt' | 'progress' | 'lastActive' | 'timeSpent';

export function StudentManagement({ instructorId, className = '' }: StudentManagementProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<StudentFilter>({
    course: 'all',
    status: 'all',
    progress: 'all',
    timeRange: 'all',
  });

  // Mock student data
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      avatar: '/api/placeholder/40/40',
      enrolledAt: new Date('2024-01-10'),
      lastActive: new Date('2024-01-16T14:30:00'),
      totalCourses: 3,
      completedCourses: 1,
      overallProgress: 75,
      totalTimeSpent: 1450,
      status: 'active',
      courses: [
        {
          id: 'course-1',
          title: 'Advanced React Patterns',
          progress: 85,
          lastAccessed: new Date('2024-01-16'),
          timeSpent: 720,
          status: 'in-progress',
        },
        {
          id: 'course-2',
          title: 'TypeScript Fundamentals',
          progress: 100,
          lastAccessed: new Date('2024-01-15'),
          timeSpent: 580,
          status: 'completed',
        },
        {
          id: 'course-3',
          title: 'Node.js Backend',
          progress: 40,
          lastAccessed: new Date('2024-01-14'),
          timeSpent: 150,
          status: 'in-progress',
        },
      ],
      stats: {
        averageScore: 92,
        questionsAsked: 8,
        discussionPosts: 12,
        certificatesEarned: 1,
      },
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.chen@example.com',
      avatar: '/api/placeholder/40/40',
      enrolledAt: new Date('2024-01-08'),
      lastActive: new Date('2024-01-15T10:20:00'),
      totalCourses: 2,
      completedCourses: 2,
      overallProgress: 100,
      totalTimeSpent: 980,
      status: 'active',
      courses: [
        {
          id: 'course-1',
          title: 'Advanced React Patterns',
          progress: 100,
          lastAccessed: new Date('2024-01-15'),
          timeSpent: 650,
          status: 'completed',
        },
        {
          id: 'course-2',
          title: 'TypeScript Fundamentals',
          progress: 100,
          lastAccessed: new Date('2024-01-12'),
          timeSpent: 330,
          status: 'completed',
        },
      ],
      stats: {
        averageScore: 95,
        questionsAsked: 3,
        discussionPosts: 5,
        certificatesEarned: 2,
      },
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma.davis@example.com',
      avatar: '/api/placeholder/40/40',
      enrolledAt: new Date('2024-01-12'),
      lastActive: new Date('2024-01-13T16:45:00'),
      totalCourses: 1,
      completedCourses: 0,
      overallProgress: 25,
      totalTimeSpent: 180,
      status: 'inactive',
      courses: [
        {
          id: 'course-3',
          title: 'Node.js Backend',
          progress: 25,
          lastAccessed: new Date('2024-01-13'),
          timeSpent: 180,
          status: 'in-progress',
        },
      ],
      stats: {
        averageScore: 78,
        questionsAsked: 2,
        discussionPosts: 1,
        certificatesEarned: 0,
      },
    },
  ];

  const instructorCourses = [
    { id: 'course-1', title: 'Advanced React Patterns' },
    { id: 'course-2', title: 'TypeScript Fundamentals' },
    { id: 'course-3', title: 'Node.js Backend Development' },
  ];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) {return `${diffDays}d ago`;}
    if (diffHours > 0) {return `${diffHours}h ago`;}
    return 'Recently';
  };

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return <span className="bg-miyabi-green/20 text-miyabi-green px-2 py-1 rounded-full text-xs">Active</span>;
      case 'inactive':
        return <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs">Inactive</span>;
      case 'suspended':
        return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">Suspended</span>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) {return 'miyabi-green';}
    if (progress >= 60) {return 'miyabi-blue';}
    if (progress >= 30) {return 'orange-500';}
    return 'red-500';
  };

  const filteredAndSortedStudents = mockStudents
    .filter(student => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query);
        if (!matchesSearch) {return false;}
      }

      // Status filter
      if (filters.status !== 'all' && student.status !== filters.status) {
        return false;
      }

      // Course filter
      if (filters.course !== 'all') {
        const hasEnrolledInCourse = student.courses.some(course => course.id === filters.course);
        if (!hasEnrolledInCourse) {return false;}
      }

      // Progress filter
      if (filters.progress !== 'all') {
        const overallStatus = student.overallProgress === 100 ? 'completed' :
          student.overallProgress > 0 ? 'in-progress' : 'not-started';
        if (overallStatus !== filters.progress) {return false;}
      }

      // Time range filter
      if (filters.timeRange !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();

        switch (filters.timeRange) {
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
        }

        if (student.lastActive < cutoffDate) {return false;}
      }

      return true;
    })
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;

      switch (sortBy) {
        case 'name':
          return modifier * a.name.localeCompare(b.name);
        case 'enrolledAt':
          return modifier * (a.enrolledAt.getTime() - b.enrolledAt.getTime());
        case 'progress':
          return modifier * (a.overallProgress - b.overallProgress);
        case 'lastActive':
          return modifier * (a.lastActive.getTime() - b.lastActive.getTime());
        case 'timeSpent':
          return modifier * (a.totalTimeSpent - b.totalTimeSpent);
        default:
          return 0;
      }
    });

  const StudentRow = ({ student }: { student: Student }) => (
    <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-10 h-10 rounded-full bg-gray-600"
          />
          <div>
            <div className="font-medium text-white">{student.name}</div>
            <div className="text-sm text-gray-400">{student.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {getStatusBadge(student.status)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-700 rounded-full h-2">
            <div
              className={`bg-${getProgressColor(student.overallProgress)} h-2 rounded-full transition-all`}
              style={{ width: `${student.overallProgress}%` }}
            />
          </div>
          <span className="text-sm text-white">{student.overallProgress}%</span>
        </div>
      </td>
      <td className="px-6 py-4 text-white">{student.totalCourses}</td>
      <td className="px-6 py-4 text-white">{formatDuration(student.totalTimeSpent)}</td>
      <td className="px-6 py-4 text-gray-400">{formatTimeAgo(student.lastActive)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedStudent(student)}
            className="p-1 text-gray-400 hover:text-miyabi-blue transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1 text-gray-400 hover:text-miyabi-green transition-colors"
            title="Send Message"
          >
            <Mail size={16} />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-300 transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  const StudentDetailModal = ({ student, onClose }: { student: Student; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-16 h-16 rounded-full bg-gray-600"
              />
              <div>
                <h2 className="text-xl font-semibold text-white">{student.name}</h2>
                <p className="text-gray-400">{student.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(student.status)}
                  <span className="text-sm text-gray-400">
                    Enrolled {formatDate(student.enrolledAt)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Student Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-miyabi-blue">{student.overallProgress}%</div>
                <div className="text-sm text-gray-400">Overall Progress</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-miyabi-green">{student.stats.averageScore}%</div>
                <div className="text-sm text-gray-400">Average Score</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-miyabi-purple">{formatDuration(student.totalTimeSpent)}</div>
                <div className="text-sm text-gray-400">Time Spent</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">{student.stats.certificatesEarned}</div>
                <div className="text-sm text-gray-400">Certificates</div>
              </div>
            </div>
          </div>

          {/* Course Progress */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Course Progress</h3>
            <div className="space-y-3">
              {student.courses.map((course) => (
                <div key={course.id} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">{course.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.status === 'completed' ? 'bg-miyabi-green/20 text-miyabi-green' :
                        course.status === 'in-progress' ? 'bg-miyabi-blue/20 text-miyabi-blue' :
                          'bg-gray-600/20 text-gray-400'
                    }`}>
                      {course.status.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">Progress: </span>
                      <span className="text-white">{course.progress}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Time: </span>
                      <span className="text-white">{formatDuration(course.timeSpent)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Access: </span>
                      <span className="text-white">{formatDate(course.lastAccessed)}</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`bg-${getProgressColor(course.progress)} h-2 rounded-full transition-all`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Engagement</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <MessageSquare className="mx-auto text-miyabi-blue mb-2" size={24} />
                <div className="text-lg font-bold text-white">{student.stats.questionsAsked}</div>
                <div className="text-sm text-gray-400">Questions Asked</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <Users className="mx-auto text-miyabi-green mb-2" size={24} />
                <div className="text-lg font-bold text-white">{student.stats.discussionPosts}</div>
                <div className="text-sm text-gray-400">Discussion Posts</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <Award className="mx-auto text-miyabi-purple mb-2" size={24} />
                <div className="text-lg font-bold text-white">{student.stats.certificatesEarned}</div>
                <div className="text-sm text-gray-400">Certificates</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button className="flex items-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              <Send size={16} />
              Send Message
            </button>
            <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors">
              <Download size={16} />
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Student Management</h1>
        <p className="text-gray-400">Monitor student progress and engagement across your courses</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-blue">{mockStudents.length}</div>
          <div className="text-sm text-gray-400">Total Students</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-green">
            {mockStudents.filter(s => s.status === 'active').length}
          </div>
          <div className="text-sm text-gray-400">Active Students</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-purple">
            {Math.round(mockStudents.reduce((sum, s) => sum + s.overallProgress, 0) / mockStudents.length)}%
          </div>
          <div className="text-sm text-gray-400">Avg Progress</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">
            {mockStudents.reduce((sum, s) => sum + s.stats.certificatesEarned, 0)}
          </div>
          <div className="text-sm text-gray-400">Certificates Earned</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
              className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {instructorCourses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="lastActive">Sort by Last Active</option>
              <option value="enrolledAt">Sort by Enrollment Date</option>
              <option value="timeSpent">Sort by Time Spent</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              <Download size={16} />
              Export
            </button>
            <button className="flex items-center gap-2 bg-miyabi-green hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
              <Mail size={16} />
              Bulk Message
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Courses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Time Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredAndSortedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Users className="mx-auto text-gray-500 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-white mb-2">No students found</h3>
                  <p className="text-gray-400">
                    {searchQuery || Object.values(filters).some(f => f !== 'all')
                      ? 'Try adjusting your search or filters.'
                      : 'Students will appear here when they enroll in your courses.'
                    }
                  </p>
                </td>
              </tr>
            ) : (
              filteredAndSortedStudents.map((student) => (
                <StudentRow key={student.id} student={student} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

export default StudentManagement;

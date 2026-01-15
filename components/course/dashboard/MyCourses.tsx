/**
 * My Courses Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  Star,
  MoreVertical,
  Grid3X3,
  List,
  Search,
} from 'lucide-react';
import { useCourses } from '../shared/hooks';
import type { CourseWithRelations } from '../shared/types';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface MyCoursesProps {
  userId: string;
  className?: string;
}

interface EnrolledCourse extends CourseWithRelations {
  enrolledAt: Date;
  lastAccessed: Date;
  progress: number;
  timeSpent: number; // minutes
  nextLesson?: {
    id: string;
    title: string;
    type: string;
  };
  certificate?: {
    id: string;
    earnedAt: Date;
    downloadUrl: string;
  };
}

type ViewMode = 'grid' | 'list';
type SortOption = 'title' | 'progress' | 'lastAccessed' | 'enrolledAt';
type FilterOption = 'all' | 'in-progress' | 'completed' | 'not-started';

export function MyCourses({ userId, className = '' }: MyCoursesProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('lastAccessed');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: enrolledCourses, isLoading } = useCourses({
    filter: { enrolled: true, userId },
  });

  // Mock enrolled course data with additional fields
  const mockEnrolledCourses: EnrolledCourse[] = [
    {
      id: '1',
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts and patterns',
      instructor: 'Sarah Johnson',
      duration: 1200, // minutes
      difficulty: 'Advanced',
      category: 'Web Development',
      tags: ['React', 'JavaScript', 'Frontend'],
      thumbnail: '/api/placeholder/400/225',
      rating: 4.8,
      reviewCount: 234,
      studentCount: 1567,
      price: 99.99,
      currency: 'USD',
      isPublished: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      enrolledAt: new Date('2024-01-10'),
      lastAccessed: new Date('2024-01-16'),
      progress: 65,
      timeSpent: 480,
      nextLesson: {
        id: 'lesson-5',
        title: 'Higher-Order Components',
        type: 'video',
      },
    },
    {
      id: '2',
      title: 'TypeScript Fundamentals',
      description: 'Learn TypeScript from basics to advanced features',
      instructor: 'Mike Chen',
      duration: 900,
      difficulty: 'Intermediate',
      category: 'Programming',
      tags: ['TypeScript', 'JavaScript', 'Programming'],
      thumbnail: '/api/placeholder/400/225',
      rating: 4.9,
      reviewCount: 156,
      studentCount: 892,
      price: 79.99,
      currency: 'USD',
      isPublished: true,
      createdAt: new Date('2023-12-15'),
      updatedAt: new Date('2024-01-10'),
      enrolledAt: new Date('2023-12-20'),
      lastAccessed: new Date('2024-01-15'),
      progress: 100,
      timeSpent: 900,
      certificate: {
        id: 'cert-1',
        earnedAt: new Date('2024-01-15'),
        downloadUrl: '/certificates/cert-1.pdf',
      },
    },
    {
      id: '3',
      title: 'Node.js Backend Development',
      description: 'Build scalable backend applications with Node.js',
      instructor: 'Alex Rivera',
      duration: 1500,
      difficulty: 'Intermediate',
      category: 'Backend Development',
      tags: ['Node.js', 'JavaScript', 'Backend'],
      thumbnail: '/api/placeholder/400/225',
      rating: 4.7,
      reviewCount: 189,
      studentCount: 1023,
      price: 89.99,
      currency: 'USD',
      isPublished: true,
      createdAt: new Date('2023-11-01'),
      updatedAt: new Date('2024-01-05'),
      enrolledAt: new Date('2024-01-05'),
      lastAccessed: new Date('2024-01-12'),
      progress: 25,
      timeSpent: 180,
      nextLesson: {
        id: 'lesson-3',
        title: 'Express.js Fundamentals',
        type: 'video',
      },
    },
    {
      id: '4',
      title: 'Introduction to Machine Learning',
      description: 'Get started with ML concepts and Python implementation',
      instructor: 'Dr. Emily Watson',
      duration: 2000,
      difficulty: 'Beginner',
      category: 'Data Science',
      tags: ['Machine Learning', 'Python', 'AI'],
      thumbnail: '/api/placeholder/400/225',
      rating: 4.6,
      reviewCount: 312,
      studentCount: 2156,
      price: 129.99,
      currency: 'USD',
      isPublished: true,
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2023-12-20'),
      enrolledAt: new Date('2024-01-01'),
      lastAccessed: new Date('2024-01-08'),
      progress: 0,
      timeSpent: 0,
      nextLesson: {
        id: 'lesson-1',
        title: 'What is Machine Learning?',
        type: 'video',
      },
    },
  ];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${minutes}m`;}
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  const getProgressStatus = (progress: number) => {
    if (progress === 0) {return 'not-started';}
    if (progress === 100) {return 'completed';}
    return 'in-progress';
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) {return 'gray-500';}
    if (progress === 100) {return 'miyabi-green';}
    return 'miyabi-blue';
  };

  const filteredAndSortedCourses = mockEnrolledCourses
    .filter((course) => {
      // Filter by status
      if (filterBy !== 'all') {
        const status = getProgressStatus(course.progress);
        if (status !== filterBy) {return false;}
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          course.title.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query) ||
          course.category.toLowerCase().includes(query) ||
          course.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return b.progress - a.progress;
        case 'lastAccessed':
          return b.lastAccessed.getTime() - a.lastAccessed.getTime();
        case 'enrolledAt':
          return b.enrolledAt.getTime() - a.enrolledAt.getTime();
        default:
          return 0;
      }
    });

  const CourseCard = ({ course }: { course: EnrolledCourse }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
      <div className="aspect-video bg-gray-700 relative">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button className="w-12 h-12 bg-miyabi-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
            <Play className="text-white ml-1" size={20} />
          </button>
        </div>

        {/* Progress Badge */}
        <div className="absolute top-3 right-3">
          {course.progress === 100 ? (
            <div className="bg-miyabi-green text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              Complete
            </div>
          ) : course.progress > 0 ? (
            <div className="bg-miyabi-blue text-white px-2 py-1 rounded-full text-xs font-medium">
              {course.progress}%
            </div>
          ) : (
            <div className="bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
              Not Started
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-400 mb-3">{course.instructor}</p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>{course.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`bg-${getProgressColor(course.progress)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        {/* Course Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDuration(course.timeSpent)} / {formatDuration(course.duration)}</span>
          </div>
          <span>Last accessed {formatDate(course.lastAccessed)}</span>
        </div>

        {/* Next Lesson or Certificate */}
        {course.certificate ? (
          <button className="w-full flex items-center justify-center gap-2 bg-miyabi-green hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
            <Download size={14} />
            Download Certificate
          </button>
        ) : course.nextLesson ? (
          <button className="w-full flex items-center justify-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
            <Play size={14} />
            Continue: {course.nextLesson.title}
          </button>
        ) : (
          <button className="w-full flex items-center justify-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
            <Play size={14} />
            Start Course
          </button>
        )}
      </div>
    </div>
  );

  const CourseListItem = ({ course }: { course: EnrolledCourse }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-24 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white mb-1">{course.title}</h3>
              <p className="text-sm text-gray-400">{course.instructor}</p>
            </div>
            <div className="flex items-center gap-2">
              {course.progress === 100 ? (
                <div className="bg-miyabi-green text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <CheckCircle size={12} />
                  Complete
                </div>
              ) : (
                <div className="bg-miyabi-blue text-white px-2 py-1 rounded-full text-xs font-medium">
                  {course.progress}%
                </div>
              )}
              <button className="text-gray-400 hover:text-gray-300 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-3">
            <div className="text-center">
              <div className="text-sm font-medium text-white">{course.progress}%</div>
              <div className="text-xs text-gray-400">Progress</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white">{formatDuration(course.timeSpent)}</div>
              <div className="text-xs text-gray-400">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white">{formatDate(course.lastAccessed)}</div>
              <div className="text-xs text-gray-400">Last Accessed</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-white flex items-center justify-center gap-1">
                <Star className="text-yellow-400 fill-current" size={12} />
                {course.rating}
              </div>
              <div className="text-xs text-gray-400">Rating</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-grow mr-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`bg-${getProgressColor(course.progress)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            {course.certificate ? (
              <button className="flex items-center gap-2 bg-miyabi-green hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                <Download size={14} />
                Certificate
              </button>
            ) : (
              <button className="flex items-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                <Play size={14} />
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Courses</h1>
          <p className="text-gray-400">Manage and track your learning progress</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-miyabi-blue text-white' : 'bg-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-miyabi-blue text-white' : 'bg-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="all">All Courses</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not-started">Not Started</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="lastAccessed">Last Accessed</option>
            <option value="title">Title</option>
            <option value="progress">Progress</option>
            <option value="enrolledAt">Enrollment Date</option>
          </select>
        </div>
      </div>

      {/* Course Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-blue">
            {mockEnrolledCourses.length}
          </div>
          <div className="text-sm text-gray-400">Total Courses</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">
            {mockEnrolledCourses.filter(c => getProgressStatus(c.progress) === 'in-progress').length}
          </div>
          <div className="text-sm text-gray-400">In Progress</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-green">
            {mockEnrolledCourses.filter(c => c.progress === 100).length}
          </div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-purple">
            {mockEnrolledCourses.filter(c => c.certificate).length}
          </div>
          <div className="text-sm text-gray-400">Certificates</div>
        </div>
      </div>

      {/* Course List/Grid */}
      <div>
        {filteredAndSortedCourses.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <BookOpen className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Start your learning journey by enrolling in a course.'
              }
            </p>
            <button className="bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
              Explore Courses
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedCourses.map((course) => (
              <CourseListItem key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCourses;

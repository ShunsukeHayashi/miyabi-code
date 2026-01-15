/**
 * Course Detail Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Play,
  Clock,
  Users,
  BookOpen,
  Star,
  Globe,
  Award,
  Download,
  Share2,
  Heart,
  ChevronRight,
} from 'lucide-react';
import CourseHeader from './CourseHeader';
import CourseSyllabus from './CourseSyllabus';
import CourseReviews from './CourseReviews';
import EnrollmentModal from './EnrollmentModal';
import { useAuth } from '../../auth/RoleGuard';
import { useCourse, useEnrollment, useCourseProgress } from '../shared/hooks';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import {
  CourseWithRelations,
  COURSE_LEVEL_COLORS,
  ProgressData,
} from '../shared/types';

interface CourseDetailProps {
  courseId?: string;
  courseSlug?: string;
  className?: string;
}

export function CourseDetail({
  courseId,
  courseSlug,
  className = '',
}: CourseDetailProps) {
  const { isAuthenticated, user } = useAuth();
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch course data
  const {
    data: courseResponse,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(courseId || courseSlug || '', {
    enabled: !!(courseId || courseSlug),
  });

  const course = courseResponse?.data;

  // Fetch enrollment and progress data
  const { enrollmentStatus, isLoading: enrollmentLoading, enroll, isEnrolling } = useEnrollment(course?.id || '');
  const { progress } = useCourseProgress(course?.id || '');

  const isEnrolled = enrollmentStatus?.status === 'ACTIVE';
  const canEnroll = !isEnrolled && course?.status === 'PUBLISHED';

  const handleEnroll = () => {
    if (isAuthenticated) {
      setShowEnrollmentModal(true);
    } else {
      // Redirect to login
      window.location.href = `/login?redirect=/courses/${course?.slug}`;
    }
  };

  const handleShare = async () => {
    if (navigator.share && course) {
      try {
        await navigator.share({
          title: course.title,
          text: course.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else if (course) {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) {return 'Self-paced';}
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price?: number | null) => {
    if (!price || price === 0) {return 'Free';}
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'instructor', label: 'Instructor' },
  ];

  if (courseLoading) {
    return <LoadingSpinner size="lg" text="Loading course..." fullScreen />;
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Course Not Found</h2>
          <p className="text-gray-400 mb-6">The course you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-miyabi-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const averageRating = course.stats?.averageRating || 0;
  const ratingCount = course.stats?.reviewsCount || 0;
  const enrollmentCount = course.stats?.enrollmentsCount || 0;
  const lessonsCount = course.stats?.lessonsCount || 0;

  return (
    <div className={`min-h-screen bg-gray-950 ${className}`}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Course Info */}
            <div className="space-y-6">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Courses</span>
                <ChevronRight size={16} />
                {course.categories[0] && (
                  <>
                    <span>{course.categories[0].name}</span>
                    <ChevronRight size={16} />
                  </>
                )}
                <span className="text-white">{course.title}</span>
              </nav>

              {/* Course Header */}
              <CourseHeader
                course={course}
                isEnrolled={isEnrolled}
                canEnroll={canEnroll}
                onEnroll={handleEnroll}
                isEnrolling={isEnrolling}
                progress={progress}
              />

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-miyabi-blue" />
                  <span>{formatDuration(course.estimatedTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-miyabi-blue" />
                  <span>{enrollmentCount} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-miyabi-blue" />
                  <span>{lessonsCount} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-miyabi-blue" />
                  <span>{course.language}</span>
                </div>
                {ratingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span>{averageRating.toFixed(1)} ({ratingCount})</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
                  <Heart size={16} />
                  <span>Wishlist</span>
                </button>
              </div>
            </div>

            {/* Course Preview */}
            <div className="lg:order-1">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <div className="aspect-video relative">
                  <Image
                    src={course.thumbnail || '/api/placeholder/800/450'}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group cursor-pointer">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 group-hover:scale-110 transition-transform">
                      <Play size={32} className="text-white ml-2" />
                    </div>
                  </div>
                </div>

                {/* Preview Info Card */}
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
                  <div className="text-2xl font-bold">{formatPrice(course.price)}</div>
                  {course.price && course.price > 0 && (
                    <div className="text-sm text-gray-300">One-time payment</div>
                  )}
                </div>

                {course.featured && (
                  <div className="absolute top-4 left-4 bg-miyabi-purple px-3 py-1 rounded-full text-sm font-semibold">
                    Featured Course
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {isEnrolled && progress && (
                <div className="mt-6 bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-white">Your Progress</span>
                    <span className="text-miyabi-blue font-semibold">{progress.overall}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div
                      className="bg-miyabi-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.overall}%` }}
                    />
                  </div>
                  <button className="w-full bg-miyabi-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                    Continue Learning
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-700 mb-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      py-4 px-2 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                    ? 'border-miyabi-blue text-miyabi-blue'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Course Description */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">About this course</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed">{course.description}</p>
                  </div>
                </div>

                {/* What You'll Learn */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">What you&apos;ll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Mock learning outcomes */}
                    {[
                      'Master the fundamentals and advanced concepts',
                      'Build real-world projects from scratch',
                      'Understand best practices and industry standards',
                      'Get hands-on experience with latest tools',
                      'Develop problem-solving skills',
                      'Learn from experienced instructors',
                    ].map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-1">
                          <div className="w-2 h-2 bg-miyabi-blue rounded-full" />
                        </div>
                        <span className="text-gray-300">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Requirements</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Basic computer literacy</li>
                    <li>• Access to a computer with internet connection</li>
                    <li>• Willingness to learn and practice</li>
                  </ul>
                </div>

                {/* Tags */}
                {course.tags.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Topics covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'curriculum' && (
              <CourseSyllabus
                courseId={course.id}
                isEnrolled={isEnrolled}
                progress={progress}
              />
            )}

            {activeTab === 'reviews' && (
              <CourseReviews
                courseId={course.id}
                canReview={isEnrolled}
              />
            )}

            {activeTab === 'instructor' && (
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <Image
                    src={course.creator.avatar || '/api/placeholder/100/100'}
                    alt={course.creator.displayName || course.creator.username || 'Instructor'}
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {course.creator.displayName || course.creator.username}
                    </h3>
                    <p className="text-gray-400 mb-4">Course Instructor</p>
                    <div className="flex items-center gap-6 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>1,234 students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} />
                        <span>5 courses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <span>4.8 rating</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300">
                    Experienced instructor with years of industry experience.
                    Passionate about teaching and helping students achieve their goals.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info Card */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h4 className="font-semibold text-white mb-4">Course Information</h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Level</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${COURSE_LEVEL_COLORS[course.level]}`}>
                    {course.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white">{formatDuration(course.estimatedTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lessons</span>
                  <span className="text-white">{lessonsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Language</span>
                  <span className="text-white">{course.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Certificate</span>
                  <span className="text-white flex items-center gap-1">
                    <Award size={14} />
                    Included
                  </span>
                </div>
              </div>
            </div>

            {/* Related Courses */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h4 className="font-semibold text-white mb-4">Related Courses</h4>
              <div className="space-y-4">
                {/* Mock related courses */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-16 h-12 bg-gray-700 rounded flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <h5 className="text-sm font-medium text-white truncate">
                        Related Course {index + 1}
                      </h5>
                      <p className="text-xs text-gray-400 truncate">
                        Short description
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className="text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">4.8</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && course && (
        <EnrollmentModal
          course={course}
          onClose={() => setShowEnrollmentModal(false)}
          onEnroll={() => {
            enroll();
            setShowEnrollmentModal(false);
          }}
        />
      )}
    </div>
  );
}

export default CourseDetail;

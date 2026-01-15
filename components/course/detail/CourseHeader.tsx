/**
 * Course Header Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { Star, Award, TrendingUp, Calendar } from 'lucide-react';
import type { CourseWithRelations, ProgressData} from '../shared/types';
import { COURSE_LEVEL_COLORS } from '../shared/types';

interface CourseHeaderProps {
  course: CourseWithRelations;
  isEnrolled: boolean;
  canEnroll: boolean;
  onEnroll: () => void;
  isEnrolling: boolean;
  progress?: ProgressData | null;
  className?: string;
}

export function CourseHeader({
  course,
  isEnrolled,
  canEnroll,
  onEnroll,
  isEnrolling,
  progress,
  className = '',
}: CourseHeaderProps) {
  const averageRating = course.stats?.averageRating || 0;
  const ratingCount = course.stats?.reviewsCount || 0;
  const enrollmentCount = course.stats?.enrollmentsCount || 0;

  const formatPrice = (price?: number | null) => {
    if (!price || price === 0) {return 'Free';}
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };

  const formatDate = (date: Date | null) => {
    if (!date) {return 'N/A';}
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Categories and Status */}
      <div className="flex flex-wrap items-center gap-3">
        {course.categories.map((category) => (
          <span
            key={category.id}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600 transition-colors cursor-pointer"
          >
            {category.name}
          </span>
        ))}
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${COURSE_LEVEL_COLORS[course.level]}`}>
          {course.level}
        </span>
        {course.featured && (
          <span className="px-3 py-1 bg-miyabi-purple text-white rounded-full text-sm font-medium">
            Featured
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
        {course.title}
      </h1>

      {/* Subtitle/Description */}
      <p className="text-lg text-gray-300 leading-relaxed">
        {course.description.length > 200
          ? `${course.description.substring(0, 200)}...`
          : course.description
        }
      </p>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Rating */}
        {ratingCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                />
              ))}
            </div>
            <span className="font-semibold text-white">{averageRating.toFixed(1)}</span>
            <span className="text-gray-400">({ratingCount} reviews)</span>
          </div>
        )}

        {/* Enrollment Count */}
        {enrollmentCount > 0 && (
          <div className="flex items-center gap-2 text-gray-300">
            <TrendingUp size={16} className="text-miyabi-blue" />
            <span>{enrollmentCount.toLocaleString()} students enrolled</span>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar size={16} />
          <span>Updated {formatDate(course.updatedAt)}</span>
        </div>
      </div>

      {/* Instructor Info */}
      <div className="flex items-center gap-4">
        <Image
          src={course.creator.avatar || '/api/placeholder/50/50'}
          alt={course.creator.displayName || course.creator.username || 'Instructor'}
          width={50}
          height={50}
          className="rounded-full"
        />
        <div>
          <div className="text-gray-400 text-sm">Created by</div>
          <div className="font-semibold text-white">
            {course.creator.displayName || course.creator.username}
          </div>
        </div>
      </div>

      {/* Price and Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{formatPrice(course.price)}</span>
          {course.price && course.price > 0 && (
            <span className="text-gray-400 text-sm">one-time payment</span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {isEnrolled ? (
            <div className="flex items-center gap-4">
              <button className="bg-miyabi-blue text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors">
                Continue Learning
              </button>
              {progress && (
                <div className="text-sm text-gray-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={16} className="text-miyabi-green" />
                    <span>{progress.overall}% Complete</span>
                  </div>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-miyabi-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.overall}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : canEnroll ? (
            <button
              onClick={onEnroll}
              disabled={isEnrolling}
              className="
                bg-miyabi-purple text-white px-8 py-3 rounded-lg
                font-semibold text-lg hover:bg-purple-600
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              "
            >
              {isEnrolling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <span>Enroll Now</span>
              )}
            </button>
          ) : (
            <div className="text-gray-400">
              <span className="text-sm">Course not available for enrollment</span>
            </div>
          )}

          {/* Wishlist/Bookmark */}
          <button className="
            p-3 border-2 border-gray-600 rounded-lg
            text-gray-400 hover:text-white hover:border-gray-500
            transition-colors
          ">
            <Award size={20} />
          </button>
        </div>
      </div>

      {/* Course Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-miyabi-blue mb-1">
            {course.stats?.lessonsCount || 0}
          </div>
          <div className="text-sm text-gray-400">Lessons</div>
        </div>

        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-miyabi-green mb-1">
            {Math.floor((course.estimatedTime || 0) / 60)}h
          </div>
          <div className="text-sm text-gray-400">Content</div>
        </div>

        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-miyabi-purple mb-1">
            {enrollmentCount}
          </div>
          <div className="text-sm text-gray-400">Students</div>
        </div>

        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-400">Rating</div>
        </div>
      </div>

      {/* Special Offers or Badges */}
      {course.featured && (
        <div className="bg-gradient-to-r from-miyabi-purple/20 to-miyabi-blue/20 border border-miyabi-purple/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Award className="text-miyabi-purple" size={24} />
            <div>
              <div className="font-semibold text-white">Featured Course</div>
              <div className="text-sm text-gray-300">
                Hand-picked by our experts for quality and value
              </div>
            </div>
          </div>
        </div>
      )}

      {course.price === 0 && (
        <div className="bg-gradient-to-r from-miyabi-green/20 to-miyabi-blue/20 border border-miyabi-green/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-miyabi-green" size={24} />
            <div>
              <div className="font-semibold text-white">Free Course</div>
              <div className="text-sm text-gray-300">
                Get unlimited access to all course content at no cost
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseHeader;

/**
 * Course Card Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Users, BookOpen, Play, Tag } from 'lucide-react';
import { CourseWithRelations, CourseCardMode, COURSE_LEVEL_COLORS } from '../shared/types';
import { useAuth } from '../../auth/RoleGuard';

interface CourseCardProps {
  course: CourseWithRelations;
  mode?: CourseCardMode;
  showEnrollButton?: boolean;
  onEnroll?: (courseId: string) => void;
  className?: string;
}

export function CourseCard({
  course,
  mode = 'grid',
  showEnrollButton = true,
  onEnroll,
  className = ''
}: CourseCardProps) {
  const { isAuthenticated, user } = useAuth();

  const averageRating = course.stats?.averageRating || 0;
  const ratingCount = course.stats?.reviewsCount || 0;
  const enrollmentCount = course.stats?.enrollmentsCount || 0;
  const lessonsCount = course.stats?.lessonsCount || 0;

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return 'Self-paced';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price?: number | null) => {
    if (!price || price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };

  const handleEnroll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEnroll) {
      onEnroll(course.id);
    }
  };

  const isEnrolled = course.userEnrollment?.status === 'ACTIVE';
  const progress = course.userProgress?.completedAt ? 100 : 0;

  if (mode === 'list') {
    return (
      <Link href={`/courses/${course.slug}`} className={`block ${className}`}>
        <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-miyabi-blue/50 transition-all duration-200 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={course.thumbnail || '/api/placeholder/300/200'}
                alt={course.title}
                fill
                className="object-cover"
              />
              {course.featured && (
                <div className="absolute top-2 left-2 bg-miyabi-purple px-2 py-1 rounded-full text-xs font-semibold">
                  Featured
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${COURSE_LEVEL_COLORS[course.level]}`}>
                      {course.level}
                    </span>
                    {course.categories.map((category) => (
                      <span key={category.id} className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                        {category.name}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 hover:text-miyabi-blue transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{enrollmentCount} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={16} />
                      <span>{lessonsCount} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{formatDuration(course.estimatedTime)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        {averageRating.toFixed(1)} ({ratingCount} reviews)
                      </span>
                    </div>

                    <div className="text-lg font-bold text-miyabi-blue">
                      {formatPrice(course.price)}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="ml-4">
                  {isEnrolled ? (
                    <div className="flex flex-col items-center gap-2">
                      <button className="bg-miyabi-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Continue
                      </button>
                      {progress > 0 && (
                        <div className="text-xs text-gray-400">
                          {progress}% Complete
                        </div>
                      )}
                    </div>
                  ) : (
                    showEnrollButton && (
                      <button
                        onClick={handleEnroll}
                        className="bg-miyabi-purple text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                      >
                        Enroll Now
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid mode (default)
  return (
    <Link href={`/courses/${course.slug}`} className={`block group ${className}`}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-miyabi-blue/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
        {/* Thumbnail */}
        <div className="relative h-48 rounded-t-lg overflow-hidden">
          <Image
            src={course.thumbnail || '/api/placeholder/400/200'}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay elements */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {course.featured && (
            <div className="absolute top-3 left-3 bg-miyabi-purple px-3 py-1 rounded-full text-sm font-semibold">
              Featured
            </div>
          )}

          <div className="absolute top-3 right-3">
            <span className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-sm text-white">
              {formatPrice(course.price)}
            </span>
          </div>

          {/* Play button for preview */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Play size={24} className="text-white ml-1" />
            </div>
          </div>

          {/* Progress bar for enrolled courses */}
          {isEnrolled && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
              <div className="flex items-center justify-between text-xs text-white mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-miyabi-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${COURSE_LEVEL_COLORS[course.level]}`}>
                {course.level}
              </span>
              {course.categories.slice(0, 1).map((category) => (
                <span key={category.id} className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                  {category.name}
                </span>
              ))}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-miyabi-blue transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-3">
            <Image
              src={course.creator.avatar || '/api/placeholder/32/32'}
              alt={course.creator.displayName || course.creator.username || 'Instructor'}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm text-gray-400">
              {course.creator.displayName || course.creator.username}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {course.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{enrollmentCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={16} />
                <span>{lessonsCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{formatDuration(course.estimatedTime)}</span>
              </div>
            </div>
          </div>

          {/* Rating and Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400 ml-1">
                ({ratingCount})
              </span>
            </div>

            {isEnrolled ? (
              <button className="bg-miyabi-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                Continue
              </button>
            ) : (
              showEnrollButton && (
                <button
                  onClick={handleEnroll}
                  className="bg-miyabi-purple text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                >
                  Enroll
                </button>
              )
            )}
          </div>

          {/* Tags */}
          {course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {course.tags.slice(0, 3).map((tag) => (
                <div key={tag} className="flex items-center gap-1 text-xs text-gray-500">
                  <Tag size={12} />
                  <span>{tag}</span>
                </div>
              ))}
              {course.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{course.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default CourseCard;
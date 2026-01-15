/**
 * Course Reviews Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, MessageSquare, Filter, ChevronDown } from 'lucide-react';
import { useCourseReviews } from '../shared/hooks';

interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
  };
  rating: number;
  title?: string;
  comment: string;
  createdAt: Date;
  helpful: number;
  isHelpful?: boolean;
}

interface CourseReviewsProps {
  courseId: string;
  canReview: boolean;
  className?: string;
}

export function CourseReviews({
  courseId,
  canReview,
  className = '',
}: CourseReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'helpful'>('newest');

  const { reviews, isLoading, submitReview, isSubmitting } = useCourseReviews(courseId);

  // Mock review data - in real app, this comes from the API
  const mockReviews: Review[] = [
    {
      id: '1',
      user: {
        id: '1',
        name: 'Sarah Chen',
        avatar: '/api/placeholder/40/40',
        initials: 'SC',
      },
      rating: 5,
      title: 'Excellent course with practical examples',
      comment: 'This course exceeded my expectations. The instructor explains complex concepts in a clear and understandable way. The hands-on projects really helped me apply what I learned.',
      createdAt: new Date('2024-01-15'),
      helpful: 24,
      isHelpful: false,
    },
    {
      id: '2',
      user: {
        id: '2',
        name: 'Michael Rodriguez',
        initials: 'MR',
      },
      rating: 4,
      title: 'Great content, could use more advanced topics',
      comment: 'The course covers the fundamentals very well. I would have liked to see some more advanced techniques, but overall it\'s a solid foundation.',
      createdAt: new Date('2024-01-10'),
      helpful: 18,
      isHelpful: true,
    },
    {
      id: '3',
      user: {
        id: '3',
        name: 'Emily Johnson',
        avatar: '/api/placeholder/40/40',
        initials: 'EJ',
      },
      rating: 5,
      title: 'Perfect for beginners',
      comment: 'As someone completely new to this topic, I found this course incredibly helpful. The pace is just right and the examples are relevant.',
      createdAt: new Date('2024-01-08'),
      helpful: 15,
      isHelpful: false,
    },
  ];

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewForm.rating === 0 || !reviewForm.comment.trim()) {return;}

    try {
      await submitReview({
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || undefined,
        comment: reviewForm.comment.trim(),
      });

      setReviewForm({ rating: 0, title: '', comment: '' });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = mockReviews.filter(review => review.rating === rating).length;
    const percentage = mockReviews.length > 0 ? (count / mockReviews.length) * 100 : 0;
    return { rating, count, percentage };
  });

  const averageRating = mockReviews.length > 0
    ? mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length
    : 0;

  const filteredReviews = mockReviews
    .filter(review => filterRating === null || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'helpful':
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Reviews Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rating Summary */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <span className="text-4xl font-bold text-white">
                {averageRating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                    />
                  ))}
                </div>
                <div className="text-gray-400 text-sm">
                  Based on {mockReviews.length} reviews
                </div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-gray-400">{rating}</span>
                  <Star size={14} className="text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Write Review Button */}
        {canReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-miyabi-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <MessageSquare size={16} />
            Write a Review
          </button>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Rating Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map(rating => (
                <option key={rating} value={rating}>{rating} stars</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="helpful">Most helpful</option>
          </select>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rating *
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={24}
                      className={
                        star <= reviewForm.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-600 hover:text-yellow-400'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Review *
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your thoughts about this course..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-400 mt-1">
                {reviewForm.comment.length}/500 characters
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || reviewForm.rating === 0 || !reviewForm.comment.trim()}
                className="bg-miyabi-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {filterRating ? `No ${filterRating}-star reviews found` : 'No reviews yet'}
            </h3>
            <p className="text-gray-500">
              {canReview ? 'Be the first to leave a review!' : 'Check back later for student reviews.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {review.user.avatar ? (
                      <Image
                        src={review.user.avatar}
                        alt={review.user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-300">
                        {review.user.initials}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="font-medium text-white">{review.user.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 text-sm">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-3">
                {review.title && (
                  <h4 className="font-medium text-white">{review.title}</h4>
                )}
                <p className="text-gray-300 leading-relaxed">{review.comment}</p>

                {/* Review Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <button
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      review.isHelpful
                        ? 'text-miyabi-blue'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <ThumbsUp size={14} />
                    <span>Helpful ({review.helpful})</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredReviews.length > 0 && (
        <div className="text-center">
          <button className="text-miyabi-blue hover:text-blue-400 transition-colors">
            Load more reviews
          </button>
        </div>
      )}
    </div>
  );
}

export default CourseReviews;

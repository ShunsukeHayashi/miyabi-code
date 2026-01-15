/**
 * Performance-Optimized React Components
 * Implements memoization, lazy loading, and efficient rendering patterns
 */

'use client';

import React, {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  Suspense,
  forwardRef,
  lazy,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { cacheManager, cacheKey } from './cache-manager';

// Lazy-loaded components for code splitting
const AnalyticsDashboard = lazy(() => import('@/components/analytics/AnalyticsDashboard'));
const VideoPlayer = lazy(() => import('@/components/video/VideoPlayer'));
const CollaborativeEditor = lazy(() => import('@/components/collaboration/CollaborativeEditor'));

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>();
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    renderStart.current = performance.now();
    setRenderCount(prev => prev + 1);

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;

        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.debug(`${componentName} render #${renderCount}: ${renderTime.toFixed(2)}ms`);
        }

        // Send to analytics in production
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'component_render', {
            component_name: componentName,
            render_time: renderTime,
            render_count: renderCount,
          });
        }
      }
    };
  });

  return { renderCount };
}

// Optimized Course List with virtualization and memoization
interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  price: number;
  difficulty: string;
  estimatedDuration: number;
  rating: number;
  enrollmentCount: number;
}

interface OptimizedCourseListProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  filters?: {
    search?: string;
    category?: string;
    difficulty?: string;
    priceRange?: [number, number];
  };
  loading?: boolean;
}

export const OptimizedCourseList = memo<OptimizedCourseListProps>(({
  courses,
  onCourseClick,
  filters,
  loading = false,
}) => {
  usePerformanceMonitor('OptimizedCourseList');

  // Debounced search for performance
  const debouncedSearch = useDebouncedValue(filters?.search || '', 300);

  // Memoized filtered courses
  const filteredCourses = useMemo(() => {
    if (!courses) {return [];}

    return courses.filter(course => {
      const matchesSearch = !debouncedSearch ||
        course.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.instructor.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesCategory = !filters?.category ||
        course.difficulty === filters.category;

      const matchesDifficulty = !filters?.difficulty ||
        course.difficulty === filters.difficulty;

      const matchesPrice = !filters?.priceRange ||
        (course.price >= filters.priceRange[0] && course.price <= filters.priceRange[1]);

      return matchesSearch && matchesCategory && matchesDifficulty && matchesPrice;
    });
  }, [courses, debouncedSearch, filters?.category, filters?.difficulty, filters?.priceRange]);

  // Virtualization for large lists
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredCourses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated height of each course card
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  const handleCourseClick = useCallback((course: Course) => {
    onCourseClick(course);
  }, [onCourseClick]);

  if (loading) {
    return <CourseListSkeleton count={6} />;
  }

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }} // CSS containment for better performance
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const course = filteredCourses[virtualItem.index];
          return (
            <div
              key={course.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <CourseCard
                course={course}
                onClick={handleCourseClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

OptimizedCourseList.displayName = 'OptimizedCourseList';

// Memoized Course Card with lazy image loading
interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
}

const CourseCard = memo<CourseCardProps>(({ course, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 });

  const handleClick = useCallback(() => {
    onClick(course);
  }, [course, onClick]);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={handleClick}
      style={{ contain: 'layout style' }} // CSS containment
    >
      {isVisible && (
        <>
          <LazyImage
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-48 object-cover"
            placeholder="bg-gray-200 animate-pulse"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold truncate">{course.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-lg font-bold text-blue-600">${course.price}</span>
              <div className="text-sm text-gray-500">
                {course.difficulty} • {course.estimatedDuration}h
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center">
                <StarRating rating={course.rating} />
                <span className="ml-1 text-sm text-gray-600">({course.enrollmentCount})</span>
              </div>
              <span className="text-xs text-gray-500">{course.instructor}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

CourseCard.displayName = 'CourseCard';

// Lazy Image component with placeholder
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

const LazyImage = memo<LazyImageProps>(({ src, alt, className, placeholder }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  if (error) {
    return (
      <div className={`${className} ${placeholder} flex items-center justify-center`}>
        <span className="text-gray-400">Image failed to load</span>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && (
        <div className={`${className} ${placeholder}`} />
      )}
      {isLoaded && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={className}
          loading="lazy"
          decoding="async"
        />
      )}
    </>
  );
});

LazyImage.displayName = 'LazyImage';

// Star Rating component (memoized for performance)
const StarRating = memo<{ rating: number }>(({ rating }) => {
  const stars = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const isFilled = i < Math.floor(rating);
    const isHalf = i === Math.floor(rating) && rating % 1 >= 0.5;

    return (
      <span
        key={i}
        className={`text-sm ${
          isFilled ? 'text-yellow-400' : isHalf ? 'text-yellow-300' : 'text-gray-300'
        }`}
      >
          ★
      </span>
    );
  }), [rating]);

  return <div className="flex">{stars}</div>;
});

StarRating.displayName = 'StarRating';

// Loading skeletons
const CourseListSkeleton = memo<{ count: number }>(({ count }) => {
  const skeletons = useMemo(
    () => Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="w-full h-48 bg-gray-200" />
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    )),
    [count],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skeletons}
    </div>
  );
});

CourseListSkeleton.displayName = 'CourseListSkeleton';

// Optimized Video Player wrapper with lazy loading
interface OptimizedVideoPlayerProps {
  videoId: string;
  autoplay?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export const OptimizedVideoPlayer = memo<OptimizedVideoPlayerProps>(({
  videoId,
  autoplay = false,
  onProgress,
  onComplete,
}) => {
  usePerformanceMonitor('OptimizedVideoPlayer');

  const [shouldLoad, setShouldLoad] = useState(autoplay);
  const playerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(playerRef, { threshold: 0.5 });

  // Load video only when visible or autoplay is enabled
  useEffect(() => {
    if (isVisible && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isVisible, shouldLoad]);

  return (
    <div ref={playerRef} className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {shouldLoad ? (
        <Suspense fallback={<VideoPlayerSkeleton />}>
          <VideoPlayer
            videoId={videoId}
            autoplay={autoplay}
            onProgress={onProgress}
            onComplete={onComplete}
          />
        </Suspense>
      ) : (
        <VideoPlayerPlaceholder onClick={() => setShouldLoad(true)} />
      )}
    </div>
  );
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

const VideoPlayerPlaceholder = memo<{ onClick: () => void }>(({ onClick }) => (
  <div
    className="w-full h-full flex items-center justify-center cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors"
    onClick={onClick}
  >
    <div className="text-center">
      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 5v10l7-5-7-5z" />
        </svg>
      </div>
      <p className="text-white text-sm">Click to load video</p>
    </div>
  </div>
));

VideoPlayerPlaceholder.displayName = 'VideoPlayerPlaceholder';

const VideoPlayerSkeleton = memo(() => (
  <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
    <div className="w-16 h-16 bg-gray-300 rounded-full" />
  </div>
));

VideoPlayerSkeleton.displayName = 'VideoPlayerSkeleton';

// Optimized Analytics Dashboard wrapper
export const OptimizedAnalyticsDashboard = memo(() => {
  usePerformanceMonitor('OptimizedAnalyticsDashboard');

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsDashboard />
    </Suspense>
  );
});

OptimizedAnalyticsDashboard.displayName = 'OptimizedAnalyticsDashboard';

const AnalyticsSkeleton = memo(() => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-gray-200 h-32 rounded-lg" />
      ))}
    </div>
    <div className="bg-gray-200 h-64 rounded-lg" />
    <div className="bg-gray-200 h-48 rounded-lg" />
  </div>
));

AnalyticsSkeleton.displayName = 'AnalyticsSkeleton';

// Performance-optimized table component
interface OptimizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
    sortable?: boolean;
  }>;
  pageSize?: number;
  loading?: boolean;
}

export function OptimizedTable<T extends { id: string }>({
  data,
  columns,
  pageSize = 50,
  loading = false,
}: OptimizedTableProps<T>) {
  usePerformanceMonitor('OptimizedTable');

  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) {return data;}

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {return sortConfig.direction === 'asc' ? -1 : 1;}
      if (aValue > bValue) {return sortConfig.direction === 'asc' ? 1 : -1;}
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={10} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && sortConfig?.key === column.key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.slice(0, pageSize).map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((column) => (
                <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(item[column.key], item) : String(item[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TableSkeleton = memo<{ columns: number; rows: number }>(({ columns, rows }) => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-10 rounded mb-4" />
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex space-x-4 mb-2">
        {Array.from({ length: columns }, (_, j) => (
          <div key={j} className="bg-gray-200 h-8 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

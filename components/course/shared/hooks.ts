/**
 * Course React Hooks
 * Issue #1299: Comprehensive course management UI components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  courseApi,
  lessonApi,
  enrollmentApi,
  assessmentApi,
  reviewApi,
  studentApi,
  instructorApi,
  categoryApi,
  searchApi,
  queryKeys
} from './api';
import {
  CourseWithRelations,
  CourseQuery,
  LoadingState,
  ProgressData,
  CourseAnalytics,
  StudentDashboard
} from './types';

// Course listing hook with filters and search
export function useCourses(query: CourseQuery = {}, options?: UseQueryOptions) {
  return useQuery({
    queryKey: [...queryKeys.courses, query],
    queryFn: () => courseApi.getCourses(query),
    ...options,
  });
}

// Single course hook
export function useCourse(courseId: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: () => courseApi.getCourse(courseId),
    enabled: !!courseId,
    ...options,
  });
}

// Course by slug hook
export function useCourseBySlug(slug: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.courseBySlug(slug),
    queryFn: () => courseApi.getCourseBySlug(slug),
    enabled: !!slug,
    ...options,
  });
}

// Course enrollment hook
export function useEnrollment(courseId: string) {
  const queryClient = useQueryClient();

  const { data: enrollmentStatus, isLoading } = useQuery({
    queryKey: queryKeys.enrollment(courseId),
    queryFn: () => enrollmentApi.getEnrollmentStatus(courseId),
    enabled: !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: (data: { paymentMethod?: string; couponCode?: string }) =>
      enrollmentApi.enrollInCourse({ courseId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollment(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
    },
  });

  const enroll = useCallback(
    (data?: { paymentMethod?: string; couponCode?: string }) => {
      return enrollMutation.mutate(data);
    },
    [enrollMutation]
  );

  return {
    enrollmentStatus: enrollmentStatus?.data,
    isLoading,
    isEnrolling: enrollMutation.isPending,
    enroll,
    enrollmentError: enrollMutation.error,
  };
}

// Course progress hook
export function useCourseProgress(courseId: string) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  useEffect(() => {
    if (!courseId) return;

    setLoadingState('loading');
    // This would typically fetch from an API
    // For now, we'll simulate with local state
    setTimeout(() => {
      setProgress({
        overall: 45,
        lessonsCompleted: 3,
        totalLessons: 12,
        timeSpent: 3600, // 1 hour
        lastAccessedAt: new Date(),
        certificates: [],
      });
      setLoadingState('success');
    }, 1000);
  }, [courseId]);

  const updateProgress = useCallback((lessonId: string, completed: boolean) => {
    if (!progress) return;

    setProgress(prev => {
      if (!prev) return null;

      const newCompleted = completed
        ? prev.lessonsCompleted + 1
        : Math.max(0, prev.lessonsCompleted - 1);

      return {
        ...prev,
        lessonsCompleted: newCompleted,
        overall: Math.round((newCompleted / prev.totalLessons) * 100),
        lastAccessedAt: new Date(),
      };
    });
  }, [progress]);

  return {
    progress,
    loadingState,
    updateProgress,
  };
}

// Course reviews hook
export function useCourseReviews(courseId: string) {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: queryKeys.reviews(courseId),
    queryFn: () => reviewApi.getCourseReviews(courseId),
    enabled: !!courseId,
  });

  const submitReviewMutation = useMutation({
    mutationFn: (data: { rating: number; title?: string; comment?: string }) =>
      reviewApi.submitReview(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.course(courseId) });
    },
  });

  const submitReview = useCallback(
    (data: { rating: number; title?: string; comment?: string }) => {
      return submitReviewMutation.mutate(data);
    },
    [submitReviewMutation]
  );

  return {
    reviews: reviews?.data || [],
    isLoading,
    isSubmitting: submitReviewMutation.isPending,
    submitReview,
    submitError: submitReviewMutation.error,
  };
}

// Student dashboard hook
export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.studentDashboard,
    queryFn: () => studentApi.getDashboardData(),
  });
}

// Instructor dashboard hook
export function useInstructorDashboard() {
  return useQuery({
    queryKey: queryKeys.instructorDashboard,
    queryFn: () => instructorApi.getDashboardData(),
  });
}

// Course analytics hook (for instructors)
export function useCourseAnalytics(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseAnalytics(courseId),
    queryFn: () => courseApi.getCourseAnalytics(courseId),
    enabled: !!courseId,
  });
}

// Search hook with debouncing
export function useCourseSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.searchCourses(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  // Fetch suggestions
  useEffect(() => {
    if (query.length > 1) {
      searchApi.getSearchSuggestions(query).then(response => {
        setSuggestions(response.data || []);
      }).catch(() => {
        setSuggestions([]);
      });
    } else {
      setSuggestions([]);
    }
  }, [query]);

  return {
    query,
    setQuery,
    searchResults: searchResults?.data || [],
    suggestions,
    isLoading,
  };
}

// Categories hook
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoryApi.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Local storage hook for preferences
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }, [key, value]);

  return [value, setStoredValue] as const;
}

// Video player hook
export function useVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [captions, setCaptions] = useState(false);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying(prev => !prev), []);

  const seek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    quality,
    captions,
    play,
    pause,
    toggle,
    seek,
    reset,
    setCurrentTime,
    setDuration,
    setVolume,
    setPlaybackRate,
    setQuality,
    setCaptions,
  };
}

// Form validation hook
export function useFormValidation<T>(
  initialValues: T,
  validationRules: Record<keyof T, (value: any) => string | null>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate field
    const error = validationRules[field]?.(value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [validationRules]);

  const setTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(field => {
      const error = validationRules[field as keyof T](values[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validateAll,
    reset,
  };
}

// Intersection observer hook for scroll-based animations
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}
/**
 * Loading State Component
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 */

'use client';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'dots';
  className?: string;
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-5 w-5 text-blue-600 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingDots() {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-8 w-2/3" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <SkeletonLine className="h-10 flex-1" />
          <SkeletonLine className="h-10 w-24" />
          <SkeletonLine className="h-10 w-20" />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({
  message = 'Loading...',
  variant = 'spinner',
  className = ''
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {variant === 'spinner' && <LoadingSpinner className="h-8 w-8" />}
      {variant === 'dots' && <LoadingDots />}
      {variant === 'skeleton' && (
        <div className="w-full space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {message && variant !== 'skeleton' && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}

export default LoadingState;

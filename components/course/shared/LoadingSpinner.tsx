/**
 * Loading Spinner Component
 * Issue #1299: Comprehensive course management UI components
 */

import React from 'react';
import { BaseComponentProps } from './types';

interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'purple' | 'gray';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    blue: 'border-miyabi-blue',
    purple: 'border-miyabi-purple',
    gray: 'border-gray-300',
  };

  const spinner = (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : ''} ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <div
          className={`
            ${sizeClasses[size]}
            border-4 border-solid border-gray-200 border-t-transparent
            ${colorClasses[color]}
            rounded-full animate-spin
          `}
        />
        {text && (
          <p className="text-gray-600 text-sm animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );

  return spinner;
}

export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg p-6 animate-pulse ${className}`}>
      <div className="space-y-4">
        {/* Thumbnail */}
        <div className="bg-gray-700 rounded-lg h-48 w-full" />

        {/* Title */}
        <div className="space-y-2">
          <div className="bg-gray-700 rounded h-6 w-3/4" />
          <div className="bg-gray-700 rounded h-4 w-1/2" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="bg-gray-700 rounded h-4 w-full" />
          <div className="bg-gray-700 rounded h-4 w-5/6" />
          <div className="bg-gray-700 rounded h-4 w-2/3" />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4">
          <div className="bg-gray-700 rounded h-4 w-20" />
          <div className="bg-gray-700 rounded h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

export function LoadingList({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  );
}

export function LoadingGrid({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  );
}
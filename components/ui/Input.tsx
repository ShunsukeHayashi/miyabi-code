'use client';

import * as React from 'react';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-gray-900/50 px-4 py-2 text-sm text-white placeholder:text-gray-500',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-miyabi-red focus:ring-miyabi-red/50'
              : 'border-gray-700 focus:border-miyabi-blue focus:ring-miyabi-blue/50',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
        {error && (
          <p className="mt-1 text-xs text-miyabi-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

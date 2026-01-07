'use client';

import * as React from 'react';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

const variantStyles = {
  default:
    'bg-gradient-to-r from-miyabi-blue to-miyabi-purple text-white shadow-lg shadow-miyabi-blue/25 hover:shadow-xl hover:shadow-miyabi-blue/30 hover:scale-[1.02]',
  destructive:
    'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30',
  outline:
    'border border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600',
  secondary: 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white',
  ghost: 'text-gray-400 hover:bg-gray-800/50 hover:text-white',
  link: 'text-miyabi-blue underline-offset-4 hover:underline',
  success:
    'bg-gradient-to-r from-miyabi-green to-emerald-500 text-white shadow-lg shadow-miyabi-green/25 hover:shadow-xl hover:shadow-miyabi-green/30',
};

const sizeStyles = {
  default: 'h-10 px-5 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-8 text-base',
  xl: 'h-14 px-10 text-lg',
  icon: 'h-10 w-10',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
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
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

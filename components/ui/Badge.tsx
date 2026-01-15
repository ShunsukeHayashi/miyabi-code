'use client';

import * as React from 'react';

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}

const variantStyles = {
  default: 'bg-gray-800 text-gray-300 border border-gray-700',
  primary: 'bg-miyabi-blue/20 text-miyabi-blue border border-miyabi-blue/30',
  secondary: 'bg-miyabi-purple/20 text-miyabi-purple border border-miyabi-purple/30',
  success: 'bg-miyabi-green/20 text-miyabi-green border border-miyabi-green/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  destructive: 'bg-miyabi-red/20 text-miyabi-red border border-miyabi-red/30',
  outline: 'border border-gray-600 text-gray-400',
};

const sizeStyles = {
  default: 'px-2.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-[10px]',
  lg: 'px-3 py-1 text-sm',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  dot?: boolean;
  dotColor?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', dot, dotColor, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', dotColor || 'bg-current')} />
      )}
      {children}
    </div>
  ),
);

Badge.displayName = 'Badge';

export { Badge };

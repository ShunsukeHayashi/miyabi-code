/**
 * Card Component
 * Container component for grouping related content
 */

import { type BaseComponentProps } from '../../types.js';

export interface CardProps extends BaseComponentProps {
  /** Card content */
  children: React.ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Card footer content */
  footer?: React.ReactNode;
  /** Show shadow */
  shadow?: boolean;
  /** Make card clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export function Card({
  children,
  title,
  subtitle,
  footer,
  shadow = true,
  clickable = false,
  onClick,
  className = '',
  testId,
}: CardProps) {
  const baseClasses = 'bg-white rounded-xl border border-gray-200';
  const shadowClass = shadow ? 'shadow-lg' : '';
  const clickableClass = clickable ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : '';
  const classes = `${baseClasses} ${shadowClass} ${clickableClass} ${className}`.trim();

  const cardContent = (
    <div className={classes} data-testid={testId} onClick={onClick}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );

  return cardContent;
}

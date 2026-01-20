/**
 * UI Components Types
 */

/** Button variants */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Button sizes */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Base props for all components */
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

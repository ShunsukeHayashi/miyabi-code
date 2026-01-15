import type { ButtonHTMLAttributes } from 'react';

import { mergeClassNames } from './utils';

type GlassButtonVariant = 'primary' | 'ghost' | 'outline';

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GlassButtonVariant;
};

const variantStyles: Record<GlassButtonVariant, string> = {
  primary:
    'bg-white/15 text-white shadow-[0_18px_50px_rgba(14,22,38,0.4)] hover:bg-white/25 focus-visible:ring-white/60',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/10',
  outline:
    'border border-white/30 text-white/90 hover:border-white/60 hover:bg-white/10 focus-visible:ring-white/50',
};

export function GlassButton({
  variant = 'primary',
  className,
  ...props
}: GlassButtonProps): JSX.Element {
  return (
    <button
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition duration-300 focus-visible:outline-none focus-visible:ring-2',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

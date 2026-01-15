import type { HTMLAttributes } from 'react';

import { mergeClassNames } from './utils';

type GlassBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'cool' | 'warm' | 'electric';
};

const toneStyles: Record<NonNullable<GlassBadgeProps['tone']>, string> = {
  cool: 'bg-cyan-300/10 text-cyan-100 border-cyan-200/20',
  warm: 'bg-amber-300/10 text-amber-100 border-amber-200/20',
  electric: 'bg-fuchsia-300/10 text-fuchsia-100 border-fuchsia-200/20',
};

export function GlassBadge({ tone = 'cool', className, ...props }: GlassBadgeProps): JSX.Element {
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] shadow-[0_8px_30px_rgba(15,23,42,0.25)] backdrop-blur',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}

import type { ReactNode } from 'react';

import { mergeClassNames } from './utils';

interface GlassCardProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function GlassCard({
  eyebrow,
  title,
  description,
  children,
  className,
}: GlassCardProps): JSX.Element {
  return (
    <section
      className={mergeClassNames(
        'glass-card relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 px-6 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-2xl',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_60%)] opacity-60" />
      <div className="relative space-y-4">
        {(eyebrow ?? title ?? description) && (
          <div className="space-y-2">
            {eyebrow && (
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">{eyebrow}</span>
            )}
            {title && <h3 className="glass-font-display text-2xl text-white">{title}</h3>}
            {description && <p className="text-sm leading-relaxed text-white/70">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

import type { InputHTMLAttributes, ReactNode } from 'react';

import { mergeClassNames } from './utils';

type GlassInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  icon?: ReactNode;
};

export function GlassInput({
  label,
  hint,
  icon,
  className,
  ...props
}: GlassInputProps): JSX.Element {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      {label && <span className="text-xs uppercase tracking-[0.25em] text-white/50">{label}</span>}
      <span className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        {icon && <span className="text-white/60">{icon}</span>}
        <input
          className={mergeClassNames(
            'w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none',
            className
          )}
          {...props}
        />
      </span>
      {hint && <span className="text-xs text-white/50">{hint}</span>}
    </label>
  );
}

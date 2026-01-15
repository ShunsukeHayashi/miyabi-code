import { mergeClassNames } from './utils';

interface GlassStatProps {
  label: string;
  value: string;
  trend?: string;
  className?: string;
}

export function GlassStat({ label, value, trend, className }: GlassStatProps): JSX.Element {
  return (
    <div
      className={mergeClassNames(
        'glass-card flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.35)] backdrop-blur-2xl',
        className,
      )}
    >
      <span className="text-[11px] uppercase tracking-[0.3em] text-white/60">{label}</span>
      <span className="glass-font-display text-3xl text-white">{value}</span>
      {trend && <span className="text-xs text-emerald-200/90">{trend}</span>}
    </div>
  );
}

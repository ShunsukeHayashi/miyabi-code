import { mergeClassNames } from './utils';

interface GlassToggleOption {
  id: string;
  label: string;
}

interface GlassToggleProps {
  options: GlassToggleOption[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function GlassToggle({
  options,
  selectedId,
  onChange,
  className,
}: GlassToggleProps): JSX.Element {
  return (
    <div
      className={mergeClassNames(
        'flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 text-xs uppercase tracking-[0.2em] text-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.35)] backdrop-blur-xl',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.id === selectedId;
        return (
          <button
            key={option.id}
            className={mergeClassNames(
              'rounded-full px-4 py-2 transition duration-300',
              isActive
                ? 'bg-white/30 text-white shadow-[0_10px_30px_rgba(15,23,42,0.4)]'
                : 'hover:bg-white/10',
            )}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

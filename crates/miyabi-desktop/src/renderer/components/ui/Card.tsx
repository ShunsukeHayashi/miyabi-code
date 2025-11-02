import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClick?: () => void;
}

export default function Card({ title, subtitle, children, onClick }: CardProps) {
  const interactive = Boolean(onClick);

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={`p-6 bg-background-light rounded-lg border border-background-lighter transition-colors ${
        interactive ? 'hover:bg-background-lighter cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-extralight">{title}</h3>
          {subtitle && <p className="text-xs text-foreground-muted mt-1">{subtitle}</p>}
        </div>
        {interactive && <span className="text-xs text-foreground-muted">View</span>}
      </div>
      {children}
    </div>
  );
}

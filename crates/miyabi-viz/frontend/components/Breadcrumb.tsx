'use client';

import type { ViewLevel } from '@/types/graph';

interface BreadcrumbProps {
  currentLevel: ViewLevel;
  currentCrateId: string | null;
  onNavigate: (level: ViewLevel) => void;
}

export default function Breadcrumb({ currentLevel, currentCrateId, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
        {/* Crate Level */}
        <button
          onClick={() => onNavigate('crate')}
          className={`text-sm font-medium transition-colors ${
            currentLevel === 'crate'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🧬 Crate Level
        </button>

        {/* Module Level (only show if we're in module view) */}
        {currentLevel === 'module' && currentCrateId && (
          <>
            <span className="text-gray-500">/</span>
            <button
              className="text-sm font-medium text-white"
              disabled
            >
              📦 {currentCrateId} Modules
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

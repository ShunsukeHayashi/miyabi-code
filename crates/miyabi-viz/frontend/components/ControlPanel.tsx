'use client';

import type { DAGMode } from '@/types/graph';

interface ControlPanelProps {
  dagMode: DAGMode;
  onDagModeChange: (mode: DAGMode) => void;
  categories: string[];
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
}

export default function ControlPanel({
  dagMode,
  onDagModeChange,
  categories,
  selectedCategories,
  onCategoryToggle,
}: ControlPanelProps) {
  const dagModes: { value: DAGMode; label: string }[] = [
    { value: 'td', label: 'Top-Down' },
    { value: 'bu', label: 'Bottom-Up' },
    { value: 'lr', label: 'Left-Right' },
    { value: 'rl', label: 'Right-Left' },
    { value: 'radialout', label: 'Radial Out' },
    { value: 'radialin', label: 'Radial In' },
    { value: null, label: 'Force-Directed' },
  ];

  return (
    <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-xs">
      <h3 className="text-white font-bold text-lg mb-4">🧬 Controls</h3>

      {/* DAG Mode */}
      <div className="mb-4">
        <label className="text-gray-300 text-sm font-medium block mb-2">
          Layout Mode
        </label>
        <select
          value={dagMode || ''}
          onChange={(e) => onDagModeChange(e.target.value as DAGMode || null)}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {dagModes.map((mode) => (
            <option key={mode.label} value={mode.value || ''}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-gray-300 text-sm font-medium block mb-2">
          Filter Categories
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <label key={category} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.has(category)}
                onChange={() => onCategoryToggle(category)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-gray-400 text-xs space-y-1">
          <div>🔵 Blue: Stable (low B-factor)</div>
          <div>🟡 Yellow: Moderate activity</div>
          <div>🔴 Red: Volatile (high B-factor)</div>
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div>⚪ White line: Runtime dep</div>
            <div>⚫ Gray line: Dev dep</div>
            <div>🟡 Gold line: Build dep</div>
          </div>
        </div>
      </div>
    </div>
  );
}

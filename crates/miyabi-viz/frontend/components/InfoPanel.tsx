'use client';

import type { CrateNode } from '@/types/graph';

interface InfoPanelProps {
  selectedNode: CrateNode | null;
  onClose: () => void;
}

export default function InfoPanel({ selectedNode, onClose }: InfoPanelProps) {
  if (!selectedNode) return null;

  const loc = Math.round(Math.pow(10, selectedNode.val) * 100);
  const coveragePercent = (selectedNode.opacity * 100).toFixed(0);

  // Parse color to determine B-factor level
  const getBFactorLevel = (color: string): string => {
    if (color.startsWith('#00') || color.startsWith('#0')) return 'Low';
    if (color.includes('FF') && color.includes('00')) return 'High';
    return 'Medium';
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-xl w-80">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white font-bold text-lg">Crate Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Crate Name */}
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Name
          </div>
          <div
            className="font-mono font-bold text-lg"
            style={{ color: selectedNode.color }}
          >
            {selectedNode.id}
          </div>
        </div>

        {/* Category */}
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Category
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: {
                  'Core': '#FF6B6B',
                  'Agent': '#4ECDC4',
                  'Integration': '#45B7D1',
                  'Infrastructure': '#96CEB4',
                  'Tool': '#FFEAA7',
                  'Test': '#DFE6E9',
                  'Business': '#A29BFE',
                  'Other': '#636E72',
                }[selectedNode.group] || '#636E72'
              }}
            />
            <span className="text-white">{selectedNode.group}</span>
          </div>
        </div>

        {/* Lines of Code */}
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Lines of Code
          </div>
          <div className="text-white font-mono">
            {loc.toLocaleString()} LOC
          </div>
        </div>

        {/* B-factor (Volatility) */}
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            B-factor (Code Volatility)
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (selectedNode.opacity * 100))}%`,
                  backgroundColor: selectedNode.color,
                }}
              />
            </div>
            <span className="text-white font-mono text-sm">
              {getBFactorLevel(selectedNode.color)}
            </span>
          </div>
          <div className="text-gray-500 text-xs mt-1">
            Recent commit activity (high = more volatile)
          </div>
        </div>

        {/* Occupancy (Test Coverage) */}
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Occupancy (Test Coverage)
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <span className="text-white font-mono text-sm">{coveragePercent}%</span>
          </div>
        </div>

        {/* Molecular Metaphor */}
        <div className="pt-3 border-t border-gray-700">
          <div className="text-gray-400 text-xs space-y-2">
            <div className="flex items-start">
              <span className="mr-2">🧬</span>
              <span>
                This crate represents an <strong className="text-white">amino acid residue</strong> in the molecular structure
              </span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">🔗</span>
              <span>
                Dependencies are <strong className="text-white">peptide bonds</strong> connecting residues
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

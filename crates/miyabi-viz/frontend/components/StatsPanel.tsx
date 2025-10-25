'use client';

interface StatsPanelProps {
  stats: {
    totalCrates: number;
    totalDeps: number;
    avgLOC: number;
    avgCoverage: number;
    godCrates: number;
    unstableHubs: number;
    lowCoverage: number;
    cyclicDeps: number;
  } | null;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) return null;

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-xl w-72">
      <h3 className="text-white font-bold text-lg mb-3">📊 Statistics</h3>

      <div className="space-y-3 text-sm">
        {/* Overview */}
        <div className="pb-3 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Crates</span>
            <span className="text-white font-bold">{stats.totalCrates}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-400">Dependencies</span>
            <span className="text-white font-bold">{stats.totalDeps}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-400">Cyclic Deps</span>
            <span className={`font-bold ${stats.cyclicDeps > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {stats.cyclicDeps}
            </span>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="pb-3 border-b border-gray-700">
          <div className="text-gray-300 font-medium mb-2">Quality Metrics</div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Avg LOC</span>
            <span className="text-white font-mono">{stats.avgLOC.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-400">Avg Coverage</span>
            <span className={`font-mono ${getHealthColor(stats.avgCoverage, { good: 70, warning: 50 })}`}>
              {stats.avgCoverage}%
            </span>
          </div>
        </div>

        {/* Health Warnings */}
        <div>
          <div className="text-gray-300 font-medium mb-2">⚠️ Health Warnings</div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                God Crates
              </span>
              <span className={`font-bold ${stats.godCrates > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                {stats.godCrates}
              </span>
            </div>
            <div className="text-xs text-gray-500 ml-4">
              (&gt; 5000 LOC)
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                Unstable Hubs
              </span>
              <span className={`font-bold ${stats.unstableHubs > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                {stats.unstableHubs}
              </span>
            </div>
            <div className="text-xs text-gray-500 ml-4">
              (Large + Low Coverage)
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                Low Coverage
              </span>
              <span className={`font-bold ${stats.lowCoverage > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                {stats.lowCoverage}
              </span>
            </div>
            <div className="text-xs text-gray-500 ml-4">
              (&lt; 50%)
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div className="pt-3 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Health Score</span>
            <span className={`text-xl font-bold ${getHealthColor(calculateHealthScore(stats), { good: 80, warning: 60 })}`}>
              {calculateHealthScore(stats)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${getHealthScoreColor(calculateHealthScore(stats))}`}
              style={{ width: `${calculateHealthScore(stats)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateHealthScore(stats: StatsPanelProps['stats']): number {
  if (!stats) return 0;

  let score = 100;

  // Penalty for god crates (-5 per crate)
  score -= stats.godCrates * 5;

  // Penalty for unstable hubs (-3 per hub)
  score -= stats.unstableHubs * 3;

  // Penalty for low coverage crates (-2 per crate)
  score -= stats.lowCoverage * 2;

  // Penalty for cyclic dependencies (-10 per cycle)
  score -= stats.cyclicDeps * 10;

  // Bonus for high average coverage
  if (stats.avgCoverage >= 80) score += 5;
  else if (stats.avgCoverage < 50) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

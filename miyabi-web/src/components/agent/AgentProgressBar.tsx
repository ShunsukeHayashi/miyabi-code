interface AgentProgressBarProps {
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: string;
  className?: string;
}

export default function AgentProgressBar({
  progress,
  currentStep,
  estimatedTimeRemaining,
  className = '',
}: AgentProgressBarProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          {currentStep || 'Processing...'}
        </span>
        <span className="text-slate-600">{progress}%</span>
      </div>
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {estimatedTimeRemaining && (
        <p className="text-xs text-slate-500">
          Estimated time remaining: {estimatedTimeRemaining}
        </p>
      )}
    </div>
  );
}

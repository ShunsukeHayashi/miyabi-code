import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';

type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

const STATUS_CONFIG = {
  pending: {
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: Clock,
    label: 'Pending',
  },
  running: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Loader2,
    label: 'Running',
    animate: true,
  },
  completed: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    label: 'Completed',
  },
  failed: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    label: 'Failed',
  },
} as const;

interface AgentStatusIndicatorProps {
  status: AgentStatus;
  className?: string;
}

export default function AgentStatusIndicator({
  status,
  className = '',
}: AgentStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${className}`}
    >
      <Icon
        className={`h-4 w-4 ${config.color} ${'animate' in config && config.animate ? 'animate-spin' : ''}`}
      />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

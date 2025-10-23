import { Card, CardContent } from '@/components/ui/card';
import AgentBadge from './AgentBadge';
import AgentStatusIndicator from './AgentStatusIndicator';
import AgentProgressBar from './AgentProgressBar';
import { formatDistanceToNow } from 'date-fns';

type AgentType =
  | 'coordinator'
  | 'codegen'
  | 'review'
  | 'deployment'
  | 'pr'
  | 'issue'
  | 'hooks';

type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

interface Execution {
  id: string;
  agentType: AgentType;
  issueNumber: number;
  status: AgentStatus;
  progress?: number;
  startedAt: string;
  currentStep?: string;
}

interface AgentExecutionCardProps {
  execution: Execution;
  onClick?: () => void;
  className?: string;
}

export default function AgentExecutionCard({
  execution,
  onClick,
  className = '',
}: AgentExecutionCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentBadge type={execution.agentType} />
            <div>
              <p className="font-medium text-slate-900">
                Issue #{execution.issueNumber}
              </p>
              <p className="text-sm text-slate-600">
                Started{' '}
                {formatDistanceToNow(new Date(execution.startedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <AgentStatusIndicator status={execution.status} />
        </div>
        {execution.status === 'running' &&
          execution.progress !== undefined && (
            <div className="mt-4">
              <AgentProgressBar
                progress={execution.progress}
                currentStep={execution.currentStep}
              />
            </div>
          )}
      </CardContent>
    </Card>
  );
}

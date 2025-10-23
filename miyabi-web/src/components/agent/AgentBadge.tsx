import { Badge } from '@/components/ui/badge';

type AgentType =
  | 'coordinator'
  | 'codegen'
  | 'review'
  | 'deployment'
  | 'pr'
  | 'issue'
  | 'hooks';

const AGENT_COLORS = {
  coordinator: 'bg-purple-100 text-purple-800 border-purple-300',
  codegen: 'bg-blue-100 text-blue-800 border-blue-300',
  review: 'bg-green-100 text-green-800 border-green-300',
  deployment: 'bg-orange-100 text-orange-800 border-orange-300',
  pr: 'bg-violet-100 text-violet-800 border-violet-300',
  issue: 'bg-sky-100 text-sky-800 border-sky-300',
  hooks: 'bg-pink-100 text-pink-800 border-pink-300',
} as const;

const AGENT_LABELS = {
  coordinator: 'CoordinatorAgent',
  codegen: 'CodeGenAgent',
  review: 'ReviewAgent',
  deployment: 'DeploymentAgent',
  pr: 'PRAgent',
  issue: 'IssueAgent',
  hooks: 'Hooks',
} as const;

interface AgentBadgeProps {
  type: AgentType;
  className?: string;
}

export default function AgentBadge({ type, className = '' }: AgentBadgeProps) {
  return (
    <Badge className={`${AGENT_COLORS[type]} ${className}`}>
      {AGENT_LABELS[type]}
    </Badge>
  );
}

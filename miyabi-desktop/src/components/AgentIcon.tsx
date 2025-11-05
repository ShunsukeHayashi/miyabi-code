import type { AgentType } from "../lib/agent-api";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Briefcase,
  CircleHelp,
  ClipboardCheck,
  FileCode2,
  FileText,
  Funnel,
  GitPullRequest,
  Lightbulb,
  Megaphone,
  Network,
  PenTool,
  PlayCircle,
  RefreshCw,
  Rocket,
  Search,
  Share2,
  TrendingUp,
  UserCheck,
  UserCircle,
} from "lucide-react";

export const AGENT_ICON_MAP: Record<AgentType, LucideIcon> = {
  coordinator_agent: Network,
  code_gen_agent: FileCode2,
  review_agent: ClipboardCheck,
  issue_agent: AlertTriangle,
  pr_agent: GitPullRequest,
  deployment_agent: Rocket,
  refresher_agent: RefreshCw,
  ai_entrepreneur_agent: Briefcase,
  product_concept_agent: Lightbulb,
  product_design_agent: PenTool,
  funnel_design_agent: Funnel,
  persona_agent: UserCircle,
  self_analysis_agent: Brain,
  market_research_agent: Search,
  marketing_agent: Megaphone,
  content_creation_agent: FileText,
  sns_strategy_agent: Share2,
  youtube_agent: PlayCircle,
  sales_agent: TrendingUp,
  crm_agent: UserCheck,
  analytics_agent: BarChart3,
};

type AgentIconProps = {
  agentType: AgentType;
  size?: number;
  backgroundColor?: string;
  className?: string;
  iconClassName?: string;
};

export function AgentIcon({
  agentType,
  size = 20,
  backgroundColor,
  className = "",
  iconClassName = "",
}: AgentIconProps) {
  const Icon = AGENT_ICON_MAP[agentType] ?? CircleHelp;
  const containerSize = size + 8;

  return (
    <div
      className={`flex items-center justify-center rounded-lg ${className}`.trim()}
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: backgroundColor ?? "rgba(17, 24, 39, 0.06)",
        color: backgroundColor ? "#ffffff" : "#111827",
      }}
      aria-hidden="true"
    >
      <Icon
        size={size}
        strokeWidth={1.75}
        className={iconClassName}
      />
    </div>
  );
}

export default AgentIcon;

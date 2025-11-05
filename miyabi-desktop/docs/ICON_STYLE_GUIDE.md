# Miyabi Desktop Icon Style Guide

_Last updated: 2025-11-02_

## Purpose

Business and coding agents now share a unified icon language powered by `lucide-react`. This guide documents the canonical mappings and usage rules for the `AgentIcon` component introduced in Issue #642.

## Components

- `AgentIcon` (`src/components/AgentIcon.tsx`) renders agent and category icons with consistent sizing, colour accents, and dark/light friendly backgrounds.
- `getAgentIcon` / `getCategoryIcon` (`src/lib/agent-api.ts`) expose typed helpers for retrieving the underlying Lucide icons.

## Category Icons

| Category                | Icon         |
| ----------------------- | ------------ |
| `coding`                | `Code`       |
| `business-strategy`     | `Briefcase`  |
| `business-marketing`    | `TrendingUp` |
| `business-sales`        | `Users`      |

## Agent Icons

| Agent Type                     | Icon             |
| ------------------------------ | ---------------- |
| `coordinator_agent`            | `GitBranch`      |
| `code_gen_agent`               | `Code`           |
| `review_agent`                 | `CheckCircle`    |
| `issue_agent`                  | `ListTodo`       |
| `pr_agent`                     | `GitPullRequest` |
| `deployment_agent`             | `Rocket`         |
| `refresher_agent`              | `RefreshCw`      |
| `ai_entrepreneur_agent`        | `Lightbulb`      |
| `product_concept_agent`        | `Package`        |
| `product_design_agent`         | `LayoutDashboard`|
| `funnel_design_agent`          | `Filter`         |
| `persona_agent`                | `Target`         |
| `self_analysis_agent`          | `User`           |
| `market_research_agent`        | `Search`         |
| `marketing_agent`              | `Megaphone`      |
| `content_creation_agent`       | `FileText`       |
| `sns_strategy_agent`           | `Share2`         |
| `youtube_agent`                | `Video`          |
| `sales_agent`                  | `DollarSign`     |
| `crm_agent`                    | `Heart`          |
| `analytics_agent`              | `BarChart3`      |

## Usage Guidelines

1. **Prefer `AgentIcon`** – render icons via the component instead of importing Lucide icons directly. This keeps sizing, colour, and accessibility behaviour consistent.
2. **Use `variant="badge"`** when an icon should appear inside a rounded pill (e.g., agent lists, DAG nodes). The component automatically derives emphasised background and stroke colours from the agent’s palette.
3. **Fallback handling** – if an unknown agent type is encountered, `AgentIcon` falls back to the icon for that agent’s category, then to the coding icon.
4. **Dark Mode** – the component applies transparent backgrounds and inherits text colour so icons remain legible on both light and dark panels.

## Example

```tsx
import { AgentIcon } from "@/components/AgentIcon";

function AgentListItem({ type }: { type: AgentType }) {
  return (
    <div className="flex items-center gap-3">
      <AgentIcon type={type} variant="badge" size={18} />
      <span>{getAgentMetadata(type)?.displayName}</span>
    </div>
  );
}
```

Refer back to this guide whenever adding new agent UI elements to ensure icon usage stays aligned with the system-wide visual language.

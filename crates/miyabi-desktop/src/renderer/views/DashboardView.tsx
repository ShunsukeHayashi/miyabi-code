import type { DashboardSnapshot } from '../types/electron';
import Card from '../components/ui/Card';

interface DashboardViewProps {
  data: DashboardSnapshot | null;
  loading: boolean;
  error: Error | null;
  onNavigate: (view: string) => void;
}

export default function DashboardView({ data, loading, error, onNavigate }: DashboardViewProps) {
  if (loading) {
    return <div className="text-sm text-foreground-muted">Loading dashboard…</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-danger/10 text-danger rounded-md text-sm">
        Failed to load dashboard data: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-foreground-muted">No dashboard data available yet.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Worktrees"
          subtitle={`Last updated ${new Date(data.worktrees.lastUpdated).toLocaleTimeString()}`}
          onClick={() => onNavigate('worktrees')}
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="Total" value={data.worktrees.total} accent="text-primary" />
            <Stat label="Active" value={data.worktrees.active} />
            <Stat label="Idle" value={data.worktrees.idle} />
            <Stat label="Orphaned" value={data.worktrees.orphaned} />
          </div>
        </Card>

        <Card
          title="Agents"
          subtitle={`${data.agents.uniqueAgents} configured`}
          onClick={() => onNavigate('agents')}
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="Unique" value={data.agents.uniqueAgents} />
            <Stat label="Active" value={data.agents.active} />
            <Stat label="Inactive" value={data.agents.inactive} />
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="text-xs uppercase tracking-wide text-foreground-muted">Recent runs</h4>
            <ul className="space-y-1 text-sm text-foreground-muted">
              {data.agents.recentlyExecuted.length === 0 && <li>No recent activity</li>}
              {data.agents.recentlyExecuted.map((run) => (
                <li key={run.taskId} className="flex justify-between">
                  <span>{run.agentName}</span>
                  <span>{run.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Issues" subtitle="GitHub + Task metadata" onClick={() => onNavigate('issues')}>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <Stat label="Open" value={data.issues.open} />
            <Stat label="In Progress" value={data.issues.inProgress} />
            <Stat label="Done" value={data.issues.done} />
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="text-xs uppercase tracking-wide text-foreground-muted">Top priority</h4>
            <ul className="space-y-1 text-sm text-foreground-muted">
              {data.issues.topPriority.length === 0 && <li>No tracked issues</li>}
              {data.issues.topPriority.map((issue) => (
                <li key={issue.issueNumber} className="flex justify-between">
                  <span>#{issue.issueNumber}</span>
                  <span>{issue.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="History" subtitle="Recent task runs" onClick={() => onNavigate('history')}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="Success rate" value={`${Math.round(data.history.successRate * 100)}%`} />
            <Stat label="Avg. duration" value={`${Math.round(data.history.avgDurationSec)}s`} />
          </div>
          <div className="mt-4 space-y-2 text-sm text-foreground-muted">
            {data.history.recentRuns.length === 0 && <div>No recent runs</div>}
            {data.history.recentRuns.map((run) => (
              <div key={run.id} className="flex justify-between">
                <span>{run.agentName ?? 'Unknown'}</span>
                <span>{run.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="System health" subtitle="Local environment" onClick={() => onNavigate('settings')}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Platform" value={data.system.platform} />
          <Stat label="Arch" value={data.system.arch} />
          <Stat label="CPU Cores" value={data.system.cpuCores} />
          <Stat
            label="Memory"
            value={`${data.system.freeMemoryGb.toFixed(1)} / ${data.system.totalMemoryGb.toFixed(1)} GB`}
          />
          <Stat label="Uptime" value={`${data.system.uptimeHours.toFixed(1)} h`} />
        </div>
      </Card>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number | string;
  accent?: string;
}

function Stat({ label, value, accent }: StatProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-foreground-muted">{label}</div>
      <div className={`text-xl font-extralight ${accent ?? ''}`}>{value}</div>
    </div>
  );
}

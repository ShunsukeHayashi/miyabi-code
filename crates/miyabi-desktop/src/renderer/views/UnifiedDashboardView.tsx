import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Loader2,
  Play,
  RefreshCw,
  Share2,
  TerminalSquare,
} from 'lucide-react';
import {
  ChecklistItem,
  FeedItem,
  Phase,
  StatusIndicator,
  UnifiedSummary,
  useUnifiedDashboardData,
} from '../hooks/useUnifiedDashboardData';
import type { CommandResult } from '../types/electron';

type WorkflowAgent = 'coordinator' | 'codegen' | 'review' | 'pr';

type WorkflowRunState =
  | { status: 'idle' }
  | { status: 'running'; currentStep?: WorkflowAgent | 'initializing' }
  | { status: 'success' }
  | { status: 'error'; currentStep?: WorkflowAgent; errorMessage: string };

const AGENT_DISPLAY_NAMES: Record<WorkflowAgent, string> = {
  coordinator: 'CoordinatorAgent',
  codegen: 'CodeGenAgent',
  review: 'ReviewAgent',
  pr: 'PRAgent',
};

export default function UnifiedDashboardView() {
  const { loading, error, data, project } = useUnifiedDashboardData();
  const [workflowState, setWorkflowState] = useState<WorkflowRunState>({ status: 'idle' });

  if (loading) {
    return <div className="text-sm text-foreground-muted">Loading unified dashboard…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
        Failed to load unified dashboard data: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-foreground-muted">No orchestration data available yet.</div>;
  }

  const { statuses, phases, feed, checklist, summary } = data;

  const fullPipeline = useMemo<WorkflowAgent[]>(() => ['coordinator', 'codegen', 'review', 'pr'], []);
  const resumePipeline = useMemo<WorkflowAgent[]>(() => ['codegen', 'review', 'pr'], []);

  const runWorkflow = useCallback(
    async (pipeline: WorkflowAgent[]) => {
      if (!summary.issueNumber) {
        setWorkflowState({
          status: 'error',
          errorMessage:
            'No issue detected. Sync GitHub issues or select a target before starting the workflow.',
        });
        return;
      }

      if (!project?.path) {
        setWorkflowState({
          status: 'error',
          errorMessage: 'Open a Miyabi project to launch the unified workflow.',
        });
        return;
      }

      if (typeof window === 'undefined' || !window.electron?.cli?.execute) {
        setWorkflowState({
          status: 'error',
          errorMessage: 'Desktop runtime not detected. Run “npm run tauri dev” and try again.',
        });
        return;
      }

      const issueArg = String(summary.issueNumber);

      setWorkflowState({ status: 'running', currentStep: 'initializing' });

      let lastAgent: WorkflowAgent | undefined;
      try {
        for (const agent of pipeline) {
          lastAgent = agent;
          setWorkflowState({ status: 'running', currentStep: agent });

          const response = await window.electron.cli.execute(
            'agent',
            ['run', agent, '--issue', issueArg],
            { cwd: project.path }
          );

          if (!response?.success) {
            throw new Error(response?.error ?? 'Failed to launch Miyabi CLI command.');
          }

          const result: CommandResult | undefined = response.result;
          if (!result?.success) {
            const stderr = result.stderr?.trim();
            throw new Error(
              stderr && stderr.length > 0
                ? stderr.split('\n').slice(-5).join('\n')
                : `Agent ${AGENT_DISPLAY_NAMES[agent]} failed (exit ${result.exitCode ?? 'unknown'}).`
            );
          }
        }

        setWorkflowState({ status: 'success' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setWorkflowState({
          status: 'error',
          currentStep: lastAgent,
          errorMessage: message,
        });
      }
    },
    [project?.path, summary.issueNumber]
  );

  const handleStartWorkflow = useCallback(() => {
    void runWorkflow(fullPipeline);
  }, [runWorkflow, fullPipeline]);

  const handleResumeWorkflow = useCallback(() => {
    void runWorkflow(resumePipeline);
  }, [runWorkflow, resumePipeline]);

  return (
    <div className="space-y-8">
      <TopStatusStrip statuses={statuses} />
      <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr]">
        <PrimaryActionCard
          phases={phases}
          summary={summary}
          workflowState={workflowState}
          onStart={handleStartWorkflow}
          onResume={handleResumeWorkflow}
        />
        <SummaryCard summary={summary} />
      </div>
      <LiveFeed feedItems={feed} checklist={checklist} />
    </div>
  );
}

function TopStatusStrip({ statuses }: { statuses: StatusIndicator[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {statuses.map((status) => {
        const toneClasses =
          status.tone === 'ok'
            ? 'border-success/40 bg-success/5 text-success'
            : status.tone === 'warn'
            ? 'border-warning/40 bg-warning/5 text-warning'
            : 'border-danger/40 bg-danger/5 text-danger';

        return (
          <div
            key={status.id}
            className={`rounded-2xl border px-5 py-4 shadow-sm transition-shadow hover:shadow-md ${toneClasses}`}
          >
            <div className="text-xs uppercase tracking-wide opacity-75">{status.label}</div>
            <div className="flex items-center justify-between text-lg font-light">
              <span>{status.value}</span>
              {status.tone === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            {status.helper && <div className="mt-2 text-xs opacity-70">{status.helper}</div>}
          </div>
        );
      })}
    </section>
  );
}

function PrimaryActionCard({
  phases,
  summary,
  workflowState,
  onStart,
  onResume,
}: {
  phases: Phase[];
  summary: UnifiedSummary;
  workflowState: WorkflowRunState;
  onStart: () => void;
  onResume: () => void;
}) {
  const isRunning = workflowState.status === 'running';
  const currentStepLabel =
    workflowState.status === 'running' && workflowState.currentStep && workflowState.currentStep !== 'initializing'
      ? AGENT_DISPLAY_NAMES[workflowState.currentStep]
      : null;
  const startLabel = isRunning
    ? currentStepLabel
      ? `Running ${currentStepLabel}`
      : 'Starting workflow…'
    : 'Start Workflow';
  const resumeDisabled = isRunning;
  const showSuccess = workflowState.status === 'success';
  const showError = workflowState.status === 'error';

  return (
    <section className="space-y-6 rounded-3xl border border-background-lighter bg-background-light p-8 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-light">Unified Workflow</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            ワンボタンで Miyabi Orchestra をフル実行。途中で迷う点はありません。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-background-lighter bg-background px-4 py-2 text-xs text-foreground-muted">
          <Database size={14} className="text-primary" />
          Preset: <span className="font-medium text-foreground">Standard Sprint</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {phases.map((phase) => {
          const base =
            phase.status === 'done'
              ? 'border-success/40 bg-success/5 text-success'
              : phase.status === 'active'
              ? 'border-primary/40 bg-primary/5 text-primary'
              : phase.status === 'blocked'
              ? 'border-danger/40 bg-danger/5 text-danger'
              : 'border-background-lighter bg-background';
          return (
            <div key={phase.id} className={`rounded-2xl border px-5 py-4 ${base}`}>
              <div className="text-xs uppercase tracking-wide opacity-75">{phase.label}</div>
              <p className="mt-2 text-sm font-light text-foreground">{phase.description}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onStart}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-background transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {startLabel}
        </button>
        <button
          type="button"
          onClick={onResume}
          disabled={resumeDisabled}
          className="flex items-center gap-2 rounded-full border border-background-lighter px-5 py-3 text-sm text-foreground-muted transition hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Resume Previous Run
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {workflowState.status === 'running' && (
          <p className="text-foreground-muted">
            Workflow executing across Miyabi agents. Keep this window open to monitor progress.
          </p>
        )}
        {showSuccess && (
          <p className="text-success">
            Workflow completed successfully. Latest results will refresh below after agents finish logging.
          </p>
        )}
        {showError && (
          <p className="text-danger">
            {workflowState.errorMessage ?? 'Workflow failed. Review the agent logs for details.'}
          </p>
        )}
        {!summary.issueNumber && (
          <p className="text-amber-500">
            No active issue detected. Sync GitHub issues to enable one-click execution.
          </p>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ summary }: { summary: UnifiedSummary }) {
  return (
    <section className="rounded-3xl border border-background-lighter bg-background-light p-8 shadow-lg">
      <h3 className="text-sm uppercase tracking-wide text-foreground-muted">Current Focus</h3>
      <div className="mt-3 text-2xl font-light text-foreground">{summary.headline}</div>
      {summary.subtext && <p className="mt-3 text-sm text-foreground-muted">{summary.subtext}</p>}

      <dl className="mt-6 space-y-3 text-sm">
        {summary.elapsedLabel && (
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Typical duration</dt>
            <dd className="font-medium">{summary.elapsedLabel}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-foreground-muted">Agents Involved</dt>
          <dd className="font-medium">
            {summary.agentsInvolved.length ? summary.agentsInvolved.join(' · ') : '—'}
          </dd>
        </div>
        {summary.shareTarget && (
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Next Share Target</dt>
            <dd className="font-medium">{summary.shareTarget}</dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-background-lighter px-4 py-3 text-sm text-foreground transition hover:border-foreground"
      >
        <Share2 size={16} />
        Prepare Status Update
      </button>
    </section>
  );
}

function LiveFeed({
  feedItems,
  checklist,
}: {
  feedItems: FeedItem[];
  checklist: ChecklistItem[];
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <div className="rounded-3xl border border-background-lighter bg-background-light p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light">Live Activity</h3>
            <p className="text-xs text-foreground-muted">
              Real-time orchestration feed ・ Auto-scroll enabled
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-2 text-xs text-success">
            <Activity size={14} /> Streaming
          </span>
        </div>

        <div className="mt-4 space-y-3 text-sm font-light">
          {feedItems.map((item) => {
            const tone =
              item.tone === 'success'
                ? 'text-success'
                : item.tone === 'danger'
                ? 'text-danger'
                : 'text-foreground';
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-foreground-muted/50" />
                <div>
                  <div className="text-xs text-foreground-muted">{item.timestampLabel}</div>
                  <div className={`leading-snug ${tone}`}>{item.detail}</div>
                </div>
              </div>
            );
          })}
          {!feedItems.length && (
            <div className="text-xs text-foreground-muted">No activity recorded yet.</div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-background-lighter bg-background-light p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light">Automation Checklist</h3>
            <p className="text-xs text-foreground-muted">
              Everything required to reach “Share” state
            </p>
          </div>
          <TerminalSquare size={18} className="text-primary" />
        </div>

        <ul className="mt-4 space-y-3 text-sm">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              {item.done ? (
                <CheckCircle2 size={18} className="mt-1 flex-shrink-0 text-success" />
              ) : (
                <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-background-lighter text-[10px] text-foreground-muted">
                  •
                </span>
              )}
              <span className={item.done ? 'text-foreground' : 'text-foreground-muted'}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

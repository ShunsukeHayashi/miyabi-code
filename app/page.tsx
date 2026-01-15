'use client';

import { useMemo, useState, type ReactElement } from 'react';

import { AlertsPanel } from '@/components/AlertsPanel';
import AgentBoard from '@/components/AgentBoard';
import { ReferenceHub } from '@/components/ReferenceHub';
import { Timeline } from '@/components/Timeline';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardStatsSection } from '@/components/DashboardStats';
import { ActiveIssuesSection } from '@/components/ActiveIssues';
import { TMAXLViewSection } from '@/components/TMAXLViewSection';
import {
  mockAgents,
  mockTmuxSession,
  mockIssues,
  type Agent,
  type AgentStatus,
  type TmuxPane,
  type TmuxSession,
  type IssueSummary,
} from '@/components/dashboardData';
import { useErrorHandler } from '@/components/errors/ErrorHandler';

export default function Dashboard(): ReactElement {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [tmuxSession, setTmuxSession] = useState<TmuxSession>(mockTmuxSession);
  const [selectedPaneId, setSelectedPaneId] = useState<string | undefined>(
    mockTmuxSession.windows[0]?.panes[0]?.id,
  );
  const [issues] = useState<IssueSummary[]>(mockIssues);

  const { handleUserActionError } = useErrorHandler({
    feature: 'dashboard',
    userId: 'dashboard-user',
  });

  const agentMap = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  const handleAgentStatusChange = (agentId: string, status: AgentStatus): void => {
    try {
      const timestamp = new Date().toISOString();

      setAgents((previous) =>
        previous.map((agent) =>
          agent.id === agentId
            ? {
              ...agent,
              status,
              lastUpdated: timestamp,
            }
            : agent,
        ),
      );
    } catch (error) {
      handleUserActionError('agent_status_change', error as Error, { agentId, targetStatus: status });
    }
  };

  const appendPaneLog = (session: TmuxSession, paneId: string, message: string): TmuxSession => {
    const timestamp = new Date().toISOString();

    return {
      ...session,
      windows: session.windows.map((window) => ({
        ...window,
        panes: window.panes.map((pane) =>
          pane.id === paneId
            ? {
              ...pane,
              lastCommand: message.startsWith('>') ? message.slice(2) : message,
              recentLogs: [
                { id: `log-${paneId}-${timestamp}`, message, timestamp, type: 'info' },
                ...pane.recentLogs,
              ].slice(0, 10),
            }
            : pane,
        ),
      })),
    };
  };

  const handlePaneSelect = (pane: TmuxPane): void => {
    setSelectedPaneId(pane.id);
  };

  const handleCommandSend = (pane: TmuxPane, command: string): void => {
    const trimmed = command.trim();

    if (!trimmed) {
      return;
    }

    setTmuxSession((previous) => appendPaneLog(previous, pane.id, `> ${trimmed}`));

    const timestamp = new Date().toISOString();

    setAgents((previous) =>
      previous.map((agent) =>
        agent.id === pane.agentId
          ? {
            ...agent,
            status: 'working',
            lastUpdated: timestamp,
            currentTask: agent.currentTask
              ? { ...agent.currentTask, progress: Math.min(100, agent.currentTask.progress + 5) }
              : agent.currentTask,
          }
          : agent,
      ),
    );
  };

  const handleRefresh = (): void => {
    const timestamp = new Date().toISOString();
    const targetPaneId = selectedPaneId ?? tmuxSession.windows[0]?.panes[0]?.id;

    if (!targetPaneId) {
      return;
    }

    setTmuxSession((previous) => appendPaneLog(previous, targetPaneId, `Manual refresh triggered at ${timestamp}`));
  };

  const resolvePaneLabel = (pane: TmuxPane): string => agentMap.get(pane.agentId)?.displayName ?? pane.title;

  return (
    <div className="min-h-screen p-8 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-12">
        <DashboardHeader
          description="自律エージェントオーケストレーションのためのリアルタイムコントロールパネル。"
          issueNumber="#1299"
          title="Miyabi Mission Control"
        />

        <DashboardStatsSection agents={agents} />

        <AgentBoard
          agents={agents}
          onAgentFocus={(agent) => {
            const pane = tmuxSession.windows
              .flatMap((window) => window.panes)
              .find((candidate) => candidate.agentId === agent.id);
            if (pane) {
              setSelectedPaneId(pane.id);
            }
          }}
          onStatusChange={handleAgentStatusChange}
        />

        <TMAXLViewSection
          handleCommandSend={handleCommandSend}
          handlePaneSelect={handlePaneSelect}
          handleRefresh={handleRefresh}
          resolvePaneLabel={resolvePaneLabel}
          selectedPaneId={selectedPaneId}
          tmuxSession={tmuxSession}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Timeline />
          </div>
          <div>
            <AlertsPanel />
          </div>
        </div>

        <ReferenceHub />

        <ActiveIssuesSection issues={issues} />
      </div>
    </div>
  );
}

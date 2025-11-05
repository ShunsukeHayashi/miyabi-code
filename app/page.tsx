'use client'

import { useMemo, useState } from 'react'

import { AlertsPanel } from '@/components/AlertsPanel'
import AgentBoard from '@/components/AgentBoard'
import { ReferenceHub } from '@/components/ReferenceHub'
import TMAXLView from '@/components/TMAXLView'
import { Timeline } from '@/components/Timeline'
import type { Agent, AgentStatus, TmuxPane, TmuxSession } from '@/components/dashboardData'
import { mockAgents, mockTmuxSession, mockIssues, IssueSummary } from '@/components/dashboardData'

interface DashboardStats {
  totalAgents: number
  workingAgents: number
  activeAgents: number
  idleAgents: number
  avgUtilization: number
}

const computeStats = (agents: Agent[]): DashboardStats => {
  const totalAgents = agents.length
  const workingAgents = agents.filter((agent) => agent.status === 'working').length
  const activeAgents = agents.filter((agent) => agent.status === 'active').length
  const idleAgents = agents.filter((agent) => agent.status === 'idle').length
  const avgUtilization = totalAgents
    ? Math.round((agents.reduce((sum, agent) => sum + agent.utilization, 0) / totalAgents) * 100)
    : 0

  return { totalAgents, workingAgents, activeAgents, idleAgents, avgUtilization }
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [tmuxSession, setTmuxSession] = useState<TmuxSession>(mockTmuxSession)
  const [selectedPaneId, setSelectedPaneId] = useState<string | undefined>(
    mockTmuxSession.windows[0]?.panes[0]?.id,
  )
  const [issues] = useState<IssueSummary[]>(mockIssues)

  const agentMap = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents])
  const stats = useMemo(() => computeStats(agents), [agents])

  const handleAgentStatusChange = (agentId: string, status: AgentStatus) => {
    const timestamp = new Date().toISOString()

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
    )
  }

  const appendPaneLog = (session: TmuxSession, paneId: string, message: string): TmuxSession => {
    const timestamp = new Date().toISOString()

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
    }
  }

  const handlePaneSelect = (pane: TmuxPane) => {
    setSelectedPaneId(pane.id)
  }

  const handleCommandSend = (pane: TmuxPane, command: string) => {
    const trimmed = command.trim()

    if (!trimmed) return

    setTmuxSession((previous) => appendPaneLog(previous, pane.id, `> ${trimmed}`))

    const timestamp = new Date().toISOString()

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
    )
  }

  const handleRefresh = () => {
    const timestamp = new Date().toISOString()
    const targetPaneId = selectedPaneId ?? tmuxSession.windows[0]?.panes[0]?.id

    if (!targetPaneId) return

    setTmuxSession((previous) =>
      appendPaneLog(previous, targetPaneId, `Manual refresh triggered at ${timestamp}`),
    )
  }

  const resolvePaneLabel = (pane: TmuxPane) => agentMap.get(pane.agentId)?.displayName ?? pane.title

  return (
    <div className="min-h-screen p-8 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="space-y-3">
          <p className="text-sm text-gray-500 font-mono">Issue #758 · Mission Control Dashboard</p>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-miyabi-blue to-miyabi-purple bg-clip-text text-transparent">
            Miyabi Mission Control
          </h1>
          <p className="text-gray-400 text-lg">
            自律エージェントオーケストレーションのためのリアルタイムコントロールパネル。
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatCard label="Total Agents" value={stats.totalAgents} accent="text-white" />
          <StatCard label="Working" value={stats.workingAgents} accent="text-miyabi-purple" />
          <StatCard label="Active" value={stats.activeAgents} accent="text-miyabi-blue" />
          <StatCard label="Idle" value={stats.idleAgents} accent="text-gray-400" />
          <StatCard label="Average Utilization" value={`${stats.avgUtilization}%`} accent="text-miyabi-green" />
        </section>

        <AgentBoard
          agents={agents}
          onStatusChange={handleAgentStatusChange}
          onAgentFocus={(agent) => {
            const pane = tmuxSession.windows
              .flatMap((window) => window.panes)
              .find((candidate) => candidate.agentId === agent.id)
            if (pane) {
              setSelectedPaneId(pane.id)
            }
          }}
        />

        <TMAXLView
          session={{
            ...tmuxSession,
            windows: tmuxSession.windows.map((window) => ({
              ...window,
              panes: window.panes.map((pane) => ({
                ...pane,
                title: resolvePaneLabel(pane),
              })),
            })),
          }}
          selectedPaneId={selectedPaneId}
          onPaneSelect={handlePaneSelect}
          onSendCommand={handleCommandSend}
          onRefresh={handleRefresh}
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

        <section className="space-y-4">
          <header>
            <h2 className="text-3xl font-bold text-white">Active Issues</h2>
            <p className="text-sm text-gray-400">Key threads monitored alongside Mission Control.</p>
          </header>
          <div className="space-y-3">
            {issues.map((issue) => (
              <IssueCard key={issue.number} issue={issue} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  accent: string
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-3 ${accent}`}>{value}</p>
    </div>
  )
}

function IssueCard({ issue }: { issue: IssueSummary }) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-mono text-sm">#{issue.number}</span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-miyabi-green/20 text-miyabi-green">
              {issue.state}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
          <div className="flex flex-wrap gap-2">
            {issue.labels.map((label) => (
              <span key={label} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                {label}
              </span>
            ))}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}

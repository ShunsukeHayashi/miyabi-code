import { useEffect, useState } from 'react';
import { safeInvoke, isTauriAvailable } from '../lib/tauri-utils';
import { listGwrWorktrees, getGwrStatus, GwrWorktree } from '../lib/tauri-api';
import { listGwrWorktrees, getGwrStatus, GwrWorktree } from '../lib/tauri-api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { PlayCircle, StopCircle, RefreshCw, Terminal as TerminalIcon } from 'lucide-react';

interface AgentConfig {
  agent: string;
  session_name: string;
  description: string;
  command: string;
}

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: number;
  untracked: number;
  staged: number;
}

interface TmuxSession {
  session_name: string;
  agent_name: string;
  status: SessionStatus;
  command: string;
  git_status?: GitStatus;
}

// Rust serde format: { type: "Running" } or { type: "Error", message: "..." }
type SessionStatus = { type: 'Running' } | { type: 'Stopped' } | { type: 'Error', message: string };

interface AgentsConfig {
  coding_agents: AgentConfig[];
}

function getAgentSuffix(agentName: string): string {
  return agentName
    .toLowerCase()
    .replace(/agent/gi, '')
    .replace(/mode/gi, '')
    .trim();
}

function buildIssueSessionName(agentName: string, issueNumber: number, fallback: string): string {
  const suffix = getAgentSuffix(agentName);
  return suffix ? `issue-${issueNumber}-${suffix}` : fallback;
}

export function TmuxManager() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [sessions, setSessions] = useState<TmuxSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [issueNumberDialog, setIssueNumberDialog] = useState<{
    open: boolean;
    agentName: string;
    issueNumber: string;
  }>({ open: false, agentName: '', issueNumber: '' });
  const [runtimeReady, setRuntimeReady] = useState(() => isTauriAvailable());
  const [gwrWorktrees, setGwrWorktrees] = useState<GwrWorktree[]>([]);
  const [gwrStatus, setGwrStatus] = useState('');
  const [gwrLoading, setGwrLoading] = useState(false);
  const [gwrError, setGwrError] = useState<string | null>(null);
  const [gwrWorktrees, setGwrWorktrees] = useState<GwrWorktree[]>([]);
  const [gwrStatus, setGwrStatus] = useState('');
  const [gwrLoading, setGwrLoading] = useState(false);
  const [gwrError, setGwrError] = useState<string | null>(null);

  useEffect(() => {
    const available = isTauriAvailable();
    setRuntimeReady(available);

    if (!available) {
      setError('Tmux Agent Manager requires the Tauri desktop runtime. Launch the app with `npm run tauri dev`.');
      setAgents([]);
      setSessions([]);
      return;
    }

    void loadConfig();
    void refreshSessions();
    void loadGwrData();
  }, []);

  // Poll for session outputs every 2 seconds
  useEffect(() => {
    if (!runtimeReady) {
      return undefined;
    }

    const interval = setInterval(async () => {
      for (const session of sessions) {
        if (session.status?.type === 'Running') {
          await fetchSessionOutput(session.session_name);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessions, runtimeReady]);

  useEffect(() => {
    if (runtimeReady) {
      void loadGwrData();
    }
  }, [runtimeReady]);

  function ensureRuntime(message?: string): boolean {
    if (!runtimeReady) {
      setError(
        message ||
          'Tmux Agent Manager is only available when the desktop runtime is running. Use `npm run tauri dev` to launch it.'
      );
      return false;
    }
    return true;
  }

  async function loadConfig() {
    if (!ensureRuntime()) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const config = await safeInvoke<AgentsConfig>('tmux_load_config');
      if (config) {
        setAgents(config.coding_agents);
      } else {
        setAgents([]);
        setError('Tmux Agent Manager is available only inside the desktop runtime. Run `npm run tauri dev` and retry.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('.miyabi/agents.yaml')) {
        setError('Could not find `.miyabi/agents.yaml`. Ensure the desktop project includes the agents configuration file.');
      } else {
        setError(message);
      }
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshSessions() {
    if (!ensureRuntime()) {
      return;
    }
    try {
      console.log('[TmuxManager] Calling tmux_list_sessions...');
      const sessions = await safeInvoke<TmuxSession[]>('tmux_list_sessions');
      console.log('[TmuxManager] Raw sessions data:', JSON.stringify(sessions, null, 2));
      console.log('[TmuxManager] Sessions count:', sessions?.length || 0);

      if (sessions && sessions.length > 0) {
        sessions.forEach(s => {
          console.log(`[TmuxManager] Session: ${s.session_name}, Status type:`, typeof s.status, s.status);
        });
      }

      if (sessions) {
        setSessions(sessions);
      } else {
        setSessions([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('[TmuxManager] Failed to refresh sessions:', err);
    }
  }

  async function loadGwrData() {
    if (!ensureRuntime()) {
      return;
    }
    try {
      setGwrLoading(true);
      setGwrError(null);
      const [worktrees, status] = await Promise.all([
        listGwrWorktrees(),
        getGwrStatus()
      ]);
      setGwrWorktrees(worktrees);
      setGwrStatus(status);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGwrError(message);
      console.error('[TmuxManager] Failed to load GWR data:', err);
    } finally {
      setGwrLoading(false);
    }
  }

  async function startAgent(agentName: string) {
    // Check if this agent requires an issue number
    const requiresIssueNumber = [
      'CoordinatorAgent',
      'CodeGenAgent',
      'ReviewAgent',
      'PRAgent',
      'DeploymentAgent',
      'IssueAgent'
    ].includes(agentName);

    if (requiresIssueNumber) {
      // Show issue number dialog
      setIssueNumberDialog({
        open: true,
        agentName,
        issueNumber: ''
      });
    } else {
      // Start without issue number
      await startAgentWithIssueNumber(agentName, null);
    }
  }

  async function startAgentWithIssueNumber(agentName: string, issueNumber: number | null) {
    if (!ensureRuntime()) {
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Find the agent config to get session name
      const agent = agents.find(a => a.agent === agentName);

      const startedSession = await safeInvoke<string>('tmux_start_agent', {
        agentName,
        issueNumber
      });
      if (startedSession === null) {
        setError('Failed to start agent because the desktop backend is not available. Launch via `npm run tauri dev`.');
        return;
      }
      await refreshSessions();

      // Fetch output immediately after starting
      if (agent) {
        const fallbackSessionName = issueNumber !== null
          ? buildIssueSessionName(agent.agent, issueNumber, agent.session_name)
          : agent.session_name;

        const sessionNameToFetch =
          typeof startedSession === 'string' && startedSession.length > 0
            ? startedSession
            : fallbackSessionName;

        if (sessionNameToFetch) {
          setTimeout(() => fetchSessionOutput(sessionNameToFetch), 1000);
        }
      }
    } catch (err) {
      setError(String(err));
      console.error('Failed to start agent:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleIssueNumberSubmit() {
    const issueNum = parseInt(issueNumberDialog.issueNumber);
    if (isNaN(issueNum) || issueNum <= 0) {
      setError('Please enter a valid issue number');
      return;
    }

    setIssueNumberDialog({ open: false, agentName: '', issueNumber: '' });
    startAgentWithIssueNumber(issueNumberDialog.agentName, issueNum);
  }

  async function stopSession(sessionName: string) {
    if (!ensureRuntime()) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await safeInvoke('tmux_kill_session', { sessionName });
      if (result === null) {
        setError('Unable to reach the desktop backend. Please relaunch the app with Tauri.');
        return;
      }
      await refreshSessions();
      // Clear output when session stops
      setOutputs(prev => {
        const next = { ...prev };
        delete next[sessionName];
        return next;
      });
    } catch (err) {
      setError(String(err));
      console.error('Failed to stop session:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSessionOutput(sessionName: string) {
    if (!runtimeReady) {
      return;
    }
    try {
      console.log(`[TmuxManager] Fetching output for session: ${sessionName}`);
      const output = await safeInvoke<string>('tmux_get_session_output', {
        sessionName,
        lines: 100
      });
      if (output === null) {
        return;
      }
      console.log(`[TmuxManager] Output received:`, output ? `${output.length} chars` : 'null');
      if (output) {
        setOutputs(prev => ({
          ...prev,
          [sessionName]: output
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch output for ${sessionName}:`, err);
    }
  }

  function getAgentSessions(agent: AgentConfig): TmuxSession[] {
    const suffix = getAgentSuffix(agent.agent);
    const issuePattern = suffix ? new RegExp(`^issue-\\d+-${suffix}$`) : null;

    return sessions.filter((session) => {
      if (session.session_name === agent.session_name) {
        return true;
      }
      return issuePattern ? issuePattern.test(session.session_name) : false;
    });
  }

  function renderStatusBadge(status: SessionStatus | null) {
    if (!status) {
      return <Badge variant="secondary">Stopped</Badge>;
    }

    if (status.type === 'Running') {
      return (
        <Badge variant="default" className="bg-green-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Running
          </div>
        </Badge>
      );
    }

    if (status.type === 'Stopped') {
      return <Badge variant="secondary">Stopped</Badge>;
    }

    // Error status
    if (status.type === 'Error') {
      return <Badge variant="destructive">Error</Badge>;
    }

    return <Badge variant="outline">Unknown</Badge>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tmux Agent Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage external coding agents via tmux sessions
          </p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            if (!ensureRuntime()) {
              return;
            }
            void loadConfig();
            void refreshSessions();
          }}
          variant="outline"
          size="sm"
          disabled={loading}
        >
      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  </div>

      {/* Runtime availability notice */}
      {!runtimeReady && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-md">
          <p className="font-semibold">Desktop runtime not detected</p>
          <p className="text-sm mt-1">
            Launch Miyabi Desktop via <code className="bg-yellow-100 px-1 py-0.5 rounded">npm run tauri dev</code> to manage agents and tmux sessions.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const agentSessions = getAgentSessions(agent);
          const runningSession = agentSessions.find(s => s.status?.type === 'Running') || null;
          const primarySession = runningSession || agentSessions[0] || null;
          const displaySessionName = primarySession?.session_name || agent.session_name;
          const status = primarySession?.status || null;
          const running = Boolean(runningSession);

          console.log(
            `[TmuxManager] Agent ${agent.agent}: running=${running}, displaySession=${displaySessionName}, status=`,
            status
          );

          return (
            <Card key={agent.agent} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <TerminalIcon className="w-5 h-5" />
                      {agent.agent}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {agent.description}
                    </CardDescription>
                  </div>
                  <div className="ml-2">
                    {renderStatusBadge(status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Session Name */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Session:</span> {displaySessionName}
                  </div>

                  {/* Git Status */}
                  {running && runningSession?.git_status && (
                    <div className="flex flex-wrap gap-1 text-xs">
                      {(() => {
                        const gitStatus = runningSession?.git_status;
                        if (!gitStatus) return null;
                        return (
                          <>
                            <Badge variant="outline" className="gap-1">
                              <span className="text-xs">🌿</span>
                              {gitStatus.branch}
                            </Badge>
                            {gitStatus.modified > 0 && (
                              <Badge variant="outline" className="gap-1 text-orange-600">
                                <span>📝</span>
                                {gitStatus.modified}
                              </Badge>
                            )}
                            {gitStatus.untracked > 0 && (
                              <Badge variant="outline" className="gap-1 text-gray-600">
                                <span>➕</span>
                                {gitStatus.untracked}
                              </Badge>
                            )}
                            {gitStatus.staged > 0 && (
                              <Badge variant="outline" className="gap-1 text-green-600">
                                <span>✓</span>
                                {gitStatus.staged}
                              </Badge>
                            )}
                            {gitStatus.ahead > 0 && (
                              <Badge variant="outline" className="gap-1 text-blue-600">
                                <span>⬆️</span>
                                {gitStatus.ahead}
                              </Badge>
                            )}
                            {gitStatus.behind > 0 && (
                              <Badge variant="outline" className="gap-1 text-red-600">
                                <span>⬇️</span>
                                {gitStatus.behind}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex gap-2">
                    {!running ? (
                      <Button
                        onClick={() => startAgent(agent.agent)}
                        disabled={loading}
                        className="flex-1"
                        size="sm"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (runningSession) {
                            void stopSession(runningSession.session_name);
                          }
                        }}
                        disabled={loading}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Terminal Output - Always shown when running */}
                  {running && (
                    <div className="mt-3 border rounded-md bg-gray-900 text-green-400 p-3 max-h-80 overflow-y-auto font-mono text-xs shadow-inner">
                      {outputs[displaySessionName] ? (
                        <pre className="whitespace-pre-wrap leading-relaxed">{outputs[displaySessionName]}</pre>
                      ) : (
                        <div className="text-gray-500 italic flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Waiting for output...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message (if any) */}
                  {status && status.type === 'Error' && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {status.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {agents.length === 0 && !loading && (
        <div className="text-center py-12">
          <TerminalIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">No agents configured</p>
          <p className="text-muted-foreground mt-1">
            Add agents to <code>.miyabi/agents.yaml</code> to get started
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && agents.length === 0 && (
        <div className="text-center py-12">
      <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground animate-spin mb-4" />
      <p className="text-lg font-semibold">Loading agents...</p>
    </div>
  )}

      <Card className="border-purple-200/70 bg-purple-50/40">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle>GWR Orchestrator Overview</CardTitle>
            <CardDescription>
              Live Git worktree data via <code className="bg-purple-100 px-1 py-0.5 rounded">@humanu/orchestra</code>.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGwrError(null);
              void loadGwrData();
            }}
            disabled={gwrLoading || !runtimeReady}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${gwrLoading ? 'animate-spin' : ''}`} />
            Refresh GWR
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {gwrLoading && (
            <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Updating orchestration data...
            </div>
          )}

          {gwrError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {gwrError}
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-900/80 mb-2">
              Worktrees detected
            </h3>
            <div className="overflow-hidden rounded-md border border-purple-100 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-purple-100/70 text-purple-900 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Branch</th>
                    <th className="px-3 py-2 text-left font-semibold">Head</th>
                    <th className="px-3 py-2 text-left font-semibold">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {gwrWorktrees.map((tree) => (
                    <tr
                      key={`${tree.branch}-${tree.path}`}
                      className={tree.active ? 'bg-purple-50/60' : 'bg-white'}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {tree.active && (
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" />
                          )}
                          <span className="font-medium">{tree.branch}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">{tree.head}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{tree.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gwrWorktrees.length === 0 && !gwrLoading && (
                <div className="px-3 py-4 text-sm text-muted-foreground">
                  No worktrees returned by gwr. Create a worktree to populate this view.
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-900/80 mb-2">
              Current worktree status
            </h3>
            <pre className="bg-gray-950/95 text-gray-100 text-xs rounded-lg p-4 max-h-52 overflow-auto font-mono leading-relaxed">
              {gwrStatus ? gwrStatus : 'No status output available.'}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              Run <code className="bg-gray-900 text-white px-1 py-0.5 rounded">gwr</code> inside the desktop terminal to open the full TUI experience.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Issue Number Dialog */}
      {issueNumberDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Enter Issue Number</CardTitle>
              <CardDescription>
                Starting {issueNumberDialog.agentName} for a specific GitHub Issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Issue Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., 214"
                    value={issueNumberDialog.issueNumber}
                    onChange={(e) =>
                      setIssueNumberDialog({
                        ...issueNumberDialog,
                        issueNumber: e.target.value
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleIssueNumberSubmit();
                      } else if (e.key === 'Escape') {
                        setIssueNumberDialog({ open: false, agentName: '', issueNumber: '' });
                      }
                    }}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const suffix = getAgentSuffix(issueNumberDialog.agentName) || 'session';
                      return `Session will be named: issue-${issueNumberDialog.issueNumber || 'XXX'}-${suffix}`;
                    })()}
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setIssueNumberDialog({ open: false, agentName: '', issueNumber: '' })
                    }
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleIssueNumberSubmit}>
                    Start Agent
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

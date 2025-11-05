import { safeInvoke, safeListen } from './tauri-utils';

export interface TerminalSession {
  id: string;
  cols: number;
  rows: number;
  cwd: string;
  shell: string;
  created_at: number;
  managed_by?: string; // "user" or "orchestrator:{agent_id}"
}

export interface SessionInfo {
  session: TerminalSession;
  is_alive: boolean;
}

export async function spawnTerminal(cols: number, rows: number): Promise<TerminalSession | null> {
  return await safeInvoke<TerminalSession>('spawn_terminal', { cols, rows });
}

export async function writeToTerminal(sessionId: string, data: string): Promise<void> {
  await safeInvoke<void>('write_to_terminal', { sessionId, data });
}

export async function resizeTerminal(sessionId: string, cols: number, rows: number): Promise<void> {
  await safeInvoke<void>('resize_terminal', { sessionId, cols, rows });
}

export async function killTerminal(sessionId: string): Promise<void> {
  await safeInvoke<void>('kill_terminal', { sessionId });
}

export async function listenToTerminalOutput(sessionId: string, callback: (data: string) => void) {
  return await safeListen<string>(`terminal-output-${sessionId}`, callback);
}

// ========== Orchestrator Management APIs ==========

export async function spawnTerminalManaged(
  cols: number,
  rows: number,
  managedBy: string
): Promise<TerminalSession | null> {
  return await safeInvoke<TerminalSession>('spawn_terminal_managed', { cols, rows, managedBy });
}

export async function listTerminalSessions(): Promise<TerminalSession[]> {
  const result = await safeInvoke<TerminalSession[]>('list_terminal_sessions');
  return result || [];
}

export async function getTerminalSessionInfo(sessionId: string): Promise<SessionInfo | null> {
  return await safeInvoke<SessionInfo>('get_terminal_session_info', { sessionId });
}

export async function executeTerminalCommand(sessionId: string, command: string): Promise<void> {
  await safeInvoke<void>('execute_terminal_command', { sessionId, command });
}

export async function listSessionsByManager(managerId: string): Promise<TerminalSession[]> {
  const result = await safeInvoke<TerminalSession[]>('list_sessions_by_manager', { managerId });
  return result || [];
}

export async function killSessionsByManager(managerId: string): Promise<number> {
  const result = await safeInvoke<number>('kill_sessions_by_manager', { managerId });
  return result || 0;
}

// ========== GWR (@humanu/orchestra) APIs ==========

export interface GwrWorktree {
  branch: string;
  head: string;
  path: string;
  active: boolean;
}

export async function listGwrWorktrees(): Promise<GwrWorktree[]> {
  const result = await safeInvoke<GwrWorktree[]>('list_worktrees');
  return result || [];
}

/**
 * Get worktree graph with all branches and worktrees
 * Note: This replaces the old gwr_status command
 */
export async function getWorktreeGraph() {
  return await safeInvoke('worktrees:graph');
}

/**
 * Get status for a specific worktree
 */
export async function getWorktreeStatus(worktreeId: string): Promise<GwrWorktree | null> {
  return await safeInvoke<GwrWorktree>('get_worktree_status', { worktreeId });
}

/**
 * Legacy function - returns empty string for backward compatibility
 * @deprecated Use getWorktreeGraph() instead
 */
export async function getGwrStatus(): Promise<string> {
  // Return empty string for backward compatibility
  // Frontend should use listGwrWorktrees() instead
  return '';
}

// ========== Window and Pane Monitoring/Control APIs ==========

export interface TmuxWindowInfo {
  sessionName: string;
  index: number;
  name: string;
  active: boolean;
  paneCount: number;
}

export interface TmuxPaneInfo {
  sessionName: string;
  windowIndex: number;
  paneIndex: number;
  paneId: string;
  active: boolean;
  width: number;
  height: number;
  currentPath: string;
  currentCommand: string;
}

export interface TmuxGitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: number;
  untracked: number;
  staged: number;
}

export type TmuxSessionStatus =
  | { type: 'Running' }
  | { type: 'Stopped' }
  | { type: 'Error'; message: string };

export interface TmuxSessionSummary {
  sessionName: string;
  agentName: string;
  status: TmuxSessionStatus;
  command: string;
  gitStatus?: TmuxGitStatus;
}

interface RawTmuxSession {
  session_name: string;
  agent_name: string;
  status: TmuxSessionStatus;
  command: string;
  git_status?: TmuxGitStatus;
}

/**
 * List all windows in a tmux session
 */
export async function listSessionWindows(sessionName: string): Promise<TmuxWindowInfo[]> {
  const result = await safeInvoke<TmuxWindowInfo[]>('list_session_windows', { sessionName });
  return result || [];
}

/**
 * List all panes in a tmux window
 */
export async function listWindowPanes(sessionName: string, windowIndex: number): Promise<TmuxPaneInfo[]> {
  const result = await safeInvoke<TmuxPaneInfo[]>('list_window_panes', { sessionName, windowIndex });
  return result || [];
}

/**
 * Send command to a specific pane
 */
export async function sendToPane(
  sessionName: string,
  windowIndex: number,
  paneIndex: number,
  paneId: string | undefined,
  command: string
): Promise<void> {
  const payload: Record<string, unknown> = {
    sessionName,
    windowIndex,
    paneIndex,
    command,
  };
  if (paneId) {
    payload.paneId = paneId;
  }
  await safeInvoke<void>('send_to_pane', payload);
}

/**
 * Get content from a specific pane
 */
export async function getPaneContent(
  sessionName: string,
  windowIndex: number,
  paneIndex: number,
  paneId: string | undefined,
  lines?: number
): Promise<string | null> {
  const payload: Record<string, unknown> = {
    sessionName,
    windowIndex,
    paneIndex,
  };
  if (paneId) {
    payload.paneId = paneId;
  }
  if (typeof lines === 'number') {
    payload.lines = lines;
  }
  return await safeInvoke<string>('get_pane_content', payload);
}

/**
 * Focus on a specific window
 */
export async function focusWindow(sessionName: string, windowIndex: number): Promise<void> {
  await safeInvoke<void>('focus_window', { sessionName, windowIndex });
}

/**
 * Focus on a specific pane
 */
export async function focusPane(
  sessionName: string,
  windowIndex: number,
  paneIndex: number,
  paneId: string | undefined
): Promise<void> {
  const payload: Record<string, unknown> = {
    sessionName,
    windowIndex,
    paneIndex,
  };
  if (paneId) {
    payload.paneId = paneId;
  }
  await safeInvoke<void>('focus_pane', payload);
}

/**
 * List active tmux sessions managed by Miyabi Desktop
 */
export async function listTmuxSessions(): Promise<TmuxSessionSummary[]> {
  const rawSessions = await safeInvoke<RawTmuxSession[]>('tmux_list_sessions');
  if (!rawSessions) {
    return [];
  }

  return rawSessions.map((session) => ({
    sessionName: session.session_name,
    agentName: session.agent_name,
    status: session.status,
    command: session.command,
    gitStatus: session.git_status,
  }));
}

export async function checkTmuxSessionExists(sessionName: string): Promise<boolean> {
  try {
    const result = await safeInvoke<boolean>(
      'tmux_check_session_exists',
      { sessionName },
      { suppressErrors: true }
    );
    return Boolean(result);
  } catch {
    return false;
  }
}

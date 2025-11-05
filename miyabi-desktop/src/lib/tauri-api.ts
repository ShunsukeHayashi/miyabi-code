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
  const result = await safeInvoke<GwrWorktree[]>('gwr_list_worktrees');
  return result || [];
}

export async function getGwrStatus(): Promise<string> {
  const result = await safeInvoke<string>('gwr_status');
  return result || '';
}

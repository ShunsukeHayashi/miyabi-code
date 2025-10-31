import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

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

export async function spawnTerminal(cols: number, rows: number): Promise<TerminalSession> {
  return await invoke('spawn_terminal', { cols, rows });
}

export async function writeToTerminal(sessionId: string, data: string): Promise<void> {
  await invoke('write_to_terminal', { sessionId, data });
}

export async function resizeTerminal(sessionId: string, cols: number, rows: number): Promise<void> {
  await invoke('resize_terminal', { sessionId, cols, rows });
}

export async function killTerminal(sessionId: string): Promise<void> {
  await invoke('kill_terminal', { sessionId });
}

export async function listenToTerminalOutput(sessionId: string, callback: (data: string) => void) {
  return await listen<string>(`terminal-output-${sessionId}`, (event) => {
    callback(event.payload);
  });
}

// ========== Orchestrator Management APIs ==========

export async function spawnTerminalManaged(
  cols: number,
  rows: number,
  managedBy: string
): Promise<TerminalSession> {
  return await invoke('spawn_terminal_managed', { cols, rows, managedBy });
}

export async function listTerminalSessions(): Promise<TerminalSession[]> {
  return await invoke('list_terminal_sessions');
}

export async function getTerminalSessionInfo(sessionId: string): Promise<SessionInfo> {
  return await invoke('get_terminal_session_info', { sessionId });
}

export async function executeTerminalCommand(sessionId: string, command: string): Promise<void> {
  await invoke('execute_terminal_command', { sessionId, command });
}

export async function listSessionsByManager(managerId: string): Promise<TerminalSession[]> {
  return await invoke('list_sessions_by_manager', { managerId });
}

export async function killSessionsByManager(managerId: string): Promise<number> {
  return await invoke('kill_sessions_by_manager', { managerId });
}

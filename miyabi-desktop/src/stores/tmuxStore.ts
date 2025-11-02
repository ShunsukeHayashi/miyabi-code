import { create } from 'zustand';
import { safeInvoke } from '../lib/tauri-utils';

interface AgentConfig {
  agent: string;
  session_name: string;
  description: string;
  command: string;
}

interface TmuxSession {
  session_name: string;
  agent_name: string;
  status: SessionStatus;
  command: string;
}

type SessionStatus = 'Running' | 'Stopped' | { Error: string };

interface AgentsConfig {
  coding_agents: AgentConfig[];
}

interface TmuxStore {
  // State
  agents: AgentConfig[];
  sessions: TmuxSession[];
  loading: boolean;
  error: string | null;

  // Actions
  loadConfig: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  startAgent: (agentName: string) => Promise<void>;
  killSession: (sessionName: string) => Promise<void>;
  getSessionOutput: (sessionName: string, lines?: number) => Promise<string>;
  clearError: () => void;
}

export const useTmuxStore = create<TmuxStore>((set, get) => ({
  // Initial state
  agents: [],
  sessions: [],
  loading: false,
  error: null,

  // Load agent configuration from YAML
  loadConfig: async () => {
    set({ loading: true, error: null });
    try {
      const config = await safeInvoke<AgentsConfig>('tmux_load_config');
      if (config) {
        set({ agents: config.coding_agents, loading: false });
      } else {
        set({ agents: [], loading: false, error: 'Tauri runtime not available' });
      }
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  // Refresh list of active tmux sessions
  refreshSessions: async () => {
    set({ error: null });
    try {
      const sessions = await safeInvoke<TmuxSession[]>('tmux_list_sessions');
      set({ sessions: sessions || [] });
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
      // Don't set error for refresh failures - they're non-critical
    }
  },

  // Start an agent by creating a new tmux session
  startAgent: async (agentName: string) => {
    set({ loading: true, error: null });
    try {
      const result = await safeInvoke('tmux_start_agent', { agentName });
      if (result === null) {
        set({ error: 'Tauri runtime not available', loading: false });
        return;
      }
      // Refresh sessions to reflect the new session
      await get().refreshSessions();
      set({ loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  // Kill (terminate) a tmux session
  killSession: async (sessionName: string) => {
    set({ loading: true, error: null });
    try {
      const result = await safeInvoke('tmux_kill_session', { sessionName });
      if (result === null) {
        set({ error: 'Tauri runtime not available', loading: false });
        return;
      }
      // Refresh sessions to reflect the terminated session
      await get().refreshSessions();
      set({ loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  // Get session output (last N lines)
  getSessionOutput: async (sessionName: string, lines = 50) => {
    try {
      const output = await safeInvoke<string>('tmux_get_session_output', {
        sessionName,
        lines,
      });
      return output || '';
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  // Clear error message
  clearError: () => set({ error: null }),
}));

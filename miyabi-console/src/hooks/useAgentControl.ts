import { apiClient } from '@/lib/api/client';
import type { Agent } from '@/types/agent';
import { useCallback, useState } from 'react';

type ControlAction = 'start' | 'stop' | 'pause' | 'resume' | 'restart';

interface UseAgentControlOptions {
  onSuccess?: (action: ControlAction, agentId: string) => void;
  onError?: (action: ControlAction, agentId: string, error: Error) => void;
}

interface UseAgentControlReturn {
  loading: boolean;
  error: string | null;
  currentAction: ControlAction | null;
  startAgent: (agentId: string) => Promise<void>;
  stopAgent: (agentId: string) => Promise<void>;
  pauseAgent: (agentId: string) => Promise<void>;
  resumeAgent: (agentId: string) => Promise<void>;
  restartAgent: (agentId: string) => Promise<void>;
  canPerformAction: (action: ControlAction, agent: Agent) => boolean;
  clearError: () => void;
}

export function useAgentControl(options?: UseAgentControlOptions): UseAgentControlReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<ControlAction | null>(null);

  const executeAction = useCallback(
    async (action: ControlAction, agentId: string) => {
      setLoading(true);
      setError(null);
      setCurrentAction(action);

      try {
        switch (action) {
          case 'start':
            await apiClient.startAgent(agentId);
            break;
          case 'stop':
            await apiClient.stopAgent(agentId);
            break;
          case 'pause':
            await apiClient.pauseAgent(agentId);
            break;
          case 'resume':
            await apiClient.resumeAgent(agentId);
            break;
          case 'restart':
            await apiClient.restartAgent(agentId);
            break;
        }

        options?.onSuccess?.(action, agentId);
      } catch (err: any) {
        const errorMessage = err.message || `Failed to ${action} agent`;
        setError(errorMessage);
        console.error(`Failed to ${action} agent ${agentId}:`, err);
        options?.onError?.(action, agentId, err);
      } finally {
        setLoading(false);
        setCurrentAction(null);
      }
    },
    [options]
  );

  const startAgent = useCallback(
    (agentId: string) => executeAction('start', agentId),
    [executeAction]
  );

  const stopAgent = useCallback(
    (agentId: string) => executeAction('stop', agentId),
    [executeAction]
  );

  const pauseAgent = useCallback(
    (agentId: string) => executeAction('pause', agentId),
    [executeAction]
  );

  const resumeAgent = useCallback(
    (agentId: string) => executeAction('resume', agentId),
    [executeAction]
  );

  const restartAgent = useCallback(
    (agentId: string) => executeAction('restart', agentId),
    [executeAction]
  );

  const canPerformAction = useCallback((action: ControlAction, agent: Agent): boolean => {
    switch (action) {
      case 'start':
        return agent.status === 'idle' || agent.status === 'offline';
      case 'stop':
        return agent.status === 'active';
      case 'pause':
        return agent.status === 'active';
      case 'resume':
        return false; // Paused status not yet supported
      case 'restart':
        return agent.status === 'active' || agent.status === 'idle' || agent.status === 'error';
      default:
        return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    currentAction,
    startAgent,
    stopAgent,
    pauseAgent,
    resumeAgent,
    restartAgent,
    canPerformAction,
    clearError,
  };
}

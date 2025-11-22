import { gradients, heroUIColorMapping } from '@/design-system/colors';
import { apiClient } from '@/lib/api/client';
import type { Agent } from '@/types/agent';
import { Button, Spinner } from '@heroui/react';
import { useState } from 'react';

interface AgentControlPanelProps {
  agent: Agent;
  onActionComplete?: () => void;
}

type ControlAction = 'start' | 'stop' | 'pause' | 'resume' | 'restart';

export default function AgentControlPanel({ agent, onActionComplete }: AgentControlPanelProps) {
  const [loadingAction, setLoadingAction] = useState<ControlAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: ControlAction) => {
    setLoadingAction(action);
    setError(null);

    try {
      switch (action) {
        case 'start':
          await apiClient.startAgent(agent.id);
          break;
        case 'stop':
          await apiClient.stopAgent(agent.id);
          break;
        case 'pause':
          await apiClient.pauseAgent(agent.id);
          break;
        case 'resume':
          await apiClient.resumeAgent(agent.id);
          break;
        case 'restart':
          await apiClient.restartAgent(agent.id);
          break;
      }

      onActionComplete?.();
    } catch (err: any) {
      console.error(`Failed to ${action} agent:`, err);
      setError(err.message || `Failed to ${action} agent`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Determine which buttons should be enabled based on agent status
  const canStart = agent.status === 'idle' || agent.status === 'offline';
  const canStop = agent.status === 'active';
  const canPause = agent.status === 'active';
  const canResume = false; // Paused status not yet supported in backend
  const canRestart = agent.status === 'active' || agent.status === 'idle' || agent.status === 'error';

  return (
    <div className="space-y-3">
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Start Button */}
        <Button
          size="sm"
          color={heroUIColorMapping.success}
          onClick={() => handleAction('start')}
          isDisabled={!canStart || loadingAction !== null}
          className="min-w-[80px]"
        >
          {loadingAction === 'start' ? <Spinner size="sm" color="white" /> : '▶️ Start'}
        </Button>

        {/* Stop Button */}
        <Button
          size="sm"
          color={heroUIColorMapping.error}
          onClick={() => handleAction('stop')}
          isDisabled={!canStop || loadingAction !== null}
          className="min-w-[80px]"
        >
          {loadingAction === 'stop' ? <Spinner size="sm" color="white" /> : '⏹️ Stop'}
        </Button>

        {/* Pause Button */}
        <Button
          size="sm"
          color={heroUIColorMapping.warning}
          onClick={() => handleAction('pause')}
          isDisabled={!canPause || loadingAction !== null}
          className="min-w-[80px]"
        >
          {loadingAction === 'pause' ? <Spinner size="sm" color="white" /> : '⏸️ Pause'}
        </Button>

        {/* Resume Button */}
        <Button
          size="sm"
          color={heroUIColorMapping.info}
          onClick={() => handleAction('resume')}
          isDisabled={!canResume || loadingAction !== null}
          className="min-w-[80px]"
        >
          {loadingAction === 'resume' ? <Spinner size="sm" color="white" /> : '⏯️ Resume'}
        </Button>

        {/* Restart Button */}
        <Button
          size="sm"
          variant="flat"
          onClick={() => handleAction('restart')}
          isDisabled={!canRestart || loadingAction !== null}
          className="min-w-[80px]"
          style={{
            background: loadingAction === 'restart' ? 'transparent' : gradients.purple,
            color: 'white',
          }}
        >
          {loadingAction === 'restart' ? <Spinner size="sm" color="primary" /> : '🔄 Restart'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
          {error}
        </div>
      )}

      {/* Status Help Text */}
      <p className="text-xs text-gray-500">
        Current status: <span className="font-semibold">{agent.status}</span>
      </p>
    </div>
  );
}

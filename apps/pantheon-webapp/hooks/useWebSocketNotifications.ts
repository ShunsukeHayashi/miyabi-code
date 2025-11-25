/**
 * WebSocket Notifications Hook
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 *
 * Connects WebSocket events to toast notifications.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocketEvent } from '../app/contexts/WebSocketContext';
import { useToast } from '../components/ui/Toast';
import { WebSocketEvent, WebSocketEventType } from '../lib/websocket-client';

interface NotificationConfig {
  enabled?: boolean;
  soundEnabled?: boolean;
  showAgentExecutionStarted?: boolean;
  showAgentExecutionCompleted?: boolean;
  showAgentExecutionFailed?: boolean;
  showTaskStatusChanged?: boolean;
}

const defaultConfig: NotificationConfig = {
  enabled: true,
  soundEnabled: false,
  showAgentExecutionStarted: true,
  showAgentExecutionCompleted: true,
  showAgentExecutionFailed: true,
  showTaskStatusChanged: true,
};

export function useWebSocketNotifications(config: NotificationConfig = defaultConfig) {
  const { addToast } = useToast();

  const handleEvent = useCallback(
    (event: WebSocketEvent) => {
      if (!config.enabled) return;

      switch (event.type) {
        case 'agent_execution_started':
          if (config.showAgentExecutionStarted) {
            addToast({
              type: 'info',
              title: 'Agent Execution Started',
              message: `${event.payload.agent_type} started on ${event.payload.repository || 'unknown repo'}`,
            });
          }
          break;

        case 'agent_execution_completed':
          if (config.showAgentExecutionCompleted) {
            addToast({
              type: 'success',
              title: 'Agent Execution Completed',
              message: `${event.payload.agent_type} completed successfully`,
            });
          }
          break;

        case 'agent_execution_failed':
          if (config.showAgentExecutionFailed) {
            addToast({
              type: 'error',
              title: 'Agent Execution Failed',
              message: `${event.payload.agent_type} failed: ${event.payload.message || 'Unknown error'}`,
              duration: 10000, // Show longer for errors
            });
          }
          break;

        case 'task_status_changed':
          if (config.showTaskStatusChanged) {
            const statusColors: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
              pending: 'info',
              queued: 'info',
              running: 'info',
              completed: 'success',
              failed: 'error',
              cancelled: 'warning',
            };
            addToast({
              type: statusColors[event.payload.status || 'info'] || 'info',
              title: 'Task Status Changed',
              message: `Task ${event.payload.task_id?.slice(0, 8) || 'unknown'} is now ${event.payload.status}`,
            });
          }
          break;

        case 'system_notification':
          addToast({
            type: 'info',
            title: 'System Notification',
            message: event.payload.message || 'New notification',
          });
          break;
      }

      // Play sound if enabled
      if (config.soundEnabled && event.type.includes('failed')) {
        playNotificationSound('error');
      } else if (config.soundEnabled && event.type.includes('completed')) {
        playNotificationSound('success');
      }
    },
    [addToast, config]
  );

  // Subscribe to all WebSocket events
  useWebSocketEvent('all', handleEvent, [handleEvent]);
}

// Simple notification sound (optional)
function playNotificationSound(type: 'success' | 'error' | 'info') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const frequencies: Record<string, number> = {
      success: 523.25, // C5
      error: 261.63, // C4
      info: 392.0, // G4
    };

    oscillator.frequency.value = frequencies[type] || frequencies.info;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors
  }
}

export default useWebSocketNotifications;

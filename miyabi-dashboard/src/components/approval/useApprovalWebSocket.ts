/**
 * React hook for approval WebSocket connection
 */

import { useEffect, useState, useCallback } from 'react';

export interface ApprovalUpdate {
  type: 'approval_update' | 'approval_completed' | 'error';
  approval_id: string;
  status: string;
  approval_count?: number;
  required_count?: number;
  message?: string;
}

export function useApprovalWebSocket(approvalId: string, apiUrl: string) {
  const [data, setData] = useState<ApprovalUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create WebSocket URL
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/api/approval/${approvalId}/stream`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const update: ApprovalUpdate = JSON.parse(event.data);
        setData(update);

        if (update.type === 'error') {
          setError(update.message || 'Unknown error');
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
        setError('Failed to parse server message');
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      ws.close();
    };
  }, [approvalId, apiUrl]);

  return { data, error, isConnected };
}

/**
 * React Hook for Y.js Collaboration
 * Provides easy integration with collaborative editing features
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { collaborationProvider, UserAwareness } from '@/lib/collaboration/yjs-provider';

interface UseCollaborationOptions {
  roomId: string;
  user: UserAwareness['user'];
  autoConnect?: boolean;
}

interface CollaborationStatus {
  connected: boolean;
  synced: boolean;
  userCount: number;
  users: UserAwareness['user'][];
}

interface UseCollaborationReturn {
  // Connection status
  status: CollaborationStatus | null;
  isConnected: boolean;
  isLoading: boolean;

  // Document access
  getSharedText: (key?: string) => Y.Text | null;
  getSharedMap: (key?: string) => Y.Map<any> | null;
  getSharedArray: (key?: string) => Y.Array<any> | null;

  // Connection management
  connect: () => void;
  disconnect: () => void;

  // Awareness (cursor/user presence)
  setLocalCursor: (cursor: { anchor: number; head: number } | null) => void;
  onAwarenessChange: (callback: (users: UserAwareness['user'][]) => void) => () => void;
}

export function useCollaboration({
  roomId,
  user,
  autoConnect = true
}: UseCollaborationOptions): UseCollaborationReturn {
  const [status, setStatus] = useState<CollaborationStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roomRef = useRef<any>(null);
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update status periodically
  const updateStatus = useCallback(() => {
    const roomStatus = collaborationProvider.getRoomStatus(roomId);
    if (roomStatus) {
      setStatus(roomStatus);
      setIsConnected(roomStatus.connected);
    }
  }, [roomId]);

  // Connect to collaboration room
  const connect = useCallback(() => {
    if (isConnected) return;

    setIsLoading(true);
    try {
      roomRef.current = collaborationProvider.joinRoom(roomId, user);

      // Set up event listeners for connection status
      const provider = roomRef.current.provider;

      const handleConnection = () => {
        setIsConnected(true);
        setIsLoading(false);
        updateStatus();
      };

      const handleDisconnection = () => {
        setIsConnected(false);
        setIsLoading(false);
        updateStatus();
      };

      const handleSync = () => {
        updateStatus();
      };

      provider.on('status', handleConnection);
      provider.on('sync', handleSync);
      provider.on('connection-close', handleDisconnection);
      provider.on('connection-error', handleDisconnection);

      // Set up awareness change listener
      roomRef.current.awareness.on('change', updateStatus);

      // Start periodic status updates
      statusUpdateIntervalRef.current = setInterval(updateStatus, 2000);

      // Initial status update
      updateStatus();

    } catch (error) {
      console.error('Error connecting to collaboration room:', error);
      setIsLoading(false);
    }
  }, [roomId, user, isConnected, updateStatus]);

  // Disconnect from collaboration room
  const disconnect = useCallback(() => {
    if (roomRef.current) {
      collaborationProvider.leaveRoom(roomId);
      roomRef.current = null;
    }

    if (statusUpdateIntervalRef.current) {
      clearInterval(statusUpdateIntervalRef.current);
      statusUpdateIntervalRef.current = null;
    }

    setIsConnected(false);
    setStatus(null);
    setIsLoading(false);
  }, [roomId]);

  // Get shared text document
  const getSharedText = useCallback((key: string = 'content'): Y.Text | null => {
    return collaborationProvider.createSharedText(roomId, key);
  }, [roomId]);

  // Get shared map
  const getSharedMap = useCallback((key: string = 'data'): Y.Map<any> | null => {
    return collaborationProvider.createSharedMap(roomId, key);
  }, [roomId]);

  // Get shared array
  const getSharedArray = useCallback((key: string = 'items'): Y.Array<any> | null => {
    return collaborationProvider.createSharedArray(roomId, key);
  }, [roomId]);

  // Set local cursor position for awareness
  const setLocalCursor = useCallback((cursor: { anchor: number; head: number } | null) => {
    if (roomRef.current?.awareness) {
      roomRef.current.awareness.setLocalStateField('cursor', cursor);
    }
  }, []);

  // Listen to awareness changes
  const onAwarenessChange = useCallback((callback: (users: UserAwareness['user'][]) => void) => {
    if (!roomRef.current?.awareness) {
      return () => {};
    }

    const handleAwarenessChange = () => {
      const users: UserAwareness['user'][] = [];
      roomRef.current.awareness.getStates().forEach((state: any) => {
        if (state.user) {
          users.push(state.user);
        }
      });
      callback(users);
    };

    roomRef.current.awareness.on('change', handleAwarenessChange);

    return () => {
      if (roomRef.current?.awareness) {
        roomRef.current.awareness.off('change', handleAwarenessChange);
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update user info when it changes
  useEffect(() => {
    if (roomRef.current?.awareness) {
      roomRef.current.awareness.setLocalStateField('user', user);
    }
  }, [user]);

  return {
    status,
    isConnected,
    isLoading,
    getSharedText,
    getSharedMap,
    getSharedArray,
    connect,
    disconnect,
    setLocalCursor,
    onAwarenessChange
  };
}
/**
 * MiyabiWebSocket - WebSocket client for real-time event streaming
 *
 * Connects to Miyabi Desktop's WebSocket server (ws://localhost:9001)
 * to receive real-time events for Agents, GitHub, Worktrees, and System.
 */

import { AgentEvent, WorktreeEvent, GitHubEvent, SystemEvent } from './types';

type EventCallback<T> = (data: T) => void;

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

export class MiyabiWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 1000; // Start at 1s
  private maxReconnectInterval: number = 8000; // Max 8s
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualClose: boolean = false;
  private eventHandlers: Map<string, Set<EventCallback<any>>> = new Map();

  /**
   * Create a new MiyabiWebSocket client
   * @param url WebSocket server URL (default: ws://localhost:9001)
   */
  constructor(url: string = 'ws://localhost:9001') {
    this.url = url;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[MiyabiWebSocket] Already connected');
      return;
    }

    try {
      console.log(`[MiyabiWebSocket] Connecting to ${this.url}...`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[MiyabiWebSocket] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log('[MiyabiWebSocket] Disconnected');
  }

  /**
   * Register an event handler for a specific event type
   * @param event Event type (e.g., 'agent:event', 'worktree:event')
   * @param callback Callback function to handle the event
   */
  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);
  }

  /**
   * Remove an event handler
   * @param event Event type
   * @param callback Callback function to remove
   */
  off<T = any>(event: string, callback: EventCallback<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(callback);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log(`[MiyabiWebSocket] Connected to ${this.url}`);
    this.reconnectAttempts = 0;
    this.reconnectInterval = 1000;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log(`[MiyabiWebSocket] Received: ${message.type}`, message.data);

      // Special handling for welcome message
      if (message.type === 'welcome') {
        console.log('[MiyabiWebSocket] Welcome:', message.data);
        return;
      }

      // Dispatch to registered handlers
      const handlers = this.eventHandlers.get(message.type);
      if (handlers && handlers.size > 0) {
        handlers.forEach((callback) => {
          try {
            callback(message.data);
          } catch (error) {
            console.error(`[MiyabiWebSocket] Error in handler for ${message.type}:`, error);
          }
        });
      } else {
        console.warn(`[MiyabiWebSocket] No handler for event type: ${message.type}`);
      }
    } catch (error) {
      console.error('[MiyabiWebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: Event): void {
    console.error('[MiyabiWebSocket] WebSocket error:', error);
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[MiyabiWebSocket] Connection closed (code: ${event.code}, reason: ${event.reason})`);

    if (!this.isManualClose) {
      console.log('[MiyabiWebSocket] Reconnecting...');
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectInterval,
    );

    console.log(`[MiyabiWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Check if the WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current connection state
   */
  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) {return 'closed';}

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }
}

/**
 * Singleton instance for global access
 */
let globalWebSocket: MiyabiWebSocket | null = null;

export function getMiyabiWebSocket(): MiyabiWebSocket {
  if (!globalWebSocket) {
    globalWebSocket = new MiyabiWebSocket();
  }
  return globalWebSocket;
}

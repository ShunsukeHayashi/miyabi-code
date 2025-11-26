/**
 * WebSocket Client
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Heartbeat/ping-pong mechanism
 * - Connection state management
 * - Event subscription system
 * - Graceful connection closure
 */

// =============================================================================
// Types
// =============================================================================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export type WebSocketEventType =
  | 'agent_execution_started'
  | 'agent_execution_completed'
  | 'agent_execution_failed'
  | 'task_status_changed'
  | 'agent_status_changed'
  | 'system_notification';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: {
    execution_id?: string;
    task_id?: string;
    agent_id?: string;
    agent_type?: string;
    status?: string;
    repository?: string;
    timestamp: string;
    message?: string;
    title?: string;
    details?: Record<string, unknown>;
  };
}

export interface WebSocketClientConfig {
  url: string;
  reconnectMaxRetries?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

type EventHandler = (event: WebSocketEvent) => void;
type ConnectionHandler = (state: ConnectionState) => void;

// =============================================================================
// Default Configuration
// =============================================================================

// WebSocket is disabled in production Lambda (Lambda Function URLs don't support WebSocket)
// Use polling fallback instead. To enable WebSocket, set NEXT_PUBLIC_WS_URL env variable.
const WS_DISABLED = !process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_WS_URL === '' ||
  process.env.NEXT_PUBLIC_WS_URL.includes('lambda-url');

const DEFAULT_CONFIG: Required<WebSocketClientConfig> = {
  url: process.env.NEXT_PUBLIC_WS_URL || '',
  reconnectMaxRetries: WS_DISABLED ? 0 : 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  heartbeatInterval: 30000,
  heartbeatTimeout: 10000,
};

// =============================================================================
// WebSocket Client Class
// =============================================================================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private eventHandlers: Map<WebSocketEventType | 'all', Set<EventHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private lastEventTime: Date | null = null;
  private authToken: string | null = null;

  constructor(config: Partial<WebSocketClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  connect(token?: string): void {
    // Skip connection if WebSocket is disabled (Lambda production)
    if (WS_DISABLED || !this.config.url) {
      console.log('[WebSocket] Disabled in production - using polling fallback');
      this.setConnectionState('disconnected');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.authToken = token || null;
    this.setConnectionState('connecting');

    try {
      const url = new URL(this.config.url);
      if (this.authToken) {
        url.searchParams.set('token', this.authToken);
      }

      console.log('[WebSocket] Connecting to', url.toString());
      this.ws = new WebSocket(url.toString());
      this.setupEventListeners();
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.setConnectionState('error');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.clearTimers();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional close
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setConnectionState('disconnected');
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.startHeartbeat();
    };

    this.ws.onclose = (event) => {
      console.log(`[WebSocket] Closed: ${event.code} - ${event.reason}`);
      this.clearTimers();

      if (event.code !== 1000) {
        // Abnormal closure - attempt reconnect
        this.scheduleReconnect();
      } else {
        this.setConnectionState('disconnected');
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.setConnectionState('error');
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  // ---------------------------------------------------------------------------
  // Heartbeat Mechanism
  // ---------------------------------------------------------------------------

  private startHeartbeat(): void {
    this.clearTimers();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));

        this.heartbeatTimeout = setTimeout(() => {
          console.warn('[WebSocket] Heartbeat timeout - reconnecting');
          this.ws?.close(4000, 'Heartbeat timeout');
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  private handlePong(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Reconnection Logic
  // ---------------------------------------------------------------------------

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectMaxRetries) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.setConnectionState('error');
      return;
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    const delay = this.calculateReconnectDelay();
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.reconnectMaxRetries})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.authToken || undefined);
    }, delay);
  }

  private calculateReconnectDelay(): number {
    const delay = this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, this.config.reconnectMaxDelay);
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle pong response
      if (message.type === 'pong') {
        this.handlePong();
        return;
      }

      // Handle WebSocket events
      const event = message as WebSocketEvent;
      this.lastEventTime = new Date();
      this.notifyEventHandlers(event);
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Subscription
  // ---------------------------------------------------------------------------

  subscribe(eventType: WebSocketEventType | 'all', handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    // Immediately notify of current state
    handler(this.connectionState);

    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyEventHandlers(event: WebSocketEvent): void {
    // Notify specific event handlers
    this.eventHandlers.get(event.type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('[WebSocket] Event handler error:', error);
      }
    });

    // Notify 'all' handlers
    this.eventHandlers.get('all')?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('[WebSocket] Event handler error:', error);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionHandlers.forEach((handler) => {
        try {
          handler(state);
        } catch (error) {
          console.error('[WebSocket] Connection handler error:', error);
        }
      });
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getLastEventTime(): Date | null {
    return this.lastEventTime;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  // ---------------------------------------------------------------------------
  // Sending Messages
  // ---------------------------------------------------------------------------

  send(data: unknown): boolean {
    if (!this.isConnected()) {
      console.warn('[WebSocket] Cannot send - not connected');
      return false;
    }

    try {
      this.ws!.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  destroy(): void {
    this.disconnect();
    this.eventHandlers.clear();
    this.connectionHandlers.clear();
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let wsClientInstance: WebSocketClient | null = null;

export function getWebSocketClient(config?: Partial<WebSocketClientConfig>): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient(config);
  }
  return wsClientInstance;
}

export function resetWebSocketClient(): void {
  if (wsClientInstance) {
    wsClientInstance.destroy();
    wsClientInstance = null;
  }
}

export default WebSocketClient;

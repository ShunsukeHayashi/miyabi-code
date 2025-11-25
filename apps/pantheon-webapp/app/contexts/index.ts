/**
 * Context Exports
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 * Issue: #981 - Phase 3.4: Authentication Flow Implementation
 */

export {
  WebSocketProvider,
  useWebSocket,
  useWebSocketEvent,
  default as WebSocketContext,
} from './WebSocketContext';

export {
  AuthProvider,
  useAuth,
  useRequireAuth,
  default as AuthContext,
} from './AuthContext';

export type { User, AuthState } from './AuthContext';

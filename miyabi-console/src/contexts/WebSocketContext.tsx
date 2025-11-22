import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

// WebSocket connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'offline'

// WebSocket event types
export type WebSocketEventType =
  | 'agent:status_changed'
  | 'agent:task_started'
  | 'agent:task_completed'
  | 'agent:error'
  | 'deployment:started'
  | 'deployment:progress'
  | 'deployment:completed'
  | 'deployment:failed'
  | 'system:metrics_updated'
  | 'system:alert'
  | 'database:query_completed'

// WebSocket message format
export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType
  timestamp: string
  data: T
}

// Agent status change data
export interface AgentStatusChangeData {
  agentId: string
  oldStatus: string
  newStatus: string
}

// Deployment progress data
export interface DeploymentProgressData {
  deploymentId: string
  stage: string
  progress: number
  message?: string
}

// System metrics data
export interface SystemMetricsData {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  active_agents: number
  total_tasks: number
  completed_tasks: number
  uptime_seconds: number
}

// Event handler type
type EventHandler<T = unknown> = (data: T) => void

// Context value type
interface WebSocketContextValue {
  connectionState: ConnectionState
  lastMessage: WebSocketMessage | null
  subscribe: <T>(eventType: WebSocketEventType, handler: EventHandler<T>) => () => void
  send: (message: unknown) => void
  reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

// Configuration
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
const RECONNECT_DELAY_BASE = 1000
const MAX_RECONNECT_DELAY = 30000
const MAX_RECONNECT_ATTEMPTS = 10

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventHandlers = useRef<Map<WebSocketEventType, Set<EventHandler>>>(new Map())
  const messageQueue = useRef<unknown[]>([])

  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = useCallback(() => {
    const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts.current)
    return Math.min(delay, MAX_RECONNECT_DELAY)
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionState('connecting')

    try {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setConnectionState('connected')
        reconnectAttempts.current = 0

        // Send queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift()
          ws.send(JSON.stringify(message))
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          setLastMessage(message)

          // Dispatch to subscribers
          const handlers = eventHandlers.current.get(message.type)
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(message.data)
              } catch (error) {
                console.error('[WebSocket] Handler error:', error)
              }
            })
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason)
        setConnectionState('disconnected')
        wsRef.current = null

        // Attempt to reconnect
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay()
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          console.log('[WebSocket] Max reconnect attempts reached')
          setConnectionState('offline')
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error)
      setConnectionState('offline')
    }
  }, [getReconnectDelay])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }

    setConnectionState('disconnected')
  }, [])

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttempts.current = 0
    connect()
  }, [connect, disconnect])

  // Subscribe to event type
  const subscribe = useCallback(<T,>(eventType: WebSocketEventType, handler: EventHandler<T>) => {
    if (!eventHandlers.current.has(eventType)) {
      eventHandlers.current.set(eventType, new Set())
    }

    const handlers = eventHandlers.current.get(eventType)!
    handlers.add(handler as EventHandler)

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler)
      if (handlers.size === 0) {
        eventHandlers.current.delete(eventType)
      }
    }
  }, [])

  // Send message
  const send = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is restored
      messageQueue.current.push(message)
    }
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionState === 'offline') {
        reconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectionState, reconnect])

  const value: WebSocketContextValue = {
    connectionState,
    lastMessage,
    subscribe,
    send,
    reconnect,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

// Hook to use WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext)

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }

  return context
}

// Hook to subscribe to specific event
export function useWebSocketEvent<T>(
  eventType: WebSocketEventType,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
) {
  const { subscribe } = useWebSocket()

  useEffect(() => {
    const unsubscribe = subscribe<T>(eventType, handler)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, subscribe, ...deps])
}

// Hook to get connection state
export function useConnectionState() {
  const { connectionState } = useWebSocket()
  return connectionState
}

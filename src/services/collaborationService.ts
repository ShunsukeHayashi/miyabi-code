/**
 * Collaboration Service
 *
 * Manages real-time collaboration features including:
 * - User presence management
 * - Cursor synchronization
 * - Chat and commenting
 * - Activity tracking
 */

export interface User {
  id: string
  name: string
  color: string
  avatar?: string
  email?: string
  cursor?: CursorPosition
  selection?: SelectionRange
  lastActive?: number
}

export interface CursorPosition {
  x: number
  y: number
  line?: number
  column?: number
}

export interface SelectionRange {
  start: number
  end: number
  startLine?: number
  startColumn?: number
  endLine?: number
  endColumn?: number
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
  replyTo?: string
}

export interface ActivityEvent {
  id: string
  type: 'join' | 'leave' | 'edit' | 'cursor' | 'selection' | 'comment' | 'save'
  userId: string
  userName: string
  timestamp: number
  details?: Record<string, any>
}

type EventCallback<T = any> = (data: T) => void

interface EventListeners {
  connected: EventCallback<void>[]
  disconnected: EventCallback<{ reason: string }>[]
  'user:join': EventCallback<User>[]
  'user:leave': EventCallback<string>[]
  'user:cursor': EventCallback<{ userId: string; cursor: CursorPosition }>[]
  'user:selection': EventCallback<{ userId: string; selection: SelectionRange }>[]
  'chat:message': EventCallback<ChatMessage>[]
  activity: EventCallback<ActivityEvent>[]
  error: EventCallback<Error>[]
}

/**
 * Collaboration Service Class
 * Handles real-time collaboration features
 */
export class CollaborationService {
  private documentId: string
  private currentUser: User
  private users: Map<string, User> = new Map()
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private listeners: EventListeners = {
    connected: [],
    disconnected: [],
    'user:join': [],
    'user:leave': [],
    'user:cursor': [],
    'user:selection': [],
    'chat:message': [],
    activity: [],
    error: [],
  }

  constructor(documentId: string, user: User) {
    this.documentId = documentId
    this.currentUser = {
      ...user,
      lastActive: Date.now(),
    }
    this.users.set(user.id, this.currentUser)
  }

  /**
   * Connect to collaboration server
   */
  public connect(wsUrl?: string): void {
    const url = wsUrl || process.env.NEXT_PUBLIC_COLLABORATION_WS_URL || 'ws://localhost:1235'

    try {
      this.socket = new WebSocket(`${url}/${this.documentId}`)
      this.setupSocketHandlers()
    } catch (error) {
      this.emit('error', error as Error)
      this.scheduleReconnect()
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return

    this.socket.onopen = () => {
      this.reconnectAttempts = 0

      // Send join message
      this.send({
        type: 'join',
        user: this.currentUser,
      })

      // Start heartbeat
      this.startHeartbeat()

      this.emit('connected', undefined)
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        this.emit('error', new Error('Failed to parse message'))
      }
    }

    this.socket.onclose = (event) => {
      this.stopHeartbeat()
      this.emit('disconnected', { reason: event.reason || 'Connection closed' })
      this.scheduleReconnect()
    }

    this.socket.onerror = () => {
      this.emit('error', new Error('WebSocket error'))
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'user:join':
        this.handleUserJoin(message.user)
        break

      case 'user:leave':
        this.handleUserLeave(message.userId)
        break

      case 'user:cursor':
        this.handleCursorUpdate(message.userId, message.cursor)
        break

      case 'user:selection':
        this.handleSelectionUpdate(message.userId, message.selection)
        break

      case 'chat:message':
        this.handleChatMessage(message.message)
        break

      case 'users:sync':
        this.handleUsersSync(message.users)
        break

      case 'activity':
        this.emit('activity', message.event)
        break

      default:
        break
    }
  }

  /**
   * Handle user join
   */
  private handleUserJoin(user: User): void {
    this.users.set(user.id, user)
    this.emit('user:join', user)
    this.emit('activity', {
      id: `activity-${Date.now()}`,
      type: 'join',
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle user leave
   */
  private handleUserLeave(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      this.users.delete(userId)
      this.emit('user:leave', userId)
      this.emit('activity', {
        id: `activity-${Date.now()}`,
        type: 'leave',
        userId: user.id,
        userName: user.name,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Handle cursor update
   */
  private handleCursorUpdate(userId: string, cursor: CursorPosition): void {
    const user = this.users.get(userId)
    if (user) {
      user.cursor = cursor
      user.lastActive = Date.now()
      this.emit('user:cursor', { userId, cursor })
    }
  }

  /**
   * Handle selection update
   */
  private handleSelectionUpdate(userId: string, selection: SelectionRange): void {
    const user = this.users.get(userId)
    if (user) {
      user.selection = selection
      user.lastActive = Date.now()
      this.emit('user:selection', { userId, selection })
    }
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(message: ChatMessage): void {
    this.emit('chat:message', message)
  }

  /**
   * Handle users sync (initial state)
   */
  private handleUsersSync(users: User[]): void {
    for (const user of users) {
      if (user.id !== this.currentUser.id) {
        this.users.set(user.id, user)
      }
    }
  }

  /**
   * Send message via WebSocket
   */
  private send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat' })
    }, 30000)
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'))
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * Update current user's cursor position
   */
  public updateCursor(cursor: CursorPosition): void {
    this.currentUser.cursor = cursor
    this.currentUser.lastActive = Date.now()

    this.send({
      type: 'cursor',
      cursor,
    })
  }

  /**
   * Update current user's selection
   */
  public updateSelection(selection: SelectionRange): void {
    this.currentUser.selection = selection
    this.currentUser.lastActive = Date.now()

    this.send({
      type: 'selection',
      selection,
    })
  }

  /**
   * Send a chat message
   */
  public sendChatMessage(content: string, replyTo?: string): void {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      content,
      timestamp: Date.now(),
      replyTo,
    }

    this.send({
      type: 'chat',
      message,
    })
  }

  /**
   * Get all active users
   */
  public getUsers(): User[] {
    return Array.from(this.users.values())
  }

  /**
   * Get user by ID
   */
  public getUser(userId: string): User | undefined {
    return this.users.get(userId)
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User {
    return this.currentUser
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  /**
   * Add event listener
   */
  public on<K extends keyof EventListeners>(
    event: K,
    callback: EventListeners[K][number]
  ): void {
    this.listeners[event].push(callback as any)
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof EventListeners>(
    event: K,
    callback: EventListeners[K][number]
  ): void {
    const index = this.listeners[event].indexOf(callback as any)
    if (index > -1) {
      this.listeners[event].splice(index, 1)
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof EventListeners>(
    event: K,
    data: Parameters<EventListeners[K][number]>[0]
  ): void {
    for (const callback of this.listeners[event]) {
      try {
        (callback as any)(data)
      } catch (error) {
        console.error(`Error in ${event} handler:`, error)
      }
    }
  }

  /**
   * Disconnect from collaboration server
   */
  public disconnect(): void {
    this.stopHeartbeat()

    if (this.socket) {
      this.send({
        type: 'leave',
        userId: this.currentUser.id,
      })

      this.socket.close()
      this.socket = null
    }

    this.users.clear()
    this.users.set(this.currentUser.id, this.currentUser)
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disconnect()

    // Clear all listeners
    for (const key of Object.keys(this.listeners) as Array<keyof EventListeners>) {
      this.listeners[key] = []
    }
  }
}

export default CollaborationService

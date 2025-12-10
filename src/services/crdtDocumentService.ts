/**
 * CRDT Document Service with Yjs
 *
 * This service provides real-time collaborative editing capabilities
 * using Conflict-free Replicated Data Types (CRDT) via Yjs library.
 *
 * Features:
 * - Real-time document synchronization
 * - Automatic conflict resolution
 * - Offline support with IndexedDB persistence
 * - User awareness (cursors, selections)
 */

// Type definitions for Yjs (since we're defining the interface without full library)
interface YDoc {
  getText(name: string): YText
  transact(fn: () => void, origin?: any): void
  destroy(): void
  on(event: string, callback: (...args: any[]) => void): void
  off(event: string, callback: (...args: any[]) => void): void
}

interface YText {
  insert(index: number, text: string, attributes?: Record<string, any>): void
  delete(index: number, length: number): void
  toString(): string
  observe(callback: (event: any, transaction: any) => void): void
  length: number
}

interface Awareness {
  setLocalStateField(field: string, value: any): void
  getStates(): Map<number, any>
  on(event: string, callback: (...args: any[]) => void): void
  off(event: string, callback: (...args: any[]) => void): void
  destroy(): void
}

interface WebsocketProvider {
  awareness: Awareness
  on(event: string, callback: (...args: any[]) => void): void
  off(event: string, callback: (...args: any[]) => void): void
  destroy(): void
  connect(): void
  disconnect(): void
}

interface IndexeddbPersistence {
  destroy(): void
  on(event: string, callback: (...args: any[]) => void): void
}

export interface DocumentChange {
  type: 'text' | 'delete' | 'format'
  position: number
  content?: string
  length?: number
  attributes?: Record<string, any>
  userId: string
  timestamp: number
}

export interface UserAwarenessState {
  userId: string
  name: string
  color: string
  cursor?: { line: number; column: number }
  selection?: { start: number; end: number }
  timestamp: number
}

export interface CollaborativeEditor {
  document: YDoc
  text: YText
  awareness: Awareness
  provider: WebsocketProvider
  persistence: IndexeddbPersistence
}

export interface ConnectionStatus {
  connected: boolean
  synced: boolean
  error?: string
}

export type DocumentEventType = 'changes' | 'awareness' | 'status' | 'sync'

export interface DocumentEventHandlers {
  onChanges?: (changes: DocumentChange[]) => void
  onAwareness?: (states: Map<number, UserAwarenessState>) => void
  onStatus?: (status: ConnectionStatus) => void
  onSync?: (synced: boolean) => void
}

/**
 * CRDT Document Service
 * Manages collaborative documents with real-time synchronization
 */
export class CRDTDocumentService {
  private editors: Map<string, CollaborativeEditor> = new Map()
  private eventHandlers: Map<string, DocumentEventHandlers> = new Map()
  private defaultWsUrl: string

  constructor(wsUrl?: string) {
    this.defaultWsUrl = wsUrl || process.env.NEXT_PUBLIC_CRDT_WS_URL || 'ws://localhost:1234'
  }

  /**
   * Create or retrieve a collaborative document
   */
  public async createDocument(
    documentId: string,
    options?: {
      wsUrl?: string
      handlers?: DocumentEventHandlers
    }
  ): Promise<CollaborativeEditor> {
    // Return existing editor if available
    if (this.editors.has(documentId)) {
      const existing = this.editors.get(documentId)!
      if (options?.handlers) {
        this.eventHandlers.set(documentId, {
          ...this.eventHandlers.get(documentId),
          ...options.handlers,
        })
      }
      return existing
    }

    // Dynamic import to avoid SSR issues
    const [Y, { WebsocketProvider }, { IndexeddbPersistence }] = await Promise.all([
      import('yjs'),
      import('y-websocket'),
      import('y-indexeddb'),
    ])

    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('content')

    // WebSocket provider for real-time sync
    const provider = new WebsocketProvider(
      options?.wsUrl || this.defaultWsUrl,
      documentId,
      ydoc
    ) as unknown as WebsocketProvider

    // IndexedDB persistence for offline support
    const persistence = new IndexeddbPersistence(documentId, ydoc) as unknown as IndexeddbPersistence

    const editor: CollaborativeEditor = {
      document: ydoc as unknown as YDoc,
      text: ytext as unknown as YText,
      awareness: provider.awareness,
      provider,
      persistence,
    }

    // Store handlers
    if (options?.handlers) {
      this.eventHandlers.set(documentId, options.handlers)
    }

    // Setup event handlers
    this.setupEventHandlers(documentId, editor)
    this.editors.set(documentId, editor)

    return editor
  }

  /**
   * Setup event handlers for document changes
   */
  private setupEventHandlers(documentId: string, editor: CollaborativeEditor): void {
    const { text, awareness, provider, persistence } = editor

    // Text changes observer
    text.observe((event: any, transaction: any) => {
      const changes: DocumentChange[] = []
      let position = 0

      if (event.changes?.delta) {
        for (const change of event.changes.delta) {
          if (change.retain) {
            position += change.retain
            continue
          }

          if (change.insert) {
            changes.push({
              type: 'text',
              position,
              content: typeof change.insert === 'string' ? change.insert : JSON.stringify(change.insert),
              userId: transaction.origin?.userId || 'anonymous',
              timestamp: Date.now(),
            })
            position += typeof change.insert === 'string' ? change.insert.length : 1
          }

          if (change.delete) {
            changes.push({
              type: 'delete',
              position,
              length: change.delete,
              userId: transaction.origin?.userId || 'anonymous',
              timestamp: Date.now(),
            })
          }
        }
      }

      if (changes.length > 0) {
        this.emitChanges(documentId, changes)
      }
    })

    // Awareness changes (cursors, selections)
    awareness.on('change', () => {
      const states = awareness.getStates()
      const userStates = new Map<number, UserAwarenessState>()

      states.forEach((state, clientId) => {
        if (state.user) {
          userStates.set(clientId, state.user as UserAwarenessState)
        }
      })

      this.emitAwarenessChange(documentId, userStates)
    })

    // Connection status
    provider.on('status', (event: any) => {
      this.emitConnectionStatus(documentId, {
        connected: event.status === 'connected',
        synced: false,
      })
    })

    // Sync status
    provider.on('synced', (synced: boolean) => {
      const handlers = this.eventHandlers.get(documentId)
      if (handlers?.onSync) {
        handlers.onSync(synced)
      }
    })

    // Persistence sync
    persistence.on('synced', () => {
      const handlers = this.eventHandlers.get(documentId)
      if (handlers?.onStatus) {
        handlers.onStatus({ connected: true, synced: true })
      }
    })
  }

  /**
   * Insert text at position with conflict resolution
   */
  public insertText(
    documentId: string,
    position: number,
    text: string,
    userId: string
  ): void {
    const editor = this.editors.get(documentId)
    if (!editor) {
      throw new Error(`Document ${documentId} not found`)
    }

    editor.document.transact(() => {
      editor.text.insert(position, text)
    }, { userId })
  }

  /**
   * Delete text at position with conflict resolution
   */
  public deleteText(
    documentId: string,
    position: number,
    length: number,
    userId: string
  ): void {
    const editor = this.editors.get(documentId)
    if (!editor) {
      throw new Error(`Document ${documentId} not found`)
    }

    editor.document.transact(() => {
      editor.text.delete(position, length)
    }, { userId })
  }

  /**
   * Replace text range with new content
   */
  public replaceText(
    documentId: string,
    start: number,
    end: number,
    newText: string,
    userId: string
  ): void {
    const editor = this.editors.get(documentId)
    if (!editor) {
      throw new Error(`Document ${documentId} not found`)
    }

    editor.document.transact(() => {
      const deleteLength = end - start
      if (deleteLength > 0) {
        editor.text.delete(start, deleteLength)
      }
      if (newText.length > 0) {
        editor.text.insert(start, newText)
      }
    }, { userId })
  }

  /**
   * Update user awareness (cursor, selection, presence)
   */
  public updateAwareness(
    documentId: string,
    userId: string,
    state: Partial<UserAwarenessState>
  ): void {
    const editor = this.editors.get(documentId)
    if (!editor) {
      throw new Error(`Document ${documentId} not found`)
    }

    editor.awareness.setLocalStateField('user', {
      ...state,
      userId,
      timestamp: Date.now(),
    })
  }

  /**
   * Get current document content
   */
  public getContent(documentId: string): string {
    const editor = this.editors.get(documentId)
    if (!editor) {
      throw new Error(`Document ${documentId} not found`)
    }

    return editor.text.toString()
  }

  /**
   * Get document length
   */
  public getLength(documentId: string): number {
    const editor = this.editors.get(documentId)
    if (!editor) {
      throw new Error(`Document ${documentId} not found`)
    }

    return editor.text.length
  }

  /**
   * Check if document exists
   */
  public hasDocument(documentId: string): boolean {
    return this.editors.has(documentId)
  }

  /**
   * Get all active users for a document
   */
  public getActiveUsers(documentId: string): UserAwarenessState[] {
    const editor = this.editors.get(documentId)
    if (!editor) {
      throw new Error(`Document ${documentId} not found`)
    }

    const users: UserAwarenessState[] = []
    const states = editor.awareness.getStates()

    states.forEach((state) => {
      if (state.user) {
        users.push(state.user as UserAwarenessState)
      }
    })

    return users
  }

  /**
   * Add event handlers for a document
   */
  public addEventHandlers(documentId: string, handlers: DocumentEventHandlers): void {
    const existing = this.eventHandlers.get(documentId) || {}
    this.eventHandlers.set(documentId, { ...existing, ...handlers })
  }

  /**
   * Remove event handlers for a document
   */
  public removeEventHandlers(documentId: string): void {
    this.eventHandlers.delete(documentId)
  }

  // Event emission methods
  private emitChanges(documentId: string, changes: DocumentChange[]): void {
    const handlers = this.eventHandlers.get(documentId)
    if (handlers?.onChanges) {
      handlers.onChanges(changes)
    }

    // Also emit as custom event for global listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('crdt:changes', {
          detail: { documentId, changes },
        })
      )
    }
  }

  private emitAwarenessChange(documentId: string, states: Map<number, UserAwarenessState>): void {
    const handlers = this.eventHandlers.get(documentId)
    if (handlers?.onAwareness) {
      handlers.onAwareness(states)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('crdt:awareness', {
          detail: { documentId, states },
        })
      )
    }
  }

  private emitConnectionStatus(documentId: string, status: ConnectionStatus): void {
    const handlers = this.eventHandlers.get(documentId)
    if (handlers?.onStatus) {
      handlers.onStatus(status)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('crdt:status', {
          detail: { documentId, status },
        })
      )
    }
  }

  /**
   * Destroy a document and clean up resources
   */
  public destroyDocument(documentId: string): void {
    const editor = this.editors.get(documentId)
    if (editor) {
      editor.provider.destroy()
      editor.persistence.destroy()
      editor.document.destroy()
      this.editors.delete(documentId)
      this.eventHandlers.delete(documentId)
    }
  }

  /**
   * Destroy all documents and clean up
   */
  public destroyAll(): void {
    const documentIds = Array.from(this.editors.keys())
    for (const documentId of documentIds) {
      this.destroyDocument(documentId)
    }
  }
}

// Singleton instance for convenience
let globalInstance: CRDTDocumentService | null = null

export function getCRDTDocumentService(): CRDTDocumentService {
  if (!globalInstance) {
    globalInstance = new CRDTDocumentService()
  }
  return globalInstance
}

export default CRDTDocumentService

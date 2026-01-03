/**
 * Y.js Collaboration Provider
 * Provides real-time collaborative editing for course content
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface CollaborationRoom {
  doc: Y.Doc;
  provider: WebsocketProvider;
  persistence: IndexeddbPersistence;
  awareness: WebsocketProvider['awareness'];
}

export interface UserAwareness {
  user: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
  cursor?: {
    anchor: number;
    head: number;
  };
}

class YjsCollaborationProvider {
  private rooms: Map<string, CollaborationRoom> = new Map();
  private websocketUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    this.websocketUrl = process.env.NEXT_PUBLIC_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
  }

  /**
   * Join a collaboration room for a specific document
   */
  joinRoom(roomId: string, user: UserAwareness['user']): CollaborationRoom {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId)!;
      // Update user awareness
      room.awareness.setLocalStateField('user', user);
      return room;
    }

    // Create new Y.js document
    const doc = new Y.Doc();

    // Create WebSocket provider for real-time sync
    const provider = new WebsocketProvider(
      this.websocketUrl,
      roomId,
      doc
    );

    // Create IndexedDB persistence for offline support
    const persistence = new IndexeddbPersistence(roomId, doc);

    // Set user awareness information
    provider.awareness.setLocalStateField('user', user);

    const room: CollaborationRoom = {
      doc,
      provider,
      persistence,
      awareness: provider.awareness
    };

    this.rooms.set(roomId, room);

    // Clean up when window unloads
    if (typeof window !== 'undefined') {
      const cleanup = () => {
        this.leaveRoom(roomId);
      };
      window.addEventListener('beforeunload', cleanup);
    }

    return room;
  }

  /**
   * Leave a collaboration room
   */
  leaveRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.provider.destroy();
      room.persistence.destroy();
      this.rooms.delete(roomId);
    }
  }

  /**
   * Get all active rooms
   */
  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Get room status
   */
  getRoomStatus(roomId: string): {
    connected: boolean;
    synced: boolean;
    userCount: number;
    users: UserAwareness['user'][];
  } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const users: UserAwareness['user'][] = [];
    room.awareness.getStates().forEach((state: any) => {
      if (state.user) {
        users.push(state.user);
      }
    });

    return {
      connected: room.provider.wsconnected,
      synced: room.provider.synced,
      userCount: users.length,
      users
    };
  }

  /**
   * Create shared text document for collaborative editing
   */
  createSharedText(roomId: string, textKey: string = 'content'): Y.Text | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return room.doc.getText(textKey);
  }

  /**
   * Create shared map for structured data
   */
  createSharedMap(roomId: string, mapKey: string = 'data'): Y.Map<any> | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return room.doc.getMap(mapKey);
  }

  /**
   * Create shared array for ordered data
   */
  createSharedArray(roomId: string, arrayKey: string = 'items'): Y.Array<any> | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return room.doc.getArray(arrayKey);
  }

  /**
   * Generate a random user color
   */
  generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0652DD', '#9C88FF', '#FFC312'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Destroy all rooms and connections
   */
  destroy(): void {
    this.rooms.forEach((room, roomId) => {
      this.leaveRoom(roomId);
    });
    this.rooms.clear();
  }
}

// Export singleton instance
export const collaborationProvider = new YjsCollaborationProvider();
export default collaborationProvider;
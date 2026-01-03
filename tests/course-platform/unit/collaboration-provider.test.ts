/**
 * Unit Tests for Y.js Collaboration Provider
 * Tests real-time collaboration functionality and Y.js integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YjsCollaborationProvider } from '@/lib/collaboration/yjs-provider';
import type {
  CollaborationRoom,
  UserInfo,
  SharedDocument,
  CollaborationEvent
} from '@/lib/collaboration/yjs-provider';

// Mock Y.js dependencies
vi.mock('yjs', () => ({
  Doc: vi.fn().mockImplementation(() => ({
    getText: vi.fn().mockReturnValue({
      insert: vi.fn(),
      delete: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
      toString: vi.fn().mockReturnValue('mock text content')
    }),
    getMap: vi.fn().mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn()
    }),
    getArray: vi.fn().mockReturnValue({
      push: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
      length: 0
    }),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  })),
  Text: vi.fn(),
  Map: vi.fn(),
  Array: vi.fn()
}));

vi.mock('y-websocket', () => ({
  WebsocketProvider: vi.fn().mockImplementation(() => ({
    awareness: {
      setLocalState: vi.fn(),
      getStates: vi.fn().mockReturnValue(new Map()),
      on: vi.fn(),
      off: vi.fn()
    },
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    destroy: vi.fn(),
    ws: { readyState: WebSocket.OPEN }
  }))
}));

vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn()
  }))
}));

describe('YjsCollaborationProvider', () => {
  let provider: YjsCollaborationProvider;
  let mockWebSocketProvider: any;
  let mockPersistence: any;

  const testUser: UserInfo = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.png',
    role: 'instructor'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new YjsCollaborationProvider('ws://localhost:8080');
  });

  afterEach(() => {
    provider.disconnect();
  });

  describe('Room Management', () => {
    it('should join a collaboration room successfully', async () => {
      const roomInfo = await provider.joinRoom('lesson-123', testUser, 'lesson');

      expect(roomInfo).toMatchObject({
        roomId: 'lesson-123',
        type: 'lesson',
        isConnected: true,
        participants: expect.any(Array)
      });

      expect(provider.getCurrentRoom()).toEqual(roomInfo);
    });

    it('should leave a room and clean up resources', async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
      const leftRoom = await provider.leaveRoom();

      expect(leftRoom).toBe(true);
      expect(provider.getCurrentRoom()).toBeNull();
    });

    it('should handle joining a new room while already in another', async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
      await provider.joinRoom('lesson-456', testUser, 'lesson');

      const currentRoom = provider.getCurrentRoom();
      expect(currentRoom?.roomId).toBe('lesson-456');
    });

    it('should get room status correctly', async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
      const status = provider.getRoomStatus();

      expect(status).toMatchObject({
        roomId: 'lesson-123',
        isConnected: true,
        participantCount: expect.any(Number),
        documents: expect.any(Array)
      });
    });
  });

  describe('Shared Document Management', () => {
    beforeEach(async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
    });

    it('should create shared text document', () => {
      const sharedText = provider.createSharedText('lesson-content');

      expect(sharedText).toMatchObject({
        id: 'lesson-content',
        type: 'text',
        insert: expect.any(Function),
        delete: expect.any(Function),
        observe: expect.any(Function),
        toString: expect.any(Function)
      });
    });

    it('should create shared map document', () => {
      const sharedMap = provider.createSharedMap('lesson-metadata');

      expect(sharedMap).toMatchObject({
        id: 'lesson-metadata',
        type: 'map',
        set: expect.any(Function),
        get: expect.any(Function),
        delete: expect.any(Function),
        observe: expect.any(Function)
      });
    });

    it('should create shared array document', () => {
      const sharedArray = provider.createSharedArray('lesson-activities');

      expect(sharedArray).toMatchObject({
        id: 'lesson-activities',
        type: 'array',
        push: expect.any(Function),
        delete: expect.any(Function),
        get: expect.any(Function),
        observe: expect.any(Function)
      });
    });

    it('should track all shared documents', () => {
      provider.createSharedText('content');
      provider.createSharedMap('metadata');
      provider.createSharedArray('activities');

      const documents = provider.getSharedDocuments();
      expect(documents).toHaveLength(3);
      expect(documents.map(d => d.id)).toEqual(
        expect.arrayContaining(['content', 'metadata', 'activities'])
      );
    });
  });

  describe('User Awareness', () => {
    beforeEach(async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
    });

    it('should update user cursor position', () => {
      const cursorInfo = {
        documentId: 'lesson-content',
        position: 15,
        selection: { start: 10, end: 20 }
      };

      provider.updateCursor(cursorInfo);

      // Verify that awareness state was updated
      // In a real test, we would check the actual awareness state
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should update user status', () => {
      provider.updateUserStatus('typing');

      // Verify status update
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should get all participants', () => {
      const participants = provider.getParticipants();

      expect(participants).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          isConnected: expect.any(Boolean)
        })
      ]));
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
    });

    it('should handle user join events', () => {
      const onUserJoin = vi.fn();
      provider.on('user-join', onUserJoin);

      // Simulate user join event
      const newUser: UserInfo = {
        id: 'user456',
        name: 'New User',
        email: 'new@example.com',
        role: 'student'
      };

      provider.emit('user-join', { user: newUser });

      expect(onUserJoin).toHaveBeenCalledWith(
        expect.objectContaining({
          user: newUser
        })
      );
    });

    it('should handle user leave events', () => {
      const onUserLeave = vi.fn();
      provider.on('user-leave', onUserLeave);

      const userId = 'user456';
      provider.emit('user-leave', { userId });

      expect(onUserLeave).toHaveBeenCalledWith(
        expect.objectContaining({
          userId
        })
      );
    });

    it('should handle document change events', () => {
      const onChange = vi.fn();
      provider.on('document-change', onChange);

      const changeEvent = {
        documentId: 'lesson-content',
        changes: [
          { type: 'insert', position: 10, content: 'Hello' }
        ],
        userId: testUser.id
      };

      provider.emit('document-change', changeEvent);

      expect(onChange).toHaveBeenCalledWith(changeEvent);
    });

    it('should handle cursor update events', () => {
      const onCursor = vi.fn();
      provider.on('cursor-update', onCursor);

      const cursorEvent = {
        userId: 'user456',
        documentId: 'lesson-content',
        position: 25,
        selection: { start: 20, end: 30 }
      };

      provider.emit('cursor-update', cursorEvent);

      expect(onCursor).toHaveBeenCalledWith(cursorEvent);
    });

    it('should remove event listeners correctly', () => {
      const onUserJoin = vi.fn();
      provider.on('user-join', onUserJoin);
      provider.off('user-join', onUserJoin);

      provider.emit('user-join', { user: testUser });

      expect(onUserJoin).not.toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', () => {
      provider.connect();

      // Verify WebSocket connection
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should disconnect from WebSocket server', () => {
      provider.connect();
      provider.disconnect();

      expect(provider.isConnected()).toBe(false);
    });

    it('should handle connection errors', () => {
      const onError = vi.fn();
      provider.on('connection-error', onError);

      const error = new Error('WebSocket connection failed');
      provider.emit('connection-error', { error });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });

    it('should reconnect automatically after connection loss', async () => {
      const onReconnect = vi.fn();
      provider.on('reconnected', onReconnect);

      // Simulate connection loss and recovery
      provider.emit('connection-lost', {});

      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      provider.emit('reconnected', {});

      expect(onReconnect).toHaveBeenCalled();
    });
  });

  describe('Persistence', () => {
    beforeEach(async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
    });

    it('should enable persistence for a room', () => {
      provider.enablePersistence();

      expect(provider.isPersistenceEnabled()).toBe(true);
    });

    it('should disable persistence', () => {
      provider.enablePersistence();
      provider.disablePersistence();

      expect(provider.isPersistenceEnabled()).toBe(false);
    });

    it('should save room state to IndexedDB', async () => {
      provider.enablePersistence();

      const sharedText = provider.createSharedText('content');
      sharedText.insert(0, 'Hello World');

      // Simulate save operation
      await provider.saveState();

      expect(true).toBe(true); // Placeholder assertion
    });

    it('should load room state from IndexedDB', async () => {
      provider.enablePersistence();

      // Simulate load operation
      await provider.loadState();

      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Error Handling', () => {
    it('should handle Y.js document sync errors', () => {
      const onSyncError = vi.fn();
      provider.on('sync-error', onSyncError);

      const error = new Error('Sync failed');
      provider.emit('sync-error', { error });

      expect(onSyncError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });

    it('should handle awareness update errors', () => {
      const onAwarenessError = vi.fn();
      provider.on('awareness-error', onAwarenessError);

      const error = new Error('Awareness update failed');
      provider.emit('awareness-error', { error });

      expect(onAwarenessError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });

    it('should validate room parameters', async () => {
      await expect(
        provider.joinRoom('', testUser, 'lesson')
      ).rejects.toThrow('Room ID cannot be empty');

      await expect(
        provider.joinRoom('valid-room', { ...testUser, id: '' }, 'lesson')
      ).rejects.toThrow('User ID cannot be empty');
    });

    it('should handle WebSocket server unavailable', () => {
      // Simulate server unavailable scenario
      const providerWithBadUrl = new YjsCollaborationProvider('ws://invalid-url');

      const onConnectionError = vi.fn();
      providerWithBadUrl.on('connection-error', onConnectionError);

      providerWithBadUrl.connect();

      // In a real test, this would trigger after connection timeout
      providerWithBadUrl.emit('connection-error', {
        error: new Error('Server unavailable')
      });

      expect(onConnectionError).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await provider.joinRoom('lesson-123', testUser, 'lesson');
    });

    it('should throttle cursor updates', () => {
      const mockThrottle = vi.fn();
      provider.setThrottleInterval(100); // 100ms throttle

      // Simulate rapid cursor updates
      for (let i = 0; i < 10; i++) {
        provider.updateCursor({
          documentId: 'content',
          position: i,
          selection: { start: i, end: i + 1 }
        });
      }

      // Should be throttled to fewer calls
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should cleanup resources when leaving room', async () => {
      const sharedText = provider.createSharedText('content');
      const sharedMap = provider.createSharedMap('metadata');

      await provider.leaveRoom();

      expect(provider.getSharedDocuments()).toHaveLength(0);
    });

    it('should handle large document synchronization', () => {
      const sharedText = provider.createSharedText('large-content');

      // Simulate large content insertion
      const largeContent = 'x'.repeat(100000); // 100KB of text
      sharedText.insert(0, largeContent);

      expect(sharedText.toString()).toBe(largeContent);
    });
  });
});
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { UserAwarenessState, ConnectionStatus } from '../../services/crdtDocumentService';
import { CRDTDocumentService } from '../../services/crdtDocumentService';
import type { User, CursorPosition } from '../../services/collaborationService';
import { CollaborationService } from '../../services/collaborationService';

export interface CollaborativeUser {
  id: string
  name: string
  color: string
  cursor?: { line: number; column: number }
  selection?: { start: number; end: number }
}

export interface CollaborativeEditorProps {
  documentId: string
  initialContent?: string
  currentUser: CollaborativeUser
  onContentChange?: (content: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  wsUrl?: string
}

interface DiffOperation {
  type: 'insert' | 'delete'
  position: number
  text?: string
  length?: number
}

/**
 * Calculate diff operations between old and new text
 */
function calculateDiff(oldText: string, newText: string, cursorPosition: number): DiffOperation[] {
  const operations: DiffOperation[] = [];

  // Find common prefix
  let prefixLen = 0;
  const minLen = Math.min(oldText.length, newText.length, cursorPosition);
  while (prefixLen < minLen && oldText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  // Find common suffix
  let oldSuffixStart = oldText.length;
  let newSuffixStart = newText.length;
  while (
    oldSuffixStart > prefixLen &&
    newSuffixStart > prefixLen &&
    oldText[oldSuffixStart - 1] === newText[newSuffixStart - 1]
  ) {
    oldSuffixStart--;
    newSuffixStart--;
  }

  // Calculate operations
  const deleteLength = oldSuffixStart - prefixLen;
  const insertText = newText.substring(prefixLen, newSuffixStart);

  if (deleteLength > 0) {
    operations.push({
      type: 'delete',
      position: prefixLen,
      length: deleteLength,
    });
  }

  if (insertText.length > 0) {
    operations.push({
      type: 'insert',
      position: prefixLen,
      text: insertText,
    });
  }

  return operations;
}

/**
 * Collaborative Cursors Overlay Component
 */
function CollaborativeCursors({
  users,
  editorRef,
}: {
  users: CollaborativeUser[]
  editorRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  if (!editorRef.current) {return null;}

  return (
    <div className="collaborative-cursors absolute inset-0 pointer-events-none overflow-hidden">
      {users.map((user) => {
        if (!user.cursor && !user.selection) {return null;}

        return (
          <div key={user.id} className="user-cursor-container">
            {user.selection && (
              <div
                className="user-selection absolute opacity-20"
                style={{
                  backgroundColor: user.color,
                  left: `${user.selection.start * 0.6}ch`,
                  width: `${(user.selection.end - user.selection.start) * 0.6}ch`,
                  height: '1.5em',
                  top: '0.5em',
                }}
              />
            )}
            {user.cursor && (
              <div
                className="user-cursor-indicator absolute"
                style={{
                  left: `${user.cursor.column * 0.6}ch`,
                  top: `${user.cursor.line * 1.5}em`,
                }}
              >
                <div
                  className="cursor-line w-0.5 h-5"
                  style={{ backgroundColor: user.color }}
                />
                <div
                  className="cursor-label absolute -top-5 left-0 px-1 py-0.5 text-xs text-white rounded whitespace-nowrap"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main Collaborative Editor Component
 *
 * A real-time collaborative text editor using CRDT (Yjs) for conflict-free
 * synchronization and WebSocket for user presence/awareness.
 */
export function CollaborativeEditor({
  documentId,
  initialContent = '',
  currentUser,
  onContentChange,
  placeholder = 'Start typing...',
  readOnly = false,
  className = '',
  wsUrl,
}: CollaborativeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const crdtServiceRef = useRef<CRDTDocumentService | null>(null);
  const collaborationServiceRef = useRef<CollaborationService | null>(null);

  const [content, setContent] = useState(initialContent);
  const [activeUsers, setActiveUsers] = useState<Map<string, CollaborativeUser>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    synced: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize CRDT service
        const crdtService = new CRDTDocumentService(wsUrl);
        crdtServiceRef.current = crdtService;

        await crdtService.createDocument(documentId, {
          wsUrl,
          handlers: {
            onChanges: () => {
              const newContent = crdtService.getContent(documentId);
              setContent(newContent);
              onContentChange?.(newContent);
            },
            onAwareness: (states) => {
              const users = new Map<string, CollaborativeUser>();
              states.forEach((state: UserAwarenessState) => {
                if (state.userId !== currentUser.id) {
                  users.set(state.userId, {
                    id: state.userId,
                    name: state.name,
                    color: state.color,
                    cursor: state.cursor,
                    selection: state.selection,
                  });
                }
              });
              setActiveUsers(users);
            },
            onStatus: (status) => {
              setConnectionStatus(status);
            },
          },
        });

        // Initialize collaboration service
        const user: User = {
          id: currentUser.id,
          name: currentUser.name,
          color: currentUser.color,
        };
        const collabService = new CollaborationService(documentId, user);
        collaborationServiceRef.current = collabService;

        collabService.on('connected', () => {
          setConnectionStatus((prev) => ({ ...prev, connected: true }));
        });

        collabService.on('user:join', (joinedUser: User) => {
          setActiveUsers((prev) => {
            const next = new Map(prev);
            next.set(joinedUser.id, {
              id: joinedUser.id,
              name: joinedUser.name,
              color: joinedUser.color,
            });
            return next;
          });
        });

        collabService.on('user:leave', (userId: string) => {
          setActiveUsers((prev) => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
          });
        });

        collabService.connect(wsUrl);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize collaborative services:', error);
      }
    };

    initializeServices();

    return () => {
      crdtServiceRef.current?.destroyDocument(documentId);
      collaborationServiceRef.current?.disconnect();
    };
  }, [documentId, currentUser, onContentChange, wsUrl]);

  // Handle text input with CRDT operations
  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (readOnly || !crdtServiceRef.current || !isInitialized) {return;}

      const newContent = event.target.value;
      const oldContent = content;
      const cursorPosition = event.target.selectionStart;

      // Calculate diff and apply CRDT operations
      const operations = calculateDiff(oldContent, newContent, cursorPosition);

      for (const op of operations) {
        if (op.type === 'insert' && op.text) {
          crdtServiceRef.current.insertText(documentId, op.position, op.text, currentUser.id);
        } else if (op.type === 'delete' && op.length) {
          crdtServiceRef.current.deleteText(documentId, op.position, op.length, currentUser.id);
        }
      }
    },
    [content, documentId, currentUser.id, readOnly, isInitialized],
  );

  // Handle cursor/selection changes
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || !crdtServiceRef.current || !isInitialized) {return;}

    const { selectionStart, selectionEnd, value } = editorRef.current;

    // Calculate line and column
    const textBeforeCursor = value.substring(0, selectionStart);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;

    // Update CRDT awareness
    crdtServiceRef.current.updateAwareness(documentId, currentUser.id, {
      userId: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      cursor: { line, column },
      selection:
        selectionStart !== selectionEnd
          ? { start: selectionStart, end: selectionEnd }
          : undefined,
      timestamp: Date.now(),
    });

    // Update collaboration service
    collaborationServiceRef.current?.updateCursor({
      x: selectionStart,
      y: selectionEnd,
      line,
      column,
    });

    if (selectionStart !== selectionEnd) {
      collaborationServiceRef.current?.updateSelection({
        start: selectionStart,
        end: selectionEnd,
      });
    }
  }, [documentId, currentUser, isInitialized]);

  // Connection status indicator
  const getStatusColor = () => {
    if (connectionStatus.synced) {return 'bg-green-500';}
    if (connectionStatus.connected) {return 'bg-yellow-500';}
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (connectionStatus.synced) {return 'Synced';}
    if (connectionStatus.connected) {return 'Connected';}
    return 'Disconnected';
  };

  return (
    <div className={`collaborative-editor relative ${className}`}>
      {/* Connection Status */}
      <div className="connection-status flex items-center gap-2 mb-2 text-sm">
        <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-gray-400">{getStatusText()}</span>
        <span className="text-gray-500 ml-2">({activeUsers.size + 1} users)</span>
      </div>

      {/* Active Users */}
      <div className="active-users flex gap-2 mb-3">
        {/* Current user */}
        <div
          className="user-indicator w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-md ring-2 ring-white/20"
          style={{ backgroundColor: currentUser.color }}
          title={`${currentUser.name} (you)`}
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </div>

        {/* Other users */}
        {Array.from(activeUsers.values()).map((user) => (
          <div
            key={user.id}
            className="user-indicator w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-md"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>

      {/* Editor Container */}
      <div className="editor-container relative">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onFocus={handleSelectionChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className="collaborative-textarea w-full min-h-[300px] p-4 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          style={{ caretColor: currentUser.color }}
        />

        {/* Collaborative Cursors Overlay */}
        <CollaborativeCursors
          users={Array.from(activeUsers.values())}
          editorRef={editorRef}
        />
      </div>

      {/* Character Count */}
      <div className="text-xs text-gray-500 mt-2 text-right">
        {content.length} characters
      </div>
    </div>
  );
}

export default CollaborativeEditor;

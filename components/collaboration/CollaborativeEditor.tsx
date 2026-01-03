/**
 * Collaborative Text Editor Component
 * Real-time collaborative editing using Y.js and a rich text editor
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { useCollaboration } from '@/lib/hooks/useCollaboration';
import { collaborationProvider } from '@/lib/collaboration/yjs-provider';

interface CollaborativeEditorProps {
  roomId: string;
  user: {
    id: string;
    name: string;
    color?: string;
    avatar?: string;
  };
  initialContent?: string;
  placeholder?: string;
  onContentChange?: (content: string) => void;
  className?: string;
}

export default function CollaborativeEditor({
  roomId,
  user,
  initialContent = '',
  placeholder = 'Start typing...',
  onContentChange,
  className = ''
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const isRemoteChangeRef = useRef(false);

  const userWithColor = {
    ...user,
    color: user.color || collaborationProvider.generateUserColor()
  };

  const {
    status,
    isConnected,
    isLoading,
    getSharedText,
    onAwarenessChange
  } = useCollaboration({
    roomId,
    user: userWithColor,
    autoConnect: true
  });

  // Initialize Y.js text document
  useEffect(() => {
    if (!isConnected) return;

    const yText = getSharedText('content');
    if (!yText) return;

    yTextRef.current = yText;

    // Initialize content if empty
    if (yText.length === 0 && initialContent) {
      yText.insert(0, initialContent);
    }

    // Set initial content from shared document
    setContent(yText.toString());

    // Listen for changes from other users
    const handleTextChange = () => {
      if (!isRemoteChangeRef.current) {
        isRemoteChangeRef.current = true;
        const newContent = yText.toString();
        setContent(newContent);
        onContentChange?.(newContent);

        // Preserve cursor position
        if (textareaRef.current) {
          const cursorPos = textareaRef.current.selectionStart;
          textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        }

        setTimeout(() => {
          isRemoteChangeRef.current = false;
        }, 0);
      }
    };

    yText.observe(handleTextChange);

    return () => {
      yText.unobserve(handleTextChange);
    };
  }, [isConnected, getSharedText, initialContent, onContentChange]);

  // Handle local text changes
  const handleContentChange = useCallback((newContent: string) => {
    if (isRemoteChangeRef.current || !yTextRef.current) return;

    const yText = yTextRef.current;
    const currentContent = yText.toString();

    if (newContent !== currentContent) {
      // Calculate the difference and apply minimal changes
      const diffStart = findDiffStart(currentContent, newContent);
      const diffEnd = findDiffEnd(currentContent, newContent);

      if (diffStart !== -1) {
        const deleteLength = currentContent.length - diffEnd - diffStart;
        const insertText = newContent.slice(diffStart, newContent.length - diffEnd);

        // Apply changes to Y.js document
        if (deleteLength > 0) {
          yText.delete(diffStart, deleteLength);
        }
        if (insertText.length > 0) {
          yText.insert(diffStart, insertText);
        }
      }
    }

    setContent(newContent);
    onContentChange?.(newContent);
  }, [onContentChange]);

  // Handle typing awareness
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = onAwarenessChange((users) => {
      const typing = users
        .filter(u => u.id !== user.id && u.id)
        .map(u => u.name)
        .filter(Boolean);
      setTypingUsers(typing);
    });

    return cleanup;
  }, [isConnected, onAwarenessChange, user.id]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // You can add awareness updates here if needed
    }
  }, [isTyping]);

  const handleTypingEnd = useCallback(() => {
    setTimeout(() => {
      setIsTyping(false);
      // You can add awareness updates here if needed
    }, 1000);
  }, []);

  // Utility function to find diff start
  function findDiffStart(str1: string, str2: string): number {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return i === str1.length && i === str2.length ? -1 : i;
  }

  // Utility function to find diff end
  function findDiffEnd(str1: string, str2: string): number {
    let i = str1.length - 1;
    let j = str2.length - 1;
    while (i >= 0 && j >= 0 && str1[i] === str2[j]) {
      i--;
      j--;
    }
    return str1.length - 1 - i;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-md">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isLoading ? 'bg-yellow-500' : isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {status && (
            <span className="text-sm text-gray-500">
              • {status.userCount} user{status.userCount !== 1 ? 's' : ''} online
            </span>
          )}
        </div>

        {/* Active Users */}
        {status && status.users.length > 0 && (
          <div className="flex items-center space-x-1">
            {status.users.slice(0, 5).map((user, index) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {status.users.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-medium text-white">
                +{status.users.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleTypingStart}
          onKeyUp={handleTypingEnd}
          placeholder={placeholder}
          className="w-full h-96 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
          disabled={!isConnected}
        />

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="absolute bottom-2 left-4 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
            {typingUsers.length === 1 ? (
              <>{typingUsers[0]} is typing...</>
            ) : typingUsers.length === 2 ? (
              <>{typingUsers.join(' and ')} are typing...</>
            ) : (
              <>{typingUsers.slice(0, 2).join(', ')} and {typingUsers.length - 2} other{typingUsers.length > 3 ? 's' : ''} are typing...</>
            )}
          </div>
        )}
      </div>

      {/* Editor Info */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <div>
          {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
        </div>
        {isConnected && (
          <div>
            Real-time collaboration enabled
          </div>
        )}
      </div>
    </div>
  );
}
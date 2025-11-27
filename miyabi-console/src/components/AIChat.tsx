/**
 * AI Chat Component - Powered by Vercel AI SDK 6 + Google Gemini
 *
 * Features:
 * - Real-time streaming responses
 * - Code highlighting
 * - Markdown rendering
 * - Message history
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Sparkles, Code, Copy, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartScroll } from '../hooks/useSmartScroll';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function AIChat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Hello. I\'m Miyabi AI Assistant.\n\nI can help you with:\n\n• UI/UX design suggestions\n• Code generation and review\n• Agent orchestration strategies\n• System architecture planning\n\nWhat would you like to create today?',
          },
        ],
      },
    ],
  });

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart scroll behavior
  const { scrollRef, handleScroll } = useSmartScroll(messages);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    focusInput: () => inputRef.current?.focus(),
    clearChat: () => {
      // Note: AI SDK 6 doesn't expose a clear method yet
      // This would need to be implemented with state management
      console.log('Clear chat - to be implemented');
    },
    stopGeneration: () => {
      // Note: AI SDK 6 doesn't expose a stop method yet
      inputRef.current?.blur();
    },
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-black/5 backdrop-blur-xl bg-white/70">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-[#0066CC]" />
          <div>
            <h1 className="text-lg font-light tracking-tight text-[#1D1D1F]">Miyabi AI Assistant</h1>
            <p className="text-xs font-light text-[#86868B]">Powered by Google Gemini 3</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-light text-[#86868B]">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-16 space-y-8" onScroll={handleScroll}>
        <AnimatePresence mode="popLayout">
          {messages.map((message) => {
          const textContent = message.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('');

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl ${
                  message.role === 'user'
                    ? 'bg-[#0066CC]'
                    : 'bg-[#F5F5F7] border border-black/5'
                } rounded-2xl px-6 py-6 shadow-sm`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {message.role === 'assistant' && (
                      <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                    )}
                    <span className="text-xs font-light text-[#86868B]">
                      {message.role === 'user' ? 'You' : 'Miyabi AI'}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(textContent, message.id)}
                    className="p-1 hover:bg-black/5 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#86868B]" />
                    )}
                  </button>
                </div>

                {/* Message Content */}
                <div className={`${message.role === 'user' ? 'text-white font-light' : 'text-[#1D1D1F] font-light'} whitespace-pre-wrap tracking-tight leading-relaxed`}>
                  {textContent.includes('```') ? (
                    <CodeBlock content={textContent} />
                  ) : (
                    textContent
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
        <div ref={scrollRef} />

        {status !== 'ready' && (
          <div className="flex justify-start">
            <div className="bg-[#F5F5F7] border border-black/5 rounded-2xl px-6 py-6">
              <div className="flex items-center space-x-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#0066CC] rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-[#0066CC] rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#0066CC] rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-xs font-light text-[#86868B]">Thinking</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-8 py-6 border-t border-black/5 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput('');
            }
          }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              aria-label="Chat input"
              className="w-full px-6 py-4 bg-[#F5F5F7] border border-black/5 rounded-2xl text-[#1D1D1F] placeholder-[#86868B] font-light tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-transparent transition-all"
              disabled={status !== 'ready'}
            />
          </div>
          <motion.button
            type="submit"
            disabled={status !== 'ready' || !input.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-[#0066CC] text-white rounded-2xl font-light tracking-tight hover:bg-[#0077ED] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </motion.button>
        </form>
        <p className="text-xs font-light text-[#86868B] mt-4 text-center tracking-tight">
          Powered by Google Gemini 3 Pro Preview
        </p>
      </div>
    </div>
  );
}

/**
 * Code Block Component - Renders code with syntax highlighting
 */
function CodeBlock({ content }: { content: string }) {
  const codeBlocks = content.split('```');

  return (
    <div className="space-y-3">
      {codeBlocks.map((block, index) => {
        if (index % 2 === 0) {
          // Regular text
          return <div key={index}>{block}</div>;
        } else {
          // Code block
          const lines = block.split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n');

          return (
            <div key={index} className="my-3">
              <div className="flex items-center justify-between px-4 py-2 bg-black/40 rounded-t-lg border-b border-white/10">
                <span className="text-xs text-purple-400 font-mono">{language || 'code'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-xs text-white/50 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-4 bg-black/60 rounded-b-lg overflow-x-auto">
                <code className="text-sm text-gray-300 font-mono">
                  {code}
                </code>
              </pre>
            </div>
          );
        }
      })}
    </div>
  );
}

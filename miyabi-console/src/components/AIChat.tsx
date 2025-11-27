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
import { useState } from 'react';

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-slate-400" />
          <div>
            <h1 className="text-lg font-light tracking-tight text-slate-50">Miyabi AI Assistant</h1>
            <p className="text-xs font-extralight text-slate-400">Powered by Google Gemini 3</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-light text-slate-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-16 space-y-8">
        {messages.map((message) => {
          const textContent = message.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('');

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-white/5 backdrop-blur-md border border-white/10'
                } rounded-2xl px-6 py-6 shadow-sm`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {message.role === 'assistant' && (
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="text-xs font-light text-slate-400">
                      {message.role === 'user' ? 'You' : 'Miyabi AI'}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(textContent, message.id)}
                    className="p-1 hover:bg-white/5 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Message Content */}
                <div className={`${message.role === 'user' ? 'text-white font-light' : 'text-slate-50 font-extralight'} whitespace-pre-wrap tracking-tight leading-relaxed`}>
                  {textContent.includes('```') ? (
                    <CodeBlock content={textContent} />
                  ) : (
                    textContent
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {status !== 'ready' && (
          <div className="flex justify-start">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-6">
              <div className="flex items-center space-x-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-xs font-light text-slate-400">Thinking</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-8 py-6 border-t border-white/10">
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
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-slate-50 placeholder-slate-500 font-light tracking-tight focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent transition-all"
              disabled={status !== 'ready'}
            />
          </div>
          <button
            type="submit"
            disabled={status !== 'ready' || !input.trim()}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-light tracking-tight hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
        <p className="text-xs font-extralight text-slate-500 mt-4 text-center tracking-tight">
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

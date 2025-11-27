/**
 * AI Chat Component - Powered by Vercel AI SDK + Google Gemini
 *
 * Features:
 * - Real-time streaming responses
 * - Code highlighting
 * - Markdown rendering
 * - Message history
 */

import { useChat } from 'ai/react';
import { Send, Sparkles, Code, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function AIChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: '👋 Hello! I\'m Miyabi AI Assistant. I can help you with:\n\n- UI/UX design suggestions\n- Code generation and review\n- Agent orchestration strategies\n- System architecture planning\n\nWhat would you like to create today?',
      },
    ],
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            <div className="absolute inset-0 blur-xl bg-purple-400/30" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Miyabi AI Assistant</h1>
            <p className="text-sm text-gray-400">Powered by Google Gemini 3</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                  : 'bg-white/10 backdrop-blur-sm border border-white/10'
              } rounded-2xl px-6 py-4 shadow-lg`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {message.role === 'assistant' && (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="text-xs font-semibold text-white/70">
                    {message.role === 'user' ? 'You' : 'Miyabi AI'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedId === message.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/50" />
                  )}
                </button>
              </div>

              {/* Message Content */}
              <div className="text-white whitespace-pre-wrap">
                {message.content.includes('```') ? (
                  <CodeBlock content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-white/50">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about UI/UX, code, or agents..."
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <Code className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
        </form>
        <p className="text-xs text-white/30 mt-3 text-center">
          Powered by Google Gemini 3 Pro Preview • Context-aware AI assistant
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

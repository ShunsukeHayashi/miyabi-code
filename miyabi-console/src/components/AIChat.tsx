/**
 * AI Chat Component - Placeholder
 *
 * This component will provide AI chat functionality.
 * Currently shows a coming soon message until AI SDK is configured.
 */

import { Send, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello. I\'m Miyabi AI Assistant.\n\nI can help you with:\n\n• UI/UX design suggestions\n• Code generation and review\n• Agent orchestration strategies\n• System architecture planning\n\nNote: AI functionality requires VITE_GEMINI_API_KEY to be configured.',
  },
];

export function AIChat() {
  const [messages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - actual implementation pending
    console.log('AI Chat submit:', input);
    setInput('');
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
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          <span className="text-xs font-light text-[#86868B]">Setup Required</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-16 space-y-8">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              <div className="flex items-center space-x-2 mb-3">
                {message.role === 'assistant' && (
                  <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                )}
                <span className="text-xs font-light text-[#86868B]">
                  {message.role === 'user' ? 'You' : 'Miyabi AI'}
                </span>
              </div>
              <div className={`${message.role === 'user' ? 'text-white font-light' : 'text-[#1D1D1F] font-light'} whitespace-pre-wrap tracking-tight leading-relaxed`}>
                {message.content}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="px-8 py-6 border-t border-black/5 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              aria-label="Chat input"
              className="w-full px-6 py-4 bg-[#F5F5F7] border border-black/5 rounded-2xl text-[#1D1D1F] placeholder-[#86868B] font-light tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-transparent transition-all"
              disabled
            />
          </div>
          <motion.button
            type="submit"
            disabled={true}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-[#0066CC] text-white rounded-2xl font-light tracking-tight hover:bg-[#0077ED] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </motion.button>
        </form>
        <p className="text-xs font-light text-[#86868B] mt-4 text-center tracking-tight">
          Configure VITE_GEMINI_API_KEY to enable AI chat
        </p>
      </div>
    </div>
  );
}

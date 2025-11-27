/**
 * Smart Scroll Hook - Auto-scroll with user intent detection
 *
 * Automatically scrolls to bottom on new messages, but respects user's
 * manual scroll position. Only auto-scrolls when user is near bottom.
 */

import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: string;
  parts: Array<{ type: string; text: string }>;
}

export const useSmartScroll = (messages: Message[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  return { scrollRef, handleScroll };
};

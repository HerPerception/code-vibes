import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: string;
  typingUsers: string[];
  onToggleReaction: (messageId: string, emoji: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  typingUsers,
  onToggleReaction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll to bottom on message updates
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, typingUsers]);

  // Initial scroll without animation
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      id="message-container"
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col relative hide-scrollbar select-none"
    >
      {/* Date Divider */}
      <div className="flex justify-center w-full my-4">
        <span
          id="date-divider-today"
          className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase bg-surface-variant/80 dark:bg-surface-container-high/90 border border-outline-variant/50 rounded-full px-3.5 py-1 shadow-2xs"
        >
          Today
        </span>
      </div>

      {/* Message Stream */}
      <div className="space-y-1">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const nextMessage = messages[index + 1];

          const isFirstInGroup =
            !prevMessage ||
            prevMessage.user !== message.user ||
            prevMessage.type === 'system';

          const isLastInGroup =
            !nextMessage ||
            nextMessage.user !== message.user ||
            nextMessage.type === 'system';

          return (
            <MessageItem
              key={message.id || `msg-${index}`}
              message={message}
              currentUser={currentUser}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              onToggleReaction={onToggleReaction}
            />
          );
        })}
      </div>

      {/* Real-Time Typing Indicator Bubble */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 mt-2 ml-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-surface-variant text-on-surface border border-outline-variant/40 rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-2 shadow-xs">
            <span className="text-xs font-medium text-on-surface-variant">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Floating Jump to Latest Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-24 right-6 sm:right-8 bg-surface dark:bg-surface-container border border-outline-variant text-primary hover:text-on-primary hover:bg-primary p-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 z-20 flex items-center gap-1.5 text-xs font-semibold"
          title="Jump to latest message"
        >
          <ChevronDown className="w-4 h-4" />
          <span className="hidden sm:inline">Latest</span>
        </button>
      )}
    </div>
  );
};

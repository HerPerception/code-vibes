import React, { useState } from 'react';
import {
  FileText,
  Download,
  Smile,
  CheckCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
  currentUser: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🎉', '🔥', '👏'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUser,
  isFirstInGroup,
  isLastInGroup,
  onToggleReaction,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isMe = message.user === currentUser;

  if (message.type === 'system') {
    return (
      <div className="flex justify-center w-full my-3">
        <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container-high/80 dark:bg-surface-variant/80 border border-outline-variant/40 rounded-full px-3 py-1 shadow-2xs">
          {message.msg} • {message.timestamp}
        </span>
      </div>
    );
  }

  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div
      id={`msg-row-${message.id}`}
      className={`group relative flex w-full ${
        isMe ? 'justify-end' : 'justify-start'
      } ${isLastInGroup ? 'mb-4' : 'mb-1'} px-1`}
    >
      <div
        className={`flex flex-col gap-1 max-w-[88%] sm:max-w-[75%] md:max-w-[65%] ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* Recipient User Label (Only shown on first message in contiguous cluster) */}
        {!isMe && isFirstInGroup && (
          <div className="flex items-center gap-2 ml-2 mb-0.5">
            {message.avatar && (
              <img
                src={message.avatar}
                alt={message.user}
                className="w-4 h-4 rounded-full object-cover border border-outline-variant"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <span className="text-xs font-semibold text-on-surface-variant">{message.user}</span>
          </div>
        )}

        {/* Message Bubble Container */}
        <div className="relative group/bubble flex items-center">
          {/* Quick Reaction Trigger Toolbar on Hover (Left side for Me, Right side for Recipient) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-150 z-20 flex items-center bg-surface border border-outline-variant rounded-full shadow-md px-1 py-0.5 gap-0.5 ${
              isMe ? '-left-24 sm:-left-28' : '-right-24 sm:-right-28'
            }`}
          >
            {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction(message.id, emoji)}
                className="hover:scale-125 transition-transform p-1 text-xs"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 hover:bg-surface-variant rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
              title="More emojis"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expanded Emoji Picker Dropdown */}
          {showEmojiPicker && (
            <div
              className={`absolute bottom-full mb-1 z-30 flex gap-1 p-1.5 bg-surface border border-outline-variant rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
                isMe ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onToggleReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1.5 hover:bg-surface-variant rounded-lg text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Actual Chat Bubble */}
          <div
            className={`p-3.5 sm:p-4 text-sm sm:text-[14.5px] leading-relaxed transition-all ${
              isMe
                ? 'bg-primary text-on-primary rounded-2xl rounded-tr-xs shadow-[0_4px_12px_rgba(0,0,0,0.15)] font-normal select-text'
                : 'bg-surface-variant/90 dark:bg-surface-variant text-on-surface rounded-2xl rounded-tl-xs border border-outline-variant/50 shadow-xs font-normal select-text'
            }`}
          >
            {/* Image Attachment Preview */}
            {message.attachment && message.attachment.type.startsWith('image/') && (
              <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-sm">
                <img
                  src={message.attachment.url}
                  alt={message.attachment.name}
                  className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(message.attachment?.url, '_blank')}
                />
                <div className="text-[11px] p-1.5 bg-black/40 text-white truncate flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{message.attachment.name}</span>
                </div>
              </div>
            )}

            {/* Document/File Attachment */}
            {message.attachment && !message.attachment.type.startsWith('image/') && (
              <div
                className={`mb-2 p-2.5 rounded-xl flex items-center gap-3 border ${
                  isMe
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-surface border-outline-variant text-on-surface'
                }`}
              >
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{message.attachment.name}</div>
                  <div className="text-[10px] opacity-70">
                    {message.attachment.size || 'Attachment file'}
                  </div>
                </div>
                <a
                  href={message.attachment.url}
                  download={message.attachment.name}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  title="Download attachment"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Message Text */}
            {message.msg && <p className="whitespace-pre-wrap break-words">{message.msg}</p>}
          </div>
        </div>

        {/* Emoji Reactions Bar */}
        {hasReactions && (
          <div className="flex flex-wrap gap-1 mt-1 z-10">
            {Object.entries(reactions).map(([emoji, userList]) => {
              const users = (userList || []) as string[];
              if (!users || users.length === 0) return null;
              const hasReacted = users.includes(currentUser);
              return (
                <button
                  key={emoji}
                  id={`reaction-${message.id}-${emoji}`}
                  onClick={() => onToggleReaction(message.id, emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border ${
                    hasReacted
                      ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                      : 'bg-surface-variant/80 border-outline-variant/60 text-on-surface hover:bg-surface-variant'
                  }`}
                  title={`${users.join(', ')} reacted with ${emoji}`}
                >
                  <span>{emoji}</span>
                  <span className="text-[11px] opacity-80">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Timestamp & Status (Shown on last message in group) */}
        {isLastInGroup && (
          <div
            className={`flex items-center gap-1 text-[11px] text-on-surface-variant opacity-70 ${
              isMe ? 'mr-1' : 'ml-1'
            }`}
          >
            <span>{message.timestamp}</span>
            {isMe && <CheckCheck className="w-3.5 h-3.5 text-primary" />}
          </div>
        )}
      </div>
    </div>
  );
};

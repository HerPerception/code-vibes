import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, X, File, Image, Sparkles, Smile } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, attachment?: { name: string; url: string; type: string; size?: string }) => void;
  onTyping: () => void;
  isConnected: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onTyping, isConnected }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<{
    name: string;
    url: string;
    type: string;
    size?: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && !attachment) return;

    onSendMessage(text, attachment || undefined);
    setText('');
    setAttachment(null);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      setAttachment({
        name: file.name,
        url,
        type: file.type || 'application/octet-stream',
        size: sizeStr,
      });
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be re-selected if desired
    e.target.value = '';
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const COMMON_EMOJIS = ['👍', '❤️', '🚀', '🎉', '🔥', '👏', '😊', '💡', '✨', '🙌', '💯', '🤩'];

  return (
    <footer
      id="chat-footer-bar"
      className="bg-surface border-t border-outline-variant px-3 sm:px-6 py-2.5 sm:py-3 z-30 shrink-0 select-none transition-colors duration-200"
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        {/* Attachment Preview Chip */}
        {attachment && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-variant/80 border border-outline-variant rounded-xl self-start max-w-sm animate-in fade-in zoom-in-95 duration-150">
            {attachment.type.startsWith('image/') ? (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-7 h-7 rounded-lg object-cover border border-outline-variant"
              />
            ) : (
              <div className="p-1 rounded bg-primary/20 text-primary">
                <File className="w-4 h-4" />
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-on-surface truncate">{attachment.name}</span>
              <span className="text-[10px] text-on-surface-variant">{attachment.size}</span>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3 relative">
          {/* File Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.json,.ts,.js,.py,.txt"
          />
          <button
            type="button"
            id="attach-file-btn"
            aria-label="Attach file"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors flex-shrink-0 border border-transparent hover:border-outline-variant"
            title="Attach an image, document, or code file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input Container with Floating Emoji Trigger */}
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              id="message-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              autoComplete="off"
              className="w-full bg-surface-container-lowest dark:bg-background border border-outline-variant rounded-full py-3 pl-4 pr-10 text-sm sm:text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-on-surface-variant/70 shadow-2xs"
            />

            {/* Quick Emoji Picker Button Inside Input */}
            <button
              type="button"
              id="emoji-picker-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 text-on-surface-variant hover:text-on-surface p-1 rounded-full transition-colors"
              title="Insert emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Emoji Selector Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-40 grid grid-cols-6 gap-1 animate-in fade-in zoom-in-95 duration-150">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="p-2 text-lg hover:bg-surface-variant rounded-xl hover:scale-125 transition-transform text-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Send Button */}
          <button
            type="submit"
            id="send-message-btn"
            aria-label="Send message"
            disabled={!text.trim() && !attachment}
            className={`w-11 h-11 sm:w-12 sm:h-12 bg-primary hover:bg-primary/90 text-on-primary rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0 ${
              !text.trim() && !attachment ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
            }`}
            title="Send (Enter)"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </footer>
  );
};

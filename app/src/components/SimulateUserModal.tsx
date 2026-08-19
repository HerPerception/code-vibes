import React, { useState } from 'react';
import { Send, UserPlus, X, Sparkles, MessageSquare } from 'lucide-react';

interface SimulateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSimulatedMessage: (sender: string, text: string, avatar?: string) => void;
  currentRoom: string;
}

const TEAMMATES = [
  {
    name: 'Sarah Jenkins',
    role: 'Design Systems Lead',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    quickResponses: [
      'Just uploaded the updated component library spec! 🎨',
      'The fluid grid spacing matches our 4px baseline perfectly.',
      'Looks awesome. Let us sync in 5 minutes.',
    ],
  },
  {
    name: 'Devin Vance',
    role: 'Frontend Architect',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    quickResponses: [
      'WebSocket latency is under 15ms. Super responsive! ⚡',
      'Tested the reconnection logic—it gracefully handles temporary drops.',
      'The Python FastAPI backend is handling concurrent room broadcasts seamlessly.',
    ],
  },
  {
    name: 'Maya Patel',
    role: 'Full Stack Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    quickResponses: [
      'All unit tests for the WebSocket connection manager are passing.',
      'Great work everyone! Ready for the production deployment 🚀',
      'Sending over the revised endpoint documentation.',
    ],
  },
];

export const SimulateUserModal: React.FC<SimulateUserModalProps> = ({
  isOpen,
  onClose,
  onSendSimulatedMessage,
  currentRoom,
}) => {
  const [selectedTeammate, setSelectedTeammate] = useState(TEAMMATES[0]);
  const [customMessage, setCustomMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    onSendSimulatedMessage(selectedTeammate.name, text.trim(), selectedTeammate.avatar);
    setCustomMessage('');
    onClose();
  };

  return (
    <div
      id="simulateUserModal"
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-surface-container-lowest dark:bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-outline-variant overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-variant/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Simulate Teammate Message</h2>
              <p className="text-xs text-on-surface-variant">
                Broadcast a real WebSocket message into #{currentRoom} as another user
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Teammate Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">Select Sender:</label>
            <div className="grid grid-cols-3 gap-2">
              {TEAMMATES.map((tm) => {
                const isSelected = selectedTeammate.name === tm.name;
                return (
                  <button
                    key={tm.name}
                    type="button"
                    onClick={() => setSelectedTeammate(tm)}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-primary font-semibold shadow-xs'
                        : 'bg-surface-variant/40 border-outline-variant/60 hover:bg-surface-variant text-on-surface'
                    }`}
                  >
                    <img
                      src={tm.avatar}
                      alt={tm.name}
                      className="w-9 h-9 rounded-full object-cover mb-1 border border-outline-variant"
                    />
                    <span className="text-xs truncate w-full">{tm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Replies */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">
              Quick Suggestions from {selectedTeammate.name.split(' ')[0]}:
            </label>
            <div className="space-y-1.5">
              {selectedTeammate.quickResponses.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qr)}
                  className="w-full text-left p-2.5 rounded-xl bg-surface-variant/60 hover:bg-primary/10 hover:border-primary/40 border border-outline-variant/50 text-xs text-on-surface transition-all flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{qr}</span>
                  <Send className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Input */}
          <div className="space-y-1.5 pt-2 border-t border-outline-variant">
            <label className="text-xs font-semibold text-on-surface">Or Custom Message:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend(customMessage);
                }}
                placeholder={`Type message as ${selectedTeammate.name}...`}
                className="flex-1 bg-surface dark:bg-background border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <button
                onClick={() => handleSend(customMessage)}
                disabled={!customMessage.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

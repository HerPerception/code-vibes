import React, { useState } from 'react';
import { User, X, Check, Sparkles } from 'lucide-react';

interface DisplayNameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSaveName: (name: string, avatar?: string) => void;
}

const PRESET_USERS = [
  {
    name: 'Alex Chen',
    role: 'Product Designer',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRm5CjlPHKbKf963nwnhNu0dyni3BDZ5Xt8EbSOydtxYK-D3U3sU_wlhIePQZdwWO1BbSBZb7CbpgwvOiuVm1mgAx9GAmg-w2ICsPPUletrocevgKv9r-a36Ppv8IyF2TvZDxjhtOOrNPMfZBY_TlG5Qfae2PVDNzjb733yVxKacfQc_7iyaQbQ-1QlWK17kJUXjSbaS2yFLby6IU6_DZAQ2K95fWwaExTxtgfJOXKr3Q8Rc0ze-F1',
  },
  {
    name: 'Sarah Jenkins',
    role: 'Design Systems Lead',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    name: 'Devin Vance',
    role: 'Frontend Architect',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    name: 'Maya Patel',
    role: 'Full Stack Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
];

export const DisplayNameModal: React.FC<DisplayNameModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onSaveName,
}) => {
  const [name, setName] = useState(currentName || 'Alex Chen');
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveName(name.trim(), selectedAvatar);
    onClose();
  };

  const selectPreset = (presetName: string, avatarUrl: string) => {
    setName(presetName);
    setSelectedAvatar(avatarUrl);
  };

  return (
    <div
      id="displayNameModal"
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-surface-container-lowest dark:bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-outline-variant overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header & Avatar */}
        <div className="p-6 sm:p-7 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-container/20 dark:bg-primary-container rounded-full mx-auto flex items-center justify-center mb-1 text-primary shadow-xs">
              <User className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              Welcome to ConnectFlow
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Please enter a display name to join the real-time conversation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-xs font-semibold text-on-surface ml-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Chen"
                autoFocus
                className="w-full bg-surface dark:bg-background border border-outline-variant rounded-xl py-3 px-4 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-on-surface-variant ml-1">
                Quick Personas:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_USERS.map((preset) => {
                  const isSelected = name === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => selectPreset(preset.name, preset.avatar)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary font-medium shadow-xs'
                          : 'bg-surface-variant/50 border-outline-variant/60 hover:bg-surface-variant text-on-surface'
                      }`}
                    >
                      <img
                        src={preset.avatar}
                        alt={preset.name}
                        className="w-7 h-7 rounded-full object-cover border border-outline-variant"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{preset.name}</div>
                        <div className="text-[10px] text-on-surface-variant truncate">
                          {preset.role}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Join Chat
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

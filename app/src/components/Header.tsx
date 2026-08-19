import React from 'react';
import {
  Code2,
  Moon,
  Sun,
  Radio,
  Users,
  Sparkles,
  ChevronDown,
  Hash,
} from 'lucide-react';
import { Room, ThemeMode } from '../types';

interface HeaderProps {
  userName: string;
  avatarUrl: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenNameModal: () => void;
  onOpenPythonModal: () => void;
  onOpenSimulateModal: () => void;
  currentRoom: string;
  onSelectRoom: (roomId: string) => void;
  rooms: Room[];
  onlineCount: number;
  isConnected: boolean;
  latency: number;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  avatarUrl,
  theme,
  onToggleTheme,
  onOpenNameModal,
  onOpenPythonModal,
  onOpenSimulateModal,
  currentRoom,
  onSelectRoom,
  rooms,
  onlineCount,
  isConnected,
  latency,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const currentRoomObj = rooms.find((r) => r.id === currentRoom) || rooms[0];

  return (
    <header
      id="main-top-header"
      className="bg-surface border-b border-outline-variant flex justify-between items-center px-4 sm:px-6 h-16 w-full z-30 shrink-0 select-none transition-colors duration-200"
    >
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3">
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-variant md:hidden transition-colors"
          title="Toggle channels"
        >
          <Hash className="w-5 h-5 text-primary" />
        </button>

        <div className="flex items-center gap-2">
          <div
            id="brand-logo"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm"
          >
            C
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-primary">ConnectFlow</h1>
              <span
                id="ws-badge"
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}
                title={`WebSocket Latency: ~${latency}ms`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isConnected ? 'WS Live' : 'Reconnecting...'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <span className="font-medium text-primary">#{currentRoomObj.name}</span>
              <span className="opacity-50">•</span>
              <span className="hidden sm:inline">{currentRoomObj.description}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Room Selector (Desktop) */}
      <div className="hidden lg:flex items-center gap-1 bg-surface-variant/50 p-1 rounded-xl border border-outline-variant/60">
        {rooms.map((r) => {
          const isActive = r.id === currentRoom;
          return (
            <button
              key={r.id}
              id={`room-tab-${r.id}`}
              onClick={() => onSelectRoom(r.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span>#</span>
              <span>{r.name}</span>
            </button>
          );
        })}
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Python FastAPI Code Viewer Trigger */}
        <button
          id="python-code-btn"
          onClick={onOpenPythonModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-primary border border-primary/20 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-xs"
          title="View and download full Python FastAPI WebSocket script"
        >
          <Code2 className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Python Server</span>
        </button>

        {/* Simulate Teammate Trigger */}
        <button
          id="simulate-user-btn"
          onClick={onOpenSimulateModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-variant hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
          title="Send test WebSocket messages as another user"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Simulate User</span>
        </button>

        {/* Theme Mode Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant border border-outline-variant transition-all active:scale-90"
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* User Profile / Display Name Button */}
        <button
          id="user-profile-btn"
          onClick={onOpenNameModal}
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-surface-variant transition-colors border border-transparent hover:border-outline-variant text-left"
          title="Click to change your display name"
        >
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-medium text-xs text-on-surface leading-none">{userName}</span>
            <span className="text-[10px] text-emerald-500 font-medium leading-tight">Online</span>
          </div>

          <div className="w-8 h-8 rounded-full relative overflow-hidden bg-surface-variant flex items-center justify-center border border-outline-variant shadow-xs">
            <img
              id="current-user-avatar"
              alt={`${userName} Profile`}
              className="object-cover w-full h-full"
              src={avatarUrl}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Status indicator */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface" />
          </div>
        </button>
      </div>
    </header>
  );
};

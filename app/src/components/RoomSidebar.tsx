import React from 'react';
import {
  Hash,
  Users,
  Activity,
  Server,
  Layers,
  ChevronRight,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { Room, OnlineUser } from '../types';

interface RoomSidebarProps {
  rooms: Room[];
  currentRoom: string;
  onSelectRoom: (roomId: string) => void;
  onlineUsers: OnlineUser[];
  currentUser: string;
  isOpen: boolean;
  onClose: () => void;
  latency: number;
  isConnected: boolean;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({
  rooms,
  currentRoom,
  onSelectRoom,
  onlineUsers,
  currentUser,
  isOpen,
  onClose,
  latency,
  isConnected,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-30 md:hidden animate-in fade-in"
        />
      )}

      <aside
        id="channel-sidebar"
        className={`w-72 sm:w-80 bg-surface border-r border-outline-variant flex flex-col shrink-0 z-40 transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl' : 'fixed inset-y-0 left-0 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">
              Channels & Workspace
            </span>
          </div>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            {rooms.length} Channels
          </span>
        </div>

        {/* Channels List */}
        <div className="p-3 space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase px-2 mb-1 block">
            Channels
          </span>
          {rooms.map((room) => {
            const isActive = room.id === currentRoom;
            return (
              <button
                key={room.id}
                id={`sidebar-room-${room.id}`}
                onClick={() => {
                  onSelectRoom(room.id);
                  onClose();
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold shadow-xs'
                    : 'text-on-surface hover:bg-surface-variant/70'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-on-primary' : 'text-primary'}`} />
                  <div className="truncate">
                    <div className="text-xs truncate">{room.name}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-white/80' : 'text-on-surface-variant'
                      }`}
                    >
                      {room.description}
                    </div>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-white/90" />}
              </button>
            );
          })}
        </div>

        {/* Online Members List */}
        <div className="flex-1 overflow-y-auto p-3 border-t border-outline-variant/60">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Online in #{currentRoom}</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
              {onlineUsers.length || 1}
            </span>
          </div>

          <div className="space-y-1">
            {/* Current user */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-variant/40 border border-outline-variant/30">
              <div className="w-7 h-7 rounded-full bg-primary/20 relative shrink-0 overflow-hidden">
                <img
                  src={
                    currentUser === 'Alex Chen'
                      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRm5CjlPHKbKf963nwnhNu0dyni3BDZ5Xt8EbSOydtxYK-D3U3sU_wlhIePQZdwWO1BbSBZb7CbpgwvOiuVm1mgAx9GAmg-w2ICsPPUletrocevgKv9r-a36Ppv8IyF2TvZDxjhtOOrNPMfZBY_TlG5Qfae2PVDNzjb733yVxKacfQc_7iyaQbQ-1QlWK17kJUXjSbaS2yFLby6IU6_DZAQ2K95fWwaExTxtgfJOXKr3Q8Rc0ze-F1'
                      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser)}`
                  }
                  alt={currentUser}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-surface" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-on-surface truncate flex items-center gap-1">
                  <span>{currentUser}</span>
                  <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.1 rounded font-normal">
                    You
                  </span>
                </div>
                <div className="text-[10px] text-emerald-500 font-medium">Active now</div>
              </div>
            </div>

            {/* Other online participants */}
            {onlineUsers
              .filter((u) => u.user !== currentUser)
              .map((u, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-variant/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-surface-variant relative shrink-0 overflow-hidden border border-outline-variant">
                    <img
                      src={
                        u.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.user)}`
                      }
                      alt={u.user}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-surface" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-on-surface truncate">{u.user}</div>
                    <div className="text-[10px] text-on-surface-variant">Connected</div>
                  </div>
                </div>
              ))}

            {onlineUsers.filter((u) => u.user !== currentUser).length === 0 && (
              <div className="p-3 text-center text-xs text-on-surface-variant bg-surface-variant/20 rounded-xl mt-2">
                Open this app in another browser tab to chat in real-time with yourself, or use "Simulate User" above!
              </div>
            )}
          </div>
        </div>

        {/* Server & Engine Telemetry Footer */}
        <div className="p-3.5 bg-surface-variant/40 border-t border-outline-variant text-[11px] text-on-surface-variant space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span>WebSocket State:</span>
            </span>
            <span className="font-semibold text-emerald-500">
              {isConnected ? 'Connected' : 'Reconnecting'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>Transport Latency:</span>
            </span>
            <span className="font-mono font-medium text-on-surface">~{latency} ms</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-on-surface-variant/70 pt-1 border-t border-outline-variant/30">
            <span>FastAPI Protocol: ws:// & wss://</span>
            <span>Room: #{currentRoom}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

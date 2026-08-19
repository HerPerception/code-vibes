import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { DisplayNameModal } from './components/DisplayNameModal';
import { PythonScriptModal } from './components/PythonScriptModal';
import { SimulateUserModal } from './components/SimulateUserModal';
import { RoomSidebar } from './components/RoomSidebar';
import { useWebSocketChat } from './hooks/useWebSocketChat';
import { Room, ThemeMode } from './types';

const INITIAL_ROOMS: Room[] = [
  {
    id: 'general',
    name: 'general',
    description: 'Main project updates and design reviews',
  },
  {
    id: 'design-systems',
    name: 'design-systems',
    description: 'Tokens, component library, and Figma specs',
  },
  {
    id: 'backend-engine',
    name: 'backend-engine',
    description: 'FastAPI, WebSockets, and low-latency scaling',
  },
  {
    id: 'random',
    name: 'random',
    description: 'Watercooler chat and informal discussions',
  },
];

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBRm5CjlPHKbKf963nwnhNu0dyni3BDZ5Xt8EbSOydtxYK-D3U3sU_wlhIePQZdwWO1BbSBZb7CbpgwvOiuVm1mgAx9GAmg-w2ICsPPUletrocevgKv9r-a36Ppv8IyF2TvZDxjhtOOrNPMfZBY_TlG5Qfae2PVDNzjb733yVxKacfQc_7iyaQbQ-1QlWK17kJUXjSbaS2yFLby6IU6_DZAQ2K95fWwaExTxtgfJOXKr3Q8Rc0ze-F1';

export default function App() {
  // Theme state (Dark by default matching Obsidian Indigo screenshot)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('connectflow_theme');
    return (saved as ThemeMode) || 'dark';
  });

  // User identity state
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('connectflow_username') || 'Alex Chen';
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('connectflow_avatar') || DEFAULT_AVATAR;
  });

  // Current channel/room
  const [currentRoom, setCurrentRoom] = useState<string>('general');

  // Modal states
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Apply dark class to root document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('connectflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSaveName = (newName: string, newAvatar?: string) => {
    setUserName(newName);
    localStorage.setItem('connectflow_username', newName);
    if (newAvatar) {
      setAvatarUrl(newAvatar);
      localStorage.setItem('connectflow_avatar', newAvatar);
    } else {
      const generatedAvatar =
        newName === 'Alex Chen'
          ? DEFAULT_AVATAR
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newName)}`;
      setAvatarUrl(generatedAvatar);
      localStorage.setItem('connectflow_avatar', generatedAvatar);
    }
  };

  // Real-time WebSocket hook
  const {
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    latency,
    sendMessage,
    notifyTyping,
    toggleReaction,
    sendSimulatedMessage,
  } = useWebSocketChat({
    room: currentRoom,
    userName,
    avatarUrl,
  });

  return (
    <div
      id="connectflow-app"
      className="h-screen w-screen overflow-hidden flex flex-col bg-background text-on-background transition-colors duration-200"
    >
      {/* Top Header Bar */}
      <Header
        userName={userName}
        avatarUrl={avatarUrl}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNameModal={() => setIsNameModalOpen(true)}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
        currentRoom={currentRoom}
        onSelectRoom={setCurrentRoom}
        rooms={INITIAL_ROOMS}
        onlineCount={onlineUsers.length}
        isConnected={isConnected}
        latency={latency}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Channel & Member Sidebar */}
        <RoomSidebar
          rooms={INITIAL_ROOMS}
          currentRoom={currentRoom}
          onSelectRoom={setCurrentRoom}
          onlineUsers={onlineUsers}
          currentUser={userName}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          latency={latency}
          isConnected={isConnected}
        />

        {/* Chat Stream & Input Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
          <MessageList
            messages={messages}
            currentUser={userName}
            typingUsers={typingUsers}
            onToggleReaction={toggleReaction}
          />

          <ChatInput
            onSendMessage={sendMessage}
            onTyping={notifyTyping}
            isConnected={isConnected}
          />
        </main>
      </div>

      {/* Modals & Dialogs */}
      <DisplayNameModal
        isOpen={isNameModalOpen}
        currentName={userName}
        onClose={() => setIsNameModalOpen(false)}
        onSaveName={handleSaveName}
      />

      <PythonScriptModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      <SimulateUserModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSendSimulatedMessage={sendSimulatedMessage}
        currentRoom={currentRoom}
      />
    </div>
  );
}

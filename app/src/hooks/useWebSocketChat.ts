import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, OnlineUser } from '../types';

interface UseWebSocketChatProps {
  room: string;
  userName: string;
  avatarUrl: string;
}

export function useWebSocketChat({ room, userName, avatarUrl }: UseWebSocketChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [latency, setLatency] = useState<number>(12);

  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSelfTypingRef = useRef<boolean>(false);

  // Initialize and maintain WebSocket connection
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (socketRef.current) {
        socketRef.current.close();
      }

      setConnectionStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?room=${encodeURIComponent(room)}&user=${encodeURIComponent(
        userName
      )}&avatar=${encodeURIComponent(avatarUrl)}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        const startTime = Date.now();

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setConnectionStatus('connected');
          setLatency(Math.max(8, Date.now() - startTime));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'history') {
              setMessages(data.messages || []);
              if (data.online_users) {
                setOnlineUsers(data.online_users);
              }
            } else if (data.type === 'typing') {
              if (data.user && data.user !== userName) {
                if (data.is_typing) {
                  setTypingUsers((prev) => (prev.includes(data.user) ? prev : [...prev, data.user]));
                } else {
                  setTypingUsers((prev) => prev.filter((u) => u !== data.user));
                }
              }
            } else if (data.type === 'reaction_update') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === data.message_id ? { ...msg, reactions: data.reactions } : msg
                )
              );
            } else if (data.type === 'system') {
              setMessages((prev) => [...prev, data]);
              if (data.online_users) {
                setOnlineUsers(data.online_users);
              }
            } else {
              // New chat message or image
              setMessages((prev) => {
                // Prevent duplicate addition
                if (prev.some((m) => m.id === data.id)) {
                  return prev;
                }
                return [...prev, data];
              });
              // Remove user from typing once message is received
              if (data.user) {
                setTypingUsers((prev) => prev.filter((u) => u !== data.user));
              }
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setConnectionStatus('disconnected');
          // Try auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 3000);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket encountered an issue, reconnecting...', err);
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        setConnectionStatus('disconnected');
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [room, userName, avatarUrl]);

  // Send message
  const sendMessage = useCallback(
    (text: string, attachment?: { name: string; url: string; type: string; size?: string }) => {
      if (!text.trim() && !attachment) return;

      const messagePayload = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        room,
        user: userName,
        avatar: avatarUrl,
        msg: text.trim(),
        type: attachment?.type?.startsWith('image/') ? 'image' : 'message',
        attachment,
      };

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(messagePayload));
      } else {
        // Optimistic local fallback if socket is reconnecting
        setMessages((prev) => [
          ...prev,
          {
            ...messagePayload,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            type: messagePayload.type as any,
          },
        ]);
      }

      // Stop typing state
      if (isSelfTypingRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
        isSelfTypingRef.current = false;
      }
    },
    [room, userName, avatarUrl]
  );

  // Send typing indicator with debounce
  const notifyTyping = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    if (!isSelfTypingRef.current) {
      isSelfTypingRef.current = true;
      socketRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
      }
      isSelfTypingRef.current = false;
    }, 2000);
  }, []);

  // Send emoji reaction
  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'reaction',
            message_id: messageId,
            emoji,
          })
        );
      } else {
        // Local state update fallback
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            const reactions = { ...(msg.reactions || {}) };
            if (!reactions[emoji]) reactions[emoji] = [];
            const userIndex = reactions[emoji].indexOf(userName);
            if (userIndex > -1) {
              reactions[emoji].splice(userIndex, 1);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji].push(userName);
            }
            return { ...msg, reactions };
          })
        );
      }
    },
    [userName]
  );

  // Helper to send a simulated message (e.g. from Sarah Jenkins) for testing
  const sendSimulatedMessage = useCallback(
    (senderName: string, text: string, senderAvatar?: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const payload = {
          id: `sim-${Date.now()}`,
          room,
          user: senderName,
          avatar: senderAvatar || `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150`,
          msg: text,
          type: 'message',
        };
        socketRef.current.send(JSON.stringify(payload));
      }
    },
    [room]
  );

  return {
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    connectionStatus,
    latency,
    sendMessage,
    notifyTyping,
    toggleReaction,
    sendSimulatedMessage,
  };
}

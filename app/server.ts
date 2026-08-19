import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ClientMeta {
  user: string;
  room: string;
  avatar: string;
}

interface ChatMessage {
  id: string;
  room: string;
  user: string;
  avatar?: string;
  msg: string;
  timestamp: string;
  type: 'message' | 'system' | 'typing' | 'image' | 'reaction' | 'reaction_update';
  attachment?: {
    name: string;
    url: string;
    type: string;
    size?: string;
  };
  reactions?: Record<string, string[]>;
}

// In-memory message store per room
const messageHistory: Record<string, ChatMessage[]> = {
  general: [
    {
      id: 'init-1',
      room: 'general',
      user: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      msg: 'Hey Alex! Are we still on for the design review meeting at 2 PM? I have some updates on the component library.',
      timestamp: '1:15 PM',
      type: 'message',
      reactions: { '👍': ['Alex Chen'] },
    },
    {
      id: 'init-2',
      room: 'general',
      user: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      msg: "Yes, absolutely. I'm looking forward to seeing the new changes, especially how the fluid grid turned out on mobile viewports.",
      timestamp: '1:17 PM',
      type: 'message',
      reactions: {},
    },
    {
      id: 'init-3',
      room: 'general',
      user: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      msg: "I'll bring the updated JSON spec sheet so we can compare notes.",
      timestamp: '1:18 PM',
      type: 'message',
      reactions: {},
    },
    {
      id: 'init-4',
      room: 'general',
      user: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      msg: 'Perfect. See you in the main channel! 🚀',
      timestamp: '1:20 PM',
      type: 'message',
      reactions: { '❤️': ['Alex Chen'] },
    },
  ],
};

const clientMetaMap = new Map<WebSocket, ClientMeta>();

function getOnlineUsers(room: string) {
  const users: { user: string; avatar: string }[] = [];
  const seen = new Set<string>();
  for (const [, meta] of clientMetaMap.entries()) {
    if (meta.room === room && !seen.has(meta.user)) {
      seen.add(meta.user);
      users.push({ user: meta.user, avatar: meta.avatar });
    }
  }
  return users;
}

function broadcastToRoom(
  wss: WebSocketServer,
  room: string,
  data: any,
  excludeWs?: WebSocket
) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      const meta = clientMetaMap.get(client);
      if (meta && meta.room === room) {
        client.send(payload);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // HTTP API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ConnectFlow WebSocket Real-Time Gateway',
      time: new Date().toISOString(),
    });
  });

  // Endpoint to fetch python code
  app.get('/api/python-code', (req, res) => {
    try {
      const pythonFile = path.join(process.cwd(), 'main.py');
      if (fs.existsSync(pythonFile)) {
        const code = fs.readFileSync(pythonFile, 'utf-8');
        res.json({ code });
      } else {
        res.json({ code: '# Python script not found' });
      }
    } catch (e) {
      res.status(500).json({ error: 'Failed to read Python file' });
    }
  });

  // Get Room history
  app.get('/api/rooms/:roomId/messages', (req, res) => {
    const { roomId } = req.params;
    const messages = messageHistory[roomId] || [];
    const online = getOnlineUsers(roomId);
    res.json({ room: roomId, messages, online_users: online });
  });

  const server = http.createServer(app);

  // WebSocket Server on the same HTTP port (3000)
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const room = url.searchParams.get('room') || 'general';
    const user = url.searchParams.get('user') || 'Alex Chen';
    const avatar =
      url.searchParams.get('avatar') ||
      (user === 'Alex Chen'
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRm5CjlPHKbKf963nwnhNu0dyni3BDZ5Xt8EbSOydtxYK-D3U3sU_wlhIePQZdwWO1BbSBZb7CbpgwvOiuVm1mgAx9GAmg-w2ICsPPUletrocevgKv9r-a36Ppv8IyF2TvZDxjhtOOrNPMfZBY_TlG5Qfae2PVDNzjb733yVxKacfQc_7iyaQbQ-1QlWK17kJUXjSbaS2yFLby6IU6_DZAQ2K95fWwaExTxtgfJOXKr3Q8Rc0ze-F1'
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user)}`);

    clientMetaMap.set(ws, { user, room, avatar });

    if (!messageHistory[room]) {
      messageHistory[room] = [];
    }

    // Send history + online list to the connected client
    ws.send(
      JSON.stringify({
        type: 'history',
        room,
        messages: messageHistory[room],
        online_users: getOnlineUsers(room),
      })
    );

    // Broadcast join notification
    broadcastToRoom(
      wss,
      room,
      {
        type: 'system',
        room,
        user: 'System',
        msg: `${user} joined the chat room`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        online_users: getOnlineUsers(room),
      },
      ws
    );

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        const meta = clientMetaMap.get(ws) || { user, room, avatar };

        if (data.type === 'typing') {
          broadcastToRoom(
            wss,
            meta.room,
            {
              type: 'typing',
              user: meta.user,
              is_typing: data.is_typing ?? true,
            },
            ws
          );
        } else if (data.type === 'reaction') {
          const { message_id, emoji } = data;
          const roomMsgs = messageHistory[meta.room] || [];
          const targetMsg = roomMsgs.find((m) => m.id === message_id);
          if (targetMsg) {
            if (!targetMsg.reactions) targetMsg.reactions = {};
            if (!targetMsg.reactions[emoji]) targetMsg.reactions[emoji] = [];
            const userIdx = targetMsg.reactions[emoji].indexOf(meta.user);
            if (userIdx > -1) {
              targetMsg.reactions[emoji].splice(userIdx, 1);
              if (targetMsg.reactions[emoji].length === 0) {
                delete targetMsg.reactions[emoji];
              }
            } else {
              targetMsg.reactions[emoji].push(meta.user);
            }

            broadcastToRoom(wss, meta.room, {
              type: 'reaction_update',
              message_id,
              reactions: targetMsg.reactions,
            });
          }
        } else if (data.type === 'message' || data.type === 'image') {
          const newMsg: ChatMessage = {
            id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            room: meta.room,
            user: meta.user,
            avatar: meta.avatar,
            msg: data.msg || '',
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            type: data.type || 'message',
            attachment: data.attachment,
            reactions: {},
          };

          if (!messageHistory[meta.room]) messageHistory[meta.room] = [];
          messageHistory[meta.room].push(newMsg);
          if (messageHistory[meta.room].length > 200) {
            messageHistory[meta.room].shift();
          }

          // Broadcast to everyone including sender
          const payload = JSON.stringify(newMsg);
          for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
              const cMeta = clientMetaMap.get(client);
              if (cMeta && cMeta.room === meta.room) {
                client.send(payload);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      const meta = clientMetaMap.get(ws);
      clientMetaMap.delete(ws);
      if (meta) {
        broadcastToRoom(wss, meta.room, {
          type: 'system',
          room: meta.room,
          user: 'System',
          msg: `${meta.user} left the conversation`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          online_users: getOnlineUsers(meta.room),
        });
      }
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ConnectFlow Server with WebSockets listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

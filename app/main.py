"""
ConnectFlow - Real-Time Chat Server with FastAPI and WebSockets
================================================================
A high-performance, asynchronous real-time chat server implementing WebSockets
for instantaneous messaging updates, presence tracking, typing indicators,
and room-based communication.

Requirements:
    pip install fastapi uvicorn websockets pydantic

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import json
import time
from typing import Dict, List, Optional, Set
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# PYDANTIC DATA MODELS
# -----------------------------------------------------------------------------
class ChatMessage(BaseModel):
    id: str
    room: str = "general"
    user: str
    avatar: Optional[str] = None
    msg: str
    timestamp: str
    type: str = "message"  # message | system | typing | image | reaction
    reactions: Optional[Dict[str, List[str]]] = Field(default_factory=dict)


class JoinPayload(BaseModel):
    user: str
    room: Optional[str] = "general"
    avatar: Optional[str] = None


# -----------------------------------------------------------------------------
# WEBSOCKET CONNECTION & ROOM MANAGER
# -----------------------------------------------------------------------------
class ConnectionManager:
    """
    Manages active WebSocket connections across rooms, handles broadcasts,
    tracks online presence, and persists in-memory message history.
    """

    def __init__(self):
        # room_id -> list of active WebSocket connections
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        # websocket -> {user: str, room: str, avatar: str}
        self.connection_meta: Dict[WebSocket, Dict[str, str]] = {}
        # room_id -> list of serialized message dicts (in-memory buffer)
        self.message_history: Dict[str, List[dict]] = {
            "general": [
                {
                    "id": "init-1",
                    "room": "general",
                    "user": "Sarah Jenkins",
                    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                    "msg": "Hey Alex! Are we still on for the design review meeting at 2 PM? I have some updates on the component library.",
                    "timestamp": "1:15 PM",
                    "type": "message",
                    "reactions": {"👍": ["Alex Chen"]},
                },
                {
                    "id": "init-2",
                    "room": "general",
                    "user": "Alex Chen",
                    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    "msg": "Yes, absolutely. I'm looking forward to seeing the new changes, especially how the fluid grid turned out on mobile viewports.",
                    "timestamp": "1:17 PM",
                    "type": "message",
                    "reactions": {},
                },
                {
                    "id": "init-3",
                    "room": "general",
                    "user": "Alex Chen",
                    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    "msg": "I'll bring the updated JSON spec sheet so we can compare notes.",
                    "timestamp": "1:18 PM",
                    "type": "message",
                    "reactions": {},
                },
                {
                    "id": "init-4",
                    "room": "general",
                    "user": "Sarah Jenkins",
                    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                    "msg": "Perfect. See you in the main channel! 🚀",
                    "timestamp": "1:20 PM",
                    "type": "message",
                    "reactions": {"❤️": ["Alex Chen"]},
                },
            ]
        }

    async def connect(self, websocket: WebSocket, room: str, user: str, avatar: Optional[str] = None):
        """Accepts WebSocket connection, tracks metadata and room allocation."""
        await websocket.accept()
        if room not in self.active_rooms:
            self.active_rooms[room] = []
            if room not in self.message_history:
                self.message_history[room] = []

        self.active_rooms[room].append(websocket)
        self.connection_meta[websocket] = {
            "user": user,
            "room": room,
            "avatar": avatar or f"https://api.dicebear.com/7.x/initials/svg?seed={user}",
        }

        # Send full message history to the newly connected user
        history = self.message_history.get(room, [])
        await websocket.send_json({
            "type": "history",
            "room": room,
            "messages": history,
            "online_users": self.get_online_users(room)
        })

        # Broadcast join notification to others in the room
        await self.broadcast_to_room(
            room,
            {
                "type": "system",
                "room": room,
                "user": "System",
                "msg": f"{user} joined the chat room",
                "timestamp": datetime.now().strftime("%-I:%M %p"),
                "online_users": self.get_online_users(room)
            },
            exclude=websocket
        )

    def disconnect(self, websocket: WebSocket) -> Optional[Dict[str, str]]:
        """Handles connection termination and cleanup."""
        meta = self.connection_meta.pop(websocket, None)
        if meta:
            room = meta.get("room")
            if room and room in self.active_rooms and websocket in self.active_rooms[room]:
                self.active_rooms[room].remove(websocket)
                if not self.active_rooms[room]:
                    # Keep history intact, but clean up empty room connection array
                    del self.active_rooms[room]
        return meta

    def get_online_users(self, room: str) -> List[Dict[str, str]]:
        """Returns the list of currently connected unique users in a room."""
        users = []
        seen = set()
        for ws, meta in self.connection_meta.items():
            if meta.get("room") == room:
                u = meta.get("user")
                if u and u not in seen:
                    seen.add(u)
                    users.append({
                        "user": u,
                        "avatar": meta.get("avatar", "")
                    })
        return users

    async def broadcast_to_room(self, room: str, message: dict, exclude: Optional[WebSocket] = None):
        """Sends a JSON message to all clients connected to a specific room."""
        if room not in self.active_rooms:
            return

        # Store in-memory if it is a permanent message
        if message.get("type") in ["message", "image"]:
            if room not in self.message_history:
                self.message_history[room] = []
            self.message_history[room].append(message)
            # Limit history to 200 items per room
            if len(self.message_history[room]) > 200:
                self.message_history[room].pop(0)

        dead_connections = []
        for connection in self.active_rooms[room]:
            if connection == exclude:
                continue
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


# Initialize global connection manager
manager = ConnectionManager()

# Create FastAPI app
app = FastAPI(
    title="ConnectFlow Real-Time Chat API",
    description="WebSocket & REST backend for instantaneous chat room messaging",
    version="1.0.0"
)

# Enable CORS for cross-origin frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# REST ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ConnectFlow WebSocket Engine", "timestamp": time.time()}


@app.get("/api/rooms/{room_id}/messages")
async def get_messages(room_id: str = "general"):
    """Fetch stored message history for a given room."""
    return {
        "room": room_id,
        "messages": manager.message_history.get(room_id, []),
        "online_users": manager.get_online_users(room_id)
    }


@app.post("/api/rooms/{room_id}/messages")
async def post_message_rest(room_id: str, payload: ChatMessage):
    """Optional REST fallback to post messages and broadcast via WebSockets."""
    msg_dict = payload.model_dump()
    await manager.broadcast_to_room(room_id, msg_dict)
    return {"status": "sent", "message": msg_dict}


# -----------------------------------------------------------------------------
# WEBSOCKET ENDPOINT
# -----------------------------------------------------------------------------
@app.websocket("/ws/{room_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    room_id: str = "general",
    user: str = Query(default="Alex Chen"),
    avatar: Optional[str] = Query(default=None)
):
    """
    Main WebSocket endpoint for instantaneous real-time chat communication.
    
    Protocol Events:
    - Incoming 'message': Broadcasts chat message to room
    - Incoming 'typing': Broadcasts typing status indicator
    - Incoming 'reaction': Adds reaction to message ID and updates clients
    """
    await manager.connect(websocket, room=room_id, user=user, avatar=avatar)
    try:
        while True:
            # Receive raw text/json from client
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                # Raw text fallback
                data = {
                    "type": "message",
                    "msg": raw_data,
                    "user": user
                }

            msg_type = data.get("type", "message")

            if msg_type == "typing":
                # Broadcast typing indicator (do not save to history)
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "typing",
                        "user": user,
                        "is_typing": data.get("is_typing", True)
                    },
                    exclude=websocket
                )

            elif msg_type == "reaction":
                # Handle emoji reactions
                msg_id = data.get("message_id")
                emoji = data.get("emoji")
                if msg_id and emoji:
                    history = manager.message_history.get(room_id, [])
                    for m in history:
                        if m.get("id") == msg_id:
                            if "reactions" not in m or m["reactions"] is None:
                                m["reactions"] = {}
                            if emoji not in m["reactions"]:
                                m["reactions"][emoji] = []
                            if user in m["reactions"][emoji]:
                                m["reactions"][emoji].remove(user)
                                if not m["reactions"][emoji]:
                                    del m["reactions"][emoji]
                            else:
                                m["reactions"][emoji].append(user)
                            # Broadcast reaction update
                            await manager.broadcast_to_room(
                                room_id,
                                {
                                    "type": "reaction_update",
                                    "message_id": msg_id,
                                    "reactions": m["reactions"]
                                }
                            )
                            break

            else:
                # Standard chat message or attachment
                formatted_message = {
                    "id": data.get("id") or f"msg-{int(time.time()*1000)}",
                    "room": room_id,
                    "user": user,
                    "avatar": manager.connection_meta.get(websocket, {}).get("avatar"),
                    "msg": data.get("msg", ""),
                    "timestamp": datetime.now().strftime("%-I:%M %p"),
                    "type": data.get("type", "message"),
                    "attachment": data.get("attachment", None),
                    "reactions": {}
                }
                # Broadcast to everyone in the room including sender
                await manager.broadcast_to_room(room_id, formatted_message)

    except WebSocketDisconnect:
        meta = manager.disconnect(websocket)
        if meta:
            user_left = meta.get("user", user)
            left_room = meta.get("room", room_id)
            await manager.broadcast_to_room(
                left_room,
                {
                    "type": "system",
                    "room": left_room,
                    "user": "System",
                    "msg": f"{user_left} left the conversation",
                    "timestamp": datetime.now().strftime("%-I:%M %p"),
                    "online_users": manager.get_online_users(left_room)
                }
            )


# -----------------------------------------------------------------------------
# EMBEDDED STANDALONE HTML CLIENT (OPTIONAL DIRECT ACCESS)
# -----------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serves an embedded single-file client if accessed directly via browser."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ConnectFlow - Real-Time Chat Server</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-6 font-sans">
        <div class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div class="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl text-white mb-4 shadow-lg shadow-indigo-500/30">
                C
            </div>
            <h1 class="text-2xl font-bold text-white mb-2">ConnectFlow WebSocket Server</h1>
            <p class="text-slate-400 text-sm mb-6 leading-relaxed">
                The Python FastAPI WebSocket server is running and ready for real-time instantaneous messaging updates.
            </p>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left font-mono text-xs text-indigo-300 space-y-2 mb-6">
                <div><span class="text-slate-500">WebSocket URL:</span> ws://localhost:8000/ws/{room_id}?user={name}</div>
                <div><span class="text-slate-500">REST API:</span> GET /api/rooms/general/messages</div>
                <div><span class="text-slate-500">Status:</span> <span class="text-emerald-400">Online & Ready</span></div>
            </div>
            <div class="text-xs text-slate-500">
                Connect your React or web frontend to the WebSocket endpoint for instant messaging.
            </div>
        </div>
    </body>
    </html>
    """


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting ConnectFlow Real-Time Chat Server on http://0.0.0.0:8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

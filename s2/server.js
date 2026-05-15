// server/signaling-server.js
// Run with: node server/signaling-server.js
// Or integrate into your Next.js custom server

const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

// rooms: { roomId: Set<WebSocket> }
const rooms = new Map();

function broadcast(roomId, message, excludeClient = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(message);
  room.forEach((client) => {
    if (client !== excludeClient && client.readyState === 1) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      // ── Join a room ──────────────────────────────────────────────
      case 'join': {
        const { roomId } = msg;
        currentRoom = roomId;

        if (!rooms.has(roomId)) rooms.set(roomId, new Set());
        const room = rooms.get(roomId);

        if (room.size >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
          return;
        }

        room.add(ws);
        const isInitiator = room.size === 1;

        ws.send(JSON.stringify({ type: 'joined', roomId, isInitiator }));

        // Tell the other peer someone joined
        if (!isInitiator) {
          broadcast(roomId, { type: 'peer-joined' }, ws);
        }
        break;
      }

      // ── WebRTC signaling passthrough ──────────────────────────────
      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        broadcast(currentRoom, msg, ws);
        break;
      }

      // ── Hang up ───────────────────────────────────────────────────
      case 'hang-up': {
        broadcast(currentRoom, { type: 'hang-up' }, ws);
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        rooms.delete(currentRoom);
      } else {
        broadcast(currentRoom, { type: 'peer-left' });
      }
    }
  });
});

console.log('WebSocket signaling server running on ws://localhost:8080');
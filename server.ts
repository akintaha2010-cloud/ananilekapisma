import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

interface RoomPeer {
  peerId: string;
  slotIndex: number;
  name: string;
  costume: {
    colorId: string;
    fesStyle: string;
    mustacheStyle: string;
  };
  isHost: boolean;
  ws: WebSocket;
}

interface OnlineRoom {
  code: string;
  hostPeerId: string;
  mode: string;
  mapId: string;
  lives: number;
  roundDurationSec: number;
  botsEnabled: boolean;
  inGame: boolean;
  peers: RoomPeer[];
  createdAt: number;
}

const rooms = new Map<string, OnlineRoom>();
const socketToPeer = new Map<WebSocket, { roomCode: string; peerId: string }>();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return `K${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

function generatePeerId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

function serializeRoom(room: OnlineRoom) {
  return {
    code: room.code,
    hostPeerId: room.hostPeerId,
    mode: room.mode,
    mapId: room.mapId,
    lives: room.lives,
    roundDurationSec: room.roundDurationSec,
    botsEnabled: room.botsEnabled,
    inGame: room.inGame,
    peers: room.peers.map((p) => ({
      peerId: p.peerId,
      slotIndex: p.slotIndex,
      name: p.name,
      costume: p.costume,
      isHost: p.isHost,
    })),
  };
}

function sendJson(ws: WebSocket, data: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastRoomState(room: OnlineRoom) {
  const payload = { type: 'room_state', room: serializeRoom(room) };
  for (const peer of room.peers) {
    sendJson(peer.ws, payload);
  }
}

function removePeerFromRoom(ws: WebSocket) {
  const meta = socketToPeer.get(ws);
  if (!meta) return;
  socketToPeer.delete(ws);

  const room = rooms.get(meta.roomCode);
  if (!room) return;

  const idx = room.peers.findIndex((p) => p.peerId === meta.peerId);
  if (idx === -1) return;
  const [removed] = room.peers.splice(idx, 1);

  if (room.peers.length === 0) {
    rooms.delete(room.code);
    return;
  }

  // Reassign host if host disconnected
  if (removed.isHost || room.hostPeerId === removed.peerId) {
    room.peers[0].isHost = true;
    room.hostPeerId = room.peers[0].peerId;
  }

  for (const peer of room.peers) {
    sendJson(peer.ws, { type: 'peer_left', peerId: removed.peerId });
  }
  broadcastRoomState(room);
}

function buildIceServers() {
  const iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }> = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const turnUrlsRaw = process.env.TURN_URLS?.trim();
  const hasTurn = Boolean(turnUrlsRaw);
  if (turnUrlsRaw) {
    const urls = turnUrlsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length > 0) {
      iceServers.push({
        urls,
        ...(process.env.TURN_USERNAME ? { username: process.env.TURN_USERNAME } : {}),
        ...(process.env.TURN_CREDENTIAL ? { credential: process.env.TURN_CREDENTIAL } : {}),
      });
    }
  }

  return { iceServers, hasTurn, wsRelayAvailable: true };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  app.get('/api/ice-servers', (_req, res) => {
    res.json(buildIceServers());
  });

  app.get('/api/rooms/:code', (req, res) => {
    const code = String(req.params.code || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ exists: false, message: 'Oda bulunamadı.' });
      return;
    }
    res.json({
      exists: true,
      code: room.code,
      playerCount: room.peers.length,
      maxPlayers: 4,
      inGame: room.inGame,
      mode: room.mode,
      mapId: room.mapId,
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'ping') {
        sendJson(ws, { type: 'pong', ts: Date.now() });
        return;
      }

      if (type === 'create_room') {
        removePeerFromRoom(ws);
        const code = generateRoomCode();
        const peerId = generatePeerId();
        const costume = (msg.costume as RoomPeer['costume']) ?? {
          colorId: 'crimson',
          fesStyle: 'klasik_fes',
          mustacheStyle: 'pala',
        };
        const peer: RoomPeer = {
          peerId,
          slotIndex: 0,
          name: String(msg.name || 'Kurucu').slice(0, 12),
          costume,
          isHost: true,
          ws,
        };
        const room: OnlineRoom = {
          code,
          hostPeerId: peerId,
          mode: String(msg.mode || 'ffa'),
          mapId: String(msg.mapId || 'classic'),
          lives: Math.max(1, Math.min(5, Number(msg.lives || 3))),
          roundDurationSec: Math.max(30, Math.min(180, Number(msg.roundDurationSec || 60))),
          botsEnabled: Boolean(msg.botsEnabled ?? true),
          inGame: false,
          peers: [peer],
          createdAt: Date.now(),
        };
        rooms.set(code, room);
        socketToPeer.set(ws, { roomCode: code, peerId });
        sendJson(ws, {
          type: 'room_joined',
          peerId,
          slotIndex: 0,
          room: serializeRoom(room),
        });
        return;
      }

      if (type === 'join_room') {
        removePeerFromRoom(ws);
        const code = String(msg.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          sendJson(ws, {
            type: 'room_error',
            message: 'Bu davet koduna ait aktif bir oda bulunamadı.',
          });
          return;
        }
        if (room.peers.length >= 4) {
          sendJson(ws, {
            type: 'room_error',
            message: 'Oda dolu (en fazla 4 oyuncu katılabilir).',
          });
          return;
        }
        if (room.inGame) {
          sendJson(ws, {
            type: 'room_error',
            message: 'Bu odadaki karşılaşma şu anda devam ediyor.',
          });
          return;
        }

        const usedSlots = new Set(room.peers.map((p) => p.slotIndex));
        let slotIndex = 0;
        while (usedSlots.has(slotIndex) && slotIndex < 4) slotIndex++;

        const peerId = generatePeerId();
        const costume = (msg.costume as RoomPeer['costume']) ?? {
          colorId: 'cobalt',
          fesStyle: 'puskullu_fes',
          mustacheStyle: 'kaytan',
        };
        const peer: RoomPeer = {
          peerId,
          slotIndex,
          name: String(msg.name || `Oyuncu ${slotIndex + 1}`).slice(0, 12),
          costume,
          isHost: false,
          ws,
        };
        room.peers.push(peer);
        socketToPeer.set(ws, { roomCode: code, peerId });

        sendJson(ws, {
          type: 'room_joined',
          peerId,
          slotIndex,
          room: serializeRoom(room),
        });
        broadcastRoomState(room);
        return;
      }

      const meta = socketToPeer.get(ws);
      if (!meta) return;
      const room = rooms.get(meta.roomCode);
      if (!room) return;
      const sender = room.peers.find((p) => p.peerId === meta.peerId);
      if (!sender) return;

      if (type === 'leave_room') {
        removePeerFromRoom(ws);
        return;
      }

      if (type === 'update_peer_profile') {
        if (typeof msg.name === 'string') {
          sender.name = msg.name.trim().slice(0, 12) || sender.name;
        }
        if (msg.costume && typeof msg.costume === 'object') {
          sender.costume = msg.costume as RoomPeer['costume'];
        }
        broadcastRoomState(room);
        return;
      }

      if (type === 'update_room_config') {
        if (!sender.isHost) return;
        if (typeof msg.mode === 'string') room.mode = msg.mode;
        if (typeof msg.mapId === 'string') room.mapId = msg.mapId;
        if (typeof msg.lives === 'number') {
          room.lives = Math.max(1, Math.min(5, msg.lives));
        }
        if (typeof msg.roundDurationSec === 'number') {
          room.roundDurationSec = Math.max(30, Math.min(180, msg.roundDurationSec));
        }
        if (typeof msg.botsEnabled === 'boolean') {
          room.botsEnabled = msg.botsEnabled;
        }
        broadcastRoomState(room);
        return;
      }

      if (type === 'start_match') {
        if (!sender.isHost) return;
        room.inGame = true;
        broadcastRoomState(room);
        for (const peer of room.peers) {
          sendJson(peer.ws, {
            type: 'match_started',
            room: serializeRoom(room),
          });
        }
        return;
      }

      if (type === 'end_match') {
        if (!sender.isHost) return;
        room.inGame = false;
        broadcastRoomState(room);
        return;
      }

      if (type === 'rtc_signal') {
        const targetId = String(msg.targetPeerId || '');
        const target = room.peers.find((p) => p.peerId === targetId);
        if (target) {
          sendJson(target.ws, {
            type: 'rtc_signal',
            fromPeerId: sender.peerId,
            signal: msg.signal,
          });
        }
        return;
      }

      if (type === 'relay_packet') {
        const targetId = msg.targetPeerId ? String(msg.targetPeerId) : null;
        const packet = {
          type: 'relay_packet',
          fromPeerId: sender.peerId,
          payload: msg.payload,
        };
        if (targetId) {
          const target = room.peers.find((p) => p.peerId === targetId);
          if (target) sendJson(target.ws, packet);
        } else {
          for (const peer of room.peers) {
            if (peer.peerId !== sender.peerId) {
              sendJson(peer.ws, packet);
            }
          }
        }
      }
    });

    ws.on('close', () => {
      removePeerFromRoom(ws);
    });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Kale Kapmaca sunucusu http://0.0.0.0:${PORT} adresinde hazır`);
  });
}

startServer().catch((err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});

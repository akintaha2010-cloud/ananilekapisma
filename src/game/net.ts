import Peer, { DataConnection } from 'peerjs';
import {
  CostumeConfig,
  GameModeId,
  MapId,
  OnlinePeerInfo,
  OnlineRoomState,
  PeerTransportStatus,
  PlayerInputState,
  RoundResult,
  SimulationState,
} from './types';

export interface NetSnapshot {
  seq: number;
  elapsedSec: number;
  timeRemainingSec: number;
  hazardPhase: SimulationState['hazardPhase'];
  trauma: number;
  windForce: number;
  frictionFactor: number;
  players: {
    slotIndex: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 1 | -1;
    grounded: boolean;
    stunTimer: number;
    pancakeTimer: number;
    invulnTimer: number;
    shieldTimer: number;
    abilityCooldown: number;
    flashTimer: number;
    squashX: number;
    squashY: number;
    jiggleAmp: number;
    jigglePhase: number;
    airTilt: number;
    blinkTimer: number;
    walkCycle: number;
    tasselAngle: number;
    alive: boolean;
    eliminated: boolean;
    lives: number;
    score: number;
    kills: number;
    deaths: number;
    stomps: number;
    jumpsUsed: number;
    jumpsMade: number;
  }[];
  platforms: {
    id: string;
    x: number;
    y: number;
    crumbleState: 'solid' | 'shaking' | 'fallen';
  }[];
  cannons: SimulationState['cannons'];
  events: SimulationState['pendingEvents'];
  crown?: { holder: number | null; x?: number; y?: number; held: Record<number, number> };
}

export interface NetCallbacks {
  onRoomUpdated: (room: OnlineRoomState | null, myPeerId: string | null) => void;
  onError: (message: string) => void;
  onMatchStarted: (room: OnlineRoomState) => void;
  onGuestInput: (slotIndex: number, input: PlayerInputState) => void;
  onSnapshotReceived: (snap: NetSnapshot) => void;
  onMatchEnded: (result: RoundResult) => void;
}

const ID_PREFIX = 'kalekapmaca-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

type Msg = Record<string, unknown>;

/**
 * Serverless online play: the host's browser is the room (PeerJS id = prefix + room code),
 * guests connect to it directly over WebRTC. Works on static hosting like GitHub Pages.
 */
export class OnlineClient {
  private peer: Peer | null = null;
  private myPeerId: string | null = null;
  private room: OnlineRoomState | null = null;
  private conns = new Map<string, DataConnection>();
  private hostConn: DataConnection | null = null;
  private callbacks: NetCallbacks;
  private snapSeq = 0;

  constructor(callbacks: NetCallbacks) {
    this.callbacks = callbacks;
  }

  public getRoom(): OnlineRoomState | null {
    return this.room;
  }

  public getMyPeerId(): string | null {
    return this.myPeerId;
  }

  public isHost(): boolean {
    return Boolean(this.room && this.myPeerId && this.room.hostPeerId === this.myPeerId);
  }

  // PeerJS's default ICE config ships public STUN + TURN servers.
  public hasTurnConfigured(): boolean {
    return true;
  }

  private openPeer(id?: string): Promise<Peer> {
    return new Promise((resolve, reject) => {
      const peer = id ? new Peer(id) : new Peer();
      const fail = (err: { type?: string }) => {
        peer.destroy();
        reject(err);
      };
      peer.once('open', () => {
        peer.off('error', fail);
        resolve(peer);
      });
      peer.once('error', fail);
    });
  }

  private watchPeer(peer: Peer) {
    peer.on('error', (err: { type?: string }) => {
      if (err.type === 'peer-unavailable') {
        this.callbacks.onError('Bu davet koduna ait aktif bir oda bulunamadı.');
      } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
        this.callbacks.onError('Bağlantı sunucusuna ulaşılamadı. İnternetini kontrol et.');
      }
    });
  }

  public async createRoom(params: {
    name: string;
    costume: CostumeConfig;
    mode: GameModeId;
    mapId: MapId;
    lives: number;
    roundDurationSec: number;
    botsEnabled: boolean;
  }) {
    this.leaveRoom();
    let peer: Peer | null = null;
    let code = '';
    for (let attempt = 0; attempt < 5 && !peer; attempt++) {
      code = randomCode();
      try {
        peer = await this.openPeer(ID_PREFIX + code);
      } catch (err) {
        if ((err as { type?: string }).type !== 'unavailable-id') {
          this.callbacks.onError('Oda açılamadı. İnternet bağlantını kontrol et.');
          return;
        }
      }
    }
    if (!peer) {
      this.callbacks.onError('Oda açılamadı, tekrar dene.');
      return;
    }
    this.peer = peer;
    this.watchPeer(peer);
    this.myPeerId = peer.id;
    this.room = {
      code,
      hostPeerId: peer.id,
      mode: params.mode,
      mapId: params.mapId,
      lives: Math.max(1, Math.min(5, params.lives || 3)),
      roundDurationSec: Math.max(30, Math.min(180, params.roundDurationSec || 60)),
      botsEnabled: params.botsEnabled,
      inGame: false,
      peers: [{ peerId: peer.id, slotIndex: 0, name: (params.name || 'Kurucu').slice(0, 12), costume: params.costume, isHost: true }],
    };
    peer.on('connection', (conn) => this.acceptGuest(conn));
    this.emitDecoratedRoom();
  }

  private acceptGuest(conn: DataConnection) {
    conn.on('data', (raw) => this.handleHostMessage(conn, raw as Msg));
    conn.on('close', () => this.dropGuest(conn.peer));
    conn.on('error', () => this.dropGuest(conn.peer));
  }

  private dropGuest(peerId: string) {
    this.conns.delete(peerId);
    if (!this.room) return;
    const before = this.room.peers.length;
    this.room.peers = this.room.peers.filter((p) => p.peerId !== peerId);
    if (this.room.peers.length !== before) this.broadcastRoom();
  }

  private handleHostMessage(conn: DataConnection, msg: Msg) {
    const room = this.room;
    if (!room || !msg || typeof msg !== 'object') return;
    if (msg.kind === 'join') {
      const reject = (message: string) => {
        conn.send({ kind: 'error', message });
        setTimeout(() => conn.close(), 300);
      };
      if (room.peers.length >= 4) return reject('Oda dolu (en fazla 4 oyuncu katılabilir).');
      if (room.inGame) return reject('Bu odadaki karşılaşma şu anda devam ediyor.');
      const used = new Set(room.peers.map((p) => p.slotIndex));
      let slotIndex = 0;
      while (used.has(slotIndex) && slotIndex < 4) slotIndex++;
      room.peers.push({
        peerId: conn.peer,
        slotIndex,
        name: String(msg.name || `Oyuncu ${slotIndex + 1}`).slice(0, 12),
        costume: msg.costume as CostumeConfig,
        isHost: false,
      });
      this.conns.set(conn.peer, conn);
      conn.send({ kind: 'joined', peerId: conn.peer, room });
      this.broadcastRoom();
      return;
    }
    const sender = room.peers.find((p) => p.peerId === conn.peer);
    if (!sender) return;
    if (msg.kind === 'profile') {
      if (typeof msg.name === 'string') sender.name = msg.name.trim().slice(0, 12) || sender.name;
      if (msg.costume && typeof msg.costume === 'object') sender.costume = msg.costume as CostumeConfig;
      this.broadcastRoom();
    } else if (msg.kind === 'input' && msg.input) {
      this.callbacks.onGuestInput(sender.slotIndex, msg.input as PlayerInputState);
    }
  }

  public async joinRoom(params: { roomCode: string; name: string; costume: CostumeConfig }) {
    this.leaveRoom();
    const code = params.roomCode.trim().toUpperCase();
    let peer: Peer;
    try {
      peer = await this.openPeer();
    } catch {
      this.callbacks.onError('Bağlantı sunucusuna ulaşılamadı. İnternetini kontrol et.');
      return;
    }
    this.peer = peer;
    this.watchPeer(peer);
    const conn = peer.connect(ID_PREFIX + code, { reliable: true, serialization: 'json' });
    this.hostConn = conn;
    conn.on('open', () => conn.send({ kind: 'join', name: params.name, costume: params.costume }));
    conn.on('data', (raw) => this.handleGuestMessage(raw as Msg));
    conn.on('close', () => {
      if (this.hostConn !== conn) return;
      const hadRoom = Boolean(this.room);
      this.resetLocal();
      if (hadRoom) this.callbacks.onError('Oda kapandı: kurucu oyundan ayrıldı.');
    });
  }

  private handleGuestMessage(msg: Msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.kind === 'error') {
      this.callbacks.onError(String(msg.message || 'Oda hatası oluştu.'));
    } else if (msg.kind === 'joined') {
      this.myPeerId = String(msg.peerId);
      this.room = msg.room as OnlineRoomState;
      this.emitDecoratedRoom();
    } else if (msg.kind === 'room') {
      this.room = msg.room as OnlineRoomState;
      this.emitDecoratedRoom();
    } else if (msg.kind === 'match_started') {
      this.room = msg.room as OnlineRoomState;
      this.emitDecoratedRoom();
      this.callbacks.onMatchStarted(this.room);
    } else if (msg.kind === 'snapshot' && msg.snap) {
      this.callbacks.onSnapshotReceived(msg.snap as NetSnapshot);
    } else if (msg.kind === 'round_result' && msg.result) {
      this.callbacks.onMatchEnded(msg.result as RoundResult);
    }
  }

  public updateRoomConfig(patch: {
    mode?: GameModeId;
    mapId?: MapId;
    lives?: number;
    roundDurationSec?: number;
    botsEnabled?: boolean;
  }) {
    if (!this.isHost() || !this.room) return;
    const room = this.room;
    if (patch.mode) room.mode = patch.mode;
    if (patch.mapId) room.mapId = patch.mapId;
    if (typeof patch.lives === 'number') room.lives = Math.max(1, Math.min(5, patch.lives));
    if (typeof patch.roundDurationSec === 'number') room.roundDurationSec = Math.max(30, Math.min(180, patch.roundDurationSec));
    if (typeof patch.botsEnabled === 'boolean') room.botsEnabled = patch.botsEnabled;
    this.broadcastRoom();
  }

  public updateProfile(patch: { name?: string; costume?: CostumeConfig }) {
    if (!this.room || !this.myPeerId) return;
    if (this.isHost()) {
      const me = this.room.peers.find((p) => p.peerId === this.myPeerId);
      if (!me) return;
      if (patch.name) me.name = patch.name.trim().slice(0, 12) || me.name;
      if (patch.costume) me.costume = patch.costume;
      this.broadcastRoom();
    } else {
      this.sendToHost({ kind: 'profile', ...patch });
    }
  }

  public startMatch() {
    if (!this.isHost() || !this.room) return;
    this.room.inGame = true;
    this.broadcastRoom();
    this.broadcastToGuests({ kind: 'match_started', room: this.room });
    this.callbacks.onMatchStarted(this.room);
  }

  public notifyMatchEndedOnServer() {
    if (!this.isHost() || !this.room) return;
    this.room.inGame = false;
    this.broadcastRoom();
  }

  private resetLocal() {
    this.hostConn = null;
    this.conns.clear();
    this.room = null;
    this.myPeerId = null;
    const peer = this.peer;
    this.peer = null;
    peer?.destroy();
    this.callbacks.onRoomUpdated(null, null);
  }

  public leaveRoom() {
    if (!this.peer && !this.room) return;
    const conn = this.hostConn;
    this.hostConn = null;
    conn?.close();
    for (const c of this.conns.values()) c.close();
    this.resetLocal();
  }

  public disconnect() {
    this.leaveRoom();
  }

  private broadcastRoom() {
    if (!this.room) return;
    this.broadcastToGuests({ kind: 'room', room: this.room });
    this.emitDecoratedRoom();
  }

  private emitDecoratedRoom() {
    if (!this.room) {
      this.callbacks.onRoomUpdated(null, this.myPeerId);
      return;
    }
    const amHost = this.isHost();
    const decorated: OnlineRoomState = {
      ...this.room,
      peers: this.room.peers.map((p): OnlinePeerInfo => {
        let transport: PeerTransportStatus = 'p2p';
        if (p.peerId !== this.myPeerId) {
          const conn = amHost ? this.conns.get(p.peerId) : p.isHost ? this.hostConn : null;
          transport = !amHost && !p.isHost ? 'p2p' : conn?.open ? 'p2p' : 'connecting';
        }
        return { ...p, transport };
      }),
    };
    this.callbacks.onRoomUpdated(decorated, this.myPeerId);
  }

  private sendToHost(payload: Msg) {
    if (this.hostConn?.open) this.hostConn.send(payload);
  }

  private broadcastToGuests(payload: Msg) {
    for (const conn of this.conns.values()) {
      if (conn.open) conn.send(payload);
    }
  }

  public sendGuestInput(input: PlayerInputState) {
    if (!this.room || this.isHost()) return;
    this.sendToHost({ kind: 'input', input });
  }

  public broadcastSimSnapshot(sim: SimulationState, eventsCopy: SimulationState['pendingEvents']) {
    if (!this.isHost()) return;
    const snap: NetSnapshot = {
      seq: ++this.snapSeq,
      elapsedSec: sim.elapsedSec,
      timeRemainingSec: sim.timeRemainingSec,
      hazardPhase: sim.hazardPhase,
      trauma: sim.trauma,
      windForce: sim.windForce,
      frictionFactor: sim.frictionFactor,
      players: sim.players.map((p) => ({
        slotIndex: p.slotIndex,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        vx: Math.round(p.vx),
        vy: Math.round(p.vy),
        facing: p.facing,
        grounded: p.grounded,
        stunTimer: Math.round(p.stunTimer * 100) / 100,
        pancakeTimer: Math.round(p.pancakeTimer * 100) / 100,
        invulnTimer: Math.round(p.invulnTimer * 100) / 100,
        shieldTimer: Math.round(p.shieldTimer * 100) / 100,
        abilityCooldown: Math.round(p.abilityCooldown * 100) / 100,
        flashTimer: Math.round(p.flashTimer * 100) / 100,
        squashX: Math.round(p.squashX * 100) / 100,
        squashY: Math.round(p.squashY * 100) / 100,
        jiggleAmp: Math.round(p.jiggleAmp * 100) / 100,
        jigglePhase: Math.round(p.jigglePhase * 100) / 100,
        airTilt: Math.round(p.airTilt * 100) / 100,
        blinkTimer: Math.round(p.blinkTimer * 100) / 100,
        walkCycle: Math.round(p.walkCycle * 100) / 100,
        tasselAngle: Math.round(p.tasselAngle * 100) / 100,
        alive: p.alive,
        eliminated: p.eliminated,
        lives: p.lives,
        score: p.score,
        kills: p.kills,
        deaths: p.deaths,
        stomps: p.stomps,
        jumpsUsed: p.jumpsUsed,
        jumpsMade: p.jumpsMade,
      })),
      platforms: sim.platforms.map((pl) => ({
        id: pl.id,
        x: Math.round(pl.x * 10) / 10,
        y: Math.round(pl.y * 10) / 10,
        crumbleState: pl.crumbleState,
      })),
      cannons: sim.cannons,
      events: eventsCopy,
      crown:
        sim.mode === 'crown'
          ? { holder: sim.crownHolder ?? null, x: sim.crownX, y: sim.crownY, held: sim.crownHeld ?? {} }
          : undefined,
    };

    this.broadcastToGuests({ kind: 'snapshot', snap });
  }

  public broadcastRoundResult(result: RoundResult) {
    if (!this.isHost()) return;
    this.broadcastToGuests({ kind: 'round_result', result });
  }
}

export function applyNetSnapshot(sim: SimulationState, snap: NetSnapshot) {
  sim.elapsedSec = snap.elapsedSec;
  sim.timeRemainingSec = snap.timeRemainingSec;
  sim.hazardPhase = snap.hazardPhase;
  sim.trauma = snap.trauma;
  sim.windForce = snap.windForce;
  sim.frictionFactor = snap.frictionFactor;
  sim.cannons = snap.cannons;
  if (snap.crown) {
    sim.crownHolder = snap.crown.holder;
    sim.crownX = snap.crown.x;
    sim.crownY = snap.crown.y;
    sim.crownHeld = snap.crown.held;
  }

  for (const pSnap of snap.players) {
    const p = sim.players.find((pl) => pl.slotIndex === pSnap.slotIndex);
    if (!p) continue;
    Object.assign(p, pSnap);
  }

  for (const plSnap of snap.platforms) {
    const pl = sim.platforms.find((x) => x.id === plSnap.id);
    if (!pl) continue;
    pl.x = plSnap.x;
    pl.y = plSnap.y;
    pl.crumbleState = plSnap.crumbleState;
  }

  if (snap.events && snap.events.length > 0) {
    sim.pendingEvents.push(...snap.events);
  }
}

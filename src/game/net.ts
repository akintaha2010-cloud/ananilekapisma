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
  countdown: number;
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
  onGuestLeft: (slotIndex: number) => void;
  onSnapshotReceived: (snap: NetSnapshot) => void;
  onMatchEnded: (result: RoundResult) => void;
}

const ID_PREFIX = 'kalekapmaca-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const OPEN_TIMEOUT_MS = 10000;
const JOIN_TIMEOUT_MS = 15000;
const PING_MS = 2000;
const DEAD_MS = 10000;
const DEAD_HIDDEN_MS = 20000; // background tabs get throttled timers
const MAX_BUFFERED_BYTES = 256 * 1024;

const SERVER_DOWN = 'Bağlantı sunucusuna ulaşılamadı. İnternet bağlantını kontrol et.';
const PEER_ERRORS: Record<string, string> = {
  'peer-unavailable': 'Bu davet koduna ait aktif bir oda bulunamadı.',
  network: SERVER_DOWN,
  'server-error': SERVER_DOWN,
  'socket-error': SERVER_DOWN,
  'socket-closed': SERVER_DOWN,
  timeout: SERVER_DOWN,
  webrtc: 'Oyuncular arasında doğrudan bağlantı kurulamadı.',
};
const peerErrorText = (type?: string) => PEER_ERRORS[type ?? ''] ?? 'Bağlantı hatası oluştu, tekrar dene.';

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

type Msg = Record<string, unknown>;

/**
 * Serverless online play: the host's browser is the room (PeerJS id = prefix + room code),
 * guests connect to it directly over WebRTC. Works on static hosting like GitHub Pages.
 * The host is authoritative: guests only send inputs and render the host's snapshots.
 */
export class OnlineClient {
  private peer: Peer | null = null;
  private myPeerId: string | null = null;
  private room: OnlineRoomState | null = null;
  private conns = new Map<string, DataConnection>();
  private hostConn: DataConnection | null = null;
  private callbacks: NetCallbacks;
  private snapSeq = 0;
  // Bumped on every leave so late async results / events of an old session are ignored.
  private gen = 0;
  private joinSettle: (() => void) | null = null;
  private lastSeen = new Map<string, number>();
  private pingTimer: number | null = null;

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
      let timer = 0;
      const fail = (err: { type?: string }) => {
        window.clearTimeout(timer);
        peer.destroy();
        reject(err);
      };
      timer = window.setTimeout(() => fail({ type: 'timeout' }), OPEN_TIMEOUT_MS);
      peer.once('open', () => {
        window.clearTimeout(timer);
        peer.off('error', fail);
        resolve(peer);
      });
      peer.once('error', fail);
    });
  }

  private watchPeer(peer: Peer, gen: number, onError: (message: string) => void) {
    peer.on('error', (err: { type?: string }) => {
      if (gen === this.gen) onError(peerErrorText(err.type));
    });
    // The broker drops idle signalling sockets; reconnect so the room code keeps working.
    peer.on('disconnected', () => {
      window.setTimeout(() => {
        if (gen === this.gen && peer.disconnected && !peer.destroyed) peer.reconnect();
      }, 1500);
    });
    peer.on('close', () => this.lost(gen, 'Bağlantı sunucusuyla bağlantı kesildi.'));
  }

  /** Ends the current session with an error message, unless it was already replaced. */
  private lost(gen: number, message: string) {
    if (gen !== this.gen) return;
    this.leaveRoom();
    this.callbacks.onError(message);
  }

  private touch(peerId: string) {
    this.lastSeen.set(peerId, Date.now());
  }

  // Connections can die silently (closed tab, dropped wifi); detect it with pings.
  private startKeepAlive(gen: number) {
    this.stopKeepAlive();
    this.pingTimer = window.setInterval(() => {
      const now = Date.now();
      const watched = this.hostConn ? [this.hostConn] : [...this.conns.values()];
      for (const conn of watched) {
        if (conn.open) conn.send({ kind: 'ping' });
        if (now - (this.lastSeen.get(conn.peer) ?? now) <= (document.hidden ? DEAD_HIDDEN_MS : DEAD_MS)) continue;
        if (this.hostConn) return this.lost(gen, 'Kurucuyla bağlantı koptu.');
        conn.close();
        this.dropGuest(conn.peer);
      }
    }, PING_MS);
  }

  private stopKeepAlive() {
    if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
    this.pingTimer = null;
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
    const gen = this.gen;
    let peer: Peer | null = null;
    let code = '';
    for (let attempt = 0; attempt < 5 && !peer; attempt++) {
      code = randomCode();
      try {
        peer = await this.openPeer(ID_PREFIX + code);
      } catch (err) {
        if ((err as { type?: string }).type !== 'unavailable-id') {
          if (gen === this.gen) this.callbacks.onError(peerErrorText((err as { type?: string }).type));
          return;
        }
      }
      if (gen !== this.gen) {
        peer?.destroy();
        return;
      }
    }
    if (!peer) {
      this.callbacks.onError('Oda açılamadı, tekrar dene.');
      return;
    }
    this.peer = peer;
    this.watchPeer(peer, gen, (message) => this.callbacks.onError(message));
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
    peer.on('connection', (conn) => this.acceptGuest(conn, gen));
    this.startKeepAlive(gen);
    this.emitDecoratedRoom();
  }

  private acceptGuest(conn: DataConnection, gen: number) {
    this.touch(conn.peer);
    conn.on('data', (raw) => {
      if (gen !== this.gen) return;
      this.touch(conn.peer);
      this.handleHostMessage(conn, raw as Msg);
    });
    conn.on('close', () => gen === this.gen && this.dropGuest(conn.peer));
    conn.on('error', () => gen === this.gen && this.dropGuest(conn.peer));
  }

  private dropGuest(peerId: string) {
    this.conns.delete(peerId);
    this.lastSeen.delete(peerId);
    if (!this.room) return;
    const gone = this.room.peers.find((p) => p.peerId === peerId);
    if (!gone) return;
    this.room.peers = this.room.peers.filter((p) => p.peerId !== peerId);
    if (this.room.inGame) this.callbacks.onGuestLeft(gone.slotIndex);
    this.broadcastRoom();
  }

  private handleHostMessage(conn: DataConnection, msg: Msg) {
    const room = this.room;
    if (!room || !msg || typeof msg !== 'object') return;
    if (msg.kind === 'join') {
      if (room.peers.some((p) => p.peerId === conn.peer)) return;
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

  /** Resolves once the guest is in the room or the attempt failed (errors go to onError). */
  public joinRoom(params: { roomCode: string; name: string; costume: CostumeConfig }): Promise<void> {
    this.leaveRoom();
    const gen = this.gen;
    const code = params.roomCode.trim().toUpperCase();
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(
        () => this.lost(gen, 'Odaya bağlanılamadı. Kodu ve kurucunun odada olduğunu kontrol et.'),
        JOIN_TIMEOUT_MS
      );
      this.joinSettle = () => {
        window.clearTimeout(timer);
        this.joinSettle = null;
        resolve();
      };
      this.openPeer().then(
        (peer) => {
          if (gen !== this.gen) {
            peer.destroy();
            return;
          }
          this.peer = peer;
          // After joining, broker hiccups must not kill a running P2P match.
          this.watchPeer(peer, gen, (message) =>
            this.joinSettle ? this.lost(gen, message) : this.callbacks.onError(message)
          );
          const conn = peer.connect(ID_PREFIX + code, { reliable: true, serialization: 'json' });
          this.hostConn = conn;
          conn.on('open', () => {
            this.touch(conn.peer);
            conn.send({ kind: 'join', name: params.name, costume: params.costume });
          });
          conn.on('data', (raw) => {
            if (gen !== this.gen) return;
            this.touch(conn.peer);
            this.handleGuestMessage(gen, raw as Msg);
          });
          conn.on('close', () =>
            this.lost(gen, this.room ? 'Oda kapandı: kurucu oyundan ayrıldı.' : 'Odaya bağlanılamadı.')
          );
          conn.on('error', () => this.lost(gen, 'Kurucuyla doğrudan bağlantı kurulamadı.'));
        },
        (err: { type?: string }) => this.lost(gen, peerErrorText(err.type))
      );
    });
  }

  private handleGuestMessage(gen: number, msg: Msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.kind === 'error') {
      this.lost(gen, String(msg.message || 'Oda hatası oluştu.'));
    } else if (msg.kind === 'joined') {
      this.myPeerId = String(msg.peerId);
      this.room = msg.room as OnlineRoomState;
      this.startKeepAlive(gen);
      this.emitDecoratedRoom();
      this.joinSettle?.();
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
    if (!this.isHost() || !this.room || this.room.inGame) return;
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
    this.stopKeepAlive();
    this.lastSeen.clear();
    this.hostConn = null;
    this.conns.clear();
    this.room = null;
    this.myPeerId = null;
    const peer = this.peer;
    this.peer = null;
    // Give the "close" frames a moment to reach the other side before the peer is torn down.
    if (peer) window.setTimeout(() => peer.destroy(), 200);
    this.callbacks.onRoomUpdated(null, null);
  }

  public leaveRoom() {
    this.gen++;
    this.joinSettle?.();
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
      if (!conn.open) continue;
      // Slow link: drop stale snapshots instead of queueing them up (the next one replaces it).
      if (payload.kind === 'snapshot' && (conn.dataChannel?.bufferedAmount ?? 0) > MAX_BUFFERED_BYTES) continue;
      conn.send(payload);
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
      countdown: sim.countdown,
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

// Snapshots arrive ~30 times a second; entities glide to the latest position instead of jumping.
const netTargets = new WeakMap<object, { x: number; y: number }>();

function setNetTarget(o: { x: number; y: number }, x: number, y: number) {
  const t = netTargets.get(o);
  if (!t || Math.hypot(x - o.x, y - o.y) > 160) {
    o.x = x;
    o.y = y;
  }
  netTargets.set(o, { x, y });
}

export function smoothNetState(sim: SimulationState, dt: number) {
  const k = 1 - Math.exp(-dt * 28);
  const glide = (o: { x: number; y: number }) => {
    const t = netTargets.get(o);
    if (!t) return;
    o.x += (t.x - o.x) * k;
    o.y += (t.y - o.y) * k;
  };
  sim.players.forEach(glide);
  sim.platforms.forEach(glide);
}

export function applyNetSnapshot(sim: SimulationState, snap: NetSnapshot) {
  sim.countdown = snap.countdown ?? 0;
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
    const { x, y, ...rest } = pSnap;
    Object.assign(p, rest);
    setNetTarget(p, x, y);
  }

  for (const plSnap of snap.platforms) {
    const pl = sim.platforms.find((x) => x.id === plSnap.id);
    if (!pl) continue;
    setNetTarget(pl, plSnap.x, plSnap.y);
    pl.crumbleState = plSnap.crumbleState;
  }

  if (snap.events && snap.events.length > 0) {
    sim.pendingEvents.push(...snap.events);
  }
}

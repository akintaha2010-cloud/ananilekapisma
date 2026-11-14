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
}

export interface NetCallbacks {
  onRoomUpdated: (room: OnlineRoomState | null, myPeerId: string | null) => void;
  onError: (message: string) => void;
  onMatchStarted: (room: OnlineRoomState) => void;
  onGuestInput: (slotIndex: number, input: PlayerInputState) => void;
  onSnapshotReceived: (snap: NetSnapshot) => void;
  onMatchEnded: (result: RoundResult) => void;
}

interface PeerLink {
  peerId: string;
  pc: RTCPeerConnection;
  fastDc: RTCDataChannel | null;
  ctrlDc: RTCDataChannel | null;
  status: PeerTransportStatus;
  fallbackTimer: number | null;
}

export class OnlineClient {
  private ws: WebSocket | null = null;
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  private hasTurnServer = false;
  private myPeerId: string | null = null;
  private room: OnlineRoomState | null = null;
  private links = new Map<string, PeerLink>();
  private callbacks: NetCallbacks;
  private snapSeq = 0;
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

  public hasTurnConfigured(): boolean {
    return this.hasTurnServer;
  }

  private async ensureConnected(): Promise<void> {
    try {
      const res = await fetch('/api/ice-servers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.iceServers)) {
          this.iceServers = data.iceServers;
        }
        this.hasTurnServer = Boolean(data.hasTurn);
      }
    } catch {
      // keep default STUN
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    await new Promise<void>((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      this.ws = ws;

      ws.onopen = () => {
        if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
        this.pingTimer = window.setInterval(() => {
          this.sendSignal({ type: 'ping' });
        }, 15000);
        resolve();
      };

      ws.onerror = () => {
        reject(new Error('Sinyal sunucusuna bağlanılamadı.'));
      };

      ws.onmessage = (ev) => {
        this.handleWsMessage(String(ev.data));
      };

      ws.onclose = () => {
        if (this.pingTimer !== null) {
          window.clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
      };
    });
  }

  private sendSignal(data: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
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
    await this.ensureConnected();
    this.sendSignal({ type: 'create_room', ...params });
  }

  public async joinRoom(params: {
    roomCode: string;
    name: string;
    costume: CostumeConfig;
  }) {
    await this.ensureConnected();
    this.sendSignal({ type: 'join_room', ...params });
  }

  public updateRoomConfig(patch: {
    mode?: GameModeId;
    mapId?: MapId;
    lives?: number;
    roundDurationSec?: number;
    botsEnabled?: boolean;
  }) {
    this.sendSignal({ type: 'update_room_config', ...patch });
  }

  public updateProfile(patch: { name?: string; costume?: CostumeConfig }) {
    this.sendSignal({ type: 'update_peer_profile', ...patch });
  }

  public startMatch() {
    this.sendSignal({ type: 'start_match' });
  }

  public notifyMatchEndedOnServer() {
    this.sendSignal({ type: 'end_match' });
  }

  public leaveRoom() {
    this.sendSignal({ type: 'leave_room' });
    this.closeAllLinks();
    this.room = null;
    this.myPeerId = null;
    this.callbacks.onRoomUpdated(null, null);
  }

  public disconnect() {
    this.leaveRoom();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private closeAllLinks() {
    for (const link of this.links.values()) {
      if (link.fallbackTimer !== null) window.clearTimeout(link.fallbackTimer);
      link.fastDc?.close();
      link.ctrlDc?.close();
      link.pc.close();
    }
    this.links.clear();
  }

  private handleWsMessage(raw: string) {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    const type = String(msg.type || '');
    if (type === 'pong') return;

    if (type === 'room_error') {
      this.callbacks.onError(String(msg.message || 'Oda hatası oluştu.'));
      return;
    }

    if (type === 'room_joined') {
      this.myPeerId = String(msg.peerId);
      this.room = msg.room as OnlineRoomState;
      this.syncPeerLinks();
      this.emitDecoratedRoom();
      return;
    }

    if (type === 'room_state') {
      this.room = msg.room as OnlineRoomState;
      this.syncPeerLinks();
      this.emitDecoratedRoom();
      return;
    }

    if (type === 'peer_left') {
      const leftId = String(msg.peerId);
      const link = this.links.get(leftId);
      if (link) {
        if (link.fallbackTimer !== null) window.clearTimeout(link.fallbackTimer);
        link.fastDc?.close();
        link.ctrlDc?.close();
        link.pc.close();
        this.links.delete(leftId);
      }
      this.emitDecoratedRoom();
      return;
    }

    if (type === 'match_started') {
      this.room = msg.room as OnlineRoomState;
      this.emitDecoratedRoom();
      this.callbacks.onMatchStarted(this.room);
      return;
    }

    if (type === 'rtc_signal') {
      const fromPeerId = String(msg.fromPeerId || '');
      const signal = msg.signal as {
        kind: 'offer' | 'answer' | 'candidate';
        sdp?: RTCSessionDescriptionInit;
        candidate?: RTCIceCandidateInit;
      };
      this.handleRtcSignal(fromPeerId, signal).catch(() => {});
      return;
    }

    if (type === 'relay_packet') {
      const fromPeerId = String(msg.fromPeerId || '');
      const link = this.links.get(fromPeerId);
      if (link && link.status === 'connecting') {
        link.status = 'turn_relay';
        this.emitDecoratedRoom();
      }
      this.handleDataPayload(fromPeerId, msg.payload);
    }
  }

  private emitDecoratedRoom() {
    if (!this.room) {
      this.callbacks.onRoomUpdated(null, this.myPeerId);
      return;
    }
    const decorated: OnlineRoomState = {
      ...this.room,
      peers: this.room.peers.map((p): OnlinePeerInfo => {
        if (p.peerId === this.myPeerId) {
          return { ...p, transport: 'p2p' };
        }
        const link = this.links.get(p.peerId);
        return {
          ...p,
          transport: link ? link.status : 'connecting',
        };
      }),
    };
    this.callbacks.onRoomUpdated(decorated, this.myPeerId);
  }

  private syncPeerLinks() {
    if (!this.room || !this.myPeerId) return;
    const amHost = this.room.hostPeerId === this.myPeerId;

    // Remove stale links
    const activeIds = new Set(this.room.peers.map((p) => p.peerId));
    for (const [pid, link] of this.links.entries()) {
      if (!activeIds.has(pid)) {
        if (link.fallbackTimer !== null) window.clearTimeout(link.fallbackTimer);
        link.fastDc?.close();
        link.ctrlDc?.close();
        link.pc.close();
        this.links.delete(pid);
      }
    }

    if (amHost) {
      for (const peer of this.room.peers) {
        if (peer.peerId === this.myPeerId) continue;
        if (!this.links.has(peer.peerId)) {
          this.initiateOffer(peer.peerId).catch(() => {});
        }
      }
    }
  }

  private createLink(targetPeerId: string): PeerLink {
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceTransportPolicy: 'all',
    });

    const link: PeerLink = {
      peerId: targetPeerId,
      pc,
      fastDc: null,
      ctrlDc: null,
      status: 'connecting',
      fallbackTimer: window.setTimeout(() => {
        if (link.status === 'connecting') {
          link.status = 'turn_relay';
          this.emitDecoratedRoom();
        }
      }, 3500),
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        this.sendSignal({
          type: 'rtc_signal',
          targetPeerId,
          signal: { kind: 'candidate', candidate: ev.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        link.status = this.hasTurnServer ? 'p2p' : 'p2p';
        this.inspectIceCandidateType(link).catch(() => {});
        this.emitDecoratedRoom();
      } else if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected'
      ) {
        link.status = 'turn_relay';
        this.emitDecoratedRoom();
      }
    };

    pc.ondatachannel = (ev) => {
      this.wireDataChannel(link, ev.channel);
    };

    this.links.set(targetPeerId, link);
    return link;
  }

  private async inspectIceCandidateType(link: PeerLink) {
    try {
      const stats = await link.pc.getStats();
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const local = stats.get(report.localCandidateId);
          if (local && local.candidateType === 'relay') {
            link.status = 'turn_relay';
          } else {
            link.status = 'p2p';
          }
        }
      });
      this.emitDecoratedRoom();
    } catch {
      // ignore stats errors
    }
  }

  private wireDataChannel(link: PeerLink, dc: RTCDataChannel) {
    if (dc.label === 'kale_game') {
      link.fastDc = dc;
    } else {
      link.ctrlDc = dc;
    }

    dc.onopen = () => {
      if (link.fallbackTimer !== null) {
        window.clearTimeout(link.fallbackTimer);
        link.fallbackTimer = null;
      }
      link.status = 'p2p';
      this.inspectIceCandidateType(link).catch(() => {});
      this.emitDecoratedRoom();
    };

    dc.onmessage = (ev) => {
      try {
        const payload = JSON.parse(String(ev.data));
        this.handleDataPayload(link.peerId, payload);
      } catch {
        // ignore malformed packet
      }
    };
  }

  private async initiateOffer(targetPeerId: string) {
    const link = this.createLink(targetPeerId);
    const fastDc = link.pc.createDataChannel('kale_game', {
      ordered: false,
      maxRetransmits: 0,
    });
    const ctrlDc = link.pc.createDataChannel('kale_ctrl', { ordered: true });
    this.wireDataChannel(link, fastDc);
    this.wireDataChannel(link, ctrlDc);

    const offer = await link.pc.createOffer();
    await link.pc.setLocalDescription(offer);
    this.sendSignal({
      type: 'rtc_signal',
      targetPeerId,
      signal: { kind: 'offer', sdp: offer },
    });
  }

  private async handleRtcSignal(
    fromPeerId: string,
    signal: {
      kind: 'offer' | 'answer' | 'candidate';
      sdp?: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
    }
  ) {
    let link = this.links.get(fromPeerId);
    if (signal.kind === 'offer' && signal.sdp) {
      if (!link) link = this.createLink(fromPeerId);
      await link.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await link.pc.createAnswer();
      await link.pc.setLocalDescription(answer);
      this.sendSignal({
        type: 'rtc_signal',
        targetPeerId: fromPeerId,
        signal: { kind: 'answer', sdp: answer },
      });
    } else if (signal.kind === 'answer' && signal.sdp && link) {
      await link.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    } else if (signal.kind === 'candidate' && signal.candidate && link) {
      await link.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  }

  private sendToPeer(targetPeerId: string, payload: unknown, reliable = false) {
    const link = this.links.get(targetPeerId);
    const json = JSON.stringify(payload);
    const dc = reliable ? link?.ctrlDc : link?.fastDc ?? link?.ctrlDc;
    if (dc && dc.readyState === 'open') {
      dc.send(json);
    } else {
      // Automatic signaling/TURN relay fallback when P2P DataChannel isn't open
      this.sendSignal({ type: 'relay_packet', targetPeerId, payload });
    }
  }

  private broadcastToGuests(payload: unknown, reliable = false) {
    if (!this.room || !this.myPeerId) return;
    for (const peer of this.room.peers) {
      if (peer.peerId === this.myPeerId) continue;
      this.sendToPeer(peer.peerId, payload, reliable);
    }
  }

  public sendGuestInput(input: PlayerInputState) {
    if (!this.room || !this.myPeerId || this.isHost()) return;
    const me = this.room.peers.find((p) => p.peerId === this.myPeerId);
    if (!me) return;
    this.sendToPeer(
      this.room.hostPeerId,
      { kind: 'input', slotIndex: me.slotIndex, input },
      false
    );
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
    };

    this.broadcastToGuests({ kind: 'snapshot', snap }, false);
  }

  public broadcastRoundResult(result: RoundResult) {
    if (!this.isHost()) return;
    this.broadcastToGuests({ kind: 'round_result', result }, true);
  }

  private handleDataPayload(_fromPeerId: string, rawPayload: unknown) {
    if (!rawPayload || typeof rawPayload !== 'object') return;
    const msg = rawPayload as Record<string, unknown>;
    if (msg.kind === 'input' && typeof msg.slotIndex === 'number' && msg.input) {
      this.callbacks.onGuestInput(msg.slotIndex, msg.input as PlayerInputState);
    } else if (msg.kind === 'snapshot' && msg.snap) {
      this.callbacks.onSnapshotReceived(msg.snap as NetSnapshot);
    } else if (msg.kind === 'round_result' && msg.result) {
      this.callbacks.onMatchEnded(msg.result as RoundResult);
    }
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

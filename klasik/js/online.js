import { createPlayer } from './physics.js';
import { emptyInput } from './input.js';

const PREFIX = 'kale-kapismasi-oda-';
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PEERJS_URL = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
export const MAX_PLAYERS = 4;

export function roomCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 5; i++) s += LETTERS[Math.floor(rand() * LETTERS.length)];
  return s;
}

export const normalizeCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

let peerLib = null;
export function loadPeerJS() {
  if (globalThis.Peer) return Promise.resolve(globalThis.Peer);
  if (peerLib) return peerLib;
  peerLib = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEERJS_URL;
    s.onload = () => (globalThis.Peer ? resolve(globalThis.Peer) : reject(new Error('PeerJS yüklenemedi')));
    s.onerror = () => {
      peerLib = null;
      reject(new Error('PeerJS yüklenemedi, internet bağlantını kontrol et'));
    };
    document.head.appendChild(s);
  });
  return peerLib;
}

const errText = (e) =>
  ({
    'peer-unavailable': 'Bu kodla bir oda bulunamadı',
    network: 'Bağlantı sunucusuna ulaşılamadı',
    'server-error': 'Bağlantı sunucusu hata verdi',
    'browser-incompatible': 'Bu tarayıcı online oyunu desteklemiyor',
  })[e?.type] || e?.message || 'Bağlantı hatası';

/** Host a room. handlers: onJoin(conn), onLeave(conn), onData(conn, msg), onError(text) */
export async function hostRoom(handlers, tries = 4) {
  const Peer = await loadPeerJS();
  for (let k = 0; k < tries; k++) {
    const code = roomCode();
    try {
      const peer = await new Promise((resolve, reject) => {
        const p = new Peer(PREFIX + code);
        p.once('open', () => resolve(p));
        p.once('error', (e) => {
          p.destroy();
          reject(e);
        });
      });
      const conns = new Set();
      peer.on('connection', (conn) => {
        conn.on('open', () => {
          if (conns.size >= MAX_PLAYERS - 1) {
            conn.send({ t: 'full' });
            setTimeout(() => conn.close(), 300);
            return;
          }
          conns.add(conn);
          handlers.onJoin?.(conn);
        });
        conn.on('data', (msg) => conns.has(conn) && handlers.onData?.(conn, msg));
        conn.on('close', () => {
          if (conns.delete(conn)) handlers.onLeave?.(conn);
        });
        conn.on('error', () => {
          if (conns.delete(conn)) handlers.onLeave?.(conn);
        });
      });
      peer.on('error', (e) => handlers.onError?.(errText(e)));
      peer.on('disconnected', () => peer.reconnect?.());
      return {
        code,
        conns,
        broadcast(msg) {
          for (const c of conns) if (c.open) c.send(msg);
        },
        close() {
          for (const c of conns) c.close();
          peer.destroy();
        },
      };
    } catch (e) {
      if (e?.type !== 'unavailable-id' || k === tries - 1) throw new Error(errText(e));
    }
  }
  throw new Error('Oda açılamadı');
}

/** Join a room by code. handlers: onData(msg), onClose() */
export async function joinRoom(code, handlers) {
  const Peer = await loadPeerJS();
  const peer = await new Promise((resolve, reject) => {
    const p = new Peer();
    p.once('open', () => resolve(p));
    p.once('error', (e) => {
      p.destroy();
      reject(new Error(errText(e)));
    });
  });
  const conn = await new Promise((resolve, reject) => {
    const c = peer.connect(PREFIX + normalizeCode(code), { reliable: true });
    const timer = setTimeout(() => reject(new Error('Odaya bağlanılamadı (zaman aşımı)')), 12000);
    c.once('open', () => {
      clearTimeout(timer);
      resolve(c);
    });
    peer.once('error', (e) => {
      clearTimeout(timer);
      reject(new Error(errText(e)));
    });
  }).catch((e) => {
    peer.destroy();
    throw e;
  });
  let closed = false;
  const onClose = () => {
    if (closed) return;
    closed = true;
    handlers.onClose?.();
  };
  conn.on('data', (msg) => handlers.onData?.(msg));
  conn.on('close', onClose);
  conn.on('error', onClose);
  peer.on('disconnected', onClose);
  return {
    send: (msg) => conn.open && conn.send(msg),
    close() {
      closed = true;
      conn.close();
      peer.destroy();
    },
  };
}

/* ---------- Snapshot protocol (pure, tested) ---------- */

const r1 = (v) => Math.round(v * 10) / 10;

export function playerInfo(p) {
  const i = p.info;
  return { id: p.id, kind: i.kind, name: i.name, tag: i.tag, color: i.color, hat: i.hat, stache: i.stache, maxLives: i.maxLives, scale: p.scale, team: p.team };
}

export function snapshot(g, events = [], withInfos = false) {
  const s = {
    t: 's',
    c: r1(g.countdown),
    tm: r1(g.time),
    f: g.finished ? 1 : 0,
    r: g.result,
    p: g.players.map((p) => [p.id, r1(p.x), r1(p.y), Math.round(p.vx), Math.round(p.vy), p.state, p.facing, p.lives, p.stomps, p.grounded ? 1 : 0, p.invuln > 0 ? 1 : 0, p.shoveT > 0 ? 1 : 0, p.kills, p.falls]),
    m: g.level.platforms.filter((pl) => pl.move).map((pl) => [r1(pl.x), r1(pl.y)]),
    ms: g.ms,
    e: events.map(encodeEvent).filter(Boolean),
  };
  if (withInfos) s.i = g.players.map(playerInfo);
  return s;
}

const EVENT_TYPES = new Set(['jump', 'doublejump', 'land', 'pound', 'poundland', 'shocked', 'stomp', 'bonk', 'shove', 'shoved', 'clash', 'splash', 'unsquash', 'out', 'ko', 'wave', 'gatehit', 'spawn', 'rockwarn', 'rockland', 'rocksplash', 'crushed', 'crown', 'crownsteal', 'crowndrop', 'tick', 'go', 'end']);

export function encodeEvent(e) {
  if (!EVENT_TYPES.has(e.type)) return null;
  const o = { type: e.type };
  if (e.p) o.p = e.p.id;
  if (e.victim) o.v = e.victim.id;
  for (const k of ['pound', 'speed', 'n', 'x', 'y']) if (e[k] !== undefined) o[k] = e[k];
  return o;
}

export function decodeEvents(view, list) {
  const byId = (id) => view.players.find((p) => p.id === id);
  const out = [];
  for (const o of list || []) {
    const e = { ...o, p: o.p !== undefined ? byId(o.p) : undefined, victim: o.v !== undefined ? byId(o.v) : undefined };
    if ((o.p !== undefined && !e.p) || (o.v !== undefined && !e.victim)) continue;
    out.push(e);
  }
  return out;
}

const STATE_KEYS = ['id', 'x', 'y', 'vx', 'vy', 'state', 'facing', 'lives', 'stomps', 'grounded', 'invuln', 'shoveT', 'kills', 'falls'];

/** Applies a host snapshot onto a client-side view (a game object built with createGame). */
export function applySnapshot(view, s, makeInfo = (x) => x) {
  if (s.i) {
    const next = s.i.map((inf) => {
      let p = view.players.find((q) => q.id === inf.id);
      if (!p) {
        p = createPlayer(inf.id, 0, 0, { scale: inf.scale, team: inf.team });
        p.prevIn = emptyInput();
      }
      p.info = makeInfo({ ...inf, control: 'remote' }, p);
      return p;
    });
    view.players = next;
  }
  for (const row of s.p) {
    const p = view.players.find((q) => q.id === row[0]);
    if (!p) continue;
    STATE_KEYS.forEach((k, idx) => (p[k] = row[idx]));
    p.grounded = !!p.grounded;
    p.invuln = p.invuln ? 1 : 0;
    p.shoveT = p.shoveT ? 0.1 : 0;
    p.sx = p.x;
    p.sy = p.y;
  }
  const movers = view.level.platforms.filter((pl) => pl.move);
  s.m.forEach(([x, y], k) => {
    if (!movers[k]) return;
    movers[k].x = x;
    movers[k].y = y;
  });
  view.countdown = s.c;
  view.time = s.tm;
  view.finished = !!s.f;
  view.result = s.r;
  view.ms = s.ms || {};
  view.snapAt = 0;
  return decodeEvents(view, s.e);
}

/** Tap counters let quick presses survive network jitter. */
export function createNetInput() {
  const state = { ...emptyInput(), jumpN: 0, downN: 0, shoveN: 0 };
  let prev = emptyInput();
  let lastSent = '';
  return {
    update(cur) {
      for (const k of ['jump', 'down', 'shove']) if (cur[k] && !prev[k]) state[k + 'N']++;
      Object.assign(state, cur);
      prev = cur;
    },
    take(force) {
      const key = JSON.stringify(state);
      if (!force && key === lastSent) return null;
      lastSent = key;
      return { ...state };
    },
  };
}

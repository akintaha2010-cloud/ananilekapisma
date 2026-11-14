import { P, createPlayer, stepPlayer, resolvePlayers, applyShockwave, centerX } from './physics.js';
import { createLevel, updateLevel } from './maps.js';
import { createBrain, aiInput } from './ai.js';
import { emptyInput } from './input.js';
import { MODES, initRocks, updateRocks } from './modes.js';

/**
 * DOM-free match state. cfg: { mode, map, theme, lives, heroes: [{ control, color, hat, stache, diff, name, tag, team, slot, pad, touch }], ...mode options }
 * Same code runs locally, on the online host and in tools/sim.mjs.
 */
export function createGame(cfg, rand = Math.random) {
  const level = createLevel(cfg.map || 'avlu', cfg.theme);
  const mode = MODES[cfg.mode] || MODES.kapisma;
  const g = {
    cfg,
    level,
    mode,
    rand,
    players: [],
    nextId: 0,
    roster: 0,
    countdown: cfg.countdown ?? 3.2,
    time: 0,
    finished: false,
    result: null,
    endT: 0,
    ms: {},
    rocks: !!(mode.rocks || cfg.rocks),
  };
  g.addPlayer = (o) => addPlayer(g, o);
  const lives = mode.noLives ? 99 : cfg.lives ?? (mode.team ? 5 : 3);
  (cfg.heroes || []).forEach((h, k) => {
    const sp = level.spawns[k % level.spawns.length];
    addPlayer(g, { ...h, kind: 'hero', team: h.team ?? (mode.team ? 'A' : null), lives: h.lives ?? lives, x: sp.x, y: sp.y });
  });
  mode.init?.(g);
  if (g.rocks) initRocks(g);
  return g;
}

export function addPlayer(g, o) {
  const p = createPlayer(g.nextId++, 0, 0, { lives: o.lives ?? 3, scale: o.scale, spd: o.spd, mass: o.mass, team: o.team ?? null });
  p.x = o.x - p.w / 2;
  p.y = o.y - p.h;
  p.prevX = p.x;
  p.prevY = p.y;
  p.facing = o.x < (g.level.moatL + g.level.moatR) / 2 ? 1 : -1;
  p.invuln = o.invuln ?? 0;
  p.info = {
    kind: o.kind || 'hero',
    control: o.control || 'cpu',
    name: o.name || 'Kahraman',
    tag: o.tag ?? '',
    color: o.color ?? 0,
    hat: o.hat || 'fes',
    stache: o.stache || 'klasik',
    diff: o.diff || 'orta',
    maxLives: o.lives ?? 3,
    slot: o.slot ?? -1,
    pad: o.pad ?? -1,
    touch: !!o.touch,
    peer: o.peer ?? null,
  };
  p.brain = p.info.control === 'cpu' ? createBrain(p.info.diff, g.rand) : null;
  p.prevIn = emptyInput();
  g.players.push(p);
  g.roster++;
  return p;
}

function edges(cur, prev) {
  const tap = (k) => cur[k + 'N'] !== undefined && cur[k + 'N'] !== prev[k + 'N'];
  return {
    ...cur,
    jump: cur.jump || tap('jump'),
    jumpPressed: (cur.jump && !prev.jump) || tap('jump'),
    downPressed: (cur.down && !prev.down) || tap('down'),
    shovePressed: (cur.shove && !prev.shove) || tap('shove'),
  };
}

function respawn(g, p) {
  const others = g.players.filter((o) => o !== p && o.state !== 'out');
  let best = g.level.respawnXs[0];
  let bestD = -1;
  for (const x of g.level.respawnXs) {
    const d = Math.min(...others.map((o) => Math.abs(centerX(o) - x)), 9999);
    if (d > bestD) {
      bestD = d;
      best = x;
    }
  }
  Object.assign(p, { x: best - p.w / 2, y: -90, vx: 0, vy: 200, state: 'normal', invuln: P.invulnAfterRespawn, splashed: false, airJumps: 1, grounded: false, platform: null });
  p.prevX = p.x;
  p.prevY = p.y;
}

function credit(g, victim, events) {
  const h = victim.lastHit;
  if (!h || g.time - h.t > 4) return;
  const k = g.players.find((o) => o.id === h.id);
  if (!k || k === victim) return;
  k.kills += 1;
  events.push({ type: 'ko', p: k, victim });
}

function process(g, events) {
  const noLives = g.mode.noLives;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const p = e.p;
    switch (e.type) {
      case 'poundland':
        applyShockwave(p, g.players, events);
        break;
      case 'stomp':
        e.victim.lastHit = { id: p.id, t: g.time };
        if (noLives || (p.info.kind === 'minion' && e.victim.info.kind === 'hero')) e.victim.lives += 1;
        if (e.victim.lives <= 0) credit(g, e.victim, events);
        g.mode.onStomp?.(g, e, events);
        break;
      case 'shoved':
      case 'shocked':
        e.victim.lastHit = { id: p.id, t: g.time };
        break;
      case 'crushed':
        if (noLives) p.lives += 1;
        break;
      case 'fall':
        if (p.state !== 'squashed' && !noLives) p.lives -= 1;
        p.falls += 1;
        credit(g, p, events);
        g.mode.onFall?.(g, p, events);
        if (p.lives > 0) respawn(g, p);
        else {
          p.state = 'out';
          events.push({ type: 'out', p, fell: true });
        }
        break;
      default:
        break;
    }
  }
}

/** inputs: { [playerId]: input } for human / remote players. Returns the events of this step. */
export function stepGame(g, inputs, dt) {
  const events = [];
  if (g.countdown > 0) {
    const before = Math.ceil(g.countdown);
    g.countdown -= dt;
    if (Math.ceil(g.countdown) !== before) events.push({ type: g.countdown <= 0 ? 'go' : 'tick' });
  }
  const live = g.countdown <= 0 && !g.finished;
  if (live) g.time += dt;
  updateLevel(g.level, dt);
  if (live) {
    g.mode.update?.(g, dt, events);
    if (g.rocks) updateRocks(g, dt, events);
  }
  const ins = g.players.map((p) => {
    let cur = emptyInput();
    if (live) cur = p.brain ? aiInput(p, p.brain, g.players, g.level, dt, g) : inputs?.[p.id] || emptyInput();
    const e = edges(cur, p.prevIn);
    p.prevIn = cur;
    return e;
  });
  g.players.forEach((p, k) => stepPlayer(p, ins[k], dt, g.level, events));
  resolvePlayers(g.players, ins, events);
  process(g, events);
  if (!g.finished) {
    const r = g.mode.check(g);
    if (r) {
      g.finished = true;
      g.result = r;
      g.endT = 1.4;
      events.push({ type: 'end', result: r });
    }
  } else g.endT -= dt;
  for (let i = g.players.length - 1; i >= 0; i--) {
    const p = g.players[i];
    if (p.state !== 'out' || p.info.kind !== 'minion') continue;
    p.outT = (p.outT || 0) + dt;
    if (p.outT > 2.5) {
      g.players.splice(i, 1);
      g.roster++;
    }
  }
  return events;
}

export const heroesOf = (g) => g.players.filter((p) => p.info.kind === 'hero');

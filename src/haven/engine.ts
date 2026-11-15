import { buildHavenLevel, GROUND, VIEW_H, VIEW_W } from './levels';
import {
  ActKind,
  Body,
  BossKind,
  Enemy,
  FoeKind,
  Fx,
  HavenInput,
  HavenState,
  Level,
  Pickup,
  PickupKind,
  Player,
  ProjKind,
  Projectile,
  Solid,
  Team,
  WeaponKind,
} from './types';

export const GRAV = 980;
const JUMP_V = -370;
const SPEED = 112;

interface FoeDef {
  hp: number;
  w: number;
  h: number;
  speed: number;
  scale: number;
  name: string;
  dmg: number;
  windup: number;
  cd: number;
  reach: number;
  armor: number;
}

export const FOES: Record<FoeKind, FoeDef> = {
  bug: { hp: 34, w: 12, h: 30, speed: 56, scale: 1, name: 'Bug', dmg: 8, windup: 0.4, cd: 1.15, reach: 16, armor: 0 },
  glitch: { hp: 24, w: 12, h: 30, speed: 96, scale: 1, name: 'Glitch', dmg: 7, windup: 0.26, cd: 0.95, reach: 15, armor: 0 },
  spammer: { hp: 26, w: 12, h: 30, speed: 50, scale: 1, name: 'Spam Bot', dmg: 7, windup: 0.5, cd: 1.9, reach: 0, armor: 0 },
  firewall: { hp: 52, w: 14, h: 31, speed: 40, scale: 1.05, name: 'Firewall', dmg: 10, windup: 0.45, cd: 1.4, reach: 18, armor: 0 },
  conflict: { hp: 95, w: 18, h: 40, speed: 38, scale: 1.35, name: 'Merge Conflict', dmg: 15, windup: 0.62, cd: 1.8, reach: 24, armor: 3 },
  mert: { hp: 270, w: 18, h: 44, speed: 62, scale: 1.45, name: 'MERT - DEADLINE DESTROYER', dmg: 14, windup: 0.5, cd: 1.3, reach: 26, armor: 4 },
  tuna: { hp: 290, w: 18, h: 44, speed: 56, scale: 1.45, name: 'TUNA - THE DONER KING', dmg: 13, windup: 0.5, cd: 1.3, reach: 28, armor: 4 },
  ayaz: { hp: 250, w: 22, h: 52, speed: 40, scale: 1.7, name: 'ANKARA AYAZI', dmg: 14, windup: 0.6, cd: 1.5, reach: 30, armor: 5 },
  gokoz: { hp: 310, w: 18, h: 42, speed: 72, scale: 1.4, name: 'GOKOZ - THE GLITCH MASTER', dmg: 13, windup: 0.32, cd: 1.1, reach: 24, armor: 4 },
  buglord: { hp: 400, w: 26, h: 56, speed: 46, scale: 1.8, name: 'BUG LORD', dmg: 16, windup: 0.6, cd: 1.3, reach: 32, armor: 6 },
};

const BOSSES: BossKind[] = ['mert', 'tuna', 'ayaz', 'gokoz', 'buglord'];
export const isBoss = (k: FoeKind): k is BossKind => (BOSSES as string[]).includes(k);

const PHASE2_TEXT: Record<BossKind, string> = {
  mert: "DEADLINE'A 5 DAKIKA KALDI!",
  tuna: 'DONER ROBOT MODU!',
  ayaz: 'AYAZ SERTLESIYOR!',
  gokoz: 'GLITCH BOYUTU ACILDI!',
  buglord: 'OZGUR TACINI CIKARDI!',
};

const DEVIN_START: Record<number, string> = {
  101: 'Akin, bug istilasi! Saga dogru ilerle!',
  102: 'Kizilay karisik. Mert ilerde bir yerde...',
  103: 'Doner kokusu... Tuna yakinda!',
  104: 'Brrr! Ayaz var, dikkatli ol.',
  105: 'Kale glitchlenmis. Gokoz burada.',
  106: 'Ozgur yukarida! Son kez, Akin!',
};

const DEVIN_IDLE = [
  'Bir cay molasi? Sonra.',
  'Commit attin mi?',
  'Bug gordun mu ez gec!',
  'Ship it!',
  'Ankara ayazi bile seni durduramaz.',
];

interface AttackSpec {
  dur: number;
  a0: number;
  a1: number;
  reach: number;
  y: number;
  h: number;
  dmg: number;
  kb: number;
  down: boolean;
}

const PLAYER_ATTACKS: Partial<Record<ActKind, AttackSpec>> = {
  p1: { dur: 0.22, a0: 0.05, a1: 0.13, reach: 15, y: 24, h: 10, dmg: 9, kb: 50, down: false },
  p2: { dur: 0.22, a0: 0.05, a1: 0.13, reach: 15, y: 24, h: 10, dmg: 9, kb: 60, down: false },
  kick: { dur: 0.36, a0: 0.1, a1: 0.2, reach: 20, y: 18, h: 12, dmg: 16, kb: 170, down: true },
  jkick: { dur: 0.5, a0: 0.04, a1: 0.42, reach: 15, y: 16, h: 14, dmg: 14, kb: 150, down: true },
  slide: { dur: 0.42, a0: 0.02, a1: 0.32, reach: 12, y: 9, h: 9, dmg: 12, kb: 120, down: true },
  swing: { dur: 0.3, a0: 0.08, a1: 0.18, reach: 26, y: 26, h: 18, dmg: 19, kb: 140, down: true },
};

export function rand(s: HavenState): number {
  s.rngSeed = (s.rngSeed * 16807) % 2147483647;
  return (s.rngSeed - 1) / 2147483646;
}

function body(id: number, x: number, y: number, w: number, h: number, hp: number): Body {
  return { id, x, y, vx: 0, vy: 0, w, h, facing: 1, ground: false, hp, maxHp: hp, act: 'none', actT: 0, actDur: 0, hitDone: false, invT: 0, flashT: 0, dead: false, deadT: 0, animT: 0 };
}

export function createHavenState(levelId: number, seed = 12345): HavenState {
  const level = buildHavenLevel(levelId);
  const p: Player = {
    ...body(1, 60, GROUND, 12, 30, 100),
    combo: 0,
    comboT: 0,
    weapon: null,
    ammo: 0,
    coins: 0,
    lives: 3,
    special: 0,
    jumpBuf: 0,
    coyote: 0,
    slowT: 0,
    lastSafeX: 60,
    kills: 0,
    deaths: 0,
  };
  p.ground = true;
  return {
    level,
    t: 0,
    player: p,
    devin: { x: 30, y: GROUND - 40, say: DEVIN_START[levelId] ?? '', sayT: 4, healCd: 6, tipCd: 18 },
    helper: null,
    enemies: [],
    projs: [],
    pickups: [],
    fx: [],
    bus: null,
    camX: 0,
    lockX: null,
    checkpoint: level.checkpoints[0],
    phase: 'play',
    endT: 0,
    shake: 0,
    hitstop: 0,
    banner: { text: level.title, t: 2.2 },
    cues: [],
    bossId: null,
    nextId: 10,
    rngSeed: seed,
  };
}

const box = (b: Body) => ({ x: b.x - b.w / 2, y: b.y - b.h, w: b.w, h: b.h });
const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function hurtBox(b: Body) {
  const r = box(b);
  if (b.act === 'block' || b.act === 'slide') {
    const nh = b.act === 'slide' ? 12 : 20;
    return { x: r.x, y: b.y - nh, w: r.w, h: nh };
  }
  return r;
}

function moveBody(b: Body, dt: number, solids: Solid[], dropThrough = false) {
  b.vy = Math.min(560, b.vy + GRAV * dt);
  b.x += b.vx * dt;
  for (const s of solids) {
    if (s.oneWay) continue;
    if (b.y <= s.y + 0.5 || b.y - b.h >= s.y + s.h) continue;
    const l = b.x - b.w / 2;
    const r = b.x + b.w / 2;
    if (r > s.x && l < s.x + s.w) {
      if (b.x < s.x + s.w / 2) b.x = s.x - b.w / 2;
      else b.x = s.x + s.w + b.w / 2;
      b.vx = 0;
    }
  }
  const prev = b.y;
  b.y += b.vy * dt;
  b.ground = false;
  for (const s of solids) {
    const l = b.x - b.w / 2;
    const r = b.x + b.w / 2;
    if (r <= s.x || l >= s.x + s.w) continue;
    if (b.vy >= 0 && prev <= s.y + 0.5 && b.y >= s.y) {
      if (s.oneWay && dropThrough) continue;
      b.y = s.y;
      b.vy = 0;
      b.ground = true;
    } else if (!s.oneWay && b.vy < 0 && prev - b.h >= s.y + s.h - 0.5 && b.y - b.h < s.y + s.h) {
      b.y = s.y + s.h + b.h;
      b.vy = 0;
    }
  }
}

function groundAt(level: Level, x: number): number | null {
  let best: number | null = null;
  for (const s of level.solids) if (x >= s.x && x <= s.x + s.w && !s.oneWay && (best === null || s.y < best)) best = s.y;
  return best;
}

function fx(s: HavenState, kind: Fx['kind'], x: number, y: number, n: number, color: string, speed = 90, size = 2, life = 0.4) {
  for (let i = 0; i < n; i++) {
    const a = rand(s) * Math.PI * 2;
    const v = speed * (0.4 + rand(s) * 0.8);
    s.fx.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'shard' || kind === 'confetti' ? 80 : 0), life: life * (0.7 + rand(s) * 0.6), max: life, color, size });
  }
  if (s.fx.length > 400) s.fx.splice(0, s.fx.length - 400);
}

function popNum(s: HavenState, x: number, y: number, text: string, color: string) {
  s.fx.push({ kind: 'num', x, y, vx: 0, vy: -40, life: 0.7, max: 0.7, color, size: 1, text });
}

function say(s: HavenState, text: string, t = 3) {
  s.devin.say = text;
  s.devin.sayT = t;
}

function spawnPickup(s: HavenState, x: number, y: number, kind: PickupKind) {
  s.pickups.push({ x, y, vy: -150 - rand(s) * 60, kind, t: 0 });
}

function spawnFoe(s: HavenState, kind: FoeKind, x: number, y: number, clone = false): Enemy {
  const d = FOES[kind];
  const e: Enemy = {
    ...body(s.nextId++, x, y, d.w, d.h, clone ? 1 : d.hp),
    kind,
    boss: isBoss(kind) && !clone,
    name: d.name,
    scale: d.scale,
    aiT: 0.3 + rand(s) * 0.5,
    atkCd: 0.6 + rand(s) * 0.8,
    move: 'walk',
    phase: 1,
    armor: 0,
    clone,
    dir: 1,
  };
  e.facing = x > s.player.x ? -1 : 1;
  s.enemies.push(e);
  if (e.boss) {
    s.bossId = e.id;
    e.act = 'cast';
    e.actT = 0;
    e.actDur = 1.4;
    s.banner = { text: d.name, t: 2.4 };
    s.shake = 0.5;
    s.cues.push('boom');
  }
  return e;
}

function startWave(s: HavenState) {
  const enc = s.level.encounters.find((e) => e.started && !e.done);
  if (!enc || s.lockX === null) return;
  const wave = enc.waves[enc.waveIdx];
  wave.forEach((k, i) => {
    if (isBoss(k)) {
      spawnFoe(s, k, s.lockX! + VIEW_W * 0.72, -20);
      return;
    }
    const fromRight = i % 2 === 0;
    spawnFoe(s, k, fromRight ? s.lockX! + VIEW_W + 14 + i * 16 : s.lockX! - 14 - i * 16, GROUND);
  });
}

function shoot(
  s: HavenState,
  team: Team,
  kind: ProjKind,
  x: number,
  y: number,
  vx: number,
  vy: number,
  dmg: number,
  o: Partial<Pick<Projectile, 'grav' | 'pierce' | 'life' | 'w' | 'h' | 'delay'>> = {}
) {
  s.projs.push({ x, y, vx, vy, kind, team, dmg, life: o.life ?? 3, spin: 0, grav: o.grav ?? 0, pierce: o.pierce ?? false, w: o.w ?? 8, h: o.h ?? 8, hit: [], delay: o.delay ?? 0 });
}

function damagePlayer(s: HavenState, dmg: number, fromX: number, heavy: boolean) {
  const p = s.player;
  if (p.dead || p.invT > 0 || s.phase !== 'play') return false;
  const facingAttacker = (fromX - p.x) * p.facing > 0;
  if (p.act === 'block' && facingAttacker) {
    p.hp -= Math.ceil(dmg * 0.15);
    p.vx = -p.facing * 60;
    fx(s, 'spark', p.x + p.facing * 6, p.y - 18, 5, '#93C5FD', 70);
    s.cues.push('block');
  } else {
    p.hp -= dmg;
    p.act = heavy ? 'down' : 'hurt';
    p.actT = 0;
    p.actDur = heavy ? 0.7 : 0.3;
    p.vx = Math.sign(p.x - fromX || 1) * (heavy ? 150 : 80);
    if (heavy) p.vy = -170;
    p.invT = heavy ? 1.1 : 0.55;
    p.flashT = 0.12;
    p.combo = 0;
    s.shake = Math.max(s.shake, heavy ? 0.35 : 0.18);
    s.hitstop = 0.05;
    fx(s, 'spark', p.x, p.y - 18, 8, '#FCA5A5', 110);
    popNum(s, p.x, p.y - 34, `-${dmg}`, '#F87171');
    s.cues.push('hurt');
  }
  if (p.hp <= 0) killPlayer(s);
  return true;
}

function killPlayer(s: HavenState) {
  const p = s.player;
  p.lives -= 1;
  p.deaths += 1;
  fx(s, 'confetti', p.x, p.y - 15, 16, '#FDE047', 140, 2, 0.8);
  if (p.lives <= 0) {
    p.hp = 0;
    p.dead = true;
    s.phase = 'dead';
    s.endT = 0;
    return;
  }
  respawnPlayer(s);
  say(s, 'Kalk Akin! Bir can daha!', 2.5);
}

function respawnPlayer(s: HavenState) {
  const p = s.player;
  const x = s.lockX !== null ? s.lockX + 70 : Math.max(s.checkpoint, Math.min(p.lastSafeX, s.level.width - 40));
  p.x = x;
  p.y = (groundAt(s.level, x) ?? GROUND) - 60;
  p.vx = 0;
  p.vy = 0;
  p.hp = p.maxHp;
  p.act = 'none';
  p.invT = 2;
  s.projs = s.projs.filter((q) => q.team === 'hero');
}

function hitEnemy(s: HavenState, e: Enemy, dmg: number, fromX: number, kb: number, down: boolean, kind: ActKind | 'proj', projFromBehind = false) {
  if (e.dead || e.invT > 0 || e.act === 'vanish') return false;
  const dir = Math.sign(e.x - fromX) || 1;
  const front = (fromX - e.x) * e.facing > 0;
  if (e.kind === 'firewall' && front && !projFromBehind && kind !== 'kick' && kind !== 'slide' && kind !== 'jkick' && kind !== 'swing' && e.act !== 'hurt' && e.act !== 'down') {
    fx(s, 'spark', e.x + e.facing * 7, e.y - 16, 6, '#FDBA74', 80);
    e.vx = dir * 40;
    s.cues.push('block');
    return true;
  }
  e.hp -= dmg;
  e.flashT = 0.1;
  s.player.special = Math.min(100, s.player.special + dmg * 0.55);
  popNum(s, e.x, e.y - e.h - 4, `${dmg}`, dmg >= 15 ? '#FDE047' : '#FFFFFF');
  fx(s, 'spark', e.x - dir * 4, e.y - e.h * 0.6, dmg >= 15 ? 10 : 6, dmg >= 15 ? '#FDE047' : '#FFF7ED', 120);
  s.hitstop = Math.max(s.hitstop, dmg >= 15 ? 0.07 : 0.04);
  s.shake = Math.max(s.shake, dmg >= 15 ? 0.22 : 0.08);
  s.cues.push(dmg >= 15 ? 'heavy' : 'hit');
  if (e.clone) e.hp = 0;
  if (e.hp <= 0) {
    killEnemy(s, e, dir);
    return true;
  }
  const armored = e.boss || FOES[e.kind].armor > 0;
  if (armored) {
    e.armor += down ? 2 : 1;
    if (e.armor < FOES[e.kind].armor || e.act === 'dash' || e.act === 'spin' || e.act === 'cast') {
      e.vx = dir * kb * 0.15;
      return true;
    }
    e.armor = 0;
  }
  e.act = down ? 'down' : 'hurt';
  e.actT = 0;
  e.actDur = down ? (e.boss ? 0.6 : 0.85) : 0.26;
  e.vx = dir * kb * (e.boss ? 0.4 : 1);
  if (down) e.vy = e.boss ? -90 : -180;
  e.facing = dir > 0 ? -1 : 1;
  return true;
}

function killEnemy(s: HavenState, e: Enemy, dir: number) {
  e.dead = true;
  e.deadT = 0;
  e.hp = 0;
  e.vy = -200;
  e.vx = dir * 120;
  e.act = 'down';
  s.cues.push('ko');
  if (e.clone) {
    fx(s, 'code', e.x, e.y - 16, 12, '#22D3EE', 80);
    return;
  }
  s.player.kills += 1;
  fx(s, 'ring', e.x, e.y - e.h / 2, 1, '#FDE047', 0, e.boss ? 40 : 18, 0.35);
  const coins = e.boss ? 12 : 1 + Math.floor(rand(s) * 3);
  for (let i = 0; i < coins; i++) spawnPickup(s, e.x + (rand(s) - 0.5) * 10, e.y - 12, 'coin');
  const r = rand(s);
  if (!e.boss && r < 0.12) spawnPickup(s, e.x, e.y - 12, 'heal');
  else if (!e.boss && r < 0.2) spawnPickup(s, e.x, e.y - 12, (['doner', 'cay', 'simit'] as WeaponKind[])[Math.floor(rand(s) * 3)]);
  if (e.boss) {
    s.shake = 0.8;
    s.hitstop = 0.25;
    fx(s, 'confetti', e.x, e.y - 30, 40, '#FDE047', 180, 2, 1.2);
    s.banner = { text: 'BOSS YENILDI!', t: 2.2 };
    s.enemies.forEach((o) => {
      if (!o.dead && o !== e) killEnemy(s, o, 1);
    });
  }
}

function startAct(b: Body, act: ActKind, dur: number) {
  b.act = act;
  b.actT = 0;
  b.actDur = dur;
  b.hitDone = false;
}

let swingHits: number[] = [];

function updatePlayer(s: HavenState, inp: HavenInput, dt: number) {
  const p = s.player;
  if (p.dead) return;
  p.animT += dt;
  p.invT = Math.max(0, p.invT - dt);
  p.flashT = Math.max(0, p.flashT - dt);
  p.comboT = Math.max(0, p.comboT - dt);
  p.slowT = Math.max(0, p.slowT - dt);
  p.coyote = p.ground ? 0.09 : Math.max(0, p.coyote - dt);
  p.jumpBuf = inp.jump ? 0.13 : Math.max(0, p.jumpBuf - dt);
  const busy = p.act !== 'none' && p.act !== 'block';
  if (busy) {
    p.actT += dt;
    if (p.actT >= p.actDur || (p.act === 'jkick' && p.ground)) {
      if (p.act === 'p1' || p.act === 'p2') p.comboT = 0.32;
      p.act = 'none';
    }
  }
  const canAct = p.act === 'none' || p.act === 'block';
  const speed = SPEED * (p.slowT > 0 ? 0.55 : 1);
  if (canAct) {
    let mv = 0;
    if (inp.left) mv -= 1;
    if (inp.right) mv += 1;
    if (mv !== 0) p.facing = mv > 0 ? 1 : -1;
    if (inp.down && p.ground && !inp.kick && !inp.punch) {
      p.act = 'block';
      p.vx *= 0.5;
    } else {
      if (p.act === 'block') p.act = 'none';
      p.vx = mv * speed;
    }
    if (p.jumpBuf > 0 && (p.ground || p.coyote > 0) && p.act !== 'block') {
      p.vy = JUMP_V;
      p.ground = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      fx(s, 'dust', p.x, p.y, 4, '#E7E5E4', 40);
      s.cues.push('jump');
    }
    if (inp.special && p.special >= 100) {
      startAct(p, 'special', 0.7);
      p.special = 0;
      p.invT = 0.9;
      s.banner = { text: 'SHIP IT!', t: 1.4 };
      s.shake = 0.6;
      s.cues.push('special');
      for (let i = 0; i < 30; i++) fx(s, 'code', s.camX + rand(s) * VIEW_W, -10 - rand(s) * 60, 1, i % 2 ? '#4ADE80' : '#22D3EE', 10, 1, 1.2);
      for (const e of s.enemies) {
        if (e.dead || e.x < s.camX - 10 || e.x > s.camX + VIEW_W + 10) continue;
        hitEnemy(s, e, e.boss ? 30 : 45, p.x, 200, true, 'kick');
      }
    } else if (inp.punch) {
      if (p.weapon === 'skewer' || p.weapon === 'keyboard') {
        startAct(p, 'swing', p.weapon === 'skewer' ? 0.32 : 0.26);
        swingHits = [];
        p.ammo -= 1;
        s.cues.push('throw');
      } else if (!p.ground) {
        startAct(p, 'jkick', 0.5);
        swingHits = [];
      } else {
        const next: ActKind = p.comboT > 0 ? (p.combo === 1 ? 'p2' : p.combo === 2 ? 'kick' : 'p1') : 'p1';
        p.combo = next === 'p1' ? 1 : next === 'p2' ? 2 : 0;
        startAct(p, next, PLAYER_ATTACKS[next]!.dur);
        swingHits = [];
        p.vx = p.facing * (next === 'kick' ? 70 : 40);
      }
    } else if (inp.kick) {
      swingHits = [];
      if (!p.ground) startAct(p, 'jkick', 0.5);
      else if (inp.down || Math.abs(p.vx) > 60) {
        startAct(p, 'slide', 0.42);
        p.vx = p.facing * 210;
      } else {
        startAct(p, 'kick', 0.36);
        p.vx = p.facing * 70;
        p.combo = 0;
      }
    } else if (inp.throw && p.weapon && p.weapon !== 'skewer' && p.weapon !== 'keyboard') {
      startAct(p, 'throw', 0.25);
      const hx = p.x + p.facing * 8;
      const hy = p.y - 22;
      if (p.weapon === 'doner') shoot(s, 'hero', 'doner', hx, hy, p.facing * 270, -30, 18, { grav: 140, w: 10, h: 6 });
      else if (p.weapon === 'cay') shoot(s, 'hero', 'cay', hx, hy, p.facing * 200, -180, 14, { grav: 620, w: 6, h: 7 });
      else shoot(s, 'hero', 'simit', hx, hy, p.facing * 250, 0, 11, { pierce: true, life: 1.1, w: 10, h: 10 });
      p.ammo -= 1;
      s.cues.push('throw');
    }
  } else if (p.act === 'slide') {
    p.vx *= Math.pow(0.12, dt);
  } else if (p.act === 'jkick') {
    p.vx = Math.max(-speed * 1.3, Math.min(speed * 1.3, p.vx + p.facing * 300 * dt));
  } else if (p.act !== 'hurt' && p.act !== 'down') {
    p.vx *= Math.pow(0.02, dt);
  } else {
    p.vx *= Math.pow(0.2, dt);
  }
  if (p.weapon && p.ammo <= 0) {
    p.weapon = null;
    fx(s, 'shard', p.x, p.y - 20, 6, '#A8A29E', 80);
  }
  if (!inp.up && p.vy < -120 && p.act !== 'hurt' && p.act !== 'down') p.vy = -120;
  moveBody(p, dt, s.level.solids, inp.down && inp.jump);
  if (p.ground && groundAt(s.level, p.x - 8) !== null && groundAt(s.level, p.x + 8) !== null) p.lastSafeX = p.x;
  const minX = s.lockX !== null ? s.lockX + 8 : 8;
  const maxX = s.lockX !== null ? s.lockX + VIEW_W - 8 : s.level.width - 8;
  p.x = Math.max(minX, Math.min(maxX, p.x));
  if (p.y > VIEW_H + 40) {
    p.hp -= 20;
    s.cues.push('hurt');
    if (p.hp <= 0) killPlayer(s);
    else {
      p.x = p.lastSafeX;
      p.y = (groundAt(s.level, p.x) ?? GROUND) - 40;
      p.vx = 0;
      p.vy = 0;
      p.invT = 1.2;
      p.act = 'none';
    }
  }
  const spec = PLAYER_ATTACKS[p.act];
  if (spec && p.actT >= spec.a0 && p.actT <= spec.a1) {
    const hb = { x: p.facing > 0 ? p.x : p.x - spec.reach - p.w / 2, y: p.y - spec.y - spec.h / 2, w: spec.reach + p.w / 2, h: spec.h };
    const dmg = p.act === 'swing' ? (p.weapon === 'keyboard' || !p.weapon ? 16 : 20) : spec.dmg;
    for (const e of s.enemies) {
      if (e.dead || swingHits.includes(e.id) || !overlap(hb, hurtBox(e))) continue;
      swingHits.push(e.id);
      hitEnemy(s, e, dmg, p.x, spec.kb, spec.down, p.act);
      if (p.act === 'jkick') p.vy = Math.min(p.vy, -120);
    }
    for (const c of s.level.crates) {
      if (c.broken || swingHits.includes(-1000 - s.level.crates.indexOf(c)) || !overlap(hb, c)) continue;
      swingHits.push(-1000 - s.level.crates.indexOf(c));
      hitCrate(s, c);
    }
  }
}

function hitCrate(s: HavenState, c: Level['crates'][number]) {
  c.hp -= 1;
  c.shake = 0.2;
  s.cues.push('hit');
  fx(s, 'shard', c.x + c.w / 2, c.y + c.h / 2, 5, '#B45309', 90);
  if (c.hp <= 0) {
    c.broken = true;
    fx(s, 'shard', c.x + c.w / 2, c.y + c.h / 2, 12, '#92400E', 130, 3, 0.7);
    for (const l of c.loot) spawnPickup(s, c.x + c.w / 2 + (rand(s) - 0.5) * 8, c.y, l);
  }
}

function enemyHitbox(e: Enemy, reach: number) {
  return { x: e.facing > 0 ? e.x : e.x - reach - e.w / 2, y: e.y - e.h * 0.8, w: reach + e.w / 2, h: e.h * 0.55 };
}

function updateEnemy(s: HavenState, e: Enemy, dt: number) {
  const p = s.player;
  const d = FOES[e.kind];
  e.animT += dt;
  e.flashT = Math.max(0, e.flashT - dt);
  e.invT = Math.max(0, e.invT - dt);
  if (e.dead) {
    e.deadT += dt;
    e.vx *= Math.pow(0.3, dt);
    moveBody(e, dt, s.level.solids);
    return;
  }
  e.atkCd -= dt;
  const dx = p.x - e.x;
  const dist = Math.abs(dx);
  const cdMul = e.phase === 2 ? 0.62 : 1;
  if (e.act !== 'none') {
    e.actT += dt;
    if (e.act === 'hurt' || e.act === 'down') e.vx *= Math.pow(0.05, dt);
    if (e.act === 'windup') e.vx = 0;
    if (e.act === 'attack' && !e.hitDone && e.actT > 0.04) {
      if (overlap(enemyHitbox(e, d.reach), hurtBox(p))) {
        e.hitDone = true;
        damagePlayer(s, d.dmg, e.x, d.dmg >= 14);
      }
    }
    if (e.boss || e.kind === 'gokoz') bossActing(s, e, dt);
    if (e.actT >= e.actDur) finishAct(s, e);
  } else {
    if (e.boss) bossThink(s, e, cdMul);
    else foeThink(s, e, dx, dist, d);
  }
  if (e.act === 'none' && (dist > 4 || e.boss)) e.facing = dx >= 0 ? 1 : -1;
  if (e.boss && e.phase === 1 && e.hp < e.maxHp / 2) {
    e.phase = 2;
    s.banner = { text: PHASE2_TEXT[e.kind as BossKind], t: 2.2 };
    s.shake = 0.5;
    if (e.kind === 'buglord') {
      s.helper = { ...body(s.nextId++, p.x - 30, -20, 12, 30, 999), who: 'ozgur', atkCd: 1 };
      say(s, 'Ozgur geldi! Birlikte!', 3);
    }
  }
  moveBody(e, dt, s.level.solids);
  if (s.lockX !== null) {
    const inside = e.x > s.lockX + 4 && e.x < s.lockX + VIEW_W - 4;
    if (inside || e.boss) e.x = Math.max(s.lockX + 10, Math.min(s.lockX + VIEW_W - 10, e.x));
  }
  if (e.y > VIEW_H + 40) killEnemy(s, e, 1);
}

function foeThink(s: HavenState, e: Enemy, dx: number, dist: number, d: FoeDef) {
  const crowd = s.enemies.some((o) => o !== e && !o.dead && Math.abs(o.x - e.x) < 14 && Math.sign(o.x - e.x) === Math.sign(dx));
  if (e.kind === 'spammer') {
    if (dist < 90) e.vx = -Math.sign(dx) * d.speed;
    else if (dist > 170) e.vx = Math.sign(dx) * d.speed;
    else e.vx = 0;
    if (e.atkCd <= 0 && dist < 240) {
      startAct(e, 'windup', d.windup);
      e.move = 'throw';
    }
    return;
  }
  if (e.clone && e.atkCd <= 0 && dist < 26) {
    startAct(e, 'windup', 0.3);
    return;
  }
  if (dist > d.reach + 4) {
    e.vx = Math.sign(dx) * d.speed * (crowd ? 0.3 : 1);
    if (e.kind === 'glitch' && dist > 60 && dist < 120 && e.atkCd <= 0) {
      startAct(e, 'windup', 0.22);
      e.move = 'dash';
    }
  } else {
    e.vx = 0;
    if (e.atkCd <= 0) {
      startAct(e, 'windup', d.windup);
      e.move = 'melee';
    } else if (rand(s) < 0.01) e.vx = -Math.sign(dx) * d.speed * 0.8;
  }
}

function finishAct(s: HavenState, e: Enemy) {
  const d = FOES[e.kind];
  const p = s.player;
  const prev = e.act;
  e.act = 'none';
  if (prev === 'down') e.invT = 0.35;
  if (prev !== 'windup') return;
  if (e.boss) return bossExecute(s, e);
  if (e.move === 'throw') {
    shoot(s, 'foe', 'err', e.x + e.facing * 8, e.y - 22, e.facing * 140, 0, d.dmg, { w: 8, h: 6 });
    s.cues.push('throw');
    e.atkCd = d.cd * (0.8 + rand(s) * 0.6);
  } else if (e.move === 'dash') {
    startAct(e, 'dash', 0.35);
    e.vx = e.facing * 230;
    e.atkCd = d.cd * 1.5;
  } else {
    startAct(e, 'attack', 0.22);
    e.vx = e.facing * 30;
    e.atkCd = d.cd * (0.8 + rand(s) * 0.7);
  }
  void p;
}

function bossThink(s: HavenState, e: Enemy, cdMul: number) {
  const p = s.player;
  const d = FOES[e.kind];
  const dx = p.x - e.x;
  const dist = Math.abs(dx);
  if (e.atkCd > 0) {
    e.vx = dist > d.reach + 10 ? Math.sign(dx) * d.speed : 0;
    return;
  }
  const moves: Record<BossKind, string[]> = {
    mert: ['slam', 'dash', 'clocks', 'melee'],
    tuna: ['spin', 'lavas', 'ayran', 'melee'],
    ayaz: ['ice', 'breath', 'spikes', 'melee'],
    gokoz: ['teleport', 'clones', 'orbs', 'teleport'],
    buglord: ['summon', 'laser', 'orbs', 'slam'],
  };
  let list = moves[e.kind as BossKind];
  if (dist < d.reach + 8) list = [...list, 'melee', 'melee'];
  if (e.kind === 'gokoz' && s.enemies.some((o) => o.clone && !o.dead)) list = list.filter((m) => m !== 'clones');
  if (e.kind === 'buglord' && s.enemies.filter((o) => !o.dead && !o.boss).length >= 3) list = list.filter((m) => m !== 'summon');
  e.move = list[Math.floor(rand(s) * list.length)];
  e.vx = 0;
  const wind: Record<string, number> = { slam: 0.6, dash: 0.45, clocks: 0.5, melee: d.windup, spin: 0.5, lavas: 0.4, ayran: 0.5, ice: 0.5, breath: 0.6, spikes: 0.4, teleport: 0.1, clones: 0.5, orbs: 0.5, summon: 0.6, laser: 0.8 };
  startAct(e, e.move === 'teleport' ? 'vanish' : 'windup', (wind[e.move] ?? 0.5) * (e.phase === 2 ? 0.8 : 1));
  e.atkCd = d.cd * cdMul * (1 + rand(s) * 0.5);
  if (e.move === 'laser') e.dir = rand(s) < 0.5 ? 1 : -1;
}

function bossExecute(s: HavenState, e: Enemy) {
  const p = s.player;
  const fy = e.y;
  switch (e.move) {
    case 'melee':
      startAct(e, 'attack', 0.25);
      e.vx = e.facing * 40;
      break;
    case 'slam':
      startAct(e, 'slam', 0.4);
      s.shake = 0.4;
      s.cues.push('boom');
      fx(s, 'dust', e.x, fy, 12, '#D6D3D1', 120);
      shoot(s, 'foe', 'shock', e.x, fy - 6, 170, 0, 15, { w: 12, h: 12, life: 2.2, pierce: true });
      shoot(s, 'foe', 'shock', e.x, fy - 6, -170, 0, 15, { w: 12, h: 12, life: 2.2, pierce: true });
      break;
    case 'dash':
      startAct(e, 'dash', 0.7);
      e.vx = e.facing * 270;
      break;
    case 'clocks':
    case 'spikes':
      startAct(e, 'cast', 0.5);
      for (let i = -1; i <= 1; i++) {
        const x = p.x + i * 46 + (rand(s) - 0.5) * 16;
        if (e.move === 'clocks') shoot(s, 'foe', 'clock', x, -20, 0, 0, 12, { grav: 420, w: 10, h: 10, delay: 0.5 + (i + 1) * 0.2, life: 3 });
        else shoot(s, 'foe', 'shock', x, GROUND - 8, 0, 0, 14, { w: 12, h: 18, delay: 0.55 + (i + 1) * 0.15, life: 0.4, pierce: true });
      }
      break;
    case 'spin':
      startAct(e, 'spin', 1.3);
      e.vx = e.facing * 160;
      break;
    case 'lavas':
      startAct(e, 'attack', 0.3);
      e.hitDone = true;
      for (let i = 0; i < 3; i++) shoot(s, 'foe', 'lavas', e.x, fy - 34, e.facing * (90 + i * 50), -230, 10, { grav: 600, w: 10, h: 6 });
      s.cues.push('throw');
      break;
    case 'ayran':
      startAct(e, 'attack', 0.3);
      e.hitDone = true;
      shoot(s, 'foe', 'ayran', e.x, fy - 36, (p.x - e.x) * 0.9, -280, 16, { grav: 560, w: 8, h: 10 });
      break;
    case 'ice':
    case 'orbs': {
      startAct(e, 'cast', 0.4);
      const n = e.move === 'ice' ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const ang = Math.atan2(p.y - 18 - (fy - e.h * 0.7), p.x - e.x) + (i - (n - 1) / 2) * 0.22;
        const sp = e.move === 'ice' ? 160 : 75;
        shoot(s, 'foe', e.move === 'ice' ? 'ice' : 'orb', e.x, fy - e.h * 0.7, Math.cos(ang) * sp, Math.sin(ang) * sp, e.move === 'ice' ? 9 : 10, { life: e.move === 'ice' ? 2.5 : 4, w: 8, h: 8 });
      }
      break;
    }
    case 'breath':
      startAct(e, 'attack', 1.0);
      e.hitDone = true;
      e.move = 'breathing';
      break;
    case 'clones':
      startAct(e, 'cast', 0.5);
      spawnFoe(s, 'gokoz', Math.max((s.lockX ?? 0) + 30, p.x - 90), GROUND, true);
      spawnFoe(s, 'gokoz', Math.min((s.lockX ?? 0) + VIEW_W - 30, p.x + 90), GROUND, true);
      fx(s, 'code', e.x, e.y - 20, 16, '#22D3EE', 90);
      break;
    case 'summon':
      startAct(e, 'cast', 0.6);
      spawnFoe(s, 'bug', (s.lockX ?? 0) - 10, GROUND);
      spawnFoe(s, 'glitch', (s.lockX ?? 0) + VIEW_W + 10, GROUND);
      break;
    case 'laser': {
      startAct(e, 'cast', 0.4);
      const low = e.dir > 0;
      const x0 = e.facing > 0 ? e.x : e.x;
      shoot(s, 'foe', 'laser', x0, low ? GROUND - 5 : GROUND - 25, e.facing * 380, 0, 16, { w: 26, h: 6, life: 1.6, pierce: true });
      s.cues.push('boom');
      break;
    }
  }
}

function bossActing(s: HavenState, e: Enemy, dt: number) {
  const p = s.player;
  if (e.act === 'vanish' && e.actT + dt >= e.actDur) {
    const side = rand(s) < 0.5 ? -1 : 1;
    e.x = Math.max((s.lockX ?? 0) + 20, Math.min((s.lockX ?? 0) + VIEW_W - 20, p.x + side * 50));
    e.facing = side > 0 ? -1 : 1;
    fx(s, 'code', e.x, e.y - 20, 12, '#A78BFA', 70);
    e.act = 'none';
    startAct(e, 'windup', 0.28);
    e.move = 'melee';
    return;
  }
  if ((e.act === 'dash' || e.act === 'spin') && overlap(box(e), hurtBox(p))) {
    if (!e.hitDone) {
      e.hitDone = true;
      damagePlayer(s, e.act === 'spin' ? 11 : 14, e.x, true);
    }
  }
  if (e.act === 'spin' && Math.floor(e.actT / 0.3) !== Math.floor((e.actT - dt) / 0.3)) e.hitDone = false;
  if ((e.act === 'dash' || e.act === 'spin') && s.lockX !== null && (e.x <= s.lockX + 12 || e.x >= s.lockX + VIEW_W - 12)) {
    e.vx = -e.vx;
    e.facing = e.vx > 0 ? 1 : -1;
    if (e.act === 'dash') e.actT = e.actDur;
  }
  if (e.act === 'attack' && e.move === 'breathing') {
    const inCone = (p.x - e.x) * e.facing > 0 && Math.abs(p.x - e.x) < 100 && p.y > e.y - e.h;
    if (Math.floor(e.actT * 10) % 2 === 0) fx(s, 'snow', e.x + e.facing * 16, e.y - e.h * 0.75, 2, '#E0F2FE', 120, 2, 0.6);
    if (inCone) {
      p.slowT = 1.6;
      if (Math.floor(e.actT / 0.35) !== Math.floor((e.actT - dt) / 0.35)) damagePlayer(s, 4, e.x, false);
    }
  }
}

function updateProjectiles(s: HavenState, dt: number) {
  const p = s.player;
  for (const q of s.projs) {
    if (q.delay > 0) {
      q.delay -= dt;
      continue;
    }
    q.life -= dt;
    q.vy += q.grav * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.spin += dt * 12;
    if (q.kind === 'orb' && q.team === 'foe') {
      const a = Math.atan2(p.y - 16 - q.y, p.x - q.x);
      q.vx += Math.cos(a) * 60 * dt;
      q.vy += Math.sin(a) * 60 * dt;
    }
    const r = { x: q.x - q.w / 2, y: q.y - q.h / 2, w: q.w, h: q.h };
    const g = groundAt(s.level, q.x);
    const hitGround = q.grav > 0 && g !== null && q.y >= g - 2;
    if (q.team === 'hero') {
      for (const e of s.enemies) {
        if (e.dead || q.hit.includes(e.id) || !overlap(r, hurtBox(e))) continue;
        q.hit.push(e.id);
        const behind = (q.vx > 0 && e.facing > 0) || (q.vx < 0 && e.facing < 0);
        hitEnemy(s, e, q.dmg, q.x - Math.sign(q.vx) * 10, 110, q.kind === 'cay' || q.kind === 'doner', 'proj', behind || q.kind === 'cay');
        if (!q.pierce) q.life = 0;
        break;
      }
      for (const c of s.level.crates) if (!c.broken && q.life > 0 && overlap(r, c)) {
        hitCrate(s, c);
        if (!q.pierce) q.life = 0;
      }
    } else if (q.life > 0 && overlap(r, hurtBox(p))) {
      if (damagePlayer(s, q.dmg, q.x - Math.sign(q.vx || 1) * 10, q.kind === 'shock' || q.kind === 'laser' || q.kind === 'ayran') || !q.pierce) {
        if (!q.pierce) q.life = 0;
      }
    }
    if (hitGround || q.life <= 0) {
      if (q.kind === 'cay' || q.kind === 'ayran') {
        fx(s, 'shard', q.x, q.y, 10, q.kind === 'cay' ? '#FCA5A5' : '#F8FAFC', 100);
        const rad = q.kind === 'cay' ? 26 : 34;
        if (q.team === 'hero') {
          for (const e of s.enemies) if (!e.dead && !q.hit.includes(e.id) && Math.abs(e.x - q.x) < rad && Math.abs(e.y - q.y) < 30) hitEnemy(s, e, 8, q.x, 90, false, 'proj', true);
        } else if (Math.abs(p.x - q.x) < rad && Math.abs(p.y - q.y) < 30) damagePlayer(s, q.dmg, q.x, true);
        s.cues.push('boom');
      } else if (q.kind === 'clock') fx(s, 'shard', q.x, q.y, 6, '#FDE047', 70);
      q.life = 0;
    }
    if (q.x < s.camX - 60 || q.x > s.camX + VIEW_W + 60) q.life = 0;
  }
  s.projs = s.projs.filter((q) => q.life > 0);
}

function updatePickups(s: HavenState, dt: number) {
  const p = s.player;
  const pr = box(p);
  for (const k of s.pickups) {
    k.t += dt;
    k.vy = Math.min(400, k.vy + GRAV * dt);
    const g = groundAt(s.level, k.x);
    k.y += k.vy * dt;
    if (g !== null && k.y >= g - 1 && k.vy > 0) {
      k.y = g - 1;
      k.vy = -k.vy * 0.3;
      if (Math.abs(k.vy) < 30) k.vy = 0;
    }
    if (k.y > VIEW_H + 20) k.t = 999;
    if (k.t > 0.25 && overlap(pr, { x: k.x - 6, y: k.y - 10, w: 12, h: 12 })) {
      collect(s, k);
      k.t = 999;
    }
  }
  s.pickups = s.pickups.filter((k) => k.t < 30);
}

function collect(s: HavenState, k: Pickup) {
  const p = s.player;
  s.cues.push('pickup');
  if (k.kind === 'coin') {
    p.coins += 1;
    fx(s, 'spark', k.x, k.y - 4, 3, '#FDE047', 40);
  } else if (k.kind === 'heal') {
    p.hp = Math.min(p.maxHp, p.hp + 35);
    popNum(s, p.x, p.y - 36, '+35', '#4ADE80');
  } else {
    p.weapon = k.kind;
    p.ammo = k.kind === 'doner' ? 4 : k.kind === 'cay' ? 3 : k.kind === 'simit' ? 4 : k.kind === 'skewer' ? 12 : 14;
    popNum(s, p.x, p.y - 36, WEAPON_LABEL[k.kind], '#FDE047');
  }
}

export const WEAPON_LABEL: Record<WeaponKind, string> = {
  doner: 'DONER',
  cay: 'CAY BARDAGI',
  simit: 'SIMIT',
  skewer: 'DONER SISI',
  keyboard: 'KLAVYE',
};

function updateEncounters(s: HavenState) {
  const p = s.player;
  for (const enc of s.level.encounters) {
    if (enc.done) continue;
    if (!enc.started) {
      if (p.x > enc.x + VIEW_W * 0.42) {
        enc.started = true;
        s.lockX = enc.x;
        if (enc.tip) say(s, enc.tip, 3.5);
        if (enc.bus) {
          s.bus = { x: enc.x + VIEW_W + 70, dir: -1, stopX: enc.x - 90, t: 0, spawned: false };
          s.banner = { text: 'EGO 404 GELIYOR!', t: 1.8 };
        } else startWave(s);
      }
      break;
    }
    const alive = s.enemies.some((e) => !e.dead);
    if (alive || s.bus) break;
    if (Math.abs(s.camX - (s.lockX ?? s.camX)) > 4) break;
    enc.waveIdx += 1;
    if (enc.waveIdx < enc.waves.length) startWave(s);
    else {
      enc.done = true;
      s.lockX = null;
      s.enemies = s.enemies.filter((e) => !e.dead || e.deadT < 1);
      if (!s.level.encounters.some((x) => !x.done)) s.banner = { text: 'CIKISA KOS!', t: 1.6 };
      else s.banner = { text: 'DEVAM >>', t: 1.2 };
    }
    break;
  }
}

function updateBus(s: HavenState, dt: number) {
  const b = s.bus;
  if (!b) return;
  b.t += dt;
  b.x += b.dir * 230 * dt;
  const p = s.player;
  if (Math.abs(p.x - b.x) < 44 && p.y > GROUND - 34) damagePlayer(s, 14, b.x - b.dir * 30, true);
  if (!b.spawned && b.x < (s.lockX ?? 0) + VIEW_W * 0.55) {
    b.spawned = true;
    s.cues.push('boom');
    startWave(s);
  }
  if (b.x < b.stopX) s.bus = null;
}

function updateDevin(s: HavenState, dt: number) {
  const p = s.player;
  const d = s.devin;
  const tx = p.x - p.facing * 24;
  const ty = Math.min(p.y, GROUND) - 44 + Math.sin(s.t * 3) * 3;
  d.x += (tx - d.x) * Math.min(1, dt * 3);
  d.y += (ty - d.y) * Math.min(1, dt * 3);
  d.sayT = Math.max(0, d.sayT - dt);
  d.healCd -= dt;
  d.tipCd -= dt;
  if (p.hp < p.maxHp * 0.35 && d.healCd <= 0 && !p.dead) {
    d.healCd = 26;
    spawnPickup(s, d.x, d.y + 8, 'heal');
    say(s, 'Cay molasi! Al bunu!', 2.5);
  } else if (d.tipCd <= 0 && d.sayT <= 0) {
    d.tipCd = 16 + rand(s) * 8;
    say(s, DEVIN_IDLE[Math.floor(rand(s) * DEVIN_IDLE.length)], 2.4);
  }
}

function updateHelper(s: HavenState, dt: number) {
  const h = s.helper;
  if (!h) return;
  const p = s.player;
  h.animT += dt;
  const tx = p.x - p.facing * 34;
  h.vx = Math.abs(tx - h.x) > 10 ? Math.sign(tx - h.x) * 90 : 0;
  moveBody(h, dt, s.level.solids);
  if (h.y > VIEW_H) {
    h.x = p.x;
    h.y = GROUND - 40;
  }
  h.atkCd -= dt;
  const target = s.enemies.find((e) => !e.dead && e.boss) ?? s.enemies.find((e) => !e.dead);
  if (target) h.facing = target.x > h.x ? 1 : -1;
  if (target && h.atkCd <= 0) {
    h.atkCd = 1.5;
    startAct(h, 'cast', 0.3);
    const a = Math.atan2(target.y - target.h / 2 - (h.y - 20), target.x - h.x);
    shoot(s, 'hero', 'orb', h.x, h.y - 20, Math.cos(a) * 200, Math.sin(a) * 200, 12, { w: 8, h: 8, life: 2 });
  }
  if (h.act !== 'none') {
    h.actT += dt;
    if (h.actT > h.actDur) h.act = 'none';
  }
}

function updateFx(s: HavenState, dt: number) {
  for (const f of s.fx) {
    f.life -= dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.kind === 'shard' || f.kind === 'confetti' || f.kind === 'dust') f.vy += (f.kind === 'dust' ? 60 : 400) * dt;
    if (f.kind === 'code') f.vy = 90;
    if (f.kind === 'spark') {
      f.vx *= Math.pow(0.05, dt);
      f.vy *= Math.pow(0.05, dt);
    }
  }
  s.fx = s.fx.filter((f) => f.life > 0);
}

export function stepHaven(s: HavenState, inp: HavenInput, dt: number) {
  s.cues.length = 0;
  s.t += dt;
  s.banner.t = Math.max(0, s.banner.t - dt);
  s.shake = Math.max(0, s.shake - dt * 1.8);
  updateFx(s, dt);
  if (s.phase !== 'play') {
    s.endT += dt;
    return;
  }
  if (s.hitstop > 0) {
    s.hitstop -= dt;
    return;
  }
  updatePlayer(s, inp, dt);
  for (const e of s.enemies) updateEnemy(s, e, dt);
  s.enemies = s.enemies.filter((e) => !e.dead || e.deadT < 1.2);
  updateProjectiles(s, dt);
  updatePickups(s, dt);
  updateBus(s, dt);
  updateDevin(s, dt);
  updateHelper(s, dt);
  for (const c of s.level.crates) c.shake = Math.max(0, c.shake - dt);
  const p = s.player;
  for (const cp of s.level.checkpoints) if (p.x > cp && cp > s.checkpoint) {
    s.checkpoint = cp;
    s.banner = { text: 'KAYIT NOKTASI', t: 1 };
  }
  updateEncounters(s);
  const target = s.lockX ?? Math.max(0, Math.min(s.level.width - VIEW_W, p.x - VIEW_W * 0.42));
  s.camX += (target - s.camX) * Math.min(1, dt * 6);
  if (Math.abs(target - s.camX) < 0.5) s.camX = target;
  if (s.level.encounters.every((e) => e.done) && p.x >= s.level.exitX) {
    s.phase = 'won';
    s.endT = 0;
    s.banner = { text: 'BOLUM TAMAM!', t: 3 };
    s.cues.push('win');
  }
}

export function starsFor(s: HavenState): number {
  const p = s.player;
  return p.deaths === 0 ? 3 : p.deaths === 1 ? 2 : 1;
}

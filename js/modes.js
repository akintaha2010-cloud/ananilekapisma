import { P, WORLD, centerX, isActive, overlapX, overlapY } from './physics.js';

const heroes = (g) => g.players.filter((p) => p.info.kind === 'hero');
const aliveHeroes = (g) => heroes(g).filter((p) => p.state !== 'out');
const enemies = (g) => g.players.filter((p) => p.team === 'B' && p.state !== 'out');
const pick = (g, arr) => arr[Math.floor(g.rand() * arr.length)];

export const ENEMY_COLORS = [
  { name: 'Akıncı', h: 8, s: 30 },
  { name: 'Haydut', h: 95, s: 22 },
  { name: 'Asker', h: 215, s: 18 },
];
export const BOSS_COLOR = { name: 'Kara', h: 270, s: 18 };

function ffaCheck(g) {
  const alive = g.players.filter((p) => p.state !== 'out');
  if (alive.length > 1) return null;
  return { winnerId: alive[0]?.id ?? null };
}

function teamCheck(g, extra) {
  if (!aliveHeroes(g).length) return { team: 'B', reason: 'Kahramanlar düştü' };
  return extra(g);
}

/* ---------- Mancınık taşları ---------- */

function landingY(level, x) {
  let y = WORLD.waterY;
  for (const pl of level.platforms) if (x > pl.x && x < pl.x + pl.w && pl.y < y) y = pl.y;
  return y;
}

export function initRocks(g) {
  g.ms.rocks = [];
  g.ms.rockT = 2.5;
  g.ms.rockN = 0;
}

export function updateRocks(g, dt, events) {
  const ms = g.ms;
  const every = g.cfg.rockEvery ?? 1.5;
  ms.rockT -= dt;
  if (ms.rockT <= 0) {
    ms.rockT = every * (0.6 + g.rand() * 0.8);
    const lv = g.level;
    const alive = g.players.filter((p) => p.state !== 'out');
    let x = lv.moatL + 40 + g.rand() * (lv.moatR - lv.moatL - 80);
    if (alive.length && g.rand() < 0.55) x = centerX(pick(g, alive)) + (g.rand() - 0.5) * 120;
    x = Math.max(lv.moatL + 20, Math.min(lv.moatR - 20, x));
    ms.rocks.push({ id: ms.rockN++, x, y: -60, vy: 0, r: 24, warn: 1.1, ty: landingY(lv, x) });
    events.push({ type: 'rockwarn', x });
  }
  for (let i = ms.rocks.length - 1; i >= 0; i--) {
    const k = ms.rocks[i];
    if (k.warn > 0) {
      k.warn -= dt;
      continue;
    }
    const prevY = k.y;
    k.vy = Math.min(k.vy + 2600 * dt, 1500);
    k.y += k.vy * dt;
    const box = { x: k.x - k.r * 0.8, y: k.y - k.r * 0.8, w: k.r * 1.6, h: k.r * 1.6 };
    let done = false;
    for (const p of g.players) {
      if (!isActive(p) || p.invuln > 0) continue;
      if (overlapX(p, box) <= 0 || overlapY(p, box) <= 0) continue;
      if (!g.mode.noLives) p.lives -= 1;
      p.state = 'squashed';
      p.squashT = P.squashTime;
      p.shoveT = 0;
      p.vx = 0;
      p.lastHit = null;
      events.push({ type: 'crushed', p, x: k.x });
      g.mode.onCrushed?.(g, p, events);
      done = true;
      break;
    }
    if (!done) {
      for (const pl of g.level.platforms) {
        if (k.x < pl.x || k.x > pl.x + pl.w) continue;
        if (prevY + k.r <= pl.y + 1 && k.y + k.r >= pl.y) {
          events.push({ type: 'rockland', x: k.x, y: pl.y });
          for (const p of g.players) {
            if (!isActive(p) || !p.grounded || p.platform !== pl) continue;
            const dx = centerX(p) - k.x;
            if (Math.abs(dx) > 110) continue;
            p.vx = Math.sign(dx || 1) * 420;
            p.vy = -380;
            p.grounded = false;
            p.platform = null;
          }
          done = true;
          break;
        }
      }
    }
    if (!done && k.y > WORLD.waterY) {
      events.push({ type: 'rocksplash', x: k.x });
      done = true;
    }
    if (done) ms.rocks.splice(i, 1);
  }
}

/* ---------- Kuşatma: kapıyı koru ---------- */

function spawnMinion(g, opts = {}) {
  const lv = g.level;
  const left = g.rand() < 0.5;
  const x = left ? lv.moatL + 50 + g.rand() * 160 : lv.moatR - 50 - g.rand() * 160;
  return g.addPlayer({
    kind: opts.kind || 'minion',
    control: 'cpu',
    team: 'B',
    color: opts.color || pick(g, ENEMY_COLORS),
    hat: opts.hat || 'migfer',
    stache: opts.stache || 'ince',
    diff: opts.diff || g.cfg.enemyDiff || 'kolay',
    name: opts.name || 'Akıncı',
    tag: opts.tag || '',
    lives: opts.lives || 1,
    scale: opts.scale || 0.9,
    spd: opts.spd || 0.78,
    mass: opts.mass || 0.9,
    x,
    y: -70,
    invuln: 1,
  });
}

const kusatma = {
  id: 'kusatma',
  name: 'Kuşatma',
  desc: 'Akıncılar kapıya saldırıyor! Onları ez, hendeğe at, kapıyı koru.',
  team: true,
  init(g) {
    const cx = (g.level.moatL + g.level.moatR) / 2;
    const hp = g.cfg.gateHp ?? 100;
    g.ms.gate = { x: cx - 50, w: 100, y: g.level.floorY - 118, h: 118, hp, max: hp };
    g.ms.wave = 0;
    g.ms.waves = g.cfg.waves ?? 5;
    g.ms.toSpawn = 0;
    g.ms.spawnT = 0;
    g.ms.waveT = 1.5;
    g.ms.hitT = 0;
    g.ms.killed = 0;
  },
  update(g, dt, events) {
    const ms = g.ms;
    if (ms.toSpawn > 0) {
      ms.spawnT -= dt;
      if (ms.spawnT <= 0) {
        ms.toSpawn -= 1;
        ms.spawnT = Math.max(0.45, 1.1 - ms.wave * 0.06);
        const chief = ms.toSpawn === 0 && ms.wave % 3 === 0;
        const p = chief
          ? spawnMinion(g, { kind: 'minion', name: 'Bölükbaşı', tag: 'BAŞ', lives: 2, scale: 1.2, spd: 0.75, mass: 1.6, hat: 'bork', stache: 'gur' })
          : spawnMinion(g);
        events.push({ type: 'spawn', p });
      }
    } else if (!enemies(g).length && ms.wave < ms.waves) {
      ms.waveT -= dt;
      if (ms.waveT <= 0) {
        ms.wave += 1;
        ms.toSpawn = Math.min(14, 2 + ms.wave + Math.floor(heroes(g).length / 2));
        ms.spawnT = 0.3;
        ms.waveT = 2.5;
        events.push({ type: 'wave', n: ms.wave });
      }
    }
    const gate = ms.gate;
    let hitting = 0;
    for (const p of enemies(g)) {
      if (!isActive(p) || !p.grounded || p.platform?.kind !== 'floor') continue;
      if (centerX(p) > gate.x - 10 && centerX(p) < gate.x + gate.w + 10) hitting++;
    }
    if (hitting) {
      gate.hp = Math.max(0, gate.hp - hitting * (g.cfg.gateDps ?? 3.2) * dt);
      ms.hitT -= dt;
      if (ms.hitT <= 0) {
        ms.hitT = 0.45;
        events.push({ type: 'gatehit', x: gate.x + gate.w / 2, y: gate.y + 40 });
      }
    }
  },
  aiGoal(g, p, brain) {
    if (p.team !== 'B') {
      const gx = g.ms.gate.x + g.ms.gate.w / 2;
      const foe = enemies(g).sort((a, b) => Math.abs(centerX(a) - gx) - Math.abs(centerX(b) - gx))[0];
      return foe ? { targetId: foe.id } : { x: gx, y: g.level.floorY };
    }
    const near = aliveHeroes(g).find((h) => Math.abs(centerX(h) - centerX(p)) < 150 && Math.abs(h.y - p.y) < 90 && isActive(h));
    if (near && brain.rand() < 0.55) return { targetId: near.id };
    const gate = g.ms.gate;
    return { x: gate.x + gate.w / 2 + (p.id % 3 - 1) * 26, y: g.level.floorY, stay: true };
  },
  check(g) {
    return teamCheck(g, () => {
      const ms = g.ms;
      if (ms.gate.hp <= 0) return { team: 'B', reason: 'Kapı yıkıldı!' };
      if (ms.wave >= ms.waves && ms.toSpawn === 0 && !enemies(g).length) return { team: 'A', reason: 'Kale kurtuldu!' };
      return null;
    });
  },
};

/* ---------- Kaleye saldırı: Kara Paşa ---------- */

const saldiri = {
  id: 'saldiri',
  name: 'Kaleye Saldırı',
  desc: 'Kara Paşa tahtında. Muhafızlarını geç, Paşayı ez!',
  team: true,
  init(g) {
    const throne = g.level.platforms.find((pl) => pl.kind === 'throne') || g.level.platforms[0];
    g.ms.boss = g.addPlayer({
      kind: 'boss',
      control: 'cpu',
      team: 'B',
      color: BOSS_COLOR,
      hat: 'sarik',
      stache: 'pala',
      diff: g.cfg.bossDiff || 'orta',
      name: 'Kara Paşa',
      tag: 'PAŞA',
      lives: g.cfg.bossLives ?? 4,
      scale: 1.45,
      spd: 0.7,
      mass: 2.4,
      x: throne.x + throne.w / 2,
      y: throne.y,
    }).id;
    g.ms.guardT = 3;
  },
  update(g, dt, events) {
    g.ms.guardT -= dt;
    const guards = enemies(g).filter((p) => p.info.kind === 'minion').length;
    if (g.ms.guardT <= 0) {
      g.ms.guardT = g.cfg.guardEvery ?? 6;
      if (guards < (g.cfg.maxGuards ?? 2)) events.push({ type: 'spawn', p: spawnMinion(g, { name: 'Muhafız', diff: g.cfg.enemyDiff || 'orta', spd: 0.85 }) });
    }
  },
  aiGoal(g, p) {
    if (p.info.kind !== 'boss') return null;
    const throne = g.level.platforms.find((pl) => pl.kind === 'throne');
    const near = aliveHeroes(g).find((h) => Math.abs(centerX(h) - centerX(p)) < 260 && Math.abs(h.y - p.y) < 160);
    if (near || !throne) return null;
    return { x: throne.x + throne.w / 2, y: throne.y };
  },
  check(g) {
    return teamCheck(g, () => {
      const boss = g.players.find((p) => p.id === g.ms.boss);
      if (!boss || boss.state === 'out') return { team: 'A', reason: 'Kara Paşa yenildi!' };
      return null;
    });
  },
};

/* ---------- Taç kapışı ---------- */

const tac = {
  id: 'tac',
  name: 'Taç Kapışı',
  desc: 'Tacı kap ve tut! Tacı taşıyanı ezen tacı alır.',
  noLives: true,
  init(g) {
    g.ms.crown = { x: 640, y: 120, vy: 0, holder: null, cd: 0 };
    g.ms.score = {};
    g.ms.target = g.cfg.crownTime ?? 25;
  },
  update(g, dt, events) {
    const c = g.ms.crown;
    c.cd = Math.max(0, c.cd - dt);
    const holder = g.players.find((p) => p.id === c.holder);
    if (holder && holder.state === 'normal') {
      g.ms.score[holder.id] = (g.ms.score[holder.id] || 0) + dt;
      c.x = centerX(holder);
      c.y = holder.y - 6;
      return;
    }
    if (holder) dropCrown(g, holder, events);
    const prevY = c.y;
    c.vy = Math.min(c.vy + 1500 * dt, 900);
    c.y += c.vy * dt;
    for (const pl of g.level.platforms) {
      if (c.x > pl.x && c.x < pl.x + pl.w && prevY <= pl.y + 1 && c.y >= pl.y) {
        c.y = pl.y;
        c.vy = 0;
        c.x += pl.dx || 0;
      }
    }
    if (c.y > WORLD.waterY) Object.assign(c, { x: 640, y: -40, vy: 0 });
    if (c.cd > 0) return;
    const box = { x: c.x - 18, y: c.y - 30, w: 36, h: 30 };
    for (const p of g.players) {
      if (p.state !== 'normal' || overlapX(p, box) <= 0 || overlapY(p, box) <= 0) continue;
      c.holder = p.id;
      events.push({ type: 'crown', p });
      break;
    }
  },
  onStomp(g, e, events) {
    const c = g.ms.crown;
    if (c.holder === e.victim.id && e.victim.invuln <= 0) {
      c.holder = e.p.id;
      events.push({ type: 'crownsteal', p: e.p, victim: e.victim });
    }
  },
  onFall(g, p, events) {
    if (g.ms.crown.holder === p.id) {
      Object.assign(g.ms.crown, { holder: null, x: 640, y: -40, vy: 0, cd: 0.5 });
      events.push({ type: 'crowndrop', p });
    }
  },
  aiGoal(g, p) {
    const c = g.ms.crown;
    if (c.holder === p.id) return { flee: true };
    if (c.holder !== null) return { targetId: c.holder };
    return { x: c.x, y: c.y };
  },
  check(g) {
    for (const p of g.players) if ((g.ms.score[p.id] || 0) >= g.ms.target) return { winnerId: p.id };
    return null;
  },
};

function dropCrown(g, p, events) {
  const c = g.ms.crown;
  c.holder = null;
  c.vy = -500;
  c.cd = 0.6;
  c.x = Math.max(g.level.moatL + 30, Math.min(g.level.moatR - 30, centerX(p)));
  events.push({ type: 'crowndrop', p });
}

export const MODES = {
  kapisma: { id: 'kapisma', name: 'Kapışma', desc: 'Ez, it, hendeğe at. Son ayakta kalan kazanır.', check: ffaCheck },
  mancinik: {
    id: 'mancinik',
    name: 'Mancınık Yağmuru',
    desc: 'Gökten taş yağıyor! Gölgeye dikkat et, rakiplerini ez.',
    rocks: true,
    check: ffaCheck,
  },
  tac,
  kusatma,
  saldiri,
};

export const MODE_IDS = Object.keys(MODES);

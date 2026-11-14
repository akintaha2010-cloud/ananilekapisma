const W = 1280;
const FLOOR_Y = 640;

const floor = (x, w, id = 'floor') => ({ id, kind: 'floor', x, y: FLOOR_Y, w, h: 80, solid: true });
const tower = (id, x, w, y) => ({ id, kind: 'tower', x, y, w, h: FLOOR_Y - y, solid: true });
const plank = (id, kind, x, y, w, move) => ({ id, kind, x, y, w, solid: false, ...(move ? { move, dx: 0, dy: 0 } : {}) });

export const THEMES = {
  gece: { name: 'Gece', sky: ['#141a3d', '#4b2f6b', '#c0577a', '#f0a25e'], stars: 90, moon: true, far: '#3b2c55', far2: '#2c2142', wall: '#55496b', floor: '#7c6f86', floorTop: '#a99cb3', tower: '#8d8199', towerTop: '#b6aac0', shade: 0.35, window: ['#ffcf7a', '#d9762e'] },
  gunduz: { name: 'Gündüz', sky: ['#3d8be0', '#73b7f0', '#bfe4ff', '#fff1c9'], stars: 0, sun: true, far: '#7d9cc4', far2: '#6584ad', wall: '#a8916f', floor: '#9b8a74', floorTop: '#cdbb9f', tower: '#b3a083', towerTop: '#dccaa9', shade: 0.12, window: ['#3a2a20', '#1c140f'] },
  safak: { name: 'Şafak', sky: ['#2a2457', '#7d4b8c', '#f08a7a', '#ffd59a'], stars: 30, sun: true, far: '#6b4b7d', far2: '#563a68', wall: '#8a6b78', floor: '#8f7880', floorTop: '#c4a9ad', tower: '#a08890', towerTop: '#d1b8bb', shade: 0.2, window: ['#ffd9a0', '#d98a4e'] },
  kis: { name: 'Kış', sky: ['#1e2b52', '#4c6595', '#9fb6dc', '#e6eef8'], stars: 40, moon: true, snow: true, far: '#6f86b0', far2: '#5a7099', wall: '#7f8aa3', floor: '#8e98ad', floorTop: '#f4f8ff', tower: '#9ea8bd', towerTop: '#ffffff', shade: 0.22, window: ['#ffe9b0', '#e0a050'] },
  zindan: { name: 'Zindan', sky: ['#0b0912', '#16111f', '#211a2c', '#2b2236'], stars: 0, far: '#1a1424', far2: '#140f1c', wall: '#3a3346', floor: '#5a5266', floorTop: '#7d7489', tower: '#6a6276', towerTop: '#8c839a', shade: 0.45, window: ['#ff9a40', '#a8401a'], dungeon: true },
  ates: { name: 'Kuşatma Ateşi', sky: ['#1a0606', '#561010', '#b8361a', '#ff9a3c'], stars: 0, embers: true, far: '#3e1414', far2: '#2c0e0e', wall: '#5e4040', floor: '#7a5e5a', floorTop: '#a88a80', tower: '#8a6c66', towerTop: '#b8988c', shade: 0.35, window: ['#ffb060', '#ff5a1a'] },
};

const DEFS = {
  avlu: {
    name: 'Kale Avlusu',
    theme: 'gece',
    moat: [140, 1140],
    platforms: () => [
      floor(140, 1000),
      tower('towerL', 140, 160, 490),
      tower('towerR', 980, 160, 490),
      plank('bridge', 'bridge', 470, 455, 340),
      plank('balconyL', 'ledge', 240, 335, 170),
      plank('balconyR', 'ledge', 870, 335, 170),
      plank('lift', 'lift', 580, 220, 120, { x0: 380, x1: 780, speed: 0.55 }),
    ],
    spawns: [220, 1060, 560, 720],
  },
  surlar: {
    name: 'Surlar',
    theme: 'gunduz',
    moat: [120, 1160],
    platforms: () => [
      floor(120, 1040),
      tower('towerL', 120, 130, 470),
      tower('towerR', 1030, 130, 470),
      plank('bridge', 'bridge', 520, 470, 240),
      plank('ledgeL', 'ledge', 290, 370, 170),
      plank('ledgeR', 'ledge', 820, 370, 170),
      plank('top', 'ledge', 560, 250, 160),
    ],
    spawns: [185, 1095, 420, 860],
  },
  kopru: {
    name: 'Asma Köprü',
    theme: 'safak',
    moat: [140, 1140],
    platforms: () => [
      floor(140, 380, 'floorL'),
      floor(760, 380, 'floorR'),
      tower('towerL', 140, 120, 500),
      tower('towerR', 1020, 120, 500),
      plank('bridge', 'bridge', 530, 480, 220),
      plank('ledgeL', 'ledge', 270, 360, 160),
      plank('ledgeR', 'ledge', 850, 360, 160),
      plank('lift', 'lift', 580, 230, 120, { x0: 380, x1: 780, speed: 0.5 }),
    ],
    spawns: [200, 1080, 400, 880],
  },
  zindan: {
    name: 'Zindan',
    theme: 'zindan',
    moat: [200, 1080],
    platforms: () => [
      floor(200, 880),
      plank('liftL', 'lift', 270, 520, 130, { y0: 520, y1: 290, speed: 0.45 }),
      plank('liftR', 'lift', 880, 290, 130, { y0: 290, y1: 520, speed: 0.45 }),
      plank('mid', 'ledge', 540, 430, 200),
      plank('top', 'ledge', 560, 230, 160),
    ],
    spawns: [300, 980, 520, 760],
  },
  taht: {
    name: 'Taht Salonu',
    theme: 'ates',
    moat: [100, 1180],
    platforms: () => [
      floor(100, 1080),
      tower('towerL', 100, 130, 500),
      tower('towerR', 1050, 130, 500),
      plank('stepL', 'ledge', 270, 470, 170),
      plank('stepR', 'ledge', 840, 470, 170),
      plank('throne', 'throne', 520, 320, 240),
      plank('liftL', 'lift', 250, 300, 110, { y0: 300, y1: 400, speed: 0.4 }),
      plank('liftR', 'lift', 920, 400, 110, { y0: 400, y1: 300, speed: 0.4 }),
    ],
    spawns: [165, 1115, 420, 860],
  },
};

export const MAP_IDS = Object.keys(DEFS);
export const MAPS = Object.fromEntries(MAP_IDS.map((id) => [id, { id, name: DEFS[id].name, theme: DEFS[id].theme }]));

export function createLevel(id = 'avlu', themeId) {
  const def = DEFS[id] || DEFS.avlu;
  const [moatL, moatR] = def.moat;
  const platforms = def.platforms();
  for (const pl of platforms) {
    if (!pl.move) continue;
    placeMover(pl, 0);
    pl.dx = pl.dy = 0;
  }
  const floors = platforms.filter((pl) => pl.kind === 'floor').sort((a, b) => a.x - b.x);
  const water = [];
  let x = 0;
  for (const f of floors) {
    if (f.x > x) water.push([x, f.x]);
    x = f.x + f.w;
  }
  if (x < W) water.push([x, W]);
  const span = moatR - moatL;
  const spawnY = (sx) => {
    let y = FLOOR_Y;
    for (const pl of platforms) if (pl.solid && sx > pl.x && sx < pl.x + pl.w) y = Math.min(y, pl.y);
    return y;
  };
  return {
    id: DEFS[id] ? id : 'avlu',
    name: def.name,
    theme: THEMES[themeId] ? themeId : def.theme,
    moatL,
    moatR,
    floorY: FLOOR_Y,
    platforms,
    floors,
    water,
    spawns: def.spawns.map((sx) => ({ x: sx, y: spawnY(sx) })),
    respawnXs: [0.16, 0.33, 0.5, 0.67, 0.84].map((k) => moatL + span * k).filter((rx) => floorUnder({ floors }, rx)),
    windows: [0.22, 0.5, 0.78].map((k) => moatL + span * k),
    banners: [0.11, 0.36, 0.64, 0.89].map((k) => moatL + span * k),
    torches: [
      [moatL + span * 0.36, 540],
      [moatL + span * 0.64, 540],
      [moatL + 80, 420],
      [moatR - 80, 420],
    ],
    time: 0,
  };
}

function placeMover(pl, time) {
  const m = pl.move;
  const k = 0.5 - 0.5 * Math.cos(time * m.speed * Math.PI);
  const nx = m.x0 !== undefined ? m.x0 + (m.x1 - m.x0) * k : pl.x;
  const ny = m.y0 !== undefined ? m.y0 + (m.y1 - m.y0) * k : pl.y;
  pl.dx = nx - pl.x;
  pl.dy = ny - pl.y;
  pl.x = nx;
  pl.y = ny;
}

export function updateLevel(level, dt) {
  level.time += dt;
  for (const pl of level.platforms) if (pl.move) placeMover(pl, level.time);
}

export function floorUnder(level, x) {
  return level.floors.find((f) => x >= f.x && x <= f.x + f.w) || null;
}

/** Distance from x to the nearest water edge and which way the water is (-1 left, 1 right). */
export function waterInfo(level, x) {
  const f = floorUnder(level, x);
  if (f) {
    const l = x - f.x;
    const r = f.x + f.w - x;
    return l < r ? { over: false, dist: l, side: -1 } : { over: false, dist: r, side: 1 };
  }
  let best = { over: true, dist: Infinity, side: 1 };
  for (const g of level.floors) {
    const d = x < g.x ? g.x - x : x - (g.x + g.w);
    if (d < best.dist) best = { over: true, dist: d, side: x < g.x ? 1 : -1 };
  }
  return best;
}

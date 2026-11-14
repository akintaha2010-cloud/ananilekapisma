export const MOAT_LEFT = 140;
export const MOAT_RIGHT = 1140;

export function createLevel() {
  const platforms = [
    { id: 'floor', kind: 'floor', x: MOAT_LEFT, y: 640, w: MOAT_RIGHT - MOAT_LEFT, h: 80, solid: true },
    { id: 'towerL', kind: 'tower', x: MOAT_LEFT, y: 490, w: 160, h: 150, solid: true },
    { id: 'towerR', kind: 'tower', x: MOAT_RIGHT - 160, y: 490, w: 160, h: 150, solid: true },
    { id: 'bridge', kind: 'bridge', x: 470, y: 455, w: 340, solid: false },
    { id: 'balconyL', kind: 'ledge', x: 240, y: 335, w: 170, solid: false },
    { id: 'balconyR', kind: 'ledge', x: 870, y: 335, w: 170, solid: false },
    {
      id: 'lift',
      kind: 'lift',
      x: 580,
      y: 220,
      w: 120,
      solid: false,
      move: { x0: 380, x1: 780, speed: 0.55 },
      dx: 0,
    },
  ];
  const spawns = [
    { x: 220, y: 490 },
    { x: 1060, y: 490 },
    { x: 560, y: 640 },
    { x: 720, y: 640 },
  ];
  return { platforms, spawns, time: 0 };
}

export function updateLevel(level, dt) {
  level.time += dt;
  for (const pl of level.platforms) {
    if (!pl.move) continue;
    const { x0, x1, speed } = pl.move;
    const nx = x0 + (x1 - x0) * (0.5 - 0.5 * Math.cos(level.time * speed * Math.PI * 0.5 * 2));
    pl.dx = nx - pl.x;
    pl.x = nx;
  }
}

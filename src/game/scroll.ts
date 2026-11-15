import { ARENA_WIDTH } from './constants';
import { CharacterEntity, PlatformDef, PlatformState, ScrollTheme, SimulationState } from './types';

export const SCROLL_GROUND_Y = 560;
const ZONE = ARENA_WIDTH;
const TRAVEL = 1150;

export interface ScrollLevel {
  width: number;
  platforms: PlatformDef[];
  triggers: number[];
}

function travelSection(id: string, x0: number, variant: number): PlatformDef[] {
  const G = SCROLL_GROUND_Y;
  const ground = (k: string, a: number, b: number): PlatformDef => ({ id: `${id}_${k}`, x: a, y: G, w: b - a, h: 160, type: 'stone' });
  switch (variant % 3) {
    case 0:
      return [
        ground('g1', x0, x0 + 360),
        { id: `${id}_step`, x: x0 + 480, y: G - 70, w: 300, h: 230, type: 'stone' },
        ground('g2', x0 + 900, x0 + TRAVEL),
        { id: `${id}_plank`, x: x0 + 250, y: G - 130, w: 180, h: 20, type: 'wood', oneWay: true },
        { id: `${id}_plank2`, x: x0 + 820, y: G - 160, w: 160, h: 20, type: 'wood', oneWay: true },
      ];
    case 1:
      return [
        ground('g1', x0, x0 + TRAVEL),
        { id: `${id}_b1`, x: x0 + 260, y: G - 60, w: 160, h: 60, type: 'stone' },
        { id: `${id}_b2`, x: x0 + 540, y: G - 120, w: 160, h: 120, type: 'stone' },
        { id: `${id}_p1`, x: x0 + 780, y: G - 200, w: 190, h: 20, type: 'wood', oneWay: true },
      ];
    default:
      return [
        ground('g1', x0, x0 + 330),
        { id: `${id}_bridge`, x: x0 + 455, y: G - 30, w: 150, h: 22, type: 'wood', oneWay: true },
        { id: `${id}_lift`, x: x0 + 690, y: G - 60, w: 130, h: 22, type: 'moving', oneWay: true, moveAxis: 'y', moveRange: 60, moveSpeed: 1.4 },
        ground('g2', x0 + 940, x0 + TRAVEL),
      ];
  }
}

export function buildScrollLevel(waveCount: number, seed: number): ScrollLevel {
  const G = SCROLL_GROUND_Y;
  const platforms: PlatformDef[] = [{ id: 'start', x: 0, y: G, w: ZONE, h: 160, type: 'stone' }];
  const triggers: number[] = [];
  let x = ZONE;
  for (let i = 0; i < waveCount; i++) {
    platforms.push(...travelSection(`t${i}`, x, seed + i));
    x += TRAVEL;
    platforms.push(
      { id: `z${i}`, x, y: G, w: ZONE, h: 160, type: 'stone' },
      { id: `z${i}_l`, x: x + 220, y: G - 150, w: 220, h: 22, type: 'wood', oneWay: true },
      { id: `z${i}_r`, x: x + ZONE - 440, y: G - 150, w: 220, h: 22, type: 'wood', oneWay: true },
      { id: `z${i}_top`, x: x + ZONE / 2 - 130, y: G - 290, w: 260, h: 22, type: 'tower', oneWay: true }
    );
    triggers.push(x + ZONE * 0.4);
    x += ZONE;
  }
  return { width: x, platforms, triggers };
}

export function toPlatformState(def: PlatformDef): PlatformState {
  return { ...def, baseX: def.x, baseY: def.y, vx: 0, vy: 0, crumbleState: 'solid', crumbleTimer: 0 };
}

export function applyScrollLevel(sim: SimulationState, level: ScrollLevel, theme: ScrollTheme) {
  sim.platforms = level.platforms.map(toPlatformState);
  sim.worldWidth = level.width;
  sim.scrollX = 0;
  sim.scrollLock = null;
  sim.scrollTheme = theme;
  if (sim.adventure) sim.adventure.triggers = level.triggers;
  sim.players.forEach((p, i) => {
    p.x = 160 + i * 70;
    p.y = SCROLL_GROUND_Y - p.h - 40;
    p.facing = 1;
  });
}

export function isScrolling(sim: SimulationState): boolean {
  return sim.worldWidth > ARENA_WIDTH;
}

export function scrollLeader(sim: SimulationState): number | null {
  const team = sim.players.filter((p) => p.team === 'A' && p.alive && !p.eliminated);
  const humans = team.filter((p) => !p.isBot);
  const pool = humans.length > 0 ? humans : team;
  if (pool.length === 0) return null;
  return Math.max(...pool.map((p) => p.x + p.w / 2));
}

export function scrollSpawn(sim: SimulationState, char: CharacterEntity): { x: number; y: number } {
  const want = sim.scrollX + 200 + (char.slotIndex % 4) * 60;
  let best: PlatformState | null = null;
  let bestD = Infinity;
  for (const p of sim.platforms) {
    if (p.crumbleState === 'fallen' || p.x + p.w < sim.scrollX + 40 || p.x > sim.scrollX + ARENA_WIDTH - 40) continue;
    const cx = Math.max(p.x + 20, Math.min(p.x + p.w - 20, want));
    const d = Math.abs(cx - want) + (p.oneWay ? 200 : 0);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  if (!best) return { x: want, y: 40 };
  const x = Math.max(best.x + 10, Math.min(best.x + best.w - 10 - char.w, want));
  return { x, y: best.y - char.h - 30 };
}

export function updateScroll(sim: SimulationState, dt: number) {
  const maxScroll = sim.worldWidth - ARENA_WIDTH;
  const lead = scrollLeader(sim);
  let target = sim.scrollX;
  if (sim.scrollLock !== null) target = sim.scrollLock;
  else if (lead !== null) target = Math.max(sim.scrollX, lead - ARENA_WIDTH * 0.4);
  target = Math.max(0, Math.min(maxScroll, target));
  sim.scrollX += (target - sim.scrollX) * Math.min(1, dt * 5);
  if (Math.abs(target - sim.scrollX) < 0.5) sim.scrollX = target;
  const minX = sim.scrollX + 4;
  const maxX = sim.scrollX + ARENA_WIDTH - 4;
  for (const p of sim.players) {
    if (!p.alive || p.eliminated) continue;
    if (p.x < minX) {
      p.x = minX;
      if (p.vx < 0) p.vx = 0;
    } else if (p.x + p.w > maxX) {
      p.x = maxX - p.w;
      if (p.vx > 0) p.vx = 0;
    }
  }
}

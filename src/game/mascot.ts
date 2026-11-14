// Shared pixel geometry for the original fesli kirpi maskot: spiky mane + round ears behind the body.
export interface PixelRect {
  x: number;
  y: number;
  s: number;
}

function buildQuills(): PixelRect[] {
  const rects: PixelRect[] = [];
  const cx = 0;
  const cy = -14;
  for (let deg = -205; deg <= 25; deg += 23) {
    const a = (deg * Math.PI) / 180;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    for (const [r, s] of [
      [10, 5],
      [13, 4],
      [15.5, 3],
      [17.5, 2],
    ] as const) {
      rects.push({ x: Math.round(cx + dx * r - s / 2), y: Math.round(cy + dy * r * 1.05 - s / 2), s });
    }
  }
  return rects;
}

export const MASCOT_QUILLS: PixelRect[] = buildQuills();

export const MASCOT_EARS: PixelRect[] = [
  { x: -10, y: -27, s: 5 },
  { x: 5, y: -27, s: 5 },
];

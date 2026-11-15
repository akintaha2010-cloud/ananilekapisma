import { ScrollTheme } from './types';

const TILE_W = 960;
const H = 360;
const GROUND = 280;

const F: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', Y: '101101010010010', Z: '111001010100111',
  V: '101101101101010', W: '101101111111101', F: '111100110100100', J: '001001001101010', X: '101101010101101',
  '0': '111101101101111', '4': '101101111001001', ' ': '000000000000000', '!': '010010010000010',
};

function sign(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string) {
  const w = text.length * 4 + 3;
  ctx.fillStyle = '#111018';
  ctx.fillRect(x - 1, y - 1, w + 2, 9);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, 7);
  ctx.fillStyle = fg;
  for (let i = 0; i < text.length; i++) {
    const g = F[text[i]];
    if (!g) continue;
    for (let p = 0; p < 15; p++) if (g[p] === '1') ctx.fillRect(x + 2 + i * 4 + (p % 3), y + 1 + Math.floor(p / 3), 1, 1);
  }
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Palette {
  sky: [string, string];
  far: string;
  farWin: string;
  mid: string;
  midDark: string;
  accent: string;
}

const PALETTES: Record<ScrollTheme, Palette> = {
  cankaya: { sky: ['#60A5FA', '#E0F2FE'], far: '#94A3B8', farWin: '#E2E8F0', mid: '#D6C7A8', midDark: '#8B7355', accent: '#EC3750' },
  kizilay: { sky: ['#EA580C', '#FDE68A'], far: '#7C2D12', farWin: '#FDBA74', mid: '#B45309', midDark: '#5B2A0A', accent: '#DC2626' },
  tunali: { sky: ['#7C3AED', '#FBCFE8'], far: '#5B21B6', farWin: '#F0ABFC', mid: '#9D7A5B', midDark: '#4A3424', accent: '#F59E0B' },
  frost: { sky: ['#94A3B8', '#F1F5F9'], far: '#64748B', farWin: '#E2E8F0', mid: '#CBD5E1', midDark: '#475569', accent: '#2563EB' },
  glitch: { sky: ['#0B1026', '#4C1D95'], far: '#1E1B4B', farWin: '#22D3EE', mid: '#312E81', midDark: '#1E1B4B', accent: '#22D3EE' },
  tower: { sky: ['#020617', '#312E81'], far: '#1E293B', farWin: '#FDE047', mid: '#334155', midDark: '#0F172A', accent: '#A3E635' },
};

function buildFar(theme: ScrollTheme): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE_W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const P = PALETTES[theme];
  const r = rng(theme.length * 97 + 11);
  for (let x = 0; x < TILE_W; ) {
    const w = 24 + Math.floor(r() * 40);
    const h = 40 + Math.floor(r() * 90);
    ctx.fillStyle = P.far;
    ctx.fillRect(x, GROUND - 40 - h, w, h + 40);
    ctx.fillStyle = P.farWin;
    for (let wy = GROUND - 34 - h; wy < GROUND - 44; wy += 8)
      for (let wx = x + 3; wx < x + w - 4; wx += 6) if (r() > 0.45) ctx.fillRect(wx, wy, 2, 3);
    x += w + Math.floor(r() * 8);
  }
  const lm = (cx: number) => {
    ctx.fillStyle = P.far;
    if (theme === 'glitch' || theme === 'tower') {
      ctx.fillRect(cx - 90, GROUND - 150, 180, 110);
      for (let i = -90; i < 90; i += 16) ctx.fillRect(cx + i, GROUND - 160, 9, 12);
      ctx.fillRect(cx - 20, GROUND - 230, 40, 90);
      for (let i = -20; i < 20; i += 10) ctx.fillRect(cx + i, GROUND - 240, 6, 10);
      ctx.fillStyle = P.farWin;
      ctx.fillRect(cx - 4, GROUND - 210, 8, 12);
    } else if (theme === 'frost') {
      ctx.fillRect(cx - 110, GROUND - 92, 220, 52);
      ctx.fillRect(cx - 118, GROUND - 100, 236, 8);
      ctx.fillStyle = P.farWin;
      for (let i = -104; i < 104; i += 12) ctx.fillRect(cx + i, GROUND - 90, 4, 48);
    } else {
      ctx.fillRect(cx - 3, GROUND - 210, 6, 170);
      ctx.fillRect(cx - 14, GROUND - 236, 28, 26);
      ctx.fillRect(cx - 10, GROUND - 240, 20, 4);
      ctx.fillRect(cx - 1, GROUND - 256, 2, 16);
      ctx.fillStyle = P.farWin;
      ctx.fillRect(cx - 10, GROUND - 226, 20, 2);
    }
  };
  lm(TILE_W * 0.62);
  return c;
}

function buildMid(theme: ScrollTheme): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE_W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const P = PALETTES[theme];
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  const shops: Record<ScrollTheme, string[]> = {
    cankaya: ['HAVEN', 'CAY OCAGI', 'SIMIT', 'HACK CLUB'],
    kizilay: ['KIZILAY', 'DONER', 'METRO', 'CAY OCAGI'],
    tunali: ['TUNALI HILMI', 'DONER', 'KUGULU PARK', 'SIMIT'],
    frost: ['EGO 404', 'CAY OCAGI', 'SIMIT', 'DONER'],
    glitch: ['ERROR 404', 'GLITCH', 'SHIP IT', 'BUG'],
    tower: ['BUG LORD', 'HAVEN', 'SHIP IT', 'HACK CLUB'],
  };
  const names = shops[theme];
  const r = rng(theme.length * 31 + 5);
  for (let i = 0; i < 4; i++) {
    const x = i * 240 + 10;
    const w = 150 + Math.floor(r() * 50);
    const h = 90 + Math.floor(r() * 50);
    R(x - 1, GROUND - h - 1, w + 2, h + 1, '#111018');
    R(x, GROUND - h, w, h, i % 2 ? P.mid : P.midDark);
    for (let wy = GROUND - h + 8; wy < GROUND - 50; wy += 16)
      for (let wx = x + 8; wx < x + w - 14; wx += 20) {
        R(wx, wy, 10, 9, '#111018');
        R(wx + 1, wy + 1, 8, 7, r() > 0.4 ? P.farWin : '#1F2937');
      }
    R(x + 8, GROUND - 34, w - 16, 34, '#111018');
    R(x + 9, GROUND - 33, w - 18, 33, '#1F2937');
    R(x + 12, GROUND - 30, w - 50, 22, '#FDE68A');
    R(x + w - 34, GROUND - 30, 18, 30, '#7C2D12');
    for (let a = 0; a < w - 12; a += 8) R(x + 6 + a, GROUND - 44, 8, 8, a % 16 ? '#F8FAFC' : P.accent);
    sign(ctx, names[i], x + 10, GROUND - 58, P.accent, '#FFFFFF');
  }
  // lamp posts, trees, cats, simit cart
  for (let i = 0; i < 4; i++) {
    const lx = i * 240 + 210;
    R(lx, GROUND - 60, 2, 60, '#111018');
    R(lx - 3, GROUND - 64, 8, 4, '#111018');
    R(lx - 2, GROUND - 63, 6, 2, '#FDE047');
  }
  if (theme === 'tunali' || theme === 'cankaya') {
    for (const tx of [120, 600]) {
      R(tx, GROUND - 30, 4, 30, '#5B3A1E');
      R(tx - 12, GROUND - 58, 28, 30, '#111018');
      R(tx - 11, GROUND - 57, 26, 28, '#16A34A');
      R(tx - 6, GROUND - 52, 8, 6, '#4ADE80');
    }
  }
  if (theme === 'frost') {
    R(380, GROUND - 40, 120, 38, '#111018');
    R(381, GROUND - 39, 118, 30, '#2563EB');
    for (let w = 386; w < 490; w += 16) R(w, GROUND - 35, 12, 10, '#BFDBFE');
    R(386, GROUND - 6, 14, 6, '#111018');
    R(474, GROUND - 6, 14, 6, '#111018');
    sign(ctx, 'EGO', 420, GROUND - 22, '#FDE047', '#111018');
  }
  // Ankara kedisi
  R(700, GROUND - 6, 8, 5, '#111018');
  R(701, GROUND - 5, 6, 3, '#F59E0B');
  R(706, GROUND - 9, 3, 4, '#111018');
  R(707, GROUND - 8, 1, 2, '#F59E0B');
  return c;
}

const cache = new Map<ScrollTheme, { far: HTMLCanvasElement; mid: HTMLCanvasElement }>();

export function drawAnkaraBackdrop(ctx: CanvasRenderingContext2D, theme: ScrollTheme, scrollPx: number, t: number, pw: number) {
  let layers = cache.get(theme);
  if (!layers) {
    layers = { far: buildFar(theme), mid: buildMid(theme) };
    cache.set(theme, layers);
  }
  const P = PALETTES[theme];
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, P.sky[0]);
  g.addColorStop(1, P.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, pw, H);
  const blit = (img: HTMLCanvasElement, f: number) => {
    const off = -Math.round(scrollPx * f) % TILE_W;
    for (let x = off; x < pw; x += TILE_W) ctx.drawImage(img, x, 0);
  };
  ctx.fillStyle = '#0B1220';
  ctx.fillRect(0, GROUND, pw, H - GROUND);
  blit(layers.far, 0.25);
  blit(layers.mid, 0.6);
  if (theme === 'frost') {
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 60; i++) {
      const x = (i * 97 + t * (14 + (i % 5) * 4) - scrollPx * 0.3) % pw;
      const y = (i * 53 + t * (24 + (i % 7) * 5)) % H;
      ctx.fillRect(x < 0 ? x + pw : x, y, 1, 1);
    }
  } else if (theme === 'glitch' || theme === 'tower') {
    const k = Math.floor(t * 6);
    if (k % 5 === 0) {
      ctx.fillStyle = theme === 'glitch' ? 'rgba(34,211,238,0.35)' : 'rgba(163,230,53,0.3)';
      ctx.fillRect(0, (k * 37) % GROUND, pw, 2 + (k % 3));
    }
  }
}

import { drawText, textWidth } from './font';
import { FOES, WEAPON_LABEL } from './engine';
import { GROUND, VIEW_H, VIEW_W } from './levels';
import { drawDevin, drawFigure, drawItemExport as drawFigureItem, LOOKS, Look } from './sprites';
import { Enemy, HavenState, HTheme, Projectile, Solid } from './types';

const TILE_W = 640;
const OUT = '#14101C';

interface Pal {
  sky: [string, string, string];
  far: string;
  farWin: string;
  mid: [string, string];
  accent: string;
  walk: string;
  walkD: string;
  earth: string;
  earthD: string;
  night: boolean;
}

const PAL: Record<HTheme, Pal> = {
  cankaya: { sky: ['#3B82F6', '#93C5FD', '#E0F2FE'], far: '#8FA3BF', farWin: '#DCE6F2', mid: ['#D6C7A8', '#A68A64'], accent: '#EC3750', walk: '#CBC3B4', walkD: '#9C9384', earth: '#5B4636', earthD: '#3E2F24', night: false },
  kizilay: { sky: ['#C2410C', '#F97316', '#FDE68A'], far: '#8A3A1A', farWin: '#FDBA74', mid: ['#C27C3E', '#7C4520'], accent: '#DC2626', walk: '#C9B79C', walkD: '#9A876C', earth: '#4A3426', earthD: '#30211A', night: false },
  tunali: { sky: ['#6D28D9', '#C084FC', '#FBCFE8'], far: '#5B3A8C', farWin: '#F5D0FE', mid: ['#B08968', '#7F5539'], accent: '#F59E0B', walk: '#BFB6A8', walkD: '#8E8577', earth: '#3F5F2E', earthD: '#2A3F1F', night: false },
  frost: { sky: ['#64748B', '#A5B4C8', '#E2E8F0'], far: '#5F6E84', farWin: '#E2E8F0', mid: ['#B8C4D4', '#6B7A90'], accent: '#2563EB', walk: '#F1F5F9', walkD: '#CBD5E1', earth: '#475569', earthD: '#334155', night: false },
  glitch: { sky: ['#05061A', '#1E1B4B', '#4C1D95'], far: '#1B1840', farWin: '#22D3EE', mid: ['#2E2A6B', '#1C1947'], accent: '#22D3EE', walk: '#6B6491', walkD: '#4A436E', earth: '#2A2550', earthD: '#1A1638', night: true },
  tower: { sky: ['#020617', '#111A3A', '#312E81'], far: '#18213A', farWin: '#FDE047', mid: ['#2F3B55', '#1B2438'], accent: '#A3E635', walk: '#5B6478', walkD: '#3C4458', earth: '#1F2638', earthD: '#121726', night: true },
};

const SIGNS: Record<HTheme, string[]> = {
  cankaya: ['HAVEN', 'CAY OCAGI', 'SIMIT', 'HACK CLUB', 'GENCLIK MERKEZI'],
  kizilay: ['KIZILAY', 'DONER', 'METRO', 'BUFE', 'KITAPCI'],
  tunali: ['TUNALI HILMI', 'DONER', 'KUGULU PARK', 'SIMIT', 'KAFE'],
  frost: ['EGO 404', 'CAY OCAGI', 'SIMIT', 'DONER', 'SALEP'],
  glitch: ['ERROR 404', 'GLITCH', 'SHIP IT', 'NULL', 'SEGFAULT'],
  tower: ['BUG LORD', 'HAVEN', 'SHIP IT', 'HACK CLUB', 'MERGE'],
};

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function mk(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function buildFar(theme: HTheme): HTMLCanvasElement {
  const c = mk(TILE_W, VIEW_H);
  const g = c.getContext('2d')!;
  const P = PAL[theme];
  const r = rng(theme.length * 131 + 7);
  const base = GROUND - 30;
  for (let x = 0; x < TILE_W; ) {
    const w = 20 + Math.floor(r() * 34);
    const h = 30 + Math.floor(r() * 80);
    g.fillStyle = P.far;
    g.fillRect(x, base - h, w, h + 40);
    g.fillStyle = P.farWin;
    for (let wy = base - h + 5; wy < base - 4; wy += 7) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() > 0.5) g.fillRect(wx, wy, 2, 3);
    x += w + Math.floor(r() * 6);
  }
  g.fillStyle = P.far;
  const cx = TILE_W * 0.6;
  if (theme === 'glitch' || theme === 'tower') {
    g.fillRect(cx - 80, base - 120, 160, 120);
    for (let i = -80; i < 80; i += 14) g.fillRect(cx + i, base - 128, 8, 10);
    g.fillRect(cx - 18, base - 190, 36, 80);
    for (let i = -18; i < 18; i += 9) g.fillRect(cx + i, base - 198, 5, 9);
    g.fillStyle = P.farWin;
    g.fillRect(cx - 3, base - 172, 6, 10);
    g.fillRect(cx - 50, base - 90, 5, 8);
    g.fillRect(cx + 45, base - 90, 5, 8);
  } else if (theme === 'frost') {
    g.fillRect(cx - 100, base - 70, 200, 70);
    g.fillRect(cx - 108, base - 78, 216, 8);
    g.fillRect(cx - 60, base - 86, 120, 8);
    g.fillStyle = P.farWin;
    for (let i = -94; i < 94; i += 11) g.fillRect(cx + i, base - 68, 4, 60);
  } else {
    g.fillRect(cx - 3, base - 170, 6, 170);
    g.fillRect(cx - 13, base - 194, 26, 24);
    g.fillRect(cx - 9, base - 198, 18, 4);
    g.fillRect(cx - 1, base - 214, 2, 16);
    g.fillStyle = P.farWin;
    g.fillRect(cx - 9, base - 184, 18, 2);
  }
  return c;
}

function sign(g: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string) {
  const w = textWidth(text) + 6;
  g.fillStyle = OUT;
  g.fillRect(x - 1, y - 1, w + 2, 9);
  g.fillStyle = bg;
  g.fillRect(x, y, w, 7);
  drawText(g, text, x + 3, y + 1, '#FFFFFF', 1, 'left', null);
}

function buildMid(theme: HTheme): HTMLCanvasElement {
  const c = mk(TILE_W, VIEW_H);
  const g = c.getContext('2d')!;
  const P = PAL[theme];
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const r = rng(theme.length * 37 + 3);
  const base = GROUND - 6;
  const names = SIGNS[theme];
  for (let i = 0; i < 4; i++) {
    const x = i * 160 + 6;
    const w = 112 + Math.floor(r() * 30);
    const h = 84 + Math.floor(r() * 50);
    R(x - 1, base - h - 1, w + 2, h + 1, OUT);
    R(x, base - h, w, h, P.mid[i % 2]);
    R(x, base - h, w, 3, '#00000033');
    for (let wy = base - h + 8; wy < base - 46; wy += 15)
      for (let wx = x + 7; wx < x + w - 12; wx += 17) {
        R(wx, wy, 10, 9, OUT);
        const lit = r() > 0.4;
        R(wx + 1, wy + 1, 8, 7, lit ? P.farWin : '#1F2937');
        if (lit) R(wx + 1, wy + 1, 3, 2, '#FFFFFF55');
      }
    R(x + 6, base - 32, w - 12, 32, OUT);
    R(x + 7, base - 31, w - 14, 31, '#1F2937');
    R(x + 10, base - 28, w - 42, 20, theme === 'glitch' || theme === 'tower' ? '#312E81' : '#FDE68A');
    R(x + w - 28, base - 28, 15, 28, '#7C2D12');
    R(x + w - 18, base - 15, 2, 2, '#FDE047');
    for (let a = 0; a < w - 10; a += 6) R(x + 5 + a, base - 40, 6, 7, (a / 6) % 2 ? '#F8FAFC' : P.accent);
    R(x + 5, base - 33, w - 10, 1, OUT);
    sign(g, names[i], x + 8, base - 54, P.accent);
    if (theme === 'cankaya' && i === 3) {
      R(x + 20, base - 70, 10, 8, '#EC3750');
      R(x + 36, base - 72, 8, 8, '#33D6A6');
      R(x + 50, base - 69, 9, 7, '#FFF');
    }
  }
  return c;
}

const layerCache = new Map<HTheme, { far: HTMLCanvasElement; mid: HTMLCanvasElement }>();

export class HavenRenderer {
  private buf = mk(VIEW_W, VIEW_H);
  private g = this.buf.getContext('2d')!;

  render(ctx: CanvasRenderingContext2D, cw: number, ch: number, s: HavenState) {
    const g = this.g;
    g.imageSmoothingEnabled = false;
    const theme = s.level.theme;
    const P = PAL[theme];
    let layers = layerCache.get(theme);
    if (!layers) {
      layers = { far: buildFar(theme), mid: buildMid(theme) };
      layerCache.set(theme, layers);
    }
    const grad = g.createLinearGradient(0, 0, 0, GROUND);
    grad.addColorStop(0, P.sky[0]);
    grad.addColorStop(0.55, P.sky[1]);
    grad.addColorStop(1, P.sky[2]);
    g.fillStyle = grad;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    this.sky(g, s, theme);
    const cam = Math.round(s.camX);
    const blit = (img: HTMLCanvasElement, f: number) => {
      const off = -Math.round(cam * f) % TILE_W;
      for (let x = off; x < VIEW_W; x += TILE_W) g.drawImage(img, x, 0);
    };
    g.fillStyle = P.earthD;
    g.fillRect(0, GROUND, VIEW_W, VIEW_H - GROUND);
    blit(layers.far, 0.2);
    blit(layers.mid, 0.55);
    const sh = s.shake > 0 ? Math.round((Math.sin(s.t * 70) * s.shake) * 6) : 0;
    const shy = s.shake > 0 ? Math.round((Math.cos(s.t * 53) * s.shake) * 4) : 0;
    g.save();
    g.translate(-cam + sh, shy);
    for (const d of s.level.decor) if (d.x > cam - 80 && d.x < cam + VIEW_W + 80) this.decor(g, d.kind, d.x, theme, s, d.text);
    for (const so of s.level.solids) if (so.x + so.w > cam - 4 && so.x < cam + VIEW_W + 4) this.solid(g, so, P, theme);
    for (const c of s.level.crates) if (!c.broken) this.crate(g, c.x + (c.shake > 0 ? Math.round(Math.sin(s.t * 80) * 1.5) : 0), c.y, c.w, c.h);
    for (const n of s.level.npcs) {
      if (n.x < cam - 40 || n.x > cam + VIEW_W + 40) continue;
      this.npc(g, n.look, n.x, s.t);
      if (Math.abs(s.player.x - n.x) < 70) this.bubble(g, n.text, n.x, GROUND - 46, '#FFFFFF');
    }
    for (const k of s.pickups) this.pickup(g, k.kind, k.x, k.y, k.t);
    if (s.bus) this.bus(g, s.bus.x, s.bus.dir, s.t);
    for (const q of s.projs) this.proj(g, q, s);
    for (const e of s.enemies) this.enemy(g, e, s);
    if (s.helper) {
      const h = s.helper;
      drawFigure(g, LOOKS.ozgur, { act: h.act, t: s.t, actT: h.actT, actDur: h.actDur, vx: h.vx, vy: h.vy, ground: h.ground, phase: 3 }, h.x, h.y, h.facing);
    }
    const p = s.player;
    if (!p.dead && !(p.invT > 0 && Math.floor(s.t * 20) % 2 === 0 && p.act !== 'special')) {
      if (p.act === 'special') this.glow(g, p.x, p.y - 16, 30 + Math.sin(s.t * 30) * 4, '#4ADE80');
      const item = p.weapon === 'skewer' ? 'skewer' : p.weapon === 'keyboard' ? 'keyboard' : p.act === 'throw' ? null : p.weapon;
      drawFigure(g, LOOKS.akin, { act: p.act, t: s.t, actT: p.actT, actDur: p.actDur, vx: p.vx, vy: p.vy, ground: p.ground, item: item ?? null }, p.x, p.y, p.facing, 1, p.flashT > 0);
      if (p.act === 'p1' || p.act === 'p2' || p.act === 'kick' || p.act === 'swing') this.whoosh(g, p.x, p.y, p.facing, p.actT / p.actDur, p.act === 'swing' ? 22 : 16);
    }
    drawDevin(g, s.devin.x, s.devin.y, s.t, s.player.facing, 0.62);
    this.fx(g, s);
    g.restore();
    if (P.night) this.lights(g, s, cam);
    if (theme === 'frost') this.snow(g, s.t, cam);
    if (theme === 'glitch' || theme === 'tower') this.glitch(g, s);
    this.vignette(g);
    if (s.devin.sayT > 0) this.bubble(g, s.devin.say, s.devin.x - cam, s.devin.y - 22, '#CCFBF1');
    this.hud(g, s);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = P.earthD;
    ctx.fillRect(0, 0, cw, ch);
    const sc = Math.min(cw / VIEW_W, ch / VIEW_H);
    const k = sc >= 1 ? Math.max(1, Math.floor(sc * 4) / 4) : sc;
    const dw = Math.round(VIEW_W * k);
    const dh = Math.round(VIEW_H * k);
    ctx.drawImage(this.buf, Math.round((cw - dw) / 2), Math.round((ch - dh) / 2), dw, dh);
  }

  private sky(g: CanvasRenderingContext2D, s: HavenState, theme: HTheme) {
    const R = (x: number, y: number, w: number, h: number, c: string) => {
      g.fillStyle = c;
      g.fillRect(x, y, w, h);
    };
    if (PAL[theme].night) {
      for (let i = 0; i < 40; i++) R((i * 73 - s.camX * 0.05) % VIEW_W < 0 ? ((i * 73 - s.camX * 0.05) % VIEW_W) + VIEW_W : (i * 73 - s.camX * 0.05) % VIEW_W, (i * 37) % 120, 1, 1, i % 5 === 0 ? '#FDE047' : '#E0E7FF');
      R(400, 30, 14, 14, '#F8FAFC');
      R(404, 30, 10, 10, PAL[theme].sky[0]);
    } else {
      const sunX = theme === 'kizilay' ? 380 : 70;
      R(sunX - 10, 26, 20, 20, theme === 'kizilay' ? '#FEF3C7' : '#FEF9C3');
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 170 + s.t * 6 - s.camX * 0.08) % (VIEW_W + 80)) - 40;
        const cy = 30 + (i % 2) * 22;
        R(cx, cy, 34, 7, '#FFFFFFCC');
        R(cx + 8, cy - 5, 18, 6, '#FFFFFFCC');
      }
    }
  }

  private solid(g: CanvasRenderingContext2D, so: Solid, P: Pal, theme: HTheme) {
    const R = (x: number, y: number, w: number, h: number, c: string) => {
      g.fillStyle = c;
      g.fillRect(x, y, w, h);
    };
    if (so.kind === 'awning') {
      R(so.x - 1, so.y - 1, so.w + 2, so.h + 4, OUT);
      for (let a = 0; a < so.w; a += 6) R(so.x + a, so.y, Math.min(6, so.w - a), so.h + 2, (a / 6) % 2 ? '#F8FAFC' : P.accent);
      R(so.x + 2, so.y + so.h + 3, 2, GROUND - so.y - so.h - 3, '#44403C');
      R(so.x + so.w - 4, so.y + so.h + 3, 2, GROUND - so.y - so.h - 3, '#44403C');
      return;
    }
    if (so.kind === 'scaffold') {
      R(so.x - 1, so.y - 1, so.w + 2, so.h + 2, OUT);
      R(so.x, so.y, so.w, so.h, '#9CA3AF');
      R(so.x, so.y, so.w, 2, '#E5E7EB');
      for (let a = 4; a < so.w; a += 10) R(so.x + a, so.y + so.h, 2, 8, '#6B7280');
      return;
    }
    if (so.kind === 'block') {
      R(so.x - 1, so.y - 1, so.w + 2, so.h + 1, OUT);
      R(so.x, so.y, so.w, so.h, P.walkD);
      for (let yy = 0; yy < so.h; yy += 6)
        for (let xx = (yy / 6) % 2 ? 0 : 6; xx < so.w; xx += 12) R(so.x + xx, so.y + yy, 1, 6, '#00000033');
      for (let yy = 6; yy < so.h; yy += 6) R(so.x, so.y + yy, so.w, 1, '#00000033');
      R(so.x, so.y, so.w, 3, theme === 'frost' ? '#FFFFFF' : P.walk);
      return;
    }
    R(so.x, so.y - 1, so.w, 1, OUT);
    R(so.x, so.y, so.w, 7, P.walk);
    for (let a = (Math.floor(so.x / 14) * 14 - so.x + 14) % 14; a < so.w; a += 14) R(so.x + a, so.y, 1, 7, P.walkD);
    R(so.x, so.y + 7, so.w, 3, P.walkD);
    R(so.x, so.y + 10, so.w, so.h, P.earth);
    for (let a = 0; a < so.w; a += 9) R(so.x + a, so.y + 14 + ((a * 7) % 11), 2, 2, P.earthD);
    if (theme === 'frost') {
      R(so.x, so.y - 3, so.w, 4, '#FFFFFF');
      for (let a = 0; a < so.w; a += 11) R(so.x + a, so.y - 4, 5, 1, '#FFFFFF');
    }
    if (theme === 'tunali') for (let a = 0; a < so.w; a += 7) R(so.x + a, so.y - 2, 2, 2, '#4ADE80');
    R(so.x, so.y, 2, so.h, '#00000044');
    R(so.x + so.w - 2, so.y, 2, so.h, '#00000044');
  }

  private crate(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const R = (a: number, b: number, c: number, d: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(a, b, c, d);
    };
    R(x - 1, y - 1, w + 2, h + 2, OUT);
    R(x, y, w, h, '#B45309');
    R(x + 1, y + 1, w - 2, 2, '#D97706');
    R(x + 1, y + h - 3, w - 2, 2, '#92400E');
    for (let i = 0; i < w - 2; i++) R(x + 1 + i, y + 1 + Math.floor((i * (h - 2)) / (w - 2)), 1, 1, '#78350F');
    drawText(g, '?', x + w / 2, y + h / 2 - 2, '#FDE047', 1, 'center', null);
  }

  private decor(g: CanvasRenderingContext2D, kind: string, x: number, theme: HTheme, s: HavenState, text?: string) {
    const R = (a: number, b: number, c: number, d: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(Math.round(a), Math.round(b), c, d);
    };
    const y = GROUND;
    switch (kind) {
      case 'lamp':
        R(x, y - 54, 2, 54, OUT);
        R(x - 4, y - 58, 10, 4, OUT);
        R(x - 3, y - 57, 8, 2, '#FDE047');
        if (PAL[theme].night) this.glow(g, x + 1, y - 54, 22, '#FDE047');
        break;
      case 'tree':
        R(x - 2, y - 26, 5, 26, '#5B3A1E');
        R(x - 15, y - 56, 32, 32, OUT);
        R(x - 14, y - 55, 30, 30, theme === 'frost' ? '#E2E8F0' : '#15803D');
        R(x - 10, y - 51, 12, 8, theme === 'frost' ? '#FFFFFF' : '#22C55E');
        R(x + 4, y - 40, 8, 6, theme === 'frost' ? '#CBD5E1' : '#166534');
        break;
      case 'bench':
        R(x - 14, y - 10, 28, 3, OUT);
        R(x - 13, y - 10, 26, 2, '#92400E');
        R(x - 14, y - 16, 28, 2, '#92400E');
        R(x - 12, y - 7, 2, 7, OUT);
        R(x + 10, y - 7, 2, 7, OUT);
        break;
      case 'laptops':
        R(x - 22, y - 14, 44, 3, OUT);
        R(x - 20, y - 11, 2, 11, OUT);
        R(x + 18, y - 11, 2, 11, OUT);
        for (const o of [-16, 2]) {
          R(x + o, y - 24, 13, 10, OUT);
          R(x + o + 1, y - 23, 11, 8, '#38BDF8');
          R(x + o + 3, y - 21, 3, 2, '#EC3750');
          R(x + o + 7, y - 19, 3, 2, '#33D6A6');
        }
        break;
      case 'metro':
        R(x - 2, y - 46, 3, 46, OUT);
        R(x - 9, y - 58, 17, 14, OUT);
        R(x - 8, y - 57, 15, 12, '#DC2626');
        drawText(g, 'M', x, y - 54, '#FFFFFF', 2, 'center', null);
        break;
      case 'kiosk':
        R(x - 16, y - 34, 32, 34, OUT);
        R(x - 15, y - 33, 30, 33, '#1D4ED8');
        R(x - 12, y - 28, 24, 12, '#FDE68A');
        sign(g, 'BUFE', x - 12, y - 42, '#DC2626');
        break;
      case 'simit':
        R(x - 12, y - 20, 24, 12, OUT);
        R(x - 11, y - 19, 22, 10, '#DC2626');
        for (let i = 0; i < 4; i++) {
          R(x - 10 + i * 5, y - 25, 5, 5, OUT);
          R(x - 9 + i * 5, y - 24, 3, 3, '#B45309');
        }
        R(x - 10, y - 8, 4, 4, OUT);
        R(x + 6, y - 8, 4, 4, OUT);
        break;
      case 'pond':
        R(x - 40, y - 4, 80, 5, '#1D4ED8');
        R(x - 38, y - 4, 76, 1, '#93C5FD');
        for (const o of [-18, 14]) {
          const bob = Math.round(Math.sin(s.t * 2 + o) * 1);
          R(x + o, y - 9 + bob, 9, 5, '#FFFFFF');
          R(x + o + 7, y - 14 + bob, 2, 6, '#FFFFFF');
          R(x + o + 8, y - 14 + bob, 3, 1, '#F97316');
        }
        break;
      case 'snowman':
        R(x - 9, y - 18, 18, 18, '#FFFFFF');
        R(x - 6, y - 30, 12, 12, '#FFFFFF');
        R(x - 3, y - 26, 1, 1, OUT);
        R(x + 2, y - 26, 1, 1, OUT);
        R(x, y - 24, 4, 1, '#F97316');
        R(x - 7, y - 20, 14, 2, '#DC2626');
        break;
      case 'wall':
        R(x - 40, y - 60, 80, 60, OUT);
        R(x - 39, y - 59, 78, 59, PAL[theme].walkD);
        for (let i = -40; i < 40; i += 12) R(x + i, y - 66, 8, 7, PAL[theme].walkD);
        R(x - 6, y - 40, 12, 18, '#05061A');
        break;
      case 'flag': {
        const reached = s.checkpoint >= x;
        R(x, y - 40, 2, 40, OUT);
        R(x + 2, y - 40, 14, 9, reached ? '#22C55E' : '#94A3B8');
        R(x + 6, y - 38, 4, 4, '#FFFFFF');
        break;
      }
      case 'exit':
        R(x - 20, y - 60, 40, 60, OUT);
        R(x - 18, y - 58, 36, 58, '#14532D');
        R(x - 14, y - 52, 28, 52, '#22C55E');
        sign(g, 'CIKIS', x - 16, y - 70, '#16A34A');
        drawText(g, '>>', x, y - 32, '#FFFFFF', 2, 'center', null);
        break;
      case 'sign':
        if (text) {
          R(x, y - 30, 2, 30, OUT);
          sign(g, text, x - textWidth(text) / 2, y - 40, PAL[theme].accent);
        }
        break;
    }
  }

  private npc(g: CanvasRenderingContext2D, look: string, x: number, t: number) {
    if (look === 'cat') {
      const R = (a: number, b: number, c: number, d: number, col: string) => {
        g.fillStyle = col;
        g.fillRect(a, b, c, d);
      };
      R(x - 6, GROUND - 7, 12, 6, OUT);
      R(x - 5, GROUND - 6, 10, 4, '#F59E0B');
      R(x + 3, GROUND - 11, 6, 6, OUT);
      R(x + 4, GROUND - 10, 4, 4, '#F59E0B');
      R(x + 4, GROUND - 12, 1, 2, OUT);
      R(x + 7, GROUND - 12, 1, 2, OUT);
      R(x - 8, GROUND - 9 + Math.round(Math.sin(t * 4)), 2, 5, '#F59E0B');
      return;
    }
    if (look === 'devin_cay') {
      drawDevin(g, x, GROUND, t, -1, 0.62);
      return;
    }
    const L: Look = LOOKS[look] ?? LOOKS.npc;
    drawFigure(g, L, { act: 'none', t, actT: 0, actDur: 0, vx: 0, vy: 0, ground: true, phase: x }, x, GROUND, -1);
  }

  private bubble(g: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string) {
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      if (textWidth(cur + ' ' + w) > 120 && cur) {
        lines.push(cur);
        cur = w;
      } else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) lines.push(cur);
    const w = Math.max(...lines.map((l) => textWidth(l))) + 8;
    const h = lines.length * 7 + 5;
    const bx = Math.round(Math.max(4, Math.min(VIEW_W + 4000, x - w / 2)));
    const by = Math.round(y - h);
    g.fillStyle = OUT;
    g.fillRect(bx - 1, by - 1, w + 2, h + 2);
    g.fillStyle = bg;
    g.fillRect(bx, by, w, h);
    g.fillStyle = OUT;
    g.fillRect(Math.round(x) - 1, by + h + 1, 3, 2);
    g.fillStyle = bg;
    g.fillRect(Math.round(x), by + h, 1, 2);
    lines.forEach((l, i) => drawText(g, l, bx + 4, by + 3 + i * 7, '#14101C', 1, 'left', null));
  }

  private pickup(g: CanvasRenderingContext2D, kind: string, x: number, y: number, t: number) {
    const bob = Math.round(Math.sin(t * 5) * 1.5);
    const R = (a: number, b: number, c: number, d: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(Math.round(a), Math.round(b), c, d);
    };
    const yy = y - 6 + bob;
    if (kind === 'coin') {
      const w = Math.abs(Math.cos(t * 6)) * 3 + 1;
      R(x - w - 1, yy - 4, w * 2 + 2, 9, OUT);
      R(x - w, yy - 3, w * 2, 7, '#FACC15');
      R(x - w, yy - 3, 1, 3, '#FEF9C3');
      return;
    }
    if (t > 26 && Math.floor(t * 8) % 2 === 0) return;
    this.glow(g, x, yy, 9, kind === 'heal' ? '#4ADE80' : '#FDE047');
    if (kind === 'heal') {
      R(x - 4, yy - 5, 8, 10, OUT);
      R(x - 3, yy - 4, 6, 8, '#FECACA');
      R(x - 2, yy - 2, 4, 5, '#B91C1C');
      R(x + 3, yy - 2, 2, 3, OUT);
      return;
    }
    const map: Record<string, Look['item']> = { doner: 'doner', cay: 'cay', simit: 'simit', skewer: 'skewer', keyboard: 'keyboard' };
    g.save();
    g.translate(Math.round(x - 4), Math.round(yy));
    const item = map[kind];
    if (item === 'skewer' || item === 'keyboard') {
      g.translate(4, -8);
      g.rotate(Math.PI / 2);
      g.translate(-4, 0);
    }
    drawItemPublic(g, item!, 0, 0);
    g.restore();
  }

  private bus(g: CanvasRenderingContext2D, x: number, dir: number, t: number) {
    const R = (a: number, b: number, c: number, d: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(Math.round(a), Math.round(b), c, d);
    };
    const y = GROUND;
    R(x - 46, y - 40, 92, 34, OUT);
    R(x - 45, y - 39, 90, 30, '#2563EB');
    R(x - 45, y - 16, 90, 4, '#F8FAFC');
    for (let w = -40; w < 36; w += 14) R(x + w, y - 34, 11, 10, '#BFDBFE');
    R(x + dir * 40, y - 34, 4, 16, '#BFDBFE');
    sign(g, 'EGO 404', x - 20, y - 50, '#DC2626');
    const wr = Math.floor(t * 10) % 2;
    for (const o of [-30, 26]) {
      R(x + o, y - 8, 10, 8, OUT);
      R(x + o + 3 + wr, y - 6, 2, 2, '#9CA3AF');
    }
    R(x + dir * 44, y - 12, 3, 3, '#FDE047');
  }

  private proj(g: CanvasRenderingContext2D, q: Projectile, s: HavenState) {
    const R = (a: number, b: number, c: number, d: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(Math.round(a), Math.round(b), c, d);
    };
    if (q.delay > 0) {
      const blink = Math.floor(s.t * 12) % 2 === 0;
      if (q.kind === 'clock') {
        R(q.x - 7, GROUND - 2, 14, 2, blink ? '#F87171' : '#7F1D1D');
      } else {
        R(q.x - 6, GROUND - 3, 12, 3, blink ? '#93C5FD' : '#1E3A8A');
      }
      return;
    }
    switch (q.kind) {
      case 'doner':
        g.save();
        g.translate(Math.round(q.x), Math.round(q.y));
        g.rotate(q.spin);
        drawItemPublic(g, 'doner', -4, 0);
        g.restore();
        break;
      case 'cay':
        drawItemPublic(g, 'cay', q.x - 2, q.y);
        break;
      case 'simit':
        g.save();
        g.translate(Math.round(q.x), Math.round(q.y));
        g.rotate(q.spin);
        drawItemPublic(g, 'simit', -4, 0);
        g.restore();
        break;
      case 'err':
        R(q.x - 6, q.y - 4, 12, 8, OUT);
        R(q.x - 5, q.y - 3, 10, 6, '#EF4444');
        drawText(g, '404', q.x, q.y - 2, '#FFFFFF', 1, 'center', null);
        break;
      case 'lavas':
        R(q.x - 6, q.y - 2, 12, 5, OUT);
        R(q.x - 5, q.y - 1, 10, 3, '#FDE68A');
        R(q.x - 2, q.y - 1, 2, 1, '#D97706');
        break;
      case 'ayran':
        R(q.x - 3, q.y - 6, 6, 11, OUT);
        R(q.x - 2, q.y - 5, 4, 9, '#F8FAFC');
        R(q.x - 2, q.y - 2, 4, 2, '#3B82F6');
        break;
      case 'ice':
        this.glow(g, q.x, q.y, 8, '#7DD3FC');
        R(q.x - 4, q.y - 2, 8, 4, '#E0F2FE');
        R(q.x - 2, q.y - 1, 4, 2, '#38BDF8');
        break;
      case 'clock':
        R(q.x - 6, q.y - 6, 12, 12, OUT);
        R(q.x - 5, q.y - 5, 10, 10, '#FDE047');
        R(q.x - 1, q.y - 4, 1, 5, OUT);
        R(q.x - 1, q.y, 4, 1, OUT);
        break;
      case 'orb':
        this.glow(g, q.x, q.y, 12, q.team === 'hero' ? '#F0ABFC' : '#A78BFA');
        R(q.x - 3, q.y - 3, 6, 6, q.team === 'hero' ? '#F5D0FE' : '#C4B5FD');
        R(q.x - 1, q.y - 1, 2, 2, '#FFFFFF');
        break;
      case 'shock':
        if (q.vx === 0) {
          R(q.x - 5, q.y - 9, 10, 18, '#E0F2FE');
          R(q.x - 2, q.y - 14, 4, 6, '#BAE6FD');
        } else {
          R(q.x - 7, q.y - 6, 14, 12, '#E7E5E4AA');
          R(q.x - 4, q.y - 10, 8, 6, '#FFFFFFAA');
        }
        break;
      case 'laser':
        this.glow(g, q.x, q.y, 16, '#F43F5E');
        R(q.x - 40, q.y - 3, 80, 6, '#F43F5E');
        R(q.x - 40, q.y - 1, 80, 2, '#FFE4E6');
        break;
    }
  }

  private enemy(g: CanvasRenderingContext2D, e: Enemy, s: HavenState) {
    if (e.dead && e.deadT > 0.6 && Math.floor(s.t * 16) % 2 === 0) return;
    if (e.act === 'vanish') {
      if (Math.floor(s.t * 30) % 3 !== 0) return;
    }
    const look = LOOKS[e.kind] ?? LOOKS.bug;
    if (e.act === 'windup' && Math.floor(s.t * 14) % 2 === 0) this.glow(g, e.x, e.y - e.h * 0.6, 10 * e.scale, '#F87171');
    if (e.boss && e.act === 'windup' && e.move === 'laser') {
      g.fillStyle = Math.floor(s.t * 16) % 2 ? '#F43F5E' : '#FDA4AF';
      g.fillRect(s.camX, (e.dir > 0 ? GROUND - 5 : GROUND - 25) - 1, VIEW_W, 1);
    }
    if (e.clone) g.globalAlpha = 0.75;
    drawFigure(g, look, { act: e.act, t: s.t, actT: e.actT, actDur: e.actDur, vx: e.vx, vy: e.vy, ground: e.ground, phase: e.id }, e.x, e.y, e.facing, e.scale, e.flashT > 0);
    g.globalAlpha = 1;
    if (!e.boss && !e.dead && e.hp < e.maxHp && !e.clone) {
      const w = 16;
      const x = Math.round(e.x - w / 2);
      const y = Math.round(e.y - e.h - 6);
      g.fillStyle = OUT;
      g.fillRect(x - 1, y - 1, w + 2, 4);
      g.fillStyle = '#7F1D1D';
      g.fillRect(x, y, w, 2);
      g.fillStyle = '#EF4444';
      g.fillRect(x, y, Math.round((w * e.hp) / e.maxHp), 2);
    }
  }

  private whoosh(g: CanvasRenderingContext2D, x: number, y: number, f: number, k: number, reach: number) {
    if (k < 0.15 || k > 0.6) return;
    g.fillStyle = '#FFFFFF99';
    const a = 1 - Math.abs(k - 0.35) * 3;
    for (let i = 0; i < 3; i++) g.fillRect(Math.round(x + f * (6 + i * 4)), Math.round(y - 24 + i * 3), Math.round(f * reach * a * 0.6) || 1, 1);
  }

  private fx(g: CanvasRenderingContext2D, s: HavenState) {
    for (const f of s.fx) {
      const a = Math.max(0, f.life / f.max);
      if (f.kind === 'num') {
        drawText(g, f.text ?? '', f.x, f.y, f.color, 1, 'center');
        continue;
      }
      if (f.kind === 'ring') {
        const r = Math.round(f.size * (1.4 - a));
        g.fillStyle = f.color;
        g.fillRect(Math.round(f.x - r), Math.round(f.y - r), r * 2, 1);
        g.fillRect(Math.round(f.x - r), Math.round(f.y + r), r * 2, 1);
        g.fillRect(Math.round(f.x - r), Math.round(f.y - r), 1, r * 2);
        g.fillRect(Math.round(f.x + r), Math.round(f.y - r), 1, r * 2);
        continue;
      }
      if (f.kind === 'code') {
        g.fillStyle = f.color;
        g.fillRect(Math.round(f.x), Math.round(f.y), 1, 3);
        g.fillRect(Math.round(f.x) + 2, Math.round(f.y) + 1, 1, 2);
        continue;
      }
      g.globalAlpha = f.kind === 'dust' ? a * 0.7 : Math.min(1, a * 1.5);
      g.fillStyle = f.color;
      const sz = f.kind === 'spark' ? Math.max(1, Math.round(f.size * a + 0.5)) : f.size;
      g.fillRect(Math.round(f.x), Math.round(f.y), sz, sz);
      g.globalAlpha = 1;
    }
  }

  private glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col + '88');
    gr.addColorStop(1, col + '00');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  private lights(g: CanvasRenderingContext2D, s: HavenState, cam: number) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const q of s.projs) if (q.kind === 'orb' || q.kind === 'laser') this.glow(g, q.x - cam, q.y, 18, '#6D28D9');
    this.glow(g, s.player.x - cam, s.player.y - 16, 40, '#1E3A8A');
    g.restore();
  }

  private snow(g: CanvasRenderingContext2D, t: number, cam: number) {
    g.fillStyle = '#FFFFFF';
    for (let i = 0; i < 70; i++) {
      let x = (i * 61 + t * (10 + (i % 5) * 5) - cam * 0.6) % VIEW_W;
      if (x < 0) x += VIEW_W;
      const y = (i * 47 + t * (20 + (i % 7) * 6)) % VIEW_H;
      g.fillRect(Math.round(x), Math.round(y), i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }
  }

  private glitch(g: CanvasRenderingContext2D, s: HavenState) {
    const boss = s.enemies.find((e) => e.boss && !e.dead);
    const k = Math.floor(s.t * 8);
    const strong = boss && boss.phase === 2;
    if (k % (strong ? 3 : 7) === 0) {
      g.fillStyle = s.level.theme === 'glitch' ? '#22D3EE33' : '#A3E63533';
      g.fillRect(0, (k * 37) % VIEW_H, VIEW_W, 2 + (k % 4));
      if (strong) g.drawImage(this.buf, 0, (k * 53) % VIEW_H, VIEW_W, 6, (k % 2 ? 3 : -3), (k * 53) % VIEW_H, VIEW_W, 6);
    }
  }

  private vignette(g: CanvasRenderingContext2D) {
    const gr = g.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62);
    gr.addColorStop(0, '#00000000');
    gr.addColorStop(1, '#00000066');
    g.fillStyle = gr;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  private hud(g: CanvasRenderingContext2D, s: HavenState) {
    const p = s.player;
    const R = (a: number, b: number, c: number, d: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(a, b, c, d);
    };
    R(6, 6, 24, 24, OUT);
    R(7, 7, 22, 22, '#1E293B');
    g.save();
    g.beginPath();
    g.rect(7, 7, 22, 22);
    g.clip();
    drawFigure(g, LOOKS.akin, { act: 'none', t: s.t, actT: 0, actDur: 0, vx: 0, vy: 0, ground: true }, 18, 48, 1, 1.15);
    g.restore();
    R(32, 7, 82, 9, OUT);
    R(33, 8, 80, 7, '#450A0A');
    const hpw = Math.round((80 * Math.max(0, p.hp)) / p.maxHp);
    R(33, 8, hpw, 7, p.hp < 35 ? '#F97316' : '#22C55E');
    R(33, 8, hpw, 2, '#FFFFFF55');
    for (let i = 1; i < 10; i++) R(33 + i * 8, 8, 1, 7, '#00000055');
    R(32, 17, 62, 5, OUT);
    R(33, 18, 60, 3, '#1E1B4B');
    R(33, 18, Math.round((60 * p.special) / 100), 3, p.special >= 100 && Math.floor(s.t * 6) % 2 ? '#FFFFFF' : '#22D3EE');
    if (p.special >= 100) drawText(g, 'U/V: SHIP IT!', 98, 17, '#22D3EE');
    drawText(g, `x${p.lives}`, 33, 24, '#FFFFFF');
    R(52, 24, 5, 5, OUT);
    R(53, 25, 3, 3, '#FACC15');
    drawText(g, `${p.coins}`, 60, 24, '#FDE047');
    if (p.weapon) {
      R(118, 6, 16, 16, OUT);
      R(119, 7, 14, 14, '#334155');
      g.save();
      g.translate(122, 14);
      if (p.weapon === 'skewer' || p.weapon === 'keyboard') {
        g.translate(4, -6);
        g.rotate(Math.PI / 4);
        g.scale(0.6, 0.6);
      }
      drawItemPublic(g, p.weapon, 0, 0);
      g.restore();
      drawText(g, `${WEAPON_LABEL[p.weapon]} ${p.ammo}`, 138, 11, '#FFFFFF');
    }
    const boss = s.enemies.find((e) => e.id === s.bossId && !e.dead);
    if (boss) {
      const w = 220;
      const x = (VIEW_W - w) / 2;
      const y = VIEW_H - 16;
      drawText(g, FOES[boss.kind].name, VIEW_W / 2, y - 8, '#FCA5A5', 1, 'center');
      R(x - 1, y - 1, w + 2, 8, OUT);
      R(x, y, w, 6, '#450A0A');
      R(x, y, Math.round((w * boss.hp) / boss.maxHp), 6, boss.phase === 2 ? '#F97316' : '#DC2626');
      R(x, y, Math.round((w * boss.hp) / boss.maxHp), 2, '#FFFFFF44');
      R(x + w / 2, y, 1, 6, '#00000088');
    }
    if (s.lockX !== null && !boss && s.enemies.every((e) => e.dead) === false) {
      drawText(g, '!', VIEW_W - 12, 8, Math.floor(s.t * 4) % 2 ? '#F87171' : '#FFFFFF', 2);
    }
    if (s.lockX === null && s.phase === 'play' && s.banner.t <= 0 && s.level.encounters.some((e) => e.done) && Math.floor(s.t * 2) % 2 === 0) {
      drawText(g, 'GO >', VIEW_W - 34, VIEW_H / 2 - 4, '#FDE047', 2);
    }
    if (s.banner.t > 0) {
      const a = Math.min(1, s.banner.t * 3);
      g.globalAlpha = a;
      const tw = textWidth(s.banner.text, 3);
      R(Math.round(VIEW_W / 2 - tw / 2 - 8), 52, tw + 16, 25, '#14101CCC');
      drawText(g, s.banner.text, VIEW_W / 2, 57, '#FDE047', 3, 'center');
      g.globalAlpha = 1;
    }
  }
}

export function drawItemPublic(g: CanvasRenderingContext2D, item: NonNullable<Look['item']>, x: number, y: number) {
  drawFigureItem(g, item, x, y);
}


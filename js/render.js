import { WORLD } from './physics.js';
import { THEMES } from './maps.js';
import { drawCharacter, drawFez, drawHat } from './character.js';

const W = WORLD.w;
const H = WORLD.h;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function bricks(ctx, x, y, w, h, base, rnd, bw = 46, bh = 22) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  for (let row = 0; row * bh < h; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col * bw < w + bw; col++) {
      const bx = x + col * bw + off;
      const by = y + row * bh;
      const l = rnd() * 0.12 - 0.06;
      ctx.fillStyle = l > 0 ? `rgba(255,255,255,${l})` : `rgba(0,0,0,${-l})`;
      ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(bx, by + bh - 2, bw, 2);
      ctx.fillRect(bx + bw - 2, by, 2, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(bx + 1, by + 1, bw - 3, 2);
    }
  }
  ctx.restore();
}

function merlons(ctx, x, y, w, color, size = 26, gap = 18) {
  ctx.fillStyle = color;
  for (let mx = x; mx < x + w - size + 1; mx += size + gap) {
    ctx.fillRect(mx, y - size, size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(mx, y - size, size, 3);
    ctx.fillStyle = color;
  }
}

function skyline(ctx, rnd, th) {
  ctx.fillStyle = th.far;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 330 - Math.sin(x * 0.006) * 30 - rnd() * 14);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();

  ctx.fillStyle = th.far2;
  const domes = [
    [210, 300, 70],
    [640, 285, 95],
    [1060, 300, 75],
  ];
  for (const [cx, by, r] of domes) {
    ctx.beginPath();
    ctx.arc(cx, by, r, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r - 10, by, r * 2 + 20, 200);
    ctx.beginPath();
    ctx.arc(cx - r * 0.75, by + 8, r * 0.38, Math.PI, 0);
    ctx.arc(cx + r * 0.75, by + 8, r * 0.38, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 2, by - r - 22, 4, 24);
    for (const mx of [cx - r - 34, cx + r + 30]) {
      ctx.fillRect(mx, by - r - 60, 8, r + 260);
      ctx.beginPath();
      ctx.moveTo(mx - 2, by - r - 60);
      ctx.lineTo(mx + 4, by - r - 100);
      ctx.lineTo(mx + 10, by - r - 60);
      ctx.fill();
      ctx.fillRect(mx - 4, by - r - 20, 16, 5);
    }
  }
}

function dungeonBack(ctx, rnd, th) {
  bricks(ctx, 0, 0, W, H, th.far, rnd, 70, 34);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#4a4252';
  ctx.lineWidth = 4;
  for (const cx of [180, 420, 860, 1100]) {
    ctx.beginPath();
    for (let y = 0; y < 220; y += 14) ctx.ellipse(cx, y, 5, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function createBackground(level) {
  const th = THEMES[level.theme] || THEMES.gece;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const rnd = seeded(42);
  const L = level.moatL;
  const R = level.moatR;

  const sky = ctx.createLinearGradient(0, 0, 0, 560);
  th.sky.forEach((col, k) => sky.addColorStop(k / (th.sky.length - 1), col));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < th.stars; i++) {
    ctx.fillStyle = `rgba(255,255,240,${0.3 + rnd() * 0.6})`;
    const r = rnd() * 1.4 + 0.3;
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * 260, r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (th.moon) {
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.arc(1010, 110, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = th.sky[0];
    ctx.beginPath();
    ctx.arc(1026, 100, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.save();
    ctx.translate(1060, 110);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 6 : 14;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.fill();
    ctx.restore();
  }
  if (th.sun) {
    const sg = ctx.createRadialGradient(1000, 140, 10, 1000, 140, 120);
    sg.addColorStop(0, 'rgba(255,250,220,1)');
    sg.addColorStop(0.35, 'rgba(255,230,150,0.8)');
    sg.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(860, 0, 280, 280);
  }

  if (th.dungeon) dungeonBack(ctx, rnd, th);
  else skyline(ctx, rnd, th);

  if (R - L > 80) {
    bricks(ctx, L + 40, 265, R - L - 80, 380, th.wall, rnd);
    merlons(ctx, L + 40, 265, R - L - 80, th.wall);
    ctx.fillStyle = `rgba(10,6,25,${th.shade})`;
    ctx.fillRect(L + 40, 265, R - L - 80, 380);
  }

  for (const wx of level.windows) {
    ctx.fillStyle = '#1d1430';
    ctx.beginPath();
    ctx.moveTo(wx - 34, 600);
    ctx.lineTo(wx - 34, 540);
    ctx.arc(wx, 540, 34, Math.PI, 0);
    ctx.lineTo(wx + 34, 600);
    ctx.fill();
    const glow = ctx.createLinearGradient(0, 500, 0, 600);
    glow.addColorStop(0, th.window[0]);
    glow.addColorStop(1, th.window[1]);
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(wx - 26, 600);
    ctx.lineTo(wx - 26, 542);
    ctx.arc(wx, 542, 26, Math.PI, 0);
    ctx.lineTo(wx + 26, 600);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#1d1430';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wx, 516);
    ctx.lineTo(wx, 600);
    ctx.moveTo(wx - 26, 560);
    ctx.lineTo(wx + 26, 560);
    ctx.stroke();
  }

  level.banners.forEach((bx, k) => {
    const col = k % 2 ? '#f4f1e8' : '#c8102e';
    ctx.fillStyle = '#2a1d10';
    ctx.fillRect(bx - 30, 276, 60, 5);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(bx - 26, 280);
    ctx.lineTo(bx + 26, 280);
    ctx.lineTo(bx + 26, 380);
    ctx.lineTo(bx, 362);
    ctx.lineTo(bx - 26, 380);
    ctx.fill();
    ctx.fillStyle = col === '#c8102e' ? '#f4f1e8' : '#c8102e';
    ctx.beginPath();
    ctx.arc(bx - 3, 318, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(bx + 1, 318, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(bx + 10, 280, 16, 95);
  });

  drawSolids(ctx, level, th, rnd);

  if (!th.dungeon) {
    ctx.fillStyle = th.snow ? '#e8f0fb' : '#2d6b4f';
    ctx.fillRect(0, WORLD.waterY - 6, L, 8);
    ctx.fillRect(R, WORLD.waterY - 6, W - R, 8);
  }
  return c;
}

function drawSolids(ctx, level, th, rnd) {
  for (const pl of level.platforms) {
    if (pl.kind === 'floor') {
      bricks(ctx, pl.x, pl.y, pl.w, pl.h, th.floor, rnd, 60, 26);
      ctx.fillStyle = th.floorTop;
      ctx.fillRect(pl.x, pl.y, pl.w, 7);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(pl.x, pl.y + 7, pl.w, 3);
    }
  }
  for (const pl of level.platforms) {
    if (pl.kind !== 'tower') continue;
    merlons(ctx, pl.x, pl.y, pl.w, th.tower, 22, 14);
    bricks(ctx, pl.x, pl.y, pl.w, pl.h, th.tower, rnd, 40, 22);
    ctx.fillStyle = th.towerTop;
    ctx.fillRect(pl.x - 6, pl.y, pl.w + 12, 9);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(pl.x - 6, pl.y + 9, pl.w + 12, 4);
    const ax = pl.x + pl.w / 2;
    ctx.fillStyle = '#20172e';
    ctx.beginPath();
    ctx.moveTo(ax - 9, pl.y + 80);
    ctx.lineTo(ax - 9, pl.y + 50);
    ctx.arc(ax, pl.y + 50, 9, Math.PI, 0);
    ctx.lineTo(ax + 9, pl.y + 80);
    ctx.fill();
  }

}

/** Static floors and towers of a scrolling level, drawn once into a wide canvas. */
export function createSolids(level) {
  const th = THEMES[level.theme] || THEMES.gece;
  const c = document.createElement('canvas');
  c.width = level.width;
  c.height = H;
  const ctx = c.getContext('2d');
  drawSolids(ctx, level, th, seeded(7));
  if (!th.dungeon) {
    ctx.fillStyle = th.snow ? '#e8f0fb' : '#2d6b4f';
    for (const [x0, x1] of level.water) ctx.fillRect(x0, WORLD.waterY - 6, x1 - x0, 8);
  }
  return c;
}

export function drawWeather(ctx, level, t) {
  const th = THEMES[level.theme];
  if (!th || (!th.snow && !th.embers)) return;
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const seed = i * 97.13;
    if (th.snow) {
      const x = (seed * 13.7 + t * (18 + (i % 5) * 6) + Math.sin(t + i) * 20) % W;
      const y = (seed * 7.3 + t * (40 + (i % 7) * 8)) % H;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    } else {
      const x = (seed * 13.7 + Math.sin(t * 0.7 + i) * 30) % W;
      const y = H - ((seed * 7.3 + t * (50 + (i % 7) * 12)) % H);
      ctx.fillStyle = `rgba(255,${120 + (i % 5) * 20},40,${0.4 + (i % 4) * 0.15})`;
      ctx.fillRect(x, y, 3, 3);
    }
  }
  ctx.restore();
}

export function drawPlatform(ctx, pl, t) {
  if (pl.kind === 'floor' || pl.kind === 'tower') return;
  const x = pl.x;
  const y = pl.y;
  const w = pl.w;
  if (pl.kind === 'lift') {
    ctx.strokeStyle = '#3a2716';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + w / 2, pl.move?.y0 !== undefined ? 0 : y - 220);
    ctx.lineTo(x + w - 14, y);
    ctx.stroke();
  }
  if (pl.kind === 'ship') {
    ctx.fillStyle = '#5a3418';
    ctx.strokeStyle = '#1b1030';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x + w + 14, y);
    ctx.lineTo(x + w - 18, y + 46);
    ctx.lineTo(x + 18, y + 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(x + 4, y + 14, w - 8, 6);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(x - 10, y - 4, w + 20, 8);
    ctx.fillStyle = '#3a2716';
    ctx.fillRect(x + w / 2 - 4, y - 170, 8, 170);
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 6, y - 160);
    ctx.quadraticCurveTo(x + w / 2 + 70 + Math.sin(t * 2) * 6, y - 110, x + w / 2 + 6, y - 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.arc(x + w / 2 + 30, y - 100, 12, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (pl.kind === 'bridge') {
    ctx.strokeStyle = '#2b2b33';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    for (const cx of [x + 10, x + w - 10]) {
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + (cx < x + w / 2 ? -30 : 30), 270);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  const th = 16;
  if (pl.kind === 'throne') {
    ctx.fillStyle = '#5a1020';
    ctx.fillRect(x, y, w, th + 6);
    ctx.fillStyle = '#c8a03a';
    ctx.fillRect(x, y, w, 4);
    ctx.fillRect(x, y + th + 2, w, 4);
    ctx.fillStyle = '#8e1b2e';
    for (let px = x + 10; px < x + w - 10; px += 30) ctx.fillRect(px, y + 8, 18, 6);
    ctx.fillStyle = '#c8a03a';
    ctx.fillRect(x + w / 2 - 34, y - 90, 68, 10);
    ctx.fillStyle = '#6e1424';
    ctx.fillRect(x + w / 2 - 28, y - 80, 56, 80);
    ctx.strokeStyle = '#c8a03a';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + w / 2 - 28, y - 80, 56, 80);
    return;
  }
  const g = ctx.createLinearGradient(0, y, 0, y + th);
  g.addColorStop(0, '#b27a43');
  g.addColorStop(1, '#6e4524');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, th);
  ctx.fillStyle = '#d39a5c';
  ctx.fillRect(x, y, w, 3);
  ctx.strokeStyle = 'rgba(40,20,5,0.55)';
  ctx.lineWidth = 2;
  for (let px = x + 34; px < x + w; px += 34) {
    ctx.beginPath();
    ctx.moveTo(px, y + 2);
    ctx.lineTo(px, y + th);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a1a0d';
  for (let px = x + 8; px < x + w; px += 34) {
    ctx.fillRect(px, y + 6, 3, 3);
    ctx.fillRect(px + 20, y + 6, 3, 3);
  }
  if (pl.kind === 'ledge') {
    ctx.fillStyle = '#5a3a1e';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + th);
    ctx.lineTo(x + 40, y + th);
    ctx.lineTo(x + 26, y + th + 26);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w - 12, y + th);
    ctx.lineTo(x + w - 40, y + th);
    ctx.lineTo(x + w - 26, y + th + 26);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x, y + th, w, 3);
  void t;
}

export function drawTorches(ctx, t, level) {
  for (const [x, y] of level.torches) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 3, y, 6, 22);
    ctx.fillStyle = '#5c4430';
    ctx.fillRect(x - 7, y - 3, 14, 6);
    const f = Math.sin(t * 13 + x) * 2 + Math.sin(t * 7 + x * 0.3) * 1.5;
    const glow = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, 70);
    glow.addColorStop(0, 'rgba(255,190,90,0.38)');
    glow.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 70, y - 80, 140, 140);
    ctx.fillStyle = '#ff8a1f';
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 3);
    ctx.quadraticCurveTo(x - 8, y - 16, x + f * 0.6, y - 26 - f);
    ctx.quadraticCurveTo(x + 8, y - 16, x + 7, y - 3);
    ctx.fill();
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.moveTo(x - 3.5, y - 3);
    ctx.quadraticCurveTo(x - 4, y - 10, x + f * 0.3, y - 16 - f * 0.5);
    ctx.quadraticCurveTo(x + 4, y - 10, x + 3.5, y - 3);
    ctx.fill();
  }
}

export function drawWater(ctx, t, level) {
  for (const [x0, x1] of level.water) {
    const g = ctx.createLinearGradient(0, WORLD.waterY, 0, H);
    g.addColorStop(0, 'rgba(60,150,190,0.92)');
    g.addColorStop(1, 'rgba(15,45,85,0.98)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, H);
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, WORLD.waterY + Math.sin(t * 3 + x * 0.08) * 3);
    ctx.lineTo(x1, H);
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,245,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 8) {
      const y = WORLD.waterY + Math.sin(t * 3 + x * 0.08) * 3;
      if (x === x0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export function createParticles() {
  return [];
}

export function spawn(parts, kind, x, y, n, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = opts.angle ?? Math.random() * Math.PI * 2;
    const spread = opts.spread ?? Math.PI * 2;
    const ang = opts.angle !== undefined ? a + (Math.random() - 0.5) * spread : a;
    const sp = (opts.speed ?? 200) * (0.5 + Math.random() * 0.7);
    parts.push({
      kind,
      x,
      y,
      vx: Math.cos(ang) * sp + (opts.vx || 0),
      vy: Math.sin(ang) * sp + (opts.vy || 0),
      life: opts.life ?? 0.6,
      max: opts.life ?? 0.6,
      size: opts.size ?? 5,
      color: opts.color || '#fff',
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 12,
      g: opts.g ?? 600,
      text: opts.text,
    });
  }
}

export function updateParticles(parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i];
    q.life -= dt;
    if (q.life <= 0) {
      parts.splice(i, 1);
      continue;
    }
    q.vy += q.g * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.rot += q.vr * dt;
    if (q.kind === 'dust') {
      q.vx *= 0.92;
      q.vy *= 0.92;
    }
  }
}

function star(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawParticles(ctx, parts) {
  for (const q of parts) {
    const k = q.life / q.max;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.translate(q.x, q.y);
    if (q.kind === 'star') {
      ctx.rotate(q.rot);
      ctx.fillStyle = q.color;
      star(ctx, q.size);
    } else if (q.kind === 'fez') {
      drawFez(ctx, 0, 0, q.rot, 1, Math.sin(q.rot * 3));
    } else if (q.kind === 'text') {
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.font = `900 ${q.size}px "Trebuchet MS", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#1b1030';
      ctx.strokeText(q.text, 0, 0);
      ctx.fillStyle = q.color;
      ctx.fillText(q.text, 0, 0);
    } else if (q.kind === 'confetti') {
      ctx.rotate(q.rot);
      ctx.fillStyle = q.color;
      ctx.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
    } else if (q.kind === 'ring') {
      ctx.globalAlpha = k * 0.8;
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 4 * k;
      ctx.beginPath();
      ctx.ellipse(0, 0, q.size * (1.4 - k), q.size * 0.25 * (1.4 - k), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (q.kind === 'ghost') {
      ctx.globalAlpha = k * 0.7;
      ctx.fillStyle = '#e9e6ff';
      ctx.beginPath();
      ctx.arc(0, -20, 18, Math.PI, 0);
      ctx.lineTo(18, 4);
      for (let i = 0; i < 4; i++) ctx.lineTo(18 - (i + 0.5) * 9, i % 2 ? 4 : -4);
      ctx.lineTo(-18, 4);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(-8, -24, 4, 6);
      ctx.fillRect(4, -24, 4, 6);
    } else {
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(0, 0, q.size * (0.4 + k * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawPlayer(ctx, p, info, t) {
  if (p.state === 'out') return;
  const a = p.anim;
  const x = p.x + p.w / 2;
  const y = p.y + p.h;
  let alpha = 1;
  if (p.invuln > 0 && p.state !== 'squashed') alpha = Math.floor(t * 14) % 2 ? 0.35 : 0.95;
  const squashed = p.state === 'squashed';
  const k = p.scale || 1;
  const sy = (squashed ? 0.26 : a.sy) * k;
  const sx = (squashed ? 1.75 : 1 + (1 - a.sy) * 0.9) * k;
  const walk = p.grounded && Math.abs(p.vx) > 40 ? a.walk : 0;
  const bob = p.grounded && Math.abs(p.vx) > 40 ? Math.abs(Math.sin(a.walk)) * 3 : 0;
  drawCharacter(ctx, x, y - bob, {
    pal: info.pal,
    facing: p.facing,
    t,
    sx,
    sy,
    walk,
    armsUp: squashed ? 1 : p.grounded ? 0 : p.state === 'pound' ? 1 : 0.6,
    eyes: squashed ? 'x' : p.state === 'pound' ? 'closed' : 'normal',
    fez: !squashed,
    hat: info.hat,
    stache: info.stache,
    alpha,
    tilt: p.shoveT > 0 ? p.facing * 0.25 : 0,
    mustacheWiggle: p.shoveT > 0 ? -2 : 0,
  });

  if (!squashed) {
    const ty = p.y - 34 - (k - 1) * 30;
    if (!info.tag) return;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = info.pal.ui;
    ctx.beginPath();
    ctx.moveTo(x - 7, ty + 10);
    ctx.lineTo(x + 7, ty + 10);
    ctx.lineTo(x, ty + 17);
    ctx.fill();
    ctx.font = '800 15px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1b1030';
    ctx.strokeText(info.tag, x, ty + 6);
    ctx.fillStyle = '#fff';
    ctx.fillText(info.tag, x, ty + 6);
    ctx.restore();
  } else {
    for (let i = 0; i < 3; i++) {
      const ang = t * 4 + (i * Math.PI * 2) / 3;
      ctx.save();
      ctx.translate(x + Math.cos(ang) * 26 * k, y - 22 * k + Math.sin(ang) * 6);
      ctx.fillStyle = '#ffe14d';
      star(ctx, 6);
      ctx.restore();
    }
  }
}

export function drawHUD(ctx, g) {
  const list = g.players.filter((p) => p.info.kind === 'hero');
  const n = list.length;
  const cw = n > 4 ? 190 : 230;
  const gap = 12;
  const total = n * cw + (n - 1) * gap;
  let x = (W - total) / 2;
  const crown = g.mode.id === 'tac';
  for (const p of list) {
    const info = p.info;
    ctx.save();
    ctx.globalAlpha = p.state === 'out' ? 0.45 : 0.92;
    ctx.fillStyle = 'rgba(20,12,40,0.72)';
    roundRect(ctx, x, 10, cw, 50, 14);
    ctx.fill();
    ctx.strokeStyle = info.pal.ui;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x, 10, cw, 50, 14);
    ctx.clip();
    drawCharacter(ctx, x + 30, 74, { pal: info.pal, hat: info.hat, stache: info.stache, sx: 0.62, sy: 0.62, shadow: false, eyes: p.state === 'out' ? 'x' : 'normal' });
    ctx.restore();
    ctx.font = '800 16px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(info.name.slice(0, 12), x + 60, 31);
    if (crown) {
      const sc = g.ms.score[p.id] || 0;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 62, 41, cw - 76, 9);
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(x + 62, 41, (cw - 76) * Math.min(1, sc / g.ms.target), 9);
    } else if (info.maxLives <= 6) {
      for (let h = 0; h < info.maxLives; h++) drawHeart(ctx, x + 68 + h * 19, 46, h < p.lives);
    } else {
      drawHeart(ctx, x + 68, 46, p.lives > 0);
      ctx.fillStyle = '#fff';
      ctx.font = '800 14px "Trebuchet MS", system-ui, sans-serif';
      ctx.fillText(`x ${Math.max(0, p.lives)}`, x + 80, 51);
    }
    ctx.textAlign = 'right';
    ctx.font = '800 14px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillStyle = '#ffe14d';
    ctx.fillText(`★ ${p.stomps}`, x + cw - 12, 31);
    ctx.restore();
    x += cw + gap;
  }
  drawModeHUD(ctx, g);
}

function bar(ctx, x, y, w, h, k, col, label) {
  ctx.fillStyle = 'rgba(20,12,40,0.78)';
  roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w * Math.max(0, k), h);
  ctx.font = '800 14px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(label, x + w / 2, y + h - 3);
}

function drawModeHUD(ctx, g) {
  const ms = g.ms;
  if (g.mode.id === 'kusatma') {
    bar(ctx, W / 2 - 160, 74, 320, 18, ms.gate.hp / ms.gate.max, ms.gate.hp / ms.gate.max > 0.35 ? '#e0a040' : '#e04040', `Kapı ${Math.ceil(ms.gate.hp)}  ·  Dalga ${ms.wave}/${ms.waves}`);
  } else if (g.mode.id === 'saldiri') {
    const boss = g.players.find((p) => p.id === ms.boss);
    if (boss) bar(ctx, W / 2 - 160, 74, 320, 18, boss.lives / boss.info.maxLives, '#a040e0', `Kara Paşa  ${Math.max(0, boss.lives)}/${boss.info.maxLives}`);
  } else if (g.mode.id === 'macera') {
    const lead = Math.max(0, ...g.players.filter((p) => p.info.kind === 'hero' && p.state !== 'out').map((p) => p.x));
    bar(ctx, W / 2 - 160, 74, 320, 18, Math.min(1, lead / ms.flag), '#4fc06a', `Çıkışa ${Math.max(0, Math.round((ms.flag - lead) / 40))} adım  ·  Altın ${ms.coins || 0}`);
  } else if (g.mode.id === 'tac') {
    ctx.font = '800 15px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe14d';
    ctx.fillText(`Tacı ${g.ms.target} saniye tutan kazanır`, W / 2, 84);
  }
  if (g.cfg.goalText) {
    ctx.font = '700 14px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(g.cfg.goalText, 14, H - 14);
  }
}

function drawAdventure(ctx, g, t) {
  const lv = g.level;
  const ms = g.ms || {};
  const got = new Set(ms.got || []);
  (lv.coins || []).forEach((c, i) => {
    if (got.has(i)) return;
    const sq = Math.abs(Math.cos(t * 3 + c.x * 0.01));
    ctx.fillStyle = '#7a4d08';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + Math.sin(t * 4 + i) * 3, 12 * sq + 2, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + Math.sin(t * 4 + i) * 3, 9 * sq + 1, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  for (const cp of lv.checkpoints || []) {
    const fy = (lv.floorAt?.(cp) ?? lv.floorY);
    const on = (ms.cp ?? 0) >= cp;
    ctx.fillStyle = '#3a2716';
    ctx.fillRect(cp - 3, fy - 110, 6, 110);
    ctx.fillStyle = on ? '#c8102e' : '#8a8a96';
    ctx.beginPath();
    ctx.moveTo(cp + 3, fy - 108);
    ctx.quadraticCurveTo(cp + 30, fy - 100 + Math.sin(t * 5) * 4, cp + 56, fy - 92);
    ctx.lineTo(cp + 3, fy - 72);
    ctx.fill();
    if (on) {
      ctx.fillStyle = '#f4f1e8';
      ctx.beginPath();
      ctx.arc(cp + 22, fy - 92, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const fx = ms.flag ?? lv.flagX;
  if (fx) {
    const fy = lv.floorY;
    ctx.fillStyle = '#4a4058';
    ctx.strokeStyle = '#1b1030';
    ctx.lineWidth = 5;
    ctx.fillRect(fx - 90, fy - 230, 50, 230);
    ctx.strokeRect(fx - 90, fy - 230, 50, 230);
    ctx.fillRect(fx + 40, fy - 230, 50, 230);
    ctx.strokeRect(fx + 40, fy - 230, 50, 230);
    ctx.beginPath();
    ctx.moveTo(fx - 100, fy - 230);
    ctx.lineTo(fx + 100, fy - 230);
    ctx.lineTo(fx + 100, fy - 270);
    ctx.lineTo(fx - 100, fy - 270);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let k = -100; k < 100; k += 40) {
      ctx.fillRect(k + fx, fy - 292, 24, 24);
      ctx.strokeRect(k + fx, fy - 292, 24, 24);
    }
    ctx.fillStyle = '#1d1430';
    ctx.beginPath();
    ctx.moveTo(fx - 40, fy);
    ctx.lineTo(fx - 40, fy - 150);
    ctx.arc(fx, fy - 150, 40, Math.PI, 0);
    ctx.lineTo(fx + 40, fy);
    ctx.fill();
    const glow = ctx.createLinearGradient(0, fy - 190, 0, fy);
    glow.addColorStop(0, 'rgba(255,220,120,0.9)');
    glow.addColorStop(1, 'rgba(255,160,60,0.4)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(fx - 30, fy);
    ctx.lineTo(fx - 30, fy - 150);
    ctx.arc(fx, fy - 150, 30, Math.PI, 0);
    ctx.lineTo(fx + 30, fy);
    ctx.fill();
    ctx.fillStyle = '#3a2716';
    ctx.fillRect(fx - 3, fy - 360, 6, 70);
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.moveTo(fx + 3, fy - 358);
    ctx.quadraticCurveTo(fx + 40, fy - 350 + Math.sin(t * 4) * 5, fx + 76, fy - 340);
    ctx.lineTo(fx + 3, fy - 318);
    ctx.fill();
    ctx.font = '900 22px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd27a';
    ctx.fillText('ÇIKIŞ', fx, fy - 240);
  }
}

export function drawModeWorld(ctx, g, t, layer) {
  if (layer === 'back' && g.level.width > W) drawAdventure(ctx, g, t);
  const ms = g.ms;
  if (layer === 'back' && ms.gate) {
    const gt = ms.gate;
    const k = gt.hp / gt.max;
    ctx.save();
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(gt.x - 14, gt.y - 14, gt.w + 28, gt.h + 14);
    ctx.fillStyle = '#7a5a34';
    ctx.beginPath();
    ctx.moveTo(gt.x, gt.y + gt.h);
    ctx.lineTo(gt.x, gt.y + 40);
    ctx.arc(gt.x + gt.w / 2, gt.y + 40, gt.w / 2, Math.PI, 0);
    ctx.lineTo(gt.x + gt.w, gt.y + gt.h);
    ctx.fill();
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 3;
    for (let px = gt.x + 16; px < gt.x + gt.w; px += 17) {
      ctx.beginPath();
      ctx.moveTo(px, gt.y + 14);
      ctx.lineTo(px, gt.y + gt.h);
      ctx.stroke();
    }
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(gt.x, gt.y + 50, gt.w, 8);
    ctx.fillRect(gt.x, gt.y + 92, gt.w, 8);
    if (k < 0.66) {
      ctx.strokeStyle = '#1a0e06';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gt.x + 30, gt.y + 30);
      ctx.lineTo(gt.x + 46, gt.y + 64);
      ctx.lineTo(gt.x + 36, gt.y + 96);
      if (k < 0.33) {
        ctx.moveTo(gt.x + 70, gt.y + 40);
        ctx.lineTo(gt.x + 58, gt.y + 80);
        ctx.lineTo(gt.x + 76, gt.y + 110);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  if (layer === 'front' && ms.rocks) {
    for (const k of ms.rocks) {
      const ty = k.ty;
      const warn = k.warn > 0 ? 1 - k.warn / 1.1 : 1;
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.35 * warn;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(k.x, ty, k.r * (0.6 + warn * 0.6), 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 12));
      ctx.strokeStyle = '#ff4040';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      if (k.warn > 0) continue;
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.rotate(k.y * 0.02);
      const rg = ctx.createRadialGradient(-6, -6, 3, 0, 0, k.r);
      rg.addColorStop(0, '#b0a698');
      rg.addColorStop(1, '#5c5248');
      ctx.fillStyle = rg;
      ctx.strokeStyle = '#2a241e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const r = k.r * (0.85 + ((i * 37) % 10) / 50);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  if (layer === 'front' && ms.crown) {
    const c = ms.crown;
    const bob = c.holder === null ? Math.sin(t * 4) * 3 : 0;
    if (c.holder === null) {
      const gl = ctx.createRadialGradient(c.x, c.y - 14, 2, c.x, c.y - 14, 40);
      gl.addColorStop(0, 'rgba(255,220,90,0.6)');
      gl.addColorStop(1, 'rgba(255,220,90,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(c.x - 40, c.y - 54, 80, 80);
    }
    const holder = g.players.find((p) => p.id === c.holder);
    const yy = holder ? holder.y - 30 - ((holder.scale || 1) - 1) * 30 : c.y - 2 + bob;
    drawHat(ctx, 'tac', c.x, yy, 0, 1);
  }
}

function drawHeart(ctx, x, y, full) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = full ? '#ff4d6d' : 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -1, -6, -9, 0, -4);
  ctx.bezierCurveTo(6, -9, 9, -1, 0, 5);
  ctx.fill();
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const OUT = '#1b1030';
const shadeHex = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

/** Kayan bölümlerde katman katman tepeler, ağaçlar ve uzak kale duvarı (kalın çizgili çizgi film tarzı). */
export function drawParallax(ctx, level, cam) {
  const th = THEMES[level.theme] || THEMES.gece;
  const night = th.stars > 20;
  const hill1 = th.dungeon ? '#3a2f4a' : th.snow ? '#cfdcef' : night ? '#3b3f6e' : '#7bb36a';
  const hill2 = th.dungeon ? '#2c2238' : th.snow ? '#a9bedb' : night ? '#2a2f55' : '#5a9a52';
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUT;
  ctx.lineJoin = 'round';
  const layer = (speed, base, amp, col, seed, trees) => {
    const off = cam * speed;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-10, H);
    for (let x = -10; x <= W + 10; x += 20) {
      const wx = x + off;
      ctx.lineTo(x, base - amp * (0.55 * Math.sin(wx / 230 + seed) + 0.45 * Math.sin(wx / 97 + seed * 2)));
    }
    ctx.lineTo(W + 10, H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (!trees) return;
    const step = 170;
    for (let k = Math.floor(off / step) - 1; k < (off + W) / step + 1; k++) {
      const r = Math.abs(Math.sin(k * 12.9898 + seed) * 43758.5453) % 1;
      if (r < 0.35) continue;
      const wx = k * step + r * 90;
      const x = wx - off;
      const y = base - amp * (0.55 * Math.sin(wx / 230 + seed) + 0.45 * Math.sin(wx / 97 + seed * 2)) + 4;
      const h = 60 + r * 50;
      ctx.fillStyle = '#5b3a24';
      ctx.fillRect(x - 6, y - h * 0.45, 12, h * 0.45);
      ctx.strokeRect(x - 6, y - h * 0.45, 12, h * 0.45);
      ctx.fillStyle = th.snow ? '#eef4fb' : th.dungeon ? '#4a3d5e' : shadeHex(night ? '#3e6a5a' : '#3f8f4a', 0.8 + r * 0.4);
      const blobs = [[0, 0.62, 0.32], [-0.2, 0.45, 0.24], [0.2, 0.45, 0.24]];
      ctx.lineWidth = 10;
      for (const pass of ['stroke', 'fill'])
        for (const [bx, by, br] of blobs) {
          ctx.beginPath();
          ctx.arc(x + bx * h, y - h * by, h * br, 0, Math.PI * 2);
          ctx[pass]();
        }
      ctx.lineWidth = 5;
    }
  };
  layer(0.12, 430, 50, hill2, 1.3, false);
  const off = cam * 0.3;
  ctx.fillStyle = shadeHex(th.wall || '#5a5470', 0.75);
  for (let k = Math.floor(off / 520) - 1; k < (off + W) / 520 + 1; k++) {
    const x = k * 520 - off + 140;
    ctx.fillRect(x, 330, 90, 160);
    ctx.strokeRect(x, 330, 90, 160);
    for (let m = 0; m < 3; m++) {
      ctx.fillRect(x + m * 33, 314, 24, 18);
      ctx.strokeRect(x + m * 33, 314, 24, 18);
    }
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.moveTo(x + 45, 314);
    ctx.lineTo(x + 45, 270);
    ctx.lineTo(x + 80, 282);
    ctx.lineTo(x + 45, 294);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shadeHex(th.wall || '#5a5470', 0.75);
  }
  layer(0.45, 520, 40, hill1, 4.1, true);
  ctx.fillStyle = 'rgba(10,6,25,0.18)';
  ctx.fillRect(0, 0, W, H);
}

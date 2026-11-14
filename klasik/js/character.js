export const COLORS = [
  { name: 'Bal', h: 31, s: 82 },
  { name: 'Mavi', h: 205, s: 75 },
  { name: 'Yeşil', h: 115, s: 55 },
  { name: 'Pembe', h: 330, s: 75 },
  { name: 'Mor', h: 268, s: 60 },
  { name: 'Limon', h: 52, s: 85 },
  { name: 'Turkuaz', h: 172, s: 60 },
  { name: 'Kar', h: 220, s: 10 },
  { name: 'Kızıl', h: 2, s: 78 },
  { name: 'Altın', h: 44, s: 95 },
  { name: 'Gece', h: 232, s: 45 },
  { name: 'Zümrüt', h: 150, s: 70 },
];

export const HATS = [
  { id: 'fes', name: 'Fes' },
  { id: 'migfer', name: 'Miğfer' },
  { id: 'sarik', name: 'Sarık' },
  { id: 'tac', name: 'Taç' },
  { id: 'bork', name: 'Yeniçeri Börkü' },
  { id: 'yok', name: 'Kel' },
];

export const STACHES = [
  { id: 'klasik', name: 'Klasik' },
  { id: 'ince', name: 'İnce' },
  { id: 'gur', name: 'Gür' },
  { id: 'pala', name: 'Pala' },
  { id: 'yok', name: 'Yok' },
];

export function palette(c) {
  const { h, s } = c;
  return {
    body: `hsl(${h} ${s}% 72%)`,
    bodyShade: `hsl(${h} ${s}% 60%)`,
    light: `hsl(${h} ${Math.min(100, s + 5)}% 84%)`,
    spike: `hsl(${h - 10} ${Math.round(s * 0.7)}% 34%)`,
    spikeLight: `hsl(${h - 6} ${Math.round(s * 0.7)}% 46%)`,
    outline: `hsl(${h - 10} ${Math.round(s * 0.6)}% 22%)`,
    ui: `hsl(${h} ${Math.max(s, 55)}% 58%)`,
  };
}

function petalPath(ctx, cx, cy, a, rBase, rTip, spread) {
  const a1 = a - spread;
  const a2 = a + spread;
  ctx.moveTo(cx + Math.cos(a1) * rBase, cy + Math.sin(a1) * rBase);
  ctx.quadraticCurveTo(
    cx + Math.cos(a - spread * 0.9) * rTip * 1.02,
    cy + Math.sin(a - spread * 0.9) * rTip * 1.02,
    cx + Math.cos(a) * rTip,
    cy + Math.sin(a) * rTip,
  );
  ctx.quadraticCurveTo(
    cx + Math.cos(a + spread * 0.9) * rTip * 1.02,
    cy + Math.sin(a + spread * 0.9) * rTip * 1.02,
    cx + Math.cos(a2) * rBase,
    cy + Math.sin(a2) * rBase,
  );
}

export function drawFez(ctx, x, y, rot, scale = 1, tassel = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  const g = ctx.createLinearGradient(-12, 0, 12, 0);
  g.addColorStop(0, '#8e1b14');
  g.addColorStop(0.45, '#d23a2a');
  g.addColorStop(1, '#9b2017');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a0d08';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12.5, 0);
  ctx.lineTo(-9.5, -24);
  ctx.lineTo(9.5, -24);
  ctx.lineTo(12.5, 0);
  ctx.quadraticCurveTo(0, 3.5, -12.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a150f';
  ctx.beginPath();
  ctx.ellipse(0, -24, 9.5, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.quadraticCurveTo(7 + tassel * 3, -22, 9 + tassel * 4, -12);
  ctx.stroke();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.ellipse(9 + tassel * 4, -10, 2.2, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function stachePath(ctx, s, y, wiggle, k) {
  ctx.moveTo(0, y - 2);
  ctx.bezierCurveTo(s * 5, y - 8 * k.t, s * 15 * k.l, y - 7 * k.t, s * 20 * k.l, y - 1 + wiggle * 0.5);
  ctx.bezierCurveTo(s * 23 * k.l, y + 2, s * 27 * k.l, y - 1 - k.c, s * 27.5 * k.l, y - 6 * k.t - k.c + wiggle);
  ctx.bezierCurveTo(s * 29 * k.l, y + 1, s * 24 * k.l, y + 6 * k.t, s * 17 * k.l, y + 5 * k.t);
  ctx.bezierCurveTo(s * 10, y + 5 * k.t, s * 4, y + 3 * k.t, 0, y + 2 * k.t);
  ctx.closePath();
}

const STACHE_SHAPE = {
  klasik: { l: 1, t: 1, c: 0 },
  ince: { l: 1.05, t: 0.45, c: 4 },
  gur: { l: 0.95, t: 1.75, c: -2 },
  pala: { l: 1.35, t: 1.15, c: 7 },
};

export function drawMustache(ctx, y, wiggle, style = 'klasik') {
  const k = STACHE_SHAPE[style];
  if (!k) return;
  ctx.fillStyle = '#1e1e22';
  ctx.strokeStyle = '#0c0c0e';
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    stachePath(ctx, s, y, wiggle, k);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(200,200,210,0.55)';
  ctx.lineWidth = 1.1;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 4, y - 2);
    ctx.quadraticCurveTo(s * 12 * k.l, y - 5 * k.t, s * 19 * k.l, y);
    ctx.stroke();
  }
}

function drawHelmet(ctx) {
  const g = ctx.createLinearGradient(-16, 0, 16, 0);
  g.addColorStop(0, '#6d7480');
  g.addColorStop(0.45, '#dfe5ec');
  g.addColorStop(1, '#7b828e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a2e36';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16, 2);
  ctx.bezierCurveTo(-17, -20, -6, -27, 0, -36);
  ctx.bezierCurveTo(6, -27, 17, -20, 16, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b08a2e';
  ctx.fillRect(-16, -2, 32, 5);
  ctx.strokeRect(-16, -2, 32, 5);
  ctx.fillStyle = '#9aa1ab';
  ctx.fillRect(-1.5, 1, 3, 12);
  ctx.strokeRect(-1.5, 1, 3, 12);
}

function drawTurban(ctx) {
  ctx.strokeStyle = '#8a7c5c';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#f3ecd8';
  ctx.beginPath();
  ctx.ellipse(0, -12, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,124,92,0.75)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, -12, 20 - i * 1.5, 15 - i * 3, -0.35 + i * 0.25, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
  }
  ctx.fillStyle = '#2f8f5b';
  ctx.beginPath();
  ctx.ellipse(0, -14, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e94b4b';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(7, -32, 3, -40);
  ctx.quadraticCurveTo(-1, -30, 0, -18);
  ctx.fill();
}

function drawCrown(ctx) {
  const g = ctx.createLinearGradient(0, -26, 0, 2);
  g.addColorStop(0, '#fff2a8');
  g.addColorStop(1, '#d19a1c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#7a4d08';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-15, 2);
  ctx.lineTo(-17, -20);
  ctx.lineTo(-8, -10);
  ctx.lineTo(0, -26);
  ctx.lineTo(8, -10);
  ctx.lineTo(17, -20);
  ctx.lineTo(15, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const [x, c] of [[-8, '#3fb6ff'], [0, '#ff4060'], [8, '#3fd07a']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, -4, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBork(ctx, tassel) {
  ctx.fillStyle = '#f4f1ea';
  ctx.strokeStyle = '#6e6655';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.lineTo(-11, -30);
  ctx.quadraticCurveTo(0, -36, 11, -30);
  ctx.lineTo(14, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, -30);
  ctx.bezierCurveTo(26 + tassel * 4, -34, 30 + tassel * 6, -10, 22 + tassel * 4, 10);
  ctx.lineTo(15, 8);
  ctx.bezierCurveTo(22, -8, 20, -22, 8, -26);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9a23a';
  ctx.fillRect(-15, -3, 30, 6);
  ctx.strokeRect(-15, -3, 30, 6);
  ctx.fillStyle = '#b8402c';
  ctx.fillRect(-3, -24, 6, 18);
}

export function drawHat(ctx, kind, x, y, rot, scale = 1, tassel = 0) {
  if (kind === 'yok') return;
  if (!kind || kind === 'fes') return drawFez(ctx, x, y, rot, scale, tassel);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  if (kind === 'migfer') drawHelmet(ctx);
  else if (kind === 'sarik') drawTurban(ctx);
  else if (kind === 'tac') drawCrown(ctx);
  else if (kind === 'bork') drawBork(ctx, tassel);
  ctx.restore();
}

/**
 * Draws the mascot with its feet centred at (x, y).
 * opts: color, facing, t, sx, sy, eyes ('normal'|'x'|'closed'), armsUp (0..1),
 * walk (phase), fez (bool), alpha, tilt
 */

/** Pelerin/atkı: hareketin tersine savrulan dalgalı kumaş. cape = { color, len, sway } */
function drawCape(ctx, cape, facing, t, OW, outline) {
  const back = -facing;
  const len = cape.len ?? 1;
  const sway = cape.sway ?? 0;
  const tipX = back * (18 + 26 * len + sway * 34 * len);
  const tipY = -8 - Math.abs(sway) * 14 * len + Math.sin(t * 7) * 3;
  const wave = Math.sin(t * 9) * 4 * len;
  ctx.fillStyle = cape.color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = OW * 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, -50);
  ctx.quadraticCurveTo(tipX * 0.6, -50 + wave, tipX, tipY - 8 * len);
  ctx.lineTo(tipX + back * 6, tipY + 6 * len);
  ctx.quadraticCurveTo(tipX * 0.5, -20 - wave, 14, -46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawCharacter(ctx, x, y, opts) {
  const pal = opts.pal || palette(opts.color || COLORS[0]);
  const facing = opts.facing ?? 1;
  const sx = opts.sx ?? 1;
  const sy = opts.sy ?? 1;
  const t = opts.t ?? 0;
  const armsUp = opts.armsUp ?? 0;
  const walk = opts.walk ?? 0;
  const look = facing * 3;
  const OW = opts.ow ?? 1;

  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(x, y);
  if (opts.tilt) ctx.rotate(opts.tilt);
  if (opts.spin) {
    ctx.translate(0, -33 * sy);
    ctx.rotate(opts.spin);
    ctx.translate(0, 33 * sy);
  }
  ctx.scale(sx, sy);

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  if (opts.shadow !== false) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.cape) drawCape(ctx, opts.cape, facing, t, OW, pal.outline);

  const cy = -33;
  const spikes = 12;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    const a = Math.PI * 0.82 + (i / (spikes - 1)) * Math.PI * 1.36 + Math.sin(t * 2 + i) * 0.02;
    petalPath(ctx, 0, cy, a, 24, 47 + (i % 2) * 3, 0.24);
  }
  const sg = ctx.createRadialGradient(0, cy, 20, 0, cy, 50);
  sg.addColorStop(0, pal.spikeLight);
  sg.addColorStop(1, pal.spike);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = OW * 1.6;
  ctx.stroke();

  for (const s of [-1, 1]) {
    ctx.fillStyle = pal.body;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = OW * 1.4;
    ctx.beginPath();
    ctx.arc(s * 17 + look * 0.3, -58, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pal.light;
    ctx.beginPath();
    ctx.arc(s * 17 + look * 0.3, -58, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const bg = ctx.createRadialGradient(-8 + look, -42, 6, 0, -30, 36);
  bg.addColorStop(0, pal.light);
  bg.addColorStop(0.55, pal.body);
  bg.addColorStop(1, pal.bodyShade);
  ctx.fillStyle = bg;
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = OW * 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.bezierCurveTo(20, -62, 28, -46, 29, -30);
  ctx.bezierCurveTo(30, -12, 22, -3, 0, -3);
  ctx.bezierCurveTo(-22, -3, -30, -12, -29, -30);
  ctx.bezierCurveTo(-28, -46, -20, -62, 0, -62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const armA = -0.5 - armsUp * 1.6;
  for (const s of [-1, 1]) {
    ctx.save();
    const k = s > 0 ? 1 : 0;
    ctx.translate(s * 25 + (opts.armOff?.[k] || 0), -30);
    ctx.rotate(opts.arms ? opts.arms[k] : s * (armA + Math.sin(t * 6) * 0.05 * (1 - armsUp)) * -1);
    ctx.fillStyle = pal.body;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = OW * 1.4;
    ctx.beginPath();
    ctx.ellipse(s * 3, -6, 7, 10.5, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  for (const s of [-1, 1]) {
    const ph = walk + (s > 0 ? Math.PI : 0);
    const lift = opts.feet ? opts.feet[s > 0 ? 1 : 0] : Math.max(0, Math.sin(ph)) * 4;
    const fx = (opts.stride || 0) * Math.cos(ph);
    ctx.fillStyle = pal.light;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = OW * 1.5;
    ctx.beginPath();
    ctx.ellipse(s * 14 + fx, -7 - lift, 11.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,120,120,0.32)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 17 + look, -36, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const eyes = opts.eyes || 'normal';
  ctx.fillStyle = '#111';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    const ex = s * 9 + look;
    const ey = -42;
    if (eyes === 'x') {
      ctx.beginPath();
      ctx.moveTo(ex - 3, ey - 3);
      ctx.lineTo(ex + 3, ey + 3);
      ctx.moveTo(ex + 3, ey - 3);
      ctx.lineTo(ex - 3, ey + 3);
      ctx.stroke();
    } else if (eyes === 'closed') {
      ctx.beginPath();
      ctx.moveTo(ex - 3, ey);
      ctx.quadraticCurveTo(ex, ey + 2.5, ex + 3, ey);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, ey, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + 0.9, ey - 1, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
    }
  }

  if (eyes === 'angry') {
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 14 + look, -51);
      ctx.lineTo(s * 4 + look, -47);
      ctx.stroke();
    }
  }

  drawMustache(ctx, -32, Math.sin(t * 5) * 0.8 + (opts.mustacheWiggle || 0), opts.stache);

  if (opts.fez !== false) {
    drawHat(ctx, opts.hat, look * 0.4, -58, -0.08 * facing + (opts.fezTilt || 0), 1, Math.sin(t * 4) * 0.5 - facing * 0.3);
  }

  ctx.restore();
}

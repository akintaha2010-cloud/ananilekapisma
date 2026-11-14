export const COLORS = [
  { name: 'Bal', h: 31, s: 82 },
  { name: 'Mavi', h: 205, s: 75 },
  { name: 'Yeşil', h: 115, s: 55 },
  { name: 'Pembe', h: 330, s: 75 },
  { name: 'Mor', h: 268, s: 60 },
  { name: 'Limon', h: 52, s: 85 },
  { name: 'Turkuaz', h: 172, s: 60 },
  { name: 'Kar', h: 220, s: 10 },
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

function drawMustache(ctx, y, wiggle) {
  ctx.fillStyle = '#1e1e22';
  ctx.strokeStyle = '#0c0c0e';
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, y - 2);
    ctx.bezierCurveTo(s * 5, y - 8, s * 15, y - 7, s * 20, y - 1 + wiggle * 0.5);
    ctx.bezierCurveTo(s * 23, y + 2, s * 27, y - 1, s * 27.5, y - 6 + wiggle);
    ctx.bezierCurveTo(s * 29, y + 1, s * 24, y + 6, s * 17, y + 5);
    ctx.bezierCurveTo(s * 10, y + 5, s * 4, y + 3, 0, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(200,200,210,0.55)';
  ctx.lineWidth = 1.1;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 4, y - 2);
    ctx.quadraticCurveTo(s * 12, y - 5, s * 19, y);
    ctx.stroke();
  }
}

/**
 * Draws the mascot with its feet centred at (x, y).
 * opts: color, facing, t, sx, sy, eyes ('normal'|'x'|'closed'), armsUp (0..1),
 * walk (phase), fez (bool), alpha, tilt
 */
export function drawCharacter(ctx, x, y, opts) {
  const pal = opts.pal || palette(opts.color || COLORS[0]);
  const facing = opts.facing ?? 1;
  const sx = opts.sx ?? 1;
  const sy = opts.sy ?? 1;
  const t = opts.t ?? 0;
  const armsUp = opts.armsUp ?? 0;
  const walk = opts.walk ?? 0;
  const look = facing * 3;

  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(x, y);
  if (opts.tilt) ctx.rotate(opts.tilt);
  ctx.scale(sx, sy);

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  if (opts.shadow !== false) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

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
  ctx.lineWidth = 1.6;
  ctx.stroke();

  for (const s of [-1, 1]) {
    ctx.fillStyle = pal.body;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 1.4;
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
  ctx.lineWidth = 1.8;
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
    ctx.translate(s * 25, -30);
    ctx.rotate(s * (armA + Math.sin(t * 6) * 0.05 * (1 - armsUp)) * -1);
    ctx.fillStyle = pal.body;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(s * 3, -6, 7, 10.5, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  for (const s of [-1, 1]) {
    const lift = Math.max(0, Math.sin(walk + (s > 0 ? Math.PI : 0))) * 4;
    ctx.fillStyle = pal.light;
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(s * 14, -7 - lift, 11.5, 8.5, 0, 0, Math.PI * 2);
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

  drawMustache(ctx, -32 + 0, Math.sin(t * 5) * 0.8 + (opts.mustacheWiggle || 0));

  if (opts.fez !== false) {
    drawFez(ctx, look * 0.4, -58, -0.08 * facing + (opts.fezTilt || 0), 1, Math.sin(t * 4) * 0.5 - facing * 0.3);
  }

  ctx.restore();
}

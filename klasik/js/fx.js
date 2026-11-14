/* Sinematik efektler: vuruş patlamaları, enerji dalgaları, dinamik ışık, vinyet. Oyun mekaniğine dokunmaz. */
import { WORLD } from './physics.js';

const W = WORLD.w;
const H = WORLD.h;
const AMBIENT = { gece: 0.42, zindan: 0.55, kis: 0.22, gunduz: 0.04, safak: 0.18, ates: 0.32 };

export function createFx() {
  return { bursts: [], waves: [], lights: [] };
}

function sparks(parts, x, y, n, color, speed, life = 0.35) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.45 + Math.random() * 0.8);
    parts.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, size: 2 + Math.random() * 2.5, color, rot: 0, vr: 0, g: 500 });
  }
}

/** Darbe: beyaz çekirdekli ışık patlaması, kıvılcımlar, halka ve kısa süreli ışık. */
export function impact(fx, parts, x, y, color = '#ffffff', power = 1) {
  fx.bursts.push({ x, y, r: 34 * power, life: 0.16, max: 0.16, color });
  fx.waves.push({ x, y, r0: 10, r1: 90 * power, life: 0.28, max: 0.28, color, flat: 1, w: 7 * power });
  fx.lights.push({ x, y, r: 180 * power, life: 0.25, max: 0.25, color });
  sparks(parts, x, y, Math.round(10 * power), color, 520 * power);
  sparks(parts, x, y, Math.round(5 * power), '#ffffff', 380 * power, 0.25);
}

/** Yere çakılma enerji dalgası: iki katmanlı yer dalgası, toz, moloz ve ışık. */
export function shockwave(fx, parts, x, y, r, color = '#9fd8ff') {
  fx.waves.push({ x, y, r0: 12, r1: r * 1.15, life: 0.42, max: 0.42, color, flat: 0.28, w: 12 });
  fx.waves.push({ x, y, r0: 6, r1: r * 0.7, life: 0.3, max: 0.3, color: '#ffffff', flat: 0.28, w: 6 });
  fx.waves.push({ x, y: y - 30, r0: 8, r1: r * 0.55, life: 0.25, max: 0.25, color, flat: 1, w: 5 });
  fx.bursts.push({ x, y: y - 10, r: 60, life: 0.2, max: 0.2, color });
  fx.lights.push({ x, y: y - 20, r: r * 1.6, life: 0.4, max: 0.4, color });
  for (let i = 0; i < 14; i++) {
    const dir = i % 2 ? 1 : -1;
    parts.push({ kind: 'debris', x: x + dir * Math.random() * 30, y: y - 4, vx: dir * (120 + Math.random() * 380), vy: -200 - Math.random() * 420, life: 0.7, max: 0.7, size: 3 + Math.random() * 4, color: '#8f8296', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 20, g: 1500 });
  }
  sparks(parts, x, y - 8, 12, color, 600, 0.4);
}

export function glow(fx, x, y, r, color, life = 0.4) {
  fx.lights.push({ x, y, r, life, max: life, color });
}

export function updateFx(fx, dt) {
  for (const k of ['bursts', 'waves', 'lights']) fx[k] = fx[k].filter((q) => (q.life -= dt) > 0);
}

/** Dünya koordinatında, toplamalı (lighter) çizilen patlama ve dalgalar. */
export function drawFx(ctx, fx) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const b of fx.bursts) {
    const k = b.life / b.max;
    const r = b.r * (1.3 - k * 0.5);
    const gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
    gr.addColorStop(0, `rgba(255,255,255,${k})`);
    gr.addColorStop(0.35, b.color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = k;
    ctx.fillStyle = gr;
    ctx.fillRect(b.x - r, b.y - r, r * 2, r * 2);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4 + i * 0.2);
      ctx.fillRect(-r * 1.2 * k, -1.5, r * 2.4 * k, 3);
    }
    ctx.restore();
  }
  for (const w of fx.waves) {
    const k = 1 - w.life / w.max;
    const r = w.r0 + (w.r1 - w.r0) * (1 - (1 - k) * (1 - k));
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.strokeStyle = w.color;
    ctx.lineWidth = w.w * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, r, r * w.flat, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

let lightCanvas = null;
let vignette = null;

/** Ortam karanlığı + meşale/oyuncu/efekt ışıkları. cam: yatay kamera kayması. */
export function drawLighting(ctx, g, fx, cam, t) {
  const amb = AMBIENT[g.level.theme] ?? 0.2;
  const s = 0.5;
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
    lightCanvas.width = W * s;
    lightCanvas.height = H * s;
  }
  const lc = lightCanvas.getContext('2d');
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.globalCompositeOperation = 'source-over';
  lc.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
  const warm = [];
  if (amb > 0.05) {
    lc.fillStyle = `rgba(12,6,34,${amb})`;
    lc.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
    lc.globalCompositeOperation = 'destination-out';
    lc.setTransform(s, 0, 0, s, -cam * s, 0);
    const hole = (x, y, r, a = 1) => {
      if (x + r < cam || x - r > cam + W) return;
      const gr = lc.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(0,0,0,${a})`);
      gr.addColorStop(0.5, `rgba(0,0,0,${a * 0.6})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = gr;
      lc.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (const [x, y] of g.level.torches) {
      const fl = 1 + Math.sin(t * 11 + x) * 0.06 + Math.sin(t * 5.3 + x * 0.7) * 0.05;
      hole(x, y - 10, 210 * fl);
      warm.push([x, y - 10, 120 * fl]);
    }
    for (const p of g.players) if (p.state !== 'out') hole(p.x + p.w / 2, p.y + p.h / 2, p.team === 'B' ? 90 : 140, 0.7);
    for (const l of fx.lights) hole(l.x, l.y, l.r, l.life / l.max);
    ctx.drawImage(lightCanvas, cam, 0, W, H);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r] of warm) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,150,60,0.22)');
    gr.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const l of fx.lights) {
    const k = l.life / l.max;
    const r = l.r * 0.6;
    const gr = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    gr.addColorStop(0, l.color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.35 * k;
    ctx.fillStyle = gr;
    ctx.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  }
  ctx.restore();
}

export function drawVignette(ctx) {
  if (!vignette) {
    vignette = document.createElement('canvas');
    vignette.width = W / 2;
    vignette.height = H / 2;
    const v = vignette.getContext('2d');
    const gr = v.createRadialGradient(W / 4, H / 4, H * 0.22, W / 4, H / 4, W * 0.36);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(8,4,20,0.42)');
    v.fillStyle = gr;
    v.fillRect(0, 0, W / 2, H / 2);
  }
  ctx.drawImage(vignette, 0, 0, W, H);
}

/* Konuşmalı ara sahneler: aktörler sahneye girer, konuşma balonu harf harf yazılır. */
import { WORLD } from './physics.js';
import { drawCharacter, palette, COLORS } from './character.js';
import { BOSS_COLOR } from './modes.js';
import { roundRect } from './render.js';

const W = WORLD.w;
const H = WORLD.h;
const GROUND = 560;
const INK = '#1b1030';

export const CAST = {
  hero: { name: 'Sen', kind: 'hero', color: '#ffd27a' },
  orfe: { name: 'Orfe', kind: 'dino', color: '#ff6b7f' },
  pasa: { name: 'Kara Paşa', kind: 'villain', color: '#c79bff' },
};

export function createCutscene(scene, look, heroName) {
  const actors = {};
  for (const [id, x] of Object.entries(scene.start || {})) actors[id] = { id, x, tx: x, facing: x < W / 2 ? 1 : -1, hop: 0 };
  return { scene, look, heroName, i: -1, chars: 0, t: 0, actors, done: false, line: null };
}

function applyBeat(cs) {
  const b = cs.scene.beats[cs.i];
  cs.line = b;
  cs.chars = 0;
  for (const [id, x] of Object.entries(b.move || {})) {
    const a = cs.actors[id] || (cs.actors[id] = { id, x: x < W / 2 ? -160 : W + 160, tx: x, facing: 1, hop: 0 });
    a.tx = x;
  }
  for (const id of b.leave || []) if (cs.actors[id]) cs.actors[id].tx = cs.actors[id].x < W / 2 ? -200 : W + 200;
  if (cs.actors[b.who]) cs.actors[b.who].hop = 0.35;
}

/** Returns true when the scene has finished. */
export function advanceCutscene(cs) {
  if (cs.line && cs.chars < cs.line.say.length) {
    cs.chars = cs.line.say.length;
    return false;
  }
  cs.i++;
  if (cs.i >= cs.scene.beats.length) {
    cs.done = true;
    return true;
  }
  applyBeat(cs);
  return false;
}

export function updateCutscene(cs, dt) {
  cs.t += dt;
  if (cs.i < 0) advanceCutscene(cs);
  if (cs.line) cs.chars = Math.min(cs.line.say.length, cs.chars + dt * 42);
  for (const a of Object.values(cs.actors)) {
    const d = a.tx - a.x;
    if (Math.abs(d) > 2) {
      a.facing = Math.sign(d);
      a.x += Math.sign(d) * Math.min(Math.abs(d), 420 * dt);
      a.walk = (a.walk || 0) + dt * 12;
    } else a.walk = 0;
    a.hop = Math.max(0, a.hop - dt);
  }
  const speaker = cs.actors[cs.line?.who];
  if (speaker && Math.abs(speaker.tx - speaker.x) < 3) {
    const others = Object.values(cs.actors).filter((o) => o !== speaker);
    if (others.length) speaker.facing = others[0].x > speaker.x ? 1 : -1;
  }
}

export function drawDino(ctx, x, y, t, facing = 1, s = 1, talk = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  const bob = Math.sin(t * 4) * 2;
  const body = '#ec3750';
  const belly = '#ffb3bd';
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-40, -50 + bob);
  ctx.quadraticCurveTo(-95, -40, -110, -8 + Math.sin(t * 3) * 6);
  ctx.quadraticCurveTo(-70, -22, -30, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const lx of [-22, 18]) {
    ctx.beginPath();
    ctx.roundRect(lx - 11, -30, 22, 30, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, -62 + bob, 48, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(12, -55 + bob, 26, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(30, -122 + bob, 40, 32, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(58, -108 + bob + talk * 6, 22, 12 + talk * 6, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(-30 + k * 18, -100 + bob - k * 8);
    ctx.lineTo(-20 + k * 18, -122 + bob - k * 8);
    ctx.lineTo(-10 + k * 18, -98 + bob - k * 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(40, -130 + bob, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(44, -129 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(38, -66 + bob, 9, 14, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function wrap(ctx, text, maxW) {
  const lines = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const tryL = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(tryL).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = tryL;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function drawCutscene(ctx, cs, bg) {
  const t = cs.t;
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  const fade = ctx.createLinearGradient(0, 380, 0, H);
  fade.addColorStop(0, 'rgba(10,6,25,0)');
  fade.addColorStop(1, 'rgba(10,6,25,0.75)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(W / 2, GROUND + 6, 700, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  const order = Object.values(cs.actors).sort((a, b) => (a.id === 'pasa') - (b.id === 'pasa'));
  for (const a of order) {
    const talking = cs.line?.who === a.id && cs.chars < cs.line.say.length;
    const hop = Math.sin((a.hop / 0.35) * Math.PI) * 26 + Math.abs(Math.sin(a.walk || 0)) * 10 * (a.walk ? 1 : 0);
    const mouth = talking ? Math.abs(Math.sin(t * 18)) : 0;
    const kind = CAST[a.id]?.kind;
    if (kind === 'dino') drawDino(ctx, a.x, GROUND - hop, t, a.facing, 1.25, mouth);
    else {
      const villain = kind === 'villain';
      const look = villain ? { color: BOSS_COLOR, hat: 'sarik', stache: 'pala' } : { ...cs.look, color: COLORS[cs.look.color] || COLORS[0] };
      const s = villain ? 2.3 : 1.7;
      drawCharacter(ctx, a.x, GROUND - hop, { ...look, t, facing: a.facing, armsUp: talking ? 0.4 + mouth * 0.4 : hop > 8 ? 0.6 : 0, eyes: villain && talking ? 'angry' : 'normal', sx: s, sy: s * (1 - mouth * 0.03) });
    }
  }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, 54);
  ctx.fillRect(0, H - 34, W, 34);

  const b = cs.line;
  if (!b) return;
  const who = CAST[b.who] || { name: b.who, color: '#fff' };
  const name = b.who === 'hero' ? cs.heroName || who.name : who.name;
  const bx = 150;
  const by = 70;
  const bw = W - 300;
  const bh = 150;
  ctx.fillStyle = 'rgba(255,250,240,0.97)';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  roundRect(ctx, bx, by, bw, bh, 22);
  ctx.fill();
  ctx.stroke();
  const sp = cs.actors[b.who];
  if (sp) {
    const tx = Math.max(bx + 40, Math.min(bx + bw - 40, sp.x));
    ctx.beginPath();
    ctx.moveTo(tx - 18, by + bh - 3);
    ctx.lineTo(tx + (sp.x > tx ? 30 : -10), by + bh + 34);
    ctx.lineTo(tx + 18, by + bh - 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(tx - 15, by + bh - 6, 30, 6);
  }
  ctx.font = '900 24px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const nw = ctx.measureText(name).width + 34;
  ctx.fillStyle = who.color;
  roundRect(ctx, bx + 24, by - 20, nw, 38, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillText(name, bx + 41, by + 8);
  ctx.font = '800 26px "Trebuchet MS", system-ui, sans-serif';
  const shown = b.say.slice(0, Math.floor(cs.chars));
  wrap(ctx, shown, bw - 60).forEach((ln, k) => ctx.fillText(ln, bx + 30, by + 58 + k * 34));
  ctx.font = '800 16px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${cs.i + 1}/${cs.scene.beats.length}   Boşluk / tıkla: devam   Esc: geç`, 20, H - 11);
  if (cs.chars >= b.say.length && Math.sin(t * 8) > 0) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(bx + bw - 44, by + bh - 30);
    ctx.lineTo(bx + bw - 24, by + bh - 30);
    ctx.lineTo(bx + bw - 34, by + bh - 18);
    ctx.fill();
  }
}

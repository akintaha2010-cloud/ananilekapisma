import { P, WORLD, createPlayer, stepPlayer, resolvePlayers, applyShockwave, centerX } from './physics.js';
import { createLevel, updateLevel } from './level.js';
import { COLORS, palette, drawCharacter } from './character.js';
import { KEYMAPS, createKeyboard, readKeys, readGamepad, mergeInputs, withEdges, emptyInput, createTouch } from './input.js';
import { createBrain, aiInput, DIFFICULTY } from './ai.js';
import * as R from './render.js';
import { initAudio, sfx, setMuted, isMuted, startMusic } from './audio.js';

const STEP = 1 / 120;
const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const stage = $('#stage');

const kb = createKeyboard();
const touch = createTouch($('#touch'));
const isTouch = matchMedia('(pointer: coarse)').matches;

const SAVE_KEY = 'kale-kapismasi-ayarlar';
const DIFF_ORDER = ['kolay', 'orta', 'zor'];
const settings = loadSettings();

let mode = 'menu';
let match = null;
let demo = false;
let last = performance.now();
let acc = 0;
let time = 0;

function loadSettings() {
  const fallback = {
    lives: 3,
    slots: [
      { type: 'human', color: 0, diff: 'orta' },
      { type: 'cpu', color: 1, diff: 'orta' },
      { type: 'cpu', color: 3, diff: 'orta' },
      { type: 'off', color: 2, diff: 'orta' },
    ],
  };
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && Array.isArray(s.slots) && s.slots.length === 4) return s;
  } catch {
    /* ignore */
  }
  return fallback;
}

function saveSettings() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function resize() {
  const s = Math.min(window.innerWidth / WORLD.w, window.innerHeight / WORLD.h);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  const dpr = Math.min(2, (window.devicePixelRatio || 1) * s);
  canvas.width = Math.round(WORLD.w * dpr);
  canvas.height = Math.round(WORLD.h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function startMatch(config, isDemo = false) {
  demo = isDemo;
  const level = createLevel();
  const active = config.slots.map((s, i) => ({ ...s, slot: i })).filter((s) => s.type !== 'off');
  let humanIdx = 0;
  const players = active.map((s, k) => {
    const sp = level.spawns[k];
    const p = createPlayer(k, sp.x - P.w / 2, sp.y - P.h, { lives: config.lives });
    p.facing = sp.x < WORLD.w / 2 ? 1 : -1;
    p.anim = { sy: 1, vsy: 0, walk: 0 };
    return p;
  });
  let cpuNo = 0;
  const infos = active.map((s) => {
    const human = s.type === 'human';
    const info = {
      pal: palette(COLORS[s.color]),
      colorName: COLORS[s.color].name,
      tag: human ? `P${s.slot + 1}` : 'CPU',
      name: human ? `Oyuncu ${s.slot + 1}` : `CPU ${++cpuNo} (${DIFFICULTY[s.diff].label})`,
      maxLives: config.lives,
      slot: s.slot,
      human,
      pad: human ? humanIdx : -1,
      touch: human && humanIdx === 0,
    };
    if (human) humanIdx++;
    return info;
  });
  match = {
    level,
    bg: R.createBackground(level),
    players,
    infos,
    brains: active.map((s) => (s.type === 'cpu' ? createBrain(s.diff) : null)),
    prev: players.map(() => emptyInput()),
    parts: R.createParticles(),
    countdown: isDemo ? 0 : 3.2,
    shake: 0,
    freeze: 0,
    overT: 0,
    finished: false,
    config,
  };
  $('#touch').classList.toggle('hidden', !(isTouch && !isDemo && infos.some((i) => i.touch)));
}

function humanInput(info) {
  const map = KEYMAPS[info.slot];
  let inp = mergeInputs(readKeys(kb, map), readGamepad(info.pad));
  if (info.touch) inp = mergeInputs(inp, touch.read());
  return inp;
}

function say(text, x, y, color = '#ffe14d', size = 30) {
  match.parts.push({ kind: 'text', text, x, y, vx: 0, vy: -70, g: 0, life: 0.9, max: 0.9, size, color, rot: 0, vr: 0 });
}

function play(name) {
  if (!demo) sfx[name]?.();
}

function respawn(p) {
  const xs = [300, 470, 640, 810, 980];
  const others = match.players.filter((o) => o !== p && o.state !== 'out');
  let best = xs[0];
  let bestD = -1;
  for (const x of xs) {
    const d = Math.min(...others.map((o) => Math.abs(centerX(o) - x)), 9999);
    if (d > bestD) {
      bestD = d;
      best = x;
    }
  }
  p.x = best - p.w / 2;
  p.y = -90;
  p.prevX = p.x;
  p.prevY = p.y;
  p.vx = 0;
  p.vy = 200;
  p.state = 'normal';
  p.invuln = P.invulnAfterRespawn;
  p.splashed = false;
  p.airJumps = 1;
  p.grounded = false;
  p.platform = null;
}

function handleEvents(events) {
  const { parts } = match;
  for (const e of events) {
    const p = e.p;
    const cx = centerX(p);
    const feet = p.y + p.h;
    const info = match.infos[p.id];
    switch (e.type) {
      case 'jump':
        play('jump');
        p.anim.sy = 1.25;
        R.spawn(parts, 'dust', cx, feet, 6, { angle: -Math.PI / 2, spread: 2.4, speed: 120, color: 'rgba(230,220,240,0.7)', g: -50, life: 0.35 });
        break;
      case 'doublejump':
        play('doublejump');
        p.anim.sy = 1.2;
        parts.push({ kind: 'ring', x: cx, y: feet, vx: 0, vy: 0, g: 0, life: 0.35, max: 0.35, size: 34, color: info.pal.ui, rot: 0, vr: 0 });
        break;
      case 'land':
        if (e.speed > 450) {
          play('land');
          R.spawn(parts, 'dust', cx, feet, 5, { angle: -Math.PI / 2, spread: 3, speed: 110, color: 'rgba(230,220,240,0.6)', g: -40, life: 0.3 });
        }
        p.anim.sy = 1 - Math.min(0.32, e.speed / 2600);
        break;
      case 'pound':
        play('pound');
        p.anim.sy = 1.25;
        break;
      case 'poundland':
        play('poundland');
        match.shake = Math.max(match.shake, 9);
        p.anim.sy = 0.6;
        R.spawn(parts, 'dust', cx, feet, 18, { angle: -Math.PI / 2, spread: 3.2, speed: 260, color: 'rgba(230,220,240,0.75)', g: 100, life: 0.5, size: 7 });
        parts.push({ kind: 'ring', x: cx, y: feet, vx: 0, vy: 0, g: 0, life: 0.4, max: 0.4, size: P.shockRadius, color: '#fff', rot: 0, vr: 0 });
        applyShockwave(p, match.players, events);
        break;
      case 'shocked':
        say('PAT!', centerX(e.victim), e.victim.y - 10, '#ffffff', 24);
        break;
      case 'stomp': {
        const v = e.victim;
        play('stomp');
        match.shake = Math.max(match.shake, e.pound ? 14 : 9);
        match.freeze = 0.07;
        p.anim.sy = 0.7;
        R.spawn(parts, 'star', centerX(v), v.y + 20, 9, { angle: -Math.PI / 2, spread: 3, speed: 380, color: '#ffe14d', life: 0.7, size: 8 });
        R.spawn(parts, 'fez', centerX(v), v.y, 1, { angle: -Math.PI / 2, spread: 1.2, speed: 520, life: 1.3, g: 1400 });
        say(e.pound ? 'ÇAKILDI!' : 'EZİLDİ!', centerX(v), v.y - 30, info.pal.ui, 34);
        break;
      }
      case 'bonk':
        play('bonk');
        break;
      case 'shove':
        play('shove');
        R.spawn(parts, 'dust', cx - p.facing * 20, feet - 10, 5, { angle: p.facing > 0 ? Math.PI : 0, spread: 0.8, speed: 160, color: 'rgba(255,255,255,0.5)', g: 0, life: 0.25 });
        break;
      case 'shoved':
      case 'clash':
        play('shoved');
        match.shake = Math.max(match.shake, 6);
        R.spawn(parts, 'star', (cx + centerX(e.victim)) / 2, p.y + 25, 5, { speed: 260, color: '#ffffff', life: 0.4, size: 6, g: 300 });
        if (e.type === 'shoved') say('HOP!', centerX(e.victim), e.victim.y - 14, info.pal.ui, 26);
        break;
      case 'splash':
        play('splash');
        R.spawn(parts, 'drop', cx, WORLD.waterY, 22, { angle: -Math.PI / 2, spread: 1.4, speed: 520, color: '#9fe3ff', life: 0.8, g: 1300, size: 5 });
        say('HENDEĞE!', Math.min(Math.max(cx, 90), WORLD.w - 90), WORLD.waterY - 60, '#9fe3ff', 28);
        break;
      case 'fall':
        if (p.state !== 'squashed') p.lives -= 1;
        p.falls += 1;
        if (p.lives > 0) respawn(p);
        else {
          p.state = 'out';
          play('out');
        }
        break;
      case 'unsquash':
        play('unsquash');
        p.anim.sy = 1.3;
        break;
      case 'out':
        play('out');
        R.spawn(parts, 'ghost', cx, feet, 1, { angle: -Math.PI / 2, spread: 0, speed: 90, g: -40, life: 2 });
        say('ELENDİ', cx, p.y - 20, '#ff8fa3', 28);
        break;
      default:
        break;
    }
  }
}

function step(dt) {
  const m = match;
  if (m.freeze > 0) {
    m.freeze -= dt;
    return;
  }
  if (m.countdown > 0) {
    const before = Math.ceil(m.countdown);
    m.countdown -= dt;
    if (Math.ceil(m.countdown) !== before && !demo) (m.countdown <= 0 ? sfx.start : sfx.click)();
  }
  updateLevel(m.level, dt);
  const inputs = m.players.map((p, k) => {
    let cur = emptyInput();
    if (m.countdown <= 0 && !m.finished) {
      cur = m.brains[k] ? aiInput(p, m.brains[k], m.players, m.level, dt) : humanInput(m.infos[k]);
    }
    const e = withEdges(cur, m.prev[k]);
    m.prev[k] = cur;
    return e;
  });
  const events = [];
  m.players.forEach((p, k) => stepPlayer(p, inputs[k], dt, m.level, events));
  resolvePlayers(m.players, inputs, events);
  handleEvents(events);

  for (const p of m.players) {
    const a = p.anim;
    a.vsy += (-(a.sy - 1) * 320 - a.vsy * 16) * dt;
    a.sy += a.vsy * dt;
    if (p.grounded) a.walk += Math.abs(p.vx) * dt * 0.05;
  }
  R.updateParticles(m.parts, dt);
  m.shake = Math.max(0, m.shake - dt * 40);

  const alive = m.players.filter((p) => p.state !== 'out');
  if (!m.finished && alive.length <= 1) {
    m.finished = true;
    m.overT = demo ? 2.5 : 1.3;
    m.winner = alive[0] || null;
  }
  if (m.finished) {
    m.overT -= dt;
    if (m.winner && Math.random() < 0.5) {
      const c = ['#ff4d6d', '#ffd27a', '#7ae0ff', '#9dff7a', '#d29bff'][Math.floor(Math.random() * 5)];
      R.spawn(m.parts, 'confetti', Math.random() * WORLD.w, -10, 1, { angle: Math.PI / 2, spread: 0.6, speed: 120, color: c, g: 160, life: 3, size: 10 });
    }
    if (m.overT <= 0 && !m.shown) {
      m.shown = true;
      if (demo) startDemo();
      else showOver();
    }
  }
}

function render() {
  const m = match;
  ctx.save();
  if (m.shake > 0) ctx.translate((Math.random() - 0.5) * m.shake, (Math.random() - 0.5) * m.shake);
  ctx.drawImage(m.bg, 0, 0, WORLD.w, WORLD.h);
  R.drawTorches(ctx, time);
  for (const pl of m.level.platforms) R.drawPlatform(ctx, pl, time);
  const order = m.players.map((p, i) => i).sort((a, b) => (m.players[a].state === 'squashed' ? -1 : 0) - (m.players[b].state === 'squashed' ? -1 : 0));
  for (const i of order) R.drawPlayer(ctx, m.players[i], m.infos[i], time);
  R.drawParticles(ctx, m.parts);
  R.drawWater(ctx, time);
  ctx.restore();
  if (!demo) R.drawHUD(ctx, m.players, m.infos);
  if (m.countdown > 0 && !demo) {
    const n = Math.ceil(m.countdown);
    const k = m.countdown - Math.floor(m.countdown);
    ctx.save();
    ctx.translate(WORLD.w / 2, WORLD.h / 2 - 40);
    const s = 1 + (1 - k) * 0.4;
    ctx.scale(s, s);
    ctx.font = '900 110px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#1b1030';
    const txt = n > 3 ? '3' : n === 0 ? 'KAPIŞ!' : String(n);
    ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = '#ffd27a';
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  } else if (m.countdown > -0.6 && !demo && m.countdown <= 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 + m.countdown / 0.6);
    ctx.font = '900 100px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#1b1030';
    ctx.strokeText('KAPIŞ!', WORLD.w / 2, WORLD.h / 2 - 40);
    ctx.fillStyle = '#ff6b5b';
    ctx.fillText('KAPIŞ!', WORLD.w / 2, WORLD.h / 2 - 40);
    ctx.restore();
  }
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (mode === 'playing' || mode === 'menu') {
    time += dt;
    acc += dt;
    while (acc >= STEP) {
      step(STEP);
      kb.endStep();
      touch.endStep();
      acc -= STEP;
    }
    if (match.countdown <= 0 && match.countdown > -1) match.countdown -= dt;
  } else {
    acc = 0;
  }
  render();
  if (mode === 'menu') updatePreviews();
  requestAnimationFrame(frame);
}

function startDemo() {
  startMatch(
    {
      lives: 3,
      slots: [
        { type: 'cpu', color: 0, diff: 'zor' },
        { type: 'cpu', color: 1, diff: 'orta' },
        { type: 'cpu', color: 3, diff: 'zor' },
        { type: 'cpu', color: 2, diff: 'orta' },
      ],
    },
    true,
  );
}

/* ---------- Menu ---------- */

const previews = [];

function usedColors(except) {
  return settings.slots.filter((s, i) => i !== except && s.type !== 'off').map((s) => s.color);
}

function cycleColor(i, d) {
  const used = usedColors(i);
  let c = settings.slots[i].color;
  for (let n = 0; n < COLORS.length; n++) {
    c = (c + d + COLORS.length) % COLORS.length;
    if (!used.includes(c)) break;
  }
  settings.slots[i].color = c;
}

function fixColorClash(i) {
  if (usedColors(i).includes(settings.slots[i].color)) cycleColor(i, 1);
}

function buildMenu() {
  const root = $('#slots');
  root.innerHTML = '';
  previews.length = 0;
  settings.slots.forEach((s, i) => {
    const pal = palette(COLORS[s.color]);
    const el = document.createElement('div');
    el.className = `slot ${s.type}`;
    el.style.setProperty('--c', s.type === 'off' ? '#555' : pal.ui);
    const typeLabel = s.type === 'human' ? 'Oyuncu' : s.type === 'cpu' ? 'Bilgisayar' : 'Kapalı';
    el.innerHTML = `
      <h3>${i + 1}. Kahraman</h3>
      <canvas width="300" height="260"></canvas>
      <div class="colorpick">
        <button class="arrow" data-c="-1" aria-label="Önceki renk">◀</button>
        <span>${COLORS[s.color].name}</span>
        <button class="arrow" data-c="1" aria-label="Sonraki renk">▶</button>
      </div>
      <button class="type ${s.type}">${typeLabel}</button>
      ${s.type === 'cpu' ? `<button class="diff">Zorluk: ${DIFFICULTY[s.diff].label}</button>` : ''}
      <div class="keys">${s.type === 'human' ? KEYMAPS[i].label + (i === 0 && isTouch ? '<br>Dokunmatik tuşlar açık' : '') : s.type === 'cpu' ? 'Bilgisayar oynar' : 'Tıkla, oyuna kat'}</div>`;
    el.querySelectorAll('[data-c]').forEach((b) =>
      b.addEventListener('click', () => {
        cycleColor(i, Number(b.dataset.c));
        sfx.click();
        saveSettings();
        buildMenu();
      }),
    );
    el.querySelector('.type').addEventListener('click', () => {
      const order = ['human', 'cpu', 'off'];
      s.type = order[(order.indexOf(s.type) + 1) % order.length];
      if (s.type !== 'off') fixColorClash(i);
      sfx.click();
      saveSettings();
      buildMenu();
    });
    el.querySelector('.diff')?.addEventListener('click', () => {
      s.diff = DIFF_ORDER[(DIFF_ORDER.indexOf(s.diff) + 1) % DIFF_ORDER.length];
      sfx.click();
      saveSettings();
      buildMenu();
    });
    root.appendChild(el);
    previews.push({ canvas: el.querySelector('canvas'), slot: s });
  });
  document.querySelectorAll('#lives button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === settings.lives));
  const n = settings.slots.filter((s) => s.type !== 'off').length;
  $('#start').disabled = n < 2;
  $('#start').textContent = n < 2 ? 'En az 2 kahraman seç' : 'Kapışmaya Başla!';
}

function updatePreviews() {
  for (const { canvas: c, slot } of previews) {
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(2, 0, 0, 2, 0, 0);
    const hop = slot.type === 'off' ? 0 : Math.abs(Math.sin(time * 3 + slot.color)) * 10;
    drawCharacter(g, 75, 118 - hop, {
      color: COLORS[slot.color],
      t: time,
      facing: Math.sin(time * 0.7 + slot.color) > 0 ? 1 : -1,
      armsUp: hop > 5 ? 0.6 : 0,
      eyes: slot.type === 'off' ? 'closed' : 'normal',
      alpha: slot.type === 'off' ? 0.5 : 1,
      sx: 1.25,
      sy: 1.25,
    });
  }
}

document.querySelectorAll('#lives button').forEach((b) =>
  b.addEventListener('click', () => {
    settings.lives = Number(b.dataset.v);
    sfx.click();
    saveSettings();
    buildMenu();
  }),
);

function show(id) {
  for (const s of ['#menu', '#pause', '#over']) $(s).classList.toggle('hidden', s !== id);
}

function play_() {
  initAudio();
  startMusic();
  saveSettings();
  startMatch(JSON.parse(JSON.stringify(settings)));
  mode = 'playing';
  show(null);
}

function pause() {
  if (mode !== 'playing' || match.finished) return;
  mode = 'paused';
  show('#pause');
}

function resume() {
  mode = 'playing';
  last = performance.now();
  show(null);
}

function toMenu() {
  mode = 'menu';
  show('#menu');
  buildMenu();
  startDemo();
}

function showOver() {
  mode = 'over';
  const m = match;
  const w = m.winner;
  const wi = w ? m.infos[w.id] : null;
  $('#winner').innerHTML = w ? `<span style="color:${wi.pal.ui}">${wi.name}</span> kazandı!` : 'Berabere!';
  const rows = m.players
    .map((p, i) => ({ p, info: m.infos[i] }))
    .sort((a, b) => b.p.lives - a.p.lives || b.p.stomps - a.p.stomps)
    .map(
      ({ p, info }) =>
        `<tr><td><span class="dot" style="background:${info.pal.ui}"></span>${info.name}</td><td>${p.stomps}</td><td>${p.falls}</td><td>${Math.max(0, p.lives)}</td></tr>`,
    )
    .join('');
  $('#stats').innerHTML = `<tr><th></th><th>Ezme</th><th>Hendek</th><th>Can</th></tr>${rows}`;
  show('#over');
  if (w) sfx.win();
}

$('#start').addEventListener('click', play_);
$('#resume').addEventListener('click', resume);
$('#restart').addEventListener('click', play_);
$('#toMenu').addEventListener('click', toMenu);
$('#again').addEventListener('click', play_);
$('#overMenu').addEventListener('click', toMenu);
$('#pauseBtn').addEventListener('click', () => (mode === 'paused' ? resume() : pause()));

function toggleMute() {
  setMuted(!isMuted());
  $('#mute').textContent = isMuted() ? 'Ses: Kapalı' : 'Ses: Açık';
}
$('#mute').addEventListener('click', toggleMute);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (mode === 'playing') pause();
    else if (mode === 'paused') resume();
  } else if (e.code === 'KeyM') {
    toggleMute();
  } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    if (mode === 'menu' && !$('#start').disabled) play_();
    else if (mode === 'over') play_();
    else if (mode === 'paused') resume();
  }
});
window.addEventListener('blur', pause);
window.addEventListener('pointerdown', () => initAudio(), { once: true });

window.__kale = { get match() { return match; }, get mode() { return mode; } };

buildMenu();
startDemo();
requestAnimationFrame(frame);

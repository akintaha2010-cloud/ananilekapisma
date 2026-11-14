import { P, WORLD, centerX } from './physics.js';
import { MAP_IDS, MAPS, createLevel, floorUnder } from './maps.js';
import { COLORS, HATS, STACHES, palette, drawCharacter, drawHat } from './character.js';
import { KEYMAPS, createKeyboard, readKeys, readGamepad, mergeInputs, emptyInput, createTouch } from './input.js';
import { DIFFICULTY } from './ai.js';
import { createGame, stepGame } from './game.js';
import { MODES, MODE_IDS } from './modes.js';
import { CHAPTERS, ITEM_LIST, loadSave, storeSave, buy, equip, owns, price, chapterUnlocked, totalStars, reward } from './progress.js';
import { hostRoom, joinRoom, snapshot, applySnapshot, createNetInput, normalizeCode, MAX_PLAYERS } from './online.js';
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

const SETTINGS_KEY = 'kale-kapismasi-ayarlar';
const DIFF_ORDER = ['kolay', 'orta', 'zor'];
const save = loadSave();
const settings = loadSettings();

let screen = 'home';
let g = null;
let run = null;
let last = performance.now();
let acc = 0;
let time = 0;
let net = null;

const colorOf = (c) => (typeof c === 'number' ? COLORS[c] || COLORS[0] : c || COLORS[0]);
const persist = () => storeSave(save);
const myName = () => save.name || 'Kahraman';

function loadSettings() {
  const fallback = {
    lives: 3,
    mode: 'kapisma',
    map: 'avlu',
    slots: [
      { type: 'human', color: save.look.color, diff: 'orta', hat: save.look.hat, stache: save.look.stache },
      { type: 'cpu', color: 1, diff: 'orta', hat: 'fes', stache: 'klasik' },
      { type: 'cpu', color: 3, diff: 'orta', hat: 'fes', stache: 'klasik' },
      { type: 'off', color: 2, diff: 'orta', hat: 'fes', stache: 'klasik' },
    ],
  };
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (s && Array.isArray(s.slots) && s.slots.length === 4) {
      s.slots.forEach((sl) => {
        sl.hat ||= 'fes';
        sl.stache ||= 'klasik';
      });
      return { ...fallback, ...s };
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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

/* ---------- Match lifecycle ---------- */

function dress(p) {
  if (!p.anim) p.anim = { sy: 1, vsy: 0, walk: 0 };
  if (!p.info.pal) p.info.pal = palette(colorOf(p.info.color));
}

function begin(cfg, opts = {}) {
  g = opts.view || createGame(cfg);
  g.bg = R.createBackground(g.level);
  g.players.forEach(dress);
  run = { cfg, demo: !!opts.demo, chapter: opts.chapter ?? -1, parts: R.createParticles(), shake: 0, freeze: 0, goT: 0, shown: false, net: opts.net || null };
  const local = g.players.some((p) => p.info.touch && p.info.control === 'human');
  $('#touch').classList.toggle('hidden', !(isTouch && !run.demo && (local || opts.net === 'client')));
}

function startDemo() {
  const map = MAP_IDS[Math.floor(Math.random() * MAP_IDS.length)];
  const heroes = [0, 1, 3, 2].map((c, k) => ({ control: 'cpu', diff: k % 2 ? 'orta' : 'zor', color: c, hat: HATS[k % 5].id, stache: STACHES[k % 4].id, name: 'CPU', tag: '' }));
  begin({ mode: Math.random() < 0.3 ? 'mancinik' : 'kapisma', map, lives: 3, countdown: 0, heroes }, { demo: true });
}

function humanInput(info) {
  let inp = readKeys(kb, KEYMAPS[Math.max(0, info.slot)]);
  if (info.anyKeys) inp = mergeInputs(inp, readKeys(kb, KEYMAPS[1]));
  inp = mergeInputs(inp, readGamepad(info.pad));
  if (info.touch) inp = mergeInputs(inp, touch.read());
  return inp;
}

function say(text, x, y, color = '#ffe14d', size = 30) {
  run.parts.push({ kind: 'text', text, x, y, vx: 0, vy: -70, g: 0, life: 0.9, max: 0.9, size, color, rot: 0, vr: 0 });
}

function banner(text, color = '#ffd27a') {
  run.parts.push({ kind: 'text', text, x: WORLD.w / 2, y: 250, vx: 0, vy: -20, g: 0, life: 1.8, max: 1.8, size: 64, color, rot: 0, vr: 0 });
}

function play(name) {
  if (!run.demo) sfx[name]?.();
}

function handleEvents(events) {
  const parts = run.parts;
  for (const e of events) {
    const p = e.p;
    if (p) dress(p);
    if (e.victim) dress(e.victim);
    const cx = p ? centerX(p) : e.x ?? 0;
    const feet = p ? p.y + p.h : 0;
    const info = p?.info;
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
        run.shake = Math.max(run.shake, 9);
        p.anim.sy = 0.6;
        R.spawn(parts, 'dust', cx, feet, 18, { angle: -Math.PI / 2, spread: 3.2, speed: 260, color: 'rgba(230,220,240,0.75)', g: 100, life: 0.5, size: 7 });
        parts.push({ kind: 'ring', x: cx, y: feet, vx: 0, vy: 0, g: 0, life: 0.4, max: 0.4, size: P.shockRadius * Math.sqrt(p.scale || 1), color: '#fff', rot: 0, vr: 0 });
        break;
      case 'shocked':
        say('PAT!', centerX(e.victim), e.victim.y - 10, '#ffffff', 24);
        break;
      case 'stomp': {
        const v = e.victim;
        play('stomp');
        run.shake = Math.max(run.shake, e.pound ? 14 : 9);
        run.freeze = run.net === 'client' ? 0 : 0.07;
        p.anim.sy = 0.7;
        R.spawn(parts, 'star', centerX(v), v.y + 20, 9, { angle: -Math.PI / 2, spread: 3, speed: 380, color: '#ffe14d', life: 0.7, size: 8 });
        if (v.info.hat === 'fes') R.spawn(parts, 'fez', centerX(v), v.y, 1, { angle: -Math.PI / 2, spread: 1.2, speed: 520, life: 1.3, g: 1400 });
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
        run.shake = Math.max(run.shake, 6);
        R.spawn(parts, 'star', (cx + centerX(e.victim)) / 2, p.y + 25, 5, { speed: 260, color: '#ffffff', life: 0.4, size: 6, g: 300 });
        if (e.type === 'shoved') say('HOP!', centerX(e.victim), e.victim.y - 14, info.pal.ui, 26);
        break;
      case 'splash':
        play('splash');
        R.spawn(parts, 'drop', cx, WORLD.waterY, 22, { angle: -Math.PI / 2, spread: 1.4, speed: 520, color: '#9fe3ff', life: 0.8, g: 1300, size: 5 });
        say('HENDEĞE!', Math.min(Math.max(cx, 90), WORLD.w - 90), WORLD.waterY - 60, '#9fe3ff', 28);
        break;
      case 'unsquash':
        play('unsquash');
        p.anim.sy = 1.3;
        break;
      case 'out':
        play('out');
        R.spawn(parts, 'ghost', cx, feet, 1, { angle: -Math.PI / 2, spread: 0, speed: 90, g: -40, life: 2 });
        if (p.info.kind !== 'minion') say(p.info.kind === 'boss' ? 'PAŞA DÜŞTÜ!' : 'ELENDİ', cx, p.y - 20, '#ff8fa3', 28);
        break;
      case 'wave':
        banner(`${e.n}. DALGA!`, '#ff8a5b');
        play('start');
        break;
      case 'gatehit':
        play('bonk');
        run.shake = Math.max(run.shake, 3);
        R.spawn(parts, 'dust', e.x, e.y + 40, 4, { speed: 160, color: 'rgba(160,110,60,0.8)', g: 500, life: 0.5, size: 5 });
        break;
      case 'spawn':
        R.spawn(parts, 'dust', cx, 60, 6, { speed: 120, color: 'rgba(255,255,255,0.5)', g: 0, life: 0.4 });
        break;
      case 'rockwarn':
        play('click');
        break;
      case 'rockland':
        play('poundland');
        run.shake = Math.max(run.shake, 8);
        R.spawn(parts, 'dust', e.x, e.y, 14, { angle: -Math.PI / 2, spread: 3, speed: 260, color: 'rgba(200,190,180,0.8)', g: 300, life: 0.6, size: 7 });
        break;
      case 'rocksplash':
        play('splash');
        R.spawn(parts, 'drop', e.x, WORLD.waterY, 18, { angle: -Math.PI / 2, spread: 1.2, speed: 600, color: '#9fe3ff', life: 0.8, g: 1300, size: 5 });
        break;
      case 'crushed':
        play('stomp');
        run.shake = Math.max(run.shake, 12);
        say('TAŞ!', cx, p.y - 30, '#ffb07a', 34);
        R.spawn(parts, 'star', cx, p.y + 10, 8, { angle: -Math.PI / 2, spread: 3, speed: 340, color: '#ffe14d', life: 0.7, size: 8 });
        break;
      case 'crown':
        play('doublejump');
        say('TAÇ!', cx, p.y - 40, '#ffd34d', 32);
        break;
      case 'crownsteal':
        play('win');
        say('TACI KAPTI!', cx, p.y - 40, '#ffd34d', 30);
        break;
      case 'tick':
        play('click');
        break;
      case 'go':
        play('start');
        run.goT = 0.6;
        break;
      default:
        break;
    }
  }
}

function animate(dt) {
  for (const p of g.players) {
    dress(p);
    const a = p.anim;
    a.vsy += (-(a.sy - 1) * 320 - a.vsy * 16) * dt;
    a.sy += a.vsy * dt;
    if (p.grounded) a.walk += Math.abs(p.vx) * dt * 0.05;
  }
  R.updateParticles(run.parts, dt);
  run.shake = Math.max(0, run.shake - dt * 40);
  run.goT = Math.max(0, run.goT - dt);
}

function step(dt) {
  if (run.freeze > 0) {
    run.freeze -= dt;
    return;
  }
  const inputs = {};
  for (const p of g.players) {
    if (p.info.control === 'human') inputs[p.id] = humanInput(p.info);
    else if (p.info.control === 'remote') inputs[p.id] = net?.inputs[p.info.peer] || emptyInput();
  }
  const events = stepGame(g, inputs, dt);
  handleEvents(events);
  if (run.net === 'host') net.pending.push(...events);
  animate(dt);
  afterStep();
}

function afterStep() {
  if (!g.finished) return;
  const winner = g.result?.winnerId !== undefined ? g.players.find((p) => p.id === g.result.winnerId) : null;
  const happy = winner || g.result?.team === 'A';
  if (happy && Math.random() < 0.5) {
    const c = ['#ff4d6d', '#ffd27a', '#7ae0ff', '#9dff7a', '#d29bff'][Math.floor(Math.random() * 5)];
    R.spawn(run.parts, 'confetti', Math.random() * WORLD.w, -10, 1, { angle: Math.PI / 2, spread: 0.6, speed: 120, color: c, g: 160, life: 3, size: 10 });
  }
  if (g.endT <= 0 && !run.shown) {
    run.shown = true;
    if (run.demo) startDemo();
    else showOver();
  }
}

function clientStep(dt) {
  animate(dt);
  g.snapAt = (g.snapAt || 0) + dt;
  const k = Math.min(g.snapAt, 0.1);
  for (const p of g.players) {
    if (p.sx === undefined || p.state === 'out') continue;
    p.x = p.sx + p.vx * k;
    p.y = p.grounded ? p.sy : p.sy + p.vy * k;
  }
  if (g.finished) {
    g.endT = (g.endT ?? 1.4) - dt;
    afterStep();
  }
}

/* ---------- Render ---------- */

function render() {
  if (!g) return;
  ctx.save();
  if (run.shake > 0) ctx.translate((Math.random() - 0.5) * run.shake, (Math.random() - 0.5) * run.shake);
  ctx.drawImage(g.bg, 0, 0, WORLD.w, WORLD.h);
  R.drawTorches(ctx, time, g.level);
  R.drawModeWorld(ctx, g, time, 'back');
  for (const pl of g.level.platforms) R.drawPlatform(ctx, pl, time);
  const order = [...g.players].sort((a, b) => (b.state === 'squashed') - (a.state === 'squashed'));
  for (const p of order) R.drawPlayer(ctx, p, p.info, time);
  R.drawModeWorld(ctx, g, time, 'front');
  R.drawParticles(ctx, run.parts);
  R.drawWater(ctx, time, g.level);
  R.drawWeather(ctx, g.level, time);
  ctx.restore();
  if (run.demo) return;
  R.drawHUD(ctx, g);
  const goWord = { kusatma: 'SAVUN!', saldiri: 'SALDIR!', tac: 'TACI KAP!' }[g.mode.id] || 'KAPIŞ!';
  if (g.countdown > 0 || run.goT > 0) {
    const n = Math.ceil(g.countdown);
    const k = g.countdown > 0 ? g.countdown - Math.floor(g.countdown) : 0;
    ctx.save();
    ctx.globalAlpha = g.countdown > 0 ? 1 : run.goT / 0.6;
    ctx.translate(WORLD.w / 2, WORLD.h / 2 - 40);
    const s = 1 + (1 - k) * 0.4;
    if (g.countdown > 0) ctx.scale(s, s);
    ctx.font = '900 100px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#1b1030';
    const txt = g.countdown <= 0 ? goWord : n > 3 ? '3' : String(n);
    ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = g.countdown > 0 ? '#ffd27a' : '#ff6b5b';
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const live = screen === 'playing' || (screen !== 'paused' && run?.demo) || (screen === 'over' && run?.net);
  if (live && g) {
    time += dt;
    if (run.net === 'client') {
      clientStep(dt);
      sendClientInput(now);
      kb.endStep();
      touch.endStep();
    } else {
      acc += dt;
      while (acc >= STEP) {
        step(STEP);
        kb.endStep();
        touch.endStep();
        acc -= STEP;
      }
      if (run.net === 'host') hostBroadcast(now);
    }
  } else {
    acc = 0;
  }
  render();
  if (screen !== 'playing') drawMenuCanvases();
  requestAnimationFrame(frame);
}

/* ---------- Screens ---------- */

const SCREENS = ['#home', '#menu', '#story', '#shop', '#online', '#pause', '#over'];
function show(id) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
}

function go(name) {
  screen = name;
  show(`#${name}`);
  if (!run || !run.demo) startDemo();
  refreshGold();
  if (name === 'menu') buildMenu();
  if (name === 'story') buildStory();
  if (name === 'shop') buildShop();
  if (name === 'online') buildOnline();
}

function refreshGold() {
  document.querySelectorAll('.goldN').forEach((el) => (el.textContent = save.gold));
  $('#starN').textContent = `${totalStars(save)}/${CHAPTERS.length * 3}`;
}

document.querySelectorAll('.back').forEach((b) =>
  b.addEventListener('click', () => {
    sfx.click();
    if (b.id === 'netBack') leaveNet();
    go('home');
  }),
);
$('#goStory').addEventListener('click', () => (initAudio(), sfx.click(), go('story')));
$('#goQuick').addEventListener('click', () => (initAudio(), sfx.click(), go('menu')));
$('#goOnline').addEventListener('click', () => (initAudio(), sfx.click(), go('online')));
$('#goShop').addEventListener('click', () => (initAudio(), sfx.click(), go('shop')));

/* ---------- Canvases in menus ---------- */

const previews = [];

function drawMenuCanvases() {
  for (const pv of previews) {
    if (!pv.canvas.isConnected) continue;
    const c = pv.canvas;
    const x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    const sc = c.width / 150;
    x.setTransform(sc, 0, 0, sc, 0, 0);
    const look = pv.look();
    if (pv.hatOnly) {
      drawHat(x, look.hat, 75, 82, 0, 1.9, Math.sin(time * 4) * 0.5);
      continue;
    }
    const off = look.off;
    const hop = off || pv.still ? 0 : Math.abs(Math.sin(time * 3 + (pv.seed || 0))) * 10;
    drawCharacter(x, 75, (pv.y || 118) - hop, {
      color: colorOf(look.color),
      hat: look.hat,
      stache: look.stache,
      t: time,
      facing: Math.sin(time * 0.7 + (pv.seed || 0)) > 0 ? 1 : -1,
      armsUp: hop > 5 ? 0.6 : 0,
      eyes: off ? 'closed' : 'normal',
      alpha: off ? 0.5 : 1,
      sx: pv.s || 1.25,
      sy: pv.s || 1.25,
    });
  }
}

function preview(canvas, look, opts = {}) {
  previews.push({ canvas, look, ...opts });
}

function pruneCanvases() {
  for (let i = previews.length - 1; i >= 0; i--) if (!previews[i].canvas.isConnected) previews.splice(i, 1);
}

/* ---------- Quick play / events ---------- */

function mapsFor(mode) {
  return MAP_IDS.filter((id) => {
    const lv = createLevel(id);
    if (mode === 'saldiri') return lv.platforms.some((pl) => pl.kind === 'throne');
    if (mode === 'kusatma') return !!floorUnder(lv, (lv.moatL + lv.moatR) / 2) && !lv.platforms.some((pl) => pl.kind === 'throne');
    return true;
  });
}

function seg(root, items, current, onPick) {
  root.innerHTML = '';
  for (const it of items) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.classList.toggle('on', it.id === current);
    b.addEventListener('click', () => {
      sfx.click();
      onPick(it.id);
    });
    root.appendChild(b);
  }
}

function usedColors(except) {
  return settings.slots.filter((s, i) => i !== except && s.type !== 'off').map((s) => s.color);
}

function cycle(list, cur, d, ok = () => true) {
  let k = Math.max(0, list.indexOf(cur));
  for (let n = 0; n < list.length; n++) {
    k = (k + d + list.length) % list.length;
    if (ok(list[k])) break;
  }
  return list[k];
}

const ownedColors = () => save.owned.color.map(Number).sort((a, b) => a - b);

function buildMenu() {
  pruneCanvases();
  const mode = MODES[settings.mode] || MODES.kapisma;
  const maps = mapsFor(mode.id);
  if (!maps.includes(settings.map)) settings.map = maps[0];
  seg($('#modeSel'), MODE_IDS.map((id) => ({ id, name: MODES[id].name })), mode.id, (id) => {
    settings.mode = id;
    saveSettings();
    buildMenu();
  });
  $('#modeDesc').textContent = mode.desc + (mode.team ? ' Tüm kahramanlar aynı takımda.' : '');
  seg($('#mapSel'), maps.map((id) => ({ id, name: MAPS[id].name })), settings.map, (id) => {
    settings.map = id;
    saveSettings();
    buildMenu();
  });
  const root = $('#slots');
  root.innerHTML = '';
  settings.slots.forEach((s, i) => {
    const pal = palette(colorOf(s.color));
    const el = document.createElement('div');
    el.className = `slot ${s.type}`;
    el.style.setProperty('--c', s.type === 'off' ? '#555' : pal.ui);
    const typeLabel = s.type === 'human' ? 'Oyuncu' : s.type === 'cpu' ? 'Bilgisayar' : 'Kapalı';
    el.innerHTML = `
      <h3>${i + 1}. Kahraman</h3>
      <canvas width="300" height="260"></canvas>
      <div class="colorpick">
        <button class="arrow" data-c="-1" aria-label="Önceki renk">◀</button>
        <span>${colorOf(s.color).name}</span>
        <button class="arrow" data-c="1" aria-label="Sonraki renk">▶</button>
      </div>
      <div class="hatpick"><button data-h="1">Şapka</button><button data-s="1">Bıyık</button></div>
      <button class="type ${s.type}">${typeLabel}</button>
      ${s.type === 'cpu' ? `<button class="diff">Zorluk: ${DIFFICULTY[s.diff].label}</button>` : ''}
      <div class="keys">${s.type === 'human' ? KEYMAPS[i].label + (i === 0 && isTouch ? '<br>Dokunmatik tuşlar açık' : '') : s.type === 'cpu' ? 'Bilgisayar oynar' : 'Tıkla, oyuna kat'}</div>`;
    const redo = () => {
      sfx.click();
      saveSettings();
      buildMenu();
    };
    el.querySelectorAll('[data-c]').forEach((b) =>
      b.addEventListener('click', () => {
        const used = usedColors(i);
        s.color = cycle(ownedColors(), s.color, Number(b.dataset.c), (c) => !used.includes(c));
        redo();
      }),
    );
    el.querySelector('[data-h]').addEventListener('click', () => {
      s.hat = cycle(save.owned.hat, s.hat, 1);
      redo();
    });
    el.querySelector('[data-s]').addEventListener('click', () => {
      s.stache = cycle(save.owned.stache, s.stache, 1);
      redo();
    });
    el.querySelector('.type').addEventListener('click', () => {
      const order = ['human', 'cpu', 'off'];
      s.type = order[(order.indexOf(s.type) + 1) % order.length];
      if (s.type !== 'off' && usedColors(i).includes(s.color)) {
        const used = usedColors(i);
        s.color = cycle(ownedColors(), s.color, 1, (c) => !used.includes(c));
      }
      redo();
    });
    el.querySelector('.diff')?.addEventListener('click', () => {
      s.diff = DIFF_ORDER[(DIFF_ORDER.indexOf(s.diff) + 1) % DIFF_ORDER.length];
      redo();
    });
    root.appendChild(el);
    preview(el.querySelector('canvas'), () => ({ ...s, off: s.type === 'off' }), { seed: i });
  });
  document.querySelectorAll('#lives button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === settings.lives));
  $('#lives').closest('label').classList.toggle('hidden', mode.id === 'tac');
  const n = settings.slots.filter((s) => s.type !== 'off').length;
  const need = mode.team ? 1 : 2;
  $('#start').disabled = n < need;
  $('#start').textContent = n < need ? 'En az 2 kahraman seç' : mode.team ? `${mode.name} Başlasın!` : 'Kapışmaya Başla!';
}

document.querySelectorAll('#lives button').forEach((b) =>
  b.addEventListener('click', () => {
    settings.lives = Number(b.dataset.v);
    sfx.click();
    saveSettings();
    buildMenu();
  }),
);

function quickCfg() {
  let humanIdx = 0;
  let cpuNo = 0;
  const heroes = settings.slots
    .map((s, i) => ({ ...s, slot: i }))
    .filter((s) => s.type !== 'off')
    .map((s) => {
      const human = s.type === 'human';
      const h = {
        control: human ? 'human' : 'cpu',
        diff: s.diff,
        color: s.color,
        hat: s.hat,
        stache: s.stache,
        slot: s.slot,
        tag: human ? `P${s.slot + 1}` : 'CPU',
        name: human ? (s.slot === 0 ? myName() : `Oyuncu ${s.slot + 1}`) : `CPU ${++cpuNo} (${DIFFICULTY[s.diff].label})`,
        pad: human ? humanIdx : -1,
        touch: human && humanIdx === 0,
      };
      if (human) humanIdx++;
      return h;
    });
  if (humanIdx === 1) heroes.find((h) => h.control === 'human').anyKeys = true;
  const mode = MODES[settings.mode];
  return { mode: settings.mode, map: settings.map, lives: mode.team ? Math.max(5, settings.lives) : settings.lives, heroes, waves: 5, bossLives: 4 };
}

function startPlay(cfg, opts = {}) {
  initAudio();
  startMusic();
  begin(cfg, opts);
  screen = 'playing';
  show(null);
}

$('#start').addEventListener('click', () => {
  saveSettings();
  startPlay(quickCfg());
});

/* ---------- Story ---------- */

const starHtml = (n) => [0, 1, 2].map((k) => `<span class="${k < n ? '' : 'off'}">★</span>`).join('');

function buildStory() {
  pruneCanvases();
  const root = $('#chapters');
  root.innerHTML = '';
  CHAPTERS.forEach((ch, i) => {
    const open = chapterUnlocked(save, i);
    const el = document.createElement('div');
    el.className = `chapter ${open ? '' : 'locked'}`;
    el.innerHTML = `<span class="num">${i + 1}. BÖLÜM · ${MODES[ch.cfg.mode].name}</span><h3>${ch.title}</h3><p>${open ? ch.story : 'Önceki bölümü bitir.'}</p>
      <div class="stars">${starHtml(save.stars[ch.id] || 0)}</div><button ${open ? '' : 'disabled'}>${open ? 'Oyna' : 'Kilitli'}</button>`;
    el.querySelector('button').addEventListener('click', () => startChapter(i));
    root.appendChild(el);
  });
}

function chapterCfg(i) {
  const ch = CHAPTERS[i];
  const mine = save.look.color;
  const taken = new Set([mine]);
  const cpus = (ch.cfg.cpus || []).map((c, k) => {
    let color = c.color;
    while (taken.has(color)) color = (color + 1) % COLORS.length;
    taken.add(color);
    return { control: 'cpu', diff: c.diff, color, hat: c.hat || 'fes', stache: c.stache || 'klasik', name: `Rakip ${k + 1}`, tag: 'CPU' };
  });
  const hero = { control: 'human', name: myName(), tag: 'P1', color: mine, hat: save.look.hat, stache: save.look.stache, slot: 0, pad: 0, touch: true, anyKeys: true };
  return { ...ch.cfg, heroes: [hero, ...cpus], goalText: `Görev: ${ch.goals.map((t, k) => `${'★'.repeat(k + 1)} ${t}`).join('  ·  ')}` };
}

function startChapter(i) {
  if (!chapterUnlocked(save, i)) return;
  sfx.click();
  startPlay(chapterCfg(i), { chapter: i });
}

/* ---------- Shop ---------- */

let shopTab = 'hat';

function buildShop() {
  pruneCanvases();
  preview($('#shopPreview'), () => save.look, { s: 1.4, y: 128 });
  $('#nameInput').value = save.name;
  document.querySelectorAll('#shopTabs button').forEach((b) => b.classList.toggle('on', b.dataset.k === shopTab));
  const root = $('#shopItems');
  root.innerHTML = '';
  for (const it of ITEM_LIST[shopTab]) {
    const have = owns(save, shopTab, it.id);
    const on = String(save.look[shopTab]) === it.id;
    const cost = price(shopTab, it.id);
    const el = document.createElement('div');
    el.className = `item ${on ? 'on' : ''}`;
    el.innerHTML = `<canvas width="220" height="180"></canvas><b>${it.name}</b>
      <button ${!have && save.gold < cost ? 'disabled' : ''}>${on ? 'Takılı' : have ? 'Tak' : `${cost} altın`}</button>`;
    el.querySelector('button').addEventListener('click', () => {
      if (!have && !buy(save, shopTab, it.id)) return;
      if (!have) sfx.win();
      else sfx.click();
      equip(save, shopTab, it.id);
      const s0 = settings.slots[0];
      s0[shopTab] = save.look[shopTab];
      saveSettings();
      persist();
      refreshGold();
      buildShop();
    });
    root.appendChild(el);
    const look = () => ({ ...save.look, [shopTab]: shopTab === 'color' ? Number(it.id) : it.id });
    preview(el.querySelector('canvas'), look, { still: true, s: 0.9, y: 108, hatOnly: shopTab === 'hat' });
  }
}

document.querySelectorAll('#shopTabs button').forEach((b) =>
  b.addEventListener('click', () => {
    shopTab = b.dataset.k;
    sfx.click();
    buildShop();
  }),
);
$('#nameInput').addEventListener('input', (e) => {
  save.name = e.target.value.trim().slice(0, 12);
  persist();
});

/* ---------- Online ---------- */

function status(text) {
  $('#netStatus').textContent = text || '';
}

function buildOnline() {
  pruneCanvases();
  const inRoom = !!net;
  $('#onlineStart').classList.toggle('hidden', inRoom);
  $('#lobby').classList.toggle('hidden', !inRoom);
  if (!inRoom) return;
  $('#roomCode').textContent = net.code || '-----';
  const root = $('#lobbyList');
  root.innerHTML = '';
  net.lobby.forEach((m, k) => {
    const el = document.createElement('div');
    el.className = 'member';
    el.style.setProperty('--c', palette(colorOf(m.look.color)).ui);
    el.innerHTML = `<canvas width="240" height="200"></canvas><b>${k === 0 ? '👑 ' : ''}${escapeHtml(m.name)}</b>`;
    root.appendChild(el);
    preview(el.querySelector('canvas'), () => m.look, { seed: k });
  });
  const host = net.role === 'host';
  $('#hostOpts').classList.toggle('hidden', !host);
  $('#guestWait').classList.toggle('hidden', host);
  if (host) {
    const mode = net.mode;
    seg($('#netModeSel'), MODE_IDS.map((id) => ({ id, name: MODES[id].name })), mode, (id) => {
      net.mode = id;
      if (!mapsFor(id).includes(net.map)) net.map = mapsFor(id)[0];
      broadcastLobby();
      buildOnline();
    });
    seg($('#netMapSel'), mapsFor(mode).map((id) => ({ id, name: MAPS[id].name })), net.map, (id) => {
      net.map = id;
      broadcastLobby();
      buildOnline();
    });
    const need = MODES[mode].team ? 1 : 2;
    $('#netStart').disabled = net.lobby.length < need;
    $('#netStart').textContent = net.lobby.length < need ? 'Arkadaşını bekle...' : 'Başlat!';
  } else {
    $('#guestWait').textContent = `${MODES[net.mode]?.name || ''} · ${MAPS[net.map]?.name || ''} — oda sahibinin başlatması bekleniyor...`;
  }
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const myLook = () => ({ color: save.look.color, hat: save.look.hat, stache: save.look.stache });
const cleanLook = (l) => ({
  color: Number.isInteger(l?.color) && COLORS[l.color] ? l.color : 0,
  hat: HATS.some((h) => h.id === l?.hat) ? l.hat : 'fes',
  stache: STACHES.some((h) => h.id === l?.stache) ? l.stache : 'klasik',
});

function broadcastLobby() {
  if (net?.role !== 'host') return;
  net.room.broadcast({ t: 'lobby', code: net.code, mode: net.mode, map: net.map, lobby: net.lobby.map(({ name, look }) => ({ name, look })) });
}

function leaveNet() {
  if (!net) return;
  try {
    (net.room || net.conn)?.close();
  } catch {
    /* ignore */
  }
  net = null;
  status('');
}

$('#hostBtn').addEventListener('click', async () => {
  if (net) return;
  status('Oda açılıyor...');
  $('#hostBtn').disabled = true;
  try {
    const n = { role: 'host', lobby: [{ peer: null, name: myName(), look: myLook() }], inputs: {}, pending: [], mode: 'kusatma', map: 'avlu', lastSnap: 0, snapN: 0, roster: -1 };
    n.room = await hostRoom({
      onJoin(conn) {
        n.lobby.push({ peer: conn.peer, name: 'Misafir', look: { color: (n.lobby.length * 3) % 8, hat: 'fes', stache: 'klasik' } });
        sfx.click();
        broadcastLobby();
        if (screen === 'online') buildOnline();
      },
      onLeave(conn) {
        n.lobby = n.lobby.filter((m) => m.peer !== conn.peer);
        delete n.inputs[conn.peer];
        status('Bir oyuncu ayrıldı');
        broadcastLobby();
        if (screen === 'online') buildOnline();
      },
      onData(conn, msg) {
        if (msg?.t === 'hello') {
          const m = n.lobby.find((x) => x.peer === conn.peer);
          if (m) {
            m.name = String(msg.name || 'Misafir').slice(0, 12);
            m.look = cleanLook(msg.look);
          }
          broadcastLobby();
          if (screen === 'online') buildOnline();
        } else if (msg?.t === 'in' && msg.i) {
          n.inputs[conn.peer] = msg.i;
        }
      },
      onError: status,
    });
    n.code = n.room.code;
    net = n;
    status('Oda hazır! Kodu arkadaşına söyle.');
    buildOnline();
  } catch (e) {
    status(e.message);
  }
  $('#hostBtn').disabled = false;
});

$('#joinCode').addEventListener('input', (e) => (e.target.value = normalizeCode(e.target.value)));
$('#joinCode').addEventListener('keydown', (e) => e.code === 'Enter' && $('#joinBtn').click());

$('#joinBtn').addEventListener('click', async () => {
  if (net) return;
  const code = normalizeCode($('#joinCode').value);
  if (code.length !== 5) return status('5 harfli oda kodunu yaz');
  status('Bağlanılıyor...');
  $('#joinBtn').disabled = true;
  try {
    const n = { role: 'client', code, lobby: [], mode: '', map: '', input: createNetInput(), lastSent: 0 };
    n.conn = await joinRoom(code, {
      onData: (msg) => clientMessage(n, msg),
      onClose() {
        if (net !== n) return;
        net = null;
        status('Bağlantı koptu');
        go('online');
      },
    });
    net = n;
    n.conn.send({ t: 'hello', name: myName(), look: myLook() });
    status('Odaya katıldın!');
    buildOnline();
  } catch (e) {
    status(e.message);
  }
  $('#joinBtn').disabled = false;
});

function clientMessage(n, msg) {
  if (net !== n || !msg) return;
  if (msg.t === 'full') {
    status('Oda dolu');
    leaveNet();
    buildOnline();
  } else if (msg.t === 'lobby') {
    n.lobby = msg.lobby.map((m) => ({ name: String(m.name).slice(0, 12), look: cleanLook(m.look) }));
    n.mode = msg.mode;
    n.map = msg.map;
    if (screen === 'online') buildOnline();
    else if (screen === 'over' || screen === 'playing') go('online');
  } else if (msg.t === 'start') {
    const view = createGame({ ...msg.cfg, heroes: [] });
    view.players = [];
    view.youId = msg.you;
    view.endT = 1.4;
    startPlay(msg.cfg, { view, net: 'client' });
  } else if (msg.t === 's' && g && run?.net === 'client') {
    const evs = applySnapshot(g, msg, (info) => ({ ...info, control: info.id === g.youId ? 'you' : 'remote', touch: false }));
    handleEvents(evs);
  }
}

function sendClientInput(now) {
  const n = net;
  if (!n || n.role !== 'client') return;
  let inp = mergeInputs(mergeInputs(readKeys(kb, KEYMAPS[0]), readKeys(kb, KEYMAPS[1])), readGamepad(0));
  inp = mergeInputs(inp, touch.read());
  n.input.update(inp);
  const force = now - n.lastSent > 120;
  const msg = n.input.take(force);
  if (msg) {
    n.conn.send({ t: 'in', i: msg });
    n.lastSent = now;
  }
}

$('#netStart').addEventListener('click', () => {
  if (net?.role !== 'host') return;
  const mode = MODES[net.mode];
  const used = new Set();
  const heroes = net.lobby.map((m, k) => {
    let color = m.look.color;
    while (used.has(color)) color = (color + 1) % COLORS.length;
    used.add(color);
    return { control: m.peer ? 'remote' : 'human', peer: m.peer, name: m.name, tag: `P${k + 1}`, color, hat: m.look.hat, stache: m.look.stache, slot: 0, pad: 0, touch: !m.peer, anyKeys: true };
  });
  const cfg = { mode: net.mode, map: net.map, lives: mode.team ? 5 : 3, heroes, waves: 5, bossLives: 3 + net.lobby.length };
  net.inputs = {};
  net.pending = [];
  net.roster = -1;
  startPlay(cfg, { net: 'host' });
  const safe = { ...cfg, heroes: [] };
  for (const conn of net.room.conns) {
    const p = g.players.find((x) => x.info.peer === conn.peer);
    conn.send({ t: 'start', cfg: safe, you: p ? p.id : -1 });
  }
});

function hostBroadcast(now) {
  if (now - net.lastSnap < 33) return;
  net.lastSnap = now;
  net.snapN++;
  const withInfos = net.roster !== g.roster || net.snapN % 30 === 0;
  net.roster = g.roster;
  net.room.broadcast(snapshot(g, net.pending, withInfos));
  net.pending = [];
}

/* ---------- Pause / over ---------- */

function pause() {
  if (screen !== 'playing' || g.finished || run.net) return;
  screen = 'paused';
  show('#pause');
}

function resume() {
  screen = 'playing';
  last = performance.now();
  show(null);
}

function restart() {
  if (run.chapter >= 0) startChapter(run.chapter);
  else startPlay(run.cfg);
}

function showOver() {
  screen = 'over';
  const res = g.result || {};
  const you = run.net === 'client' ? g.players.find((p) => p.id === g.youId) : g.players.find((p) => p.info.control === 'human');
  const winner = res.winnerId !== undefined ? g.players.find((p) => p.id === res.winnerId) : null;
  let title;
  if (res.team) title = res.team === 'A' ? '<span style="color:#9dff7a">Zafer!</span>' : '<span style="color:#ff8fa3">Yenildin!</span>';
  else title = winner ? `<span style="color:${winner.info.pal.ui}">${escapeHtml(winner.info.name)}</span> kazandı!` : 'Berabere!';
  $('#winner').innerHTML = title;
  $('#overReason').textContent = res.reason || '';
  let r = null;
  if (you && you.info.kind === 'hero') {
    r = reward(save, g, run.chapter, you);
    persist();
  }
  $('#overStars').innerHTML = run.chapter >= 0 && r ? starHtml(r.stars) : '';
  $('#overGold').innerHTML = r ? `<span class="coin"></span> +${r.gold} altın${r.newStars ? ` · +${r.newStars} yeni yıldız` : ''}` : '';
  const crown = g.mode.id === 'tac';
  const rows = g.players
    .filter((p) => p.info.kind !== 'minion')
    .sort((a, b) => (crown ? (g.ms.score[b.id] || 0) - (g.ms.score[a.id] || 0) : b.lives - a.lives || b.stomps - a.stomps))
    .map(
      (p) =>
        `<tr><td><span class="dot" style="background:${p.info.pal.ui}"></span>${escapeHtml(p.info.name)}</td><td>${p.stomps}</td><td>${p.falls}</td><td>${crown ? Math.floor(g.ms.score[p.id] || 0) + ' sn' : Math.max(0, p.lives)}</td></tr>`,
    )
    .join('');
  $('#stats').innerHTML = `<tr><th></th><th>Ezme</th><th>Hendek</th><th>${crown ? 'Taç' : 'Can'}</th></tr>${rows}`;
  const nextIdx = run.chapter + 1;
  $('#next').classList.toggle('hidden', !(run.chapter >= 0 && nextIdx < CHAPTERS.length && chapterUnlocked(save, nextIdx)));
  $('#again').classList.toggle('hidden', run.net === 'client');
  $('#again').textContent = run.net === 'host' ? 'Lobiye Dön' : 'Tekrar Oyna';
  $('#overMenu').textContent = run.net ? 'Odadan Çık' : 'Menü';
  show('#over');
  if (r?.win || (!res.team && winner && !you)) sfx.win();
}

$('#resume').addEventListener('click', resume);
$('#restart').addEventListener('click', restart);
$('#toMenu').addEventListener('click', () => go(run.chapter >= 0 ? 'story' : 'home'));
$('#again').addEventListener('click', () => {
  if (run.net === 'host') {
    broadcastLobby();
    go('online');
  } else restart();
});
$('#next').addEventListener('click', () => startChapter(run.chapter + 1));
$('#overMenu').addEventListener('click', () => {
  if (run.net) {
    leaveNet();
    go('online');
  } else go(run.chapter >= 0 ? 'story' : 'home');
});
$('#pauseBtn').addEventListener('click', () => (screen === 'paused' ? resume() : pause()));

function toggleMute() {
  setMuted(!isMuted());
  $('#mute').textContent = isMuted() ? 'Ses: Kapalı' : 'Ses: Açık';
}
$('#mute').addEventListener('click', toggleMute);

window.addEventListener('keydown', (e) => {
  if (e.target.closest?.('input')) return;
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (screen === 'playing') pause();
    else if (screen === 'paused') resume();
  } else if (e.code === 'KeyM') {
    toggleMute();
  } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    if (screen === 'menu' && !$('#start').disabled) $('#start').click();
    else if (screen === 'over' && !run.net) restart();
    else if (screen === 'paused') resume();
  }
});
window.addEventListener('blur', pause);
window.addEventListener('pointerdown', () => initAudio(), { once: true });

window.__kale = {
  get game() {
    return g;
  },
  get screen() {
    return screen;
  },
  save,
  startChapter,
};

refreshGold();
startDemo();
requestAnimationFrame(frame);

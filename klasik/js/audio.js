let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let muted = false;
let musicOn = false;
let nextNote = 0;
let step = 0;
let timer = null;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.7;
  master.connect(ctx.destination);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.8;
  sfxGain.connect(master);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.22;
  musicGain.connect(master);
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.7;
}

export const isMuted = () => muted;

function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0, dest = sfxGain } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.3, freq = 1200, q = 1, type = 'bandpass', delay = 0, dest = sfxGain, at } = {}) {
  if (!ctx) return;
  const t = at ?? ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t);
}

export const sfx = {
  jump: () => tone(320, 0.14, { slide: 380, vol: 0.12 }),
  doublejump: () => tone(480, 0.14, { slide: 500, vol: 0.12, type: 'triangle' }),
  land: () => noise(0.06, { vol: 0.12, freq: 300 }),
  pound: () => tone(700, 0.2, { slide: -500, vol: 0.12, type: 'sawtooth' }),
  poundland: () => {
    tone(90, 0.3, { slide: -40, vol: 0.4, type: 'sine' });
    noise(0.25, { vol: 0.3, freq: 200 });
  },
  stomp: () => {
    tone(180, 0.22, { slide: 520, vol: 0.28, type: 'square' });
    noise(0.12, { vol: 0.25, freq: 800, delay: 0.01 });
    tone(880, 0.1, { vol: 0.12, type: 'triangle', delay: 0.08 });
  },
  bonk: () => tone(260, 0.1, { slide: 120, vol: 0.15, type: 'triangle' }),
  shove: () => noise(0.14, { vol: 0.18, freq: 1800, q: 0.7 }),
  shoved: () => {
    noise(0.1, { vol: 0.3, freq: 600 });
    tone(150, 0.12, { slide: -60, vol: 0.25, type: 'square' });
  },
  splash: () => {
    noise(0.45, { vol: 0.35, freq: 900, q: 0.5, type: 'lowpass' });
    tone(500, 0.3, { slide: -350, vol: 0.1, type: 'sine' });
  },
  unsquash: () => tone(300, 0.15, { slide: 300, vol: 0.12, type: 'triangle' }),
  out: () => [523, 392, 330, 262].forEach((f, i) => tone(f, 0.18, { vol: 0.14, type: 'triangle', delay: i * 0.12 })),
  click: () => tone(660, 0.05, { vol: 0.1, type: 'triangle' }),
  start: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.15, { vol: 0.14, delay: i * 0.08 })),
  win: () =>
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, { vol: 0.16, type: 'square', delay: i * 0.13 })),
};

// D Hicaz: D Eb F# G A Bb C D
const HICAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];
const MELODY = [
  0, -1, 2, 3, 4, -1, 3, 2, 1, -1, 2, 1, 0, -1, -1, -1,
  4, -1, 5, 4, 3, -1, 4, 3, 2, -1, 1, 2, 0, -1, -1, -1,
  7, -1, 6, 5, 4, -1, 5, 4, 3, 4, 3, 2, 1, -1, 2, -1,
  4, 3, 2, 1, 2, -1, 1, -1, 0, -1, -1, -1, 0, -1, -1, -1,
];
const DRUM = ['D', '', 't', 'k', 'D', 't', 'k', ''];
const BPM = 150;

function scheduler() {
  const stepDur = 60 / BPM / 2;
  while (nextNote < ctx.currentTime + 0.12) {
    const m = MELODY[step % MELODY.length];
    if (m >= 0) {
      tone(HICAZ[m] * 2, stepDur * 1.6, { type: 'triangle', vol: 0.18, dest: musicGain, delay: nextNote - ctx.currentTime });
    }
    if (step % 8 === 0) tone(HICAZ[0] / 2, stepDur * 6, { type: 'sine', vol: 0.3, dest: musicGain, delay: nextNote - ctx.currentTime });
    const d = DRUM[step % DRUM.length];
    if (d === 'D') tone(110, 0.18, { type: 'sine', slide: -60, vol: 0.5, dest: musicGain, delay: nextNote - ctx.currentTime });
    if (d === 't') noise(0.05, { vol: 0.25, freq: 3000, dest: musicGain, at: nextNote });
    if (d === 'k') noise(0.04, { vol: 0.15, freq: 5000, dest: musicGain, at: nextNote });
    nextNote += stepDur;
    step++;
  }
}

export function startMusic() {
  if (!ctx || musicOn) return;
  musicOn = true;
  nextNote = ctx.currentTime + 0.05;
  step = 0;
  timer = setInterval(scheduler, 40);
}

export function stopMusic() {
  musicOn = false;
  clearInterval(timer);
}

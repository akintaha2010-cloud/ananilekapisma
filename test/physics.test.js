import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, stepPlayer, resolvePlayers, applyShockwave, isStomp, P } from '../js/physics.js';
import { createLevel } from '../js/maps.js';
import { emptyInput } from '../js/input.js';
import { simulate } from '../tools/sim.mjs';

const idle = () => ({ ...emptyInput(), jumpPressed: false, downPressed: false, shovePressed: false });
const settle = (p, level, n = 60) => {
  for (let i = 0; i < n; i++) stepPlayer(p, idle(), 1 / 120, level);
};

test('player lands and stays on the castle floor', () => {
  const level = createLevel();
  const p = createPlayer(0, 600, 500);
  settle(p, level, 200);
  assert.equal(p.grounded, true);
  assert.equal(p.y + p.h, 640);
});

test('jumping from the floor leaves the ground and comes back', () => {
  const level = createLevel();
  const p = createPlayer(0, 600, 640 - P.h);
  settle(p, level, 5);
  const events = stepPlayer(p, { ...idle(), jump: true, jumpPressed: true }, 1 / 120, level);
  assert.ok(events.some((e) => e.type === 'jump'));
  assert.ok(p.vy < 0);
  settle(p, level, 240);
  assert.equal(p.grounded, true);
});

test('down on a wooden platform drops through it', () => {
  const level = createLevel();
  const bridge = level.platforms.find((pl) => pl.id === 'bridge');
  const p = createPlayer(0, bridge.x + 100, bridge.y - P.h);
  settle(p, level, 5);
  assert.equal(p.platform, bridge);
  stepPlayer(p, { ...idle(), down: true, downPressed: true }, 1 / 120, level);
  settle(p, level, 120);
  assert.equal(p.y + p.h, 640);
});

test('towers block walking from the courtyard', () => {
  const level = createLevel();
  const tower = level.platforms.find((pl) => pl.id === 'towerL');
  const p = createPlayer(0, tower.x + tower.w + 5, 640 - P.h);
  for (let i = 0; i < 120; i++) stepPlayer(p, { ...idle(), left: true }, 1 / 120, level);
  assert.ok(p.x >= tower.x + tower.w - 0.01);
});

test('falling onto a head squashes the victim and bounces the stomper', () => {
  const a = createPlayer(0, 100, 0);
  const b = createPlayer(1, 105, 60);
  a.prevY = a.y - 8;
  a.y = b.y - a.h + 6;
  a.vy = 600;
  b.prevY = b.y;
  assert.ok(isStomp(a, b));
  const events = resolvePlayers([a, b], [idle(), idle()]);
  assert.equal(events[0].type, 'stomp');
  assert.equal(b.state, 'squashed');
  assert.equal(b.lives, 2);
  assert.equal(a.stomps, 1);
  assert.ok(a.vy < 0);
});

test('invulnerable players only get bonked', () => {
  const a = createPlayer(0, 100, 0);
  const b = createPlayer(1, 105, 60);
  b.invuln = 1;
  a.prevY = a.y - 8;
  a.y = b.y - a.h + 6;
  a.vy = 600;
  const events = resolvePlayers([a, b], [idle(), idle()]);
  assert.equal(events[0].type, 'bonk');
  assert.equal(b.lives, 3);
});

test('side contact pushes apart instead of stomping', () => {
  const a = createPlayer(0, 100, 582);
  const b = createPlayer(1, 140, 582);
  const events = resolvePlayers([a, b], [idle(), idle()]);
  assert.equal(events.length, 0);
  assert.ok(a.x + a.w <= b.x + 0.01);
});

test('a shove knocks the other player away', () => {
  const a = createPlayer(0, 100, 582);
  const b = createPlayer(1, 140, 582);
  a.facing = 1;
  a.shoveT = 0.1;
  const events = resolvePlayers([a, b], [idle(), idle()]);
  assert.equal(events[0].type, 'shoved');
  assert.ok(b.vx > 500);
  assert.ok(b.vy < 0);
});

test('ground pound shockwave launches nearby grounded players', () => {
  const src = createPlayer(0, 500, 582);
  const near = createPlayer(1, 600, 582);
  const far = createPlayer(2, 900, 582);
  near.grounded = far.grounded = true;
  const events = applyShockwave(src, [src, near, far]);
  assert.equal(events.length, 1);
  assert.ok(near.vx > 0 && near.vy < 0);
  assert.equal(far.vx, 0);
});

test('a match between computer players finishes with one winner', () => {
  for (const seed of [1, 2, 3]) {
    const r = simulate({ seed, diffs: ['orta', 'zor', 'kolay', 'orta'] });
    const alive = r.players.filter((p) => p.state !== 'out');
    assert.ok(r.time < 240, `seed ${seed} took too long`);
    assert.ok(alive.length <= 1);
    assert.ok(r.counts.stomp > 0);
  }
});

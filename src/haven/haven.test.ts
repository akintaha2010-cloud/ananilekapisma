import test from 'node:test';
import assert from 'node:assert/strict';
import { createHavenState, stepHaven } from './engine';
import { HAVEN_LEVEL_IDS, VIEW_W } from './levels';
import { HavenInput, HavenState } from './types';

const idle = (): HavenInput => ({ left: false, right: false, up: false, down: false, jump: false, punch: false, kick: false, throw: false, special: false });

export function autoInput(s: HavenState, frame: number): HavenInput {
  const p = s.player;
  const inp = idle();
  const foes = s.enemies.filter((e) => !e.dead && e.x > s.camX - 20 && e.x < s.camX + VIEW_W + 20);
  const ahead = (dx: number) => s.level.solids.some((q) => !q.oneWay && p.x + dx >= q.x && p.x + dx <= q.x + q.w && q.y <= p.y + 2);
  const wall = s.level.solids.some((q) => !q.oneWay && q.y < p.y - 2 && q.y > p.y - 70 && p.x + p.facing * 14 > q.x && p.x + p.facing * 14 < q.x + q.w);
  const danger = s.projs.some((q) => q.team === 'foe' && q.delay <= 0 && Math.abs(q.x - p.x) < 46 && q.y > p.y - 34);
  if (p.special >= 100 && foes.length > 0) inp.special = true;
  if (foes.length > 0) {
    const e = foes.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a));
    const dx = e.x - p.x;
    const reach = 14 + e.w / 2;
    if (Math.abs(dx) > reach) {
      if (dx > 0) inp.right = true;
      else inp.left = true;
    } else {
      if (Math.sign(dx) !== p.facing) {
        if (dx > 0) inp.right = true;
        else inp.left = true;
      }
      if (frame % 9 === 0) {
        if (e.kind === 'firewall' && frame % 18 === 0) inp.kick = true;
        else inp.punch = true;
      }
    }
    if (p.weapon && p.weapon !== 'skewer' && p.weapon !== 'keyboard' && Math.abs(dx) < 200 && frame % 20 === 0) inp.throw = true;
  } else {
    inp.right = true;
  }
  if (p.ground && (danger || (inp.right && (!ahead(12) || wall)))) {
    inp.jump = true;
  }
  inp.up = inp.jump || !p.ground;
  return inp;
}

test('haven: every Dan-the-Man style level can be cleared by a scripted player', () => {
  for (const id of HAVEN_LEVEL_IDS) {
    const s = createHavenState(id, 99 + id);
    let f = 0;
    while (s.phase === 'play' && f < 60 * 600) {
      stepHaven(s, autoInput(s, f), 1 / 60);
      f++;
    }
    assert.equal(s.phase, 'won', `level ${id} phase=${s.phase} x=${Math.round(s.player.x)}/${s.level.width} lives=${s.player.lives} t=${Math.round(f / 60)}s enemies=${s.enemies.filter((e) => !e.dead).map((e) => e.kind + ':' + e.hp).join(',')}`);
    assert.ok(s.player.kills > 3, `level ${id} kills`);
  }
});

test('haven: combo, weapons, crates and boss phases', () => {
  const s = createHavenState(102);
  const p = s.player;
  p.weapon = 'doner';
  p.ammo = 1;
  stepHaven(s, { ...idle(), throw: true }, 1 / 60);
  assert.equal(s.projs.length, 1);
  assert.equal(p.weapon, null);
  s.level.encounters.forEach((e) => (e.done = true));
  const crate = s.level.crates[0];
  p.x = crate.x - 8;
  p.facing = 1;
  for (let i = 0; i < 80; i++) stepHaven(s, { ...idle(), punch: i % 15 === 0 }, 1 / 60);
  assert.equal(crate.broken, true);
  const boss = s.level.encounters[s.level.encounters.length - 1];
  assert.deepEqual(boss.waves, [['mert']]);
});

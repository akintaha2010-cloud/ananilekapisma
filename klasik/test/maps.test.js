import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, stepPlayer, P } from '../js/physics.js';
import { MAP_IDS, createLevel, updateLevel, floorUnder, waterInfo } from '../js/maps.js';
import { emptyInput } from '../js/input.js';

test('every map has spawns standing on ground and respawn points over floor', () => {
  for (const id of MAP_IDS) {
    const lv = createLevel(id);
    assert.ok(lv.spawns.length >= 4, id);
    assert.ok(lv.respawnXs.length >= 2, id);
    for (const x of lv.respawnXs) assert.ok(floorUnder(lv, x), `${id} respawn ${x}`);
    for (const s of lv.spawns) assert.ok(s.x > lv.moatL && s.x < lv.moatR, `${id} spawn ${s.x}`);
  }
});

test('waterInfo knows the moat and gaps', () => {
  const lv = createLevel('kopru');
  assert.equal(waterInfo(lv, lv.moatL - 20).over, true);
  assert.equal(waterInfo(lv, (lv.moatL + lv.moatR) / 2 + 300).over, false);
  for (const gap of lv.water) assert.equal(waterInfo(lv, (gap[0] + gap[1]) / 2).over, true);
});

test('a player riding a vertical lift moves with it', () => {
  const lv = createLevel('zindan');
  const lift = lv.platforms.find((pl) => pl.move && pl.move.y1 !== undefined);
  assert.ok(lift, 'zindan has a vertical lift');
  const p = createPlayer(0, lift.x + lift.w / 2 - P.w / 2, lift.y - P.h);
  const dt = 1 / 120;
  for (let i = 0; i < 360; i++) {
    updateLevel(lv, dt);
    stepPlayer(p, emptyInput(), dt, lv);
    if (i > 10) assert.ok(Math.abs(p.y + p.h - lift.y) < 2, `frame ${i}`);
  }
});

test('heavier players are knocked back less', () => {
  const lv = createLevel();
  assert.ok(lv);
  const small = createPlayer(0, 0, 0, { mass: 1 });
  const big = createPlayer(1, 0, 0, { mass: 2, scale: 1.5 });
  assert.ok(big.w > small.w && big.h > small.h);
});

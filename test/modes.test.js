import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../tools/sim.mjs';
import { createGame, stepGame } from '../js/game.js';
import { createPlayer, resolvePlayers, P } from '../js/physics.js';
import { emptyInput } from '../js/input.js';

test('teammates cannot squash each other', () => {
  const a = createPlayer(0, 100, 100, { team: 'A' });
  const b = createPlayer(1, 100, 100 + P.h - 4, { team: 'A' });
  a.prevY = a.y - 12;
  a.vy = 500;
  b.grounded = true;
  const ev = [];
  resolvePlayers([a, b], [emptyInput(), emptyInput()], ev);
  assert.equal(b.state, 'normal');
  assert.equal(b.lives, 3);
});

for (const [mode, map, opts] of [
  ['mancinik', 'zindan', {}],
  ['tac', 'surlar', {}],
  ['kusatma', 'surlar', { waves: 3 }],
  ['saldiri', 'taht', { bossLives: 2 }],
]) {
  test(`${mode} match between computers finishes`, () => {
    const team = mode === 'kusatma' || mode === 'saldiri';
    const r = simulate({ seed: 2, mode, map, diffs: team ? ['orta', 'orta'] : ['orta', 'orta', 'orta'], ...opts });
    assert.ok(r.result, `${mode} ended`);
    assert.ok(r.time < 200);
  });
}

test('siege spawns enemy waves that hurt the gate', () => {
  const g = createGame({ mode: 'kusatma', map: 'surlar', countdown: 0, waves: 2, heroes: [{ control: 'human' }] }, () => 0.5);
  let waves = 0;
  for (let i = 0; i < 120 * 40 && !g.finished; i++) for (const e of stepGame(g, {}, 1 / 120)) if (e.type === 'wave') waves++;
  assert.ok(waves >= 1);
  assert.ok(g.ms.gate.hp < g.ms.gate.max);
});

test('crown holder earns score over time', () => {
  const g = createGame({ mode: 'tac', map: 'avlu', countdown: 0, heroes: [{ control: 'human' }, { control: 'human' }] }, () => 0.5);
  const p = g.players[0];
  g.ms.crown.holder = p.id;
  for (let i = 0; i < 240; i++) stepGame(g, {}, 1 / 120);
  assert.ok(g.ms.score[p.id] > 1.9);
});

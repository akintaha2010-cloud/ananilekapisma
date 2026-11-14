import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame } from '../js/game.js';
import { snapshot, applySnapshot, roomCode, normalizeCode, createNetInput } from '../js/online.js';

const cfg = { mode: 'kusatma', map: 'surlar', countdown: 0, waves: 2, heroes: [{ control: 'human', name: 'Ev' }, { control: 'remote', name: 'Misafir' }] };

test('snapshots rebuild the host state on a client view', () => {
  let s = 3;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const host = createGame(cfg, rand);
  for (let i = 0; i < 120 * 6; i++) stepGame(host, {}, 1 / 120);
  const msg = JSON.parse(JSON.stringify(snapshot(host, [], true)));
  const view = createGame({ ...cfg });
  applySnapshot(view, msg);
  assert.equal(view.players.length, host.players.length);
  for (const p of host.players) {
    const q = view.players.find((o) => o.id === p.id);
    assert.ok(Math.abs(q.x - p.x) < 0.1 && Math.abs(q.y - p.y) < 0.1);
    assert.equal(q.info.name, p.info.name);
  }
  assert.equal(view.ms.wave, host.ms.wave);
});

test('events travel with player ids', () => {
  const host = createGame({ ...cfg, mode: 'kapisma' });
  const [a, b] = host.players;
  const view = createGame({ ...cfg, mode: 'kapisma' });
  const evs = applySnapshot(view, JSON.parse(JSON.stringify(snapshot(host, [{ type: 'stomp', p: a, victim: b, pound: true }], true))));
  assert.equal(evs.length, 1);
  assert.equal(evs[0].p.id, a.id);
  assert.equal(evs[0].victim.id, b.id);
});

test('remote taps are not lost between packets', () => {
  const g = createGame({ mode: 'kapisma', map: 'avlu', countdown: 0, heroes: [{ control: 'remote' }, { control: 'remote' }] });
  const net = createNetInput();
  const p = g.players[0];
  net.update({ left: false, right: false, jump: true, down: false, shove: false });
  net.update({ left: false, right: false, jump: false, down: false, shove: false });
  const inp = net.take();
  for (let i = 0; i < 60; i++) stepGame(g, {}, 1 / 120);
  const evs = stepGame(g, { [p.id]: inp }, 1 / 120);
  assert.ok(evs.some((e) => e.type === 'jump' && e.p === p), 'player jumped');
});

test('room codes are short and readable', () => {
  const c = roomCode();
  assert.match(c, /^[A-Z2-9]{5}$/);
  assert.equal(normalizeCode(' ab-c d9x '), 'ABCD9');
});

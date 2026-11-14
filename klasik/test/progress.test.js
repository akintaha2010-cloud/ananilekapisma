import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, newSave, loadSave, storeSave, buy, equip, chapterUnlocked, reward } from '../js/progress.js';
import { createGame, stepGame } from '../js/game.js';

const mem = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};

test('save round-trips and survives garbage', () => {
  const st = mem();
  const s = newSave();
  s.gold = 77;
  storeSave(s, st);
  assert.equal(loadSave(st).gold, 77);
  st.setItem('kale-kapismasi-kayit', '{bozuk');
  assert.equal(loadSave(st).gold, 0);
});

test('shop: cannot buy without gold, can buy and equip with gold', () => {
  const s = newSave();
  assert.equal(buy(s, 'hat', 'tac'), false);
  assert.equal(equip(s, 'hat', 'tac'), false);
  s.gold = 300;
  assert.equal(buy(s, 'hat', 'tac'), true);
  assert.equal(s.gold, 50);
  assert.equal(equip(s, 'hat', 'tac'), true);
  assert.equal(s.look.hat, 'tac');
});

test('chapters unlock in order and stars are kept at their best', () => {
  const s = newSave();
  assert.equal(chapterUnlocked(s, 0), true);
  assert.equal(chapterUnlocked(s, 1), false);
  const g = createGame({ ...CHAPTERS[0].cfg, countdown: 0, heroes: [{ control: 'human' }] });
  g.ms.coins = g.level.coins.length;
  g.players[0].x = g.level.flagX + 20;
  stepGame(g, {}, 1 / 120);
  assert.ok(g.finished);
  const r = reward(s, g, 0);
  assert.equal(r.stars, 3);
  assert.ok(s.gold > 0);
  assert.equal(chapterUnlocked(s, 1), true);
  g.players[0].lives = 1;
  reward(s, g, 0);
  assert.equal(s.stars[CHAPTERS[0].id], 3);
});

test('every chapter has a story scene and a valid config', () => {
  for (const ch of CHAPTERS) {
    assert.ok(ch.intro.beats.length > 0, ch.id);
    for (const b of [...ch.intro.beats, ...(ch.outro?.beats || [])]) assert.ok(['hero', 'orfe', 'pasa'].includes(b.who) && b.say.length > 0);
    const g = createGame({ ...ch.cfg, countdown: 0, heroes: [{ control: 'human' }] });
    assert.equal(g.mode.id, ch.cfg.mode);
  }
});

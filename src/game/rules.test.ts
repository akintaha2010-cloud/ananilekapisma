import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, DEFAULT_SLOTS } from './constants';
import { createSimulation, stepSimulation, buildRoundResult, spawnAdventureWave, buildHudSnapshot } from './physics';
import { computeBotInput } from './ai';
import { evaluateLiveAchievements, evaluateRoundEndAchievements } from './achievements';
import { computeLevelFromXp } from './characters';
import { computeSagaStarsEarned } from './saga';
import { computeEndingFromCounts, STORY_CHAPTERS } from './story';
import { AchievementId, GameSettings, PlayerInputState, PlayerSlotConfig } from './types';

function emptyInput(): PlayerInputState {
  return {
    left: false,
    right: false,
    upHeld: false,
    jumpPressed: false,
    down: false,
  };
}

function makeSlots(count = 2): PlayerSlotConfig[] {
  return DEFAULT_SLOTS.map((s, idx) => ({
    ...s,
    kind: idx < count ? 'human' : 'off',
  }));
}

test('character spawns, falls onto platform, and jumps with double jump', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  const p0 = sim.players[0];

  // Step until grounded
  for (let i = 0; i < 60; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(p0.grounded, true);

  // First jump
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  assert.ok(p0.vy < -500);
  assert.equal(p0.jumpsUsed, 1);
  assert.equal(p0.jumpsMade, 1);

  // Mid-air step then double jump
  for (let i = 0; i < 10; i++) {
    stepSimulation(sim, { 0: { ...emptyInput(), upHeld: true } }, 1 / 60);
  }
  const vyBeforeDouble = p0.vy;
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  assert.ok(p0.vy < vyBeforeDouble);
  assert.equal(p0.jumpsUsed, 2);
  assert.equal(p0.jumpsMade, 2);
});

test('head stomp bounces attacker, stuns victim, and increments stomp counter', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  const attacker = sim.players[0];
  const victim = sim.players[1];

  // Put victim grounded at x=500, y=508 (top of main platform at 560)
  victim.x = 500;
  victim.y = 560 - victim.h;
  victim.vx = 0;
  victim.vy = 0;
  victim.invulnTimer = 0;
  victim.grounded = true;

  // Position attacker directly above victim's head falling downward
  attacker.x = 500;
  attacker.y = victim.y - attacker.h + 6;
  attacker.vx = 0;
  attacker.vy = 320;
  attacker.invulnTimer = 0;
  attacker.jumpsUsed = 2;

  stepSimulation(sim, {}, 1 / 60);

  assert.equal(attacker.stomps, 1);
  assert.equal(attacker.score, 10, 'successful head stomp awards +10 points');
  assert.ok(attacker.vy < -400, 'attacker should bounce upward after stomp');
  assert.equal(attacker.jumpsUsed, 0, 'stomp should refresh double jump');
  assert.ok(victim.stunTimer > 0.5, 'victim should be stunned');
  assert.equal(victim.lastHitBy, attacker.slotIndex);
});

test('team mode prevents friendly head stomp stun', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'team' };
  const slots = makeSlots(3).map((s) => ({ ...s, team: s.slotIndex < 2 ? ('A' as const) : ('B' as const) }));
  const sim = createSimulation(settings, slots);
  const a0 = sim.players[0];
  const a1 = sim.players[1];

  a1.x = 500;
  a1.y = 560 - a1.h;
  a1.invulnTimer = 0;
  a0.x = 500;
  a0.y = a1.y - a0.h + 6;
  a0.vy = 320;
  a0.invulnTimer = 0;

  stepSimulation(sim, {}, 1 / 60);

  assert.equal(a0.stomps, 0);
  assert.equal(a1.stunTimer, 0);
});

test('falling out of bounds awards KO credit and ends FFA when 1 survivor remains', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa', lives: 1 };
  const sim = createSimulation(settings, makeSlots(2));
  const p0 = sim.players[0];
  const p1 = sim.players[1];

  p1.lastHitBy = p0.slotIndex;
  p1.lastHitTimer = 3.0;
  p1.y = 850; // below arena boundary

  stepSimulation(sim, {}, 1 / 60);

  assert.equal(p1.eliminated, true);
  assert.equal(p0.kills, 1);
  assert.equal(p0.score, 25, 'ring-out elimination awards +25 extra points');
  assert.equal(sim.finished, true);
  assert.equal(sim.winnerSlot, p0.slotIndex);
});

test('stomp followed by ring-out totals 35 points (10 + 25)', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'time' };
  const sim = createSimulation(settings, makeSlots(2));
  const attacker = sim.players[0];
  const victim = sim.players[1];

  victim.x = 500;
  victim.y = 560 - victim.h;
  victim.invulnTimer = 0;
  attacker.x = 500;
  attacker.y = victim.y - attacker.h + 6;
  attacker.vy = 320;
  attacker.invulnTimer = 0;

  stepSimulation(sim, {}, 1 / 60);
  assert.equal(attacker.score, 10);

  victim.y = 850;
  for (let i = 0; i < 5; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(attacker.kills, 1);
  assert.equal(attacker.score, 35);
});

test('time attack mode finishes at 0s and picks player with highest score', () => {
  const settings: GameSettings = {
    ...DEFAULT_SETTINGS,
    mapId: 'classic',
    mode: 'time',
    roundDurationSec: 2,
  };
  const sim = createSimulation(settings, makeSlots(2));
  sim.players[1].score = 85;
  sim.players[0].score = 35;

  for (let i = 0; i < 130; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }

  assert.equal(sim.finished, true);
  assert.equal(sim.winnerSlot, sim.players[1].slotIndex);
});

test('crumbling platform shakes and falls after being stood on', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'crumbling', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  const crumb = sim.platforms.find((p) => p.type === 'crumbling')!;
  assert.ok(crumb);

  const p0 = sim.players[0];
  p0.x = crumb.x + 20;
  p0.y = crumb.y - p0.h - 2;
  p0.vy = 100;

  // Land on crumbling stone
  for (let i = 0; i < 5; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(crumb.crumbleState, 'shaking');

  // Wait > 0.7s for it to collapse
  for (let i = 0; i < 45; i++) {
    stepSimulation(sim, {}, 1 / 60);
  }
  assert.equal(crumb.crumbleState, 'fallen');
});

test('AI bot steers back toward center platform when over abyss', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human' },
    { ...DEFAULT_SLOTS[1], kind: 'bot', aiPersonality: 'aggressive' },
  ];
  const sim = createSimulation(settings, slots);
  const bot = sim.players[1];

  // Place bot off left edge over void
  bot.x = 40;
  bot.y = 590;
  bot.vy = 200;
  bot.grounded = false;
  bot.jumpsUsed = 0;

  const input = computeBotInput(bot, sim, 1 / 60);
  assert.equal(input.right, true, 'bot over left abyss should steer right toward castle');
  assert.equal(input.jumpPressed, true, 'bot should jump to recover from abyss');
});

test('head stomp triggers pronounced pancake clay squash deformation on victim', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human', costume: { ...DEFAULT_SLOTS[0].costume, colorId: 'turquoise' } },
    { ...DEFAULT_SLOTS[1], kind: 'human' },
  ];
  const sim = createSimulation(settings, slots);
  const attacker = sim.players[0];
  const victim = sim.players[1];

  assert.equal(attacker.costume.colorId, 'turquoise');
  victim.x = 500;
  victim.y = 560 - victim.h;
  victim.invulnTimer = 0;
  attacker.x = 500;
  attacker.y = victim.y - attacker.h + 6;
  attacker.vy = 300;
  attacker.invulnTimer = 0;

  stepSimulation(sim, {}, 1 / 60);

  assert.ok(attacker.jiggleAmp > 0.15, 'attacker should gain gelatin jiggle impulse');
  assert.ok(victim.jiggleAmp > 0.25, 'victim should gain strong gelatin jiggle impulse');
  assert.ok(victim.squashX >= 1.9, 'victim should flatten horizontally like dough');
  assert.ok(victim.squashY <= 0.35, 'victim height should compress drastically');
  assert.ok(victim.pancakeTimer > 0.5, 'pancake timer holds dramatic squish before elastic spring-back');
});

test('achievements evaluate live milestones and round-end Sıfır Hata', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa', lives: 1 };
  const sim = createSimulation(settings, makeSlots(2));
  const p0 = sim.players[0];
  p0.jumpsMade = 5;
  p0.kills = 1;
  p0.stomps = 3;

  const unlocked = new Set<AchievementId>();
  const live = evaluateLiveAchievements(sim, unlocked, false);
  assert.ok(live.includes('bes_zipla'));
  assert.ok(live.includes('ilk_eleme'));
  assert.ok(live.includes('kafa_avcisi'));

  sim.players[1].eliminated = true;
  sim.finished = true;
  sim.winnerSlot = p0.slotIndex;
  const res = buildRoundResult(sim);
  const end = evaluateRoundEndAchievements(res, new Set(live), true);
  assert.ok(end.includes('sifir_hata'));
  assert.ok(end.includes('cevrimici_dost'));
});

test('story chapter 1 targetStomps win condition completes round and resolves ending', () => {
  const ch1 = STORY_CHAPTERS[0];
  const settings: GameSettings = {
    ...DEFAULT_SETTINGS,
    mode: 'story',
    mapId: ch1.mapId,
    lives: ch1.lives,
    botsEnabled: true,
  };
  const sim = createSimulation(settings, makeSlots(2), ch1.storyRule);
  sim.players[0].team = 'A';
  sim.players[1].team = 'B';
  sim.players[0].stomps = ch1.storyRule.targetStomps!;

  stepSimulation(sim, {}, 1 / 60);
  assert.equal(sim.finished, true);
  assert.equal(sim.winnerSlot, sim.players[0].slotIndex);

  const res = buildRoundResult(sim);
  assert.equal(res.storyWon, true);
  assert.equal(computeEndingFromCounts({ mercy: 4, wisdom: 1, might: 1 }), 'unity');
  assert.equal(computeEndingFromCounts({ mercy: 1, wisdom: 4, might: 1 }), 'guardian');
  assert.equal(computeEndingFromCounts({ mercy: 1, wisdom: 1, might: 4 }), 'obsidian');
});

test('heroes have distinct stats (triple jump) and special abilities (frost shield & belly dash)', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human', heroId: 'zeynep' },
    { ...DEFAULT_SLOTS[1], kind: 'human', heroId: 'karahan' },
    { ...DEFAULT_SLOTS[2], kind: 'human', heroId: 'tiknaz' },
    { ...DEFAULT_SLOTS[3], kind: 'off' },
  ];
  const sim = createSimulation(settings, slots);
  const zeynep = sim.players[0];
  const karahan = sim.players[1];
  const tiknaz = sim.players[2];

  assert.equal(zeynep.maxJumps, 3, 'Zeynep should have triple jump');

  // Ground Zeynep and jump 3 times
  for (let i = 0; i < 60; i++) stepSimulation(sim, {}, 1 / 60);
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  for (let i = 0; i < 6; i++) stepSimulation(sim, { 0: { ...emptyInput(), upHeld: true } }, 1 / 60);
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  for (let i = 0; i < 6; i++) stepSimulation(sim, { 0: { ...emptyInput(), upHeld: true } }, 1 / 60);
  stepSimulation(sim, { 0: { ...emptyInput(), jumpPressed: true, upHeld: true } }, 1 / 60);
  assert.equal(zeynep.jumpsUsed, 3);

  // Karahan activates Frost Shield and deflects head stomp
  karahan.x = 500;
  karahan.y = 560 - karahan.h;
  karahan.invulnTimer = 0;
  stepSimulation(sim, { 1: { ...emptyInput(), abilityPressed: true } }, 1 / 60);
  assert.ok(karahan.shieldTimer > 1.5, 'Karahan frost shield should activate');
  assert.ok(karahan.abilityCooldown > 0);

  zeynep.x = 500;
  zeynep.y = karahan.y - zeynep.h + 6;
  zeynep.vy = 320;
  zeynep.invulnTimer = 0;
  stepSimulation(sim, {}, 1 / 60);
  assert.equal(zeynep.stomps, 0, 'shielded Karahan should deflect stomp');
  assert.ok(zeynep.stunTimer > 0.1, 'attacker stomping into shield should be stunned');

  // Tiknaz activates Belly Dash
  tiknaz.facing = 1;
  tiknaz.vx = 0;
  stepSimulation(sim, { 2: { ...emptyInput(), abilityPressed: true } }, 1 / 60);
  assert.ok(tiknaz.vx >= 500, 'Tiknaz belly dash should launch forward');
});

test('smart AI brakes before walking off a platform edge', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human' },
    { ...DEFAULT_SLOTS[1], kind: 'bot', aiPersonality: 'aggressive', heroId: 'pofi' },
  ];
  const sim = createSimulation(settings, slots);
  const mainFloor = sim.platforms.find((p) => p.type === 'stone')!;
  const bot = sim.players[1];

  // Put bot right at the right edge of stone floor moving fast rightward
  bot.x = mainFloor.x + mainFloor.w - bot.w - 4;
  bot.y = mainFloor.y - bot.h;
  bot.vx = 350;
  bot.grounded = true;

  // Put human safely inside center so bot isn't diving
  sim.players[0].x = mainFloor.x + 200;
  sim.players[0].y = mainFloor.y - sim.players[0].h;

  const input = computeBotInput(bot, sim, 1 / 60);
  assert.equal(input.left, true, 'bot approaching right edge at speed should brake leftward');
  assert.equal(input.right, false);
});

test('XP level progression and Saga 1-3 star computation work deterministically', () => {
  assert.equal(computeLevelFromXp(0).level, 1);
  assert.equal(computeLevelFromXp(100).level, 2);
  assert.equal(computeLevelFromXp(260).level, 3);

  assert.equal(computeSagaStarsEarned(0, 30, false), 0);
  assert.equal(computeSagaStarsEarned(0, 30, true), 3);
  assert.equal(computeSagaStarsEarned(1, 80, true), 2);
  assert.equal(computeSagaStarsEarned(2, 40, true), 1);
});



test('crown mode: touching crown grabs it, stomping holder steals it, bots finish match', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'crown', roundDurationSec: 90 };
  const slots: PlayerSlotConfig[] = DEFAULT_SLOTS.map((s) => ({ ...s, kind: 'bot', aiPersonality: 'aggressive' }));
  const sim = createSimulation(settings, slots);
  assert.equal(sim.timeRemainingSec, 90);
  stepSimulation(sim, {}, 1 / 60);
  assert.notEqual(sim.crownX, undefined);
  const p0 = sim.players[0];
  p0.x = (sim.crownX ?? 0) - p0.w / 2;
  p0.y = (sim.crownY ?? 0) - p0.h / 2;
  stepSimulation(sim, {}, 1 / 60);
  assert.equal(sim.crownHolder, p0.slotIndex);

  let steps = 0;
  while (!sim.finished && steps < 60 * 120) {
    const inputs: Record<number, PlayerInputState> = {};
    for (const p of sim.players) inputs[p.slotIndex] = computeBotInput(p, sim, 1 / 60);
    stepSimulation(sim, inputs, 1 / 60);
    steps++;
  }
  assert.equal(sim.finished, true);
  assert.notEqual(sim.winnerSlot, null);
  const held = Object.values(sim.crownHeld ?? {}).reduce((a, b) => a + b, 0);
  assert.ok(held > 5, `crown should be carried for a while, got ${held}`);
  buildRoundResult(sim);
});

test('adventure mode: enemy waves drop in one after another and the chapter resolves', async () => {
  const { ADVENTURE_CHAPTERS, buildAdventureAllySlots, createAdventureState } = await import('./adventure');
  for (const chapter of ADVENTURE_CHAPTERS) {
    const settings: GameSettings = { ...DEFAULT_SETTINGS, mode: 'adventure', mapId: chapter.mapId, lives: chapter.lives, botsEnabled: true };
    const allies = buildAdventureAllySlots(
      DEFAULT_SLOTS.map((s) => ({ ...s, kind: 'bot', aiPersonality: 'aggressive' })),
      chapter
    );
    const sim = createSimulation(settings, allies);
    sim.adventure = createAdventureState(chapter);
    let steps = 0;
    while (!sim.finished && steps < 60 * 240) {
      const inputs: Record<number, PlayerInputState> = {};
      for (const p of sim.players) inputs[p.slotIndex] = computeBotInput(p, sim, 1 / 60);
      stepSimulation(sim, inputs, 1 / 60);
      steps++;
    }
    const foes = sim.players.filter((p) => p.team === 'B');
    assert.ok(foes.length >= chapter.waves[0].length, `chapter ${chapter.id} should spawn enemies`);
    assert.equal(sim.finished, true, `chapter ${chapter.id} should finish`);
    const result = buildRoundResult(sim);
    assert.equal(result.adventureChapterId, chapter.id);
    if (result.adventureWon) {
      assert.equal(sim.adventure.waveIdx, chapter.waves.length);
      assert.ok(foes.every((f) => f.eliminated));
    }
    if (chapter.waves.some((w) => w.includes('boss')) && sim.adventure.bossSlot !== null) {
      const boss = sim.players.find((p) => p.slotIndex === sim.adventure!.bossSlot)!;
      assert.ok(boss.w > 40);
    }
  }
});

test('haven ankara campaign: Akın leads, story allies join, organizer bosses spawn big', async () => {
  const { chaptersOf, buildAdventureAllySlots, createAdventureState, isAdventureChapterUnlocked, isAdventureBoss } = await import('./adventure');
  const haven = chaptersOf('haven');
  assert.equal(haven.length, 6);
  assert.equal(isAdventureChapterUnlocked({ completed: [] }, 101), true);
  assert.equal(isAdventureChapterUnlocked({ completed: [] }, 102), false);
  assert.equal(isAdventureChapterUnlocked({ completed: [101] }, 102), true);
  const bosses = haven.flatMap((c) => c.waves.flat()).filter(isAdventureBoss);
  assert.deepEqual(bosses, ['mert', 'tuna', 'ayaz', 'gokoz', 'buglord']);
  const allies = buildAdventureAllySlots(DEFAULT_SLOTS, haven[5]);
  assert.equal(allies[0].heroId, 'akin');
  assert.equal(allies[0].name, 'Akın');
  assert.ok(allies.length <= 4);
  assert.ok(allies.some((a) => a.name === 'Devin'));
  assert.ok(allies.every((a) => a.team === 'A'));
  const mert = haven[1];
  const sim = createSimulation(
    { ...DEFAULT_SETTINGS, mode: 'adventure', mapId: mert.mapId, lives: mert.lives, botsEnabled: true },
    buildAdventureAllySlots(DEFAULT_SLOTS, mert)
  );
  sim.adventure = createAdventureState(mert);
  sim.adventure.waveIdx = 1;
  spawnAdventureWave(sim);
  const boss = sim.players.find((p) => p.slotIndex === sim.adventure!.bossSlot)!;
  assert.equal(boss.name, 'Mert');
  assert.ok(boss.w > 40);
  assert.equal(sim.adventure.bossMaxHp, 6);
  assert.match(buildHudSnapshot(sim).storyObjective ?? '', /Mert: 6\/6/);
});

test('jokes and Hack Club secret codes', async () => {
  const { MENU_TIPS, pickQuip, matchSecret, normalizeSecretKey, SECRETS } = await import('./jokes');
  assert.ok(MENU_TIPS.length > 5);
  assert.equal(pickQuip(MENU_TIPS, MENU_TIPS.length + 2), MENU_TIPS[2]);
  assert.equal(pickQuip([], 3), '');
  const typed = 'xxhaven'.split('').map(normalizeSecretKey);
  assert.equal(matchSecret(typed)?.id, 'haven');
  assert.equal(matchSecret(['Ç', 'a', 'Y'].map(normalizeSecretKey))?.id, 'cay');
  const konami = SECRETS.find((s) => s.id === 'konami')!;
  assert.equal(matchSecret(['q', ...konami.sequence])?.id, 'konami');
  assert.equal(matchSecret(['h', 'a', 'v']), null);
});

test('countdown freezes the fight and the match starts only after it hits zero', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  sim.countdown = 3;
  const p0 = sim.players[0];
  const startY = p0.y;
  for (let i = 0; i < 120; i++) {
    stepSimulation(sim, { 0: { ...emptyInput(), right: true, jumpPressed: true } }, 1 / 60);
  }
  assert.equal(p0.y, startY, 'nobody moves during countdown');
  assert.equal(sim.elapsedSec, 0);
  assert.ok(sim.countdown > 0.9 && sim.countdown < 1.1);
  for (let i = 0; i < 90; i++) stepSimulation(sim, {}, 1 / 60);
  assert.equal(sim.countdown, 0);
  for (let i = 0; i < 30; i++) stepSimulation(sim, {}, 1 / 60);
  assert.ok(sim.elapsedSec > 0.3, 'fight runs after countdown');
  assert.notEqual(p0.y, startY);
});

test('stomp grants a short grace window so the same victim cannot be stun-locked', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const sim = createSimulation(settings, makeSlots(2));
  const [attacker, victim] = sim.players;
  const setup = () => {
    victim.x = 500;
    victim.y = 560 - victim.h;
    victim.vx = 0;
    victim.vy = 0;
    victim.grounded = true;
    attacker.x = 500;
    attacker.y = victim.y - attacker.h + 6;
    attacker.vx = 0;
    attacker.vy = 320;
    attacker.invulnTimer = 0;
  };
  victim.invulnTimer = 0;
  setup();
  stepSimulation(sim, {}, 1 / 60);
  assert.equal(attacker.stomps, 1);
  assert.ok(victim.invulnTimer > 0.4);
  for (let i = 0; i < 3; i++) stepSimulation(sim, {}, 1 / 60);
  setup();
  stepSimulation(sim, {}, 1 / 60);
  assert.equal(attacker.stomps, 1, 'immediate re-stomp is ignored');
});

test('bots do not spam jumps or abilities every frame', () => {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, mapId: 'classic', mode: 'ffa' };
  const slots: PlayerSlotConfig[] = [
    { ...DEFAULT_SLOTS[0], kind: 'human' },
    { ...DEFAULT_SLOTS[1], kind: 'bot', aiPersonality: 'aggressive' },
  ];
  const sim = createSimulation(settings, slots);
  for (let i = 0; i < 60; i++) stepSimulation(sim, {}, 1 / 60);
  const bot = sim.players[1];
  let jumps = 0;
  let abilities = 0;
  for (let i = 0; i < 600; i++) {
    const input = computeBotInput(bot, sim, 1 / 60);
    if (input.jumpPressed) jumps++;
    if (input.abilityPressed) abilities++;
    stepSimulation(sim, { 1: input }, 1 / 60);
  }
  assert.ok(jumps < 60, `bot jumped ${jumps} times in 10s`);
  assert.ok(abilities <= 6, `bot used ability ${abilities} times in 10s`);
});

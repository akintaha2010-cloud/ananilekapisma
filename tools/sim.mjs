import { createPlayer, stepPlayer, resolvePlayers, applyShockwave, P } from '../js/physics.js';
import { createLevel, updateLevel } from '../js/level.js';
import { createBrain, aiInput } from '../js/ai.js';
import { withEdges, emptyInput } from '../js/input.js';

export function simulate({ diffs = ['orta', 'orta', 'orta', 'orta'], lives = 3, maxTime = 240, seed = 1 } = {}) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const level = createLevel();
  const players = diffs.map((d, k) => createPlayer(k, level.spawns[k].x - P.w / 2, level.spawns[k].y - P.h, { lives }));
  const brains = diffs.map((d) => createBrain(d, rand));
  const prev = players.map(() => emptyInput());
  const dt = 1 / 120;
  const counts = { stomp: 0, fall: 0, shoved: 0, shocked: 0 };
  let t = 0;
  for (; t < maxTime; t += dt) {
    updateLevel(level, dt);
    const inputs = players.map((p, k) => {
      const cur = aiInput(p, brains[k], players, level, dt);
      const e = withEdges(cur, prev[k]);
      prev[k] = cur;
      return e;
    });
    const events = [];
    players.forEach((p, k) => stepPlayer(p, inputs[k], dt, level, events));
    resolvePlayers(players, inputs, events);
    for (const e of events) {
      if (e.type in counts) counts[e.type]++;
      if (e.type === 'poundland') applyShockwave(e.p, players, events);
      if (e.type === 'fall') {
        const p = e.p;
        if (p.state !== 'squashed') p.lives--;
        if (p.lives > 0) {
          p.x = 600;
          p.y = -90;
          p.vx = 0;
          p.vy = 0;
          p.state = 'normal';
          p.invuln = 2;
          p.splashed = false;
        } else p.state = 'out';
      }
    }
    if (players.filter((p) => p.state !== 'out').length <= 1) break;
  }
  return { time: t, counts, players };
}

if (process.argv[1]?.endsWith('sim.mjs')) {
  for (let seed = 1; seed <= 8; seed++) {
    const r = simulate({ seed, diffs: ['zor', 'orta', 'kolay', 'orta'] });
    console.log(seed, r.time.toFixed(1), JSON.stringify(r.counts), r.players.map((p) => `${p.lives}/${p.stomps}`).join(' '));
  }
}

import { createGame, stepGame } from '../js/game.js';

export function simulate({ diffs = ['orta', 'orta', 'orta', 'orta'], lives, maxTime = 240, seed = 1, mode = 'kapisma', map = 'avlu', ...opts } = {}) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const heroes = diffs.map((diff, k) => ({ control: 'cpu', diff, color: k, name: `CPU ${k + 1}` }));
  const g = createGame({ mode, map, lives, heroes, countdown: 0, ...opts }, rand);
  const dt = 1 / 120;
  const counts = {};
  for (let t = 0; t < maxTime && !g.finished; t += dt) {
    for (const e of stepGame(g, {}, dt)) counts[e.type] = (counts[e.type] || 0) + 1;
  }
  return { time: g.time, counts, players: g.players, result: g.result, game: g };
}

if (process.argv[1]?.endsWith('sim.mjs')) {
  const runs = [
    ['kapisma', 'avlu', {}],
    ['kapisma', 'kopru', {}],
    ['mancinik', 'zindan', {}],
    ['tac', 'surlar', {}],
    ['kusatma', 'surlar', { waves: 4 }],
    ['saldiri', 'taht', { bossLives: 3 }],
  ];
  for (const [mode, map, opts] of runs) {
    for (let seed = 1; seed <= 3; seed++) {
      const team = mode === 'kusatma' || mode === 'saldiri';
      const r = simulate({ seed, mode, map, diffs: team ? ['orta', 'orta'] : ['zor', 'orta', 'kolay', 'orta'], ...opts });
      console.log(mode.padEnd(9), map.padEnd(7), seed, r.time.toFixed(1).padStart(6), JSON.stringify(r.result), `stomp=${r.counts.stomp || 0} fall=${r.counts.fall || 0} crushed=${r.counts.crushed || 0} wave=${r.game.ms.wave ?? '-'} gate=${r.game.ms.gate?.hp.toFixed(0) ?? '-'}`);
    }
  }
}

import { centerX, isActive, sameTeam } from './physics.js';
import { waterInfo, floorUnder } from './maps.js';
import { emptyInput } from './input.js';

export const DIFFICULTY = {
  kolay: { label: 'Kolay', react: 0.45, aim: 0.35, err: 0.25, evade: 0.2, chase: 1.6, roam: 2.6 },
  orta: { label: 'Orta', react: 0.26, aim: 0.6, err: 0.12, evade: 0.5, chase: 2.4, roam: 1.8 },
  zor: { label: 'Zor', react: 0.12, aim: 0.85, err: 0.04, evade: 0.8, chase: 3.5, roam: 1.0 },
};

export function createBrain(level = 'orta', rand = Math.random) {
  return {
    diff: DIFFICULTY[level] || DIFFICULTY.orta,
    rand,
    think: 0,
    targetId: null,
    targetT: 0,
    mode: 'roam',
    modeT: rand() * 1.5,
    roamX: 640,
    dir: 0,
    jumpT: 0,
    jumpQueued: false,
    lastJump: false,
    downTap: false,
    shoveTap: false,
    leap: 0,
    leapT: 0,
  };
}

function pickTarget(p, brain, players) {
  const others = players.filter((o) => o !== p && o.state !== 'out' && o.lives > 0 && !sameTeam(p, o));
  if (!others.length) return null;
  const current = others.find((o) => o.id === brain.targetId);
  if (current && brain.targetT > 0) return current;
  let best = null;
  let bestScore = Infinity;
  for (const o of others) {
    const d = Math.hypot(centerX(o) - centerX(p), o.y - p.y);
    const score = d + (o.invuln > 0 ? 400 : 0) + (o.state === 'squashed' ? 600 : 0) + brain.rand() * 120;
    if (score < bestScore) {
      bestScore = score;
      best = o;
    }
  }
  brain.targetId = best.id;
  brain.targetT = 2 + brain.rand() * 2;
  return best;
}

function platformAbove(p, level, tx) {
  let best = null;
  let bestScore = Infinity;
  const feet = p.y + p.h;
  for (const pl of level.platforms) {
    if (pl.y >= feet - 30 || pl.y < feet - 270) continue;
    const cx = Math.max(pl.x + 20, Math.min(tx, pl.x + pl.w - 20));
    const score = Math.abs(cx - tx) + Math.abs(cx - centerX(p)) * 0.6;
    if (score < bestScore) {
      bestScore = score;
      best = { pl, x: cx };
    }
  }
  return best;
}

function decide(p, brain, players, level, world) {
  const d = brain.diff;
  const r = brain.rand;
  const me = centerX(p);
  const feet = p.y + p.h;
  brain.dir = 0;
  const goal = world?.mode?.aiGoal?.(world, p, brain) || null;

  const threat = players.find(
    (o) =>
      o !== p &&
      isActive(o) &&
      !sameTeam(p, o) &&
      Math.abs(centerX(o) - me) < 70 &&
      o.y + o.h < p.y + 10 &&
      o.y + o.h > p.y - 220 &&
      o.vy > -100,
  );
  if (threat && p.invuln <= 0 && r() < d.evade) {
    brain.dir = centerX(threat) < me ? 1 : -1;
    if (p.grounded && r() < 0.35) brain.jumpQueued = true;
    return;
  }

  if (goal?.flee) {
    const near = players
      .filter((o) => o !== p && isActive(o) && !sameTeam(p, o))
      .sort((a, b) => Math.abs(centerX(a) - me) - Math.abs(centerX(b) - me))[0];
    if (near) {
      const away = centerX(near) < me ? 1 : -1;
      const room = waterInfo(level, me);
      brain.dir = room.dist < 120 && room.side === away ? -away : away;
      if (p.grounded && (Math.abs(centerX(near) - me) < 140 || r() < 0.2)) {
        brain.jumpQueued = true;
        brain.jumpHold = 0.3;
      }
    }
    return;
  }

  if (goal && goal.x !== undefined) {
    chasePoint(p, brain, level, goal.x, goal.y ?? level.floorY, goal.stay);
    return;
  }

  if (brain.mode === 'roam' && !goal?.targetId) {
    const gx = brain.roamX;
    brain.dir = Math.abs(gx - me) > 30 ? Math.sign(gx - me) : 0;
    if (p.grounded && r() < 0.12) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.3;
    }
    return;
  }

  if (goal?.targetId !== undefined) {
    brain.targetId = goal.targetId;
    brain.targetT = 0.5;
  }
  const target = pickTarget(p, brain, players);
  if (!target) return;
  const tx = centerX(target);
  const dx = tx - me;
  const dy = target.y + target.h - feet;

  if (target.state === 'squashed' || target.invuln > 0.4) {
    brain.dir = Math.abs(dx) < 160 ? -Math.sign(dx || 1) : 0;
    if (r() < 0.15 && p.grounded) brain.jumpQueued = true;
    return;
  }

  if (dy < -60) {
    const goal = platformAbove(p, level, tx);
    const gx = goal ? goal.x : tx;
    brain.dir = Math.abs(gx - me) > 20 ? Math.sign(gx - me) : 0;
    if (p.grounded && Math.abs(gx - me) < 110) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.3;
    } else if (!p.grounded && p.vy > -60 && p.airJumps > 0 && goal && feet > goal.pl.y + 5) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.25;
    }
  } else if (dy > 60) {
    brain.dir = Math.abs(dx) > 14 ? Math.sign(dx) : 0;
    if (p.grounded && p.platform && !p.platform.solid && Math.abs(dx) < 220 && r() < d.aim) {
      brain.downTap = true;
    }
    if (!p.grounded && Math.abs(dx) < 26 && target.grounded && r() < d.aim) brain.downTap = true;
  } else {
    brain.dir = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
    if (p.grounded && Math.abs(dx) < 130 && Math.abs(dx) > 30 && r() < d.aim * 0.4) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.18;
    }
    if (Math.abs(dx) < 85 && Math.abs(dy) < 30 && p.shoveCd <= 0) {
      const nearEdge = waterInfo(level, tx).dist < 200 || !target.platform?.solid;
      if (r() < (nearEdge ? d.aim : 0.25)) brain.shoveTap = true;
    }
  }

  if (!p.grounded && p.y + p.h < target.y && Math.abs(dx) < 30 && r() < d.aim * 0.5) brain.downTap = true;

  if (r() < d.err) brain.dir = r() < 0.5 ? -1 : 1;
}

function chasePoint(p, brain, level, gx, gy, stay) {
  const me = centerX(p);
  const feet = p.y + p.h;
  const dx = gx - me;
  const dy = gy - feet;
  if (dy < -60) {
    const goal = platformAbove(p, level, gx);
    const tx = goal ? goal.x : gx;
    brain.dir = Math.abs(tx - me) > 20 ? Math.sign(tx - me) : 0;
    if (p.grounded && Math.abs(tx - me) < 110) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.3;
    } else if (!p.grounded && p.vy > -60 && p.airJumps > 0 && goal && feet > goal.pl.y + 5) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.25;
    }
  } else if (dy > 60 && p.grounded && p.platform && !p.platform.solid && Math.abs(dx) < 200) {
    brain.downTap = true;
    brain.dir = Math.sign(dx);
  } else {
    brain.dir = Math.abs(dx) > (stay ? 26 : 10) ? Math.sign(dx) : 0;
    if (stay && !brain.dir && p.shoveCd <= 0 && brain.rand() < 0.3) brain.shoveTap = true;
  }
}

export function aiInput(p, brain, players, level, dt, world) {
  const out = emptyInput();
  if (!isActive(p)) return out;
  brain.think -= dt;
  brain.targetT -= dt;
  brain.modeT -= dt;
  if (brain.modeT <= 0) {
    const d = brain.diff;
    brain.mode = brain.mode === 'chase' ? 'roam' : 'chase';
    brain.modeT = (brain.mode === 'chase' ? d.chase : d.roam) * (0.6 + brain.rand() * 0.8);
    const spots = level.platforms.filter((pl) => pl.kind !== 'floor' || brain.rand() < 0.5);
    const pl = spots[Math.floor(brain.rand() * spots.length)];
    brain.roamX = pl.x + 20 + brain.rand() * Math.max(0, pl.w - 40);
  }
  if (brain.think <= 0) {
    brain.think = brain.diff.react * (0.7 + brain.rand() * 0.6);
    decide(p, brain, players, level, world);
  }

  let dir = brain.dir;
  const me = centerX(p);
  const wi = waterInfo(level, me);
  brain.leapT -= dt;
  if (brain.leapT <= 0) brain.leap = 0;
  if (p.grounded && brain.leap && p.platform?.kind === 'floor' && brain.leapT < 1.1) brain.leap = 0;
  if (!p.grounded && brain.leap) {
    dir = brain.leap;
    if (p.vy > 0 && p.airJumps > 0 && !brain.lastJump) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.3;
    }
  } else if (!p.grounded && (wi.over || wi.dist < 10)) {
    dir = wi.over ? wi.side : -wi.side;
    if (p.vy > 0 && p.airJumps > 0 && !brain.lastJump) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.3;
    }
  } else if (p.grounded && p.platform?.kind === 'floor' && wi.dist < 40 && dir === wi.side) {
    const across = floorUnder(level, me + dir * 300) || (level.adventure && level.platforms.find((pl) => pl.move && Math.abs(pl.x + pl.w / 2 - (me + dir * 170)) < pl.w / 2 + 30));
    if (across && across !== p.platform) {
      brain.leap = dir;
      brain.leapT = 1.4;
      brain.jumpQueued = true;
      brain.jumpHold = 0.3;
    } else dir = 0;
  }

  if (dir) {
    const feet = p.y + p.h;
    const ahead = dir > 0 ? p.x + p.w + 26 : p.x - 26;
    const wall = level.platforms.some((pl) => pl.solid && pl.y < feet - 8 && pl.y > feet - 300 && ahead > pl.x && ahead < pl.x + pl.w);
    if (wall && (p.grounded || (p.vy > -120 && p.airJumps > 0 && !brain.lastJump))) {
      brain.jumpQueued = true;
      brain.jumpHold = 0.35;
    }
  }

  if (brain.jumpQueued && !brain.lastJump) {
    brain.jumpT = brain.jumpHold || 0.25;
    brain.jumpQueued = false;
  }
  brain.jumpT -= dt;
  out.jump = brain.jumpT > 0;
  if (brain.jumpQueued && brain.lastJump) out.jump = false;
  brain.lastJump = out.jump;

  out.left = dir < 0;
  out.right = dir > 0;
  out.down = brain.downTap;
  out.shove = brain.shoveTap;
  brain.downTap = false;
  brain.shoveTap = false;
  return out;
}

import { getHeroDef } from './characters';
import { ARENA_WIDTH } from './constants';
import {
  AiPersonality,
  CharacterEntity,
  PlatformState,
  PlayerInputState,
  SimulationState,
} from './types';

function findPlatformUnder(
  x: number,
  footY: number,
  platforms: PlatformState[]
): PlatformState | null {
  let best: PlatformState | null = null;
  let bestDist = Infinity;
  for (const p of platforms) {
    if (p.crumbleState === 'fallen') continue;
    const inX = x >= p.x + 10 && x <= p.x + p.w - 10;
    if (inX && p.y >= footY - 12) {
      const dist = p.y - footY;
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
  }
  return best;
}

function findStandingPlatform(
  bot: CharacterEntity,
  platforms: PlatformState[]
): PlatformState | null {
  if (!bot.grounded) return null;
  const cx = bot.x + bot.w / 2;
  const footY = bot.y + bot.h;
  for (const p of platforms) {
    if (p.crumbleState === 'fallen') continue;
    if (cx >= p.x - 4 && cx <= p.x + p.w + 4 && Math.abs(footY - p.y) < 12) {
      return p;
    }
  }
  return null;
}

function findNearestSafePlatform(
  x: number,
  y: number,
  platforms: PlatformState[]
): PlatformState | null {
  let best: PlatformState | null = null;
  let bestScore = Infinity;
  for (const p of platforms) {
    if (p.crumbleState === 'fallen' || p.crumbleState === 'shaking') continue;
    const cx = p.x + p.w / 2;
    const clampedX = Math.max(p.x + 24, Math.min(p.x + p.w - 24, x));
    const dx = Math.abs(clampedX - x);
    const dy = Math.abs(p.y - y);
    const safetyBonus = p.type === 'crumbling' ? 140 : p.type === 'stone' ? -90 : 0;
    const score = dx + dy * 1.25 + safetyBonus;
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

function findSteppingPlatformTowards(
  botX: number,
  botY: number,
  targetY: number,
  platforms: PlatformState[]
): PlatformState | null {
  // Look for a platform higher than bot (reachable within ~170px jump arc)
  let best: PlatformState | null = null;
  let bestScore = Infinity;
  for (const p of platforms) {
    if (p.crumbleState === 'fallen' || p.crumbleState === 'shaking') continue;
    const dy = botY - p.y; // positive if p is above bot
    if (dy > 20 && dy < 175 && p.y >= targetY - 80) {
      const targetX = Math.max(p.x + 24, Math.min(p.x + p.w - 24, botX));
      const dx = Math.abs(targetX - botX);
      if (dx < 260) {
        const score = dx + dy * 0.8;
        if (score < bestScore) {
          bestScore = score;
          best = p;
        }
      }
    }
  }
  return best;
}

function isBlockingCeilingAbove(
  cx: number,
  topY: number,
  platforms: PlatformState[]
): boolean {
  for (const p of platforms) {
    if (p.oneWay || p.crumbleState === 'fallen') continue;
    if (
      cx >= p.x + 6 &&
      cx <= p.x + p.w - 6 &&
      p.y + p.h <= topY + 6 &&
      topY - (p.y + p.h) < 120
    ) {
      return true;
    }
  }
  return false;
}

function computeRawBotInput(
  bot: CharacterEntity,
  sim: SimulationState,
  dt: number
): PlayerInputState {
  const input: PlayerInputState = {
    left: false,
    right: false,
    upHeld: false,
    jumpPressed: false,
    down: false,
    abilityPressed: false,
  };

  if (!bot.alive || bot.eliminated || bot.stunTimer > 0) {
    return input;
  }

  bot.aiDecisionTimer -= dt;
  const cx = bot.x + bot.w / 2;
  const cy = bot.y + bot.h / 2;
  const footY = bot.y + bot.h;
  const hero = getHeroDef(bot.heroId);
  const canAbility = bot.abilityCooldown <= 0;

  // 1. Predictive edge & abyss survival check
  const lookaheadX = cx + bot.vx * 0.22;
  const floorUnderNow = findPlatformUnder(cx, footY, sim.platforms);
  const floorLookahead = findPlatformUnder(lookaheadX, footY, sim.platforms);
  const standingPlat = findStandingPlatform(bot, sim.platforms);

  const isOverAbyss = floorUnderNow === null;
  const isFallingLow = bot.y > 515 && !bot.grounded;
  const nearAbyssEdge =
    bot.grounded &&
    standingPlat !== null &&
    floorLookahead === null &&
    Math.abs(bot.vx) > 65;

  if (isOverAbyss || isFallingLow || (sim.worldWidth <= ARENA_WIDTH && (cx < 115 || cx > ARENA_WIDTH - 115))) {
    const safePlat = findNearestSafePlatform(cx, cy, sim.platforms);
    if (safePlat) {
      const targetX = Math.max(
        safePlat.x + 28,
        Math.min(safePlat.x + safePlat.w - 28, cx)
      );
      if (cx < targetX - 12) input.right = true;
      else if (cx > targetX + 12) input.left = true;

      if (
        (footY > safePlat.y - 10 || bot.vy > 150) &&
        bot.jumpsUsed < bot.maxJumps
      ) {
        input.jumpPressed = true;
        input.upHeld = true;
      } else if (bot.vy < 0) {
        input.upHeld = true;
      }

      // Emergency recovery ability if jumps are spent or falling dangerously low
      if (
        canAbility &&
        (bot.jumpsUsed >= bot.maxJumps || bot.y > 560) &&
        (hero.abilityKind === 'sky_hook' ||
          hero.abilityKind === 'high_spring' ||
          hero.abilityKind === 'wind_blink' ||
          hero.abilityKind === 'shadow_warp')
      ) {
        input.abilityPressed = true;
      }
      return input;
    }
  }

  // Prevent walking mindlessly off platform edges unless diving onto an enemy
  if (nearAbyssEdge && standingPlat) {
    const safeCenter = standingPlat.x + standingPlat.w / 2;
    if (cx < safeCenter) input.right = true;
    else input.left = true;
    return input;
  }

  // 2. Dodge cannon telegraph blasts & shaking crumbling platforms
  for (const cannon of sim.cannons) {
    if (!cannon.exploded && Math.abs(cx - cannon.x) < cannon.radius + 32) {
      if (cx < cannon.x) input.left = true;
      else input.right = true;
      if (bot.grounded) {
        input.jumpPressed = true;
        input.upHeld = true;
      }
      return input;
    }
  }

  if (standingPlat && standingPlat.type === 'crumbling' && standingPlat.crumbleState === 'shaking') {
    input.jumpPressed = true;
    input.upHeld = true;
    if (cx < sim.scrollX + ARENA_WIDTH / 2) input.right = true;
    else input.left = true;
    return input;
  }

  reachedCombat = true;
  // 3. Pick smartest enemy target
  const isTeamMode =
    sim.mode === 'team' || sim.mode === 'story' || sim.mode === 'saga' || sim.mode === 'adventure';
  const enemies = sim.players.filter(
    (p) =>
      p.slotIndex !== bot.slotIndex &&
      p.alive &&
      !p.eliminated &&
      (!isTeamMode || p.team !== bot.team)
  );

  if (enemies.length === 0 && sim.worldWidth > ARENA_WIDTH && bot.team === 'A') {
    const lead = sim.players.filter((p) => p.team === 'A' && !p.isBot && p.alive && !p.eliminated)[0];
    const goal = lead ? lead.x + lead.w / 2 - 90 - (bot.slotIndex % 3) * 40 : sim.scrollX + ARENA_WIDTH * 0.6;
    if (cx < goal - 30) input.right = true;
    else if (cx > goal + 30) input.left = true;
    const dir = input.right ? 1 : input.left ? -1 : 0;
    if (dir !== 0 && bot.grounded && (findPlatformUnder(cx + dir * 70, footY, sim.platforms) === null || (lead && lead.y + lead.h < footY - 40))) {
      input.jumpPressed = true;
      input.upHeld = true;
    }
    if (!bot.grounded && bot.vy < 0) input.upHeld = true;
    return input;
  }

  if (enemies.length === 0) {
    if (cx < sim.scrollX + ARENA_WIDTH / 2 - 40) input.right = true;
    else if (cx > sim.scrollX + ARENA_WIDTH / 2 + 40) input.left = true;
    return input;
  }

  if (sim.mode === 'crown' && sim.crownHolder == null && sim.crownX !== undefined) {
    if (cx < sim.crownX - 12) input.right = true;
    else if (cx > sim.crownX + 12) input.left = true;
    if (sim.crownY !== undefined && sim.crownY < bot.y - 10 && Math.abs(cx - sim.crownX) < 160) {
      input.jumpPressed = bot.grounded;
      input.upHeld = true;
    }
    return input;
  }

  let target = enemies[0];
  let bestScore = Infinity;
  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - bot.x, enemy.y - bot.y);
    // Slightly prioritize stunned or edge-exposed targets
    const vulnerableBonus = enemy.stunTimer > 0 ? -90 : 0;
    const crownBonus = sim.mode === 'crown' && enemy.slotIndex === sim.crownHolder ? -400 : 0;
    const score = dist + vulnerableBonus + crownBonus;
    if (score < bestScore) {
      bestScore = score;
      target = enemy;
    }
  }

  const tx = target.x + target.w / 2;
  const ty = target.y + target.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const absDx = Math.abs(dx);
  const distToTarget = Math.hypot(dx, dy);

  // 4. Counter-threat awareness (enemy diving on our head)
  const threatAbove = enemies.some(
    (e) =>
      Math.abs(e.x - bot.x) < 68 &&
      e.y < bot.y &&
      bot.y - e.y < 150 &&
      e.vy > 35
  );

  if (threatAbove) {
    if (canAbility && (hero.abilityKind === 'frost_shield' || hero.abilityKind === 'flame_burst' || hero.abilityKind === 'belly_dash')) {
      input.abilityPressed = true;
    }
    if (cx < sim.scrollX + ARENA_WIDTH / 2) input.right = true;
    else input.left = true;
    if (bot.grounded && bot.aiPersonality !== 'defensive') {
      input.jumpPressed = true;
      input.upHeld = true;
    }
    return input;
  }

  // 5. Tactical Special Ability Activation
  if (canAbility && distToTarget < 195) {
    if (
      (hero.abilityKind === 'flame_burst' || hero.abilityKind === 'gold_quake') &&
      distToTarget < 155 &&
      target.invulnTimer <= 0
    ) {
      input.abilityPressed = true;
    } else if (
      hero.abilityKind === 'belly_dash' &&
      Math.abs(dy) < 50 &&
      absDx > 40 &&
      absDx < 185 &&
      Math.sign(dx) === bot.facing
    ) {
      input.abilityPressed = true;
    } else if (hero.abilityKind === 'frost_shield' && distToTarget < 120) {
      input.abilityPressed = true;
    } else if (
      (hero.abilityKind === 'wind_blink' || hero.abilityKind === 'shadow_warp') &&
      absDx > 90 &&
      absDx < 190 &&
      Math.sign(dx) === bot.facing
    ) {
      input.abilityPressed = true;
    } else if (hero.abilityKind === 'high_spring' && dy < -60 && absDx < 130) {
      input.abilityPressed = true;
    }
  }

  // 6. Smart vertical navigation (climb stepping stone or drop through one-way)
  if (dy > 95 && standingPlat?.oneWay && bot.aiPersonality !== 'defensive') {
    input.down = true;
    if (dx > 16) input.right = true;
    else if (dx < -16) input.left = true;
    return input;
  }

  const ceilingBlocked = isBlockingCeilingAbove(cx, bot.y, sim.platforms);
  if (dy < -50 && ceilingBlocked && bot.grounded) {
    const stepPlat = findSteppingPlatformTowards(cx, footY, target.y, sim.platforms);
    if (stepPlat) {
      const stepX = Math.max(stepPlat.x + 24, Math.min(stepPlat.x + stepPlat.w - 24, cx));
      if (cx < stepX - 14) input.right = true;
      else if (cx > stepX + 14) input.left = true;
      if (Math.abs(cx - stepX) < 95 && bot.grounded) {
        input.jumpPressed = true;
        input.upHeld = true;
      }
      return input;
    }
  }

  // 7. Personality-driven combat behavior
  switch (bot.aiPersonality) {
    case 'aggressive': {
      if (dx > 12) input.right = true;
      else if (dx < -12) input.left = true;

      if (
        !ceilingBlocked &&
        (dy < -30 || (absDx < 115 && bot.y >= target.y - 28)) &&
        bot.jumpsUsed < bot.maxJumps
      ) {
        if (bot.grounded || (bot.vy > 25 && bot.y > target.y - 34)) {
          input.jumpPressed = true;
          input.upHeld = true;
        }
      }
      // Fast-fall head stomp dive!
      if (!bot.grounded && absDx < 36 && bot.y + bot.h < target.y + 12) {
        input.down = true;
      }
      if (bot.vy < -100) input.upHeld = true;
      break;
    }

    case 'defensive': {
      if (cx < 390) {
        input.right = true;
      } else if (cx > 890) {
        input.left = true;
      } else if (absDx < 180) {
        if (dx > 18) input.right = true;
        else if (dx < -18) input.left = true;
        if (!ceilingBlocked && dy < -35 && bot.grounded) {
          input.jumpPressed = true;
          input.upHeld = true;
        }
        if (!bot.grounded && absDx < 32 && bot.y < target.y - 20) {
          input.down = true;
        }
      } else {
        if (bot.aiDecisionTimer <= 0) {
          bot.aiWanderDir = cx > sim.scrollX + ARENA_WIDTH / 2 ? -1 : 1;
          bot.aiDecisionTimer = 1.0;
        }
        if (bot.aiWanderDir > 0) input.right = true;
        else input.left = true;
      }
      if (bot.vy < -120) input.upHeld = true;
      break;
    }

    case 'balanced': {
      if (absDx > 18) {
        if (dx > 0) input.right = true;
        else input.left = true;
      }
      if (
        !ceilingBlocked &&
        dy < -48 &&
        absDx < 220 &&
        (bot.grounded || (bot.vy > 60 && bot.jumpsUsed < bot.maxJumps))
      ) {
        input.jumpPressed = true;
        input.upHeld = true;
      } else if (!bot.grounded && absDx < 34 && bot.y < target.y - 22) {
        input.down = true;
      }
      if (bot.vy < -90) input.upHeld = true;
      break;
    }

    case 'chaotic': {
      if (bot.aiDecisionTimer <= 0) {
        const seed = Math.sin(sim.elapsedSec * 7.3 + bot.slotIndex * 2.1);
        bot.aiWanderDir = seed > -0.35 ? (dx >= 0 ? 1 : -1) : (dx >= 0 ? -1 : 1);
        bot.aiDecisionTimer = 0.42;
        if (!ceilingBlocked && bot.jumpsUsed < bot.maxJumps && Math.abs(seed) > 0.3) {
          input.jumpPressed = true;
          input.upHeld = true;
        }
      }
      if (bot.aiWanderDir > 0) input.right = true;
      else input.left = true;
      if (!bot.grounded && absDx < 40 && bot.y < target.y) {
        input.down = true;
      }
      if (bot.vy < -80) input.upHeld = true;
      break;
    }
  }

  return input;
}

let reachedCombat = false;

interface BotMind {
  react: number;
  held: PlayerInputState;
  attackCd: number;
  commit: number;
  retreat: number;
  idle: number;
  abilityGate: number;
  lastStomps: number;
}

const minds = new WeakMap<CharacterEntity, BotMind>();

const REACTION: Record<AiPersonality, [number, number]> = {
  aggressive: [0.13, 0.24],
  balanced: [0.17, 0.3],
  defensive: [0.2, 0.34],
  chaotic: [0.12, 0.38],
};

const ATTACK_CD: Record<AiPersonality, [number, number]> = {
  aggressive: [0.75, 1.4],
  balanced: [1.0, 1.9],
  defensive: [1.4, 2.4],
  chaotic: [0.6, 2.2],
};

const DODGE_CHANCE: Record<AiPersonality, number> = {
  aggressive: 0.5,
  balanced: 0.65,
  defensive: 0.8,
  chaotic: 0.4,
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const emptyInput = (): PlayerInputState => ({
  left: false,
  right: false,
  upHeld: false,
  jumpPressed: false,
  down: false,
  abilityPressed: false,
});

function nearestEnemy(bot: CharacterEntity, sim: SimulationState): CharacterEntity | null {
  const teamMode =
    sim.mode === 'team' || sim.mode === 'story' || sim.mode === 'saga' || sim.mode === 'adventure';
  let best: CharacterEntity | null = null;
  let bestD = Infinity;
  for (const p of sim.players) {
    if (p === bot || !p.alive || p.eliminated || (teamMode && p.team === bot.team)) continue;
    const d = Math.abs(p.x - bot.x) + Math.abs(p.y - bot.y) * 0.6;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/**
 * Human-like layer on top of the raw tactical policy: reaction delay,
 * attack cooldowns, spacing/retreat after a hit, imperfect dodges and
 * short hesitations. Survival manoeuvres (edges, hazards) stay instant.
 */
export function computeBotInput(
  bot: CharacterEntity,
  sim: SimulationState,
  dt: number
): PlayerInputState {
  const p = bot.aiPersonality;
  let mind = minds.get(bot);
  if (!mind) {
    mind = {
      react: rand(0.2, 0.45),
      held: emptyInput(),
      attackCd: rand(0.6, 1.4),
      commit: 0,
      retreat: 0,
      idle: 0,
      abilityGate: rand(1.5, 3),
      lastStomps: bot.stomps,
    };
    minds.set(bot, mind);
  }
  mind.react -= dt;
  mind.attackCd -= dt;
  mind.commit -= dt;
  mind.retreat -= dt;
  mind.idle -= dt;
  mind.abilityGate -= dt;

  reachedCombat = false;
  const raw = computeRawBotInput(bot, sim, dt);
  if (!reachedCombat) {
    mind.held = { ...raw, jumpPressed: false, abilityPressed: false };
    return raw;
  }

  if (bot.stomps > mind.lastStomps) {
    mind.retreat = rand(0.7, 1.3);
    mind.commit = 0;
    mind.attackCd = Math.max(mind.attackCd, rand(...ATTACK_CD[p]));
  }
  mind.lastStomps = bot.stomps;

  if (mind.react > 0) {
    const out = { ...mind.held, jumpPressed: false, abilityPressed: false };
    out.upHeld = raw.upHeld && bot.vy < 0;
    if (mind.commit > 0) out.down = raw.down;
    return out;
  }
  mind.react = rand(...REACTION[p]);

  const decided: PlayerInputState = { ...raw };
  const target = nearestEnemy(bot, sim);
  if (target) {
    const dx = target.x + target.w / 2 - (bot.x + bot.w / 2);
    const absDx = Math.abs(dx);
    const threatened =
      target.y < bot.y - 20 && absDx < 72 && target.vy > 30 && bot.grounded;

    if (threatened && Math.random() > DODGE_CHANCE[p]) {
      decided.left = mind.held.left;
      decided.right = mind.held.right;
      decided.jumpPressed = false;
      decided.abilityPressed = false;
    } else if (mind.idle > 0 && !threatened) {
      decided.left = false;
      decided.right = false;
      decided.jumpPressed = false;
      decided.down = false;
    } else if (mind.retreat > 0 && !threatened) {
      decided.left = dx > 0;
      decided.right = dx < 0;
      decided.jumpPressed = false;
      decided.down = false;
    } else if (mind.attackCd > 0 && mind.commit <= 0 && !threatened) {
      if (absDx < 110) {
        decided.left = dx > 0;
        decided.right = dx < 0;
      } else if (absDx < 175) {
        decided.left = false;
        decided.right = false;
        if (Math.random() < 0.45) {
          decided.left = dx < 0;
          decided.right = dx > 0;
        }
      }
      if (decided.jumpPressed && target.y >= bot.y - 40) decided.jumpPressed = false;
      decided.down = false;
    } else if (decided.jumpPressed && absDx < 170 && mind.commit <= 0) {
      mind.attackCd = rand(...ATTACK_CD[p]);
      mind.commit = 0.9;
    }

    if (mind.idle <= 0 && mind.retreat <= 0 && mind.commit <= 0 && Math.random() < 0.05) {
      mind.idle = rand(0.15, 0.45);
    }
  }

  if (decided.abilityPressed) {
    if (mind.abilityGate > 0) decided.abilityPressed = false;
    else mind.abilityGate = rand(2, 4.5);
  }
  mind.held = { ...decided, jumpPressed: false, abilityPressed: false };
  return decided;
}

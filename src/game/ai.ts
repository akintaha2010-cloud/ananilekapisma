import { getHeroDef } from './characters';
import { ARENA_WIDTH } from './constants';
import {
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

export function computeBotInput(
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

  if (isOverAbyss || isFallingLow || cx < 115 || cx > ARENA_WIDTH - 115) {
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
    if (cx < ARENA_WIDTH / 2) input.right = true;
    else input.left = true;
    return input;
  }

  // 3. Pick smartest enemy target
  const isTeamMode =
    sim.mode === 'team' || sim.mode === 'story' || sim.mode === 'saga';
  const enemies = sim.players.filter(
    (p) =>
      p.slotIndex !== bot.slotIndex &&
      p.alive &&
      !p.eliminated &&
      (!isTeamMode || p.team !== bot.team)
  );

  if (enemies.length === 0) {
    if (cx < ARENA_WIDTH / 2 - 40) input.right = true;
    else if (cx > ARENA_WIDTH / 2 + 40) input.left = true;
    return input;
  }

  let target = enemies[0];
  let bestScore = Infinity;
  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - bot.x, enemy.y - bot.y);
    // Slightly prioritize stunned or edge-exposed targets
    const vulnerableBonus = enemy.stunTimer > 0 ? -90 : 0;
    const score = dist + vulnerableBonus;
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
    if (cx < ARENA_WIDTH / 2) input.right = true;
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
          bot.aiWanderDir = cx > ARENA_WIDTH / 2 ? -1 : 1;
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

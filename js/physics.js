export const WORLD = { w: 1280, h: 720, gravity: 2300, killY: 790, waterY: 676 };

export const P = {
  w: 54,
  h: 58,
  accel: 3400,
  airAccel: 2200,
  friction: 2800,
  airDrag: 500,
  maxSpeed: 370,
  jump: 830,
  doubleJump: 730,
  poundSpeed: 1400,
  maxFall: 1150,
  stompBounce: 700,
  stompBounceHeld: 960,
  shoveSpeed: 780,
  shoveTime: 0.16,
  shoveCooldown: 0.7,
  knockback: 860,
  knockUp: 380,
  squashTime: 1.0,
  invulnAfterSquash: 1.6,
  invulnAfterRespawn: 2.0,
  coyoteTime: 0.08,
  jumpBuffer: 0.1,
  dropTime: 0.25,
  shockRadius: 170,
};

export function createPlayer(id, x, y, opts = {}) {
  const scale = opts.scale ?? 1;
  return {
    id,
    x,
    y,
    w: Math.round(P.w * scale),
    h: Math.round(P.h * scale),
    scale,
    spd: opts.spd ?? 1,
    mass: opts.mass ?? 1,
    team: opts.team ?? null,
    vx: 0,
    vy: 0,
    prevX: x,
    prevY: y,
    facing: 1,
    grounded: false,
    platform: null,
    airJumps: 1,
    state: 'normal',
    shoveT: 0,
    shoveCd: 0,
    invuln: 0,
    squashT: 0,
    dropT: 0,
    coyote: 0,
    jumpBuf: 0,
    splashed: false,
    lives: opts.lives ?? 3,
    stomps: 0,
    falls: 0,
    kills: 0,
  };
}

export const sameTeam = (a, b) => a.team != null && a.team === b.team;

export const centerX = (p) => p.x + p.w / 2;

export function overlapX(a, b) {
  return Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
}

export function overlapY(a, b) {
  return Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
}

export const isActive = (p) => p.state === 'normal' || p.state === 'pound';

function approach(v, target, amount) {
  if (v < target) return Math.min(v + amount, target);
  return Math.max(v - amount, target);
}

export function stepPlayer(p, inp, dt, level, events = []) {
  if (p.state !== 'out' && p.grounded && p.platform) {
    p.x += p.platform.dx || 0;
    p.y += p.platform.dy || 0;
  }
  p.prevX = p.x;
  p.prevY = p.y;
  if (p.state === 'out') return events;

  p.invuln = Math.max(0, p.invuln - dt);
  p.shoveCd = Math.max(0, p.shoveCd - dt);
  p.dropT = Math.max(0, p.dropT - dt);
  p.coyote = Math.max(0, p.coyote - dt);
  p.jumpBuf = Math.max(0, p.jumpBuf - dt);

  if (p.state === 'squashed') {
    p.squashT -= dt;
    p.vx = approach(p.vx, 0, P.friction * dt);
    p.vy = Math.min(p.vy + WORLD.gravity * dt, P.maxFall);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    collideLevel(p, level, events);
    if (p.squashT <= 0) {
      if (p.lives > 0) {
        p.state = 'normal';
        p.invuln = P.invulnAfterSquash;
        p.vy = -520;
        p.grounded = false;
        events.push({ type: 'unsquash', p });
      } else {
        p.state = 'out';
        events.push({ type: 'out', p });
      }
    }
    checkFall(p, events);
    return events;
  }

  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);

  if (p.shoveT > 0) {
    p.shoveT -= dt;
    p.vx = p.facing * P.shoveSpeed;
    if (p.vy > 0) p.vy *= 0.6;
  } else if (p.state !== 'pound') {
    const accel = p.grounded ? P.accel : P.airAccel;
    const max = P.maxSpeed * p.spd;
    if (dir) {
      p.facing = dir;
      if (Math.abs(p.vx) <= max || Math.sign(p.vx) !== dir) {
        p.vx = approach(p.vx, dir * max, accel * dt);
      } else {
        p.vx = approach(p.vx, dir * max, (p.grounded ? P.friction : P.airDrag) * dt);
      }
    } else {
      p.vx = approach(p.vx, 0, (p.grounded ? P.friction : P.airDrag) * dt);
    }
  }

  if (inp.jumpPressed) p.jumpBuf = P.jumpBuffer;
  if (p.jumpBuf > 0 && p.state !== 'pound') {
    if (p.grounded || p.coyote > 0) {
      p.vy = -P.jump;
      p.grounded = false;
      p.platform = null;
      p.coyote = 0;
      p.jumpBuf = 0;
      events.push({ type: 'jump', p });
    } else if (inp.jumpPressed && p.airJumps > 0) {
      p.vy = -P.doubleJump;
      p.airJumps -= 1;
      p.jumpBuf = 0;
      events.push({ type: 'doublejump', p });
    }
  }

  if (inp.downPressed) {
    if (p.grounded && p.platform && !p.platform.solid) {
      p.dropT = P.dropTime;
      p.grounded = false;
      p.platform = null;
      p.vy = Math.max(p.vy, 120);
      events.push({ type: 'drop', p });
    } else if (!p.grounded && p.state !== 'pound') {
      p.state = 'pound';
      p.shoveT = 0;
      p.vx *= 0.15;
      p.vy = P.poundSpeed * 0.7;
      events.push({ type: 'pound', p });
    }
  }

  if (inp.shovePressed && p.shoveCd <= 0 && p.state !== 'pound') {
    if (dir) p.facing = dir;
    p.shoveT = P.shoveTime;
    p.shoveCd = P.shoveCooldown;
    events.push({ type: 'shove', p });
  }

  let g = WORLD.gravity;
  if (p.state === 'pound') g *= 1.8;
  else if (p.vy < 0 && !inp.jump) g *= 1.9;
  p.vy += g * dt;
  p.vy = Math.min(p.vy, p.state === 'pound' ? P.poundSpeed : P.maxFall);

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  collideLevel(p, level, events);
  checkFall(p, events);
  return events;
}

function checkFall(p, events) {
  if (!p.splashed && p.y + p.h > WORLD.waterY + 14) {
    p.splashed = true;
    events.push({ type: 'splash', p });
  }
  if (p.y > WORLD.killY) {
    events.push({ type: 'fall', p });
  }
}

export function collideLevel(p, level, events = []) {
  const wasGrounded = p.grounded;
  const fallSpeed = p.vy;
  p.grounded = false;
  let landedOn = null;

  if (p.vy >= 0) {
    const prevBottom = p.prevY + p.h;
    const bottom = p.y + p.h;
    for (const pl of level.platforms) {
      if (!pl.solid && p.dropT > 0) continue;
      const plPrevX = pl.x - (pl.dx || 0);
      const left = Math.min(pl.x, plPrevX);
      const right = Math.max(pl.x, plPrevX) + pl.w;
      if (p.x + p.w - 8 <= left || p.x + 8 >= right) continue;
      const plPrevY = pl.y - (pl.dy || 0);
      if (prevBottom <= Math.max(pl.y, plPrevY) + 0.5 && bottom >= pl.y) {
        if (!landedOn || pl.y < landedOn.y) landedOn = pl;
      }
    }
  }

  if (landedOn) {
    p.y = landedOn.y - p.h;
    p.vy = 0;
    p.grounded = true;
    p.platform = landedOn;
    p.airJumps = 1;
    if (!wasGrounded) {
      if (p.state === 'pound') {
        p.state = 'normal';
        events.push({ type: 'poundland', p, speed: fallSpeed });
      } else {
        events.push({ type: 'land', p, speed: fallSpeed });
      }
    }
  } else {
    if (wasGrounded && p.vy >= 0) p.coyote = P.coyoteTime;
    p.platform = null;
  }

  for (const pl of level.platforms) {
    if (!pl.solid || !pl.h) continue;
    const box = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
    if (overlapX(p, box) <= 0 || overlapY(p, box) <= 1) continue;
    if (p.prevY >= pl.y + pl.h - 1) {
      p.y = pl.y + pl.h;
      p.vy = Math.max(0, p.vy);
      continue;
    }
    if (p.prevX + p.w / 2 < pl.x + pl.w / 2) p.x = pl.x - p.w;
    else p.x = pl.x + pl.w;
    p.vx = 0;
    p.shoveT = 0;
  }

  if (p.x < 0) {
    p.x = 0;
    p.vx = Math.max(0, p.vx);
  } else if (p.x + p.w > WORLD.w) {
    p.x = WORLD.w - p.w;
    p.vx = Math.min(0, p.vx);
  }
  return events;
}

export function isStomp(top, bottom) {
  if (top.vy - bottom.vy <= 0) return false;
  if (overlapX(top, bottom) < 10) return false;
  return top.prevY + top.h <= bottom.prevY + 16;
}

function stomp(top, bottom, jumpHeld, events) {
  const wasPound = top.state === 'pound';
  top.y = bottom.y - top.h;
  top.vy = -(jumpHeld ? P.stompBounceHeld : P.stompBounce);
  top.state = 'normal';
  top.airJumps = 1;
  top.grounded = false;
  top.platform = null;
  if (bottom.invuln > 0 || sameTeam(top, bottom)) {
    events.push({ type: 'bonk', p: top, victim: bottom });
    return;
  }
  bottom.lives -= 1;
  bottom.state = 'squashed';
  bottom.squashT = P.squashTime / Math.sqrt(bottom.mass);
  bottom.shoveT = 0;
  bottom.vx = 0;
  top.stomps += 1;
  events.push({ type: 'stomp', p: top, victim: bottom, pound: wasPound });
}

function knock(attacker, victim, events) {
  const m = Math.max(0.4, victim.mass / attacker.mass);
  victim.vx = (attacker.facing * P.knockback) / m;
  victim.vy = -P.knockUp / Math.sqrt(m);
  victim.grounded = false;
  victim.platform = null;
  victim.shoveT = 0;
  attacker.shoveT = 0;
  attacker.vx = -attacker.facing * 120;
  events.push({ type: 'shoved', p: attacker, victim });
}

export function resolvePlayers(players, inputs, events = []) {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      if (!isActive(a) || !isActive(b)) continue;
      if (overlapX(a, b) <= 0 || overlapY(a, b) <= 0) continue;

      if (isStomp(a, b)) {
        stomp(a, b, inputs[i]?.jump, events);
        continue;
      }
      if (isStomp(b, a)) {
        stomp(b, a, inputs[j]?.jump, events);
        continue;
      }

      const ox = overlapX(a, b);
      const dirA = centerX(a) < centerX(b) ? -1 : 1;
      a.x += (dirA * ox) / 2;
      b.x -= (dirA * ox) / 2;

      const friends = sameTeam(a, b);
      const aHits = !friends && a.shoveT > 0 && a.facing === -dirA;
      const bHits = !friends && b.shoveT > 0 && b.facing === dirA;
      if (aHits && bHits) {
        a.vx = dirA * P.knockback * 0.6;
        b.vx = -dirA * P.knockback * 0.6;
        a.vy = b.vy = -P.knockUp * 0.7;
        a.shoveT = b.shoveT = 0;
        a.grounded = b.grounded = false;
        events.push({ type: 'clash', p: a, victim: b });
      } else if (aHits && b.invuln <= 0) {
        knock(a, b, events);
      } else if (bHits && a.invuln <= 0) {
        knock(b, a, events);
      } else {
        const towardA = a.vx * -dirA;
        const towardB = b.vx * dirA;
        if (towardA > 0 || towardB > 0) {
          const avg = (a.vx + b.vx) / 2;
          a.vx = avg;
          b.vx = avg;
        }
      }
    }
  }
  return events;
}

export function applyShockwave(src, players, events = []) {
  const cx = centerX(src);
  const bottom = src.y + src.h;
  const radius = P.shockRadius * Math.sqrt(src.scale || 1);
  for (const o of players) {
    if (o === src || !isActive(o) || o.invuln > 0 || sameTeam(src, o)) continue;
    const dx = centerX(o) - cx;
    const dy = o.y + o.h - bottom;
    if (Math.abs(dx) > radius || Math.abs(dy) > 24 || !o.grounded) continue;
    const power = (1 - Math.abs(dx) / radius) * Math.min(1.6, src.mass / o.mass);
    o.vx = Math.sign(dx || 1) * (360 + 420 * power);
    o.vy = -(300 + 300 * power);
    o.grounded = false;
    o.platform = null;
    events.push({ type: 'shocked', p: src, victim: o });
  }
  return events;
}

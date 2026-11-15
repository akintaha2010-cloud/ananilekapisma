import { MASCOT_EARS, MASCOT_QUILLS } from '../game/mascot';
import { ActKind } from './types';

export interface Look {
  skin: string;
  skinD: string;
  hair: string;
  hairStyle: 'messy' | 'short' | 'long' | 'bun' | 'none' | 'spiky';
  top: string;
  topD: string;
  inner?: string;
  pants: string;
  pantsD: string;
  shoe: string;
  eyes: 'sun' | 'dot' | 'visor' | 'glow' | 'angry';
  eyeC?: string;
  hat?: 'crown' | 'helmet' | 'chef' | 'hood' | 'horns' | 'cap' | 'antenna' | 'tiara';
  hatC?: string;
  cape?: string;
  beard?: string;
  dress?: string;
  dressD?: string;
  pattern?: 'flowers' | 'split' | 'bug' | 'ice' | 'apron' | 'armor' | 'code';
  badge?: boolean;
  item?: 'hammer' | 'skewer' | 'megaphone' | 'shield' | 'tea' | 'clock' | 'scepter' | 'keyboard' | 'doner' | 'cay' | 'simit' | 'laptop' | 'tray';
}

const OUT = '#14101C';

export const LOOKS: Record<string, Look> = {
  akin: { skin: '#F4C49C', skinD: '#D99A6C', hair: '#4A2C1D', hairStyle: 'messy', top: '#7CC6E8', topD: '#4E9CC4', inner: '#FFFFFF', pants: '#262433', pantsD: '#17151F', shoe: '#F1F5F9', eyes: 'sun', pattern: 'flowers', badge: true },
  ozgur: { skin: '#F2C29B', skinD: '#D8A07A', hair: '#7C2D12', hairStyle: 'long', top: '#E879F9', topD: '#C026D3', pants: '#F2C29B', pantsD: '#D8A07A', shoe: '#FDE047', eyes: 'dot', hat: 'tiara', hatC: '#FACC15', dress: '#DB2777', dressD: '#9D174D', cape: '#A855F7', item: 'tea' },
  mert: { skin: '#E0A878', skinD: '#B57F55', hair: '#111827', hairStyle: 'short', top: '#991B1B', topD: '#5F0F0F', inner: '#27272A', pants: '#18181B', pantsD: '#0A0A0C', shoe: '#7F1D1D', eyes: 'glow', eyeC: '#F87171', hat: 'helmet', hatC: '#3F3F46', pattern: 'armor', item: 'hammer' },
  tuna: { skin: '#D99A6C', skinD: '#B27449', hair: '#292524', hairStyle: 'short', top: '#F8FAFC', topD: '#CBD5E1', inner: '#F97316', pants: '#44403C', pantsD: '#292524', shoe: '#292524', eyes: 'angry', hat: 'chef', hatC: '#FFFFFF', beard: '#292524', pattern: 'apron', item: 'skewer' },
  ayaz: { skin: '#BAE6FD', skinD: '#7DD3FC', hair: '#F0F9FF', hairStyle: 'spiky', top: '#38BDF8', topD: '#0369A1', inner: '#E0F2FE', pants: '#075985', pantsD: '#0C4A6E', shoe: '#E0F2FE', eyes: 'glow', eyeC: '#FFFFFF', beard: '#F0F9FF', pattern: 'ice' },
  gokoz: { skin: '#C4B5FD', skinD: '#A78BFA', hair: '#1E1B4B', hairStyle: 'messy', top: '#4C1D95', topD: '#2E1065', inner: '#22D3EE', pants: '#1E1B4B', pantsD: '#0F0B2E', shoe: '#22D3EE', eyes: 'visor', eyeC: '#22D3EE', hat: 'hood', hatC: '#312E81', cape: '#6D28D9', pattern: 'code', item: 'clock' },
  buglord: { skin: '#4ADE80', skinD: '#16A34A', hair: '#052E16', hairStyle: 'none', top: '#14532D', topD: '#052E16', inner: '#A3E635', pants: '#022C22', pantsD: '#011A14', shoe: '#A3E635', eyes: 'glow', eyeC: '#F43F5E', hat: 'crown', hatC: '#A3E635', cape: '#166534', pattern: 'bug', item: 'scepter' },
  bug: { skin: '#86EFAC', skinD: '#4ADE80', hair: '#14532D', hairStyle: 'none', top: '#1F2937', topD: '#111827', inner: '#4ADE80', pants: '#374151', pantsD: '#1F2937', shoe: '#14532D', eyes: 'glow', eyeC: '#FDE047', hat: 'antenna', hatC: '#14532D', pattern: 'bug' },
  glitch: { skin: '#D8B4FE', skinD: '#A855F7', hair: '#3B0764', hairStyle: 'spiky', top: '#7E22CE', topD: '#581C87', inner: '#F0ABFC', pants: '#3B0764', pantsD: '#2E1065', shoe: '#F0ABFC', eyes: 'visor', eyeC: '#F0ABFC', pattern: 'code' },
  spammer: { skin: '#FDBA74', skinD: '#F97316', hair: '#7C2D12', hairStyle: 'short', top: '#EA580C', topD: '#9A3412', inner: '#FED7AA', pants: '#431407', pantsD: '#2A0C04', shoe: '#FED7AA', eyes: 'angry', hat: 'cap', hatC: '#9A3412', item: 'megaphone' },
  firewall: { skin: '#FCA5A5', skinD: '#EF4444', hair: '#450A0A', hairStyle: 'short', top: '#B91C1C', topD: '#7F1D1D', inner: '#FB923C', pants: '#450A0A', pantsD: '#2B0505', shoe: '#FB923C', eyes: 'angry', hat: 'helmet', hatC: '#DC2626', pattern: 'armor', item: 'shield' },
  conflict: { skin: '#FDE68A', skinD: '#F59E0B', hair: '#292524', hairStyle: 'spiky', top: '#DC2626', topD: '#16A34A', inner: '#FDE047', pants: '#1C1917', pantsD: '#0C0A09', shoe: '#78716C', eyes: 'angry', pattern: 'split' },
  coder: { skin: '#E8B48A', skinD: '#C68B5E', hair: '#111827', hairStyle: 'bun', top: '#EC3750', topD: '#A61B33', inner: '#FFFFFF', pants: '#1E3A8A', pantsD: '#172554', shoe: '#F8FAFC', eyes: 'dot', badge: true, item: 'laptop' },
  npc: { skin: '#D99A6C', skinD: '#B27449', hair: '#D6D3D1', hairStyle: 'short', top: '#F8FAFC', topD: '#CBD5E1', inner: '#1F2937', pants: '#1F2937', pantsD: '#111827', shoe: '#111827', eyes: 'dot', beard: '#D6D3D1', item: 'tray' },
  simitci: { skin: '#E0A878', skinD: '#B57F55', hair: '#292524', hairStyle: 'short', top: '#0EA5E9', topD: '#0369A1', inner: '#FFFFFF', pants: '#292524', pantsD: '#1C1917', shoe: '#111827', eyes: 'dot', hat: 'cap', hatC: '#B91C1C', item: 'simit' },
};

export interface PoseIn {
  act: ActKind;
  t: number;
  actT: number;
  actDur: number;
  vx: number;
  vy: number;
  ground: boolean;
  item?: Look['item'] | null;
  phase?: number;
}

interface Pose {
  armF: [number, number];
  armB: [number, number];
  legF: [number, number];
  legB: [number, number];
  tilt: number;
  crouch: number;
  lean: number;
  lie: boolean;
  itemAng: number;
}

function poseFor(p: PoseIn): Pose {
  const k = p.actDur > 0 ? Math.min(1, p.actT / p.actDur) : 0;
  const ph = p.phase ?? 0;
  const breathe = Math.sin(p.t * 3 + ph) * 0.06;
  const pose: Pose = { armF: [0.5 + breathe, 1.9], armB: [0.3 - breathe, 1.7], legF: [0.18, -0.05], legB: [-0.18, 0.05], tilt: 0, crouch: 0, lean: 0, lie: false, itemAng: 0.4 };
  const moving = Math.abs(p.vx) > 15 && p.ground;
  if (moving && p.act === 'none') {
    const w = p.t * 11 + ph;
    const sw = Math.sin(w);
    pose.legF = [sw * 0.75, sw > 0 ? -0.1 : -0.7];
    pose.legB = [-sw * 0.75, sw < 0 ? -0.1 : -0.7];
    pose.armF = [-sw * 0.8 + 0.2, 0.9];
    pose.armB = [sw * 0.8 + 0.2, 0.9];
    pose.tilt = 0.08;
    pose.crouch = Math.abs(Math.cos(w)) > 0.7 ? 1 : 0;
  }
  if (!p.ground && (p.act === 'none' || p.act === 'block')) {
    if (p.vy < 0) {
      pose.legF = [0.9, -1.5];
      pose.legB = [-0.3, -0.6];
      pose.armF = [2.6, 0.2];
      pose.armB = [-2.2, -0.2];
    } else {
      pose.legF = [0.4, -0.6];
      pose.legB = [-0.2, -0.3];
      pose.armF = [1.9, 0.5];
      pose.armB = [-1.6, -0.4];
    }
  }
  switch (p.act) {
    case 'p1':
    case 'attack': {
      const ext = k < 0.25 ? k / 0.25 : k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
      pose.armF = [0.6 + ext * 1.0, 1.9 - ext * 1.9 + 1.0 * ext];
      pose.armF[1] = pose.armF[0] + (1 - ext) * 1.3;
      pose.lean = ext * 2;
      pose.legF = [0.45, -0.1];
      pose.legB = [-0.45, 0];
      break;
    }
    case 'p2': {
      const ext = k < 0.25 ? k / 0.25 : k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
      pose.armB = [0.4 + ext * 1.2, 0.4 + ext * 1.2 + (1 - ext) * 1.2];
      pose.armF = [0.3, 2.2];
      pose.lean = ext * 3;
      pose.tilt = 0.12 * ext;
      pose.legF = [0.45, -0.1];
      pose.legB = [-0.45, 0];
      break;
    }
    case 'kick': {
      const ext = k < 0.3 ? k / 0.3 : k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
      pose.legF = [ext * 1.65, ext * 1.65 - (1 - ext) * 1.4];
      pose.legB = [-0.15, 0];
      pose.tilt = -0.28 * ext;
      pose.armF = [-0.6, 0.6];
      pose.armB = [1.2, 2.0];
      break;
    }
    case 'jkick':
      pose.legF = [1.25, 1.3];
      pose.legB = [-0.5, -1.6];
      pose.armF = [-1.0, -0.6];
      pose.armB = [-1.4, -1.0];
      pose.tilt = -0.2;
      break;
    case 'slide':
      pose.lie = false;
      pose.crouch = 9;
      pose.tilt = -0.6;
      pose.legF = [1.55, 1.55];
      pose.legB = [0.6, -1.0];
      pose.armF = [-0.8, -0.4];
      pose.armB = [-1.6, -1.2];
      break;
    case 'throw':
    case 'cast': {
      const a = -2.2 + k * 4.2;
      pose.armF = [a, a + 0.1];
      pose.lean = k * 2;
      pose.legF = [0.4, 0];
      pose.legB = [-0.4, 0];
      if (p.act === 'cast') {
        pose.armF = [2.2, 2.0];
        pose.armB = [2.4, 2.2];
      }
      break;
    }
    case 'swing': {
      const a = 3.0 - k * 2.4;
      pose.armF = [a, a];
      pose.itemAng = a;
      pose.lean = k * 3;
      pose.legF = [0.5, 0];
      pose.legB = [-0.45, 0];
      break;
    }
    case 'special':
      pose.armF = [3.0, 3.0];
      pose.armB = [-3.0, -3.0];
      pose.legF = [0.4, 0];
      pose.legB = [-0.4, 0];
      pose.crouch = k < 0.3 ? 3 : 0;
      break;
    case 'hurt':
      pose.tilt = -0.35;
      pose.armF = [2.4, 2.8];
      pose.armB = [-2.0, -2.5];
      pose.lean = -2;
      break;
    case 'down':
      pose.lie = true;
      pose.armF = [2.6, 2.8];
      pose.armB = [-2.6, -2.8];
      break;
    case 'block':
      pose.crouch = 5;
      pose.armF = [1.0, 2.9];
      pose.armB = [1.2, 2.9];
      pose.legF = [0.6, -0.8];
      pose.legB = [-0.6, -0.4];
      break;
    case 'windup':
      pose.armF = [-1.3, -2.2];
      pose.armB = [0.9, 2.0];
      pose.tilt = -0.15;
      pose.lean = -2;
      pose.legF = [0.4, -0.1];
      pose.legB = [-0.45, 0];
      break;
    case 'dash':
      pose.tilt = 0.45;
      pose.armF = [-1.4, -1.2];
      pose.armB = [-1.6, -1.4];
      pose.legF = [Math.sin(p.t * 20) * 0.8, -0.4];
      pose.legB = [-Math.sin(p.t * 20) * 0.8, -0.4];
      break;
    case 'spin':
      pose.armF = [1.57, 1.57];
      pose.armB = [-1.57, -1.57];
      pose.itemAng = 1.57;
      break;
    case 'slam':
      pose.crouch = 5;
      pose.armF = [1.2, 1.0];
      pose.armB = [1.0, 0.9];
      pose.itemAng = 1.6;
      pose.tilt = 0.25;
      break;
  }
  return pose;
}

function limb(ctx: CanvasRenderingContext2D, x0: number, y0: number, a1: number, a2: number, l1: number, l2: number, th: number, col: string) {
  const x1 = x0 + Math.sin(a1) * l1;
  const y1 = y0 + Math.cos(a1) * l1;
  const x2 = x1 + Math.sin(a2) * l2;
  const y2 = y1 + Math.cos(a2) * l2;
  ctx.fillStyle = col;
  const seg = (ax: number, ay: number, bx: number, by: number) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let i = 0; i <= n; i++) {
      const x = ax + ((bx - ax) * i) / n;
      const y = ay + ((by - ay) * i) / n;
      ctx.fillRect(Math.round(x - th / 2), Math.round(y - th / 2), th, th);
    }
  };
  seg(x0, y0, x1, y1);
  seg(x1, y1, x2, y2);
  return [Math.round(x2), Math.round(y2)] as const;
}

export function drawItemExport(ctx: CanvasRenderingContext2D, item: NonNullable<Look['item']>, hx: number, hy: number, ang = 0.4) {
  drawItem(ctx, item, hx, hy, ang);
}

function drawItem(ctx: CanvasRenderingContext2D, item: NonNullable<Look['item']>, hx: number, hy: number, ang: number) {
  const R = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(hx + x, hy + y, w, h);
  };
  switch (item) {
    case 'hammer':
    case 'skewer':
    case 'scepter':
    case 'keyboard': {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-ang + Math.PI);
      const r = (x: number, y: number, w: number, h: number, c: string) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, h);
      };
      if (item === 'hammer') {
        r(-1, -2, 3, 18, OUT);
        r(0, -1, 1, 16, '#78716C');
        r(-6, 12, 13, 9, OUT);
        r(-5, 13, 11, 7, '#3F3F46');
        r(-4, 14, 2, 2, '#F87171');
        r(1, 14, 2, 2, '#FDE047');
        r(-4, 17, 9, 1, '#71717A');
      } else if (item === 'skewer') {
        r(0, -2, 1, 26, '#D6D3D1');
        r(-4, 6, 9, 14, OUT);
        r(-3, 7, 7, 12, '#B45309');
        r(-3, 9, 7, 1, '#F59E0B');
        r(-3, 13, 7, 1, '#78350F');
        r(-3, 16, 7, 1, '#F59E0B');
        r(-2, -3, 3, 2, OUT);
      } else if (item === 'scepter') {
        r(-1, -2, 3, 20, OUT);
        r(0, -1, 1, 18, '#A3E635');
        r(-3, 16, 7, 7, OUT);
        r(-2, 17, 5, 5, '#F43F5E');
      } else {
        r(-3, -1, 7, 18, OUT);
        r(-2, 0, 5, 16, '#334155');
        for (let i = 1; i < 15; i += 3) {
          r(-1, i, 1, 1, '#CBD5E1');
          r(1, i + 1, 1, 1, i % 2 ? '#22D3EE' : '#F472B6');
        }
      }
      ctx.restore();
      break;
    }
    case 'megaphone':
      R(0, -3, 8, 6, OUT);
      R(1, -2, 6, 4, '#FDE047');
      R(7, -5, 3, 10, OUT);
      R(7, -4, 2, 8, '#F8FAFC');
      break;
    case 'shield':
      R(-2, -10, 9, 16, OUT);
      R(-1, -9, 7, 14, '#F97316');
      R(1, -6, 3, 8, '#FDE047');
      R(-1, -1, 7, 1, '#9A3412');
      break;
    case 'tea':
    case 'cay':
      R(0, -4, 4, 6, OUT);
      R(1, -3, 2, 4, '#B91C1C');
      R(1, -4, 2, 1, '#FEE2E2');
      break;
    case 'clock':
      R(0, -4, 8, 8, OUT);
      R(1, -3, 6, 6, '#22D3EE');
      R(3, -2, 1, 3, OUT);
      R(3, 0, 3, 1, OUT);
      break;
    case 'doner':
      R(0, -3, 9, 6, OUT);
      R(1, -2, 7, 4, '#FDE68A');
      R(2, -2, 5, 2, '#B45309');
      R(2, 0, 2, 1, '#22C55E');
      break;
    case 'simit':
      R(0, -4, 8, 8, OUT);
      R(1, -3, 6, 6, '#B45309');
      R(3, -1, 2, 2, OUT);
      R(2, -3, 1, 1, '#FEF3C7');
      R(5, 1, 1, 1, '#FEF3C7');
      break;
    case 'laptop':
      R(-1, -2, 12, 2, OUT);
      R(0, -10, 10, 8, OUT);
      R(1, -9, 8, 6, '#38BDF8');
      R(3, -7, 3, 2, '#EC3750');
      break;
    case 'tray':
      R(-2, -1, 12, 2, '#CBD5E1');
      for (let i = 0; i < 3; i++) {
        R(i * 4 - 1, -6, 3, 5, OUT);
        R(i * 4, -5, 1, 3, '#B91C1C');
      }
      break;
  }
}

export function drawFigure(
  ctx: CanvasRenderingContext2D,
  look: Look,
  p: PoseIn,
  x: number,
  y: number,
  facing: number,
  scale = 1,
  flash = false
) {
  const pose = poseFor(p);
  const c = (col: string) => (flash ? '#FFFFFF' : col);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (scale !== 1) ctx.scale(scale, scale);
  if (facing < 0) ctx.scale(-1, 1);
  if (pose.lie) {
    ctx.translate(0, -3);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-2, 12);
  }
  const hipY = -13 + pose.crouch;
  const hipX = pose.lean * 0.4;
  const legLen = 7;
  const R = (x0: number, y0: number, w: number, h: number, col: string) => {
    ctx.fillStyle = c(col);
    ctx.fillRect(x0, y0, w, h);
  };
  const drawLeg = (a: [number, number], front: boolean) => {
    const col = front ? look.pants : look.pantsD;
    const hx = hipX + (front ? 1 : -1);
    limb(ctx, hx, hipY, a[0], a[0] + a[1], legLen, legLen, 5, c(OUT));
    const [fx, fy] = limb(ctx, hx, hipY, a[0], a[0] + a[1], legLen, legLen, 3, c(col));
    R(fx - 2, fy - 1, 7, 4, OUT);
    R(fx - 1, fy, 5, 2, look.shoe);
  };
  const shoulderY = hipY - 10;
  const drawArm = (a: [number, number], front: boolean) => {
    const sx = hipX + pose.lean * 0.6 + (front ? 2 : -2);
    const col = front ? look.top : look.topD;
    limb(ctx, sx, shoulderY + 1, a[0], a[1], 6, 6, 5, c(OUT));
    const [hx, hy] = limb(ctx, sx, shoulderY + 1, a[0], a[1], 6, 6, 3, c(col));
    R(hx - 2, hy - 2, 4, 4, OUT);
    R(hx - 1, hy - 1, 3, 3, look.skin);
    return [hx, hy] as const;
  };
  if (look.cape) {
    const fl = Math.round(Math.sin(p.t * 8 + (p.phase ?? 0)) * 1.5 - p.vx * 0.02);
    R(hipX - 8, shoulderY - 1, 6, 15, OUT);
    R(hipX - 7 + Math.min(0, fl), shoulderY, 5, 14 + Math.abs(fl), look.cape);
  }
  drawArm(pose.armB, false);
  drawLeg(pose.legB, false);
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(pose.tilt);
  ctx.translate(pose.lean * 0.6 - hipX, -hipY);
  const tx = hipX - 5;
  const ty = shoulderY - 1;
  R(tx - 1, ty - 1, 12, 13, OUT);
  R(tx, ty, 10, 11, look.top);
  R(tx, ty + 9, 10, 2, look.topD);
  if (look.inner) R(tx + 4, ty, 2, 9, look.inner);
  switch (look.pattern) {
    case 'flowers':
      R(tx + 1, ty + 2, 1, 1, '#F6E7C1');
      R(tx + 2, ty + 6, 1, 1, '#E58FA0');
      R(tx + 7, ty + 1, 1, 1, '#E58FA0');
      R(tx + 8, ty + 5, 1, 1, '#F6E7C1');
      break;
    case 'split':
      R(tx + 5, ty, 5, 11, look.topD);
      R(tx + 4, ty, 2, 11, '#FDE047');
      break;
    case 'bug':
      R(tx + 3, ty + 3, 4, 4, look.inner ?? '#4ADE80');
      R(tx + 2, ty + 4, 1, 1, look.inner ?? '#4ADE80');
      R(tx + 7, ty + 4, 1, 1, look.inner ?? '#4ADE80');
      break;
    case 'ice':
      R(tx + 2, ty + 2, 2, 2, '#F0F9FF');
      R(tx + 6, ty + 5, 2, 2, '#F0F9FF');
      break;
    case 'apron':
      R(tx + 2, ty + 3, 6, 8, '#F97316');
      R(tx + 3, ty + 4, 4, 1, '#FDBA74');
      break;
    case 'armor':
      R(tx, ty, 10, 3, '#71717A');
      R(tx + 1, ty + 1, 8, 1, '#A1A1AA');
      R(tx + 4, ty + 4, 2, 2, '#FDE047');
      break;
    case 'code':
      R(tx + 2, ty + 3, 1, 1, '#22D3EE');
      R(tx + 4, ty + 6, 2, 1, '#22D3EE');
      R(tx + 7, ty + 2, 1, 2, '#22D3EE');
      break;
  }
  if (look.badge) {
    R(tx + 3, ty, 1, 4, OUT);
    R(tx + 6, ty, 1, 4, OUT);
    R(tx + 3, ty + 4, 4, 3, OUT);
    R(tx + 4, ty + 5, 2, 1, '#FDE047');
  }
  if (look.dress) {
    const dy = hipY - 1;
    for (let i = 0; i < 9; i++) {
      const hw = 5 + Math.floor(i * 0.7);
      R(hipX - hw - 1, dy + i, hw * 2 + 2, 1, OUT);
      R(hipX - hw, dy + i, hw * 2, 1, i > 6 ? look.dressD ?? look.dress : look.dress);
    }
    R(hipX - 4, dy + 2, 1, 1, '#FDE047');
    R(hipX + 2, dy + 4, 1, 1, '#FDE047');
    R(hipX - 1, dy + 6, 1, 1, '#FDE047');
  }
  // head
  const hx0 = hipX - 5 + pose.lean * 0.2;
  const hy0 = shoulderY - 11;
  R(hx0 - 1, hy0 - 1, 12, 12, OUT);
  R(hx0, hy0, 10, 10, look.skin);
  R(hx0, hy0 + 8, 10, 2, look.skinD);
  R(hx0 + 9, hy0 + 4, 2, 3, look.skinD);
  if (look.beard) {
    R(hx0, hy0 + 6, 10, 4, look.beard);
    R(hx0 + 2, hy0 + 10, 6, 2, look.beard);
  }
  const hair = look.hair;
  switch (look.hairStyle) {
    case 'messy':
      R(hx0 - 2, hy0 - 3, 14, 5, OUT);
      R(hx0 - 1, hy0 - 2, 12, 3, hair);
      R(hx0 - 1, hy0 + 1, 3, 3, hair);
      R(hx0 + 1, hy0 - 5, 2, 3, hair);
      R(hx0 + 5, hy0 - 6 + (Math.floor(p.t * 3) % 2), 2, 4, hair);
      R(hx0 + 8, hy0 - 4, 3, 2, hair);
      break;
    case 'short':
      R(hx0 - 1, hy0 - 2, 12, 4, OUT);
      R(hx0, hy0 - 1, 10, 3, hair);
      R(hx0, hy0 + 2, 2, 2, hair);
      break;
    case 'spiky':
      R(hx0 - 1, hy0 - 2, 12, 4, OUT);
      R(hx0, hy0 - 1, 10, 3, hair);
      for (let i = 0; i < 4; i++) R(hx0 + i * 3, hy0 - 4 - (i % 2), 2, 3, hair);
      break;
    case 'long':
      R(hx0 - 2, hy0 - 2, 14, 4, OUT);
      R(hx0 - 1, hy0 - 1, 12, 3, hair);
      R(hx0 - 3, hy0, 4, 15, OUT);
      R(hx0 - 2, hy0 + 1, 3, 13, hair);
      break;
    case 'bun':
      R(hx0 - 1, hy0 - 2, 12, 4, OUT);
      R(hx0, hy0 - 1, 10, 3, hair);
      R(hx0 + 1, hy0 - 5, 5, 4, OUT);
      R(hx0 + 2, hy0 - 4, 3, 2, hair);
      break;
  }
  const ec = look.eyeC ?? OUT;
  const ex = hx0 + 5;
  const ey = hy0 + 4;
  switch (look.eyes) {
    case 'sun':
      R(ex - 3, ey - 1, 9, 1, OUT);
      R(ex - 2, ey - 1, 3, 3, OUT);
      R(ex + 2, ey - 1, 3, 3, OUT);
      R(ex - 1, ey - 1, 1, 1, '#94A3B8');
      R(ex + 3, ey - 1, 1, 1, '#94A3B8');
      break;
    case 'visor':
      R(ex - 4, ey - 1, 10, 3, OUT);
      R(ex - 3, ey, 8, 1, ec);
      break;
    case 'angry':
      R(ex - 1, ey - 2, 3, 1, OUT);
      R(ex + 3, ey - 2, 3, 1, OUT);
      R(ex, ey, 1, 2, ec);
      R(ex + 4, ey, 1, 2, ec);
      break;
    default: {
      const blink = Math.floor(p.t * 1.7 + (p.phase ?? 0)) % 6 === 0 && (p.t * 1.7) % 1 < 0.15;
      R(ex, ey, 1, blink ? 1 : 2, ec);
      R(ex + 3, ey, 1, blink ? 1 : 2, ec);
      if (look.eyes === 'glow') {
        R(ex - 1, ey, 1, 1, ec);
        R(ex + 4, ey, 1, 1, ec);
      }
    }
  }
  if (!look.beard) {
    const hurt = p.act === 'hurt' || p.act === 'down';
    R(ex + 1, ey + 4, hurt ? 2 : 3, hurt ? 2 : 1, '#7A3B2E');
  }
  const hc = look.hatC ?? OUT;
  switch (look.hat) {
    case 'crown':
    case 'tiara':
      R(hx0, hy0 - 4, 10, 4, OUT);
      R(hx0 + 1, hy0 - 3, 8, 2, hc);
      R(hx0 + 1, hy0 - 6, 2, 3, hc);
      R(hx0 + 4, hy0 - 7, 2, 4, hc);
      R(hx0 + 7, hy0 - 6, 2, 3, hc);
      R(hx0 + 4, hy0 - 3, 2, 1, look.hat === 'tiara' ? '#22D3EE' : '#E11D48');
      break;
    case 'helmet':
      R(hx0 - 2, hy0 - 3, 14, 7, OUT);
      R(hx0 - 1, hy0 - 2, 12, 5, hc);
      R(hx0 - 1, hy0, 12, 1, '#A1A1AA');
      R(hx0 + 4, hy0 - 5, 2, 3, '#DC2626');
      break;
    case 'chef':
      R(hx0 - 1, hy0 - 9, 12, 10, OUT);
      R(hx0, hy0 - 8, 10, 8, hc);
      R(hx0 + 2, hy0 - 6, 2, 2, '#E2E8F0');
      R(hx0 - 2, hy0 - 1, 14, 3, OUT);
      R(hx0 - 1, hy0, 12, 1, '#E2E8F0');
      break;
    case 'hood':
      R(hx0 - 3, hy0 - 3, 16, 6, OUT);
      R(hx0 - 2, hy0 - 2, 14, 4, hc);
      R(hx0 - 3, hy0 + 2, 3, 10, hc);
      break;
    case 'horns':
      R(hx0, hy0 - 5, 3, 5, OUT);
      R(hx0 + 7, hy0 - 5, 3, 5, OUT);
      R(hx0 + 1, hy0 - 4, 1, 3, hc);
      R(hx0 + 8, hy0 - 4, 1, 3, hc);
      break;
    case 'antenna':
      R(hx0 + 2, hy0 - 5, 1, 5, OUT);
      R(hx0 + 7, hy0 - 5, 1, 5, OUT);
      R(hx0 + 1, hy0 - 7, 3, 3, hc);
      R(hx0 + 6, hy0 - 7, 3, 3, hc);
      break;
    case 'cap':
      R(hx0 - 1, hy0 - 3, 12, 4, OUT);
      R(hx0, hy0 - 2, 10, 2, hc);
      R(hx0 + 8, hy0, 5, 2, OUT);
      break;
  }
  ctx.restore();
  drawLeg(pose.legF, true);
  const [hx, hy] = drawArm(pose.armF, true);
  const item = p.item === undefined ? look.item : p.item;
  if (item && !flash) drawItem(ctx, item, hx, hy, pose.itemAng);
  ctx.restore();
}

const BODY_ROWS: [number, number][] = [
  [-26, 4], [-25, 6], [-24, 7], [-23, 8], [-22, 8], [-21, 9], [-20, 9], [-19, 9], [-18, 9], [-17, 10], [-16, 10], [-15, 10],
  [-14, 10], [-13, 10], [-12, 10], [-11, 10], [-10, 10], [-9, 10], [-8, 10], [-7, 9], [-6, 9], [-5, 8], [-4, 7], [-3, 5],
];

export const KIRPI = { primary: '#B07A4F', shade: '#8A5A36', light: '#D9A877', dark: '#4A2E1A', quill: '#5C3A21', trim: '#F5DEB3' };

export function drawDevin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, facing: number, scale = 1) {
  const K = KIRPI;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (scale !== 1) ctx.scale(scale, scale);
  if (facing < 0) ctx.scale(-1, 1);
  const R = (x0: number, y0: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x0, y0, w, h);
  };
  ctx.fillStyle = '#140A10';
  for (const q of MASCOT_QUILLS) ctx.fillRect(q.x - 1, q.y - 1, q.s + 2, q.s + 2);
  ctx.fillStyle = K.quill;
  for (const q of MASCOT_QUILLS) ctx.fillRect(q.x, q.y, q.s, q.s);
  ctx.fillStyle = K.light;
  for (const q of MASCOT_QUILLS) if (q.s <= 3) ctx.fillRect(q.x, q.y, 1, 1);
  for (const e of MASCOT_EARS) {
    R(e.x - 1, e.y - 1, e.s + 2, e.s + 2, K.dark);
    R(e.x, e.y, e.s, e.s, K.primary);
    R(e.x + 1, e.y + 1, e.s - 2, e.s - 2, '#F0A8A0');
  }
  R(-4, -27, 8, 1, K.dark);
  for (const [ry, hw] of BODY_ROWS) R(-hw - 1, ry, (hw + 1) * 2, 1, K.dark);
  R(-5, -2, 10, 1, K.dark);
  for (const [ry, hw] of BODY_ROWS) R(-hw, ry, hw * 2, 1, K.primary);
  R(-6, -15, 12, 10, K.trim);
  R(-8, -5, 16, 2, K.shade);
  R(5, -16, 5, 10, K.shade);
  R(-6, -24, 5, 2, K.light);
  R(-8, -22, 3, 4, K.light);
  R(-10, -10, 20, 4, K.shade);
  R(-10, -9, 20, 2, '#FFD54F');
  R(1, -10, 3, 4, '#FFD54F');
  const blink = Math.floor(t * 1.3) % 5 === 0 && (t * 1.3) % 1 < 0.15;
  for (const ex of [-3, 4]) {
    if (blink) R(ex, -18, 3, 1, '#0F172A');
    else {
      R(ex, -20, 3, 4, '#FFFFFF');
      R(ex + 1, -19, 2, 3, '#0F172A');
      R(ex + 1, -19, 1, 1, '#FFFFFF');
    }
  }
  R(-1, -15, 3, 2, '#3B1F10');
  R(-5, -13, 4, 1, '#2A1A0E');
  R(2, -13, 4, 1, '#2A1A0E');
  R(-6, -12, 2, 1, '#2A1A0E');
  R(5, -12, 2, 1, '#2A1A0E');
  // fez
  R(-4, -33, 9, 7, '#14101C');
  R(-3, -32, 7, 6, '#C81E32');
  R(-3, -27, 7, 1, '#7A1120');
  const tas = Math.round(Math.sin(t * 6) * 1.5);
  R(1, -34, 1, 1, '#14101C');
  R(2 + tas, -33, 2, 4, '#FFD54F');
  // headset
  R(-11, -21, 2, 5, '#0F172A');
  R(-11, -16, 5, 1, '#0F172A');
  ctx.restore();
}

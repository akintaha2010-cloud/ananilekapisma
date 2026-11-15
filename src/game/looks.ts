import { HumanLookId } from './types';

export type PixelRect = [number, number, number, number, string];

interface LookDef {
  skin: string;
  hair: string;
  hairStyle: 'messy' | 'long' | 'short' | 'none';
  top: string;
  topDark: string;
  inner?: string;
  dots?: [string, string];
  pants: string;
  shoe: string;
  eyes: 'sun' | 'dot' | 'visor' | 'glow';
  eyeColor?: string;
  hat?: 'crown' | 'helmet' | 'chef' | 'hood' | 'horns' | 'headset';
  hatColor?: string;
  cape?: string;
  beard?: string;
  prop?: 'keyboard' | 'hammer' | 'skewer' | 'tea' | 'clock';
  badge?: boolean;
}

const OUT = '#111018';

export const HUMAN_LOOKS: Record<HumanLookId, LookDef> = {
  akin: { skin: '#F4C49C', hair: '#4A2C1D', hairStyle: 'messy', top: '#7CC6E8', topDark: '#4E9CC4', inner: '#FFFFFF', dots: ['#F6E7C1', '#E58FA0'], pants: '#1C1B26', shoe: '#F1F5F9', eyes: 'sun', badge: true, prop: 'keyboard' },
  devin: { skin: '#E8B48A', hair: '#1F2937', hairStyle: 'short', top: '#14B8A6', topDark: '#0F766E', inner: '#CCFBF1', pants: '#334155', shoe: '#F8FAFC', eyes: 'dot', hat: 'headset', hatColor: '#0F172A', badge: true },
  ozgur: { skin: '#F2C29B', hair: '#7C2D12', hairStyle: 'long', top: '#C026D3', topDark: '#86198F', inner: '#FBCFE8', pants: '#701A75', shoe: '#FDE047', eyes: 'dot', hat: 'crown', hatColor: '#FACC15', cape: '#DB2777', prop: 'tea' },
  mert: { skin: '#E0A878', hair: '#111827', hairStyle: 'short', top: '#991B1B', topDark: '#450A0A', inner: '#1F2937', pants: '#111827', shoe: '#7F1D1D', eyes: 'glow', eyeColor: '#F87171', hat: 'helmet', hatColor: '#3F3F46', prop: 'hammer' },
  tuna: { skin: '#D99A6C', hair: '#292524', hairStyle: 'short', top: '#F8FAFC', topDark: '#CBD5E1', inner: '#F97316', pants: '#44403C', shoe: '#292524', eyes: 'dot', hat: 'chef', hatColor: '#FFFFFF', beard: '#292524', prop: 'skewer' },
  ayaz: { skin: '#BAE6FD', hair: '#E0F2FE', hairStyle: 'long', top: '#38BDF8', topDark: '#0369A1', inner: '#E0F2FE', pants: '#075985', shoe: '#E0F2FE', eyes: 'glow', eyeColor: '#FFFFFF', hat: 'horns', hatColor: '#E0F2FE', beard: '#F0F9FF' },
  gokoz: { skin: '#C4B5FD', hair: '#1E1B4B', hairStyle: 'messy', top: '#4C1D95', topDark: '#2E1065', inner: '#22D3EE', pants: '#1E1B4B', shoe: '#22D3EE', eyes: 'visor', eyeColor: '#22D3EE', hat: 'hood', hatColor: '#312E81', cape: '#6D28D9', prop: 'clock' },
  buglord: { skin: '#4ADE80', hair: '#052E16', hairStyle: 'none', top: '#14532D', topDark: '#052E16', inner: '#A3E635', pants: '#022C22', shoe: '#A3E635', eyes: 'glow', eyeColor: '#F43F5E', hat: 'crown', hatColor: '#A3E635', cape: '#166534' },
  bug: { skin: '#86EFAC', hair: '#14532D', hairStyle: 'none', top: '#16A34A', topDark: '#14532D', inner: '#BBF7D0', pants: '#14532D', shoe: '#052E16', eyes: 'glow', eyeColor: '#FDE047', hat: 'horns', hatColor: '#14532D' },
};

export interface HumanPose {
  walkStep: number;
  air: boolean;
  t: number;
  stunned?: boolean;
  phase?: number;
}

export function humanRects(id: HumanLookId, pose: HumanPose): PixelRect[] {
  const L = HUMAN_LOOKS[id];
  const r: PixelRect[] = [];
  const R = (x: number, y: number, w: number, h: number, c: string) => r.push([x, y, w, h, c]);
  const { walkStep, air, t } = pose;
  const ph = pose.phase ?? 0;
  const lift = (side: number) => (air ? (side < 0 ? -2 : 0) : walkStep === (side < 0 ? 1 : 3) ? -2 : 0);
  const stride = air ? 0 : walkStep === 1 ? 1 : walkStep === 3 ? -1 : 0;
  const bob = !air && (walkStep === 1 || walkStep === 3) ? -1 : 0;
  const swing = air ? -3 : walkStep === 1 ? 2 : walkStep === 3 ? -2 : 0;

  if (L.cape) {
    const fl = Math.round(Math.sin(t * 9 + ph) * 1.5);
    R(-12, -21 + bob, 7, 19 + fl, OUT);
    R(-11, -20 + bob, 5, 17 + fl, L.cape);
  }
  for (const side of [-1, 1]) {
    const lx = side < 0 ? -6 + stride : 1 - stride;
    const ly = lift(side);
    R(lx - 1, -11 + ly, 7, 8, OUT);
    R(lx, -11 + ly, 5, 7, L.pants);
    R(lx - 1, -4 + ly, 8, 4, OUT);
    R(lx, -4 + ly, 7, 3, L.shoe);
  }
  const y0 = bob;
  R(-11, -19 - swing + y0, 4, 7, OUT);
  R(-10, -19 - swing + y0, 2, 4, L.topDark);
  R(-10, -15 - swing + y0, 2, 2, L.skin);
  R(-8, -21 + y0, 16, 11, OUT);
  R(-7, -20 + y0, 14, 9, L.top);
  R(-7, -12 + y0, 14, 1, L.topDark);
  if (L.inner) R(-2, -20 + y0, 4, 9, L.inner);
  if (L.dots) {
    R(-5, -18 + y0, 1, 1, L.dots[0]);
    R(-6, -15 + y0, 1, 1, L.dots[1]);
    R(4, -19 + y0, 1, 1, L.dots[1]);
    R(5, -14 + y0, 1, 1, L.dots[0]);
  }
  if (L.badge) {
    R(-2, -20 + y0, 1, 4, OUT);
    R(1, -20 + y0, 1, 4, OUT);
    R(-2, -16 + y0, 4, 3, OUT);
    R(-1, -15 + y0, 2, 1, '#FDE047');
  }
  // head
  R(-6, -31 + y0, 12, 11, OUT);
  R(-5, -30 + y0, 10, 9, L.skin);
  if (L.beard) {
    R(-5, -24 + y0, 10, 4, L.beard);
    R(-3, -21 + y0, 6, 2, L.beard);
  }
  if (L.hairStyle === 'messy') {
    const flick = Math.floor(t * 3 + ph) % 2;
    R(-7, -35 + y0, 14, 6, OUT);
    R(-6, -34 + y0, 12, 4, L.hair);
    R(-7, -31 + y0, 3, 3, L.hair);
    R(-5, -37 + y0, 2, 3, L.hair);
    R(-1, -38 + flick + y0, 2, 4, L.hair);
    R(3, -37 + y0, 3, 3, L.hair);
  } else if (L.hairStyle === 'short') {
    R(-7, -34 + y0, 14, 5, OUT);
    R(-6, -33 + y0, 12, 3, L.hair);
    R(-6, -30 + y0, 2, 2, L.hair);
  } else if (L.hairStyle === 'long') {
    R(-7, -34 + y0, 14, 5, OUT);
    R(-6, -33 + y0, 12, 3, L.hair);
    R(-8, -31 + y0, 4, 13, OUT);
    R(-7, -30 + y0, 3, 11, L.hair);
  }
  // eyes
  const ec = L.eyeColor ?? OUT;
  if (L.eyes === 'sun') {
    R(-4, -28 + y0, 10, 1, OUT);
    R(-3, -28 + y0, 4, 3, OUT);
    R(2, -28 + y0, 4, 3, OUT);
    R(-2, -28 + y0, 1, 1, '#64748B');
    R(3, -28 + y0, 1, 1, '#64748B');
  } else if (L.eyes === 'visor') {
    R(-5, -28 + y0, 11, 3, OUT);
    R(-4, -27 + y0, 9, 1, ec);
  } else {
    const blink = Math.floor(t * 2 + ph) % 7 === 0;
    R(-1, -27 + y0, 2, blink ? 1 : 2, ec);
    R(3, -27 + y0, 2, blink ? 1 : 2, ec);
  }
  if (!L.beard) {
    R(0, -23 + y0, 3, 1, '#7A3B2E');
    if (!pose.stunned) R(3, -24 + y0, 1, 1, '#7A3B2E');
  }
  // headwear
  const hc = L.hatColor ?? OUT;
  switch (L.hat) {
    case 'crown':
      R(-6, -37 + y0, 12, 5, OUT);
      R(-5, -36 + y0, 10, 3, hc);
      R(-5, -39 + y0, 2, 3, hc);
      R(-1, -40 + y0, 2, 4, hc);
      R(3, -39 + y0, 2, 3, hc);
      R(-1, -35 + y0, 2, 1, '#E11D48');
      break;
    case 'helmet':
      R(-7, -36 + y0, 14, 7, OUT);
      R(-6, -35 + y0, 12, 5, hc);
      R(-6, -33 + y0, 12, 1, '#A1A1AA');
      R(-1, -38 + y0, 2, 3, '#DC2626');
      break;
    case 'chef':
      R(-6, -41 + y0, 12, 10, OUT);
      R(-5, -40 + y0, 10, 8, hc);
      R(-7, -34 + y0, 14, 3, OUT);
      R(-6, -33 + y0, 12, 1, '#E2E8F0');
      break;
    case 'hood':
      R(-8, -36 + y0, 16, 6, OUT);
      R(-7, -35 + y0, 14, 4, hc);
      R(-8, -31 + y0, 3, 10, hc);
      break;
    case 'horns':
      R(-7, -38 + y0, 3, 5, OUT);
      R(-6, -37 + y0, 1, 3, hc);
      R(4, -38 + y0, 3, 5, OUT);
      R(5, -37 + y0, 1, 3, hc);
      break;
    case 'headset':
      R(-7, -34 + y0, 14, 1, hc);
      R(-8, -30 + y0, 3, 5, hc);
      R(5, -30 + y0, 3, 5, hc);
      R(6, -26 + y0, 1, 3, hc);
      R(3, -24 + y0, 4, 1, hc);
      break;
  }
  // front arm + prop
  R(6, -19 + swing + y0, 5, 7, OUT);
  R(7, -19 + swing + y0, 3, 4, L.top);
  R(7, -15 + swing + y0, 3, 2, L.skin);
  const hy = -15 + swing + y0;
  switch (L.prop) {
    case 'keyboard':
      R(9, hy - 1, 9, 4, OUT);
      R(10, hy, 7, 2, '#334155');
      R(11, hy, 1, 1, '#22D3EE');
      R(14, hy + 1, 1, 1, '#F472B6');
      break;
    case 'hammer':
      R(10, hy - 10, 2, 12, OUT);
      R(7, hy - 14, 9, 6, OUT);
      R(8, hy - 13, 7, 4, '#52525B');
      R(9, hy - 12, 1, 1, '#F87171');
      R(12, hy - 12, 1, 1, '#FDE047');
      break;
    case 'skewer':
      R(10, hy - 14, 1, 16, '#A8A29E');
      R(8, hy - 12, 5, 9, OUT);
      R(9, hy - 11, 3, 7, '#B45309');
      R(9, hy - 9, 3, 1, '#F59E0B');
      break;
    case 'tea':
      R(9, hy - 3, 4, 5, OUT);
      R(10, hy - 2, 2, 3, '#B91C1C');
      break;
    case 'clock':
      R(9, hy - 7, 7, 7, OUT);
      R(10, hy - 6, 5, 5, '#22D3EE');
      R(12, hy - 5, 1, 2, OUT);
      break;
  }
  return r;
}

import React, { useEffect, useRef } from 'react';
import { drawDevin, drawFigure, LOOKS } from '../haven/sprites';

interface HavenPortraitProps {
  who: string;
  size: number;
  active: boolean;
}

export const HavenPortrait: React.FC<HavenPortraitProps> = ({ who, size, active }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      g.clearRect(0, 0, c.width, c.height);
      g.imageSmoothingEnabled = false;
      if (who === 'devin') drawDevin(g, 24, 46 + Math.round(Math.sin(t * 3) * 1.5), t, 1, 1);
      else {
        const look = LOOKS[who] ?? LOOKS.bug;
        const big = ['mert', 'tuna', 'ayaz', 'gokoz', 'buglord'].includes(who);
        drawFigure(g, look, { act: active ? 'cast' : 'none', t, actT: active ? 0.15 : 0, actDur: 0.3, vx: 0, vy: 0, ground: true, phase: who.length }, 24, 47, 1, big ? 1.3 : 1.2);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [who, active]);
  return <canvas ref={ref} width={48} height={50} style={{ width: size, height: size * (50 / 48), imageRendering: 'pixelated' }} aria-hidden="true" />;
};

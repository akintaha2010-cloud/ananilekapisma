import React, { useEffect, useRef, useState } from 'react';
import { Home, Pause, Play, RotateCcw } from 'lucide-react';
import { createHavenState, starsFor, stepHaven } from '../haven/engine';
import { HavenRenderer } from '../haven/render';
import { HavenInput, HavenState, SoundCue } from '../haven/types';
import { soundEngine } from '../game/audio';

interface HavenGameProps {
  chapterId: number;
  onWin: (stats: { coins: number; stars: number; kills: number }) => void;
  onExit: () => void;
}

const KEYS: Record<string, keyof HavenInput> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowUp: 'up',
  KeyW: 'up',
  Space: 'up',
  KeyJ: 'punch',
  KeyZ: 'punch',
  KeyK: 'kick',
  KeyX: 'kick',
  KeyL: 'throw',
  KeyC: 'throw',
  KeyU: 'special',
  KeyV: 'special',
};
const PRESS: (keyof HavenInput)[] = ['punch', 'kick', 'throw', 'special'];

function playCue(c: SoundCue) {
  switch (c) {
    case 'hit':
    case 'block':
    case 'throw':
      return soundEngine.playBump();
    case 'heavy':
    case 'hurt':
      return soundEngine.playStomp();
    case 'jump':
      return soundEngine.playJump();
    case 'ko':
      return soundEngine.playKO();
    case 'pickup':
      return soundEngine.playMenuClick();
    case 'boom':
      return soundEngine.playCannon();
    case 'special':
      return soundEngine.playAchievementUnlock();
    case 'win':
      return soundEngine.playVictoryFanfare();
  }
}

export const HavenGame: React.FC<HavenGameProps> = ({ chapterId, onWin, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<HavenState>(createHavenState(chapterId, Date.now() % 100000 + 7));
  const held = useRef<Record<string, boolean>>({});
  const pressed = useRef<Record<string, boolean>>({});
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<HavenState['phase']>('play');
  const [touch] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;

  const setPause = (v: boolean) => {
    pausedRef.current = v;
    setPaused(v);
  };

  const restart = () => {
    stateRef.current = createHavenState(chapterId, Date.now() % 100000 + 7);
    setPhase('play');
    setPause(false);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat && stateRef.current.phase === 'play') setPause(!pausedRef.current);
        return;
      }
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      if (!held.current[k] && !e.repeat) {
        pressed.current[k] = true;
        if (k === 'up') pressed.current.jump = true;
      }
      held.current[k] = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (!k) return;
      e.stopPropagation();
      held.current[k] = false;
    };
    const blur = () => {
      held.current = {};
    };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      window.removeEventListener('blur', blur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const renderer = new HavenRenderer();
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let wonFired = false;
    const STEP = 1 / 120;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const s = stateRef.current;
      if (!pausedRef.current) {
        acc += dt;
        while (acc >= STEP) {
          acc -= STEP;
          const h0 = held.current;
          const inp: HavenInput = {
            left: !!h0.left,
            right: !!h0.right,
            up: !!h0.up,
            down: !!h0.down,
            jump: !!pressed.current.jump,
            punch: !!pressed.current.punch,
            kick: !!pressed.current.kick,
            throw: !!pressed.current.throw,
            special: !!pressed.current.special,
          };
          pressed.current = {};
          stepHaven(s, inp, STEP);
          for (const c of s.cues) playCue(c);
        }
        if (s.phase !== 'play') {
          setPhase(s.phase);
          if (s.phase === 'won' && !wonFired && s.endT > 2.2) {
            wonFired = true;
            onWinRef.current({ coins: s.player.coins, stars: starsFor(s), kills: s.player.kills });
          }
        }
      } else acc = 0;
      renderer.render(ctx, w, h, s);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tb = (key: keyof HavenInput, label: string, cls = '') => (
    <button
      type="button"
      className={`kk-tbtn ${cls}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        held.current[key] = true;
        pressed.current[key] = true;
        if (key === 'up') pressed.current.jump = true;
      }}
      onPointerUp={() => (held.current[key] = false)}
      onPointerCancel={() => (held.current[key] = false)}
      onPointerLeave={() => (held.current[key] = false)}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black select-none" data-testid="haven-game">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: 'pixelated' }} />
      {phase === 'play' && (
        <button type="button" className="kk-btn kk-btn-icon absolute top-3 right-3" aria-label="Duraklat" data-testid="haven-pause" onClick={() => setPause(true)}>
          <Pause className="kk-ico" />
        </button>
      )}
      {touch && phase === 'play' && !paused && (
        <>
          <div className="absolute left-3 bottom-3 flex gap-2">
            {tb('left', '◀')}
            {tb('down', '▼')}
            {tb('right', '▶')}
          </div>
          <div className="absolute right-3 bottom-3 grid grid-cols-3 gap-2">
            {tb('throw', 'AT')}
            {tb('special', '★')}
            {tb('up', '▲')}
            <span />
            {tb('kick', 'TEK')}
            {tb('punch', 'VUR')}
          </div>
        </>
      )}
      {(paused || phase === 'dead') && (
        <div className="absolute inset-0 bg-[#0d1118]/75 flex flex-col items-center justify-center gap-6" role="dialog" aria-modal="true">
          <h2 className="kk-title" style={{ fontSize: 'clamp(40px, 8vw, 76px)' }}>
            {phase === 'dead' ? 'YENİLDİN' : 'DURDU'}
          </h2>
          {!touch && phase !== 'dead' && (
            <p className="text-slate-300 text-sm text-center max-w-md px-4">
              ←→ yürü · ↑/W/Boşluk zıpla · J/Z yumruk (kombo) · K/X tekme · Aşağı+Tekme kayma · Aşağı blok · L/C at · U/V SHIP IT!
            </p>
          )}
          <div className="flex items-center gap-4">
            <button type="button" className="kk-btn kk-btn-icon" aria-label="Menü" data-testid="haven-exit" onClick={onExit}>
              <Home className="kk-ico" />
            </button>
            {phase !== 'dead' && (
              <button type="button" className="kk-btn kk-btn-xl kk-btn-icon" aria-label="Devam" data-testid="haven-resume" autoFocus onClick={() => setPause(false)}>
                <Play className="kk-ico fill-current" />
              </button>
            )}
            <button type="button" className="kk-btn kk-btn-icon" aria-label="Baştan" data-testid="haven-restart" onClick={restart}>
              <RotateCcw className="kk-ico" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

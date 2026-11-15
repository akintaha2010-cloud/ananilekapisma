import React, { useEffect, useRef, useState } from 'react';
import { CostumeConfig, HeroId } from '../game/types';
import { CutsceneLine, CutsceneSpeaker, HAVEN_CAST, ORFE_COSTUME, PASA_COSTUME } from '../game/adventure';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface AdventureCutsceneProps {
  title: string;
  lines: CutsceneLine[];
  heroName: string;
  heroCostume: CostumeConfig;
  heroId?: HeroId;
  onDone: () => void;
}

type Actor = { name: string; costume: CostumeConfig; side: 'left' | 'right'; heroId?: HeroId };
const BIG = new Set<CutsceneSpeaker>(['pasa', 'mert', 'tuna', 'ayaz', 'gokoz', 'buglord']);
const cast = (k: keyof typeof HAVEN_CAST, side: 'left' | 'right'): Actor => ({ ...HAVEN_CAST[k], side });

const SPEAKERS: Record<Exclude<CutsceneSpeaker, 'hero' | 'npc'>, Actor> = {
  devin: cast('devin', 'left'),
  ozgur: cast('ozgur', 'right'),
  mert: cast('mert', 'right'),
  tuna: cast('tuna', 'right'),
  ayaz: cast('ayaz', 'right'),
  gokoz: cast('gokoz', 'right'),
  buglord: cast('buglord', 'right'),
  orfe: { name: 'Orfe', costume: ORFE_COSTUME, side: 'left' },
  pasa: { name: 'Kara Paşa', costume: PASA_COSTUME, side: 'right' },
  knight: {
    name: 'Şövalye',
    costume: { colorId: 'cobalt', fesStyle: 'altin_migfer', mustacheStyle: 'kaytan', accessoryId: 'kalkan' },
    side: 'right',
  },
  mage: {
    name: 'Kor Büyücü',
    costume: { colorId: 'plum', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu', accessoryId: 'pelerin' },
    side: 'right',
  },
};

export const AdventureCutscene: React.FC<AdventureCutsceneProps> = ({ title, lines, heroName, heroCostume, heroId, onDone }) => {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const line = lines[Math.min(idx, lines.length - 1)];
  const full = line?.text ?? '';
  const typing = shown < full.length;

  useEffect(() => {
    setShown(0);
  }, [idx]);

  useEffect(() => {
    if (!typing) return;
    const t = window.setTimeout(() => setShown((s) => Math.min(full.length, s + 1)), 22);
    return () => window.clearTimeout(t);
  }, [shown, typing, full.length]);

  const advance = () => {
    if (typing) {
      setShown(full.length);
    } else if (idx + 1 < lines.length) {
      setIdx(idx + 1);
    } else {
      onDone();
    }
  };

  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onDoneRef.current();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        advanceRef.current();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  if (!line) return null;

  const actors = new Map<CutsceneSpeaker, Actor>();
  for (const l of lines) {
    if (actors.has(l.speaker) || l.speaker === 'npc') continue;
    actors.set(l.speaker, l.speaker === 'hero' ? { name: heroName, costume: heroCostume, side: 'left', heroId } : SPEAKERS[l.speaker]);
  }
  const narrator = line.speaker === 'npc';
  const speaker: Actor = narrator ? { name: '', costume: heroCostume, side: 'left' } : actors.get(line.speaker)!;
  const left = [...actors.entries()].filter(([, c]) => c.side === 'left');
  const right = [...actors.entries()].filter(([, c]) => c.side === 'right');

  const renderActor = ([key, c]: [CutsceneSpeaker, Actor]) => {
    const active = key === line.speaker;
    return (
      <div
        key={key}
        className={`flex flex-col items-center transition-all duration-300 ${active ? 'opacity-100 -translate-y-3 scale-110' : 'opacity-45 scale-95'}`}
        style={{ transform: c.side === 'right' ? 'scaleX(-1)' : undefined }}
      >
        <CharacterPreviewSvg costume={c.costume} heroId={c.heroId} size={BIG.has(key) ? 190 : 150} celebrating={active && !typing} />
      </div>
    );
  };

  return (
    <div
      data-testid="adventure-cutscene"
      className="fixed inset-0 z-[90] flex flex-col select-none cursor-pointer"
      onClick={advance}
      style={{
        background:
          'radial-gradient(ellipse at 50% 35%, rgba(251,191,36,0.22), transparent 55%), linear-gradient(180deg, #0b1026 0%, #1e1b4b 55%, #0f172a 100%)',
      }}
    >
      <div className="h-[9vh] bg-black shrink-0 animate-[slideDown_.5s_ease-out]" />
      <div className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 opacity-60"
          style={{
            background:
              'repeating-linear-gradient(90deg, #1f2937 0 46px, #111827 46px 52px), linear-gradient(#1f2937, #111827)',
            clipPath: 'polygon(0 30%, 6% 30%, 6% 0, 12% 0, 12% 30%, 88% 30%, 88% 0, 94% 0, 94% 30%, 100% 30%, 100% 100%, 0 100%)',
          }}
        />
        <div className="absolute top-4 inset-x-0 text-center">
          <div className="font-display text-amber-300 text-xl md:text-3xl font-bold tracking-wide drop-shadow-[0_3px_0_#000]">{title}</div>
        </div>
        <div className="absolute inset-x-0 bottom-[22%] flex justify-between px-[8vw] items-end">
          <div className="flex gap-6 items-end">{left.map(renderActor)}</div>
          <div className="flex gap-6 items-end">{right.map(renderActor)}</div>
        </div>
      </div>
      <div className="bg-black shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto bg-slate-950 border-4 border-amber-500 pixel-panel p-4 min-h-[110px]">
          <div className={`font-display font-bold text-sm mb-1 ${speaker.side === 'left' ? 'text-sky-300' : 'text-rose-300 text-right'}`}>
            {speaker.name}
          </div>
          <p className={`text-base md:text-lg leading-snug ${narrator ? 'text-slate-300 italic text-center' : 'text-amber-50'}`}>
            {full.slice(0, shown)}
            {typing && <span className="animate-pulse">▌</span>}
          </p>
          <div className="text-[11px] text-slate-400 mt-2 text-right">Boşluk / tıkla: devam · Esc: geç</div>
        </div>
      </div>
    </div>
  );
};

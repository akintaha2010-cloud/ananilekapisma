import React from 'react';
import { ArrowLeft, Lock, Play, Star, Swords } from 'lucide-react';
import { ADVENTURE_CHAPTERS, AdventureChapter, AdventureProgress, isAdventureChapterUnlocked } from '../game/adventure';

interface AdventureModalProps {
  progress: AdventureProgress;
  onStartChapter: (chapter: AdventureChapter) => void;
  onBack: () => void;
}

const ENEMY_LABEL: Record<string, string> = {
  knight: 'Şövalye',
  mage: 'Büyücü',
  shadow: 'Akıncı',
  boss: 'KARA PAŞA',
};

export const AdventureModal: React.FC<AdventureModalProps> = ({ progress, onStartChapter, onBack }) => (
  <div data-testid="adventure-modal" className="w-full max-w-3xl bg-slate-950/95 border-2 border-rose-500 pixel-panel p-5 text-amber-50">
    <div className="flex items-center justify-between mb-3">
      <button type="button" onClick={onBack} className="px-3 py-2 bg-slate-900 border-2 border-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer pixel-btn">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <h2 className="font-display text-2xl font-bold text-rose-300 flex items-center gap-2">
        <Swords className="w-6 h-6" /> Macera: Kara Paşa
      </h2>
      <div className="text-xs text-amber-300 font-bold">{progress.completed.length}/{ADVENTURE_CHAPTERS.length}</div>
    </div>
    <p className="text-sm text-slate-300 mb-4">
      Kara Paşa Hayal Şenliği'ni yasakladı! Orfe ile birlikte dalga dalga gelen şövalyeleri, büyücüleri ve akıncıları ez, kaleyi geri al. Boş oyuncu yerlerine eklediğin bilgisayarlar ve 2. oyuncu yanında savaşır.
    </p>
    <div className="grid gap-2.5">
      {ADVENTURE_CHAPTERS.map((ch) => {
        const unlocked = isAdventureChapterUnlocked(progress, ch.id);
        const done = progress.completed.includes(ch.id);
        return (
          <div key={ch.id} className={`flex items-center gap-3 p-3 border-2 ${unlocked ? 'border-rose-700 bg-rose-950/40' : 'border-slate-800 bg-slate-900/60 opacity-60'}`}>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-amber-200 flex items-center gap-2">
                {ch.title} {done && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              </div>
              <div className="text-xs text-slate-300">{ch.subtitle} · {ch.waves.length} dalga · {ch.lives} can{ch.ally ? ' · Orfe yanında' : ''}</div>
              <div className="text-[11px] text-rose-300 mt-0.5 truncate">
                {ch.waves.map((w) => w.map((k) => ENEMY_LABEL[k]).join(' + ')).join('  →  ')}
              </div>
            </div>
            <button
              type="button"
              disabled={!unlocked}
              data-testid={`adventure-start-${ch.id}`}
              onClick={() => onStartChapter(ch)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 border-2 border-rose-200 disabled:border-slate-600 text-white font-display font-bold text-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed pixel-btn"
            >
              {unlocked ? <Play className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {unlocked ? (done ? 'Tekrar' : 'Başla') : 'Kilitli'}
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

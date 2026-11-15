import React, { useState } from 'react';
import { ArrowLeft, Lock, Play, Star, Swords } from 'lucide-react';
import { AdventureCampaign, AdventureChapter, AdventureProgress, chaptersOf, isAdventureChapterUnlocked } from '../game/adventure';

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
  bug: 'Bug',
  mert: 'MERT',
  tuna: 'TUNA',
  ayaz: 'ANKARA AYAZI',
  gokoz: 'GÖKÖZ',
  buglord: 'BUG LORD',
};

const CAMPAIGNS: { id: AdventureCampaign; label: string; blurb: string }[] = [
  { id: 'haven', label: 'Haven Ankara', blurb: "Özgür kaçırıldı, organizatörler glitch'e yakalandı! Akın ve Devin Ankara'yı bug'lardan temizleyip Mert, Tuna ve Gököz'ü kurtarıyor." },
  { id: 'pasa', label: 'Kara Paşa', blurb: "Kara Paşa Hayal Şenliği'ni yasakladı! Orfe ile birlikte dalga dalga gelen şövalyeleri ez, kaleyi geri al." },
];

let lastCampaign: AdventureCampaign = 'haven';

export const AdventureModal: React.FC<AdventureModalProps> = ({ progress, onStartChapter, onBack }) => {
  const [campaign, setCampaign] = useState<AdventureCampaign>(lastCampaign);
  const chapters = chaptersOf(campaign);
  const info = CAMPAIGNS.find((c) => c.id === campaign)!;
  const doneCount = chapters.filter((c) => progress.completed.includes(c.id)).length;
  return (
  <div data-testid="adventure-modal" className="w-full max-w-3xl bg-slate-950/95 border-2 border-rose-500 pixel-panel p-5 text-amber-50">
    <div className="flex items-center justify-between mb-3">
      <button type="button" onClick={onBack} className="px-3 py-2 bg-slate-900 border-2 border-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer pixel-btn">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <h2 className="font-display text-2xl font-bold text-rose-300 flex items-center gap-2">
        <Swords className="w-6 h-6" /> Macera
      </h2>
      <div className="text-xs text-amber-300 font-bold">{doneCount}/{chapters.length}</div>
    </div>
    <div className="flex gap-2 mb-3" role="tablist">
      {CAMPAIGNS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="tab"
          aria-selected={campaign === c.id}
          data-testid={`adventure-tab-${c.id}`}
          onClick={() => {
            lastCampaign = c.id;
            setCampaign(c.id);
          }}
          className={`flex-1 px-3 py-2 border-2 font-display font-bold text-sm cursor-pointer pixel-btn ${campaign === c.id ? 'bg-rose-600 border-rose-200 text-white' : 'bg-slate-900 border-slate-600 text-slate-300'}`}
        >
          {c.label}
        </button>
      ))}
    </div>
    <p className="text-sm text-slate-300 mb-4">{info.blurb}</p>
    <div className="grid gap-2.5">
      {chapters.map((ch) => {
        const unlocked = isAdventureChapterUnlocked(progress, ch.id);
        const done = progress.completed.includes(ch.id);
        return (
          <div key={ch.id} className={`flex items-center gap-3 p-3 border-2 ${unlocked ? 'border-rose-700 bg-rose-950/40' : 'border-slate-800 bg-slate-900/60 opacity-60'}`}>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-amber-200 flex items-center gap-2">
                {ch.title} {done && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              </div>
              <div className="text-xs text-slate-300">{ch.subtitle} · {ch.waves.length} dalga · {ch.lives} can{ch.campaign === 'haven' ? '' : ch.ally ? ' · Orfe yanında' : ''}</div>
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
};

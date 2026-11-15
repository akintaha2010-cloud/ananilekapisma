import React, { useState } from 'react';
import { Compass, Home, Map as MapIcon, RotateCcw, Star } from 'lucide-react';
import { DEFEAT_QUIPS, pickQuip, VICTORY_QUIPS } from '../game/jokes';
import { getAchievementDef } from '../game/achievements';
import { HEROES } from '../game/characters';
import { CHARACTER_COLORS } from '../game/constants';
import { RoundResult, TeamId } from '../game/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface VictoryModalProps {
  result: RoundResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onQuit: () => void;
  onContinueStory?: () => void;
  onOpenSagaMap?: () => void;
  isOnlineGuest?: boolean;
  myTeam?: TeamId;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  result,
  onPlayAgain,
  onMainMenu,
  onContinueStory,
  onOpenSagaMap,
  isOnlineGuest = false,
  myTeam = 'A',
}) => {
  const [quipSeed] = useState(() => Math.floor(Math.random() * 1000));
  const winner = result.standings.find((p) => p.slotIndex === result.winnerSlot) ?? result.standings[0];
  const lost = (result.winnerTeam !== null && result.winnerTeam !== undefined && result.winnerTeam !== myTeam) || ((result.storyChapterId || result.sagaLevelId) && !(result.storyWon || result.sagaWon));
  const unlocked = result.unlockedAchievements ?? [];
  const newHeroes = result.leveledUpTo ? HEROES.filter((h) => h.unlockLevel === result.leveledUpTo) : [];
  const title = result.winnerTeam
    ? result.winnerTeam === myTeam
      ? 'ZAFER!'
      : 'YENİLDİN'
    : winner
    ? `${winner.name} KAZANDI`
    : 'BERABERE';

  let primary: { label: string; icon: React.ReactNode; onClick: () => void } | null = null;
  if (result.sagaLevelId && onOpenSagaMap) primary = { label: 'Harita', icon: <MapIcon className="kk-ico" />, onClick: onOpenSagaMap };
  else if (result.storyChapterId && result.storyWon && onContinueStory)
    primary = { label: 'Devam', icon: <Compass className="kk-ico" />, onClick: onContinueStory };
  else if (!isOnlineGuest) primary = { label: 'Tekrar', icon: <RotateCcw className="kk-ico" />, onClick: onPlayAgain };

  return (
    <div className="fixed inset-0 z-30 bg-[#0d1118]/70 flex items-center justify-center p-3 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-labelledby="victory-title" className="w-full max-w-md flex flex-col items-center gap-3 py-4">
        <h2 id="victory-title" className={`kk-title text-center ${lost ? '' : 'kk-title-2'}`} style={{ fontSize: 'clamp(38px, 8vw, 72px)', marginLeft: 0 }}>
          {title}
        </h2>

        {result.sagaLevelId !== undefined && (
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <Star key={s} className={`w-10 h-10 ${(result.sagaStars ?? 0) >= s ? 'fill-[#ffb627] text-[#0d1118]' : 'text-[#3d4a5c]'}`} strokeWidth={2.5} />
            ))}
          </div>
        )}

        {winner && (
          <div className="kk-hero-card" style={{ animation: 'none' }}>
            <CharacterPreviewSvg costume={winner.costume} look={winner.look} heroId={winner.heroId} size={120} celebrating />
          </div>
        )}

        <p className="kk-pill" data-testid="victory-quip">
          {pickQuip(lost ? DEFEAT_QUIPS : VICTORY_QUIPS, quipSeed)}
        </p>

        <div className="w-full flex flex-col gap-1.5">
          {result.standings.map((p, idx) => (
            <div key={p.slotIndex} className="kk-chip !max-w-none w-full" style={{ ['--chip' as string]: CHARACTER_COLORS[p.colorId].primary }}>
              <span className="kk-score w-7 text-center">{idx + 1}</span>
              <span className="kk-tag" style={{ background: CHARACTER_COLORS[p.colorId].primary }}>
                {p.isBot ? 'CPU' : `P${p.slotIndex + 1}`}
              </span>
              <span className="kk-chip-name flex-1 !max-w-none">{p.name}</span>
              <span className="kk-score">{p.score}</span>
            </div>
          ))}
        </div>

        {(result.xpEarned || result.leveledUpTo || unlocked.length > 0) && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {!!result.xpEarned && <span className="kk-pill">+{result.xpEarned} XP</span>}
            {result.leveledUpTo && <span className="kk-pill kk-pill-warn">SEVİYE {result.leveledUpTo}</span>}
            {newHeroes.map((h) => (
              <span key={h.id} className="kk-pill kk-pill-warn">+ {h.name}</span>
            ))}
            {unlocked.map((id) => {
              const def = getAchievementDef(id);
              return def ? (
                <span key={id} className="kk-pill">★ {def.title}</span>
              ) : null;
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mt-2">
          <button type="button" onClick={onMainMenu} className="kk-btn bg-[#3d4a5c]" style={{ width: 84, height: 84 }} aria-label="Ana menü" title="Ana menü">
            <Home className="kk-ico" />
          </button>
          {primary ? (
            <button type="button" onClick={primary.onClick} data-start="true" className="kk-btn kk-btn-xl bg-[#ffb627]" aria-label={primary.label} title={primary.label}>
              {primary.icon}
            </button>
          ) : (
            <span className="kk-pill">Oda sahibi bekleniyor…</span>
          )}
        </div>
      </div>
    </div>
  );
};

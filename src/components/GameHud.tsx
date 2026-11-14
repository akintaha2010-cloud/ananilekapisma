import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Flag, Pause, Shield, Volume2, VolumeX, Zap } from 'lucide-react';
import { getAchievementDef } from '../game/achievements';
import { CHARACTER_COLORS } from '../game/constants';
import { AchievementId, HazardPhase, HudPlayerSummary, HudSnapshot } from '../game/types';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  achievementToasts: AchievementId[];
  isOnlineGuest?: boolean;
  touchControlsEnabled?: boolean;
  abilityKeyLabel?: string;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onFinishChaos: () => void;
  onQuit: () => void;
  onTouchHeld?: (key: 'left' | 'right' | 'down' | 'upHeld', active: boolean) => void;
  onTouchJump?: () => void;
  onTouchAbility?: () => void;
}

const HAZARD_ICONS: Record<HazardPhase, string | null> = {
  calm: null,
  wind_left: '← RÜZGÂR',
  wind_right: 'RÜZGÂR →',
  slippery: 'KAYGAN',
  cannon: 'TOP ATEŞİ',
};

const isCoarsePointer =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

const PlayerChip: React.FC<{ p: HudPlayerSummary; showLives: boolean; mirrored: boolean }> = ({
  p,
  showLives,
  mirrored,
}) => {
  const theme = CHARACTER_COLORS[p.colorId];
  const maxLives = Math.max(1, p.maxLives || 1);
  const lives = Math.max(0, Math.min(maxLives, p.lives));
  const abMax = Math.max(0.5, p.abilityMaxCooldown || 3.5);
  const abReady = p.abilityCooldown <= 0.05;
  const abPct = abReady ? 100 : Math.max(0, Math.min(100, ((abMax - p.abilityCooldown) / abMax) * 100));
  return (
    <div
      data-testid={`hud-player-${p.slotIndex}`}
      className={`kk-chip ${mirrored ? 'flex-row-reverse text-right' : ''} ${p.eliminated ? 'kk-chip-out' : ''} ${
        p.stunned ? 'kk-chip-stun' : ''
      }`}
      style={{ ['--chip' as string]: theme.primary }}
    >
      <div
        className={`kk-avatar ${abReady && !p.eliminated ? 'kk-avatar-ready' : ''}`}
        style={{ background: `conic-gradient(${abReady ? '#5ee7ff' : '#ffb627'} ${abPct}%, #1b2230 0)` }}
        title={abReady ? 'Güç hazır' : undefined}
      >
        <div className="kk-avatar-in">
          <CharacterPreviewSvg costume={p.costume} heroId={p.heroId} size={34} />
        </div>
        {p.shielded && <Shield className="kk-shield" />}
      </div>
      <div className="min-w-0 flex flex-col gap-1">
        <div className={`flex items-center gap-1.5 ${mirrored ? 'flex-row-reverse' : ''}`}>
          <span className="kk-tag" style={{ background: theme.primary }}>
            {p.isBot ? 'CPU' : `P${p.slotIndex + 1}`}
          </span>
          <span className="kk-chip-name">{p.name}</span>
        </div>
        {showLives ? (
          <div
            className={`kk-hp ${mirrored ? 'flex-row-reverse' : ''}`}
            role="meter"
            aria-label={`${p.name} can`}
            aria-valuemin={0}
            aria-valuemax={maxLives}
            aria-valuenow={lives}
          >
            {Array.from({ length: maxLives }).map((_, i) => (
              <span key={i} className={`kk-hp-seg ${i < lives ? 'on' : ''}`} />
            ))}
          </div>
        ) : (
          <span className="kk-score">{p.score}</span>
        )}
      </div>
    </div>
  );
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  achievementToasts,
  isOnlineGuest = false,
  touchControlsEnabled = false,
  onToggleMute,
  onPause,
  onFinishChaos,
  onTouchHeld,
  onTouchJump,
  onTouchAbility,
}) => {
  const hazardText = HAZARD_ICONS[hud.hazardPhase];
  const isTimed =
    hud.mode === 'time' ||
    hud.mode === 'crown' ||
    (hud.timeRemainingSec > 0 && (hud.mode === 'story' || hud.mode === 'saga'));
  const showLives =
    hud.mode === 'ffa' || hud.mode === 'team' || hud.mode === 'story' || hud.mode === 'saga' || hud.mode === 'adventure';
  const players = hud.mode === 'adventure' ? hud.players.filter((p) => p.team === 'A') : hud.players;
  const left = players.filter((_, i) => i % 2 === 0);
  const right = players.filter((_, i) => i % 2 === 1);

  const cd = Math.ceil(hud.countdown);
  const prevCd = useRef(cd);
  const [showGo, setShowGo] = useState(false);
  useEffect(() => {
    if (prevCd.current > 0 && cd === 0) {
      setShowGo(true);
      const t = window.setTimeout(() => setShowGo(false), 750);
      prevCd.current = cd;
      return () => window.clearTimeout(t);
    }
    prevCd.current = cd;
  }, [cd]);

  const showTouch = (touchControlsEnabled || isCoarsePointer) && !!onTouchHeld;
  const hold = (key: 'left' | 'right' | 'down') => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      onTouchHeld?.(key, true);
    },
    onPointerUp: () => onTouchHeld?.(key, false),
    onPointerCancel: () => onTouchHeld?.(key, false),
    onLostPointerCapture: () => onTouchHeld?.(key, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="kk-hud fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {left.map((p) => (
            <PlayerChip key={p.slotIndex} p={p} showLives={showLives} mirrored={false} />
          ))}
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <div className="kk-center">
            {isTimed ? (
              <span data-testid="hud-timer" className={hud.timeRemainingSec <= 10 ? 'text-[#ff5d6c]' : ''}>
                {Math.ceil(hud.timeRemainingSec)}
              </span>
            ) : (
              <span data-testid="hud-alive">{hud.aliveCount}</span>
            )}
          </div>
          {hud.storyObjective && (
            <div data-testid="hud-story-objective" className="kk-pill">
              {hud.storyObjective}
            </div>
          )}
          {hazardText && <div className="kk-pill kk-pill-warn">{hazardText}</div>}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {hud.mode === 'chaos' && !isOnlineGuest && (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Bitir"
                title="Bitir"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onFinishChaos();
                }}
                className="kk-btn kk-btn-icon bg-[#ffb627]"
              >
                <Flag className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="kk-btn kk-btn-icon bg-[#3d4a5c]"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Duraklat"
              data-testid="hud-pause-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="kk-btn kk-btn-icon bg-[#3d4a5c]"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          </div>
          {right.map((p) => (
            <PlayerChip key={p.slotIndex} p={p} showLives={showLives} mirrored />
          ))}
        </div>
      </div>

      {(cd > 0 || showGo) && (
        <div className="absolute inset-0 flex items-center justify-center" data-testid="countdown">
          <span key={cd > 0 ? cd : 'go'} className={`kk-count ${cd > 0 ? '' : 'kk-count-go'}`}>
            {cd > 0 ? cd : 'SAVAŞ!'}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {achievementToasts.length > 0 && (
          <div className="flex flex-col items-center gap-1.5">
            {achievementToasts.map((id) => {
              const def = getAchievementDef(id);
              if (!def) return null;
              return (
                <div key={id} data-testid={`achievement-toast-${id}`} className="kk-toast">
                  <Award className="w-5 h-5 text-[#ffb627] shrink-0" />
                  <span>{def.title}</span>
                </div>
              );
            })}
          </div>
        )}
        {showTouch && (
          <div className="flex items-end justify-between gap-4 pointer-events-auto select-none kk-touch">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Sol" className="kk-tbtn" {...hold('left')}>
                <ArrowLeft />
              </button>
              <button type="button" aria-label="Aşağı" className="kk-tbtn kk-tbtn-sm" {...hold('down')}>
                <ArrowDown />
              </button>
              <button type="button" aria-label="Sağ" className="kk-tbtn" {...hold('right')}>
                <ArrowRight />
              </button>
            </div>
            <div className="flex items-end gap-3">
              <button
                type="button"
                aria-label="Güç"
                className="kk-tbtn kk-tbtn-ability"
                onPointerDown={() => onTouchAbility?.()}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Zap />
              </button>
              <button
                type="button"
                aria-label="Zıpla"
                className="kk-tbtn kk-tbtn-jump"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                  onTouchJump?.();
                }}
                onPointerUp={() => onTouchHeld?.('upHeld', false)}
                onPointerCancel={() => onTouchHeld?.('upHeld', false)}
                onLostPointerCapture={() => onTouchHeld?.('upHeld', false)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <ArrowUp />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { ADVENTURE_CHAPTERS, AdventureChapter, AdventureProgress } from '../game/adventure';
import { AdventureModal } from './AdventureModal';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadFoundSecrets,
  matchSecret,
  normalizeSecretKey,
  pickQuip,
  saveFoundSecrets,
  SecretDef,
  SecretId,
  SECRETS,
} from '../game/jokes';
import { OrpheusSvg, SecretToast } from './SecretToast';
import {
  Compass,
  Globe,
  HelpCircle,
  LogOut,
  Map as MapIcon,
  Play,
  Settings,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { computeLevelFromXp, getHeroDef } from '../game/characters';
import { ACHIEVEMENTS, GAME_MAPS, GAME_MODES } from '../game/constants';
import { computeTotalSagaStars, SAGA_LEVELS } from '../game/saga';
import {
  AchievementState,
  CostumeConfig,
  GameModeId,
  GameSettings,
  MapId,
  MenuSubView,
  OnlineRoomState,
  PlayerProgression,
  PlayerSlotConfig,
  SagaLevelDef,
  SagaProgress,
  StoryChapterDef,
  StoryChoiceOption,
  StoryProgress,
} from '../game/types';
import { AchievementsModal } from './AchievementsModal';
import { CharacterPreviewSvg } from './CharacterPreviewSvg';
import { CharacterSelect } from './CharacterSelect';
import { HowToPlayModal } from './HowToPlayModal';
import { ModeMapSelect } from './ModeMapSelect';
import { OnlineLobbyModal } from './OnlineLobbyModal';
import { SagaMapModal } from './SagaMapModal';
import { SettingsModal } from './SettingsModal';
import { StoryModeModal } from './StoryModeModal';

interface MainMenuProps {
  subView: MenuSubView;
  settings: GameSettings;
  slots: PlayerSlotConfig[];
  storyProgress: StoryProgress;
  adventureProgress: AdventureProgress;
  onStartAdventureChapter: (chapter: AdventureChapter) => void;
  sagaProgress: SagaProgress;
  progression: PlayerProgression;
  achievementState: AchievementState;
  postVictoryChapterId: number | null;
  onlineRoom: OnlineRoomState | null;
  onlinePeerId: string | null;
  onlineError: string | null;
  onlineHasTurn: boolean;
  initialRoomCode: string;
  onSetSubView: (view: MenuSubView) => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onUpdateSlot: (slotIndex: number, patch: Partial<PlayerSlotConfig>) => void;
  onStartGame: () => void;
  onStartSagaLevel: (level: SagaLevelDef) => void;
  onClaimSagaMilestone: (stars: number, rewardXp: number) => void;
  onDismissStoryVictory: () => void;
  onSelectStoryChoice: (chapter: StoryChapterDef, choice: StoryChoiceOption) => void;
  onStartStoryChapter: (chapter: StoryChapterDef, bonusLives: number) => void;
  onCreateOnlineRoom: (name: string, costume: CostumeConfig) => Promise<void>;
  onJoinOnlineRoom: (code: string, name: string, costume: CostumeConfig) => Promise<void>;
  onUpdateOnlineProfile: (name: string, costume: CostumeConfig) => void;
  onUpdateOnlineRoomConfig: (patch: {
    mode?: GameModeId;
    mapId?: MapId;
    lives?: number;
    roundDurationSec?: number;
    botsEnabled?: boolean;
  }) => void;
  onStartOnlineMatch: () => void;
  onLeaveOnlineRoom: () => void;
  onClearOnlineError: () => void;
  onQuitApp: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  subView,
  settings,
  slots,
  storyProgress,
  adventureProgress,
  onStartAdventureChapter,
  sagaProgress,
  progression,
  achievementState,
  postVictoryChapterId,
  onlineRoom,
  onlinePeerId,
  onlineError,
  onlineHasTurn,
  initialRoomCode,
  onSetSubView,
  onUpdateSettings,
  onUpdateSlot,
  onStartGame,
  onStartSagaLevel,
  onClaimSagaMilestone,
  onDismissStoryVictory,
  onSelectStoryChoice,
  onStartStoryChapter,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onUpdateOnlineProfile,
  onUpdateOnlineRoomConfig,
  onStartOnlineMatch,
  onLeaveOnlineRoom,
  onClearOnlineError,
  onQuitApp,
}) => {
  const [confirmQuitOpen, setConfirmQuitOpen] = useState(false);
  const [activeSecret, setActiveSecret] = useState<SecretDef | null>(null);
  const [foundSecrets, setFoundSecrets] = useState<SecretId[]>(loadFoundSecrets);
  const keyBufferRef = useRef<string[]>([]);
  const titleClicksRef = useRef(0);

  const revealSecret = useCallback((secret: SecretDef) => {
    setActiveSecret(secret);
    setFoundSecrets((prev) => {
      if (prev.includes(secret.id)) return prev;
      const next = [...prev, secret.id];
      saveFoundSecrets(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!activeSecret) return;
    const t = window.setTimeout(() => setActiveSecret(null), 5000);
    return () => window.clearTimeout(t);
  }, [activeSecret]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      const buf = keyBufferRef.current;
      buf.push(normalizeSecretKey(e.key));
      if (buf.length > 16) buf.shift();
      const hit = matchSecret(buf);
      if (hit) {
        keyBufferRef.current = [];
        revealSecret(hit);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealSecret]);

  const handleTitleClick = () => {
    titleClicksRef.current += 1;
    if (titleClicksRef.current >= 5) {
      titleClicksRef.current = 0;
      const orpheus = SECRETS.find((s) => s.id === 'orpheus');
      if (orpheus) revealSecret(orpheus);
    }
  };

  const activeMode =
    GAME_MODES.find((m) => m.id === settings.mode) ?? GAME_MODES[0];
  const activeMap =
    GAME_MAPS.find((m) => m.id === settings.mapId) ?? GAME_MAPS[0];
  const activeHumans = slots.filter((s) => s.kind === 'human').length;
  const activeBots = settings.botsEnabled
    ? slots.filter((s) => s.kind === 'bot').length
    : 0;

  const xpInfo = computeLevelFromXp(progression.xp);
  const xpPct = Math.min(
    100,
    Math.round((xpInfo.currentLevelXp / Math.max(1, xpInfo.nextLevelXp)) * 100)
  );
  const totalStars = computeTotalSagaStars(sagaProgress);
  const p1Hero = getHeroDef(slots[0]?.heroId);

  const handleRequestQuit = () => {
    setConfirmQuitOpen(true);
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-6 pointer-events-none">
      <div className="flex-1 flex items-center justify-center pointer-events-auto">
        {subView === 'home' && (
          <div className="kk-home w-full h-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] items-center gap-4 md:gap-8">
            <div className="flex flex-col items-center md:items-start gap-5 md:gap-7">
              <button
                type="button"
                onClick={handleTitleClick}
                data-testid="menu-title"
                className="kk-title-btn"
                aria-label="Kale Kapmaca"
              >
                <span className="kk-title">KALE</span>
                <span className="kk-title kk-title-2">KAPMACA</span>
              </button>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={onStartGame}
                  data-start="true"
                  className="kk-btn kk-btn-xl bg-[#ffb627]"
                  aria-label="Oyna"
                >
                  <Play className="kk-ico fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => onSetSubView('adventure')}
                  data-testid="menu-adventure-btn"
                  className="kk-btn kk-btn-xl bg-[#e2444f]"
                  aria-label="Macera"
                >
                  <Swords className="kk-ico" />
                </button>
                <button
                  type="button"
                  onClick={() => onSetSubView('characters')}
                  data-testid="menu-characters-btn"
                  className="kk-btn kk-btn-xl bg-[#8e44c9]"
                  aria-label="Kahramanlar"
                >
                  <Users className="kk-ico" />
                </button>
                <button
                  type="button"
                  onClick={() => onSetSubView('online')}
                  data-testid="menu-online-btn"
                  className="kk-btn kk-btn-xl bg-[#2b8fd6]"
                  aria-label="Çevrimiçi"
                >
                  <Globe className="kk-ico" />
                </button>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                {[
                  { view: 'saga' as const, id: 'menu-saga-btn', label: 'Seviye Haritası', icon: MapIcon, bg: 'bg-[#ff6fa8]' },
                  { view: 'story' as const, id: 'menu-story-btn', label: 'Hikâye', icon: Compass, bg: 'bg-[#1fa59a]' },
                  { view: 'modes' as const, id: 'menu-modes-btn', label: 'Mod ve Harita', icon: Sparkles, bg: 'bg-[#f0883e]' },
                  { view: 'achievements' as const, id: 'menu-achievements-btn', label: 'Başarımlar', icon: Trophy, bg: 'bg-[#3d4a5c]' },
                  { view: 'settings' as const, id: 'menu-settings-btn', label: 'Ayarlar', icon: Settings, bg: 'bg-[#3d4a5c]' },
                  { view: 'howto' as const, id: 'menu-howto-btn', label: 'Nasıl Oynanır', icon: HelpCircle, bg: 'bg-[#3d4a5c]' },
                ].map((b) => (
                  <button
                    key={b.view}
                    type="button"
                    onClick={() => onSetSubView(b.view)}
                    data-testid={b.id}
                    className={`kk-btn kk-btn-sm ${b.bg}`}
                    aria-label={b.label}
                    title={b.label}
                  >
                    <b.icon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => onSetSubView('characters')}
                className="kk-hero-card"
                aria-label="Kahraman seç"
              >
                <CharacterPreviewSvg costume={slots[0]?.costume} heroId={slots[0]?.heroId} size={210} />
                <span data-testid="player-level-badge" className="kk-level">{xpInfo.level}</span>
              </button>
              <div className="kk-name">{slots[0]?.name || p1Hero.name}</div>
            </div>
          </div>
        )}

        {subView === 'saga' && (
          <SagaMapModal
            sagaProgress={sagaProgress}
            progression={progression}
            onStartLevel={onStartSagaLevel}
            onClaimMilestone={onClaimSagaMilestone}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'modes' && (
          <ModeMapSelect
            settings={settings}
            storyProgress={storyProgress}
            onUpdateSettings={onUpdateSettings}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
            onPlay={onStartGame}
          />
        )}

        {subView === 'characters' && (
          <CharacterSelect
            slots={slots}
            mode={settings.mode}
            botsEnabled={settings.botsEnabled}
            storyProgress={storyProgress}
            progression={progression}
            onUpdateSlot={onUpdateSlot}
            onToggleBotsEnabled={(botsEnabled) =>
              onUpdateSettings({ botsEnabled })
            }
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
            onPlay={onStartGame}
          />
        )}

        {subView === 'adventure' && (
          <AdventureModal
            progress={adventureProgress}
            onStartChapter={onStartAdventureChapter}
            onBack={() => onSetSubView('home')}
          />
        )}

        {subView === 'story' && (
          <StoryModeModal
            progress={storyProgress}
            postVictoryChapterId={postVictoryChapterId}
            onDismissVictory={onDismissStoryVictory}
            onSelectChoice={onSelectStoryChoice}
            onStartChapter={onStartStoryChapter}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'online' && (
          <OnlineLobbyModal
            room={onlineRoom}
            myPeerId={onlinePeerId}
            onlineError={onlineError}
            hasTurn={onlineHasTurn}
            initialRoomCode={initialRoomCode}
            defaultName={slots[0]?.name ?? 'Pofi'}
            defaultCostume={slots[0]?.costume}
            settings={settings}
            storyProgress={storyProgress}
            onCreateRoom={onCreateOnlineRoom}
            onJoinRoom={onJoinOnlineRoom}
            onUpdateProfile={onUpdateOnlineProfile}
            onUpdateRoomConfig={onUpdateOnlineRoomConfig}
            onStartMatch={onStartOnlineMatch}
            onLeaveRoom={onLeaveOnlineRoom}
            onClearError={onClearOnlineError}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'achievements' && (
          <AchievementsModal
            achievementState={achievementState}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}

        {subView === 'howto' && (
          <HowToPlayModal
            onBack={() => onSetSubView('home')}
            onQuit={handleRequestQuit}
          />
        )}
      </div>

      {activeSecret && (
        <SecretToast
          secret={activeSecret}
          found={foundSecrets.length}
          total={SECRETS.length}
          onClose={() => setActiveSecret(null)}
        />
      )}

      {/* Quit Confirmation Dialog */}
      {confirmQuitOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4 pointer-events-auto">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm bg-slate-950 border-2 border-rose-500 pixel-panel p-6 text-center text-amber-50"
          >
            <LogOut className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="font-display text-2xl font-bold text-amber-300">
              Oyundan Çıkılsın mı?
            </h3>
            <p className="text-xs text-slate-300 mt-1.5">
              İlerlemen, yıldızların ve seviyen otomatik olarak kaydedildi.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmQuitOpen(false)}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-600 text-amber-100 font-display font-bold text-sm cursor-pointer pixel-btn"
              >
                Vazgeç
              </button>
              <button
                type="button"
                data-testid="confirm-quit-btn"
                onClick={() => {
                  setConfirmQuitOpen(false);
                  onQuitApp();
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 border-2 border-rose-300 text-white font-display font-bold text-sm cursor-pointer pixel-btn"
              >
                Evet, Çık
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

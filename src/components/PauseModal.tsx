import React from 'react';
import { Home, Play, RotateCcw } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onMainMenu }) => {
  return (
    <div className="fixed inset-0 z-30 bg-[#0d1118]/70 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-label="Duraklatıldı" className="flex flex-col items-center gap-6">
        <h2 className="kk-title" style={{ fontSize: 'clamp(44px, 8vw, 80px)' }}>
          DURDU
        </h2>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onMainMenu} className="kk-btn kk-btn-xl bg-[#3d4a5c]" aria-label="Ana menü" title="Ana menü" data-testid="pause-menu-btn" style={{ width: 84, height: 84 }}>
            <Home className="kk-ico" />
          </button>
          <button type="button" onClick={onResume} className="kk-btn kk-btn-xl bg-[#ffb627]" aria-label="Devam" title="Devam" data-testid="pause-resume-btn" autoFocus>
            <Play className="kk-ico fill-current" />
          </button>
          <button type="button" onClick={onRestart} className="kk-btn kk-btn-xl bg-[#e2444f]" aria-label="Yeniden başlat" title="Yeniden başlat" data-testid="pause-restart-btn" style={{ width: 84, height: 84 }}>
            <RotateCcw className="kk-ico" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SecretDef } from '../game/jokes';

const ORPHEUS: [number, number, number, number, string][] = [
  [10, 2, 8, 2, '#1F0A10'], [8, 4, 12, 7, '#1F0A10'], [9, 4, 10, 6, '#EC3750'], [16, 5, 2, 2, '#FFFFFF'], [17, 5, 1, 1, '#1F0A10'],
  [12, 9, 7, 1, '#FFB3C0'], [6, 11, 12, 9, '#1F0A10'], [7, 11, 10, 8, '#EC3750'], [9, 13, 6, 5, '#FF8C9E'],
  [2, 14, 5, 3, '#1F0A10'], [3, 14, 4, 2, '#EC3750'], [0, 16, 3, 2, '#EC3750'],
  [17, 13, 3, 2, '#1F0A10'], [18, 13, 2, 1, '#EC3750'],
  [7, 19, 3, 4, '#1F0A10'], [8, 19, 1, 3, '#EC3750'], [13, 19, 3, 4, '#1F0A10'], [14, 19, 1, 3, '#EC3750'],
  [9, 0, 2, 2, '#EC3750'], [13, 0, 2, 2, '#EC3750'], [6, 10, 2, 2, '#EC3750'],
];

export const OrpheusSvg: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="-1 -1 23 25" shapeRendering="crispEdges" className={className} aria-hidden="true">
    {ORPHEUS.map(([x, y, w, h, fill], i) => (
      <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
    ))}
  </svg>
);

interface SecretToastProps {
  secret: SecretDef;
  found: number;
  total: number;
  onClose: () => void;
}

export const SecretToast: React.FC<SecretToastProps> = ({ secret, found, total, onClose }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto" role="status" data-testid="secret-toast">
    <button
      type="button"
      onClick={onClose}
      className="flex items-center gap-3 bg-slate-950 border-4 border-[#EC3750] px-4 py-3 pixel-panel text-left cursor-pointer secret-pop"
    >
      <OrpheusSvg size={56} className="orpheus-dance shrink-0" />
      <div>
        <div className="font-display text-[10px] font-bold tracking-[0.2em] text-[#FF8C9E]">
          GİZLİ SIR BULUNDU · {found}/{total}
        </div>
        <div className="font-display text-lg font-bold text-white">{secret.title}</div>
        <div className="text-xs text-slate-300 max-w-xs">{secret.text}</div>
      </div>
    </button>
  </div>
);

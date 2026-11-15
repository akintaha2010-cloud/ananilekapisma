import { MASCOT_EARS, MASCOT_QUILLS } from '../game/mascot';
import React from 'react';
import { CHARACTER_COLORS } from '../game/constants';
import { CostumeConfig, HeroId, HumanLookId } from '../game/types';
import { humanRects } from '../game/looks';

interface CharacterPreviewSvgProps {
  costume: CostumeConfig;
  heroId?: HeroId;
  look?: HumanLookId;
  size?: number;
  celebrating?: boolean;
  className?: string;
}

const BODY_ROWS: [number, number][] = [
  [-26, 4],
  [-25, 6],
  [-24, 7],
  [-23, 8],
  [-22, 8],
  [-21, 9],
  [-20, 9],
  [-19, 9],
  [-18, 9],
  [-17, 10],
  [-16, 10],
  [-15, 10],
  [-14, 10],
  [-13, 10],
  [-12, 10],
  [-11, 10],
  [-10, 10],
  [-9, 10],
  [-8, 10],
  [-7, 9],
  [-6, 9],
  [-5, 8],
  [-4, 7],
  [-3, 5],
];

const AKIN_RECTS: [number, number, number, number, string][] = [
  [-7, -11, 7, 8, '#111018'], [-6, -11, 5, 7, '#1C1B26'], [-7, -4, 8, 4, '#111018'], [-6, -4, 7, 3, '#F1F5F9'], [-6, -2, 7, 1, '#94A3B8'],
  [0, -11, 7, 8, '#111018'], [1, -11, 5, 7, '#1C1B26'], [0, -4, 8, 4, '#111018'], [1, -4, 7, 3, '#F1F5F9'], [1, -2, 7, 1, '#94A3B8'],
  [-11, -19, 4, 7, '#111018'], [-10, -19, 2, 4, '#4E9CC4'], [-10, -15, 2, 2, '#D99A6C'],
  [-8, -21, 16, 11, '#111018'], [-7, -20, 14, 9, '#7CC6E8'], [-7, -12, 14, 1, '#4E9CC4'], [-2, -20, 4, 9, '#FFFFFF'],
  [-5, -18, 1, 1, '#F6E7C1'], [-6, -15, 1, 1, '#E58FA0'], [4, -19, 1, 1, '#E58FA0'], [5, -14, 1, 1, '#F6E7C1'], [-4, -13, 1, 1, '#F6E7C1'],
  [-2, -20, 1, 4, '#111018'], [1, -20, 1, 4, '#111018'], [-2, -16, 4, 3, '#111018'], [-1, -15, 2, 1, '#FDE047'],
  [6, -19, 5, 7, '#111018'], [7, -19, 3, 4, '#7CC6E8'], [7, -15, 3, 2, '#F4C49C'],
  [-6, -31, 12, 11, '#111018'], [-5, -30, 10, 9, '#F4C49C'], [-6, -26, 1, 2, '#D99A6C'],
  [-7, -35, 14, 6, '#111018'], [-6, -34, 12, 4, '#4A2C1D'], [-7, -31, 3, 3, '#4A2C1D'], [-5, -37, 2, 3, '#4A2C1D'], [-1, -38, 2, 4, '#4A2C1D'],
  [3, -37, 3, 3, '#4A2C1D'], [6, -33, 2, 2, '#4A2C1D'], [-3, -34, 4, 1, '#6E4330'],
  [-4, -28, 10, 1, '#111018'], [-3, -28, 4, 3, '#111018'], [2, -28, 4, 3, '#111018'], [-2, -28, 1, 1, '#64748B'], [3, -28, 1, 1, '#64748B'],
  [0, -23, 3, 1, '#7A3B2E'], [3, -24, 1, 1, '#7A3B2E'],
];

export const CharacterPreviewSvg: React.FC<CharacterPreviewSvgProps> = ({
  costume,
  heroId,
  look,
  size = 84,
  celebrating = false,
  className = '',
}) => {
  const theme = CHARACTER_COLORS[costume.colorId];

  if (look) {
    return (
      <svg width={size} height={size} viewBox="-21 -46 42 50" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <g className={celebrating ? 'animate-bounce' : ''}>
          {humanRects(look, { walkStep: 0, air: false, t: 0 }).map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
          ))}
        </g>
      </svg>
    );
  }

  if (heroId === 'akin') {
    return (
      <svg width={size} height={size} viewBox="-21 -46 42 50" shapeRendering="crispEdges" className={className} aria-hidden="true">
        <g className={celebrating ? 'animate-bounce' : ''}>
          {AKIN_RECTS.map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
          ))}
        </g>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="-21 -46 42 50"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <g className={celebrating ? 'animate-bounce' : ''}>
        {/* Back Accessories: Pelerin / Kalkan / Kanat */}
        {costume.accessoryId === 'pelerin' && (
          <g>
            <rect x="-13" y="-18" width="9" height="14" fill={theme.dark} />
            <rect x="-12" y="-17" width="7" height="12" fill="#B91C1C" />
            <rect x="-12" y="-7" width="7" height="2" fill="#FACC15" />
          </g>
        )}
        {costume.accessoryId === 'kalkan' && (
          <g>
            <rect x="-13" y="-20" width="8" height="12" fill={theme.dark} />
            <rect x="-12" y="-19" width="6" height="10" fill="#94A3B8" />
            <rect x="-10" y="-16" width="2" height="4" fill={theme.trim} />
          </g>
        )}
        {costume.accessoryId === 'kanat' && (
          <g>
            <rect x="-16" y="-21" width="7" height="7" fill={theme.dark} />
            <rect x="-15" y="-20" width="5" height="5" fill="#F8FAFC" />
            <rect x="-15" y="-17" width="5" height="2" fill="#CBD5E1" />
            <rect x="9" y="-21" width="7" height="7" fill={theme.dark} />
            <rect x="10" y="-20" width="5" height="5" fill="#F8FAFC" />
            <rect x="10" y="-17" width="5" height="2" fill="#CBD5E1" />
          </g>
        )}

        {/* Pixel ground shadow */}
        <rect x="-10" y="0" width="20" height="2" fill="rgba(9, 14, 26, 0.55)" />

        {/* Chubby pixel feet */}
        <rect x="-7" y="-4" width="6" height="4" fill={theme.dark} />
        <rect x="-6" y="-3" width="4" height="2" fill={theme.secondary} />
        <rect x="-6" y="-3" width="2" height="1" fill={theme.light} />

        <rect x="1" y="-4" width="6" height="4" fill={theme.dark} />
        <rect x="2" y="-3" width="4" height="2" fill={theme.secondary} />
        <rect x="2" y="-3" width="2" height="1" fill={theme.light} />

        {/* Chubby pixel arms */}
        <rect x="-13" y="-13" width="4" height="5" fill={theme.dark} />
        <rect x="-12" y="-12" width="3" height="3" fill={theme.primary} />
        <rect x="9" y="-13" width="4" height="5" fill={theme.dark} />
        <rect x="9" y="-12" width="3" height="3" fill={theme.primary} />

        {/* Outer dark outline for Pou squircle */}
        {MASCOT_QUILLS.map((q, i) => (
          <rect key={`qo${i}`} x={q.x - 1} y={q.y - 1} width={q.s + 2} height={q.s + 2} fill="#140A10" />
        ))}
        {MASCOT_QUILLS.map((q, i) => (
          <rect key={`qf${i}`} x={q.x} y={q.y} width={q.s} height={q.s} fill={theme.dark} />
        ))}
        {MASCOT_EARS.map((e, i) => (
          <g key={`ear${i}`}>
            <rect x={e.x - 1} y={e.y - 1} width={e.s + 2} height={e.s + 2} fill={theme.dark} />
            <rect x={e.x} y={e.y} width={e.s} height={e.s} fill={theme.light} />
          </g>
        ))}
        <rect x="-4" y="-27" width="8" height="1" fill={theme.dark} />
        {BODY_ROWS.map(([y, hw]) => (
          <rect
            key={`out-${y}`}
            x={-hw - 1}
            y={y}
            width={(hw + 1) * 2}
            height="1"
            fill={theme.dark}
          />
        ))}
        <rect x="-5" y="-2" width="10" height="1" fill={theme.dark} />

        {/* Base clay body */}
        {BODY_ROWS.map(([y, hw]) => (
          <rect
            key={`fill-${y}`}
            x={-hw}
            y={y}
            width={hw * 2}
            height="1"
            fill={theme.primary}
          />
        ))}

        {/* Bottom-right 3D pixel shading */}
        <rect x="-8" y="-5" width="16" height="2" fill={theme.secondary} />
        <rect x="-5" y="-3" width="10" height="1" fill={theme.secondary} />
        <rect x="5" y="-16" width="5" height="10" fill={theme.secondary} />
        <rect x="7" y="-20" width="2" height="5" fill={theme.secondary} />

        {/* Top-left glossy clay highlight */}
        <rect x="-6" y="-24" width="5" height="2" fill={theme.light} />
        <rect x="-8" y="-22" width="3" height="4" fill={theme.light} />
        <rect x="-6" y="-23" width="3" height="1" fill="rgba(255,255,255,0.75)" />
        <rect x="-7" y="-22" width="1" height="2" fill="rgba(255,255,255,0.75)" />

        {/* Ottoman sash/belt */}
        <rect x="-10" y="-10" width="20" height="4" fill={theme.secondary} />
        <rect x="-10" y="-9" width="20" height="2" fill={theme.trim} />
        <rect x="-1" y="-10" width="3" height="4" fill={theme.trim} />

        {/* Big shiny pixel eyes */}
        <rect x="-5" y="-19" width="3" height="4" fill="#FFFFFF" />
        <rect x="-4" y="-18" width="2" height="3" fill="#0F172A" />
        <rect x="-4" y="-18" width="1" height="1" fill="#FFFFFF" />

        <rect x="2" y="-19" width="3" height="4" fill="#FFFFFF" />
        <rect x="3" y="-18" width="2" height="3" fill="#0F172A" />
        <rect x="3" y="-18" width="1" height="1" fill="#FFFFFF" />

        {/* Blushing cheeks & smile */}
        <rect x="-7" y="-15" width="2" height="1" fill="rgba(255,110,140,0.55)" />
        <rect x="5" y="-15" width="2" height="1" fill="rgba(255,110,140,0.55)" />
        <rect x="-1" y="-13" width="3" height="1" fill="#0F172A" />

        {/* Ottoman pixel mustache */}
        {costume.mustacheStyle === 'kaytan' && (
          <g fill="#241814">
            <rect x="-5" y="-15" width="10" height="1" />
            <rect x="-7" y="-16" width="3" height="1" />
            <rect x="4" y="-16" width="3" height="1" />
          </g>
        )}
        {costume.mustacheStyle === 'pala' && (
          <g fill="#241814">
            <rect x="-6" y="-15" width="12" height="2" />
            <rect x="-8" y="-14" width="3" height="2" />
            <rect x="5" y="-14" width="3" height="2" />
          </g>
        )}
        {costume.mustacheStyle === 'burgu' && (
          <g fill="#241814">
            <rect x="-5" y="-15" width="10" height="2" />
            <rect x="-7" y="-16" width="2" height="2" />
            <rect x="5" y="-16" width="2" height="2" />
          </g>
        )}
        {costume.mustacheStyle === 'cember' && (
          <g fill="#241814">
            <rect x="-6" y="-15" width="5" height="3" />
            <rect x="1" y="-15" width="5" height="3" />
            <rect x="-1" y="-15" width="2" height="2" />
          </g>
        )}
        {costume.mustacheStyle === 'sultan_sakal' && (
          <g fill="#241814">
            <rect x="-6" y="-15" width="12" height="2" />
            <rect x="-5" y="-13" width="10" height="3" />
            <rect x="-3" y="-10" width="6" height="2" />
            <rect x="-2" y="-12" width="4" height="2" fill="#475569" />
          </g>
        )}

        {/* Front Accessory: Gözlük */}
        {costume.accessoryId === 'gozluk' && (
          <g>
            <rect x="-6" y="-20" width="5" height="6" fill="#0F172A" />
            <rect x="1" y="-20" width="5" height="6" fill="#0F172A" />
            <rect x="-1" y="-18" width="2" height="1" fill="#0F172A" />
            <rect x="-5" y="-19" width="3" height="4" fill="#38BDF8" />
            <rect x="2" y="-19" width="3" height="4" fill="#38BDF8" />
            <rect x="-5" y="-19" width="1" height="2" fill="#E0F2FE" />
            <rect x="2" y="-19" width="1" height="2" fill="#E0F2FE" />
          </g>
        )}

        {/* Color-harmonized pixel Headgear */}
        {(costume.fesStyle === 'klasik_fes' || costume.fesStyle === 'puskullu_fes') && (() => {
          const h = costume.fesStyle === 'puskullu_fes' ? 10 : 8;
          const fezCol = costume.fesStyle === 'puskullu_fes' ? theme.secondary : theme.primary;
          return (
            <g>
              <rect x="-5" y={-26 - h - 1} width="10" height="1" fill={theme.dark} />
              <rect x="-6" y={-26 - h} width="12" height={h - 2} fill={theme.dark} />
              <rect x="-7" y="-29" width="14" height="4" fill={theme.dark} />

              <rect x="-5" y={-26 - h} width="10" height={h} fill={fezCol} />
              <rect x="-6" y="-29" width="12" height="3" fill={fezCol} />
              <rect x="-4" y={-25 - h} width="2" height={h - 3} fill="rgba(255,255,255,0.35)" />

              {costume.fesStyle === 'puskullu_fes' && (
                <rect x="-6" y="-28" width="12" height="2" fill={theme.trim} />
              )}

              <rect x="-1" y={-26 - h - 1} width="2" height="2" fill={theme.trim} />
              <rect x="-4" y={-26 - h} width="2" height="2" fill="#1E1B18" />
              <rect x="-5" y={-24 - h} width="2" height="5" fill="#1E1B18" />
            </g>
          );
        })()}

        {costume.fesStyle === 'yeniceri_bork' && (
          <g>
            <rect x="-9" y="-34" width="5" height="9" fill={theme.dark} />
            <rect x="-8" y="-33" width="3" height="7" fill="#E2E8F0" />

            <rect x="-5" y="-38" width="10" height="1" fill={theme.dark} />
            <rect x="-6" y="-37" width="12" height="12" fill={theme.dark} />
            <rect x="-5" y="-37" width="10" height="11" fill="#F8FAFC" />

            <rect x="1" y="-33" width="2" height="7" fill={theme.trim} />
            <rect x="2" y="-38" width="3" height="5" fill={theme.primary} />
            <rect x="0" y="-40" width="3" height="2" fill={theme.primary} />
          </g>
        )}

        {costume.fesStyle === 'saray_kavuk' && (
          <g>
            <rect x="-5" y="-36" width="10" height="4" fill={theme.dark} />
            <rect x="-9" y="-33" width="18" height="7" fill={theme.dark} />
            <rect x="-4" y="-35" width="8" height="3" fill={theme.secondary} />
            <rect x="-8" y="-32" width="16" height="5" fill="#FEF3C7" />
            <rect x="-6" y="-31" width="5" height="1" fill="#FFFFFF" />
            <rect x="1" y="-31" width="3" height="3" fill={theme.primary} />
          </g>
        )}

        {costume.fesStyle === 'denizci_bere' && (
          <g>
            <rect x="-8" y="-33" width="16" height="7" fill={theme.dark} />
            <rect x="-6" y="-35" width="12" height="3" fill={theme.dark} />
            <rect x="-7" y="-32" width="14" height="5" fill="#0F172A" />
            <rect x="-5" y="-34" width="10" height="2" fill="#0F172A" />
            <rect x="-7" y="-29" width="14" height="2" fill="#DC2626" />
            <rect x="-1" y="-32" width="2" height="2" fill="#FDE047" />
          </g>
        )}

        {costume.fesStyle === 'altin_migfer' && (
          <g>
            <rect x="-6" y="-37" width="12" height="11" fill={theme.dark} />
            <rect x="-8" y="-30" width="16" height="4" fill={theme.dark} />
            <rect x="-1" y="-40" width="2" height="3" fill={theme.dark} />
            <rect x="-5" y="-36" width="10" height="9" fill="#CBD5E1" />
            <rect x="-7" y="-29" width="14" height="2" fill="#CBD5E1" />
            <rect x="-5" y="-30" width="10" height="2" fill="#FACC15" />
            <rect x="0" y="-39" width="1" height="3" fill="#FACC15" />
          </g>
        )}

        {costume.fesStyle === 'sultan_taci' && (
          <g>
            <rect x="-8" y="-34" width="16" height="8" fill={theme.dark} />
            <rect x="-8" y="-37" width="4" height="3" fill={theme.dark} />
            <rect x="-2" y="-38" width="4" height="4" fill={theme.dark} />
            <rect x="4" y="-37" width="4" height="3" fill={theme.dark} />
            <rect x="-7" y="-33" width="14" height="6" fill="#FACC15" />
            <rect x="-7" y="-36" width="2" height="3" fill="#FACC15" />
            <rect x="-1" y="-37" width="2" height="4" fill="#FACC15" />
            <rect x="5" y="-36" width="2" height="3" fill="#FACC15" />
            <rect x="-1" y="-31" width="2" height="2" fill="#EF4444" />
            <rect x="-5" y="-31" width="2" height="2" fill="#14D8C4" />
            <rect x="3" y="-31" width="2" height="2" fill="#14D8C4" />
          </g>
        )}

        {/* Overhead Accessory: Mühür Halesi */}
        {costume.accessoryId === 'hale' && (
          <g>
            <rect x="-7" y="-42" width="14" height="3" fill="#B45309" />
            <rect x="-6" y="-41" width="12" height="1" fill="#FDE047" />
            <rect x="-3" y="-41" width="4" height="1" fill="#FFFFFF" />
          </g>
        )}
      </g>
    </svg>
  );
};

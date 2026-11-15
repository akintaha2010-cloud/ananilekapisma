import { BossKind, Crate, Decor, Encounter, FoeKind, HTheme, Level, Npc, PickupKind, Solid } from './types';

export const VIEW_W = 480;
export const VIEW_H = 270;
export const GROUND = 232;

type Seg =
  | { t: 'walk'; len: number; props?: string[] }
  | { t: 'gap'; len: number; bridge?: boolean }
  | { t: 'steps'; len: number }
  | { t: 'awnings'; len: number }
  | { t: 'crates'; len: number; loot: PickupKind[][] }
  | { t: 'fight'; waves: FoeKind[][]; tip?: string; bus?: boolean }
  | { t: 'boss'; boss: BossKind }
  | { t: 'npc'; text: string; look: Npc['look'] }
  | { t: 'check' }
  | { t: 'sign'; text: string };

function build(id: number, title: string, theme: HTheme, segs: Seg[]): Level {
  const solids: Solid[] = [];
  const crates: Crate[] = [];
  const encounters: Encounter[] = [];
  const checkpoints: number[] = [40];
  const decor: Decor[] = [];
  const npcs: Npc[] = [];
  let boss: BossKind | null = null;
  const ground = (a: number, b: number) => solids.push({ x: a, y: GROUND, w: b - a, h: VIEW_H - GROUND + 40, kind: 'ground' });
  let x = 0;
  ground(0, 320);
  decor.push({ x: 60, kind: 'lamp' }, { x: 200, kind: 'sign', text: 'HAVEN ANKARA' });
  x = 320;
  for (const s of segs) {
    switch (s.t) {
      case 'walk':
        ground(x, x + s.len);
        (s.props ?? []).forEach((p, i, arr) => decor.push({ x: x + 40 + (i * (s.len - 80)) / Math.max(1, arr.length - 1), kind: p }));
        x += s.len;
        break;
      case 'gap':
        if (s.bridge) solids.push({ x: x + s.len / 2 - 28, y: GROUND - 18, w: 56, h: 8, oneWay: true, kind: 'scaffold' });
        x += s.len;
        break;
      case 'steps':
        ground(x, x + s.len);
        solids.push({ x: x + 60, y: GROUND - 22, w: 70, h: 22, kind: 'block' });
        solids.push({ x: x + 130, y: GROUND - 44, w: 70, h: 44, kind: 'block' });
        solids.push({ x: x + 240, y: GROUND - 66, w: 60, h: 8, oneWay: true, kind: 'scaffold' });
        x += s.len;
        break;
      case 'awnings':
        ground(x, x + s.len);
        for (let a = x + 50; a < x + s.len - 60; a += 120) solids.push({ x: a, y: GROUND - 52 - ((a / 120) % 2) * 22, w: 64, h: 6, oneWay: true, kind: 'awning' });
        x += s.len;
        break;
      case 'crates':
        ground(x, x + s.len);
        s.loot.forEach((loot, i) => crates.push({ x: x + 50 + i * 46, y: GROUND - 20, w: 20, h: 20, hp: 2, loot, broken: false, shake: 0 }));
        x += s.len;
        break;
      case 'fight':
        ground(x, x + VIEW_W);
        encounters.push({ x, waves: s.waves, started: false, done: false, waveIdx: 0, tip: s.tip, bus: s.bus });
        decor.push({ x: x + 120, kind: 'lamp' }, { x: x + 360, kind: 'lamp' });
        x += VIEW_W;
        break;
      case 'boss':
        ground(x, x + VIEW_W);
        boss = s.boss;
        encounters.push({ x, waves: [[s.boss]], started: false, done: false, waveIdx: 0 });
        x += VIEW_W;
        break;
      case 'npc':
        npcs.push({ x: x - 60, text: s.text, look: s.look, said: false });
        break;
      case 'check':
        checkpoints.push(x - 40);
        decor.push({ x: x - 40, kind: 'flag' });
        break;
      case 'sign':
        decor.push({ x: x - 100, kind: 'sign', text: s.text });
        break;
    }
  }
  ground(x, x + 260);
  decor.push({ x: x + 120, kind: 'exit' });
  return { id, title, theme, width: x + 260, solids, crates, pickups: [], encounters, checkpoints, decor, npcs, exitX: x + 120, boss };
}

const C = (...k: PickupKind[]) => k;

export function buildHavenLevel(id: number): Level {
  switch (id) {
    case 101:
      return build(101, 'Haven Başlıyor', 'cankaya', [
        { t: 'walk', len: 260, props: ['tree', 'bench', 'tree'] },
        { t: 'npc', text: 'J/Z YUMRUK, K/X TEKME. ART ARDA BAS: KOMBO!', look: 'coder' },
        { t: 'crates', len: 220, loot: [C('coin', 'coin'), C('doner'), C('coin')] },
        { t: 'fight', waves: [['bug', 'bug']], tip: 'Yumruk yumruk tekme! Kombo yap Akın!' },
        { t: 'walk', len: 200, props: ['laptops', 'tree'] },
        { t: 'npc', text: 'L/C ILE ELINDEKINI AT. DONER BIR SILAHTIR.', look: 'coder' },
        { t: 'gap', len: 70 },
        { t: 'walk', len: 160 },
        { t: 'check' },
        { t: 'steps', len: 320 },
        { t: 'fight', waves: [['bug', 'bug'], ['bug', 'spammer']], tip: 'Uzaktan atan bug var, üstüne koş!' },
        { t: 'npc', text: 'HOCAM BIR CAY DAHA!', look: 'npc' },
        { t: 'crates', len: 160, loot: [C('heal'), C('cay')] },
        { t: 'fight', waves: [['bug', 'glitch', 'bug']] },
      ]);
    case 102:
      return build(102, 'Kızılay Kaosu', 'kizilay', [
        { t: 'walk', len: 220, props: ['metro', 'kiosk'] },
        { t: 'fight', waves: [['bug', 'bug', 'spammer']], tip: 'Kızılay bug dolu!' },
        { t: 'awnings', len: 380 },
        { t: 'crates', len: 200, loot: [C('skewer'), C('coin', 'coin'), C('heal')] },
        { t: 'gap', len: 76, bridge: true },
        { t: 'walk', len: 160, props: ['simit'] },
        { t: 'check' },
        { t: 'fight', waves: [['firewall', 'bug'], ['glitch', 'glitch', 'spammer']], tip: 'Firewall önden blok yapar. Arkasından vur ya da kayarak tekme at (Aşağı + Tekme)!' },
        { t: 'npc', text: 'KIZILAY METRO 404: HAT BULUNAMADI', look: 'npc' },
        { t: 'steps', len: 320 },
        { t: 'crates', len: 160, loot: [C('heal', 'coin'), C('cay')] },
        { t: 'check' },
        { t: 'boss', boss: 'mert' },
      ]);
    case 103:
      return build(103, 'Döner Savaşları', 'tunali', [
        { t: 'walk', len: 240, props: ['tree', 'pond', 'tree'] },
        { t: 'npc', text: 'KUGULAR BILE DONER KUYRUGUNDA...', look: 'cat' },
        { t: 'fight', waves: [['bug', 'glitch', 'bug'], ['spammer', 'spammer']] },
        { t: 'crates', len: 200, loot: [C('doner'), C('simit'), C('coin', 'coin')] },
        { t: 'gap', len: 72 },
        { t: 'awnings', len: 360 },
        { t: 'check' },
        { t: 'fight', waves: [['conflict'], ['bug', 'firewall', 'glitch']], tip: 'Merge Conflict iri! Ağır vuruşlarına dikkat.' },
        { t: 'npc', text: 'GIZLI DONER: TAVUK DEGIL, ET!', look: 'simitci' },
        { t: 'crates', len: 160, loot: [C('heal'), C('keyboard')] },
        { t: 'check' },
        { t: 'boss', boss: 'tuna' },
      ]);
    case 104:
      return build(104, 'Ankara Ayazı', 'frost', [
        { t: 'walk', len: 240, props: ['snowman', 'lamp'] },
        { t: 'fight', waves: [['bug', 'bug', 'glitch']], bus: true, tip: 'EGO 404 geliyor! Üstünden zıpla!' },
        { t: 'gap', len: 76, bridge: true },
        { t: 'steps', len: 320 },
        { t: 'crates', len: 200, loot: [C('cay'), C('heal'), C('coin', 'coin')] },
        { t: 'check' },
        { t: 'fight', waves: [['firewall', 'spammer'], ['conflict', 'glitch']] },
        { t: 'npc', text: 'AYAZ VAR, CAYINI AL!', look: 'devin_cay' },
        { t: 'awnings', len: 300 },
        { t: 'check' },
        { t: 'boss', boss: 'ayaz' },
      ]);
    case 105:
      return build(105, 'Glitch Kalesi', 'glitch', [
        { t: 'walk', len: 200, props: ['wall', 'wall'] },
        { t: 'fight', waves: [['glitch', 'glitch', 'bug'], ['spammer', 'firewall']] },
        { t: 'gap', len: 76 },
        { t: 'steps', len: 320 },
        { t: 'crates', len: 200, loot: [C('keyboard'), C('heal'), C('cay')] },
        { t: 'check' },
        { t: 'fight', waves: [['conflict', 'spammer'], ['glitch', 'glitch', 'firewall']], tip: 'Klonlar sahte! En parlak olanı gerçek.' },
        { t: 'gap', len: 72, bridge: true },
        { t: 'awnings', len: 300 },
        { t: 'crates', len: 120, loot: [C('heal', 'coin')] },
        { t: 'check' },
        { t: 'boss', boss: 'gokoz' },
      ]);
    default:
      return build(106, 'Prensesi Kurtar!', 'tower', [
        { t: 'walk', len: 200, props: ['laptops', 'wall'] },
        { t: 'fight', waves: [['bug', 'glitch', 'spammer'], ['conflict', 'firewall']] },
        { t: 'crates', len: 200, loot: [C('doner'), C('heal'), C('skewer')] },
        { t: 'gap', len: 76, bridge: true },
        { t: 'steps', len: 320 },
        { t: 'check' },
        { t: 'fight', waves: [['glitch', 'glitch', 'glitch'], ['conflict', 'spammer', 'bug']] },
        { t: 'crates', len: 160, loot: [C('heal', 'coin'), C('cay')] },
        { t: 'check' },
        { t: 'boss', boss: 'buglord' },
      ]);
  }
}

export const HAVEN_LEVEL_IDS = [101, 102, 103, 104, 105, 106];

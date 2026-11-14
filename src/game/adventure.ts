import {
  AdventureEnemyKind,
  AdventureState,
  CostumeConfig,
  HazardPhase,
  MapId,
  PlayerSlotConfig,
} from './types';

export type CutsceneSpeaker = 'hero' | 'orfe' | 'pasa' | 'knight' | 'mage';

export interface CutsceneLine {
  speaker: CutsceneSpeaker;
  text: string;
}

export interface AdventureChapter {
  id: number;
  title: string;
  subtitle: string;
  mapId: MapId;
  lives: number;
  hazard?: HazardPhase;
  ally: boolean;
  waves: AdventureEnemyKind[][];
  intro: CutsceneLine[];
  outro: CutsceneLine[];
  victoryText: string;
}

export const ORFE_COSTUME: CostumeConfig = {
  colorId: 'crimson',
  fesStyle: 'denizci_bere',
  mustacheStyle: 'burgu',
  accessoryId: 'kanat',
};

export const PASA_COSTUME: CostumeConfig = {
  colorId: 'shadow_obsidian',
  fesStyle: 'sultan_taci',
  mustacheStyle: 'sultan_sakal',
  accessoryId: 'pelerin',
};

const ENEMY_DEFS: Record<
  AdventureEnemyKind,
  Omit<PlayerSlotConfig, 'slotIndex' | 'kind' | 'team'>
> = {
  knight: {
    name: 'Şövalye',
    heroId: 'tiknaz',
    aiPersonality: 'aggressive',
    costume: { colorId: 'cobalt', fesStyle: 'altin_migfer', mustacheStyle: 'kaytan', accessoryId: 'kalkan' },
  },
  mage: {
    name: 'Kor Büyücü',
    heroId: 'kizil_bey',
    aiPersonality: 'chaotic',
    costume: { colorId: 'plum', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu', accessoryId: 'pelerin' },
  },
  shadow: {
    name: 'Gölge Akıncı',
    heroId: 'karanlik',
    aiPersonality: 'aggressive',
    costume: { colorId: 'turquoise', fesStyle: 'yeniceri_bork', mustacheStyle: 'pala', accessoryId: 'gozluk' },
  },
  boss: {
    name: 'Kara Paşa',
    heroId: 'altin_hakan',
    aiPersonality: 'aggressive',
    costume: PASA_COSTUME,
  },
};

export function buildAdventureEnemySlot(kind: AdventureEnemyKind, slotIndex: number): PlayerSlotConfig {
  const def = ENEMY_DEFS[kind];
  return { ...def, costume: { ...def.costume }, slotIndex, kind: 'bot', team: 'B' };
}

export function buildAdventureAllySlots(slots: PlayerSlotConfig[], chapter: AdventureChapter): PlayerSlotConfig[] {
  const allies = slots
    .filter((s) => s.kind !== 'off')
    .map((s) => ({ ...s, team: 'A' as const }));
  if (allies.length === 0) allies.push({ ...slots[0], kind: 'human', team: 'A' });
  if (chapter.ally && allies.length < 4) {
    const used = new Set(allies.map((s) => s.slotIndex));
    const free = [0, 1, 2, 3].find((i) => !used.has(i)) ?? 3;
    allies.push({
      slotIndex: free,
      kind: 'bot',
      name: 'Orfe',
      team: 'A',
      aiPersonality: 'balanced',
      heroId: 'leyla',
      costume: { ...ORFE_COSTUME },
    });
  }
  return allies;
}

export function createAdventureState(chapter: AdventureChapter): AdventureState {
  return {
    chapterId: chapter.id,
    waves: chapter.waves.map((w) => [...w]),
    waveIdx: 0,
    waveDelay: 0.8,
    bossSlot: null,
    nextSlot: 10,
    victoryText: chapter.victoryText,
    hp: {},
  };
}

export const ADVENTURE_CHAPTERS: AdventureChapter[] = [
  {
    id: 1,
    title: '1. Kale Kapısı',
    subtitle: 'Şenlik Yasaklandı',
    mapId: 'classic',
    lives: 4,
    ally: false,
    waves: [['knight', 'knight'], ['knight', 'knight', 'knight']],
    intro: [
      { speaker: 'pasa', text: 'Hayal Şenliği iptal! Bu kalede artık sadece BENİM kurallarım geçer.' },
      { speaker: 'hero', text: 'Şenliği kimse iptal edemez Paşa! O kapıyı açacağım.' },
      { speaker: 'pasa', text: 'Şövalyelerim! Şu fesliyi surlardan aşağı atın!' },
    ],
    outro: [
      { speaker: 'hero', text: 'Kapı bizim! Kalenin içine giriyorum.' },
      { speaker: 'orfe', text: 'Hey! Ben Orfe. Paşa atölyemi kilitledi, ben de seninle geliyorum!' },
    ],
    victoryText: 'Kale kapısı açıldı! Orfe ekibe katıldı.',
  },
  {
    id: 2,
    title: '2. Yıkık Surlar',
    subtitle: 'Ayağının Altı Çöküyor',
    mapId: 'crumbling',
    lives: 4,
    ally: true,
    waves: [['knight', 'knight', 'mage'], ['shadow', 'mage', 'knight']],
    intro: [
      { speaker: 'orfe', text: 'Dikkat, bu surlar çöküyor! Paşa taşları gevşetmiş.' },
      { speaker: 'knight', text: 'Paşa\'nın emri: buradan kimse geçemez!' },
      { speaker: 'hero', text: 'Kafalarına zıpla, aşağı it! Hadi Orfe!' },
    ],
    outro: [
      { speaker: 'orfe', text: 'Şuradaki kuleye bak... Paşa büyücüleri de tutmuş!' },
      { speaker: 'hero', text: 'Büyüye büyüyle cevap veririz.' },
    ],
    victoryText: 'Surlar geçildi! Sırada Büyücü Kulesi var.',
  },
  {
    id: 3,
    title: '3. Büyücü Kulesi',
    subtitle: 'Kor ve Gölge',
    mapId: 'towers',
    lives: 4,
    ally: true,
    waves: [['mage', 'mage'], ['shadow', 'shadow', 'mage'], ['mage', 'mage', 'knight']],
    intro: [
      { speaker: 'mage', text: 'Kor ateşim seni pişirecek, fesli!' },
      { speaker: 'hero', text: 'Yeteneğimi saklamıyorum artık. Hazır ol!' },
      { speaker: 'orfe', text: 'Ben yukarıdakileri hallederim!' },
    ],
    outro: [
      { speaker: 'mage', text: 'Ah... Paşa bize şenliğe davetiye bile vermemişti zaten.' },
      { speaker: 'hero', text: 'Gel o zaman. Şenliğe hepimiz davetliyiz!' },
    ],
    victoryText: 'Kule düştü! Büyücüler artık Paşa\'nın yanında değil.',
  },
  {
    id: 4,
    title: '4. Top Bataryası',
    subtitle: 'Lodos, Buz ve Gülle',
    mapId: 'hazard',
    lives: 5,
    ally: true,
    waves: [['knight', 'knight', 'knight'], ['shadow', 'shadow', 'knight', 'knight'], ['mage', 'mage', 'shadow']],
    intro: [
      { speaker: 'pasa', text: 'Toplarım sizi hendeğe uçuracak! Ateş!' },
      { speaker: 'orfe', text: 'Rüzgar da esiyor, zemin de buz! Dengeni koru!' },
      { speaker: 'hero', text: 'Tek tek değil, hep birlikte geliyoruz Paşa!' },
    ],
    outro: [
      { speaker: 'hero', text: 'Toplar sustu. Geriye bir tek taht salonu kaldı.' },
      { speaker: 'orfe', text: 'Paşa orada bekliyor... Hazır mısın?' },
    ],
    victoryText: 'Batarya susturuldu! Taht salonunun yolu açık.',
  },
  {
    id: 5,
    title: '5. Taht Salonu',
    subtitle: 'Kara Paşa ile Hesaplaşma',
    mapId: 'story_shadow',
    lives: 5,
    ally: true,
    waves: [['knight', 'knight', 'shadow'], ['boss', 'mage']],
    intro: [
      { speaker: 'pasa', text: 'Demek buraya kadar geldin. O halde tacımı al... alabilirsen!' },
      { speaker: 'hero', text: 'Tacın değil, şenlik için geldim Paşa!' },
      { speaker: 'orfe', text: 'Dikkat, Paşa çok iri! Kafasına birkaç kez zıplamak lazım!' },
    ],
    outro: [
      { speaker: 'pasa', text: 'Peki... Aslında kimse beni şenliğe çağırmadı. O yüzden kızmıştım.' },
      { speaker: 'hero', text: 'Şimdi çağırıyoruz! Hayal Şenliği\'ne hoş geldin Paşa.' },
      { speaker: 'orfe', text: 'Yaşasın! Kale yeniden herkesin!' },
    ],
    victoryText: 'Kara Paşa yenildi! Hayal Şenliği geri döndü.',
  },
];

const ADVENTURE_STORAGE_KEY = 'kale_kapmaca_macera_v1';

export interface AdventureProgress {
  completed: number[];
}

export function loadAdventureProgress(): AdventureProgress {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ADVENTURE_STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.completed)) return { completed: parsed.completed.filter(Number.isFinite) };
  } catch {
    /* ignore corrupt save */
  }
  return { completed: [] };
}

export function saveAdventureProgress(progress: AdventureProgress) {
  try {
    localStorage.setItem(ADVENTURE_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable */
  }
}

export function isAdventureChapterUnlocked(progress: AdventureProgress, chapterId: number): boolean {
  return chapterId === 1 || progress.completed.includes(chapterId - 1);
}

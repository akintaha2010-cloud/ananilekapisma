import {
  AdventureEnemyKind,
  HeroId,
  AdventureState,
  CostumeConfig,
  HazardPhase,
  MapId,
  PlayerSlotConfig,
} from './types';

export type CutsceneSpeaker =
  | 'hero'
  | 'orfe'
  | 'pasa'
  | 'knight'
  | 'mage'
  | 'devin'
  | 'ozgur'
  | 'mert'
  | 'tuna'
  | 'ayaz'
  | 'gokoz'
  | 'buglord'
  | 'npc';

export type AdventureCampaign = 'pasa' | 'haven';
export type StoryAllyId = 'orfe' | 'devin' | 'ozgur' | 'mert' | 'tuna' | 'gokoz';

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
  campaign?: AdventureCampaign;
  allies?: StoryAllyId[];
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

export const HAVEN_CAST = {
  devin: { name: 'Devin', heroId: 'zeynep' as HeroId, costume: { colorId: 'turquoise', fesStyle: 'denizci_bere', mustacheStyle: 'cember', accessoryId: 'kanat' } as CostumeConfig },
  ozgur: { name: 'Prenses Özgür', heroId: 'leyla' as HeroId, costume: { colorId: 'plum', fesStyle: 'sultan_taci', mustacheStyle: 'kaytan', accessoryId: 'pelerin' } as CostumeConfig },
  mert: { name: 'Mert', heroId: 'tiknaz' as HeroId, costume: { colorId: 'crimson', fesStyle: 'altin_migfer', mustacheStyle: 'pala', accessoryId: 'kalkan' } as CostumeConfig },
  tuna: { name: 'Tuna', heroId: 'kizil_bey' as HeroId, costume: { colorId: 'tangerine', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu', accessoryId: 'pelerin' } as CostumeConfig },
  ayaz: { name: 'Ankara Ayazı', heroId: 'karahan' as HeroId, costume: { colorId: 'turquoise', fesStyle: 'altin_migfer', mustacheStyle: 'cember', accessoryId: 'hale' } as CostumeConfig },
  gokoz: { name: 'Gököz', heroId: 'karanlik' as HeroId, costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'sultan_sakal', accessoryId: 'hale' } as CostumeConfig },
  buglord: { name: 'Bug Lord', heroId: 'altin_hakan' as HeroId, costume: { colorId: 'shadow_obsidian', fesStyle: 'sultan_taci', mustacheStyle: 'sultan_sakal', accessoryId: 'kanat' } as CostumeConfig },
  bug: { name: 'Bug', heroId: 'karanlik' as HeroId, costume: { colorId: 'emerald', fesStyle: 'klasik_fes', mustacheStyle: 'kaytan', accessoryId: 'gozluk' } as CostumeConfig },
};

export const ADVENTURE_ENEMY_HP: Record<AdventureEnemyKind, number> = {
  knight: 2,
  mage: 1,
  shadow: 2,
  boss: 8,
  bug: 1,
  mert: 6,
  tuna: 6,
  ayaz: 5,
  gokoz: 8,
  buglord: 10,
};

const BOSS_KINDS = new Set<AdventureEnemyKind>(['boss', 'mert', 'tuna', 'ayaz', 'gokoz', 'buglord']);

export function isAdventureBoss(kind: AdventureEnemyKind): boolean {
  return BOSS_KINDS.has(kind);
}

const havenFoe = (key: keyof typeof HAVEN_CAST, aiPersonality: PlayerSlotConfig['aiPersonality']) => ({
  name: HAVEN_CAST[key].name,
  heroId: HAVEN_CAST[key].heroId,
  aiPersonality,
  costume: HAVEN_CAST[key].costume,
});

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
  bug: havenFoe('bug', 'chaotic'),
  mert: havenFoe('mert', 'aggressive'),
  tuna: havenFoe('tuna', 'balanced'),
  ayaz: havenFoe('ayaz', 'defensive'),
  gokoz: havenFoe('gokoz', 'chaotic'),
  buglord: havenFoe('buglord', 'aggressive'),
};

export function buildAdventureEnemySlot(kind: AdventureEnemyKind, slotIndex: number): PlayerSlotConfig {
  const def = ENEMY_DEFS[kind];
  return { ...def, costume: { ...def.costume }, slotIndex, kind: 'bot', team: 'B' };
}

export function buildAdventureAllySlots(slots: PlayerSlotConfig[], chapter: AdventureChapter): PlayerSlotConfig[] {
  if (chapter.campaign === 'haven') return buildHavenAllySlots(slots, chapter);
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

function buildHavenAllySlots(slots: PlayerSlotConfig[], chapter: AdventureChapter): PlayerSlotConfig[] {
  const humans = slots.filter((s) => s.kind === 'human').map((s) => ({ ...s, team: 'A' as const }));
  if (humans.length === 0) humans.push({ ...slots[0], kind: 'human', team: 'A' });
  humans[0] = { ...humans[0], name: 'Akın', heroId: 'akin' };
  const allies: PlayerSlotConfig[] = [...humans];
  for (const id of chapter.allies ?? []) {
    if (allies.length >= 4) break;
    const used = new Set(allies.map((s) => s.slotIndex));
    const free = [0, 1, 2, 3].find((i) => !used.has(i)) ?? 3;
    const cast = id === 'orfe' ? { name: 'Orfe', heroId: 'leyla' as HeroId, costume: ORFE_COSTUME } : HAVEN_CAST[id];
    allies.push({
      slotIndex: free,
      kind: 'bot',
      name: cast.name,
      team: 'A',
      aiPersonality: 'balanced',
      heroId: cast.heroId,
      costume: { ...cast.costume },
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

  {
    id: 101,
    campaign: 'haven',
    title: '1. Haven Başlıyor',
    subtitle: 'Çankaya Gençlik Merkezi',
    mapId: 'story_origin',
    lives: 5,
    ally: true,
    allies: ['devin'],
    waves: [['bug', 'bug'], ['bug', 'bug', 'bug']],
    intro: [
      { speaker: 'npc', text: '14 Kasım, Ankara. Haven\'ın açılışına saatler kala... elektrikler kesildi. Karanlıkta bir kahkaha duyuldu.' },
      { speaker: 'devin', text: 'Akın... Çok kötü bir şey oldu.' },
      { speaker: 'hero', text: 'Wi-Fi mı gitti?' },
      { speaker: 'devin', text: 'DAHA KÖTÜ! Özgür prenses oldu ve altın klavyeyle birlikte kaçırıldı!' },
      { speaker: 'devin', text: 'Mert, Tuna ve Gököz de gizemli bir glitch yüzünden üç boss\'a dönüştü!' },
      { speaker: 'hero', text: 'Ben sadece döner yemeye gelmiştim... Peki, şu bug\'ları ezelim.' },
    ],
    outro: [
      { speaker: 'devin', text: 'İz Kızılay\'a gidiyor! Orada saatler deli gibi tıkırdıyor.' },
      { speaker: 'hero', text: 'Saat sesi mi? Bu kesin Mert. Deadline kokusu alıyorum.' },
    ],
    victoryText: 'Gençlik merkezi temizlendi! Devin ekibe katıldı.',
  },
  {
    id: 102,
    campaign: 'haven',
    title: '2. Kızılay Kaosu',
    subtitle: 'Mert: The Deadline Destroyer',
    mapId: 'story_crimson',
    lives: 5,
    ally: true,
    allies: ['devin'],
    waves: [['bug', 'bug', 'bug'], ['mert', 'bug']],
    intro: [
      { speaker: 'npc', text: 'Kızılay Meydanı. Tabelalar yanıp sönüyor, metro girişinden bug\'lar fışkırıyor.' },
      { speaker: 'mert', text: 'Akın! Proje teslimine 5 dakika kaldı ve sen hâlâ commit atmadın!' },
      { speaker: 'hero', text: 'Mert abi, kendine gel! Sen organizatörsün, deadline değil!' },
      { speaker: 'mert', text: 'BEN DEADLINE\'IN TA KENDİSİYİM! Klavye çekicimi tat!' },
      { speaker: 'devin', text: 'Kafasına birkaç kez zıpla, saati duracaktır!' },
    ],
    outro: [
      { speaker: 'mert', text: 'Tamam tamam... PR\'ı merge\'leyeceğim! Neredeydim ben?' },
      { speaker: 'hero', text: 'Glitch\'ten kurtuldun abi. Tuna nerede?' },
      { speaker: 'mert', text: 'Tunalı Hilmi\'de... Döner şişini kılıç gibi sallıyordu.' },
    ],
    victoryText: 'Mert kurtarıldı! "PR merge edildi."',
  },
  {
    id: 103,
    campaign: 'haven',
    title: '3. Döner Savaşları',
    subtitle: 'Tuna: The Döner King',
    mapId: 'story_golden',
    lives: 5,
    ally: true,
    allies: ['devin', 'mert'],
    waves: [['bug', 'bug', 'bug'], ['tuna', 'bug', 'bug']],
    intro: [
      { speaker: 'npc', text: 'Kuğulu Park. Kuğular bile döner kuyruğuna girmiş.' },
      { speaker: 'tuna', text: 'ANKARA\'NIN EN İYİ DÖNERİ BENİM!' },
      { speaker: 'hero', text: 'Abi ben tavuk döner istiyorum.' },
      { speaker: 'tuna', text: 'YANLIŞ CEVAP!' },
      { speaker: 'mert', text: 'Ben sağdan geliyorum Akın, sen kafasına zıpla!' },
    ],
    outro: [
      { speaker: 'tuna', text: 'Of... Kafam döner gibi dönüyor. Akın, al şu döneri, canın dolsun.' },
      { speaker: 'devin', text: 'Hava soğuyor... Ankara ayazı geliyor, çaylarınızı alın!' },
    ],
    victoryText: 'Tuna kurtarıldı! Dev bir döner canını doldurdu.',
  },
  {
    id: 104,
    campaign: 'haven',
    title: '4. Ankara Ayazı',
    subtitle: 'Buzlu Sokaklar ve EGO 404',
    mapId: 'story_frost',
    lives: 5,
    ally: true,
    allies: ['devin', 'tuna'],
    waves: [['bug', 'bug'], ['bug', 'bug', 'bug'], ['ayaz', 'bug']],
    intro: [
      { speaker: 'npc', text: 'Karlı sokaklar. Durakta kapıları kendi kendine açılan bir EGO otobüsü: "404 — Hat bulunamadı."' },
      { speaker: 'devin', text: 'Otobüsten bug\'lar iniyor! Arkasından da... buzdan bir dev!' },
      { speaker: 'ayaz', text: 'Ben Ankara Ayazıyım. Kimse benden kaçamaz, montunu ilikle bakalım!' },
      { speaker: 'hero', text: 'Devin, bana çay! Sıcak çay ayaza karşı en iyi kalkan.' },
    ],
    outro: [
      { speaker: 'devin', text: 'Ayaz eridi. Kaleye gitmeden önce bir yere uğrayalım mı?' },
      { speaker: 'hero', text: 'Evet. Anıtkabir\'e.' },
      { speaker: 'npc', text: 'Anıtkabir. Kar sessizce yağıyor. Akın ve Devin bir süre hiç konuşmuyor.' },
      { speaker: 'devin', text: '...' },
      { speaker: 'hero', text: 'Hadi Devin. Yolumuz uzun.' },
    ],
    victoryText: 'Ayaz geçti, otobüs garaja döndü. Sıra Ankara Kalesi\'nde.',
  },
  {
    id: 105,
    campaign: 'haven',
    title: '5. Glitch Kalesi',
    subtitle: 'Gököz: The Glitch Master',
    mapId: 'story_lost',
    lives: 5,
    ally: true,
    allies: ['devin', 'mert', 'tuna'],
    waves: [['bug', 'bug', 'bug'], ['bug', 'bug', 'bug'], ['gokoz', 'bug', 'bug']],
    intro: [
      { speaker: 'npc', text: 'Ankara Kalesi, ama pikselleri titriyor. Surlarda kod sembolleri dönüyor.' },
      { speaker: 'gokoz', text: 'Akın... Buraya kadar geleceğini düşünmemiştim.' },
      { speaker: 'hero', text: 'Ben de Ankara\'da bu kadar yürüyeceğimi düşünmemiştim.' },
      { speaker: 'gokoz', text: 'O ZAMAN SON COMMIT\'İNİ YAP!' },
      { speaker: 'devin', text: 'Dikkat, klonlar sahte! Gerçek Gököz en parlak olanı!' },
    ],
    outro: [
      { speaker: 'gokoz', text: 'Glitch... gitti. Akın, Özgür gizli kulede. Bug Lord onu ve altın klavyeyi tutuyor.' },
      { speaker: 'mert', text: 'Hepimizi bozan oymuş. Bu sefer birlikte gidiyoruz.' },
    ],
    victoryText: 'Gököz kurtarıldı! Özgür\'ün yeri bulundu.',
  },
  {
    id: 106,
    campaign: 'haven',
    title: '6. Prensesi Kurtar!',
    subtitle: 'Haven\'ın Gizli Kulesi',
    mapId: 'story_tournament',
    lives: 6,
    ally: true,
    allies: ['devin', 'ozgur', 'gokoz'],
    waves: [['bug', 'bug', 'bug'], ['bug', 'bug', 'bug', 'bug'], ['buglord', 'bug', 'bug']],
    intro: [
      { speaker: 'hero', text: 'Özgür! Seni kurtarmaya geldim!' },
      { speaker: 'ozgur', text: 'Çok geç kaldın. Burada Wi-Fi bile çekmiyor!' },
      { speaker: 'hero', text: 'Üç boss kestim, EGO otobüsüyle savaştım!' },
      { speaker: 'ozgur', text: 'Döner getirdin mi?' },
      { speaker: 'hero', text: '...' },
      { speaker: 'ozgur', text: 'GERİ DÖN.' },
      { speaker: 'buglord', text: 'HAHAHA! Altın klavye benim! Haven\'ı sonsuz bir hata döngüsüne sokacağım!' },
      { speaker: 'ozgur', text: 'Yeter! Klavyeyi korumak için bekliyordum. Ben prenses değilim... ben bir hacker\'ım!' },
      { speaker: 'devin', text: 'Herkes yan yana! Enerji kalkanı açık!' },
    ],
    outro: [
      { speaker: 'buglord', text: 'Hayır... düzeltildim... ben sadece... bir yazım hatasıydım...' },
      { speaker: 'ozgur', text: 'Altın klavye geri geldi. Haven açılabilir!' },
      { speaker: 'tuna', text: 'Herkese döner benden!' },
      { speaker: 'mert', text: 'Çaylar da benden. Deadline yok, sadece showcase var.' },
      { speaker: 'devin', text: 'HAVEN ANKARA SAVED! Made with chaos, code & döner.' },
    ],
    victoryText: 'HAVEN ANKARA SAVED! Made with chaos, code & döner.',
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
  return chapterId === 1 || chapterId === 101 || progress.completed.includes(chapterId - 1);
}

export function chaptersOf(campaign: AdventureCampaign): AdventureChapter[] {
  return ADVENTURE_CHAPTERS.filter((c) => (c.campaign ?? 'pasa') === campaign);
}

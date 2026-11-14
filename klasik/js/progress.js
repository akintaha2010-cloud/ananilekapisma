import { COLORS, HATS, STACHES } from './character.js';

export const SAVE_KEY = 'kale-kapismasi-kayit';

const heroOf = (g) => g.players.find((p) => p.info.kind === 'hero' && p.info.control === 'human') || g.players[0];
export const won = (g, hero = heroOf(g)) => (g.result?.team ? g.result.team === hero.team : g.result?.winnerId === hero.id);
const livesLeft = (g) => Math.max(0, heroOf(g).lives);

const coinStars = (g) => (won(g) ? 1 + (livesLeft(g) >= 3) + ((g.ms.coins || 0) >= (g.level.coins?.length || 1) / 2) : 0);
const advGoals = ['Çıkışa ulaş', '3 can ile bitir', 'Altınların yarısını topla'];
const lifeStars = (a, b) => (g) => (won(g) ? 1 + (livesLeft(g) >= a) + (livesLeft(g) >= b) : 0);
const S = (who, say, extra = {}) => ({ who, say, ...extra });

export const CHAPTERS = [
  {
    id: 'b1',
    title: 'Kale Kapısı',
    story: 'Hayal Şenliği için kaleye geldin ama Kara Paşa kapıları kapatmış. Akıncıları ez, içeri gir!',
    cfg: { mode: 'macera', map: 'giris', lives: 5 },
    goals: advGoals,
    stars: coinStars,
    intro: {
      start: { hero: 260 },
      beats: [
        S('orfe', 'Hey! Sen de Hayal Şenliği için mi geldin? Bu gece kalede yüz genç birlikte oyun yapacaktı!', { move: { orfe: 620 } }),
        S('hero', 'Evet! Kendi oyunumu da getirdim. Ama kapılar neden kapalı?'),
        S('pasa', 'HAHAHA! Çünkü bu kale artık benim! Burada kimse bir şey yapamaz, inşa etmek YASAK!', { move: { pasa: 1010 } }),
        S('pasa', 'Akıncılarım kapıyı tutuyor. Hadi bakalım, geçebilirsen geç!', { leave: ['pasa'] }),
        S('orfe', 'Ben Orfe. Korkma, kafalarına zıpla, hendeğe it. Kapıya kadar koş!'),
      ],
    },
    outro: {
      start: { hero: 420, orfe: 720 },
      beats: [S('orfe', 'İçerideyiz! Ama Paşa bütün aletleri hurdalığa atmış.'), S('hero', 'O zaman hurdalıktan yenilerini toplarız!')],
    },
  },
  {
    id: 'b2',
    title: 'Hurdalık',
    story: 'Hurdadan bile harika şeyler yapılır! Hurda yığınlarını aş, Paşanın adamlarını dağıt.',
    cfg: { mode: 'macera', map: 'hurdalik', lives: 5 },
    goals: advGoals,
    stars: coinStars,
    intro: {
      start: { hero: 360, orfe: 700 },
      beats: [
        S('orfe', 'Burası Hurdalık. Hack Clubta derler ki: hurdadan bile harika şeyler yapılır!'),
        S('hero', 'Parçaları toplayıp kendi mancınığımızı yaparız.'),
        S('pasa', 'Hurdalarım da benim! Bölükbaşım sizi bekliyor!', { move: { pasa: 1050 } }),
      ],
    },
    outro: {
      start: { hero: 420, orfe: 720 },
      beats: [S('hero', 'Parçalar tamam!'), S('orfe', 'Eyvah! Paşanın ordusu şenlik atölyesine saldırıyor. Koş!')],
    },
  },
  {
    id: 'b3',
    title: 'Atölyeyi Savun',
    story: 'İçeride herkes oyununu bitirmeye çalışıyor. Akıncılar kapıya vuruyor, 3 dalga boyunca kapıyı koru!',
    cfg: { mode: 'kusatma', map: 'avlu', theme: 'safak', waves: 3, gateHp: 100 },
    goals: ['Kapıyı koru', 'Kapı yarıdan fazla sağlam kalsın', 'Kapı %80 sağlam kalsın'],
    stars: (g) => (won(g) ? 1 + (g.ms.gate.hp > 50) + (g.ms.gate.hp > 80) : 0),
    intro: {
      start: { hero: 420, orfe: 640 },
      beats: [
        S('pasa', 'Atölyenizi yerle bir edeceğim! Akıncılar, SALDIRIN!', { move: { pasa: 1040 } }),
        S('orfe', 'Kapı yıkılırsa herkesin oyunu gider. Kapının önünde dur, gelenleri ez!'),
      ],
    },
    outro: {
      start: { hero: 420, orfe: 640, pasa: 1040 },
      beats: [S('pasa', 'Grr! Bu daha bitmedi! Büyü Kulesinde sizi bekliyorum!', { leave: ['pasa'] }), S('hero', 'Kuleye!')],
    },
  },
  {
    id: 'b4',
    title: 'Büyü Kulesi',
    story: 'Paşa kuleden büyülü taşlar yağdırıyor. Gölgeyi görünce kaç, kuleyi aş!',
    cfg: { mode: 'macera', map: 'kule', lives: 5, rocks: true, rockEvery: 2.4 },
    goals: advGoals,
    stars: coinStars,
    intro: {
      start: { hero: 380, orfe: 700 },
      beats: [
        S('orfe', 'Burası Büyü Kulesi. Paşa yukarıdan büyülü taşlar atıyor.'),
        S('hero', 'Bizim karşı büyümüz ne?'),
        S('orfe', 'Çok basit: yerde kırmızı gölge görünce kaç!'),
      ],
    },
    outro: {
      start: { hero: 420, orfe: 720 },
      beats: [S('orfe', 'Kulenin tepesinden limanı gördüm. Paşanın korsan gemileri orada!')],
    },
  },
  {
    id: 'b5',
    title: 'Korsan Limanı',
    story: 'Paşa herkesin oyunlarını gemilere yükledi. Gemiden gemiye zıpla, limanı geç!',
    cfg: { mode: 'macera', map: 'liman', lives: 5 },
    goals: advGoals,
    stars: coinStars,
    intro: {
      start: { hero: 380, orfe: 640 },
      beats: [
        S('pasa', 'Gemilerimle bütün oyunlarınızı denizin dibine götüreceğim!', { move: { pasa: 1050 } }),
        S('orfe', 'Gemiler gidip geliyor. Doğru anda zıpla, düşersen hendek seni yutar!'),
      ],
    },
    outro: { start: { hero: 420, orfe: 720 }, beats: [S('hero', 'Oyunlar kurtuldu!'), S('orfe', 'Ama Yıldız Salonundan garip bir müzik geliyor...')] },
  },
  {
    id: 'b6',
    title: 'Yıldız Dansı',
    story: 'Paşa arkadaşlarını büyüledi! Tacı kap, 20 saniye tut, büyüyü boz.',
    cfg: { mode: 'tac', map: 'surlar', theme: 'gece', crownTime: 20, cpus: [{ diff: 'orta', color: 6 }, { diff: 'orta', color: 3 }] },
    goals: ['Tacı kazan', 'Rakipler 10 saniyeye ulaşmadan kazan', 'Rakipler 5 saniyeye ulaşmadan kazan'],
    stars: (g) => {
      if (!won(g)) return 0;
      const best = Math.max(0, ...g.players.filter((p) => p !== heroOf(g)).map((p) => g.ms.score[p.id] || 0));
      return 1 + (best < 10) + (best < 5);
    },
    intro: {
      start: { hero: 380, orfe: 640 },
      beats: [S('orfe', 'Arkadaşlarımız büyülenmiş, sana saldıracaklar! Büyünün kaynağı o taç.'), S('hero', 'Tacı ben alırsam büyü bozulur!')],
    },
    outro: { start: { hero: 420, orfe: 720 }, beats: [S('orfe', 'Herkes kendine geldi! Paşanın gizli atölyesi yerin altında olmalı.')] },
  },
  {
    id: 'b7',
    title: 'Yeraltı Atölyesi',
    story: 'Paşanın gizli yeraltı atölyesi. Asansörlere bin, iki bölükbaşını geç!',
    cfg: { mode: 'macera', map: 'atolye', lives: 5, enemyDiff: 'orta' },
    goals: advGoals,
    stars: coinStars,
    intro: {
      start: { hero: 380, orfe: 680 },
      beats: [S('orfe', 'Burası çok karanlık. Asansörlere dikkat et, aşağısı derin!'), S('pasa', 'Atölyeme kimse giremez! Bölükbaşılarım, yakalayın onları!', { move: { pasa: 1060 } })],
    },
    outro: { start: { hero: 420, orfe: 720, pasa: 1050 }, beats: [S('pasa', 'Yeter! Taht salonuna gel de kim kazanıyor görelim!', { leave: ['pasa'] })] },
  },
  {
    id: 'b8',
    title: 'Taht Salonu',
    story: 'Son kapışma! Kara Paşanın kafasına zıpla, Hayal Şenliğini kurtar.',
    cfg: { mode: 'saldiri', map: 'taht', theme: 'ates', bossLives: 5, bossDiff: 'zor', enemyDiff: 'orta', maxGuards: 3, guardEvery: 5, rocks: true, rockEvery: 2.6, lives: 5 },
    goals: ['Kara Paşayı yen', '3 can ile kazan', 'Hiç can kaybetmeden kazan'],
    stars: lifeStars(3, 5),
    intro: {
      start: { hero: 320, orfe: 560, pasa: 980 },
      beats: [
        S('pasa', 'Burası benim tahtım! Kimse benden güzel oyun yapamaz!'),
        S('hero', 'Oyun yapmak herkesin hakkı Paşa!'),
        S('orfe', 'Kafasına zıpla! Muhafızlarına ve taşlara dikkat et!'),
      ],
    },
    outro: {
      start: { hero: 360, orfe: 580, pasa: 960 },
      beats: [
        S('pasa', 'Peki... yenildim. Aslında ben de oyun yapmak istiyordum. Ama kimse beni şenliğe çağırmadı.'),
        S('hero', 'O zaman gel, birlikte yapalım! Kapışma oyunu için bir kötü adama ihtiyacımız var zaten.'),
        S('pasa', 'Gerçekten mi? Hehe... Peki!'),
        S('orfe', 'Hayal Şenliği başlasın! Herkes oyununu göstersin!'),
      ],
    },
  },
];

export const SHOP = {
  hat: { fes: 0, yok: 0, migfer: 60, sarik: 80, bork: 120, tac: 250 },
  stache: { klasik: 0, yok: 0, ince: 40, gur: 60, pala: 100 },
  color: Object.fromEntries(COLORS.map((c, i) => [i, i < 8 ? 0 : 50])),
};
export const ITEM_LIST = {
  hat: HATS.map((h) => ({ id: h.id, name: h.name })),
  stache: STACHES.map((s) => ({ id: s.id, name: s.name })),
  color: COLORS.map((c, i) => ({ id: String(i), name: c.name })),
};

export function newSave() {
  return {
    gold: 0,
    stars: {},
    owned: { hat: ['fes', 'yok'], stache: ['klasik', 'yok'], color: ['0', '1', '2', '3', '4', '5', '6', '7'] },
    look: { color: 0, hat: 'fes', stache: 'klasik' },
    name: '',
  };
}

export function loadSave(storage = globalThis.localStorage) {
  const base = newSave();
  try {
    const s = JSON.parse(storage?.getItem(SAVE_KEY));
    if (!s || typeof s !== 'object') return base;
    return {
      ...base,
      ...s,
      owned: { ...base.owned, ...(s.owned || {}) },
      look: { ...base.look, ...(s.look || {}) },
      stars: { ...(s.stars || {}) },
    };
  } catch {
    return base;
  }
}

export function storeSave(save, storage = globalThis.localStorage) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* ignore */
  }
}

export const owns = (save, kind, id) => save.owned[kind].includes(String(id));
export const price = (kind, id) => SHOP[kind][id] ?? 0;

export function buy(save, kind, id) {
  id = String(id);
  if (owns(save, kind, id)) return true;
  const cost = price(kind, id);
  if (save.gold < cost) return false;
  save.gold -= cost;
  save.owned[kind].push(id);
  return true;
}

export function equip(save, kind, id) {
  if (!owns(save, kind, id)) return false;
  save.look[kind] = kind === 'color' ? Number(id) : id;
  return true;
}

export const chapterUnlocked = (save, idx) => idx === 0 || (save.stars[CHAPTERS[idx - 1].id] || 0) > 0;
export const totalStars = (save) => Object.values(save.stars).reduce((a, b) => a + b, 0);

/** Applies the result of a finished match to the save. Returns { gold, stars, newStars }. */
export function reward(save, g, chapterIdx = -1, hero = heroOf(g)) {
  const win = won(g, hero);
  let gold = (win ? 25 : 8) + hero.stomps * 4 + hero.kills * 3 + (g.ms?.coins || 0);
  let stars = 0;
  let newStars = 0;
  if (chapterIdx >= 0) {
    const ch = CHAPTERS[chapterIdx];
    stars = ch.stars(g);
    const before = save.stars[ch.id] || 0;
    newStars = Math.max(0, stars - before);
    if (stars > before) save.stars[ch.id] = stars;
    gold += newStars * 20;
  }
  save.gold += gold;
  return { gold, stars, newStars, win };
}

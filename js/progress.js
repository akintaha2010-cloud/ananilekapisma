import { COLORS, HATS, STACHES } from './character.js';

export const SAVE_KEY = 'kale-kapismasi-kayit';

const heroOf = (g) => g.players.find((p) => p.info.kind === 'hero' && p.info.control === 'human') || g.players[0];
export const won = (g, hero = heroOf(g)) => (g.result?.team ? g.result.team === hero.team : g.result?.winnerId === hero.id);
const livesLeft = (g) => Math.max(0, heroOf(g).lives);

export const CHAPTERS = [
  {
    id: 'b1',
    title: 'Avluda İlk Kapışma',
    story: 'Kalenin avlusunda bir haydut dolaşıyor. Kafasına zıpla, ez!',
    cfg: { mode: 'kapisma', map: 'avlu', theme: 'gunduz', lives: 3, cpus: [{ diff: 'kolay', color: 8, hat: 'migfer' }] },
    goals: ['Kazan', '2 can ile kazan', 'Hiç can kaybetmeden kazan'],
    stars: (g) => (won(g) ? 1 + (livesLeft(g) >= 2) + (livesLeft(g) >= 3) : 0),
  },
  {
    id: 'b2',
    title: 'Surlarda Kuşatma',
    story: 'Akıncılar kapıya dayandı! 3 dalga boyunca kapıyı koru.',
    cfg: { mode: 'kusatma', map: 'surlar', theme: 'safak', waves: 3, gateHp: 100 },
    goals: ['Kapıyı koru', 'Kapı yarıdan fazla sağlam kalsın', 'Kapı %80 sağlam kalsın'],
    stars: (g) => (won(g) ? 1 + (g.ms.gate.hp > 50) + (g.ms.gate.hp > 80) : 0),
  },
  {
    id: 'b3',
    title: 'Asma Köprü Düellosu',
    story: 'İki rakip köprüde seni bekliyor. Aşağısı derin hendek!',
    cfg: { mode: 'kapisma', map: 'kopru', theme: 'gece', lives: 3, cpus: [{ diff: 'kolay', color: 1 }, { diff: 'orta', color: 2, hat: 'sarik' }] },
    goals: ['Kazan', '2 can ile kazan', 'Hiç can kaybetmeden kazan'],
    stars: (g) => (won(g) ? 1 + (livesLeft(g) >= 2) + (livesLeft(g) >= 3) : 0),
  },
  {
    id: 'b4',
    title: 'Zindanda Taş Yağmuru',
    story: 'Düşman mancınıkları zindana taş atıyor. Gölgelerden kaç, rakiplerini ez.',
    cfg: { mode: 'mancinik', map: 'zindan', lives: 3, rockEvery: 1.3, cpus: [{ diff: 'kolay', color: 4 }, { diff: 'orta', color: 5, hat: 'bork' }] },
    goals: ['Kazan', '2 can ile kazan', 'Hiç can kaybetmeden kazan'],
    stars: (g) => (won(g) ? 1 + (livesLeft(g) >= 2) + (livesLeft(g) >= 3) : 0),
  },
  {
    id: 'b5',
    title: 'Karlı Gece Baskını',
    story: 'Kışın ortasında büyük baskın. 5 dalga ve bölükbaşılar geliyor!',
    cfg: { mode: 'kusatma', map: 'avlu', theme: 'kis', waves: 5, gateHp: 100 },
    goals: ['Kapıyı koru', 'Kapı yarıdan fazla sağlam kalsın', 'Kapı %80 sağlam kalsın'],
    stars: (g) => (won(g) ? 1 + (g.ms.gate.hp > 50) + (g.ms.gate.hp > 80) : 0),
  },
  {
    id: 'b6',
    title: 'Sultanın Tacı',
    story: 'Kayıp taç avluda bulundu. Tacı kap, 20 saniye elinde tut!',
    cfg: { mode: 'tac', map: 'surlar', theme: 'gunduz', crownTime: 20, cpus: [{ diff: 'orta', color: 6 }, { diff: 'orta', color: 3 }] },
    goals: ['Tacı kazan', 'Rakipler 10 saniyeye ulaşmadan kazan', 'Rakipler 5 saniyeye ulaşmadan kazan'],
    stars: (g) => {
      if (!won(g)) return 0;
      const best = Math.max(0, ...g.players.filter((p) => p !== heroOf(g)).map((p) => g.ms.score[p.id] || 0));
      return 1 + (best < 10) + (best < 5);
    },
  },
  {
    id: 'b7',
    title: 'Taht Salonuna Saldırı',
    story: 'Sıra bizde! Kara Paşanın tahtına saldır ve onu ez.',
    cfg: { mode: 'saldiri', map: 'taht', bossLives: 3, lives: 5 },
    goals: ['Kara Paşayı yen', '3 can ile kazan', 'Hiç can kaybetmeden kazan'],
    stars: (g) => (won(g) ? 1 + (livesLeft(g) >= 3) + (livesLeft(g) >= 5) : 0),
  },
  {
    id: 'b8',
    title: 'Son Kuşatma',
    story: 'Kale yanıyor! Kara Paşa bütün muhafızlarıyla geri döndü.',
    cfg: { mode: 'saldiri', map: 'taht', theme: 'ates', bossLives: 5, bossDiff: 'zor', enemyDiff: 'orta', maxGuards: 3, guardEvery: 5, rocks: true, rockEvery: 2.2, lives: 5 },
    goals: ['Kara Paşayı yen', '3 can ile kazan', 'Hiç can kaybetmeden kazan'],
    stars: (g) => (won(g) ? 1 + (livesLeft(g) >= 3) + (livesLeft(g) >= 5) : 0),
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

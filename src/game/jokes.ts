export const MENU_TIPS: string[] = [
  'İpucu: Rakibin kafasına zıpla. Kafası düzleşir, egosu da.',
  'İpucu: Surdan düşen geri gelmez. Ankara ayazı gibi, affetmez.',
  'Orpheus diyor ki: "Önce ship et, sonra cilala!"',
  'Hack Club Haven Ankara: çay ocağı açık, Wi-Fi şifresi "shipit123" (değil).',
  'İpucu: Kara Paşa aslında kötü değil, sadece şenliğe çağrılmamış.',
  'Akın oyunu yazarken 7 bardak çay içti. 8. bardak boss savaşına saklandı.',
  'Bilgi: Fes kafada durursa havalı, düşerse komik. İkisi de puan.',
  'Bug değil özellik: Tıknaz Ali göbeğiyle kapı açabiliyor.',
  'İpucu: Hızlı İn tuşu (S) ile yere çakıl, etraf zangır zangır titresin.',
  'Hack Club sticker\'ı laptopa yapıştırınca +10 havalılık. Bilimsel olarak kanıtlanmadı.',
  'Kızılay\'da trafik, kalede kaos. İkisinden de ezilmeden çık.',
  'İpucu: Taç Kapışı\'nda tacı taşıyan hep hedefte. Kral olmak zor iş.',
  'Döner dükkânı kapanmadan bölümü bitir. Öncelikler önemli.',
  'Devin bu oyunu yaparken hiç çay içmedi. Çünkü elleri yok.',
  'Gizli kod var. Klavyede bir şeyler yazmayı dene... "haven" gibi mesela.',
];

export const VICTORY_QUIPS: string[] = [
  'Rakipler krep gibi yayıldı. Afiyet olsun!',
  'Zafer çayı demlendi, ince belli bardakta servis ediliyor.',
  'Orpheus bu zaferi #ship kanalına attı bile.',
  'Kale duvarları bile alkışladı. Taşlar biraz çatladı ama olsun.',
  'Fes hâlâ kafanda. Efsane!',
  'Kara Paşa bu maçı izledi ve not aldı.',
  'Bıyıkların rüzgârda dalgalandı. Çok dramatikti.',
];

export const DEFEAT_QUIPS: string[] = [
  'Yenildin ama bıyık hâlâ yerinde. Moral bozma.',
  'Kaybettin. Bir çay iç, tekrar dene.',
  'Hata 404: Zafer bulunamadı.',
  'Kaleden düştün ama en azından şık düştün.',
  'Merak etme, Orpheus da ilk seferde ship edemedi.',
];

export function pickQuip(list: string[], seed: number): string {
  if (list.length === 0) return '';
  const i = Math.abs(Math.floor(seed)) % list.length;
  return list[i];
}

export type SecretId = 'konami' | 'haven' | 'shipit' | 'orpheus' | 'cay';

export interface SecretDef {
  id: SecretId;
  sequence: string[];
  title: string;
  text: string;
}

const letters = (word: string) => word.split('');

export const SECRETS: SecretDef[] = [
  {
    id: 'konami',
    sequence: ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'],
    title: 'Efsane Kod!',
    text: 'Orpheus dinozoru kaleye daldı! +30 can... şaka şaka, ama çok havalı oldu.',
  },
  {
    id: 'haven',
    sequence: letters('haven'),
    title: 'Hack Club Haven Ankara',
    text: 'Hoş geldin hacker! Çay ocak başında, laptoplar açık, kod yazmaya hazırız.',
  },
  {
    id: 'shipit',
    sequence: letters('shipit'),
    title: 'SHIP IT!',
    text: 'Projeyi bitirmek yok, ship etmek var. Akın onaylıyor.',
  },
  {
    id: 'orpheus',
    sequence: letters('orpheus'),
    title: 'Orpheus Göründü',
    text: 'Hack Club\'ın dinozoru seni izliyor. Biraz kod yaz, mutlu olsun.',
  },
  {
    id: 'cay',
    sequence: letters('cay'),
    title: 'Hocam Bir Çay Daha!',
    text: 'Ankara usulü tavşan kanı çay geldi. Moral +100.',
  },
];

export function normalizeSecretKey(key: string): string {
  const k = key.toLowerCase();
  if (k === 'ç') return 'c';
  if (k === 'ı') return 'i';
  if (k === 'ş') return 's';
  return k;
}

export function matchSecret(buffer: string[]): SecretDef | null {
  for (const s of SECRETS) {
    const n = s.sequence.length;
    if (buffer.length < n) continue;
    const tail = buffer.slice(buffer.length - n);
    if (tail.every((k, i) => k === s.sequence[i])) return s;
  }
  return null;
}

const SECRETS_STORAGE_KEY = 'kale_kapmaca_sirlar_v1';

export function loadFoundSecrets(): SecretId[] {
  try {
    const raw = globalThis.localStorage?.getItem(SECRETS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => SECRETS.some((s) => s.id === id)) : [];
  } catch {
    return [];
  }
}

export function saveFoundSecrets(ids: SecretId[]) {
  try {
    globalThis.localStorage?.setItem(SECRETS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
}

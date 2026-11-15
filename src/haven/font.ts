const G: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100110101010', '7': '111001010010010', '8': '010101010101010',
  '9': '010101011001110', ' ': '000000000000000', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010',
  ',': '000000000010100', ':': '000010000010000', '-': '000000111000000', '+': '000010111010000', '/': '001001010100100',
  "'": '010010000000000', '%': '101001010100101', '<': '001010100010001', '>': '100010001010100', '(': '010100100100010',
  ')': '010001001001010', '&': '010101010101011', '*': '000101010101000', '"': '101101000000000', '#': '101111101111101',
};
const TR: Record<string, string> = { Ç: 'C', Ğ: 'G', İ: 'I', I: 'I', Ö: 'O', Ş: 'S', Ü: 'U', Â: 'A' };

export function normText(s: string): string {
  return s
    .toLocaleUpperCase('tr-TR')
    .split('')
    .map((c) => TR[c] ?? c)
    .join('');
}

export function textWidth(s: string, scale = 1): number {
  return Math.max(0, normText(s).length * 4 * scale - scale);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
  align: 'left' | 'center' | 'right' = 'left',
  shadow: string | null = '#0B0B14'
) {
  const s = normText(text);
  const w = textWidth(s, scale);
  const sx = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  const sy = Math.round(y);
  const pass = (col: string, ox: number, oy: number) => {
    ctx.fillStyle = col;
    for (let i = 0; i < s.length; i++) {
      const g = G[s[i]];
      if (!g) continue;
      const gx = sx + i * 4 * scale;
      for (let p = 0; p < 15; p++) if (g[p] === '1') ctx.fillRect(gx + (p % 3) * scale + ox, sy + Math.floor(p / 3) * scale + oy, scale, scale);
    }
  };
  if (shadow) pass(shadow, scale, scale);
  pass(color, 0, 0);
}

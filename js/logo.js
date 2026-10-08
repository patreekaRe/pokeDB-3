/* ============================================================
   logo.js  -  the title's pixel "Poké Deckbound" logo (the user's pick, 2026-09-28;
   renamed from PokéDB 2026-10-08: "Poké" small over "Deckbound").

   Hand-drawn glyphs, each painted on its own small canvas (so the
   letters can still bounce in and wave one by one, css/screens.css):
   yellow faces with a light band on top and a shade band below, the
   Poké Ball for the "o", a blue outline, a dark outer rim and a hard
   drop shadow. PIXEL() CSS pixels a logo pixel, whole numbers only so
   the pixels stay square; repainted on resize.
   ============================================================ */

const GLYPHS = {
  P: ['.#######..', '#########.', '###...####', '###....###', '###....###', '###...####', '#########.', '########..', '###.......', '###.......', '###.......', '###.......', '###.......', '###.......'],
  o: ['............', '............', '............', '...rrrrrr...', '.rrhhrrrrrr.', '.rhrrrrrrRr.', 'rrrrrrrrrrRR', 'rrrrkkkkrrRR', 'kkkkkwwkkkkk', 'kkkkkwwkkkkk', 'wwwwkkkkwwgg', '.wwwwwwwwgg.', '.wwwwwwwggg.', '...wwwggg...'],
  k: ['###......', '###......', '###......', '###......', '###......', '###...###', '###..###.', '###.###..', '######...', '#######..', '###.####.', '###..###.', '###...###', '###...###'],
  é: ['.....###.', '....###..', '...###...', '.........', '.........', '..#####..', '.#######.', '###...###', '#########', '#########', '###......', '###....##', '.########', '..######.'],
  D: ['########..', '#########.', '###...####', '###....###', '###....###', '###....###', '###....###', '###....###', '###....###', '###....###', '###....###', '###...####', '#########.', '########..'],
  B: ['########..', '#########.', '###...####', '###....###', '###...####', '########..', '#########.', '###...####', '###....###', '###....###', '###....###', '###...####', '#########.', '########..'],
};
const X = '.........';   // lowercase letters sit on rows 5-13 (é's own rows), ascenders run the full 14
const n = [X, X, X, X, X, '#######..', '########.', '###..####', '###...###', '###...###', '###...###', '###...###', '###...###', '###...###'];
const b = ['###......', '###......', '###......', '###......', '###......', '#######..', '########.', '###..####', '###...###', '###...###', '###...###', '###..####', '########.', '#######..'];
const mirror = (rows) => rows.map(r => [...r].reverse().join(''));
Object.assign(GLYPHS, {
  e: [X, X, X, X, X, ...GLYPHS['é'].slice(5)],
  c: [X, X, X, X, X, '..######.', '.########', '###....##', '###......', '###......', '###......', '###....##', '.########', '..######.'],
  b, d: mirror(b), n,
  u: [X, X, X, X, X, ...mirror(n.slice(5).reverse())],
  O: [X, X, X, X, X, '..#####..', '.#######.', '###...###', '###...###', '###...###', '###...###', '###...###', '.#######.', '..#####..'],   // a plain o (the "o" is Poké's Poké Ball)
});
export const LOGO = [['P', 'o', 'k', 'é'], ['D', 'e', 'c', 'k', 'b', 'O', 'u', 'n', 'd']];

const ROWS = 14;
const YELLOW = ['#fff4a0', '#f8d030', '#d8a010'];   // light band, face, shade band
const BALL = { r: '#e83828', R: '#a01818', h: '#ff9a88', k: '#181010', w: '#f8f8f8', g: '#c4cadc' };
const OUTLINE = '#2a4cb0', RIM = '#101a50', SHADOW = '#0c0c28';
export const EDGE = 3;   // logo pixels each glyph's canvas overlaps the next: its rim and shadow, leaving 2 pixels between faces

/** CSS pixels per logo pixel: "Deckbound" about 80% of the width (clear of the corner buttons), at most 5. */
export const logoPixel = () => Math.max(2, Math.min(5, Math.floor(innerWidth * 0.8 / 104)));

/** One glyph on its own canvas, with its outline, rim and shadow. */
export function paintGlyph(ch, px) {
  const glyph = GLYPHS[ch];
  const w = glyph[0].length + 4, h = ROWS + 4;   // 2 pixels of outline and rim each side
  const m = Array.from({ length: h }, () => Array(w).fill(null));
  const top = ch === 'é' ? 5 : glyph.findIndex(row => row.includes('#'));   // the light band tops a lowercase letter, not row 0
  glyph.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    if (ch === 'o') m[y + 2][x + 2] = BALL[c];
    else if (ch === 'é' && y < 3) m[y + 2][x + 2] = YELLOW[1];   // the accent: flat, no bands
    else m[y + 2][x + 2] = YELLOW[y - top <= 2 ? 0 : y >= ROWS - 3 ? 2 : 1];
  }));
  const ring = (mark, isInside) => {
    const add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isInside(m[y + dy]?.[x + dx]))) add.push([x, y]);
    }
    add.forEach(([x, y]) => { m[y][x] = mark; });
  };
  ring(OUTLINE, v => v && v !== OUTLINE);
  ring(RIM, v => !!v);
  const canvas = document.createElement('canvas');
  canvas.width = (w + 1) * px;
  canvas.height = (h + 1) * px;
  const g = canvas.getContext('2d');
  for (const [dx, color] of [[1, SHADOW], [0, null]]) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y][x]) continue;
      g.fillStyle = color || m[y][x];
      g.fillRect((x + dx) * px, (y + dx) * px, px, px);
    }
  }
  return canvas;
}

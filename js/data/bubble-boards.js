/* bubble-boards.js  -  Squirtle Bubble Shooter's boards (js/arcade-bubble.js), laid out by hand like Puzzle Bobble's
   (2026-10-13, the user's pick): each board is a fixed set of bubbles, nothing is ever added to it, and the ceiling
   lowers it a row every `push` shots. A row is a string a cell: W water, F fire, G grass, E electric, P psychic, Y fairy,
   . empty; even rows are 10 cells, odd rows 9 and set half a bubble in. Every bubble must hang from the ceiling
   (tests/bubble.test.mjs). Past the last board they come round again, recoloured, the ceiling a shot sooner each lap. */

export const LETTERS = 'WFGEPY';
export const LAP_FASTER = 1, MIN_PUSH = 3;

export const BOARDS = [
  { name: 'First Splash', push: 10, rows: [
    'WWFFGGWWFF',
    'WFFGGWWFF',
    'FFGGWWFFGG',
    'FGGWWFFGG',
  ] },
  { name: 'Layer Cake', push: 10, rows: [
    'FFFFFFFFFF',
    'GGGGGGGGG',
    'WWWWWWWWWW',
    'FFFFFFFFF',
    'GGGGGGGGGG',
  ] },
  { name: 'Funnel', push: 9, rows: [
    'WWWWWWWWWW',
    'FFFFFFFFF',
    '.GGGGGGGG.',
    '.WWWWWWW.',
    '..FFFFFF..',
    '..GGGGG..',
  ] },
  { name: 'Ribbons', push: 9, rows: [
    'WWEEFFGGWW',
    'WEEFFGGWW',
    'WWEEFFGGWW',
    'WEEFFGGWW',
    'WWEEFFGGWW',
  ] },
  { name: 'Poké Ball', push: 9, rows: [
    '..FFFFFF..',
    '.FFFFFFF.',
    'FFFFFFFFFF',
    'WWWWEWWWW',
    'GGGGEEGGGG',
    'GGGGGGGGG',
    '.GGGGGGGG.',
    '..GGGGG..',
  ] },
  { name: 'Three Lamps', push: 9, rows: [
    'EEEEEEEEEE',
    '.E...E..E',
    '.WW.FF.GG.',
    'WWW.FFFGG',
    'WWW..FF.GG',
    '.W...F..G',
  ] },
  { name: 'Diamonds', push: 8, rows: [
    'WWFFWWFFWW',
    'GWWFWWFWG',
    'GGWEEWWEEG',
    'GGEEEEEEG',
    '.GGEEEEGG.',
    '..GGGGGG.',
  ] },
  { name: 'Heart', push: 8, rows: [
    '.FFF..FFF.',
    'FFFFGFFFF',
    'FFFFGGFFFF',
    '.FFFGFFF.',
    '..FFWWFF..',
    '..FFWFF..',
    '....FF....',
  ] },
  { name: 'Waterfall', push: 8, rows: [
    'GGGWWWWGGG',
    'GGWWEWWGG',
    'GG.WEEW.GG',
    'G.WWEWW.G',
    'G..WWWW..G',
    '...WFFW..',
    '....WW....',
  ] },
  { name: 'Zigzag', push: 8, rows: [
    'WWWWWFFFFF',
    'GGGGFFFFF',
    'GGGGGEEEEE',
    'PPPPEEEEE',
    'PPPPPWWWWW',
    'GGGGWWWWW',
  ] },
  { name: 'Mind Eye', push: 8, rows: [
    'PPPPPPPPPP',
    'PPEEEEEPP',
    'PEEWWWWEEP',
    'PEWWPPWWE',
    'PEEWWWWEEP',
    '.PEEEEEP.',
    '..PPPPPP..',
  ] },
  { name: 'Pillars', push: 8, rows: [
    'FFGGWWEEPP',
    'F.G.W.E.P',
    'FF.GW.EP.P',
    'F.G.W.E.P',
    'FF.GW.EP.P',
    'F.G.W.E.P',
  ] },
  { name: 'Treetop', push: 7, rows: [
    'GGGGGGGGGG',
    'GGEGGGEGG',
    'GGEEGGEEGG',
    'GGGFFFGGG',
    '..GGFFGG..',
    '....F....',
    '....FF....',
    '....P....',
  ] },
  { name: 'Lightning', push: 7, rows: [
    'PPPPPPPPPP',
    'P..P..P.P',
    'WWWEEWWWWW',
    'WWEEWWWWW',
    'WWWEEEEWWW',
    '....EE...',
    '....E.....',
    '...EE....',
  ] },
  { name: 'Hanging Garden', push: 7, rows: [
    'PPPPPPPPPP',
    'P..P..P.P',
    'GG.FF.WW.E',
    'GG.FF.WW.',
    'GGG.FFWWEE',
    'GG.FF.WWE',
    '.G..F..W.E',
  ] },
  { name: 'Fairy Ring', push: 7, rows: [
    'YYYYYYYYYY',
    'YWWWWWWWY',
    'YWFFFFFFWY',
    'YWFGGGGFW',
    'YWFGEEGFWY',
    '.YWFGGFWY',
    '..YWFFWY..',
  ] },
  { name: 'Rainbow', push: 7, rows: [
    'FFFFFFFFFF',
    'EEEEEEEEE',
    'GGGGGGGGGG',
    'WWWWWWWWW',
    'PPPPPPPPPP',
    'YYYYYYYYY',
  ] },
  { name: 'Scatter', push: 7, rows: [
    'WWFFGGEEPP',
    'YWWFGGEPP',
    'YYFFWWGGEE',
    'PYYFWWGEE',
    'PPYYFFWWGG',
    '.PPYFFWG.',
  ] },
  { name: 'Starfall', push: 6, rows: [
    'YYYYPPYYYY',
    '.YYPPPYY.',
    '..YPEEPY..',
    '...PEP...',
    '..WWEEWW..',
    '.WWFFFWW.',
    'WW.FGGF.WW',
  ] },
  { name: 'Final Wave', push: 6, rows: [
    'WWWWWWWWWW',
    'WFWGWEWPW',
    'WFFGGEEPPW',
    'WYFGEEPYW',
    'WYYFGGPYYW',
    '.WYFFPPY.',
    '..WYYYYW..',
    '...WWWW..',
  ] },
];

/** A board's cells for its lap past the first: the same layout, each colour moved along by the lap so it looks new. */
export function boardCells(level) {
  const board = BOARDS[(level - 1) % BOARDS.length], lap = Math.floor((level - 1) / BOARDS.length);
  const used = [...new Set(board.rows.join('').replace(/\./g, ''))].map(ch => LETTERS.indexOf(ch)).sort();
  const turn = (v) => used[(used.indexOf(v) + lap) % used.length];
  const cells = board.rows.map(row => [...row].map(ch => (ch === '.' ? null : turn(LETTERS.indexOf(ch)))));
  return { name: board.name, cells, push: Math.max(MIN_PUSH, board.push - lap * LAP_FASTER), lap };
}

/** The cells of `cells` reached from the top row, by the shooter's hex grid (odd rows set in half a bubble). */
export function hanging(cells) {
  const width = (r) => (r % 2 ? 9 : 10), full = (r, c) => cells[r]?.[c] !== null && cells[r]?.[c] !== undefined;
  const seen = new Set(), list = [];
  (cells[0] || []).forEach((v, c) => { if (full(0, c)) { seen.add(`0,${c}`); list.push([0, c]); } });
  for (let i = 0; i < list.length; i++) {
    const [r, c] = list[i], d = r % 2 ? [0, 1] : [-1, 0], near = [[r, c - 1], [r, c + 1]];
    for (const rr of [r - 1, r + 1]) for (const dc of d) near.push([rr, c + dc]);
    for (const [a, b] of near) {
      if (a < 0 || b < 0 || b >= width(a) || !full(a, b) || seen.has(`${a},${b}`)) continue;
      seen.add(`${a},${b}`); list.push([a, b]);
    }
  }
  return seen;
}

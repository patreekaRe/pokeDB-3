/* base-furniture-kinds.js  -  the catalogue's kinds past its first 25 (js/base-furniture.js), ~200 more, so the Shop
   has hundreds of kinds to turn up. Most come in groups built from one painter and a list: chairs by their back,
   rugs and mats by their pattern or motif (MOTIFS, 9x9 pixel stamps shared with the posters, banners and cushions),
   plants by species, Berry bushes by their berry, Pokémon dolls by a bitmap (outlined in code). A family with `solo`
   is one piece only, never themed (the dolls keep their Pokémon's colours). `group` is the tray / tool page's shelf.
   `moreKinds()` is handed the painting helpers, so every painter here draws on the same context and theme palette. */

export function moreKinds({ R, C, box, tone, BOOKS, SKY, pal, timeOfDay }) {
  const k = new Proxy({}, { get: (_, key) => pal()[key] });
  const out = [];
  const add = (group, list) => list.forEach(f => out.push({ group, ...f }));

  /* ---------- helpers ---------- */
  const bits = (rows, x, y, ink, s = 1) => rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const c = ink[ch];
    if (c) R(x + i * s, y + j * s, s, s, c);
  }));
  const disc = (cx, cy, r, c) => { for (let j = -r; j <= r; j++) { const h = Math.floor(Math.sqrt(r * r - j * j) + 0.35); R(cx - h, cy + j, h * 2 + 1, 1, c); } };
  const oval = (cx, cy, rx, ry, c) => { for (let j = -ry; j <= ry; j++) { const h = Math.floor(rx * Math.sqrt(1 - (j * j) / (ry * ry)) + 0.35); R(cx - h, cy + j, h * 2 + 1, 1, c); } };
  const tri = (cx, top, h, c, slope = 1) => { for (let j = 0; j < h; j++) { const half = Math.floor(j * slope); R(cx - half, top + j, half * 2 + 1, 1, c); } };
  const sideBox = (x, b, vw, h) => { box(x + 1, b - h, vw - 2, h, k.w, k.wd); R(x + 2, b - h + 1, vw - 4, 1, k.wl); };
  const legs = (x, b, vw, h, c = k.wd) => { R(x + 2, b - h, 2, h, c); R(x + vw - 4, b - h, 2, h, c); };

  /* ---------- motifs: 9x9 stamps. # main, + light, k dark, o white ---------- */
  const MOTIFS = {
    ball: ['..kkkkk..', '.k##+##k.', 'k#+#####k', 'k###k###k', 'kkkkokkkk', 'koookoook', 'koooooook', '.koooook.', '..kkkkk..'],
    star: ['....#....', '...###...', '...#+#...', '#########', '.##+++##.', '..#####..', '..##.##..', '.##...##.', '##.....##'],
    heart: ['.##...##.', '#+##.####', '#+#######', '#########', '.#######.', '..#####..', '...###...', '....#....'],
    bolt: ['....####.', '...####..', '..####...', '.#######.', '....###..', '...###...', '..##.....', '.#.......'],
    flame: ['....#....', '...##....', '...###.#.', '..#####..', '.###+###.', '.##+++##.', '.##+o+##.', '..#+++#..', '...###...'],
    drop: ['....#....', '...###...', '...###...', '..#####..', '.#o#####.', '.#o#####.', '.##+####.', '..#####..', '...###...'],
    sprout: ['......##.', '....####.', '..#####+.', '.####+##.', '.##+####.', '.#+####..', '.+####...', '+.##.....'],
    moon: ['...###...', '.###.....', '.##......', '##.......', '##.......', '##.......', '.##......', '.###.....', '...###...'],
    sun: ['#...#...#', '.#..#..#.', '...###...', '..#+++#..', '###+o+###', '..#+++#..', '...###...', '.#..#..#.', '#...#...#'],
    flower: ['..##.##..', '.###.###.', '.##+++##.', '...+o+...', '.##+++##.', '.###.###.', '..##.##..'],
    diamond: ['....#....', '...###...', '..##+##..', '.##+++##.', '###+++###', '.##+++##.', '..##+##..', '...###...', '....#....'],
    note: ['...######', '...######', '...#....#', '...#....#', '...#....#', '.###..###', '####.####', '.##...##.'],
    paw: ['.##...##.', '.##...##.', '.........', '##.###.##', '##.###.##', '..#####..', '.#######.', '..#####..'],
  };
  const MOTIF_NAME = { ball: 'Poké Ball', star: 'Star', heart: 'Heart', bolt: 'Thunder', flame: 'Flame', drop: 'Water', sprout: 'Sprout',
    moon: 'Moon', sun: 'Sun', flower: 'Flower', diamond: 'Diamond', note: 'Melody', paw: 'Paw' };
  const motif = (id, x, y, ink, s = 1) => {
    const rows = MOTIFS[id];
    bits(rows, x + Math.floor((9 - rows[0].length) * s / 2), y + Math.floor((9 - rows.length) * s / 2), ink, s);
  };
  const MOTIF_IDS = Object.keys(MOTIFS);

  /* ---------- chairs and stools ---------- */
  const BACKS = {
    ladder: { name: 'Ladder chair', front(x, y) { R(x + 3, y - 8, 2, 12, k.wd); R(x + 11, y - 8, 2, 12, k.wd); for (let r = 0; r < 3; r++) R(x + 5, y - 7 + r * 4, 6, 2, k.w); } },
    spindle: { name: 'Spindle chair', front(x, y) { box(x + 3, y - 9, 10, 3, k.w, k.wd); for (let i = 0; i < 4; i++) R(x + 4 + i * 2 + (i > 1 ? 1 : 0), y - 6, 1, 10, k.wd); R(x + 3, y - 9, 1, 13, k.wd); R(x + 12, y - 9, 1, 13, k.wd); } },
    round: { name: 'Round chair', front(x, y) { disc(x + 8, y - 3, 6, k.cd); disc(x + 8, y - 3, 5, k.c); R(x + 5, y - 7, 4, 2, k.cl); } },
    heart: { name: 'Heart chair', front(x, y) { bits(MOTIFS.heart, x + 3, y - 8, { '#': k.c, '+': k.cl }); R(x + 7, y, 2, 4, k.wd); } },
    throne: { name: 'Throne', front(x, y) { box(x + 2, y - 20, 12, 24, k.a, k.ad); R(x + 4, y - 17, 8, 20, k.c); R(x + 5, y - 16, 2, 6, k.cl); for (let i = 0; i < 3; i++) R(x + 3 + i * 4, y - 23, 2, 3, k.a); R(x + 7, y - 14, 2, 2, k.p); } },
    ball: { name: 'Poké Ball chair', proper: true, front(x, y) { disc(x + 8, y - 3, 6, '#303038'); disc(x + 8, y - 3, 5, k.p); for (let j = -5; j < 0; j++) { const h = Math.floor(Math.sqrt(25 - j * j) + 0.35); R(x + 8 - h, y - 3 + j, h * 2 + 1, 1, k.c); } R(x + 2, y - 3, 12, 1, '#303038'); box(x + 6, y - 5, 4, 4, k.p, '#303038'); } },
    slat: { name: 'Slat chair', front(x, y) { R(x + 3, y - 9, 2, 13, k.wd); R(x + 11, y - 9, 2, 13, k.wd); for (let i = 0; i < 3; i++) R(x + 6 + i * 2, y - 8, 1, 12, k.w); R(x + 3, y - 9, 10, 2, k.w); } },
    folding: { name: 'Folding chair', front(x, y) { box(x + 3, y - 8, 10, 6, k.c, k.cd); R(x + 3, y - 2, 1, 6, k.m); R(x + 12, y - 2, 1, 6, k.m); } },
  };
  add('Seats', Object.entries(BACKS).map(([id, s]) => ({ id: `${id}chair`, name: s.name, proper: s.proper, w: 1, h: 1, price: id === 'throne' ? 900 : 200,
    draw(x, b, vw, dir) {
      const y = b - 16;
      if (dir % 2) { const px = dir === 1 ? x + 11 : x + 2; box(px, y - 8, 3, 14, k.w, k.wd); }
      if (dir === 0) s.front(x, y);
      R(x + 3, y + 12, 2, 4, k.wd); R(x + 11, y + 12, 2, 4, k.wd);
      box(x + 2, y + 4, 12, 9, k.wl, k.wd); R(x + 3, y + 5, 10, 2, k.c);
      if (dir === 2) s.front(x, y);
    } })));
  add('Seats', [
    { id: 'barstool', name: 'Bar stool', w: 1, h: 1, price: 160, draw(x, b) {
      R(x + 7, b - 20, 2, 18, k.m); box(x + 4, b - 2, 8, 2, k.m, k.md); R(x + 5, b - 9, 6, 1, k.md);
      box(x + 2, b - 24, 12, 5, k.c, k.cd); R(x + 3, b - 23, 10, 1, k.cl);
    } },
    { id: 'stump', name: 'Log stump', w: 1, h: 1, price: 100, draw(x, b) {
      box(x + 2, b - 12, 12, 12, k.wd, tone(k.wd, 0.6)); for (let i = 0; i < 3; i++) R(x + 4 + i * 3, b - 10, 1, 9, tone(k.wd, 0.7));
      oval(x + 8, b - 13, 6, 2, k.wl); oval(x + 8, b - 13, 3, 1, k.w); R(x + 8, b - 13, 1, 1, k.wd);
    } },
    { id: 'mushstool', name: 'Mushroom stool', w: 1, h: 1, price: 180, draw(x, b) {
      box(x + 5, b - 8, 6, 8, k.p, k.pd);
      oval(x + 8, b - 12, 7, 4, k.cd); oval(x + 8, b - 12, 6, 3, k.c);
      R(x + 4, b - 14, 2, 2, k.p); R(x + 9, b - 15, 2, 2, k.p); R(x + 11, b - 12, 2, 1, k.p);
    } },
    { id: 'beanbag', name: 'Beanbag', w: 1, h: 1, price: 260, draw(x, b) {
      oval(x + 8, b - 6, 7, 6, k.cd); oval(x + 8, b - 7, 6, 5, k.c); oval(x + 7, b - 9, 3, 2, k.cl); R(x + 8, b - 5, 4, 1, k.cd);
    } },
    { id: 'pouf', name: 'Pouf', w: 1, h: 1, price: 170, draw(x, b) {
      box(x + 2, b - 10, 12, 10, k.c, k.cd); oval(x + 8, b - 10, 6, 2, k.cl);
      for (let i = 0; i < 5; i++) R(x + 3 + i * 2 + 1, b - 6, 1, 1, k.a); R(x + 3, b - 3, 10, 1, k.cd);
    } },
    { id: 'bench', name: 'Bench', w: 2, h: 1, price: 380, draw(x, b, vw, dir) {
      if (dir % 2) return sideBox(x, b, vw, 10);
      legs(x, b, vw, 8); R(x + 4, b - 4, vw - 8, 1, k.wd);
      box(x, b - 11, vw, 4, k.w, k.wd); R(x + 1, b - 10, vw - 2, 1, k.wl);
      if (dir === 0) for (let i = 0; i < 3; i++) R(x + 2, b - 20 + i * 3, vw - 4, 2, k.w);
      R(x + 2, b - 21, 2, 11, k.wd); R(x + vw - 4, b - 21, 2, 11, k.wd);
    } },
    { id: 'rocker', name: 'Rocking chair', w: 1, h: 1, price: 420, draw(x, b) {
      R(x + 1, b - 2, 14, 1, k.wd); R(x, b - 3, 2, 1, k.wd); R(x + 14, b - 3, 2, 1, k.wd);
      R(x + 3, b - 8, 2, 6, k.wd); R(x + 11, b - 8, 2, 6, k.wd);
      box(x + 3, b - 26, 10, 16, k.w, k.wd); for (let i = 0; i < 3; i++) R(x + 5 + i * 2, b - 24, 1, 12, k.wd);
      box(x + 2, b - 12, 12, 5, k.wl, k.wd); R(x + 3, b - 11, 10, 2, k.c);
    } },
  ]);

  /* ---------- tables (flat) ---------- */
  add('Tables', [
    { id: 'roundtable', name: 'Round table', w: 2, h: 2, price: 450, high: 0.55, side: 'wd', flat(w, h) {
      disc(w / 2, h / 2, 15, k.wd); disc(w / 2, h / 2, 14, k.w); disc(w / 2, h / 2, 9, k.p); disc(w / 2 - 1, h / 2 - 1, 3, k.c); R(w / 2 - 8, h / 2 - 12, 6, 1, k.wl);
    } },
    { id: 'diningtable', name: 'Dining table', w: 3, h: 2, price: 700, high: 0.55, side: 'wd', flat(w, h) {
      box(0, 1, w, h - 2, k.w, k.wd); R(2, 3, w - 4, 2, k.wl);
      R(4, h / 2 - 3, w - 8, 6, k.c); R(4, h / 2 - 3, w - 8, 1, k.cl);
      for (const px of [9, 24, 39]) { disc(px, 7, 3, k.p); R(px - 1, 6, 2, 2, k.a); disc(px, h - 8, 3, k.p); R(px - 1, h - 9, 2, 2, k.a); }
    } },
    { id: 'coffeetable', name: 'Coffee table', w: 2, h: 1, price: 300, high: 0.35, side: 'wd', flat(w, h) {
      box(0, 1, w, h - 2, k.w, k.wd); R(2, 3, w - 4, 1, k.wl); box(5, 5, 7, 6, k.p, k.pd); R(6, 6, 5, 1, k.c); disc(23, 8, 3, k.c); R(22, 7, 2, 1, k.cl);
    } },
    { id: 'teatable', name: 'Tea table', w: 1, h: 1, price: 220, high: 0.5, side: 'wd', flat() {
      disc(8, 8, 7, k.wd); disc(8, 8, 6, k.w); disc(8, 8, 3, k.p); R(7, 7, 2, 2, k.a); R(11, 6, 1, 3, k.p);
    } },
    { id: 'glasstable', name: 'Glass table', w: 2, h: 2, price: 600, high: 0.5, side: 'md', flat(w, h) {
      box(0, 0, w, h, '#c8e8f4', k.m); R(2, 2, w - 4, 1, '#ffffff'); R(2, 2, 1, 8, '#ffffff');
      R(4, 4, 3, 3, k.md); R(w - 7, 4, 3, 3, k.md); R(4, h - 7, 3, 3, k.md); R(w - 7, h - 7, 3, 3, k.md);
      disc(w / 2, h / 2, 4, k.c); R(w / 2 - 1, h / 2 - 7, 1, 4, k.leaf);
    } },
    { id: 'picnic', name: 'Picnic table', w: 2, h: 2, price: 400, high: 0.5, side: 'wd', flat(w, h) {
      R(0, 0, w, 4, k.w); R(0, h - 4, w, 4, k.w); R(0, 3, w, 1, k.wd); R(0, h - 4, w, 1, k.wd);
      for (let y = 6; y < h - 6; y += 3) for (let x = 0; x < w; x += 3) R(x, y, 3, 3, ((x + y) / 3) % 2 ? k.c : k.p);
      R(0, 5, w, 1, k.cd); R(0, h - 6, w, 1, k.cd);
      disc(10, 13, 2, k.a); R(20, 15, 5, 3, '#d8a050');
    } },
    { id: 'kotatsu', name: 'Kotatsu', w: 2, h: 2, price: 650, high: 0.45, side: 'cd', flat(w, h) {
      R(0, 0, w, h, k.cd); R(1, 1, w - 2, h - 2, k.c);
      for (let i = 2; i < w - 2; i += 4) { R(i, 2, 2, 1, k.cl); R(i, h - 3, 2, 1, k.cl); }
      box(5, 5, w - 10, h - 10, k.w, k.wd); R(6, 6, w - 12, 1, k.wl);
      disc(w / 2 - 3, h / 2, 2, '#f08030'); disc(w / 2 + 3, h / 2 + 1, 2, '#f08030'); R(w / 2 - 3, h / 2 - 2, 1, 1, k.leaf);
    } },
  ]);

  /* ---------- beds (flat; a Pokémon naps on them) ---------- */
  add('Beds', [
    { id: 'singlebed', name: 'Single bed', w: 1, h: 2, price: 450, high: 0.5, side: 'wd', seat: 'bed', flat(w, h) {
      box(0, 0, w, h, k.w, k.wd); R(0, 0, w, 5, k.wd); R(1, 1, w - 2, 2, k.w);
      R(1, 5, w - 2, h - 7, k.p); box(3, 7, w - 6, 5, '#ffffff', k.pd);
      R(1, 14, w - 2, h - 16, k.c); R(1, 14, w - 2, 2, k.cl); for (let y = 19; y < h - 3; y += 5) R(2, y, w - 4, 1, k.cd);
    } },
    { id: 'futon', name: 'Futon', w: 1, h: 2, price: 300, high: 0.15, side: 'pd', seat: 'bed', flat(w, h) {
      box(0, 0, w, h, k.p, k.pd); box(2, 2, w - 4, 5, '#ffffff', k.pd);
      R(1, 10, w - 2, h - 11, k.c); R(1, 10, w - 2, 1, k.cl);
      for (let y = 13; y < h - 2; y += 4) for (let x = 2 + (y % 8 ? 2 : 0); x < w - 2; x += 4) R(x, y, 2, 2, k.a);
    } },
    { id: 'sleepingbag', name: 'Sleeping bag', w: 1, h: 2, price: 200, high: 0.12, side: 'cd', seat: 'bed', flat(w, h) {
      R(2, 0, w - 4, h, k.cd); R(0, 2, w, h - 4, k.cd); R(1, 1, w - 2, h - 2, k.c);
      oval(w / 2, 6, 4, 3, k.cl); R(w - 4, 10, 1, h - 13, k.a); R(2, 11, w - 7, 1, k.cl);
    } },
    { id: 'petbed', name: 'Pet bed', w: 1, h: 1, price: 180, high: 0.2, side: 'cd', seat: 'cushion', flat() {
      disc(8, 8, 7, k.cd); disc(8, 8, 6, k.c); disc(8, 9, 4, k.cl); R(5, 2, 6, 1, k.cl); R(6, 8, 4, 1, k.p); R(5, 7, 2, 3, k.p); R(9, 7, 2, 3, k.p);
    } },
    { id: 'royalbed', name: 'Royal bed', w: 2, h: 3, price: 1400, high: 0.55, side: 'ad', seat: 'bed', flat(w, h) {
      box(0, 0, w, h, k.a, k.ad); R(0, 0, w, 6, k.ad); R(2, 1, w - 4, 3, k.a);
      R(2, 6, w - 4, h - 8, k.p); box(4, 8, 11, 7, '#ffffff', k.pd); box(17, 8, 11, 7, '#ffffff', k.pd);
      R(2, 18, w - 4, h - 20, k.c); R(2, 18, w - 4, 2, k.cl); R(2, 21, w - 4, 1, k.a); R(2, h - 5, w - 4, 1, k.a);
      for (let y = 25; y < h - 6; y += 6) for (let x = 6; x < w - 4; x += 6) R(x, y, 2, 2, k.a);
      for (const [px, py] of [[0, 0], [w - 3, 0], [0, h - 3], [w - 3, h - 3]]) box(px, py, 3, 3, k.ad, tone(k.ad, 0.6));
    } },
  ]);

  /* ---------- cushions and mats with a motif ---------- */
  const ink = (main, light, dark, white) => ({ '#': main, '+': light, k: dark, o: white });
  add('Cushions', MOTIF_IDS.filter(m => m !== 'ball').map(m => ({ id: `${m}cushion`, name: `${MOTIF_NAME[m]} cushion`, w: 1, h: 1, price: 170,
    high: 0.22, side: 'cd', seat: 'cushion', flat() {
      R(2, 0, 12, 16, k.cd); R(0, 2, 16, 12, k.cd); R(1, 1, 14, 14, k.cd); R(2, 1, 12, 14, k.c); R(1, 2, 14, 12, k.c); R(2, 2, 6, 1, k.cl);
      motif(m, 3, 3, ink(k.a, k.p, k.ad, k.p));
    } })));
  add('Rugs', MOTIF_IDS.map(m => ({ id: `${m}mat`, name: `${MOTIF_NAME[m]} mat`, proper: m === 'ball', w: 2, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'cd',
    flat(w, h) {
      R(0, 0, w, h, k.cd); R(1, 1, w - 2, h - 2, k.c);
      R(3, 3, w - 6, 1, k.a); R(3, h - 4, w - 6, 1, k.a); R(3, 3, 1, h - 6, k.a); R(w - 4, 3, 1, h - 6, k.a);
      for (let x = 1; x < w; x += 3) { R(x, 0, 1, 1, k.p); R(x, h - 1, 1, 1, k.p); }
      motif(m, 7, 7, ink(k.a, k.p, k.ad, k.p), 2);
    } })));

  /* ---------- patterned rugs and runners ---------- */
  const PATTERNS = {
    stripe: { name: 'Striped', at: (i) => (i >> 2) % 2 },
    check: { name: 'Checked', at: (i, j) => ((i >> 2) + (j >> 2)) % 2 },
    polka: { name: 'Polka-dot', at: (i, j) => (i % 6 > 1 && i % 6 < 4 && j % 6 > 1 && j % 6 < 4 ? 2 : 0) },
    zigzag: { name: 'Zigzag', at: (i, j) => ((j + Math.abs((i % 8) - 4)) >> 2) % 2 },
    plaid: { name: 'Plaid', at: (i, j) => (i % 8 < 2 && j % 8 < 2 ? 3 : i % 8 < 2 || j % 8 < 2 ? 1 : 0) },
    wave: { name: 'Wave', at: (i, j) => ((j + Math.round(2 * Math.sin(i / 2.5)) + 8) >> 2) % 2 },
    argyle: { name: 'Diamond', at: (i, j) => (Math.abs((i % 8) - 4) + Math.abs((j % 8) - 4) < 3 ? 2 : 0) },
    rings: { name: 'Ring', at: (i, j, w, h) => (Math.floor(Math.hypot((i - w / 2) * 0.8, j - h / 2)) >> 2) % 2 },
  };
  const weave = (w, h, at, round) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const edge = round ? (i < 2 || i >= w - 2) && (j < 2 || j >= h - 2) : false;
      if (edge) continue;
      const v = at(i, j, w, h);
      R(i, j, 1, 1, [k.c, k.cl, k.a, k.cd][v]);
    }
    R(round ? 2 : 0, 0, round ? w - 4 : w, 1, k.cd); R(round ? 2 : 0, h - 1, round ? w - 4 : w, 1, k.cd);
    R(0, round ? 2 : 0, 1, round ? h - 4 : h, k.cd); R(w - 1, round ? 2 : 0, 1, round ? h - 4 : h, k.cd);
  };
  add('Rugs', Object.entries(PATTERNS).map(([id, p]) => ({ id: `${id}rug`, name: `${p.name} rug`, w: 3, h: 2, layer: 'rug', price: 380, high: 0.04, side: 'cd',
    flat(w, h) { weave(w, h, p.at, true); } })));
  add('Rugs', ['stripe', 'check', 'zigzag', 'wave'].map(id => ({ id: `${id}runner`, name: `${PATTERNS[id].name} runner`, w: 3, h: 1, layer: 'rug', price: 220, high: 0.04, side: 'cd',
    flat(w, h) { weave(w, h, PATTERNS[id].at, false); for (let y = 1; y < h; y += 3) { R(0, y, 1, 1, k.p); R(w - 1, y, 1, 1, k.p); } } })));

  /* ---------- wall: posters, banners, pictures ---------- */
  add('Wall', MOTIF_IDS.map(m => ({ id: `${m}poster`, name: `${MOTIF_NAME[m]} poster`, proper: m === 'ball', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    box(x + 2, 9, 12, 20, k.p, k.md); R(x + 3, 10, 10, 11, k.cl);
    motif(m, x + 4, 11, ink(k.c, k.p, k.cd, '#ffffff'));
    R(x + 4, 23, 8, 1, k.md); R(x + 4, 25, 5, 1, k.md);
  } })));
  add('Wall', MOTIF_IDS.map(m => ({ id: `${m}banner`, name: `${MOTIF_NAME[m]} banner`, proper: m === 'ball', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
    R(x + 1, 7, 14, 2, k.wd); R(x, 7, 1, 2, k.a); R(x + 15, 7, 1, 2, k.a);
    for (let j = 0; j < 28; j++) {
      const half = j < 20 ? 6 : Math.max(0, 6 - (j - 19));
      R(x + 8 - half - 1, 9 + j, half * 2 + 2, 1, k.cd);
      if (half > 0) R(x + 8 - half, 9 + j, half * 2, 1, j % 9 === 0 ? k.cl : k.c);
    }
    motif(m, x + 4, 12, ink(k.a, k.p, k.ad, k.p));
  } })));

  const SCENES = {
    mountain: { name: 'Mountain picture', paint(x, y, w, h) {
      R(x, y, w, h, '#8cc8f4'); tri(x + 8, y + 5, 14, '#7a8494'); tri(x + 18, y + 3, 16, '#8a94a4'); tri(x + 18, y + 3, 4, '#ffffff'); tri(x + 8, y + 5, 3, '#ffffff');
      R(x, y + h - 5, w, 5, '#5aa048'); R(x, y + h - 5, w, 1, '#78c060');
    } },
    sea: { name: 'Seaside picture', paint(x, y, w, h) {
      R(x, y, w, h, '#a8d8f8'); disc(x + w - 6, y + 5, 3, '#f8e070'); R(x, y + 12, w, h - 12, '#3a7ac8');
      for (let j = y + 14; j < y + h - 4; j += 3) for (let i = (j % 2) * 3; i < w; i += 6) R(x + i, j, 3, 1, '#8ac8f0');
      R(x, y + h - 4, w, 4, '#f0dca0');
    } },
    forest: { name: 'Forest picture', paint(x, y, w, h) {
      R(x, y, w, h, '#b8e0f0'); R(x, y + h - 4, w, 4, '#4a8a3a');
      for (const [cx, t] of [[4, 6], [10, 3], [16, 7], [22, 4]]) { tri(x + cx, y + t, h - t - 5, '#2f6a32', 0.45); R(x + cx, y + h - 5, 1, 2, '#6a4426'); }
    } },
    night: { name: 'Night sky picture', paint(x, y, w, h) {
      R(x, y, w, h, '#1a2448'); disc(x + 19, y + 7, 4, '#f4f0c8'); disc(x + 21, y + 6, 3, '#1a2448');
      for (const [i, j] of [[3, 4], [8, 9], [13, 3], [5, 14], [24, 15], [11, 17], [17, 13]]) R(x + i, y + j, 1, 1, '#ffffff');
      R(x, y + h - 4, w, 4, '#0e1428');
    } },
    volcano: { name: 'Volcano picture', paint(x, y, w, h) {
      R(x, y, w, h, '#f0a060'); R(x, y, w, 6, '#e07048'); tri(x + 13, y + 7, h - 7, '#5a3a3a', 0.9); R(x + 11, y + 7, 5, 2, '#f84830');
      R(x + 12, y + 9, 2, 6, '#f88030'); R(x + 10, y + 3, 7, 3, '#8a7a7a');
    } },
    desert: { name: 'Desert picture', paint(x, y, w, h) {
      R(x, y, w, h, '#f8e8b8'); disc(x + 5, y + 5, 3, '#f8c040'); oval(x + 7, y + h, 12, 8, '#e8c070'); oval(x + 21, y + h + 1, 10, 7, '#d8a858');
      R(x + 19, y + 8, 2, 9, '#4f9a42'); R(x + 16, y + 10, 2, 4, '#4f9a42'); R(x + 16, y + 13, 3, 1, '#4f9a42'); R(x + 22, y + 9, 2, 3, '#4f9a42');
    } },
    city: { name: 'City picture', paint(x, y, w, h) {
      R(x, y, w, h, '#3a3a6a'); R(x, y + h - 10, w, 10, '#2a2a4a');
      for (const [i, t, bw] of [[1, 9, 5], [7, 4, 6], [14, 11, 4], [19, 6, 6]]) {
        R(x + i, y + t, bw, h - t, '#1a1a30');
        for (let j = t + 2; j < h - 2; j += 3) for (let c = 1; c < bw - 1; c += 2) if ((i + j + c) % 3) R(x + i + c, y + j, 1, 1, '#f8d870');
      }
    } },
    sunset: { name: 'Sunset picture', paint(x, y, w, h) {
      ['#f8b060', '#f89058', '#e87060', '#c8586a'].forEach((c, i) => R(x, y + i * 3, w, 3, c));
      disc(x + w / 2, y + 13, 5, '#f8e070'); R(x, y + 13, w, h - 13, '#3a3060');
      for (let j = y + 15; j < y + h; j += 2) R(x + w / 2 - (j - y - 12), j, (j - y - 12) * 2, 1, '#e8a860');
    } },
  };
  add('Wall', Object.entries(SCENES).map(([id, s]) => ({ id: `${id}pic`, name: s.name, w: 2, h: 1, layer: 'wall', price: 380, wall(x) {
    box(x + 2, 8, 28, 26, k.w, k.wd); R(x + 3, 9, 26, 1, k.wl); s.paint(x + 4, 10, 24, 22);
  } })));

  /* ---------- wall: clocks, windows and the rest ---------- */
  const skyNow = () => SKY[timeOfDay()];
  add('Wall', [
    { id: 'cuckoo', name: 'Cuckoo clock', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
      tri(x + 8, 6, 6, k.wd); box(x + 3, 11, 10, 12, k.w, k.wd); disc(x + 8, 17, 3, k.p); R(x + 8, 15, 1, 3, k.md); R(x + 8, 17, 2, 1, k.md);
      R(x + 7, 12, 2, 1, k.a); R(x + 6, 23, 1, 8, k.md); R(x + 10, 23, 1, 6, k.md); box(x + 5, 31, 3, 4, k.a, k.ad); box(x + 9, 29, 3, 4, k.a, k.ad);
    } },
    { id: 'wallshelf', name: 'Wall shelf', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
      R(x + 1, 24, 30, 3, k.w); R(x + 1, 27, 30, 1, k.wd); R(x + 4, 28, 2, 3, k.wd); R(x + 26, 28, 2, 3, k.wd);
      for (let i = 0; i < 5; i++) R(x + 3 + i * 3, 15 + (i % 2), 2, 9 - (i % 2), BOOKS[i]);
      box(x + 20, 18, 5, 6, k.pot, k.potD); R(x + 20, 14, 2, 4, k.leaf); R(x + 23, 13, 2, 5, k.leaf); disc(x + 28, 21, 2, k.a);
    } },
    { id: 'mirror', name: 'Mirror', w: 1, h: 1, layer: 'wall', price: 280, wall(x) {
      oval(x + 8, 20, 6, 11, k.wd); oval(x + 8, 20, 5, 10, k.w); oval(x + 8, 20, 4, 9, '#c8e4f0'); R(x + 6, 14, 1, 6, '#ffffff'); R(x + 7, 12, 1, 3, '#ffffff');
    } },
    { id: 'wreath', name: 'Wreath', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
      disc(x + 8, 19, 7, k.leafD); disc(x + 8, 19, 6, k.leaf); C(x + 6, 17, 5, 5); C(x + 7, 16, 3, 7); C(x + 5, 18, 7, 3);
      for (const [i, j] of [[3, 15], [12, 16], [5, 23], [11, 23], [8, 13]]) R(x + i, j, 2, 2, k.c);
      R(x + 5, 25, 6, 3, k.a); R(x + 7, 28, 1, 3, k.a); R(x + 9, 28, 1, 3, k.a);
    } },
    { id: 'sconce', name: 'Wall lamp', w: 1, h: 1, layer: 'wall', price: 260, glow: ['g', 'gl'], wall(x) {
      box(x + 6, 22, 4, 8, k.m, k.md); R(x + 7, 18, 2, 4, k.md); R(x + 4, 9, 8, 1, k.ad); R(x + 3, 10, 10, 8, k.ad); R(x + 4, 10, 8, 7, k.g); R(x + 5, 11, 6, 2, k.gl);
    } },
    { id: 'dartboard', name: 'Dartboard', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
      disc(x + 8, 19, 7, '#202028'); disc(x + 8, 19, 6, k.c); disc(x + 8, 19, 4, k.p); disc(x + 8, 19, 2, k.c); R(x + 8, 19, 1, 1, k.a);
      R(x + 10, 15, 4, 1, k.m); R(x + 13, 14, 1, 3, k.a);
    } },
    { id: 'calendar', name: 'Calendar', w: 1, h: 1, layer: 'wall', price: 100, wall(x) {
      R(x + 7, 8, 2, 2, k.md); box(x + 3, 10, 10, 18, k.p, k.pd); R(x + 4, 11, 8, 4, k.c);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) R(x + 4 + i * 2, 17 + j * 2, 1, 1, (i + j * 4) === 9 ? k.c : k.md);
    } },
    { id: 'worldmap', name: 'Region map', w: 2, h: 1, layer: 'wall', price: 340, wall(x) {
      box(x + 2, 10, 28, 20, '#f0e4c0', k.wd); R(x + 3, 11, 26, 18, '#8cc8f0');
      oval(x + 10, 19, 6, 5, '#7ab860'); oval(x + 21, 17, 5, 4, '#7ab860'); oval(x + 22, 24, 3, 2, '#c8b070'); R(x + 9, 17, 2, 2, '#c84848');
      for (let i = 0; i < 6; i++) R(x + 11 + i * 2, 20 - (i % 2), 1, 1, '#a04030');
    } },
    { id: 'mask', name: 'Wooden mask', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
      oval(x + 8, 19, 5, 9, k.wd); oval(x + 8, 19, 4, 8, k.w); R(x + 5, 15, 3, 2, '#202028'); R(x + 9, 15, 3, 2, '#202028'); R(x + 6, 22, 5, 2, k.c);
      R(x + 7, 18, 2, 3, k.wl); R(x + 3, 12, 2, 2, k.a); R(x + 11, 12, 2, 2, k.a); R(x + 7, 9, 2, 2, k.a);
    } },
    { id: 'corkboard', name: 'Notice board', w: 2, h: 1, layer: 'wall', price: 240, wall(x) {
      box(x + 2, 9, 28, 22, '#c8925a', k.wd);
      for (const [i, j, c] of [[4, 11, k.p], [12, 13, '#f8e078'], [21, 11, k.cl], [6, 20, '#a8d8f0'], [17, 21, k.p]]) { R(x + i, j, 7, 7, c); R(x + i + 3, j, 1, 1, k.c); R(x + i + 1, j + 3, 4, 1, k.md); }
    } },
    { id: 'hangplant', name: 'Hanging plant', w: 1, h: 1, layer: 'wall', price: 210, wall(x) {
      R(x + 7, 4, 2, 2, k.md); R(x + 5, 6, 1, 8, k.md); R(x + 10, 6, 1, 8, k.md); box(x + 3, 14, 10, 6, k.pot, k.potD);
      for (const [i, j, l] of [[2, 12, 10], [5, 13, 14], [10, 13, 12], [13, 12, 9]]) { R(x + i, j + 6, 2, l, k.leaf); R(x + i, j + 6 + l - 2, 2, 2, k.leafL); }
      disc(x + 8, 13, 4, k.leaf); R(x + 6, 11, 2, 1, k.leafL);
    } },
    { id: 'curtains', name: 'Curtained window', w: 2, h: 1, layer: 'wall', price: 600, sky: true, wall(x) {
      box(x + 4, 9, 24, 26, skyNow(), k.wd); R(x + 5, 27, 22, 7, timeOfDay() === 'night' ? '#1a2a4a' : '#6cbf58'); R(x + 15, 10, 2, 24, k.w);
      R(x + 1, 6, 30, 3, k.wd);
      for (const sx of [2, 23]) { R(x + sx, 8, 7, 28, k.c); for (let i = 1; i < 7; i += 2) R(x + sx + i, 9, 1, 26, k.cd); R(x + sx, 25, 7, 2, k.a); }
    } },
    { id: 'roundwindow', name: 'Round window', w: 1, h: 1, layer: 'wall', price: 380, sky: true, wall(x) {
      disc(x + 8, 18, 7, k.wd); disc(x + 8, 18, 6, skyNow()); R(x + 2, 21, 13, 3, timeOfDay() === 'night' ? '#1a2a4a' : '#6cbf58');
      R(x + 8, 12, 1, 13, k.w); R(x + 2, 18, 13, 1, k.w);
    } },
    { id: 'smallwindow', name: 'Small window', w: 1, h: 1, layer: 'wall', price: 300, sky: true, wall(x) {
      box(x + 2, 9, 12, 22, skyNow(), k.wd); R(x + 3, 24, 10, 6, timeOfDay() === 'night' ? '#1a2a4a' : '#6cbf58'); R(x + 7, 10, 2, 20, k.w); R(x + 3, 19, 10, 2, k.w); R(x + 1, 30, 14, 3, k.wl);
    } },
    { id: 'archwindow', name: 'Arched window', w: 2, h: 1, layer: 'wall', price: 700, sky: true, wall(x) {
      disc(x + 16, 16, 11, k.wd); R(x + 5, 16, 23, 20, k.wd); disc(x + 16, 16, 10, skyNow()); R(x + 6, 16, 21, 19, skyNow());
      R(x + 6, 28, 21, 7, timeOfDay() === 'night' ? '#1a2a4a' : '#6cbf58');
      R(x + 15, 6, 2, 29, k.w); R(x + 6, 20, 21, 2, k.w); R(x + 3, 35, 27, 3, k.wl);
    } },
  ]);

  /* ---------- plants ---------- */
  const pot = (x, b, shape = 'round') => {
    if (shape === 'square') { box(x + 4, b - 7, 8, 7, k.pot, k.potD); R(x + 4, b - 7, 8, 1, k.potL); return b - 7; }
    if (shape === 'tray') { box(x + 2, b - 4, 12, 4, k.pot, k.potD); R(x + 3, b - 4, 10, 1, k.potL); return b - 4; }
    if (shape === 'basket') { box(x + 3, b - 8, 10, 8, k.w, k.wd); for (let i = 0; i < 4; i++) R(x + 4 + i * 2, b - 7, 1, 6, k.wl); R(x + 3, b - 8, 10, 1, k.wl); return b - 8; }
    box(x + 4, b - 8, 8, 8, k.pot, k.potD); R(x + 3, b - 9, 10, 2, k.potD); R(x + 4, b - 9, 8, 1, k.potL); return b - 9;
  };
  const leafBlob = (cx, cy, r) => { disc(cx, cy, r, k.leafD); disc(cx, cy, r - 1, k.leaf); R(cx - r + 2, cy - r + 2, 2, 1, k.leafL); };
  add('Plants', [
    { id: 'fern', name: 'Fern', w: 1, h: 1, price: 180, draw(x, b) {
      const t = pot(x, b);
      for (const [dx, h] of [[-5, 8], [-3, 12], [0, 14], [3, 12], [5, 8]]) for (let j = 0; j < h; j++) {
        const px = x + 8 + Math.round(dx * j / h);
        R(px, t - j, 1, 1, k.leafD); if (j % 2) { R(px - 1, t - j, 1, 1, k.leaf); R(px + 1, t - j, 1, 1, k.leaf); }
      }
    } },
    { id: 'cactus', name: 'Cactus', w: 1, h: 1, price: 150, draw(x, b) {
      const t = pot(x, b, 'square');
      box(x + 6, t - 14, 5, 14, k.leaf, k.leafD); R(x + 7, t - 13, 1, 12, k.leafL);
      box(x + 2, t - 10, 3, 5, k.leaf, k.leafD); R(x + 4, t - 7, 2, 2, k.leaf); box(x + 12, t - 12, 3, 5, k.leaf, k.leafD); R(x + 11, t - 9, 2, 2, k.leaf);
      R(x + 7, t - 16, 3, 2, k.c);
    } },
    { id: 'tulips', name: 'Tulips', w: 1, h: 1, price: 170, draw(x, b) {
      const t = pot(x, b);
      for (const [dx, h] of [[4, 10], [8, 13], [12, 9]]) { R(x + dx, t - h, 1, h, k.leafD); box(x + dx - 2, t - h - 4, 5, 5, k.c, k.cd); R(x + dx - 1, t - h - 5, 1, 1, k.c); R(x + dx + 1, t - h - 5, 1, 1, k.c); }
      R(x + 5, t - 5, 2, 4, k.leaf); R(x + 10, t - 6, 2, 5, k.leaf);
    } },
    { id: 'sunflower', name: 'Sunflower', w: 1, h: 1, price: 200, draw(x, b) {
      const t = pot(x, b);
      R(x + 7, t - 20, 2, 20, k.leafD); R(x + 4, t - 10, 3, 2, k.leaf); R(x + 9, t - 14, 3, 2, k.leaf);
      disc(x + 8, t - 25, 6, '#f8c830'); disc(x + 8, t - 25, 3, '#7a4a20'); R(x + 7, t - 26, 1, 1, '#a86a30');
    } },
    { id: 'rosebush', name: 'Rose bush', w: 1, h: 1, price: 260, draw(x, b) {
      const t = pot(x, b, 'square'); leafBlob(x + 8, t - 7, 7);
      for (const [i, j] of [[4, -10], [10, -12], [8, -5], [12, -6], [5, -4]]) { R(x + i, t + j, 2, 2, k.c); R(x + i, t + j, 1, 1, k.cl); }
    } },
    { id: 'bonsai', name: 'Bonsai', w: 1, h: 1, price: 380, draw(x, b) {
      const t = pot(x, b, 'tray');
      R(x + 7, t - 6, 2, 6, k.wd); R(x + 5, t - 9, 3, 3, k.wd); R(x + 9, t - 10, 2, 4, k.wd);
      leafBlob(x + 4, t - 11, 3); leafBlob(x + 11, t - 13, 4); leafBlob(x + 7, t - 15, 3);
    } },
    { id: 'bamboo', name: 'Bamboo', w: 1, h: 1, price: 240, draw(x, b) {
      const t = pot(x, b, 'square');
      for (const [dx, h] of [[5, 26], [8, 30], [11, 22]]) { R(x + dx, t - h, 2, h, k.leaf); for (let j = 4; j < h; j += 6) R(x + dx, t - j, 2, 1, k.leafD); R(x + dx + 2, t - h + 3, 3, 1, k.leafL); R(x + dx - 3, t - h + 7, 3, 1, k.leafL); }
    } },
    { id: 'succulent', name: 'Succulent', w: 1, h: 1, price: 140, draw(x, b) {
      const t = pot(x, b, 'square');
      for (const [i, j, w2] of [[3, -3, 4], [9, -3, 4], [5, -6, 6], [6, -9, 4], [4, -5, 3], [10, -6, 3]]) box(x + i, t + j, w2, 3, k.leafL, k.leaf);
      R(x + 7, t - 10, 2, 1, k.c);
    } },
    { id: 'mushpot', name: 'Mushroom pot', w: 1, h: 1, price: 160, draw(x, b) {
      const t = pot(x, b);
      R(x + 5, t - 5, 2, 5, '#f4f0e0'); R(x + 10, t - 7, 2, 7, '#f4f0e0');
      oval(x + 6, t - 6, 3, 2, '#d84848'); oval(x + 11, t - 8, 4, 3, '#d84848'); R(x + 10, t - 10, 1, 1, '#ffffff'); R(x + 12, t - 8, 1, 1, '#ffffff'); R(x + 5, t - 7, 1, 1, '#ffffff');
    } },
    { id: 'saguaro', name: 'Tall cactus', w: 1, h: 1, price: 320, draw(x, b) {
      const t = pot(x, b, 'square');
      box(x + 6, t - 30, 5, 30, k.leaf, k.leafD); R(x + 7, t - 29, 1, 28, k.leafL);
      box(x + 1, t - 20, 3, 9, k.leaf, k.leafD); R(x + 3, t - 13, 3, 2, k.leaf); box(x + 13, t - 24, 3, 8, k.leaf, k.leafD); R(x + 11, t - 18, 3, 2, k.leaf);
    } },
    { id: 'pine', name: 'Potted pine', w: 1, h: 1, price: 340, draw(x, b) {
      const t = pot(x, b); R(x + 7, t - 4, 2, 4, k.wd);
      tri(x + 8, t - 14, 11, k.leafD, 0.7); tri(x + 8, t - 22, 10, k.leafD, 0.6); tri(x + 8, t - 29, 9, k.leafD, 0.5);
      tri(x + 8, t - 13, 9, k.leaf, 0.6); tri(x + 8, t - 21, 8, k.leaf, 0.5); tri(x + 8, t - 28, 7, k.leaf, 0.4); R(x + 8, t - 30, 1, 2, k.a);
    } },
  ]);
  const BERRIES = [['oran', 'Oran', '#4a78d8'], ['pecha', 'Pecha', '#f890b8'], ['cheri', 'Cheri', '#e03838'], ['chesto', 'Chesto', '#7a4ab8'],
    ['rawst', 'Rawst', '#58b8a8'], ['aspear', 'Aspear', '#f0d848'], ['leppa', 'Leppa', '#e86a38'], ['sitrus', 'Sitrus', '#f0e070']];
  add('Plants', BERRIES.map(([id, name, c]) => ({ id: `${id}bush`, name: `${name} Berry bush`, proper: true, w: 1, h: 1, price: 280, draw(x, b) {
    const t = pot(x, b, 'basket'); leafBlob(x + 5, t - 7, 5); leafBlob(x + 11, t - 8, 5); leafBlob(x + 8, t - 13, 5);
    for (const [i, j] of [[3, -8], [7, -12], [11, -10], [9, -5], [5, -14], [13, -6]]) { R(x + i, t + j, 2, 2, c); R(x + i, t + j, 1, 1, tone(c, 1.5)); }
  } })));

  /* ---------- things: one painter each ---------- */
  add('Things', [
    { id: 'trophy', name: 'Trophy', w: 1, h: 1, price: 500, draw(x, b) {
      box(x + 3, b - 4, 10, 4, k.w, k.wd); R(x + 7, b - 9, 2, 5, k.ad); R(x + 5, b - 10, 6, 1, k.ad);
      box(x + 3, b - 20, 10, 10, k.a, k.ad); R(x + 4, b - 19, 2, 7, tone(k.a, 1.4));
      R(x + 1, b - 19, 2, 1, k.ad); R(x + 1, b - 19, 1, 5, k.ad); R(x + 1, b - 15, 2, 1, k.ad); R(x + 13, b - 19, 2, 1, k.ad); R(x + 14, b - 19, 1, 5, k.ad); R(x + 13, b - 15, 2, 1, k.ad);
    } },
    { id: 'globe', name: 'Globe', w: 1, h: 1, price: 320, draw(x, b) {
      box(x + 4, b - 3, 8, 3, k.w, k.wd); R(x + 7, b - 6, 2, 3, k.wd);
      disc(x + 8, b - 13, 6, '#2a4a8a'); disc(x + 8, b - 13, 5, '#4a88d8'); R(x + 5, b - 16, 3, 3, '#5ab048'); R(x + 9, b - 13, 3, 4, '#5ab048'); R(x + 6, b - 10, 2, 2, '#5ab048');
      R(x + 1, b - 17, 1, 9, k.m); R(x + 2, b - 19, 2, 1, k.m); R(x + 2, b - 7, 2, 1, k.m);
    } },
    { id: 'fishbowl', name: 'Fishbowl', w: 1, h: 1, price: 260, draw(x, b) {
      R(x + 3, b - 8, 2, 8, k.wd); R(x + 11, b - 8, 2, 8, k.wd); box(x + 2, b - 10, 12, 3, k.w, k.wd);
      disc(x + 8, b - 16, 6, '#d8f0f8'); disc(x + 8, b - 15, 5, '#7ac0e8');
      R(x + 6, b - 16, 4, 3, '#f08030'); R(x + 10, b - 16, 2, 1, '#f08030'); R(x + 10, b - 14, 2, 1, '#f08030'); R(x + 7, b - 15, 1, 1, '#ffffff'); R(x + 5, b - 18, 1, 1, '#ffffff');
    } },
    { id: 'candle', name: 'Candle', w: 1, h: 1, price: 120, glow: ['g', 'gl'], draw(x, b) {
      box(x + 3, b - 3, 10, 3, k.m, k.md); box(x + 6, b - 13, 4, 10, k.p, k.pd); R(x + 7, b - 14, 1, 1, k.md);
      R(x + 7, b - 18, 2, 4, k.g); R(x + 7, b - 17, 1, 2, k.gl);
    } },
    { id: 'snowglobe', name: 'Snow globe', w: 1, h: 1, price: 240, draw(x, b) {
      box(x + 3, b - 4, 10, 4, k.w, k.wd); disc(x + 8, b - 10, 5, '#e8f4fc'); disc(x + 8, b - 10, 4, '#b8dcf0');
      tri(x + 8, b - 13, 5, k.leaf); R(x + 5, b - 8, 7, 2, '#ffffff'); R(x + 5, b - 12, 1, 1, '#ffffff'); R(x + 11, b - 13, 1, 1, '#ffffff');
    } },
    { id: 'lavalamp', name: 'Lava lamp', w: 1, h: 1, price: 280, glow: ['a', 'cl'], draw(x, b) {
      box(x + 4, b - 6, 8, 6, k.m, k.md); tri(x + 8, b - 22, 16, k.c, 0.25); R(x + 6, b - 24, 5, 2, k.m);
      R(x + 7, b - 19, 2, 3, k.a); R(x + 6, b - 13, 3, 3, k.a); R(x + 9, b - 10, 2, 2, k.cl);
    } },
    { id: 'hourglass', name: 'Hourglass', w: 1, h: 1, price: 220, draw(x, b) {
      box(x + 3, b - 2, 10, 2, k.w, k.wd); box(x + 3, b - 20, 10, 2, k.w, k.wd); R(x + 4, b - 18, 1, 16, k.wd); R(x + 11, b - 18, 1, 16, k.wd);
      for (let j = 0; j < 8; j++) { const h = 3 - Math.floor(j / 2.7); R(x + 8 - h, b - 18 + j, h * 2, 1, '#e8f4fc'); R(x + 8 - h, b - 3 - j, h * 2, 1, '#e8f4fc'); }
      R(x + 6, b - 15, 4, 2, k.a); R(x + 7, b - 10, 2, 4, k.a); R(x + 6, b - 5, 4, 2, k.a);
    } },
    { id: 'musicbox', name: 'Music box', w: 1, h: 1, price: 300, draw(x, b) {
      box(x + 2, b - 8, 12, 8, k.w, k.wd); R(x + 3, b - 5, 10, 1, k.a); box(x + 2, b - 16, 12, 6, k.wl, k.wd); R(x + 3, b - 15, 10, 4, k.c);
      R(x + 7, b - 13, 2, 5, k.p); disc(x + 8, b - 14, 1, k.cl); R(x + 13, b - 6, 2, 1, k.a);
    } },
    { id: 'telescope', name: 'Telescope', w: 1, h: 1, price: 450, draw(x, b) {
      R(x + 7, b - 12, 2, 12, k.wd); R(x + 3, b - 3, 2, 3, k.wd); R(x + 11, b - 3, 2, 3, k.wd); R(x + 4, b - 6, 1, 3, k.wd); R(x + 11, b - 6, 1, 3, k.wd);
      for (let i = 0; i < 12; i++) R(x + 2 + i, b - 12 - Math.floor(i * 0.9), 3, 3, i > 8 ? k.a : k.m);
    } },
    { id: 'recordplayer', name: 'Record player', w: 1, h: 1, price: 420, draw(x, b) {
      legs(x, b, 16, 8); box(x + 1, b - 13, 14, 6, k.w, k.wd); oval(x + 7, b - 13, 5, 2, '#202028'); R(x + 7, b - 13, 1, 1, k.c);
      R(x + 13, b - 16, 1, 3, k.m); R(x + 10, b - 16, 3, 1, k.m);
    } },
    { id: 'radio', name: 'Radio', w: 1, h: 1, price: 260, draw(x, b) {
      R(x + 4, b - 22, 1, 10, k.m); box(x + 1, b - 12, 14, 12, k.c, k.cd); R(x + 2, b - 11, 12, 1, k.cl);
      for (let j = 0; j < 3; j++) R(x + 3, b - 9 + j * 2, 6, 1, k.cd); disc(x + 12, b - 7, 2, k.a); R(x + 11, b - 3, 3, 1, k.p);
    } },
    { id: 'computer', name: 'Computer', w: 1, h: 1, price: 900, glow: ['#68c8f8'], draw(x, b) {
      legs(x, b, 16, 10); box(x, b - 13, 16, 3, k.w, k.wd);
      box(x + 2, b - 26, 12, 10, k.m, k.md); R(x + 3, b - 25, 10, 7, '#68c8f8'); R(x + 4, b - 24, 4, 1, '#ffffff'); R(x + 7, b - 16, 2, 3, k.md);
      box(x + 3, b - 15, 9, 2, k.p, k.pd);
    } },
    { id: 'console', name: 'Game console', w: 1, h: 1, price: 600, draw(x, b) {
      box(x + 2, b - 7, 12, 7, k.m, k.md); R(x + 3, b - 6, 10, 1, k.ml); R(x + 4, b - 4, 4, 2, k.c); R(x + 10, b - 4, 2, 1, k.a);
      box(x + 1, b - 13, 6, 4, k.p, k.pd); R(x + 2, b - 12, 2, 1, k.md); R(x + 5, b - 12, 1, 1, k.c); R(x + 4, b - 9, 1, 2, k.md);
    } },
    { id: 'fan', name: 'Fan', w: 1, h: 1, price: 220, draw(x, b) {
      box(x + 4, b - 3, 8, 3, k.m, k.md); R(x + 7, b - 14, 2, 11, k.md);
      disc(x + 8, b - 20, 6, k.ml); disc(x + 8, b - 20, 5, k.p); R(x + 8, b - 25, 1, 10, k.c); R(x + 3, b - 20, 11, 1, k.c); disc(x + 8, b - 20, 1, k.md);
    } },
    { id: 'heater', name: 'Radiator', w: 1, h: 1, price: 240, draw(x, b) {
      R(x + 2, b - 2, 2, 2, k.md); R(x + 12, b - 2, 2, 2, k.md);
      for (let i = 0; i < 5; i++) { box(x + 1 + i * 3, b - 16, 3, 14, k.m, k.md); R(x + 2 + i * 3, b - 15, 1, 12, k.ml); }
      R(x + 13, b - 18, 2, 2, k.a);
    } },
    { id: 'piano', name: 'Piano', w: 2, h: 1, price: 1200, draw(x, b, vw, dir) {
      if (dir % 2) return sideBox(x, b, vw, 26);
      box(x, b - 28, vw, 26, k.w, k.wd); R(x + 1, b - 27, vw - 2, 2, k.wl); R(x + 2, b - 2, 2, 2, k.wd); R(x + vw - 4, b - 2, 2, 2, k.wd);
      if (dir === 2) return;
      R(x + 2, b - 15, vw - 4, 5, '#ffffff'); for (let i = 3; i < vw - 3; i += 2) R(x + i, b - 15, 1, 5, '#c8c8c8');
      for (let i = 4; i < vw - 4; i += 4) if (i % 14 !== 12) R(x + i, b - 15, 2, 3, '#202028');
      R(x + 6, b - 24, vw - 12, 6, k.p); for (let i = 0; i < 4; i++) R(x + 8 + i * 4, b - 23 + (i % 2), 1, 3, '#202028');
    } },
    { id: 'drum', name: 'Drum', w: 1, h: 1, price: 280, draw(x, b) {
      box(x + 2, b - 12, 12, 12, k.c, k.cd); R(x + 2, b - 12, 12, 1, k.a); R(x + 2, b - 1, 12, 1, k.a);
      for (let i = 0; i < 4; i++) R(x + 3 + i * 3, b - 10 + (i % 2) * 4, 1, 4, k.a);
      oval(x + 8, b - 13, 6, 2, k.p); R(x + 3, b - 19, 1, 6, k.wl); R(x + 12, b - 18, 1, 5, k.wl);
    } },
    { id: 'guitar', name: 'Guitar', w: 1, h: 1, price: 380, draw(x, b) {
      R(x + 4, b - 2, 8, 2, k.m); R(x + 5, b - 6, 1, 4, k.m); R(x + 10, b - 6, 1, 4, k.m);
      disc(x + 8, b - 7, 4, k.c); disc(x + 8, b - 13, 3, k.c); R(x + 6, b - 8, 4, 1, k.cl); disc(x + 8, b - 10, 1, '#202028');
      R(x + 7, b - 30, 2, 17, k.wd); box(x + 6, b - 34, 4, 5, k.wd, tone(k.wd, 0.6)); R(x + 8, b - 30, 1, 22, k.pd);
    } },
    { id: 'aquarium', name: 'Aquarium', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
      if (dir % 2) return sideBox(x, b, vw, 24);
      box(x, b - 10, vw, 10, k.w, k.wd); R(x + 1, b - 9, vw - 2, 1, k.wl);
      box(x + 1, b - 26, vw - 2, 16, '#3a7ab8', k.m); R(x + 2, b - 25, vw - 4, 2, '#8ac8f0'); R(x + 2, b - 13, vw - 4, 2, '#e8d8a0');
      R(x + 5, b - 20, 1, 7, k.leaf); R(x + 6, b - 18, 1, 5, k.leaf); R(x + 25, b - 21, 1, 8, k.leaf);
      R(x + 10, b - 21, 4, 2, '#f08030'); R(x + 14, b - 21, 1, 1, '#f08030'); R(x + 18, b - 17, 3, 2, '#f8d030'); R(x + 17, b - 17, 1, 1, '#f8d030');
      R(x + 22, b - 23, 1, 1, '#ffffff'); R(x + 21, b - 20, 1, 1, '#ffffff');
    } },
    { id: 'fireplace', name: 'Fireplace', w: 2, h: 1, price: 1100, glow: ['#f8a030', '#f8e070'], draw(x, b, vw, dir) {
      if (dir % 2) return sideBox(x, b, vw, 28);
      box(x, b - 26, vw, 26, k.w, k.wd); for (let j = b - 24; j < b; j += 4) for (let i = (j % 8 ? 2 : 0); i < vw - 2; i += 6) R(x + 1 + i, j, 1, 3, k.wd);
      box(x - 1 + 1, b - 30, vw, 4, k.wl, k.wd);
      if (dir === 2) return;
      R(x + 7, b - 18, vw - 14, 18, '#2a1a1a'); disc(x + vw / 2, b - 18, 9, '#2a1a1a'); R(x + 7, b - 18, vw - 14, 18, '#2a1a1a');
      R(x + 9, b - 3, vw - 18, 2, '#6a4426');
      tri(x + 13, b - 12, 9, '#f8a030', 0.5); tri(x + 19, b - 14, 11, '#f8a030', 0.5); tri(x + 16, b - 9, 6, '#f8e070', 0.5);
      disc(x + 8, b - 34, 2, k.a); R(x + 22, b - 36, 3, 6, k.c);
    } },
    { id: 'stove', name: 'Stove', w: 1, h: 1, price: 520, draw(x, b) {
      box(x, b - 22, 16, 22, k.m, k.md); R(x + 1, b - 21, 14, 1, k.ml); disc(x + 4, b - 23, 2, '#303038'); disc(x + 11, b - 23, 2, '#303038');
      box(x + 2, b - 15, 12, 12, k.md, tone(k.md, 0.6)); R(x + 4, b - 12, 8, 5, '#3a2a2a'); R(x + 3, b - 18, 10, 1, k.a); R(x + 3, b - 20, 2, 1, k.a); R(x + 11, b - 20, 2, 1, k.a);
    } },
    { id: 'fridge', name: 'Fridge', w: 1, h: 1, price: 700, draw(x, b) {
      box(x + 1, b - 38, 14, 38, k.p, k.pd); R(x + 2, b - 25, 12, 1, k.pd); R(x + 12, b - 34, 1, 6, k.m); R(x + 12, b - 21, 1, 9, k.m);
      R(x + 4, b - 34, 3, 3, k.c); R(x + 5, b - 29, 2, 2, k.a); R(x + 3, b - 18, 4, 5, '#ffffff'); R(x + 4, b - 17, 2, 1, k.md);
    } },
    { id: 'sink', name: 'Sink', w: 1, h: 1, price: 420, draw(x, b) {
      box(x, b - 16, 16, 16, k.w, k.wd); box(x + 2, b - 13, 5, 11, k.wl, k.wd); box(x + 9, b - 13, 5, 11, k.wl, k.wd); R(x + 6, b - 8, 1, 2, k.a); R(x + 9, b - 8, 1, 2, k.a);
      box(x, b - 18, 16, 3, k.p, k.pd); R(x + 4, b - 18, 8, 1, k.md); R(x + 7, b - 24, 2, 6, k.m); R(x + 7, b - 24, 4, 2, k.m);
    } },
    { id: 'washer', name: 'Washing machine', w: 1, h: 1, price: 600, draw(x, b) {
      box(x + 1, b - 20, 14, 20, k.p, k.pd); R(x + 2, b - 19, 12, 3, k.pd); R(x + 3, b - 18, 2, 1, k.a); R(x + 7, b - 18, 5, 1, k.c);
      disc(x + 8, b - 9, 5, k.m); disc(x + 8, b - 9, 4, '#8ac8f0'); R(x + 6, b - 11, 2, 1, '#ffffff'); R(x + 6, b - 8, 5, 2, k.cl);
    } },
    { id: 'bin', name: 'Trash bin', w: 1, h: 1, price: 80, draw(x, b) {
      box(x + 3, b - 13, 10, 13, k.m, k.md); R(x + 5, b - 12, 1, 11, k.ml); R(x + 3, b - 8, 10, 2, k.a);
      box(x + 2, b - 15, 12, 3, k.ml, k.md); R(x + 7, b - 17, 2, 2, k.md);
    } },
    { id: 'umbrellas', name: 'Umbrella stand', w: 1, h: 1, price: 180, draw(x, b) {
      R(x + 5, b - 24, 1, 14, k.c); R(x + 4, b - 25, 2, 2, k.c); R(x + 9, b - 26, 1, 16, k.a); R(x + 9, b - 27, 3, 2, k.a); R(x + 11, b - 26, 1, 2, k.a);
      tri(x + 5, b - 18, 8, k.cd, 0.3); box(x + 3, b - 12, 10, 12, k.w, k.wd); R(x + 3, b - 10, 10, 1, k.wl);
    } },
    { id: 'coatrack', name: 'Coat rack', w: 1, h: 1, price: 220, draw(x, b) {
      R(x + 7, b - 36, 2, 34, k.wd); R(x + 4, b - 2, 8, 2, k.wd); R(x + 3, b - 3, 2, 1, k.wd); R(x + 11, b - 3, 2, 1, k.wd);
      R(x + 4, b - 34, 3, 1, k.wd); R(x + 9, b - 34, 3, 1, k.wd);
      box(x + 1, b - 38, 7, 3, k.c, k.cd); R(x + 2, b - 40, 5, 2, k.c); R(x + 10, b - 33, 3, 14, k.a); R(x + 9, b - 33, 1, 3, k.a);
    } },
    { id: 'lantern', name: 'Paper lantern', w: 1, h: 1, price: 260, glow: ['g', 'gl'], draw(x, b) {
      box(x + 4, b - 3, 8, 3, k.w, k.wd); R(x + 7, b - 14, 2, 11, k.wd);
      box(x + 3, b - 30, 10, 2, k.wd, tone(k.wd, 0.6)); oval(x + 8, b - 22, 5, 7, k.g); box(x + 4, b - 15, 8, 2, k.wd, tone(k.wd, 0.6));
      for (let j = b - 27; j < b - 16; j += 3) R(x + 4, j, 9, 1, k.ad); R(x + 6, b - 25, 2, 6, k.gl);
    } },
    { id: 'birdcage', name: 'Birdcage', w: 1, h: 1, price: 340, draw(x, b) {
      box(x + 5, b - 3, 6, 3, k.m, k.md); R(x + 7, b - 12, 2, 9, k.md);
      box(x + 2, b - 14, 12, 2, k.m, k.md); for (let i = 0; i < 6; i++) R(x + 3 + i * 2, b - 28, 1, 14, k.m); oval(x + 8, b - 28, 6, 3, k.m); R(x + 7, b - 33, 2, 2, k.m);
      R(x + 6, b - 20, 4, 3, '#b8885a'); R(x + 5, b - 21, 2, 2, '#b8885a'); R(x + 5, b - 21, 1, 1, '#202028'); R(x + 4, b - 20, 1, 1, '#f0b040'); R(x + 3, b - 17, 10, 1, k.wd);
    } },
    { id: 'chest', name: 'Treasure chest', w: 1, h: 1, price: 400, draw(x, b) {
      box(x + 1, b - 10, 14, 10, k.w, k.wd); oval(x + 8, b - 11, 7, 4, k.wd); oval(x + 8, b - 11, 6, 3, k.w); R(x + 1, b - 11, 14, 2, k.wd);
      R(x + 3, b - 15, 2, 15, k.a); R(x + 11, b - 15, 2, 15, k.a); box(x + 6, b - 10, 4, 4, k.a, k.ad); R(x + 7, b - 8, 2, 1, '#202028');
    } },
    { id: 'barrel', name: 'Barrel', w: 1, h: 1, price: 180, draw(x, b) {
      oval(x + 8, b - 9, 6, 9, k.wd); for (let j = -8; j <= 8; j++) { const h = Math.floor(5 * Math.sqrt(1 - (j * j) / 90)); R(x + 8 - h, b - 9 + j, h * 2 + 1, 1, k.w); }
      for (let i = 4; i < 13; i += 3) R(x + i, b - 16, 1, 15, k.wd); R(x + 2, b - 14, 12, 2, k.m); R(x + 2, b - 5, 12, 2, k.m); oval(x + 8, b - 17, 5, 1, k.wl);
    } },
    { id: 'cauldron', name: 'Cauldron', w: 1, h: 1, price: 360, draw(x, b) {
      R(x + 3, b - 3, 2, 3, '#202028'); R(x + 11, b - 3, 2, 3, '#202028'); oval(x + 8, b - 8, 7, 6, '#303038'); oval(x + 7, b - 9, 2, 2, '#4a4a58');
      oval(x + 8, b - 13, 6, 2, k.c); R(x + 1, b - 14, 14, 1, '#303038'); disc(x + 6, b - 16, 1, k.cl); disc(x + 10, b - 18, 1, k.cl); R(x + 8, b - 21, 1, 1, k.cl);
    } },
    { id: 'easel', name: 'Easel', w: 1, h: 1, price: 280, draw(x, b) {
      for (let j = 0; j < 30; j++) { R(x + 4 + Math.floor(j / 10), b - j, 1, 1, k.wd); R(x + 11 - Math.floor(j / 10), b - j, 1, 1, k.wd); }
      R(x + 7, b - 34, 2, 30, k.wd); box(x + 2, b - 30, 12, 14, k.p, k.pd); R(x + 3, b - 29, 10, 6, k.cl); disc(x + 6, b - 22, 2, k.c); R(x + 9, b - 25, 3, 5, k.leaf); R(x + 2, b - 16, 12, 2, k.w);
    } },
    { id: 'pillar', name: 'Pillar', w: 1, h: 1, price: 450, draw(x, b) {
      box(x + 1, b - 4, 14, 4, k.p, k.pd); box(x + 3, b - 34, 10, 30, k.p, k.pd); for (let i = 5; i < 12; i += 2) R(x + i, b - 32, 1, 27, k.pd);
      box(x + 1, b - 38, 14, 4, k.p, k.pd); R(x + 2, b - 37, 12, 1, k.a);
    } },
    { id: 'ballstatue', name: 'Poké Ball statue', proper: true, w: 1, h: 1, price: 800, draw(x, b) {
      box(x + 2, b - 10, 12, 10, k.p, k.pd); R(x + 3, b - 9, 10, 1, '#ffffff'); R(x + 1, b - 11, 14, 2, k.pd);
      disc(x + 8, b - 19, 7, '#303038'); disc(x + 8, b - 19, 6, '#ffffff');
      for (let j = -6; j < 0; j++) { const h = Math.floor(Math.sqrt(36 - j * j) + 0.35); R(x + 8 - h, b - 19 + j, h * 2 + 1, 1, k.c); }
      R(x + 1, b - 19, 14, 1, '#303038'); box(x + 6, b - 21, 4, 4, '#ffffff', '#303038'); R(x + 4, b - 24, 2, 1, k.cl);
    } },
    { id: 'arcade', name: 'Arcade machine', w: 1, h: 1, price: 1000, glow: ['#68f0c8', '#f8f0a0'], draw(x, b) {
      box(x + 1, b - 38, 14, 38, k.c, k.cd); R(x + 2, b - 37, 12, 4, '#f8f0a0'); R(x + 3, b - 36, 10, 2, k.c);
      box(x + 2, b - 31, 12, 11, '#202028', '#101018'); R(x + 3, b - 30, 10, 9, '#68f0c8'); R(x + 5, b - 27, 2, 2, '#202028'); R(x + 9, b - 25, 3, 1, '#f8f0a0');
      box(x, b - 20, 16, 4, k.cl, k.cd); R(x + 4, b - 23, 1, 3, k.md); disc(x + 4, b - 23, 1, k.a); R(x + 9, b - 18, 2, 1, k.a); R(x + 12, b - 18, 2, 1, k.p);
    } },
    { id: 'jukebox', name: 'Jukebox', w: 1, h: 1, price: 950, glow: ['g', 'gl'], draw(x, b) {
      box(x + 1, b - 26, 14, 26, k.w, k.wd); disc(x + 8, b - 26, 7, k.wd); disc(x + 8, b - 26, 6, k.g); disc(x + 8, b - 26, 4, k.gl); R(x + 2, b - 26, 12, 6, k.g);
      R(x + 3, b - 18, 10, 6, k.p); for (let i = 0; i < 4; i++) R(x + 4 + i * 2, b - 17, 1, 4, k.c); R(x + 3, b - 10, 10, 6, k.md); for (let j = 0; j < 3; j++) R(x + 4, b - 9 + j * 2, 8, 1, k.m);
    } },
    { id: 'vending', name: 'Vending machine', w: 1, h: 1, price: 900, glow: ['gl'], draw(x, b) {
      box(x, b - 38, 16, 38, k.c, k.cd); R(x + 1, b - 37, 14, 3, k.cl); box(x + 2, b - 33, 9, 22, k.gl, k.cd);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) R(x + 3 + i * 3, b - 31 + j * 5, 2, 4, [k.a, '#68b8f0', '#f8a0c0'][(i + j) % 3]);
      R(x + 12, b - 31, 2, 2, k.a); R(x + 12, b - 27, 2, 6, '#202028'); R(x + 3, b - 8, 8, 4, '#202028');
    } },
    { id: 'snowman', name: 'Snowman', w: 1, h: 1, price: 160, draw(x, b) {
      disc(x + 8, b - 6, 6, '#d8e8f4'); disc(x + 8, b - 6, 5, '#ffffff'); disc(x + 8, b - 16, 4, '#d8e8f4'); disc(x + 8, b - 16, 3, '#ffffff');
      R(x + 3, b - 13, 10, 2, k.c); R(x + 10, b - 12, 2, 4, k.c); R(x + 7, b - 17, 1, 1, '#202028'); R(x + 9, b - 17, 1, 1, '#202028'); R(x + 8, b - 16, 3, 1, '#f08030');
      R(x + 5, b - 21, 7, 1, '#303038'); R(x + 6, b - 25, 5, 4, '#303038'); R(x + 8, b - 7, 1, 1, '#303038'); R(x + 8, b - 4, 1, 1, '#303038');
    } },
    { id: 'grandclock', name: 'Grandfather clock', w: 1, h: 1, price: 800, draw(x, b) {
      box(x + 2, b - 4, 12, 4, k.w, k.wd); box(x + 3, b - 28, 10, 24, k.w, k.wd); box(x + 1, b - 40, 14, 12, k.w, k.wd); R(x + 2, b - 39, 12, 1, k.wl);
      disc(x + 8, b - 34, 4, k.p); R(x + 8, b - 37, 1, 3, k.md); R(x + 8, b - 34, 3, 1, k.md);
      R(x + 5, b - 25, 6, 18, tone(k.wd, 0.8)); R(x + 8, b - 25, 1, 12, k.a); disc(x + 8, b - 12, 2, k.a);
    } },
    { id: 'counter', name: 'Shop counter', w: 2, h: 1, price: 650, draw(x, b, vw, dir) {
      if (dir % 2) return sideBox(x, b, vw, 18);
      box(x, b - 16, vw, 16, k.w, k.wd); box(x - 0, b - 19, vw, 3, k.wl, k.wd);
      if (dir === 2) return;
      for (let i = 0; i < 4; i++) R(x + 3 + i * 7, b - 13, 5, 10, k.wl);
      box(x + 3, b - 26, 9, 7, k.m, k.md); R(x + 4, b - 25, 7, 2, '#68f0a0'); R(x + 4, b - 22, 7, 2, k.ml);
      disc(x + 23, b - 21, 2, k.c); disc(x + 27, b - 21, 2, k.a);
    } },
    { id: 'cupboard', name: 'Cupboard', w: 1, h: 1, price: 480, draw(x, b) {
      box(x + 1, b - 38, 14, 36, k.w, k.wd); R(x + 2, b - 2, 2, 2, k.wd); R(x + 12, b - 2, 2, 2, k.wd); R(x + 1, b - 38, 14, 2, k.wd);
      box(x + 2, b - 35, 12, 16, '#d8eef8', k.wd); R(x + 8, b - 35, 1, 16, k.wd);
      for (const j of [-33, -26]) { disc(x + 5, b + j + 3, 2, k.p); disc(x + 11, b + j + 3, 2, k.p); R(x + 3, b + j + 6, 10, 1, k.wd); }
      box(x + 2, b - 17, 12, 13, k.wl, k.wd); R(x + 7, b - 12, 1, 3, k.a); R(x + 9, b - 12, 1, 3, k.a);
    } },
    { id: 'nightstand', name: 'Nightstand', w: 1, h: 1, price: 260, glow: ['g', 'gl'], draw(x, b) {
      box(x + 1, b - 12, 14, 12, k.w, k.wd); box(x + 2, b - 10, 12, 4, k.wl, k.wd); R(x + 7, b - 9, 2, 1, k.a); R(x + 2, b - 2, 2, 2, k.wd); R(x + 12, b - 2, 2, 2, k.wd);
      box(x + 4, b - 15, 5, 3, k.m, k.md); R(x + 6, b - 18, 1, 3, k.md); box(x + 3, b - 24, 7, 6, k.g, k.ad); R(x + 4, b - 23, 5, 1, k.gl);
      box(x + 11, b - 14, 3, 2, k.c, k.cd);
    } },
    { id: 'standmirror', name: 'Standing mirror', w: 1, h: 1, price: 420, draw(x, b) {
      R(x + 3, b - 2, 10, 2, k.wd); R(x + 4, b - 5, 1, 3, k.wd); R(x + 11, b - 5, 1, 3, k.wd);
      oval(x + 8, b - 20, 6, 15, k.wd); oval(x + 8, b - 20, 5, 14, k.w); oval(x + 8, b - 20, 4, 13, '#c8e4f0'); R(x + 6, b - 28, 1, 10, '#ffffff'); R(x + 7, b - 31, 1, 4, '#ffffff');
    } },
    { id: 'pc', name: 'Storage PC', w: 1, h: 1, price: 1100, glow: ['#68e8f8'], draw(x, b) {
      box(x + 1, b - 30, 14, 30, k.p, k.pd); R(x + 2, b - 29, 12, 1, '#ffffff'); box(x + 2, b - 27, 12, 10, k.md, tone(k.md, 0.6)); R(x + 3, b - 26, 10, 8, '#68e8f8');
      bits(MOTIFS.ball.map(r => r.slice(1, 8)).slice(1, 8), x + 5, b - 26, { k: '#2a8ab0', '#': '#ffffff', '+': '#ffffff', o: '#a8f4fc' });
      R(x + 3, b - 14, 10, 2, k.c); R(x + 3, b - 10, 4, 6, k.pd); R(x + 9, b - 10, 4, 1, k.md); R(x + 9, b - 8, 4, 1, k.md);
    } },
    { id: 'crystalball', name: 'Crystal ball', w: 1, h: 1, price: 520, glow: ['#c8a0f8', '#f0e0ff'], draw(x, b) {
      box(x + 3, b - 4, 10, 4, k.w, k.wd); R(x + 5, b - 6, 6, 2, k.a);
      disc(x + 8, b - 12, 6, '#8a68c8'); disc(x + 8, b - 12, 5, '#c8a0f8'); disc(x + 9, b - 11, 2, '#f0e0ff'); R(x + 5, b - 15, 2, 2, '#ffffff');
    } },
    { id: 'gong', name: 'Gong', w: 1, h: 1, price: 480, draw(x, b) {
      R(x + 1, b - 36, 2, 36, k.wd); R(x + 13, b - 36, 2, 36, k.wd); R(x, b - 37, 16, 3, k.w);
      R(x + 7, b - 34, 1, 3, k.md); disc(x + 8, b - 23, 6, k.ad); disc(x + 8, b - 23, 5, k.a); disc(x + 8, b - 23, 2, k.ad); R(x + 5, b - 26, 2, 1, tone(k.a, 1.4));
    } },
    { id: 'toybox', name: 'Toy box', w: 1, h: 1, price: 300, draw(x, b) {
      disc(x + 5, b - 13, 3, '#e04848'); R(x + 2, b - 13, 7, 1, '#303038'); R(x + 3, b - 12, 5, 2, '#ffffff');
      R(x + 9, b - 18, 2, 8, k.a); disc(x + 10, b - 19, 2, k.a); R(x + 12, b - 14, 3, 3, '#68b8f0');
      box(x + 1, b - 11, 14, 11, k.c, k.cd); R(x + 2, b - 10, 12, 1, k.cl); for (let i = 0; i < 3; i++) box(x + 3 + i * 4, b - 7, 3, 3, [k.a, k.p, k.leaf][i], k.cd);
    } },
    { id: 'bookstack', name: 'Book pile', w: 1, h: 1, price: 120, draw(x, b) {
      [[2, 12], [3, 11], [1, 13], [4, 9], [3, 10]].forEach(([dx, bw], i) => { box(x + dx, b - 3 - i * 3, bw, 3, BOOKS[(i + 2) % BOOKS.length], tone(BOOKS[(i + 2) % BOOKS.length], 0.6)); R(x + dx + 1, b - 2 - i * 3, bw - 3, 1, '#f4f0e0'); });
      R(x + 6, b - 18, 4, 3, k.c); R(x + 7, b - 19, 2, 1, k.c);
    } },
    { id: 'tent', name: 'Tent', w: 2, h: 2, price: 1200, draw(x, b, vw) {
      for (let j = 0; j < 30; j++) { const half = Math.floor(j * 0.53) + 1; R(x + vw / 2 - half, b - 30 + j, half * 2, 1, j % 6 < 3 ? k.c : k.cd); }
      for (let j = 0; j < 30; j++) { const half = Math.floor(j * 0.53) + 1; R(x + vw / 2 - half, b - 30 + j, 1, 1, k.cd); R(x + vw / 2 + half - 1, b - 30 + j, 1, 1, k.cd); }
      for (let j = 0; j < 16; j++) { const half = Math.floor(j * 0.4) + 1; R(x + vw / 2 - half, b - 16 + j, half * 2, 1, '#2a2030'); }
      R(x + vw / 2, b - 33, 1, 4, k.wd); R(x + vw / 2 + 1, b - 33, 4, 2, k.a);
      R(x + 1, b - 2, 2, 2, k.wd); R(x + vw - 3, b - 2, 2, 2, k.wd);
    } },
    { id: 'slide', name: 'Slide', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
      if (dir % 2) return sideBox(x, b, vw, 22);
      R(x + 3, b - 24, 2, 24, k.m); R(x + 9, b - 24, 2, 24, k.m); for (let j = b - 21; j < b; j += 4) R(x + 3, j, 8, 1, k.m);
      box(x + 2, b - 26, 10, 3, k.c, k.cd);
      for (let i = 0; i < vw - 12; i++) R(x + 11 + i, b - 24 + Math.floor(i * 1.1), 2, 3, i % 4 < 2 ? k.a : k.ad);
    } },
    { id: 'pokecenter', name: 'Healing machine', w: 2, h: 1, price: 1500, glow: ['#f8a0c0', '#ffffff'], draw(x, b, vw, dir) {
      if (dir % 2) return sideBox(x, b, vw, 18);
      box(x, b - 16, vw, 16, k.p, k.pd); R(x + 1, b - 15, vw - 2, 1, '#ffffff'); R(x + 3, b - 10, vw - 6, 3, k.c);
      box(x + 2, b - 20, vw - 4, 4, k.md, tone(k.md, 0.6));
      for (let i = 0; i < 6; i++) { const cx = x + 6 + (i % 3) * 10, cy = b - 22 - Math.floor(i / 3) * 4; disc(cx, cy, 2, '#303038'); R(cx - 1, cy - 2, 3, 2, '#f8a0c0'); R(cx - 1, cy, 3, 1, '#ffffff'); }
    } },
  ]);

  /* ---------- Pokémon dolls: a bitmap each, outlined in code; one look, never themed ---------- */
  const DOLLS = [
    ['pikachu', 'Pikachu', { b: '#f8d030', s: '#d8a020', r: '#e04040', k: '#202028', e: '#202028' },
      ['k........k', 'b........b', 'bb......bb', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'rbbbbbbbbr', '.bbbssbbb.', '.bbbbbbbb.', 'bbbbbbbbbb', '.ss....ss.']],
    ['clefairy', 'Clefairy', { b: '#f8b8c8', s: '#e090a8', x: '#8a5a3a', e: '#202028', r: '#f87890' },
      ['x...b....x', 'bx.bb...xb', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'rbbbbbbbbr', '.bbbbbbbb.', 'bbbbbbbbbb', '.bbbbbbbb.', '.ss....ss.']],
    ['jigglypuff', 'Jigglypuff', { b: '#f8b8d0', s: '#e090b0', e: '#3a6ab8', w: '#ffffff', r: '#f87890' },
      ['....bb....', '.b.bbb..b.', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbeebbeebb', 'bbwebbwebb', 'rbbbbbbbbr', 'bbbbbbbbbb', '.bbbbbbbb.', '..s....s..']],
    ['snorlax', 'Snorlax', { b: '#3a6a7a', w: '#f0e0c0', k: '#202028' },
      ['.b......b.', '.bbbbbbbb.', 'bbwwwwwwbb', 'bwkkwwkkwb', 'bwwwwwwwwb', 'bbwwwwwwbb', 'bwwwwwwwwb', 'bwwwwwwwwb', 'bbwwwwwwbb', '.ww....ww.']],
    ['bulbasaur', 'Bulbasaur', { b: '#78c8a8', s: '#4a9a80', x: '#4fa042', y: '#2f7a32', r: '#d84848', w: '#ffffff' },
      ['....xxx...', '...xyxxx..', 'b.bxxyxxx.', 'bbbbxxxxx.', 'bbbbbbbbbb', 'brwbbsbbbb', 'bbbbbsbbbb', '.bsbbbbsb.', '.bb.bb.bb.']],
    ['charmander', 'Charmander', { b: '#f08838', w: '#f8d878', x: '#f84030', y: '#f8d030', e: '#202028' },
      ['..bbbb....', '.bbbbbb...', '.bbebbe...', '.bbbbbb...', '..bbbb..y.', '.bwwwwb.xy', 'bbwwwwbbx.', '.bwwwwbb..', '..bbbb....', '.bb..bb...']],
    ['squirtle', 'Squirtle', { b: '#78b8e8', x: '#b87838', w: '#f0e0a0', e: '#202028' },
      ['..bbbbbb..', '.bbbbbbbb.', '.bebbbbeb.', '.bbbbbbbb.', 'xxwwwwwwxx', 'bxwwwwwwxb', '.xwwwwwwx.', '.xxwwwwxx.', '..bb..bb..']],
    ['eevee', 'Eevee', { b: '#b87838', w: '#f0e0b0', e: '#202028', s: '#8a5a28' },
      ['b........b', 'bb......bb', 'sbbbbbbbbs', '.bbbbbbbb.', '.bebbbbeb.', '.bbbbbbbb.', 'wwwwwwwwww', '.wwwwwwww.', '..bbbbbb..', '..bb..bb..']],
    ['psyduck', 'Psyduck', { b: '#f8d040', x: '#f8f0b0', w: '#ffffff', e: '#202028', k: '#202028' },
      ['...k.k....', '..bbbbbb..', '.bbbbbbbb.', '.bwebbweb.', '.bbxxxxbb.', '..bxxxxb..', '.bbbbbbbb.', 'bbbbbbbbbb', '.bbbbbbbb.', '.xx....xx.']],
    ['togepi', 'Togepi', { b: '#f8f0c0', w: '#ffffff', r: '#e04848', x: '#4a78d8', e: '#202028' },
      ['..b.bb.b..', '..bbbbbb..', '.bbebbebb.', '.bbbbbbbb.', 'wwrwwxwwrw', 'wrrwxxwrrw', 'wwwwwwwwww', '.wwxwwrww.', '..wwwwww..', '..bb..bb..']],
    ['marill', 'Marill', { b: '#4a88e8', w: '#f8f8f8', r: '#e86a7a', e: '#202028' },
      ['.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'bbbbrrbbbb', 'bwwwwwwwwb', 'bwwwwwwwwb', '.bwwwwwwb.', '..bb..bb..']],
    ['ditto', 'Ditto', { b: '#b890d8', k: '#3a2a4a' },
      ['..bb..bb..', '.bbbbbbbbb', 'bbbbbbbbbb', 'bbkbbbkbbb', 'bbbbbbbbbb', 'bbbkkkbbbb', 'bbbbbbbbbb', '.bbbbbbbbb']],
    ['voltorb', 'Voltorb', { r: '#e04040', w: '#f8f8f8', k: '#202028' },
      ['...rrrr...', '.rrrrrrrr.', 'rrrrrrrrrr', 'rkkrrrrkkr', 'rrrrrrrrrr', 'wwwwwwwwww', 'wwwwwwwwww', '.wwwwwwww.', '...wwww...']],
    ['poliwag', 'Poliwag', { b: '#5a78d8', w: '#f8f8f8', e: '#202028', k: '#202028' },
      ['..bbbbbb..', '.bwwbbwwb.', '.bwebbewb.', 'bbbbbbbbbb', 'bwwwwwwwwb', 'bwwkkkkwwb', 'bwwkwwkwwb', 'bwwwwkkwwb', '.bwwwwwwb.', '..bb..bb..']],
    ['gengar', 'Gengar', { b: '#7a58b8', r: '#e84848', w: '#ffffff', k: '#202028' },
      ['b..b..b..b', 'bb.bbbb.bb', 'bbbbbbbbbb', 'brrbbbbrrb', 'bbbbbbbbbb', 'bwwwwwwwwb', 'bbwkwwkwbb', '.bbbbbbbb.', '.bbbbbbbb.', '.bb....bb.']],
    ['mew', 'Mew', { b: '#f8b8d0', x: '#4a88d8', e: '#202028' },
      ['.b....b...', '.bbbbbb...', 'bbbbbbbb..', 'bxebbxeb..', 'bbbbbbbb..', '.bbbbbb...', '..bbbb..b.', '.bbbbbb.b.', '..bbbb.bb.', '..b..b....']],
  ];
  const doll = (x, b, vw, rows, ink, s) => {
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const at = (i, j) => j >= 0 && j < h && i >= 0 && i < rows[j].length && rows[j][i] !== '.';
    const line = tone(ink.b || ink.r, 0.35), ox = x + Math.floor((vw - (w + 2) * s) / 2) + s, oy = b - (h + 1) * s;
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
      if (!at(i, j) && (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1))) R(ox + i * s, oy + j * s, s, s, line);
    }
    bits(rows, ox, oy, ink, s);
  };
  add('Dolls', DOLLS.map(([id, name, inkSet, rows]) => ({ id: `${id}doll`, name: `${name} doll`, proper: true, solo: true, w: 1, h: 1, price: 350,
    draw(x, b, vw) { doll(x, b, vw, rows, inkSet, 1); } })));
  add('Dolls', DOLLS.map(([id, name, inkSet, rows]) => ({ id: `big${id}doll`, name: `Big ${name} doll`, proper: true, solo: true, w: 2, h: 2, price: 1000,
    draw(x, b, vw) { doll(x, b, vw, rows, inkSet, 2); } })));

  return out;
}

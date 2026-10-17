/* base-dolls-3.js  -  Gen 4-5 dolls (2026-10-17): fifteen more PLUSH patterns and the extras that make each one
   itself, sewn with js/base-dolls.js's kit (SEW) so the same lines paint the doll and sew it in 3D. */

import { PLUSH, EXTRAS, SEW } from './base-dolls.js';

const { puff, shape, line, curveLine, dot, flat } = SEW;

/** A four-pointed star (Shinx's tail tip), `r` its reach. */
const star4 = (x, y, r, c) => shape([[x, y + r], [x + r * 0.28, y + r * 0.28], [x + r, y], [x + r * 0.28, y - r * 0.28], [x, y - r], [x - r * 0.28, y - r * 0.28], [x - r, y], [x - r * 0.28, y + r * 0.28]], c, { curve: false });
/** A small heart (Drifloon's hands). */
const heart = (x, y, r, c) => shape([[x, y - r], [x + r, y + r * 0.2], [x + r * 0.8, y + r * 0.85], [x + r * 0.35, y + r], [x, y + r * 0.55], [x - r * 0.35, y + r], [x - r * 0.8, y + r * 0.85], [x - r, y + r * 0.2]], c, { curve: false });

Object.assign(EXTRAS, {
  // Shinx: a black tail ending in a yellow four-pointed star, and a black spiky tuft on its head
  startail3: (d, L) => { const [tx, ty] = L.tail; line([[tx - 6, ty], [tx + 8, ty + 8], [tx + 14, ty + 20]], d.tailc, 3.6); star4(tx + 15, ty + 27, 8, d.star); },
  spiketuft3: (d, L) => { const [x, y, , ry] = L.head, t = y + ry; shape([[x - 12, t - 6], [x - 9, t + 6], [x - 3, t + 1], [x + 1, t + 11], [x + 5, t + 1], [x + 11, t + 6], [x + 12, t - 6], [x, t - 9]], d.tuftc, { curve: false }); },
  // Buneary: one ear standing, one rolled, both ending in cream fluff; a cream fluff skirt round its legs
  bunears3: (d, L) => {
    const [x, y, , ry] = L.head, t = y + ry;
    shape([[x - 24, t - 10], [x - 26, t + 10], [x - 18, t + 26], [x - 10, t + 10], [x - 8, t - 6]], d.body);
    puff(x - 18, t + 25, 8, 7, d.fluff);
    shape([[x + 8, t - 6], [x + 10, t + 8], [x + 24, t + 10], [x + 26, t - 10]], d.body);
    puff(x + 18, t + 9, 9, 8, d.fluff);
  },
  fluffhem3: (d, L) => { const [x, y, rx] = L.body; puff(x, y - 11, rx + 3, 11, d.fluff); },
  // Riolu: the black mask across its eyes, its ties hanging behind its head, black legs
  mask3: (d, L) => { const [x, , rx] = L.head, [, ey] = L.eye; shape([[x - rx + 1, ey + 6], [x, ey + 9], [x + rx - 1, ey + 6], [x + rx - 3, ey - 6], [x, ey - 4], [x - rx + 3, ey - 6]], d.maskc); },
  maskties3: (d, L) => { const [x, y, rx] = L.head; for (const s of [-1, 1]) shape([[x + s * (rx - 8), y + 4], [x + s * (rx + 6), y], [x + s * (rx + 8), y - 20], [x + s * (rx - 2), y - 10]], d.maskc, { curve: false }); },
  shorts3: (d, L) => { const [x, y, rx] = L.body; puff(x, y - 10, rx - 2, 10, d.maskc); },
  // Gible: the big red jaw under its grin, and the notched fin rising behind its head
  gibchin3: (d, L) => { const [x, y] = L.head; puff(x, y - 15, 21, 8, d.belly); },
  gibfin3: (d, L) => { const [x, y, , ry] = L.head, t = y + ry; shape([[x + 4, t - 16], [x + 14, t + 12], [x + 22, t + 4], [x + 32, t + 12], [x + 30, t - 18]], d.body, { curve: false }); },
  // Drifloon: the white cloud on its crown, the yellow X, string arms ending in yellow hearts
  cloud3: (d, L) => { const [x, y, , ry] = L.head, t = y + ry; puff(x, t - 1, 9, 7, d.cloudc); for (const s of [-1, 1]) puff(x + s * 8, t - 4, 6.5, 5.5, d.cloudc); },
  xmark3: (d, L) => { const [x] = L.head, y = L.mouth - 4; line([[x - 5, y + 5], [x + 5, y - 5]], d.xc, 2.6); line([[x - 5, y - 5], [x + 5, y + 5]], d.xc, 2.6); },
  strings3: (d, L) => { const [x, y, rx] = L.head; for (const s of [-1, 1]) { curveLine([x + s * (rx - 12), y - 20], [x + s * (rx + 12), y - 18], [x + s * (rx + 5), y - 26], d.stringc, 1.4); heart(x + s * (rx + 5), y - 30, 5, d.xc); } },
  // Shaymin: the green grass on its head and back, and the pink flower on one side
  grass3: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - rx - 1, y + 2], [x - rx + 2, y + ry * 0.55], [x - rx * 0.6, y + ry + 2], [x - rx * 0.3, y + ry - 2], [x - rx * 0.1, y + ry + 5], [x + rx * 0.15, y + ry - 1], [x + rx * 0.4, y + ry + 4], [x + rx * 0.6, y + ry - 1], [x + rx - 2, y + ry * 0.6], [x + rx + 1, y + 2], [x + rx * 0.7, y + ry * 0.35], [x + rx * 0.3, y + ry * 0.5], [x, y + ry * 0.38], [x - rx * 0.3, y + ry * 0.5], [x - rx * 0.7, y + ry * 0.35]], d.body, { curve: false }); },
  flower3: (d, L) => {
    const [x, y, rx, ry] = L.head, fx = x - rx * 0.62, fy = y + ry * 0.72, pts = [];
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 10; pts.push([fx + Math.cos(a) * r, fy + Math.sin(a) * r]); }
    shape(pts, d.petal);
    flat(fx, fy, 3, 3, d.petalc);
  },
  // Leafeon and Glaceon: Glaceon's teal cap with its two hanging lobes
  icecap3: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - 16, y + ry - 6], [x, y + ry + 2], [x + 16, y + ry - 6], [x, y + ry - 15]], d.capc); for (const s of [-1, 1]) flat(x + s * (rx - 1), y - 12, 6, 10, d.capc, s * 0.2); },
  icetail3: (d, L) => { const [tx, ty] = L.tail; shape([[tx - 6, ty], [tx + 8, ty + 10], [tx + 22, ty + 10], [tx + 20, ty + 26], [tx + 12, ty + 40], [tx + 10, ty + 24], [tx + 2, ty + 10]], d.tailc, { curve: false }); },
  // Happiny: its pointed pink hair, and the round white stone in its pouch
  bun3: (d, L) => { const [x, y, , ry] = L.head, t = y + ry; shape([[x - 15, t - 8], [x - 11, t + 4], [x - 2, t + 9], [x, t + 16], [x + 2, t + 9], [x + 11, t + 4], [x + 15, t - 8], [x, t - 4]], d.hairc); },
  stone3: (d, L) => { const [x, y] = L.belly; puff(x, y + 5, 8, 10, d.stonec); },
  // Emolga: the cape between its arms and legs, black over yellow
  cape3: (d, L) => { for (const s of [-1, 1]) { shape([[s * 18, 44], [s * 46, 40], [s * 42, 10], [s * 20, 12]], d.capeu, { curve: false }); shape([[s * 18, 46], [s * 44, 44], [s * 44, 20], [s * 22, 22]], d.capec, { curve: false }); } },
  // Minccino and Zorua: a ruff round the neck, one soft roll
  scarf3: (d, L) => { const [x, y] = L.head; puff(x, y - 25, 23, 7, d.ruffc); },
  // Litwick: its purple flame on a wick, and the wax dripping over its brow
  wick3: (d, L) => {
    const [x, y, , ry] = L.head, t = y + ry;
    line([[x, t - 2], [x, t + 4]], '#4a4050', 1.6);
    shape([[x, t + 2], [x + 8, t + 10], [x + 6, t + 20], [x + 1, t + 33], [x - 5, t + 21], [x - 8, t + 10]], d.flamec);
    shape([[x, t + 5], [x + 4, t + 10], [x + 2, t + 20], [x - 3, t + 11]], d.flamein);
  },
  drips3: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - rx + 2, y + ry * 0.5], [x - rx + 6, y + 3], [x - 18, y + 1], [x - 15, y + ry * 0.45], [x - 2, y + ry * 0.5], [x + 3, y + 13], [x + 7, y + ry * 0.45], [x + rx - 4, y + ry * 0.55], [x + rx - 6, y + ry - 4], [x, y + ry + 1], [x - rx + 6, y + ry - 4]], d.waxc); },
  // Axew: the red tusks at the corners of its mouth
  tusks3: (d, L) => { const [x, y] = L.head; for (const s of [-1, 1]) shape([[x + s * 15, y - 8], [x + s * 27, y - 12], [x + s * 41, y + 2], [x + s * 36, y + 4], [x + s * 26, y - 3], [x + s * 15, y - 2]], d.tuskc, { curve: false }); },
  // Zorua: its curled black forelock with a red tip, and the red over its eyes
  forelock3: (d, L) => { const [x, y, , ry] = L.head, t = y + ry; shape([[x - 5, t - 7], [x - 4, t + 7], [x + 2, t + 14], [x + 11, t + 13], [x + 6, t + 8], [x + 3, t + 4], [x + 3, t - 7]], d.tuftc, { curve: false }); dot(x + 12, t + 11, 3.5, d.tipc); },
  redlids3: (d, L) => { const [x] = L.head, [ex, ey] = L.eye; for (const s of [-1, 1]) flat(x + s * (ex + 1), ey + 1.5, 6.6, 7.6, d.tipc, s * -0.3); },
  // Cubchoo: its dark nose and the drip of icy snot hanging from it
  snot3: (d, L) => { const [x, y] = L.head; flat(x, y - 7, 3.2, 2.4, d.nosec); shape([[x + 1, y - 9], [x + 4.5, y - 18], [x + 4, y - 25], [x, y - 28], [x - 3, y - 24], [x - 2, y - 17]], d.snotc); },
});

Object.assign(PLUSH, {
  shinx: { shape: 'quad', body: '#62a8e0', ears: 'pointy', earin: '#f8d030', under: ['startail3'], tailc: '#33384a', star: '#f8d030', top: ['spiketuft3'], tuftc: '#33384a', eye: '#d89a18', mouth: 'w', feet: '#3a4050' },
  buneary: { body: '#a87452', under: ['bunears3'], fluff: '#f2e4be', mid: ['fluffhem3'], feet: '#f2e4be', eye: '#4a2830', mouth: 'smile' },
  riolu: { body: '#4e8ed6', ears: 'pointy', earin: '#2a2a34', under: ['maskties3'], maskc: '#2a2a34', mid: ['shorts3'], top: ['mask3'], feet: '#2a2a34', eye: '#d83838', mouth: 'smile' },
  gible: { body: '#5a6ab4', belly: '#e05858', ears: 'round', under: ['gibfin3'], top: ['gibchin3'], eye: '#202028', mouth: 'grin' },
  drifloon: { shape: 'ball', body: '#8a68c8', mid: ['strings3'], stringc: '#f4ecdc', xc: '#f8d030', top: ['cloud3', 'xmark3'], cloudc: '#f8f4ea', noarms: true, eye: '#202028', eyes: 'big', mouth: 'none' },
  shaymin: { shape: 'quad', body: '#5cb84a', head: '#f6f6ee', belly: '#f6f6ee', feet: '#ecece2', top: ['grass3', 'flower3'], petal: '#f878a8', petalc: '#f8e0ea', eye: '#3a9a58', mouth: 'smile', cheeks: '#f8a8c0' },
  leafeon: { shape: 'quad', body: '#f0e2b4', ears: 'long', earc: '#d8cc88', eartip: '#5aa848', top: ['leaf'], leafc: '#5aa848', tail: 'leaf', tailc: '#5aa848', feet: '#a88258', eye: '#6a3a20', mouth: 'smile' },
  glaceon: { shape: 'quad', body: '#9ad8f0', ears: 'long', earc: '#6ab8e0', earin: '#3a78b8', under: ['icetail3'], top: ['icecap3'], capc: '#3a88c8', tailc: '#6ab8e0', feet: '#6ab8e0', eye: '#2a5a98', mouth: 'smile' },
  happiny: { body: '#f8b4c4', belly: '#f8f2f2', mid: ['stone3'], stonec: '#ffffff', top: ['bun3'], hairc: '#f48ca8', cheeks: '#f87890', mouth: 'smile' },
  emolga: { body: '#f8f8f8', ears: 'big', earc: '#3a3a48', earin: '#f8d030', under: ['cape3'], capec: '#3a3a48', capeu: '#f8d030', top: ['hair'], hairc: '#3a3a48', eyes: 'big', mouth: 'smile' },
  minccino: { body: '#bab4ac', ears: 'big', earin: '#e6e0d8', top: ['scarf3'], ruffc: '#faf8f2', tail: 'fluffy', tailc: '#c8c2ba', eye: '#6a4030', mouth: 'smile' },
  litwick: { body: '#e8e6f2', feet: '#dcd8e8', noarms: true, top: ['drips3', 'wick3'], waxc: '#ffffff', flamec: '#8a58d8', flamein: '#c8a8f8', eye: '#f8c830', mouth: 'smile' },
  axew: { body: '#a8bc78', feet: '#4e5c42', top: ['tusks3'], tuskc: '#d04838', tail: 'stub', eye: '#c83030', mouth: 'smile' },
  zorua: { shape: 'quad', body: '#4a4a5a', ears: 'pointy', earin: '#c83848', top: ['redlids3', 'forelock3'], tuftc: '#2c2c38', tipc: '#c83848', tail: 'fluffy', tailc: '#3a3a48', eye: '#58a8e0', mouth: 'none' },
  cubchoo: { body: '#f2f6fa', ears: 'round', earc: '#6a88c8', earin: '#3a58a0', top: ['snot3'], nosec: '#3a4a78', snotc: '#a8dcf8', feet: '#9cc0e4', eyes: 'shut', mouth: 'none' },
});

/** [id, name, bitmap colours, bitmap rows]: the fallback pictures; their row count sets each doll's height. */
export const DOLLS_3 = [
  ['shinx', 'Shinx', { b: '#62a8e0', k: '#33384a', y: '#f8d030', e: '#202028' },
    ['b......b.y', 'yb....by.k', '.bbkkbb..k', 'bbbbbbbb.k', 'bebbbbeb.k', 'bbbbbbbbk.', '.bbbbbb.k.', 'bbbbbbbbk.', '.kk..kk...']],
  ['buneary', 'Buneary', { b: '#a87452', w: '#f2e4be', e: '#202028' },
    ['.w........', '.b....ww..', '.b...bbw..', '..bbbbb...', '.bbbbbbb..', '.bebbbeb..', '.bbbbbbb..', '..bbbbb...', '.wwwwwww..', 'wwwwwwwww.']],
  ['riolu', 'Riolu', { b: '#4e8ed6', k: '#2a2a34', r: '#d83838' },
    ['.k......k.', '.bb....bb.', '..bbbbbb..', '.bbbbbbbb.', 'kkrkkkkrkk', 'k.bbbbbb.k', '..bbbbbb..', '.bbbbbbbb.', '..kkkkkk..', '.kk....kk.']],
  ['gible', 'Gible', { b: '#5a6ab4', r: '#e05858', w: '#ffffff', e: '#202028' },
    ['......bb..', '.b...bbb..', 'bbbbbbbbb.', 'bbebbbbebb', 'bbbbbbbbbb', 'bwwwwwwwwb', '.rrrrrrrr.', '..bbbbbb..', '..brrrrb..', '.bb....bb.']],
  ['drifloon', 'Drifloon', { b: '#8a68c8', w: '#f8f4ea', y: '#f8d030', e: '#202028' },
    ['...www....', '..bbbbbb..', '.bbbbbbbb.', 'bbebbbbebb', 'bbbbbbbbbb', 'bbbbybbbbb', 'wbbbbbbbbw', 'w.bbbbbb.w', 'y........y']],
  ['shaymin', 'Shaymin', { g: '#5cb84a', w: '#f6f6ee', p: '#f878a8', e: '#3a9a58' },
    ['.p.g.g.g..', 'ppgggggg..', '.pwwwwwg..', 'gwewwwwewg', 'gwwwwwwwg.', '.wwwwwwww.', 'ggggggggg.', 'gwwwwwwwg.', '.ww....ww.']],
  ['leafeon', 'Leafeon', { b: '#f0e2b4', l: '#5aa848', y: '#d8cc88', e: '#6a3a20', f: '#a88258' },
    ['l....l....', 'yy..lyy...', '.yybbyy...', '.bbbbbb..l', '.bebbeb.ll', '.bbbbbb.l.', 'bbbbbbbbl.', 'bbbbbbbb..', '.ff..ff...']],
  ['glaceon', 'Glaceon', { b: '#9ad8f0', c: '#3a88c8', t: '#6ab8e0', e: '#2a5a98' },
    ['t........t', 'tt..cc..tt', '.ttbbbbtt.', '.bbbbbbbb.', 'cbebbbbebc', 'cbbbbbbbbc', '.bbbbbbbb.', 'bbbbbbbbtt', '.tt..tt...']],
  ['happiny', 'Happiny', { b: '#f8b4c4', h: '#f48ca8', w: '#f8f2f2', r: '#f87890', e: '#202028' },
    ['....h.....', '..hhhhh...', '.bbbbbbb..', 'bbebbbebb.', 'rbbbbbbbr.', '.bbbbbbb..', 'bbwwwwwbb.', '.bwwwwwb..', '..wwwww...', '.bb...bb..']],
  ['emolga', 'Emolga', { w: '#f8f8f8', k: '#3a3a48', y: '#f8d030', e: '#202028' },
    ['kk......kk', 'kyk....kyk', '.kkkkkkkk.', '.kwwwwwwk.', '.wewwwwew.', '.ywwwwwwy.', 'kkwwwwwwkk', 'yykwwwwkyy', '..wwwwww..', '..ww..ww..']],
  ['minccino', 'Minccino', { b: '#bab4ac', w: '#faf8f2', e: '#6a4030' },
    ['bb....bb..', 'bwb..bwb..', '.bbbbbb...', 'bbebbebb..', 'bbbbbbbb..', '.wwwwww.bb', '..bbbb.bbw', '.bbbbbbbw.', '.bb..bb...']],
  ['litwick', 'Litwick', { w: '#e8e6f2', p: '#8a58d8', q: '#c8a8f8', y: '#f8c830', k: '#4a4050' },
    ['....p.....', '...pqp....', '...pqp....', '....k.....', '.wwwwwww..', 'wwwwwwwww.', 'wywwwwyww.', 'wwwwwwwww.', '.wwwwwww..', '.ww...ww..']],
  ['axew', 'Axew', { b: '#a8bc78', r: '#d04838', k: '#4e5c42', e: '#c83030' },
    ['..bbbbbb..', '.bbbbbbbb.', 'bbebbbbebb', 'rbbbbbbbbr', 'rrbbbbbbrr', '.bbbbbbbb.', '..bbbbbb..', '..kkkkkk..', '.kk....kk.']],
  ['zorua', 'Zorua', { b: '#4a4a5a', k: '#2c2c38', r: '#c83848', e: '#58a8e0' },
    ['b.....rb..', 'rb...kkrb.', '.bbbbkbbb.', 'brebbbreb.', 'bbbbbbbbb.', '.bbbbbbb.k', 'bbbbbbbbkk', 'bbbbbbbbk.', '.bb..bb...']],
  ['cubchoo', 'Cubchoo', { w: '#f2f6fa', b: '#6a88c8', n: '#3a4a78', s: '#a8dcf8', f: '#9cc0e4', k: '#202028' },
    ['.b......b.', 'bbb....bbb', '.wwwwwwww.', 'wwkwwwwkww', 'wwwwnnwwww', '.wwwwswww.', '..wwwsww..', '.wwwwwwww.', '..wwwwww..', '.ff....ff.']],
];

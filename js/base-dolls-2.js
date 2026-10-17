/* base-dolls-2.js  -  fifteen more dolls, Gen 2 and 3 (2026-10-17). Each line of DOLLS_2 becomes a small and a big doll
   in js/base-furniture-kinds.js; its pattern goes into PLUSH and is sewn by js/base-plush3d.js. The extras here draw only
   through SEW, so the same stitches paint the picture and sew the plush. */
import { PLUSH, EXTRAS, SEW } from './base-dolls.js';

const { puff, shape, line, curveLine, dot, flat, sh } = SEW;

const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
// a + or a - as one flat patch, `r` its half-length
const sign = (x, y, r, c, plus) => {
  const t = r * 0.36;
  shape(plus
    ? [[x - t, y + r], [x + t, y + r], [x + t, y + t], [x + r, y + t], [x + r, y - t], [x + t, y - t], [x + t, y - r], [x - t, y - r], [x - t, y - t], [x - r, y - t], [x - r, y + t], [x - t, y + t]]
    : [[x - r, y + t], [x + r, y + t], [x + r, y - t], [x - r, y - t]], c, { curve: false });
};

// a zigzag band `w` thick through `pts`, as one flat patch (a piped cord costs twice the triangles)
const zig = (pts, w, c) => shape([...pts.map(([x, y]) => [x, y + w / 2]), ...pts.reverse().map(([x, y]) => [x, y - w / 2])], c, { curve: false });

Object.assign(EXTRAS, {
  // a jewel on the forehead (Espeon's, Sneasel's)
  d2gem: (d, L) => { const [x, y, , ry] = L.head, r = d.gemr || 4; flat(x, y + ry * 0.6, r, r * 0.85, d.gemc); },
  d2chestgem: (d, L) => { const [x, y] = L.body; flat(x, y - 3, 3.6, 3, d.gemc); },
  // Espeon's tail, split in two at the end
  d2forktail: (d, L) => { const [tx, ty] = L.tail; shape([[tx - 6, ty - 3], [tx + 14, ty + 4], [tx + 22, ty + 26], [tx + 32, ty + 46], [tx + 20, ty + 36], [tx + 15, ty + 50], [tx + 10, ty + 18], [tx - 4, ty + 6]], d.tailc || d.body); },
  // Umbreon's rings: one round each ear, one on the forehead, one round the tail
  d2earband: (d, L) => {
    const [ex, ey] = L.ear;
    for (const s of [-1, 1]) {
      const bx = ex * s, tip = [bx + Math.sin(0.5) * 34 * s, ey + Math.cos(0.5) * 34], p = [bx - 10, ey - 4], q = [bx + 10, ey - 4];
      const a0 = lerp(p, tip, 0.4), a1 = lerp(p, tip, 0.6), b0 = lerp(q, tip, 0.4), b1 = lerp(q, tip, 0.6);
      shape([[a0[0] - 1.2, a0[1]], [a1[0] - 1.2, a1[1]], [b1[0] + 1.2, b1[1]], [b0[0] + 1.2, b0[1]]], d.ring, { curve: false });
    }
  },
  d2ring: (d, L) => {
    const [x, y, , ry] = L.head, cy = y + ry * 0.58, pts = [];
    for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([x + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5]); }
    line(pts, d.ring, 2.2);
  },
  d2ringtail: (d, L) => {
    const [tx, ty] = L.tail;
    shape([[tx - 6, ty - 4], [tx + 12, ty + 2], [tx + 22, ty + 16], [tx + 28, ty + 40], [tx + 16, ty + 26], [tx + 6, ty + 12], [tx - 6, ty + 4]], d.tailc || d.body);
    puff(tx + 16, ty + 16, 8, 6, d.ring, -0.6);
  },
  // Hoppip's three leaves on a stalk
  d2hopleaves: (d, L) => {
    const [x, y, , ry] = L.head, top = y + ry;
    line([[x, top - 4], [x, top + 8]], sh(d.leafc, -1), 2.2);
    puff(x, top + 15, 5, 8, d.leafc);
    puff(x - 13, top + 10, 13, 6.5, d.leafc, 0.3);
    puff(x + 13, top + 10, 13, 6.5, d.leafc, -0.3);
  },
  // Natu's crest: three feathers standing up, red at the tips
  d2natucrest: (d, L) => {
    const [x, y, , ry] = L.head, b = y + ry - 6;
    for (const [a, h, lean] of [[-7, 18, -5], [0, 24, 0], [7, 18, 5]]) {
      shape([[x + a - 4, b], [x + a + lean - 1.5, b + h - 5], [x + a + lean, b + h], [x + a + lean + 1.5, b + h - 5], [x + a + 4, b]], d.crest, { curve: false });
      shape([[x + a + lean * 0.75 - 2.4, b + h - 6], [x + a + lean, b + h + 1], [x + a + lean * 0.75 + 2.4, b + h - 6]], d.crestTip, { curve: false });
    }
  },
  // a lower jaw jutting out, two fangs up from it (Snubbull, Bagon)
  d2underbite: (d, L) => {
    const [x, y] = L.head;
    puff(x, y - 15, 12, 7, d.jawc);
    for (const s of [-1, 1]) shape([[x + s * 7 - 2.4, y - 11], [x + s * 7, y - 5], [x + s * 7 + 2.4, y - 11]], '#ffffff', { curve: false });
    if (d.nosec) flat(x, y - 2, 4, 2.8, d.nosec);
  },
  // Sneasel's long red feather from one ear, and its tail feathers
  d2plume: (d, L) => {
    const [ex, ey] = L.ear, x = -ex - 3, y = ey + 4;
    shape([[x + 3, y - 4], [x - 4, y + 10], [x - 14, y + 26], [x - 9, y + 26], [x + 2, y + 12], [x + 7, y - 2]], d.plume);
  },
  d2feathertail: (d, L) => {
    const [tx, ty] = L.tail;
    for (const [dx, dy] of [[18, 22], [24, 12]]) shape([[tx - 4, ty - 3], [tx + dx * 0.5 + 1, ty + dy * 0.5 - 2.5], [tx + dx + 4, ty + dy + 2], [tx + dx * 0.5 - 2, ty + dy * 0.5 + 3.5], [tx - 4, ty + 4]], d.plume, { curve: false });
  },
  // Houndour's bone across the head and its arrow-tipped tail
  d2bonecap: (d, L) => { const [x, y, rx, ry] = L.head; curveLine([x - rx + 4, y + 8], [x, y + ry + 16], [x + rx - 4, y + 8], d.bone, 4.5); },
  d2arrowtail: (d, L) => {
    const [tx, ty] = L.tail, c = d.tailc || d.body;
    curveLine([tx - 4, ty], [tx + 22, ty + 2], [tx + 18, ty + 30], c, 3.5);
    shape([[tx + 18, ty + 40], [tx + 26, ty + 26], [tx + 18, ty + 29], [tx + 11, ty + 26]], c, { curve: false });
  },
  // Larvitar's horn, and the diamond in its belly
  d2spike: (d, L) => { const [x, y, , ry] = L.head; shape([[x - 6, y + ry - 6], [x - 1, y + ry + 13], [x + 1, y + ry + 13], [x + 6, y + ry - 6]], d.hornc || d.body, { curve: false }); },
  d2diamond: (d, L) => { const [x, y] = L.body; shape([[x, y + 9], [x + 7, y], [x, y - 9], [x - 7, y]], d.diamond, { curve: false }); },
  // Bagon's stony head plate with its ridges: a cap puffed over the head (a flat patch that big would cut into it)
  d2helm: (d, L) => {
    const [x, y, rx, ry] = L.head, c = d.helmc;
    puff(x, y + ry * 0.66, rx + 3, ry * 0.46, c);
    for (const a of [-12, 0, 12]) shape([[x + a - 4.5, y + ry - 1], [x + a, y + ry + (a ? 6 : 9)], [x + a + 4.5, y + ry - 1]], c, { curve: false });
  },

  // Ralts's green bob, cut straight above the eyes, and its two red horns
  d2bob: (d, L) => {
    const [x, y, rx, ry] = L.head, c = d.hairc;
    for (const s of [-1, 1]) puff(x + s * (rx - 1), y + 4, 8.5, 17, c, s * 0.12);
    puff(x, y + ry * 0.66, rx + 4, ry * 0.46, c);
  },

  d2horns: (d, L) => {
    const [x, y, , ry] = L.head;
    shape([[x - 13, y + ry - 4], [x - 9, y + ry + 18], [x - 3, y + ry - 2]], d.hornc);
    shape([[x + 6, y + ry - 4], [x + 13, y + ry + 12], [x + 15, y + ry - 6]], d.hornc);
  },
  // Plusle's and Minun's cheeks with their signs, and their sign-tipped tails
  d2signs: (d, L) => {
    const [hx] = L.head, [ex, ey] = L.eye;
    for (const s of [-1, 1]) { flat(hx + s * (ex + 10), ey - 9, 5.5, 4.4, d.signc); sign(hx + s * (ex + 10), ey - 9, 3, '#f8f0e0', d.plus); }
  },
  d2signtail: (d, L) => {
    const [tx, ty] = L.tail;
    line([[tx - 4, ty], [tx + 8, ty + 8], [tx + 12, ty + 18]], d.signc, 3);
    sign(tx + 14, ty + 28, 9, d.signc, d.plus);
  },
  // Zigzagoon's mask, nose and zigzags
  d2mask: (d, L) => { const [x] = L.head, [, ey] = L.eye; flat(x, ey + 1, 24, 6.5, d.stripe); },
  d2nose: (d, L) => { const [x, y] = L.head; flat(x, y - 6, 3.6, 2.6, '#202028'); },
  d2zigs: (d, L) => {
    const [x, y, , ry] = L.head, [bx, by] = L.body;
    zig([[x - 9, y + ry - 1], [x - 3, y + ry - 7], [x + 3, y + ry - 1], [x + 9, y + ry - 7]], 2.8, d.stripe);
    zig([[bx - 16, by - 2], [bx - 8, by - 9], [bx, by - 2], [bx + 8, by - 9], [bx + 16, by - 2]], 3.2, d.stripe);
  },
  // Absol's white forelock, its sickle horn and the little blade on the other side, and its sickle tail
  d2forelock: (d, L) => { const [x, y, rx, ry] = L.head; puff(x - 3, y + ry * 0.66, rx * 0.8, ry * 0.42, d.lockc, -0.15); },

  d2sickle: (d, L) => {
    const [x, y, rx, ry] = L.head, c = d.horn;
    shape([[x + rx * 0.45, y + ry * 0.6], [x + rx + 8, y + ry + 4], [x + rx + 16, y + ry + 22], [x + rx + 10, y + ry + 28], [x + rx + 6, y + ry + 12], [x + rx * 0.75, y + ry * 0.2]], c);
    shape([[x - rx * 0.7, y + ry * 0.55], [x - rx - 8, y + ry * 0.8], [x - rx * 0.85, y + ry * 0.25]], c, { curve: false });
  },
  d2scythetail: (d, L) => {
    const [tx, ty] = L.tail;
    shape([[tx - 6, ty - 3], [tx + 14, ty + 4], [tx + 26, ty + 22], [tx + 22, ty + 46], [tx + 14, ty + 26], [tx + 4, ty + 12], [tx - 6, ty + 5]], d.tailc);
  },
  // Jirachi's star of a head, a wish tag hung from each point, and the marks under its eyes
  d2star: (d, L) => {
    const [x, y, , ry] = L.head, b = y + ry, c = d.starc;
    puff(x, b - 7, 31, 13, c);
    for (const s of [-1, 1]) shape([[x + s * 20, b - 14], [x + s * 50, b + 2], [x + s * 18, b + 5]], c);
    shape([[x - 11, b], [x, b + 30], [x + 11, b]], c);
    for (const [tx, ty] of [[x - 43, b - 2], [x + 43, b - 2]]) shape([[tx - 3.5, ty], [tx + 3.5, ty], [tx + 3.5, ty - 12], [tx - 3.5, ty - 12]], d.tag, { curve: false });
    shape([[x - 3.5, b + 27], [x + 3.5, b + 27], [x + 3.5, b + 16], [x - 3.5, b + 16]], d.tag, { curve: false });
  },

  d2tears: (d, L) => { const [hx] = L.head, [ex, ey] = L.eye; for (const s of [-1, 1]) flat(hx + s * ex, ey - 11, 2.2, 3.4, d.tag); },
});

Object.assign(PLUSH, {
  espeon: { shape: 'quad', body: '#dcaee0', ears: 'long', earin: '#b47cc4', under: ['d2forktail'], top: ['d2gem'], gemc: '#e0304a', eye: '#7a2a8a', mouth: 'smile' },
  umbreon: { shape: 'quad', body: '#30343e', ears: 'long', under: ['d2ringtail'], top: ['d2earband', 'd2ring'], ring: '#f8d038', eye: '#e03030', mouth: 'smile' },
  hoppip: { shape: 'ball', body: '#f4a8c8', ears: 'side', top: ['d2hopleaves'], leafc: '#5cc040', eyes: 'big', mouth: 'smile', feet: '#e888ac' },
  natu: { shape: 'ball', body: '#5cb450', under: ['d2natucrest'], top: ['beak'], crest: '#4a9a40', crestTip: '#e84838', beakc: '#f8d030', eyes: 'white', mouth: 'none', arms: '#f0ead0', feet: '#f08838' },
  snubbull: { body: '#f4b0c8', ears: 'big', earin: '#c86098', top: ['d2underbite'], jawc: '#f8c8d8', nosec: '#a83868', tail: 'stub', mouth: 'none' },
  sneasel: { body: '#2c3448', ears: 'pointy', under: ['d2feathertail'], mid: ['d2chestgem'], top: ['d2plume', 'd2gem'], plume: '#e03838', gemc: '#f0c030', gemr: 3.4, eye: '#f0b020', eyes: 'slant', mouth: 'none' },
  houndour: { shape: 'quad', body: '#363640', belly: '#c85830', ears: 'pointy', under: ['d2arrowtail'], top: ['d2bonecap', 'muzzle'], bone: '#f0ece0', muz: '#c85830', eye: '#e03838', mouth: 'none' },
  larvitar: { body: '#98c070', mid: ['d2diamond'], diamond: '#4a6890', top: ['d2spike'], eye: '#c02828', mouth: 'open' },
  bagon: { body: '#5888d0', belly: '#f0e0a0', top: ['d2helm', 'd2underbite'], helmc: '#b4b4bc', jawc: '#f0e0a0', tail: 'stub', mouth: 'none' },
  ralts: { body: '#f8f8f8', feet: '#e8e8f0', top: ['d2horns', 'd2bob'], hairc: '#6cc45c', hornc: '#e8506a', eye: '#e04870', mouth: 'none' },
  plusle: { body: '#f8f0d0', ears: 'tall', earc: '#e84838', arms: '#e84838', under: ['d2signtail'], top: ['d2signs'], signc: '#e84838', plus: true, mouth: 'open' },
  minun: { body: '#f8f0d0', ears: 'tall', earc: '#4a88e0', arms: '#4a88e0', under: ['d2signtail'], top: ['d2signs'], signc: '#4a88e0', plus: false, mouth: 'smile' },
  zigzagoon: { shape: 'quad', body: '#e2d0a4', ears: 'cat', eartip: '#6a4a30', tail: 'fluffy', tailtip: '#6a4a30', mid: ['d2zigs'], top: ['d2mask', 'd2nose'], stripe: '#6a4a30', mouth: 'none' },
  absol: { shape: 'quad', body: '#f0f0f6', head: '#4a5070', feet: '#4a5070', under: ['d2scythetail'], top: ['d2sickle', 'd2forelock'], horn: '#3a4058', lockc: '#f0f0f6', tailc: '#4a5070', eye: '#d83048', eyes: 'slant', mouth: 'none' },
  jirachi: { shape: 'ball', body: '#f8f8ec', top: ['d2star', 'd2tears'], starc: '#f8d838', tag: '#6cb4e8', eyes: 'big', eye: '#283048', mouth: 'smile', feet: '#e8e8d8' },
});

export const DOLLS_2 = [
  ['espeon', 'Espeon', { b: '#dcaee0', s: '#b47cc4', r: '#e0304a', e: '#7a2a8a' },
    ['b........b', 'bs......sb', 'bbs....sbb', '.bbbrrbbb.', 'bbbbbbbbbb', 'bebbbbbbeb', 'bbbbbbbbbb', '.bbbbbbb.b', '.bbbbbbbbs', '.ss..ss...']],
  ['umbreon', 'Umbreon', { b: '#30343e', y: '#f8d038', r: '#e03030', s: '#22252e' },
    ['b........b', 'by......yb', 'bbb....bbb', '.bbbyybbb.', 'bbbbbbbbbb', 'brbbbbbrbb', 'bbbbbbbbbb', '.bbbbbbb.b', '.bbbbbbbyb', '.ss..ss...']],
  ['hoppip', 'Hoppip', { b: '#f4a8c8', s: '#e888ac', g: '#5cc040', e: '#202028' },
    ['gg.gg.gg..', '.gggggg...', '...bbb....', '.bbbbbbb..', 'bbebbbebb.', 'bbbbbbbbb.', '.bbbbbbb..', '..s...s...']],
  ['natu', 'Natu', { b: '#5cb450', r: '#e84838', w: '#ffffff', e: '#202028', y: '#f8d030', o: '#f08838' },
    ['...r.r....', '...brb....', '.bbbbbbb..', 'bwewbwewb.', 'bbbbyybbb.', 'bbbbybbbb.', '.bbbbbbb..', '..o...o...']],
  ['snubbull', 'Snubbull', { b: '#f4b0c8', s: '#c86098', e: '#202028', w: '#ffffff', n: '#a83868' },
    ['ss......ss', 'sbbbbbbbbs', 'bbebbbbebb', 'bbbbnnbbbb', 'bbwbbbbwbb', '.bbbbbbbb.', '.bbbbbbbb.', '..bbbbbb..', '.bb....bb.']],
  ['sneasel', 'Sneasel', { b: '#2c3448', r: '#e03838', y: '#f0c030', e: '#f0b020' },
    ['r.........', '.r......b.', 'rb.....bb.', '.bbbybbbb.', 'bbbbbbbbbb', 'bbebbbbebb', '.bbbbbbbb.', 'bbbbyybbbr', '.bbbbbbbr.', '.bb....bb.']],
  ['houndour', 'Houndour', { b: '#363640', w: '#f0ece0', o: '#c85830', e: '#e03838', k: '#202028' },
    ['b........b', 'bb......bb', '.bwwwwwwb.', 'bbbbbbbbbb', 'bebbbbbbeb', 'bbbookobbb', '.bboooobb.', '.bbbbbbb.b', '.bbbbbbbbb', '.ww..ww...']],
  ['larvitar', 'Larvitar', { b: '#98c070', s: '#78a050', e: '#c02828', d: '#4a6890' },
    ['....bb....', '...bbbb...', '.bbbbbbbb.', 'bbebbbbebb', 'bbbbbbbbbb', '.bbbbbbbb.', 'bbbbddbbbb', '.bbbddbbb.', '.ss....ss.']],
  ['bagon', 'Bagon', { b: '#5888d0', g: '#b4b4bc', w: '#f0e0a0', e: '#202028' },
    ['..g.gg.g..', '.gggggggg.', 'gggggggggg', 'bbebbbbebb', 'bbwwwwwwbb', '.bbwwwwbb.', 'bbbwwwwbbb', '.bbbbbbbb.', '.bb....bb.']],
  ['ralts', 'Ralts', { g: '#6cc45c', w: '#f8f8f8', r: '#e8506a', s: '#d8d8e0' },
    ['..r....r..', '..rggggr..', '.gggggggg.', 'gggggggggg', 'gwrwwwwrwg', 'g.wwwwww.g', '..wwwwww..', '.wwwwwwww.', '.wwwwwwww.', '..s....s..']],
  ['plusle', 'Plusle', { b: '#f8f0d0', r: '#e84838', e: '#202028' },
    ['r........r', 'rr......rr', '.bbbbbbbb.', 'bbebbbbebb', 'rbbbbbbbbr', '.bbbbbbbb.', 'rbbbbbbbbr', '.bbbbbbbbr', '.bb....bb.']],
  ['minun', 'Minun', { b: '#f8f0d0', u: '#4a88e0', e: '#202028' },
    ['u........u', 'uu......uu', '.bbbbbbbb.', 'bbebbbbebb', 'ubbbbbbbbu', '.bbbbbbbb.', 'ubbbbbbbbu', '.bbbbbbbbu', '.bb....bb.']],
  ['zigzagoon', 'Zigzagoon', { b: '#e2d0a4', n: '#6a4a30', k: '#202028' },
    ['n........n', 'bb......bb', 'bbbnbnbbbb', 'nknnnnnnkn', 'bbbbkkbbbb', '.bbbbbbb.n', 'bnbnbnbbnb', '.bbbbbbbbn', '.bb..bb...']],
  ['absol', 'Absol', { w: '#f0f0f6', d: '#4a5070', h: '#3a4058', r: '#d83048' },
    ['.........h', '........hh', 'h.wwwww.h.', 'hwwwwwwdh.', 'dddddddddd', 'drddddddrd', 'dddddddddd', '.wwwwwww.h', '.wwwwwwwhh', '.dd..dd...']],
  ['jirachi', 'Jirachi', { w: '#f8f8ec', y: '#f8d838', t: '#6cb4e8', e: '#283048', s: '#e8e8d8' },
    ['....y.....', '...yty....', 'y.yyyyy.y.', 'tyyyyyyyyt', 't.wwwww.t.', '.wewwwew..', '.wtwwwtw..', '..wwwww...', '..s...s...']],
];

/* base-furniture-trainer.js  -  the Trainer set (2026-10-16, the user's ask: rewards to show off for the Trainer's
   Journal's milestones): six pieces never sold, each earned by one Journal task (js/data/journal.js's
   JOURNAL_FURNITURE, js/data/furniture.js's `journal` source). Four of them fill in by themselves as you play (the
   user: "it's self tracked?"): the trophy case lights a trophy per milestone, the Gym Leader case shows each leader
   beaten (a silhouette till then, a gold frame once all are), the Sky Pillar model lights a band for every ten floors
   of your best climb, the Hall of Fame plaque counts your entries. Each one's `live()` says what it shows, so its
   picture is repainted when that changes (makePiece() in js/base-furniture.js). */

import { R, P, disc, oval, cyl, panel, wood, floorShadow, ctx, sh } from './base-paint.js';
import { getSave } from './storage.js';
import { GYM_LEADERS } from './data/gym.js';
import { trophies } from './data/journal.js';
import { LEADER_PICS } from './base-furniture-gym.js';

const OAK = '#6a4224', GOLD = '#e0b04a', GLASS = 'rgba(200,230,255,0.28)', INK = '#2a1a10';
const save = () => { try { return getSave(); } catch { return {}; } };
/* A friend's base (js/base-3d.js) shows their cases as they last saw them at home: their base's `liveSeen`, each
   kind's last live() string, by kind. Your save can't say what's in theirs, and their trainer page carries no trophies. */
let lent = null;
/** What each case shows instead of your save ({ kind: live() string }), or null for yours again. */
export const lendTrainerShows = (shows) => { lent = shows; };
const shown = (kind, ok) => { const v = lent?.[kind]; return typeof v === 'string' && ok.test(v) ? v : ''; };
const trophyList = () => {
  if (!lent) return trophies(save());
  const v = shown('trophycase', /^[01]{1,40}$/);
  return trophies({}).map((t, i) => ({ name: t.name, got: v[i] === '1' }));
};
const beaten = (i) => (lent ? shown('gymcase', /^[01]{1,40}$/)[i] === '1' : (save().gym?.[GYM_LEADERS[i].id] || 0) > 0);
const pillarLit = () => (lent ? Math.min(10, +shown('pillarmodel', /^\d{1,2}$/) || 0) : Math.min(10, Math.floor((save().tower?.bestEver || 0) / 10)));
const fameCount = () => (lent ? +shown('fameplaque', /^\d{1,4}$/) || 0 : (save().hallOfFame || []).length);

const words = (text, x, y, size, col, w) => {
  const g = ctx();
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y, w);
};

/** A trophy cup at (cx, b), gold if earned, a faint grey outline if not. */
function cup(cx, b, got) {
  const c = got ? GOLD : 'rgba(120,110,100,0.35)';
  R(cx - 4, b - 2, 8, 2, got ? sh(OAK, -1) : 'rgba(60,40,30,0.3)');
  R(cx - 1, b - 6, 2, 4, c);
  const g = ctx();
  g.fillStyle = c; g.beginPath(); g.moveTo(cx - 5, b - 13); g.lineTo(cx + 5, b - 13); g.lineTo(cx + 3, b - 7); g.lineTo(cx - 3, b - 7); g.closePath(); g.fill();
  g.strokeStyle = c; g.lineWidth = 1;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 5, b - 11, 2, s < 0 ? Math.PI / 2 : -Math.PI / 2, s < 0 ? Math.PI * 1.5 : Math.PI / 2, s > 0); g.stroke(); }
  if (got) P(cx - 3, b - 12, sh(GOLD, 2));
}

/** A leader's sprite in a frame at (x, y), w x h: in colour once beaten, a dark silhouette till then. */
function framed(l, x, y, w, h, beaten) {
  panel(x, y, w, h, beaten ? '#f8f0dc' : '#3a3440');
  const pic = LEADER_PICS[l.id];
  if (!pic) return;
  const g = ctx(), k = Math.min((w - 2) / pic.w, (h - 2) / pic.h), dw = pic.w * k, dh = pic.h * k;
  g.save();
  g.imageSmoothingEnabled = false;
  if (!beaten) g.filter = 'brightness(0) opacity(0.6)';
  g.drawImage(pic.bmp, pic.x, pic.y, pic.w, pic.h, x + (w - dw) / 2, y + h - 1 - dh, dw, dh);
  g.restore();
}

export const TRAINER_KINDS = [
  // a glass-fronted oak cabinet, three shelves of four trophies, each one lit as its milestone is reached
  { id: 'trophycase', name: 'Trophy case', group: 'Trainer', solo: true, w: 2, h: 1, price: 900, live: () => trophyList().map(t => +t.got).join(''),
    news: (was, now) => { const got = trophyList().filter((t, i) => now[i] === '1' && was[i] !== '1').map(t => t.name); return got.length ? `Your trophy case has ${got.length > 1 ? 'new trophies' : 'a new trophy'}: ${got.join(', ')}!` : ''; },
    draw(x, b, vw) {
      floorShadow(x, b, vw);
      const top = b - 86, list = trophyList();
      wood(x + 2, top, vw - 4, 86, OAK);
      R(x + 5, top + 5, vw - 10, 74, '#3a2416');
      list.forEach((t, i) => cup(x + 12 + (i % 4) * ((vw - 24) / 3), top + 28 + Math.floor(i / 4) * 24, t.got));
      for (let r = 1; r <= 3; r++) R(x + 5, top + 5 + r * 24 - 1, vw - 10, 2, sh(OAK, 1));
      R(x + 5, top + 5, vw - 10, 74, GLASS);
      R(x + 8, top + 7, 2, 70, 'rgba(255,255,255,0.25)');
      wood(x, b - 8, vw, 8, sh(OAK, -1));
      R(x + vw / 2 - 1, top + 6, 2, 72, sh(OAK, -1));
    } },
  // the Gym Leaders on the wall: thirteen framed photos, each one in colour once beaten, a gold frame when all are
  { id: 'gymcase', name: 'Gym Leader case', group: 'Trainer', solo: true, w: 2, h: 1, layer: 'wall', price: 900,
    live: () => GYM_LEADERS.map((l, i) => +beaten(i)).join(''),
    news: (was, now) => { const got = GYM_LEADERS.filter((l, i) => now[i] === '1' && was[i] !== '1').map(l => l.name); return got.length ? `${got.join(' and ')} joined your Gym Leader case!${now.includes('0') ? '' : ' Every frame is filled: it\'s turned gold!'}` : ''; },
    wall(x) {
      const all = GYM_LEADERS.every((l, i) => beaten(i)), W = 62, H = 64, X = x + 1, Y = 18;
      R(X + 1, Y + 1, W, H, 'rgba(0,0,0,0.25)');
      panel(X, Y, W, H, all ? GOLD : OAK);
      R(X + 3, Y + 3, W - 6, H - 6, '#2a1e2a');
      words('GYM LEADERS', X + W / 2, Y + 8, 5, all ? '#fff4c0' : '#e8d8b8', W - 8);
      GYM_LEADERS.forEach((l, i) => {
        const row = i < 7 ? 0 : 1, col = row ? i - 7 : i, n = row ? 6 : 7, cw = 7.6, gap = 0.6;
        const fx = X + W / 2 - (n * cw + (n - 1) * gap) / 2 + col * (cw + gap), fy = Y + 14 + row * 24;
        framed(l, fx, fy, cw, 20, beaten(i));
      });
      if (all) for (const [cx, cy] of [[X + 4, Y + 4], [X + W - 4, Y + 4]]) disc(cx, cy, 2, '#fff4c0');
    } },
  // a model of the Sky Pillar on a plinth: a band lit jade for every ten floors of your best climb, its crown at 100
  { id: 'pillarmodel', name: 'Sky Pillar model', group: 'Trainer', solo: true, w: 1, h: 1, price: 900, live: () => String(pillarLit()),
    news: (was, now) => (+now > +was ? `Your Sky Pillar model lit up to floor ${+now * 10}!${+now >= 10 ? ' Its crown is glowing!' : ''}` : ''),
    draw(x, b) {
      floorShadow(x + 4, b, 24);
      const lit = pillarLit();
      wood(x + 4, b - 8, 24, 8, sh(OAK, -1));
      for (let i = 0; i < 10; i++) {
        const y = b - 14 - i * 7, w = 16 - Math.floor(i / 3) * 2;
        cyl(x + 16 - w / 2, y, w, 6, '#9a9a8a');
        R(x + 16 - w / 2, y + 2, w, 2, i < lit ? '#58e0a8' : '#5a5a50');
      }
      disc(x + 16, b - 88, 3.5, lit >= 10 ? '#7affd0' : '#6a6a60');
      if (lit >= 10) disc(x + 16, b - 88, 6, 'rgba(120,255,200,0.3)');
    } },
  // a gold plaque: HALL OF FAME, a star, and how many times you've been entered
  { id: 'fameplaque', name: 'Hall of Fame plaque', group: 'Trainer', solo: true, w: 1, h: 1, layer: 'wall', price: 800, live: () => String(fameCount()),
    news: (was, now) => (+now > +was ? `Your Hall of Fame plaque reads ×${now} now!` : ''),
    wall(x) {
      const n = fameCount(), X = x + 3, Y = 22, W = 26, H = 34;
      R(X + 1, Y + 1, W, H, 'rgba(0,0,0,0.25)');
      panel(X, Y, W, H, OAK);
      panel(X + 2, Y + 2, W - 4, H - 4, GOLD);
      words('HALL OF', X + W / 2, Y + 8, 4, INK, W - 6);
      words('FAME', X + W / 2, Y + 13, 4.6, INK, W - 6);
      const g = ctx(); g.fillStyle = '#fff4c0';
      g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.4 : 5.2; g.lineTo(X + W / 2 + Math.cos(a) * r, Y + 21 + Math.sin(a) * r); } g.fill();
      words(`×${n}`, X + W / 2, Y + 29, 5, INK, W - 6);
    } },
  // a gold Pokédex open on a dark pedestal, for every page researched
  { id: 'goldpokedex', name: 'Gold Pokédex stand', group: 'Trainer', solo: true, w: 1, h: 1, price: 1200, draw(x, b) {
    floorShadow(x + 4, b, 24);
    cyl(x + 11, b - 30, 10, 30, '#2a2a34'); R(x + 8, b - 32, 16, 3, '#3a3a46');
    panel(x + 4, b - 50, 12, 18, GOLD); panel(x + 16, b - 50, 12, 18, sh(GOLD, -1));
    R(x + 6, b - 47, 8, 6, '#a8e0f0'); disc(x + 7, b - 48, 1.6, '#e84838');
    R(x + 18, b - 47, 8, 2, sh(GOLD, -2)); R(x + 18, b - 43, 6, 2, sh(GOLD, -2));
    P(x + 5, b - 49, sh(GOLD, 2));
  } },
  // the dojo's banner: red silk on a pole, a gold fist and the twenty stars of his trials
  { id: 'dojobanner', name: 'Dojo banner', group: 'Trainer', solo: true, w: 1, h: 1, layer: 'wall', price: 800, wall(x) {
    const X = x + 5, Y = 10, W = 22, H = 60, g = ctx();
    R(X - 2, Y - 2, W + 4, 3, '#2a1a10'); disc(X - 2, Y - 0.5, 2, GOLD); disc(X + W + 2, Y - 0.5, 2, GOLD);
    g.fillStyle = '#c8382a';
    g.beginPath(); g.moveTo(X, Y); g.lineTo(X + W, Y); g.lineTo(X + W, Y + H); g.lineTo(X + W / 2, Y + H - 7); g.lineTo(X, Y + H); g.closePath(); g.fill();
    R(X, Y, 2, H - 2, sh('#c8382a', -1));
    oval(X + W / 2, Y + 18, 6, 6, GOLD); R(X + W / 2 - 4, Y + 14, 8, 3, sh(GOLD, -1));
    for (let i = 0; i < 20; i++) P(X + 3 + (i % 5) * 4, Y + 30 + Math.floor(i / 5) * 5, '#ffe070');
  } },
];

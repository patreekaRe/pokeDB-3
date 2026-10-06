/* ============================================================
   towerprep.js  -  the Sky Pillar's lobby, between the title's Sky
   Pillar gem and a climb (js/data/tower.js, roadmap item 18): a screen
   of its own, the tower rising from the grass into space over the
   week's climber at its door, then your floors, three short rules,
   Climb (the week's starter; its first try counts for the leaderboard)
   or Practice with a starter of your own.
   ============================================================ */

import { towerWeekly, FLIGHT, TOP_FLOOR } from './data/tower.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { isStarterUnlocked } from './progress.js';
import { getSave } from './storage.js';
import { openLeaderboard, towerTop } from './leaderboard.js';
import { playSound } from './audio.js';
import { makeBuffer, flush, put, K, mix, bay, hash, skyHex } from './tower-art.js';
import { $, el, openDialog, closeDialog } from './ui.js';

let actions = {};

const RULES = [
  ['🗼', `${TOP_FLOOR} floors`],
  ['👹', `Guardian every ${FLIGHT}`],
  ['👑', 'Boss at the top'],
];

export function initTowerPrep(handlers) {
  actions = handlers;
  $('tower-go').addEventListener('click', () => { closeDialog('tower-dialog'); actions.onStart(null); });
  $('tower-board').addEventListener('click', () => openLeaderboard(0, 'tower'));
  $('tower-close').addEventListener('click', () => { playSound('cancel', 'confirm'); closeDialog('tower-dialog'); });
  $('tower-practice').addEventListener('click', () => {
    const picks = $('tower-picks');
    picks.hidden = !picks.hidden;
    $('tower-practice').classList.toggle('on', !picks.hidden);
    if (!picks.hidden) picks.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  $('tower-dialog').addEventListener('close', stopSky);
  new ResizeObserver(() => { if ($('tower-dialog').open) startSky(); }).observe($('tower-page'));
}

/** The lobby's plaque: the week's top climbers engraved in bronze, once the board answers (hidden if it can't). */
async function engrave() {
  const plaque = $('tower-plaque'), list = $('tower-plaque-list');
  plaque.hidden = true;
  const top = await towerTop(5);
  if (!top) return;
  plaque.hidden = false;
  if (!top.length) { list.replaceChildren(el('li', 'tower-plaque-note', 'No names yet. Be the first!')); return; }
  list.replaceChildren(...top.map((e, i) => {
    const li = el('li', `tower-plaque-row${e.mine ? ' mine' : ''}`);
    const img = el('img', 'pixel');
    const starter = STARTERS_BY_ID[e.starter];
    if (starter) { img.src = spriteUrl(starter, 'front', 0); img.alt = ''; }
    li.append(el('span', 'tower-plaque-rank', `${i + 1}`), img, el('span', 'tower-plaque-name', e.name), el('span', 'tower-plaque-floor', e.floor >= TOP_FLOOR ? `🏔️ ${e.turns}t` : `${e.floor}F`));
    li.title = `${e.name}: floor ${e.floor}, ${e.turns} turns`;
    return li;
  }));
}

const weekLabel = (week) => new Date(`${week}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

function stat(label, value) {
  const s = el('span', 'tower-stat');
  s.append(el('b', '', value), el('span', '', label));
  return s;
}

export function openTowerPrep() {
  const weekly = towerWeekly();
  const t = getSave().tower;
  const thisWeek = t.week === weekly.week;
  const first = !(thisWeek && t.tries);
  const name = weekly.starter.line[0].name;
  $('tower-week').textContent = `Week of ${weekLabel(weekly.week)}`;
  const mon = $('tower-mon');
  mon.src = spriteUrl(weekly.starter, 'front', 0);
  mon.alt = name;
  const line = $('tower-name');
  line.replaceChildren(el('strong', '', name), el('span', '', " is this week's climber"));
  $('tower-best').replaceChildren(stat('This week', first ? '-' : `${thisWeek ? t.best : 0}F`), stat('Best ever', `${t.bestEver || 0}F`));
  $('tower-rules').replaceChildren(...RULES.map(([icon, text]) => {
    const li = el('li', '');
    li.append(el('span', 'tower-rule-icon', icon), el('span', '', text));
    return li;
  }));
  $('tower-go').querySelector('.pxb-i').textContent = first ? '🏆 Climb' : '🔁 Climb again';
  $('tower-note').textContent = first ? 'Your first climb this week counts. No perks.' : 'Only your first climb this week counts.';
  // practice: any starter you own but Mewtwo (it would trivialise the climb)
  const picks = $('tower-picks');
  picks.hidden = true;
  $('tower-practice').classList.remove('on');
  picks.replaceChildren(...STARTERS.filter(s => !s.secret && isStarterUnlocked(s)).map(starter => {
    const btn = el('button', `tower-pick type-${starter.type}`);
    btn.type = 'button';
    btn.title = `Practice with ${starter.line[0].name}`;
    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front', 0);
    img.alt = starter.line[0].name;
    btn.append(img);
    btn.addEventListener('click', () => { closeDialog('tower-dialog'); actions.onStart(starter); });
    return btn;
  }));
  engrave();
  openDialog('tower-dialog');
  $('tower-dialog').scrollTop = 0;
  startSky();
}

/* ---------- the backdrop: the Sky Pillar from its foot to space, on one low-res canvas ---------- */

let sky = null;   // { b, base, mask, stars, clouds, ... } for the current size; its timer while open

function stopSky() {
  if (sky?.timer) clearInterval(sky.timer);
  if (sky) sky.timer = 0;
}

function startSky() {
  stopSky();
  const page = $('tower-page');
  const PX = innerWidth <= 720 ? 3 : 4;
  const top = page.getBoundingClientRect().top;
  const G = Math.round(($('tower-base').getBoundingClientRect().top - top + 8) / PX);   // the grass line, just over the climber's name
  page.style.setProperty('--ground', `${G * PX}px`);
  const W = Math.ceil(page.clientWidth / PX), H = Math.ceil(page.clientHeight / PX);
  const summit = Math.max(8, Math.round(($('tower-week').getBoundingClientRect().bottom - top + 40) / PX));
  const canvas = $('tower-sky');
  canvas.style.width = `${W * PX}px`;
  canvas.style.height = `${H * PX}px`;
  sky = build(makeBuffer(canvas, W, H), G, summit);
  let t = 0;
  paint(sky, t);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sky.timer = setInterval(() => paint(sky, ++t), 100);
}

/** Everything that stands still, painted once a size: the sky by height, the far hills, the tower, the grass and soil. */
function build(b, G, summitRow) {
  const { W, H, px } = b;
  const altAt = (y) => (G - y) / (G - summitRow) * 100;   // floor 0 at the grass, floor 100 at the summit
  const rowAt = (alt) => Math.round(G - alt / 100 * (G - summitRow));
  const mask = new Uint8Array(W * H);

  for (let y = 0; y < Math.min(G, H); y++) {
    const f = Math.max(0, altAt(y)) * 8, i = Math.floor(f), m = f - i;
    const c0 = K(skyHex(i / 8)), c1 = K(skyHex((i + 1) / 8));
    for (let x = 0; x < W; x++) px[y * W + x] = m > bay(x, y) ? c1 : c0;
  }
  // the cloud sea the sunset lights, below floor 27
  const sea = rowAt(27);
  const SEA = ['#ffd8b0', '#f8a888', '#c87890', '#7a4c78'].map(K);
  for (let x = 0; x < W; x++) {
    const top = sea - Math.round(2 + 2 * Math.sin(x * 0.31) + 1.5 * Math.sin(x * 0.11 + 2) + hash(x) * 1.2);
    for (let y = top; y < sea + 7; y++) {
      const k = y - top;
      if (k > 4 && bay(x, y) < (k - 4) / 4) continue;
      put(b, x, y, SEA[Math.min(3, k >> 1)]);
    }
  }
  // far hills and the treeline round the foot
  const HILL = ['#6a9ab0', '#5a889c'].map(K), TREE = ['#5ab048', '#3e9040', '#2a7034'].map(K);
  for (let x = 0; x < W; x++) {
    const hill = G - Math.round(9 + 4 * Math.sin(x * 0.07 + 1) + 2 * Math.sin(x * 0.19));
    for (let y = hill; y < G; y++) put(b, x, y, HILL[y - hill < 2 ? 0 : 1]);
    const tree = G - Math.round(3 + 2 * Math.abs(Math.sin(x * 0.45)) + hash(x + 7) * 2);
    for (let y = tree; y < G; y++) put(b, x, y, TREE[Math.min(2, y - tree)]);
  }

  // the tower
  const cx = Math.floor(W / 2), hw0 = Math.max(10, Math.min(Math.round(W * 0.13), Math.round((G - summitRow) * 0.16))), hw1 = Math.round(hw0 * 0.68);
  const half = (y) => Math.round(hw0 + (hw1 - hw0) * Math.max(0, Math.min(1, altAt(y) / 100)));
  const STONE = ['#d4c8b0', '#aca08a', '#8a8070', '#686054', '#5c5448'];   // lit, face, shade, dark, mortar
  const night = (h, y) => mix(h, '#1a2040', Math.max(0, Math.min(0.55, (altAt(y) - 30) / 90)));
  const stoneAt = (y) => STONE.map(h => K(night(h, y)));
  for (let y = summitRow; y < G; y++) {
    const hw = half(y), S = stoneAt(y), course = Math.floor((G - y) / 4);
    for (let x = cx - hw; x <= cx + hw; x++) {
      const u = (x - (cx - hw)) / (2 * hw);
      let c = u < 0.1 ? S[0] : u > 0.86 ? S[3] : u > 0.66 ? S[2] : S[1];
      if ((G - y) % 4 === 0 || (x + course * 3) % 7 === 0) c = u > 0.66 ? S[3] : S[4];
      put(b, x, y, c);
      mask[y * W + x] = 1;
    }
  }
  // a ledge every 10 floors, and a window between each pair: holes onto the sky at that height, a few lit
  for (let f = 10; f < 100; f += 10) {
    const y = rowAt(f), hw = half(y) + 2, S = stoneAt(y);
    for (let x = cx - hw; x <= cx + hw; x++) { put(b, x, y - 1, S[0]); put(b, x, y, S[1]); put(b, x, y + 1, S[3]); mask[(y - 1) * W + x] = mask[y * W + x] = 1; }
  }
  const LIT = K('#f8d070'), GLOW = K('#f8a840');
  for (let f = 5; f < 100; f += 10) {
    const y = rowAt(f), lit = hash(f) > 0.45;
    for (const ox of half(y) > 13 ? [-Math.round(half(y) / 2), 0, Math.round(half(y) / 2)] : [0]) {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dy === -2 && dx !== 0) continue;
        const x = cx + ox + dx, yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        px[yy * W + x] = lit && ox === 0 ? (dy > 0 ? GLOW : LIT) : K(skyHex(Math.max(0, altAt(yy))));
        mask[yy * W + x] = 2;
      }
    }
  }
  // the summit's roof, its tip where Rayquaza waits
  const ROOF = ['#7ab890', '#4e8a68', '#346048'].map(h => K(night(h, summitRow)));
  const roofH = Math.max(6, Math.round(hw1 * 0.7));
  for (let k = 0; k < roofH; k++) {
    const y = summitRow - roofH + k, hw = Math.round((hw1 + 2) * (k + 1) / roofH);
    for (let x = cx - hw; x <= cx + hw; x++) { put(b, x, y, x < cx - hw / 2 ? ROOF[0] : x > cx + hw / 3 ? ROOF[2] : ROOF[1]); mask[y * W + x] = 1; }
  }
  // the door at its foot, warm light inside
  const DOOR = K('#1a1410');
  for (let y = G - 12; y < G; y++) for (let x = cx - 4; x <= cx + 4; x++) {
    const top = G - 12 + (Math.abs(x - cx) >= 3 ? 2 : Math.abs(x - cx) >= 2 ? 1 : 0);
    if (y < top) continue;
    put(b, x, y, bay(x, y) < (y - (G - 12)) / 16 ? GLOW : DOOR);
  }

  // the grass, a flagstone path from the door, then dark soil under the lobby's buttons
  const GRASS = ['#78c858', '#5ab048', '#3e9040'].map(K), PATH = ['#b0a690', '#8a8274'].map(K);
  const SOIL0 = '#24301e', SOIL1 = '#0e140c';
  for (let y = G; y < H; y++) {
    const k = y - G, s0 = K(mix(SOIL0, SOIL1, Math.min(1, k / 60))), s1 = K(mix(SOIL0, SOIL1, Math.min(1, (k + 6) / 60)));
    for (let x = 0; x < W; x++) px[y * W + x] = k < 3 ? GRASS[k] : bay(x, y) < 0.5 ? s0 : s1;
    if (k < 4) {
      const pw = 5 + k;
      for (let x = cx - pw; x <= cx + pw; x++) if (!(k % 4 === 3 || (x + (k >> 2) * 3) % 6 === 0) || k < 1) put(b, x, y, PATH[k % 4 === 3 ? 1 : 0]);
    }
  }

  const stars = [];
  const starTop = rowAt(40);
  for (let i = 0; i < W * starTop / 45; i++) {
    const x = Math.floor(hash(i * 3.1) * W), y = Math.floor(hash(i * 7.7 + 1) * starTop);
    if (!mask[y * W + x]) stars.push([x, y, hash(i + 0.5) * 40 | 0, hash(i * 1.9) < 0.15]);
  }
  const clouds = Array.from({ length: Math.max(3, Math.round(W / 40)) }, (_, i) => ({
    x: hash(i * 5.3) * (W + 40), y: rowAt(9 + hash(i * 2.7) * 6), r: 5 + Math.round(hash(i * 9.1) * 5), v: 0.15 + hash(i) * 0.15,
  }));
  return { b, base: px.slice(), mask, stars, clouds, cx, tip: summitRow - roofH - 2, timer: 0 };
}

const CLOUD = ['#ffffff', '#e4ecf6', '#b8c8dc'].map(K);
const STAR = ['#ffffff', '#c8d8ff', '#6878a8'].map(K);
const RAY = ['#a0ffc8', '#40e0a0', '#209868'].map(K);

function paint(s, t) {
  const { b, base, mask, stars, clouds, cx, tip } = s, { W, px } = b;
  px.set(base);
  for (const [x, y, ph, big] of stars) {
    const tw = (t + ph) % 40;
    const c = tw < 3 ? STAR[0] : tw < 20 ? STAR[1] : STAR[2];
    put(b, x, y, c);
    if (big && tw < 6) { put(b, x - 1, y, STAR[2]); put(b, x + 1, y, STAR[2]); put(b, x, y - 1, STAR[2]); put(b, x, y + 1, STAR[2]); }
  }
  for (const c of clouds) {
    const cxx = ((c.x + t * c.v) % (W + 40)) - 20;
    for (let dy = -c.r; dy <= Math.ceil(c.r / 2); dy++) for (let dx = -c.r * 2; dx <= c.r * 2; dx++) {
      const d = (dx * dx) / 4 + dy * dy * (dy < 0 ? 1 : 3);
      if (d > c.r * c.r) continue;
      const x = Math.round(cxx + dx), y = c.y + dy;
      if (x < 0 || x >= W || y < 0 || mask[y * W + x]) continue;
      px[y * W + x] = dy < -c.r / 2 ? CLOUD[0] : dy < c.r / 4 ? CLOUD[1] : CLOUD[2];
    }
  }
  // Rayquaza's green glow breathing over the summit
  const k = 0.35 + 0.25 * Math.sin(t * 0.25);
  for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
    const d = Math.sqrt(dx * dx + dy * dy) / 9, x = cx + dx, y = tip + dy;
    if (d < 1 && y >= 0 && !mask[y * W + x] && bay(x, y) < (1 - d) * k) px[y * W + x] = RAY[d < 0.3 ? 0 : d < 0.6 ? 1 : 2];
  }
  put(b, cx, tip, RAY[0]);
  flush(b);
}

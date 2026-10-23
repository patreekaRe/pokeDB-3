/* ============================================================
   towerprep.js  -  the Sky Pillar's lobby, between the title's Sky
   Pillar gem and a climb (js/data/tower.js, roadmap item 18): the
   Pokédex device, like the map (the user's call, 2026-10-07): a window
   onto the tower rising from the grass into space over the week's
   climber at its door, an LCD with your floors, three short rules and
   the week's top climbers, then A to Climb (the week's starter; its
   first try counts for the leaderboard) or Practice with a starter of
   your own. The tower is painted smooth at full resolution.
   ============================================================ */

import { towerWeekly, FLIGHT, TOP_FLOOR } from './data/tower.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { isStarterUnlocked } from './progress.js';
import { getSave } from './storage.js';
import { timeLeft } from './missions.js';
import { cloudConfigured } from './cloud.js';
import { boardApp, towerTop } from './leaderboard.js';
import { bootDevice } from './device-boot.js';
import { playSound } from './audio.js';
import { hash, mix, skyHex } from './tower-art.js';
import { smoothIcon } from './smooth-icons.js';
import { layer, rgba, puff } from './smooth-paint.js';
import { segInto } from './statsdex.js';
import { $, el, openDialog, closeDialog } from './ui.js';

let actions = {};

const RULES = [
  ['tower', `${TOP_FLOOR} floors`],
  ['boss', `Guardian /${FLIGHT}`],
  ['fame', 'Boss on top'],
];

export function initTowerPrep(handlers) {
  actions = handlers;
  for (const node of document.querySelectorAll('#tower-dialog [data-icon]')) node.append(smoothIcon(node.dataset.icon));
  $('tower-go').addEventListener('click', () => { if (ranks) return; closeDialog('tower-dialog'); actions.onStart(null); });
  $('tower-board').addEventListener('click', () => (ranks ? back() : openRanks()));
  $('tower-close').addEventListener('click', back);
  const dialog = $('tower-dialog');
  dialog.addEventListener('cancel', (e) => { if (ranks) { e.preventDefault(); back(); } });   // Escape is B
  dialog.addEventListener('keydown', (e) => {
    if (ranks && ['ArrowLeft', 'ArrowRight'].includes(e.key) && RANKS.key(e)) e.preventDefault();
  });
  dialog.addEventListener('close', () => closeRanks(true));
  $('tower-practice').addEventListener('click', () => {
    if (ranks) closeRanks(true);
    const picks = $('tower-picks');
    picks.hidden = !picks.hidden;
    $('tower-practice').classList.toggle('on', !picks.hidden);
    if (!picks.hidden) picks.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  $('tower-dialog').addEventListener('close', stopSky);
  // the grass line is measured off the layout, so repaint whenever anything above or around it moves
  const relayout = new ResizeObserver(() => { if ($('tower-dialog').open && !ranks) startSky(); });
  relayout.observe($('tower-top'));
}

/* ---------- Ranks: the leaderboard as the device's app, sliding over the LCD as the Safari lobby's keys do ---------- */

const RANKS = boardApp('tower');
const SLIDE = { duration: 260, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let ranks = null;    // the open app's panel
let sliding = false;

function openRanks() {
  if (sliding) return;
  playSound('confirm');
  const panel = el('div', 'cdev-app sp-app cdev-dex sp-board-app');
  $('tower-glass').append(panel);
  RANKS.mount(panel);
  panel.scrollTop = 0;
  ranks = panel;
  dressKeys();
  if (calm()) return;
  sliding = true;
  $('tower-base').animate([{ translate: '0 0', opacity: 1 }, { translate: '-30% 0', opacity: 0 }], SLIDE);
  panel.animate([{ translate: '100% 0' }, { translate: '0 0' }], SLIDE).finished.catch(() => {}).then(() => { sliding = false; });
}

function closeRanks(now = false) {
  if (!ranks) return;
  const panel = ranks;
  ranks = null;
  dressKeys();
  const done = () => { RANKS.unmount(); panel.remove(); };
  if (now || calm() || !$('tower-dialog').open) { done(); return; }
  sliding = true;
  $('tower-base').animate([{ translate: '-30% 0', opacity: 0 }, { translate: '0 0', opacity: 1 }], SLIDE);
  panel.animate([{ translate: '0 0' }, { translate: '100% 0' }], { ...SLIDE, fill: 'forwards' }).finished.catch(() => {}).then(() => { done(); sliding = false; });
}

/** B: out of Ranks back to the lobby, then the lobby shuts. */
function back() {
  if (sliding) return;
  if (ranks) { if (RANKS.back()) return; playSound('cancel'); closeRanks(); return; }
  playSound('cancel', 'confirm');
  closeDialog('tower-dialog');
}

/** The window folds away under Ranks, its key is lit, the LCD names it and A has nothing to do. */
function dressKeys() {
  $('tower-page').classList.toggle('app-open', !!ranks);
  $('tower-board').classList.toggle('on', !!ranks);
  $('tower-board').setAttribute('aria-pressed', String(!!ranks));
  $('tower-title').textContent = ranks ? 'Ranks' : 'Sky Pillar';
  $('tower-week').hidden = !!ranks;
  $('tower-base').inert = !!ranks;
  $('tower-go').disabled = !!ranks;
}

const PLAQUE_ROWS = 5;
let engraved = false;  // the plaque already shows a board from an earlier open: keep it up while this one loads

/** The lobby's plaque: the week's top climbers engraved in bronze, faded in once the board answers. Its slot holds a
    full plaque's room from the start (measured once, with dummy rows), so nothing above it moves when it arrives. */
async function engrave() {
  const slot = $('tower-plaque-slot'), plaque = $('tower-plaque'), list = $('tower-plaque-list');
  slot.hidden = !cloudConfigured();
  if (slot.hidden) return;
  if (!slot.style.getPropertyValue('--plaque-h')) {
    list.replaceChildren(...Array.from({ length: PLAQUE_ROWS }, () => plaqueRow({ name: 'TRAINER', floor: 100, turns: 0, starter: '' }, 0)));
    slot.style.setProperty('--plaque-h', `${Math.ceil(plaque.getBoundingClientRect().height)}px`);
    list.replaceChildren();
  }
  if (!engraved) plaque.classList.remove('in');
  const top = await towerTop(PLAQUE_ROWS);
  if (!top) { plaque.classList.remove('in'); engraved = false; return; }
  engraved = true;
  plaque.classList.add('in');
  if (!top.length) { list.replaceChildren(el('li', 'tower-plaque-note', 'No names yet. Be the first!')); return; }
  // the rows still to be claimed stay engraved but empty, so a quiet week doesn't leave the plaque half bare
  list.replaceChildren(...top.map(plaqueRow), ...Array.from({ length: Math.max(0, PLAQUE_ROWS - top.length) }, (_, i) => emptyRow(top.length + i)));
}

function plaqueRow(e, i) {
  const li = el('li', `tower-plaque-row${e.mine ? ' mine' : ''}`);
  if (i < 3) li.dataset.rank = i + 1;
  const img = el('img', 'pixel');
  const starter = STARTERS_BY_ID[e.starter];
  if (starter) { img.src = spriteUrl(starter, 'front', 0); img.alt = ''; }
  li.append(el('span', 'tower-plaque-rank', `${i + 1}`), img, el('span', 'tower-plaque-name', e.name), el('span', 'tower-plaque-floor', e.floor >= TOP_FLOOR ? `🏔️ ${e.turns}t` : `${e.floor}F`));
  li.title = `${e.name}: floor ${e.floor}, ${e.turns} turns`;
  return li;
}

function emptyRow(i) {
  const li = el('li', 'tower-plaque-row empty');
  const img = el('img', 'pixel');
  img.alt = '';
  li.append(el('span', 'tower-plaque-rank', `${i + 1}`), img, el('span', 'tower-plaque-name', '---'), el('span', 'tower-plaque-floor', ''));
  return li;
}

const weekLabel = (week) => new Date(`${week}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** A readout on the LCD: an icon and label over the floor in seven-segment digits, like the Stats app's. */
function stat(label, value, icon) {
  const s = el('div', 'tower-stat');
  const head = el('span', 'tower-stat-label');
  head.append(smoothIcon(icon), el('span', '', label));
  const digits = el('span', 'sdx-seg');
  segInto(digits, value);
  digits.setAttribute('aria-label', value);
  s.append(head, digits);
  return s;
}

export function openTowerPrep() {
  const weekly = towerWeekly();
  const t = getSave().tower;
  const thisWeek = t.week === weekly.week;
  const first = !(thisWeek && t.tries);
  const name = weekly.starter.line[0].name;
  $('tower-week').textContent = `${weekLabel(weekly.week)} week · ${timeLeft('weekly')} left`;
  const mon = $('tower-mon');
  mon.src = spriteUrl(weekly.starter, 'front', 0);
  mon.alt = name;
  const line = $('tower-name');
  line.replaceChildren(el('strong', '', name), el('span', '', "This week's climber"));
  $('tower-best').replaceChildren(stat('This week', first ? '---' : `${thisWeek ? t.best : 0}F`, 'tower'), stat('Best ever', `${t.bestEver || 0}F`, 'star'));
  $('tower-rules').replaceChildren(...RULES.map(([icon, text]) => {
    const li = el('li', '');
    li.append(smoothIcon(icon), el('span', '', text));
    return li;
  }));
  $('tower-go-label').textContent = first ? 'Climb' : 'Again';
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
  closeRanks(true);
  openDialog('tower-dialog');
  engrave();
  $('tower-base').scrollTop = 0;
  const win = $('tower-top');
  win.classList.remove('power-on');
  startSky();
  bootDevice($('tower-page'), { below: $('tower-page').querySelector('.tdev-lid'), screen: win, onScreen: () => { void win.offsetWidth; win.classList.add('power-on'); } });
}

/* ---------- the backdrop: the Sky Pillar from its foot to space, painted smooth at the screen's resolution ---------- */

let sky = null;   // the current size's layers and its frame loop

function stopSky() {
  if (sky?.raf) cancelAnimationFrame(sky.raf);
  sky = null;
  $('tower-sky').width = $('tower-sky').height = 0;   // the lobby closed: its layers and canvas aren't held through the climb
}

function startSky() {
  stopSky();
  const page = $('tower-top'), canvas = $('tower-sky');
  const W = page.clientWidth, H = page.clientHeight;
  const G = H - Math.round(Math.max(14, H * 0.07));   // the grass line, a strip of lawn under the climber
  page.style.setProperty('--ground', `${G}px`);
  const summit = Math.round(Math.max(52, H * 0.2));   // room over the roof for the crown and its crystal
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  sky = build(W, H, G, summit, dpr);
  const ctx = canvas.getContext('2d');
  paint(ctx, sky, 0);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let last = 0;
  const tick = (now) => {
    sky.raf = requestAnimationFrame(tick);
    if (now - last < 33) return;   // ~30 fps is plenty for drifting clouds and twinkles
    last = now;
    paint(ctx, sky, now / 1000);
  };
  sky.raf = requestAnimationFrame(tick);
}

/** Everything that stands still, painted once a size: the back layer (sky, nebula, cloud sea) and the front one
    (hills, the pillar, its roof and door, the grass). Clouds, stars and Rayquaza's glow go between and over them. */
function build(W, H, G, S, dpr) {
  const altAt = (y) => (G - y) / (G - S) * 100;   // floor 0 at the grass, floor 100 at the summit
  const rowAt = (alt) => G - alt / 100 * (G - S);
  const [back, b] = layer(W, H, dpr);
  const [front, f] = layer(W, H, dpr);

  // the sky by height, the same colours the climb shows at each floor
  const sk = b.createLinearGradient(0, 0, 0, G);
  for (let y = 0; y <= G; y += Math.max(6, G / 40)) sk.addColorStop(Math.min(1, y / G), skyHex(Math.max(0, altAt(y))));
  sk.addColorStop(1, skyHex(0));
  b.fillStyle = sk;
  b.fillRect(0, 0, W, G + 2);
  // a faint nebula high up
  for (const [x, y, r, c] of [[W * 0.18, rowAt(88), W * 0.5, '#6a48c8'], [W * 0.86, rowAt(70), W * 0.45, '#2a8ab8'], [W * 0.6, rowAt(105), W * 0.35, '#c04898']]) {
    const g = b.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(c, 0.22));
    g.addColorStop(1, rgba(c, 0));
    b.fillStyle = g;
    b.fillRect(0, 0, W, G);
  }
  // the cloud sea the sunset lights, below floor 27
  const sea = rowAt(27);
  for (const [lift, tint, r] of [[16, ['#e8a0a8', '#7a4c78'], 22], [4, ['#ffe0b8', '#d88890'], 16]]) {
    for (let x = -r; x < W + r; x += r * 2.2) puff(b, x + hash(x + lift) * r, sea - lift + hash(x * 0.3) * 6, r * (0.8 + hash(x) * 0.5), tint);
  }
  const haze = b.createLinearGradient(0, sea - 10, 0, G);
  haze.addColorStop(0, rgba('#ffd8c0', 0));
  haze.addColorStop(1, rgba('#cfe6f4', 0.5));
  b.fillStyle = haze;
  b.fillRect(0, sea - 10, W, G - sea + 10);

  // far hills, soft and blue with distance, then the treeline round the foot
  const ridge = (ctx, amp, base, phase, colTop, colBot) => {
    const g = ctx.createLinearGradient(0, G - base - amp, 0, G);
    g.addColorStop(0, colTop);
    g.addColorStop(1, colBot);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, G + 1);
    for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, G - base - amp * (0.55 + 0.3 * Math.sin(x * 0.012 + phase) + 0.15 * Math.sin(x * 0.033 + phase * 2)));
    ctx.lineTo(W, G + 1);
    ctx.fill();
  };
  ridge(f, 34, 14, 1, '#8fb8d0', '#6a98b4');
  ridge(f, 22, 6, 4, '#6aa8a0', '#4e8a88');
  f.fillStyle = '#3f9a48';
  f.beginPath();
  for (let x = -10; x < W + 20; x += 11 + hash(x) * 6) {
    const r = 8 + hash(x * 1.7) * 8;
    f.moveTo(x + r, G);
    f.arc(x, G - r * 0.35, r, 0, Math.PI * 2);
  }
  f.fill();
  const shade = f.createLinearGradient(0, G - 20, 0, G);
  shade.addColorStop(0, rgba('#9ae070', 0.0));
  shade.addColorStop(1, rgba('#1e5a30', 0.6));
  f.fillStyle = shade;
  f.fillRect(0, G - 22, W, 22);

  // the pillar, as the Clearing's (js/hub-pillar.js, the user's ask 2026-10-15): four octagonal tiers of sage stone, each
  // narrower, under cornices with jade rune bands; a porch with Rayquaza's ring, banners, a crown of broken columns where
  // the crystal turns. Painted in its world units (TOP to the roof), seen face on: three faces of each octagon show.
  const cx = W / 2, TOP = 8.46, u = (G - S) / TOP;
  const Y = (h) => G - h * u;
  const SIL = 0.924, FRONT = 0.383;   // an octagon face on: its silhouette's and its front face's half-widths, per radius
  const FACES = [[-SIL, -FRONT, '#d6dac8'], [-FRONT, FRONT, '#b8bea9'], [FRONT, SIL, '#8a907c']];   // lit from the left
  const quad = (y0, y1, x0b, x1b, x0t, x1t) => {
    const p = new Path2D();
    p.moveTo(cx + x0b * u, Y(y0)); p.lineTo(cx + x1b * u, Y(y0)); p.lineTo(cx + x1t * u, Y(y1)); p.lineTo(cx + x0t * u, Y(y1)); p.closePath();
    return p;
  };
  const prism = (y0, y1, rb, rt, tint = '#ffffff', dark = 0) => {
    for (const [a, b, col] of FACES) {
      f.fillStyle = mix(mix(col, tint, 0.25), '#2a3028', dark);
      f.fill(quad(y0, y1, a * rb, b * rb, a * rt, b * rt));
    }
  };
  const night = (y0, y1, x) => {   // dusk deepening up the tower, the same as the sky behind it
    const d = f.createLinearGradient(0, Y(0), 0, Y(TOP));
    d.addColorStop(0, rgba('#1a2040', 0)); d.addColorStop(0.3, rgba('#1a2040', 0)); d.addColorStop(1, rgba('#1a2040', 0.45));
    f.fillStyle = d;
    f.fillRect(cx - x * u, Y(y1), x * 2 * u, Y(y0) - Y(y1));
  };
  const glows = [];
  const arch = (x, y, w, h) => {   // an arched opening, its foot at y
    const p = new Path2D();
    p.moveTo(x - w / 2, y); p.lineTo(x - w / 2, y - h + w / 2); p.arc(x, y - h + w / 2, w / 2, Math.PI, 0); p.lineTo(x + w / 2, y); p.closePath();
    return p;
  };

  // the plinth and the step to the door
  prism(0, 0.2, 1.62, 1.6, '#8a907c');
  prism(0.2, 0.38, 1.5, 1.44);
  f.fillStyle = '#c3c8b6'; f.fillRect(cx - 0.6 * u, Y(0.25), 1.2 * u, 0.25 * u);
  f.fillStyle = 'rgba(255, 255, 240, 0.4)'; f.fillRect(cx - 0.6 * u, Y(0.25), 1.2 * u, Math.max(1, 0.03 * u));

  const TIERS = [[0.38, 2.9, 1.25, 1.18, '#ffffff'], [3.06, 5.0, 1.06, 1.0, '#f4f6ee'], [5.16, 6.8, 0.92, 0.86, '#f0f4f2'], [6.96, 8.3, 0.8, 0.74, '#e6eef6']];
  const course = Math.max(3.5, u * 0.18);
  TIERS.forEach(([y0, y1, rb, rt, tint], tier) => {
    // a short collar of stone between this tier and the cornice under it
    if (tier) prism(y0 - 0.16, y0, rb + 0.04, rb + 0.04, '#9aa08c');
    FACES.forEach(([a, b, col], fi) => {
      const p = quad(y0, y1, a * rb, b * rb, a * rt, b * rt);
      f.save();
      f.clip(p);
      f.fillStyle = mix(col, tint, 0.25);
      f.fill(p);
      // weathered courses, each block a shade of its own
      const across = fi === 1 ? 3 : 2;
      for (let y = Y(y0), row = 0; y > Y(y1); y -= course, row++) {
        const k = (Y(y0) - y) / (Y(y0) - Y(y1)), r = rb + (rt - rb) * k;
        const xl = cx + a * r * u, xr = cx + b * r * u, bw = (xr - xl) / across;
        for (let j = -1; j < across + 1; j++) {
          const x = xl + (j + (row % 2 ? 0.5 : 0)) * bw, n = hash(tier * 97 + fi * 31 + row * 7 + j);
          f.fillStyle = n > 0.7 ? 'rgba(255, 255, 240, 0.14)' : n < 0.3 ? 'rgba(40, 46, 36, 0.14)' : 'rgba(0, 0, 0, 0)';
          f.fillRect(x, y - course, bw, course);
          f.fillStyle = 'rgba(40, 44, 34, 0.28)';
          f.fillRect(x, y - course, 0.8, course);
        }
        f.fillStyle = 'rgba(40, 44, 34, 0.3)'; f.fillRect(xl, y - 0.8, xr - xl, 0.8);
        f.fillStyle = 'rgba(255, 255, 240, 0.18)'; f.fillRect(xl, y - course + 0.6, xr - xl, 0.6);
      }
      // ivy and moss up the lowest tier
      if (!tier) {
        const mg = f.createLinearGradient(0, Y(0.38), 0, Y(1.4));
        mg.addColorStop(0, rgba('#4a7a34', 0.55)); mg.addColorStop(1, rgba('#4a7a34', 0));
        f.fillStyle = mg;
        f.fillRect(cx + a * rb * u, Y(1.4), (b - a) * rb * u, Y(0.38) - Y(1.4));
      }
      // an arched window lit jade in every face, a slit under it (the front of the first tier is the porch)
      if (!(tier === 0 && fi === 1)) {
        const mid = y0 + (y1 - y0) * 0.62, r = (rb + rt) / 2, x = cx + (a + b) / 2 * r * u, squeeze = fi === 1 ? 1 : 0.55;
        const w = 0.24 * u * squeeze, h = 0.56 * u, foot = Y(mid) + h / 2;
        const win = arch(x, foot, w, h);
        f.fillStyle = mix('#dadecf', col, 0.4);
        f.fill(arch(x, foot + 0.05 * u, w + 0.12 * u * squeeze, h + 0.1 * u));
        const wg = f.createLinearGradient(0, foot - h, 0, foot);
        wg.addColorStop(0, '#1a2430'); wg.addColorStop(0.45, '#2a8870'); wg.addColorStop(1, '#8af0d0');
        f.fillStyle = wg;
        f.fill(win);
        f.fillStyle = 'rgba(20, 30, 28, 0.7)';
        f.fillRect(x - 0.03 * u * squeeze, foot + 0.12 * u, 0.06 * u * squeeze, 0.28 * u);
        if (fi === 1) glows.push([x, foot - h * 0.4]);
      }
      f.restore();
    });
    night(y0, y1, rb + 0.1);
    // the rune band under the cornice, a gold line, the cornice and its lip
    const rr = rt + 0.03, by0 = y1 - 0.2, by1 = y1 - 0.04;
    f.fillStyle = '#3e4438';
    f.fill(quad(by0, by1, -SIL * rr, SIL * rr, -SIL * rr, SIL * rr));
    f.fillStyle = '#7ae0b8';
    const step = Math.max(4, 0.16 * u), gy = Y(by1) + (Y(by0) - Y(by1)) / 2;
    for (let x = cx - SIL * rr * u + step / 2, i = 0; x < cx + SIL * rr * u - 2; x += step, i++) {
      const s = (Y(by0) - Y(by1)) * 0.32, kind = Math.floor(hash(tier * 13 + i) * 3);
      f.beginPath();
      if (kind === 0) f.rect(x - 0.5, gy - s, 1, s * 2);
      else if (kind === 1) { f.moveTo(x, gy - s); f.lineTo(x + s * 0.7, gy); f.lineTo(x, gy + s); f.lineTo(x - s * 0.7, gy); }
      else f.arc(x, gy, s * 0.6, 0, Math.PI * 2);
      f.fill();
    }
    const cr = rt + 0.2;
    f.fillStyle = '#e8c058';
    f.fillRect(cx - SIL * (cr - 0.07) * u, Y(y1) - 0.5, SIL * (cr - 0.07) * 2 * u, Math.max(1, 0.03 * u));
    prism(y1, y1 + 0.1, cr - 0.08, cr, '#ffffff');
    prism(y1 + 0.1, y1 + 0.16, cr + 0.04, cr + 0.04, '#ffffff');
    f.fillStyle = 'rgba(255, 255, 240, 0.55)';
    f.fillRect(cx - SIL * (cr + 0.04) * u, Y(y1 + 0.16), SIL * (cr + 0.04) * 2 * u, 1);
    f.fillStyle = 'rgba(30, 36, 28, 0.35)';
    f.fillRect(cx - SIL * cr * u, Y(y1) , SIL * cr * 2 * u, 1);
  });

  // engaged columns at the first tier's corners, gold capitals, dark feet
  for (const sx of [-1, 1]) {
    const x = cx + sx * SIL * 1.23 * u, w = 0.17 * u;
    const cg = f.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    cg.addColorStop(0, sx < 0 ? '#f0f2e4' : '#c8ccbc'); cg.addColorStop(1, sx < 0 ? '#aab09c' : '#6e7464');
    f.fillStyle = cg;
    f.fillRect(x - w / 2, Y(2.9), w, (2.9 - 0.38) * u);
    f.fillStyle = '#e8c058'; f.fillRect(x - w * 0.7, Y(2.7), w * 1.4, 0.08 * u);
    f.fillStyle = '#8a907c'; f.fillRect(x - w * 0.75, Y(0.48), w * 1.5, 0.1 * u);
  }

  // the porch: the doorway glowing jade, pilasters, a pale arch with its keystone, Rayquaza's ring over it
  const doorW = 0.66 * u, doorH = 1.32 * u, sill = Y(0.38);
  const door = arch(cx, sill, doorW, doorH);
  const dg = f.createLinearGradient(0, sill - doorH, 0, sill);
  dg.addColorStop(0, '#081014'); dg.addColorStop(0.5, '#10222a'); dg.addColorStop(0.8, '#1c6a5a'); dg.addColorStop(1, '#4ac8a0');
  f.fillStyle = dg;
  f.fill(door);
  for (const sx of [-1, 1]) {
    const x = cx + sx * 0.42 * u;
    f.fillStyle = sx < 0 ? '#e4e8da' : '#b4baa6'; f.fillRect(x - 0.085 * u, Y(1.48), 0.17 * u, 1.1 * u);
    f.fillStyle = '#8a907c'; f.fillRect(x - 0.11 * u, Y(0.46), 0.22 * u, 0.08 * u);
    f.fillStyle = '#e8c058'; f.fillRect(x - 0.11 * u, Y(1.52), 0.22 * u, 0.06 * u);
  }
  const ag = f.createLinearGradient(cx - 0.5 * u, 0, cx + 0.5 * u, 0);
  ag.addColorStop(0, '#f0f2e4'); ag.addColorStop(1, '#a8ae9a');
  f.strokeStyle = ag;
  f.lineWidth = 0.18 * u;
  f.beginPath(); f.arc(cx, Y(1.48), 0.42 * u, Math.PI, 0); f.stroke();
  f.fillStyle = '#dadecf'; f.fillRect(cx - 0.08 * u, Y(2.04), 0.16 * u, 0.2 * u);
  f.fillStyle = '#e8c058'; f.fillRect(cx - 0.06 * u, Y(2.09), 0.12 * u, 0.05 * u);
  const ring = Y(2.36);
  f.fillStyle = '#e8c058'; f.beginPath(); f.arc(cx, ring, 0.29 * u, 0, Math.PI * 2); f.fill();
  f.fillStyle = '#f0f2e4'; f.beginPath(); f.arc(cx, ring, 0.25 * u, 0, Math.PI * 2); f.fill();
  const sg = f.createLinearGradient(cx - 0.2 * u, ring - 0.2 * u, cx + 0.2 * u, ring + 0.2 * u);
  sg.addColorStop(0, '#9af0c4'); sg.addColorStop(0.5, '#3aae7c'); sg.addColorStop(1, '#16603e');
  f.fillStyle = sg; f.beginPath(); f.arc(cx, ring, 0.2 * u, 0, Math.PI * 2); f.fill();
  const q = 0.25 * u / 8;   // the seal's serpent, as sealArt() draws it
  f.strokeStyle = '#f8e488'; f.lineWidth = Math.max(1, 1.2 * q); f.lineCap = 'round';
  f.beginPath(); f.moveTo(cx - 4 * q, ring - 3.8 * q); f.bezierCurveTo(cx + 5.5 * q, ring - 4.4 * q, cx - 5.5 * q, ring + 4.4 * q, cx + 4 * q, ring + 3.8 * q); f.stroke();
  f.lineCap = 'butt';
  glows.push([cx, ring]);

  // jade banners on the faces either side of the door, seen at an angle
  for (const sx of [-1, 1]) {
    const x = cx + sx * 0.778 * u, w = 0.29 * u, top = Y(2.64), bot = Y(1.14);
    const cloth = new Path2D();
    cloth.moveTo(x - w / 2, top); cloth.lineTo(x + w / 2, top); cloth.lineTo(x + w / 2, bot); cloth.lineTo(x, bot - 0.16 * u); cloth.lineTo(x - w / 2, bot); cloth.closePath();
    const bg = f.createLinearGradient(0, top, 0, bot);
    bg.addColorStop(0, sx < 0 ? '#2a9a66' : '#1c7a50'); bg.addColorStop(1, sx < 0 ? '#14583c' : '#0e4630');
    f.fillStyle = bg; f.fill(cloth);
    f.strokeStyle = '#e8c050'; f.lineWidth = Math.max(1, 0.03 * u); f.stroke(cloth);
    f.strokeStyle = '#f8e090'; f.beginPath(); f.arc(x, top + 0.3 * u, 0.08 * u, 0, Math.PI * 2); f.stroke();
    f.fillStyle = '#e8c058'; f.fillRect(x - w * 0.7, top - 0.03 * u, w * 1.4, Math.max(1.5, 0.05 * u));
  }

  // moss round the foot and fallen blocks
  for (const [mx, r, c] of [[-1.35, 0.24, '#5a8a3e'], [-1.6, 0.17, '#76a84c'], [1.42, 0.22, '#76a84c'], [1.15, 0.16, '#5a8a3e'], [0.62, 0.11, '#76a84c']]) {
    f.fillStyle = c;
    f.beginPath(); f.ellipse(cx + mx * u, G, r * u, r * u * 0.55, 0, Math.PI, 0); f.fill();
  }
  for (const [bx, a, s] of [[-1.75, 0.4, 1], [1.8, -0.3, 0.8]]) {
    f.save();
    f.translate(cx + bx * u, G - 0.1 * s * u);
    f.rotate(a);
    f.fillStyle = '#b4baa6'; f.fillRect(-0.18 * s * u, -0.12 * s * u, 0.36 * s * u, 0.24 * s * u);
    f.fillStyle = 'rgba(255, 255, 240, 0.35)'; f.fillRect(-0.18 * s * u, -0.12 * s * u, 0.36 * s * u, 1);
    f.restore();
  }

  // a collar of cloud round the 3rd tier, a thinner one round the 4th: the far half behind the tower, the near half over it
  for (const [n, y, r0, r1, s0, s1] of [[22, 5.35, 1.1, 1.7, 0.3, 0.54], [14, 7.55, 0.9, 1.3, 0.22, 0.38]]) {
    const ring = Array.from({ length: n }, (_, i) => ({ a: i / n * Math.PI * 2 + hash(y * 10 + i) * 0.3, i })).sort((p, q2) => Math.cos(p.a) - Math.cos(q2.a));
    for (const { a, i } of ring) {
      const r = r0 + hash(i * 3.3 + y) * (r1 - r0), s = (s0 + hash(i * 5.1 + y) * (s1 - s0)) * u * 0.6, near = Math.cos(a) >= 0, ctx = near ? f : b;
      ctx.save();
      ctx.translate(cx + Math.sin(a) * r * u, Y(y + (hash(i + y) - 0.5) * 0.45));
      ctx.scale(1, 0.7);
      puff(ctx, 0, 0, s, near ? ['#ffffff', '#cfdcee'] : ['#e4ecf8', '#a8b6cc'], near ? 0.95 : 0.85);
      ctx.restore();
    }
  }

  // the crown: a roof slab, broken columns round an altar (the far ones first), where the crystal turns (paint())
  const cols = Array.from({ length: 8 }, (_, i) => ({ a: i * Math.PI / 4, h: 0.25 + hash(i * 4.7 + 2) * 0.85 })).sort((p, q2) => Math.cos(p.a) - Math.cos(q2.a));
  const column = ({ a, h }) => {
    const x = cx + Math.sin(a) * 0.84 * u, w = 0.15 * u, near = Math.cos(a);
    f.fillStyle = mix('#dadecf', '#6e7464', near < 0 ? 0.45 : Math.max(0, Math.sin(a)) * 0.35);
    f.fillRect(x - w / 2, Y(TOP + 0.22 + h), w, h * u);
    if (h > 0.8) f.fillRect(x - w * 0.7, Y(TOP + 0.28 + h), w * 1.4, 0.06 * u);
  };
  prism(TOP, TOP + 0.22, 0.98, 0.94);
  for (const c of cols) if (Math.cos(c.a) < 0) column(c);
  prism(TOP + 0.22, TOP + 0.46, 0.56, 0.5, '#c3c8b6');
  for (const c of cols) if (Math.cos(c.a) >= 0) column(c);
  night(TOP, TOP + 1.2, 1.1);

  // the window and the ring glow jade
  f.save();
  f.globalCompositeOperation = 'lighter';
  for (const [x, y] of glows) {
    const R = Math.max(14, 0.9 * u);
    const g = f.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, 'rgba(110, 240, 190, 0.35)'); g.addColorStop(1, 'rgba(60, 200, 150, 0)');
    f.fillStyle = g;
    f.fillRect(x - R, y - R, R * 2, R * 2);
  }
  f.restore();
  const tip = Y(TOP + 0.85);
  const dw = doorW;

  // the grass, a path from the door, then the dark the lobby's cards sit on
  const gr = f.createLinearGradient(0, G, 0, H);
  gr.addColorStop(0, '#86d860');
  gr.addColorStop(Math.min(1, 14 / (H - G)), '#3c9848');
  gr.addColorStop(Math.min(1, 60 / (H - G)), '#173a2a');
  gr.addColorStop(Math.min(1, 220 / (H - G)), '#0c1622');
  gr.addColorStop(1, '#0a0f1c');
  f.fillStyle = gr;
  f.fillRect(0, G, W, H - G);
  const path = f.createLinearGradient(0, G, 0, G + 40);
  path.addColorStop(0, 'rgba(232, 222, 196, 0.85)'); path.addColorStop(1, 'rgba(232, 222, 196, 0)');
  f.fillStyle = path;
  f.beginPath(); f.moveTo(cx - dw / 2, G); f.lineTo(cx + dw / 2, G); f.lineTo(cx + dw * 1.6, G + 40); f.lineTo(cx - dw * 1.6, G + 40); f.closePath(); f.fill();
  f.save();
  f.globalCompositeOperation = 'lighter';
  const spill = f.createRadialGradient(cx, G, 0, cx, G, dw * 2.4);
  spill.addColorStop(0, 'rgba(110, 240, 190, 0.4)'); spill.addColorStop(1, 'rgba(60, 200, 150, 0)');
  f.fillStyle = spill;
  f.fillRect(cx - dw * 2.4, G - dw * 2.4, dw * 4.8, dw * 4.8);
  f.restore();

  const starBottom = rowAt(40);
  const stars = Array.from({ length: Math.round(W * starBottom / 1800) }, (_, i) => ({
    x: hash(i * 3.1) * W, y: hash(i * 7.7 + 1) * starBottom, r: 0.5 + hash(i * 1.3) * 1.1, ph: hash(i + 0.5) * 6.3, big: hash(i * 1.9) < 0.08,
  })).filter(st => Math.abs(st.x - cx) > 1.9 * u || st.y < tip - 0.9 * u);
  const clouds = Array.from({ length: Math.max(3, Math.round(W / 140)) }, (_, i) => ({
    x: hash(i * 5.3) * (W + 160), y: rowAt(8 + hash(i * 2.7) * 8), r: 12 + hash(i * 9.1) * 12, v: 4 + hash(i) * 5,
  }));
  const stones = Array.from({ length: 8 }, (_, i) => ({
    a: i / 8 * Math.PI * 2 + hash(i * 6.1) * 0.4, r: 1.6 + hash(i * 2.9) * 0.4, y: 3.25 + hash(i * 8.3) * 1.5, size: (0.08 + hash(i * 1.1) * 0.13) * 1.3,
    speed: 0.05 + hash(i * 3.7) * 0.05, bob: hash(i * 9.9) * 6, spin: hash(i * 4.4) - 0.5, shard: i % 3 === 0,
  }));
  const rad = (h) => (h < 3 ? 1.22 : h < 5.1 ? 1.03 : h < 6.9 ? 0.89 : 0.77);
  return { W, dpr, back, front, stars, clouds, cx, tip, u, Y, rad, stones };
}

function paint(ctx, s, t) {
  const { W, dpr, back, front, stars, clouds, cx, tip, u, Y, rad, stones } = s;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(back, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const st of stars) {
    const a = 0.45 + 0.55 * Math.max(0, Math.sin(t * 1.6 + st.ph));
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
    if (st.big) {
      const k = (3 + 4 * a) * st.r;
      ctx.fillStyle = `rgba(200, 220, 255, ${a * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y - k); ctx.quadraticCurveTo(st.x, st.y, st.x + k, st.y); ctx.quadraticCurveTo(st.x, st.y, st.x, st.y + k);
      ctx.quadraticCurveTo(st.x, st.y, st.x - k, st.y); ctx.quadraticCurveTo(st.x, st.y, st.x, st.y - k);
      ctx.fill();
    }
  }
  for (const c of clouds) puff(ctx, ((c.x + t * c.v) % (W + 160)) - 80, c.y, c.r, ['#ffffff', '#d8e4f2'], 0.92);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(front, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Rayquaza's wind spiralling up the tower, stones floating round its middle (the far side hidden behind it)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let w = 0; w < 2; w++) {
    let px = null, py = 0;
    for (let h = 0.5; h < 8.4; h += 0.08) {
      const a = h * 1.25 + w * Math.PI - t * 0.7, z = Math.cos(a), x = cx + Math.sin(a) * (rad(h) + 0.28) * u, y = Y(h);
      if (z > 0 && px !== null) {
        ctx.strokeStyle = `rgba(138, 248, 200, ${z * (0.5 + 0.5 * Math.sin(h * 2.2 - t * 3)) * 0.55})`;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      }
      px = x; py = y;
    }
  }
  ctx.restore();
  for (const st of stones) {
    const a = st.a + t * st.speed, z = Math.cos(a), h = st.y + Math.sin(t * 0.9 + st.bob) * 0.08;
    const x = cx + Math.sin(a) * st.r * u, y = Y(h), r = st.size * u * (0.85 + 0.15 * z);
    if (z < 0 && Math.abs(x - cx) < 0.924 * rad(h) * u + r) continue;
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, '#d2d6c4'); g.addColorStop(1, '#6e7464');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const q = k / 6 * Math.PI * 2 + st.spin * t, rr = r * (k % 2 ? 0.8 : 1);
      ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr * 0.75);
    }
    ctx.closePath();
    ctx.fill();
    if (st.shard) {
      ctx.fillStyle = '#8af0d0';
      ctx.beginPath(); ctx.moveTo(x, y - r * 1.7); ctx.lineTo(x + r * 0.35, y - r * 0.8); ctx.lineTo(x, y - r * 0.4); ctx.lineTo(x - r * 0.35, y - r * 0.8); ctx.closePath(); ctx.fill();
    }
  }
  // the jade crystal turning over the altar: the faces turned to us, lit from the left
  const cy = tip + Math.sin(t * 1.5) * 0.05 * u, cr = 0.28 * u, ch = 0.476 * u;
  const eq = [0, 1, 2, 3].map(k => { const a = t * 0.9 + k * Math.PI / 2; return { x: cx + Math.sin(a) * cr, z: Math.cos(a) }; });
  for (let k = 0; k < 4; k++) {
    const p = eq[k], q = eq[(k + 1) % 4];
    if (p.z + q.z <= 0) continue;
    const lit = Math.max(0, Math.min(1, 0.5 - ((p.x + q.x) / 2 - cx) / cr * 0.6));
    for (const [vy, shade] of [[cy - ch, 0], [cy + ch, 0.3]]) {
      ctx.fillStyle = mix('#c8fff0', '#1e8a64', Math.min(1, 1 - lit * 0.8 + shade));
      ctx.beginPath(); ctx.moveTo(cx, vy); ctx.lineTo(p.x, cy); ctx.lineTo(q.x, cy); ctx.closePath(); ctx.fill();
    }
  }
  // its green glow breathing, motes of it drifting up
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const k = 0.55 + 0.25 * Math.sin(t * 2.4), R = (1.5 + 0.4 * k) * u;
  const g = ctx.createRadialGradient(cx, tip, 0, cx, tip, R);
  g.addColorStop(0, `rgba(170, 255, 210, ${0.75 * k})`); g.addColorStop(0.35, `rgba(60, 230, 150, ${0.35 * k})`); g.addColorStop(1, 'rgba(30, 160, 100, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - R, tip - R, R * 2, R * 2);
  for (let i = 0; i < 7; i++) {
    const life = (t * 0.35 + i / 7) % 1;
    const x = cx + Math.sin(i * 2.1 + t * 0.8) * 14 * life, y = tip - life * 46;
    ctx.fillStyle = `rgba(190, 255, 220, ${(1 - life) * 0.9})`;
    ctx.beginPath(); ctx.arc(x, y, 1.6 * (1 - life) + 0.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

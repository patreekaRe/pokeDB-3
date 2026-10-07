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
import { cloudConfigured } from './cloud.js';
import { openLeaderboard, towerTop } from './leaderboard.js';
import { playSound } from './audio.js';
import { hash, mix, skyHex } from './tower-art.js';
import { smoothIcon } from './smooth-icons.js';
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
  // the grass line is measured off the layout, so repaint whenever anything above or around it moves
  const relayout = new ResizeObserver(() => { if ($('tower-dialog').open) startSky(); });
  relayout.observe($('tower-top'));
}

const PLAQUE_ROWS = 5;
let engraved = false;   // the plaque already shows a board from an earlier open: keep it up while this one loads

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
  list.replaceChildren(...top.map(plaqueRow));
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
  $('tower-week').textContent = `Week of ${weekLabel(weekly.week)}`;
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
  openDialog('tower-dialog');
  engrave();
  $('tower-base').scrollTop = 0;
  const win = $('tower-top');
  win.classList.remove('power-on');
  void win.offsetWidth;
  win.classList.add('power-on');
  startSky();
}

/* ---------- the backdrop: the Sky Pillar from its foot to space, painted smooth at the screen's resolution ---------- */

let sky = null;   // the current size's layers and its frame loop

function stopSky() {
  if (sky?.raf) cancelAnimationFrame(sky.raf);
  if (sky) sky.raf = 0;
}

function startSky() {
  stopSky();
  const page = $('tower-top'), canvas = $('tower-sky');
  const W = page.clientWidth, H = page.clientHeight;
  const G = H - Math.round(Math.max(14, H * 0.07));   // the grass line, a strip of lawn under the climber
  page.style.setProperty('--ground', `${G}px`);
  const summit = Math.round(Math.max(34, H * 0.14));
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

function layer(W, H, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  return [c, ctx];
}

const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;

/** A soft, rounded cloud: overlapping puffs lit from above. */
function puff(ctx, x, y, r, tint = ['#ffffff', '#dce6f4'], alpha = 1) {
  const g = ctx.createLinearGradient(0, y - r * 1.2, 0, y + r * 0.6);
  g.addColorStop(0, rgba(tint[0], alpha));
  g.addColorStop(1, rgba(tint[1], alpha));
  ctx.fillStyle = g;
  ctx.beginPath();
  for (const [dx, dy, k] of [[-1.5, 0.15, 0.6], [-0.7, -0.35, 0.85], [0.3, -0.55, 1], [1.2, -0.15, 0.75], [1.9, 0.2, 0.5]]) {
    ctx.moveTo(x + dx * r + k * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, k * r, 0, Math.PI * 2);
  }
  ctx.rect(x - 1.5 * r, y, 3.4 * r, 0.35 * r);
  ctx.fill();
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

  // the pillar: a tapering stone column, lit from the left, dusk deepening up its height
  const cx = W / 2;
  const hw0 = Math.max(30, Math.min(W * 0.13, (G - S) * 0.16)), hw1 = hw0 * 0.68;
  const half = (y) => hw0 + (hw1 - hw0) * Math.max(0, Math.min(1, altAt(y) / 100));
  const body = new Path2D();
  body.moveTo(cx - hw1, S); body.lineTo(cx + hw1, S); body.lineTo(cx + hw0, G); body.lineTo(cx - hw0, G); body.closePath();
  const stoneG = f.createLinearGradient(cx - hw0, 0, cx + hw0, 0);
  stoneG.addColorStop(0, '#efe6d2'); stoneG.addColorStop(0.18, '#cfc4ac'); stoneG.addColorStop(0.6, '#a49882'); stoneG.addColorStop(1, '#5e574c');
  f.save();
  f.clip(body);
  f.fillStyle = stoneG;
  f.fillRect(cx - hw0, S, hw0 * 2, G - S);
  // stone courses and joints, barely there
  f.lineWidth = 1;
  for (let y = G - 12, row = 0; y > S; y -= 12, row++) {
    const hw = half(y);
    f.strokeStyle = 'rgba(40, 32, 24, 0.16)';
    f.beginPath(); f.moveTo(cx - hw, y); f.lineTo(cx + hw, y); f.stroke();
    f.strokeStyle = 'rgba(40, 32, 24, 0.1)';
    f.beginPath();
    for (let x = cx - hw + (row % 2 ? 9 : 0); x < cx + hw; x += 18) { f.moveTo(x, y); f.lineTo(x, y - 12); }
    f.stroke();
  }
  const dusk = f.createLinearGradient(0, G, 0, S);
  dusk.addColorStop(0, rgba('#1a2040', 0));
  dusk.addColorStop(0.3, rgba('#1a2040', 0));
  dusk.addColorStop(1, rgba('#1a2040', 0.5));
  f.fillStyle = dusk;
  f.fillRect(cx - hw0, S, hw0 * 2, G - S);
  // the sunset's warm rim on its left edge, low down
  const rim = f.createLinearGradient(0, S, 0, G);
  rim.addColorStop(0, rgba('#ffd8a0', 0));
  rim.addColorStop(1, rgba('#ffd8a0', 0.5));
  f.strokeStyle = rim;
  f.lineWidth = 3;
  f.beginPath(); f.moveTo(cx - hw1 + 1, S); f.lineTo(cx - hw0 + 1, G); f.stroke();
  f.restore();

  // a ledge every 10 floors
  for (let fl = 10; fl < 100; fl += 10) {
    const y = rowAt(fl), hw = half(y) + 6;
    const lg = f.createLinearGradient(0, y - 4, 0, y + 5);
    lg.addColorStop(0, '#f4ecdc'); lg.addColorStop(0.45, '#bcb09a'); lg.addColorStop(1, '#6e6656');
    f.fillStyle = 'rgba(0, 0, 0, 0.22)';
    f.beginPath(); f.roundRect(cx - hw + 3, y + 3, hw * 2 - 6, 5, 3); f.fill();
    f.fillStyle = lg;
    f.beginPath(); f.roundRect(cx - hw, y - 4, hw * 2, 8, 3); f.fill();
    f.fillStyle = rgba('#1a2040', Math.max(0, Math.min(0.45, (fl - 30) / 140)));
    f.fill();
  }
  // windows between the ledges: arches onto the sky at that height, a few lit warm
  const glows = [];
  for (let fl = 5; fl < 100; fl += 10) {
    const y = rowAt(fl), hw = half(y), lit = hash(fl) > 0.45;
    for (const ox of hw > 40 ? [-hw / 2, 0, hw / 2] : [0]) {
      const x = cx + ox, w = 9, h = 15;
      const arch = new Path2D();
      arch.moveTo(x - w / 2, y + h / 2); arch.lineTo(x - w / 2, y - h / 2 + w / 2);
      arch.arc(x, y - h / 2 + w / 2, w / 2, Math.PI, 0); arch.lineTo(x + w / 2, y + h / 2); arch.closePath();
      if (lit && ox === 0) {
        const wg = f.createLinearGradient(0, y - h / 2, 0, y + h / 2);
        wg.addColorStop(0, '#fff2b0'); wg.addColorStop(1, '#ffa840');
        f.fillStyle = wg;
        glows.push([x, y]);
      } else f.fillStyle = mix(skyHex(Math.max(0, fl)), '#000000', 0.25);
      f.fill(arch);
      f.strokeStyle = 'rgba(30, 24, 18, 0.45)';
      f.lineWidth = 1.5;
      f.stroke(arch);
    }
  }
  f.save();
  f.globalCompositeOperation = 'lighter';
  for (const [x, y] of glows) {
    const g = f.createRadialGradient(x, y, 0, x, y, 26);
    g.addColorStop(0, 'rgba(255, 190, 90, 0.4)'); g.addColorStop(1, 'rgba(255, 160, 60, 0)');
    f.fillStyle = g;
    f.fillRect(x - 26, y - 26, 52, 52);
  }
  f.restore();

  // the summit's jade roof, its eaves curling up, a gold finial where Rayquaza waits
  const roofH = Math.max(16, hw1 * 0.75), eave = hw1 + 12;
  const roof = new Path2D();
  roof.moveTo(cx, S - roofH);
  roof.quadraticCurveTo(cx - hw1 * 0.35, S - roofH * 0.35, cx - eave, S - 5);
  roof.quadraticCurveTo(cx - eave + 2, S + 3, cx - eave + 8, S + 3);
  roof.lineTo(cx + eave - 8, S + 3);
  roof.quadraticCurveTo(cx + eave - 2, S + 3, cx + eave, S - 5);
  roof.quadraticCurveTo(cx + hw1 * 0.35, S - roofH * 0.35, cx, S - roofH);
  const rg = f.createLinearGradient(cx - eave, 0, cx + eave, 0);
  rg.addColorStop(0, '#9ee0b4'); rg.addColorStop(0.45, '#4e9a72'); rg.addColorStop(1, '#24543e');
  f.fillStyle = rg;
  f.fill(roof);
  f.strokeStyle = 'rgba(10, 30, 20, 0.5)';
  f.lineWidth = 1.5;
  f.stroke(roof);
  f.strokeStyle = 'rgba(220, 255, 230, 0.35)';
  f.beginPath(); f.moveTo(cx - 2, S - roofH + 4); f.quadraticCurveTo(cx - hw1 * 0.4, S - roofH * 0.3, cx - eave + 6, S - 2); f.stroke();
  const tip = S - roofH - 9;
  const fg = f.createLinearGradient(0, tip - 4, 0, S - roofH);
  fg.addColorStop(0, '#fff4b0'); fg.addColorStop(1, '#c88a20');
  f.fillStyle = fg;
  f.beginPath(); f.moveTo(cx, tip - 4); f.lineTo(cx + 3, S - roofH + 1); f.lineTo(cx - 3, S - roofH + 1); f.closePath(); f.fill();
  f.beginPath(); f.arc(cx, tip + 3, 3, 0, Math.PI * 2); f.fill();

  // the door at its foot, warm light spilling from inside
  const dw = Math.min(30, hw0 * 0.5), dh = dw * 1.5;
  const door = new Path2D();
  door.moveTo(cx - dw / 2, G); door.lineTo(cx - dw / 2, G - dh + dw / 2);
  door.arc(cx, G - dh + dw / 2, dw / 2, Math.PI, 0); door.lineTo(cx + dw / 2, G); door.closePath();
  f.lineWidth = 6;
  f.strokeStyle = '#8a8070';
  f.stroke(door);
  const dg = f.createLinearGradient(0, G - dh, 0, G);
  dg.addColorStop(0, '#2a1c14'); dg.addColorStop(0.55, '#8a4a1c'); dg.addColorStop(1, '#ffc860');
  f.fillStyle = dg;
  f.fill(door);

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
  spill.addColorStop(0, 'rgba(255, 200, 110, 0.45)'); spill.addColorStop(1, 'rgba(255, 170, 70, 0)');
  f.fillStyle = spill;
  f.fillRect(cx - dw * 2.4, G - dw * 2.4, dw * 4.8, dw * 4.8);
  f.restore();

  const starBottom = rowAt(40);
  const stars = Array.from({ length: Math.round(W * starBottom / 1800) }, (_, i) => ({
    x: hash(i * 3.1) * W, y: hash(i * 7.7 + 1) * starBottom, r: 0.5 + hash(i * 1.3) * 1.1, ph: hash(i + 0.5) * 6.3, big: hash(i * 1.9) < 0.08,
  })).filter(st => Math.abs(st.x - cx) > hw1 + 14 || st.y < tip - 16);
  const clouds = Array.from({ length: Math.max(3, Math.round(W / 140)) }, (_, i) => ({
    x: hash(i * 5.3) * (W + 160), y: rowAt(8 + hash(i * 2.7) * 8), r: 12 + hash(i * 9.1) * 12, v: 4 + hash(i) * 5,
  }));
  return { W, dpr, back, front, stars, clouds, cx, tip };
}

function paint(ctx, s, t) {
  const { W, dpr, back, front, stars, clouds, cx, tip } = s;
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
  // Rayquaza's green glow breathing over the summit, motes of it drifting up
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const k = 0.55 + 0.25 * Math.sin(t * 2.4), R = 46 + 10 * k;
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

/*
 * The evolution scene's comic intro (the user's ask, 2026-10-28; a playtest on its own branch first): before the
 * Gold/Silver morph, the white screen is cut into manga panels. Alone, a strip of the Pokémon's eyes whips in from the
 * left over a close-up of its face from the right; a duo splits the screen across a slanted gutter (the user's
 * call: across, not down), one partner's face sliding in on top from the left, the other's below from the right, each with a speech bubble. Halftone in the Pokémon's type colour,
 * focus lines, a "!!" stamped across the page; a tap on the text slashes the panels away onto the morph.
 * Faces are found from SPRITE_FIT's pose box: the head sits in about the top third of it, centred on BODY_X.
 * Under calmFx() the panels fade in and out, with no lines jittering, shake or slash.
 */
import { sleep } from './ui.js';
import { playCry, playSound } from './audio.js';
import { spriteUrl } from './data/starters.js';
import { spriteFit, bodyX } from './data/sprite-fit.js';
import { TYPE_COLOR } from './type-badge.js';

const CRY_WAIT_MAX = 1200;

/* Each panel as a polygon of the page (fractions), and where in it the face's centre sits, how far up the body that
   point is (0 its top), and how much bigger than a face the zoom is. `room` is the panel's size for the zoom. */
const SOLO = [
  { from: 'right', poly: [[0, 0.335], [1, 0.255], [1, 1], [0, 1]], at: [0.5, 0.56], up: 0.32, zoom: 1, room: [1, 0.72] },
  { from: 'left', poly: [[0, 0], [1, 0], [1, 0.22], [0, 0.3]], at: [0.5, 0.135], up: 0.24, zoom: 1.9, room: [1, 0.72] },
];
const DUO = [
  { from: 'left', poly: [[0, 0], [1, 0], [1, 0.44], [0, 0.52]], at: [0.62, 0.25], up: 0.32, zoom: 1, room: [1, 0.48], flip: true },
  { from: 'right', poly: [[0, 0.555], [1, 0.475], [1, 1], [0, 1]], at: [0.38, 0.7], up: 0.32, zoom: 1, room: [1, 0.48] },
];
const SOLO_SAY = ['What\'s... happening?!'];
const DUO_SAY = ['Wha-?! What\'s this?!', 'We\'re... evolving?!'];

/**
 * Slam the panels in over `scene` for `cast` (one or two [starter, stage]) and resolve once they're all in, with the
 * cut: a function that slashes them away and resolves at the white flash's peak (the morph shows under it).
 */
export async function comicIntro(scene, cast, { still, flash }) {
  const duo = cast.length > 1;
  const page = el('div', `evc${duo ? ' duo' : ''}${still ? ' still' : ''}`);
  scene.insertBefore(page, scene.querySelector('.evo-flash'));
  const shots = (duo ? DUO : SOLO).map((shape, i) => {
    const [starter, stage] = cast[duo ? i : 0];
    return panel(page, shape, starter, stage, i, duo);
  });
  await Promise.all(shots.map(s => loaded(s.img)));
  const place = () => shots.forEach(s => s.place());
  place();
  addEventListener('resize', place);

  const timers = [];
  const slam = async (shot) => {
    shot.box.classList.add('in');
    if (!still) playSound('swoosh');
    shot.lines(!still);
    if (!still) timers.push(setTimeout(() => shake(page), 300));
  };
  if (duo) {
    slam(shots[0]);
    await sleep(320);
    await Promise.race([playCry(cast[0][0].line[cast[0][1]].id), sleep(CRY_WAIT_MAX)]);
    shots[0].say(DUO_SAY[0]);
    slam(shots[1]);
    await sleep(320);
    await Promise.race([playCry(cast[1][0].line[cast[1][1]].id), sleep(CRY_WAIT_MAX)]);
    shots[1].say(DUO_SAY[1]);
    await sleep(350);
    stamp(page, '!!', cast.map(([s]) => s.type));
  } else {
    slam(shots[0]);
    await sleep(330);
    playCry(cast[0][0].line[cast[0][1]].id);
    await sleep(250);
    slam(shots[1]);
    await sleep(420);
    shots[0].say(SOLO_SAY[0]);
    await sleep(300);
    stamp(page, '!?', [cast[0][0].type]);
  }
  await sleep(still ? 200 : 450);

  return async function cut() {
    timers.forEach(clearTimeout);
    if (still) {
      page.classList.add('gone');
      await sleep(350);
    } else {
      playSound('swoosh');
      page.classList.add('slash');
      await sleep(260);
      flash();
      await sleep(120);
    }
    shots.forEach(s => s.lines(false));
    removeEventListener('resize', place);
    page.remove();
  };
}

/** One panel, clipped to its polygon: the halftone tone, focus lines on a 1x canvas, the zoomed face, and its black frame
    (an SVG outline whose outer half the clip cuts away, a filter's outline being too heavy for a phone's GPU). */
function panel(page, shape, starter, stage, i, duo) {
  const box = el('div', `evc-panel from-${shape.from}`);
  box.style.setProperty('--tone', TYPE_COLOR[starter.type] ?? TYPE_COLOR.normal);
  box.style.setProperty('--at', `${shape.at[0] * 100}% ${shape.at[1] * 100}%`);
  box.style.clipPath = `polygon(${shape.poly.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(', ')})`;
  const canvas = document.createElement('canvas');
  canvas.className = 'evc-lines';
  const face = el('div', `evc-face${shape.flip ? ' flip' : ''}`);
  const img = new Image();
  img.className = 'pixel';
  img.alt = '';
  img.src = spriteUrl(starter, 'front', stage);
  face.append(img);
  const frame = document.createElementNS(SVG, 'svg');
  frame.setAttribute('class', 'evc-frame');
  frame.setAttribute('viewBox', '0 0 1 1');
  frame.setAttribute('preserveAspectRatio', 'none');
  const outline = document.createElementNS(SVG, 'polygon');
  outline.setAttribute('points', shape.poly.map(p => p.join(',')).join(' '));
  frame.append(outline);
  box.append(canvas, face, frame);
  page.append(box);

  let jitter = null;
  const draw = () => focusLines(canvas, shape);
  return {
    box, img,
    place() {
      const { width: w, height: h } = page.getBoundingClientRect();
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      draw();
      const [top, bottom, left, right] = spriteFit(img.src);
      const bw = Math.max(8, img.naturalWidth - left - right), bh = Math.max(8, img.naturalHeight - top - bottom);
      const [rw, rh] = [shape.room[0] * w, shape.room[1] * h];
      const s = Math.max(2, Math.min(rh * 1.25 / bh, rw * 2.2 / bw)) * shape.zoom;
      const fx = left + bw / 2 + bodyX(img.src), fy = top + bh * shape.up;
      face.style.left = `${shape.at[0] * w}px`;
      face.style.top = `${shape.at[1] * h}px`;
      img.style.width = `${img.naturalWidth * s}px`;
      img.style.height = `${img.naturalHeight * s}px`;
      img.style.translate = `${-fx * s}px ${-fy * s}px`;
    },
    lines(on) {
      clearInterval(jitter);
      jitter = on ? setInterval(draw, 110) : null;
    },
    say(text) {
      page.append(el('div', `evc-bubble b${i}${duo ? ' duo' : ''}`, text));
    },
  };
}
const SVG = 'http://www.w3.org/2000/svg';

/** Manga focus lines: thin black wedges from the panel's edge toward the face, leaving an oval clear round it. */
function focusLines(canvas, shape) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = shape.at[0] * w, cy = shape.at[1] * h;
  const far = Math.hypot(w, h);
  const clear = Math.min(shape.room[0] * w, shape.room[1] * h) * (shape.zoom > 1 ? 0.6 : 0.42);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  for (let a = 0; a < Math.PI * 2; a += 0.05 + Math.random() * 0.07) {
    const spread = 0.004 + Math.random() * 0.012;
    const near = clear * (1 + Math.random() * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * near, cy + Math.sin(a) * near * 0.8);
    ctx.lineTo(cx + Math.cos(a - spread) * far, cy + Math.sin(a - spread) * far);
    ctx.lineTo(cx + Math.cos(a + spread) * far, cy + Math.sin(a + spread) * far);
    ctx.fill();
  }
}

/** The big sound effect stamped across the page, each mark in a partner's colour. */
function stamp(page, text, types) {
  const s = el('div', 'evc-sfx');
  [...text].forEach((mark, i) => {
    const m = el('span', '', mark);
    m.style.color = TYPE_COLOR[types[i % types.length]] ?? '#ffd84a';
    s.append(m);
  });
  page.append(s);
  if (!page.classList.contains('still')) shake(page);
}

function shake(page) {
  page.classList.remove('shake');
  void page.offsetWidth;
  page.classList.add('shake');
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
}

const loaded = (img) => img.complete && img.naturalWidth ? null
  : new Promise(resolve => { img.onload = img.onerror = resolve; });

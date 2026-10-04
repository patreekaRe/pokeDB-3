/*
 * The evolution scene, after Gold/Silver's: once a boss faints the screen washes to white, the Pokémon fades in alone
 * and cries, "What? X is evolving!" waits for a tap, then the evolution song plays while it flashes white and its dark
 * silhouette switches between the old and new forms, faster and faster, until a flash colours the new form in with its
 * cry (a tap during the song skips straight there). The chime and "Congratulations!" follow, and the next tap fades the white out onto whatever was set up under it.
 * Cosmetic only: run.js has already changed the stage, HP and deck. Under reduced motion the cries, song and chime stay,
 * but nothing flashes or wipes.
 */
import { $, sleep } from './ui.js';
import { playMusic, playCry, playSound, preloadMusic, preloadSounds, preloadCries } from './audio.js';
import { sayLines } from './rewards.js';
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const CRY_WAIT_MAX = 1500;   // a long cry mustn't hold the scene up
const STILL_SONG_MS = 5500;  // under reduced motion the song plays about as long as the flashing would

/** Start downloading the song, the chime, both cries and the new form's sprites (a legendary's aura GIFs run to ~650 KB),
    so neither the scene nor the next battle waits on them. Called as the boss fight starts. */
export function preloadEvolution(starter, stage) {
  if (!starter.line[stage + 1]) return;
  preloadMusic('evolution');
  preloadSounds('evolved');
  preloadCries(starter.line[stage].id, starter.line[stage + 1].id);
  for (const kind of ['front', 'back']) new Image().src = spriteUrl(starter, kind, stage + 1);
}

/**
 * Play the scene for `starter` evolving out of `from`. `after` are lines said after "Congratulations!". Resolves on
 * the last tap with the screen still white, with a function that fades the white away (set the next screen up first).
 */
export async function evolutionScene(starter, from, after = []) {
  const to = from + 1;
  const scene = $('evolve-scene');
  const mon = $('evolve-mon');
  const [oldImg, newImg] = [$('evolve-from'), $('evolve-to')];
  const fromName = stageName(starter, from), toName = stageName(starter, to);
  preloadEvolution(starter, from);

  oldImg.src = spriteUrl(starter, 'front', from);
  newImg.src = spriteUrl(starter, 'front', to);
  oldImg.alt = fromName;
  newImg.alt = toName;
  newImg.style.visibility = 'hidden';
  oldImg.style.visibility = '';
  mon.className = 'evo-mon';
  $('evolve-log').hidden = true;

  playMusic(null);   // the victory fanfare fades out under the white
  scene.classList.remove('out', 'shown');
  scene.classList.toggle('still', still());
  scene.hidden = false;
  await Promise.all([loaded(oldImg), loaded(newImg), sleep(still() ? 400 : 900)]);
  const refit = () => fit(starter, [oldImg, from], [newImg, to]);
  refit();
  addEventListener('resize', refit);

  mon.classList.add('shown');
  await sleep(600);
  await Promise.race([playCry(starter.line[from].id), sleep(CRY_WAIT_MAX)]);
  await say([`What? ${fromName} is evolving!`]);

  playMusic('evolution', { restart: true, cut: true });
  const skip = skipper(scene);
  if (still()) await skip.wait(STILL_SONG_MS);
  else await morph(mon, oldImg, newImg, skip);
  skip.off();
  if (skip.done && !still()) await whiteFlash();

  playMusic(null, { cut: true });
  oldImg.style.visibility = 'hidden';
  newImg.style.visibility = '';
  mon.classList.remove('dark', 'white');
  const cry = playCry(starter.line[to].id);
  await Promise.race([cry, sleep(CRY_WAIT_MAX)]);
  playSound('evolved');
  await say([`Congratulations! Your ${fromName} evolved into ${toName}!`, ...after]);

  return async () => {
    scene.classList.add('out');
    await sleep(600);
    removeEventListener('resize', refit);
    scene.hidden = true;
    scene.classList.remove('out');
    mon.className = 'evo-mon';
  };
}

const say = (lines) => sceneSay('evolve-scene', 'evolve-log', lines);

/** Type the lines into a full-screen scene's text box; resolves once the last one is tapped away (a tap anywhere on the
    scene or Enter advances it, except on its `.scene-keep` parts, like the Hall of Fame's scrolling deck). */
export function sceneSay(sceneId, logId, lines) {
  const scene = $(sceneId), box = $(logId);
  return new Promise(resolve => {
    const onKey = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      box.click();
    };
    const onTap = (e) => { if (!box.contains(e.target) && !e.target.closest('.scene-keep')) box.click(); };
    scene.classList.add('waiting');
    scene.addEventListener('click', onTap);
    document.addEventListener('keydown', onKey);
    sayLines(lines, logId, () => {
      scene.classList.remove('waiting');
      scene.removeEventListener('click', onTap);
      document.removeEventListener('keydown', onKey);
      resolve();
    });
  });
}

/** It flashes white three times and goes dark, then the silhouette switches forms faster and faster, flashing at the end. */
async function morph(mon, oldImg, newImg, skip) {
  const wait = skip.wait;
  for (let i = 0; i < 3; i++) {
    mon.classList.add('white');
    if (await wait(170)) return;
    mon.classList.remove('white');
    if (await wait(210)) return;
  }
  mon.classList.add('dark');
  if (await wait(800)) return;
  let showNew = false, flips = 0;
  const flip = () => {
    showNew = !showNew;
    newImg.style.visibility = showNew ? '' : 'hidden';
    oldImg.style.visibility = showNew ? 'hidden' : '';
  };
  for (let gap = 560; gap > 50; gap *= 0.85) {
    flip();
    if (await wait(gap)) return;
  }
  // the fastest stretch: white flashes between the switches, ending on the new form
  while (flips < 14 || !showNew) {
    flip();
    mon.classList.toggle('white', ++flips % 3 === 0);
    if (await wait(50)) return;
  }
  mon.classList.remove('white');
  await whiteFlash();
}

async function whiteFlash() {
  const flash = $('evolve-flash');
  flash.classList.remove('go');
  void flash.offsetWidth;
  flash.classList.add('go');
  await sleep(120);   // the flash is at full white now, so the colours come back under it
}

/** A tap or Enter while the song plays skips straight to the new form's cry. Pointerdown, not click, so the tap that
    dismissed "is evolving!" can't count; `wait(ms)` resolves true once skipped. */
function skipper(scene) {
  let fire;
  const tapped = new Promise(resolve => { fire = resolve; });
  const s = {
    done: false,
    wait: (ms) => Promise.race([sleep(ms).then(() => s.done), tapped.then(() => true)]),
    off: () => {
      scene.removeEventListener('pointerdown', onTap);
      document.removeEventListener('keydown', onKey);
    },
  };
  const onTap = () => { s.done = true; fire(); };
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onTap();
  };
  scene.addEventListener('pointerdown', onTap);
  document.addEventListener('keydown', onKey);
  return s;
}

const loaded = (img) => img.complete && img.naturalWidth ? null
  : new Promise(resolve => { img.onload = img.onerror = resolve; });

/**
 * Both forms share one scale, set so the bigger one's resting pose fills about 60% of the width or 40% of the height,
 * and stand centred on the same feet (SPRITE_FIT, like battle). Legendaries reuse one sprite, so they grow by stage.
 */
function fit(starter, ...forms) {
  const oneSprite = starter.line.every(form => form.id.replace(/-shiny$/, '') === starter.line[0].id);
  const grow = (stage) => oneSprite ? [0.78, 0.9, 1][stage] : 1;
  const pose = (img) => {
    const [top, bottom, left, right] = spriteFit(img.src);
    return Math.max(img.naturalWidth - left - right, img.naturalHeight - top - bottom) || 64;
  };
  const scale = Math.min(4, Math.min(innerWidth * 0.6, innerHeight * 0.4) / Math.max(...forms.map(([img, s]) => pose(img) * grow(s))));
  for (const [img, stage] of forms) {
    const s = scale * grow(stage);
    const [, bottom] = spriteFit(img.src);
    img.style.width = `${img.naturalWidth * s}px`;
    img.style.height = `${img.naturalHeight * s}px`;
    img.style.translate = `calc(-50% + ${(img.naturalWidth / 2 - massX(img)) * s}px) ${bottom * s}px`;
  }
}

const MASS = new Map();
/* The body's middle, not the box's: Charmeleon's tail flame widens the box to the right, so a box-centred Charmeleon
   looked off to the left (the user's call, 2026-09-28). Each column counts by its height squared, so the tall
   body decides and a thin tail or arm barely moves it, while a bulb or shell still counts as body. */
function massX(img) {
  if (MASS.has(img.src)) return MASS.get(img.src);
  const w = img.naturalWidth, h = img.naturalHeight;
  let x = w / 2;
  try {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, w, h).data;
    const cols = new Array(w).fill(0);
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) cols[(i >> 2) % w]++;
    let sum = 0, weight = 0;
    cols.forEach((n, c) => { sum += n * n * (c + 0.5); weight += n * n; });
    if (weight) x = sum / weight;
  } catch { const [, , left, right] = spriteFit(img.src); x = (w + left - right) / 2; }
  MASS.set(img.src, x);
  return x;
}

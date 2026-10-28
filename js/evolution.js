/*
 * The evolution scene, after Gold/Silver's: once a boss faints the screen washes to white, the Pokémon fades in alone
 * and cries, "What? X is evolving!" waits for a tap, then the evolution song plays while it flashes white and its dark
 * silhouette switches between the old and new forms, faster and faster, until a flash colours the new form in with its
 * cry (a tap skips the flashing to that flash, "Tap to skip" in the corner: the user's call, 2026-10-18, undoing
 * 2026-10-13's play-it-in-full). The chime and "Congratulations!" follow, and the next tap fades the white out onto whatever was set up under it.
 * Cosmetic only: run.js has already changed the stage, HP and deck. Under reduced motion the cries, song and chime stay,
 * but nothing flashes or wipes. Before "is evolving!", comic panels slam in with the Pokémon's face (js/evo-comic.js;
 * a playtest, 2026-10-28), and a Duo Run's pair evolve side by side.
 */
import { $, sleep } from './ui.js';
import { playMusic, playCry, playSound, preloadMusic, preloadSounds, preloadCries } from './audio.js';
import { sayLines } from './rewards.js';
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit, bodyX } from './data/sprite-fit.js';
import { calmFx } from './prefs.js';
import { comicIntro } from './evo-comic.js';

const still = () => calmFx();   // reduced motion or Reduced flashing: the whole show is flashes, so it's skipped
const CRY_WAIT_MAX = 1500;   // a long cry mustn't hold the scene up
const STILL_SONG_MS = 5500;  // under reduced motion the song plays about as long as the flashing would
const SKIP_ARM_MS = 300;     // a skip needs a tap of its own, not the one (or a quick double tap) that closed the text

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
 * Play the scene for `starter` (and a Duo Run's `mate` beside it) evolving out of `from`. `after` are lines said after
 * "Congratulations!". Resolves on the last tap with the screen still white, with a function that fades the white away
 * (set the next screen up first).
 */
export async function evolutionScene(starter, from, after = [], mate = null) {
  const to = from + 1;
  const scene = $('evolve-scene');
  const cast = [starter, mate].filter(Boolean).map((s, i) => monFor(scene, s, i));
  const names = (stage) => cast.map(c => stageName(c.starter, stage)).join(' and ');
  cast.forEach(c => preloadEvolution(c.starter, from));

  for (const { starter: s, mon, oldImg, newImg } of cast) {
    oldImg.src = spriteUrl(s, 'front', from);
    newImg.src = spriteUrl(s, 'front', to);
    oldImg.alt = stageName(s, from);
    newImg.alt = stageName(s, to);
    newImg.style.visibility = 'hidden';
    oldImg.style.visibility = '';
    mon.className = 'evo-mon';
    mon.hidden = false;
  }
  $('evolve-log').hidden = true;

  playMusic(null);   // the victory fanfare fades out under the white
  scene.classList.remove('out', 'shown');
  scene.classList.toggle('still', still());
  scene.classList.toggle('duo', !!mate);
  scene.hidden = false;
  await Promise.all([...cast.flatMap(c => [loaded(c.oldImg), loaded(c.newImg)]), sleep(still() ? 400 : 900)]);
  const refit = () => cast.forEach(c => fit(c.starter, mate ? 0.32 : 0.6, [c.oldImg, from], [c.newImg, to]));
  refit();
  addEventListener('resize', refit);

  const cut = await comicIntro(scene, cast.map(c => [c.starter, from]), { still: still(), flash: whiteFlash });
  await say([`What? ${names(from)} ${mate ? 'are' : 'is'} evolving!`]);
  await cut();
  cast.forEach(c => { c.mon.style.transition = 'none'; c.mon.classList.add('shown'); });
  await sleep(still() ? 300 : 700);
  cast.forEach(c => { c.mon.style.transition = ''; });

  playMusic('evolution', { restart: true, cut: true });
  const skip = skipper(scene);
  await Promise.race([still() ? sleep(STILL_SONG_MS) : morph(cast, skip.gone), skip.tapped]);
  skip.done();
  if (skip.gone() && !still()) await whiteFlash();

  playMusic(null, { cut: true });
  for (const { mon, oldImg, newImg } of cast) {
    oldImg.style.visibility = 'hidden';
    newImg.style.visibility = '';
    mon.classList.remove('dark', 'white');
  }
  for (const c of cast) await Promise.race([playCry(c.starter.line[to].id), sleep(CRY_WAIT_MAX)]);
  playSound('evolved');
  await say([`Congratulations! Your ${names(from)} evolved into ${names(to)}!`, ...after]);

  return async () => {
    scene.classList.add('out');
    await sleep(600);
    removeEventListener('resize', refit);
    scene.hidden = true;
    scene.classList.remove('out', 'duo');
    for (const c of cast) c.mon.className = 'evo-mon';
  };
}

/** The scene's Pokémon `i`: the first in the HTML; a duo's partner a copy of it made once, hidden when alone. */
function monFor(scene, starter, i) {
  let mon = $('evolve-mon');
  let second = mon.nextElementSibling?.classList.contains('evo-mon') ? mon.nextElementSibling : null;
  if (i === 0) {
    if (second) second.hidden = true;
  } else {
    if (!second) {
      second = mon.cloneNode(true);
      second.removeAttribute('id');
      second.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      mon.after(second);
    }
    mon = second;
  }
  const [oldImg, newImg] = mon.querySelectorAll('img');
  return { starter, mon, oldImg, newImg };
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

/** While the scene shows "Tap to skip", a tap or Enter resolves `tapped`; `gone()` then tells the morph to stop. */
function skipper(scene) {
  let gone = false, resolve;
  const tapped = new Promise(r => { resolve = r; });
  const onTap = () => { gone = true; resolve(); };
  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } };
  scene.classList.add('skippable');
  // listening at once, the tap that closed "X is evolving!" on its text box bubbled on up to the scene and skipped the
  // whole show (the user saw no evolution, 2026-10-25)
  const arm = setTimeout(() => {
    scene.addEventListener('click', onTap);
    document.addEventListener('keydown', onKey);
  }, SKIP_ARM_MS);
  return {
    tapped,
    gone: () => gone,
    done() {
      clearTimeout(arm);
      scene.classList.remove('skippable');
      scene.removeEventListener('click', onTap);
      document.removeEventListener('keydown', onKey);
    },
  };
}

/** It flashes white three times and goes dark, then the silhouette switches forms faster and faster, flashing at the end.
    Stops where it is once `gone()` (skipped), leaving the scene to show the new form. A duo's pair switch together. */
async function morph(cast, gone) {
  const mon = { classList: {
    add: (c) => cast.forEach(m => m.mon.classList.add(c)),
    remove: (c) => cast.forEach(m => m.mon.classList.remove(c)),
    toggle: (c, on) => cast.forEach(m => m.mon.classList.toggle(c, on)),
  } };
  for (let i = 0; i < 3; i++) {
    mon.classList.add('white');
    await sleep(170);
    if (gone()) return;
    mon.classList.remove('white');
    await sleep(210);
    if (gone()) return;
  }
  mon.classList.add('dark');
  await sleep(800);
  if (gone()) return;
  let showNew = false, flips = 0;
  const flip = () => {
    showNew = !showNew;
    for (const { oldImg, newImg } of cast) {
      newImg.style.visibility = showNew ? '' : 'hidden';
      oldImg.style.visibility = showNew ? 'hidden' : '';
    }
  };
  for (let gap = 560; gap > 50; gap *= 0.85) {
    flip();
    await sleep(gap);
    if (gone()) return;
  }
  // the fastest stretch: white flashes between the switches, ending on the new form
  while (flips < 14 || !showNew) {
    flip();
    mon.classList.toggle('white', ++flips % 3 === 0);
    await sleep(50);
    if (gone()) return;
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

const loaded = (img) => img.complete && img.naturalWidth ? null
  : new Promise(resolve => { img.onload = img.onerror = resolve; });

/**
 * Both forms share one scale, set so the bigger one's resting pose fills about `room` (60%) of the width or 40% of the
 * height, and stand centred on the same feet (SPRITE_FIT, like battle). Legendaries reuse one sprite, so they grow by stage.
 */
function fit(starter, room, ...forms) {
  const oneSprite = starter.line.every(form => form.id.replace(/-shiny$/, '') === starter.line[0].id);
  const grow = (stage) => oneSprite ? [0.78, 0.9, 1][stage] : 1;
  const pose = (img) => {
    const [top, bottom, left, right] = spriteFit(img.src);
    return Math.max(img.naturalWidth - left - right, img.naturalHeight - top - bottom) || 64;
  };
  const scale = Math.min(4, Math.min(innerWidth * room, innerHeight * 0.4) / Math.max(...forms.map(([img, s]) => pose(img) * grow(s))));
  for (const [img, stage] of forms) {
    const s = scale * grow(stage);
    const [, bottom, left, right] = spriteFit(img.src);
    img.style.width = `${img.naturalWidth * s}px`;
    img.style.height = `${img.naturalHeight * s}px`;
    img.style.translate = `calc(-50% + ${((right - left) / 2 - bodyX(img.src)) * s}px) ${bottom * s}px`;
  }
}

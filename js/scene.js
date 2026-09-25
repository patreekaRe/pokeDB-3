/* ============================================================
   scene.js  -  the pixel-art scene behind every screen: one per biome
   and fight kind (a normal fight, an elite's tenser light, a boss's
   dramatic arena), plus the pads the two Pokémon stand on in battle,
   like the Gen 3/4 games. The map and reward screens show their
   biome's normal scene, the menus the one that goes with the picked
   starter's type: its own canyon, seaside or jungle (a moonlit night
   before one is picked), dimmed by
   #backdrop so the windows stay readable. When a boss is close to
   fainting, setStorm() turns the weather (rain, cinders, lightning).

   The scene is painted into a small canvas (one canvas pixel = a few
   CSS pixels, upscaled with image-rendering: pixelated), the same way
   as the title screen's sky, so it stays blocky on any screen.
   Everything that never moves is painted once into `base`; each frame
   copies it and draws the living parts on top (clouds, swaying grass,
   butterflies, leaves, fireflies, wisps, embers, lava, lightning...).
   Which parts a scene has is data: see BIOME_ART. It pauses while the
   tab or the title screen hides it, and never moves under
   prefers-reduced-motion.
   ============================================================ */

import { $ } from './ui.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FPS = 8;
const dither = (x, y) => BAYER[((y % 4 + 4) % 4) * 4 + ((x % 4 + 4) % 4)];

/* ---------- the scenes ----------
   Each biome has its shared look, and `kinds` overrides it for wild / elite / boss fights.
   sky: bands top to bottom. light: 'sun' | 'moon' | 'haze' | null. backdrop: 'hills' | 'shrine' | 'volcano'.
   floor: 'meadow' | 'moss' | 'basalt' (ground: its colour bands). life: the animated parts to run.
   storm: what setStorm() brings: its rain (or cinders) colours, fall speed and amount, and
   [multiply, +r, +g, +b] tints that darken the sky and ground. */
const BIOME_ART = {
  clearing: {
    backdrop: 'hills', floor: 'meadow', light: 'sun',
    storm: { rain: ['#e0ecff', '#98b0d8'], fall: 3.5, count: 1, sky: [0.55, 4, 8, 22], ground: [0.72, 0, 2, 10] },
    sun: ['#fffce8', '#fff0a0', '#f8e070'],
    cloud: ['#ffffff', '#eef4fb', '#c8dcee', '#a8c4e0'],
    trunk: ['#7a5430', '#4e3418'],
    flowers: [['#ffffff', '#f8d848'], ['#f8e048', '#f89830'], ['#f8a0c8', '#f8f0f8'], ['#b0a0f8', '#f8f8f8']],
    rock: ['#d0d0c8', '#a0a098', '#6c6c68'],
    butterflies: ['#ffffff', '#f8d848', '#f8a040'],
    bird: '#34405c',
    pollen: ['#fffce0', '#f8f0a0'],
    firefly: ['#f8f8a0', '#c8e858'],
    kinds: {
      wild: {
        sky: ['#4a90e4', '#5ca0ec', '#70b0f2', '#86c0f6', '#9ed0f8', '#b8e0f8', '#d0ecf8'],
        farHills: ['#b4d8d8', '#9cc8c8'],
        hills: ['#8cc8a0', '#74b48c', '#62a47c'],
        trees: ['#6cc058', '#48a044', '#2e7c34', '#1c5a26'],
        meadow: ['#90d468', '#80c858', '#70bc4c', '#62b044', '#56a43c', '#4a9834'],
        blade: ['#b0e878', '#78c050', '#3e8832'],
        patch: '#4e9a3c',
        clouds: { count: 1, shadows: true },
        life: ['clouds', 'birds', 'blades', 'butterflies', 'pollen'],
        pad: { style: 'grass', top: '#a8e078', mid: '#80c858', low: '#5ea840', rim: '#2e6a2c', earth: '#8a6a3a', blade: '#c0f088' },
      },
      elite: {   // sunset: the light goes gold and the shadows long
        sky: ['#3a3a78', '#584a8c', '#8a5a94', '#c46a84', '#ec8a6c', '#f8ac70', '#f8cc90'],
        sun: ['#fff4d0', '#f8c868', '#f08848'], sunLow: true,
        cloud: ['#f8d8c8', '#eab0a8', '#c07890', '#8a5078'],
        farHills: ['#a07898', '#886080'],
        hills: ['#707a70', '#5a6a5a', '#4a5a4c'],
        trees: ['#6a9048', '#4a7440', '#325836', '#1e3c24'],
        meadow: ['#8ab050', '#7aa248', '#6a9240', '#5c8238', '#4e7230', '#42622a'],
        blade: ['#c0c860', '#6a9040', '#34602a'],
        patch: '#4a6e30',
        clouds: { count: 0.8 },
        pollen: ['#f8e0a0', '#f8b860'],
        life: ['clouds', 'birds', 'blades', 'pollen', 'fireflies'],
        fireflyCount: 0.5,
        pad: { style: 'grass', top: '#a8c068', mid: '#88a850', low: '#6a8a40', rim: '#2e4a26', earth: '#7a5436', blade: '#d0d880' },
      },
      boss: {   // a moonlit night
        light: 'moon', stars: true,
        sky: ['#080a24', '#0e1234', '#141a44', '#1c2452', '#262e60', '#30386a', '#3c4474'],
        cloud: ['#8088b0', '#646c94', '#4a5278', '#363c5e'],
        farHills: ['#2a3458', '#222a4a'],
        hills: ['#223a48', '#1a303e', '#142634'],
        trees: ['#2a5a4a', '#1e4a3c', '#143a30', '#0c2820'],
        trunk: ['#3a2a28', '#241818'],
        meadow: ['#2e5a4a', '#2a5244', '#264a3e', '#224238', '#1e3a32', '#1a322c'],
        blade: ['#4a8a6c', '#2e6a52', '#1a4436'],
        patch: '#1a3a30',
        flowers: [['#a8b0d8', '#e0d890'], ['#c8b8f0', '#f0f0f8']],
        rock: ['#707898', '#4e5470', '#343850'],
        clouds: { count: 0.5 },
        life: ['stars', 'clouds', 'blades', 'fireflies'],
        fireflyCount: 1.4,
        pad: { style: 'grass', top: '#4a8a6a', mid: '#3a7458', low: '#2c5e48', rim: '#10281e', earth: '#3a2e2a', blade: '#70b08a' },
      },
    },
  },

  shrine: {
    backdrop: 'shrine', floor: 'moss', light: null,
    storm: { rain: ['#d0e8f0', '#80a0b0'], fall: 3.5, count: 1, sky: [0.55, 0, 10, 18], ground: [0.72, 0, 4, 8] },
    trunk: ['#5a4430', '#382818'],
    torii: ['#d84830', '#a82c20', '#6a1810'],
    stone: ['#b8b8a8', '#8c8c7e', '#5e5e54'],
    rock: ['#a8aa98', '#80826e', '#565848'],
    lantern: ['#b0b0a0', '#7a7a6c', '#4a4a40'],
    flowers: [['#f8f0f8', '#f8d8e8']],
    kinds: {
      wild: {   // a misty morning under the trees
        sky: ['#9cbcac', '#a8c6b4', '#b4d0bc', '#c0d8c4', '#ccdfcc', '#d8e6d4'],
        farForest: ['#9cbca8', '#8cae9a'],
        trees: ['#5a9a50', '#3e7e42', '#2a6034', '#1a4426'],
        ground: ['#78a060', '#6a9456', '#5e8a4c', '#528044', '#46743a', '#3c6832'],
        blade: ['#a0c878', '#5e9048', '#2e5c2a'],
        patch: '#3e6a30',
        mist: 48, shafts: true,
        leaves: [['#88c058', '#5a9040'], ['#c8d058', '#98a038']],
        life: ['mist', 'blades', 'leaves', 'pollen'],
        pollen: ['#f8f8e0', '#e0ecb0'],
        pad: { style: 'stone', top: '#b8baa8', mid: '#a0a290', low: '#88887a', rim: '#3a3c32', earth: '#686a5c', moss: '#6a9a4c' },
      },
      elite: {   // dusk: the lanterns are lit
        sky: ['#241e44', '#342852', '#4c3462', '#6a426a', '#8a5470', '#a86a74'],
        farForest: ['#5a4a6a', '#4a3c5c'],
        trees: ['#4a6a48', '#34543a', '#243e2c', '#162a1e'],
        ground: ['#566e48', '#4c6640', '#445c3a', '#3c5234', '#34482e', '#2c3e28'],
        blade: ['#7a9460', '#4a6a3a', '#26401e'],
        patch: '#2e4424',
        mist: 30,
        lanternsLit: true, lanternGlow: ['#fff0a0', '#f8b848', '#d87028'],
        leaves: [['#e88838', '#b85a20'], ['#d85030', '#a03020'], ['#e8c040', '#b08a20']],
        firefly: ['#f8e888', '#d8b848'], fireflyCount: 0.6,
        life: ['mist', 'blades', 'leaves', 'fireflies', 'lanterns'],
        pad: { style: 'stone', top: '#9a9488', mid: '#847e74', low: '#6c6860', rim: '#28241e', earth: '#524c46', moss: '#5a7040' },
      },
      boss: {   // night: spirits drift between the gates
        light: 'moon', stars: true,
        sky: ['#06101a', '#0a1824', '#0e2030', '#14283a', '#1a3242', '#203a4a'],
        farForest: ['#16303a', '#10262e'],
        trees: ['#1e4038', '#16342e', '#0e2822', '#081c18'],
        torii: ['#a8303a', '#782028', '#48101a'],
        ground: ['#24463a', '#204034', '#1c3a2e', '#183228', '#142c24', '#10261e'],
        blade: ['#3a6a58', '#24503e', '#123428'],
        patch: '#0e2a20',
        mist: 26,
        lanternsLit: true, lanternGlow: ['#d8f8ff', '#78c8e8', '#3880b0'],
        wisp: ['#f0ffff', '#98e0f8', '#4898c8'],
        leaves: [['#4a7a58', '#2e5a40']],
        life: ['stars', 'mist', 'blades', 'leaves', 'wisps', 'lanterns'],
        pad: { style: 'stone', top: '#5a6a70', mid: '#4a5a60', low: '#3c4a50', rim: '#101a1e', earth: '#2c3438', moss: '#2e5a48' },
      },
    },
  },

  wastes: {
    backdrop: 'volcano', floor: 'basalt', light: 'haze',
    storm: { rain: ['#fff0a0', '#f06820'], fall: 1.1, count: 0.6, sky: [0.8, 40, 0, 0], ground: [0.85, 18, 0, 0] },   // a rain of cinders
    rock: ['#7a6a62', '#564a44', '#342c28'],
    lava: ['#fff0a0', '#f8b830', '#f06820', '#b03010'],
    ember: ['#fff0a0', '#f8a830', '#e85820'],
    ash: ['#a8a09c', '#807874'],
    smoke: ['#8a7a78', '#6a5c5a', '#4e4240', '#3a302e'],
    kinds: {
      wild: {   // a hazy, ashen day on the volcano's flank
        sky: ['#5a4448', '#74504c', '#8e5e50', '#a86e50', '#c08050', '#d49458', '#e0a868'],
        sun: ['#f8e8b8', '#f0c880', '#e0a060'],
        mountains: ['#6a4c48', '#56403c', '#463430'],
        volcano: ['#8a6a5c', '#6a5048', '#4a3632'],
        ground: ['#5e4e48', '#564842', '#4e423c', '#463a36', '#3e3430', '#362e2a'],
        crackGlow: 0.6, embers: 0.6,
        life: ['smoke', 'lava', 'embers', 'ash'],
        pad: { style: 'rock', top: '#7a6a62', mid: '#665850', low: '#544842', rim: '#1e1614', earth: '#3e3230', lava: '#f07820' },
      },
      elite: {   // the air turns red
        sky: ['#2c1216', '#44181a', '#5e201e', '#7c2a20', '#9c3a22', '#bc5028', '#d46a30'],
        sun: ['#f8d0a0', '#f09050', '#d05830'],
        mountains: ['#4a2a26', '#3a2220', '#2c1a18'],
        volcano: ['#6e4038', '#52302a', '#38201c'],
        ground: ['#4e3a34', '#48342e', '#402e2a', '#382824', '#302220', '#281c1a'],
        crackGlow: 1, embers: 1.2,
        life: ['smoke', 'lava', 'embers', 'ash'],
        pad: { style: 'rock', top: '#6a524a', mid: '#58443e', low: '#483834', rim: '#140c0a', earth: '#342624', lava: '#f89030' },
      },
      boss: {   // the volcano erupts under a storm of ash and lightning
        light: null, erupting: true,
        sky: ['#0c0606', '#160a0a', '#220e0c', '#30120e', '#421810', '#5a2012', '#742a14'],
        mountains: ['#2a1614', '#221210', '#1a0e0c'],
        volcano: ['#4e3230', '#3a2422', '#261614'],
        ground: ['#3a2a26', '#342622', '#2e221e', '#281e1a', '#221a16', '#1c1612'],
        smoke: ['#5a4644', '#443634', '#322826', '#241c1a'],
        crackGlow: 1.4, embers: 2,
        life: ['smoke', 'lava', 'embers', 'ash', 'lightning', 'eruption'],
        pad: { style: 'rock', top: '#5a4640', mid: '#4a3a34', low: '#3c2e2a', rim: '#0c0606', earth: '#2a1e1c', lava: '#f8a830' },
      },
    },
  },
};

/* ---------- the menus: one scene per starter type, seen nowhere else ----------
   Same shape as a biome's scene, without kinds, pads or storms. */
const TYPE_ART = {
  fire: {   // a red-rock canyon at sunset, a campfire throwing sparks
    backdrop: 'canyon', floor: 'desert', light: 'sun', sunLow: true,
    sky: ['#2a1a4a', '#48245a', '#743062', '#a8405e', '#d65a4c', '#f08244', '#f8a850', '#f8c868'],
    sun: ['#fff8d8', '#f8d070', '#f09848'],
    farMesas: ['#8a4a6a', '#74405e'],
    mesas: ['#e07848', '#b85a3a', '#8a3c2c', '#6a2c24'],
    ground: ['#c8703e', '#bc663a', '#ae5c36', '#9e5232', '#8e482e', '#7c3e2a'],
    rock: ['#d88a58', '#a45a3a', '#6a3424'],
    cactus: ['#6a8a40', '#4a6a30', '#2e4a22'],
    logs: ['#8a5a34', '#5a3a20', '#3a2414'],
    stone: ['#a09088', '#706058', '#48403c'],
    flame: ['#fffce0', '#f8e060', '#f8a030', '#e05a20', '#a02c18'],
    bird: '#3a1e30',
    life: ['birds', 'campfire'],
  },

  water: {   // a bright seaside: surf running up the sand, a sail on the horizon, gulls
    backdrop: 'sea', floor: 'beach', light: 'sun',
    sky: ['#3a88e0', '#4c98ea', '#62a8f0', '#7cbaf4', '#98ccf8', '#b8def8', '#d8eef8'],
    sun: ['#fffce8', '#fff0a0', '#f8e070'],
    cloud: ['#ffffff', '#eef4fb', '#c8dcee', '#a8c4e0'],
    clouds: { count: 1 },
    island: ['#6aa880', '#4a8868', '#2e6a54'],
    tower: ['#f8f8f0', '#d84830', '#a0a098'],
    sea: ['#58b8e8', '#48a8e0', '#3a98d6', '#2e88cc', '#2a7cc0', '#2a74b8'],
    ripple: ['#8ad0f0', '#1e64a8'],
    glint: ['#ffffff', '#c8f0ff'],
    foam: ['#ffffff', '#d8f0f8'],
    wet: ['#c8b078', '#b8a068'],
    sand: ['#f8e8b0', '#f0dca0', '#e8d094', '#e0c488', '#d6b87c'],
    rock: ['#c8c0b0', '#948c80', '#605a54'],
    shells: ['#f8c8c8', '#f8f0e0', '#f8a060'],
    sail: ['#ffffff', '#c8d8e8', '#8a5a34'],
    bird: '#f8f8f8',
    life: ['clouds', 'birds', 'surf'],
  },

  grass: {   // deep in a jungle: giant trunks, hanging vines, light pouring through the canopy
    backdrop: 'jungle', floor: 'jungleFloor', light: null,
    sky: ['#e8f8c8', '#d0f0a8', '#b8e490', '#a0d880'],
    canopy: ['#5aa848', '#3e8a3c', '#2a6a30', '#1a4a24'],
    farForest: ['#6aa878', '#528e66'],
    bark: ['#8a6a48', '#5e4630', '#3a2a1c'],
    trunk: ['#5e4630', '#3a2a1c'],
    trees: ['#5ab04c', '#3e9040', '#2a7034', '#1a5026'],
    ground: ['#4e8a3a', '#467e36', '#3e7232', '#36662e', '#2e5a2a', '#264e26'],
    blade: ['#8ad060', '#4e9a3c', '#2a6a2a'],
    patch: '#2e6028',
    fern: ['#7ac858', '#4e9a40', '#2e6a2e'],
    leaf: ['#5ab84a', '#3a9038', '#1e5a24', '#9ae070'],
    vine: ['#6ab04a', '#3e7a34'],
    flowers: [['#f84830', '#f8e048'], ['#f89830', '#f8f0a0'], ['#e858a8', '#f8e0f0']],
    rock: ['#9aa890', '#6a7862', '#44503e'],
    butterflies: ['#f8d848', '#58c8f8', '#f87848'],
    bird: '#1e3a1e',
    pollen: ['#fffce0', '#e8f8a0'],
    life: ['vines', 'blades', 'butterflies', 'pollen'],
  },
};

/* ---------- places: indoor scenes for a room on the map (showPlaceScene) ---------- */
const PLACE_ART = {
  center: {   // inside a Pokémon Center: Chansey behind the counter, the healing machine beside it
    backdrop: 'center', floor: 'center', light: null, horizon: 0.6,   // low, so the counter shows under the Center's two tiles
    sky: ['#f8d888'],
    ceiling: ['#8a2c20', '#b84430', '#fff4c8'],
    wall: ['#f8d888', '#eec070', '#d09048', '#fff0b8'],
    wainscot: ['#e85838', '#b83828', '#7a2418', '#f89868'],
    tiles: ['#fbf0d0', '#f4d8a4', '#dcb886'],
    rug: ['#c8b8ec', '#a898d8', '#f0ecfc'],
    counter: ['#f89878', '#e05838', '#a83020'],
    panel: ['#fff4dc', '#f2e2c4', '#d8c098', '#a87848'],
    ball: ['#e04030', '#ffffff', '#383040'],
    chansey: ['#7a3850', '#fde4ec', '#f8b8cc', '#e08aa8', '#302030'],
    cap: ['#ffffff', '#d8d8e8', '#e03040'],
    machine: ['#fbfbfb', '#dcdce4', '#a8a8b8', '#4a5264'],
    dome: ['#f87868', '#d83830', '#901c18'],
    glow: ['#50d8f0', '#c0fcff', '#2a88a8'],
    screen: ['#a8d8f8', '#4878d8', '#f0fcff'],
    pc: ['#f0e0c0', '#c8b490', '#8a7458'],
    tv: ['#4a3840', '#a8d0e8', '#e8f4f8'],
    map: ['#5898d8', '#78c068', '#e8d090', '#8a5a34'],
    plant: ['#5ab048', '#2e7a34', '#f878a8', '#c85a30', '#8a3420'],
    life: ['center'],
  },

  mart: {   // inside a Poké Mart: fridges down both sides of a bare wall, where the shop's real shelf stands
    backdrop: 'mart', floor: 'mart', light: null, horizon: 0.74,   // low, so the wall stands behind the shelf
    sky: ['#f8f8f0'],
    wall: ['#2a8a98', '#58c0c8', '#f8f8f0', '#e89078'],
    clock: ['#a05838', '#f8f8f0', '#303038'],
    fridge: ['#c8c8d8', '#a8e4e8', '#e8fcfc', '#78c878', '#7a7a90'],
    tiles: ['#a8e8b0', '#78c890', '#88d49c'],
    mat: ['#e85830', '#f8a868'],
    plant: ['#5ab048', '#2e7a34', '#8ad060', '#c8c8d8', '#7a7a90'],
    life: [],
  },
};


let canvas = null, ctx = null, S = null, timer = 0, tick = 0;
let W = 0, H = 0, horizon = 0, base = null, img = null, px = null, sky = null, rand = Math.random;
let life = {};
let shown = '';                 // which scene is up, so going back to it doesn't restart it
let storm = { on: false, level: 0 };

/** The menus' scene: each starter type has its own (TYPE_ART); before one is picked, the Clearing's moonlit night, like the title screen. */
export function showMenuScene(type) {
  if (TYPE_ART[type]) paintScene(`menu/${type}`, TYPE_ART[type]);
  else showScene('clearing', 'boss');
}

/** An indoor scene for a room on the map (PLACE_ART), e.g. 'center' for the Pokémon Center. */
export function showPlaceScene(place) {
  paintScene(`place/${place}`, PLACE_ART[place]);
}

/** Resting at the Center: the machine takes the balls in one by one, then they flash, like the games. */
export function healAtCenter() {
  if (!life.machine) return;
  life.healAt = timer ? tick : tick - 40;
  if (!timer) draw();
}

/** Where the Center's healing machine and PC are on screen, in CSS pixels ({ machine, pc } of { left, top, width, height }), or null. */
export function centerSpots() {
  if (!life.spots || !canvas) return null;
  const box = canvas.getBoundingClientRect(), sx = box.width / W, sy = box.height / H;
  const rect = ({ x0, x1, y0, y1 }) => ({ left: box.left + x0 * sx, top: box.top + y0 * sy, width: (x1 - x0 + 1) * sx, height: (y1 - y0 + 1) * sy });
  return { machine: rect(life.spots.machine), pc: rect(life.spots.pc) };
}

/**
 * Paint the scene for a biome and fight kind ('wild' | 'elite' | 'boss') behind the page, or clear it.
 * Asking again for the scene that's already up leaves it running, except in battle, where the
 * horizon is fitted to the enemy's pad and every fight starts with calm weather.
 */
export function showScene(biomeId, kind = 'wild') {
  const art = BIOME_ART[biomeId];
  if (!art) { paintScene('', null); return; }
  const { kinds, ...shared } = art;
  paintScene(`${biomeId}/${kind}`, { ...shared, ...(kinds[kind] || kinds.wild) });
}

function paintScene(key, raw) {
  canvas = $('scene-bg');
  ctx = canvas.getContext('2d');
  document.body.classList.toggle('has-scene', !!raw);
  if (raw && key === shown && document.body.dataset.screen !== 'battle-screen') return;
  shown = key;
  clearInterval(timer);
  storm = { on: false, level: 0 };
  if (!raw) { S = null; return; }
  S = colours(raw);
  S.raw = raw;
  S.storm = raw.storm && { ...raw.storm, rain: raw.storm.rain.map(abgr) };
  if (raw.pad) $('battle-screen').style.setProperty('--pad', `url("${padImage(raw.pad)}")`);
  resize();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(frame, 1000 / FPS);
}

/** Bring the weather in (a boss close to fainting) or let it pass. Under reduced motion only the light changes. */
export function setStorm(on) {
  if (!S?.storm || storm.on === on) return;
  storm.on = on;
  if (on && !life.rain) makeRain();
  if (!timer) { storm.level = on ? 1 : 0; draw(); }
}

addEventListener('resize', () => { if (S) resize(); });

function resize() {
  const scale = innerWidth <= 720 ? 4 : 5;
  W = Math.max(1, Math.ceil(innerWidth / scale));   // a hidden pane can report 0 at load; the resize listener repaints it
  H = Math.max(1, Math.ceil(innerHeight / scale));
  canvas.width = W;
  canvas.height = H;
  horizon = S.raw.horizon ? Math.round(H * S.raw.horizon) : horizonRow(scale);
  rand = seeded(W * 131 + H);
  img = ctx.createImageData(W, H);
  px = new Uint32Array(img.data.buffer);
  sky = new Uint8Array(W * H);
  life = {};
  base = paintBase();
  makeLife();
  draw();
  dispatchEvent(new Event('scenepaint'));   // the Center's tap spots follow the scene (centerSpots)
}

/** The horizon sits at about 38% of the screen, but always above the enemy's pad, so the pad is on the ground on any layout. */
function horizonRow(scale) {
  const box = $('enemy-portrait-box').getBoundingClientRect();
  const low = Math.round(H * 0.38);
  if (!box.height) return low;
  // the enemy's pad (see .enemy-zone::after): 1.5x the box before --size wide, at the pad image's 48:16, its bottom 0.2x below the feet
  const base = box.width / (parseFloat(getComputedStyle($('enemy-zone')).getPropertyValue('--size')) || 1);
  const row = Math.round((box.bottom + base * 0.2 - base * 1.5 * 16 / 48 - 6) / scale);
  return Math.max(Math.round(H * 0.15), Math.min(low, row));
}

function frame() {
  if (document.hidden || !$('title-screen').hidden) return;
  tick++;
  storm.level = Math.max(0, Math.min(1, storm.level + (storm.on ? 1 : -1) / (FPS * 2)));
  draw();
}

/* ---------- pixel helpers ---------- */

const inside = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
const put = (x, y, c) => { x |= 0; y |= 0; if (inside(x, y)) px[y * W + x] = c; };
const putSky = (x, y, c) => { x |= 0; y |= 0; if (inside(x, y) && sky[y * W + x]) px[y * W + x] = c; };
const solid = (x, y, c) => { x |= 0; y |= 0; if (inside(x, y)) { px[y * W + x] = c; sky[y * W + x] = 0; } };
function tint(x, y, k, add = 0) {
  x |= 0; y |= 0;
  if (!inside(x, y)) return;
  const c = px[y * W + x];
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k + add)));
  px[y * W + x] = ((255 << 24) | (f((c >> 16) & 255) << 16) | (f((c >> 8) & 255) << 8) | f(c & 255)) >>> 0;
}
/** Vertical bands of colour from y0 to y1, dithered where they meet; `curve` bunches the bands towards the top. */
function bands(y0, y1, list, curve = 1, mark = false) {
  for (let y = y0; y < y1; y++) {
    const t = Math.pow((y - y0) / Math.max(1, y1 - y0), curve) * (list.length - 1);
    const i = Math.floor(t), f = t - i;
    for (let x = 0; x < W; x++) {
      put(x, y, list[Math.min(list.length - 1, i + (f * 16 > dither(x, y) ? 1 : 0))]);
      if (mark) sky[y * W + x] = 1;
    }
  }
}
const depthOf = (y) => (y - horizon) / Math.max(1, H - horizon);

/* ============================================================
   THE STILL SCENE
   ============================================================ */

function paintBase() {
  bands(0, horizon, S.sky, 1, true);
  if (S.stars) stars();
  if (S.light === 'sun') sunDisc(S.sunLow ? 0.78 : 0.5, 1);
  if (S.light === 'haze') sunDisc(0.42, 1.4);
  if (S.light === 'moon') moon();

  if (S.raw.backdrop === 'hills') {
    ridge(horizon - 9, 5, 23, 0.4, S.farHills, false);
    ridge(horizon - 4, 4, 13, 2.1, S.hills, true);
  }
  if (S.raw.backdrop === 'shrine') shrineBackdrop();
  if (S.raw.backdrop === 'volcano') volcanoBackdrop();
  if (S.raw.backdrop === 'canyon') canyonBackdrop();
  if (S.raw.backdrop === 'sea') seaBackdrop();
  if (S.raw.backdrop === 'jungle') jungleBackdrop();
  if (S.raw.backdrop === 'center') centerBackdrop();
  if (S.raw.backdrop === 'mart') martBackdrop();

  if (S.raw.floor === 'center') centerFloor();
  if (S.raw.floor === 'mart') martFloor();
  if (S.raw.floor === 'meadow') meadow();
  if (S.raw.floor === 'moss') mossGround();
  if (S.raw.floor === 'basalt') basalt();
  if (S.raw.floor === 'desert') desert();
  if (S.raw.floor === 'beach') beach();
  if (S.raw.floor === 'jungleFloor') jungleFloor();

  if (S.raw.backdrop === 'hills') treeLine();
  if (S.raw.backdrop === 'shrine') shrineFront();
  if (S.raw.backdrop === 'jungle') jungleFront();
  if (S.raw.backdrop === 'center') centerFront();
  if (S.raw.backdrop === 'mart') martFront();

  return Uint32Array.from(px);
}

/* ---------- sky ---------- */

function stars() {
  life.stars = [];
  for (let n = 0, count = Math.round(W * horizon / 60); n < count; n++) {
    const x = Math.floor(rand() * W), y = Math.floor(rand() * horizon * 0.85);
    const bright = rand() < 0.2;
    put(x, y, bright ? S.cloud?.[0] ?? abgr('#ffffff') : abgr('#8890c0'));
    if (bright) life.stars.push({ x, y, phase: rand() * 40 });
  }
}

function sunDisc(height, size) {
  const r = Math.max(3, Math.round(Math.min(W, H) * 0.03 * size));
  const s = life.sun = { x: Math.round(W * 0.86), y: Math.max(r + 8, Math.round(horizon * height)), r };
  const halo = S.sky[S.sky.length - 1];
  for (let y = -r * 2; y <= r * 2; y++) {
    for (let x = -r * 2; x <= r * 2; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= r) put(s.x + x, s.y + y, d < r - 1 ? S.sun[0] : S.sun[1]);
      else if (d <= r * 1.7 && dither(x, y) < 5) put(s.x + x, s.y + y, S.light === 'haze' ? S.sun[2] : halo);
    }
  }
}

function moon() {
  const r = Math.max(4, Math.round(Math.min(W, H) * 0.04));
  const m = { x: Math.round(W * 0.84), y: Math.max(r + 8, Math.round(horizon * 0.42)), r };
  const [lit, body, crater] = ['#f8f4d8', '#e0dab8', '#c0b898'].map(abgr);
  for (let y = -r * 3; y <= r * 3; y++) {
    for (let x = -r * 3; x <= r * 3; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= r) put(m.x + x, m.y + y, x + y > r * 0.4 ? body : lit);
      else if (d <= r * 1.8 && dither(x, y) < 4) tint(m.x + x, m.y + y, 1.25, 12);
      else if (d <= r * 2.8 && dither(x, y) < 1) tint(m.x + x, m.y + y, 1.2, 8);
    }
  }
  for (const [dx, dy] of [[-0.3, -0.2], [0.25, 0.3], [-0.1, 0.45], [0.35, -0.35]]) put(m.x + Math.round(dx * r), m.y + Math.round(dy * r), crater);
}

/** A rolling ridge line; `seed` shifts its waves so two ranges don't line up. */
function ridge(top, height, wave, seed, [lit, body, dark = body], shaded, jagged = false) {
  for (let x = 0; x < W; x++) {
    const wav = jagged
      ? Math.abs(((x / wave + seed) % 2) - 1) * 2 - 1 + 0.4 * Math.sin(x / (wave * 0.3) + seed)
      : 0.6 * Math.sin(x / wave + seed) + 0.4 * Math.sin(x / (wave * 0.37) + seed * 3);
    const y0 = top - Math.round(height * wav);
    for (let y = Math.max(0, y0); y < horizon; y++) {
      const shade = shaded && Math.sin(x / wave + seed + 0.8) < -0.2 && dither(x, y) < 10;
      solid(x, y, y === y0 ? lit : shade ? dark : body);
    }
  }
}

/* ---------- the Clearing ---------- */

function meadow() {
  bands(horizon, H, S.meadow, 0.8);
  grassPatches(S.patch, Math.round(W / 10));
  for (let n = 0; n < Math.max(2, Math.round(W / 60)); n++) {
    const y = horizon + 6 + Math.floor(rand() * (H - horizon - 8));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.5 ? 2 : 1);
  }
  flowerClusters(Math.round(W / (S.stars ? 14 : 9)));
}

function treeLine() {
  for (let x = Math.floor(rand() * 10); x < W + 8; x += 10 + Math.floor(rand() * 16)) {
    roundTree(x, horizon - 9 - Math.floor(rand() * 4), 5 + Math.floor(rand() * 3), true);
  }
  for (let x = -4; x < W + 6; x += 3 + Math.floor(rand() * 4)) {
    roundTree(x, horizon - 1 - Math.floor(rand() * 3), 3 + Math.floor(rand() * 3), false);
  }
  for (let x = 0; x < W; x++) { put(x, horizon + 2, S.trees[3]); if (dither(x, horizon + 3) < 6) put(x, horizon + 3, S.trees[3]); }
}

/** A round canopy lit from the top right; tall ones stand on a visible trunk. */
function roundTree(cx, cy, r, tall) {
  const [lit, leaf, shade, deep] = S.trees;
  if (tall) for (let y = cy + r - 1; y <= horizon + 1; y++) { solid(cx, y, S.trunk[0]); solid(cx + 1, y, S.trunk[1]); }
  for (let y = cy - r; y <= (tall ? cy + r : horizon + 1); y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      if ((tall || y < cy) && dx * dx + dy * dy > r * r) continue;
      const light = -dx + dy;
      solid(x, y, light < -r * 0.6 ? lit : light > r * 0.9 || y >= horizon ? deep : light > r * 0.3 && dither(x, y) < 8 ? shade : leaf);
    }
  }
  for (let k = 0; k < r; k++) put(cx + Math.round(r * 0.3) + (k % 3) - 1, cy - Math.round(r * 0.5) + Math.floor(k / 3), lit);
}

function grassPatches(colour, count) {
  for (let n = 0; n < count; n++) {
    const cy = horizon + 4 + Math.floor(rand() * (H - horizon)), depth = depthOf(cy);
    const rx = 4 + Math.floor(rand() * 10 * (0.5 + depth)), ry = Math.max(1, Math.round(rx * (0.15 + depth * 0.2)));
    const cx = Math.floor(rand() * W);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 1 && (d < 0.6 || dither(x, y) < 8)) put(x, y, colour);
      }
    }
  }
}

function flowerClusters(count) {
  for (let n = 0; n < count; n++) {
    const cy = horizon + 4 + Math.floor(rand() * (H - horizon - 4)), cx = Math.floor(rand() * W);
    const [petal, heart] = S.flowers[Math.floor(rand() * S.flowers.length)];
    const depth = depthOf(cy);
    for (let k = 0, c = 2 + Math.floor(rand() * 4); k < c; k++) {
      const x = cx + Math.round((rand() - 0.5) * (6 + depth * 10)), y = cy + Math.round((rand() - 0.5) * (2 + depth * 4));
      if (depth > 0.55) { put(x - 1, y, petal); put(x + 1, y, petal); put(x, y - 1, petal); put(x, y + 1, petal); put(x, y, heart); }
      else put(x, y, petal);
    }
  }
}

function rock(x, y, size) {
  const [lit, body, dark] = S.rock;
  if (size === 1) { put(x, y, body); put(x + 1, y, dark); put(x, y - 1, lit); return; }
  for (let dx = -1; dx <= 2; dx++) put(x + dx, y, dark);
  for (let dx = -1; dx <= 1; dx++) put(x + dx, y - 1, body);
  put(x + 2, y - 1, dark); put(x, y - 2, lit); put(x - 1, y - 1, lit); put(x + 1, y - 2, body);
}

/* ---------- the Shrine ---------- */

function shrineBackdrop() {
  // a far wall of misty pines
  const [far, farDark] = S.farForest;
  for (let x = -6; x < W + 6; x += 4 + Math.floor(rand() * 4)) pine(x, horizon - 12 - Math.floor(rand() * 8), 5 + Math.floor(rand() * 3), far, farDark);
  // light falls through the canopy in slanted shafts
  if (S.shafts) {
    for (let y = 0; y < horizon + 20 && y < H; y++) {
      for (let x = 0; x < W; x++) {
        const band = ((x + y * 0.55) % 46 + 46) % 46;
        if (band < 7 && dither(x, y) < (band < 3 ? 6 : 3)) tint(x, y, 1.06, 14);
      }
    }
  }
  // the gate, framed by nearer trees, with a stone lantern either side
  const gx = Math.round(W * 0.52), size = Math.max(12, Math.round(Math.min(W * 0.4, horizon * 0.72)));
  torii(gx, horizon + 1, size);
  life.lanterns = [];
  for (const dx of [-0.95, 0.95]) lantern(gx + Math.round(dx * size), horizon + 2, Math.max(4, Math.round(size * 0.28)));
  for (let x = -4; x < W + 6; x += 7 + Math.floor(rand() * 8)) {
    if (Math.abs(x - gx) < size * 0.8) continue;   // keep the gate clear
    pine(x, horizon - 4 - Math.floor(rand() * 6), 6 + Math.floor(rand() * 4), S.trees[1], S.trees[2], true);
  }
}

/** A pine of three overlapping tiers, each wider than the one above, lit on its left. */
function pine(cx, top, half, lit, dark, trunk = false) {
  const tiers = 3, tierH = Math.max(3, Math.round(half * 1.1));
  let y = top;
  for (let i = 0; i < tiers; i++) {
    const widest = Math.round(half * (0.45 + 0.55 * (i / (tiers - 1))));
    for (let k = 0; k < tierH; k++) {
      const w = Math.round((k / (tierH - 1)) * widest);
      for (let x = -w; x <= w; x++) solid(cx + x, y + k, x > 0 || (k === tierH - 1 && dither(x, k) < 8) ? dark : lit);
    }
    y += Math.round(tierH * 0.6);
  }
  const foot = trunk ? horizon + 1 : y + tierH;
  for (let yy = y + Math.round(tierH * 0.4); yy <= foot; yy++) { solid(cx, yy, S.trunk[0]); solid(cx + 1, yy, S.trunk[1]); }
}

function torii(cx, foot, size) {
  const [red, shade, deep] = S.torii;
  const halfW = Math.round(size * 0.55), post = Math.max(1, Math.round(size / 10)), topY = foot - size;
  for (const side of [-1, 1]) {
    const x0 = cx + side * Math.round(halfW * 0.72);
    for (let y = topY + 2; y <= foot; y++) for (let k = 0; k < post + 1; k++) solid(x0 + k - Math.floor(post / 2), y, k === post ? shade : red);
  }
  // the curved top beam (kasagi) overhangs, with a dark underside
  for (let x = -halfW - 2; x <= halfW + 2; x++) {
    const lift = Math.abs(x) > halfW - 1 ? 1 : 0;
    solid(cx + x, topY - lift, deep); solid(cx + x, topY + 1 - lift, red); solid(cx + x, topY + 2 - lift, shade);
  }
  // the lower tie beam (nuki)
  const tie = topY + Math.max(4, Math.round(size * 0.25));
  for (let x = -halfW; x <= halfW; x++) { solid(cx + x, tie, red); solid(cx + x, tie + 1, shade); }
}

function lantern(cx, foot, size) {
  const [lit, body, dark] = S.lantern;
  const h = size * 2;
  for (let y = 0; y < h; y++) {
    const yy = foot - y;
    let w = y < 2 ? 2 : y < h * 0.45 ? 1 : y < h * 0.7 ? 2 : y < h * 0.8 ? 3 : 1;
    for (let x = -w; x <= w; x++) solid(cx + x, yy, x > 0 ? dark : x === -w ? lit : body);
  }
  const lightY = foot - Math.round(h * 0.6);
  life.lanterns.push({ x: cx, y: lightY });
  put(cx, lightY, dark); put(cx - 1, lightY, dark);
}

function mossGround() {
  bands(horizon, H, S.ground, 0.8);
  grassPatches(S.patch, Math.round(W / 9));
  // a worn stone path up to the gate, stepping stones getting bigger closer in
  // stepping stones wind from the gate towards you, bigger and further apart closer in
  const gx = Math.round(W * 0.52);
  const [lit, body, dark] = S.stone;
  for (let y = horizon + 4, side = 1; y < H; side = -side) {
    const depth = depthOf(y), rx = 1.5 + depth * 6, ry = 0.8 + depth * 2.2;
    const cx = gx - Math.round(W * 0.16 * depth * depth) + side * Math.round(1 + depth * 4);
    for (let yy = -Math.ceil(ry); yy <= Math.ceil(ry); yy++) for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
      const d = (x / rx) ** 2 + (yy / ry) ** 2;
      if (d <= 1) put(cx + x, y + yy, yy === Math.ceil(ry) || d > 0.75 && x > 0 ? dark : yy < 0 && x < 0 ? lit : body);
    }
    y += Math.round(ry * 2 + 2 + depth * 4);
  }
  for (let n = 0; n < Math.max(4, Math.round(W / 28)); n++) {
    const y = horizon + 6 + Math.floor(rand() * (H - horizon - 8));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.4 ? 2 : 1);
  }
  flowerClusters(Math.round(W / 30));
}

function shrineFront() {
  for (let x = 0; x < W; x++) if (dither(x, horizon + 2) < 10) put(x, horizon + 2, S.trees[3]);
}

/* ---------- the Wastes ---------- */

function volcanoBackdrop() {
  ridge(horizon - 7, 5, 9, 0.7, S.mountains, true, true);
  // the volcano: a broad cone with a flat, glowing crater
  const cx = Math.round(W * 0.5), baseHalf = Math.round(Math.min(W * 0.36, horizon * 1.3)), height = Math.round(horizon * 0.78);
  const crater = Math.max(4, Math.round(baseHalf * 0.12));
  const [lit, body, shade] = S.volcano;
  const peak = horizon - height;
  const halfAt = (y) => crater + Math.round((baseHalf - crater) * Math.pow((y - peak) / height, 1.4));
  for (let y = peak; y < horizon; y++) {
    const half = halfAt(y);
    for (let x = -half; x <= half; x++) {
      const u = x / half;   // -1 left edge (lit) .. 1 right edge (shade)
      const ridgeLine = Math.abs(((x * 0.9 + y * 0.35) % 7 + 7) % 7) < 1 && y > peak + 3;   // erosion gullies
      solid(cx + x, y, u < -0.7 || (u < -0.35 && dither(x, y) < 6) ? lit : u > 0.25 && (u > 0.55 || dither(x, y) < 9) ? shade : ridgeLine ? shade : body);
    }
    solid(cx - half - 1, y, S.volcano[2]);
  }
  for (let x = -crater; x <= crater; x++) solid(cx + x, peak, S.lava[3]);
  life.volcano = { x: cx, y: peak, crater, height };
  // lava runs down the slope (all the way when it's erupting)
  life.flows = [];
  const sides = S.raw.erupting ? [-0.55, 0.1, 0.6] : [0.2];
  for (const side of sides) {
    const path = [];
    for (let y = peak + 1; y < horizon && (S.raw.erupting || y < peak + height * 0.3); y++) {
      const wobble = Math.round(Math.sin(y / 3 + side * 9));
      path.push([cx + Math.round(side * halfAt(y)) + wobble, y]);
    }
    life.flows.push(path);
  }
  for (const path of life.flows) for (const [x, y] of path) { put(x, y, S.lava[3]); put(x + 1, y, S.volcano[2]); }
}

function basalt() {
  bands(horizon, H, S.ground, 0.8);
  // rough patches and rubble
  grassPatches(S.ground[S.ground.length - 1], Math.round(W / 12));
  for (let n = 0; n < Math.round(W / 14); n++) {
    const y = horizon + 4 + Math.floor(rand() * (H - horizon - 5));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.35 ? 2 : 1);
  }
  // cracks with lava deep inside: random walks, wider closer in
  life.cracks = [];
  const count = Math.round((W / 9) * (0.6 + S.raw.crackGlow * 0.4));
  const walk = (x, y, len, dir, k0, depth) => {
    for (let k = 0; k < len; k++) {
      x += rand() < 0.75 ? dir : 0;
      if (rand() < 0.3) y += rand() < 0.5 ? -1 : 1;
      if (y <= horizon + 2 || y >= H) return;
      put(x, y + 1, S.rock[2]);
      life.cracks.push([x, y, k0 + k]);
      if (depth < 1 && k > 3 && rand() < 0.08) walk(x, y, Math.floor(len * 0.5), rand() < 0.5 ? -dir : dir, k0 + k, depth + 1);
    }
  };
  for (let n = 0; n < count; n++) {
    const y = horizon + 3 + Math.floor(rand() * (H - horizon - 4));
    walk(Math.floor(rand() * W), y, 8 + Math.floor(rand() * (12 + depthOf(y) * 30)), rand() < 0.5 ? -1 : 1, 0, 0);
  }
  for (const [x, y] of life.cracks) put(x, y, S.lava[2]);
}

/* ---------- the menus' Fire scene: a canyon at sunset ---------- */

/** A flat-topped butte: sheer sides banded with strata, lit on the left, spreading into rubble at its foot. */
function mesa(cx, top, half, [lit, body, strata, shade]) {
  for (let y = top; y < horizon; y++) {
    const k = (y - top) / Math.max(1, horizon - top);
    const w = Math.round(half * (1 + (k > 0.7 ? (k - 0.7) * 1.8 : 0)));
    for (let x = -w; x <= w; x++) {
      const u = x / w;
      solid(cx + x, y, y === top || u < -0.75 ? lit : u > 0.5 && (u > 0.75 || dither(x, y) < 8) ? shade : (y - top) % 5 === 3 && k < 0.7 ? strata : body);
    }
  }
}

function canyonBackdrop() {
  ridge(horizon - 5, 3, 10, 1.3, S.farMesas, false, true);
  const [far, farDark] = S.farMesas;
  for (const [at, rise, width] of [[0.2, 0.3, 0.06], [0.45, 0.22, 0.1], [0.74, 0.34, 0.05]]) {
    mesa(Math.round(W * at), horizon - Math.round(horizon * rise), Math.max(3, Math.round(W * width)), [far, far, farDark, farDark]);
  }
  for (const [at, rise, width] of [[0.06, 0.42, 0.09], [0.36, 0.26, 0.12], [0.6, 0.48, 0.07], [0.99, 0.36, 0.08]]) {
    mesa(Math.round(W * at), horizon - Math.round(horizon * rise), Math.max(4, Math.round(W * width)), S.mesas);
  }
}

function desert() {
  bands(horizon, H, S.ground, 0.8);
  grassPatches(S.ground[S.ground.length - 1], Math.round(W / 14));
  for (let n = 0; n < Math.round(W / 16); n++) {
    const y = horizon + 4 + Math.floor(rand() * (H - horizon - 5));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.35 ? 2 : 1);
  }
  for (let n = 0; n < Math.max(4, Math.round(W / 28)); n++) {
    const y = horizon + 3 + Math.floor(rand() * (H - horizon) * 0.6);
    cactus(Math.floor(rand() * W), y, 4 + Math.round(depthOf(y) * 16));
  }
  campfireBase(Math.round(W * 0.15), horizon + Math.round((H - horizon) * 0.42));
}

function cactus(x, foot, h) {
  const [lit, body, shade] = S.cactus;
  for (let y = 0; y < h; y++) { solid(x, foot - y, y === h - 1 ? body : lit); solid(x + 1, foot - y, shade); }
  if (h < 6) return;
  const arm = Math.max(2, Math.round(h * 0.3));
  const left = foot - Math.round(h * 0.4), right = foot - Math.round(h * 0.58);
  solid(x - 1, left, body); solid(x - 2, left, body);
  for (let k = 1; k <= arm; k++) solid(x - 2, left - k, lit);
  solid(x + 2, right, shade); solid(x + 3, right, shade);
  for (let k = 1; k <= arm - 1; k++) solid(x + 3, right - k, shade);
}

/** The fire's ring of stones, its crossed logs and the warm light it throws on the sand. */
function campfireBase(fx, fy) {
  const size = Math.max(4, Math.round(H * 0.06));
  life.fire = { x: fx, y: fy, size };
  for (let y = -size * 2; y <= size * 2; y++) for (let x = -size * 4; x <= size * 4; x++) {
    const d = (x / (size * 4)) ** 2 + (y / (size * 1.6)) ** 2;
    if (d < 1 && dither(x, y) < (d < 0.35 ? 12 : 5)) tint(fx + x, fy + y, 1.12, 22);
  }
  const [log, logDark, logEnd] = S.logs;
  for (let k = -size; k <= size; k++) {
    put(fx + k, fy - Math.round(k * 0.3), k > 0 ? logDark : log);
    put(fx + k, fy + Math.round(k * 0.3) - 1, k < 0 ? logDark : log);
  }
  put(fx - size, fy + Math.round(size * 0.3), logEnd); put(fx + size, fy - Math.round(size * 0.3), logEnd);
  const [lit, body, dark] = S.stone;
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2, x = fx + Math.round(Math.cos(ang) * (size + 2)), y = fy + Math.round(Math.sin(ang) * (size * 0.45 + 1));
    put(x, y, body); put(x + 1, y, dark); put(x, y - 1, lit);
  }
}

/* ---------- the menus' Water scene: a seaside ---------- */

function seaBackdrop() {
  // a far island with a striped lighthouse
  const ix = Math.round(W * 0.2), half = Math.max(8, Math.round(W * 0.11)), h = Math.max(4, Math.round(horizon * 0.14));
  const [lit, body, shade] = S.island;
  for (let x = -half; x <= half; x++) {
    const top = horizon - Math.round(h * Math.pow(Math.cos((x / half) * Math.PI / 2), 0.6) * (1 + 0.12 * Math.sin(x / 3)));
    for (let y = top; y < horizon; y++) solid(ix + x, y, y === top ? lit : x > half * 0.3 && dither(x, y) < 10 ? shade : body);
  }
  const [white, red, grey] = S.tower;
  const lx = ix - Math.round(half * 0.25), foot = horizon - Math.round(h * 0.85), top = foot - Math.max(6, Math.round(h * 1.3));
  for (let y = top; y <= foot; y++) { const c = Math.floor((y - top) / 2) % 2 ? red : white; solid(lx, y, c); solid(lx + 1, y, c); }
  for (let x = -1; x <= 2; x++) solid(lx + x, top - 1, grey);
  solid(lx, top - 2, red); solid(lx + 1, top - 2, red); solid(lx, top - 3, grey);
  life.beacon = { x: lx, y: top - 2 };
}

function beach() {
  const shore = life.shore = horizon + Math.round((H - horizon) * 0.5);
  bands(horizon, shore, S.sea, 1);
  for (let n = 0, count = Math.round(W * (shore - horizon) / 26); n < count; n++) {
    const y = horizon + 1 + Math.floor(rand() * (shore - horizon - 1)), near = (y - horizon) / (shore - horizon);
    const x = Math.floor(rand() * W), len = 1 + Math.round(near * 5 * rand()), c = rand() < 0.5 ? S.ripple[0] : S.ripple[1];
    for (let k = 0; k < len; k++) put(x + k, y, c);
  }
  if (life.sun) {
    for (let y = horizon; y < shore; y++) {
      const spread = 1 + Math.round((y - horizon) * 0.14);
      for (let x = -spread; x <= spread; x++) if (dither(x, y) < 2) put(life.sun.x + x, y, S.glint[1]);
    }
  }
  bands(shore, H, S.sand, 1);
  for (let x = 0; x < W; x++) for (let y = shore; y < shore + 3; y++) if (y === shore || dither(x, y) < 10 - (y - shore) * 4) put(x, y, S.wet[y === shore ? 1 : 0]);
  for (let n = 0; n < Math.round(W / 10); n++) {
    const y = shore + 5 + Math.floor(rand() * Math.max(1, H - shore - 5)), x = Math.floor(rand() * W);
    if (rand() < 0.3) rock(x, y, depthOf(y) > 0.7 ? 2 : 1);
    else { const c = S.shells[Math.floor(rand() * S.shells.length)]; put(x, y, c); if (depthOf(y) > 0.7) put(x + 1, y, c); }
  }
  umbrella(Math.round(W * 0.84), shore + Math.round((H - shore) * 0.55), Math.max(5, Math.round(H * 0.06)));
}

/** A striped beach umbrella leaning into the sand, with its shadow. */
function umbrella(x, foot, r) {
  const [white, red] = S.tower;
  for (let y = 0; y < r * 2; y++) put(x + Math.round(y * 0.15), foot - y, S.sail[2]);
  const cx = x + Math.round(r * 0.3), cy = foot - r * 2, rx = Math.round(r * 1.6);
  for (let y = -r; y <= 0; y++) for (let dx = -rx; dx <= rx; dx++) {
    if ((dx / rx) ** 2 + (y / r) ** 2 > 1) continue;
    put(cx + dx, cy + y, Math.floor((dx + rx) / Math.max(1, Math.round(r * 0.55))) % 2 ? white : red);
  }
  for (let dx = -r; dx <= r; dx++) for (let dy = 0; dy <= 1; dy++) if (dither(dx, dy) < 10) tint(x + dx + 2, foot + dy, 0.85);
}

/* ---------- the menus' Grass scene: a jungle ---------- */

function jungleBackdrop() {
  ridge(horizon - Math.round(horizon * 0.4), 5, 6, 0.9, S.farForest, false);
  for (let y = 0; y < horizon + 10 && y < H; y++) {
    for (let x = 0; x < W; x++) {
      const band = ((x + y * 0.5) % 40 + 40) % 40;
      if (band < 6 && dither(x, y) < (band < 3 ? 6 : 3)) tint(x, y, 1.07, 16);
    }
  }
  treeLine();
}

function jungleFloor() {
  bands(horizon, H, S.ground, 0.8);
  grassPatches(S.patch, Math.round(W / 8));
  for (let n = 0; n < Math.max(2, Math.round(W / 50)); n++) {
    const y = horizon + 6 + Math.floor(rand() * (H - horizon - 8));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.5 ? 2 : 1);
  }
  flowerClusters(Math.round(W / 16));
  for (let n = 0; n < Math.round(W / 14); n++) {
    const y = horizon + 3 + Math.floor(rand() * (H - horizon - 3));
    fern(Math.floor(rand() * W), y, 2 + Math.round(depthOf(y) * 8));
  }
}

/** A fern: fronds arching out from one spot and drooping at the tips, with leaflets along them. */
function fern(x, foot, size) {
  const [lit, body, dark] = S.fern;
  for (const a of [-1.3, -0.75, -0.25, 0.25, 0.75, 1.3]) {
    for (let s = 1; s <= size; s++) {
      const fx = x + Math.sin(a) * s, fy = foot - Math.cos(a) * s * 0.9 + (s / size) ** 2 * size * 0.55;
      put(fx, fy, a < 0 ? lit : body);
      if (s % 2 === 0 && s < size) put(fx, fy - 1, a < 0 ? body : dark);
    }
  }
}

/** The giant trunks and the canopy overhead, then big leaves close in at the bottom corners. */
function jungleFront() {
  const [lit, body, shade] = S.bark;
  for (const at of [0.05, 0.27, 0.74, 0.95]) {
    const cx = Math.round(W * at + (rand() - 0.5) * W * 0.04), half = Math.max(2, Math.round(W * (0.014 + rand() * 0.012)));
    const foot = horizon + Math.round((H - horizon) * (0.12 + rand() * 0.2));
    for (let y = 0; y <= foot; y++) {
      const flare = y > foot - half * 3 ? Math.round((y - (foot - half * 3)) * 0.7) : 0;   // buttress roots
      for (let x = -half - flare; x <= half + flare; x++) {
        const u = x / (half + flare);
        solid(cx + x, y, u < -0.55 ? lit : u > 0.45 ? shade : (x + 40) % 3 === 0 && dither(x, y) < 10 ? shade : body);
      }
    }
    for (let y = foot; y <= foot + 2; y++) for (let x = -half * 3; x <= half * 3; x++) if (dither(x, y) < 7) tint(cx + x, y, 0.8);
  }
  const [clit, cbody, cshade, cdeep] = S.canopy;
  const deep = Math.round(horizon * 0.3);
  for (let n = 0, count = Math.round(W / 3); n < count; n++) {
    const cx = Math.floor(rand() * W), cy = Math.floor(rand() * deep * 0.8), r = 3 + Math.floor(rand() * 6);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const light = x - y;
      solid(cx + x, cy + y, light > r * 0.8 ? clit : light < -r * 0.9 ? cdeep : light < -r * 0.2 && dither(x, y) < 8 ? cshade : cbody);
    }
  }
  life.canopyDeep = deep;
  for (const [x0, dir] of [[-2, 1], [W + 1, -1]]) {
    for (const [ang, len] of [[-0.9, 0.2], [-0.45, 0.26], [-0.1, 0.18]]) bigLeaf(x0, H + 2, Math.round(H * len), dir > 0 ? ang : -Math.PI - ang);
  }
}

/** A long pointed leaf from (x, y) at an angle, its halves in two greens around a pale midrib. */
function bigLeaf(x, y, len, ang) {
  const [lit, body, edge, rib] = S.leaf;
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  for (let s = 0; s <= len; s++) {
    const w = Math.sin(Math.PI * Math.min(1, s / len * 1.1)) * len * 0.22;
    for (let k = -w; k <= w; k += 0.5) {
      const c = Math.abs(k) < 0.5 ? rib : Math.abs(k) > w - 1 ? edge : k < 0 ? lit : body;
      solid(x + ux * s + nx * k, y + uy * s + ny * k, c);
    }
  }
}

/* ============================================================
   THE LIVING PARTS
   ============================================================ */

/* ---------- the Pokémon Center: Chansey behind the counter, the healing machine beside it ---------- */

const counterTop = () => horizon + 2;
const COUNTER_TALL = 14;   // surface and front, down to the floor

function centerBackdrop() {
  const [shadow, ceiling, lamp] = S.ceiling, [face, low, seam, shine] = S.wall, [red, dark, base, trim] = S.wainscot;
  const cx = W >> 1, ceil = 4, rail = horizon - 10;
  for (let y = 0; y < ceil; y++) for (let x = 0; x < W; x++) solid(x, y, y === ceil - 1 ? shadow : ceiling);
  for (let x = ((cx - 4) % 26) - 26; x < W; x += 26) for (let k = 0; k < 8; k++) solid(x + k, 1, lamp);
  // the big wall panels, like the anime's Centers
  const pw = 14, ph = Math.max(5, Math.floor((rail - ceil) / Math.max(2, Math.round((rail - ceil) / 16))));
  for (let y = ceil; y < rail; y++) for (let x = 0; x < W; x++) {
    const lx = ((x - cx - 7) % pw + pw) % pw, ly = (y - ceil) % ph;
    solid(x, y, lx === 0 || ly === 0 ? seam : ly === 1 ? shine : ly === ph - 1 || lx === pw - 1 ? low : face);
  }
  for (let y = rail; y < horizon; y++) for (let x = 0; x < W; x++) {
    solid(x, y, y === rail ? trim : y === horizon - 1 ? base : ((x - cx) % 12 + 12) % 12 === 6 ? dark : red);
  }
  const midY = Math.round((ceil + rail) / 2);
  wallTv(cx - 25, midY);
  wallMap(cx + 25, midY);
}

/** A TV on the wall showing a Poké Ball, its scanline rolls (drawCenter). */
function wallTv(x, y) {
  const [frame, screen, glare] = S.tv;
  const x0 = x - 7, x1 = x + 7, y0 = y - 5, y1 = y + 4;
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    const edge = i === x0 || i === x1 || j === y0 || j === y1;
    solid(i, j, edge ? frame : (i - x0) + (j - y0) < 4 ? glare : screen);
  }
  ball(x, y, 3);
  life.tv = { x0: x0 + 1, x1: x1 - 1, y0: y0 + 1, y1: y1 - 1 };
}

/** A framed map of the region, like the one in the reference. */
function wallMap(x, y) {
  const [sea, land, sand, wood] = S.map, r = seeded(W + 7);
  const x0 = x - 8, x1 = x + 8, y0 = y - 5, y1 = y + 4;
  const blobs = [[x - 3, y - 1, 3], [x + 3, y + 1, 3], [x + 1, y - 2, 2]].map(([bx, by, br]) => [bx + Math.round(r() * 2 - 1), by, br]);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    if (i === x0 || i === x1 || j === y0 || j === y1) { solid(i, j, wood); continue; }
    const d = Math.min(...blobs.map(([bx, by, br]) => Math.hypot((i - bx) / br, (j - by) / (br * 0.8))));
    solid(i, j, d < 0.75 ? land : d < 1 ? sand : sea);
  }
}

/** Cream tiles in perspective, the wall's shadow along its foot, and a Poké Ball rug in front of the counter. */
function centerFloor() {
  const [a, b, grout] = S.tiles, cx = W / 2, vy = horizon - (H - horizon) * 1.5;
  const bottom = H - vy, ku = bottom / 12, kv = bottom * bottom / 7;
  for (let y = horizon; y < H; y++) {
    const dz = y - vy, v = Math.floor(kv / dz), line = v !== Math.floor(kv / (dz + 1));
    for (let x = 0; x < W; x++) {
      const u = (x - cx) * ku / dz, cell = Math.floor(u);
      put(x, y, line || u - cell < ku / dz ? grout : (cell + v) & 1 ? a : b);
    }
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.82); tint(x, horizon + 1, 0.92); }
  const foot = counterTop() + COUNTER_TALL, rx = Math.min(48, Math.round(W * 0.28));
  ballRug(W >> 1, Math.round(foot + (H - foot) * 0.45), rx, Math.max(4, Math.round(rx * 0.28)));
}

function ballRug(cx, cy, rx, ry) {
  const [body, edge, pale] = S.rug;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2;
    if (d > 1) continue;
    const e = (x / (rx * 0.42)) ** 2 + (y / (ry * 0.42)) ** 2;
    put(cx + x, cy + y, (e < 1 && (e > 0.7 || e < 0.16 || y === 0)) ? pale : d > 0.8 ? edge : body);
  }
}

/** A tiny Poké Ball: red top, white bottom, dark band and outline. */
function ball(cx, cy, r) {
  const [red, white, dark] = S.ball;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y);
    if (d > r + 0.4) continue;
    solid(cx + x, cy + y, d > r - 0.6 || y === 0 || (d < 1.6 && d >= 0.9) ? dark : d < 0.9 ? white : y < 0 ? red : white);
  }
}

/** Fill a little sprite from at(x, y) (a colour or null) with a dark outline around it, like the games' sprites. */
function sprite(ox, oy, [x0, x1, y0, y1], at, out) {
  for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
    const c = at(x, y);
    if (c) solid(ox + x, oy + y, c);
    else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) solid(ox + x, oy + y, out);
  }
}

function centerFront() {
  const cx = W >> 1, top = counterTop(), half = Math.max(34, Math.min(64, Math.round(W * 0.3)));
  chansey(cx, top - 3);
  counter(cx, top, half);
  const [out, , body] = S.chansey;
  sprite(cx, top - 3, [-10, 10, 2, 3], (x, y) => {   // its little hands resting on the counter
    const k = Math.abs(x);
    return (y === 3 && k >= 8 && k <= 10) || (y === 2 && k >= 9 && k <= 10) ? body : null;
  }, out);
  healMachine(cx + 12, top);
  counterPc(cx - 29, top);
  const foot = top + COUNTER_TALL - 1;
  for (const s of [-1, 1]) {
    pottedPlant(cx + s * (half + 7), foot, 4);
    if (cx - half > 44) pottedPlant(cx + s * (half + 30), foot + 6, 5);
  }
}

function chansey(cx, cy) {
  const [out, lit, body, shade, eye] = S.chansey, [white, grey, red] = S.cap;
  const at = (x, y) => {
    if (y >= -13 && y <= -9 && Math.abs(x) <= (y === -13 ? 3 : 4)) {   // the nurse cap and its red cross
      return (x === 0 && y >= -12 && y <= -10) || (y === -11 && Math.abs(x) === 1) ? red : y === -9 ? grey : white;
    }
    const k = Math.abs(x);
    const inBody = (x / 8.5) ** 2 + (y / 9.3) ** 2 <= 1
      || (k === 8 && (y === -4 || y === -5)) || (k === 9 && (y === -5 || y === -6)) || (k === 10 && y === -6);   // the curled tufts on its head
    if (!inBody) return null;
    if ((x + 3) ** 2 + (y + 5) ** 2 < 6) return lit;
    const lean = x * 0.7 + y * 0.4;
    return lean > 5 || (lean > 3.5 && dither(x, y) < 10) ? shade : body;
  };
  sprite(cx, cy, [-11, 11, -13, 9], at, out);
  for (const s of [-1, 1]) { solid(cx + 3 * s, cy - 3, eye); solid(cx + 3 * s, cy - 2, eye); }
  solid(cx - 1, cy, out); solid(cx + 1, cy, out); solid(cx, cy + 1, out);
  life.eyes = { x: cx, y: cy };
}

function counter(cx, top, half) {
  const [lit, body, lip] = S.counter, [cream, face, seam, base] = S.panel;
  for (let x = cx - half; x <= cx + half; x++) {
    const end = x === cx - half || x === cx + half;
    if (!end) solid(x, top, lit);
    solid(x, top + 1, body);
    solid(x, top + 2, lip);
    for (let y = top + 3; y < top + COUNTER_TALL; y++) {
      const groove = ((x - cx) % 16 + 16) % 16 === 8;
      solid(x, y, y === top + COUNTER_TALL - 1 ? base : y === top + 3 ? seam : y === top + 10 || y === top + 11 ? body
        : end || groove ? seam : y === top + 4 ? cream : face);
    }
  }
  for (let x = cx - half - 1; x <= cx + half + 1; x++) { tint(x, top + COUNTER_TALL, 0.8); tint(x, top + COUNTER_TALL + 1, 0.92); }
  ball(cx, top + 7, 3);
}

/* ---------- the Poké Mart, after the Gen 3 Marts: white walls under a teal band, glass fridges and
   a bare back wall, green octagon tiles and an orange mat at the door ---------- */

function martBackdrop() {
  const [top, band, face, stripe] = S.wall;
  const ceil = 3, shelfTop = ceil + Math.max(8, Math.round((horizon - ceil) * 0.3));
  for (let y = 0; y < shelfTop; y++) for (let x = 0; x < W; x++) {
    const d = shelfTop - y;
    solid(x, y, y < ceil ? top : y < ceil + 3 ? band : d === 3 || d === 4 ? stripe : face);
  }
  wallClock(Math.round(W * 0.14), ceil + 3 + Math.round((shelfTop - ceil - 7) / 2));
  // fridges down both sides; the middle of the wall stays bare, since the shop's real shelf stands there
  const unit = 24;
  for (let u = -6; u < W * 0.2; u += unit) fridge(u, shelfTop - 2, horizon, unit);
  for (let u = W + 6 - unit; u + unit > W * 0.8; u -= unit) fridge(u, shelfTop - 2, horizon, unit);
}

function wallClock(cx, cy) {
  const [rim, dial, hand] = S.clock;
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const d = Math.hypot(x, y);
    if (d <= 3.4) solid(cx + x, cy + y, d > 2.4 ? rim : dial);
  }
  solid(cx, cy, hand); solid(cx, cy - 1, hand); solid(cx + 1, cy, hand);
}

/** A glass drinks fridge: a grey frame round three doors of rows of green bottles. */
function fridge(x0, top, foot, w) {
  const [frame, glass, shine, bottle, dark] = S.fridge, doors = 3, dw = Math.floor((w - 2) / doors);
  for (let y = top; y < foot; y++) for (let x = x0; x < x0 + w; x++) {
    const lx = x - x0 - 1, door = Math.floor(lx / dw), dx = lx - door * dw;
    const edge = x === x0 || x === x0 + w - 1 || y === top || y === foot - 1 || dx === 0;
    if (edge) { solid(x, y, x === x0 ? dark : frame); continue; }
    const row = (y - top - 2) % 5, glint = (dx + (y - top)) % 9 === 3;
    solid(x, y, glint ? shine : row >= 2 && row <= 3 && dx % 2 === 1 ? bottle : glass);
  }
}

/** Green octagon tiles in perspective, the wall's shadow along its foot, and the orange mat by the door. */
function martFloor() {
  const [tile, corner, grout] = S.tiles, cx = W / 2, vy = horizon - (H - horizon) * 1.5;
  const bottom = H - vy, ku = bottom / 6, kv = bottom * bottom / 3.5;
  for (let y = horizon; y < H; y++) {
    const dz = y - vy, v = kv / dz, fv = v - Math.floor(v), ev = Math.min(fv, 1 - fv);
    for (let x = 0; x < W; x++) {
      const u = (x - cx) * ku / dz, fu = u - Math.floor(u), eu = Math.min(fu, 1 - fu);
      const line = eu < ku / dz * 0.6 || ev * dz * dz / kv < 0.6;
      put(x, y, eu + ev < 0.28 ? corner : line ? grout : tile);
    }
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.82); tint(x, horizon + 1, 0.92); }
  const [mat, trim] = S.mat, mw = Math.min(22, Math.round(W * 0.14)), my = H - 7;
  for (let y = my; y < my + 5; y++) for (let x = (W >> 1) - mw; x <= (W >> 1) + mw; x++) {
    put(x, y, y === my || y === my + 4 || Math.abs(x - (W >> 1)) === mw ? trim : mat);
  }
}

function martFront() {
  const foot = horizon + 4;
  pottedPlant(4, foot, 4);
  pottedPlant(W - 5, foot, 4);
}

/** The healing machine on the counter: a red hood over six ball slots, and a glowing cyan stripe (drawCenter). */
function healMachine(x0, top) {
  const [white, light, grey, slate] = S.machine, [lit, red, dark] = S.dome, [, , deep] = S.glow;
  for (let y = -4; y <= 0; y++) for (let x = -4; x <= 4; x++) {
    const d = x * x + y * y * 1.4;
    if (d <= 17) solid(x0 + 4 + x, top - 6 + y, d > 12 ? dark : x < -1 && y < -1 ? lit : red);
  }
  const slots = [];
  for (let x = x0 + 1; x <= x0 + 15; x++) {
    solid(x, top - 6, grey);
    const slot = (x - x0) % 2 === 0 && x > x0 + 2 && x < x0 + 15;
    solid(x, top - 5, slot ? deep : slate);
    if (slot) slots.push([x, top - 5]);
  }
  for (let y = top - 4; y <= top + 1; y++) for (let x = x0; x <= x0 + 16; x++) {
    const edge = x === x0 || x === x0 + 16 || y === top + 1;
    solid(x, y, y === top - 4 ? white : edge ? grey : light);
  }
  for (let x = x0 + 11; x <= x0 + 14; x++) for (let y = top - 2; y <= top - 1; y++) solid(x, y, S.screen[0]);
  solid(x0 + 3, top - 1, S.screen[1]); solid(x0 + 5, top - 1, S.plant[0]);
  life.machine = { x0: x0 + 1, x1: x0 + 15, y: top - 3, slots };
  life.spots = { ...life.spots, machine: { x0, x1: x0 + 16, y0: top - 11, y1: top + 1 } };
}

/** The PC on the counter, its cursor blinking (drawCenter). */
function counterPc(x0, top) {
  const [beige, tan, brown] = S.pc, [lite, blue] = S.screen;
  for (let y = top - 10; y <= top - 2; y++) for (let x = x0; x <= x0 + 10; x++) {
    const screen = x > x0 + 1 && x < x0 + 9 && y > top - 9 && y < top - 3;
    const edge = x === x0 || x === x0 + 10 || y === top - 10 || y === top - 2;
    solid(x, y, screen ? (y === top - 8 ? lite : blue) : edge ? tan : beige);
  }
  for (let x = x0 + 3; x <= x0 + 7; x++) solid(x, top - 6, lite);
  for (let x = x0 - 1; x <= x0 + 11; x++) solid(x, top - 1, x % 2 ? beige : brown);
  life.pc = { x: x0 + 3, y: top - 4 };
  life.spots = { ...life.spots, pc: { x0: x0 - 1, x1: x0 + 11, y0: top - 10, y1: top - 1 } };
}

function pottedPlant(x, foot, size) {
  const [leaf, dark, flower, pot, potDark] = S.plant, r = seeded(x * 31 + foot);
  const cy = foot - 4 - Math.round(size * 0.7);
  for (let y = -size; y <= size; y++) for (let k = -size - 1; k <= size + 1; k++) {
    const d = (k / (size + 1)) ** 2 + (y / size) ** 2;
    if (d <= 1 && r() > 0.08) solid(x + k, cy + y, k + y > size * 0.4 || (d > 0.6 && dither(k, y) < 6) ? dark : leaf);
  }
  for (let n = 0; n < size; n++) solid(x + Math.round((r() - 0.5) * size * 1.6), cy + Math.round((r() - 0.7) * size), flower);
  for (let y = foot - 3; y <= foot; y++) for (let k = -2; k <= 2; k++) solid(x + k, y, k === 2 || y === foot ? potDark : pot);
  for (let k = -3; k <= 3; k++) solid(x + k, foot - 4, k === 3 ? potDark : pot);
}

function makeLife() {
  const has = (name) => S.raw.life.includes(name);
  const meadowY = () => horizon + 6 + rand() * (H - horizon) * 0.7;

  if (has('clouds')) {
    life.clouds = [];
    const band = Math.max(8, Math.round(horizon * 0.75));
    for (let i = 0, n = Math.max(2, Math.round((W / 40) * S.raw.clouds.count)); i < n; i++) {
      const near = i % 2 === 0, w = near ? 18 + Math.floor(rand() * 16) : 10 + Math.floor(rand() * 8);
      life.clouds.push({
        x: rand() * (W + w * 2), y: 2 + Math.floor(rand() * Math.max(1, band - 10)), w, h: near ? 5 + Math.floor(rand() * 3) : 3,
        speed: near ? 0.22 + rand() * 0.12 : 0.08 + rand() * 0.06, near,
        shadowY: horizon + 8 + Math.floor(rand() * Math.max(1, H - horizon - 16)),
      });
    }
    life.clouds.sort((a, b) => a.near - b.near);
  }

  if (has('blades')) {
    life.blades = [];
    const density = S.raw.floor === 'moss' ? 0.6 : 1;
    for (let y = horizon + 4; y < H; y++) {
      const depth = depthOf(y);
      for (let n = 0, c = Math.round(W * (0.012 + depth * 0.035) * density); n < c; n++) {
        life.blades.push({ x: Math.floor(rand() * W), y, h: depth > 0.6 ? 3 : depth > 0.25 ? 2 : 1, twin: depth > 0.45 && rand() < 0.5 });
      }
    }
  }

  if (has('butterflies')) {
    life.butterflies = [];
    for (let i = 0, n = Math.max(2, Math.round(W / 70)); i < n; i++) {
      life.butterflies.push({ x: rand() * W, y: meadowY(), vx: (rand() < 0.5 ? -1 : 1) * (0.25 + rand() * 0.3), phase: rand() * 10, colour: S.butterflies[i % S.butterflies.length] });
    }
  }

  if (has('pollen')) {
    life.motes = [];
    for (let i = 0, n = Math.round(W / 8); i < n; i++) {
      life.motes.push({ x: rand() * W, y: horizon - 10 + rand() * (H - horizon + 10), vx: 0.1 + rand() * 0.2, vy: -0.03 - rand() * 0.06, phase: rand() * 20 });
    }
  }

  if (has('fireflies')) {
    life.fireflies = [];
    for (let i = 0, n = Math.round((W / 12) * (S.raw.fireflyCount || 1)); i < n; i++) {
      life.fireflies.push({ x: rand() * W, y: horizon - 6 + rand() * (H - horizon) * 0.8, phase: rand() * 60, drift: 0.05 + rand() * 0.1 });
    }
  }

  if (has('leaves')) {
    life.leaves = [];
    for (let i = 0, n = Math.round(W / 14); i < n; i++) {
      life.leaves.push({ x: rand() * W, y: rand() * H, vy: 0.25 + rand() * 0.3, phase: rand() * 30, colour: S.leaves[i % S.leaves.length] });
    }
  }

  if (has('wisps')) {
    life.wisps = [];
    for (let i = 0, n = Math.max(3, Math.round(W / 40)); i < n; i++) {
      life.wisps.push({ x: rand() * W, y: horizon - 14 + rand() * (H - horizon) * 0.6, phase: rand() * 60, vx: (rand() - 0.5) * 0.3 });
    }
  }

  if (has('embers')) {
    life.embers = [];
    for (let i = 0, n = Math.round((W / 7) * S.raw.embers); i < n; i++) {
      life.embers.push({ x: rand() * W, y: rand() * H, vy: 0.3 + rand() * 0.5, phase: rand() * 30 });
    }
  }

  if (has('ash')) {
    life.ash = [];
    for (let i = 0, n = Math.round(W / 6); i < n; i++) life.ash.push({ x: rand() * W, y: rand() * H, vy: 0.12 + rand() * 0.15, phase: rand() * 30 });
  }

  if (has('smoke')) {
    life.smoke = [];
    for (let i = 0; i < 20; i++) life.smoke.push({ age: i * 4.2 + rand() * 3, wobble: rand() * 10 });
  }

  life.flock = null;
  life.bolt = null;
  life.boltAt = -99;
  life.nextBolt = tick + FPS * 2;
  life.blobs = [];
  if (storm.on) makeRain();
  if (has('campfire')) life.sparks = [];
  if (has('surf')) {
    life.glints = [];
    for (let i = 0, n = Math.round(W * (life.shore - horizon) / 30); i < n; i++) {
      life.glints.push({ x: Math.floor(rand() * W), y: horizon + 1 + Math.floor(rand() * (life.shore - horizon - 2)), phase: rand() * 40 });
    }
    life.boat = { x: rand() * W };
  }
  if (has('vines')) {
    life.vines = [];
    for (let i = 0, n = Math.round(W / 9); i < n; i++) {
      life.vines.push({ x: Math.floor(rand() * W), y: Math.floor(life.canopyDeep * (0.4 + rand() * 0.5)), len: Math.round(horizon * (0.15 + rand() * 0.6)), phase: rand() * 20 });
    }
  }
}

/** Each drop lands on its own row of the ground (or falls past the bottom), splashes, and starts again at the top. */
function makeRain() {
  life.rain = [];
  for (let i = 0, n = Math.round((W * H / 130) * S.storm.count); i < n; i++) {
    life.rain.push({ x: rand() * (W + H * 0.5), y: rand() * H, land: horizon + rand() * (H - horizon + 6), speed: 0.8 + rand() * 0.4, phase: rand() * 30 });
  }
}

function draw() {
  px.set(base);
  if (storm.level > 0) stormLight();
  const t = tick, L = life, has = (name) => S.raw.life.includes(name);

  if (L.stars) for (const s of L.stars) { const b = Math.sin((t + s.phase) / 6); if (b > 0.6) { put(s.x - 1, s.y, S.sky[2]); put(s.x + 1, s.y, S.sky[2]); put(s.x, s.y - 1, S.sky[2]); put(s.x, s.y + 1, S.sky[2]); } if (b < -0.7) put(s.x, s.y, S.sky[1]); }

  if (L.sun && S.light === 'sun') {
    const { x: sx, y: sy, r } = L.sun, glow = 8 + Math.round(3 * Math.sin(t / 10));
    for (let y = -r * 2; y <= r * 2; y++) for (let x = -r * 2; x <= r * 2; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d > r && d <= r + 1.5 && dither(x, y) < glow) putSky(sx + x, sy + y, S.sun[2]);
    }
  }

  if (L.smoke) drawSmoke(t);
  if (L.clouds) {
    for (const c of L.clouds) {
      c.x += c.speed * (1 + 3 * storm.level);
      const x = (c.x % (W + c.w * 2)) - c.w;
      if (c.near && S.raw.clouds.shadows) cloudShadow(x, c);
      cloud(Math.round(x), c.y, c.w, c.h, c.near);
    }
  }

  if (has('birds')) {
    if (!L.flock && t % (FPS * 14) === FPS * 3) {
      L.flock = { x: -12, y: 4 + Math.floor(rand() * Math.max(1, horizon * 0.5)), birds: [[0, 0], [-5, 3], [-9, -2]].slice(0, 2 + Math.floor(rand() * 2)) };
    }
    if (L.flock) {
      L.flock.x += 0.9;
      for (const [dx, dy] of L.flock.birds) bird(L.flock.x + dx, L.flock.y + dy + Math.round(Math.sin((t + dx) / 3)), (t + dx) % 4 < 2);
      if (L.flock.x > W + 14) L.flock = null;
    }
  }

  if (L.flows) drawLava(t);
  if (has('eruption')) drawEruption(t);
  if (has('lightning') || storm.level > 0.6) drawLightning(t);
  if (has('mist')) drawMist(t);
  if (has('surf')) drawSea(t);

  if (L.blades) {
    const [tip, mid, root] = S.blade;
    for (const b of L.blades) {
      const wind = Math.sin(t / 5 - b.x / 9 + b.y / 23) + 0.6 * Math.sin(t / 13 - b.x / 31) + storm.level * 1.4;
      const lean = wind > 0.9 ? 1 : wind < -1.2 ? -1 : 0;
      put(b.x, b.y, root);
      if (b.h >= 2) put(b.x, b.y - 1, b.h === 2 ? tip : mid);
      put(b.x + lean, b.y - b.h, tip);
      if (b.twin) { put(b.x + 2, b.y, root); put(b.x + 2 + lean, b.y - 1, tip); }
    }
  }

  if (has('campfire')) drawCampfire(t);
  if (has('center')) drawCenter(t);
  if (has('vines')) drawVines(t);

  if (L.lanterns && S.raw.lanternsLit) {
    const [hot, warm, glow] = S.lanternGlow;
    for (const l of L.lanterns) {
      const f = Math.sin(t / 2 + l.x) + Math.sin(t / 5.3);
      put(l.x, l.y, f > -0.6 ? hot : warm); put(l.x - 1, l.y, warm);
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
        if ((x || y) && x * x + y * y <= 9 + f * 2 && dither(x + l.x, y + l.y) < 4) put(l.x + x, l.y + y, glow);
      }
    }
  }

  if (L.butterflies) {
    for (const f of L.butterflies) {
      f.x += f.vx;
      if (f.x < -4) f.x = W + 3; else if (f.x > W + 4) f.x = -3;
      const y = f.y + Math.sin((t + f.phase) / 4) * 2.5, open = (t + Math.round(f.phase)) % 3 !== 0;
      put(f.x, y, S.bird);
      if (open) { put(f.x - 1, y - 1, f.colour); put(f.x + 1, y - 1, f.colour); put(f.x - 1, y, f.colour); put(f.x + 1, y, f.colour); }
      else { put(f.x, y - 1, f.colour); put(f.x, y - 2, f.colour); }
    }
  }

  if (L.leaves) {
    for (const l of L.leaves) {
      l.y += l.vy; l.x += Math.sin((t + l.phase) / 5) * 0.45 + 0.08;
      if (l.y > H + 2) { l.y = -2; l.x = rand() * W; }
      if (l.x > W + 2) l.x = -2;
      const [a, b] = l.colour, flip = Math.floor((t + l.phase) / 3) % 2;
      put(l.x, l.y, a); put(l.x + (flip ? 1 : -1), l.y + (flip ? 0 : 1), b);
    }
  }

  if (L.fireflies) {
    for (const f of L.fireflies) {
      const x = f.x + Math.sin((t + f.phase) / 11) * 5 + t * f.drift % W, y = f.y + Math.sin((t + f.phase) / 7) * 3;
      const xx = ((x % W) + W) % W, glow = Math.sin((t + f.phase) / 4);
      if (glow > 0.1) {
        put(xx, y, S.firefly[0]);
        if (glow > 0.7) { put(xx - 1, y, S.firefly[1]); put(xx + 1, y, S.firefly[1]); put(xx, y - 1, S.firefly[1]); put(xx, y + 1, S.firefly[1]); }
      }
    }
  }

  if (L.wisps) {
    const [core, body, trail] = S.wisp;
    for (const w of L.wisps) {
      w.x += w.vx;
      if (w.x < -6) w.x = W + 5; else if (w.x > W + 6) w.x = -5;
      const x = w.x + Math.sin((t + w.phase) / 9) * 3, y = w.y + Math.sin((t + w.phase) / 6) * 4;
      for (let k = 1; k <= 4; k++) if (dither(Math.round(x), Math.round(y) + k) < 12 - k * 3) put(x + Math.sin((t - k * 2 + w.phase) / 9) * 2, y + k + 1, trail);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const d = dx * dx + dy * dy;
        if (d <= 1) put(x + dx, y + dy, d ? body : core);
        else if (d <= 5 && dither(dx + t, dy) < 6) put(x + dx, y + dy, trail);
      }
    }
  }

  if (L.motes) {
    for (const m of L.motes) {
      m.x += m.vx; m.y += m.vy + Math.sin((t + m.phase) / 6) * 0.05;
      if (m.x > W + 2) m.x = -2;
      if (m.y < horizon - 14) m.y = H - 1;
      const s = Math.sin((t + m.phase) / 5);
      if (s > 0.2) put(m.x, m.y, s > 0.8 ? S.pollen[0] : S.pollen[1]);
    }
  }

  if (L.ash) {
    for (const a of L.ash) {
      a.y += a.vy; a.x += 0.15 + Math.sin((t + a.phase) / 8) * 0.1;
      if (a.y > H + 1) { a.y = -1; a.x = rand() * W; }
      if (a.x > W + 1) a.x = -1;
      put(a.x, a.y, S.ash[(a.phase | 0) % 2]);
    }
  }

  if (L.embers) {
    for (const e of L.embers) {
      e.y -= e.vy; e.x += Math.sin((t + e.phase) / 4) * 0.35;
      if (e.y < -1) { e.y = H + 1; e.x = rand() * W; }
      const f = Math.sin((t + e.phase) / 2.5);
      if (f > -0.4) put(e.x, e.y, S.ember[f > 0.6 ? 0 : f > 0 ? 1 : 2]);
    }
  }

  if (life.rain && storm.level > 0) drawRain(t);

  ctx.putImageData(img, 0, 0);
}

/* ---------- clouds, birds, weather ---------- */

/** A pixel cumulus: puffs on a flat base, lit on top and shaded underneath; far ones are smaller and greyer. */
function cloud(x0, y0, w, h, near) {
  const [lit, body, shade, under] = near ? S.cloud : [S.cloud[1], S.cloud[2], S.cloud[3], S.cloud[3]];
  const puffs = near ? [[0.2, 0.55], [0.42, 1], [0.65, 0.8], [0.84, 0.5]] : [[0.3, 0.7], [0.62, 1]];
  const floor = y0 + h;
  for (let x = x0 + 1; x < x0 + w - 1; x++) { putSky(x, floor, under); putSky(x, floor - 1, shade); }
  for (const [at, size] of puffs) {
    const r = Math.max(2, Math.round(h * size * 0.8)), cx = x0 + Math.round(w * at), cy = floor - 2;
    for (let y = -r; y <= 1; y++) {
      const half = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      for (let x = -half; x <= half; x++) putSky(cx + x, cy + y, y >= 0 ? shade : x + y > r * 0.4 || y < -r * 0.6 ? lit : body);
    }
  }
}

/** The near clouds' shadows: flattened dithered ovals that darken the ground as they pass. */
function cloudShadow(x, c) {
  const rx = c.w * 0.9, ry = Math.max(2, c.w * 0.18), cx = x + c.w / 2 - (c.shadowY - horizon) * 0.3, cy = c.shadowY;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    for (let xx = Math.floor(cx - rx); xx <= cx + rx; xx++) {
      const d = ((xx - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1 && (d < 0.4 || dither(xx, y) < 6) && y > horizon + 3) tint(xx, y, 0.92);
    }
  }
}

function bird(x, y, up) {
  const c = S.bird;
  putSky(x, y, c);
  if (up) { putSky(x - 1, y - 1, c); putSky(x - 2, y - 1, c); putSky(x + 1, y - 1, c); putSky(x + 2, y - 1, c); }
  else { putSky(x - 1, y, c); putSky(x - 2, y + 1, c); putSky(x + 1, y, c); putSky(x + 2, y + 1, c); }
}

/** Mist banks drifting along the foot of the trees: they lighten (and wash out) what's behind. */
function drawMist(t) {
  for (let y = horizon - 8; y < horizon + 14 && y < H; y++) {
    const fade = 1 - Math.abs(y - horizon - 2) / 12;
    for (let x = 0; x < W; x++) {
      const m = Math.sin((x + t * 0.5) / 13 + y * 0.6) + Math.sin((x - t * 0.3) / 7 + y * 0.2);
      if (m > 1.1 - fade * 0.6 && dither(x, y) < 3 + fade * 9) tint(x, y, 0.8, S.mist);
    }
  }
}

/** Grey puffs rising from the crater and bending away on the wind. */
function drawSmoke(t) {
  const v = life.volcano;
  if (!v) return;
  const erupting = S.raw.erupting;
  for (const p of life.smoke) {
    const age = (p.age + t * (erupting ? 0.9 : 0.5)) % 84;
    const rise = age * (erupting ? 1.1 : 0.7), r = 2.5 + age * (erupting ? 0.22 : 0.16);
    const x = v.x + Math.sin((age + p.wobble) / 9) * 2 + age * age * 0.012, y = v.y - 2 - rise;
    if (y < -r) continue;
    const shade = S.smoke[Math.min(3, Math.floor(age / 24))];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = dx * dx + dy * dy;
      if (d <= r * r && (d < r * r * 0.5 || dither(x + dx, y + dy) < 7)) putSky(x + dx, y + dy, shade);
    }
  }
  // the crater's glow
  const glow = Math.sin(t / 4) > 0 ? S.lava[1] : S.lava[2];
  for (let dx = -v.crater + 1; dx < v.crater; dx++) put(v.x + dx, v.y, dither(dx, t) < 8 ? glow : S.lava[3]);
}

/** Lava breathing in the cracks and running down the volcano. */
function drawLava(t) {
  const L = life, glow = S.raw.crackGlow;
  if (L.cracks) {
    for (let i = 0; i < L.cracks.length; i++) {
      const [x, y, k] = L.cracks[i];
      const b = Math.sin(t / 4 - k / 3 + (i % 7)) * 0.7 + glow * 0.5;
      put(x, y, b > 0.9 ? S.lava[0] : b > 0.35 ? S.lava[1] : S.lava[2]);
      if (b > 1.05 && dither(x, y) < 6) put(x, y - 1, S.lava[3]);
    }
  }
  for (const path of L.flows || []) {
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i], b = Math.sin(i / 3 - t / 2);
      put(x, y, b > 0.6 ? S.lava[0] : b > -0.2 ? S.lava[1] : S.lava[2]);
    }
  }
}

/** Every so often the erupting crater throws out glowing blobs that arc and fall. */
function drawEruption(t) {
  const v = life.volcano;
  if (!v) return;
  if (t % (storm.on ? 2 : 5) === 0) life.blobs.push({ x: v.x + (rand() - 0.5) * v.crater, y: v.y - 1, vx: (rand() - 0.5) * 1.6, vy: -1.6 - rand() * 1.4 });
  life.blobs = life.blobs.filter(b => {
    b.x += b.vx; b.y += b.vy; b.vy += 0.12;
    if (b.y > v.y + v.height * 0.6) return false;
    put(b.x, b.y, S.lava[0]); put(b.x, b.y + 1, S.lava[2]);
    return true;
  });
}

/** A lightning bolt now and then (every few seconds in a storm): a white flash over the sky, then a forked bolt for two frames. */
function drawLightning(t) {
  if (t >= life.nextBolt) {
    const bolt = [];
    let x = Math.floor(W * (0.15 + rand() * 0.7)), y = 0;
    const end = Math.round(horizon * (0.5 + rand() * 0.4));
    while (y < end) { bolt.push([x, y]); y++; if (rand() < 0.5) x += rand() < 0.5 ? -1 : 1; }
    life.bolt = bolt;
    life.boltAt = t;
    life.nextBolt = t + (storm.on ? FPS * (2 + rand() * 3) : FPS * 7);
  }
  const cycle = t - life.boltAt;
  if (cycle <= 1) for (let i = 0; i < W * horizon; i++) if (sky[i]) tintIndex(i, cycle === 0 ? 1.9 : 1.35, cycle === 0 ? 40 : 14);
  if (cycle <= 2 && life.bolt) for (const [x, y] of life.bolt) { put(x, y, abgr('#fffff0')); put(x + 1, y, abgr('#c8c0ff')); }
}

/** The storm's light: the sky and the ground darken (or redden) as it rolls in. */
function stormLight() {
  const mix = ([k, r, g, b]) => [1 - (1 - k) * storm.level, r * storm.level, g * storm.level, b * storm.level];
  const up = mix(S.storm.sky), down = mix(S.storm.ground);
  for (let i = 0; i < px.length; i++) {
    const [k, r, g, b] = sky[i] ? up : down, c = px[i];
    const f = (v, add) => Math.min(255, Math.round(v * k + add));
    px[i] = ((255 << 24) | (f((c >> 16) & 255, b) << 16) | (f((c >> 8) & 255, g) << 8) | f(c & 255, r)) >>> 0;
  }
}

/** Rain slanting on the wind (or cinders drifting down in the Wastes), thickening as the storm builds. */
function drawRain(t) {
  const [bright, dim] = S.storm.rain, fast = S.storm.fall > 2;
  const count = Math.round(life.rain.length * storm.level);
  for (let i = 0; i < count; i++) {
    const d = life.rain[i];
    d.y += S.storm.fall * d.speed;
    d.x -= fast ? S.storm.fall * d.speed * 0.4 : 0.2 + Math.sin((t + d.phase) / 4) * 0.3;
    if (d.y >= d.land) {
      if (fast && d.land < H) { put(d.x - 1, d.land, dim); put(d.x + 1, d.land, dim); }
      d.y = -rand() * 10; d.x = rand() * (W + H * 0.5); d.land = horizon + rand() * (H - horizon + 6);
      continue;
    }
    if (fast) { put(d.x, d.y, bright); put(d.x + 1, d.y - 2, dim); put(d.x + 1, d.y - 1, dim); }
    else if (Math.sin((t + d.phase) / 2.5) > -0.3) put(d.x, d.y, (t + d.phase) % 6 < 3 ? bright : dim);
  }
}

function tintIndex(i, k, add) {
  const c = px[i], f = (v) => Math.min(255, Math.round(v * k + add));
  px[i] = ((255 << 24) | (f((c >> 16) & 255) << 16) | (f((c >> 8) & 255) << 8) | f(c & 255)) >>> 0;
}

/* ---------- the menus' living parts ---------- */

const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };

/** The campfire: flickering flames over the logs, sparks rising and winking out, and the light breathing on the sand. */
function drawCampfire(t) {
  const { x: fx, y: fy, size } = life.fire, [white, yellow, orange, red, deep] = S.flame;
  const tall = size * 1.6 + Math.sin(t / 2) * 1.2 + noise(t, 1, 2) * 1.5;
  for (let dy = 0; dy < tall; dy++) {
    const k = dy / tall, half = size * 0.75 * Math.pow(1 - k, 0.7) * (0.8 + 0.4 * noise(dy, t, 3));
    const sway = Math.sin(t / 3 + dy / 3) * k * 1.5;
    for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
      const e = Math.abs(dx) / Math.max(0.5, half);
      if (e > 1) continue;
      const heat = (1 - k) * (1 - e * 0.8) + noise(dx, dy, t) * 0.25;
      put(fx + dx + sway, fy - 1 - dy, heat > 0.75 ? white : heat > 0.55 ? yellow : heat > 0.35 ? orange : heat > 0.18 ? red : deep);
    }
  }
  if (t % 2 === 0) life.sparks.push({ x: fx + (rand() - 0.5) * size, y: fy - tall * 0.6, vx: (rand() - 0.5) * 0.4, vy: -0.6 - rand() * 0.6, age: 0, life: 14 + rand() * 20 });
  life.sparks = life.sparks.filter(s => {
    s.x += s.vx + Math.sin((t + s.life) / 3) * 0.3; s.y += s.vy; s.age++;
    if (s.age > s.life) return false;
    if (noise(s.life, s.age, 7) > 0.15) put(s.x, s.y, s.age < s.life * 0.4 ? yellow : s.age < s.life * 0.75 ? orange : red);
    return true;
  });
  const glow = Math.sin(t / 2.3) + Math.sin(t / 3.7);
  for (let y = -size; y <= size; y++) for (let x = -size * 3; x <= size * 3; x++) {
    const d = (x / (size * 3)) ** 2 + (y / size) ** 2;
    if (d < 1 && d > 0.3 && dither(x + t, y) < 2 + glow) tint(fx + x, fy + y + 1, 1.1, 16);
  }
}

/** The Center: the machine's stripe breathing (its balls lighting up and flashing while you rest), Chansey blinking, the PC's cursor and the TV's scanline. */
function drawCenter(t) {
  const m = life.machine, [, bright] = S.glow, [red, white] = S.ball;
  const since = life.healAt == null ? -1 : t - life.healAt, full = 2 + m.slots.length * 2;
  const flash = since > full && Math.floor(since / 2) % 2 === 0;
  for (let x = m.x0; x <= m.x1; x++) if (flash || dither(x + t, 1) < 8 + 7 * Math.sin(t / 3)) put(x, m.y, bright);
  m.slots.forEach(([x, y], i) => { if (since >= 2 + i * 2) put(x, y, flash ? white : red); });

  const [, , body, , eye] = S.chansey, e = life.eyes;
  if (t % 36 < 2) for (const s of [-1, 1]) { put(e.x + 3 * s, e.y - 3, body); put(e.x + 3 * s, e.y - 2, eye); }
  if (t % 8 < 4) put(life.pc.x, life.pc.y, S.screen[2]);
  const tv = life.tv, row = tv.y0 + t % (tv.y1 - tv.y0 + 1);
  for (let x = tv.x0; x <= tv.x1; x++) tint(x, row, 1.12, 12);
}

/** The sea: glints winking on the water, swells rolling in, surf running up the sand, a sail crossing and the lighthouse's lamp. */
function drawSea(t) {
  const shore = life.shore, span = shore - horizon;
  for (const g of life.glints) {
    const s = Math.sin((t + g.phase) / 3);
    if (s > 0.8) { put(g.x, g.y, S.glint[0]); if (g.y > horizon + span * 0.5) put(g.x + 1, g.y, S.glint[1]); }
  }
  for (let i = 0; i < 3; i++) {
    const y = horizon + 2 + Math.floor(((t * 0.25 + i * span / 3) % span + span) % span * 0.97);
    const near = (y - horizon) / span;
    for (let x = 0; x < W; x++) if (Math.sin(x / (4 + near * 6) + i * 2 + t * 0.05) > 0.55 - near * 0.3) put(x, y, S.foam[1]);
  }
  for (let x = 0; x < W; x++) {
    const reach = shore + Math.round(1.5 + 1.5 * Math.sin(t / 7 + x / 37) + 0.8 * Math.sin(t / 11 - x / 19));
    for (let y = shore; y < reach; y++) put(x, y, S.sea[0]);
    put(x, reach, dither(x, t) < 12 ? S.foam[0] : S.foam[1]);
    if (dither(x + t, reach) < 5) put(x, reach - 1, S.foam[1]);
  }
  const b = life.boat;
  b.x += 0.08;
  if (b.x > W + 6) b.x = -6;
  const bx = Math.round(b.x), by = horizon, [sail, sailShade, hull] = S.sail;
  for (let k = -2; k <= 2; k++) put(bx + k, by, hull);
  for (let y = 1; y <= 4; y++) for (let k = 0; k <= Math.round((4 - y) * 0.6); k++) put(bx + k, by - y, k === 0 ? sailShade : sail);
  if (life.beacon && t % 16 < 3) {
    const { x, y } = life.beacon;
    put(x, y, S.glint[0]); put(x + 1, y, S.glint[0]); put(x - 1, y, S.sun[1]); put(x + 2, y, S.sun[1]);
  }
}

/** Vines hanging from the canopy, swaying a little more towards their tips, with a leaf every few pixels. */
function drawVines(t) {
  const [green, dark] = S.vine;
  for (const v of life.vines) {
    for (let k = 0; k < v.len; k++) {
      const x = v.x + Math.round(Math.sin(t / 9 + v.phase) * Math.pow(k / v.len, 1.5) * 2.5);
      put(x, v.y + k, k % 5 === 0 ? green : dark);
      if (k % 4 === 2) put(x + ((k >> 2) % 2 ? 1 : -1), v.y + k, S.leaf[0]);
    }
  }
}

/* ---------- battle pads ---------- */

/** A small pixel pad (grass, mossy stone or cracked rock) as a data URL for CSS to scale up. */
function padImage({ style, top, mid, low, rim, earth, blade, moss, lava }) {
  const w = 48, h = 16;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rx = w / 2 - 0.5, ry = 4.5, cx = w / 2 - 0.5, cy = 7;
  const within = (x, y, grow = 0) => ((x - cx) / (rx + grow)) ** 2 + ((y - cy) / (ry + grow)) ** 2 <= 1;
  const dot = (x, y, colour) => { g.fillStyle = colour; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let colour = null;
      if (within(x, y)) colour = y < cy - ry * 0.35 ? top : y < cy + ry * 0.4 ? (dither(x, y) < 3 ? top : mid) : (dither(x, y) < 4 ? mid : low);
      else if (within(x, y - 2) && y > cy) colour = earth;
      else if (within(x, y, 0.9) || (within(x, y - 2, 0.9) && y > cy)) colour = rim;
      if (colour) dot(x, y, colour);
    }
  }
  const edge = (x) => Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)));
  if (style === 'grass') {
    for (let x = 4; x < w - 4; x += 3 + (x % 2)) { dot(x, edge(x) - 1, blade); if (x % 5 === 0) dot(x, edge(x) - 2, blade); }
    for (const [x, y] of [[10, 7], [16, 9], [30, 6], [36, 8], [23, 10]]) { dot(x, y, low); dot(x, y - 1, top); }
  }
  if (style === 'stone') {
    // flagstone seams and moss creeping over the edge
    for (const x of [12, 22, 33]) for (let y = edge(x) + 1; y < cy + 4; y++) if (within(x, y)) dot(x + (y > cy ? 1 : 0), y, rim);
    for (let y = cy - 1; y <= cy; y++) for (let x = 3; x < w - 3; x++) if (within(x, y) && (x * 7 + y * 3) % 11 === 0) dot(x, y, low);
    for (let x = 2; x < w - 2; x++) if ((x * 5) % 7 < 3) dot(x, edge(x), moss);
    for (const [x, y] of [[6, 9], [7, 10], [40, 9], [41, 8], [20, 11], [28, 3]]) dot(x, y, moss);
  }
  if (style === 'rock') {
    // glowing cracks across the top
    for (const [x0, y0, len] of [[8, 6, 9], [26, 8, 11], [18, 4, 6]]) {
      let x = x0, y = y0;
      for (let k = 0; k < len; k++) { if (within(x, y)) dot(x, y, lava); x++; if (k % 3 === 2) y += (k % 2 ? 1 : -1); }
    }
  }
  return c.toDataURL();
}

/* ---------- helpers ---------- */

function colours(s) {
  const out = {};
  const conv = (v) => typeof v === 'string' && v.startsWith('#') ? abgr(v) : Array.isArray(v) ? v.map(conv) : v;
  for (const [k, v] of Object.entries(s)) out[k] = k === 'pad' || k === 'life' || k === 'kinds' ? v : conv(v);
  return out;
}

function abgr(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
}

function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

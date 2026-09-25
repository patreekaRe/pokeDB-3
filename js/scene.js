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
import { playSound } from './audio.js';

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
// the treasure chest's shared colours (see chestLid()); each biome gives it a ball's lid
const BALL_CHEST = {
  body: ['#ffffff', '#f0f0f4', '#c8c8d4', '#9898a8'],
  trim: ['#f0f0f8', '#b8b8c8', '#808090'],
  band: '#303038', line: '#1c1c24',
  button: ['#ffffff', '#b0b0c0'],
};

const PLACE_ART = {
  center: {   // inside a Pokémon Center: the big logo and hospital monitors behind the counter, the healing machine and PC on it
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
    machine: ['#fbfbfb', '#dcdce4', '#a8a8b8', '#4a5264', '#2c3240', '#58d858', '#a83020'],
    glow: ['#50d8f0', '#c0fcff', '#2a88a8'],
    screen: ['#a8d8f8', '#4878d8', '#f0fcff'],
    pc: ['#f0e0c0', '#c8b490', '#8a7458', '#5a4632', '#fff8e4', '#6e5c46'],
    monitor: ['#4a5264', '#788098', '#10281c', '#58f888', '#1a3e2a'],
    clock: ['#b83828', '#fffcf0', '#303038', '#8a7458'],
    map: ['#5898d8', '#78c068', '#e8d090', '#8a5a34'],
    plant: ['#5ab048', '#2e7a34', '#f878a8', '#c85a30', '#8a3420'],
    life: ['center'],
  },

  mart: {   // inside a Poké Mart: lamps, windows and posters round the shop's real shelf, its floor line set by the page (martRoom)
    backdrop: 'mart', floor: 'mart', light: null, horizon: 0.74,   // low, so the wall stands behind the shelf
    sky: ['#f8f8f0'],
    wall: ['#2a8a98', '#58c0c8', '#f8f8f0', '#e89078'],
    wainscot: ['#e8e8f0', '#b8b8c8'],
    flags: ['#e04030', '#f8c030', '#3878f0', '#58b858', '#f070a8'],
    sale: ['#e03828', '#f8d030', '#ffffff'],
    cork: ['#c89058', '#8a5a34', '#ffffff', '#f8e070', '#98d8f8', '#f8a8c8'],
    crate: ['#c88a50', '#7a4a28', '#e0a868'],
    balls: { base: ['#f8f8f8', '#303038', '#ffffff'], poke: ['#e04030'], great: ['#3878f0', '#e04030'], ultra: ['#383840', '#f8d030'], master: ['#8048c8', '#f070a8'] },
    lamp: ['#505060', '#fffce8', '#c8c8d8', '#fff4b0'],
    window: ['#ffffff', '#98d8f8', '#58b858', '#e05838', '#ffffff'],
    bin: ['#3878f0', '#78a8f8', '#fffcf0'],
    mote: '#fffce8',
    tiles: ['#a8e8b0', '#78c890', '#88d49c'],
    mat: ['#e85830', '#f8a868'],
    plant: ['#5ab048', '#2e7a34', '#8ad060', '#c8c8d8', '#7a7a90'],
    life: ['mart'],
  },

  /* a hidden grotto: a shaft of light through a hole in the roof onto a stone dais, crystals in the rock and gold
     spilled round the chest (the page's own, from treasureChest()). Its look is per biome (`biomes`). */
  treasure: {
    backdrop: 'treasure', floor: 'treasure', light: null, horizon: 0.56,
    coin: ['#fff8b0', '#f8c830', '#b07818'],
    gem: ['#f85878', '#58e088', '#58a8f8', '#c878f8'],
    balls: { base: ['#f8f8f8', '#303038', '#ffffff'], poke: ['#e04030'], great: ['#3878f0', '#e04030'], ultra: ['#383840', '#f8d030'], master: ['#8048c8', '#f070a8'] },
    biomes: {
      clearing: {   // a mossy grotto with blue crystals and a wooden chest
        sky: ['#fffbe0', '#d8f0f8'],
        rock: ['#7a8a92', '#627078', '#4c5860', '#3a444c', '#262e36'],
        moss: ['#8ac860', '#5a9a44', '#3a6e30'],
        crystal: ['#f0ffff', '#a0e4f8', '#50a8e0', '#2c64a0'],
        ground: ['#58646a', '#4e5a60', '#465056', '#3e474d', '#363e44'],
        stone: ['#c8ccc4', '#a4aaa2', '#7c827c', '#565c58'],
        beam: '#fff4c0', drip: '#c0ecff', mote: '#fffce8',
        chest: { ...BALL_CHEST, lid: ['#ff8070', '#e83830', '#b82020', '#7a1418'] },   // a Poké Ball
        life: ['treasure', 'drips'],
      },
      shrine: {   // an old stone vault: rose quartz, spirit wisps and a red lacquer chest
        sky: ['#f8f0ff', '#d8e8f0'],
        rock: ['#8a8898', '#6c6a7c', '#545264', '#403e50', '#2a2838'],
        moss: ['#7aa870', '#4e7e50', '#2e5438'],
        crystal: ['#fff4fa', '#f8b8d8', '#d86aa0', '#8a3868'],
        ground: ['#5c5a6a', '#524f60', '#484656', '#403e4c', '#363442'],
        stone: ['#d0ccc0', '#aca698', '#848070', '#5c584c'],
        beam: '#fff0f4', drip: '#e0e8ff', mote: '#fff8fc',
        wisp: ['#f0ffff', '#98e0f8', '#4898c8'],
        chest: { ...BALL_CHEST, lid: ['#88c0ff', '#3878f0', '#2850b8', '#183078'], marks: 'great', mark: ['#ff7060', '#e03830', '#a82020'] },   // a Great Ball
        life: ['treasure', 'drips', 'wisps'],
      },
      wastes: {   // an obsidian cave: fire crystals, glowing veins and a black chest
        sky: ['#f8c878', '#f09048'],
        rock: ['#6a5250', '#523e3e', '#3e2e30', '#2e2224', '#1a1214'],
        vein: ['#f8b030', '#e05820'],
        crystal: ['#fff4c0', '#f8b048', '#e86020', '#982818'],
        ground: ['#4a3a38', '#423432', '#3a2e2c', '#332826', '#2a2120'],
        stone: ['#9a8a80', '#7a6a62', '#5a4c46', '#3a302c'],
        beam: '#ffd8a0', mote: '#fff0c0',
        ember: ['#fff0a0', '#f8a830', '#e85820'], embers: 0.5,
        chest: { ...BALL_CHEST, lid: ['#70707e', '#46464e', '#303036', '#1c1c22'], trim: ['#fff080', '#f8d030', '#c09818'], marks: 'ultra' },   // an Ultra Ball
        life: ['treasure', 'embers'],
      },
    },
  },
};


let canvas = null, ctx = null, S = null, timer = 0, tick = 0;
let W = 0, H = 0, horizon = 0, base = null, img = null, px = null, sky = null, rand = Math.random;
let life = {};
let shown = '';                 // which scene is up, so going back to it doesn't restart it
let floorAt = null, spanAt = null;   // a place whose floor line and counter the page sets (showPlaceScene's `floor` and `span`)
let storm = { on: false, level: 0 };

/** The menus' scene: each starter type has its own (TYPE_ART); before one is picked, the Clearing's moonlit night, like the title screen. */
export function showMenuScene(type) {
  if (TYPE_ART[type]) paintScene(`menu/${type}`, TYPE_ART[type]);
  else showScene('clearing', 'boss');
}

/** An indoor scene for a room on the map (PLACE_ART), e.g. 'center' for the Pokémon Center. `floor` (a function giving
    a page y) puts the floor line there instead, so a room drawn by the page (the Mart's counter) stands on the tiles, and
    `span` (one giving its page [left, right]) lets the scene dress its ends. A place with `biomes` (the treasure
    grotto) takes its look from `biome`. */
export function showPlaceScene(place, { floor = null, span = null, biome = null } = {}) {
  const { biomes, ...art } = PLACE_ART[place];
  const look = biomes && (biomes[biome] || Object.values(biomes)[0]);
  paintScene(`place/${place}${look ? `/${biome}` : ''}`, look ? { ...art, ...look } : art, floor, span);
}

const BALL_DROP = 4;   // frames before your Poké Ball settles into the healing machine

/** Resting at the Center, like the games: the machine takes your Poké Ball (you carry just the one, so the other five
    slots stay empty; resolves once it's in), then `flashCenter()` flashes it for as long as the chime plays. */
export function healAtCenter() {
  if (!life.machine) return Promise.resolve();
  if (!timer) { life.healAt = tick - 100; draw(); return Promise.resolve(); }   // reduced motion: straight in
  life.healAt = tick;
  return new Promise(done => setTimeout(done, (BALL_DROP + 2) * 1000 / FPS));
}

export function flashCenter(seconds) {
  if (!life.machine || !timer) return;
  life.flash = { from: tick, to: tick + Math.round(seconds * FPS) };
}

/** Where the Center's healing machine and PC are on screen, in CSS pixels ({ machine, pc } of { left, top, width, height }), where Chansey stands (nurse: the counter top's middle) and the counter's foot (foot: a y), or null. */
export function centerSpots() {
  if (!life.spots || !canvas) return null;
  const box = canvas.getBoundingClientRect(), sx = box.width / W, sy = box.height / H;
  const rect = ({ x0, x1, y0, y1 }) => ({ left: box.left + x0 * sx, top: box.top + y0 * sy, width: (x1 - x0 + 1) * sx, height: (y1 - y0 + 1) * sy });
  return { machine: rect(life.spots.machine), pc: rect(life.spots.pc), nurse: { x: box.left + (life.spots.nurse.x + 0.5) * sx, y: box.top + life.spots.nurse.y * sy }, foot: box.top + life.spots.foot * sy, patient: rect(life.spots.patient) };
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

function paintScene(key, raw, floor = null, span = null) {
  canvas = $('scene-bg');
  ctx = canvas.getContext('2d');
  document.body.classList.toggle('has-scene', !!raw);
  floorAt = floor;
  spanAt = span;
  if (raw && key === shown && document.body.dataset.screen !== 'battle-screen') { if (floor) resize(); return; }
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
  horizon = floorAt ? Math.max(Math.round(H * 0.3), Math.min(H - 8, Math.round(floorAt() * H / innerHeight)))
    : S.raw.horizon ? Math.round(H * S.raw.horizon) : horizonRow(scale);
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
  if (!(c >>> 24)) return;   // a see-through pixel of a prop (paintProp) stays see-through
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
  if (S.raw.backdrop === 'treasure') grottoWall();

  if (S.raw.floor === 'treasure') grottoFloor();
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
  if (S.raw.backdrop === 'treasure') grottoFront();

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
  // the Center's big logo right behind Chansey, a hospital monitor either side, and on wider walls a clock and the town map
  const top = counterTop(), r = Math.max(12, Math.min(22, Math.floor((top - ceil) * 0.2)));
  const logoY = top - 15 - Math.round(r * 0.45);
  centerLogo(cx, logoY, r);
  // the big patient monitor shows your Pokémon's HP (the page draws it: centerSpots().patient), a heartbeat monitor
  // beside it; wide walls hang them either side of the logo, a phone's narrow wall above it with a party screen too
  life.monitors = [];
  if (W > 160) {
    wallMonitor(cx - r - 18, logoY - 4, 26, 17, 'pulse', ceil);
    wallMonitor(cx + r + 24, logoY - 4, 38, 24, 'patient', ceil);
    wallClock(cx - r - 50, logoY - 6, 8);
    wallMap(cx + r + 62, logoY - 4, 14, 9);
  } else {
    const y = logoY - r - 18;
    wallMonitor(cx, y, 40, 26, 'patient', ceil);
    wallMonitor(cx - 32, y + 2, 18, 14, 'pulse', ceil);
    wallMonitor(cx + 32, y + 2, 18, 14, 'party', ceil);
  }
}

/** The Pokémon Center's logo: a big Poké Ball with a red cross on its button, ringed in a soft glow. */
function centerLogo(cx, cy, r) {
  const [red, white, dark] = S.ball, band = Math.max(1, Math.round(r * 0.09)), button = Math.round(r * 0.36);
  for (let y = -r - 2; y <= r + 2; y++) for (let x = -r - 2; x <= r + 2; x++) {
    const d = Math.hypot(x, y);
    if (d > r + 0.5) { if (d <= r + 2.5) tint(cx + x, cy + y, 1.08, 10); continue; }
    let c = d > r - 1.2 || Math.abs(y) <= band ? dark : y < 0 ? red : white;
    if (d <= button + 1.2) c = dark;
    if (d <= button) c = white;
    const arm = Math.max(1, Math.round(button * 0.25)), len = Math.round(button * 0.7);
    if ((Math.abs(x) <= arm && Math.abs(y) <= len) || (Math.abs(y) <= arm && Math.abs(x) <= len)) if (d <= button) c = red;
    solid(cx + x, cy + y, c);
  }
  for (const [x, y] of [[-0.55, -0.62], [-0.45, -0.72], [-0.65, -0.5]]) solid(cx + Math.round(x * r), cy + Math.round(y * r), white);   // a shine
}

/** A hospital monitor on an arm from the ceiling: 'pulse' draws a heartbeat trace, 'party' six Poké Balls with HP bars
    (drawCenter animates both), and 'patient' an empty screen the page fills with your Pokémon's HP (centerSpots). */
function wallMonitor(cx, cy, w, h, kind, ceil) {
  const [frame, bezel, screen, , dim] = S.monitor;
  const x0 = cx - (w >> 1), x1 = x0 + w - 1, y0 = cy - (h >> 1), y1 = y0 + h - 1;
  for (let y = ceil; y < y0; y++) { solid(cx, y, frame); solid(cx + 1, y, bezel); }   // the arm
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || y === y0 || y === y1, inner = x === x0 + 1 || x === x1 - 1 || y === y0 + 1 || y === y1 - 1;
    solid(x, y, edge ? frame : inner ? bezel : (y - y0) % 4 === 2 ? dim : screen);   // faint grid lines on the screen
  }
  for (let x = x0 + 1; x <= x1 + 1; x++) tint(x, y1 + 1, 0.85);
  const box = { x0: x0 + 2, x1: x1 - 2, y0: y0 + 2, y1: y1 - 2, kind };
  if (kind === 'party') {
    const [red, white] = S.ball, [, , , bright] = S.monitor;
    for (let i = 0; i < 6; i++) {
      const bx = box.x0 + 1 + (i % 3) * Math.floor((box.x1 - box.x0) / 3), by = box.y0 + 1 + Math.floor(i / 3) * Math.max(4, (box.y1 - box.y0) >> 1);
      solid(bx, by, red); solid(bx + 1, by, red); solid(bx, by + 1, white); solid(bx + 1, by + 1, white);
      for (let k = 0; k < 3 + (i * 5) % 3; k++) solid(bx + 3 + k, by + 1, bright);
    }
  }
  if (kind === 'patient') life.spots = { ...life.spots, patient: { x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y1 } };
  else life.monitors.push(box);
}

/** A wall clock showing the real time (drawCenter moves its hands). */
function wallClock(cx, cy, r) {
  const [rim, face, , mark] = S.clock;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y);
    if (d <= r + 0.4) solid(cx + x, cy + y, d > r - 1.4 ? rim : face);
  }
  for (let h = 0; h < 12; h++) {
    const a = h * Math.PI / 6;
    solid(cx + Math.round(Math.sin(a) * (r - 2.5)), cy - Math.round(Math.cos(a) * (r - 2.5)), mark);
  }
  life.clock = { cx, cy, r };
}

/** A framed map of the region. */
function wallMap(x, y, hw = 8, hh = 5) {
  const [sea, land, sand, wood] = S.map, r = seeded(W + 7);
  const x0 = x - hw, x1 = x + hw, y0 = y - hh, y1 = y + hh - 1;
  const blobs = [[x - hw * 0.4, y - 1, hw * 0.38], [x + hw * 0.35, y + 1, hw * 0.4], [x + 1, y - hh * 0.4, hw * 0.25]].map(([bx, by, br]) => [bx + Math.round(r() * 2 - 1), by, br]);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    if (i === x0 || i === x1 || j === y0 || j === y1) { solid(i, j, wood); continue; }
    const d = Math.min(...blobs.map(([bx, by, br]) => Math.hypot((i - bx) / br, (j - by) / (br * 0.8))));
    solid(i, j, d < 0.75 ? land : d < 1 ? sand : sea);
  }
  // towns and the roads between them
  for (const [tx, ty] of [[x - Math.round(hw * 0.4), y - 1], [x + Math.round(hw * 0.35), y + 1], [x + 1, y - Math.round(hh * 0.4)]]) solid(tx, ty, S.ball[0]);
  for (let j = y0 + 1; j <= y1 + 1; j++) tint(x1 + 1, j, 0.85);
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

function centerFront() {
  const cx = W >> 1, top = counterTop(), half = Math.max(34, Math.min(64, Math.round(W * 0.3)));
  counter(cx, top, half);
  life.spots = { ...life.spots, nurse: { x: cx, y: top }, foot: top + COUNTER_TALL };   // Chansey is a real sprite standing behind the counter (run.js)
  healMachine(cx + 12, top);
  counterPc(cx - 32, top);
  const foot = top + COUNTER_TALL - 1;
  for (const s of [-1, 1]) {
    pottedPlant(cx + s * (half + 7), foot, 4);
    if (cx - half > 44) pottedPlant(cx + s * (half + 30), foot + 6, 5);
  }
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

/* ---------- the Poké Mart, after the Gen 3 Marts: white walls under a teal band with sale posters,
   green octagon tiles and an orange mat at the door ---------- */

function martBackdrop() {
  const [top, band, face, stripe] = S.wall, [panel, shade] = S.wainscot;
  const ceil = 3, rail = horizon - Math.max(6, Math.round(horizon * 0.2));
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {
    solid(x, y, y < ceil ? top : y < ceil + 3 ? band : y < rail ? face : y - rail < 2 ? stripe : y >= horizon - 2 ? shade : panel);
    if (x % 6 === 0 && y >= ceil + 3 && y < rail) tint(x, y, 0.96);   // faint wallpaper pinstripes
  }
  life.lamps = [];
  for (let x = ((W >> 1) % 30) - 15; x < W + 15; x += 30) hangingLamp(x, ceil + 3);
  bunting(ceil + 11);
  life.windows = [];
  // the side walls (a phone's shelf covers them): a window and a crate stack on one, a sale poster and a cork board on the other
  const side = Math.round(W / 2 - 64);
  if (side < 30) return;
  const zone = Math.round(side / 2), wallMid = Math.round((ceil + 16 + rail) / 2);
  shopWindow(zone, wallMid - 2);
  salePoster(W - zone - Math.round(side * 0.18), wallMid - 3);
  if (side > 52) corkBoard(W - zone + Math.round(side * 0.24), wallMid + 3);
  crateStack(zone + 12, horizon - 1);
}

/** A lamp hanging from the teal band on a short cord: a white shade, and the warm glow drawn under it each frame (drawMart). */
function hangingLamp(cx, y0) {
  const [cord, shade, rim] = S.lamp;
  for (let y = y0; y < y0 + 3; y++) solid(cx, y, cord);
  for (let x = -3; x <= 3; x++) { solid(cx + x, y0 + 4, Math.abs(x) === 3 ? rim : shade); if (Math.abs(x) <= 2) solid(cx + x, y0 + 3, shade); }
  life.lamps.push({ x: cx, y: y0 + 5, phase: cx * 7 });
}

/** Strings of pennants swagging across the wall, like a grand opening. */
function bunting(y0) {
  const span = 34, flags = S.flags;
  for (let x = 0; x < W; x++) {
    const sag = Math.round(4 * Math.sin(Math.PI * (((x + 9) % span) / span)));
    solid(x, y0 + sag, S.lamp[0]);
    if ((x + 9) % 5 === 1) {
      const c = flags[Math.floor((x + 9) / 5) % flags.length];
      for (let k = 1; k <= 4; k++) for (let w = 0; w <= Math.max(0, 2 - Math.floor(k / 2)); w++) solid(x + w - (k < 3 ? 1 : 0), y0 + sag + k, c);
    }
  }
}

/** A window onto a sunny street: sky, a hedge and a red rooftop, under a white frame with a cross bar; clouds drift across it (drawMart). */
function shopWindow(cx, cy) {
  const [frame, sky, hill, roof] = S.window, x0 = cx - 13, x1 = cx + 13, y0 = cy - 9, y1 = cy + 8;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || y === y0 || y === y1 || x === cx || y === cy - 1;
    const ground = y > y1 - 5 + Math.round(Math.sin(x / 3));
    const house = x > cx + 3 && x < cx + 10 && y > y1 - 9 && !ground;
    const roofTop = house && y < y1 - 6;
    solid(x, y, edge ? frame : ground ? hill : roofTop ? roof : house ? frame : sky);
  }
  for (let x = x0 - 1; x <= x1 + 1; x++) { solid(x, y1 + 1, frame); tint(x, y1 + 2, 0.85); }   // the sill and its shadow
  life.windows.push({ x0: x0 + 1, x1: x1 - 1, y0: y0 + 1, y1: y1 - 6, cx, bar: cy - 1 });
}

/** A big red SALE poster: a yellow starburst in the middle and lines of white print. */
function salePoster(cx, cy) {
  const [red, star, print] = S.sale, x0 = cx - 8, x1 = cx + 8, y0 = cy - 11, y1 = cy + 11;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || y === y0 || y === y1;
    const dx = x - cx, dy = y - (cy - 3), burst = Math.abs(dx) + Math.abs(dy) <= 5 || (Math.abs(dx) <= 6 && dy === 0) || (Math.abs(dy) <= 6 && dx === 0);
    const line = y >= cy + 5 && y <= cy + 8 && y % 2 === 0 && Math.abs(dx) <= 5;
    solid(x, y, edge ? print : burst ? star : line ? print : red);
  }
  for (let y = y0 + 1; y <= y1 + 1; y++) tint(x1 + 1, y, 0.85);
}

/** A cork board with flyers pinned to it. */
function corkBoard(cx, cy) {
  const [cork, wood, ...notes] = S.cork, x0 = cx - 9, x1 = cx + 9, y0 = cy - 7, y1 = cy + 7;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) solid(x, y, x === x0 || x === x1 || y === y0 || y === y1 ? wood : (x * 7 + y * 3) % 5 ? cork : wood);
  [[x0 + 2, y0 + 2, 5, 6], [x0 + 9, y0 + 3, 6, 4], [x0 + 4, y0 + 9, 6, 4], [x0 + 12, y0 + 8, 4, 5]].forEach(([nx, ny, w, h], i) => {
    for (let y = ny; y < ny + h; y++) for (let x = nx; x < nx + w; x++) solid(x, y, notes[i % notes.length]);
    solid(nx + (w >> 1), ny, S.sale[0]);   // the pin
  });
  for (let y = y0 + 1; y <= y1 + 1; y++) tint(x1 + 1, y, 0.85);
}

/** Wooden crates stacked against the wall, one with a Poké Ball stencil. */
function crateStack(cx, foot) {
  const [wood, dark, light] = S.crate;
  const crate = (x0, y0, s) => {
    for (let y = y0; y < y0 + s; y++) for (let x = x0; x < x0 + s; x++) {
      const edge = x === x0 || x === x0 + s - 1 || y === y0 || y === y0 + s - 1;
      solid(x, y, edge ? dark : (y - y0) % 3 === 0 ? light : wood);
    }
  };
  crate(cx - 9, foot - 9, 9);
  crate(cx, foot - 9, 9);
  crate(cx - 5, foot - 18, 9);
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

/** Where the counter leaves wall to either side (a wide screen) the plants and ball bins stand there; a phone's counter
    spans the screen, so they'd hide behind it, and the page stands them in front of it instead (martProps()). */
const martRoomy = () => spanAt && spanAt()[0] * W / innerWidth > 34;

function martFront() {
  if (!martRoomy()) return;
  const [l, r] = spanAt().map(x => Math.round(x * W / innerWidth)), foot = horizon + 4;
  pottedPlant(l - 6, foot, 4);
  pottedPlant(r + 5, foot, 4);
  ballBin(l - 22, horizon - 2, ['great', 'poke', 'great']);
  ballBin(r + 21, horizon - 2, ['ultra', 'master', 'ultra']);
}

/** The Mart's plants and ball bins as little pixel images ({ plant, left, right } data URLs with their sizes), for the
    page to stand in front of a counter that spans the screen; null when they're painted beside it instead. */
export function martProps() {
  if (!S || S.raw.backdrop !== 'mart' || martRoomy()) return null;
  return {
    plant: paintProp(11, 13, () => pottedPlant(5, 12, 4)),
    left: paintProp(17, 11, () => ballBin(8, 4, ['great', 'poke', 'great'])),
    right: paintProp(17, 11, () => ballBin(8, 4, ['ultra', 'master', 'ultra'])),
  };
}

/** Paint a prop on its own transparent w x h pixels, with the scene's painters, and hand it back as { url, w, h }. */
function paintProp(w, h, paint) {
  const saved = [W, H, px, sky];
  W = w; H = h; px = new Uint32Array(w * h); sky = new Uint8Array(w * h);
  paint();
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(px.buffer), w, h), 0, 0);
  [W, H, px, sky] = saved;
  return { url: c.toDataURL(), w, h };
}

/** A low blue Mart bin against the counter, heaped with Poké Balls whose lower halves sit inside it. */
function ballBin(cx, top, kinds) {
  const [blue, rim, label] = S.bin, x0 = cx - 7, x1 = cx + 7, y1 = top + 5;
  [[-4, 0], [0, -1], [4, 0]].forEach(([dx, dy], i) => floorBall(cx + dx, top + dy, kinds[i % kinds.length], false));
  for (let y = top + 1; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || y === y1;
    solid(x, y, y === top + 1 ? rim : edge ? S.balls.base[1] : y === top + 3 && Math.abs(x - cx) < 4 ? label : blue);
  }
  for (let x = x0; x <= x1 + 1; x++) tint(x, y1 + 1, 0.8);   // its shadow on the tiles
}

/** A Poké Ball: Poké (red), Great (blue with red marks), Ultra (black with a yellow H) or Master (purple, pink bumps). */
function floorBall(cx, cy, kind, shadow = true) {
  const [white, band, shine] = S.balls.base, top = S.balls[kind];
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const d = Math.hypot(x, y);
    if (d > 3.4) continue;
    let c = y > 0 ? white : top[0];
    if (kind === 'great' && y < 0 && Math.abs(x) >= 2) c = top[1];
    if (kind === 'ultra' && y < 0 && Math.abs(x) === 1 && y <= -1) c = top[1];
    if (kind === 'master' && y === -2 && Math.abs(x) === 2) c = top[1];
    if (d > 2.6 || y === 0) c = band;
    if (Math.abs(x) <= 1 && Math.abs(y) <= 1 && d <= 1.2) c = x === 0 && y === 0 ? white : band;
    if (x === -1 && y === -2) c = shine;
    solid(cx + x, cy + y, c);
  }
  if (shadow) for (let x = -2; x <= 3; x++) tint(cx + x, cy + 4, 0.8);
}

/* ---------- the treasure grotto: cracked rock walls, a hole in the roof letting a shaft of light down onto a stone
   dais, crystals, stalactites dripping (or glowing veins in the Wastes), and gold spilled round the chest ---------- */

const CHEST_W = 36, LID_H = 13, BODY_H = 15, OPEN_H = 9;

/** Mix a pixel towards colour `c` by k (0-1). */
function blend(x, y, c, k) {
  x |= 0; y |= 0;
  if (!inside(x, y)) return;
  const i = y * W + x, a = px[i], mix = (s) => Math.round(((a >> s) & 255) * (1 - k) + ((c >> s) & 255) * k);
  px[i] = ((255 << 24) | (mix(16) << 16) | (mix(8) << 8) | mix(0)) >>> 0;
}

/** Rock broken into facets (Voronoi cells), each lit on its top-left and cracked at its edges, darker towards the
    walls' ends and the roof, so the light seems to come from the hole. */
function grottoWall() {
  const [, , , , crack] = S.rock, cx = W / 2, G = 8, GY = 6;
  const feature = (i, j) => [(i + 0.2 + noise(i, j, 1) * 0.6) * G, (j + 0.2 + noise(i, j, 2) * 0.6) * GY];
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {
    const i0 = Math.floor(x / G), j0 = Math.floor(y / GY);
    let d1 = 1e9, d2 = 1e9, f = null, cell = null;
    for (let j = j0 - 1; j <= j0 + 1; j++) for (let i = i0 - 1; i <= i0 + 1; i++) {
      const p = feature(i, j), d = Math.hypot(x - p[0], y - p[1]);
      if (d < d1) { d2 = d1; d1 = d; f = p; cell = [i, j]; } else if (d < d2) d2 = d;
    }
    const dark = 1.1 * Math.pow(Math.abs(x + 0.5 - cx) / cx, 1.5) + 0.7 * Math.pow(1 - y / horizon, 2);
    if (d2 - d1 < 1.1) {
      const vein = S.vein && y > horizon * 0.45 && noise(cell[0], cell[1], 3) > 0.9 && noise(x >> 2, y >> 2, 4) > 0.3;
      solid(x, y, vein ? S.vein[(x + y) & 1] : crack);
      continue;
    }
    const lit = ((f[0] - x) / G + (f[1] - y) / GY) * 0.8 + (dither(x, y) / 16 - 0.5) * 0.35;
    const shade = (lit > 0.35 ? 0 : lit > 0 ? 1 : lit > -0.35 ? 2 : 3) + Math.floor(dark * 2 + dither(x + 1, y) / 16);
    solid(x, y, S.rock[Math.min(3, shade)]);
  }

  // the hole in the roof, rimmed with lit rock, the sky showing through
  const rx = Math.max(6, Math.round(W * 0.08)), ry = 3;
  life.hole = { rx };
  for (let y = 0; y <= ry + 1; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
    const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5) / ry);
    if (d <= 1) { put(x, y, S.sky[d < 0.6 ? 0 : 1]); sky[y * W + x] = 1; }
    else if (d <= 1.35) solid(x, y, S.rock[0]);
  }
  if (S.moss) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {   // roots and moss hanging from its rim
    if (noise(x, 1, 7) < 0.45) continue;
    const top = Math.round(ry * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / rx) ** 2))) + 1;
    for (let k = 0, len = 1 + Math.floor(noise(x, 2, 7) * 6); k < len; k++) solid(x, top + k, S.moss[k === len - 1 ? 2 : k ? 1 : 0]);
  }

  // stalactites along the roof (their tips drip in drawGrotto)
  life.tips = [];
  for (let x = 2 + Math.floor(rand() * 5); x < W - 2; x += 5 + Math.floor(rand() * 8)) {
    if (Math.abs(x - cx) < rx + 4) continue;
    const len = 3 + Math.floor(rand() * 7);
    for (let k = 0; k < len; k++) {
      const w = Math.round((1 - k / len) * 2);
      for (let dx = -w; dx <= w; dx++) solid(x + dx, k, dx < 0 ? S.rock[1] : dx > 0 ? S.rock[3] : S.rock[2]);
    }
    if (rand() < 0.6) life.tips.push({ x, y: len, floor: horizon + 1 + Math.floor(rand() * 4) });
  }

  // moss along the wall's foot
  if (S.moss) for (let x = 0; x < W; x++) {
    if (noise(Math.floor(x / 6), 0, 6) < 0.4) continue;
    const m = 1 + Math.round(3 * noise(x, 0, 5));
    for (let k = 0; k < m; k++) solid(x, horizon - 1 - k, S.moss[k === m - 1 ? 0 : dither(x, k) < 8 ? 1 : 2]);
  }

  // crystal clusters growing out of the walls
  life.glints = [];
  const wide = W > 200;
  crystalCluster(Math.round(W * 0.07), Math.round(horizon * 0.5), 8);
  crystalCluster(Math.round(W * 0.93), Math.round(horizon * 0.66), 9);
  if (wide) { crystalCluster(Math.round(W * 0.27), Math.round(horizon * 0.42), 6); crystalCluster(Math.round(W * 0.76), Math.round(horizon * 0.35), 7); }
}

/** A few crystals from one spot: a tall one in the middle and shorter ones leaning out. */
function crystalCluster(cx, foot, h) {
  crystal(cx - 3, foot + 1, h * 0.6, -1);
  crystal(cx + 3, foot + 1, h * 0.55, 1);
  crystal(cx, foot, h, 0);
}

/** A six-sided crystal seen side on: a lit face, a darker one, a pointed tip that glints now and then (drawGrotto). */
function crystal(cx, foot, h, lean) {
  const [shine, light, body, dark] = S.crystal, full = h >= 8 ? 4 : 3;
  h = Math.max(3, Math.round(h));
  let tip = null;
  for (let k = 0; k < h; k++) {
    const toTip = h - 1 - k, w = toTip >= 2 ? full : toTip === 1 ? 2 : 1;
    const x0 = cx + Math.round(lean * k / 3) - (w >> 1), y = foot - k;
    const faces = w === 4 ? [light, shine, body, dark] : w === 3 ? [light, body, dark] : w === 2 ? [light, body] : [shine];
    faces.forEach((c, j) => solid(x0 + j, y, c));
    solid(x0 - 1, y, S.rock[4]);
    solid(x0 + w, y, S.rock[4]);
    if (!toTip) { solid(x0, y - 1, S.rock[4]); tip = { x: x0, y }; }
  }
  life.glints.push({ ...tip, c: shine, phase: rand() * 80 });
}

function grottoFloor() {
  const [lit, , , , deep] = S.ground, cx = W >> 1;
  bands(horizon, H, S.ground, 0.8);
  for (let n = 0, count = Math.round(W * (H - horizon) / 45); n < count; n++) {   // pebbles
    const x = Math.floor(rand() * W), y = horizon + 2 + Math.floor(rand() * (H - horizon - 2));
    put(x, y, lit);
    if (depthOf(y) > 0.4) { put(x + 1, y, lit); put(x, y + 1, deep); put(x + 1, y + 1, deep); }
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.7); tint(x, horizon + 1, 0.85); }   // the wall's shadow at its foot

  const dy = horizon + Math.round((H - horizon) * 0.34), rx = CHEST_W / 2 + 8, ry = 5;
  life.dais = { x: cx, y: dy };
  dais(cx, dy, rx, ry);

  // gold spilled round the dais, with a Poké Ball or two
  const [shine, gold, dark] = S.coin;
  const heap = (hx, foot, size) => {
    for (let k = 0; k < size; k++) for (let x = -(size - k) * 2; x <= (size - k) * 2; x++) {
      put(hx + x, foot - k, (x + k * 2) % 3 === 0 ? shine : (x + k) % 2 ? gold : dark);
    }
    for (let x = -size * 2 - 1; x <= size * 2 + 1; x++) tint(hx + x, foot + 1, 0.7);
    put(hx + 1, foot - 1, S.gem[Math.floor(rand() * S.gem.length)]);
    life.glints.push({ x: hx, y: foot - size + 1, c: shine, phase: rand() * 80 });
  };
  heap(cx - rx - 5, dy + 5, 3);
  heap(cx + rx + 5, dy + 8, 2);
  for (let n = 0; n < 12; n++) {
    const x = Math.round(cx + (rand() * 2 - 1) * (rx + 16)), y = Math.round(dy + ry + 3 + rand() * Math.max(2, (H - dy - ry - 6) * 0.6));
    if (Math.abs(x - cx) < rx - 4 && y < dy + ry + 5) continue;
    put(x, y, gold); put(x + 1, y, shine); put(x, y + 1, dark); put(x + 1, y + 1, dark);
    if (rand() < 0.3) put(x + 3, y, S.gem[n % S.gem.length]);
  }
  floorBall(cx - rx - 13, dy + 12, 'great');
  floorBall(cx + rx + 12, dy + 1, 'poke');
}

/** A round stone dais on a wider step, lit rim at the back, its front laid in blocks. */
function dais(cx, cy, rx, ry) {
  const [lit, top, face, deep] = S.stone;
  const disc = (y0, rx2, ry2, tall, rim) => {
    for (let x = -rx2; x <= rx2; x++) {
      const e = Math.sqrt(Math.max(0, 1 - (x / (rx2 + 0.5)) ** 2)), back = Math.round(y0 - ry2 * e), front = Math.round(y0 + ry2 * e);
      for (let y = back; y <= front; y++) put(cx + x, y, y === back ? rim : top);
      for (let k = 1; k <= tall; k++) put(cx + x, front + k, k === tall ? deep : (x + rx2) % 7 === 0 ? deep : face);
    }
  };
  disc(cy + 4, rx + 5, ry + 2, 2, face);
  disc(cy, rx, ry, 4, lit);
}

/** The light: a shaft from the hole down to the dais with a pool round it, then dark boulders in the front corners. */
function grottoFront() {
  const cx = W / 2, d = life.dais, beam = S.beam;
  for (let y = 0; y < d.y + 3; y++) {
    const hw = beamWidth(y);
    for (let x = Math.floor(cx - hw - 3); x <= cx + hw + 3; x++) {
      const e = Math.abs(x + 0.5 - cx) - hw;
      if (e < -1) blend(x, y, beam, 0.24);
      else if (dither(x, y) < (3 - e) * 3) blend(x, y, beam, 0.14);
    }
  }
  const prx = CHEST_W / 2 + 16, pry = 9;
  for (let y = d.y - pry; y <= d.y + pry + 2; y++) for (let x = Math.floor(cx - prx); x <= cx + prx; x++) {
    const e = Math.hypot((x + 0.5 - cx) / prx, (y - d.y - 2) / pry);
    if (e < 0.75) blend(x, y, beam, 0.2);
    else if (e < 1 && dither(x, y) < (1 - e) * 60) blend(x, y, beam, 0.12);
  }

  const boulder = (from, to, tall) => {
    for (let x = Math.min(from, to); x <= Math.max(from, to); x++) {
      const k = Math.abs(x - from) / Math.abs(to - from), h = Math.round(tall * Math.sqrt(Math.max(0, 1 - k * k)) + Math.sin(x * 1.7) * 0.8);
      for (let y = H - h; y < H; y++) solid(x, y, y === H - h ? S.rock[3] : S.rock[4]);
    }
  };
  boulder(-1, Math.round(W * 0.2), Math.round((H - horizon) * 0.28));
  boulder(W, Math.round(W * 0.84), Math.round((H - horizon) * 0.2));
  crystalCluster(Math.round(W * 0.92), H - Math.round((H - horizon) * 0.14), 10);
}

const beamWidth = (y) => life.hole.rx + (CHEST_W / 2 + 10 - life.hole.rx) * Math.min(1, y / life.dais.y);

/** The grotto's life: a brighter band sliding down the light, dust drifting in it, crystals and gold glinting,
    drops falling from the stalactites. */
function drawGrotto(t) {
  const cx = W / 2, d = life.dais, band = Math.floor((t * 1.5) % (d.y + 40));
  for (let y = band - 4; y <= band; y++) {
    if (y < 0 || y > d.y) continue;
    const hw = beamWidth(y);
    for (let x = Math.ceil(cx - hw); x < cx + hw; x++) if (dither(x, y) < 10) blend(x, y, S.beam, 0.1);
  }
  for (const m of life.beamMotes) {
    m.y += m.drift;
    if (m.y > d.y) m.y = 3;
    const x = cx + m.side * beamWidth(m.y) * 0.9 + Math.sin((t + m.phase) / 9) * 1.5;
    if (Math.sin((t + m.phase) / 4) > -0.2) put(x, m.y, S.mote);
  }
  for (const g of life.glints) {
    const s = Math.sin((t + g.phase) / 5);
    if (s > 0.94) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(g.x + dx, g.y + dy, g.c);
    else if (s > 0.8) put(g.x, g.y, g.c);
  }
  for (const drop of life.drops) {
    const age = (t + drop.at) % 90;
    if (age < 14) { if (age > 5) put(drop.x, drop.y, S.drip); continue; }   // swelling on the tip
    const y = drop.y + Math.round((age - 14) ** 2 * 0.25);
    if (y < drop.floor) put(drop.x, y, S.drip);
    else if (y < drop.floor + 5) { put(drop.x - 1, drop.floor - 1, S.drip); put(drop.x + 1, drop.floor - 1, S.drip); }
  }
}

/** Where the chest stands, in CSS pixels: its left edge, its feet (a y) and one scene pixel's size, or null. */
export function treasureSpots() {
  if (!life.dais || !canvas || S?.raw.backdrop !== 'treasure') return null;
  const box = canvas.getBoundingClientRect(), sx = box.width / W, sy = box.height / H;
  return { left: box.left + (life.dais.x - CHEST_W / 2) * sx, foot: box.top + (life.dais.y + 2) * sy, px: sx };
}

/** The chest in this grotto's colours, as little pixel images ({ url, w, h }) for the page to stand on the dais and open:
    the closed lid, the lid swung back (its inside, over a heap of gold) and the body. The latch is a Poké Ball split
    between lid and body, so opening the chest opens the ball. */
export function treasureChest() {
  if (S?.raw.backdrop !== 'treasure') return null;
  return { lid: paintProp(CHEST_W, LID_H, chestLid), open: paintProp(CHEST_W, OPEN_H, chestOpenLid), body: paintProp(CHEST_W, BODY_H, chestBody) };
}

/** Fill a shape (`mask`) with `colourAt`, outlined all round in the chest's line colour. */
function chestShape(mask, colourAt) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (mask(x, y)) solid(x, y, colourAt(x, y));
    else if ([-1, 0, 1].some(dy => [-1, 0, 1].some(dx => mask(x + dx, y + dy)))) solid(x, y, S.chest.line);
  }
}

/* The chest is a Poké Ball (a Great Ball, an Ultra Ball as the biomes go on): the ball's colour on the domed lid, a
   white body, the black band round the seam and the ball's button as the latch, half on the lid and half on the body. */
const LID_SPANS = [null, [8, 27], [5, 30], [3, 32], [2, 33]];
const BUTTON = { x: 18, y: 13 };   // the button's centre, in lid rows (the body's row 0 is lid row 13)

/** The ball's button: white, a grey ring, white again, then the black band's ring; null outside it. */
function chestButton(x, y) {
  const { band, button } = S.chest, d = Math.hypot(x + 0.5 - BUTTON.x, y + 0.5 - BUTTON.y);
  return d > 4.4 ? null : d > 3.4 ? band : d > 2.5 ? button[0] : d > 1.5 ? button[1] : button[0];
}

function chestLid() {
  const { lid, trim, band, marks } = S.chest;
  const span = (y) => (y >= 1 && y <= 11 ? LID_SPANS[y] || [1, 34] : null);
  chestShape((x, y) => { const s = span(y); return !!s && x >= s[0] && x <= s[1]; }, (x, y) => {
    const b = chestButton(x, y);
    if (b) return b;
    if (y >= 10) return band;
    const [s0, s1] = span(y), k = Math.min(x - s0, s1 - x);
    if (k <= 1) return trim[k];
    const shade = y <= 2 ? 0 : y <= 6 ? 1 : y <= 8 ? 2 : 3;
    if (marks === 'great' && k <= 7 && y >= 2 && y <= 8) return S.chest.mark[Math.max(0, shade - 1)];   // the Great Ball's red patches
    if (marks === 'ultra' && y <= 8 && ((x >= 10 && x <= 12) || (x >= 23 && x <= 25))) return trim[x === 10 || x === 23 ? 0 : 1];   // the Ultra Ball's H
    if (shade === 1 && y <= 4 && x >= 7 && x <= 10 && x - 7 <= y - 2) return lid[0];   // the shine
    return lid[shade];
  });
  for (let x = 16; x <= 20; x++) { const b = chestButton(x, 12); if (b) solid(x, 12, b); }   // the button carries on over the seam
}

function chestOpenLid() {
  const { lid, trim, coin = S.coin } = S.chest;
  chestShape((x, y) => y >= 1 && y <= 7 && x >= (y === 1 ? 3 : 1) && x <= (y === 1 ? 32 : 34), (x, y) => {
    if (y >= 6) return (x + y) % 3 === 0 ? coin[0] : (x * 3 + y) % 4 ? coin[1] : coin[2];   // the treasure inside
    const k = Math.min(x - 1, 34 - x);
    if (y === 1 || k <= 1) return trim[1];
    return y === 5 ? S.chest.band : y === 3 ? lid[3] : lid[2];   // the inside of the lid, in its shadow
  });
}

function chestBody() {
  const { body, trim, band } = S.chest;
  const feet = (x) => (x >= 2 && x <= 6) || (x >= 29 && x <= 33);
  chestShape((x, y) => (y >= 1 && y <= 11 && x >= 1 && x <= 34) || (y >= 12 && y <= 13 && feet(x)), (x, y) => {
    if (y >= 12) return band;
    const b = chestButton(x, y + BUTTON.y);
    if (b) return b;
    if (y <= 2) return band;
    if (x <= 2 || x >= 33) return trim[x === 1 || x === 33 ? 0 : x === 2 || x === 34 ? 1 : 2];
    if (y >= 10) return y === 10 ? trim[0] : trim[2];
    return y === 3 ? body[2] : y >= 8 ? body[y === 9 ? 3 : 2] : x % 11 === 4 && y === 5 ? body[0] : body[1];
  });
  for (let x = 16; x <= 20; x++) { const b = chestButton(x, BUTTON.y); if (b) solid(x, 0, b); }
}

/** Paint a pixel map (one string per row, one letter per pixel, '.' left alone) with `key`'s colours, its top left at x0, y0. */
function pixelMap(x0, y0, rows, key) {
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') solid(x0 + x, y0 + y, key[row[x]]); });
}

/** The healing machine on the counter, like the games': a monitor on its back showing the Center's cross, a tray with
    six recessed slots for Poké Balls in two staggered rows, a lip, and a white front with a red stripe, vents, two
    buttons and the status light. The slots sit empty until you rest (drawCenter). */
function healMachine(x0, top) {
  const [white, light, grey, slate, hole, green, maroon] = S.machine, [lite, blue, glare] = S.screen, [, , deep] = S.glow;
  const y0 = top - 17;
  pixelMap(x0, y0, [
    '......oooooooooo......',
    '......oLLLLLLLLo......',
    '......oLwcccccGo......',
    '......oLccRRccGo......',
    '......oLcRRRRcGo......',
    '......oLccRRccGo......',
    '......oGGGGGGGGo......',
    '.......ooGGGGoo.......',
    '.oooooooooooooooooooo.',
    'oWWWWWWWWWWWWWWWWWWWWo',
    'oLhhhLLhhhLLhhhLLLLLGo',
    'oLheeLLheeLLheeLLyLLGo',
    'oLLhhhLLhhhLLhhhLrLLGo',
    'oLLheeLLheeLLheeLLLLGo',
    'oGGGGGGGGGGGGGGGGGGGGo',
    'oWWWWWWWWWWWWWWWWWWWLo',
    'oRRRRRRRRRRRRRRRRRRRDo',
    'oWWWvWvWvWWWWWWWWbWWLo',
    '.oooooooooooooooooooo.',
  ], { o: slate, W: white, L: light, G: grey, h: hole, e: deep, c: lite, w: glare, R: S.ball[0], D: maroon, v: grey, y: green, r: S.ball[0], b: blue });
  for (let x = x0 + 1; x <= x0 + 22; x++) tint(x, top + 2, 0.85);
  // a ball rests centred in a slot: drawCenter puts it at (x + 1, y - 2)
  const slots = [2, 8, 14].map(c => [x0 + c, y0 + 12]).concat([3, 9, 15].map(c => [x0 + c, y0 + 14]));
  life.machine = { slots, light: { x: x0 + 17, y: y0 + 17 }, screen: { x0: x0 + 8, x1: x0 + 13, y0: y0 + 2, y1: y0 + 5 } };
  life.spots = { ...life.spots, machine: { x0, x1: x0 + 21, y0, y1: top + 1 } };
}

/** The Center's PC, like the games' art: a chunky cream CRT with a lit edge and a shaded one, a blue menu on its
    screen (the top row picked, its cursor blinking in drawCenter), power and disk lights, a stand, and a keyboard. */
function counterPc(x0, top) {
  const [beige, tan, brown, outline, cream, key] = S.pc, [lite, blue, glare] = S.screen;
  const y0 = top - 18;
  pixelMap(x0, y0, [
    '.ooooooooooooo.',
    'oBBBBBBBBBBBBbo',
    'oBbdddddddddbto',
    'oBdwmmmmmmmmdto',
    'oBdmlllllllmdto',
    'oBdmmmmmmmmmdto',
    'oBdmwwwwwmmmdto',
    'oBdmmmmmmmmmdto',
    'oBdmwwwwmmmmdto',
    'oBbdddddddddbto',
    'obbbbbbbbgbrbto',
    'ottttttttttttto',
    '.ooooooooooooo.',
    '.....ottto.....',
    '...oodddddoo...',
  ], { o: outline, B: cream, b: beige, t: tan, d: brown, m: blue, l: lite, w: glare, g: S.machine[5], r: S.ball[0] });
  pixelMap(x0 - 1, y0 + 15, [
    '.ooooooooooooooo.',
    'oBkBkBkBkBkBkBkBo',
    'okBkBkBkBkBkBkBko',
    'ottttttttttttttto',
  ], { o: outline, B: cream, k: key, t: tan });
  life.pc = { x: x0 + 3, y: y0 + 4 };
  life.spots = { ...life.spots, pc: { x0: x0 - 1, x1: x0 + 15, y0, y1: top } };
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
  if (has('treasure')) {
    const d = life.dais;
    life.beamMotes = Array.from({ length: Math.round(W / 6) }, () => ({ y: rand() * d.y, side: rand() * 2 - 1, drift: 0.04 + rand() * 0.08, phase: rand() * 60 }));
    life.drops = has('drips') ? life.tips.map(tip => ({ ...tip, at: Math.floor(rand() * 90) })) : [];
  }
  if (has('mart')) life.dust = Array.from({ length: Math.round(W / 8) }, () => ({ x: rand() * W, y: 8 + rand() * (horizon - 8), drift: 0.03 + rand() * 0.04, phase: rand() * 60 }));
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
  if (has('mart')) drawMart(t);
  if (has('treasure')) drawGrotto(t);
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
    if (storm.on) playSound('thunder');
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

/** The Center: your Poké Ball dropping into the machine's tray while you rest, then flashing with the chime; its screen
    and status light, the PC's cursor, the monitors' heartbeat trace and HP bars, and the clock's hands at the real time. */
function drawCenter(t) {
  const m = life.machine, [red, white, dark] = S.ball, [, blue, glare] = S.screen, [, , , bright] = S.monitor;
  const since = life.healAt == null ? -1 : t - life.healAt, f = life.flash;
  const flash = f && t >= f.from && t < f.to && Math.floor((t - f.from) / 2) % 2 === 0;   // in time with the chime
  if (since >= 0) {
    const [x, slotY] = m.slots[0], cy = slotY - 2 - Math.max(0, BALL_DROP - since) * 2;   // falls in from above
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > 2.4) continue;
      const c = flash ? (d > 1.9 ? S.glow[0] : white) : d > 1.9 || dy === 0 ? dark : dy < 0 ? red : white;
      put(x + 1 + dx, cy + dy, dx === 0 && dy === 0 ? white : c);
    }
  }
  if (flash) for (let y = m.screen.y0; y <= m.screen.y1; y++) for (let x = m.screen.x0; x <= m.screen.x1; x++) tint(x, y, 1.2, 30);
  if (t % 12 < 6 || since >= 0) put(m.light.x, m.light.y, since >= 0 ? S.glow[1] : blue);

  if (t % 8 < 4) put(life.pc.x, life.pc.y, glare);   // the menu cursor, beside the picked row

  for (const mon of life.monitors) {
    if (mon.kind === 'pulse') {
      const mid = (mon.y0 + mon.y1) >> 1, beat = [0, 0, 0, 0, 0, -1, -4, 3, 0, 0, 0, 0, 0, 0];
      for (let x = mon.x0; x <= mon.x1; x++) {
        const phase = ((x - mon.x0 - t) % beat.length + beat.length) % beat.length;
        const lead = ((t % (mon.x1 - mon.x0 + 1)) + mon.x0);
        put(x, Math.max(mon.y0, Math.min(mon.y1, mid + beat[phase])), Math.abs(x - lead) < 2 ? S.glow[1] : bright);
      }
    } else if (t % 16 < 8) {
      put(mon.x1 - 1, mon.y1, bright);   // a blinking cursor on the party screen
    }
  }

  const c = life.clock;
  if (c) {
    const now = new Date(), hand = (angle, len) => {
      for (let k = 1; k <= len; k += 0.5) put(c.cx + Math.round(Math.sin(angle) * k), c.cy - Math.round(Math.cos(angle) * k), dark);
    };
    hand((now.getHours() % 12 + now.getMinutes() / 60) * Math.PI / 6, c.r * 0.45);
    hand(now.getMinutes() * Math.PI / 30, c.r * 0.72);
    put(c.cx, c.cy, red);
  }
}

/** The Mart: each lamp's soft glow (one flickers now and then), clouds and the odd bird crossing the windows, dust in the light. */
function drawMart(t) {
  for (const l of life.lamps) {
    if ((t + l.phase) % 173 < 3) continue;   // a flicker
    for (let y = 0; y < 7; y++) for (let x = -2 - y; x <= 2 + y; x++) if (dither(l.x + x, l.y + y) < 9 - y) tint(l.x + x, l.y + y, 1.05, 6);
  }
  for (const w of life.windows) {
    const glass = (x, y) => x >= w.x0 && x <= w.x1 && y >= w.y0 && y <= w.y1 && x !== w.cx && y !== w.bar;
    const cx = w.x0 - 6 + Math.floor((t * 0.12 + w.cx * 3) % (w.x1 - w.x0 + 12));
    for (const [dx, dy] of [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, -1], [2, -1], [3, -1]]) {
      if (glass(cx + dx, w.y0 + 3 + dy)) put(cx + dx, w.y0 + 3 + dy, S.window[4]);
    }
    const fly = (t + w.cx * 11) % 240;
    if (fly < 50) {   // a bird flapping across
      const bx = w.x0 + Math.floor(fly * (w.x1 - w.x0) / 50), by = w.y0 + 2, flap = fly % 4 < 2 ? 1 : 0;
      for (const dx of [-1, 0, 1]) if (glass(bx + dx, by - (dx ? flap : 0))) put(bx + dx, by - (dx ? flap : 0), S.lamp[0]);
    }
  }
  for (const m of life.dust) {
    m.y -= m.drift;
    if (m.y < 8) m.y = horizon - 2;
    if (Math.sin((t + m.phase) / 5) > 0.2) put(m.x + Math.sin((t + m.phase) / 11) * 2, m.y, S.mote);
  }
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
  const conv = (v) => typeof v === 'string' && v.startsWith('#') ? abgr(v) : Array.isArray(v) ? v.map(conv)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, conv(x)])) : v;
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

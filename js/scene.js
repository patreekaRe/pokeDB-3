/* ============================================================
   scene.js  -  the pixel-art scene behind every screen: one per biome,
   lit for the player's time of day (js/daytime.js: dawn, day, dusk,
   night), with an elite's tenser light or a boss's dramatic arena laid
   over it, plus the pads the two Pokémon stand on in battle,
   like the Gen 3/4 games. The map and reward screens show their
   biome's normal scene, the menus the one that goes with the picked
   starter's type: its own canyon, seaside or jungle (the Clearing
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
import { timeOfDay, GRADES, gradeHex } from './daytime.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FPS = 8;
const dither = (x, y) => BAYER[((y % 4 + 4) % 4) * 4 + ((x % 4 + 4) % 4)];

/* ---------- the scenes ----------
   Each biome has its shared look, `times` one per time of day (a `from` look is graded from that one under its own
   sky; see biomeLook()), and `kinds` an elite's or a boss's mood laid over whatever time it is (a `grade` from GRADES
   in js/daytime.js, anything else it switches, and `addLife`).
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
    leaves: [['#e0d88a', '#91b461'], ['#b8d078', '#71934d']],
    firefly: ['#f8f8a0', '#c8e858'],
    marks: {   // the places' own colours (the stream, the landmarks), painted by day
      water: ['#e0f8ff', '#78c8f0', '#4898d8', '#2e6cb0'], bank: ['#3a7a30'],
      wood: ['#d0a068', '#a87840', '#744c24', '#3a2410'], stone: ['#e0e0d8', '#b0b0a8', '#808078', '#484844'],
      leaf: ['#78c860', '#4a9a40', '#2e7030', '#1a4a20'], fern: ['#88d060', '#4e9a3c', '#2e6a2a'],
      berry: ['#f04858', '#a82030', '#f8c8d0'], cap: ['#e84838', '#b02820', '#f8f0e0'], stem: ['#f0e8d0', '#c8b898'],
      bark: ['#7a5a3c', '#5a4028', '#3a2818', '#1c1008'], moss: ['#8ac858', '#5a9a40'], roof: ['#d85040', '#a03028'],
      cattail: ['#9a6030', '#6a3c1c'],
    },
    times: {
      day: {
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
      dusk: {   // sunset: the light goes gold and the shadows long
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
      night: {   // a moonlit night
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
      dawn: {   // the sun just up: a rose and peach sky, dew on the grass, the last fireflies going out
        from: 'day', sunLow: true,
        sky: ['#6a7cc0', '#8a8cc8', '#b09ccc', '#d4a8c4', '#eeb8b4', '#f8cca8', '#f8e0b8'],
        sun: ['#fffcec', '#fff0b8', '#f8d898'],
        cloud: ['#fff4ec', '#f8dcd8', '#e0b8c4', '#b898b0'],
        clouds: { count: 0.8 },
        life: ['clouds', 'birds', 'blades', 'pollen', 'fireflies'],
        fireflyCount: 0.3,
      },
    },
    kinds: {
      elite: { grade: 'elite' },
      boss: { grade: 'boss', clouds: { count: 1.4 }, addLife: ['leaves'] },
    },
  },

  shrine: {
    backdrop: 'shrine', floor: 'moss', light: null,
    storm: { rain: ['#d0e8f0', '#80a0b0'], fall: 3.5, count: 1, sky: [0.55, 0, 10, 18], ground: [0.72, 0, 4, 8] },
    trunk: ['#5a4430', '#382818'],
    torii: ['#d84830', '#a82c20', '#6a1810'],
    stone: ['#b8b8a8', '#8c8c7e', '#5e5e54'],
    mistColour: '#e8f0ec',
    rock: ['#a8aa98', '#80826e', '#565848'],
    lantern: ['#b0b0a0', '#7a7a6c', '#4a4a40'],
    lanternGlow: ['#fff0a0', '#f8b848', '#d87028'],
    wisp: ['#f0ffff', '#98e0f8', '#4898c8'],
    flowers: [['#f8f0f8', '#f8d8e8']],
    marks: {
      stone: ['#d0d0c0', '#a8a898', '#7c7c6e', '#40403a'], wood: ['#c08858', '#8a5430', '#5c361c', '#2e1a0c'],
      red: ['#e05038', '#a83020', '#6a1810'], plaster: ['#f4f0e4', '#d8d4c8', '#a8a498'], tile: ['#6a7080', '#484e5c', '#2a2e38'],
      gravel: ['#d8d4c8', '#ccc8bc', '#c0bcb0', '#a8a498'], bamboo: ['#b0e078', '#78b048', '#4a8030', '#2a5018'],
      water: ['#b8e8f0', '#5898b8', '#386e90'], koi: ['#f87830', '#f8f0e8'], paper: '#f8f4e8',
      bell: ['#d8b870', '#9a7a40', '#5a4820'], rope: ['#e8d8a0', '#b8a870'], moss: ['#7aa858', '#4e7a3a'],
      leaf: ['#6aaa58', '#3e7e42', '#24542c'], steam: ['#f0f0ec', '#c8c8c4'],
    },
    times: {
      day: {   // a misty morning under the trees
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
      dusk: {   // dusk: the lanterns are lit
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
      night: {   // night: spirits drift between the gates
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
      dawn: {   // pink first light through thick mist, the last lanterns still lit
        from: 'day', mist: 58, shafts: true,
        sky: ['#8a7c9c', '#a08aa4', '#b89aaa', '#cca8ac', '#dcb8b0', '#e8ccbc'],
        lanternsLit: true, lanternGlow: ['#fff0c8', '#f8c878', '#d88a48'],
        life: ['mist', 'blades', 'leaves', 'lanterns'],
      },
    },
    kinds: {
      elite: { grade: 'elite' },
      boss: { grade: 'boss', lanternsLit: true, addLife: ['wisps', 'lanterns'] },   // the spirits come out whatever the hour
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
    marks: {
      ash: ['#8e8680', '#847c76', '#7a726c', '#706862', '#665e58', '#5c544e'],
      bone: ['#f0ece0', '#c8c0b0', '#8a8070', '#3a322c'], dead: ['#7a6a60', '#54463e', '#362c26', '#1a1412'],
      rock: ['#d0c8bc', '#a89e94', '#766c64', '#3a322e'], basalt: ['#6e6874', '#4c4852', '#34313a', '#18161c'],
      obsidian: ['#a8a0c8', '#403850', '#241e30', '#0c0a10'], sulfur: ['#f8f070', '#e0c830', '#a08a18'],
      steam: ['#f0ece8', '#c0b8b4'], sign: ['#f0c840', '#b08820', '#241c10'],
    },
    times: {
      day: {   // a hazy, ashen day on the volcano's flank
        sky: ['#5a4448', '#74504c', '#8e5e50', '#a86e50', '#c08050', '#d49458', '#e0a868'],
        sun: ['#f8e8b8', '#f0c880', '#e0a060'],
        mountains: ['#6a4c48', '#56403c', '#463430'],
        volcano: ['#8a6a5c', '#6a5048', '#4a3632'],
        ground: ['#5e4e48', '#564842', '#4e423c', '#463a36', '#3e3430', '#362e2a'],
        crackGlow: 0.6, embers: 0.6,
        life: ['smoke', 'lava', 'embers', 'ash'],
        pad: { style: 'rock', top: '#7a6a62', mid: '#665850', low: '#544842', rim: '#1e1614', earth: '#3e3230', lava: '#f07820' },
      },
      dusk: {   // the air turns red
        sky: ['#2c1216', '#44181a', '#5e201e', '#7c2a20', '#9c3a22', '#bc5028', '#d46a30'],
        sun: ['#f8d0a0', '#f09050', '#d05830'],
        mountains: ['#4a2a26', '#3a2220', '#2c1a18'],
        volcano: ['#6e4038', '#52302a', '#38201c'],
        ground: ['#4e3a34', '#48342e', '#402e2a', '#382824', '#302220', '#281c1a'],
        crackGlow: 1, embers: 1.2,
        life: ['smoke', 'lava', 'embers', 'ash'],
        pad: { style: 'rock', top: '#6a524a', mid: '#58443e', low: '#483834', rim: '#140c0a', earth: '#342624', lava: '#f89030' },
      },
      night: {   // the dark lit from below: the cracks and the crater glow under a few stars
        light: 'moon', stars: true,
        sky: ['#0c0606', '#160a0a', '#220e0c', '#30120e', '#421810', '#5a2012', '#742a14'],
        cloud: ['#8a6a68'],
        mountains: ['#2a1614', '#221210', '#1a0e0c'],
        volcano: ['#4e3230', '#3a2422', '#261614'],
        ground: ['#3a2a26', '#342622', '#2e221e', '#281e1a', '#221a16', '#1c1612'],
        smoke: ['#5a4644', '#443634', '#322826', '#241c1a'],
        crackGlow: 1.4, embers: 1.6,
        life: ['stars', 'smoke', 'lava', 'embers', 'ash'],
        pad: { style: 'rock', top: '#5a4640', mid: '#4a3a34', low: '#3c2e2a', rim: '#0c0606', earth: '#2a1e1c', lava: '#f8a830' },
      },
      dawn: {   // first light behind the ash: a bruised violet sky going gold at the rim
        from: 'day', sunLow: true,
        sky: ['#2e2440', '#46304c', '#663c52', '#8a4c54', '#b06050', '#d07c50', '#e8a060'],
        sun: ['#fff0c8', '#f8c070', '#e08850'],
        life: ['smoke', 'lava', 'embers', 'ash'],
      },
    },
    kinds: {
      elite: { grade: 'elite' },
      boss: { grade: 'boss', erupting: true, crackGlow: 1.4, embers: 2, addLife: ['lightning', 'eruption'] },   // the volcano erupts
    },
  },
};

/* ---------- the menus: one scene per starter type, seen nowhere else ----------
   Same shape as a biome's scene, without kinds, pads or storms. Each is painted at its `native` time (day unless
   said); `times` gives the others their sky and switches, the rest graded (typeLook()) unless `grade: false`. */
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
    native: 'dusk',
    times: {
      dawn: { grade: false, sky: ['#3a3468', '#5a4478', '#865486', '#b86a88', '#e08a84', '#f0aa88', '#f8c8a0', '#f8dcb8'], sun: ['#fffcec', '#f8e0a0', '#f0b078'] },
      day: { grade: false, sunLow: false, sky: ['#3a7ad8', '#5090e0', '#68a4e8', '#84b8ec', '#a0caf0', '#bcd8ec', '#d8e4e0', '#ece8d0'], sun: ['#fffce8', '#fff0a0', '#f8e070'] },
      night: { light: 'moon', stars: true, sky: ['#0a0a22', '#10102e', '#18163a', '#221c46', '#2e2450', '#3a2c58', '#48345e', '#583c62'], life: ['campfire'] },
    },
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
    times: {
      dawn: { sunLow: true, sky: ['#6878c0', '#8888c8', '#aa98cc', '#cca4c8', '#e8b4c0', '#f8c8b8', '#f8dcc4'], sun: ['#fffcec', '#fff0b8', '#f8d898'] },
      dusk: { sunLow: true, sky: ['#2a2a6a', '#46357a', '#6e4488', '#a05888', '#d07078', '#f0906a', '#f8b070'], sun: ['#fff4d0', '#f8c868', '#f08848'] },
      night: { light: 'moon', stars: true, sky: ['#060a22', '#0a1030', '#10183e', '#16204a', '#1e2a56', '#263462', '#2e3c6a'], life: ['clouds', 'surf'] },
    },
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
    firefly: ['#f8f8a0', '#c8e858'],
    times: {
      dawn: { sky: ['#f8e0d0', '#f0d4c0', '#e0ccb0', '#c8c4a0'] },
      dusk: { sky: ['#f8c880', '#f0a868', '#d88a58', '#b07050'], fireflyCount: 0.5, life: ['vines', 'blades', 'pollen', 'fireflies'] },
      night: { sky: ['#283e5a', '#20344c', '#1a2c40', '#142434'], fireflyCount: 1.4, life: ['vines', 'blades', 'fireflies'] },
    },
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

  /* ? events outdoors: the biome's own scene (BIOME_ART's wild look: its sky, backdrop and ground) with the event's
     props in the middle (`prop`, painted by eventProps()); `biomes` retints the props to suit the biome. */
  berry: {   // an Oran Berry tree in a plot of soft soil, like the games' berry plots, and an empty plot with a sign
    outdoor: true, prop: 'berry', horizon: 0.5, zoom: 1.75, span: 76,
    leaf: ['#98e070', '#62b84c', '#3e9040', '#246a2e'], leafLine: '#15401c',
    bark: ['#b07c4c', '#7e5430', '#54341c'],
    berry: ['#e0f4ff', '#60a8f8', '#2e68d8', '#1a3c90'], stem: '#3e9a38',
    soil: ['#a87448', '#7e5230', '#5e3a20', '#4a2c16', '#2a180c'],
    wood: ['#f0c888', '#c08850', '#7a4c28', '#3a2412'],
    life: ['berry'],
    biomes: {
      shrine: { leaf: ['#88d078', '#52a458', '#347e46', '#1e5a34'], leafLine: '#0e3620' },
      wastes: {   // a hardy, sun-scorched tree in ashy soil
        leaf: ['#c8c060', '#98a040', '#6e7a32', '#465024'], leafLine: '#262a10',
        soil: ['#8a6a58', '#5e463a', '#46342c', '#382822', '#1a100c'],
      },
    },
  },

  /* the Hot Spring, close up: standing at the edge of a big steaming rock pool (soak), a little one below it fed by a
     bamboo spout (dip), a bamboo fence, a stone lantern, the ♨ sign and a bucket. Its own scene: `biomes` gives each
     its look (a sunny garden, misty cedars, a steaming volcanic rock wall). */
  spring: {
    open: true, backdrop: 'onsen', floor: 'onsen', prop: 'spring', light: null, horizon: 0.48,
    water: ['#f0ffff', '#a8f0f0', '#60d0dc', '#3a9ac0', '#246a98'],
    steam: '#ffffff',
    poolStone: ['#e8e8e0', '#b8b8b0', '#86867e', '#3a3a38'],
    onsen: ['#fff4dc', '#e03828'],
    wood: ['#f0c888', '#c08850', '#7a4c28', '#3a2412'], hoop: '#505058', towel: ['#ffffff', '#c8d8f0'],
    bamboo: ['#c8e878', '#90c050', '#5a8a30', '#2a4418'], tie: '#3a2412',
    altarStone: ['#e0e0d8', '#b0b0a8', '#80807a', '#303030'], glow: ['#fffce0', '#f8d878', '#e0a040'],
    duck: ['#f8e048', '#c8a018', '#f89830'],
    life: ['spring'],
    biomes: {
      clearing: {   // a sunny garden: sky over green hills and round trees, a bamboo fence, grey flagstones, maple leaves
        wall: 'garden', light: 'sun',
        sky: ['#78c8f8', '#a0dcf8', '#c8ecf8', '#e8f8f8'],
        sun: ['#fffce8', '#fff4b0', '#fff8d8'],
        farHills: ['#a8d8b0', '#90c8a0'], hills: ['#80c060', '#62a84c', '#4a8a3c'],
        trees: ['#98d860', '#6ab848', '#4a9438', '#2e6e2c'], trunk: ['#8a5a34', '#5e3a20'],
        ground: ['#c8c8c0', '#b4b4ac', '#a0a098', '#8a8a82'], groundLine: '#6a6a64', moss: ['#8ac860', '#5a9a44'],
        leaves: [['#f86040', '#c83820'], ['#f8a040', '#d06828']],
        life: ['spring', 'leaves'],
      },
      shrine: {   // old cedars in the mist behind a dark bamboo fence, mossy flagstones, autumn leaves drifting down
        wall: 'cedars',
        sky: ['#2e6e30'],
        leaf: ['#6a9a70', '#4e7e58', '#3a6448', '#284a36', '#183024'],
        bark: ['#9a6a50', '#7a4e3c', '#5a362a', '#2e1a14'],
        rope: ['#f0e0a0', '#c0a060', '#8a7040'], paper: '#ffffff', mistColour: '#e8f0ec',
        bamboo: ['#b0a070', '#8a7850', '#5e5034', '#2a2418'],
        poolStone: ['#d0d4c0', '#a2a894', '#747a68', '#2e3428'],
        ground: ['#a0ac94', '#909e86', '#808e78', '#707e6a'], groundLine: '#4e5a48', moss: ['#8ac068', '#5a9048'],
        water: ['#f0fff8', '#b0f0e0', '#70d0c0', '#3a9aa0', '#20687a'],
        leaves: [['#f8a040', '#c85828'], ['#f86050', '#a83028']],
        life: ['spring', 'leaves'],
      },
      wastes: {   // a milky pool under a cliff of volcanic rock, steam vents in its cracks, embers drifting
        wall: 'rock',
        sky: ['#3a2e30'],
        rock: ['#6a5250', '#523e3e', '#3e2e30', '#2e2224', '#1a1214'],
        vein: ['#f8b030', '#e05820'],
        poolStone: ['#9a8078', '#745a52', '#54403a', '#1e1412'],
        altarStone: ['#a08c84', '#7a6660', '#54403a', '#1a1012'], glow: ['#fff0c0', '#f8a830', '#e05820'],
        bamboo: ['#9a8a80', '#6a5a54', '#4a3c38', '#1a1012'],   // a charred wooden pipe
        ground: ['#5a4a46', '#524440', '#4a3c3a', '#423634'], groundLine: '#2a1e1c',
        water: ['#ffffff', '#e0f4f0', '#a8dcd8', '#78b8c0', '#4a8898'],
        ember: ['#fff0a0', '#f8a830', '#e85820'], embers: 0.4,
        life: ['spring', 'embers'],
      },
    },
  },

  well: {   // an old stone wishing well under a tiled roof, with a crank and a bucket, coins glinting in the water
    outdoor: true, prop: 'well', horizon: 0.5, zoom: 1.75, span: 54,
    wellStone: ['#e0e4ec', '#b4bac8', '#8a90a0', '#6a7080', '#303440'],
    wellWater: ['#4a7ab8', '#1e3c70', '#0c1a38'],
    roof: ['#f87858', '#e04030', '#a82820', '#501010'],
    wood: ['#f0c888', '#c08850', '#7a4c28', '#3a2412'], hoop: '#505058',
    rope: ['#e8d098', '#a88850'],
    coin: ['#fff8b0', '#f8c830', '#b07818'], wish: '#fff8d0',
    life: ['well'],
    biomes: {
      shrine: {   // mossy stones under a green copper roof
        wellStone: ['#d4d8c4', '#a8ae98', '#7c846e', '#5e6a50', '#283020'],
        roof: ['#88d0b0', '#4aa080', '#2e7458', '#123828'],
      },
      wastes: {   // dark basalt under slate
        wellStone: ['#a08c84', '#7a6660', '#5a4844', '#46363a', '#1a1012'],
        roof: ['#8a8a98', '#5e5e6a', '#3e3e48', '#18181e'],
      },
    },
  },

  itemball: {   // a Poké Ball lying in a patch of tall grass, like an item ball in the games (or a Voltorb...)
    outdoor: true, prop: 'itemball', horizon: 0.5, zoom: 1.75, span: 60,
    tall: ['#a8f070', '#60c040', '#389028', '#185818'],
    ball: ['#f8f8f8', '#b8b8c8', '#f04030', '#a82018', '#202028'],
    boom: ['#ffffff', '#fff070', '#f89020', '#d83818'], smoke: ['#d0d0d0', '#8a8a8a'],
    life: ['itemball'],
    biomes: {
      shrine: { tall: ['#98e0a0', '#50a868', '#307c48', '#16482a'] },
      wastes: { tall: ['#d8d078', '#a8a048', '#767030', '#403c18'] },   // dry, sun-scorched grass
    },
  },

  rocket: {   // a Team Rocket roadblock: the page stands the grunt and their Pokémon on `life.stands` as real sprites; a bush to run through
    outdoor: true, prop: 'rocket', horizon: 0.5, zoom: 1.75, span: 90,
    plank: ['#383840', '#202028', '#e03830', '#901818', '#101014'],
    wood: ['#f0c888', '#c08850', '#7a4c28', '#3a2412'],
    coin: ['#fff8b0', '#f8c830', '#b07818'],
    bush: ['#88d060', '#50a040', '#307428', '#143c14'],
    life: ['rocket'],
    biomes: {
      shrine: { bush: ['#78c880', '#449858', '#2a6e40', '#0e3a20'] },
      wastes: { bush: ['#b8b060', '#88883c', '#5e6028', '#2a2a10'] },
    },
  },

  /* the Move Tutor's dojo: plaster between timber posts, a chalkboard over Alder's straw mat (pay ₽), a sandbag (pay HP) */
  tutor: {
    backdrop: 'dojo', floor: 'planks', prop: 'tutor', light: null, horizon: 0.6, sky: ['#f4ead0'],
    wall: ['#f4ead0', '#e4d6b4', '#c8b490', '#fff8e4'],
    trim: ['#c08850', '#8a5a30', '#5e3a1c', '#2e1a0c'],
    plank: ['#d8a868', '#c49058', '#a87444', '#6a4424'],
    board: ['#2e6a48', '#285c3e'], chalk: '#f0f8f0',
    coin: ['#fff8b0', '#f8c830', '#b07818'],
    tatami: ['#d8d890', '#b8b870', '#3a5a30'],
    bag: ['#f0d8a8', '#d8b880', '#a88050', '#3a2412'], rope: ['#e8d098', '#a88850'],
    view: ['#a0dcf8', '#d0f0f8', '#58a044', '#88c070'],
    life: ['tutor'],
    biomes: {
      shrine: { view: ['#d8e8e0', '#f0f8f4', '#3a6448', '#6a9a70'] },
      wastes: { view: ['#f09048', '#f8c878', '#3e2e30', '#6a5250'], volcano: true },
    },
  },

  /* Chad Master Kenmatta's arena, after Mortal Kombat's courtyards: a temple wall under a blood-red night, its gate tower
     bearing a gold medallion with a roaring Dragonite for the MK dragon, braziers on red pillars either side, banners,
     stone flags. Always night (the clock doesn't reach it). A battle scene, so no `horizon`: it follows the enemy's pad. */
  kombat: {
    backdrop: 'kombat', floor: 'kombat', light: null,
    sky: ['#0c0612', '#1e0a1e', '#3a0e22', '#6a1620', '#a8301a'],
    cloud: ['#fff0e0'],
    peaks: ['#3e1a26', '#2a1220', '#1c0c16'],
    stone: ['#8a7870', '#6c5c56', '#52443f', '#2c2224', '#160e10'],
    roof: ['#4a4248', '#2e282e', '#1a1418', '#a82820'],
    lacquer: ['#f05038', '#b82820', '#781418', '#2a0808'],
    gold: ['#fff4b8', '#f8c830', '#c88a18', '#7a4c10', '#2e1806'],
    medal: ['#2a0a10', '#1a060a'],
    eye: ['#fff8f0', '#ff3828', '#a01010'],
    flame: ['#fffce0', '#fff070', '#f8a830', '#e85820', '#a82818'],
    banner: ['#d83830', '#a01c1c', '#5a0c10'],
    tile: ['#6a5e58', '#564c48', '#463e3c', '#1e1618'],
    ember: ['#fff0a0', '#f8a830', '#e85820'], embers: 0.7,
    pad: { style: 'stone', top: '#7a6e66', mid: '#645a54', low: '#504844', rim: '#160e10', earth: '#2e2628', moss: '#b82820' },
    storm: { rain: ['#fff0a0', '#f06820'], fall: 1.1, count: 0.5, sky: [0.75, 40, 0, 6], ground: [0.85, 22, 0, 0] },
    life: ['kombat', 'embers'],
  },

  /* the Move Deleter's study: dim striped paper, shelves of old books, a lectern with a big open book (forget one) and a
     hypnotist's pendulum (forget two), candles, a Slowpoke dozing (the page's figure) */
  deleter: {
    backdrop: 'study', floor: 'planks', prop: 'deleter', light: null, horizon: 0.6, sky: ['#5a4a6a'],
    wall: ['#5a4a6a', '#4e4060', '#3e3250', '#7a6a8a'],
    trim: ['#9a6a48', '#6e4a30', '#4a2e1c', '#1e120a'],
    plank: ['#8a6448', '#7a563c', '#644430', '#2e1e14'],
    books: ['#b83828', '#3868b8', '#388858', '#c89830', '#8a4ab0', '#d8d0b8'],
    page: ['#fff8e4', '#d8c8a0', '#4a3a30'], wax: ['#fff8e8', '#d8ccb0'],
    flame: ['#fff8c0', '#f8a830'], chalk: '#e8e8f0', coin: ['#fff8b0', '#f8c830', '#b07818'],
    hypno: ['#f878c8', '#a878f8'],
    view: ['#283868', '#485890', '#1a2440', '#303e68'],
    life: ['deleter'],
    biomes: {
      shrine: { view: ['#3a4a58', '#5a6a78', '#1e2a24', '#2e3e34'] },
      wastes: { view: ['#5a2418', '#a84828', '#1a1012', '#3a2420'], volcano: true },
    },
  },

  /* the Day Care: the couple's clapboard house and its DAY CARE board behind a white picket fence, an Egg in a straw
     nest in the yard (trade), and two of the Pokémon they're raising (the page's figures) */
  daycare: {
    open: true, backdrop: 'daycare', floor: 'yard', prop: 'daycare', light: null, horizon: 0.56, sky: ['#fff4dc'],
    siding: ['#fff4dc', '#f0e0c0', '#d8c098', '#a88a60'],
    roof: ['#f87858', '#e04030', '#a82820', '#501010'],
    trim: ['#c08850', '#8a5a30', '#5e3a1c', '#2e1a0c'],
    signBoard: ['#fffcf0', '#f8f0d8', '#6a5a48'], coin: ['#fff8b0', '#f8c830', '#b07818'],
    flowers: ['#f878a8', '#f8d030', '#f8f8f8', '#a878f8'],
    picket: ['#ffffff', '#c8c8d8', '#6a6a78'],
    ground: ['#88d060', '#78c058', '#68b050', '#58a048'], blade: ['#b8f080', '#4a9038'],
    straw: ['#f8e098', '#d8b868', '#a08040', '#5a4420'],
    egg: ['#fffcf0', '#e8e0c8', '#78c868', '#3a3a30'],
    view: ['#a0dcf8', '#d0f0f8', '#58a044', '#88c070'],
    life: ['daycare'],
    biomes: {
      shrine: { ground: ['#88c088', '#78b078', '#68a06a', '#58905c'], blade: ['#a8e0a0', '#3a7448'], view: ['#d8e8e0', '#f0f8f4', '#3a6448', '#6a9a70'] },
      wastes: {   // dry, sun-scorched grass, ash on the walls
        ground: ['#c8b870', '#b8a860', '#a89850', '#988840'], blade: ['#e0d088', '#7a6a30'],
        siding: ['#e8dcc8', '#d8c8b0', '#b8a888', '#8a7a60'], view: ['#f09048', '#f8c878', '#3e2e30', '#6a5250'], volcano: true,
      },
    },
  },

  /* the Pokémon Fan Club: striped paper hung with portraits of prize Pokémon and pennants, a red carpet to a little stage
     under a spotlight (show off, or their gift beside it), the members' Pokémon either side (the page's figures) */
  fans: {
    backdrop: 'fanclub', floor: 'carpet', prop: 'fans', light: null, horizon: 0.6, sky: ['#fce0e8'],
    wall: ['#fce0e8', '#f4c8d4', '#e8a8b8', '#fff0f4'],
    trim: ['#c08850', '#8a5a30', '#5e3a1c', '#2e1a0c'],
    plank: ['#d8a868', '#c49058', '#a87444', '#6a4424'],
    flags: ['#e04030', '#f8c030', '#3878f0', '#58b858', '#f070a8'], lamp: ['#505060'],
    coin: ['#fff8b0', '#f8c830', '#b07818'],
    portraits: [['#98d8f8', '#f8d030', '#c89818'], ['#f8e0a8', '#f8a8c8', '#d07898'], ['#c8f0c0', '#a878d8', '#7850a8'], ['#f8c8a0', '#e8e8f0', '#b0b0c0']],
    carpet: ['#d83838', '#b02828', '#f8c830'],
    stage: ['#fff0c8', '#f0d8a0', '#c89858', '#5a3a1c'],
    gift: ['#58a8f8', '#3878d0', '#f8d030'],
    spot: '#fffce0', heart: '#f85888',
    life: ['fans'],
  },

  /* the Shrine, close up: standing right in front of a little wooden shrine (like Ilex Forest's) on its stone steps,
     your type's power glowing through its doorway, stone lanterns either side of you, a fence and the grove (or rock)
     behind. Its own scene, not a prop in the biome's: `biomes` gives each its look, `types` the glow. */
  altar: {
    open: true, backdrop: 'altar', floor: 'altar', prop: 'altar', light: null, horizon: 0.52,
    sky: ['#2e6e30'],
    wood: ['#f0c888', '#c08850', '#7a4c28', '#3a2412'],
    roof: ['#b87860', '#8a4c3a', '#5e2e24', '#2a1410'],
    altarStone: ['#e0e0d8', '#b0b0a8', '#80807a', '#303030'],
    inside: '#140c0c', rope: ['#f0e0a0', '#c0a060', '#8a7040'], paper: '#ffffff', hp: ['#ffd0d8', '#f05878'],
    bell: ['#fff8b0', '#f8c830', '#b07818', '#5a3a08'], cord: ['#f04030', '#ffffff', '#901818'],
    glow: ['#ffffff', '#fff0a0', '#e0e0e0'],
    types: {
      fire: { glow: ['#fff8d0', '#f8a030', '#e04818'] },
      water: { glow: ['#f0fcff', '#60b0f8', '#2860d0'] },
      grass: { glow: ['#f8ffd0', '#80d850', '#309030'] },
      psychic: { glow: ['#fff0fc', '#f878c8', '#b03890'] },
    },
    biomes: {
      clearing: {   // a sunny grove: a wall of leaves behind a plain wooden fence, raked white gravel, a grey stone path
        wall: 'leaves',
        leaf: ['#b8e878', '#80c858', '#58a444', '#3a7a34', '#22522a'],
        fence: ['#f0c888', '#c08850', '#7a4c28', '#3a2412'],
        ground: ['#e8e0c8', '#dcd4ba', '#d0c8ac', '#c4bc9e'],
        pollen: ['#fffce0', '#e8f8a0'],
        leaves: [['#98e070', '#62b84c'], ['#c8e878', '#80b840']],
        life: ['altar', 'pollen', 'leaves'],
      },
      shrine: {   // old cedars in the mist behind a vermilion fence, mossy flagstones, autumn leaves, spirit wisps
        wall: 'cedars', roof: ['#88d0b0', '#4aa080', '#2e7458', '#123828'],   // green copper, like the torii's shrine
        leaf: ['#6a9a70', '#4e7e58', '#3a6448', '#284a36', '#183024'],
        bark: ['#9a6a50', '#7a4e3c', '#5a362a', '#2e1a14'],
        mistColour: '#e8f0ec',
        fence: ['#f87858', '#e04030', '#a82820', '#501010'],
        ground: ['#a0ac94', '#909e86', '#808e78', '#707e6a'],
        moss: ['#8ac068', '#5a9048'],
        leaves: [['#f8a040', '#c85828'], ['#f86050', '#a83028']],
        wisp: ['#f0ffff', '#98e0f8', '#4898c8'],
        life: ['altar', 'leaves', 'wisps'],
      },
      wastes: {   // cut into an obsidian cliff: glowing veins, a basalt fence and flagstones with lava in the cracks
        wall: 'rock', roof: ['#8a8a98', '#5e5e6a', '#3e3e48', '#18181e'],
        rock: ['#6a5250', '#523e3e', '#3e2e30', '#2e2224', '#1a1214'],
        vein: ['#f8b030', '#e05820'],
        altarStone: ['#a08c84', '#7a6660', '#54403a', '#1a1012'],
        fence: ['#8a7a74', '#6a5a54', '#4a3c38', '#1a1012'],
        ground: ['#5a4a46', '#524440', '#4a3c3a', '#423634'],
        ember: ['#fff0a0', '#f8a830', '#e85820'], embers: 0.5,
        life: ['altar', 'embers'],
      },
    },
  },
};


let canvas = null, ctx = null, S = null, timer = 0, tick = 0;
let W = 0, H = 0, horizon = 0, base = null, img = null, px = null, sky = null, rand = Math.random;
let life = {};
let bossPrelude = null;
let shown = '';                 // which scene is up, so going back to it doesn't restart it
let floorAt = null, spanAt = null;   // a place whose floor line and counter the page sets (showPlaceScene's `floor` and `span`)
let storm = { on: false, level: 0 };

/* ---------- the time of day (js/daytime.js) ----------
   A biome has a hand-painted look per time (`times`; one with `from` is that time's look graded, under its own sky), and
   `kinds` lays an elite's or a boss's mood over it. Everything else is graded from the look it was painted in. */

// lights that glow of their own accord, so the dark doesn't dim them; `storm` has its own tints
const GLOWS = new Set(['sun', 'flame', 'lanternGlow', 'glow', 'firefly', 'lava', 'ember', 'wisp', 'spot', 'vein', 'boom',
  'wish', 'hp', 'heart', 'coin', 'crystal', 'steam', 'beam', 'mote', 'glint', 'storm', 'chalk', 'pollen']);
const SKIES = new Set(['sky', 'cloud']);

/** A copy of `art` with every colour but the glows run through a grade ({ sky, land } from GRADES); `only` limits it to those keys. */
function grade(art, g, only = null) {
  if (!g) return art;
  const walk = (v, tone) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? gradeHex(v, tone)
    : Array.isArray(v) ? v.map(x => walk(x, tone))
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, tone)])) : v;
  return Object.fromEntries(Object.entries(art).map(([k, v]) =>
    [k, GLOWS.has(k) || (only && !only.includes(k)) ? v : walk(v, SKIES.has(k) ? g.sky : g.land)]));
}

/** The sun and stars for the time, on a scene painted by day: the moon comes out at night, the sun sits low at either end. */
function relight(art, time) {
  if (time === 'night' && (art.light === 'sun' || art.light === 'haze')) return { ...art, light: 'moon', stars: true };
  if ((time === 'dawn' || time === 'dusk') && art.light === 'sun') return { ...art, sunLow: true };
  return art;
}

/** A biome's look at this time for a fight kind, or its plain look (the map's, an event's) with no kind. */
function biomeLook(art, time, kind = null) {
  const { times, kinds, ...shared } = art;
  const { from, ...own } = times[time] || times.day;
  let look = from ? { ...grade({ ...shared, ...times[from] }, GRADES[time]), ...own } : { ...shared, ...own };
  // the places' own colours (`marks`) are painted by day; a hand-painted time grades them into its light
  // (a shade darker than the grade alone: the hand-painted dusk and night are darker than it)
  if (!from && shared.marks && !own.marks && GRADES[time]) look.marks = grade(grade({ marks: shared.marks }, GRADES[time]), { sky: [0.82, 0, 0, 0], land: [0.82, 0, 0, 0] }).marks;
  const mood = kinds?.[kind];
  if (mood) {
    const { grade: g, addLife = [], ...rest } = mood;
    look = { ...grade(look, GRADES[g]), ...rest, life: [...new Set([...look.life, ...addLife])] };
  }
  return look;
}

/** A menu's type scene at this time: its own sky and switches, the land graded unless the time says not to. */
function typeLook(art, time) {
  const { times, native = 'day', ...rest } = art;
  if (time === native) return rest;
  const { grade: g = true, ...own } = times?.[time] || {};
  return { ...relight(g ? grade(rest, GRADES[time]) : rest, time), ...own };
}

/** The menus' scene: each starter type has its own (TYPE_ART); before one is picked, the Clearing, like the title screen. */
export function showMenuScene(type) {
  const time = timeOfDay();
  if (TYPE_ART[type]) paintScene(`menu/${type}/${time}`, typeLook(TYPE_ART[type], time));
  else showScene('clearing');
}

/** An indoor scene for a room on the map (PLACE_ART), e.g. 'center' for the Pokémon Center. `floor` (a function giving
    a page y) puts the floor line there instead, so a room drawn by the page (the Mart's counter) stands on the tiles, and
    `span` (one giving its page [left, right]) lets the scene dress its ends. A place with `biomes` (the treasure
    grotto, the Shrine) takes its look from `biome`, and its `types` (the Shrine's glow) retint it for your Pokémon's
    `type`; an `outdoor` one (a ? event) stands in that biome's own scene, as far along as `where` (see showScene), minus
    the floor's landmark, which would crowd the props. */
export function showPlaceScene(place, { floor = null, span = null, biome = null, type = null, where = 0 } = {}) {
  const { biomes, types, ...art } = PLACE_ART[place];
  const time = timeOfDay(), g = GRADES[time];
  if (art.outdoor) {
    const { storm, pad, life: own, ...wild } = biomeLook(BIOME_ART[biome] || BIOME_ART.clearing, time);
    const props = grade({ ...art, ...biomes?.[biome] }, g);
    const at = { ...journeyOf(where), step: null };
    paintScene(`place/${place}/${biome}/${type}/${time}/${placeKey(at)}`, { ...wild, ...props, ...types?.[type], life: [...own, ...art.life], ...at }, floor, span);
    return;
  }
  const look = biomes && (biomes[biome] || Object.values(biomes)[0]), glow = types?.[type];
  let lit = { ...art, ...look, ...glow };
  // open-air close-ups take the light whole; indoors only the view through the windows changes
  if (art.open) {
    // an open sky (the Hot Spring's garden) is the biome's own for the time, not a graded blue
    const sky = lit.sky?.length > 1 && g ? biomeLook(BIOME_ART[biome] || BIOME_ART.clearing, time).sky : null;
    lit = relight(grade(lit, g), time);
    if (sky) lit.sky = sky;
  }
  else if (g && (lit.view || lit.window)) {
    lit = { ...lit, ...grade(lit, { sky: g.sky, land: g.sky }, ['view']) };
    if (lit.window) { const [frame, ...rest] = lit.window; lit.window = [frame, ...rest.map(c => gradeHex(c, g.sky))]; }
  }
  paintScene(`place/${place}${look ? `/${biome}` : ''}${glow ? `/${type}` : ''}/${time}`, lit, floor, span);
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
 * `where` is where you are on the biome's journey (journey() in js/map.js; a bare number is just the progress):
 * `progress`, 0 on the road in to 1 at the boss, moves the scenery a notch every floor (the Clearing's meadow thickens
 * into woods, the Shrine gains gates, lanterns and mist, the Wastes' volcano looms nearer); `stage` picks the place,
 * 3 per biome plus the boss's arena (STAGES), and `step` / `seed` the floor's landmark (LANDMARKS), different on every
 * floor of a place. The clock still decides the light.
 * Asking again for the scene that's already up leaves it running, except in battle, where the
 * horizon is fitted to the enemy's pad and every fight starts with calm weather.
 */
export function showScene(biomeId, kind = 'wild', where = 0) {
  const art = BIOME_ART[biomeId];
  if (!art) { paintScene('', null); return; }
  const time = timeOfDay(), at = journeyOf(where);
  paintScene(`${biomeId}/${kind}/${time}/${placeKey(at)}`, { ...biomeLook(art, time, kind), ...at });
}

function journeyOf(where) {
  const { progress = 0, stage = null, step = 0, seed = 0 } = typeof where === 'number' ? { progress: where } : where || {};
  // a bare progress (the title, the menus) stands in its place with no landmark
  return { progress, stage: stage ?? Math.min(3, progress >= 1 ? 3 : Math.floor(progress * 11 / 3.5)), step: stage == null ? null : step, seed };
}
const placeKey = ({ progress, stage, step, seed }) => `${Math.round(progress * 100)}/${stage}/${step}/${seed}`;

function paintScene(key, raw, floor = null, span = null) {
  canvas = $('scene-bg');
  ctx = canvas.getContext('2d');
  document.body.classList.toggle('has-scene', !!raw);
  floorAt = floor;
  spanAt = span;
  if (raw && key === shown && document.body.dataset.screen !== 'battle-screen') { if (floor) resize(); return; }
  shown = key;
  bossPrelude = null;
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

/** Hold on an empty boss arena, awaken its landmark, then open a flash into the Pokémon reveal. */
export async function bossArenaPrelude() {
  if (!['hills', 'shrine', 'volcano'].includes(S?.raw.backdrop) || S.raw.stage !== 3) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (['hills', 'shrine', 'volcano'].includes(S?.raw.backdrop) && S.raw.stage === 3) {
      bossPrelude = { phase: 'awake', at: tick };
      draw();
    }
    return;
  }
  const backdrop = S.raw.backdrop;
  bossPrelude = { phase: 'wake', at: tick };
  draw();
  for (const [frame, sound] of preludeSounds()[backdrop]) {
    setTimeout(() => { if (bossPrelude?.phase === 'wake' && S?.raw.backdrop === backdrop) playSound(sound); }, frame * 1000 / FPS);
  }
  await new Promise(resolve => setTimeout(resolve, 3600));
  if (!['hills', 'shrine', 'volcano'].includes(S?.raw.backdrop) || S.raw.stage !== 3) return;
  bossPrelude = { phase: 'portal', at: tick };
  draw();
  await new Promise(resolve => setTimeout(resolve, 1100));
  if (!['hills', 'shrine', 'volcano'].includes(S?.raw.backdrop) || S.raw.stage !== 3) return;
  bossPrelude = { phase: 'awake', at: tick };
  draw();
}

addEventListener('resize', () => { if (S) resize(); });

function resize() {
  // a close-up (an event's) zooms in, with bigger pixels, as far as its props (`span` pixels across) still fit the screen
  const near = innerWidth <= 720 ? 4 : 5, scale = S.raw.zoom ? Math.max(near, Math.min(near * S.raw.zoom, innerWidth / S.raw.span)) : near;
  W = Math.max(1, Math.ceil(innerWidth / scale));   // a hidden pane can report 0 at load; the resize listener repaints it
  H = Math.max(1, Math.ceil(innerHeight / scale));
  canvas.width = W;
  canvas.height = H;
  horizon = floorAt ? Math.max(Math.round(H * 0.3), Math.min(H - 8, Math.round(floorAt() * H / innerHeight)))
    : S.raw.horizon ? Math.round(H * S.raw.horizon) : S.raw.backdrop === 'kombat' ? kombatFloorRow(scale) : horizonRow(scale);
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
const dial = () => S.raw.progress || 0;   // how far into the biome, 0..1 (showScene)

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
  if (S.raw.backdrop === 'altar') shrineGrove();
  if (S.raw.backdrop === 'onsen') onsenWall();
  if (S.raw.backdrop === 'dojo') roomWall({ posts: 26 });
  if (S.raw.backdrop === 'study') roomWall({ stripes: 3 });
  if (S.raw.backdrop === 'fanclub') fanWall();
  if (S.raw.backdrop === 'daycare') daycareHouse();
  if (S.raw.backdrop === 'kombat') kombatBackdrop();

  if (S.raw.floor === 'treasure') grottoFloor();
  if (S.raw.floor === 'altar') shrineApproach();
  if (S.raw.floor === 'onsen') flagstones();
  if (S.raw.floor === 'planks') plankFloor();
  if (S.raw.floor === 'carpet') carpet();
  if (S.raw.floor === 'yard') yardGrass();
  if (S.raw.floor === 'center') centerFloor();
  if (S.raw.floor === 'mart') martFloor();
  if (S.raw.floor === 'meadow') meadow();
  if (S.raw.floor === 'moss') mossGround();
  if (S.raw.floor === 'basalt') basalt();
  if (S.raw.floor === 'desert') desert();
  if (S.raw.floor === 'beach') beach();
  if (S.raw.floor === 'jungleFloor') jungleFloor();
  if (S.raw.floor === 'kombat') kombatFloor();

  if (S.raw.backdrop === 'hills') treeLine();
  if (S.raw.backdrop === 'shrine') shrineFront();
  if (S.raw.backdrop === 'jungle') jungleFront();
  if (S.raw.backdrop === 'center') centerFront();
  if (S.raw.backdrop === 'mart') martFront();
  if (S.raw.backdrop === 'treasure') grottoFront();
  if (S.raw.backdrop === 'hills' || S.raw.backdrop === 'shrine' || S.raw.backdrop === 'volcano') { stageFront(); landmark(); }
  if (S.raw.prop) eventProps();

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

/* Further in, the open meadow thickens into forest: fewer flowers, more rough grass, the woods' shade creeping out from
   the tree line, which crowds closer and grows taller, then a far wood hides the hills and big trees close in at the edges. */
function meadow() {
  const p = dial();
  bands(horizon, H, S.meadow, 0.8);
  grassPatches(S.patch, Math.round(W / 10 * (1 + p * 1.2)));
  for (let n = 0; n < Math.max(2, Math.round(W / 60 * (1 + p))); n++) {
    const y = horizon + 6 + Math.floor(rand() * (H - horizon - 8));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.5 ? 2 : 1);
  }
  if (stage() === 1) stream();
  flowerClusters(Math.round(W / (S.stars ? 14 : 9) * (1 - p * 0.75)));
  // the trees' shade on the grass
  const reach = Math.round((H - horizon) * 0.3 * p);
  for (let y = horizon + 2; y < horizon + 2 + reach; y++) {
    const fade = (y - horizon - 2) / Math.max(1, reach);
    for (let x = 0; x < W; x++) if (dither(x, y) < 16 - fade * 16) tint(x, y, 0.8);
  }
}

function treeLine() {
  const p = dial();
  if (stage() === 2) deepWoods();
  if (p > 0.25) {   // a far wood over the hills, in the hills' hazy colours
    const far = [S.hills[0], S.hills[1], S.hills[2], S.hills[2]];
    for (let x = Math.floor(rand() * 6); x < W + 6; x += 3 + Math.floor(rand() * 5 * (1.3 - p))) {
      roundTree(x, horizon - 12 - Math.floor(rand() * (3 + p * 5)), 4 + Math.floor(rand() * 3), false, far);
    }
  }
  for (let x = Math.floor(rand() * 10); x < W + 8; x += Math.round((10 + Math.floor(rand() * 16)) * (1 - p * 0.5))) {
    roundTree(x, horizon - 9 - Math.floor(rand() * 4) - Math.round(p * horizon * 0.14), 5 + Math.floor(rand() * 3) + Math.round(p * horizon * 0.06), true);
  }
  for (let x = -4; x < W + 6; x += 3 + Math.floor(rand() * 4)) {
    roundTree(x, horizon - 1 - Math.floor(rand() * 3), 3 + Math.floor(rand() * 3) + Math.round(p * 2), false);
  }
  for (let x = 0; x < W; x++) { put(x, horizon + 2, S.trees[3]); if (dither(x, horizon + 3) < 6) put(x, horizon + 3, S.trees[3]); }
  if (stage() === 3) giantTree();
  if (p >= 0.6) nearTrees((p - 0.6) / 0.4);
}

/** Deep in the woods (k 0..1 from there to the boss): two big near trees frame the scene, their crowns hanging in from
    the top corners, and at the end a fringe of leaves closes the canopy overhead. */
function nearTrees(k) {
  const [lit, leaf, shade, deep] = S.trees;
  const r = Math.round(Math.min(W * 0.12, horizon * 0.5) * (0.8 + k * 0.5)), half = Math.max(1, Math.round(r * 0.16));
  for (const [cx, reach] of [[Math.round(W * 0.03), 0.2], [Math.round(W * 0.96), 0.1]]) {
    const foot = horizon + Math.round((H - horizon) * reach);
    for (let y = 0; y <= foot; y++) {
      const flare = y > foot - half * 2 ? Math.round((y - foot + half * 2) / 2) : 0;   // the roots spread at the foot
      for (let x = -half - flare; x <= half + flare; x++) solid(cx + x, y, x > half * 0.3 ? S.trunk[1] : S.trunk[0]);
    }
    for (let x = -half * 3; x <= half * 3; x++) if (dither(x, foot) < 8) tint(cx + x, foot + 1, 0.8);
    const cy = Math.round(r * 0.3);
    for (let y = 0, rw = Math.round(r * 1.4); y <= cy + r; y++) for (let x = -rw; x <= rw; x++) {
      const dx = x / 1.4, dy = y - cy, d = dx * dx + dy * dy;
      if (d > r * r) continue;
      const light = -dx + dy;
      solid(cx + x, y, d > r * r * 0.8 && dither(x, y) < 6 ? deep : light < -r * 0.5 ? lit : light > r * 0.6 ? deep : light > r * 0.1 && dither(x, y) < 8 ? shade : leaf);
    }
  }
  if (k < 0.5) return;
  const fringe = Math.max(2, Math.round(horizon * 0.1 * (k - 0.3)));
  for (let x = 0; x < W; x++) {
    const h = Math.round(fringe * (1 + 0.5 * Math.sin(x / 5) + 0.3 * Math.sin(x / 2.3 + 1)));
    for (let y = 0; y <= h; y++) solid(x, y, y === h ? deep : y === h - 1 && dither(x, y) < 8 ? shade : dither(x, y) < 3 ? lit : leaf);
  }
}

/** A round canopy lit from the top right; tall ones stand on a visible trunk. `colours` for a far, hazy one. */
function roundTree(cx, cy, r, tall, colours = S.trees) {
  const [lit, leaf, shade, deep] = colours;
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
  const gx = Math.round(W * 0.52), size = Math.max(12, Math.round(Math.min(W * 0.4, horizon * 0.72))), st = stage();
  life.lanterns = [];
  life.lanternSize = Math.max(4, Math.round(size * 0.28));
  const pines = () => {
    for (let x = -4; x < W + 6; x += 7 + Math.floor(rand() * 8)) {
      if (st < 2 && Math.abs(x - gx) < size * 0.8) continue;   // keep the gate clear
      pine(x, horizon - 4 - Math.floor(rand() * 6), 6 + Math.floor(rand() * 4), S.trees[1], S.trees[2], true);
    }
  };
  if (st >= 2) {   // inside the courtyard: a wall with the gateway behind you, a bell tower over it, then the main hall
    pines();
    if (st === 2) {
      bellTower(Math.round(W * (S.raw.seed & 2 ? 0.2 : 0.82)), horizon - 2, Math.max(14, Math.round(size * 0.95)));
      courtyardWall(Math.round(size * 0.35));
      for (const dx of [-0.95, 0.95]) lantern(gx + Math.round(dx * size), horizon + 2, life.lanternSize);
    } else {
      const hall = mainHall();
      courtyardWall(hall.half + 3);
      mainHall();
      for (const dx of [-0.55, 0.55]) lantern(gx + Math.round(dx * hall.half), horizon + 3, life.lanternSize);
    }
    return;
  }
  const foot = horizon + 1 - (st === 0 ? shrineSteps(gx, size) : 0);   // at the foot of the steps the gate stands at their top
  // further in, more gates stand behind it, smaller and higher up the path, like a tunnel of torii
  for (let k = Math.round(dial() * 4); k >= 1; k--) {
    torii(gx, foot - k * Math.max(1, Math.round(size * 0.08)), Math.round(size * 0.74 ** k), k % 2 ? [S.torii[1], S.torii[2], S.torii[2]] : [S.torii[2], S.torii[2], S.torii[2]]);
  }
  torii(gx, foot, size);
  for (const dx of [-0.95, 0.95]) lantern(gx + Math.round(dx * size), horizon + 2, life.lanternSize);
  pines();
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

function torii(cx, foot, size, colours = S.torii) {
  const [red, shade, deep] = colours;
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
  lanternBody(cx, foot, size);
  const lightY = foot - Math.round(size * 2 * 0.6);
  life.lanterns.push({ x: cx, y: lightY });
  put(cx, lightY, S.lantern[2]); put(cx - 1, lightY, S.lantern[2]);
}

/** Just the stone body of a lantern, without registering its light (the boss prelude draws its own). */
function lanternBody(cx, foot, size) {
  const [lit, body, dark] = S.lantern;
  const h = size * 2;
  for (let y = 0; y < h; y++) {
    const yy = foot - y;
    const w = (y < 2 ? 2 : y < h * 0.45 ? 1 : y < h * 0.7 ? 2 : y < h * 0.8 ? 3 : 1) * Math.max(1, Math.round(size / 12));   // near ones (the path's) are stouter
    for (let x = -w; x <= w; x++) solid(cx + x, yy, x > 0 ? dark : x === -w ? lit : body);
  }
}

function mossGround() {
  const court = stage() >= 2;
  if (court) gravel();   // the inner courtyard's raked gravel
  else {
    bands(horizon, H, S.ground, 0.8);
    grassPatches(S.patch, Math.round(W / 9));
  }
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
  if (!court) flowerClusters(Math.round(W / 30));
}

function shrineFront() {
  for (let x = 0; x < W; x++) if (dither(x, horizon + 2) < 10) put(x, horizon + 2, S.trees[3]);
  // further in, stone lanterns line the path towards you, a pair more every few floors
  const gx = Math.round(W * 0.52);
  for (let k = 1, pairs = Math.round(dial() * 3); k <= pairs; k++) {
    const y = horizon + Math.round((H - horizon) * (0.04 + k * 0.1)), depth = depthOf(y);
    const cx = gx - Math.round(W * 0.16 * depth * depth), spread = Math.round(W * (0.1 + depth * 0.8));
    for (const side of [-1, 1]) lantern(cx + side * spread, y, Math.round(life.lanternSize * (1 + depth * 2.5)));
  }
}

/* ---------- the Wastes ---------- */

function volcanoBackdrop() {
  const st = stage();
  if (st === 3) { craterRim(); return; }
  if (st < 2) ridge(horizon - 7, 5, 9, 0.7, S.mountains, true, true);   // on its slope the volcano fills the view
  // the volcano: a broad cone with a flat, glowing crater
  // it looms nearer every floor: bigger, its lava running further down (the crater rim by the boss)
  const p = dial(), near = 0.62 + p * 0.6;
  const cx = Math.round(W * 0.5), baseHalf = Math.round(Math.min(W * 0.36, horizon * 1.3) * near), height = Math.round(horizon * Math.min(0.9, 0.78 * near));
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
  life.volcano = { x: cx, y: peak, crater, height, near };
  // lava runs down the slope (all the way when it's erupting)
  life.flows = [];
  const sides = S.raw.erupting ? [-0.55, 0.1, 0.6] : [0.2, -0.5, 0.62].slice(0, 1 + (p >= 0.4) + (p >= 0.8));
  for (const side of sides) {
    const path = [];
    for (let y = peak + 1; y < horizon && (S.raw.erupting || y < peak + height * (0.25 + p * 0.5)); y++) {
      const wobble = Math.round(Math.sin(y / 3 + side * 9));
      path.push([cx + Math.round(side * halfAt(y)) + wobble, y]);
    }
    life.flows.push(path);
  }
  for (const path of life.flows) for (const [x, y] of path) { put(x, y, S.lava[3]); put(x + 1, y, S.volcano[2]); }
  if (st === 2) slopeRise();
}

function basalt() {
  const st = stage(), ground = st === 0 ? M().ash : S.ground;   // the ash plains are pale with it
  bands(horizon, H, ground, 0.8);
  // rough patches and rubble
  grassPatches(ground[ground.length - 1], Math.round(W / 12));
  for (let n = 0; n < Math.round(W / 14); n++) {
    const y = horizon + 4 + Math.floor(rand() * (H - horizon - 5));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.35 ? 2 : 1);
  }
  if (st === 0) for (let n = 0; n < Math.max(2, Math.round(W / 50)); n++) {   // bleached boulders
    const y = horizon + 4 + Math.floor(rand() * (H - horizon) * 0.5), x = rand() < 0.5 ? Math.floor(rand() * W * 0.3) : W - Math.floor(rand() * W * 0.3);
    mound(x, y, 2 + Math.round(depthOf(y) * 4), 1 + Math.round(depthOf(y) * 2), M().rock);
  }
  // cracks with lava deep inside: random walks, wider closer in
  life.cracks ||= [];
  const p = dial(), count = Math.round((W / 9) * (0.6 + S.raw.crackGlow * 0.4) * (0.6 + p * 0.9));
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
  // lava fields further in: pools of it in the rock, glowing like the cracks
  for (let n = 0, pools = Math.round(p * W / 45); n < pools; n++) {
    const cy = horizon + 5 + Math.floor(rand() * (H - horizon - 8)), depth = depthOf(cy);
    const rx = 2 + Math.round(rand() * 3 + depth * 7), ry = Math.max(1, Math.round(rx * (0.2 + depth * 0.15))), cx = Math.floor(rand() * W);
    for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d <= 1) life.cracks.push([cx + x, cy + y, Math.round(d * 6)]);
      else if (d <= 1.6 && dither(x, y) < 10) put(cx + x, cy + y, S.rock[2]);
    }
  }
  if (st === 1) lavaRiver();
  for (const [x, y] of life.cracks) put(x, y, S.lava[2]);
  if (st === 3) rimEdge();
}

/* ---------- the places: 3 per biome plus the boss's arena (step 7 part 2) ----------
   journey() in js/map.js says which place a floor is in (`stage`: floors 1-3, 4-6, 7-10, then the boss) and how far into
   it (`step`); the progress dial still moves everything a notch per floor inside a place. Each biome's own painters ask
   stage() for what changes (the Clearing's stream and deep woods, the Shrine's steps, courtyard wall and main hall, the
   Wastes' ash, lava rivers, slope and crater rim), and every floor of a place gets a different small landmark at one edge
   (LANDMARKS, dealt by the map's seed), so neighbouring floors never look alike. Big features keep to the back and the
   edges: the middle is the two Pokémon's. Their colours are the biome's `marks`, painted by day and graded for the time. */

const stage = () => S.raw.stage ?? 0;
const within = () => { const n = [4, 3, 4][stage()]; return n ? Math.min(1, (S.raw.step || 0) / (n - 1)) : 1; };   // 0..1 through the place
const biomeOf = () => ({ hills: 'clearing', shrine: 'shrine', volcano: 'wastes' })[S.raw.backdrop];
const M = () => S.marks;

/** Mark ground where grass shouldn't grow (water, lava, a landmark's footprint). */
function bare(x, y) { x |= 0; y |= 0; if (inside(x, y)) (life.bare ||= new Uint8Array(W * H))[y * W + x] = 1; }

/** A winding band across the ground (the Clearing's stream, the Wastes' lava river): along the back from the left, then
    bending towards you on the right, wider the nearer it gets. `each(x, y, edge, depth)` paints each pixel. */
function winding(backAt, bendAt, width, each) {
  const back = horizon + backAt, bx = Math.round(W * bendAt);
  const centre = [];
  for (let x = -2; x <= bx; x++) centre.push([x, back + Math.round(Math.sin(x / 11) * 0.8)]);
  for (let y = back + 1, x = bx; y < H + 4; y++) { x += 0.5 + depthOf(y) * 1.6 + Math.sin(y / 5) * 0.4; centre.push([Math.round(x), y]); }
  const seen = new Set();
  for (const [cx, cy] of centre) {
    const depth = depthOf(cy), r = width * (1 + depth * 3.5), ry = Math.max(0.6, r * (0.35 + depth * 0.3));
    for (let dy = -Math.ceil(ry) - 1; dy <= Math.ceil(ry) + 1; dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) {
      const x = cx + dx, y = cy + dy, key = y * (W + 8) + x;
      if (y <= horizon + 1 || !inside(x, y)) continue;
      const d = (dx / r) ** 2 + (dy / ry) ** 2;
      if (d > 1.7 || seen.has(key) && d > 1) continue;
      if (d <= 1) seen.add(key);
      each(x, y, d > 1 ? 2 : d > 0.55 ? 1 : 0, depth);
    }
  }
  return centre;
}

/* ----- the Clearing ----- */

/** The forest edge's stream, with glints that sparkle as it runs. */
function stream() {
  const [glint, lit, body, deep] = M().water, [bank] = M().bank;
  life.glints = [];
  winding(6, 0.72, 2.2, (x, y, edge) => {
    if (edge === 2) { if (dither(x, y) < 10) put(x, y, bank); return; }
    put(x, y, edge === 1 ? (y % 2 ? body : deep) : dither(x, y) < 3 ? lit : body);
    bare(x, y);
    if (edge === 0 && rand() < 0.06) life.glints.push({ x, y, phase: rand() * 40 });
  });
  life.glintColour = glint;
}

/** Deep in the woods: a thick canopy closes over the top, with dark trunks rising into it at every depth. */
function deepWoods() {
  const [lit, leaf, shade, deep] = S.trees, k = within();
  const roof = Math.round(horizon * (0.2 + k * 0.12));
  // the gloom of the wood behind, with only a little sky showing through
  for (let y = roof - 2; y < horizon; y++) for (let x = 0; x < W; x++) {
    const open = Math.sin(x / 7 + y / 11) + Math.sin(x / 3.1 - y / 9) > 1.35 - (horizon - y) / horizon * 0.4;
    if (!open) { solid(x, y, dither(x, y) < 5 ? shade : deep); tint(x, y, 0.85); }
  }
  for (let x = Math.floor(rand() * 4); x < W; x += 5 + Math.floor(rand() * 10)) {
    const w = 2 + Math.floor(rand() * 3), far = rand() < 0.5;
    for (let y = roof - 2; y < horizon; y++) for (let dx = 0; dx < w; dx++) {
      solid(x + dx, y, dx === w - 1 ? S.trunk[1] : S.trunk[0]);
      tint(x + dx, y, far ? 0.45 : 0.7);
    }
  }
  for (let x = 0; x < W; x++) {
    const h = roof + Math.round(2.5 * Math.sin(x / 6) + 1.5 * Math.sin(x / 2.7 + 2));
    for (let y = 0; y <= h; y++) {
      const gap = Math.sin(x / 9 + y / 4) + Math.sin(x / 4.3 - y / 3) > 1.55 && y < h - 3;   // sky through the leaves
      if (!gap) solid(x, y, y >= h - 1 ? deep : dither(x, y) < 2 ? lit : y > h - 4 && dither(x, y) < 8 ? shade : leaf);
    }
  }
}

/** Light falling through the canopy in slanted shafts. */
function lightShafts(strength) {
  const low = horizon + Math.round((H - horizon) * 0.5);
  for (let y = 0; y < low; y++) for (let x = 0; x < W; x++) {
    const band = ((x - y * 0.45) % 38 + 38) % 38;
    if (band < 5 && dither(x, y) < (band < 2 ? 5 : 3) * strength) tint(x, y, 1.08, 16);
  }
}

/** The boss's arena: an ancient giant tree, its trunk filling the back, roots spilling onto the grass, its crown the sky. */
function giantTree() {
  const [lit, leaf, shade, deep] = S.trees, bark = M().bark;
  const cx = Math.round(W * 0.5), half = Math.max(10, Math.round(Math.min(W * 0.16, horizon * 0.52))), foot = horizon + 3;
  for (let y = 0; y <= foot; y++) {
    const flare = y > foot - half ? Math.round((y - foot + half) ** 2 / half * 1.2) : 0;
    const lean = Math.round(Math.sin(y / Math.max(5, horizon * 0.12)) * Math.min(3, half * 0.08));
    for (let x = -half - flare; x <= half + flare; x++) {
      const u = x / (half + flare), groove = Math.abs(Math.sin(x * 1.15 + y * 0.07)) < 0.16;
      solid(cx + x + lean, y, u < -0.72 ? bark[0] : u > 0.5 ? (u > 0.82 ? bark[3] : bark[2]) : groove ? bark[2] : bark[1]);
    }
  }
  // roots crawling out over the ground
  for (const side of [-1, 1]) for (let r = 0; r < 2; r++) {
    let x = cx + side * (half * (1.3 + r * 0.4)), y = foot - 2;
    for (let n = 0, len = Math.round(half * (0.5 + r * 0.3)); n < len; n++) {
      const thick = Math.max(1, Math.round((1 - n / len) * (3 - r)));
      x += side * (0.8 + rand() * 0.4); y += 0.2 + n / len * 0.4;
      for (let t = -thick; t <= thick; t++) solid(x, y + t, t === -thick ? bark[0] : t === thick ? bark[3] : bark[1]);
      bare(x, y);
    }
  }
  // a hollow and moss
  const hy = Math.round(horizon * 0.62), hr = Math.max(3, Math.round(half * 0.32));
  for (let y = -hr * 1.5; y <= hr * 1.5; y++) for (let x = -hr - 1; x <= hr + 1; x++) {
    const d = (x / hr) ** 2 + (y / (hr * 1.5)) ** 2;
    if (d <= 1.45) {
      const ring = Math.round(d * 5) % 2 === 0;
      solid(cx - Math.round(half * 0.2) + x, hy + y,
        d > 0.82 ? bark[0] : d > 0.56 ? (ring ? bark[1] : bark[2]) : d > 0.34 ? bark[3] : bark[2]);
    }
  }
  const heartX = cx - Math.round(half * 0.2);
  for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) {
    const d = (x / 3) ** 2 + (y / 2) ** 2;
    if (d < 0.34) put(heartX + x, hy + y, S.pollen[0]);
    else if (d < 1 && dither(x, y) < 6) put(heartX + x, hy + y, S.pollen[1]);
  }
  for (let n = 0; n < half * 3; n++) {
    const x = cx + Math.round((rand() * 2 - 1) * half * 0.9), y = Math.floor(rand() * foot);
    if (dither(x, y) < 8) solid(x, y, M().moss[rand() < 0.5 ? 0 : 1]);
  }
  // the crown: a ceiling of leaves, heavier over the trunk
  for (let x = 0; x < W; x++) {
    const over = Math.max(0, 1 - Math.abs(x - cx) / (W * 0.5));
    const h = Math.round(horizon * (0.14 + over * 0.2) + 4 * Math.sin(x / 5) + 3 * Math.sin(x / 2.3 + 1));
    for (let y = 0; y <= h; y++) {
      const opening = Math.abs(x - cx) < half * 0.22 && y < h - 5 && dither(x, y) < 5;
      if (!opening) solid(x, y, y >= h - 1 ? deep : y > h - 4 && dither(x, y) < 9 ? shade : dither(x + 1, y) < 3 ? lit : leaf);
    }
  }
  // Heavy, split boughs break up the crown and make the hollow feel sheltered, not like a flat trunk.
  for (const [side, span, start, climb] of [[-1, 0.25, 0.44, 0.13], [1, 0.36, 0.5, 0.24]]) {
    const length = Math.max(12, Math.round(Math.min(W * span, half * (side < 0 ? 1.55 : 2.4)))), rise = Math.max(5, Math.round(horizon * climb));
    for (let n = 0; n <= length; n++) {
      const p = n / length, x = cx + side * Math.round(half * 0.35 + p * length * 0.72);
      const y = Math.round(horizon * start - p * rise + Math.sin(p * Math.PI) * 2 + Math.sin(p * Math.PI * 2) * 1.5);
      const thick = Math.max(1, Math.round((1 - p * 0.76) * Math.max(2, half * 0.11)));
      for (let dy = -thick; dy <= thick; dy++) solid(x, y + dy, dy === -thick ? bark[0] : dy === thick ? bark[3] : bark[1]);
      if (n % 3 === 0) put(x + side, y - thick, bark[0]);
      if (n === Math.round(length * 0.48)) {
        const twig = Math.max(4, Math.round(horizon * 0.13));
        for (let k = 0; k < twig; k++) {
          const tx = x + side * Math.round(k * 0.42), ty = y - k;
          solid(tx, ty, bark[0]); solid(tx + side, ty, bark[1]);
        }
      }
    }
  }
  // Broken rings and moss on the exposed roots catch the light around the hollow.
  for (let n = 0; n < half * 2; n++) {
    const side = n % 2 ? -1 : 1, x = cx + side * Math.round(half * (0.7 + rand() * 1.4));
    const y = foot - Math.round(rand() * Math.max(2, half * 0.45));
    if (dither(x, y) < 7) solid(x, y, M().moss[n % 2]);
  }
}

/* ----- the Shrine ----- */

/** The foot of the stone steps: a flight up to the gate, which stands `rise` rows above the ground. */
function shrineSteps(gx, size) {
  const rise = Math.max(4, Math.round(size * 0.34)), top = Math.round(size * 0.42), [lit, body, dark, line] = M().stone;
  for (let k = 0; k <= rise; k++) {
    const y = horizon + 1 - k, half = Math.round(top + (rise - k) / rise * size * 0.22);
    for (let x = -half - 1; x <= half + 1; x++) {
      const edge = Math.abs(x) >= half;
      solid(gx + x, y, edge ? line : k % 2 ? (x < -half * 0.6 ? lit : body) : dark);
    }
  }
  return rise;
}

/** Bamboo crowding in at both edges, green stalks ringed at their joints, sprays of leaves at their tops. */
function bamboo() {
  const [lit, body, shade, deep] = M().bamboo;
  for (const side of [-1, 1]) {
    for (let n = 0, count = Math.max(3, Math.round(W * 0.05)); n < count; n++) {
      const x = side < 0 ? Math.round(rand() * W * 0.17) : W - 1 - Math.round(rand() * W * 0.17);
      const top = Math.round(rand() * horizon * 0.25), foot = horizon + 2 + Math.round(rand() * 5), seg = 5 + Math.floor(rand() * 3), far = rand() < 0.4;
      for (let y = top; y <= foot; y++) {
        const joint = (y - top) % seg === 0;
        solid(x, y, joint ? deep : body); solid(x + 1, y, joint ? deep : shade);
        if (!far) solid(x - 1, y, joint ? shade : lit);
        if (far) { tint(x, y, 0.75); tint(x + 1, y, 0.75); }
      }
      for (let y = top; y < foot - 6; y += seg * 2) for (let k = 1; k < 5; k++) {
        const dir = (y / seg) % 2 ? 1 : -1;
        put(x + dir * k, y + Math.round(k * 0.5), k > 2 ? shade : lit);
        put(x + dir * k, y + Math.round(k * 0.5) + 1, deep);
      }
    }
  }
}

/** The inner courtyard's wall: white plaster between dark posts under a tiled roof, a stone footing. */
function courtyardWall(gap) {
  const tall = Math.max(7, Math.round(horizon * 0.22)), top = horizon + 1 - tall, gx = Math.round(W * 0.52);
  const [plaster, plasterDim, plasterDark] = M().plaster, [tileLit, tile, tileDark] = M().tile, [, wood, , woodDark] = M().wood, [, stone, stoneDark] = M().stone;
  for (let x = 0; x < W; x++) {
    if (Math.abs(x - gx) < gap) continue;
    for (let y = top; y <= horizon + 1; y++) {
      const k = y - top;
      solid(x, y, k === 0 ? tileLit : k < 3 ? (x % 3 ? tile : tileDark) : k === 3 ? tileDark : y >= horizon ? (x % 5 ? stone : stoneDark)
        : x % 16 === 0 || x % 16 === 1 ? (x % 16 ? woodDark : wood) : k === 4 ? plasterDark : dither(x, y) < 2 ? plasterDim : plaster);
    }
  }
  // the gateway's posts
  for (const side of [-1, 1]) for (let y = top - 2; y <= horizon + 1; y++) for (let k = 0; k < 2; k++) solid(gx + side * gap + (side < 0 ? -k : k), y, k ? woodDark : wood);
  return top;
}

/** A bell tower over the wall: four posts, a bronze bell hanging under a curved roof. */
function bellTower(cx, foot, size) {
  const [red, redDark, redDeep] = M().red, [tileLit, tile, tileDark] = M().tile, [bellLit, bell, bellDark] = M().bell;
  const half = Math.round(size * 0.35), top = foot - size;
  for (const x of [-half, half]) for (let y = top + 3; y <= foot; y++) { solid(cx + x, y, red); solid(cx + x + 1, y, redDeep); }
  for (let x = -half; x <= half; x++) { solid(cx + x, top + 3, redDark); solid(cx + x, foot - Math.round(size * 0.3), redDark); }
  for (let k = 0; k < 4; k++) {   // the roof, flaring at its eaves
    const w = half + 3 - k, y = top + 2 - k;
    for (let x = -w; x <= w; x++) solid(cx + x, y, k === 0 ? tileDark : k === 3 ? tileLit : tile);
  }
  solid(cx - half - 3, top + 1, tileDark); solid(cx + half + 3, top + 1, tileDark);
  const by = top + 4, bh = Math.max(3, Math.round(size * 0.3));
  for (let y = 0; y < bh; y++) {
    const w = 1 + Math.round(y / bh * Math.max(1, half * 0.5));
    for (let x = -w; x <= w; x++) solid(cx + x, by + y, x < 0 ? bellLit : x > w - 2 ? bellDark : bell);
  }
}

/** The boss's arena: the main hall, a wide red building on a stone base under a sweeping roof, a straw rope across its front. */
function mainHall() {
  const gx = Math.round(W * 0.52), half = Math.round(Math.min(W * 0.34, horizon * 1.15)), base = Math.max(3, Math.round(horizon * 0.07));
  const tall = Math.round(horizon * 0.4), roofH = Math.round(horizon * 0.3), eave = horizon + 1 - base - tall;
  const [red, redDark, redDeep] = M().red, [tileLit, tile, tileDark] = M().tile, [lit, body, dark, line] = M().stone, [wLit, wood, wShade, wDark] = M().wood;
  for (let y = horizon + 1 - base; y <= horizon + 1; y++) for (let x = -half - 2; x <= half + 2; x++) solid(gx + x, y, y === horizon + 1 - base ? lit : (x + y) % 6 ? body : dark);
  for (let y = eave; y < horizon + 1 - base; y++) for (let x = -half; x <= half; x++) {
    const bay = ((x + half) % Math.max(6, Math.round(half / 4)));
    solid(gx + x, y, bay < 2 ? (bay ? redDeep : red) : y - eave < 3 ? redDark : (x + y) % 2 && y - eave > 4 ? wShade : wDark);
  }
  for (let k = 0; k < roofH; k++) {   // the roof: sweeping up at the ends, a ridge on top
    const t = k / roofH, w = Math.round(half * (1.22 - t * 0.55)), y = eave - 1 - k;
    for (let x = -w; x <= w; x++) {
      const lift = Math.abs(x) > w - 3 && k < 3 ? 1 : 0;
      solid(gx + x, y - lift, k === 0 ? tileDark : k === roofH - 1 ? tileLit : (x + k) % 3 ? tile : tileDark);
    }
  }
  const ridge = eave - roofH;
  for (const side of [-1, 1]) for (let k = 0; k < 5; k++) { solid(gx + side * (Math.round(half * 0.67) + k), ridge - k, wDark); solid(gx + side * (Math.round(half * 0.67) + 4 - k), ridge - k, wDark); }
  // steps up to it, and the straw rope with its paper zigzags
  for (let k = 0; k < base + 2; k++) for (let x = -Math.round(half * 0.22) - k; x <= Math.round(half * 0.22) + k; x++) solid(gx + x, horizon + 1 - base + k, k % 2 ? dark : lit);
  const [rope, ropeDark] = M().rope;
  for (let x = -half + 2; x <= half - 2; x++) {
    const y = eave + 2 + Math.round(Math.sin((x + half) / (half * 2) * Math.PI) * 2);
    solid(gx + x, y, x % 2 ? rope : ropeDark);
    if ((x + half) % Math.max(5, Math.round(half / 5)) === 0) for (let k = 1; k <= 3; k++) solid(gx + x + (k % 2), y + k, M().paper);
  }
  return { gx, eave, half };
}

function gravel() {
  bands(horizon, H, M().gravel, 0.9);
  const [, , , groove] = M().gravel;
  for (let y = horizon + 3; y < H; y++) {
    const depth = depthOf(y), step = Math.max(2, Math.round(2 + depth * 3));
    for (let x = 0; x < W; x++) if ((y + Math.round(Math.sin(x / 14) * 1.2)) % step === 0 && dither(x, y) < 12) put(x, y, groove);
  }
}

/* ----- the Wastes ----- */

/** A dead tree: a crooked trunk splitting into bare, forking branches. */
function deadTree(cx, foot, h, [lit, body, dark]) {
  const branch = (x, y, len, dir, width) => {
    for (let k = 0; k < len; k++) {
      x += dir * (0.3 + rand() * 0.5); y -= 0.8 + rand() * 0.3;
      for (let w = 0; w < width; w++) solid(x + w, y, w ? dark : lit);
      if (width > 1 && k > 1 && rand() < 0.22) branch(x, y, Math.round(len * 0.55), rand() < 0.5 ? -1 : 1, width - 1);
    }
    if (width === 1) solid(x + dir, y - 1, body);
  };
  for (let y = foot; y > foot - h * 0.45; y--) { solid(cx, y, lit); solid(cx + 1, y, body); solid(cx + 2, y, dark); }
  branch(cx, foot - h * 0.45, Math.round(h * 0.5), -1, 2);
  branch(cx + 1, foot - h * 0.4, Math.round(h * 0.45), 1, 2);
  solid(cx - 1, foot, dark); solid(cx + 3, foot, dark);
}

/** Basalt columns: hexagonal pillars packed together, flat tops lit, heights stepping. */
function basaltColumns(cx, foot, count, tallest, [lit, body, shade, line]) {
  for (let n = 0; n < count; n++) {
    const x = cx + (n - (count - 1) / 2) * 4, h = Math.round(tallest * (0.45 + 0.55 * Math.abs(Math.sin(n * 2.3 + cx))));
    for (let y = foot - h; y <= foot; y++) for (let k = 0; k < 4; k++) {
      solid(x + k, y, y === foot - h ? lit : k === 0 ? line : k === 3 ? shade : y === foot - h + 1 ? shade : body);
    }
  }
}

/** The lava fields' river of lava, glowing like the cracks (life.cracks), with steam where it runs. */
function lavaRiver() {
  const [lit, body, dark] = S.rock;
  const path = winding(4, 0.3, 1.1, (x, y, edge) => {
    if (edge === 2) { if (dither(x, y) < 12) put(x, y, dark); return; }
    if (edge === 1) { put(x, y, dither(x, y) < 8 ? dark : S.lava[3]); if (dither(x, y) < 8) return; }
    life.cracks.push([x, y, Math.round(x / 3 + y)]);
    bare(x, y);
  });
  for (let i = 12; i < path.length; i += 23) if (path[i][1] < H - 2) steam(path[i][0], path[i][1] - 1, 0.8);
}

function steam(x, y, size = 1) { (life.puffs ||= []).push({ x, y, size, phase: rand() * 40 }); }

/** The volcano's slope: rock rising on one side over the horizon, as if the ground tilts up towards the peak. */
function slopeRise() {
  const [lit, body, shade] = S.volcano, left = (S.raw.seed & 1) === 0, reach = W * 0.34, height = horizon * 0.42;
  for (let i = 0; i <= reach; i++) {
    const x = left ? i : W - 1 - i, t = 1 - i / reach, top = horizon - Math.round(height * t ** 1.3 + Math.sin(i / 3) * 0.8);
    for (let y = top; y <= horizon + 1; y++) solid(x, y, y === top ? lit : (y + x) % 7 === 0 ? shade : y - top < 2 && dither(x, y) < 8 ? lit : body);
    if (t > 0.2 && i % 9 === 4) for (let y = top + 2; y < horizon; y++) if (dither(x, y) < 10) put(x, y, shade);
  }
}

/** The boss's arena: you're on the crater's rim; below you a lava lake, across it the crater's far wall lit from beneath. */
function craterRim() {
  const [lit, body, shade] = S.volcano, lake = Math.max(4, Math.round(horizon * 0.14)), wallTop = horizon - lake - Math.round(horizon * 0.34);
  for (let x = 0; x < W; x++) {
    const wav = 0.6 * Math.sin(x / 17 + 1) + 0.4 * Math.sin(x / 6.3) + 0.25 * Math.abs(Math.sin(x / 2.2));
    const top = wallTop - Math.round(horizon * 0.12 * wav);
    for (let y = top; y < horizon - lake; y++) {
      const low = (y - top) / Math.max(1, horizon - lake - top);
      solid(x, y, y === top ? lit : (x * 3 + y) % 11 === 0 ? shade : low > 0.75 && dither(x, y) < (low - 0.75) * 50 ? S.lava[3] : low > 0.4 && dither(x, y) < 6 ? shade : body);
    }
  }
  for (let y = horizon - lake; y <= horizon; y++) for (let x = 0; x < W; x++) {
    const near = (y - horizon + lake) / lake, crust = Math.sin(x / (4 + near * 5) + y * 1.3) + Math.sin(x / (9 + near * 8) - y * 0.7);
    if (crust > 1.1) { solid(x, y, crust > 1.5 ? S.rock[2] : S.lava[3]); continue; }   // plates of cooling crust drift on it
    solid(x, y, S.lava[2]);
    (life.cracks ||= []).push([x, y, Math.round(x / 4 + Math.sin(y + x / 7) * 3)]);
  }
  life.volcano = { x: Math.round(W * 0.5), y: horizon - Math.round(lake / 2), crater: Math.round(W * 0.2), height: Math.round(horizon * 0.7), near: 1.3 };
  life.flows = [];
}

/** The rim's own edge at your feet, a dark lip over the lake. */
function rimEdge() {
  const [lit, body, dark] = S.rock;
  for (let x = 0; x < W; x++) {
    const y0 = horizon + 1 + Math.round(1.5 + Math.sin(x / 5) + Math.sin(x / 2.1));
    for (let y = horizon + 1; y <= y0; y++) solid(x, y, y === y0 ? lit : dark);
    for (let y = y0 + 1; y < y0 + 3; y++) if (dither(x, y) < 6) put(x, y, body);
  }
}

/* ----- what each place adds in front of the ground ----- */

function stageFront() {
  const b = biomeOf(), st = stage();
  if (b === 'clearing') {
    if (st === 1) for (let n = 0; n < Math.max(2, Math.round(W / 70)); n++) berryBush(rand() < 0.5 ? Math.round(W * (0.02 + rand() * 0.18)) : Math.round(W * (0.8 + rand() * 0.18)), horizon + 2, 3);
    if (st >= 2) lightShafts(S.stars ? 0.5 : 1);
  }
  if (b === 'shrine' && st === 0) bamboo();
  if (b === 'wastes') {
    const rock = M().dead;
    if (st === 0) for (const at of [0.04, 0.17, 0.86, 0.97]) deadTree(Math.round(W * at), horizon + 2 + Math.round(rand() * 3), Math.round(horizon * (0.18 + rand() * 0.14)), rock);
    if (st === 1) {
      for (const at of [0.03, 0.97]) basaltColumns(Math.round(W * at), horizon + 3, 5, Math.round(horizon * 0.3), M().basalt);
    }
    if (st === 2) for (let n = 0; n < 3; n++) {
      const y = horizon + 4 + Math.floor(rand() * (H - horizon) * 0.4), x = Math.floor(rand() * W);
      for (let k = -2; k <= 2; k++) put(x + k, y, M().sulfur[2]);
      steam(x, y - 1, 0.7);
    }
  }
}

/* ----- the landmarks: one per floor, at an edge ----- */

/** A mound (a boulder, a bush): an outlined dome lit from the top left; `over(x, y, u, v)` may repaint a pixel (moss, berries, glowing cracks). */
function mound(cx, foot, rx, ry, [lit, body, shade, line], over = null) {
  outlined(cx - rx, foot - ry * 2, cx + rx, foot, (x, y) => {
    const u = (x - cx) / rx, v = (y - (foot - ry)) / ry;
    return u * u + v * v <= 1 && y <= foot;
  }, (x, y) => {
    const u = (x - cx) / rx, v = (y - (foot - ry)) / ry;
    return over?.(x, y, u, v) ?? (u + v < -0.7 ? lit : u + v > 0.5 ? shade : dither(x, y) < 3 ? lit : body);
  }, line);
  for (let x = -rx; x <= rx; x++) bare(cx + x, foot);
}

/** A fallen log lying across, bark on top, its cut ends showing rings; `hollow` shows a dark hole in the near end. */
function fallenLog(cx, y, len, r, hollow = false) {
  const [lit, body, shade, line] = M().bark, [ring, ringDark] = M().wood;
  for (let x = -len; x <= len; x++) for (let k = -r; k <= r; k++) {
    const edge = k === -r - 0 && x % 3 === 0;
    solid(cx + x, y + k, k === -r ? line : k === -r + 1 ? lit : k === r ? line : k > r * 0.4 ? shade : edge ? shade : (x * 5 + k) % 9 === 0 ? shade : body);
  }
  for (let k = -r; k <= r; k++) for (let x = 0; x <= Math.max(1, Math.round(r * 0.8)); x++) {
    const d = (x / Math.max(1, r * 0.8)) ** 2 + (k / r) ** 2;
    if (d <= 1) solid(cx + len + x, y + k, hollow && d < 0.5 ? line : d > 0.75 ? line : (Math.round(d * 4) % 2 ? ringDark : ring));
  }
  for (let x = -len; x <= len; x += 1) if (dither(x, y) < 5) solid(cx + x, y - r, M().moss[0]);
  for (let x = -len; x <= len; x++) bare(cx + x, y + r);
}

/** A stump: its cut top showing rings, bark down its sides, roots at its foot; `fungi` adds shelf mushrooms. */
function stump(cx, foot, half, tall, [lit, body, shade, line], face = M().wood, fungi = false) {
  for (let y = foot - tall; y <= foot; y++) {
    const w = half + (y > foot - 2 ? foot - y === 0 ? 2 : 1 : 0);
    for (let x = -w - 1; x <= w + 1; x++) {
      const edge = Math.abs(x) === w + 1;
      solid(cx + x, y, edge || y === foot ? line : x < -w * 0.4 ? lit : x > w * 0.5 ? shade : (x + y * 3) % 5 === 0 ? shade : body);
    }
  }
  for (let x = -half; x <= half; x++) { solid(cx + x, foot - tall - 1, line); solid(cx + x, foot - tall, Math.abs(x) % 2 ? face[1] : face[0]); }
  solid(cx - half - 1, foot - tall, line); solid(cx + half + 1, foot - tall, line);
  if (fungi) for (const [dy, side] of [[Math.round(tall * 0.35), 1], [Math.round(tall * 0.65), -1]]) {
    for (let k = 0; k < 3; k++) solid(cx + side * (half + 2 + k), foot - tall + dy, M().stem[0]);
    solid(cx + side * (half + 2), foot - tall + dy + 1, M().stem[1]);
  }
  for (let x = -half - 2; x <= half + 2; x++) bare(cx + x, foot);
}

/** A mushroom: a round spotted cap on a pale stem. */
function mushroom(cx, foot, r, [cap, capDark, spot]) {
  const [stem, stemDark] = M().stem, line = M().bark[3];
  for (let y = foot - r - 1; y <= foot; y++) { solid(cx, y, stem); solid(cx + 1, y, stemDark); }
  outlined(cx - r, foot - r * 2 - 1, cx + r + 1, foot - r, (x, y) => {
    const u = (x - cx - 0.5) / (r + 0.5), v = (y - (foot - r)) / (r + 0.5);
    return u * u + v * v <= 1 && y <= foot - r;
  }, (x, y) => ((x * 7 + y * 3) % 5 === 0 ? spot : x > cx + r * 0.4 ? capDark : cap), line);
}

/** A clump of ferns: fronds arching out and down from the middle. */
function ferns(cx, foot, size) {
  const [lit, body, shade] = M().fern;
  for (let f = -3; f <= 3; f++) {
    const dir = f < 0 ? -1 : 1, reach = size * (1 - Math.abs(f) * 0.08), lift = size * (0.9 - Math.abs(f) * 0.15);
    for (let k = 0; k <= reach; k++) {
      const t = k / reach, x = cx + dir * k * (0.4 + Math.abs(f) * 0.2), y = foot - Math.sin(t * Math.PI * 0.9) * lift;
      solid(x, y, f === 0 ? lit : body);
      if (k % 2 === 0 && k > 1) { solid(x, y - 1, lit); solid(x + dir, y + 1, shade); }
    }
  }
  for (let x = -2; x <= 2; x++) bare(cx + x, foot);
}

/** A berry bush: a round green mound speckled with berries. */
function berryBush(cx, foot, r) {
  const [berry, berryDark, shine] = M().berry, [lit, leaf, shade, line] = M().leaf;
  mound(cx, foot, r + 2, r, [lit, leaf, shade, line], (x, y, u, v) => (x * 5 + y * 7) % 11 === 0 && v < 0.6 ? ((x + y) % 2 ? berry : berryDark) : (x * 5 + y * 7) % 11 === 1 && v < 0.2 ? shine : null);
}

/** A wooden fence: posts and two rails. */
function fence(cx, foot, len) {
  const [lit, body, shade, line] = M().wood;
  for (let x = -len; x <= len; x++) for (const k of [3, 6]) { solid(cx + x, foot - k, body); solid(cx + x, foot - k + 1, shade); }
  for (let x = -len; x <= len; x += 7) for (let y = foot - 9; y <= foot; y++) { solid(cx + x, y, line); solid(cx + x + 1, y, lit); solid(cx + x + 2, y, shade); solid(cx + x + 3, y, line); }
}

/** A stone statue on a plinth, from a letter map (s stone, S shade, L lit, o line, r red cloth, R its shade, w paper). */
function statue(cx, foot, rows) {
  const [lit, body, shade, line] = M().stone, [red, redDark] = M().red;
  const key = { L: lit, s: body, S: shade, o: line, r: red, R: redDark, w: M().paper, g: M().moss[0], G: M().moss[1] };
  const w = rows[0].length;
  pixelMap(cx - Math.floor(w / 2), foot - rows.length + 1, rows, key);
  for (let x = 0; x < w; x++) bare(cx - Math.floor(w / 2) + x, foot);
}

/** A little puddle of steam, lava or water at the foot of a landmark: an oval of `colour` with a darker rim. */
function pool(cx, cy, rx, ry, fill, rim, glow = false) {
  for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2;
    if (d <= 1) { solid(cx + x, cy + y, fill(x, y, d)); bare(cx + x, cy + y); if (glow) life.cracks.push([cx + x, cy + y, Math.round(d * 5)]); }
    else if (d <= 1.6) solid(cx + x, cy + y, rim);
  }
}

const KOMAINU = [
  '..oooo....',
  '.oLssso...',
  'oLsoLsSo..',
  'oLssssSo..',
  '.oRrrRSoo.',
  '.oLssssSSo',
  '.oLsoLssSo',
  '.oLssssSSo',
  '.oLsSosSSo',
  'oooooooooo',
  'oLLssssSSo',
  'oLssssssSo',
  'oooooooooo',
];
const JIZO = [
  '..ooo..',
  '.oLsso.',
  '.oLsSo.',
  '.oLssoo',
  'orrrrRo',
  'oRrrrRo',
  '.oLsSo.',
  '.oLsSo.',
  '.oLsSo.',
  'ooooooo',
  'oLssSSo',
  'ooooooo',
];
const MARKER = [
  '.ooo.',
  'oLsSo',
  'oLoSo',
  'oLsSo',
  'oLoSo',
  'oLoSo',
  'oLsSo',
  'oLoSo',
  'oLsSo',
  'oLsSo',
  'oLsSo',
  'oLgGo',
  'ooooooo'.slice(0, 5),
];
const FOX = [
  'o.o.....',
  'oLoo....',
  'oLsso...',
  '.oLwso..',
  '.oLsso..',
  '.orrRo..',
  '.oLssoo.',
  '.oLsssoo',
  '.oLsssSo',
  '.oLsssSo',
  '.oLssSSo',
  'oooooooo',
  'oLssssSo',
  'oooooooo',
];

/* Each place's landmarks, one per floor; the map's seed deals them out, so two floors of a place never share one. */
const LANDMARKS = {
  clearing: [
    {
      signpost(cx, foot) {
        const [lit, body, shade, line] = M().wood;
        for (let y = foot - 7; y <= foot; y++) { solid(cx, y, line); solid(cx + 1, y, lit); solid(cx + 2, y, shade); solid(cx + 3, y, line); }
        for (const [y0, dir] of [[foot - 12, 1], [foot - 8, -1]]) {
          for (let y = y0; y < y0 + 4; y++) for (let x = -5; x <= 6; x++) {
            const tip = dir > 0 ? x === 6 && (y === y0 || y === y0 + 3) : x === -5 && (y === y0 || y === y0 + 3);
            if (!tip) solid(cx + x + dir * 2, y, y === y0 || y === y0 + 3 || x === -5 || x === 6 ? line : y === y0 + 1 ? lit : (x + y) % 3 === 0 ? shade : body);
          }
        }
        for (let x = -1; x <= 4; x++) bare(cx + x, foot);
      },
      fence(cx, foot) { fence(cx, foot, 11); },
      boulder(cx, foot) { mound(cx, foot, 7, 5, M().stone, (x, y, u, v) => v < -0.55 && dither(x, y) < 10 ? M().moss[(x + y) % 2] : null); },
      stump(cx, foot) { stump(cx, foot, 4, 5, M().bark); },
      birdhouse(cx, foot) {
        const [lit, body, shade, line] = M().wood, [roof, roofDark] = M().roof;
        for (let y = foot - 10; y <= foot; y++) { solid(cx, y, lit); solid(cx + 1, y, shade); }
        for (let y = foot - 17; y <= foot - 10; y++) for (let x = -3; x <= 4; x++) solid(cx + x, y, x === -3 || x === 4 || y === foot - 10 ? line : x < 0 ? lit : body);
        solid(cx, foot - 14, line); solid(cx + 1, foot - 14, line); solid(cx, foot - 13, line); solid(cx + 1, foot - 13, line);
        for (let k = 0; k < 4; k++) for (let x = -4 - (3 - k); x <= 5 + (3 - k) - 3 + k * 0; x++) if (Math.abs(x - 0.5) <= 1.5 + k * 1.5) solid(cx + x, foot - 21 + k, k === 3 ? roofDark : roof);
      },
    },
    {
      bridge: { side: -1, paint(cx) {
        const y = horizon + 6 + Math.round(Math.sin(cx / 11) * 0.8);
        fallenLog(cx, y, 9, 1);
      } },
      berries(cx, foot) { berryBush(cx, foot, 5); berryBush(cx + 8, foot + 1, 3); },
      stones: { side: -1, paint(cx) {
        const y = horizon + 6;
        for (const dx of [-7, -1, 5]) mound(cx + dx, y + 1, 2, 1, M().stone);
      } },
      reeds(cx, foot) {
        const [lit, body] = M().fern, [cat, catDark] = M().cattail;
        for (let n = -3; n <= 3; n++) {
          const x = cx + n * 2, h = 8 + ((n * 7 + 11) % 5);
          for (let y = foot - h; y <= foot; y++) solid(x + (y < foot - h * 0.7 && n % 2 ? 1 : 0), y, n % 2 ? lit : body);
          if (n % 2 === 0) for (let k = 0; k < 3; k++) { solid(x, foot - h + 1 + k, k ? catDark : cat); solid(x + 1, foot - h + 1 + k, catDark); }
        }
      },
      log(cx, foot) { fallenLog(cx, foot - 2, 8, 2); },
    },
    {
      mushrooms(cx, foot) { mushroom(cx - 4, foot, 3, M().cap); mushroom(cx + 3, foot + 1, 2, M().cap); mushroom(cx + 7, foot, 1, M().cap); },
      hollowLog(cx, foot) { fallenLog(cx, foot - 3, 9, 3, true); },
      ferns(cx, foot) { ferns(cx, foot, 8); },
      mossRock(cx, foot) { mound(cx, foot, 8, 5, M().stone, (x, y, u, v) => v < 0.1 - Math.sin(x / 2) * 0.3 ? M().moss[(x + y) % 3 ? 0 : 1] : null); ferns(cx + 7, foot, 4); },
      bigStump(cx, foot) { stump(cx, foot, 6, 9, M().bark, M().wood, true); mushroom(cx - 8, foot, 1, M().cap); },
    },
  ],
  shrine: [
    {
      komainu(cx, foot) { statue(cx, foot, KOMAINU); },
      jizo(cx, foot) { statue(cx - 4, foot, JIZO); statue(cx + 4, foot + 1, JIZO); },
      basin(cx, foot) {
        const [lit, body, shade, line] = M().stone, [wlit, water] = M().water, [bLit, bBody] = M().bamboo;
        for (let y = foot - 5; y <= foot; y++) for (let x = -6; x <= 6; x++) solid(cx + x, y, Math.abs(x) === 6 || y === foot ? line : y === foot - 5 ? lit : x > 3 ? shade : body);
        for (let x = -5; x <= 5; x++) solid(cx + x, foot - 5, x % 3 ? water : wlit);
        for (let k = 0; k < 7; k++) solid(cx - 3 + k, foot - 8 + Math.round(k * 0.3), bLit);   // a bamboo ladle laid across
        solid(cx - 4, foot - 9, bBody); solid(cx - 4, foot - 8, bBody); solid(cx - 3, foot - 9, bBody);
        for (let x = -6; x <= 6; x++) bare(cx + x, foot);
      },
      marker(cx, foot) { statue(cx, foot, MARKER); statue(cx + 4, foot, MARKER.slice(6)); },
      hokora(cx, foot) {
        const [lit, body, shade, line] = M().wood, [red, redDark] = M().red, [tLit, tile, tDark] = M().tile;
        for (let y = foot - 6; y <= foot; y++) { solid(cx, y, M().stone[1]); solid(cx + 1, y, M().stone[2]); }
        for (let y = foot - 13; y <= foot - 7; y++) for (let x = -4; x <= 5; x++) solid(cx + x, y, x === -4 || x === 5 || y === foot - 7 ? line : Math.abs(x - 0.5) < 2 && y > foot - 12 ? (y % 2 ? shade : body) : x < 0 ? red : redDark);
        for (let k = 0; k < 3; k++) for (let x = -6 + k; x <= 7 - k; x++) solid(cx + x, foot - 14 - k, k === 0 ? tDark : k === 2 ? tLit : tile);
      },
    },
    {
      ema(cx, foot) {
        const [lit, body, shade, line] = M().wood;
        for (const x of [-7, 7]) for (let y = foot - 12; y <= foot; y++) { solid(cx + x, y, line); solid(cx + x + 1, y, shade); }
        for (let x = -8; x <= 9; x++) { solid(cx + x, foot - 13, line); solid(cx + x, foot - 12, body); solid(cx + x, foot - 8, shade); }
        for (let x = -5; x <= 5; x += 2) for (const row of [foot - 11, foot - 7]) {   // the little wooden prayer plaques
          const h = (x + row) % 3 ? 2 : 3;
          for (let y = 0; y < h; y++) { solid(cx + x, row + y, y ? body : lit); if ((x + y) % 4 === 1) solid(cx + x, row + y, M().red[0]); }
        }
      },
      fox(cx, foot) { statue(cx, foot, FOX); },
      box(cx, foot) {
        const [lit, body, shade, line] = M().wood;
        for (let y = foot - 7; y <= foot; y++) for (let x = -6; x <= 6; x++) solid(cx + x, y, Math.abs(x) === 6 || y === foot || y === foot - 7 ? line : y === foot - 6 ? (x % 2 ? line : lit) : x > 3 ? shade : y % 2 ? body : shade);
        const [rope, ropeDark] = M().rope, [red] = M().red;
        for (let y = foot - 20; y < foot - 8; y++) { solid(cx + 1, y, y % 2 ? rope : ropeDark); if (y > foot - 12) solid(cx + 2, y, red); }
        for (let x = -1; x <= 3; x++) solid(cx + x, foot - 21, M().bell[0]); solid(cx + 1, foot - 22, M().bell[1]);
      },
      sacredRock(cx, foot) {
        mound(cx, foot, 8, 6, M().stone, (x, y, u, v) => Math.abs(v + 0.15 + u * 0.1) < 0.12 ? M().rope[(x % 2)] : null);
        for (const dx of [-4, 0, 4]) for (let k = 1; k <= 3; k++) solid(cx + dx + (k % 2), foot - 6 + Math.round(dx * 0.05) + k, M().paper);
      },
      bench(cx, foot) {
        const [lit, body, shade, line] = M().wood, [red, redDark] = M().red;
        for (const x of [-6, 5]) for (let y = foot - 3; y <= foot; y++) solid(cx + x, y, line);
        for (let x = -8; x <= 7; x++) { solid(cx + x, foot - 4, red); solid(cx + x, foot - 3, redDark); }
        for (let y = foot - 21; y <= foot - 4; y++) solid(cx + 6, y, lit);   // a red parasol over it
        for (let k = 0; k < 5; k++) for (let x = -2 - k * 2; x <= 2 + k * 2; x++) solid(cx + 6 + x, foot - 22 + k, k === 4 ? redDark : (x + k) % 4 ? red : redDark);
      },
    },
    {
      koi(cx, foot) {
        const [wlit, water, deep] = M().water, [lit, body, shade, line] = M().stone, [koi, koiWhite] = M().koi;
        pool(cx, foot - 2, 10, 3, (x, y, d) => d > 0.7 ? deep : dither(x, y) < 2 ? wlit : water, line);
        for (const [x, y, c] of [[-4, -1, koi], [-3, -1, koiWhite], [3, 0, koi], [4, 0, koi], [5, 0, koiWhite]]) solid(cx + x, foot - 2 + y, c);
        for (const dx of [-11, 9, -7]) mound(cx + dx, foot - (dx === -7 ? 4 : 1), 2, 1, M().stone);
        (life.glints ||= []).push({ x: cx - 1, y: foot - 3, phase: 3 }, { x: cx + 6, y: foot - 2, phase: 19 });
        life.glintColour = M().paper;
      },
      pine(cx, foot) {
        const [lit, leaf, shade] = M().leaf, [bLit, bark, bDark] = M().wood;
        for (let y = foot - 14; y <= foot; y++) { const x = Math.round(Math.sin(y / 4) * 2); solid(cx + x, y, bLit); solid(cx + x + 1, y, bDark); }
        for (const [dx, dy, r] of [[-5, -14, 3], [5, -11, 3], [-4, -8, 2], [1, -18, 3]]) for (let y = -1; y <= 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
          if (Math.abs(x) + Math.abs(y) * 2 <= r + 1) solid(cx + dx + x, foot + dy + y, y < 0 ? lit : y > 0 ? shade : leaf);
        }
        for (let x = -3; x <= 3; x++) solid(cx + x, foot, M().stone[3]);
      },
      incense(cx, foot) {
        const [lit, body, shade] = M().bell, line = M().stone[3];
        for (let y = foot - 7; y <= foot - 3; y++) for (let x = -5; x <= 5; x++) solid(cx + x, y, Math.abs(x) === 5 || y === foot - 3 ? line : y === foot - 7 ? lit : x > 2 ? shade : body);
        for (const x of [-4, 4]) for (let y = foot - 2; y <= foot; y++) solid(cx + x, y, line);
        for (let x = -2; x <= 2; x++) solid(cx + x, foot - 8, shade);
        steam(cx, foot - 9, 0.6);
      },
      zenRock(cx, foot) {
        const groove = M().gravel[3];
        for (let r = 5; r <= 13; r += 3) for (let a = 0; a < 64; a++) {
          const x = cx + Math.round(Math.cos(a / 64 * Math.PI * 2) * r), y = foot - 2 + Math.round(Math.sin(a / 64 * Math.PI * 2) * r * 0.35);
          put(x, y, groove);
        }
        mound(cx, foot - 1, 4, 4, M().stone, (x, y, u, v) => v < -0.6 && x % 2 ? M().moss[0] : null);
      },
      drum(cx, foot) {
        const [lit, body, shade, line] = M().wood, [red, redDark] = M().red;
        for (const x of [-6, 5]) for (let y = foot - 8; y <= foot; y++) { solid(cx + x, y, line); solid(cx + x + 1, y, shade); }
        for (let y = -6; y <= 6; y++) for (let x = -5; x <= 5; x++) {
          const d = (x / 5) ** 2 + (y / 6) ** 2;
          if (d <= 1) solid(cx + x, foot - 13 + y, d > 0.7 ? line : Math.abs(x) < 3 && Math.abs(y) < 4 ? (x < 0 ? M().paper : M().plaster[1]) : d > 0.45 ? red : redDark);
        }
      },
    },
  ],
  wastes: [
    {
      deadTree(cx, foot) { deadTree(cx, foot, 22, M().dead); },
      bones(cx, foot) {
        const [lit, body, shade, line] = M().bone;
        for (let x = -9; x <= 9; x++) { solid(cx + x, foot - 1, x % 2 ? body : lit); solid(cx + x, foot, shade); }   // the spine
        for (let k = -8; k <= 6; k += 3) for (let y = 0; y < 7 - Math.abs(k) * 0.3; y++) {   // ribs arching up
          const x = cx + k + Math.round(Math.sin(y / 3) * 2);
          solid(x, foot - 2 - y, y > 4 ? lit : body); solid(x + 1, foot - 2 - y, shade);
        }
        pixelMap(cx + 9, foot - 5, ['.ooo.', 'oLLbo', 'oLoLo', 'oLbbo', '.ooo.'], { o: line, L: lit, b: body });
      },
      cairn(cx, foot) { for (const [dy, rx] of [[0, 6], [-3, 5], [-6, 4], [-8, 3], [-10, 2]]) mound(cx + (dy % 2), foot + dy, rx, 2, M().rock); },
      arch(cx, foot) {
        const [lit, body, shade, line] = M().rock;
        outlined(cx - 11, foot - 16, cx + 11, foot, (x, y) => {
          const u = (x - cx) / 11, v = (foot - y) / 16, inner = ((x - cx) / 6) ** 2 + ((foot - y) / 10) ** 2;
          return u * u + v * v <= 1 && inner > 1;
        }, (x, y) => (x - cx + (foot - y) < -6 ? lit : x > cx + 4 ? shade : (x + y) % 5 ? body : shade), line);
        for (let x = -11; x <= 11; x++) bare(cx + x, foot);
      },
      charred(cx, foot) {
        stump(cx, foot, 4, 6, M().dead, M().dead);
        for (const [x, y] of [[-2, -6], [1, -6], [3, -3]]) life.cracks.push([cx + x, foot + y, x + 5]);
        steam(cx, foot - 8, 0.5);
      },
    },
    {
      columns(cx, foot) { basaltColumns(cx, foot, 4, 13, M().basalt); },
      vent(cx, foot) {
        mound(cx, foot, 6, 3, S.rock.length > 3 ? S.rock : [...S.rock, M().basalt[3]]);
        for (let x = -1; x <= 1; x++) solid(cx + x, foot - 6, M().basalt[3]);
        steam(cx, foot - 7, 1.2);
      },
      pool(cx, foot) {
        pool(cx, foot - 2, 8, 3, () => S.lava[2], M().basalt[3], true);
        for (const dx of [-9, 8]) mound(cx + dx, foot - 1, 2, 1, M().basalt);
        steam(cx - 2, foot - 4, 0.8);
      },
      obsidian(cx, foot) {
        const [lit, body, shade, line] = M().obsidian;
        for (const [dx, h, lean] of [[-4, 9, -0.3], [0, 13, 0.1], [4, 8, 0.35], [7, 5, 0.5]]) for (let y = 0; y <= h; y++) {
          const w = Math.max(0, Math.round((1 - y / h) * 2.2));
          for (let x = -w; x <= w; x++) solid(cx + dx + Math.round(y * lean) + x, foot - y, x === -w ? line : x < 0 ? lit : x > 0 ? shade : body);
        }
        (life.glints ||= []).push({ x: cx, y: foot - 9, phase: 5 }, { x: cx - 4, y: foot - 5, phase: 23 });
        life.glintColour = M().obsidian[0];
      },
      burntTree(cx, foot) {
        deadTree(cx, foot, 18, M().basalt);
        for (let k = 0; k < 4; k++) life.cracks.push([cx + (k % 2), foot - 2 - k * 2, k * 3]);
      },
    },
    {
      fumarole(cx, foot) {
        const [sLit, sulfur, sDark] = M().sulfur;
        mound(cx, foot, 7, 3, [sLit, sulfur, sDark, M().basalt[3]], (x, y, u, v) => Math.abs(u) < 0.25 && v < 0 ? M().basalt[3] : null);
        steam(cx, foot - 6, 1.4); steam(cx + 4, foot - 3, 0.6);
      },
      sulfur(cx, foot) {
        const [lit, body, shade] = M().sulfur, line = M().basalt[3];
        for (const [dx, h] of [[-4, 5], [-1, 8], [2, 6], [5, 4], [7, 2]]) for (let y = 0; y <= h; y++) {
          solid(cx + dx - 1, foot - y, line); solid(cx + dx, foot - y, y === h ? lit : body); solid(cx + dx + 1, foot - y, shade); solid(cx + dx + 2, foot - y, line);
        }
      },
      bomb(cx, foot) {
        mound(cx, foot, 7, 5, M().basalt, (x, y, u, v) => Math.abs(Math.sin(x * 1.3 + y * 0.9)) < 0.12 && u * u + v * v < 0.7 ? (life.cracks.push([x, y, x + y]), S.lava[2]) : null);
      },
      tube(cx, foot) {
        const [lit, body, shade, line] = S.volcano.length > 3 ? S.volcano : [...S.volcano, M().basalt[3]];
        outlined(cx - 12, foot - 11, cx + 12, foot, (x, y) => ((x - cx) / 12) ** 2 + ((foot - y) / 11) ** 2 <= 1, (x, y) => {
          const d = ((x - cx) / 6) ** 2 + ((foot - y) / 7) ** 2;
          if (d <= 1) { if (d > 0.6) return M().basalt[3]; life.cracks.push([x, y, Math.round(d * 6)]); return S.lava[3]; }
          return x - cx + (foot - y) < -8 ? lit : x > cx + 5 ? shade : body;
        }, line);
      },
      warning(cx, foot) {
        const [sign, signDark, ink] = M().sign;
        for (let y = foot - 9; y <= foot; y++) { solid(cx, y, M().dead[1]); solid(cx + 1, y, M().dead[2]); }
        for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
          const d = Math.abs(x) + Math.abs(y);
          if (d <= 5) solid(cx + x + 1, foot - 15 + y, d >= 5 ? ink : d === 4 ? signDark : x === 0 && y !== 2 && y > -4 && y < 4 ? ink : sign);
        }
      },
    },
  ],
};

function shuffled(list, r) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** This floor's landmark, standing at the back of the left edge or the middle of the right one, clear of the Pokémon. */
function landmark() {
  const b = biomeOf(), st = stage();
  if (!b || S.raw.step == null || st > 2) return;
  const r = seeded((S.raw.seed ^ (st * 7919 + 17)) >>> 0), order = shuffled(Object.entries(LANDMARKS[b][st]), r);
  const [name, mark] = order[S.raw.step % order.length];
  // the deep woods' big trees frame the left edge, so there the landmark stands on the right
  const paint = mark.paint || mark, side = mark.side || (b === 'clearing' && st === 2 ? 1 : r() < 0.5 ? -1 : 1);
  const cx = side < 0 ? Math.max(12, Math.round(W * 0.08)) : Math.min(W - 13, Math.round(W * 0.91));
  const foot = groundAt(side < 0 ? 0.1 : 0.26);
  const keep = { x0: cx - 14, x1: cx + 14, y0: foot - 24, y1: foot + 2 };
  life.cracks &&= life.cracks.filter(([x, y]) => x < keep.x0 || x > keep.x1 || y < keep.y0 || y > keep.y1 || y > foot - 1);
  paint(cx, foot);
  (life.keep ||= []).push(keep);
  life.landmark = name;
}

/** The places' living parts: steam and smoke puffs rising, glints on water and glass. */
function drawStage(t) {
  const L = life;
  if (L.glints && L.glintColour != null && !S.raw.life.includes('surf')) {
    for (const g of L.glints) if (Math.sin((t + g.phase) / 5) > 0.85) { put(g.x, g.y, L.glintColour); put(g.x + 1, g.y, L.glintColour); }
  }
  if (L.puffs) {
    const [white, grey] = M().steam;
    for (const p of L.puffs) for (let i = 0; i < 4; i++) {
      const age = ((t * 0.7 + i * 9 + p.phase) % 36), y = p.y - age * 0.55 * p.size, x = p.x + Math.sin((age + p.phase) / 5) * 1.5 + age * 0.08;
      const r = (0.8 + age / 14) * p.size, fade = 12 - age / 3;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dy * dy <= r * r && dither(Math.round(x + dx), Math.round(y + dy) + i) < fade) put(x + dx, y + dy, age > 18 ? grey : white);
      }
    }
  }
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

/** Rock broken into facets (Voronoi cells) above the horizon, each lit on its top-left and cracked at its edges,
    darker towards the sides and the top; glowing veins run through the cracks where the scene has `vein`. */
function facetRock() {
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
}

/** The grotto's rock walls, darker towards their ends and the roof, so the light seems to come from the hole. */
function grottoWall() {
  const cx = W / 2;
  facetRock();

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

/* A found item's Poké Ball (offerItem() in js/run.js): the biome's ball (Poké, Great, Ultra), round like the games'
   item balls, painted as two halves split along the band so the top can pop open. */
const ITEM_BALLS = {
  poke: { top: ['#ff9080', '#e83830', '#b82020'] },
  great: { top: ['#98c8ff', '#3878f0', '#2850b8'], mark: ['#ff7060', '#e03830'] },
  ultra: { top: ['#70707e', '#46464e', '#2c2c34'], mark: ['#fff080', '#f8d030'] },
};
const ITEM_BALL = 22;

/** The two halves of the ball as little pixel images ({ url, w, h }): `top` (its upper half and the band's top row)
    and `bottom`. Needs no scene up: it paints with its own colours. */
export function itemBallArt(kind = 'poke') {
  const k = ITEM_BALLS[kind] || ITEM_BALLS.poke, c = colours({ ...k, white: ['#ffffff', '#e0e0e8', '#a8a8b8'], line: '#202028', grey: '#b8b8c8' });
  const half = ITEM_BALL / 2;
  const paint = (dy) => () => {
    const inBall = (x, y) => Math.hypot(x + 0.5 - half, y + 0.5 - half) <= half - 1.2;
    for (let y = 0; y < ITEM_BALL; y++) for (let x = 0; x < ITEM_BALL; x++) {
      const d = Math.hypot(x + 0.5 - half, y + 0.5 - half), lit = (x + 0.5 - half) * 0.7 + (y + 0.5 - half) * 0.7;
      let col;
      if (!inBall(x, y)) {
        if ([-1, 0, 1].some(oy => [-1, 0, 1].some(ox => inBall(x + ox, y + oy)))) col = c.line;
        else continue;
      } else if (d <= 2.2) col = c.white[0];
      else if (d <= 3.2) col = c.grey;
      else if (d <= 4.4 || y === half - 1 || y === half) col = c.line;
      else if (y < half) {
        const shade = lit < -4 ? 0 : lit < 4 ? 1 : 2;
        col = c.top[shade];
        if (kind === 'great' && Math.abs(x + 0.5 - half) >= 5.5 && y >= 3 && y <= 7) col = c.mark[shade ? 1 : 0];
        if (kind === 'ultra' && y <= 7 && (Math.abs(x + 0.5 - half) === 3.5 || Math.abs(x + 0.5 - half) === 4.5)) col = c.mark[x < half ? 0 : 1];
        if (x >= 5 && x <= 7 && y >= 4 && y <= 6 && x - 5 <= y - 4) col = c.white[0];   // the shine
      } else col = c.white[lit < 2 ? 0 : lit < 7 ? 1 : 2];
      solid(x, y - dy, col);
    }
  };
  return { top: paintProp(ITEM_BALL, half, paint(0)), bottom: paintProp(ITEM_BALL, half, paint(half)) };
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

/* ============================================================
   ? EVENTS OUTDOORS: props standing in the biome's scene. The page lays its choices over them (eventSpots()) and
   plays each choice out on them (sceneAct()): berries falling, a sprout, steam, ripples, a coin into the well.
   ============================================================ */

const groundAt = (k) => horizon + Math.round((H - horizon) * k);
const kept = (x, y) => life.keep?.some(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);

function eventProps() {
  ({ berry: berryScene, spring: springScene, well: wellScene, itemball: itemBallScene, rocket: rocketScene, altar: altarScene, tutor: tutorScene, deleter: deleterScene, daycare: daycareScene, fans: fanScene })[S.raw.prop]();
  if (life.cracks) life.cracks = life.cracks.filter(([x, y]) => !kept(x, y));   // no lava glowing through them either
}

/** Fill a shape (`mask`) inside a box with `colourAt`, outlined in `line` where it meets the outside, like the games' sprites. */
function outlined(x0, y0, x1, y1, mask, colourAt, line) {
  for (let y = Math.floor(y0) - 1; y <= y1 + 1; y++) for (let x = Math.floor(x0) - 1; x <= x1 + 1; x++) {
    if (mask(x, y)) solid(x, y, colourAt(x, y));
    else if (mask(x - 1, y) || mask(x + 1, y) || mask(x, y - 1) || mask(x, y + 1)) solid(x, y, line);
  }
}

function groundShadow(cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2;
    if (d <= 1 && (d < 0.55 || dither(cx + x, cy + y) < 8)) tint(cx + x, cy + y, 0.72);
  }
}

/** Where the event's choices are on screen, in CSS pixels ({ spots: [{ left, top, width, height }], foot: a y under
    the props for the text box }), or null. */
export function eventSpots() {
  if (!life.eventSpots || !canvas || !S?.raw.prop) return null;
  const box = canvas.getBoundingClientRect(), sx = box.width / W, sy = box.height / H;
  const rect = ({ x0, x1, y0, y1 }) => ({ left: box.left + x0 * sx, top: box.top + y0 * sy, width: (x1 - x0 + 1) * sx, height: (y1 - y0 + 1) * sy });
  const stands = Object.fromEntries(Object.entries(life.stands || {}).map(([k, p]) => [k, {
    x: box.left + (p.x + 0.5) * sx, y: box.top + p.y * sy, cut: p.cut === undefined ? undefined : box.top + p.cut * sy,
  }]));
  return { spots: life.eventSpots.map(rect), foot: box.top + life.foot * sy, stands, px: sx };
}

// how long each choice plays out, in frames, and what it sets going
const ACTS = {
  eat: { frames: 13, start: () => [...life.berries].sort((a, b) => b.y - a.y).slice(0, 3).forEach((b, i) => { b.fall = i * 2; b.floor = life.treeFoot + 1 + i; }) },
  plant: { frames: 14, start: () => { [...life.berries].sort((a, b) => a.y - b.y)[0].fly = 0; } },
  soak: { frames: 16 },
  dip: { frames: 11 },
  toss: { frames: ({ win }) => (win ? 26 : 15) },
  pickup: { frames: ({ trap }) => (trap ? 22 : 15), cues: ({ trap }) => (trap ? [[11, 'hit']] : [[6, 'ball-open']]) },
  pay: { frames: 13 },
  run: { frames: 11 },
  pray: { frames: 19 },
  lesson: { frames: 12 },
  train: { frames: 20, cues: () => [[2, 'hit'], [6, 'hit'], [10, 'hit']] },
  erase: { frames: 14 },
  hypno: { frames: 16 },
  trade: { frames: 18 },
  cheer: { frames: 18 },
};

/** Play a choice out on the event's props; resolves how long it takes in ms (0 under reduced motion, which skips it
    but still plays its `cues`, the sounds timed to its frames). */
export function sceneAct(name, opts = {}) {
  const act = ACTS[name];
  if (!act || !S?.raw.prop) return 0;
  if (!timer) { for (const [, sound] of act.cues?.(opts) || []) playSound(sound); return 0; }
  life.act = { name, at: tick, ...opts };
  act.start?.();
  return (typeof act.frames === 'function' ? act.frames(opts) : act.frames) * 1000 / FPS;
}
const actFrame = (name) => (life.act?.name === name ? tick - life.act.at : -1);
function actCues() {
  const { name, at, ...opts } = life.act;
  for (const [f, sound] of ACTS[name].cues?.(opts) || []) if (tick - at === f) playSound(sound);
}

/* ---------- the Berry Tree ---------- */

// the crown's leafy clumps [dx, dy, r] from the tree's foot, back to front, and where the berries hang
const CROWN = [[-5, -25, 6.5], [5, -25, 6.5], [0, -19, 10], [-9, -14, 7], [9, -14, 7]];
const BERRIES = [[-11, -24], [-3, -28], [5, -23], [-7, -17], [1, -14], [10, -18], [-12, -11], [7, -10]];

function berryScene() {
  const cx = (W >> 1) - 13, fy = groundAt(0.42) - 1, plot = { x: cx + 31, y: fy + 4 };
  groundShadow(cx + 3, fy + 2, 18, 4);
  softSoil(cx, fy, 13, 3);
  softSoil(plot.x, plot.y, 8, 2);
  signPost(plot.x + 13, plot.y + 3);
  berryTree(cx, fy);
  life.berries = BERRIES.map(([dx, dy], i) => ({ x: cx + dx, y: fy + dy, phase: i * 23 }));
  life.treeFoot = fy;
  life.plot = plot;
  life.eventSpots = [
    { x0: cx - 16, x1: cx + 16, y0: fy - 32, y1: fy + 4 },
    { x0: plot.x - 10, x1: plot.x + 10, y0: plot.y - 7, y1: plot.y + 4 },
  ];
  life.foot = plot.y + 6;
  life.keep = [{ x0: cx - 18, x1: plot.x + 18, y0: fy - 34, y1: plot.y + 5 }];
}

/** A square of soft, tilled soil like the games' berry plots: furrowed rows and a darker front edge. */
function softSoil(cx, cy, hw, hh) {
  const [lit, soil, furrow, face, line] = S.soil;
  const inPlot = (x, y) => Math.abs(x - cx) <= hw && y >= cy - hh && y <= cy + hh + 1 && !(Math.abs(x - cx) === hw && (y === cy - hh || y === cy + hh + 1));
  outlined(cx - hw, cy - hh, cx + hw, cy + hh + 1, inPlot,
    (x, y) => (y === cy + hh + 1 ? face : y === cy - hh ? lit : (y - cy + hh) % 2 === 0 && x % 3 ? furrow : soil), line);
}

/** A little wooden sign on a post, like the ones by the games' berry plots. */
function signPost(cx, foot) {
  const [lit, wood, dark, line] = S.wood;
  pixelMap(cx - 4, foot - 9, [
    'kkkkkkkkk',
    'kaaaaaaak',
    'kaddddabk',
    'kaaaaaabk',
    'kadddabbk',
    'kbbbbbbbk',
    'kkkkakkkk',
    '...kbk...',
    '...kbk...',
  ], { k: line, a: lit, b: wood, d: dark });
}

/** A round berry tree: a short trunk under leafy clumps lit from the top left, each clump edged where it overlaps one behind. */
function berryTree(cx, fy) {
  const [barkLit, bark, barkDark] = S.bark, tones = S.leaf, line = S.leafLine;
  outlined(cx - 3, fy - 11, cx + 3, fy, (x, y) => y >= fy - 11 && y <= fy && Math.abs(x - cx) <= (y >= fy - 1 ? 2 : 1),
    (x) => (x < cx ? barkLit : x > cx ? barkDark : bark), line);
  const clump = (x, y) => {
    for (let i = CROWN.length - 1; i >= 0; i--) {
      const [dx, dy, r] = CROWN[i], ux = (x - cx - dx) / r, uy = (y - fy - dy) / r, d = Math.hypot(ux, uy);
      if (d <= 1) return { i, ux, uy, d };
    }
    return null;
  };
  const behind = (x, y, i) => CROWN.some(([dx, dy, r], j) => j < i && Math.hypot(x - cx - dx, y - fy - dy) <= r);
  outlined(cx - 17, fy - 33, cx + 17, fy - 6, (x, y) => !!clump(x, y), (x, y) => {
    const c = clump(x, y);
    if (c.d > 0.86 && behind(x, y, c.i)) return tones[3];
    const v = c.ux + c.uy * 1.2, fleck = (x * 2 + y * 3) % 7 === 0 && y % 2 === 0;   // little leaf marks
    return tones[Math.min(3, (v < -0.7 ? 0 : v < 0.2 ? 1 : v < 0.9 ? 2 : 3) + (fleck ? 1 : 0))];
  }, line);
}

/** An Oran Berry: round and blue with a shine and a green stem. */
function berry(x, y) {
  const [shine, body, shade, deep] = S.berry;
  put(x + 1, y - 1, S.stem);
  put(x, y, shine); put(x + 1, y, body); put(x + 2, y, body);
  put(x, y + 1, body); put(x + 1, y + 1, shade); put(x + 2, y + 1, shade);
  put(x + 1, y + 2, deep);
}

function sparkle(x, y, c) {
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + dx, y + dy, c);
}

/** The berries (they glint now and then); eating shakes three loose to bounce on the soil and vanish, planting throws
    one into the empty plot and a sprout comes up. */
function drawBerryTree() {
  const eat = actFrame('eat'), plant = actFrame('plant'), p = life.plot, shine = S.berry[0];
  for (const b of life.berries) {
    if (b.gone) continue;
    let { x, y } = b;
    if (b.fall != null && eat >= b.fall) {
      const k = eat - b.fall, land = Math.sqrt((b.floor - b.y) / 0.9);
      if (k > land + 3) { b.gone = true; continue; }
      if (k > land + 1) { sparkle(x + 1, b.floor, shine); continue; }
      y = Math.min(b.floor, b.y + Math.round(0.9 * k * k));
      x += (x < p.x - 31 ? -1 : 1) * Math.min(k, 3);   // away from the trunk
    }
    if (b.fly != null && plant >= 0) {
      const k = Math.min(1, plant / 6);
      if (plant >= 6) { b.gone = true; life.sprout = tick; continue; }
      x = Math.round(b.x + (p.x - 1 - b.x) * k);
      y = Math.round(b.y + (p.y - 2 - b.y) * k - Math.sin(k * Math.PI) * 10);
    }
    berry(x, y);
    if (Math.sin((tick + b.phase) / 6) > 0.96) put(x + 1, y, shine);
  }
  if (life.sprout != null) {
    const s = tick - life.sprout, [lit, leaf] = S.leaf, { x, y } = p;
    put(x - 1, y, S.soil[0]); put(x, y - 1, S.soil[0]); put(x + 1, y, S.soil[0]);
    if (s >= 2) { put(x, y - 1, S.stem); put(x, y - 2, S.stem); put(x - 1, y - 3, lit); put(x + 1, y - 3, leaf); }
    if (s >= 4) {
      put(x, y - 3, S.stem); put(x, y - 4, S.stem);
      for (const [dx, dy, c] of [[-1, -4, lit], [-2, -5, lit], [-1, -5, leaf], [1, -4, leaf], [2, -5, leaf], [1, -5, lit]]) put(x + dx, y + dy, c);
      if (s < 7) sparkle(x, y - 7, S.berry[0]);
    }
  }
}

/* ---------- the Hot Spring ---------- */

/* ---------- the Hot Spring, close up: its own scene (PLACE_ART.spring), the pool at your feet ---------- */

/** The big pool fills the screen's middle, its back rim just below the fence and its front where you'd step in, high
    enough to leave ~190 CSS px under it for the text box and Leave; the little pool sits below its front right. */
function springLayout() {
  const foot = Math.round(Math.min(H * 0.8, H - 190 * H / innerHeight));
  const ry = Math.max(6, Math.round(Math.min((foot - horizon - 7) / 2.2, W * 0.2)));
  const rx = Math.round(Math.min(W * 0.42, ry * (W > 200 ? 4 : 3.2), 130));
  const srx = Math.max(8, Math.round(rx * 0.34)), sry = Math.max(3, Math.round(srx * 0.42));
  const big = { x: Math.round(W / 2 - srx * 0.45), y: foot - ry - 3, rx, ry };
  return { foot, big, small: { x: Math.round(big.x + rx * 0.7), y: Math.round(big.y + ry * 0.62), rx: srx, ry: sry } };
}

/** Behind the pools: a garden under the sky, old cedars in the mist, or a cliff of volcanic rock; a bamboo fence along
    the first two. */
const fenceHeight = () => Math.max(8, Math.round(H * 0.1));

function onsenWall() {
  const fh = fenceHeight();
  if (S.raw.wall === 'rock') { facetRock(); ventSpots(); return; }
  if (S.raw.wall === 'cedars') { foliage(); cedars(springLayout().big.rx * 1.6); }
  else {
    ridge(horizon - fh - 10, 6, 23, 0.4, S.farHills, false);
    ridge(horizon - fh - 4, 5, 13, 2.1, S.hills, true);
    for (let x = 4 + Math.floor(rand() * 8); x < W; x += 12 + Math.floor(rand() * 14)) roundTree(x, horizon - fh - 3 - Math.floor(rand() * 5), 5 + Math.floor(rand() * 4), false);
  }
  bambooFence(fh);
}

/** Where the rock lets out steam (drawn by drawSpring). */
function ventSpots() {
  const n = Math.max(2, Math.round(W / 60));
  life.vents = Array.from({ length: n }, (_, i) => ({
    x: Math.round((i + 0.3 + rand() * 0.4) * W / n), y: Math.round(horizon * (0.55 + rand() * 0.35)), age: rand() * 40,
  }));
}

/** A bamboo fence (takegaki): upright poles with their joints, a split cap along the top, two rails lashed with rope. */
function bambooFence(h) {
  const [lit, body, dark, line] = S.bamboo, top = horizon - h;
  for (let x = 0; x < W; x++) {
    const pole = Math.floor(x / 3), k = x % 3, joint = (pole * 7) % 5 + 3;
    for (let y = top + (pole % 2); y < horizon; y++) {
      const node = (y - top + joint) % 7 === 0;
      solid(x, y, k === 2 ? line : node ? dark : k === 0 ? lit : body);
    }
    solid(x, top + (pole % 2) - 1, line);
  }
  for (const y of [top + Math.round(h * 0.25), top + Math.round(h * 0.7)]) {
    for (let x = 0; x < W; x++) { solid(x, y, lit); solid(x, y + 1, dark); solid(x, y + 2, line); }
    for (let x = 5; x < W; x += 9) { solid(x, y, S.tie); solid(x, y + 1, S.tie); solid(x + 1, y + 1, S.tie); }
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.7); tint(x, horizon + 1, 0.85); }   // its shadow on the stones
}

/** Flagstones from the fence to your feet, the rows growing as they come closer, moss (or cinders) in the joints. */
function flagstones() {
  const line = S.groundLine;
  for (let y0 = horizon, rh = 2, row = 0; y0 < H; y0 += rh, rh = Math.min(rh + (row % 2), 9), row++) {
    let x = -Math.floor(noise(row, 1, 3) * rh * 3);
    while (x < W) {
      const w = rh * 2 + 2 + Math.floor(noise(x, row, 4) * rh * 3), shade = S.ground[Math.floor(noise(x, row, 5) * 3)];
      for (let y = y0; y < y0 + rh && y < H; y++) for (let dx = 0; dx < w; dx++) {
        const edge = dx === 0 || y === y0 + rh - 1;
        let c = edge ? line : y === y0 ? S.ground[0] : dither(x + dx, y) < 2 ? S.ground[3] : shade;
        if (edge && S.moss && noise(x + dx, y, 9) > 0.55) c = S.moss[(dx + y) & 1];
        solid(x + dx, y, c);
      }
      x += w;
    }
  }
}

function springScene() {
  const { foot, big, small } = springLayout();
  life.lamps = [];
  const L = Math.round(big.ry * 1.5), lx = big.x - big.rx - Math.round(L * 0.2);
  if (lx - L * 0.35 > 0) { groundShadow(lx + 1, big.y - big.ry + 2, Math.round(L * 0.3), 2); stoneLantern(lx, big.y - big.ry + 2, L); }
  else { groundShadow(big.x - big.rx + 6, horizon + 3, Math.round(L * 0.25), 1); stoneLantern(big.x - big.rx + 6, horizon + 3, Math.round(L * 0.8)); }
  onsenSign(Math.min(W - 9, big.x + Math.round(big.rx * 0.5)), horizon - fenceHeight() + 2);
  const rx2 = small.x + small.rx + Math.round(L * 0.55);   // wide screens get a second lantern past the spout
  if (rx2 + L * 0.4 < W) { groundShadow(rx2 + 1, big.y - big.ry + 2, Math.round(L * 0.3), 2); stoneLantern(rx2, big.y - big.ry + 2, L); }
  hotPool(big);
  const spout = bambooSpout(small);
  hotPool(small);
  const bx = big.x - Math.round(big.rx * 0.55), by = big.y + big.ry + 4;
  bathBucket(Math.max(6, bx), Math.min(foot + 2, by));
  life.pools = [big, small];
  life.spout = spout;
  life.eventSpots = [
    { x0: big.x - Math.round(big.rx * 0.7), x1: big.x + Math.round(big.rx * 0.5), y0: big.y - big.ry, y1: big.y + Math.round(big.ry * 0.4) },
    { x0: small.x - small.rx, x1: small.x + small.rx, y0: small.y - small.ry - 2, y1: small.y + small.ry + 2 },
  ];
  life.foot = foot + 2;
}

const inPool = (p, x, y) => ((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2 <= 0.8;

/** Steaming water, shaded under its back rim and clear over the stones at the front, ringed with boulders that grow
    as they come closer. */
function hotPool({ x: cx, y: cy, rx, ry }) {
  const [, light, water, deep, deepest] = S.water;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2, k = (y + ry) / (2 * ry);
    if (d > 1) continue;
    const c = k < 0.18 ? deepest : k < 0.4 || (k < 0.52 && dither(x, y) < 8) ? deep : k > 0.8 && dither(x, y) < (k - 0.8) * 60 ? light : water;
    solid(cx + x, cy + y, c);
  }
  const n = Math.round(Math.PI * (rx + ry) / Math.max(2.4, ry * 0.3)), stones = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2, near = (Math.sin(a) + 1) / 2;
    const r = Math.max(1.5, ry * (0.12 + near * 0.16) * (0.8 + noise(i, rx, 7) * 0.45));
    stones.push({ x: Math.round(cx + Math.cos(a) * (rx + r * 0.6)), y: Math.round(cy + Math.sin(a) * (ry + r * 0.45)), r });
  }
  stones.sort((a, b) => a.y - b.y).forEach(s => poolStone(s.x, s.y, s.r));
}

function poolStone(cx, cy, r) {
  const [lit, body, shade, line] = S.poolStone, ry = Math.max(1, r * 0.75);
  outlined(cx - r, cy - ry, cx + r, cy + ry, (x, y) => ((x - cx) / (r + 0.5)) ** 2 + ((y - cy) / (ry + 0.5)) ** 2 <= 1, (x, y) => {
    const v = (x - cx) / r + (y - cy) / ry;
    return v < -0.6 ? lit : v < 0.6 || dither(x, y) < 4 ? body : shade;
  }, line);
}

/** A bamboo pipe (kakei) on a post, pouring into the little pool from its right; returns where the water leaves it. */
function bambooSpout(p) {
  const [lit, body, dark, line] = S.bamboo, post = Math.min(W - 3, p.x + p.rx + 5), top = p.y - p.ry - Math.max(8, p.ry * 2);
  for (let y = top; y <= p.y + 1; y++) { solid(post - 1, y, line); solid(post, y, lit); solid(post + 1, y, dark); solid(post + 2, y, line); }
  const end = { x: p.x + Math.round(p.rx * 0.35), y: top + 3 };
  for (let x = end.x; x <= post + 1; x++) {
    const y = top + Math.round((x - end.x) / (post + 1 - end.x) * -2) + 2;
    solid(x, y - 1, line); solid(x, y, (x - end.x) % 6 === 5 ? dark : lit); solid(x, y + 1, body); solid(x, y + 2, line);
  }
  solid(end.x - 1, end.y - 2, line); solid(end.x - 1, end.y - 1, S.water[3]); solid(end.x - 1, end.y, line);
  return { x: end.x - 1, y: end.y, to: p.y - 1 };
}

/** A wooden bath bucket (with its metal hoops) and a folded towel over its rim. */
function bathBucket(cx, foot) {
  const [lit, wood, dark, line] = S.wood, [towel, fold] = S.towel;
  pixelMap(cx - 5, foot - 8, [
    '...wwww....',
    '.kwwwffwkk.',
    'kaaawfbbdk.',
    'khhhhhhhhk.',
    'kaaabbbbdk.',
    'kaaabbbbdk.',
    'khhhhhhhhk.',
    '.kkkkkkkk..',
  ], { k: line, a: lit, b: wood, d: dark, h: S.hoop, w: towel, f: fold });
}

/** A wooden board with the hot spring mark (♨: three wisps of steam over a bowl), nailed up on the fence (or rock). */
function onsenSign(cx, top) {
  const [board, red] = S.onsen, [, , , line] = S.wood;
  const mark = ['..r...r...r..', '.r...r...r...', '.r...r...r...', '..r...r...r..', '.............', 'r...........r', '.rrrrrrrrrrr.'];
  pixelMap(cx - 7, top, [
    'kkkkkkkkkkkkkkk',
    'kwnwwwwwwwwwnwk',
    ...mark.map(row => `k${row.replace(/\./g, 'w')}k`),
    'kwwwwwwwwwwwwwk',
    'kkkkkkkkkkkkkkk',
  ], { k: line, w: board, r: red, n: line });
  for (let x = cx - 6; x <= cx + 8; x++) tint(x, top + 11, 0.7);   // its shadow
}

/** Glints sliding over the water, a rubber duck bobbing, the spout's stream splashing, the lantern flickering, steam
    rising off both pools and the rock's vents (a cloud of it while you soak) and ripples where you step in. */
function drawSpring(t) {
  const soak = actFrame('soak'), dip = actFrame('dip'), [foam, light] = S.water;
  const surge = soak < 0 ? 0 : Math.max(0, Math.min(1, soak / 4, (16 - soak) / 4));
  for (const w of life.lamps) for (let y = w.y0; y <= w.y1; y++) for (let x = w.x0; x <= w.x1; x++) {
    const flick = 6 + Math.round(4 * Math.sin(t / 2 + w.x0) + 3 * Math.sin(t / 5.3));
    if (dither(x, y + (t >> 1)) < flick) put(x, y, S.glow[0]);
  }
  life.pools.forEach((p, i) => {
    for (let k = 0; k < Math.max(2, Math.round(p.rx / 4)); k++) {
      const row = p.y - p.ry + 2 + ((k * 5) % Math.max(1, p.ry * 2 - 3));
      const len = Math.max(2, Math.round(p.rx / 12)), x = p.x - p.rx + ((Math.floor(t * 0.5) + k * 13 + i * 5) % (p.rx * 2));
      for (let d = 0; d <= len; d++) if (inPool(p, x + d, row)) put(x + d, row, d === 1 ? foam : light);
    }
    const f = i ? dip : soak;
    if (f >= 0) for (const age of [f, f - 3, f - 6]) {
      if (age < 0 || age > 9) continue;
      const rx = 1 + age * p.rx / 9, ry = Math.max(1, rx * p.ry / p.rx);
      for (let a = 0; a < Math.PI * 2; a += 0.6 / rx) {
        const x = Math.round(p.x + Math.cos(a) * rx), y = Math.round(p.y + Math.sin(a) * ry);
        if (inPool(p, x, y)) put(x, y, foam);
      }
    }
    if (i === 1 && dip >= 0 && dip < 5) for (const dx of [-3, -1, 1, 3]) put(p.x + dx * (1 + dip * 0.6), p.y - 2 - dip * 2 + dip * dip * 0.6, foam);
  });

  const s = life.spout, small = life.pools[1];   // the spout's stream, bending as it falls, and its splash
  for (let y = s.y; y <= s.to; y++) {
    const x = s.x - Math.round(Math.sqrt(y - s.y) * 0.6), c = (y + t) % 3 ? light : foam;
    put(x, y, c);
    if ((y + t) % 4 === 0) put(x - 1, y, foam);
  }
  const sx = s.x - Math.round(Math.sqrt(s.to - s.y) * 0.6);
  for (const dx of [-2, 2]) put(sx + dx, s.to - ((t + (dx > 0 ? 1 : 0)) % 2), foam);
  if (inPool(small, sx, s.to + 1)) put(sx, s.to + 1, foam);

  const big = life.pools[0], [yellow, shade, beak] = S.duck;   // the duck, a little Psyduck-yellow
  const dx = big.x + Math.round(big.rx * 0.3) + Math.round(Math.sin(t / 14) * big.rx * 0.2), dy = big.y + ((t >> 2) % 2) - (surge ? Math.round(Math.sin(t)) : 0);
  pixelMap(dx - 2, dy - 3, ['.yy..', 'yyyb.', 'syyy.', '.ss..'], { y: yellow, s: shade, b: beak });
  put(dx - 2, dy + 1, foam); put(dx + 2, dy + 1, foam);

  for (const st of life.steam) {
    const p = st.pool < 0 ? null : life.pools[st.pool], boost = st.pool === 0 ? surge : 0, span = st.pool < 0 ? 24 : 36;
    const age = (st.age + t * st.speed * (1 + boost)) % span, fade = 1 - age / span;
    const ox = p ? p.x + st.dx : life.vents[st.vent].x, oy = p ? p.y - 1 : life.vents[st.vent].y;
    const x = ox + Math.sin((t + st.age) / 5) * 1.5 + age * 0.15, y = oy - age * (0.6 + boost * 0.25);
    const r = st.size * (1 + age / 10) + boost * 2, k = (p ? 0.45 + boost * 0.4 : 0.35) * fade;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
      if (xx * xx + yy * yy <= r * r && dither(Math.round(x + xx), Math.round(y + yy)) < 14) blend(x + xx, y + yy, S.steam, k);
    }
  }
}

/* ---------- the Wishing Well ---------- */

function wellScene() {
  const cx = W >> 1, foot = groundAt(0.44), hw = 13, rim = foot - 11;
  groundShadow(cx + 3, foot, hw + 6, 3);
  wellBody(cx, foot, hw, rim);
  wellFrame(cx, rim, hw);
  life.well = { x: cx, y: rim, rx: hw - 3 };
  life.coins = Array.from({ length: 5 }, () => ({ x: cx - 8 + Math.floor(rand() * 17), y: rim - 1 + Math.floor(rand() * 3), phase: rand() * 60 }));
  life.eventSpots = [
    { x0: cx - hw - 5, x1: cx - 1, y0: rim - 32, y1: foot + 2 },
    { x0: cx, x1: cx + hw + 5, y0: rim - 32, y1: foot + 2 },
  ];
  life.foot = foot + 5;
  life.keep = [{ x0: cx - hw - 6, x1: cx + hw + 6, y0: rim - 34, y1: foot + 3 }];
}

/** A round stone well: bricks in staggered rows, lit on the left, under a ring of capstones round dark water. */
function wellBody(cx, foot, hw, rim) {
  const [lit, body, shade, mortar, line] = S.wellStone, [light, water, deep] = S.wellWater;
  const bottom = (dx) => foot - 2 + Math.round(2 * Math.sqrt(Math.max(0, 1 - (dx / (hw + 0.5)) ** 2)));
  outlined(cx - hw, rim, cx + hw, foot, (x, y) => Math.abs(x - cx) <= hw && y >= rim && y <= bottom(x - cx), (x, y) => {
    const u = (x - cx) / hw, row = Math.floor((y - rim) / 3), brick = (x - cx + hw + (row % 2) * 3) % 6;
    if ((y - rim) % 3 === 0 || brick === 0) return mortar;
    return u < -0.55 ? lit : u > 0.45 ? shade : brick === 1 && u < 0.2 ? lit : body;
  }, line);
  const rx = hw + 1, ry = 4, hx = hw - 2, hy = 2, seams = 14;
  outlined(cx - rx, rim - ry, cx + rx, rim + ry, (x, y) => ((x - cx) / (rx + 0.5)) ** 2 + ((y - rim) / (ry + 0.5)) ** 2 <= 1, (x, y) => {
    if (((x - cx) / (hx + 0.5)) ** 2 + ((y - rim) / (hy + 0.5)) ** 2 <= 1) return y < rim ? deep : y === rim ? water : light;
    const a = (Math.atan2((y - rim) / ry, (x - cx) / rx) + Math.PI) / (Math.PI * 2) * seams;
    if (a - Math.floor(a) < 0.12) return mortar;
    return y < rim - 1 ? lit : y > rim + 1 ? shade : body;
  }, line);
}

/** Two posts on the rim holding a crank with a rope and bucket, under a tiled roof, like a house roof in the games. */
function wellFrame(cx, rim, hw) {
  const [wLit, wood, wDark, line] = S.wood, [rLit, roof, rDark, rLine] = S.roof, top = rim - 22;
  for (const x0 of [cx - hw, cx + hw - 1]) {
    outlined(x0, top, x0 + 1, rim, (x, y) => x >= x0 && x <= x0 + 1 && y >= top && y <= rim, (x) => (x === x0 ? wLit : wDark), line);
  }
  const axle = top + 6;
  outlined(cx - hw + 2, axle, cx + hw - 2, axle + 1, (x, y) => x >= cx - hw + 2 && x <= cx + hw - 2 && y >= axle && y <= axle + 1, (x, y) => (y === axle ? wLit : wood), line);
  outlined(cx + hw + 2, axle, cx + hw + 4, axle + 4, (x, y) => (y === axle && x >= cx + hw + 2 && x <= cx + hw + 3) || (x === cx + hw + 3 && y >= axle && y <= axle + 3), () => wDark, line);
  const [rope, ropeDark] = S.rope, bucketTop = rim - 9;
  for (let y = axle + 2; y < bucketTop; y++) { solid(cx, y, y % 2 ? rope : ropeDark); }
  pixelMap(cx - 3, bucketTop, [
    'k.....k',
    'kkkkkkk',
    'kaaabdk',
    'khhhhhk',
    '.kbbdk.',
    '..kkk..',
  ], { k: line, a: wLit, b: wood, d: wDark, h: S.hoop });
  const peak = top - 9, eave = top + 1, span = hw + 5;
  outlined(cx - span, peak, cx + span, eave, (x, y) => y >= peak && y <= eave && Math.abs(x - cx) <= 1 + (y - peak) * span / (eave - peak), (x, y) => {
    const e = Math.abs(x - cx), r = y - peak, left = x < cx;
    if (y === eave) return rDark;
    if (e <= 1 || r <= 1) return rLit;
    if (r % 3 === 2) return left ? roof : rDark;   // the rows of tiles
    if ((e + (Math.floor(r / 3) % 2) * 2) % 4 === 0) return left ? roof : rDark;
    return left ? rLit : roof;
  }, rLine);
  for (let x = cx - hw; x <= cx + hw; x++) tint(x, eave + 2, 0.75);   // the roof's shadow on the posts and axle
}

/** Coins glinting at the bottom; a toss arcs a coin (a Nugget for the big one) up from you and into the water with a
    splash and ripples, and a wish that comes true sends light and sparkles up out of the well. */
function drawWell(t) {
  const w = life.well, f = actFrame('toss'), [shine, gold, dark] = S.coin, foam = S.wellWater[0];
  for (const c of life.coins) { const s = Math.sin((t + c.phase) / 5); if (s > 0.5) put(c.x, c.y, s > 0.9 ? shine : gold); }
  if (f < 0) return;
  const { big, win } = life.act, tx = w.x + (big ? 3 : -3), ty = w.y, sx = w.x + (big ? 24 : -24), sy = H + 2;
  if (f < 7) {
    const k = f / 7, x = Math.round(sx + (tx - sx) * k), y = Math.round(sy + (ty - sy) * k - ((sy - ty) * 0.5 + 12) * 4 * k * (1 - k));
    put(x, y, shine); put(x + 1, y, gold); put(x, y + 1, gold); put(x + 1, y + 1, dark);
    if (big) { put(x + 2, y, gold); put(x + 2, y + 1, dark); put(x, y + 2, dark); put(x + 1, y + 2, dark); put(x - 1, y + 1, shine); }
  }
  if (f >= 7 && f < 10) for (const dx of [-2, -1, 1, 2]) put(tx + dx * (f - 6), ty - 3 - (9 - f) * 1.5 + Math.abs(dx), foam);
  if (f >= 7 && f < 15) {
    const rx = 1 + (f - 7) * (w.rx - 1) / 7, ry = Math.max(1, rx / 5);
    for (let a = 0; a < Math.PI * 2; a += 0.5 / rx) put(Math.round(tx + Math.cos(a) * rx), Math.round(ty + Math.sin(a) * ry), foam);
  }
  if (win && f >= 11) {
    const k = f - 11, reach = Math.min(40, k * 5), fade = f > 22 ? (26 - f) / 4 : 1;
    for (let y = ty - 1; y > ty - reach; y--) {
      const hw = w.rx - 2 + Math.round((ty - y) / 8);
      for (let x = w.x - hw; x <= w.x + hw; x++) if (dither(x, y) < 10 * fade * (1 - (ty - y) / 44)) blend(x, y, S.wish, 0.35);
    }
    for (let i = 0; i < 6; i++) {
      const y = ty - 2 - ((k * 2 + i * 7) % 36), x = w.x + Math.round(Math.sin(i * 2.1 + k / 3) * (w.rx - 2));
      if (fade > 0.3) sparkle(x, y, (k + i) % 2 ? shine : S.wish);
    }
  }
}

/* ---------- the Item Ball ---------- */

function itemBallScene() {
  const cx = W >> 1, cy = groundAt(0.4), [, , dark, deep] = S.tall;
  for (let y = -10; y <= 10; y++) for (let x = -25; x <= 25; x++) {   // the dark ground between the tufts
    const d = (x / 25) ** 2 + (y / 10) ** 2;
    if (d <= 1) solid(cx + x, cy + 1 + y, d > 0.7 && dither(x, y) < 8 ? deep : dark);
  }
  life.tufts = [];
  [12, 18, 21, 18, 12].forEach((hw, i) => {
    for (let x = -hw + (i % 2 ? 3 : 0); x <= hw; x += 6) life.tufts.push({ x: cx + x, y: cy + (i - 2) * 4 + 3 });
  });
  life.ball = { x: cx, y: cy + 3 };
  life.eventSpots = [{ x0: cx - 16, x1: cx + 16, y0: cy - 12, y1: cy + 11 }];
  life.foot = cy + 14;
  life.keep = [{ x0: cx - 27, x1: cx + 27, y0: cy - 12, y1: cy + 12 }];
}

// a tuft of the games' tall grass: three blades, the left one lit, over a shaded clump (outlined by tuft())
const TUFT = ['a..a..b', 'a.aab.b', 'aaabbbb', 'cabbbbc', '.ccccc.'];
const BALL = ['.kkkkk.', 'kRWRRRk', 'kRRRRDk', 'kkkWkkk', 'kWWWWGk', 'kWWWGGk', '.kkkkk.'];
const VOLTORB = ['.kkkkk.', 'kRRRRRk', 'kkWRWkk', 'kRRRRDk', 'kWWWWGk', 'kWWWGGk', '.kkkkk.'];

/** One tuft of tall grass, its bottom middle at x, y; its tips lean in the wind (a hidden Pokémon rustling it). */
function tuft(x, y, lean) {
  const [a, b, c, k] = S.tall, key = { a, b, c };
  const at = (i, r) => (r >= 0 && r < 5 && i >= 0 && i < 7 ? TUFT[r][i] : '.');
  for (let r = -1; r <= 5; r++) for (let i = -1; i <= 7; i++) {
    const ch = at(i, r), px = x - 3 + i + (r < 2 ? lean : 0), py = y - 4 + r;
    if (ch !== '.') put(px, py, key[ch]);
    else if (r < 5 && [at(i - 1, r), at(i + 1, r), at(i, r - 1), at(i, r + 1)].some(n => n !== '.')) put(px, py, k);
  }
}

/** The tall grass and the ball in it (it glints, and the grass round it rustles now and then). Picking it up wobbles it
    like a catch; then it either pops open in a burst of light, or it opens its eyes: a Voltorb, which flashes and explodes. */
function drawItemBall(t) {
  const f = actFrame('pickup'), trap = life.act?.trap, b = life.ball, [white, grey, red, dark, line] = S.ball;
  const boomAt = 11, gone = f >= (trap ? boomAt : 10);
  const rustle = f < 0 && t % 48 < 4 ? (t % 2 ? 1 : -1) : 0;
  const drawBall = () => {
    if (gone) return;
    const dx = f >= 0 && f < 6 ? [0, -1, 0, 1, 0, -1][f] : 0, lift = !trap && f >= 6 ? f - 5 : 0;
    const flash = trap && f >= 8 && f % 2 === 0;
    const key = flash ? { k: white, R: white, D: grey, W: white, G: grey } : { k: line, R: red, D: dark, W: white, G: grey };
    (trap && f >= 6 ? VOLTORB : BALL).forEach((row, r) => {
      for (let i = 0; i < 7; i++) if (row[i] !== '.') put(b.x - 3 + i + dx, b.y - 6 + r - (r < 4 ? lift : 0), key[row[i]]);
    });
    if (f < 0 && Math.sin(t / 7) > 0.93) sparkle(b.x - 2, b.y - 6, white);
  };
  let drawn = false;
  for (const p of life.tufts) {
    if (!drawn && p.y > b.y) { drawBall(); drawn = true; }
    tuft(p.x, p.y, Math.abs(p.x - b.x) < 8 && Math.abs(p.y - b.y) < 6 ? rustle : 0);
  }
  if (!drawn) drawBall();
  if (f < 0) return;

  if (!trap && f >= 6) {   // it pops open: a burst of light and sparkles
    const k = f - 6, [hot, gold] = S.boom;
    if (k < 5) for (let a = 0; a < 8; a++) for (let r = 2; r < 3 + k * 2; r++) put(b.x + Math.round(Math.cos(a * Math.PI / 4) * r), b.y - 4 + Math.round(Math.sin(a * Math.PI / 4) * r * 0.8), r > k * 2 ? gold : hot);
    for (let i = 0; i < 4 && k > 1; i++) sparkle(b.x + Math.round(Math.sin(i * 1.7 + k) * 6), b.y - 6 - k * 2 - i * 3, i % 2 ? hot : gold);
  }
  if (trap && f >= boomAt) {   // Self-Destruct: a white flash, a fireball, then smoke drifting up off a scorched patch
    const k = f - boomAt, [hot, yellow, orange, redBoom] = S.boom, [smoke, smokeDark] = S.smoke;
    for (let y = -4; y <= 3; y++) for (let x = -10; x <= 10; x++) if ((x / 10) ** 2 + (y / 3.5) ** 2 <= 1) tint(b.x + x, b.y + y, 0.55);
    const r = Math.min(13, 3 + k * 3), fade = Math.max(0, 1 - (k - 3) / 5);
    if (fade > 0) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y * 1.2) / r;
      if (d > 1 || dither(b.x + x, b.y + y) >= 16 * fade) continue;
      put(b.x + x, b.y - 3 + y, k < 2 ? hot : d < 0.35 ? yellow : d < 0.7 ? orange : redBoom);
    }
    for (let i = 0; i < 5 && k >= 3; i++) {
      const age = k - 3 - (i % 3), x = b.x + (i - 2) * 4 + Math.round(Math.sin(age / 2 + i) * 1.5), y = b.y - 4 - age * 2;
      if (age < 0 || age > 8) continue;
      const pr = 2 + (age >> 2);
      for (let oy = -pr; oy <= pr; oy++) for (let ox = -pr; ox <= pr; ox++) {
        if (ox * ox + oy * oy <= pr * pr && dither(x + ox, y + oy) < 16 - age * 1.6) put(x + ox, y + oy, oy > 0 ? smokeDark : smoke);
      }
    }
  }
}

/* ---------- Team Rocket ---------- */

function rocketScene() {
  const cx = W >> 1, foot = groundAt(0.42);
  barricade(cx - 12, foot - 2, 24);
  const trainer = { x: cx - 18, y: foot + 1 }, mon = { x: cx + 8, y: foot + 1 }, bush = { x: cx + 29, y: foot + 3 };
  groundShadow(trainer.x, trainer.y, 7, 1);
  groundShadow(mon.x, mon.y, 9, 2);
  groundShadow(bush.x + 1, bush.y, 9, 2);
  life.stands = { trainer, mon };
  life.bush = bush;
  life.eventSpots = [
    { x0: trainer.x - 8, x1: trainer.x + 8, y0: foot - 33, y1: foot + 1 },
    { x0: mon.x - 10, x1: mon.x + 10, y0: foot - 20, y1: foot + 2 },
    { x0: bush.x - 8, x1: bush.x + 8, y0: bush.y - 12, y1: bush.y + 1 },
  ];
  life.foot = bush.y + 5;
  life.keep = [{ x0: cx - 43, x1: bush.x + 9, y0: foot - 26, y1: bush.y + 3 }];
}

/** A roadblock of two planks striped in Team Rocket's black and red on wooden posts, with a big red R on a board. */
function barricade(cx, foot, hw) {
  const [black, blackDark, red, redDark, line] = S.plank, [wLit, wood, wDark, wLine] = S.wood;
  for (const x0 of [cx - hw, cx + hw - 1]) {
    outlined(x0, foot - 12, x0 + 1, foot, (x, y) => x >= x0 && x <= x0 + 1 && y >= foot - 12 && y <= foot, (x) => (x === x0 ? wLit : wDark), wLine);
  }
  for (const top of [foot - 10, foot - 5]) {
    outlined(cx - hw - 2, top, cx + hw + 2, top + 2, (x, y) => Math.abs(x - cx) <= hw + 2 && y >= top && y <= top + 2, (x, y) => {
      const stripe = Math.floor((x + y) / 3) % 2, lit = y === top;
      return stripe ? (lit ? red : redDark) : (lit ? black : blackDark);
    }, line);
  }
  const sx = cx - hw - 3, sy = foot - 24;   // the R board on a pole at the left end
  outlined(cx - hw, sy + 8, cx - hw + 1, foot - 12, (x, y) => x >= cx - hw && x <= cx - hw + 1 && y >= sy + 8 && y <= foot - 12, (x) => (x === cx - hw ? wLit : wDark), wLine);
  pixelMap(sx - 3, sy - 1, [
    'kkkkkkkkkk',
    'kbbbbbbbbk',
    'kbRRRRbbbk',
    'kbRRbbRRbk',
    'kbRRbbRRbk',
    'kbRRRRRbbk',
    'kbRRbRRbbk',
    'kbRRbbRRbk',
    'kbbbbbbbbk',
    'kkkkkkkkkk',
  ], { k: line, b: black, R: red });
}

/** The bush and the acts (the grunt's sprite hops or shakes by itself, figureDoes() in js/run.js): paying throws coins into
    the grunt's hand; running shakes the bush and throws leaves out of it. */
function drawRocket() {
  const pay = actFrame('pay'), flee = actFrame('run'), g = life.stands.trainer, bush = life.bush;
  const [lit, leaf, dark, bLine] = S.bush, rustle = flee >= 0 && flee < 8 ? (flee % 2 ? 1 : -1) : 0;
  const clumps = [[-4, -5, 4.5], [4, -5, 4.5], [0, -7, 5], [-5, -2, 4], [5, -2, 4], [0, -3, 5.5]];
  const inBush = (x, y) => clumps.some(([dx, dy, r]) => Math.hypot(x - bush.x - dx - rustle, (y - bush.y - dy) * 1.1) <= r);
  outlined(bush.x - 11, bush.y - 13, bush.x + 11, bush.y, inBush, (x, y) => {
    const v = (x - bush.x - rustle) / 9 + (y - bush.y + 6) / 6;
    return (x * 3 + y * 5) % 11 === 0 ? dark : v < -0.5 ? lit : v < 0.7 ? leaf : dark;
  }, bLine);
  if (flee >= 0) for (let i = 0; i < 6; i++) {   // leaves thrown out as you dive through
    const k = flee - (i >> 1);
    if (k < 0 || k > 8) continue;
    const dir = i % 2 ? 1 : -1, x = bush.x + dir * (3 + k * (1 + i % 3)), y = bush.y - 8 - k * 2 + Math.round(k * k * 0.35);
    put(x, y, i % 3 ? leaf : lit); put(x + dir, y, dark);
  }

  if (pay >= 0) {   // three coins arc up from you into his hand
    const [shine, gold, gDark] = S.coin, hx = g.x + 4, hy = g.y - 16;
    for (let i = 0; i < 3; i++) {
      const k = (pay - i * 2) / 6;
      if (k < 0 || k > 1) continue;
      const sx = (W >> 1) + (i - 1) * 6, sy = H + 2;
      const x = Math.round(sx + (hx - sx) * k), y = Math.round(sy + (hy - sy) * k - 14 * 4 * k * (1 - k));
      put(x, y, shine); put(x + 1, y, gold); put(x, y + 1, gold); put(x + 1, y + 1, gDark);
    }
    if (pay >= 8 && pay < 11) sparkle(hx + 1, hy - 3, S.coin[0]);
  }
}

/* ---------- the Shrine, close up: its own scene (PLACE_ART.altar), the shrine filling the screen ---------- */

/** The shrine's width `s` (as big as the screen allows), its middle and its foot, high enough to leave ~200 CSS px
    under it for the text box and Leave; everything else is measured from these. */
function shrineLayout() {
  return { s: Math.round(Math.min(W * 0.72, H * 0.54, 130)), cx: W >> 1, foot: Math.round(Math.min(H * 0.74, H - 200 * H / innerHeight)) };
}

/** Behind the shrine: a wall of leaves, old cedars in the mist or cut rock, and a fence along its foot. */
function shrineGrove() {
  const { s } = shrineLayout();
  if (S.raw.wall === 'rock') facetRock();
  else foliage();
  if (S.raw.wall === 'cedars') cedars(s);
  shrineFence(Math.max(6, Math.round(s * 0.16)), Math.max(5, Math.round(s * 0.09)));
}

/** Round clumps of leaves heaped on each other, lit on their top left, the lower ones in front, darker overhead. */
function foliage() {
  const G = 7, last = S.leaf.length - 1;
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {
    let best = null;
    const i0 = Math.floor(x / G), j0 = Math.floor(y / G);
    for (let j = j0 - 1; j <= j0 + 1; j++) for (let i = i0 - 1; i <= i0 + 1; i++) {
      const fx = (i + noise(i, j, 11)) * G, fy = (j + noise(i, j, 12)) * G, r = G * (0.75 + noise(i, j, 13) * 0.4);
      const dx = x + 0.5 - fx, dy = y + 0.5 - fy;
      if (dx * dx + dy * dy <= r * r && (!best || fy > best.fy)) best = { fy, r, dx, dy };
    }
    const shade = 1.4 * Math.pow(1 - y / horizon, 1.6) + dither(x, y) / 16;
    if (!best) { solid(x, y, S.leaf[last]); continue; }
    const { r, dx, dy } = best, lit = -(dx + dy) / r;
    if (dy > 0 && dx * dx + dy * dy > (r - 1.2) ** 2) { solid(x, y, S.leaf[last]); continue; }   // the clump's shadowed rim
    const level = (lit > 0.55 ? 0 : lit > 0.05 ? 1 : lit > -0.5 ? 2 : 3) + Math.floor(shade);
    solid(x, y, S.leaf[Math.min(last, level)]);
  }
}

/** Tall cedar trunks rising out of the leaves, the widest to one side roped off as a sacred tree, mist at their feet. */
function cedars(s) {
  const [lit, bark, dark, line] = S.bark, n = Math.max(3, Math.round(W / 20)), cx = W / 2;
  const trunks = Array.from({ length: n }, (_, i) => ({ x: Math.round((i + 0.15 + rand() * 0.7) * W / n), w: 4 + Math.floor(rand() * 5) }));
  for (const { x: x0, w } of trunks) for (let y = 0; y < horizon; y++) {
    const flare = Math.max(0, 3 - (horizon - y));   // the roots spreading at its foot
    for (let dx = -flare; dx < w + flare; dx++) {
      const x = x0 + dx, edge = dx === -flare || dx === w + flare - 1;
      const groove = !edge && dx > 1 && noise(x, y >> 2, 5) > 0.72;
      solid(x, y, edge ? line : dx <= 1 ? lit : groove || dx >= w * 0.6 ? dark : bark);
    }
  }
  const sacred = trunks.filter(t => Math.abs(t.x + t.w / 2 - cx) > s * 0.62).sort((a, b) => b.w - a.w)[0];
  if (sacred) {
    const y = Math.round(horizon * 0.62), [rope, twist, under] = S.rope;
    for (let x = sacred.x - 1; x <= sacred.x + sacred.w; x++) { solid(x, y, (x + y) % 3 ? rope : twist); solid(x, y + 1, (x + y + 1) % 3 ? twist : rope); solid(x, y + 2, under); }
    shide(sacred.x + (sacred.w >> 1) - 1, y + 3, 5);
  }
  const top = Math.round(horizon * 0.55), mist = S.mistColour;
  for (let y = top; y < horizon; y++) for (let x = 0; x < W; x++) {
    const k = (y - top) / (horizon - top), wave = Math.sin(x / 9 + y / 5) * 0.08;
    if (dither(x, y) < 16 * Math.min(1, k * 1.3 + wave)) blend(x, y, mist, 0.35 + k * 0.25);
  }
}

/** A shrine's fence (tamagaki) along the horizon: posts with pointed caps and two rails, the grove showing between. */
function shrineFence(h, gap) {
  const [lit, body, dark, line] = S.fence, top = horizon - h, low = horizon - Math.round(h * 0.45);
  for (const y of [top + 2, low]) for (let x = 0; x < W; x++) { solid(x, y, lit); solid(x, y + 1, dark); solid(x, y + 2, line); }
  for (let x0 = Math.floor((W / 2) % gap) - gap; x0 < W; x0 += gap) {
    for (let y = top; y < horizon; y++) {
      const cap = y === top;
      solid(x0 - 1, y, line); solid(x0 + 3, y, line);
      for (let k = 0; k < 3; k++) solid(x0 + k, y, cap ? (k === 1 ? lit : line) : k === 0 ? lit : k === 1 ? body : dark);
    }
    solid(x0 + 1, top - 1, line);
  }
}

/** The ground: gravel, and a path of flagstones from the shrine's steps out to you, widening as it comes closer. */
function shrineApproach() {
  const { s, cx, foot } = shrineLayout(), [light, , , deep] = S.ground;
  bands(horizon, H, S.ground, 1);
  for (let n = 0, count = Math.round(W * (H - horizon) / 5); n < count; n++) {
    const x = Math.floor(rand() * W), y = horizon + 1 + Math.floor(rand() * (H - horizon));
    put(x, y, rand() < 0.5 ? light : deep);
    if (depthOf(y) > 0.5 && rand() < 0.5) put(x + 1, y, deep);
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.72); tint(x, horizon + 1, 0.86); }   // the fence's shadow

  const [lit, stone, shade, line] = S.altarStone, half = (y) => s * 0.3 + (y - foot) * 0.45;
  for (let y0 = foot - Math.round(s * 0.2), rh = 3, row = 0; y0 < H; y0 += rh, rh++, row++) {
    const w = rh * 2 + 3, off = row % 2 ? w >> 1 : 0;
    for (let y = y0; y < y0 + rh && y < H; y++) {
      const hw = half(y);
      for (let x = Math.ceil(cx - hw); x <= cx + hw; x++) {
        const edge = Math.abs(x + 0.5 - cx) > hw - 1, joint = (x - Math.round(cx) + off + w * 8) % w === 0;
        let c = y === y0 + rh - 1 || joint || edge ? line : y === y0 ? lit : dither(x, y) < 3 ? shade : stone;
        if (c === line && y > y0 && noise(x, y, 9) > 0.45) {   // what grows in, or glows in, the gaps
          if (S.moss) c = S.moss[(x + y) & 1];
          else if (S.vein && noise(x >> 1, y0, 8) > 0.55) c = S.vein[(x + y) & 1];
        }
        put(x, y, c);
      }
    }
  }
}

function altarScene() {
  const { s, cx, foot } = shrineLayout(), L = Math.round(s * 0.62);
  life.lamps = [];
  if (W > s * 2.4) {   // wide screens see a second pair of lanterns further back
    const far = Math.round(s * 0.98), l = Math.round(L * 0.72);
    for (const x of [cx - far, cx + far]) { groundShadow(x + 1, foot - 3, Math.round(l * 0.3), 2); stoneLantern(x, foot - 3, l); }
  }
  groundShadow(cx, foot + 2, Math.round(s * 0.55), Math.max(2, Math.round(s * 0.05)));
  const { top, orbY } = shrine(cx, foot, s);
  life.orb = { x: cx, y: orbY, k: s / 30 };
  const near = Math.round(s * 0.63);
  for (const x of [cx - near, cx + near]) { groundShadow(x + 2, foot + 8, Math.round(L * 0.32), 2); stoneLantern(x, foot + 8, L); }
  const bw = Math.round(s * 0.34);
  life.eventSpots = [{ x0: cx - bw, x1: cx + bw, y0: top, y1: foot }];
  life.foot = foot + 4;
}

/** A stone lantern (tōrō): a finial, a curled roof, the firebox (its window lit with your type's glow, flickering in
    drawAltar), a platform, the post and a wide foot. `L` is its height. */
function stoneLantern(cx, foot, L) {
  const [lit, stone, shade, line] = S.altarStone, top = foot - L;
  const parts = [[0.08, 0.06], [0.24, 0.34], [0.44, 0.18], [0.5, 0.27], [0.84, 0.09], [0.9, 0.17], [1.01, 0.24]];
  const at = (y) => { const t = (y - top) / L; const i = parts.findIndex(([end]) => t < end); return i < 0 ? null : { i, t }; };
  const halfAt = (y) => {
    const p = at(y);
    if (!p) return -1;
    if (p.i === 1) return L * (0.1 + (p.t - 0.08) / 0.16 * 0.24);   // the roof spreading to its eaves
    return Math.max(1, L * parts[p.i][1]);
  };
  const win = { x0: Math.round(cx - L * 0.09), x1: Math.round(cx + L * 0.09), y0: Math.round(top + L * 0.28), y1: Math.round(top + L * 0.4) };
  outlined(cx - L * 0.4, top, cx + L * 0.4, foot, (x, y) => y >= top && y <= foot && Math.abs(x + 0.5 - cx) <= halfAt(y) + 0.5, (x, y) => {
    if (x >= win.x0 && x <= win.x1 && y >= win.y0 && y <= win.y1) return S.glow[1];
    const p = at(y), k = (x + 0.5 - cx) / Math.max(1, halfAt(y));
    if (p.i !== at(y - 1)?.i) return lit;   // the top of each part catches the light
    if (p.i !== at(y + 1)?.i) return shade;
    return k < -0.45 ? lit : k > 0.4 ? shade : stone;
  }, line);
  life.lamps.push(win);
}

/** A zigzag paper streamer (shide) hanging from a rope. */
function shide(x, y, len) {
  for (let k = 0; k < len; k++) {
    const o = (k >> 1) % 2;
    solid(x + o, y + k, S.paper);
    solid(x + o + 1, y + k, S.paper);
    tint(x + o + 1, y + k, 0.82);
  }
}

/** The shrine (like Ilex Forest's, close up) on three stone steps: plank walls between pillars, open doors on a dark
    inside where your type's power glows (drawAltar) under a lattice, a thick straw rope with paper streamers and a bell,
    a roof flaring to upturned eaves with crossed finials (chigi) and billets on its ridge, an offering box in front.
    Returns its top (the finials' tips) and where the glow sits. */
function shrine(cx, foot, s) {
  const [sLit, stone, sShade, sLine] = S.altarStone, [wLit, wood, wDark, wLine] = S.wood, [rLit, roof, rDark, rLine] = S.roof;
  const u = (k) => Math.max(1, Math.round(s * k));
  const block = (x0, x1, y0, y1, colourAt, line) => outlined(x0, y0, x1, y1, (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1, colourAt, line);

  // three stone steps, each a lit tread over its riser
  const stepH = Math.max(3, u(0.05));
  for (let i = 0; i < 3; i++) {
    const hw = u(0.5 - i * 0.075), y1 = foot - i * stepH, y0 = y1 - stepH + 1;
    for (let y = y0; y <= y1; y++) for (let x = cx - hw; x <= cx + hw; x++) {
      const side = Math.abs(x - cx) === hw;
      solid(x, y, y === y1 || side ? sLine : y === y0 ? sLit : (x - cx + 50 + i * 3) % 9 === 0 ? sShade : dither(x, y) < 2 ? sShade : stone);
    }
  }
  const baseTop = foot - 3 * stepH, bw = u(0.34), eave = baseTop - u(0.42), deck = baseTop - Math.max(2, u(0.04));

  // the walls, the veranda, the pillars
  block(cx - bw, cx + bw, eave + 1, deck - 1, (x) => {
    const e = x - cx;
    if ((e + 200) % 4 === 0) return wDark;
    return e < -bw * 0.5 ? wLit : e > bw * 0.5 ? wDark : wood;
  }, wLine);
  block(cx - bw - 2, cx + bw + 2, deck, baseTop, (x, y) => (y === deck ? wLit : (x - cx + 200) % 5 === 0 ? wLine : wDark), wLine);
  for (const side of [-1, 1]) block(cx + side * bw - 1, cx + side * bw + 1, eave + 1, deck - 1, (x) => (x === cx + side * bw - 1 ? wLit : x === cx + side * bw ? wood : wDark), wLine);

  // the doorway: the doors folded back, a lattice over a dark inside
  const dw = u(0.2), doorTop = eave + u(0.08), lattice = doorTop + Math.max(3, u(0.09));
  block(cx - dw, cx + dw, doorTop, deck - 1, (x, y) => {
    if (y < lattice) return (x - cx + 200) % 2 ? S.inside : wood;
    if (y === lattice) return wDark;
    return S.inside;
  }, wLine);
  for (const side of [-1, 1]) block(cx + side * (dw + 2), cx + side * (dw + 3), doorTop, deck - 1, (x, y) => ((y - doorTop) % 3 === 0 ? wLine : wDark), wLine);

  // the head beam, and the rafter ends under the eave
  const rw = u(0.56);
  block(cx - bw - 3, cx + bw + 3, eave + 2, eave + 3, (x, y) => (y === eave + 2 ? wLit : wood), wLine);
  for (let x = cx - rw + 3; x <= cx + rw - 3; x++) solid(x, eave + 1, (x - cx + 200) % 2 ? wLine : wLit);

  // the roof, flaring out to upturned eaves
  const roofTop = eave - u(0.34), tip = Math.max(2, u(0.06)), neck = u(0.13);
  const half = (y) => {
    const r = (y - roofTop) / (eave - roofTop);
    return neck + (rw - tip - neck) * Math.pow(r, 1.5) + (y >= eave - tip ? (eave - y) * 1.5 + 1 : 0);
  };
  outlined(cx - rw - tip * 2, roofTop, cx + rw + tip * 2, eave, (x, y) => y >= roofTop && y <= eave && Math.abs(x + 0.5 - cx) <= half(y), (x, y) => {
    const e = x - cx;
    if (y === eave) return rDark;
    if (y === eave - 1) return (e + 200) % 2 ? rLit : rDark;   // the ends of the tiles
    if (y === roofTop || Math.abs(e) <= 1) return rLit;
    if ((Math.abs(e) + 1) % 3 === 0) return e < 0 ? roof : rDark;   // the rows of tiles running down it
    return e < 0 ? rLit : roof;
  }, rLine);

  // the ridge, its billets (katsuogi) and crossed finials (chigi)
  const ridge = neck + 2, rTop = roofTop - Math.max(2, u(0.04));
  block(cx - ridge, cx + ridge, rTop, roofTop - 1, (x, y) => (y === rTop ? rLit : rDark), rLine);
  const [gold, goldBody] = S.bell;
  for (const k of [-1, 0, 1]) {
    const bx = cx + Math.round(k * ridge * 0.6), hw = Math.max(1, u(0.03));
    block(bx - hw, bx + hw, rTop - 2, rTop - 1, (x) => (Math.abs(x - bx) === hw ? goldBody : x < bx ? wLit : wood), wLine);
  }
  const len = Math.max(2, u(0.075));
  for (const side of [-1, 1]) {
    const ex = cx + side * ridge;
    outlined(ex - len - 1, rTop - len, ex + len + 1, rTop, (x, y) => y >= rTop - len && y <= rTop && Math.abs(Math.abs(x + 0.5 - ex) - (rTop - y)) <= 0.6, (x) => ((x - ex) * side > 0 ? wood : wLit), wLine);
  }

  // the straw rope sagging across the front, with streamers and tassels, the bell hanging from its middle
  const [rope, twist, under] = S.rope, th = Math.max(2, u(0.05)), sag = Math.max(1, u(0.04)), ropeY = eave + 4;
  const ropeAt = (x) => ropeY + Math.round(sag * (1 - ((x - cx) / (bw + 2)) ** 2));
  for (let x = cx - bw - 2; x <= cx + bw + 2; x++) {
    const y = ropeAt(x);
    for (let k = 0; k < th; k++) solid(x, y + k, (x + k * 2 + 200) % 4 < 2 ? rope : twist);
    solid(x, y + th, under);
  }
  for (const k of [-0.75, -0.25, 0.25, 0.75]) {
    const x = cx + Math.round(k * bw);
    for (let d = 1; d <= Math.max(2, u(0.05)); d++) { solid(x, ropeAt(x) + th + d, twist); solid(x + 1, ropeAt(x) + th + d, under); }
  }
  for (const k of [-0.5, 0.5]) { const x = cx + Math.round(k * bw); shide(x, ropeAt(x) + th + 1, Math.max(4, u(0.16))); }

  const br = Math.max(2, u(0.055)), by = ropeAt(cx) + th + br + 1, [shine, , dim, deep] = S.bell;
  for (let y = -br; y <= br; y++) for (let x = -br; x <= br; x++) {
    const d = Math.hypot(x, y);
    if (d <= br + 0.3) solid(cx + x, by + y, d > br - 0.7 ? deep : x + y < -br * 0.5 ? shine : y === Math.round(br * 0.4) ? deep : x + y > br * 0.4 ? dim : gold);
  }
  const box = { hw: u(0.22), h: Math.max(4, u(0.13)) }, boxTop = foot - box.h + 2;
  life.cord = [];
  const [red, white, redDark] = S.cord;
  for (let y = by + br + 1; y < boxTop - 2; y++) {
    const c = (y >> 1) % 2 ? red : white;
    life.cord.push([cx, y, c], [cx + 1, y, (y >> 1) % 2 ? redDark : white]);
  }
  for (const [x, y, c] of life.cord) solid(x, y, c);

  // the offering box: a slatted top over a panelled front with a gold plate
  block(cx - box.hw, cx + box.hw, boxTop, foot + 2, (x, y) => {
    if (y <= boxTop + 1) return (x - cx + 200) % 2 ? wLine : wLit;
    if (y === boxTop + 2) return wDark;
    if (Math.abs(x - cx) <= 2 && y >= boxTop + 4 && y <= boxTop + 5) return y === boxTop + 4 ? gold : dim;
    return Math.abs(x - cx) >= box.hw - 1 || y === foot + 2 ? wDark : x < cx ? wLit : wood;
  }, wLine);

  return { top: rTop - len, orbY: Math.round((lattice + deck) / 2) };
}

/** Your type's glow in the shrine, pulsing, with motes drifting up, and the lanterns flickering in its colour. Praying
    draws your HP up into it as red motes; it flares and throws rays across the shrine, then a spark rises out of the
    roof (the relic). Everything is measured in `k`, the shrine's size. */
function drawAltar(t) {
  const o = life.orb, k = o.k, f = actFrame('pray'), [core, glow, deep] = S.glow;
  for (const w of life.lamps) for (let y = w.y0; y <= w.y1; y++) for (let x = w.x0; x <= w.x1; x++) {
    const flick = 6 + Math.round(4 * Math.sin(t / 2 + w.x0) + 3 * Math.sin(t / 5.3));
    if (dither(x, y + (t >> 1)) < flick) put(x, y, core);
  }
  const flare = f >= 8 && f < 14 ? Math.sin((f - 8) / 6 * Math.PI) : 0;
  const r = (2.5 + Math.sin(t / 4) * 0.6) * k + flare * 6 * k;
  for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) {
    const d = Math.hypot(x, y) / r;
    if (d <= 1 && dither(o.x + x, o.y + y) < 16 * (1.1 - d)) put(o.x + x, o.y + y, d < 0.45 ? core : d < 0.75 ? glow : deep);
  }
  sparkle(o.x, o.y, core);
  for (let i = 0; i < 5; i++) {
    const age = (t + i * 7) % 27, x = o.x + Math.round((((i * 5 + (t / 27 | 0)) % 7) - 3) * k);
    if (age < 12) put(x, o.y + Math.round((3 - age) * k), age < 6 ? glow : deep);
  }
  for (const [x, y, c] of life.cord) put(x, y, c);   // the bell's cord hangs in front of the glow
  if (f < 0) return;
  const [pale, pink] = S.hp;
  for (let i = 0; i < 5; i++) {   // your offering, rising from you as HP-red motes
    const p = (f - i) / 6;
    if (p < 0 || p > 1) continue;
    const sx = o.x + (i - 2) * 9 * k, sy = H + 1;
    const x = Math.round(sx + (o.x - sx) * p + Math.sin(p * 6 + i) * 2 * k), y = Math.round(sy + (o.y - sy) * p);
    put(x, y, pale); put(x + 1, y, pink); put(x, y + 1, pink); put(x - 1, y, pink);
    if (k > 1.5) { put(x, y - 1, pink); put(x + 1, y + 1, pink); }
  }
  if (flare > 0.3) for (let a = 0; a < 8; a++) {
    const ang = a * Math.PI / 4 + 0.39, len = (6 + flare * 12) * k;
    for (let s = 4 * k; s < len; s++) if (dither(a, Math.round(s)) < 12) put(o.x + Math.round(Math.cos(ang) * s), o.y + Math.round(Math.sin(ang) * s * 0.8), s < len * 0.5 ? core : glow);
  }
  if (f >= 12) {
    const n = f - 12, y = o.y - 4 * k - n * 4 * k;
    sparkle(o.x, y, n % 2 ? core : glow);
    if (k > 1.5) { put(o.x - 2, y, glow); put(o.x + 2, y, glow); put(o.x, y - 2, glow); put(o.x, y + 2, glow); }
    if (n > 1) { put(o.x - 2, y + 3 * k, glow); put(o.x + 2, y + 5 * k, glow); }
  }
}

/* ---------- indoor ? events: the Move Tutor's dojo, the Move Deleter's study, the Fan Club; and the Day Care's yard.
   Each its own close-up scene (PLACE_ART), like the Shrine: props sized to the screen, standing on a floor line high
   enough to leave ~200 CSS px under them for the text box and Leave. ---------- */

/** The room's floor line (where the props stand), its middle, a size `s` to measure the props by, and `ceil`, the top
    of the wall that shows under the screen's title and HP window (wall props hang below it). */
function roomLayout() {
  const foot = Math.round(Math.min(H * 0.8, H - 190 * H / innerHeight));
  return { cx: W >> 1, foot, s: Math.round(Math.min(W * 0.9, foot * 0.9, 150)), ceil: Math.round(Math.min(horizon * 0.55, 225 * H / innerHeight)) };
}
const railRow = () => horizon - Math.max(6, Math.round(horizon * 0.2));

/** A room's back wall down to the floor line: plaster (or striped paper) under a ceiling beam, timber posts where the
    room has them, and a wooden wainscot. Returns the rail's row. */
function roomWall({ posts = 0, stripes = 0 } = {}) {
  const [face, low, seam, shine] = S.wall, [wLit, wood, wDark, wLine] = S.trim, cx = W >> 1;
  const rail = railRow(), beam = Math.max(3, Math.round(horizon * 0.05));
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {
    let c;
    if (y < beam) c = y === beam - 1 ? wLine : y === 0 ? wLit : wood;
    else if (y >= rail) c = y === rail ? wLit : y === rail + 1 || y === horizon - 1 ? wLine : ((x - cx + 400) % 9 === 0 ? wDark : wood);
    else if (stripes) {
      const band = Math.floor((x - cx + 400) / stripes) % 2;
      c = band ? (dither(x, y) < 3 ? seam : low) : face;
    } else {
      const shade = Math.pow(1 - (y - beam) / (rail - beam), 2) * 12;
      c = dither(x, y) < shade ? low : face;
    }
    solid(x, y, c);
  }
  if (!stripes) for (let x = 0; x < W; x++) solid(x, beam, shine);
  if (posts) for (let x0 = ((cx + posts / 2) % posts) - posts; x0 < W; x0 += posts) {
    for (let y = beam; y < rail; y++) { solid(x0 - 1, y, wLine); solid(x0, y, wLit); solid(x0 + 1, y, wood); solid(x0 + 2, y, wDark); solid(x0 + 3, y, wLine); }
  }
  return rail;
}

/** Floorboards running away from you, their joints staggered, darkening to the wall. */
function plankFloor() {
  const [lit, body, dark, line] = S.plank, cx = W / 2, vy = horizon - (H - horizon) * 1.8;
  const bottom = H - vy, ku = bottom / 9, kv = bottom * bottom / 5;
  for (let y = horizon; y < H; y++) {
    const dz = y - vy, v = Math.floor(kv / dz), rowEdge = v !== Math.floor(kv / (dz + 1));
    for (let x = 0; x < W; x++) {
      const u = (x - cx) * ku / dz, board = Math.floor(u), seam = u - board < ku / dz;
      const joint = rowEdge && (board + v * 2 + 99) % 3 === 0;
      const tone = noise(board, Math.floor(v / 3), 6);
      put(x, y, seam || joint ? line : tone < 0.3 ? lit : tone > 0.75 ? dark : body);
    }
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.7); tint(x, horizon + 1, 0.85); }
}

/** A window onto the biome outside (sky, hills, the volcano in the Wastes) in a wooden frame with a cross bar. */
function roomWindow(cx, top, hw, hh) {
  const [sky, glow, hill, far] = S.view, [wLit, wood, , wLine] = S.trim;
  for (let y = top; y <= top + hh; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    const k = (y - top) / hh, ridgeY = top + hh * (0.62 + 0.12 * Math.sin((x - cx) / 4.5)), peak = S.raw.volcano && Math.abs(x - cx - hw * 0.3) < (y - top - hh * 0.3) * 0.9;
    solid(x, y, peak || y > ridgeY + 3 ? hill : y > ridgeY ? far : k > 0.45 && dither(x, y) < 8 ? glow : sky);
  }
  for (let y = top - 1; y <= top + hh + 1; y++) { solid(cx - hw - 1, y, wLine); solid(cx + hw + 1, y, wLine); solid(cx, y, wood); }
  for (let x = cx - hw - 2; x <= cx + hw + 2; x++) { solid(x, top - 2, wLine); solid(x, top - 1, wLit); solid(x, top + (hh >> 1), wood); solid(x, top + hh + 1, wLit); solid(x, top + hh + 2, wLine); }
}

/* ----- the Move Tutor's dojo: Alder sits on a straw mat before a chalkboard of moves (pay ₽), and a sandbag hangs
   from a beam (pay HP) ----- */

function tutorScene() {
  const { cx, foot, s, ceil } = roomLayout(), u = (k) => Math.max(1, Math.round(s * k));
  const board = { x0: cx - u(0.46), x1: cx + u(0.1), y0: ceil + 3, y1: Math.min(railRow() - 3, ceil + 3 + u(0.32)) };
  chalkboard(board);
  const seat = { x: Math.round((board.x0 + board.x1) / 2), y: foot - 1 };
  mat(seat.x, seat.y, 22);
  const bag = { x: cx + u(0.32), top: ceil, w: Math.max(5, u(0.09)), h: u(0.38) };
  bag.len = foot - u(0.05) - bag.h - bag.top;
  const [wLit, wood, wDark, wLine] = S.trim;   // the beam it hangs from, across the ceiling
  for (let x = bag.x - u(0.16); x <= bag.x + u(0.16); x++) { solid(x, bag.top - 2, wLine); solid(x, bag.top - 1, wLit); solid(x, bag.top, wood); solid(x, bag.top + 1, wDark); solid(x, bag.top + 2, wLine); }
  groundShadow(bag.x, foot - u(0.02), bag.w + 2, 2);
  if (W > s * 1.5) roomWindow(cx + u(0.9), ceil + 3, u(0.14), Math.min(u(0.2), railRow() - ceil - 8));
  life.board = board;
  life.bag = bag;
  // Alder (62x66, drawn at half the scene's pixel size) sits cross-legged in the middle of the mat; the lesson's sign is
  // on the board, the training's on the sandbag, and the Challenge's on him
  life.stands = { npc: { x: seat.x, y: seat.y + 2 } };
  life.eventSpots = [
    board,
    { x0: bag.x - bag.w - 4, x1: bag.x + bag.w + 4, y0: bag.top + bag.len - 4, y1: bag.top + bag.len + bag.h },
    { x0: seat.x - 16, x1: seat.x + 16, y0: seat.y + 2 - 33, y1: seat.y + 2 },
  ];
  life.foot = foot + 4;
}

/** A green chalkboard in a wooden frame, chalked with a lesson: a Poké Ball, arrows between moves, lines of notes. */
function chalkboard({ x0, x1, y0, y1 }) {
  const [green, dark] = S.board, chalk = S.chalk, [wLit, wood, , wLine] = S.trim;
  for (let y = y0 - 2; y <= y1 + 2; y++) for (let x = x0 - 2; x <= x1 + 2; x++) {
    const frame = x < x0 || x > x1 || y < y0 || y > y1, edge = x === x0 - 2 || x === x1 + 2 || y === y0 - 2 || y === y1 + 2;
    solid(x, y, edge ? wLine : frame ? (y < y0 ? wLit : wood) : dither(x, y) < 3 ? dark : green);
  }
  for (let x = x0 + 2; x < x1 - 1; x += 3) solid(x, y1 - 1, chalk);   // chalk dust along the ledge
  const bw = x1 - x0, bh = y1 - y0, r = Math.max(3, Math.round(Math.min(bw, bh) * 0.18)), bx = x0 + r + 3, by = y0 + r + 3;
  for (let a = 0; a < Math.PI * 2; a += 0.35 / r) put(bx + Math.round(Math.cos(a) * r), by + Math.round(Math.sin(a) * r), chalk);
  for (let x = -r; x <= r; x++) put(bx + x, by, chalk);
  put(bx, by, green); put(bx - 1, by, chalk); put(bx + 1, by, chalk);
  const ax = bx + r + 3, ay = by;   // an arrow to the notes
  for (let x = 0; x < Math.max(3, bw * 0.15); x++) put(ax + x, ay, chalk);
  const tip = ax + Math.round(Math.max(3, bw * 0.15));
  put(tip - 1, ay - 1, chalk); put(tip - 1, ay + 1, chalk);
  for (let row = 0; row < 3; row++) {
    const y = y0 + 3 + row * Math.max(3, Math.round(bh * 0.18));
    for (let x = tip + 3; x < x1 - 3; x++) if (noise(x >> 1, row, 3) > 0.25) put(x, y, chalk);
  }
  for (let row = 0; row < 2; row++) {
    const y = by + r + 3 + row * 3;
    if (y < y1 - 2) for (let x = x0 + 3; x < x1 - 4; x++) if (noise(x >> 1, row + 5, 3) > 0.3) put(x, y, chalk);
  }
}

/** A thin straw mat (tatami) on the floor. */
function mat(cx, foot, hw) {
  const [straw, strawDark, border] = S.tatami, hh = Math.max(2, Math.round(hw * 0.2));
  for (let y = foot - hh; y <= foot + hh; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    const edge = Math.abs(y - foot) === hh || Math.abs(x - cx) >= hw - 1;
    put(x, y, edge ? border : (x + y) % 3 ? straw : strawDark);
  }
}

/** The sandbag swings on its rope (hard while you train, knocking out dust and stars), and chalk writes itself on the
    board during a lesson. */
function drawTutor(t) {
  const b = life.bag, f = actFrame('train'), [canvas, shade, dark, line] = S.bag;
  const hit = f >= 0 && f < 18 ? [2, 6, 10].some(k => f >= k && f < k + 3) : false;
  const swing = f >= 0 ? Math.sin(f * 0.9) * Math.max(0, 1 - f / 22) * 0.5 : Math.sin(t / 9) * 0.05;
  const topX = b.x, topY = b.top + 1;
  const endX = topX + Math.sin(swing) * b.len, endY = topY + Math.cos(swing) * b.len;
  for (let k = 0; k <= b.len; k++) put(Math.round(topX + (endX - topX) * k / b.len), Math.round(topY + (endY - topY) * k / b.len), S.rope[1]);
  for (let y = 0; y < b.h; y++) {
    const cy = endY + y * Math.cos(swing), cxx = endX + y * Math.sin(swing);
    const half = y < 2 || y > b.h - 3 ? b.w - 1 : b.w;
    for (let x = -half; x <= half; x++) {
      const edge = Math.abs(x) === half || y === 0 || y === b.h - 1, band = y === Math.round(b.h * 0.2) || y === Math.round(b.h * 0.8);
      put(cxx + x, cy, edge ? line : band ? dark : x < -half * 0.3 ? canvas : x > half * 0.5 ? dark : shade);
    }
  }
  if (hit) {
    const hx = Math.round(endX - b.w - 2), hy = Math.round(endY + b.h * 0.45);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + f; put(hx + Math.round(Math.cos(a) * 3), hy + Math.round(Math.sin(a) * 3), S.chalk); }
    sparkle(hx, hy, S.coin[0]);
  }
  const l = actFrame('lesson'), bd = life.board;
  if (l >= 0) {
    const n = Math.min(l * 6, (bd.x1 - bd.x0 - 8) * 2);
    for (let i = 0; i < n; i++) put(bd.x0 + 4 + (i >> 1), bd.y1 - 4 - Math.round(Math.sin(i / 3) * 1.5), S.chalk);
    const tipX = bd.x0 + 4 + (n >> 1), tipY = bd.y1 - 4 - Math.round(Math.sin(n / 3) * 1.5);
    sparkle(tipX, tipY - 1, S.coin[0]);
  }
}

/* ----- the Move Deleter's study: a lectern with a big old book (forget one), a hypnotist's pendulum (forget two) ----- */

function deleterScene() {
  const { cx, foot, s, ceil } = roomLayout(), u = (k) => Math.max(1, Math.round(s * k));
  life.candles = [];
  const shelfTop = Math.round(horizon * 0.14), win = Math.min(u(0.16), railRow() - ceil - 8);
  bookcase(cx - u(0.5), shelfTop, u(0.26), horizon - shelfTop - 1);
  if (W > s * 1.4) { bookcase(cx + u(0.72), shelfTop, u(0.22), horizon - shelfTop - 1); roomWindow(cx + u(0.18), ceil + 3, u(0.1), win); }
  else roomWindow(cx + u(0.28), ceil + 3, u(0.1), win);
  const lec = { x: cx - u(0.22), top: foot - u(0.36) };
  lectern(lec.x, foot, lec.top, u(0.2));
  const pend = { x: cx + u(0.26), top: foot - u(0.5), len: u(0.34) };
  pendulumStand(pend.x, foot, pend.top, u(0.12));
  life.book = { x: lec.x, y: lec.top - 2, w: Math.round(u(0.2) * 0.9) };
  life.pendulum = pend;
  life.stands = { npc: { x: cx - u(0.03), y: foot - u(0.03) }, mon: { x: cx + u(0.02), y: foot + u(0.06) } };
  life.eventSpots = [
    { x0: lec.x - u(0.18), x1: lec.x + u(0.18), y0: lec.top - u(0.1), y1: foot },
    { x0: pend.x - u(0.12), x1: pend.x + u(0.12), y0: pend.top, y1: foot },
  ];
  life.foot = foot + 4;
}

/** A wall of old books: dark shelves stacked with spines of every colour, some leaning. */
function bookcase(cx, top, hw, h) {
  const [wLit, wood, wDark, wLine] = S.trim, shelf = 9;
  for (let y = top; y < top + h; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    const side = Math.abs(x - cx) >= hw - 1, board = (y - top) % shelf === 0 || y === top + h - 1;
    if (side || board) { solid(x, y, x === cx - hw || y === top ? wLine : board ? wLit : wood); continue; }
    const row = Math.floor((y - top) / shelf), book = Math.floor((x - cx + hw) / 2 + noise(row, 1, 2) * 3);
    const tall = 4 + Math.floor(noise(book, row, 3) * 4), gap = noise(book, row, 5) > 0.88;
    const fromShelf = shelf - ((y - top) % shelf);
    solid(x, y, gap || fromShelf > tall ? wDark : (x - cx + hw) % 2 === 0 ? wLine : S.books[Math.floor(noise(book, row, 4) * S.books.length)]);
  }
}

/** A carved wooden lectern holding a big open book, a candle on each side. */
function lectern(cx, foot, top, hw) {
  const [wLit, wood, wDark, wLine] = S.trim, [page, pageShade, ink] = S.page;
  for (let y = top + 3; y <= foot; y++) {
    const w = y > foot - 3 ? Math.round(hw * 0.6) : Math.max(2, Math.round(hw * 0.18));
    for (let x = -w; x <= w; x++) solid(cx + x, y, Math.abs(x) === w || y === foot ? wLine : x < 0 ? wLit : wDark);
  }
  outlined(cx - hw, top, cx + hw, top + 3, (x, y) => y >= top && y <= top + 3 && Math.abs(x + 0.5 - cx) <= hw - (top + 3 - y) * 0.5, (x, y) => (y === top ? wLit : wood), wLine);
  const bw = Math.round(hw * 0.9), by = top - 2;   // the open book, its pages curling up from the spine
  for (let x = -bw; x <= bw; x++) {
    const curl = Math.round(Math.abs(x) / bw * 2);
    for (let y = by - 4 + curl; y <= by; y++) solid(cx + x, y, x === 0 ? pageShade : y === by - 4 + curl ? wLine : page);
    solid(cx + x, by + 1, wLine);
  }
  for (let x = -bw + 2; x <= bw - 2; x++) if (Math.abs(x) > 1 && noise(x, 2, 7) > 0.35) { solid(cx + x, by - 2, ink); if (noise(x, 3, 7) > 0.4) solid(cx + x, by - 1, ink); }
  groundShadow(cx, foot + 1, hw, 2);
  for (const side of [-1, 1]) candle(cx + side * (hw + 3), top + 2);
}

function candle(x, foot) {
  const [wax, waxShade] = S.wax;
  for (let y = foot - 5; y <= foot; y++) { solid(x, y, wax); solid(x + 1, y, waxShade); }
  solid(x - 1, foot + 1, S.trim[3]); solid(x, foot + 1, S.trim[3]); solid(x + 1, foot + 1, S.trim[3]); solid(x + 2, foot + 1, S.trim[3]);
  life.candles.push({ x, y: foot - 6 });
}

/** A tall stand with an arm, the pendulum's string tied at its end (the page's pendulum swings in drawDeleter). */
function pendulumStand(cx, foot, top, hw) {
  const [wLit, wood, wDark, wLine] = S.trim;
  for (let y = top; y <= foot; y++) { solid(cx + hw - 1, y, wLine); solid(cx + hw, y, wLit); solid(cx + hw + 1, y, wDark); solid(cx + hw + 2, y, wLine); }
  for (let x = cx - 1; x <= cx + hw + 2; x++) { solid(x, top - 1, wLine); solid(x, top, wood); solid(x, top + 1, wLine); }
  for (let x = cx + hw - 4; x <= cx + hw + 6; x++) { solid(x, foot, wLine); solid(x, foot - 1, wDark); }
  groundShadow(cx + hw, foot + 1, 6, 1);
}

/** Candles flicker; the pendulum sways (and swings wide, throwing out rings, while it hypnotises); the book's words
    fade letter by letter as a move is forgotten. */
function drawDeleter(t) {
  for (const c of life.candles) {
    const f = Math.sin(t / 1.7 + c.x) + Math.sin(t / 3.1);
    put(c.x, c.y, S.flame[0]); put(c.x, c.y - 1, f > -0.5 ? S.flame[1] : S.flame[0]); if (f > 0.4) put(c.x, c.y - 2, S.flame[1]);
    for (let y = -4; y <= 3; y++) for (let x = -4; x <= 4; x++) if ((x || y) && x * x + y * y <= 14 + f * 3 && dither(c.x + x, c.y + y) < 3) blend(c.x + x, c.y + y, S.flame[1], 0.35);
  }
  const p = life.pendulum, f = actFrame('hypno'), amp = f >= 0 ? 0.6 : 0.3, speed = f >= 0 ? 2.2 : 5;
  const a = Math.sin(t / speed) * amp, ex = p.x + Math.round(Math.sin(a) * p.len), ey = p.top + 1 + Math.round(Math.cos(a) * p.len);
  for (let k = 0; k <= p.len; k++) put(p.x + Math.round(Math.sin(a) * k), p.top + 1 + Math.round(Math.cos(a) * k), S.chalk);
  const [ring, ringShade] = S.coin;
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const d = Math.hypot(x, y); if (d <= 3.3) put(ex + x, ey + 3 + y, d < 1.5 ? ringShade : d > 2.5 ? S.trim[3] : ring); }
  if (f >= 0) for (const age of [f % 8, (f + 4) % 8]) {
    const r = 4 + age * 2;
    for (let q = 0; q < Math.PI * 2; q += 0.5 / r) if (dither(Math.round(q * 9), age) < 10) put(ex + Math.round(Math.cos(q) * r), ey + 3 + Math.round(Math.sin(q) * r * 0.7), age < 4 ? S.hypno[0] : S.hypno[1]);
  }
  const e = actFrame('erase'), b = life.book;
  if (e >= 0) {
    const gone = Math.min(b.w * 2, e * 3);
    for (let x = -b.w + 2; x < -b.w + 2 + gone; x++) if (Math.abs(x) > 1) { put(b.x + x, b.y - 2, S.page[0]); put(b.x + x, b.y - 1, S.page[0]); }
    for (let i = 0; i < 4; i++) { const age = (e + i * 3) % 10; sparkle(b.x - b.w + 2 + ((i * 7 + e) % (b.w * 2)), b.y - 3 - age, age < 5 ? S.coin[0] : S.hypno[1]); }
  }
}

/* ----- the Day Care: the couple's house front, a picket fence and an Egg in a straw nest in the yard ----- */

function daycareScene() {
  const { cx, foot, s } = roomLayout(), u = (k) => Math.max(1, Math.round(s * k));
  const nest = { x: cx, y: foot - u(0.04), r: u(0.12) };
  groundShadow(nest.x, nest.y + 2, nest.r + 3, 3);
  strawNest(nest.x, nest.y, nest.r);
  life.egg = { x: nest.x, y: nest.y - 1, r: Math.max(4, Math.round(nest.r * 0.62)) };
  life.stands = { left: { x: cx - u(0.36), y: foot - u(0.02) }, right: { x: cx + u(0.34), y: foot + u(0.03) }, npc: { x: cx + u(0.33), y: foot - u(0.1) } };
  for (const p of Object.values(life.stands)) groundShadow(p.x, p.y, u(0.08), 2);
  life.eventSpots = [{ x0: nest.x - nest.r - 2, x1: nest.x + nest.r + 2, y0: nest.y - life.egg.r * 3, y1: nest.y + 3 }];
  life.foot = foot + 4;
}

/** The couple's house: clapboard walls under a red roof's eave, a door with a round window, the DAY CARE board with
    an Egg on it, a window box of flowers; a white picket fence along the yard in front. */
function daycareHouse() {
  const { cx, s, ceil } = roomLayout(), u = (k) => Math.max(1, Math.round(s * k)), [lit, board, shade, line] = S.siding;
  const eave = Math.max(4, Math.round(horizon * 0.1)), [rLit, roof, rDark, rLine] = S.roof;
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {
    if (y < eave) { solid(x, y, y === eave - 1 ? rLine : y === eave - 2 ? rDark : (x + y * 2) % 6 === 0 ? rLit : roof); continue; }
    const row = (y - eave) % 5;
    solid(x, y, row === 0 ? line : row === 1 ? lit : dither(x, y) < 2 ? shade : board);
  }
  for (let x = 0; x < W; x++) tint(x, eave, 0.6), tint(x, eave + 1, 0.75);   // the eave's shadow
  const [dLit, door, dDark, dLine] = S.trim, dw = u(0.1), dTop = Math.round(horizon * 0.34), dx = cx + u(0.26);
  for (let y = dTop; y < horizon; y++) for (let x = dx - dw; x <= dx + dw; x++) {
    const edge = Math.abs(x - dx) === dw || y === dTop;
    solid(x, y, edge ? dLine : Math.abs(x - dx) === dw - 1 ? dLit : (x - dx + 50) % 4 === 0 ? dDark : door);
  }
  const wr = Math.max(2, Math.round(dw * 0.45)), wy = dTop + wr + 3;
  for (let y = -wr; y <= wr; y++) for (let x = -wr; x <= wr; x++) { const d = Math.hypot(x, y); if (d <= wr + 0.3) solid(dx + x, wy + y, d > wr - 0.8 ? dLine : S.view[0]); }
  solid(dx - dw + 2, Math.round((dTop + horizon) / 2), S.coin[0]);   // the door knob
  const sw = Math.max(18, u(0.22)), sTop = ceil + 2, oneLine = sw * 2 - 14 >= 33, sh = oneLine ? 9 : 15, sx = cx - u(0.2);   // the DAY CARE board, an Egg on it
  for (let y = sTop; y <= sTop + sh; y++) for (let x = sx - sw; x <= sx + sw; x++) {
    const edge = Math.abs(x - sx) === sw || y === sTop || y === sTop + sh;
    solid(x, y, edge ? dLine : y === sTop + 1 ? S.signBoard[0] : S.signBoard[1]);
  }
  egg(sx - sw + 6, sTop + Math.round(sh / 2), 3, 0);
  const words = oneLine ? ['DAY CARE'] : ['DAY', 'CARE'], textX = sx - sw + 12;
  words.forEach((word, i) => pixelText(textX, sTop + 2 + i * 6, word, S.signBoard[2]));
  const bx = cx - u(0.2), bw2 = u(0.14), bh = Math.min(u(0.12), horizon - Math.max(8, Math.round(H * 0.08)) - sTop - sh - 12), by = sTop + sh + 5 + bh;   // a window with a box of flowers
  roomWindow(bx, by - bh, bw2, bh);
  for (let x = bx - bw2 - 2; x <= bx + bw2 + 2; x++) { solid(x, by + 1, dLine); solid(x, by + 2, door); solid(x, by + 3, dDark); solid(x, by + 4, dLine); if ((x * 7) % 5 < 3) solid(x, by, S.flowers[(x >> 1) % S.flowers.length]); }
  picketFence(Math.max(8, Math.round(H * 0.08)));
}

/** A white picket fence along the yard, its pointed pickets over two rails. */
function picketFence(h) {
  const [white, shade, line] = S.picket, top = horizon - h;
  for (const y of [top + 3, horizon - 3]) for (let x = 0; x < W; x++) { solid(x, y, shade); solid(x, y + 1, line); }
  for (let x0 = (W >> 1) % 5 - 5; x0 < W; x0 += 5) for (let y = top; y < horizon; y++) {
    const tip = y === top, w = tip ? 1 : 3;
    for (let k = 0; k < w; k++) solid(x0 + (tip ? 1 : k), y, tip ? line : k === 2 ? shade : white);
    if (!tip) { solid(x0 - 1, y, line); solid(x0 + 3, y, line); }
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.75); }
}

/** The yard's grass, with clover and daisies. */
function yardGrass() {
  bands(horizon, H, S.ground, 1);
  for (let n = 0, c = Math.round(W * (H - horizon) / 14); n < c; n++) {
    const x = Math.floor(rand() * W), y = horizon + 2 + Math.floor(rand() * (H - horizon)), deep = depthOf(y) > 0.4;
    put(x, y, S.blade[0]); put(x, y - 1, S.blade[0]);
    if (deep) { put(x + 1, y, S.blade[1]); put(x - 1, y - 2, S.blade[0]); }
    if (rand() < 0.05) sparkle(x, y, S.flowers[n % S.flowers.length]);
  }
}

/** A round nest of woven straw. */
function strawNest(cx, cy, r) {
  const [lit, straw, dark, line] = S.straw, ry = Math.max(2, Math.round(r * 0.4));
  outlined(cx - r, cy - ry, cx + r, cy + ry, (x, y) => ((x - cx) / (r + 0.5)) ** 2 + ((y - cy) / (ry + 0.5)) ** 2 <= 1, (x, y) => {
    const inner = ((x - cx) / (r * 0.65)) ** 2 + ((y - cy + 1) / (ry * 0.6)) ** 2 <= 1;
    return inner ? dark : (x * 3 + y * 5) % 4 === 0 ? lit : (x + y) % 3 === 0 ? dark : straw;
  }, line);
}

/** A Pokémon Egg: cream, with green spots, lit on its top left, outlined; `tilt` wobbles it. */
function egg(cx, cy, r, tilt, paint = solid) {
  const [shell, shade, spot, line] = S.egg, ry = r * 1.3;
  const tx = (x, y) => x - y * tilt * 0.35;
  const inEgg = (x, y) => { const dy = y < 0 ? y / ry : y / (ry * 0.85); return (tx(x, y) / (r + 0.3)) ** 2 + dy * dy <= 1; };
  for (let y = -Math.ceil(ry) - 1; y <= Math.ceil(ry) + 1; y++) for (let x = -r - 3; x <= r + 3; x++) {
    if (inEgg(x, y)) paint(cx + x, cy + y, noise(Math.round(tx(x, y) / 2), Math.round(y / 2), 12) > 0.72 ? spot : tx(x, y) + y > r * 0.6 ? shade : shell);
    else if (inEgg(x - 1, y) || inEgg(x + 1, y) || inEgg(x, y - 1) || inEgg(x, y + 1)) paint(cx + x, cy + y, line);
  }
}

/** The Egg in the nest wobbles now and then (a lot while you trade), sparkles rising round it as it glows. */
function drawDaycare(t) {
  const e = life.egg, f = actFrame('trade');
  const wob = f >= 0 ? Math.sin(f * 1.3) * Math.min(1, f / 3) : (t % 40 < 6 ? Math.sin(t * 1.5) * 0.5 : 0);
  egg(e.x, e.y - Math.round(e.r * 1.1), e.r, wob, put);
  if (f >= 6) for (let i = 0; i < 6; i++) {
    const age = (f - 6 + i * 3) % 12, ang = i * 1.05;
    sparkle(e.x + Math.round(Math.cos(ang) * (e.r + 3 + age * 0.6)), e.y - e.r - Math.round(age * 1.2), age < 6 ? S.coin[0] : S.egg[0]);
  }
}

/* ----- the Fan Club: striped wallpaper hung with portraits of prize Pokémon, pennants, a red carpet to a little stage
   under a spotlight, the fans either side ----- */

function fanScene() {
  const { cx, foot, s } = roomLayout(), u = (k) => Math.max(1, Math.round(s * k));
  const stage = { x: cx, y: foot - u(0.08), rx: u(0.26), ry: Math.max(3, u(0.07)), h: Math.max(3, u(0.05)) };
  podium(stage);
  giftBox(stage.x + Math.round(stage.rx * 0.55), stage.y + 1, Math.max(4, u(0.055)));
  life.stage = stage;
  life.stands = { left: { x: cx - u(0.36), y: foot + u(0.05) }, right: { x: cx + u(0.38), y: foot + u(0.07) } };
  for (const p of Object.values(life.stands)) groundShadow(p.x, p.y, u(0.08), 2);
  life.stands.npc = { x: stage.x - Math.round(stage.rx * 0.3), y: stage.y + 1 };   // the Chairman, on his stage
  life.eventSpots = [{ x0: stage.x - stage.rx, x1: stage.x + stage.rx, y0: stage.y - stage.ry - u(0.24), y1: stage.y + stage.ry + stage.h }];
  life.foot = foot + 4;
  life.confetti = Array.from({ length: Math.round(W / 3) }, (_, i) => ({ x: rand() * W, y: -rand() * H * 0.6, vx: (rand() - 0.5) * 0.6, vy: 0.8 + rand() * 1.2, c: i % S.flags.length }));
}

function fanWall() {
  const rail = roomWall({ stripes: 4 });
  bunting(Math.max(4, Math.round(horizon * 0.06)));
  const n = Math.max(2, Math.floor(W / 44)), fw = Math.max(7, Math.min(14, Math.round(W / (n * 3.2)))), fh = Math.round(fw * 1.25);
  const y = Math.round((roomLayout().ceil + rail) / 2 - fh / 2);
  for (let i = 0; i < n; i++) portrait(Math.round((i + 0.5) * W / n), y + (i % 2 ? 2 : 0), fw, fh, i);
}

/** A gilt frame round a portrait of a prize Pokémon: a round blob of a body with ears, a coloured background. */
function portrait(cx, top, hw, h, i) {
  const [gold, goldDark] = S.coin, [bg, body, bodyShade] = S.portraits[i % S.portraits.length];
  for (let y = top; y <= top + h; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    const edge = Math.abs(x - cx) >= hw - 1 || y <= top + 1 || y >= top + h - 1;
    solid(x, y, edge ? ((x + y) % 2 ? gold : goldDark) : bg);
  }
  const r = Math.max(2, Math.round(hw * 0.42)), by = top + Math.round(h * 0.6);
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) solid(cx + x, by + y, x + y > r * 0.3 ? bodyShade : body);
  for (const side of [-1, 1]) for (let k = 0; k < Math.max(2, r - 1); k++) solid(cx + side * (r - 1), by - r - k, body);
  solid(cx - 1, by - 1, S.trim[3]); solid(cx + 1, by - 1, S.trim[3]);
  for (let x = cx - hw; x <= cx + hw; x++) tint(x, top + h + 1, 0.75);
}

/** A red carpet running from you to the stage, gold along its edges. */
function carpet() {
  plankFloor();
  const { cx } = roomLayout(), [red, redDark, gold] = S.carpet;
  for (let y = horizon + 1; y < H; y++) {
    const hw = 6 + (y - horizon) * 0.55;
    for (let x = Math.ceil(cx - hw); x <= cx + hw; x++) put(x, y, Math.abs(x - cx) > hw - 1.5 ? gold : dither(x, y) < 3 ? redDark : red);
  }
}

/** A round stage, two steps high, lit from above. */
function podium({ x: cx, y: cy, rx, ry, h }) {
  const [lit, body, dark, line] = S.stage;
  for (let y = -ry; y <= ry + h; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
    const top = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2 <= 1, side = y > 0 && Math.abs(x) <= rx && (x / (rx + 0.5)) ** 2 + ((y - h) / (ry + 0.5)) ** 2 <= 1;
    if (top) solid(cx + x, cy + y, (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2 > 0.8 ? lit : body);
    else if (side) solid(cx + x, cy + y, Math.abs(x) >= rx - 1 || y === ry + h ? line : dark);
  }
}

/** A present wrapped in paper and ribbon, for a tired Pokémon. */
function giftBox(cx, foot, r) {
  const [paper, paperDark, ribbon] = S.gift, top = foot - r * 2;
  for (let y = top; y <= foot; y++) for (let x = cx - r; x <= cx + r; x++) {
    const edge = Math.abs(x - cx) === r || y === top || y === foot, band = x === cx || y === top + Math.round(r * 0.6);
    solid(x, y, edge ? S.trim[3] : band ? ribbon : x > cx ? paperDark : paper);
  }
  solid(cx - 2, top - 1, ribbon); solid(cx - 1, top - 2, ribbon); solid(cx + 1, top - 2, ribbon); solid(cx + 2, top - 1, ribbon); solid(cx, top - 1, ribbon);
}

/** The spotlight's cone over the stage, breathing; showing off throws confetti down over the whole room. */
function drawFans(t) {
  const st = life.stage, f = actFrame('cheer'), top = 0, glow = S.spot;
  for (let y = top; y <= st.y + st.ry; y++) {
    const k = (y - top) / (st.y - top), hw = 2 + k * (st.rx + 1);
    const light = 0.14 + (f >= 0 ? 0.12 : 0) + Math.sin(t / 6) * 0.03;
    for (let x = Math.round(st.x - hw); x <= st.x + hw; x++) blend(x, y, glow, Math.abs(x - st.x) > hw - 1 ? light * 0.5 : light);
  }
  if (f < 0) return;
  for (const c of life.confetti) {
    const y = c.y + f * c.vy * 2.2, x = c.x + f * c.vx + Math.sin((f + c.x) / 2) * 1.5;
    if (y > 0 && y < H) { put(x, y, S.flags[c.c]); if ((f + c.c) % 3) put(x + 1, y, S.flags[c.c]); }
  }
  for (let i = 0; i < 5; i++) {   // hearts rising off the stage
    const age = (f + i * 3) % 14, x = st.x + (i - 2) * Math.max(3, Math.round(st.rx / 2.5)), y = st.y - st.ry - age * 2;
    const h = S.heart;
    put(x - 1, y, h); put(x + 1, y, h); put(x - 1, y + 1, h); put(x, y + 1, h); put(x + 1, y + 1, h); put(x, y + 2, h); put(x - 2, y + 1, h); put(x + 2, y + 1, h);
  }
}

/* ----- Chad Master Kenmatta's arena (PLACE_ART.kombat): Mortal Kombat's courtyard, a Dragonite for its dragon ----- */

/* Laid out like a Mortal Kombat stage, a tall backdrop over a strip of floor: the floor line sits just above your
   Pokémon's pad (kombatFloorRow), Kenmatta meditates on temple steps raised to his pad, and the medallion hangs in the
   open wall between you, all measured from the battle's real layout (CSS px, then canvas pixels). */
const TOP_BAR = 56;   // CSS px the top bar covers

function kombatFloorRow(scale) {
  const box = $('player-zone').getBoundingClientRect();
  if (!box.height) return Math.round(H * 0.6);
  const padW = Math.max(130, Math.min(innerHeight * 0.25, 290));
  return Math.round((box.bottom + box.height * 0.04 - padW / 3 - 4) / scale);
}

function kombatLayout() {
  const sx = innerWidth / W, floorCss = horizon * sx;
  const eb = $('enemy-portrait-box').getBoundingClientRect(), pb = $('player-zone').getBoundingClientRect();
  if (!eb.height) {
    const R = Math.max(9, Math.round(Math.min(W * 0.2, (horizon - TOP_BAR / sx) * 0.4, 34)));
    return { R, cx: W >> 1, cy: Math.round(TOP_BAR / sx + (horizon - TOP_BAR / sx) / 2), dais: null };
  }
  const base = eb.width / (parseFloat(getComputedStyle($('enemy-zone')).getPropertyValue('--size')) || 1);
  const padW = base * 1.5, padBottom = eb.bottom + base * 0.2, padTop = padBottom - padW / 3, padX = (eb.left + eb.right) / 2;
  let R = Math.min(170, innerWidth * 0.22, (eb.left - 8) / 1.9, (floorCss - TOP_BAR) / 2);
  let cx = Math.max(R + 4, Math.min((pb.left + pb.right) / 2 + (padX - (pb.left + pb.right) / 2) / 2, eb.left - R * 0.8));
  // on a phone the enemy's nameplate is over that wall: hang it below, or the Dragonite's head hides behind it
  const plate = $('enemy-plate').getBoundingClientRect(), top = plate.height && plate.right > cx - R * 0.8 ? plate.bottom + 2 : TOP_BAR;
  const cy = Math.max(top + R + 2, Math.min(padTop, floorCss - R - 6));
  // and clear of the steps (templeSteps: a pixel wider every 3 rows), shrinking it where there's no room
  const daisTop = padTop + padW / 9, hw = padW * 0.5, room = padX - hw - Math.max(0, cy + R * 0.5 - daisTop) / 3 - 6;
  if (cx + R > room) { R = Math.min(R, (room - 4) / 2); cx = Math.max(R + 4, room - R); }
  return {
    R: Math.max(9, Math.round(R / sx)), cx: Math.round(cx / sx), cy: Math.round(cy / sx),
    dais: padBottom / sx < horizon - 3 ? { x: Math.round(padX / sx), top: Math.round(daisTop / sx), hw: Math.round(hw / sx) } : null,
  };
}

function kombatBackdrop() {
  const { R, cx, cy, dais } = kombatLayout(), half = Math.round(R * 1.3), roof = Math.max(4, Math.round(R * 0.4));
  const towerTop = Math.max(1, cy - R - roof - 4), wallTop = Math.max(towerTop + roof + 2, Math.round(horizon * 0.3));
  bands(0, wallTop, S.sky, 1, true);
  stars();
  ridge(wallTop - 3, Math.max(3, Math.round(wallTop * 0.25)), 9, 1.7, S.peaks, true, true);
  templeWall(wallTop);
  const bay = 34;   // bays of pillars and banners out from the tower, both ways
  for (const side of [-1, 1]) for (let x = cx + side * (half + 6); x > -bay && x < W + bay; x += side * bay) {
    kombatBanner(x + side * Math.round(bay / 2), wallTop + 2, Math.round((horizon - wallTop) * 0.55));
    lacquerPillar(x + side * bay, wallTop - 4);
  }
  gateTower(cx, towerTop, roof, half);
  medallion(cx, cy, R);
  life.braziers = [];
  for (const side of [-1, 1]) {
    const x = cx + side * (half + 6), py = Math.round(cy - R * 0.1);
    if (dais && Math.abs(x - dais.x) < dais.hw + 8) continue;   // the steps stand in front of it
    lacquerPillar(x, py);
    pixelMap(x - 3, py - 3, ['ooooooo', 'olggggo', '.odddo.', '..ooo..'], { o: S.gold[4], l: S.gold[0], g: S.gold[1], d: S.gold[3] });
    life.braziers.push({ x, y: py - 4 });
  }
  if (dais) templeSteps(dais);
  const Ri = R * 0.78, n = DRAGONITE.length, ey = DRAGONITE.findIndex(row => row.includes('e')), ex = DRAGONITE[ey].indexOf('e');
  life.kombat = { eye: { x: cx + Math.round(((ex + 0.5) * 2 / n - 1) * Ri), y: cy + Math.round(((ey + 0.5) * 2 / n - 1) * Ri) } };
}

/** Kenmatta's dais: a stone platform under his pad and steps down to the floor, widening, a red carpet down the middle. */
function templeSteps({ x: cx, top, hw }) {
  const [lit, body, dark, line, deep] = S.stone, [cLit, carpet, cDark] = S.banner, gold = S.gold;
  const run = Math.max(2, Math.round(hw * 0.32));
  let w = hw, y = top;
  for (; y < top + 3; y++) for (let x = cx - w; x <= cx + w; x++) solid(x, y, Math.abs(x - cx) === w ? line : y === top ? lit : body);
  for (let step = 0; y < horizon; step++) {
    w += 1;
    for (let k = 0; k < 3 && y < horizon; k++, y++) for (let x = cx - w; x <= cx + w; x++) {
      const d = Math.abs(x - cx), onCarpet = d < run, edge = d === run;
      solid(x, y, d === w ? line : edge ? gold[k ? 2 : 0] : onCarpet ? (k ? (k === 2 ? cDark : carpet) : cLit) : k === 0 ? lit : k === 2 ? dark : (dither(x, y) < 3 ? dark : body));
    }
  }
  for (let x = cx - w - 1; x <= cx + w + 1; x++) solid(x, horizon - 1, deep);
}

/** The courtyard's back wall: big stone blocks under a tiled cap with a red trim, darkening to a plinth at the ground. */
function templeWall(wallTop) {
  const [lit, body, dark, line, deep] = S.stone, [tLit, tile, tDark, trim] = S.roof, gold = S.gold;
  const plinth = horizon - Math.max(4, Math.round((horizon - wallTop) * 0.12));
  for (let y = wallTop; y < horizon; y++) {
    const low = y >= plinth, rh = low ? 99 : 5, course = Math.floor((y - wallTop) / rh), seamY = !low && (y - wallTop) % rh === rh - 1;
    for (let x = 0; x < W; x++) {
      const bx = x + (course % 2) * 6, seamX = !low && bx % 12 === 0;
      const shade = 3 + (y - wallTop) / (horizon - wallTop) * 8;
      let c = seamY || seamX ? line : low ? (dither(x, y) < 9 ? deep : line) : dither(x, y) < shade ? dark : noise(Math.floor(bx / 12), course, 2) > 0.75 ? lit : body;
      if (!low && !seamY && !seamX && (y - wallTop) % rh === 0) c = lit;
      if (y === plinth - 2) c = gold[2];
      if (y === plinth - 1) c = trim;
      solid(x, y, c);
    }
  }
  for (let x = 0; x < W; x++) {
    solid(x, wallTop - 3, tLit); solid(x, wallTop - 2, x % 2 ? tile : tDark); solid(x, wallTop - 1, trim); solid(x, wallTop, deep);
  }
}

/** The gate tower in the middle: a stone face under a sweeping pagoda roof, its eaves turned up, gold finials. */
function gateTower(cx, top, roof, half) {
  const [lit, body, dark, line] = S.stone, [tLit, tile, tDark, trim] = S.roof, gold = S.gold;
  for (let y = top + roof; y < horizon; y++) for (let x = cx - half; x <= cx + half; x++) {
    const edge = Math.abs(x - cx) === half, course = Math.floor((y - top) / 4), seam = (y - top) % 4 === 3 || (x - cx + 100 + (course % 2) * 5) % 10 === 0;
    solid(x, y, edge ? gold[3] : Math.abs(x - cx) === half - 1 ? gold[2] : seam ? line : x > cx + half * 0.5 && dither(x, y) < 6 ? dark : body);
  }
  for (let y = top; y < top + roof; y++) {
    const k = (y - top) / (roof - 1), w = Math.round(half * 0.45 + (half + roof * 1.2 - half * 0.45) * Math.pow(k, 0.8));
    for (let x = cx - w; x <= cx + w; x++) solid(x, y, y === top + roof - 1 ? trim : y === top ? tLit : (x - cx) % 2 ? tile : tDark);
    if (y === top + roof - 1) for (const s of [-1, 1]) { solid(cx + s * (w + 1), y - 1, trim); solid(cx + s * (w + 2), y - 2, gold[1]); }
  }
  for (let y = top - 3; y < top; y++) solid(cx, y, gold[y === top - 3 ? 0 : 1]);
  solid(cx - 1, top - 1, gold[2]); solid(cx + 1, top - 1, gold[2]);
  for (let x = cx - half; x <= cx + half; x++) solid(x, top + roof, dark);
  for (let x = cx - half + 2; x <= cx + half - 2; x++) if (x % 3 === 0) solid(x, top + roof + 1, lit);
}

/** A red lacquer pillar from `top` down to the ground, gold-banded at both ends. */
function lacquerPillar(x, top) {
  const [lit, body, dark, line] = S.lacquer, gold = S.gold;
  for (let y = top; y < horizon; y++) {
    const band = y - top < 2 || horizon - y <= 2;
    [line, band ? gold[0] : lit, band ? gold[1] : body, band ? gold[2] : body, band ? gold[3] : dark, line].forEach((c, i) => solid(x - 3 + i, y, c));
  }
}

/** A red banner hanging from a gold rod, swallow-tailed, a gold ring on it like the medallion. */
function kombatBanner(cx, top, len) {
  const [lit, body, dark] = S.banner, gold = S.gold, hw = 3;
  for (let x = cx - hw - 1; x <= cx + hw + 1; x++) solid(x, top, gold[x === cx - hw - 1 ? 0 : 2]);
  for (let y = top + 1; y < top + len; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    if (y > top + len - 4 && Math.abs(x - cx) < top + len - y) continue;   // the swallow tail
    solid(x, y, x === cx - hw ? lit : x === cx + hw ? dark : body);
  }
  const ry = top + Math.round(len * 0.38);
  for (let a = 0; a < 8; a++) solid(cx + Math.round(Math.cos(a * Math.PI / 4) * 2), ry + Math.round(Math.sin(a * Math.PI / 4) * 2), gold[1]);
  solid(cx, ry, gold[0]);
}

/* The medallion's Dragonite, roaring to the left like the MK dragon with its wing raised: antennae, open jaws, a reaching
   claw, the striped belly, its tail curling round the ring. # body, w wing, = belly, e the eye (drawKombat lights it). */
const DRAGONITE = [
  '................................',
  '..............##................',
  '.............#..##..............',
  '............#.....#.............',
  '.......#####.#..................',
  '.....#########.#................',
  '...#############...............w',
  '..###e##########.............ww.',
  '..##############...........www..',
  '..##############..........wwww..',
  '...#....########.........wwwww..',
  '....#############.......wwwwww..',
  '.....###########.......wwwwww...',
  '.....######=######....wwwwww....',
  '.......##=========####wwwww.....',
  '.......#==========######ww......',
  '..#######=========#######.......',
  '.##....#==========########......',
  '..#....#==========#########.....',
  '.......#==========#########.....',
  '.......#==========##########....',
  '........#=========##########....',
  '........#=========###########...',
  '.........#=======############...',
  '..........#=====##############..',
  '...........###################..',
  '..........######.....#####.####.',
  '.........######.......####..###.',
  '.......#######..........#..####.',
  '......######...............###..',
  '...........................#....',
  '................................',
];
const DRAGONITE_KIND = { '#': 1, e: 1, w: 2, '=': 3 };

/** The Dragonite at u, v in the unit circle: 0 none, 1 body, 2 wing, 3 belly. */
function dragoniteAt(u, v) {
  const n = DRAGONITE.length, x = Math.floor((u + 1) * n / 2), y = Math.floor((v + 1) * n / 2);
  return DRAGONITE_KIND[DRAGONITE[y]?.[x]] || 0;
}

/** The gold medallion: a bevelled ring round a dark field, the Dragonite raised on it in relief, lit from the top left. */
function medallion(cx, cy, R) {
  const [lit, gold, mid, dark, deep] = S.gold, [field, fieldDark] = S.medal, Ri = R * 0.78;
  const kind = (x, y) => (x * x + y * y > Ri * Ri) ? 0 : dragoniteAt(x / Ri, y / Ri);
  for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) {
    const d = Math.sqrt(x * x + y * y);
    if (d > R + 0.5) continue;
    let c;
    if (d > Ri + 0.5) {
      const a = (-x - y) / Math.max(1, d), outerHalf = d > (R + Ri) / 2;
      c = d > R - 0.5 || d < Ri + 1.3 ? deep : (outerHalf ? a : -a) > 0.35 ? lit : (outerHalf ? a : -a) < -0.35 ? mid : gold;
    } else {
      const k = kind(x, y);
      if (!k) c = kind(x - 1, y - 1) ? deep : dither(x, y) < 5 ? fieldDark : field;
      else if (!kind(x - 1, y - 1)) c = lit;
      else if (!kind(x + 1, y + 1)) c = dark;
      else c = k === 2 ? mid : k === 3 ? ((y + R * 4) % 3 === 0 ? mid : lit) : gold;
    }
    solid(cx + x, cy + y, c);
  }
  const studR = Math.round((R + Ri) / 2);
  for (let a = 0; a < 8; a++) solid(cx + Math.round(Math.cos(a * Math.PI / 4 + Math.PI / 8) * studR), cy + Math.round(Math.sin(a * Math.PI / 4 + Math.PI / 8) * studR), lit);
}

/** Big stone flags running away from you, darkest under the wall. */
function kombatFloor() {
  const [lit, body, dark, line] = S.tile, cx = W / 2, vy = horizon - (H - horizon) * 1.4;
  const bottom = H - vy, ku = bottom / 26, kv = bottom * bottom / 9;
  for (let y = horizon; y < H; y++) {
    const dz = y - vy, v = Math.floor(kv / dz), rowEdge = v !== Math.floor(kv / (dz + 1));
    for (let x = 0; x < W; x++) {
      const u = (x - cx) * ku / dz + (v % 2) * 0.5, flag = Math.floor(u), seam = u - flag < ku / dz;
      const tone = noise(flag, v, 7);
      put(x, y, seam || rowEdge ? line : tone < 0.2 ? lit : tone > 0.7 || dither(x, y) < 2 ? dark : body);
    }
  }
  for (let y = horizon; y < horizon + 4; y++) for (let x = 0; x < W; x++) tint(x, y, 0.55 + (y - horizon) * 0.12);
}

/** The braziers' flames lick and throw light on the wall; the Dragonite's eye smoulders, blazing once the storm is up. */
function drawKombat(t) {
  const [white, yellow, orange, red] = S.flame;
  for (const b of life.braziers) {
    const f = Math.sin(t / 2 + b.x) + noise(t, b.x, 1);
    for (let y = -9; y <= 3; y++) for (let x = -8; x <= 8; x++) {
      if (x * x + y * y * 1.4 < 50 + f * 8 && dither(b.x + x, b.y + y) < 3) tint(b.x + x, b.y + y, 1.3, 16);
    }
    const tall = 5 + Math.round(f * 1.2);
    for (let dy = 0; dy < tall; dy++) {
      const k = dy / tall, half = Math.round(2.4 * Math.pow(1 - k, 0.8) * (0.8 + 0.4 * noise(dy, t, b.x)));
      const sway = Math.round(Math.sin((t + dy) / 2 + b.x) * k * 1.3);
      for (let dx = -half; dx <= half; dx++) {
        put(b.x + dx + sway, b.y - dy, Math.abs(dx) < Math.max(1, half * 0.5) && k < 0.6 ? (k < 0.3 ? white : yellow) : k > 0.7 ? red : orange);
      }
    }
  }
  const e = life.kombat.eye, [hot, glow, ember] = S.eye, p = Math.sin(t / 3) + storm.level * 2;
  put(e.x, e.y, p > 0 ? hot : glow);
  if (p > 0.4) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(e.x + dx, e.y + dy, p > 1.4 ? glow : ember);
}

// a 3x5 pixel font for signs, just the letters they use
const GLYPHS = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], ' ': ['...'],
};

/** Letters in the 3x5 pixel font, a pixel apart, their top left at x, y. */
function pixelText(x, y, text, colour) {
  for (const ch of text) {
    (GLYPHS[ch] || []).forEach((row, dy) => { for (let dx = 0; dx < row.length; dx++) if (row[dx] === '#') solid(x + dx, y + dy, colour); });
    x += ch === ' ' ? 3 : 4;
  }
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
    const density = S.raw.floor === 'moss' ? (S.raw.backdrop === 'shrine' && S.raw.stage >= 2 ? 0.05 : 0.6) : 1;   // raked gravel grows next to nothing
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
    for (let i = 0, n = Math.round((W / 7) * S.raw.embers * (0.7 + dial() * 0.8)); i < n; i++) {
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
  if (life.keep && life.blades) life.blades = life.blades.filter(b => !kept(b.x, b.y));   // no grass growing through the props
  if (life.bare && life.blades) life.blades = life.blades.filter(b => !life.bare[b.y * W + b.x]);   // nor through water or lava
  if (has('spring')) {
    life.steam = life.pools.flatMap((p, i) => Array.from({ length: Math.max(3, Math.round(p.rx / 2)) }, () => ({
      pool: i, dx: (rand() * 2 - 1) * p.rx * 0.75, age: rand() * 36, speed: 0.6 + rand() * 0.5, size: 1.2 + p.ry / 14 + rand(),
    })));
    for (const [v, vent] of (life.vents || []).entries()) for (let n = 0; n < 3; n++) life.steam.push({ pool: -1, vent: v, age: n * 8 + rand() * 4, speed: 0.6, size: 1 });
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

  if (L.flows || (L.cracks && S.lava)) drawLava(t);
  if (L.puffs || L.glints) drawStage(t);
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
  if (has('berry')) drawBerryTree();
  if (has('spring')) drawSpring(t);
  if (has('well')) drawWell(t);
  if (L.act) actCues();
  if (has('itemball')) drawItemBall(t);
  if (has('rocket')) drawRocket();
  if (has('altar')) drawAltar(t);
  if (has('tutor')) drawTutor(t);
  if (has('deleter')) drawDeleter(t);
  if (has('daycare')) drawDaycare(t);
  if (has('fans')) drawFans(t);
  if (has('kombat')) drawKombat(t);
  if (has('vines')) drawVines(t);

  if (L.lanterns && S.raw.lanternsLit && !shrinePrelude()) {
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

  if (L.wisps && !shrinePrelude()) {
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
  let shake = 0;
  if (bossPrelude?.phase === 'portal') {
    if (S.raw.backdrop === 'shrine') shake = drawShrinePortal(t);
    else if (S.raw.backdrop === 'volcano') shake = drawWastesPortal(t);
    else shake = drawClearingPortal(t);
  }
  else if (bossPrelude) shake = drawBossAwakening(t) || 0;

  // the whole picture jolts a pixel or two; the strip it uncovers keeps last frame's colours, which reads as blur
  ctx.putImageData(img, shake ? (t % 2 ? shake : -shake) : 0, shake > 1 && t % 3 === 0 ? 1 : 0);
}

/** The Main Hall's geometry, recomputed from the canvas (the prelude draws over the painted scene). */
function shrineHall() {
  const gx = Math.round(W * 0.52), half = Math.round(Math.min(W * 0.34, horizon * 1.15)), base = Math.max(3, Math.round(horizon * 0.07));
  const tall = Math.round(horizon * 0.4);
  return { gx, half, base, tall, eave: horizon + 1 - base - tall };
}

/** True while the Shrine's ceremony is playing: the lanterns and wisps are redrawn as part of it. */
const shrinePrelude = () => !!bossPrelude && S.raw.backdrop === 'shrine';

/* ----- the Shrine's boss prelude: the spirits are summoned -----
   The temple bell tolls three times, each toll a ring rolling out over the courtyard. Night falls whatever the hour, the
   lanterns light in a wave down the approach and turn to blue spirit fire, mist rolls in, paper wards lift out of the
   gravel into a cyclone round the Main Hall and a colossal ghostly torii rises behind it; at the last toll spirit flames
   run along the roof while a great seal of spirit light draws itself round the hall; at the last toll it flares and
   throws fox-fires off its ring that blast the wards outwards. No beam: going straight up is the Wastes' eruption. */

const BELL_TOLLS = [0, 9, 18];   // frames into the wake (8 fps); the `bell` sound is timed to them
const SPIRIT_AT = 20;            // ...and the spirits burst, with `spirit`

/** Returns how many pixels the picture shakes this frame. */
function drawShrineAwakening(t) {
  const awake = bossPrelude.phase === 'awake', age = Math.max(0, t - bossPrelude.at);
  const progress = awake ? 1 : Math.min(1, age / (FPS * 2.4));
  const hall = shrineHall(), ridge = hall.eave - Math.round(horizon * 0.3), white = abgr('#fffce8');
  let shake = 0;

  // night falls, whatever the hour (and stays over the fight)
  const night = awake ? 0.3 : Math.min(0.5, age / 10 * 0.5), indigo = abgr('#0a1034');
  for (let i = 0; i < W * H; i++) if (sky[i] || !awake) blend(i % W, (i / W) | 0, indigo, night);

  if (!awake) ghostTorii(Math.max(0, Math.min(1, (age - 8) / 10)), 0.5, age);

  if (!awake) for (const at of BELL_TOLLS) {
    const a = age - at;
    if (a < 0 || a >= 7) continue;
    if (a === 0) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tint(x, y, 1.12, 22);
    shockRing(hall.gx, ridge, a * W * 0.11, [S.wisp[0], S.wisp[1]], 0.4);
    if (a < 2) shake = 1;
  }

  // The lanterns that will light, in order: the hall's own two first, then stone pairs leading down the
  // approach toward the viewer, so a wave of light sweeps out from the hall. At the second toll they turn to spirit fire.
  const [hot, warm, glow] = awake || age >= BELL_TOLLS[1] ? S.wisp : S.lanternGlow;
  const lights = [];
  for (const l of life.lanterns) lights.push({ x: l.x, y: l.y, size: life.lanternSize, at: 0.3 });
  const top = horizon + 4, bottom = H - 4;
  for (let i = 0; i < 4; i++) {
    const depth = (i + 1) / 5;
    const foot = Math.round(top + (bottom - top) * depth);
    const spread = Math.round(hall.half * (0.3 + depth * 0.5)) + 2;
    const size = Math.max(3, Math.round(life.lanternSize * (0.6 + depth * 0.55)));
    for (const side of [-1, 1]) lights.push({ x: hall.gx + side * spread, y: foot - Math.round(size * 1.2), size, foot, at: 1.5 + (i + 1) * 1.5 });
  }
  for (let i = 0; i < lights.length; i++) {
    const L = lights[i], foot = L.foot ?? L.y + Math.round(L.size * 1.2);
    lanternBody(L.x, foot, L.size);
    const heat = awake ? 1 : age > L.at ? Math.min(1, (age - L.at) / 1.5) : 0;
    if (heat <= 0) continue;
    const flash = Math.max(0, 1 - heat * 2), reach = 2 + Math.round(L.size * 0.4) + Math.round(flash * 3);
    put(L.x, L.y, heat > 0.5 ? hot : warm); put(L.x - 1, L.y, warm);
    for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
      if ((dx || dy) && dx * dx + dy * dy <= reach * reach && dither(L.x + dx, L.y + dy) < 4) put(L.x + dx, L.y + dy, flash > 0.35 ? hot : glow);
    }
  }

  // Mist banks drift in from the sides and settle thick around the hall's base and steps.
  const mist = S.mistColour;
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? 1 : -1, k = (i + 1) / 7;
    const homeX = hall.gx + side * Math.round(W * (0.3 + k * 0.25)), homeY = horizon + 2 + Math.round(k * (H - horizon) * 0.4);
    const gx = hall.gx + side * Math.round(hall.half * (1.15 - k * 0.5)), gy = horizon + 1 + Math.round(hall.base * 0.5 + k * 3);
    const x = Math.round(homeX + (gx - homeX) * progress), y = Math.round(homeY + (gy - homeY) * progress);
    const r = Math.round(4 + k * 7 * progress), a = 0.12 + progress * 0.3;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r * 2; dx <= r * 2; dx++) {
      const d = (dx / (r * 2)) ** 2 + (dy / r) ** 2;
      if (d <= 1 && (d < 0.45 || dither(x + dx, y + dy) < 8)) blend(x + dx, y + dy, mist, a * (1 - d * 0.6));
    }
  }

  // The spirit wisps leave their drift and spiral in to gather at the hall's door.
  const [core, body, trail] = S.wisp;
  const cx = hall.gx, cy = Math.round(hall.eave + hall.tall * 0.45);
  for (let i = 0; i < (life.wisps?.length ?? 0); i++) {
    const w = life.wisps[i], angle = w.phase + age * (0.5 + (i % 3) * 0.22);
    const radius = Math.max(2, (14 + (i % 4) * 9) * (1 - progress * 0.82));
    const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius * 0.5;
    for (let k = 1; k <= 3; k++) if (dither(Math.round(x), Math.round(y) + k) < 10 - k * 3) put(x + Math.sin((t - k * 2 + w.phase) / 9) * 2, y + k + 1, trail);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const d = dx * dx + dy * dy;
      if (d <= 1) put(x + dx, y + dy, d ? body : core);
      else if (d <= 5 && dither(dx + t, dy) < 6) put(x + dx, y + dy, trail);
    }
  }

  // The spirits raise a second torii-shaped gate over the Main Hall's door. Keep the light in the skyline: the broad
  // middle and foreground stay open for the two Pokémon.
  const aura = awake ? 1 : Math.max(0, Math.min(1, (progress - 0.58) / 0.42));
  if (aura > 0) {
    const sx = hall.gx, sy = Math.round(hall.eave + hall.tall * 0.52);
    const archHalf = Math.max(4, Math.round(hall.half * (0.12 + aura * 0.12)));
    const archHeight = Math.max(3, Math.round(hall.tall * (0.18 + aura * 0.22)));
    const topY = sy - archHeight, lintelY = topY + Math.max(2, Math.round(archHeight * 0.3));
    const flicker = Math.sin(age / 2.5);
    for (const side of [-1, 1]) {
      const x = sx + side * Math.round(archHalf * 0.72);
      for (let y = topY + 1; y <= sy + 1; y++) {
        if (dither(x, y + t) < 10) { put(x, y, core); put(x + side, y, body); }
      }
    }
    for (let x = -archHalf - 2; x <= archHalf + 2; x++) {
      const lift = Math.abs(x) > archHalf ? 1 : 0;
      if (dither(sx + x, topY + t) < 12) {
        put(sx + x, topY - lift, flicker > 0.15 ? core : body);
        put(sx + x, topY + 1 - lift, body);
      }
      if (x >= -archHalf && x <= archHalf && dither(sx + x, lintelY + t) < 9) put(sx + x, lintelY, trail);
    }
    for (const side of [-1, 1]) for (const y of [topY, sy]) {
      const x = sx + side * Math.round(archHalf * 0.72);
      if (Math.sin(age / 2 + side + y) > -0.15) {
        put(x, y, core); put(x - 1, y, body); put(x + 1, y, body); put(x, y - 1, body); put(x, y + 1, body);
      }
    }
  }
  if (awake) return 0;

  const e = age - SPIRIT_AT;
  // a great seal of spirit light draws itself round the hall, and a flattened twin across the courtyard
  const sealY = Math.round(hall.eave + hall.tall * 0.2), sealR = Math.round(Math.min(W * 0.3, H * 0.3));
  const floorY = Math.round(horizon + (H - horizon) * 0.42), drawn = Math.max(0, Math.min(1, (age - 9) / 10));
  const flare = e < 0 ? 0.4 : Math.max(0.55, 1 - e * 0.06), grow = e < 0 ? 1 : 1 + e * 0.05;
  spiritSeal(hall.gx, floorY, Math.round(W * 0.5 * grow), drawn, -age, 0.28, flare * 0.8);
  ofudaVortex(age, hall, ridge, e);
  spiritSeal(hall.gx, sealY, Math.round(sealR * grow), drawn, age * (e < 0 ? 1 : 2.5), 1, flare);
  if (e < 0) {
    if (age > 13) roofFlames(hall, ridge, age, (age - 13) / 7);
    return shake;
  }
  // the last toll lands: the seal flares white and fox-fires burst off its ring, blasting the wards outwards
  if (e === 0) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tint(x, y, 1.35, 70);
  roofFlames(hall, ridge, age, 1.4);
  foxFires(hall.gx, sealY, sealR * grow, e, age);
  shockRing(hall.gx, floorY, e * W * 0.15, [white, body], 0.28);
  return e < 4 ? 2 : 1;
}

/** A seal of spirit light round (cx, cy): two rings, an eight-point star between them and runes orbiting, drawn
    (`drawn` 0-1) stroke by stroke and turning with `spin`; `squash` flattens it onto the ground, `k` how strongly it shows. */
function spiritSeal(cx, cy, r, drawn, spin, squash, k) {
  if (drawn <= 0 || r < 4) return;
  const [core, body, trail] = S.wisp, white = abgr('#fffce8'), turn = spin * 0.06;
  const dot = (x, y, c) => blend(x, cy + (y - cy) * squash, c, k);
  const at = (a, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  const ring = (rr, c, glow) => {
    for (let a = 0; a < Math.PI * 2 * drawn; a += 0.6 / rr) {
      const [x, y] = at(a + turn, rr), [ix, iy] = at(a + turn, rr - 1);
      dot(x, y, c); dot(ix, iy, glow ?? c);
    }
  };
  // once it flares the seal fills with a soft light
  if (k > 0.6 && squash === 1) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y < r * r * 0.85 && dither(cx + x, cy + y) < 7) blend(cx + x, cy + y, body, (k - 0.6) * 0.6);
  }
  ring(r, k > 0.9 ? white : core, body);
  ring(r * 0.92, body);
  ring(r * 0.62, core, trail);
  // the star: each point joined to the one three along, turning against the rings
  const lines = Math.round(8 * drawn);
  for (let i = 0; i < lines; i++) {
    const [x0, y0] = at(-turn * 1.6 + i * Math.PI / 4, r * 0.62), [x1, y1] = at(-turn * 1.6 + (i + 3) * Math.PI / 4, r * 0.62);
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const x = x0 + (x1 - x0) * s / steps, y = y0 + (y1 - y0) * s / steps;
      dot(x, y, core); if (squash === 1) dot(x + 1, y, body);
    }
  }
  // runes orbiting in the band between the rings
  for (let i = 0; i < Math.round(12 * drawn); i++) {
    const [x, y] = at(turn + i * Math.PI / 6 + 0.26, r * 0.78), shape = i % 3;
    dot(x, y, core);
    if (shape === 0) { dot(x - 1, y, body); dot(x + 1, y, body); dot(x, y - 1, body); }
    else if (shape === 1) { dot(x, y - 1, body); dot(x, y + 1, body); dot(x + 1, y - 1, trail); }
    else { dot(x - 1, y - 1, body); dot(x + 1, y + 1, body); dot(x + 1, y - 1, trail); }
  }
}

/** Twelve blue fox-fires bursting off the seal's ring, `e` frames after it flares, each with a tail back towards it. */
function foxFires(cx, cy, r, e, age) {
  const [core, body, trail] = S.wisp, white = abgr('#fffce8');
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + age * 0.12, d = r + e * W * 0.06 + Math.sin(age + i) * 2;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.9;
    for (let k = 2; k <= 9; k++) {
      const tx = x - Math.cos(a) * k * 1.4, ty = y - Math.sin(a) * k * 1.4 + Math.sin(age * 2 + k) * 0.8;
      put(tx, ty, k < 5 ? body : trail); if (k < 6) put(tx, ty + 1, trail);
    }
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const q = dx * dx + dy * dy;
      if (q <= 2) put(x + dx, y + dy, q ? core : white);
      else if (q <= 10 && dither(x + dx, y + dy + age) < 11) put(x + dx, y + dy, body);
    }
  }
}

/** A colossal see-through torii of spirit light rising (`rise` 0-1) out of the courtyard right in front of you, its
    posts near the screen's edges and its beams near the top, framing the hall; `k` how strongly it shows. */
function ghostTorii(rise, k, age) {
  if (rise <= 0) return;
  const [core, body] = S.wisp, cx = Math.round(W * 0.52);
  const size = Math.round(H * 0.9), halfW = Math.round(W * 0.56);
  const topY = H + 2 - Math.round(size * rise), post = Math.max(2, Math.round(W / 36));
  const ghost = (x, y, c) => { x |= 0; y |= 0; if (inside(x, y) && dither(x, y + age) < 13) blend(x, y, c, k); };
  for (const side of [-1, 1]) {
    const x0 = cx + side * Math.round(halfW * 0.72);
    for (let y = topY + 2; y < H; y++) for (let d = -post; d <= post; d++) ghost(x0 + d, y, Math.abs(d) === post ? core : body);
  }
  for (let x = -halfW - 3; x <= halfW + 3; x++) {
    const lift = Math.abs(x) > halfW + 1 ? 2 : Math.abs(x) > halfW - 2 ? 1 : 0;
    ghost(cx + x, topY - lift, core); ghost(cx + x, topY + 1 - lift, body); ghost(cx + x, topY + 2 - lift, body);
  }
  const tie = topY + Math.max(4, Math.round(size * 0.22));
  for (let x = -halfW + 1; x <= halfW - 1; x++) { ghost(cx + x, tie, core); ghost(cx + x, tie + 1, body); }
  for (let y = topY + 3; y < tie; y++) for (let x = -2; x <= 2; x++) ghost(cx + x, y, Math.abs(x) === 2 ? core : body);
}

/** Paper wards lifting out of the gravel into a cyclone round the whole courtyard, climbing and tightening on the hall
    and turning as they fly; once the spirits burst (`burst` frames ago) they're flung outwards. */
function ofudaVortex(age, hall, ridge, burst) {
  const paper = M().paper, red = M().red[0], low = horizon + (H - horizon) * 0.35;
  for (let i = 0; i < 56; i++) {
    const a = age - 3 - i / 5;
    if (a < 0) continue;
    const rise = Math.min(1, a / 5), angle = noise(i, 61, 0) * Math.PI * 2 + a * (0.3 + a * 0.02);
    const climb = Math.min(1, a / 16), cy = low + (ridge - low) * climb * noise(i, 61, 2);
    let r = W * (0.22 + noise(i, 61, 1) * 0.3) * (1 - climb * 0.35);
    if (burst >= 0) r += burst * burst * W * 0.05;
    const ox = hall.gx + Math.cos(angle) * r, oy = cy + Math.sin(angle) * r * 0.45;
    const gx = noise(i, 61, 3) * W, gy = horizon + 3 + noise(i, 61, 4) * (H - horizon - 6);
    const x = gx + (ox - gx) * rise, y = gy + (oy - gy) * rise;
    const w = Math.abs(Math.cos(angle * 2 + i)) > 0.4 ? 2 : 1;
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < w; dx++) put(x + dx, y + dy, dy === 1 ? red : paper);
  }
}

/** Blue spirit fire running along the hall's ridge, `s` how fierce. */
function roofFlames(hall, ridge, age, s) {
  const [core, body, trail] = S.wisp, w = Math.round(hall.half * 0.67);
  for (let x = -w; x <= w; x += 2) {
    const h = Math.round((2 + noise(x, age, 62) * 5) * s * (1 - Math.abs(x) / w * 0.4));
    for (let k = 0; k < h; k++) {
      const sway = Math.round(Math.sin(age * 1.3 + x * 0.7 + k * 0.5) * k * 0.25);
      put(hall.gx + x + sway, ridge - 1 - k, k < h * 0.35 ? core : k < h * 0.75 ? body : trail);
      if (k < h * 0.5) put(hall.gx + x + 1 + sway, ridge - 1 - k, body);
    }
  }
}

/* ----- the Clearing's boss prelude: the ancient tree wakes -----
   The ground trembles and the light drains green, sap-light climbs the trunk in glowing veins, roots tear up through
   the grass towards you, the meadow bursts into flower in a wave out from the tree and a cyclone of leaves winds round
   the trunk; the heartwood beats faster and faster, then bursts open into one colossal blossom that gusts petals
   sideways across the meadow and blasts the leaves outwards. */

const BLOOM_AT = 20;   // frames into the wake (8 fps) when the heartwood bursts; the `bloom` sound is timed to it

/** The giant tree's geometry, the same sums as giantTree(). */
function clearingTree() {
  const cx = Math.round(W * 0.5), half = Math.max(10, Math.round(Math.min(W * 0.16, horizon * 0.52)));
  return { cx, half, foot: horizon + 3, hx: cx - Math.round(half * 0.2), hy: Math.round(horizon * 0.62) };
}
const trunkLean = (y, half) => Math.round(Math.sin(y / Math.max(5, horizon * 0.12)) * Math.min(3, half * 0.08));

/** Glowing sap veins climbing the trunk, `reach` (0-1) of the way up; once awake, just pulses of sap still rising. */
function sapVeins(age, reach, dim) {
  const { cx, half, foot } = clearingTree(), [hot, glow] = S.firefly, white = abgr('#fffce8');
  for (let i = 0; i < 6; i++) {
    const x0 = (i / 5 - 0.5) * half * 1.5;
    const top = Math.round(foot * (1 - Math.max(0, Math.min(1, reach * 1.3 - noise(i, 31, 0) * 0.3))));
    for (let y = foot; y >= top; y--) {
      const x = cx + trunkLean(y, half) + Math.round(x0 + Math.sin(y * 0.3 + i * 2.1) * 1.6);
      if (dim) { if ((y + age * 3 + i * 7) % 18 < 2) { put(x, y, hot); put(x + 1, y, glow); } continue; }
      put(x, y, y < top + 2 ? white : hot); put(x + 1, y, glow);
      for (const dx of [-2, -1, 2, 3]) if (dither(x + dx, y + age) < 6) tint(x + dx, y, 1.15, 30);
      if (noise(i, y, 32) < 0.05) for (let k = 1; k < 4; k++) put(x + (noise(i, y, 33) < 0.5 ? -k : k + 1), y - k, glow);
    }
  }
}

/** Roots tearing up through the grass from the tree's foot towards you, thicker as they near, a glowing seam down each
    and clods of earth thrown off their tips; once awake they lie still and dark. */
function wakingRoots(age, reach, dim) {
  const { cx, half, foot } = clearingTree(), bark = M().bark, [hot, glow] = S.firefly;
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, k = i >> 1;
    let x = cx + side * half * (0.9 + k * 0.45);
    const drift = side * (0.5 + k * 0.55), end = foot + (H - foot) * Math.max(0, Math.min(1, reach * 1.3 - k * 0.15));
    for (let y = foot; y < end; y++) {
      const near = (y - foot) / Math.max(1, H - foot), w = dim ? 0 : 1 + Math.round(near * 3);
      x += drift * (1 + near) + (noise(i, y >> 1, 34) - 0.5) * 1.4;
      for (let dx = -w - 1; dx <= w + 1; dx++) {
        put(x + dx, y, dx === -w - 1 ? bark[0] : dx === w + 1 ? bark[3] : !dim && Math.abs(dx) <= w / 3 ? (dx ? glow : hot) : dx < 0 ? bark[1] : bark[2]);
      }
      bare(x, y);
    }
    if (dim || reach >= 1) continue;
    for (let c = 0; c < 4; c++) {   // clods of earth flung off the tip
      const a = (age + c * 2) % 6;
      put(x + (c - 1.5) * a * 0.8, end - a * (3 - a * 0.45), bark[2]);
    }
  }
}

/** The meadow bursts into flower in a wave out from the tree's foot; each pops with a white sparkle. */
function bloomWave(age, awake) {
  const { cx, foot } = clearingTree(), white = abgr('#fffce8'), count = Math.round(W * (H - horizon) / 90);
  for (let i = 0; i < count; i++) {
    const x = Math.round(noise(i, 41, 0) * W), y = horizon + 3 + Math.round(noise(i, 41, 1) ** 0.8 * (H - horizon - 4));
    const a = awake ? 99 : age - (3 + Math.hypot(x - cx, (y - foot) * 2.2) / W * 20);
    if (a < 0 || (awake && i % 3)) continue;   // over the fight only a third of them stay, to keep the ground calm
    const [petal, heart] = S.flowers[i % S.flowers.length], big = depthOf(y) > 0.4;
    if (a < 1.5) { for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [0, 0]]) put(x + dx, y + dy, white); continue; }
    if (big) { put(x - 1, y, petal); put(x + 1, y, petal); put(x, y - 1, petal); put(x, y + 1, petal); put(x, y, heart); }
    else { put(x, y, petal); put(x + 1, y, heart); }
  }
}

/** A cyclone of leaves winding up round the trunk, faster and fuller as it goes; `burst` frames after the heartwood
    bursts, it's flung outwards. */
function leafCyclone(age, burst) {
  const { cx, half, foot } = clearingTree(), n = Math.min(90, 16 + age * 4);
  for (let i = 0; i < n; i++) {
    const angle = noise(i, 51, 0) * Math.PI * 2 + age * (0.3 + noise(i, 51, 1) * 0.25 + age * 0.012);
    let r = half * (1.15 + noise(i, 51, 2) * 1.4);
    if (burst >= 0) r += burst * burst * W * 0.04;
    const climb = foot - ((noise(i, 51, 3) * foot + age * (2 + noise(i, 51, 4) * 2)) % foot);
    const x = cx + Math.cos(angle) * r, y = climb + Math.sin(angle) * r * 0.18;
    if (Math.sin(angle) < 0 && Math.abs(x - cx) < half) continue;   // behind the trunk
    const [lit, dark] = S.leaves[i % S.leaves.length], flip = (age + i) % 4 < 2;
    put(x, y, lit); put(x + 1, y, flip ? lit : dark); put(x, y + 1, dark); put(x + 1, y + 1, flip ? dark : S.firefly[1]);
    if (i % 3 === 0) put(x + 2, y + (flip ? 0 : 1), dark);
  }
}

/** An oval glow, white at its heart. */
function heartGlow(cx, cy, r, [core, mid, edge]) {
  for (let y = -Math.ceil(r * 1.5); y <= r * 1.5; y++) for (let x = -Math.ceil(r); x <= r; x++) {
    const d = (x / r) ** 2 + (y / (r * 1.5)) ** 2;
    if (d <= 1 && (d < 0.5 || dither(cx + x, cy + y) < 11)) put(cx + x, cy + y, d < 0.2 ? core : d < 0.6 ? mid : edge);
  }
}

/** Returns how many pixels the picture shakes this frame. */
function drawClearingAwakening(t) {
  const awake = bossPrelude.phase === 'awake', age = Math.max(0, t - bossPrelude.at);
  const { hx, hy } = clearingTree(), [hot, glow] = S.firefly, white = abgr('#fffce8');

  // the light drains to a deep forest green as the tree wakes (the sky stays a touch dim over the fight)
  const dim = awake ? 0.15 : Math.min(0.42, age / BLOOM_AT * 0.42), shade = abgr('#0c2a1c');
  for (let i = 0; i < W * H; i++) if (sky[i] || !awake) blend(i % W, (i / W) | 0, shade, dim);

  if (awake) {
    wakingRoots(age, 0.35, true); sapVeins(age, 1, true); bloomWave(age, true);
    heartGlow(hx, hy, 3 + (Math.sin(age * 0.75) + 1), [white, hot, glow]);
    return 0;
  }
  sapVeins(age, Math.min(1, age / 16), false);
  wakingRoots(age, Math.max(0, (age - 4) / 16), false);
  bloomWave(age, false);
  const e = age - BLOOM_AT;
  leafCyclone(age, e);

  if (e < 0) {
    const s = age / BLOOM_AT, beat = Math.max(0, Math.sin(age * (0.8 + s * 2.2))), r = 3 + s * 8 + beat * (2 + s * 4);
    // motes of light rise off the meadow and spiral into the heartwood
    for (let i = 0; i < 48; i++) {
      const a = age - i * 0.35;
      if (a < 0) continue;
      const lap = (a / 9) | 0, u = (a % 9) / 9, gx = noise(i, lap, 55) * W, gy = horizon + 4 + noise(i, lap, 56) * (H - horizon - 4);
      const swirl = Math.sin(u * 7 + i) * (1 - u) * 8, x = gx + (hx - gx) * u * u + swirl, y = gy + (hy - gy) * u * u;
      put(x, y, u > 0.7 ? white : hot); put(x, y + 1, glow);
    }
    // rays wheel out of it as it nears bursting
    if (s > 0.4) for (let k = 0; k < 10; k++) {
      const ang = k * Math.PI / 5 + age * 0.15, len = (s - 0.4) / 0.6 * W * 0.5;
      for (let d = r + 2; d < len; d++) {
        const x = hx + Math.cos(ang) * d, y = hy + Math.sin(ang) * d * 0.8;
        if (dither(x | 0, y | 0) < 7) tint(x, y, 1.25, 40);
      }
    }
    heartGlow(hx, hy, r, [white, hot, glow]);   // beating faster and faster
    return age > 2 ? (age > 12 ? 2 : 1) : 0;
  }
  // it bursts: a white flash, and the heartwood unfurls into one colossal blossom that gusts petals across the meadow
  if (e === 0) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tint(x, y, 1.35, 70);
  const big = blossomSize(), open = Math.min(1, (e + 1) / 3) ** 0.7;
  shockRing(hx, hy + 4, e * W * 0.13, [white, hot], 0.45);
  giantBlossom(hx, hy, big * open, age, BLOSSOM());
  heartGlow(hx, hy, Math.max(2, 5 - e * 0.4), [white, white, hot]);
  petalGale(hx, hy, e);
  return e < 4 ? 2 : 1;
}

const BLOSSOM = () => ['#a8406e', '#f07aa8', '#ffc4dc', '#f8e048'].map(abgr);
const blossomSize = () => Math.round(Math.min(W * 0.3, H * 0.28));

/** A five-petalled blossom of radius r round (cx, cy), turning slowly: a dark rim, a pale vein down each petal and a
    gold heart; `[rim, petal, lit, heart]` its colours. */
function giantBlossom(cx, cy, r, spin, [rim, petal, lit, heart]) {
  if (r < 2) return;
  const turn = spin * 0.04, white = abgr('#fffce8');
  for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) {
    const d = Math.hypot(x, y), a = Math.atan2(y, x) - turn, lobe = Math.abs(Math.cos(a * 2.5));
    const edge = r * (0.3 + 0.7 * lobe ** 0.5);
    if (d > edge) continue;
    const c = d < r * 0.16 ? (d < r * 0.07 ? white : heart)
      : edge - d < 1.3 ? rim
      : lobe > 0.97 && d < edge * 0.85 ? white
      : d < edge * 0.55 || (lobe > 0.8 && dither(cx + x, cy + y) < 8) ? lit : petal;
    put(cx + x, cy + y, c);
  }
}

/** Petals flung out of the blossom `e` frames after it opens, gusting sideways across the screen and fluttering down. */
function petalGale(cx, cy, e) {
  const [rim, petal, lit] = BLOSSOM();
  for (let i = 0; i < 110; i++) {
    const a = e - noise(i, 71, 0) * 5;
    if (a < 0) continue;
    const side = i % 2 ? 1 : -1, speed = W * (0.05 + noise(i, 71, 1) * 0.09);
    const x = cx + side * (blossomSize() * 0.4 + a * speed);
    const y = cy + (noise(i, 71, 2) - 0.25) * H * 0.85 * Math.min(1, a / 2.5) + Math.sin(a * 1.9 + i) * 2 + a * a * 0.35;
    const flip = (a * 2 + i | 0) % 2;
    put(x - side, y, lit); put(x - side * 2, y + 1, petal);
    for (let k = 3; k < 6; k++) if (dither(x - side * k | 0, y | 0) < 8 - k) put(x - side * k, y, petal);
    put(x, y, flip ? lit : petal); put(x + 1, y, flip ? petal : lit); put(x + 2, y + 1, rim);
    put(x, y + 1, petal); put(x + 1, y + 1, flip ? rim : petal); put(x + 1, y - 1, flip ? lit : petal);
  }
}

function drawBossAwakening(t) {
  if (S.raw.backdrop === 'shrine') return drawShrineAwakening(t);
  if (S.raw.backdrop === 'volcano') return drawWastesAwakening(t);
  return drawClearingAwakening(t);
}

/* ----- the Wastes' boss prelude: the crater wakes up and erupts -----
   The ground shakes, the far wall splits with lava, the lake boils and swells into a dome,
   then bursts into a column of lava that throws bombs across the sky; the column floods sideways into the flash. */

const ERUPT_AT = 20;   // frames into the wake (8 fps) when the dome bursts; the `eruption` sound is timed to it

/** The lake's surface and middle, and the top of the far wall in a column (the first pixel that isn't sky). */
function wastesCrater() {
  const lake = Math.max(4, Math.round(horizon * 0.14));
  return { cx: life.volcano?.x ?? Math.round(W * 0.5), surface: horizon - lake, lake };
}
function wallTopAt(x) {
  x = Math.max(0, Math.min(W - 1, x | 0));
  for (let y = 0; y < horizon; y++) if (!sky[y * W + x]) return y;
  return horizon;
}

/** Glowing fissures running down the far wall, `reach` (0-1) of the way to the lake. */
function wastesFissures(age, reach, dim) {
  const count = Math.max(4, Math.round(W / 40)), { surface } = wastesCrater();
  for (let i = 0; i < count; i++) {
    const x0 = Math.round((i + 0.5 + (noise(i, 1, 0) - 0.5) * 0.6) * W / count), top = wallTopAt(x0);
    const grow = dim ? 1 : Math.max(0, Math.min(1, (reach * 1.4 - i / count * 0.4)));
    const end = top + Math.round((surface - top) * grow);
    const hot = dim ? Math.sin(age / 3 + i) > 0.3 : true;
    for (let y = top + 1; y <= end; y++) {
      const x = x0 + Math.round(Math.sin(y * 0.7 + i * 3) * 1.4 + (noise(i, y >> 2, 2) - 0.5) * 3);
      const tip = y > end - 2 && !dim;
      put(x, y, tip || hot ? S.lava[0] : S.lava[1]);
      put(x + 1, y, dim ? S.lava[2] : S.lava[1]);
      for (const dx of [-2, -1, 2, 3]) if (dither(x + dx, y + age) < (dim ? 3 : 6)) tint(x + dx, y, 1.15, 34);
    }
  }
}

/** The lake boils: bubbles swell, pop into rings and fling a drop. */
function wastesBoil(age, many) {
  const { surface, lake } = wastesCrater();
  for (let j = 0; j < many; j++) {
    const off = (noise(j, 3, 0) * 4) | 0, cycle = ((age + off) / 4) | 0, step = (age + off) % 4;
    const x = Math.round(noise(j, cycle, 4) * W), y = surface + 1 + Math.round(noise(j, cycle, 5) * (lake - 2));
    if (step === 0) put(x, y, S.lava[0]);
    else if (step === 1) { put(x, y - 1, S.lava[0]); put(x - 1, y, S.lava[0]); put(x + 1, y, S.lava[0]); put(x, y, S.lava[0]); }
    else if (step === 2) { for (const dx of [-2, 2]) put(x + dx, y, S.lava[1]); for (const dx of [-1, 1]) put(x + dx, y - 1, S.lava[1]); put(x, y - 3, S.lava[0]); }
  }
}

/** A column of lava shooting from the lake to the top of the screen, `half` pixels either side of x = cx. */
function lavaColumn(cx, from, to, half, age) {
  const white = abgr('#fffce8');
  for (let y = Math.max(0, to); y <= from; y++) {
    const wob = Math.round(Math.sin(y * 0.45 + age * 1.7) * Math.min(2, half * 0.2));
    const w = half + wob + (noise(y, age, 7) < 0.3 ? 1 : 0);
    for (let dx = -w; dx <= w; dx++) {
      const x = cx + dx, rel = Math.abs(dx) / Math.max(1, w);
      if (rel > 0.85 && dither(x, y + age) > 9) continue;
      const crust = noise(x, (y + age * 5) >> 1, 8) < 0.05;
      put(x, y, crust ? S.rock[2] : rel < 0.3 ? white : rel < 0.62 ? S.lava[0] : rel < 0.85 ? S.lava[1] : S.lava[2]);
    }
    for (const side of [-1, 1]) for (let k = 1; k <= 3; k++) if (dither(cx + side * (w + k), y) < 8 - k * 2) tint(cx + side * (w + k), y, 1.2, 40);
  }
}

/** Lava bombs thrown out of the column, arcing high and crashing onto the rim at your feet: the nearer they land, the bigger
    they are, and each leaves a splat that cools from white to rock. Several sub-steps a frame, so the arcs read at 8 fps. */
function lavaBombs(cx, surface, e) {
  const white = abgr('#fffce8');
  for (let i = 0; i < 22; i++) {
    const launch = noise(i, 9, 0) * 5, flight = 3 + noise(i, 9, 1) * 3;
    const lx = cx + (noise(i, 9, 2) - 0.5) * W * 1.2, ly = horizon + 4 + noise(i, 9, 3) ** 0.7 * (H - horizon) * 0.85;
    const arc = horizon * (0.5 + noise(i, 9, 4) * 0.6) + (ly - horizon) * 0.4, near = (ly - horizon) / (H - horizon);
    const size = 1 + Math.round(near * 3);
    const a = e - launch;
    if (a < 0) continue;
    if (a < flight) {
      for (let s = 3; s >= 0; s--) {
        const u = Math.max(0, (a - s * 0.22) / flight), grow = 1 + Math.round((size - 1) * u);
        const x = cx + (lx - cx) * u, y = surface + (ly - surface) * u - arc * 4 * u * (1 - u);
        if (s) { if (dither(x, y + s) < 13 - s * 3) for (let k = 0; k < grow; k++) put(x + k, y, S.ember[s > 1 ? 2 : 1]); continue; }
        for (let dy = 0; dy <= grow; dy++) for (let dx = 0; dx <= grow; dx++) {
          put(x + dx, y + dy, dx + dy === 0 ? white : dx === grow || dy === grow ? S.lava[2] : S.lava[dx + dy < grow ? 0 : 1]);
        }
      }
      continue;
    }
    // the splat: a flattened blob that spits a few drops, then cools
    const cool = a - flight, r = size + 1;
    if (cool > 7) continue;
    const c = cool < 1 ? white : cool < 3 ? S.lava[0] : cool < 5 ? S.lava[1] : cool < 6.5 ? S.lava[2] : S.rock[2];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r * 2; dx <= r * 2; dx++) {
      const d = (dx / (r * 2)) ** 2 + (dy / r) ** 2;
      if (d <= 1 && (d < 0.5 || dither(lx + dx, ly + dy) < 9)) put(lx + dx, ly + dy, d < 0.3 || cool > 4 ? c : S.lava[Math.min(3, (cool | 0) + 1)]);
    }
    if (cool < 3) for (let k = 0; k < 4; k++) put(lx + (k - 1.5) * (2 + cool * 2), ly - (2 - Math.abs(k - 1.5)) * cool, S.ember[0]);
  }
}

/** The rim at your feet splits: glowing cracks run from the lake's edge down towards you, branching as they go. */
function groundFissures(age, reach, dim) {
  const count = Math.max(3, Math.round(W / 70)), top = horizon + 3;
  for (let i = 0; i < count; i++) {
    let x = (i + 0.5 + (noise(i, 21, 0) - 0.5) * 0.5) * W / count;
    const lean = (x - W / 2) / W * 1.2, end = top + (H - top) * Math.max(0, Math.min(1, reach * 1.3 - noise(i, 21, 1) * 0.3));
    for (let y = top; y < end; y++) {
      const near = (y - top) / (H - top), w = dim ? 0 : Math.round(near * 2.2);   // cooled, they stay as hairlines under the fight
      x += lean + (noise(i, y >> 1, 22) - 0.5) * 1.6;
      for (let dx = -w; dx <= w; dx++) put(x + dx, y, dim ? (Math.abs(dx) < w || !w ? S.lava[2] : S.lava[3]) : Math.abs(dx) < Math.max(1, w) ? S.lava[0] : S.lava[1]);
      if (!dim) for (const dx of [-w - 2, -w - 1, w + 1, w + 2]) if (dither(x + dx, y + age) < 7) tint(x + dx, y, 1.2, 40);
      // a branch splits off now and then
      if (noise(i, y, 23) < 0.04) {
        const side = noise(i, y, 24) < 0.5 ? -1 : 1, len = 3 + Math.round(noise(i, y, 25) * 8 * (1 + near));
        for (let k = 1; k <= len; k++) put(x + side * k, y + Math.round(k * 0.6), dim ? S.lava[3] : S.lava[1]);
      }
    }
  }
}

/** Returns how many pixels the picture shakes this frame. */
function drawWastesAwakening(t) {
  const awake = bossPrelude.phase === 'awake', age = Math.max(0, t - bossPrelude.at);
  const { cx, surface, lake } = wastesCrater();

  // the sky reddens as the crater wakes (and stays a little red over the fight)
  const red = awake ? 0.18 : Math.min(0.42, age / ERUPT_AT * 0.42), blood = abgr('#701410');
  for (let y = 0; y < surface; y++) for (let x = 0; x < W; x++) if (sky[y * W + x]) blend(x, y, blood, red * (1 - y / surface * 0.4));

  if (awake) { wastesFissures(age, 1, true); groundFissures(age, 1, true); wastesBoil(age, 5); return 0; }

  wastesFissures(age, Math.min(1, age / 14), false);
  groundFissures(age, Math.max(0, (age - 5) / 17), false);
  wastesBoil(age, 4 + Math.round(Math.min(1, age / ERUPT_AT) * 16));

  // rocks shaken loose from the rim tumble down the wall
  for (let i = 0; i < 12; i++) {
    const start = noise(i, 11, 0) * 16, x = Math.round(noise(i, 11, 1) * W), a = age - start;
    if (a < 0) continue;
    const y = wallTopAt(x) + a * a * 0.5;
    if (y < surface) { put(x, y, S.rock[2]); put(x + 1, y, S.rock[1]); }
  }

  if (age < ERUPT_AT) {
    // the lake's middle swells into a glowing dome
    const s = Math.max(0, (age - 8) / (ERUPT_AT - 8));
    if (s > 0) {
      const hw = 3 + s * W * 0.09, hh = Math.max(1, Math.round(s * lake * 1.3 + s * s * 4));
      for (let dy = -hh - 3; dy <= 0; dy++) for (let dx = -Math.ceil(hw) - 3; dx <= hw + 3; dx++) {
        const d = (dx / hw) ** 2 + (dy / hh) ** 2, x = cx + dx, y = surface + dy;
        if (d < 1) put(x, y, noise(x, (y + age * 3) >> 1, 6) < 0.07 ? S.rock[2] : d < 0.25 ? S.lava[0] : d < 0.6 ? S.lava[1] : S.lava[2]);
        else if (d < 1.6 && dither(x, y + age) < 5) tint(x, y, 1.2, 36);
      }
    }
    return age > 2 ? (age > 12 ? 2 : 1) : 0;
  }

  // the dome bursts: a white flash, then the column and its bombs
  const e = age - ERUPT_AT;
  if (e === 0) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tint(x, y, 1.35, 70); }
  const reach = Math.min(1, (e + 1) / 2.5), top = surface - Math.round((surface + 4) * reach);
  lavaColumn(cx, surface, top, Math.round(3 + Math.min(e, 5) * W * 0.02), age);
  lavaBombs(cx, surface, e);
  // a splash ring races out across the lake from the column's foot
  const ring = e * W * 0.12;
  if (e < 5) for (let x = 0; x < W; x++) {
    const d = Math.abs(x - cx);
    if (d > ring - 3 && d < ring) { put(x, surface, S.lava[0]); put(x, surface - 1, S.lava[1]); if (dither(x, e) < 6) put(x, surface - 2, S.ember[0]); }
  }
  return 2;
}

/** The column floods sideways into a curtain of lava that fills the screen, then the white flashes. */
function drawWastesPortal(t) {
  const age = Math.max(0, t - bossPrelude.at), frame = age | 0;
  if (frame === 6 || frame === 8) { px.fill(abgr('#fffce8')); return 0; }
  const { cx, surface } = wastesCrater();
  groundFissures(age, 1, false);
  for (let y = surface; y <= horizon; y++) for (let x = 0; x < W; x++) if (dither(x, y + age) < 10) put(x, y, S.lava[1]);
  const half = Math.round(W * 0.04 + W * 0.62 * Math.min(1, (age / 5) ** 2));
  const white = abgr('#fffce8');
  for (let y = 0; y < H; y++) {
    const edge = half + Math.round(Math.sin(y * 0.9 + age * 2) * 2 + noise(y, age, 12) * 3);
    for (let dx = -edge - 3; dx <= edge + 3; dx++) {
      const x = cx + dx, rel = Math.abs(dx) / Math.max(1, edge);
      if (rel > 1) { if (dither(x, y + age) < 6) put(x, y, S.lava[2]); continue; }
      put(x, y, rel > 0.5 && noise(x, (y + age * 6) >> 1, 13) < 0.05 ? S.rock[2] : rel < 0.45 ? white : rel < 0.75 ? S.lava[0] : S.lava[1]);
    }
  }
  lavaBombs(cx, surface, age + 9);
  return frame < 6 ? 2 : 0;
}

/** Which sound each boss prelude plays, and on which frame of its wake. */
const preludeSounds = () => ({
  hills: [[0, 'quake'], [BLOOM_AT, 'bloom']],
  shrine: [...BELL_TOLLS.map(at => [at, 'bell']), [SPIRIT_AT, 'spirit']],
  volcano: [[0, 'quake'], [ERUPT_AT, 'eruption']],
});

/** A flattened ring of radius r racing outwards. */
function shockRing(cx, cy, r, [inner, outer], squash) {
  if (r < 1) return;
  for (let a = 0; a < Math.PI * 2; a += 0.7 / r) {
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * squash;
    put(x, y, inner); put(x, y + 1, outer);
    if (dither(x | 0, y | 0) < 8) put(x, y - 1, outer);
  }
}

/** Flowers burst open all over the screen in a wave out from the great blossom until they cover it, then the white flashes. */
function drawClearingPortal(t) {
  const age = Math.max(0, t - bossPrelude.at), frame = age | 0, white = abgr('#fffce8');
  if (frame === 6 || frame === 8) { px.fill(white); return 0; }
  const { hx, hy } = clearingTree(), shade = abgr('#0c2a1c'), [rim, , lit] = BLOSSOM();
  for (let i = 0; i < W * H; i++) blend(i % W, (i / W) | 0, shade, 0.42);   // still the gloom the wake brought
  petalGale(hx, hy, age + 9);
  giantBlossom(hx, hy, blossomSize() * (1 + age * 0.12), age + 30, BLOSSOM());
  const cell = Math.max(10, Math.round(Math.min(W, H) / 4)), far = Math.hypot(W, H);
  const looks = [BLOSSOM(), [rim, lit, white, abgr('#f8e048')], ...S.flowers.map(([p, h]) => [rim, p, white, h])];
  let n = 0;
  for (let gy = -cell / 2; gy < H + cell; gy += cell * 0.8) for (let gx = -cell / 2; gx < W + cell; gx += cell * 0.8, n++) {
    const x = gx + (noise(n, 81, 0) - 0.5) * cell * 0.6, y = gy + (noise(n, 81, 1) - 0.5) * cell * 0.6;
    const grow = Math.min(1, Math.max(0, (age - Math.hypot(x - hx, y - hy) / far * 3.5) / 1.6));
    giantBlossom(x, y, cell * 0.95 * grow, age * (n % 2 ? 1 : -1) + n * 9, looks[n % looks.length]);
  }
  return frame < 6 ? 2 : 0;
}

/** The Shrine hands off through the Main Hall itself: its shoji doors slide apart, spirit light pours out of the doorway
    and floods the screen, paper wards streaming from the roof, before the paired white flashes. */
function drawShrinePortal(t) {
  const age = Math.max(0, t - bossPrelude.at), frame = age | 0;
  if (frame === 6 || frame === 8) { px.fill(abgr('#fffce8')); return 0; }

  const hall = shrineHall(), [core, spirit, trail] = S.wisp, indigo = abgr('#0a1034');
  for (let i = 0; i < W * H; i++) blend(i % W, (i / W) | 0, indigo, 0.5);   // still the night the wake brought
  const [woodLit, wood, woodShade, woodDark] = S.marks.wood;
  const paper = S.marks.paper, vermilion = S.marks.red[0];
  const opening = Math.min(1, age / 2.2), cx = hall.gx;
  const doorHalf = Math.max(3, Math.round(hall.half * 0.13));
  const top = hall.eave + Math.max(2, Math.round(hall.tall * 0.42));
  const bottom = Math.max(top + 3, horizon - hall.base - 1);
  const slide = Math.round(doorHalf * opening);

  // Darken the doorway first, then reveal a bright interior through the widening gap.
  for (let y = top; y <= bottom; y++) {
    solid(cx - doorHalf - 2, y, woodDark);
    solid(cx + doorHalf + 2, y, woodDark);
    for (let x = -doorHalf - 1; x <= doorHalf + 1; x++) solid(cx + x, y, S.trees[3]);
    for (let x = -slide + 1; x < slide; x++) {
      if (dither(cx + x, y + age) < 12) put(cx + x, y, y < top + 2 ? core : spirit);
    }
  }

  // A carved lintel and frame make the opening read as the Hall, not a generic portal.
  for (let x = -doorHalf - 3; x <= doorHalf + 3; x++) {
    solid(cx + x, top - 1, woodLit);
    solid(cx + x, top, woodShade);
    solid(cx + x, bottom + 1, woodDark);
  }
  for (let y = top - 1; y <= bottom + 1; y++) {
    solid(cx - doorHalf - 3, y, woodLit);
    solid(cx - doorHalf - 2, y, woodShade);
    solid(cx + doorHalf + 2, y, woodShade);
    solid(cx + doorHalf + 3, y, woodDark);
  }

  // The two paper doors slide away from the center; their lattice stays visible in the glow.
  for (const side of [-1, 1]) {
    const left = side < 0 ? cx - doorHalf - slide : cx + slide;
    for (let y = top + 1; y < bottom; y++) for (let x = 0; x < doorHalf; x++) {
      const pxX = left + x, lattice = x === 0 || x === doorHalf - 1 || y === top + 2 || y === bottom - 1;
      solid(pxX, y, lattice ? (x === 0 ? woodLit : woodShade) : paper);
      if (!lattice && ((x + y) % 4 === 0)) put(pxX, y, side < 0 ? wood : woodLit);
    }
  }

  // The seal spins tight round the doorway while ofuda stream sideways off the roof.
  const doorY = Math.round((top + bottom) / 2);
  spiritSeal(cx, doorY, Math.round(Math.min(W * 0.3, H * 0.3) * (1 - opening * 0.4)), 1, age * 4, 1, 1);
  for (let i = 0; i < 5; i++) for (const side of [-1, 1]) {
    const flight = Math.max(0, Math.min(1, age / 2.2 - i * 0.13));
    if (!flight) continue;
    const x = cx + side * Math.round(doorHalf + 2 + flight * (hall.half * 0.72 + i));
    const y = Math.max(0, hall.eave - Math.round(flight * (3 + i * 1.5)) + Math.round(Math.sin(t + i * 2) * 1.5));
    put(x, y, paper); put(x, y + 1, paper); put(x, y + 2, i % 2 ? vermilion : trail);
    put(x - side, y + 1, i % 2 ? vermilion : trail);
  }

  // then the spirit light pours out of the open doors in rippling rings and floods the screen, wards tumbling in it
  if (age > 2) {
    const R = doorHalf + Math.hypot(W, H) * 1.2 * Math.min(1, ((age - 2) / 4) ** 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x - cx, dy = y - doorY, d = Math.hypot(dx, dy);
      const edge = R + Math.sin(Math.atan2(dy, dx) * 9 + age * 2) * 2 + noise(x >> 2, y >> 2, 64) * 3;
      if (d > edge + 3) continue;
      const rel = d / Math.max(1, edge);
      if (rel > 1) { if (dither(x, y + age) < 6) put(x, y, trail); continue; }
      const n = noise(x >> 1, (y + age * 6) >> 2, 63), band = ((d - age * 3) / 4 | 0) % 3 === 0;
      put(x, y, n < 0.03 ? vermilion : n < 0.08 ? paper : rel < 0.45 ? core : band ? trail : rel < 0.75 ? spirit : trail);
    }
  }
  return frame < 6 ? 1 : 0;
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
  const p = dial(), reach = 12 + p * 10;   // thicker and deeper further in
  for (let y = horizon - 8 - Math.round(p * 6); y < horizon + 2 + reach && y < H; y++) {
    const fade = 1 - Math.abs(y - horizon - 2) / reach;
    for (let x = 0; x < W; x++) {
      const m = Math.sin((x + t * 0.5) / 13 + y * 0.6) + Math.sin((x - t * 0.3) / 7 + y * 0.2);
      if (m > 1.1 - fade * 0.6 - p * 0.5 && dither(x, y) < 3 + fade * 9 + p * 4) tint(x, y, 0.8, S.mist);
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
    const rise = age * (erupting ? 1.1 : 0.7), r = (2.5 + age * (erupting ? 0.22 : 0.16)) * v.near;
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
  const L = life, glow = S.raw.crackGlow + dial() * 0.4;
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
    if (storm.on && !storm.thundered) { storm.thundered = true; playSound('thunder'); }   // once a storm (the user found it repeating too much); the lightning goes on silently
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

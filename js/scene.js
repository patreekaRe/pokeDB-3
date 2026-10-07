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
import { paintArena } from './tower-art.js';
import { battleFx, calmFx } from './prefs.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FPS = 8;   // the scenery's clock: everything below is timed in these ticks a second
const RATE = 30, DT = FPS / RATE;   // drawn this many times a second, the clock moving DT ticks a frame
const dither = (x, y) => BAYER[(((y | 0) % 4 + 4) % 4) * 4 + (((x | 0) % 4 + 4) % 4)];

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

/* The Crystal Depths, Mewtwo's own biome (v1.0): a cavern under the three biomes where Eternatus's energy leaks out of
   the rock (painted by depthsBackdrop() / depthsFloor() / depthsFront(), its life in drawDepths()). No clock: underground
   every hour is the same, so it has only a `day` look. Each place is its own palette (`voids`, `rocks`, `floors`, by
   stage); the glowing colours (crystal, amethyst, ruby, energy...) are GLOWS, so an elite's or boss's grade leaves them lit. */
BIOME_ART.depths = {
  backdrop: 'depths', floor: 'depths', light: null,
  storm: { rain: ['#ffd8f4', '#e04cb0'], fall: 1.3, count: 0.7, sky: [0.72, 50, 0, 26], ground: [0.8, 28, 0, 14] },   // a fall of red crystal dust
  sky: ['#020208', '#131c30'],
  voids: [   // the dark at the far end of the cavern, top to horizon
    ['#020208', '#04060e', '#070a16', '#0a101e', '#0e1626', '#121c2e', '#16223a'],
    ['#05030c', '#0a0718', '#100c24', '#171230', '#1f183e', '#281e4c', '#30245a'],
    ['#060206', '#0c040a', '#140610', '#1c0816', '#280a1c', '#360c22', '#460e2a'],
    ['#070206', '#10040a', '#1a0610', '#260816', '#340a1c', '#460c24', '#5a0e2c'],
  ],
  rocks: [   // the walls: lit, body, shade, deep, line
    ['#5c5e7c', '#46485e', '#34364a', '#242638', '#101020'],
    ['#6c5c98', '#52467a', '#3e3460', '#2a2446', '#141026'],
    ['#4c3448', '#382638', '#281a2a', '#1a111c', '#0a050a'],
    ['#50344e', '#3c243c', '#2c182e', '#1e0f20', '#0c040c'],
  ],
  floors: [   // the ground, horizon to the bottom
    ['#3a3a52', '#35354c', '#303046', '#2b2b40', '#262638', '#202030'],
    ['#4a4070', '#443a68', '#3e3460', '#382e58', '#30284c', '#2a2242'],
    ['#30222e', '#2a1d29', '#251924', '#20151f', '#1b111a', '#160d15'],
    ['#2e1e2e', '#291a2a', '#241625', '#1f1220', '#1a0e1b', '#140a15'],
  ],
  crystal: ['#ffffff', '#b8f4ff', '#58d0f0', '#2a7ab8', '#143e6e'],
  amethyst: ['#fff4ff', '#e8b8ff', '#b070f0', '#7038c0', '#381870'],
  ruby: ['#fff0f4', '#ff9ac8', '#f03c80', '#a81450', '#500828'],
  energy: ['#fff4fa', '#ff8ae0', '#f0349a', '#a8106a', '#4a0630'],
  shroom: ['#e8fff6', '#68f0c8', '#20a890', '#145c58'],
  daylight: ['#fffbe8', '#e0f0ff', '#b0d0f0'],
  lamp: ['#fff4c0', '#f8c050', '#c07020'],
  mote: ['#e8ffff', '#88e0f8'],
  moss: ['#5a9a6a', '#3e7a54', '#285a40'],
  water: ['#a8f0ff', '#48b0d8', '#206898', '#0e3458'],
  wood: ['#a07850', '#704e30', '#46301c', '#20140a'],
  metal: ['#b8b8c8', '#7c7c94', '#4c4c60', '#24242e'],
  times: {
    day: {
      life: ['depths'],
      pad: { style: 'rock', top: '#5e5a80', mid: '#4a466a', low: '#3a3656', rim: '#0c0a16', earth: '#221e36', lava: '#7ae8ff' },
      padDeep: { style: 'rock', top: '#4e3650', mid: '#3e2a40', low: '#301e32', rim: '#0a040a', earth: '#1c0e1c', lava: '#ff5ab0' },
    },
  },
  kinds: {
    elite: { grade: 'elite' },
    boss: { grade: 'boss' },
  },
};

/* ---------- the Safari Zone's six areas (roadmap phase 5b) ----------
   One look for the whole Zone (a ranch fence along the back, the games' tall grass in the near corners, the Zone's
   green signboard at an area's entrance and a rest house by its boss) over each area's own land (`area`, painted by
   safariBackdrop() / safariFloor()). Each area's floors are its `stages` (js/data/safari.js): its painters ask stage()
   for what changes, and every floor deals its props from its own seed. Only the day is hand-painted; the other times
   are it graded under their own sky. */
const SAFARI_MARKS = {
  ...BIOME_ART.clearing.marks,
  wood: ['#e8b878', '#b88048', '#7a5028', '#3a2410'],
  sign: ['#fff8e0', '#e8dcb0', '#48a848', '#2a7030', '#3a2410'],   // the board, its shade, the Zone's green band and its shade, the lettering
  roof: ['#68c058', '#3e9038', '#245a22'], wall: ['#fff4dc', '#e0cca0', '#a88c60'],
  rope: ['#f0dca0', '#b09060'], straw: ['#f8e090', '#d8b858', '#9a7a34', '#5a4420'],
};
const safariTimes = ({ dawn, dusk, night }) => ({
  dawn: { from: 'day', sunLow: true, sky: ['#6a7cc0', '#8a8cc8', '#b09ccc', '#d4a8c4', '#eeb8b4', '#f8cca8', '#f8e0b8'], sun: ['#fffcec', '#fff0b8', '#f8d898'], ...dawn },
  dusk: { from: 'day', sunLow: true, sky: ['#3a3a78', '#584a8c', '#8a5a94', '#c46a84', '#ec8a6c', '#f8ac70', '#f8cc90'], sun: ['#fff4d0', '#f8c868', '#f08848'], ...dusk },
  night: { from: 'day', light: 'moon', stars: true, sky: ['#080a24', '#0e1234', '#141a44', '#1c2452', '#262e60', '#30386a', '#3c4474'], ...night },
});
const SAFARI_ART = {
  meadow: {   // open grassland: rolling hills, flat-topped trees far off, golden-green grass, a dirt track
    light: 'sun',
    storm: { rain: ['#e0ecff', '#98b0d8'], fall: 3.5, count: 1, sky: [0.55, 4, 8, 22], ground: [0.72, 0, 2, 10] },
    sun: ['#fffce8', '#fff0a0', '#f8e070'],
    cloud: ['#ffffff', '#eef4fb', '#c8dcee', '#a8c4e0'], clouds: { count: 1.1, shadows: true },
    sky: ['#4a98e8', '#5ea8ee', '#74b8f2', '#8cc8f6', '#a6d6f8', '#c0e4f8', '#d8eef4'],
    farHills: ['#b0d4c8', '#9cc4b8'], hills: ['#a8d078', '#90bc64', '#7aa854'],
    trees: ['#88c058', '#62a040', '#468030', '#2e5a24'], trunk: ['#7a5430', '#4e3418'],
    ground: ['#b8dc74', '#aad268', '#9cc85e', '#8ebc54', '#80b04a', '#72a442'],
    blade: ['#d8f498', '#94c858', '#508a34'], patch: '#7cac44',
    tall: ['#78c850', '#4e9a38', '#2e7228', '#164418'],
    trail: [{ at: 0, style: 'dirt', c: ['#f0dca8', '#dcc08a', '#b89c68', '#8aa050'], edge: 'rope' }],
    flowers: [['#ffffff', '#f8d848'], ['#f8e048', '#f89830'], ['#f8a0c8', '#f8f0f8'], ['#f87850', '#f8e8a0']],
    rock: ['#d8d4c8', '#a8a498', '#706c66'],
    butterflies: ['#ffffff', '#f8d848', '#f8a040'], bird: '#34405c',
    pollen: ['#fffce0', '#f8f0a0'], firefly: ['#f8f8a0', '#c8e858'],
    pad: { style: 'grass', top: '#c0e480', mid: '#9cc85e', low: '#78a844', rim: '#3a6a2c', earth: '#8a6a3a', blade: '#d8f498' },
    life: ['clouds', 'birds', 'blades', 'butterflies', 'pollen'],
    times: safariTimes({
      dusk: { life: ['clouds', 'birds', 'blades', 'pollen', 'fireflies'], fireflyCount: 0.5 },
      night: { clouds: { count: 0.5 }, life: ['stars', 'clouds', 'blades', 'fireflies'], fireflyCount: 1.2 },
    }),
  },

  forest: {   // a cool old wood: misty pines behind, broadleaf trees, light falling through, ferns and fallen logs
    light: null,
    storm: { rain: ['#d0e8f0', '#80a0b0'], fall: 3.5, count: 1, sky: [0.55, 0, 10, 18], ground: [0.72, 0, 4, 8] },
    sky: ['#8cbcd8', '#9ec8dc', '#b0d2e0', '#c2dce2', '#d2e6e2'],
    farForest: ['#8cb4a0', '#7aa490'],
    pines: ['#4e9058', '#2e6a40'],
    trees: ['#64b050', '#44903e', '#2c6e32', '#1a4c24'], trunk: ['#6a4a30', '#3e2a1a'],
    ground: ['#6aa44a', '#5e9844', '#528c3e', '#468038', '#3a7432', '#2e682c'],
    blade: ['#a0d070', '#5e9448', '#2e5c2a'], patch: '#3e7a30',
    tall: ['#62b048', '#3e8a36', '#246428', '#103a16'],
    trail: [{ at: 0, style: 'dirt', c: ['#b89a70', '#9a7c56', '#7a5e3e', '#4e7a34'], edge: 'stone' }],
    leaves: [['#d8c050', '#a08828'], ['#88c058', '#5a9040'], ['#e88a38', '#b05a20']],
    flowers: [['#f8f0f8', '#f8d848'], ['#b0a0f8', '#f8f8f8']],
    rock: ['#b8bcb0', '#8a8e82', '#5a5e54'],
    butterflies: ['#f8f8f8', '#f8d848', '#78c8f8'], bird: '#1e3a24',
    pollen: ['#f8fce0', '#e0f0b0'], firefly: ['#f8f8a0', '#c8e858'],
    pad: { style: 'grass', top: '#88c060', mid: '#64a048', low: '#4a8038', rim: '#1e4220', earth: '#5e4430', blade: '#a8d878' },
    life: ['blades', 'leaves', 'butterflies', 'pollen'],
    times: safariTimes({
      dawn: { sky: ['#a898b8', '#bca4b8', '#d0b0b4', '#e0c0b4', '#ecd2bc'] },
      dusk: { sky: ['#3a3460', '#5a4470', '#8a5878', '#b86e74', '#d88c74'], life: ['blades', 'leaves', 'fireflies'], fireflyCount: 0.8 },
      night: { sky: ['#06101e', '#0a1828', '#102034', '#162a40', '#1e344a'], life: ['stars', 'blades', 'fireflies'], fireflyCount: 1.5 },
    }),
  },

  wetland: {   // a bright lake behind a reedy shore: lily pads, a wooden pier, wooded hills across the water
    light: 'sun',
    storm: { rain: ['#e0ecff', '#98b0d8'], fall: 3.5, count: 1.2, sky: [0.55, 4, 8, 22], ground: [0.72, 0, 2, 10] },
    sun: ['#fffce8', '#fff0a0', '#f8e070'],
    cloud: ['#ffffff', '#eef4fb', '#c8dcee', '#a8c4e0'], clouds: { count: 1 },
    sky: ['#4890e8', '#5aa0ee', '#70b2f2', '#88c4f6', '#a2d4f8', '#bce2f8', '#d4eef8'],
    farHills: ['#a0c8d8', '#88b4c8'],
    trees: ['#70c068', '#50a058', '#368048', '#226038'], trunk: ['#7a5430', '#4e3418'],
    lake: ['#c8f0ff', '#90d4f4', '#68bcec', '#4ca4e0', '#3a8cd0'],
    ripple: ['#e8fcff', '#3070b8'], glint: ['#ffffff'],
    lily: ['#68c050', '#3e9038', '#f8a8d0', '#fff4fa'],
    reed: ['#d0e078', '#90b048', '#5a7a30'],
    trail: [
      { at: 0, style: 'dirt', c: ['#ece0b4', '#d8c896', '#b8a874', '#7aa848'], edge: 'post' },
      { at: 1, style: 'planks', c: ['#e8b878', '#c89458', '#8a5e30', '#4a2e14'], edge: 'rail' },   // the boardwalk
    ],
    ground: ['#a0d870', '#90cc62', '#80c056', '#70b44a', '#62a840', '#549c38'],
    blade: ['#c8f090', '#80c050', '#3e8830'], patch: '#5ca23c',
    tall: ['#6cc048', '#46963a', '#2a6e2c', '#123e18'],
    flowers: [['#ffffff', '#f8d848'], ['#a8c8f8', '#ffffff']],
    rock: ['#d0d0c8', '#a0a098', '#6c6c68'],
    butterflies: ['#78d8f8', '#ffffff', '#f8d848'], bird: '#f8f8f8',
    pollen: ['#fffce0', '#f8f0a0'], firefly: ['#f8f8a0', '#c8e858'],
    pad: { style: 'grass', top: '#a8e078', mid: '#80c858', low: '#5ea840', rim: '#2e6a2c', earth: '#6a5a3a', blade: '#c0f088' },
    life: ['clouds', 'birds', 'blades', 'butterflies', 'safari'],
    times: safariTimes({
      dusk: { life: ['clouds', 'birds', 'blades', 'fireflies', 'safari'], fireflyCount: 0.6 },
      night: { clouds: { count: 0.5 }, life: ['stars', 'clouds', 'blades', 'fireflies', 'safari'], fireflyCount: 1.3 },
    }),
  },

  marsh: {   // a grey-green bog under a low sky: drooping willows, dead trees, murky pools, cattails, mist
    light: null,
    storm: { rain: ['#d0e0d8', '#80988c'], fall: 3.5, count: 1.4, sky: [0.55, 0, 6, 10], ground: [0.72, 0, 4, 6] },
    sky: ['#7a8c84', '#8a9a90', '#9aa89c', '#aab6a8', '#bac2b2', '#c8cebc'],
    farForest: ['#7a8a7c', '#6a7a6c'],
    trees: ['#6a8a50', '#527440', '#3e5c34', '#2a4226'], trunk: ['#5a4836', '#3a2e22'],
    dead: ['#8a7c68', '#625646', '#3e342a'],
    bog: ['#9aa898', '#4a5a4a', '#3a4a3e', '#283430'], algae: ['#9ab848', '#6a8a34'], mud: ['#5e5642', '#4c4434'], lily: ['#6a9a48', '#4a7438', '#f8f0f8', '#ffffff'],
    ground: ['#6e8448', '#627842', '#566c3c', '#4a6036', '#3e5430', '#32482a'],
    blade: ['#98b068', '#5e7c40', '#34502a'], patch: '#3e5628',
    tall: ['#6a9048', '#4a7036', '#2e5026', '#162c14'],
    reed: ['#b8b860', '#7e8a3c', '#4e5a28'],
    trail: [{ at: 0, style: 'planks', c: ['#a8987a', '#8a7a5e', '#6a5a44', '#2e261c'], edge: 'stake' }],   // an old plank walkway over the bog
    mist: 36, mistColour: '#e0e8e0',
    flowers: [['#f8f0f8', '#f8e070']],
    rock: ['#a0a494', '#767a6a', '#4e5246'],
    firefly: ['#e8f8a0', '#a8d858'], bird: '#2a3428', butterflies: ['#c8d878'],
    pad: { style: 'grass', top: '#7e9a58', mid: '#647e46', low: '#4e6638', rim: '#1e2e18', earth: '#4a3e2c', blade: '#9ab870' },
    life: ['mist', 'blades', 'fireflies', 'safari'], fireflyCount: 0.3,
    times: safariTimes({
      dawn: { sky: ['#8a8098', '#9c8ea0', '#b09ea4', '#c2aea8', '#d2bcae', '#dccab8'] },
      dusk: { sky: ['#2e2c44', '#443a52', '#60485a', '#7c5a60', '#987068', '#ae8470'], fireflyCount: 0.9 },
      night: { sky: ['#060c10', '#0a141a', '#0e1c22', '#14242a', '#1a2c32', '#203438'], fireflyCount: 1.6 },
    }),
  },

  peak: {   // the mountainside: snow-capped peaks, pines dusted white, alpine grass giving way to snowfields
    light: 'sun',
    storm: { rain: ['#ffffff', '#c8d8f0'], fall: 1.2, count: 1.4, sky: [0.6, 10, 14, 30], ground: [0.78, 8, 10, 24] },   // a snowstorm
    sun: ['#ffffff', '#fffce0', '#f8f0c0'],
    cloud: ['#ffffff', '#f0f6fc', '#d0e0f0', '#b0c8e0'], clouds: { count: 0.9 },
    sky: ['#3880d8', '#4a90e0', '#60a2e8', '#7ab6f0', '#96c8f4', '#b4dcf8', '#d2ecfa'],
    range: ['#b0c4e0', '#98aed0', '#8098c0'], snow: ['#ffffff', '#e4eef8', '#bccfe6'],
    cliff: ['#a8a8b4', '#86868e', '#62626c', '#3e3e46'],
    pines: ['#4a8462', '#2c5c46'], trunk: ['#5a4030', '#38281c'],
    ground: ['#b0c890', '#a0bc84', '#90b078', '#80a46c', '#729862', '#648c58'],
    snowField: ['#ffffff', '#f2f8fc', '#e4eef8', '#d6e2f2', '#c8d8ec', '#bacce4'],
    blade: ['#d0e4b0', '#90ac78', '#566e48'], patch: '#6e8e56',
    tall: ['#88b870', '#5e9054', '#3a6a3e', '#1c3e24'],
    trail: [
      { at: 0, style: 'dirt', c: ['#d0c4a8', '#b0a488', '#8c8068', '#6a7a50'], edge: 'pole' },
      { at: 2, style: 'snow', c: ['#ffffff', '#e4ecf6', '#b8c6dc', '#c8d8ec'], edge: 'pole' },   // a track trodden in the snow
    ],
    pole: ['#ffffff', '#f07830', '#a84818'],
    flowers: [['#b0a0f8', '#ffffff'], ['#ffffff', '#f8e048']],
    rock: ['#d0d0d8', '#9c9ca8', '#6a6a78'],
    bird: '#3a4058', flake: ['#ffffff', '#d8e4f4'],
    pad: { style: 'stone', top: '#c8ccd4', mid: '#a8acb6', low: '#8a8e98', rim: '#3a3e48', earth: '#5e626c', moss: '#ffffff' },
    life: ['clouds', 'birds', 'blades', 'safari'],
    times: safariTimes({
      dawn: { sky: ['#5a6cb8', '#7a7cc0', '#a08cc4', '#c89cc0', '#e8b0b8', '#f8c8b4', '#fce0c8'] },
      night: { clouds: { count: 0.4 }, life: ['stars', 'clouds', 'blades', 'safari'] },
    }),
  },

  desert: {   // sand to the horizon: dunes, far mesas, cacti, sun-bleached bones, an oasis at the end
    light: 'sun',
    storm: { rain: ['#f8e8b8', '#d8b878'], fall: 2.6, count: 1.2, sky: [0.75, 30, 16, 0], ground: [0.85, 20, 10, 0] },   // a sandstorm
    sun: ['#fffff0', '#fff8c0', '#f8e890'],
    cloud: ['#ffffff', '#f8f4ec', '#e8dcc8', '#d0c0a8'], clouds: { count: 0.4 },
    sky: ['#3a88e0', '#529ae6', '#70aeea', '#90c2ec', '#b2d4ea', '#d0e0e0', '#ece8cc'],
    farDunes: ['#ecd4a0', '#dcc08a'], dunes: ['#f4dca4', '#e4c486', '#c8a46a'],
    mesas: ['#e89a68', '#c87448', '#a05838', '#7a402c'], farMesas: ['#d8a888', '#c8987a'],
    ground: ['#f6e0a8', '#f0d8a0', '#e8ce94', '#dec288', '#d4b67e', '#c8aa72'],
    blade: ['#e8d890', '#b8a058', '#7a6a34'], patch: '#d2b47a',
    tall: ['#d8c870', '#b0a048', '#7e7430', '#4a4418'],
    cactus: ['#80a850', '#5a8a3c', '#3a5e28'],
    bone: ['#fffcf0', '#d8d0bc', '#8a8070'],
    palm: ['#80c858', '#50983c', '#2e6a2a'], palmTrunk: ['#c09060', '#8a6438', '#5a4022'],
    lake: ['#c8f0ff', '#90d4f4', '#68bcec', '#4ca4e0', '#3a8cd0'], glint: ['#ffffff'],
    weed: ['#c8a868', '#8a6c3c'],
    trail: [{ at: 0, style: 'sand', c: ['#fff0cc', '#f0dcb0', '#d8bc88', '#e0c890'], edge: 'stone' }],
    dead: ['#e0d0b8', '#b0a088', '#7a6a58'],
    rock: ['#e0c8a0', '#b09070', '#7a604a'],
    bird: '#3a2a28', ember: ['#fff8d8', '#f8e8b0', '#e8d090'], embers: 0.25,
    pad: { style: 'sand', top: '#f8e4b0', mid: '#e8cc94', low: '#d0b07a', rim: '#7a5a34', earth: '#a8844e', blade: '#c8a868' },
    life: ['clouds', 'birds', 'safari'],
    times: safariTimes({
      dusk: { sky: ['#2c1e50', '#4a2a62', '#7a3a6a', '#b0506a', '#e07060', '#f89a5a', '#f8c06a'] },
      night: { clouds: { count: 0.3 }, life: ['stars', 'safari'] },
    }),
  },
};
for (const [area, art] of Object.entries(SAFARI_ART)) {
  BIOME_ART[area] = {
    backdrop: 'safari', floor: 'safari', area, kin: { meadow: 'clearing', forest: 'shrine', wetland: 'clearing', marsh: 'shrine', peak: 'clearing', desert: 'wastes' }[area],
    marks: SAFARI_MARKS, ...art,
    times: { day: {}, ...art.times },
    kinds: {
      elite: { grade: 'elite' },
      boss: { grade: 'boss', clouds: { count: 1.4, shadows: art.clouds?.shadows } },
    },
  };
}
/* The Sunken Ruins (roadmap item 19): a temple drowned in a jungle lagoon, painted by ruinsBackdrop() / ruinsFloor() /
   ruinsFront(), its water rippled by drawRuins(). Its ? events' outdoor props are dressed like the Shrine's (`kin`); its
   treasure grotto is its own. The runes (`rune`) glow of their own accord. */
BIOME_ART.ruins = {
  kin: 'shrine',
  backdrop: 'ruins', floor: 'ruins', light: 'sun',
  storm: { rain: ['#d8f0f8', '#78a8c0'], fall: 3.8, count: 1.2, sky: [0.5, 0, 8, 20], ground: [0.7, 0, 6, 12] },
  sun: ['#fffce8', '#fff0a0', '#f8e070'],
  cloud: ['#ffffff', '#eef8fb', '#c8e4ee', '#a8cce0'],
  trunk: ['#8a7050', '#5a4430'],
  rune: ['#f0fffc', '#8af8e8', '#2ec8c0'],
  pollen: ['#fffce8', '#e0f8e8'],
  firefly: ['#e8ffb8', '#a8f0a0'],
  bird: '#2e4a58',
  marks: {
    stone: ['#f0e2bc', '#cdbb90', '#9c8a64', '#4a3e2c'],
    block: ['#f0e2bc', '#cdbb90', '#ab9970', '#7c6c4e', '#463a2a'],
    moss: ['#a0d060', '#6aa044', '#447a36'],
    vine: ['#8ac858', '#559a3c', '#2e6a2c'],
    water: ['#f0ffff', '#8ae0d8', '#46b4b8', '#1f7c8c', '#0f4a5a'],
    lily: ['#8ccc58', '#549c3c', '#2e6a2a'],
    lotus: ['#fff4f8', '#f8a0c4', '#d05890'],
    gold: ['#fff0a0', '#e0b448', '#9a7428'],
    clay: ['#f0a868', '#c87040', '#8a4424', '#40200e'],
    bronze: ['#e0b070', '#a87440', '#6a4424', '#2e1c10'], patina: ['#8ad0b0', '#4a9078'],
    wood: ['#c8945c', '#8e6034', '#5c3a1e', '#2e1c0c'], rope: ['#e8d8a0', '#b0a070'],
    red: ['#f89878', '#c05a48'], paper: '#f8f4e8',
    steam: ['#f4fcfc', '#c8e4e4'],
  },
  times: {
    day: {   // a bright tropical day over the lagoon
      sky: ['#3a8ad8', '#4a9ae0', '#5eaae6', '#76bcec', '#90ccf0', '#acdcf2', '#c8ecf4'],
      far: ['#b4dcd4', '#94c4c0', '#7cb0b0'],
      jungle: ['#62c070', '#44a058', '#2c7c46', '#1c5634'],
      clouds: { count: 0.8 },
      life: ['clouds', 'birds', 'ruins'],
      pad: { style: 'stone', top: '#dccca4', mid: '#c0ae84', low: '#9e8c66', rim: '#3a3226', earth: '#3a8a8c', moss: '#6aa044' },
    },
    dusk: {   // sunset gilds the stone and turns the lagoon to copper
      sunLow: true,
      sky: ['#30306e', '#4e3e82', '#7e4c8c', '#b85c80', '#e8806a', '#f8a868', '#f8c890'],
      sun: ['#fff4d0', '#f8c868', '#f08848'],
      cloud: ['#f8d8c8', '#eab0a8', '#c07890', '#8a5078'],
      far: ['#a07890', '#886480', '#704e6c'],
      jungle: ['#5c7c48', '#40603c', '#2c4630', '#1a2e22'],
      clouds: { count: 0.7 },
      life: ['clouds', 'birds', 'ruins', 'fireflies'], fireflyCount: 0.4,
      pad: { style: 'stone', top: '#c8a888', mid: '#a88c70', low: '#86705a', rim: '#2a2018', earth: '#4a5a6a', moss: '#5a7a40' },
    },
    night: {   // moonlight on the water, the runes awake
      light: 'moon', stars: true,
      sky: ['#060c22', '#0a1430', '#0e1c3e', '#14264c', '#1a305a', '#223a66', '#2a4470'],
      cloud: ['#8088b0', '#646c94', '#4a5278', '#363c5e'],
      far: ['#2a425c', '#22364e', '#1a2c42'],
      jungle: ['#1e4a40', '#163a34', '#0e2c28', '#081e1c'],
      trunk: ['#3a3430', '#26201e'],
      clouds: { count: 0.4 },
      life: ['stars', 'clouds', 'ruins', 'fireflies'], fireflyCount: 1.1,
      pad: { style: 'stone', top: '#6a7480', mid: '#56606c', low: '#444e5a', rim: '#0e141a', earth: '#1a3a48', moss: '#2e5a48' },
    },
    dawn: {   // first light: rose and gold over a still lagoon
      from: 'day', sunLow: true,
      sky: ['#6a7cc0', '#8a8cc8', '#b09ccc', '#d4a8c4', '#eeb8b4', '#f8cca8', '#f8e0b8'],
      sun: ['#fffcec', '#fff0b8', '#f8d898'],
      cloud: ['#fff4ec', '#f8dcd8', '#e0b8c4', '#b898b0'],
      life: ['clouds', 'birds', 'ruins', 'fireflies'], fireflyCount: 0.25,
    },
  },
  kinds: {
    elite: { grade: 'elite' },
    boss: { grade: 'boss', clouds: { count: 1.3 } },
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
      depths: {   // the Crystal Depths: a geode vault, amethyst crystal, energy in the cracks, and a Master Ball for a chest
        sky: ['#f4ecff', '#c8a8f8'],
        rock: ['#5e5276', '#4a405e', '#3a324c', '#2a2438', '#181424'],
        vein: ['#ff8ae0', '#f0349a'],
        crystal: ['#f8f0ff', '#d0a8f8', '#9058e0', '#502898'],
        ground: ['#3e3650', '#383048', '#322a40', '#2c2438', '#241e30'],
        stone: ['#a8a0c0', '#867ea0', '#645c7c', '#443e58'],
        beam: '#f0e0ff', drip: '#a8f0ff', mote: '#f8f0ff',
        ember: ['#f0ffff', '#88e8f8', '#c878f8'], embers: 0.4,
        chest: { ...BALL_CHEST, lid: ['#d0a0ff', '#8048c8', '#5a2c98', '#381a68'], trim: ['#fff0ff', '#d8b8f0', '#9878b8'], mark: ['#ffb0d8', '#f070a8'], marks: 'master' },
        life: ['treasure', 'drips', 'embers'],
      },
      ruins: {   // a drowned vault: sea-worn sandstone, aquamarine crystals, tide pools on the floor, and a Dive Ball for a chest
        sky: ['#e8fff8', '#a8e8e0'],
        rock: ['#8a8068', '#6e6652', '#565040', '#423c30', '#2c281e'],
        moss: ['#7ab860', '#4e8a48', '#2e5a34'],
        crystal: ['#f0fffc', '#98f0e0', '#40c0b8', '#1e7878'],
        ground: ['#5e5848', '#544e40', '#4a4438', '#403c30', '#363228'],
        stone: ['#e0d4b0', '#c0b088', '#988a66', '#6a5e46'],
        beam: '#e8fff8', drip: '#b8f4ff', mote: '#f0fffc',
        pool: ['#c8fff8', '#58c0c0', '#1e7080'],
        chest: { ...BALL_CHEST, lid: ['#98d8ff', '#3890e0', '#2060b0', '#103870'], mark: ['#c8f4ff', '#78d0f8'], marks: 'dive' },
        life: ['treasure', 'drips'],
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

  /* the Move Tutor's dojo: shoji screens between timber posts over a tatami floor, his arena's Dragonite medallion big in
     a dark wood alcove under a shimenawa rope, Alder on a cushion below it, a hanging scroll (pay ₽), a sandbag (pay HP) */
  tutor: {
    backdrop: 'dojo', floor: 'tatami', prop: 'tutor', light: null, horizon: 0.6, sky: ['#f8f2e0'],
    wall: ['#f8f2e0', '#ece2c8', '#c8b490', '#fffaec'],
    trim: ['#c08850', '#8a5a30', '#5e3a1c', '#2e1a0c'],
    plank: ['#d8a868', '#c49058', '#a87444', '#6a4424'],
    chalk: '#f0f8f0', paper: ['#f8f0d8', '#e0d4b4'], ink: '#2a1c18', silk: ['#4a5a7a', '#36425e'],
    cushion: ['#d05048', '#a03038', '#5a1420'], shide: ['#ffffff', '#c8c8d0'],
    gold: ['#fff4b8', '#f8c830', '#c88a18', '#7a4c10', '#2e1806'], medal: ['#2a0a10', '#1a060a'], eye: ['#fff8f0', '#ff3828'],
    coin: ['#fff8b0', '#f8c830', '#b07818'],
    tatami: ['#d8d890', '#c4c47c', '#2e3a26', '#e6e6a8', '#a8a868'],
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


let canvas = null, ctx = null, S = null, timer = 0, tick = 0, last = 0;   // `last`: the clock as the frame before was drawn
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
  'wish', 'hp', 'heart', 'coin', 'crystal', 'steam', 'beam', 'mote', 'glint', 'storm', 'chalk', 'pollen',
  'amethyst', 'ruby', 'energy', 'shroom', 'daylight', 'lamp', 'rune']);
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
  const kin = BIOME_ART[biome]?.kin || biome;   // a Safari area dresses its rooms like the main biome it's nearest
  if (art.outdoor) {
    const { storm, pad, life: own, ...wild } = biomeLook(BIOME_ART[biome] || BIOME_ART.clearing, time);
    const props = grade({ ...art, ...(biomes?.[biome] || biomes?.[kin]) }, g);
    const at = { ...journeyOf(where), step: null };
    paintScene(`place/${place}/${biome}/${type}/${time}/${placeKey(at)}`, { ...wild, ...props, ...types?.[type], life: [...own, ...art.life], ...at }, floor, span);
    return;
  }
  paintScene(...placeLook(place, biome, type), floor, span);
}

/** An indoor place's look at the hour it is now, as [key, look]: showPlaceScene() paints it, placeShot() takes a still. */
function placeLook(place, biome, type) {
  const { biomes, types, ...art } = PLACE_ART[place];
  const time = timeOfDay(), g = GRADES[time];
  const kin = BIOME_ART[biome]?.kin || biome;
  const look = biomes && (biomes[biome] || biomes[kin] || Object.values(biomes)[0]), glow = types?.[type];
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
  return [`place/${place}${look ? `/${biome}` : ''}${glow ? `/${type}` : ''}/${time}`, lit];
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
/** A Sky Pillar fight's room (js/tower-art.js's paintArena()): `look` is { alt, kind, banner }. */
export function showTowerScene(look) {
  paintScene(`tower/${look.alt}/${look.kind}/${look.banner}`, {
    backdrop: 'tower', light: null, sky: ['#0a0c1c'], tower: look, life: ['tower'],
    pad: { style: 'stone', top: '#a49c8e', mid: '#867e70', low: '#6a6256', rim: '#2a2622', earth: '#3e3830', moss: look.alt >= 100 ? '#3aa860' : '#5a8a3a' },
  });
}

export function showScene(biomeId, kind = 'wild', where = 0) {
  const art = BIOME_ART[biomeId];
  if (!art) { paintScene('', null); return; }
  const time = timeOfDay(), at = journeyOf(where);
  // light weather only behind a fight; a boss brings its own storm (setStorm)
  const weather = document.body.dataset.screen === 'battle-screen' && kind !== 'boss' ? weatherFor(biomeId, time) : null;
  paintScene(`${biomeId}/${kind}/${time}/${placeKey(at)}/${weather?.kind}`, { ...biomeLook(art, time, kind), ...at, weather });
}

/** One still frame of a biome's scene, `w` x `h` scene pixels on a canvas of its own (the Pokédex's banners and screen),
    with the horizon at `at` of the height. The live scene behind the page is set aside while it paints and put back as it
    was, since this module paints one scene at a time. */
export function sceneShot(biomeId, { w, h, at = 0.6, kind = 'wild', where = 0, time = timeOfDay() }) {
  const art = BIOME_ART[biomeId] || BIOME_ART.clearing;
  return shoot({ ...biomeLook(art, time, kind), ...journeyOf(where), weather: null }, w, h, at);
}

/** A still of an indoor place (PLACE_ART: 'mart', 'center', 'treasure' with a `biome`'s grotto, 'kombat'...), like sceneShot(). */
export function placeShot(place, { w, h, at = null, biome = null }) {
  const [, look] = placeLook(place, biome, null);
  return shoot(look, w, h, at ?? look.horizon ?? 0.6);
}

function shoot(look, w, h, at) {
  const kept = { canvas, ctx, S, tick, last, W, H, horizon, base, img, px, sky, rand, life, bossPrelude, floorAt, spanAt, storm };
  const shot = document.createElement('canvas');
  try {
    canvas = shot; ctx = shot.getContext('2d');
    floorAt = null; spanAt = null; bossPrelude = null; storm = { on: false, level: 0 }; tick = FPS * 7; last = tick;
    const raw = { ...look, horizon: at };
    S = colours(raw);
    S.raw = raw;
    S.storm = null;
    W = shot.width = w; H = shot.height = h;
    horizon = Math.round(H * at);
    rand = seeded(W * 131 + H);
    img = ctx.createImageData(W, H);
    px = new Uint32Array(img.data.buffer);
    sky = new Uint8Array(W * H);
    life = {};
    base = paintBase();
    makeLife();
    draw();
    const pad = raw.padDeep && raw.stage >= 2 ? raw.padDeep : raw.pad;
    shot.pad = pad ? padImage(pad) : null;   // the battle pad's image, for a Pokémon to stand on in front of it
  } finally {
    ({ canvas, ctx, S, tick, last, W, H, horizon, base, img, px, sky, rand, life, bossPrelude, floorAt, spanAt, storm } = kept);
  }
  return shot;
}

/* ---------- battle weather ----------
   A light fall over every wild and elite fight, matched to the biome and the hour. `glow` kinds keep their colours in
   the dark; the rest are graded with the land (js/daytime.js), so night leaves don't shine. */
const WEATHER = {
  clearing: { dawn: 'drizzle', day: 'leaves', dusk: 'leaves', night: 'drizzle' },
  shrine: { dawn: 'drizzle', day: 'drizzle', dusk: 'leaves', night: 'drizzle' },
  ruins: { dawn: 'drizzle', night: 'drizzle' },
  wastes: 'ash',
  depths: 'dust',
  meadow: { dawn: 'drizzle', dusk: 'leaves', night: 'drizzle' },
  forest: 'leaves',
  wetland: 'drizzle',
  marsh: 'drizzle',
  peak: 'snow',
  desert: 'sand',
};
const WEATHER_LOOK = {
  drizzle: { colours: ['#d8e6fa', '#8aa2c8'], per: 420, glow: true },
  leaves: { colours: ['#e8b040', '#b07020', '#d86830', '#983818', '#a8c858', '#688a30'], per: 1500 },
  ash: { colours: ['#d0c8c4', '#9a928e', '#6a6260', '#f8a830'], per: 700 },
  dust: { colours: ['#ffffff', '#b8f4ff', '#e8b8ff'], per: 900, glow: true },
  snow: { colours: ['#ffffff', '#dce6f4'], per: 600, glow: true },
  sand: { colours: ['#f4dca8', '#d4b478'], per: 450 },
};

function weatherFor(biomeId, time) {
  const w = WEATHER[biomeId], kind = typeof w === 'string' ? w : w?.[time];
  if (!kind) return null;
  const { colours, per, glow } = WEATHER_LOOK[kind], g = !glow && GRADES[time];
  return { kind, per, colours: colours.map(c => abgr(g ? gradeHex(c, g.land) : c)) };
}

function makeWeather() {
  const w = S.raw.weather;
  life.weather = !w || matchMedia('(prefers-reduced-motion: reduce)').matches ? null
    : Array.from({ length: Math.round(W * H / w.per) }, () => ({ x: rand() * (W + 20) - 10, y: rand() * H, speed: 0.7 + rand() * 0.6, phase: rand() * 60 }));
}

/** The weather's fall; it thins out as a storm rolls in, and every flake starts again at the top once past the bottom. */
function drawWeather(t) {
  const { kind, colours: c } = S.raw.weather, keep = 1 - storm.level;
  const reset = (p) => { p.y = -2 - rand() * 6; p.x = rand() * (W + 20) - 10; };
  for (let i = 0, n = Math.round(life.weather.length * keep); i < n; i++) {
    const p = life.weather[i], s = p.speed;
    if (kind === 'drizzle') {
      p.y += (2.2 * s) * DT; p.x -= (0.7 * s) * DT;
      if (p.y > H) reset(p);
      put(p.x, p.y, c[0]); put(p.x + 1, p.y - 2, c[1]);
      if (s > 1) put(p.x + 1, p.y - 1, c[1]);
    } else if (kind === 'leaves') {
      p.y += (0.35 * s) * DT; p.x += (0.35 + Math.sin((t + p.phase) / 6) * 0.6) * DT;
      if (p.y > H + 2 || p.x > W + 3) reset(p);
      const pair = (i % 3) * 2, [a, b] = [c[pair], c[pair + 1]], spin = Math.floor((t + p.phase) / 3) % 4;
      put(p.x, p.y, a);
      if (spin === 0) { put(p.x + 1, p.y, a); put(p.x + 1, p.y + 1, b); }
      else if (spin === 1) { put(p.x, p.y + 1, b); }
      else if (spin === 2) { put(p.x - 1, p.y, a); put(p.x - 1, p.y + 1, b); }
      else put(p.x + 1, p.y, b);
    } else if (kind === 'ash') {
      p.y += (0.3 * s) * DT; p.x += (0.2 + Math.sin((t + p.phase) / 7) * 0.25) * DT;
      if (p.y > H + 1) reset(p);
      if (i % 9 === 0) { if (Math.sin((t + p.phase) / 2) > -0.3) put(p.x, p.y, c[3]); continue; }   // a stray ember among the flakes
      const shade = c[i % 3];
      put(p.x, p.y, shade);
      if (s > 1.05) put(p.x + (Math.floor((t + p.phase) / 4) % 2 ? 1 : -1), p.y, shade);
    } else if (kind === 'dust') {
      p.y += (0.18 * s) * DT; p.x += (Math.sin((t + p.phase) / 9) * 0.2) * DT;
      if (p.y > H) reset(p);
      const b = Math.sin((t + p.phase) / 3);
      if (b > 0.85) { put(p.x - 1, p.y, c[1 + i % 2]); put(p.x + 1, p.y, c[1 + i % 2]); put(p.x, p.y - 1, c[1 + i % 2]); put(p.x, p.y + 1, c[1 + i % 2]); }
      if (b > -0.2) put(p.x, p.y, b > 0.6 ? c[0] : c[1 + i % 2]);
    } else if (kind === 'snow') {
      p.y += (0.4 * s) * DT; p.x += (Math.sin((t + p.phase) / 5) * 0.4 - 0.1) * DT;
      if (p.y > H) reset(p);
      put(p.x, p.y, c[i % 2]);
      if (s > 1.1) { put(p.x + 1, p.y, c[1]); put(p.x, p.y + 1, c[1]); }
    } else if (kind === 'sand') {
      p.x += (2.6 * s) * DT; p.y += (0.25 * s + Math.sin((t + p.phase) / 4) * 0.2) * DT;
      if (p.x > W + 3 || p.y > H) { p.x = -3 - rand() * 10; p.y = rand() * H; }
      put(p.x, p.y, c[0]); put(p.x - 1, p.y, c[1]);
      if (s > 1) put(p.x - 2, p.y, c[1]);
    }
  }
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
  const pad = raw.padDeep && raw.stage >= 2 ? raw.padDeep : raw.pad;   // the Crystal Depths' rock turns red from the Deep Core on
  if (pad) $('battle-screen').style.setProperty('--pad', `url("${padImage(pad)}")`);
  resize();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(frame, 1000 / RATE);
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
  if (!hasPrelude()) return;
  if (!battleFx()) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (hasPrelude()) {
      bossPrelude = { phase: 'awake', at: tick };
      enterArena(true);
      draw();
    }
    return;
  }
  const key = preludeKey(), run = ++preludeRun, still = () => hasPrelude() && run === preludeRun;
  enterArena(false);   // a replay (the ?area= peek) starts from the place itself
  bossPrelude = { phase: 'wake', at: tick };
  draw();
  for (const [frame, sound] of preludeSounds()[key]) {
    setTimeout(() => { if (bossPrelude?.phase === 'wake' && still()) playSound(sound); }, frame * 1000 / FPS);
  }
  await new Promise(resolve => setTimeout(resolve, 3600));
  if (!still()) return;
  bossPrelude = { phase: 'portal', at: tick };
  draw();
  await new Promise(resolve => setTimeout(resolve, 1100));
  if (!still()) return;
  bossPrelude = { phase: 'awake', at: tick };
  enterArena(true);   // under the last white flash, the place becomes the boss's arena
  draw();
}
let preludeRun = 0;

/** A boss rising in its second form (Eternatus into Eternamax, rebirth() in js/battle.js): the Darkest Day (the
    user's pick, 2026-10-02, over replaying the Well's prelude). The cavern goes dark, red cracks race across the roof,
    it splits open on a blood-red sky, and Eternamax's colossal silhouette comes down through the rift (depthsMax()).
    After it the arena stays open to that sky in the storm at its fiercest (`storm.fury`: more rain, lightning every
    second or two, the Well's column climbing into the rift). `skipped` resolves on a tap, cutting to that. */
export async function bossRebirth(skipped) {
  if (!hasPrelude()) return;
  storm.fury = true;
  if (life.rain) makeRain();
  const run = ++preludeRun, still = () => hasPrelude() && run === preludeRun;
  let skip = false;
  skipped?.then(() => { skip = true; });
  const wait = (ms) => Promise.race([new Promise(resolve => setTimeout(resolve, ms)), skipped]);
  if (S.raw.backdrop === 'depths' && battleFx()) {
    await Promise.race([maxFigureReady(), wait(800)]);
    if (!still()) return;
    bossPrelude = { phase: 'max', at: tick };
    draw();
    for (const [frame, sound] of MAX_SOUNDS) {
      setTimeout(() => { if (bossPrelude?.phase === 'max' && still() && !skip) playSound(sound); }, frame * 1000 / FPS);
    }
    await wait(MAX_END * 1000 / FPS);
    if (!still()) return;
  }
  bossPrelude = { phase: 'awake', at: tick };
  draw();
}
/** The sounds the second form's cutscene plays, to load ahead. */
export const bossRebirthSounds = () => MAX_SOUNDS.map(([, sound]) => sound);
/** A boss's place in a main biome or a Safari area (not an event's room there) has a prelude. */
const hasPrelude = () => ['hills', 'shrine', 'volcano', 'depths', 'ruins', 'safari'].includes(S?.raw.backdrop) && S.raw.stage === 3 && !S.raw.prop;
const preludeKey = () => (S.raw.backdrop === 'safari' ? S.raw.area : S.raw.backdrop);
/** The sounds the boss prelude on screen will play, to load ahead. */
export const bossPreludeSounds = () => (hasPrelude() ? preludeSounds()[preludeKey()].map(([, sound]) => sound) : []);

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
  tick += DT;
  storm.level = Math.max(0, Math.min(1, storm.level + (storm.on ? 1 : -1) * DT / (FPS * 2)));
  draw();
}

/* The clock runs in fractions of a tick, so a one-off at a tick (a sound, a spawn) fires on the frame that passes it, not
   on every frame drawn during it. A draw() outside the clock (a resize) passes nothing. */
/** Did this frame pass tick `n`? */
const reached = (n) => last < n && tick >= n;
/** Did this frame pass a tick `k`, `k` + n, `k` + 2n...? */
const everyAt = (n, k = 0) => Math.floor((tick - k) / n) !== Math.floor((last - k) / n);

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
  if (S.raw.backdrop === 'dojo') roomWall({ posts: 28, shoji: true });
  if (S.raw.backdrop === 'study') roomWall({ stripes: 3 });
  if (S.raw.backdrop === 'fanclub') fanWall();
  if (S.raw.backdrop === 'daycare') daycareHouse();
  if (S.raw.backdrop === 'kombat') kombatBackdrop();
  if (S.raw.backdrop === 'safari') safariBackdrop();
  if (S.raw.backdrop === 'depths') depthsBackdrop();
  if (S.raw.backdrop === 'ruins') ruinsBackdrop();

  if (S.raw.floor === 'treasure') grottoFloor();
  if (S.raw.floor === 'altar') shrineApproach();
  if (S.raw.floor === 'onsen') flagstones();
  if (S.raw.floor === 'planks') plankFloor();
  if (S.raw.floor === 'tatami') tatamiFloor();
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
  if (S.raw.floor === 'safari') safariFloor();
  if (S.raw.floor === 'depths') depthsFloor();
  if (S.raw.floor === 'ruins') ruinsFloor();

  if (S.raw.backdrop === 'hills') treeLine();
  if (S.raw.backdrop === 'shrine') shrineFront();
  if (S.raw.backdrop === 'jungle') jungleFront();
  if (S.raw.backdrop === 'center') centerFront();
  if (S.raw.backdrop === 'mart') martFront();
  if (S.raw.backdrop === 'treasure') grottoFront();
  if (S.raw.backdrop === 'safari') safariFront();
  if (S.raw.backdrop === 'hills' || S.raw.backdrop === 'shrine' || S.raw.backdrop === 'volcano') { stageFront(); landmark(); }
  if (S.raw.backdrop === 'depths') { depthsFront(); landmark(); }
  if (S.raw.backdrop === 'ruins') { ruinsFront(); landmark(); ruinsSettle(); }
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
const biomeOf = () => ({ hills: 'clearing', shrine: 'shrine', volcano: 'wastes', depths: 'depths', ruins: 'ruins' })[S.raw.backdrop];
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
  // the deep woods' big trees frame the left edge, and the Crystal Halls' lake fills the back of it, so there it stands on the right
  const paint = mark.paint || mark, side = mark.side || ((b === 'clearing' && st === 2) || (b === 'depths' && st === 1) ? 1 : r() < 0.5 ? -1 : 1);
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
  if (S.pool) for (const [at, k] of [[0.1, 0.5], [0.9, 0.62]]) {   // the drowned vault's tide pools
    const [lit, body, deep] = S.pool, px0 = Math.round(W * at), py0 = dy + Math.round((H - dy) * k), r = Math.max(8, Math.round(W * 0.11));
    pool(px0, py0, r, Math.max(3, Math.round(r * 0.34)), (x, y, d) => (d < 0.3 ? deep : (x * 3 + y * 5) % 11 === 0 ? lit : body), S.rock[3]);
    for (let n = 0; n < 3; n++) life.glints.push({ x: px0 - r + Math.floor(rand() * r * 2), y: py0, c: lit, phase: rand() * 80 });
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
    m.y += (m.drift) * DT;
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
    if (marks === 'dive' && (y === 4 || y === 7) && ((x + (y === 4 ? 0 : 3)) % 6) < 3) return S.chest.mark[y === 4 ? 0 : 1];   // the Dive Ball's waves
    if (marks === 'master' && ((x - 9) ** 2 + (y - 5) ** 2 <= 5 || (x - 26) ** 2 + (y - 5) ** 2 <= 5)) return S.chest.mark[y < 5 ? 0 : 1];   // the Master Ball's pink bumps
    if (marks === 'master' && y >= 3 && y <= 7 && (x === 15 || x === 21 || (y === 3 + Math.abs(x - 18) && x > 15 && x < 21))) return trim[0];   // ...and its M
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
  for (const [f, sound] of ACTS[name].cues?.(opts) || []) if (reached(at + f)) playSound(sound);
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
    const x = s.x - Math.round(Math.sqrt(y - s.y) * 0.6), c = (y + Math.floor(t)) % 3 ? light : foam;
    put(x, y, c);
    if ((y + Math.floor(t)) % 4 === 0) put(x - 1, y, foam);
  }
  const sx = s.x - Math.round(Math.sqrt(s.to - s.y) * 0.6);
  for (const dx of [-2, 2]) put(sx + dx, s.to - ((Math.floor(t) + (dx > 0 ? 1 : 0)) % 2), foam);
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
  const rustle = f < 0 && t % 48 < 4 ? (Math.floor(t) % 2 ? 1 : -1) : 0;
  const drawBall = () => {
    if (gone) return;
    const dx = f >= 0 && f < 6 ? [0, -1, 0, 1, 0, -1][Math.floor(f)] : 0, lift = !trap && f >= 6 ? f - 5 : 0;
    const flash = trap && f >= 8 && Math.floor(f) % 2 === 0;
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
  const [lit, leaf, dark, bLine] = S.bush, rustle = flee >= 0 && flee < 8 ? (Math.floor(flee) % 2 ? 1 : -1) : 0;
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
function roomWall({ posts = 0, stripes = 0, shoji = false } = {}) {
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
      // shoji: a light wood lattice over the paper, its bars lined up between the posts
      if (shoji && ((x - cx + 700) % 7 === 0 || (y - beam) % 9 === 5)) c = wLit;
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

/* ----- the Move Tutor's dojo: his arena's Dragonite medallion hangs big in a dark wood alcove (tokonoma) under a
   shimenawa rope, Alder meditates on a cushion below it, a hanging scroll beside it (pay ₽), and a sandbag hangs from a
   beam (pay HP) ----- */

function tutorScene() {
  const { cx, foot, s, ceil } = roomLayout(), u = (k) => Math.max(1, Math.round(s * k));
  const seat = { x: cx - u(0.1), y: foot - 1 }, top = ceil + 3;
  // the medallion as big as the wall under the title allows, hanging just under the rope
  const size = Math.min(u(0.32), (horizon - top - 2) / 2), { R } = medallionFit(size);
  const my = Math.min(horizon - R - 2, top + 5 + R), ax0 = seat.x - R - 5, ax1 = seat.x + R + 5;
  tokonoma(ax0, ax1);
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (Math.hypot(x + 0.5, y + 0.5) <= R + 0.5) tint(seat.x + x + 1, my + y + 2, 0.7);
  medallion(seat.x, my, size);
  shimenawa(ax0, ax1, top);
  const sw = Math.max(8, u(0.1)), scroll = { x0: Math.max(2, ax0 - 3 - sw), x1: ax0 - 3, y0: top + 3 };
  scroll.y1 = Math.min(railRow() + 2, scroll.y0 + Math.max(sw * 3, u(0.45)));
  hangingScroll(scroll);
  cushion(seat.x, seat.y, 14);
  const bag = { x: cx + u(0.32), top: ceil, w: Math.max(5, u(0.09)), h: u(0.38) };
  bag.len = foot - u(0.05) - bag.h - bag.top;
  const [wLit, wood, wDark, wLine] = S.trim;   // the beam it hangs from, across the ceiling
  for (let x = bag.x - u(0.16); x <= bag.x + u(0.16); x++) { solid(x, bag.top - 2, wLine); solid(x, bag.top - 1, wLit); solid(x, bag.top, wood); solid(x, bag.top + 1, wDark); solid(x, bag.top + 2, wLine); }
  groundShadow(bag.x, foot - u(0.02), bag.w + 2, 2);
  if (W > s * 1.5) weaponRack(cx + u(0.9), top + 4, u(0.1));
  mightPlaque(ax1 + 3, bag.x - bag.w - 3, scroll.x0 - 3, top + 2);
  life.scroll = scroll;
  life.bag = bag;
  // Alder (62x66, drawn at half the scene's pixel size) sits cross-legged on the cushion; the lesson's sign is on the
  // scroll, the training's on the sandbag, and the Challenge's on him
  life.stands = { npc: { x: seat.x, y: seat.y + 2 } };
  life.eventSpots = [
    scroll,
    { x0: bag.x - bag.w - 4, x1: bag.x + bag.w + 4, y0: bag.top + bag.len - 4, y1: bag.top + bag.len + bag.h },
    { x0: seat.x - 16, x1: seat.x + 16, y0: seat.y + 2 - 33, y1: seat.y + 2 },
  ];
  life.foot = foot + 4;
}

/** Tatami mats running away from you in a running bond: dark cloth edges, the straw's weave, a few mats a shade older
    than the rest, darkening to the wall. */
function tatamiFloor() {
  const [straw, weave, edge, lit, old] = S.tatami, cx = W / 2, vy = horizon - (H - horizon) * 1.8;
  const bottom = H - vy, ku = bottom / 14, kv = bottom * bottom / 5;
  for (let y = horizon; y < H; y++) {
    const dz = y - vy, v = Math.floor(kv / dz), row = Math.floor(v / 3), rowEdge = row !== Math.floor(Math.floor(kv / (dz + 1)) / 3);
    for (let x = 0; x < W; x++) {
      const u = (x - cx) * ku / dz + (row % 2) + 99, m = Math.floor(u / 2), seam = u / 2 - m < ku / dz / 2;
      const aged = noise(m, row, 9) > 0.75, stripe = Math.floor(u * 8) % 3 === 0 && dither(x, y) < 10;
      put(x, y, seam || rowEdge ? edge : aged ? (stripe ? old : weave) : stripe ? weave : u / 2 - m < 0.12 || u / 2 - m > 0.88 ? lit : straw);
    }
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.6); tint(x, horizon + 1, 0.8); tint(x, horizon + 2, 0.9); }
}

/** The alcove the medallion hangs in: dark wood panels between polished posts, down to its raised lacquer sill. */
function tokonoma(x0, x1) {
  const [wLit, wood, wDark, wLine] = S.trim;
  for (let y = 0; y < horizon; y++) for (let x = x0; x <= x1; x++) {
    const post = x - x0 < 3 || x1 - x < 3, sill = horizon - y <= 3;
    let c;
    if (post) c = x === x0 || x === x1 ? wLine : (x - x0 === 1 || x1 - x === 2) ? wLit : wood;
    else if (sill) c = horizon - y === 3 ? wLit : horizon - y === 1 ? wLine : wDark;
    else c = (x - x0) % 6 === 0 ? wLine : dither(x, y) < 2 ? wood : wDark;
    solid(x, y, c);
  }
  for (let y = 0; y < horizon - 3; y++) tint(x0 + 3, y, 0.6);   // the post's shadow on the back panel
}

/** A thick twisted straw rope sagging across the alcove's top, white zigzag paper streamers hanging from it. */
function shimenawa(x0, x1, y0) {
  const [hi, lo] = S.rope, [white, grey] = S.shide, mid = (x0 + x1) / 2, half = (x1 - x0) / 2;
  const sag = (x) => y0 + Math.round(3 * (1 - Math.pow((x - mid) / half, 2)));
  for (let x = x0 - 1; x <= x1 + 1; x++) {
    const y = sag(x);
    for (let k = 0; k < 3; k++) solid(x, y + k, (x + k) % 3 === 0 ? lo : hi);
    solid(x, y + 3, S.trim[3]);
  }
  for (const f of [0.3, 0.5, 0.7]) {
    const sx = Math.round(x0 + (x1 - x0) * f), sy = sag(sx) + 3;
    for (let k = 0; k < 7; k++) { const dx = [0, 1, 1, 0, 0, 1, 1][k]; solid(sx + dx, sy + k, white); solid(sx + dx + 1, sy + k, grey); }
  }
}

/** A hanging scroll: a silk mount round a paper panel brushed with a column of characters, on a cord from a nail, a
    wooden roller at the top and a knobbed one at the bottom. */
function hangingScroll({ x0, x1, y0, y1 }) {
  const [paper, paperDark] = S.paper, [silk, silkDark] = S.silk, ink = S.ink, [wLit, wood, , wLine] = S.trim;
  const mx = (x0 + x1) >> 1;
  for (let k = 1; k <= 3; k++) { solid(mx - k, y0 - 4 + k, wLine); solid(mx + k, y0 - 4 + k, wLine); }
  solid(mx, y0 - 4, wLit);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const inner = x > x0 + 1 && x < x1 - 1 && y > y0 + 3 && y < y1 - 3;
    solid(x, y, inner ? (dither(x, y) < 2 ? paperDark : paper) : x === x1 ? silkDark : silk);
  }
  for (let x = x0 - 1; x <= x1 + 1; x++) { solid(x, y0, wood); solid(x, y0 + 1, wLine); }
  for (let x = x0 - 2; x <= x1 + 2; x++) { solid(x, y1, x < x0 || x > x1 ? wLine : wood); solid(x, y1 + 1, wLine); }
  // brushed characters down the middle, each a few strokes picked by noise
  const px0 = x0 + 3, cw = x1 - 3 - px0 + 1, step = Math.max(4, cw + 2);
  for (let cy = y0 + 6, n = 0; cy + cw <= y1 - 5; cy += step, n++) {
    for (let k = 0; k < 3; k++) {
      const at = Math.floor(noise(n, k, 5) * cw);
      if (noise(n, k, 4) < 0.5) for (let x = px0; x < px0 + cw; x++) solid(x, cy + at, ink);
      else for (let y = cy; y < cy + cw; y++) solid(px0 + at, y, ink);
    }
  }
}

/** Kenmatta's motto, TEST YOUR MIGHT (the user's), in gold on a red lacquer plaque on the back wall: in the gap between
    the alcove and the sandbag's rope if it fits, else left of the scroll, else as one line over the top of the wall. */
function mightPlaque(rx0, rx1, lx1, y0) {
  const [lit, body, line] = S.cushion, [shine, gold, , goldDark] = S.gold;
  const lines = ['TEST YOUR', 'MIGHT'], width = (t) => [...t].reduce((n, ch) => n + (ch === ' ' ? 3 : 4), -1);
  const fits = (text) => Math.max(...text.map(width)) + 6;
  let text = lines, w = fits(lines), x0;
  if (rx1 - rx0 >= w) x0 = Math.round((rx0 + rx1 - w) / 2);
  else if (lx1 - 2 >= w) x0 = Math.round((2 + lx1 - w) / 2);
  else { text = ['TEST YOUR MIGHT']; w = fits(text); x0 = Math.round((W - w) / 2); }
  const h = text.length * 7 + 4;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const edge = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1, rim = x === x0 + 1 || x === x0 + w - 2 || y === y0 + 1 || y === y0 + h - 2;
    solid(x, y, edge ? line : rim ? (y === y0 + 1 ? shine : gold) : y < y0 + 3 ? lit : body);
  }
  for (let x = x0 + 1; x < x0 + w - 1; x++) tint(x, y0 + h, 0.7);   // its shadow on the wall
  text.forEach((t, i) => {
    const tx = x0 + Math.round((w - width(t)) / 2), ty = y0 + 3 + i * 7;
    pixelText(tx + 1, ty + 1, t, goldDark);
    pixelText(tx, ty, t, shine);
  });
}

/** A round red meditation cushion on the mats. */
function cushion(cx, foot, hw) {
  const [lit, body, line] = S.cushion, hh = Math.max(2, Math.round(hw * 0.25));
  groundShadow(cx, foot + 1, hw + 1, hh);
  for (let y = -hh; y <= hh; y++) for (let x = -hw; x <= hw; x++) {
    const d = Math.pow(x / hw, 2) + Math.pow(y / hh, 2);
    if (d <= 1) put(cx + x, foot + y, d > 0.7 ? line : y < 0 && x < 0 ? lit : body);
  }
}

/** A wall rack of training staffs and wooden swords against the shoji. */
function weaponRack(cx, top, hw) {
  const [wLit, wood, wDark, wLine] = S.trim, foot = horizon + 2;
  for (const y of [top + 4, foot - 6]) for (let x = cx - hw - 1; x <= cx + hw + 1; x++) { solid(x, y, wLit); solid(x, y + 1, wLine); }
  for (const x of [cx - hw - 1, cx + hw + 1]) for (let y = top + 3; y <= foot; y++) { solid(x, y, wood); solid(x + 1, y, wLine); }
  const n = Math.max(3, Math.floor(hw / 2));
  for (let i = 0; i < n; i++) {
    const x = cx - hw + 2 + Math.round(i * (hw * 2 - 4) / (n - 1)), sword = i % 2;
    for (let y = top + (sword ? 6 : 0); y < foot - 1; y++) { solid(x, y, sword ? wDark : wLit); solid(x + 1, y, wLine); }
    if (sword) for (let d = -2; d <= 3; d++) solid(x + d, foot - 12, wLine);   // the sword's guard
  }
}

/** The sandbag swings on its rope (hard while you train, knocking out dust and stars), and ink brushes itself down the
    scroll during a lesson. */
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
  const l = actFrame('lesson'), sc = life.scroll;
  if (l >= 0) {
    const mid = (sc.x0 + sc.x1) / 2, w = (sc.x1 - sc.x0 - 6) / 2, len = sc.y1 - sc.y0 - 10, n = Math.min(l * 2, len);
    const at = (i) => [Math.round(mid + Math.sin(i / 2) * w), sc.y0 + 5 + i];
    for (let i = 0; i < n; i++) put(...at(i), S.ink);
    if (n < len) sparkle(...at(n), S.coin[0]);
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
    if (y > 0 && y < H) { put(x, y, S.flags[c.c]); if ((Math.floor(f) + c.c) % 3) put(x + 1, y, S.flags[c.c]); }
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
  const { R: room, cx, cy, dais } = kombatLayout(), { R } = medallionFit(room), half = Math.round(R * 1.3), roof = Math.max(4, Math.round(R * 0.4));
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
  const { eye } = medallion(cx, cy, room);
  life.braziers = [];
  for (const side of [-1, 1]) {
    const x = cx + side * (half + 6), py = Math.round(cy - R * 0.1);
    if (dais && Math.abs(x - dais.x) < dais.hw + 8) continue;   // the steps stand in front of it
    lacquerPillar(x, py);
    pixelMap(x - 3, py - 3, ['ooooooo', 'olggggo', '.odddo.', '..ooo..'], { o: S.gold[4], l: S.gold[0], g: S.gold[1], d: S.gold[3] });
    life.braziers.push({ x, y: py - 4 });
  }
  if (dais) templeSteps(dais);
  life.kombat = { eye };
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
   claw, the striped belly, its tail hooking up the ring. # body, w wing, = belly, e the eye (drawKombat lights it). Two
   sizes, each drawn at a whole number of pixels a cell (medallionFit), since squeezing one grid to fit blurred it. */
const DRAGONITE = [
  '................................',
  '................................',
  '................................',
  '..........##.##.................',
  '.........#..#...................',
  '........#..#.............w......',
  '.......######...........ww......',
  '.....#########.........wwww.....',
  '....##e########.......wwwww.....',
  '..#############......wwwwwww....',
  '..#############.....wwwwwwww....',
  '.......########....wwwwwwww.....',
  '...#############..wwwwwwww......',
  '.....############.wwwwww........',
  '.......##=====####wwww..........',
  '..#.#.##=======#####............',
  '..######========#####...........',
  '......#=========######..........',
  '......#=========#######.........',
  '......#=========#######.........',
  '......#=========########........',
  '......#=========########........',
  '.......#========#########....#..',
  '.......#=======###########...#..',
  '........#======############.##..',
  '.........#====################..',
  '.........#####...#####.######...',
  '........######...######.#####...',
  '......########..#######.........',
  '................................',
  '................................',
  '................................',
];
const DRAGONITE_SMALL = [
  '..................',
  '......#..#........',
  '.....#..#.....w...',
  '....#####....ww...',
  '...##e####..wwww..',
  '..########.wwwww..',
  '.....#####wwwww...',
  '..#########ww.....',
  '.#.###==####......',
  '.####====####.....',
  '....#====####.....',
  '....#====#####....',
  '....#====######...',
  '.....#==########..',
  '.....####.###.##..',
  '....#####.####.#..',
  '..............##..',
  '..................',
];
const DRAGONITE_KIND = { '#': 1, e: 4, w: 2, '=': 3 };

/** The medallion that fits radius R: the bigger Dragonite at the most whole pixels a cell, its field (Ri) exactly that
    wide and the ring (R) round it; the small one, a pixel a cell, when nothing else fits. */
function medallionFit(R) {
  const fits = [DRAGONITE, DRAGONITE_SMALL].map(grid => ({ grid, k: Math.floor(R * 0.78 * 2 / grid.length) }));
  const { grid, k } = fits.reduce((a, b) => b.k && b.grid.length * b.k > a.grid.length * a.k ? b : a, { grid: DRAGONITE_SMALL, k: 1 });
  const Ri = grid.length * k / 2;
  return { grid, k, Ri, R: Math.max(Ri + 3, Math.round(Ri / 0.78)) };
}

/** The gold medallion: a bevelled ring round a dark field, the Dragonite raised on it in relief, lit from the top left.
    Returns its fitted radius and the eye's pixel. */
function medallion(cx, cy, size) {
  const [lit, gold, mid, dark, deep] = S.gold, [field, fieldDark] = S.medal, { grid, k, Ri, R } = medallionFit(size);
  const kind = (x, y) => DRAGONITE_KIND[grid[Math.floor((y + Ri) / k)]?.[Math.floor((x + Ri) / k)]] || 0;
  for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) {
    const d = Math.hypot(x + 0.5, y + 0.5);
    if (d > R + 0.5) continue;
    let c;
    if (d > Ri) {
      const a = (-x - y) / Math.max(1, d), outerHalf = d > (R + Ri) / 2;
      c = d > R - 0.5 || d < Ri + 1 ? deep : (outerHalf ? a : -a) > 0.35 ? lit : (outerHalf ? a : -a) < -0.35 ? mid : gold;
    } else {
      const kd = kind(x, y);
      if (!kd) c = kind(x - 1, y - 1) ? deep : dither(x, y) < 5 ? fieldDark : field;
      else if (kd === 4) c = S.eye ? S.eye[1] : deep;
      else if (!kind(x - 1, y - 1)) c = lit;
      else if (!kind(x + 1, y + 1)) c = dark;
      else c = kd === 2 ? mid : kd === 3 ? ((y + R * 4) % 3 === 0 ? mid : lit) : gold;
    }
    solid(cx + x, cy + y, c);
  }
  const studR = (R + Ri) / 2;
  for (let a = 0; a < 8; a++) solid(cx + Math.round(Math.cos(a * Math.PI / 4 + Math.PI / 8) * studR - 0.5), cy + Math.round(Math.sin(a * Math.PI / 4 + Math.PI / 8) * studR - 0.5), lit);
  const ey = grid.findIndex(row => row.includes('e')), ex = grid[ey].indexOf('e');
  return { R, eye: { x: cx - Ri + ex * k + (k >> 1), y: cy - Ri + ey * k + (k >> 1) } };
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
    const f = Math.sin(t / 2 + b.x) + noise(Math.floor(t), b.x, 1);
    for (let y = -9; y <= 3; y++) for (let x = -8; x <= 8; x++) {
      if (x * x + y * y * 1.4 < 50 + f * 8 && dither(b.x + x, b.y + y) < 3) tint(b.x + x, b.y + y, 1.3, 16);
    }
    const tall = 5 + Math.round(f * 1.2);
    for (let dy = 0; dy < tall; dy++) {
      const k = dy / tall, half = Math.round(2.4 * Math.pow(1 - k, 0.8) * (0.8 + 0.4 * noise(dy, Math.floor(t), b.x)));
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
  T: ['###', '.#.', '.#.', '.#.', '.#.'], S: ['.##', '#..', '.#.', '..#', '##.'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '.##'], M: ['#.#', '###', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
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
    const density = S.raw.floor === 'moss' ? (S.raw.backdrop === 'shrine' && S.raw.stage >= 2 ? 0.05 : 0.6) : life.bladeDensity ?? 1;   // raked gravel (or the Peak's snow) grows next to nothing
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
  makeWeather();
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
  if (has('safari')) makeSafariLife();
  if (has('depths')) makeDepthsLife();
  if (has('ruins')) makeRuinsLife();
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
  for (let i = 0, n = Math.round((W * H / 130) * S.storm.count * (storm.fury ? 1.8 : 1)); i < n; i++) {
    life.rain.push({ x: rand() * (W + H * 0.5), y: rand() * H, land: horizon + rand() * (H - horizon + 6), speed: 0.8 + rand() * 0.4, phase: rand() * 30 });
  }
}

function draw() {
  px.set(base);
  if (storm.level > 0) stormLight();
  const t = tick, L = life, has = (name) => S.raw.life.includes(name);
  if (has('ruins')) rippleRuins(t);   // first, so whatever plays over the water (spray, rain) stays on it

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
      c.x += (c.speed * (1 + 3 * storm.level)) * DT;
      const x = (c.x % (W + c.w * 2)) - c.w;
      if (c.near && S.raw.clouds.shadows) cloudShadow(x, c);
      cloud(Math.round(x), c.y, c.w, c.h, c.near);
    }
  }

  if (has('birds')) {
    if (!L.flock && everyAt(FPS * 14, FPS * 3)) {
      L.flock = { x: -12, y: 4 + Math.floor(rand() * Math.max(1, horizon * 0.5)), birds: [[0, 0], [-5, 3], [-9, -2]].slice(0, 2 + Math.floor(rand() * 2)) };
    }
    if (L.flock) {
      L.flock.x += (0.9) * DT;
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
  if (has('safari')) drawSafari(t);
  if (has('depths')) drawDepths(t);
  if (has('ruins')) drawRuins(t);
  if (has('tower')) paintArena({ W, H, px }, horizon, S.raw.tower, t);

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
      f.x += (f.vx) * DT;
      if (f.x < -4) f.x = W + 3; else if (f.x > W + 4) f.x = -3;
      const y = f.y + Math.sin((t + f.phase) / 4) * 2.5, open = (Math.floor(t) + Math.round(f.phase)) % 3 !== 0;
      put(f.x, y, S.bird);
      if (open) { put(f.x - 1, y - 1, f.colour); put(f.x + 1, y - 1, f.colour); put(f.x - 1, y, f.colour); put(f.x + 1, y, f.colour); }
      else { put(f.x, y - 1, f.colour); put(f.x, y - 2, f.colour); }
    }
  }

  if (L.leaves) {
    for (const l of L.leaves) {
      l.y += (l.vy) * DT; l.x += (Math.sin((t + l.phase) / 5) * 0.45 + 0.08) * DT;
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
      w.x += (w.vx) * DT;
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
      m.x += (m.vx) * DT; m.y += (m.vy + Math.sin((t + m.phase) / 6) * 0.05) * DT;
      if (m.x > W + 2) m.x = -2;
      if (m.y < horizon - 14) m.y = H - 1;
      const s = Math.sin((t + m.phase) / 5);
      if (s > 0.2) put(m.x, m.y, s > 0.8 ? S.pollen[0] : S.pollen[1]);
    }
  }

  if (L.ash) {
    for (const a of L.ash) {
      a.y += (a.vy) * DT; a.x += (0.15 + Math.sin((t + a.phase) / 8) * 0.1) * DT;
      if (a.y > H + 1) { a.y = -1; a.x = rand() * W; }
      if (a.x > W + 1) a.x = -1;
      put(a.x, a.y, S.ash[(a.phase | 0) % 2]);
    }
  }

  if (L.embers) {
    for (const e of L.embers) {
      e.y -= (e.vy) * DT; e.x += (Math.sin((t + e.phase) / 4) * 0.35) * DT;
      if (e.y < -1) { e.y = H + 1; e.x = rand() * W; }
      const f = Math.sin((t + e.phase) / 2.5);
      if (f > -0.4) put(e.x, e.y, S.ember[f > 0.6 ? 0 : f > 0 ? 1 : 2]);
    }
  }

  if (life.weather && storm.level < 1) drawWeather(t);
  if (life.rain && storm.level > 0) drawRain(t);
  let shake = 0;
  if (bossPrelude?.phase === 'max') shake = depthsMax(t);
  else if (bossPrelude?.phase === 'portal') {
    if (S.raw.backdrop === 'safari') shake = SAFARI_PRELUDES[S.raw.area].portal(t);
    else if (S.raw.backdrop === 'shrine') shake = drawShrinePortal(t);
    else if (S.raw.backdrop === 'volcano') shake = drawWastesPortal(t);
    else if (S.raw.backdrop === 'depths') shake = depthsPortal(t);
    else if (S.raw.backdrop === 'ruins') shake = ruinsPortal(t);
    else shake = drawClearingPortal(t);
  }
  else if (bossPrelude) shake = drawBossAwakening(t) || 0;

  if (calmFx()) shake = 0;
  // the whole picture jolts a pixel or two; the strip it uncovers keeps last frame's colours, which reads as blur
  ctx.putImageData(img, shake ? (Math.floor(t) % 2 ? shake : -shake) : 0, shake > 1 && Math.floor(t) % 3 === 0 ? 1 : 0);
  last = tick;
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
    if (Math.floor(a) === 0) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tint(x, y, 1.12, 22);
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
  if (Math.floor(e) === 0) flashScreen(1.35, 70);
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
    const h = Math.round((2 + noise(x, Math.floor(age), 62) * 5) * s * (1 - Math.abs(x) / w * 0.4));
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
  if (Math.floor(e) === 0) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tint(x, y, 1.35, 70);
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
  if (S.raw.arena) {   // the arena, coming up out of the white
    const age = preludeAge(t);
    ARENAS[S.raw.area].life(t);
    if (age < 5 && !matchMedia('(prefers-reduced-motion: reduce)').matches) veil(abgr('#fffce8'), 1 - age / 5);
    return 0;
  }
  if (S.raw.backdrop === 'safari') return SAFARI_PRELUDES[S.raw.area].wake(t);
  if (S.raw.backdrop === 'shrine') return drawShrineAwakening(t);
  if (S.raw.backdrop === 'volcano') return drawWastesAwakening(t);
  if (S.raw.backdrop === 'depths') return depthsWake(t);
  if (S.raw.backdrop === 'ruins') return ruinsWake(t);
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
    const off = (noise(j, 3, 0) * 4) | 0, cycle = ((age + off) / 4) | 0, step = Math.floor(age + off) % 4;
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
    const w = half + wob + (noise(y, Math.floor(age), 7) < 0.3 ? 1 : 0);
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
  if (Math.floor(e) === 0) flashScreen(1.35, 70);
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
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  const { cx, surface } = wastesCrater();
  groundFissures(age, 1, false);
  for (let y = surface; y <= horizon; y++) for (let x = 0; x < W; x++) if (dither(x, y + age) < 10) put(x, y, S.lava[1]);
  const half = Math.round(W * 0.04 + W * 0.62 * Math.min(1, (age / 5) ** 2));
  const white = abgr('#fffce8');
  for (let y = 0; y < H; y++) {
    const edge = half + Math.round(Math.sin(y * 0.9 + age * 2) * 2 + noise(y, Math.floor(age), 12) * 3);
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
  depths: [[0, 'gate-hum'], [2, 'quake'], [CORE_AT, 'eruption'], [CORE_AT + 1, 'core-surge']],
  ruins: [[0, 'quake'], [6, 'lake-churn'], [TIDE_AT, 'wave-crash']],
  ...Object.fromEntries(Object.entries(SAFARI_PRELUDES).map(([area, p]) => [area, p.sounds])),
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
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
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
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;

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
  if (everyAt(storm.on ? 2 : 5)) life.blobs.push({ x: v.x + (rand() - 0.5) * v.crater, y: v.y - 1, vx: (rand() - 0.5) * 1.6, vy: -1.6 - rand() * 1.4 });
  life.blobs = life.blobs.filter(b => {
    b.x += (b.vx) * DT; b.y += (b.vy) * DT; b.vy += (0.12) * DT;
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
    life.nextBolt = t + (storm.fury ? FPS * (0.8 + rand() * 1.5) : storm.on ? FPS * (2 + rand() * 3) : FPS * 7);
    if (storm.on && !storm.thundered) { storm.thundered = true; playSound('thunder'); }   // once a storm (the user found it repeating too much); the lightning goes on silently
  }
  const cycle = t - life.boltAt;
  if (cycle < 2 && !calmFx()) for (let i = 0; i < W * horizon; i++) if (sky[i]) tintIndex(i, cycle < 1 ? 1.9 : 1.35, cycle < 1 ? 40 : 14);
  if (cycle < 3 && life.bolt) for (const [x, y] of life.bolt) { put(x, y, abgr('#fffff0')); put(x + 1, y, abgr('#c8c0ff')); }
}

/** The storm's light: the sky and the ground darken (or redden) as it rolls in. */
function stormLight() {
  const L = storm.level * (storm.fury ? 1.4 : 1);   // the fiercest storm (a second form's) goes darker and redder
  const mix = ([k, r, g, b]) => [Math.max(0.15, 1 - (1 - k) * L), r * L, g * L, b * L];
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
    d.y += (S.storm.fall * d.speed) * DT;
    d.x -= (fast ? S.storm.fall * d.speed * 0.4 : 0.2 + Math.sin((t + d.phase) / 4) * 0.3) * DT;
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
  const tall = size * 1.6 + Math.sin(t / 2) * 1.2 + noise(Math.floor(t), 1, 2) * 1.5;
  for (let dy = 0; dy < tall; dy++) {
    const k = dy / tall, half = size * 0.75 * Math.pow(1 - k, 0.7) * (0.8 + 0.4 * noise(dy, Math.floor(t), 3));
    const sway = Math.sin(t / 3 + dy / 3) * k * 1.5;
    for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
      const e = Math.abs(dx) / Math.max(0.5, half);
      if (e > 1) continue;
      const heat = (1 - k) * (1 - e * 0.8) + noise(dx, dy, Math.floor(t)) * 0.25;
      put(fx + dx + sway, fy - 1 - dy, heat > 0.75 ? white : heat > 0.55 ? yellow : heat > 0.35 ? orange : heat > 0.18 ? red : deep);
    }
  }
  if (everyAt(2)) life.sparks.push({ x: fx + (rand() - 0.5) * size, y: fy - tall * 0.6, vx: (rand() - 0.5) * 0.4, vy: -0.6 - rand() * 0.6, age: 0, life: 14 + rand() * 20 });
  life.sparks = life.sparks.filter(s => {
    s.x += (s.vx + Math.sin((t + s.life) / 3) * 0.3) * DT; s.y += s.vy * DT; s.age += DT;
    if (s.age > s.life) return false;
    if (noise(s.life, Math.floor(s.age), 7) > 0.15) put(s.x, s.y, s.age < s.life * 0.4 ? yellow : s.age < s.life * 0.75 ? orange : red);
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
        const phase = ((x - mon.x0 - Math.floor(t)) % beat.length + beat.length) % beat.length;
        const lead = ((Math.floor(t) % (mon.x1 - mon.x0 + 1)) + mon.x0);
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
    m.y -= (m.drift) * DT;
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
  b.x += (0.08) * DT;
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
  if (style === 'sand') {
    // wind ripples across the top, a few dry tufts at the rim
    for (const [x0, y0, len] of [[7, 5, 10], [20, 7, 13], [12, 9, 9], [30, 4, 8]]) for (let k = 0; k < len; k++) if (within(x0 + k, y0 + (k % 5 < 2 ? 0 : 1))) dot(x0 + k, y0 + (k % 5 < 2 ? 0 : 1), low);
    for (const x of [5, 6, 41, 42, 24]) dot(x, edge(x) - 1, blade);
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

/* ============================================================
   THE SAFARI ZONE (SAFARI_ART): each area's back, floor and front, then the Zone's own fence, sign, rest house and
   tall grass over every one. Big things keep to the back and the edges: the middle is the two Pokémon's.
   ============================================================ */

const SAFARI_PAINT = {
  meadow: { back: meadowBack, floor: meadowFloor, front: meadowFront },
  forest: { back: forestBack, floor: forestFloor, front: forestFront },
  wetland: { back: wetlandBack, floor: wetlandFloor },
  marsh: { back: marshBack, floor: marshFloor, front: marshFront },
  peak: { back: peakBack, floor: peakFloor, front: peakFront },
  desert: { back: desertBack, floor: desertFloor, front: desertFront },
};
const areaPaint = () => SAFARI_PAINT[S.raw.area];
const landmarkSide = () => (S.raw.seed & 1 ? -1 : 1);   // which edge an area's big landmark takes; the rest house the other
/** A spot near one edge (`side` -1 left, 1 right, or either), clear of the two Pokémon in the middle. */
const edgeX = (side = rand() < 0.5 ? -1 : 1, reach = 0.24) => (side < 0 ? Math.floor(rand() * W * reach) : W - 1 - Math.floor(rand() * W * reach));
const groundY = (lo, hi) => horizon + Math.round((H - horizon) * (lo + rand() * (hi - lo)));

/* ----- the road through an area: every floor you walk on down the same trail towards the area's goal, which stands
   off to one side of the road far ahead, grows nearer every floor and drifts out to the edge as you come up to it ----- */

/** The trail's middle and half-width at depth t (0 at the horizon, 1 at your feet), bending a little differently on every floor. */
function trailAt(t) {
  const bend = ((((S.raw.seed || 0) >>> 3) + (S.raw.step ?? 0) + stage()) % 5 - 2) * 0.035;
  return { x: W * (0.48 - 0.07 * t) + Math.sin(t * Math.PI) * W * bend, half: 0.6 + t * W * 0.17 };
}
const vanishX = () => Math.round(trailAt(0).x);
const trailSpec = () => (S.trail || []).filter(s => stage() >= s.at).pop();
const along = () => dial();   // 0 at the area's entrance .. 1 at its boss
/** Where the goal stands when you're `k` of the way to it (0..1): far off by the vanishing point, out by the edge and lower once you're there. */
const approach = (side, k) => ({ x: Math.round(vanishX() + side * W * (0.06 + 0.34 * k * k)), foot: horizon - 1 + Math.round((H - horizon) * 0.14 * k * k) });

function paintTrail() {
  const spec = trailSpec();
  if (!spec || S.raw.prop) return;
  const [lit, body, shade, edge] = spec.c, style = spec.style;
  const plank = (y) => Math.floor(2.4 / (depthOf(y) + 0.1)), pace = (y) => Math.floor(3 / (depthOf(y) + 0.12));
  for (let y = horizon + 2; y < H; y++) {
    const t = depthOf(y), { x: cx, half } = trailAt(t), seam = plank(y) !== plank(y + 1);
    for (let x = Math.floor(cx - half - 1); x <= Math.ceil(cx + half + 1); x++) {
      const a = Math.abs((x - cx) / Math.max(0.6, half));
      if (a > 1) { if (style === 'planks' || dither(x, y) < 6) put(x, y, edge); continue; }   // the rim: the walkway's beam, or worn grass
      if (style === 'sand' && a > 0.6 && dither(x, y) < (a - 0.6) * 40) continue;   // trodden sand fades into the dunes
      const c = style === 'planks' ? (seam ? edge : a > 0.86 ? shade : (x * 3 + plank(y) * 5) % 9 === 0 ? shade : plank(y) % 2 ? body : lit)
        : style === 'snow' ? (dither(x, y) < 5 ? lit : a > 0.8 ? shade : body)
        : t > 0.12 && Math.abs(a - 0.45) < 0.1 ? shade : dither(x, y) < 3 ? lit : a > 0.85 && dither(x, y) < 8 ? shade : body;   // dirt: two worn ruts
      put(x, y, c);
      bare(x, y);
    }
    if (style !== 'planks' && style !== 'dirt' && pace(y) !== pace(y + 1)) {   // footprints in the snow or sand
      const fx = Math.round(cx + (pace(y) % 2 ? 1 : -1) * Math.max(1, half * 0.2));
      put(fx, y, shade);
      if (t > 0.45) { put(fx + 1, y, shade); put(fx, y - 1, shade); }
    }
  }
}

/** The posts, stones, poles or stakes lining the trail, smaller and closer together into the distance. */
function trailMarkers() {
  const spec = trailSpec();
  if (!spec?.edge || S.raw.prop) return;
  const [lit, , shade] = M().wood, tops = [[], []];
  for (let k = 0; k < 6; k++) {
    const t = 0.05 + (k / 5) ** 1.5 * 0.6, y = horizon + 2 + Math.round(t * (H - horizon - 2)), { x: cx, half } = trailAt(t);
    const h = Math.max(2, Math.round(1 + t * Math.min(W, H) * 0.1)), wide = t > 0.35;
    [-1, 1].forEach((side, i) => {
      const x = Math.round(cx + side * (half + 1 + t * 3));
      if (spec.edge === 'stone') { rock(x, y, t > 0.3 ? 2 : 1); return; }
      const [a, b] = spec.edge === 'pole' ? [S.pole[0], S.pole[0]] : spec.edge === 'stake' ? [S.dead[0], S.dead[2]] : [lit, shade];
      for (let yy = y - h + 1; yy <= y; yy++) { solid(x, yy, a); if (wide) solid(x + 1, yy, b); }
      if (spec.edge === 'pole') for (let yy = y - h + 1; yy < y - h + 1 + Math.max(1, Math.round(h * 0.3)); yy++) { solid(x, yy, S.pole[1]); if (wide) solid(x + 1, yy, S.pole[2]); }   // a snow pole's orange tip
      tops[i].push([x, y - h + 1 + (spec.edge === 'rope' ? Math.round(h * 0.2) : 0), h]);
    });
  }
  if (spec.edge === 'rope' || spec.edge === 'rail') for (const list of tops) for (let k = 1; k < list.length; k++) {
    const [x0, y0] = list[k - 1], [x1, y1, h] = list[k];
    strokeLine(x0, y0, x1, y1, spec.edge === 'rope' ? M().rope[0] : lit, spec.edge === 'rope' ? Math.max(1, h * 0.15) : 0);
  }
}

function strokeLine(x0, y0, x1, y1, c, sag = 0) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) { const t = i / n; solid(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag), c); }
}

/* ----- a landmark by the road on every floor, so neighbouring floors never look alike ----- */

const ROADSIDE = {
  shared: ['signpost', 'crates', 'bench', 'lookout', 'tent'],
  meadow: ['haybales'], forest: ['logpile'], wetland: ['rowboat'], marsh: ['stilthut'], peak: ['cairn'], desert: ['bones', 'snag'],
};

function floorLandmark() {
  const st = stage(), step = S.raw.step;
  if (step == null || S.raw.prop || st === 3 || (st === 0 && step === 0)) return;   // the entrance has its sign, the boss its rest house
  const list = [...ROADSIDE.shared, ...ROADSIDE[S.raw.area]];
  const kind = list[(((S.raw.seed || 0) >>> 2) + step * 3 + st * 5) % list.length];
  // just past the fence, so it stands behind both Pokémon in battle, not over yours
  const side = (step + st) % 2 ? -1 : 1, y = horizon + 5 + Math.round((H - horizon) * (((S.raw.seed || 0) >>> 5) + step) % 3 * 0.03);
  const x = side < 0 ? Math.round(W * 0.14) : Math.round(W * 0.86), s = Math.max(1, Math.round(Math.min(W, H) / 55));
  ({
    signpost: () => signpost(x, y, s, -side), crates: () => crates(x, y, s), bench: () => bench(x, y, s), lookout: () => lookout(x, y, s),
    tent: () => tent(x, y, s), haybales: () => haybales(x, y, s), logpile: () => logpile(x, y, s), rowboat: () => rowboat(x, y, s),
    stilthut: () => stiltHut(x, y, s), cairn: () => cairn(x, y, s), bones: () => bones(x, y), snag: () => deadTree(x, y, 10 * s, S.dead),
  })[kind]();
}

/** A fingerpost: two arrow boards, one pointing on down the road, one back the way you came. */
function signpost(cx, foot, s, dir) {
  const [lit, body, shade] = M().wood, ink = M().sign[4];
  for (let y = foot - 9 * s; y <= foot; y++) { solid(cx, y, lit); if (s > 1) solid(cx + 1, y, shade); }
  for (const [row, d] of [[foot - 8 * s, dir], [foot - 5 * s, -dir]]) {
    const len = 5 * s;
    for (let k = 0; k <= len + s; k++) for (let y = 0; y < 2 * s; y++) {
      if (k > len && Math.abs(y - (s - 0.5)) > len + s - k) continue;   // the arrow's point
      solid(cx + d * (k - s), row + y, y === 0 ? lit : y === 2 * s - 1 ? shade : k % 3 === 1 && k < len - 1 && y === s ? ink : body);
    }
  }
}

/** Safari Ball crates stacked by the road, the Zone's green band on each. */
function crates(cx, foot, s) {
  const [, body, shade, line] = M().wood, [board, , green] = M().sign;
  const box = (x0, y1, w, h) => {
    for (let y = y1 - h; y <= y1; y++) for (let x = x0; x <= x0 + w; x++) {
      const edge = y === y1 - h || y === y1 || x === x0 || x === x0 + w;
      solid(x, y, edge ? line : y <= y1 - h + Math.max(1, Math.round(h * 0.3)) ? green : x > x0 + w * 0.6 || (x - x0 + y) % 4 === 0 ? shade : body);
    }
    solid(x0 + Math.round(w / 2), y1 - h + 1, board);
  };
  box(cx - 4 * s, foot, 5 * s, 4 * s);
  box(cx + s + 1, foot, 4 * s, 3 * s);
  box(cx - 3 * s, foot - 4 * s, 4 * s, 3 * s);
}

function bench(cx, foot, s) {
  const [lit, body, shade, line] = M().wood, w = 5 * s;
  for (let x = -w; x <= w; x++) { solid(cx + x, foot - 2 * s, lit); solid(cx + x, foot - 2 * s + 1, shade); solid(cx + x, foot - 4 * s, body); }
  for (const lx of [-w + 1, w - 1]) for (let y = foot - 4 * s; y <= foot; y++) solid(cx + lx, y, line);
}

/** A ranger's lookout: a railed platform on stilts under a little green roof. */
function lookout(cx, foot, s) {
  const [lit, body, shade, line] = M().wood, [roof, roofShade, roofDark] = M().roof;
  const half = 4 * s, deck = foot - 9 * s;
  for (const lx of [-half + 1, half - 1]) for (let y = deck; y <= foot; y++) { solid(cx + lx, y, body); solid(cx + lx + 1, y, shade); }
  for (let k = 0, n = 2 * half - 2; k <= n; k++) { solid(cx - half + 2 + k, deck + 2 + Math.round(k * (foot - deck - 3) / n), line); solid(cx + half - 1 - k, deck + 2 + Math.round(k * (foot - deck - 3) / n), line); }   // cross bracing
  for (let x = -half - 1; x <= half + 2; x++) { solid(cx + x, deck, lit); solid(cx + x, deck + 1, line); solid(cx + x, deck - 2 * s, body); }
  for (const lx of [-half - 1, half + 1]) for (let y = deck - 4 * s; y < deck; y++) solid(cx + lx, y, line);
  for (let k = 0; k <= 2 * s; k++) for (let x = -half - 2 + k * 2; x <= half + 3 - k * 2; x++) solid(cx + x, deck - 4 * s - k, k === 0 ? roofDark : x > 0 ? roofShade : roof);
}

/** A ranger's tent, its flap open, a pennant on top. */
function tent(cx, foot, s) {
  const [, , green, greenDark, ink] = M().sign, h = 5 * s;
  for (let k = 0; k <= h; k++) { const w = Math.round(k * 1.3); for (let x = -w; x <= w; x++) solid(cx + x, foot - h + k, x === -w || x === w ? ink : x > 0 ? greenDark : green); }
  for (let k = Math.round(h * 0.4); k <= h; k++) { const w = Math.round((k - h * 0.4) * 0.6); for (let x = -w; x <= w; x++) solid(cx + x, foot - h + k, ink); }
  solid(cx, foot - h - 1, ink); solid(cx, foot - h - 2, ink); solid(cx + 1, foot - h - 2, M().roof[0]);
}

function haybales(cx, foot, s) {
  const [lit, body, shade, line] = M().straw;
  for (const [dx, r] of [[-2 * s, 2.4 * s], [2 * s + 1, 2 * s]]) for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) {
    const d = Math.hypot(x, y);
    if (d <= r) solid(cx + dx + x, foot - Math.round(r) + y, d > r - 1 ? line : Math.round(d) % 2 ? shade : x + y < 0 ? lit : body);
  }
}

function logpile(cx, foot, s) {
  const [ring, ringDark, , line] = M().wood, r = s + 0.5;
  for (let j = 0; j < 3; j++) for (let k = 0; k < 3 - j; k++) {
    const x0 = cx + Math.round((k - (2 - j) / 2) * (2 * r + 1)), y0 = foot - Math.round(r) - Math.round(j * 2 * r);
    for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) { const d = Math.hypot(x, y); if (d <= r) solid(x0 + x, y0 + y, d > r - 0.8 ? line : d < r * 0.4 ? ringDark : ring); }
  }
}

function rowboat(cx, foot, s) {
  const [lit, body, shade, line] = M().wood, w = 6 * s, h = 2 * s;
  for (let y = 0; y <= h; y++) { const half = w - Math.round((y / h) * 2 * s); for (let x = -half; x <= half; x++) solid(cx + x, foot - h + y, y === 0 ? lit : x === -half || x === half || y === h ? line : y <= s ? shade : body); }
  strokeLine(cx - Math.round(w * 0.4), foot - h - 2 * s, cx + Math.round(w * 0.9), foot - h + s, line);   // an oar resting across it
}

/** A fisher's hut up on stilts out of the bog. */
function stiltHut(cx, foot, s) {
  const lift = 4 * s;
  for (const dx of [-5 * s, 0, 5 * s]) for (let y = foot - lift; y <= foot; y++) solid(cx + dx, y, S.dead[2]);
  restHouse(cx, foot - lift, s);
}

function cairn(cx, foot, s) {
  for (let k = 0; k < 4; k++) mound(cx + (k % 2 ? 1 : -1), foot - Math.round(k * s * 1.6), Math.round(s * (2.6 - k * 0.5)), Math.max(1, Math.round(s * 0.9)), M().stone);
}

/* ----- each area's goal, far down the road ----- */

function meadowFront() {   // the Lone Tree, where the area's boss waits
  const { x, foot, r } = loneTree();
  acacia(x, foot, r, r < 4);
}
function loneTree() {
  const k = along(), { x, foot } = approach(landmarkSide(), k), r = Math.max(3, Math.round(Math.min(W * 0.12, horizon * 0.3) * (0.25 + 0.75 * k)));
  return { x, foot, r, top: foot - Math.round(r * 1.7) };
}

/** The Peak's summit straight ahead, past the far ranges: taller and nearer every floor. */
function summit() {
  const k = along(), side = landmarkSide(), cx = vanishX() + Math.round(side * W * 0.12 * k);
  const top = horizon - Math.round(horizon * (0.62 + 0.3 * k)), half = Math.round((horizon - top) * 1.1);
  const [lit, body, shade] = k < 0.4 ? S.range : S.cliff, [snow, snowShade] = S.snow, snowline = top + Math.round((horizon - top) * (0.3 + 0.15 * k));
  for (let x = -half; x <= half; x++) {
    const y0 = top + Math.round(Math.abs(x) / half * (horizon - top) + Math.sin(x * 0.9) * 1.2 + Math.abs(Math.sin(x * 0.31)) * 2);
    for (let y = Math.max(0, y0); y < horizon; y++) {
      const sunny = x < 0, snowy = y < snowline + Math.round(Math.sin(x * 1.3) * 2);
      solid(cx + x, y, snowy ? (sunny ? (dither(x, y) < 13 ? snow : snowShade) : snowShade) : sunny ? (dither(x, y) < 4 ? lit : body) : dither(x, y) < 10 ? shade : body);
    }
  }
}

function safariBackdrop() {
  // every floor deals its props from its own seed, so neighbouring floors never look alike
  rand = seeded(W * 131 + H + ((S.raw.seed || 0) % 9973) + (S.raw.step ?? 0) * 7919 + stage() * 104729);
  areaPaint().back();
  if (S.raw.arena) ARENAS[S.raw.area].back();
}
function safariFloor() { (S.raw.arena ? ARENAS[S.raw.area] : areaPaint()).floor(); }

function safariFront() {
  if (S.raw.arena) { ARENAS[S.raw.area].front(); return; }
  areaPaint().front?.();
  const st = stage(), side = landmarkSide();
  if (S.raw.area !== 'peak' || st < 2) ranchFence(horizon + 3);
  trailMarkers();
  floorLandmark();
  if (st === 0 && !S.raw.step && !S.raw.prop) safariSign(Math.round(W * (side < 0 ? 0.86 : 0.14)), horizon + 4 + Math.round((H - horizon) * 0.04));
  if (st === 3 && !S.raw.prop) restHouse(Math.round(W * (side < 0 ? 0.86 : 0.14)), horizon + 4);
  // the games' tall grass in the near corners, more of it further in
  const h = Math.round((H - horizon) * (0.13 + st * 0.02)) * (S.raw.area === 'peak' && st >= 2 ? 0 : 1);   // no grass on the snow and bare rock up top
  if (h) tallGrass(-2, Math.round(W * (0.12 + st * 0.03)), H + 1, h);
  if (h) tallGrass(W - Math.round(W * (0.1 + st * 0.03)), W + 2, H + 1, Math.round(h * 0.85));
  if (S.raw.area === 'meadow' && st === 2) {   // the Tall Grass: whole meadows of it, either side of the track
    for (const s of [-1, 1]) {
      const y = groundY(0.3, 0.45), x = s < 0 ? Math.round(W * 0.02) : Math.round(W * 0.8);
      tallGrass(x, x + Math.round(W * 0.16), y, Math.round(h * (0.7 + depthOf(y))));
    }
  }
}

/** The Zone's ranch fence along the back: posts and two rails, with a few gaps (more in the wilder areas). */
function ranchFence(foot) {
  const [lit, body, shade, line] = M().wood, gaps = { marsh: 0.3, desert: 0.25, forest: 0.2 }[S.raw.area] ?? 0.1;
  const step = Math.max(5, Math.round(W / 18)), gate = vanishX(), wide = Math.max(3, Math.round(W * 0.04));
  const open = (x) => !S.raw.prop && Math.abs(x - gate) < wide;   // the gateway the trail runs through
  for (let x = -1; x < W; x += step) {
    if (rand() < gaps) continue;
    for (let dx = 0; dx <= step; dx++) if (!open(x + dx)) { solid(x + dx, foot - 3, body); solid(x + dx, foot - 1, shade); }
    if (!open(x)) for (let y = foot - 4; y <= foot; y++) { solid(x, y, y === foot - 4 ? lit : line); solid(x + 1, y, shade); }
  }
}

/** The Safari Zone's signboard at an area's entrance: a cream board under the Zone's green band, on two posts. */
function safariSign(cx, foot) {
  const s = Math.max(1, Math.round(Math.min(W, H) / 90)), [board, boardDark, green, greenDark, ink] = M().sign;
  const [lit, body, shade, line] = M().wood;
  const w = 7 * s, h = 9 * s, top = foot - h - 3 * s;
  for (const px0 of [cx - w + s, cx + w - 2 * s]) for (let y = top; y <= foot; y++) for (let k = 0; k < s + 1; k++) solid(px0 + k, y, k === s ? shade : body);
  for (let y = top; y <= top + h; y++) for (let x = cx - w; x <= cx + w; x++) {
    const edge = y === top || y === top + h || x === cx - w || x === cx + w;
    solid(x, y, edge ? line : y < top + 3 * s ? (y === top + 3 * s - 1 ? greenDark : green) : x > cx + w - 2 || y === top + h - 1 ? boardDark : board);
  }
  // a little Safari Ball on the band, and rows of lettering
  const by = top + Math.round(1.5 * s), bx = cx - w + 2 * s;
  for (let y = -s; y <= s; y++) for (let x = -s; x <= s; x++) if (x * x + y * y <= s * s + s) solid(bx + x, by + y, y < 0 ? board : y === 0 ? ink : boardDark);
  for (let x = cx - w + 4 * s; x < cx + w - s; x++) if ((x + 1) % (s + 2) < s + 1) solid(x, by, board);
  for (let row = top + 4 * s; row < top + h - s; row += 2 * s) {
    for (let x = cx - w + 2 * s; x < cx + w - 2 * s; x++) if (dither(x, row) < 11 && (x * 7 + row) % 9 !== 0) for (let k = 0; k < s; k++) solid(x, row + k, ink);
  }
}

/** A Safari rest house by the boss, like Johto's: cream walls under a green roof, a door and a window. */
function restHouse(cx, foot, s = Math.max(1, Math.round(Math.min(W, H) / 80))) {
  const [wall, wallShade, wallLine] = M().wall, [roof, roofShade, roofDark] = M().roof;
  const [, , , line] = M().wood;
  const half = 7 * s, tall = 6 * s, eave = foot - tall;
  for (let y = eave; y <= foot; y++) for (let x = -half; x <= half; x++) solid(cx + x, y, Math.abs(x) === half || y === foot ? wallLine : x > half * 0.5 ? wallShade : wall);
  for (let k = 0, rise = 5 * s; k <= rise; k++) {
    const w = half + 2 - Math.round(k * (half + 2) / (rise + 1) * 0.9);
    for (let x = -w; x <= w; x++) solid(cx + x, eave - k, k === 0 ? roofDark : x > w * 0.4 ? roofShade : (k % 2 && dither(x, k) < 4) ? roofShade : roof);
  }
  for (let y = foot - 4 * s; y < foot; y++) for (let x = -s; x <= s; x++) solid(cx + x, y, line);
  for (let y = eave + s + 1; y <= eave + 3 * s; y++) for (let x = half - 5 * s; x <= half - 2 * s; x++) solid(cx + x, y, y === eave + s + 1 ? line : M().water[1]);
  for (let x = -half - 2; x <= half + 2; x++) if (dither(x, foot) < 9) tint(cx + x, foot + 1, 0.8);
}

/** A clump of the games' tall grass: tall pointed blades over a dark heart. */
function tallGrass(x0, x1, foot, h) {
  const [lit, body, shade, deep] = S.tall, span = Math.max(1, x1 - x0);
  const taper = (x) => Math.min(1, Math.min(x - x0, x1 - x) / Math.max(2, span * 0.18) + 0.4);   // the clump rounds off at its ends
  for (let x = x0; x <= x1; x++) for (let y = foot - Math.round(h * 0.45 * taper(x) * (0.8 + 0.2 * Math.sin(x * 1.3))); y <= foot; y++) solid(x, y, dither(x, y) < 7 ? shade : deep);
  for (let x = x0; x <= x1; x += 2) {
    const bh = Math.max(2, Math.round(h * taper(x) * (0.7 + rand() * 0.3))), lean = rand() < 0.5 ? -1 : 1;
    for (let k = 0; k < bh; k++) {
      const xx = x + (k > bh * 0.65 ? lean : 0), y = foot - k;
      solid(xx, y, k >= bh - 2 ? lit : k > bh * 0.45 ? body : shade);
      if (k < bh * 0.75) solid(xx + 1, y, k < bh * 0.35 ? deep : shade);
    }
  }
}

/** Rocks and pebbles scattered over the ground. */
function scatterRocks(count) {
  for (let n = 0; n < count; n++) {
    const y = horizon + 5 + Math.floor(rand() * (H - horizon - 6));
    rock(Math.floor(rand() * W), y, depthOf(y) > 0.4 ? 2 : 1);
  }
}

/** A clump of reeds, and cattails among them where the area has them. */
function reeds(cx, foot, size, cattails = true) {
  const [lit, body, shade] = S.reed, [head, headDark] = M().cattail;
  for (let k = -size; k <= size; k += 1 + (k & 1)) {
    const h = Math.round(size * (1.4 + rand() * 1.4)), lean = k < 0 ? -1 : 1;
    for (let y = 0; y < h; y++) solid(cx + k + (y > h * 0.7 ? lean : 0), foot - y, y > h * 0.6 ? lit : y > h * 0.3 ? body : shade);
    if (cattails && rand() < 0.4) for (let y = Math.round(h * 0.55); y < Math.round(h * 0.55) + Math.max(2, Math.round(size * 0.6)); y++) {
      solid(cx + k, foot - y, head); solid(cx + k + 1, foot - y, headDark);
    }
  }
  for (let x = -size - 1; x <= size + 1; x++) bare(cx + x, foot);
}

/** A still pool on the ground: its water from `fill(x, y, d)`, a dark wet rim, lily pads if `lilies`. */
function groundPool(cx, cy, rx, ry, fill, rim, lilies = 0) {
  pool(cx, cy, rx, ry, fill, rim);
  for (let n = 0; n < lilies; n++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.75, x = cx + Math.round(Math.cos(a) * rx * r), y = cy + Math.round(Math.sin(a) * ry * r);
    lilyPad(x, y, 1 + Math.round(depthOf(y) * 2));
  }
}

function lilyPad(x, y, r) {
  const [leaf, leafDark, petal, petalLit] = S.lily;
  for (let dy = -Math.ceil(r * 0.5); dy <= Math.ceil(r * 0.5); dy++) for (let dx = -r; dx <= r; dx++) {
    if ((dx / r) ** 2 + (dy / Math.max(0.6, r * 0.5)) ** 2 <= 1 && !(dx === 1 && dy === 0)) solid(x + dx, y + dy, dy > 0 ? leafDark : leaf);
  }
  if (rand() < 0.35) { solid(x - 1, y - 1, petal); solid(x, y - 1, petalLit); solid(x - 1, y - 2, petalLit); }
}

/* ----- the Meadow ----- */

function meadowBack() {
  ridge(horizon - 10, 5, 26, 0.4, S.farHills, false);
  ridge(horizon - 5, 3, 15, 2.3, S.hills, true);
  // flat-topped trees standing alone far off over the grass
  for (let x = Math.floor(rand() * 16); x < W; x += 14 + Math.floor(rand() * 26)) acacia(x, horizon - 2 - Math.floor(rand() * 3), 2 + Math.floor(rand() * 2), true);
}

function meadowFloor() {
  const st = stage();
  bands(horizon, H, S.ground, 0.8);
  grassPatches(S.patch, Math.round(W / 9 * (1 + st * 0.3)));
  flowerClusters(Math.round(W / (st === 1 ? 4 : 12)));   // the Flower Field
  paintTrail();
  scatterRocks(Math.max(2, Math.round(W / 50)));
}

/** A savanna tree: a bare trunk forking under a wide, flat crown, lit on top. `far` ones in the hills' hazy colours. */
function acacia(cx, foot, r, far) {
  const [lit, leaf, shade, deep] = far ? [S.hills[0], S.hills[1], S.hills[2], S.hills[2]] : S.trees;
  const [bark, barkDark] = far ? [S.hills[2], S.hills[2]] : S.trunk;
  const tall = Math.round(r * 1.7), top = foot - tall, rx = Math.round(r * 2.3), ry = Math.max(1, Math.round(r * 0.55));
  for (let y = top; y <= foot; y++) {
    const lean = Math.round((foot - y) * 0.12);
    solid(cx + lean, y, bark);
    if (r > 3) solid(cx + lean + 1, y, barkDark);
    if (!far && y < foot - tall * 0.45) solid(cx - Math.round((foot - tall * 0.45 - y) * 0.9), y, bark);   // the fork
  }
  // the crown: flat clumps side by side, an umbrella with a dark, level underside
  const flat = top + Math.round(ry * 0.5);
  for (let i = 0, n = far ? 2 : 5; i < n; i++) {
    const u = n > 1 ? i / (n - 1) * 2 - 1 : 0, ccx = cx + Math.round(u * rx * 0.72), rc = Math.max(1, r * (far ? 0.9 : 0.75) * (1 - 0.3 * Math.abs(u)));
    const ccy = top - Math.round(ry * 0.35 * (1 - Math.abs(u)));
    for (let y = Math.floor(ccy - rc); y <= flat; y++) for (let x = Math.floor(-rc * 1.8); x <= rc * 1.8; x++) {
      const dx = x / 1.8, dy = y - ccy;
      if (dx * dx + dy * dy > rc * rc) continue;
      const light = -dx * 0.6 + dy;
      solid(ccx + x, y, y >= flat ? deep : light < -rc * 0.55 ? lit : light > rc * 0.45 ? shade : dither(x, y) < 2 ? lit : leaf);
    }
  }
  if (!far) for (let y = 0; y <= 1; y++) for (let x = -rx; x <= rx; x++) if (dither(x, y) < 8) tint(cx + x + 2, foot + y, 0.82);
}

/* ----- the Forest ----- */

/** Under the trees: trunks at every depth rising into a roof of leaves, the wood dim between them with a little sky
    showing through; the Thicket closes in and darkens, the boss's glade opens a hole in the middle. */
function forestBack() {
  const st = stage(), [lit, leaf, shade, deep] = S.trees;
  const [far, farDark] = S.farForest;
  for (let x = -6; x < W + 6; x += 4 + Math.floor(rand() * 4)) pine(x, horizon - 12 - Math.floor(rand() * 6), 4 + Math.floor(rand() * 3), far, farDark);
  const vx = vanishX(), R = Math.max(2, W * (0.02 + 0.1 * along()));   // the light at the end of the road, nearer every floor
  const ahead = (x, y) => st < 3 && ((x - vx) / R) ** 2 + ((y - (horizon - R * 0.8)) / (R * 1.4)) ** 2 < 1;
  const glade = (x) => (st === 3 ? Math.max(0, 1 - Math.abs(x - vx) / (W * 0.3)) : 0);   // 1 in the glade's middle
  const open = [0.25, 0.1, -0.25, 0.1][st], roof = Math.round(horizon * [0.24, 0.3, 0.42, 0.3][st]);
  for (let y = roof - 2; y < horizon; y++) for (let x = 0; x < W; x++) {
    const gap = Math.sin(x / 7 + y / 11) + Math.sin(x / 3.1 - y / 9) > 1.35 - (horizon - y) / horizon * 0.5 - open - glade(x) * 5;
    if (!gap && !ahead(x, y)) { solid(x, y, dither(x, y) < 5 ? shade : deep); tint(x, y, st === 2 ? 0.75 : 0.88); }
  }
  for (let x = Math.floor(rand() * 4); x < W; x += 4 + Math.floor(rand() * (st === 2 ? 6 : 10))) {
    if (glade(x) > 0.3 || (st < 3 && Math.abs(x - vx) < R)) continue;
    const w = 1 + Math.floor(rand() * 3), far = rand() < 0.5;
    for (let y = roof - 2; y < horizon; y++) for (let dx = 0; dx < w; dx++) {
      solid(x + dx, y, dx === w - 1 ? S.trunk[1] : S.trunk[0]);
      tint(x + dx, y, far ? 0.5 : 0.75);
    }
  }
  for (let x = 0; x < W; x++) {
    const h = Math.round(roof * (1 - glade(x) * 0.85) + 2.5 * Math.sin(x / 6) + 1.5 * Math.sin(x / 2.7 + 2));
    for (let y = 0; y <= h; y++) {
      const hole = Math.sin(x / 9 + y / 4) + Math.sin(x / 4.3 - y / 3) > 1.55 + st * 0.15 && y < h - 3;   // sky through the leaves
      if (!hole) solid(x, y, y >= h - 1 ? deep : dither(x, y) < 2 ? lit : y > h - 4 && dither(x, y) < 8 ? shade : leaf);
    }
  }
}

function forestFloor() {
  const st = stage();
  bands(horizon, H, S.ground, 0.8);
  grassPatches(S.patch, Math.round(W / 8));
  paintTrail();
  // last autumn's leaves on the ground
  for (let n = 0; n < Math.round(W * (H - horizon) / 40); n++) {
    const y = horizon + 3 + Math.floor(rand() * (H - horizon - 3)), [a, b] = S.leaves[n % S.leaves.length];
    put(Math.floor(rand() * W), y, depthOf(y) > 0.5 && n % 2 ? b : a);
  }
  for (let n = 0; n < 3 + st; n++) { const y = groundY(0.1, 0.9); ferns(edgeX(), y, 2 + Math.round(depthOf(y) * 7)); }
  for (let n = 0; n < 2 + st; n++) { const y = groundY(0.05, 0.6); mushroom(edgeX(), y, 1 + Math.round(depthOf(y) * 2), M().cap); }
  scatterRocks(Math.max(2, Math.round(W / 60)));
  if (st >= 1) { const y = groundY(0.12, 0.22); stump(edgeX(-landmarkSide(), 0.18), y, 1 + Math.round(depthOf(y) * 3), 2 + Math.round(depthOf(y) * 4), M().bark, M().wood, true); }
  if (st === 2) { const y = groundY(0.3, 0.4), s = landmarkSide(); fallenLog(s < 0 ? Math.round(W * 0.1) : Math.round(W * 0.86), y, Math.round(W * 0.07), 1 + Math.round(depthOf(y) * 2), true); }
}

/** The wood itself: broadleaf trees and pines along the back, light falling through; further in, big trees close in,
    and the boss's glade opens in a ring of them with the sun pouring down the middle. */
function forestFront() {
  const st = stage(), glade = st === 3, vx = vanishX();
  for (let x = -4; x < W + 6; x += 12 + Math.floor(rand() * 14)) {
    if (Math.abs(x - vx) < W * (glade ? 0.2 : 0.06)) continue;
    pine(x, horizon - 9 - Math.floor(rand() * 6), 4 + Math.floor(rand() * 3), S.pines[0], S.pines[1], true);
  }
  for (let x = -4; x < W + 6; x += 3 + Math.floor(rand() * 4)) if (Math.abs(x - vx) > 4) roundTree(x, horizon - 1 - Math.floor(rand() * 3), 2 + Math.floor(rand() * 3), false);   // the undergrowth
  for (let x = 0; x < W; x++) { put(x, horizon + 2, S.trees[3]); if (dither(x, horizon + 3) < 6) put(x, horizon + 3, S.trees[3]); }
  // light falling through the leaves (not across the open sky, where it would read as rain), and the wood's shade on the grass
  const low = horizon + Math.round((H - horizon) * 0.5), strength = glade ? 1.8 : 1;
  for (let y = 0; y < low; y++) for (let x = 0; x < W; x++) {
    const band = ((x - y * 0.45) % 38 + 38) % 38;
    if (band < 5 && !sky[y * W + x] && dither(x, y) < (band < 2 ? 5 : 3) * strength) tint(x, y, 1.08, 16);
  }
  for (let y = horizon + 3, reach = Math.round((H - horizon) * 0.3); y < horizon + 3 + reach; y++) for (let x = 0; x < W; x++) {
    if (dither(x, y) < 14 - (y - horizon - 3) / reach * 14 && !(glade && Math.abs(x - vx) < W * 0.25)) tint(x, y, 0.85);
  }
  if (glade) {   // a pool of sunlight on the grass
    const cy = horizon + Math.round((H - horizon) * 0.35), rx = Math.round(W * 0.34), ry = Math.round((H - horizon) * 0.3);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d < 1 && dither(x, y) < (d < 0.5 ? 10 : 4)) tint(vx + x, cy + y, 1.08, 14);
    }
  }
  nearTrees([0.1, 0.4, 0.9, 0.3][st]);
}

/* ----- the Wetland ----- */

const lakeTop = () => horizon - Math.max(6, Math.round(horizon * (0.14 + 0.3 * along())));   // the lake opens out as you come to it

function wetlandBack() {
  const top = lakeTop(), st = stage();
  ridge(top - 6, 4, 22, 1.7, S.farHills, false);
  for (let x = -4; x < W + 6; x += 3 + Math.floor(rand() * 4)) roundTree(x, top - 1 - Math.floor(rand() * 3), 2 + Math.floor(rand() * 3), false);
  // the lake, ripples running across it, glints sparkling
  const [glint] = S.glint, [ripLit, ripDark] = S.ripple;
  for (let y = top; y < horizon + 1; y++) for (let x = 0; x < W; x++) {
    const t = (y - top) / Math.max(1, horizon - top) * (S.lake.length - 1), i = Math.floor(t);
    solid(x, y, S.lake[Math.min(S.lake.length - 1, i + ((t - i) * 16 > dither(x, y) ? 1 : 0))]);
  }
  for (let x = 0; x < W; x++) solid(x, top, S.trees[3]);
  for (let n = 0, count = Math.round(W * (horizon - top) / 40); n < count; n++) {
    const y = top + 2 + Math.floor(rand() * (horizon - top - 2)), x = Math.floor(rand() * W), len = 1 + Math.round(rand() * 3 * (y - top) / (horizon - top));
    for (let k = 0; k < len; k++) solid(x + k, y, rand() < 0.6 ? ripLit : ripDark);
  }
  life.glints = [];
  life.glintColour = glint;
  for (let n = 0; n < Math.round(W / 6); n++) life.glints.push({ x: Math.floor(rand() * W), y: top + 2 + Math.floor(rand() * (horizon - top - 2)), phase: rand() * 40 });
  for (let n = 0, pads = Math.round(W / (st === 3 ? 8 : 20)); n < pads; n++) lilyPad(Math.floor(rand() * W), top + 3 + Math.floor(rand() * (horizon - top - 3)), 1);
  life.lake = { top };
  if (st >= 1) pier(landmarkSide(), top, st === 2 ? 0.34 : 0.22);
}

/** A wooden pier on stilts running out over the lake from one edge. */
function pier(side, top, reach) {
  const [lit, body, shade, line] = M().wood, deck = horizon - Math.max(2, Math.round((horizon - top) * 0.22));
  const x0 = side < 0 ? -1 : W - Math.round(W * reach), x1 = side < 0 ? Math.round(W * reach) : W + 1;
  for (let x = x0; x <= x1; x++) {
    solid(x, deck, lit); solid(x, deck + 1, x % 3 ? body : shade); solid(x, deck + 2, line);
    if ((x - x0) % 6 === 2) for (let y = deck + 2; y <= horizon + 1; y++) { solid(x, y, line); if (y < horizon) tint(x + 1, y, 0.75); }
  }
  for (const x of [side < 0 ? x1 : x0]) for (let y = deck - 3; y < deck; y++) solid(x, y, line);   // a mooring post at its end
}

function wetlandFloor() {
  const st = stage();
  bands(horizon, H, S.ground, 0.8);
  // a muddy shore along the water
  for (let x = 0; x < W; x++) { solid(x, horizon + 1, M().wood[2]); if (dither(x, horizon + 2) < 8) put(x, horizon + 2, M().wood[1]); }
  grassPatches(S.patch, Math.round(W / 10));
  flowerClusters(Math.round(W / 16));
  scatterRocks(Math.max(2, Math.round(W / 60)));
  const [, lit, body, deep] = S.lake;
  const water = (x, y, d) => (d > 0.6 ? deep : dither(x, y) < 3 ? lit : body);
  for (let n = 0; n < 7 + st * 2; n++) { const x = n < 4 ? edgeX(undefined, 0.3) : Math.floor(rand() * W); reeds(x, horizon + 3 + Math.floor(rand() * 4), 2 + Math.floor(rand() * 2)); }
  // puddles and a pond in a near corner (the Lily Lake's, big and covered in lilies)
  for (let n = 0; n < 1 + st; n++) { const y = groundY(0.2, 0.5); groundPool(edgeX(), y, 2 + Math.round(depthOf(y) * 6), 1 + Math.round(depthOf(y) * 2), water, M().bank[0], 1); }
  const s = landmarkSide(), cy = groundY(0.62, 0.7), rx = Math.round(W * (st === 3 ? 0.2 : 0.12)), ry = Math.max(2, Math.round(rx * (0.2 + depthOf(cy) * 0.12)));   // flattened like the Marsh's pools: from the screen's height it came out round, seen from above
  groundPool(s < 0 ? Math.round(rx * 0.6) : W - Math.round(rx * 0.6), cy, rx, ry, water, M().bank[0], st === 3 ? 7 : 2);
  for (let n = 0; n < 3; n++) reeds((s < 0 ? rx : W - rx) + Math.round((rand() - 0.5) * rx), cy - ry + Math.floor(rand() * 3), 2 + Math.floor(depthOf(cy) * 3));
  paintTrail();
}

/* ----- the Marsh ----- */

function marshBack() {
  S.mist = S.raw.mist + Math.round(along() * 26);   // thicker towards the Misty Mire
  const [far, farDark] = S.farForest;
  ridge(horizon - 6, 3, 18, 0.9, [far, far, farDark], false);
  for (let x = Math.floor(rand() * 10); x < W; x += 9 + Math.floor(rand() * 12)) {
    if (rand() < 0.5) deadTree(x, horizon - 3, 8 + Math.floor(rand() * 8), [far, farDark, farDark]);
    else willow(x, horizon - 2, 3 + Math.floor(rand() * 2), [far, far, farDark, farDark]);
  }
}

function marshFloor() {
  const st = stage();
  bands(horizon, H, S.ground, 0.8);
  grassPatches(S.patch, Math.round(W / 7));
  grassPatches(S.mud[0], Math.round(W / 14));
  grassPatches(S.mud[1], Math.round(W / 24));
  // bog pools, scummed with algae
  const [lit, body, shade, deep] = S.bog, [algae, algaeDark] = S.algae;
  const murk = (x, y, d) => ((x * 7 + y * 13) % 11 === 0 ? algae : (x * 5 + y * 3) % 13 === 0 ? algaeDark : d > 0.65 ? deep : dither(x, y) < 3 ? lit : d > 0.35 ? shade : body);
  life.pools = [];
  for (let n = 0, count = 3 + st * 2; n < count; n++) {
    const y = groundY(0.08, 0.8), depth = depthOf(y), rx = 4 + Math.round(rand() * 5 + depth * 14), ry = Math.max(1, Math.round(rx * (0.2 + depth * 0.12)));
    const x = n < 2 ? edgeX() : Math.floor(rand() * W);
    groundPool(x, y, rx, ry, murk, S.mud[1], Math.round(rx / 4));
    life.pools.push({ x, y, rx, ry });
    reeds(x + (rand() < 0.5 ? -rx : rx), y, 1 + Math.round(depth * 3));
  }
  paintTrail();
  scatterRocks(Math.max(2, Math.round(W / 70)));
  for (let n = 0; n < 2 + st; n++) { const y = groundY(0.05, 0.5); stump(edgeX(), y, 1 + Math.round(depthOf(y) * 2), 1 + Math.round(depthOf(y) * 4), [...S.dead, M().bark[3]], M().wood); }
}

/** Willows at the edges, drooping over the water; the Sunken Woods put dead trees standing in it. */
function marshFront() {
  const st = stage();
  for (let x = 0; x < W; x++) if (dither(x, horizon + 2) < 9) put(x, horizon + 2, S.trees[3]);
  // the Great Snag: a huge dead tree in the mist, far down the walkway, where the area's boss waits
  const k = along(), { x: gx, foot: gfoot, h: gh } = greatSnag(), [far, farDark] = S.farForest;
  deadTree(gx, gfoot, gh, k < 0.4 ? [far, farDark, farDark] : S.dead);
  for (let x = Math.floor(rand() * 8); x < W + 6; x += 10 + Math.floor(rand() * 12)) {
    if (Math.abs(x - vanishX()) < W * 0.12 || Math.abs(x - gx) < 6) continue;
    willow(x, horizon + 1, 4 + Math.floor(rand() * 3), S.trees);
  }
  if (st >= 2) for (const s of [-1, 1]) {
    const y = groundY(0.15, 0.3);
    deadTree(edgeX(s, 0.14), y, Math.round((H - horizon) * 0.4 + depthOf(y) * 20), S.dead);
  }
  const big = Math.max(6, Math.round(Math.min(W * 0.08, horizon * 0.25)));
  willow(landmarkSide() < 0 ? Math.round(W * 0.94) : Math.round(W * 0.06), horizon + Math.round((H - horizon) * 0.2), big, S.trees);
}

function greatSnag() {
  const k = along();
  return { ...approach(landmarkSide(), k), h: Math.round(horizon * (0.3 + 0.7 * k)) };
}

/** A weeping willow: a short trunk, a round crown, and long strands hanging down from it. */
function willow(cx, foot, r, [lit, leaf, shade, deep]) {
  const top = foot - r * 3, cy = top + r;
  for (let y = cy; y <= foot; y++) { solid(cx, y, S.trunk[0]); solid(cx + 1, y, S.trunk[1]); }
  for (let y = top; y <= cy + Math.round(r * 0.4); y++) for (let x = -r - 1; x <= r + 1; x++) {
    const dx = x / (r + 1), dy = (y - cy) / r;
    if (dx * dx + dy * dy > 1) continue;
    solid(cx + x, y, dx + dy < -0.6 ? lit : dx + dy > 0.5 ? deep : dither(x, y) < 6 ? shade : leaf);
  }
  for (let x = -r - 1; x <= r + 1; x++) {
    if ((x + cx) % 2) continue;
    const len = Math.round(r * (1.2 + 0.8 * Math.abs(Math.sin(x * 2.3 + cx)))), start = cy + Math.round(r * 0.3 * (1 - Math.abs(x) / (r + 1)));
    for (let k = 0; k < len && start + k <= foot; k++) solid(cx + x, start + k, k > len - 2 ? lit : x > 0 ? shade : leaf);
  }
}

/* ----- the Peak ----- */

/** A range of jagged peaks, sunlit faces to the left, snow above `snowline` (a fraction down from the top). */
function peaks(top, height, wave, seed, [lit, body, shade], snowline) {
  const ys = [];
  for (let x = -1; x <= W + 1; x++) {
    const tri = (w, s) => Math.abs(((x / w + s) % 2 + 2) % 2 - 1) * 2 - 1;
    const swell = 0.75 + 0.35 * Math.sin(x / (wave * 2.3) + seed * 3);   // some peaks stand taller than others
    const shape = Math.min(tri(wave, seed) * swell, tri(wave * 0.43, seed * 2.7) * 0.5 + 0.35) + 0.12 * Math.sin(x / (wave * 0.27) + seed * 5);
    ys.push(top + Math.round(height * (shape * 0.8 + 0.5)));
  }
  const [snow, snowShade, snowDeep] = S.snow;
  for (let x = 0; x < W; x++) {
    const y0 = ys[x + 1], sunny = ys[x + 2] < y0 || (ys[x + 2] === y0 && ys[x] > y0);
    const snowTo = y0 + Math.round(height * snowline * (0.7 + 0.5 * Math.abs(Math.sin(x * 0.7 + seed))));
    for (let y = Math.max(0, y0); y < horizon; y++) {
      const snowy = y < snowTo || (y < snowTo + 2 && dither(x, y) < 6);
      solid(x, y, snowy ? (sunny ? (y === y0 ? snow : dither(x, y) < 12 ? snow : snowShade) : snowShade) : sunny ? (dither(x, y) < 4 ? lit : body) : (dither(x, y) < 10 ? shade : body));
      if (snowy && !sunny && y > y0 + 1 && dither(x, y) < 3) solid(x, y, snowDeep);
    }
  }
}

function peakBack() {
  const st = stage();
  if (st === 3) {   // the Summit: the far range below you, a sea of cloud filling the valleys
    peaks(horizon - Math.round(horizon * 0.18), Math.round(horizon * 0.12), 13, 0.6, S.range, 0.5);
    const [white, pale, shade] = S.cloud;
    for (let y = horizon - Math.round(horizon * 0.12); y < horizon; y++) for (let x = 0; x < W; x++) {
      const crest = Math.sin(x / 6 + y * 0.4) + Math.sin(x / 2.6 - y);
      if (y > horizon - Math.round(horizon * 0.08) || crest > 0.4) solid(x, y, crest > 1.2 ? white : crest > 0 ? pale : shade);
    }
    return;
  }
  peaks(horizon - Math.round(horizon * 0.62), Math.round(horizon * 0.3), 19, 0.3, S.range, 0.45);
  peaks(horizon - Math.round(horizon * (0.32 + st * 0.08)), Math.round(horizon * 0.18), 11, 1.9, S.cliff, 0.25 + st * 0.15);
  summit();   // it towers over the nearer ridge
}

function peakFloor() {
  const st = stage();
  if (st === 2) { bands(horizon, H, S.snowField, 0.8); life.bladeDensity = 0.12; }   // the Snowfield
  else if (st === 3) {   // the bare rock of the summit, snow in its hollows
    bands(horizon, H, [S.cliff[0], S.cliff[0], S.cliff[1], S.cliff[1], S.cliff[2]], 0.8);
    life.bladeDensity = 0.08;
  }
  else bands(horizon, H, S.ground, 0.8);
  if (st < 2) grassPatches(S.patch, Math.round(W / 10));
  // snow lying in drifts, more the higher you climb
  const [snow, snowShade] = S.snow;
  grassPatches(st === 2 ? S.snowField[4] : snowShade, Math.round(W / 14 * (0.5 + st)));
  if (st !== 2) grassPatches(snow, Math.round(W / 18 * (st === 3 ? 0.8 : 0.3 + st)));
  if (st === 3) for (let n = 0; n < Math.round(W / 10); n++) {   // cracks in the summit's rock
    let x = Math.floor(rand() * W), y = horizon + 3 + Math.floor(rand() * (H - horizon - 4));
    for (let k = 0, len = 4 + Math.floor(rand() * (6 + depthOf(y) * 20)); k < len; k++) { x += rand() < 0.7 ? 1 : 0; if (rand() < 0.35) y += rand() < 0.5 ? -1 : 1; put(x, y, S.cliff[3]); if (depthOf(y) > 0.5) put(x, y - 1, S.cliff[0]); }
  }
  if (st < 2) flowerClusters(Math.round(W / 24));
  paintTrail();
  scatterRocks(Math.round(W / 30));
  for (let n = 0; n < 2 + st; n++) { const y = groundY(0.05, 0.6); mound(edgeX(), y, 2 + Math.round(depthOf(y) * 5), 1 + Math.round(depthOf(y) * 3), M().stone); }
}

/** Snow-dusted pines along the back (none on the summit, above the trees), and a cairn marking the top. */
function peakFront() {
  const st = stage();
  if (st < 3) {
    const [snow] = S.snow;
    for (let x = -4; x < W + 6; x += (st === 2 ? 11 : 5) + Math.floor(rand() * 6)) {
      if (Math.abs(x - vanishX()) < 5) continue;
      const top = horizon - 6 - Math.floor(rand() * 5), half = 4 + Math.floor(rand() * 3);
      pine(x, top, half, S.pines[0], S.pines[1], true);
      for (let k = 0, tierH = Math.max(3, Math.round(half * 1.1)); k < 3; k++) {   // snow on each tier's shoulders
        const y = top + Math.round(tierH * 0.6) * k + 1, w = Math.round(half * (0.45 + 0.55 * k / 2) * 0.5);
        for (let dx = -w; dx <= Math.max(0, w - 1); dx++) put(x + dx, y + Math.round(Math.abs(dx) * 0.8), snow);
      }
    }
  } else {
    const s = landmarkSide(), foot = groundY(0.1, 0.14), cx = s < 0 ? Math.round(W * 0.1) : Math.round(W * 0.9), size = Math.max(2, Math.round(W / 60));
    for (let k = 0; k < 4; k++) mound(cx + (k % 2 ? 1 : -1), foot - k * size * 1.4, Math.round(size * (2.4 - k * 0.45)), Math.round(size * 0.8), M().stone);
  }
}

/* ----- the Desert ----- */

function desertBack() {
  const st = stage();
  const [far, farDark] = S.farMesas;
  for (const [at, rise, width] of [[0.18, 0.2, 0.06], [0.5, 0.14, 0.09], [0.8, 0.24, 0.05]]) {
    mesa(Math.round(W * (at + (rand() - 0.5) * 0.1)), horizon - Math.round(horizon * rise), Math.max(3, Math.round(W * width)), [far, far, farDark, farDark]);
  }
  ridge(horizon - 6, 4, 30, 1.1 + rand(), [...S.farDunes, S.farDunes[1]], false);
  ridge(horizon - 2, 3, 17, 2.7 + rand(), S.dunes, true);
  if (st === 2) for (const [at, rise, width] of [[0.05, 0.62, 0.14], [0.96, 0.54, 0.12]]) {   // the Canyon's walls
    mesa(Math.round(W * at), horizon - Math.round(horizon * rise), Math.max(5, Math.round(W * width)), S.mesas);
  }
}

function desertFloor() {
  const st = stage();
  bands(horizon, H, S.ground, 0.8);
  // ripples the wind leaves in the sand
  const ripple = S.ground[5], lit = S.ground[0];
  for (let y = horizon + 3; y < H; y += 3 + Math.round(depthOf(y) * 6)) {
    for (let x = 0; x < W; x++) {
      const yy = y + Math.round(Math.sin(x / (5 + depthOf(y) * 8) + y) * (1 + depthOf(y)));
      if (Math.sin(x / 13 + y * 1.7) > -0.3) { put(x, yy, ripple); if (depthOf(y) > 0.4) put(x, yy - 1, lit); }
    }
  }
  grassPatches(S.patch, Math.round(W / 14));
  paintTrail();
  scatterRocks(Math.round(W / 24));
  for (let n = 0; n < 3 + st; n++) { const y = groundY(0.04, 0.7); cactus(edgeX(undefined, 0.3), y, 3 + Math.round(depthOf(y) * 18)); }
  for (let n = 0; n < 1 + (st === 1); n++) { const y = groundY(0.3, 0.8); bones(edgeX(undefined, 0.3), y); }
  if (st === 3) {   // the Oasis: a spring-fed pool under palms
    const s = landmarkSide(), cy = groundY(0.1, 0.14), rx = Math.round(W * 0.14), ry = Math.max(2, Math.round((H - horizon) * 0.05));
    const [, wlit, wbody, wdeep] = S.lake;
    life.oasis = { x: s < 0 ? Math.round(W * 0.14) : Math.round(W * 0.86), y: cy, rx, ry };
    groundPool(life.oasis.x, cy, rx, ry, (x, y, d) => (d > 0.6 ? wdeep : dither(x, y) < 3 ? wlit : wbody), S.cactus[2]);
    life.glints = Array.from({ length: Math.round(rx / 2) }, () => ({ x: life.oasis.x + Math.round((rand() - 0.5) * rx * 1.4), y: cy + Math.round((rand() - 0.5) * ry), phase: rand() * 40 }));
    life.glintColour = S.glint[0];
  }
}

function desertFront() {
  const o = life.oasis;
  if (!o) {   // the oasis's palms far down the track, shimmering in the heat, nearer every floor
    const k = along(), { x, foot } = approach(landmarkSide(), k), h = Math.max(4, Math.round(horizon * (0.1 + 0.3 * k)));
    for (let dx = -Math.round(h * 0.5); dx <= Math.round(h * 0.5); dx++) if (dither(x + dx, foot) < 12) put(x + dx, foot + 1, S.lake[2]);
    palm(x - Math.round(h * 0.25), foot, h, -0.6);
    palm(x + Math.round(h * 0.2), foot, Math.round(h * 0.8), 0.8);
    life.glints = Array.from({ length: 6 }, () => ({ x: x + Math.round((rand() - 0.5) * h), y: foot + 1, phase: rand() * 40 }));
    life.glintColour = S.glint[0];
    return;
  }
  for (const [dx, h, lean] of [[-0.9, 1.4, -1], [-0.3, 2, -0.4], [0.7, 1.7, 1]]) palm(o.x + Math.round(dx * o.rx), o.y - Math.round(o.ry * 0.6), Math.round(horizon * h * 0.36), lean);
}

/** A date palm: a curving ringed trunk under a burst of drooping fronds. */
function palm(cx, foot, h, lean) {
  const [lit, body, shade] = S.palmTrunk, [leaf, leafBody, leafDark] = S.palm;
  let x = cx;
  for (let y = 0; y < h; y++) {
    x = cx + Math.round(lean * (y / h) ** 2 * h * 0.3);
    solid(x, foot - y, y % 3 === 0 ? shade : lit); solid(x + 1, foot - y, y % 3 === 0 ? shade : body);
  }
  const tx = x, ty = foot - h, len = Math.max(4, Math.round(h * 0.45));
  for (const a of [-2.7, -2.1, -1.4, -0.4, 0.3, 0.9, -1.75]) {
    for (let s = 0; s <= len; s++) {
      const fx = tx + Math.cos(a) * s, fy = ty + Math.sin(a) * s * 0.6 + (s / len) ** 2 * len * 0.7;
      solid(fx, fy, s < 2 ? leafDark : leafBody);
      if (s % 2 === 0 && s > 1) { solid(fx, fy + 1, leafDark); solid(fx, fy - 1, leaf); }
    }
  }
}

/** A bleached skull and a scatter of bones half sunk in the sand. */
function bones(cx, y) {
  const [lit, body, line] = S.bone;
  const big = depthOf(y) > 0.5;
  pixelMap(cx - 2, y - 3, big ? ['.LLL.', 'LbLbL', 'LLLLo', '.LoL.'] : ['.LL.', 'LbLo'], { L: lit, b: line, o: body });
  for (let k = 0; k < (big ? 5 : 3); k++) put(cx + 4 + k, y - (k % 2), k % 2 ? body : lit);
}

/* ----- what moves: splashes on the lake, bubbles in the bog, snow on the peak, sand and tumbleweed in the desert ----- */

function makeSafariLife() {
  const a = S.raw.area, st = stage();
  if (a === 'wetland') life.splash = { next: tick + FPS * 2 };
  if (a === 'marsh') life.bubbles = (life.pools || []).map(p => ({ ...p, at: Math.floor(rand() * 60) }));
  if (a === 'peak' && (st >= 1 || S.stars)) life.flakes = Array.from({ length: Math.round(W / 10 * [0.4, 0.6, 1.6, 1][st]) }, () => ({ x: rand() * W, y: rand() * H, vy: 0.25 + rand() * 0.3, phase: rand() * 30 }));
  if (a === 'desert') {
    life.sand = Array.from({ length: Math.round(W / 9) }, () => ({ x: rand() * W, y: horizon - 6 + rand() * (H - horizon + 6), vx: 0.5 + rand() * 0.6, phase: rand() * 30 }));
    life.weed = { next: tick + FPS * 3 };
  }
}

function drawSafari(t) {
  const L = life;
  if (L.splash) {   // now and then something jumps in the lake and rings spread where it went back in
    const s = L.splash;
    if (!s.x && t >= s.next) Object.assign(s, { x: 2 + rand() * (W - 4), y: L.lake.top + 2 + rand() * (horizon - L.lake.top - 3), at: t });
    if (s.x) {
      const age = t - s.at, r = age * 0.7;
      if (age < 3) { put(s.x, s.y - 2 + age, S.ripple[0]); put(s.x + 1, s.y - 3 + age, S.ripple[0]); }
      for (let x = -r - 1; x <= r + 1; x++) { const k = 1 - (x / (r + 1)) ** 2; if (age > 1 && k > 0) put(s.x + x, s.y + Math.round(Math.sqrt(k) * (r * 0.3 + 0.5)) * (x % 2 ? 1 : -1), S.ripple[0]); }
      if (age > 10) { s.x = 0; s.next = t + FPS * (3 + rand() * 6); }
    }
  }
  if (L.bubbles) for (const b of L.bubbles) {   // marsh gas bubbling up through the pools
    const age = (t + b.at) % 50;
    if (everyAt(50, -b.at)) { b.bx = b.x + Math.round((rand() - 0.5) * b.rx); b.by = b.y + Math.round((rand() - 0.5) * b.ry); }
    if (b.bx == null || age > 8) continue;
    const [lit, body] = S.bog;
    if (age < 6) { put(b.bx, b.by - (age > 3 ? 1 : 0), lit); if (age > 2) put(b.bx + 1, b.by, body); }
    else { put(b.bx - 1, b.by, lit); put(b.bx + 2, b.by, lit); }
  }
  if (L.flakes) for (const f of L.flakes) {
    f.y += (f.vy * (1 + storm.level * 2)) * DT; f.x += (Math.sin((t + f.phase) / 6) * 0.3 - storm.level * 0.6) * DT;
    if (f.y > H + 1) { f.y = -1; f.x = rand() * W; }
    if (f.x < -1) f.x = W;
    put(f.x, f.y, S.flake[(f.phase | 0) % 2]);
  }
  if (L.sand) for (const m of L.sand) {   // grains blowing low over the sand
    m.x += (m.vx * (1 + storm.level * 2)) * DT; m.y += (Math.sin((t + m.phase) / 5) * 0.08) * DT;
    if (m.x > W + 1) { m.x = -1; m.y = horizon - 6 + rand() * (H - horizon + 6); }
    if (Math.sin((t + m.phase) / 4) > -0.2) put(m.x, m.y, S.ember[(m.phase | 0) % 3]);
  }
  if (L.weed) {   // a tumbleweed bowling across the sand now and then
    const w = L.weed;
    if (!w.y && t >= w.next) Object.assign(w, { x: -6, y: groundY(0.3, 0.85), r: 0 });
    if (w.y) {
      w.r = 1 + Math.round(depthOf(w.y) * 3);
      w.x += (0.8 + depthOf(w.y) * 1.2) * DT;
      const hop = Math.abs(Math.sin((w.x / (w.r * 3 + 2)))) * w.r, [a, b] = S.weed;
      for (let y = -w.r; y <= w.r; y++) for (let x = -w.r; x <= w.r; x++) {
        const d = x * x + y * y;
        if (d <= w.r * w.r && (d >= (w.r - 1) * (w.r - 1) || (x * 3 + y * 5 + Math.round(w.x)) % 4 === 0)) put(w.x + x, w.y - w.r - hop + y, (x + y + Math.round(w.x)) % 3 ? a : b);
      }
      for (let x = -w.r; x <= w.r; x++) if (dither(x, w.y) < 6) tint(w.x + x, w.y + 1, 0.85);
      if (w.x > W + 6) { w.y = 0; w.next = t + FPS * (6 + rand() * 10); }
    }
  }
}

/* ----- the Safari areas' boss preludes: the area's goal wakes before its boss steps out (bossArenaPrelude()) -----
   The main biomes' beats: a wake of about 29 frames (8 fps) building to its climax, a portal of 9 that floods the
   screen into the paired white flashes, and an `awake` look that lingers, quietly, over the fight. */

const FLOCK_AT = 17, SUNBURST_AT = 18, SURGE_AT = 17, LOOM_AT = 18, AVALANCHE_AT = 16, HABOOB_AT = 17;   // each climax's frame

const SAFARI_PRELUDES = {
  meadow: { wake: meadowWake, portal: meadowPortal, sounds: [[0, 'leaf-storm'], [FLOCK_AT, 'flock']] },
  forest: { wake: forestWake, portal: forestPortal, sounds: [[0, 'glade-hum'], [SUNBURST_AT, 'sunburst']] },
  wetland: { wake: wetlandWake, portal: wetlandPortal, sounds: [[0, 'lake-churn'], [SURGE_AT, 'wave-crash']] },
  marsh: { wake: marshWake, portal: marshPortal, sounds: [[0, 'mist-drone'], [7, 'creak'], [13, 'creak'], [LOOM_AT, 'loom']] },
  peak: { wake: peakWake, portal: peakPortal, sounds: [[0, 'quake'], [7, 'ice-crack'], [AVALANCHE_AT, 'avalanche']] },
  desert: { wake: desertWake, portal: desertPortal, sounds: [[0, 'mirage'], [HABOOB_AT, 'sandstorm']] },
};

const preludeAge = (t) => Math.max(0, t - bossPrelude.at);
/** The preludes' paired white frames, true once drawn; under Reduced flashing (calmFx) the prelude just carries on. */
function whiteOut() { if (calmFx()) return false; px.fill(abgr('#fffce8')); return true; }
function flashScreen(k = 1.35, add = 70) {
  if (calmFx()) { k = 1 + (k - 1) * 0.3; add *= 0.3; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tint(x, y, k, add); }
/** Lays colour `c` over the picture (only the sky with `skyOnly`), `k` of the way. */
function veil(c, k, skyOnly = false) {
  if (k <= 0) return;
  for (let i = 0; i < W * H; i++) if (!skyOnly || sky[i]) blend(i % W, (i / W) | 0, c, Math.min(1, k));
}

/* --- the Meadow: the Lone Tree's crown thrashes in a rising wind, then a flock bursts out of it --- */

/** A bird, `s` pixels a wing, wings up or down: one pixel far off, a big silhouette close up. */
function flyer(x, y, s, up, c) {
  const thick = Math.max(1, Math.round(s / 6));
  for (let k = -s; k <= s; k++) {
    const a = Math.abs(k), lift = up ? -Math.round(a * 0.6) : Math.round(a * 0.35 + (a / s) ** 3 * s * 0.25);
    for (let w = 0, n = Math.max(1, Math.round(thick * (1 - a / (s + 1)) + 0.5)); w < n; w++) put(x + k, y + lift + w, c);
  }
  for (let w = 0; w <= thick; w++) { put(x, y + w, c); put(x, y + w + 1, c); }
}

/** The crown swaying: each row shifted sideways, the top the most (from this frame's picture, so clouds behind it stay). */
function swayCrown(time, amp) {
  const { x: cx, r, top } = loneTree(), y0 = Math.max(0, top - r - 3), y1 = top + Math.round(r * 0.5);
  const x0 = Math.max(0, cx - r * 3 - 4), x1 = Math.min(W - 1, cx + r * 3 + 6), src = px.slice();
  for (let y = y0; y <= y1; y++) {
    const dx = Math.round(Math.sin(time * 1.9 + y * 0.35) * amp * (0.4 + 0.6 * (y1 - y) / (y1 - y0 + 1)));
    if (dx) for (let x = x0; x <= x1; x++) px[y * W + x] = src[y * W + Math.max(0, Math.min(W - 1, x - dx))];
  }
}

/** Leaves torn off the crown, blown downwind and fluttering down. */
function leafFlurry(cx, cy, r, age, n) {
  for (let i = 0; i < n; i++) {
    const span = 14, run = age + noise(i, 31, 0) * span, lap = Math.floor(run / span), a = run % span;
    const x = cx + (noise(i, lap, 32) - 0.5) * r * 5 + a * (1.2 + noise(i, lap, 33) * 2) * W / 200;
    const y = cy + (noise(i, lap, 34) - 0.5) * r * 1.2 + a * a * 0.02 * r + Math.sin(a + i) * 1.5;
    put(x, y, S.trees[i % 2]);
    if (i % 3 === 0) put(x + 1, y, S.trees[2]);
  }
}

/** Gusts streaking across the sky and the grass. */
function windStreaks(age, k, speed = 1) {
  for (let i = 0, n = Math.round(W / 10 * k); i < n; i++) {
    const y = Math.round(noise(i, 35, 0) * H), len = 3 + Math.round(noise(i, 35, 1) * 6 * (0.5 + Math.max(0, depthOf(y))));
    const x = ((noise(i, 35, 2) * W + age * W * 0.09 * speed * (0.7 + noise(i, 35, 3))) % (W + 20)) - 10;
    for (let d = 0; d < len; d++) if (dither(Math.round(x + d), y) < 9) tint(x + d, y, 1.12, 26);
  }
}

/** The flock, `e` frames after it burst out of the crown: most climb away, a few come straight at you, growing. */
function flock(cx, cy, r, e, n) {
  for (let i = 0; i < n; i++) {
    const a = e - noise(i, 41, 0) * 3;
    if (a < 0) continue;
    const ang = -Math.PI / 2 + (noise(i, 41, 1) - 0.5) * 2.8, v = W * (0.012 + noise(i, 41, 2) * 0.022), near = noise(i, 41, 3) < 0.25;
    const sx = cx + (noise(i, 41, 4) - 0.5) * r * 4, sy = cy + (noise(i, 41, 5) - 0.3) * r;
    const x = sx + Math.cos(ang) * v * a * (near ? 0.6 : 1) + Math.sin(a * 0.9 + i) * 2;
    const y = sy + Math.sin(ang) * v * a * 0.7 + (near ? a * a * 0.12 * H / 120 : 0);
    flyer(Math.round(x), Math.round(y), near ? 1 + Math.round(a * 0.5) : 1 + (i % 3 === 0), (Math.floor(a) + i) % 2 === 0, S.bird);
  }
}

function meadowWake(t) {
  const awake = bossPrelude.phase === 'awake', age = preludeAge(t);
  const { x: cx, r, top } = loneTree(), cy = top - Math.round(r * 0.3);
  if (awake) {   // the crown still stirs, and a few birds wheel over it
    swayCrown(t / 3, 0.6);
    for (let i = 0; i < 5; i++) {
      const ang = t * 0.12 + i * Math.PI * 0.4;
      flyer(Math.round(cx + Math.cos(ang) * r * 2.6), Math.round(cy - r * 1.4 + Math.sin(ang) * r * 0.5), 1, (Math.floor(t) + i) % 2 === 0, S.bird);
    }
    return 0;
  }
  const s = Math.min(1, age / FLOCK_AT), e = age - FLOCK_AT;
  swayCrown(age, e < 0 ? 0.5 + s * 2.2 : Math.max(1, 3 - e * 0.2));
  veil(abgr('#3a4a5a'), s * 0.3, true);   // clouds gather
  windStreaks(age, s);
  leafFlurry(cx, cy, r, age, e < 0 ? Math.round(6 + s * 30) : 50);
  if (e < 0) return age > 8 ? 1 : 0;
  if (Math.floor(e) === 0) flashScreen(1.2, 34);
  shockRing(cx, cy, e * W * 0.1, [S.trees[0], S.trees[1]], 0.5);   // a ring of leaves blown outwards
  flock(cx, cy, r, e, 60);
  return e < 3 ? 2 : 0;
}

/** The whole flock wheels round and pours at you, every bird bigger than the last, until they black out the screen. */
function meadowPortal(t) {
  const age = preludeAge(t), frame = age | 0;
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  const { x: cx, r, top } = loneTree(), cy = top - Math.round(r * 0.3);
  swayCrown(age, 2);
  veil(abgr('#3a4a5a'), 0.3, true);
  windStreaks(age, 1, 1.5);
  flock(cx, cy, r, age + 12, 60);
  for (let i = 0; i < 90; i++) {
    const a = age - noise(i, 43, 0) * 3;
    if (a < 0) continue;
    const u = Math.min(1, a / 4), ang = noise(i, 43, 1) * Math.PI * 2;
    const x = cx + (W / 2 - cx) * u + Math.cos(ang) * W * 0.6 * u * (0.3 + noise(i, 43, 2));
    const y = cy + (H / 2 - cy) * u + Math.sin(ang) * H * 0.6 * u * (0.3 + noise(i, 43, 3));
    flyer(Math.round(x), Math.round(y), Math.round(1 + u * u * Math.min(W, H) * 0.22), (frame + i) % 2 === 0, S.bird);
  }
  return frame < 6 ? 1 : 0;
}

/* --- the Forest: the wood goes dark, beams reach down through the opening in the leaves, then the glade floods with light --- */

const gladeLight = () => ({ vx: vanishX(), cy: horizon + Math.round((H - horizon) * 0.35), rx: Math.round(W * 0.34), ry: Math.round((H - horizon) * 0.3) });
const GLOW = () => [abgr('#fffce8'), S.pollen[0], S.pollen[1]];

/** Beams fanning down from the opening to the glade floor; `k` 0..2, how bright. */
function sunbeams({ vx, cy }, time, k) {
  for (let b = -3; b <= 3; b++) {
    const foot = vx + b * W * 0.1 + Math.sin(time * 0.2 + b) * 2;
    for (let y = 0; y < cy; y++) {
      const u = y / cy, mid = vx + b * W * 0.03 + (foot - vx - b * W * 0.03) * u, half = 1 + u * W * 0.025;
      for (let x = Math.floor(mid - half); x <= mid + half; x++) if (dither(x, y + (time | 0)) < k * 5) tint(x, y, 1.12 + k * 0.08, 14 + k * 14);
    }
  }
}

/** Specks of light drifting up through the beams. */
function motes({ vx, cy }, age, n) {
  const [white, hot] = GLOW();
  for (let i = 0; i < n; i++) {
    const x = vx + (noise(i, 47, 0) - 0.5) * W * 0.6 + Math.sin(age * 0.4 + i) * 2;
    const y = cy - ((age * (0.5 + noise(i, 47, 1)) + noise(i, 47, 2) * cy) % cy);
    if (Math.sin(age * 0.8 + i) > -0.3) put(x, y, i % 4 ? hot : white);
  }
}

/** The glade washed with light out to `flood` (0..1, then wider than the clearing). */
function gladeFlood({ vx, cy, rx, ry }, flood) {
  const R = rx * (0.5 + flood * 1.3), Ry = ry * (0.5 + flood * 1.6);
  for (let y = Math.max(0, Math.floor(cy - Ry)); y < Math.min(H, cy + Ry); y++) for (let x = Math.max(0, Math.floor(vx - R)); x < Math.min(W, vx + R); x++) {
    const d = ((x - vx) / R) ** 2 + ((y - cy) / Ry) ** 2;
    if (d < 1 && dither(x, y) < (1 - d) * 18 * flood) tint(x, y, 1.18, 34);
  }
}

/** Flowers opening one by one across the glade. */
function bloomGlade({ vx, cy, rx, ry }, e) {
  for (let i = 0; i < 44; i++) {
    const a = e - noise(i, 49, 0) * 6;
    if (a < 0) continue;
    const ang = noise(i, 49, 1) * Math.PI * 2, d = Math.sqrt(noise(i, 49, 2));
    const x = Math.round(vx + Math.cos(ang) * rx * d), y = Math.round(cy + Math.sin(ang) * ry * d), [petal, heart] = S.flowers[i % S.flowers.length];
    put(x, y, heart);
    if (a >= 1) { put(x - 1, y, petal); put(x + 1, y, petal); put(x, y - 1, petal); }
    if (a >= 2 && depthOf(y) > 0.4) { put(x, y + 1, petal); put(x - 1, y - 1, heart); }
  }
}

function forestWake(t) {
  const awake = bossPrelude.phase === 'awake', age = preludeAge(t), g = gladeLight(), [white, hot, glow] = GLOW();
  if (awake) { sunbeams(g, t, 0.5); motes(g, t, 12); bloomGlade(g, 20); return 0; }
  const s = Math.min(1, age / SUNBURST_AT), e = age - SUNBURST_AT;
  if (e < 0) {
    veil(abgr('#06180c'), Math.min(0.45, age / 8 * 0.45) * (1 - Math.max(0, s - 0.55)));   // the wood goes dark...
    sunbeams(g, age, s * 1.2);   // ...but for the light reaching down through the leaves
    motes(g, age, Math.round(10 + s * 40));
    heartGlow(g.vx, 0, 2 + s * W * 0.06, [white, hot, glow]);
    return 0;
  }
  if (Math.floor(e) === 0) flashScreen(1.4, 80);
  const flood = Math.min(1, (e + 1) / 5);
  gladeFlood(g, flood);
  sunbeams(g, age, 1 + flood);
  bloomGlade(g, e);
  motes(g, age, 60);
  heartGlow(g.vx, 0, W * 0.06 + e * 1.5, [white, hot, glow]);
  return e < 2 ? 1 : 0;
}

/** The light pours down out of the opening, wheeling rays and all, until it fills the screen. */
function forestPortal(t) {
  const age = preludeAge(t), frame = age | 0, [white, hot, glow] = GLOW();
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  const g = gladeLight();
  gladeFlood(g, 1);
  sunbeams(g, age, 2);
  bloomGlade(g, 20);
  const R = Math.hypot(W, H) * Math.min(1.2, ((age + 1) / 5) ** 1.5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - g.vx, y), rel = d / R;
    if (rel > 1 || (rel > 0.85 && dither(x, y) > 8)) continue;
    put(x, y, rel < 0.5 ? white : Math.sin(Math.atan2(y, x - g.vx) * 14 + age * 0.6) > 0.3 ? hot : glow);
  }
  return 0;
}

/* --- the Wetland: a squall darkens the lake, rings pulse across it as it heaves and rises, then it surges up into a great wave --- */

function lakeRing(cx, cy, r, top) {
  if (r < 1) return;
  for (let a = 0; a < Math.PI * 2; a += 0.6 / r) {
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.18;
    if (y > top && y < horizon) { put(x, y, S.ripple[0]); if (dither(x | 0, y | 0) < 6) put(x, y + 1, S.ripple[1]); }
  }
}

/** The lake's surface lifted `rise` pixels over the far shore, choppy and capped with foam. */
function lakeRise(top, rise, time) {
  if (rise < 1) return;
  for (let x = 0; x < W; x++) {
    const crest = top - rise + Math.round(Math.sin(x * 0.3 + time * 0.9) * 1.2);
    for (let y = Math.max(0, crest); y <= top; y++) put(x, y, y === crest ? S.ripple[0] : y - crest < 2 ? S.lake[1] : S.lake[2]);
  }
}

function whitecaps(top, time, n) {
  for (let i = 0; i < n; i++) {
    const lap = Math.floor((time + noise(i, 51, 0) * 6) / 6), x = noise(i, lap, 52) * W, y = top + 1 + noise(i, lap, 53) * (horizon - top - 1);
    const len = 1 + Math.round(noise(i, lap, 54) * 3 * (1 + Math.max(0, depthOf(y))));
    for (let k = 0; k < len; k++) put(x + k, y, k === 1 ? S.glint[0] : S.ripple[0]);
  }
}

/** The wave, `e` frames after the lake burst: it rises off the far side and rolls in, foam blowing off its crest. */
function greatWave(top, e) {
  const u = Math.min(1, (e + 1) / 10), foot = top + Math.round((horizon - top + (H - horizon) * 0.4) * u);
  const tall = Math.round((horizon * 0.35 + H * 0.12) * Math.min(1, (e + 1) / 6)), white = abgr('#fffce8');
  for (let x = 0; x < W; x++) {
    const crest = foot - Math.round(tall * (0.8 + 0.2 * Math.sin(x * 0.07 + e * 0.4) + 0.08 * Math.sin(x * 0.31 - e)));
    for (let y = Math.max(0, crest); y <= foot && y < H; y++) {
      const d = (y - crest) / Math.max(1, foot - crest);
      put(x, y, d < 0.06 || y >= foot - 1 ? white : d < 0.15 ? (dither(x, y + e) < 8 ? white : S.lake[0]) : d < 0.35 ? S.lake[1] : d < 0.6 ? S.lake[2] : d < 0.85 ? S.lake[3] : S.lake[4]);
    }
    for (let k = 1; k < 5; k++) if (noise(x, e * 5 + k, 55) < 0.25 - k * 0.04) put(x + k, crest - k * 2 - Math.floor(noise(x, e, 56) * 3), k < 2 ? white : S.ripple[0]);
  }
}

function wetlandWake(t) {
  const awake = bossPrelude.phase === 'awake', age = preludeAge(t), top = lakeTop(), cx = vanishX(), cy = Math.round((top + horizon) / 2);
  if (awake) { lakeRise(top, 1, t); whitecaps(top, t, Math.round(W / 30)); return 0; }
  const s = Math.min(1, age / SURGE_AT), e = age - SURGE_AT, white = abgr('#fffce8');
  veil(abgr('#1c3050'), s * 0.35, true);   // a squall comes over
  for (let y = top; y <= horizon; y++) for (let x = 0; x < W; x++) blend(x, y, S.lake[4], s * 0.35);   // the water darkens
  lakeRise(top, Math.round((e < 0 ? s * s : 1) * (horizon - top) * 0.6), age);
  whitecaps(top, age, Math.round(4 + s * W / 3));
  if (e < 0) {
    for (let k = 0; k < 4; k++) lakeRing(cx, cy, ((age + k * 4) % 16) * W * 0.04, top);   // rings pulse out of the middle
    const swell = Math.max(0, (age - 8) / (SURGE_AT - 8)), half = W * 0.12 * swell;
    if (swell) for (let dx = -Math.round(half); dx <= half; dx++) {   // and it heaves up into a mound
      const h = Math.round((1 - (dx / (half + 1)) ** 2) * swell * (horizon - top) * 0.9);
      for (let y = cy - h; y <= cy; y++) put(cx + dx, y, y === cy - h ? white : y - (cy - h) < 2 ? S.lake[0] : S.lake[1]);
    }
    return age > 8 ? 1 : 0;
  }
  if (Math.floor(e) === 0) flashScreen(1.3, 60);
  if (e < 6) {   // the mound bursts into a column of water...
    const h = Math.round(horizon * Math.min(1, (e + 1) / 2)), half = 2 + e;
    for (let y = Math.max(0, cy - h); y <= cy; y++) for (let dx = -half; dx <= half; dx++) {
      const rel = Math.abs(dx) / half;
      if (rel > 0.8 && dither(cx + dx, y + e) > 9) continue;
      put(cx + dx, y, rel < 0.35 ? white : rel < 0.7 ? S.lake[0] : S.lake[1]);
    }
  }
  greatWave(top, e);   // ...and the lake rises behind it in one great wave
  return e < 4 ? 2 : 1;
}

/** The wave breaks over you: a curtain of water and foam coming down the screen. */
function wetlandPortal(t) {
  const age = preludeAge(t), frame = age | 0, white = abgr('#fffce8');
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  veil(abgr('#1c3050'), 0.35, true);
  greatWave(lakeTop(), 12 + age);
  const fall = H * Math.min(1.1, ((age + 1) / 5) ** 1.4);
  for (let x = 0; x < W; x++) {
    const edge = fall + Math.sin(x * 0.2 + age) * 3 + noise(x >> 1, frame, 57) * 5;
    for (let y = 0; y < Math.min(H, edge); y++) {
      const d = edge - y;
      put(x, y, d < 3 ? white : d < 6 ? (dither(x, y) < 9 ? white : S.lake[0]) : ((x + y * 2 - age * 9) % 23 + 23) % 23 < 2 ? S.lake[0] : y % 3 ? S.lake[3] : S.lake[2]);
    }
  }
  return frame < 6 ? 2 : 0;
}

/* --- the Marsh: the light goes, the mist thickens, and the Great Snag looms out of it, bigger than it was, eyes kindling --- */

function mistVeil(time, k) {
  const c = S.mistColour;
  for (let y = 0; y < H; y++) {
    const near = 0.6 + 0.6 * (1 - Math.abs(y - horizon) / H);
    for (let x = 0; x < W; x++) {
      const m = Math.sin((x + time * 0.7) / 14 + y * 0.12) + Math.sin((x - time * 0.45) / 7 - y * 0.27);
      blend(x, y, c, Math.max(0, Math.min(1, k * near * (0.75 + 0.15 * m))));
    }
  }
}

/** The Snag as a silhouette `h` tall: a gnarled trunk, roots clawing the ground, crooked limbs (`reach` stretches
    them) and one reaching in over the middle; laid over the picture `k` of the way. Shaped by noise, so it holds still. */
function snagShape(cx, foot, h, reach, sway, c, k, painted = false) {
  const mask = new Uint8Array(W * H), w0 = Math.max(2, Math.round(h * 0.07)), side = cx < W / 2 ? 1 : -1;
  const mark = (x, y, w) => { for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) { const X = (x + a) | 0, Y = (y + b) | 0; if (inside(X, Y)) mask[Y * W + X] = 1; } };
  for (let y = 0; y < h * 0.5; y++) mark(cx - (w0 >> 1) + Math.round(Math.sin(y * 0.15)), foot - y, Math.round(w0 * (1 - y / h * 0.6)));
  for (const d of [-1, 1]) for (let j = 0; j < w0 * 2.5; j++) mark(cx + d * (w0 / 2 + j) - (d < 0), foot - Math.round(w0 * 0.7 * Math.exp(-j / w0)), Math.max(1, Math.round(w0 * 0.4 * Math.exp(-j / w0))));
  const limb = (x, y, len, ang, w, depth, id) => {
    for (let s = 0; s < len; s++) {
      ang += (noise(id, s, 91) - 0.5) * 0.35 + sway * 0.05;
      x += Math.cos(ang); y += Math.sin(ang);
      mark(x, y, Math.max(1, Math.round(w * (1 - s / len * 0.6))));
      if (depth < 3 && s > 2 && noise(id, s, 92) < 0.09) limb(x, y, len * 0.5, ang + (noise(id, s, 93) < 0.5 ? -0.8 : 0.8), Math.max(1, w - 1), depth + 1, id * 13 + s);
    }
  };
  const fork = foot - h * 0.5, w1 = Math.max(1, Math.round(w0 * 0.55));
  limb(cx, fork, h * 0.55 * reach, -Math.PI / 2 - 1 - sway, w1, 0, 1);
  limb(cx, fork + h * 0.05, h * 0.5 * reach, -Math.PI / 2 + 1.1 - sway, w1, 0, 2);
  limb(cx, fork, h * 0.45, -Math.PI / 2 - 0.2 + sway, w1, 0, 3);
  limb(cx, foot - h * 0.3, h * 0.5 * reach, side > 0 ? -0.35 + sway : Math.PI + 0.35 + sway, w1, 1, 4);
  for (let i = 0; i < W * H; i++) if (mask[i]) painted ? solid(i % W, (i / W) | 0, c) : blend(i % W, (i / W) | 0, c, k);
}

/** Two hollows in the Snag's trunk, glowing `glow` (0..1); past the climax a sickly light spills round them. */
function snagEyes(cx, foot, h, glow, e) {
  if (glow < 0.15) return;
  const w0 = Math.max(2, Math.round(h * 0.07)), y = Math.round(foot - h * 0.36), r = Math.max(1, Math.round(w0 * 0.2)), [hot, dim] = S.firefly;
  for (const d of [-1, 1]) {
    const ex = cx + d * Math.max(1, Math.round(w0 * 0.25));
    if (e >= 0) for (let yy = -r * 3; yy <= r * 3; yy++) for (let xx = -r * 4; xx <= r * 4; xx++) if (dither(ex + xx, y + yy) < 6 - Math.hypot(xx / 2, yy)) tint(ex + xx, y + yy, 1.3, 40);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) if ((xx / (r + 1)) ** 2 + (yy / r) ** 2 <= 1) put(ex + xx, y + yy, glow > 0.6 && Math.abs(xx) + Math.abs(yy) < r ? hot : dim);
  }
}

/** Will-o'-wisps drawn in out of the mist, circling ever closer. */
function wisps(cx, cy, age, n) {
  const [hot, dim] = S.firefly;
  for (let i = 0; i < n; i++) {
    const ang = i * 2.4 + age * 0.25 * (i % 2 ? 1 : -1), rad = 6 + W * 0.4 * (1 - Math.min(1, age / 26)) * (0.5 + noise(i, 59, 0));
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.5;
    put(x, y, hot); put(x + 1, y, dim); put(x, y + 1, dim);
    for (const [dx, dy] of [[-1, 0], [2, 0], [0, -1], [1, 2]]) tint(x + dx, y + dy, 1.2, 30);
  }
}

function marshWake(t) {
  const awake = bossPrelude.phase === 'awake', age = preludeAge(t), { x: gx, foot, h } = greatSnag();
  if (awake) { mistVeil(t, 0.2); return 0; }
  const s = Math.min(1, age / LOOM_AT), e = age - LOOM_AT, loom = Math.min(1, Math.max(0, (age - 4) / (LOOM_AT - 4)));
  veil(abgr('#101810'), s * 0.3);   // the light goes
  mistVeil(age, 0.1 + s * 0.45);   // the mist thickens round everything...
  const tall = Math.round(h * (1 + loom * 0.55 + Math.max(0, e) * 0.02)), reach = 1 + Math.min(0.35, Math.max(0, e) * 0.08);
  snagShape(gx, foot, tall, reach, Math.sin(age * 0.5) * 0.06, abgr('#141c16'), 0.25 + loom * 0.7);   // ...and the Snag looms out of it
  for (let y = foot - Math.round((H - horizon) * 0.2); y < H; y++) for (let x = 0; x < W; x++) if (dither(x, y + (age >> 1)) < 5) blend(x, y, S.mistColour, 0.5);   // mist curling round its roots
  snagEyes(gx, foot, tall, e < 0 ? loom * (0.5 + 0.5 * Math.sin(age * 1.3)) : 1, e);
  wisps(gx, foot - tall * 0.4, age, Math.round(4 + s * 10));
  if (Math.floor(e) === 0) flashScreen(1.15, 30);
  return e >= 0 && e < 3 ? 1 : 0;
}

/** The mist closes in solid, the Snag's eyes the last thing showing, then the white. */
function marshPortal(t) {
  const age = preludeAge(t), frame = age | 0;
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  const { x: gx, foot, h } = greatSnag(), tall = Math.round(h * 1.6);
  veil(abgr('#101810'), 0.3);
  snagShape(gx, foot, tall, 1.35 + age * 0.04, Math.sin(age * 0.5) * 0.06, abgr('#141c16'), 0.95);
  mistVeil(age, 0.55 + age * 0.09);
  snagEyes(gx, foot, tall, 1, 10 + age);
  wisps(gx, foot - tall * 0.4, 26 + age, 14);
  return frame < 6 ? 1 : 0;
}

/* --- the Peak: the summit shakes and cracks, snow slides off the far range, then an avalanche's powder cloud rolls in --- */

const summitCloud = () => horizon - Math.round(horizon * 0.12);   // the sea of cloud's top (peakBack)

/** A round billow of cloud or powder, lit from the top left. */
function puff(cx, cy, r, [lit, body, shade]) {
  for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) {
    const d = (x * x + y * y) / (r * r);
    if (d > 1 || (d > 0.75 && dither(cx + x, cy + y) > 8)) continue;
    const l = (x + y) / r;
    put(cx + x, cy + y, l < -0.5 ? lit : l > 0.6 ? shade : body);
  }
}

/** Cracks racing across the summit's rock and snow towards you. */
function summitCracks(reach) {
  const count = Math.max(3, Math.round(W / 60)), top = horizon + 3;
  for (let i = 0; i < count; i++) {
    let x = (i + 0.5 + (noise(i, 63, 0) - 0.5) * 0.5) * W / count;
    const end = top + (H - top) * Math.max(0, Math.min(1, reach * 1.3 - noise(i, 63, 1) * 0.3));
    for (let y = top; y < end; y++) {
      x += (x - W / 2) / W * 1.2 + (noise(i, y >> 1, 64) - 0.5) * 1.6;
      const w = Math.round(depthOf(y) * 1.6);
      for (let dx = 0; dx <= w; dx++) put(x + dx, y, S.cliff[3]);
      put(x + w + 1, y, S.snow[0]);
    }
  }
}

/** Snow sliding down the far range's faces into the sea of cloud, powder puffing off each slide's head. */
function rangeSlides(a) {
  const cloud = summitCloud(), count = Math.max(4, Math.round(W / 18)), [snow, shade, deep] = S.snow;
  for (let i = 0; i < count; i++) {
    const go = a - noise(i, 65, 0) * 6;
    if (go < 0) continue;
    const x0 = Math.round((i + 0.5 + (noise(i, 65, 1) - 0.5) * 0.6) * W / count), y0 = wallTopAt(x0);
    if (y0 >= cloud) continue;
    const len = Math.min(cloud - y0, Math.round(go * 1.5));
    for (let y = y0; y <= y0 + len; y++) {
      const w = 1 + Math.round((y - y0) / 5);
      for (let dx = -w; dx <= w; dx++) if (dither(x0 + dx, y + (a | 0)) < 12) put(x0 + dx + Math.round((y - y0) * 0.2), y, Math.abs(dx) < w ? snow : shade);
    }
    puff(x0 + Math.round(len * 0.2), y0 + len - 1, 1 + Math.min(4, go * 0.3), [snow, shade, deep]);
  }
}

/** The avalanche's powder cloud, `e` frames after it broke: billows boiling up out of the sea of cloud and rolling at you. */
function powderCloud(age, e) {
  const u = Math.min(1, (e + 1) / 12), cloud = summitCloud(), front = cloud + Math.round((H - cloud) * 0.55 * u);
  const cols = Math.max(6, Math.round(W / 14)), [snow, shade, deep] = S.snow;
  for (let j = 3; j >= 0; j--) for (let i = 0; i < cols; i++) {
    const r = (W / cols) * (0.7 + 0.5 * noise(i, j, 62)) * (0.5 + u * 1.2);
    const x = (i + 0.5) * W / cols + (noise(i, j, 61) - 0.5) * W / cols, y = front - j * r * 0.9 - Math.sin(age * 0.6 + i + j) * 1.5;
    puff(Math.round(x), Math.round(y), r, [snow, j ? shade : snow, j ? deep : shade]);
  }
  for (let y = front; y < Math.min(H, front + 4); y++) for (let x = 0; x < W; x++) if (dither(x, y) < 12 - (y - front) * 3) put(x, y, shade);
}

/** Ice and rock tumbling down ahead of it. */
function tumblingIce(e) {
  for (let i = 0; i < 14; i++) {
    const a = e - noise(i, 67, 0) * 4;
    if (a < 0) continue;
    const y = horizon + (H - horizon) * Math.min(1, a / 8) * (0.4 + noise(i, 67, 1) * 0.6) - Math.abs(Math.sin(a * 1.6 + i)) * 4;
    const x = noise(i, 67, 2) * W + Math.sin(a + i) * 2, size = 1 + Math.round(Math.max(0, depthOf(y)) * 3);
    for (let dy = 0; dy <= size; dy++) for (let dx = 0; dx <= size; dx++) put(x + dx, y + dy, dx + dy === 0 ? S.snow[0] : dx === size || dy === size ? S.cliff[2] : S.snow[1]);
  }
}

function peakWake(t) {
  const awake = bossPrelude.phase === 'awake', age = preludeAge(t);
  if (awake) {   // powder still hanging over the clouds
    for (let y = summitCloud() - 10; y < horizon + 4; y++) for (let x = 0; x < W; x++) if (dither(x, y) < 5) blend(x, y, S.snow[0], 0.5);
    return 0;
  }
  const s = Math.min(1, age / AVALANCHE_AT), e = age - AVALANCHE_AT;
  veil(abgr('#5a6a88'), s * 0.3, true);
  summitCracks(Math.min(1, age / 12));
  for (let i = 0, n = Math.round(W / 6 * s); i < n; i++) {   // snow shaken up off the ground
    const y = horizon + 3 + noise(i, 69, 0) * (H - horizon - 3), hop = Math.abs(Math.sin(age * 1.5 + i)) * 3 * s * (0.5 + depthOf(y));
    put(noise(i, 69, 1) * W, y - hop, S.snow[0]);
  }
  if (age > 4) rangeSlides(age - 4);
  if (e < 0) return age > 2 ? 1 : 0;
  if (Math.floor(e) === 0) flashScreen(1.25, 50);
  powderCloud(age, e);
  tumblingIce(e);
  return e < 6 ? 2 : 1;
}

/** The powder cloud engulfs you: a white-out. */
function peakPortal(t) {
  const age = preludeAge(t), frame = age | 0;
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  veil(abgr('#5a6a88'), 0.3, true);
  powderCloud(age, 12 + age * 3);
  tumblingIce(12 + age);
  const [snow, shade] = S.snow;
  for (let i = 0; i < 16; i++) {
    const a = age - noise(i, 71, 0) * 2;
    if (a > 0) puff(Math.round(noise(i, 71, 1) * W), Math.round(H * (0.3 + noise(i, 71, 2) * 0.7)), a * Math.min(W, H) * 0.12, [snow, snow, shade]);
  }
  veil(S.snow[0], ((age + 1) / 6) ** 2);
  return frame < 6 ? 2 : 0;
}

/* --- the Desert: the heat shimmers, false oases flicker along the horizon, the sky yellows and a wall of sand rolls in --- */

/** The air wavers: rows near the horizon slide back and forth. */
function heatShimmer(time, amp) {
  const src = px.slice(), y1 = Math.min(H, horizon + Math.round((H - horizon) * 0.3));
  for (let y = 0; y < y1; y++) {
    const dx = Math.round(Math.sin(y * 0.9 + time * 1.7) * amp * Math.max(0, 1 - Math.abs(y - horizon) / horizon));
    if (dx) for (let x = 0; x < W; x++) px[y * W + x] = src[y * W + Math.max(0, Math.min(W - 1, x - dx))];
  }
}

/** Oases that aren't there: palms over a shining pool, flickering along the horizon, and a mirage lake mirroring the sky. */
function mirage(age, s) {
  const src = px.slice(), keep = sky.slice(), o = life.oasis, white = abgr('#fffce8');
  for (let y = horizon - 2; y <= horizon + 3; y++) for (let x = 0; x < W; x++) {   // the shining band
    const from = Math.max(0, 2 * (horizon - 3) - y);
    if (dither(x, y + age) < s * 12) px[y * W + x] = src[from * W + Math.max(0, Math.min(W - 1, x + Math.round(Math.sin(y + age) * 2)))];
    if (dither(x, y) < s * 6) blend(x, y, S.lake[1], 0.5);
  }
  [0.32, 0.55, 0.72].forEach((at, i) => {
    const x = Math.round(W * at) + (o && Math.abs(W * at - o.x) < W * 0.12 ? Math.round(W * 0.12) : 0);
    const p = Math.min(1, Math.max(0, s * 1.6 - 0.25 - i * 0.15)) * (0.55 + 0.45 * Math.sin(age * 1.1 + i * 2)) * Math.min(1, Math.max(0, (HABOOB_AT - age) / 4));
    if (p < 0.08) return;
    const h = Math.round(horizon * (0.18 + 0.05 * i)), snap = px.slice();
    palm(x - Math.round(h * 0.25), horizon, h, -0.6);
    palm(x + Math.round(h * 0.2), horizon, Math.round(h * 0.8), 0.8);
    for (let dx = -Math.round(h * 0.6); dx <= h * 0.6; dx++) { put(x + dx, horizon + 1, S.lake[1]); if (dither(x + dx, age) < 3) put(x + dx, horizon + 1, white); }
    for (let y = horizon - h - 4; y <= horizon + 1; y++) for (let xx = x - h; xx <= x + h; xx++) {
      if (!inside(xx, y) || px[y * W + xx] === snap[y * W + xx]) continue;
      if ((y + (age | 0)) % 2 && p < 0.7) px[y * W + xx] = snap[y * W + xx];   // a mirage is scanlines of light
      else blend(xx, y, snap[y * W + xx], 1 - p);
    }
  });
  sky.set(keep);   // palm() paints its pixels solid; these are only light
}

/** The haboob: a wall of dust rising off the horizon, `a` frames in; past the climax its foot rolls towards you. */
function haboob(a, e) {
  const tall = Math.min(horizon * 0.95, a * horizon * 0.07), foot = horizon + Math.round((H - horizon) * Math.min(1, Math.max(0, e) / 10));
  const dust = ['#f0d8a0', '#d0a868', '#a88050', '#7a5a34'].map(abgr);
  if (tall < 1) return;
  for (let x = 0; x < W; x++) {
    const top = foot - Math.round(tall * (0.8 + 0.12 * Math.sin(x * 0.08 + a * 0.3) + 0.08 * Math.abs(Math.sin(x * 0.23 - a * 0.5))));
    for (let y = Math.max(0, top); y <= foot && y < H; y++) {
      const d = (y - top) / Math.max(1, foot - top), swirl = Math.sin(x * 0.15 + y * 0.3 - a * 0.8) + Math.sin(x * 0.05 - y * 0.2 + a * 0.4);
      if (d < 0.08 && dither(x, y) > 10) continue;
      put(x, y, dust[Math.min(3, Math.max(0, Math.floor(d * 3 + (swirl > 1 ? -1 : swirl < -1 ? 1 : 0))))]);
    }
  }
}

/** Sand driven hard across the screen. */
function sandStreaks(time, n, speed) {
  for (let i = 0; i < n; i++) {
    const y = Math.round(noise(i, 73, 0) * H), len = 3 + Math.round(noise(i, 73, 1) * 5);
    const x = ((noise(i, 73, 2) * W + time * W * 0.14 * speed * (0.7 + noise(i, 73, 3))) % (W + 20)) - 10;
    for (let d = 0; d < len; d++) put(x + d, y, S.ember[(i + d) % 3]);
  }
}

function desertWake(t) {
  const awake = bossPrelude.phase === 'awake', age = preludeAge(t);
  if (awake) { veil(abgr('#d8b070'), 0.15, true); sandStreaks(t, 18, 0.6); return 0; }
  const s = Math.min(1, age / HABOOB_AT), e = age - HABOOB_AT;
  if (e < 0) mirage(age, s);
  heatShimmer(age, Math.min(2, 0.5 + age / 6) * (e < 0 ? 1 : 0.5));
  veil(abgr('#c89048'), s * 0.35, true);   // the sky yellows
  if (age > 5) haboob(age - 5, e);
  if (e < 0) return 0;
  sandStreaks(age, Math.round(30 + e * 25), 1 + e * 0.1);
  veil(abgr('#c8a060'), Math.min(0.45, e * 0.05));
  return e < 8 ? 1 : 2;
}

/** The sandstorm swallows the screen. */
function desertPortal(t) {
  const age = preludeAge(t), frame = age | 0;
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  veil(abgr('#c89048'), 0.35, true);
  haboob(HABOOB_AT + 7 + age * 2, 12 + age * 2);
  sandStreaks(age + 30, 300, 2);
  veil(abgr('#c8a060'), 0.45 + ((age + 1) / 6) ** 2 * 0.55);
  sandStreaks(age + 30, 120, 2.5);
  return 2;
}

/* ----- the Safari areas' boss arenas: under the prelude's last white flash the boss's place becomes the area's arena
   (`S.raw.arena`, enterArena()), the area's sky and far backdrop kept, its ground and foreground repainted as a stage
   for the fight: a round floor laid on the ground under the two Pokémon (arenaGround()), the big set pieces out at the
   edges. ----- */

const ARENAS = {
  meadow: { back: stormSky, floor: cropCircle, front: standingStones, life: meadowArenaLife, noSun: true },
  forest: { back: () => {}, floor: fairyRing, front: grandTrunks, life: forestArenaLife },
  wetland: { back: waterfalls, floor: lilyThrone, front: () => reedCorners(), life: wetlandArenaLife },
  marsh: { back: bogSky, floor: bogIsland, front: snagHollow, life: marshArenaLife, noSun: true },
  peak: { back: auroraSky, floor: iceSheet, front: iceSpires, life: peakArenaLife, noSun: true },
  desert: { back: duskRuins, floor: sandDais, front: ruinColumns, life: desertArenaLife, noSun: true },
};

/** The arena's floor, laid on the ground in perspective: a disc centred on the camera's line, its near rim just in front of
    your Pokémon, its far rim just behind the boss's (or across the middle of the ground on the ?area= peek). Everything on
    it is laid out in ground units (X across, Z away), so it shrinks and flattens into the distance. The ground's vanishing
    line sits `off` rows above the painted horizon, so the far rim is DEPTH times as far off as the near one: true to the
    horizon, a disc reaching back to the boss (who stands right at it) would be dozens of screens wide with straight rims,
    and much less makes the floor's courses all the same height, a wall rather than a floor (the user's eye, 2026-10-02). */
const DEPTH = 3.4;
function arenaGround() {
  const pads = battlePads(), camX = W / 2, camH = H - horizon;
  const yb = pads ? Math.min(H - 2, pads.p.y + pads.p.half * 0.5) : horizon + camH * 0.9;
  const yt = pads ? Math.max(horizon + 1, pads.e.y - pads.e.half * 0.5) : horizon + Math.max(1, camH * 0.06);
  const off = Math.max(0, ((yb - horizon) - DEPTH * (yt - horizon)) / (DEPTH - 1));
  const hz = horizon - off, K = camH + off, Zf = K / (yt - hz), Zn = K / (yb - hz), Zc = (Zf + Zn) / 2, R = (Zf - Zn) / 2;
  const toGround = (x, y) => { const Z = K / Math.max(0.01, y - hz); return { X: (x - camX) * Z / K, Z }; };
  const toScreen = (X, Z) => ({ x: camX + X * K / Z, y: hz + K / Z, s: K / Z });   // s: screen pixels per ground unit there
  return {
    camX, hz, K, Zc, R, toGround, toScreen,
    d: (x, y) => { const { X, Z } = toGround(x, y); return Math.hypot(X, Z - Zc) / R; },
    /** A point on the floor `r` radii from its middle, `a` round from your right (π/2 is the far side). */
    at: (a, r) => toScreen(Math.cos(a) * r * R, Zc + Math.sin(a) * r * R),
  };
}

/** Paints the floor's disc (`k` radii) pixel by pixel with `paint(x, y, g)` (g: d 0..1 out from its middle, a its angle,
    X and Z, unit: ground units a pixel there), leaves it bare of blades, and hangs a face `lip` ground units deep
    under its near rim, coloured by `face(x, y, t)` (t 0 at the top of the face, 1 at its foot). */
function fillDisc(G, k, paint, lip = 0, face = null) {
  const r = G.R * k, far = G.toScreen(0, G.Zc + r).y, near = G.toScreen(0, Math.max(G.Zc - r, 1e-3)).y, low = new Int32Array(W).fill(-1);
  for (let y = Math.max(horizon + 1, Math.floor(far)); y <= Math.min(H - 1, Math.ceil(near)); y++) for (let x = 0; x < W; x++) {
    const { X, Z } = G.toGround(x, y), d = Math.hypot(X, Z - G.Zc) / r;
    if (d > 1) continue;
    const c = paint(x, y, { d, a: Math.atan2(Z - G.Zc, X), X, Z, unit: Z / G.K });
    if (c == null) continue;
    put(x, y, c); bare(x, y);
    low[x] = y;
  }
  if (lip && face) for (let x = 0; x < W; x++) {
    if (low[x] < 0) continue;
    const deep = Math.max(1, Math.round(lip * G.K / G.toGround(x, low[x]).Z));
    for (let t = 1; t <= deep; t++) { put(x, low[x] + t, face(x, low[x] + t, t / deep)); bare(x, low[x] + t); }
  }
}
const frac = (v) => v - Math.floor(v);

/** Where the two Pokémon's pads are on the canvas (their middles and half-widths), or null when no battle is laid out. */
function battlePads() {
  if (document.body.dataset.screen !== 'battle-screen') return null;
  const ez = $('enemy-zone').getBoundingClientRect(), pz = $('player-zone').getBoundingClientRect(), box = $('enemy-portrait-box').getBoundingClientRect();
  if (!ez.height || !pz.height || !box.width) return null;
  const k = W / innerWidth, base = box.width / (parseFloat(getComputedStyle($('enemy-zone')).getPropertyValue('--size')) || 1);
  const ew = base * 1.5, pw = Math.min(290, Math.max(130, innerHeight * 0.25));   // the pads' widths (.enemy-zone::after, .player-zone::before)
  return {
    e: { x: (ez.left + ez.right) / 2 * k, y: (ez.bottom + base * 0.2 - ew / 6) * k, half: ew / 2 * k },
    p: { x: (pz.left + pz.right) / 2 * k, y: (pz.bottom + pz.height * 0.04 - pw / 6) * k, half: pw / 2 * k },
  };
}

/** Lays a vertical gradient (top colour to bottom colour) over the sky, `k` of the way. */
function skyGrade(top, bottom, k) {
  const a = abgr(top), b = abgr(bottom), mix = (s, u) => Math.round(((a >> s) & 255) * (1 - u) + ((b >> s) & 255) * u);
  for (let y = 0; y < horizon; y++) {
    const u = y / Math.max(1, horizon - 1), c = ((255 << 24) | (mix(16, u) << 16) | (mix(8, u) << 8) | mix(0, u)) >>> 0;
    for (let x = 0; x < W; x++) if (sky[y * W + x]) blend(x, y, c, k);
  }
}

const lighten = (c, k) => { const f = (s) => Math.min(255, Math.round(((c >> s) & 255) * (1 - k) + 255 * k)); return ((255 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0; };
const darken = (c, k) => { const f = (s) => Math.round(((c >> s) & 255) * (1 - k)); return ((255 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0; };

function enterArena(on) {
  if (S?.raw.backdrop !== 'safari' || !!S.raw.arena === on) return;
  S.raw = { ...S.raw, arena: on };
  S.light = on && ARENAS[S.raw.area].noSun ? null : S.raw.light;   // the arena's sky has its own light, or none
  resize();
}

/* --- the Meadow: a storm gathering over a crop circle flattened in the grass, a ring of standing stones, the Lone Tree huge --- */

function stormSky() {
  skyGrade('#20263a', '#e89a48', 0.62);
  // a dark cloud bank over the top, its underside hanging in round lobes lit amber from below
  const [top, body, under, lit] = ['#24283c', '#34384e', '#4e4a5e', '#c88a5a'].map(abgr);
  for (let x = 0; x < W; x++) {
    const low = Math.round(horizon * (0.16 + 0.09 * Math.abs(Math.sin(x / 8)) + 0.035 * Math.abs(Math.sin(x / 3.3 + 1))));
    for (let y = 0; y < low; y++) if (sky[y * W + x]) put(x, y, y === low - 1 ? lit : y > low - 3 ? under : y < low * 0.4 || dither(x, y) < 5 ? top : body);
  }
  // shafts of gold light slanting down through a break in it
  const gap = Math.round(W * 0.62), gold = abgr('#f8d070');
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {
    const band = ((x - gap) + y * 0.45) / (W * 0.06);
    if (Math.abs(band) < 2.2 && Math.abs(band % 1) < 0.62 && dither(x, y) < 7) blend(x, y, gold, 0.22 * (y / horizon + 0.3));
  }
}

function cropCircle() {
  safariFloor0();
  const G = arenaGround(), flat = M().straw, ground = S.ground;
  fillDisc(G, 1, (x, y, { d, a, unit }) => {
    if (d > 0.96) return dither(x, y) < 8 ? ground[4] : ground[5];   // the standing edge
    const ring = Math.floor(d * 7), spiral = Math.sin(a * 3 + d * 9) > 0.55 && d > 0.25 && d < 0.85;
    // the flattened stalks lie in lines round the circle, narrowing into the distance (dropped where they'd be under a pixel)
    const P = G.R * 0.03, lay = P / unit > 2.5 && frac(d * G.R / P) < 0.3;
    if (d < 0.14) return lay ? flat[2] : dither(x, y) < 4 ? flat[0] : flat[1];
    if (spiral || ring % 2 === 0) return lay ? flat[2] : dither(x, y) < 3 ? flat[0] : flat[1];   // flattened, swirled one way
    return dither(x, y) < 6 ? ground[2] : ground[3];   // a ring left standing
  });
}

/** A standing stone: a rough grey slab, lit down its left side, moss at its foot. */
function menhir(cx, foot, h) {
  const w = Math.max(1, Math.round(h * 0.28)), [lit, body, shade, line] = M().stone, moss = S.trees[1];
  for (let y = 0; y < h; y++) {
    const half = Math.round(w * (1 - (y / h) ** 3 * 0.5));
    for (let x = -half; x <= half; x++) solid(cx + x, foot - y, x === half || (y === h - 1 && Math.abs(x) === half) ? line : x < -half * 0.3 ? lit : x > half * 0.4 ? shade : y < h * 0.2 && dither(x, y) < 6 ? moss : body);
  }
}

function standingStones() {
  const side = landmarkSide(), G = arenaGround();
  for (let k = 0; k < 14; k++) {   // a ring of stones round the circle, far ones small, the ones at your sides big
    const a = -0.35 + k / 13 * (Math.PI + 0.7), p = G.at(a, 1.06);
    if (p.y <= horizon + 1 || p.x < -4 || p.x > W + 4 || Math.abs(p.x - vanishX()) < W * 0.04) continue;
    menhir(Math.round(p.x), Math.round(p.y), Math.max(2, Math.round(G.R * 0.13 * p.s)));
  }
  for (const s of [-1, 1]) menhir(Math.round(W * (0.5 + s * 0.5)) - s * Math.round(W * 0.04), H - Math.round((H - horizon) * 0.05), Math.round((H - horizon) * 0.55));
  const r = Math.round(Math.min(W * 0.16, horizon * 0.42));   // the Lone Tree, huge now, its crown over the corner
  acacia(side < 0 ? Math.round(W * 0.08) : Math.round(W * 0.92), horizon + Math.round((H - horizon) * 0.12), r, false);
  tallGrass(-2, Math.round(W * 0.14), H + 1, Math.round((H - horizon) * 0.18));
  tallGrass(W - Math.round(W * 0.12), W + 2, H + 1, Math.round((H - horizon) * 0.15));
}

function meadowArenaLife(t) {
  const r = Math.round(Math.min(W * 0.16, horizon * 0.42)), tx = landmarkSide() < 0 ? Math.round(W * 0.08) : Math.round(W * 0.92), tTop = horizon + Math.round((H - horizon) * 0.12) - Math.round(r * 1.7);
  leafFlurry(tx, tTop, r, t, 16);
  windStreaks(t, 0.5);
  for (let i = 0; i < 6; i++) {   // birds wheeling over the circle
    const ang = t * 0.1 + i * Math.PI / 3;
    flyer(Math.round(W * 0.5 + Math.cos(ang) * W * 0.3), Math.round(horizon * 0.45 + Math.sin(ang) * horizon * 0.12), 1, (Math.floor(t) + i) % 2 === 0, S.bird);
  }
  if (t % 53 < 2) for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) if (sky[y * W + x]) tint(x, y, 1.3, 50);   // lightning in the clouds
}

/* --- the Forest: a fairy ring on mossy flagstones between two colossal trunks, the canopy arching overhead --- */

function fairyRing() {
  safariFloor0();
  const G = arenaGround(), [lit, body, shade, line] = M().stone, moss = [S.ground[1], S.ground[3]], RW = 0.15;
  // flagstones in rings round a round middle slab, so their curves show the floor lying flat; mossier out towards the
  // edge, a pool of the glade's light on the middle, and a step's face under the near rim. Courses running straight
  // across, with the light shafts striped down over them, read as a wall standing up (the user's eye, 2026-10-02).
  fillDisc(G, 0.8, (x, y, { d, a, unit }) => {
    const v = d / RW, ring = Math.floor(v), n = Math.max(1, Math.round(Math.PI * 2 * ring)), u = (a / (Math.PI * 2) + 1) * n + (ring & 1) * 0.5, col = Math.floor(u);
    if (ring % 3 === 2) return dither(x, y) < 6 ? S.ground[2] : S.ground[3];   // a ring of moss between the courses, bold enough to show its curve
    if (frac(v) * RW * G.R < unit || (ring > 0 && frac(u) * Math.PI * 2 * d * G.R / n < unit * 1.2)) return dither(x, y) < 7 ? moss[1] : line;
    if (ring > 0 && noise(col, ring, 7) < 0.05 + d * 0.35 && dither(x, y) < 10) return moss[dither(x, y) < 4 ? 0 : 1];
    const c = noise(col, ring, 8) < 0.3 ? lit : noise(col, ring, 9) < 0.3 ? shade : body;
    return d < 0.5 && dither(x, y) < 12 * (1 - d / 0.5) ? lighten(c, 0.18) : c;
  }, G.R * 0.025, (x, y, t) => (t < 0.35 ? shade : line));
  for (let k = 0; k < 26; k++) {   // the fairy ring: pale mushrooms all round the stones, glowing
    const p = G.at(k / 26 * Math.PI * 2, 0.85);
    if (p.y > horizon + 1) mushroom(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(G.R * 0.03 * p.s)), ['#c8f8f0', '#68c8c0', '#ffffff'].map(abgr));
  }
}

/** A colossal trunk rising out of the frame, buttress roots spreading over the floor. */
function colossalTrunk(cx, half) {
  const [bark, barkDark] = S.trunk, line = M().bark[3], foot = horizon + Math.round((H - horizon) * 0.55);
  for (let y = 0; y <= foot; y++) {
    const flare = y > foot - half * 2 ? Math.round((y - (foot - half * 2)) ** 2 / (half * 2)) : 0, w = half + flare;
    for (let x = -w; x <= w; x++) {
      const u = x / w, groove = Math.sin(x * 1.3 + Math.sin(y * 0.15) * 2) > 0.7;
      solid(cx + x, y, Math.abs(u) > 0.94 ? line : groove ? barkDark : u < -0.4 ? (dither(x, y) < 6 ? M().bark[0] : bark) : u > 0.3 ? barkDark : bark);
    }
  }
  for (const d of [-1, 1]) for (let j = 0; j < half * 4; j++) {   // roots
    const x = cx + d * (half + j), y = foot - Math.round(half * 0.8 * Math.exp(-j / half)) + Math.round(j * 0.15);
    for (let k = 0; k <= Math.max(1, Math.round(half * 0.5 * Math.exp(-j / (half * 1.5)))); k++) solid(x, y + k, k === 0 ? bark : barkDark);
  }
  for (let n = 0; n < half; n++) {   // ivy up the trunk
    const y = Math.floor(rand() * foot), x = cx + Math.round((rand() - 0.5) * half * 1.6);
    solid(x, y, S.trees[1]); solid(x + 1, y + 1, S.trees[2]);
  }
}

function grandTrunks() {
  const half = Math.max(3, Math.round(Math.min(W * 0.07, horizon * 0.09)));
  // dark undergrowth closing the glade behind the floor's far rim, so the pale sky gap doesn't run on down into the
  // stones as one tall column (on a phone that read as a wall)
  const [, , fernShade, fernDeep] = [...M().fern, S.trees[3]];
  for (let x = 0; x < W; x++) {
    const h = Math.max(2, Math.round(horizon * 0.07 + 2 * Math.sin(x / 3.3) + 1.5 * Math.sin(x / 1.7 + 1)));
    for (let y = horizon - h; y <= horizon; y++) solid(x, y, y < horizon - h + 2 && dither(x, y) < 6 ? fernShade : fernDeep);
  }
  for (let x = Math.floor(rand() * 5); x < W; x += 5 + Math.floor(rand() * 5)) ferns(x, horizon, 2 + Math.floor(rand() * 2));
  colossalTrunk(Math.round(W * 0.03), half);
  colossalTrunk(Math.round(W * 0.97), half);
  // the canopy arching between them, open in the middle
  const [lit, leaf, shade, deep] = S.trees;
  for (let x = 0; x < W; x++) {
    const u = Math.abs(x - W / 2) / (W / 2), h = Math.round(horizon * (0.06 + 0.5 * u ** 2.2) + 2 * Math.sin(x / 5));
    for (let y = 0; y <= h; y++) solid(x, y, y >= h - 1 ? deep : dither(x, y) < 2 ? lit : y > h - 4 && dither(x, y) < 8 ? shade : leaf);
    if (x % 7 === 0 && u > 0.35) for (let y = h; y < h + Math.round(horizon * 0.3 * u); y++) solid(x + (y % 5 === 0), y, y % 3 ? S.trees[1] : S.trees[2]);   // hanging vines
  }
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {   // shafts of light down the middle, through the air only
    const band = ((x - W / 2) - (y - horizon) * 0.25) / (W * 0.035);
    if (Math.abs(band) < 3.5 && Math.abs(band % 1) < 0.45 && dither(x, y) < 4) tint(x, y, 1.12, 22);
  }
}

function forestArenaLife(t) {
  const g = gladeLight(), G = life.ground ||= arenaGround();
  sunbeams(g, t, 0.4);
  motes(g, t, 18);
  for (let k = 0; k < 26; k++) {   // the ring's glow pulsing round it
    if (Math.sin(t * 0.3 - k * 0.6) < 0.6) continue;
    const p = G.at(k / 26 * Math.PI * 2, 0.85), x = Math.round(p.x), y = Math.round(p.y), r = Math.max(1, Math.round(G.R * 0.03 * p.s));
    for (let dy = -r * 3; dy <= 0; dy++) for (let dx = -r - 2; dx <= r + 2; dx++) if (dither(x + dx, y + dy) < 6) tint(x + dx, y + dy - r, 1.25, 34);
  }
}

/* --- the Wetland: out on the lake itself, a giant lily pad for a stage, waterfalls pouring off the far hills --- */

function waterfalls() {
  const top = lakeTop();
  for (const at of [0.22, 0.78]) {
    const x0 = Math.round(W * at), fall = wallTopAt(x0), w = Math.max(2, Math.round(W * 0.025));
    for (let y = Math.max(0, fall - 2); y < top; y++) for (let dx = -w; dx <= w; dx++) solid(x0 + dx, y, Math.abs(dx) === w ? S.lake[3] : (dx + y) % 4 === 0 ? S.lake[0] : S.lake[1]);
    for (let dx = -w * 2; dx <= w * 2; dx++) for (let k = 0; k < 2; k++) if (dither(x0 + dx, top + k) < 10) put(x0 + dx, top + k, abgr('#ffffff'));
  }
  life.falls = [0.22, 0.78].map(at => ({ x: Math.round(W * at), top: wallTopAt(Math.round(W * at)), w: Math.max(2, Math.round(W * 0.025)), foot: top }));
}

function lilyThrone() {
  const [leaf, leafDark, petal, petalLit] = S.lily, white = abgr('#ffffff');
  for (let y = horizon; y < H; y++) for (let x = 0; x < W; x++) {   // the lake right up to your feet
    const u = (y - horizon) / (H - horizon), i = Math.min(S.lake.length - 1, 1 + Math.floor(u * 3.2 + dither(x, y) / 16));
    put(x, y, S.lake[i]);
    bare(x, y);
  }
  for (let n = 0; n < Math.round(W / 4); n++) { const y = horizon + 2 + Math.floor(rand() * (H - horizon - 2)), x = Math.floor(rand() * W); for (let k = 0; k < 1 + depthOf(y) * 5; k++) put(x + k, y, S.ripple[rand() < 0.6 ? 0 : 1]); }
  // the giant pad: veins running out from the middle, an upturned rim lit on the far side, a notch cut towards the front
  // right, a thin dark edge showing under its near rim and its shadow on the water
  const G = arenaGround(), notch = (a) => a > -0.78 && a < -0.48;
  fillDisc(G, 1.035, (x, y, { a, d }) => (notch(a) || d < 0.95 ? null : S.lake[4]));
  fillDisc(G, 1, (x, y, { d, a, unit }) => {
    if (notch(a)) return null;
    const vein = Math.abs(Math.sin(a * 9)) / 9 * d * G.R < unit * 0.7 && d > 0.07;
    return d > 1 - 1.5 * unit / G.R ? (a > 0 ? lighten(leaf, 0.35) : leafDark) : vein ? lighten(leaf, 0.25) : d < 0.07 ? leafDark : dither(x, y) < 3 + d * 6 ? leafDark : leaf;
  }, G.R * 0.012, () => leafDark);
  // lotus flowers and smaller pads out on the water round it, laid on the same ground, smaller further off
  const onWater = (d) => d > 1.12;
  for (let n = 0; n < 30; n++) {
    const a = rand() * Math.PI * 2, p = G.at(a, 1.15 + rand() * 0.9);
    if (p.y <= horizon + 1 || p.y >= H || p.x < -6 || p.x > W + 6) continue;
    lilyPad(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(G.R * 0.05 * p.s)));
  }
  for (const a of [-0.25, 0.9, 2.25, 3.4]) {
    const p = G.at(a, 1.25), x = Math.round(p.x), y = Math.round(p.y), r = Math.max(1, Math.round(G.R * 0.05 * p.s));
    if (y <= horizon + 1 || y >= H || x < 0 || x >= W) continue;
    lilyPad(x, y + 1, r + 1);
    for (let k = 0; k < 6; k++) {   // a lotus: pink petals in a cup, gold in the middle
      const ang = -Math.PI / 2 + (k - 2.5) * 0.45, len = r * 2;
      for (let j = 0; j <= len; j++) solid(x + Math.round(Math.cos(ang) * j * 0.7), y - Math.round(Math.abs(Math.sin(ang)) * j), j > len * 0.6 ? petalLit : petal);
    }
    solid(x, y - 1, abgr('#f8d848'));
  }
  life.glints = Array.from({ length: Math.round(W / 5) }, () => { let x, y; for (let n = 0; n < 40 && (x == null || !onWater(G.d(x, y))); n++) { x = Math.floor(rand() * W); y = horizon + 2 + Math.floor(rand() * (H - horizon - 2)); } return { x, y, phase: rand() * 40 }; });
  life.glintColour = white;
}

function reedCorners() {
  for (let n = 0; n < 8; n++) { const s = n % 2 ? 1 : -1, y = horizon + Math.round((H - horizon) * (0.3 + rand() * 0.7)); reeds(s < 0 ? Math.floor(rand() * W * 0.1) : W - 1 - Math.floor(rand() * W * 0.1), y, 2 + Math.round(depthOf(y) * 4)); }
}

function wetlandArenaLife(t) {
  for (const fall of life.falls || []) for (let y = Math.max(0, fall.top); y < fall.foot; y++) {   // the falls pouring
    for (let dx = -fall.w + 1; dx < fall.w; dx++) if ((y - Math.floor(t) * 2 + dx * 3) % 6 === 0) put(fall.x + dx, y, S.ripple[0]);
  }
  const G = life.ground ||= arenaGround();
  for (let k = 0; k < 3; k++) {   // ripples running out from the pad's edge, on the water's own perspective
    const grow = ((t + k * 8) % 24) / 24;
    for (let a = 0; a < Math.PI * 2; a += 0.01) {
      const { x, y } = G.at(a, 1.04 + grow * 0.3);
      if (y > horizon + 1 && dither(x | 0, y | 0) < 9 - grow * 9) put(x, y, S.ripple[0]);
    }
  }
}

/* --- the Marsh: a mud island in a glowing bog, lantern stakes round it, the Great Snag towering over the corner --- */

function bogSky() {
  skyGrade('#0c1612', '#5a7060', 0.6);
}

function bogIsland() {
  const G = arenaGround(), [lit, body, shade, deep] = S.bog, [algae, algaeDark] = S.algae, glow = abgr('#3a7a50'), cell = G.R * 0.012;
  for (let y = horizon; y < H; y++) for (let x = 0; x < W; x++) {   // the bog: scum and glowing slicks laid flat on the water
    const { X, Z } = G.toGround(x, y), u = Z / G.K, n = noise(Math.floor(X / Math.min(cell, u * 3)), Math.floor(Z / Math.min(cell, Z * u * 2)), 13);   // specks no bigger than a few pixels up close (a pixel is Z/K across, Z²/K deep)
    const slick = Math.sin(X / (G.R * 0.35) + Math.sin(Z / (G.R * 0.2)) * 2) + Math.sin(Z / (G.R * 0.09)) > 1.35;
    put(x, y, n < 0.08 ? algaeDark : n < 0.13 ? algae : slick ? glow : dither(x, y) < 3 ? body : n < 0.6 ? shade : deep);
    bare(x, y);
  }
  const [mud, mudDark] = S.mud, hum = G.R * 0.03, pud = G.R * 0.09, root = G.R * 0.3;
  // the island: dark peat, mossy hummocks, puddles of bog water, roots snaking across it, a mossy bank and a muddy face
  fillDisc(G, 0.95, (x, y, { d, a, X, Z, unit }) => {
    if (d > 0.93) return a > 0 ? (dither(x, y) < 8 ? S.ground[3] : S.ground[4]) : dither(x, y) < 6 ? S.ground[4] : S.ground[5];
    if (noise(Math.floor(X / pud), Math.floor(Z / pud), 12) < 0.1 && d < 0.8) return dither(x, y) < 3 ? S.bog[0] : S.bog[2];
    const wave = (Z - G.Zc) - Math.sin(X / (G.R * 0.12)) * G.R * 0.05;
    if (frac(wave / root) < unit * 1.3 / root && d > 0.25 && d < 0.85) return M().bark[1];
    if (noise(Math.floor(X / Math.min(hum, unit * 4)), Math.floor(Z / Math.min(hum, Z * unit * 3)), 11) < 0.42) return dither(x, y) < 5 ? S.ground[2] : S.ground[4];
    return dither(x, y) < 4 ? mudDark : mud;
  }, G.R * 0.04, (x, y, t) => (t < 0.3 ? mudDark : t > 0.85 ? S.bog[3] : dither(x, y) < 5 ? S.mud[0] : mudDark));
  life.lanterns2 = [];
  for (let k = 0; k < 12; k++) {   // crooked stakes round the island, each hung with a wisp-lit lantern
    const p = G.at(-0.3 + k / 11 * (Math.PI + 0.6), 0.98), x = Math.round(p.x), foot = Math.round(p.y);
    if (foot <= horizon + 1 || x < -2 || x > W + 2 || Math.abs(x - W / 2) < W * 0.05) continue;
    const h = Math.max(3, Math.round(G.R * (0.16 + (k % 3 ? 0 : 0.04)) * p.s));
    for (let y = 0; y < h; y++) solid(x + (y > h * 0.6 && k % 2 ? 1 : 0), foot - y, y > h - 2 ? S.dead[0] : S.dead[1]);
    life.lanterns2.push({ x: x + (k % 2 ? 2 : -1), y: foot - h + 1, r: Math.max(1, Math.round(G.R * 0.025 * p.s)) });
  }
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {   // nearer stakes either side of you
    const x = s < 0 ? Math.round(W * (0.05 + k * 0.1)) : Math.round(W * (0.95 - k * 0.1)), foot = H - 2 - k * Math.round((H - horizon) * 0.2), h = Math.round((H - horizon) * (0.4 - k * 0.1));
    for (let y = 0; y < h; y++) { solid(x, foot - y, S.dead[1]); solid(x + 1, foot - y, S.dead[2]); }
    life.lanterns2.push({ x: x + 2, y: foot - h + 2, r: 2 + (1 - k) });
  }
}

function snagHollow() {
  const side = landmarkSide(), cx = side < 0 ? Math.round(W * 0.1) : Math.round(W * 0.9), foot = horizon + Math.round((H - horizon) * 0.3);
  snagShape(cx, foot, Math.round(horizon * 1.5), 1.25, 0, abgr('#18201a'), 1, true);
  for (const s of [-1, 1]) if (s !== side) for (let k = 0; k < 2; k++) deadTree(s < 0 ? Math.round(W * (0.04 + k * 0.08)) : Math.round(W * (0.96 - k * 0.08)), horizon + 4 + k * 6, Math.round(horizon * (0.6 - k * 0.15)), S.dead);
  for (let x = 0; x < W; x += 3 + Math.floor(rand() * 3)) {   // moss hanging from above the frame
    const len = Math.round(horizon * 0.12 * (0.5 + rand()) * (Math.abs(x - W / 2) / (W / 2) + 0.3));
    for (let y = 0; y < len; y++) solid(x + (y % 4 === 3), y, y > len - 2 ? S.trees[0] : S.trees[2]);
  }
}

function marshArenaLife(t) {
  const side = landmarkSide(), cx = side < 0 ? Math.round(W * 0.1) : Math.round(W * 0.9), foot = horizon + Math.round((H - horizon) * 0.3), h = Math.round(horizon * 1.5);
  snagEyes(cx, foot, h, 0.7 + 0.3 * Math.sin(t * 0.4), Math.sin(t * 0.4) > 0.6 ? 1 : -1);
  const [hot, dim] = S.firefly;
  for (const l of life.lanterns2 || []) {
    const on = Math.sin(t * 0.5 + l.x) > -0.6;
    for (let dy = -l.r - 2; dy <= l.r + 2; dy++) for (let dx = -l.r - 3; dx <= l.r + 3; dx++) if (dither(l.x + dx, l.y + dy) < (on ? 5 : 2) - Math.hypot(dx, dy) / 3) tint(l.x + dx, l.y + dy, 1.3, 40);
    for (let dy = 0; dy <= l.r; dy++) for (let dx = 0; dx <= l.r; dx++) put(l.x + dx, l.y + dy, on && dx + dy < l.r + 1 ? hot : dim);
  }
  wisps(W / 2, horizon + (H - horizon) * 0.3, 26 + t, 8);
  for (let y = horizon - 6; y < horizon + Math.round((H - horizon) * 0.4); y++) for (let x = 0; x < W; x++) {   // mist drifting low over the bog
    const m = Math.sin((x + t * 0.6) / 12 + y * 0.4) + Math.sin((x - t * 0.35) / 6 + y * 0.15);
    if (m > 1 && dither(x, y) < 6) blend(x, y, S.mistColour, 0.35);
  }
}

/* --- the Peak: an ice sheet on the summit under the aurora, crystal spires rising either side --- */

const AURORA = () => ['#58f0a8', '#40c8c8', '#a070f0'].map(abgr);

function auroraSky() {
  skyGrade('#060a24', '#2a3a6a', 0.75);
  const [green, teal, violet] = AURORA();
  for (let x = 0; x < W; x++) for (let c = 0; c < 2; c++) {
    const crest = Math.round(horizon * (0.12 + c * 0.16) + Math.sin(x / (11 + c * 5) + c) * horizon * 0.06 + Math.sin(x / 4.3) * 1.5);
    const len = Math.round(horizon * (0.25 - c * 0.06));
    for (let y = crest; y < crest + len; y++) {
      const u = (y - crest) / len;
      if (y >= 0 && sky[y * W + x] && dither(x, y) < (1 - u) * 14) blend(x, y, u < 0.3 ? (c ? violet : green) : teal, 0.55 * (1 - u));
    }
  }
  for (let n = 0; n < Math.round(W / 5); n++) { const x = Math.floor(rand() * W), y = Math.floor(rand() * horizon * 0.6); if (sky[y * W + x]) put(x, y, abgr('#ffffff')); }
}

function iceSheet() {
  safariFloor0();
  const G = arenaGround(), ice = ['#f0fcff', '#c8ecfa', '#a0d4f0', '#78b4e0'].map(abgr), [snow, snowShade, snowDeep] = S.snow;
  fillDisc(G, 1.05, (x, y, { d, a }) => (d > 0.9 ? (a > 0 ? (dither(x, y) < 10 ? snow : snowShade) : dither(x, y) < 5 ? snow : snowShade) : null),
    G.R * 0.025, (x, y, t) => (t < 0.5 ? snowShade : snowDeep));   // a drift of snow round it
  const P = G.R * 0.22;
  fillDisc(G, 0.96, (x, y, { d, X, Z, unit }) => {
    // the sky's light lying across the ice in long parallel streaks (on the ground, so they converge into the distance)
    const streak = frac((X * 0.7 + (Z - G.Zc)) / P) < unit * 1.6 / P && d < 0.85;
    if (streak) return ice[0];
    return d < 0.4 ? (dither(x, y) < 6 ? ice[0] : ice[1]) : d < 0.75 ? (dither(x, y) < 6 ? ice[1] : ice[2]) : dither(x, y) < 8 ? ice[2] : ice[3];
  }, G.R * 0.02, (x, y, t) => (t < 0.5 ? ice[2] : ice[3]));
  for (let n = 0; n < 7; n++) {   // cracks wandering across it, walked in ground units
    const a0 = rand() * Math.PI * 2, r0 = Math.sqrt(rand()) * 0.7;
    let X = Math.cos(a0) * r0 * G.R, Z = G.Zc + Math.sin(a0) * r0 * G.R, dir = rand() * Math.PI * 2;
    for (let k = 0, len = 20 + Math.floor(rand() * 30); k < len && Math.hypot(X, Z - G.Zc) < G.R * 0.9; k++) {
      dir += (rand() - 0.5) * 0.9; X += Math.cos(dir) * G.R * 0.012; Z += Math.sin(dir) * G.R * 0.012;
      const p = G.toScreen(X, Z);
      if (p.y > horizon + 1) { put(p.x, p.y, ice[3]); put(p.x, p.y - 1, ice[0]); }
    }
  }
  life.glints = Array.from({ length: Math.round(W / 6) }, () => { const p = G.at(rand() * Math.PI * 2, Math.sqrt(rand()) * 0.9); return { x: Math.round(p.x), y: Math.max(horizon + 2, Math.round(p.y)), phase: rand() * 40 }; });
  life.glintColour = abgr('#ffffff');
  for (let k = 0; k < 9; k++) {   // shards of ice rising round the far side of the sheet
    const p = G.at(0.2 + k / 8 * (Math.PI - 0.4), 1.12);
    if (p.y > horizon + 1 && Math.abs(p.x - W / 2) > W * 0.06) crystalSpire(Math.round(p.x), Math.round(p.y), Math.max(3, Math.round(G.R * 0.22 * p.s)), (p.x - W / 2) / W * 0.6);
  }
}

/** A cluster of ice crystals, `h` tall: long hexagonal shards, a lit face and a shaded one each. */
function crystalSpire(cx, foot, h, lean) {
  const faces = ['#ffffff', '#d0f0ff', '#90c8f0', '#5a8ac8', '#2a4a80'].map(abgr);
  for (const [dx, k, tilt] of [[0, 1, 0], [-0.35, 0.65, -0.35], [0.38, 0.55, 0.4], [-0.6, 0.35, -0.6], [0.65, 0.3, 0.7]]) {
    const hh = Math.round(h * k), w = Math.max(1, Math.round(h * 0.09 * (0.6 + k * 0.4))), bx = cx + Math.round(dx * h * 0.35);
    for (let y = 0; y < hh; y++) {
      const off = Math.round((tilt + lean) * y * 0.3), tip = y > hh - w * 2 ? hh - y : w * 2, half = Math.min(w, Math.ceil(tip / 2));
      for (let x = -half; x <= half; x++) solid(bx + off + x, foot - y, x === -half || x === half ? faces[4] : x < 0 ? (y % 9 === 0 ? faces[0] : faces[1]) : x === 0 ? faces[0] : faces[2 + (dither(x, y) < 4)]);
    }
  }
}

function iceSpires() {
  crystalSpire(Math.round(W * 0.07), horizon + Math.round((H - horizon) * 0.45), Math.round(horizon * 1.1), -0.2);
  crystalSpire(Math.round(W * 0.93), horizon + Math.round((H - horizon) * 0.4), Math.round(horizon * 0.95), 0.2);
  for (const s of [-1, 1]) crystalSpire(s < 0 ? Math.round(W * 0.02) : Math.round(W * 0.98), H + 2, Math.round((H - horizon) * 0.7), s * 0.3);
}

function peakArenaLife(t) {
  const [green, teal] = AURORA();
  for (let x = 0; x < W; x++) {   // the aurora rippling
    const y0 = Math.round(horizon * 0.12 + Math.sin(x / 11) * horizon * 0.06), wave = Math.sin(x / 6 - t * 0.35);
    if (wave > 0.6) for (let y = y0; y < y0 + Math.round(horizon * 0.15); y++) if (y >= 0 && sky[y * W + x] && dither(x, y + t) < 5) blend(x, y, wave > 0.85 ? green : teal, 0.4);
  }
}

/* --- the Desert: a sandstone dais in ancient ruins, a pyramid and a swollen red sun behind, columns either side --- */

function duskRuins() {
  skyGrade('#3a1430', '#f88848', 0.6);
  const sx = Math.round(W * 0.38), sy = horizon - Math.round(horizon * 0.25), r = Math.round(Math.min(W, horizon) * 0.2);
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {   // a swollen red sun, banded by the haze
    const d = Math.hypot(x, y) / r;
    if (d <= 1 && sky[(sy + y) * W + sx + x] && !(y > 0 && (y % 4 === 0 || (y % 4 === 1 && y > r * 0.5)))) put(sx + x, sy + y, d < 0.7 ? abgr('#f8c070') : abgr('#f07040'));
  }
  // a pyramid far off, its sunlit face and its shadowed one, steps picked out
  const px0 = Math.round(W * 0.7), ph = Math.round(horizon * 0.42), [lit, body, strata, shade] = S.mesas;
  for (let y = 0; y < ph; y++) for (let x = -y; x <= y; x++) {
    const yy = horizon - 2 - ph + y;
    solid(px0 + x, yy, (yy % 3 === 0) ? strata : x < 0 ? (dither(x, y) < 3 ? lit : body) : shade);
  }
}

function sandDais() {
  safariFloor0();
  const G = arenaGround(), stone = ['#f8e0b0', '#e0c088', '#c09c64', '#7a5a34'].map(abgr), glyph = abgr('#8a4a28'), drift = G.R * 0.12;
  // two steps up, each with its face under the near rim; the top laid in rings of blocks round the middle (rings and
  // joints on the ground, so they flatten and shrink into the distance), a band of carved glyphs, sand drifted over it
  fillDisc(G, 1.06, (x, y, { d }) => (d > 0.92 ? stone[1] : null), G.R * 0.03, (x, y, t) => (t < 0.4 ? stone[2] : stone[3]));
  const ringW = 0.13;
  fillDisc(G, 0.97, (x, y, { d, a, X, Z, unit }) => {
    const r = d * 0.97 * G.R, ring = Math.floor(d / ringW), n = 6 + ring * 6;
    if (frac(d / ringW) < unit / (ringW * 0.97 * G.R)) return stone[2];
    if (frac(a / (Math.PI * 2) * n + ring * 0.5) < unit * 1.1 / (r * Math.PI * 2 / n + 1e-6)) return stone[2];
    if (d > 0.62 && d < 0.75) {   // the glyph band: marks carved in each block
      const cell = Math.floor(frac(a / (Math.PI * 2)) * 32), u = frac(frac(a / (Math.PI * 2)) * 32), v = (d - 0.62) / 0.13;
      const gx = Math.floor(u * 4), gy = Math.floor(v * 4);
      if (gx > 0 && gx < 3 && gy > 0 && gy < 3 && noise(cell, gx * 4 + gy, 5) < 0.55) return glyph;
    }
    if (noise(Math.floor(X / drift), Math.floor(Z / drift), 6) < 0.1 && dither(x, y) < 10) return S.ground[1];
    return dither(x, y) < 4 ? stone[0] : stone[1];
  }, G.R * 0.03, (x, y, t) => (t < 0.4 ? stone[1] : stone[2]));
}

/** A sandstone column: fluted, a capital on top, or broken off short. */
function column(cx, foot, h, half, broken) {
  const stone = ['#f8e0b0', '#e0c088', '#b08858', '#6a4a2a'].map(abgr), top = foot - h;
  for (let y = top; y <= foot; y++) for (let x = -half; x <= half; x++) {
    const jag = broken && y < top + 3 && noise(x, 0, 9) * 3 > y - top;
    if (jag) continue;
    solid(cx + x, y, Math.abs(x) === half ? stone[3] : (x + half) % 3 === 0 ? stone[2] : x < 0 ? stone[0] : stone[1]);
  }
  if (!broken) for (let y = top - Math.max(2, Math.round(half * 0.7)); y < top; y++) for (let x = -half - 2; x <= half + 2; x++) solid(cx + x, y, Math.abs(x) === half + 2 || y === top - 1 ? stone[3] : stone[0]);
  for (let x = -half - 1; x <= half + 1; x++) { solid(cx + x, foot, stone[3]); solid(cx + x, foot - 1, stone[2]); }
}

function ruinColumns() {
  desertFront();   // the oasis's palms stay
  const side = landmarkSide(), far = -side;
  for (const [at, k, broken] of [[0.04, 1, false], [0.15, 0.7, true], [0.27, 0.35, false]]) {
    const x = far < 0 ? Math.round(W * at) : Math.round(W * (1 - at)), foot = horizon + Math.round((H - horizon) * (0.55 - k * 0.45));
    column(x, foot, Math.round((foot - horizon) * 0.4 + horizon * 0.9 * k), Math.max(2, Math.round(W * 0.03 * (0.4 + k))), broken);
  }
  const x = side < 0 ? Math.round(W * 0.3) : Math.round(W * 0.7);   // a toppled drum half sunk in the sand on the oasis side
  for (let y = -3; y <= 3; y++) for (let dx = -8; dx <= 8; dx++) if (Math.abs(y) + Math.abs(dx) * 0.2 < 4) solid(x + dx, horizon + 6 + y, y < 0 ? abgr('#f8e0b0') : abgr('#b08858'));
}

function desertArenaLife(t) {
  sandStreaks(t, 26, 0.7);
  heatShimmer(t, 0.6);
}

/** The area's own floor, painted as usual under an arena laid over it. */
function safariFloor0() { areaPaint().floor(); }
/* ============================================================
   THE CRYSTAL DEPTHS (v1.0 part B2): one painter for its four places, each deeper and stranger than the last.
     Cave Mouth     the way in: a crack of daylight in the roof with moss and roots round it, glowing mushrooms, the
                    first small crystals, a tunnel of rock arches yawning on into the dark
     Crystal Halls  a geode cathedral: giant crystal columns to the roof, hex crystals jutting from the walls, prism
                    light falling in rainbow shafts, a still lake mirroring it all
     Deep Core      the rock turns black and the energy shows: crimson veins pulsing through the walls and the floor's
                    seams, the crystals gone red, boulders floating on the energy, a red glow ahead
     Energy Well    the source: a bottomless well whose column of energy climbs to a vortex on the roof, crystal
                    monoliths orbiting it, every seam in the floor pulsing towards it
   Big things keep to the back and the edges, the middle is the two Pokémon's, like every other biome.
   ============================================================ */

const mixC = (a, b, k) => { const f = (s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k); return ((255 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0; };
const deepVoid = () => S.voids[stage()];
const deepRock = () => S.rocks[stage()];
const deepGlow = () => (stage() >= 2 ? S.energy : S.crystal);   // the light the place is lit by
const deepGems = () => [[S.crystal, S.crystal], [S.crystal, S.amethyst], [S.ruby, S.amethyst], [S.ruby, S.energy]][stage()];
const wellAt = () => ({ x: Math.round(W / 2), y: horizon + 1 + Math.max(1, Math.round((H - horizon) * 0.02)) });

/** A crystal: a six-sided prism from its foot (fx, fy) out along angle `a` (0 right, -π/2 up), `len` long and `hw` half
    wide, coming to a point; its lit face up-left with a white streak down it, outlined in its deepest colour. `halo`
    pixels of glow spill round it on whatever is behind; `fade` mixes it `fade` of the way `into` the haze (far off).
    `paint` is solid() by default (putSky() keeps it behind the walls). Returns its tip. */
function prism(fx, fy, a, len, hw, pal, { halo = 0, fade = 0, into = 0, paint = solid } = {}) {
  const dx = Math.cos(a), dy = Math.sin(a);
  let ax = -dy, ay = dx;
  if (ax + ay < 0) { ax = -ax; ay = -ay; }   // across, towards the shaded down-right side
  const c = fade ? pal.map(k => mixC(k, into, fade)) : pal;
  const point = Math.max(1.4, hw * 1.7), reach = len + hw + halo + 2;
  for (let y = Math.floor(fy - reach); y <= fy + reach; y++) for (let x = Math.floor(fx - reach); x <= fx + reach; x++) {
    if (!inside(x, y)) continue;
    const rx = x + 0.5 - fx, ry = y + 0.5 - fy, u = rx * dx + ry * dy, v = rx * ax + ry * ay;
    if (u < -0.5 || u > len + halo) continue;
    const w = u > len - point ? hw * Math.max(0, (len - u) / point) : hw, av = Math.abs(v);
    if (av > w || u > len) {
      if (halo && u > -0.5 && av - w < halo && dither(x, y) < 10) blend(x, y, c[3], 0.3 * (1 - (av - w) / halo));
      continue;
    }
    const s = v / Math.max(0.5, w), tip = u > len - point;
    let col;
    if (av > w - 0.7 && w > 1) col = c[4];
    else if (tip) col = s < -0.2 ? c[0] : s < 0.3 ? c[1] : c[2];
    else if (s > -0.7 && s < -0.42) col = c[0];
    else col = s < -0.42 ? c[1] : s < 0.25 ? c[2] : c[3];
    paint(x, y, col);
  }
  return { x: Math.round(fx + dx * len), y: Math.round(fy + dy * len) };
}

/** A few crystals fanning out of one spot, the tallest in the middle; every tip twinkles (drawDepths). */
function gemCluster(fx, fy, size, pal, { up = -Math.PI / 2, spread = 0.55, n = 3, halo = 2, pal2 = null, paint = solid } = {}) {
  const parts = [[2, 0.36, 0.55], [-2, 0.4, 0.6], [1, 0.58, 0.78], [-1, 0.66, 0.82], [0, 1, 1]].slice(5 - Math.min(5, n));
  for (const [k, l, w] of parts) {
    const a = up + k * spread * 0.5 + (noise(fx, fy + k, 40) - 0.5) * 0.18;
    const ox = Math.cos(up + Math.PI / 2) * k * size * 0.16, oy = Math.sin(up + Math.PI / 2) * k * size * 0.16;
    const tip = prism(fx + ox, fy + oy + Math.abs(k) * 0.4, a, size * l, Math.max(0.9, size * 0.13 * w), pal2 && k % 2 ? pal2 : pal, { halo, paint });
    (life.twinkles ||= []).push({ x: tip.x, y: tip.y, phase: noise(tip.x, tip.y, 41) * 80 });
  }
}

/* ---------- the cavern's back: the far dark, the place's own set piece, then the arch of rock round it ---------- */

const ARCH = [{ top: 0.1, p: 2.2, side: 1.08 }, { top: 0.04, p: 3.6, side: 0.97 }, { top: 0.07, p: 2.6, side: 1.05 }, { top: 0.03, p: 4.4, side: 0.92 }];

/** For each column, the row the rock comes down to: the roof in the middle, the walls at the edges. */
function caveRoof() {
  const { top, p, side } = ARCH[stage()], roof = new Int16Array(W), cx = W / 2;
  for (let x = 0; x < W; x++) {
    const u = Math.abs(x + 0.5 - cx) / cx;
    const jag = (noise(x >> 1, 3, 31) - 0.5) * 3 + Math.sin(x * 0.7) * 0.8 + (noise(x >> 3, 5, 32) - 0.5) * horizon * 0.09;
    roof[x] = Math.round(horizon * (top + (1 - top) * Math.min(1.25, Math.pow(u, p) * side)) + jag);
  }
  return roof;
}

function depthsBackdrop() {
  const st = stage(), cx = W / 2, glow = deepGlow();
  life.twinkles = []; life.seams = []; life.veins = []; life.shrooms = []; life.lamps = []; life.glimmers = []; life.tips = [];
  bands(0, horizon, deepVoid(), 1, true);

  // the far end of the cavern glows: faint cyan at the mouth, brighter in the halls, crimson from the Deep Core on
  const gk = [0.16 + dial() * 0.5, 0.32, 0.5, 0.7][st];
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x + 0.5 - cx) / (W * 0.6), (y - horizon) / (horizon * 0.95));
    if (d < 1 && dither(x, y) < 15) blend(x, y, glow[3], gk * (1 - d) * (1 - d));
  }
  // crystals glimmering far off in the dark, like stars
  for (let n = 0, count = Math.round(W * horizon / [90, 40, 70, 80][st]); n < count; n++) {
    const x = Math.floor(rand() * W), y = Math.floor(rand() * horizon * 0.92), c = rand() < 0.5 ? glow[3] : deepGems()[1][3];
    put(x, y, c);
    if (rand() < 0.25) life.glimmers.push({ x, y, phase: rand() * 60, c: rand() < 0.5 ? glow[1] : deepGems()[1][1] });
  }
  if (st === 0) caveTunnel();
  if (st === 1) crystalHall();
  if (st === 2) deepCore();
  if (st === 3) wellCavern();
  farRidges();
  const roof = life.roof = caveRoof();
  caveWalls(roof);
  wallCrystals(roof);
  stalactites(roof);
  if (st === 0) daylightCrack(roof);
}

/** Rock ridges and crystal spires along the back, faded into the dark. */
function farRidges() {
  const st = stage(), R = deepRock(), v = deepVoid(), haze = v[v.length - 1], rim = deepGlow()[st >= 2 ? 2 : 3];
  const range = (top, amp, seed, k) => {
    for (let x = 0; x < W; x++) {
      const jag = Math.abs(((x / (5 + seed) + seed) % 2) - 1), y0 = Math.round(top - amp * (0.35 + 0.4 * jag + 0.25 * Math.sin(x / 13 + seed)) * (0.7 + 0.3 * noise(x >> 1, seed, 36)));
      for (let y = Math.max(0, y0); y < horizon; y++) solid(x, y, y === y0 && dither(x, y) < 10 ? mixC(rim, haze, 0.55 + k * 0.3) : mixC(R[3], haze, k));
    }
  };
  if (st === 0) return;   // the Cave Mouth's tunnel is its back
  const low = st === 3 ? 0.5 : 1;
  range(horizon - horizon * 0.13 * low, horizon * 0.11 * low, 1.3 + st, 0.6);
  const [a, b] = deepGems();
  for (let n = 0; n < Math.round(W / 22); n++) {
    const x = Math.round(rand() * W);
    if (st === 3 && Math.abs(x - cx0()) < W * 0.14) continue;   // clear of the column
    prism(x, horizon - Math.round(horizon * 0.05), -Math.PI / 2 + (rand() - 0.5) * 0.4, horizon * (0.1 + rand() * 0.2) * low, 1.5 + rand() * 1.5, n % 2 ? a : b, { fade: 0.45, into: haze, halo: 2 });
  }
  range(horizon - horizon * 0.05 * low, horizon * 0.06 * low, 4.1 + st, 0.32);
}
const cx0 = () => Math.round(W / 2);

/* ----- the Cave Mouth ----- */

/** Arches of rock, smaller and darker into the distance: the tunnel goes on down, the last opening on a faint glow. */
function caveTunnel() {
  const R = deepRock(), v = deepVoid(), cx = Math.round(W * 0.53), deeper = Math.min(1, dial() * 3.5);
  const rings = [0.58, 0.42, 0.29, 0.19, 0.11];
  rings.forEach((s, i) => {
    const hw = W * 0.5 * s, ht = horizon * 1.05 * s * (1.1 + 0.15 * i), k = Math.min(0.9, 0.45 + i * 0.12);
    const body = mixC(R[3], v[2], k), lit = mixC(mixC(R[1], S.crystal[3], 0.3 + i * 0.1), v[3], i * 0.12), last = i === rings.length - 1;
    for (let y = Math.floor(horizon - ht - 2); y < horizon; y++) for (let x = Math.floor(cx - hw - 3); x <= cx + hw + 3; x++) {
      const jag = (noise(x >> 1, y >> 1, 42 + i) - 0.5) * 0.2 + (noise(x >> 2, 9, 43 + i) - 0.5) * 0.15;
      const d = Math.hypot((x + 0.5 - cx) / hw, (y + 0.5 - horizon) / ht) + jag;
      if (d > 1) continue;
      if (last) { put(x, y, d < 0.5 ? S.crystal[3] : dither(x, y) < (1 - d) * 24 ? S.crystal[4] : body); continue; }
      put(x, y, d > 0.93 ? lit : d > 0.86 && dither(x, y) < 6 ? mixC(lit, body, 0.5) : noise(x >> 1, y, 44) < 0.12 ? mixC(body, v[0], 0.5) : body);
    }
  });
  // the glow through the last arch: the crystals the tunnel leads to, brighter as you go in
  const last = rings[rings.length - 1], hw = W * 0.5 * last, ht = horizon * 1.05 * last * 1.7;
  for (let n = 0; n < 6 + deeper * 6; n++) {
    const x = Math.round(cx + (rand() - 0.5) * hw * 1.4), foot = horizon - 1;
    prism(x, foot, -Math.PI / 2 + (rand() - 0.5) * 0.6, ht * (0.25 + rand() * 0.4), 0.8, S.crystal, { fade: 0.35 });
  }
}

/** A crack in the roof letting a shaft of daylight in (fading the further in you go), moss and roots round its rim. */
function daylightCrack(roof) {
  const hx = Math.round(W * 0.3), top = 0, bottom = Math.max(4, roof[hx] - 1), hw = Math.max(2, Math.round(W * 0.025));
  life.crack = { x: hx, y: bottom, hw };
  for (let y = top; y <= bottom + 1; y++) {
    const w = hw * (0.6 + 0.4 * Math.sin(y / bottom * Math.PI)) + (noise(y, 1, 43) - 0.5) * 1.5, mid = hx + Math.sin(y / 3) * 1.2;
    for (let x = Math.floor(mid - w - 1); x <= mid + w + 1; x++) {
      const e = Math.abs(x + 0.5 - mid) - w;
      if (e < 0) { put(x, y, y < bottom * 0.5 ? S.daylight[0] : S.daylight[1]); sky[y * W + x] = 1; }
      else if (e < 1.2) solid(x, y, S.moss[e < 0.6 ? 0 : 2]);
    }
  }
  for (let x = hx - hw - 3; x <= hx + hw + 3; x++) {   // moss and roots hanging from its lip
    if (noise(x, 2, 44) < 0.3) continue;
    const len = 1 + Math.floor(noise(x, 3, 44) * (horizon * 0.12));
    for (let k = 0; k < len; k++) solid(x, bottom + 1 + k, k === len - 1 ? S.moss[0] : noise(x, k, 45) < 0.3 ? S.wood[2] : S.moss[1 + (k & 1)]);
  }
}

/** The daylight's shaft, from the crack to the floor, with a patch of moss and ferns where it lands. */
function daylightShaft() {
  const c = life.crack;
  if (!c) return;
  const k = Math.max(0.14, 1 - dial() * 2.6), lx = Math.round(c.x + W * 0.09), ly = groundAt(0.24);
  life.shaft = { x0: c.x, y0: c.y, x1: lx, y1: ly, k };
  for (let y = c.y; y <= ly; y++) {
    const f = (y - c.y) / Math.max(1, ly - c.y), mid = c.x + (lx - c.x) * f, hw = c.hw + f * W * 0.06;
    for (let x = Math.floor(mid - hw - 3); x <= mid + hw + 3; x++) {
      const e = Math.abs(x + 0.5 - mid) - hw;
      if (e < -1) blend(x, y, S.daylight[0], 0.34 * k);
      else if (dither(x, y) < (3 - e) * 3) blend(x, y, S.daylight[1], 0.18 * k);
    }
  }
  const rx = Math.round(W * 0.09), ry = Math.max(2, Math.round((H - horizon) * 0.05));
  for (let y = ly - ry; y <= ly + ry; y++) for (let x = lx - rx; x <= lx + rx; x++) {
    const d = Math.hypot((x - lx) / rx, (y - ly) / ry);
    if (d < 1) {
      if (noise(x, y, 46) < 0.55 * (1 - d) + 0.15) put(x, y, S.moss[(x + y) % 3 === 0 ? 0 : d < 0.5 ? 1 : 2]);
      if (d < 0.8) blend(x, y, S.daylight[0], 0.18 * k);
    }
  }
  for (let n = 0; n < 4; n++) {   // ferns in the light
    const fx = Math.round(lx + (noise(n, 1, 47) - 0.5) * rx * 1.6), fy = Math.round(ly + (noise(n, 2, 47) - 0.5) * ry);
    for (let k2 = 0; k2 < 4; k2++) { solid(fx - k2, fy - k2, S.moss[1]); solid(fx + k2, fy - k2, S.moss[0]); if (k2 > 1) solid(fx, fy - k2, S.moss[2]); }
  }
}

/* ----- the Crystal Halls ----- */

/** Giant crystal columns from the floor to the roof far off, and the lake's far shore under them. */
function crystalHall() {
  const v = deepVoid(), haze = v[v.length - 1];
  const cols = W > 160 ? [0.17, 0.34, 0.68, 0.86] : [0.2, 0.78];
  cols.forEach((at, i) => {
    const x = Math.round(W * at), hw = Math.max(2, Math.round(W * (0.02 + noise(i, 1, 38) * 0.012)));
    prism(x, horizon + 1, -Math.PI / 2 + (noise(i, 2, 38) - 0.5) * 0.1, horizon * 1.15, hw, i % 2 ? S.amethyst : S.crystal, { fade: 0.42, into: haze, halo: 3 });
  });
  // a far cluster of spires in the middle distance, half hidden
  for (let n = 0; n < Math.round(W / 10); n++) {
    const x = Math.round(W * (0.3 + rand() * 0.4));
    prism(x, horizon, -Math.PI / 2 + (rand() - 0.5) * 0.5, horizon * (0.15 + rand() * 0.25), 1 + rand(), n % 2 ? S.amethyst : S.crystal, { fade: 0.62, into: haze });
  }
}

/** Shafts of light falling through the halls, split into a rainbow at their edges; motes sparkle in them (drawDepths). */
function prismBeams() {
  const rainbow = ['#ff6a8a', '#ffc860', '#f8f888', '#78f0a0', '#68c8ff', '#b088ff'].map(abgr), roof = life.roof;
  const beams = W > 160 ? [[0.36, 0.16], [0.62, -0.12], [0.8, -0.2]] : [[0.4, 0.14], [0.64, -0.16]];
  life.beams = [];
  for (const [at, lean] of beams) {
    const x0 = Math.round(W * at), y0 = Math.max(0, roof[x0] - 1), y1 = groundAt(0.18 + Math.abs(lean));
    const hw0 = Math.max(1, W * 0.012), hw1 = Math.max(3, W * 0.04);
    life.beams.push({ x0, y0, y1, lean, hw0, hw1 });
    for (let y = y0; y <= y1; y++) {
      const f = (y - y0) / Math.max(1, y1 - y0), mid = x0 + lean * (y - y0), hw = hw0 + (hw1 - hw0) * f;
      for (let x = Math.floor(mid - hw - 4); x <= mid + hw + 4; x++) {
        const e = x + 0.5 - mid;
        if (Math.abs(e) <= hw) blend(x, y, S.crystal[1], 0.16 + 0.06 * (1 - f));
        else if (Math.abs(e) <= hw + 3 && dither(x, y) < 11) blend(x, y, rainbow[Math.min(5, Math.floor((e + hw + 3) / ((hw + 3) * 2) * 6))], 0.2 * (1 - f * 0.5));
      }
    }
  }
}

/* ----- the Deep Core ----- */

/** A red haze lying along the back, and a glowing fissure splitting the far dark. */
function deepCore() {
  const e = S.energy, cx = Math.round(W * (0.4 + noise(S.raw.seed & 255, 1, 48) * 0.2));
  for (let y = Math.round(horizon * 0.55); y < horizon; y++) for (let x = 0; x < W; x++) {
    const k = (y - horizon * 0.55) / (horizon * 0.45);
    if (dither(x, y + (x >> 3)) < k * 9) blend(x, y, e[3], 0.32 * k);
  }
  let x = cx;
  for (let y = Math.round(horizon * 0.12); y < horizon; y++) {   // the fissure, zigzagging down to the floor
    x += noise(y, 2, 48) < 0.5 ? -1 : 1;
    const w = 0.5 + (y / horizon) * 1.5;
    for (let dx = -Math.ceil(w) - 2; dx <= w + 2; dx++) {
      const a = Math.abs(dx);
      if (a <= w) { put(x + dx, y, a < w * 0.4 ? e[0] : e[1]); life.seams.push([x + dx, y, y / 3]); }
      else if (dither(x + dx, y) < 8) blend(x + dx, y, e[2], 0.5 - (a - w) * 0.15);
    }
  }
}

/** A boulder adrift on the energy: rock tapering to a point below, a crystal or two on top, its underside glowing.
    Painted into a sprite once ([dx, dy, colour] from its top centre) and drawn every frame, bobbing. */
function floaterSprite(r, gems) {
  const R = deepRock(), e = S.energy, out = [];
  const h = Math.round(r * 1.7);
  for (let dy = 0; dy <= h; dy++) {
    const half = dy < r * 0.5 ? r * (0.75 + dy / r * 0.5) : r * Math.max(0, 1 - (dy - r * 0.5) / (h - r * 0.5)) * 1.0;
    for (let dx = -Math.ceil(half); dx <= half; dx++) {
      const edge = Math.abs(dx) > half - 1 || dy === 0;
      const c = dy > h - 2 ? e[1] : dy > h * 0.7 && dither(dx, dy) < 9 ? e[3] : edge ? R[4] : dy < 2 ? R[0] : dx < -half * 0.3 ? R[1] : dx > half * 0.4 ? R[3] : R[2];
      out.push([dx, dy, c]);
    }
  }
  if (gems) {
    const [a] = deepGems();
    for (const [ox, len] of [[-r * 0.3, r * 0.9], [r * 0.25, r * 0.6]]) for (let k = 0; k < len; k++) {
      const w = k > len - 2 ? 0 : 1;
      for (let dx = -w; dx <= w; dx++) out.push([Math.round(ox) + dx, -1 - k, dx < 0 ? a[1] : dx > 0 ? a[3] : a[2]]);
      if (k === Math.floor(len) - 1) out.push([Math.round(ox), -1 - k, a[0]]);
    }
  }
  out.bottom = h;
  return out;
}

/* ----- the Energy Well ----- */

/** The vast last cavern: the Well's emblem glowing faint on the far wall behind where the column rises, ledges
    stepping down into the dark round it. */
function wellCavern() {
  const e = S.energy, cx = cx0(), cy = Math.round(horizon * 0.5), haze = deepVoid()[6];
  for (const [r, k] of [[0.42, 0.22], [0.3, 0.3], [0.2, 0.38]]) {   // nested pentagons, Eternatus's mark
    const R = Math.min(W, horizon * 1.6) * r;
    for (let a = 0; a < Math.PI * 2; a += 0.6 / R) {
      const seg = Math.PI * 2 / 5, s = Math.floor((a + Math.PI / 2) / seg), a0 = s * seg - Math.PI / 2, a1 = a0 + seg;
      const f = (a + Math.PI / 2 - s * seg) / seg;
      const x = cx + R * (Math.cos(a0) * (1 - f) + Math.cos(a1) * f), y = cy + R * 0.8 * (Math.sin(a0) * (1 - f) + Math.sin(a1) * f);
      if (sky[(y | 0) * W + (x | 0)]) { blend(x, y, e[2], k); if (dither(x | 0, y | 0) < 6) blend(x, y + 1, e[3], k * 0.6); }
    }
  }
  for (let y = Math.round(horizon * 0.7); y < horizon; y++) for (let x = 0; x < W; x++) {   // the light welling up from the pit
    const k = (y - horizon * 0.7) / (horizon * 0.3), d = Math.abs(x - cx) / (W * 0.5);
    if (d < 1 && dither(x, y) < 14) blend(x, y, e[2], 0.35 * k * (1 - d));
  }
  void haze;
}

/* ----- the walls and roof ----- */

/** The arch of rock round the far dark, broken into lit facets (like the treasure grotto's), its rim lit by the glow;
    from the Deep Core on, energy veins run through its cracks and pulse (drawDepths). */
function caveWalls(roof) {
  const st = stage(), R = deepRock(), G = 7, GY = 5, veined = st >= 2, rim = mixC(R[0], deepGlow()[2], 0.4);
  const feature = (i, j) => [(i + noise(i, j, 33)) * G, (j + noise(i, j, 34)) * GY];
  for (let y = 0; y < horizon; y++) for (let x0 = 0; x0 < W; x0++) {
    const inner = roof[x0] - y;
    if (inner <= 0) continue;
    const x = x0 + Math.sin(y * 0.45) * 1.6, yy = y + Math.sin(x0 * 0.37) * 1.6;
    const i0 = Math.floor(x / G), j0 = Math.floor(yy / GY);
    let d1 = 1e9, d2 = 1e9, f = null;
    for (let j = j0 - 1; j <= j0 + 1; j++) for (let i = i0 - 1; i <= i0 + 1; i++) {
      const p = feature(i, j), d = Math.hypot(x - p[0], yy - p[1]);
      if (d < d1) { d2 = d1; d1 = d; f = p; } else if (d < d2) d2 = d;
    }
    if (inner <= 1) { solid(x0, y, rim); continue; }
    if (inner === 2 && dither(x0, y) < 8) { solid(x0, y, mixC(rim, R[2], 0.5)); continue; }
    const deep = inner / (horizon * 0.16);
    if (d2 - d1 < 1.1) { solid(x0, y, R[4]); continue; }
    const lit = ((f[0] - x) / G + (f[1] - yy) / GY) * 0.8 + (dither(x0, y) / 16 - 0.5) * 0.35;
    const shade = (lit > 0.35 ? 0 : lit > 0 ? 1 : lit > -0.35 ? 2 : 3) + Math.floor(Math.min(3, deep) + dither(x0 + 1, y) / 16);
    solid(x0, y, shade > 4 && dither(x0, y) < 10 ? R[4] : R[Math.min(3, shade)]);
  }
  if (veined) wallVeins(roof);
}

/** From the Deep Core on, energy has split the walls: veins creeping up out of the floor and in from the rim, forking
    as they go, glowing on the rock round them; a pulse runs along each, out from where the energy leaks in (drawDepths). */
function wallVeins(roof) {
  const e = S.energy, mask = new Uint8Array(W * H), count = Math.round(W / (stage() === 3 ? 6 : 9));
  const rock = (x, y) => inside(x, y) && y < horizon && roof[x] - y > 1;
  const grow = (x, y, a, len, d) => {
    for (let k = 0; k < len; k++) {
      a += (rand() - 0.5) * 0.8;
      const dx = Math.cos(a), dy = Math.sin(a), m = Math.max(Math.abs(dx), Math.abs(dy));
      x += dx / m; y += dy / m;
      const ix = Math.round(x), iy = Math.round(y);
      if (!rock(ix, iy)) return;
      if (!mask[iy * W + ix]) { mask[iy * W + ix] = 1; life.veins.push([ix, iy, (d + k) / 3]); }
      if (rand() < 0.06 && len > 6) grow(x, y, a + (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 0.6), len * 0.45, d + k);
    }
  };
  for (let n = 0; n < count; n++) {
    const side = n % 2 ? 1 : -1, x = Math.round(side < 0 ? rand() * W * 0.3 : W - 1 - rand() * W * 0.3);
    if (n % 3 === 0) grow(x, horizon - 1, -Math.PI / 2 + (rand() - 0.5) * 0.8, horizon * (0.4 + rand() * 0.5), 0);   // up out of the floor
    else grow(x, roof[x] - 2, side < 0 ? Math.PI + (rand() - 0.5) * 1.6 : (rand() - 0.5) * 1.6, horizon * (0.3 + rand() * 0.4), 0);   // in from the rim
  }
  for (const [x, y] of life.veins) {
    solid(x, y, e[3]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) {
      const i = (y + dy) * W + x + dx;
      if (inside(x + dx, y + dy) && !mask[i] && dither(x + dx, y + dy) < 9) blend(x + dx, y + dy, Math.abs(dx) + Math.abs(dy) > 1 ? e[4] : e[3], 0.45);
    }
  }
}

/** Crystals growing out of the walls, pointing into the cavern: a few small ones at the mouth, big hex prisms in the
    halls, red ones further down. */
function wallCrystals(roof) {
  const st = stage(), [a, b] = deepGems(), count = [3, 7, 5, 4][st] + (W > 160 ? [2, 5, 3, 2][st] : 0), size = [0.12, 0.3, 0.2, 0.22][st];
  for (let n = 0; n < count; n++) {
    const side = n % 2 ? 1 : -1, x = Math.round(side < 0 ? W * (0.03 + rand() * 0.16) : W * (0.81 + rand() * 0.16));
    const y = Math.min(horizon - 3, Math.max(3, roof[x] - 1 - Math.round(rand() * horizon * 0.25)));
    if (roof[x] - y < 1 && y < horizon - 4) continue;
    // aimed from the wall into the cavern, slanting up or down
    const out = side < 0 ? 0 : Math.PI, tilt = (y < horizon * 0.5 ? 0.6 : -0.55) * (side < 0 ? 1 : -1) + (rand() - 0.5) * 0.4;
    const s = horizon * size * (0.6 + rand() * 0.6);
    gemCluster(x, y, s, n % 3 ? a : b, { up: out + tilt, n: st === 1 ? 4 : 3, spread: 0.7, halo: st === 0 ? 1 : 3, pal2: st === 1 ? b : null });
  }
}

/** Stalactites along the roof, rock or crystal, lit from below at their tips; their tips drip (drawDepths). */
function stalactites(roof) {
  const st = stage(), R = deepRock(), [a, b] = deepGems(), tipLit = mixC(R[0], deepGlow()[1], 0.4), scale = Math.max(0.7, horizon / 70);
  for (let x = 3 + Math.floor(rand() * 4); x < W - 3; x += 3 + Math.floor(rand() * 6)) {
    const y0 = roof[x];
    if (y0 >= horizon * 0.8 || (life.crack && Math.abs(x - life.crack.x) < life.crack.hw + 4)) continue;
    const len = Math.round((3 + rand() * 9) * scale * (st === 3 ? 0.7 : 1)), w = 1 + Math.floor(rand() * (len > 8 ? 3 : 2));
    if ((st === 1 || st === 2) && rand() < 0.45) {
      const tip = prism(x, y0 - 2, Math.PI / 2 + (rand() - 0.5) * 0.2, len + 2, w * 0.8, rand() < 0.5 ? a : b, { halo: 2 });
      life.twinkles.push({ x: tip.x, y: tip.y, phase: rand() * 80 });
      continue;
    }
    for (let k = 0; k < len; k++) {
      const half = Math.round((1 - k / len) * w);
      for (let dx = -half; dx <= half; dx++) solid(x + dx, y0 + k, k >= len - 2 ? tipLit : dx < 0 ? R[1] : dx > 0 ? R[3] : R[2]);
    }
    if (rand() < 0.55) life.tips.push({ x, y: y0 + len, floor: horizon + 2 + Math.floor(rand() * (H - horizon) * 0.55), at: Math.floor(rand() * 90) });
  }
}

/* ---------- the cavern's floor ---------- */

/** Smooth value noise (0..1) at (x, y), for broad swells of light and dark. */
function smooth(x, y, seed) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const n = (a, b) => noise(a, b, seed);
  return (n(i, j) * (1 - u) + n(i + 1, j) * u) * (1 - v) + (n(i, j + 1) * (1 - u) + n(i + 1, j + 1) * u) * v;
}

function depthsFloor() {
  const st = stage(), F = S.floors[st], cx = W / 2, hot = st >= 2, span = Math.max(1, H - horizon), glow = deepGlow();
  bands(horizon, H, F, 0.8);
  // the rock underfoot: broad lighter and darker swells laid on the ground in perspective, dithered, fading into the dark
  for (let y = horizon + 1; y < H; y++) {
    const gy = (y - horizon) / span + 0.03, Zg = 8 / gy, fade = Math.min(1, gy * 3);
    for (let x = 0; x < W; x++) {
      const X = (x + 0.5 - cx) / W * 4 / gy;
      const m = smooth(X * 0.5, Zg * 0.5, 70 + st) * 0.65 + smooth(X * 1.6, Zg * 1.6, 72 + st) * 0.35;
      const lift = ((m - 0.5) * 2.4 + (dither(x, y) / 16 - 0.5) * 0.45) * fade;
      if (lift > 0.5) tint(x, y, 1.14, 4); else if (lift > 0.2) tint(x, y, 1.06, 2); else if (lift < -0.45) tint(x, y, 0.8); else if (lift < -0.18) tint(x, y, 0.91);
    }
  }
  if (st === 0) {   // a trodden way into the tunnel, worn smoother and paler than the rock round it
    for (let y = horizon + 1; y < H; y++) {
      const g = (y - horizon) / span, mid = W * 0.53 + (W * 0.5 - W * 0.53) * g + Math.sin(g * 5) * W * 0.03, hw = 1 + g * W * 0.2;
      for (let x = Math.floor(mid - hw - 2); x <= mid + hw + 2; x++) {
        const e2 = Math.abs(x + 0.5 - mid) - hw;
        if (e2 < 0) tint(x, y, 1.1, 5); else if (e2 < 2 && dither(x, y) < 6) tint(x, y, 1.05, 2);
      }
    }
  }
  // the far glow lies on the floor too, at the back
  for (let y = horizon + 1; y < horizon + span * 0.3; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x + 0.5 - cx) / (W * 0.42), (y - horizon) / (span * 0.3));
    if (d < 1 && dither(x, y) < (1 - d) * 26) blend(x, y, glow[3], [0.22, 0.26, 0.3, 0.42][st]);
  }
  for (let x = 0; x < W; x++) { tint(x, horizon, 0.6); tint(x, horizon + 1, 0.8); }   // the walls' shadow at their foot

  // cracks: dark at the mouth and in the halls, running with energy from the Deep Core on; at the Well they all fan out from it
  const well = wellAt(), e = S.energy;
  const crackAt = (x, y) => {
    if (!inside(x, y) || y <= horizon + 1) return;
    if (hot) {
      put(x, y, e[3]); life.seams.push([x, y, Math.hypot(x - well.x, (y - well.y) * 2.5) / 3]);
      for (const dy of [-1, 1]) if (dither(x, y + dy) < 9) blend(x, y + dy, e[3], 0.4);
    } else { put(x, y, F[5]); if (dither(x, y) < 6) put(x, y + 1, mixC(F[0], F[1], 0.5)); }
  };
  const walk = (x, y, a, len, branch, wander = 0.7) => {
    for (let k = 0; k < len; k++) {
      const depth = depthOf(y);
      const dx = Math.cos(a), dy = Math.sin(a) * (0.45 + depth * 0.55), m = Math.max(Math.abs(dx), Math.abs(dy));
      x += dx / m; y += dy / m;
      a += (rand() - 0.5) * wander;
      crackAt(Math.round(x), Math.round(y));
      if (branch && rand() < (wander < 0.5 ? 0.012 : 0.04)) walk(x, y, a + (rand() < 0.5 ? -0.9 : 0.9), Math.min(len * 0.3, 14), false, wander);
      if (y > H) return;
    }
  };
  if (st === 3) {
    const { rx } = { rx: Math.max(14, Math.round(W * 0.2)) };
    for (let n = 0; n < 7; n++) {
      const a = Math.PI * (0.08 + 0.84 * n / 6) + (rand() - 0.5) * 0.15;
      walk(well.x + Math.cos(a) * rx, well.y + Math.sin(a) * 3, a, 400, true, 0.3);
    }
  } else {
    for (let n = 0, count = hot ? 7 : 5; n < count; n++) {
      const right = rand() < 0.5;
      walk(right ? W * (0.55 + rand() * 0.4) : W * rand() * 0.45, horizon + 3 + rand() * span * 0.75, (right ? Math.PI : 0) + (rand() - 0.5) * 1.2, 12 + rand() * 30, true);
    }
  }

  // pebbles and a few crystal shards
  const [a, b] = deepGems();
  for (let n = 0, count = Math.round(W * span / 150); n < count; n++) {
    const x = Math.floor(rand() * W), y = horizon + 3 + Math.floor(rand() * (span - 3)), near = depthOf(y) > 0.45;
    if (rand() < 0.25) {
      const g = rand() < 0.5 ? a : b;
      put(x, y, g[2]); put(x, y - 1, g[1]);
      if (near) { put(x + 1, y, g[3]); put(x, y - 2, g[0]); }
    } else { put(x, y, F[0]); if (near) { put(x + 1, y, F[0]); put(x, y + 1, F[5]); put(x + 1, y + 1, F[5]); } }
  }
  if (st === 0) puddles(3, false);
  if (st === 1) { mirrorLake(); puddles(2, true); }
  if (st === 3) theWell();
}

/** Still puddles that catch the glow, a glint or two on them. */
function puddles(n, gems) {
  const [w0, w1, w2] = S.water;
  for (let i = 0; i < n + (W > 160 ? 2 : 0); i++) {
    const cx = Math.round(W * (i % 2 ? 0.62 + rand() * 0.3 : 0.06 + rand() * 0.3)), cy = groundAt(0.3 + rand() * 0.55);
    const rx = Math.round(4 + depthOf(cy) * W * 0.07), ry = Math.max(2, Math.round(rx * 0.32));
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d > 1) continue;
      put(x, y, d > 0.7 ? (y < cy ? S.water[3] : w2) : y === cy - ry + 1 && dither(x, y) < 8 ? w1 : (x + y * 3) % 9 === 0 ? w0 : mixC(S.water[3], deepVoid()[6], 0.3));
      bare(x, y);
    }
    life.twinkles.push({ x: cx - (rx >> 1), y: cy, phase: rand() * 80 });
    if (gems) prism(cx + (rx >> 1), cy, -Math.PI / 2 + 0.3, ry * 4 + 3, 1, S.amethyst, { halo: 1 });
  }
}

/** The Crystal Halls' lake: a still band across the back of the floor mirroring the hall above it, rippling. */
function mirrorLake() {
  const deep = Math.max(3, Math.round((H - horizon) * 0.075)), [w0, , w2] = S.water;
  life.lake = { top: horizon + 1, deep };
  for (let y = horizon + 1; y <= horizon + deep; y++) for (let x = 0; x < W; x++) {
    const sy = 2 * horizon - y, sx = x + Math.round(Math.sin(y * 1.7) * 0.8);
    const c = inside(sx, sy) ? px[sy * W + sx] : w2;
    put(x, y, mixC(c, w2, 0.35 + (y - horizon) / deep * 0.2));
    bare(x, y);
  }
  for (let x = 0; x < W; x++) if (dither(x, 1) < 7) put(x, horizon + deep + 1, mixC(w0, S.floors[1][1], 0.7));   // the near shore, catching the light
}

/** The Energy Well: a bottomless pit at the back of the floor, lit crimson from far below, crystal ledges round its rim. */
function theWell() {
  const { x: cx, y: cy } = wellAt(), rx = Math.max(14, Math.round(W * 0.2)), ry = Math.max(2, Math.round((H - horizon) * 0.06)), e = S.energy;
  life.well = { x: cx, y: cy, rx, ry };
  for (let y = cy - ry - 2; y <= cy + ry + 2; y++) for (let x = cx - rx - 3; x <= cx + rx + 3; x++) {
    const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
    if (d <= 1) {
      // the far inner wall, lit from below, then the dark, then the glow at the bottom
      const far = y < cy;
      put(x, y, d > 0.86 ? (far ? e[2] : e[4]) : far && d > 0.6 ? (dither(x, y) < 8 ? e[3] : e[4]) : d < 0.4 ? (dither(x, y) < 10 ? e[2] : e[3]) : e[4]);
      bare(x, y);
    } else if (d < 1.35 && y >= cy) { put(x, y, S.rocks[3][d < 1.15 ? 0 : 1]); bare(x, y); }
  }
  for (let n = 0; n < 9; n++) {   // crystal ledges round the rim
    const a = Math.PI * (0.05 + 0.9 * n / 8), x = cx + Math.cos(a) * rx * 1.08, y = cy + Math.sin(a) * ry * 1.15 + 1;
    prism(x, y, -Math.PI / 2 + Math.cos(a) * 0.5, 2 + noise(n, 1, 54) * 4 * (0.5 + Math.sin(a)), 0.9, n % 2 ? S.ruby : S.energy, { halo: 1 });
  }
}

/* ---------- the near corners: what frames each place ---------- */

function depthsFront() {
  const st = stage(), R = deepRock(), [a, b] = deepGems(), near = H - horizon;
  if (st === 0) daylightShaft();
  if (st === 1) prismBeams();
  if (st === 3) energyRing();
  // a stalagmite or boulder in each near corner, crystals or mushrooms growing off it
  const corner = (x0, x1, tall) => {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      const k = Math.abs(x - x0) / Math.abs(x1 - x0), h = Math.round(tall * Math.sqrt(Math.max(0, 1 - k * k)) + Math.sin(x * 1.7) * 0.8);
      for (let y = H - h; y < H; y++) solid(x, y, y === H - h ? R[1] : y < H - h + 2 ? R[2] : R[4]);
    }
  };
  corner(-1, Math.round(W * 0.17), Math.round(near * 0.18));
  corner(W, Math.round(W * 0.85), Math.round(near * 0.14));
  if (st === 0) {
    stalagmite(Math.round(W * 0.05), H - Math.round(near * 0.14), Math.round(near * 0.32));
    stalagmite(Math.round(W * 0.95), H - Math.round(near * 0.1), Math.round(near * 0.22));
    for (const [at, k] of [[0.12, 0.13], [0.09, 0.1], [0.89, 0.1], [0.92, 0.13]]) shroom(Math.round(W * at), H - Math.round(near * k), 2 + Math.round(near / 70));
    gemCluster(Math.round(W * 0.82), H - Math.round(near * 0.12), near * 0.12, S.crystal, { n: 3, halo: 2 });
  }
  if (st === 1) {
    gemCluster(Math.round(W * 0.07), H - Math.round(near * 0.12), near * 0.36, S.crystal, { n: 5, halo: 3, pal2: S.amethyst });
    gemCluster(Math.round(W * 0.93), H - Math.round(near * 0.09), near * 0.28, S.amethyst, { n: 4, halo: 3, pal2: S.crystal });
    for (const [x, c] of [[Math.round(W * 0.08), S.crystal], [Math.round(W * 0.92), S.amethyst]]) {   // their light pooling on the floor
      const cy = H - Math.round(near * 0.12), rx = Math.round(W * 0.14), ry = Math.round(near * 0.12);
      for (let y = cy - ry; y < H; y++) for (let xx = x - rx; xx <= x + rx; xx++) {
        const d = Math.hypot((xx - x) / rx, (y - cy) / ry);
        if (d < 1 && dither(xx, y) < (1 - d) * 22) blend(xx, y, c[2], 0.2);
      }
    }
  }
  if (st === 2) {
    gemCluster(Math.round(W * 0.06), H - Math.round(near * 0.14), near * 0.26, S.ruby, { n: 4, halo: 3, spread: 0.9 });
    gemCluster(Math.round(W * 0.95), H - Math.round(near * 0.1), near * 0.2, S.ruby, { n: 3, halo: 3, pal2: S.amethyst, spread: 0.9 });
    rubble(Math.round(W * 0.2), H - Math.round(near * 0.04), 5);
    rubble(Math.round(W * 0.78), H - Math.round(near * 0.03), 4);
  }
  if (st === 3) {
    brokenPillar(Math.round(W * 0.06), H - Math.round(near * 0.12), Math.round(near * 0.34));
    brokenPillar(Math.round(W * 0.94), H - Math.round(near * 0.08), Math.round(near * 0.24));
    gemCluster(Math.round(W * 0.15), H - Math.round(near * 0.05), near * 0.12, S.energy, { n: 3, halo: 2 });
  }
  void a; void b;
}

/** A pointed column of dripstone rising off the floor, banded, lit up its left side. */
function stalagmite(cx, foot, h) {
  const R = deepRock(), half = Math.max(2, Math.round(h * 0.22));
  for (let k = 0; k < h; k++) {
    const w = Math.max(0, Math.round(half * (1 - k / h) ** 0.8));
    for (let dx = -w - 1; dx <= w + 1; dx++) {
      const edge = Math.abs(dx) > w;
      solid(cx + dx, foot - k, edge ? R[4] : dx < -w * 0.3 ? R[0] : dx > w * 0.4 ? R[3] : (k % 4 === 0 ? R[3] : R[1]));
    }
  }
}

/** A mushroom glowing in the dark: a pale stem, a luminous cap with brighter spots; its glow breathes (drawDepths). */
function shroom(cx, foot, r) {
  const [spot, cap, under, stem] = S.shroom, sh = r + 1;
  for (let k = 0; k < sh; k++) { solid(cx, foot - k, stem); if (r > 2) solid(cx + 1, foot - k, mixC(stem, under, 0.5)); }
  const cy = foot - sh;
  for (let y = -r; y <= 0; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = (x / (r + 1)) ** 2 + (y / r) ** 2;
    if (d <= 1) solid(cx + x, cy + y, y === 0 ? under : (x * 3 + y * 5) % 7 === 0 ? spot : d < 0.4 && y < -1 ? spot : cap);
  }
  life.shrooms.push({ x: cx, y: cy - (r >> 1), r: r + 2, phase: noise(cx, foot, 55) * 40 });
}

/** A scatter of broken rock and red shards. */
function rubble(cx, foot, n) {
  const R = deepRock();
  for (let i = 0; i < n; i++) {
    const x = cx + Math.round((noise(cx, i, 56) - 0.5) * 14), y = foot - Math.round(noise(cx, i, 57) * 3), s = 1 + Math.floor(noise(i, cx, 58) * 3);
    for (let dy = -s; dy <= 0; dy++) for (let dx = -s; dx <= s; dx++) if (Math.abs(dx) + Math.abs(dy) <= s) solid(x + dx, y + dy, dy === -s ? R[0] : dx > 0 ? R[3] : R[2]);
    if (i % 2) prism(x + s, y, -Math.PI / 2 - 0.4, 3 + s, 0.9, S.ruby, { halo: 1 });
  }
}

/** A shattered crystal pillar: its stump, the break jagged and glowing. */
function brokenPillar(cx, foot, h) {
  const R = deepRock(), half = Math.max(3, Math.round(h * 0.2)), e = S.energy;
  for (let k = 0; k < h; k++) {
    const top = k > h - 4 - Math.round(noise(cx, 1, 59) * 3);
    for (let dx = -half; dx <= half; dx++) {
      if (top && noise(dx, k, 59) < (k - (h - 6)) / 6) continue;
      solid(cx + dx, foot - k, Math.abs(dx) === half ? R[4] : dx < -half * 0.4 ? R[0] : dx > half * 0.5 ? R[3] : (k % 6 === 0 ? R[3] : R[1]));
    }
  }
  for (let dx = -half + 1; dx < half; dx++) if (noise(dx, cx, 60) < 0.5) { put(cx + dx, foot - h + 4, e[1]); life.seams.push([cx + dx, foot - h + 4, dx]); }
  for (let k = 3; k < h - 4; k += 5) { const dx = Math.round((noise(k, cx, 61) - 0.5) * half); put(cx + dx, foot - k, e[2]); life.seams.push([cx + dx, foot - k, k]); }
}

/** The Energy Well's floor: a ring of energy round the two Pokémon, rune marks between its lines, laid in perspective. */
function energyRing() {
  const G = arenaGround(), e = S.energy;
  fillDisc(G, 1.05, (x, y, g) => {
    const px1 = g.unit / (G.R * 1.05);   // one pixel there, in radii
    if (Math.abs(g.d - 0.97) < px1 * 0.7) { life.seams.push([x, y, g.a * 6]); return e[3]; }
    if (Math.abs(g.d - 0.7) < px1 * 0.6) return e[4];
    if (Math.abs(g.d - 0.97) < px1 * 2.2 && dither(x, y) < 5) return null;
    if (g.d > 0.74 && g.d < 0.9) {
      const a = ((g.a / (Math.PI * 2)) * 15 + 15) % 1, r = (g.d - 0.74) / 0.16;
      if (a > 0.35 && a < 0.65 && r > 0.25 && r < 0.75 && ((a * 20 | 0) + (r * 6 | 0)) % 2) return e[4];
    }
    return null;
  });
}

/* ---------- landmarks: one per floor at an edge (landmark()), each place its own ---------- */

function deepLamp(cx, foot) {
  const [lit, body, shade, line] = S.wood;
  for (let y = foot - 16; y <= foot; y++) { solid(cx, y, line); solid(cx + 1, y, lit); solid(cx + 2, y, shade); }
  for (let x = cx; x <= cx + 6; x++) { solid(x, foot - 16, body); solid(x, foot - 17, line); }
  const lx = cx + 6, ly = foot - 13, [mLit, mBody, , mLine] = S.metal;
  solid(lx, ly - 2, mLine); solid(lx, ly - 1, mBody);
  for (let y = 0; y < 5; y++) for (let x = -2; x <= 2; x++) solid(lx + x, ly + y, Math.abs(x) === 2 || y === 0 || y === 4 ? (x < 0 ? mLit : mLine) : y === 2 && x === 0 ? S.lamp[0] : S.lamp[1]);
  life.lamps.push({ x: lx, y: ly + 2 });
}

function deepCart(cx, foot) {
  const [mLit, mBody, mShade, mLine] = S.metal, [wLit, , wShade] = S.wood;
  for (let x = -13; x <= 13; x++) { put(cx + x, foot + 1, mShade); put(cx + x, foot - 1, mLit); if ((x + 13) % 4 === 0) { put(cx + x, foot, wShade); put(cx + x + 1, foot, wLit); } }
  for (let y = -8; y <= -2; y++) for (let x = -7 + (y > -4 ? 1 : 0); x <= 7 - (y > -4 ? 1 : 0); x++) {
    solid(cx + x, foot + y, Math.abs(x) >= 6 || y === -8 ? (x < 0 ? mLit : mLine) : y === -6 ? mBody : (x + y) % 5 === 0 ? mShade : mBody);
  }
  for (const wx of [-4, 4]) for (const [dx, dy] of [[0, 0], [1, 0], [0, -1], [1, -1]]) solid(cx + wx + dx, foot + dy, mLine);
  for (let x = -5; x <= 5; x += 2) {   // a load of crystals heaped in it
    const g = x % 4 ? S.crystal : S.amethyst, tip = prism(cx + x, foot - 8, -Math.PI / 2 + x * 0.06, 2 + noise(x, 1, 62) * 3, 0.9, g);
    life.twinkles.push({ x: tip.x, y: tip.y, phase: noise(x, 2, 62) * 80 });
  }
  for (let x = -13; x <= 13; x++) bare(cx + x, foot);
}

function deepGeode(cx, foot) {
  const R = deepRock();
  mound(cx, foot, 9, 6, [R[0], R[1], R[3], R[4]], (x, y, u, v) => {
    const d = Math.hypot(u * 1.25, (v + 0.1) * 1.25);
    if (d < 0.55) return (x + y) % 3 === 0 ? S.amethyst[0] : d < 0.3 ? S.amethyst[3] : (x - y) % 2 ? S.amethyst[1] : S.amethyst[2];
    if (d < 0.7) return S.amethyst[4];
    return null;
  });
  for (let n = 0; n < 4; n++) life.twinkles.push({ x: cx - 2 + n, y: foot - 6 - (n & 1), phase: n * 20 });
}

function deepStalagmites(cx, foot) {
  stalagmite(cx - 4, foot, 18); stalagmite(cx + 3, foot + 1, 12); stalagmite(cx + 8, foot, 7);
  for (let x = -8; x <= 11; x++) bare(cx + x, foot);
}

function deepShrooms(cx, foot) {
  shroom(cx - 3, foot, 4); shroom(cx + 4, foot + 1, 3); shroom(cx + 8, foot, 2); shroom(cx - 8, foot + 1, 2);
}

function deepTablet(cx, foot) {
  const R = S.rocks[1], glyphs = ['.#.#.', '#...#', '.###.', '#.#.#', '##..#', '.#.##'];
  for (let y = -20; y <= 0; y++) for (let x = -7; x <= 7; x++) {
    if (y < -18 && Math.abs(x) > 7 - (y + 21)) continue;
    solid(cx + x, foot + y, Math.abs(x) === 7 || y === -20 ? R[4] : x < -4 ? R[0] : x > 4 ? R[3] : R[1]);
  }
  // Unown carved into it, glowing
  for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
    const g = glyphs[(row * 2 + col + (S.raw.seed & 7)) % glyphs.length];
    for (let k = 0; k < 5; k++) if (g[k] === '#') { const x = cx - 5 + col * 6 + k % 3, y = foot - 17 + row * 5 + Math.floor(k / 3) * 2; put(x, y, S.crystal[1]); life.seams.push([x, y, row * 3 + col]); }
  }
  for (let x = -8; x <= 8; x++) bare(cx + x, foot);
}

function deepSpire(cx, foot) {
  const tip = prism(cx, foot, -Math.PI / 2 + 0.06, 22, 2.6, S.crystal, { halo: 3 });
  life.twinkles.push({ x: tip.x, y: tip.y, phase: 0 });
  gemCluster(cx - 4, foot + 1, 9, S.amethyst, { n: 3 });
  gemCluster(cx + 5, foot + 1, 7, S.crystal, { n: 2 });
}

function deepArch(cx, foot) {
  prism(cx - 7, foot, -Math.PI / 2 + 0.5, 20, 2, S.amethyst, { halo: 2 });
  prism(cx + 7, foot, -Math.PI / 2 - 0.5, 20, 2, S.crystal, { halo: 2 });
  gemCluster(cx, foot + 1, 6, S.amethyst, { n: 3 });
}

function deepCrystalPool(cx, foot) {
  const [w0, w1, w2] = S.water, rx = 11, ry = 3;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2;
    if (d <= 1) { put(cx + x, foot + y, d > 0.7 ? w2 : (x + y) % 5 === 0 ? w0 : w1); bare(cx + x, foot + y); }
  }
  for (const [x, l, g] of [[-8, 9, S.crystal], [-4, 5, S.amethyst], [6, 11, S.crystal], [9, 6, S.amethyst]]) {
    const tip = prism(cx + x, foot - (x > 0 ? 1 : 0), -Math.PI / 2 + x * 0.04, l, 1.2, g, { halo: 1 });
    life.twinkles.push({ x: tip.x, y: tip.y, phase: x * 9 });
  }
}

function deepVent(cx, foot) {
  const e = S.energy, R = deepRock();
  for (let x = -9; x <= 9; x++) for (let k = 0; k < 3 - Math.abs(x) / 4; k++) solid(cx + x, foot - k, k ? R[2] : R[3]);
  let x = cx - 8;
  for (let k = 0; k < 17; k++, x++) {   // the split, glowing
    const y = foot - 1 + (k % 3 === 1 ? -1 : 0);
    put(x, y, k > 4 && k < 12 ? e[0] : e[1]); life.seams.push([x, y, k]);
  }
  life.vents = [{ x: cx, y: foot - 2 }];
  for (let x2 = -9; x2 <= 9; x2++) bare(cx + x2, foot);
}

function deepCorrupt(cx, foot) {
  gemCluster(cx, foot, 20, S.ruby, { n: 5, halo: 3, spread: 0.8 });
  for (let k = 0; k < 6; k++) { put(cx - 1 + (k & 1), foot - 4 - k * 2, S.energy[4]); }   // a dark heart in it
}

function deepObelisk(cx, foot) {
  const R = S.rocks[2], e = S.energy;
  for (let y = -22; y <= 0; y++) {
    const half = y < -18 ? Math.max(0, 22 + y) : 4 + (y > -3 ? 1 : 0);
    for (let x = -half; x <= half; x++) solid(cx + x, foot + y, Math.abs(x) === half ? R[4] : x < -1 ? R[0] : x > 1 ? R[3] : R[1]);
  }
  for (let a = 0; a < Math.PI * 2; a += 0.15) {   // Eternatus's mark, glowing on its face
    const s = Math.floor((a + Math.PI / 2) / (Math.PI * 0.4)), a0 = s * Math.PI * 0.4 - Math.PI / 2, f = (a + Math.PI / 2 - s * Math.PI * 0.4) / (Math.PI * 0.4);
    const x = cx + Math.round(3 * (Math.cos(a0) * (1 - f) + Math.cos(a0 + Math.PI * 0.4) * f)), y = foot - 11 + Math.round(3 * (Math.sin(a0) * (1 - f) + Math.sin(a0 + Math.PI * 0.4) * f));
    put(x, y, e[1]); life.seams.push([x, y, a * 2]);
  }
  put(cx, foot - 11, e[0]);
  for (let x = -6; x <= 6; x++) bare(cx + x, foot);
}

function deepFloater(cx, foot) {
  // a boulder hovering over its own glowing shadow; it bobs in drawDepths
  for (let x = -6; x <= 6; x++) if (dither(cx + x, foot) < 12 - Math.abs(x)) blend(cx + x, foot, S.energy[3], 0.6);
  (life.floaters ||= []).push({ x: cx, y: foot - 20, sprite: floaterSprite(6, true), phase: 0, onGround: true });
}

const DEEP_MARKS = [
  { lamp: deepLamp, cart: deepCart, geode: deepGeode, stalagmites: deepStalagmites, shrooms: deepShrooms },
  { tablet: deepTablet, spire: deepSpire, arch: deepArch, pool: deepCrystalPool, geode: deepGeode },
  { vent: deepVent, corrupt: deepCorrupt, obelisk: deepObelisk, floater: deepFloater },
];

/* ---------- what moves ---------- */

function makeDepthsLife() {
  const st = stage(), cold = st < 2;
  life.deepMotes = Array.from({ length: Math.round(W / (cold ? 14 : 7)) }, () => ({
    x: rand() * W, y: rand() * H, vy: cold ? 0.08 + rand() * 0.1 : 0.2 + rand() * 0.35, phase: rand() * 40, red: !cold && rand() < 0.75,
  }));
  life.drops = life.tips.map(tip => ({ ...tip }));
  life.bat = null; life.nextBat = tick + FPS * (3 + Math.floor(rand() * 6));
  if (st >= 2) {
    life.floaters ||= [];
    const n = st === 2 ? 3 + (W > 160 ? 2 : 0) : 0;
    for (let i = 0; i < n; i++) {
      const r = 3 + Math.floor(rand() * 5);
      life.floaters.push({ x: Math.round(W * (0.22 + rand() * 0.56)), y: Math.round(horizon * (0.2 + rand() * 0.45)), sprite: floaterSprite(r, r > 3), phase: rand() * 40, far: true });
    }
  }
  if (st === 3) {
    life.monoliths = Array.from({ length: 5 }, (_, i) => ({ a: i * Math.PI * 2 / 5, h: 5 + Math.round(noise(i, 1, 63) * 4), hw: 3 + (i % 2), bob: rand() * 40, tilt: (noise(i, 2, 63) - 0.5) * 0.5 }));
  }
}

/** How the Well behaves this frame: the column's width and the vortex's reach and spin; its boss prelude shapes them. */
function wellState(t) {
  const calm = { width: 1, vortex: 0.22, spin: t * 0.06, red: 0, speed: 1 };
  if (!bossPrelude) return calm;
  const age = preludeAge(t);
  if (bossPrelude.phase === 'awake') return storm.fury ? { width: 2.4, vortex: 0, spin: t * 0.16, red: 0.26, speed: 2.4 } : { width: 1.5, vortex: 0.62, spin: t * 0.09, red: 0.16, speed: 1.6 };
  if (bossPrelude.phase === 'max') {   // the Well dies as the dark comes down, and comes back roaring with the burst
    const s = Math.max(0, 1 - age / 9);
    return age >= MAX_BURST ? { width: 3, vortex: 0, spin: t * 0.3, red: 0.3, speed: 3 } : { width: s, vortex: 0.22 * s, spin: t * 0.06, red: 0, speed: 1 + (1 - s) * 2 };
  }
  if (bossPrelude.phase === 'portal') return { width: 3, vortex: 0.9, spin: t * 0.3, red: 0.35, speed: 3 };
  if (age < CORE_AT) { const s = age / CORE_AT; return { width: Math.max(0.15, 1 - s * 0.85), vortex: 0.22 - s * 0.14, spin: t * (0.06 + s * 0.2), red: s * 0.3, speed: 1 + s * 4 }; }
  const e = age - CORE_AT;
  return { width: 1.5 + 2.5 / (1 + e * 0.6), vortex: Math.min(0.75, 0.15 + e * 0.12), spin: t * 0.22, red: 0.3, speed: 2.5 };
}

function drawDepths(t) {
  const L = life, st = stage(), e = S.energy;

  for (const g of L.glimmers) if (Math.sin((t + g.phase) / 7) > 0.8) putSky(g.x, g.y, g.c);

  if (L.veins.length || L.seams.length) {   // the energy pulses through the veins and seams, towards the Well
    const shade = (w) => (w > 0.8 ? e[0] : w > 0.4 ? e[1] : w > -0.2 ? e[2] : e[3]);
    for (const [x, y, d] of L.veins) put(x, y, shade(Math.sin(t / 4 - d) * 1.6 - 0.6));
    for (const [x, y, d] of L.seams) put(x, y, shade(Math.sin(t / (st === 3 ? 2 : 3) + d) * 1.5 - 0.5));
  }

  if (st === 3) drawEnergyWell(t);

  if (L.floaters) for (const f of L.floaters) {
    const bob = Math.round(Math.sin((t + f.phase) / 6) * (f.far ? 1 : 1.5)), p = f.far ? putSky : put;
    for (const [dx, dy, c] of f.sprite) p(f.x + dx, f.y + dy + bob, c);
    if (Math.sin((t + f.phase) / 3) > 0.3) p(f.x, f.y + f.sprite.bottom + bob + 2, e[1]);   // a drip of energy off its point
  }

  if (L.beams) for (const b of L.beams) {   // motes turning in the halls' light
    for (let n = 0; n < 6; n++) {
      const f = ((t * 0.02 + n / 6 + b.x0 * 0.01) % 1), y = b.y0 + (b.y1 - b.y0) * f, hw = b.hw0 + (b.hw1 - b.hw0) * f;
      const x = b.x0 + b.lean * (y - b.y0) + Math.sin(t / 5 + n * 2) * hw * 0.7;
      if (Math.sin(t / 2 + n) > 0) put(x, y, S.crystal[0]);
    }
  }

  if (L.shaft) for (let n = 0; n < 8; n++) {   // dust turning in the daylight
    const s = L.shaft, f = ((t * 0.012 + n / 8) % 1), y = s.y0 + (s.y1 - s.y0) * f, x = s.x0 + (s.x1 - s.x0) * f + Math.sin(t / 6 + n * 3) * 2;
    if (Math.sin(t / 3 + n) > 0.2 && s.k > 0.3) put(x, y, S.daylight[0]);
  }

  for (const s of L.shrooms) {   // the mushrooms' glow breathes
    const k = 0.5 + 0.5 * Math.sin((t + s.phase) / 6);
    for (let dy = -s.r; dy <= s.r; dy++) for (let dx = -s.r - 1; dx <= s.r + 1; dx++) {
      const d = Math.hypot(dx / (s.r + 1), dy / s.r);
      if (d > 0.55 && d < 1 && dither(s.x + dx, s.y + dy) < k * 6) put(s.x + dx, s.y + dy, S.shroom[2]);
    }
  }

  for (const l of L.lamps) {
    const f = Math.sin(t / 2 + l.x) + Math.sin(t / 5.3);
    put(l.x, l.y, f > -0.5 ? S.lamp[0] : S.lamp[1]);
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if ((dx || dy) && dx * dx + dy * dy <= 14 + f * 2 && dither(l.x + dx, l.y + dy) < 3) blend(l.x + dx, l.y + dy, S.lamp[1], 0.4);
  }

  if (L.vents) for (const v of L.vents) for (let n = 0; n < 6; n++) {   // sparks spat up out of the vent
    const a = ((t * 0.9 + n * 7) % 24) / 24, x = v.x + Math.sin(n * 2.3 + t / 7) * 6 * a, y = v.y - a * 22;
    if (a < 0.9) put(x, y, e[n % 3]);
  }

  for (const g of L.twinkles) {
    const s = Math.sin((t + g.phase) / 6);
    if (s > 0.9) { put(g.x, g.y, S.crystal[0]); put(g.x - 1, g.y, S.crystal[1]); put(g.x + 1, g.y, S.crystal[1]); put(g.x, g.y - 1, S.crystal[1]); put(g.x, g.y + 1, S.crystal[1]); }
    else if (s > 0.7) put(g.x, g.y, S.crystal[0]);
  }

  for (const d of L.drops) {   // water dripping off the stalactites, a splash where it lands
    const a = (t + d.at) % 90;
    if (a < 50) { if (a > 40 && Math.floor(a) % 2) put(d.x, d.y, S.water[0]); continue; }
    const y = d.y + ((a - 50) ** 2) * 0.12;
    if (y < d.floor) put(d.x, y, S.water[0]);
    else if (y < d.floor + 8) { put(d.x - 1, d.floor - 1, S.water[1]); put(d.x + 1, d.floor - 1, S.water[1]); put(d.x - 2, d.floor, S.water[2]); put(d.x + 2, d.floor, S.water[2]); }
  }

  for (const m of L.deepMotes) {
    m.y -= (m.vy) * DT; m.x += (Math.sin((t + m.phase) / 6) * 0.25) * DT;
    if (m.y < -1) { m.y = H + 1; m.x = rand() * W; }
    const f = Math.sin((t + m.phase) / 4);
    if (f > -0.2) put(m.x, m.y, m.red ? e[f > 0.6 ? 0 : f > 0.2 ? 1 : 2] : S.mote[f > 0.5 ? 0 : 1]);
  }

  if (st < 2) {   // now and then a Zubat flits across the far dark
    if (!L.bat && t >= L.nextBat) L.bat = { x: rand() < 0.5 ? -4 : W + 4, y: Math.round(horizon * (0.25 + rand() * 0.5)), dir: 0 };
    if (L.bat) {
      const b = L.bat;
      if (!b.dir) b.dir = b.x < 0 ? 1 : -1;
      b.x += (b.dir * 1.6) * DT;
      const y = b.y + Math.round(Math.sin(t / 2) * 2), up = Math.floor(t) % 2, c = deepRock()[4];
      putSky(b.x, y, c); putSky(b.x - 1, y + (up ? -1 : 1), c); putSky(b.x + 1, y + (up ? -1 : 1), c); putSky(b.x - 2, y + (up ? -1 : 0), c); putSky(b.x + 2, y + (up ? -1 : 0), c);
      if (b.x < -6 || b.x > W + 6) { L.bat = null; L.nextBat = t + FPS * (6 + Math.floor(rand() * 10)); }
    }
  }
}

/* ----- the Energy Well's column, its vortex on the roof and the monoliths circling it ----- */

function drawEnergyWell(t) {
  const s = wellState(t), { x: cx } = wellAt(), e = S.energy, roofTop = life.roof[cx] ?? Math.round(horizon * 0.05);
  if (s.red) veil(e[4], s.red, true);
  darkestDay(t);
  const orbit = (m) => {
    const a = m.a + t * 0.035 * s.speed, near = Math.sin(a);
    return { x: cx + Math.cos(a) * W * 0.3, y: horizon * 0.52 + near * horizon * 0.1 + Math.sin((t + m.bob) / 6) * 1.5 - (s.speed - 1) * 2, k: 0.75 + near * 0.3, near };
  };
  const monolith = (m) => {
    const o = orbit(m), h = Math.round(m.h * o.k * (horizon / 60)), hw = Math.max(1, Math.round(m.hw * o.k)), R = S.rocks[2];
    for (let k = -h; k <= h; k++) {   // a shard of black crystal, edged in the energy it drinks
      const w = Math.round(hw * (1 - Math.abs(k) / (h + 1)) + 0.4), sx = Math.round(k * m.tilt);
      for (let dx = -w; dx <= w; dx++) put(o.x + dx + sx, o.y + k, Math.abs(dx) === w ? (dx < 0 ? e[1] : e[3]) : dx === 0 ? (k < 0 ? R[0] : R[1]) : dx < 0 ? R[1] : R[3]);
    }
    put(o.x, o.y, e[0]); put(o.x, o.y - 1, e[1]);
  };
  for (const m of life.monoliths) if (orbit(m).near < 0) monolith(m);
  if (s.width > 0.08) energyColumn(cx, horizon + 2, roofTop, Math.max(1.5 * Math.min(1, s.width * 2), W * 0.03 * s.width), t);
  vortex(cx, roofTop + 2, Math.round(W * s.vortex), s.spin, 0.85);
  for (const m of life.monoliths) if (orbit(m).near >= 0) monolith(m);
}

/** A column of energy from the floor to the roof: a white-hot core, crimson edges, bands spiralling up it, a glow round it. */
function energyColumn(cx, from, to, hw, t) {
  const e = S.energy;
  for (let y = Math.max(0, to); y <= from; y++) {
    const w = hw * (1 + 0.15 * Math.sin(y / 3 + t * 0.8)) + (y > from - 4 ? (y - from + 4) * 0.6 : 0);
    for (let dx = -Math.ceil(w * 2.2); dx <= w * 2.2; dx++) {
      const rel = Math.abs(dx) / Math.max(0.5, w), x = cx + dx;
      if (rel > 1) { if (rel < 2.2 && dither(x, y + t) < (2.2 - rel) * 6) blend(x, y, e[2], 0.35); continue; }
      const band = ((y + t * 3 + dx * 2) % 8 + 8) % 8 < 2;
      put(x, y, rel < 0.3 ? e[0] : rel < 0.6 ? (band ? e[0] : e[1]) : rel < 0.85 ? (band ? e[1] : e[2]) : e[3]);
    }
  }
}

/** Eternatus's vortex on the roof: red cloud wound into spiral arms round the top of the column, `R` wide. */
function vortex(cx, cy, R, spin, k) {
  if (R < 3) return;
  const e = S.energy, ry = R * 0.38;
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= cy + ry; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const dx = (x - cx) / R, dy = (y - cy) / ry, r = Math.hypot(dx, dy);
    if (r > 1 || !inside(x, y)) continue;
    const arm = Math.sin(Math.atan2(dy, dx) * 3 + Math.log(r + 0.05) * 5 - spin);
    if (arm < -0.1 && r > 0.15) continue;
    const fade = (1 - r) * 18 * k;
    if (dither(x, y) >= fade + 2) continue;
    put(x, y, r < 0.12 ? e[0] : arm > 0.75 ? e[1] : arm > 0.35 ? e[2] : r > 0.7 ? e[4] : e[3]);
  }
}

/* ----- the Energy Well's boss prelude: Eternatus wakes -----
   The seal's hum, the cavern shakes; the column is drawn back down into the Well and the vortex shrinks while every seam
   lights from the edges in, the monoliths whirl faster and the dark reddens. Eternatus's core rises out of the pit, a
   five-sided crystal of light swelling over the floor; then it bursts: a white flash, the column erupts three times as
   wide, a ring of force races out across the floor, crystal shards blow off the walls and the vortex spreads over the
   whole roof, the Darkest Day. Then the energy floods out of the Well over everything (the portal) into the white. */

const CORE_AT = 18;   // frames into the wake (8 fps) when the core bursts; the `eruption` and `core-surge` sounds are timed to it

function depthsWake(t) {
  const age = preludeAge(t), e = S.energy, { x: cx, y: cy } = wellAt();
  if (bossPrelude.phase === 'awake') return 0;
  const reach = Math.min(1, age / 14);
  // the seams light from the edges in, towards the Well
  const far = Math.hypot(W, H);
  for (const [x, y] of life.seams) if (Math.hypot(x - cx, (y - cy) * 2.5) > far * (1 - reach) * 0.6) put(x, y, (x + y + Math.floor(age)) % 3 ? e[1] : e[0]);
  if (age < CORE_AT) {
    for (let i = 0; i < 30; i++) {   // motes drawn in towards the Well, spiralling
      const p = ((age / CORE_AT) * 2 + noise(i, 64, 0)) % 1, a = noise(i, 64, 1) * Math.PI * 2 + p * 4, r = (1 - p) * W * 0.6;
      put(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.35 - (1 - p) * horizon * 0.3, e[i % 3]);
    }
    if (age > 7) core(cx, cy - 1 - Math.round((age - 7) * horizon * 0.035), Math.min(W, H) * 0.012 * (age - 6), age);
    return age > 12 ? 2 : age > 3 ? 1 : 0;
  }
  const b = age - CORE_AT;
  if (Math.floor(b) === 0) flashScreen(1.4, 80);
  if (b < 6) shockRing(cx, cy, b * W * 0.16, [e[0], e[2]], 0.3);
  for (let i = 0; i < 26; i++) {   // shards blown off the walls
    const side = i % 2 ? 1 : -1, a = noise(i, 65, 0), x = side < 0 ? W * a * 0.25 : W - W * a * 0.25, y = horizon * (0.15 + noise(i, 65, 1) * 0.7);
    const fx = x - side * b * (2 + noise(i, 65, 2) * 5), fy = y + b * b * 0.35 - b * 1.5;
    if (fy < H) { put(fx, fy, i % 3 ? S.ruby[1] : S.crystal[0]); put(fx + side, fy, S.ruby[3]); }
  }
  core(cx, cy - 1 - Math.round(11 * horizon * 0.035), Math.min(W, H) * (0.13 + b * 0.02), age);
  return b < 5 ? 2 : 1;
}

/** Eternatus's core: a five-sided crystal of energy, spinning, cut into facets round a white heart, a ray of light off
    each point. */
function core(cx, cy, r, age) {
  if (r < 1) return;
  const e = S.energy, spin = age * 0.25, seg = Math.PI * 0.4;
  for (let n = 0; n < 5; n++) {   // the rays
    const a = spin + n * seg - Math.PI / 2, len = r * (1.9 + 0.3 * Math.sin(age * 0.9 + n));
    for (let k = r; k < len; k += 0.6) {
      const w = (1 - (k - r) / (len - r)) * Math.max(0.6, r * 0.09);
      for (let s = -w; s <= w; s += 0.6) put(cx + Math.cos(a) * k - Math.sin(a) * s, cy + Math.sin(a) * k + Math.cos(a) * s, k > len * 0.8 ? e[2] : Math.abs(s) < w * 0.4 ? e[0] : e[1]);
    }
  }
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, a = Math.atan2(dy, dx) - spin + Math.PI / 2, d = Math.hypot(dx, dy);
    const f = ((a % seg) + seg) % seg, edge = r * Math.cos(seg / 2) / Math.cos(f - seg / 2);
    if (d > edge + 1) continue;
    const rel = d / edge, facet = Math.floor((((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / seg), lit = (f < seg / 2) !== (facet % 2 === 0);
    put(x, y, d > edge ? e[4] : rel > 0.84 ? e[3] : rel < 0.24 ? e[0] : rel < 0.4 ? e[1] : lit ? e[1] : e[2]);
  }
}

/** The energy floods out of the Well: a swell of crimson light, laced with hexagons like the Darkest Day's sky, over
    everything; then the paired white flashes. */
function depthsPortal(t) {
  const age = preludeAge(t), frame = age | 0;
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  const e = S.energy, { x: cx, y: cy } = wellAt(), R = Math.hypot(W, H) * 1.1 * Math.min(1, ((age + 1) / 6) ** 1.6), hex = Math.max(5, Math.round(Math.min(W, H) / 9));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, (y - cy) * 1.4), edge = R + Math.sin(Math.atan2(y - cy, x - cx) * 7 + age * 2) * 3;
    if (d > edge + 3) continue;
    if (d > edge) { if (dither(x, y + age) < 7) put(x, y, e[2]); continue; }
    // a hex grid (cube coordinates, rounded): how near the pixel is to its cell's edge
    const q = (0.577 * (x - cx) - (y - cy) / 3) / hex, r = (2 / 3) * (y - cy) / hex, sq = -q - r;
    let rq = Math.round(q), rr = Math.round(r), rs = Math.round(sq);
    const eq = Math.abs(rq - q), er = Math.abs(rr - r), es = Math.abs(rs - sq);
    if (eq > er && eq > es) rq = -rr - rs; else if (er > es) rr = -rq - rs; else rs = -rq - rr;
    const dq = q - rq, dr = r - rr, ds = sq - rs, rel = d / Math.max(1, edge);
    const line = Math.max(Math.abs(dq - dr), Math.abs(dr - ds), Math.abs(ds - dq)) > 0.85;
    put(x, y, line ? (rel < 0.5 ? e[0] : e[1]) : rel < 0.3 ? e[0] : ((d - age * 4) / 5 | 0) % 2 ? e[2] : e[3]);
  }
  core(cx, cy - 1 - Math.round(11 * horizon * 0.035), Math.min(W, H) * (0.25 + age * 0.05), age + 30);
  return frame < 6 ? 2 : 0;
}

/* ----- Eternamax: the Darkest Day (bossRebirth) -----
   Eternatus has sunk into the Well. The Well's column dies and the cavern goes dark; red cracks race out across the roof
   from above the Well, glowing hotter; the roof splits open in a jagged rift on a blood-red sky of churning cloud laced
   with Dynamax hexagons, rock raining down and red light pouring in. Eternamax's colossal silhouette comes down through
   the rift, backlit, until its markings ignite, a crimson burst, and the Well roars back. The rift stays open all fight. */

const MAX_CRACK = 3, MAX_SPLIT = 16, MAX_OPEN = 8, MAX_DESCEND = 21, MAX_LANDED = 39, MAX_BURST = 50, MAX_END = 58;
const MAX_SOUNDS = [[0, 'quake'], [MAX_CRACK, 'gate-crack'], [10, 'gate-crack'], [MAX_SPLIT, 'gate-shatter'], [MAX_SPLIT + 1, 'thunder'],
  [MAX_DESCEND, 'gate-hum'], [MAX_LANDED, 'charge'], [MAX_BURST, 'core-surge']];
const DARKEST = ['#ffe4ec', '#ff5a78', '#d81838', '#8a0a24', '#4a0414', '#1c0108'].map(abgr);

/* Eternamax's silhouette, from its front sprite's first frame: where it is solid, and where it shines (its brightest
   markings, which ignite as it lands). Cropped to the figure. */
let maxFig = null, maxFigLoad = null;
function maxFigureReady() {
  return maxFigLoad ||= new Promise(resolve => {
    const pic = new Image();
    pic.onload = () => {
      const c = document.createElement('canvas'), w = pic.naturalWidth, h = pic.naturalHeight;
      c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(pic, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      let top = h, bottom = 0, left = w, right = 0;
      for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] >= 128) {
        const x = i % w, y = (i / w) | 0;
        top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x);
      }
      const cw = right - left + 1, ch = bottom - top + 1, mask = new Uint8Array(cw * ch), glow = new Uint8Array(cw * ch);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const i = ((y + top) * w + x + left) * 4;
        if (d[i + 3] < 128) continue;
        mask[y * cw + x] = 1;
        if (d[i] + d[i + 1] + d[i + 2] > 520 || (d[i] > 220 && d[i + 1] < 120 && d[i + 2] > 120)) glow[y * cw + x] = 1;
      }
      maxFig = { w: cw, h: ch, mask, glow };
      resolve();
    };
    pic.onerror = () => resolve();
    pic.src = 'assets/pokemon/eternamax-front.gif';
  });
}

const maxAge = (t) => (bossPrelude?.phase === 'max' ? preludeAge(t) : null);
/** How far the roof has split open, 0..1: all the way once Eternamax is up. */
function riftOpen(t) {
  if (bossPrelude?.phase === 'awake') return storm.fury ? 1 : 0;
  const age = maxAge(t);
  if (age == null || age < MAX_SPLIT) return 0;
  return 1 - (1 - Math.min(1, (age - MAX_SPLIT) / MAX_OPEN)) ** 3;
}
const riftMid = () => Math.round(horizon * 0.3);
/** The rows the rift spans in column x, opened k of the way: it tears further up than down, ragged at both lips. */
function riftSpan(x, k) {
  const hw = W * 0.46 * k, u = (x + 0.5 - wellAt().x) / Math.max(1, hw);
  if (Math.abs(u) >= 1) return null;
  const half = (1 - u * u) ** 0.7 * horizon * 0.45 * k, jag = ((noise(x >> 1, 7, 90) - 0.5) * 4 + Math.sin(x * 0.9)) * k;
  return [Math.round(riftMid() - half * 1.6 + jag), Math.round(riftMid() + half + (noise(x, 3, 91) - 0.5) * 3 * k)];
}

/** The Darkest Day's sky: red cloud churning round a hot heart over the Well, faint Dynamax hexagons through it. */
function darkestSky(x, y, t) {
  const u = x / W, v = y / Math.max(1, horizon), cx = wellAt().x;
  const churn = Math.sin(u * 9 + t * 0.11 + Math.sin(v * 7 - t * 0.07) * 1.5) + 0.7 * Math.sin(v * 13 - u * 4 + t * 0.09) + 0.3 * Math.sin((u + v) * 21 + t * 0.2);
  const heart = Math.max(0, 1 - Math.hypot((x - cx) / (W * 0.3), (y - riftMid()) / (horizon * 0.3)));
  const lvl = Math.max(0, Math.min(0.999, 0.25 + churn * 0.12 + heart * 0.55)), f = lvl * 5, i = Math.floor(f);
  let c = DARKEST[5 - Math.min(5, i + ((f - i) * 16 > dither(x, y) ? 1 : 0))];
  const hex = Math.max(4, Math.round(horizon * 0.09)), q = (0.577 * (x - cx) - (y - t * 0.15) / 3) / hex, r = (2 / 3) * (y - t * 0.15) / hex;
  if (hexEdge(q, r) && churn > 0.2 && dither(x, y + t) < 9) c = DARKEST[2];
  return c;
}
/** True where (q, r), in hex cell units, lies on its cell's edge (cube coordinates, rounded). */
function hexEdge(q, r) {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const eq = Math.abs(rq - q), er = Math.abs(rr - r), es = Math.abs(rs - s);
  if (eq > er && eq > es) rq = -rr - rs; else if (er > es) rr = -rq - rs; else rs = -rq - rr;
  const dq = q - rq, dr = r - rr, ds = s - rs;
  return Math.max(Math.abs(dq - dr), Math.abs(dr - ds), Math.abs(ds - dq)) > 0.85;
}

/** The sky's half of it, drawn behind the Well's column and the near monoliths: the dark coming down, the cracks, the
    rift and its sky, red bolts in it, and Eternamax's silhouette coming down through it. */
function darkestDay(t) {
  const age = maxAge(t), k = riftOpen(t), cx = wellAt().x;
  if (age != null) {
    const dark = age < MAX_SPLIT ? Math.min(0.62, age * 0.07) : Math.max(0.3, 0.62 - (age - MAX_SPLIT) * 0.04);
    veil(abgr('#060004'), dark);
    if (age >= MAX_CRACK && age < MAX_SPLIT + 3) riftCracks(age);
  }
  if (k <= 0) return;
  const lip = deepRock()[4], hot = age != null && age < MAX_SPLIT + MAX_OPEN;
  for (let x = 0; x < W; x++) {
    const span = riftSpan(x, k);
    if (!span) continue;
    const [top, bot] = span;
    for (let y = Math.max(0, top); y <= bot; y++) putSky(x, y, y === bot || y === top ? DARKEST[hot ? 0 : 1] : darkestSky(x, y, t));
    putSky(x, bot + 1, DARKEST[3]); putSky(x, bot + 2, lip); if (top > 0) putSky(x, top - 1, lip);
  }
  const n = Math.floor(t / 13);   // a red bolt down the rift now and then
  if (t % 13 < 2 && noise(n, 1, 92) < 0.7) {
    let x = cx + Math.round((noise(n, 2, 92) - 0.5) * W * 0.5);
    const span = riftSpan(x, k);
    if (span) for (let y = Math.max(0, span[0]); y < span[1]; y++) { putSky(x, y, DARKEST[0]); putSky(x + 1, y, DARKEST[1]); if (noise(n, y, 93) < 0.4) x += noise(n, y, 94) < 0.5 ? -1 : 1; }
  }
}

/** Red cracks racing out across the roof from above the Well, flickering hotter as they near the split. */
function riftCracks(age) {
  const paths = life.maxCracks ||= Array.from({ length: 9 }, (_, i) => {
    const out = [], side = i % 2 ? 1 : -1;
    let x = wellAt().x + side, y = riftMid() + (noise(i, 1, 95) - 0.5) * 4, a = (side < 0 ? Math.PI : 0) + (noise(i, 2, 95) - 0.5) * 1.6;
    for (let n = 0; n < W * 0.5; n++) {
      out.push([x | 0, y | 0]);
      a += (noise(i, n, 96) - 0.5) * 0.7;
      x += Math.cos(a); y += Math.sin(a) * 0.7;
    }
    return out;
  });
  const p = Math.min(1, (age - MAX_CRACK) / (MAX_SPLIT - MAX_CRACK - 2)), e = S.energy;
  paths.forEach((path, i) => {
    const len = Math.round(path.length * Math.min(1, p * (0.6 + noise(i, 3, 95) * 0.6)));
    for (let n = 0; n < len; n++) {
      const [x, y] = path[n];
      putSky(x, y, (n + Math.floor(age)) % 4 && p > 0.6 ? DARKEST[0] : DARKEST[1]);
      if (dither(x, y + age) < 4 + p * 6) { blend(x, y - 1, DARKEST[2], 0.5); blend(x, y + 1, e[3], 0.5); }
    }
  });
}

/** Eternamax, colossal, coming down through the rift into the arena: black against the red, rimmed in its light, its
    markings smouldering and then igniting as it lands. Wider than the screen. */
function maxSilhouette(t, age) {
  const f = maxFig, fw = W * 1.2, s = f.w / fw, fh = f.h / s;
  const p = Math.min(1, (age - MAX_DESCEND) / (MAX_LANDED - MAX_DESCEND)), ease = 1 - (1 - p) ** 3;
  const bottom = -2 + (horizon + (H - horizon) * 0.08 + 2) * ease, fx = Math.round(wellAt().x - fw / 2), fy = Math.round(bottom - fh);
  const lit = age >= MAX_LANDED ? Math.min(1, (age - MAX_LANDED) / 4) : p * 0.3, body = abgr('#14000a');
  const at = (sx, sy) => sx >= 0 && sy >= 0 && sx < f.w && sy < f.h ? f.mask[sy * f.w + sx] : 0;
  for (let y = Math.max(0, fy); y < Math.min(H, bottom + 1); y++) for (let x = Math.max(0, fx); x < Math.min(W, fx + fw); x++) {
    const sx = ((x - fx) * s) | 0, sy = ((y - fy) * s) | 0;
    if (!at(sx, sy)) continue;
    const step = Math.max(1, Math.round(s)), rim = !at(sx, sy - step) || !at(sx - step, sy) || !at(sx + step, sy);
    let c = rim ? DARKEST[2] : body;
    if (f.glow[sy * f.w + sx] && dither(x, y + t) < lit * 16) c = lit > 0.8 && (x + y + Math.floor(t)) % 3 ? DARKEST[0] : DARKEST[1];
    put(x, y, c);
  }
}

/** The front half: rock raining from the rift, red light pouring down through it, and the burst as Eternamax ignites. */
function depthsMax(t) {
  const age = preludeAge(t), e = S.energy, { x: cx } = wellAt(), k = riftOpen(t);
  if (age >= MAX_BURST) {
    const b = age - MAX_BURST;
    if (b < 2) { px.fill(DARKEST[Math.floor(b) ? 1 : 0]); return 2; }
    for (let r = 0; r < 3; r++) shockRing(cx, riftMid() + horizon * 0.3, (b - 2 + r * 0.7) * W * 0.18, [DARKEST[0], DARKEST[2]], 0.35);
    veil(DARKEST[2], Math.max(0, 0.7 - (b - 2) * 0.14));
    return b < 5 ? 2 : 1;
  }
  if (age >= MAX_DESCEND && maxFig) maxSilhouette(t, age);
  if (k > 0) {
    const fall = Math.min(1, (age - MAX_SPLIT) / 3) * Math.max(0.35, 1 - (age - MAX_SPLIT) / 30), mid = riftMid();
    for (let y = mid; y < H; y++) {   // the light pouring down out of the rift, widening as it falls
      const hw = W * 0.3 * k + (y - mid) * 0.22;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) blend(x, y, DARKEST[2], fall * 0.3 * (1 - Math.abs(x - cx) / hw) * (1 - (y - mid) / (H - mid) * 0.6));
    }
    const rocks = life.maxRocks ||= Array.from({ length: 28 }, (_, i) => ({
      x: cx + (noise(i, 1, 97) - 0.5) * W * 0.8, vx: (noise(i, 2, 97) - 0.5) * 0.8, delay: noise(i, 3, 97) * 12, r: 1 + Math.floor(noise(i, 4, 97) * 2.5),
    }));
    const R = deepRock();
    for (const rock of rocks) {
      const a = age - MAX_SPLIT - rock.delay;
      if (a < 0) continue;
      const span = riftSpan(rock.x | 0, 1), y0 = span ? span[1] : riftMid();
      const x = rock.x + rock.vx * a, y = y0 + a * 1.5 + a * a * 0.35;
      if (y > H + 3) continue;
      for (let dy = -rock.r; dy <= rock.r; dy++) for (let dx = -rock.r; dx <= rock.r; dx++) {
        if (dx * dx + dy * dy > rock.r * rock.r + 1) continue;
        put(x + dx, y + dy, dy === -rock.r ? DARKEST[2] : dx > 0 || dy > 0 ? R[4] : R[3]);
      }
      put(x, y - rock.r - 1, e[3]);   // an ember trail off its top
    }
  }
  if (age < MAX_SPLIT) return age > 10 ? 1 : age > MAX_CRACK && age % 4 < 2 ? 1 : 0;
  return age < MAX_SPLIT + 4 ? 2 : age >= MAX_LANDED ? 1 : 0;
}

LANDMARKS.depths = DEEP_MARKS;

/* ============================================================
   THE SUNKEN RUINS (roadmap item 19 part b)
   A temple drowned in a jungle lagoon. Its ground is shallow water: ruinsFloor() mirrors the backdrop in it, everything
   standing in it is painted dry() and mirrored by reflect(), and drawRuins() ripples the lot each frame (every wet
   pixel takes its row's neighbour a pixel or two along, from the still `snap`). Its places by stage(): the Flooded
   Steps (a stepped temple whose grand stair runs down into the lagoon, an aqueduct pouring into it), the Drowned Halls
   (a colonnade in perspective under broken lintels, light falling through), the Sunken Court (a colossal stone head sunk
   to its chin, a fountain, lily pads) and the Tide Altar (a round pool ringed by pillars, the tide wheel on its altar).
   ============================================================ */

/** A pixel of something standing in the water: solid, out of the ripple, and marked for reflect(). */
function dry(x, y, c) {
  x |= 0; y |= 0;
  if (!inside(x, y)) return;
  const i = y * W + x;
  px[i] = c; sky[i] = 0;
  if (life.wet) { life.wet[i] = 0; life.fresh[i] = 1; }
}

/** Inside an arched opening `hw` wide each way and `h` tall, its feet on `foot`. */
function inArch(x, y, cx, foot, hw, h) {
  const dx = x + 0.5 - cx, spring = foot - h + hw;
  return Math.abs(dx) <= hw && y <= foot && (y >= spring || dx * dx + (y + 0.5 - spring) ** 2 <= hw * hw);
}

/** Courses of dressed stone over x0..x1, y0..y1, staggered and weathered, moss in patches; `shade(x, y)` (0-1) darkens
    it, `skip(x, y)` leaves holes (arches, a fallen corner). */
function masonry(x0, x1, y0, y1, { paint = solid, course = 3, len = 7, moss = 0.2, shade = null, seed = 0, skip = null } = {}) {
  const b = M().block, mo = M().moss;
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
    const row = Math.floor((y - y0) / course), ry = (y - y0) % course, off = (row & 1) * (len >> 1) + Math.floor(noise(row, seed, 71) * 3);
    for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
      if (skip?.(x, y)) continue;
      const rx = (((x - x0 + off) % len) + len) % len;
      let i = ry === course - 1 || rx === 0 ? 3 : ry === 0 ? 0 : noise(x >> 1, y >> 1, 72 + seed) < 0.2 ? 2 : 1;
      if (shade && dither(x, y) < shade(x, y) * 16) i = Math.min(4, i + 1);
      paint(x, y, moss && i && noise(x >> 2, y >> 2, 73 + seed) < moss ? mo[i >= 3 ? 2 : 1] : b[i]);
    }
  }
}

/** A fluted column from `foot` up to `top`, `hw` each side of `cx`: a base, the shaft lit on its left, a capital; a
    `broken` one is snapped off jagged. Moss climbs from its foot. */
function pillar(cx, foot, top, hw, { paint = solid, broken = false, seed = 0, moss = 0.35 } = {}) {
  const b = M().block, mo = M().moss, h = Math.max(1, foot - top);
  const capH = broken ? 0 : Math.max(1, Math.round(hw * 0.8)), baseH = Math.max(1, Math.round(hw * 0.6));
  for (let y = Math.max(0, top); y <= Math.min(H - 1, foot); y++) {
    const up = foot - y, cap = y < top + capH;
    const w = up < baseH ? hw + 1 : cap ? hw + Math.max(1, Math.round(hw * 0.5)) : hw;
    for (let x = -w; x <= w; x++) {
      if (broken && y < top + Math.round(Math.abs(Math.sin((x + seed) * 1.9)) * Math.max(1, hw))) continue;
      const u = (x + w + 0.5) / (2 * w + 1);
      let i = u < 0.22 ? 0 : u < 0.6 ? 1 : u < 0.86 ? 2 : 3;
      if (!cap && up >= baseH && hw >= 2 && x % 2 === 0 && x > -w && x < w) i = Math.min(4, i + 1);   // the flutes
      if (cap && y === top + capH - 1) i = 3;
      if (x === w || up === baseH) i = 4;
      let c = b[i];
      if (up < h * moss * (0.4 + noise(cx + x, 3, 74)) && noise((cx + x) >> 1, y >> 1, 75) < 0.6) c = mo[i >= 2 ? 2 : 1];
      if (broken && y < top + hw + 1 && noise(cx + x, y, 76) < 0.45) c = mo[0];
      paint(cx + x, y, c);
    }
  }
}

/** Mirror what was just painted dry() between x0 and x1, from y0 down to `foot`, into the water under it. */
function reflect(x0, x1, y0, foot, keep = 0.45) {
  const { wet, fresh } = life, w = M().water;
  if (!wet) return;
  x0 = Math.max(0, x0 | 0); x1 = Math.min(W - 1, x1 | 0); y0 = Math.max(0, y0 | 0); foot |= 0;
  for (let y = foot + 1; y < H && 2 * foot + 1 - y >= y0; y++) {
    const sy = 2 * foot + 1 - y, d = depthOf(y), deep = mixC(w[1], w[3], Math.min(1, d * 1.2)), k = Math.min(0.85, keep + d * 0.3);
    for (let x = x0; x <= x1; x++) {
      const i = y * W + x, s = sy * W + x;
      if (wet[i] && fresh[s]) px[i] = mixC(px[s], deep, k);
    }
  }
  for (let y = y0; y <= Math.min(H - 1, foot); y++) fresh.fill(0, y * W + x0, y * W + x1 + 1);
}

/** A fall of water from x0..x1 at `top` down to `foot`; a live one runs and foams (drawRuins), a still one is far off. */
function fall(x0, x1, top, foot, still = false) {
  const w = M().water;
  for (let y = top; y <= foot; y++) for (let x = x0; x <= x1; x++) {
    const c = (y + x * 3) % 5 < 2 ? w[0] : w[1];
    solid(x, y, still ? mixC(c, S.far[1], 0.45) : c);
  }
  if (!still) { life.falls.push({ x0, x1, top, foot }); steam(x0, foot - 1, 0.7); }
}

/* ----- the back ----- */

function ruinsBackdrop() {
  const st = stage();
  life.falls = []; life.runes = []; life.ruVines = [];
  ruinsFar();
  if (st === 0) floodedSteps();
  if (st === 1) drownedHalls();
  if (st === 2) sunkenCourt();
  if (st === 3) altarRing();
}

/** Far cliffs with falls down them, the jungle's crowns along the shore, a few palms over them. */
function ruinsFar() {
  const st = stage();
  ridge(horizon - Math.round(horizon * [0.24, 0.32, 0.22, 0.3][st]), Math.max(2, Math.round(horizon * 0.1)), 23, 2.3 + st, S.far, true);
  for (const at of st === 2 ? [0.32] : [0.26, 0.72]) {
    const x = Math.round(W * at + (noise(st, at * 10, 77) - 0.5) * W * 0.1);
    let y0 = 0;
    while (y0 < horizon && sky[y0 * W + x]) y0++;
    if (y0 < horizon - 4) fall(x, x + (W > 160 ? 1 : 0), y0 + 1, horizon - 2, true);
  }
  jungleCrowns(horizon - Math.round(horizon * 0.07), Math.max(3, Math.round(horizon * 0.09)));
  for (let n = 0, count = Math.max(2, Math.round(W / 45)); n < count; n++) {
    ruinPalm(Math.round(rand() * W), horizon - Math.round(horizon * 0.06), Math.round(horizon * (0.18 + rand() * 0.14)), rand() < 0.5 ? -1 : 1);
  }
}

/** A band of round treetops down to the horizon, each lit on its top left. */
function jungleCrowns(base, amp) {
  const [lit, body, shade, deep] = S.jungle;
  for (let x = -4; x < W + 4; x += 2 + Math.floor(rand() * 4)) {
    const r = 2 + Math.floor(rand() * amp), cy = base - Math.floor(rand() * amp * 0.7);
    for (let dy = -r; cy + dy < horizon; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dy < 0 && dx * dx + dy * dy > r * r) continue;
      const l = (dx + dy * 1.2) / r, xx = x + dx, yy = cy + dy;
      solid(xx, yy, dy > r * 0.5 ? deep : l < -0.8 ? lit : l < 0.2 ? (dither(xx, yy) < 4 ? lit : body) : shade);
    }
  }
}

/** A palm leaning out over the jungle: a curved trunk and drooping fronds. */
function ruinPalm(cx, foot, h, lean) {
  const [lit, body, shade] = S.jungle, [bark, barkDark] = S.trunk;
  let x = cx;
  for (let k = 0; k < h; k++) { x = cx + lean * (k / h) ** 2 * h * 0.35; solid(x, foot - k, k % 3 ? bark : barkDark); }
  const tx = Math.round(x), ty = foot - h;
  for (const [ang, len] of [[-2.8, 1], [-2.3, 0.8], [-1.6, 0.5], [-0.85, 0.8], [-0.35, 1], [3.05, 0.7], [0.1, 0.7]]) {
    const L = Math.max(3, Math.round(h * 0.45 * len));
    for (let k = 1; k <= L; k++) {
      const fx = tx + Math.cos(ang) * k, fy = ty + Math.sin(ang) * k + (k / L) ** 2 * L * 0.5;
      solid(fx, fy, k < L * 0.35 ? body : lit);
      solid(fx, fy + 1, shade);
    }
  }
}

/* The Flooded Steps: an aqueduct on the left pouring into the lagoon, a broken colonnade on the right, and in the middle
   the stepped temple, its grand stair running down into the water (and on under it: ruinsFloor). */
function floodedSteps() {
  const cx = Math.round(W * 0.5), sz = Math.round(Math.min(W * 0.56, horizon * 1.25) * (0.85 + 0.2 * within()));
  aqueduct(-2, Math.round(W * 0.27), horizon - Math.round(horizon * 0.36), horizon - 1);
  ruinedColumns([0.8, 0.87, 0.95].map(k => Math.round(W * k)), horizon - 1, Math.round(horizon * 0.55));
  steppedTemple(cx, horizon - 1, sz);
}

function aqueduct(x0, x1, top, foot) {
  const span = Math.max(9, Math.round((foot - top) * 0.75)), pier = Math.max(2, Math.round(span * 0.3)), ch = Math.max(2, Math.round((foot - top) * 0.18));
  const half = (span - pier) / 2, spring = top + ch + 1 + half;
  const open = (x, y) => {
    const k = (((x - x0) % span) + span) % span;
    if (k < pier || y <= top + ch) return false;
    const ax = k - pier - half + 0.5;
    return y >= spring || ax * ax + (y - spring) ** 2 <= half * half;
  };
  const end = (y) => x1 - Math.round(noise(y >> 1, 3, 81) * 3);   // where it broke off, jagged
  masonry(x0, x1, top, foot, { course: 3, len: 6, moss: 0.3, seed: 9, skip: (x, y) => open(x, y) || x > end(y) });
  fall(x1 + 1, x1 + (W > 160 ? 3 : 2), top + 1, horizon - 1);
}

/** Columns standing and fallen at the lagoon's edge, a lintel slipped off the first two. */
function ruinedColumns(xs, foot, tall) {
  const hw = Math.max(1, Math.round(W * 0.012)), tops = [];
  xs.forEach((x, i) => {
    const top = foot - Math.round(tall * [1, 0.7, 0.42][i % 3]);
    pillar(x, foot, top, hw, { broken: i > 0, seed: i * 5 });
    tops.push(top);
  });
  const b = M().block, [xa, xb] = xs, ya = tops[0] - 1, yb = tops[1] + 2;
  for (let x = xa - hw - 2; x <= xb + 1; x++) {
    const y = Math.round(ya + (yb - ya) * Math.max(0, (x - xa) / (xb - xa)));
    solid(x, y - 2, b[0]); solid(x, y - 1, b[1]); solid(x, y, b[3]);
  }
}

/** The temple: a platform with its grand stair, three tiers going up (the middle one's corner fallen away), a frieze of
    waves and a doorway framed with runes on the first, a crested shrine on top. Moss on every ledge, vines hanging. */
function steppedTemple(cx, foot, sz) {
  const b = M().block, mo = M().moss, vine = M().vine;
  const hw0 = Math.round(sz * 0.55), ph = Math.max(4, Math.round(sz * 0.2)), top0 = foot - ph;
  const right = (x0, x1) => (x) => Math.max(0, ((x - x0) / Math.max(1, x1 - x0) - 0.6) * 2);
  masonry(cx - hw0, cx + hw0, top0, foot, { course: 3, len: 8, moss: 0.22, shade: right(cx - hw0, cx + hw0), seed: 1 });
  const half = (y) => Math.round(sz * (0.11 + 0.08 * (y - top0) / ph));
  for (let y = top0; y <= foot; y++) {
    const hf = half(y), tread = (y - top0) % 2 === 0;
    for (let x = -hf - 1; x <= hf + 1; x++) {
      let c = Math.abs(x) > hf ? b[4] : tread ? (x < -hf * 0.5 ? b[0] : b[1]) : x > hf * 0.4 ? b[4] : b[3];
      if (tread && Math.abs(x) <= hf && noise((cx + x) >> 1, y, 78) < 0.14) c = mo[1];
      solid(cx + x, y, c);
    }
  }
  life.stair = { cx, half: half(foot), grow: (sz * 0.08) / ph, bottom: Math.round((H - horizon) * 0.24) };

  let y1 = top0 - 1;
  [[0.8, 0.19], [0.58, 0.14], [0.34, 0.14]].forEach(([wk, hk], i) => {
    const hw = Math.round(hw0 * wk), th = Math.max(3, Math.round(sz * hk)), y0 = y1 - th + 1;
    const cut = i === 1 ? (x, y) => x - (cx + hw - Math.round(hw * 0.3)) > (y - y0) + Math.round(noise(y, 1, 79) * 2) : null;
    masonry(cx - hw, cx + hw, y0, y1, { course: 3, len: 7, moss: 0.16, shade: right(cx - hw, cx + hw), seed: 2 + i, skip: cut });
    for (let x = cx - hw; x <= cx + hw; x++) {
      if (cut?.(x, y0)) continue;
      solid(x, y0, dither(x, y0) < 6 ? mo[0] : b[0]);   // its ledge, mossy
      if (noise(x, i, 80) < 0.1) for (let k = 1, len = 2 + Math.floor(noise(x, i, 81) * Math.min(7, th)); k <= len; k++) solid(x + (k % 3 === 2 ? 1 : 0), y0 + k, vine[k === len ? 0 : 1]);
    }
    if (i === 0) {
      if (th >= 7) for (let x = cx - hw + 1; x < cx + hw; x++) {   // a frieze of waves under the ledge
        const m = ((x - cx) % 6 + 6) % 6;
        if (m === 1 || m === 2) solid(x, y0 + 1, b[3]);
        if (m === 0 || m === 3) solid(x, y0 + 2, b[3]);
        if (m >= 3) solid(x, y0 + 3, b[3]);
      }
      const dw = Math.max(2, Math.round(sz * 0.06)), dh = Math.max(3, Math.min(th - 3, Math.round(th * 0.72)));
      for (let y = y1 - dh - 1; y <= y1; y++) for (let x = cx - dw - 1; x <= cx + dw + 1; x++) {
        if (inArch(x, y, cx, y1, dw, dh)) solid(x, y, y > y1 - 2 ? M().water[3] : mixC(b[4], M().water[4], 0.55));
        else if (inArch(x, y, cx, y1, dw + 1, dh + 1)) solid(x, y, x < cx ? b[0] : b[3]);
      }
      for (const s of [-1, 1]) for (let y = y1 - dh + 1; y < y1; y += 3) {
        const x = cx + s * (dw + 3);
        solid(x, y, S.rune[2]);
        life.runes.push({ x, y });
      }
    }
    if (i === 2) {
      for (let x = cx - hw - 2; x <= cx + hw + 2; x++) { solid(x, y0 - 2, b[0]); solid(x, y0 - 1, b[3]); }
      const ch = Math.max(2, Math.round(sz * 0.07));
      for (let k = 0; k < ch; k++) for (let x = -Math.round((ch - k) * 0.6); x <= Math.round((ch - k) * 0.6); x++) solid(cx + x, y0 - 3 - k, x < 0 ? b[0] : b[2]);
      solid(cx, y0 - 3 - ch, M().gold[1]);
      const ey = y0 + Math.floor(th / 2);
      solid(cx, ey, S.rune[1]);
      life.runes.push({ x: cx, y: ey });
    }
    y1 = y0 - 1;
  });
  if (sz >= 40) for (const s of [-1, 1]) statue(cx + s * (half(top0) + Math.round(sz * 0.1)), top0 - 1, KOI_STATUE);
}

const KOI_STATUE = [   // a leaping fish carved on a plinth, guarding the Flooded Steps' stair
  '...oo....',
  '..oLso...',
  '.oLssSo..',
  'oLsoLsSo.',
  'oLssssSoo',
  '.oLsssSSo',
  '..oLsSSo.',
  '.ooooooo.',
  '.oLssSSo.',
  '.ooooooo.',
];

/** The Drowned Halls' far wall: arches into a gloomier hall, daylight through its far doors, its top crumbling. */
function drownedHalls() {
  const cx = Math.round(W / 2), b = M().block, wh = Math.round(horizon * 0.46), y0 = horizon - wh;
  const n = W > 200 ? 5 : 3, aw = Math.max(2, Math.round(W * 0.035)), ah = Math.round(wh * 0.72), gap = (W * 0.6) / n;
  const arches = Array.from({ length: n }, (_, i) => Math.round(cx + (i - (n - 1) / 2) * gap));
  masonry(-1, W, y0, horizon - 1, { course: 3, len: 8, moss: 0.25, seed: 11, shade: (x) => (Math.abs(x + 0.5 - cx) / cx) ** 2 * 0.8, skip: (x, y) => arches.some(a => inArch(x, y, a, horizon - 1, aw + 1, ah + 1)) });
  for (let x = 0; x < W; x++) { const e = Math.round(noise(x >> 2, 4, 82) * 3); for (let k = 1; k <= e; k++) solid(x, y0 - k, b[k === e ? 0 : 1]); }
  for (const a of arches) for (let y = horizon - ah - 2; y < horizon; y++) for (let x = a - aw - 1; x <= a + aw + 1; x++) {
    if (inArch(x, y, a, horizon - 1, aw, ah)) {
      const far = inArch(x, y, a, horizon - 1, Math.max(1, aw - 2), Math.round(ah * 0.55));
      solid(x, y, far ? S.far[0] : mixC(S.jungle[3], M().water[4], 0.35 + 0.35 * ((x - a + aw) / (2 * aw + 1))));
    } else if (inArch(x, y, a, horizon - 1, aw + 1, ah + 1)) solid(x, y, x < a ? b[0] : b[3]);
  }
  life.hall = { cx, ye: horizon - Math.round(wh * 0.3), top0: y0 - 3 };
}

/** The Sunken Court's far wall, broken along its top, with a gateway open to the sky and an obelisk leaning over it. */
function sunkenCourt() {
  const cx = Math.round(W / 2), wh = Math.max(4, Math.round(horizon * 0.2)), y0 = horizon - wh;
  const dip = (x) => (noise(x >> 4, 2, 85) < 0.3 ? Math.round(wh * (0.3 + noise(x >> 2, 3, 86) * 0.4)) : Math.round(noise(x >> 1, 4, 87) * 1.6));
  masonry(-1, W, y0, horizon - 1, { course: 3, len: 7, moss: 0.3, seed: 21, skip: (x, y) => y < y0 + dip(x) });
  const flip = ((S.raw.seed || 0) & 1) === 1;
  obelisk(Math.round(W * (flip ? 0.2 : 0.8)), horizon - 1, Math.round(horizon * 0.62), flip ? 1 : -1);
  gateway(cx, horizon - 1, Math.round(horizon * 0.6), Math.max(3, Math.round(W * 0.06)));
  life.court = { flip };
}

function gateway(cx, foot, h, aw) {
  const b = M().block, pw = Math.max(3, Math.round(aw * 0.9)), hw = aw + pw, ah = Math.round(h * 0.7);
  masonry(cx - hw, cx + hw, foot - h, foot, { course: 3, len: 6, moss: 0.2, seed: 22, shade: (x) => Math.max(0, (x - cx) / hw - 0.3), skip: (x, y) => inArch(x, y, cx, foot, aw, ah) || (x > cx + hw - 3 && y < foot - h + 3 + (cx + hw - x)) });
  for (let y = foot - ah - 2; y <= foot; y++) for (let x = cx - aw - 1; x <= cx + aw + 1; x++) {
    if (!inArch(x, y, cx, foot, aw, ah) && inArch(x, y, cx, foot, aw + 1, ah + 1)) solid(x, y, x < cx ? b[0] : b[3]);
  }
  for (let x = cx - hw - 1; x <= cx + hw - 3; x++) { solid(x, foot - h - 1, b[0]); solid(x, foot - h, b[3]); }
  const ky = foot - ah - 3;
  solid(cx, ky, S.rune[1]);
  life.runes.push({ x: cx, y: ky });
}

/** A tapering obelisk, leaning, its gold tip catching the light, glyphs down its face. */
function obelisk(cx, foot, h, lean) {
  const b = M().block, g = M().gold, hb = Math.max(2, Math.round(h * 0.08)), tip = Math.max(2, Math.round(hb * 1.2));
  for (let k = 0; k <= h; k++) {
    const y = foot - k, x0 = cx + lean * k * 0.14, f = k / h;
    const half = k > h - tip ? Math.round(hb * 0.6 * (h - k) / tip) : Math.round(hb + (hb * 0.6 - hb) * f);
    for (let x = -half; x <= half; x++) {
      const gold = k > h - tip, u = (x + half + 0.5) / (2 * half + 1);
      let c = gold ? (u < 0.5 ? g[0] : g[2]) : u < 0.3 ? b[0] : u < 0.75 ? b[1] : b[3];
      if (!gold && x === 0 && k % 4 === 1 && k > 2) c = b[3];
      if (!gold && k < h * 0.3 && noise(x + cx, y >> 1, 88) < 0.35) c = M().moss[1];
      solid(x0 + x, y, c);
    }
    if (k === Math.round(h * 0.55) || k === Math.round(h * 0.75)) { solid(x0, y, S.rune[2]); life.runes.push({ x: Math.round(x0), y }); }
  }
}

/** The Tide Altar's ring of pillars round the pool, two still joined by their lintels, runes cut into them. */
function altarRing() {
  const b = M().block, hw = Math.max(1, Math.round(W * 0.014)), tall = Math.round(horizon * 0.8), tops = {};
  [0.06, 0.2, 0.33, 0.67, 0.8, 0.94].forEach((at, i) => {
    const x = Math.round(W * at), broken = i === 0 || i === 5 || noise(i, 9, 89) < 0.25;
    const top = horizon - 1 - Math.round(tall * (broken ? 0.4 + noise(i, 2, 89) * 0.3 : 0.85 + Math.abs(0.5 - at) * 0.3));
    pillar(x, horizon - 1, top, hw, { broken, seed: i * 3 });
    if (!broken) { tops[i] = top; const ry = Math.round((horizon + top) / 2); solid(x, ry, S.rune[2]); life.runes.push({ x, y: ry }); }
  });
  for (const [l, r] of [[1, 2], [3, 4]]) {
    if (tops[l] == null || tops[r] == null) continue;
    const y = Math.min(tops[l], tops[r]) - 1, xa = Math.round(W * [0.2, 0.33, 0.67, 0.8][[1, 2, 3, 4].indexOf(l)]) - hw - 2;
    const xb = Math.round(W * [0.2, 0.33, 0.67, 0.8][[1, 2, 3, 4].indexOf(r)]) + hw + 2;
    for (let x = xa; x <= xb; x++) { solid(x, y - 2, b[0]); solid(x, y - 1, b[1]); solid(x, y, b[4]); }
  }
}

/* ----- the water ----- */

/** The lagoon: the backdrop mirrored in it, its own colour deepening towards you, the old paving under it in the Halls
    and the Court, streaks of light on it, foam where it laps at the shore; the Steps' stair runs on down under it. */
function ruinsFloor() {
  const st = stage(), w = M().water, b = M().block, cx = W / 2;
  const wet = life.wet = new Uint8Array(W * H);
  life.fresh = new Uint8Array(W * H);
  for (let y = horizon; y < H; y++) {
    const d = depthOf(y), sy = Math.max(0, 2 * horizon - 1 - y), a = y - horizon + 1;
    const own = st === 3 ? mixC(w[3], w[4], Math.min(1, d * 0.8)) : mixC(w[1], w[3], Math.min(1, 0.15 + d * 1.1));
    const k = Math.min(0.9, (st === 3 ? 0.55 : 0.4) + d * 0.4);
    const z = 30 / a, row = Math.floor(z), joinRow = a >= 8 && row !== Math.floor(30 / (a + 1));
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let c = mixC(px[sy * W + x], own, k);
      if ((st === 1 || st === 2) && a >= 6) {
        const X = ((x + 0.5 - cx) / a) * 3 + (row & 1) * 0.5, X1 = ((x + 1.5 - cx) / a) * 3 + (row & 1) * 0.5;
        if (joinRow || Math.floor(X) !== Math.floor(X1)) c = mixC(c, w[4], 0.16 + d * 0.1);
      }
      if (noise(x >> 3, y, 76) > 0.84 && d < 0.6) c = mixC(c, w[0], 0.22 * (1 - d));
      px[i] = c; sky[i] = 0; wet[i] = 1;
    }
  }
  for (let x = 0; x < W; x++) if (dither(x, horizon) < 6) px[horizon * W + x] = mixC(px[horizon * W + x], w[0], 0.55);
  if (st === 0 && life.stair) {
    const { cx: sx, half, grow, bottom } = life.stair;
    for (let y = horizon; y < Math.min(H, horizon + bottom); y++) {
      const hf = Math.round(half + grow * (y - horizon)), f = (y - horizon) / bottom, tread = (y - horizon) % 2 === 1;
      for (let x = -hf - 1; x <= hf + 1; x++) {
        if (sx + x < 0 || sx + x >= W) continue;
        const i = y * W + sx + x;
        px[i] = mixC(Math.abs(x) > hf ? b[4] : tread ? b[1] : b[3], px[i], 0.4 + f * 0.55);
      }
    }
  }
}

/* ----- what stands in the water ----- */

function ruinsFront() {
  const st = stage();
  if (st === 0) {   // stumps of the old causeway in the near corners
    for (const s of [-1, 1]) {
      const foot = horizon + Math.round((H - horizon) * (s < 0 ? 0.42 : 0.3)), x = s < 0 ? Math.round(W * 0.03) : Math.round(W * 0.97), hw = Math.max(2, Math.round(W * 0.022));
      const top = foot - Math.round((H - horizon) * 0.3);
      pillar(x, foot, top, hw, { paint: dry, broken: true, seed: 7 + s });
      reflect(x - hw * 2, x + hw * 2, top, foot);
    }
  }
  if (st === 1) { colonnade(); lightShafts(S.stars ? 0.4 : 1); }
  if (st === 2) courtFront();
  if (st === 3) { tideAltar(); altarFront(); }
  lilies(st);
  hangingVines(st);
  life.fresh.fill(0);
  life.preMark = Uint32Array.from(px);
}

/** The Drowned Halls' colonnade: two rows of columns from the far wall out past you, in perspective, their lintels
    running along the tops (gone where a column has fallen), one beam across the hall snapped in the middle. */
function colonnade() {
  const { cx, ye, top0 } = life.hall, xs = W * 0.17, b = M().block;
  const qs = [1, 1.4, 2, 2.9, 4.3], stand = {};
  const topAt = (q) => Math.round(ye - (ye - top0) * q);
  for (const q of qs) for (const s of [-1, 1]) {
    const foot = Math.round(ye + (horizon + 1 - ye) * q), top = topAt(q), hw = Math.max(1, Math.round(1.25 * q)), x = Math.round(cx + s * xs * q);
    if (x + hw * 2 < 0 || x - hw * 2 >= W) continue;
    const broken = q > 1 && noise(q * 7, s + 2, 83) < 0.3;
    stand[`${q}${s}`] = !broken;
    const t = broken ? Math.round(top + (foot - top) * (0.3 + noise(q, s + 5, 84) * 0.4)) : top;
    pillar(x, foot, t, hw, { paint: dry, broken, seed: Math.round(q * 10) + s });
    reflect(x - hw * 2 - 1, x + hw * 2 + 1, t, foot);
  }
  const beam = (x, q) => {
    const base = topAt(q) - 1, th = Math.max(2, Math.round(q * 1.4));
    for (let y = base - th; y <= base; y++) solid(x, y, y === base ? b[4] : y === base - th ? b[0] : Math.floor(q * 4) !== Math.floor((q + 1 / xs) * 4) ? b[3] : b[1]);
    return base;
  };
  for (const s of [-1, 1]) for (let k = 0; k + 1 < qs.length; k++) {
    if (!stand[`${qs[k]}${s}`] || !stand[`${qs[k + 1]}${s}`]) continue;
    const xa = cx + s * xs * qs[k], xb = cx + s * xs * qs[k + 1];
    for (let x = Math.round(Math.min(xa, xb)); x <= Math.max(xa, xb); x++) {
      const base = beam(x, Math.abs(x + 0.5 - cx) / xs);
      if (noise(x, s, 90) < 0.06) life.ruVines.push({ x, y: base + 1, len: 3 + Math.round(noise(x, 2, 90) * horizon * 0.3), phase: noise(x, 3, 90) * 40 });
    }
  }
  if (stand['2-1'] && stand['21']) {
    const q = 2, gapL = cx - W * 0.05, gapR = cx + W * 0.03;
    for (let x = Math.round(cx - xs * q); x <= cx + xs * q; x++) {
      const jag = Math.round(noise(x, 7, 91) * 3);
      if (x > gapL - jag && x < gapR + jag) continue;
      const base = topAt(q) - 1, th = Math.max(2, Math.round(q * 1.2));
      for (let y = base - th; y <= base; y++) solid(x, y, y === base ? b[4] : y === base - th ? b[0] : (x % 9 === 0 ? b[3] : b[2]));
      if (noise(x, 8, 91) < 0.08) life.ruVines.push({ x, y: base + 1, len: 3 + Math.round(noise(x, 9, 91) * horizon * 0.4), phase: noise(x, 10, 91) * 40 });
    }
  }
}

/** The Sunken Court: the colossal head at one side, the fountain before the gateway. */
function courtFront() {
  const flip = life.court?.flip;
  const size = Math.round(Math.min(horizon * 0.72, W * 0.42)), foot = horizon + Math.round((H - horizon) * 0.16);
  const hx = Math.round(W * (flip ? 0.86 : 0.14));
  colossalHead(hx, foot, size, flip);
  reflect(hx - size, hx + size, foot - size * 2, foot);
  const fx = Math.round(W / 2), ff = horizon + Math.max(2, Math.round((H - horizon) * 0.04)), fs = Math.max(8, Math.round(Math.min(W * 0.14, horizon * 0.34)));
  fountain(fx, ff, fs);
  reflect(fx - fs, fx + fs, ff - fs * 2, ff);
}

/** A stone face as big as a house, sunk to its chin: a crested headdress carved with waves, heavy closed eyes, a broad
    nose, ear spools, moss over its crown and cracks across it. */
function colossalHead(cx, foot, size, flip) {
  const b = M().block, mo = M().moss, rx = size * 0.42, ry = size * 0.52, cy = foot - ry * 0.55;
  const top = Math.floor(cy - ry - size * 0.3);
  for (let y = top; y <= foot; y++) for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
    const u = ((x + 0.5 - cx) / rx) * (flip ? -1 : 1), v = (y + 0.5 - cy) / ry;
    const head = u * u + v * v <= 1;
    const crest = v < -0.7 && Math.abs(u) < 0.28 * Math.max(0, (v + 1.6) / 0.9);
    const ear = Math.abs(Math.abs(u) - 1.02) < 0.12 && v > -0.3 && v < 0.25;
    if (!head && !crest && !ear) {
      if (u * u + v * v <= 1.08 || (v < -0.68 && Math.abs(u) < 0.32 * Math.max(0, (v + 1.66) / 0.9))) dry(x, y, b[4]);
      continue;
    }
    const lit = -u * 0.55 - v * 0.6 + (noise(x >> 1, y >> 1, 92) - 0.5) * 0.4;
    let c = lit > 0.45 ? b[0] : lit > -0.05 ? b[1] : lit > -0.5 ? b[2] : b[3];
    if (ear) c = Math.abs(Math.abs(u) - 1.02) < 0.05 ? b[3] : b[1];
    if (v > -0.62 && v < -0.42) c = ((Math.floor((u + 2) * 9)) % 3 === 0) ? b[3] : (v < -0.55 ? b[0] : b[2]);   // the headdress's band of waves
    if (Math.abs(v + 0.12 - 0.12 * (Math.abs(Math.abs(u) - 0.38) / 0.2) ** 2) < 0.05 && Math.abs(Math.abs(u) - 0.38) < 0.2) c = b[4];   // closed eyes
    if (Math.abs(v + 0.24) < 0.04 && Math.abs(Math.abs(u) - 0.38) < 0.22) c = b[0];   // the brow over them
    if (Math.abs(u) < 0.09 && v > -0.12 && v < 0.3) c = u < 0 ? b[0] : b[3];   // the nose
    if (Math.abs(u) < 0.14 && Math.abs(v - 0.33) < 0.04) c = b[4];
    if (Math.abs(u) < 0.26 && Math.abs(v - 0.55) < 0.035) c = b[4];   // the mouth, at the water
    if (crest) c = Math.abs(u) < 0.06 ? M().gold[1] : u < 0 ? b[0] : b[2];
    if ((v < -0.55 || crest) && noise(x >> 1, y >> 1, 93) < 0.45) c = mo[noise(x, y, 94) < 0.5 ? 0 : 1];
    if (noise(Math.round(x / 3 + v * 4), y >> 1, 95) > 0.93) c = b[4];   // cracks
    dry(x, y, c);
  }
}

/** A two-tiered fountain, water spilling from its top bowl into the lower one and from that into the lagoon. */
function fountain(cx, foot, s) {
  const b = M().block, g = M().gold;
  const bowl = (cy, rx) => {
    const ry = Math.max(1, Math.round(rx * 0.3));
    for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt(Math.max(0, 1 - (x / (rx + 0.5)) ** 2)), back = Math.round(cy - ry * e), front = Math.round(cy + ry * e);
      for (let y = back; y <= front; y++) dry(cx + x, y, y === back ? b[0] : y < front - 1 ? M().water[1] : b[1]);
      for (let k = 1; k <= 2; k++) dry(cx + x, front + k, k === 2 ? b[4] : x > rx * 0.4 ? b[3] : b[2]);
    }
    return ry;
  };
  const r1 = Math.round(s * 0.55), r2 = Math.round(s * 0.28), y1 = foot - 3, y2 = foot - Math.round(s * 0.9);
  for (let y = y2; y <= y1; y++) for (let x = -1; x <= 1; x++) dry(cx + x, y, x < 0 ? b[0] : x > 0 ? b[3] : b[1]);
  const ry1 = bowl(y1, r1);
  bowl(y2, r2);
  dry(cx, y2 - 2, g[1]); dry(cx, y2 - 3, g[0]);
  for (const sgn of [-1, 1]) {
    const xa = cx + sgn * (r2 + 1), xb = cx + sgn * (r1 + 1);
    fall(xa, xa, y2 + 1, y1 - 1);
    fall(xb, xb, y1 + ry1 + 1, foot + 1);
    for (const f of life.falls.slice(-2)) for (let y = f.top; y <= f.foot; y++) for (let x = f.x0; x <= f.x1; x++) { life.wet[y * W + x] = 0; life.fresh[y * W + x] = 1; }
  }
}

/** The Tide Altar: a round stepped altar in the pool, the tide wheel standing on it, a spiral wave cut in its face and a
    sea-blue gem at its heart; its runes are drawn live (drawRuins), lit one by one as its boss wakes. */
function tideAltar() {
  const cx = Math.round(W / 2), b = M().block, foot = horizon + Math.max(2, Math.round((H - horizon) * 0.07));
  const Ra = Math.round(Math.min(W * 0.26, horizon * 0.62));
  let y = foot, top = foot;
  for (let i = 0; i < 3; i++) {
    const rx = Math.round(Ra * (1 - i * 0.24)), ry = Math.max(1, Math.round(rx * 0.15)), th = Math.max(2, Math.round(Ra * 0.08));
    const yc = y - th - ry;
    for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt(Math.max(0, 1 - (x / (rx + 0.5)) ** 2)), back = Math.round(yc - ry * e), front = Math.round(yc + ry * e);
      for (let yy = back; yy <= front; yy++) dry(cx + x, yy, yy === back ? b[0] : dither(cx + x, yy) < 2 ? M().moss[1] : b[1]);
      for (let k = 1; k <= th; k++) dry(cx + x, front + k, k === th ? b[4] : (x + rx) % 6 === 0 ? b[4] : x > rx * 0.45 ? b[3] : k === 1 ? b[0] : b[2]);
    }
    top = yc;
    y = yc + Math.round(ry * 0.3);
  }
  const R = Math.max(5, Math.round(Math.min(horizon * 0.36, W * 0.16, (top - 3) / 2))), wcx = cx, wcy = top - R;
  for (const s of [-1, 1]) for (let yy = wcy + Math.round(R * 0.4); yy <= top; yy++) { dry(wcx + s * Math.round(R * 0.75), yy, b[3]); dry(wcx + s * Math.round(R * 0.75) + 1, yy, b[4]); }
  for (let yy = wcy - R - 1; yy <= wcy + R + 1; yy++) for (let x = wcx - R - 1; x <= wcx + R + 1; x++) {
    const dx = x + 0.5 - wcx, dy = yy + 0.5 - wcy, r = Math.hypot(dx, dy) / R, a = Math.atan2(dy, dx);
    if (r > 1) { if (r < 1 + 1.3 / R) dry(x, yy, b[4]); continue; }
    const lit = -(dx + dy) / R;
    let c;
    if (r > 0.78) c = r > 0.94 ? (lit > 0 ? b[0] : b[3]) : lit > 0.3 ? b[1] : b[2];
    else if (r > 0.72) c = b[4];
    else if (r < 0.17) c = r < 0.09 ? S.rune[0] : r < 0.13 ? S.rune[1] : S.rune[2];
    else {
      const s = (((a / (Math.PI * 2)) * 3 - r * 3.2) % 1 + 1) % 1;
      c = s < 0.16 ? b[3] : s < 0.24 ? b[0] : lit > 0.2 ? b[1] : b[2];
    }
    dry(x, yy, c);
  }
  reflect(cx - Ra - 2, cx + Ra + 2, wcy - R - 2, foot);
  life.altar = { cx, foot, wcx, wcy, R, Ra };
}

/** Two great columns, both broken, framing the pool in the near corners. */
function altarFront() {
  for (const s of [-1, 1]) {
    const foot = horizon + Math.round((H - horizon) * (s < 0 ? 0.36 : 0.28)), x = s < 0 ? Math.round(W * 0.04) : Math.round(W * 0.96), hw = Math.max(2, Math.round(W * 0.028));
    const top = foot - Math.round(horizon * (s < 0 ? 0.9 : 1.15));
    pillar(x, foot, top, hw, { paint: dry, broken: s < 0, seed: 11 + s });
    reflect(x - hw * 2, x + hw * 2, top, foot);
  }
}

/** Lily pads over the water (crowding the Court, a few elsewhere, none on the deep pool), some in flower; the middle,
    where the Pokémon stand, kept clear. */
function lilies(st) {
  const n = Math.round(((W * (H - horizon)) / 900) * [0.5, 0.25, 1.6, 0][st]);
  for (let k = 0; k < n; k++) {
    const y = horizon + 2 + Math.floor(rand() ** 0.8 * (H - horizon - 3)), d = depthOf(y);
    let x = Math.floor(rand() * W);
    if (d > 0.15 && Math.abs(x - W / 2) < W * 0.22) x += x < W / 2 ? -W * 0.25 : W * 0.25;
    ruinLily(Math.round(x), y, 1 + Math.round(d * 4 + rand()), rand() < 0.25);
  }
}

function ruinLily(cx, cy, r, bloom) {
  const [lit, body, dark] = M().lily, ry = Math.max(1, r * 0.45);
  for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) for (let x = -r; x <= r; x++) {
    const xx = cx + x, yy = cy + y;
    if (!inside(xx, yy) || !life.wet[yy * W + xx] || (x / (r + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2 > 1) continue;
    const a = Math.atan2(y / ry, x / r);
    if (r > 1 && a > -0.5 && a < 0.1) continue;   // the notch
    dry(xx, yy, y === Math.ceil(ry) ? dark : x + y < -r * 0.4 ? lit : body);
  }
  if (bloom) { const [w, p, d] = M().lotus; dry(cx, cy - 1, p); dry(cx - 1, cy - 1, d); dry(cx + 1, cy - 1, d); dry(cx, cy - 2, w); }
}

/** Vines hanging into the picture from the canopy overhead, drawn live so they sway (drawRuins). */
function hangingVines(st) {
  if (st !== 1 && st !== 2) return;
  for (let n = 0, count = Math.max(3, Math.round(W / 28)); n < count; n++) {
    const edge = n % 2 ? rand() * W * 0.22 : W - rand() * W * 0.22;
    life.ruVines.push({ x: Math.round(edge), y: 0, len: Math.round(horizon * (0.2 + rand() * 0.5)), phase: rand() * 40 });
  }
}

/** After the landmark: it's mirrored too, then the water is set as it stands (the ripple's still frame). */
function ruinsSettle() {
  const { wet, fresh, preMark } = life;
  for (let i = 0; i < W * H; i++) if (px[i] !== preMark[i]) { wet[i] = 0; fresh[i] = 1; }
  const k = life.landmark && life.keep?.at(-1);
  if (k) reflect(k.x0, k.x1, k.y0, k.y1 - 2);
  fresh.fill(0);
  life.snap = Uint32Array.from(px);
  const list = [];
  for (let i = horizon * W; i < W * H; i++) if (wet[i]) list.push(i);
  life.wetList = Int32Array.from(list);
  life.preMark = null;
}

/* ----- its life ----- */

function makeRuinsLife() {
  if (!life.snap) return;
  life.wetList = life.wetList.filter(i => base[i] === life.snap[i]);   // an event's props stand where the water was
  const list = life.wetList, st = stage();
  life.ruGlints = Array.from({ length: Math.round(list.length / 260) }, () => ({ i: list[Math.floor(rand() * list.length)], phase: rand() * 60 }));
  life.rings = [];
  life.fish = null; life.nextFish = tick + FPS * (3 + rand() * 6);
  if (st <= 1) life.motes = Array.from({ length: Math.round(W / 7) }, () => ({ x: rand() * W, y: rand() * H, vx: 0.04 + rand() * 0.08, vy: -0.03 - rand() * 0.05, phase: rand() * 20 }));
}

/** The water moves: each wet pixel takes its row's neighbour a pixel or two along (under a storm the rain does instead). */
function rippleRuins(t) {
  const L = life;
  if (!L.wetList || storm.level > 0) return;
  const list = L.wetList, snap = L.snap, wet = L.wet;
  for (let n = 0; n < list.length; n++) {
    const i = list[n], y = (i / W) | 0, x = i - y * W, d = (y - horizon) / (H - horizon);
    const off = Math.round(Math.sin(y * 0.9 - t * 0.7 + (x >> 3) * 1.7) * (0.45 + d * 1.5));
    px[i] = off && x + off >= 0 && x + off < W && wet[i + off] ? snap[i + off] : snap[i];
  }
}

function drawRuins(t) {
  const L = life, w = M().water, st = stage(), r = S.rune;
  if (L.ruGlints) for (const g of L.ruGlints) {
    const s = Math.sin((t + g.phase) / 4);
    if (s < 0.8) continue;
    const y = (g.i / W) | 0, x = g.i - y * W;
    put(x, y, w[0]);
    if (s > 0.95) { put(x - 1, y, w[1]); put(x + 1, y, w[1]); }
  }
  // rings spreading where something stirs the water
  if (L.wetList?.length && everyAt(FPS * 0.8)) {
    const i = L.wetList[Math.floor(rand() * L.wetList.length)];
    L.rings.push({ x: i % W, y: (i / W) | 0, at: tick });
  }
  if (st === 3 && L.altar && everyAt(FPS * (bossPrelude?.phase === 'awake' ? 0.9 : 1.8))) L.rings.push({ x: L.altar.cx, y: L.altar.foot + 1, at: tick, big: true });
  L.rings = L.rings.filter(g => tick - g.at < (g.big ? 26 : 11));
  for (const g of L.rings) {
    const age = tick - g.at, d = depthOf(g.y), rx = age * (g.big ? 1.6 : 0.5 + d * 1.6), ry = Math.max(0.6, rx * (g.big ? 0.26 : 0.32)), fade = (g.big ? 13 : 12) - age * (g.big ? 0.5 : 1);
    for (let a = 0; a < Math.PI * 2; a += 0.9 / Math.max(2, rx)) {
      const x = g.x + Math.cos(a) * rx, y = g.y + Math.sin(a) * ry, xi = x | 0, yi = y | 0;
      if (inside(xi, yi) && L.wet[yi * W + xi] && dither(xi, yi) < fade) put(x, y, w[1]);
    }
  }
  // a fish leaps
  if (!L.fish && tick >= L.nextFish && L.wetList?.length) {
    const i = L.wetList[Math.floor(rand() * L.wetList.length)], y = (i / W) | 0;
    if (depthOf(y) < 0.55) { L.fish = { x: i % W, y, at: tick, dir: rand() < 0.5 ? -1 : 1 }; L.rings.push({ x: i % W, y, at: tick }); }
    L.nextFish = tick + FPS * (5 + rand() * 8);
  }
  if (L.fish) {
    const f = L.fish, a = (tick - f.at) / 7;
    if (a > 1) { L.rings.push({ x: Math.round(f.x + f.dir * 6), y: f.y, at: tick }); L.fish = null; }
    else {
      const x = f.x + f.dir * a * 6, y = f.y - Math.sin(a * Math.PI) * 5, tilt = a < 0.5 ? 1 : -1;
      put(x, y, M().red[0]); put(x - f.dir, y + tilt, M().red[1]); put(x + f.dir, y - tilt, M().red[0]);
      if (a < 0.2) put(f.x, f.y - 1, w[0]);
    }
  }
  for (const f of L.falls || []) {   // the falls run, and foam where they land
    for (let y = f.top; y <= f.foot; y++) for (let x = f.x0; x <= f.x1; x++) {
      const p = ((y - Math.floor(t * 2.5) + x * 3) % 6 + 6) % 6;
      put(x, y, p < 1 ? w[0] : p < 4 ? w[1] : w[2]);
    }
    for (let x = f.x0 - 2; x <= f.x1 + 2; x++) for (let y = f.foot - 1; y <= f.foot + 1; y++) if (dither(x, y + Math.floor(t)) < 7) put(x, y, w[0]);
  }
  if (L.ruVines) {
    const [lit, body, dark] = M().vine;
    for (const v of L.ruVines) for (let k = 0; k < v.len; k++) {
      const x = v.x + Math.round(Math.sin(t / 7 + v.phase + k * 0.12) * (k / v.len) * 1.6);
      put(x, v.y + k, k === v.len - 1 ? lit : k % 4 === 0 ? dark : body);
      if (k % 4 === 2) put(x + (k % 8 === 2 ? 1 : -1), v.y + k, lit);
    }
  }
  const night = S.stars ? 1 : 0, boss = !!bossPrelude;
  for (const p of L.runes || []) {   // the runes breathe, brighter in the dark
    const s = Math.sin(t / 5 + p.x * 0.7 + p.y);
    put(p.x, p.y, s > 0.7 - night * 0.6 ? r[0] : r[1]);
    if (night || boss) { if (s > 0) { put(p.x - 1, p.y, r[2]); put(p.x + 1, p.y, r[2]); } }
  }
  if (st === 3 && L.altar) {
    const awake = bossPrelude?.phase === 'awake';
    if (awake) whirl(L.altar.cx, L.altar.foot + 2, 0.32, t);
    if (!bossPrelude || awake) wheelRunes(t, awake ? 12 : night ? 12 : 0, awake ? t * 0.04 : 0);
  }
}

/** The tide wheel's twelve runes round its rim, `lit` of them alight, the wheel turned by `spin`. */
function wheelRunes(t, lit, spin) {
  const { wcx, wcy, R } = life.altar, r = S.rune, b = M().block;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2 + spin, x = Math.round(wcx + Math.cos(a) * R * 0.86 - 0.5), y = Math.round(wcy + Math.sin(a) * R * 0.86 - 0.5);
    if (k >= lit) { put(x, y, b[4]); continue; }
    const s = Math.sin(t / 3 + k);
    put(x, y, s > 0.3 ? r[0] : r[1]);
    if (R > 9) { put(x + 1, y, r[1]); put(x, y + 1, r[2]); }
  }
}

/** A whirlpool turning round (cx, cy): spiral arms of foam about a dark eye; `k` how far it reaches and how fast. */
function whirl(cx, cy, k, t) {
  const w = M().water, reach = W * 0.5 * k, er = Math.max(1, reach * 0.16), ery = Math.max(1, er * 0.32);
  for (let y = Math.floor(cy - ery); y <= cy + ery; y++) for (let x = Math.floor(cx - er); x <= cx + er; x++) {
    const d = ((x - cx) / er) ** 2 + ((y - cy) / ery) ** 2;
    if (d <= 1 && y > horizon) put(x, y, d < 0.45 ? w[4] : w[3]);
  }
  for (let arm = 0; arm < 4; arm++) for (let s = 0.14; s <= 1; s += 0.7 / Math.max(8, reach)) {
    const r = s * reach, ang = (arm * Math.PI) / 2 + s * 5.5 - t * (0.22 + k * 0.5);
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.3;
    if (y <= horizon) continue;
    put(x, y, s < 0.5 ? w[0] : w[1]);
    if (s < 0.7) put(x + 1, y, w[1]);
  }
}

/* ----- the Tide Altar's boss prelude: the tide draws back, the wheel's runes light round its rim and it starts to turn,
   the pool spins into a whirlpool round the altar, then the sea bursts up through it in a column of water. The portal
   is a great wave rising over the screen into the white. ----- */

const TIDE_AT = 20;   // frames into the wake (8 fps) when the water bursts up; the `wave-crash` sound is timed to it

function ruinsWake(t) {
  const a = life.altar;
  if (!a || bossPrelude.phase === 'awake') return 0;
  const age = preludeAge(t);
  veil(abgr('#041820'), Math.min(0.32, age * 0.025));
  const k = Math.min(1, Math.max(0, (age - 5) / 12));
  if (k > 0) whirl(a.cx, a.foot + 2, k, t);
  wheelRunes(t, Math.min(12, Math.floor(Math.max(0, age - 1) * 0.85)), Math.max(0, age - 8) ** 1.4 * 0.02);
  if (age >= TIDE_AT) geyser(a, age - TIDE_AT);
  return age >= TIDE_AT ? (age < TIDE_AT + 6 ? 2 : 1) : age > 3 ? 1 : 0;
}

/** The sea bursting up through the altar: a column of water climbing out of sight, spray falling off its head. */
function geyser({ wcx, foot }, b) {
  const w = M().water, h = Math.min(foot + 4, b * foot * 0.35), half = Math.min(W * 0.1, 2 + b * 1.2), head = Math.round(foot - h);
  for (let y = Math.max(0, head); y <= foot; y++) {
    const wob = Math.sin(y * 0.5 + b * 3) * 1.2;
    for (let x = Math.floor(wcx - half + wob); x <= wcx + half + wob; x++) {
      const e = Math.abs(x - wcx - wob) / half;
      put(x, y, e > 0.8 ? w[2] : (y + Math.floor(b * 8)) % 4 < 2 && e < 0.5 ? w[0] : w[1]);
    }
  }
  for (let i = 0; i < 46; i++) {
    const vx = (noise(i, 90, 0) - 0.5) * 3.4, s = (b * 1.5 + noise(i, 90, 1) * 4) % 4;
    put(wcx + vx * s * 4, head + s * s * 2.5 - s * 3, i % 3 ? w[0] : w[1]);
  }
}

function ruinsPortal(t) {
  const age = preludeAge(t), frame = age | 0;
  if ((frame === 6 || frame === 8) && whiteOut()) return 0;
  const w = M().water, rise = Math.min(1.25, ((age + 1) / 6) ** 1.3);
  for (let x = 0; x < W; x++) {
    const crest = Math.round(H - rise * H * 1.05 + Math.sin(x * 0.18 + age * 1.5) * 3 + Math.sin(x * 0.05 - age) * 4);
    for (let y = Math.max(0, crest - 3); y < H; y++) {
      const dp = y - crest;
      if (dp < 0) { if (dither(x, y + frame) < 5) put(x, y, w[0]); continue; }
      put(x, y, dp < 2 ? w[0] : dp < 4 ? w[1] : ((x + y * 2 + frame * 3) >> 2) % 5 === 0 ? w[1] : dp < 14 ? w[2] : w[3]);
    }
  }
  return 2;
}

/* ----- the Ruins' landmarks, one per floor at an edge ----- */
const HAND = [
  '...o.o....',
  '..oLoLo.o.',
  '..oLoLooLo',
  '.ooLoLoLso',
  'oLoLsLsLSo',
  'oLsLssssSo',
  '.oLsssssSo',
  '.oLssssSSo',
  '..oLsssSo.',
  '..oLsssSo.',
  '..oLssSSo.',
];
LANDMARKS.ruins = [
  {
    mooring(cx, foot) {   // two old mooring posts, a rope slung between them
      const [lit, body, shade, line] = M().wood, [rope, ropeDark] = M().rope;
      for (const [x0, h] of [[cx - 4, 12], [cx + 3, 8]]) {
        for (let y = foot - h; y <= foot; y++) { solid(x0 - 1, y, line); solid(x0, y, lit); solid(x0 + 1, y, body); solid(x0 + 2, y, shade); solid(x0 + 3, y, line); }
        for (let x = x0 - 1; x <= x0 + 3; x++) solid(x, foot - h - 1, line);
      }
      for (let x = cx - 1; x <= cx + 2; x++) solid(x, foot - 10 + Math.round(Math.sin(((x - cx + 1) / 3) * Math.PI) * 2), rope);
      for (let y = foot - 6; y <= foot - 3; y++) { solid(cx - 4, y, y % 2 ? rope : ropeDark); solid(cx - 3, y, y % 2 ? ropeDark : rope); }
    },
    amphora(cx, foot) {   // a great jar tipped on its side, half sunk
      const [lit, body, shade, line] = M().clay;
      outlined(cx - 7, foot - 6, cx + 7, foot, (x, y) => {
        const u = (x + 0.5 - cx) / 6, v = (y + 0.5 - (foot - 2)) / 3.4;
        return y <= foot && (u * u + v * v <= 1 || (x > cx + 4 && x <= cx + 7 && Math.abs(y - (foot - 2)) <= 1));
      }, (x, y) => {
        if (x > cx + 5) return x === cx + 7 ? shade : body;
        if (y === foot - 3 && (x + cx) % 3 !== 0) return line;
        const u = (x - cx) / 6, v = (y - (foot - 2)) / 3.4;
        return u + v < -0.6 ? lit : u + v > 0.6 ? shade : body;
      }, line);
      for (const [x, y] of [[2, -5], [3, -6], [4, -6], [5, -5]]) solid(cx + x, foot + y, line);
    },
    guardian(cx, foot) {   // a fallen guardian's head, sunk to its chin
      mound(cx, foot, 7, 5, M().stone, (x, y, u, v) => {
        if (v < -0.55 && dither(x, y) < 9) return M().moss[(x + y) % 2];
        if (Math.abs(v + 0.05) < 0.16 && (Math.abs(u + 0.4) < 0.18 || Math.abs(u - 0.3) < 0.18)) return M().stone[3];
        if (Math.abs(u + 0.05) < 0.12 && v > 0.1 && v < 0.5) return M().stone[0];
        return null;
      });
    },
    lantern(cx, foot) {   // a spirit lantern, its window glowing the runes' colour
      const [lit, body, shade, line] = M().stone;
      const rows = ['...ooo...', '..oLLso..', '.oLLssSo.', 'ooooooooo', '.oLsssSo.', '.oLyyySo.', '.oLyyySo.', '.oLsssSo.', 'ooooooooo', '..oLsSo..', '..oLsSo..', '..oLsSo..', '.oLLssSo.'];
      pixelMap(cx - 4, foot - rows.length + 1, rows, { o: line, L: lit, s: body, S: shade, y: line });
      for (const [x, y] of [[0, 5], [1, 5], [2, 5], [1, 6]]) life.runes.push({ x: cx - 2 + x, y: foot - rows.length + 1 + y });
    },
  },
  {
    drum(cx, foot) {   // a column drum lying where it fell, its fluted end towards you
      const [lit, body, shade, line] = M().stone;
      outlined(cx, foot - 8, cx + 9, foot, (x, y) => x >= cx && x <= cx + 9 && y >= foot - 8 && y <= foot, (x, y) => ((y - foot) % 2 ? (y < foot - 5 ? lit : body) : shade), line);
      outlined(cx - 4, foot - 9, cx + 3, foot, (x, y) => ((x + 0.5 - cx) / 3.6) ** 2 + ((y + 0.5 - (foot - 4)) / 4.6) ** 2 <= 1, (x, y) => {
        const d = Math.hypot((x + 0.5 - cx) / 3.6, (y + 0.5 - (foot - 4)) / 4.6);
        return d > 0.8 ? lit : d > 0.45 ? body : d > 0.25 ? shade : lit;
      }, line);
    },
    brazier(cx, foot) {   // a bronze tripod bowl gone green with age
      const [lit, body, shade, line] = M().bronze, [pat, patDark] = M().patina;
      for (const dx of [-4, 0, 4]) for (let y = foot - 7; y <= foot; y++) solid(cx + dx + (dx ? Math.sign(dx) * Math.round((y - foot + 7) / 4) : 0), y, dx > 0 ? shade : body);
      for (let y = foot - 11; y <= foot - 7; y++) {
        const half = 6 - Math.round((y - (foot - 11)) * 0.8);
        for (let x = -half; x <= half; x++) solid(cx + x, y, y === foot - 11 ? lit : x === half || x === -half ? line : noise(cx + x, y, 96) < 0.35 ? (x < 0 ? pat : patDark) : x < 0 ? body : shade);
      }
    },
    stele(cx, foot) {   // an upright tablet, a wave cut into it in glowing runes
      const [lit, body, shade, line] = M().stone;
      outlined(cx - 3, foot - 13, cx + 3, foot, (x, y) => Math.abs(x + 0.5 - cx) <= 3.5 && y <= foot && (y >= foot - 10 || Math.hypot(x + 0.5 - cx, y - (foot - 10)) <= 3.5), (x) => (x < cx - 1 ? lit : x > cx + 1 ? shade : body), line);
      for (const [x, y] of [[-2, -8], [-1, -9], [0, -8], [1, -7], [2, -8], [-1, -5], [0, -4], [1, -5]]) { solid(cx + x, foot + y, S.rune[2]); life.runes.push({ x: cx + x, y: foot + y }); }
      for (let x = -3; x <= 3; x++) if (dither(cx + x, foot) < 9) solid(cx + x, foot - 1, M().moss[1]);
    },
    shell(cx, foot) {   // a great spiral shell washed up on a rock
      mound(cx, foot, 6, 3, M().stone, (x, y, u, v) => (v < -0.4 && dither(x, y) < 6 ? M().moss[1] : null));
      const [w, p, d] = M().lotus, rows = ['....oo..', '..oowpo.', '.owpppdo', 'owpdppdo', 'opppddo.', '.oddoo..', '..oo....'];
      pixelMap(cx - 4, foot - 12, rows, { o: M().stone[3], w, p, d });
    },
  },
  {
    lotus(cx, foot) {   // a lotus in full bloom over its pads
      for (const [dx, dy, r] of [[-4, 0, 4], [4, -1, 3], [0, 1, 3]]) ruinLily(cx + dx, foot + dy, r, false);
      const [w, p, d] = M().lotus, [g] = M().gold, rows = ['...p...', '..pwp..', '.dpwpd.', 'dppgppd', '.dpppd.', '..ddd..'];
      for (let y = foot - 6; y <= foot; y++) solid(cx, y, M().lily[2]);
      pixelMap(cx - 3, foot - 12, rows, { p, w, d, g });
    },
    bell(cx, foot) {   // a temple bell sunk to its waist, green with age
      const [lit, body, shade, line] = M().bronze, [pat] = M().patina;
      outlined(cx - 6, foot - 11, cx + 6, foot, (x, y) => {
        const v = (foot - y) / 11, half = 2 + 4 * Math.min(1, (1 - v) * 1.6);
        return y <= foot && v <= 1 && Math.abs(x + 0.5 - cx) <= half;
      }, (x, y) => (y === foot - 3 || y === foot - 6 ? line : noise(x, y, 97) < 0.3 ? pat : x < cx - 1 ? lit : x > cx + 2 ? shade : body), line);
      solid(cx, foot - 12, line); solid(cx - 1, foot - 13, line); solid(cx + 1, foot - 13, line); solid(cx, foot - 14, line);
    },
    hand(cx, foot) { statue(cx, foot, HAND); },   // a statue's hand reaching up out of the water
    spout(cx, foot) {   // a fish-headed spout on a post, still pouring into the lagoon
      const [lit, body, shade, line] = M().stone;
      for (let y = foot - 9; y <= foot; y++) { solid(cx - 2, y, line); solid(cx - 1, y, lit); solid(cx, y, body); solid(cx + 1, y, shade); solid(cx + 2, y, line); }
      pixelMap(cx - 3, foot - 15, ['..ooo...', '.oLsso..', 'oLsoLso.', 'oLsssSoo', '.oLsSSSo', '..ooooo.'], { o: line, L: lit, s: body, S: shade });
      fall(cx + 5, cx + 5, foot - 12, foot);
    },
  },
];

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

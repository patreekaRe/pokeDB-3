/* base-shapes.js  -  which Secret Base kinds are built as real 3D models (js/base-mesh.js) and how, as plain data, so the
   room's rules (js/secret-base.js: what stands on a table, where a Pokémon sits) can read it without Three.js. A kind's
   shape is `{ make, ...options }`, `make` one of js/base-mesh.js's builders. Two numbers matter outside the models:
   `seat`, the height (in tiles) a Pokémon sits at, and `top`, the height a table's top stands at, which small pieces can
   be put on. A kind with no line here is still 3D: js/base-mesh.js turns a round piece on a lathe or puffs its painting
   up like a plush, and carves the rest from its paintings (js/base-model.js). */

import { SHAPES as SHAPES_A } from './base-models-a.js';
import { SHAPES as SHAPES_B } from './base-models-b.js';
import { SHAPES as SHAPES_C } from './base-models-c.js';
import { SHAPES as SHAPES_D } from './base-models-d.js';
import { SHAPES as SHAPES_E } from './base-models-e.js';
import { SHAPES as SHAPES_F } from './base-models-f.js';
import { SHAPES as SHAPES_G } from './base-models-g.js';
import { SHAPES as SHAPES_H } from './base-models-h.js';
import { SHAPES as SHAPES_I } from './base-models-i.js';
import { SHAPES as SHAPES_J } from './base-models-j.js';
import { SHAPES as SHAPES_K } from './base-models-k.js';
import { SHAPES as SHAPES_W } from './base-models-w.js';
import { SHAPES as SHAPES_W2 } from './base-models-w2.js';
import { SHAPES as SHAPES_W3 } from './base-models-w3.js';
import { SHAPES as SHAPES_W4 } from './base-models-w4.js';
import { SHAPES as SHAPES_W5 } from './base-models-w5.js';
import { SHAPES as SHAPES_W6 } from './base-models-w6.js';
import { SHAPES as SHAPES_W7 } from './base-models-w7.js';
import { SHAPES as SHAPES_T } from './base-models-t.js';
import { SHAPES as SHAPES_Y } from './base-models-y.js';
import { SHAPES as SHAPES_FR } from './base-models-friends.js';
import { SHAPES as SHAPES_L } from './base-models-l.js';
import { SHAPES as SHAPES_M } from './base-models-m.js';
import { SHAPES as SHAPES_N } from './base-models-n.js';
import { SHAPES as SHAPES_O } from './base-models-o.js';
import { SHAPES as SHAPES_P } from './base-models-p.js';
import { SHAPES as SHAPES_Q } from './base-models-q.js';
import { SHAPES as SHAPES_R } from './base-models-r.js';
import { SHAPES as SHAPES_S } from './base-models-s.js';
import { SHAPES as SHAPES_U } from './base-models-u.js';
import { SHAPES as SHAPES_V } from './base-models-v.js';
import { SHAPES as SHAPES_X } from './base-models-x.js';
import { SHAPES as SHAPES_Z } from './base-models-z.js';
import { SHAPES as SHAPES_Y2 } from './base-models-y2.js';
import { SHAPES as SHAPES_GOLD } from './base-models-gold.js';
import { SHAPES as SHAPES_PIKACHU } from './base-models-pikachu.js';
import { SHAPES as SHAPES_EEVEE } from './base-models-eevee.js';
import { SHAPES as SHAPES_SNORLAX } from './base-models-snorlax.js';
import { SHAPES as SHAPES_JIGGLYPUFF } from './base-models-jigglypuff.js';
import { SHAPES as SHAPES_GENGAR } from './base-models-gengar.js';
import { SHAPES as SHAPES_LAPRAS } from './base-models-lapras.js';
import { SHAPES as SHAPES_BALL } from './base-models-balls.js';
import { SHAPES as SHAPES_MUSEUM } from './base-models-museum.js';
import { SHAPES as SHAPES_CONTEST } from './base-models-contest.js';
import { SHAPES as SHAPES_LEAGUE } from './base-models-league.js';
import { SHAPES as SHAPES_ROCKET } from './base-models-rocket.js';
import { SHAPES as SHAPES_DAYCARE } from './base-models-daycare.js';
import { SHAPES as SHAPES_PARTNER } from './base-models-partner.js';
import { SHAPES as SHAPES_FIGURINES } from './base-models-figurines.js';
import { SHAPES as SHAPES_ANTIQUE } from './base-models-antique.js';
import { SHAPES as SHAPES_RATTAN } from './base-models-rattan.js';
import { SHAPES as SHAPES_LOGCABIN } from './base-models-logcabin.js';
import { SHAPES as SHAPES_IRONWOOD } from './base-models-ironwood.js';
import { SHAPES as SHAPES_IMPERIAL } from './base-models-imperial.js';
import { SHAPES as SHAPES_DINER } from './base-models-diner.js';
import { SHAPES as SHAPES_CUTE } from './base-models-cute.js';
import { SHAPES as SHAPES_ELEGANT } from './base-models-elegant.js';
import { SHAPES as SHAPES_GOLDEN } from './base-models-golden.js';
import { SHAPES as SHAPES_SHELL } from './base-models-shell.js';
import { SHAPES as SHAPES_SAKURA } from './base-models-sakura.js';
import { SHAPES as SHAPES_MAPLE } from './base-models-maple.js';
import { SHAPES as SHAPES_ACORN } from './base-models-acorn.js';
import { SHAPES as SHAPES_MUSHROOM } from './base-models-mushroom.js';
import { SHAPES as SHAPES_BLOCK } from './base-models-block.js';
import { SHAPES as SHAPES_THROWBACK } from './base-models-throwback.js';
import { SHAPES as SHAPES_RANCH } from './base-models-ranch.js';
import { SHAPES as SHAPES_IRONGARDEN } from './base-models-irongarden.js';
import { SHAPES as SHAPES_BAMBOO } from './base-models-bamboo.js';
import { SHAPES as SHAPES_STONEZEN } from './base-models-stonezen.js';
import { SHAPES as SHAPES_CONSTELLATION } from './base-models-constellations.js';
import { SHAPES as SHAPES_CARAVAN } from './base-models-caravan.js';

const S = {};
const set = (ids, shape) => ids.split(' ').forEach(id => { S[id] = { ...shape }; });

/* ----- seats ----- */
set('chair', { make: 'chair', back: 'classic', seat: 0.5 });
set('ladderchair', { make: 'chair', back: 'ladder', seat: 0.5 });
set('spindlechair', { make: 'chair', back: 'spindle', seat: 0.5 });
set('roundchair', { make: 'chair', back: 'round', seat: 0.5 });
set('heartchair', { make: 'chair', back: 'heart', seat: 0.5 });
set('ballchair', { make: 'chair', back: 'ball', seat: 0.5 });
set('slatchair', { make: 'chair', back: 'slat', seat: 0.5 });
set('foldingchair', { make: 'chair', back: 'folding', seat: 0.5 });
set('cafechair', { make: 'chair', back: 'bentwood', seat: 0.5 });
set('thronechair pharaohthrone skythrone', { make: 'chair', back: 'throne', seat: 0.52, arms: true });
set('captainchair', { make: 'chair', back: 'captain', seat: 0.5, arms: true });
set('highchair', { make: 'chair', back: 'slat', seat: 0.82, tray: true });
set('swivelchair commandchair', { make: 'swivel', seat: 0.52 });
set('rocker', { make: 'chair', back: 'spindle', seat: 0.5, rockers: true, arms: true });
set('stool', { make: 'stool', seat: 0.5 });
set('barstool arcadestool', { make: 'stool', bar: true, seat: 0.82 });
set('bathstool', { make: 'stool', low: true, seat: 0.3 });
set('mushstool', { make: 'mushroom', seat: 0.46 });
set('stump', { make: 'stump', seat: 0.46 });
set('pouf', { make: 'pouf', seat: 0.42 });
set('cloudstool', { make: 'pouf', cloud: true, seat: 0.42 });
set('beanbag', { make: 'beanbag', seat: 0.38 });
set('sofa', { make: 'sofa', seat: 0.48 });
set('chesterfield', { make: 'sofa', tufted: true, rolled: true, seat: 0.48 });
set('cloudsofa', { make: 'sofa', cloud: true, seat: 0.48 });
set('booth trainseat', { make: 'sofa', booth: true, seat: 0.5 });
set('armchair', { make: 'armchair', seat: 0.48 });
set('wingchair', { make: 'armchair', wing: true, seat: 0.48 });
set('massagechair', { make: 'armchair', recline: true, seat: 0.5 });
set('bench', { make: 'bench', back: true, seat: 0.48 });
set('platformbench waitbench', { make: 'bench', back: true, metal: true, seat: 0.48 });
set('saunabench', { make: 'bench', slats: true, seat: 0.46 });
set('bedbench', { make: 'bench', padded: true, seat: 0.46 });
set('deckchair', { make: 'deckchair', seat: 0.36 });
set('lounger', { make: 'lounger', seat: 0.4 });

/* ----- tables (flat kinds keep their painting on the top) ----- */
set('table', { make: 'table', top: 0.72 });
set('diningtable', { make: 'table', top: 0.72, legs: 'turned' });
set('roundtable', { make: 'table', top: 0.72, round: true });
set('endtable', { make: 'table', top: 0.6, round: true, pedestal: true });
set('teatable', { make: 'table', top: 0.6, round: true, legs: 'turned' });
set('coffeetable', { make: 'table', top: 0.42, legs: 'stubby' });
set('glasstable', { make: 'table', top: 0.6, glass: true });
set('chabudai', { make: 'table', top: 0.32, round: true, legs: 'stubby' });
set('picnic', { make: 'picnic', top: 0.72 });
set('kotatsu', { make: 'kotatsu', top: 0.46 });
set('meetingtable lunchtable maptable', { make: 'table', top: 0.72, plain: true });
set('banquettable', { make: 'table', top: 0.72, plain: true, cloth: true });
set('startertable', { make: 'table', top: 0.72, plain: true, cloth: true, thing: true });
set('lattetable caketable macarontable teapottable sundaetable', { make: 'table', top: 0.66, round: true, pedestal: true, plain: true, thing: true });
set('arttable', { make: 'table', top: 0.66, plain: true, thing: true });
set('desk execdesk librarydesk teacherdesk writingdesk', { make: 'desk', top: 0.75 });
set('laptopdesk typewriterdesk paperdesk phonedesk monitordesk', { make: 'desk', top: 0.75, thing: true });
set('bookschooldesk notebookschooldesk appleschooldesk crayonschooldesk testschooldesk', { make: 'desk', top: 0.7, school: true, thing: true });
set('dressingtable', { make: 'desk', top: 0.75, mirror: true });

/* ----- storage ----- */
set('nightstand', { make: 'drawers', h: 0.66, rows: 2, top: 0.66 });
set('tallboy', { make: 'drawers', h: 1.3, rows: 4, top: 1.3 });
set('dresser', { make: 'drawers', h: 1.05, rows: 3, cols: 2, top: 1.05 });
set('filing', { make: 'drawers', h: 1.25, rows: 3, metal: true, top: 1.25 });
set('cupboard', { make: 'cabinet', h: 1.6, top: 1.6 });
set('wardrobe', { make: 'cabinet', h: 2.35 });
set('locker', { make: 'cabinet', h: 2, metal: true, vents: true });
set('shelf', { make: 'bookcase', h: 2.2 });
set('atlasbookcase poetrybookcase mysterybookcase recipebookcase fairybookcase scrollbookcase bindershelf', { make: 'bookcase', h: 1.9 });
set('counter island reception', { make: 'counter', top: 0.85 });
set('toastercounter kettlecounter microwavecounter mixercounter coffeecounter ricecookercounter breadboxcounter fruitbowlcounter cakecounter dishrackcounter choppingcounter blendercounter spicescounter herbscounter',
  { make: 'counter', top: 0.85, thing: true, kitchen: true });
set('soapvanity brushvanity perfumevanity towelsvanity duckvanity saltsvanity', { make: 'counter', top: 0.82, thing: true, sink: true });
set('crate', { make: 'crate', top: 0.86 });
set('barrel sakebarrel', { make: 'barrel', top: 0.95 });
set('chest', { make: 'chest' });
set('tv', { make: 'tv' });

/* ----- beds and cushions ----- */
set('bed singlebed restbed carbed', { make: 'bed', seat: 0.5 });
set('royalbed', { make: 'bed', posts: true, seat: 0.55 });
set('canopybed', { make: 'bed', posts: true, canopy: true, seat: 0.55 });
set('patchquilt starquilt stripequilt checkquilt heartquilt', { make: 'bed', quilt: true, seat: 0.5 });
set('cloudbed', { make: 'bed', cloud: true, seat: 0.5 });
set('futon capsulebed sleepingbag clambed', { make: 'futon', seat: 0.22 });

/* ----- lamps and plants ----- */
set('lamp', { make: 'lamp' });
set('floorlamp', { make: 'floorlamp' });
set('plant', { make: 'plant' });
set('palm', { make: 'palm' });
set('vase', { make: 'vase' });
set('globe', { make: 'globe' });
set('pyramid', { make: 'pyramid' });
set('toilet', { make: 'toilet' });
set('drumkit', { make: 'drumkit' });

/* the home arcade's machines: modelled, the game on the front only */
set('flapcabinet', { make: 'arcade', colour: '#c8904a', name: 'Pidgey Flap' });
set('pongcabinet', { make: 'arcade', colour: '#e8c040', name: 'Psyduck Pong' });
set('gastlymaze', { make: 'arcade', colour: '#7a4ac8', name: 'Gastly Maze' });
set('stackercabinet', { make: 'arcade', colour: '#3a7a8a', name: 'Snorlax Stacker' });
set('dashcabinet', { make: 'arcade', colour: '#e87830', name: 'Ponyta Dash' });
set('memorycabinet', { make: 'arcade', colour: '#d83a3a', name: 'Voltorb Memory' });
set('volleycabinet', { make: 'arcade', colour: '#f0c020', name: 'Pikachu Volleyball' });
set('unowncabinet', { make: 'arcade', colour: '#6a5ac8', name: 'Unown Word Search' });
set('crossingcabinet', { make: 'arcade', colour: '#3a8ae0', name: 'Poliwag Crossing' });
set('ekanscabinet', { make: 'arcade', colour: '#8a4ab8', name: 'Ekans Trail' });
set('invaderscabinet', { make: 'arcade', colour: '#e8b020', name: 'Beedrill Invaders' });
set('breakoutcabinet', { make: 'arcade', colour: '#e84040', name: 'Electrode Breakout' });
set('singalongcabinet', { make: 'arcade', colour: '#f080b0', name: 'Jigglypuff\'s Sing-Along' });
set('bubblecabinet', { make: 'arcade', colour: '#3a8ae8', name: 'Squirtle Bubble Shooter' });
set('berrycabinet', { make: 'arcade', colour: '#4aa8e8', name: 'Pachirisu Berry Catch' });
set('dittocabinet', { make: 'arcade', colour: '#b080e0', name: 'Where\'s Ditto?' });
set('bowlingcabinet', { make: 'arcade', colour: '#8a7a6a', name: 'Geodude Bowling' });
set('pokepuzzle', { make: 'arcade', colour: '#40b0a0', name: 'Poké Puzzle' });
set('whackmachine', { make: 'whack' });
/* the Game Corner's games */
set('slotmachine', { make: 'slot' });
set('voltorbflip', { make: 'arcade', colour: '#2a9a5a', name: 'Voltorb Flip' });
set('quizmachine', { make: 'arcade', colour: '#3a7ae0', name: 'Who\'s That Pokémon?' });
set('blackjacktable', { make: 'cardtable', game: 'blackjack' });
set('highlowtable', { make: 'cardtable', game: 'highlow' });
set('plinkoboard', { make: 'plinko' });
set('pokepinball', { make: 'pinball' });
for (const [id, table] of [['gengarpinball', 'gengar'], ['lapraspinball', 'lapras'], ['volcanopinball', 'volcano'], ['skypinball', 'skypillar']]) set(id, { make: 'pinball', table });

/* the batches modelled after the arcade cabinets (js/base-models-*.js): `'id id2': shape` each */
for (const batch of [SHAPES_A, SHAPES_B, SHAPES_C, SHAPES_D, SHAPES_E, SHAPES_F, SHAPES_G, SHAPES_H, SHAPES_I, SHAPES_J, SHAPES_K, SHAPES_W, SHAPES_W2, SHAPES_W3, SHAPES_W4, SHAPES_W5, SHAPES_W6, SHAPES_W7, SHAPES_T, SHAPES_Y, SHAPES_FR, SHAPES_L, SHAPES_M, SHAPES_N, SHAPES_O, SHAPES_P, SHAPES_Q, SHAPES_R, SHAPES_S, SHAPES_U, SHAPES_V, SHAPES_X, SHAPES_Z, SHAPES_Y2, SHAPES_GOLD, SHAPES_PIKACHU, SHAPES_EEVEE, SHAPES_SNORLAX, SHAPES_JIGGLYPUFF, SHAPES_GENGAR, SHAPES_LAPRAS, SHAPES_BALL, SHAPES_MUSEUM, SHAPES_CONTEST, SHAPES_LEAGUE, SHAPES_ROCKET, SHAPES_DAYCARE, SHAPES_PARTNER, SHAPES_FIGURINES, SHAPES_ANTIQUE, SHAPES_RATTAN, SHAPES_LOGCABIN, SHAPES_IRONWOOD, SHAPES_IMPERIAL, SHAPES_DINER, SHAPES_CUTE, SHAPES_ELEGANT, SHAPES_GOLDEN, SHAPES_SHELL, SHAPES_SAKURA, SHAPES_MAPLE, SHAPES_ACORN, SHAPES_MUSHROOM, SHAPES_BLOCK, SHAPES_THROWBACK, SHAPES_RANCH, SHAPES_IRONGARDEN, SHAPES_BAMBOO, SHAPES_STONEZEN, SHAPES_CONSTELLATION, SHAPES_CARAVAN]) for (const [ids, shape] of Object.entries(batch)) set(ids, shape);

export const SHAPES = S;

/** A kind's shape, or null: listed above, or a flat cushion-like seat (a puffed pillow wearing its painting). */
export function shapeOf(fam, p) {
  if (S[fam]) return S[fam];
  if (p?.flat && p.seat === 'cushion') return { make: 'cushion', seat: Math.max(0.16, p.high ?? 0.2) };
  return null;
}

/** The height in tiles a Pokémon sits at on a piece, or 0. */
export const seatHeight = (fam, p) => shapeOf(fam, p)?.seat ?? 0;
/** The height in tiles of a piece's top that small pieces stand on, or 0. */
export const surfaceHeight = (fam, p) => shapeOf(fam, p)?.top ?? 0;

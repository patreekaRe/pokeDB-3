/* base-shapes.js  -  which Secret Base kinds are built as real 3D models (js/base-mesh.js) and how, as plain data, so the
   room's rules (js/secret-base.js: what stands on a table, where a Pokémon sits) can read it without Three.js. A kind's
   shape is `{ make, ...options }`, `make` one of js/base-mesh.js's builders. Two numbers matter outside the models:
   `seat`, the height (in tiles) a Pokémon sits at, and `top`, the height a table's top stands at, which small pieces can
   be put on. A kind with no line here is still 3D: js/base-mesh.js turns a round piece on a lathe or puffs its painting
   up like a plush, and carves the rest from its paintings (js/base-model.js). */

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

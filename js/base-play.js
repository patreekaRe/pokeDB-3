/* base-play.js  -  the Secret Base's furniture comes alive (the user's ask, 2026-10-09: "TVs that have stuff on them,
   change channels, fridges that open, stoves that turn on", a healing machine that works, every electronic thing and
   instrument). Each kind a tap can do something with is one line of PLAY (its `does` and a few settings); dressPlay()
   fits a placed model with what that needs (a live screen, a door, flames, a light) and tapPlay() / tickPlay() run it.
   Everything sits in the model's own frame (tiles, feet at y 0, front +z), so it turns, shrinks on a table and leaves
   with the piece. Anything without a line still wiggles when tapped. Notes and knocks are js/audio.js's synths. */

import { playSound, playCry, FURNITURE_NOTES } from './audio.js';
import { HD, FT } from './base-paint.js';
import { calmFx } from './prefs.js';

let THREE = null;
const U = 1 / FT;
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- what each kind does ---------- */

const PLAY = {};
const CHANNEL_MS = 12000;
const set = (ids, how) => ids.split(' ').forEach(id => { PLAY[id] = how; });

// screens: channels on a live picture, a tap the next one
set('tv', { does: 'screen', show: ['quiz', 'battle', 'weather', 'news', 'cartoon', 'bars'], tv: true });
set('computer pc', { does: 'screen', show: ['pcbox', 'code', 'saver'] });
set('monitordesk laptopdesk', { does: 'screen', show: ['code', 'pcbox', 'saver'], small: true });
set('arcade shootercabinet', { does: 'screen', show: ['shooter'], arcade: true });
set('racercabinet', { does: 'screen', show: ['racer'], arcade: true });
set('puzzlecabinet', { does: 'screen', show: ['blocks'], arcade: true });
set('fightercabinet', { does: 'screen', show: ['fighter'], arcade: true });
set('mazecabinet', { does: 'screen', show: ['maze'], arcade: true });
set('rhythmcabinet', { does: 'screen', show: ['arrows'], arcade: true });
set('navdesk', { does: 'screen', show: ['radar'] });
set('ticketmachine tokenmachine', { does: 'screen', show: ['ticket'], gives: 'coin' });
set('mixingdesk', { does: 'screen', show: ['eq'], music: 'bass' });

// lights: a tap switches them
set('lamp floorlamp lavalamp moonlamp balllamp ufolamp jellylamp scarablamp featherlamp andon gardenlamp spookylamp stationlamp bankerslamp stonelantern icelantern lantern growlamp crystalball incubator serverrack', { does: 'light' });
set('starprojector', { does: 'light', stars: true });
set('candle candelabra tikitorch litwick', { does: 'light', flicker: true });

// fires: a tap lights or puts them out
set('fireplace woodstove brazier heater', { does: 'fire' });
set('stove', { does: 'fire', burners: true });
set('breadoven', { does: 'door', inside: 'oven' });
set('cauldron poisonvat', { does: 'brew' });

// doors: a tap opens them on what's inside
set('fridge minifridge milkfridge', { does: 'door', inside: 'fridge' });
set('pantry', { does: 'door', inside: 'pantry' });
set('wardrobe cupboard', { does: 'door', inside: 'clothes', double: true });
set('locker', { does: 'door', inside: 'locker' });
set('safe', { does: 'door', inside: 'gold' });
set('coffin sarcophagus', { does: 'door', inside: 'ghost' });

// instruments: each tap the next note of a tune
set('piano grandpiano', { does: 'note', voice: 'piano' });
set('organ', { does: 'note', voice: 'organ', low: true });
set('harp', { does: 'note', voice: 'pluck', high: true });
set('guitar banjostand ukulelestand', { does: 'note', voice: 'pluck' });
set('violinstand', { does: 'note', voice: 'strings', high: true });
set('cello', { does: 'note', voice: 'strings', low: true });
set('xylophone', { does: 'note', voice: 'mallet' });
set('chimes', { does: 'note', voice: 'bell', high: true });
set('trumpetstand', { does: 'note', voice: 'brass', high: true });
set('tuba', { does: 'note', voice: 'brass', low: true });
set('saxstand', { does: 'note', voice: 'reed' });
set('flutestand', { does: 'note', voice: 'flute', high: true });
set('amplifier speakerstack', { does: 'note', voice: 'bass', low: true, thump: true });
set('drum', { does: 'beat', hits: ['fx-drum', 'fx-snare'] });
set('drumkit', { does: 'beat', hits: ['fx-drum', 'fx-snare', 'fx-drum', 'fx-cymbal'] });
set('taiko', { does: 'beat', hits: ['fx-taiko'] });
set('gong', { does: 'beat', hits: ['fx-gong'], swing: true });
set('shipbell skybell', { does: 'beat', hits: ['fx-ding'], swing: true });
set('micstand', { does: 'beat', hits: ['fx-squeak'] });
set('metronome', { does: 'toggle', tick: true });
set('musicstand', { does: 'beat', hits: ['fx-whoosh'] });

// music players: a tap starts a tune, another stops it
set('jukebox', { does: 'player', voice: 'piano', bass: true });
set('radio', { does: 'player', voice: 'reed', static: true });
set('recordplayer', { does: 'player', voice: 'strings', spin: true });
set('gramophone', { does: 'player', voice: 'piano', crackle: true });
set('musicbox', { does: 'player', voice: 'musicbox', spin: true });

// the Pokémon Center
set('pokecenter', { does: 'heal', balls: 6 });
set('healpod', { does: 'heal', balls: 0 });
set('trademachine', { does: 'trade' });
set('balldisplay itemball', { does: 'ball' });

// machines that give you something
set('vending', { does: 'give', gives: 'can' });
set('gumball capsuletoy candyjar', { does: 'give', gives: 'gumball' });
set('clawmachine', { does: 'give', gives: 'prize', wait: 1400 });
set('coinpusher', { does: 'give', gives: 'coin' });
set('register lemonstall applestall prizestall ticketbooth', { does: 'give', gives: 'coin', sound: 'fx-ding' });
set('popcornstall', { does: 'give', gives: 'popcorn' });
set('balloonstall balloons', { does: 'give', gives: 'balloon' });
set('printer copier', { does: 'give', gives: 'paper', sound: 'fx-whirr' });
set('shredder', { does: 'give', gives: 'shreds', sound: 'fx-whirr' });
set('highstriker', { does: 'strike' });
set('fireworkrack', { does: 'firework' });
set('toastercounter', { does: 'give', gives: 'toast', wait: 1100 });

// kitchen and bathroom
set('espresso coffeecounter kettlecounter ricecookercounter cocoastand steamrocks', { does: 'steam' });
set('microwavecounter', { does: 'cook' });
set('blendercounter mixercounter washer centrifuge', { does: 'whirr' });
set('watercooler', { does: 'water', bubbles: true });
set('sink washbasin shower soapvanity brushvanity perfumevanity towelsvanity saltsvanity', { does: 'water' });
set('duckvanity bigduck', { does: 'squeak' });
set('toilet', { does: 'flush' });
set('clawtub bubblebath', { does: 'bubbles', foam: true });
set('fishbowl aquarium', { does: 'fish' });
set('bubblecolumn eggtank helixtank dometank sprouttank crystaltank orbtank', { does: 'bubbles' });
set('birdbath skyfountain well', { does: 'water', fountain: true });

// science and spooky
set('teslacoil plasmaglobe generator', { does: 'zap' });
set('hologram', { does: 'holo' });
set('cryopod', { does: 'frost' });
set('labrobot toyrobot', { does: 'robot' });

// things that move
set('globe orrery teacupride spinwheel weathervane satdish', { does: 'spin' });
set('fan', { does: 'toggle', spin: true });
set('hourglass', { does: 'flip' });
set('snowglobe', { does: 'snow' });
set('rocker rockinghorse swingseat hammock crib laprasfloat', { does: 'rock' });
set('punchbag dummy', { does: 'swing' });
set('jackbox', { does: 'boing' });
set('spacehopper beachball', { does: 'bounce' });
set('carouselhorse', { does: 'carousel' });
set('ferriswheel', { does: 'sway' });
set('alarmclock', { does: 'ring' });
set('grandclock', { does: 'chime' });
set('chest toybox hoard', { does: 'treasure' });
set('telescope spyglass', { does: 'look' });
set('crossing railsignal beacon', { does: 'blink' });
set('daruma', { does: 'wobble' });

/* ---------- reading a painting for where things are ---------- */

const hexRGB = (h) => { const v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
/** The box (in painted units) of a painting's pixels that pass `test(r, g, b, a)`, or null. */
function boxOf(art, test) {
  const d = art.getContext('2d').getImageData(0, 0, art.width, art.height).data;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (!test(d[i], d[i + 1], d[i + 2], d[i + 3])) continue;
    const x = (i >> 2) % art.width, y = (i >> 2) / art.width | 0;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1); n++;
  }
  return n ? { x0, y0, x1, y1, n } : null;
}
/** A painted box as a rectangle in the model's frame: middle x, y, and size, in tiles. */
const rectOf = (art, b) => ({ x: ((b.x0 + b.x1) / 2 - art.width / 2) * U, y: (art.height - (b.y0 + b.y1) / 2) * U, w: (b.x1 - b.x0) * U, h: (b.y1 - b.y0) * U, b });
/** Where a piece's glow colour is painted (its screen, its flame, its bulb). */
function glowRect(p, art, which = 0) {
  const c = p.glow?.[which];
  if (!c) return null;
  const hex = c[0] === '#' ? c : p.pal?.[c];
  if (!hex || hex[0] !== '#') return null;
  const [r0, g0, b0] = hexRGB(hex);
  const b = boxOf(art, (r, g, b2, a) => a > 128 && Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b2 - b0) < 36);
  return b && b.n > 6 ? rectOf(art, b) : null;
}
/** How far forward the model's front is at x, y: a ray in from the front. */
function frontAt(model, x, y, fallback) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 8), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(model, true)[0];
  return hit ? hit.point.z : fallback;
}

/* ---------- shared sprites ---------- */

const SPRITES = {};
/** A soft round particle picture: 'bubble', 'steam', 'spark', 'flame', 'note', 'heart', 'star', 'snow', 'coin', 'zap'. */
function sprite(kind) {
  if (SPRITES[kind]) return SPRITES[kind];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), grad = (stops) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); stops.forEach(([o, col]) => r.addColorStop(o, col)); return r; };
  g.lineCap = g.lineJoin = 'round';
  switch (kind) {
    case 'bubble': g.strokeStyle = 'rgba(220,245,255,0.95)'; g.lineWidth = 4; g.beginPath(); g.arc(32, 32, 24, 0, TAU); g.stroke(); g.fillStyle = 'rgba(200,240,255,0.25)'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(23, 22, 6, 0, TAU); g.fill(); break;
    case 'steam': g.fillStyle = grad([[0, 'rgba(255,255,255,0.75)'], [0.6, 'rgba(240,240,245,0.35)'], [1, 'rgba(240,240,245,0)']]); g.fillRect(0, 0, 64, 64); break;
    case 'spark': g.fillStyle = grad([[0, '#fff'], [0.25, 'rgba(255,240,170,0.9)'], [1, 'rgba(255,180,60,0)']]); g.fillRect(0, 0, 64, 64); break;
    case 'flame': {
      const r = g.createRadialGradient(32, 42, 2, 32, 38, 28);
      r.addColorStop(0, '#fffbe0'); r.addColorStop(0.3, '#ffd860'); r.addColorStop(0.6, 'rgba(255,120,30,0.85)'); r.addColorStop(1, 'rgba(220,40,10,0)');
      g.fillStyle = r; g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(50, 24, 58, 40, 46, 56); g.quadraticCurveTo(32, 64, 18, 56); g.bezierCurveTo(6, 40, 14, 24, 32, 2); g.fill(); break;
    }
    case 'note': g.fillStyle = '#ffffff'; g.strokeStyle = '#3a3050'; g.lineWidth = 5; g.beginPath(); g.ellipse(22, 46, 11, 8, -0.4, 0, TAU); g.stroke(); g.fill(); g.beginPath(); g.moveTo(32, 44); g.lineTo(32, 10); g.quadraticCurveTo(44, 14, 50, 26); g.stroke(); g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke(); break;
    case 'heart': g.fillStyle = '#ff6a8a'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(32, 54); g.bezierCurveTo(4, 34, 10, 8, 32, 22); g.bezierCurveTo(54, 8, 60, 34, 32, 54); g.fill(); g.stroke(); break;
    case 'star': g.fillStyle = '#fff6b0'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 11 : 28; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.fill(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(32, 32, 6, 0, TAU); g.fill(); break;
    case 'snow': g.fillStyle = grad([[0, '#fff'], [0.5, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 64, 64); break;
    case 'coin': g.fillStyle = '#f8c838'; g.strokeStyle = '#b07818'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 24, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(25, 25, 6, 0, TAU); g.fill(); break;
    case 'zap': g.strokeStyle = '#e8f4ff'; g.shadowColor = '#88c8ff'; g.shadowBlur = 10; g.lineWidth = 5; g.beginPath(); g.moveTo(32, 2); for (let y = 10; y < 64; y += 9) g.lineTo(32 + rand(-14, 14), y); g.stroke(); break;
    case 'frost': g.fillStyle = grad([[0, 'rgba(240,250,255,0.85)'], [0.6, 'rgba(200,235,255,0.35)'], [1, 'rgba(200,235,255,0)']]); g.fillRect(0, 0, 64, 64); break;
    case 'brew': g.fillStyle = grad([[0, 'rgba(200,255,160,0.9)'], [0.6, 'rgba(120,220,90,0.4)'], [1, 'rgba(120,220,90,0)']]); g.fillRect(0, 0, 64, 64); break;
    case 'popcorn': g.fillStyle = '#fff8e0'; for (const [x, y, r] of [[26, 30, 12], [40, 28, 11], [33, 40, 12], [32, 22, 9]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } g.fillStyle = '#f0c860'; g.beginPath(); g.arc(33, 34, 4, 0, TAU); g.fill(); break;
    case 'confetti': g.fillStyle = pick(['#ff6a6a', '#ffd84a', '#6ad8ff', '#8aff8a', '#d88aff']); g.fillRect(22, 12, 20, 40); break;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  // no mipmaps: a small particle read from them fades to the clear pixels' black and comes out dark
  t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  t.userData.keep = true;
  return (SPRITES[kind] = t);
}
const GLOWY = new Set(['spark', 'flame', 'zap']);

/* ---------- the TV, the PC and the arcade: programmes painted live ---------- */

const MONS = ['pikachu', 'eevee', 'snorlax', 'ditto', 'psyduck', 'jigglypuff', 'gengar', 'magikarp', 'meowth', 'togepi', 'marill', 'bulbasaur', 'charmander', 'squirtle', 'chansey', 'clefairy', 'lapras', 'wobbuffet'];
const pics = {};
function monPic(id) {
  if (!pics[id]) { const im = new Image(); im.src = `assets/pokemon/${id}-front.gif`; pics[id] = im; }
  return pics[id].complete && pics[id].naturalWidth ? pics[id] : null;
}
MONS.slice(0, 6).forEach(monPic);
let shadowCanvas = null;
/** A Pokémon's picture as a black silhouette. */
function silhouette(im) {
  shadowCanvas ??= document.createElement('canvas');
  shadowCanvas.width = im.naturalWidth; shadowCanvas.height = im.naturalHeight;
  const g = shadowCanvas.getContext('2d');
  g.clearRect(0, 0, im.naturalWidth, im.naturalHeight);
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#101020'; g.fillRect(0, 0, im.naturalWidth, im.naturalHeight);
  g.globalCompositeOperation = 'source-over';
  return shadowCanvas;
}
const text = (g, s, x, y, size, col = '#fff', align = 'center') => {
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = align; g.textBaseline = 'middle';
  g.lineWidth = Math.max(2, size / 5); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y);
};
const mon = (g, id, x, y, size, flip = false) => {
  const im = monPic(id);
  if (!im) return;
  const k = size / Math.max(im.naturalWidth, im.naturalHeight);
  g.save(); g.translate(x, y); if (flip) g.scale(-1, 1);
  g.drawImage(im, -im.naturalWidth * k / 2, -im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k);
  g.restore();
};
const NEWS = ['SNORLAX BLOCKS ROUTE 12 AGAIN', 'RECORD BERRY HARVEST IN THE CLEARING', 'MAGIKARP SPLASHES, NOTHING HAPPENS', 'SKY PILLAR CLIMBERS REACH NEW HEIGHTS', 'SAFARI ZONE SPOTS A RARE ONE', 'LOCAL TRAINER DECORATES SECRET BASE', 'NURSE JOY: "REST IS IMPORTANT"'];

/** Each programme paints one frame on `g` (w x h) at time t (seconds) with state `s` (kept between frames). */
const SHOWS = {
  quiz(g, w, h, t, s) {
    const cyc = 6, k = Math.floor(t / cyc), u = t % cyc, id = MONS[(k * 7 + (s.seed || 0)) % MONS.length];
    g.fillStyle = '#2858c8'; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w * 0.4, h * 0.55);
    for (let i = 0; i < 16; i++) { g.rotate(TAU / 16); g.fillStyle = i % 2 ? '#3c78e8' : '#2050b0'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, -w * 0.2); g.lineTo(w, w * 0.2); g.fill(); }
    g.restore();
    const im = monPic(id);
    if (im) { const sz = h * 0.7, kk = sz / Math.max(im.naturalWidth, im.naturalHeight); g.drawImage(u < 3.5 ? silhouette(im) : im, w * 0.4 - im.naturalWidth * kk / 2, h * 0.55 - im.naturalHeight * kk / 2, im.naturalWidth * kk, im.naturalHeight * kk); }
    text(g, u < 3.5 ? "WHO'S THAT POKéMON?" : `IT'S ${id.toUpperCase()}!`, w / 2, h * 0.12, h * 0.1, '#ffd838');
  },
  battle(g, w, h, t, s) {
    const a = MONS[(s.seed || 0) % MONS.length], b = MONS[((s.seed || 0) + 5) % MONS.length];
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#a8d8f8'); sky.addColorStop(1, '#e8f8d0'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#88c068'; g.beginPath(); g.ellipse(w * 0.72, h * 0.45, w * 0.2, h * 0.07, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(w * 0.28, h * 0.85, w * 0.24, h * 0.08, 0, 0, TAU); g.fill();
    const hit = t % 2 < 0.3, turn = Math.floor(t / 2) % 2;
    mon(g, b, w * 0.72 + (hit && !turn ? Math.sin(t * 80) * 3 : 0), h * 0.32, h * 0.38);
    mon(g, a, w * 0.28 + (hit && turn ? Math.sin(t * 80) * 3 : 0), h * 0.66, h * 0.46, true);
    const bar = (x, y, f) => { g.fillStyle = '#303040'; g.fillRect(x, y, w * 0.32, h * 0.05); g.fillStyle = f > 0.5 ? '#48d048' : f > 0.2 ? '#f8c030' : '#f04838'; g.fillRect(x + 1, y + 1, (w * 0.32 - 2) * f, h * 0.05 - 2); };
    bar(w * 0.06, h * 0.1, 1 - (t / 9 % 1) * 0.8); bar(w * 0.6, h * 0.62, 1 - ((t + 4) / 11 % 1) * 0.7);
    if (hit) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, w, h); }
  },
  weather(g, w, h, t) {
    g.fillStyle = '#3070c0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#68b858'; g.beginPath(); g.moveTo(w * 0.15, h * 0.85); g.bezierCurveTo(w * 0.05, h * 0.4, w * 0.4, h * 0.2, w * 0.55, h * 0.35); g.bezierCurveTo(w * 0.9, h * 0.3, w * 0.95, h * 0.8, w * 0.6, h * 0.9); g.fill();
    text(g, 'WEATHER', w * 0.05, h * 0.1, h * 0.09, '#fff', 'left');
    const icons = [['☀', w * 0.3, h * 0.5, '24°'], ['☁', w * 0.58, h * 0.42, '18°'], ['☂', w * 0.75, h * 0.7, '15°']];
    icons.forEach(([i, x, y, d], n) => { const bob = Math.sin(t * 2 + n) * 2; text(g, i, x, y + bob, h * 0.16, n === 0 ? '#ffd838' : '#fff'); text(g, d, x, y + h * 0.13, h * 0.08); });
  },
  news(g, w, h, t, s) {
    g.fillStyle = '#20284a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c83838'; g.fillRect(0, 0, w, h * 0.14); text(g, 'POKé NEWS', w * 0.04, h * 0.07, h * 0.08, '#fff', 'left');
    mon(g, MONS[(s.seed || 0) % MONS.length], w * 0.5, h * 0.48 + Math.sin(t * 3) * 1.5, h * 0.48);
    g.fillStyle = '#8a5a3a'; g.fillRect(w * 0.2, h * 0.62, w * 0.6, h * 0.16);
    g.fillStyle = '#f8f8f8'; g.fillRect(0, h * 0.82, w, h * 0.18);
    const line = NEWS[Math.floor(t / 9) % NEWS.length], x = w - ((t % 9) / 9) * (w + line.length * h * 0.07);
    g.font = `bold ${h * 0.09}px system-ui, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#c83838'; g.fillText(line, x, h * 0.91);
  },
  cartoon(g, w, h, t) {
    g.fillStyle = '#f8e070'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#88d058'; g.fillRect(0, h * 0.75, w, h * 0.25);
    const x = (t * 30) % (w + 60) - 30;
    mon(g, 'pikachu', x, h * 0.62 - Math.abs(Math.sin(t * 6)) * h * 0.12, h * 0.36, true);
    mon(g, 'meowth', x - 50, h * 0.62 - Math.abs(Math.sin(t * 6 + 1)) * h * 0.08, h * 0.36, true);
    text(g, '♪', w * 0.8, h * 0.2 + Math.sin(t * 4) * 4, h * 0.14, '#ff6a8a');
  },
  bars(g, w, h, t) {
    ['#f8f8f8', '#f8f030', '#38f0f0', '#38f038', '#f038f0', '#f03838', '#3838f0'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * w / 7, 0, w / 7 + 1, h * 0.7); });
    g.fillStyle = '#202020'; g.fillRect(0, h * 0.7, w, h * 0.3);
    text(g, t % 1 < 0.6 ? 'PLEASE STAND BY' : '', w / 2, h * 0.85, h * 0.09);
  },
  pcbox(g, w, h, t, s) {
    g.fillStyle = '#3858a8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#88a8e8'; g.fillRect(4, 4, w - 8, h * 0.16); text(g, `BOX ${1 + (s.seed || 0) % 8}`, w / 2, 4 + h * 0.08, h * 0.1);
    const cols = 6, rows = 3, cw = (w - 12) / cols, ch = (h * 0.74) / rows, cur = Math.floor(t * 1.5) % (cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      const x = 6 + (i % cols) * cw, y = h * 0.23 + Math.floor(i / cols) * ch;
      g.fillStyle = i === cur ? '#f8e070' : '#a8c0f0'; g.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      if ((i * 5 + (s.seed || 0)) % 3) mon(g, MONS[(i * 5 + (s.seed || 0)) % MONS.length], x + cw / 2, y + ch / 2, ch * 0.95);
    }
  },
  code(g, w, h, t) {
    g.fillStyle = '#101820'; g.fillRect(0, 0, w, h);
    const n = Math.floor(t * 4), lh = h / 9;
    for (let i = 0; i < 9; i++) { const k = n - 8 + i; if (k < 0) continue; g.fillStyle = ['#68e868', '#68c8f8', '#f8d068', '#e868c8'][k % 4]; g.fillRect(6 + (k * 13 % 4) * 8, i * lh + lh * 0.3, ((k * 37) % 60 + 20) / 100 * (w - 20) * (i === 8 ? (t * 4 % 1) : 1), lh * 0.4); }
    if (t % 1 < 0.5) { g.fillStyle = '#fff'; g.fillRect(w - 12, h - lh, 6, lh * 0.6); }
  },
  saver(g, w, h, t) {
    g.fillStyle = '#081028'; g.fillRect(0, 0, w, h);
    const px = Math.abs(((t * 40) % (2 * (w - 24))) - (w - 24)) + 12, py = Math.abs(((t * 31) % (2 * (h - 24))) - (h - 24)) + 12;
    g.fillStyle = '#e83838'; g.beginPath(); g.arc(px, py, 11, Math.PI, 0); g.fill(); g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(px, py, 11, 0, Math.PI); g.fill();
    g.strokeStyle = '#202020'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 11, 0, TAU); g.moveTo(px - 11, py); g.lineTo(px + 11, py); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 3.5, 0, TAU); g.fill(); g.stroke();
  },
  shooter(g, w, h, t, s) {
    g.fillStyle = '#080818'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { g.fillStyle = '#fff'; g.fillRect((i * 53) % w, (i * 37 + t * 40 * (1 + i % 3)) % h, 1.5, 1.5); }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { if ((r * 6 + c + Math.floor(t * 2)) % 7 === 0) continue; g.fillStyle = ['#f868a8', '#68e8f8', '#f8e068'][r]; const x = w * 0.15 + c * w * 0.13 + Math.sin(t * 2) * 8, y = h * 0.12 + r * h * 0.12; g.fillRect(x, y, w * 0.07, h * 0.06); g.fillRect(x - 2, y + h * 0.03, 3, 3); g.fillRect(x + w * 0.07 - 1, y + h * 0.03, 3, 3); }
    const sx = w / 2 + Math.sin(t * 1.7) * w * 0.35;
    g.fillStyle = '#68f868'; g.beginPath(); g.moveTo(sx, h * 0.8); g.lineTo(sx - 9, h * 0.92); g.lineTo(sx + 9, h * 0.92); g.fill();
    g.fillStyle = '#fff'; g.fillRect(sx - 1, h * 0.8 - ((t * 4) % 1) * h * 0.7, 2, 6);
    text(g, s.score ? `SCORE ${s.score}` : (t % 1.2 < 0.7 ? 'INSERT COIN' : ''), w / 2, h * 0.06, h * 0.08, '#f8e068');
  },
  racer(g, w, h, t, s) {
    g.fillStyle = '#68b8f8'; g.fillRect(0, 0, w, h * 0.4); g.fillStyle = '#58a848'; g.fillRect(0, h * 0.4, w, h * 0.6);
    const speed = s.score ? 3 : 1.5;
    for (let i = 0; i < 12; i++) { const z = ((i / 12) + t * speed * 0.3) % 1, y = h * 0.4 + z * z * h * 0.6, half = w * (0.05 + z * z * 0.45); g.fillStyle = i % 2 ? '#707078' : '#606068'; g.fillRect(w / 2 - half, y, half * 2, h * 0.06 * z + 1); g.fillStyle = i % 2 ? '#f8f8f8' : '#e83838'; g.fillRect(w / 2 - half - 4 * z, y, 4 * z + 1, h * 0.06 * z + 1); g.fillRect(w / 2 + half, y, 4 * z + 1, h * 0.06 * z + 1); }
    const cx = w / 2 + Math.sin(t * 1.3) * w * 0.15;
    g.fillStyle = '#e83838'; g.fillRect(cx - 14, h * 0.78, 28, 12); g.fillStyle = '#202028'; g.fillRect(cx - 16, h * 0.86, 7, 6); g.fillRect(cx + 9, h * 0.86, 7, 6);
    text(g, s.score ? `${Math.floor(t * 37) % 300} KM/H` : 'RACE!', w / 2, h * 0.1, h * 0.09, '#f8e068');
  },
  blocks(g, w, h, t, s) {
    g.fillStyle = '#181030'; g.fillRect(0, 0, w, h);
    const cs = h / 12, x0 = w / 2 - cs * 4;
    g.fillStyle = '#302850'; g.fillRect(x0, 0, cs * 8, h);
    const COLS = ['#f86868', '#68e868', '#6898f8', '#f8d868', '#d868f8'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) if ((r * 3 + c * 5) % 7) { g.fillStyle = COLS[(r + c) % 5]; g.fillRect(x0 + c * cs + 1, h - (r + 1) * cs + 1, cs - 2, cs - 2); }
    const fy = ((t * (s.score ? 4 : 2)) % 8) * cs;
    g.fillStyle = COLS[Math.floor(t / 4) % 5]; for (const [a, b] of [[3, 0], [4, 0], [4, 1], [5, 1]]) g.fillRect(x0 + a * cs + 1, fy + b * cs + 1, cs - 2, cs - 2);
  },
  fighter(g, w, h, t) {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#f89858'); sky.addColorStop(1, '#783868'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#382838'; g.fillRect(0, h * 0.8, w, h * 0.2);
    const hitA = t % 1.4 < 0.25, hitB = (t + 0.7) % 1.4 < 0.25;
    mon(g, 'charmander', w * 0.32 + (hitA ? 8 : 0), h * 0.62, h * 0.42, true);
    mon(g, 'squirtle', w * 0.68 - (hitB ? 8 : 0), h * 0.62, h * 0.42);
    g.fillStyle = '#f8e068'; g.fillRect(6, 6, w * 0.4 * (1 - (t / 12 % 1) * 0.6), 6); g.fillRect(w - 6 - w * 0.4 * (1 - ((t + 5) / 12 % 1) * 0.6), 6, w * 0.4 * (1 - ((t + 5) / 12 % 1) * 0.6), 6);
    if (hitA || hitB) text(g, 'POW!', w / 2, h * 0.35, h * 0.14, '#f8f8f8');
  },
  maze(g, w, h, t) {
    g.fillStyle = '#000010'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3858f8'; g.lineWidth = 3;
    for (const [x, y, a, b] of [[0.1, 0.15, 0.9, 0.15], [0.1, 0.85, 0.9, 0.85], [0.1, 0.15, 0.1, 0.85], [0.9, 0.15, 0.9, 0.85], [0.3, 0.35, 0.7, 0.35], [0.3, 0.65, 0.7, 0.65]]) { g.beginPath(); g.moveTo(x * w, y * h); g.lineTo(a * w, b * h); g.stroke(); }
    const px = ((t * 0.25) % 1) * w * 0.7 + w * 0.15;
    g.fillStyle = '#f8e8a0'; for (let i = 0; i < 10; i++) { const x = w * 0.15 + i * w * 0.075; if (x > px) g.fillRect(x - 1.5, h * 0.5 - 1.5, 3, 3); }
    const m = Math.abs(Math.sin(t * 10)) * 0.6;
    g.fillStyle = '#f8e030'; g.beginPath(); g.moveTo(px, h * 0.5); g.arc(px, h * 0.5, 8, m, TAU - m); g.fill();
    g.fillStyle = '#f84868'; g.beginPath(); g.arc(px - 28, h * 0.5, 7, Math.PI, 0); g.lineTo(px - 21, h * 0.5 + 7); g.lineTo(px - 35, h * 0.5 + 7); g.fill();
  },
  arrows(g, w, h, t) {
    g.fillStyle = '#280838'; g.fillRect(0, 0, w, h);
    const lanes = ['←', '↓', '↑', '→'], cols = ['#f868a8', '#68e8f8', '#68f868', '#f8e068'];
    lanes.forEach((a, i) => text(g, a, w * (0.2 + i * 0.2), h * 0.15, h * 0.12, '#605070'));
    for (let k = 0; k < 8; k++) { const lane = (k * 3 + Math.floor(t / 2)) % 4, y = h * 1.1 - ((t * 0.5 + k / 8) % 1) * h; text(g, lanes[lane], w * (0.2 + lane * 0.2), y, h * 0.13, cols[lane]); }
    if (t % 0.5 < 0.1) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, 0, w, h); }
  },
  radar(g, w, h, t) {
    g.fillStyle = '#082010'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.45;
    g.strokeStyle = '#2a8a48'; g.lineWidth = 1; for (const f of [0.33, 0.66, 1]) { g.beginPath(); g.arc(cx, cy, r * f, 0, TAU); g.stroke(); }
    const a = t * 2; g.fillStyle = 'rgba(104,232,168,0.35)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a - 0.6, a); g.fill();
    for (const [x, y] of [[0.3, 0.4], [0.7, 0.3], [0.6, 0.7]]) { const b = Math.atan2(y * h - cy, x * w - cx), d = ((a - b) % TAU + TAU) % TAU; g.fillStyle = `rgba(150,255,190,${Math.max(0, 1 - d / 3)})`; g.beginPath(); g.arc(x * w, y * h, 3, 0, TAU); g.fill(); }
  },
  ticket(g, w, h, t) {
    g.fillStyle = '#103048'; g.fillRect(0, 0, w, h);
    text(g, 'TAP FOR', w / 2, h * 0.3, h * 0.14, '#68e8f8'); text(g, t % 1 < 0.6 ? 'TOKENS' : '', w / 2, h * 0.62, h * 0.18, '#f8e068');
  },
  eq(g, w, h, t, s) {
    g.fillStyle = '#081810'; g.fillRect(0, 0, w, h);
    const n = 12, on = s.on ? 1 : 0.25;
    for (let i = 0; i < n; i++) { const v = (0.3 + 0.7 * Math.abs(Math.sin(t * (3 + i * 0.7) + i))) * on; for (let k = 0; k < 8; k++) if (k / 8 < v) { g.fillStyle = k > 5 ? '#f86848' : k > 3 ? '#f8d848' : '#58e888'; g.fillRect(4 + i * (w - 8) / n, h - 4 - (k + 1) * (h - 8) / 8, (w - 8) / n - 2, (h - 8) / 8 - 2); } }
  },
  static(g, w, h) {
    const img = g.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  },
};

/* ---------- what the doors open on ---------- */

function insidePicture(kind, w, h) {
  const c = document.createElement('canvas'); c.width = Math.max(32, Math.round(w * 128)); c.height = Math.max(32, Math.round(h * 128));
  const g = c.getContext('2d'), W = c.width, H = c.height;
  const shelves = (n, col) => { for (let i = 1; i < n; i++) { g.fillStyle = col; g.fillRect(4, H * i / n - 3, W - 8, 5); } };
  switch (kind) {
    case 'fridge': {
      const l = g.createLinearGradient(0, 0, 0, H); l.addColorStop(0, '#f4fbff'); l.addColorStop(1, '#cfe4ee'); g.fillStyle = l; g.fillRect(0, 0, W, H);
      shelves(4, '#b8d8e8');
      const food = [['#f86858', 0.2], ['#58c868', 0.45], ['#f8d058', 0.7], ['#f8f0e0', 0.3], ['#a868d8', 0.6], ['#f89838', 0.8]];
      food.forEach(([col, x], i) => { const y = H * (Math.floor(i / 2) + 1) / 4 - 6; g.fillStyle = col; g.beginPath(); g.ellipse(W * x, y - 6, W * 0.08, 8, 0, 0, TAU); g.fill(); });
      g.fillStyle = '#ffffff'; g.fillRect(W * 0.55, H * 0.74 - 22, W * 0.1, 22); g.fillStyle = '#58a8f8'; g.fillRect(W * 0.55, H * 0.74 - 12, W * 0.1, 6);
      break;
    }
    case 'oven': { const r = g.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, W * 0.7); r.addColorStop(0, '#ffd890'); r.addColorStop(1, '#a83818'); g.fillStyle = r; g.fillRect(0, 0, W, H); g.fillStyle = '#c88838'; g.beginPath(); g.ellipse(W / 2, H * 0.6, W * 0.3, H * 0.15, 0, 0, TAU); g.fill(); g.fillStyle = '#e8b058'; g.beginPath(); g.ellipse(W / 2, H * 0.55, W * 0.24, H * 0.1, 0, 0, TAU); g.fill(); break; }
    case 'pantry': g.fillStyle = '#e8d8b8'; g.fillRect(0, 0, W, H); shelves(4, '#a87848'); for (let i = 0; i < 9; i++) { g.fillStyle = ['#f8c058', '#d85838', '#88b848', '#f8f0d8'][i % 4]; g.fillRect(W * (0.1 + (i % 3) * 0.3), H * (Math.floor(i / 3) + 1) / 4 - 22, W * 0.18, 18); } break;
    case 'clothes': g.fillStyle = '#5a3a28'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8b090'; g.fillRect(4, H * 0.12, W - 8, 3); for (let i = 0; i < 6; i++) { g.fillStyle = ['#e85858', '#5888e8', '#f8d058', '#58b868', '#e8e8e8', '#a868d8'][i]; const x = 6 + i * (W - 12) / 6; g.fillRect(x + 2, H * 0.15, (W - 12) / 6 - 4, H * 0.45); } break;
    case 'locker': g.fillStyle = '#485868'; g.fillRect(0, 0, W, H); shelves(3, '#283848'); g.fillStyle = '#f8f8f8'; g.fillRect(W * 0.2, H * 0.12, W * 0.6, H * 0.15); g.fillStyle = '#e85838'; g.beginPath(); g.arc(W / 2, H * 0.8, W * 0.2, 0, TAU); g.fill(); break;
    case 'gold': g.fillStyle = '#383030'; g.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? '#f8c838' : '#fff2a0'; g.beginPath(); g.arc(rand(6, W - 6), H - rand(4, H * 0.5) * (1 - i / 60), 5, 0, TAU); g.fill(); } break;
    case 'ghost': g.fillStyle = '#100818'; g.fillRect(0, 0, W, H); g.fillStyle = '#b8a8f8'; g.beginPath(); g.ellipse(W / 2, H * 0.45, W * 0.25, H * 0.25, 0, 0, TAU); g.fill(); g.fillStyle = '#100818'; g.beginPath(); g.arc(W * 0.42, H * 0.42, 5, 0, TAU); g.arc(W * 0.58, H * 0.42, 5, 0, TAU); g.fill(); break;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- fitting a model ---------- */

/** Fits a freshly built model (at the origin, unturned) with what its kind does; null if it does nothing special. Its
    taps then go to tapPlay(), its frames to tickPlay(). */
export function dressPlay(three, model, p) {
  THREE = three;
  const how = PLAY[p.fam] || (p.doll ? { does: 'doll' } : { does: 'wiggle' });
  model.rotation.order = 'YXZ';
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), art = p.art(0, 1, true);
  const play = { how, model, p, box, top: box.max.y, front: box.max.z, parts: [], fx: [], st: { seed: Math.floor(Math.random() * 1000) }, step: 0, anim: null, on: false, t0: performance.now() };
  model.userData.play = play;
  const at = (r, dz = 0.006) => frontAt(model, r.x, r.y, box.max.z) + dz;
  const D = how.does;

  if (D === 'screen') {
    let r = how.tv ? null : glowRect(p, art) || glowRect(p, art, 1);
    if (how.tv) { const sw = p.w - 0.24, shh = sw * 0.58; r = { x: 0, y: 0.56 + shh / 2, w: sw - 0.08, h: shh - 0.08, z: 0.02 }; }
    if (!r) {
      const b = boxOf(art, (rr, g, b2, a) => a > 128);
      r = b && { x: ((b.x0 + b.x1) / 2 - art.width / 2) * U, y: (art.height - b.y0) * U - (b.y1 - b.y0) * U * 0.32, w: (b.x1 - b.x0) * U * 0.56, h: (b.y1 - b.y0) * U * 0.28 };
    }
    if (r) {
      const c = document.createElement('canvas'), aspect = r.w / Math.max(0.05, r.h);
      c.height = 96; c.width = Math.round(Math.min(256, Math.max(48, 96 * aspect)));
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      m.position.set(r.x, r.y, r.z ?? at(r));
      model.add(m);
      play.screen = { c, g: c.getContext('2d'), tex, mesh: m, show: 0, cut: 0, last: 0 };
    }
  }
  if (D === 'door') {
    const b = boxOf(art, (r, g, b2, a) => a > 128);
    if (b) {
      // the door is the front painting itself (its body, not the feet or a top), cut out and hinged on its left edge
      const inset = Math.round((b.y1 - b.y0) * 0.06), bb = { x0: b.x0 + 1, x1: b.x1 - 1, y0: b.y0 + inset, y1: b.y1 - Math.round((b.y1 - b.y0) * 0.08) };
      // the front's frontmost point over the door (a ray between two doors would find the gap)
      const r = rectOf(art, bb), hd = p.art(0, HD);
      const hits = [[0, 0], [-0.3, 0], [0.3, 0], [0, 0.3], [0, -0.3]].map(([fx, fy]) => frontAt(model, r.x + fx * r.w, r.y + fy * r.h, box.max.z));
      const z = Math.max(...hits) + 0.004;
      const leaves = how.double ? [[bb.x0, (bb.x0 + bb.x1) / 2, 1], [(bb.x0 + bb.x1) / 2, bb.x1, -1]] : [[bb.x0, bb.x1, 1]];
      const inside = new THREE.Mesh(new THREE.PlaneGeometry(r.w * 0.96, r.h * 0.96), new THREE.MeshBasicMaterial({ map: insidePicture(how.inside, r.w, r.h), toneMapped: false }));
      inside.position.set(r.x, r.y, z);
      model.add(inside);
      play.doors = leaves.map(([a, bx, side]) => {
        const c = document.createElement('canvas'); c.width = Math.max(4, (bx - a) * HD); c.height = Math.max(4, (bb.y1 - bb.y0) * HD);
        c.getContext('2d').drawImage(hd, a * HD, bb.y0 * HD, c.width, c.height, 0, 0, c.width, c.height);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        const w = (bx - a) * U, hinge = new THREE.Group(), leaf = new THREE.Mesh(new THREE.BoxGeometry(w, r.h, 0.03), [0, 1, 2, 3].map(() => new THREE.MeshStandardMaterial({ color: '#ddd' })).concat([new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: '#ccc' })]));
        leaf.castShadow = true;
        leaf.position.x = side * w / 2;
        hinge.position.set((side > 0 ? a : bx) * U - art.width / 2 * U, r.y, z + 0.02);
        hinge.add(leaf);
        hinge.userData.side = side;
        model.add(hinge);
        return hinge;
      });
      if (how.inside === 'fridge' || how.inside === 'oven') play.glowAt = new THREE.Vector3(r.x, r.y, z + 0.1);
    }
  }
  if (D === 'heal' && how.balls) {
    // six Poké Balls on the tray, lit one by one
    play.balls = [];
    for (let i = 0; i < how.balls; i++) {
      const g = new THREE.Group(), top = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e83838', roughness: 0.3, emissive: '#ff4040', emissiveIntensity: 0 }));
      const bot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 8, 0, TAU, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.3, emissive: '#ffffff', emissiveIntensity: 0 }));
      g.add(top, bot);
      g.position.set(-0.32 + (i % 3) * 0.16 + (i > 2 ? 0.08 : 0), play.top + 0.04, 0.02 + (i > 2 ? 0.1 : -0.06));
      model.add(g);
      play.balls.push(g);
    }
  }
  if (D === 'holo') {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(0, play.top + 0.35, 0);
    model.add(m);
    play.holo = { c, t, m, id: pick(MONS) };
  }
  model.traverse(o => { if (o.userData.spins) play.spinner = o; });
  if (D === 'light') { play.on = true; play.mats = []; model.traverse(o => { if (o.isMesh) for (const m of [o.material].flat()) if (m.userData.lamp || m.emissiveMap || m.userData.kind === 'glow') play.mats.push(m); }); }
  if (D === 'fire' || D === 'brew') play.flame = glowRect(p, art) || { x: 0, y: play.top * (D === 'brew' ? 1 : 0.4), w: p.w * 0.4, h: 0.2 };
  if (D === 'fish') play.fishAt = glowRect(p, art) || { x: 0, y: play.top * 0.55, w: p.w * 0.5, h: play.top * 0.4 };
  return play;
}

/* ---------- particles ---------- */

function emit(play, kind, at, { vel = [0, 0.4, 0], spread = 0.08, size = 0.12, life = 1.6, grow = 0.6, add = GLOWY.has(kind), fall = 0, spin = 0 } = {}) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(kind), transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }));
  m.position.set(at.x + rand(-spread, spread), at.y + rand(-spread, spread) * 0.5, at.z + rand(-spread, spread) * 0.5);
  m.scale.setScalar(size);
  m.raycast = () => {};
  play.model.add(m);
  play.fx.push({ m, v: new THREE.Vector3(vel[0] + rand(-0.06, 0.06), vel[1] + rand(-0.05, 0.05), vel[2] + rand(-0.06, 0.06)), t: 0, life, size, grow, fall, spin });
}
function liveFx(play, dt) {
  const s = dt / 1000;
  for (let i = play.fx.length - 1; i >= 0; i--) {
    const f = play.fx[i];
    f.t += s;
    if (f.t >= f.life) { play.model.remove(f.m); f.m.material.dispose(); play.fx.splice(i, 1); continue; }
    f.v.y -= f.fall * s;
    f.m.position.addScaledVector(f.v, s);
    if (f.floor !== undefined && f.m.position.y < f.floor) { f.m.position.y = f.floor; f.v.y *= -0.35; f.v.x *= 0.7; f.v.z *= 0.7; }
    const u = f.t / f.life;
    f.m.scale.setScalar(f.size * (1 + f.grow * u));
    f.m.material.opacity = Math.min(1, (1 - u) * 2.5);
    if (f.spin) f.m.material.rotation += f.spin * s;
  }
}
/** Something dropped out of a machine: it falls from `from`, bounces on the floor in front and fades. */
function drop(play, kind, from, opts = {}) {
  emit(play, kind, from, { vel: [rand(-0.1, 0.1), 0.6, 0.9], spread: 0.02, size: 0.13, life: 2.4, grow: 0, fall: 4, add: false, ...opts });
  play.fx.at(-1).floor = 0.06;
}

/* ---------- moving the whole piece ---------- */

const ease = (u) => 1 - (1 - u) ** 3;
/** The piece's pose now: a short motion from the latest tap, plus anything it does all the time. */
function pose(play, now) {
  const o = { dy: 0, sx: 1, sy: 1, rx: 0, ry: 0, rz: 0, dx: 0 }, a = play.anim;
  if (a) {
    const u = (now - a.t0) / a.ms;
    if (u >= 1) play.anim = null;
    else {
      const fade = 1 - u, k = calmFx() ? 0.4 : 1;
      switch (a.kind) {
        case 'squash': o.sy = 1 - 0.16 * Math.sin(u * Math.PI * 3) * fade * k; o.sx = 1 + 0.08 * Math.sin(u * Math.PI * 3) * fade * k; break;
        case 'hop': o.dy = Math.abs(Math.sin(u * Math.PI * 2)) * 0.12 * fade * k; break;
        case 'shake': o.dx = Math.sin(u * 70) * 0.02 * fade * k; o.rz = Math.sin(u * 55) * 0.03 * fade * k; break;
        case 'rock': o.rx = Math.sin(u * Math.PI * 6) * 0.18 * fade * k; break;
        case 'swing': o.rx = Math.sin(u * Math.PI * 5) * 0.22 * fade * k; o.pivot = true; break;
        case 'wobble': o.rz = Math.sin(u * Math.PI * 7) * 0.2 * fade * k; break;
        case 'spin': o.ry = ease(u) * TAU * (a.turns || 1); break;
        case 'boing': o.sy = 1 + 0.45 * Math.sin(u * Math.PI * 4) * fade * k; o.sx = 1 - 0.12 * Math.sin(u * Math.PI * 4) * fade * k; break;
        case 'bounce': o.dy = Math.abs(Math.sin(u * Math.PI * 3)) * 0.4 * fade * k; break;
        case 'flip': o.rz = ease(u) * Math.PI; break;
      }
    }
  }
  if (play.how.does === 'carousel') o.dy += (Math.sin(now / 500) + 1) * 0.05;
  if (play.how.does === 'sway') o.rz += Math.sin(now / 900) * 0.02;
  if (play.how.spin && play.on) o.ry += now / 400;
  if (play.flipped) o.rz += Math.PI;
  return o;
}
const go = (play, kind, ms, more = {}) => { play.anim = { kind, ms, t0: performance.now(), ...more }; };

/* ---------- a tap ---------- */

const PHRASE = [0, 2, 4, 2, 5, 4, 2, 0, 1, 2, 4, 7, 5, 4, 2, 4];
const noteOf = (how, step) => Math.min(FURNITURE_NOTES - 1, PHRASE[step % PHRASE.length] + (how.high ? 3 : 0));
const topOf = (play, dy = 0.05) => new THREE.Vector3(0, play.top + dy, 0);
const frontOf = (play, y = 0.3) => new THREE.Vector3(0, y, play.front + 0.05);
const notes = (play, n = 1) => { for (let i = 0; i < n; i++) emit(play, 'note', topOf(play), { vel: [rand(-0.15, 0.15), 0.5, 0.05], size: 0.16, life: 1.5, grow: 0.2, add: false }); };

/** A tap on the piece: what it does. Returns what the room should do about it: { cheer } has the Pokémon cheer. */
export function tapPlay(play) {
  const { how } = play, D = how.does, now = performance.now();
  play.step++;
  switch (D) {
    case 'screen': {
      const sc = play.screen;
      if (how.arcade || how.gives) { play.st.score = (play.st.score || 0) + 100; playSound('fx-coin'); if (how.gives) drop(play, how.gives, frontOf(play, 0.35)); go(play, 'shake', 300); return { cheer: how.arcade }; }
      if (how.music) return tapPlayer(play, { voice: 'bass' });
      if (sc) { sc.show = (sc.show + 1) % how.show.length; sc.cut = now + 350; sc.next = now + CHANNEL_MS; play.st.seed = Math.floor(Math.random() * 1000); }
      playSound('fx-click'); playSound('fx-static');
      return {};
    }
    case 'light': setLight(play, !play.on); playSound('fx-click'); return {};
    case 'fire': play.on = !play.on; playSound(play.on ? 'fx-crackle' : 'fx-steam'); return {};
    case 'brew': for (let i = 0; i < 8; i++) emit(play, 'brew', topOf(play), { vel: [0, 0.6, 0], size: 0.14, life: 1.4 }); playSound('fx-bubble'); go(play, 'shake', 400); return {};
    case 'door': play.on = !play.on; playSound('fx-door'); if (play.on && how.inside === 'ghost') { emit(play, 'frost', frontOf(play, 0.6), { vel: [0, 0.5, 0.3], size: 0.4, life: 2 }); playSound('fx-whoosh'); } return {};
    case 'note': {
      const n = noteOf(how, play.step);
      playSound(`${how.voice}-${n}`);
      if (how.thump) playSound('fx-drum');
      notes(play); go(play, how.thump ? 'boing' : 'squash', 350);
      return { cheer: true };
    }
    case 'beat': playSound(how.hits[play.step % how.hits.length]); notes(play); go(play, how.swing ? 'swing' : 'squash', how.swing ? 1500 : 300); return { cheer: true };
    case 'player': return tapPlayer(play, how);
    case 'heal': return heal(play);
    case 'trade': playSound('fx-whoosh'); for (let i = 0; i < 6; i++) setTimeout(() => emit(play, 'spark', new THREE.Vector3(-play.p.w / 2 + i * play.p.w / 5, play.top * 0.7, 0.2), { vel: [0, 0.1, 0], size: 0.2, life: 0.6 }), i * 90); setTimeout(() => playSound('fx-ding'), 600); return { cheer: true };
    case 'ball': playSound('ball-open'); for (let i = 0; i < 8; i++) emit(play, 'star', topOf(play), { vel: [rand(-0.5, 0.5), 0.8, rand(-0.2, 0.4)], size: 0.12, life: 1, fall: 1 }); go(play, 'hop', 400); return {};
    case 'give': {
      go(play, 'shake', 400);
      playSound(how.sound || (how.gives === 'coin' ? 'fx-coin' : 'fx-door'));
      const later = () => {
        if (how.gives === 'popcorn') { for (let i = 0; i < 10; i++) setTimeout(() => { emit(play, 'popcorn', topOf(play, -0.2), { vel: [rand(-0.3, 0.3), 1.2, rand(0, 0.4)], size: 0.09, life: 1.4, fall: 3, add: false }); playSound('fx-pop'); }, i * 110); return; }
        if (how.gives === 'balloon') { emit(play, 'heart', topOf(play), { vel: [rand(-0.1, 0.1), 0.6, 0.05], size: 0.22, life: 3, grow: 0, add: false }); return; }
        if (how.gives === 'toast') { for (let i = 0; i < 2; i++) emit(play, 'popcorn', new THREE.Vector3(i ? 0.08 : -0.08, play.top, 0), { vel: [0, 1.4, 0], size: 0.12, life: 0.9, fall: 4, grow: 0, add: false }); playSound('fx-pop'); return; }
        if (how.gives === 'paper' || how.gives === 'shreds') { for (let i = 0; i < (how.gives === 'shreds' ? 8 : 2); i++) emit(play, 'snow', frontOf(play, play.top * 0.6), { vel: [0, -0.2, 0.5], size: 0.12, life: 1.4, fall: 0.4, add: false }); return; }
        if (how.gives === 'prize') { playSound('fx-ding'); for (let i = 0; i < 6; i++) emit(play, 'confetti', topOf(play), { vel: [rand(-0.5, 0.5), 1, rand(0, 0.5)], size: 0.07, life: 1.6, fall: 2, add: false, spin: 6 }); }
        drop(play, how.gives === 'can' ? 'coin' : how.gives === 'gumball' || how.gives === 'prize' ? 'bubble' : 'coin', frontOf(play, play.top * 0.3));
        if (how.gives === 'gumball' || how.gives === 'can') playSound('fx-pop');
      };
      if (how.wait) { playSound('fx-whirr'); setTimeout(later, how.wait); } else later();
      return { cheer: how.gives === 'prize' };
    }
    case 'strike': playSound('fx-drum'); setTimeout(() => { playSound('fx-ding'); for (let i = 0; i < 6; i++) emit(play, 'star', topOf(play), { vel: [rand(-0.4, 0.4), 0.6, 0.2], size: 0.14, life: 1 }); }, 450); emit(play, 'coin', new THREE.Vector3(0, 0.3, play.front), { vel: [0, 3.2, 0], size: 0.12, life: 0.5, grow: 0, add: false }); return { cheer: true };
    case 'firework': playSound('fx-whoosh'); setTimeout(() => { playSound('fx-firework'); const c = topOf(play, 1.4); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; emit(play, 'spark', c, { vel: [Math.cos(a) * 1.2, Math.sin(a) * 1.2, rand(-0.3, 0.3)], spread: 0, size: 0.12, life: 1.1, fall: 0.8 }); } }, 600); emit(play, 'spark', topOf(play), { vel: [0, 2.3, 0], size: 0.1, life: 0.6, grow: 0 }); return { cheer: true };
    case 'steam': for (let i = 0; i < 6; i++) emit(play, 'steam', topOf(play), { vel: [0, 0.45, 0], size: 0.18, life: 2, grow: 1.4, add: false }); playSound('fx-steam'); return {};
    case 'cook': go(play, 'shake', 1600); playSound('fx-hum'); setTimeout(() => { playSound('fx-ding'); emit(play, 'steam', topOf(play), { vel: [0, 0.4, 0], size: 0.2, life: 1.6, grow: 1.2, add: false }); }, 1500); return {};
    case 'whirr': go(play, 'shake', 1200); playSound('fx-whirr'); return {};
    case 'water': playSound(how.bubbles ? 'fx-bubble' : 'fx-splash'); for (let i = 0; i < (how.fountain ? 14 : 8); i++) emit(play, 'bubble', how.fountain ? topOf(play) : frontOf(play, play.top * 0.75), { vel: [rand(-0.3, 0.3), how.fountain ? 1.2 : how.bubbles ? 0.5 : -0.3, rand(0, 0.3)], size: 0.07, life: 1.1, fall: how.bubbles ? 0 : 2, add: false }); return {};
    case 'squeak': playSound('fx-squeak'); go(play, 'squash', 350); return { cheer: true };
    case 'flush': playSound('fx-flush'); for (let i = 0; i < 10; i++) setTimeout(() => emit(play, 'bubble', topOf(play, -0.05), { vel: [rand(-0.1, 0.1), 0.2, 0], size: 0.06, life: 0.8, add: false }), i * 120); return {};
    case 'bubbles': playSound('fx-bubble'); for (let i = 0; i < 12; i++) emit(play, 'bubble', topOf(play, -0.3), { vel: [rand(-0.2, 0.2), 0.7, rand(-0.1, 0.2)], size: how.foam ? 0.12 : 0.06, life: 1.5, add: false }); return {};
    case 'fish': play.st.dart = now; playSound('fx-bubble'); for (let i = 0; i < 6; i++) emit(play, 'bubble', topOf(play, -0.2), { vel: [0, 0.4, 0], size: 0.05, life: 1, add: false }); return { cheer: true };
    case 'zap': playSound('fx-zap'); for (let i = 0; i < 5; i++) emit(play, 'zap', topOf(play, 0.15), { vel: [0, 0, 0], spread: 0.15, size: 0.35, life: 0.25, grow: 0 }); go(play, 'shake', 300); return {};
    case 'holo': if (play.holo) play.holo.id = pick(MONS); playSound('fx-beep'); return { cheer: true };
    case 'frost': playSound('fx-steam'); for (let i = 0; i < 8; i++) emit(play, 'frost', frontOf(play, play.top * 0.4), { vel: [rand(-0.2, 0.2), 0.05, 0.4], size: 0.3, life: 1.8, grow: 1.5, add: false }); return {};
    case 'robot': playSound('fx-beep'); go(play, 'hop', 600); return { cheer: true };
    case 'spin': playSound('fx-whoosh'); if (play.spinner) { play.spinV = 14; return {}; } go(play, 'spin', 1600, { turns: 2 }); return {};
    case 'toggle': play.on = !play.on; playSound(how.tick ? 'fx-tick' : play.on ? 'fx-whirr' : 'fx-click'); return {};
    case 'flip': play.flipped = !play.flipped; go(play, 'flip', 700); playSound('fx-whoosh'); return {};
    case 'snow': go(play, 'shake', 500); for (let i = 0; i < 24; i++) emit(play, 'snow', topOf(play, -play.top * 0.4), { vel: [rand(-0.15, 0.15), 0.15, rand(-0.15, 0.15)], spread: 0.12, size: 0.04, life: 3, grow: 0, fall: 0.12 }); playSound('fx-bubble'); return {};
    case 'rock': playSound('fx-squeak'); go(play, 'rock', 2400); return {};
    case 'swing': playSound('fx-drum'); go(play, 'swing', 1500); return {};
    case 'boing': playSound('fx-boing'); go(play, 'boing', 1100); for (let i = 0; i < 6; i++) emit(play, 'confetti', topOf(play), { vel: [rand(-0.6, 0.6), 1.2, rand(0, 0.5)], size: 0.06, life: 1.5, fall: 2.5, add: false, spin: 8 }); return { cheer: true };
    case 'bounce': playSound('fx-boing'); go(play, 'bounce', 1300); return { cheer: true };
    case 'carousel': case 'sway': notes(play); playSound(`musicbox-${noteOf(how, play.step)}`); return {};
    case 'ring': playSound('fx-ring'); go(play, 'shake', 1200); return {};
    case 'chime': for (let i = 0; i < 3; i++) setTimeout(() => { playSound('fx-ding'); }, i * 700); go(play, 'swing', 600); return {};
    case 'treasure': playSound('item-get'); go(play, 'hop', 500); for (let i = 0; i < 10; i++) emit(play, i % 2 ? 'coin' : 'star', topOf(play), { vel: [rand(-0.5, 0.5), 1.1, rand(0, 0.4)], size: 0.1, life: 1.3, fall: 2.2, add: false }); return { cheer: true };
    case 'look': playSound('fx-whoosh'); go(play, 'spin', 1400, { turns: 0.5 }); setTimeout(() => go(play, 'spin', 1400, { turns: 0.5 }), 1500); return {};
    case 'blink': play.on = !play.on; playSound(play.on ? 'fx-ring' : 'fx-click'); if (!play.on) model0(play).traverse(x => { if (x.isMesh && x.material.emissive) x.material.emissiveIntensity = 0; }); return {};
    case 'wobble': playSound('fx-tick'); go(play, 'wobble', 1400); return {};
    case 'doll': { const id = play.p.doll[0]; playCry(id); playSound('fx-squeak'); go(play, 'squash', 450); emit(play, 'heart', topOf(play), { vel: [0, 0.5, 0], size: 0.14, life: 1.2, add: false }); return { cheer: true }; }
    default: playSound('select'); go(play, 'squash', 300); return {};
  }
}

/** The tune a music player plays while it's on: its PHRASE a step at a time, a bass under it on the jukebox. */
function tapPlayer(play, how) {
  play.on = !play.on;
  playSound(play.on ? (how.static ? 'fx-static' : 'fx-click') : 'fx-click');
  clearInterval(play.timer);
  play.st.on = play.on;
  if (!play.on) return {};
  let k = 0;
  play.timer = setInterval(() => {
    if (!play.model.parent?.parent) { clearInterval(play.timer); return; }
    const n = PHRASE[(k + play.st.seed) % PHRASE.length] + (k % 8 === 0 ? 2 : 0);
    if (how.voice !== 'bass' || k % 2 === 0) playSound(`${how.voice}-${Math.min(FURNITURE_NOTES - 1, n + (how.voice === 'bass' ? 0 : 2))}`);
    if (how.bass && k % 2 === 0) playSound(`bass-${PHRASE[(k / 2 | 0) % 4]}`);
    if (how.crackle && k % 4 === 0) playSound('fx-crackle');
    if (k % 2 === 0) notes(play);
    k++;
  }, 300);
  return { cheer: true };
}

/** The healing machine: the balls light one by one to its chime, then everyone in the room is healed and cheers. */
function heal(play) {
  if (play.busy) return {};
  play.busy = true;
  playSound('fx-heal');
  const balls = play.balls || [];
  balls.forEach((b, i) => setTimeout(() => { b.children.forEach(m => { m.material.emissiveIntensity = 0.9; }); }, 260 * i));
  for (let i = 0; i < 6; i++) setTimeout(() => emit(play, 'spark', topOf(play), { vel: [0, 0.3, 0.1], spread: 0.25, size: 0.18, life: 0.9 }), 260 * i);
  setTimeout(() => {
    playSound('heal');
    for (let i = 0; i < 10; i++) emit(play, 'heart', topOf(play, 0.2), { vel: [rand(-0.4, 0.4), 0.6, rand(0, 0.4)], size: 0.14, life: 1.6, add: false });
  }, 1700);
  setTimeout(() => { balls.forEach(b => b.children.forEach(m => { m.material.emissiveIntensity = 0; })); play.busy = false; }, 3400);
  return { cheer: 'heal' };
}

function setLight(play, on) {
  play.on = on;
  for (const m of play.mats) { m.userData.off = !on; m.emissiveIntensity = on ? (m.userData.was ?? 1) : 0; }
}

/* ---------- every frame ---------- */

/** Runs a piece's life for a frame: its pose, its screen, its flames and bubbles. */
export function tickPlay(play, now, dt) {
  const { model, how } = play, D = how.does, calm = calmFx();
  const o = pose(play, now), b = model.userData.base ?? (model.userData.base = { y: model.position.y, ry: model.rotation.y, s: model.scale.x, x: model.position.x });
  model.position.y = b.y + o.dy * b.s;
  model.rotation.set(o.rx, b.ry + o.ry, o.rz);
  model.scale.set(b.s * o.sx, b.s * o.sy, b.s * o.sx);
  if (o.pivot) model.position.y += (1 - Math.cos(o.rx)) * play.top * b.s;
  liveFx(play, dt);
  if (play.spinner) { play.spinV = Math.max(0.3, (play.spinV ?? 0.3) * Math.exp(-dt / 1400)); play.spinner.rotation.y += play.spinV * dt / 1000; }

  const sc = play.screen;
  if (sc && now - sc.last > 80) {
    sc.last = now;
    // left alone, a set with several channels flips through them by itself
    if (how.show.length > 1 && now > (sc.next ??= now + CHANNEL_MS)) { sc.show = (sc.show + 1) % how.show.length; sc.cut = now + 350; sc.next = now + CHANNEL_MS; play.st.seed = Math.floor(Math.random() * 1000); }
    const show = how.show[sc.show], w = sc.c.width, h = sc.c.height;
    (now < sc.cut ? SHOWS.static : SHOWS[show])(sc.g, w, h, (now - play.t0) / 1000, play.st);
    if (!calm) { sc.g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < h; y += 3) sc.g.fillRect(0, y, w, 1); }
    sc.tex.needsUpdate = true;
  }
  if (play.doors) {
    const want = play.on ? 1 : 0;
    play.open = (play.open ?? 0) + (want - (play.open ?? 0)) * Math.min(1, dt / 140);
    for (const d of play.doors) d.rotation.y = -d.userData.side * play.open * 1.6;
  }
  if (play.holo) {
    const { c, t, m } = play.holo, g = c.getContext('2d');
    g.clearRect(0, 0, 128, 128);
    const im = monPic(play.holo.id);
    if (im) { g.globalAlpha = 0.85; mon(g, play.holo.id, 64, 64, 110); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(80,220,255,0.55)'; g.fillRect(0, 0, 128, 128); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; for (let y = (now / 40) % 4; y < 128; y += 4) g.clearRect(0, y, 128, 1); }
    t.needsUpdate = true;
    m.rotation.y = now / 1200;
    m.position.y = play.top + 0.35 + Math.sin(now / 600) * 0.03;
  }
  if (calm) return;
  const chance = (perSec) => Math.random() < perSec * dt / 1000;
  if ((D === 'fire' && play.on)) {
    const f = play.flame, at = new THREE.Vector3(f.x, f.y - f.h * 0.2, frontAt(model, f.x, f.y, play.front) - 0.04);
    if (how.burners) { if (chance(14)) emit(play, 'flame', new THREE.Vector3(pick([-0.18, 0.18]), play.top + 0.02, pick([-0.1, 0.12])), { vel: [0, 0.35, 0], spread: 0.04, size: 0.09, life: 0.35, grow: -0.5 }); }
    else { if (chance(16)) emit(play, 'flame', at, { vel: [0, 0.45, 0], spread: f.w * 0.3, size: 0.18, life: 0.5, grow: -0.6 }); if (chance(2)) emit(play, 'spark', at, { vel: [0, 0.9, 0.05], spread: f.w * 0.3, size: 0.04, life: 1.2, grow: 0 }); }
  }
  if (D === 'brew' && chance(3)) emit(play, 'brew', topOf(play, -0.02), { vel: [0, 0.25, 0], spread: 0.15, size: 0.09, life: 1.2 });
  if (D === 'bubbles' && chance(2.5)) emit(play, 'bubble', new THREE.Vector3(rand(-0.1, 0.1), play.top * 0.2, play.front - 0.15), { vel: [0, 0.35, 0], spread: 0.02, size: 0.04, life: play.top * 2, grow: 0.3, add: false });
  if (D === 'fish') {
    if (!play.fish) {
      play.fish = new THREE.Sprite(new THREE.SpriteMaterial({ map: fishTex(), transparent: true, depthWrite: false }));
      play.fish.scale.set(0.14, 0.09, 1); play.fish.raycast = () => {};
      model.add(play.fish);
    }
    const f = play.fishAt, sp = now - (play.st.dart || 0) < 1200 ? 3 : 1, a = now / 1400 * sp;
    play.fish.position.set(f.x + Math.sin(a) * f.w * 0.35, f.y + Math.sin(a * 1.7) * f.h * 0.15, play.front - 0.12 + Math.cos(a) * 0.06);
    play.fish.material.rotation = 0; play.fish.scale.x = Math.cos(a) > 0 ? 0.14 : -0.14;
    if (chance(0.8)) emit(play, 'bubble', play.fish.position, { vel: [0, 0.3, 0], spread: 0, size: 0.03, life: 1, add: false });
  }
  if (D === 'water' && how.fountain && chance(6)) emit(play, 'bubble', topOf(play), { vel: [rand(-0.2, 0.2), 0.8, rand(-0.1, 0.2)], spread: 0.05, size: 0.04, life: 0.8, fall: 2, add: false });
  if (D === 'steam' && chance(0.6)) emit(play, 'steam', topOf(play), { vel: [0, 0.3, 0], size: 0.12, life: 1.8, grow: 1.4, add: false });
  if (D === 'light' && how.stars && play.on && chance(3)) emit(play, 'star', topOf(play), { vel: [rand(-0.6, 0.6), rand(0.4, 1), rand(-0.6, 0.6)], spread: 0.05, size: 0.07, life: 3, grow: 0 });
  if (D === 'light' && how.flicker && play.on) for (const m of play.mats) m.emissiveIntensity = (m.userData.was ?? 1) * (0.75 + Math.random() * 0.25);
  if (D === 'blink' && play.on) model.traverse(x => { if (x.isMesh && x.material.emissive) { x.material.emissive.set('#ff3030'); x.material.emissiveIntensity = Math.floor(now / 400) % 2 ? 0.8 : 0; } });
  if (D === 'zap' && chance(1.2)) emit(play, 'zap', topOf(play, 0.1), { vel: [0, 0, 0], spread: 0.12, size: 0.25, life: 0.15, grow: 0 });
  if (how.tick && play.on) { const beat = Math.floor(now / 500); if (beat !== play.beat) { play.beat = beat; playSound('fx-tick'); go(play, 'wobble', 480); } }
  if (play.glowAt && play.on && chance(1.5)) emit(play, how.inside === 'oven' ? 'spark' : 'snow', play.glowAt, { vel: [0, 0.1, 0.2], spread: 0.1, size: 0.08, life: 1, grow: 0.5 });
}

let fishPic = null;
function fishTex() {
  if (fishPic) return fishPic;
  const c = document.createElement('canvas'); c.width = 64; c.height = 40;
  const g = c.getContext('2d');
  g.fillStyle = '#f87838'; g.beginPath(); g.ellipse(36, 20, 20, 12, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(18, 20); g.lineTo(4, 8); g.lineTo(4, 32); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(46, 16, 4, 0, TAU); g.fill(); g.fillStyle = '#202028'; g.beginPath(); g.arc(47, 16, 2, 0, TAU); g.fill();
  fishPic = new THREE.CanvasTexture(c); fishPic.colorSpace = THREE.SRGBColorSpace; fishPic.userData.keep = true;
  return fishPic;
}

const model0 = (play) => play.model;

/** Stops whatever a piece keeps doing on its own (a tune), for when it's put away or the room closes. */
export function stopPlay(play) { clearInterval(play?.timer); }

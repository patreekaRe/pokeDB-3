/* ============================================================
   data/graves.js  -  friends' tombstones (docs/roadmap.md's "Friends list and base visits", phase 2), the pure part:
   a lost run packed small for the network, read back as untrusted, and where a friend's grave stands on your map.
   The network side and the grave's window are js/graves.js.

   graves/<uid> = { name, buddy, tier, falls, at }: a trainer's last FALL_MAX lost runs, each a JSON string, with their
   name and walking buddy (the Trainer Plaza's wandering buddies come from it too). Its own small doc, not a key on
   trainers/<uid>: that page carries the whole Secret Base (up to 600 KB), and the map reads every friend's at once.
   ============================================================ */

import { cleanName } from './leaderboard.js';

export const GRAVES = 'graves';
export const FALL_MAX = 5;
/** One fall's JSON at most; firestore.rules checks it, so a doc stays a few KB. */
export const FALL_LEN = 4000;
/** Graves on one map at most, the newest first. */
export const GRAVES_SHOWN = 8;
export const GRAVES_KEYS = ['name', 'buddy', 'tier', 'falls', 'at'];
const MODES = ['run', 'safari', 'tower'];
const TIERS = ['green', 'bronze', 'silver', 'gold', 'violet'];
const KINDS = ['fight', 'elite', 'boss', 'event'];
const STATS = ['fights', 'elites', 'turns', 'played', 'dealt', 'taken', 'biggest', 'earned', 'spent', 'rests', 'events', 'forgotten'];

const str = (s, max = 40) => (typeof s === 'string' ? s.slice(0, max) : '');
const int = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
const ids = (list, n) => (Array.isArray(list) ? list.filter(x => typeof x === 'string' && x.length <= 40).slice(0, n) : []);
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

/**
 * A lost run as a friend's grave keeps it: where (`mode`, `land` the biome or Safari area id, `day` the Safari's day or
 * the Sky Pillar's week, `biome` its index, `floor`, `node` the room's id or the Pillar door's index), what beat it
 * (`foeId`, `foe`, `move`, `kind`) and the loss recap's page (js/halloffame.js's lossPage()): the Pokémon, its HP over
 * the run, its deck and its numbers. `at` (ms) tells two falls on one floor apart.
 */
export function fallOf(f) {
  const out = {
    mode: MODES.includes(f.mode) ? f.mode : 'run', land: str(f.land), day: isDay(f.day) ? f.day : '',
    biome: int(f.biome, 0, 9), floor: int(f.floor, 0, 999), node: str(f.node, 8), foeId: str(f.foeId), at: int(f.at, 0, 9e15),
    starter: str(f.starter), stage: int(f.stage, 0, 2), shiny: !!f.shiny, type: str(f.type, 12), level: int(f.level, 0, 20),
    date: isDay(f.date) ? f.date : '', biomeName: str(f.biomeName), place: str(f.place), kind: KINDS.includes(f.kind) ? f.kind : null,
    foe: str(f.foe), move: str(f.move),
    hpTrail: (Array.isArray(f.hpTrail) ? f.hpTrail : []).filter(Array.isArray).slice(-60).map(([hp, max, b]) => [int(hp, 0, 9999), int(max, 1, 9999), int(b, 0, 9)]),
    deck: ids(f.deck, 60), itemsUsed: ids(f.itemsUsed, 30),
  };
  for (const k of STATS) out[k] = int(f[k], 0, 1e7);
  if (!out.hpTrail.length) out.hpTrail = [[0, 1, out.biome]];
  return out;
}

/** A fall as the doc keeps it: JSON of at most FALL_LEN, its deck and chart trimmed if it runs over. */
export function packFall(f) {
  const fall = fallOf(f);
  let json = JSON.stringify(fall);
  for (const [deck, trail, items] of [[40, 30, 10], [20, 12, 0], [0, 4, 0]]) {
    if (json.length <= FALL_LEN) break;
    json = JSON.stringify({ ...fall, deck: fall.deck.slice(0, deck), hpTrail: fall.hpTrail.slice(-trail), itemsUsed: fall.itemsUsed.slice(0, items) });
  }
  return json.length <= FALL_LEN ? json : null;
}

/** A friend's fall back from their doc, untrusted: through fallOf()'s bounds, or null if it isn't one. */
export function readFall(json) {
  if (typeof json !== 'string' || json.length > FALL_LEN) return null;
  let f;
  try { f = JSON.parse(json); } catch { return null; }
  if (!f || typeof f !== 'object' || typeof f.starter !== 'string' || !MODES.includes(f.mode)) return null;
  return fallOf(f);
}

/** Your falls kept in the save (packed), the newest last, with `json` added: at most FALL_MAX. */
export const addFall = (list, json) => [...(Array.isArray(list) ? list : []).filter(j => typeof j === 'string'), json].slice(-FALL_MAX);

/** The doc a trainer writes (`at` is the server's time, added as it's sent). */
export const gravesDoc = ({ name, buddy, tier, falls }) => ({
  name: cleanName(name).toUpperCase() || 'TRAINER', buddy: str(buddy, 64), tier: TIERS.includes(tier) ? tier : 'green',
  falls: (Array.isArray(falls) ? falls : []).filter(j => typeof j === 'string' && j.length <= FALL_LEN).slice(-FALL_MAX),
});

/** A friend's doc, made safe: { name, buddy, tier, falls: [fall], at } or null. */
export function readGraves(d, at = 0) {
  if (!d || typeof d !== 'object' || typeof d.name !== 'string' || !d.name) return null;
  return { name: d.name.slice(0, 16), buddy: str(d.buddy, 64), tier: TIERS.includes(d.tier) ? d.tier : 'green',
    falls: (Array.isArray(d.falls) ? d.falls : []).slice(-FALL_MAX).map(readFall).filter(Boolean), at };
}

/** A grave's own id: what Pay respects and Avenge are kept under, once each. */
export const graveId = (uid, f) => `${uid}:${f.at}:${f.mode}:${f.floor}`.slice(0, 120);

/** A small steady hash, so a friend's grave on another map stands by the same room every time it's drawn. */
function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * The graves on this map: every friend's fall that happened here, newest first, at most GRAVES_SHOWN. `friends` is
 * [{ uid, name, buddy, falls }]; `here` says where the map is: `{ mode, land, day }`. A Safari fall stands at its very room
 * (the day's map is the same for everyone), a Sky Pillar one at its floor's door (the week's tower is too), and any
 * other run's on the same floor of the same biome, by a room the hash picks (each run's map differs). `map` is
 * `{ floors: [[{ id }]], byId }` (the Pillar's flight: its floor numbers are `base` + row + 1). Each comes back as
 * `{ uid, name, buddy, fall, id, node }` (node a room id) or, on the Pillar, `{ ..., floor, door }`.
 */
export function gravesHere(friends, here, map, base = 0) {
  const out = [];
  for (const fr of friends || []) for (const fall of fr.falls || []) {
    if (fall.mode !== here.mode) continue;
    const g = { uid: fr.uid, name: fr.name, buddy: fr.buddy, fall, id: graveId(fr.uid, fall) };
    if (here.mode === 'tower') {
      const row = fall.floor - base - 1;
      if (fall.day !== here.day || row < 0 || row > map.floors.length) continue;
      const n = row < map.floors.length ? map.floors[row].length : 1;
      out.push({ ...g, floor: fall.floor, door: Math.min(n - 1, int(fall.node, 0, 9)) });
      continue;
    }
    if (fall.land !== here.land) continue;
    if (here.mode === 'safari') {
      if (fall.day !== here.day || !map.byId[fall.node]) continue;
      out.push({ ...g, node: fall.node });
      continue;
    }
    if (fall.kind === 'boss' || fall.node === 'boss') { if (map.byId.boss) out.push({ ...g, node: 'boss' }); continue; }
    const row = map.floors[fall.floor - 1];
    if (!row?.length) continue;
    out.push({ ...g, node: row[hash(g.id) % row.length].id });
  }
  return out.sort((a, b) => b.fall.at - a.fall.at).slice(0, GRAVES_SHOWN);
}

/** What firestore.rules would refuse in a graves doc (without `at`), or null. */
export function checkGraves(d) {
  if (!d || typeof d !== 'object') return 'not a doc';
  if (Object.keys(d).some(k => !GRAVES_KEYS.includes(k))) return 'extra key';
  if (typeof d.name !== 'string' || !d.name || [...d.name].length > 16) return 'bad name';
  if (typeof d.buddy !== 'string' || d.buddy.length > 64) return 'bad buddy';
  if (!TIERS.includes(d.tier)) return 'bad tier';
  if (!Array.isArray(d.falls) || d.falls.length > FALL_MAX || d.falls.some(j => typeof j !== 'string' || j.length > FALL_LEN)) return 'bad falls';
  return null;
}

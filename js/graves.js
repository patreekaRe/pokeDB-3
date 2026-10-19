/* ============================================================
   graves.js  -  friends' tombstones (docs/roadmap.md's "Friends list and base visits", phase 2): every run you lose,
   Safari and Sky Pillar climbs too, goes up on graves/<uid> (your last five, js/data/graves.js), and the trainers on your
   list find your grave on their map where you fell: the very room on the day's Safari, the door on the week's Sky
   Pillar, the same floor of the same biome on any other run. A tap opens your loss recap, with Pay respects (flowers on
   the stone, a few PokéCoins, once a grave) and Avenge (beat the Pokémon that beat you, this biome, for more). The same
   small doc carries your buddy for the Trainer Plaza's wandering buddies (js/hub-buddies.js).
   Nothing here may hold up the game: every Firebase call is caught, and the map draws at once with whatever is cached.
   ============================================================ */

import { GRAVES, packFall, addFall, gravesDoc, checkGraves, readGraves, gravesHere } from './data/graves.js';
import { friendsOf, lastSeen } from './data/trainers.js';
import { cloudConfigured, cloudRemembered, cloudSession, onCloudSignIn } from './cloud.js';
import { getSave, updateSave, awardCoins } from './storage.js';
import { trainerName } from './leaderboard.js';
import { buddyKey, cardTier } from './trainercard.js';
import { trainerMon } from './trainers.js';
import { lossPage, nameOf, dateOf } from './halloffame.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { isStarterUnlocked } from './progress.js';
import { playSound, playCry } from './audio.js';
import { $, openDialog, refreshCoins } from './ui.js';

export const RESPECT_COINS = 5;
export const AVENGE_COINS = 25;
const FRESH = 5 * 60000;   // friends' graves are read again at most this often
const MARKS_KEEP = 200;

/** `?graves=N`: N made-up friends with a grave on whatever map you're on and a buddy in the Plaza; nothing fetched or sent. */
const SAMPLE = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('graves');
export const sampleGraves = () => SAMPLE !== null;

/** A fall you can be shown: a starter the game knows, and never a secret one (Mewtwo) before it's yours. */
const showable = (f) => { const st = STARTERS_BY_ID[f.starter]; return !!st && (!st.secret || isStarterUnlocked(st)); };

/* ---------- yours: kept in the save, published small ---------- */

/** A run just lost (js/run.js's endRun()): kept in the save's last five and sent up. */
export function recordFall(fall) {
  const json = packFall(fall);
  if (!json) return;
  updateSave(d => { d.falls = addFall(d.falls, json); });
  publishGraves();
}

let publishing = null;
/** Writes graves/<you>: your name, buddy and last falls (signed in only). Never throws. */
export function publishGraves() {
  if (!cloudConfigured() || !cloudRemembered() || SAMPLE !== null) return Promise.resolve();
  return (publishing ||= (async () => {
    try {
      const s = await cloudSession();
      if (!s.user) return;
      const save = getSave(), doc = gravesDoc({ name: trainerName(), buddy: buddyKey(save), tier: cardTier(save).id, falls: save.falls });
      if (checkGraves(doc)) return;
      await s.F.setDoc(s.F.doc(s.db, GRAVES, s.user.uid), { ...doc, at: s.F.serverTimestamp() });
    } catch (err) { /* rules not published yet, or offline: friends just won't see these */ }
    finally { publishing = null; }
  })());
}

/* ---------- your friends': one small getDoc each, cached ---------- */

let cache = null;     // { at, list: [{ uid, name, buddy, tier, falls, at }] }
let loading = null;
let waiting = null;   // what to call once a fetch brings something new (the map's graves redrawn)

const atOf = (doc) => (typeof doc?.at?.toMillis === 'function' ? doc.at.toMillis() : +doc?.at || 0);

async function fetchFriends() {
  const s = await cloudSession();
  if (!s.user) return [];
  const uids = friendsOf(getSave(), s.user.uid);
  const got = await Promise.all(uids.map(uid => s.F.getDoc(s.F.doc(s.db, GRAVES, uid)).then(d => (d.exists() ? d.data() : null), () => null)));
  return uids.map((uid, i) => {
    const g = readGraves(got[i], atOf(got[i]));
    return g && { uid, ...g, falls: g.falls.filter(showable) };
  }).filter(Boolean);
}

/** Your friends' graves docs as last fetched; a stale cache starts a fetch, and `onReady` runs if it brings news. */
function friendsNow(onReady) {
  if (!cloudConfigured() || !cloudRemembered()) return [];
  waiting = onReady ?? waiting;
  if ((!cache || Date.now() - cache.at > FRESH) && !loading) {
    const was = JSON.stringify(cache?.list ?? []);
    loading = fetchFriends().catch(() => cache?.list ?? []).then(list => {
      cache = { at: Date.now(), list };
      loading = null;
      if (JSON.stringify(list) !== was) { const fn = waiting; waiting = null; fn?.(); }
    });
  }
  return cache?.list ?? [];
}

/* ---------- the sample (?graves=N) ---------- */

const SAMPLES = [
  { uid: 'sample1', name: 'MISTY', tier: 'gold', buddy: 'starter:squirtle', starter: 'squirtle', type: 'water' },
  { uid: 'sample2', name: 'BROCK', tier: 'silver', buddy: 'starter:bulbasaur:shiny', starter: 'bulbasaur', type: 'grass' },
  { uid: 'sample3', name: 'GARY', tier: 'violet', buddy: 'starter:charmander:2', starter: 'charmander', type: 'fire' },
  { uid: 'sample4', name: 'DAWN', tier: 'bronze', buddy: 'starter:cyndaquil', starter: 'charmander', type: 'fire' },
];
const sampleCount = () => Math.max(1, Math.min(SAMPLES.length, +SAMPLE || 3));

/** Made-up friends, each fallen on this map (`here`, `map`, `base` as gravesHere() takes them), a floor or two apart. */
function sampleFriends(here, map, base = 0) {
  return SAMPLES.slice(0, sampleCount()).map((s, i) => {
    const from = map ? Math.min(map.floors.length - 1, 1 + i * 2) : 0;
    const rows = map ? [...map.floors.slice(from), ...map.floors.slice(0, from).reverse()] : [];
    const nodes = rows.find(r => r.some(n => n.enemyId)) ?? map?.floors[from] ?? [];
    const node = nodes.find(n => n.enemyId) ?? nodes[0], row = map ? map.floors.indexOf(nodes) : 0;
    const foeId = node?.enemyId ?? '';
    const fall = {
      mode: here?.mode ?? 'run', land: here?.land ?? '', day: here?.day ?? '', biome: 0, floor: here?.mode === 'tower' ? base + row + 1 : row + 1,
      node: here?.mode === 'tower' ? String(Math.max(0, nodes.indexOf(node))) : node?.id ?? '', foeId, at: 1760000000000 + i,
      starter: s.starter, stage: i % 3, shiny: i === 1, type: s.type, level: i + 1, date: '2026-10-17', biomeName: here ? here.name : 'Whispering Clearing',
      place: null, kind: 'fight', foe: ENEMY_DEFS[foeId]?.name ?? '', move: '', hpTrail: [[40, 40, 0], [31, 40, 0], [18, 44, 0], [0, 44, 0]],
      deck: ['tackle', 'tackle', 'block', 'ember'], itemsUsed: ['potion'], fights: 4 + i, turns: 40, dealt: 300, taken: 120,
    };
    return { uid: s.uid, name: s.name, buddy: s.buddy, tier: s.tier, at: Date.now() - i * 3600000, falls: [readGraves({ name: s.name, falls: [packFall(fall)] }).falls[0]] };
  });
}

/* ---------- on the map ---------- */

/** The graves on this map now (gravesHere() in js/data/graves.js); `onReady` redraws them once a fetch lands. */
export function mapGraves(here, map, base, onReady) {
  return gravesHere(SAMPLE !== null ? sampleFriends(here, map, base) : friendsNow(onReady), here, map, base);
}

const tried = { r: new Set(), a: new Set() };   // a playtest's flowers and vengeance: shown on the stone, never saved

/** What you've done at graves: Sets of ids with flowers left (`r`) and avenged (`a`). */
export function graveMarks() {
  const m = getSave().graveMarks || {};
  return { r: new Set([...(m.r || []), ...tried.r]), a: new Set([...(m.a || []), ...tried.a]) };
}

function mark(kind, id) {
  updateSave(d => {
    d.graveMarks ??= { r: [], a: [] };
    d.graveMarks[kind] = [...(d.graveMarks[kind] || []).filter(x => x !== id), id].slice(-MARKS_KEEP);
  });
}

/** A vowed grave's Pokémon beaten: avenged, once a grave. Returns the line to tell, or null. `playtest` saves nothing. */
export function avengeGrave(vow, playtest = false) {
  if (!vow || graveMarks().a.has(vow.id)) return null;
  if (playtest) { tried.a.add(vow.id); return `⚔️ Avenged ${vow.name}! (A playtest: nothing saved.)`; }
  mark('a', vow.id);
  const coins = awardCoins(AVENGE_COINS);
  refreshCoins();
  return `⚔️ You avenged ${vow.name}! +${coins} PokéCoins.`;
}

/**
 * A grave's window: their loss recap, Pay respects and Avenge. `avenge` says what Avenge may do: null (their Pokémon
 * isn't ahead of you on this map), 'vowed' (already sworn) or a function that swears it. `onChange` redraws the stone.
 */
export function openGrave(g, { avenge = null, onChange = null, playtest = false } = {}) {
  const f = g.fall, mon = nameOf(f), marks = graveMarks();
  $('grave-title').textContent = `🪦 ${g.name}'s grave`;
  $('grave-sub').textContent = `${g.name}'s ${mon} fell here${f.date ? ` on ${dateOf(f.date)}` : ''}.`;
  $('grave-body').replaceChildren(...lossPage(f));
  const said = $('grave-said');
  said.textContent = '';
  const respect = $('grave-respect'), sworn = $('grave-avenge');
  const draw = () => {
    const m = graveMarks(), flowers = m.r.has(g.id), done = m.a.has(g.id);
    respect.textContent = flowers ? '💐 Flowers left' : '💐 Pay respects';
    respect.disabled = flowers;
    respect.title = flowers ? `You left flowers for ${g.name}.` : `Leave a few flowers for ${g.name}: +${RESPECT_COINS} PokéCoins, once a grave.`;
    sworn.textContent = done ? '⚔️ Avenged' : avenge === 'vowed' ? '⚔️ Vowed' : '⚔️ Avenge';
    sworn.disabled = done || typeof avenge !== 'function';
    sworn.title = done ? `You avenged ${g.name}.` : avenge === 'vowed' ? `Beat ${f.foe || 'the Pokémon that beat them'} on this map to avenge ${g.name}.`
      : typeof avenge === 'function' ? `Vow to beat ${f.foe || 'the Pokémon that beat them'} on this map: +${AVENGE_COINS} PokéCoins once you do.`
      : `${f.foe || 'The Pokémon that beat them'} isn't ahead of you on this map.`;
  };
  respect.onclick = () => {
    if (graveMarks().r.has(g.id)) return;
    playSound('item-get');
    if (playtest) { tried.r.add(g.id); said.textContent = 'You leave a few flowers. (A playtest: nothing saved.)'; } else {
      mark('r', g.id);
      const coins = awardCoins(RESPECT_COINS);
      refreshCoins();
      said.textContent = `You leave a few flowers for ${g.name}. +${coins} PokéCoins.`;
    }
    draw();
    onChange?.(g, 'r');
  };
  sworn.onclick = () => {
    if (typeof avenge !== 'function') return;
    playSound('confirm');
    avenge();
    avenge = 'vowed';
    said.textContent = `You vow to beat ${f.foe || 'the Pokémon that beat them'} for ${g.name}. Win that fight on this map for +${AVENGE_COINS} PokéCoins.`;
    draw();
    onChange?.(g, 'a');
  };
  draw();
  openDialog('grave-dialog');
  $('grave-body').scrollTop = 0;
  const m = trainerMon(`starter:${f.starter}:${f.stage}`);
  if (!m.masked) playCry(m.cry);
}

/* ---------- the Trainer Plaza's buddies ---------- */

/** What a friend's buddy says when tapped: whose it is and when they played, where their last run ended, and Visit. */
function buddyTalk(fr, mon) {
  const seen = lastSeen(fr.at), f = fr.falls.at(-1);
  const when = seen === 'Online just now' ? `${fr.name} is playing right now!` : seen.startsWith('Seen ') ? `${fr.name} last played ${seen.slice(5)}.` : '';
  const where = f && (f.mode === 'tower' ? `the Sky Pillar, on floor ${f.floor}` : f.mode === 'safari' ? `the Safari Zone's ${f.place || 'grass'}` : `${f.biomeName || 'a biome'}${f.floor ? `, floor ${f.floor}` : ''}`);
  return [
    `It's ${fr.name}'s ${mon.masked ? 'Pokémon' : mon.name}, out for a walk. ${when}`.trim(),
    f ? `It looks a little down. ${fr.name}'s ${nameOf(f)} fell in ${where}. ${f.mode === 'run' ? 'Pass that floor and you\'ll find their grave.' : `Their grave stands there ${f.mode === 'safari' ? 'for that day\'s Safari' : 'for that week\'s climb'}.`}`
      : `It hums happily. ${fr.name} hasn't lost a run lately.`,
    `You can walk round ${fr.name}'s Secret Base: tap Visit on their page in your Pokédex's Trainers app.`,
  ];
}

/** Up to `n` friends for the Plaza, on most lately first: { uid, name, tier, at, falls, mon, talk } (mon from their buddy
    key). Null signed out (no buddies then). Fetches if the cache is stale. */
export async function plazaBuddies(n = 4) {
  let list;
  if (SAMPLE !== null) list = sampleFriends(null, null);
  else {
    if (!cloudConfigured() || !cloudRemembered()) return null;
    friendsNow();
    await loading;
    list = cache?.list ?? [];
  }
  return [...list].sort((a, b) => b.at - a.at).slice(0, n).map(fr => { const mon = trainerMon(fr.buddy); return { ...fr, mon, talk: buddyTalk(fr, mon) }; });
}

export function initGraves() {
  if (!cloudConfigured()) return;
  onCloudSignIn(() => { publishGraves(); });
}

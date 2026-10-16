/* ============================================================
   ranger.js  -  the Safari Outfitter's Ranger Task Board (2026-10-16,
   the user's ask: a board that tracks things for players, catch so many
   for a piece of furniture, see the progress, then claim).

   Every task is counted from the save, nothing of its own but what the
   catches log (save.ranger.log) and which tasks are claimed
   (save.ranger.claimed). Three tabs: Field Research (the Safari Pokédex:
   how many caught, per area, per type, the rare spawns), Ball Mastery
   (catches with each ball) and Ranger Feats (catches in all, in a run,
   unhurt, at night, on turn 1, the Safari crossed, its bosses, days in a
   row). A claim pays PokéCoins, a ball pack, a Safari furniture piece
   (js/data/furniture.js's `ranger` source) or room for one more Safari
   catch to live in the Secret Base (rangerSlots()). Nothing here makes
   a first try score higher, so the leaderboard stays fair. Each claim is
   a step up the Ranger Ranks. Pure: node tests read it.
   ============================================================ */

import { SAFARI_DEX_PAGES, SAFARI_ROSTER } from './safari.js';
import { ENEMY_DEFS } from './enemies.js';
import { BALLS } from './balls.js';
import { towerWeek } from './tower.js';
import { hashString, makeRng, shuffled } from '../rng.js';

/** The board's tabs, in order. */
export const TABS = [
  { id: 'expeditions', name: 'Expeditions', icon: '🧭' },
  { id: 'research', name: 'Field Research', icon: '📖' },
  { id: 'balls', name: 'Ball Mastery', icon: '⚾' },
  { id: 'feats', name: 'Ranger Feats', icon: '🏅' },
];

/* The Safari furniture set, each earned by one task (js/base-furniture-safari.js paints them). */
export const RANGER_FURNITURE = [
  { kind: 'rangerflag', name: 'Ranger pennant', task: 'species-10' },
  { kind: 'safarilantern', name: 'Safari lantern', task: 'feat-night-5' },
  { kind: 'acacia', name: 'Acacia tree', task: 'species-50' },
  { kind: 'ballrack', name: 'Poké Ball rack', task: 'ball-every' },
  { kind: 'safarirug', name: 'Woven safari rug', task: 'rare-15' },
  { kind: 'expeditiontable', name: 'Expedition map table', task: 'feat-wins-5' },
  { kind: 'rangertent', name: 'Ranger tent', task: 'species-200' },
  { kind: 'safarijeep', name: 'Safari jeep', task: 'species-514' },
];
const FURNITURE_FOR = Object.fromEntries(RANGER_FURNITURE.map(f => [f.task, f]));

/** Ranks by tasks claimed. */
export const RANKS = [
  { at: 0, name: 'Rookie' }, { at: 5, name: 'Scout' }, { at: 15, name: 'Tracker' }, { at: 30, name: 'Ranger' },
  { at: 45, name: 'Senior Ranger' }, { at: 65, name: 'Chief Ranger' }, { at: 90, name: 'Master Ranger' },
];

const caughtSet = (save) => new Set(save.safariDex?.caught || []);
const log = (save) => save.ranger?.log || {};
const RARES = [...new Set(SAFARI_DEX_PAGES.flatMap(p => p.rare))];
const TYPE_NAMES = { normal: 'Normal', grass: 'Grass', fire: 'Fire', water: 'Water' };
const ofType = (t) => SAFARI_ROSTER.filter(id => ENEMY_DEFS[id]?.type === t);
const countIn = (ids, save) => { const c = caughtSet(save); return ids.filter(id => c.has(id)).length; };
// a photo for a task's note: the first of `ids` caught, or the first of them as a silhouette
const photo = (ids) => (save) => { const c = caughtSet(save); return { mon: ids.find(id => c.has(id)) ?? ids[0], seen: ids.some(id => c.has(id)) }; };
const coins = (n) => ({ coins: n });

function build() {
  const T = [];
  const add = (t) => T.push({ ...t, reward: FURNITURE_FOR[t.id] ? { kind: FURNITURE_FOR[t.id].kind, name: FURNITURE_FOR[t.id].name } : t.reward });

  // Field Research: the Safari Pokédex
  const total = SAFARI_ROSTER.length;
  const SPECIES = [[5, coins(100)], [10, null], [25, { slots: 1 }], [50, null], [100, { slots: 1 }], [150, coins(600)],
    [200, null], [300, { slots: 1 }], [400, coins(1500)], [total, null]];
  for (const [n, reward] of SPECIES) add({ id: `species-${n}`, tab: 'research', title: n === total ? 'Gotta catch \'em all' : `${n} different Pokémon`,
    text: n === total ? `Catch every one of the Safari's ${total} Pokémon.` : `Catch ${n} different Pokémon in the Safari Zone.`, goal: n,
    count: (s) => caughtSet(s).size, pic: photo(SAFARI_ROSTER.slice(0, 40)), reward: reward ?? coins(100) });
  for (const page of SAFARI_DEX_PAGES) for (const [n, reward] of [[10, coins(150)], [25, { balls: ['great', 5] }], [50, coins(400)]]) {
    add({ id: `area-${page.area}-${n}`, tab: 'research', title: `${page.name} survey ${n === 10 ? 'I' : n === 25 ? 'II' : 'III'}`,
      text: `Catch ${n} different Pokémon in the ${page.name}.`, goal: n, count: (s) => countIn(page.ids, s), pic: photo(page.ids), reward });
  }
  for (const [type, steps] of [['normal', [10, 50, 150]], ['grass', [10, 30, 60]], ['water', [10, 30, 60]], ['fire', [5, 12, 20]]]) {
    const ids = ofType(type);
    steps.forEach((n, i) => add({ id: `type-${type}-${n}`, tab: 'research', title: `${TYPE_NAMES[type]} specialist ${'I'.repeat(i + 1)}`,
      text: `Catch ${n} different ${TYPE_NAMES[type]}-type Pokémon.`, goal: n, count: (s) => countIn(ids, s), pic: photo(ids),
      reward: i === 2 ? coins(500) : i === 1 ? { balls: ['ultra', 5] } : coins(120) }));
  }
  for (const [n, reward] of [[1, coins(150)], [5, { balls: ['quick', 3] }], [15, null], [30, { slots: 1 }], [RARES.length, coins(2000)]]) {
    add({ id: `rare-${n}`, tab: 'research', title: n === 1 ? 'A rare sighting' : n === RARES.length ? 'Every rare spawn' : `${n} rare spawns`,
      text: n === 1 ? 'Catch a rare spawn before it runs off.' : `Catch ${n} different rare spawns.`, goal: n, count: (s) => countIn(RARES, s),
      pic: photo(RARES), reward: reward ?? coins(300) });
  }

  // Ball Mastery: catches with each ball
  for (const b of BALLS.filter(x => x.stock || x.free)) {
    const steps = b.free ? [25, 100, 300] : [1, 10];
    steps.forEach((n, i) => add({ id: `ball-${b.id}-${n}`, tab: 'balls', title: `${b.name} ${n === 1 ? 'debut' : `×${n}`}`,
      text: `Catch ${n === 1 ? 'a Pokémon' : `${n} Pokémon`} with ${n === 1 ? 'a' : ''}${n === 1 ? ` ${b.name}` : ` ${b.name}s`}.`.replace('  ', ' '), goal: n,
      count: (s) => log(s).balls?.[b.id] || 0, pic: () => ({ ball: b.id }),
      reward: b.free ? (i === 2 ? coins(800) : i === 1 ? { balls: ['ultra', 5] } : { balls: ['great', 5] }) : i ? coins(250) : { balls: [b.id, b.pack] } }));
  }
  add({ id: 'ball-master-1', tab: 'balls', title: 'Never misses', text: 'Catch a Pokémon with the Master Ball.', goal: 1,
    count: (s) => log(s).balls?.master || 0, pic: () => ({ ball: 'master' }), reward: coins(300) });
  const KINDS = BALLS.filter(x => !x.weekly).map(x => x.id);
  add({ id: 'ball-every', tab: 'balls', title: 'Every ball in the bag', text: `Catch a Pokémon with each of the ${KINDS.length} kinds of ball you can buy or are given.`,
    goal: KINDS.length, count: (s) => KINDS.filter(id => log(s).balls?.[id]).length, pic: () => ({ ball: 'great' }) });

  // Ranger Feats
  const feat = (id, title, text, goal, key, reward, pic = 'safari') => add({ id: `feat-${id}`, tab: 'feats', title, text, goal,
    count: typeof key === 'function' ? key : (s) => log(s)[key] || 0, pic: () => ({ ball: pic }), reward });
  for (const [n, r] of [[50, coins(200)], [200, { balls: ['ultra', 5] }], [500, coins(800)], [1000, { slots: 1 }]]) feat(`catches-${n}`, `${n} catches`, `Catch ${n} Pokémon in all (the same one again counts).`, n, 'catches', r);
  for (const [n, r] of [[5, coins(150)], [10, coins(300)], [15, { balls: ['ultra', 5] }], [20, coins(700)]]) feat(`run-${n}`, `${n} in one go`, `Catch ${n} Pokémon in a single Safari run.`, n, 'best', r, 'great');
  for (const [n, r] of [[1, coins(100)], [10, coins(300)], [50, coins(700)]]) feat(`flawless-${n}`, n === 1 ? 'Not a scratch' : `Not a scratch ×${n}`, `Catch ${n === 1 ? 'a Pokémon' : `${n} Pokémon`} without taking any damage in the fight.`, n, 'flawless', r, 'luxury');
  for (const [n, r] of [[1, coins(100)], [10, { balls: ['quick', 3] }]]) feat(`turn1-${n}`, n === 1 ? 'Quick draw' : 'Quick draw ×10', `Catch ${n === 1 ? 'a Pokémon' : `${n} Pokémon`} on a fight's first turn.`, n, 'turn1', r, 'quick');
  for (const [n, r] of [[5, null], [25, { balls: ['dusk', 3] }]]) feat(`night-${n}`, `Night watch${n > 5 ? ' ×25' : ''}`, `Catch ${n} Pokémon at night (your clock).`, n, 'night', r ?? coins(100), 'dusk');
  for (const [n, r] of [[1, coins(300)], [5, null], [20, { slots: 1 }]]) feat(`wins-${n}`, n === 1 ? 'Across the Safari' : `Across the Safari ×${n}`, `Cross the whole Safari Zone${n === 1 ? '' : ` ${n} times`}, its last boss beaten.`, n, 'wins', r ?? coins(300), 'ultra');
  for (const [n, r] of [[1, coins(150)], [10, coins(400)], [30, { balls: ['ultra', 5] }]]) feat(`bosses-${n}`, n === 1 ? 'Area boss' : `Area bosses ×${n}`, `Beat ${n === 1 ? 'an area\'s boss' : `${n} area bosses`} in the Safari Zone.`, n, 'bosses', r, 'timer');
  for (const [n, r] of [[3, coins(200)], [7, coins(500)], [14, { slots: 1 }], [30, coins(2000)]]) feat(`streak-${n}`, `${n} days running`, `Play the Safari Zone ${n} days in a row (UTC days).`, n, (s) => log(s).bestStreak || 0, r, 'net');
  for (const [n, r] of [[10, coins(300)], [30, coins(800)], [100, coins(2500)]]) feat(`days-${n}`, `${n} Safari days`, `Play the Safari Zone on ${n} different days.`, n, (s) => s.safari?.days ?? (s.safari?.day ? 1 : 0), r, 'premier');
  return T;
}

export const TASKS = build();
export const TASKS_BY_ID = Object.fromEntries(TASKS.map(t => [t.id, t]));

const claimedSet = (save) => new Set(save.ranger?.claimed || []);

/** A task's progress: how far (capped at its goal), its goal, done and claimed. */
export function progressOf(task, save) {
  const n = Math.min(task.goal, task.count(save));
  const claimed = claimedSet(save).has(task.id);
  return { n, goal: task.goal, done: n >= task.goal, claimed };
}

/* ---------- Expeditions: three goals a week ---------- */

/* Three goals a week (2026-10-16, the user's go-ahead), one a tier, the same for everyone that week: rolled from the
   week's seed (its Monday, UTC, like the Sky Pillar's and the weekly missions'), never two of one `group`. They count
   only what's caught that week (save.ranger.week, reset as a new week's first catch, boss, crossing or day comes in),
   and finishing all three pays a bonus. They pay PokéCoins and a ball pack; the Ranger Ranks count only the board's
   lasting tasks. */
const EXPEDITIONS = {
  easy: [
    { id: 'catch-15', group: 'catch', title: 'Survey sweep', text: 'Catch 15 Pokémon in the Safari Zone this week.', goal: 15, count: (w) => w.catches || 0, ball: 'safari' },
    { id: 'safari-12', group: 'ball', title: 'Standard issue', text: 'Catch 12 Pokémon with Safari Balls this week.', goal: 12, count: (w) => w.balls?.safari || 0, ball: 'safari' },
    { id: 'unhurt-4', group: 'unhurt', title: 'Light on your feet', text: 'Catch 4 Pokémon this week without taking damage in the fight.', goal: 4, count: (w) => w.flawless || 0, ball: 'luxury' },
    { id: 'days-2', group: 'days', title: 'Regular visitor', text: 'Play the Safari Zone on 2 days this week.', goal: 2, count: (w) => (w.days || []).length, ball: 'premier' },
    { id: 'normal-8', group: 'type', title: 'Common sightings', text: 'Catch 8 Normal-type Pokémon this week.', goal: 8, count: (w) => w.types?.normal || 0, ball: 'great' },
  ],
  medium: [
    { id: 'water-8', group: 'type', title: 'Wetland study', text: 'Catch 8 Water-type Pokémon this week.', goal: 8, count: (w) => w.types?.water || 0, ball: 'net' },
    { id: 'grass-8', group: 'type', title: 'Green survey', text: 'Catch 8 Grass-type Pokémon this week.', goal: 8, count: (w) => w.types?.grass || 0, ball: 'net' },
    { id: 'rare-2', group: 'rare', title: 'Rare tracks', text: 'Catch 2 rare spawns this week.', goal: 2, count: (w) => w.rare || 0, ball: 'quick' },
    { id: 'bosses-2', group: 'bosses', title: 'Big game', text: 'Beat 2 area bosses in the Safari Zone this week.', goal: 2, count: (w) => w.bosses || 0, ball: 'timer' },
    { id: 'days-4', group: 'days', title: 'Out most days', text: 'Play the Safari Zone on 4 days this week.', goal: 4, count: (w) => (w.days || []).length, ball: 'premier' },
    { id: 'bought-3', group: 'ball', title: 'Better gear', text: 'Catch 3 Pokémon this week with balls you bought (not Safari Balls).', goal: 3,
      count: (w) => Object.entries(w.balls || {}).reduce((n, [id, k]) => n + (id === 'safari' ? 0 : k), 0), ball: 'ultra' },
    { id: 'night-3', group: 'night', title: 'Night shift', text: 'Catch 3 Pokémon at night this week (your clock).', goal: 3, count: (w) => w.night || 0, ball: 'dusk' },
  ],
  hard: [
    { id: 'catch-40', group: 'catch', title: 'Full field season', text: 'Catch 40 Pokémon in the Safari Zone this week.', goal: 40, count: (w) => w.catches || 0, ball: 'ultra' },
    { id: 'bosses-5', group: 'bosses', title: 'Trophy hunter', text: 'Beat 5 area bosses in the Safari Zone this week.', goal: 5, count: (w) => w.bosses || 0, ball: 'timer' },
    { id: 'cross-1', group: 'bosses', title: 'The long trek', text: 'Cross the whole Safari Zone this week, its last boss beaten.', goal: 1, count: (w) => w.wins || 0, ball: 'ultra' },
    { id: 'rare-4', group: 'rare', title: 'Rare collector', text: 'Catch 4 rare spawns this week.', goal: 4, count: (w) => w.rare || 0, ball: 'quick' },
    { id: 'fire-4', group: 'type', title: 'Heat wave', text: 'Catch 4 Fire-type Pokémon this week.', goal: 4, count: (w) => w.types?.fire || 0, ball: 'dusk' },
    { id: 'unhurt-12', group: 'unhurt', title: 'Untouchable', text: 'Catch 12 Pokémon this week without taking damage in the fight.', goal: 12, count: (w) => w.flawless || 0, ball: 'luxury' },
  ],
};
const TIER_PAY = { easy: 200, medium: 350, hard: 600 };
export const EXPEDITION_BONUS = { balls: ['ultra', 5] };

/** The week an expedition belongs to: its Monday (UTC), "YYYY-MM-DD". */
export const expeditionWeek = (date = new Date()) => towerWeek(date);

/** The week's three goals as board tasks, hard first in the roll so the others never share its group, then the bonus
    for all three. */
export function expeditionTasks(week = expeditionWeek()) {
  const rng = makeRng(hashString(`expeditions:${week}`)), groups = new Set(), out = [];
  for (const tier of ['hard', 'medium', 'easy']) {
    const pick = shuffled(EXPEDITIONS[tier], rng).find(e => !groups.has(e.group)) ?? EXPEDITIONS[tier][0];
    groups.add(pick.group);
    out.push({ id: `exp:${week}:${pick.id}`, tab: 'expeditions', tier, title: pick.title, text: pick.text, goal: pick.goal,
      count: (s) => (s.ranger?.week?.key === week ? pick.count(s.ranger.week) : 0), pic: () => ({ ball: pick.ball }), reward: { coins: TIER_PAY[tier] } });
  }
  out.reverse();
  const three = [...out];
  out.push({ id: `exp:${week}:all`, tab: 'expeditions', tier: 'bonus', title: 'Expedition complete', text: 'Finish all three of this week\'s expeditions.',
    goal: 3, count: (s) => three.filter(t => t.count(s) >= t.goal).length, pic: () => ({ ball: 'ultra' }), reward: EXPEDITION_BONUS });
  return out;
}

/** The week's tally, started afresh when a new week's first thing comes in. */
const weekOf = (prev, week) => (prev?.key === week ? prev : { key: week });

/** A Safari catch, for the week's expeditions: its type, whether it was rare, at night, unhurt, and the ball. */
export function logWeekCatch(prev, week, { id, ball, night, flawless, rare }) {
  const w = weekOf(prev, week), type = ENEMY_DEFS[id]?.type;
  return { ...w, catches: (w.catches || 0) + 1, balls: { ...(w.balls || {}), ...(ball ? { [ball]: (w.balls?.[ball] || 0) + 1 } : {}) },
    types: { ...(w.types || {}), ...(type ? { [type]: (w.types?.[type] || 0) + 1 } : {}) },
    rare: (w.rare || 0) + (rare ? 1 : 0), night: (w.night || 0) + (night ? 1 : 0), flawless: (w.flawless || 0) + (flawless ? 1 : 0) };
}

/** A boss beaten or the Safari crossed this week. */
export const logWeekTick = (prev, week, key) => { const w = weekOf(prev, week); return { ...w, [key]: (w[key] || 0) + 1 }; };

/** A Safari day played this week (each UTC day once). */
export const logWeekDay = (prev, week, day) => { const w = weekOf(prev, week); return (w.days || []).includes(day) ? w : { ...w, days: [...(w.days || []), day] }; };

/** The tasks on a tab: this week's expeditions, or the board's lasting ones. */
export const tasksOn = (tab, now = new Date()) => (tab === 'expeditions' ? expeditionTasks(expeditionWeek(now)) : TASKS.filter(t => t.tab === tab));

/** Any task on the board, by id: a lasting one or one of this week's expeditions. */
export const taskById = (id, now = new Date()) => TASKS_BY_ID[id] ?? expeditionTasks(expeditionWeek(now)).find(t => t.id === id) ?? null;

/** Tasks done and not yet claimed, this week's expeditions too: the board's "!". */
export const readyTasks = (save, now = new Date()) => [...expeditionTasks(expeditionWeek(now)), ...TASKS].filter(t => { const p = progressOf(t, save); return p.done && !p.claimed; });

/** How many more Safari catches can live in the Secret Base, from claimed tasks. */
export const rangerSlots = (save) => (save.ranger?.claimed || []).reduce((n, id) => n + (TASKS_BY_ID[id]?.reward?.slots || 0), 0);

/** The rank the save's claims have reached, and the next. */
export function rankOf(save) {
  const n = (save.ranger?.claimed || []).filter(id => TASKS_BY_ID[id]).length;
  let i = 0;
  while (i + 1 < RANKS.length && n >= RANKS[i + 1].at) i++;
  return { n, rank: RANKS[i], next: RANKS[i + 1] ?? null, level: i + 1 };
}

/** A reward in words. */
export function rewardText(r) {
  if (r.coins) return `${r.coins.toLocaleString()} PokéCoins`;
  if (r.balls) { const b = BALLS.find(x => x.id === r.balls[0]); return `${r.balls[1]} ${b.name}s`; }
  if (r.slots) return `Room for ${r.slots} more Pokémon in your Secret Base`;
  if (r.kind) return `${r.name} for your Secret Base`;
  return '';
}

/** One caught Pokémon logged for the board: the ball, whether it was night, on the fight's first turn and without a
    scratch, and how many this run has caught so far. Returns the new log. */
export function logCatch(prev = {}, { ball, night, turn, flawless, inRun }) {
  const out = { ...prev, balls: { ...(prev.balls || {}) } };
  out.catches = (out.catches || 0) + 1;
  if (ball) out.balls[ball] = (out.balls[ball] || 0) + 1;
  if (night) out.night = (out.night || 0) + 1;
  if (turn === 1) out.turn1 = (out.turn1 || 0) + 1;
  if (flawless) out.flawless = (out.flawless || 0) + 1;
  out.best = Math.max(out.best || 0, inRun || 0);
  return out;
}

/** A Safari day started: the days-in-a-row streak, counted once a UTC day. */
export function logDay(prev = {}, day) {
  if (prev.lastDay === day) return prev;
  const yesterday = new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  const streak = prev.lastDay === yesterday ? (prev.streak || 0) + 1 : 1;
  return { ...prev, lastDay: day, streak, bestStreak: Math.max(prev.bestStreak || 0, streak) };
}

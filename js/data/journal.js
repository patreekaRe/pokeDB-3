/* ============================================================
   journal.js  -  the Trainer's Journal (2026-10-16, the user's go-ahead
   for "the same board for the whole game"): the Ranger Task Board's
   engine (js/data/ranger.js, js/ranger.js) at the Clearing's PC, its
   tasks the main game's: runs won, Trainer Levels, bosses and Alphas,
   every Gym Leader, the towns' Waystones, the Pokédex, Kenmatta's dojo,
   the Sky Pillar and what you've collected.

   Every task counts what the save already keeps, so an old save has
   its progress on day one, and only the claims are new
   (save.journal.claimed). Claims pay PokéCoins and climb the Journal
   Ranks, each rank past the first a badge on the Trainer Card. Pure:
   node tests read it.

   Rebalanced 2026-10-16 (the user: 84,000 PokéCoins in all was
   "excessive"; it was several times everything coins buy, and an old
   save's day-one claims alone would empty the shop): about a third of
   it now (`pay()`), and the big milestones give a Trainer furniture
   piece instead (JOURNAL_FURNITURE), four of them filling in by
   themselves as you play (js/base-furniture-trainer.js).
   ============================================================ */

import { STARTERS, STARTERS_BY_ID } from './starters.js';
import { GYM_LEADERS } from './gym.js';
import { TOWNS, townState, mended } from './towns.js';
import { DEX_PAGES, BONUS_PAGES } from './pokedex.js';
import { starsOf, kenWinsOf, TRIALS } from './dojo.js';
import { guardiansBeaten, towerWeeks } from './badges.js';
import { rankOf as rangerRank, RANKS as RANGER_RANKS } from './ranger.js';
import { JOURNAL_RANKS } from './journal-ranks.js';

export const JOURNAL_TABS = [
  { id: 'runs', name: 'Runs', icon: '🗺️' },
  { id: 'world', name: 'World', icon: '🏘️' },
  { id: 'pillar', name: 'Sky Pillar', icon: '🗼' },
  { id: 'collection', name: 'Collection', icon: '🏆' },
];

export { JOURNAL_RANKS };

const sum = (o) => Object.values(o || {}).reduce((n, v) => n + (+v || 0), 0);
const st = (s) => s.stats || {};
const winsOfType = (s, type) => Object.entries(st(s).winsBy || {}).reduce((n, [id, k]) => n + (STARTERS_BY_ID[id]?.type === type ? k : 0), 0);
const TYPE_NAME = { fire: 'Fire', water: 'Water', grass: 'Grass' };
const TYPE_ICON = { fire: '🔥', water: '💧', grass: '🌿' };
const TOWN_IDS = Object.keys(TOWNS);
const PAGES = DEX_PAGES.length + BONUS_PAGES.length;
/* A third of what was first set (rounded to 25, 50 at least), so the whole Journal pays about 28,000 PokéCoins. */
const pay = (n) => Math.max(50, Math.round(n / 3 / 25) * 25);
const coins = (n) => ({ coins: pay(n) });

/* The Trainer set: a piece for a milestone, never sold (js/data/furniture.js's `journal` source). The trophy case, the
   Gym Leader case, the Sky Pillar model and the Hall of Fame plaque come early and fill in by themselves. */
export const JOURNAL_FURNITURE = [
  { kind: 'trophycase', name: 'Trophy case', task: 'wins-1' },
  { kind: 'gymcase', name: 'Gym Leader case', task: 'gym-first' },
  { kind: 'pillarmodel', name: 'Sky Pillar model', task: 'floor-10' },
  { kind: 'fameplaque', name: 'Hall of Fame plaque', task: 'fame-1' },
  { kind: 'goldpokedex', name: 'Gold Pokédex stand', task: `pages-${DEX_PAGES.length + BONUS_PAGES.length}` },
  { kind: 'dojobanner', name: 'Dojo banner', task: `dojo-${TRIALS.length}` },
];
const FURNITURE_FOR = Object.fromEntries(JOURNAL_FURNITURE.map(f => [f.task, f]));

function build() {
  const T = [];
  const series = (tab, id, steps, make) => steps.forEach(([n, pay], i) => T.push({ tab, store: 'journal', goal: n, reward: coins(pay), ...make(n, i), id: `${id}-${n}` }));

  // Runs
  series('runs', 'wins', [[1, 150], [5, 300], [10, 500], [25, 900], [50, 1500], [100, 2500]], (n) => ({
    title: n === 1 ? 'First victory' : `${n} wins`, text: `Win ${n === 1 ? 'a run' : `${n} runs`}, at any Trainer Level.`, count: (s) => st(s).runsWon || 0, pic: () => ({ emoji: '🏁' }) }));
  for (const type of ['fire', 'water', 'grass']) series('runs', `wins-${type}`, [[1, 150], [5, 400], [15, 900]], (n) => ({
    title: `${TYPE_NAME[type]} trainer${n > 1 ? ` ×${n}` : ''}`, text: `Win ${n === 1 ? 'a run' : `${n} runs`} with a ${TYPE_NAME[type]}-type starter.`, count: (s) => winsOfType(s, type), pic: () => ({ emoji: TYPE_ICON[type] }) }));
  series('runs', 'level', [[1, 200], [2, 300], [3, 500], [4, 700], [5, 1000], [10, 2000]], (n) => ({
    title: `Trainer Level ${n}`, text: `Unlock Trainer Level ${n} by winning on the Level before it.`, count: (s) => s.maxLevel || 0, pic: () => ({ emoji: '⭐' }) }));
  series('runs', 'level5', [[1, 800], [5, 1500], [15, 3000]], (n) => ({
    title: n === 1 ? 'Gold star' : `Gold stars ×${n}`, text: `Win ${n === 1 ? 'a run' : `${n} runs`} on Trainer Level 5.`, count: (s) => sum(st(s).level5WinsBy), pic: () => ({ emoji: '🌟' }) }));
  series('runs', 'foes', [[100, 150], [500, 400], [1000, 700], [2500, 1200], [5000, 2000]], (n) => ({
    title: `${n.toLocaleString()} knocked out`, text: `Defeat ${n.toLocaleString()} wild Pokémon, Alphas and bosses in all.`, count: (s) => st(s).enemiesDefeated || 0, pic: () => ({ emoji: '💥' }) }));
  series('runs', 'alphas', [[10, 200], [50, 500], [150, 1000]], (n) => ({
    title: `Alpha hunter${n > 10 ? ` ×${n}` : ''}`, text: `Defeat ${n} Alphas.`, count: (s) => st(s).elitesDefeated || 0, pic: () => ({ emoji: '👹' }) }));
  series('runs', 'bosses', [[3, 200], [15, 500], [50, 1200]], (n) => ({
    title: `Boss breaker${n > 3 ? ` ×${n}` : ''}`, text: `Beat ${n} biome bosses in all.`, count: (s) => sum(st(s).bossKills), pic: () => ({ emoji: '👑' }) }));
  series('runs', 'streak', [[3, 400], [5, 800], [10, 2000]], (n) => ({
    title: `On a roll ×${n}`, text: `Win ${n} runs in a row on Trainer Level 2 or higher.`, count: (s) => st(s).bestStreak || 0, pic: () => ({ emoji: '🔥' }) }));
  series('runs', 'fame', [[1, 500], [5, 1200], [20, 3000]], (n) => ({
    title: n === 1 ? 'Hall of Famer' : `Hall of Fame ×${n}`, text: `Enter the Hall of Fame${n === 1 ? '' : ` ${n} times`}: win on Trainer Level 5.`, count: (s) => (s.hallOfFame || []).length, pic: () => ({ emoji: '🏛️' }) }));

  // World: the Gym Leaders, the towns, the Pokédex, Kenmatta
  for (const l of GYM_LEADERS) T.push({ tab: 'world', store: 'journal', id: `gym-${l.id}`, goal: 1, reward: coins(250),
    title: `${l.name}'s ${l.badge}`, text: `Beat Gym Leader ${l.name} in a run.`, count: (s) => s.gym?.[l.id] || 0, pic: () => ({ src: l.sprite }) });
  T.push({ tab: 'world', store: 'journal', id: 'gym-first', goal: 1, reward: coins(300), title: 'A Gym Leader falls',
    text: 'Beat your first Gym Leader in a run.', count: (s) => GYM_LEADERS.filter(l => (s.gym?.[l.id] || 0) > 0).length, pic: () => ({ emoji: '🏅' }) });
  T.push({ tab: 'world', store: 'journal', id: 'gym-all', goal: GYM_LEADERS.length, reward: coins(2500), title: 'Every Gym Leader',
    text: `Beat all ${GYM_LEADERS.length} Gym Leaders.`, count: (s) => GYM_LEADERS.filter(l => (s.gym?.[l.id] || 0) > 0).length, pic: () => ({ emoji: '🏅' }) });
  series('world', 'towns', [[1, 400], [3, 900], [TOWN_IDS.length, 2000]], (n) => ({
    title: n === TOWN_IDS.length ? 'Every Waystone' : `Waystones mended ×${n}`, text: n === 1 ? 'Mend a town\'s Waystone.' : `Mend ${n} towns' Waystones.`,
    count: (s) => TOWN_IDS.filter(id => mended(townState(s, id))).length, pic: () => ({ emoji: '💠' }) }));
  series('world', 'pages', [[1, 300], [3, 800], [PAGES, 2000]], (n) => ({
    title: n === PAGES ? 'Every Pokédex page' : `Pokédex pages ×${n}`, text: `Finish ${n === 1 ? 'a page' : `${n} pages`} of the Pokédex's research.`,
    count: (s) => (s.dex?.done || []).length, pic: () => ({ emoji: '📕' }) }));
  series('world', 'research', [[25, 200], [60, 500], [100, 1000]], (n) => ({
    title: `${n} Pokémon beaten`, text: `Defeat ${n} different Pokémon in runs (the Pokédex counts them).`, count: (s) => (s.dex?.defeated || []).length, pic: () => ({ emoji: '🔍' }) }));
  series('world', 'dojo', [[3, 300], [10, 800], [TRIALS.length, 2000]], (n) => ({
    title: n === TRIALS.length ? 'Every dojo star' : `Dojo stars ×${n}`, text: `Earn ${n} stars in Kenmatta's dojo trials.`, count: starsOf, pic: () => ({ emoji: '🥋' }) }));
  series('world', 'ken', [[1, 400], [3, 1000]], (n) => ({
    title: n === 1 ? 'Chad slayer' : 'Chad slayer ×3', text: `Beat Kenmatta${n === 1 ? '' : ' 3 times'} in a run's ? room.`, count: kenWinsOf, pic: () => ({ emoji: '💪' }) }));

  // The Sky Pillar
  series('pillar', 'floor', [[10, 200], [25, 400], [50, 800], [75, 1200], [100, 2500]], (n) => ({
    title: n === 100 ? 'The top of the Pillar' : `Floor ${n}`, text: `Reach floor ${n} of the Sky Pillar.`, count: (s) => s.tower?.bestEver || 0, pic: () => ({ emoji: '🗼' }) }));
  series('pillar', 'guardians', [[5, 300], [25, 800], [50, 1500]], (n) => ({
    title: `Guardians ×${n}`, text: `Defeat ${n} Sky Pillar guardians, over any climbs.`, count: (s) => guardiansBeaten(s), pic: () => ({ emoji: '🛡️' }) }));
  series('pillar', 'summits', [[1, 1000], [3, 2500]], (n) => ({
    title: n === 1 ? 'Summit' : 'Summit ×3', text: `Reach the top of the Sky Pillar${n === 1 ? '' : ' 3 times'}.`, count: (s) => s.tower?.summits || 0, pic: () => ({ emoji: '☁️' }) }));
  series('pillar', 'weeks', [[4, 400], [12, 1200]], (n) => ({
    title: `${n} weeks climbing`, text: `Climb the Sky Pillar in ${n} different weeks.`, count: (s) => towerWeeks(s), pic: () => ({ emoji: '📅' }) }));

  // Collection
  series('collection', 'starters', [[5, 300], [10, 600], [20, 1200], [STARTERS.length, 3000]], (n) => ({
    title: n === STARTERS.length ? 'Every starter' : `${n} starters`, text: `Own ${n} starters, unlocked or bought.`, count: (s) => STARTERS.filter(x => x.free || (s.unlocked || []).includes(x.id)).length, pic: () => ({ emoji: '🎒' }) }));
  series('collection', 'shinies', [[1, 300], [5, 800], [15, 2000]], (n) => ({
    title: n === 1 ? 'A shiny' : `${n} shinies`, text: `Own ${n === 1 ? 'a shiny starter' : `${n} shiny starters`}.`, count: (s) => (s.shiny?.owned || []).length, pic: () => ({ emoji: '✨' }) }));
  series('collection', 'badges', [[10, 200], [25, 400], [50, 800], [100, 1500], [150, 3000]], (n) => ({
    title: `${n} badges`, text: `Earn ${n} badges for your Trainer Card's Badge Case.`, count: (s) => (s.badges || []).length, pic: () => ({ emoji: '🎖️' }) }));
  series('collection', 'coins', [[5000, 300], [25000, 800], [100000, 2000]], (n) => ({
    title: `${n.toLocaleString()} coins earned`, text: `Earn ${n.toLocaleString()} PokéCoins in all, spent or not.`, count: (s) => st(s).coinsEarned || 0, pic: () => ({ emoji: '🪙' }) }));
  series('collection', 'safari', [[50, 400], [200, 1000]], (n) => ({
    title: `Safari catches ×${n}`, text: `Catch ${n} different Pokémon in the Safari Zone.`, count: (s) => (s.safariDex?.caught || []).length, pic: () => ({ emoji: '🦺' }) }));
  const ranger = RANGER_RANKS.find(r => r.name === 'Ranger');
  T.push({ tab: 'collection', store: 'journal', id: 'ranger-rank', goal: ranger.at, reward: coins(800), title: 'A true Ranger',
    text: 'Reach the rank of Ranger on the Safari Outfitter\'s Ranger Task Board.', count: (s) => rangerRank(s).n, pic: () => ({ emoji: '📋' }) });
  // a milestone with a Trainer piece gives it in place of its PokéCoins
  return T.map(t => (FURNITURE_FOR[t.id] ? { ...t, reward: { kind: FURNITURE_FOR[t.id].kind, name: FURNITURE_FOR[t.id].name } } : t));
}

export const JOURNAL_TASKS = build();
export const JOURNAL_BY_ID = Object.fromEntries(JOURNAL_TASKS.map(t => [t.id, t]));

const claimedSet = (save) => new Set(save.journal?.claimed || []);

/** A task's progress: how far (capped at its goal), its goal, done and claimed. */
export function journalProgress(task, save) {
  const n = Math.min(task.goal, task.count(save));
  return { n, goal: task.goal, done: n >= task.goal, claimed: claimedSet(save).has(task.id) };
}

/** Journal tasks done and not yet claimed: the PC's "!". */
export const journalReady = (save) => JOURNAL_TASKS.filter(t => { const p = journalProgress(t, save); return p.done && !p.claimed; });

/** The Journal Rank the save's claims have reached, and the next. */
export function journalRank(save) {
  const n = (save.journal?.claimed || []).filter(id => JOURNAL_BY_ID[id]).length;
  let i = 0;
  while (i + 1 < JOURNAL_RANKS.length && n >= JOURNAL_RANKS[i + 1].at) i++;
  return { n, rank: JOURNAL_RANKS[i], next: JOURNAL_RANKS[i + 1] ?? null, level: i + 1 };
}

/** The trophy case's twelve trophies, in shelf order: each milestone's name and whether the save has it (the case
    fills in by itself, js/base-furniture-trainer.js). */
export function trophies(save) {
  const s = save.stats || {}, pages = DEX_PAGES.length + BONUS_PAGES.length;
  return [
    ['First win', (s.runsWon || 0) >= 1], ['10 wins', (s.runsWon || 0) >= 10], ['25 wins', (s.runsWon || 0) >= 25],
    ['50 wins', (s.runsWon || 0) >= 50], ['100 wins', (s.runsWon || 0) >= 100], ['Gold star', sum(s.level5WinsBy) >= 1],
    ['Hall of Fame', (save.hallOfFame || []).length >= 1], ['Every Gym Leader', GYM_LEADERS.every(l => (save.gym?.[l.id] || 0) > 0)],
    ['Sky Pillar summit', (save.tower?.summits || 0) >= 1], ['Every dojo star', starsOf(save) >= TRIALS.length],
    ['Every Pokédex page', (save.dex?.done || []).length >= pages], ['Grand Champion', journalRank(save).rank === JOURNAL_RANKS.at(-1)],
  ].map(([name, got]) => ({ name, got }));
}

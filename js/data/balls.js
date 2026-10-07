/* ============================================================
   balls.js  -  catching in the Safari Zone (docs/reference/safari.md).

   Every wild fight in a Safari run shows a Throw button. A throw costs 1 PP
   and ends your turn; a miss and the Pokémon acts. Like the games, a throw
   at full HP is a long shot and the odds climb steadily as its HP drops (a curve,
   CATCH_BASE). They rise with the ball too, your debuffs on
   it (Burn, Leech Seed, Weak, Sap: the games' sleep and paralysis bonus,
   so every type can help) and Bait; a rare spawn is harder.

   catchChance() is pure (tests/catch.test.mjs pins it down); battle.js
   rolls it on the Safari seed (js/rng.js), so a throw is the same for
   everyone who throws the same ball on the same turn.
   ============================================================ */

/** What a throw costs (and it ends your turn). */
export const THROW_PP = 1;
/** The base odds with a plain Safari Ball: CATCH_BASE.full at full HP, rising to CATCH_BASE.low near 0 along
    (1 - HP share)^CATCH_BASE.curve: ~32% at half (yellow), ~56% at a fifth (red). It was cubic (13% / 38%) until
    2026-10-04, which felt far harsher than the games, whose odds climb in a straight line as HP falls. */
export const CATCH_BASE = { full: 0.08, low: 0.75, curve: 1.5 };
/** No ball but the Master Ball is ever sure. */
export const CATCH_CAP = 0.95;
/** Each kind of debuff on it (Burn, Leech Seed, Weak, Sap) adds this to the ball's multiplier. */
export const DEBUFF_BONUS = 0.25;
/** Bait: each one adds this to the multiplier, and its attacks deal BAIT_DAMAGE more. */
export const BAIT = { bonus: 0.5, damage: 3 };
/** Rock: each one gives a wild Pokémon this chance to run off at the start of its turn (a rare spawn just leaves a turn sooner). */
export const ROCK_FLEE = 0.15;
/** Rare spawns: the odds a Safari wild room holds one (rolled per room on the biome's seed), how many of its turns it
    stays before it runs off, and its catch multiplier. */
export const RARE = { odds: 0.12, turns: 4, mult: 0.5 };
/** Every Safari run, the daily try and each replay, starts with this many Safari Balls (the user's call, 2026-10-07). */
export const SAFARI_BALLS = 30;
/** PokéCoins for the Day Pass: replays of today's Safari until the UTC day turns. The daily try is free. */
export const DAY_PASS = 100;

/** A catch pays this share of a knockout's ₽ (it pays in a card and a Pokédex entry instead). */
export const CATCH_PRIZE = 0.5;
/** The Luxury Ball's extra PokéCoins on a catch. */
export const LUXURY_COINS = 10;

/**
 * The balls. `stock`: a consumable bought in packs at the Game Corner (save.balls[id]); the Master Ball is bought once and gives one throw a UTC week; the Safari Ball is free, SAFARI_BALLS a run.
 * `mult(ctx)` is the ball's multiplier for a throw: ctx = { night, turn, type } (the wild Pokémon's type).
 */
export const BALLS = [
  { id: 'safari', name: 'Safari Ball', sprite: 'safari-ball', free: true,
    text: `The Safari Zone's own ball. Every run starts with ${SAFARI_BALLS}.`, mult: () => 1 },
  { id: 'great', name: 'Great Ball', sprite: 'great-ball', stock: true, pack: 5, cost: 40,
    text: 'Better odds than a Safari Ball (x1.5). Used up when thrown.', mult: () => 1.5 },
  { id: 'ultra', name: 'Ultra Ball', sprite: 'ultra-ball', stock: true, pack: 5, cost: 90,
    text: 'Even better odds (x2). Used up when thrown.', mult: () => 2 },
  { id: 'dusk', name: 'Dusk Ball', sprite: 'dusk-ball', stock: true, pack: 3, cost: 150,
    text: 'x3 at night (your clock), x1 otherwise. Used up when thrown.', mult: (c) => (c.night ? 3 : 1) },
  { id: 'quick', name: 'Quick Ball', sprite: 'quick-ball', stock: true, pack: 3, cost: 150,
    text: 'x4 in a fight\'s first 3 turns, x1 after. Used up when thrown.', mult: (c) => (c.turn <= 3 ? 4 : 1) },
  { id: 'timer', name: 'Timer Ball', sprite: 'timer-ball', stock: true, pack: 3, cost: 150,
    text: 'Better the longer the fight: x1 on turn 1, +0.25 a turn, up to x3. Used up when thrown.', mult: (c) => Math.min(3, 1 + 0.25 * (c.turn - 1)) },
  { id: 'net', name: 'Net Ball', sprite: 'net-ball', stock: true, pack: 3, cost: 150,
    text: 'x3 on Water and Grass Pokémon, x1 otherwise. Used up when thrown.', mult: (c) => (c.type === 'water' || c.type === 'grass' ? 3 : 1) },
  { id: 'luxury', name: 'Luxury Ball', sprite: 'luxury-ball', stock: true, pack: 3, cost: 100,
    text: `Plain odds (x1), but a catch pays ${LUXURY_COINS} more PokéCoins. Used up when thrown.`, mult: () => 1 },
  { id: 'master', name: 'Master Ball', sprite: 'master-ball', weekly: true, cost: 1500,
    text: 'Never misses, even on a rare spawn. One throw a week (UTC, from Monday).', mult: () => Infinity },
];
export const BALLS_BY_ID = Object.fromEntries(BALLS.map(b => [b.id, b]));

/** The base odds at a share of max HP. */
export function baseOdds(hpFrac) {
  const lost = Math.max(0, Math.min(1, 1 - hpFrac));
  return CATCH_BASE.full + (CATCH_BASE.low - CATCH_BASE.full) * Math.pow(lost, CATCH_BASE.curve);
}

/**
 * The chance a throw catches, 0-1. `debuffs` counts the kinds of debuff on it (Burn, Leech Seed, Weak, Sap), `bait`
 * the Bait thrown at it, `rare` a rare spawn. Multipliers work like the games' catch rate: the chance of a miss is
 * raised to the multiplier's power, so better balls help a lot at low odds and never quite reach a sure thing.
 */
export function catchChance({ hpFrac, ball = 'safari', turn = 1, night = false, type = 'normal', debuffs = 0, bait = 0, rare = false }) {
  if (hpFrac <= 0) return 0;
  const def = BALLS_BY_ID[ball] ?? BALLS_BY_ID.safari;
  const mult = def.mult({ night, turn, type });
  if (mult === Infinity) return 1;
  const total = mult * (1 + DEBUFF_BONUS * debuffs) * (1 + BAIT.bonus * bait) * (rare ? RARE.mult : 1);
  return Math.min(CATCH_CAP, 1 - Math.pow(1 - baseOdds(hpFrac), total));
}

/** The UTC week a date is in, "YYYY-Www" (ISO weeks start on Monday): the Master Ball's one throw a week. */
export function ballWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);   // the week's Thursday decides its year
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** The balls a save can throw right now, each with how many are left; `safari` is the run's Safari Balls left. */
export function ballsInBag(balls, week = ballWeek(), safari = SAFARI_BALLS) {
  return BALLS.map(b => ({ ball: b, left: b.free ? safari
    : b.stock ? balls[b.id] || 0
      : balls.owned.includes(b.id) && balls.masterWeek !== week ? 1 : 0 }))
    .filter(x => x.left > 0);
}

/** Times the Master Ball has been thrown (`masterThrows`, counted since its badge); an older save that ever threw it
    threw it once. */
/** The run's Safari Balls left: kept in the save as they're thrown (an old saved run without it starts full). */
export const safariBallsLeft = (safari = {}) => safari.balls ?? SAFARI_BALLS;

/** Whether today's Safari can be started: the day's first try is free, a replay needs the day's pass. */
export const safariAccess = (safari = {}, day) => (safari.day !== day || !safari.tries ? 'first' : safari.pass === day ? 'pass' : 'locked');

export const masterThrows = (balls = {}) => balls.masterThrows ?? (balls.masterWeek ? 1 : 0);

/** Throws given for a special ball bought back when it was a one-time unlock (300 coins, thrown freely). */
export const UNLOCK_REFUND = 10;

/** Saves from before the special balls came in packs: an owned Dusk / Quick / Timer / Net / Luxury Ball becomes
    UNLOCK_REFUND throws of it; `owned` keeps only the Master Ball. */
export function migrateBalls(balls) {
  const gone = balls.owned.filter(id => BALLS_BY_ID[id]?.stock);
  if (!gone.length) return balls;
  const out = { ...balls, owned: balls.owned.filter(id => !gone.includes(id)) };
  for (const id of gone) out[id] = (out[id] || 0) + UNLOCK_REFUND;
  return out;
}

/* ============================================================
   gym.js  -  the Gym Leaders (the user's friends, 2026-10-12).

   Two a biome, standing in front of its boss: each owns one or two of the
   biome's bosses and sends out whichever the run meets. Beating one earns
   their badge (`save.gym[id]`, counted per win; the Badge Case's Gym Badges,
   js/data/badges.js). They fight as Normal, like every boss.

   A leader's `sprite` is a file in assets/trainers/gym/ (front-facing, a
   transparent background, Gen 5 style); until one is given it's the shadow
   `unknown.png`. Lines: `intro` before the boss (`{boss}` is its name),
   `beaten` once you win. Each is a list of speech-window lines.
   ============================================================ */

export const UNKNOWN_SPRITE = 'assets/trainers/gym/unknown.png';

const leader = (id, name, biome, bosses, badge, extra = {}) => ({
  id, name, biome, bosses, badge,
  sprite: null,
  intro: [`I'm ${name}, and this is my turf!`, 'You want to get past? You go through me. Go, {boss}!'],
  beaten: ['...Huh. You actually did it.', `Fine, you earned it. Take the ${badge}!`],
  ...extra,
});

export const GYM_LEADERS = [
  leader('lawrence', 'GAY TWINK LAWRENCE', 'clearing', ['snorlax', 'kangaskhan'], 'Glitter Badge'),
  leader('phil', 'PHIL', 'clearing', ['miltank'], 'Acorn Badge'),
  leader('john', 'JOHN', 'shrine', ['stoutland', 'exploud'], 'Lantern Badge'),
  leader('jahmes', 'JAHMES', 'shrine', ['ursaring'], 'Torii Badge'),
  leader('clarence', 'CLARENCE JASPER', 'wastes', ['slaking', 'regigigas'], 'Magma Badge'),
  leader('shaun', 'SHAUN', 'wastes', ['lickilicky', 'porygonz'], 'Cinder Badge'),
  leader('ricky', 'RICKY', 'ruins', ['dunsparce', 'wigglytuff'], 'Tidal Badge'),
  leader('kayl', 'KAYL', 'ruins', ['granbull'], 'Rune Badge'),
  leader('britt', 'BRITT', 'thornwood', ['blissey', 'porygon'], 'Bramble Badge'),
  leader('pat', 'PAT', 'thornwood', ['porygon2'], 'Root Badge'),
  leader('machew', 'EDGELORD MACHEW', 'savanna', ['castform', 'loudred'], 'Eclipse Badge'),
  leader('jerome', 'JEROME', 'savanna', ['munchlax'], 'Sunburst Badge'),
];

export const GYM_BY_ID = Object.fromEntries(GYM_LEADERS.map(l => [l.id, l]));
const BY_BOSS = Object.fromEntries(GYM_LEADERS.flatMap(l => l.bosses.map(b => [b, l])));

/** The leader who sends out this boss, or null (Eternatus, Safari bosses, Sky Pillar guardians). */
export const leaderFor = (bossId) => BY_BOSS[bossId] ?? null;

/** A biome's leaders, in order. */
export const leadersOf = (biomeId) => GYM_LEADERS.filter(l => l.biome === biomeId);

export const spriteOf = (l) => l.sprite || UNKNOWN_SPRITE;

/** How many times you've beaten them. */
export const gymWins = (save, id) => save.gym?.[id] || 0;

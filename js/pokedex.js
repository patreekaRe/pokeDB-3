/* ============================================================
   pokedex.js  -  the Pokédex window and its bookkeeping.

   A page per biome (data/pokedex.js). An entry is a dark "???"
   silhouette until you've fought that Pokémon (seen: its picture, name
   and biome), and gets a Poké Ball mark once you've beaten it, like the
   games' seen / caught. Defeating every Pokémon on a page pays its
   PokéCoins once and turns on its perk for every run after. Each entry
   counts its defeats (research, Legends: Arceus-style): at its goal it's
   Research complete, with a gold mark, and only then shows its type,
   role, flavour text, weakness, HP and moves with their numbers. Once
   every entry on a page is researched its perk goes up to Lv 2.
   The window is full screen: a banner per biome, then a red handheld
   Pokédex on that page (see "the window" below).
   ============================================================ */

import { ENEMY_DEFS, eliteOf, buildEncounter, BIOMES_BY_ID } from './data/enemies.js';
import { TYPES, CARDS_BY_ID } from './data/cards.js';
import { modsFor } from './data/difficulty.js';
import { DEX_PAGES, DEPTHS_PAGE, BONUS_PAGES, ALL_PAGES, safariOpen, DEX_NUMBER, RESEARCH_GOAL, RESEARCH_COINS, DEX_COMPLETE_COINS, SCOPE } from './data/pokedex.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave, markDex, countDex, awardCoins } from './storage.js';
import { $, el, openDialog, closeDialog, itemSprite } from './ui.js';
import { textPace } from './prefs.js';
import { playCry, playSound } from './audio.js';
import { sceneShot } from './scene.js';
import { timeOfDay } from './daytime.js';
import { tipAt } from './tips.js';
import { smoothIcon } from './smooth-icons.js';

const ROLE_LABEL = { wild: 'Wild', elite: 'Alpha', boss: 'Boss' };
const MOVE_KIND = { attack: ['⚔️', 'Attack'], drain: ['🩸', 'Drain'], defend: ['🛡️', 'Block'], buff: ['💪', 'Buff'], status: ['🗂️', 'Status'] };

let page = 0;

const dexNo = (id) => `No.${String(DEX_NUMBER[id]).padStart(3, '0')}`;
const pageOf = (id) => ALL_PAGES.find(p => p.ids.includes(id));
const pageDone = (p, defeated) => p.ids.every(id => defeated.has(id));
const ALL_IDS = DEX_PAGES.flatMap(p => p.ids);
const roleOf = (id) => pageOf(id).role[id];
const goalOf = (id) => RESEARCH_GOAL[roleOf(id)];
const defeats = (id) => getSave().dex.count[id] || 0;
const researched = (id) => defeats(id) >= goalOf(id);

const pageResearched = (p) => p.ids.every(researched);
const levelOf = (p) => (!getSave().dex.done.includes(p.biome) ? 0 : pageResearched(p) ? 2 : 1);

/** A page perk's level: 0 until its page is complete, 1 once it is, 2 once every entry on it is researched too.
    Worked out from the save rather than stored, so a save that had already researched a page gets Lv 2 straight away. */
export const dexPerkLevel = (perkId) => levelOf(DEX_PAGES.find(p => p.perk.id === perkId));

/** Pick weight for a fight room's Pokémon: ones you haven't beaten yet come up twice as often. */
export const dexWeight = (id) => (getSave().dex.defeated.includes(id) ? 1 : 2);

/** A fight against this Pokémon began. */
export function dexSeen(id) {
  if (ENEMY_DEFS[id]) markDex('seen', id);
}

/**
 * This Pokémon was beaten. Returns `{ lines, complete }`: the lines to tell (its data joining the
 * Pokédex the first time, its research count, a finished page's PokéCoins and perk, research and
 * whole-dex bonuses, all paid here, once, however the run ends) and whether this finished the Pokédex.
 */
export function dexDefeated(id) {
  if (!ENEMY_DEFS[id] || !pageOf(id)) return { lines: [], complete: false, research: null };
  const name = ENEMY_DEFS[id].name;
  const lines = [];
  markDex('seen', id);
  if (markDex('defeated', id)) lines.push(`${name}'s data was added to the Pokédex!`);

  const goal = goalOf(id);
  const n = countDex(id);
  let research = null;   // its own window, like an achievement's (the user's ask, 2026-10-03)
  if (n < goal) lines.push(`${name} defeated ${n}/${goal}.`);
  else if (n === goal) {
    const coins = awardCoins(RESEARCH_COINS[roleOf(id)]);
    lines.push(`${name} defeated ${n}/${goal}: Research complete! +${coins} PokéCoins.`);
    const def = ENEMY_DEFS[id];
    research = {
      feat: true, kicker: '📖 Research complete!', name, sprite: def.image, cry: def.spriteId, paid: coins,
      text: `You defeated ${name} ${goal} time${goal === 1 ? '' : 's'}.`,
      hint: 'Its Pokédex entry now shows its type, moves and their numbers.',
    };
  }

  const p = pageOf(id);
  const save = getSave();
  if (p === DEPTHS_PAGE && !save.dex.done.includes(p.biome) && pageDone(p, new Set(save.dex.defeated))) {
    updateSave(d => { d.dex.done.push(p.biome); });   // its prize, shiny Mewtwo, is a feat (checkFeats()), with its own window
    lines.push(`The ${p.name} page is complete! ${p.prize.icon} ${p.prize.name} unlocked!`);
  } else if (p.bonus && !save.dex.done.includes(p.biome) && pageDone(p, new Set(save.dex.defeated))) {
    updateSave(d => { d.dex.done.push(p.biome); });   // a bonus page (another road's): PokéCoins, no perk
    lines.push(`The ${p.name} bonus page is complete! +${awardCoins(p.bonus.coins)} PokéCoins.`);
  } else if (!save.dex.done.includes(p.biome) && pageDone(p, new Set(save.dex.defeated))) {
    updateSave(d => { d.dex.done.push(p.biome); });
    const coins = awardCoins(p.perk.coins);
    lines.push(`The ${p.name} page is complete! +${coins} PokéCoins.`, `New perk: ${p.perk.name}. ${p.perk.text}`);
    if (safariOpen(getSave())) lines.push('Every Pokémon is in the Pokédex! The Safari Zone is open on the title screen.');
  }
  if (n === goal && p.perk && pageResearched(p)) {
    lines.push(`Every ${p.name} entry is researched!`, `${p.perk.name} is now Lv 2: ${p.perk.lv2.text}`);
  }
  let complete = false;
  if (!save.dex.complete && ALL_IDS.every(researched)) {
    updateSave(d => { d.dex.complete = true; });
    const coins = awardCoins(DEX_COMPLETE_COINS);
    lines.push(`Pokédex complete! Every entry's research is done. +${coins} PokéCoins!`, `New on the map: the ${SCOPE.name}. ${SCOPE.text}`);
    complete = true;
  }
  return { lines, complete, research };
}

/** How many entries' research is complete, of how many. */
export const isResearched = (id) => Boolean(pageOf(id)) && researched(id);
export const researchCount =() => [ALL_IDS.filter(researched).length, ALL_IDS.length];

/* ---------- the window ----------
   Full screen (the user's call, 2026-10-05: "as immersive as possible"), in two views, Pokémon GO's region list then a
   handheld Pokédex: a banner per biome (its name, progress, perk medal and three of its Pokémon), and a tap opens the
   red device on that page, one entry at a time, with the page's every entry as slots to jump between. */

const BANNER_NAME = { clearing: 'Clearing', shrine: 'Shrine', ruins: 'Ruins', wastes: 'Wastes', thornwood: 'Jungle', savanna: 'Savanna', depths: 'Depths' };
const MYSTERY = DEX_PAGES.length;   // the Crystal Depths' page, "???" until a Mewtwo run reaches it
/** A bonus page (another road from a crossroads) shows once a run has walked that road or met one of its Pokémon. */
const bonusKnown = (p) => (getSave().stats.biomesSeen || []).includes(p.biome) || p.ids.some(id => getSave().dex.seen.includes(id));
/** A Mewtwo run has been down into the Depths (or met one of its Pokémon), so its page shows. */
const depthsKnown = () => getSave().stats.deepestBiome >= 4 || DEPTHS_PAGE.ids.some(id => getSave().dex.seen.includes(id));

let view = 'list';   // 'list' | 'page' | 'rewards'
let entry = 0;       // the entry shown on the device, an index into the page's ids

function sprite(def, className) {
  const img = el('img', `pixel ${className}`);
  img.src = def.image;
  img.alt = '';
  img.draggable = false;
  return img;
}

function typeChip(type) {
  return el('span', `index-only type-${type}`, `${TYPES[type].icon} ${TYPES[type].label}`);
}

export function progressBar(n, of) {
  const bar = el('div', 'ach-bar dex-bar');
  const fill = el('div', 'ach-fill');
  fill.style.width = `${(n / of) * 100}%`;
  bar.append(fill);
  return bar;
}

// the Rewards' icons are smooth vector art (js/smooth-icons.js; the user's call, 2026-10-06), the data keeps its emoji
const VECTOR = { '🏆': 'trophy', '★': 'star', '⚔️': 'swords', '💀': 'skull', '👹': 'boss', '💰': 'coin', '💴': 'cash', '🧴': 'items', '🎓': 'cap', '💎': 'gem' };
function iconOf(cls, emoji) {
  const span = el('span', cls, VECTOR[emoji] ? '' : emoji);
  if (VECTOR[emoji]) span.append(smoothIcon(VECTOR[emoji]));
  return span;
}

function perkBox(p, count, done) {
  if (p.bonus) return bonusBox(p, count, done);
  if (!p.perk) return depthsBox(p, count, done);
  const lv = levelOf(p);
  const box = el('div', `dex-perk${done ? ' earned' : ''}${lv === 2 ? ' mastered' : ''}`);
  const icon = iconOf('dex-perk-icon', p.perk.icon);
  const text = el('div', 'dex-perk-text');
  const studied = p.ids.filter(researched).length;
  text.append(
    el('strong', '', `${done ? '' : '🔒 '}${p.perk.name}${lv === 2 ? ' Lv 2' : ''}`),
    el('span', '', lv === 2 ? p.perk.lv2.text : p.perk.text),
    el('small', '', !done ? `Defeat all ${p.ids.length} to earn it, plus 💰 ${p.perk.coins}.`
      : lv === 2 ? 'Every entry researched: Lv 2, on for every run.'
      : `Earned: on for every run. Research all ${p.ids.length} (★${studied}) for Lv 2: ${p.perk.lv2.short}.`),
  );
  const shown = done ? studied : count;   // once the page is complete, the bar tracks the research towards Lv 2
  text.append(progressBar(shown, p.ids.length));
  box.append(icon, text, el('b', 'dex-perk-count', `${done ? '★' : ''}${shown}/${p.ids.length}`));
  return box;
}

/** The Depths page's prize, shiny Mewtwo, in the perk's place. */
function depthsBox(p, count, done) {
  const box = el('div', `dex-perk dex-depths${done ? ' earned' : ''}`);
  const img = el('img', 'pixel dex-perk-mon');
  img.src = 'assets/pokemon/mewtwo-shiny-front.gif';
  img.alt = '';
  if (!done) img.style.filter = 'brightness(0) opacity(0.6)';
  const text = el('div', 'dex-perk-text');
  text.append(
    el('strong', '', `${done ? '' : '🔒 '}${p.prize.name}`),
    el('span', '', p.prize.text),
    el('small', '', done ? 'Earned: switch it on or off in Mewtwo\'s panel.' : `Defeat all ${p.ids.length} to earn it. Only Mewtwo comes down here.`),
    progressBar(count, p.ids.length));
  box.append(img, text, el('b', 'dex-perk-count', `${count}/${p.ids.length}`));
  return box;
}

/** A bonus page's prize, PokéCoins once, in the perk's place. */
function bonusBox(p, count, done) {
  const box = el('div', `dex-perk${done ? ' earned' : ''}`);
  const text = el('div', 'dex-perk-text');
  text.append(
    el('strong', '', `${done ? '' : '🔒 '}Bonus page: 💰 ${p.bonus.coins} PokéCoins`),
    el('span', '', 'Another road\'s page: it doesn\'t count towards finishing the Pokédex.'),
    el('small', '', done ? 'Earned.' : `Defeat all ${p.ids.length} to earn it.`),
    progressBar(count, p.ids.length));
  box.append(iconOf('dex-perk-icon', p.bonus.icon), text, el('b', 'dex-perk-count', `${count}/${p.ids.length}`));
  return box;
}

function prize(art, name, text) {
  const row = el('div', 'dex-prize');
  row.append(art, el('span', 'dex-prize-text'));
  row.lastChild.append(el('b', '', name), text ? ` · ${text}` : '');
  return row;
}

/* The Rewards (the user's call: what finishing the Pokédex pays should be easy to find): the jackpot, research and each
   page's perk, with how far along you are. */
function rewardBoxes() {
  const save = getSave();
  const [done, all] = researchCount();
  const defeated = new Set(save.dex.defeated);
  const reshiram = STARTERS_BY_ID.reshiram;
  const img = el('img', 'pixel dex-prize-sprite');
  img.src = spriteUrl(reshiram, 'front', 0);
  img.alt = '';
  const secret = !save.dex.complete && !save.unlocked.includes(reshiram.id);   // a silhouette and ??? until it's won, like the achievements
  if (secret) img.style.filter = 'brightness(0) opacity(0.6)';

  // one box per goal: what to do in a few words, the prizes as icon rows, and how far along you are
  const goal = (icon, title, how, prizes, n, of, earned, tip) => {
    const box = el('div', `dex-perk dex-goal${earned ? ' earned' : ''}`);
    const text = el('div', 'dex-perk-text');
    text.append(el('strong', '', `${earned ? '✅ ' : ''}${title}`), el('span', 'dex-goal-how', how), ...prizes, progressBar(n, of));
    box.append(iconOf('dex-perk-icon', icon), text, el('b', 'dex-perk-count', `${n}/${of}`));
    box.title = tip;
    return box;
  };
  const coins = (n) => prize(iconOf('dex-prize-icon', '💰'), `${n} PokéCoins`, '');

  const jackpot = goal('🏆', 'Complete the Pokédex', `Research all ${all} entries`, [
    coins(DEX_COMPLETE_COINS),
    prize(img, secret ? '???' : reshiram.line[0].name, 'New starter'),
    prize(itemSprite(SCOPE, 'dex-prize-icon'), SCOPE.name, SCOPE.short),
  ], done, all, save.dex.complete, 'Research an entry by beating it 3 times (a boss twice).');
  jackpot.classList.add('dex-jackpot');

  // one row per kind, marked with its map room's icon rather than a word (the user's call)
  const pay = (icon, kind, n) => {
    const row = prize(iconOf('dex-prize-icon', icon), `${n} PokéCoins`, '');
    row.title = `${kind}: ${n} PokéCoins`;
    return row;
  };
  const research = goal('★', 'Research', 'Beat a Pokémon 3× (bosses 2×) to complete its research. Each one pays once:', [
    pay('⚔️', 'Wild', RESEARCH_COINS.wild), pay('💀', 'Alpha', RESEARCH_COINS.elite), pay('👹', 'Boss', RESEARCH_COINS.boss),
  ], done, all, false, 'Each entry pays once.');

  const pages = DEX_PAGES.map(p => goal(p.perk.icon, `${BANNER_NAME[p.biome]} page`, `Beat all ${p.ids.length} once`, [
    coins(p.perk.coins),
    prize(iconOf('dex-prize-icon', p.perk.icon), p.perk.name, p.perk.short),
  ], p.ids.filter(id => defeated.has(id)).length, p.ids.length, save.dex.done.includes(p.biome), `${p.perk.name}: ${p.perk.text}`));

  // researching a whole page raises its perk to Lv 2 (the user's call, 2026-09-28)
  const masters = DEX_PAGES.map(p => goal('★', `${BANNER_NAME[p.biome]} research`, `Research all ${p.ids.length}`, [
    prize(iconOf('dex-prize-icon', p.perk.icon), `${p.perk.name} Lv 2`, p.perk.lv2.short),
  ], p.ids.filter(researched).length, p.ids.length, levelOf(p) === 2, `${p.perk.name} Lv 2: ${p.perk.lv2.text}`));

  const depths = [];
  if (depthsKnown()) {
    const p = DEPTHS_PAGE;
    const shiny = el('img', 'pixel dex-prize-sprite');
    shiny.src = 'assets/pokemon/mewtwo-shiny-front.gif';
    shiny.alt = '';
    depths.push(goal('💎', 'Depths page', `Beat all ${p.ids.length} once`, [prize(shiny, p.prize.name, 'Can\'t be bought')],
      p.ids.filter(id => defeated.has(id)).length, p.ids.length, save.dex.done.includes(p.biome), `${p.prize.name}: ${p.prize.text}`));
    depths[0].classList.add('dex-depths');
  }
  const bonus = BONUS_PAGES.filter(bonusKnown).map(p => goal(p.bonus.icon, `${BANNER_NAME[p.biome]} page`, `Beat all ${p.ids.length} once (a bonus page)`,
    [coins(p.bonus.coins)], p.ids.filter(id => defeated.has(id)).length, p.ids.length, save.dex.done.includes(p.biome), `${p.name}: another road's page`));
  return [jackpot, research, ...pages, ...masters, ...bonus, ...depths];
}

/** A move's numbers in a fight (Research complete): attacks carry the biome's extra damage. */
function moveNumbers(m, extra) {
  const junk = m.adds ? `${m.adds.n ?? 1} ${CARDS_BY_ID[m.adds.card]?.name ?? m.adds.card}` : '';
  const parts = {
    attack: () => [`${m.amount + extra} dmg`],
    drain: () => [`${m.amount + extra} dmg`, `heal ${m.heal}`],
    defend: () => [`+${m.amount} block`],
    buff: () => [`+${m.amount} strength`],
    status: () => [],
  }[m.kind]?.() ?? [];
  if (junk) parts.push(`+${junk}`);
  return parts.join(', ');
}

/* ---------- the biomes' own scenery ----------
   Each banner and the device's screen show a still of the biome's scene (js/scene.js), at the hour it is now. They're
   painted once an hour and kept as images. */

const shots = new Map();
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A still of `biome`'s scene as { url, pad }: `w` x `h` scene pixels, the horizon at `at`, at `where` on its journey. */
export function still(biome, w, h, at, kind = 'wild', stage = 0) {
  const key = `${biome}/${w}x${h}/${at}/${kind}/${stage}/${timeOfDay()}`;
  if (!shots.has(key)) {
    let shot = null;
    try {
      const c = sceneShot(biome, { w, h, at, kind, where: { progress: stage / 3, stage, step: null } });
      shot = { url: c.toDataURL(), pad: c.pad };
    } catch (err) {
      console.warn('Pokédex scenery', biome, err);   // a painter that can't paint off-screen: the flat colours stay
    }
    shots.set(key, shot);
  }
  return shots.get(key);
}

export function sceneImg(shot, className) {
  const img = el('img', `pixel ${className}`);
  img.alt = '';
  img.draggable = false;
  if (shot) img.src = shot.url;
  else img.hidden = true;
  return img;
}

/* ---------- the list: a banner per biome ---------- */

function banner(cls, title, sub, onClick, scene = null) {
  const b = el('button', `pdx-banner ${cls}`);
  b.type = 'button';
  if (scene) b.append(sceneImg(still(scene, 150, 46, 0.56), 'pdx-banner-art'), el('span', 'pdx-banner-shade'));
  b.append(el('span', 'pdx-stripe'), el('strong', 'pdx-banner-name', title));
  if (sub) b.append(el('span', 'pdx-banner-sub', sub));
  b.addEventListener('click', () => onClick(b));
  return b;
}

function bannerMons(ids, seen) {
  const mons = el('span', 'pdx-banner-mons');
  for (const id of ids) {
    const img = sprite(ENEMY_DEFS[id], `pdx-banner-mon${seen.has(id) ? '' : ' unseen'}`);
    mons.append(img);
  }
  return mons;
}

function medal(lv, icon, title) {
  const m = el('span', `pdx-medal lv${lv}`, icon);
  m.title = title;
  return m;
}

function renderList() {
  const save = getSave();
  const seen = new Set(save.dex.seen);
  const defeated = new Set(save.dex.defeated);
  const banners = DEX_PAGES.map((p, i) => {
    const n = p.ids.filter(id => defeated.has(id)).length;
    const done = save.dex.done.includes(p.biome);
    const b = banner(`biome-${p.biome}${done ? ' complete' : ''}`, BANNER_NAME[p.biome], done ? 'Complete!' : p.name, (b) => openPage(i, b), p.biome);
    b.dataset.page = i;
    const lv = levelOf(p);
    b.append(el('span', 'pdx-banner-count', `${n} / ${p.ids.length}`), progressBar(n, p.ids.length),
      medal(lv, p.perk.icon, lv ? `${p.perk.name}${lv === 2 ? ' Lv 2' : ''}` : `${p.perk.name}: complete the page to earn it`),
      bannerMons(bannerIds(p), seen));
    return b;
  });

  for (const p of BONUS_PAGES) {   // the other roads' pages, after the three
    const i = ALL_PAGES.indexOf(p);
    if (bonusKnown(p)) {
      const n = p.ids.filter(id => defeated.has(id)).length;
      const done = save.dex.done.includes(p.biome);
      const b = banner(`biome-${p.biome}${done ? ' complete' : ''}`, BANNER_NAME[p.biome], done ? 'Complete!' : p.name, (b) => openPage(i, b), p.biome);
      b.dataset.page = i;
      b.append(el('span', 'pdx-banner-count', `${n} / ${p.ids.length}`), progressBar(n, p.ids.length),
        medal(done ? 2 : 0, p.bonus.icon, `Bonus page: ${p.bonus.coins} PokéCoins`), bannerMons(bannerIds(p), seen));
      banners.push(b);
    } else {
      const b = banner('biome-mystery locked', '???', 'A road you haven\'t taken.', () => tipAt(b, 'Take the other path at a crossroads to find it.'));
      b.append(el('span', 'pdx-banner-count', '? / ??'), el('span', 'pdx-banner-mons'));
      b.lastChild.append(el('span', 'pdx-mystery-mark', '?'));
      banners.push(b);
    }
  }

  if (depthsKnown()) {
    const p = DEPTHS_PAGE;
    const n = p.ids.filter(id => defeated.has(id)).length;
    const done = save.dex.done.includes(p.biome);
    const b = banner(`biome-depths${done ? ' complete' : ''}`, BANNER_NAME.depths, done ? 'Complete!' : p.name, (b) => openPage(MYSTERY, b), 'depths');
    b.dataset.page = MYSTERY;
    b.append(el('span', 'pdx-banner-count', `${n} / ${p.ids.length}`), progressBar(n, p.ids.length),
      medal(done ? 2 : 0, '✨', p.prize.name), bannerMons(bannerIds(p), seen));
    banners.push(b);
  } else {
    const b = banner('biome-mystery locked', '???', 'Something waits beyond the Ember Wastes.', () => tipAt(b, 'No trainer has found a way there... yet.'));
    b.append(el('span', 'pdx-banner-count', '? / ??'), el('span', 'pdx-banner-mons'));
    b.lastChild.append(el('span', 'pdx-mystery-mark', '?'));
    banners.push(b);
  }

  const [done, all] = researchCount();
  const rewards = banner(`pdx-rewards${save.dex.complete ? ' complete' : ''}`, 'Rewards', save.dex.complete ? 'Pokédex complete!' : 'What finishing it pays', (b) => openRewards(b));
  rewards.dataset.page = 'rewards';
  rewards.append(el('span', 'pdx-banner-count', `★ ${done} / ${all}`), progressBar(done, all), iconOf('pdx-banner-mons pdx-trophy', '🏆'));
  banners.push(rewards);

  $('dex-banners').replaceChildren(...banners);

  const ids = ALL_IDS;
  $('dex-total').textContent = `${ids.filter(id => defeated.has(id)).length}/${ids.length}`;
  $('dex-total').title = `${ids.filter(id => defeated.has(id)).length} defeated, ${ids.filter(id => seen.has(id)).length} seen, ${done} with Research complete`;
}

/** A banner's three: a wild, the boss in the middle, an Alpha (Pokémon GO's three starters). */
function bannerIds(p) {
  const of = (role) => p.ids.filter(id => p.role[id] === role);
  return [of('wild')[0], of('boss').at(-1), of('elite')[0]].filter(Boolean);
}

/* ---------- the device ----------
   A tapped banner zooms up into the device, its front cover swings open with a power-on blip and the lights blink, then
   the screen flickers on (bootDevice()); going back reverses it into the banner (shutDevice()). Entries slide across the
   screen and their text types itself out. Under reduced motion it all just appears. */

let busy = false;   // the lid is opening or shutting: taps and keys wait for it
let typer = 0;      // bumped on every new entry, so the last one's typing stops

function deviceFrame(cls, title) {
  const dev = el('div', `pdx-device ${cls}`);
  const lid = el('div', 'pdx-lid');
  const back = el('button', 'pdx-back', '◀');
  back.type = 'button';
  back.setAttribute('aria-label', 'Back to the biomes');
  back.addEventListener('click', backToList);
  lid.append(back, el('span', 'pdx-lens'), el('span', 'pdx-light red'), el('span', 'pdx-light yellow'), el('span', 'pdx-light green'),
    el('span', 'pdx-lid-title', title));
  const body = el('div', 'pdx-body');
  body.addEventListener('click', finishTyping);
  dev.append(lid, body);
  return [dev, body];
}

function renderPage() {
  const p = ALL_PAGES[page];
  const [dev] = deviceFrame(`biome-${p.biome}`, BANNER_NAME[p.biome]);
  const controls = el('div', 'pdx-controls');
  const step = (dir, label, glyph) => {
    const b = el('button', 'pdx-round', glyph);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => showEntry(entry + dir, dir));
    return b;
  };
  controls.append(step(-1, 'Previous entry', '◀'), el('span', 'pdx-lcd pdx-counter'), step(1, 'Next entry', '▶'));
  dev.append(controls);
  $('dex-device').replaceChildren(dev);
  fillEntry(0);
}

/** Where on its biome's journey an entry's screen stands: wilds in the first two places, an Alpha in the third, a boss in its arena. */
function placeOf(p, id) {
  const role = p.role[id];
  if (role === 'boss') return ['boss', 3];
  if (role === 'elite') return ['elite', 2];
  return ['wild', p.ids.filter(x => p.role[x] === 'wild').indexOf(id) % 2];
}

/** Fills the device with the current entry; `dir` (±1) slides it in from that side. */
function fillEntry(dir) {
  const save = getSave();
  const seen = new Set(save.dex.seen);
  const defeated = new Set(save.dex.defeated);
  const p = ALL_PAGES[page];
  const id = p.ids[entry];
  const role = p.role[id];
  const base = ENEMY_DEFS[id];
  const known = seen.has(id);
  const done = known && researched(id);
  const dev = $('dex-device').querySelector('.pdx-device');
  const body = dev.querySelector('.pdx-body');
  const old = body.querySelector('.pdx-screen');

  const nameplate = el('div', 'pdx-lcd pdx-nameplate');
  nameplate.append(el('span', 'pdx-name', known ? base.name : '???'), el('span', 'pdx-no', dexNo(id)));

  const [kind, stage] = placeOf(p, id);
  const shot = still(p.biome, 128, 64, 0.5, kind, stage);
  const screen = el('div', `pdx-screen${known ? '' : ' unseen'}${shot ? ' painted' : ''}`);
  const pad = el('span', 'pdx-pad');
  if (shot?.pad) pad.style.backgroundImage = `url("${shot.pad}")`;
  screen.append(sceneImg(shot, 'pdx-scene'), pad, sprite(base, 'pdx-mon'));
  if (known) screen.append(el('span', `pdx-role role-${role}`, ROLE_LABEL[role]));
  if (done) screen.append(typeChip(base.type));
  if (defeated.has(id)) screen.append(el('span', `pdx-caught${done ? ' gold' : ''}`, done ? '★' : `${defeats(id)}/${goalOf(id)}`));
  swipe(screen);

  const typed = (cls, text) => el('div', `pdx-lcd pdx-text pdx-type${cls ? ` ${cls}` : ''}`, text);
  const lines = [nameplate, screen];
  if (!known) {
    lines.push(typed('muted', 'No data. Fight it in a run to fill this in.'));
  } else if (!done) {
    // until its research is complete an entry shows only its picture and where it lives (the user's call): the rest is the prize
    lines.push(typed('', `Found in the ${p.name}.`),
      typed('muted', `Research: defeated ${defeats(id)}/${goalOf(id)}. At ${goalOf(id)} this entry reveals its type, moves and weakness.`));
  } else {
    const def = role === 'elite' ? eliteOf(base) : base;
    const foe = buildEncounter(BIOMES_BY_ID[p.biome], role === 'wild' ? 'fight' : role, modsFor(0), id);
    const weak = role === 'wild' && TYPES[base.type].losesTo;
    const facts = el('div', 'pdx-lcd pdx-facts');
    facts.append(
      el('span', '', `HP ${foe?.maxHp ?? '?'}`),
      el('span', '', weak ? `Weak: ${TYPES[weak].icon} ${TYPES[weak].label}` : role === 'wild' ? 'No weakness' : 'Ignores types'),
      el('small', '', p === DEPTHS_PAGE ? 'Numbers in the Depths' : 'Numbers at Level 0, before types'));
    lines.push(typed('', base.description), facts, moveList('Moves, in order', def.moves, foe?.strength ?? 0));
    if (def.phase2) lines.push(moveList(`Then it rises as ${def.phase2.name}`, def.phase2.moves, foe?.strength ?? 0));
    lines.push(el('div', 'pdx-lcd pdx-text gold', `★ Research complete (defeated ${defeats(id)})`));
  }

  const slots = el('div', 'pdx-slots');
  p.ids.forEach((sid, i) => {
    const s = el('button', `pdx-slot role-${p.role[sid]}${i === entry ? ' on' : ''}${seen.has(sid) ? '' : ' unseen'}${defeated.has(sid) ? ' caught' : ''}${seen.has(sid) && researched(sid) ? ' researched' : ''}`);
    s.type = 'button';
    s.setAttribute('aria-label', `${dexNo(sid)} ${seen.has(sid) ? ENEMY_DEFS[sid].name : 'unknown'}`);
    s.append(sprite(ENEMY_DEFS[sid], 'pdx-slot-mon'));
    s.addEventListener('click', () => showEntry(i, Math.sign(i - entry)));
    slots.append(s);
  });
  lines.push(slots, perkBox(p, p.ids.filter(x => defeated.has(x)).length, save.dex.done.includes(p.biome)));
  body.replaceChildren(...lines);
  dev.querySelector('.pdx-counter').textContent = `${entry + 1} / ${p.ids.length}`;

  typeOut([...body.querySelectorAll('.pdx-type')]);
  if (dir && old && !calm()) slide(old, screen, dir);
}

/** The old entry's Pokémon slides off the screen as the new one slides on, and the old scenery fades if the place changed. */
function slide(old, screen, dir) {
  const ease = { duration: 280, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
  const was = old.querySelector('.pdx-mon'), now = screen.querySelector('.pdx-mon');
  const ghost = was.cloneNode();
  ghost.classList.add('pdx-ghost');
  if (old.classList.contains('unseen')) ghost.classList.add('unseen');
  screen.append(ghost);
  ghost.animate([{ translate: '0 0', opacity: 1 }, { translate: `${-dir * 120}% 0`, opacity: 0 }], ease).finished.then(() => ghost.remove(), () => ghost.remove());
  now.animate([{ translate: `${dir * 120}% 0`, opacity: 0 }, { translate: '0 0', opacity: 1 }], ease);
  const oldScene = old.querySelector('.pdx-scene'), newScene = screen.querySelector('.pdx-scene');
  if (oldScene?.src && oldScene.src !== newScene?.src) {
    const fade = oldScene.cloneNode();
    fade.classList.add('pdx-scene-old');
    screen.insertBefore(fade, newScene.nextSibling);
    fade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320 }).finished.then(() => fade.remove(), () => fade.remove());
  }
}

/* The entry's text types itself out, line after line, like the games' Pokédex; a tap on the device finishes it. */
let typing = null;

export function typeOut(nodes) {
  const token = ++typer;
  typing = null;
  const pace = textPace();
  if (calm() || !pace || !nodes.length) return;
  const texts = nodes.map(n => n.textContent);
  for (const n of nodes) {
    n.style.minHeight = `${n.offsetHeight}px`;   // the box keeps its size while it fills
    n.setAttribute('aria-label', n.textContent);
    n.textContent = '';
  }
  let line = 0, at = 0;
  const finish = () => {
    clearInterval(timer);
    nodes.forEach((n, i) => { n.textContent = texts[i]; n.classList.remove('typing'); });
    typing = null;
  };
  const timer = setInterval(() => {
    if (token !== typer || !nodes[0].isConnected) { clearInterval(timer); return; }
    at += pace[0];
    nodes[line].textContent = texts[line].slice(0, at);
    nodes[line].classList.add('typing');
    if (at >= texts[line].length) {
      nodes[line].classList.remove('typing');
      line += 1;
      at = 0;
      if (line >= nodes.length) finish();
    }
  }, pace[1] + 4);
  typing = finish;
}

export function finishTyping(e) {
  if (!typing || e.target.closest('button')) return;
  typing();
}

function moveList(head, moves, extra) {
  const box = el('div', 'pdx-lcd pdx-moves');
  box.append(el('h4', '', head));
  for (const m of moves) {
    const row = el('div', `pdx-move kind-${m.kind}`);
    const nums = m.kind === 'charge' ? 'charging' : `${moveNumbers(m, extra)}${m.grow ? `, +${m.grow} each use` : ''}`;
    row.append(el('span', 'pdx-move-icon', (MOVE_KIND[m.kind] || ['⚠️'])[0]), el('span', 'pdx-move-name', m.name), el('span', 'pdx-dots'), el('span', 'pdx-move-num', nums));
    box.append(row);
  }
  return box;
}

function renderRewardsView() {
  const [dev, body] = deviceFrame('pdx-rewards', 'Rewards');
  body.append(...rewardBoxes());
  $('dex-device').replaceChildren(dev);
}

/** A swipe across the screen steps to the next or previous entry. */
function swipe(node) {
  let x0 = null;
  node.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  node.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) showEntry(entry + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  node.addEventListener('pointercancel', () => { x0 = null; });
}

function showEntry(i, dir = 0) {
  if (busy) return;
  const ids = ALL_PAGES[page].ids;
  entry = (i + ids.length) % ids.length;
  fillEntry(dir);
  const id = ids[entry];
  if (getSave().dex.seen.includes(id)) playCry(ENEMY_DEFS[id].spriteId);
}

/* ---------- opening and shutting the device ---------- */

const EASE = 'cubic-bezier(0.2, 0.8, 0.25, 1)';
// the cover stays solid until it's nearly edge-on, then fades as it folds away
const SWING = [
  { transform: 'perspective(1100px) rotateY(0deg)', opacity: 1 },
  { transform: 'perspective(1100px) rotateY(-80deg)', opacity: 1, offset: 0.8 },
  { transform: 'perspective(1100px) rotateY(-104deg)', opacity: 0 },
];
const settle = (anim) => anim.finished.catch(() => {});

/** The transform that lays the device over `box` (a banner's rect): it zooms from or to there. */
function overBanner(dev, box) {
  const d = dev.getBoundingClientRect();
  const h = Math.max(1, Math.min(d.height, innerHeight - Math.max(0, d.top)));
  return `translate(${box.left - d.left}px, ${box.top - d.top}px) scale(${box.width / d.width}, ${box.height / h})`;
}

function cover(dev) {
  const c = el('div', 'pdx-cover');
  c.append(el('span', 'pdx-cover-hinge'), el('span', 'pdx-cover-mark'));
  c.style.top = `${dev.querySelector('.pdx-lid').offsetHeight}px`;
  dev.append(c);
  return c;
}

async function bootDevice(from) {
  const stage = $('dex-device'), dev = stage.querySelector('.pdx-device');
  if (calm()) { playSound('dex-on'); return; }
  busy = true;
  const lid = shelled() ? null : cover(dev);   // in the Collection device the page is already behind its cover
  stage.classList.add('zooming');
  const list = $('dex-list');
  const zoom = from
    ? dev.animate([{ transformOrigin: '0 0', transform: overBanner(dev, from.getBoundingClientRect()), opacity: 0.6 }, { transformOrigin: '0 0', transform: 'none', opacity: 1 }], { duration: 360, easing: EASE })
    : dev.animate([{ transform: 'scale(0.94) translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 280, easing: EASE });
  const fade = list.animate([{ opacity: 1 }, { opacity: 0 }], { duration: from ? 360 : 200, fill: 'forwards' });
  await settle(zoom);
  stage.classList.remove('zooming');
  fade.cancel();
  playSound('dex-on');
  dev.classList.add('powered');
  if (lid) {
    await settle(lid.animate(SWING, { duration: 460, easing: 'cubic-bezier(0.55, 0, 0.35, 1)' }));
    lid.remove();
  }
  dev.querySelector('.pdx-screen')?.classList.add('power-on');
  busy = false;
}

async function shutDevice() {
  const stage = $('dex-device'), dev = stage.querySelector('.pdx-device');
  ++typer;
  if (calm() || !dev) return;
  busy = true;
  playSound('dex-off');
  stage.scrollTop = 0;
  if (!shelled()) {
    const lid = cover(dev);
    await settle(lid.animate(SWING.map(k => ({ ...k, ...(k.offset && { offset: 1 - k.offset }) })).reverse(),
      { duration: 320, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }));
  }
  const to = $('dex-banners').querySelector(`[data-page="${view === 'rewards' ? 'rewards' : page}"]`);
  const box = to?.getBoundingClientRect();
  const seen = box && box.bottom > 0 && box.top < innerHeight;
  stage.classList.add('zooming');
  $('dex-list').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  await settle(seen
    ? dev.animate([{ transformOrigin: '0 0', transform: 'none', opacity: 1 }, { transformOrigin: '0 0', transform: overBanner(dev, box), opacity: 0.5 }], { duration: 300, easing: EASE, fill: 'forwards' })
    : dev.animate([{ opacity: 1 }, { transform: 'scale(0.94) translateY(12px)', opacity: 0 }], { duration: 240, easing: EASE, fill: 'forwards' }));
  stage.classList.remove('zooming');
  busy = false;
}

function show(next) {
  view = next;
  $('dex-list').inert = next !== 'list';
  $('dex-device').hidden = next === 'list';
  if (next === 'rewards') renderRewardsView();
  else if (next === 'page') renderPage();
  $('dex-device').scrollTop = 0;
}

/** Opens the device on a page, at its first entry you've seen; `from` is the banner it zooms up out of. */
function openPage(i, from = null) {
  if (busy) return;
  page = i;
  const seen = getSave().dex.seen;
  entry = Math.max(0, ALL_PAGES[page].ids.findIndex(id => seen.includes(id)));
  show('page');
  bootDevice(from);
}

function openRewards(from = null) {
  if (busy) return;
  show('rewards');
  bootDevice(from);
}

async function backToList() {
  if (busy || view === 'list') return;
  await shutDevice();
  show('list');
}

export function initPokedex() {
  $('dex-close').addEventListener('click', () => closeDialog('dex-dialog'));
  // Escape on the device goes back to the biomes rather than shutting the Pokédex
  $('dex-dialog').addEventListener('cancel', (e) => { if (view !== 'list' || busy) { e.preventDefault(); backToList(); } });
  $('dex-dialog').addEventListener('keydown', (e) => {
    if (view !== 'page') return;
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    showEntry(entry + step, step);
  });
  $('dex-dialog').addEventListener('close', () => { ++typer; busy = false; });
}

/* ---------- as an app in the Collection device (js/device.js) ----------
   The list and the page move into the device's screen, the page drops its own lid (the device's Back steps out of it),
   and they move back into their window when a run opens the Pokédex. */
const shelled = () => !$('dex-dialog').contains($('dex-list'));

export const pokedexApp = {
  /** `at`: a biome's page to open straight onto (a run's menu), else the list of biomes. */
  mount(host, at) {
    host.append($('dex-list'), $('dex-device'));
    renderList();
    $('dex-list').scrollTop = 0;
    if (!onPage(at)) return show('list');
    page = at;
    const seen = getSave().dex.seen;
    entry = Math.max(0, ALL_PAGES[page].ids.findIndex(id => seen.includes(id)));
    show('page');
    $('dex-device').querySelector('.pdx-device')?.classList.add('powered');
  },
  /** The device's Back: true if the Pokédex stepped back itself (a page to the biomes), false to leave the app. */
  back() {
    if (busy) return true;
    if (view === 'list') return false;
    backToList();
    return true;
  },
  key(e) {
    const step = view === 'page' && { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return false;
    showEntry(entry + step, step);
    return true;
  },
  unmount() {
    ++typer;
    busy = false;
    $('dex-dialog').append($('dex-list'), $('dex-device'));
  },
};

/** Opens on the given biome's page (the run's), else on the list of biomes. */
const onPage = (biome) => Number.isInteger(biome) && ALL_PAGES[biome] && (biome !== MYSTERY || depthsKnown()) && (!ALL_PAGES[biome].bonus || bonusKnown(ALL_PAGES[biome]));

export function openPokedex(biome) {
  if (shelled()) pokedexApp.unmount();
  openDialog('dex-dialog');
  renderList();
  $('dex-list').scrollTop = 0;
  if (onPage(biome)) openPage(biome);
  else show('list');
}

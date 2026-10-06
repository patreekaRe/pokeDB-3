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

import { ENEMY_DEFS, eliteOf, buildEncounter, BIOMES } from './data/enemies.js';
import { TYPES, CARDS_BY_ID } from './data/cards.js';
import { modsFor } from './data/difficulty.js';
import { DEX_PAGES, DEPTHS_PAGE, ALL_PAGES, safariOpen, DEX_NUMBER, RESEARCH_GOAL, RESEARCH_COINS, DEX_COMPLETE_COINS, SCOPE } from './data/pokedex.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave, markDex, countDex, awardCoins } from './storage.js';
import { $, el, openDialog, closeDialog, itemSprite } from './ui.js';
import { playCry } from './audio.js';
import { tipAt } from './tips.js';
import { openSafariDex, safariDexCount } from './safaridex.js';
import { SAFARI_DEX_PAGES } from './data/safari.js';

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

const BANNER_NAME = { clearing: 'Clearing', shrine: 'Shrine', wastes: 'Wastes', depths: 'Depths' };
const MYSTERY = DEX_PAGES.length;   // the Crystal Depths' page, "???" until a Mewtwo run reaches it
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

function progressBar(n, of) {
  const bar = el('div', 'ach-bar dex-bar');
  const fill = el('div', 'ach-fill');
  fill.style.width = `${(n / of) * 100}%`;
  bar.append(fill);
  return bar;
}

function perkBox(p, count, done) {
  if (!p.perk) return depthsBox(p, count, done);
  const lv = levelOf(p);
  const box = el('div', `dex-perk${done ? ' earned' : ''}${lv === 2 ? ' mastered' : ''}`);
  const icon = el('span', 'dex-perk-icon', p.perk.icon);
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
    box.append(el('span', 'dex-perk-icon', icon), text, el('b', 'dex-perk-count', `${n}/${of}`));
    box.title = tip;
    return box;
  };
  const coins = (n) => prize(el('span', 'dex-prize-icon', '💰'), `${n} PokéCoins`, '');

  const jackpot = goal('🏆', 'Complete the Pokédex', `Research all ${all} entries`, [
    coins(DEX_COMPLETE_COINS),
    prize(img, secret ? '???' : reshiram.line[0].name, 'New starter'),
    prize(itemSprite(SCOPE, 'dex-prize-icon'), SCOPE.name, SCOPE.short),
  ], done, all, save.dex.complete, 'Research an entry by beating it 3 times (a boss twice).');
  jackpot.classList.add('dex-jackpot');

  // one row per kind, marked with its map room's icon rather than a word (the user's call)
  const pay = (icon, kind, n) => {
    const row = prize(el('span', 'dex-prize-icon', icon), `💰 ${n}`, '');
    row.title = `${kind}: ${n} PokéCoins`;
    return row;
  };
  const research = goal('★', 'Research', 'Beat a Pokémon 3× (bosses 2×) to complete its research. Each one pays once:', [
    pay('⚔️', 'Wild', RESEARCH_COINS.wild), pay('💀', 'Alpha', RESEARCH_COINS.elite), pay('👹', 'Boss', RESEARCH_COINS.boss),
  ], done, all, false, 'Each entry pays once.');

  const pages = DEX_PAGES.map(p => goal(p.perk.icon, `${BANNER_NAME[p.biome]} page`, `Beat all ${p.ids.length} once`, [
    coins(p.perk.coins),
    prize(el('span', 'dex-prize-icon', p.perk.icon), p.perk.name, p.perk.short),
  ], p.ids.filter(id => defeated.has(id)).length, p.ids.length, save.dex.done.includes(p.biome), `${p.perk.name}: ${p.perk.text}`));

  // researching a whole page raises its perk to Lv 2 (the user's call, 2026-09-28)
  const masters = DEX_PAGES.map(p => goal('★', `${BANNER_NAME[p.biome]} research`, `Research all ${p.ids.length}`, [
    prize(el('span', 'dex-prize-icon', p.perk.icon), `${p.perk.name} Lv 2`, p.perk.lv2.short),
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
  return [jackpot, research, ...pages, ...masters, ...depths];
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

/* ---------- the list: a banner per biome ---------- */

function banner(cls, title, sub, onClick) {
  const b = el('button', `pdx-banner ${cls}`);
  b.type = 'button';
  b.append(el('span', 'pdx-stripe'), el('strong', 'pdx-banner-name', title));
  if (sub) b.append(el('span', 'pdx-banner-sub', sub));
  b.addEventListener('click', onClick);
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
    const b = banner(`biome-${p.biome}${done ? ' complete' : ''}`, BANNER_NAME[p.biome], done ? 'Complete!' : p.name, () => openPage(i));
    const lv = levelOf(p);
    b.append(el('span', 'pdx-banner-count', `${n} / ${p.ids.length}`), progressBar(n, p.ids.length),
      medal(lv, p.perk.icon, lv ? `${p.perk.name}${lv === 2 ? ' Lv 2' : ''}` : `${p.perk.name}: complete the page to earn it`),
      bannerMons(bannerIds(p), seen));
    return b;
  });

  if (depthsKnown()) {
    const p = DEPTHS_PAGE;
    const n = p.ids.filter(id => defeated.has(id)).length;
    const done = save.dex.done.includes(p.biome);
    const b = banner(`biome-depths${done ? ' complete' : ''}`, BANNER_NAME.depths, done ? 'Complete!' : p.name, () => openPage(MYSTERY));
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
  const rewards = banner(`pdx-rewards${save.dex.complete ? ' complete' : ''}`, 'Rewards', save.dex.complete ? 'Pokédex complete!' : 'What finishing it pays', openRewards);
  rewards.append(el('span', 'pdx-banner-count', `★ ${done} / ${all}`), progressBar(done, all), el('span', 'pdx-banner-mons pdx-trophy', '🏆'));
  banners.push(rewards);

  if (safariOpen(save)) {   // the Safari Pokédex is its own window: its banner hands over to it
    const { caught, total } = safariDexCount();
    const safari = banner('pdx-safari', 'Safari', 'The Safari Zone\'s Pokédex', () => { closeDialog('dex-dialog'); openSafariDex(); });
    const caughtIds = new Set([...getSave().safariDex.seen, ...getSave().safariDex.caught]);
    safari.append(el('span', 'pdx-banner-count', `${caught} / ${total}`), progressBar(caught, total), bannerMons(SAFARI_DEX_PAGES[0].ids.slice(0, 3), caughtIds));
    banners.push(safari);
  }
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

/* ---------- the device ---------- */

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
  dev.append(lid, body);
  return [dev, body];
}

function renderPage() {
  const save = getSave();
  const seen = new Set(save.dex.seen);
  const defeated = new Set(save.dex.defeated);
  const p = ALL_PAGES[page];
  const id = p.ids[entry];
  const role = p.role[id];
  const base = ENEMY_DEFS[id];
  const known = seen.has(id);
  const done = known && researched(id);
  const [dev, body] = deviceFrame(`biome-${p.biome}`, BANNER_NAME[p.biome]);

  const nameplate = el('div', 'pdx-lcd pdx-nameplate');
  nameplate.append(el('span', 'pdx-name', known ? base.name : '???'), el('span', 'pdx-no', dexNo(id)));

  const screen = el('div', `pdx-screen${known ? '' : ' unseen'}`);
  screen.append(el('span', 'pdx-pad'), sprite(base, 'pdx-mon'));
  if (known) screen.append(el('span', `pdx-role role-${role}`, ROLE_LABEL[role]));
  if (done) screen.append(typeChip(base.type));
  if (defeated.has(id)) screen.append(el('span', `pdx-caught${done ? ' gold' : ''}`, done ? '★' : `${defeats(id)}/${goalOf(id)}`));
  swipe(screen);

  const lines = [nameplate, screen];
  if (!known) {
    lines.push(el('div', 'pdx-lcd pdx-text muted', 'No data. Fight it in a run to fill this in.'));
  } else if (!done) {
    // until its research is complete an entry shows only its picture and where it lives (the user's call): the rest is the prize
    lines.push(el('div', 'pdx-lcd pdx-text', `Found in the ${p.name}.`),
      el('div', 'pdx-lcd pdx-text muted', `Research: defeated ${defeats(id)}/${goalOf(id)}. At ${goalOf(id)} this entry reveals its type, moves and weakness.`));
  } else {
    const def = role === 'elite' ? eliteOf(base) : base;
    const foe = buildEncounter(BIOMES.findIndex(b => b.id === p.biome), role === 'wild' ? 'fight' : role, modsFor(0), id);
    const weak = role === 'wild' && TYPES[base.type].losesTo;
    const facts = el('div', 'pdx-lcd pdx-facts');
    facts.append(
      el('span', '', `HP ${foe?.maxHp ?? '?'}`),
      el('span', '', weak ? `Weak: ${TYPES[weak].icon} ${TYPES[weak].label}` : role === 'wild' ? 'No weakness' : 'Ignores types'),
      el('small', '', p === DEPTHS_PAGE ? 'Numbers in the Depths' : 'Numbers at Level 0, before types'));
    lines.push(el('div', 'pdx-lcd pdx-text', base.description), facts, moveList('Moves, in order', def.moves, foe?.strength ?? 0));
    if (def.phase2) lines.push(moveList(`Then it rises as ${def.phase2.name}`, def.phase2.moves, foe?.strength ?? 0));
    lines.push(el('div', 'pdx-lcd pdx-text gold', `★ Research complete (defeated ${defeats(id)})`));
  }

  const slots = el('div', 'pdx-slots');
  p.ids.forEach((sid, i) => {
    const s = el('button', `pdx-slot role-${p.role[sid]}${i === entry ? ' on' : ''}${seen.has(sid) ? '' : ' unseen'}${defeated.has(sid) ? ' caught' : ''}${seen.has(sid) && researched(sid) ? ' researched' : ''}`);
    s.type = 'button';
    s.setAttribute('aria-label', `${dexNo(sid)} ${seen.has(sid) ? ENEMY_DEFS[sid].name : 'unknown'}`);
    s.append(sprite(ENEMY_DEFS[sid], 'pdx-slot-mon'));
    s.addEventListener('click', () => showEntry(i));
    slots.append(s);
  });
  lines.push(slots, perkBox(p, p.ids.filter(x => defeated.has(x)).length, save.dex.done.includes(p.biome)));
  body.append(...lines);

  const controls = el('div', 'pdx-controls');
  const step = (dir, label, glyph) => {
    const b = el('button', 'pdx-round', glyph);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => showEntry(entry + dir));
    return b;
  };
  controls.append(step(-1, 'Previous entry', '◀'), el('span', 'pdx-lcd pdx-counter', `${entry + 1} / ${p.ids.length}`), step(1, 'Next entry', '▶'));
  dev.append(controls);
  $('dex-device').replaceChildren(dev);
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
    if (Math.abs(dx) > 40) showEntry(entry + (dx < 0 ? 1 : -1));
  });
  node.addEventListener('pointercancel', () => { x0 = null; });
}

function showEntry(i) {
  const ids = ALL_PAGES[page].ids;
  entry = (i + ids.length) % ids.length;
  renderPage();
  const id = ids[entry];
  if (getSave().dex.seen.includes(id)) playCry(ENEMY_DEFS[id].spriteId);
}

function show(next) {
  view = next;
  $('dex-list').hidden = next !== 'list';
  $('dex-device').hidden = next === 'list';
  if (next === 'list') renderList();
  else if (next === 'rewards') renderRewardsView();
  else renderPage();
  $('dex-dialog').scrollTop = 0;
  $('dex-device').scrollTop = 0;
}

/** Opens the device on a page, at its first entry you've seen. */
function openPage(i) {
  page = i;
  const seen = getSave().dex.seen;
  entry = Math.max(0, ALL_PAGES[page].ids.findIndex(id => seen.includes(id)));
  show('page');
}

function openRewards() {
  show('rewards');
}

function backToList() {
  show('list');
}

export function initPokedex() {
  $('dex-close').addEventListener('click', () => closeDialog('dex-dialog'));
  // Escape on the device goes back to the biomes rather than shutting the Pokédex
  $('dex-dialog').addEventListener('cancel', (e) => { if (view !== 'list') { e.preventDefault(); backToList(); } });
  $('dex-dialog').addEventListener('keydown', (e) => {
    if (view !== 'page') return;
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    showEntry(entry + step);
  });
}

/** Opens on the given biome's page (the run's), else on the list of biomes. */
export function openPokedex(biome) {
  const onPage = Number.isInteger(biome) && ALL_PAGES[biome] && (biome !== MYSTERY || depthsKnown());
  openDialog('dex-dialog');
  if (onPage) openPage(biome);
  else show('list');
}

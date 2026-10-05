/*
 * The Hall of Fame (Level 5 rewards, part 2), after Gold/Silver's: a won run on Trainer Level 5 is entered in the save
 * (`hallOfFame`, oldest first) and a scene plays before the result window: the screen flashes white and turns to a
 * starry night, your Pokémon slides in onto a pedestal under a spotlight and cries, its plate (entry number, name, type,
 * date) pops up, the text box welcomes it, and its final deck rises along the bottom. The Collection's Hall of Fame
 * card lists every entry; tapping one shows its deck. A Level 5 win also throws a party (js/celebrate.js: fireworks,
 * confetti, spotlights, a rainbow title, a hop and a big finale). Under reduced motion nothing slides or flashes and there
 * is no party; the cry and music stay.
 */
import { $, el, sleep, openDialog, makeCard, groupDeck, itemSprite } from './ui.js';
import { playMusic, playCry, preloadMusic, preloadCries } from './audio.js';
import { sceneSay } from './evolution.js';
import { celebrate } from './celebrate.js';
import { rollCredits } from './credits.js';
import { fillDeck } from './deckpreview.js';
import { getSave, updateSave } from './storage.js';
import { STARTERS_BY_ID, spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { CARDS_BY_ID, TYPES } from './data/cards.js';
import { RELICS_BY_ID, ABILITIES } from './data/relics.js';
import { ITEMS_BY_ID } from './data/items.js';
import { MAX_LEVEL, LEVELS } from './data/difficulty.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const CRY_WAIT_MAX = 1500;

/** Start downloading the cry (and a Level 5 win's song) before the final boss, so the scene doesn't wait on them. */
export function preloadWinScene(starter, fame) {
  preloadMusic(fame ? 'hall-of-fame' : 'run-win');
  preloadCries(starter.line.at(-1).id);
}

const dayOf = (when) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;
};

/**
 * Save a won run in the record book (every Trainer Level; a Level 5 win also gets a Hall of Fame number, `fame`) and
 * return its entry: the Pokémon, the date, the final deck, relics and Bag, the items used on the way, and the run's
 * numbers (run.tally, added up by run.js from each fight).
 */
export function recordWin(run, shiny) {
  const entry = draftWin(run, shiny);
  updateSave(d => { d.hallOfFame.push(entry); });
  return entry;
}

/** How many lost runs the Record Book keeps (the oldest drop off). */
export const LOSS_KEEP = 100;

/**
 * Save a lost run in the Record Book: who fell, where (biome, place, floor) and to what move, with the same record a win
 * keeps plus its HP over the run (one point a floor, then the faint), for the loss recap. `after` is how many wins came
 * before it, which places it among them in the list.
 */
export function recordLoss(run, { foe = null, move = null, kind = null, biomeName, place, floor }, shiny) {
  const trail = run.tally.hpTrail || [];
  const entry = {
    ...runRecord(run, shiny), hp: 0,
    after: getSave().hallOfFame.length,
    biome: run.biome, biomeName, place, floor, foe, move, kind,
    hpTrail: [...trail.map(([hp, max, biome]) => [hp, max, biome]), [0, run.maxHp, run.biome]],   // it ends where it fainted
  };
  updateSave(d => { d.losses = [...(d.losses || []), entry].slice(-LOSS_KEEP); });
  return entry;
}

/** A won run's entry, unsaved (recordWin() saves it; a ?bossfight=depths playtest only plays its scene). */
export function draftWin(run, shiny) {
  const wins = getSave().hallOfFame;
  const mewtwo = run.starter.id === 'mewtwo';
  return {
    no: wins.length + 1,
    fame: !mewtwo && run.level === MAX_LEVEL ? wins.filter(w => w.level === MAX_LEVEL && w.starter !== 'mewtwo').length + 1 : null,
    champ: mewtwo ? wins.filter(isDepths).length + 1 : null,   // a Champion of the Depths' own number
    ...runRecord(run, shiny),
  };
}

/** A Sky Pillar summit's entry for its scene (never saved: a climb isn't a run for the Record Book). */
export const draftSummit = (run, shiny, counts) => ({ ...runRecord(run, shiny), summit: true, floor: run.tower.floor, counts });

/** What a run's record holds, won or lost: the Pokémon, the dates, the final deck, relics and Bag, and run.tally's numbers. */
function runRecord(run, shiny) {
  const t = run.tally;
  return {
    starter: run.starter.id,
    stage: run.stage,
    shiny,
    type: run.starter.type,
    date: dayOf(new Date()),
    started: t.startedAt ? dayOf(new Date(t.startedAt)) : null,
    level: run.level,
    deck: [...run.deck],
    relics: [...run.relics],
    items: [...run.items],
    itemsUsed: [...t.itemsUsed],
    hp: run.hp,
    maxHp: run.maxHp,
    fights: run.fights,
    elites: t.elites,
    turns: t.turns,
    played: t.played,
    dealt: t.dealt,
    taken: t.taken,
    biggest: t.biggest,
    rests: run.restCount,
    events: t.events,
    forgotten: t.forgotten,
    earned: run.money + t.spent,
    spent: t.spent,
  };
}

const starterOf = (entry) => STARTERS_BY_ID[entry.starter];
const nameOf = (entry) => stageName(starterOf(entry), entry.stage);
const imgOf = (entry) => spriteUrl(starterOf(entry), 'front', entry.stage, entry.shiny);
const typeOf = (entry) => TYPES[entry.type] ?? { label: entry.type, icon: '' };
const pad3 = (n) => String(n).padStart(3, '0');
/** A Level 5 win's Hall of Fame number (entries saved before every win was recorded were all Level 5: `no`). */
export const fameNo = (entry) => entry.starter !== 'mewtwo' && entry.level === MAX_LEVEL ? `No.${pad3(entry.fame ?? entry.no)}` : null;
const winNo = (entry) => `Win ${pad3(entry.no)}`;
/** A Mewtwo win: Eternatus beaten, the Champion of the Depths (v1.0's ending), gold-violet in both books. */
export const isDepths = (entry) => entry.starter === 'mewtwo';
/** Its number among them; entries from before part D are numbered by their place. */
const champNo = (entry) => `Depths ${pad3(entry.champ ?? getSave().hallOfFame.filter(isDepths).indexOf(entry) + 1)}`;
// the window shows either book: the Hall of Fame numbers its champions, the Record Book every win
let book = 'fame';
const numberOf = (entry) => (entry.summit && `Floor ${entry.floor}`) || (book === 'fame' && (fameNo(entry) || (isDepths(entry) && champNo(entry)))) || winNo(entry);
/** "28 Sep 2026", read as a local date (a bare "2026-09-28" would parse as UTC midnight and show the day before in the Americas). */
function dateOf(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
const chip = (entry) => el('span', `index-only type-${entry.type}`, `${typeOf(entry).icon} ${typeOf(entry).label}`);

/** The plate under the pedestal (and atop an entry in the Collection window): number, name, type, date. */
function plate(entry) {
  const box = el('div', 'hof-plate');
  const head = el('div', 'hof-plate-head');
  head.append(el('span', 'hof-no', numberOf(entry)), el('strong', 'hof-name', `${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`));
  const foot = el('div', 'hof-plate-foot');
  foot.append(chip(entry), el('span', 'hof-date', dateOf(entry.date)), el('span', 'hof-level', isDepths(entry) ? '💎 Depths' : entry.summit ? '🗼 Summit' : `Lv.${entry.level}`));
  box.append(head, foot);
  return box;
}

/** A strip of small cards, copies stacked (×N). */
function deckStrip(entry) {
  const strip = el('div', 'hof-deck scene-keep');
  strip.append(...groupDeck(entry.deck, CARDS_BY_ID).filter(g => g.card)
    .map(({ card, count }) => {
      const node = makeCard(card, { stage: entry.stage, count });
      node.classList.add('small');
      return node;
    }));
  return strip;
}

/**
 * Size the sprite so its resting pose (SPRITE_FIT) is about a third of the stage's height or half its width, in half
 * steps so the pixels stay even, standing its feet on the pedestal's top.
 */
function fit(img, box) {
  const [top, bottom, left, right] = spriteFit(img.src);
  const pose = Math.max(img.naturalWidth - left - right, img.naturalHeight - top - bottom) || 64;
  const room = Math.min(box.clientWidth * 0.55, box.clientHeight * 0.62);
  const s = Math.max(1, Math.min(4, Math.floor((room / pose) * 2) / 2));
  img.style.width = `${img.naturalWidth * s}px`;
  img.style.height = `${img.naturalHeight * s}px`;
  img.style.translate = `calc(-50% + ${((right - left) / 2) * s}px) ${bottom * s}px`;
}

const loaded = (img) => img.complete && img.naturalWidth ? null
  : new Promise(resolve => { img.onload = img.onerror = resolve; });

/** A grid of the run's numbers, lit up tile by tile in the scene. */
function statsPanel(entry) {
  const grid = el('div', 'hof-scene-stats');
  grid.append(...statList(entry).map(([icon, value, label, short], i) => {
    const node = el('div', 'hof-stat');
    node.title = label;
    node.style.setProperty('--i', i);
    node.append(el('span', 'hof-stat-icon', icon), el('b', '', String(value)), el('span', 'hof-stat-label', short));
    return node;
  }));
  return grid;
}

/** The scene's title; at a party each letter is its own span, so they flash in one by one and a rainbow sweeps across. */
function setTitle(text, party) {
  const title = $('hof-title');
  title.removeAttribute('aria-label');
  if (!party) { title.textContent = text; return; }
  title.setAttribute('aria-label', text);
  title.replaceChildren(...[...text].map((ch, i) => {
    const letter = el('span', 'hof-letter', ch);
    letter.setAttribute('aria-hidden', 'true');
    letter.style.setProperty('--i', i);
    return letter;
  }));
}

/** Restart a one-shot CSS animation keyed on a class of the scene (the hop, the finale's flash and shake). */
function replay(scene, cls) {
  scene.classList.remove(cls);
  void scene.offsetWidth;
  scene.classList.add(cls);
}

/**
 * Play the win scene for a new entry: every won run stands on the pedestal and shows its numbers, then its deck. A Level
 * 5 win is the Hall of Fame (its title, song and welcome); any other is a plain Victory over the fanfare already
 * playing. Resolves once the last line is tapped away and the scene has faded out.
 */
export async function winScene(entry) {
  const depths = isDepths(entry), summit = Boolean(entry.summit);
  const fame = Boolean(fameNo(entry)) || depths || summit;
  book = fame ? 'fame' : 'record';
  const scene = $('hof-scene');
  const img = $('hof-mon');
  const stage = $('hof-stage');
  const extra = $('hof-deck-slot');
  const name = nameOf(entry);
  img.src = imgOf(entry);
  img.alt = name;
  const party = fame && !still();
  setTitle(depths ? 'Champion of the Depths' : summit ? 'Sky Pillar Summit' : fame ? 'Hall of Fame' : 'Victory!', party);
  $('hof-plate-slot').replaceChildren(plate(entry));
  extra.replaceChildren(statsPanel(entry));
  $('hof-log').hidden = true;
  scene.className = `hof-scene${fame ? ' fame' : ''}${depths ? ' depths' : ''}${summit ? ' summit' : ''}${party ? ' party' : ''}${still() ? ' still' : ''}`;
  scene.hidden = false;
  playMusic(fame ? 'hall-of-fame' : 'run-win', { restart: true });   // while its file is missing, the victory fanfare from the boss's faint plays on
  const canvas = $('hof-fx');
  canvas.hidden = !party;
  const fx = party ? celebrate(canvas, entry.type, { onBoom: () => replay(scene, 'boom') }) : null;

  await Promise.all([loaded(img), sleep(still() ? 300 : 900)]);
  const refit = () => fit(img, stage);
  refit();
  addEventListener('resize', refit);

  scene.classList.add('mon-in');
  if (fx) {
    await sleep(700);   // the slide's ease-out has all but stopped: it lands with a hop and a fountain of sparkles
    replay(scene, 'hop');
    const top = scene.querySelector('.hof-pedestal').getBoundingClientRect();
    fx.land(top.left + top.width / 2, top.top);
    await sleep(300);
  } else await sleep(still() ? 200 : 900);
  await Promise.race([playCry(starterOf(entry).line[entry.stage].id), sleep(CRY_WAIT_MAX)]);
  scene.classList.add('plate-in');
  fx?.finale();
  await sceneSay('hof-scene', 'hof-log', depths
    ? ['Eternatus\'s energy is spent. The Crystal Depths fall quiet.', `${name} is the CHAMPION OF THE DEPTHS!`]
    : summit ? ['Rayquaza bows its head and soars off. Above the summit there is only sky.', `${name} climbed all ${entry.floor} floors of the SKY PILLAR!`]
    : fame ? ['Welcome to the HALL OF FAME!', `${name} became a champion on Trainer Level ${entry.level}!`]
    : [`${name} conquered the wastes on Trainer Level ${entry.level}!`]);

  scene.classList.add('deck-in');
  await sleep(still() ? 0 : 500);
  await sceneSay('hof-scene', 'hof-log', [`Here's how ${name}'s ${summit ? 'climb' : 'run'} went.`]);

  extra.replaceChildren(deckStrip(entry));
  await sceneSay('hof-scene', 'hof-log', [`${name}'s final deck: ${entry.deck.length} cards.`, depths
    ? `It is entered in the Hall of Fame as ${numberOf(entry)}. The wild Pokémon above can rest at last.`
    : summit ? (entry.counts ? `${entry.turns} turns to the top: the week's leaderboard ranks summits by fewest turns. Congratulations!`
      : `${entry.turns} turns to the top. Congratulations!`)
    : fame ? `It is entered in the Hall of Fame as ${numberOf(entry)}. Congratulations!`
    : `The run is saved in the Record Book as ${winNo(entry)}. Well done!`]);

  if (depths) await rollCredits(scene, entry);   // the true ending's credits, over the cavern

  scene.classList.add('out');
  await sleep(still() ? 0 : 600);
  removeEventListener('resize', refit);
  fx?.stop();
  canvas.hidden = true;
  scene.hidden = true;
  scene.className = 'hof-scene';
}

/* ---------- the Collection's two windows: the Hall of Fame and the Record Book ---------- */

const BOOKS = {
  fame: { title: '🏆 Hall of Fame', has: (e) => fameNo(e) || isDepths(e) },
  record: { title: '📖 Record Book', has: () => true },
};
/** The entries a book lists, oldest first: the Hall of Fame holds Level 5 wins, the Record Book every win. */
export const bookEntries = (which) => getSave().hallOfFame.filter(BOOKS[which].has);

/** Open the Hall of Fame ('fame') or the Record Book ('record'): its entries newest first; tapping one opens its page. */
export function openRecords(which) {
  book = which;
  $('hof-dialog-title').textContent = BOOKS[which].title;
  showList();
  openDialog('hof-dialog');
}

function showList() {
  const entries = bookEntries(book);
  const losses = book === 'record' ? getSave().losses || [] : [];
  const wins = `${entries.length} ${book === 'fame' ? (entries.length === 1 ? 'champion' : 'champions') : (entries.length === 1 ? 'win' : 'wins')}`;   // a Champion of the Depths counts among them
  const count = losses.length ? `${wins}, ${losses.length} ${losses.length === 1 ? 'loss' : 'losses'}` : wins;
  $('hof-dialog-sub').textContent = `${count}. Tap a ${losses.some(l => l.deck) ? 'run' : 'win'} for its record.`;
  // a lost run sits after the wins that came before it (`after`), so the book reads as one history
  const rows = [];
  entries.forEach((entry, i) => {
    if (book === 'record') rows.push(...losses.filter(l => l.after === i).map(lossRow));
    rows.push(winRow(entry));
  });
  rows.push(...losses.filter(l => l.after >= entries.length).map(lossRow));
  $('hof-body').replaceChildren(...rows.reverse());
  $('hof-body').scrollTop = 0;
}

function rowPic(entry) {
  const pic = el('span', 'hof-row-pic');
  const img = el('img', 'pixel');
  img.src = imgOf(entry);
  img.alt = '';
  pic.append(img);
  return pic;
}

function winRow(entry) {
  const star = book === 'record' && fameNo(entry);
  const row = el('button', `hof-row type-${entry.type}${star ? ' champion' : ''}${isDepths(entry) ? ' depths' : ''}`);
  row.type = 'button';
  const text = el('span', 'hof-row-text');
  const line = el('span', 'hof-row-line');
  line.append(chip(entry), el('span', 'hof-lv', isDepths(entry) ? 'Depths' : `Lv.${entry.level}`), el('span', '', dateOf(entry.date)));
  text.append(el('strong', '', `${star ? '⭐ ' : isDepths(entry) ? '💎 ' : ''}${numberOf(entry)} ${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`), line,
    el('small', '', `${entry.deck.length} cards · ${entry.relics.length} relics · ${entry.fights} fights won`));
  row.append(rowPic(entry), text, el('span', 'hof-row-go', '▶'));
  row.addEventListener('click', () => showEntry(entry));
  return row;
}

/** A lost run's short line: where it fell and to what. Losses saved since the recap open it; older ones have no page. */
function lossRow(entry) {
  const page = Boolean(entry.deck);
  const row = el(page ? 'button' : 'div', `hof-row lost type-${entry.type}${page ? ' recap' : ''}`);
  const text = el('span', 'hof-row-text');
  const line = el('span', 'hof-row-line');
  line.append(chip(entry), el('span', 'hof-lv', entry.starter === 'mewtwo' ? 'Mewtwo' : `Lv.${entry.level}`), el('span', '', dateOf(entry.date)));
  text.append(el('strong', '', `💀 Lost ${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`), line,
    el('small', '', `${entry.foe ? `Fell to ${entry.foe}` : 'Fainted'} in ${whereOf(entry)} · ${entry.fights} fights won`));
  row.append(rowPic(entry), text);
  if (page) {
    row.type = 'button';
    row.append(el('span', 'hof-row-go', '▶'));
    row.addEventListener('click', () => showLoss(entry));
  }
  return row;
}

const whereOf = (entry) => `${entry.biomeName}${entry.place ? `, ${entry.place}` : ''}${entry.kind === 'boss' ? ' (boss)' : entry.floor ? ` F${entry.floor}` : ''}`;
const blowOf = (entry) => !entry.foe ? 'Fainted' : entry.move ? `Fell to ${entry.foe}'s ${entry.move}` : `Fell to ${entry.foe}`;

/** A run's numbers as [icon, value, label, short label], for the record's page and the scene (short labels there). Old entries show "-" for what they lack. */
function statList(entry) {
  const upgraded = entry.deck.filter(id => id.endsWith('+')).length;
  return [
    ['⚔️', num(entry.fights), 'Fights won', 'Fights'],
    ['👑', num(entry.elites), 'Alphas beaten', 'Alphas'],
    ...(entry.hpTrail ? [] : [['❤️', entry.hp != null ? `${entry.hp}/${entry.maxHp}` : '-', 'HP at the end', 'HP left']]),   // a loss ends at 0
    ['🔄', num(entry.turns), 'Turns', 'Turns'],
    ['🃏', num(entry.played), 'Cards played', 'Played'],
    ['💥', num(entry.dealt), 'Damage dealt', 'Dealt'],
    ['🩸', num(entry.taken), 'Damage taken', 'Taken'],
    ['🎯', num(entry.biggest), 'Biggest hit', 'Best hit'],
    ['🎒', entry.itemsUsed ? entry.itemsUsed.length : '-', 'Items used', 'Items'],
    ['💴', entry.earned != null ? `₽${num(entry.earned)}` : '-', '₽ earned', 'Earned'],
    ['🏪', entry.spent != null ? `₽${num(entry.spent)}` : '-', '₽ spent', 'Spent'],
    ['🏥', num(entry.rests), 'Rests', 'Rests'],
    ['❓', num(entry.events), 'Events', 'Events'],
    ['💻', num(entry.forgotten), 'Moves forgotten', 'Forgot'],
    ['⏫', upgraded, 'Moves upgraded', 'PP Ups'],
  ];
}

const num = (n) => (n ?? null) === null ? '-' : Number(n).toLocaleString();

/** A stat tile, like the Stats window's. */
function tile([icon, value, label]) {
  const node = el('div', 'stat-tile');
  node.append(el('span', 'stat-icon', icon), el('b', 'stat-value', String(value)), el('span', 'stat-label', label));
  return node;
}

/** A row of relic or item sprites with their names; a tap shows what one does (its title, js/tips.js). */
function things(ids, table, empty) {
  const box = el('div', 'hof-things');
  const groups = groupDeck(ids, table).filter(g => g.card);
  if (!groups.length && empty) box.append(el('p', 'records-empty', empty));
  for (const { card: thing, count } of groups) {
    const node = el('span', 'hof-thing');
    node.title = `${thing.name}: ${thing.text}`;
    node.append(itemSprite(thing, 'hof-thing-icon'), el('span', 'hof-thing-name', `${thing.name}${count > 1 ? ` ×${count}` : ''}`));
    box.append(node);
  }
  return box;
}

function showEntry(entry) {
  const back = el('button', 'btn secondary hof-back', book === 'fame' ? '◀ All champions' : '◀ All wins');
  back.type = 'button';
  back.addEventListener('click', showList);
  const top = el('div', `hof-entry type-${entry.type}${isDepths(entry) ? ' depths' : ''}`);
  const pic = el('span', 'hof-entry-pic');
  const img = el('img', 'pixel');
  img.src = imgOf(entry);
  img.alt = nameOf(entry);
  pic.append(img);
  const info = plate(entry);
  info.append(el('p', 'hof-rule', (isDepths(entry) ? 'Champion of the Depths: Eternatus beaten' : `Trainer Level ${entry.level}: ${LEVELS[entry.level]?.name ?? ''}`)
    + (entry.started && entry.started !== entry.date ? ` · set out ${dateOf(entry.started)}` : '')));
  top.append(pic, info);

  const record = el('div', 'stat-grid hof-stats');
  record.append(...statList(entry).map(tile));

  const ability = ABILITIES[entry.type];
  const relics = things(entry.relics, RELICS_BY_ID, ability ? '' : 'No relics.');
  if (ability) {
    const node = el('span', 'hof-thing ability');
    node.title = `${ability.name}: ${ability.text}`;
    node.append(itemSprite(ability, 'hof-thing-icon'), el('span', 'hof-thing-name', ability.name));
    relics.prepend(node);
  }
  const label = (text) => el('h3', 'records-label', text);
  const cards = el('div', 'card-pool hof-cards');
  fillDeck(cards, entry.deck.filter(id => CARDS_BY_ID[id]), entry.stage);

  const parts = [back, top, label('The record'), record, label(`Relics (${entry.relics.length})`), relics];
  if (entry.items) {
    parts.push(label(`Items in the Bag (${entry.items.length})`), things(entry.items, ITEMS_BY_ID, 'The Bag was empty.'),
      label(`Items used (${entry.itemsUsed.length})`), things(entry.itemsUsed, ITEMS_BY_ID, 'None used.'));
  }
  parts.push(label(`Final deck (${entry.deck.length})`), cards);
  $('hof-dialog-sub').textContent = `${numberOf(entry)}: ${nameOf(entry)}'s run. Tap a card, relic or item to read it.`;
  $('hof-body').replaceChildren(...parts);
  $('hof-body').scrollTop = 0;
}

/* ---------- the loss recap: a lost run's short page, after its last fight and in the Record Book ---------- */

const SVG = 'http://www.w3.org/2000/svg';
function svg(tag, attrs) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/** HP over the run: a point a floor, max HP a faint line over it, a dashed line and a label where each biome begins. */
function hpChart(entry) {
  const trail = entry.hpTrail;
  const W = 100, H = 40;
  const top = Math.max(...trail.map(p => p[1]), 1);
  const x = (i) => (trail.length > 1 ? (i / (trail.length - 1)) * W : W / 2);
  const y = (hp) => H - (hp / top) * H;
  const line = trail.map(([hp], i) => `${x(i).toFixed(2)},${y(hp).toFixed(2)}`).join(' ');
  const box = el('div', `loss-chart type-${entry.type}`);
  const plot = el('div', 'loss-plot');
  box.append(plot);
  const art = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  art.append(
    svg('polyline', { class: 'loss-max', points: trail.map(([, max], i) => `${x(i).toFixed(2)},${y(max).toFixed(2)}`).join(' ') }),
    svg('polygon', { class: 'loss-area', points: `0,${H} ${line} ${x(trail.length - 1).toFixed(2)},${H}` }),
    svg('polyline', { class: 'loss-line', points: line }));
  plot.append(art);
  trail.forEach(([, , biome], i) => {
    if (i && biome === trail[i - 1][2]) return;
    if (i) art.append(svg('line', { class: 'loss-biome', x1: x(i), x2: x(i), y1: 0, y2: H }));
    const tag = el('span', 'loss-biome-tag', `B${biome + 1}`);
    tag.style.left = `${x(i)}%`;
    plot.append(tag);
  });
  const end = el('span', 'loss-end', '💀');
  end.style.left = `${x(trail.length - 1)}%`;
  plot.append(end);
  const low = Math.min(...trail.slice(0, -1).map(p => p[0]));
  const caption = el('p', 'loss-caption',
    `Set out with ${trail[0][0]}/${trail[0][1]} HP · ${trail.length - 1} floors${trail.length > 2 ? ` · lowest before the end ${low}` : ''}`);
  caption.title = 'HP as each floor began';
  return [box, caption];
}

/** A lost run's page: who beat it and with what, its numbers, its HP over the run and its final deck. */
function lossPage(entry) {
  const top = el('div', `hof-entry lost type-${entry.type}`);
  const pic = el('span', 'hof-entry-pic');
  const img = el('img', 'pixel');
  img.src = imgOf(entry);
  img.alt = nameOf(entry);
  pic.append(img);
  const info = el('div', 'hof-plate');
  const head = el('div', 'hof-plate-head');
  head.append(el('strong', 'hof-name', `${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`));
  const foot = el('div', 'hof-plate-foot');
  foot.append(chip(entry), el('span', 'hof-date', dateOf(entry.date)), el('span', 'hof-level', entry.starter === 'mewtwo' ? 'Mewtwo' : `Lv.${entry.level}`));
  info.append(head, foot, el('p', 'loss-blow', `💀 ${blowOf(entry)}`), el('p', 'hof-rule', `in ${whereOf(entry)}`));
  top.append(pic, info);

  const label = (text) => el('h3', 'records-label', text);
  const record = el('div', 'stat-grid hof-stats');
  record.append(...statList(entry).map(tile));
  const cards = el('div', 'card-pool hof-cards');
  fillDeck(cards, entry.deck.filter(id => CARDS_BY_ID[id]), entry.stage);
  return [top, label('HP over the run'), ...hpChart(entry), label('The record'), record, label(`Final deck (${entry.deck.length})`), cards];
}

function showLoss(entry) {
  const back = el('button', 'btn secondary hof-back', '◀ All runs');
  back.type = 'button';
  back.addEventListener('click', showList);
  $('hof-dialog-sub').textContent = `${nameOf(entry)}'s lost run. Tap a card to read it.`;
  $('hof-body').replaceChildren(back, ...lossPage(entry));
  $('hof-body').scrollTop = 0;
}

/** At a lost run's end, before the result window: its recap in a quiet window. Resolves once it's closed. */
export function lossRecap(entry) {
  const d = $('loss-dialog');
  $('loss-sub').textContent = `${nameOf(entry)}'s run is over. It's kept in the Record Book.`;
  $('loss-body').replaceChildren(...lossPage(entry));
  openDialog('loss-dialog');
  $('loss-body').scrollTop = 0;
  return new Promise(resolve => d.addEventListener('close', resolve, { once: true }));
}

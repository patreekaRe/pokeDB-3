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

/** A won run's entry, unsaved (recordWin() saves it; a ?bossfight=depths playtest only plays its scene). */
export function draftWin(run, shiny) {
  const wins = getSave().hallOfFame;
  const t = run.tally;
  const mewtwo = run.starter.id === 'mewtwo';
  return {
    no: wins.length + 1,
    fame: !mewtwo && run.level === MAX_LEVEL ? wins.filter(w => w.level === MAX_LEVEL && w.starter !== 'mewtwo').length + 1 : null,
    champ: mewtwo ? wins.filter(isDepths).length + 1 : null,   // a Champion of the Depths' own number
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
const numberOf = (entry) => (book === 'fame' && (fameNo(entry) || (isDepths(entry) && champNo(entry)))) || winNo(entry);
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
  foot.append(chip(entry), el('span', 'hof-date', dateOf(entry.date)), el('span', 'hof-level', isDepths(entry) ? '💎 Depths' : `Lv.${entry.level}`));
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
  const depths = isDepths(entry);
  const fame = Boolean(fameNo(entry)) || depths;
  book = fame ? 'fame' : 'record';
  const scene = $('hof-scene');
  const img = $('hof-mon');
  const stage = $('hof-stage');
  const extra = $('hof-deck-slot');
  const name = nameOf(entry);
  img.src = imgOf(entry);
  img.alt = name;
  const party = fame && !still();
  setTitle(depths ? 'Champion of the Depths' : fame ? 'Hall of Fame' : 'Victory!', party);
  $('hof-plate-slot').replaceChildren(plate(entry));
  extra.replaceChildren(statsPanel(entry));
  $('hof-log').hidden = true;
  scene.className = `hof-scene${fame ? ' fame' : ''}${depths ? ' depths' : ''}${party ? ' party' : ''}${still() ? ' still' : ''}`;
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
    : fame ? ['Welcome to the HALL OF FAME!', `${name} became a champion on Trainer Level ${entry.level}!`]
    : [`${name} conquered the wastes on Trainer Level ${entry.level}!`]);

  scene.classList.add('deck-in');
  await sleep(still() ? 0 : 500);
  await sceneSay('hof-scene', 'hof-log', [`Here's how ${name}'s run went.`]);

  extra.replaceChildren(deckStrip(entry));
  await sceneSay('hof-scene', 'hof-log', [`${name}'s final deck: ${entry.deck.length} cards.`, depths
    ? `It is entered in the Hall of Fame as ${numberOf(entry)}. The wild Pokémon above can rest at last.`
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
  const count = `${entries.length} ${book === 'fame' ? (entries.length === 1 ? 'champion' : 'champions') : (entries.length === 1 ? 'win' : 'wins')}`;   // a Champion of the Depths counts among them
  $('hof-dialog-sub').textContent = `${count}. Tap one for its record.`;
  $('hof-body').replaceChildren(...[...entries].reverse().map(entry => {
    const star = book === 'record' && fameNo(entry);
    const row = el('button', `hof-row type-${entry.type}${star ? ' champion' : ''}${isDepths(entry) ? ' depths' : ''}`);
    row.type = 'button';
    const pic = el('span', 'hof-row-pic');
    const img = el('img', 'pixel');
    img.src = imgOf(entry);
    img.alt = '';
    pic.append(img);
    const text = el('span', 'hof-row-text');
    const line = el('span', 'hof-row-line');
    line.append(chip(entry), el('span', 'hof-lv', isDepths(entry) ? 'Depths' : `Lv.${entry.level}`), el('span', '', dateOf(entry.date)));
    text.append(el('strong', '', `${star ? '⭐ ' : isDepths(entry) ? '💎 ' : ''}${numberOf(entry)} ${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`), line,
      el('small', '', `${entry.deck.length} cards · ${entry.relics.length} relics · ${entry.fights} fights won`));
    row.append(pic, text, el('span', 'hof-row-go', '▶'));
    row.addEventListener('click', () => showEntry(entry));
    return row;
  }));
  $('hof-body').scrollTop = 0;
}

/** A run's numbers as [icon, value, label, short label], for the record's page and the scene (short labels there). Old entries show "-" for what they lack. */
function statList(entry) {
  const upgraded = entry.deck.filter(id => id.endsWith('+')).length;
  return [
    ['⚔️', num(entry.fights), 'Fights won', 'Fights'],
    ['👑', num(entry.elites), 'Alphas beaten', 'Alphas'],
    ['❤️', entry.hp != null ? `${entry.hp}/${entry.maxHp}` : '-', 'HP at the end', 'HP left'],
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

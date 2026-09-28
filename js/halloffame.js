/*
 * The Hall of Fame (Level 5 rewards, part 2), after Gold/Silver's: a won run on Trainer Level 5 is entered in the save
 * (`hallOfFame`, oldest first) and a scene plays before the result window: the screen flashes white and turns to a
 * starry night, your Pokémon slides in onto a pedestal under a spotlight and cries, its plate (entry number, name, type,
 * date) pops up, the text box welcomes it, and its final deck rises along the bottom. The Collection's Hall of Fame
 * card lists every entry; tapping one shows its deck. Under reduced motion nothing slides or flashes; the cry and
 * music stay.
 */
import { $, el, sleep, openDialog, makeCard, groupDeck, itemSprite } from './ui.js';
import { playMusic, playCry, preloadMusic, preloadCries } from './audio.js';
import { sceneSay } from './evolution.js';
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

/** Start downloading the song and the cry before the final boss, so the scene doesn't wait on them. */
export function preloadHallOfFame(starter) {
  preloadMusic('hall-of-fame');
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
  const wins = getSave().hallOfFame;
  const t = run.tally;
  const entry = {
    no: wins.length + 1,
    fame: run.level === MAX_LEVEL ? wins.filter(w => w.level === MAX_LEVEL).length + 1 : null,
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
  updateSave(d => { d.hallOfFame.push(entry); });
  return entry;
}

const starterOf = (entry) => STARTERS_BY_ID[entry.starter];
const nameOf = (entry) => stageName(starterOf(entry), entry.stage);
const imgOf = (entry) => spriteUrl(starterOf(entry), 'front', entry.stage, entry.shiny);
const typeOf = (entry) => TYPES[entry.type] ?? { label: entry.type, icon: '' };
const pad3 = (n) => String(n).padStart(3, '0');
/** A Level 5 win's Hall of Fame number (entries saved before every win was recorded were all Level 5: `no`). */
export const fameNo = (entry) => entry.level === MAX_LEVEL ? `No.${pad3(entry.fame ?? entry.no)}` : null;
const winNo = (entry) => `Win ${pad3(entry.no)}`;
// the window shows either book: the Hall of Fame numbers its champions, the Record Book every win
let book = 'fame';
const numberOf = (entry) => (book === 'fame' && fameNo(entry)) || winNo(entry);
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
  foot.append(chip(entry), el('span', 'hof-date', dateOf(entry.date)), el('span', 'hof-level', `Lv.${entry.level}`));
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

/** Play the scene for a new entry. Resolves once the last line is tapped away and the scene has faded out. */
export async function hallOfFameScene(entry) {
  book = 'fame';
  const scene = $('hof-scene');
  const img = $('hof-mon');
  const stage = $('hof-stage');
  const name = nameOf(entry);
  img.src = imgOf(entry);
  img.alt = name;
  $('hof-plate-slot').replaceChildren(plate(entry));
  $('hof-deck-slot').replaceChildren(deckStrip(entry));
  $('hof-log').hidden = true;
  scene.className = `hof-scene${still() ? ' still' : ''}`;
  scene.hidden = false;
  playMusic('hall-of-fame', { restart: true });

  await Promise.all([loaded(img), sleep(still() ? 300 : 900)]);
  const refit = () => fit(img, stage);
  refit();
  addEventListener('resize', refit);

  scene.classList.add('mon-in');
  await sleep(still() ? 200 : 900);
  await Promise.race([playCry(starterOf(entry).line[entry.stage].id), sleep(CRY_WAIT_MAX)]);
  scene.classList.add('plate-in');
  await sceneSay('hof-scene', 'hof-log', ['Welcome to the HALL OF FAME!',
    `${name} became a champion on Trainer Level ${entry.level}!`]);

  scene.classList.add('deck-in');
  await sleep(still() ? 0 : 500);
  await sceneSay('hof-scene', 'hof-log', [`${name}'s final deck: ${entry.deck.length} cards.`,
    `It is entered in the Hall of Fame as ${numberOf(entry)}. Congratulations!`]);

  scene.classList.add('out');
  await sleep(still() ? 0 : 600);
  removeEventListener('resize', refit);
  scene.hidden = true;
  scene.className = 'hof-scene';
}

/* ---------- the Collection's two windows: the Hall of Fame and the Record Book ---------- */

const BOOKS = {
  fame: { title: '🏆 Hall of Fame', has: (e) => fameNo(e) },
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
  const count = `${entries.length} ${book === 'fame' ? (entries.length === 1 ? 'champion' : 'champions') : (entries.length === 1 ? 'win' : 'wins')}`;
  $('hof-dialog-sub').textContent = `${count}. Tap one for its record.`;
  $('hof-body').replaceChildren(...[...entries].reverse().map(entry => {
    const star = book === 'record' && fameNo(entry);
    const row = el('button', `hof-row type-${entry.type}${star ? ' champion' : ''}`);
    row.type = 'button';
    const pic = el('span', 'hof-row-pic');
    const img = el('img', 'pixel');
    img.src = imgOf(entry);
    img.alt = '';
    pic.append(img);
    const text = el('span', 'hof-row-text');
    const line = el('span', 'hof-row-line');
    line.append(chip(entry), el('span', 'hof-lv', `Lv.${entry.level}`), el('span', '', dateOf(entry.date)));
    text.append(el('strong', '', `${star ? '⭐ ' : ''}${numberOf(entry)} ${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`), line,
      el('small', '', `${entry.deck.length} cards · ${entry.relics.length} relics · ${entry.fights} fights won`));
    row.append(pic, text, el('span', 'hof-row-go', '▶'));
    row.addEventListener('click', () => showEntry(entry));
    return row;
  }));
  $('hof-body').scrollTop = 0;
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
  const top = el('div', `hof-entry type-${entry.type}`);
  const pic = el('span', 'hof-entry-pic');
  const img = el('img', 'pixel');
  img.src = imgOf(entry);
  img.alt = nameOf(entry);
  pic.append(img);
  const info = plate(entry);
  info.append(el('p', 'hof-rule', `Trainer Level ${entry.level}: ${LEVELS[entry.level]?.name ?? ''}`
    + (entry.started && entry.started !== entry.date ? ` · set out ${dateOf(entry.started)}` : '')));
  top.append(pic, info);

  const upgraded = entry.deck.filter(id => id.endsWith('+')).length;
  const record = el('div', 'stat-grid hof-stats');
  record.append(...[
    ['⚔️', num(entry.fights), 'Fights won'],
    ['👑', num(entry.elites), 'Alphas beaten'],
    ['❤️', entry.hp != null ? `${entry.hp}/${entry.maxHp}` : '-', 'HP at the end'],
    ['🔄', num(entry.turns), 'Turns'],
    ['🃏', num(entry.played), 'Cards played'],
    ['💥', num(entry.dealt), 'Damage dealt'],
    ['🩸', num(entry.taken), 'Damage taken'],
    ['🎯', num(entry.biggest), 'Biggest hit'],
    ['🎒', entry.itemsUsed ? entry.itemsUsed.length : '-', 'Items used'],
    ['💴', entry.earned != null ? `₽${num(entry.earned)}` : '-', '₽ earned'],
    ['🏪', entry.spent != null ? `₽${num(entry.spent)}` : '-', '₽ spent'],
    ['🏥', num(entry.rests), 'Rests'],
    ['❓', num(entry.events), 'Events'],
    ['💻', num(entry.forgotten), 'Moves forgotten'],
    ['⏫', upgraded, 'Moves upgraded'],
  ].map(tile));

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

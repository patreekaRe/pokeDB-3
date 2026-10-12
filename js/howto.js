/* ============================================================
   howto.js  -  How to play, an app on the Pokédex device (the user's
   call, 2026-10-08: "open up to a Pokédex"), on shelfApp() like the
   Relics and Achievements apps: a banner per topic, then the red
   handheld, one tip a screen, its picture smooth vector art (or the
   real sprite) and its text typed out. Numbers come from the game's
   own data, so the guide can't drift from it.
   ============================================================ */

import { COIN_REWARDS } from './run.js';
import { COIN_LEVEL_BONUS } from './data/shop.js';
import { SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE, WEAK_MULT, VULNERABLE_MULT } from './data/cards.js';
import { shelfApp, typed } from './bagdex.js';
import { smoothIcon } from './smooth-icons.js';
import { el, openDialog } from './ui.js';

const pct = (m) => `${Math.round(Math.abs(m - 1) * 100)}%`;

/** A tip: `icon` a smoothIcon() name or `mon` a sprite file, its name, its text, and optional `terms()` rows (read late: run.js is mid-load when this file runs). */
const tip = (icon, name, text, terms) => ({ icon, name, text, terms });
const mon = (id, name, text) => ({ mon: `assets/pokemon/${id}-front.gif`, name, text });

const TOPICS = [
  { id: 'run', name: 'Your Run', sub: 'From starter to champion', b1: '#e86a5a', b2: '#8a2a22', tips: [
    mon('charmander', 'Pick a starter', 'Fire, Grass or Water. Each type has its own deck, cards and Ability.'),
    tip('map', 'Climb the map', 'Choose your path room by room, up to the biome\'s boss.'),
    tip('swords', 'Win battles', 'Each win teaches your Pokémon a new move: a card for your deck.'),
    mon('snorlax', 'Beat 3 bosses', 'Your Pokémon evolves after each boss. Beat the third to win the run.'),
    tip('heart', 'Don\'t faint', 'At 0 HP the run is over. Your PokéCoins, Pokédex and badges stay.'),
  ] },
  { id: 'battle', name: 'Battle', sub: 'Your turn, then theirs', b1: '#5a8ef0', b2: '#24448a', tips: [
    tip('pp', 'PP', 'You get 3 PP every turn. Each card costs the PP in its corner.'),
    tip('moves', 'Your hand', 'You draw 5 cards a turn. What you don\'t play is discarded.'),
    tip('target', 'Read the enemy', 'Its next move shows over its head, with how hard it will hit.'),
    tip('shield', 'Block', 'Soaks up damage until your next turn. Block before a big hit!'),
    tip('turns', 'End your turn', 'The enemy moves, then you draw a fresh hand and PP.'),
    tip('star', 'Ability', 'Every starter has one: Blaze, Overgrow or Torrent. Tap the pill under your HP to read it.'),
    tip('burst', 'Enraged', 'Every 6 turns the enemy gets stronger, so you can\'t hide behind Block forever.'),
  ] },
  { id: 'cards', name: 'Cards', sub: 'Attacks, skills and powers', b1: '#9a70e0', b2: '#3e2482', tips: [
    tip('swords', 'Attacks', 'Deal damage. Most of your deck at the start.'),
    tip('shield', 'Skills', 'Block, heal, draw or weaken the enemy.'),
    tip('sparkle', 'Powers', 'Play one and it keeps working for the rest of the fight.'),
    tip('help', 'Keywords', 'Tap a card to raise it: a box beside it explains every word in gold or colour.'),
    tip('ppup', 'PP Up', 'An upgraded card has a + and a green name. Chansey can PP Up one at a Center.'),
    tip('trash', 'Thin your deck', 'Fewer, better cards come round more often. Forget moves at the Mart.'),
  ] },
  { id: 'types', name: 'Types', sub: 'Strengths and statuses', b1: '#ff9a5a', b2: '#9a3a1a', tips: [
    tip('fire', 'Fire', 'Beats Grass, loses to Water.'),
    tip('grass', 'Grass', 'Beats Water, loses to Fire.'),
    tip('water', 'Water', 'Beats Fire, loses to Grass.', () => [
      ['With the edge', `+${pct(SUPER_EFFECTIVE)} damage`],
      ['Against it', `-${pct(NOT_VERY_EFFECTIVE)} damage`],
    ]),
    tip('skull', 'Elites and bosses', 'Ignore types both ways. Match-ups are for wild Pokémon.'),
    tip('fire', 'Burn', 'Hurts the enemy at the start of its turn, then drops by 1.'),
    tip('weak', 'Weak', `Deals ${pct(WEAK_MULT)} less damage for a few turns.`),
    tip('vulnerable', 'Vulnerable', `Takes ${pct(VULNERABLE_MULT)} more from your attacks for a few turns.`),
    tip('muscle', 'Strength', 'Every hit deals more, all fight.'),
    tip('tide', 'Tide', 'Water\'s power. Builds up all fight; some cards spend it all for a big hit.'),
    tip('seed', 'Leech Seed', 'Grass\'s. The enemy loses HP each turn and you heal as much.'),
  ] },
  { id: 'map', name: 'The Map', sub: 'Every room on the road', b1: '#4ab070', b2: '#1a5a30', tips: [
    tip('swords', 'Wild fight', 'A wild Pokémon. Win a new card, sometimes an item.'),
    tip('skull', 'Elite', 'Much tougher, but drops a relic.'),
    tip('center', 'Pokémon Center', 'Rest to heal, or have Chansey PP Up a move.'),
    tip('mart', 'Poké Mart', 'Spend ₽ on cards, items, relics, or forgetting a move.'),
    tip('chest', 'Treasure', 'Pick a free relic.'),
    tip('help', 'Mystery room', 'Something happens. Most rewards come at a cost.'),
    tip('boss', 'Boss', 'Beat it to evolve and move on to the next biome.'),
    tip('items', 'Your Bag', 'Holds your deck, relics, items and the map key. Use an item on your turn.'),
  ] },
  { id: 'money', name: 'Money', sub: 'Pokédollars and PokéCoins', b1: '#e8b830', b2: '#6a4a08', tips: [
    tip('pokedollar', 'Pokédollars (₽)', 'Prize money for this run. Spend it at the Mart before it\'s gone.'),
    tip('coin', 'PokéCoins', 'Yours to keep, even if you faint.', () => [
      ['Wild fight', `+${COIN_REWARDS.fight}`],
      ['Elite', `+${COIN_REWARDS.elite}`],
      ['Boss', `+${COIN_REWARDS.boss}`],
      ['Run won', `+${COIN_REWARDS.winBonus}`],
      ['Trainer Level', `+${Math.round(COIN_LEVEL_BONUS * 100)}% each`],
    ]),
    tip('corner', 'Game Corner', 'Spend PokéCoins on new starters, perks and Poké Balls.'),
    tip('ppup', 'Perks', 'Boosts that help every run: more HP, a relic to start with...'),
    tip('sparkle', 'Shinies', 'New colours for a starter you own.'),
  ] },
  { id: 'more', name: 'Going Further', sub: 'What a win opens up', b1: '#4ac0c8', b2: '#1a5a6a', tips: [
    tip('star', 'Trainer Levels', 'Win to unlock the next Level. Each one adds a twist, up to Level 5.'),
    tip('dex', 'Pokédex', 'Beat Pokémon to fill its pages. A full page earns a perk.'),
    tip('trophy', 'Achievements', 'Goals that unlock new starters, legendaries among them.'),
    tip('fame', 'Badges', 'Earned along the way. They fill the Badge Case on your Trainer Card.'),
    tip('tower', 'Sky Pillar', 'A 100-floor climb with a weekly leaderboard. Opens after your first win.'),
    tip('safari', 'Safari Zone', 'A daily run where you catch Pokémon. Opens once the Pokédex is done.'),
    tip('lock', 'The Sealed Gate', 'Every win cracks it a little. Something sleeps behind it...'),
  ] },
].map(t => ({ ...t, list: () => t.tips }));

function art(t, cls) {
  if (t.mon) {
    const img = el('img', `pixel ${cls}`);
    img.src = t.mon;
    img.alt = '';
    img.draggable = false;
    return img;
  }
  const box = el('span', `${cls} ach-icon`);
  box.append(smoothIcon(t.icon));
  return box;
}

/** The old How to play's fanned hand: a 1-PP card of each starter type. */
function tricard() {
  const hand = el('span', 'howto-tricard');
  for (const type of ['fire', 'grass', 'water']) {
    const card = el('span', `howto-minicard ${type}`);
    card.append(el('b', 'howto-minicost', '1'), smoothIcon(type));
    hand.append(card);
  }
  return hand;
}

/** A banner's pictures: its first three tips, big and huddled, a Pokémon among them in the middle; Cards gets the fanned hand. */
function bannerArt(g, tips) {
  const shelf = el('span', 'pdx-banner-mons bdx-banner-things howto-banner-art');
  if (g.id === 'cards') {
    shelf.append(tricard());
    return shelf;
  }
  const three = tips.slice(0, 3);
  const at = three.findIndex(t => t.mon);
  if (at >= 0 && three.length === 3) three.splice(1, 0, ...three.splice(at, 1));
  for (const t of three) shelf.append(art(t, t.mon ? 'bdx-banner-mon' : 'bdx-banner-thing'));
  return shelf;
}

function termsBox(rows) {
  const box = el('div', 'pdx-lcd bdx-terms');
  for (const [label, text] of rows) {
    const row = el('div', 'bdx-term');
    row.append(el('b', 'term-keyword', label), ` ${text}`);
    box.append(row);
  }
  return box;
}

/** Above the banners: About & credits, which lived beside How to play in the old Help menu. */
function about() {
  const b = el('button', 'pdx-lcd howto-about', 'About & credits ▶');
  b.type = 'button';
  b.addEventListener('click', () => openDialog('about-dialog'));
  return b;
}

/** The How to play app for the Pokédex device (js/device.js). */
export const howtoApp = shelfApp({
  groups: TOPICS,
  known: () => true,
  count: (g, tips) => `${tips.length} tips`,
  no: (g) => g.name,
  label: (g, t) => t.name,
  art: (g, t) => art(t, t.mon ? 'pdx-slot-mon' : 'bdx-slot-thing'),
  bannerArt,
  screen: (g, t) => (t.mon ? [el('span', 'pdx-pad'), art(t, 'pdx-mon bdx-art')] : [el('span', 'bdx-glow'), art(t, 'bdx-thing bdx-art')]),
  lines: (g, t) => [typed('', t.text), t.terms && termsBox(t.terms())].filter(Boolean),
  tally: () => 'This topic',
  top: about,
});

/* ============================================================
   held.js  -  held berries (2026-10-15, the user's ask): like the games' held items, your Pokémon holds at most one
   for a run (`run.held = { id, used }`), made at Kurt's Workshop from backyard berries (js/data/workshop.js's `held`
   shelf) and packed before a run starts (js/select.js's Pack). It goes off by itself ONCE a run, in battle, and is then
   eaten. js/battle.js's heldGoes() runs it, pokeDB-sim's engine.js mirrors it. Pure: tests/held.test.mjs.

   When one goes off (`on`):
     hurt    after you lose HP (a hit, Poison in hand, your own cards), still standing: below half your max HP, or
             with `hit`, a single loss of at least that much
     status  an enemy's move puts status cards (Confusion, Paralysis, Poison, Sludge) into your deck; with `cures`,
             only that card
   What it does:
     heal       heal this much (through healPlayer(), so Sudden Death and the like still apply)
     healShare  heal this share of max HP
     strength   gain this much strength for the fight
     clears     throw out every status card in your hand and piles ('all'), or only this card
     shuts      no more of this card lands on you for the rest of the fight
   ============================================================ */

export const HELD = [
  { id: 'oran',   name: 'Oran Berry',   icon: '🫐', sprite: 'oran-berry',   berry: 'oran',   on: 'hurt', heal: 10,
    text: 'Held. The first time your HP drops below half, it\'s eaten: heal 10 HP. Once a run.' },
  { id: 'sitrus', name: 'Sitrus Berry', icon: '🍋', sprite: 'sitrus-berry', berry: 'sitrus', on: 'hurt', healShare: 0.25,
    text: 'Held. The first time your HP drops below half, it\'s eaten: heal 25% of your max HP. Once a run.' },
  { id: 'cheri',  name: 'Cheri Berry',  icon: '🍒', sprite: 'cheri-berry',  berry: 'cheri',  on: 'hurt', hit: 10, strength: 2,
    text: 'Held. The first time one hit takes 10 or more of your HP, it\'s eaten: gain 2 strength for the fight. Once a run.' },
  { id: 'pecha',  name: 'Pecha Berry',  icon: '🍑', sprite: 'pecha-berry',  berry: 'pecha',  on: 'status', cures: 'poison', clears: 'poison', shuts: 'poison',
    text: 'Held. The first time an enemy puts Poison in your deck, it\'s eaten: all your Poison is thrown out, and no more lands that fight. Once a run.' },
  { id: 'lum',    name: 'Lum Berry',    icon: '🍏', sprite: 'lum-berry',    berry: 'lum',    on: 'status', clears: 'all',
    text: 'Held. The first time an enemy puts a status card in your deck, it\'s eaten: every status card in your hand and piles is thrown out. Once a run.' },
];
export const HELD_BY_ID = Object.fromEntries(HELD.map(h => [h.id, h]));

/** A held berry for a run: { id, used }. */
export const holding = (id) => (HELD_BY_ID[id] ? { id, used: false } : null);

/** The berry `held` holds if it goes off on `event` ('hurt': { hp, maxHp, lost }, 'status': { card }), else null. */
export function heldFires(held, event, at) {
  const h = held && !held.used ? HELD_BY_ID[held.id] : null;
  if (!h || h.on !== event) return null;
  if (event === 'hurt') return at.lost > 0 && at.hp > 0 && (h.hit ? at.lost >= h.hit : at.hp < at.maxHp / 2) ? h : null;
  return !h.cures || h.cures === at.card ? h : null;
}

/** How much a berry heals at `maxHp` (0 for one that doesn't). */
export const heldHeal = (h, maxHp) => h.heal || Math.floor(maxHp * (h.healShare || 0));

/** Whether a card is one a berry's `clears` throws out. */
export const clearsCard = (h, card) => !!card?.status && (h.clears === 'all' || h.clears === card.id);

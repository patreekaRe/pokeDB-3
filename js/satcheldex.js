/* ============================================================
   satcheldex.js  -  the Satchel app for the Collection device (docs/roadmap.md's Towns step 6, session 1, 2026-10-14):
   the home stash that outlives runs, readable mid-run too, on shelfApp() (js/bagdex.js). Three banners: Key Items (one
   of a kind: shards, Pat's letter, what Kurt's Workshop makes), Materials (counts, by biome, each saying what it's for)
   and Gifts. A thing new to it wears a "!". The questlines have their own app since 2026-10-14 (js/questlog.js).
   Shown only while the towns are on (townsOpen()).
   ============================================================ */

import { MATERIALS, MATERIALS_BY_ID, KEY_ITEMS, satchelOf } from './data/satchel.js';
import { GIFTS, workshopOf } from './data/workshop.js';
import { GYM_BY_ID } from './data/gym.js';
import { BIOMES_BY_ID } from './data/enemies.js';
import { getSave } from './storage.js';
import { clearSatchelNews } from './satchel.js';
import { showBadgeNews } from './trainercard.js';
import { shelfApp, typed } from './bagdex.js';
import { el } from './ui.js';

const sat = () => satchelOf(getSave());
const no = (list, t) => `No.${String(list.indexOf(t) + 1).padStart(2, '0')}`;

/** Where a material turns up (js/data/satchel.js's DROPS and SPARKLES). */
const where = (m) => {
  const biome = BIOMES_BY_ID[m.biome]?.name ?? 'wild';
  return m.from === 'map' ? `Glints in sparkling rooms on the map, in the ${biome}.` : `Dropped by Pokémon in the ${biome}, and found in its sparkling rooms.`;
};

const GROUPS = [
  { id: 'keys', name: 'Key Items', sub: 'One of a kind', b1: '#e8b830', b2: '#6a4a08', list: () => KEY_ITEMS },
  { id: 'mats', name: 'Materials', sub: 'Kept between runs', b1: '#8ac060', b2: '#2c5a1c', list: () => MATERIALS },
  { id: 'gifts', name: 'Gifts', sub: 'From Kurt\'s Workshop', b1: '#f07aa8', b2: '#8a2a5a', list: () => GIFTS },
];
const held = (t) => workshopOf(getSave()).gifts[t.makes];

function glyph(t, cls, known) {
  return el('span', `${cls} sdx-glyph${known ? '' : ' unseen'}`, t.icon);
}

const known = (g, t) => {
  const s = sat();
  if (g.id === 'keys') return s.keys.includes(t.id);
  if (g.id === 'mats') return s.seen.includes(t.id);
  return held(t) !== undefined;
};

/** The Satchel app. */
export const satchelApp = () => shelfApp({
  groups: GROUPS,
  known,
  fresh: (g, t) => sat().fresh.includes(t.id),
  shown: (g, t) => { clearSatchelNews([t.id]); showBadgeNews(); },
  no: (g, t) => (g.id === 'mats' ? BIOMES_BY_ID[t.biome]?.name ?? '' : no(g.list(), t)),
  label: (g, t, k) => (k ? t.name : '???'),
  art: (g, t, k, where) => glyph(t, where === 'banner' ? 'bdx-banner-thing' : 'bdx-slot-thing', k),
  screen(g, t, k) {
    const nodes = [el('span', 'bdx-glow'), glyph(t, 'bdx-thing bdx-art', k)];
    if (g.id === 'mats' && k) nodes.push(el('span', 'pdx-role sdx-count', `×${sat().mats[t.id] || 0}`));
    if (g.id === 'gifts' && k) nodes.push(el('span', 'pdx-role sdx-count', `×${held(t) || 0}`));
    return nodes;
  },
  lines(g, t, k) {
    if (g.id === 'keys') return k ? [typed('', t.text), typed('muted', t.how)] : [typed('muted', 'Not found yet.'), typed('muted', t.how)];
    if (g.id === 'gifts') {
      const fond = workshopOf(getSave()).fond.includes(t.leader), who = GYM_BY_ID[t.leader]?.name;
      return k ? [typed('', `Held: ${held(t) || 0}`), typed('', t.text), typed('muted', fond ? `${who}'s favourite. You've given them one.` : `Someone's favourite. Give it to them at home.`)]
        : [typed('muted', 'Not made yet.'), typed('muted', `Kurt makes it from ${Object.entries(t.needs).map(([id, n]) => `${n} ${MATERIALS_BY_ID[id].name}`).join(' and ')}.`)];
    }
    return k ? [typed('', `Held: ${sat().mats[t.id] || 0}`), typed('', t.use), typed('muted', where(t))]
      : [typed('muted', 'Not found yet.'), typed('muted', where(t))];
  },
  tally: (g, done) => (g.id === 'gifts' ? (done ? '★ Every gift made' : 'Made') : done ? `★ Every ${g.id === 'keys' ? 'key item' : 'material'} found` : 'Found'),
  doneSub: 'All found!',
});

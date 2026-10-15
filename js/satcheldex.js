/* ============================================================
   satcheldex.js  -  the Satchel app for the Collection device (docs/roadmap.md's Towns step 6, session 1, 2026-10-14):
   the home stash that outlives runs, readable mid-run too, on shelfApp() (js/bagdex.js). Three banners: Key Items (one
   of a kind: shards, Pat's letter, what Kurt's Workshop makes), Materials (counts, by biome, each saying what it's for)
   and Quests (each town's questline: where it stands and what it still needs). A thing new to it wears a "!".
   Shown only while the towns are on (townsOpen()).
   ============================================================ */

import { MATERIALS, MATERIALS_BY_ID, KEY_ITEMS, satchelOf } from './data/satchel.js';
import { GIFTS, workshopOf } from './data/workshop.js';
import { TOWNS, RING, CLEARING, clearingLit, townState, questOf, questStep, questDone, greeterOf, stepText, stepHave, mended } from './data/towns.js';
import { GYM_BY_ID, spriteOf } from './data/gym.js';
import { BIOMES_BY_ID } from './data/enemies.js';
import { getSave } from './storage.js';
import { clearSatchelNews } from './satchel.js';
import { showBadgeNews } from './trainercard.js';
import { shelfApp, typed } from './bagdex.js';
import { el } from './ui.js';

const sat = () => satchelOf(getSave());
const QUEST_TOWNS = [CLEARING, ...RING.map(t => TOWNS[t.id])].filter(t => questOf(t));   // the Clearing's first (step 7)
const no = (list, t) => `No.${String(list.indexOf(t) + 1).padStart(2, '0')}`;
const newsId = (g, t) => (g.id === 'quests' ? `q:${t.id}` : t.id);

/** Where a material turns up (js/data/satchel.js's DROPS and SPARKLES). */
const where = (m) => {
  const biome = BIOMES_BY_ID[m.biome]?.name ?? 'wild';
  return m.from === 'map' ? `Glints in sparkling rooms on the map, in the ${biome}.` : `Dropped by Pokémon in the ${biome}, and found in its sparkling rooms.`;
};

const GROUPS = [
  { id: 'keys', name: 'Key Items', sub: 'One of a kind', b1: '#e8b830', b2: '#6a4a08', list: () => KEY_ITEMS },
  { id: 'mats', name: 'Materials', sub: 'Kept between runs', b1: '#8ac060', b2: '#2c5a1c', list: () => MATERIALS },
  { id: 'quests', name: 'Quests', sub: 'The towns\' Waystones', b1: '#5a8ef0', b2: '#24448a', list: () => QUEST_TOWNS },
  { id: 'gifts', name: 'Gifts', sub: 'From Kurt\'s Workshop', b1: '#f07aa8', b2: '#8a2a5a', list: () => GIFTS },
];
const held = (t) => workshopOf(getSave()).gifts[t.makes];

/** Who stands for a town's questline: the leader of its step up now, else the one who greeted you, else its first. */
function questLeader(town, st) {
  const step = questStep(town, st);
  return GYM_BY_ID[step?.by ?? greeterOf(town, getSave()) ?? Object.keys(town.leaders)[0]];
}

function glyph(t, cls, known) {
  return el('span', `${cls} sdx-glyph${known ? '' : ' unseen'}`, t.icon);
}

function leaderImg(town, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = spriteOf(questLeader(town, townState(getSave(), town.id)));
  img.alt = '';
  img.draggable = false;
  return img;
}

const known = (g, t) => {
  const s = sat();
  if (g.id === 'keys') return s.keys.includes(t.id);
  if (g.id === 'mats') return s.seen.includes(t.id);
  if (g.id === 'gifts') return held(t) !== undefined;
  return !!townState(getSave(), t.id).quest;
};

/** A questline's steps as a list: done ones ticked, the one up now with how far along, the rest unknown. */
function questLines(town) {
  const save = getSave(), st = townState(save, town.id), s = sat(), steps = questOf(town).steps;
  const box = el('div', 'pdx-lcd bdx-terms sdx-steps');
  steps.forEach((step, i) => {
    const line = el('div', 'bdx-term');
    if (i < st.quest.step) line.append(el('b', 'sdx-done', '✓'), ` ${stepText(step)}`);
    else if (i === st.quest.step) {
      const have = stepHave(step, st, s);
      line.append(el('b', '', '▶'), ` ${stepText(step)} (${have}/${step.n})`);
    } else line.append(el('b', 'sdx-later', '·'), ' ???');
    box.append(line);
  });
  return box;
}

/** The Satchel app. */
export const satchelApp = () => shelfApp({
  groups: GROUPS,
  known,
  fresh: (g, t) => sat().fresh.includes(newsId(g, t)),
  shown: (g, t) => { clearSatchelNews([newsId(g, t)]); showBadgeNews(); },
  no: (g, t) => (g.id === 'mats' ? BIOMES_BY_ID[t.biome]?.name ?? '' : no(g.list(), t)),
  label: (g, t, k) => (g.id === 'quests' ? (k || t.home || townState(getSave(), t.id).met ? t.name : '???') : k ? t.name : '???'),
  art: (g, t, k, where) => (g.id === 'quests'
    ? leaderImg(t, where === 'banner' ? `bdx-banner-mon${k ? '' : ' unseen'}` : 'pdx-slot-mon')
    : glyph(t, where === 'banner' ? 'bdx-banner-thing' : 'bdx-slot-thing', k)),
  screen(g, t, k) {
    if (g.id === 'quests') {
      const st = townState(getSave(), t.id);
      return [el('span', 'pdx-pad'), leaderImg(t, `pdx-mon gdx-leader bdx-art${k ? '' : ' sdx-shadow'}`),
        el('span', 'pdx-role', mended(st) ? 'Waystone lit' : questDone(t, st) ? 'Done' : k ? 'Under way' : 'Quiet')];
    }
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
    if (g.id === 'mats') return k ? [typed('', `Held: ${sat().mats[t.id] || 0}`), typed('', t.use), typed('muted', where(t))]
      : [typed('muted', 'Not found yet.'), typed('muted', where(t))];
    if (!k && t.home) return [typed('muted', 'Quiet for now.'), typed('muted', 'Beat the Nietos at the Whispering Clearing\'s Gym, then come home.')];
    if (!k) return [typed('muted', 'Quiet for now.'), typed('muted', clearingLit(getSave()) ? `Beat one of ${t.name}'s Gym Leaders at the end of the ${BIOMES_BY_ID[t.biome]?.name}, then pass through.` : 'The Whispering Clearing\'s Waystone comes first: the Nietos\' quest mends it.')];
    const st = townState(getSave(), t.id);
    const now = questStep(t, st);
    return [typed('', questOf(t).story),
      typed(now ? '' : 'muted', now ? `Up now: ${stepText(now)}.` : `${t.name}'s Waystone is whole again.`),
      questLines(t)];
  },
  tally: (g, done) => (g.id === 'quests' ? (done ? '★ Every quest under way' : 'Under way') : g.id === 'gifts' ? (done ? '★ Every gift made' : 'Made') : done ? `★ Every ${g.id === 'keys' ? 'key item' : 'material'} found` : 'Found'),
  doneSub: 'All found!',
});

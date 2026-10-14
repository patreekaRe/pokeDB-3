/* ============================================================
   gymdex.js  -  the Gym Leaders app for the Collection device
   (js/device.js; the user's ask, 2026-10-14): a banner per biome,
   each leader on the handheld. Unmet they're their silhouette and
   "???"; met (their fight began: `save.seen.gym`) the silhouette
   with a name; beaten, in
   colour with their profile. Researched is their Gold badge
   (GYM_GOLD wins), as a Pokédex page's Pokémon are by defeats.
   ============================================================ */

import { GYM_LEADERS, GYM_BIO, GYM_POSTER, GYM_GOLD, spriteOf, gymWins } from './data/gym.js';
import { BIOMES_BY_ID, ENEMY_DEFS } from './data/enemies.js';
import { getSave, clearFinds } from './storage.js';
import { BIOME_INK, badgeArt, showBadgeNews } from './trainercard.js';
import { shelfApp, typed } from './bagdex.js';
import { el } from './ui.js';

const BIOMES = ['clearing', 'shrine', 'wastes', 'ruins', 'thornwood', 'savanna'];
const POOL = new Set(['ruins', 'thornwood', 'savanna']);   // the crossroads' biomes: a "???" banner till walked into

export const gymMet = (save, id) => (save.seen.gym || []).includes(id) || gymWins(save, id) > 0;   // old saves: a win is a meeting
const lost = (save, id) => save.gymLost?.[id] || 0;
const times = (n) => `${n} time${n === 1 ? '' : 's'}`;
const noOf = (l) => `No.${String(GYM_LEADERS.indexOf(l) + 1).padStart(2, '0')}`;
const team = (l) => l.bosses.map(id => (getSave().dex.seen.includes(id) ? ENEMY_DEFS[id]?.name : '???')).join(' · ');

/** Their first line, as a quote: placeholders filled, a family's voice tag dropped. */
function quote(l) {
  const lines = Array.isArray(l.intro[0]) ? l.intro[0] : l.intro;
  const line = lines.find(x => typeof x === 'string') ?? '';
  return line.replace(/^[A-Z]+: /, '').replace(/\{(\w+)\}/g, (m, k) => ({ boss: ENEMY_DEFS[l.bosses[0]]?.name, badge: l.badge, trainer: 'you', name: l.name })[k] ?? m);
}

function sprite(l, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = spriteOf(l);
  img.alt = '';
  img.draggable = false;
  return img;
}

function badgeImg(l, cls) {
  const gold = gymWins(getSave(), l.id) >= GYM_GOLD;
  const img = el('img', cls);
  img.src = badgeArt(gold ? `gym-${l.id}-gold` : `gym-${l.id}`, true);
  img.alt = gold ? `Gold ${l.badge}` : l.badge;
  return img;
}

/** The rematch rewards as a track: the badge, the signed poster, the Gold badge. */
function rewardTrack(l) {
  const wins = gymWins(getSave(), l.id);
  const steps = [
    [1, l.badge, `gym-${l.id}`],
    [GYM_POSTER, 'Signed poster', null],
    [GYM_GOLD, `Gold ${l.badge}`, `gym-${l.id}-gold`],
  ];
  const row = el('div', 'gdx-track');
  for (const [at, name, badge] of steps) {
    const got = wins >= at;
    const step = el('div', `pdx-lcd gdx-step${got ? ' got' : ''}`);
    const pic = el('span', 'gdx-step-pic');
    if (badge) {
      const img = el('img');
      img.src = badgeArt(badge, got);
      img.alt = '';
      pic.append(img);
    } else pic.append(sprite(l, 'gdx-poster'));
    step.append(pic, el('b', '', name), el('small', '', got ? 'Earned' : `${Math.min(wins, at)}/${at} wins`));
    row.append(step);
  }
  return row;
}

function record(l) {
  const save = getSave(), wins = gymWins(save, l.id);
  const box = el('div', 'pdx-lcd bdx-terms gdx-record');
  const line = (label, text) => {
    const d = el('div', 'bdx-term');
    d.append(el('b', '', label), ` ${text}`);
    return d;
  };
  const next = wins >= GYM_GOLD ? '★ Fully researched' : wins >= GYM_POSTER ? `Gold badge at ${GYM_GOLD} wins` : wins >= 1 ? `Signed poster at ${GYM_POSTER} wins` : 'Their badge, for a win';
  box.append(line('Pokémon:', team(l)), line('Wins:', wins), line('Losses:', lost(save, l.id)), line('Next:', next));
  return box;
}

const groups = () => BIOMES.map(biome => {
  const ink = BIOME_INK[biome];
  return {
    id: biome, name: BIOMES_BY_ID[biome].name, sub: `${GYM_LEADERS.filter(l => l.biome === biome).length} Gym Leaders`,
    b1: ink[1], b2: ink[2], scene: biome,
    list: () => GYM_LEADERS.filter(l => l.biome === biome),
    mask() {
      const save = getSave();
      if (!POOL.has(biome) || (save.stats.biomesSeen || []).includes(biome) || GYM_LEADERS.some(l => l.biome === biome && gymMet(save, l.id))) return null;
      return { name: '???', sub: 'A land not walked yet' };
    },
  };
});

/** The Gym Leaders app. */
export const gymApp = () => shelfApp({
  groups: groups(),
  known: (g, l) => gymWins(getSave(), l.id) > 0,
  fresh: (g, l) => getSave().newFinds.gym?.includes(l.id),
  shown: (g, l) => { clearFinds('gym', [l.id]); showBadgeNews(); },
  no: (g, l) => noOf(l),
  label: (g, l) => (gymMet(getSave(), l.id) ? l.name : '???'),
  art: (g, l, known, where) => sprite(l, where === 'banner' ? `bdx-banner-mon${known ? '' : ' unseen'}` : 'pdx-slot-mon'),
  slotCls: (g, l) => (gymWins(getSave(), l.id) >= GYM_GOLD ? 'gdx-gold' : ''),
  screen(g, l, known) {
    const nodes = [el('span', 'pdx-pad'), sprite(l, 'pdx-mon gdx-leader bdx-art'), el('span', 'pdx-role', 'Gym Leader')];
    if (known) nodes.push(badgeImg(l, 'gdx-badge'));
    return nodes;
  },
  lines(g, l, known) {
    const save = getSave();
    if (!gymMet(save, l.id)) return [typed('muted', 'Not met yet.'), typed('muted', `Waits at the end of the ${g.name}, in front of one of its bosses.`)];
    if (!known) {
      const n = lost(save, l.id);
      return [typed('', l.battleName || l.name), typed('muted', n ? `Lost to them ${times(n)}. Beat them to learn who they are.` : 'Beat them to learn who they are.'), record(l)];
    }
    return [typed('', l.battleName || l.name), typed('', GYM_BIO[l.id] ?? ''), record(l)];
  },
  sheetLabel: 'Profile',
  sheet(g, l, known) {
    if (!known) return null;
    const top = el('div', 'gdx-top');
    top.style.setProperty('--b1', g.b1);
    top.style.setProperty('--b2', g.b2);
    const pic = el('span', 'gdx-top-pic');
    pic.append(sprite(l, 'gdx-top-mon'));
    const plate = el('div', 'gdx-top-plate');
    plate.append(el('small', '', `${noOf(l)} · ${g.name}`), el('b', '', l.battleName || l.name), badgeImg(l, 'gdx-top-badge'));
    top.append(pic, plate);
    const label = (text) => el('h3', 'records-label', text);
    return [top,
      label('Profile'), el('p', 'pdx-lcd gdx-bio', GYM_BIO[l.id] ?? ''),
      label('Heard them say'), el('p', 'pdx-lcd gdx-quote', `“${quote(l)}”`),
      label('The record'), record(l),
      label('Rematch rewards'), rewardTrack(l)];
  },
  tally: (g, done) => (done ? '★ Every leader here beaten' : 'Beaten'),
  doneSub: 'All beaten!',
});

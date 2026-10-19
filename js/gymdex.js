/* ============================================================
   gymdex.js  -  the Gym Leaders app for the Collection device
   (js/device.js; the user's ask, 2026-10-14): a banner per biome,
   each leader on the handheld. Unmet they're their silhouette and
   "???"; met (their fight began: `save.seen.gym`) the silhouette
   with a name; beaten, in
   colour with their profile. Researched is their Gold badge
   (GYM_GOLD wins), as a Pokédex page's Pokémon are by defeats.
   Chad Master Kenmatta has a banner of his own after the biomes (the
   user's ask, 2026-10-18): met once you've challenged him (`seen.gym`
   'ken') or walked into his dojo, beaten by a win in a run,
   researched at the Black Belt.
   ============================================================ */

import { GYM_LEADERS, GYM_BIO, GYM_POSTER, GYM_GOLD, spriteOf, gymWins } from './data/gym.js';
import { BIOMES_BY_ID, ENEMY_DEFS, KEN } from './data/enemies.js';
import { BELTS, TRIALS, beltOf, nextBelt, starsOf, kenWinsOf, dojoOf } from './data/dojo.js';
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

/* ---------- Kenmatta ---------- */

const KEN_BIO = 'The Move Tutor, and a Chad Master by his own decree. Teaches by hitting you, trains by hitting the sandbag, and calls everyone bro. Gold leaf on every wall, because he deserves it.';
const KEN_PAGE = { id: 'ken', ken: true, name: 'Ken' };

export const kenMet = (save) => (save.seen.gym || []).includes('ken') || kenWinsOf(save) > 0 || dojoOf(save).met;
const kenBlack = (save) => beltOf(save) === BELTS.length - 1;

function kenSprite(cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = KEN.image;
  img.alt = '';
  img.draggable = false;
  return img;
}

function kenBadge(cls) {
  const black = kenWinsOf(getSave()) >= 3;
  const img = el('img', cls);
  img.src = badgeArt(black ? 'black-belt' : 'dojo', true);
  img.alt = black ? 'Black Belt Badge' : 'Dojo Badge';
  return img;
}

function kenRecord() {
  const save = getSave(), next = nextBelt(save);
  const box = el('div', 'pdx-lcd bdx-terms gdx-record');
  const line = (label, text) => {
    const d = el('div', 'bdx-term');
    d.append(el('b', '', label), ` ${text}`);
    return d;
  };
  const need = next && [next.stars && `${next.stars} more ★`, next.wins && `${next.wins} more win${next.wins === 1 ? '' : 's'}`].filter(Boolean).join(' and ');
  box.append(line('Wins:', kenWinsOf(save)), line('Losses:', save.kenLost || 0), line('Belt:', BELTS[beltOf(save)].name),
    line('Trials:', `★ ${starsOf(save)}/${TRIALS.length}`), line('Next:', next ? `${next.belt.name}: ${need}` : '★ Fully researched'));
  return box;
}

/** The belts as a track, white to black, each lit once it's been tied on. */
function beltTrack() {
  const at = beltOf(getSave());
  const row = el('div', 'gdx-track');
  BELTS.forEach((b, i) => {
    const got = at >= i;
    const step = el('div', `pdx-lcd gdx-step${got ? ' got' : ''}`);
    const pic = el('span', 'gdx-step-pic');
    const belt = el('span', 'gdx-belt');
    belt.style.setProperty('--belt', b.colour);
    belt.style.setProperty('--knot', b.knot);
    pic.append(belt);
    const how = [b.stars && `${b.stars}★`, b.wins && `${b.wins} win${b.wins === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
    step.append(pic, el('b', '', b.name), el('small', '', got ? 'Earned' : how));
    row.append(step);
  });
  return row;
}

const kenSpec = {
  known: () => kenWinsOf(getSave()) > 0,
  no: () => 'DOJO',
  label: () => (kenMet(getSave()) ? KEN_PAGE.name : '???'),
  art: (known, where) => kenSprite(where === 'banner' ? `bdx-banner-mon${known ? '' : ' unseen'}` : 'pdx-slot-mon'),
  slotCls: () => (kenBlack(getSave()) ? 'gdx-gold' : ''),
  screen(known) {
    const nodes = [el('span', 'pdx-pad'), kenSprite('pdx-mon gdx-leader bdx-art'), el('span', 'pdx-role', 'Dojo Master')];
    if (known) nodes.push(kenBadge('gdx-badge'));
    return nodes;
  },
  lines(known) {
    const save = getSave();
    if (!kenMet(save)) return [typed('muted', 'Not met yet.'), typed('muted', 'Teaches moves in a ? room. Some say he can be challenged.')];
    if (!known) {
      const n = save.kenLost || 0;
      return [typed('', KEN.name), typed('muted', n ? `Lost to him ${times(n)}. Beat him to learn who he is.` : 'Beat him in a run to learn who he is.'), kenRecord()];
    }
    return [typed('', KEN.name), typed('', KEN_BIO), kenRecord()];
  },
  sheet(g, known) {
    if (!known) return null;
    const top = el('div', 'gdx-top');
    top.style.setProperty('--b1', g.b1);
    top.style.setProperty('--b2', g.b2);
    const pic = el('span', 'gdx-top-pic');
    pic.append(kenSprite('gdx-top-mon'));
    const plate = el('div', 'gdx-top-plate');
    plate.append(el('small', '', `Dojo Master · ${BELTS[beltOf(getSave())].name}`), el('b', '', KEN.name), kenBadge('gdx-top-badge'));
    top.append(pic, plate);
    const label = (text) => el('h3', 'records-label', text);
    return [top,
      label('Profile'), el('p', 'pdx-lcd gdx-bio', KEN_BIO),
      label('Heard him say'), el('p', 'pdx-lcd gdx-quote', `“${KEN.taunts.half.replace(/^"|"$/g, '')}”`),
      label('The record'), kenRecord(),
      label('Belts'), beltTrack()];
  },
};

const dojoGroup = () => ({
  id: 'dojo', name: 'Kenmatta\'s Dojo', sub: 'The Move Tutor', b1: '#d84a2c', b2: '#5a1410', scene: 'kombat',
  list: () => [KEN_PAGE],
  mask: () => (kenMet(getSave()) ? null : { name: '???', sub: 'A master not met yet' }),
});

const groups = () => [...BIOMES.map(biome => {
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
}), dojoGroup()];

/** The Gym Leaders app. */
export const gymApp = () => shelfApp({
  groups: groups(),
  known: (g, l) => (l.ken ? kenSpec.known() : gymWins(getSave(), l.id) > 0),
  fresh: (g, l) => getSave().newFinds.gym?.includes(l.id),
  shown: (g, l) => { clearFinds('gym', [l.id]); showBadgeNews(); },
  no: (g, l) => (l.ken ? kenSpec.no() : noOf(l)),
  label: (g, l) => (l.ken ? kenSpec.label() : gymMet(getSave(), l.id) ? l.name : '???'),
  art: (g, l, known, where) => (l.ken ? kenSpec.art(known, where) : sprite(l, where === 'banner' ? `bdx-banner-mon${known ? '' : ' unseen'}` : 'pdx-slot-mon')),
  slotCls: (g, l) => (l.ken ? kenSpec.slotCls() : gymWins(getSave(), l.id) >= GYM_GOLD ? 'gdx-gold' : ''),
  screen(g, l, known) {
    if (l.ken) return kenSpec.screen(known);
    const nodes = [el('span', 'pdx-pad'), sprite(l, 'pdx-mon gdx-leader bdx-art'), el('span', 'pdx-role', 'Gym Leader')];
    if (known) nodes.push(badgeImg(l, 'gdx-badge'));
    return nodes;
  },
  lines(g, l, known) {
    if (l.ken) return kenSpec.lines(known);
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
    if (l.ken) return kenSpec.sheet(g, known);
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
  tally: (g, done) => (done ? (g.id === 'dojo' ? '★ The master beaten' : '★ Every leader here beaten') : 'Beaten'),
  doneSub: 'All beaten!',
});

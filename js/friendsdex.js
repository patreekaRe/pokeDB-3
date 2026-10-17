/* ============================================================
   friendsdex.js  -  the Friends app for the Collection device (2026-10-16, the user's ask: it was a page on the
   Clearing's PC, whose FRIENDS row now opens this). A banner for every friend who takes a gift (js/data/workshop.js's
   FRIENDS), each opening the Gym Leaders app's handheld on them: their hearts, their three pieces, and what the next
   heart brings. Its "!" and what a friend's is are js/data/friends.js's. Shown only while the towns are on, once a
   gift-taking leader is beaten.
   ============================================================ */

import { FRIENDS, FAVOURITE, HEARTS, SECRETS, SECRET_AT, gifteeOf, heartsOf, workshopOf } from './data/workshop.js';
import { friendMet, friendFresh, seeFriends, friendPieces, nextHeart } from './data/friends.js';
import { FRIEND_TOWN } from './data/favours.js';
import { TOWNS } from './data/towns.js';
import { GYM_BY_ID, GYM_INK, spriteOf } from './data/gym.js';
import { getSave, updateSave } from './storage.js';
import { showBadgeNews } from './trainercard.js';
import { shelfApp, typed } from './bagdex.js';
import { el, heartRow } from './ui.js';

let PIECES = null;   // js/base-furniture.js's paintings, loaded the first time the app opens (it's not in the start-up graph)

/** `?hearts=N` on a playtest: every friend at N hearts (nothing saved). */
const peek = () => { const n = new URLSearchParams(location.search).get('hearts'); return n === null ? null : Math.max(0, Math.min(HEARTS, +n || 0)); };
const heartsAt = (id) => peek() ?? heartsOf(workshopOf(getSave()), id);
/** The home screen's count: every friend's hearts together. */
export const friendsCount = () => `${FRIENDS.reduce((n, id) => n + heartsAt(id), 0)}/${FRIENDS.length * HEARTS} hearts`;
const met = (id) => friendMet(getSave(), id) || peek() > 0;
const who = (l) => gifteeOf(l.id, l.name.replace(/^THE /, ''));
const home = (id) => (FRIEND_TOWN[id] === 'clearing' ? 'the Clearing' : TOWNS[FRIEND_TOWN[id]]?.name ?? 'their town');
const pieceName = (kind) => PIECES?.[kind]?.name ?? kind;

function sprite(l, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = spriteOf(l);
  img.alt = '';
  img.draggable = false;
  return img;
}

/** A piece's painting cropped to what's painted, as the Secret Base's tray shows it (a painting is mostly empty canvas,
    so uncropped it sat small and low in its tile). */
function pieceArt(kind) {
  const c = document.createElement('canvas'), p = PIECES?.[kind];
  if (!p) return c;
  const a = p.art(0, 2), d = a.getContext('2d').getImageData(0, 0, a.width, a.height).data;
  let x0 = a.width, y0 = a.height, x1 = 0, y1 = 0;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) if (d[(y * a.width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  c.width = Math.max(1, x1 - x0 + 1); c.height = Math.max(1, y1 - y0 + 1);
  c.getContext('2d').drawImage(a, -x0, -y0);
  return c;
}

/** Their three pieces as a track, like the Gym Leaders app's rematch rewards. */
function pieceTrack(l) {
  const row = el('div', 'gdx-track fdx-track');
  for (const p of friendPieces(getSave(), l.id, heartsAt(l.id))) {
    const step = el('div', `pdx-lcd gdx-step fdx-step${p.got ? ' got' : ''}`);
    const pic = el('span', 'gdx-step-pic fdx-pic');
    pic.append(pieceArt(p.kind));
    step.append(pic, el('b', '', pieceName(p.kind)), el('small', '', p.got ? 'Earned' : p.at ? `At ${p.at} ♥` : 'Favourite gift'));
    row.append(step);
  }
  return row;
}

const PERK = {
  letters: 'letters in the PC\'s mail',
  visits: 'visits to your Secret Base',
  requests: 'a request of their own',
  recipe: 'their secret Apricorn recipe',
  badge: 'their Friendship Badge',
};
const and = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0]);

/** What the next heart that brings anything brings, in a line. */
function nextLine(id, n) {
  const next = nextHeart(id, n);
  if (!next) return 'Best friends: everything they give is yours.';
  const gifts = [...(next.piece ? [`the ${pieceName(next.piece)}`] : []), ...next.perks.map(p => PERK[p])];
  return `At ${next.at} ♥: ${and(gifts)}.`;
}

function hearts(n) {
  const box = el('div', 'pdx-lcd fdx-hearts');
  box.append(heartRow(n, HEARTS), el('span', '', `${n} of ${HEARTS}`));
  return box;
}

/** A banner each (the user's ask, 2026-10-16: not rows under one Friends banner), in their Gym's ink, their hearts under
    their name; a friend not met yet a ??? and a silhouette. */
const groups = () => FRIENDS.filter(id => GYM_BY_ID[id]).map(id => ({
  id, name: GYM_BY_ID[id].name, sub: '', b1: GYM_INK[id]?.[1] ?? '#f07aa8', b2: GYM_INK[id]?.[2] ?? '#8a2a5a', cls: 'fdx-banner',
  list: () => [GYM_BY_ID[id]],
  mask: () => (met(id) ? null : { name: '???', sub: 'Not met yet' }),
}));

/** The Friends app: the save stamps every friend the first time it opens, which takes the app's "!" away for good. */
export function friendsApp() {
  const shelf = shelfApp({
    groups: groups(),
    deviceCls: 'fdx-device',
    subArt: (g) => heartRow(heartsAt(g.id), HEARTS, 'fdx-banner-hearts'),
    known: (g, l) => met(l.id),
    fresh: (g, l) => friendFresh(getSave(), l.id),
    shown: (g, l) => { updateSave(d => { d.friendsSeen = seeFriends(d, [l.id]); }); showBadgeNews(); },
    no: (g, l) => `No.${String(FRIENDS.indexOf(l.id) + 1).padStart(2, '0')}`,
    label: (g, l, known) => (known ? l.name : '???'),
    art: (g, l, known, where) => sprite(l, where === 'banner' ? `bdx-banner-mon${known ? '' : ' unseen'}` : 'pdx-slot-mon'),
    slotCls: (g, l) => (heartsAt(l.id) >= HEARTS ? 'gdx-gold' : ''),
    score: (g, things) => [things.reduce((n, l) => n + heartsAt(l.id), 0), things.length * HEARTS],
    screen(g, l, known) {
      const n = heartsAt(l.id), nodes = [el('span', 'pdx-pad'), sprite(l, 'pdx-mon gdx-leader bdx-art')];
      if (known) nodes.push(el('span', 'pdx-role fdx-role', n >= HEARTS ? 'Best friend' : 'Friend'));
      return nodes;
    },
    lines(g, l, known) {
      if (!known) return [typed('muted', 'Not met yet.'), typed('muted', 'Beat them at their Gym, then give them a gift at home.')];
      const n = heartsAt(l.id), fond = workshopOf(getSave()).fond.includes(l.id);
      const lines = [hearts(n),
        typed('', fond ? `Loves the ${FAVOURITE[l.id].name}. Gifts from Kurt's Workshop, given in ${home(l.id)}.` : `Their favourite gift: ???. Every gift fills a heart; their favourite two.`)];
      if (n >= SECRET_AT && SECRETS[l.id]) lines.push(typed('', `${who(l)} taught Kurt the ${SECRETS[l.id].name}.`));
      lines.push(pieceTrack(l), typed('muted', nextLine(l.id, n)));
      return lines;
    },
    tally: (g, done) => (done ? '★ Best friends' : 'Hearts'),
    doneSub: 'Best friends!',
  });
  return {
    ...shelf,
    mount(panel, at) {
      if (!getSave().friendsSeen) {
        updateSave(d => { d.friendsSeen = seeFriends(d); });
        showBadgeNews();
      }
      if (PIECES) return shelf.mount(panel, at);
      import('./base-furniture.js').then(m => {
        PIECES = m.PIECES;
        if (panel.isConnected) shelf.mount(panel, at);
      });
    },
  };
}

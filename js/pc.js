/* ============================================================
   pc.js  -  the Clearing's PC (2026-10-09, the user's ask), full screen over the hub: a white hood round a striped cyan
   screen on a red stand, like the PC beside the plaza (pcModel() in js/hub-pc.js). Gen 3's PC menu, grouped since 2026-10-11:
   rewards, then your Pokémon (the walking buddy, `save.buddy`, never the Pokédex's partner; and the Secret Base's residents,
   `secretBase.mons`; Bill's PC that held them is gone), your own PC your name, Prof. Oak's PC rates your Pokédex and hints at the next unlock, the cloud save's Sign in (the title corner's PC, which the hub hides), then
   the Hall of Fame and Exit PC. The Mailbox on top holds rewards posted to the PC (js/mail.js): a letter opens out of its
   envelope and its PokéCoins are claimed there. Patch notes (since 2026-10-10, the user's ask: the hub's corner version tag
   moved in) list each version, the small changes since the newest and what's in the game (js/patchnotes.js). Everything else about you and the game stays in the Pokédex; the PC is your Pokémon and
   your things.
   ============================================================ */

import { journalReady } from './data/journal.js';
import { rangerSlots } from './data/ranger.js';
import { getSave, updateSave, coinsWithBonus, safariSparkle } from './storage.js';
import { shinyImage } from './data/shinies.js';
import { buddy, buddyChoices } from './trainercard.js';
import { trainerName, setTrainerName } from './leaderboard.js';
import { NAME_MAX } from './data/leaderboard.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { SAFARI_DEX_PAGES } from './data/safari.js';
import { bookEntries } from './halloffame.js';
import { playSound, playCry } from './audio.js';
import { calmFx } from './prefs.js';
import { cloudConfigured, cloudRemembered, openCloud } from './cloud.js';
import { el } from './ui.js';
import { senderOf, unclaimed, claim, trainersLetter } from './mail.js';
import { myCode, publishTrainer } from './trainers.js';
import { formatCode } from './data/trainers.js';
import { missions, claimable, claimMission, claimBonus, timeLeft } from './missions.js';
import { MISSIONS_BY_ID, BONUS, missionText, isDone, bonusReady } from './data/missions.js';
import { smoothIcon } from './smooth-icons.js';
import { DEX_PAGES, DEPTHS_PAGE, BONUS_PAGES, DEX_COMPLETE_COINS, SCOPE, safariOpen } from './data/pokedex.js';
import { researchCount, bonusKnown, depthsKnown } from './pokedex.js';
import { SAFARI_AREA_COINS } from './data/safari.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { isStarterUnlocked } from './progress.js';
import { PIECES, KINDS_OF, icon, loadBase, decorations, freshDesigns, seeDesign, putAway, buyBigRoom, buyRoom, buyDoor, buyYard, buyBigYard, takeDown, dupePrice, duplicate, BIG_PRICE, ROOM_PRICE, DOOR_PRICE, YARD_PRICE, BIG_YARD_PRICE } from './secret-base.js';
import { loadStatues, statuesIn, statueReady } from './base-furniture-statues.js';
import { loadFigures, figuresToLoad } from './base-figures.js';
import { ROOM_KINDS, BUILDABLE, houseRooms, fitRoom, fitsOf, joinPips, takenOn, topFloor, floorName, pipTile, linkOf, pipUsed, entryOf, shapeOf, yardKind } from './data/house.js';
import { PATCHES } from './data/patchnotes.js';
import { latestPatch, patchUnseen, markPatchSeen, patchNode, sincePatch, inTheGame } from './patchnotes.js';
import { pcNew, markPcSeen, pcLookedAt } from './pc-news.js';
import { RECIPES_BY_ID } from './data/workshop.js';
import { friendsOpen, friendsNews } from './data/friends.js';
import { openDeviceApp } from './collection.js';
import { MATERIALS_BY_ID } from './data/satchel.js';
import { starClass } from './data/difficulty.js';

/** Safari catches living in the Secret Base at once. */
export const RESIDENTS = 6;
/** How many Safari catches can live in the base: six, and one more for each Ranger Task Board task that gives room. */
export const residentCap = (save = getSave()) => RESIDENTS + rangerSlots(save);

/** Every catch that can live in the base, and the ones that do: the save's pick, or before one is made the first
    RESIDENTS caught (js/base-3d.js's onShow() reads the same). */
export function residents(save = getSave(), lend = false) {
  const caught = new Set(save.safariDex?.caught || []);
  const all = [...new Set(SAFARI_DEX_PAGES.flatMap(p => p.ids))].filter(id => (lend || caught.has(id)) && ENEMY_DEFS[id]);
  return { all, shown: (save.secretBase?.mons ?? all.slice(0, residentCap(save))).filter(id => all.includes(id)) };
}

/** Who a resident is: a Safari catch (an ENEMY_DEFS id), shiny once its shiny is yours (`mine`: not a friend's base),
    with its Sparkle. */
export function resident(id, mine = true) {
  const def = ENEMY_DEFS[id], sparkle = mine ? safariSparkle(id) : 0;
  return { image: sparkle ? shinyImage(id) : def.image, name: `${sparkle ? 'Shiny ' : ''}${def.name}`, cry: def.spriteId ?? id, sparkle };
}

let root = null, glass = null, say = null, onClose = null, onFame = null, page = 'home', typing = 0, letter = null, hint = 0;
let start = 'home', reading = 0, deco = null, decoKind = 'All', inBase = false, buddyShiny = null;
let dupes = false;   // Decorations picking a piece to duplicate, not to put away
// House upgrades: the doorway picked on the blueprint ({ room, pip, up } to build onto, or { join } between two rooms), the
// room kind tried there and which of its turns, the floor looked at, and a built room picked (to take down, `sure` once asked)
let spot = null, plan = null, turn = 0, floor = 0, picked = null, sure = false;
let yardTab = false;   // the blueprint's BACKYARD tab, the yard drawn on its own (the user's ask: over 1F it sat under the rooms)
// the blueprint's zoom and the point it's centred on, in tiles; kept across the redraw every tap makes
let view = { z: 1, cx: null, cy: null };
const resetView = () => { view = { z: 1, cx: null, cy: null }; };
const unpick = () => { spot = plan = picked = null; turn = 0; sure = false; };
const ownsYard = (house) => !!house?.yard && !house.yard.lent;   // ?yard lends one for a playtest
const canGrowYard = (house) => ownsYard(house) && !(house.yard.size > 1);
/** What the PC says on the BACKYARD tab: the plot to buy, the bought one to make bigger, or the one grown as big as it goes. */
const yardSay = (house) => canGrowYard(house)
  ? `Make your backyard bigger, ${BIG_YARD_PRICE.toLocaleString()} PokéCoins? Everything out there keeps its place by the gate.`
  : ownsYard(house) ? 'Your backyard, as big as it grows, through the garden arch beside the Ancient Tree.'
  : !inBase && !getSave().baseOwned ? 'A backyard behind the Ancient Tree. Make the Ancient Tree your Secret Base first.'
  : `A backyard behind the Ancient Tree, through the garden arch beside it. ${YARD_PRICE.toLocaleString()} PokéCoins.`;

/** Log on. `onClose` runs once it's logged off (the hub swaps in a new walking buddy); `onFame(app)` opens the device's
    Hall of Fame or Record Book over the Clearing. `start: 'decor'` boots onto the Decorations, as the Secret Base's
    Storage PC does (`inBase` lifts it over the base). */
export function openPC(opts = {}) {
  if (root) return;
  ({ onClose = null, onFame = null, start = 'home' } = opts);
  deco = null;
  inBase = !!opts.inBase;
  pcLookedAt(getSave());
  if (cloudConfigured() && cloudRemembered() && !getSave().trainersLetter) {
    if (myCode()) trainersLetter(myCode());
    else publishTrainer().then(code => { if (code) { trainersLetter(code); if (root && page === 'home') show('home'); } });
  }
  root = el('div', `pc-screen${inBase ? ' in-base' : ''}`);
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'PC');
  root.innerHTML = `
    <div class="pc-unit">
      <div class="pc-hood"><span class="pc-cam" aria-hidden="true"><i></i><i></i><i></i></span>
        <div class="pc-glass"><div class="pc-page"></div><p class="pc-say" aria-live="polite"></p></div></div>
      <div class="pc-ledge"></div>
      <div class="pc-stand"><span class="pc-ball" aria-hidden="true"></span><button type="button" class="pc-off">Exit PC</button></div>
    </div>`;
  glass = root.querySelector('.pc-page');
  say = root.querySelector('.pc-say');
  root.querySelector('.pc-off').addEventListener('click', logOff);
  root.addEventListener('pointerdown', (e) => { if (e.target === root) root.dataset.down = '1'; });
  root.addEventListener('pointerup', (e) => { if (e.target === root && root.dataset.down) logOff(); delete root.dataset.down; });
  addEventListener('keydown', onKey);
  document.body.append(root);
  root.classList.toggle('calm', calmFx());
  playSound('pc-on');
  page = 'boot';
  glass.replaceChildren();
  speak(`${trainerName().toUpperCase()} booted up the PC.`);
  setTimeout(() => { if (root && page === 'boot') show(start); }, calmFx() ? 0 : 900);
}

function logOff() {
  if (!root) return;
  playSound('pc-off');
  removeEventListener('keydown', onKey);
  const gone = root;
  root = null;
  gone.classList.add('off');
  setTimeout(() => gone.remove(), calmFx() ? 0 : 320);
  onClose?.();
}

function onKey(e) {
  if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
  e.preventDefault();
  back();
}

const UP = { home: null, prof: 'home', mailbox: 'home', missions: 'home', letter: 'mailbox', buddy: 'home', residents: 'home', mine: 'home', rename: 'mine', decor: 'mine', patches: 'home', patch: 'patches', game: 'patches', house: 'home' };

function back() {
  const up = UP[page];
  if (up === undefined || up === null) return logOff();
  playSound('cancel');
  show(up);
}

/** The text window under the screen's page, typed out a letter at a time like the games'. */
function speak(text) {
  clearInterval(typing);
  if (!say) return;
  if (calmFx()) { say.textContent = text; return; }
  let n = 0;
  say.textContent = '';
  typing = setInterval(() => {
    if (!say) return clearInterval(typing);
    say.textContent = text.slice(0, ++n);
    if (n >= text.length) clearInterval(typing);
  }, 18);
}

let hush = false;

function show(id) {
  page = id;
  markPcSeen(id === 'decor' && dupes ? 'dupe' : id);
  PAGES[id]();
  hush = true;   // the cursor lands on the first row without talking over the page's own line
  glass.querySelector('button')?.focus({ preventScroll: true });
  hush = false;
}

/** The gold "!" bobbing over the corner of something new to read (the user's ask, 2026-10-10: a "(NEW)" in the label
    was easy to miss), the same mark the Pokédex's keys wear. */
const freshMark = () => { const m = el('span', 'pc-new', '!'); m.setAttribute('aria-label', 'New'); return m; };

/** A menu: big rows with a cursor, a line said for each as it's pointed at; a row whose fourth value is true is new, and a
    fifth, { cls, sub }, styles it and puts a small line under its label. */
function menu(title, rows, line = rows[0][1]) {
  const list = el('div', 'pc-menu');
  list.append(...rows.map(([label, line, go, fresh, look]) => {
    const b = el('button', `pc-row ${look?.cls ?? ''}`.trim(), label);
    b.type = 'button';
    if (look?.sub) b.append(el('small', 'pc-sub', look.sub));
    if (fresh) b.append(freshMark());
    const tell = () => { if (!hush) speak(line); };
    b.addEventListener('pointerenter', tell);
    b.addEventListener('focus', tell);
    b.addEventListener('click', () => { playSound('confirm'); go(); });
    return b;
  }));
  glass.replaceChildren(head(title), list);
  speak(line);
}

/** The page's title strip, with a Back key on every page but the first. */
function head(title) {
  const h = el('div', 'pc-head');
  if (UP[page]) {
    const b = el('button', 'pc-back', '◀');
    b.type = 'button';
    b.setAttribute('aria-label', 'Back');
    b.addEventListener('click', back);
    h.append(b);
  }
  h.append(el('b', 'pc-title', title));
  return h;
}

function monTile(src, name, on, tap, tag = '') {
  const b = el('button', `pc-mon${on ? ' on' : ''}`);
  b.type = 'button';
  b.title = name;
  b.setAttribute('aria-label', name);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  const img = el('img', 'pixel');
  Object.assign(img, { src, alt: '', loading: 'lazy', draggable: false });
  b.append(img);
  if (tag) b.append(el('span', 'pc-mon-tag', tag));
  b.addEventListener('click', tap);
  return b;
}

const PAGES = {
  home() {
    const waiting = unclaimed().length, ready = claimable(), journal = journalReady(getSave()).length;
    const save = getSave();
    const fame = bookEntries('fame').length ? 'fame' : bookEntries('record').length ? 'record' : null;
    const patches = ['PATCH NOTES', patchUnseen() ? `Version ${latestPatch.version} is here! Read what's new.` : 'What changed in each version of the game.', () => show('patches'), patchUnseen()];
    // grouped the way a player looks (2026-10-11, the user's ask): rewards, your Pokémon and things, the game's records, the account
    const rows = [
      [waiting ? `MAILBOX (${waiting})` : 'MAILBOX', waiting ? `You've got mail! ${waiting} letter${waiting === 1 ? '' : 's'} waiting, with something inside.` : 'No new mail. Rewards for your Pokédex and big wins arrive here, and letters from friends.', () => show('mailbox'), waiting > 0],
      [ready ? `MISSIONS (${ready})` : 'MISSIONS', ready ? `${ready} mission reward${ready === 1 ? '' : 's'} to claim!` : 'Daily and weekly goals that pay PokéCoins.', () => show('missions'), ready > 0 || pcNew('missions', save)],
      [journal ? `TRAINER'S JOURNAL (${journal})` : 'TRAINER\'S JOURNAL', journal ? `${journal} task${journal === 1 ? '' : 's'} done! Claim ${journal === 1 ? 'it' : 'them'} for PokéCoins.` : 'Goals for the whole game, from your first win to the top of the Sky Pillar, each paying PokéCoins.',
        () => import('./ranger.js').then(m => m.openJournal(() => show('home'))), journal > 0],
      ['WALKING BUDDY', 'Choose the Pokémon that walks with you in the Clearing, your base and the mall.', () => { buddyShiny = null; show('buddy'); }, false, { sub: `Now: ${buddy(save).name}` }],
      ['BASE RESIDENTS', `Choose up to ${residentCap()} Safari catches to live in your Secret Base.`, () => show('residents')],
      [`${trainerName().toUpperCase()}'S PC`, 'Your own things. Change your name here.', () => show('mine'), pcNew('mine', save) || freshDesigns(loadBase()).length > 0],
      ...(inBase || save.baseOwned || save.secretBase ? [['HOUSE UPGRADES', 'Your Secret Base\'s blueprint: make your room bigger and build more rooms onto it.', () => { unpick(); resetView(); floor = 0; yardTab = false; show('house'); }, pcNew('house', inBase ? { baseOwned: true } : save)]] : []),
      ...(friendsOpen(save) ? [['FRIENDS', 'Your friends\' hearts live in your Pokédex now, by the Quests app. This opens it there.', () => { logOff(); openDeviceApp('friends'); }, friendsNews(save), { sub: 'Opens in your Pokédex' }]] : []),
      ...(cloudConfigured() ? [['TRAINERS', cloudRemembered() ? 'Other players you\'ve added, and your trainer code to give out. This opens it in your Pokédex.' : 'Sign in to get a trainer code and add other players. This opens it in your Pokédex.',
        () => { logOff(); openDeviceApp('trainers'); }, false, { sub: myCode() ? `Your code: ${formatCode(myCode())}` : 'Opens in your Pokédex' }]] : []),
      ['PROF. OAK\'S PC', 'Have your Pokédex rated, see how complete it is, and get a hint at what to unlock next.', () => { hint = 0; show('prof'); }, pcNew('prof', save)],
      ...(fame && onFame ? [[fame === 'fame' ? 'HALL OF FAME' : 'RECORD BOOK', fame === 'fame' ? 'The champions of Trainer Level 5.' : 'Every run you have won.', () => { const go = onFame; logOff(); go?.(fame); }]] : []),
      patches,
    ];
    // signed out, the account row stands out near the top, so new players find how to make one (the user's ask, 2026-10-11)
    if (cloudConfigured() && cloudRemembered()) rows.push(['CLOUD SAVE', 'Your progress is kept in the cloud. Check it or sign out here.', signIn]);
    else if (cloudConfigured()) rows.splice(2, 0, ['SIGN IN / SIGN UP', 'Make a free account (Google or email) to keep your progress safe and carry on from your phone or PC.', signIn, false, { cls: 'pc-cloud', sub: 'Free account · saves your progress' }]);
    rows.push(['EXIT PC', 'Turn the PC off and step away.', logOff]);
    const fresh = rows.filter(r => r[3]).map(r => r[0].replace(/ \(\d+\)$/, ''));
    menu('PC', rows, fresh.length ? `New: ${fresh.join(fresh.length > 2 ? ', ' : ' and ').replace(/, ([^,]*)$/, ' and $1')}! Look for the "!".` : rows[0][1]);
  },
  prof() {
    const save = getSave(), beaten = new Set(save.dex.defeated), seen = new Set([...save.dex.seen, ...save.dex.defeated]);
    const main = DEX_PAGES.flatMap(p => p.ids), [done, of] = researchCount();
    const nBeaten = main.filter(id => beaten.has(id)).length;
    const rate = el('div', 'pc-rate');
    rate.append(...[['SEEN', main.filter(id => seen.has(id)).length], ['BEATEN', nBeaten], ['RESEARCHED', done]].map(([k, n]) => {
      const c = el('div', 'pc-rate-n');
      c.append(el('small', '', k), el('b', '', String(n)));
      return c;
    }));

    const list = el('div', 'pc-done');
    const row = (name, n, total, star) => {
      const r = el('div', `pc-done-row${star ? ' star' : ''}`);
      const bar = el('span', 'pc-done-bar');
      bar.style.setProperty('--k', total ? n / total : 0);
      r.append(el('span', 'pc-done-name', `${star ? '★ ' : ''}${name}`), bar, el('span', 'pc-done-n', `${n}/${total}`));
      return r;
    };
    const pageRow = (p) => row(p.name, p.ids.filter(id => beaten.has(id)).length, p.ids.length, save.dex.done.includes(p.biome));
    list.append(el('b', 'pc-done-head', 'POKéDEX'), ...DEX_PAGES.map(pageRow), row('Research', done, of, save.dex.complete));
    const extra = [...(depthsKnown() ? [DEPTHS_PAGE] : []), ...BONUS_PAGES.filter(bonusKnown)];
    if (extra.length) list.append(el('b', 'pc-done-head', 'BONUS PAGES'), ...extra.map(pageRow));
    if (safariOpen(save)) {
      const caught = new Set(save.safariDex.caught);
      list.append(el('b', 'pc-done-head', 'SAFARI POKéDEX'), ...SAFARI_DEX_PAGES.map(p =>
        row(p.name, p.ids.filter(id => caught.has(id)).length, p.ids.length, (save.safariDex.done || []).includes(p.area))));
    }

    const tips = hints(save), at = hint % Math.max(1, tips.length), tip = tips[at];
    const card = el('button', 'pc-hint');
    card.type = 'button';
    const top = el('span', 'pc-hint-top', 'NEXT UNLOCK');
    if (tips.length > 1) top.append(el('span', 'pc-hint-of', `${at + 1}/${tips.length} ▸`));
    card.append(top);
    if (tip?.art) {
      const img = el('img', 'pixel pc-hint-art');
      Object.assign(img, { src: tip.art, alt: '', draggable: false });
      card.append(img);
    }
    card.append(el('span', 'pc-hint-text', tip ? tip.text : 'Nothing left to unlock. Truly a Pokémon Master!'));
    if (tips.length > 1) card.addEventListener('click', () => { playSound('confirm'); hint = at + 1; show('prof'); speak(tips[hint % tips.length].say ?? 'Here\'s another thing to aim for.'); });
    else card.disabled = true;

    glass.replaceChildren(head('PROF. OAK\'S PC'), rate, card, list);
    speak(`PROF. OAK: ${rating(nBeaten, main.length, save.dex.complete)}`);
  },
  mailbox() {
    const mail = [...(getSave().mail || [])].reverse(), waiting = unclaimed().length;
    const h = head('MAILBOX');
    h.append(el('span', 'pc-count', waiting ? `${waiting} new` : ''));
    const list = el('div', 'pc-mail');
    list.append(...mail.map(m => {
      const from = senderOf(m.from);
      const b = el('button', `pc-env${m.claimed ? ' read' : ''}`);
      b.type = 'button';
      b.style.setProperty('--ink', from.ink);
      b.style.setProperty('--paper', from.paper);
      b.append(el('span', 'pc-env-stamp'), el('span', 'pc-env-from', from.name), el('b', 'pc-env-title', m.title));
      if (m.claimed) b.append(el('span', 'pc-env-when', new Date(m.at).toLocaleDateString()));
      else b.append(freshMark());
      b.addEventListener('click', () => { playSound('confirm'); letter = m.id; show('letter'); });
      return b;
    }));
    glass.replaceChildren(h, mail.length ? list : el('p', 'pc-empty', 'No mail yet.'));
    speak(waiting ? 'Tap a letter to open it.' : mail.length ? 'Every letter is opened. Tap one to read it again.' : 'Complete Pokédex pages and win big, and rewards will be sent here.');
  },
  letter() {
    const m = (getSave().mail || []).find(x => x.id === letter);
    if (!m) return show('mailbox');
    const from = senderOf(m.from), fresh = !m.claimed, mat = m.mat && MATERIALS_BY_ID[m.mat.id], recipe = m.recipe && RECIPES_BY_ID[m.recipe];
    const code = m.code && formatCode(m.code), cheer = m.level, read = recipe || code || cheer;
    const wrap = el('div', `pc-letter${fresh ? ' fresh' : ''}`);
    wrap.style.setProperty('--ink', from.ink);
    wrap.style.setProperty('--paper', from.paper);
    const sheet = el('div', 'pc-sheet');
    const prize = el('div', 'pc-prize');
    // a friend's letter holds a material or shows the secret recipe they taught Kurt (step 8, session e)
    if (code) prize.append(el('small', 'pc-prize-label', 'YOUR CODE'), el('b', 'pc-prize-n pc-prize-code', code));
    else if (mat) prize.append(el('span', 'pc-prize-mat', mat.icon), el('b', 'pc-prize-n', `${mat.name} ×${m.mat.n}`));
    // a Gym Leader's letter for a high Level's first win (js/data/level-letters.js): its star, Level 10's the signed photo
    else if (cheer) prize.append(el('span', `pc-prize-mat ${starClass(cheer)}`, m.photo ? '🖼️' : '⭐'), el('b', 'pc-prize-n', m.photo ? 'Signed photo' : `Level ${cheer}`));
    else if (recipe) {
      const img = el('img', 'pc-prize-ball pixel');
      Object.assign(img, { src: `assets/items/${recipe.sprite}.png`, alt: '', draggable: false });
      prize.append(img, el('b', 'pc-prize-n', recipe.name));
    } else prize.append(smoothIcon('coin', 'pc-prize-coin'), el('b', 'pc-prize-n', `${(m.coins || 0).toLocaleString()}`));
    sheet.append(el('span', 'pc-sheet-from', `From: ${from.name}`), el('b', 'pc-sheet-title', m.title), el('p', 'pc-sheet-text', m.text), prize);
    if (!fresh) sheet.append(el('span', 'pc-claimed', read ? 'READ' : 'CLAIMED'));
    wrap.append(el('div', 'pc-env-back'), sheet, el('div', 'pc-env-front'), el('div', 'pc-env-flap'));
    const kids = [head(m.title.toUpperCase()), wrap];
    if (fresh) {
      const ok = el('button', 'room-ok pc-claim', read ? 'Read' : 'Claim');
      ok.type = 'button';
      ok.addEventListener('click', () => {
        if (ok.classList.contains('pressed')) return;
        ok.classList.add('pressed');   // pushed in and lit, like every room's confirm (pressConfirm() in js/rewards.js)
        const paid = claim(m.id);
        playSound('item-get');
        if (!mat && !read) countUp(prize.querySelector('.pc-prize-n'), paid);
        sheet.append(el('span', 'pc-claimed', read ? 'READ' : 'CLAIMED'));
        wrap.classList.add('paid');
        const me = trainerName().toUpperCase();
        speak(code ? `Open the Trainers app on your Pokédex to add a friend.` : mat ? `${me} put ${mat.name} ×${m.mat.n} in the Satchel!` : recipe ? `Kurt can make the ${recipe.name} now. Visit his Workshop!` : m.photo ? 'The signed photo is in your Secret Base: Decorate, Wall.' : cheer ? `Keep climbing, ${me}!` : `${me} received ${paid.toLocaleString()} PokéCoins!`);
      });
      kids.push(ok);
    }
    glass.replaceChildren(...kids);
    speak(fresh ? `A letter from ${from.name}!` : `Opened ${new Date(m.claimed).toLocaleDateString()}.`);
  },
  missions() {
    const all = missions(), ready = claimable();
    const h = head('MISSIONS');
    h.append(el('span', 'pc-count', ready ? `${ready} to claim` : ''));
    const box = el('div', 'pc-quests');
    for (const kind of ['daily', 'weekly']) {
      const roll = all[kind];
      const top = el('div', 'pc-quest-head');
      top.append(el('b', '', kind === 'daily' ? 'DAILY' : 'WEEKLY'), el('span', 'pc-quest-left', `New in ${timeLeft(kind)}`));
      box.append(top, ...roll.list.map(e => questRow(kind, e)), bonusRow(kind, roll));
    }
    glass.replaceChildren(h, box);
    speak(ready ? 'Mission complete! Tap Claim for your PokéCoins.' : 'Missions count as you play: runs, the Safari Zone and the Sky Pillar all count. Come back to claim them.');
  },
  patches() {
    const since = sincePatch(), fresh = patchUnseen();
    const rows = PATCHES.map((p, i) => [`V${p.version}`, `${p.name}, ${p.date}.`, () => { reading = i; show('patch'); }, i === 0 && fresh]);
    if (since) rows.unshift([`SINCE V${since.since}`, `Smaller changes since v${since.since}, on their way into the next version.`, () => { reading = -1; show('patch'); }]);
    rows.push(['IN THE GAME', 'Everything in the game so far.', () => show('game')]);
    menu('PATCH NOTES', rows);
  },
  patch() {
    const p = reading < 0 ? sincePatch() : PATCHES[reading];
    if (!p) return show('patches');
    const fresh = p === latestPatch && patchUnseen();
    if (p === latestPatch) markPatchSeen();
    const notes = el('div', 'pc-notes');
    notes.append(patchNode(p, { icons: false }));
    glass.replaceChildren(head(p.since ? `SINCE V${p.since}` : `V${p.version}`), notes);
    speak(fresh ? `Version ${p.version}: ${p.name}! Here's what's new.` : p.since ? 'These will be part of the next version.' : `Version ${p.version}: ${p.name}.`);
  },
  game() {
    const notes = el('div', 'pc-notes');
    notes.append(inTheGame({ icons: false }));
    glass.replaceChildren(head('IN THE GAME'), notes);
    speak('Everything in the game so far.');
  },
  buddy() {
    const save = getSave(), now = buddy(save), all = buddyChoices(save);
    const card = el('div', 'pc-pick');
    const img = el('img', 'pixel pc-pick-mon');
    Object.assign(img, { src: now.src, alt: '' });
    card.append(img, el('b', 'pc-pick-name', now.name.toUpperCase()), el('small', 'pc-pick-note', 'walks with you'));
    const explain = el('p', 'pc-explain', 'Your walking buddy follows you in the Clearing, your Secret Base and the Poké Mall. It is not your Pokédex partner, the one on your Pokédex cover and Trainer Card: choose that by tapping the partner on your Trainer Card.');
    const anyShiny = all.some(m => m.shiny);
    if (!anyShiny || buddyShiny == null) buddyShiny = anyShiny && !!now.shiny;
    const grid = el('div', 'pc-box');
    grid.append(...all.filter(m => !!m.shiny === buddyShiny).map(m => monTile(m.src, m.name, m.key === now.key || (!now.key && m.src === now.src), () => {
      if (m.src === buddy().src) return;
      updateSave(d => { d.buddy = m.key; });
      playCry(m.cry);
      show('buddy');
      speak(`${m.name} will walk with you.`);
    })));
    const h = head('WALKING BUDDY');
    if (anyShiny) {
      const t = el('button', `pc-shiny${buddyShiny ? ' on' : ''}`, '✨ Shiny');
      t.type = 'button';
      t.setAttribute('aria-pressed', buddyShiny ? 'true' : 'false');
      t.addEventListener('click', () => { buddyShiny = !buddyShiny; playSound('select'); show('buddy'); });
      h.append(t);
    }
    glass.replaceChildren(h, card, explain, grid);
    speak('Only first forms fit on the paths. Bigger Pokémon rest in the box.');
  },
  residents() {
    const save = getSave(), { all, shown } = residents(save);
    const grid = el('div', 'pc-box');
    const order = [...shown, ...all.filter(id => !shown.includes(id))];
    grid.append(...order.map(id => monTile(resident(id).image, resident(id).name, shown.includes(id), () => {
      const now = residents().shown, def = resident(id);
      if (now.includes(id)) { setResidents(now.filter(x => x !== id)); playSound('cancel'); show('residents'); speak(`${def.name} went back into the box.`); return; }
      if (now.length >= residentCap()) { playSound('cancel'); speak(`${residentCap()} can live in the base at once. Send one back first.`); return; }
      setResidents([...now, id]);
      playCry(def.cry);
      show('residents');
      speak(`${def.name} moved into your Secret Base.`);
    }, shown.includes(id) ? '✓' : '')));
    const count = el('span', 'pc-count', `${shown.length}/${residentCap()}`);
    const h = head('BASE RESIDENTS');
    h.append(count);
    glass.replaceChildren(h, all.length ? grid : el('p', 'pc-empty', 'No catches yet.'));
    speak(all.length ? 'Tap a Pokémon to move it in or send it back.' : 'Catch Pokémon in the Safari Zone and they can live in your Secret Base.');
  },
  mine() {
    menu(`${trainerName().toUpperCase()}'S PC`, [
      ['DECORATIONS', 'Your Secret Base furniture: what stands in your rooms and what\'s kept in storage.', () => { deco = null; dupes = false; show('decor'); }, pcNew('decor', getSave()) || freshDesigns(loadBase()).length > 0],
      ['DUPLICATE', `Make one more of any piece you own, into storage: ${dupePrice(loadBase())} PokéCoins. Each copy costs 5 more, up to 100.`, () => { deco = null; dupes = true; show('decor'); }, pcNew('dupe', getSave())],
      ['RENAME', `Your name on the Trainer Card and the leaderboards: ${trainerName()}.`, () => show('rename')],
    ]);
  },
  decor() {
    const save = getSave();
    if (!inBase && !save.baseOwned && !save.secretBase) {
      glass.replaceChildren(head('DECORATIONS'), el('p', 'pc-empty', 'No Secret Base yet.'));
      return speak('The Ancient Tree\'s door leads to a Secret Base. Make it yours, and its furniture is kept here.');
    }
    const b = loadBase(), all = decorations(b).filter(d => !(dupes && PIECES[d.id].luxury));   // a statue's copies are the Grand Catalogue's
    const unlit = statuesIn(all.map(d => d.id)).filter(id => !statueReady(id)), unfig = figuresToLoad(all.map(d => PIECES[d.id].fam));
    if (unlit.length || unfig.length) Promise.all([loadStatues(unlit), loadFigures(unfig)]).then(() => { if (page === 'decor') show('decor'); });
    const kinds = Object.keys(KINDS_OF).filter(k => k === 'All' || all.some(d => KINDS_OF[k](PIECES[d.id])));
    if (!kinds.includes(decoKind)) decoKind = 'All';
    const list = all.filter(d => KINDS_OF[decoKind](PIECES[d.id]));
    const picked = all.find(d => d.id === deco), price = dupePrice(b), fresh = new Set(freshDesigns(b));
    const h = head(dupes ? 'DUPLICATE' : 'DECORATIONS');
    h.append(el('span', 'pc-count', dupes ? `${(save.coins ?? 0).toLocaleString()} coins` : `${all.length} kinds`));

    const kids = [h];
    if (picked) {
      const card = el('div', 'pc-pick pc-deco-pick');
      const pic = el('span', 'pc-deco-big');
      pic.append(icon(picked.id));
      const stored = picked.have - picked.room;
      card.append(pic, el('b', 'pc-pick-name', PIECES[picked.id].name.toUpperCase()),
        el('small', 'pc-pick-note', `${picked.room} in your rooms · ${stored} in storage`));
      if (dupes) {
        const copy = el('button', 'room-ok pc-dupe', `Copy · ${price}`);
        copy.type = 'button';
        copy.addEventListener('click', () => {
          const name = PIECES[picked.id].name;
          if (!duplicate(loadBase(), picked.id)) { playSound('cancel'); speak(`You need ${price - (getSave().coins ?? 0)} more PokéCoins to copy the ${name}.`); return; }
          playSound('buy');
          show('decor');
          speak(`A new ${name} went into storage! The next copy costs ${dupePrice(loadBase())} PokéCoins.`);
        });
        card.append(copy);
      } else if (picked.room) {
        const away = el('button', 'pc-row pc-away', 'PUT AWAY');
        away.type = 'button';
        away.addEventListener('click', () => {
          const n = putAway(loadBase(), picked.id);
          playSound('cancel');
          show('decor');
          speak(`${n > 1 ? `All ${n} of the` : 'The'} ${PIECES[picked.id].name} went back into storage.`);
        });
        card.append(away);
      }
      kids.push(card);
    }
    const chips = el('div', 'pc-chips');
    chips.append(...kinds.map(k => {
      const c = el('button', `pc-chip${k === decoKind ? ' on' : ''}${k !== 'All' && all.some(d => fresh.has(d.id) && KINDS_OF[k](PIECES[d.id])) ? ' fresh' : ''}`, k);
      c.type = 'button';
      c.addEventListener('click', () => { if (k === decoKind) return; decoKind = k; playSound('select'); show('decor'); });
      return c;
    }));
    const grid = el('div', 'pc-box pc-decos');
    grid.append(...list.map(d => {
      const t = el('button', `pc-mon pc-deco${d.room ? ' on' : ''}${d.id === deco ? ' picked' : ''}`);
      t.type = 'button';
      t.title = PIECES[d.id].name;
      t.setAttribute('aria-label', `${PIECES[d.id].name}, ${d.room} in your room, ${d.have - d.room} in storage`);
      t.append(icon(d.id));
      if (d.have > 1) t.append(el('span', 'pc-mon-tag', `×${d.have}`));
      if (fresh.has(d.id)) t.append(freshMark());
      t.addEventListener('click', () => {
        playSound('select');
        seeDesign(b, d.id);
        deco = d.id === deco ? null : d.id;
        show('decor');
        if (deco) speak(dupes ? `${PIECES[d.id].name}. Copy it for ${price} PokéCoins?` : `${PIECES[d.id].name}. ${d.room ? 'Put it away to keep it in storage.' : 'It\'s in storage. Place it from the Secret Base\'s Decorate.'}`);
      });
      return t;
    }));
    kids.push(chips, all.length ? grid : el('p', 'pc-empty', 'No furniture yet.'));
    glass.replaceChildren(...kids);
    if (!picked) speak(!all.length ? 'Buy furniture at the Poké Mall and it\'s kept here.'
      : dupes ? `Tap a piece to copy it into storage for ${price} PokéCoins.` : 'Gold ones stand in your rooms. Tap one to see it, or to put it away.');
  },
  house() {
    const save = getSave(), b = loadBase(), house = b.house, big = !!house?.big;
    if (!inBase && !save.baseOwned && !save.secretBase) {
      glass.replaceChildren(head('HOUSE UPGRADES'), el('p', 'pc-empty', 'No Secret Base yet.'));
      return speak('The Ancient Tree\'s door leads to a Secret Base. Make it yours, and its blueprint is kept here.');
    }
    markPcSeen('yard');
    const h = head('HOUSE UPGRADES');
    h.append(el('span', 'pc-count', `${(save.coins ?? 0).toLocaleString()} coins`));
    const fits = spot?.room && plan ? fitsOf(house, spot.room, spot.pip, plan, spot.up) : [];
    const fit = fits[turn % (fits.length || 1)] || null;
    const kids = [h];
    const buy = (label, go, cls = '') => { const ok = el('button', `room-ok pc-build${cls}`, label); ok.type = 'button'; ok.addEventListener('click', go); return ok; };
    const short = (price) => speak(`You need ${price - (getSave().coins ?? 0)} more PokéCoins.`);
    // the backyard's plot behind the house, bought on its own whatever size the main room is, then made bigger
    const yardCard = () => {
      const card = el('div', 'pc-plan'), { w, h } = shapeOf('yard');
      if (canGrowYard(house)) {
        const big = shapeOf('bigyard');
        card.append(el('b', 'pc-plan-name', 'BIGGER BACKYARD'), el('small', 'pc-plan-note', `${w} × ${h} → ${big.w} × ${big.h} tiles of lawn, more at the sides and behind.`),
          buy(`Build · ${BIG_YARD_PRICE.toLocaleString()}`, () => {
            if (!buyBigYard(loadBase())) { playSound('cancel'); return short(BIG_YARD_PRICE); }
            unpick();
            playSound('item-get');
            show('house');
            speak('Your backyard is bigger! Everything out there kept its place by the gate, with new lawn round it.');
          }));
        return card;
      }
      if (ownsYard(house)) {
        const big = shapeOf('bigyard');
        card.append(el('b', 'pc-plan-name', 'BACKYARD'), el('small', 'pc-plan-note', `${big.w} × ${big.h} tiles of lawn, as big as it grows.`));
        return card;
      }
      if (!inBase && !save.baseOwned) {
        card.append(el('b', 'pc-plan-name', 'BACKYARD'), el('small', 'pc-plan-note', 'Make the Ancient Tree your Secret Base first, then its backyard can be built.'));
        return card;
      }
      card.append(el('b', 'pc-plan-name', 'BACKYARD'), el('small', 'pc-plan-note', `${w} × ${h} tiles of lawn behind the Ancient Tree, through the garden arch beside it.`),
        buy(`Build · ${YARD_PRICE.toLocaleString()}`, () => {
          if (!buyYard(loadBase())) { playSound('cancel'); return short(YARD_PRICE); }
          unpick();
          playSound('item-get');
          show('house');
          speak('Your backyard is ready! The garden arch beside the Ancient Tree is open now: walk through it to see.');
        }));
      return card;
    };
    // a tab per floor, one more over the top to build up into once the main room is bigger, and the backyard's own
    const tabs = el('div', 'pc-chips pc-floors');
    const tab = (label, on, go) => {
      const t = el('button', `pc-chip${on ? ' on' : ''}`, label);
      t.type = 'button';
      t.addEventListener('click', () => { playSound('select'); unpick(); resetView(); go(); show('house'); });
      tabs.append(t);
    };
    for (let lv = 0; lv <= (big ? topFloor(house) + 1 : 0); lv++) tab(floorName(lv), !yardTab && lv === floor, () => { floor = lv; yardTab = false; });
    tab('Backyard', yardTab, () => { yardTab = true; });
    // the Build key stays in sight at the foot of the page, over the scroll (the user's ask: it hid under the text window)
    const act = (...n) => { const a = el('div', 'pc-act'); a.append(...n); return a; };
    if (yardTab) {
      glass.replaceChildren(h, tabs, yardPlan(house), act(yardCard()));
      return speak(yardSay(house));
    }
    if (!big) {
      const card = el('div', 'pc-plan');
      card.append(el('b', 'pc-plan-name', 'BIGGER MAIN ROOM'), el('small', 'pc-plan-note', '11 × 8 → 14 × 10 tiles. Then build rooms onto any wall you like, or upstairs.'),
        buy(`Build · ${BIG_PRICE}`, () => {
          if (!buyBigRoom(loadBase())) { playSound('cancel'); return short(BIG_PRICE); }
          playSound('item-get');
          show('house');
          speak('Your main room is bigger! Tap a green spot on a wall to build a room there, or go to 2F to build upstairs.');
        }));
      glass.replaceChildren(h, tabs, blueprint(house, null), act(card));
      return speak(`First, make your main room bigger for ${BIG_PRICE} PokéCoins. Then you can build more rooms onto it. The Backyard tab has your lawn.`);
    }
    kids.push(tabs, blueprint(house, fit));
    if (spot?.join) {
      kids.push(act(buy(`Doorway · ${DOOR_PRICE}`, () => {
        const { room, pip, to, toPip } = spot.join, done = buyDoor(loadBase(), room, pip, to, toPip);
        if (!done) { playSound('cancel'); return short(DOOR_PRICE); }
        unpick();
        playSound('item-get');
        show('house');
        speak(`A new doorway!${done.moved.length ? ` The ${[...new Set(done.moved)].join(', ')} went into storage to clear it.` : ''}`);
      })));
    } else if (spot) {
      const taken = takenOn(house, floor);
      const list = el('div', 'pc-menu pc-kinds');
      list.append(...BUILDABLE.map(kind => {
        const k = ROOM_KINDS[kind], ok = !!fitRoom(house, spot.room, spot.pip, kind, null, spot.up, taken), sh = shapeOf(kind);
        const r = el('button', `pc-row pc-kind${kind === plan ? ' on' : ''}`);
        r.type = 'button';
        r.disabled = !ok;
        r.append(el('span', 'pc-kind-name', k.name.toUpperCase()), el('small', 'pc-kind-size', ok ? `${sh.w} × ${sh.h}` : 'No space'));
        r.addEventListener('click', () => {
          playSound('select');
          plan = kind; turn = 0;
          show('house');
          speak(`${k.name}: ${k.blurb} ${ROOM_PRICE} PokéCoins.${fitsOf(house, spot.room, spot.pip, kind, spot.up).length > 1 ? ' Tap Turn to face it another way.' : ''}`);
        });
        return r;
      }));
      if (fit) {
        const row = el('div', 'pc-build-row');
        if (fits.length > 1) row.append(buy('Turn', () => { playSound('select'); turn = (turn + 1) % fits.length; show('house'); }, ' pc-turn'));
        row.append(buy(`Build · ${ROOM_PRICE}`, () => {
          const name = ROOM_KINDS[plan].name, stairs = spot.up, done = buyRoom(loadBase(), spot.room, spot.pip, plan, fit.rot, spot.up);
          if (!done) { playSound('cancel'); return (getSave().coins ?? 0) < ROOM_PRICE ? short(ROOM_PRICE) : speak('That room doesn\'t fit there.'); }
          unpick();
          playSound('item-get');
          show('house');
          speak(`Your new ${name} is built! ${stairs ? 'Climb the new stairs to it' : 'Walk through to it'} in your Secret Base.${done.moved.length ? ` The ${[...new Set(done.moved)].join(', ')} went into storage to clear the way.` : ''}`);
        }));
        kids.push(act(row));
      }
      kids.push(list);
    } else if (picked) {
      const r = houseRooms(house).find(x => x.id === picked), name = ROOM_KINDS[r.kind].name;
      kids.push(act(buy(sure ? 'Sure? Take it down' : 'Take down', () => {
        if (!sure) { playSound('select'); sure = true; show('house'); return speak(`Take down the ${name}? Its furniture goes back into storage. No coins come back.`); }
        if (!takeDown(loadBase(), picked)) { playSound('cancel'); sure = false; show('house'); return speak(`Other rooms are only reached through the ${name}. Take those down first.`); }
        unpick();
        playSound('confirm');
        show('house');
        speak(`The ${name} is gone, and its furniture is back in storage.`);
      }, ' pc-down')));
    }
    glass.replaceChildren(...kids);
    if (spot?.join) speak(`Open a doorway between these two rooms for ${DOOR_PRICE} PokéCoins?`);
    else if (spot && !plan) speak(spot.up ? 'Pick a room to build upstairs. Stairs will climb to it from that back wall.' : 'Pick a room to build there. Rooms that won\'t fit are greyed out.');
    else if (!spot && !picked) speak(floor ? `Tap a green spot on a back wall of the floor below to build a room up a staircase from it, ${ROOM_PRICE} PokéCoins.`
      : `Tap a green spot on any wall to build a room there, ${ROOM_PRICE} PokéCoins. Gold spots join two rooms side by side. Tap a room to take it down.`);
  },
  rename() {
    const form = el('form', 'pc-name');
    const box = el('input', 'pc-name-box');
    Object.assign(box, { type: 'text', maxLength: NAME_MAX, value: (getSave().trainerName || '').toUpperCase(), placeholder: 'TRAINER', autocomplete: 'off', spellcheck: false });
    box.setAttribute('aria-label', 'Your name');
    const ok = el('button', 'room-ok pc-name-ok', 'Save');
    ok.type = 'submit';
    form.append(box, ok);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = setTrainerName(box.value);
      playSound('confirm');
      show('mine');
      speak(name ? `Your name is ${name} now.` : 'Your name is TRAINER again.');
    });
    glass.replaceChildren(head('RENAME'), form);
    speak(`Up to ${NAME_MAX} letters. Leaderboard entries already posted keep their old name.`);
    setTimeout(() => box.focus(), 0);
  },
};

const svg = (tag, attrs = {}) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
const OUT = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

/** The house from above, after WoW's housing blueprint (the user's reference): the floor looked at (`floor`), each room a
    grey block named in it (a tap picks it, to take down), a pip at each doorway: grey where one already leads on (a
    square for a staircase), green where a room can be built (a tap picks it), gold where two rooms side by side could
    be joined; the front door's Entry under the main room. Upstairs, the floor below shows faint, the green pips on its
    back walls building up a staircase. `fit` is the room being tried, drawn dashed in green. */
function blueprint(house, fit) {
  const all = houseRooms(house), rooms = all.filter(r => r.lv === floor), below = floor ? all.filter(r => r.lv === floor - 1) : [];
  const main = all[0], entry = entryOf(house);
  const place = (r) => r.shape.rects.map(([x, y, w, h]) => [x + r.gx, y + r.gy, w, h]);
  const ghost = fit ? shapeOf(fit.kind, fit.rot).rects.map(([x, y, w, h]) => [x + fit.gx, y + fit.gy, w, h]) : [];
  const door = floor ? [] : [[entry.at - 1, main.shape.h, 3, 1.5]];
  const { s, room, full } = sheet([...rooms.flatMap(place), ...below.flatMap(place), ...ghost, ...door], `House blueprint, ${floorName(floor)}`);
  for (const r of below) room(place(r), 'pc-bp-room below');
  if (door.length) room(door, 'pc-bp-room entry', 'Entry');
  for (const r of rooms) {
    const name = ROOM_KINDS[r.kind].name;
    room(place(r), `pc-bp-room${picked === r.id ? ' picked' : ''}`, name, () => {
      playSound('select');
      const was = picked === r.id;
      unpick();
      if (r.id !== 'main' && !was) picked = r.id;
      show('house');
      if (r.id === 'main') speak('Your main room, the way in from the Clearing.');
      else if (picked) speak(`Your ${name}. Take it down? Its furniture goes back into storage.`);
    });
  }
  if (ghost.length) room(ghost, 'pc-bp-room ghost', ROOM_KINDS[fit.kind].name);
  const pip = (cx, cy, cls, tap) => {
    const g = svg('g', { class: `pc-bp-pip ${cls}` });
    const dot = /stairs/.test(cls) ? svg('rect', { x: cx - 0.4, y: cy - 0.4, width: 0.8, height: 0.8, rx: 0.12 })
      : svg('circle', { cx, cy, r: /open|join/.test(cls) ? 0.32 : 0.42 });
    g.append(svg('circle', { cx, cy, r: 0.55, class: 'pc-bp-hit' }), dot);
    if (tap) g.addEventListener('click', tap);
    s.append(g);
  };
  const at = (r, p) => { const t = pipTile(r.shape, p), [dx, dy] = OUT[p[0]]; return [r.gx + t.x + 0.5 + dx * 0.5, r.gy + t.y + 0.5 + dy * 0.5]; };
  const pick = (next, line) => () => {
    const on = JSON.stringify(spot) === JSON.stringify(next);
    playSound('confirm');
    unpick();
    spot = on ? null : next;
    show('house');
    if (spot && line) speak(line);
  };
  if (!floor) pip(main.gx + entry.at + 0.5, main.gy + main.shape.h, 'shut');
  if (!house?.big) return wrap(s, full);
  const taken = takenOn(house, floor);
  // this floor's doorways and staircases, and the green spots a room fits onto
  for (const r of rooms) r.shape.pips.forEach((p, i) => {
    const l = linkOf(house, r.id, i), [cx, cy] = at(r, p);
    if (l) return pip(cx, cy, l[4] ? 'shut stairs' : 'shut');
    if (pipUsed(house, r.id, i)) return;
    if (!BUILDABLE.some(k => fitRoom(house, r.id, i, k, null, false, taken))) return;
    const on = spot?.room === r.id && spot.pip === i && !spot.up;
    pip(cx, cy, `open${on ? ' on' : ''}`, pick({ room: r.id, pip: i, up: false }));
  });
  // upstairs: the back walls of the floor below, where a staircase could climb to a new room
  for (const r of below) r.shape.pips.forEach((p, i) => {
    if (p[0] !== 'n' || pipUsed(house, r.id, i)) return;
    if (!BUILDABLE.some(k => fitRoom(house, r.id, i, k, null, true, taken))) return;
    const [cx, cy] = at(r, p), on = spot?.room === r.id && spot.pip === i && spot.up;
    pip(cx, cy, `open up${on ? ' on' : ''}`, pick({ room: r.id, pip: i, up: true }));
  });
  for (const j of joinPips(house, floor)) {
    const [dx, dy] = OUT[j.side], on = spot?.join?.room === j.room && spot.join.pip === j.pip;
    pip(j.x + 0.5 + dx * 0.5, j.y + 0.5 + dy * 0.5, `join${on ? ' on' : ''}`, pick({ join: j }));
  }
  return wrap(s, full);
}

/** A blueprint's sheet: the dark grid round every block given, two tiles over, and `room()` to draw a block on it, named
    and tapped. */
function sheet(every, label) {
  const x0 = Math.min(...every.map(r => r[0])) - 2, y0 = Math.min(...every.map(r => r[1])) - 2;
  const x1 = Math.max(...every.map(r => r[0] + r[2])) + 2, y1 = Math.max(...every.map(r => r[1] + r[3])) + 2;
  const s = svg('svg', { viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`, class: 'pc-bp', role: 'img', 'aria-label': label });
  const pat = svg('pattern', { id: 'pc-bp-grid', width: 1, height: 1, patternUnits: 'userSpaceOnUse' });
  pat.append(svg('path', { d: 'M1 0H0V1', fill: 'none', stroke: '#24507a', 'stroke-width': 0.05 }));
  const defs = svg('defs');
  defs.append(pat);
  s.append(defs, svg('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: 'url(#pc-bp-grid)' }));
  // each block's outline, then its fill again over it, so a shaped room's inner seams don't show
  const room = (rects, cls, label, tap) => {
    const g = svg('g', { class: cls });
    for (const [x, y, w, h] of rects) g.append(svg('rect', { x, y, width: w, height: h, class: 'pc-bp-edge' }));
    for (const [x, y, w, h] of rects) g.append(svg('rect', { x, y, width: w, height: h, class: 'pc-bp-fill' }));
    if (label) {
      const [x, y, w, h] = [...rects].sort((a, b) => b[2] * b[3] - a[2] * a[3])[0];
      const size = Math.min(1.1, w * 1.05 / label.length, h * 0.35);
      const t = svg('text', { x: x + w / 2, y: y + h / 2, 'font-size': size, class: 'pc-bp-name' });
      t.textContent = label;
      g.append(t);
    }
    if (tap) g.addEventListener('click', tap);
    s.append(g);
  };
  return { s, room, full: [x0, y0, x1 - x0, y1 - y0] };
}

/** The BACKYARD tab: the lawn on its own (the user's ask: drawn behind the house, rooms built off the back wall ran into
    it), its garden arch under the front edge, and the bigger lot it would grow into dashed round it, wider at the sides
    and deeper behind. */
function yardPlan(house) {
  const yard = shapeOf(yardKind(house)), owned = ownsYard(house), big = shapeOf('bigyard');
  const lot = [[0, 0, yard.w, yard.h]], arch = [[Math.floor(yard.w / 2) - 1, yard.h, 3, 1.5]];
  // the new lawn alone (the band behind, named, and a strip each side), so its name isn't under the yard's
  const gx = Math.floor(yard.w / 2) - Math.floor(big.w / 2), back = big.h - yard.h;
  const grow = canGrowYard(house) ? [[gx, -back, big.w, back], [gx, 0, -gx, yard.h], [yard.w, 0, big.w - yard.w + gx, yard.h]] : [];
  const { s, room, full } = sheet([...lot, ...arch, ...grow], 'Backyard blueprint');
  if (grow.length) room(grow, 'pc-bp-room yard plot', 'Bigger backyard');
  room(lot, `pc-bp-room yard${owned ? '' : ' plot'}`, 'Backyard');
  room(arch, 'pc-bp-room entry', 'Arch');
  return wrap(s, full);
}

/** The blueprint in its frame, zoomed by a pinch, the wheel or the + / − keys and panned by a drag (the user's ask: a big
    house got too small to tap). The view is the viewBox, so the drawing stays sharp; a drag that moved swallows the
    click it ends in, so panning never picks a room or a pip. Zoomed out all the way, a drag scrolls the page instead. */
function wrap(s, full) {
  const box = el('div', 'pc-blueprint');
  const [fx, fy, fw, fh] = full, zMax = Math.max(1, Math.min(5, fw / 6, fh / 4));
  const apply = () => {
    view.z = Math.min(zMax, Math.max(1, view.z));
    const w = fw / view.z, h = fh / view.z;
    view.cx = Math.min(fx + fw - w / 2, Math.max(fx + w / 2, view.cx ?? fx + fw / 2));
    view.cy = Math.min(fy + fh - h / 2, Math.max(fy + h / 2, view.cy ?? fy + fh / 2));
    s.setAttribute('viewBox', `${view.cx - w / 2} ${view.cy - h / 2} ${w} ${h}`);
    box.classList.toggle('zoomed', view.z > 1);
    out.disabled = view.z <= 1;
    inn.disabled = view.z >= zMax;
  };
  // the tile under a point on screen, and a zoom that keeps it there
  const tileAt = (px, py) => { const m = s.getScreenCTM(); return m ? new DOMPoint(px, py).matrixTransform(m.inverse()) : null; };
  const zoomAt = (to, px, py) => {
    const before = px == null ? null : tileAt(px, py);
    view.z = to;
    apply();
    const after = before && tileAt(px, py);
    if (after) { view.cx += before.x - after.x; view.cy += before.y - after.y; apply(); }
  };
  const key = (label, aria, by) => {
    const b = el('button', 'pc-bp-zoom', label);
    b.type = 'button';
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', () => { playSound('select'); zoomAt(view.z * by); });
    return b;
  };
  const inn = key('+', 'Zoom in', 1.5), out = key('−', 'Zoom out', 1 / 1.5);
  const keys = el('div', 'pc-bp-keys');
  keys.append(inn, out);
  const scroller = () => { for (let n = box.parentElement; n; n = n.parentElement) if (n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return n; return null; };
  const touch = new Map();
  let moved = false, pinch = 0, last = null;
  s.addEventListener('pointerdown', (e) => {
    touch.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touch.size === 1) { moved = false; last = { x: e.clientX, y: e.clientY }; }
    if (touch.size === 2) { const [a, b] = [...touch.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); moved = true; }
  });
  s.addEventListener('pointermove', (e) => {
    if (!touch.has(e.pointerId)) return;
    touch.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touch.size >= 2) {
      const [a, b] = [...touch.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoomAt(view.z * d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch = d;
      return;
    }
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    if (!moved) { moved = true; s.setPointerCapture?.(e.pointerId); }
    last = { x: e.clientX, y: e.clientY };
    if (view.z <= 1) { const sc = scroller(); if (sc) sc.scrollTop -= dy; return; }
    const m = s.getScreenCTM();
    if (!m) return;
    view.cx -= dx / m.a;
    view.cy -= dy / m.d;
    apply();
  });
  const lift = (e) => {
    touch.delete(e.pointerId);
    if (touch.size < 2) pinch = 0;
    if (touch.size === 1) last = { ...touch.values().next().value };
  };
  s.addEventListener('pointerup', lift);
  s.addEventListener('pointercancel', lift);
  s.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  s.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(view.z * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
  box.append(s, keys);
  apply();
  return box;
}

/** Prof. Oak's word on your Pokédex, by how much of the main three pages you've beaten (Gen 3's Pokédex rating). */
function rating(n, of, complete) {
  if (complete) return 'Every entry researched! Your Pokédex is complete. You are a true Pokémon researcher!';
  const k = n / of;
  if (!n) return 'Not one Pokémon beaten yet? Head out on a run and fill those pages!';
  if (k < 0.25) return `${n} so far. A fine start! Every biome has Pokémon waiting for you.`;
  if (k < 0.5) return `${n}! You're getting the hang of this. Keep exploring.`;
  if (k < 0.75) return `${n}! Splendid, your Pokédex is filling up nicely.`;
  if (k < 1) return `${n}! Nearly there. Only ${of - n} left to find.`;
  return 'Every Pokémon beaten! Now beat each one a few more times to finish its research.';
}

/** What to aim for next, nearest first: an unfinished page, the Safari Zone's door, the research, a Safari area, a bonus
    page, then the starters still to earn (Mewtwo stays a secret). Each is a line and, for a starter, its silhouette. */
function hints(save) {
  const beaten = new Set(save.dex.defeated), out = [];
  const left = (p) => p.ids.filter(id => !beaten.has(id)).length;
  const open = DEX_PAGES.filter(p => !save.dex.done.includes(p.biome)).sort((a, b) => left(a) - left(b));
  for (const p of open.slice(0, 2)) {
    out.push({ text: `Beat the ${left(p)} Pokémon still missing from the ${p.name} page: ${p.perk.coins} PokéCoins and its perk, ${p.perk.name}.` });
  }
  if (!safariOpen(save)) {
    const all = DEX_PAGES.flatMap(p => p.ids);
    out.push({ text: `Beat every Pokémon in the three biomes once (${all.filter(id => beaten.has(id)).length}/${all.length}) and the Safari Zone opens.` });
  }
  if (!save.dex.complete && !open.length) {
    const [n, of] = researchCount();
    out.push({ text: `Finish the research on every entry (${n}/${of}): ${DEX_COMPLETE_COINS} PokéCoins and the ${SCOPE.name}.` });
  }
  if (safariOpen(save)) {
    const caught = new Set(save.safariDex.caught), miss = (p) => p.ids.filter(id => !caught.has(id)).length;
    const area = SAFARI_DEX_PAGES.filter(p => miss(p)).sort((a, b) => miss(a) - miss(b))[0];
    if (area) out.push({ text: `Catch the ${miss(area)} Pokémon still missing from the Safari's ${area.name}${(save.safariDex.done || []).includes(area.area) ? '.' : `: ${SAFARI_AREA_COINS} PokéCoins.`}` });
  }
  for (const p of BONUS_PAGES.filter(p => bonusKnown(p) && !save.dex.done.includes(p.biome))) {
    out.push({ text: `Beat the ${left(p)} Pokémon still missing from the ${p.name} bonus page: ${p.bonus.coins} PokéCoins and its perk, ${p.perk.name}.` });
  }
  for (const a of ACHIEVEMENTS.filter(a => !STARTERS_BY_ID[a.starter]?.secret && !isStarterUnlocked(STARTERS_BY_ID[a.starter])).slice(0, 3)) {
    const s = STARTERS_BY_ID[a.starter];
    out.push({ text: `A Pokémon is waiting to join you. ${a.text}.`, art: spriteUrl(s, 'front', 0, false), say: 'Who could it be? Only one way to find out.' });
  }
  return out;
}

/** A mission on the Missions page: its goal, a bar of how far along it is, its PokéCoins, and Claim once it's done. */
function questRow(kind, e) {
  const m = MISSIONS_BY_ID[e.id];
  if (!m) return el('span');
  const done = isDone(e);
  const r = el('div', `pc-quest${e.claimed ? ' paid' : done ? ' done' : ''}`);
  const bar = el('span', 'pc-done-bar');
  bar.style.setProperty('--k', Math.min(1, e.got / m.n));
  const coin = el('span', 'pc-quest-coins');
  coin.append(smoothIcon('coin', 'pc-quest-coin'), el('b', '', coinsWithBonus(m.coins).toLocaleString()));
  const prog = el('span', 'pc-quest-prog');
  prog.append(bar, el('span', 'pc-quest-n', `${e.got.toLocaleString()}/${m.n.toLocaleString()}`));
  r.append(el('span', 'pc-quest-text', missionText(m)), coin, prog);
  r.append(payKey(e.claimed, done, () => claimMission(kind, e.id), coin));
  return r;
}

/** The bonus for finishing all of the day's or the week's missions. */
function bonusRow(kind, roll) {
  const left = roll.list.filter(e => !e.claimed).length;
  const r = el('div', `pc-quest bonus${roll.bonus ? ' paid' : bonusReady(roll) ? ' done' : ''}`);
  const coin = el('span', 'pc-quest-coins');
  coin.append(smoothIcon('coin', 'pc-quest-coin'), el('b', '', coinsWithBonus(BONUS[kind]).toLocaleString()));
  r.append(el('span', 'pc-quest-text', `★ Bonus: claim all ${roll.list.length}`), coin,
    el('span', 'pc-quest-prog', roll.bonus ? 'Every mission done!' : left ? `${left} left to claim` : 'Ready!'));
  r.append(payKey(roll.bonus, bonusReady(roll), () => claimBonus(kind), coin));
  return r;
}

/** Claim (a gold pill) on a finished mission, CLAIMED once paid, nothing before it's done. */
function payKey(claimed, done, pay, coin) {
  if (claimed) return el('span', 'pc-quest-tag', 'CLAIMED');
  if (!done) return el('span', 'pc-quest-tag none');
  const ok = el('button', 'room-ok pc-quest-claim', 'Claim');
  ok.type = 'button';
  ok.addEventListener('click', () => {
    if (ok.classList.contains('pressed')) return;
    ok.classList.add('pressed');
    const paid = pay();
    if (!paid) return show('missions');
    playSound('item-get');
    countUp(coin.querySelector('b'), paid);
    coin.classList.add('paid');
    speak(`${trainerName().toUpperCase()} received ${paid.toLocaleString()} PokéCoins!`);
    setTimeout(() => { if (root && page === 'missions') { const at = glass.scrollTop; show('missions'); glass.scrollTop = at; } }, calmFx() ? 300 : 900);
  });
  return ok;
}

/** The cloud save's window over the PC; the menu's row reads Sign in or Cloud save again once it closes. */
function signIn() {
  openCloud();
  document.getElementById('cloud-dialog').addEventListener('close', () => { if (root && page === 'home') show('home'); }, { once: true });
}

/** The prize's number ticking up from 0 to what was paid (Coin Finder's bonus included). */
function countUp(node, to) {
  if (calmFx()) { node.textContent = to.toLocaleString(); return; }
  const at = performance.now(), ms = 700;
  const tick = (now) => {
    const k = Math.min(1, (now - at) / ms);
    node.textContent = Math.round(to * (1 - (1 - k) ** 3)).toLocaleString();
    if (k < 1 && node.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function setResidents(ids) {
  updateSave(d => { d.secretBase = { ...(d.secretBase || {}), mons: ids }; });
}

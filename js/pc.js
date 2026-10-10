/* ============================================================
   pc.js  -  the Clearing's PC (2026-10-09, the user's ask), full screen over the hub: a white hood round a striped cyan
   screen on a red stand, like the PC beside the plaza (pcModel() in js/hub-pc.js). Gen 3's PC menu: Bill's PC holds your
   Pokémon (the walking buddy, `save.buddy`, never the Pokédex's partner; and the Secret Base's residents,
   `secretBase.mons`), your own PC your name, Prof. Oak's PC rates your Pokédex and hints at the next unlock, the cloud save's Sign in (the title corner's PC, which the hub hides), then
   the Hall of Fame and Log off. The Mailbox on top holds rewards posted to the PC (js/mail.js): a letter opens out of its
   envelope and its PokéCoins are claimed there. Everything else about you and the game stays in the Pokédex; the PC is your Pokémon and
   your things.
   ============================================================ */

import { getSave, updateSave } from './storage.js';
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
import { SENDERS, unclaimed, claim } from './mail.js';
import { smoothIcon } from './smooth-icons.js';
import { DEX_PAGES, DEPTHS_PAGE, BONUS_PAGES, DEX_COMPLETE_COINS, SCOPE, safariOpen } from './data/pokedex.js';
import { researchCount, bonusKnown, depthsKnown } from './pokedex.js';
import { SAFARI_AREA_COINS } from './data/safari.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { isStarterUnlocked } from './progress.js';
import { PIECES, KINDS_OF, icon, loadBase, decorations, putAway } from './secret-base.js';

/** Safari catches living in the Secret Base at once. */
export const RESIDENTS = 6;

/** Every catch that can live in the base, and the ones that do: the save's pick, or before one is made the first
    RESIDENTS caught (js/base-3d.js's onShow() reads the same). */
export function residents(save = getSave(), lend = false) {
  const caught = new Set(save.safariDex?.caught || []);
  const all = [...new Set(SAFARI_DEX_PAGES.flatMap(p => p.ids))].filter(id => (lend || caught.has(id)) && ENEMY_DEFS[id]);
  return { all, shown: (save.secretBase?.mons ?? all.slice(0, RESIDENTS)).filter(id => all.includes(id)) };
}

let root = null, glass = null, say = null, onClose = null, onFame = null, page = 'home', typing = 0, letter = null, hint = 0;
let start = 'home', deco = null, decoKind = 'All', inBase = false, buddyShiny = null;

/** Log on. `onClose` runs once it's logged off (the hub swaps in a new walking buddy); `onFame(app)` opens the device's
    Hall of Fame or Record Book over the Clearing. `start: 'decor'` boots onto the Decorations, as the Secret Base's
    Storage PC does (`inBase` lifts it over the base). */
export function openPC(opts = {}) {
  if (root) return;
  ({ onClose = null, onFame = null, start = 'home' } = opts);
  deco = null;
  inBase = !!opts.inBase;
  root = el('div', `pc-screen${inBase ? ' in-base' : ''}`);
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'PC');
  root.innerHTML = `
    <div class="pc-unit">
      <div class="pc-hood"><span class="pc-cam" aria-hidden="true"><i></i><i></i><i></i></span>
        <div class="pc-glass"><div class="pc-page"></div><p class="pc-say" aria-live="polite"></p></div></div>
      <div class="pc-ledge"></div>
      <div class="pc-stand"><span class="pc-ball" aria-hidden="true"></span><button type="button" class="pc-off">Log off</button></div>
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

const UP = { home: null, prof: 'home', mailbox: 'home', letter: 'mailbox', bill: 'home', buddy: 'bill', residents: 'bill', mine: 'home', rename: 'mine', decor: 'mine' };

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

function show(id) {
  page = id;
  PAGES[id]();
  glass.querySelector('button')?.focus({ preventScroll: true });
}

/** A menu: big rows with a cursor, a line said for each as it's pointed at. */
function menu(title, rows) {
  const list = el('div', 'pc-menu');
  list.append(...rows.map(([label, line, go]) => {
    const b = el('button', 'pc-row', label);
    b.type = 'button';
    const tell = () => speak(line);
    b.addEventListener('pointerenter', tell);
    b.addEventListener('focus', tell);
    b.addEventListener('click', () => { playSound('confirm'); go(); });
    return b;
  }));
  glass.replaceChildren(head(title), list);
  speak(rows[0][1]);
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
    const waiting = unclaimed().length;
    const rows = [
      [waiting ? `MAILBOX (${waiting})` : 'MAILBOX', waiting ? `You've got mail! ${waiting} letter${waiting === 1 ? '' : 's'} waiting, with PokéCoins inside.` : 'No new mail. Rewards for your Pokédex and big wins arrive here.', () => show('mailbox')],
      ['BILL\'S PC', 'Your Pokémon: who walks with you, and who lives in your Secret Base.', () => show('bill')],
      [`${trainerName().toUpperCase()}'S PC`, 'Your own things. Change your name here.', () => show('mine')],
      ['PROF. OAK\'S PC', 'Have your Pokédex rated, see how complete it is, and get a hint at what to unlock next.', () => { hint = 0; show('prof'); }],
    ];
    if (cloudConfigured()) {
      const on = cloudRemembered();
      rows.push([on ? 'CLOUD SAVE' : 'SIGN IN', on ? 'Your progress is kept in the cloud. Check it or sign out here.' : 'Keep your progress safe in the cloud and carry on from your phone or PC.', signIn]);
    }
    const fame =bookEntries('fame').length ? 'fame' : bookEntries('record').length ? 'record' : null;
    if (fame && onFame) rows.push([fame === 'fame' ? 'HALL OF FAME' : 'RECORD BOOK', fame === 'fame' ? 'The champions of Trainer Level 5.' : 'Every run you have won.', () => { const go = onFame; logOff(); go?.(fame); }]);
    rows.push(['LOG OFF', 'Turn the PC off.', logOff]);
    menu('PC', rows);
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
      const from = SENDERS[m.from] || SENDERS.lab;
      const b = el('button', `pc-env${m.claimed ? ' read' : ''}`);
      b.type = 'button';
      b.style.setProperty('--ink', from.ink);
      b.style.setProperty('--paper', from.paper);
      b.append(el('span', 'pc-env-stamp'), el('span', 'pc-env-from', from.name), el('b', 'pc-env-title', m.title));
      b.append(m.claimed ? el('span', 'pc-env-when', new Date(m.at).toLocaleDateString()) : el('span', 'pc-env-seal', 'NEW'));
      b.addEventListener('click', () => { playSound('confirm'); letter = m.id; show('letter'); });
      return b;
    }));
    glass.replaceChildren(h, mail.length ? list : el('p', 'pc-empty', 'No mail yet.'));
    speak(waiting ? 'Tap a letter to open it.' : mail.length ? 'Every letter is opened. Tap one to read it again.' : 'Complete Pokédex pages and win big, and rewards will be sent here.');
  },
  letter() {
    const m = (getSave().mail || []).find(x => x.id === letter);
    if (!m) return show('mailbox');
    const from = SENDERS[m.from] || SENDERS.lab, fresh = !m.claimed;
    const wrap = el('div', `pc-letter${fresh ? ' fresh' : ''}`);
    wrap.style.setProperty('--ink', from.ink);
    wrap.style.setProperty('--paper', from.paper);
    const sheet = el('div', 'pc-sheet');
    const prize = el('div', 'pc-prize');
    prize.append(smoothIcon('coin', 'pc-prize-coin'), el('b', 'pc-prize-n', `${m.coins.toLocaleString()}`));
    sheet.append(el('span', 'pc-sheet-from', `From: ${from.name}`), el('b', 'pc-sheet-title', m.title), el('p', 'pc-sheet-text', m.text), prize);
    if (!fresh) sheet.append(el('span', 'pc-claimed', 'CLAIMED'));
    wrap.append(el('div', 'pc-env-back'), sheet, el('div', 'pc-env-front'), el('div', 'pc-env-flap'));
    const kids = [head(m.title.toUpperCase()), wrap];
    if (fresh) {
      const ok = el('button', 'room-ok pc-claim', 'Claim');
      ok.type = 'button';
      ok.addEventListener('click', () => {
        if (ok.classList.contains('pressed')) return;
        ok.classList.add('pressed');   // pushed in and lit, like every room's confirm (pressConfirm() in js/rewards.js)
        const paid = claim(m.id);
        playSound('item-get');
        countUp(prize.querySelector('.pc-prize-n'), paid);
        sheet.append(el('span', 'pc-claimed', 'CLAIMED'));
        wrap.classList.add('paid');
        speak(`${trainerName().toUpperCase()} received ${paid.toLocaleString()} PokéCoins!`);
      });
      kids.push(ok);
    }
    glass.replaceChildren(...kids);
    speak(fresh ? `A letter from ${from.name}!` : `Opened ${new Date(m.claimed).toLocaleDateString()}.`);
  },
  bill() {
    menu('BILL\'S PC', [
      ['WALKING BUDDY', 'Choose the Pokémon that walks with you in the Clearing, your base and the mall.', () => { buddyShiny = null; show('buddy'); }],
      ['BASE RESIDENTS', `Choose up to ${RESIDENTS} Safari catches to live in your Secret Base.`, () => show('residents')],
    ]);
  },
  buddy() {
    const save = getSave(), now = buddy(save), all = buddyChoices(save);
    const card = el('div', 'pc-pick');
    const img = el('img', 'pixel pc-pick-mon');
    Object.assign(img, { src: now.src, alt: '' });
    card.append(img, el('b', 'pc-pick-name', now.name.toUpperCase()), el('small', 'pc-pick-note', 'walks with you'));
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
    glass.replaceChildren(h, card, grid);
    speak('Only first forms fit on the paths. Bigger Pokémon rest in the box.');
  },
  residents() {
    const save = getSave(), { all, shown } = residents(save);
    const grid = el('div', 'pc-box');
    const order = [...shown, ...all.filter(id => !shown.includes(id))];
    grid.append(...order.map(id => monTile(ENEMY_DEFS[id].image, ENEMY_DEFS[id].name, shown.includes(id), () => {
      const now = residents().shown, def = ENEMY_DEFS[id];
      if (now.includes(id)) { setResidents(now.filter(x => x !== id)); playSound('cancel'); show('residents'); speak(`${def.name} went back into the box.`); return; }
      if (now.length >= RESIDENTS) { playSound('cancel'); speak(`${RESIDENTS} can live in the base at once. Send one back first.`); return; }
      setResidents([...now, id]);
      playCry(def.spriteId ?? id);
      show('residents');
      speak(`${def.name} moved into your Secret Base.`);
    }, shown.includes(id) ? '✓' : '')));
    const count = el('span', 'pc-count', `${shown.length}/${RESIDENTS}`);
    const h = head('BASE RESIDENTS');
    h.append(count);
    glass.replaceChildren(h, all.length ? grid : el('p', 'pc-empty', 'No catches yet.'));
    speak(all.length ? 'Tap a Pokémon to move it in or send it back.' : 'Catch Pokémon in the Safari Zone and they can live in your Secret Base.');
  },
  mine() {
    menu(`${trainerName().toUpperCase()}'S PC`, [
      ['DECORATIONS', 'Your Secret Base furniture: what stands in your room and what\'s kept in storage.', () => { deco = null; show('decor'); }],
      ['RENAME', `Your name on the Trainer Card and the leaderboards: ${trainerName()}.`, () => show('rename')],
    ]);
  },
  decor() {
    const save = getSave();
    if (!inBase && !save.baseOwned && !save.secretBase) {
      glass.replaceChildren(head('DECORATIONS'), el('p', 'pc-empty', 'No Secret Base yet.'));
      return speak('The Ancient Tree\'s door leads to a Secret Base. Make it yours, and its furniture is kept here.');
    }
    const b = loadBase(), all = decorations(b);
    const kinds = Object.keys(KINDS_OF).filter(k => k === 'All' || all.some(d => KINDS_OF[k](PIECES[d.id])));
    if (!kinds.includes(decoKind)) decoKind = 'All';
    const list = all.filter(d => KINDS_OF[decoKind](PIECES[d.id]));
    const picked = all.find(d => d.id === deco);
    const h = head('DECORATIONS');
    h.append(el('span', 'pc-count', `${all.length} kinds`));

    const kids = [h];
    if (picked) {
      const card = el('div', 'pc-pick pc-deco-pick');
      const pic = el('span', 'pc-deco-big');
      pic.append(icon(picked.id));
      const stored = picked.have - picked.room;
      card.append(pic, el('b', 'pc-pick-name', PIECES[picked.id].name.toUpperCase()),
        el('small', 'pc-pick-note', `${picked.room} in your room · ${stored} in storage`));
      if (picked.room) {
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
      const c = el('button', `pc-chip${k === decoKind ? ' on' : ''}`, k);
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
      t.addEventListener('click', () => {
        playSound('select');
        deco = d.id === deco ? null : d.id;
        show('decor');
        if (deco) speak(`${PIECES[d.id].name}. ${d.room ? 'Put it away to keep it in storage.' : 'It\'s in storage. Place it from the Secret Base\'s Decorate.'}`);
      });
      return t;
    }));
    kids.push(chips, all.length ? grid : el('p', 'pc-empty', 'No furniture yet.'));
    glass.replaceChildren(...kids);
    if (!picked) speak(all.length ? 'Gold ones stand in your room. Tap one to see it, or to put it away.' : 'Buy furniture at the Poké Mall and it\'s kept here.');
  },
  rename() {
    const form = el('form', 'pc-name');
    const box = el('input', 'pc-name-box');
    Object.assign(box, { type: 'text', maxLength: NAME_MAX, value: getSave().trainerName || '', placeholder: 'TRAINER', autocomplete: 'off', spellcheck: false });
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
    out.push({ text: `Beat the ${left(p)} Pokémon still missing from the ${p.name} bonus page: ${p.bonus.coins} PokéCoins.` });
  }
  for (const a of ACHIEVEMENTS.filter(a => !STARTERS_BY_ID[a.starter]?.secret && !isStarterUnlocked(STARTERS_BY_ID[a.starter])).slice(0, 3)) {
    const s = STARTERS_BY_ID[a.starter];
    out.push({ text: `A Pokémon is waiting to join you. ${a.text}.`, art: spriteUrl(s, 'front', 0, false), say: 'Who could it be? Only one way to find out.' });
  }
  return out;
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

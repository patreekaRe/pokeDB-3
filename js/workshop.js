/* workshop.js  -  Kurt's Workshop (docs/roadmap.md's Towns step 6, session 3; its recipes: js/data/workshop.js). The save's
   side (making a thing, handing a Gym Leader a gift, carrying an Apricorn skin) and its window: the device's
   (.dev-window), a shelf a tab (Quest, Furniture, Gifts, Apricorns, Held berries, Run kit), a tap picks a recipe and Make makes it. Kurt is
   walked to in his house in the Clearing (js/run.js's homeRoom(), js/data/towns.js's CLEARING). */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, scrollCue } from './ui.js';
import { calmFx } from './prefs.js';
import { satchelOf, addKey, KEY_BY_ID, MATERIALS_BY_ID, matHints } from './data/satchel.js';
import { RECIPES, TABS, FRIENDS, GIFTS, GIFT_BY_ID, gifteeOf, workshopOf, shortOf, isMade, shows, spend, madeInto, giveGift, needsLine, heartsOf, repeats, REPEAT, GIFT_TOLD } from './data/workshop.js';
import { RING, townState, CLEARING } from './data/towns.js';
import { toldHeld, tellHeld } from './held-tips.js';
import { GYM_BY_ID, friendWins } from './data/gym.js';
import { PIECES } from './secret-base.js';
import { BIOMES_BY_ID } from './data/enemies.js';

/** What the Workshop can see of the save, for shows(); `?hearts=N` puts every friend at N, so their secret recipes show. */
const heartsPeek = () => { const n = new URLSearchParams(location.search).get('hearts'); return n === null ? null : +n || 0; };
const seen = (save) => ({ towns: Object.fromEntries(['clearing', ...RING.map(t => t.id)].map(id => [id, townState(save, id)])), wins: (id) => friendWins(save, id),
  hearts: (id) => heartsPeek() ?? heartsOf(workshopOf(save), id), yard: !!save.secretBase?.house?.yard, mats: satchelOf(save).seen });

/** The recipes on a shelf now. */
export const shelf = (tab, save = getSave()) => RECIPES.filter(r => r.kind === tab && shows(r, seen(save)));

/** Make a recipe: its materials out of the Satchel (the `?satchel` loan counts toward having them), the thing in. False
    if it's short or made already. */
export function craft(recipe) {
  const save = getSave();
  if (shortOf(recipe, satchelOf(save)).length || isMade(recipe, workshopOf(save), satchelOf(save))) return false;
  updateSave(d => {
    let sat = spend(recipe, satchelOf(d, false));
    if (recipe.kind === 'key') sat = addKey(sat, recipe.makes);
    d.satchel = sat;
    d.workshop = madeInto(recipe, workshopOf(d));
  });
  return true;
}

/** Hand `leader` a gift held: { favourite, first, was, hearts } (first: their signature piece just earned; their hearts
    before and after), or null. */
export function handGift(giftId, leader) {
  const before = workshopOf(getSave()), out = giveGift(before, giftId, leader);
  if (out.ws === before) return null;
  updateSave(d => { d.workshop = giveGift(workshopOf(d), giftId, leader).ws; });
  return { favourite: out.favourite, first: out.first, was: heartsOf(before, leader), hearts: heartsOf(out.ws, leader) };
}

/** Carry an Apricorn skin made (or none: `id` null) as the Safari Ball's look. */
export const carrySkin = (id) => updateSave(d => { d.workshop = { ...workshopOf(d), skin: id }; });

/** The gifts held, [{ gift, n }]. */
export const giftsHeld = (save = getSave()) => GIFTS.map(g => ({ gift: g, n: workshopOf(save).gifts[g.makes] || 0 })).filter(o => o.n > 0);

const KURT = 'KURT';
const nameOf = (r) => (r.kind === 'key' ? KEY_BY_ID[r.makes].name : r.name);
const an = (name) => `${/^[AEIOUX]/.test(name) ? 'an' : 'a'} ${name}`;
const keptOf = (r, ws) => (repeats(r) ? ws.kit[r.id] || 0 : r.kind === 'gift' ? ws.gifts[r.makes] || 0 : 0);

function art(r) {
  if (r.kind === 'piece' && PIECES[r.makes]) {
    const a = PIECES[r.makes].art(0, 2), c = document.createElement('canvas');
    c.width = a.width; c.height = a.height;
    c.getContext('2d').drawImage(a, 0, 0);
    c.className = 'tshop-pic';
    return c;
  }
  if (r.kind === 'skin' || repeats(r)) {
    const img = el('img', 'tshop-pic pixel');
    img.src = `assets/items/${r.sprite}.png`;
    img.alt = '';
    return img;
  }
  return el('span', 'tshop-pic wshop-glyph', r.kind === 'key' ? KEY_BY_ID[r.makes].icon : r.icon);
}

const EMPTY = {
  key: 'Nothing to make for the towns yet. Once a town\'s Gym Leader asks for something, bring me its materials.',
  piece: 'Visit a town out on the roads and I\'ll learn its furniture. They make lovely things out there.',
  gift: 'Beaten a Gym Leader? Come back and I\'ll tell you what they\'d love.',
  skin: '',
  held: 'Grow berries in a backyard of your own and bring them here. I\'ll make them into something your Pokémon can hold.',
  kit: '',
};
const ABOUT = {
  key: 'For the towns\' Waystones. Bring me materials from the roads and I\'ll make what they need.',
  piece: 'Furniture you can\'t buy anywhere. Made here, sent to your Secret Base.',
  gift: 'Every Gym Leader has a favourite. Give it to them at home and they\'ll give you something of theirs for your Secret Base.',
  skin: 'Apricorns! A Safari Ball made from one throws just the same. It only looks better. Good friends teach me their secret ones.',
  held: 'Berries for your Pokémon to hold. Pack up to three in a Berry Pouch: it eats one by itself when it needs it, and another can go on each biome.',
  kit: 'Supplies for the road, from your berries and the towns\' finds. Pack one as you set out and it starts in your Bag.',
};

/** Where a made thing goes, in a line on its card. */
function goesTo(r, ws) {
  if (r.kind === 'key') return 'Quest item · goes to your Satchel';
  if (r.kind === 'piece') return 'Furniture · sent to your Secret Base';
  if (r.secret) return `Safari Ball look · ${gifteeOf(r.leader, GYM_BY_ID[r.leader]?.name ?? 'a friend')}'s secret recipe`;
  if (r.kind === 'skin') return 'Safari Ball look · throws the same';
  if (r.kind === 'held') return 'Held berry · up to 3 in a run\'s Berry Pouch';
  if (r.kind === 'kit') return 'Run kit · pack one before a run, into your Bag';
  const who = gifteeOf(r.leader, GYM_BY_ID[r.leader]?.name ?? 'them');
  return ws.fond.includes(r.leader) ? `Gift · ${who}'s favourite · given ✓` : `Gift · ${who}'s favourite · give it at their home`;
}

/** A recipe's state, for its row and its button: 'made', 'carried', 'ready' or 'short'. */
function stateOf(r, ws, sat) {
  if (r.kind === 'skin' && ws.skin === r.makes) return 'carried';
  if (isMade(r, ws, sat)) return 'made';
  return shortOf(r, sat).length ? 'short' : 'ready';
}
/** Where a material drops, for its slot's tap. */
export const whereOf = (m) => matHints(m, BIOMES_BY_ID[m.biome]?.name, FRIENDS.some(id => GYM_BY_ID[id]?.biome === m.biome));

const missing = (r, sat) => shortOf(r, sat).reduce((n, m) => n + m.need - m.have, 0);
const ORDER = { ready: 0, short: 1, carried: 2, made: 3 };

/** Open the Workshop's window: Kurt's bench (2026-10-15, the user's ask: a crafting window that's easy to read and track).
    The picked recipe on a card with every material's have / need, the shelf below it sorted ready first, a tab per
    shelf counting what's ready and made, and a short forge when something's made. Resolves once it's closed. */
export function openWorkshop() {
  const d = el('dialog', 'dialog craft');
  const head = el('div', 'craft-head');
  head.append(el('h2', '', 'KURT\'S WORKSHOP'), el('span', 'craft-sub', 'Apricorn balls · since forever'));
  const talk = el('div', 'craft-talk'), say = el('p', 'craft-say');
  talk.append(el('span', 'craft-tag', KURT), say);
  const tabs = el('div', 'craft-tabs'), card = el('div', 'craft-card'), list = el('div', 'craft-list');
  const close = el('button', 'btn secondary craft-close', 'Close');
  close.type = 'button';
  d.append(head, talk, tabs, card, list, close);
  document.body.append(d);
  scrollCue(d, list);
  let tab = TABS.find(t => shelf(t.id).length)?.id ?? 'skin', picked = null, hint = null, busy = false, aside = false;
  const line = (t) => { say.textContent = t; };
  const draw = () => {
    const save = getSave(), sat = satchelOf(save), ws = workshopOf(save);
    tabs.replaceChildren(...TABS.map(t => {
      const all = shelf(t.id, save), ready = all.filter(r => stateOf(r, ws, sat) === 'ready').length;
      const made = all.filter(r => ['made', 'carried'].includes(stateOf(r, ws, sat))).length;
      const b = el('button', `craft-tab${t.id === tab ? ' on' : ''}`);
      b.type = 'button';
      const kept = REPEAT.includes(t.id) ? all.reduce((n, r) => n + keptOf(r, ws), 0) : 0;
      b.append(el('span', 'craft-tab-name', t.name), el('span', 'craft-tab-count', t.id === 'gift' ? `${all.length} known` : REPEAT.includes(t.id) ? `have ${kept}` : `${made}/${all.length} made`));
      if (ready) b.append(el('span', 'craft-dot', String(ready)));
      b.addEventListener('click', () => { if (tab === t.id || busy) return; playSound('select'); tab = t.id; picked = null; line(ABOUT[tab]); draw(); });
      return b;
    }));
    const shown = shelf(tab, save).map(r => ({ r, st: stateOf(r, ws, sat) }))
      .sort((a, b) => ORDER[a.st] - ORDER[b.st] || (a.st === 'short' ? missing(a.r, sat) - missing(b.r, sat) : 0));
    if (!shown.some(o => o.r.id === picked)) picked = shown[0]?.r.id ?? null;
    list.replaceChildren(...(shown.length ? shown.map(({ r, st }) => {
      const row = el('button', `craft-row ${st}${picked === r.id ? ' on' : ''}`);
      row.type = 'button';
      const pill = st === 'ready' ? 'READY' : st === 'made' ? 'MADE ✓' : st === 'carried' ? 'CARRIED' : `NEED ${missing(r, sat)}`;
      const icon = el('span', 'craft-row-pic');
      icon.append(art(r));
      row.append(icon, el('span', 'craft-row-name', nameOf(r)));
      if (keptOf(r, ws)) row.append(el('span', 'craft-held', `×${keptOf(r, ws)}`));
      row.append(el('span', `craft-pill ${st}`, pill));
      row.addEventListener('click', () => { if (busy) return; playSound('confirm'); picked = r.id; line(about(r, ws, sat)); draw(); });
      return row;
    }) : [el('p', 'craft-empty', EMPTY[tab] || 'Nothing here yet.')]));
    drawCard(shown.find(o => o.r.id === picked), ws, sat);
  };
  const drawCard = (o, ws, sat) => {
    card.hidden = !o;
    if (!o) return card.replaceChildren();
    const { r, st } = o;
    const pic = el('div', `craft-pic ${st}`);
    pic.append(art(r));
    const text = r.kind === 'key' ? KEY_BY_ID[r.makes].text : r.kind === 'piece' ? 'Made by hand, one of a kind.' : r.text;
    const info = el('div', 'craft-info');
    info.append(el('h3', 'craft-name', nameOf(r)), el('p', 'craft-goes', goesTo(r, ws)), el('p', 'craft-text', text));
    if (repeats(r)) info.append(el('p', 'craft-earns', keptOf(r, ws) ? `You have ${keptOf(r, ws)}. Pack one when you start a run.` : 'You have none yet.'));
    if (r.kind === 'gift' && r.sig && PIECES[r.sig]) info.append(el('p', 'craft-earns', ws.fond.includes(r.leader) ? `You earned their ${PIECES[r.sig].name}.` : `Their favourite earns: ${PIECES[r.sig].name}`));
    const top = el('div', 'craft-top');
    top.append(pic, info);
    const mats = el('div', 'craft-mats');
    if (!(hint in r.needs)) hint = null;
    for (const [id, need] of Object.entries(r.needs)) {
      const m = MATERIALS_BY_ID[id], have = sat.mats[id] || 0, ok = have >= need;
      const slot = el('button', `craft-mat${ok ? ' ok' : ''}${hint === id ? ' on' : ''}`);
      slot.type = 'button';
      slot.title = `Where to find ${m?.name ?? id}`;
      const bar = el('span', 'craft-bar'), fill = el('i');
      fill.style.width = `${Math.min(100, have / need * 100)}%`;
      bar.append(fill);
      slot.append(el('span', 'craft-mat-ico', m?.icon ?? '?'), el('span', 'craft-mat-name', m?.name ?? id), el('span', 'craft-mat-n', `${Math.min(have, 99)}/${need}`), bar, el('span', 'craft-mat-q', '?'));
      slot.addEventListener('click', () => { if (busy) return; playSound('select'); hint = hint === id ? null : id; drawCard(o, ws, sat); });
      mats.append(slot);
    }
    const tip = hint && MATERIALS_BY_ID[hint];
    if (tip) {
      const box = el('div', 'craft-where');
      box.append(el('p', 'craft-where-head', `${tip.icon} Where to find ${tip.name}`), ...whereOf(tip).map(t => el('p', 'craft-where-line', t)));
      mats.append(box);
    }
    const madeSkin = r.kind === 'skin' && ws.made.includes(r.id);
    const go = el('button', `craft-make ${st}`, madeSkin ? (ws.skin === r.makes ? 'Put away' : 'Carry it') : st === 'made' ? 'Made ✓' : st === 'ready' ? (keptOf(r, ws) ? 'Make another' : 'Make it!') : `Need ${missing(r, sat)} more`);
    go.type = 'button';
    go.disabled = !madeSkin && st !== 'ready';
    go.addEventListener('click', () => make(r));
    card.replaceChildren(top, el('p', 'craft-label', st === 'made' || madeSkin ? 'Made from' : 'Materials'), mats, go);
  };
  const about = (r, ws, sat) => {
    if (r.kind === 'skin' && isMade(r, ws, sat)) return `${r.name}. ${ws.skin === r.makes ? 'Your Safari Balls look like this now.' : 'Carry it and your Safari Balls will look like this.'}`;
    if (isMade(r, ws, sat)) return r.kind === 'key' ? `The ${nameOf(r)}'s in your Satchel already.` : `The ${nameOf(r)}'s made. It's in your Secret Base.`;
    const short = shortOf(r, sat);
    const need = short.length ? ` I still need ${short.map(m => `${m.need - m.have} ${MATERIALS_BY_ID[m.id].name}`).join(' and ')}.` : ' I can make it now.';
    if (r.kind === 'gift') return `${r.name}, ${gifteeOf(r.leader, GYM_BY_ID[r.leader].name)}'s favourite. Give it at their home and they'll give you something of theirs for your Secret Base.${need}`;
    if (r.kind === 'skin') return `${r.name}. ${r.text}${need}`;
    if (r.kind === 'held') return `${an(r.name).replace(/^a/, 'A')} for your Pokémon to hold. ${r.text.replace(/^Held\. /, '')}${need}`;
    if (r.kind === 'kit') return `${an(r.name).replace(/^a/, 'A')}, for your Bag. ${r.text}${need}`;
    if (r.kind === 'key') return `${nameOf(r)}. ${KEY_BY_ID[r.makes].text}${need}`;
    return `A ${nameOf(r)}, made by hand.${need}`;
  };
  const make = async (r) => {
    if (busy) return;
    const ws = workshopOf(getSave());
    if (r.kind === 'skin' && ws.made.includes(r.id)) {
      const on = ws.skin !== r.makes;
      carrySkin(on ? r.makes : null);
      playSound(on ? 'confirm' : 'cancel');
      line(on ? `There! Your Safari Balls are ${r.name}s now. They catch just the same.` : 'Back to plain Safari Balls. Good old things.');
      return draw();
    }
    if (!craft(r)) { playSound('cancel'); return draw(); }
    busy = true;
    d.classList.add('busy');
    try { await forge(card, r); } catch (e) { console.error(e); }
    busy = false;
    d.classList.remove('busy');
    line(r.kind === 'key' ? `Done! The ${nameOf(r)}'s in your Satchel. Take it to them.`
      : r.kind === 'piece' ? `Done! The ${nameOf(r)}'s gone to your Secret Base.`
        : r.kind === 'gift' ? `Done! Take the ${r.name} to ${r.leader === 'nietos' ? 'the Nietos\' house' : `${GYM_BY_ID[r.leader].name}'s home`}. Or anyone's.`
          : repeats(r) ? `Done! ${an(r.name).replace(/^a/, 'A')}, kept for you: you have ${keptOf(r, workshopOf(getSave()))} now. Pack one when you set out on a run.`
            : `Done! A ${r.name}. Tap Carry it to use it.`);
    draw();
    if (r.kind === 'held' && !toldHeld('held')) await kurtSays(CLEARING.homes.workshop.heldTalk, 'held');
    if (r.kind === 'kit' && !toldHeld('kit')) await kurtSays(CLEARING.homes.workshop.kitTalk, 'kit');
    if (r.kind === 'gift' && !toldHeld(GIFT_TOLD)) await kurtSays(CLEARING.homes.workshop.giftTalk, GIFT_TOLD);
  };
  /* Kurt slides in (gymTalk(), as on his first hello) over the room: the bench steps aside while he talks (a modal
     dialog would sit over him), then comes back as it was. */
  const kurtSays = async (lines, key) => {
    tellHeld(key);
    busy = aside = true;
    const shut = new Promise(res => d.addEventListener('close', res, { once: true }));
    d.close();
    await shut;
    try {
      const { gymTalk } = await import('./gym.js');
      await gymTalk({ id: 'kurt', name: KURT, talk: 'assets/trainers/kurt.png' }, lines, { lit: true, title: 'APRICORN SMITH ' });
    } catch (e) { console.error(e); }
    d.showModal();
    busy = aside = false;
  };
  line('Ah, a customer! I make Apricorn balls, mostly. These days the towns keep me busy too. What\'ll it be?');
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { if (aside) return; d.remove(); res(); });
    d.addEventListener('cancel', (e) => { if (busy) e.preventDefault(); });
    close.addEventListener('click', () => { if (!busy) d.close(); });
    d.showModal();
  });
}

/** The forge (2026-10-15, the user's ask: a simple crafting animation): each material flies off its slot into the
    anvil's glow in turn, the glow swells and bursts in sparks, and the thing made pops out with a MADE! stamp. A tap
    or a beat moves on; reduced motion just shows the thing made. */
async function forge(card, r) {
  const calm = calmFx(), box = card.getBoundingClientRect();
  const stage = el('div', 'craft-forge'), pot = el('div', 'craft-pot');
  stage.append(pot);
  card.append(stage);
  const cx = box.width / 2, cy = box.height * 0.42;
  pot.style.left = `${cx}px`; pot.style.top = `${cy}px`;
  if (!calm) {
    await wait(30);
    stage.classList.add('on');
    const icons = [...card.querySelectorAll('.craft-mat .craft-mat-ico')];
    for (const [i, ico] of icons.entries()) {
      const at = ico.getBoundingClientRect(), fly = el('span', 'craft-fly', ico.textContent);
      fly.style.left = `${at.left - box.left + at.width / 2}px`; fly.style.top = `${at.top - box.top + at.height / 2}px`;
      stage.append(fly);
      const dx = cx - (at.left - box.left + at.width / 2), dy = cy - (at.top - box.top + at.height / 2);
      fly.animate([{ translate: '-50% -50%', scale: 1 }, { translate: `calc(-50% + ${dx * 0.5}px) calc(-50% + ${dy * 0.5 - 40}px)`, scale: 1.3, offset: 0.5 }, { translate: `calc(-50% + ${dx}px) calc(-50% + ${dy}px)`, scale: 0.3, opacity: 0.2 }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
      setTimeout(() => { playSound('fx-pop'); pot.classList.remove('gulp'); void pot.offsetWidth; pot.classList.add('gulp'); }, 480);
      await wait(i < icons.length - 1 ? 220 : 560);
    }
    playSound('fx-whirr');
    pot.classList.add('hot');
    await wait(700);
    playSound('fx-ding');
    for (let i = 0; i < 16; i++) {
      const sp = el('i', 'craft-spark'), a = i / 16 * Math.PI * 2, dist = 70 + Math.random() * 50;
      sp.style.left = `${cx}px`; sp.style.top = `${cy}px`;
      stage.append(sp);
      sp.animate([{ translate: '-50% -50%', opacity: 1 }, { translate: `calc(-50% + ${Math.cos(a) * dist}px) calc(-50% + ${Math.sin(a) * dist}px)`, opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards' });
    }
  }
  const out = el('div', 'craft-result');
  out.style.left = `${cx}px`; out.style.top = `${cy}px`;
  out.append(art(r), el('span', 'craft-stamp', 'MADE!'));
  stage.append(out);
  playSound('item-get');
  await Promise.race([wait(calm ? 900 : 1500), new Promise(res => stage.addEventListener('click', res, { once: true }))]);
  stage.classList.add('out');
  await wait(calm ? 0 : 250);
  stage.remove();
}
const wait = (ms) => new Promise(res => setTimeout(res, ms));

/** Pick a gift to hand `leader` (their home's Gift option): resolves the gift's id, or null. */
export function pickGift(leader) {
  const d = el('dialog', 'dialog dev-window town-shop workshop');
  const grid = el('div', 'tshop-grid'), say = el('p', 'tshop-say', `Give ${gifteeOf(leader, GYM_BY_ID[leader]?.name ?? 'them')} which gift?`);
  const screen = el('div', 'dev-screen');
  screen.append(say, grid);
  const close = el('button', 'btn secondary', 'Not now'), acts = el('div', 'dialog-actions');
  acts.append(close);
  d.append(el('h2', '', 'GIFTS'), screen, acts);
  document.body.append(d);
  let chosen = null;
  grid.append(...giftsHeld().map(({ gift, n }) => {
    const tile = el('button', 'tshop-tile');
    tile.type = 'button';
    tile.append(art(gift), el('span', 'tshop-name', gift.name), el('span', 'tshop-price', `×${n}`));
    tile.addEventListener('click', () => { chosen = gift.makes; d.close(); });
    return tile;
  }));
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(chosen); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}

export { GIFT_BY_ID };

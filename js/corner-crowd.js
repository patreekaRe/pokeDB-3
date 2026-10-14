/* corner-crowd.js  -  the Game Corner's regulars (2026-10-12, the user's ask: make it feel alive, not crowded). A few
   Pokémon at a time play the slots, the arcade machines, the tables and Plinko; some wander about deciding, some walk up
   to Meowth's counter (it answers), and now and then one heads home over the doormat and another walks in. Who's here is
   dealt from the day's cast (12 of PATRONS, by the UTC date) and the hour, so it changes through the day.
   They talk, but sparingly: one small speech window over a head at a time (.spook-bubble, the Clearing's ghosts'), a
   pause of several seconds between, now and then two of them chatting, a word to you when you pass, and once a visit
   one walks up to say hi. A tap on one stops it to talk in the shop's speech window. If you walk up to the game one is
   playing, it steps aside. Lines are in js/data/corner-crowd.js; js/mall-3d.js hands this its pieces (`H`).
   The Poké Mall's hall has a crowd of its own on the same walking and talking (2026-10-12, the user's ask): a cast from
   js/data/mall-crowd.js, a few standing about at the shop windows and fountains, a couple wandering, one coming or going
   now and then, and a new cast every 8 hours (`H.cast`, `H.castHours` and the rest below). */

import { PATRONS, SHARED, CHATS, MEOWTH_REPLIES, MEOWTH_FOR } from './data/corner-crowd.js';
import { playCry } from './audio.js';
import { trainerName } from './leaderboard.js';

const CROWD = 5;                 // how many at once: enough to feel live, not so many it's crowded (the hall hands its own through H)
const CAST = 12;                 // the day's regulars
const SWAP = [45000, 90000];     // how often one leaves (ms); another walks in a few seconds later
const BUBBLE_MS = 3600;
const QUIET = [9000, 17000];     // the pause between lines over heads
const GREET_AFTER = [25000, 55000];
const PLAY = [25000, 70000], PONDER = [1800, 4500], COUNTER = [5000, 8000];
const GAP = [1500, 3500];        // with walkers capped, the quiet between one walk ending and the next starting

const between = ([a, b]) => a + Math.random() * (b - a);
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
const shuffled = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
const named = (line, other = '') => line.replaceAll('{name}', trainerName()).replaceAll('{other}', other);

function seeded(text) {
  let h = 1779033703;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353) >>> 0;
  return () => { h = (h + 0x6d2b79f5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const dealt = (list, rnd, n) => list.map(x => [rnd(), x]).sort((p, q) => p[0] - q[0]).slice(0, n).map(([, x]) => x);

/** What kind of game a spot is, for who likes it; null for what nobody plays (the counter, the leaderboard). */
function kindOf(spot) {
  if (spot.kind !== 'game') return null;
  if (spot.id.startsWith('slotmachine')) return 'slots';
  if (spot.id.startsWith('plinko')) return 'plinko';
  if (spot.id.startsWith('show-')) return 'screens';
  if (['blackjack', 'highlow', 'voltorb', 'quiz'].includes(spot.id)) return 'cards';
  if (/\d+,\d+$/.test(spot.id)) return 'arcade';
  return null;
}

/** `H`: optional `cast` (the regulars, PATRONS by default), `shared` / `chats` (their lines), `size` (how many at once),
    `castSize`, `castHours` (deal a new cast every that many UTC hours, else one a day), `seed`, `stations` (where they
    stand, else the place's games), `wants` (what each of the first crowd heads for, null to wander), `swap` ([ms, ms]).
    THREE, group, monBoard, drawMon, dispose, PITCH, spots, door, cols, rows, route, free, tileX, tileZ, camera, view,
    stage (where the bubble goes), say(fr, ms), partner() (your walker), keeper() (the shop's keeper, its mon), calm(),
    oneWalker (only one walks at a time, the rest at their games or standing, and none stops on or beside the doormat:
    the Game Corner's, the user's ask, 2026-10-13, as the Clearing's ghosts), or `walkers` (that many at most: the
    towns' 2, the user's ask, 2026-10-14, the rest stationed), `drawn(v)` (where a point is drawn, a rolling town's). */
export function makeCrowd(H) {
  const { THREE } = H;
  const LIST = H.cast ?? PATRONS, LINES = H.shared ?? SHARED, TALKS = H.chats ?? CHATS, SIZE = H.size ?? CROWD;
  const CAP = H.walkers ?? (H.oneWalker ? 1 : 0);   // 0: any number walk at once
  const shown = H.drawn ?? ((v) => v);
  const SEED = H.seed ?? 'crowd', SWAPS = H.swap ?? SWAP, WANTS = H.wants ?? ['slots', 'slots', 'arcade', 'cards'];
  const stations = H.stations ?? H.spots.map(s => ({ spot: s, kind: kindOf(s) })).filter(s => s.kind);
  const counter = H.spots.find(s => s.kind === 'keeper')?.step;
  const dealing = () => { const d = new Date(); return `${d.toISOString().slice(0, 10)}${H.castHours ? `:${Math.floor(d.getUTCHours() / H.castHours)}` : ''}`; };
  let deal = dealing(), cast = dealt(LIST, seeded(`${SEED}:${deal}`), H.castSize ?? CAST);
  const here = [];
  let bubble = null, chat = null, nextTalk = 0, nextSwap = 0, greetAt = 0, greeted = false, lastTick = 0, gone = false, hour = -1;
  let walkAfter = 0, incoming = null;

  const el = document.createElement('p');
  el.className = 'spook-bubble crowd-bubble';
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<b class="mall-who"></b><span></span>';
  el.hidden = true;
  H.stage.append(el);

  const key = (t) => `${t.x},${t.y}`;
  const held = new Set();   // stations dealt to Pokémon still loading in
  const taken = (t, but) => held.has(key(t)) || here.some(p => p !== but && !p.leaving && ((p.goal && key(p.goal) === key(t)) || (!p.w.path.length && key(p.w.tile) === key(t))));
  const yours = (t) => { const me = H.partner(); return key(me.tile) === key(t) || (me.path.length && key(me.path.at(-1)) === key(t)); };
  const open = (t) => H.free(t) && !taken(t) && !yours(t);
  const byDoor = (t) => CAP && Math.abs(t.x - H.door.x) <= 1 && Math.abs(t.y - H.door.y) <= 1;
  const walking = (but) => here.filter(o => o !== but && ((o.state === 'walk' && o.w.path.length) || o.resume?.state === 'walk')).length;
  /** Whether `p` may set off now: always, unless walkers are capped and that many are walking (or one just was). */
  const mayWalk = (p, now) => !CAP || (walking(p) < CAP && now >= walkAfter);

  /* ---------- coming and going ---------- */

  async function arrive(def, at = null) {
    const m = await H.monBoard({ src: `assets/pokemon/${def.id}-front.gif`, name: def.name, cry: def.id }, false);
    if (gone) return H.dispose(m.group);
    m.board.rotation.x = -H.PITCH;
    m.board.userData.patron = true;
    const door = H.door, start = at ?? { x: door.x, y: H.rows - 0.03 };
    const p = { def, m, w: { x: H.tileX(start.x), z: H.tileZ(start.y), tile: at ?? { ...door }, path: [], facing: 'front', flip: Math.random() < 0.5, hop: 0 },
      state: 'ponder', until: 0, deck: [], phase: Math.random() * 6, grow: at ? 1 : 0, hopUntil: 0 };
    m.board.userData.who = p;
    H.group.add(m.group);
    here.push(p);
    if (!at) { p.w.path = [{ ...door }]; p.state = 'walk'; p.then = 'ponder'; maybeSay(p, pickOne(LINES.arriving)); }
    return p;
  }

  function leave(p) {
    p.leaving = true; p.goal = null; p.station = null;
    p.w.path = [...H.route(p.w.tile, H.door), { x: H.door.x, y: H.rows - 0.03 }];
    p.state = 'walk'; p.then = 'gone';
    maybeSay(p, pickOne(LINES.leaving));
  }

  function remove(p) {
    here.splice(here.indexOf(p), 1);
    if (bubble?.who === p) hush();
    if (chat?.with.includes(p)) chat = null;
    H.group.remove(p.m.group);
    H.dispose(p.m.group);
  }

  /** The hour's crowd, already at their games (on entering, or after being away a while). */
  function populate() {
    for (const p of [...here]) remove(p);
    hour = new Date().getUTCHours();
    walkAfter = 0; incoming = null;
    if (dealing() !== deal) { deal = dealing(); cast = dealt(LIST, seeded(`${SEED}:${deal}`), H.castSize ?? CAST); }
    const rnd = seeded(`${SEED}:${deal}:${hour}`), who = dealt(cast, rnd, SIZE);
    who.forEach(async (def, i) => {
      const want = WANTS[i] ?? null;
      const st = want && free(def, want), at = st ? st.spot.step : spotAround();
      held.add(key(at));
      const p = await arrive(def, at);
      held.delete(key(at));
      if (!p) return;
      p.roam = !want && !!H.stations;
      if (st) sit(p, st, between(PLAY) * Math.random() + 6000); else { p.state = 'ponder'; p.until = performance.now() + between(PONDER) + 2000; }
    });
    const now = performance.now();
    nextSwap = now + between(SWAPS);
    nextTalk = now + 5000;
    greetAt = now + between(GREET_AFTER);
  }

  /* ---------- choosing what to do ---------- */

  /** A free station of `kind` (or of what it likes), nearest first for a bit of sense. */
  function free(def, kind) {
    const kinds = kind ? [kind] : def.likes;
    const list = stations.filter(s => kinds.includes(s.kind) && open(s.spot.step));
    return list.length ? pickOne(list) : null;
  }

  function spotAround() {
    for (let i = 0; i < 40; i++) {
      const t = { x: 1 + Math.floor(Math.random() * (H.cols - 2)), y: 3 + Math.floor(Math.random() * (H.rows - 4)) };
      if (open(t) && !byDoor(t)) return t;
    }
    return { ...H.door };
  }

  function go(p, to, then, station = null) {
    const path = key(to) === key(p.w.tile) ? [] : H.route(p.w.tile, to);
    p.goal = to; p.station = station; p.then = then; p.state = 'walk'; p.w.path = path;
    if (!path.length) reach(p);
  }

  function decide(p) {
    const now = performance.now();
    if (!byDoor(p.w.tile) && !mayWalk(p, now)) { p.until = now + 500 + Math.random() * 1500; return; }
    const r = Math.random() + (p.roam ? 0.45 : 0);   // a wanderer mostly wanders
    if (r < 0.62) { const st = free(p.def) || free(p.def, pickOne([...new Set(stations.map(s => s.kind))])); if (st) return go(p, st.spot.step, 'play', st); }
    if (r < 0.78 && counter && !here.some(o => o !== p && o.then === 'counter')) {
      const t = [counter, { x: counter.x - 1, y: counter.y }, { x: counter.x + 1, y: counter.y }].find(open);
      if (t) return go(p, t, 'counter');
    }
    go(p, spotAround(), 'ponder');
  }

  function sit(p, st, ms) {
    p.state = 'play'; p.station = st; p.goal = st.spot.step; p.until = performance.now() + ms;
    p.w.tile = { ...st.spot.step }; p.w.x = H.tileX(p.w.tile.x); p.w.z = H.tileZ(p.w.tile.y);
    faceStation(p);
  }

  function faceStation(p) {
    const s = p.station?.spot;
    if (!s) return;
    if (s.step.x === 1 && s.id.startsWith('slotmachine')) p.w.flip = false;
    else if (s.step.x === H.cols - 2 && s.id.startsWith('slotmachine')) p.w.flip = true;
  }

  function reach(p) {
    const now = performance.now();
    if (CAP && p.state === 'walk' && (p.then === 'gone' || !byDoor(p.w.tile))) walkAfter = now + between(GAP);
    if (p.then === 'gone') { p.state = 'out'; p.shrink = now; return; }
    if (p.then === 'play' && p.station) { p.state = 'play'; p.until = now + between(PLAY); faceStation(p); return; }
    if (p.then === 'counter') { p.state = 'counter'; p.until = now + between(COUNTER); p.w.flip = H.keeper().x > p.w.x; atCounter(p); return; }
    if (p.then === 'greet') { p.state = 'talk'; p.until = now + 4500; p.w.flip = H.partner().x > p.w.x; p.hopUntil = now + 500; playCry(p.def.id); blurt(p, pickOne([...LINES.nearYou, ...p.def.you]), 4200, true); return; }
    p.state = 'ponder'; p.until = now + between(PONDER);
    p.goal = null;
    if (byDoor(p.w.tile)) decide(p);   // one just in walks straight on off the mat, its walk unbroken
  }

  /* ---------- talking ---------- */

  const speaker = (p) => ({ name: p.def.name, at: () => new THREE.Vector3(p.w.x, p.m.board.position.y + p.m.top + 0.3, p.w.z), who: p });
  const meowth = () => { const k = H.keeper(); return k?.mon && { name: k.name, at: () => new THREE.Vector3(k.x, (k.lift ?? 0.3) + k.mon.top + 0.3, k.z), who: k }; };

  function blurt(p, text, ms = BUBBLE_MS, force = false) {
    const s = p.def ? speaker(p) : p;
    if (!s || (bubble && !force)) return false;
    el.firstChild.textContent = s.name;
    el.children[1].textContent = named(text, s.other ?? '');
    bubble = { ...s, until: performance.now() + ms };
    el.classList.remove('spook-in'); void el.offsetWidth; el.classList.add('spook-in');
    nextTalk = bubble.until + between(QUIET);
    return true;
  }

  function hush() { bubble = null; el.hidden = true; }

  /** Says it only if nothing else is being said and the room's been quiet a bit. */
  function maybeSay(p, text) {
    if (bubble || chat || performance.now() < nextTalk - 6000) return;
    setTimeout(() => { if (!gone && here.includes(p) && onScreen(speaker(p))) blurt(p, text); }, 600);
  }

  function atCounter(p) {
    if (bubble || chat) return;
    const k = meowth();
    if (!k) return;
    const reply = pickOne(MEOWTH_FOR[p.def.id] && Math.random() < 0.7 ? MEOWTH_FOR[p.def.id] : MEOWTH_REPLIES);
    chat = { with: [p], lines: [[speaker(p), pickOne(p.def.meowth)], [k, reply]], i: 0, next: performance.now() + 400 };
  }

  function startChat(a, b) {
    const lines = pickOne(TALKS);
    chat = { with: [a, b], lines: lines.map((t, i) => [{ ...speaker(i % 2 ? b : a), other: (i % 2 ? a : b).def.name }, t]), i: 0, next: performance.now() };
    a.w.flip = b.w.x > a.w.x; b.w.flip = a.w.x > b.w.x;
    for (const p of [a, b]) if (p.state === 'ponder') p.until = Math.max(p.until, performance.now() + lines.length * BUBBLE_MS);
  }

  function tickChat(now) {
    if (!chat || bubble || now < chat.next) return;
    if (chat.with.some(p => !here.includes(p) || p.leaving)) { chat = null; return; }
    const [s, text] = chat.lines[chat.i++];
    if (s.who === H.keeper()) s.who.hopUntil = now + 500;
    blurt(s, text, BUBBLE_MS, true);
    chat.next = now + BUBBLE_MS + 250;
    if (chat.i >= chat.lines.length) chat = null;
  }

  function onScreen(s) {
    const v = shown(s.at()).project(H.camera);
    return v.z < 1 && Math.abs(v.x) < 0.85 && v.y < 0.85 && v.y > -0.55;
  }

  /** Pins the bubble over its speaker's head. */
  function place() {
    const r = H.view.getBoundingClientRect(), o = H.stage.getBoundingClientRect(), v = shown(bubble.at()).project(H.camera);
    const x = r.left - o.left + (v.x + 1) / 2 * r.width, half = el.offsetWidth / 2 + 8;
    const kept = Math.max(half, Math.min(o.width - half, x));   // kept on the screen, its tail still pointing at the head
    el.style.left = `${kept}px`;
    el.style.setProperty('--tail', `${Math.max(-half + 22, Math.min(half - 22, x - kept))}px`);
    el.style.top = `${r.top - o.top + (1 - v.y) / 2 * r.height}px`;
    el.hidden = !(v.z < 1 && Math.abs(v.x) < 0.95 && v.y < 0.95 && v.y > -0.7);
  }

  /** Something said now and then, by whoever's in view: to itself, at its game, to another, or to you. */
  function idleTalk(now) {
    const seen = here.filter(p => !p.leaving && p.grow >= 1 && p.state !== 'talk' && onScreen(speaker(p)));
    if (!seen.length) { nextTalk = now + 4000; return; }
    const me = H.partner(), near = seen.filter(p => Math.hypot(p.w.x - me.x, p.w.z - me.z) < 3);
    const r = Math.random();
    if (r < 0.2) {
      for (const a of shuffled(seen)) {
        const b = seen.find(o => o !== a && Math.hypot(o.w.x - a.w.x, o.w.z - a.w.z) < 4.5);
        if (b) return startChat(a, b);
      }
    }
    if (r < 0.34 && near.length) { const p = pickOne(near); p.w.flip = me.x > p.w.x; return blurt(p, pickOne(Math.random() < 0.5 ? LINES.nearYou : p.def.you)); }
    const p = pickOne(seen);
    if (p.state === 'play' && Math.random() < 0.75) {
      if (Math.random() < 0.3) p.hopUntil = now + 500;
      return blurt(p, pickOne([...p.def.play, ...(LINES[p.station?.kind] ?? [])]));
    }
    blurt(p, pickOne(p.state === 'ponder' ? [...LINES.deciding, ...p.def.quips] : p.def.quips));
  }

  /* ---------- moving ---------- */

  function step(p, dt) {
    const w = p.w, next = w.path[0];
    if (!next) return reach(p);
    const tx = H.tileX(next.x), tz = H.tileZ(next.y), dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz), move = dt / 1000 * p.def.speed;
    if (Math.abs(dx) > 0.01) w.flip = dx > 0;
    if (d <= move) { w.x = tx; w.z = tz; if (Number.isInteger(next.y)) w.tile = { ...next }; w.path.shift(); if (!w.path.length) reach(p); }
    else { w.x += dx / d * move; w.z += dz / d * move; }
    w.hop += dt;
  }

  return {
    /** On walking in: the hour's crowd if it's a new hour or you were away a while, else they carry on. */
    enter() {
      const now = performance.now();
      if (!here.length || now - lastTick > 180000 || new Date().getUTCHours() !== hour || dealing() !== deal) populate();
      hush(); chat = null;
      greeted = false; greetAt = now + between(GREET_AFTER);
      nextTalk = Math.max(nextTalk, now + 4000);
    },

    /** A tap on a regular: it stops, faces your partner and says something in the speech window. True if it was one. */
    tap(obj) {
      const p = obj?.userData?.who;
      if (!p || !here.includes(p) || p.leaving) return false;
      const me = H.partner();
      if (bubble?.who === p) hush();
      if (!p.deck.length) p.deck = shuffled(p.def.you);
      p.resume = p.state === 'talk' ? p.resume : { state: p.state, path: p.w.path };
      p.w.path = []; p.state = 'talk'; p.until = performance.now() + 5000;
      p.w.flip = me.x > p.w.x; p.hopUntil = performance.now() + 500;
      playCry(p.def.id);
      H.say({ line: named(p.deck.shift()), who: p.def.name }, 4200);
      nextTalk = Math.max(nextTalk, performance.now() + 6000);
      return true;
    },

    tick(now, dt, active) {
      if (gone) return;
      if (!active) { if (!el.hidden) el.hidden = true; return; }
      lastTick = now;
      const calm = H.calm(), me = H.partner();
      for (const p of [...here]) {
        const w = p.w;
        p.grow = Math.min(1, p.grow + dt / 400);
        if (p.state === 'out') { const k = 1 - (now - p.shrink) / 350; if (k <= 0) { remove(p); continue; } p.m.group.scale.setScalar(k); }
        else p.m.group.scale.setScalar(calm ? 1 : 0.3 + 0.7 * p.grow);
        if (p.state === 'walk') step(p, dt);
        else if (p.state === 'talk') { if (now > p.until) { const r = p.resume; p.resume = null; if (r?.state === 'play') { p.state = 'play'; faceStation(p); } else if (r?.state === 'walk' && r.path.length) { p.state = 'walk'; w.path = r.path; } else { p.state = 'ponder'; p.until = now + 800; } } }
        else if (p.state === 'play') {
          if (yours(w.tile)) {   // you walked up to its game: it makes way
            p.station = null; p.goal = null;
            if (!bubble && Math.random() < 0.5) blurt(p, pickOne(['Oh! Go ahead.', 'All yours!', 'Have a turn!', 'I was done anyway.']));
            go(p, spotAround(), 'ponder');
          } else if (now > p.until) { p.station = null; p.goal = null; p.state = 'ponder'; p.until = now + between(PONDER); }
        } else if ((p.state === 'ponder' || p.state === 'counter') && now > p.until) decide(p);
        const t = now / 1000 + p.phase, moving = w.path.length > 0 && p.state === 'walk', mv = p.def.move;
        let y = 0;
        if (!calm) {
          if (p.hopUntil > now) y = Math.abs(Math.sin((p.hopUntil - now) / 500 * Math.PI * 2)) * 0.3;
          else if (mv === 'float') y = 0.35 + Math.sin(t * 2) * 0.12;
          else if (mv === 'hop') y = moving ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 3)) * 0.22 : Math.abs(Math.sin(t * 1.4)) * 0.03;
          else y = moving ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 4)) * 0.08 : (p.state === 'play' ? Math.abs(Math.sin(t * 2.2)) * 0.03 : 0);
        } else if (mv === 'float') y = 0.35;
        p.m.group.position.set(w.x, 0, w.z);
        p.m.board.position.y = y;
        p.m.board.scale.x = w.flip ? -1 : 1;
        p.m.group.children[1].scale.setScalar(mv === 'float' ? 0.7 : 1);
        H.drawMon(p.m, { facing: 'front' }, dt);
      }

      // comings and goings: one heads home, another walks in a few seconds later
      if (now > nextSwap && !incoming && mayWalk(null, now)) {
        nextSwap = now + between(SWAPS);
        const out = shuffled(here.filter(p => !p.leaving && p.state !== 'talk' && !chat?.with.includes(p)))[0];
        if (out) { leave(out); incoming = now + between([5000, 14000]); }
      }
      if (incoming && now > incoming && mayWalk(null, now)) {
        incoming = null;
        const away = cast.filter(d => !here.some(p => p.def === d));
        if (here.filter(p => !p.leaving).length < SIZE && away.length) {
          if (CAP) walkAfter = Infinity;   // held while it loads, so nobody sets off before it walks in
          arrive(pickOne(away)).then(p => { if (CAP && walkAfter === Infinity) walkAfter = 0; if (p) p.roam = !!H.stations && Math.random() < 0.5; });
        }
      }

      // once a visit, one comes over to say hi
      if (!greeted && now > greetAt && !bubble && !chat && mayWalk(null, now)) {
        greeted = true;
        const p = shuffled(here.filter(o => !o.leaving && (o.state === 'ponder' || o.state === 'play')))[0];
        const spot = p && [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: me.tile.x + dx, y: me.tile.y + dy })).find(t => open(t) && !byDoor(t));
        if (spot && !me.path.length) go(p, spot, 'greet');
      }

      tickChat(now);
      if (bubble && now > bubble.until) hush();
      if (bubble) place();
      if (!bubble && !chat && now > nextTalk) idleTalk(now);
    },

    hide: () => { hush(); chat = null; },

    dispose() {
      gone = true;
      for (const p of [...here]) remove(p);
      el.remove();
    },
  };
}

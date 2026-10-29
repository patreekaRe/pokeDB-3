/* hub-spooky.js  -  the Clearing's Halloween guests (js/hub-3d.js asks for them in October): ghost Pokémon wandering
   about between the decorations, and bats circling the Ancient Tree. Now and then one blurts a short line in a little
   speech window over its head (.spook-bubble, the cream look of the Furniture store's, its tail pointing at who
   said it), and when tapped it speaks in that store's speech window over the bar (.mall-line in css/hub.css: its
   name on a tilted pink tag), a line or a whole story tapped through (js/data/spooky-lines.js), your nickname turning up among them. None walks
   up to greet you any more (the user's call, 2026-10-23: it got annoying). Each has its own spot, a tile apart from
   anyone else's; every other one paces a short set beat from it, the rest float in place (2026-10-28, the user's ask:
   set paths as in the Pokémon games, nobody overlapping; js/ground-beats.js). */

import { SPOOKS } from './data/spooky-lines.js';
import { batArt } from './hub-season.js';
import { playCry, playSound } from './audio.js';
import { trainerName } from './leaderboard.js';
import { same, nearAny, paceFrom, beatPath, headTo, stepBeat, holdsTile } from './ground-beats.js';

const QUIP_MS = 4200;         // how long a line over a head stays
const PAUSE = [3000, 6000];   // the quiet between one ghost's stroll and the next's (ms)
const WAIT = 2500;            // blocked this long (ms), a ghost turns back

const shuffled = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
const between = ([a, b]) => a + Math.random() * (b - a);
const named = (line) => line.replaceAll('{name}', trainerName());

/** `H` lends the hub's pieces: THREE, scene, camera, root, tex, dispose, monBoard, drawMon, route, free, tileX, tileZ,
    PITCH, byDoor (a tile on or beside a doorstep), spawns (tiles to start on, one a ghost), bats ({ x, z }: what they
    circle), claimed(t) (another's spot or beat), busy(t, who) (someone on the ground there). They mostly stand about:
    only one strolls at a time, taking turns (the user's ask, 2026-10-13), and none ever stops on or beside a doorstep. */
export function makeSpooks(H) {
  const { THREE } = H;
  const ghosts = [];
  let turn = 0, nextWalk = performance.now() + between(PAUSE);
  let talking = null, timed = null, nextQuip = performance.now() + 7000, bats = null, gone = false;

  const foot = document.createElement('div');
  foot.className = 'mall-foot spook-foot';
  foot.innerHTML = '<p class="mall-line talk spook-line" aria-live="polite"><b class="mall-who"></b><span></span><i aria-hidden="true"></i></p>';
  H.root.append(foot);
  const line = foot.firstChild;
  const bubble = document.createElement('p');
  bubble.className = 'spook-bubble';
  bubble.setAttribute('aria-live', 'polite');
  bubble.innerHTML = '<b class="mall-who"></b><span></span>';
  bubble.hidden = true;
  H.root.append(bubble);
  let quip = null;            // { g, until }: the line floating over a ghost's head
  line.addEventListener('click', (e) => { e.stopPropagation(); if (talking) sayNext(); else fade(); });

  const spots = [];

  // bats: two flapping frames on one material each, swapped every few frames
  {
    const up = batArt(true), down = batArt(false), k = 0.9 / 16;
    const mk = (c) => new THREE.MeshStandardMaterial({ map: H.tex(c), emissiveMap: H.tex(c.glow), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, fog: false });
    const mats = [mk(up), mk(down)], geo = new THREE.PlaneGeometry(up.width / up.fine * k, up.height / up.fine * k);
    bats = Array.from({ length: 7 }, (_, i) => {
      const b = new THREE.Mesh(geo, mats[i % 2]);
      b.raycast = () => {};
      b.userData = { r: 2.2 + Math.random() * 2.2, y: 3.6 + Math.random() * 2, speed: (0.35 + Math.random() * 0.35) * (Math.random() < 0.5 ? -1 : 1), at: Math.random() * Math.PI * 2, flap: Math.random() * 300 };
      H.scene.add(b);
      return b;
    });
    bats.mats = mats; bats.geo = geo;
  }

  const standable = (c) => H.free(c) && !H.byDoor(c) && !H.claimed?.(c) && !nearAny(c, spots.flatMap(s => s.tiles));
  /** The nearest tile a ghost may stand on, from `c` outwards. */
  function standAt(c) {
    for (let r = 0; r < 6; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const t = { x: c.x + dx, y: c.y + dy };
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && standable(t)) return t;
        }
    return c;
  }

  // the spots and beats first, all at once, so none is dealt a tile another's beat crosses
  for (const [i] of SPOOKS.entries()) {
    const home = standAt(H.spawns[i % H.spawns.length]);
    const beat = i % 2 ? null : paceFrom(home, H.route, (t) => H.free(t) && !H.byDoor(t) && !H.claimed?.(t) && !nearAny(t, spots.flatMap(s => s.tiles)));
    spots.push({ home, beat, tiles: beat ?? [home] });
  }
  SPOOKS.forEach(async (def, i) => {
    const m = await H.monBoard({ src: `assets/pokemon/${def.id}-front.gif`, name: def.name, cry: def.id }, false);
    if (gone) return H.dispose(m.group);
    m.board.rotation.x = -H.PITCH;
    const { home: tile, beat } = spots[i];
    const g = { def, m, beat, toEnd: false, w: { x: H.tileX(tile.x), z: H.tileZ(tile.y), tile, path: [], facing: 'front', flip: Math.random() < 0.5, hop: 0 },
      deck: [], quips: shuffled(def.quips), phase: Math.random() * 6 };
    m.board.userData.who = { mon: m, w: g.w, spook: g };
    H.scene.add(m.group);
    ghosts.push(g);
  });

  /** Into the speech window under its name; `more` shows the arrow (a tap goes on), else it fades after `ms`. */
  function show(g, text, { more = false, ms = QUIP_MS } = {}) {
    line.firstChild.textContent = g.def.name;
    line.children[1].textContent = named(text);
    line.classList.toggle('more', more);
    line.classList.add('on');
    clearTimeout(timed);
    timed = more ? null : setTimeout(fade, ms);
  }

  /** A passing line over a ghost's head, gone after QUIP_MS. */
  function blurt(g, text) {
    bubble.firstChild.textContent = g.def.name;
    bubble.children[1].textContent = named(text);
    quip = { g, until: performance.now() + QUIP_MS };
    bubble.classList.remove('spook-in'); void bubble.offsetWidth; bubble.classList.add('spook-in');
  }

  function unblurt() { quip = null; bubble.hidden = true; }

  /** Pins the bubble over its ghost's head on screen; false when the head is off the view. */
  function place(g) {
    const r = H.view.getBoundingClientRect(), o = H.root.getBoundingClientRect();
    const v = new THREE.Vector3(g.w.x, g.m.board.position.y + g.m.top + 0.3, g.w.z).project(H.camera);
    bubble.style.left = `${r.left - o.left + (v.x + 1) / 2 * r.width}px`;
    bubble.style.top = `${r.top - o.top + (1 - v.y) / 2 * r.height}px`;
    return v.z < 1 && Math.abs(v.x) < 0.9 && v.y < 0.9 && v.y > -0.6;
  }

  function fade() {
    clearTimeout(timed);
    timed = null;
    line.classList.remove('on', 'more');
  }

  /** The next thing a ghost says when tapped: a line, a story or a line with your name in it, from its shuffled deck. */
  function deal(g) {
    if (!g.deck.length) g.deck = shuffled([...g.def.lines.map(l => [l]), ...g.def.named.map(l => [l]), ...g.def.stories]);
    return g.deck.shift();
  }

  function face(g, partner) {
    g.w.flip = partner.x > g.w.x;
    g.hopUntil = performance.now() + 500;
    playCry(g.def.id);
  }

  function start(g, partner) {
    if (talking?.g === g) return sayNext();
    hush();
    unblurt();
    talking = { g, lines: deal(g), i: -1 };
    face(g, partner);
    sayNext();
  }

  function sayNext() {
    if (!talking) return;
    talking.i++;
    if (talking.i >= talking.lines.length) return hush();
    if (talking.i) playSound('select');
    show(talking.g, talking.lines[talking.i], { more: true });
  }

  /** The speech window put away, its ghost free to wander again. True if it was a tapped talk. */
  function hush() {
    if (!talking) return false;
    talking = null;
    fade();
    return true;
  }

  /** The ghost whose turn it is sets off along its beat, to the far end or back. True if it has one. */
  function stroll(g) {
    if (!g.beat) return false;
    g.toEnd = headTo(g.beat, g.w.tile, g.toEnd);
    g.w.path = beatPath(g.beat, g.w.tile, g.toEnd);
    return g.w.path.length > 0;
  }

  function step(g, dt, now) {
    const r = stepBeat(g.w, dt, g.def.speed, H.tileX, H.tileZ, (t) => H.busy ? H.busy(t, g) : holdsTile(ghosts, t, g));
    if (r === 'blocked' && g.w.waited > WAIT) { g.w.path = []; g.w.waited = 0; }   // turns back on its next turn
    if (!g.w.path.length) nextWalk = now + between(PAUSE);
  }

  return {
    boards: () => ghosts.map(g => g.m.board),

    /** Whether a ghost stands on `t` or is stepping onto it (`but` aside). */
    holds: (t, but) => holdsTile(ghosts, t, but),

    /** Whether `t` is a ghost's spot or on its beat, for others to keep a tile away from. */
    claims: (t) => spots.some(s => s.tiles.some(o => same(o, t))),

    /** A tap on a ghost: it stops, faces your partner and talks. True if the tap was its. */
    tap(hit, partner) {
      const g = hit?.object.userData.who?.spook;
      if (!g) return false;
      start(g, partner);
      return true;
    },

    hush,

    tick(now, dt, { calm, quiet, partner }) {
      if (!quiet && now > nextWalk && ghosts.length && !ghosts.some(g => g.w.path.length)) {
        nextWalk = now + 1000;
        for (let k = 0; k < ghosts.length; k++) {
          const g = ghosts[turn++ % ghosts.length];
          if (talking?.g !== g && stroll(g)) break;
        }
      }
      for (const g of ghosts) {
        const w = g.w;
        if (talking?.g !== g && !quiet && w.path.length) step(g, dt, now);
        const t = now / 1000 + g.phase, moving = w.path.length > 0, mv = g.def.move;
        let y = 0;
        if (!calm) {
          if (g.hopUntil > now) y = Math.abs(Math.sin((g.hopUntil - now) / 500 * Math.PI * 2)) * 0.3;
          else if (mv === 'float') y = 0.35 + Math.sin(t * 2) * 0.12;
          else if (mv === 'hop') y = moving ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 3)) * 0.22 : Math.abs(Math.sin(t * 1.4)) * 0.04;
          else y = moving ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 4)) * 0.08 : Math.sin(t * 1.6) * 0.03 + 0.03;
        }
        if (talking?.g === g) w.flip = partner.x > w.x;
        g.m.group.position.set(w.x, 0, w.z);
        g.m.board.position.y = y;
        g.m.board.scale.x = w.flip ? -1 : 1;
        g.m.group.children[1].scale.setScalar(mv === 'float' ? 0.7 : 1);
        H.drawMon(g.m, w, dt);
      }

      if (bats) for (const b of bats) {
        const u = b.userData, a = u.at + now / 1000 * u.speed;
        b.position.set(H.bats.x + Math.cos(a) * u.r, u.y + Math.sin(now / 700 + u.at) * 0.3, H.bats.z + Math.sin(a) * u.r * 0.55);
        b.quaternion.copy(H.camera.quaternion);
        if (!calm) b.material = bats.mats[Math.floor((now + u.flap) / 110) % 2];
      }

      if (quiet) { hush(); unblurt(); if (line.classList.contains('on')) fade(); return; }
      if (quip && now > quip.until) unblurt();
      if (quip) bubble.hidden = !place(quip.g);
      if (!quip && !timed && !talking && now > nextQuip && ghosts.length) {
        nextQuip = now + 7000 + Math.random() * 9000;
        const g = ghosts[Math.floor(Math.random() * ghosts.length)];
        if (!g.quips.length) g.quips = shuffled(g.def.quips);
        blurt(g, g.quips.shift());
      }
    },

    dispose() {
      gone = true;
      fade();
      bubble.remove();
      for (const g of ghosts) { H.scene.remove(g.m.group); H.dispose(g.m.group); }
      if (bats) { for (const b of bats) H.scene.remove(b); bats.mats.forEach(m => { m.map.dispose(); m.emissiveMap.dispose(); m.dispose(); }); bats.geo.dispose(); }
      foot.remove();
    },
  };
}

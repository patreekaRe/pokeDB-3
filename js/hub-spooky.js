/* hub-spooky.js  -  the Clearing's Halloween guests (js/hub-3d.js asks for them in October): ghost Pokémon wandering
   about between the decorations, and bats circling the Ancient Tree. Now and then one blurts a short line in a little
   speech window over its head (.spook-bubble, the cream look of the Furniture store's, its tail pointing at who
   said it), and when tapped it speaks in that store's speech window over the bar (.mall-line in css/hub.css: its
   name on a tilted pink tag), a line or a whole story tapped through (js/data/spooky-lines.js). The
   first time the Clearing shows on a page load, one walks up to your partner and greets you by your nickname, and
   your name turns up among their lines after that. Nothing is saved. */

import { SPOOKS } from './data/spooky-lines.js';
import { batArt } from './hub-season.js';
import { playCry, playSound } from './audio.js';
import { trainerName } from './leaderboard.js';

const QUIP_MS = 4200;         // how long a line over a head stays
const GREET_MS = 6500;        // and the greeting
const PAUSE = [2500, 7000];   // a rest between strolls (ms)
const ROAM = 5;               // how far (tiles) a stroll goes at most

let greeted = false;          // once a page load

const shuffled = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
const between = ([a, b]) => a + Math.random() * (b - a);
const named = (line) => line.replaceAll('{name}', trainerName());

/** `H` lends the hub's pieces: THREE, scene, camera, root, tex, dispose, monBoard, drawMon, route, free, tileX, tileZ,
    PITCH, spawns (tiles to start on, one a ghost), bats ({ x, z }: what they circle). */
export function makeSpooks(H) {
  const { THREE } = H;
  const ghosts = [];
  let talking = null, timed = null, greeter = null, calmFrom = 0, nextQuip = performance.now() + 7000, bats = null, gone = false;

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

  SPOOKS.forEach(async (def, i) => {
    const m = await H.monBoard({ src: `assets/pokemon/${def.id}-front.gif`, name: def.name, cry: def.id }, false);
    if (gone) return H.dispose(m.group);
    m.board.rotation.x = -H.PITCH;
    const tile = H.spawns[i % H.spawns.length];
    const g = { def, m, w: { x: H.tileX(tile.x), z: H.tileZ(tile.y), tile, path: [], facing: 'front', flip: Math.random() < 0.5, hop: 0 },
      rest: performance.now() + between(PAUSE), deck: [], quips: shuffled(def.quips), phase: Math.random() * 6 };
    m.board.userData.who = { mon: m, w: g.w, spook: g };
    H.scene.add(m.group);
    ghosts.push(g);
  });

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
    g.w.path = [];
    g.w.flip = partner.x > g.w.x;
    g.hopUntil = performance.now() + 500;
    playCry(g.def.id);
  }

  function start(g, partner) {
    if (talking?.g === g) return sayNext();
    hush();
    unblurt();
    if (greeter?.g === g) greeter = null;
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
    talking.g.rest = performance.now() + 1500;
    talking = null;
    fade();
    return true;
  }

  /** The greeting: the ghost nearest your partner heads for a free tile beside it, then says hello by name. */
  function startGreet(partner, now) {
    greeted = true;
    const near = (g) => Math.hypot(g.w.x - partner.x, g.w.z - partner.z);
    const g = [...ghosts].sort((a, b) => near(a) - near(b))[0];
    let best = null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
      const to = { x: partner.tile.x + dx, y: partner.tile.y + dy };
      if (!H.free(to)) continue;
      const path = to.x === g.w.tile.x && to.y === g.w.tile.y ? [] : H.route(g.w.tile, to);
      const end = path.at(-1) ?? g.w.tile;
      if (end.x !== to.x || end.y !== to.y) continue;
      if (!best || path.length < best.length) best = path;
    }
    g.w.path = best || [];
    greeter = { g, until: now + 7000 };
  }

  function greet(partner) {
    const { g } = greeter;
    greeter = null;
    face(g, partner);
    g.rest = performance.now() + GREET_MS;
    g.greetedAt = performance.now();
    show(g, g.def.greets[Math.floor(Math.random() * g.def.greets.length)], { ms: GREET_MS });
  }

  function stroll(g, partner) {
    const { tile } = g.w;
    for (let tries = 0; tries < 12; tries++) {
      const to = { x: tile.x + Math.round((Math.random() * 2 - 1) * ROAM), y: tile.y + Math.round((Math.random() * 2 - 1) * ROAM) };
      if (!H.free(to) || (to.x === partner.tile.x && to.y === partner.tile.y) || ghosts.some(o => o !== g && o.w.tile.x === to.x && o.w.tile.y === to.y)) continue;
      const path = H.route(tile, to);
      if (path.length > 1) { g.w.path = path; return; }
    }
    g.rest = performance.now() + between(PAUSE);
  }

  function step(g, dt, now) {
    const w = g.w, next = w.path[0];
    if (!next) return;
    const tx = H.tileX(next.x), tz = H.tileZ(next.y), dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz), move = dt / 1000 * g.def.speed * (greeter?.g === g ? 1.5 : 1);
    if (Math.abs(dx) > 0.01) w.flip = dx > 0;
    if (d <= move) { w.x = tx; w.z = tz; w.tile = next; w.path.shift(); if (!w.path.length) g.rest = now + between(PAUSE); }
    else { w.x += dx / d * move; w.z += dz / d * move; }
    w.hop += dt;
  }

  return {
    boards: () => ghosts.map(g => g.m.board),

    /** A tap on a ghost: it stops, faces your partner and talks. True if the tap was its. */
    tap(hit, partner) {
      const g = hit?.object.userData.who?.spook;
      if (!g) return false;
      start(g, partner);
      return true;
    },

    hush,

    tick(now, dt, { calm, quiet, partner }) {
      for (const g of ghosts) {
        const w = g.w;
        if (talking?.g !== g && !quiet) {
          if (w.path.length) step(g, dt, now);
          else if (greeter?.g === g) greet(partner);
          else if (now > g.rest) stroll(g, partner);
        }
        const t = now / 1000 + g.phase, moving = w.path.length > 0, mv = g.def.move;
        let y = 0;
        if (!calm) {
          if (g.hopUntil > now) y = Math.abs(Math.sin((g.hopUntil - now) / 500 * Math.PI * 2)) * 0.3;
          else if (mv === 'float') y = 0.35 + Math.sin(t * 2) * 0.12;
          else if (mv === 'hop') y = moving ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 3)) * 0.22 : Math.abs(Math.sin(t * 1.4)) * 0.04;
          else y = moving ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 4)) * 0.08 : Math.sin(t * 1.6) * 0.03 + 0.03;
        }
        if (talking?.g === g || now - (g.greetedAt || -1e9) < GREET_MS) w.flip = partner.x > w.x;
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

      if (quiet) { calmFrom = 0; hush(); unblurt(); if (line.classList.contains('on')) fade(); return; }
      if (quip && now > quip.until) unblurt();
      if (quip) bubble.hidden = !place(quip.g);
      calmFrom ||= now;
      if (greeter && now > greeter.until) greet(partner);
      if (!greeted && ghosts.length === SPOOKS.length && now - calmFrom > 900) startGreet(partner, now);
      if (!quip && !timed && !talking && !greeter && greeted && now > nextQuip && ghosts.length) {
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

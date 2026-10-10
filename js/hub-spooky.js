/* hub-spooky.js  -  the Clearing's Halloween guests (js/hub-3d.js asks for them in October): ghost Pokémon wandering
   about between the decorations, now and then floating a line over their heads, and telling a line or a whole story
   in the cream speech window when tapped (js/data/spooky-lines.js), and bats circling the Ancient Tree.
   Nothing is saved. */

import { SPOOKS } from './data/spooky-lines.js';
import { batArt } from './hub-season.js';
import { playCry, playSound } from './audio.js';

const QUIP_MS = 4200;         // how long a floated line stays
const PAUSE = [2500, 7000];   // a rest between strolls (ms)
const ROAM = 5;               // how far (tiles) a stroll goes at most

const shuffled = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
const between = ([a, b]) => a + Math.random() * (b - a);

/** `H` lends the hub's pieces: THREE, scene, camera, root, view, tex, monBoard, drawMon, route, free, tileX, tileZ,
    PITCH, spawns (tiles to start on, one a ghost), bats ({ x, z }: what they circle). */
export function makeSpooks(H) {
  const { THREE } = H;
  const ghosts = [];
  let talking = null, nextQuip = performance.now() + 5000, bats = null, gone = false;

  const bubble = document.createElement('div');
  bubble.className = 'spook-bubble';
  bubble.hidden = true;
  const talk = document.createElement('p');
  talk.className = 'b3-talk spook-talk';
  talk.hidden = true;
  talk.setAttribute('aria-live', 'polite');
  talk.innerHTML = '<b></b><span></span><i aria-hidden="true"></i>';
  H.root.append(bubble, talk);
  talk.addEventListener('click', (e) => { e.stopPropagation(); sayNext(); });

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

  /** The next thing a ghost says: a line or a story, dealt from its shuffled deck. */
  function deal(g) {
    if (!g.deck.length) g.deck = shuffled([...g.def.lines.map(l => [l]), ...g.def.stories]);
    return g.deck.shift();
  }

  function start(g, partner) {
    if (talking?.g === g) return sayNext();
    hush();
    talking = { g, lines: deal(g), i: -1 };
    g.w.path = [];
    g.w.flip = partner.x > g.w.x;
    g.hopUntil = performance.now() + 500;
    bubble.hidden = true;
    const [light, ink] = g.def.tag;
    const name = talk.querySelector('b');
    name.textContent = g.def.name;
    name.style.background = light; name.style.color = ink; name.style.boxShadow = `0 2px 0 ${ink}55`;
    playCry(g.def.id);
    sayNext();
  }

  function sayNext() {
    if (!talking) return;
    talking.i++;
    if (talking.i >= talking.lines.length) return hush();
    if (talking.i) playSound('select');
    talk.querySelector('span').textContent = talking.lines[talking.i];
    talk.hidden = false;
    talk.classList.remove('b3-say'); void talk.offsetWidth; talk.classList.add('b3-say');
  }

  /** The speech window put away, its ghost free to wander again. */
  function hush() {
    if (!talking) return false;
    talking.g.rest = performance.now() + 1500;
    talking = null;
    talk.hidden = true;
    return true;
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
    const tx = H.tileX(next.x), tz = H.tileZ(next.y), dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz), move = dt / 1000 * g.def.speed;
    if (Math.abs(dx) > 0.01) w.flip = dx > 0;
    if (d <= move) { w.x = tx; w.z = tz; w.tile = next; w.path.shift(); if (!w.path.length) g.rest = now + between(PAUSE); }
    else { w.x += dx / d * move; w.z += dz / d * move; }
    w.hop += dt;
  }

  function place(el, g, lift) {
    const r = H.view.getBoundingClientRect(), o = H.root.getBoundingClientRect();
    const v = new THREE.Vector3(g.w.x, g.m.top + lift, g.w.z).project(H.camera);
    el.style.left = `${r.left - o.left + (v.x + 1) / 2 * r.width}px`;
    el.style.top = `${r.top - o.top + (1 - v.y) / 2 * r.height}px`;
    return v.z < 1 && Math.abs(v.x) < 0.95 && v.y < 0.95 && v.y > -0.6;
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

      if (quiet) { bubble.hidden = true; hush(); return; }
      if (bubble.g && now > bubble.until) { bubble.hidden = true; bubble.g = null; }
      if (!bubble.g && now > nextQuip && ghosts.length && !talking) {
        nextQuip = now + 6000 + Math.random() * 8000;
        const g = ghosts[Math.floor(Math.random() * ghosts.length)];
        if (!g.quips.length) g.quips = shuffled(g.def.quips);
        bubble.textContent = g.quips.shift();
        bubble.g = g; bubble.until = now + QUIP_MS;
        bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      }
      if (bubble.g) bubble.hidden = !place(bubble, bubble.g, 0.25);
    },

    dispose() {
      gone = true;
      for (const g of ghosts) { H.scene.remove(g.m.group); H.dispose(g.m.group); }
      if (bats) { for (const b of bats) H.scene.remove(b); bats.mats.forEach(m => { m.map.dispose(); m.emissiveMap.dispose(); m.dispose(); }); bats.geo.dispose(); }
      bubble.remove(); talk.remove();
    },
  };
}

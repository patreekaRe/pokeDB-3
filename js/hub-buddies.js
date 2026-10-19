/* hub-buddies.js  -  the trainers on your list, out in the Clearing's Trainer Plaza as their walking buddies (the user's
   ask, 2026-10-18): up to four, the ones on most lately, from their graves/<uid> doc (js/graves.js's plazaBuddies()).
   Each stands about on the paved plaza with their trainer's name over its head on a tag in their card's colour, one
   strolling at a time like the Halloween ghosts (js/hub-spooky.js, whose speech window this borrows); a tap and it
   stops, hops, cries and says whose it is, when they last played and where their last run ended (their grave's on that
   map), and past the last line their Trainer Card opens in the Trainers app (the user's ask, 2026-10-18). Billboards
   in the Clearing's own scene: no renderer or GL context of their own, their GIF frames on CPU canvases. */

import { playCry, playSound } from './audio.js';

const PAUSE = [2500, 6000];   // the quiet between one buddy's stroll and the next's (ms)
const ROAM = 3;               // how far (tiles) a stroll goes at most
const SPEED = 1.4;            // tiles a second
const TIER = { green: ['#5ad08a', '#1e6a48'], bronze: ['#e09a5a', '#7a3a14'], silver: ['#b8c4d8', '#4a5670'], gold: ['#f0c840', '#7a5208'], violet: ['#b07af0', '#3e1a7a'] };
const FONT = '"PokeDB Pixel", "Press Start 2P", monospace';

const between = ([a, b]) => a + Math.random() * (b - a);

/** A name tag over a buddy's head: their trainer's name in white on a dark plate rimmed in their card's colour (white on
    the card colour itself read too faintly on gold and silver, 2026-10-18). Drawn at 4x and sized to the name, so it
    stays crisp and at least 12px tall on a phone. */
function nameTag(THREE, name, tier) {
  const H = 128, PAD = 30, RIM = 8, PX = 0.4 / H;
  const g = document.createElement('canvas').getContext('2d');
  let size = 64;
  do { g.font = `${size}px ${FONT}`; } while (g.measureText(name).width > 560 && --size > 36);
  const W = Math.ceil(Math.max(g.measureText(name).width + PAD * 2, H * 2));
  Object.assign(g.canvas, { width: W, height: H });
  const [hi, lo] = TIER[tier] ?? TIER.green;
  g.fillStyle = hi; g.beginPath(); g.roundRect(0, 0, W, H, 40); g.fill();
  g.fillStyle = 'rgba(16, 20, 32, 0.92)'; g.beginPath(); g.roundRect(RIM, RIM, W - RIM * 2, H - RIM * 2, 32); g.fill();
  g.font = `${size}px ${FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = lo; g.strokeText(name, W / 2, H / 2 + 3);
  g.fillStyle = '#fff'; g.fillText(name, W / 2, H / 2 + 3);
  const t = new THREE.CanvasTexture(g.canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W * PX, H * PX), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  m.raycast = () => {};
  m.renderOrder = 2;
  return m;
}

/** `H` lends the hub's pieces (THREE, scene, camera, root, monBoard, drawMon, dispose, route, free, byDoor, tileX, tileZ,
    PITCH, onCard(uid) to open a trainer's page, centre and reach: the plaza's middle tile and how far from it they may
    stand, spawns, and others(c) for a tile someone else stands on). `friends` from plazaBuddies(): { uid, name, tier, mon: { src, name, masked, cry }, talk }. */
export function makeBuddies(H, friends) {
  const { THREE } = H;
  const pals = [];
  let turn = 0, nextWalk = performance.now() + between(PAUSE), talking = null, timed = null, gone = false;

  const foot = document.createElement('div');
  foot.className = 'mall-foot spook-foot buddy-foot';
  foot.innerHTML = '<p class="mall-line talk spook-line" aria-live="polite"><b class="mall-who"></b><span></span><i aria-hidden="true"></i></p>';
  H.root.append(foot);
  const line = foot.firstChild;
  line.addEventListener('click', (e) => { e.stopPropagation(); if (talking) sayNext(); else fade(); });

  const taken = (c, p) => pals.some(o => o !== p && o.w.tile.x === c.x && o.w.tile.y === c.y);
  const near = (c) => Math.hypot(c.x - H.centre.x, c.y - H.centre.y) <= H.reach;
  const standable = (c, p) => near(c) && H.free(c) && !H.byDoor(c) && !taken(c, p) && !H.others?.(c);
  function standAt(c, p) {
    for (let r = 0; r < 6; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const t = { x: c.x + dx, y: c.y + dy };
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && standable(t, p)) return t;
        }
    return c;
  }

  friends.forEach(async (fr, i) => {
    const m = await H.monBoard({ src: fr.mon.src, name: fr.mon.name, cry: fr.mon.cry }, false);
    if (gone) return H.dispose(m.group);
    m.board.rotation.x = -H.PITCH;
    if (fr.mon.masked) m.board.material.color.set('#000');   // a Pokémon you haven't met stays a silhouette
    const tag = nameTag(THREE, fr.name, fr.tier);
    tag.rotation.x = -H.PITCH;
    tag.position.y = m.top + 0.4;
    m.group.add(tag);
    const p = { fr, m, tag, phase: Math.random() * 6, w: { x: 0, z: 0, tile: null, path: [], facing: 'front', flip: Math.random() < 0.5, hop: 0 } };
    p.w.tile = standAt(H.spawns[i % H.spawns.length], p);
    p.w.x = H.tileX(p.w.tile.x); p.w.z = H.tileZ(p.w.tile.y);
    m.board.userData.who = { mon: m, w: p.w, buddy: p };
    H.scene.add(m.group);
    pals.push(p);
  });

  function show(p, text, more) {
    line.firstChild.textContent = `${p.fr.name}'s ${p.fr.mon.name}`;
    line.children[1].textContent = text;
    line.classList.toggle('more', more);
    line.classList.add('on');
    clearTimeout(timed);
    timed = more ? null : setTimeout(fade, 5000);
  }

  function fade() {
    clearTimeout(timed);
    timed = null;
    line.classList.remove('on', 'more');
  }

  function sayNext() {
    if (!talking) return;
    talking.i++;
    const lines = talking.p.fr.talk;
    if (talking.i >= lines.length) { const { uid } = talking.p.fr; hush(); return H.onCard?.(uid); }
    if (talking.i) playSound('select');
    show(talking.p, lines[talking.i], true);
  }

  /** The speech window put away, its buddy free to wander again. True if it was a tapped talk. */
  function hush() {
    if (!talking) return false;
    talking = null;
    fade();
    return true;
  }

  function stroll(p, partner) {
    const { tile } = p.w;
    for (let tries = 0; tries < 16; tries++) {
      const to = { x: tile.x + Math.round((Math.random() * 2 - 1) * ROAM), y: tile.y + Math.round((Math.random() * 2 - 1) * ROAM) };
      if (!standable(to, p) || (to.x === partner.tile.x && to.y === partner.tile.y)) continue;
      const path = H.route(tile, to);
      const end = path.at(-1);
      if (path.length > 1 && end.x === to.x && end.y === to.y && path.every(near)) { p.w.path = path; return true; }
    }
    return false;
  }

  function step(p, dt, now) {
    const w = p.w, next = w.path[0];
    if (!next) return;
    const tx = H.tileX(next.x), tz = H.tileZ(next.y), dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz), move = dt / 1000 * SPEED;
    if (Math.abs(dx) > 0.01) w.flip = dx > 0;
    if (d <= move) { w.x = tx; w.z = tz; w.tile = next; w.path.shift(); if (!w.path.length) nextWalk = now + between(PAUSE); }
    else { w.x += dx / d * move; w.z += dz / d * move; }
    w.hop += dt;
  }

  return {
    boards: () => pals.map(p => p.m.board),

    /** Tiles a buddy stands on or is walking to, for the others to keep off. */
    holds: (c) => pals.some(p => (p.w.tile.x === c.x && p.w.tile.y === c.y) || p.w.path.some(t => t.x === c.x && t.y === c.y)),

    /** A tap on a buddy: it stops, faces your partner, cries and talks. True if the tap was its. */
    tap(hit, partner) {
      const p = hit?.object.userData.who?.buddy;
      if (!p) return false;
      if (talking?.p === p) { sayNext(); return true; }
      talking = { p, i: -1 };
      p.w.path = [];
      p.w.flip = partner.x > p.w.x;
      p.hopUntil = performance.now() + 500;
      if (!p.fr.mon.masked) playCry(p.fr.mon.cry);
      sayNext();
      return true;
    },

    hush,

    tick(now, dt, { calm, quiet, partner }) {
      if (!quiet && now > nextWalk && pals.length && !pals.some(p => p.w.path.length)) {
        nextWalk = now + 1000;
        for (let k = 0; k < pals.length; k++) {
          const p = pals[turn++ % pals.length];
          if (talking?.p !== p && stroll(p, partner)) break;
        }
      }
      for (const p of pals) {
        const w = p.w, t = now / 1000 + p.phase, moving = w.path.length > 0;
        if (talking?.p !== p && !quiet && moving) step(p, dt, now);
        let y = 0;
        if (!calm) {
          if (p.hopUntil > now) y = Math.abs(Math.sin((p.hopUntil - now) / 500 * Math.PI * 2)) * 0.3;
          else y = moving ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 4)) * 0.08 : Math.sin(t * 1.6) * 0.03 + 0.03;
        }
        if (talking?.p === p) w.flip = partner.x > w.x;
        p.m.group.position.set(w.x, 0, w.z);
        p.m.board.position.y = y;
        p.m.board.scale.x = w.flip ? -1 : 1;
        p.tag.position.y = p.m.top + 0.4 + y;
        H.drawMon(p.m, w, dt);
      }
      if (quiet && line.classList.contains('on')) { hush(); fade(); }
    },

    dispose() {
      gone = true;
      fade();
      for (const p of pals) { H.scene.remove(p.m.group); H.dispose(p.m.group); }
      pals.length = 0;
      foot.remove();
    },
  };
}

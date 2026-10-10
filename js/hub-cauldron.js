/* hub-cauldron.js  -  Halloween's witch's cauldron in the Clearing as a real 3D model (the user's ask, 2026-10-10: the
   painted board looked flat): an iron pot on three legs over a log fire in a ring of stones, its brew swirling and
   bubbling, steam curling off it, a ladle stirring by itself. A tap plays the next of TRICKS in turn, all six before
   any comes round again: a burst of bubbles, the brew changing colour in a puff of smoke, a fountain of sparks,
   boiling over, a little ghost rising out to circle it, smoke rings. The fire and brew light the ground after dark
   (`lights`, handed to js/hub-3d.js's lamps, which sets them by the hour; tick() only flickers them). */
import { playSound } from './audio.js';

let T;
const BREWS = ['#7cff5a', '#b45cff', '#ff9a2a', '#4ad8ff', '#ff5ab4'];
const SURFACE = 0.93, RIM = 0.43;
const TRICKS = ['bubbles', 'colour', 'sparks', 'boil', 'ghost', 'rings'];

function swirlArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  r.addColorStop(0, '#ffffff'); r.addColorStop(0.65, '#cfcfcf'); r.addColorStop(1, '#7c7c7c');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  g.lineCap = 'round';
  for (const [shade, width, off] of [['rgba(70,70,70,0.35)', 10, 1.05], ['rgba(255,255,255,0.6)', 6, 0]]) {
    g.strokeStyle = shade;
    for (let arm = 0; arm < 3; arm++) {
      g.lineWidth = width - arm;
      g.beginPath();
      for (let i = 0; i <= 64; i++) {
        const t = i / 64, a = off + arm * 2.094 + t * 5.2, rr = 10 + t * 108;
        const x = 128 + Math.cos(a) * rr, y = 128 + Math.sin(a) * rr;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    }
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

function softArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

const ease = (t) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const rand = (a, b) => a + Math.random() * (b - a);

/** The cauldron, its feet at the origin. `group` goes in the scene, `hit` is what a tap's ray tests, `lights` join the
    hub's lamps; tick(now, dt, calm) each frame, tap(now) when it is tapped (`want` names a trick, for a test page). */
export function makeCauldron(THREE) {
  T = THREE;
  const root = new T.Group(), body = new T.Group();
  root.add(body);
  const add = (geo, m, parent = body, shadow = true) => {
    const mesh = new T.Mesh(geo, m);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const iron = new T.MeshStandardMaterial({ color: '#3a3a48', roughness: 0.42, metalness: 0.35 });
  const ironDark = new T.MeshStandardMaterial({ color: '#22222c', roughness: 0.5, metalness: 0.3 });
  const wood = new T.MeshStandardMaterial({ color: '#6e4526', roughness: 0.85 });
  const char = new T.MeshStandardMaterial({ color: '#2c1c14', roughness: 0.9, emissive: '#ff5a10', emissiveIntensity: 0.08 });
  const stone = new T.MeshStandardMaterial({ color: '#80808c', roughness: 0.95, flatShading: true });

  // the fire: three logs crossed, a ring of stones, flames licking up round the pot's belly
  const fire = new T.Group();
  root.add(fire);
  for (let i = 0; i < 3; i++) {
    const turn = new T.Group();
    turn.rotation.y = 0.3 + i * Math.PI / 3;
    turn.position.y = 0.07 + i * 0.03;
    fire.add(turn);
    const log = add(new T.CylinderGeometry(0.06, 0.07, 0.82, 10), i === 1 ? char : wood, turn);
    log.rotation.z = Math.PI / 2;
  }
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2 + next() * 0.3, s = 0.08 + next() * 0.05;
    const st = add(new T.DodecahedronGeometry(s, 0), stone, fire);
    st.position.set(Math.cos(a) * 0.64, s * 0.55, Math.sin(a) * 0.64);
    st.scale.y = 0.7;
    st.rotation.set(next() * 3, next() * 3, 0);
  }
  const flameGeo = new T.SphereGeometry(0.1, 14, 10);
  flameGeo.translate(0, 0.1, 0);
  const flameMat = (colour, opacity) => new T.MeshBasicMaterial({ color: colour, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false });
  const outer = flameMat('#ff6a1a', 0.85), inner = flameMat('#ffd860', 0.9);
  const flames = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + 0.4, r = i % 2 ? 0.34 : 0.22;
    for (const [m, k] of [[outer, 1], [inner, 0.55]]) {
      const f = add(flameGeo, m, fire, false);
      f.position.set(Math.cos(a) * r, 0.08, Math.sin(a) * r);
      flames.push({ f, k: k * (i % 2 ? 0.9 : 1.15), phase: i * 1.7 + k * 3, rate: 0.011 + i * 0.0013 });
    }
  }

  // the pot: a lathed iron belly with a raised band and a thick rim, three splayed legs, a ring handle each side
  const prof = [[0, 0.3], [0.2, 0.31], [0.36, 0.37], [0.47, 0.48], [0.52, 0.6], [0.51, 0.73], [0.47, 0.85], [0.43, 0.94], [0.44, 0.99]]
    .map(([r, y]) => new T.Vector2(r, y));
  const pot = add(new T.LatheGeometry(prof, 56), iron);
  pot.material = iron.clone();
  pot.material.side = T.DoubleSide;
  const band = add(new T.TorusGeometry(0.522, 0.022, 10, 56), ironDark);
  band.rotation.x = Math.PI / 2; band.position.y = 0.62;
  const rim = add(new T.TorusGeometry(RIM + 0.012, 0.042, 12, 56), ironDark);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.99;
  for (let i = 0; i < 3; i++) {
    const turn = new T.Group();
    turn.rotation.y = i * Math.PI * 2 / 3 + Math.PI / 2;
    body.add(turn);
    const leg = add(new T.CylinderGeometry(0.045, 0.03, 0.38, 10), ironDark, turn);
    leg.position.set(0.34, 0.19, 0); leg.rotation.z = 0.22;
    const foot = add(new T.SphereGeometry(0.05, 10, 8), ironDark, turn);
    foot.position.set(0.38, 0.03, 0); foot.scale.y = 0.6;
  }
  for (const x of [-1, 1]) {
    const ring = add(new T.TorusGeometry(0.09, 0.018, 8, 24), ironDark);
    ring.position.set(x * 0.535, 0.84, 0); ring.rotation.y = Math.PI / 2;
    const lug = add(new T.SphereGeometry(0.04, 10, 8), ironDark);
    lug.position.set(x * 0.5, 0.92, 0);
  }

  // the brew: a swirled disc turning slowly, two drips over the lip, a glossy look shared with its bubbles
  let colour = new T.Color(BREWS[0]);
  const brewMat = new T.MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: 0.65, roughness: 0.2, map: swirlArt() });
  brewMat.emissiveMap = brewMat.map;
  const gloss = new T.MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: 0.45, roughness: 0.12, transparent: true, opacity: 0.88 });
  const swirl = new T.Group();
  swirl.position.y = SURFACE;
  body.add(swirl);
  const brew = add(new T.CircleGeometry(RIM, 56), brewMat, swirl, false);
  brew.rotation.x = -Math.PI / 2;
  const drips = [0.7, 2.5].map((a, i) => {
    const lip = add(new T.SphereGeometry(0.05, 12, 10), gloss, body, false);   // the brew lapping over the rim
    lip.position.set(Math.cos(a) * 0.46, 1.03, Math.sin(a) * 0.46);
    lip.rotation.y = -a;
    lip.scale.set(1.2, 0.45, 1.6);
    const d = add(new T.SphereGeometry(0.045, 12, 10), gloss, body, false);
    d.position.set(Math.cos(a) * 0.49, 0.94, Math.sin(a) * 0.49);
    d.rotation.y = -a;
    d.userData.base = 1.5 + i * 0.5;
    d.scale.set(0.6, d.userData.base, 0.95);
    return d;
  });

  // the ladle, leaning in and going round on its own
  const stir = new T.Group();
  body.add(stir);
  const stick = add(new T.CylinderGeometry(0.022, 0.03, 1.02, 10), wood, stir);
  stick.position.set(0.17, SURFACE + 0.28, 0); stick.rotation.z = -0.38;
  const knob = add(new T.SphereGeometry(0.04, 10, 8), wood, stir);
  knob.position.set(0.36, SURFACE + 0.76, 0);

  // what a tap's ray tests: an unseen drum round it all
  const hit = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 1.4, 12), new T.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.7;
  hit.userData.cauldron = true;
  root.add(hit);
  root.traverse(o => { if (o.isMesh && o !== hit) o.raycast = () => {}; });

  const fireLight = new T.PointLight('#ff8a30', 0, 3.5, 1.8);
  fireLight.position.set(0, 0.35, 0.45);
  fireLight.userData.k = 0.5;
  const brewLight = new T.PointLight(colour, 0, 4.5, 1.6);
  brewLight.position.set(0, 1.25, 0.6);
  brewLight.userData.k = 0.6;
  root.add(fireLight, brewLight);

  /* ---------- particles, pooled ---------- */

  const soft = softArt(), parts = [], pools = { bubble: [], puff: [], spark: [], ring: [] };
  const bubbleGeo = new T.SphereGeometry(1, 16, 12), ringGeo = new T.TorusGeometry(1, 0.22, 10, 32);
  function make(kind) {
    let o;
    if (kind === 'bubble') o = new T.Mesh(bubbleGeo, gloss);
    else if (kind === 'ring') { o = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ transparent: true, depthWrite: false })); o.rotation.x = Math.PI / 2; }
    else o = new T.Sprite(new T.SpriteMaterial({ map: soft, transparent: true, depthWrite: false, blending: kind === 'spark' ? T.AdditiveBlending : T.NormalBlending }));
    o.raycast = () => {};
    return { kind, o, pos: new T.Vector3(), vel: new T.Vector3() };
  }
  function emit(kind, { at, vel = [0, 0, 0], life = 1, size = 0.1, grow = 0, gravity = 0, drag = 0, alpha = 1, tint, wobble = 0, pop = false }) {
    const p = pools[kind].pop() || make(kind);
    Object.assign(p, { age: 0, life, size, grow, gravity, drag, alpha, wobble, pop, phase: Math.random() * 6 });
    p.pos.set(...at); p.vel.set(...vel);
    if (p.o.material !== gloss) p.o.material.color.set(tint || '#ffffff');
    p.o.position.copy(p.pos);
    p.o.scale.setScalar(0.0001);
    root.add(p.o);
    parts.push(p);
  }
  function liveParts(dt) {
    const s = dt / 1000;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += s;
      const t = p.age / p.life;
      if (t >= 1) {
        if (p.pop && sounds < 4) { sounds++; playSound('fx-pop'); }
        root.remove(p.o); pools[p.kind].push(p); parts.splice(i, 1);
        continue;
      }
      p.vel.y -= p.gravity * s;
      p.vel.multiplyScalar(Math.max(0, 1 - p.drag * s));
      p.pos.addScaledVector(p.vel, s);
      p.o.position.copy(p.pos);
      if (p.wobble) p.o.position.x += Math.sin(p.age * 9 + p.phase) * p.wobble;
      if (p.kind === 'bubble') p.o.scale.setScalar(p.size * Math.min(1, t / 0.18) * (t > 0.88 ? 1 + (t - 0.88) * 3 : 1));
      else if (p.kind === 'spark') { p.o.scale.setScalar(p.size * (1 - t * 0.6)); p.o.material.opacity = p.alpha * (1 - t * t); }
      else { p.o.scale.setScalar(p.size * (1 + p.grow * t)); p.o.material.opacity = p.alpha * Math.min(1, t * 6) * (1 - t); }
    }
  }
  const onBrew = (r = RIM * 0.8) => { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r; return [Math.cos(a) * d, level, Math.sin(a) * d]; };
  const pale = () => '#' + colour.clone().lerp(new T.Color('#ffffff'), 0.6).getHexString();

  /* ---------- the ghost that rises out of it ---------- */

  const ghost = new T.Group();
  {
    const sheet = new T.MeshStandardMaterial({ color: '#f4f6ff', emissive: '#b8c8ff', emissiveIntensity: 0.35, roughness: 0.6, transparent: true, opacity: 0.94 });
    const ink = new T.MeshBasicMaterial({ color: '#1a1424' });
    const head = new T.Mesh(new T.SphereGeometry(0.17, 20, 16), sheet);
    head.position.y = 0.16;
    const hem = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; hem.push(new T.Vector2(0.17 + t * t * 0.06, 0.16 - t * 0.26)); }
    const skirt = new T.Mesh(new T.LatheGeometry(hem, 48), sheet.clone());
    skirt.material.side = T.DoubleSide;
    const pos = skirt.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < 0.05) pos.setY(i, y - 0.04 * ((0.05 - y) / 0.15) * Math.sin(Math.atan2(pos.getZ(i), pos.getX(i)) * 6)); }
    skirt.geometry.computeVertexNormals();
    const eye = (x) => { const e = new T.Mesh(new T.SphereGeometry(0.032, 10, 8), ink); e.position.set(x, 0.2, 0.15); e.scale.set(0.8, 1.3, 0.5); return e; };
    const mouth = new T.Mesh(new T.SphereGeometry(0.03, 10, 8), ink);
    mouth.position.set(0, 0.12, 0.162); mouth.scale.set(1, 1.2, 0.4);
    ghost.add(head, skirt, eye(-0.06), eye(0.06), mouth);
    ghost.traverse(o => { o.raycast = () => {}; });
    ghost.visible = false;
    root.add(ghost);
  }

  /* ---------- state ---------- */

  let level = SURFACE, brewIx = 0, turn = 0, busy = 0, sounds = 0, soundAt = 0, flash = 0;
  let nextBubble = 0, nextSteam = 0, nextEmber = 0;
  let fade = null, boil = null, rising = null, rings = [], burst = [];
  const later = (ms, fn) => burst.push({ at: performance.now() + ms, fn });

  function setColour(c) {
    colour = c;
    for (const m of [brewMat, gloss]) { m.color.copy(c); m.emissive.copy(c); }
    brewLight.color.copy(c);
  }

  const DO = {
    bubbles(now) {
      for (let i = 0; i < 26; i++) later(i * 45, () => emit('bubble', { at: onBrew(), vel: [rand(-0.25, 0.25), rand(1.1, 2.1), rand(-0.25, 0.25)], life: rand(0.9, 1.5), size: rand(0.05, 0.12), drag: 0.6, wobble: 0.03, pop: true }));
      for (let i = 0; i < 6; i++) later(i * 120, () => playSound('fx-bubble'));
      return 1600;
    },
    colour(now) {
      brewIx = (brewIx + 1) % BREWS.length;
      const to = new T.Color(BREWS[brewIx]);
      fade = { from: colour.clone(), to, at: now };
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2;
        emit('puff', { at: [Math.cos(a) * 0.2, level + 0.05, Math.sin(a) * 0.2], vel: [Math.cos(a) * 0.9, rand(0.6, 1.3), Math.sin(a) * 0.9], life: rand(1.1, 1.6), size: 0.35, grow: 1.6, drag: 2, alpha: 0.75, tint: '#' + to.clone().lerp(new T.Color('#ffffff'), 0.4).getHexString() });
      }
      flash = 1;
      playSound('fx-whoosh'); later(150, () => playSound('fx-steam'));
      return 1400;
    },
    sparks(now) {
      for (let i = 0; i < 46; i++) later(i * 18, () => {
        const a = Math.random() * Math.PI * 2, out = rand(0.3, 1.1);
        emit('spark', { at: [0, level + 0.05, 0], vel: [Math.cos(a) * out, rand(2.6, 3.8), Math.sin(a) * out], life: rand(0.9, 1.4), size: rand(0.08, 0.16), gravity: 4.2, tint: i % 3 ? pale() : '#ffd860' });
      });
      flash = 0.8;
      playSound('fx-firework'); later(250, () => playSound('fx-crackle'));
      return 1500;
    },
    boil(now) {
      boil = { at: now };
      playSound('fx-steam'); for (let i = 0; i < 5; i++) later(200 + i * 160, () => playSound('fx-bubble'));
      return 3000;
    },
    ghost(now) {
      rising = { at: now };
      ghost.visible = true;
      playSound('fx-whoosh'); later(700, () => playSound('fx-squeak'));
      for (let i = 0; i < 8; i++) emit('bubble', { at: onBrew(0.2), vel: [rand(-0.5, 0.5), rand(0.6, 1.2), rand(-0.5, 0.5)], life: 0.6, size: rand(0.04, 0.08), gravity: 2, pop: i < 2 });
      return 3800;
    },
    rings(now) {
      for (let i = 0; i < 3; i++) later(i * 420, () => {
        emit('ring', { at: [0, level + 0.1, 0], vel: [0, 1.1, 0], life: 2, size: 0.18, grow: 2.4, drag: 0.4, alpha: 0.55, tint: '#' + colour.clone().lerp(new T.Color('#ffffff'), 0.35).getHexString() });
        playSound('fx-pop');
      });
      return 1600;
    },
  };

  /** A tap: the next trick in TRICKS' order; mid-trick, a handful of bubbles so a tap always does something. */
  function tap(now = performance.now(), want) {
    if (now < busy && !want) {
      for (let i = 0; i < 6; i++) emit('bubble', { at: onBrew(), vel: [0, rand(0.8, 1.4), 0], life: rand(0.6, 1), size: rand(0.04, 0.08), wobble: 0.02, pop: i < 1 });
      playSound('fx-bubble');
      return 'stir';
    }
    const trick = DO[want] ? want : TRICKS[turn++ % TRICKS.length];
    busy = now + DO[trick](now);
    return trick;
  }

  function flicker(l, f) {
    const base = l.intensity !== l.userData.set ? l.intensity : l.userData.base;   // setTime() just set a new level
    l.userData.base = base;
    l.intensity = l.userData.set = base * f;
  }

  function tick(now, dt, calm) {
    sounds = now - soundAt > 250 ? 0 : sounds;
    if (!sounds) soundAt = now;
    for (let i = burst.length - 1; i >= 0; i--) if (now >= burst[i].at) { const b = burst[i]; burst.splice(i, 1); b.fn(); }

    if (fade) {
      const t = Math.min(1, (now - fade.at) / 600);
      setColour(fade.from.clone().lerp(fade.to, ease(t)));
      if (t >= 1) fade = null;
    }
    let swell = 0;
    if (boil) {
      const t = (now - boil.at) / 3000;
      swell = t < 0.15 ? ease(t / 0.15) : t < 0.55 ? 1 : Math.max(0, 1 - ease((t - 0.55) / 0.45));
      if (t < 0.6 && Math.random() < dt / 40) emit('bubble', { at: onBrew(RIM * 0.95).map((v, i) => i === 1 ? level + 0.02 : v), vel: [0, rand(0.05, 0.2), 0], life: rand(0.8, 1.3), size: rand(0.07, 0.13), pop: Math.random() < 0.15 });
      if (t < 0.6 && Math.random() < dt / 90) emit('puff', { at: onBrew(), vel: [rand(-0.1, 0.1), rand(0.6, 0.9), rand(-0.1, 0.1)], life: 1.6, size: 0.25, grow: 2, alpha: 0.4, tint: pale() });
      if (t >= 1) boil = null;
    }
    level = SURFACE + swell * 0.07;
    swirl.position.y = level + (calm ? 0 : Math.sin(now / 700) * 0.006);
    drips.forEach((d, i) => { const k = d.userData.base * (1 + swell * 1.6) + (calm ? 0 : Math.sin(now / 900 + i * 2) * 0.15); d.scale.y = k; d.position.y = 1.03 - k * 0.045; });
    body.position.x = calm ? 0 : Math.sin(now * 0.07) * 0.018 * swell;
    body.position.z = calm ? 0 : Math.cos(now * 0.09) * 0.012 * swell;

    if (rising) {
      const t = (now - rising.at) / 3600;
      let x = 0, y, z = 0, s = 1;
      if (t < 0.22) { const k = ease(t / 0.22); y = 0.6 + k * 1.1; s = Math.min(1, t / 0.12); }
      else if (t < 0.8) { const k = (t - 0.22) / 0.58, a = k * Math.PI * 2 + Math.PI / 2; x = Math.cos(a) * 0.9 * Math.sin(k * Math.PI); z = Math.sin(a) * 0.6 * Math.sin(k * Math.PI); y = 1.7 + Math.sin(k * Math.PI * 4) * 0.12; }
      else { const k = ease(Math.min(1, (t - 0.8) / 0.2)); y = 1.7 - k * 1.2; s = 1 - Math.max(0, (t - 0.92) / 0.08); }
      ghost.position.set(x, y, z);
      ghost.scale.setScalar(Math.max(0.001, s));
      ghost.rotation.z = calm ? 0 : Math.sin(now / 160) * 0.12;
      if (t >= 1) {
        rising = null; ghost.visible = false;
        for (let i = 0; i < 8; i++) emit('bubble', { at: onBrew(0.25), vel: [rand(-0.6, 0.6), rand(0.8, 1.4), rand(-0.6, 0.6)], life: 0.7, size: rand(0.04, 0.08), gravity: 2.5 });
        playSound('fx-splash');
      }
    }

    if (!calm) {
      swirl.rotation.y -= dt * 0.00045;
      stir.rotation.y -= dt * 0.0011 * (1 + swell * 2);
      for (const { f, k, phase, rate } of flames) {
        const h = k * (1 + 0.28 * Math.sin(now * rate + phase) + 0.12 * Math.sin(now * rate * 2.7 + phase * 2));
        f.scale.set(k * 0.85, h * 2.4, k * 0.85);
      }
      if (now > nextBubble) { nextBubble = now + rand(180, 420); emit('bubble', { at: onBrew(), life: rand(0.5, 0.9), size: rand(0.025, 0.06) }); }
      if (now > nextSteam) { nextSteam = now + rand(350, 650); emit('puff', { at: onBrew(0.3).map((v, i) => i === 1 ? level + 0.1 : v), vel: [rand(-0.05, 0.1), rand(0.35, 0.55), rand(-0.05, 0.05)], life: rand(2.2, 3), size: 0.18, grow: 2.2, alpha: 0.28, tint: pale(), wobble: 0.04 }); }
      if (now > nextEmber) { nextEmber = now + rand(250, 700); const a = Math.random() * Math.PI * 2; emit('spark', { at: [Math.cos(a) * 0.4, 0.2, Math.sin(a) * 0.4], vel: [rand(-0.1, 0.1), rand(0.5, 0.9), rand(-0.1, 0.1)], life: rand(0.8, 1.4), size: 0.05, tint: '#ffa040', wobble: 0.03 }); }
    }
    liveParts(dt);

    flash = Math.max(0, flash - dt / 500);
    flicker(fireLight, calm ? 1 : 0.82 + 0.18 * Math.sin(now * 0.017) * Math.sin(now * 0.031));
    flicker(brewLight, 1 + (calm ? 0 : flash * 2.5 + swell * 0.6));
  }

  return { group: root, hit, lights: [fireLight, brewLight], tick, tap };
}

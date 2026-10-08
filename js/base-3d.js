/* base-3d.js  -  the HD-2D pilot behind ?3d (roadmap idea "Walkable 3D, Octopath's HD-2D"): the Secret Base's room built
   as a little 3D diorama in Three.js, so the user can judge the look on a phone before anything more is funded. The same
   layout and pixel paintings as js/secret-base.js: the floor and walls are pixel-textured blocks, flat pieces low blocks
   with their painting on top, the bookshelf a block, the rest standing billboards; your partner's GIF is split into
   frames (ImageDecoder) and walks where you tap. A fixed tilted camera follows it; the scene renders small and is
   scaled up with crisp pixels, then tilt-shift and bloom are laid on in one pass. The light follows js/daytime.js. */

import { getSave } from './storage.js';
import { timeOfDay } from './daytime.js';
import { calmFx } from './prefs.js';
import { playSound, playCry } from './audio.js';
import { partner } from './trainercard.js';
import { spriteFit } from './data/sprite-fit.js';
import { PIECES, T, WALL, COLS, ROWS, footprint, loadBase, roomArt, pieceArt } from './secret-base.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const PX = 1 / T;          // furniture: one painted pixel
const MON_PX = 1 / 32;     // Pokémon GIFs are drawn at twice the furniture's detail
const WALL_H = WALL / T;   // 3 tiles, as in the 2D room

// flat pieces stand this tall, their sides this colour
const FLAT = { rug: [0.04, '#8e342e'], bed: [0.5, '#5a3a1e'], table: [0.55, '#6e4626'], cushion: [0.22, '#202028'] };
const GLOW = { window: ['#8cc8f4', '#f4b8a0', '#e8885a', '#2a3a6a'], lamp: ['#f4dc88', '#fff4c0'] };

const LIGHT = {
  dawn: { sky: '#ffd0b8', ground: '#5a4058', amb: 1.4, sun: '#ffb48a', sunI: 2.2, at: [-9, 5, 6], lamp: 0.8, win: 0.9, shaft: 0.3, motes: 0.7, bg: '#2a2036' },
  day: { sky: '#ffffff', ground: '#7a6a5a', amb: 1.6, sun: '#fff2dc', sunI: 2.6, at: [-5, 12, 7], lamp: 0, win: 1.1, shaft: 0.4, motes: 1, bg: '#1d2440' },
  dusk: { sky: '#f4a070', ground: '#4a2e44', amb: 1.2, sun: '#ff8a4a', sunI: 2.2, at: [9, 5, 6], lamp: 1.6, win: 0.8, shaft: 0.3, motes: 0.7, bg: '#2a1828' },
  night: { sky: '#6070b0', ground: '#14142a', amb: 0.9, sun: '#90a8f0', sunI: 0.7, at: [4, 12, 5], lamp: 4, win: 0.35, shaft: 0.12, motes: 0.25, bg: '#080a18' },
};

let THREE, renderer, scene, camera, root, view, hud;
let rt, bloomA, bloomB, quad, quadCam, mats;
let hemi, sun, lampLight, winMats = [], shaft, motes, ring;
let mon, walker = { x: 0, z: 0, path: [], facing: 'front', flip: false, hop: 0 };
let blocked = new Set(), room, calm = false, time = '';
let camX = 0, last = 0, fpsLog = [];

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;

function tex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crop(src, x, y, w, h) {
  const c = new OffscreenCanvas(w, h);
  c.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h);
  return c;
}

/** The painting cut to its opaque pixels, with where that box sat. */
function trim(src) {
  const { width: w, height: h } = src, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < 0) return { c: src, x: 0, y: 0, w, h };
  return { c: crop(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1), x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Only the pixels in these colours, for an emissive map: a window's sky, a lamp's shade. */
function mask(src, colours) {
  const keep = new Set(colours.map(h => parseInt(h.slice(1), 16)));
  const c = crop(src, 0, 0, src.width, src.height), g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) if (!keep.has((d[i] << 16) | (d[i + 1] << 8) | d[i + 2])) { d[i] = d[i + 1] = d[i + 2] = 0; }
  g.putImageData(img, 0, 0);
  return c;
}

const solid = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 });
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

function buildRoom(base) {
  const art = roomArt(base);
  const edge = solid('#2a1e16'), trimC = getComputedWallTrim(art);

  const floorTex = tex(crop(art, 0, WALL, COLS * T, ROWS * T));
  const floor = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS),
    [edge, edge, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1 }), edge, solid('#3a2a1e'), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallTex = tex(crop(art, 0, 0, COLS * T, WALL));
  const paper = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 1 });
  const cap = solid(shade(trimC, 1.15)), outer = solid(shade(trimC, 0.6));
  const back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, WALL_H, 0.4), [outer, outer, cap, outer, paper, outer]);
  back.position.set(0, WALL_H / 2, -ROWS / 2 - 0.2);
  back.receiveShadow = true;
  scene.add(back);
  // the side walls stop short of the front, so the camera sees in over them, a diorama's cut-away
  const sideTex = tex(crop(art, 0, 0, ROWS * T, WALL));
  const sidePaper = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 1 });
  for (const s of [-1, 1]) {
    const faces = [outer, outer, cap, outer, outer, outer];
    faces[s < 0 ? 0 : 1] = sidePaper;
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.4, WALL_H, ROWS), faces);
    side.position.set(s * (COLS / 2 + 0.2), WALL_H / 2, 0);
    side.receiveShadow = true; side.castShadow = true;
    scene.add(side);
  }

  for (const it of base.items) addPiece(it);
}

// the trim colour is the wallpaper strip's bottom row, whatever the paper
function getComputedWallTrim(art) {
  const [r, g, b] = art.getContext('2d').getImageData(4, WALL - 3, 1, 1).data;
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function addPiece(it) {
  const p = PIECES[it.id];
  if (p.layer === 'wall') {
    const art = pieceArt(it.id), t = tex(art);
    const glow = GLOW[it.id];
    const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.5, roughness: 1 });
    if (glow) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = tex(mask(art, glow)); winMats.push(m); }
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(p.w, WALL_H), m);
    plane.position.set(it.x - COLS / 2 + p.w / 2, WALL_H / 2, -ROWS / 2 + 0.01);
    scene.add(plane);
    if (it.id === 'window') addShaft(plane.position.x);
    return;
  }
  const [fw, fh] = footprint(it);
  const cx = it.x - COLS / 2 + fw / 2, cz = it.y - ROWS / 2 + fh / 2;
  if (p.layer !== 'rug') for (let i = 0; i < fw; i++) for (let j = 0; j < fh; j++) blocked.add(`${it.x + i},${it.y + j}`);

  if (p.flat) {
    const [h, side] = FLAT[it.id] || [0.4, '#5a3a1e'];
    const top = new THREE.MeshStandardMaterial({ map: tex(pieceArt(it.id)), roughness: 0.9 });
    const s = solid(side);
    const block = new THREE.Mesh(new THREE.BoxGeometry(p.w, h, p.h), [s, s, top, s, s, s]);
    block.position.set(cx, h / 2, cz);
    block.rotation.y = -it.dir * Math.PI / 2;
    block.castShadow = h > 0.1; block.receiveShadow = true;
    scene.add(block);
    return;
  }
  if (it.id === 'shelf') {
    const front = trim(pieceArt('shelf', 0)), behind = trim(pieceArt('shelf', 2));
    const h = front.h * PX, wood = solid('#a8723f');
    const face = (a) => new THREE.MeshStandardMaterial({ map: tex(a.c), roughness: 1 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(p.w, h, 0.8), [wood, wood, solid('#c48a52'), wood, face(front), face(behind)]);
    block.position.set(cx, h / 2, cz);
    block.rotation.y = -it.dir * Math.PI / 2;
    block.castShadow = true; block.receiveShadow = true;
    scene.add(block);
    return;
  }
  // upright pieces stand as billboards: their painting at their facing, feet on the floor at the footprint's middle
  const art = pieceArt(it.id, it.dir), cut = trim(art);
  const m = new THREE.MeshStandardMaterial({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  const glow = GLOW[it.id];
  if (glow) { m.emissive = new THREE.Color('#ffd890'); m.emissiveMap = tex(mask(cut.c, glow)); m.userData.lamp = true; winMats.push(m); }
  const board = new THREE.Mesh(new THREE.PlaneGeometry(cut.w * PX, cut.h * PX), m);
  board.position.set(it.x - COLS / 2 + (cut.x + cut.w / 2) * PX, cut.h * PX / 2, cz);
  board.castShadow = true;
  scene.add(board);
  if (it.id === 'lamp' && !lampLight) {
    lampLight = new THREE.PointLight('#ffc070', 0, 7, 1.6);
    lampLight.position.set(board.position.x, cut.h * PX - 0.35, cz + 0.3);
    scene.add(lampLight);
  }
}

/** A soft shaft of light from the window down to the floor, drawn additive so bloom picks it up. */
function addShaft(x) {
  const c = new OffscreenCanvas(32, 64), g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 64);
  v.addColorStop(0, 'rgba(255,240,200,0.9)'); v.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = v; g.fillRect(0, 0, 32, 64);
  g.globalCompositeOperation = 'destination-in';
  const h = g.createLinearGradient(0, 0, 32, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.3, 'rgba(0,0,0,1)'); h.addColorStop(0.7, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = h; g.fillRect(0, 0, 32, 64);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(1.8, 3.6);
  shaft = new THREE.Mesh(geo, m);
  // from the window's sill out and down across the floor
  shaft.position.set(x, 1.15, -ROWS / 2 + 1.6);
  shaft.rotation.x = -1.05;
  scene.add(shaft);

  const n = 36, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = x + (Math.random() - 0.5) * 1.6;
    pos[i * 3 + 1] = Math.random() * 2.6;
    pos[i * 3 + 2] = -ROWS / 2 + 0.4 + Math.random() * 2.6;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  motes = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#fff0c0', size: 2, sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  motes.userData.base = pos.slice();
  scene.add(motes);
}

/* ---------- the partner: GIF frames on a billboard ---------- */

async function gifFrames(src) {
  if (typeof ImageDecoder !== 'function') return null;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const dec = new ImageDecoder({ data: await res.arrayBuffer(), type: 'image/gif' });
    await dec.tracks.ready;
    const frames = [];
    for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) {
      const { image } = await dec.decode({ frameIndex: i });
      const ms = (image.duration ?? 0) / 1000;
      frames.push({ bmp: await createImageBitmap(image), ms: ms < 20 ? 100 : ms });
      image.close();
    }
    dec.close();
    return frames.length ? frames : null;
  } catch { return null; }
}

/** Without ImageDecoder (older Safari): a live <img> kept in the page, its current frame copied over every tick. */
function liveImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.className = 'b3-live';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    document.body.append(img);
  });
}

async function makeMon() {
  const mate = partner(getSave());
  const front = mate.src, backSrc = front.replace(/-front\.gif$/, '-back.gif');
  const [ff, bf] = await Promise.all([gifFrames(front), backSrc !== front ? gifFrames(backSrc) : null]);
  const sheets = { front: ff ? { frames: ff } : { img: await liveImg(front) } };
  if (bf) sheets.back = { frames: bf };
  const first = ff?.[0].bmp ?? sheets.front.img;
  const w = first?.width || 96, h = first?.height || 96;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = tex(c);
  const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w * MON_PX, h * MON_PX), m);
  board.castShadow = true;
  const [, bottom, left, right] = spriteFit(front);
  board.geometry.translate((right - left) / 2 * MON_PX, (h / 2 - bottom) * MON_PX, 0);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.011;
  const group = new THREE.Group();
  group.add(board, blob);
  scene.add(group);
  return { group, board, c, g: c.getContext('2d'), t, sheets, frame: 0, clock: 0, id: front.split('/').pop().replace(/-front\.gif$/, ''), name: mate.name };
}

function drawMon(dt) {
  const s = mon.sheets[walker.facing] || mon.sheets.front;
  if (s.frames) {
    mon.clock += dt;
    const f = s.frames[mon.frame % s.frames.length];
    if (mon.clock >= f.ms) { mon.clock = 0; mon.frame = (mon.frame + 1) % s.frames.length; }
    const now = s.frames[mon.frame % s.frames.length];
    if (mon.shown !== now) { mon.g.clearRect(0, 0, mon.c.width, mon.c.height); mon.g.drawImage(now.bmp, 0, 0); mon.t.needsUpdate = true; mon.shown = now; }
  } else if (s.img) {
    mon.g.clearRect(0, 0, mon.c.width, mon.c.height); mon.g.drawImage(s.img, 0, 0); mon.t.needsUpdate = true;
  }
}

/* ---------- walking ---------- */

const key = (x, y) => `${x},${y}`;

/** Breadth-first over free tiles; if the tapped tile is taken, to the reachable one nearest it. */
function route(from, to) {
  const prev = new Map([[key(from.x, from.y), null]]), queue = [from];
  let best = from, bestD = Infinity;
  while (queue.length) {
    const c = queue.shift();
    const d = Math.abs(c.x - to.x) + Math.abs(c.y - to.y);
    if (d < bestD) { best = c; bestD = d; }
    if (!d) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: c.x + dx, y: c.y + dy }, k = key(n.x, n.y);
      if (n.x < 0 || n.y < 0 || n.x >= COLS || n.y >= ROWS || blocked.has(k) || prev.has(k)) continue;
      prev.set(k, c); queue.push(n);
    }
  }
  const path = [];
  for (let c = best; c && key(c.x, c.y) !== key(from.x, from.y); c = prev.get(key(c.x, c.y))) path.unshift(c);
  return path;
}

function startTile() {
  for (let r = 0; r < COLS; r++) for (let y = ROWS - 2; y >= 0; y--) for (const x of [5 - r, 5 + r]) {
    if (x >= 0 && x < COLS && !blocked.has(key(x, y))) return { x, y };
  }
  return { x: 5, y: ROWS - 1 };
}

function walk(dt) {
  const step = walker.path[0];
  if (!step) { walker.hop = 0; return; }
  const tx = tileX(step.x), tz = tileZ(step.y), dx = tx - walker.x, dz = tz - walker.z;
  const d = Math.hypot(dx, dz), move = dt / 1000 * 3.2;
  if (Math.abs(dz) > Math.abs(dx)) walker.facing = dz < 0 && mon.sheets.back ? 'back' : 'front';
  else { walker.facing = 'front'; walker.flip = dx > 0; }
  if (d <= move) { walker.x = tx; walker.z = tz; walker.tile = step; walker.path.shift(); }
  else { walker.x += dx / d * move; walker.z += dz / d * move; }
  walker.hop += dt;
}

function tap(e) {
  const r = view.getBoundingClientRect();
  const ndc = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc, camera);
  if (ray.intersectObject(mon.board).length) {
    playCry(mon.id);
    walker.hopUntil = performance.now() + 500;
    return;
  }
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const to = { x: Math.floor(hit.x + COLS / 2), y: Math.floor(hit.z + ROWS / 2) };
  if (to.x < 0 || to.y < 0 || to.x >= COLS || to.y >= ROWS) return;
  walker.path = route(walker.tile, to);
  const end = walker.path.at(-1) ?? walker.tile;
  ring.position.set(tileX(end.x), 0.02, tileZ(end.y));
  ring.material.opacity = 0.9;
  playSound('confirm');
}

/* ---------- light ---------- */

function setTime(force) {
  const t = timeOfDay();
  if (t === time && !force) return;
  time = t;
  const L = LIGHT[t];
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.amb;
  sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.at);
  if (lampLight) lampLight.intensity = L.lamp * 3;
  for (const m of winMats) m.emissiveIntensity = m.userData.lamp ? Math.min(1, L.lamp / 2) : L.win;
  if (shaft) shaft.material.opacity = L.shaft;
  if (motes) motes.material.opacity = L.motes;
  scene.background = new THREE.Color(L.bg);
  mats.final.uniforms.uBg.value.set(L.bg);
}

/* ---------- post: tilt-shift and bloom, one small pass chain ---------- */

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

function makePost() {
  const bright = new THREE.ShaderMaterial({
    uniforms: { tScene: { value: null }, uCut: { value: 0.9 } },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tScene; uniform float uCut; varying vec2 vUv;
      void main() { vec3 c = texture2D(tScene, vUv).rgb; float l = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c * smoothstep(uCut, uCut + 0.2, l), 1.0); }`,
  });
  const blur = new THREE.ShaderMaterial({
    uniforms: { tIn: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
      void main() { vec3 c = texture2D(tIn, vUv).rgb * 0.227;
        c += (texture2D(tIn, vUv + uDir * 1.385).rgb + texture2D(tIn, vUv - uDir * 1.385).rgb) * 0.316;
        c += (texture2D(tIn, vUv + uDir * 3.231).rgb + texture2D(tIn, vUv - uDir * 3.231).rgb) * 0.070;
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const final = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2() },
      uFocus: { value: 0.5 }, uBand: { value: 0.12 }, uBlur: { value: 5 }, uBloom: { value: 0.75 }, uBg: { value: new THREE.Color() },
    },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tScene; uniform sampler2D tBloom; uniform vec2 uRes;
      uniform float uFocus; uniform float uBand; uniform float uBlur; uniform float uBloom; uniform vec3 uBg; varying vec2 vUv;
      void main() {
        vec2 px = (floor(vUv * uRes) + 0.5) / uRes;
        vec3 c = texture2D(tScene, px).rgb;
        float d = clamp((abs(vUv.y - uFocus) - uBand) / (0.5 - uBand), 0.0, 1.0);
        float r = d * d * uBlur;
        if (r > 0.15) {
          vec3 acc = c; float n = 1.0;
          for (int i = 0; i < 12; i++) {
            float a = float(i) * 2.39996, k = sqrt((float(i) + 0.5) / 12.0);
            acc += texture2D(tScene, vUv + vec2(cos(a), sin(a)) * k * r / uRes).rgb; n += 1.0;
          }
          c = acc / n;
        }
        c += texture2D(tBloom, vUv).rgb * uBloom;
        vec2 v = vUv - 0.5; c *= 1.0 - dot(v, v) * 0.55;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  mats = { bright, blur, final };
  quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), final);
  quad.frustumCulled = false;
  quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  quad.userData.scene = quadScene;
}

function pass(material, target) {
  quad.material = material;
  renderer.setRenderTarget(target);
  renderer.render(quad.userData.scene, quadCam);
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  // a small scene, scaled up with crisp pixels: about 420 px on the short side
  const k = Math.min(1, 420 / Math.min(w, h));
  const sw = Math.round(w * k), sh = Math.round(h * k);
  rt?.dispose(); bloomA?.dispose(); bloomB?.dispose();
  rt = new THREE.WebGLRenderTarget(sw, sh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, samples: 0 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const bw = Math.max(1, sw >> 1), bh = Math.max(1, sh >> 1);
  bloomA = new THREE.WebGLRenderTarget(bw, bh);
  bloomB = new THREE.WebGLRenderTarget(bw, bh);
  mats.final.uniforms.uRes.value.set(sw, sh);
  mats.blur.userData.texel = [1 / bw, 1 / bh];
  camera.aspect = w / h;
  // fit about 6.5 tiles across a phone held upright, the whole room on a wide screen
  const fitW = Math.min(COLS + 1.2, Math.max(6.5, (COLS + 1.2) * Math.min(1, camera.aspect / 1.1)));
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  camera.userData.dist = Math.max(fitW / 2 / Math.tan(hfov / 2), (ROWS + 4) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.9);
  camera.userData.half = fitW / 2;
  camera.updateProjectionMatrix();
}

const PITCH = 0.8;   // ~46° down, Octopath's tilt

function placeCamera(dt) {
  const room = COLS / 2 + 0.6, half = camera.userData.half;
  const want = half >= room ? 0 : Math.max(-room + half, Math.min(room - half, walker.x));
  camX = calm ? want : camX + (want - camX) * Math.min(1, dt / 1000 * 3);
  const d = camera.userData.dist;
  const target = new THREE.Vector3(camX, 0.9, 0.4);
  camera.position.set(camX, target.y + Math.sin(PITCH) * d, target.z + Math.cos(PITCH) * d);
  camera.lookAt(target);
}

function frame(now) {
  if (!root.isConnected) return;
  const dt = Math.min(100, now - (last || now));
  last = now;
  fpsLog.push(dt); if (fpsLog.length > 60) fpsLog.shift();

  walk(dt);
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(dt);
  if (ring.material.opacity > 0) { ring.material.opacity = Math.max(0, ring.material.opacity - dt / 700); ring.scale.setScalar(1.25 - ring.material.opacity * 0.3); }
  if (motes && !calm) {
    const p = motes.geometry.attributes.position, b = motes.userData.base;
    for (let i = 0; i < p.count; i++) {
      p.array[i * 3 + 1] = (b[i * 3 + 1] + now / 6000 * (0.3 + (i % 5) * 0.08)) % 2.6;
      p.array[i * 3] = b[i * 3] + Math.sin(now / 1400 + i) * 0.12;
    }
    p.needsUpdate = true;
  }
  if (now - (frame.checked || 0) > 30000) { frame.checked = now; setTime(); }
  placeCamera(dt);
  // the tilt-shift keeps its sharp band on the partner
  const at = new THREE.Vector3(walker.x, 0.6, walker.z).project(camera);
  mats.final.uniforms.uFocus.value = (at.y + 1) / 2;

  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  mats.bright.uniforms.tScene.value = rt.texture;
  pass(mats.bright, bloomA);
  const [tx, ty] = mats.blur.userData.texel;
  for (let i = 0; i < 2; i++) {
    mats.blur.uniforms.tIn.value = bloomA.texture; mats.blur.uniforms.uDir.value.set(tx * (i + 1), 0); pass(mats.blur, bloomB);
    mats.blur.uniforms.tIn.value = bloomB.texture; mats.blur.uniforms.uDir.value.set(0, ty * (i + 1)); pass(mats.blur, bloomA);
  }
  mats.final.uniforms.tScene.value = rt.texture;
  mats.final.uniforms.tBloom.value = bloomA.texture;
  pass(mats.final, null);

  if (hud.fps) hud.fps.textContent = `${Math.round(1000 / (fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length))} fps`;
  requestAnimationFrame(frame);
}

export async function openBase3d() {
  calm = calmFx();
  root = document.createElement('section');
  root.className = 'base3d';
  root.innerHTML = `
    <canvas class="b3-view"></canvas>
    <header class="b3-top"><h2>Secret Base <small>3D pilot</small></h2>
      <span class="b3-fps" hidden></span>
      <a class="b3-key" href="?base">Edit</a>
      <button type="button" class="b3-key b3-close" aria-label="Leave">✕</button></header>
    <p class="b3-hint">Loading…</p>`;
  document.body.append(root);
  view = root.querySelector('.b3-view');
  hud = { hint: root.querySelector('.b3-hint'), fps: null };
  if (new URLSearchParams(location.search).has('fps')) { hud.fps = root.querySelector('.b3-fps'); hud.fps.hidden = false; }
  root.querySelector('.b3-close').addEventListener('click', () => { location.href = location.pathname; });

  try { THREE = await import(THREE_URL); }
  catch { hud.hint.textContent = 'Couldn\'t load the 3D engine. Check the connection and reload.'; return; }

  renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.5, 80);

  hemi = new THREE.HemisphereLight('#fff', '#666', 1);
  sun = new THREE.DirectionalLight('#fff', 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);

  ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24), new THREE.MeshBasicMaterial({ color: '#fff6c0', transparent: true, opacity: 0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);

  makePost();
  room = loadBase();
  buildRoom(room);
  mon = await makeMon();
  walker.tile = startTile();
  walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y);
  camX = walker.x;
  setTime(true);
  resize();
  new ResizeObserver(resize).observe(view);
  view.addEventListener('click', tap);
  hud.hint.textContent = `Tap the floor and ${mon.name} walks there. Tap ${mon.name} to say hi.`;
  requestAnimationFrame(frame);
}

/* hd2d.js  -  what the HD-2D views share (the Secret Base, js/base-3d.js, and the Clearing hub, js/hub-3d.js): Three.js
   from the CDN, crisp pixel textures, a Pokémon GIF split into frames on a billboard, and the post pass (the scene
   rendered small and scaled up with crisp pixels, then tilt-shift and bloom in one chain). */

import { spriteFit } from './data/sprite-fit.js';
import { decodeGif } from './gif-frames.js';
import { sharpness } from './prefs.js';

// the minified build (half the bytes to fetch and parse); index.html preloads it, so keep the two URLs the same
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
export const MON_PX = 1 / 32;   // Pokémon GIFs are drawn at twice the furniture's detail

let THREE = null, loading = null;
/** Three.js, loaded once; throws offline (the callers fall back to their 2D version). */
export async function loadThree() {
  loading ??= import(THREE_URL).then(m => { noteDisposeHooks(m); return m; }, e => { loading = null; throw e; });
  THREE ??= await loading;
  return THREE;
}

/** Compiles what `scene` draws ahead of its first frame (with `into`'s lights, for a group not yet in it), where the
    browser can off the main thread (KHR_parallel_shader_compile), so walking in doesn't freeze on it. Never waits past
    `ms`. */
export function warmShaders(renderer, scene, camera, into = null, ms = 3000) {
  if (asleep.has(renderer)) return Promise.resolve();   // a lost context never finishes compiling: it'd only wait out `ms`
  try {
    // compiled for a render target, as createPost() draws the scene into one: for the screen every program would be a
    // variant (another output colour space) the first frame never uses
    const target = new THREE.WebGLRenderTarget(1, 1), was = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    const done = renderer.compileAsync(scene, camera, into ?? scene);
    renderer.setRenderTarget(was);
    target.dispose();
    return Promise.race([done, new Promise(r => setTimeout(r, ms))]).catch(() => {});
  } catch { return Promise.resolve(); }
}

/** True for a frame to skip: a 90 or 120 Hz phone screen calls a frame loop up to twice as often as 60 Hz, and drawing
    a 3D place that often only heats the phone and drains it. So no place draws more than about 60 times a second. */
export const tooSoon = (now, last) => last > 0 && now - last < 1000 / 60 - 3;

/* ---------- one 3D place awake at a time ----------
   Every 3D place keeps its renderer, and a WebGL context holds every texture, shadow map and render target it ever
   drew until it's let go. Kept awake together (the Clearing, the mall, the arena, the rooms...) they filled an iPhone's
   memory until Safari reloaded the tab, mid-run (the user saw a Safari run "refresh" after its fights, 2026-10-14). So
   waking one puts the others to sleep: their contexts are lost on purpose, which frees all of it on the GPU, and
   restored on their next wakeGL(), where three.js uploads again whatever they draw. Their scenes stay as they are. */
const places = new Set();
const asleep = new WeakSet();
let shown = null, spare = null;   // the place on screen, and the one place warmed ahead that may stay awake beside it

/** A deck picker (PP Up, Forget, the Day Care) opened from a walk-in room, on a screen wide enough to show the room
    around it: the room stays up behind it, still, instead of the pixel scene it was drawn over (the user's ask,
    2026-10-14). A phone's picker covers everything, so the room is put away there as before. */
export const pickingOver = () => !!document.querySelector('#reward-options.deck-pick') && !document.getElementById('reward-screen').hidden
  && matchMedia('(min-width: 721px)').matches;

/** Puts a place's renderer to sleep (its GPU memory let go); it draws nothing until wakeGL(). */
export function sleepGL(renderer) {
  if (!renderer || asleep.has(renderer)) return;
  asleep.add(renderer);
  unhook(renderer);
  try { renderer.forceContextLoss(); } catch { /* already gone */ }
}

/* three.js (r160) builds its GPU bookkeeping afresh on every context restore, and each build hooks a 'dispose' listener
   onto every geometry, texture, instanced mesh, render target and shadow-casting material it uploads. The old build's listeners were never taken off, so every
   wake kept all the last one's buffers, textures and programs alive (the mall held ~2 MB more on each visit, 2026-10-15),
   and they fired at the new context on a dispose ("object does not belong to this context"). So each dispose listener is
   noted where it's added, and a place going to sleep takes its own build's off everything first. */
const hooked = new Map();   // a dispose listener -> WeakRefs to what it's on
function noteDisposeHooks({ EventDispatcher }) {
  const add = EventDispatcher.prototype.addEventListener;
  EventDispatcher.prototype.addEventListener = function (type, fn) {
    if (type === 'dispose') { let on = hooked.get(fn); if (!on) hooked.set(fn, on = new Set()); on.add(new WeakRef(this)); }
    return add.call(this, type, fn);
  };
}
/** Takes `renderer`'s current listeners off everything, found by uploading a tiny probe (its context must be alive). */
function unhook(renderer) {
  if (!THREE) return;
  let fns;
  try {
    const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    const tex = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    tex.needsUpdate = true;
    // alpha-tested, so the shadow pass makes it a depth material of its own (and hooks that too)
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 }), mesh = new THREE.InstancedMesh(geo, mat, 1);
    const target = new THREE.WebGLRenderTarget(1, 1), sun = new THREE.DirectionalLight();
    mesh.frustumCulled = false;
    mesh.castShadow = sun.castShadow = true;
    sun.shadow.mapSize.set(1, 1);
    const was = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(new THREE.Scene().add(mesh, sun), new THREE.Camera());
    renderer.setRenderTarget(was);
    fns = new Set([geo, tex, mat, mesh, target].flatMap(o => o._listeners?.dispose ?? []));
    mesh.dispose(); geo.dispose(); tex.dispose(); mat.dispose(); target.dispose(); sun.shadow.dispose();
  } catch { return; }
  for (const fn of fns) {
    for (const ref of hooked.get(fn) ?? []) ref.deref()?.removeEventListener('dispose', fn);
    hooked.delete(fn);
  }
}

/** The place about to be shown: every other one sleeps, and this one's context is back once this resolves. */
export function wakeGL(renderer) {
  if (!renderer) return Promise.resolve();
  places.add(renderer);
  shown = renderer; spare = null;
  for (const other of places) if (other !== renderer) sleepGL(other);
  if (!asleep.has(renderer)) return Promise.resolve();
  asleep.delete(renderer);
  return new Promise(done => {
    const timer = setTimeout(done, 2000);
    renderer.domElement.addEventListener('webglcontextrestored', () => { clearTimeout(timer); done(); }, { once: true });
    try { renderer.forceContextRestore(); } catch { clearTimeout(timer); done(); }
  });
}

/** A place built ahead of being shown (warmed while the map is up). Only the last one warmed stays awake beside the
    place on screen: every place warming its own context at once kept four awake on the map, and an iPhone still
    reloaded the tab late in a run (after Clarence's badge, 2026-10-14). The others sleep till they're shown. */
export function restGL(renderer) {
  if (!renderer) return;
  places.add(renderer);
  if (renderer === shown || asleep.has(renderer)) return;
  if (spare && spare !== renderer) sleepGL(spare);
  spare = renderer;
}

/** A place let go for good as it's left: its renderer is disposed, so the next visit must make a new one. Reopening a
    kept root and renderer after this draws black (the Secret Base and the mall did, 2026-10-15); a place kept for its
    next visit sleeps instead (sleepGL()), and wakes on it. */
export function dropGL(renderer, scene) {
  if (!renderer) return;
  places.delete(renderer);
  if (shown === renderer) shown = null;
  if (spare === renderer) spare = null;
  if (scene) dispose(scene);
  if (asleep.has(renderer)) return renderer.dispose();
  unhook(renderer);   // before dispose(), while it can still draw the probe
  renderer.dispose();
  asleep.add(renderer);
  try { renderer.forceContextLoss(); } catch { /* already gone */ }
}

let veil = null;
/** A black curtain over everything, for walking from one view into another (the hub's door into the Secret Base and
    back): `curtain(true)` resolves once it's dark, `curtain(false)` once it's lifted. */
export function curtain(on, ms = 320) {
  if (!veil) {
    veil = Object.assign(document.createElement('div'), { className: 'hd2d-curtain' });
    document.body.append(veil);
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 0;
  veil.style.transitionDuration = `${ms}ms`;
  void veil.offsetWidth;
  veil.classList.toggle('on', on);
  return new Promise(resolve => setTimeout(resolve, ms + 20));
}

export function tex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  if (canvas.hd > 1) { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; }
  else { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function crop(src, x, y, w, h) {
  const c = new OffscreenCanvas(w, h);
  c.getContext('2d', { willReadFrequently: true }).drawImage(src, x, y, w, h, 0, 0, w, h);
  return c;
}

/** The painting cut to its opaque pixels, with where that box sat. */
export function trim(src) {
  const { width: w, height: h } = src, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  // an HD picture's box is given in its painted units, as its canvas pixels are `hd` to a unit
  const u = src.hd || 1;
  if (x1 < 0) return { c: src, x: 0, y: 0, w: w / u, h: h / u };
  const c = crop(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  c.hd = u;
  return { c, x: x0 / u, y: y0 / u, w: (x1 - x0 + 1) / u, h: (y1 - y0 + 1) / u };
}

/** A still model's plain-coloured parts (no picture, glow or see-through, nothing of their own in `userData` but the
    tap's `front` and js/base-mesh.js's part `kind`) baked into one mesh per finish that carries each part's colour on its vertices: a Game Corner cabinet
    was 18 draw calls a frame, twice with its shadow, most of them one colour each (2026-10-16). Looks the same; only for
    models whose parts never move or change on their own. */
export function bakeColours(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), sets = new Map();
  root.traverse(o => {
    const m = o.material;
    if (!o.isMesh || o.isInstancedMesh || !o.visible || Array.isArray(m) || !m?.isMeshStandardMaterial) return;
    if (m.map || m.emissiveMap || m.alphaMap || m.normalMap || m.vertexColors || m.transparent || m.alphaTest || m.emissive.getHex()) return;
    if (Object.keys(o.userData).some(k => k !== 'front') || Object.keys(m.userData).some(k => k !== 'kind') || o.geometry.morphAttributes.position) return;
    const k = [m.roughness, m.metalness, m.side, m.flatShading, m.envMapIntensity, o.castShadow, o.receiveShadow].join('|');
    if (sets.has(k)) sets.get(k).push(o); else sets.set(k, [o]);
  });
  for (const list of sets.values()) {
    if (list.length < 2) continue;
    const parts = list.map(o => (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(inv.clone().multiply(o.matrixWorld)));
    if (parts.some(p => !p.attributes.normal)) { parts.forEach(p => p.dispose()); continue; }
    const n = parts.reduce((s, p) => s + p.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let at = 0;
    parts.forEach((p, i) => {
      const c = list[i].material.color, count = p.attributes.position.count;
      pos.set(p.attributes.position.array, at * 3);
      nor.set(p.attributes.normal.array, at * 3);
      for (let v = 0; v < count; v++) col.set([c.r, c.g, c.b], (at + v) * 3);
      at += count;
      p.dispose();
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = list[0].material.clone();
    mat.color.set('#ffffff'); mat.vertexColors = true;
    const baked = new THREE.Mesh(geo, mat);
    baked.castShadow = list[0].castShadow; baked.receiveShadow = list[0].receiveShadow;
    Object.assign(baked.userData, list[0].userData);
    root.add(baked);
    for (const o of list) { o.removeFromParent(); o.geometry.dispose(); }
  }
}

/** Shadows only from things big enough to show one: a bulb, knob or button (under `r` across its middle) cast a few
    pixels of shadow and cost a draw call each in the shadow pass (the Game Corner had 175, 2026-10-16). */
export function smallNoShadow(root, r = 0.1) {
  root.updateMatrixWorld(true);
  const s = new THREE.Vector3();
  root.traverse(o => {
    if (!o.isMesh || !o.castShadow || o.isInstancedMesh) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    o.getWorldScale(s);
    if (o.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z) < r) o.castShadow = false;
  });
}

export function dispose(group) {
  group.traverse(o => {
    o.geometry?.dispose();
    // shared textures (js/base-mesh.js's grain and weave) are marked `keep` and outlive the room
    for (const m of [o.material].flat()) if (m) { if (!m.map?.userData.keep) m.map?.dispose(); if (!m.emissiveMap?.userData.keep) m.emissiveMap?.dispose(); if (!m.alphaMap?.userData.keep) m.alphaMap?.dispose(); m.dispose(); }
  });
  group.clear();
}

/* ---------- a Pokémon: GIF frames on a billboard ---------- */

/** A copy of a picture on a canvas kept in memory, not on the GPU: iPhone Safari keeps an ImageBitmap (or a plain canvas)
    in its GPU process, and when that ran out of memory at a gym badge (2026-10-14) every sprite frame came back blank,
    so your partner walked the Clearing invisible. These also leave that memory to the 3D places. */
function keep(pic, w = pic.width, h = pic.height) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d', { willReadFrequently: true }).drawImage(pic, 0, 0);
  pic.close?.();
  return c;
}

/** Every frame of a GIF with its delay: ImageDecoder where there is one, else js/gif-frames.js (iPhone Safari). */
export async function gifFrames(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    if (/\.png$/.test(src)) return [{ bmp: keep(await createImageBitmap(await res.blob())), ms: 1e9 }];   // a still: a trainer
    const data = await res.arrayBuffer();
    if (typeof ImageDecoder === 'function' && !new URLSearchParams(location.search).has('gifjs')) {
      const dec = new ImageDecoder({ data, type: 'image/gif' });
      await dec.tracks.ready;
      const frames = [];
      for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        const ms = (image.duration ?? 0) / 1000;
        frames.push({ bmp: keep(image, image.displayWidth, image.displayHeight), ms: ms < 20 ? 100 : ms });
      }
      dec.close();
      if (frames.length) return frames;
    }
    const frames = decodeGif(data);
    return frames.length ? frames : null;
  } catch { return null; }
}

/** A billboard leans back to face the camera, so its top tips into whatever stands just behind it: a counter, a wall,
    a shop front. Taking its feet's depth (2026-10-12) still let a tall Pokémon's head sink into a wall half a tile back
    (the user's report, same day). So each pixel takes the depth it would have if the Pokémon stood straight up at its
    feet, a cardboard cutout facing the camera, where the camera's ray through it crosses that upright plane: anything
    behind the feet can't cut it, anything in front of them still hides it. That depth is linear across the screen, so
    it is passed as (depth x w, w) to undo the perspective-correct interpolation. */
function feetDepth(m) {
  m.userData.upright = true;
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', '#ifndef BEND_DROP\n#define BEND_DROP vec3(0.0)\n#endif\nvarying float vUpZ;\nvarying float vUpW;\nvoid main() {')
      .replace('#include <project_vertex>', `#include <project_vertex>
  vec3 feetW = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz + BEND_DROP;
  vec3 pixW = (modelMatrix * vec4(transformed, 1.0)).xyz + BEND_DROP;
  vec3 look = vec3(feetW.x - cameraPosition.x, 0.0, feetW.z - cameraPosition.z);
  vec3 upW = pixW;
  if (length(look) > 0.001) {
    vec3 n = normalize(look);
    float along = dot(pixW - cameraPosition, n);
    if (along > 0.001) upW = cameraPosition + (pixW - cameraPosition) * (dot(feetW - cameraPosition, n) / along);
  }
  vec4 upClip = projectionMatrix * viewMatrix * vec4(upW, 1.0);
  vUpZ = (upClip.z / upClip.w - 0.0005) * gl_Position.w;
  vUpW = gl_Position.w;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'varying float vUpZ;\nvarying float vUpW;\nvoid main() {')
      .replace(/}\s*$/, '  gl_FragDepth = clamp((vUpZ / vUpW) * 0.5 + 0.5, 0.0, 1.0);\n}');
  };
  m.customProgramCacheKey = () => 'upright-depth';
}

/* ---------- the rolling-log bend (?curve=: the Clearing, and every town since 2026-10-14) ----------
   Animal Crossing's world: the ground rolls away round a log lying across the view, so the far side drops below the
   horizon and the near side dips under the bar. Each vertex is lowered by k x (its distance from the view's focus along
   the ground)², once it's already in view space, so shadows and lighting (worked out from the unbent world) still land
   where they should. A billboard drops whole, by its feet's drop, so it stays a flat, upright sprite, and its upright
   depth (feetDepth()) is worked out from where it is drawn. `u` is `{ k: { value }, z: { value } }`, shared by every
   material so one change moves them all. */
export function bend(m, u) {
  if (m.userData.bent) return;
  m.userData.bent = true;
  const was = m.onBeforeCompile, key = m.customProgramCacheKey();
  m.onBeforeCompile = (sh, r) => {
    was.call(m, sh, r);
    sh.uniforms.uBendK = u.k;
    sh.uniforms.uBendZ = u.z;
    sh.vertexShader = `${m.userData.upright ? '#define BEND_RIGID\n' : ''}#define BEND_DROP bendD\nuniform float uBendK;\nuniform float uBendZ;\n` + sh.vertexShader
      .replace('#include <project_vertex>', `#include <project_vertex>
  #ifdef BEND_RIGID
  vec3 bendW = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #else
  vec3 bendW = (mvPosition.xyz - viewMatrix[3].xyz) * mat3(viewMatrix);
  #endif
  float bendZ = bendW.z - uBendZ;
  vec3 bendD = vec3(0.0, -uBendK * bendZ * bendZ, 0.0);
  mvPosition.xyz += mat3(viewMatrix) * bendD;
  gl_Position = projectionMatrix * mvPosition;`);
  };
  m.customProgramCacheKey = () => key + '|bend';
  m.needsUpdate = true;
}

/** The bend moves only a shape's corners and draws straight between them, so the Clearing's ground (one box, its corners
    tiles away) sank as a slab while everything on it bent, and stood floating over it, Bulbasaur apart from its own
    shadow (the user's playtest, 2026-10-14). So a big box or plane is built again cut into cells a tile or less across,
    the same size, faces and materials, where it can bend with the rest; one made and then moved about in its own space
    (its bounds differ) is left as it is. Shared shapes stay shared. */
const fine = new WeakMap();
export function bendFine(o) {
  const g = o.geometry, p = g?.parameters;
  if (!p || o.isInstancedMesh || o.material?.userData?.upright || !/^(Box|Plane)Geometry$/.test(g.type)) return;
  if (fine.has(g)) { o.geometry = fine.get(g); return; }
  o.updateWorldMatrix(true, false);
  const s = o.getWorldScale(new THREE.Vector3()), k = Math.max(s.x, s.y, s.z), n = (len) => Math.max(1, Math.ceil(len * k));
  const box = g.type === 'BoxGeometry';
  if (Math.max(p.width, p.height, box ? p.depth : 0) * k <= 1.5) { fine.set(g, g); return; }
  const made = box ? new THREE.BoxGeometry(p.width, p.height, p.depth, n(p.width), n(p.height), n(p.depth))
    : new THREE.PlaneGeometry(p.width, p.height, n(p.width), n(p.height));
  g.computeBoundingBox(); made.computeBoundingBox();
  const same = g.boundingBox.min.distanceTo(made.boundingBox.min) < 1e-4 && g.boundingBox.max.distanceTo(made.boundingBox.max) < 1e-4;
  if (!same) { made.dispose(); fine.set(g, g); return; }
  fine.set(g, made);
  fine.set(made, made);
  o.geometry = made;
}

/** A point as the bend draws it, back to where it stands in the world (the inverse of bend() for a point). */
export const unbend = (p, u) => { p.y += u.k.value * (p.z - u.z.value) ** 2; return p; };

/** A Pokémon on a billboard, feet at its group's origin: `mate` is `{ src, name, cry }` (the partner, a Safari guest);
    `back` loads its back GIF too, for walking away from the camera. Not yet in any scene. */
export async function monBoard(mate, back = true) {
  const front = mate.src, backSrc = front.replace(/-front\.gif$/, '-back.gif');
  const [ff, bf] = await Promise.all([gifFrames(front), back && backSrc !== front ? gifFrames(backSrc) : null]);
  const sheets = { front: { frames: ff || [] } };
  if (bf) sheets.back = { frames: bf };
  const first = ff?.[0].bmp;
  const w = first?.width || 96, h = first?.height || 96;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = tex(c);
  const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  feetDepth(m);
  const px = mate.px || MON_PX;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w * px, h * px), m);
  board.castShadow = true;
  const [top, bottom, left, right] = first && /\.png$/.test(front) ? gaps(first) : spriteFit(front);
  board.geometry.translate((right - left) / 2 * px, (h / 2 - bottom) * px, 0);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.011;
  blob.raycast = () => {};
  const group = new THREE.Group();
  group.add(board, blob);
  return {
    group, board, c, g: c.getContext('2d', { willReadFrequently: true }), t, sheets, frame: 0, clock: 0, src: front,
    id: mate.cry ?? front.split('/').pop().replace(/-front\.gif$/, ''), name: mate.name, top: (h - bottom - top) * px,
  };
}

/** A still's empty rows and columns round what is painted, [top, bottom, left, right], as SPRITE_FIT keeps a GIF's. */
function gaps(bmp) {
  const w = bmp.width, h = bmp.height, c = new OffscreenCanvas(w, h), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return x1 < 0 ? [0, 0, 0, 0] : [y0, h - 1 - y1, x0, w - 1 - x1];
}

/** The GIF's next frame on its billboard; a sleeping Pokémon breathes at a third of the speed. */
export function drawMon(m, w, dt) {
  const s = m.sheets[w.facing] || m.sheets.front;
  if (!s.frames.length) return;
  m.clock += w.sleeping ? dt / 3 : dt;
  const f = s.frames[m.frame % s.frames.length];
  if (m.clock >= f.ms) { m.clock = 0; m.frame = (m.frame + 1) % s.frames.length; }
  const now = s.frames[m.frame % s.frames.length];
  if (m.shown !== now) { m.g.clearRect(0, 0, m.c.width, m.c.height); m.g.drawImage(now.bmp, 0, 0); m.t.needsUpdate = true; m.shown = now; }
}

/** Whether a ray's hit on a billboard landed on the sprite itself, a few pixels' slack round it, not its empty corners. */
export function onSprite(hit) {
  const m = hit.object.userData.who?.mon;
  if (!m || !hit.uv) return true;
  const x = Math.round(hit.uv.x * m.c.width), y = Math.round((1 - hit.uv.y) * m.c.height);
  const d = m.g.getImageData(Math.max(0, x - 4), Math.max(0, y - 4), 9, 9).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return true;
  return false;
}

/* ---------- post: tilt-shift and bloom, one small pass chain ---------- */

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

/** The pass chain for one renderer: `size(w, h)` on every resize, then `draw(scene, camera, focusY)` each frame, focusY
    being where the sharp band sits (0 the bottom of the view, 1 the top). */
/** `short`: the scene's size on its short side before scaling up; `crisp` scales up in whole pixels, else smoothly with
    4x multisampling (the Secret Base's smooth furniture, 2026-10-09). */
/* Played from the Home Screen, the game fills the whole screen: on a tall phone a third more pixels than the same view in
   the browser, under its bars, and it played that much worse (the user's report, 2026-10-16). There, no scene is drawn
   taller than SCREEN_ASPECT times its width in pixels: a little softer, the browser's cost. In the browser it never applies.
   `?standalone` tries it in a tab. Only on Sharpness: Soft (js/prefs.js); Sharp and Max draw the whole screen. */
const SCREEN_ASPECT = 1.75;
export const fullScreenApp = () => new URLSearchParams(location.search).has('standalone')
  || navigator.standalone === true || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);

export function createPost(renderer, { short = 420, crisp = true } = {}) {
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
      tScene: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2() }, uCrisp: { value: crisp ? 1 : 0 },
      uFocus: { value: 0.5 }, uBand: { value: 0.16 }, uBlur: { value: 5 }, uBloom: { value: 0.75 },
    },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tScene; uniform sampler2D tBloom; uniform vec2 uRes;
      uniform float uFocus; uniform float uBand; uniform float uBlur; uniform float uBloom; uniform float uCrisp; varying vec2 vUv;
      void main() {
        vec2 px = uCrisp > 0.5 ? (floor(vUv * uRes) + 0.5) / uRes : vUv;
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
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), final);
  quad.frustumCulled = false;
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadScene = new THREE.Scene();
  quadScene.add(quad);
  let rt, bloomA, bloomB, texel = [1, 1];
  const pass = (material, target) => { quad.material = material; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); };

  /** 1 in the browser; on a Home Screen app's tall screen, how much smaller its scene is drawn (see SCREEN_ASPECT). */
  const fit = (w, h) => {
    const tall = Math.max(w, h) / Math.min(w, h);
    return sharpness().soft && fullScreenApp() && tall > SCREEN_ASPECT ? Math.sqrt(SCREEN_ASPECT / tall) : 1;
  };
  // on Sharp and Max a smooth place draws past CSS pixels; a crisp one keeps its pixel art's size (its canvas is sharp anyway)
  const scale = (w, h) => {
    const { mult, cap } = crisp ? { mult: 1, cap: 1 } : sharpness();
    return Math.min(cap, short * mult / Math.min(w, h)) * fit(w, h);
  };
  return {
    final,
    /** The scene's size over the view's, for a canvas drawn at the scene's own size (more pixels than it would add nothing). */
    scale,
    fit,
    /** A step down in resolution for a device that can't keep up; false once there's no lower step. Call size() after. */
    lower(w, h) {
      const now = scale(w, h) / fit(w, h) * Math.min(w, h);
      if (now <= 280) return false;
      short = Math.max(280, Math.round(now * 0.8)) / (crisp ? 1 : sharpness().mult);
      return true;
    },
    size(w, h) {
      // a small scene, scaled up: about `short` px on the short side
      const k = scale(w, h);
      const sw = Math.round(w * k), sh = Math.round(h * k);
      rt?.dispose(); bloomA?.dispose(); bloomB?.dispose();
      rt = new THREE.WebGLRenderTarget(sw, sh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, samples: crisp ? 0 : 4 });
      rt.texture.colorSpace = THREE.SRGBColorSpace;
      const bw = Math.max(1, sw >> 1), bh = Math.max(1, sh >> 1);
      bloomA = new THREE.WebGLRenderTarget(bw, bh);
      bloomB = new THREE.WebGLRenderTarget(bw, bh);
      final.uniforms.uRes.value.set(sw, sh);
      texel = [1 / bw, 1 / bh];
    },
    draw(scene, camera, focusY) {
      if (!rt) return;
      final.uniforms.uFocus.value = focusY;
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      bright.uniforms.tScene.value = rt.texture;
      pass(bright, bloomA);
      const [tx, ty] = texel;
      for (let i = 0; i < 2; i++) {
        blur.uniforms.tIn.value = bloomA.texture; blur.uniforms.uDir.value.set(tx * (i + 1), 0); pass(blur, bloomB);
        blur.uniforms.tIn.value = bloomB.texture; blur.uniforms.uDir.value.set(0, ty * (i + 1)); pass(blur, bloomA);
      }
      final.uniforms.tScene.value = rt.texture;
      final.uniforms.tBloom.value = bloomA.texture;
      pass(final, null);
    },
  };
}

/** The way out of every 3D room (the Secret Base, the Poké Mall's places): a doorstep jutting out past the floor's front
    edge at `x`, `z`, and on it a woven red doormat with a cream arrow pointing out, off the tiles so nothing covers it. */
export function doormat(x, z, stepMat) {
  const c = document.createElement('canvas');
  c.width = 288; c.height = 128;
  const g = c.getContext('2d');
  for (let x = 14; x < 274; x += 7) {   // fringe at both ends
    g.strokeStyle = '#d8c09a'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, 4); g.lineTo(x, 16); g.moveTo(x, 112); g.lineTo(x, 124); g.stroke();
  }
  const body = g.createLinearGradient(0, 12, 0, 116);
  body.addColorStop(0, '#d0503e'); body.addColorStop(1, '#a8382c');
  g.fillStyle = body; g.beginPath(); g.roundRect(6, 12, 276, 104, 14); g.fill();
  g.strokeStyle = '#7a2420'; g.lineWidth = 5; g.beginPath(); g.roundRect(16, 22, 256, 84, 9); g.stroke();
  g.globalAlpha = 0.12; g.fillStyle = '#000';
  for (let y = 26; y < 104; y += 6) g.fillRect(20, y, 248, 2);
  g.globalAlpha = 1;
  g.fillStyle = '#fbf0d8'; g.strokeStyle = '#7a2420'; g.lineWidth = 4; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(112, 38); g.lineTo(176, 38); g.lineTo(144, 92); g.closePath(); g.fill(); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const top = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0 });
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8), top);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(x, -0.015, z);
  mat.receiveShadow = true;
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.95), stepMat);
  step.position.set(x, -0.1, z);
  step.receiveShadow = true;
  return { step, mat };
}

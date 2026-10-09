/* hd2d.js  -  what the HD-2D views share (the Secret Base, js/base-3d.js, and the Clearing hub, js/hub-3d.js): Three.js
   from the CDN, crisp pixel textures, a Pokémon GIF split into frames on a billboard, and the post pass (the scene
   rendered small and scaled up with crisp pixels, then tilt-shift and bloom in one chain). */

import { spriteFit } from './data/sprite-fit.js';
import { decodeGif } from './gif-frames.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
export const MON_PX = 1 / 32;   // Pokémon GIFs are drawn at twice the furniture's detail

let THREE = null;
/** Three.js, loaded once; throws offline (the callers fall back to their 2D version). */
export async function loadThree() {
  THREE ??= await import(THREE_URL);
  return THREE;
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
  c.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h);
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

export function dispose(group) {
  group.traverse(o => {
    o.geometry?.dispose();
    // shared textures (js/base-mesh.js's grain and weave) are marked `keep` and outlive the room
    for (const m of [o.material].flat()) if (m) { if (!m.map?.userData.keep) m.map?.dispose(); if (!m.emissiveMap?.userData.keep) m.emissiveMap?.dispose(); m.dispose(); }
  });
  group.clear();
}

/* ---------- a Pokémon: GIF frames on a billboard ---------- */

/** Every frame of a GIF with its delay: ImageDecoder where there is one, else js/gif-frames.js (iPhone Safari). */
export async function gifFrames(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    if (typeof ImageDecoder === 'function' && !new URLSearchParams(location.search).has('gifjs')) {
      const dec = new ImageDecoder({ data, type: 'image/gif' });
      await dec.tracks.ready;
      const frames = [];
      for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        const ms = (image.duration ?? 0) / 1000;
        frames.push({ bmp: await createImageBitmap(image), ms: ms < 20 ? 100 : ms });
        image.close();
      }
      dec.close();
      if (frames.length) return frames;
    }
    const frames = decodeGif(data);
    return frames.length ? frames : null;
  } catch { return null; }
}

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
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w * MON_PX, h * MON_PX), m);
  board.castShadow = true;
  const [top, bottom, left, right] = spriteFit(front);
  board.geometry.translate((right - left) / 2 * MON_PX, (h / 2 - bottom) * MON_PX, 0);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.011;
  blob.raycast = () => {};
  const group = new THREE.Group();
  group.add(board, blob);
  return {
    group, board, c, g: c.getContext('2d', { willReadFrequently: true }), t, sheets, frame: 0, clock: 0, src: front,
    id: mate.cry ?? front.split('/').pop().replace(/-front\.gif$/, ''), name: mate.name, top: (h - bottom - top) * MON_PX,
  };
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

  return {
    final,
    size(w, h) {
      // a small scene, scaled up: about `short` px on the short side
      const k = Math.min(1, short / Math.min(w, h));
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

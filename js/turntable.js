/* turntable.js  -  one small renderer, shared by every window that shows a thing turning in 3D: Meowth's prize counter
   (js/prizes.js) and the Furniture store's buy window (js/mall-3d.js). It draws off screen and each window copies the
   frame onto its own canvas, so a window never adds a WebGL context of its own beside the place on screen. Idle a few
   seconds it sleeps (its context let go), or it stayed awake beside every place for the rest of the visit, and wakes on
   its next draw. */

import { loadThree, sleepGL, wakeBeside } from './hd2d.js';

export const TURN_SIZE = 360;
const NAP_MS = 4000;
let stage = null, nap = 0, dozing = false, waking = null;

function rest() {
  clearTimeout(nap);
  nap = setTimeout(() => { dozing = true; sleepGL(stage.renderer); }, NAP_MS);
}
function wake() {
  if (!dozing) return Promise.resolve();
  return (waking ??= wakeBeside(stage.renderer).then(() => { dozing = false; waking = null; }));
}

/** The shared renderer, its lit scene and camera, made the first time a window asks, awake once this resolves. */
export async function turntableStage() {
  if (stage) { await wake(); return stage; }
  const THREE = await loadThree();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(TURN_SIZE, TURN_SIZE, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#6a5a7a', 1.7));
  const sun = new THREE.DirectionalLight('#fff2dc', 2.4);
  sun.position.set(-4, 9, 7);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  return (stage = { THREE, renderer, scene, camera });
}

/** `pivot` drawn from the stage's camera, copied onto canvas `c`; false (nothing drawn) while the stage wakes. */
export function drawTurn({ renderer, scene, camera }, pivot, c) {
  if (dozing) { wake(); return false; }
  rest();
  scene.add(pivot);
  renderer.render(scene, camera);
  scene.remove(pivot);
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.drawImage(renderer.domElement, 0, 0, c.width, c.height);
  return true;
}

/** The camera aimed at a preview `{ pivot, h, r }` (js/mall-furniture.js's piecePreview()), `tilt` up from level. */
function aim(camera, h, r, tilt) {
  const d = r / Math.sin(camera.fov * Math.PI / 360) * 1.02, midY = h * 0.45;
  camera.position.set(0, midY + Math.sin(tilt) * d, Math.cos(tilt) * d);
  camera.lookAt(0, midY, 0);
}

/** One still of a preview onto canvas `c`, as the buy window first shows it; false if the stage was asleep. */
export function snapTurn(st, { pivot, h, r }, c) {
  pivot.rotation.y = -0.6;
  aim(st.camera, h, r, 0.38);
  return drawTurn(st, pivot, c);
}

const SPIN = 0.55;   // its own pace, a turn every ~11 s

/** A buy window's turntable on `stage` (holding canvas `c`): `show(preview)` turns a piece slowly on its own while
    `alive()`; a drag turns it (and tips it a little up or down), a flick keeps it spinning a moment before it slows to
    its own pace; drags never reach what's under the window. `stop()` ends it. */
export function turner(stage, c, alive) {
  let spin = null;
  stage.addEventListener('pointerdown', (e) => {
    if (!spin) return;
    e.preventDefault();
    stage.setPointerCapture(e.pointerId);
    spin.drag = { x: e.clientX, y: e.clientY, t: performance.now() };
    spin.vel = 0;
    stage.classList.add('held');
  });
  stage.addEventListener('pointermove', (e) => {
    const g = spin?.drag;
    if (!g) return;
    const now = performance.now(), dx = e.clientX - g.x, dy = e.clientY - g.y, k = 6 / stage.clientWidth;
    spin.yaw += dx * k;
    spin.tilt = Math.max(0.05, Math.min(0.9, spin.tilt + dy * k * 0.5));
    if (now > g.t) spin.vel = spin.vel * 0.5 + (dx * k / ((now - g.t) / 1000)) * 0.5;
    Object.assign(g, { x: e.clientX, y: e.clientY, t: now });
  });
  const up = () => {
    if (!spin?.drag) return;
    if (performance.now() - spin.drag.t > 80) spin.vel = 0;
    spin.vel = Math.max(-12, Math.min(12, spin.vel - SPIN));
    spin.drag = null;
    stage.classList.remove('held');
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  return {
    async show(preview) {
      const s = spin = { yaw: -0.6, vel: 0, tilt: 0.38, drag: null, last: 0 };
      c.width = c.height = TURN_SIZE;
      c.getContext('2d').clearRect(0, 0, c.width, c.height);
      const st = await turntableStage().catch(() => null);
      if (!st || spin !== s) return;
      const { pivot, h, r } = preview(st.THREE);
      const step = (now) => {
        if (spin !== s || !alive()) return;
        requestAnimationFrame(step);
        if (now - s.last < 30) return;
        const dt = s.last ? Math.min(100, now - s.last) / 1000 : 0;
        s.last = now;
        if (!s.drag) {
          s.vel *= Math.exp(-dt * 2.5);
          s.yaw += (SPIN + s.vel) * dt;
        }
        pivot.rotation.y = s.yaw;
        aim(st.camera, h, r, s.tilt);
        drawTurn(st, pivot, c);
      };
      requestAnimationFrame(step);
    },
    stop() { spin = null; },
  };
}

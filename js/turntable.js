/* turntable.js  -  one small renderer, shared by every window that shows a thing turning in 3D: Meowth's prize counter
   (js/prizes.js) and the Furniture store's buy window (js/mall-3d.js). It draws off screen and each window copies the
   frame onto its own canvas, so a window never adds a WebGL context of its own beside the place on screen. */

import { loadThree } from './hd2d.js';

export const TURN_SIZE = 360;
let stage = null;

/** The shared renderer, its lit scene and camera, made the first time a window asks. */
export async function turntableStage() {
  if (stage) return stage;
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

/** `pivot` drawn from the stage's camera, copied onto canvas `c`. */
export function drawTurn({ renderer, scene, camera }, pivot, c) {
  scene.add(pivot);
  renderer.render(scene, camera);
  scene.remove(pivot);
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.drawImage(renderer.domElement, 0, 0, c.width, c.height);
}

/* prizes.js  -  Meowth's prize counter (2026-10-12, the user's ask): a tap on Meowth, once the day's scratch card is had
   or still being earned, opens it. PokéCoins (prize tickets until they were taken out the same day, the user's call)
   buy PRIZES (js/data/corner.js): Game Corner furniture and Gen 1's prize dolls, which go to the Secret Base's
   storage like any piece (js/data/furniture.js counts them owned). Since 2026-10-12 (the user's ask: like the showcases) it is a
   showcase row (js/showcase.js): one prize on the screen, ◀ / ▶, Buy twice. Since the same day it sells only the games
   (the user's call), each shown as its 3D model turning slowly on the screen, as it stands in the Secret Base. */

import { PRIZES } from './data/corner.js';
import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { el } from './ui.js';
import { openShowcase, showcaseSource } from './showcase.js';
import { buyPrize, cashTickets } from './corner-pot.js';
import { homeGame } from './home-arcade.js';
import { loadThree, tex } from './hd2d.js';

const owned = (kind) => (getSave().corner?.prizes || []).includes(kind) || (getSave().secretBase?.owned?.[kind] || 0) > 0;

/** Opens the counter; `stamps` is Meowth's word on today's stamp card. */
export async function openPrizes(onClose, stamps = '') {
  const { PIECES } = await import('./base-furniture.js');
  showcaseSource('prizes', {
    entries: () => PRIZES.map(p => ({
      kind: p.kind, name: PIECES[p.kind]?.name ?? p.kind, cost: p.coins, done: owned(p.kind) ? 'Owned' : null,
      text: homeGame(p.kind) ? 'A game for your Secret Base: place it, then tap it there to play as much as you like.' : 'For your Secret Base. You can\'t buy it anywhere else, meow!',
      art: () => turntable(p.kind),
    })),
    buy: (e) => {
      if (!buyPrize(e.cost, e.kind)) { playSound('cancel'); return [`You need ${e.cost - getSave().coins} more PokéCoins for that one, meow.`]; }
      playSound('achievement');
      return [`Here you go: the ${e.name.toLowerCase()}! It's in your Secret Base's storage, meow.`];
    },
  });
  const cashed = cashTickets();
  const say = cashed ? `Tickets are out, coins are in! I swapped your old tickets for ${cashed.toLocaleString()} PokéCoins, meow.` : stamps;
  const start = Math.max(0, PRIZES.findIndex(p => !owned(p.kind)));
  openShowcase('prizes', start, { close: onClose, say: say || null });
}

/* ---------- the turntable: one small renderer, the prize on the screen turning ---------- */

const SIZE = 360;
let stage = null;
async function stageOf() {
  if (stage) return stage;
  const THREE = await loadThree();
  const { furnitureModel } = await import('./base-mesh.js');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#6a5a7a', 1.7));
  const sun = new THREE.DirectionalLight('#fff2dc', 2.4);
  sun.position.set(-4, 9, 7);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const models = new Map();
  const model = (kind) => {
    if (!models.has(kind)) {
      const g = furnitureModel(THREE, kind, (art) => new THREE.MeshStandardMaterial({ map: tex(art), roughness: 0.9 }));
      const box = new THREE.Box3().setFromObject(g), mid = box.getCenter(new THREE.Vector3());
      const pivot = new THREE.Group();
      g.position.set(-mid.x, -mid.y, -mid.z);
      pivot.add(g);
      const size = box.getSize(new THREE.Vector3());
      models.set(kind, { pivot, r: size.length() / 2, low: size.y < Math.max(size.x, size.z) * 0.8 });
    }
    return models.get(kind);
  };
  return (stage = { THREE, renderer, scene, camera, model });
}

/** A canvas for the prize's screen: its painting at once, then its 3D model turning while the canvas is on screen. */
function turntable(kind) {
  const c = el('canvas', 'sc-art sc-piece sc-model');
  c.width = c.height = SIZE;
  stageOf().then(({ renderer, scene, camera, model }) => {
    const { pivot, r, low } = model(kind), g = c.getContext('2d'), t0 = performance.now();
    const d = r / Math.tan(camera.fov * Math.PI / 360) * 0.8;
    camera.position.set(0, d * (low ? 0.75 : 0.32), d);   // a table seen from higher up, so its felt shows
    camera.lookAt(0, 0, 0);
    let last = 0;
    const frame = (now) => {
      if (!c.isConnected) { if (now - t0 > 1000) return; requestAnimationFrame(frame); return; }
      requestAnimationFrame(frame);
      if (now - last < 33) return;
      last = now;
      pivot.rotation.y = -0.6 + Math.sin((now - t0) / 2600) * 0.75;
      scene.add(pivot);
      renderer.render(scene, camera);
      scene.remove(pivot);
      g.clearRect(0, 0, SIZE, SIZE);
      g.drawImage(renderer.domElement, 0, 0);
    };
    requestAnimationFrame(frame);
  }).catch(() => {});
  return c;
}

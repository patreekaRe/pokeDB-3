/* front-lawn.js  -  a friend's front lawn (docs/roadmap.md's "Secret Base houses", the user's playtest ask, 2026-10-23;
   mock-up https://claude.ai/artifact/DEh9vUss4bD1StvwxzSrC2): with houses on, the Trainers app's Visit first stands you
   on a little lawn outside their house, as they built and painted it, their buddy by a mailbox with their name on it.
   Your partner walks up the path, the door swings open, and only then does their Secret Base open as visits always have
   (js/base-3d.js). Their house rides in their page's base JSON as `lot` ({ id, paint }, js/trainers.js), so a page
   written before houses shows the Ancient Tree. Its own renderer, made for each visit and dropped on the way out
   (dropGL()), the only context awake while it's up. */

import { loadThree, tex, dispose, monBoard, drawMon, createPost, curtain, wakeGL, dropGL, tooSoon } from './hd2d.js';
import { hubThree, fine, texOf, mergeStill, ancientArt, treeArt, bushArt, CLEARING_LIGHT } from './hub-3d.js';
import { makeHouse } from './hub-houses.js';
import { HOUSES_BY_ID } from './data/houses.js';
import { buddy } from './trainercard.js';
import { trainerMon } from './trainers.js';
import { timeOfDay } from './daytime.js';
import { calmFx } from './prefs.js';
import { playSound, playCry, playMusic } from './audio.js';
import { el } from './ui.js';

const TP = 16;                     // painted pixels a unit, as the Clearing's billboards
const PATH_Z = 4.4, WALK = 2.2;    // where your partner starts on the path, and how fast it walks up (units a second)

/** The house a friend's page lives in: its base JSON's `lot`, checked against our own list; else the Ancient Tree. */
export function lotOfBase(json) {
  try {
    const l = JSON.parse(json)?.lot, def = HOUSES_BY_ID[l?.id];
    if (def) return { id: l.id, paint: Number.isInteger(l.paint) && l.paint >= 0 && l.paint < def.paints.length ? l.paint : 0 };
  } catch { /* not readable: the tree */ }
  return { id: 'tree', paint: 0 };
}

let THREE = null;

function board(canvas, x, z, s = 1) {
  const k = canvas.fine ? s / canvas.fine : s, w = canvas.width / TP * k, h = canvas.height / TP * k;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texOf(canvas), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  return mesh;
}

/** The plate on the mailbox: their name in capitals on cream. */
function namePlate(name) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 72;
  const g = c.getContext('2d');
  g.fillStyle = '#2a2e36'; g.beginPath(); g.roundRect(0, 0, 256, 72, 14); g.fill();
  g.fillStyle = '#fff6e0'; g.beginPath(); g.roundRect(6, 6, 244, 60, 10); g.fill();
  g.fillStyle = '#2a2e36'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 44;
  do { g.font = `900 ${size}px "Trebuchet MS", "Arial Black", sans-serif`; size -= 2; } while (g.measureText(name).width > 224 && size > 16);
  g.fillText(name, 128, 39);
  return tex(c);
}

/** A friend's front lawn: `name` and `json` from their page (its `lot`), `buddyKey` their walking buddy. Resolves 'in'
    once you've walked through their door (the curtain down: open their base next), or 'left' (the curtain down too). */
export async function openLawn({ name, json, buddyKey }) {
  await hubThree();
  THREE ??= await loadThree();
  const lot = lotOfBase(json), def = HOUSES_BY_ID[lot.id], p = def.paints[lot.paint] || def.paints[0];
  const calm = calmFx(), hour = timeOfDay(), L = CLEARING_LIGHT[hour] || CLEARING_LIGHT.day;
  const who = name || 'TRAINER', theirs = `${who}'s`;

  const root = el('section', 'lawn3d');
  root.innerHTML = `
    <canvas class="lawn-view"></canvas>
    <header class="lawn-top"><button type="button" class="lawn-back">Leave</button><h2></h2></header>
    <div class="lawn-card"><b class="lawn-name"></b><p class="lawn-line"></p><button type="button" class="room-ok lawn-go">Go in</button></div>`;
  root.querySelector('h2').textContent = `${theirs} place`;
  root.querySelector('.lawn-name').textContent = `${theirs} ${def.name}`;
  root.querySelector('.lawn-line').textContent = lot.id === 'tree' ? `The old tree, its door in the roots. Walk up and tap it to go in.` : `In ${p.name}. Walk up the path and tap the door to go in.`;
  document.body.append(root);
  const view = root.querySelector('.lawn-view');

  const renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
  wakeGL(renderer);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const post = createPost(renderer, { crisp: false });
  post.final.uniforms.uBlur.value = 2;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1, 0.5, 120);
  scene.background = new THREE.Color(L.bg);
  scene.add(new THREE.HemisphereLight(L.sky, L.ground, L.amb));
  const sun = new THREE.DirectionalLight(L.sun, L.sunI);
  sun.position.set(...L.at); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 });
  scene.add(sun, sun.target);

  // the ground: the lawn inside its hedge, the meadow round it, the path of stones up to the door
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
  const add = (geo, m, x, y, z, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; scene.add(o); return o; };
  add(new THREE.BoxGeometry(40, 0.4, 40), std({ color: '#6aa84e' }), 0, -0.2, 0, false);
  add(new THREE.BoxGeometry(7.4, 0.04, 8.6), std({ color: '#7cc060' }), 0, 0.02, 0.7, false);
  const hedge = std({ color: '#3f7a3a' }), top = std({ color: '#5aa84a' });
  for (const [w, d, x, z] of [[7.6, 0.6, 0, -3.5], [0.6, 8.0, -3.8, 0.7], [0.6, 8.0, 3.8, 0.7]]) {
    add(new THREE.BoxGeometry(w, 0.7, d), hedge, x, 0.35, z);
    add(new THREE.BoxGeometry(w + 0.04, 0.12, d + 0.04), top, x, 0.74, z, false);
  }
  const stones = [];
  for (let z = 0.75; z < PATH_Z + 0.6; z += 0.55) stones.push([((z * 7) % 3 - 1) * 0.06, 0.05, z]);
  const step = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.36, 0.06, 10), std({ color: '#d8c8a4' }), stones.length), o3 = new THREE.Object3D();
  stones.forEach(([x, y, z], i) => { o3.position.set(x, y, z); o3.updateMatrix(); step.setMatrixAt(i, o3.matrix); });
  step.receiveShadow = true;
  scene.add(step);
  // flowerbeds either side of the path
  const blooms = ['#f86a8a', '#ffd84a', '#ffffff', '#b08af8'].map(c => std({ color: c }));
  for (const [x0, z0] of [[-2.6, 2.6], [-1.9, 3.4], [2.7, 3.2]]) for (let i = 0; i < 7; i++) {
    add(new THREE.SphereGeometry(0.09, 8, 6), blooms[i % 4], x0 + (i % 4) * 0.22, 0.12, z0 + Math.floor(i / 4) * 0.22, false);
  }
  // the Clearing's trees behind the back hedge and down the sides, its billboards
  const kinds = [treeArt(1), treeArt(2), bushArt(5), treeArt(3)];
  for (const [k, x, z, s] of [[0, -4.6, -4.8, 1.1], [1, -1.6, -5.4, 1.2], [3, 1.8, -5.6, 1.25], [0, 4.7, -4.6, 1.1], [2, -5.2, -1.5, 0.9], [2, 5.3, -0.8, 0.9], [1, -5.6, 1.8, 1], [3, 5.7, 2.4, 1]]) scene.add(board(kinds[k], x, z, s));

  // the house: one of ours (its door swings open), or the tree's painting (its door swapped for the open one)
  let house = null, tree = null;
  if (lot.id === 'tree') {
    const shut = ancientArt(false, false, p), b = board(shut, 0, 0.3);
    tree = { b, open: texOf(ancientArt(true, false, p)), was: b.material.map };
    scene.add(b);
  } else {
    house = makeHouse(THREE, { id: lot.id, p, x: 0, z: 0, fine, texOf, merge: mergeStill });
    for (const m of house.glows) m.emissiveIntensity = Math.max(m.userData.glowMin || 0, L.glow) * m.userData.glow;
    scene.add(house.group);
  }

  // the mailbox: a post, a red box, a flag up, and their name on a plate under it, facing you
  const mx = 2.1, mz = 1.7, wood = std({ color: '#8a5a34' });
  add(new THREE.BoxGeometry(0.1, 0.9, 0.1), wood, mx, 0.45, mz);
  add(new THREE.BoxGeometry(0.42, 0.3, 0.55), std({ color: '#d8443a', roughness: 0.5 }), mx, 1.02, mz);
  add(new THREE.BoxGeometry(0.04, 0.24, 0.05), std({ color: '#ffd84a' }), mx + 0.23, 1.12, mz - 0.1, false);
  add(new THREE.PlaneGeometry(0.9, 0.25), new THREE.MeshBasicMaterial({ map: namePlate(who) }), mx, 0.62, mz + 0.06, false);

  // the camera: square on to the door, far enough back that the house and the lawn in front of it fit any screen
  const H = lot.id === 'tree' ? 10.4 : 5.2, LOOK = new THREE.Vector3(0, H * 0.36, 1.2), PITCH = 0.42;
  const fit = () => {
    const w = innerWidth, h = innerHeight, t = Math.tan(camera.fov / 2 * Math.PI / 180);
    camera.aspect = w / h;
    const d = Math.max((H + 3) / (2 * t), 8.2 / (2 * t * camera.aspect));
    camera.position.set(0, LOOK.y + Math.sin(PITCH) * d, LOOK.z + Math.cos(PITCH) * d);
    camera.lookAt(LOOK);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    post.size(w, h);
  };
  fit();
  addEventListener('resize', fit);

  // their buddy by the mailbox, your partner at the foot of the path; both lean back to face the camera unsquashed
  const lean = (m) => { m.board.rotation.x = -PITCH; };
  const theirMon = buddyKey ? trainerMon(buddyKey) : null;
  const [mine, friend] = await Promise.all([
    monBoard(buddy(), true),
    theirMon && !theirMon.masked ? monBoard({ src: theirMon.src, name: theirMon.name, cry: theirMon.cry }, false).catch(() => null) : null,
  ]);
  const me = { x: 0, z: PATH_Z, facing: 'back' };
  lean(mine); mine.group.position.set(0, 0, PATH_Z); scene.add(mine.group);
  if (friend) { lean(friend); friend.group.position.set(1.35, 0, 2.05); scene.add(friend.group); }

  playMusic('secret-base');
  await curtain(false);

  return new Promise((resolve) => {
    let last = 0, going = null, done = false, hopAt = 0;
    const finish = async (how) => {
      if (done) return;
      done = true;
      await curtain(true);
      removeEventListener('resize', fit);
      tree?.open.dispose();
      dropGL(renderer, scene);
      root.remove();
      resolve(how);
    };
    const goIn = () => {
      if (going || done) return;
      going = { at: performance.now() };
      playSound('confirm');
      root.classList.add('going');
    };
    root.querySelector('.lawn-go').addEventListener('click', goIn);
    root.querySelector('.lawn-back').addEventListener('click', () => { playSound('cancel'); finish('left'); });
    // a tap on the house goes in; on their buddy, a cry and a hop
    const ray = new THREE.Raycaster(), at = new THREE.Vector2();
    view.addEventListener('click', (e) => {
      at.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      ray.setFromCamera(at, camera);
      if (friend && ray.intersectObject(friend.board).length) { playCry(friend.id); hopAt = performance.now(); return; }
      if (ray.intersectObjects([house?.door, tree?.b, house?.group].filter(Boolean), true).length) goIn();
    });

    const frame = (now) => {
      if (done) return;
      requestAnimationFrame(frame);
      if (tooSoon(now, last)) return;
      const dt = Math.min(100, now - (last || now));
      last = now;
      // walking up the path to the door; at its step the door opens, and a beat later it's inside
      if (going) {
        const doorZ = (house ? house.door.position.z : 0.45) + 0.45;
        if (me.z > doorZ) me.z = Math.max(doorZ, me.z - WALK * dt / 1000 * (calm ? 3 : 1));
        else if (!going.atDoor) going.atDoor = now;
        if (me.z < doorZ + 1.4 && !going.open) { going.open = true; house?.open(true, calm); if (tree) tree.b.material.map = tree.open; playSound('door'); }
        else if (now - going.atDoor > 450) finish('in');
      }
      const bob = !calm && going && me.z > 0.8 ? Math.abs(Math.sin(now / 1000 * Math.PI * 4)) * 0.08 : 0;
      mine.group.position.set(me.x, 0, me.z);
      mine.board.position.y = bob;
      drawMon(mine, { facing: going ? 'back' : 'front' }, dt);
      if (friend) {
        const t = (now - hopAt) / 500;
        friend.board.position.y = !calm && t < 1 ? Math.sin(t * Math.PI) * 0.3 : 0;
        drawMon(friend, { facing: 'front' }, dt);
      }
      house?.tick(dt, calm);
      post.draw(scene, camera, 0.55);
    };
    requestAnimationFrame(frame);
  });
}

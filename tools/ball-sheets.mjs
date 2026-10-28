/* ball-sheets.mjs  -  renders every ball in js/ball-looks.js into assets/balls/<sprite>.webp (2026-10-27, the user's
   ask: the battle's balls the same 3D balls as the Pokémon Center's): the Center's ball (a sphere, its dark rim and white
   button at the front) under the Center's light, seen a little from above, BALL_FRAMES frames of one clockwise turn in a
   row, each FRAME px, drawn at twice that and shrunk. Run it after a look changes or one is added:
     NODE_PATH=$(npm root -g) node tools/ball-sheets.mjs [--only=poke-ball,love-ball] [--three=<file>] */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, launch, threeCopy, root } from './probe-kit.mjs';

const FRAME = 128;
const args = process.argv.slice(2), opt = (k) => args.find(a => a.startsWith(`--${k}=`))?.split('=')[1];
const only = opt('only')?.split(',');
const three = await readFile(await threeCopy(opt('three')));
const { server, port } = serve();
const browser = await launch();
const page = await browser.newPage();
await page.route(/cdn\.jsdelivr\.net\/npm\/three/, r => r.fulfill({ contentType: 'text/javascript', body: three }));
page.on('pageerror', e => console.error('pageerror', e.message));
await page.goto(`http://localhost:${port}/tools/ball-sheets.mjs`);   // any page of the game's origin, for its imports
const sheets = await page.evaluate(async ({ port, FRAME, only }) => {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js');
  const { BALL_LOOKS, BALL_FRAMES, ballSkinCanvas } = await import(`http://localhost:${port}/js/ball-looks.js`);
  const big = FRAME * 2;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(big, big, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1.16, 1.16, 1.16, -1.16, 0.1, 10);
  camera.position.z = 4;
  // the Center's warm sun from the top left; its floor's brown bounce turned the white half muddy alone on a sheet, so a
  // pale sky under it and a cool fill from the lower right
  scene.add(new THREE.HemisphereLight('#fff8ec', '#d8d4dc', 1.5));
  const sun = new THREE.DirectionalLight('#fff2dc', 1.7);
  sun.position.set(-2, 3, 4);
  const fill = new THREE.DirectionalLight('#e4ecff', 0.7);
  fill.position.set(2.5, -1.5, 3);
  scene.add(sun, fill);
  const spin = new THREE.Group(), tilt = new THREE.Group();
  tilt.rotation.x = 0.32;   // a little from above, the band dipping under the middle like the games' sprites
  spin.add(tilt);
  scene.add(spin);
  const R = 1, ink = new THREE.MeshStandardMaterial({ color: '#22222a', roughness: 0.3 });
  const knob = new THREE.MeshStandardMaterial({ color: '#f8f8fa', roughness: 0.2 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.19, 48), ink);
  rim.rotation.x = Math.PI / 2; rim.position.z = R - 0.03;
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.19, 48), knob);
  button.rotation.x = Math.PI / 2; button.position.z = R + 0.05;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64));
  tilt.add(sphere, rim, button);
  const out = {};
  for (const id of BALL_LOOKS.filter(id => !only || only.includes(id))) {
    const map = new THREE.CanvasTexture(ballSkinCanvas(id, 16));
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    sphere.material = new THREE.MeshStandardMaterial({ map, roughness: 0.22 });
    const sheet = document.createElement('canvas');
    sheet.width = FRAME * BALL_FRAMES; sheet.height = FRAME;
    const g = sheet.getContext('2d');
    g.imageSmoothingQuality = 'high';
    for (let i = 0; i < BALL_FRAMES; i++) {
      spin.rotation.z = -i * Math.PI * 2 / BALL_FRAMES;
      renderer.render(scene, camera);
      g.drawImage(renderer.domElement, i * FRAME, 0, FRAME, FRAME);
    }
    out[id] = sheet.toDataURL('image/webp', 0.9);
    sphere.material.dispose(); map.dispose();
  }
  return out;
}, { port, FRAME, only });
await mkdir(join(root, 'assets/balls'), { recursive: true });
for (const [id, url] of Object.entries(sheets)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  await writeFile(join(root, `assets/balls/${id}.webp`), buf);
  console.log(`${id.padEnd(14)} ${(buf.length / 1024).toFixed(1)} KB`);
}
await browser.close();
server.close();

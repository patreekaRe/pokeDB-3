/* hub-holo.js  -  the Buddy Projector in the Clearing (the user's ask, 2026-10-22): a little device of its own, only for
   changing your walking buddy. A white pedestal with a red band and a lens on top throws a cone of light up to a cyan,
   scan-lined copy of the buddy's GIF turning gently in the air, a ring spinning under its feet. A new buddy scans in from
   the feet up. Its light takes no tap: the pedestal does (its place in js/hub-3d.js), and what's behind the light. */

import { gifFrames, tex } from './hd2d.js';
import { spriteFit } from './data/sprite-fit.js';

const LENS = 0.74;                           // the lens's height, on the pedestal's top
const FEET = 1.0, TALL = 0.95, WIDE = 1.3;   // the figure: its feet's height, its height, its widest
const SCALE = 2;                             // the GIF drawn at twice its pixels, so a scan line is finer than a pixel
const REPAINT = 66, SCAN_IN = 700;

/** The projector, its feet at its group's origin: `show(mate)` puts a buddy (js/trainercard.js's buddy()) in its light,
    `tick()` each frame. `stand` is the pedestal, still, for the Clearing to merge; `top` is how high the figure reaches. */
export function makeHolo(THREE, pitch) {
  const group = new THREE.Group();
  const glow = (colour, opacity, map = null) => new THREE.MeshBasicMaterial({ color: colour, map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const light = (geo, m, order, parent = group) => { const o = new THREE.Mesh(geo, m); o.raycast = () => {}; o.renderOrder = order; parent.add(o); return o; };
  const stand = new THREE.Group();
  group.add(stand);
  const solid = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = o.receiveShadow = true; stand.add(o); return o; };

  // the pedestal: a wide foot, a waisted column, a dish on top banded in red, the lens set in it
  const white = new THREE.MeshStandardMaterial({ color: '#f6f7fb', roughness: 0.32 });
  const red = new THREE.MeshStandardMaterial({ color: '#e2403e', roughness: 0.34 });
  const ink = new THREE.MeshStandardMaterial({ color: '#2a3550', emissive: '#3cd8f8', emissiveIntensity: 0.45, roughness: 0.2, metalness: 0.4 });
  solid(new THREE.CylinderGeometry(0.36, 0.42, 0.1, 32), white, 0.05);
  solid(new THREE.CylinderGeometry(0.3, 0.36, 0.04, 32), red, 0.12);
  solid(new THREE.CylinderGeometry(0.15, 0.22, 0.42, 24), white, 0.35);
  solid(new THREE.CylinderGeometry(0.34, 0.2, 0.12, 32), white, 0.62);
  solid(new THREE.CylinderGeometry(0.345, 0.345, 0.05, 32), red, 0.69);
  solid(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 28), ink, LENS);
  const collar = light(new THREE.RingGeometry(0.14, 0.19, 32), glow('#7ff0ff', 0.9), 1);
  collar.rotation.x = -Math.PI / 2;
  collar.position.y = LENS + 0.025;

  // the beam: an open cone, bright at the lens and fading to nothing at the figure's head, with faint streaks up it
  const beamArt = document.createElement('canvas');
  beamArt.width = 64; beamArt.height = 64;
  const bg = beamArt.getContext('2d'), fade = bg.createLinearGradient(0, 0, 0, 64);
  fade.addColorStop(0, 'rgba(255,255,255,0)'); fade.addColorStop(0.55, 'rgba(255,255,255,0.35)'); fade.addColorStop(1, 'rgba(255,255,255,1)');
  bg.fillStyle = fade; bg.fillRect(0, 0, 64, 64);
  bg.globalCompositeOperation = 'destination-out';
  for (let x = 0; x < 64; x += 8) { bg.fillStyle = 'rgba(0,0,0,0.45)'; bg.fillRect(x + 4, 0, 3, 64); }
  const beamTex = tex(beamArt);
  beamTex.magFilter = beamTex.minFilter = THREE.LinearFilter;
  beamTex.wrapS = THREE.RepeatWrapping;
  const beamH = FEET + TALL - LENS;
  const beam = light(new THREE.CylinderGeometry(0.52, 0.12, beamH, 32, 1, true), glow('#5ee0ff', 0.3, beamTex), 2);
  beam.position.y = LENS + beamH / 2;

  // a ring of dashes under the figure's feet inside a plain one, painted on one square so it's one draw
  const ringArt = document.createElement('canvas');
  ringArt.width = ringArt.height = 128;
  const rg = ringArt.getContext('2d');
  rg.strokeStyle = '#ffffff';
  rg.lineWidth = 7.5;
  for (let i = 0; i < 12; i++) { rg.beginPath(); rg.arc(64, 64, 52, (i / 12) * Math.PI * 2, (i / 12 + 1 / 24) * Math.PI * 2); rg.stroke(); }
  rg.globalAlpha = 0.6; rg.lineWidth = 3.5;
  rg.beginPath(); rg.arc(64, 64, 61, 0, Math.PI * 2); rg.stroke();
  const ringTex = tex(ringArt);
  ringTex.magFilter = ringTex.minFilter = THREE.LinearFilter;
  const dashes = light(new THREE.PlaneGeometry(1.08, 1.08).rotateX(-Math.PI / 2), glow('#9cf6ff', 0.85, ringTex), 3);
  dashes.position.y = FEET - 0.04;

  // the figure: the buddy's frames, cropped to the Pokémon, repainted in light
  const c = document.createElement('canvas');
  c.width = c.height = 2; c.hd = 2;   // mipmapped: scan lines finer than the screen's pixels would shimmer
  const g = c.getContext('2d');
  let figTex = tex(c);
  const figMat = glow('#ffffff', 0.92, figTex);
  const pivot = new THREE.Group();
  pivot.position.y = FEET;
  group.add(pivot);
  const fig = light(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), figMat, 4, pivot);
  fig.rotation.x = -pitch;
  fig.visible = false;

  let mate = null, frames = null, fit = [0, 0, 0, 0], frame = 0, clock = 0, paintedAt = -1e9, bornAt = 0, wanted = null;

  /** One frame of the buddy into the figure's canvas, in cyan light: its shading kept, scan lines cut through it, a bright
      band rolling down, now and then a slice slipping sideways. Scanning in, only what's below the beam's edge. */
  function paint(now, calm) {
    const f = frames[frame % frames.length].bmp, [top, bottom, left, right] = fit;
    const sw = f.width - left - right, sh = f.height - top - bottom, W = c.width, H = c.height;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, W, H);
    g.imageSmoothingEnabled = false;
    g.drawImage(f, left, top, sw, sh, 0, 0, W, H);
    if (!calm && Math.random() < 0.04) {   // a glitch: one slice slips
      const y = Math.floor(Math.random() * H), h = 2 + Math.floor(Math.random() * 6), dx = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 4));
      g.drawImage(c, 0, y, W, h, dx, y, W, h);
    }
    g.globalCompositeOperation = 'source-atop';
    const tint = g.createLinearGradient(0, 0, 0, H);
    tint.addColorStop(0, 'rgba(170,250,255,0.78)'); tint.addColorStop(1, 'rgba(40,190,255,0.82)');
    g.fillStyle = tint; g.fillRect(0, 0, W, H);
    if (!calm) {
      const roll = ((now / 1800) % 1.3 - 0.15) * H, band = g.createLinearGradient(0, roll - 10, 0, roll + 10);
      band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.5, 'rgba(255,255,255,0.55)'); band.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = band; g.fillRect(0, roll - 10, W, 20);
    }
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = 'rgba(0,0,0,0.5)';
    for (let y = 1; y < H; y += 3) g.fillRect(0, y, W, 1);
    const k = calm ? 1 : Math.min(1, (now - bornAt) / SCAN_IN);
    if (k < 1) {   // scanning in from the feet: above the edge is empty, the edge a bright line
      const edge = Math.round(H * (1 - k));
      g.fillStyle = '#000'; g.fillRect(0, 0, W, edge);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(200,255,255,0.95)'; g.fillRect(0, edge, W, 2);
    }
    figTex.needsUpdate = true;
  }

  async function show(next) {
    if (next.src === mate?.src || next.src === wanted) return;
    wanted = next.src;
    const got = await gifFrames(next.src);
    if (wanted !== next.src) return;
    wanted = null;
    if (!got?.length) { fig.visible = false; return; }
    mate = next; frames = got; frame = 0; clock = 0;
    fit = /\.png$/.test(next.src) ? [0, 0, 0, 0] : spriteFit(next.src);
    const f = got[0].bmp, sw = f.width - fit[2] - fit[3], sh = f.height - fit[0] - fit[1];
    if (c.width !== sw * SCALE || c.height !== sh * SCALE) {
      c.width = sw * SCALE; c.height = sh * SCALE;
      figTex.dispose();
      figTex = figMat.map = tex(c);
      figMat.needsUpdate = true;
    }
    const k = Math.min(TALL / sh, WIDE / sw);
    fig.scale.set(sw * k, sh * k, 1);
    fig.visible = true;
    bornAt = performance.now();
    paintedAt = -1e9;
  }

  function tick(now, dt, calm) {
    if (calm) { dashes.rotation.y = 0; pivot.rotation.y = 0; pivot.position.y = FEET; figMat.opacity = 0.92; }
    else {
      dashes.rotation.y = now / 1400;
      beamTex.offset.x = now / 9000;
      pivot.position.y = FEET + Math.sin(now / 700) * 0.04;
      pivot.rotation.y = Math.sin(now / 2600) * 0.22;
      figMat.opacity = Math.random() < 0.03 ? 0.55 : 0.92;
      beam.material.opacity = 0.26 + 0.06 * Math.sin(now / 300);
    }
    if (!frames || !fig.visible) return;
    clock += dt;
    const was = frame;
    if (clock >= frames[frame % frames.length].ms) { clock = 0; frame = (frame + 1) % frames.length; }
    if (frame !== was || now - paintedAt >= REPAINT && !calm || paintedAt < 0) { paintedAt = now; paint(now, calm); }
  }

  return { group, stand, show, tick, top: FEET + TALL };
}

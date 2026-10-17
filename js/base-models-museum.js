/* base-models-museum.js  -  the Fossils and museum set's models (furniture expansion session b, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-museum.js's BUILT, in painted units), built here by one builder, `musparts`: blobs, boxes,
   lathes and cones, a bone as a few-sided rod between its two points (the skeletons stay cheap that way), a rope as a
   tube, and its labels and pictures as crops of the painting, all sharing its one texture. The dig site is its painting
   on a sand slab with the skeleton's skull and spine, the pegs and the strings raised a little off it (DIG); the
   ammonite rug its circle. All solo, in fixed colours. */

import { BUILT, DIG } from './base-furniture-museum.js';
import { tube } from './base-models-kit.js';
import { whole } from './base-models-w.js';

const u = (n) => n / 32;

export const SHAPES = {
  'muskabutops musaerodactyl mustyrantrum musropes musplaque mushelix musdome musomanyte musroot muscranidos muscase musglassdome musmap muspainting mustools mussieve musjars': { make: 'musparts' },
  'musamber musmeteor': { make: 'musparts', play: { does: 'light' } },
  musrevival: { make: 'musparts', play: { does: 'zap' } },
  muskiosk: { make: 'musparts', screen: { x: 0, y: u(56), w: u(15), h: u(18), z: u(4.95) + 0.004 }, play: { does: 'screen', show: ['news', 'quiz'] } },
  musbench: { make: 'musparts', seat: u(20.1) },
  musticket: { make: 'musparts', play: { does: 'give', gives: 'coin', sound: 'fx-ding' } },
  musdig: { make: 'musdig' },
  musrug: { make: 'musrug' },
};

/** As many sides as a part r units round needs: the small bones and vertebrae stay at 8. */
const segOf = (r) => (r < 2.6 ? 8 : r < 6 ? 12 : 16);

function build(K, L, parts, W) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  let art, H;
  /** The painting's own picture over painted rect x, h (its middle), w x hh, for a geometry whose uvs run 0..1. */
  const pic = (g, x, h, w, hh) => {
    if (!art) { art = K.p.art(0, L.HD, true); H = art.height / L.HD; }
    return whole(K, L, g, [x - w / 2, H - h - hh / 2, x + w / 2, H - h + hh / 2], art);
  };
  const mat = (q) => {
    const m = q.m || 'gloss';
    if (m === 'glass') return K.glass();
    if (m === 'liquid') return K.M('glass', q.c, { key: 'liquid' });
    return K[m](q.c);
  };
  const up = new THREE.Vector3(0, 1, 0);
  for (const q of parts) {
    if (q.paintOnly) continue;
    const x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'blob': K.put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), q.e ?? 1, q.ev ?? 1, segOf(Math.max(q.rx, q.ry, q.rz))), mat(q), x, y, z, 0, 0, -(q.tilt || 0)); break;
      case 'box': K.put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), mat(q), x, y, z); break;
      case 'cyl': K.put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), 20), mat(q), x, y, z); break;
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), 20).rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        K.put(g, mat(q), x, y, z);
        break;
      }
      case 'cone': {
        const g = L.cyl(0.0005, u(q.hh), u(q.r), 12).translate(0, u(q.hh) / 2, 0);
        if (q.fwd) g.rotateX(Math.PI / 2); else if (q.tilt) g.rotateZ(-q.tilt);
        K.put(g, mat(q), x, y, z);
        break;
      }
      case 'lathe': K.put(L.lathe(q.pts.map(([r, h]) => [u(r), u(h)]), 24), mat(q), x, y, z); break;
      case 'rod': K.put(L.cyl(u(q.r), u(q.x1 - q.x0), u(q.r), 16).rotateZ(Math.PI / 2), mat(q), x, y, z); break;
      case 'bone': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r1), a.distanceTo(b), u(q.r), q.seg ?? (Math.max(q.r, q.r1) > 1.5 ? 8 : 6));
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize()));
        K.put(g, mat(q), (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'swag': {
        // the painting's curve: a quadratic through a control point twice the sag below the middle
        const cx = (q.x0 + q.x1) / 2, ch = (q.h0 + q.h1) / 2 - q.sag * 2, pts = [];
        for (let i = 0; i <= 8; i++) {
          const t = i / 8, s = 1 - t;
          pts.push([X(s * s * q.x0 + 2 * s * t * cx + t * t * q.x1), u(s * s * q.h0 + 2 * s * t * ch + t * t * q.h1), z]);
        }
        K.put(tube(L, pts, u(q.r), 16), mat(q));
        break;
      }
      case 'text': {
        const g = new THREE.PlaneGeometry(u(q.w), u(q.size * 1.3));
        K.put(g, pic(g, q.x, q.h, q.w, q.size * 1.3), x, y, z + 0.002);
        break;
      }
      case 'pic': {
        const g = q.round ? new THREE.CircleGeometry(u(q.w / 2), 20) : new THREE.PlaneGeometry(u(q.w), u(q.hh));
        K.put(g, pic(g, q.x, q.h, q.w, q.hh), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  musparts(K, s, W, D, L) {
    build(K, L, BUILT[K.p.fam].parts, W);
  },

  // the sand slab with the painting on top, the dug-out bones, the pegs and their strings a little proud of it
  musdig(K, s, W, D, L) {
    const top = K.pic(K.p.art(0, L.HD)), at = (x, y) => [u(x) - W / 2, u(y) - D / 2];
    const slab = L.rbox(u(62), 0.04, u(62), u(5)).translate(0, 0.02, 0);
    K.put(slab, top); L.topUV(slab, W, D);
    const bone = K.gloss('#e8dcc0');
    const [sx, sy, srx, sry] = DIG.skull, [kx, kz] = at(sx, sy);
    K.put(L.blob(u(2 * srx), 0.07, u(2 * sry), 0.9, 0.7, 12), bone, kx, 0.035, kz);
    DIG.spine.slice(0, 5).forEach(([px, py], i) => { const [vx, vz] = at(px, py); K.put(L.blob(u(4.6 - i * 0.4), 0.05, u(3.8 - i * 0.3), 0.9, 0.7, 8), bone, vx, 0.035, vz); });
    const wood = K.wood('#a8784a'), string = K.plain('#8a5a30');
    for (const [px, py] of DIG.pegs) { const [vx, vz] = at(px, py); K.put(L.cyl(u(1.3), 0.1, u(1.3), 8), wood, vx, 0.05, vz); }
    for (const v of [6, 32, 58]) {
      K.put(L.rbox(u(52), 0.008, 0.008, 0.002), string, 0, 0.085, u(v) - D / 2);
      K.put(L.rbox(0.008, 0.008, u(52), 0.002), string, u(v) - W / 2, 0.085, 0);
    }
    const [bx, by, br] = DIG.bucket, [vx, vz] = at(bx, by);
    K.put(L.lathe([[u(br) * 0.85, 0], [u(br), 0.14], [u(br) * 0.95, 0.14], [0, 0.12]], 16), K.metal('#5a6068'), vx, 0.04, vz);
  },

  musrug(K, s, W, D, L) {
    const g = L.cyl(1, 0.03, 1, 40).scale(u(30), 1, u(30)).translate(0, 0.015, 0);
    K.put(g, K.pic(K.p.art(0, L.HD))); L.topUV(g, W, D);
  },
};

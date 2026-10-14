/* hub-cracks.js  -  violet cracks in the Clearing's ground where the Sealed Gate will stand once broken (the user's ask,
   2026-10-14: foreshadow the portal there, with words vaguely saying what's happening). They spread with the gate's
   stage (js/data/gate.js's gateStage(): 0 whole, 3 nearly broken), violet crystal shards push up through them from stage
   1, sparks rise out of them, and whispers drift up over them while your partner is near. js/hub-3d.js builds them as a
   place (makePlaces(), while the gate still stands) and ticks them each frame. */

const R = 1.6;          // world units from the middle to a full crack's end
const PX = 160;         // canvas pixels a world unit
const SPARKS = 16;

// what drifts up over them, by stage: vague, and darker as the seal gives
const WHISPERS = [
  ['...something stirs below...', 'the ground hums here', 'it is sleeping. for now.'],
  ['...the seal is weakening...', 'every blow on the gate echoes here', 'something below is waking'],
  ['...it can hear you...', 'the light grows with every blow', 'it is pushing up'],
  ['...almost through...', 'one more blow', 'it is waiting'],
];
export const CRACK_LINES = [
  'A thin crack in the ground, glowing violet. It hums, very faintly, as if something far below is asleep.',
  'The cracks have spread. The violet light pulses with every blow on the Sealed Gate, as if something below can feel it.',
  'Violet light pours out of the cracks and crystal is pushing up through them. Something below is waking.',
  'The ground here is splitting open. Whatever waits under the Sealed Gate is almost through.',
];

function seeded(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** The cracks for `stage`, painted from the middle out: the same seed every stage, so they grow rather than move. */
function crackArt(stage) {
  const S = Math.round(R * 2 * PX), c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'), mid = S / 2, reach = [0.72, 0.8, 0.9, 1][stage] * R * PX;
  const halo = g.createRadialGradient(mid, mid, 0, mid, mid, reach * 1.05);
  halo.addColorStop(0, `rgba(170, 90, 255, ${0.38 + stage * 0.08})`); halo.addColorStop(0.5, 'rgba(130, 60, 220, 0.12)'); halo.addColorStop(1, 'rgba(110, 40, 200, 0)');
  g.fillStyle = halo; g.fillRect(0, 0, S, S);
  const rnd = seeded(23), lines = [];
  const grow = (x, y, a, len, w, depth) => {
    const pts = [[x, y, w]];
    let left = len;
    while (left > 0) {
      const step = Math.min(left, (0.08 + rnd() * 0.08) * PX);
      a += (rnd() - 0.5) * 0.9;
      x += Math.cos(a) * step; y += Math.sin(a) * step; left -= step;
      pts.push([x, y, w * (0.25 + 0.75 * left / len)]);
      if (depth < 2 && left > len * 0.25 && rnd() < 0.22) grow(x, y, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6), left * (0.35 + rnd() * 0.25), w * 0.6, depth + 1);
    }
    lines.push(pts);
  };
  const arms = [5, 6, 7, 8][stage];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + (rnd() - 0.5) * 0.5, len = reach * (0.6 + rnd() * 0.4);
    if (i < arms) grow(mid + Math.cos(a) * 4, mid + Math.sin(a) * 4, a, len, 0.09 * PX, 0); else rnd();
  }
  const pass = (width, style, blur = 0) => {
    g.shadowBlur = blur; g.shadowColor = 'rgba(190, 110, 255, 0.9)';
    g.strokeStyle = style; g.lineCap = g.lineJoin = 'round';
    for (const pts of lines) for (let i = 1; i < pts.length; i++) {
      g.lineWidth = Math.max(1, pts[i][2] * width);
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
    }
  };
  pass(2.6, 'rgba(160, 80, 255, 0.35)', 18);   // the glow round each crack
  pass(1, '#1c0830');                           // the crack itself, dark
  pass(0.38, '#f0d8ff', 8);                     // the light inside it
  // the split in the middle, wider as it gives
  const hole = 0.07 * PX * (1 + stage * 0.5);
  g.shadowBlur = 20; g.fillStyle = '#1c0830';
  g.beginPath(); g.ellipse(mid, mid, hole * 1.4, hole, 0.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d8b0ff';
  g.beginPath(); g.ellipse(mid, mid, hole * 0.8, hole * 0.45, 0.4, 0, Math.PI * 2); g.fill();
  return c;
}

/** One whisper's words, violet-lit italic on clear, filling the canvas's width at most. */
function paintWhisper(c, text) {
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  let px = 72;
  do g.font = `italic 600 ${px -= 4}px Georgia, "Times New Roman", serif`; while (px > 30 && g.measureText(text).width > c.width - 60);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(170, 90, 255, 1)'; g.shadowBlur = 24;
  g.fillStyle = '#e6ccff';
  g.fillText(text, c.width / 2, c.height / 2);
  g.shadowBlur = 6; g.shadowColor = 'rgba(40, 0, 70, 0.9)';
  g.fillStyle = '#fbf4ff';
  g.fillText(text, c.width / 2, c.height / 2);
}

/** The cracks at (x, z) for `stage`; `pitch` stands the whispers square to the camera, `dot` the sparks' texture. */
export function makeCracks(THREE, { x, z, stage, pitch, dot }) {
  const group = new THREE.Group();
  const art = crackArt(stage), map = new THREE.CanvasTexture(art);
  map.colorSpace = THREE.SRGBColorSpace;
  // cut into cells so the Clearing's bend (?curve=) curves it with the ground under it
  const flat = new THREE.PlaneGeometry(R * 2, R * 2, 8, 8).rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(flat, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
  const glow = new THREE.Mesh(flat, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  ground.position.set(x, 0.02, z); glow.position.set(x, 0.025, z);
  glow.raycast = () => {};
  group.add(ground, glow);

  // crystal shards pushing up out of the cracks, the Depths' violet, more as the seal gives
  const rnd = seeded(5), shardM = new THREE.MeshStandardMaterial({ color: '#b78cff', emissive: new THREE.Color('#8a3cff'), emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.1, flatShading: true, transparent: true, opacity: 0.92 });
  const shardG = new THREE.OctahedronGeometry(0.12, 0);
  for (let i = 0, n = [0, 2, 4, 6][stage]; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = 0.25 + rnd() * R * 0.55 * (0.6 + stage * 0.15);
    const s = new THREE.Mesh(shardG, shardM);
    s.scale.set(0.8 + rnd() * 0.5, 1.6 + rnd() * 1.6, 0.8 + rnd() * 0.5);
    s.position.set(x + Math.cos(a) * d, 0.1, z + Math.sin(a) * d * 0.8);
    s.rotation.set((rnd() - 0.5) * 0.7, rnd() * 3, (rnd() - 0.5) * 0.7);
    s.castShadow = true;
    s.raycast = () => {};
    group.add(s);
  }

  // sparks rising out of the cracks
  const pos = new Float32Array(SPARKS * 3), col = new Float32Array(SPARKS * 3), seeds = [];
  for (let i = 0; i < SPARKS; i++) { const a = rnd() * Math.PI * 2; seeds.push([Math.cos(a) * rnd() * R * 0.6, Math.sin(a) * rnd() * R * 0.5, rnd(), 0.4 + rnd() * 0.6]); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.11, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparks.raycast = () => {};
  group.add(sparks);

  // the whispers: one line at a time drifting up and fading, only while your partner is near
  const wc = document.createElement('canvas');
  wc.width = 1024; wc.height = 144;
  const wmap = new THREE.CanvasTexture(wc);
  wmap.colorSpace = THREE.SRGBColorSpace;
  const ww = 5.2, wh = ww * wc.height / wc.width;
  const words = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh).translate(0, wh / 2, 0), new THREE.MeshBasicMaterial({ map: wmap, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  words.material.userData.upright = true;
  words.rotation.x = -pitch;
  words.raycast = () => {};
  words.visible = false;
  group.add(words);
  const lines = WHISPERS[stage];
  let shown = -1, near = 0, last = 0;
  const CYCLE = 6.5;

  /** Each frame: the glow breathing, the sparks rising, a whisper while `close` (your partner a few steps off). */
  function tick(now, close, calm) {
    const t = calm ? 0 : now / 1000, dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    glow.material.opacity = calm ? 0.35 : (0.25 + stage * 0.08) * (0.55 + 0.45 * Math.sin(t * 1.6));
    const p = geo.attributes.position, cl = geo.attributes.color;
    seeds.forEach(([dx, dz, k0, sp], i) => {
      const k = (k0 + t * sp * 0.22) % 1, fade = Math.sin(k * Math.PI) * (0.5 + stage * 0.15);
      p.setXYZ(i, x + dx + Math.sin(t * sp + i) * 0.06, 0.05 + k * 1.3, z + dz);
      cl.setXYZ(i, 0.75 * fade, 0.45 * fade, 1 * fade);
    });
    p.needsUpdate = cl.needsUpdate = true;
    near += ((close ? 1 : 0) - near) * Math.min(1, dt * 3);
    words.visible = near > 0.01;
    if (!words.visible) return;
    const cyc = calm ? 0 : Math.floor(t / CYCLE), ph = calm ? 0.5 : (t / CYCLE) % 1;
    const at = cyc % lines.length;
    if (at !== shown) { shown = at; paintWhisper(wc, lines[at]); wmap.needsUpdate = true; }
    words.material.opacity = near * (calm ? 0.85 : Math.min(1, Math.sin(ph * Math.PI) * 1.6) * 0.9);
    words.position.set(x, 1.1 + ph * 0.45, z);
  }

  return { group, x, z, tick };
}

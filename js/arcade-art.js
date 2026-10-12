/* arcade-art.js  -  the pictures on the home arcade's 3D machines (js/base-mesh.js's B.arcade / B.whack / B.pinball; the
   user's ask, 2026-10-12: the cabinets showed their painting on every side). Each is drawn smooth at full size, once, on
   its own canvas: a screen's attract picture, the marquee with the game's name, the side art, the pinball's playfield and
   backglass. Only the front of a machine wears its game. */

const TAU = Math.PI * 2;
const made = new Map();
const once = (key, w, h, draw) => {
  if (made.has(key)) return made.get(key);
  const c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  draw(g, w, h);
  made.set(key, c);
  return c;
};

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
  const out = ch.map(v => Math.round(f < 1 ? v * f : v + (255 - v) * Math.min(1, f - 1)));
  return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('');
}
const disc = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const oval = (g, x, y, rx, ry, c, a = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); };
const rr = (g, x, y, w, h, r, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
function text(g, s, x, y, size, fill, stroke, align = 'center') {
  g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  g.textAlign = align; g.textBaseline = 'middle';
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = size * 0.22; g.strokeStyle = stroke; g.strokeText(s, x, y); }
  g.fillStyle = fill; g.fillText(s, x, y);
}
function glowOn(g, c, blur) { g.shadowColor = c; g.shadowBlur = blur; }
function glowOff(g) { g.shadowBlur = 0; }

/** The scan lines and a soft vignette every CRT shares, and a score line along its top. */
function crt(g, w, h, hud = true) {
  if (hud) {
    text(g, '1UP 004200', 10, 13, 13, '#ffffff', null, 'left');
    text(g, 'HI 098500', w - 10, 13, 13, '#ffd84a', null, 'right');
  }
  g.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}

function pikachu(g, x, y, s, flip = 1) {
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  for (const sx of [-1, 1]) {
    g.fillStyle = '#f8d030'; g.beginPath(); g.moveTo(sx * 6, -12); g.lineTo(sx * 14, -34); g.lineTo(sx * 15, -10); g.fill();
    g.fillStyle = '#202028'; g.beginPath(); g.moveTo(sx * 12.3, -29); g.lineTo(sx * 14, -34); g.lineTo(sx * 14.4, -27); g.fill();
  }
  oval(g, 0, 4, 18, 16, '#f8d030');
  disc(g, -7, -1, 2.6, '#202028'); disc(g, 7, -1, 2.6, '#202028');
  disc(g, -6.2, -2, 0.9, '#ffffff'); disc(g, 7.8, -2, 0.9, '#ffffff');
  disc(g, -12, 7, 3.4, '#e83838'); disc(g, 12, 7, 3.4, '#e83838');
  g.strokeStyle = '#202028'; g.lineWidth = 1.2; g.beginPath(); g.arc(-1.5, 5, 1.6, 0, Math.PI); g.arc(1.5, 5, 1.6, 0, Math.PI); g.stroke();
  g.restore();
}
function pokeball(g, x, y, r) {
  disc(g, x, y, r, '#f4f4f4');
  g.fillStyle = '#e03838'; g.beginPath(); g.arc(x, y, r, Math.PI, TAU); g.fill();
  g.fillStyle = '#202028'; g.fillRect(x - r, y - r * 0.1, r * 2, r * 0.2);
  disc(g, x, y, r * 0.32, '#202028'); disc(g, x, y, r * 0.2, '#f4f4f4');
}
function diglett(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#a8683a'; g.beginPath(); g.moveTo(-12, 14); g.lineTo(-12, -2); g.arc(0, -2, 12, Math.PI, TAU); g.lineTo(12, 14); g.fill();
  oval(g, -4, -8, 3, 5, 'rgba(255,255,255,0.25)');
  oval(g, -4, -3, 1.6, 3, '#202028'); oval(g, 4, -3, 1.6, 3, '#202028');
  oval(g, 0, 4, 5, 3.2, '#f0a0a8'); oval(g, -1, 3, 1.6, 1, '#ffffff');
  g.restore();
}

/* ---------- the screens: each game's attract picture ---------- */

const SCREENS = {
  flapcabinet(g, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#58a8e8'); sky.addColorStop(1, '#d0ecff');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (const [x, y] of [[0.18, 0.18], [0.66, 0.12]]) { oval(g, w * x, h * y, 24, 8, 'rgba(255,255,255,0.9)'); oval(g, w * x + 12, h * y - 5, 14, 8, 'rgba(255,255,255,0.9)'); }
    for (const [x, top, gap] of [[0.3, 0.3, 0.36], [0.72, 0.18, 0.36]]) {
      for (const [a, b] of [[0, top], [top + gap, 0.88]]) rr(g, w * x - 18, h * a, 36, h * (b - a), 4, '#8a5a30');
      for (const cy of [top, top + gap]) { disc(g, w * x - 12, h * cy, 16, '#3a8a3a'); disc(g, w * x + 12, h * cy, 16, '#3a8a3a'); disc(g, w * x, h * cy - 3, 19, '#4aa04a'); }
    }
    g.fillStyle = '#5a9a3a'; g.fillRect(0, h * 0.88, w, h);
    g.save(); g.translate(w * 0.5, h * 0.48); g.rotate(-0.25);
    oval(g, 0, 0, 20, 15, '#b07a48'); oval(g, 4, 5, 13, 8, '#f0dcb0');
    g.fillStyle = '#8a5a30'; g.beginPath(); g.moveTo(-6, -4); g.quadraticCurveTo(-28, -30, -30, -6); g.quadraticCurveTo(-18, 0, -6, 2); g.fill();
    disc(g, 12, -6, 3.4, '#ffffff'); disc(g, 13, -6, 1.8, '#202028');
    g.fillStyle = '#404040'; g.beginPath(); g.moveTo(19, -2); g.lineTo(28, 1); g.lineTo(19, 4); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2;
    for (const y of [0.42, 0.5, 0.58]) { g.beginPath(); g.moveTo(w * 0.24, h * y); g.lineTo(w * 0.36, h * y); g.stroke(); }
    text(g, '12', w * 0.5, 22, 22, '#ffffff', '#1a4a8a');
    crt(g, w, h, false);
  },
  pongcabinet(g, w, h) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a7ac8'); bg.addColorStop(1, '#14408a');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.setLineDash([8, 6]); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); g.setLineDash([]);
    rr(g, w * 0.5, 34, 56, 8, 4, '#f0c040'); rr(g, w * 0.28, h - 30, 56, 8, 4, '#f4f4f4');
    // Psyduck holding its head
    const px = w * 0.62, py = 24;
    disc(g, px, py, 17, '#f8d048'); oval(g, px, py + 6, 9, 5, '#f0e0a0');
    disc(g, px - 6, py - 3, 4.5, '#ffffff'); disc(g, px + 6, py - 3, 4.5, '#ffffff'); disc(g, px - 6, py - 3, 1.4, '#202028'); disc(g, px + 6, py - 3, 1.4, '#202028');
    g.strokeStyle = '#202028'; g.lineWidth = 1.5; for (const dx of [-3, 0, 3]) { g.beginPath(); g.moveTo(px + dx, py - 16); g.lineTo(px + dx, py - 22); g.stroke(); }
    text(g, '?', px + 26, py - 6, 18, '#ffd84a', '#7a4a10');
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(w * 0.36, h - 34); g.lineTo(w * 0.78, h * 0.55); g.lineTo(w * 0.6, h * 0.36); g.stroke(); g.setLineDash([]);
    pokeball(g, w * 0.6, h * 0.36, 9);
    text(g, '3', w * 0.9, h / 2 - 16, 18, '#ffd84a', '#1a2a5a'); text(g, '5', w * 0.9, h / 2 + 16, 18, '#ffffff', '#1a2a5a');
    crt(g, w, h, false);
  },
  gastlymaze(g, w, h) {
    g.fillStyle = '#140c26'; g.fillRect(0, 0, w, h);
    const c = 16, cols = Math.floor(w / c), rows = Math.floor(h / c), ox = (w - cols * c) / 2, oy = (h - rows * c) / 2;
    const wall = (x, y) => x === 0 || y === 0 || x === cols - 1 || y === rows - 1 || (x % 4 === 2 && y % 4 !== 0 && y % 4 !== 3) || (y % 4 === 2 && x % 6 === 4);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = ox + x * c, py = oy + y * c;
      if (wall(x, y)) rr(g, px + 1, py + 1, c - 2, c - 2, 4, '#4a2a8a');
      else if ((x + y) % 2 === 0) disc(g, px + c / 2, py + c / 2, 2, '#3a8ae0');
    }
    disc(g, ox + c * 1.5, oy + c * 1.5, 5, '#58c858'); disc(g, ox + c * (cols - 1.5), oy + c * (rows - 1.5), 5, '#58c858');
    for (const [x, y] of [[0.7, 0.4], [0.82, 0.66]]) {
      glowOn(g, '#b070ff', 14); disc(g, w * x, h * y, 13, '#5a2a7a'); glowOff(g);
      disc(g, w * x, h * y, 10, '#2a1a3a');
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(w * x - 8, h * y - 4); g.lineTo(w * x - 2, h * y - 1); g.lineTo(w * x - 7, h * y + 1); g.fill();
      g.beginPath(); g.moveTo(w * x + 8, h * y - 4); g.lineTo(w * x + 2, h * y - 1); g.lineTo(w * x + 7, h * y + 1); g.fill();
      oval(g, w * x, h * y + 5, 5, 2.4, '#e05080');
    }
    pikachu(g, w * 0.32, h * 0.6, 0.8);
    crt(g, w, h);
  },
  stackercabinet(g, w, h) {
    g.fillStyle = '#0e1838'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,140,255,0.18)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const rows = [[7, 0], [6, 0], [6, 1], [5, 1], [4, 1], [4, 2], [3, 2]], cell = 22, x0 = w / 2 - 3.5 * cell;
    rows.forEach(([n, off], r) => {
      const y = h - 14 - (r + 1) * (cell - 2);
      for (let i = 0; i < n; i++) {
        const x = x0 + (off + i) * cell, body = r % 2 ? '#3a8a9a' : '#e8dcc0';
        rr(g, x + 1, y + 1, cell - 2, cell - 4, 5, body);
        rr(g, x + 3, y + 2, cell - 6, 4, 2, 'rgba(255,255,255,0.4)');
      }
    });
    const ty = 30;
    glowOn(g, '#7af0ff', 14);
    for (let i = 0; i < 3; i++) rr(g, x0 + (1 + i) * cell + 9, ty, cell - 2, cell - 4, 5, '#9af8ff');
    glowOff(g);
    // Snorlax asleep on top of the tower
    const sx = w / 2 + 6, sy = h - 14 - 7 * (cell - 2) - 16;
    oval(g, sx, sy, 28, 18, '#3a7a8a'); oval(g, sx, sy + 4, 18, 12, '#f0e4c8');
    g.strokeStyle = '#202028'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(sx - 10, sy - 8); g.lineTo(sx - 4, sy - 8); g.moveTo(sx + 4, sy - 8); g.lineTo(sx + 10, sy - 8); g.stroke();
    text(g, 'z', sx + 30, sy - 22, 14, '#ffffff'); text(g, 'Z', sx + 42, sy - 34, 18, '#ffffff');
    crt(g, w, h);
  },
  dashcabinet(g, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.7); sky.addColorStop(0, '#f86848'); sky.addColorStop(0.6, '#f8b060'); sky.addColorStop(1, '#ffe0a0');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    glowOn(g, '#ffe070', 30); disc(g, w * 0.72, h * 0.42, 28, '#fff0a0'); glowOff(g);
    g.fillStyle = '#b05a48'; g.beginPath(); g.moveTo(0, h * 0.62);
    for (const [x, y] of [[0.1, 0.5], [0.22, 0.58], [0.38, 0.44], [0.55, 0.6], [0.78, 0.48], [1, 0.6]]) g.lineTo(w * x, h * y);
    g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#d88a50'; g.fillRect(0, h * 0.72, w, h);
    g.fillStyle = '#b86a38'; g.fillRect(0, h * 0.72, w, 4);
    for (let x = 6; x < w; x += 34) { g.fillStyle = '#f0c080'; g.fillRect(x, h * 0.86, 18, 3); }
    g.fillStyle = '#7a7a88'; g.beginPath(); g.moveTo(w * 0.78, h * 0.73); g.lineTo(w * 0.84, h * 0.6); g.lineTo(w * 0.9, h * 0.73); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2;
    for (const y of [0.56, 0.62, 0.68]) { g.beginPath(); g.moveTo(w * 0.04, h * y); g.lineTo(w * 0.2, h * y); g.stroke(); }
    // Ponyta mid-leap
    g.save(); g.translate(w * 0.4, h * 0.6);
    g.fillStyle = '#f0e0b0';
    for (const [x, a] of [[-16, 0.6], [-8, -0.4], [12, 0.5], [20, -0.5]]) { g.save(); g.translate(x, 6); g.rotate(a); rr(g, -3, 0, 6, 18, 3, '#f0e0b0'); g.restore(); }
    oval(g, 0, 0, 24, 13, '#f8ecc0'); oval(g, 26, -14, 11, 9, '#f8ecc0'); oval(g, 34, -10, 7, 5, '#f8ecc0');
    disc(g, 28, -17, 2.4, '#7a2a20');
    for (const [x, y, r, c] of [[16, -24, 9, '#ff5020'], [6, -18, 10, '#ff8030'], [-6, -14, 9, '#ffb040'], [-20, -10, 10, '#ff6020'], [-30, -4, 7, '#ffd050']]) {
      glowOn(g, '#ff8030', 12); g.fillStyle = c; g.beginPath(); g.moveTo(x - r, y + r * 0.6); g.quadraticCurveTo(x - r * 0.4, y - r * 1.8, x + r * 0.3, y - r * 1.6); g.quadraticCurveTo(x + r * 0.2, y - r * 0.4, x + r, y + r * 0.6); g.fill();
    }
    glowOff(g); g.restore();
    crt(g, w, h);
  },
  memorycabinet(g, w, h) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a1a4a'); bg.addColorStop(1, '#120a24');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cols = 4, rows = 3, cw = 46, chh = 46, gx = (w - cols * cw - (cols - 1) * 8) / 2, gy = 30;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = gx + c * (cw + 8), y = gy + r * (chh + 8), up = (r * 3 + c * 2) % 5 === 0;
      rr(g, x, y, cw, chh, 7, up ? '#f8f4e8' : '#3a2a6a');
      if (up) { disc(g, x + cw / 2, y + chh / 2, 15, '#f8d030'); text(g, String(1 + ((r + c) % 3)), x + cw / 2, y + chh / 2 + 1, 18, '#7a4a10'); }
      else {
        const vx = x + cw / 2, vy = y + chh / 2;
        disc(g, vx, vy, 16, '#f4f4f4'); g.fillStyle = '#e03838'; g.beginPath(); g.arc(vx, vy, 16, Math.PI, TAU); g.fill();
        oval(g, vx - 6, vy - 4, 3.4, 2.6, '#ffffff'); oval(g, vx + 6, vy - 4, 3.4, 2.6, '#ffffff');
        disc(g, vx - 5, vy - 4, 1.4, '#202028'); disc(g, vx + 5, vy - 4, 1.4, '#202028');
      }
    }
    glowOn(g, '#f8d030', 16); g.strokeStyle = '#f8d030'; g.lineWidth = 3; g.beginPath(); g.roundRect(gx + (cw + 8) - 3, gy + (chh + 8) - 3, cw + 6, chh + 6, 9); g.stroke(); glowOff(g);
    crt(g, w, h);
  },
  volleycabinet(g, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.75); sky.addColorStop(0, '#58b0f8'); sky.addColorStop(1, '#b8e4ff');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (const [x, y] of [[0.2, 0.25], [0.7, 0.18]]) { oval(g, w * x, h * y, 26, 9, 'rgba(255,255,255,0.9)'); oval(g, w * x + 14, h * y - 5, 16, 8, 'rgba(255,255,255,0.9)'); }
    g.fillStyle = '#3a90d8'; g.fillRect(0, h * 0.62, w, h * 0.1);
    g.fillStyle = '#f0d890'; g.fillRect(0, h * 0.72, w, h);
    g.fillStyle = '#d8b870'; for (let x = 0; x < w; x += 9) g.fillRect(x, h * 0.72 + (x % 27) / 3 + 8, 3, 2);
    g.fillStyle = '#f4f4f4'; g.fillRect(w / 2 - 2, h * 0.42, 4, h * 0.34);
    g.fillStyle = '#e8e8e8'; for (let y = h * 0.42; y < h * 0.56; y += 5) g.fillRect(w / 2 - 6, y, 12, 1);
    pikachu(g, w * 0.22, h * 0.76, 1.1); pikachu(g, w * 0.78, h * 0.76, 1.1, -1);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.setLineDash([4, 5]); g.lineWidth = 2;
    g.beginPath(); g.moveTo(w * 0.25, h * 0.55); g.quadraticCurveTo(w * 0.42, h * 0.02, w * 0.62, h * 0.28); g.stroke(); g.setLineDash([]);
    pokeball(g, w * 0.62, h * 0.28, 9);
    text(g, '7', w * 0.38, 30, 26, '#ffffff', '#1a4a8a'); text(g, '5', w * 0.62, 30, 26, '#ffffff', '#1a4a8a');
    crt(g, w, h, false);
  },
  unowncabinet(g, w, h) {
    g.fillStyle = '#16122e'; g.fillRect(0, 0, w, h);
    const L = 'POKEMONXUNOWNQZACRYSTALBERRYTMHM', n = 6, s = 26, x0 = (w - n * s) / 2 + s / 2, y0 = 34;
    glowOn(g, '#78f08c', 14); g.strokeStyle = 'rgba(120,240,140,0.85)'; g.lineWidth = 18; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 4 * s, y0 + 4 * s); g.stroke();
    g.strokeStyle = 'rgba(248,208,48,0.8)'; g.beginPath(); g.moveTo(x0 + s, y0 + 5 * s); g.lineTo(x0 + 5 * s, y0 + 5 * s); g.stroke();
    glowOff(g); g.lineCap = 'butt';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const ch = r === c && r < 5 ? 'UNOWN'[r] : L[(r * 7 + c * 3) % L.length];
      text(g, ch, x0 + c * s, y0 + r * s, 16, '#e8e4ff');
    }
    // an Unown floating by
    const ux = w * 0.86, uy = h * 0.5;
    g.strokeStyle = '#202028'; g.lineWidth = 4; g.beginPath(); g.moveTo(ux - 12, uy - 16); g.lineTo(ux, uy + 16); g.lineTo(ux + 12, uy - 16); g.stroke();
    disc(g, ux, uy - 4, 9, '#f4f4f4'); disc(g, ux, uy - 4, 4, '#202028');
    crt(g, w, h, false);
  },
};

/** A machine's screen picture, 256 x 192. */
export const screenArt = (id) => SCREENS[id] && once(`scr:${id}`, 256, 192, SCREENS[id]);

/** The marquee over a cabinet's screen: the game's name lit up in its colour, bulbs round it. */
export function marqueeArt(name, colour) {
  return once(`mq:${name}`, 512, 192, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, shade(colour, 1.35)); bg.addColorStop(0.55, colour); bg.addColorStop(1, shade(colour, 0.55));
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let k = -4; k < 12; k++) { g.beginPath(); g.moveTo(k * 60, 0); g.lineTo(k * 60 + 30, 0); g.lineTo(k * 60 + 120, h); g.lineTo(k * 60 + 90, h); g.fill(); }
    rr(g, 10, 10, w - 20, h - 20, 18, 'rgba(0,0,0,0)');
    g.strokeStyle = '#fff4c8'; g.lineWidth = 4; g.beginPath(); g.roundRect(12, 12, w - 24, h - 24, 16); g.stroke();
    for (let i = 0; i < 16; i++) { const x = 24 + i * (w - 48) / 15; disc(g, x, 6, 4, i % 2 ? '#fff8d0' : '#ffd84a'); disc(g, x, h - 6, 4, i % 2 ? '#ffd84a' : '#fff8d0'); }
    const words = name.toUpperCase().split(' '), two = words.length > 1 && name.length > 12;
    const lines = two ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [name.toUpperCase()];
    const size = two ? 50 : 58;
    lines.forEach((ln, i) => {
      const y = h / 2 + (i - (lines.length - 1) / 2) * size * 1.05;
      g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
      const fit = Math.min(1, (w - 70) / g.measureText(ln).width);
      g.save(); g.translate(w / 2, y); g.scale(fit, 1);
      glowOn(g, '#ffffff', 18); text(g, ln, 0, 0, size, '#ffffff', shade(colour, 0.35)); glowOff(g);
      g.restore();
    });
    pokeball(g, 34, h / 2, 14); pokeball(g, w - 34, h / 2, 14);
  });
}

/** A cabinet's side art: sweeping stripes in its colour and a Poké Ball, transparent elsewhere. */
export function sideArt(colour) {
  return once(`side:${colour}`, 256, 256, (g, w, h) => {
    for (const [off, c, wd] of [[0, shade(colour, 1.5), 34], [40, '#ffffff', 10], [58, shade(colour, 0.5), 22]]) {
      g.fillStyle = c; g.beginPath();
      g.moveTo(0, h - 40 - off); g.bezierCurveTo(w * 0.4, h - 60 - off, w * 0.6, h * 0.3 - off, w, 30 - off);
      g.lineTo(w, 30 - off + wd); g.bezierCurveTo(w * 0.6, h * 0.3 - off + wd, w * 0.4, h - 60 - off + wd, 0, h - 40 - off + wd); g.fill();
    }
    g.globalAlpha = 0.9; pokeball(g, w * 0.3, h * 0.32, 30); g.globalAlpha = 1;
  });
}

/** The Whac-a-Diglett's front: Digletts popping out of the dirt under stars. */
export const whackFront = () => once('whack:front', 256, 192, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f8c838'); bg.addColorStop(1, '#e09820');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(w / 2, h * 1.1); g.arc(w / 2, h * 1.1, w, k * 0.26 - Math.PI, k * 0.26 - Math.PI + 0.12); g.fill(); }
  g.fillStyle = '#7a4a24'; g.beginPath(); g.moveTo(0, h);
  for (let x = 0; x <= w; x += 16) g.lineTo(x, h * 0.72 + Math.sin(x / 20) * 6);
  g.lineTo(w, h); g.fill();
  diglett(g, w * 0.25, h * 0.66, 2.2); diglett(g, w * 0.55, h * 0.58, 2.8); diglett(g, w * 0.82, h * 0.7, 2);
  for (const [x, y, r] of [[0.12, 0.2, 9], [0.42, 0.14, 7], [0.72, 0.22, 10], [0.9, 0.12, 6]]) {
    g.fillStyle = '#fff8d0'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rad = i % 2 ? r * 0.45 : r; g.lineTo(w * x + Math.cos(a) * rad, h * y + Math.sin(a) * rad); }
    g.fill();
  }
});

/** The Whac-a-Diglett's backboard: its name over a score window. */
export const whackSign = () => once('whack:sign', 512, 224, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#d84838'); bg.addColorStop(1, '#8a2018');
  rr(g, 0, 0, w, h, 26, '#5a1810'); rr(g, 8, 8, w - 16, h - 16, 20, bg);
  for (let i = 0; i < 18; i++) { const x = 24 + i * (w - 48) / 17; disc(g, x, 18, 4.5, i % 2 ? '#fff8d0' : '#ffd84a'); }
  g.save(); g.translate(w / 2, 82);
  g.font = '900 54px "Arial Black", Arial, sans-serif';
  const s = Math.min(1, (w - 60) / g.measureText('WHAC-A-DIGLETT').width); g.scale(s, 1);
  glowOn(g, '#ffffff', 16); text(g, 'WHAC-A-DIGLETT', 0, 0, 54, '#ffe060', '#3a0a08'); glowOff(g);
  g.restore();
  rr(g, w / 2 - 120, 130, 240, 64, 10, '#140808');
  glowOn(g, '#ff5030', 14); text(g, '00420', w / 2, 163, 44, '#ff6a40'); glowOff(g);
  diglett(g, 54, 160, 1.6); diglett(g, w - 54, 160, 1.6);
});

/** The pinball table's playfield, seen from above, its top the back of the table. */
export const pinField = () => once('pin:field', 256, 384, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1a3a9a'); bg.addColorStop(1, '#0c1a5a');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.08)'; disc(g, w / 2, h * 0.42, 90, 'rgba(120,180,255,0.15)');
  g.strokeStyle = '#f8d030'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(12, h - 70); g.lineTo(12, 70); g.arc(w / 2, 70, w / 2 - 12, Math.PI, 0); g.lineTo(w - 12, h - 70); g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(w - 34, h - 10); g.lineTo(w - 34, 110); g.stroke();
  for (const x of [w * 0.36, w * 0.5, w * 0.64]) { g.beginPath(); g.moveTo(x, 50); g.lineTo(x, 84); g.stroke(); }
  for (const [x, y] of [[0.3, 0.3], [0.62, 0.3], [0.46, 0.42]]) {
    glowOn(g, '#ff6060', 16); disc(g, w * x, h * y, 20, '#f4f4f4'); glowOff(g);
    disc(g, w * x, h * y, 14, '#e03838'); disc(g, w * x, h * y, 6, '#ffffff');
  }
  pikachu(g, w * 0.46, h * 0.62, 1.2);
  for (const [x, c] of [[0.2, '#58d858'], [0.3, '#58b8f8'], [0.62, '#f8d030'], [0.72, '#f878a8']]) { glowOn(g, c, 10); g.fillStyle = c; g.beginPath(); g.moveTo(w * x, h * 0.74); g.lineTo(w * x - 7, h * 0.78); g.lineTo(w * x + 7, h * 0.78); g.fill(); }
  glowOff(g);
  g.fillStyle = '#ffffff';
  for (const [x, sgn] of [[0.12, 1], [0.78, -1]]) { g.beginPath(); g.moveTo(w * x, h * 0.8); g.lineTo(w * x + sgn * 26, h * 0.88); g.lineTo(w * x, h * 0.84); g.fill(); }
  g.lineWidth = 12; g.lineCap = 'round'; g.strokeStyle = '#e83838';
  g.beginPath(); g.moveTo(w * 0.24, h * 0.9); g.lineTo(w * 0.4, h * 0.94); g.moveTo(w * 0.68, h * 0.9); g.lineTo(w * 0.52, h * 0.94); g.stroke(); g.lineCap = 'butt';
  disc(g, w * 0.53, h * 0.52, 6, '#e8e8f0'); disc(g, w * 0.52, h * 0.515, 2, '#ffffff');
  text(g, 'POKéMON', w / 2, h * 0.17, 26, '#ffd84a', '#1a2a7a');
});

/** The pinball's backglass: its name and a scene over the dot-matrix score. */
export const pinGlass = () => once('pin:glass', 320, 288, (g, w, h) => {
  const bg = g.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, w * 0.7); bg.addColorStop(0, '#7a4ae0'); bg.addColorStop(1, '#2a0a5a');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.1)';
  for (let k = 0; k < 16; k++) { g.beginPath(); g.moveTo(w / 2, h * 0.45); g.arc(w / 2, h * 0.45, w, k * 0.4, k * 0.4 + 0.18); g.fill(); }
  pokeball(g, w / 2, h * 0.47, 54);
  pikachu(g, w * 0.2, h * 0.58, 1.3); pikachu(g, w * 0.8, h * 0.58, 1.3, -1);
  g.save(); g.translate(w / 2, 38); g.font = '900 40px "Arial Black", Arial, sans-serif';
  const s = Math.min(1, (w - 30) / g.measureText('POKéMON PINBALL').width); g.scale(s, 1);
  glowOn(g, '#ffd84a', 18); text(g, 'POKéMON PINBALL', 0, 0, 40, '#ffe060', '#2a0a5a'); glowOff(g);
  g.restore();
  rr(g, 18, h - 66, w - 36, 52, 6, '#140a04');
  g.fillStyle = 'rgba(255,120,30,0.18)'; for (let y = h - 62; y < h - 18; y += 4) for (let x = 22; x < w - 22; x += 4) g.fillRect(x, y, 2, 2);
  glowOn(g, '#ff8a30', 12); text(g, '2,450,800', w / 2, h - 40, 34, '#ff9a40'); glowOff(g);
});

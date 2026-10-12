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
  voltorbflip(g, w, h) {
    g.fillStyle = '#2a8a58'; g.fillRect(0, 0, w, h);
    const cell = 30, x0 = 22, y0 = 18;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const x = x0 + c * (cell + 3), y = y0 + r * (cell + 3), up = (r * 3 + c * 7) % 9;
      rr(g, x, y, cell, cell, 4, up < 3 ? '#f8f0d8' : '#c87a40');
      if (up >= 3) { rr(g, x + 3, y + 3, cell - 6, cell - 6, 3, '#e8a058'); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1; g.strokeRect(x + 7, y + 7, cell - 14, cell - 14); }
      else if (up === 0) { disc(g, x + cell / 2, y + cell / 2, 11, '#e03838'); g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x + cell / 2, y + cell / 2, 11, 0, Math.PI); g.fill(); disc(g, x + cell / 2 - 4, y + cell / 2 - 3, 2, '#202028'); disc(g, x + cell / 2 + 4, y + cell / 2 - 3, 2, '#202028'); }
      else text(g, String(up + 1), x + cell / 2, y + cell / 2 + 1, 18, '#2a4a9a');
    }
    for (let r = 0; r < 5; r++) { const y = y0 + r * (cell + 3); rr(g, 196, y, 46, cell, 4, ['#e86060', '#58c058', '#f0a030', '#4a90f0', '#b060d0'][r]); text(g, String(4 + r), 210, y + 10, 11, '#ffffff'); disc(g, 228, y + 21, 5, '#f4f4f4'); text(g, String(r % 3), 210, y + 22, 11, '#202028'); }
    crt(g, w, h, false);
  },
  quizmachine(g, w, h) {
    const bg = g.createRadialGradient(w * 0.38, h * 0.5, 6, w * 0.38, h * 0.5, w * 0.7); bg.addColorStop(0, '#ffe060'); bg.addColorStop(0.35, '#4a9af0'); bg.addColorStop(1, '#1a3a8a');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,240,140,0.35)';
    for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(w * 0.38, h * 0.5); g.arc(w * 0.38, h * 0.5, w, k * TAU / 14, k * TAU / 14 + 0.2); g.fill(); }
    g.save(); g.translate(w * 0.38, h * 0.56); g.scale(2.6, 2.6);   // a Pikachu-ish silhouette
    g.fillStyle = '#141428';
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 6, -12); g.lineTo(sx * 14, -34); g.lineTo(sx * 15, -10); g.fill(); }
    oval(g, 0, 4, 18, 16, '#141428');
    g.beginPath(); g.moveTo(16, 8); g.lineTo(30, -6); g.lineTo(26, -12); g.lineTo(36, -22); g.lineTo(22, -8); g.lineTo(26, -4); g.closePath(); g.fill();
    g.restore();
    glowOn(g, '#ffffff', 10); text(g, '?', w * 0.8, h * 0.48, 92, '#ffffff', '#1a3a8a'); glowOff(g);
    text(g, 'WHO\'S THAT', w * 0.5, 18, 17, '#ffd84a', '#1a2a6a');
    crt(g, w, h, false);
  },
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
  crossingcabinet(g, w, h) {
    g.fillStyle = '#58a848'; g.fillRect(0, 0, w, h);
    rr(g, 0, 26, w, 58, 0, '#3a6ad0'); g.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = 0; x < w; x += 22) g.fillRect(x, 40 + (x % 3) * 12, 12, 2);
    for (const [x, y, l] of [[20, 34, 70], [150, 34, 80], [70, 60, 90]]) { rr(g, x, y, l, 16, 8, '#8a5a30'); g.fillStyle = '#6a4220'; g.fillRect(x + 6, y + 7, l - 12, 2); }
    oval(g, 210, 70, 24, 10, '#58a8e8'); disc(g, 226, 60, 8, '#58a8e8');
    rr(g, 0, 98, w, 64, 0, '#4a4a54'); g.fillStyle = '#f0e070'; for (let x = 6; x < w; x += 34) g.fillRect(x, 128, 18, 3);
    for (const [x, y] of [[60, 112], [180, 140]]) { oval(g, x, y, 22, 11, '#a8784a'); disc(g, x + 18, y - 6, 8, '#a8784a'); g.fillStyle = '#e8e0d0'; g.beginPath(); g.moveTo(x + 22, y - 12); g.lineTo(x + 30, y - 20); g.lineTo(x + 26, y - 8); g.fill(); }
    for (const x of [30, 100, 170, 240]) { oval(g, x, 12, 14, 7, '#3a8a3a'); }
    disc(g, w / 2, 178, 12, '#4a7ad8'); disc(g, w / 2, 180, 7, '#f4f4f4'); g.strokeStyle = '#202028'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, 180, 4, 0, TAU * 0.8); g.stroke();
    crt(g, w, h);
  },
  ekanscabinet(g, w, h) {
    g.fillStyle = '#16301a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,200,120,0.12)'; g.lineWidth = 1; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const path = [[40, 150], [56, 150], [72, 150], [88, 150], [104, 150], [104, 134], [104, 118], [120, 118], [136, 118], [152, 118], [152, 102], [152, 86], [168, 86]];
    path.forEach(([x, y], i) => disc(g, x, y, 9, i % 2 ? '#8a4ab8' : '#9a5ac8'));
    disc(g, 184, 86, 12, '#a86ad8'); disc(g, 188, 81, 3, '#f8d030'); disc(g, 188, 81, 1.4, '#202028'); disc(g, 190, 92, 3, '#f8d030');
    g.strokeStyle = '#e83838'; g.lineWidth = 2; g.beginPath(); g.moveTo(196, 88); g.lineTo(206, 86); g.moveTo(206, 86); g.lineTo(210, 82); g.moveTo(206, 86); g.lineTo(210, 90); g.stroke();
    for (const [x, y, c] of [[220, 40, '#e04848'], [60, 60, '#5a8ae0'], [200, 160, '#ffd84a']]) { disc(g, x, y, 7, c); g.fillStyle = '#3a8a3a'; g.fillRect(x - 1, y - 11, 2, 5); }
    crt(g, w, h);
  },
  invaderscabinet(g, w, h) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0a1028'); bg.addColorStop(1, '#1a2a5a'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) disc(g, (i * 67) % w, (i * 41) % h, 0.9, 'rgba(255,255,255,0.7)');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
      const x = 34 + c * 30, y = 34 + r * 24, body = r ? '#f0c030' : '#e88030';
      oval(g, x - 9, y - 4, 7, 4, 'rgba(220,240,255,0.7)', -0.4); oval(g, x + 9, y - 4, 7, 4, 'rgba(220,240,255,0.7)', 0.4);
      oval(g, x, y, 8, 6, body); g.fillStyle = '#202028'; g.fillRect(x - 8, y - 1, 16, 2); disc(g, x - 3, y - 3, 1.6, '#e03030'); disc(g, x + 3, y - 3, 1.6, '#e03030');
    }
    g.strokeStyle = '#fff070'; g.lineWidth = 3; g.beginPath(); g.moveTo(130, 160); g.lineTo(124, 140); g.lineTo(134, 130); g.lineTo(128, 112); g.stroke();
    pikachu(g, 130, 172, 0.9);
    crt(g, w, h);
  },
  breakoutcabinet(g, w, h) {
    g.fillStyle = '#16203a'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
      const x = 8 + c * 35, y = 26 + r * 18, col = r < 1 ? '#6a6460' : '#9a9088';
      rr(g, x, y, 32, 15, 6, col); disc(g, x + 10, y + 6, 1.6, '#202028'); disc(g, x + 20, y + 6, 1.6, '#202028');
    }
    const bx = 150, by = 132; disc(g, bx, by, 11, '#e84040'); g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(bx, by, 11, 0, Math.PI); g.fill();
    g.fillStyle = '#202028'; g.fillRect(bx - 11, by - 1, 22, 2); g.save(); g.translate(bx, by); g.rotate(-0.2); g.fillRect(-6, -6, 4, 2); g.fillRect(2, -6, 4, 2); g.restore();
    rr(g, 100, 172, 64, 9, 4, '#f4f4f4');
    crt(g, w, h);
  },
  singalongcabinet(g, w, h) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#3a1a5a'); bg.addColorStop(1, '#1a0c2a'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (const x of [64, 128, 192]) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x - 28, 0, 56, h); }
    g.fillStyle = '#f8f0f8'; g.fillRect(20, 160, w - 40, 3);
    for (const [x, y] of [[64, 60], [128, 120], [192, 90], [64, 150]]) { disc(g, x, y, 9, '#f8a8d0'); g.fillStyle = '#f8a8d0'; g.fillRect(x + 6, y - 24, 3, 24); g.fillRect(x + 6, y - 24, 10, 4); }
    disc(g, 40, 40, 20, '#f8b8d0'); disc(g, 33, 38, 4, '#3a8ad8'); disc(g, 47, 38, 4, '#3a8ad8'); g.fillStyle = '#f8b8d0'; g.beginPath(); g.moveTo(26, 24); g.lineTo(22, 14); g.lineTo(34, 22); g.moveTo(54, 24); g.lineTo(58, 14); g.lineTo(46, 22); g.fill();
    text(g, 'PERFECT!', 200, 30, 18, '#ffe060', '#5a1a40');
    crt(g, w, h, false);
  },
  bubblecabinet(g, w, h) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0c3a6a'); bg.addColorStop(1, '#2a8ac8'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const C = [['#3a8ae8', '#a8d4ff'], ['#e8523a', '#ffb8a0'], ['#4ab84a', '#b8f0a8'], ['#f0c020', '#fff0a0'], ['#b060d0', '#e8c0ff']];
    for (let r = 0; r < 4; r++) for (let c = 0; c < (r % 2 ? 9 : 10); c++) {
      if ((r * 3 + c) % 7 === 6 && r > 1) continue;
      const x = 13 + c * 25.5 + (r % 2 ? 12.7 : 0), y = 16 + r * 22, [base, light] = C[(r * 2 + c + (c > 4 ? 1 : 0)) % 5];
      disc(g, x, y, 12, base); disc(g, x - 4, y - 4, 4, light);
    }
    g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 8; i++) disc(g, 128 - i * 7, 168 - i * 12, 2, 'rgba(255,255,255,0.8)');
    g.strokeStyle = '#ff6a6a'; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(0, 150); g.lineTo(w, 150); g.stroke(); g.setLineDash([]);
    disc(g, 128, 176, 12, '#e8523a'); disc(g, 124, 172, 4, '#ffb8a0');
    disc(g, 82, 172, 16, '#78c0e8'); disc(g, 76, 168, 3, '#202028'); disc(g, 88, 168, 3, '#202028');
    text(g, '7 POPPED!', 190, 120, 18, '#ffe060', '#0a2a4a');
    crt(g, w, h, false);
  },
  berrycabinet(g, w, h) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#8ad0f8'); bg.addColorStop(1, '#d8f0ff'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a8a3a'; g.fillRect(0, 0, w, 26); g.fillStyle = '#4aa848'; for (let i = 0; i < 8; i++) disc(g, i * 36 + 10, 28, 20, '#4aa848');
    rr(g, 0, 164, w, 28, 0, '#6aba48');
    for (const [x, y, c, r] of [[52, 70, '#3a7ae0', 9], [128, 108, '#e84868', 9], [196, 60, '#ffd84a', 10], [90, 130, '#3a7ae0', 8]]) { disc(g, x, y, r, c); g.fillStyle = '#3a8a3a'; g.fillRect(x - 1, y - r - 5, 3, 6); }
    oval(g, 150, 152, 20, 14, '#f4f4f4'); disc(g, 150, 136, 13, '#f4f4f4'); g.fillStyle = '#4a9ae0'; g.fillRect(146, 124, 8, 30);
    disc(g, 174, 138, 12, '#4a9ae0'); disc(g, 144, 134, 2.4, '#202028'); disc(g, 156, 134, 2.4, '#202028'); disc(g, 140, 140, 3, '#f8d030'); disc(g, 160, 140, 3, '#f8d030');
    text(g, 'COMBO x3!', 60, 40, 18, '#ffe060', '#1a4a6a');
    crt(g, w, h, false);
  },
  dittocabinet(g, w, h) {
    const bg = g.createRadialGradient(w / 2, h * 0.6, 10, w / 2, h * 0.6, w * 0.7); bg.addColorStop(0, '#6a4a9a'); bg.addColorStop(1, '#2a1a4a'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    rr(g, 0, 140, w, 52, 0, '#4a2a2a');
    for (const x of [58, 128, 198]) { pokeball(g, x, 128, 28); }
    oval(g, 128, 64, 30, 20, '#c8a0e8'); disc(g, 118, 60, 2.4, '#202028'); disc(g, 138, 60, 2.4, '#202028'); g.strokeStyle = '#202028'; g.lineWidth = 2; g.beginPath(); g.arc(128, 66, 6, 0.2, Math.PI - 0.2); g.stroke();
    g.strokeStyle = '#ffd84a'; g.lineWidth = 3; for (const [x0, x1] of [[58, 128], [128, 198]]) { g.beginPath(); g.moveTo(x0, 92); g.quadraticCurveTo((x0 + x1) / 2, 76, x1, 92); g.stroke(); }
    text(g, '?', 200, 50, 40, '#ffffff', '#3a1a5a');
    crt(g, w, h, false);
  },
  bowlingcabinet(g, w, h) {
    g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8a868'; g.beginPath(); g.moveTo(w / 2 - 34, 20); g.lineTo(w / 2 + 34, 20); g.lineTo(w / 2 + 110, h); g.lineTo(w / 2 - 110, h); g.fill();
    g.strokeStyle = 'rgba(120,70,30,0.35)'; g.lineWidth = 1; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(w / 2 + k * 7, 20); g.lineTo(w / 2 + k * 24, h); g.stroke(); }
    for (const [i, j] of [[0, 3], [-1, 2], [1, 2], [-2, 1], [0, 1], [2, 1], [-3, 0], [-1, 0], [1, 0], [3, 0]]) {
      const x = w / 2 + i * 10, y = 34 + j * 9; disc(g, x, y, 7, '#8a8478'); disc(g, x - 2, y - 2, 2, '#b8b0a4'); disc(g, x - 2, y, 1, '#202028'); disc(g, x + 2, y, 1, '#202028');
    }
    pokeball(g, w / 2 + 14, 150, 20);
    text(g, 'STRIKE!', w / 2, 100, 26, '#ffe060', '#5a2a10');
    crt(g, w, h);
  },
  pokepuzzle(g, w, h) {
    g.fillStyle = '#1a2a3a'; g.fillRect(0, 0, w, h);
    const C = [['#e85a3a', '🔥'], ['#3a8ae0', '💧'], ['#4ab84a', '🍃'], ['#f0c030', '⚡'], ['#b060d0', '✦']];
    const s = 26, x0 = w / 2 - s * 3;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      if ((r * 7 + c * 3) % 6 === 5 && r > 2) continue;
      const k = (r * 2 + c + (r > 1 ? 1 : 0)) % 5, x = x0 + c * s, y = h - 10 - (r + 1) * s;
      rr(g, x + 1, y + 1, s - 2, s - 2, 6, C[k][0]); rr(g, x + 4, y + 3, s - 8, 5, 3, 'rgba(255,255,255,0.35)');
      disc(g, x + s / 2, y + s / 2 + 1, 5, 'rgba(255,255,255,0.75)');
    }
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(x0 + s * 2, h - 10 - 3 * s, s * 2, s);
    text(g, '2 CHAIN!', w / 2, 26, 22, '#ffe060', '#0a2a3a');
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

/* ---------- the casino games' pictures (2026-10-12, the user's ask: the six table games modelled too) ---------- */

const SUITS = { s: ['♠', '#202028'], h: ['♥', '#d82838'], d: ['♦', '#d82838'], c: ['♣', '#202028'] };
/** A playing card's face, 128 x 176: its rank and suit in two corners, a big pip in the middle. */
export const cardFace = (rank, suit) => once(`card:${rank}${suit}`, 128, 176, (g, w, h) => {
  const [pip, col] = SUITS[suit];
  rr(g, 0, 0, w, h, 12, '#fffaf0'); g.strokeStyle = '#d8d0c0'; g.lineWidth = 3; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 10); g.stroke();
  for (const [x, y, r] of [[22, 26, 0], [w - 22, h - 26, Math.PI]]) {
    g.save(); g.translate(x, y); g.rotate(r);
    text(g, rank, 0, 0, 30, col); text(g, pip, 0, 28, 24, col);
    g.restore();
  }
  text(g, pip, w / 2, h / 2 + 4, 70, col);
});
/** A card's back: a red Poké Ball pattern in a white border. */
export const cardBack = () => once('card:back', 128, 176, (g, w, h) => {
  rr(g, 0, 0, w, h, 12, '#fffaf0'); rr(g, 8, 8, w - 16, h - 16, 8, '#c82838');
  g.globalAlpha = 0.35;
  for (let y = 24; y < h; y += 34) for (let x = 24 + ((y / 34) % 2) * 17; x < w; x += 34) pokeball(g, x, y, 10);
  g.globalAlpha = 1;
  pokeball(g, w / 2, h / 2, 24);
});

/** A card table's felt seen from above, `w` x `h` for a table 2 x 1: Blackjack's betting arcs, or High-Low's arrows. */
export const feltArt = (kind) => once(`felt:${kind}`, 512, 256, (g, w, h) => {
  const bj = kind === 'blackjack', col = bj ? '#1e7a46' : '#1a4a9a';
  const bg = g.createRadialGradient(w / 2, h * 0.2, 20, w / 2, h * 0.4, w * 0.6); bg.addColorStop(0, shade(col, 1.25)); bg.addColorStop(1, shade(col, 0.75));
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,240,200,0.7)'; g.lineWidth = 3;
  if (bj) {
    g.beginPath(); g.ellipse(w / 2, 0, w * 0.36, h * 0.62, 0, 0.12, Math.PI - 0.12); g.stroke();
    g.font = '900 20px "Arial Black", Arial, sans-serif'; g.fillStyle = '#ffd84a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const say = 'BLACKJACK PAYS 3 TO 2';
    for (let i = 0; i < say.length; i++) {
      const a = Math.PI / 2 + (i - (say.length - 1) / 2) * 0.052;
      g.save(); g.translate(w / 2 + Math.cos(a) * w * 0.3, Math.sin(a) * h * 0.48); g.rotate(a - Math.PI / 2); g.fillText(say[i], 0, 0); g.restore();
    }
    text(g, 'DEALER MUST HIT SOFT 16', w / 2, h * 0.3, 13, 'rgba(255,240,200,0.8)');
    for (let i = 0; i < 5; i++) {
      const a = Math.PI / 2 + (i - 2) * 0.42, x = w / 2 + Math.cos(a) * w * 0.42, y = Math.sin(a) * h * 0.8;
      g.beginPath(); g.arc(x, y, 18, 0, TAU); g.stroke();
    }
    pokeball(g, w / 2, h * 0.14, 12);
  } else {
    text(g, 'HIGH', w * 0.2, h * 0.3, 34, '#7af07a'); text(g, 'LOW', w * 0.8, h * 0.3, 34, '#ff7a7a');
    for (const [x, up, c] of [[0.2, 1, '#7af07a'], [0.8, -1, '#ff7a7a']]) {
      g.fillStyle = c; g.beginPath(); g.moveTo(w * x, h * 0.55 - up * 30); g.lineTo(w * x - 26, h * 0.55 + up * 14); g.lineTo(w * x + 26, h * 0.55 + up * 14); g.fill();
    }
    g.beginPath(); g.roundRect(w * 0.36, h * 0.18, w * 0.28, h * 0.62, 12); g.stroke();
    text(g, 'LET IT RIDE', w / 2, h * 0.9, 18, '#ffd84a');
  }
});

/** A slot machine's reel strip, wrapped round its drum top to bottom: 7, Pikachu, cherries, a Poké Ball, BAR, a star. */
export const reelArt = () => once('reel', 112, 576, (g, w, h) => {
  const n = 6, ch = h / n;
  for (let i = 0; i < n; i++) {
    const x = w / 2, y = i * ch + ch / 2;
    g.fillStyle = i % 2 ? '#f6efe0' : '#fffaf0'; g.fillRect(0, i * ch, w, ch);
    if (i === 0) text(g, '7', x, y + 2, 76, '#d82838', '#7a1010');
    if (i === 1) pikachu(g, x, y + 6, 1.8);
    if (i === 2) { g.strokeStyle = '#3a8a3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 14, y + 6); g.quadraticCurveTo(x - 4, y - 30, x + 4, y - 32); g.moveTo(x + 16, y + 6); g.quadraticCurveTo(x + 10, y - 20, x + 4, y - 32); g.stroke(); disc(g, x - 14, y + 16, 17, '#d82838'); disc(g, x + 16, y + 16, 17, '#d82838'); disc(g, x - 19, y + 10, 5, '#ff9a9a'); disc(g, x + 11, y + 10, 5, '#ff9a9a'); }
    if (i === 3) pokeball(g, x, y, 36);
    if (i === 4) { rr(g, x - 46, y - 20, 92, 40, 8, '#202028'); text(g, 'BAR', x, y + 1, 32, '#ffd84a'); }
    if (i === 5) { g.fillStyle = '#ffd84a'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, r = k % 2 ? 16 : 40; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
  }
});

/** A slot machine's belly glass: JACKPOT over 7 7 7, the pay table under it. */
export const slotBelly = () => once('slot:belly', 256, 192, (g, w, h) => {
  const bg = g.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, w * 0.7); bg.addColorStop(0, '#ff6a6a'); bg.addColorStop(1, '#6a0a18');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,220,120,0.18)';
  for (let k = 0; k < 16; k++) { g.beginPath(); g.moveTo(w / 2, h * 0.42); g.arc(w / 2, h * 0.42, w, k * TAU / 16, k * TAU / 16 + 0.18); g.fill(); }
  glowOn(g, '#ffd84a', 14); text(g, 'JACKPOT', w / 2, 34, 40, '#ffe060', '#5a0a10'); glowOff(g);
  text(g, '7 7 7', w / 2, 92, 54, '#ffffff', '#a01020');
  rr(g, 22, 128, w - 44, 50, 8, 'rgba(20,8,12,0.75)');
  text(g, '777 ......... 150', w / 2, 144, 15, '#ffd84a'); text(g, 'PIKACHU ... FREE SPINS', w / 2, 164, 13, '#ffffff');
});

/** A Plinko board's face behind its pegs: deep blue, a Poké Ball drop at the top, the pay bins at the bottom. */
export const plinkoFace = () => once('plinko:face', 256, 512, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1c3a7a'); bg.addColorStop(1, '#0c1a3a');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(120,180,255,0.08)';
  for (let k = 0; k < 9; k++) g.fillRect(k * 32, 0, 1, h);
  text(g, 'PLINKO', w / 2, 30, 36, '#ffd84a', '#0a1430');
  const bins = [['10', '#ffd84a'], ['3', '#e85a3a'], ['1', '#3aa8d8'], ['0', '#5a6a80'], ['1', '#3aa8d8'], ['3', '#e85a3a'], ['10', '#ffd84a']], bw = (w - 16) / bins.length;
  bins.forEach(([t, c], i) => { rr(g, 8 + i * bw + 2, h - 70, bw - 4, 62, 6, c); text(g, t, 8 + i * bw + bw / 2, h - 38, 22, '#ffffff', 'rgba(0,0,0,0.4)'); });
  g.fillStyle = '#ffffff'; for (let i = 0; i <= bins.length; i++) g.fillRect(8 + i * bw - 2, h - 96, 4, 90);
});

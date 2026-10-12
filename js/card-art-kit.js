/* ============================================================
   card-art-kit.js  -  the brushes card-art.js and its batches
   (card-art-fire.js...) draw cards' pictures with: 48x48 grid,
   a dark outline. Gradient ids are written `$x` (see card-art.js).
   ============================================================ */

export const INK = '#1c1430';
export const f = (n) => +n.toFixed(2);
export const line = (w = 2.4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** A flame tongue standing on (cx, bottom), its tip at top, its body w wide. */
export function flame(cx, top, bottom, w) {
  const h = bottom - top, r = w / 2;
  return `M${f(cx)} ${f(top)}C${f(cx + 0.25 * r)} ${f(top + 0.22 * h)} ${f(cx + r)} ${f(top + 0.4 * h)} ${f(cx + r)} ${f(top + 0.68 * h)}`
    + `C${f(cx + r)} ${f(top + 0.9 * h)} ${f(cx + 0.55 * r)} ${f(bottom)} ${f(cx)} ${f(bottom)}`
    + `C${f(cx - 0.55 * r)} ${f(bottom)} ${f(cx - r)} ${f(top + 0.9 * h)} ${f(cx - r)} ${f(top + 0.68 * h)}`
    + `C${f(cx - r)} ${f(top + 0.5 * h)} ${f(cx - 0.6 * r)} ${f(top + 0.42 * h)} ${f(cx - 0.45 * r)} ${f(top + 0.3 * h)}`
    + `C${f(cx - 0.3 * r)} ${f(top + 0.4 * h)} ${f(cx - 0.12 * r)} ${f(top + 0.44 * h)} ${f(cx + 0.02 * r)} ${f(top + 0.45 * h)}`
    + `C${f(cx - 0.2 * r)} ${f(top + 0.28 * h)} ${f(cx - 0.12 * r)} ${f(top + 0.12 * h)} ${f(cx)} ${f(top)}Z`;
}

/** An n-pointed star's points. */
export function star(cx, cy, n, out, inn, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (rot + (i * 180) / n) * Math.PI / 180, r = i % 2 ? inn : out;
    pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
}

/** A pointed leaf from its stem (x, y), len long, pointing at angle degrees. */
export function leaf(x, y, len, angle, fill, w = 0.42) {
  const half = len * w / 2;
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M0 0C${f(len * 0.3)} ${-half * 2} ${f(len * 0.75)} ${-half * 1.6} ${len} 0C${f(len * 0.75)} ${f(half * 1.6)} ${f(len * 0.3)} ${f(half * 2)} 0 0Z" fill="${fill}" ${line(1.8)}/>
    <path d="M${f(len * 0.12)} 0H${f(len * 0.8)}" stroke="#1d5a2a" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>
  </g>`;
}

/** A water drop, round end at (cx, cy), pointing at angle degrees. */
export function drop(cx, cy, r, angle = -90) {
  return `<path transform="translate(${cx} ${cy}) rotate(${angle + 90})" d="M0 ${f(-r * 2.2)}C${f(r * 0.5)} ${f(-r * 1.2)} ${r} ${f(-r * 0.6)} ${r} 0A${r} ${r} 0 0 1 ${-r} 0C${-r} ${f(-r * 0.6)} ${f(-r * 0.5)} ${f(-r * 1.2)} 0 ${f(-r * 2.2)}Z" fill="#7cc8ff" ${line(1.5)}/>`;
}

/** A sine wave across from x0 to x1 at height y. */
export function sine(x0, x1, y, amp, waves) {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    pts.push(`${f(x0 + (x1 - x0) * t)} ${f(y + amp * Math.sin(t * waves * Math.PI * 2))}`);
  }
  return `M${pts.join('L')}`;
}

export function spiral(cx, cy, turns, rMax) {
  const pts = [], steps = Math.round(turns * 40);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = t * turns * Math.PI * 2;
    pts.push(`${f(cx + rMax * t * Math.cos(a))} ${f(cy + rMax * t * Math.sin(a))}`);
  }
  return `M${pts.join('L')}`;
}

/** A path drawn as a thick tube: ink under, colour over, a highlight on top. */
export const tube = (d, w, colour, shine) => `<path d="${d}" fill="none" ${line(w + 2.6)}/>
  <path d="${d}" fill="none" stroke="${colour}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
  ${shine ? `<path d="${d}" fill="none" stroke="${shine}" stroke-width="${f(w * 0.3)}" stroke-linecap="round" opacity="0.8" transform="translate(-0.6 -0.8)"/>` : ''}`;

export const sparkle = (x, y, r, fill = '#fff') =>
  `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`;

export const radial = (id, stops, cx = '50%', cy = '50%', r = '60%') =>
  `<radialGradient id="$${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
export const linear = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="$${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

export const HOT = [[0, '#fff7b0'], [0.4, '#ffbe3a'], [1, '#ee4a1c']];


/** The fire gradient every flame below fills with: put `hot` in a card's <defs>. */
export const hot = radial('h', HOT, '50%', '78%', '68%');

/** An outlined flame with its pale core, filled with `hot`. */
export const blaze = (cx, top, bottom, w, lw = 2.4, rot = 0) => {
  const h = bottom - top;
  const g = rot ? ` transform="rotate(${rot} ${cx} ${bottom})"` : '';
  return `<g${g}><path d="${flame(cx, top, bottom, w)}" fill="url(#$h)" ${line(lw)}/>
    <path d="${flame(cx + w * 0.02, top + h * 0.48, bottom - h * 0.05, w * 0.5)}" fill="#fff6b0"/></g>`;
};

/** Round puffs outlined as one shape (a cloud, smoke, cotton), lit up-left. */
export const puffs = (list, fill, lit, w = 1.3) =>
  list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${f(r + w)}" fill="${INK}"/>`).join('')
  + list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('')
  + (lit ? list.map(([x, y, r]) => `<circle cx="${f(x - r * 0.18)}" cy="${f(y - r * 0.2)}" r="${f(r * 0.72)}" fill="${lit}"/>`).join('') : '');

/** A fist seen from the front, centred on (x, y), 22 wide at scale 1. */
export const fist = (x, y, s = 1, rot = 0, fill = '#ffb27a', shade = '#d8784a') => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <rect x="-11" y="-10" width="22" height="20" rx="6.5" fill="${fill}" ${line(2.4 / s)}/>
    <path d="M-5.5 -9.6v8.6M0 -9.6v8.6M5.5 -9.6v8.6" stroke="${INK}" stroke-width="${f(1.5 / s)}" stroke-linecap="round"/>
    <path d="M-8.6 -7.5q1.6-1.6 3 0M-2.8 -7.5q1.5-1.6 3 0M2.8 -7.5q1.5-1.6 3 0" stroke="#fff" stroke-width="${f(1.2 / s)}" stroke-linecap="round" fill="none" opacity="0.8"/>
    <rect x="-12.5" y="0" width="15.5" height="7.4" rx="3.7" fill="${fill}" ${line(2 / s)}/>
    <path d="M-9 6.6h18" stroke="${shade}" stroke-width="${f(1.4 / s)}" stroke-linecap="round" opacity="0.7"/>
  </g>`;

/** A boot seen side-on, its toe to the right, its sole's middle on (x, y). */
export const boot = (x, y, s = 1, rot = 0, fill = '#e84a2a') => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-9 -16H0V-7C5 -7 10 -5.6 12.4 -3C14 -1.2 13.4 1.6 10.6 1.6H-9Z" fill="${fill}" ${line(2.4 / s)}/>
    <path d="M-9 -1.6H13" stroke="${INK}" stroke-width="${f(1.4 / s)}"/>
    <path d="M-9 -12H0" stroke="#fff" stroke-width="${f(1.6 / s)}" opacity="0.85"/>
    <path d="M-6.6 -9v4.4" stroke="#fff" stroke-width="${f(1.4 / s)}" stroke-linecap="round" opacity="0.6"/>
  </g>`;

/** A sun: its rays an n-pointed star behind a glowing disc. Needs a `sun` gradient in <defs> (sunDef). */
export const sunDef = radial('s', [[0, '#fffbe0'], [0.45, '#ffe060'], [1, '#ff9a20']], '42%', '40%', '70%');
export const sun = (cx, cy, r, n = 12) => `<polygon points="${star(cx, cy, n, r * 1.62, r * 1.08)}" fill="#ffb030" ${line(2)}/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#$s)" ${line(2.2)}/>
  <path d="M${f(cx - r * 0.62)} ${f(cy - r * 0.1)}A${f(r * 0.62)} ${f(r * 0.62)} 0 0 1 ${f(cx - r * 0.1)} ${f(cy - r * 0.62)}" stroke="#fff" stroke-width="${f(Math.max(1.2, r * 0.16))}" stroke-linecap="round" fill="none"/>`;

/** A gear's outline, n teeth. */
export function gear(cx, cy, r, n) {
  const pts = [];
  for (let i = 0; i < n * 4; i++) {
    const a = ((i + 0.5) * 90 / n - 90) * Math.PI / 180, rr = (i % 4) < 2 ? r : r * 0.78;
    pts.push(`${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`);
  }
  return pts.join(' ');
}

/** A thermometer standing on its bulb at (x, y), h tall, filled to `level` (0-1). */
export const thermo = (x, y, h, level, red = '#f0402a') => {
  const top = y - h, fillTop = y - 4 - (h - 8) * level;
  return `<rect x="${x - 4}" y="${top}" width="8" height="${h}" rx="4" fill="#f4f0ff" ${line(2.4)}/>
    <rect x="${x - 1.8}" y="${f(fillTop)}" width="3.6" height="${f(y - fillTop)}" rx="1.8" fill="${red}"/>
    <circle cx="${x}" cy="${y}" r="6.4" fill="${red}" ${line(2.4)}/>
    <circle cx="${x - 2}" cy="${y - 2}" r="1.8" fill="#ffc0b0"/>
    <path d="M${x + 4} ${top + 7}h-2.4M${x + 4} ${top + 12}h-2.4M${x + 4} ${top + 17}h-2.4" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`;
};

/** Speed lines trailing left from x, at the given heights. */
export const speed = (x, ys, len = 9) => ys.map((y, i) => `<path d="M${x - len + (i % 2) * 2} ${y}H${x}" ${line(2.2)}/><path d="M${x - len + (i % 2) * 2} ${y}H${x}" stroke="#fff" stroke-width="0.9" stroke-linecap="round"/>`).join('');

/** Small round embers: [x, y, r] each. */
export const embers = (list, fill = '#ffb030') => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${line(Math.min(1.4, r * 0.75))}/>`).join('');

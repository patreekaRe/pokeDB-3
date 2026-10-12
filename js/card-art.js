/* ============================================================
   card-art.js  -  cards' pictures as smooth vector art (the user's
   call, 2026-10-12: off pixels, and a picture of the move itself
   rather than an item pun). Drawn on a 48x48 grid with a dark
   outline, like js/smooth-icons.js. A card without a line here
   keeps its item sprite (cardSprite() in js/ui.js); upgraded copies
   use their base card's. ?pixelcards shows the old art for that
   page load, to compare.

   Gradient ids are written `$x` and made unique per card drawn: an
   <svg> whose gradients live in another, hidden card paints blank.
   ============================================================ */

const INK = '#1c1430';
const OFF = new URLSearchParams(location.search).has('pixelcards');
let drawn = 0;

const f = (n) => +n.toFixed(2);
const line = (w = 2.4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** A flame tongue standing on (cx, bottom), its tip at top, its body w wide. */
function flame(cx, top, bottom, w) {
  const h = bottom - top, r = w / 2;
  return `M${f(cx)} ${f(top)}C${f(cx + 0.25 * r)} ${f(top + 0.22 * h)} ${f(cx + r)} ${f(top + 0.4 * h)} ${f(cx + r)} ${f(top + 0.68 * h)}`
    + `C${f(cx + r)} ${f(top + 0.9 * h)} ${f(cx + 0.55 * r)} ${f(bottom)} ${f(cx)} ${f(bottom)}`
    + `C${f(cx - 0.55 * r)} ${f(bottom)} ${f(cx - r)} ${f(top + 0.9 * h)} ${f(cx - r)} ${f(top + 0.68 * h)}`
    + `C${f(cx - r)} ${f(top + 0.5 * h)} ${f(cx - 0.6 * r)} ${f(top + 0.42 * h)} ${f(cx - 0.45 * r)} ${f(top + 0.3 * h)}`
    + `C${f(cx - 0.3 * r)} ${f(top + 0.4 * h)} ${f(cx - 0.12 * r)} ${f(top + 0.44 * h)} ${f(cx + 0.02 * r)} ${f(top + 0.45 * h)}`
    + `C${f(cx - 0.2 * r)} ${f(top + 0.28 * h)} ${f(cx - 0.12 * r)} ${f(top + 0.12 * h)} ${f(cx)} ${f(top)}Z`;
}

/** An n-pointed star's points. */
function star(cx, cy, n, out, inn, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (rot + (i * 180) / n) * Math.PI / 180, r = i % 2 ? inn : out;
    pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
}

/** A pointed leaf from its stem (x, y), len long, pointing at angle degrees. */
function leaf(x, y, len, angle, fill, w = 0.42) {
  const half = len * w / 2;
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M0 0C${f(len * 0.3)} ${-half * 2} ${f(len * 0.75)} ${-half * 1.6} ${len} 0C${f(len * 0.75)} ${f(half * 1.6)} ${f(len * 0.3)} ${f(half * 2)} 0 0Z" fill="${fill}" ${line(1.8)}/>
    <path d="M${f(len * 0.12)} 0H${f(len * 0.8)}" stroke="#1d5a2a" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>
  </g>`;
}

/** A water drop, round end at (cx, cy), pointing at angle degrees. */
function drop(cx, cy, r, angle = -90) {
  return `<path transform="translate(${cx} ${cy}) rotate(${angle + 90})" d="M0 ${f(-r * 2.2)}C${f(r * 0.5)} ${f(-r * 1.2)} ${r} ${f(-r * 0.6)} ${r} 0A${r} ${r} 0 0 1 ${-r} 0C${-r} ${f(-r * 0.6)} ${f(-r * 0.5)} ${f(-r * 1.2)} 0 ${f(-r * 2.2)}Z" fill="#7cc8ff" ${line(1.5)}/>`;
}

/** A sine wave across from x0 to x1 at height y. */
function sine(x0, x1, y, amp, waves) {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    pts.push(`${f(x0 + (x1 - x0) * t)} ${f(y + amp * Math.sin(t * waves * Math.PI * 2))}`);
  }
  return `M${pts.join('L')}`;
}

function spiral(cx, cy, turns, rMax) {
  const pts = [], steps = Math.round(turns * 40);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = t * turns * Math.PI * 2;
    pts.push(`${f(cx + rMax * t * Math.cos(a))} ${f(cy + rMax * t * Math.sin(a))}`);
  }
  return `M${pts.join('L')}`;
}

/** A path drawn as a thick tube: ink under, colour over, a highlight on top. */
const tube = (d, w, colour, shine) => `<path d="${d}" fill="none" ${line(w + 2.6)}/>
  <path d="${d}" fill="none" stroke="${colour}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
  ${shine ? `<path d="${d}" fill="none" stroke="${shine}" stroke-width="${f(w * 0.3)}" stroke-linecap="round" opacity="0.8" transform="translate(-0.6 -0.8)"/>` : ''}`;

const sparkle = (x, y, r, fill = '#fff') =>
  `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`;

const radial = (id, stops, cx = '50%', cy = '50%', r = '60%') =>
  `<radialGradient id="$${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
const linear = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="$${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

const HOT = [[0, '#fff7b0'], [0.4, '#ffbe3a'], [1, '#ee4a1c']];

const ART = {
  /* ---------- Neutral ---------- */
  tackle: `<defs>${radial('a', [[0, '#fff'], [0.35, '#fff3a0'], [1, '#ffb030']])}</defs>
    <path d="M3 18h9M2 25h11M4 32h8" ${line(2.4)} opacity="0.85"/>
    <path d="M3 18h9M2 25h11M4 32h8" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
    <polygon points="${star(28, 24, 9, 19, 10, -80)}" fill="#ff7a2a" ${line()}/>
    <polygon points="${star(28, 24, 9, 12.5, 6.8, -60)}" fill="url(#$a)" ${line(1.8)}/>
    <circle cx="28" cy="24" r="3.4" fill="#fff"/>`,

  block: `<defs>${linear('a', [[0, '#eef2fa'], [0.55, '#b9c3d8'], [1, '#7e8aa8']], 1, 1)}</defs>
    <path d="M24 4L41 9.5V22C41 33 33.5 40.5 24 44.5C14.5 40.5 7 33 7 22V9.5Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 8.6L37 12.8V22C37 30.6 31.4 36.8 24 40" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.8"/>
    <path d="M24 8.6L11 12.8V22C11 30.6 16.6 36.8 24 40" fill="none" stroke="#5a6688" stroke-width="1.4" opacity="0.6"/>
    <path d="M24 4V44.5" stroke="${INK}" stroke-width="1.4" opacity="0.25"/>
    <circle cx="24" cy="23" r="6" fill="#f0c040" ${line(2)}/>
    <circle cx="22.4" cy="21.4" r="1.8" fill="#fff6c8"/>
    <path d="M13.5 13.5V21c0 3 .7 5.6 2 8" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>`,

  /* ---------- Fire ---------- */
  ember: `<defs>${radial('a', HOT, '50%', '75%', '65%')}</defs>
    <path d="${flame(24, 3.5, 44, 25)}" fill="url(#$a)" ${line(2.6)}/>
    <path d="${flame(24.4, 22, 42, 12)}" fill="#fff6b0"/>
    <path d="M15 33c-.4-3.4 1-6.4 3-8.4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.7"/>
    <circle cx="38" cy="13" r="1.9" fill="#ffb030" ${line(1.3)}/>
    <circle cx="9.5" cy="18" r="1.4" fill="#ffd040" ${line(1.2)}/>
    <circle cx="40.5" cy="24" r="1.1" fill="#ff7a2a" ${line(1)}/>`,

  'flame-body': `<defs>${linear('a', [[0, '#ff7a3a'], [1, '#b02a18']])}${radial('b', HOT, '50%', '80%', '70%')}</defs>
    <path d="${flame(10, 9, 36, 10)}" fill="url(#$b)" ${line(2.2)}/>
    <path d="${flame(38, 9, 36, 10)}" fill="url(#$b)" ${line(2.2)}/>
    <path d="${flame(24, 2, 22, 18)}" fill="url(#$b)" ${line(2.2)}/>
    <path d="M24 13L37 17.5V27C37 35 31 41 24 44.5C17 41 11 35 11 27V17.5Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 16.6L33.6 20V27C33.6 33 29.4 37.6 24 40.6" fill="none" stroke="#ffb27a" stroke-width="1.5" opacity="0.8"/>
    <path d="${flame(24, 20, 36.5, 10)}" fill="#ffd040" ${line(1.6)}/>
    <path d="${flame(24.2, 28, 35.5, 4.6)}" fill="#fff6c0"/>`,

  'flame-wall': `<defs>${radial('a', HOT, '50%', '85%', '70%')}${linear('b', [[0, '#a8968c'], [1, '#6c5a52']])}</defs>
    <path d="${flame(11, 13, 37, 12)}" fill="url(#$a)" ${line(2.2)}/>
    <path d="${flame(37, 13, 37, 12)}" fill="url(#$a)" ${line(2.2)}/>
    <path d="${flame(24, 3, 37, 16)}" fill="url(#$a)" ${line(2.4)}/>
    <path d="${flame(24, 19, 36, 7)}" fill="#fff6b0"/>
    <path d="${flame(11, 25, 36, 5)}" fill="#fff6b0"/>
    <path d="${flame(37, 25, 36, 5)}" fill="#fff6b0"/>
    <rect x="4" y="33" width="40" height="11" rx="2.4" fill="url(#$b)"/>
    <path d="M4 38.5h40M13 33v5.5M24 33v5.5M35 33v5.5M8.5 38.5V44M19 38.5V44M29.5 38.5V44M40 38.5V44" stroke="#4a3a34" stroke-width="1.3"/>
    <path d="M6 35h5M15 35h7M26 35h7" stroke="#d4c4ba" stroke-width="1.1" stroke-linecap="round"/>
    <rect x="4" y="33" width="40" height="11" rx="2.4" fill="none" ${line(2.4)}/>`,

  scorch: `<defs>${linear('a', [[0, '#fff0a0'], [0.4, '#ff9a30'], [1, '#e8401c']], 1, -0.9)}${radial('b', [[0, '#fff'], [0.4, '#fff3a0'], [1, '#ff8a24']], '40%', '40%', '65%')}</defs>
    <path d="M9 29C16 17 28 9 44 3C38 13 31 26 21 41Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M15 30C21 22 29 16 38 10C34 17 29 24 22 34Z" fill="#ffe070"/>
    <circle cx="15" cy="34" r="10" fill="url(#$b)" ${line(2.6)}/>
    <path d="M10 31.5a6 6 0 0 1 4-4.4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="40" cy="15" r="1.4" fill="#ffb030" ${line(1.1)}/>
    <circle cx="33" cy="30" r="1.2" fill="#ffd040" ${line(1)}/>`,

  'will-o-wisp': `<defs>${radial('a', [[0, '#f0ecff'], [0.45, '#a890ff'], [1, '#5a3ad8']], '50%', '75%', '65%')}${radial('b', [[0, '#e0f4ff'], [1, '#5a8cf0']], '50%', '75%', '70%')}</defs>
    <path d="${flame(9.5, 15, 31, 9)}" fill="url(#$b)" ${line(1.8)}/>
    <path d="${flame(39, 4, 20, 8.5)}" fill="url(#$b)" ${line(1.8)}/>
    <path d="${flame(24, 7, 45, 23)}" fill="url(#$a)" ${line(2.6)}/>
    <path d="${flame(24, 27, 43, 11)}" fill="#e8e2ff" opacity="0.85"/>
    <ellipse cx="19.5" cy="31" rx="2.2" ry="3.2" fill="${INK}"/>
    <ellipse cx="28.5" cy="31" rx="2.2" ry="3.2" fill="${INK}"/>
    <circle cx="20.2" cy="29.8" r="0.8" fill="#fff"/><circle cx="29.2" cy="29.8" r="0.8" fill="#fff"/>
    <path d="M21 37.5q3 2 6 0" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  /* ---------- Grass ---------- */
  'vine-whip': `${tube('M6 44C10 32 26 36 29 25C31.5 16 24 10 18.5 14C14 17.5 17.5 23 21.5 20.5', 4.6, '#4cae3c', '#a8e870')}
    ${leaf(12, 36.5, 10, -150, '#62c050')}
    ${leaf(25, 33, 9, 30, '#62c050')}
    ${leaf(29.5, 19, 8.5, -20, '#7ad05a')}
    <path d="M33 9l4-4M37.5 13l5.5-2.5M36 18.5l5.6.5" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,

  'cotton-guard': (() => {
    const puffs = [[16, 20, 8], [24, 16, 9], [32, 20, 8], [13, 28.5, 7], [35, 28.5, 7], [18, 36, 7], [30, 36, 7], [24, 39.5, 6.5], [24, 27, 10]];
    return `${leaf(22.5, 9, 9, -130, '#62c050')}${leaf(25.5, 9, 9, -50, '#7ad05a')}
      ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.3}" fill="${INK}"/>`).join('')}
      ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d8cdec"/>`).join('')}
      ${puffs.map(([x, y, r]) => `<circle cx="${f(x - 0.8)}" cy="${f(y - 1.2)}" r="${f(r - 1.4)}" fill="#fffaf2"/>`).join('')}
      <ellipse cx="19" cy="15.5" rx="3" ry="1.8" fill="#fff" transform="rotate(-30 19 15.5)"/>
      <ellipse cx="10.5" cy="26" rx="1.6" ry="2.6" fill="#fff"/>`;
  })(),

  'seed-bomb': `<defs>${linear('a', [[0, '#d8a060'], [1, '#7a4a24']], 1, 1)}</defs>
    <polygon points="${star(24, 25, 10, 22, 13, -72)}" fill="#ffc040" ${line(2.2)}/>
    <polygon points="${star(24, 25, 10, 15, 10, -54)}" fill="#fff0a0"/>
    <g transform="rotate(-25 24 26)">
      <ellipse cx="24" cy="27" rx="9.5" ry="12.5" fill="url(#$a)" ${line(2.6)}/>
      <path d="M24 15.5c-3 4-3.6 15-.2 23" stroke="#f0d0a0" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.8"/>
      <ellipse cx="20" cy="22" rx="1.8" ry="3.6" fill="#fff" opacity="0.6"/>
    </g>
    ${leaf(20, 14, 9, -120, '#62c050')}
    <path d="M37 8l2.5-3.5M41 14l4-1M8 10l-3-3" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,

  absorb: `<defs>${radial('a', [[0, '#fff'], [0.4, '#d8ffb0'], [1, '#5ccc3c']])}${linear('b', [[0, '#9ae060'], [1, '#2e8a2c']], 1, 1)}</defs>
    <path d="M8 40C6 26 16 12 38 8C42 26 32 40 8 40Z" fill="url(#$b)" ${line(2.6)}/>
    <path d="M9 39C17 30 26 20 36 10.5M17 32l-1.6-8M23 26l-.4-9M28.5 20.4l1-7M17 32l8.4 .4M23 26l8.6-.6M28.5 20.4l6 .6" stroke="#1d5a2a" stroke-width="1.2" stroke-linecap="round" opacity="0.55" fill="none"/>
    <path d="M12 33c1-6 5-12 11-16" stroke="#e0ffb8" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.8"/>
    <circle cx="39" cy="38" r="4.6" fill="url(#$a)" ${line(1.8)}/>
    <circle cx="43" cy="28" r="3" fill="url(#$a)" ${line(1.5)}/>
    <circle cx="31" cy="44" r="2.2" fill="url(#$a)" ${line(1.3)}/>
    ${sparkle(44.5, 41.5, 2.4, '#e8ffd0')}`,

  /* ---------- Water ---------- */
  'water-gun': `<defs>${linear('a', [[0, '#bfe8ff'], [1, '#2a7ce0']], 1, 1)}</defs>
    ${tube('M5 43C12 30 22 20 34 15', 8, '#4aa8f8', '#d0f0ff')}
    ${drop(37.5, 10, 2.6, -60)}${drop(43, 17.5, 2.3, -10)}${drop(39, 23.5, 2, 30)}${drop(31, 7.5, 1.9, -110)}
    <circle cx="35" cy="15" r="4.8" fill="url(#$a)" ${line(2)}/>
    <circle cx="33.6" cy="13.6" r="1.4" fill="#fff"/>
    <path d="M9 34.5c2.4-3.8 5-7 8-9.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.9"/>`,

  'water-pulse': `<defs>${radial('a', [[0, '#fff'], [0.3, '#bfe8ff'], [1, '#2a74d8']], '38%', '35%', '70%')}</defs>
    <path d="M7.5 17A18 18 0 0 1 17 7.5M31 7.5A18 18 0 0 1 40.5 17M40.5 31A18 18 0 0 1 31 40.5M17 40.5A18 18 0 0 1 7.5 31" fill="none" ${line(4.6)}/>
    <path d="M7.5 17A18 18 0 0 1 17 7.5M31 7.5A18 18 0 0 1 40.5 17M40.5 31A18 18 0 0 1 31 40.5M17 40.5A18 18 0 0 1 7.5 31" fill="none" stroke="#8ad4ff" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="14" fill="none" ${line(3.8)}/>
    <circle cx="24" cy="24" r="14" fill="none" stroke="#5ab8ff" stroke-width="1.8"/>
    <circle cx="24" cy="24" r="9" fill="url(#$a)" ${line(2.4)}/>
    <path d="M17.5 25.5q3.2-2.6 6.5 0t6.5 0" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <circle cx="21" cy="20.5" r="1.8" fill="#fff"/>`,

  withdraw: `<defs>${radial('a', [[0, '#e8b060'], [1, '#9a5e26']], '40%', '35%', '70%')}</defs>
    <ellipse cx="24" cy="25" rx="20" ry="17" fill="#f6e4aa" ${line(2.6)}/>
    <ellipse cx="24" cy="23.5" rx="15.5" ry="13" fill="url(#$a)" ${line(2)}/>
    <path d="M19.5 16.5h9l4 7-4 7h-9l-4-7Z" fill="#c88440" ${line(1.6)}/>
    <path d="M19.5 16.5L15 11.5M28.5 16.5L33 11.5M32.5 23.5H39.5M28.5 30.5L32.5 35M19.5 30.5L15.5 35M15.5 23.5H8.5" ${line(1.6)}/>
    <path d="M13 17.5c2-3.6 5.4-6 9.4-6.6" stroke="#ffe0a8" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M7.5 31c3.8 5.4 10 8.4 16.5 8.4S36.7 36.4 40.5 31" stroke="#d8c088" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  bubble: (() => {
    const b = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$a)" ${line(r > 6 ? 2.4 : 1.8)}/>
      <path d="M${f(x - r * 0.62)} ${f(y - r * 0.05)}A${f(r * 0.62)} ${f(r * 0.62)} 0 0 1 ${f(x - r * 0.05)} ${f(y - r * 0.62)}" stroke="#fff" stroke-width="${f(Math.max(1, r * 0.17))}" stroke-linecap="round" fill="none"/>
      <circle cx="${f(x + r * 0.42)}" cy="${f(y + r * 0.42)}" r="${f(r * 0.1)}" fill="#fff" opacity="0.8"/>`;
    return `<defs>${radial('a', [[0, '#f4fbff'], [0.6, '#b2e2ff'], [1, '#4a9ef0']], '35%', '30%', '75%')}</defs>
      ${b(19, 29, 13)}${b(36, 17, 7.5)}${b(37.5, 35, 5)}${b(11, 9.5, 3.6)}${b(26, 7, 2.6)}`;
  })(),

  dive: `<defs>${linear('a', [[0, '#7cd0ff'], [1, '#1a4ea8']])}</defs>
    <path d="M3 44C6 30 15 13 30 9.5C40 7.5 46.5 15 44 23C42 29 34.5 30.5 32 25.5C30.2 21.6 33.4 18 37 20.4C36 16.4 31.6 15.4 27.6 17.6C19.4 22 17 34 19 44Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M30 12.5C38 10.8 43 15.6 41.6 21.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M8 38C10 29 15 21 22 16" stroke="#c8ecff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.8"/>
    <circle cx="38" cy="25.5" r="1.3" fill="#fff"/><circle cx="43" cy="28.5" r="1" fill="#fff"/>
    <path d="M17 44.5C22 37 33 34.5 45 38.5V44.5Z" fill="#4a9ef0" ${line(2.2)}/>
    <path d="M24 39.6c5-2.6 11-3 17-1.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.9"/>`,

  /* ---------- Psychic ---------- */
  psywave: (() => {
    const w = (y, c, amp) => tube(sine(5, 43, y, amp, 2), 3.2, c, '#fff');
    return `${w(13, '#ff7ad8', 3.6)}${w(24, '#c070f8', 4.2)}${w(35, '#ff9ae6', 3.6)}
      ${sparkle(43.5, 6.5, 3, '#ffe0f6')}${sparkle(5, 43, 2.4, '#f0d8ff')}`;
  })(),

  'psychic-guard': (() => {
    const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
      const a = (60 * i - 90) * Math.PI / 180;
      return `${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`;
    }).join(' ');
    const cells = [[24, 24], [24, 13.6], [24, 34.4], [15, 18.8], [33, 18.8], [15, 29.2], [33, 29.2]];
    return `<defs>${linear('a', [[0, '#ffd0f4'], [1, '#c060e8']], 1, 1)}</defs>
      <polygon points="${hex(24, 24, 21)}" fill="url(#$a)" ${line(2.6)}/>
      ${cells.map(([x, y]) => `<polygon points="${hex(x, y, 6)}" fill="#fff" fill-opacity="0.18" stroke="#fff" stroke-width="1.1" stroke-opacity="0.75"/>`).join('')}
      <path d="M11 13.5L20 8.3" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M14 34l18-21" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
      ${sparkle(37, 34, 2.6)}`;
  })(),

  'psychic-confusion': `<defs>${linear('a', [[0, '#ff8ae0'], [1, '#8a40e0']], 1, 1)}</defs>
    ${tube(spiral(24, 25, 2.6, 15.5), 3.4, 'url(#$a)', '#ffd8f6')}
    <polygon points="${star(9, 10, 5, 4.6, 2, -90)}" fill="#ffd040" ${line(1.6)}/>
    <polygon points="${star(40, 9.5, 5, 3.6, 1.6, -70)}" fill="#ffd040" ${line(1.4)}/>
    <polygon points="${star(41, 40, 5, 4, 1.8, -100)}" fill="#ffd040" ${line(1.5)}/>`,

  psystrike: `<defs>${radial('a', [[0, '#ffe8fa'], [0.55, '#ff6ad0'], [1, '#a040e0']])}${radial('b', [[0, '#fff'], [0.45, '#ffc8f2'], [1, '#d060f0']], '40%', '38%', '70%')}</defs>
    <polygon points="${star(24, 24, 12, 22, 11, -90)}" fill="url(#$a)" ${line(2.4)}/>
    <polygon points="${star(24, 24, 12, 14, 9, -75)}" fill="#ffb0ec" opacity="0.8"/>
    <circle cx="24" cy="24" r="7.6" fill="url(#$b)" ${line(2)}/>
    <circle cx="21.8" cy="21.8" r="2" fill="#fff"/>
    <path d="M4 7l5 3-3 2ZM44 41l-5.4-2 2.4-2.6ZM43 5l-3 5-1.6-3Z" fill="#e8a0ff" ${line(1.3)}/>`,
};

/** The card's smooth picture in its art window, or null to keep the item sprite. */
export function cardArt(card) {
  const svg = !OFF && ART[(card.orig || card).id.replace(/\+$/, '')];
  if (!svg) return null;
  const tag = `ca${(drawn++).toString(36)}`;
  const art = document.createElement('div');
  art.className = 'card-art';
  art.innerHTML = `<svg class="card-svg" viewBox="0 0 48 48" aria-hidden="true">${svg.replaceAll('$', tag)}</svg>`;
  return art;
}

export const CARD_ART_IDS = Object.keys(ART);

/* ============================================================
   card-art-ground.js  -  Ground's cards (the Safari's duo pool,
   docs/duo-design.md section 5), in the smooth card art's style
   (48x48, dark outline; see card-art.js).
   ============================================================ */

import { INK, f, line, star, sparkle, linear, radial, spiral, tube, puffs, speed } from './card-art-kit.js';

const SAND = '#ecc878', SAND_DARK = '#b88c48', DIRT = '#a8743c', DIRT_DARK = '#6a4220', ROCK = '#aaa294', ROCK_DARK = '#6c665a', BONE = '#f6eedc';
const earth = linear('e', [[0, '#c8904c'], [0.5, '#9a6630'], [1, '#5e3818']]);
const dune = linear('d', [[0, '#fbe6a8'], [0.6, '#e8c070'], [1, '#c09048']]);
const stoneG = radial('r', [[0, '#e0dace'], [0.55, '#aaa294'], [1, '#6c665a']], '38%', '34%', '75%');

/** A strip of earth from y down to the card's foot, its top edge a little uneven. */
const ground = (y, fill = 'url(#$e)') => `<path d="M-2 ${y}Q8 ${y - 2} 16 ${y}T32 ${y}T50 ${y}V50H-2Z" fill="${fill}" ${line(2.2)}/>`;
/** A heap of dirt: its foot from cx - w/2 to cx + w/2 on y, h tall. */
const heap = (cx, y, w, h, fill = 'url(#$e)') => `<path d="M${f(cx - w / 2)} ${y}Q${f(cx - w / 4)} ${f(y - h * 1.1)} ${cx} ${f(y - h)}Q${f(cx + w / 4)} ${f(y - h * 1.1)} ${f(cx + w / 2)} ${y}Z" fill="${fill}" ${line(2.2)}/>
    <path d="M${f(cx - w / 4)} ${f(y - h * 0.62)}Q${f(cx - w / 8)} ${f(y - h * 0.9)} ${f(cx + w / 10)} ${f(y - h * 0.86)}" fill="none" stroke="#e8b878" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`;
/** A hole seen at a slant, its middle on (cx, cy). */
const hole = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${f(rx + 2)}" ry="${f(ry + 1.6)}" fill="${DIRT}" ${line(2)}/>
    <ellipse cx="${cx}" cy="${f(cy + 0.4)}" rx="${rx}" ry="${ry}" fill="#2a1a10" ${line(1.4)}/>`;
/** A rough stone, r across its middle, its corners fixed so it reads the same every time. */
const stone = (cx, cy, r, fill = 'url(#$r)', rot = 0) => {
  const k = [1, 0.84, 0.98, 0.8, 1.04, 0.86, 0.95, 0.82];
  const pts = k.map((m, i) => { const a = ((i * 45 + rot) * Math.PI) / 180; return `${f(cx + r * m * Math.cos(a))},${f(cy + r * m * 0.86 * Math.sin(a))}`; }).join(' ');
  return `<polygon points="${pts}" fill="${fill}" ${line(2.2)}/>
    <path d="M${f(cx - r * 0.5)} ${f(cy - r * 0.3)}L${f(cx - r * 0.1)} ${f(cy - r * 0.55)}" stroke="#fff" stroke-width="${f(Math.max(1.1, r * 0.14))}" stroke-linecap="round" opacity="0.75"/>`;
};
/** A crack in the ground along d: dark, with a lit lip. */
const crack = (d, w = 3) => `<path d="${d}" fill="none" ${line(w + 2)}/>
    <path d="${d}" fill="none" stroke="#2a1a10" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="#ffd890" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" transform="translate(0.8 -1)"/>`;
/** A bone from (x1, y1) to (x2, y2). */
const bone = (x1, y1, x2, y2, r = 3) => {
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * r * 0.8, ny = Math.cos(a) * r * 0.8;
  const knob = (x, y) => `<circle cx="${f(x + nx)}" cy="${f(y + ny)}" r="${r}" fill="${BONE}" ${line(1.8)}/><circle cx="${f(x - nx)}" cy="${f(y - ny)}" r="${r}" fill="${BONE}" ${line(1.8)}/>`;
  return `${knob(x1, y1)}${knob(x2, y2)}${tube(`M${x1} ${y1}L${x2} ${y2}`, r * 1.4, BONE, '#fff')}
    <circle cx="${f(x1 + nx)}" cy="${f(y1 + ny)}" r="${f(r - 1)}" fill="${BONE}"/><circle cx="${f(x1 - nx)}" cy="${f(y1 - ny)}" r="${f(r - 1)}" fill="${BONE}"/>
    <circle cx="${f(x2 + nx)}" cy="${f(y2 + ny)}" r="${f(r - 1)}" fill="${BONE}"/><circle cx="${f(x2 - nx)}" cy="${f(y2 - ny)}" r="${f(r - 1)}" fill="${BONE}"/>`;
};
/** A drill bit pointing `rot` degrees (0 = down), its tip at (x, y), h long. */
const drill = (x, y, h, rot = 0, fill = '#d0d8e8') => `<g transform="translate(${x} ${y}) rotate(${rot})">
    <path d="M0 0L${f(-h * 0.32)} ${f(-h)}H${f(h * 0.32)}Z" fill="${fill}" ${line(2.2)}/>
    <path d="M${f(-h * 0.26)} ${f(-h * 0.82)}L${f(h * 0.2)} ${f(-h * 0.62)}M${f(-h * 0.18)} ${f(-h * 0.56)}L${f(h * 0.13)} ${f(-h * 0.38)}M${f(-h * 0.1)} ${f(-h * 0.3)}L${f(h * 0.06)} ${f(-h * 0.16)}" stroke="#6a7894" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="${f(-h * 0.4)}" y="${f(-h - 5)}" width="${f(h * 0.8)}" height="5" rx="1.5" fill="#ffd84a" ${line(2)}/>
  </g>`;
/** A whirl of sand on (cx, cy). */
const whirl = (cx, cy, r, turns = 2.2) => tube(spiral(cx, cy, turns, r), 3, SAND, '#fff6d0');
/** Grains of sand: [x, y, r]. */
const grains = (list, fill = SAND) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${line(1)}/>`).join('');
/** An arrow up out of the ground, its head at (x, y): what a dug card does next turn. */
const rise = (x, y, h = 12, colour = '#ffd84a') => `${tube(`M${x} ${y + h}V${y + 4}`, 3.4, colour, '#fff')}
    <polygon points="${x},${y - 3} ${x - 5.4},${y + 4} ${x + 5.4},${y + 4}" fill="${colour}" ${line(2)}/>`;
/** A pick-axe, its head's middle on (x, y), turned `rot`. */
const pick = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <rect x="-1.8" y="-2" width="3.6" height="24" rx="1.6" fill="#c07838" ${line(2 / s)}/>
    <path d="M-15 4Q-8 -5 0 -5Q8 -5 15 4Q8 -1 0 -1Q-8 -1 -15 4Z" fill="#c8d0e0" ${line(2.2 / s)}/>
    <path d="M-9 -1.6Q-4 -4 0 -3.8" stroke="#fff" stroke-width="${f(1.2 / s)}" stroke-linecap="round" fill="none"/>
  </g>`;
/** Shaking lines either side of (cx, cy). */
const shake = (cx, cy, w) => `<path d="M${f(cx - w)} ${cy - 5}l-3 2.5 3 2.5-3 2.5M${f(cx + w)} ${cy - 5}l3 2.5-3 2.5 3 2.5" fill="none" ${line(1.8)}/>`;
/** A sandy shield face-on. */
const sandShield = (cx, cy, r) => `<path d="M${cx} ${f(cy - r)}L${f(cx + r * 0.9)} ${f(cy - r * 0.62)}V${f(cy + r * 0.05)}Q${f(cx + r * 0.85)} ${f(cy + r * 0.8)} ${cx} ${f(cy + r * 1.05)}Q${f(cx - r * 0.85)} ${f(cy + r * 0.8)} ${f(cx - r * 0.9)} ${f(cy + r * 0.05)}V${f(cy - r * 0.62)}Z" fill="url(#$d)" ${line(2.4)}/>
    <path d="M${f(cx - r * 0.55)} ${f(cy - r * 0.15)}Q${cx} ${f(cy - r * 0.45)} ${f(cx + r * 0.55)} ${f(cy - r * 0.15)}M${f(cx - r * 0.5)} ${f(cy + r * 0.25)}Q${cx} ${f(cy - r * 0.05)} ${f(cx + r * 0.5)} ${f(cy + r * 0.25)}" fill="none" stroke="${SAND_DARK}" stroke-width="1.6" stroke-linecap="round"/>`;
/** A desert sun's haze: a pale disc behind a band of blown sand. */
const haze = `<circle cx="34" cy="13" r="8" fill="#fff0c0" ${line(2)}/><circle cx="34" cy="13" r="5" fill="#ffe08a"/>`;
/** Streaks of wind-blown sand across y. */
const blown = (ys, x0 = 4, x1 = 44) => ys.map((y, i) => `<path d="M${x0 + i * 3} ${y}Q${(x0 + x1) / 2} ${y - 3} ${x1 - i * 2} ${y}" fill="none" stroke="${SAND_DARK}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M${x0 + i * 3} ${y}Q${(x0 + x1) / 2} ${y - 3} ${x1 - i * 2} ${y}" fill="none" stroke="${SAND}" stroke-width="1.3" stroke-linecap="round"/>`).join('');
/** A mud splat on (cx, cy). */
const splat = (cx, cy, r, fill = DIRT) => `<polygon points="${star(cx, cy, 9, r, r * 0.62, -80)}" fill="${fill}" ${line(2)}/>
    <circle cx="${f(cx - r * 0.25)}" cy="${f(cy - r * 0.25)}" r="${f(r * 0.22)}" fill="#d8a868"/>`;
/** A mound with an antlion's eyes peeping out: Trapinch's pit. */
const peeper = (cx, cy) => `<circle cx="${cx - 4}" cy="${cy}" r="2.4" fill="#fff" ${line(1.4)}/><circle cx="${cx + 4}" cy="${cy}" r="2.4" fill="#fff" ${line(1.4)}/>
    <circle cx="${f(cx - 3.6)}" cy="${f(cy + 0.4)}" r="1.1" fill="${INK}"/><circle cx="${f(cx + 4.4)}" cy="${f(cy + 0.4)}" r="1.1" fill="${INK}"/>`;

export const GROUND = {
  'mud-shot': `<defs>${earth}</defs>
    ${speed(14, [16, 24, 32], 10)}
    ${splat(32, 24, 10)}
    ${grains([[42, 14, 1.8], [44, 32, 1.6], [24, 38, 1.4]], DIRT)}`,

  'sand-veil': `<defs>${dune}</defs>
    ${sandShield(24, 22, 15)}
    ${grains([[7, 12, 1.6], [42, 10, 1.4], [6, 36, 1.4], [43, 38, 1.8]])}`,

  bulldoze: `<defs>${earth}</defs>
    ${ground(38)}
    ${crack('M4 41L12 39L18 43L26 39L34 42L44 39')}
    ${stone(16, 24, 8, 'url(#$e)')}${stone(32, 20, 9, 'url(#$e)', 20)}
    ${shake(24, 26, 19)}`,

  'sand-attack': `<defs>${dune}</defs>
    ${sandShield(17, 24, 12)}
    ${blown([16, 24, 32], 22, 46)}
    ${grains([[44, 12, 1.8], [42, 38, 1.6]])}`,

  dig: `<defs>${earth}</defs>
    ${ground(30)}
    ${hole(24, 35, 9, 3.6)}
    ${heap(9, 30, 12, 6)}${heap(39, 30, 12, 7)}
    ${pick(25, 13, 0.8, -30)}`,

  tunnel: `<defs>${earth}</defs>
    ${ground(20)}
    <path d="M6 34Q14 26 24 34T42 34" fill="none" stroke="#2a1a10" stroke-width="7" stroke-linecap="round"/>
    <path d="M6 34Q14 26 24 34T42 34" fill="none" stroke="#4a2e18" stroke-width="3.4" stroke-linecap="round"/>
    ${hole(10, 21, 5, 2)}${rise(38, 8, 8)}`,

  'mud-bomb': `<defs>${radial('m', [[0, '#d0a060'], [0.6, '#9a6630'], [1, '#5e3818']], '38%', '34%')}</defs>
    <circle cx="22" cy="28" r="13" fill="url(#$m)" ${line(2.4)}/>
    <circle cx="17" cy="23" r="2.4" fill="#e8c088"/>
    <path d="M31 18Q36 10 42 10" fill="none" ${line(2.2)}/><path d="M42 10l3-3M42 10l4 1" ${line(1.8)}/>
    ${sparkle(44, 8, 3, '#ffd84a')}`,

  bonemerang: `${tube('M8 34Q24 4 40 34', 2, '#ffffff')}
    <path d="M8 34Q24 4 40 34" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.6"/>
    ${bone(14, 30, 34, 16, 3)}`,

  sandstorm: `<defs>${dune}</defs>
    ${haze}
    ${whirl(18, 24, 12, 2.4)}
    ${blown([34, 41], 4, 46)}
    ${grains([[38, 26, 1.6], [42, 30, 1.2], [8, 10, 1.4]])}`,

  'mud-slap': `<defs>${earth}</defs>
    <path d="M10 14Q16 6 24 10L34 20Q38 26 32 30L22 34Q14 36 12 28Z" fill="#ffb27a" ${line(2.2)}/>
    <path d="M14 20L24 14M16 25L27 18" stroke="#d8784a" stroke-width="1.2" stroke-linecap="round"/>
    ${splat(36, 34, 8)}${grains([[44, 24, 1.6], [42, 44, 1.4], [28, 42, 1.4]], DIRT)}`,

  'drill-run': `<defs>${earth}</defs>
    ${ground(26)}
    ${drill(30, 40, 20, -30)}
    ${grains([[14, 24, 2], [10, 20, 1.6], [18, 21, 1.4]], DIRT)}
    ${speed(16, [10, 16], 6)}`,

  'earth-power': `<defs>${earth}${stoneG}${radial('g', [[0, '#fff6b0'], [0.5, '#ffb030'], [1, '#e85a10']], '50%', '80%')}</defs>
    ${ground(34)}
    ${crack('M24 34L21 40L26 44', 2.6)}
    <path d="M14 34Q18 16 24 6Q30 16 34 34Z" fill="url(#$g)" ${line(2.2)}/>
    <path d="M20 34Q22 22 24 14Q26 22 28 34Z" fill="#fff6c0"/>
    ${stone(8, 20, 4.4)}${stone(40, 16, 4)}`,

  'shore-up': `<defs>${dune}</defs>
    <path d="M2 40Q24 26 46 40V48H2Z" fill="#5cb4f0" ${line(2)}/>
    ${heap(24, 38, 34, 20, 'url(#$d)')}
    <rect x="18" y="12" width="12" height="9" fill="#e8c070" ${line(2)}/>
    <path d="M18 12V9h3v3M22.5 12V9h3v3M27 12V9h3v3" fill="#e8c070" ${line(1.6)}/>`,

  'arena-trap': `<defs>${dune}</defs>
    <path d="M2 18Q24 12 46 18L28 40Q24 44 20 40Z" fill="url(#$d)" ${line(2.4)}/>
    <path d="M10 20L22 36M38 20L26 36M24 16V34" stroke="${SAND_DARK}" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
    ${peeper(24, 33)}`,

  spikes: `<defs>${earth}</defs>
    ${ground(36)}
    ${[10, 20, 30, 40].map((x, i) => `<polygon points="${x - 4},37 ${x},${22 - (i % 2) * 4} ${x + 4},37" fill="#c8d0e0" ${line(2)}/><path d="M${x - 1.4} 33L${x - 0.4} ${26 - (i % 2) * 4}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`).join('')}
    ${rise(24, 6, 6, SAND)}`,

  sinkhole: `<defs>${dune}</defs>
    <path d="M2 22Q24 16 46 22V48H2Z" fill="url(#$d)" ${line(2.2)}/>
    ${hole(24, 32, 14, 6)}
    ${tube(spiral(24, 32, 1.6, 11), 1.6, SAND_DARK)}
    ${grains([[10, 14, 1.6], [38, 12, 1.4], [30, 8, 1.2]])}`,

  earthquake: `<defs>${earth}${stoneG}</defs>
    ${ground(30)}
    ${crack('M4 34L14 30L18 38L26 32L30 42L38 34L46 38', 3.4)}
    ${stone(12, 18, 6)}${stone(34, 16, 7, 'url(#$r)', 30)}
    ${shake(23, 18, 20)}`,

  'mud-sport': `<defs>${earth}</defs>
    <path d="M4 34Q24 26 44 34V44H4Z" fill="url(#$e)" ${line(2.2)}/>
    <ellipse cx="24" cy="34" rx="12" ry="3" fill="#5e3818"/>
    ${puffs([[12, 20, 4], [20, 14, 5], [30, 15, 4.6], [37, 22, 3.6]], '#b8844a', '#d8a868')}`,

  'stomping-tantrum': `<defs>${earth}</defs>
    ${ground(36)}
    <path d="M12 34V14Q12 8 18 8H26Q32 8 32 14V28L38 30Q42 31 42 34Z" fill="#9a8a6a" ${line(2.4)}/>
    <path d="M18 34V30M24 34V30M30 34V31" ${line(1.8)}/>
    ${crack('M6 40L14 38L20 42L28 38', 2.4)}${shake(26, 18, 18)}`,

  quicksand: `<defs>${dune}</defs>
    <path d="M2 20Q24 14 46 20V48H2Z" fill="url(#$d)" ${line(2.2)}/>
    ${tube(spiral(24, 32, 2.4, 13), 1.8, SAND_DARK)}
    <path d="M22 24V14M18 18l4-4 4 4" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" transform="rotate(180 22 19)"/>
    ${grains([[8, 30, 1.6], [40, 38, 1.6]])}`,

  'dust-devil': `<defs>${dune}</defs>
    <path d="M10 8Q24 4 38 8Q34 18 28 24Q30 32 24 42Q20 32 22 24Q14 18 10 8Z" fill="url(#$d)" ${line(2.4)}/>
    <path d="M14 11Q24 9 34 11M18 17Q24 15 30 17M21 24Q24 23 27 24M22 31Q24 30 26 31" fill="none" stroke="${SAND_DARK}" stroke-width="1.6" stroke-linecap="round"/>
    ${crack('M14 44L22 42L28 45L36 42', 2.2)}`,

  'lands-wrath': `<defs>${earth}${linear('p', [[0, '#d8c8a8'], [1, '#8a7a5a']])}</defs>
    <path d="M2 40L14 14L22 26L30 8L46 40Z" fill="url(#$p)" ${line(2.4)}/>
    <path d="M30 8L26 18L30 16L28 24M14 14L12 22" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
    ${ground(40)}${blown([30], 4, 44)}`,

  'sand-rush': `<defs>${dune}</defs>
    ${speed(20, [12, 20, 28, 36], 14)}
    ${whirl(32, 24, 9, 2)}
    ${grains([[42, 12, 1.6], [44, 36, 1.4]])}`,

  'sand-force': `<defs>${dune}</defs>
    ${haze}
    <path d="M10 40V26Q10 18 18 18H24Q30 18 30 26V30L36 32V40Z" fill="#ffb27a" ${line(2.4)}/>
    <path d="M14 18Q14 10 20 10Q26 10 26 18" fill="#ffb27a" ${line(2.2)}/>
    ${blown([42], 2, 46)}
    ${sparkle(40, 24, 3.2, '#ffd84a')}`,

  fissure: `<defs>${earth}${stoneG}${radial('l', [[0, '#fff6b0'], [0.5, '#ffa030'], [1, '#c83a10']])}</defs>
    ${ground(14)}
    <path d="M18 14L22 22L16 30L24 38L20 48H30L34 38L28 30L34 22L28 14Z" fill="url(#$l)" ${line(2.2)}/>
    <path d="M22 18L24 24L21 30L26 36" fill="none" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round"/>
    ${stone(9, 8, 4)}${stone(40, 8, 4.4)}`,

  'precipice-blades': `<defs>${linear('b', [[0, '#f8e0d0'], [0.5, '#d86848'], [1, '#802818']])}${earth}</defs>
    ${ground(38)}
    ${[[12, 38, 12, -12], [24, 38, 4, 0], [36, 38, 12, 12]].map(([x, y, top, rot]) => `<polygon points="${x - 5},${y} ${x},${top} ${x + 5},${y}" fill="url(#$b)" ${line(2.2)} transform="rotate(${rot} ${x} ${y})"/>`).join('')}
    ${crack('M6 44L16 41L24 45L34 41L42 44', 2)}`,

  landslide: `<defs>${linear('s', [[0, '#c8b898'], [1, '#7a6a4a']])}</defs>
    <path d="M2 10L34 46H2Z" fill="url(#$s)" ${line(2.4)}/>
    ${stone(24, 16, 6)}${stone(34, 28, 7, 'url(#$r)', 25)}${stone(40, 40, 5)}
    ${speed(14, [10, 20], 8)}${grains([[30, 12, 1.4], [44, 30, 1.4]], ROCK)}
    <defs>${stoneG}</defs>`,

  excavate: `<defs>${earth}</defs>
    ${ground(28)}
    ${heap(36, 28, 18, 9)}
    <g transform="translate(18 18) rotate(30)"><rect x="-1.8" y="-14" width="3.6" height="22" rx="1.6" fill="#c07838" ${line(2)}/>
    <path d="M-6 8H6L5 18Q0 22 -5 18Z" fill="#c8d0e0" ${line(2.2)}/></g>
    ${sparkle(30, 38, 3.4, '#ffd84a')}${sparkle(40, 42, 2.4, '#ffd84a')}`,

  'sand-stream': `<defs>${dune}</defs>
    ${haze}
    ${blown([22, 29, 36, 43], 2, 46)}
    <path d="M6 16Q10 10 16 12" fill="none" stroke="${SAND_DARK}" stroke-width="2" stroke-linecap="round"/>`,

  'desert-spirit': `<defs>${dune}${linear('w', [[0, '#d8f8b0'], [1, '#48a050']])}</defs>
    ${blown([40], 2, 46)}
    <path d="M24 30Q12 12 4 16Q10 22 8 30Q16 26 24 30Q32 26 40 30Q38 22 44 16Q36 12 24 30Z" fill="url(#$w)" ${line(2.2)}/>
    <path d="M24 30Q14 18 8 18M24 30Q34 18 40 18" fill="none" stroke="#c83a2a" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="24" cy="28" rx="3.6" ry="6" fill="#8ad070" ${line(2)}/>
    ${peeper(24, 22)}`,

  /* ---------- evolution cards ---------- */
  burrow: `<defs>${earth}</defs>
    ${ground(24)}
    ${hole(24, 26, 10, 4)}
    <path d="M24 30V44" stroke="#2a1a10" stroke-width="6" stroke-linecap="round"/>
    ${sandShield(24, 12, 8)}<defs>${dune}</defs>`,

  magnitude: `<defs>${earth}</defs>
    ${ground(34)}
    ${[8, 16, 24, 32, 40].map((x, i) => `<rect x="${x - 3}" y="${30 - i * 5}" width="6" height="${4 + i * 5}" rx="1.4" fill="${i > 2 ? '#f05a2a' : '#ffd84a'}" ${line(1.8)}/>`).join('')}
    ${crack('M4 40L14 37L22 42L32 37L44 41', 2.4)}`,

  'sand-spit': `<defs>${dune}</defs>
    <path d="M6 30Q6 18 18 18Q26 18 28 24L22 28Q14 26 12 32Z" fill="#c8a058" ${line(2.2)}/>
    <circle cx="16" cy="23" r="1.8" fill="${INK}"/>
    ${grains([[32, 24, 2.4], [38, 20, 2], [40, 28, 2.2], [44, 23, 1.6], [34, 31, 1.6]])}
    ${blown([40], 4, 44)}`,

  'high-horsepower': `<defs>${earth}</defs>
    ${ground(38)}
    <path d="M10 36L14 24Q16 14 26 14L34 10L36 16L32 20L36 34" fill="#9a6630" ${line(2.4)}/>
    <path d="M14 36H20M30 36H38" ${line(2.6)}/>
    ${speed(8, [18, 26], 6)}${puffs([[40, 38, 3], [44, 34, 2.4]], '#d8b880', '#f0d8a8')}`,

  'thousand-arrows': `<defs>${earth}</defs>
    ${ground(36)}
    ${[8, 16, 24, 32, 40].map((x, i) => `${tube(`M${x} 34V${14 + (i % 2) * 6}`, 2, '#c8a058')}<polygon points="${x},${8 + (i % 2) * 6} ${x - 3.4},${14 + (i % 2) * 6} ${x + 3.4},${14 + (i % 2) * 6}" fill="#e85a2a" ${line(1.6)}/>`).join('')}`,

  'thousand-waves': `<defs>${earth}</defs>
    ${[18, 28, 38].map((y, i) => `<path d="M2 ${y}Q12 ${y - 8} 24 ${y}T46 ${y}V${y + 6}H2Z" fill="${['#c8904c', '#9a6630', '#6e4420'][i]}" ${line(2)}/>`).join('')}
    ${crack('M8 46L18 43L26 47', 1.8)}`,

  'sandsear-storm': `<defs>${dune}${radial('h', [[0, '#fff6b0'], [0.5, '#ff9a30'], [1, '#d84a1a']])}</defs>
    <circle cx="24" cy="22" r="10" fill="url(#$h)" ${line(2.2)}/>
    ${whirl(24, 22, 17, 1.4)}
    ${blown([40], 2, 46)}`,

  'headlong-rush': `<defs>${earth}</defs>
    ${ground(38)}
    <path d="M8 34Q8 18 24 18Q34 18 38 24L44 22L42 30Q40 36 32 36H12Z" fill="#a8a294" ${line(2.4)}/>
    <path d="M38 24L46 14L42 26" fill="${BONE}" ${line(2)}/>
    <circle cx="32" cy="25" r="1.8" fill="${INK}"/>
    ${speed(4, [22, 28], 6)}`,
  // session 10's 36 (docs/duo-design.md section 5, "Ground's second session")
  trench: `<defs>${earth}</defs>
    ${ground(24)}
    <path d="M7 27H41L37 42H11Z" fill="#2a1a10" ${line(2)}/>
    ${[8, 16, 24, 32].map((x) => `<rect x="${x}" y="18" width="8" height="6" rx="3" fill="${SAND}" ${line(1.8)}/>`).join('')}
    ${pick(24, 33, 0.5, -20)}`,

  'bone-club': `${speed(10, [14, 20], 7)}
    ${bone(12, 38, 30, 14, 3.4)}
    ${rise(40, 22, 10, '#8ac8ff')}`,

  'hunker-down': `<defs>${earth}</defs>
    ${ground(32)}
    ${heap(24, 34, 32, 16)}
    ${peeper(24, 25)}`,

  'sand-tomb': `<defs>${earth}</defs>
    ${whirl(24, 22, 16, 2)}
    ${crack('M8 42L16 39L22 44L30 39L38 42', 2)}
    ${grains([[6, 10, 1.6], [42, 8, 1.4], [44, 30, 1.6]])}`,

  'earth-wall': `<defs>${earth}</defs>
    ${ground(40)}
    <rect x="8" y="12" width="32" height="28" rx="1.5" fill="url(#$e)" ${line(2.4)}/>
    <path d="M8 21.5H40M8 31H40M18 12V21.5M30 12V21.5M13 21.5V31M24 21.5V31M35 21.5V31M18 31V40M30 31V40" stroke="${DIRT_DARK}" stroke-width="1.6"/>
    ${crack('M36 12L33 17L37 21', 1.4)}`,

  tremor: `<defs>${earth}${stoneG}</defs>
    ${ground(30)}
    ${crack('M6 38L14 34L20 40L28 34L36 39L44 35')}
    ${stone(24, 20, 7)}
    ${shake(24, 20, 14)}`,

  'dune-wall': `<defs>${dune}</defs>
    ${heap(16, 42, 30, 18, 'url(#$d)')}${heap(34, 42, 28, 24, 'url(#$d)')}
    ${blown([12, 19], 6, 42)}`,

  'sand-blast': `<defs>${dune}</defs>
    ${sandShield(14, 26, 9)}
    ${speed(44, [16, 30], 8)}
    ${puffs([[30, 22, 6], [38, 18, 4], [36, 30, 5]], SAND_DARK, SAND)}
    ${grains([[44, 24, 1.8], [26, 36, 1.4], [42, 38, 1.6]])}`,

  'sand-cloak': `<defs>${dune}</defs>
    <path d="M24 6Q35 6 34 18L41 42H7L14 18Q13 6 24 6Z" fill="url(#$d)" ${line(2.4)}/>
    <path d="M18 18Q24 10 30 18Q24 25 18 18Z" fill="#3a2614" ${line(1.8)}/>
    <path d="M17 26L13 41M31 26L35 41" stroke="${SAND_DARK}" stroke-width="1.6" stroke-linecap="round"/>
    ${blown([44], 4, 44)}`,

  embankment: `<defs>${earth}</defs>
    ${ground(40)}
    <path d="M2 40L12 18H36L46 40Z" fill="url(#$e)" ${line(2.4)}/>
    <path d="M12 18H36" stroke="#78a048" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M10 30H38" stroke="${DIRT_DARK}" stroke-width="1.6" stroke-linecap="round"/>`,

  foxhole: `<defs>${earth}</defs>
    ${ground(24)}
    ${hole(24, 33, 13, 5.4)}
    <polygon points="16,32 18,20 23,30" fill="#e87838" ${line(1.8)}/><polygon points="25,30 30,20 32,32" fill="#e87838" ${line(1.8)}/>
    <polygon points="18,29 18.6,24 21,28.6" fill="#fff4e0"/><polygon points="27,28.6 29.4,24 30,29" fill="#fff4e0"/>`,

  'dig-in': `<defs>${earth}</defs>
    ${ground(32)}
    ${heap(20, 34, 30, 12)}
    ${pick(20, 15, 0.7, 25)}
    <rect x="34" y="12" width="9" height="12" rx="1.5" fill="#fff" ${line(1.8)}/><rect x="36" y="8" width="9" height="12" rx="1.5" fill="#fff" ${line(1.8)}/>`,

  'lie-in-wait': `<defs>${earth}</defs>
    ${ground(22)}
    ${hole(24, 32, 15, 7.4)}
    ${peeper(24, 32)}`,

  'cave-in': `<defs>${earth}${stoneG}</defs>
    ${ground(38)}
    ${heap(24, 40, 30, 8)}
    ${stone(14, 14, 6)}${stone(29, 9, 7, 'url(#$r)', 20)}${stone(37, 25, 5, 'url(#$r)', 40)}
    <path d="M14 23V28M29 18V24M37 32V35" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>`,

  hibernate: `<defs>${earth}</defs>
    ${ground(30)}
    ${heap(20, 36, 32, 16)}
    <path d="M30 10H37L30 17H37M38 4H43L38 9H43" fill="none" ${line(2)}/>`,

  tectonics: `<defs>${earth}</defs>
    <path d="M2 20L24 24L20 46H2Z" fill="url(#$e)" ${line(2.4)}/>
    <path d="M27 21L46 17V46H23Z" fill="url(#$e)" ${line(2.4)}/>
    ${tube('M6 12H16', 2.4, '#ffd84a')}<polygon points="20,12 14,8 14,16" fill="#ffd84a" ${line(1.6)}/>
    ${tube('M42 10H32', 2.4, '#ffd84a')}<polygon points="28,10 34,6 34,14" fill="#ffd84a" ${line(1.6)}/>`,

  'ground-lock': `<defs>${earth}</defs>
    ${ground(40)}
    <path d="M17 21V15Q17 8 24 8Q31 8 31 15V21" fill="none" ${line(5)}/><path d="M17 21V15Q17 8 24 8Q31 8 31 15V21" fill="none" stroke="#c8d0e0" stroke-width="2.4"/>
    <rect x="12" y="20" width="24" height="18" rx="3" fill="url(#$e)" ${line(2.4)}/>
    <circle cx="24" cy="27" r="2.4" fill="#2a1a10"/><path d="M24 28V33" stroke="#2a1a10" stroke-width="2.4" stroke-linecap="round"/>`,

  'rubble-wall': `<defs>${stoneG}</defs>
    ${stone(12, 38, 7)}${stone(26, 38, 8, 'url(#$r)', 15)}${stone(39, 38, 6, 'url(#$r)', 30)}
    ${stone(18, 26, 7, 'url(#$r)', 10)}${stone(32, 26, 7, 'url(#$r)', 25)}
    ${stone(25, 14, 6, 'url(#$r)', 5)}`,

  rumble: `<defs>${earth}${stoneG}</defs>
    ${ground(34)}
    ${crack('M14 40L20 37L26 41L34 37', 1.8)}
    ${stone(24, 22, 10)}
    ${shake(24, 22, 15)}`,

  aftershock: `<defs>${earth}</defs>
    ${ground(22)}
    ${crack('M8 30L16 34L21 30L29 39L38 35')}
    ${crack('M30 26L34 28L40 26', 1.6)}
    <rect x="34" y="6" width="9" height="12" rx="1.5" fill="#fff" ${line(1.8)}/>`,

  'sand-screen': `<defs>${dune}</defs>
    ${blown([10, 40], 2, 46)}
    ${[8, 19, 30].map((x) => `<rect x="${x}" y="14" width="10" height="22" rx="1.5" fill="url(#$d)" ${line(2.2)}/><path d="M${x + 2.5} 18V32" stroke="#fff6d0" stroke-width="1.4" stroke-linecap="round"/>`).join('')}`,

  haboob: `<defs>${earth}</defs>
    ${ground(36)}
    ${puffs([[8, 24, 7], [18, 16, 9], [31, 14, 10], [42, 22, 7], [24, 26, 8]], SAND_DARK, SAND)}
    ${blown([40, 44], 4, 44)}`,

  'dust-cloud': `${puffs([[16, 24, 8], [28, 18, 9], [34, 28, 7], [22, 32, 6]], '#c8b090', '#e8dcc0')}
    ${grains([[6, 12, 1.6], [42, 10, 1.4], [8, 38, 1.4], [42, 40, 1.8]], '#c8b090')}`,

  'desert-mirage': `<defs>${dune}</defs>
    ${haze}
    ${heap(14, 42, 28, 12, 'url(#$d)')}${heap(36, 42, 26, 9, 'url(#$d)')}
    <path d="M6 24Q10 22 14 24T22 24M10 30Q14 28 18 30T26 30" fill="none" stroke="#8ac8ff" stroke-width="1.8" stroke-linecap="round"/>`,

  scour: `<defs>${stoneG}</defs>
    ${stone(20, 26, 12)}
    ${blown([18, 26, 34], 28, 46)}
    ${sparkle(12, 14, 3.4)}${sparkle(30, 18, 2.4)}`,

  quagmire: `<defs>${radial('q', [[0, '#a07a48'], [0.7, '#6e4e2a'], [1, '#4a3218']])}</defs>
    <ellipse cx="24" cy="30" rx="21" ry="11" fill="url(#$q)" ${line(2.4)}/>
    <circle cx="16" cy="28" r="3" fill="#8a6438" ${line(1.4)}/><circle cx="30" cy="32" r="2.2" fill="#8a6438" ${line(1.2)}/><circle cx="25" cy="25" r="1.6" fill="#8a6438" ${line(1)}/>
    ${rise(36, 6, 10, '#c8904c')}`,

  'antlion-pit': `<defs>${dune}</defs>
    <ellipse cx="24" cy="30" rx="21" ry="11" fill="url(#$d)" ${line(2.4)}/>
    <ellipse cx="24" cy="31" rx="13" ry="6.4" fill="${SAND_DARK}" ${line(1.8)}/>
    <ellipse cx="24" cy="32" rx="6" ry="2.8" fill="#2a1a10" ${line(1.4)}/>
    ${peeper(24, 29)}`,

  'mud-armor': `<defs>${earth}</defs>
    <path d="M14 8L20 12H28L34 8L40 14L36 20V40H12V20L8 14Z" fill="url(#$e)" ${line(2.4)}/>
    <path d="M20 12Q24 17 28 12" fill="none" ${line(1.8)}/>
    ${splat(19, 27, 4.4, '#7a5028')}${splat(30, 33, 3.6, '#7a5028')}`,

  'endless-sands': `${tube('M10 24C10 14 22 14 24 24C26 34 38 34 38 24C38 14 26 14 24 24C22 34 10 34 10 24Z', 3.4, SAND, '#fff6d0')}
    ${grains([[6, 10, 1.6], [42, 10, 1.4], [8, 40, 1.4], [42, 38, 1.8]])}`,

  bunker: `<defs>${earth}${stoneG}</defs>
    ${ground(34)}
    <path d="M7 34Q7 13 24 13Q41 13 41 34Z" fill="url(#$r)" ${line(2.4)}/>
    <rect x="15" y="22" width="18" height="3.6" rx="1.8" fill="#2a1a10"/>
    <path d="M13 20Q17 15 23 15" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`,

  groundswell: `<defs>${earth}</defs>
    <path d="M2 42Q12 42 16 30Q22 12 34 11Q45 11 46 20Q38 18 34 25Q30 33 33 42Z" fill="url(#$e)" ${line(2.4)}/>
    ${ground(42)}
    ${crack('M6 46L14 44L22 47', 1.4)}`,

  chasm: `<defs>${earth}</defs>
    <path d="M2 16H20L24 46H2Z" fill="url(#$e)" ${line(2.4)}/>
    <path d="M28 16H46V46H25Z" fill="url(#$e)" ${line(2.4)}/>
    <path d="M20 16L24 46L25 46L28 16Z" fill="#1a0e08"/>
    ${grains([[22, 24, 1.4], [25, 32, 1.2]], DIRT)}`,

  'desert-fortress': `<defs>${dune}</defs>
    <path d="M7 42V22H11V18H15V22H19V12H29V22H33V18H37V22H41V42Z" fill="url(#$d)" ${line(2.2)}/>
    <path d="M21 42V34Q24 30 27 34V42Z" fill="#3a2614" ${line(1.6)}/>
    <rect x="22.4" y="16" width="3.2" height="4" rx="1" fill="#3a2614"/>
    ${blown([8], 2, 46)}`,

  'blinding-sand': `<path d="M5 24Q24 8 43 24Q24 40 5 24Z" fill="#fff" ${line(2.2)}/>
    <circle cx="24" cy="24" r="6.4" fill="#6a4220" ${line(1.6)}/><circle cx="22" cy="22" r="1.6" fill="#fff"/>
    ${grains([[14, 20, 2.2], [32, 18, 2], [30, 28, 2.4], [18, 29, 1.6], [38, 24, 1.8]])}`,

  stalagmites: `<defs>${stoneG}</defs>
    <polygon points="6,42 11,18 16,42" fill="url(#$r)" ${line(2.2)}/>
    <polygon points="15,42 22,8 29,42" fill="url(#$r)" ${line(2.2)}/>
    <polygon points="28,42 34,20 40,42" fill="url(#$r)" ${line(2.2)}/>
    <polygon points="37,42 41,28 45,42" fill="url(#$r)" ${line(2.2)}/>
    <path d="M2 42H46" ${line(2.6)}/>`,

  'solid-rock': `<defs>${stoneG}</defs>
    ${stone(24, 26, 17)}
    <path d="M14 30L22 34L30 31M20 18L24 24" fill="none" stroke="${ROCK_DARK}" stroke-width="1.6" stroke-linecap="round"/>
    ${sparkle(38, 10, 3.4)}`,
};

/* ============================================================
   card-art-flying.js  -  Flying's cards (the Safari's duo pool,
   docs/duo-design.md section 5), in the smooth card art's style
   (48x48, dark outline; see card-art.js).
   ============================================================ */

import { INK, f, line, star, sparkle, linear, radial, tube, puffs, speed, spiral } from './card-art-kit.js';

const WIND = '#d8f2ff', WIND_DEEP = '#9ad8ff', PLUME = '#f4f2ff', PLUME_DARK = '#a8a0e8', BIRD = '#8a7a72', BIRD_DARK = '#4e4440', BEAK = '#ffb030';
const sky = linear('k', [[0, '#9ad8ff'], [1, '#e8f6ff']]);
const plumeG = linear('p', [[0, '#ffffff'], [0.6, '#e4e0ff'], [1, '#a8a0e8']], 1, 1);
const steelG = linear('s', [[0, '#f0f4fa'], [0.5, '#b8c4d4'], [1, '#78849a']], 1, 1);

/** A feather from its quill's foot (x, y), len long, pointing at angle degrees. */
const feather = (x, y, len, angle, fill = 'url(#$p)') => {
  const w = len * 0.2;
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M${f(len * 0.12)} 0C${f(len * 0.3)} ${f(-w * 1.5)} ${f(len * 0.8)} ${f(-w * 1.3)} ${len} 0C${f(len * 0.8)} ${f(w * 1.2)} ${f(len * 0.32)} ${f(w * 1.4)} ${f(len * 0.12)} 0Z" fill="${fill}" ${line(1.8)}/>
    <path d="M${f(len * 0.5)} ${f(-w * 1.1)}L${f(len * 0.42)} ${f(-w * 0.3)}M${f(len * 0.7)} ${f(w * 0.9)}L${f(len * 0.6)} ${f(w * 0.2)}" stroke="${INK}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
    <path d="M0 0H${f(len * 0.92)}" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
  </g>`;
};
/** A spread wing, its shoulder on (x, y), its tip to the right (flip: left), scale s. */
const wing = (x, y, s = 1, flip = false, fill = 'url(#$p)') => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M0 0C6 -10 18 -14 26 -12C22 -9 24 -7 21 -5C24 -4 23 -1 19 0C21 2 19 4 15 4C15 7 11 8 8 6C5 7 1 5 0 0Z" fill="${fill}" ${line(2 / s)}/>
    <path d="M6 -3C10 -6 15 -8 20 -9M7 1C11 -1 15 -2 18 -3" fill="none" stroke="${PLUME_DARK}" stroke-width="${f(1.2 / s)}" stroke-linecap="round"/>
  </g>`;
/** A small bird side-on, flying right, its body's middle on (x, y), scale s (Starly's greys). */
const bird = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-12 1L-17 -3L-16 4Z" fill="${BIRD_DARK}" ${line(1.6 / s)}/>
    <ellipse cx="0" cy="0" rx="12" ry="7" fill="${BIRD}" ${line(2 / s)}/>
    <path d="M-4 4C0 7 6 7 9 3" fill="#f4f0ea" stroke="none"/>
    <circle cx="8" cy="-3" r="5.4" fill="${BIRD_DARK}" ${line(1.8 / s)}/>
    <path d="M12.6 -4L18 -2.4L12.8 -0.6Z" fill="${BEAK}" ${line(1.4 / s)}/>
    <circle cx="9.6" cy="-4" r="1.2" fill="#fff"/>
    <path d="M-4 -2C-2 -12 6 -16 12 -14C8 -10 6 -6 2 -3Z" fill="${BIRD_DARK}" ${line(1.8 / s)}/>
  </g>`;
/** Wind: curling streams across, each [y, len, curl] from x0. */
const gusts = (list, x0 = 4) => list.map(([y, len, up = 1]) => tube(`M${x0} ${y}C${f(x0 + len * 0.5)} ${y} ${f(x0 + len * 0.8)} ${f(y - 2 * up)} ${f(x0 + len)} ${f(y - 5 * up)}C${f(x0 + len + 4)} ${f(y - 8 * up)} ${f(x0 + len - 2)} ${f(y - 11 * up)} ${f(x0 + len - 5)} ${f(y - 8 * up)}`, 2.6, WIND, '#fff')).join('');
/** A cloud of puffs. */
const cloud = (x, y, s = 1) => puffs([[x - 7 * s, y + s, 5 * s], [x, y - 2 * s, 7 * s], [x + 7 * s, y + s, 5 * s], [x + 2 * s, y + 3 * s, 5 * s]], '#ffffff', null, 1.3);
/** A beak, open, pointing right, its hinge on (x, y). */
const beak = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 -3L16 -1L0 1Z" fill="${BEAK}" ${line(1.8 / s)}/><path d="M0 2L13 3.4L0 6Z" fill="#e08a18" ${line(1.8 / s)}/>
  </g>`;
/** A half-shield (Evasion's halved hit): a disc, its left half lit. */
const half = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${PLUME_DARK}" ${line(2)}/>
    <path d="M${x} ${f(y - r)}A${r} ${r} 0 0 0 ${x} ${f(y + r)}Z" fill="#fff"/>
    <path d="M${x} ${f(y - r)}V${f(y + r)}" ${line(1.6)}/>`;
/** An empty hand (Unburden): an open palm, fingers up, its wrist on (x, y). */
const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-7 0V-10C-7 -12 -4 -12 -4 -10V-14C-4 -16 -1 -16 -1 -14V-15C-1 -17 2 -17 2 -15V-13C2 -15 5 -15 5 -13V-6L8 -9C9.6 -10.6 11.6 -8.8 10.2 -7L5 0Z" fill="#ffd8b0" ${line(1.8 / s)}/>
  </g>`;
/** A slash across, from (x1, y1) to (x2, y2). */
const slash = (x1, y1, x2, y2, w = 3.4) => tube(`M${x1} ${y1}Q${f((x1 + x2) / 2 + 3)} ${f((y1 + y2) / 2 - 3)} ${x2} ${y2}`, w, '#ffffff', WIND_DEEP);

export const FLYING = {
  gust: `<defs>${sky}</defs>
    ${gusts([[16, 30], [26, 36, -1], [36, 28]])}
    ${puffs([[42, 10, 2], [44, 40, 1.6]], WIND, null, 1)}`,

  'feather-guard': `<defs>${plumeG}</defs>
    ${feather(10, 40, 30, -60)}${feather(24, 42, 30, -90)}${feather(38, 40, 30, -120)}
    ${sparkle(40, 10, 3)}`,

  'wing-attack': `<defs>${plumeG}</defs>
    ${wing(22, 26, 1.1)}${wing(26, 26, 1.1, true)}
    ${slash(6, 42, 42, 32)}`,

  'aerial-ace': `<defs>${plumeG}</defs>
    ${speed(16, [14, 22, 30], 10)}
    ${bird(28, 22, 1, -10)}
    ${slash(10, 42, 44, 36, 2.6)}`,

  'feather-dance': `<defs>${plumeG}</defs>
    ${feather(8, 20, 16, -30)}${feather(30, 10, 14, 40)}${feather(14, 38, 15, -80)}${feather(34, 34, 14, 200)}
    ${tube(spiral(24, 24, 1.6, 9), 2, WIND, '#fff')}`,

  'air-slash': `<defs>${sky}</defs>
    ${slash(6, 34, 42, 10)}${slash(10, 44, 44, 22, 2.6)}
    ${half(14, 14, 6)}`,

  'tailwind-gust': `${tube('M4 14C14 14 26 12 34 8C40 6 42 12 38 14', 2.8, '#c8ecff', '#fff')}
    ${tube('M4 24C16 24 30 22 40 20C46 19 46 26 42 26', 3.2, '#9ad8ff', '#fff')}
    ${tube('M4 34C14 34 24 34 32 36C38 38 36 44 32 42', 2.8, '#c8ecff', '#fff')}
    <g transform="rotate(-30 20 30)"><path d="M10 30C14 22 24 22 30 30C24 34 14 34 10 30Z" fill="#fff" ${line(1.8)}/><path d="M10 30H30" ${line(1.4)}/></g>`,

  twister: `${tube(spiral(24, 22, 2.4, 15), 3, WIND, '#fff')}
    <path d="M18 40Q24 34 30 40" fill="none" ${line(2.4)}/>
    ${puffs([[8, 10, 2], [40, 36, 2]], WIND, null, 1)}`,

  peck: `${bird(20, 26, 1.05)}
    <polygon points="${star(40, 22, 6, 6, 2.6)}" fill="#fff6b0" ${line(1.6)}/>`,

  acrobatics: `<defs>${plumeG}</defs>
    <path d="M10 38C8 22 26 6 40 14" fill="none" stroke="${WIND_DEEP}" stroke-width="2.4" stroke-dasharray="3 3" stroke-linecap="round"/>
    ${bird(30, 26, 0.9, 150)}
    ${palm(12, 44, 0.7)}`,

  fly: `<defs>${sky}</defs>
    <rect x="2" y="2" width="44" height="44" rx="4" fill="url(#$k)" opacity="0.5"/>
    ${cloud(14, 36, 0.9)}
    ${bird(28, 18, 1, -25)}`,

  gale: `${gusts([[14, 34], [24, 40, -1], [34, 34], [42, 26, -1]], 2)}`,

  'sky-drop': `<defs>${sky}</defs>
    ${cloud(32, 10, 0.8)}
    ${tube('M24 16V36', 3, '#fff', null)}<path d="M18 32L24 40L30 32" fill="none" ${line(2.6)}/>
    ${half(10, 38, 5)}${half(38, 38, 5)}`,

  roost: `<path d="M6 38Q24 46 42 38Q38 30 24 30Q10 30 6 38Z" fill="#c8a070" ${line(2.2)}/>
    <path d="M10 36L16 32M20 38L26 31M32 37L36 32" stroke="#8a6430" stroke-width="1.4" stroke-linecap="round"/>
    ${bird(24, 24, 0.9)}
    <path d="M38 8l2 4 4 .5-3 2.6 1 4-4-2-4 2 1-4-3-2.6 4-.5Z" fill="#7ce08a" ${line(1.4)}/>`,

  hurricane: `${tube(spiral(24, 24, 3, 19), 3.2, WIND_DEEP, '#fff')}
    ${tube(spiral(24, 24, 1.4, 8), 2.2, '#fff', null)}`,

  'wind-rider': `<defs>${plumeG}</defs>
    ${gusts([[30, 38], [40, 32, -1]])}
    ${bird(22, 18, 0.95, -8)}`,

  'drill-peck': `${tube(spiral(30, 24, 2.2, 10), 2.4, WIND, '#fff')}
    ${beak(12, 22, 1.3)}`,

  pluck: `<path d="M30 6Q32 14 28 18" fill="none" ${line(2)}/>
    <circle cx="26" cy="24" r="7" fill="#e83a4a" ${line(2.2)}/><circle cx="23.6" cy="21.6" r="2" fill="#ffb0b8"/>
    ${beak(4, 30, 1.2)}`,

  'feather-light': `<defs>${plumeG}</defs>
    ${feather(14, 40, 26, -70)}
    ${tube('M30 40C30 30 36 26 40 18', 1.8, WIND, null)}
    ${palm(36, 44, 0.6)}${sparkle(40, 10, 3)}`,

  'dual-wingbeat': `<defs>${plumeG}</defs>
    ${wing(10, 18, 0.8)}${wing(10, 34, 0.8)}
    ${speed(44, [18, 34], 10)}`,

  glide: `<defs>${sky}${plumeG}</defs>
    ${tube('M4 34C14 30 30 30 44 34', 2.4, WIND, '#fff')}
    ${wing(24, 22, 0.9)}${wing(24, 22, 0.9, true)}`,

  bounce: `<path d="M8 40Q16 10 24 40Q32 18 40 40" fill="none" stroke="${WIND_DEEP}" stroke-width="2.4" stroke-dasharray="3 3" stroke-linecap="round"/>
    ${bird(36, 22, 0.75, -30)}
    <ellipse cx="24" cy="42" rx="18" ry="3" fill="#c8a070" ${line(1.8)}/>`,

  whirlwind: `${tube('M10 40C2 30 14 22 24 26S44 22 38 12', 3, WIND_DEEP, '#fff')}
    ${tube('M16 42C10 34 20 30 28 32S44 28 40 20', 2.2, WIND, null)}
    ${puffs([[8, 12, 2], [42, 40, 2]], WIND, null, 1)}`,

  updraft: `${tube('M14 44C10 30 18 20 14 6', 2.8, WIND, '#fff')}${tube('M30 44C26 30 34 20 30 6', 2.8, WIND, '#fff')}
    <path d="M8 12L14 4L20 12M24 12L30 4L36 12" fill="none" ${line(2.2)}/>`,

  'sky-attack': `<defs>${radial('g', [[0, '#fff8d0'], [0.5, '#ffb030'], [1, '#e84a1c']], '50%', '50%')}</defs>
    <path d="M4 44L22 26" stroke="#ffb030" stroke-width="9" stroke-linecap="round" opacity="0.5"/>
    <circle cx="28" cy="20" r="11" fill="url(#$g)" ${line(2.2)}/>
    ${bird(29, 20, 0.6, -40)}
    ${sparkle(42, 8, 3)}`,

  aeroblast: `<defs>${sky}</defs>
    <circle cx="24" cy="24" r="17" fill="none" stroke="${WIND_DEEP}" stroke-width="3" ${''}/>
    <circle cx="24" cy="24" r="17" fill="none" ${line(1.4)}/>
    <circle cx="24" cy="24" r="10" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="10" fill="none" ${line(1.2)}/>
    ${tube('M2 24H46', 3, '#fff', WIND_DEEP)}`,

  'wind-wall': `<defs>${plumeG}</defs>
    ${tube('M10 6C4 16 16 24 10 34S14 44 10 44', 3, WIND_DEEP, '#fff')}${tube('M24 4C18 14 30 24 24 34S28 44 24 44', 3, WIND, '#fff')}${tube('M38 6C32 16 44 24 38 34S42 44 38 44', 3, WIND_DEEP, '#fff')}`,

  'brave-bird': `<defs>${radial('g', [[0, '#fffbe0'], [0.5, '#ffd040'], [1, '#ff7a20']], '60%', '50%')}</defs>
    <path d="M6 24C14 10 30 8 44 22C30 36 14 38 6 24Z" fill="url(#$g)" ${line(2)}/>
    ${bird(28, 24, 0.9)}`,

  'beak-blast': `<polygon points="${star(30, 24, 10, 15, 8)}" fill="#ffb030" ${line(2)}/>
    <polygon points="${star(30, 24, 10, 9, 5)}" fill="#fff6b0"/>
    ${beak(4, 22, 1.3)}`,

  'wind-dancer': `<defs>${plumeG}</defs>
    ${tube(spiral(24, 26, 1.8, 14), 2.2, WIND, '#fff')}
    ${feather(20, 34, 18, -70)}${feather(26, 34, 18, -110)}
    ${sparkle(10, 10, 2.6)}${sparkle(40, 12, 2.6)}`,

  'steel-wing': `<defs>${steelG}</defs>
    ${wing(14, 28, 1.2, false, 'url(#$s)')}
    ${sparkle(40, 10, 3)}`,

  'air-cutter': `${slash(4, 16, 44, 10, 2.6)}${slash(4, 28, 44, 22, 2.6)}${slash(4, 40, 44, 34, 2.6)}`,

  swoop: `${tube('M6 8C10 30 30 34 44 26', 2.4, WIND, null)}
    ${bird(36, 28, 0.85, 20)}`,

  'wing-strike': `<defs>${plumeG}</defs>
    ${wing(6, 30, 1.3)}
    <polygon points="${star(38, 18, 8, 8, 4)}" fill="#fff6b0" ${line(1.6)}/>`,

  'dragon-ascent': `<defs>${radial('g', [[0, '#e8fff0'], [0.5, '#7ae0a8'], [1, '#2a9a6a']], '50%', '70%')}</defs>
    <path d="M14 46C10 30 18 14 24 4C30 14 38 30 34 46Z" fill="url(#$g)" ${line(2)}/>
    ${bird(24, 22, 0.75, -90)}`,

  'bleakwind-storm': `${puffs([[12, 12, 7], [22, 9, 8], [32, 11, 7], [40, 14, 5]], '#8a8ca8', '#a8aac4')}
    ${gusts([[30, 30], [40, 36, -1]])}
    <path d="M28 18L24 26H29L25 34" fill="none" stroke="#ffe040" stroke-width="2" stroke-linejoin="round"/>`,

  'supersonic-skystrike': `<path d="M2 30L24 20" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
    <circle cx="28" cy="18" r="12" fill="none" stroke="${WIND_DEEP}" stroke-width="2.4"/><circle cx="28" cy="18" r="12" fill="none" ${line(1)}/>
    ${bird(28, 18, 0.75, -20)}
    ${sparkle(42, 36, 3)}`,

  'sky-fall': `<defs>${sky}</defs>
    ${cloud(16, 10, 0.9)}
    ${tube('M30 4L26 28', 3.4, '#fff', null)}
    ${bird(24, 32, 0.9, 70)}
    <path d="M6 44H42" ${line(2.4)}/>`,
};

/* ============================================================
   card-art-water.js  -  Water's cards drawn (batch 2 of the smooth
   card art, 2026-10-12). The starting deck's are in card-art.js.
   ============================================================ */

import {
  INK, f, line, star, drop, sine, spiral, tube, sparkle, radial, linear,
  puffs, fist, speed, gear,
} from './card-art-kit.js';

const sea = linear('w', [[0, '#9ae0ff'], [0.5, '#3a96f0'], [1, '#1a4ea8']]);
const bubDef = radial('b', [[0, '#f4fbff'], [0.6, '#b2e2ff'], [1, '#4a9ef0']], '35%', '30%', '75%');
const CURL = 'M3 44C6 30 15 13 30 9.5C40 7.5 46.5 15 44 23C42 29 34.5 30.5 32 25.5C30.2 21.6 33.4 18 37 20.4C36 16.4 31.6 15.4 27.6 17.6C19.4 22 17 34 19 44Z';
const SALT = '#f4f8ff';

/** Dive's curling wave, moved and scaled; needs `sea` in <defs>. */
const curl = (x, y, s, fill = 'url(#$w)') => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="${CURL}" fill="${fill}" ${line(2.6 / s)}/>
    <path d="M30 12.5C38 10.8 43 15.6 41.6 21.6" stroke="#fff" stroke-width="${f(2.4 / s)}" stroke-linecap="round" fill="none"/>
    <path d="M8 38C10 29 15 21 22 16" stroke="#c8ecff" stroke-width="${f(1.8 / s)}" stroke-linecap="round" fill="none" opacity="0.8"/></g>`;

/** A shining bubble; needs `bubDef`. */
const bub = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$b)" ${line(r > 6 ? 2.4 : 1.6)}/>
  <path d="M${f(x - r * 0.62)} ${f(y - r * 0.05)}A${f(r * 0.62)} ${f(r * 0.62)} 0 0 1 ${f(x - r * 0.05)} ${f(y - r * 0.62)}" stroke="#fff" stroke-width="${f(Math.max(0.9, r * 0.17))}" stroke-linecap="round" fill="none"/>`;

/** A sea from height y down, its top a wave. */
const water = (y, fill = 'url(#$w)', amp = 1.8, waves = 3) => `<path d="${sine(2, 46, y, amp, waves)}V46H2Z" fill="${fill}" ${line(2.4)}/>
  <path d="${sine(6, 20, y + 3, amp * 0.5, 1)}" stroke="#d0f0ff" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;

const rainCloud = (y = 0) => puffs([[14, 12 + y, 7], [24, 8 + y, 9], [34, 12 + y, 7.4], [19, 17 + y, 6], [29, 17 + y, 6]], '#8a9ab8', '#c8d4e8');
const rain = (list) => list.map(([x, y, r = 1.8]) => drop(x, y, r)).join('');

/** A scallop shell (its hinge at the bottom), ridged. */
const scallop = (cx, cy, r, fill, rot = 0) => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    <path d="M0 ${r * 0.55}L${-r} ${-r * 0.2}A${r} ${r} 0 0 1 ${r} ${-r * 0.2}Z" fill="${fill}" ${line(2.4)}/>
    ${[-0.66, -0.33, 0, 0.33, 0.66].map((t) => `<path d="M0 ${f(r * 0.5)}L${f(t * r * 1.1)} ${f(-r * 0.92 + Math.abs(t) * r * 0.35)}" stroke="${INK}" stroke-width="1.2" opacity="0.5"/>`).join('')}
    <rect x="${f(-r * 0.3)}" y="${f(r * 0.4)}" width="${f(r * 0.6)}" height="${f(r * 0.32)}" rx="1" fill="${fill}" ${line(1.6)}/></g>`;

/** A fish facing right, its middle on (x, y). */
const fish = (x, y, s, fill = '#ff8a4a', rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-14 -7L-8 0L-14 7Z" fill="${fill}" ${line(2 / s)}/>
    <path d="M-10 0C-4 -9 6 -9 12 0C6 9 -4 9 -10 0Z" fill="${fill}" ${line(2.2 / s)}/>
    <path d="M-4 -5C-2 -9 2 -9 4 -6" fill="${fill}" ${line(1.6 / s)}/>
    <circle cx="6" cy="-1.4" r="1.6" fill="${INK}"/><circle cx="6.4" cy="-1.9" r="0.5" fill="#fff"/>
    <path d="M1 -4Q-1 0 1 4" stroke="${INK}" stroke-width="${f(1.2 / s)}" fill="none" opacity="0.6"/>
    <path d="M-5 -4C-2 -6 2 -6 6 -5" stroke="#fff" stroke-width="${f(1.2 / s)}" stroke-linecap="round" fill="none" opacity="0.8"/></g>`;

/** An arrow as a thick tube along d, its head at (hx, hy) pointing at angle degrees. */
const arrowHead = (hx, hy, angle, fill) => `<path transform="translate(${hx} ${hy}) rotate(${angle})" d="M5 0L-4 -6L-2 0L-4 6Z" fill="${fill}" ${line(2)}/>`;

const heart = (cx, cy, s, fill) => `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 9C-5 5.4 -9 2.6 -9 -1.6C-9 -4.4 -7 -6.4 -4.6 -6.4C-2.6 -6.4 -1.2 -5.2 0 -3.4C1.2 -5.2 2.6 -6.4 4.6 -6.4C7 -6.4 9 -4.4 9 -1.6C9 2.6 5 5.4 0 9Z" fill="${fill}" ${line(1.8 / s)}/>`;

const shieldPath = 'M24 4L41 9.5V22C41 33 33.5 40.5 24 44.5C14.5 40.5 7 33 7 22V9.5Z';

const note = (x, y, fill) => `<path d="M${x + 2.4} ${y}V${y - 11}L${x + 8} ${y - 13}V${y - 3}" fill="none" ${line(2)}/>
  <ellipse cx="${x}" cy="${y}" rx="3" ry="2.3" fill="${fill}" ${line(1.5)}/><ellipse cx="${x + 5.6}" cy="${y - 2.2}" rx="3" ry="2.3" fill="${fill}" ${line(1.5)}/>`;

export const WATER = {
  'rain-dance': `${rainCloud()}${rain([[12, 30], [22, 34], [32, 29], [40, 36], [17, 42], [29, 43]])}
    ${note(36, 46, '#ffd040')}`,

  surf: `<defs>${sea}${linear('a', [[0, '#ffe070'], [1, '#ff7a3a']], 1, 0)}</defs>
    ${curl(0, 0, 1)}
    <path d="M10 32L32 20C34 19 36 20 35 22L14 36C12 37 9 34 10 32Z" fill="url(#$a)" ${line(2.2)}/>
    <path d="M14 32L31 22.4" stroke="#e8401c" stroke-width="1.6" stroke-linecap="round"/>
    ${water(40, 'url(#$w)', 1.4, 2)}`,

  soak: `<defs>${sea}</defs>
    <path d="M24 2C30 10 34 16 34 22A10 10 0 0 1 14 22C14 16 18 10 24 2Z" fill="#7cc8ff" ${line(2.4)}/>
    <path d="M18.6 21a5.6 5.6 0 0 1 3-5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <ellipse cx="24" cy="41" rx="19" ry="4.6" fill="url(#$w)" ${line(2.2)}/>
    <path d="M10 39L7 31L13 36L15 28L18 37M38 39L41 31L35 36L33 28L30 37" fill="#9ad8ff" ${line(1.8)}/>
    ${drop(6, 24, 1.6, -120)}${drop(42, 24, 1.6, -60)}`,

  'water-sport': `<defs>${sea}</defs>
    <path d="M8 44C8 26 16 12 24 12S40 26 40 44" fill="none" ${line(7.4)}/>
    <path d="M8 44C8 26 16 12 24 12S40 26 40 44" fill="none" stroke="#5ab8ff" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M10 36C11 25 17 16 23 15" stroke="#e0f6ff" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    ${drop(24, 7, 2.6)}${drop(15, 9, 1.8, -120)}${drop(33, 9, 1.8, -60)}
    ${sparkle(6, 10, 3, '#e0f6ff')}${sparkle(42, 20, 2.6, '#e0f6ff')}
    <ellipse cx="24" cy="44" rx="20" ry="2.4" fill="#3a96f0" ${line(1.8)}/>`,

  'snipe-shot': `<circle cx="24" cy="24" r="16" fill="#e8f6ff" ${line(2.6)}/>
    <circle cx="24" cy="24" r="9.6" fill="none" stroke="#e8203a" stroke-width="2.2"/>
    <path d="M24 3V13M24 35V45M3 24H13M35 24H45" ${line(2.6)}/>
    <path d="M24 2V12M24 36V46M2 24H12M36 24H46" stroke="#e8203a" stroke-width="1.2" stroke-linecap="round"/>
    ${drop(24, 26, 4)}`,

  clamp: `<defs>${linear('a', [[0, '#d8b0ff'], [1, '#7a4ac8']], 0, 1)}${radial('p', [[0, '#fff'], [1, '#e8d8f0']], '35%', '35%', '70%')}</defs>
    <g transform="rotate(-18 24 30)"><path d="M4 28C4 14 14 6 24 6S44 14 44 28Z" fill="url(#$a)" ${line(2.6)}/>
      <path d="M10 26C12 18 17 13 24 12M24 6V28M14 9L17 28M34 9L31 28" stroke="${INK}" stroke-width="1.2" opacity="0.4" fill="none"/></g>
    <path d="M4 32C4 40 12 45 24 45S44 40 44 32Z" fill="url(#$a)" ${line(2.6)}/>
    <circle cx="24" cy="31" r="6" fill="url(#$p)" ${line(2)}/>
    <path d="M10 37C14 41 19 42 24 42" stroke="#eedcff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  'razor-shell': `<defs>${linear('a', [[0, '#ffffff'], [1, '#8ab8e0']], 1, 0)}${linear('c', [[0, '#5ab8ff'], [1, '#2a5ab8']])}</defs>
    <path d="M30 4C38 10 42 20 40 30C30 22 18 20 8 22C14 12 22 6 30 4Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M30 4C34 12 36 20 38 28" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${scallop(18, 34, 13, 'url(#$c)', -10)}`,

  splash: `<defs>${sea}</defs>
    ${fish(24, 18, 1.15, '#ff6a3a', -20)}
    <path d="M8 18l-3-2M40 10l3-2M41 20l4 0" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M6 40L4 32L10 36L12 27L17 36L20 30L24 37L28 30L31 36L36 27L38 36L44 32L42 40Z" fill="#9ad8ff" ${line(2)}/>
    ${water(40, 'url(#$w)', 1.2, 2)}`,

  shelter: `<defs>${linear('a', [[0, '#5ab8ff'], [1, '#1a5ec8']], 1, 0)}</defs>
    ${rain([[6, 8], [14, 4, 1.5], [33, 4, 1.5], [42, 9], [24, 2, 1.4]])}
    <path d="M3 24C3 12 13 6 24 6S45 12 45 24C42 21.6 38 21.6 35.6 24C33 21.6 29 21.6 24 24C19 21.6 15 21.6 12.4 24C10 21.6 6 21.6 3 24Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M24 6C19 10 17 16 17 23M24 6C29 10 31 16 31 23" stroke="${INK}" stroke-width="1.2" opacity="0.4" fill="none"/>
    <path d="M8 18C10 13 15 10 21 9" stroke="#c8ecff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M24 24V40C24 44 18 44 18 40" fill="none" ${line(4.6)}/><path d="M24 24V40C24 44 18 44 18 40" fill="none" stroke="#c88a4a" stroke-width="2.2" stroke-linecap="round"/>`,

  'flip-turn': `<defs>${sea}</defs>
    ${tube('M10 42V22A12 12 0 0 1 34 22V34', 6, '#3a96f0', '#c8ecff')}
    ${arrowHead(34, 37, 90, '#3a96f0')}
    ${drop(8, 12, 2.2, -120)}${drop(42, 14, 2, -60)}
    <path d="M4 44H18" stroke="#9ad8ff" stroke-width="2" stroke-linecap="round"/>`,

  waterfall: `<defs>${linear('a', [[0, '#c8ecff'], [1, '#2a7ce0']])}${linear('r', [[0, '#8a7a70'], [1, '#4a3e3a']])}</defs>
    <path d="M2 4H16V30H2ZM32 4H46V30H32Z" fill="url(#$r)" ${line(2.4)}/>
    <path d="M14 4H34V38H14Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M18 6V34M24 6V36M30 6V34" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    ${puffs([[12, 39, 4], [20, 41, 5], [28, 41, 5], [36, 39, 4]], '#d8f0ff', '#fff', 1.2)}
    <path d="M2 45H46" ${line(2.4)}/>`,

  'aqua-step': `<defs>${sea}</defs>
    <ellipse cx="24" cy="36" rx="20" ry="7" fill="none" stroke="#5ab8ff" stroke-width="2" opacity="0.6"/>
    <ellipse cx="24" cy="36" rx="12" ry="4" fill="none" stroke="#5ab8ff" stroke-width="2"/>
    <g transform="rotate(-15 22 22)"><ellipse cx="22" cy="24" rx="6" ry="9" fill="#5ab8ff" ${line(2.4)}/>
      ${[[16, 12], [20.5, 10], [25, 10.4], [29, 12.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#5ab8ff" ${line(1.6)}/>`).join('')}
      <ellipse cx="20" cy="21" rx="2" ry="3.6" fill="#c8ecff"/></g>
    ${sparkle(40, 12, 2.8, '#e0f6ff')}`,

  mist: `${[12, 22, 32].map((y, i) => tube(sine(4 + i * 2, 44 - i * 2, y, 2.2, 1.5), 4.6, '#d8ecf8', '#fff')).join('')}
    ${sparkle(40, 6, 2.6, '#fff')}${sparkle(8, 42, 2.4, '#fff')}`,

  'chilling-water': `<defs>${sea}${linear('i', [[0, '#ffffff'], [1, '#a8e0f8']], 1, 1)}</defs>
    ${water(30, 'url(#$w)', 1.4, 2)}
    <rect x="13" y="12" width="20" height="20" rx="3.4" fill="url(#$i)" transform="rotate(14 23 22)" ${line(2.4)}/>
    <path d="M17 17l5-1M17 21l3-.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" transform="rotate(14 23 22)"/>
    <path d="M39 6V18M33.8 9L44.2 15M33.8 15L44.2 9" stroke="#e0f6ff" ${line(1)} stroke-width="1.8"/>`,

  'muddy-water': `<defs>${linear('m', [[0, '#c8a070'], [1, '#6a4a2a']])}</defs>
    ${curl(0, 0, 1, 'url(#$m)')}
    <circle cx="30" cy="33" r="2" fill="#5a3a20"/><circle cx="36" cy="38" r="1.4" fill="#5a3a20"/><circle cx="12" cy="40" r="1.6" fill="#5a3a20"/>`,

  whirlpool: `<defs>${linear('a', [[0, '#bfe8ff'], [1, '#1a5ec8']], 1, 1)}</defs>
    <ellipse cx="24" cy="26" rx="21" ry="17" fill="#2a7ce0" ${line(2.4)}/>
    ${tube(spiral(24, 26, 2.6, 17), 3, 'url(#$a)', '#fff')}
    <circle cx="24" cy="26" r="2.4" fill="#0a2a6a"/>`,

  liquidation: `<defs>${sea}</defs>
    ${[0, 1, 2].map((i) => `<path d="M${10 + i * 9} 4C${18 + i * 9} 14 ${20 + i * 9} 28 ${14 + i * 9} 44C${24 + i * 9} 30 ${24 + i * 9} 14 ${10 + i * 9} 4Z" fill="url(#$w)" ${line(2.2)}/>`).join('')}
    ${drop(42, 10, 2, -60)}${drop(6, 32, 1.8, -120)}${drop(42, 40, 1.6, -30)}`,

  'rising-tide': `<defs>${sea}${radial('m', [[0, '#ffffff'], [1, '#d8dcf0']], '40%', '40%', '70%')}</defs>
    <circle cx="35" cy="11" r="7" fill="url(#$m)" ${line(2.2)}/><circle cx="33" cy="9" r="1.6" fill="#c0c4dc"/><circle cx="37" cy="13.6" r="1.1" fill="#c0c4dc"/>
    ${water(28, 'url(#$w)', 2, 2.5)}
    <path d="M14 40V18M8 24L14 17L20 24" fill="none" ${line(6)}/><path d="M14 40V18M8 24L14 17L20 24" fill="none" stroke="#9ae0ff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,

  'swift-swim': `${fish(28, 24, 1.4, '#5ab8ff')}${speed(12, [16, 24, 32], 9)}
    ${[[44, 12, 2], [42, 36, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#c8ecff" ${line(1.2)}/>`).join('')}`,

  crabhammer: `<defs>${linear('a', [[0, '#ff9a6a'], [1, '#c83a1a']], 1, 1)}</defs>
    <path d="M10 44C10 36 14 30 20 28" fill="none" ${line(7)}/><path d="M10 44C10 36 14 30 20 28" fill="none" stroke="#e85a2a" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M18 30C12 22 14 8 26 5C38 2 46 10 42 18L30 18C34 22 34 30 28 32Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M30 18C35 16 40 16 42 18" fill="none" ${line(2)}/>
    <path d="M20 12C22 8 26 6.6 30 6.4" stroke="#ffd0b8" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${[[30, 9], [36, 10], [24, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#ffd0b8"/>`).join('')}
    <polygon points="${star(42, 32, 7, 6, 2.6)}" fill="#ffd040" ${line(1.5)}/>`,

  'water-spout': `<defs>${sea}${linear('h', [[0, '#7ab0e8'], [1, '#2a4e98']])}</defs>
    <path d="M24 24C22 18 20 12 14 8M24 24C26 18 28 12 34 8M24 24V6" fill="none" ${line(5.6)}/>
    <path d="M24 24C22 18 20 12 14 8M24 24C26 18 28 12 34 8M24 24V6" fill="none" stroke="#7cc8ff" stroke-width="3" stroke-linecap="round"/>
    ${drop(10, 8, 2, -130)}${drop(38, 8, 2, -50)}${drop(24, 3, 1.8)}
    <path d="M4 44C4 32 13 24 24 24S44 32 44 44Z" fill="url(#$h)" ${line(2.6)}/>
    <path d="M10 34C13 29 18 27 22 26.6" stroke="#b8d8ff" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'aqua-ring': `<defs>${sea}</defs>
    <circle cx="24" cy="24" r="17" fill="none" ${line(8)}/><circle cx="24" cy="24" r="17" fill="none" stroke="url(#$w)" stroke-width="5"/>
    <path d="M10 15A17 17 0 0 1 22 7" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${heart(24, 24, 1, '#ff7a9a')}
    ${drop(8, 34, 1.8)}${drop(40, 12, 1.8)}`,

  'mirror-coat': `<defs>${linear('a', [[0, '#ffffff'], [0.5, '#c8e8ff'], [1, '#7ab0e8']], 1, 1)}</defs>
    <ellipse cx="24" cy="24" rx="15" ry="20" fill="url(#$a)" ${line(2.6)}/>
    <ellipse cx="24" cy="24" rx="15" ry="20" fill="none" stroke="#b8c0d8" stroke-width="3" transform="scale(1)" opacity="0.6"/>
    <path d="M15 14L21 8M14 22L27 9M17 30L31 14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <path d="M44 30H33M37 26L33 30L37 34" fill="none" ${line(2.4)} stroke="#e8203a"/>`,

  'water-veil': `<defs>${linear('a', [[0, '#c8ecff'], [1, '#3a96f0']])}</defs>
    <path d="M4 44C4 22 12 4 24 4S44 22 44 44Z" fill="url(#$a)" opacity="0.55" ${line(2.4)}/>
    ${[12, 20, 28, 36].map((x) => `<path d="M${x} ${44}C${x - 2} 34 ${x + 2} 22 ${x} 10" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.8"/>`).join('')}
    ${drop(24, 30, 4)}`,

  'tidal-wall': `<defs>${sea}</defs>
    <path d="M4 44V12C10 6 14 10 18 6C22 10 26 4 30 8C34 4 40 8 44 6V44Z" fill="url(#$w)" ${line(2.6)}/>
    <path d="M8 40V14M16 40V12M24 40V12M32 40V12M40 40V12" stroke="#d0f0ff" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>
    <path d="M6 11C10 8 13 10 17 8" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${puffs([[8, 6, 2.4], [18, 4, 2.2], [30, 5, 2.4], [40, 3.6, 2.2]], '#fff', null, 1)}`,

  'shell-smash': `<defs>${radial('a', [[0, '#e8b060'], [1, '#9a5e26']], '40%', '35%', '70%')}</defs>
    <path d="M4 30C4 16 12 8 21 7L18 18L24 22L20 34Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M27 7C36 8 44 16 44 30L28 34L32 22L26 18Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M6 38H42" ${line(2.4)}/><path d="M8 34C14 37 34 37 40 34" fill="#f6e4aa" ${line(2)}/>
    <polygon points="${star(24, 26, 6, 6, 2.6)}" fill="#ffd040" ${line(1.5)}/>
    ${[[8, 6, 2], [40, 4, 2.4], [24, 3, 1.6]].map(([x, y, r]) => `<polygon points="${x - r},${y} ${x},${y - r} ${x + r},${y + r}" fill="#c88440" ${line(1.2)}/>`).join('')}`,

  'aqua-tail': `<defs>${sea}</defs>
    ${tube('M6 44C8 32 22 32 26 20', 8, '#3a96f0', '#c8ecff')}
    <path d="M26 21C22 14 14 10 8 10C14 6 24 6 28 14C30 6 38 2 46 4C40 8 34 14 30 22Z" fill="url(#$w)" ${line(2.4)}/>
    <path d="M12 9.6C18 9 23 11 26 15M32 13C35 9 39 6 43 5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${drop(10, 22, 2, -140)}${drop(40, 18, 2, -40)}${drop(36, 30, 1.6, -20)}`,

  'bubble-shield': `<defs>${bubDef}${linear('a', [[0, '#eef2fa'], [1, '#7e8aa8']], 1, 1)}</defs>
    <path d="M24 12L33 15V22C33 28 29 32 24 34C19 32 15 28 15 22V15Z" fill="url(#$a)" ${line(2)}/>
    <circle cx="24" cy="24" r="20" fill="url(#$b)" opacity="0.6" ${line(2.6)}/>
    <path d="M10 22A14 14 0 0 1 22 10" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <circle cx="35" cy="34" r="2" fill="#fff"/>`,

  'surging-strikes': `${[[12, 14, -15], [30, 18, 10], [18, 34, -5]].map(([x, y, r]) => fist(x, y, 0.62, r, '#7cc8ff', '#2a7ce0')).join('')}
    ${drop(42, 6, 1.8, -50)}${drop(40, 38, 1.8, -20)}${drop(4, 26, 1.6, -150)}`,

  undertow: `<defs>${sea}</defs>
    ${water(12, '#9ad8ff', 1.6, 2.5)}
    ${tube('M38 18C30 22 14 20 12 30S24 42 34 36', 4, '#1a5ec8', '#7cc8ff')}
    ${arrowHead(35, 35.4, -30, '#1a5ec8')}`,

  ripple: `<ellipse cx="24" cy="30" rx="21" ry="10" fill="none" ${line(2.4)}/>
    <ellipse cx="24" cy="30" rx="21" ry="10" fill="none" stroke="#9ad8ff" stroke-width="1"/>
    <ellipse cx="24" cy="30" rx="13" ry="6" fill="none" ${line(2.4)}/><ellipse cx="24" cy="30" rx="13" ry="6" fill="none" stroke="#5ab8ff" stroke-width="1"/>
    <ellipse cx="24" cy="30" rx="5" ry="2.4" fill="#5ab8ff" ${line(2)}/>
    ${drop(24, 14, 3.4)}`,

  wellspring: `<defs>${linear('r', [[0, '#9a8a80'], [1, '#4a3e3a']])}</defs>
    <path d="M24 30C22 22 22 14 24 6C26 14 26 22 24 30" fill="none" ${line(7)}/>
    <path d="M24 30C22 22 22 14 24 6C26 14 26 22 24 30" fill="none" stroke="#7cc8ff" stroke-width="4"/>
    <path d="M24 10C18 8 12 12 10 20M24 10C30 8 36 12 38 20" fill="none" ${line(4.4)}/>
    <path d="M24 10C18 8 12 12 10 20M24 10C30 8 36 12 38 20" fill="none" stroke="#9ae0ff" stroke-width="2" stroke-linecap="round"/>
    ${drop(9, 25, 1.8, 90)}${drop(39, 25, 1.8, 90)}
    <path d="M3 44C4 36 10 31 16 32C19 28 29 28 32 32C38 31 44 36 45 44Z" fill="url(#$r)" ${line(2.4)}/>
    <ellipse cx="24" cy="33" rx="8" ry="2.4" fill="#5ab8ff" ${line(1.6)}/>`,

  'wash-away': `<defs>${sea}</defs>
    ${[[30, 8, 20], [38, 16, 40], [22, 4, -10]].map(([x, y, r]) => `<rect x="${x - 4}" y="${y - 5.6}" width="8" height="11.2" rx="1.4" fill="#fff4e0" transform="rotate(${r} ${x} ${y})" ${line(1.8)}/>`).join('')}
    ${curl(-4, 10, 0.85)}
    ${water(40, 'url(#$w)', 1.2, 2)}`,

  'triple-dive': `<defs>${sea}</defs>
    ${[10, 24, 38].map((x, i) => `<path d="M${x - 7} ${30 - i * 2}C${x - 6} ${16 - i * 2} ${x + 4} ${12 - i * 2} ${x + 6} ${24 - i * 2}" fill="none" stroke="#9ad8ff" stroke-width="1.6" stroke-dasharray="2 2.4"/>${drop(x + 6, 28 - i * 2, 3, 90)}`).join('')}
    ${water(36, 'url(#$w)', 1.4, 3)}`,

  'still-waters': `<defs>${radial('a', [[0, '#3a6aa8'], [1, '#0e2a5a']], '50%', '40%', '70%')}</defs>
    <ellipse cx="24" cy="28" rx="22" ry="14" fill="url(#$a)" ${line(2.6)}/>
    <ellipse cx="30" cy="22" rx="4" ry="1.6" fill="#fffbe0" opacity="0.9"/>
    <path d="M10 30h8M28 34h10M14 36h6" stroke="#7cb0e8" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M10 28A8 4 0 1 0 22 28L16 27Z" fill="#4cae3c" ${line(1.8)}/>
    ${[[16, 22, -30], [16, 22, 0], [16, 22, 30]].map(([x, y, r]) => `<path transform="rotate(${r} ${x} 26)" d="M${x} 26C${x - 3} 22 ${x - 2} 18 ${x} 16C${x + 2} 18 ${x + 3} 22 ${x} 26Z" fill="#ffb0d0" ${line(1.4)}/>`).join('')}`,

  upwell: `<defs>${linear('a', [[0, '#c8ecff'], [1, '#1a3e88']])}</defs>
    <path d="M14 46C16 34 12 24 18 14C20 10 28 10 30 14C36 24 32 34 34 46Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M20 40C21 32 19 24 22 17" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${bub(24, 7, 3.6)}${bub(16, 4, 2)}${bub(32, 3, 2)}
    <defs>${bubDef}</defs>
    <path d="M6 30l3-4 3 4M36 24l3-4 3 4M8 40l3-4 3 4" fill="none" ${line(2.2)} stroke="#5ab8ff"/>`,

  'fishious-rend': `<defs>${linear('a', [[0, '#7ab0e8'], [1, '#2a4e98']], 1, 0)}</defs>
    <path d="M4 24C4 12 14 4 26 4C36 4 44 12 44 18L28 24L44 30C44 38 36 44 26 44C14 44 4 36 4 24Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M44 18L28 24L44 30" fill="#2a1a3a" ${line(2)}/>
    ${[[40, 19.6], [36, 21.2], [32, 22.6]].map(([x, y]) => `<path d="M${x} ${y}l1 3 1.4 -3.4" fill="#fff" ${line(1)}/><path d="M${x} ${48 - y}l1 -3 1.4 3.4" fill="#fff" ${line(1)}/>`).join('')}
    <circle cx="22" cy="14" r="4" fill="#ffd040" ${line(1.8)}/><circle cx="23" cy="14" r="1.8" fill="${INK}"/>
    <path d="M8 22C8 16 12 10 18 8" stroke="#c8e0ff" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'aqua-cutter': `<defs>${sea}</defs>
    <path d="M6 40C14 20 28 8 44 4C34 12 24 26 18 44C14 40 10 38 6 40Z" fill="url(#$w)" ${line(2.4)}/>
    <path d="M12 38C18 24 28 14 40 7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${drop(40, 30, 2, 20)}${drop(34, 40, 1.6, 40)}`,

  octazooka: `<defs>${linear('a', [[0, '#ff8a6a'], [1, '#c83a2a']])}</defs>
    ${[-30, -10, 10, 30].map((r) => `<path d="M16 30C14 36 10 40 6 42" transform="rotate(${r} 16 28)" fill="none" ${line(5.6)}/><path d="M16 30C14 36 10 40 6 42" transform="rotate(${r} 16 28)" fill="none" stroke="#e85a3a" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <ellipse cx="18" cy="20" rx="12" ry="11" fill="url(#$a)" ${line(2.6)}/>
    <circle cx="14" cy="19" r="2.4" fill="#fff" ${line(1.2)}/><circle cx="14.6" cy="19" r="1.2" fill="${INK}"/>
    <rect x="26" y="17" width="8" height="7" rx="2.4" fill="#e85a3a" ${line(2)}/>
    ${puffs([[38, 20, 4.6], [43, 14, 3], [44, 26, 3]], '#3a3048', '#5a5068')}
    <path d="M10 13C12 10 15 9 18 9" stroke="#ffc8b8" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'storm-drain': `<defs>${linear('a', [[0, '#a8b0c0'], [1, '#5a6070']])}</defs>
    ${rainCloud(-2)}${rain([[14, 24, 1.5], [34, 24, 1.5]])}
    <path d="M6 30H42L30 40V45H18V40Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M12 33H36M16 36H32" stroke="${INK}" stroke-width="1.4"/>
    ${tube(spiral(24, 33.4, 1.4, 6), 1.6, '#5ab8ff', null)}`,

  'aqua-veil': `<defs>${bubDef}${linear('r', [[0, '#e8dcc8'], [1, '#a89478']])}</defs>
    <circle cx="24" cy="26" r="18" fill="url(#$b)" opacity="0.7" ${line(2.6)}/>
    <path d="M10 24A14 14 0 0 1 20 12" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    ${[[24, 30, 7], [14, 18, 3.6], [36, 20, 3]].map(([x, y, r]) => `<path d="M${x - r} ${y}l${r * 0.6} ${-r * 0.8}h${r * 0.8}l${r * 0.6} ${r * 0.8}l${-r * 0.4} ${r * 0.7}h${-r * 1.2}Z" fill="#7cc8ff" ${line(1.4)} opacity="0.85"/>`).join('')}
    ${sparkle(40, 8, 2.8, '#e0f6ff')}`,

  'jet-punch': `${tube('M2 30C8 30 12 28 16 26', 4, '#9ad8ff', '#fff')}${tube('M2 20C8 20 12 22 16 24', 3, '#9ad8ff', '#fff')}
    ${fist(30, 24, 1.05, 0, '#7cc8ff', '#2a7ce0')}`,

  'sparkling-aria': `<defs>${bubDef}</defs>
    ${bub(16, 28, 11)}${bub(34, 14, 8)}${bub(37, 36, 5.6)}
    ${note(13, 33, '#ff8ad8')}
    <path d="M32 18V10L37 9V16" fill="none" ${line(1.8)}/><circle cx="31" cy="18" r="1.8" fill="#ff8ad8" ${line(1.2)}/><circle cx="36" cy="16.4" r="1.8" fill="#ff8ad8" ${line(1.2)}/>
    ${sparkle(6, 8, 3, '#ffe0f6')}${sparkle(44, 26, 2.4, '#e0f6ff')}`,

  'rain-dish': `<defs>${linear('a', [[0, '#e8e4f0'], [1, '#8a8498']])}</defs>
    ${rain([[12, 6], [24, 3], [36, 6], [18, 14, 1.5], [30, 14, 1.5]])}
    <path d="M4 26H44C44 36 36 42 24 42S4 36 4 26Z" fill="url(#$a)" ${line(2.6)}/>
    <ellipse cx="24" cy="26" rx="20" ry="3.6" fill="#5ab8ff" ${line(2)}/>
    <path d="M10 30C12 35 16 38 20 39" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M18 42L16 46H32L30 42" fill="#8a8498" ${line(2)}/>`,

  'bouncy-bubble': `<defs>${bubDef}</defs>
    <path d="M6 40Q12 14 20 30Q28 6 38 22" fill="none" stroke="#9ad8ff" stroke-width="1.8" stroke-dasharray="2.4 2.4"/>
    ${bub(16, 26, 9)}${bub(36, 16, 7.4)}
    <path d="M8 44H40" ${line(2)}/><path d="M13 41l-2 3M19 41l2 3" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,

  'water-absorb': `${[[6, 8], [42, 10], [8, 40], [40, 40]].map(([x, y]) => `<path d="M${x} ${y}L${f(x + (24 - x) * 0.42)} ${f(y + (24 - y) * 0.42)}" stroke="#9ad8ff" stroke-width="1.6" stroke-dasharray="2 2" stroke-linecap="round"/>${drop(x, y, 1.6, Math.atan2(24 - y, 24 - x) * 180 / Math.PI + 180)}`).join('')}
    <path d="M24 5C31 14 36 20 36 28A12 12 0 0 1 12 28C12 20 17 14 24 5Z" fill="#5ab8ff" ${line(2.6)}/>
    <path d="M24 22V34M18 28H30" ${line(4.6)}/><path d="M24 22V34M18 28H30" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M16.6 26a7.4 7.4 0 0 1 3.6-6" stroke="#c8ecff" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'ebb-tide': `<defs>${sea}${radial('m', [[0, '#ffffff'], [1, '#d8dcf0']], '40%', '40%', '70%')}</defs>
    <path d="M14 6A9 9 0 1 0 22 18A7 7 0 1 1 14 6Z" fill="url(#$m)" ${line(2.2)}/>
    ${water(32, 'url(#$w)', 1.6, 2)}
    <path d="M44 24H24M29 19.6L24 24L29 28.4" fill="none" ${line(5)}/><path d="M44 24H24M29 19.6L24 24L29 28.4" fill="none" stroke="#9ae0ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,

  'hydro-pump': `<defs>${linear('a', [[0, '#d0d4e0'], [1, '#6a7088']])}${linear('j', [[0, '#e0f6ff'], [1, '#3a96f0']], 1, 0)}</defs>
    ${[14, 32].map((y) => `<path d="M14 ${y - 3}C24 ${y - 6} 34 ${y - 7} 46 ${y - 6}V${y + 6}C34 ${y + 7} 24 ${y + 6} 14 ${y + 3}Z" fill="url(#$j)" ${line(2.2)}/><path d="M18 ${y}H42" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`).join('')}
    ${[14, 32].map((y) => `<rect x="2" y="${y - 5}" width="13" height="10" rx="2" fill="url(#$a)" ${line(2.2)}/><path d="M4 ${y - 2.6}H12" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`).join('')}`,

  drizzle: `${puffs([[16, 14, 6], [24, 10, 7.4], [32, 14, 6], [24, 17, 5.4]], '#a8b8d0', '#e0e8f4')}
    ${rain([[14, 28, 1.3], [22, 32, 1.3], [30, 27, 1.3], [36, 34, 1.3], [18, 40, 1.3], [28, 42, 1.3]])}
    <path d="M38 6l3-2M6 20h-3" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,

  tsunami: `<defs>${linear('a', [[0, '#7cd0ff'], [1, '#0e2a6a']])}</defs>
    <path d="M2 46V20C6 8 18 2 30 2C42 2 47 10 46 18C44 24 36 24 34 18C32 13 36 10 40 12C38 8 30 8 26 12C18 18 20 36 24 46Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M30 5C40 4 44 10 43.6 16" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M8 40V22C10 14 16 8 24 6" stroke="#9ad8ff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M30 44l2-6 2 6M38 44l2-4 2 4" fill="#5a4a44" ${line(1.6)}/>
    ${puffs([[34, 2, 2.4], [42, 4, 2.6], [46, 12, 2]], '#fff', null, 1)}`,

  'shell-armor': `<defs>${radial('a', [[0, '#e8b060'], [1, '#9a5e26']], '40%', '35%', '70%')}</defs>
    <path d="${shieldPath}" fill="#f6e4aa" ${line(2.6)}/>
    <path d="M24 8L37 12.4V22C37 31 31 37.4 24 40.6C17 37.4 11 31 11 22V12.4Z" fill="url(#$a)" ${line(1.8)}/>
    <path d="M19 15h10l4 7-4 7H19l-4-7Z" fill="#c88440" ${line(1.6)}/>
    <path d="M19 15L14 11M29 15L34 11M33 22H37M29 29L32 34M19 29L16 34M15 22H11" ${line(1.6)}/>
    <path d="M14 14C15 12 17 11 19 10.6" stroke="#ffe0a8" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  riptide: `<defs>${linear('a', [[0, '#c8ecff'], [1, '#2a7ce0']], 1, 1)}</defs>
    <path d="M20 8L34 12.6V22C34 31 28 37 20 40.6C12 37 6 31 6 22V12.6Z" fill="url(#$a)" ${line(2.6)}/>
    ${tube('M20 24C24 20 28 22 30 26S34 34 42 30', 3.4, '#1a5ec8', '#9ad8ff')}
    ${arrowHead(42, 29.6, -25, '#1a5ec8')}
    <polygon points="${star(40, 14, 7, 6, 2.6)}" fill="#ffd040" ${line(1.5)}/>
    <path d="M10 15V22c0 3 .7 5.6 2 8" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'iron-shell': `<defs>${linear('a', [[0, '#eef2fa'], [0.5, '#a8b0c8'], [1, '#5a6280']], 1, 1)}</defs>
    ${scallop(24, 26, 20, 'url(#$a)')}
    ${[[12, 12], [24, 8], [36, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#5a6280" ${line(1)}/>`).join('')}
    <path d="M9 18A18 18 0 0 1 20 8" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'primordial-sea': `<defs>${linear('a', [[0, '#3a6ac8'], [1, '#0a1a4a']])}</defs>
    ${puffs([[10, 8, 6], [20, 5, 7], [30, 6, 7], [40, 8, 6]], '#4a5470', '#6a7490')}
    ${rain([[8, 20, 1.5], [16, 24, 1.5], [26, 21, 1.5], [36, 25, 1.5], [42, 19, 1.5]])}
    <path d="${sine(2, 46, 32, 2.6, 3)}V46H2Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M18 36L24 42L30 36M24 42V36" fill="none" stroke="#ff5a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 40h6M34 40h6" stroke="#5ab8ff" stroke-width="1.6" stroke-linecap="round"/>`,

  hydration: `<path d="M22 5C29 14 34 20 34 28A12 12 0 0 1 10 28C10 20 15 14 22 5Z" fill="#7cc8ff" ${line(2.6)}/>
    <path d="M14.6 26a7.4 7.4 0 0 1 3.6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="37" cy="36" r="8" fill="#5ccc5c" ${line(2.4)}/>
    <path d="M37 31.6V40.4M32.6 36H41.4" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,

  'water-shuriken': `<defs>${linear('a', [[0, '#c8ecff'], [1, '#2a5ab8']], 1, 1)}</defs>
    <polygon points="${star(24, 24, 4, 21, 6.4, -45)}" fill="url(#$a)" ${line(2.6)}/>
    <polygon points="${star(24, 24, 4, 21, 6.4, -45)}" fill="none" stroke="#fff" stroke-width="1" transform="scale(0.94) translate(1.5 1.5)" opacity="0.5"/>
    <circle cx="24" cy="24" r="4" fill="#0e2a6a" ${line(2)}/>
    <path d="M10 10L20 20" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    ${speed(8, [36, 42], 5)}`,

  'life-dew': `${leafPair()}
    <path d="M24 10C30 18 33 23 33 28A9 9 0 0 1 15 28C15 23 18 18 24 10Z" fill="#a8e8ff" ${line(2.4)}/>
    <path d="M18.6 27a5.4 5.4 0 0 1 2.6-5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${sparkle(37, 10, 3.4, '#fffbe0')}${sparkle(10, 16, 2.4, '#fffbe0')}`,

  'ebb-and-flow': `<defs>${sea}</defs>
    <path d="M10 18A15 15 0 0 1 38 16" fill="none" ${line(6.4)}/><path d="M10 18A15 15 0 0 1 38 16" fill="none" stroke="#5ab8ff" stroke-width="3.6" stroke-linecap="round"/>
    ${arrowHead(39, 18, 70, '#5ab8ff')}
    <path d="M38 30A15 15 0 0 1 10 32" fill="none" ${line(6.4)}/><path d="M38 30A15 15 0 0 1 10 32" fill="none" stroke="#1a5ec8" stroke-width="3.6" stroke-linecap="round"/>
    ${arrowHead(9, 30, -110, '#1a5ec8')}
    ${drop(24, 26, 3.4)}`,

  'aqua-wall': `<defs>${linear('a', [[0, '#c8ecff'], [1, '#2a7ce0']])}</defs>
    <rect x="6" y="6" width="36" height="36" rx="4" fill="url(#$a)" ${line(2.6)}/>
    ${[[6, 15], [6, 24], [6, 33]].map(([x, y]) => `<path d="${sine(x + 1, 41, y, 1.2, 2)}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.8"/>`).join('')}
    <path d="M10 10V20" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    ${puffs([[10, 4, 2.6], [20, 3, 2.4], [30, 4, 2.6], [40, 3, 2.4]], '#e0f6ff', null, 1)}`,

  'primal-reversion': `<defs>${radial('a', [[0, '#fff'], [0.4, '#8ad8ff'], [1, '#1a3e98']])}</defs>
    <circle cx="24" cy="24" r="20" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 9C20 14 16 22 14 34H18L20 28H28L30 34H34C32 22 28 14 24 9ZM21.4 24L24 16L26.6 24Z" fill="#e8205a" ${line(1.8)}/>
    <path d="M10 18A15 15 0 0 1 18 10" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'aqua-jet': `<defs>${radial('a', [[0, '#fff'], [0.4, '#bfe8ff'], [1, '#2a74d8']], '62%', '40%', '65%')}${sea}</defs>
    <path d="M2 40C14 34 22 26 30 22C30 26 32 28 34 30C24 34 14 38 2 40Z" fill="url(#$w)" ${line(2)}/>
    <path d="M4 32C14 28 22 22 30 20" stroke="#9ad8ff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <circle cx="34" cy="22" r="10" fill="url(#$a)" ${line(2.6)}/>
    <path d="M29 18a6 6 0 0 1 4-3" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${speed(20, [12], 10)}`,

  'bubble-beam': `<defs>${bubDef}</defs>
    ${[[8, 38, 3], [15, 31, 4.4], [24, 24, 5.6], [34, 15, 7.4]].map(([x, y, r]) => bub(x, y, r)).join('')}
    ${bub(40, 34, 3)}${bub(28, 38, 2.4)}${bub(43, 6, 2.2)}`,

  brine: `<defs>${sea}</defs>
    ${water(30, 'url(#$w)', 1.6, 2)}
    ${[[14, 14, 6, 10], [28, 10, 7, -12], [36, 24, 4.6, 20]].map(([x, y, s, r]) => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="1" fill="${SALT}" transform="rotate(${r} ${x} ${y})" ${line(1.8)}/><path d="M${x - s * 0.3} ${y - s * 0.2}h${s * 0.3}" stroke="#a8c8e8" stroke-width="1" transform="rotate(${r} ${x} ${y})"/>`).join('')}
    ${sparkle(8, 26, 2.4)}${sparkle(42, 6, 2.6)}`,

  'rain-shield': `<defs>${linear('a', [[0, '#c8ecff'], [1, '#2a7ce0']], 1, 1)}</defs>
    <path d="${shieldPath}" fill="url(#$a)" ${line(2.6)}/>
    ${puffs([[17, 20, 4.4], [24, 17, 5.6], [31, 20, 4.4], [24, 22, 4]], '#a8b8d0', '#e8eef8', 1)}
    ${rain([[18, 30, 1.3], [24, 34, 1.3], [30, 30, 1.3]])}
    <path d="M12 13V21c0 3 .7 6 2 8.6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>`,

  scald: `<defs>${radial('a', [[0, '#ffffff'], [0.5, '#ffb0a0'], [1, '#e8402a']], '40%', '60%', '70%')}</defs>
    ${puffs([[16, 8, 4], [24, 5, 4.6], [32, 8, 4]], '#e8ecf2', '#fff', 1.2)}
    <path d="M24 12C31 21 36 27 36 33A12 12 0 0 1 12 33C12 27 17 21 24 12Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M16.6 31a7.4 7.4 0 0 1 3.6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M6 30c2-3-2-5 0-8M42 30c2-3-2-5 0-8" stroke="#ff7a4a" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'wave-crash': `<defs>${sea}${linear('r', [[0, '#9a8a80'], [1, '#4a3e3a']])}</defs>
    <path d="M28 46L32 28L40 22L46 26V46Z" fill="url(#$r)" ${line(2.4)}/>
    ${curl(-6, 2, 0.95)}
    ${puffs([[32, 18, 3.6], [38, 14, 3], [42, 18, 2.4], [28, 12, 2.4]], '#fff', null, 1.2)}
    ${drop(44, 8, 1.8, -40)}`,

  'origin-pulse': `<defs>${radial('a', [[0, '#ffffff'], [0.35, '#9ae0ff'], [1, '#1a4ea8']])}</defs>
    ${[20, 15].map((r, i) => `<circle cx="24" cy="24" r="${r}" fill="none" ${line(i ? 2 : 2.4)}/><circle cx="24" cy="24" r="${r}" fill="none" stroke="${i ? '#9ae0ff' : '#5ab8ff'}" stroke-width="1"/>`).join('')}
    <circle cx="24" cy="24" r="10" fill="url(#$a)" ${line(2.4)}/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<path transform="rotate(${a} 24 24)" d="M24 2V8" stroke="#ff5a8a" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
    <circle cx="21" cy="21" r="2.4" fill="#fff"/>`,

  'hydro-cannon': `<defs>${linear('a', [[0, '#d0d4e0'], [0.5, '#8a90a8'], [1, '#4a4e64']])}${radial('j', [[0, '#ffffff'], [0.4, '#9ae0ff'], [1, '#2a74d8']])}</defs>
    <g transform="rotate(-25 18 30)">
      <rect x="2" y="22" width="26" height="16" rx="3" fill="url(#$a)" ${line(2.6)}/>
      <rect x="26" y="19" width="7" height="22" rx="2.4" fill="#6a7088" ${line(2.2)}/>
      <path d="M5 26H25" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
    </g>
    <circle cx="37" cy="13" r="10" fill="url(#$j)" ${line(2.6)}/>
    <path d="M32 9a6 6 0 0 1 4-3" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${drop(46, 26, 1.8, 40)}${drop(26, 4, 1.8, -120)}`,

  droplet: `<path d="M24 4C32 15 38 22 38 30A14 14 0 0 1 10 30C10 22 16 15 24 4Z" fill="#7cc8ff" ${line(2.6)}/>
    <path d="M16 28a8.6 8.6 0 0 1 4.4-7.4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <circle cx="31" cy="34" r="1.6" fill="#fff" opacity="0.8"/>`,
};

function leafPair() {
  return `<path d="M4 40C10 30 24 30 30 38C22 44 10 44 4 40Z" fill="#62c050" ${line(2.2)}/>
    <path d="M8 40C14 37 22 37 27 38.6" stroke="#1d5a2a" stroke-width="1.2" opacity="0.6" fill="none"/>
    <path d="M44 36C40 28 30 28 26 36C32 40 40 40 44 36Z" fill="#7ad05a" ${line(2)}/>`;
}

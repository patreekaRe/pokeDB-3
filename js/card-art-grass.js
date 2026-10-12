/* ============================================================
   card-art-grass.js  -  Grass's cards drawn (batch 3 of the smooth
   card art, 2026-10-12). The starting deck's are in card-art.js.
   ============================================================ */

import {
  INK, f, line, star, leaf, spiral, sine, tube, sparkle, radial, linear,
  puffs, boot, sunDef, sun, speed, embers,
} from './card-art-kit.js';

const G1 = '#62c050', G2 = '#7ad05a', G3 = '#4cae3c', DARK = '#1d5a2a';
const leafy = linear('l', [[0, '#9ae060'], [1, '#2e8a2c']], 1, 1);
const PINK = '#ff9ac8';

/** A petal, its tip at angle degrees from (x, y). */
const petal = (x, y, len, angle, fill = PINK) => `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M0 0C${f(len * 0.2)} ${f(-len * 0.45)} ${f(len * 0.75)} ${f(-len * 0.45)} ${len} 0C${f(len * 0.75)} ${f(len * 0.45)} ${f(len * 0.2)} ${f(len * 0.45)} 0 0Z" fill="${fill}" ${line(1.6)}/>
    <path d="M${f(len * 0.2)} 0H${f(len * 0.6)}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.7"/></g>`;

/** A five-petalled flower. */
const flower = (cx, cy, r, fill = PINK, heart = '#ffd040') => [0, 72, 144, 216, 288].map((a) => petal(cx, cy, r, a - 90, fill)).join('')
  + `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.34)}" fill="${heart}" ${line(1.6)}/>`;

/** A mushroom cap and stalk standing on (x, y). */
const shroom = (x, y, r, cap, dots = '#fff') => `<path d="M${f(x - r * 0.35)} ${y}C${f(x - r * 0.3)} ${f(y - r * 0.6)} ${f(x - r * 0.25)} ${f(y - r * 0.8)} ${f(x - r * 0.28)} ${f(y - r)}H${f(x + r * 0.28)}C${f(x + r * 0.25)} ${f(y - r * 0.8)} ${f(x + r * 0.3)} ${f(y - r * 0.6)} ${f(x + r * 0.35)} ${y}Z" fill="#f4ecd8" ${line(2)}/>
  <path d="M${x - r} ${f(y - r * 0.9)}C${x - r} ${f(y - r * 2.2)} ${x + r} ${f(y - r * 2.2)} ${x + r} ${f(y - r * 0.9)}Z" fill="${cap}" ${line(2.4)}/>
  <circle cx="${f(x - r * 0.4)}" cy="${f(y - r * 1.35)}" r="${f(r * 0.2)}" fill="${dots}"/><circle cx="${f(x + r * 0.35)}" cy="${f(y - r * 1.5)}" r="${f(r * 0.15)}" fill="${dots}"/><circle cx="${f(x + r * 0.05)}" cy="${f(y - r * 1.1)}" r="${f(r * 0.12)}" fill="${dots}"/>`;

/** A seed, round end down, at (x, y). */
const seed = (x, y, r, rot = 0, fill = 'url(#$s)') => `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${f(r * 0.75)}" ry="${r}" fill="${fill}" ${line(Math.min(2.4, r * 0.3))}/>
  <ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.3)}" rx="${f(r * 0.16)}" ry="${f(r * 0.35)}" fill="#fff" opacity="0.6"/></g>`;
const seedDef = linear('s', [[0, '#d8a060'], [1, '#7a4a24']], 1, 1);

const spores = (list, fill) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${line(Math.min(1.3, r * 0.7))}/>`).join('');

const heart = (cx, cy, s, fill = '#ff6a8a') => `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 9C-5 5.4 -9 2.6 -9 -1.6C-9 -4.4 -7 -6.4 -4.6 -6.4C-2.6 -6.4 -1.2 -5.2 0 -3.4C1.2 -5.2 2.6 -6.4 4.6 -6.4C7 -6.4 9 -4.4 9 -1.6C9 2.6 5 5.4 0 9Z" fill="${fill}" ${line(1.8 / s)}/>
  <path transform="translate(${cx} ${cy}) scale(${s})" d="M-6 -2.6C-6 -4 -5 -4.6 -4 -4.6" stroke="#fff" stroke-width="${f(1.4 / s)}" stroke-linecap="round" fill="none"/>`;

const SHIELD = 'M24 4L41 9.5V22C41 33 33.5 40.5 24 44.5C14.5 40.5 7 33 7 22V9.5Z';

/** An apple; needs nothing in <defs>. */
const apple = (x, y, r, fill = '#e8303a', lit = '#ff8a8a') => `<path d="M${x} ${f(y - r * 0.7)}C${f(x - r * 0.4)} ${f(y - r * 1.1)} ${x - r} ${f(y - r)} ${x - r} ${f(y - r * 0.1)}C${x - r} ${f(y + r * 0.7)} ${f(x - r * 0.5)} ${f(y + r)} ${x} ${f(y + r * 0.8)}C${f(x + r * 0.5)} ${f(y + r)} ${x + r} ${f(y + r * 0.7)} ${x + r} ${f(y - r * 0.1)}C${x + r} ${f(y - r)} ${f(x + r * 0.4)} ${f(y - r * 1.1)} ${x} ${f(y - r * 0.7)}Z" fill="${fill}" ${line(2.4)}/>
  <path d="M${x} ${f(y - r * 0.7)}V${f(y - r * 1.25)}" ${line(2.2)}/>
  ${leaf(x, f(y - r * 1.1), f(r * 0.7), -30, G2)}
  <path d="M${f(x - r * 0.65)} ${f(y - r * 0.1)}C${f(x - r * 0.6)} ${f(y - r * 0.5)} ${f(x - r * 0.4)} ${f(y - r * 0.65)} ${f(x - r * 0.2)} ${f(y - r * 0.65)}" stroke="${lit}" stroke-width="2" stroke-linecap="round" fill="none"/>`;

const arrowUp = (x, y0, y1, colour) => `<path d="M${x} ${y0}V${y1}M${x - 5} ${y1 + 5}L${x} ${y1}l5 5" fill="none" ${line(5.4)}/>
  <path d="M${x} ${y0}V${y1}M${x - 5} ${y1 + 5}L${x} ${y1}l5 5" fill="none" stroke="${colour}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;

const ground = (y, fill = '#8a5a34') => `<path d="M2 ${y}C10 ${y - 2} 38 ${y - 2} 46 ${y}V46H2Z" fill="${fill}" ${line(2.4)}/>`;

export const GRASS = {
  'petal-dance': `${[[24, 24, 0, 13], [24, 24, 72, 13], [24, 24, 144, 13], [24, 24, 216, 13], [24, 24, 288, 13]].map(([x, y, a, r]) => {
    const rad = a * Math.PI / 180;
    return petal(f(x + r * Math.cos(rad)), f(y + r * Math.sin(rad)), 11, a + 120, a % 144 ? PINK : '#ffc8e0');
  }).join('')}
    ${tube(spiral(24, 24, 1.2, 7), 1.6, '#ffd0e6', null)}
    ${sparkle(42, 8, 2.6, '#ffe0f0')}${sparkle(6, 40, 2.4, '#ffe0f0')}`,

  'razor-leaf': `${leaf(14, 30, 24, -30, G1, 0.36)}${leaf(18, 40, 20, -18, G2, 0.36)}
    ${speed(12, [16, 22, 44], 8)}
    <path d="M36 12l6-3M38 20l6 0" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,

  growth: `${ground(40)}
    <path d="M24 40V16" ${line(5)}/><path d="M24 40V16" stroke="${G3}" stroke-width="2.6" stroke-linecap="round"/>
    ${leaf(24, 28, 13, -150, G1)}${leaf(24, 22, 14, -30, G2)}${leaf(24, 16, 10, -90, G1)}
    ${arrowUp(40, 30, 10, '#ffd040')}${arrowUp(8, 32, 16, '#ffd040')}`,

  'bullet-seed': `<defs>${seedDef}</defs>
    ${[[12, 34, 5], [24, 24, 5.4], [36, 14, 5.8]].map(([x, y, r]) => `<path d="M${x - 9} ${y + 6}L${x - 2} ${y + 1.6}" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>${seed(x, y, r, 55)}`).join('')}
    <polygon points="${star(42, 8, 6, 5, 2.2)}" fill="#ffd040" ${line(1.4)}/>`,

  rototiller: `${ground(32)}
    ${[10, 20, 30, 40].map((x) => `<path d="M${x - 4} 38q4-4 8 0" stroke="#5a3a20" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('')}
    <path d="M38 4L22 26" ${line(5.4)}/><path d="M38 4L22 26" stroke="#c88a4a" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M14 22L28 32M16 27L20 21M20 30L24 24M24 33L28 27" fill="none" ${line(2.4)}/>
    <path d="M14 22L28 32M16 27L20 21M20 30L24 24M24 33L28 27" fill="none" stroke="#c8ccd8" stroke-width="1.2" stroke-linecap="round"/>
    ${leaf(36, 10, 9, -40, G2)}`,

  'branch-poke': `<path d="M4 44L36 12M18 30L14 18M28 20L40 24" fill="none" ${line(6.4)}/>
    <path d="M4 44L36 12M18 30L14 18M28 20L40 24" fill="none" stroke="#a8743a" stroke-width="3.6" stroke-linecap="round"/>
    ${leaf(14, 18, 9, -110, G1)}${leaf(40, 24, 8, 10, G2)}
    <polygon points="${star(40, 8, 6, 6, 2.4)}" fill="#ffd040" ${line(1.5)}/>`,

  'wood-hammer': `<defs>${linear('a', [[0, '#d8a060'], [1, '#7a4a24']], 0, 1)}</defs>
    <path d="M22 22L8 44" ${line(6)}/><path d="M22 22L8 44" stroke="#c88a4a" stroke-width="3.4" stroke-linecap="round"/>
    <g transform="rotate(32 26 16)"><rect x="12" y="8" width="28" height="16" rx="3" fill="url(#$a)" ${line(2.6)}/>
      <ellipse cx="12" cy="16" rx="2.6" ry="8" fill="#e8c08a" ${line(2)}/><ellipse cx="12" cy="16" rx="1" ry="4" fill="#a8743a"/>
      <path d="M18 12H36M18 20H34" stroke="#5a3418" stroke-width="1.2" opacity="0.6"/></g>
    ${leaf(34, 8, 9, -60, G1)}
    <polygon points="${star(42, 38, 7, 5.6, 2.6)}" fill="#ffd040" ${line(1.5)}/>`,

  'mega-drain': `<defs>${leafy}${radial('a', [[0, '#fff'], [0.4, '#d8ffb0'], [1, '#5ccc3c']])}</defs>
    <path d="M4 30C4 16 14 6 28 6C30 20 20 30 4 30Z" fill="url(#$l)" ${line(2.4)}/>
    <path d="M6 28L24 10" stroke="${DARK}" stroke-width="1.2" opacity="0.6"/>
    ${[[18, 34, 3], [26, 30, 3.4], [32, 22, 2.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$a)" ${line(1.4)}/>`).join('')}
    ${heart(36, 36, 1.05)}`,

  'worry-seed': `<defs>${seedDef}</defs>
    ${seed(24, 26, 16)}
    <path d="M14 20l5 1.6M34 20l-5 1.6" ${line(2)}/>
    <ellipse cx="18.6" cy="25.6" rx="1.8" ry="2.4" fill="${INK}"/><ellipse cx="29.4" cy="25.6" rx="1.8" ry="2.4" fill="${INK}"/>
    <path d="M18 34q3-2.6 6 0t6 0" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${leaf(24, 10, 9, -60, G1)}
    <path d="M38 12c2 2 2 5 0 6" stroke="#7cc8ff" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,

  'snap-trap': `<defs>${leafy}</defs>
    <path d="M24 44V30" ${line(5)}/><path d="M24 44V30" stroke="${G3}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M24 30C10 30 4 20 6 8C14 8 22 16 24 30Z" fill="url(#$l)" ${line(2.4)}/>
    <path d="M24 30C38 30 44 20 42 8C34 8 26 16 24 30Z" fill="url(#$l)" ${line(2.4)}/>
    <path d="M24 30C16 26 12 20 10 12M24 30C32 26 36 20 38 12" stroke="#ff7a8a" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${[[8, 9], [12, 6.4], [17, 6], [31, 6], [36, 6.4], [40, 9]].map(([x, y]) => `<path d="M${x} ${y}l${x < 24 ? -1 : 1} -4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`).join('')}`,

  'leaf-guard': `<defs>${leafy}</defs>
    <path d="${SHIELD}" fill="url(#$l)" ${line(2.6)}/>
    <path d="M24 9V40M24 18L16 14M24 18L32 14M24 26L14 22M24 26L34 22M24 33L17 30M24 33L31 30" stroke="${DARK}" stroke-width="1.4" stroke-linecap="round" opacity="0.6" fill="none"/>
    <path d="M12 12V21c0 3 .7 6 2 8.6" stroke="#e0ffb8" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${heart(34, 36, 0.7)}`,

  sprout: `<defs>${seedDef}</defs>
    ${ground(36)}
    <ellipse cx="24" cy="36" rx="9" ry="6" fill="url(#$s)" ${line(2.2)}/>
    <path d="M20 33l2 3-2 3M28 33l-2 3 2 3" stroke="#3a2010" stroke-width="1.2" fill="none"/>
    <path d="M24 32V16" ${line(4.6)}/><path d="M24 32V16" stroke="${G3}" stroke-width="2.4" stroke-linecap="round"/>
    ${leaf(24, 18, 13, -155, G1)}${leaf(24, 18, 13, -25, G2)}
    ${sparkle(40, 10, 2.8, '#fffbd0')}`,

  'stun-spore': `${puffs([[16, 24, 8], [26, 20, 9], [34, 26, 7.4], [22, 30, 7]], '#f0e050', '#fff8a0')}
    <path d="M24 4L18 14H25L20 22" fill="none" ${line(4)}/><path d="M24 4L18 14H25L20 22" fill="none" stroke="#ffe94a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${spores([[8, 38, 1.6], [16, 42, 1.4], [30, 42, 1.6], [40, 38, 1.4], [42, 14, 1.4]], '#ffe94a')}`,

  'magical-leaf': `<defs>${linear('a', [[0, '#ff9ae6'], [0.5, '#9ae060'], [1, '#5ab8ff']], 1, 1)}</defs>
    ${leaf(8, 40, 38, -45, 'url(#$a)', 0.45)}
    ${sparkle(8, 10, 3.4, '#fff4a0')}${sparkle(40, 36, 3, '#ffe0f6')}${sparkle(36, 6, 2.2, '#e0f6ff')}${sparkle(14, 24, 2, '#fff')}`,

  'sweet-scent': `${flower(17, 30, 10)}
    <path d="M17 40V46" ${line(3.6)}/>
    ${tube('M28 22C32 18 28 14 32 10S38 6 40 4', 1.8, '#ffb0d8', null)}
    ${tube('M30 30C35 28 34 22 40 21S44 16 46 14', 1.8, '#ffb0d8', null)}
    ${heart(40, 34, 0.55, '#ff8ab8')}`,

  'apple-acid': `${apple(22, 24, 15)}
    <path d="M14 38c0 4 2 6 2 6M26 38c1 3 0 6 0 6" stroke="#b8f040" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    ${[[16, 45, 1.8], [26, 45.4, 1.6], [38, 40, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#b8f040" ${line(1.2)}/>`).join('')}
    <path d="M30 30c4 2 5 4 6 8" stroke="#b8f040" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,

  'leaf-blade': `<defs>${linear('a', [[0, '#e8ffb8'], [1, '#2e8a2c']], 1, 0)}</defs>
    <path d="M40 4C44 10 38 22 20 32L16 28C24 12 34 4 40 4Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M38 7C34 14 28 22 19 29" stroke="${DARK}" stroke-width="1.2" opacity="0.6" fill="none"/>
    <path d="M12 26L24 36" ${line(5)}/><path d="M12 26L24 36" stroke="#a8743a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M17 32L7 43" ${line(5)}/><path d="M17 32L7 43" stroke="#5a3418" stroke-width="2.6" stroke-linecap="round"/>
    ${sparkle(30, 30, 2.6, '#fffbd0')}`,

  'power-whip': `${tube('M4 44C8 28 30 34 30 20C30 12 22 10 18 14', 6, G3, '#a8e870')}
    ${leaf(10, 32, 10, -160, G1)}${leaf(26, 30, 9, 20, G2)}
    <polygon points="${star(36, 10, 9, 10, 4.6)}" fill="#ffd040" ${line(1.8)}/><circle cx="36" cy="10" r="2" fill="#fff"/>`,

  trailblaze: `${ground(30, '#8ad050')}
    <path d="M14 46C16 40 22 36 24 30" fill="none" ${line(12)}/><path d="M14 46C16 40 22 36 24 30" fill="none" stroke="#e8c898" stroke-width="9" stroke-linecap="round"/>
    ${[[17, 41, -20], [22, 34, -30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#8a5a34" transform="rotate(${r} ${x} ${y})"/>`).join('')}
    <path d="M24 26C26 18 32 14 38 10M32 8L39 9L37 16" fill="none" ${line(5.4)}/>
    <path d="M24 26C26 18 32 14 38 10M32 8L39 9L37 16" fill="none" stroke="#ffd040" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    ${leaf(8, 22, 10, -150, G1)}${leaf(42, 30, 9, -30, G2)}${leaf(4, 34, 8, -110, G2)}${leaf(14, 10, 8, -60, G1)}`,

  'needle-arm': `<defs>${leafy}</defs>
    <path d="M14 46V22C14 16 20 14 22 20V46ZM22 32H30C34 32 34 26 34 22V12C34 8 40 8 40 12V24C40 34 36 38 30 38H22Z" fill="url(#$l)" ${line(2.4)}/>
    ${[[14, 28, -1], [14, 38, -1], [22, 24, 1], [34, 16, -1], [40, 18, 1], [40, 28, 1], [28, 38, 0]].map(([x, y, d]) => d ? `<path d="M${x} ${y}h${d * 4}" ${line(1.6)}/>` : `<path d="M${x} ${y}v4" ${line(1.6)}/>`).join('')}
    ${flower(37, 9, 4, '#ffd040', '#ff7a2a')}`,

  'horn-leech': `<defs>${radial('a', [[0, '#fff'], [0.4, '#d8ffb0'], [1, '#5ccc3c']])}${linear('h', [[0, '#f4ecd8'], [1, '#a88a5a']], 1, 0)}</defs>
    <path d="M8 44C10 30 18 16 34 6C30 16 26 30 22 44Z" fill="url(#$h)" ${line(2.6)}/>
    <path d="M12 38h10M14 32h9M17 26h8M20 20h7" stroke="#8a6a3a" stroke-width="1.4" stroke-linecap="round"/>
    ${leaf(26, 14, 9, -80, G1)}
    ${[[36, 22, 3], [40, 32, 3.4], [34, 40, 2.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$a)" ${line(1.4)}/>`).join('')}`,

  'grass-pledge': `<defs>${leafy}</defs>
    <ellipse cx="24" cy="40" rx="18" ry="5.4" fill="${G3}" ${line(2.2)}/>
    <ellipse cx="24" cy="40" rx="12" ry="3.2" fill="#b8f070"/>
    <path d="M16 40C15 28 18 14 24 2C30 14 33 28 32 40Z" fill="url(#$l)" ${line(2.4)}/>
    ${leaf(17, 26, 9, -150, G2)}${leaf(31, 18, 9, -30, G2)}${leaf(18, 12, 7, -130, G1)}
    <path d="M20 36C19.6 28 21 18 24 10" stroke="#e8ffc8" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${sparkle(9, 14, 3, '#fffbd0')}${sparkle(40, 26, 2.6, '#fffbd0')}`,

  'spiky-shield': `<defs>${linear('a', [[0, '#9ae060'], [1, '#3a6a2a']], 1, 1)}</defs>
    ${[[24, 2], [36, 5], [44, 14], [12, 5], [4, 14], [44, 28], [4, 28], [36, 40], [12, 40]].map(([x, y]) => {
    const a = Math.atan2(y - 24, x - 24);
    return `<polygon points="${f(x)},${f(y)} ${f(24 + 16 * Math.cos(a - 0.25))},${f(24 + 16 * Math.sin(a - 0.25))} ${f(24 + 16 * Math.cos(a + 0.25))},${f(24 + 16 * Math.sin(a + 0.25))}" fill="#f4ecd8" ${line(1.6)}/>`;
  }).join('')}
    <circle cx="24" cy="24" r="16" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 12L33 17V26C33 31 29 34 24 36C19 34 15 31 15 26V17Z" fill="#f0e0a0" ${line(1.8)}/>
    <path d="M12 18A13 13 0 0 1 20 10" stroke="#d8ffb0" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  synthesis: `<defs>${sunDef}${leafy}</defs>
    ${sun(34, 12, 7, 10)}
    <path d="M4 44C4 28 14 18 30 18C32 34 22 44 4 44Z" fill="url(#$l)" ${line(2.6)}/>
    <path d="M6 42L26 22" stroke="${DARK}" stroke-width="1.2" opacity="0.6"/>
    <path d="M28 22L22 28M30 26l-4 4" stroke="#fff6a0" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2 2"/>
    ${sparkle(14, 30, 2.6, '#fffbd0')}${sparkle(40, 32, 3, '#fffbd0')}`,

  ingrain: `${ground(24, '#7a4e2c')}
    <path d="M24 24V40M24 30L14 38L10 44M24 32L34 40L38 45M24 36L18 44M24 36L30 44" fill="none" stroke="#e8d0a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 24V6" ${line(5)}/><path d="M24 24V6" stroke="${G3}" stroke-width="2.6" stroke-linecap="round"/>
    ${leaf(24, 16, 13, -160, G1)}${leaf(24, 12, 13, -20, G2)}${leaf(24, 6, 8, -90, G1)}`,

  chlorophyll: `<defs>${leafy}${sunDef}</defs>
    ${sun(36, 10, 6, 10)}
    <path d="M6 42C6 22 18 10 36 10C38 30 26 42 6 42Z" fill="url(#$l)" ${line(2.6)}/>
    ${[[16, 32], [20, 24], [26, 28], [28, 18], [14, 38]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.6" fill="#2e8a2c" ${line(1)}/>`).join('')}
    <path d="M9 39L33 14" stroke="${DARK}" stroke-width="1.2" opacity="0.5"/>
    <path d="M36 32V42M31 37H41" ${line(5)}/><path d="M36 32V42M31 37H41" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,

  'strength-sap': `<defs>${linear('b', [[0, '#a87a4a'], [1, '#5a3a20']], 1, 0)}${radial('a', [[0, '#fff3c0'], [0.5, '#ffb030'], [1, '#c86a10']], '40%', '35%', '70%')}</defs>
    <rect x="4" y="2" width="20" height="44" fill="url(#$b)" ${line(2.4)}/>
    <path d="M10 6V18M16 14V30M10 26V40M18 36V44" stroke="#3a2010" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M24 14C22 18 22 20 24 22" fill="#ffb030" ${line(1.6)}/>
    <path d="M30 18C36 26 40 31 40 35A8 8 0 0 1 24 35C24 31 26 26 30 18Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M27 34a4 4 0 0 1 2-4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'grassy-glide': `${leaf(14, 30, 30, -10, G1, 0.4)}
    ${speed(12, [20, 26], 9)}
    ${[6, 14, 22, 30, 38, 44].map((x) => `<path d="M${x} 46l-2-8M${x} 46l2-7" ${line(1.8)} stroke="${G3}"/>`).join('')}
    <path d="M2 46H46" ${line(2.2)}/>`,

  'floral-healing': `${flower(24, 22, 14)}${heart(24, 22, 0.55)}
    ${leaf(24, 36, 10, 140, G1)}${leaf(24, 36, 10, 40, G2)}
    <path d="M24 32V46" ${line(4)}/><path d="M24 32V46" stroke="${G3}" stroke-width="2" stroke-linecap="round"/>`,

  aromatherapy: `<defs>${linear('a', [[0, '#e8d0ff'], [1, '#9a6ad8']], 1, 1)}</defs>
    <path d="M14 22H34L38 44H10Z" fill="url(#$a)" ${line(2.4)}/>
    <rect x="20" y="14" width="8" height="8" fill="#e8e4f0" ${line(2)}/>
    <path d="M14 30H36" stroke="#fff" stroke-width="1.6" opacity="0.6"/>
    ${flower(24, 36, 4.4, '#fff', '#ffd040')}
    ${tube('M24 12C20 8 26 6 22 2', 1.6, '#e0c8ff', null)}
    ${tube('M30 10C34 6 30 4 36 2', 1.6, '#e0c8ff', null)}
    ${sparkle(8, 12, 2.8, '#f0e0ff')}${sparkle(42, 22, 2.4, '#f0e0ff')}`,

  'seed-flare': `<defs>${seedDef}</defs>
    <polygon points="${star(24, 24, 12, 22, 12, -90)}" fill="#c8f070" ${line(2.2)}/>
    <polygon points="${star(24, 24, 12, 14, 9, -75)}" fill="#fffbe0"/>
    ${seed(24, 24, 8)}
    ${[[6, 8, 30], [42, 10, -30], [42, 40, 40], [6, 40, -40]].map(([x, y, r]) => seed(x, y, 2.6, r)).join('')}`,

  'sleep-powder': `${puffs([[18, 30, 8], [28, 28, 9], [36, 34, 6.6], [22, 36, 6]], '#a8c8f0', '#e0ecff')}
    ${spores([[10, 42, 1.4], [32, 44, 1.6], [42, 42, 1.3]], '#c8dcff')}
    <text x="30" y="16" font-family="sans-serif" font-weight="900" font-size="11" fill="#e0ecff" stroke="${INK}" stroke-width="1.4" paint-order="stroke">Z</text>
    <text x="38" y="9" font-family="sans-serif" font-weight="900" font-size="8" fill="#e0ecff" stroke="${INK}" stroke-width="1.2" paint-order="stroke">z</text>
    <text x="22" y="20" font-family="sans-serif" font-weight="900" font-size="7" fill="#e0ecff" stroke="${INK}" stroke-width="1.1" paint-order="stroke">z</text>`,

  spore: `${shroom(24, 44, 14, '#e8403a')}
    ${spores([[8, 10, 2], [16, 4, 1.6], [28, 6, 1.8], [38, 4, 1.4], [42, 12, 1.8], [4, 20, 1.4], [44, 22, 1.4]], '#f0e8a0')}`,

  'effect-spore': `${shroom(16, 44, 9, '#a050d8')}${shroom(32, 44, 11, '#e8803a')}
    ${spores([[10, 8, 1.6], [20, 4, 1.8], [30, 6, 1.6], [40, 4, 1.8], [44, 14, 1.4], [4, 16, 1.4]], '#ffe070')}
    <path d="M24 2L20 8h4l-3 6" fill="none" stroke="#ffe94a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,

  'leaf-tornado': `<defs>${linear('a', [[0, '#b8f070'], [1, '#3a8a2c']])}</defs>
    <path d="M6 6C14 3 34 3 42 6C40 12 33 16 31 22C29 28 27 34 26 44H22C21 36 19 30 16 24C13 18 8 12 6 6Z" fill="url(#$a)" opacity="0.85" ${line(2.4)}/>
    <path d="M10 8.6C18 12 30 12 38 8.6M14 16C20 19 28 19 34 16M18 25C21 27 26 27 30 25" stroke="#e8ffc8" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${leaf(2, 20, 9, -20, G1)}${leaf(36, 30, 9, 20, G2)}${leaf(8, 36, 7, -40, G2)}${leaf(36, 10, 7, -10, G1)}`,

  'rage-powder': `${puffs([[16, 28, 8], [26, 24, 9], [34, 30, 7.4], [22, 34, 7]], '#e85a5a', '#ff9a8a')}
    ${spores([[8, 42, 1.6], [30, 44, 1.4], [42, 40, 1.6]], '#ff8a7a')}
    <g transform="translate(36 11) rotate(8)">
      <path d="M-7 -2C-3 -2 -2 -3 -2 -7M2 -7C2 -3 3 -2 7 -2M7 2C3 2 2 3 2 7M-2 7C-2 3 -3 2 -7 2" fill="none" ${line(5)}/>
      <path d="M-7 -2C-3 -2 -2 -3 -2 -7M2 -7C2 -3 3 -2 7 -2M7 2C3 2 2 3 2 7M-2 7C-2 3 -3 2 -7 2" fill="none" stroke="#e8203a" stroke-width="2.6" stroke-linecap="round"/></g>`,

  'forests-curse': `<defs>${linear('a', [[0, '#5a4a6a'], [1, '#2a1a34']])}</defs>
    <path d="M18 46V28L10 18M18 32L28 22M26 46V30" fill="none" ${line(6)}/>
    <path d="M18 46V28L10 18M18 32L28 22M22 46V30" fill="none" stroke="url(#$a)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    ${puffs([[12, 14, 7], [24, 10, 9], [36, 14, 7.4], [24, 20, 7]], '#3a5a3a', '#4a7a4a')}
    <path d="M17 13l4 2-4 1.4ZM31 13l-4 2 4 1.4Z" fill="#d870ff" ${line(1)}/>
    ${spores([[40, 30, 1.6], [6, 30, 1.4], [38, 40, 1.4], [8, 42, 1.2]], '#b860e8')}`,

  powder: `<defs>${radial('a', [[0, '#fff'], [1, '#ffc8e0']], '40%', '35%', '70%')}</defs>
    <path d="M10 36C10 28 16 24 24 24S38 28 38 36C38 42 32 44 24 44S10 42 10 36Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M18 24C18 18 30 18 30 24" fill="#ff9ac8" ${line(2)}/>
    ${puffs([[22, 12, 5], [30, 9, 4.4], [36, 14, 3.6], [16, 8, 3.4]], '#ffe0f0', '#fff', 1.1)}
    ${spores([[10, 16, 1.3], [42, 22, 1.4], [40, 4, 1.2]], '#ffc8e0')}`,

  'trop-kick': `${flower(13, 12, 7, '#ff6a8a', '#ffe070')}
    ${leaf(6, 28, 12, -170, G1)}${leaf(10, 36, 10, 170, G2)}
    ${boot(28, 32, 1.05, -25, '#40b060')}
    <polygon points="${star(42, 22, 6, 5.5, 2.6)}" fill="#ffd040" ${line(1.5)}/>`,

  'grav-apple': `${apple(24, 18, 12)}
    <path d="M10 6v8M38 6v8M14 2v6M34 2v6" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>
    <polygon points="${star(24, 40, 10, 10, 5, -90)}" fill="#ffd040" ${line(1.8)}/>
    <path d="M2 44.6H46" ${line(2.2)}/>
    <path d="M4 40l4 2M44 40l-4 2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,

  'drum-beating': `<defs>${linear('a', [[0, '#d8a060'], [1, '#7a4a24']], 1, 0)}</defs>
    <path d="M8 22V38C8 42 15 45 24 45S40 42 40 38V22Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M8 26L16 40M16 26L24 42M24 26L32 42M32 26L40 40" stroke="#ffd040" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    <ellipse cx="24" cy="22" rx="16" ry="5.4" fill="#f4ecd8" ${line(2.4)}/>
    ${leaf(8, 28, 7, 160, G1)}
    <path d="M14 4L22 20M36 4L28 20" ${line(5)}/><path d="M14 4L22 20M36 4L28 20" stroke="#a8743a" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="14" cy="4" r="2.4" fill="#f4ecd8" ${line(1.4)}/><circle cx="36" cy="4" r="2.4" fill="#f4ecd8" ${line(1.4)}/>`,

  'spicy-extract': `<defs>${linear('a', [[0, '#ff7a6a'], [1, '#b8201a']], 1, 1)}</defs>
    <path d="M30 12C36 14 38 20 34 28C30 36 20 44 8 44C16 40 22 32 24 24C26 16 26 12 30 12Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M30 12C30 8 34 4 38 4" fill="none" ${line(4.4)}/><path d="M30 12C30 8 34 4 38 4" fill="none" stroke="${G3}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M26 12C30 9 34 10 34 14C31 13 28 13 26 12Z" fill="${G1}" ${line(1.6)}/>
    <path d="M28 18C28 24 26 30 22 34" stroke="#ffc0b0" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M40 22c2-3-2-5 0-8M44 32c2-3-2-5 0-8" stroke="#ff7a2a" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  chloroblast: `<defs>${radial('a', [[0, '#fff'], [0.35, '#e0ffb0'], [1, '#3a9a2c']])}${linear('b', [[0, '#f0ffc8'], [1, '#5ccc3c']], 1, 0)}</defs>
    <path d="M14 18L46 6V42L14 30Z" fill="url(#$b)" ${line(2.4)}/>
    <path d="M18 22L44 14M18 26L44 34" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    <circle cx="13" cy="24" r="10" fill="url(#$a)" ${line(2.6)}/>
    <path d="M8 21a6 6 0 0 1 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'flower-shield': `<defs>${linear('a', [[0, '#eef2fa'], [1, '#7e8aa8']], 1, 1)}</defs>
    <path d="${SHIELD}" fill="url(#$a)" ${line(2.6)}/>
    ${flower(24, 23, 9)}
    <path d="M12 12V21c0 3 .7 6 2 8.6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>`,

  'sappy-seed': `<defs>${seedDef}</defs>
    ${seed(22, 20, 14)}
    <path d="M14 30C14 36 16 38 16 42M24 32C24 36 26 38 26 44" stroke="#ffb030" stroke-width="3.4" stroke-linecap="round" fill="none"/>
    <circle cx="16" cy="43" r="2.2" fill="#ffb030" ${line(1.4)}/><circle cx="26" cy="45" r="1.8" fill="#ffb030" ${line(1.2)}/>
    ${tube('M34 12C40 12 42 18 38 22S40 30 44 30', 2, G3, '#a8e870')}
    ${leaf(34, 12, 7, -100, G1)}`,

  'cotton-spore': `${[[12, 14, 8], [26, 10, 9], [38, 22, 7.4], [18, 32, 7.4], [34, 38, 6]].map(([x, y, r]) => `<path d="M${x} ${y + r * 0.4}V${y + r * 1.4}" ${line(1.6)}/>${puffs([[x, y, r * 0.5]], '#fff', null, 1.2)}${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M${x} ${y}l${f(r * 0.7 * Math.cos(a * Math.PI / 180))} ${f(r * 0.7 * Math.sin(a * Math.PI / 180))}" stroke="#d8cdec" stroke-width="1.2" stroke-linecap="round"/>`).join('')}`).join('')}`,

  'energy-ball': `<defs>${radial('a', [[0, '#ffffff'], [0.35, '#e0ffb0'], [0.75, '#5ccc3c'], [1, '#2e8a2c']], '42%', '40%', '65%')}</defs>
    <circle cx="24" cy="24" r="18" fill="url(#$a)" ${line(2.6)}/>
    <path d="M12 20C16 16 20 22 24 18S32 22 36 18M12 28C16 24 20 30 24 26S32 30 36 26" stroke="#f0ffc8" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.8"/>
    <path d="M13 17a12 12 0 0 1 7-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    ${sparkle(42, 6, 2.6, '#f0ffc8')}${sparkle(6, 42, 2.4, '#f0ffc8')}`,

  'aromatic-mist': `${[14, 24, 34].map((y, i) => tube(sine(4 + i * 3, 44 - i * 3, y, 2, 1.5), 4, '#ffd8ec', '#fff')).join('')}
    ${flower(36, 38, 5.4, PINK, '#ffd040')}
    ${sparkle(8, 42, 2.4, '#fff')}`,

  'solar-beam': `<defs>${sunDef}${linear('b', [[0, '#fffbe0'], [1, '#ffe060']], 1, 0)}</defs>
    <path d="M18 16L46 8V40L18 32Z" fill="url(#$b)" ${line(2.4)}/>
    <path d="M22 20L44 14M22 28L44 34" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
    ${sun(14, 24, 9, 12)}
    ${leaf(6, 40, 9, -40, G1)}`,

  'grassy-terrain': `${ground(34, '#8ad050')}
    ${[[8, 34], [16, 34], [24, 33], [32, 34], [40, 34]].map(([x, y]) => `<path d="M${x - 3} ${y}L${x - 4} ${y - 9}L${x} ${y - 2}L${x + 1} ${y - 11}L${x + 2} ${y - 2}L${x + 5} ${y - 8}L${x + 3} ${y}Z" fill="${G3}" ${line(1.6)}/>`).join('')}
    ${flower(12, 40, 3, '#fff', '#ffd040')}${flower(34, 41, 3, '#ffd040', '#ff7a2a')}
    ${sparkle(38, 10, 3, '#fffbd0')}${sparkle(10, 12, 2.4, '#fffbd0')}`,

  'growth-spurt': `${ground(40)}
    <path d="M18 40V8" ${line(5)}/><path d="M18 40V8" stroke="${G3}" stroke-width="2.6" stroke-linecap="round"/>
    ${leaf(18, 32, 11, -160, G1)}${leaf(18, 24, 11, -20, G2)}${leaf(18, 16, 10, -160, G1)}${leaf(18, 8, 9, -40, G2)}
    ${arrowUp(36, 34, 18, '#ffd040')}${arrowUp(36, 24, 8, '#ffd040')}`,

  'solar-blade': `<defs>${sunDef}${linear('a', [[0, '#fffbe0'], [1, '#c8f040']], 1, 0)}</defs>
    ${sun(38, 10, 5, 10)}
    <path d="M34 8L40 12L18 34L14 30Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M36 9.6L16 31" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
    <path d="M10 26L22 36" ${line(5)}/><path d="M10 26L22 36" stroke="${G3}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M16 32L6 43" ${line(5)}/><path d="M16 32L6 43" stroke="#7a4a24" stroke-width="2.6" stroke-linecap="round"/>
    ${sparkle(28, 30, 2.4, '#fffbd0')}`,

  harvest: `<defs>${linear('a', [[0, '#e0b070'], [1, '#9a6a34']])}</defs>
    ${[[16, 22, '#e8303a'], [26, 20, '#5a8ae8'], [34, 24, '#ffb030'], [21, 15, '#c050c0'], [30, 14, '#e8303a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}" ${line(1.8)}/><circle cx="${x - 1.6}" cy="${y - 1.6}" r="1.4" fill="#fff" opacity="0.7"/>`).join('')}
    ${leaf(24, 10, 8, -100, G1)}
    <path d="M6 26H42L38 44H10Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M8 32H40M9 38H39M16 26L18 44M24 26V44M32 26L30 44" stroke="#6a4420" stroke-width="1.2" opacity="0.6"/>`,

  'jungle-healing': `<defs>${leafy}</defs>
    <path d="M24 44C8 40 2 28 6 14C12 8 22 6 24 6C26 6 36 8 42 14C46 28 40 40 24 44Z" fill="url(#$l)" ${line(2.6)}/>
    <path d="M24 44V8M24 16L12 12M24 24L8 22M24 32L10 34M24 16L36 12M24 24L40 22M24 32L38 34" stroke="${DARK}" stroke-width="1.4" opacity="0.6" fill="none"/>
    <path d="M6 22L10 22M42 22L38 22M8 30L12 30M40 30L36 30" stroke="#f6e2d0" stroke-width="2"/>
    ${heart(24, 24, 0.9)}`,

  'grassy-surge': `${[[4, 40], [12, 38], [20, 36], [28, 34], [36, 32]].map(([x, y], i) => `<path d="M${x} 46L${x + 1} ${y - i * 2}L${x + 6} 46Z" fill="${i % 2 ? G2 : G3}" ${line(1.8)}/>`).join('')}
    ${tube('M4 24C14 14 26 26 36 14', 3, '#c8f070', '#fffbe0')}
    <polygon points="${star(40, 10, 6, 6, 2.6)}" fill="#ffd040" ${line(1.5)}/>
    ${leaf(12, 10, 8, -60, G1)}`,

  'leech-life': `<path d="M8 8H40C40 8 36 12 33 12C31 22 28 28 26 30C25 24 24 18 24 12C24 18 23 24 22 30C20 28 17 22 15 12C12 12 8 8 8 8Z" fill="#fff" ${line(2.4)}/>
    <path d="M8 8H40" ${line(2.6)}/>
    <path d="M24 32C29 38 32 41 32 44A8 8 0 0 1 16 44C16 41 19 38 24 32Z" fill="#e8303a" ${line(2.2)}/>
    <path d="M19.6 43a4 4 0 0 1 2-3" stroke="#ffb0b0" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${leaf(36, 22, 8, -20, G1)}${leaf(12, 22, 8, -160, G2)}`,

  'seed-sower': `<defs>${seedDef}${linear('a', [[0, '#e8d0a0'], [1, '#a88a5a']])}</defs>
    <path d="M6 24C6 18 10 16 16 16H24C30 16 32 22 30 30L28 40C27 44 22 46 16 44C8 42 6 34 6 24Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M10 16C10 12 20 10 24 14" fill="none" ${line(2.4)}/>
    <path d="M12 26H26" stroke="#8a6a3a" stroke-width="1.4" stroke-linecap="round"/>
    ${[[34, 14, 2.6, 30], [40, 22, 2.4, 60], [36, 30, 2.6, 20], [44, 34, 2.2, 80], [40, 42, 2.4, 40]].map(([x, y, r, a]) => seed(x, y, r, a)).join('')}`,

  'matcha-gotcha': `<defs>${linear('a', [[0, '#f4f0e8'], [1, '#b8b0a0']])}</defs>
    ${puffs([[18, 8, 3], [24, 5, 3.4], [30, 8, 3]], '#e8ecf2', '#fff', 1)}
    <path d="M6 20H42C42 34 34 42 24 42S6 34 6 20Z" fill="url(#$a)" ${line(2.6)}/>
    <ellipse cx="24" cy="20" rx="18" ry="4.6" fill="#7ac040" ${line(2.2)}/>
    <ellipse cx="22" cy="19.6" rx="8" ry="2" fill="#b8f070"/>
    <path d="M10 26C12 32 16 36 20 38" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M16 42H32V45H16Z" fill="#b8b0a0" ${line(2)}/>`,

  'natures-madness': `<defs>${radial('a', [[0, '#d8ffb0'], [1, '#2a5a2a']])}</defs>
    <circle cx="24" cy="24" r="20" fill="url(#$a)" ${line(2.6)}/>
    ${tube(spiral(24, 24, 2, 16), 2.2, '#5a2a7a', '#c890ff')}
    ${[0, 90, 180, 270].map((a) => leaf(24, 24, 18, a + 20, G2, 0.3)).join('')}
    <polygon points="${star(24, 24, 5, 5.4, 2.4)}" fill="#ffd040" ${line(1.5)}/>`,

  'pollen-puff': `<defs>${radial('a', [[0, '#fffbe0'], [0.6, '#ffe060'], [1, '#e8a020']], '40%', '35%', '70%')}</defs>
    ${[...Array(14)].map((_, i) => { const a = i * 360 / 14, r = a * Math.PI / 180; return `<circle cx="${f(24 + 16 * Math.cos(r))}" cy="${f(24 + 16 * Math.sin(r))}" r="4.6" fill="#ffe060" ${line(1.6)}/>`; }).join('')}
    <circle cx="24" cy="24" r="15" fill="url(#$a)" ${line(2)}/>
    ${spores([[20, 20, 1.4], [28, 22, 1.2], [22, 28, 1.2], [29, 29, 1.4]], '#e8a020')}
    <path d="M14 20a10 10 0 0 1 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'sap-sipper': `<defs>${radial('a', [[0, '#fff3c0'], [0.5, '#ffb030'], [1, '#c86a10']], '40%', '35%', '70%')}</defs>
    <path d="M22 14C32 26 38 33 38 38A12 12 0 0 1 14 38C14 33 16 26 22 14" fill="url(#$a)" ${line(2.6)}/>
    <path d="M18 37a6 6 0 0 1 3-5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M28 34L36 6H44" fill="none" ${line(5)}/><path d="M28 34L36 6H44" fill="none" stroke="${PINK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${leaf(8, 10, 9, 20, G1)}`,

  'petal-storm': `${[...Array(10)].map((_, i) => { const a = i * 36, r = (i % 2 ? 9 : 16), rad = a * Math.PI / 180; return petal(f(24 + r * Math.cos(rad)), f(24 + r * Math.sin(rad)), i % 2 ? 7 : 9, a + 100, i % 3 ? PINK : '#ffd0e8'); }).join('')}
    ${tube(spiral(24, 24, 1.4, 6), 1.6, '#ffe0f0', null)}
    ${speed(44, [6, 42], 6)}`,

  'leech-seed': `<defs>${seedDef}</defs>
    ${tube('M24 22C14 20 8 26 6 34', 2.4, G3, '#a8e870')}${tube('M24 22C34 20 40 26 42 34', 2.4, G3, '#a8e870')}${tube('M24 28C22 34 26 40 22 46', 2.4, G3, '#a8e870')}
    ${seed(24, 18, 11)}
    ${leaf(24, 8, 9, -130, G1)}${leaf(24, 8, 9, -50, G2)}
    ${leaf(6, 34, 6, 120, G1)}${leaf(42, 34, 6, 60, G2)}`,

  'bulk-up': `<defs>${linear('a', [[0, '#8a90a8'], [1, '#3a3e54']])}</defs>
    <path d="M12 24H36" ${line(6.4)}/><path d="M12 24H36" stroke="#c8ccd8" stroke-width="3.6" stroke-linecap="round"/>
    ${[[4, 9], [11, 13], [37, 13], [44, 9]].map(([x, h], i) => `<rect x="${i < 2 ? x - 3 : x - 3}" y="${24 - h}" width="6" height="${h * 2}" rx="2" fill="url(#$a)" ${line(2.2)}/>`).join('')}
    ${leaf(24, 22, 10, -130, G1)}${leaf(24, 22, 10, -50, G2)}
    ${sparkle(24, 40, 3, '#fffbd0')}${sparkle(14, 42, 2, '#fffbd0')}${sparkle(34, 42, 2, '#fffbd0')}`,

  'razor-storm': `${[...Array(6)].map((_, i) => leaf(24, 24, 18, i * 60 + 15, i % 2 ? G1 : G2, 0.3)).join('')}
    <circle cx="24" cy="24" r="3" fill="#e8ffc8" ${line(1.6)}/>
    ${tube('M6 12A20 20 0 0 1 20 4', 1.4, '#e8ffc8', null)}${tube('M42 36A20 20 0 0 1 28 44', 1.4, '#e8ffc8', null)}`,

  'poison-powder': `${puffs([[16, 28, 8], [26, 24, 9], [34, 30, 7.4], [22, 34, 7]], '#a860d8', '#d0a0f0')}
    <path d="M22 18C22 14 30 14 30 18C30 21 28 22 28 23H24C24 22 22 21 22 18Z" fill="#fff" ${line(1.6)}/>
    <circle cx="24.6" cy="18.6" r="1" fill="${INK}"/><circle cx="27.4" cy="18.6" r="1" fill="${INK}"/>
    ${spores([[8, 42, 1.6], [30, 44, 1.4], [42, 40, 1.6], [40, 12, 1.4], [8, 12, 1.4]], '#c890f0')}`,

  'giga-drain': `<defs>${leafy}${radial('a', [[0, '#fff'], [0.4, '#d8ffb0'], [1, '#5ccc3c']])}</defs>
    <path d="M2 26C2 12 14 2 30 2C32 18 20 28 2 26Z" fill="url(#$l)" ${line(2.4)}/>
    <path d="M4 24L26 6" stroke="${DARK}" stroke-width="1.2" opacity="0.6"/>
    ${[[14, 32, 3], [22, 28, 3.6], [30, 20, 3], [38, 14, 2.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$a)" ${line(1.4)}/>`).join('')}
    ${heart(32, 36, 1.3)}`,

  'petal-blizzard': `${[[8, 8], [20, 4], [34, 6], [44, 14], [14, 18], [28, 16], [40, 26], [6, 28], [20, 30], [32, 32], [12, 42], [26, 42], [40, 40]].map(([x, y], i) => petal(x - 4, y, 8, i * 47, i % 3 ? PINK : '#fff0f6')).join('')}
    ${speed(46, [22, 36], 6)}`,

  'leaf-storm': `<polygon points="${star(24, 24, 10, 22, 12, -90)}" fill="#c8f070" ${line(2)}/>
    ${[...Array(8)].map((_, i) => leaf(24, 24, 20, i * 45 - 90, i % 2 ? G1 : G2, 0.36)).join('')}
    <circle cx="24" cy="24" r="5" fill="#fffbe0" ${line(1.8)}/>`,

  'frenzy-plant': `<defs>${linear('a', [[0, '#8a6a3a'], [1, '#4a3018']])}</defs>
    ${ground(40, '#6a4426')}
    ${[['M10 44C6 30 14 22 8 8', 4.6], ['M24 44C28 30 18 18 26 2', 5.4], ['M38 44C42 32 34 24 42 12', 4.6]].map(([d, w]) => tube(d, w, '#7a5a30', '#b8905a')).join('')}
    ${[[8, 8], [26, 2], [42, 12]].map(([x, y]) => `<polygon points="${x - 3},${y + 4} ${x},${y - 3} ${x + 3},${y + 4}" fill="#f4ecd8" ${line(1.4)}/>`).join('')}
    ${leaf(10, 26, 9, -150, G1)}${leaf(22, 22, 9, -160, G2)}${leaf(38, 28, 9, -20, G1)}
    ${[[16, 36], [32, 30]].map(([x, y]) => `<path d="M${x} ${y}l-3 -2M${x} ${y}l3 -2" ${line(1.6)}/>`).join('')}`,

  seedling: `${ground(36, '#9a6a3a')}
    <path d="M24 36V22" ${line(4.6)}/><path d="M24 36V22" stroke="${G3}" stroke-width="2.4" stroke-linecap="round"/>
    ${leaf(24, 24, 13, -160, G1)}${leaf(24, 24, 13, -20, G2)}
    ${sparkle(38, 12, 2.6, '#fffbd0')}`,
};

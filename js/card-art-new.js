/* ============================================================
   card-art-new.js  -  the 2026-10-16 balance pass's 32 new cards
   drawn, in the smooth card art's style (48x48, dark outline;
   see card-art.js). One batch for every type, since they came in
   together.
   ============================================================ */

import {
  INK, f, line, flame, star, leaf, drop, sine, spiral, tube, sparkle, radial, linear, HOT,
  hot, blaze, puffs, fist, speed, gear, embers,
} from './card-art-kit.js';

const sea = linear('w', [[0, '#9ae0ff'], [0.5, '#3a96f0'], [1, '#1a4ea8']]);
const mind = radial('p', [[0, '#ffe6ff'], [0.5, '#e07cf0'], [1, '#7a2ab0']], '40%', '38%', '70%');
const coin = radial('c', [[0, '#fff6c0'], [0.55, '#ffd040'], [1, '#c88a10']], '38%', '35%', '70%');

export const NEW = {
  /* ---------- Neutral ---------- */
  harden: `<defs>${radial('a', [[0, '#e6e2d6'], [0.6, '#a8a090'], [1, '#6a6254']], '38%', '32%', '72%')}</defs>
    <path d="M8 34L12 15L24 8L37 13L41 30L31 41H16Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M12 15L22 22L24 8M22 22L37 13M22 22L26 41M22 22L8 34" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round" fill="none" opacity="0.55"/>
    <path d="M14 17L21 12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    ${sparkle(39, 9, 3.4)}${sparkle(7, 22, 2.4)}`,

  return: `<defs>${radial('a', [[0, '#fff'], [0.4, '#ffe9a0'], [1, '#ff9a30']])}</defs>
    <rect x="22" y="9" width="17" height="24" rx="3" fill="#fff6e0" ${line(2.2)}/>
    <rect x="26" y="14" width="9" height="9" rx="1.6" fill="#ffcf60" ${line(1.4)}/>
    <path d="M10 30A14 14 0 0 1 19 14" fill="none" ${line(5.2)}/>
    <path d="M10 30A14 14 0 0 1 19 14" fill="none" stroke="#5ac46a" stroke-width="3" stroke-linecap="round"/>
    <polygon points="14,11 23,12 18,20" fill="#5ac46a" ${line(1.8)}/>
    <polygon points="${star(13, 37, 8, 8, 4)}" fill="url(#$a)" ${line(1.8)}/>`,

  'fake-out': `<defs>${radial('a', [[0, '#fff'], [0.4, '#fff3a0'], [1, '#ffb030']])}</defs>
    <polygon points="${star(24, 24, 10, 13, 7)}" fill="url(#$a)" ${line(2)}/>
    <g transform="rotate(-18 13 26)"><rect x="5" y="17" width="14" height="18" rx="5" fill="#ffd0a8" ${line(2.2)}/><path d="M9 17v-4M12.5 17v-5M16 17v-4" ${line(2)}/></g>
    <g transform="rotate(18 35 26)"><rect x="29" y="17" width="14" height="18" rx="5" fill="#ffd0a8" ${line(2.2)}/><path d="M32 17v-4M35.5 17v-5M39 17v-4" ${line(2)}/></g>
    ${sparkle(24, 7, 3)}${sparkle(24, 41, 2.6)}`,

  recycle: `<g fill="#4ac06a" ${line(2)}>
    <path d="M24 6L33 18H27V24H21V18H15Z" transform="rotate(0 24 24)"/>
    <path d="M24 6L33 18H27V24H21V18H15Z" transform="rotate(120 24 24)"/>
    <path d="M24 6L33 18H27V24H21V18H15Z" transform="rotate(240 24 24)"/></g>
    <circle cx="24" cy="24" r="5" fill="#e6fff0" ${line(1.8)}/>`,

  charm: `<defs>${radial('a', [[0, '#ffe4f0'], [0.6, '#ff8ab8'], [1, '#d03a7a']], '38%', '32%', '72%')}</defs>
    <path d="M24 41C8 30 4 21 7.5 14C11 7 19.5 7.5 24 14C28.5 7.5 37 7 40.5 14C44 21 40 30 24 41Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M11 15.5C12.4 12.4 15.4 11.4 18 12.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    ${sparkle(38, 34, 3.2)}${sparkle(10, 33, 2.4)}${sparkle(42, 8, 2.2)}`,

  'pay-day': `<defs>${coin}</defs>
    <circle cx="16" cy="31" r="10" fill="url(#$c)" ${line(2.2)}/>
    <circle cx="31" cy="19" r="12" fill="url(#$c)" ${line(2.4)}/>
    <circle cx="31" cy="19" r="7.5" fill="none" stroke="#c88a10" stroke-width="1.6"/>
    <path d="M28 15.5h4.2a2.4 2.4 0 0 1 0 4.8H28V24M26.6 18h6.6" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M24 11.5A9 9 0 0 1 30 8.6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${sparkle(41, 33, 3)}${sparkle(7, 17, 2.4)}`,

  sketch: `<path d="M7 41L11 30L32 9L39 16L18 37Z" fill="#f2c060" ${line(2.4)}/>
    <path d="M32 9L39 16L42 13C43.2 11.8 43.2 10 42 8.8L39.2 6C38 4.8 36.2 4.8 35 6Z" fill="#ff8ab8" ${line(2.2)}/>
    <path d="M7 41L11 30L18 37Z" fill="#f6e4c8" ${line(1.8)}/>
    <path d="M14 33L30 17" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    <path d="M24 42C30 39 36 41 42 38" stroke="#7a6ae0" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,

  'mega-evolution': `<defs>${radial('a', [[0, '#fff'], [0.35, '#ffe9f8'], [0.7, '#c87af0'], [1, '#4a2a9a']])}</defs>
    <polygon points="${star(24, 24, 14, 21, 12)}" fill="#ffd040" ${line(1.8)}/>
    <circle cx="24" cy="24" r="12" fill="url(#$a)" ${line(2.4)}/>
    <path d="M18 18C21 16 25 16 28 19C30 22 26 24 24 26C22 28 24 31 28 30" stroke="#ff5a9a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M30 18C27 21 29 25 26 28" stroke="#5ab0ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,

  /* ---------- Fire ---------- */
  'blazing-torque': `<defs>${hot}${radial('g', [[0, '#e8ecf4'], [1, '#7a849a']], '40%', '35%', '70%')}</defs>
    ${blaze(34, 4, 30, 15)}
    <polygon points="${gear(19, 29, 13, 9)}" fill="url(#$g)" ${line(2.2)}/>
    <circle cx="19" cy="29" r="4.6" fill="#3a3450" ${line(1.8)}/>
    ${speed(8, [12, 18], 7)}`,

  ignite: `<defs>${hot}</defs>
    ${blaze(24, 6, 42, 22)}
    <path d="M27 14L19 26H25L21 36L31 22H25Z" fill="#ffe94a" ${line(1.8)}/>
    ${embers([[8, 14, 1.8], [40, 12, 1.6], [42, 30, 1.4]])}`,

  'burning-spirit': `<defs>${hot}</defs>
    ${blaze(24, 3, 30, 26)}
    <ellipse cx="18.5" cy="22" rx="3" ry="4" fill="#2a1420"/><ellipse cx="29.5" cy="22" rx="3" ry="4" fill="#2a1420"/>
    <path d="M17 31Q24 26 31 31" stroke="#2a1420" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <rect x="9" y="34" width="13" height="10" rx="2" fill="#c8c0d8" ${line(2)} transform="rotate(-10 15 39)"/>
    <path d="M12 38l6 2M13 41l4 1" stroke="${INK}" stroke-width="1.2" transform="rotate(-10 15 39)"/>`,

  'flame-rush': `<defs>${hot}</defs>
    ${blaze(30, 8, 40, 20, 2.4, 70)}
    ${speed(14, [14, 22, 30], 10)}
    <circle cx="40" cy="12" r="4" fill="#d8d0ff" ${line(1.6)}/>
    <path d="M38 10.4l4 3.2M42 10.4l-4 3.2" stroke="${INK}" stroke-width="1.2"/>`,

  'inferno-overdrive': `<defs>${hot}</defs>
    ${blaze(16, 8, 38, 16, 2.2, -12)}
    ${blaze(32, 8, 38, 16, 2.2, 12)}
    <path d="M12 41C16 35 20 35 24 41C28 47 32 47 36 41C32 35 28 35 24 41C20 47 16 47 12 41Z" fill="#ffe94a" ${line(1.8)}/>`,

  'desolate-land': `<defs>${radial('s', [[0, '#fffbe0'], [0.45, '#ffb030'], [1, '#e8401c']], '50%', '40%', '70%')}${linear('d', [[0, '#e8a050'], [1, '#a8461c']])}</defs>
    <circle cx="24" cy="17" r="11" fill="url(#$s)" ${line(2.4)}/>
    <path d="M3 33C10 28 18 30 24 32C30 34 38 31 45 29V45H3Z" fill="url(#$d)" ${line(2.4)}/>
    <path d="M12 38l4-3l2 4M30 40l3-4l3 3" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
    <path d="M8 23C9.5 21.5 11 23 12.5 21.5M35 9C36.5 7.5 38 9 39.5 7.5" stroke="#ff7a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,

  /* ---------- Grass ---------- */
  'ivy-cudgel': `<path d="M12 42L32 10" fill="none" ${line(7.4)}/>
    <path d="M12 42L32 10" stroke="#a8743a" stroke-width="4.6" stroke-linecap="round"/>
    <ellipse cx="33" cy="10" rx="8" ry="6" fill="#8a5a2a" ${line(2.2)} transform="rotate(-30 33 10)"/>
    ${leaf(20, 28, 11, -150, '#5ac46a')}${leaf(26, 20, 11, 20, '#7ad46a')}${leaf(16, 35, 9, 30, '#4aa85a')}`,

  'flower-trick': `${[0, 72, 144, 216, 288].map(a => `<ellipse cx="24" cy="12" rx="6" ry="9" fill="#ff7aa8" ${line(2)} transform="rotate(${a} 24 24)"/>`).join('')}
    <circle cx="24" cy="24" r="6" fill="#ffd040" ${line(2)}/>
    <circle cx="22.4" cy="22.4" r="1.8" fill="#fff6c8"/>
    ${sparkle(41, 41, 3.2)}${sparkle(7, 41, 2.4)}`,

  'grass-whistle': `<path d="M8 36C14 30 22 24 34 14" fill="none" ${line(8.2)}/><path d="M8 36C14 30 22 24 34 14" stroke="#7ad46a" stroke-width="5.4" stroke-linecap="round" fill="none"/>
    <path d="M30 26c2-1 4 0 4 2v8a3 3 0 1 1-2-2.8V27Z" fill="#c8f0d0" ${line(1.8)}/>
    <path d="M38 6c2-1 4 0 4 2v8a3 3 0 1 1-2-2.8V7Z" fill="#c8f0d0" ${line(1.8)}/>`,

  leafage: `${leaf(10, 38, 24, -50, '#e8a040')}${leaf(16, 40, 22, -20, '#d86a2a')}${leaf(12, 30, 20, -80, '#7ad46a')}
    ${speed(8, [12, 18], 6)}${sparkle(40, 14, 2.8)}`,

  'bloom-doom': `<defs>${radial('a', [[0, '#fff'], [0.4, '#ffe0f0'], [1, '#ff5a9a']])}</defs>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="24" cy="9" rx="5.6" ry="9" fill="${a % 90 ? '#ff7ab8' : '#ffb0d8'}" ${line(1.8)} transform="rotate(${a} 24 24)"/>`).join('')}
    <circle cx="24" cy="24" r="8" fill="url(#$a)" ${line(2.2)}/>
    <path d="M24 19v10M19 24h10" stroke="#5ac46a" stroke-width="2.4" stroke-linecap="round"/>`,

  overgrowth: `<path d="M24 44V20" fill="none" ${line(7)}/><path d="M24 44V20" stroke="#8a5a2a" stroke-width="4.2" stroke-linecap="round"/>
    ${puffs([[24, 15, 10], [14, 20, 7], [34, 20, 7], [18, 9, 6], [30, 9, 6]], '#4aa85a', '#7ad46a')}
    <path d="M10 40H38" ${line(2.4)}/><path d="M6 44C10 38 16 38 18 44M30 44C32 38 38 38 42 44" fill="#5ac46a" ${line(1.8)}/>`,

  /* ---------- Water ---------- */
  'hydro-steam': `<defs>${sea}${hot}</defs>
    <path d="M6 44C6 34 14 28 24 28C34 28 42 34 42 44Z" fill="url(#$w)" ${line(2.4)}/>
    ${puffs([[16, 18, 7], [26, 14, 8], [35, 19, 6]], '#f0f4ff', '#fff')}
    ${blaze(24, 26, 40, 9, 1.8)}`,

  'gulp-missile': `<defs>${sea}</defs>
    <path d="M6 26C12 16 26 14 36 20L44 14V36L36 30C26 36 12 34 6 26Z" fill="url(#$w)" ${line(2.4)}/>
    <circle cx="13" cy="24" r="2.4" fill="${INK}"/><circle cx="12.4" cy="23.4" r="0.8" fill="#fff"/>
    <path d="M20 22c2 2 2 6 0 8" stroke="#c8ecff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    ${speed(4, [12, 40], 6)}`,

  undercurrent: `<defs>${sea}</defs>
    <path d="M4 40V30C10 26 14 34 20 30C26 26 30 34 36 30C40 28 42 29 44 30V40Z" fill="url(#$w)" ${line(2.4)}/>
    <path d="${spiral(24, 15, 2.2, 10)}" fill="none" ${line(4)}/><path d="${spiral(24, 15, 2.2, 10)}" fill="none" stroke="#7cc8ff" stroke-width="2" stroke-linecap="round"/>
    <path d="M30 34l6 6M36 34l-6 6" stroke="#ffd040" stroke-width="2.2" stroke-linecap="round"/>`,

  'steam-eruption': `<defs>${sea}</defs>
    <path d="M8 44L18 22H30L40 44Z" fill="#8a7a6a" ${line(2.4)}/>
    <path d="M18 22H30L28 26H20Z" fill="#3a96f0" ${line(1.6)}/>
    ${puffs([[24, 12, 7], [15, 9, 5], [33, 9, 5], [24, 4, 4]], '#eef4ff', '#fff')}
    <path d="M22 28v6M26 30v8" stroke="#7cc8ff" stroke-width="2" stroke-linecap="round"/>`,

  downpour: `${puffs([[16, 12, 7], [26, 9, 8], [35, 13, 6]], '#c8d4e8', '#eef2fa')}
    ${[[12, 24], [20, 26], [28, 24], [36, 26], [16, 34], [24, 36], [32, 34]].map(([x, y]) => drop(x, y, 2.2, 100)).join('')}`,

  'eye-of-the-storm': `<defs>${sea}</defs>
    <path d="${spiral(24, 24, 2.6, 20)}" fill="none" ${line(5)}/><path d="${spiral(24, 24, 2.6, 20)}" fill="none" stroke="#5ab0f0" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="5.4" fill="#fff6c8" ${line(2)}/>
    <circle cx="24" cy="24" r="2.2" fill="${INK}"/>`,

  /* ---------- Psychic ---------- */
  'expanding-force': `<defs>${mind}</defs>
    <circle cx="24" cy="24" r="19" fill="none" stroke="#c87af0" stroke-width="2" opacity="0.6"/>
    <circle cx="24" cy="24" r="13" fill="none" ${line(1.6)}/><circle cx="24" cy="24" r="13" fill="none" stroke="#e0a0ff" stroke-width="2.4" opacity="0.8"/>
    <circle cx="24" cy="24" r="7" fill="url(#$p)" ${line(2.2)}/>
    ${sparkle(24, 3.5, 2.8)}${sparkle(44, 24, 2.4)}${sparkle(5, 30, 2.4)}`,

  'magic-room': `<defs>${mind}</defs>
    <path d="M6 40V16L24 6L42 16V40Z" fill="#3a2a5a" ${line(2.4)}/>
    <path d="M14 40V26H34V40" fill="url(#$p)" ${line(2)}/>
    ${sparkle(16, 18, 3, '#ffe060')}${sparkle(32, 16, 2.4, '#ffe060')}${sparkle(24, 32, 3.4)}`,

  'cosmic-power': `<defs>${mind}</defs>
    <circle cx="24" cy="26" r="11" fill="url(#$p)" ${line(2.4)}/>
    <ellipse cx="24" cy="26" rx="19" ry="5" fill="none" stroke="#ffd040" stroke-width="2.2" transform="rotate(-18 24 26)"/>
    ${sparkle(8, 9, 3, '#ffe060')}${sparkle(40, 8, 2.4)}${sparkle(41, 41, 2.6, '#ffe060')}`,

  meditate: `<defs>${mind}</defs>
    <circle cx="24" cy="12" r="6" fill="#ffd0a8" ${line(2.2)}/>
    <path d="M14 34C14 24 19 20 24 20C29 20 34 24 34 34Z" fill="#7a5ad0" ${line(2.2)}/>
    <path d="M8 40C14 34 20 36 24 38C28 36 34 34 40 40Z" fill="#9a7ae8" ${line(2.2)}/>
    <circle cx="24" cy="24" r="21" fill="none" stroke="url(#$p)" stroke-width="2.6" opacity="0.8"/>`,

  'psychic-terrain': `<defs>${linear('t', [[0, '#ff9ae0'], [0.5, '#c87af0'], [1, '#5a7af0']], 1, 0)}</defs>
    <path d="M3 30C14 24 34 24 45 30V44H3Z" fill="url(#$t)" ${line(2.4)}/>
    <path d="M7 36C16 32 32 32 41 36" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.7"/>
    <path d="M10 22A14 14 0 0 1 38 22" stroke="#ff7ab8" stroke-width="2.6" fill="none"/>
    <path d="M14 22A10 10 0 0 1 34 22" stroke="#ffd040" stroke-width="2.6" fill="none"/>
    <path d="M18 22A6 6 0 0 1 30 22" stroke="#5ab0ff" stroke-width="2.6" fill="none"/>`,

  'lunar-blessing': `<defs>${radial('m', [[0, '#fffbe8'], [0.6, '#f0e2a0'], [1, '#c8a850']], '35%', '35%', '75%')}</defs>
    <path d="M30 6A18 18 0 1 0 42 34A14 14 0 1 1 30 6Z" fill="url(#$m)" ${line(2.4)}/>
    ${sparkle(36, 12, 3.2, '#e0c0ff')}${sparkle(40, 22, 2.2, '#e0c0ff')}
    <path d="M14 28h6M17 25v6" stroke="#ff7ab8" stroke-width="2.4" stroke-linecap="round"/>`,
};

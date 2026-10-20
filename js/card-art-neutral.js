/* ============================================================
   card-art-neutral.js  -  the cards any type can be offered, the
   status cards and the Safari's Bait and Rock, drawn (batch 5 of
   the smooth card art, 2026-10-12). Tackle and Block are in
   card-art.js.
   ============================================================ */

import {
  INK, f, line, star, spiral, sine, tube, sparkle, radial, linear,
  puffs, boot, fist, speed,
} from './card-art-kit.js';

const steel = linear('m', [[0, '#f4f6fc'], [0.5, '#a8b0c8'], [1, '#5a6280']], 1, 1);
const SHIELD = 'M24 4L41 9.5V22C41 33 33.5 40.5 24 44.5C14.5 40.5 7 33 7 22V9.5Z';
const GREY = '#a8a4b0', GREY_LIT = '#d8d4e0';

const burst = (x, y, r, fill = '#ffd040', rot = -90) => `<polygon points="${star(x, y, 9, r, r * 0.52, rot)}" fill="${fill}" ${line(2)}/>
  <polygon points="${star(x, y, 9, r * 0.6, r * 0.34, rot + 20)}" fill="#fff6c0"/>`;

const blade = (x, y, len, angle, hilt = '#ffd040') => `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M0 -2.4H${len}L${len + 4} 0L${len} 2.4H0Z" fill="url(#$m)" ${line(2)}/>
    <path d="M2 -0.6H${len}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
    <path d="M-1 -6V6" ${line(4.6)}/><path d="M-1 -6V6" stroke="${hilt}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M-2 0H-9" ${line(4.6)}/><path d="M-2 0H-9" stroke="#7a3a2a" stroke-width="2.4" stroke-linecap="round"/></g>`;

const silhouette = (x, fill, op = 1, dash = '') => `<path transform="translate(${x} 0)" d="M-8 44C-8 34 -6 28 0 26C-4 24 -6 20 -6 16C-6 10 -3 6 0 6S6 10 6 16C6 20 4 24 0 26C6 28 8 34 8 44Z" fill="${fill}" opacity="${op}" ${line(2.2)} ${dash}/>`;

export const NEUTRAL = {
  'iron-defense': `<defs>${steel}</defs>
    <path d="${SHIELD}" fill="url(#$m)" ${line(2.8)}/>
    <path d="M24 9L36.6 13.2V22C36.6 30.4 31 36.6 24 39.8C17 36.6 11.4 30.4 11.4 22V13.2Z" fill="none" stroke="#5a6280" stroke-width="1.6"/>
    ${[[24, 7], [38.4, 11.6], [9.6, 11.6], [38.6, 24], [9.4, 24], [24, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#e8ecf6" ${line(1)}/>`).join('')}
    <path d="M17 18H31M17 24H31M18 30H30" stroke="#5a6280" stroke-width="2" stroke-linecap="round"/>
    <path d="M13.5 13.5V21c0 3 .7 5.6 2 8" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'quick-guard': `<defs>${linear('a', [[0, '#fff8d0'], [1, '#f0a020']], 1, 1)}</defs>
    ${speed(12, [14, 24, 34], 9)}
    <circle cx="28" cy="24" r="17" fill="url(#$a)" ${line(2.6)}/>
    <circle cx="28" cy="24" r="11" fill="none" stroke="#c87a10" stroke-width="1.6"/>
    <path d="M30 13L23 26H29L25 36L35 21H29L32 13Z" fill="#fff" ${line(1.8)}/>
    <path d="M16 18a13 13 0 0 1 7-6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  potion: `<defs>${linear('a', [[0, '#d8a0f8'], [1, '#7a3ac8']], 1, 0)}</defs>
    <rect x="19" y="3" width="10" height="5" rx="1.4" fill="#e8e4f0" ${line(2)}/>
    <path d="M17 8H31V12H29L28 14H20L19 12H17Z" fill="#a8b0c8" ${line(2)}/>
    <path d="M14 18C14 15 17 14 20 14H28C31 14 34 15 34 18V40C34 43 31 45 28 45H20C17 45 14 43 14 40Z" fill="url(#$a)" ${line(2.6)}/>
    <rect x="14" y="24" width="20" height="10" fill="#fff" ${line(1.8)}/>
    <path d="M24 26.4V31.6M21.4 29H26.6" stroke="#e8303a" stroke-width="2" stroke-linecap="round"/>
    <path d="M17.6 18V22M17.6 37V41" stroke="#f0d8ff" stroke-width="2" stroke-linecap="round"/>
    <path d="M31 10H38" ${line(2)}/>${puffs([[41, 9, 1.6], [44, 6, 1.2], [44, 12, 1.2]], '#e8e4f0', null, 1)}`,

  smokescreen: `${puffs([[14, 30, 9], [26, 26, 11], [36, 32, 8], [20, 18, 7], [32, 16, 6.4], [10, 20, 5]], '#5a5468', '#7a7488')}
    ${puffs([[8, 40, 3], [42, 40, 3.4], [40, 8, 2.4]], '#7a7488', null, 1.1)}`,

  tailwind: `<path d="M6 36Q24 28 42 36L40 42H8Z" fill="#c8c4f0" ${line(2.2)}/>
    <path d="M10 37Q24 32 38 37" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
    <path d="M14 10H22L14 20H22M26 16H32L26 24H32M34 6H38L34 12H38" fill="none" ${line(2.2)}/>`,

  'lucky-claw': `<defs>${linear('a', [[0, '#ffffff'], [1, '#c8c4d8']], 1, 1)}</defs>
    ${[0, 1, 2].map((i) => `<path d="M${10 + i * 9} 40C${12 + i * 9} 28 ${18 + i * 9} 16 ${26 + i * 9} 6C${24 + i * 9} 18 ${20 + i * 9} 30 ${16 + i * 9} 42Z" fill="url(#$a)" ${line(2.2)}/>`).join('')}
    ${[[8, 14, 0], [8, 14, 90], [8, 14, 180], [8, 14, 270]].map(([x, y, a]) => `<circle cx="${f(x + 3 * Math.cos(a * Math.PI / 180))}" cy="${f(y + 3 * Math.sin(a * Math.PI / 180))}" r="3" fill="#4cae3c" ${line(1.4)}/>`).join('')}
    ${sparkle(42, 38, 3, '#fff4a0')}`,

  'double-hit': `${burst(16, 18, 13)}${burst(32, 32, 13, '#ff8a3a', -70)}`,

  'swords-dance': `<defs>${steel}</defs>
    ${blade(10, 38, 30, -45)}${blade(38, 38, 30, -135)}
    ${sparkle(24, 8, 3.6, '#fff4a0')}${sparkle(8, 20, 2.4, '#fff4a0')}${sparkle(40, 20, 2.4, '#fff4a0')}`,

  agility: `${speed(16, [16, 26, 36], 12)}
    ${boot(30, 34, 1, -10, '#5a9ae8')}
    <path d="M22 18C18 14 18 8 22 6C24 10 26 14 26 18ZM18 22C12 20 10 14 12 10C16 14 20 16 22 20Z" fill="#fff" ${line(1.8)}/>`,

  leer: `${[[15, 24], [33, 24]].map(([x, y]) => `<path d="M${x - 9} ${y + 2}Q${x} ${y - 9} ${x + 9} ${y - 2}Q${x} ${y + 7} ${x - 9} ${y + 2}Z" fill="#fff" ${line(2.4)}/><circle cx="${x + 1}" cy="${y}" r="3.4" fill="#e8203a" ${line(1.4)}/><circle cx="${x + 1}" cy="${y}" r="1.4" fill="${INK}"/>`).join('')}
    <path d="M5 14L22 19M43 14L26 19" ${line(3)}/>
    <path d="M6 36l3 4M24 36v5M42 36l-3 4" stroke="#e8203a" stroke-width="2" stroke-linecap="round"/>`,

  'quick-attack': `<path d="M2 34L18 30L14 22L30 18L26 10L44 8" fill="none" ${line(6.4)}/>
    <path d="M2 34L18 30L14 22L30 18L26 10L44 8" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${burst(38, 12, 7)}
    ${speed(12, [42, 46], 8)}`,

  'rapid-spin': `<defs>${radial('a', [[0, '#e8b060'], [1, '#9a5e26']], '40%', '35%', '70%')}</defs>
    ${[18, 13].map((r, i) => `<ellipse cx="24" cy="28" rx="${r + 3}" ry="${f(r * 0.4)}" fill="none" stroke="${i ? '#fff' : '#c8ecff'}" stroke-width="2" stroke-dasharray="5 3"/>`).join('')}
    <ellipse cx="24" cy="22" rx="12" ry="10" fill="url(#$a)" ${line(2.4)}/>
    <path d="M20 16h8l3 6-3 6h-8l-3-6Z" fill="#c88440" ${line(1.4)}/>
    <path d="M24 38V44" ${line(3)}/>
    <path d="M6 10A10 10 0 0 1 14 4M42 10A10 10 0 0 0 34 4" fill="none" ${line(2)}/>`,

  'double-team': `${silhouette(12, '#c8c4d8', 0.5, 'stroke-dasharray="3 2"')}${silhouette(36, '#c8c4d8', 0.5, 'stroke-dasharray="3 2"')}${silhouette(24, '#8a84a8')}
    <path d="M21 14a4 4 0 0 1 2-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  substitute: `<defs>${linear('a', [[0, '#fff4c8'], [1, '#e0c070']], 1, 1)}</defs>
    <path d="M14 12L12 2L20 8ZM34 12L36 2L28 8Z" fill="url(#$a)" ${line(2)}/>
    <ellipse cx="24" cy="18" rx="12" ry="10" fill="url(#$a)" ${line(2.4)}/>
    <path d="M14 26C10 32 10 40 14 44H34C38 40 38 32 34 26Z" fill="url(#$a)" ${line(2.4)}/>
    <circle cx="19.6" cy="17" r="1.8" fill="${INK}"/><circle cx="28.4" cy="17" r="1.8" fill="${INK}"/>
    <path d="M22 22l2 1.4 2-1.4" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M24 28V42M20 30l8 2M20 35l8 2M20 40l8 2" stroke="#a88a40" stroke-width="1.2" stroke-linecap="round"/>`,

  mimic: `${[[8, 12, -10], [22, 8, 10]].map(([x, y, r], i) => `<rect x="${x}" y="${y}" width="18" height="26" rx="2.6" transform="rotate(${r} ${x + 9} ${y + 13})" fill="${i ? '#fff4e0' : '#e8d8c0'}" ${line(2.4)}/>`).join('')}
    <path d="M27 18H36M27 23H34" stroke="#c8b098" stroke-width="1.6" stroke-linecap="round" transform="rotate(10 31 21)"/>
    <path d="M14 40C18 44 30 44 34 40" fill="none" ${line(2.2)}/>
    <path d="M30 37l4 3-4 3" fill="none" ${line(2.2)}/>
    ${sparkle(42, 8, 2.8, '#fff4a0')}`,

  endure: `<path d="M24 42C11 33 4 27 4 18C4 12 8.6 7 14 7C18 7 21.6 9.4 24 13C26.4 9.4 30 7 34 7C39.4 7 44 12 44 18C44 27 37 33 24 42Z" fill="#e8405a" ${line(2.6)}/>
    <path d="M14 30L34 18" ${line(9)}/><path d="M14 30L34 18" stroke="#f6e0c0" stroke-width="6" stroke-linecap="round"/>
    <path d="M20 26.4l2 3.4M24 24l2 3.4M28 21.6l2 3.4" stroke="#c8a888" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M9 16C9 13 11 11 14 11" stroke="#ffb0c0" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  metronome: `<defs>${linear('a', [[0, '#e0b070'], [1, '#8a5a2a']], 1, 0)}</defs>
    <path d="M16 6H32L40 44H8Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M14 34H34V40H14Z" fill="#f4ecd8" ${line(1.6)}/>
    <path d="M24 36L32 8" ${line(3.4)}/><path d="M24 36L32 8" stroke="#c8ccd8" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="27" y="16" width="6" height="5" rx="1" transform="rotate(16 30 18.5)" fill="#ffd040" ${line(1.4)}/>
    <path d="M8 14q-4 4 0 8M40 14q4 4 0 8" stroke="#ff8ae0" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'hyper-beam': `<defs>${radial('a', [[0, '#fff'], [0.35, '#fff3a0'], [1, '#ff8a24']])}${linear('b', [[0, '#fffbe0'], [1, '#ffb030']], 1, 0)}</defs>
    <path d="M16 15L46 9V39L16 33Z" fill="url(#$b)" ${line(2.4)}/>
    <path d="M20 20L44 16M20 28L44 32" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 18L46 14M18 30L46 34" stroke="#ff8a24" stroke-width="1" opacity="0.6"/>
    <circle cx="13" cy="24" r="10" fill="url(#$a)" ${line(2.6)}/>
    <path d="M8 21a6 6 0 0 1 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'last-resort': `<defs>${radial('a', [[0, '#ffffff'], [0.4, '#fff3a0'], [1, '#f0a020']], '45%', '40%', '70%')}</defs>
    <polygon points="${star(24, 25, 5, 21, 9)}" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 13V27" ${line(5.6)}/><path d="M24 13V27" stroke="#e8203a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="33" r="2.6" fill="#e8203a" ${line(1.4)}/>`,

  confusion: `${tube(spiral(24, 24, 2.4, 16), 3, GREY, '#fff')}
    ${[[8, 8], [40, 10], [40, 40]].map(([x, y]) => `<polygon points="${star(x, y, 5, 4, 1.7)}" fill="${GREY_LIT}" ${line(1.4)}/>`).join('')}`,

  paralysis: `<path d="M28 4L14 26H23L18 44L36 18H26L32 4Z" fill="${GREY_LIT}" ${line(2.6)}/>
    <path d="M27 8L19.6 22" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M8 14l4 2M6 24h5M40 28l-4 1M42 36l-4-1" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,

  poison: `<path d="M24 4C32 14 38 21 38 29A14 14 0 0 1 10 29C10 21 16 14 24 4Z" fill="${GREY}" ${line(2.6)}/>
    <path d="M18 26C18 20 30 20 30 26C30 30 28 31 28 32H20C20 31 18 30 18 26Z" fill="#fff" ${line(1.6)}/>
    <circle cx="21.6" cy="26.4" r="1.6" fill="${INK}"/><circle cx="26.4" cy="26.4" r="1.6" fill="${INK}"/>
    <path d="M21 34v3M24 34v3M27 34v3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M15 24a8 8 0 0 1 3-6" stroke="${GREY_LIT}" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  sludge: `<path d="M4 40C4 34 8 32 12 32C12 26 16 22 22 22C26 16 34 16 36 24C42 24 44 30 44 34C46 38 44 42 40 42H8C5 42 4 41 4 40Z" fill="${GREY}" ${line(2.6)}/>
    <path d="M12 42V45M30 42V46" ${line(3.6)}/><path d="M12 42V45M30 42V46" stroke="${GREY}" stroke-width="1.8" stroke-linecap="round"/>
    ${puffs([[18, 12, 2.4], [30, 8, 2], [38, 14, 1.6]], GREY, null, 1.1)}
    <path d="M14 34C16 30 20 28 24 28" stroke="${GREY_LIT}" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  bait: `<defs>${radial('a', [[0, '#f8d898'], [1, '#b87a3a']], '40%', '35%', '70%')}</defs>
    <circle cx="24" cy="26" r="16" fill="url(#$a)" ${line(2.6)}/>
    ${[[18, 20], [28, 18], [22, 30], [32, 28], [16, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#6a3a1a"/>`).join('')}
    <path d="M13 20a12 12 0 0 1 6-6" stroke="#fff4d0" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M16 8c2-2 0-4 2-6M28 8c2-2 0-4 2-6" stroke="#c8a888" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  rock: `<defs>${linear('a', [[0, '#a89a90'], [1, '#5a4e46']], 1, 1)}</defs>
    <polygon points="8,30 14,16 26,10 38,16 42,30 34,40 16,40" fill="url(#$a)" ${line(2.6)}/>
    <path d="M14 16L22 24L26 10M22 24L16 40M22 24L38 28" stroke="${INK}" stroke-width="1.4" fill="none" opacity="0.5"/>
    <path d="M16 18L22 13" stroke="#e0d8d0" stroke-width="2" stroke-linecap="round"/>
    ${speed(8, [40, 44], 6)}`,
};

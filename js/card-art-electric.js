/* ============================================================
   card-art-electric.js  -  Electric's cards (the Safari's duo
   pool, docs/duo-design.md section 5) and Baton Pass, in the
   smooth card art's style (48x48, dark outline; see card-art.js).
   ============================================================ */

import { INK, f, line, star, sparkle, radial, linear, fist, speed, gear } from './card-art-kit.js';

const volt = linear('v', [[0, '#fffbd0'], [0.45, '#ffe040'], [1, '#e8a000']], 0.4, 1);
const glow = radial('g', [[0, '#fff'], [0.4, '#fff7a8'], [1, '#ffcc20']]);

/** A lightning bolt, top at (x, y), `s` its scale, filled with the `v` gradient (`volt`). */
const bolt = (x, y, s = 1, rot = 0, fill = 'url(#$v)') => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M2 0H14L9 11H16L-1 32L4 15H-3Z" fill="${fill}" ${line(2.4 / s)}/>
    <path d="M4 2H10" stroke="#fff" stroke-width="${f(1.4 / s)}" stroke-linecap="round" opacity="0.85"/></g>`;
/** Little zigzag sparks: [x, y, len, angle]. */
const zaps = (list) => list.map(([x, y, len, a]) => {
  const r = (a * Math.PI) / 180, dx = Math.cos(r) * len / 3, dy = Math.sin(r) * len / 3, nx = -dy * 0.5, ny = dx * 0.5;
  const d = `M${f(x)} ${f(y)}L${f(x + dx + nx)} ${f(y + dy + ny)}L${f(x + 2 * dx - nx)} ${f(y + 2 * dy - ny)}L${f(x + 3 * dx)} ${f(y + 3 * dy)}`;
  return `<path d="${d}" fill="none" ${line(2.6)}/><path d="${d}" fill="none" stroke="#ffe040" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
}).join('');
/** A horseshoe magnet, its poles at the bottom. */
const magnet = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-12 14V2A12 12 0 0 1 12 2V14H5V2A5 5 0 0 0 -5 2V14Z" fill="#e8403a" ${line(2.4 / s)}/>
    <rect x="-12" y="14" width="7" height="6" fill="#e8ecf4" ${line(2 / s)}/><rect x="5" y="14" width="7" height="6" fill="#e8ecf4" ${line(2 / s)}/>
    <path d="M-9 0A9 9 0 0 1 2 -8.5" stroke="#ff9a8a" stroke-width="${f(1.6 / s)}" fill="none" stroke-linecap="round"/></g>`;
/** A battery cell lying flat, `level` 0-1 charged. */
const cell = (x, y, w, h, level) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#3a3a48" ${line(2.4)}/>
    <rect x="${x + w}" y="${f(y + h * 0.3)}" width="3.5" height="${f(h * 0.4)}" rx="1" fill="#c8ccd8" ${line(1.8)}/>
    <rect x="${x + 2.5}" y="${y + 2.5}" width="${f((w - 5) * level)}" height="${h - 5}" rx="1.5" fill="url(#$v)"/>`;
/** Two arrows chasing each other round a circle: a switch. */
const swap = (cx, cy, r, fill = '#5ac0ff') => `<path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}" fill="none" ${line(5)}/>
    <path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}" fill="none" stroke="${fill}" stroke-width="2.8" stroke-linecap="round"/>
    <polygon points="${cx + r * 0.7 - 4},${cy - r * 0.7 - 5} ${cx + r * 0.7 + 5},${cy - r * 0.7 - 1} ${cx + r * 0.7 - 2},${cy - r * 0.7 + 5}" fill="${fill}" ${line(1.6)}/>
    <path d="M${cx + r} ${cy}A${r} ${r} 0 0 1 ${cx - r * 0.7} ${cy + r * 0.7}" fill="none" ${line(5)}/>
    <path d="M${cx + r} ${cy}A${r} ${r} 0 0 1 ${cx - r * 0.7} ${cy + r * 0.7}" fill="none" stroke="${fill}" stroke-width="2.8" stroke-linecap="round"/>
    <polygon points="${cx - r * 0.7 + 4},${cy + r * 0.7 + 5} ${cx - r * 0.7 - 5},${cy + r * 0.7 + 1} ${cx - r * 0.7 + 2},${cy + r * 0.7 - 5}" fill="${fill}" ${line(1.6)}/>`;
const cloud = (x, y, s = 1, fill = '#6a6a88') => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-14 6A6 6 0 0 1 -10 -4A8 8 0 0 1 4 -8A7 7 0 0 1 14 0A6 6 0 0 1 12 8H-10A5 5 0 0 1 -14 6Z" fill="${fill}" ${line(2.4 / s)}/>
    <path d="M-8 -3A6 6 0 0 1 2 -6" stroke="#fff" stroke-width="${f(1.4 / s)}" fill="none" opacity="0.5" stroke-linecap="round"/></g>`;

export const ELECTRIC = {
  'thunder-shock': `<defs>${volt}${glow}</defs>
    <circle cx="24" cy="25" r="15" fill="url(#$g)" opacity="0.55"/>
    ${bolt(19, 7, 1.05)}
    ${zaps([[6, 14, 9, 20], [34, 36, 9, 10], [9, 36, 8, -30]])}`,

  'magnet-rise': `<defs>${volt}</defs>
    ${magnet(24, 14, 1.05)}
    <ellipse cx="24" cy="41" rx="13" ry="3" fill="${INK}" opacity="0.25"/>
    ${zaps([[10, 34, 7, 90], [38, 34, 7, 90]])}
    <path d="M17 31v4M24 32v5M31 31v4" stroke="#7ac8ff" stroke-width="2" stroke-linecap="round"/>`,

  spark: `<defs>${glow}${volt}</defs>
    <polygon points="${star(24, 24, 8, 18, 7)}" fill="url(#$g)" ${line(2.2)}/>
    <polygon points="${star(24, 24, 8, 9, 4, -68)}" fill="#fff" ${line(1.4)}/>
    ${zaps([[4, 8, 8, 40], [37, 6, 7, 120], [6, 40, 7, -40], [36, 42, 7, -140]])}`,

  'thunder-wave': `<defs>${volt}</defs>
    <path d="M4 24L10 16L16 32L22 16L28 32L34 16L40 32L44 24" fill="none" ${line(5.2)}/>
    <path d="M4 24L10 16L16 32L22 16L28 32L34 16L40 32L44 24" fill="none" stroke="#ffe040" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M6 10L10 6L14 12M34 40L38 36L42 42" fill="none" stroke="#ffe040" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
    ${sparkle(40, 9, 3)}`,

  nuzzle: `<defs>${radial('c', [[0, '#fff'], [0.5, '#ff9ab0'], [1, '#e8506a']])}${volt}</defs>
    <ellipse cx="17" cy="28" rx="11" ry="10" fill="#ffe060" ${line(2.4)}/>
    <ellipse cx="31" cy="26" rx="11" ry="10" fill="#7ad0ff" ${line(2.4)}/>
    <circle cx="20" cy="31" r="3.4" fill="url(#$c)" ${line(1.4)}/><circle cx="28" cy="29" r="3.4" fill="url(#$c)" ${line(1.4)}/>
    ${zaps([[18, 8, 9, 60], [28, 6, 9, 110]])}
    ${sparkle(24, 42, 2.4)}`,

  'eerie-impulse': `<defs>${volt}</defs>
    <circle cx="24" cy="24" r="18" fill="none" stroke="#c070f0" stroke-width="2" opacity="0.5"/>
    <circle cx="24" cy="24" r="12.5" fill="none" stroke="#c070f0" stroke-width="2.2" opacity="0.75"/>
    <path d="M14 30L24 8L34 30" fill="none" ${line(3)}/>
    <path d="M18 30H30" ${line(3)}/>
    <circle cx="24" cy="8" r="3.6" fill="#ffe040" ${line(1.8)}/>
    <path d="M10 38C16 34 32 34 38 38" fill="none" stroke="#9a5ae0" stroke-width="2.4" stroke-linecap="round"/>`,

  charge: `<defs>${volt}</defs>
    ${cell(7, 15, 30, 18, 0.8)}
    ${bolt(19, 13, 0.62)}
    ${zaps([[6, 8, 7, -60], [36, 8, 7, -120]])}
    <path d="M10 40H30" stroke="#a060c0" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`,

  'rising-voltage': `<defs>${volt}</defs>
    <rect x="7" y="31" width="7" height="10" fill="#ffd040" ${line(2)}/>
    <rect x="17" y="24" width="7" height="17" fill="#ffd040" ${line(2)}/>
    <rect x="27" y="16" width="7" height="25" fill="#ffd040" ${line(2)}/>
    <path d="M6 26L18 18L26 20L40 7" fill="none" ${line(4.6)}/>
    <path d="M6 26L18 18L26 20L40 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="34,6 42,5 41,13" fill="#fff" ${line(1.8)}/>`,

  'volt-switch': `<defs>${volt}</defs>
    ${swap(24, 25, 15, '#ffe040')}
    ${bolt(20, 14, 0.5)}`,

  'shock-wave': `<defs>${volt}</defs>
    <path d="M8 24A16 16 0 0 1 40 24" fill="none" stroke="#ffe040" stroke-width="2.4" opacity="0.6"/>
    <path d="M13 26A11 11 0 0 1 35 26" fill="none" stroke="#ffe040" stroke-width="2.6" opacity="0.85"/>
    <circle cx="24" cy="31" r="6" fill="#fff6b0" ${line(2.2)}/>
    ${zaps([[24, 25, 13, -90], [21, 27, 11, -140], [27, 27, 11, -40]])}
    ${sparkle(9, 38, 2.6)}${sparkle(40, 38, 2.6)}`,

  discharge: `<defs>${glow}${volt}</defs>
    <circle cx="24" cy="24" r="9" fill="url(#$g)" ${line(2.2)}/>
    ${zaps([[24, 15, 12, -90], [32, 20, 12, -25], [31, 30, 12, 30], [24, 33, 12, 90], [16, 30, 12, 150], [16, 19, 12, 205]])}`,

  'thunder-fang': `<defs>${volt}</defs>
    <path d="M7 12C14 6 34 6 41 12L36 18C30 15 18 15 12 18Z" fill="#f4f0e8" ${line(2.2)}/>
    <path d="M14 17L17 30L20 16M28 16L31 30L34 17" fill="#fff" ${line(2.2)}/>
    <path d="M7 36C14 42 34 42 41 36L36 31C30 33 18 33 12 31Z" fill="#f4f0e8" ${line(2.2)}/>
    ${zaps([[17, 26, 9, 100], [31, 26, 9, 80], [4, 24, 7, 0], [37, 24, 7, 0]])}`,

  'zing-zap': `<defs>${volt}</defs>
    <circle cx="24" cy="24" r="16" fill="#ffe8a0" ${line(2.2)}/>
    <path d="M24 8V40M8 24H40M13 13L35 35M35 13L13 35" stroke="#e8a000" stroke-width="1.8" opacity="0.6"/>
    ${bolt(20, 10, 0.75)}
    ${sparkle(41, 8, 3)}${sparkle(7, 41, 2.6)}`,

  'electric-terrain': `<defs>${linear('t', [[0, '#fff6b0'], [1, '#e8b000']])}${volt}</defs>
    <path d="M4 32L24 24L44 32L24 42Z" fill="url(#$t)" ${line(2.4)}/>
    <path d="M10 32L24 26.6L38 32L24 37.6Z" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.7"/>
    ${zaps([[12, 30, 12, -100], [24, 24, 14, -90], [36, 30, 12, -80]])}
    ${sparkle(24, 6, 2.8)}`,

  'lightning-rod': `<defs>${volt}${linear('m', [[0, '#e8ecf4'], [1, '#8a92a8']], 1, 0)}</defs>
    ${cloud(20, 10, 0.9)}
    <path d="M32 44V16" ${line(4.6)}/><path d="M32 44V16" stroke="url(#$m)" stroke-width="2.4"/>
    <polygon points="32,10 35,17 29,17" fill="#c8ccd8" ${line(1.8)}/>
    <path d="M24 42H40" ${line(3)}/>
    ${bolt(21, 13, 0.55, -20)}`,

  electrify: `<defs>${volt}</defs>
    <rect x="9" y="14" width="18" height="22" rx="4" fill="#f4f0e8" ${line(2.4)}/>
    <circle cx="15" cy="23" r="1.8" fill="${INK}"/><circle cx="21" cy="23" r="1.8" fill="${INK}"/>
    <path d="M14 29H22" ${line(2)}/>
    <path d="M27 25H34C38 25 38 19 42 19" fill="none" ${line(3)}/>
    ${bolt(30, 22, 0.55)}
    <text x="40" y="12" font-size="9" font-weight="900" fill="#ffe040" stroke="${INK}" stroke-width="1.4" paint-order="stroke" text-anchor="middle">×2</text>`,

  'magnet-pull': `<defs>${volt}</defs>
    ${magnet(15, 18, 0.85, 90)}
    <circle cx="36" cy="14" r="3.6" fill="#ffe040" ${line(1.8)}/><circle cx="38" cy="25" r="3.6" fill="#ffe040" ${line(1.8)}/><circle cx="35" cy="36" r="3.6" fill="#ffe040" ${line(1.8)}/>
    <path d="M30 15H26M31 25H27M29 36H25" stroke="#7ac8ff" stroke-width="2" stroke-linecap="round"/>`,

  thunder: `<defs>${volt}</defs>
    ${cloud(24, 12, 1.15, '#4a4a68')}
    ${bolt(20, 18, 0.85)}
    <path d="M9 24L7 30M38 24L36 30" stroke="#7ac8ff" stroke-width="2" stroke-linecap="round"/>`,

  'electric-surge': `<defs>${glow}${volt}</defs>
    <polygon points="${star(24, 24, 12, 20, 13)}" fill="#ffe040" ${line(2)}/>
    <circle cx="24" cy="24" r="10" fill="url(#$g)" ${line(2)}/>
    ${bolt(21, 15, 0.5)}`,

  'magnetic-flux': `<defs>${volt}</defs>
    <ellipse cx="24" cy="24" rx="19" ry="9" fill="none" stroke="#7ac8ff" stroke-width="2.4"/>
    <ellipse cx="24" cy="24" rx="12" ry="16" fill="none" stroke="#7ac8ff" stroke-width="2.4" opacity="0.8"/>
    <path d="M24 13L33 17V24C33 29 29 32 24 34C19 32 15 29 15 24V17Z" fill="#e8ecf4" ${line(2.2)}/>
    <path d="M24 17V30" stroke="#e8403a" stroke-width="3"/>`,

  wired: `<defs>${volt}</defs>
    <path d="M6 14C16 14 14 34 24 34S32 14 42 14" fill="none" ${line(5)}/>
    <path d="M6 14C16 14 14 34 24 34S32 14 42 14" fill="none" stroke="#e8a000" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="2" y="10" width="7" height="8" rx="1.5" fill="#c8ccd8" ${line(1.8)}/>
    <rect x="39" y="10" width="7" height="8" rx="1.5" fill="#c8ccd8" ${line(1.8)}/>
    <path d="M24 13L31 16V22C31 26 28 28 24 30C20 28 17 26 17 22V16Z" fill="#7ac8ff" ${line(2)} transform="translate(0 -7) scale(1)"/>
    ${sparkle(24, 40, 2.4)}`,

  'motor-drive': `<defs>${volt}</defs>
    <polygon points="${gear(22, 26, 13, 9)}" fill="#c8ccd8" ${line(2.2)}/>
    <circle cx="22" cy="26" r="5" fill="#ffe040" ${line(2)}/>
    ${bolt(33, 4, 0.5, 10)}
    ${speed(44, [36, 41], 8)}`,

  'electro-drift': `<defs>${volt}</defs>
    <path d="M10 30C10 24 14 20 22 20H32L38 26V32H10Z" fill="#ffd040" ${line(2.4)}/>
    <circle cx="16" cy="33" r="4" fill="#3a3a48" ${line(2)}/><circle cx="33" cy="33" r="4" fill="#3a3a48" ${line(2)}/>
    <path d="M22 21L26 26H34" fill="none" stroke="#7ac8ff" stroke-width="2.4" stroke-linecap="round"/>
    ${speed(9, [22, 27, 32], 7)}
    ${zaps([[36, 10, 8, 120]])}`,

  overdrive: `<defs>${volt}</defs>
    <path d="M18 8L36 26L30 32L12 14Z" fill="#d84a3a" ${line(2.2)}/>
    <path d="M30 32L36 26L42 34C42 40 36 42 32 40Z" fill="#e8b860" ${line(2.2)}/>
    <path d="M16 10L22 16M20 12L26 18" stroke="#fff" stroke-width="1.4" opacity="0.7"/>
    ${zaps([[6, 26, 9, 60], [6, 38, 9, 0]])}
    ${sparkle(41, 10, 3)}`,

  'zap-cannon': `<defs>${glow}${volt}</defs>
    <rect x="4" y="19" width="22" height="12" rx="3" fill="#8a92a8" ${line(2.4)}/>
    <rect x="9" y="30" width="6" height="9" rx="2" fill="#5a6278" ${line(2)}/>
    <circle cx="35" cy="25" r="9" fill="url(#$g)" ${line(2.2)}/>
    ${zaps([[35, 16, 7, -90], [44, 25, 5, 0], [35, 34, 7, 90]])}`,

  'static-field': `<defs>${volt}</defs>
    <circle cx="24" cy="24" r="18" fill="#fff8c8" ${line(2.2)}/>
    <circle cx="24" cy="24" r="18" fill="none" stroke="#ffe040" stroke-width="2" stroke-dasharray="3 4"/>
    <path d="M16 14L32 34M32 14L16 34" stroke="#e8a000" stroke-width="1.6" opacity="0.5"/>
    ${zaps([[13, 22, 8, 0], [27, 26, 8, 0], [20, 32, 8, -20], [22, 14, 8, 20]])}`,

  battery: `<defs>${volt}</defs>
    <g transform="rotate(-90 24 24)">${cell(8, 14, 30, 20, 1)}</g>
    <path d="M18 36H30M24 30V42" ${line(3)}/><path d="M18 36H30M24 30V42" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
    ${bolt(20, 13, 0.5)}`,

  'gigavolt-havoc': `<defs>${glow}${volt}</defs>
    <circle cx="24" cy="24" r="19" fill="url(#$g)" ${line(2.4)}/>
    ${bolt(14, 6, 1.1, 10)}
    <polygon points="${star(24, 24, 16, 23, 19)}" fill="none" stroke="#e8a000" stroke-width="1.6" opacity="0.8"/>`,

  'volt-tackle': `<defs>${volt}</defs>
    <ellipse cx="28" cy="27" rx="13" ry="10" fill="#ffe040" ${line(2.4)}/>
    <path d="M34 18L38 8L41 19Z" fill="#ffe040" ${line(2)}/><path d="M24 18L22 8L29 17Z" fill="#ffe040" ${line(2)}/>
    <circle cx="34" cy="25" r="1.8" fill="${INK}"/>
    <circle cx="36" cy="30" r="2.6" fill="#ff7a7a"/>
    ${speed(14, [20, 26, 32], 10)}
    ${zaps([[18, 38, 9, 160], [40, 38, 7, 60]])}`,

  plus: `<defs>${radial('r', [[0, '#fff'], [0.5, '#ff8a8a'], [1, '#d83a3a']])}${radial('b', [[0, '#fff'], [0.5, '#8ac8ff'], [1, '#2a78d8']])}</defs>
    <circle cx="16" cy="26" r="11" fill="url(#$r)" ${line(2.4)}/>
    <path d="M16 20V32M10 26H22" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="33" cy="20" r="8" fill="url(#$b)" ${line(2.2)}/>
    <path d="M29 20H37" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>
    ${sparkle(38, 38, 3)}`,

  'thunder-punch': `<defs>${volt}</defs>
    ${fist(22, 25, 1.1, 0, '#ffd040', '#e8a000')}
    ${zaps([[6, 10, 9, 45], [38, 8, 8, 120], [40, 36, 7, -30], [5, 38, 7, -60]])}`,

  'charge-beam': `<defs>${glow}${volt}</defs>
    <path d="M4 18L44 22V28L4 32Z" fill="#fff6a0" ${line(2.2)}/>
    <path d="M6 23L42 24.6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <circle cx="9" cy="25" r="7" fill="url(#$g)" ${line(2)}/>
    ${zaps([[16, 10, 8, 0], [26, 39, 8, 0]])}`,

  'wild-charge': `<defs>${volt}${glow}</defs>
    <ellipse cx="22" cy="26" rx="18" ry="14" fill="url(#$g)" opacity="0.6"/>
    <path d="M10 30C10 20 18 14 28 16C36 18 40 24 38 32H12Z" fill="#3a5ab8" ${line(2.4)}/>
    <path d="M28 16L33 9L34 18M20 17L19 10L25 16" fill="#3a5ab8" ${line(2)}/>
    <circle cx="32" cy="24" r="2" fill="#ffe040" ${line(1)}/>
    ${zaps([[6, 12, 9, 40], [42, 40, 7, -100], [4, 36, 7, -20]])}`,

  thunderbolt: `<defs>${volt}${glow}</defs>
    <circle cx="24" cy="38" r="7" fill="url(#$g)" opacity="0.8"/>
    ${bolt(18, 3, 1.2, 8)}
    ${sparkle(8, 12, 3)}${sparkle(40, 30, 2.6)}`,

  'fusion-bolt': `<defs>${volt}</defs>
    <path d="M6 30C10 18 20 12 32 12L42 6L40 18C40 30 30 38 18 38L8 42Z" fill="#3a4a7a" ${line(2.4)}/>
    <circle cx="33" cy="15" r="2" fill="#7ad8ff"/>
    ${bolt(16, 14, 0.7, 20)}`,

  'electro-shot': `<defs>${glow}${volt}</defs>
    <circle cx="13" cy="33" r="9" fill="url(#$g)" ${line(2.2)}/>
    <path d="M18 28L42 6" ${line(6)}/><path d="M18 28L42 6" stroke="#fff6a0" stroke-width="3.6" stroke-linecap="round"/>
    ${zaps([[28, 30, 8, -20], [24, 8, 8, 30]])}
    ${sparkle(42, 6, 3.2)}`,

  'supercell-slam': `<defs>${volt}</defs>
    ${cloud(24, 11, 1.2, '#3a3a58')}
    ${bolt(13, 17, 0.6, -10)}${bolt(27, 17, 0.6, 10)}
    <path d="M6 42H42" ${line(3)}/><path d="M12 42L16 36M24 42V35M36 42L32 36" stroke="#ffe040" stroke-width="2" stroke-linecap="round"/>`,

  'bolt-strike': `<defs>${volt}${glow}</defs>
    <circle cx="26" cy="22" r="17" fill="url(#$g)" opacity="0.5"/>
    <path d="M8 40L30 10L40 16L18 44Z" fill="#fff6a0" ${line(2.4)}/>
    ${bolt(24, 8, 0.75, 20)}
    ${speed(12, [14, 20], 8)}`,

  'baton-pass': `<defs>${volt}</defs>
    <rect x="9" y="20" width="30" height="8" rx="4" fill="#e8403a" ${line(2.4)} transform="rotate(-30 24 24)"/>
    <rect x="9" y="20" width="8" height="8" rx="2" fill="#f4f4f8" ${line(2)} transform="rotate(-30 24 24)"/>
    <rect x="31" y="20" width="8" height="8" rx="2" fill="#f4f4f8" ${line(2)} transform="rotate(-30 24 24)"/>
    ${swap(24, 24, 18, '#7ac8ff')}`,
};

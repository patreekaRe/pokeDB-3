/* ============================================================
   card-art-dark.js  -  Dark's cards (the Safari's duo pool,
   docs/duo-design.md section 5), in the smooth card art's style
   (48x48, dark outline; see card-art.js).
   ============================================================ */

import { INK, f, line, star, sparkle, linear, radial, tube, puffs, speed, spiral } from './card-art-kit.js';

const NIGHT = '#3e3450', SHADOW = '#2a2238', VOID = '#5a3c8c', GLOW = '#b088f0', MOON = '#f8e8a8', GOLD = '#ffd040', GOLD_DARK = '#c88a10',
  EYE = '#ff4a4a', SKIN = '#ffd0a8', FANG = '#fffaf0';
const nightG = radial('n', [[0, '#7a5cb8'], [0.6, '#3e3450'], [1, '#221a30']]);
const voidG = radial('v', [[0, '#1a1024'], [0.55, '#3a2458'], [1, '#8a5cc8']]);
const goldG = linear('g', [[0, '#fff4b0'], [0.5, '#ffd040'], [1, '#c88a10']], 1, 1);
const steelG = linear('s', [[0, '#f0f4fa'], [0.5, '#b8c4d4'], [1, '#78849a']], 1, 1);

/** A fang pointing down, its root's middle on (x, y), w wide and h long. */
const fang = (x, y, w, h, fill = FANG) => `<path d="M${f(x - w / 2)} ${y}Q${x} ${f(y + h * 0.2)} ${f(x + w / 2)} ${y}Q${f(x + w * 0.25)} ${f(y + h * 0.6)} ${x} ${f(y + h)}Q${f(x - w * 0.25)} ${f(y + h * 0.6)} ${f(x - w / 2)} ${y}Z" fill="${fill}" ${line(1.8)}/>`;
/** A biting mouth seen face-on: an upper jaw of fangs over a lower one, its middle on (x, y), scale s, open by gap. */
const jaws = (x, y, s = 1, gap = 6) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-16 ${-gap}Q0 ${-gap - 12} 16 ${-gap}" fill="#c84060" ${line(2.2 / s)}/>
    <path d="M-16 ${gap}Q0 ${gap + 12} 16 ${gap}" fill="#c84060" ${line(2.2 / s)}/>
    ${[-11, -4, 4, 11].map((dx, i) => fang(dx, -gap - 1 + Math.abs(dx) * 0.1, 6, i % 3 ? 8 : 10)).join('')}
    ${[-8, 0, 8].map((dx) => `<g transform="translate(0 ${gap + 1}) scale(1 -1)">${fang(dx, 0, 6, 8)}</g>`).join('')}
  </g>`;
/** Claw slashes: n parallel strokes from (x, y), len long, at angle degrees. */
const claws = (x, y, len, angle = 50, n = 3, gap = 6, fill = '#ffffff', shine = GLOW) => `<g transform="translate(${x} ${y}) rotate(${angle})">
    ${Array.from({ length: n }, (_, i) => tube(`M0 ${f((i - (n - 1) / 2) * gap)}Q${f(len / 2)} ${f((i - (n - 1) / 2) * gap - 3)} ${len} ${f((i - (n - 1) / 2) * gap)}`, 2.6, fill, shine)).join('')}
  </g>`;
/** A grabbing hand, palm down, reaching right, its wrist on (x, y), scale s (Snatch, Covet). */
const grab = (x, y, s = 1, rot = 0, fill = SKIN) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M0 -5C4 -8 10 -8 14 -6L22 -7C24 -7 24 -4 22 -4L15 -3L23 -2C25 -2 25 1 23 1L15 1L22 3C24 3.6 23.6 6 21.6 5.6L14 4.4L19 7C20.6 8 19.4 10 17.6 9.2L10 6C6 7 2 6 0 4Z" fill="${fill}" ${line(1.8 / s)}/>
    <path d="M-6 -5H0V4H-6Z" fill="${NIGHT}" ${line(1.8 / s)}/>
  </g>`;
/** A drawstring sack of coins, its middle on (x, y), scale s. */
const sack = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-4 -10C-10 -6 -14 2 -12 8C-10 13 10 13 12 8C14 2 10 -6 4 -10Z" fill="#c8a070" ${line(2 / s)}/>
    <path d="M-5 -10H5L3 -14H-3Z" fill="#a87c48" ${line(1.8 / s)}/>
    <path d="M-6 -9.4Q0 -7 6 -9.4" fill="none" ${line(1.6 / s)}/>
    <text x="0" y="6" text-anchor="middle" font-size="11" font-weight="700" fill="${GOLD}" stroke="${INK}" stroke-width="${f(0.8 / s)}" font-family="sans-serif">₽</text>
  </g>`;
/** A coin, face-on, its middle on (x, y), radius r. */
const coin = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$g)" ${line(1.8)}/><circle cx="${x}" cy="${y}" r="${f(r * 0.6)}" fill="none" stroke="${GOLD_DARK}" stroke-width="1.2"/>`;
/** A masquerade mask, its middle on (x, y), scale s, in fill. */
const mask = (x, y, s = 1, fill = VOID, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-18 -4C-14 -10 -6 -9 0 -5C6 -9 14 -10 18 -4C18 4 12 8 6 6C3 5 1 3 0 3C-1 3 -3 5 -6 6C-12 8 -18 4 -18 -4Z" fill="${fill}" ${line(2.2 / s)}/>
    <path d="M-13 -2C-10 -5 -6 -4 -4 -1C-6 1 -11 1 -13 -2ZM13 -2C10 -5 6 -4 4 -1C6 1 11 1 13 -2Z" fill="${SHADOW}" ${line(1.4 / s)}/>
    <path d="M-15 -5C-12 -8 -8 -8 -5 -6" fill="none" stroke="#fff" stroke-width="${f(1.2 / s)}" stroke-linecap="round" opacity="0.6"/>
  </g>`;
/** A glaring pair of eyes in the dark, their middle on (x, y), w apart. */
const glare = (x, y, w = 12, fill = EYE) => [[x - w / 2, 1], [x + w / 2, -1]].map(([cx, tilt]) => `<path d="M${f(cx - 5)} ${f(y - tilt)}Q${cx} ${f(y - 4)} ${f(cx + 5)} ${f(y + tilt)}Q${cx} ${f(y + 3)} ${f(cx - 5)} ${f(y - tilt)}Z" fill="${fill}" ${line(1.6)}/><circle cx="${cx}" cy="${f(y - 0.2)}" r="1.3" fill="${SHADOW}"/>`).join('');
/** A crescent moon, its middle on (x, y), radius r. */
const crescent = (x, y, r) => `<path d="M${f(x + r * 0.2)} ${f(y - r)}A${r} ${r} 0 1 0 ${f(x + r * 0.2)} ${f(y + r)}A${f(r * 0.78)} ${f(r * 0.78)} 0 1 1 ${f(x + r * 0.2)} ${f(y - r)}Z" fill="${MOON}" ${line(1.8)}/>`;
/** Shadowy smoke, as puffs. */
const smoke = (list, fill = '#5a4c70', lit = '#7a6c90') => puffs(list, fill, lit, 1.3);
/** A playing card, its middle on (x, y), tilted rot, with a mark in its centre. */
const card = (x, y, rot = 0, mark = '♠', fill = '#fffaf0', ink = SHADOW) => `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="-8" y="-11" width="16" height="22" rx="2.4" fill="${fill}" ${line(1.8)}/>
    <text x="0" y="4.5" text-anchor="middle" font-size="12" fill="${ink}" font-family="sans-serif">${mark}</text>
  </g>`;
/** A strength arrow pointing up (gained) or down (lost), its tip at (x, y). */
const arrow = (x, y, up = true, fill = '#ff7a3a') => (up
  ? `<path d="M${x} ${y}L${x + 5} ${y + 6}H${x + 2}V${y + 12}H${x - 2}V${y + 6}H${x - 5}Z" fill="${fill}" ${line(1.6)}/>`
  : `<path d="M${x} ${y}L${x - 5} ${y - 6}H${x - 2}V${y - 12}H${x + 2}V${y - 6}H${x + 5}Z" fill="${fill}" ${line(1.6)}/>`);
/** A kite shield (block), its middle on (cx, cy), radius r. */
const guard = (cx, cy, r, fill = '#8a7ab0', rim = '#ffffff') => `<path d="M${cx} ${f(cy - r * 1.15)}L${f(cx + r)} ${f(cy - r * 0.7)}V${f(cy + r * 0.1)}Q${f(cx + r)} ${f(cy + r * 0.9)} ${cx} ${f(cy + r * 1.3)}Q${f(cx - r)} ${f(cy + r * 0.9)} ${f(cx - r)} ${f(cy + r * 0.1)}V${f(cy - r * 0.7)}Z" fill="${fill}" ${line(2.4)}/>
    <path d="M${f(cx - r * 0.55)} ${f(cy - r * 0.45)}V${f(cy + r * 0.1)}Q${f(cx - r * 0.5)} ${f(cy + r * 0.6)} ${f(cx - r * 0.1)} ${f(cy + r * 0.85)}" fill="none" stroke="${rim}" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`;
/** A fist, knuckles right, its middle on (x, y), scale s. */
const punch = (x, y, s = 1, rot = 0, fill = '#6a5a8c') => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-10 -7H4C8 -7 10 -5 10 -2V3C10 6 8 8 4 8H-10Z" fill="${fill}" ${line(2 / s)}/>
    <path d="M2 -7V-1M6 -6V-1M-2 -7V-1M2 8V3" fill="none" ${line(1.4 / s)}/>
  </g>`;
/** A burst behind a hit, its middle on (x, y). */
const burst = (x, y, out, inn, n = 8, fill = '#fff2a0') => `<polygon points="${star(x, y, n, out, inn)}" fill="${fill}" ${line(2)}/>`;
/** Deino's head, its middle on (x, y), scale s: blue face under a shock of black fur. */
const deino = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="3" rx="11" ry="9" fill="#6a8ad0" ${line(2 / s)}/>
    <path d="M-12 0C-14 -10 -6 -16 0 -14C6 -16 14 -10 12 0C8 -4 4 -6 0 -5C-4 -6 -8 -4 -12 0Z" fill="${SHADOW}" ${line(2 / s)}/>
    <path d="M-6 7Q0 11 6 7" fill="none" ${line(1.6 / s)}/>
    ${fang(-3, 7.6, 2.6, 3)}${fang(3, 7.6, 2.6, 3)}
  </g>`;

export const DARK = {
  bite: `${jaws(24, 24, 1.1, 5)}
    ${speed(10, [14, 24, 34], 7)}`,

  obstruct: `${guard(24, 22, 14)}
    <path d="M14 22H34" ${line(3)}/><path d="M14 22H34" stroke="${EYE}" stroke-width="1.6" stroke-linecap="round"/>
    ${grab(6, 36, 0.7, -10)}`,

  snatch: `<defs>${goldG}</defs>
    ${coin(36, 28, 7)}
    ${grab(6, 26, 1.15)}
    ${speed(8, [16, 36], 6)}${sparkle(40, 14, 3)}`,

  'feint-attack': `${smoke([[14, 30, 7], [22, 34, 6], [10, 22, 5]])}
    ${claws(18, 18, 22, 35, 3, 5)}
    ${mask(32, 16, 0.6)}`,

  'lash-out': `${burst(24, 26, 18, 9, 10, '#ff8a5a')}
    ${punch(24, 26, 1)}
    <path d="M10 8l4 4M38 8l-4 4M24 4v5" ${line(2.2)}/>`,

  covet: `<defs>${goldG}</defs>
    ${coin(24, 16, 8)}
    ${grab(8, 36, 0.9, -30)}${grab(40, 36, 0.9, 210)}
    ${sparkle(10, 10, 2.6)}${sparkle(38, 8, 2.2)}`,

  'brutal-swing': `${tube('M8 34C10 16 30 8 42 18', 4.4, '#d8c8ff', GLOW)}
    ${punch(38, 22, 0.9, 40)}
    ${speed(14, [38, 42], 6)}`,

  'throat-chop': `<path d="M8 40L30 10" ${line(7)}/><path d="M8 40L30 10" stroke="${SKIN}" stroke-width="4.2" stroke-linecap="round"/>
    ${burst(34, 12, 9, 4.5, 8)}
    <path d="M36 30h8M38 36h6" ${line(2.2)}/>`,

  disguise: `${guard(24, 24, 15, '#6a5a8c')}
    ${mask(24, 20, 0.62, '#d8c8ff')}`,

  'sleight-of-hand': `${card(18, 24, -18, '♠')}${card(30, 24, 14, '♥', '#fffaf0', '#c83040')}
    ${sparkle(24, 8, 3)}${sparkle(40, 38, 2.4)}`,

  taunt: `${deino(24, 28, 1.1)}
    <path d="M38 8C42 8 44 12 41 15L38 17" fill="none" ${line(2.4)}/><circle cx="38" cy="21" r="1.6" fill="${INK}"/>
    <path d="M6 12C8 8 12 8 14 12" fill="none" ${line(2.2)}/>`,

  reprisal: `${guard(20, 24, 13)}
    ${tube('M34 12C44 16 44 30 34 34', 3, '#ffffff', GLOW)}
    <path d="M30 31L34 34L31 38" fill="none" ${line(2.4)}/>`,

  comeuppance: `<path d="M24 6V40M12 40H36" ${line(2.6)}/>
    <path d="M10 16H38" ${line(2.6)}/>
    <path d="M10 16L5 28H15Z" fill="#d8c8ff" ${line(2)}/><path d="M38 16L33 24H43Z" fill="${EYE}" ${line(2)}/>
    <circle cx="24" cy="6" r="3" fill="${GOLD}" ${line(1.8)}/>`,

  unnerve: `${smoke([[24, 30, 12], [14, 34, 7], [34, 34, 7]], '#3e3450', '#5a4c70')}
    ${glare(24, 28, 14)}
    <path d="M8 10l3 3M40 10l-3 3M24 6v4" ${line(2)}/>`,

  ransack: `${sack(22, 28, 1.2)}
    ${grab(38, 14, 0.7, 150)}
    ${sparkle(8, 12, 2.6)}`,

  pickpocket: `<defs>${goldG}</defs>
    <path d="M10 18C10 10 38 10 38 18V36C38 42 10 42 10 36Z" fill="#8a6a4a" ${line(2.2)}/>
    <path d="M10 18H38" ${line(2)}/>
    ${grab(14, 24, 0.75, 0)}
    ${coin(34, 8, 5)}`,

  'jaw-lock': `${jaws(24, 22, 1, 2)}
    <path d="M6 38H42" ${line(4)}/><path d="M6 38H42" stroke="#b8c4d4" stroke-width="2" stroke-linecap="round"/>
    ${[12, 20, 28, 36].map(x => `<circle cx="${x}" cy="38" r="2.4" fill="#d0d8e4" ${line(1.4)}/>`).join('')}`,

  imposter: `${smoke([[24, 26, 13]], '#8a7ab0', '#b0a0d8')}
    <circle cx="18" cy="22" r="2.4" fill="${INK}"/><circle cx="30" cy="22" r="2.4" fill="${INK}"/>
    <path d="M18 30Q24 34 30 30" fill="none" ${line(2)}/>
    ${mask(24, 10, 0.5, VOID, -8)}`,

  masquerade: `${mask(24, 22, 1.05)}
    <path d="M42 18C46 10 44 4 40 2" fill="none" ${line(2)}/><path d="M42 18C46 10 44 4 40 2" fill="none" stroke="${GOLD}" stroke-width="1" stroke-linecap="round"/>
    ${sparkle(8, 36, 3)}${sparkle(40, 38, 2.4)}`,

  'wicked-blow': `<defs>${nightG}</defs>
    <circle cx="28" cy="24" r="16" fill="url(#$n)" ${line(2)}/>
    ${burst(32, 22, 11, 5, 8, '#d8a0ff')}
    ${punch(18, 24, 1.15)}`,

  doppelganger: `${deino(16, 26, 0.9)}
    <g opacity="0.55">${deino(32, 26, 0.9)}</g>
    <path d="M24 8V44" stroke="${GLOW}" stroke-width="1.6" stroke-dasharray="3 3"/>`,

  mug: `<defs>${goldG}</defs>
    ${sack(32, 28, 0.95)}
    ${punch(12, 18, 0.9, 20)}
    ${burst(22, 24, 6, 3, 6)}${coin(40, 10, 4)}`,

  switcheroo: `${tube('M10 16C18 8 30 8 38 16', 3, '#ffffff', GLOW)}<path d="M34 12L38 16L33 19" fill="none" ${line(2.2)}/>
    ${tube('M38 32C30 40 18 40 10 32', 3, '#ffffff', GLOW)}<path d="M14 36L10 32L15 29" fill="none" ${line(2.2)}/>
    ${mask(24, 24, 0.42)}`,

  'false-surrender': `<path d="M14 42V8" ${line(2.8)}/>
    <path d="M14 8C22 4 28 12 38 8V24C28 28 22 20 14 24Z" fill="#ffffff" ${line(2)}/>
    ${claws(26, 34, 16, -10, 2, 5)}`,

  mirage: `<defs>${nightG}</defs>
    <rect x="4" y="4" width="40" height="40" rx="6" fill="url(#$n)" ${line(2)}/>
    ${crescent(34, 14, 6)}
    ${[30, 36, 42].map((y, i) => `<path d="M6 ${y}Q14 ${y - 3} 22 ${y}T38 ${y}" fill="none" stroke="#d8c8ff" stroke-width="1.6" stroke-linecap="round" opacity="${0.9 - i * 0.25}"/>`).join('')}
    ${mask(18, 20, 0.5, '#d8c8ff')}`,

  'darkest-lariat': `<defs>${nightG}</defs>
    <circle cx="24" cy="24" r="18" fill="url(#$n)" ${line(2)}/>
    <path d="${spiral(24, 24, 2.2, 15)}" fill="none" stroke="#d8c8ff" stroke-width="2" stroke-linecap="round"/>
    ${punch(8, 18, 0.7, -30)}${punch(40, 32, 0.7, 150)}`,

  plunder: `<defs>${goldG}</defs>
    <path d="M6 30H42L36 42H12Z" fill="#8a5a38" ${line(2.2)}/>
    <path d="M8 30C8 18 40 18 40 30" fill="#a87048" ${line(2.2)}/>
    ${coin(16, 24, 5)}${coin(26, 20, 5)}${coin(34, 25, 5)}
    <path d="M24 30V36" ${line(2.4)}/><rect x="21" y="32" width="6" height="5" rx="1" fill="${GOLD}" ${line(1.4)}/>
    ${sparkle(40, 10, 3)}`,

  ruination: `<defs>${voidG}</defs>
    <circle cx="24" cy="24" r="19" fill="url(#$v)" ${line(2)}/>
    ${[0, 60, 120, 180, 240, 300].map(a => `<path d="M24 24L${f(24 + 19 * Math.cos(a * Math.PI / 180))} ${f(24 + 19 * Math.sin(a * Math.PI / 180))}" stroke="${EYE}" stroke-width="1.4" opacity="0.7"/>`).join('')}
    ${glare(24, 24, 12, MOON)}`,

  prankster: `${card(14, 26, -24, '★', '#fffaf0', '#c88a10')}${card(24, 22, 0, '?', '#fffaf0', VOID)}${card(34, 26, 24, '♣')}
    ${sparkle(24, 6, 3)}`,

  'hyperspace-fury': `<defs>${voidG}</defs>
    <ellipse cx="24" cy="24" rx="20" ry="14" fill="url(#$v)" ${line(2)}/>
    ${[[10, 12], [36, 10], [8, 34], [38, 36]].map(([x, y]) => punch(x, y, 0.5, Math.atan2(24 - y, 24 - x) * 180 / Math.PI)).join('')}
    ${sparkle(24, 24, 4, MOON)}`,

  heist: `<defs>${goldG}</defs>
    ${mask(24, 14, 0.7, SHADOW)}
    ${sack(24, 34, 0.85)}
    ${sparkle(40, 30, 2.6)}`,

  vengeance: `${smoke([[24, 30, 13], [12, 34, 7], [36, 34, 7]], '#4a2030', '#6a3040')}
    ${glare(24, 26, 16)}
    <path d="M14 18L22 22M34 18L26 22" ${line(2.4)}/>`,

  'smoke-bomb': `${smoke([[24, 28, 12], [12, 32, 8], [36, 32, 8], [18, 18, 7], [32, 18, 6]], '#7a7090', '#9a90b0')}
    <circle cx="24" cy="38" r="5" fill="${SHADOW}" ${line(1.8)}/><path d="M26 33Q28 29 31 29" fill="none" ${line(1.6)}/>`,

  'kowtow-cleave': `<defs>${steelG}</defs>
    <path d="M10 38L34 8L38 12L14 42Z" fill="url(#$s)" ${line(2)}/>
    <path d="M8 34L18 44" ${line(3)}/><path d="M8 34L18 44" stroke="${GOLD}" stroke-width="1.4" stroke-linecap="round"/>
    ${claws(32, 30, 12, 20, 2, 4)}`,

  'grand-larceny': `<defs>${goldG}</defs>
    <path d="M24 6L36 18L24 42L12 18Z" fill="#8ad8ff" ${line(2.2)}/>
    <path d="M12 18H36M24 6L20 18L24 42L28 18Z" fill="none" ${line(1.4)}/>
    ${grab(2, 32, 0.7, -20)}${grab(46, 32, 0.7, 200)}
    ${sparkle(38, 8, 3)}`,

  'black-hole-eclipse': `<defs>${voidG}</defs>
    <circle cx="24" cy="24" r="20" fill="${MOON}" ${line(2)}/>
    <circle cx="26" cy="24" r="17" fill="url(#$v)" ${line(2)}/>
    ${glare(26, 24, 12)}`,

  'dark-void': `<defs>${voidG}</defs>
    <ellipse cx="24" cy="26" rx="20" ry="16" fill="url(#$v)" ${line(2)}/>
    <path d="${spiral(24, 26, 2, 13)}" fill="none" stroke="#d8c8ff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
    ${mask(24, 12, 0.45, '#d8c8ff')}`,

  'wicked-torque': `<defs>${nightG}</defs>
    <circle cx="24" cy="24" r="16" fill="url(#$n)" ${line(2)}/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="21" y="2" width="6" height="7" rx="1" fill="#6a5a8c" ${line(1.6)} transform="rotate(${a} 24 24)"/>`).join('')}
    <circle cx="24" cy="24" r="6" fill="${SHADOW}" ${line(1.8)}/>
    ${glare(24, 24, 7, EYE)}`,

  // session 14's 36: the defensive half
  pilfer: `<defs>${goldG}</defs>
    ${guard(18, 24, 13)}
    ${coin(38, 14, 5)}
    ${grab(24, 30, 0.8, -30)}`,

  hoard: `<defs>${goldG}</defs>
    ${sack(18, 30, 1.15)}
    ${coin(34, 38, 5)}${coin(38, 30, 5)}${coin(34, 22, 5)}
    ${arrow(38, 4, true)}`,

  shakedown: `<defs>${goldG}</defs>
    ${guard(24, 18, 12)}
    <path d="M8 10l-3 3M8 18l-4 1M40 10l3 3M40 18l4 1" ${line(2)}/>
    ${coin(14, 40, 4)}${coin(24, 42, 4)}${coin(34, 40, 4)}`,

  'brace-for-it': `${guard(18, 24, 15)}
    ${claws(36, 10, 12, 120, 3, 4, '#ffffff', EYE)}
    <path d="M30 26l6 2M30 32l6 0" ${line(2)}/>`,

  lurk: `${smoke([[24, 28, 14], [10, 34, 8], [38, 34, 8]], '#2a2238', '#3e3450')}
    ${glare(24, 24, 14)}
    ${guard(38, 38, 6)}`,

  cower: `${guard(30, 26, 14, '#6a5a8c')}
    ${deino(14, 32, 0.75)}
    ${[[8, 12], [14, 8]].map(([x, y]) => `<path d="M${x} ${y}q2 3 0 4q-2 -1 0 -4Z" fill="#a8d8ff" ${line(1.2)}/>`).join('')}`,

  veil: `${guard(24, 26, 13, '#6a5a8c')}
    <path d="M6 10Q24 0 42 10L40 40Q32 30 24 34Q16 30 8 40Z" fill="#d8c8ff" opacity="0.55" ${line(1.8)}/>`,

  decoy: `<path d="M24 6C18 6 16 12 18 16C12 20 12 36 16 40H32C36 36 36 20 30 16C32 12 30 6 24 6Z" fill="#c84060" ${line(2.2)}/>
    <circle cx="24" cy="12" r="4.4" fill="${SKIN}" ${line(1.6)}/>
    ${mask(24, 26, 0.48, '#ffffff')}
    ${sparkle(40, 10, 2.6)}`,

  'night-shroud': `<defs>${nightG}</defs>
    <path d="M24 4C12 10 8 24 10 42H38C40 24 36 10 24 4Z" fill="url(#$n)" ${line(2.2)}/>
    ${crescent(24, 22, 6)}
    ${sparkle(14, 34, 2.2)}${sparkle(34, 32, 2)}`,

  snarl: `${jaws(24, 30, 0.9, 3)}
    ${glare(24, 12, 16)}
    <path d="M14 6l4 3M34 6l-4 3" ${line(2.2)}/>`,

  'sticky-hold': `<defs>${goldG}</defs>
    ${coin(24, 30, 9)}
    <path d="M10 8H38V14C38 18 34 16 32 20C30 24 28 18 26 22C24 26 22 18 20 22C18 25 14 16 10 18Z" fill="#ffb830" ${line(2)}/>
    <path d="M14 12H34" stroke="#fff4b0" stroke-width="1.6" stroke-linecap="round"/>`,

  siphon: `${guard(14, 26, 10)}
    ${tube('M40 8C40 20 30 28 22 26', 3.4, '#c84060', '#ff8aa0')}
    ${[[34, 20], [28, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#ff8aa0" ${line(1.2)}/>`).join('')}
    ${arrow(40, 40, false, EYE)}`,

  'knock-away': `<defs>${goldG}</defs>
    ${guard(16, 26, 12)}
    ${punch(30, 30, 0.9, -20)}
    ${coin(40, 12, 5)}${speed(36, [10, 16], 6)}`,

  extort: `<path d="M10 6H32L38 12V42H10Z" fill="#fffaf0" ${line(2)}/>
    <path d="M15 14H28M15 20H32M15 26H26" stroke="#9a8aa8" stroke-width="1.6" stroke-linecap="round"/>
    <text x="30" y="38" text-anchor="middle" font-size="12" font-weight="700" fill="${EYE}" stroke="${INK}" stroke-width="0.8" font-family="sans-serif">₽</text>
    ${grab(2, 34, 0.6, -20)}`,

  vendetta: `${tube('M10 38L34 14', 3.4, '#e8ecf4', '#ffffff')}
    <path d="M30 10L38 18M36 8L40 12" ${line(2.6)}/>
    ${glare(30, 36, 10)}`,

  'night-watch': `<defs>${nightG}</defs>
    <rect x="4" y="4" width="40" height="40" rx="6" fill="url(#$n)" ${line(2)}/>
    <path d="M14 32L40 16V40Z" fill="${MOON}" opacity="0.6"/>
    <rect x="6" y="28" width="12" height="7" rx="2" fill="#6a5a8c" ${line(1.8)} transform="rotate(-30 12 31)"/>
    ${glare(34, 30, 8)}`,

  turnabout: `${guard(18, 26, 12)}
    ${tube('M36 8C46 20 40 38 26 38', 3, '#ffffff', EYE)}
    <path d="M30 34L26 38L31 41" fill="none" ${line(2.2)}/>`,

  'spite-guard': `${guard(24, 24, 15, '#5a4a7c')}
    ${[[9, 14, -1], [39, 14, 1], [10, 30, -1], [38, 30, 1]].map(([x, y, d]) => `<path d="M${x} ${y - 3}L${x + d * 6} ${y}L${x} ${y + 3}Z" fill="#e8ecf4" ${line(1.4)}/>`).join('')}
    ${glare(24, 20, 10)}`,

  goad: `${deino(16, 30, 0.9)}
    <path d="M30 18H40C42 18 42 21 40 21H32" fill="${SKIN}" ${line(1.8)}/>
    <path d="M30 18C26 18 26 28 30 28H36C38 28 38 24 36 24" fill="${SKIN}" ${line(1.8)}/>
    <text x="38" y="12" text-anchor="middle" font-size="10" font-weight="700" fill="${EYE}" stroke="${INK}" stroke-width="0.7" font-family="sans-serif">!</text>`,

  'costume-change': `<path d="M24 6V10M8 20L24 10L40 20H8Z" fill="none" ${line(2.2)}/>
    <path d="M10 20H38L36 42H12Z" fill="${VOID}" ${line(2.2)}/>
    ${mask(24, 28, 0.5, '#d8c8ff')}
    ${sparkle(42, 34, 2.4)}`,

  'hall-of-mirrors': `${[[10, -8], [24, 0], [38, 8]].map(([x, r]) => `<g transform="rotate(${r} ${x} 24)"><rect x="${x - 7}" y="10" width="14" height="28" rx="6" fill="#d8e8ff" ${line(2)}/>${mask(x, 22, 0.32, VOID)}</g>`).join('')}`,

  'shadow-cloak': `<path d="M24 6C16 6 14 12 14 16L6 42H42L34 16C34 12 32 6 24 6Z" fill="${SHADOW}" ${line(2.2)}/>
    <path d="M14 16C18 20 30 20 34 16" fill="none" stroke="#c84060" stroke-width="2" stroke-linecap="round"/>
    ${glare(24, 13, 7, GLOW)}`,

  reflection: `<ellipse cx="24" cy="22" rx="14" ry="18" fill="#d8e8ff" ${line(2.2)}/>
    <path d="M24 4A14 18 0 0 1 24 40Z" fill="${NIGHT}"/>
    <ellipse cx="24" cy="22" rx="14" ry="18" fill="none" ${line(2.2)}/>
    ${crescent(18, 20, 5)}
    <path d="M20 40V45H28V40" fill="#8a7ab0" ${line(1.8)}/>`,

  'veiled-strike': `${smoke([[14, 30, 9], [8, 22, 6], [20, 38, 6]])}
    ${claws(18, 22, 24, 20, 3, 5, '#ffffff', GLOW)}
    ${mask(14, 14, 0.42)}`,

  ambush: `<path d="M24 4V44M4 24H44M10 10L38 38M38 10L10 38" stroke="#d8c8ff" stroke-width="1.2"/>
    ${[8, 14, 20].map(r => `<circle cx="24" cy="24" r="${r}" fill="none" stroke="#d8c8ff" stroke-width="1.2"/>`).join('')}
    ${glare(24, 24, 10)}`,

  'vanishing-act': `<defs>${goldG}</defs>
    ${smoke([[16, 36, 8], [28, 38, 7], [38, 34, 6]], '#8a7ab0', '#b0a0d8')}
    <path d="M14 26H34M18 26V10H30V26" fill="${SHADOW}" ${line(2.2)}/>
    <path d="M18 22H30" stroke="#c84060" stroke-width="2.4"/>
    ${coin(40, 12, 4)}${sparkle(8, 12, 2.6)}`,

  'play-dead': `${deino(24, 26, 1.15)}
    <path d="M17 24l3 3M20 24l-3 3M28 24l3 3M31 24l-3 3" ${line(1.6)}/>
    ${mask(38, 10, 0.4)}
    <path d="M6 40H42" ${line(2)}/>`,

  'lick-wounds': `<path d="M14 18C14 32 20 40 24 40C28 40 34 32 34 18Z" fill="#ff8aa0" ${line(2.2)}/>
    <path d="M24 22V36" stroke="#c84060" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M36 6V14M32 10H40" stroke="#5ae07a" stroke-width="3" stroke-linecap="round"/><path d="M36 6V14M32 10H40" fill="none" ${line(1)}/>
    ${sparkle(10, 10, 2.4)}`,

  magician: `<defs>${goldG}</defs>
    <path d="M10 40L32 14" ${line(5)}/><path d="M10 40L32 14" stroke="${SHADOW}" stroke-width="3" stroke-linecap="round"/>
    <path d="M28 18.6L32 14" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    ${coin(38, 30, 5)}${sparkle(36, 8, 3.4)}${sparkle(42, 18, 2.2)}${sparkle(24, 10, 2)}`,

  'ill-gotten-gains': `<defs>${goldG}</defs>
    ${guard(30, 22, 13, '#6a5a8c')}
    ${coin(10, 40, 5)}${coin(10, 33, 5)}${coin(10, 26, 5)}${coin(18, 40, 5)}
    ${arrow(30, 12, true)}`,

  retribution: `${tube('M8 40L36 10', 3, '#e8ecf4', '#ffffff')}${tube('M40 40L12 10', 3, '#e8ecf4', '#ffffff')}
    <path d="M10 34l6 6M38 34l-6 6" ${line(2.6)}/>
    ${guard(24, 26, 8, EYE)}`,

  pressure: `<defs>${voidG}</defs>
    <circle cx="24" cy="24" r="18" fill="url(#$v)" ${line(2)}/>
    ${glare(24, 20, 14)}
    ${arrow(14, 42, false, GLOW)}${arrow(34, 42, false, GLOW)}`,

  'shadow-fortress': `<defs>${nightG}</defs>
    ${crescent(36, 10, 5)}
    <path d="M6 42V22H12V18H16V22H20V14H28V22H32V18H36V22H42V42Z" fill="url(#$n)" ${line(2.2)}/>
    <path d="M20 42V34C20 30 28 30 28 34V42" fill="${SHADOW}" ${line(1.8)}/>
    ${mask(24, 24, 0.36, '#d8c8ff')}`,

  'phantom-mask': `${mask(24, 24, 1.15, '#f4f0ff')}
    ${glare(24, 22, 15, GLOW)}
    ${smoke([[8, 40, 5], [40, 40, 5]], '#5a4c70', '#7a6c90')}`,

  'parting-shot': `${deino(34, 28, 0.85)}
    ${smoke([[10, 30, 7], [16, 22, 5], [8, 40, 5]])}
    ${speed(20, [26, 32, 38], 8)}
    ${arrow(10, 14, false, EYE)}`,

  'smoke-and-mirrors': `${smoke([[12, 32, 9], [24, 38, 8], [36, 34, 8]], '#8a7ab0', '#b0a0d8')}
    <rect x="17" y="6" width="14" height="22" rx="6" fill="#d8e8ff" ${line(2)}/>
    ${mask(24, 16, 0.34, VOID)}
    ${sparkle(8, 12, 2.4)}${sparkle(40, 14, 2.4)}`,
};

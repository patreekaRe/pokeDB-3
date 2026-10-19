/* ============================================================
   card-art-fighting.js  -  Fighting's cards (the Safari's duo pool,
   docs/duo-design.md section 5) and its Sore status card, in the
   smooth card art's style (48x48, dark outline; see card-art.js).
   ============================================================ */

import { INK, f, line, star, sparkle, linear, fist, boot, speed, tube, spiral, hot, blaze, puffs } from './card-art-kit.js';

const GLOVE = '#e8402a', GLOVE_DARK = '#a02818', SKIN = '#ffb27a', SKIN_DARK = '#d8784a';
const steel = linear('m', [[0, '#ffffff'], [0.45, '#c8d0e0'], [1, '#6a7894']], 0.4, 1);
const wood = linear('w', [[0, '#f0b878'], [0.5, '#c07838'], [1, '#7a4418']], 0, 1);

/** A comic-book impact burst on (cx, cy), r its outer radius. */
const pow = (cx, cy, r, fill = '#ffd84a', n = 10) => `<polygon points="${star(cx, cy, n, r, r * 0.58)}" fill="${fill}" ${line(2)}/>
    <polygon points="${star(cx, cy, n, r * 0.6, r * 0.36)}" fill="#fff8d8"/>`;
/** A boxing glove: the kit's fist in red. */
const glove = (x, y, s = 1, rot = 0) => fist(x, y, s, rot, GLOVE, GLOVE_DARK);
/** An open hand, fingers up, its palm's middle on (x, y); `rot` tilts it. */
const palm = (x, y, s = 1, rot = 0, fill = SKIN) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M-9 -2V-14Q-9 -17 -6.5 -17Q-4 -17 -4 -14V-6V-17Q-4 -20 -1.5 -20Q1 -20 1 -17V-6V-16Q1 -19 3.5 -19Q6 -19 6 -16V-4L9 -9Q11 -12 13 -10Q14.5 -8.5 13 -6L8 4Q5 10 -1 10Q-9 10 -9 -2Z" fill="${fill}" ${line(2.2 / s)}/>
    <path d="M-6 -13V-6M-1.5 -16V-7M3.5 -15V-6" stroke="${SKIN_DARK}" stroke-width="${f(1.1 / s)}" stroke-linecap="round" opacity="0.7"/>
  </g>`;
/** A hand held flat for a chop, its edge facing down-right, its wrist on (x, y). */
const blade = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M0 -5H18Q24 -5 24 0Q24 5 18 5H0Z" fill="${SKIN}" ${line(2.2 / s)}/>
    <path d="M4 -5Q6 -9 9 -6" fill="${SKIN}" ${line(1.8 / s)}/>
    <path d="M5 -1H20M5 2H18" stroke="${SKIN_DARK}" stroke-width="${f(1 / s)}" stroke-linecap="round" opacity="0.7"/>
    <rect x="-6" y="-6" width="7" height="12" rx="2" fill="#ffffff" ${line(2 / s)}/>
  </g>`;
/** A thick arrow along a path, its head at (hx, hy) pointing `ang` degrees. */
const arrow = (d, hx, hy, ang, colour = '#ffd84a', w = 4) => {
  const t = (ang * Math.PI) / 180, ux = Math.cos(t), uy = Math.sin(t);
  const head = `${f(hx + ux * 6.5)},${f(hy + uy * 6.5)} ${f(hx - uy * 5.6)},${f(hy + ux * 5.6)} ${f(hx + uy * 5.6)},${f(hy - ux * 5.6)}`;
  return tube(d, w, colour, '#fff') + `<polygon points="${head}" fill="${colour}" ${line(2)}/>`;
};
/** The angry cross-popping vein (💢) on (cx, cy). */
const vein = (cx, cy, r, fill = '#f03a2a') => [0, 90, 180, 270].map((a) => `<g transform="translate(${cx} ${cy}) rotate(${a})">
    <path d="M${f(r * 0.25)} ${f(-r)}Q${f(r * 0.3)} ${f(-r * 0.3)} ${f(r)} ${f(-r * 0.25)}" fill="none" ${line(r * 0.55)}/>
    <path d="M${f(r * 0.25)} ${f(-r)}Q${f(r * 0.3)} ${f(-r * 0.3)} ${f(r)} ${f(-r * 0.25)}" fill="none" stroke="${fill}" stroke-width="${f(r * 0.28)}" stroke-linecap="round"/></g>`).join('');
/** A round shield face-on, its boss a fist. */
const buckler = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#$w)" ${line(2.4)}/>
    <circle cx="${cx}" cy="${cy}" r="${f(r * 0.72)}" fill="none" stroke="#7a4418" stroke-width="1.4"/>
    <path d="M${f(cx - r * 0.6)} ${f(cy - r * 0.45)}A${f(r * 0.75)} ${f(r * 0.75)} 0 0 1 ${f(cx - r * 0.1)} ${f(cy - r * 0.72)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.8"/>`;
/** A cracked boulder on (cx, cy). */
const boulder = (cx, cy, s = 1) => `<g transform="translate(${cx} ${cy}) scale(${s})">
    <path d="M-14 6L-12 -5L-4 -10L7 -9L14 -2L13 8L-9 10Z" fill="#9a8c7c" ${line(2.4 / s)}/>
    <path d="M-10 -4L-4 -8L6 -7" stroke="#d4c8b8" stroke-width="${f(1.5 / s)}" fill="none" stroke-linecap="round"/>
    <path d="M1 -9L-1 -2L3 2L0 9" fill="none" stroke="${INK}" stroke-width="${f(1.8 / s)}" stroke-linejoin="round"/>
  </g>`;
/** Chips flying off: [x, y, r] each. */
const chips = (list, fill = '#b8ac9c') => list.map(([x, y, r]) => `<path d="M${x - r} ${y}L${x} ${y - r}L${x + r} ${y + r * 0.4}Z" fill="${fill}" ${line(1.4)}/>`).join('');
/** A curved motion swoosh along d. */
const swoosh = (d, w = 3) => `<path d="${d}" fill="none" ${line(w + 2.4)}/><path d="${d}" fill="none" stroke="#fff3e0" stroke-width="${w}" stroke-linecap="round"/>`;
/** Small rising arrows: [x, y] each, 6 tall. */
const ups = (list, fill = '#ff7a3a') => list.map(([x, y]) => `<path d="M${x} ${y - 7}L${x + 4} ${y - 2}H${x + 1.6}V${y + 3}H${x - 1.6}V${y - 2}H${x - 4}Z" fill="${fill}" ${line(1.6)}/>`).join('');
const GREY = '#b0b0bc', GREY_LIT = '#d8d8e0';

export const FIGHTING = {
  'rock-smash': `<defs>${wood}</defs>
    ${boulder(24, 33, 1.15)}
    ${chips([[8, 26, 3], [40, 24, 3.2], [36, 42, 2.4]])}
    ${fist(24, 12, 0.85, 0)}
    ${speed(17, [6, 11], 6)}`,

  'mat-block': `<defs>${linear('t', [[0, '#e8f0b0'], [1, '#a8b860']])}</defs>
    <path d="M10 6L36 9V43L10 40Z" fill="url(#$t)" ${line(2.4)}/>
    <path d="M10 6L36 9V13L10 10ZM10 36L36 39V43L10 40Z" fill="#3a6a3a" ${line(2)}/>
    <path d="M14 14V36M18 14.5V36.5M22 15V37M26 15.5V37.5M30 16V38" stroke="#8a9a48" stroke-width="1" opacity="0.8"/>
    <path d="M37 18L42 16M37 26L43 26M37 34L42 36" ${line(2.2)}/>`,

  'low-kick': `${swoosh('M6 38Q18 44 40 36', 3)}
    ${boot(26, 34, 1.15, -8, GLOVE)}
    <path d="M2 44H46" ${line(2.4)}/>
    ${pow(40, 33, 6)}`,

  'vital-throw': `<defs>${wood}</defs>
    ${buckler(22, 26, 13)}
    ${fist(22, 26, 0.5, 0, GLOVE, GLOVE_DARK)}
    ${arrow('M30 8A16 16 0 0 1 42 30', 40, 32, 110)}`,

  'mach-punch': `${speed(18, [16, 24, 32], 12)}
    ${glove(30, 24, 0.95, -90)}
    ${sparkle(42, 10, 3)}${sparkle(42, 38, 2.4)}`,

  'double-kick': `${boot(16, 20, 0.9, -18, GLOVE)}${boot(24, 36, 0.9, -18, GLOVE)}
    ${pow(36, 13, 6)}${pow(41, 31, 5.4)}`,

  'karate-chop': `<defs>${wood}</defs>
    <path d="M4 34L22 36L21 44L4 42Z" fill="url(#$w)" ${line(2.2)}/>
    <path d="M26 36L44 34V42L27 44Z" fill="url(#$w)" ${line(2.2)}/>
    <path d="M22 36L24 39L26 36" fill="none" ${line(1.6)}/>
    ${blade(10, 12, 0.95, 52)}
    ${chips([[24, 30, 2], [30, 28, 1.6]], '#c07838')}`,

  revenge: `${glove(18, 30, 1.05, -20)}
    ${vein(34, 12, 7)}`,

  'close-combat': `${pow(24, 24, 15, '#ffb84a', 12)}
    ${glove(17, 22, 0.75, 25)}${glove(31, 27, 0.75, -155)}`,

  'no-retreat': `<path d="M10 14V44M38 14V44" ${line(5.4)}/><path d="M10 14V44M38 14V44" stroke="#9a6a3a" stroke-width="2.8"/>
    <rect x="5" y="16" width="38" height="10" rx="2" fill="#ffd84a" ${line(2.4)}/>
    <path d="M11 16L5 26M21 16L13 26M31 16L23 26M41 16L33 26" stroke="${INK}" stroke-width="3.2"/>
    <rect x="5" y="16" width="38" height="10" rx="2" fill="none" ${line(2.4)}/>
    <path d="M8 44H40" ${line(2.4)}/>`,

  'sky-uppercut': `${swoosh('M12 44Q10 22 28 8', 3.4)}
    ${glove(28, 20, 0.9, 0)}
    ${sparkle(40, 8, 3.4)}${sparkle(10, 12, 2.4)}${sparkle(42, 26, 2)}`,

  'arm-thrust': `${palm(18, 28, 0.85, 70, '#f0a068')}${palm(30, 26, 0.95, 80)}
    ${speed(12, [12, 40], 7)}`,

  'force-palm': `<circle cx="34" cy="24" r="10" fill="none" stroke="#ffd84a" stroke-width="2.4" opacity="0.9"/>
    <circle cx="38" cy="24" r="6" fill="none" stroke="#fff3c0" stroke-width="2"/>
    <path d="M42 10Q48 24 42 38" fill="none" ${line(2)}/>
    ${palm(18, 26, 1.05, 90)}`,

  parry: `<defs>${wood}</defs>
    <g transform="rotate(-35 24 26)"><rect x="10" y="20" width="28" height="12" rx="4" fill="url(#$w)" ${line(2.4)}/>
    <path d="M16 20V32M32 20V32" stroke="${INK}" stroke-width="1.6"/></g>
    ${arrow('M42 40Q36 34 30 34', 28, 34, 180, '#ffffff', 3)}
    ${sparkle(36, 18, 4.4, '#ffd84a')}${sparkle(12, 40, 2.4)}`,

  'fighting-spirit': `<defs>${hot}</defs>
    ${blaze(24, 3, 44, 34)}
    ${glove(24, 30, 0.75, 0)}`,

  'storm-throw': `${tube(spiral(24, 24, 2.2, 18), 3, '#b8e4ff', '#fff')}
    ${glove(24, 24, 0.6, 30)}
    ${speed(10, [8, 40], 6)}`,

  counter: `<defs>${wood}</defs>
    ${buckler(14, 26, 10)}
    ${arrow('M44 12Q30 14 26 22', 24, 25, 120, '#f05a3a', 3)}
    ${arrow('M26 30Q32 38 40 40', 42, 40, 10, '#ffd84a', 3.4)}
    ${pow(26, 26, 5)}`,

  detect: `<path d="M4 24Q24 4 44 24Q24 44 4 24Z" fill="#fffaf0" ${line(2.4)}/>
    <circle cx="24" cy="24" r="8" fill="#e8402a" ${line(2)}/>
    <circle cx="24" cy="24" r="3.4" fill="${INK}"/>
    <circle cx="21.6" cy="21.6" r="1.6" fill="#fff"/>
    <path d="M24 2V7M10 6L13 10M38 6L35 10M24 46V41" ${line(2.2)}/>`,

  'circle-throw': `${arrow('M12 34A14 14 0 1 1 34 37', 36, 35, 150, '#ffd84a', 4)}
    ${pow(24, 24, 7, '#ff9a5a', 8)}`,

  counterstance: `<path d="M8 26Q24 16 40 26" fill="none" ${line(8)}/>
    <path d="M8 26Q24 16 40 26" fill="none" stroke="#f03a2a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="24" cy="20" r="4.6" fill="#ffffff" ${line(2)}/>
    <circle cx="24" cy="20" r="2.2" fill="#f03a2a"/>
    <path d="M38 26Q42 34 38 42M40 26Q46 32 46 40" fill="none" ${line(4.2)}/>
    <path d="M38 26Q42 34 38 42M40 26Q46 32 46 40" fill="none" stroke="#f03a2a" stroke-width="2" stroke-linecap="round"/>
    ${ups([[12, 40], [22, 42]], '#ffd84a')}`,

  superpower: `${pow(24, 24, 20, '#ff6a3a', 14)}
    ${glove(24, 26, 0.95, 0)}
    ${ups([[8, 14], [40, 14]], '#ffd84a')}`,

  reversal: `${arrow('M10 38V20A10 10 0 0 1 30 20V28', 30, 30, 90, '#ffd84a', 4)}
    ${arrow('M38 10V30', 38, 32, 90, '#f05a3a', 3)}
    ${fist(14, 38, 0.45, 0)}`,

  steadfast: `<path d="M14 44V16Q14 6 24 6Q34 6 34 16V44Z" fill="#a8a094" ${line(2.4)}/>
    <path d="M18 16H22M26 16H30M20 26Q24 29 28 26" ${line(2)}/>
    <path d="M14 12Q24 8 34 12" fill="none" ${line(4.6)}/><path d="M14 12Q24 8 34 12" fill="none" stroke="#f03a2a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M17 8Q20 7 22 9" stroke="#e0d8cc" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M6 44H42" ${line(2.4)}/>`,

  coaching: `<path d="M6 20H14L34 8V40L14 28H6Z" fill="#ffd84a" ${line(2.4)}/>
    <path d="M10 28L14 40H19L16 28" fill="#ffffff" ${line(2)}/>
    <path d="M14 20V28" stroke="${INK}" stroke-width="1.6"/>
    <path d="M38 16Q42 24 38 32M42 12Q48 24 42 36" fill="none" ${line(2.4)}/>`,

  'iron-fist': `<defs>${steel}</defs>
    ${fist(24, 24, 1.15, -10, 'url(#$m)', '#6a7894')}
    ${sparkle(39, 10, 4)}${sparkle(10, 39, 2.6)}`,

  'high-jump-kick': `${swoosh('M4 42Q8 18 26 14', 3)}
    ${boot(32, 18, 1.05, -40, GLOVE)}
    ${pow(42, 8, 5.4)}
    <path d="M2 44H18" ${line(2.4)}/>`,

  bide: `<path d="M12 4H36M12 44H36" ${line(5)}/><path d="M12 4H36M12 44H36" stroke="#9a6a3a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M15 6Q15 18 22 24Q15 30 15 42H33Q33 30 26 24Q33 18 33 6Z" fill="#f4f8ff" ${line(2.4)}/>
    <path d="M18 12Q19 18 24 21Q29 18 30 12Z" fill="#f05a3a"/>
    <path d="M17.6 41Q20 33 24 30Q28 33 30.4 41Z" fill="#f05a3a"/>
    <path d="M24 22V30" stroke="#f05a3a" stroke-width="1.4"/>`,

  'anger-point': `${vein(24, 22, 13)}
    ${puffs([[9, 40, 3.4], [14, 42, 3], [36, 41, 3.4], [41, 39, 2.8]], '#e8e8f0', '#ffffff')}`,

  'meteor-assault': `<defs>${hot}</defs>
    ${blaze(16, 2, 30, 18, 2.4, -135)}
    <circle cx="30" cy="32" r="10" fill="#9a7c64" ${line(2.4)}/>
    <path d="M24 30Q26 26 30 25" stroke="#d8c0a8" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="33" cy="35" r="2" fill="#6a5240"/>
    ${pow(42, 43, 5)}`,

  defiant: `${glove(24, 28, 1, -90)}
    ${arrow('M40 40V16', 40, 13, -90, '#ffd84a', 3)}
    ${vein(9, 10, 5)}`,

  'power-up-punch': `${glove(22, 28, 0.95, -60)}
    ${ups([[36, 14], [42, 26], [30, 8]], '#ffd84a')}`,

  'wide-guard': `<path d="M2 18Q24 6 46 18V30Q24 42 2 30Z" fill="#ffd8b0" ${line(2.4)}/>
    <path d="M2 18Q24 6 46 18" fill="none" stroke="#fff" stroke-width="1.4" transform="translate(0 3)" opacity="0.8"/>
    ${glove(14, 24, 0.5, -90)}${glove(34, 24, 0.5, -90)}
    <path d="M24 13V35" stroke="#d8784a" stroke-width="1.6"/>`,

  submission: `<path d="M8 12L40 36M8 36L40 12" fill="none" ${line(10)}/>
    <path d="M8 12L40 36" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
    <path d="M8 36L40 12" stroke="#f0a068" stroke-width="7" stroke-linecap="round"/>
    ${pow(24, 24, 6.4)}`,

  'cross-chop': `${blade(6, 10, 0.95, 40)}${blade(42, 10, 0.95, 140)}
    ${pow(24, 34, 7)}`,

  'triple-kick': `${boot(12, 16, 0.75, -10, GLOVE)}${boot(20, 30, 0.75, -10, GLOVE)}${boot(28, 44, 0.75, -10, GLOVE)}
    ${pow(37, 10, 4.6)}${pow(42, 25, 4.6)}${pow(43, 39, 4)}`,

  'seismic-toss': `<circle cx="24" cy="30" r="13" fill="#4a98f0" ${line(2.4)}/>
    <path d="M14 24Q18 20 22 24Q24 30 18 32Q14 32 13 28ZM27 34Q31 30 35 33Q34 39 29 40Z" fill="#62c060" ${line(1.4)}/>
    ${arrow('M6 26Q10 4 30 6', 33, 7, 10, '#ffd84a', 3.4)}`,

  'dynamic-punch': `${pow(26, 24, 18, '#ff9a3a', 12)}
    ${glove(24, 26, 0.85, -70)}
    ${tube(spiral(9, 9, 1.4, 6), 1.8, '#d8b0ff', '#fff')}${tube(spiral(40, 41, 1.4, 6), 1.8, '#d8b0ff', '#fff')}`,

  'flying-press': `<path d="M22 18Q10 6 2 10Q8 14 6 20Q14 18 20 24Z" fill="#7ad8a0" ${line(2.2)}/>
    <path d="M26 18Q38 6 46 10Q40 14 42 20Q34 18 28 24Z" fill="#7ad8a0" ${line(2.2)}/>
    ${glove(24, 26, 0.75, 180)}
    <path d="M6 44H42" ${line(2.4)}/>
    ${pow(24, 42, 5)}`,

  sore: `<path d="M8 32L22 8Q26 4 30 8L40 26Q42 32 36 36L22 42Q14 44 10 38Z" fill="${GREY_LIT}" ${line(2.4)}/>
    <g transform="rotate(-35 24 26)"><rect x="12" y="21" width="24" height="10" rx="4" fill="#f0e8d8" ${line(2)}/>
    <rect x="20" y="21" width="8" height="10" fill="${GREY}" ${line(1.4)}/>
    <path d="M22 24V28M26 24V28" stroke="#8c8c94" stroke-width="1" stroke-linecap="round"/></g>
    <path d="M38 8l3 -3M42 13l4 -1M33 5l0 -4" ${line(2)}/>`,
};

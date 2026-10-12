/* ============================================================
   card-art-psychic.js  -  Mewtwo's Psychic cards drawn (batch 4 of
   the smooth card art, 2026-10-12). Its starting deck's are in
   card-art.js.
   ============================================================ */

import {
  INK, f, line, star, spiral, sine, tube, sparkle, radial, linear,
  puffs, fist, speed,
} from './card-art-kit.js';

const psi = linear('p', [[0, '#ffc8f2'], [0.5, '#e070e0'], [1, '#8a3ad8']], 1, 1);
const orb = radial('o', [[0, '#ffffff'], [0.4, '#ffc8f2'], [1, '#a040e0']], '40%', '38%', '70%');
const PINK = '#ff8ae0', VIOLET = '#a060f0', LIGHT = '#ffd8f6';
const SHIELD = 'M24 4L41 9.5V22C41 33 33.5 40.5 24 44.5C14.5 40.5 7 33 7 22V9.5Z';

const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
  const a = (60 * i - 90) * Math.PI / 180;
  return `${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`;
}).join(' ');

const shine = (x0, y0, x1, y1, w = 2) => `<path d="M${x0} ${y0}L${x1} ${y1}" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="0.85"/>`;

/** An eye, its middle on (cx, cy), w wide. */
const eye = (cx, cy, w, iris = VIOLET) => {
  const h = w * 0.36;
  return `<path d="M${cx - w / 2} ${cy}Q${cx} ${f(cy - h * 2)} ${cx + w / 2} ${cy}Q${cx} ${f(cy + h * 2)} ${cx - w / 2} ${cy}Z" fill="#fff" ${line(2.4)}/>
    <circle cx="${cx}" cy="${cy}" r="${f(h * 0.95)}" fill="${iris}" ${line(1.6)}/><circle cx="${cx}" cy="${cy}" r="${f(h * 0.4)}" fill="${INK}"/>
    <circle cx="${f(cx - h * 0.35)}" cy="${f(cy - h * 0.35)}" r="${f(h * 0.22)}" fill="#fff"/>`;
};

/** A brain seen from the side, its middle on (cx, cy), r across. */
const brain = (cx, cy, r, fill = '#ffb0e0') => `<g transform="translate(${cx} ${cy}) scale(${f(r / 14)})">
    <path d="M-12 4C-15 0 -14 -6 -10 -8C-9 -12 -4 -14 0 -12C4 -14 9 -12 10 -8C14 -6 15 0 12 4C12 8 8 10 4 9C2 11 -2 11 -4 9C-8 10 -12 8 -12 4Z" fill="${fill}" ${line(2.4 * 14 / r)}/>
    <path d="M0 -12V8M-8 -6C-5 -4 -6 0 -9 1M8 -6C5 -4 6 0 9 1M-4 3C-2 1 -4 -2 -2 -4M4 3C2 1 4 -2 2 -4" stroke="#c0509a" stroke-width="${f(1.4 * 14 / r)}" stroke-linecap="round" fill="none"/>
    <path d="M-10 -4C-10 -7 -8 -9 -5 -9" stroke="#fff" stroke-width="${f(1.6 * 14 / r)}" stroke-linecap="round" fill="none" opacity="0.8"/></g>`;

/** Waves of thought: arcs opening to the right of (x, y). */
const waves = (x, y, n = 3, colour = PINK, flip = false) => Array.from({ length: n }, (_, i) => {
  const r = 5 + i * 4.4, s = flip ? -1 : 1;
  return `<path d="M${x + s * r * 0.5} ${f(y - r * 0.86)}A${r} ${r} 0 0 ${flip ? 0 : 1} ${x + s * r * 0.5} ${f(y + r * 0.86)}" fill="none" ${line(3.6)}/><path d="M${x + s * r * 0.5} ${f(y - r * 0.86)}A${r} ${r} 0 0 ${flip ? 0 : 1} ${x + s * r * 0.5} ${f(y + r * 0.86)}" fill="none" stroke="${colour}" stroke-width="1.6" stroke-linecap="round"/>`;
}).join('');

const glassPane = (x, y, w, h, fill = 'url(#$g)', rot = 0) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.4" fill="${fill}" ${line(2.6)}/>
    ${shine(x + 4, y + h * 0.42, x + w * 0.42, y + 4, 2.2)}${shine(x + 5, y + h * 0.7, x + w * 0.7, y + 5, 1.2)}</g>`;
const glass = linear('g', [[0, '#fff0fb'], [1, '#e0a8f4']], 1, 1);

const lock = (cx, cy, s = 1, fill = '#ffd040') => `<g transform="translate(${cx} ${cy}) scale(${s})">
    <path d="M-6 -2V-7A6 6 0 0 1 6 -7V-2" fill="none" ${line(5.4 / s)}/><path d="M-6 -2V-7A6 6 0 0 1 6 -7V-2" fill="none" stroke="#c8ccd8" stroke-width="${f(2.6 / s)}"/>
    <rect x="-9" y="-2" width="18" height="15" rx="2.6" fill="${fill}" ${line(2.4 / s)}/>
    <circle cx="0" cy="4" r="2" fill="${INK}"/><path d="M0 4V9" ${line(2 / s)}/></g>`;

const arrow = (d, hx, hy, angle, colour) => `<path d="${d}" fill="none" ${line(6)}/><path d="${d}" fill="none" stroke="${colour}" stroke-width="3.2" stroke-linecap="round"/>
  <path transform="translate(${hx} ${hy}) rotate(${angle})" d="M5 0L-4 -6L-2 0L-4 6Z" fill="${colour}" ${line(2)}/>`;

const crystalBall = (cx, cy, r) => `<path d="M${cx - r * 0.8} ${cy + r * 1.3}L${cx - r * 0.55} ${cy + r * 0.8}H${cx + r * 0.55}L${cx + r * 0.8} ${cy + r * 1.3}Z" fill="#c8a040" ${line(2.2)}/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#$o)" ${line(2.6)}/>
  <path d="M${f(cx - r * 0.6)} ${f(cy - r * 0.2)}A${f(r * 0.65)} ${f(r * 0.65)} 0 0 1 ${f(cx - r * 0.1)} ${f(cy - r * 0.65)}" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;

const lotus = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${s})">
    ${[-50, -25, 0, 25, 50].map((a) => `<path transform="rotate(${a} 0 0)" d="M0 0C-4 -5 -4 -11 0 -15C4 -11 4 -5 0 0Z" fill="${Math.abs(a) > 30 ? '#ffb0e0' : '#ffd0f0'}" ${line(1.6 / s)}/>`).join('')}
    <path d="M-12 0H12" ${line(2 / s)}/></g>`;

export const PSYCHIC = {
  'mind-bolt': `<defs>${orb}</defs>
    ${brain(16, 16, 12)}
    <path d="M28 18L22 30H30L24 44L40 26H31L36 18Z" fill="#ffe94a" ${line(2.2)}/>
    <path d="M28.6 21L25.4 27.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
    ${sparkle(42, 10, 2.6, LIGHT)}`,

  'telekinetic-crush': `<defs>${linear('r', [[0, '#a89aa8'], [1, '#5a4e60']], 1, 1)}</defs>
    <polygon points="14,30 20,20 30,19 36,28 32,38 18,38" fill="url(#$r)" ${line(2.6)}/>
    <path d="M20 20L24 29L30 19M24 29L18 38M24 29L36 28" stroke="${INK}" stroke-width="1.4" fill="none"/>
    ${[[6, 28, 0], [42, 28, 180], [24, 6, 90]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x - 4} ${y - 6}L${x + 2} ${y}L${x - 4} ${y + 6}" fill="none" ${line(5.6)}/><path d="M${x - 4} ${y - 6}L${x + 2} ${y}L${x - 4} ${y + 6}" fill="none" stroke="${PINK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')}
    <ellipse cx="25" cy="29" rx="16" ry="14" fill="none" stroke="${PINK}" stroke-width="1.4" stroke-dasharray="3 2.4" opacity="0.8"/>`,

  'calm-mind': `${[22, 16, 10].map((r, i) => `<circle cx="24" cy="24" r="${r}" fill="none" stroke="${['#f0c8ff', '#e0a0f8', '#c070f0'][i]}" stroke-width="${3 - i * 0.6}" opacity="0.8"/>`).join('')}
    ${lotus(24, 32, 1.2)}
    <circle cx="24" cy="15" r="3" fill="#ffe070" ${line(1.4)}/>`,

  barrier: `<defs>${glass}</defs>
    ${[[6, 8], [24, 8], [15, 22], [33, 22], [-3, 22], [6, 36], [24, 36]].map(([x, y]) => `<rect x="${x + 0.6}" y="${y - 6}" width="16.8" height="12.4" rx="1.6" fill="url(#$g)" ${line(2)}/>${shine(x + 3, y + 2, x + 8, y - 3, 1.4)}`).join('')}`,

  recover: `<defs>${linear('h', [[0, '#ffd0f0'], [1, '#e050a8']], 1, 1)}</defs>
    <path d="M24 42C11 33 4 27 4 18C4 12 8.6 7 14 7C18 7 21.6 9.4 24 13C26.4 9.4 30 7 34 7C39.4 7 44 12 44 18C44 27 37 33 24 42Z" fill="url(#$h)" ${line(2.6)}/>
    <path d="M24 17V31M17 24H31" ${line(5.6)}/><path d="M24 17V31M17 24H31" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <path d="M9 16C9 13 11 11 14 11" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${sparkle(42, 38, 2.8, LIGHT)}${sparkle(6, 36, 2.2, LIGHT)}`,

  'future-sight': `<defs>${orb}</defs>
    ${crystalBall(24, 21, 15)}
    ${eye(24, 21, 14)}
    ${sparkle(8, 6, 2.6, LIGHT)}${sparkle(42, 8, 2.2, LIGHT)}`,

  'mind-reader': `${eye(24, 24, 36)}
    <circle cx="24" cy="24" r="14" fill="none" stroke="#e8203a" stroke-width="1.6" stroke-dasharray="3 2.6"/>
    <path d="M24 2V8M24 40V46M2 24H6M42 24H46" stroke="#e8203a" stroke-width="2" stroke-linecap="round"/>`,

  telekinesis: `<defs>${linear('r', [[0, '#a89aa8'], [1, '#5a4e60']], 1, 1)}</defs>
    ${[[12, 18, 6], [32, 10, 5], [34, 30, 7]].map(([x, y, r]) => `<polygon points="${x - r},${y} ${x - r * 0.4},${y - r * 0.8} ${x + r * 0.7},${y - r * 0.6} ${x + r},${y + r * 0.2} ${x + r * 0.3},${y + r * 0.8} ${x - r * 0.7},${y + r * 0.6}" fill="url(#$r)" ${line(2.2)}/><ellipse cx="${x}" cy="${y + r + 4}" rx="${r * 0.9}" ry="1.6" fill="${PINK}" opacity="0.6"/><path d="M${x - r * 0.7} ${y + r + 1}c${r * 0.3} -1 ${r * 1.1} -1 ${r * 1.4} 0" stroke="${PINK}" stroke-width="1.4" fill="none"/>`).join('')}
    ${waves(6, 38, 2, PINK, true)}`,

  'reflective-screen': `<defs>${linear('g', [[0, '#fffbe0'], [1, '#f0c050']], 1, 1)}</defs>
    ${glassPane(8, 6, 26, 36, 'url(#$g)', -8)}
    ${arrow('M46 12L36 22', 33, 25, 135, '#ff6a8a')}
    ${arrow('M30 30L44 40', 44, 40, 35, '#ff6a8a')}`,

  disable: `${lock(24, 24, 1.4, '#c890f0')}
    <path d="M6 6L42 42" ${line(5.4)}/><path d="M6 6L42 42" stroke="#e8203a" stroke-width="2.8" stroke-linecap="round"/>`,

  psybeam: `${[[8, 36, 4, '#ff8ae0'], [16, 30, 5.6, '#ffd040'], [25, 23, 7.2, '#5ad8ff'], [35, 15, 8.8, '#a060f0']].map(([x, y, r, c]) => `<ellipse cx="${x}" cy="${y}" rx="${f(r * 0.5)}" ry="${r}" transform="rotate(45 ${x} ${y})" fill="none" ${line(4.4)}/><ellipse cx="${x}" cy="${y}" rx="${f(r * 0.5)}" ry="${r}" transform="rotate(45 ${x} ${y})" fill="none" stroke="${c}" stroke-width="2.2"/>`).join('')}
    ${sparkle(42, 38, 2.8, LIGHT)}`,

  'brain-wave': `${brain(16, 24, 14)}${waves(30, 24, 3, PINK)}`,

  'dissonant-pulse': `${tube('M4 18L10 10L16 22L22 8L28 24L34 10L40 20L44 14', 2.6, PINK, '#fff')}
    ${tube('M4 34L10 40L16 28L22 42L28 26L34 40L40 30L44 36', 2.6, VIOLET, '#e8d8ff')}
    <polygon points="${star(24, 25, 6, 5, 2.2)}" fill="#ffe070" ${line(1.4)}/>`,

  'focus-blast': `<defs>${radial('a', [[0, '#ffffff'], [0.35, '#fff3a0'], [0.75, '#ffa040'], [1, '#e85a2a']])}</defs>
    ${[20, 15].map((r) => `<circle cx="24" cy="24" r="${r}" fill="none" stroke="#ffd070" stroke-width="1.6" stroke-dasharray="4 3"/>`).join('')}
    <circle cx="24" cy="24" r="11" fill="url(#$a)" ${line(2.6)}/>
    <path d="M17 21a7 7 0 0 1 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M24 2V8M24 40V46M2 24H8M40 24H46" ${line(2.4)}/>`,

  'dream-eater': `<defs>${linear('m', [[0, '#fff8d0'], [1, '#f0c050']], 1, 1)}</defs>
    <path d="M22 4A18 18 0 1 0 42 30A14 14 0 1 1 22 4Z" fill="url(#$m)" ${line(2.6)}/>
    <path d="M28 33l3 3 3-3 3 3" fill="none" ${line(1.8)}/>
    ${puffs([[36, 12, 4], [42, 8, 3], [42, 15, 2.6]], '#e0d0ff', '#fff', 1.1)}
    <text x="8" y="44" font-family="sans-serif" font-weight="900" font-size="8" fill="#e0d0ff" stroke="${INK}" stroke-width="1.2" paint-order="stroke">z</text>`,

  'mirror-image': `<defs>${psi}</defs>
    <path d="M10 44C10 34 12 28 18 26C14 24 12 20 12 16C12 10 15 6 18 6S24 10 24 16C24 20 22 24 18 26C24 28 26 34 26 44Z" fill="url(#$p)" ${line(2.4)}/>
    <path d="M22 44C22 34 24 28 30 26C26 24 24 20 24 16C24 10 27 6 30 6S36 10 36 16C36 20 34 24 30 26C36 28 38 34 38 44Z" fill="url(#$p)" opacity="0.45" ${line(2)} stroke-dasharray="3 2"/>
    ${sparkle(42, 10, 2.8, LIGHT)}`,

  'psychic-surge': `<defs>${psi}</defs>
    <path d="${sine(2, 46, 34, 2.6, 2)}V46H2Z" fill="url(#$p)" ${line(2.4)}/>
    ${[12, 24, 36].map((x) => arrow(`M${x} 30V12`, x, 10, -90, '#ffe070')).join('')}`,

  'kinetic-barrage': `<defs>${orb}</defs>
    ${[[10, 34, 6], [22, 22, 6.6], [36, 12, 7.2]].map(([x, y, r]) => `<path d="M${x - r * 1.6} ${y + r * 1.4}L${x - r * 0.4} ${y + r * 0.5}" stroke="${PINK}" stroke-width="2" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#$o)" ${line(2.2)}/>`).join('')}`,

  'psycho-cut': `<defs>${linear('a', [[0, '#ffffff'], [0.5, '#ff9ae6'], [1, '#c040d8']], 1, 1)}</defs>
    <path d="M6 42C10 22 22 8 42 4C30 12 22 24 18 40C14 40 10 40 6 42Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M10 38C14 24 24 12 38 7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M24 44C28 32 36 24 46 20" fill="none" stroke="${PINK}" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>`,

  'telekinetic-toss': `<defs>${linear('b', [[0, '#e0b070'], [1, '#9a6a34']], 1, 1)}</defs>
    <path d="M4 40C10 20 24 12 34 14" fill="none" stroke="${PINK}" stroke-width="2" stroke-dasharray="3 2.4" stroke-linecap="round"/>
    <g transform="rotate(20 34 20)"><rect x="26" y="12" width="16" height="16" rx="2" fill="url(#$b)" ${line(2.4)}/><path d="M26 20H42M34 12V28" stroke="#6a4420" stroke-width="1.4"/></g>
    ${waves(8, 32, 2, PINK, true)}
    ${speed(22, [8, 4], 6)}`,

  'focus-punch': `${[19, 14].map((r) => `<circle cx="24" cy="24" r="${r}" fill="none" stroke="#ffb030" stroke-width="1.8" stroke-dasharray="4 3"/>`).join('')}
    ${fist(24, 24, 1.1, 0, '#ff9a6a', '#d0603a')}
    <path d="M24 2V6M24 42V46M2 24H6M42 24H46" ${line(2.4)}/>`,

  'aura-sphere': `<defs>${radial('a', [[0, '#ffffff'], [0.35, '#a8e8ff'], [1, '#2a5ae0']])}</defs>
    ${[0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a} 24 24)" d="M24 4C30 8 28 14 24 14" stroke="#7ab8ff" stroke-width="2.2" stroke-linecap="round" fill="none"/>`).join('')}
    <circle cx="24" cy="24" r="12" fill="url(#$a)" ${line(2.6)}/>
    <path d="M17 21a7 7 0 0 1 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'power-within': `<defs>${psi}</defs>
    <polygon points="24,4 38,18 24,44 10,18" fill="url(#$p)" ${line(2.6)}/>
    <path d="M10 18H38M24 4L18 18L24 44L30 18Z" stroke="${INK}" stroke-width="1.2" fill="none" opacity="0.5"/>
    ${shine(15, 16, 21, 9)}
    ${arrow('M24 32V20', 24, 18, -90, '#ffe070')}`,

  'psychic-crush': `<defs>${psi}</defs>
    <path d="M8 4H40V16C40 20 36 22 32 22H16C12 22 8 20 8 16Z" fill="url(#$p)" ${line(2.6)}/>
    <path d="M16 4V16M24 4V16M32 4V16" stroke="${INK}" stroke-width="1.4"/>
    ${shine(11, 14, 11, 7)}
    <polygon points="${star(24, 33, 10, 11, 5.4, -90)}" fill="#ffd040" ${line(1.8)}/>
    <path d="M2 44.6H46" ${line(2.2)}/>`,

  kinesis: `<defs>${linear('s', [[0, '#ffffff'], [1, '#a8b0c8']], 1, 0)}</defs>
    <path d="M10 42L20 26C22 22 24 20 26 17" fill="none" ${line(6)}/><path d="M10 42L20 26C22 22 24 20 26 17" fill="none" stroke="url(#$s)" stroke-width="3.2" stroke-linecap="round"/>
    <ellipse cx="32" cy="11" rx="6" ry="8" transform="rotate(50 32 11)" fill="url(#$s)" ${line(2.4)}/>
    <path d="M29 9a4 4 0 0 1 4-2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${waves(34, 30, 2, PINK)}${sparkle(8, 10, 2.6, LIGHT)}`,

  'light-screen': `<defs>${glass}</defs>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${4 + i * 2} ${8 + i * 7}H0" stroke="#ffe070" stroke-width="2" stroke-linecap="round"/>`).join('')}
    ${glassPane(10, 4, 28, 40)}
    <path d="M38 12h6M38 20h8M38 28h6M38 36h8" stroke="#ffe070" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`,

  'barrier-field': `<defs>${glass}</defs>
    <path d="M4 40C4 22 13 8 24 8S44 22 44 40Z" fill="url(#$g)" opacity="0.8" ${line(2.6)}/>
    <path d="M10 40C10 26 16 16 24 14M24 8V40M14 40C14 22 18 12 24 8M34 40C34 22 30 12 24 8" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.6"/>
    ${shine(9, 28, 15, 16, 2.4)}
    <path d="M2 40.6H46" ${line(2.6)}/>`,

  'counter-guard': `<defs>${psi}</defs>
    <path d="${SHIELD}" fill="url(#$p)" ${line(2.6)}/>
    ${arrow('M30 16C20 14 16 22 20 30', 22, 32.6, 60, '#ffe070')}
    <path d="M12 12V21c0 3 .7 6 2 8.6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>`,

  safeguard: `<defs>${linear('a', [[0, '#e8fff4'], [1, '#60c8a0']], 1, 1)}</defs>
    <ellipse cx="24" cy="6" rx="10" ry="3" fill="none" ${line(3.6)}/><ellipse cx="24" cy="6" rx="10" ry="3" fill="none" stroke="#ffe070" stroke-width="1.8"/>
    <path d="M24 10L39 15V25C39 34 32 40 24 44C16 40 9 34 9 25V15Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M17 26L22 31L32 20" fill="none" ${line(5)}/><path d="M17 26L22 31L32 20" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,

  'telekinetic-wall': `<defs>${linear('r', [[0, '#c8b0d8'], [1, '#6a4e80']], 1, 1)}</defs>
    ${[[4, 8], [18, 6], [32, 9], [8, 22], [24, 21], [38, 24], [4, 36], [18, 35], [32, 37]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="12" height="10" rx="2" transform="rotate(${(i % 3 - 1) * 6} ${x + 6} ${y + 5})" fill="url(#$r)" ${line(2)}/>`).join('')}
    <rect x="2" y="3" width="44" height="44" rx="4" fill="none" stroke="${PINK}" stroke-width="1.6" stroke-dasharray="4 3"/>`,

  'reflective-armor': `<defs>${linear('a', [[0, '#ffffff'], [0.5, '#e8c8f4'], [1, '#9a6ab8']], 1, 1)}</defs>
    <path d="M8 6L16 4C18 8 30 8 32 4L40 6L44 16L38 20V42H10V20L4 16Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 10V42M10 26H38" stroke="${INK}" stroke-width="1.2" opacity="0.4"/>
    ${shine(14, 30, 20, 14, 2.4)}
    <polygon points="${star(32, 32, 6, 5.4, 2.4)}" fill="#ffe070" ${line(1.4)}/>`,

  'psychic-rampart': `<defs>${psi}</defs>
    <path d="M4 44V14H10V20H16V14H22V20H28V14H34V20H40V14H44V44Z" fill="url(#$p)" ${line(2.6)}/>
    <path d="M4 30H44M14 30V44M24 30V44M34 30V44M9 20V30M19 20V30M29 20V30M39 20V30" stroke="#8a3ad8" stroke-width="1.2" opacity="0.6"/>
    <path d="M20 44V36C20 33 28 33 28 36V44Z" fill="#3a1a5a" ${line(2)}/>
    ${sparkle(24, 6, 3, LIGHT)}`,

  'force-bubble': `<defs>${radial('b', [[0, '#fff4fc'], [0.6, '#ffc8f2'], [1, '#c060e8']], '35%', '30%', '75%')}</defs>
    <circle cx="24" cy="24" r="20" fill="url(#$b)" opacity="0.85" ${line(2.6)}/>
    <path d="M10 22A14 14 0 0 1 22 10" stroke="#fff" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    <circle cx="35" cy="34" r="2.4" fill="#fff"/>
    <circle cx="24" cy="24" r="13" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/>`,

  'zen-focus': `<defs>${linear('r', [[0, '#c8bcd8'], [1, '#7a6a90']], 1, 1)}</defs>
    ${[[24, 40, 15, 5], [24, 30.6, 11, 4.4], [24, 22.6, 7.6, 3.6]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#$r)" ${line(2.2)}/><path d="M${x - rx * 0.6} ${y - ry * 0.3}q${rx * 0.4} ${-ry * 0.5} ${rx * 0.8} ${-ry * 0.4}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>`).join('')}
    <circle cx="24" cy="10" r="6" fill="#ffe070" ${line(2)}/><circle cx="24" cy="10" r="2.4" fill="#ff8ae0"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path transform="rotate(${a} 24 10)" d="M24 1V2.6" stroke="#ffd040" stroke-width="1.6" stroke-linecap="round"/>`).join('')}`,

  hypnosis: `<defs>${radial('c', [[0, '#fffbe0'], [1, '#e8b030']], '40%', '35%', '70%')}</defs>
    <path d="M24 2L32 26" ${line(2.4)}/>
    <circle cx="32" cy="32" r="11" fill="url(#$c)" ${line(2.6)}/>
    ${tube(spiral(32, 32, 2, 8), 1.4, '#c06ad8', null)}
    <path d="M8 34Q14 42 22 40M6 26Q8 20 14 18" stroke="${PINK}" stroke-width="1.8" stroke-dasharray="2 2" fill="none" stroke-linecap="round"/>
    <circle cx="24" cy="2.6" r="1.8" fill="${INK}"/>`,

  'trick-room': `<path d="M24 6L42 15V35L24 44L6 35V15Z" fill="#2a1a4a" ${line(2.6)}/>
    <path d="M24 6V24M6 15L24 24L42 15M24 24V44" fill="none" stroke="${PINK}" stroke-width="2"/>
    <path d="M12 21L12 34M18 24V38M30 24V38M36 21V34" stroke="${VIOLET}" stroke-width="1.4" opacity="0.8"/>
    <path d="M12 12L24 18L36 12" stroke="#5ad8ff" stroke-width="1.4" fill="none" opacity="0.8"/>
    ${sparkle(24, 32, 3, '#fff')}`,

  'mind-games': `<defs>${psi}</defs>
    <path d="M14 44H36V40C36 38 34 36 32 36H18C16 36 14 38 14 40Z" fill="url(#$p)" ${line(2.4)}/>
    <path d="M18 36C18 30 22 26 22 22C18 24 14 24 12 20C14 12 20 6 28 6C34 6 38 12 38 20C38 28 32 30 32 36Z" fill="url(#$p)" ${line(2.6)}/>
    <circle cx="26" cy="13" r="1.8" fill="${INK}"/>
    <path d="M28 6L30 2L33 7" fill="url(#$p)" ${line(1.8)}/>
    ${shine(31, 14, 33, 26, 1.8)}`,

  'thought-scan': `${brain(20, 20, 14)}
    <circle cx="28" cy="26" r="9" fill="#d8f0ff" opacity="0.6" ${line(2.6)}/>
    <path d="M34.6 32.6L44 42" ${line(6)}/><path d="M34.6 32.6L44 42" stroke="#8a5a34" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M23 22a6 6 0 0 1 4-3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'disable-plus': `<path d="M4 18L14 22M44 18L34 22M6 34L14 30M42 34L34 30" stroke="#a8b0c8" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M4 18L14 22M44 18L34 22M6 34L14 30M42 34L34 30" stroke="${INK}" stroke-width="1" stroke-dasharray="2 2"/>
    ${lock(24, 24, 1.5, '#ff8ae0')}`,

  'future-shock': `<defs>${orb}</defs>
    ${crystalBall(24, 21, 15)}
    <path d="M24 6L18 18H25L20 30" fill="none" ${line(4.4)}/><path d="M24 6L18 18H25L20 30" fill="none" stroke="#ffe94a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M30 10l-2 5 3 3" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,

  telepathy: `<defs>${psi}</defs>
    <path d="M4 44V36C4 30 8 28 12 27C8 25 6 21 6 17C6 10 10 6 15 6S24 10 24 17C24 21 22 25 18 27C22 28 26 30 26 36V44Z" fill="url(#$p)" ${line(2.4)}/>
    ${shine(10, 18, 12, 11, 1.8)}
    ${waves(28, 16, 3, PINK)}`,

  'synchro-strike': `<circle cx="38" cy="24" r="8" fill="#fff" ${line(2.4)}/><circle cx="38" cy="24" r="4.6" fill="#e8203a"/><circle cx="38" cy="24" r="1.6" fill="#fff"/>
    ${arrow('M4 16H26', 28, 16, 0, PINK)}${arrow('M4 32H26', 28, 32, 0, VIOLET)}
    <path d="M10 22V26M16 22V26" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,

  'psycho-boost': `${[...Array(9)].map((_, i) => {
    const y = 4 + i * 5, x = 24 + 10 * Math.sin(i);
    return `<path d="M${f(48 - x)} ${y}H${f(x)}" stroke="${i % 2 ? PINK : '#5ad8ff'}" stroke-width="2" stroke-linecap="round"/>`;
  }).join('')}
    ${(() => {
    const pa = [], pb = [];
    for (let i = 0; i <= 40; i++) { const y = 4 + i, t = i * 0.2; pa.push(`${f(24 + 10 * Math.sin(t))} ${y}`); pb.push(`${f(24 - 10 * Math.sin(t))} ${y}`); }
    return tube(`M${pa.join('L')}`, 3, '#ff6a4a', '#ffd0c0') + tube(`M${pb.join('L')}`, 3, '#5a8ae8', '#d0e0ff');
  })()}`,

  'psyshock-wave': `${[20, 14, 8].map((r, i) => `<circle cx="24" cy="24" r="${r}" fill="none" ${line(4.4 - i * 0.6)}/><circle cx="24" cy="24" r="${r}" fill="none" stroke="${[VIOLET, PINK, '#ffd0f6'][i]}" stroke-width="${2.2 - i * 0.3}"/>`).join('')}
    <circle cx="24" cy="24" r="3" fill="#fff" ${line(1.6)}/>`,

  'unleashed-power': `<defs>${radial('a', [[0, '#ffffff'], [0.4, '#ffc8f2'], [1, '#c040d8']])}</defs>
    <polygon points="${star(24, 24, 10, 15, 8, -90)}" fill="url(#$a)" ${line(2.2)}/>
    ${[[8, 10, 30], [40, 10, -30], [8, 38, -30], [40, 38, 30]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x - 3}" cy="${y}" rx="3.6" ry="2.4" fill="none" ${line(3.2)}/><ellipse cx="${x - 3}" cy="${y}" rx="3.6" ry="2.4" fill="none" stroke="#c8ccd8" stroke-width="1.4"/><path d="M${x + 1} ${y - 2}l2 -2M${x + 2} ${y + 1}l3 0" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/></g>`).join('')}`,

  'psychic-mastery': `<defs>${linear('c', [[0, '#fff3a0'], [1, '#e8a020']], 0, 1)}</defs>
    <path d="M6 36L4 14L15 24L24 8L33 24L44 14L42 36Z" fill="url(#$c)" ${line(2.6)}/>
    <rect x="6" y="36" width="36" height="6" rx="1.6" fill="#e8a020" ${line(2.4)}/>
    <circle cx="24" cy="28" r="4.4" fill="${PINK}" ${line(1.8)}/>
    ${[[4, 14], [24, 8], [44, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${VIOLET}" ${line(1.4)}/>`).join('')}
    ${shine(10, 32, 12, 24, 1.6)}`,

  amnesia: `<defs>${psi}</defs>
    <path d="M10 44V36C10 30 14 28 18 27C14 25 12 21 12 17C12 10 16 6 21 6S30 10 30 17C30 21 28 25 24 27C28 28 32 30 32 36V44Z" fill="url(#$p)" ${line(2.4)}/>
    <circle cx="36" cy="12" r="9" fill="#fff" ${line(2.4)}/><path d="M28 18L24 22L30 20" fill="#fff" ${line(1.8)}/>
    <text x="36" y="16.4" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="12" fill="${VIOLET}">?</text>`,

  'mirror-armor': `<defs>${linear('a', [[0, '#ffffff'], [0.5, '#c8d0e0'], [1, '#7a84a0']], 1, 1)}</defs>
    <circle cx="24" cy="24" r="19" fill="url(#$a)" ${line(2.6)}/>
    <circle cx="24" cy="24" r="14" fill="none" stroke="#5a6480" stroke-width="1.4"/>
    ${shine(13, 22, 22, 13, 2.6)}${shine(16, 30, 30, 16, 1.4)}
    ${arrow('M32 30L42 40', 43, 41, 45, PINK)}`,

  'psychic-fortress': `<defs>${psi}</defs>
    <path d="M10 44V18H8V10H13V14H17V10H22V18H20V26H28V18H26V10H31V14H35V10H40V18H38V44Z" fill="url(#$p)" ${line(2.6)}/>
    <path d="M20 44V36C20 32 28 32 28 36V44Z" fill="#3a1a5a" ${line(2)}/>
    <path d="M14 22V28M34 22V28" ${line(2)}/>
    <path d="M24 26V6" ${line(1.8)}/><path d="M24 6L32 9L24 12Z" fill="#ffe070" ${line(1.4)}/>
    ${sparkle(6, 30, 2.4, LIGHT)}${sparkle(43, 28, 2.4, LIGHT)}`,

  precognition: `<defs>${linear('h', [[0, '#f4ecd8'], [1, '#c8a060']])}</defs>
    <path d="M10 4H38M10 44H38" ${line(3)}/>
    <path d="M12 4C12 16 22 18 22 24C22 30 12 32 12 44H36C36 32 26 30 26 24C26 18 36 16 36 4Z" fill="#fff8fc" opacity="0.9" ${line(2.4)}/>
    <path d="M16 40C18 36 22 34 24 30C26 34 30 36 32 40Z" fill="${PINK}"/>
    ${eye(24, 13, 14)}`,

  'mind-break': `${brain(24, 24, 18)}
    <path d="M24 4L20 14L27 20L21 30L26 44" fill="none" ${line(3.4)}/><path d="M24 4L20 14L27 20L21 30L26 44" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${[[6, 8], [42, 10], [42, 40]].map(([x, y]) => `<polygon points="${x - 2},${y} ${x},${y - 2.4} ${x + 2},${y + 1.4}" fill="#ffb0e0" ${line(1.2)}/>`).join('')}`,

  'dream-world': `<defs>${linear('n', [[0, '#3a2a7a'], [1, '#8a4ac8']])}</defs>
    ${puffs([[14, 26, 9], [24, 20, 12], [34, 26, 9], [20, 32, 8], [30, 32, 8]], '#e0d0ff', '#fff')}
    <path d="M24 12A8 8 0 1 0 32 22A6 6 0 1 1 24 12Z" fill="#ffe070" ${line(2)}/>
    ${[[10, 8], [38, 8], [42, 18]].map(([x, y]) => `<polygon points="${star(x, y, 5, 3, 1.3)}" fill="#ffe070" ${line(1.2)}/>`).join('')}`,

  'psychic-dominance': `${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<path transform="rotate(${a} 24 24)" d="M24 3V9" stroke="${a % 60 ? PINK : '#ffe070'}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
    ${eye(24, 24, 32, '#e8203a')}`,

  'mind-storm': `${puffs([[12, 14, 7], [22, 9, 9], [33, 12, 8], [40, 18, 5.4], [18, 18, 6], [30, 18, 6]], '#7a4aa8', '#a070d0')}
    <path d="M22 22L16 34H23L18 46L32 28H25L30 22Z" fill="${PINK}" ${line(2.2)}/>
    ${[[8, 30], [40, 30], [36, 40]].map(([x, y]) => `<path d="M${x} ${y}l-1.6 4" stroke="#c890f0" stroke-width="2" stroke-linecap="round"/>`).join('')}`,

  'psychic-overload': `<defs>${radial('a', [[0, '#ffffff'], [0.5, '#fff3a0'], [1, '#ffb0e0']], '45%', '40%', '70%')}</defs>
    <polygon points="${star(24, 18, 12, 20, 15, -90)}" fill="${PINK}" opacity="0.6"/>
    <path d="M24 4C32 4 38 10 38 18C38 24 34 26 32 30V34H16V30C14 26 10 24 10 18C10 10 16 4 24 4Z" fill="url(#$a)" ${line(2.6)}/>
    <rect x="16" y="34" width="16" height="8" rx="2" fill="#a8b0c8" ${line(2.2)}/><path d="M16 38H32" stroke="${INK}" stroke-width="1.2"/>
    <path d="M20 24L24 16L28 24" fill="none" stroke="#ff8a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${shine(15, 16, 18, 10)}`,

  'mind-control': `<defs>${psi}</defs>
    <path d="M8 6H40M24 2V10" ${line(5.4)}/><path d="M8 6H40M24 2V10" stroke="#c88a4a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M10 6L16 30M24 10V22M38 6L32 30" stroke="${INK}" stroke-width="1.2"/>
    <circle cx="24" cy="26" r="6" fill="url(#$p)" ${line(2.2)}/>
    <path d="M24 32V40M24 34L16 30M24 34L32 30M24 40L18 46M24 40L30 46" fill="none" ${line(4.4)}/>
    <path d="M24 32V40M24 34L16 30M24 34L32 30M24 40L18 46M24 40L30 46" fill="none" stroke="#e0a0f0" stroke-width="2" stroke-linecap="round"/>
    <circle cx="22" cy="25" r="1" fill="#fff"/><circle cx="26" cy="25" r="1" fill="#fff"/>`,

  'psycho-shift': `${arrow('M10 18A15 15 0 0 1 38 16', 39, 19, 70, PINK)}${arrow('M38 30A15 15 0 0 1 10 32', 9, 29, -110, VIOLET)}
    ${sparkle(24, 24, 4, '#ffe070')}`,

  'mind-over-matter': `<defs>${orb}</defs>
    ${[0, 60, 120].map((a, i) => `<ellipse cx="24" cy="24" rx="20" ry="7" transform="rotate(${a} 24 24)" fill="none" ${line(3.6)}/><ellipse cx="24" cy="24" rx="20" ry="7" transform="rotate(${a} 24 24)" fill="none" stroke="${[PINK, VIOLET, '#5ad8ff'][i]}" stroke-width="1.6"/>`).join('')}
    <circle cx="24" cy="24" r="6" fill="url(#$o)" ${line(2)}/>
    ${[[44, 24], [14, 6.6], [14, 41.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#ffe070" ${line(1.2)}/>`).join('')}`,

  'psychic-reflection': `<defs>${linear('a', [[0, '#ffffff'], [0.5, '#ffd8f4'], [1, '#c070e0']], 1, 1)}</defs>
    <polygon points="24,4 40,24 24,44 8,24" fill="url(#$a)" ${line(2.6)}/>
    ${shine(15, 22, 22, 13, 2.4)}${shine(18, 30, 30, 16, 1.4)}
    ${arrow('M46 8L36 16', 34, 18, 140, '#ff6a8a')}`,

  'mind-lance': `<defs>${linear('a', [[0, '#ffffff'], [1, '#e070e0']], 1, 0)}</defs>
    <path d="M6 42L32 16" ${line(5.6)}/><path d="M6 42L32 16" stroke="#c890f0" stroke-width="3" stroke-linecap="round"/>
    <path d="M44 4L38 22L30 14Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M42 6L37 17" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M27 20L22 16M30 23L28 28" ${line(2)}/>
    ${sparkle(12, 12, 2.8, LIGHT)}${sparkle(38, 36, 2.4, LIGHT)}`,

  'psycho-break': `<polygon points="${star(24, 24, 9, 22, 9, -90)}" fill="${PINK}" ${line(2.4)}/>
    <path d="M24 2L22 14M24 24L14 30M24 24L36 32M24 24L20 46M24 24L44 16M22 14L24 24" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    <polygon points="${star(24, 24, 9, 12, 6, -70)}" fill="#fff" opacity="0.6"/>
    ${[[6, 6], [42, 42], [44, 6]].map(([x, y]) => `<polygon points="${x - 2.4},${y} ${x},${y - 2.6} ${x + 2.4},${y + 1.6}" fill="${PINK}" ${line(1.2)}/>`).join('')}`,

  mindstorm: `<defs>${psi}</defs>
    <path d="M6 6C14 3 34 3 42 6C40 12 33 16 31 22C29 28 27 34 26 44H22C21 36 19 30 16 24C13 18 8 12 6 6Z" fill="url(#$p)" opacity="0.85" ${line(2.4)}/>
    <path d="M10 8.6C18 12 30 12 38 8.6M14 16C20 19 28 19 34 16M18 25C21 27 26 27 30 25" stroke="#ffe0f8" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${brain(24, 12, 8)}`,

  'absolute-barrier': `<defs>${psi}</defs>
    <polygon points="${hex(24, 24, 22)}" fill="none" ${line(2.4)} stroke-dasharray="4 2"/>
    <polygon points="${hex(24, 24, 18)}" fill="url(#$p)" ${line(2.6)}/>
    <polygon points="${hex(24, 24, 12)}" fill="#fff" fill-opacity="0.25" stroke="#fff" stroke-width="1.4"/>
    ${lock(24, 25, 0.9, '#ffe070')}`,

  'psycho-annihilation': `<defs>${radial('a', [[0, '#1a0a2a'], [0.3, '#5a1a8a'], [0.7, '#e070e0'], [1, '#ffd0f4']])}</defs>
    <polygon points="${star(24, 24, 16, 23, 14, -90)}" fill="${PINK}" ${line(2.2)}/>
    <circle cx="24" cy="24" r="14" fill="url(#$a)" ${line(2.4)}/>
    ${eye(24, 24, 16, '#e8203a')}
    ${[[4, 4], [44, 6], [44, 44], [4, 42]].map(([x, y]) => `<polygon points="${x - 2},${y} ${x},${y - 2.4} ${x + 2},${y + 1.4}" fill="#c890f0" ${line(1.2)}/>`).join('')}`,
};

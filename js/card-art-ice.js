/* ============================================================
   card-art-ice.js  -  Ice's cards (the Safari's duo pool,
   docs/duo-design.md section 5) and its Icicle token, in the
   smooth card art's style (48x48, dark outline; see card-art.js).
   ============================================================ */

import { INK, f, line, star, sparkle, radial, linear, fist, speed, thermo } from './card-art-kit.js';

const frost = linear('i', [[0, '#ffffff'], [0.45, '#c8f2ff'], [1, '#58b8e8']], 0.4, 1);
const glow = radial('g', [[0, '#fff'], [0.45, '#d8f8ff'], [1, '#78d0f0']]);

/** A six-armed snowflake on (cx, cy), radius r. */
const flake = (cx, cy, r, rot = 0, fill = '#fff') => {
  const arms = [0, 60, 120].map(a => {
    const t = ((a + rot) * Math.PI) / 180, dx = Math.cos(t) * r, dy = Math.sin(t) * r;
    return `M${f(cx - dx)} ${f(cy - dy)}L${f(cx + dx)} ${f(cy + dy)}`;
  }).join('');
  const twigs = [0, 60, 120, 180, 240, 300].map(a => {
    const t = ((a + rot) * Math.PI) / 180, k = r * 0.58, bx = cx + Math.cos(t) * k, by = cy + Math.sin(t) * k, s = r * 0.32;
    const l = t + 2.4, rr = t - 2.4;
    return `M${f(bx + Math.cos(l) * s)} ${f(by + Math.sin(l) * s)}L${f(bx)} ${f(by)}L${f(bx + Math.cos(rr) * s)} ${f(by + Math.sin(rr) * s)}`;
  }).join('');
  return `<path d="${arms}${twigs}" fill="none" ${line(Math.max(2, r * 0.32))}/>
    <path d="${arms}${twigs}" fill="none" stroke="${fill}" stroke-width="${f(Math.max(0.9, r * 0.14))}" stroke-linecap="round" stroke-linejoin="round"/>`;
};
/** An icicle: its base at (x, y), pointing along `rot` (0 = down), `len` long and `w` wide. */
const icicle = (x, y, len, w, rot = 0, fill = 'url(#$i)') => `<g transform="translate(${x} ${y}) rotate(${rot})">
    <path d="M${-w / 2} 0H${w / 2}L0 ${len}Z" fill="${fill}" ${line(2.2)}/>
    <path d="M${f(-w / 4)} 2L${f(-w / 12)} ${f(len * 0.6)}" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/></g>`;
/** A cut crystal (a long hexagon) on (cx, cy), `h` tall. */
const crystal = (cx, cy, h, w, rot = 0, fill = 'url(#$i)') => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    <path d="M0 ${-h / 2}L${w / 2} ${-h / 4}V${h / 4}L0 ${h / 2}L${-w / 2} ${h / 4}V${-h / 4}Z" fill="${fill}" ${line(2.2)}/>
    <path d="M0 ${-h / 2}V${h / 2}M${-w / 2} ${-h / 4}L0 0L${w / 2} ${-h / 4}" fill="none" stroke="#fff" stroke-width="1" opacity="0.75"/></g>`;
const cloud = (x, y, s = 1, fill = '#b8c8e0') => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-14 6A6 6 0 0 1 -10 -4A8 8 0 0 1 4 -8A7 7 0 0 1 14 0A6 6 0 0 1 12 8H-10A5 5 0 0 1 -14 6Z" fill="${fill}" ${line(2.4 / s)}/>
    <path d="M-8 -3A6 6 0 0 1 2 -6" stroke="#fff" stroke-width="${f(1.4 / s)}" fill="none" opacity="0.7" stroke-linecap="round"/></g>`;
/** A heater shield centred on (x, y), `s` its scale. */
const shield = (x, y, s = 1, fill = 'url(#$i)') => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 -12L11 -8V0C11 7 6 11 0 14C-6 11 -11 7 -11 0V-8Z" fill="${fill}" ${line(2.4 / s)}/>
    <path d="M0 -9L8 -6V0C8 5 4.6 8 0 10.4" fill="none" stroke="#fff" stroke-width="${f(1.3 / s)}" opacity="0.8"/></g>`;
/** Hailstones and snow: [x, y, r]. */
const stones = (list, fill = '#e8f8ff') => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${line(Math.min(1.8, r * 0.7))}/>`).join('');
/** A gust: a curl of wind from (x, y), `len` long. */
const gust = (x, y, len, curl = 5) => {
  const d = `M${x} ${y}H${x + len}A${curl} ${curl} 0 1 0 ${x + len - curl} ${y - curl * 1.4}`;
  return `<path d="${d}" fill="none" ${line(4.2)}/><path d="${d}" fill="none" stroke="#d8f6ff" stroke-width="2" stroke-linecap="round"/>`;
};
/** A snowy peak: its foot from x0 to x1 on y, its top at (tx, ty). */
const peak = (x0, x1, y, tx, ty, fill = '#7a8aa8') => `<path d="M${x0} ${y}L${tx} ${ty}L${x1} ${y}Z" fill="${fill}" ${line(2.4)}/>
    <path d="M${f(tx - (tx - x0) * 0.35)} ${f(ty + (y - ty) * 0.35)}L${tx} ${ty}L${f(tx + (x1 - tx) * 0.35)} ${f(ty + (y - ty) * 0.35)}L${f(tx + (x1 - tx) * 0.12)} ${f(ty + (y - ty) * 0.28)}L${f(tx - (tx - x0) * 0.1)} ${f(ty + (y - ty) * 0.4)}Z" fill="#fff" ${line(1.6)}/>`;

export const ICE = {
  'powder-snow': `<defs>${frost}</defs>
    ${cloud(24, 14, 1.15)}
    ${flake(13, 34, 5)}${flake(30, 38, 4, 20)}
    ${stones([[22, 28, 1.6], [38, 28, 1.6], [20, 42, 1.4], [40, 40, 1.3]], '#fff')}`,

  'frost-shield': `<defs>${frost}</defs>
    ${shield(24, 23, 1.45)}
    ${flake(24, 23, 7)}`,

  'icy-wind': `<defs>${frost}</defs>
    ${gust(5, 18, 24, 6)}${gust(9, 30, 26, 5)}${gust(4, 40, 18, 4)}
    ${flake(38, 12, 4.6)}${flake(41, 36, 3.6, 15)}`,

  'frost-armor': `<defs>${frost}</defs>
    <path d="M12 10L18 7H30L36 10L40 20L34 22V40H14V22L8 20Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M18 7C19 12 29 12 30 7" fill="none" ${line(2)}/>
    <path d="M24 14V38M14 26H34" stroke="#fff" stroke-width="1.3" opacity="0.7"/>
    ${crystal(24, 27, 12, 8)}
    ${sparkle(40, 36, 3)}`,

  'ice-fang': `<defs>${frost}</defs>
    <path d="M8 12C14 8 34 8 40 12C38 16 34 18 30 18L27 38L24 22L21 38L18 18C14 18 10 16 8 12Z" fill="#f4fbff" ${line(2.4)}/>
    <path d="M19 19L21 33M27 20L28 32" stroke="#8ad8f4" stroke-width="1.6" stroke-linecap="round"/>
    ${flake(38, 34, 5)}${flake(9, 32, 3.4, 20)}`,

  'ice-shard': `<defs>${frost}</defs>
    ${crystal(24, 24, 32, 11, 35)}
    ${sparkle(36, 10, 3)}${sparkle(11, 38, 2.4)}`,

  'icicle-spear': `<defs>${frost}</defs>
    ${icicle(8, 13, 30, 7, -90)}${icicle(6, 25, 34, 7, -90)}${icicle(10, 37, 28, 7, -90)}
    ${speed(6, [8, 20, 32], 0)}`,

  'ice-spinner': `<defs>${frost}</defs>
    <path d="M10 22A14 6 0 0 1 38 22" fill="none" stroke="#a8ecff" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M12 18L24 8L36 18L24 42Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M12 18H36M24 8V42" stroke="#fff" stroke-width="1.2" opacity="0.8"/>
    <path d="M8 30A16 6 0 0 0 40 30" fill="none" ${line(3.6)}/>
    <path d="M8 30A16 6 0 0 0 40 30" fill="none" stroke="#a8ecff" stroke-width="1.8" stroke-linecap="round"/>`,

  hail: `<defs>${frost}</defs>
    ${cloud(24, 13, 1.2, '#8a9ab8')}
    ${stones([[13, 29, 3], [25, 33, 3.4], [36, 28, 2.8], [18, 41, 2.6], [32, 42, 3]])}
    <path d="M11 24L13 26M23 26L25 29M34 23L36 25" stroke="#d8f6ff" stroke-width="1.6" stroke-linecap="round"/>`,

  'aurora-veil': `<defs>${frost}</defs>
    <path d="M4 30C10 12 18 22 24 10C30 22 38 12 44 30" fill="none" stroke="#7af0b0" stroke-width="5" stroke-linecap="round" opacity="0.75"/>
    <path d="M4 34C10 18 18 28 24 16C30 28 38 18 44 34" fill="none" stroke="#a080f0" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    ${shield(24, 32, 0.95)}`,

  'frost-breath': `<defs>${glow}</defs>
    <path d="M4 18C10 12 16 14 18 20C16 26 10 28 4 24" fill="#f8d0b8" ${line(2.4)}/>
    <ellipse cx="17" cy="21" rx="2.4" ry="3.4" fill="${INK}"/>
    <circle cx="27" cy="20" r="5" fill="url(#$g)" ${line(2)}/><circle cx="35" cy="17" r="6" fill="url(#$g)" ${line(2)}/>
    <circle cx="33" cy="28" r="5" fill="url(#$g)" ${line(2)}/>
    ${flake(40, 38, 4.4)}${flake(24, 36, 3.4, 15)}`,

  'ice-beam': `<defs>${frost}${glow}</defs>
    <path d="M4 34L36 14" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M4 34L36 14" stroke="#a8ecff" stroke-width="6.4" stroke-linecap="round"/>
    <path d="M6 32L34 15" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <polygon points="${star(37, 13, 6, 9, 4)}" fill="url(#$g)" ${line(2)}/>
    ${flake(14, 14, 4)}`,

  'freeze-dry': `<defs>${frost}</defs>
    <path d="M10 18L24 11L38 18V34L24 41L10 34Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M10 18L24 25L38 18M24 25V41" fill="none" ${line(1.8)}/>
    <path d="M14 21L20 24" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
    ${flake(31, 30, 4.4)}${flake(17, 31, 3, 20)}`,

  'cold-snap': `<defs>${frost}</defs>
    ${thermo(14, 6, 32, 0.15, '#58b8e8')}
    ${flake(32, 18, 8)}
    ${stones([[30, 36, 1.8], [38, 32, 1.4], [40, 40, 1.6]], '#fff')}`,

  'ice-punch': `<defs>${frost}</defs>
    ${fist(26, 24, 1.05, 0, '#b8eaff', '#58b8e8')}
    ${icicle(8, 12, 9, 5, -60)}${icicle(8, 36, 9, 5, -120)}
    ${speed(12, [20, 26, 32])}`,

  'icicle-crash': `<defs>${frost}</defs>
    <path d="M6 41H42" ${line(3)}/>
    ${icicle(24, 3, 34, 14)}
    <path d="M18 41L14 36M30 41L34 35M24 41V44" ${line(2)}/>
    ${stones([[11, 32, 1.6], [37, 30, 1.8]], '#d8f6ff')}`,

  'snow-flurry': `<defs>${frost}</defs>
    ${flake(14, 14, 7)}${flake(33, 13, 5, 20)}${flake(24, 29, 8, 10)}${flake(10, 38, 4.6, 30)}${flake(38, 37, 5.4)}`,

  refrigerate: `<defs>${frost}</defs>
    <rect x="12" y="5" width="24" height="38" rx="3" fill="#eef6fc" ${line(2.4)}/>
    <path d="M12 18H36" ${line(2)}/>
    <path d="M16 10V14M16 22V30" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    ${flake(27, 30, 5.4)}
    <path d="M30 9L33 10" stroke="#a8ecff" stroke-width="1.6" stroke-linecap="round"/>`,

  blizzard: `<defs>${frost}</defs>
    ${cloud(24, 11, 1.2, '#7888a8')}
    <path d="M10 26C18 22 26 34 36 26M8 36C16 32 26 44 40 34" fill="none" ${line(4)}/>
    <path d="M10 26C18 22 26 34 36 26M8 36C16 32 26 44 40 34" fill="none" stroke="#e0f8ff" stroke-width="2" stroke-linecap="round"/>
    ${flake(39, 22, 3.6)}${flake(19, 31, 3.2, 20)}${flake(29, 42, 3)}`,

  'weather-ball': `<defs>${glow}</defs>
    <circle cx="24" cy="24" r="17" fill="#ffe070" ${line(2.4)}/>
    <path d="M24 7A17 17 0 0 1 24 41Z" fill="#a8ecff"/>
    <path d="M7 24H41M24 7V41" stroke="${INK}" stroke-width="2"/>
    <circle cx="24" cy="24" r="17" fill="none" ${line(2.4)}/>
    ${flake(32, 16, 4)}
    <circle cx="16" cy="32" r="3.4" fill="#ff9a30" ${line(1.4)}/>`,

  'slush-rush': `<defs>${frost}</defs>
    <path d="M6 36L40 22" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M6 36L40 22" stroke="#4aa0e0" stroke-width="4" stroke-linecap="round"/>
    <path d="M4 40C12 44 20 42 26 38" fill="none" stroke="#e8f8ff" stroke-width="3" stroke-linecap="round"/>
    ${speed(14, [12, 18, 24], 9)}
    ${stones([[32, 38, 1.8], [38, 34, 1.4], [26, 43, 1.6]], '#fff')}`,

  'ice-body': `<defs>${frost}</defs>
    <circle cx="24" cy="34" r="10" fill="#f4fbff" ${line(2.4)}/>
    <circle cx="24" cy="17" r="7.4" fill="#f4fbff" ${line(2.4)}/>
    <circle cx="21.4" cy="15.6" r="1.2" fill="${INK}"/><circle cx="26.6" cy="15.6" r="1.2" fill="${INK}"/>
    <path d="M24 18L29 19.4L24 20Z" fill="#ff9a30" ${line(1)}/>
    <path d="M17 9H31L29 4H19Z" fill="#4aa0e0" ${line(2)}/>
    <circle cx="24" cy="31" r="1.3" fill="${INK}"/><circle cx="24" cy="36" r="1.3" fill="${INK}"/>
    ${sparkle(40, 12, 3)}`,

  snowscape: `<defs>${frost}</defs>
    ${peak(2, 30, 42, 16, 12)}${peak(18, 46, 42, 33, 18, '#8898b8')}
    ${stones([[8, 10, 1.4], [26, 8, 1.6], [42, 8, 1.4], [38, 30, 1.2]], '#fff')}`,

  hailstone: `<defs>${glow}</defs>
    <circle cx="24" cy="24" r="14" fill="url(#$g)" ${line(2.4)}/>
    <path d="M17 18A8 8 0 0 1 24 14" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M18 28L22 25L26 29M28 20L31 22" fill="none" stroke="#58b8e8" stroke-width="1.4" stroke-linecap="round"/>
    ${speed(9, [10, 16], 6)}`,

  'sheer-cold': `<defs>${glow}</defs>
    <circle cx="24" cy="24" r="19" fill="url(#$g)" opacity="0.65"/>
    ${flake(24, 24, 16)}
    <path d="M30 6L27 13L32 16L28 24" fill="none" ${line(2.2)}/>`,

  permafrost: `<defs>${frost}</defs>
    <path d="M3 22H45V44H3Z" fill="#8a6a48" ${line(2.4)}/>
    <path d="M3 30H45V44H3Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M10 36L14 33L18 36M28 38L33 34L37 38" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
    ${peak(12, 36, 22, 24, 8)}`,

  glaciate: `<defs>${frost}</defs>
    <path d="M3 42L10 24L18 30L24 14L32 26L38 18L45 42Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M10 24L14 42M24 14L22 42M38 18L36 42" stroke="#fff" stroke-width="1.2" opacity="0.8"/>
    ${sparkle(10, 9, 3)}${sparkle(40, 8, 2.6)}`,

  'snow-cloak': `<defs>${frost}</defs>
    <path d="M24 6C18 6 14 10 14 14L8 40C14 44 34 44 40 40L34 14C34 10 30 6 24 6Z" fill="#e8f4fc" ${line(2.4)}/>
    <path d="M18 14C20 18 28 18 30 14" fill="none" ${line(2)}/>
    <path d="M24 18V42" stroke="#a8d8f0" stroke-width="1.6"/>
    ${flake(17, 31, 3.6)}${flake(31, 33, 3.6, 20)}`,

  'mountain-gale': `<defs>${frost}</defs>
    ${peak(4, 44, 44, 24, 10)}
    ${gust(2, 22, 20, 4)}${gust(24, 32, 18, 4)}`,

  'ice-age': `<defs>${frost}</defs>
    <path d="M10 14C6 28 14 40 26 38" fill="none" ${line(6)}/>
    <path d="M10 14C6 28 14 40 26 38" fill="none" stroke="#fff4dc" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M22 10C18 24 26 34 38 32" fill="none" ${line(6)}/>
    <path d="M22 10C18 24 26 34 38 32" fill="none" stroke="#fff4dc" stroke-width="3.4" stroke-linecap="round"/>
    ${flake(38, 12, 5)}`,

  'aurora-beam': `<defs>${frost}</defs>
    <path d="M4 36L40 12" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M4 36L40 12" stroke="#ff8ab0" stroke-width="8" stroke-linecap="round"/>
    <path d="M4 36L40 12" stroke="#ffe070" stroke-width="5" stroke-linecap="round"/>
    <path d="M4 36L40 12" stroke="#8af0c0" stroke-width="2.4" stroke-linecap="round"/>
    ${flake(36, 34, 4.6)}${sparkle(12, 12, 3)}`,

  'ice-ball': `<defs>${glow}</defs>
    <circle cx="27" cy="26" r="14" fill="url(#$g)" ${line(2.4)}/>
    <path d="M20 18C24 22 30 20 34 16M18 30C24 34 32 32 38 28" fill="none" stroke="#88c8e8" stroke-width="1.6" stroke-linecap="round"/>
    ${speed(12, [18, 26, 34])}`,

  avalanche: `<defs>${frost}</defs>
    <path d="M4 10L44 42H4Z" fill="#8898b8" ${line(2.4)}/>
    ${stones([[14, 18, 4], [22, 26, 5], [32, 34, 4.4], [12, 32, 3]], '#f4fbff')}`,

  'ice-hammer': `<defs>${frost}</defs>
    <path d="M27 20L12 42" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/>
    <path d="M27 20L12 42" stroke="#a87048" stroke-width="3.4" stroke-linecap="round"/>
    ${crystal(30, 15, 26, 13, 55)}`,

  'glacial-lance': `<defs>${frost}</defs>
    <path d="M6 42L28 20" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M6 42L28 20" stroke="#7a8aa8" stroke-width="3" stroke-linecap="round"/>
    <path d="M26 16L44 4L32 22Z" fill="url(#$i)" ${line(2.2)}/>
    <path d="M22 18L30 26" ${line(3)}/>
    ${flake(12, 14, 4.4)}`,

  'triple-axel': `<defs>${frost}</defs>
    <path d="M10 34H36C38 34 40 32 40 30L38 22H14Z" fill="#f4f4f8" ${line(2.4)}/>
    <path d="M8 40H40" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M8 40H40" stroke="#c8d0e0" stroke-width="2" stroke-linecap="round"/>
    <path d="M14 22V12H26V22" fill="#f4f4f8" ${line(2.4)}/>
    <path d="M30 12A8 4 0 1 1 30 6M34 18A6 3 0 1 1 34 14" fill="none" stroke="#a8ecff" stroke-width="2" stroke-linecap="round"/>`,

  'freeze-shock': `<defs>${frost}</defs>
    ${crystal(22, 26, 32, 18)}
    <path d="M30 4L22 20H30L20 40" fill="none" ${line(4.6)}/>
    <path d="M30 4L22 20H30L20 40" fill="none" stroke="#ffe040" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,

  'subzero-slammer': `<defs>${glow}</defs>
    <polygon points="${star(24, 26, 9, 20, 9)}" fill="url(#$g)" ${line(2.4)}/>
    ${fist(24, 24, 0.9, 30, '#b8eaff', '#58b8e8')}
    ${flake(40, 9, 4)}`,

  icicle: `<defs>${frost}</defs>
    ${icicle(24, 6, 36, 12)}`,
};

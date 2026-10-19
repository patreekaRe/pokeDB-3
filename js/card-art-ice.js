/* ============================================================
   card-art-ice.js  -  Ice's cards (the Safari's duo pool,
   docs/duo-design.md section 5) and its Icicle token, in the
   smooth card art's style (48x48, dark outline; see card-art.js).
   ============================================================ */

import { INK, f, line, star, sparkle, radial, linear, fist, speed, thermo, tube, sine, spiral, drop, boot, puffs } from './card-art-kit.js';

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

/** Slanted sleet streaks, [x0, y0, x1, y1] each, a pellet at each end. */
const streaks = (list) => {
  const d = list.map(([a, b, c, e]) => `M${a} ${b}L${c} ${e}`).join('');
  return `<path d="${d}" fill="none" ${line(2.8)}/><path d="${d}" fill="none" stroke="#d8f6ff" stroke-width="1.2" stroke-linecap="round"/>`
    + stones(list.map(([, , c, e]) => [c, e, 1.5]), '#fff');
};
/** Frost needles bristling both sides of a twig from (x0, y0) to (x1, y1), n pairs, `len` long. */
const fringe = (x0, y0, x1, y1, n, len) => {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  let d = '';
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), x = x0 + dx * t, y = y0 + dy * t;
    for (const s of [1, -1]) d += `M${f(x)} ${f(y)}L${f(x + (-uy * s * 0.9 + ux * 0.45) * len)} ${f(y + (ux * s * 0.9 + uy * 0.45) * len)}`;
  }
  return `<path d="${d}" fill="none" ${line(2.4)}/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>`;
};
/** A weather map's cold front from (x0, y0) to (x1, y1), its n triangles on the side it moves to. */
const front = (x0, y0, x1, y1, n) => {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
  const tris = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = x0 + dx * t, y = y0 + dy * t;
    tris.push(`${f(x - ux * 4)},${f(y - uy * 4)} ${f(x + nx * 7)},${f(y + ny * 7)} ${f(x + ux * 4)},${f(y + uy * 4)}`);
  }
  return tris.map(p => `<polygon points="${p}" fill="#4a98f0" ${line(1.8)}/>`).join('')
    + `<path d="M${x0} ${y0}L${x1} ${y1}" ${line(5.2)}/><path d="M${x0} ${y0}L${x1} ${y1}" stroke="#2a78d8" stroke-width="2.6" stroke-linecap="round"/>`;
};
/** A frosty arrow round (cx, cy) at radius r, clockwise from a0 to a1 degrees, its head at a1. */
const turn = (cx, cy, r, a0, a1) => {
  const rad = (a) => (a * Math.PI) / 180, p = (a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
  const [sx, sy] = p(a0), [ex, ey] = p(a1), tx = -Math.sin(rad(a1)), ty = Math.cos(rad(a1)), nx = Math.cos(rad(a1)), ny = Math.sin(rad(a1));
  const head = `${f(ex + tx * 6)},${f(ey + ty * 6)} ${f(ex + nx * 5.4)},${f(ey + ny * 5.4)} ${f(ex - nx * 5.4)},${f(ey - ny * 5.4)}`;
  return tube(`M${f(sx)} ${f(sy)}A${r} ${r} 0 0 1 ${f(ex)} ${f(ey)}`, 4.2, '#88d4f4', '#fff')
    + `<polygon points="${head}" fill="#88d4f4" ${line(2)}/>`;
};
/** Shards flying out from (cx, cy): [angle, distance, size] each, pointing outward. */
const burst = (cx, cy, list) => list.map(([a, d, s]) => {
  const t = (a * Math.PI) / 180;
  return `<g transform="translate(${f(cx + Math.cos(t) * d)} ${f(cy + Math.sin(t) * d)}) rotate(${a + 90})">
    <path d="M0 ${-s}L${f(s * 0.62)} ${f(s * 0.5)}L${f(-s * 0.5)} ${f(s * 0.7)}Z" fill="url(#$i)" ${line(1.8)}/>
    <path d="M0 ${f(-s * 0.6)}L${f(-s * 0.16)} ${f(s * 0.3)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/></g>`;
}).join('');
const dark = linear('k', [[0, '#6a7ca0'], [0.5, '#2a3450'], [1, '#121828']], 0.3, 1);
const deep = radial('d', [[0, '#5a88e8'], [0.6, '#1c3a8a'], [1, '#0a1238']]);

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

  'ice-pellet': `<defs>${glow}${frost}</defs>
    ${speed(17, [14, 20, 26], 8)}
    <circle cx="25" cy="20" r="7" fill="url(#$g)" ${line(2.2)}/>
    <path d="M21.4 17.6A4 4 0 0 1 25 15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M24 23L27 21" stroke="#58b8e8" stroke-width="1.2" stroke-linecap="round"/>
    ${icicle(36, 28, 16, 8)}`,

  'icicle-guard': `<defs>${frost}</defs>
    ${shield(24, 26, 1.3, '#88c4ea')}
    ${icicle(16, 13.4, 14, 5.6)}${icicle(24, 10.4, 19, 7)}${icicle(32, 13.4, 14, 5.6)}`,

  'freezing-glare': `<defs>${frost}</defs>
    <path d="M10 29L4 44H20ZM38 29L28 44H44Z" fill="#a8ecff" opacity="0.55"/>
    <path d="M4 24C9 16 19 16 22.5 24C19 31 9 31 4 24ZM25.5 24C29 16 39 16 44 24C39 31 29 31 25.5 24Z" fill="#fff" ${line(2.2)}/>
    <circle cx="14" cy="24" r="4.6" fill="#58c8f0" ${line(1.6)}/><circle cx="34" cy="24" r="4.6" fill="#58c8f0" ${line(1.6)}/>
    ${flake(14, 24, 3)}${flake(34, 24, 3)}
    <path d="M3 13L21 19M45 13L27 19" ${line(3.6)}/>
    ${sparkle(24, 8, 3)}`,

  'cold-shoulder': `<defs>${frost}</defs>
    <g transform="rotate(-12 24 30)">
    ${icicle(12, 36, 8, 5)}${icicle(20, 36, 11, 5)}${icicle(28, 36, 9, 5)}${icicle(36, 36, 7, 4.4)}
    <path d="M8 29A16 16 0 0 1 40 29Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M12 24A12 12 0 0 1 20 16" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M5 29H43L41 37H7Z" fill="#88c4ea" ${line(2.4)}/>
    <circle cx="10" cy="33" r="1.4" fill="${INK}"/><circle cx="38" cy="33" r="1.4" fill="${INK}"/>
    ${flake(26, 21, 5)}</g>`,

  'frost-nip': `<defs>${frost}</defs>
    ${tube('M4 44L14 32', 5, '#88c4ea', '#fff')}
    <path d="M13 31C12 17 24 7 41 11C35 14 29 18 25 26Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M16 34C23 40 34 39 41 29C34 30 28 29 23 27Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M27 19L30 21M31 15L33 18M30 32L32 30" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="15" cy="32" r="5" fill="#88c4ea" ${line(2.2)}/>
    ${sparkle(37, 21, 3.6)}${flake(8, 14, 4)}`,

  'ice-wall': `<defs>${frost}</defs>
    <path d="M4 16H44V42H4Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M4 25H44M4 34H44M15 16V25M31 16V25M8 25V34M23 25V34M38 25V34M15 34V42M31 34V42" stroke="${INK}" stroke-width="1.6"/>
    <path d="M7 28H12M26 28H32M18 37H25" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.9"/>
    <path d="M3 18C3 12 8 11 12 12.4C16 9 22 10 25 12.4C29 9 36 10 38.6 12.4C42 11 45 13 45 18Z" fill="#fff" ${line(2)}/>
    ${sparkle(40, 6, 3)}`,

  'chilly-reception': `<defs>${frost}</defs>
    ${cloud(24, 11, 1.05)}
    ${flake(14, 26, 3.2)}${flake(30, 25, 3, 20)}${flake(40, 30, 2.6, 10)}
    <path d="M8 44L13 34H35L40 44Z" fill="#c0844a" ${line(2.4)}/>
    <path d="M12 39H36" stroke="#8a5a30" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 44L9 46.4M15 44L14.6 46.4M20 44V46.4M25 44V46.4M30 44L30.4 46.4M35 44L36 46.4" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
    ${stones([[20, 36.8, 1.6], [28, 37.4, 1.3], [24, 41.4, 1.2]], '#fff')}`,

  snowdrift: `<defs>${frost}</defs>
    <rect x="10" y="17" width="5" height="18" rx="1" fill="#a87048" ${line(2)}/>
    <rect x="21" y="13" width="5" height="18" rx="1" fill="#a87048" ${line(2)}/>
    <path d="M3 43C6 33 14 27 26 25C34 23.6 41 25 44 28C41 28 38 29.4 37 32C39 35 43 39 45 43Z" fill="#f4fbff" ${line(2.4)}/>
    <path d="M9 39C15 34 23 31 31 31" fill="none" stroke="#c8e4f6" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M37.6 33C39 35.4 41 37.6 42.6 40" fill="none" stroke="#a8d0ec" stroke-width="1.8" stroke-linecap="round"/>
    ${gust(28, 13, 12, 3.6)}
    ${stones([[36, 6, 1.4], [8, 9, 1.3], [44, 16, 1.2]], '#fff')}`,

  sleet: `<defs>${frost}</defs>
    ${cloud(24, 12, 1.2, '#8a9ab8')}
    ${streaks([[14, 24, 10, 33], [25, 25, 21, 34], [36, 24, 32, 33], [19, 35, 15, 44], [31, 36, 27, 44], [42, 32, 39, 39]])}`,

  'black-ice': `<defs>${dark}</defs>
    <ellipse cx="24" cy="38" rx="21" ry="7.4" fill="url(#$k)" ${line(2.4)}/>
    <path d="M9 37C15 34 25 33.4 32 34.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>
    <path d="M30 41L40 39" stroke="#8aa0c8" stroke-width="1.2" stroke-linecap="round"/>
    ${sparkle(38, 35, 2.6)}
    ${boot(22, 22, 0.95, -35, '#4aa0e0')}
    <path d="M36 9A10 10 0 0 1 42 20M6 26A10 10 0 0 1 8 16" fill="none" ${line(2)}/>`,

  'ice-scales': `<defs>${frost}</defs>
    ${[0, 1].map(m => `<g${m ? ' transform="translate(48 0) scale(-1 1)"' : ''}>
      <path d="M24 21C28 9 38 5 44 9C46 16 40 24 26 26Z" fill="#e8f8ff" ${line(2.2)}/>
      <path d="M25 28C34 28 41 33 39 40C35 44 28 38 25 31Z" fill="#c8eef8" ${line(2.2)}/>
      <path d="M30 16a2.2 2.2 0 0 0 4.4 0a2.2 2.2 0 0 0 4.4 0M28 21a2.2 2.2 0 0 0 4.4 0a2.2 2.2 0 0 0 4.4 0M29 32a2 2 0 0 0 4 0a2 2 0 0 0 4 0" fill="none" stroke="#58b8e8" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M25 13C27 8 29 6 32 5" fill="none" ${line(1.6)}/></g>`).join('')}
    <ellipse cx="24" cy="26" rx="3" ry="10" fill="#f4fbff" ${line(2)}/>
    ${sparkle(8, 42, 2.4)}${sparkle(41, 44, 2.4)}`,

  hoarfrost: `<defs>${frost}</defs>
    ${fringe(5, 41, 43, 14, 6, 5.4)}${fringe(20, 30, 15, 12, 3, 4.4)}
    ${tube('M5 41L43 14', 2.8, '#8a5a3a')}${tube('M20 30L15 12', 2, '#8a5a3a')}
    ${sparkle(38, 34, 3)}${sparkle(9, 10, 2.4)}`,

  'cold-front': `<defs>${frost}</defs>
    <rect x="3" y="6" width="42" height="36" rx="4" fill="#e4eef6" ${line(2.4)}/>
    <path d="M8 34C14 30 12 24 18 22M28 38C34 36 36 30 42 28" fill="none" stroke="#a8bcd0" stroke-width="1.3" stroke-linecap="round"/>
    ${front(7, 36, 41, 12, 4)}
    ${flake(13, 15, 4.6)}`,

  'numbing-cold': `<defs>${frost}</defs>
    <path d="M17 36V45H32V36" fill="#b8dcf0" ${line(2.2)}/>
    <rect x="13.5" y="10" width="5.4" height="18" rx="2.7" fill="#b8dcf0" ${line(2)}/>
    <rect x="19" y="6" width="5.4" height="20" rx="2.7" fill="#b8dcf0" ${line(2)}/>
    <rect x="24.5" y="7" width="5.4" height="19" rx="2.7" fill="#b8dcf0" ${line(2)}/>
    <rect x="30" y="11" width="5.2" height="16" rx="2.6" fill="#b8dcf0" ${line(2)}/>
    ${[[16.2, 12.6], [21.7, 8.6], [27.2, 9.6], [32.6, 13.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#fff"/>`).join('')}
    <rect x="13" y="20" width="23" height="18" rx="6" fill="#b8dcf0" ${line(2.2)}/>
    <rect x="6" y="22" width="5.4" height="14" rx="2.7" fill="#b8dcf0" transform="rotate(-38 9 34)" ${line(2)}/>
    <path d="M18 30C22 33 28 33 32 30" fill="none" stroke="#7aa8c8" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M40 8L43 11L40 14L43 17M40 22L43 25L40 28" fill="none" ${line(1.8)}/>
    ${flake(41, 38, 4)}`,

  'frost-barrier': `<defs>${frost}</defs>
    ${[[16, 12.3], [20, 10.5], [24, 10], [28, 10.5], [32, 12.3]].map(([x, y]) => icicle(x, y, f(43 - y), 4.6)).join('')}
    <path d="M10 27H38V31H10Z" fill="#88c4ea" ${line(1.8)}/>
    <path d="M5 44V18A19 15 0 0 1 43 18V44H36V19A12 9 0 0 0 12 19V44Z" fill="#8898b8" ${line(2.4)}/>
    <path d="M5 30H12M36 30H43M7 21L12 22M36 22L41 21" stroke="${INK}" stroke-width="1.3"/>
    <path d="M7 12C10 5 20 2 24 2.6C30 2 39 5 41 12C36 8 30 6 24 6.4C18 6 12 8 7 12Z" fill="#fff" ${line(1.8)}/>`,

  'ice-sheet': `<defs>${frost}</defs>
    <rect x="21" y="3" width="12" height="15" rx="2" fill="#fff" transform="rotate(14 27 10)" ${line(2)}/>
    <rect x="23.5" y="6" width="7" height="9" rx="1" fill="#a8ecff" transform="rotate(14 27 10)"/>
    <path d="M3 30L16 20H45L32 30Z" fill="url(#$i)" ${line(2.2)}/>
    <path d="M3 30H32V35H3Z" fill="#58b8e8" ${line(2.2)}/>
    <path d="M32 30L45 20V25L32 35Z" fill="#3a8cc4" ${line(2.2)}/>
    <path d="M12 27L18 23M20 27L24 24M30 26L33 24" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
    ${sparkle(9, 40, 2.6)}${sparkle(40, 40, 2.2)}`,

  igloo: `<defs>${frost}</defs>
    <path d="M2 41H46" ${line(2.6)}/>
    <path d="M5 40A19 19 0 0 1 43 40Z" fill="#f4fbff" ${line(2.4)}/>
    <path d="M7.6 32H40.4M12.6 25H35.4M14 32V40M34 32V40M18.6 25V32M29.4 25V32M24 21.2V25" stroke="#88b4d4" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M16 40V34A8 7 0 0 1 32 34V40Z" fill="#e4f2fc" ${line(2.2)}/>
    <path d="M19.6 40V36A4.4 4.4 0 0 1 28.4 36V40Z" fill="${INK}"/>
    <path d="M11 30A14 14 0 0 1 18 23" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
    ${flake(10, 11, 4)}${sparkle(39, 10, 3)}`,

  brinicle: `<defs>${frost}</defs>
    <rect x="3" y="6" width="42" height="39" rx="3" fill="#2a6ab0" ${line(2.4)}/>
    <path d="M3.6 39C10 36.4 18 38.4 24 37.6C30 36.8 38 38.6 44.4 37.6V43C44.4 44 44 44.4 43 44.4H5C4 44.4 3.6 44 3.6 43Z" fill="#c8b080"/>
    <path d="M3.6 39C10 36.4 18 38.4 24 37.6C30 36.8 38 38.6 44.4 37.6" fill="none" ${line(1.6)}/>
    ${icicle(24, 13, 26, 10, 0, '#d8f4ff')}
    <path d="M14 39L20 37.4L24 39L28 37.4L34 39" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 6H45V14H3Z" fill="url(#$i)" ${line(2.4)}/>
    <circle cx="12" cy="24" r="1.8" fill="none" stroke="#c8f2ff" stroke-width="1.2"/><circle cx="36" cy="29" r="2.2" fill="none" stroke="#c8f2ff" stroke-width="1.2"/>
    <circle cx="14" cy="31" r="1.2" fill="none" stroke="#c8f2ff" stroke-width="1.1"/><circle cx="38" cy="21" r="1.4" fill="none" stroke="#c8f2ff" stroke-width="1.1"/>`,

  'shard-storm': `<defs>${frost}</defs>
    ${tube('M24 7A17 17 0 0 1 41 24', 2, '#d8f6ff')}${tube('M24 41A17 17 0 0 1 7 24', 2, '#d8f6ff')}
    ${[20, 92, 164, 236, 308].map((a, i) => {
      const t = (a * Math.PI) / 180;
      return i === 2 ? icicle(f(24 + Math.cos(t) * 13), f(24 + Math.sin(t) * 13), 12, 6, a + 90) : crystal(f(24 + Math.cos(t) * 13), f(24 + Math.sin(t) * 13), 11, 6, a);
    }).join('')}
    ${flake(24, 24, 4.4)}`,

  refreeze: `<defs>${frost}</defs>
    ${turn(24, 24, 15, 200, 318)}${turn(24, 24, 15, 20, 138)}
    ${flake(24, 24, 6.4)}`,

  'snow-fort': `<defs>${frost}</defs>
    <path d="M8 21V5" ${line(2.4)}/>
    <path d="M8.6 5.6L18 9L8.6 12.4Z" fill="#4aa0e0" ${line(1.8)}/>
    <path d="M4 44V20H12V25H20V20H28V25H36V20H44V44Z" fill="#f4fbff" ${line(2.4)}/>
    <path d="M4 32H44M12 25V32M28 25V32M20 32V44M36 32V44M4 25H44" stroke="#a8c8e0" stroke-width="1.3"/>
    ${stones([[28, 41, 2.9], [34, 41, 2.9], [40, 41, 2.9], [31, 36, 2.9], [37, 36, 2.9], [34, 31, 2.9]], '#fff')}`,

  whiteout: `<defs>${glow}</defs>
    <circle cx="24" cy="24" r="20" fill="url(#$g)" ${line(2.4)}/>
    <g fill="#5a6888" opacity="0.5"><circle cx="24" cy="17" r="4"/><path d="M18 36V27C18 23 21 22 24 22C27 22 30 23 30 27V36H27V42H21V36Z"/></g>
    <path d="M7 15H22M27 21H41M6 29H20M28 33H42M11 39H27" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    ${flake(36, 12, 3.4)}${flake(13, 34, 3, 20)}`,

  'polar-vortex': `<defs>${frost}</defs>
    <circle cx="24" cy="24" r="19" fill="#4a90d0" ${line(2.4)}/>
    <path d="M10 18C13 12 19 9 24 9M38 30C35 36 29 39 24 39" fill="none" stroke="#7ab0e0" stroke-width="2" stroke-linecap="round"/>
    <path d="${spiral(24, 24, 2.2, 15)}" fill="none" ${line(4.6)}/>
    <path d="${spiral(24, 24, 2.2, 15)}" fill="none" stroke="#f4fbff" stroke-width="2.2" stroke-linecap="round"/>
    ${stones([[40, 8, 2], [7, 40, 1.8], [43, 40, 1.6]])}`,

  'diamond-dust': `<defs>${frost}</defs>
    <path d="M13 19L19.6 12H28.4L35 19L24 35Z" fill="url(#$i)" ${line(2.2)}/>
    <path d="M13 19H35M19.6 12L21.6 19L24 35M28.4 12L26.4 19L24 35" fill="none" ${line(1.3)}/>
    <path d="M17 18L20 14" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
    ${sparkle(8, 10, 3.6)}${sparkle(40, 8, 2.8)}${sparkle(41, 30, 3.4)}${sparkle(7, 31, 2.6)}${sparkle(16, 42, 3)}${sparkle(33, 42, 2.4)}
    ${stones([[24, 5, 1], [30, 28, 0.9], [12, 24, 0.9], [44, 18, 1]], '#fff')}`,

  'freezing-rain': `<defs>${frost}</defs>
    ${drop(9, 9, 1.8)}${drop(24, 5, 1.8)}${drop(39, 9, 1.8)}
    ${tube('M24 26V41A3 3 0 0 1 18 41', 2, '#a87048')}
    ${icicle(6, 26, 8, 4.4)}${icicle(15, 26, 10, 4.4)}${icicle(33, 26, 10, 4.4)}${icicle(42, 26, 8, 4.4)}
    <path d="M6 26A18 15 0 0 1 42 26C39 23 36 23 33 26C30 23 27 23 24 26C21 23 18 23 15 26C12 23 9 23 6 26Z" fill="#4aa0e0" ${line(2.4)}/>
    <path d="M24 11V25M15 14C14 18 14 22 15 25M33 14C34 18 34 22 33 25" fill="none" stroke="${INK}" stroke-width="1.3" opacity="0.5"/>
    <path d="M10 21C12 16 16 13 20 12" fill="none" stroke="#d8f6ff" stroke-width="1.8" stroke-linecap="round"/>`,

  icefall: `<defs>${frost}</defs>
    ${icicle(8, 11, 10, 5)}${icicle(19, 12, 7, 4.4)}${icicle(38, 11, 12, 5.4)}
    <path d="M2 3H46V11C40 13 34 10 28 13C22 11 14 14 2 11Z" fill="#8898b8" ${line(2.4)}/>
    <path d="M2 3H46V6C38 7.6 30 5.6 22 7C14 5.6 8 7.6 2 6Z" fill="#fff"/>
    <path d="M28 17V21M31 16V20M14 26V30M17 25V29" stroke="#a8ecff" stroke-width="1.6" stroke-linecap="round"/>
    ${icicle(29.5, 23, 13, 6)}${icicle(15.5, 31, 11, 5)}
    <path d="M6 45H42" ${line(2.4)}/>
    ${stones([[34, 43, 1.4], [38, 42, 1.1]], '#d8f6ff')}`,

  'frost-shard': `<defs>${frost}</defs>
    <path d="M24 4L34 16L31 32L27 37L24 33L21 39L17 30L14 15Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M24 4L22 20L24 33M14 15L22 20L34 16" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.8"/>
    ${flake(24, 21, 4.4)}
    ${sparkle(39, 8, 3)}${sparkle(9, 36, 2.4)}
    ${stones([[38, 38, 1.4], [42, 32, 1.1], [8, 24, 1.1]], '#fff')}`,

  'thick-fat': `<defs>${frost}</defs>
    <ellipse cx="7" cy="33" rx="4" ry="6.4" fill="#4a90d0" transform="rotate(30 7 33)" ${line(2)}/>
    <ellipse cx="41" cy="33" rx="4" ry="6.4" fill="#4a90d0" transform="rotate(-30 41 33)" ${line(2)}/>
    <circle cx="24" cy="26" r="17" fill="#6ab0e8" ${line(2.4)}/>
    <ellipse cx="24" cy="33" rx="11.4" ry="9.4" fill="#fff4d8" ${line(1.8)}/>
    <path d="M14 15A11 11 0 0 1 20 11" fill="none" stroke="#c8e8ff" stroke-width="2" stroke-linecap="round"/>
    <circle cx="18" cy="21" r="1.9" fill="${INK}"/><circle cx="30" cy="21" r="1.9" fill="${INK}"/>
    <ellipse cx="24" cy="25" rx="2" ry="1.4" fill="${INK}"/>
    <circle cx="13" cy="25" r="2" fill="#ffffff" opacity="0.7"/><circle cx="35" cy="25" r="2" fill="#ffffff" opacity="0.7"/>
    <path d="M20 34Q24 36.4 28 34" fill="none" stroke="#d8b888" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M3 14Q1 18 3 22M45 14Q47 18 45 22" fill="none" ${line(1.6)}/>`,

  'ice-core': `<defs>${glow}${frost}</defs>
    <circle cx="24" cy="24" r="20" fill="url(#$g)" opacity="0.55"/>
    <circle cx="24" cy="24" r="17" fill="none" stroke="#58b8e8" stroke-width="1.4" stroke-dasharray="3 3"/>
    <circle cx="24" cy="24" r="12" fill="#c8f2ff" ${line(1.8)}/>
    ${crystal(24, 24, 22, 13)}
    <circle cx="24" cy="24" r="2.6" fill="#fff"/>
    ${stones([[24, 7, 1.6], [41, 24, 1.6], [7, 24, 1.6], [24, 41, 1.6]], '#e8f8ff')}`,

  'flash-freeze': `<defs>${frost}</defs>
    <circle cx="24" cy="29" r="9" fill="#f0a868" ${line(2.2)}/>
    <path d="M17 22L15 14L21 20M31 22L33 14L27 20" fill="#f0a868" ${line(2)}/>
    <circle cx="20.4" cy="27" r="2" fill="#fff" ${line(1.2)}/><circle cx="27.6" cy="27" r="2" fill="#fff" ${line(1.2)}/>
    <ellipse cx="24" cy="33" rx="1.8" ry="2.2" fill="${INK}"/>
    <rect x="8" y="10" width="32" height="32" rx="4" fill="#a8e4fa" opacity="0.5"/>
    <rect x="8" y="10" width="32" height="32" rx="4" fill="none" ${line(2.4)}/>
    <path d="M12 16L18 13M12 22L14 21M34 38L37 35" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M3 5L6 8M45 5L42 8M2 26H5M46 26H43M4 46L7 43M44 46L41 43" ${line(2)}/>`,

  shatter: `<defs>${frost}</defs>
    <polygon points="${star(24, 24, 7, 8, 3.4, -80)}" fill="#fff" ${line(1.8)}/>
    <path d="M24 24L18 18M24 24L31 21M24 24L22 31" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
    ${burst(24, 24, [[-120, 15, 5.4], [-50, 16, 6], [10, 16, 5], [70, 15, 5.6], [140, 16, 6], [195, 16, 4.6]])}
    ${stones([[8, 8, 1.2], [42, 40, 1.2], [44, 12, 1], [6, 42, 1]], '#fff')}`,

  'ice-crown': `<defs>${frost}</defs>
    ${icicle(11, 34, 14, 6, 180)}${icicle(17.5, 34, 20, 7, 180)}${icicle(24, 34, 27, 8, 180)}${icicle(30.5, 34, 20, 7, 180)}${icicle(37, 34, 14, 6, 180)}
    <path d="M7 33H41V42H7Z" fill="#4a7ad0" ${line(2.4)}/>
    <path d="M9 35.4H39" stroke="#8ab4f0" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="15" cy="38.4" r="2" fill="#a8ecff" ${line(1.2)}/><circle cx="24" cy="38.4" r="2.4" fill="#fff" ${line(1.2)}/><circle cx="33" cy="38.4" r="2" fill="#a8ecff" ${line(1.2)}/>
    ${sparkle(41, 12, 3)}${sparkle(7, 18, 2.4)}`,

  'cold-storage': `<defs>${frost}</defs>
    <rect x="6" y="12" width="36" height="6" rx="2" fill="#d8e8f4" transform="rotate(14 42 18)" ${line(2.2)}/>
    ${puffs([[14, 20, 3.4], [21, 18, 4], [29, 19, 3.4]], '#f4fbff')}
    <rect x="5" y="21" width="38" height="20" rx="3" fill="#eef6fc" ${line(2.4)}/>
    <path d="M5 26H43" ${line(1.6)}/>
    <path d="M17 31H31" ${line(3)}/>
    ${flake(24, 36, 3.4)}
    <path d="M9 41V44M39 41V44" ${line(2.6)}/>
    ${flake(40, 7, 3.6)}`,

  iceberg: `<defs>${frost}</defs>
    <rect x="2" y="21" width="44" height="25" rx="3" fill="#2a6ab0" ${line(2.2)}/>
    <path d="M12 22L6 34L14 43H34L42 31L36 22Z" fill="#9ad8f0" opacity="0.8"/>
    <path d="M12 22L6 34L14 43H34L42 31L36 22" fill="none" stroke="#d8f6ff" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M13 22L20 7L25 12L30 5L36 22Z" fill="url(#$i)" ${line(2.4)}/>
    <path d="M20 7L22 22M30 5L29 22" stroke="#fff" stroke-width="1.2" opacity="0.8"/>
    <path d="${sine(3, 45, 22, 1, 5)}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,

  'endless-winter': `<defs>${frost}</defs>
    <circle cx="34" cy="13" r="9.4" fill="#fff8e0" opacity="0.6"/>
    <circle cx="34" cy="13" r="6.4" fill="#f4f0dc" ${line(2)}/>
    ${tube('M5 13C5 9 11 9 13 13C15 17 21 17 21 13C21 9 15 9 13 13C11 17 5 17 5 13Z', 1.6, '#c8f2ff')}
    <path d="M2 30C8 23 16 23 24 28C32 24 40 22 46 26V46H2Z" fill="#c8dcf0" ${line(2.2)}/>
    <path d="M2 37C10 31 18 32 26 36C32 33 40 32 46 35V46H2Z" fill="#f4fbff" ${line(2.2)}/>
    ${stones([[10, 22, 1.2], [24, 20, 1.4], [43, 20, 1.2], [18, 42, 1.2], [36, 41, 1.2]], '#fff')}`,

  'absolute-zero': `<defs>${deep}</defs>
    <circle cx="24" cy="24" r="20" fill="url(#$d)" ${line(2.4)}/>
    ${flake(33, 20, 7.4, 0, '#c8f2ff')}
    ${thermo(17, 37, 30, 0, '#5ab0ff')}
    ${sparkle(33, 36, 2.6)}${sparkle(38, 9, 2)}`,
};

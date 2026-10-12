/* ============================================================
   card-art-fire.js  -  Fire's cards drawn (batch 1 of the smooth
   card art, 2026-10-12). The starting deck's are in card-art.js.
   ============================================================ */

import {
  INK, f, line, flame, star, spiral, sine, tube, sparkle, radial, linear, HOT,
  hot, blaze, puffs, fist, boot, sunDef, sun, gear, thermo, speed, embers,
} from './card-art-kit.js';

const LAVA = [[0, '#fff3a0'], [0.35, '#ff9a30'], [1, '#c8261a']];
const ROCK = [[0, '#8a7470'], [1, '#3e2e2e']];
const SMOKE = '#9a9298', SMOKE_LIT = '#d6d0d4';

export const FIRE = {
  'mystical-fire': `<defs>${radial('a', [[0, '#fff0fb'], [0.45, '#ff8ad8'], [1, '#9a3ae0']], '50%', '78%', '68%')}</defs>
    <path d="${flame(24, 4, 44, 24)}" fill="url(#$a)" ${line(2.6)}/>
    <path d="${flame(24.4, 24, 42, 11)}" fill="#fff0fb"/>
    <polygon points="${star(24, 30.5, 5, 5.4, 2.4)}" fill="#ffe070" ${line(1.5)}/>
    ${sparkle(8, 12, 3.4, '#ffd8f4')}${sparkle(41, 18, 2.8, '#ffe8a0')}${sparkle(38.5, 40, 2.2, '#ffd8f4')}`,

  'fire-punch': `<defs>${hot}</defs>
    ${blaze(13, 3, 30, 12, 2.2, -18)}${blaze(24, 1, 28, 14)}${blaze(35, 3, 30, 12, 2.2, 18)}
    ${speed(9, [31, 37, 43], 7)}
    ${fist(27, 32, 1.05)}`,

  'fire-spin': `<defs>${linear('a', [[0, '#ffe070'], [0.5, '#ff8a2a'], [1, '#d8341a']], 1, 1)}${hot}</defs>
    ${tube(spiral(24, 26, 2.3, 16.5), 3.6, 'url(#$a)', '#fff3b0')}
    ${blaze(39.5, 8, 22, 7.5, 1.8, 30)}
    ${embers([[8, 9, 1.6], [42, 41, 1.4], [6, 38, 1.2]])}`,

  'flame-burst': (() => {
    const b = (x, y, r) => `<polygon points="${star(x, y, 8, r, r * 0.55, -70)}" fill="#ff7a2a" ${line(1.8)}/>
      <polygon points="${star(x, y, 8, r * 0.62, r * 0.36, -50)}" fill="#ffe070"/><circle cx="${x}" cy="${y}" r="${f(r * 0.22)}" fill="#fff"/>`;
    return `${b(15, 15, 11)}${b(34, 21, 10)}${b(20, 35, 10)}`;
  })(),

  'scorching-sands': `<defs>${sunDef}${linear('a', [[0, '#ffe08a'], [1, '#d89a40']])}</defs>
    ${sun(36, 12, 6.5, 10)}
    <path d="M14 22c2-3-2-5 0-8M21 22c2-3-2-5 0-8M7 24c2-3-2-5 0-8" stroke="#ff8a2a" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M2 44V34C10 26 20 27 27 32C33 28 40 27 46 31V44Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M7 33.5C13 29.5 19 29.6 24 32.4M30 31.2C35 29 39.6 29 43.4 31" stroke="#fff4c0" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${embers([[12, 39, 1], [20, 41.5, 0.9], [33, 38, 1], [40, 41, 0.9], [27, 42, 0.8]], '#ff9a30')}`,

  'heat-up': `${thermo(18, 39, 34, 0.75)}
    <path d="M36 40V14M28.5 21.5L36 13.5l7.5 8" fill="none" ${line(6.4)}/>
    <path d="M36 40V14M28.5 21.5L36 13.5l7.5 8" fill="none" stroke="#ff8a2a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M35 36V17" stroke="#ffe0a0" stroke-width="1.2" stroke-linecap="round"/>`,

  'flare-up': `<defs>${hot}</defs>
    ${blaze(24, 2, 30, 20)}
    <path d="M24 46C13 38.5 6 33 6 26.6C6 22.4 9.2 19.6 12.8 19.6C16 19.6 18.6 21.6 24 26.6C29.4 21.6 32 19.6 35.2 19.6C38.8 19.6 42 22.4 42 26.6C42 33 35 38.5 24 46Z" fill="#f04a5a" ${line(2.6)}/>
    <path d="M24 46C13 38.5 6 33 6 26.6C6 22.4 9.2 19.6 12.8 19.6C16 19.6 18.6 21.6 24 26.6Z" fill="#a82a3e"/>
    <path d="M24 26.6L21 31.6l4.6 3-2.4 5" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M24 46C13 38.5 6 33 6 26.6C6 22.4 9.2 19.6 12.8 19.6C16 19.6 18.6 21.6 24 26.6C29.4 21.6 32 19.6 35.2 19.6C38.8 19.6 42 22.4 42 26.6C42 33 35 38.5 24 46Z" fill="none" ${line(2.6)}/>
    <path d="M10 25.4c.6-1.8 2-2.8 3.6-2.8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  'fiery-dance': `<defs>${hot}${linear('a', [[0, '#ffe070'], [1, '#e8401c']], 1, 0)}</defs>
    ${tube('M6 38C10 22 22 34 26 22S38 10 42 6', 3.2, 'url(#$a)', '#fff6c0')}
    ${blaze(13, 12, 33, 12, 2.2, -22)}${blaze(34, 18, 42, 13, 2.2, 20)}
    ${sparkle(41, 31, 3, '#ffe8a0')}${sparkle(9, 7, 2.6, '#ffe8a0')}${sparkle(23, 44, 2.2)}`,

  'heat-crash': `<defs>${linear('a', [[0, '#b8b0c0'], [1, '#5a5268']])}${hot}</defs>
    ${blaze(16, 2, 22, 9, 2, 10)}${blaze(32, 2, 22, 9, 2, -10)}${blaze(24, 0, 20, 10)}
    <path d="M10 14H38L42 30H6Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M13 17.5H35" stroke="#e8e4f0" stroke-width="1.6" stroke-linecap="round"/>
    <text x="24" y="28" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="9" fill="${INK}">1t</text>
    <polygon points="${star(24, 39.5, 10, 12, 5.6, -90)}" fill="#ffd040" ${line(2)}/>
    <path d="M3 44.5H45" ${line(2.2)}/>`,

  'fire-lash': `<defs>${hot}${linear('a', [[0, '#8a4a2a'], [1, '#d87a3a']], 1, 0)}</defs>
    <rect x="3" y="35" width="11" height="6" rx="2.6" transform="rotate(-35 8.5 38)" fill="#5a3424" ${line(2)}/>
    ${tube('M12 34C20 26 14 14 24 12S36 26 40 18', 2.8, 'url(#$a)', '#ffd0a0')}
    ${blaze(41, 4, 20, 10, 2, 20)}
    <path d="M27 31l3 3M33 30l2 4M21 40l4 1" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,

  rage: `<defs>${hot}</defs>
    ${blaze(24, 5, 44, 26)}
    <g transform="translate(24 27) rotate(8)">
      <path d="M-9 -3C-4 -3 -3 -4 -3 -9M3 -9C3 -4 4 -3 9 -3M9 3C4 3 3 4 3 9M-3 9C-3 4 -4 3 -9 3" fill="none" ${line(6)}/>
      <path d="M-9 -3C-4 -3 -3 -4 -3 -9M3 -9C3 -4 4 -3 9 -3M9 3C4 3 3 4 3 9M-3 9C-3 4 -4 3 -9 3" fill="none" stroke="#e8203a" stroke-width="3.2" stroke-linecap="round"/>
    </g>`,

  'spark-shower': (() => {
    const s = [[10, 8, 3.2], [24, 5, 2.6], [37, 9, 3.4], [16, 21, 2.6], [31, 22, 3], [42, 26, 2.2], [8, 32, 2.4], [22, 36, 3.2], [36, 39, 2.6]];
    return s.map(([x, y, r]) => `<path d="M${x - 4} ${y - 6}L${x} ${y}" stroke="#ffb030" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
      <polygon points="${star(x, y, 4, r * 1.5, r * 0.5, -45)}" fill="#ffe070" ${line(1.3)}/><circle cx="${x}" cy="${y}" r="${f(r * 0.35)}" fill="#fff"/>`).join('');
  })(),

  'cinder-cloak': `<defs>${linear('a', [[0, '#e8503a'], [1, '#7a1e1e']])}</defs>
    <path d="M24 3C15 3 11 10 11 18C11 26 7 34 4 44H44C41 34 37 26 37 18C37 10 33 3 24 3Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 9C18.5 9 16 13.5 16 19C16 24 19.5 27 24 27S32 24 32 19C32 13.5 29.5 9 24 9Z" fill="#2a1420" ${line(1.8)}/>
    <circle cx="20.8" cy="19.6" r="1.7" fill="#ffd040"/><circle cx="27.2" cy="19.6" r="1.7" fill="#ffd040"/>
    <path d="M24 27V44M15 30C14 35 12 39 10 44M33 30C34 35 36 39 38 44" stroke="#5a1418" stroke-width="1.4" fill="none"/>
    <path d="M14.5 13C15.5 9 18.5 6.4 22 5.8" stroke="#ffa080" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${embers([[8, 34, 1.4], [41, 30, 1.6], [17, 40, 1.1], [32, 37, 1.2], [42, 41, 1]], '#ffb030')}`,

  kindle: `<defs>${hot}${linear('a', [[0, '#c8844a'], [1, '#7a4426']])}</defs>
    ${blaze(24, 8, 36, 14)}
    <rect x="5" y="33" width="38" height="7" rx="3.5" transform="rotate(14 24 36.5)" fill="url(#$a)" ${line(2.2)}/>
    <rect x="5" y="33" width="38" height="7" rx="3.5" transform="rotate(-14 24 36.5)" fill="url(#$a)" ${line(2.2)}/>
    <circle cx="6.6" cy="31.6" r="2.4" fill="#e8b07a" ${line(1.4)}/><circle cx="41.4" cy="31.6" r="2.4" fill="#e8b07a" ${line(1.4)}/>
    ${embers([[12, 14, 1.3], [37, 12, 1.5], [33, 22, 1]])}`,

  flare: `<defs>${radial('a', [[0, '#fff'], [0.35, '#fff3a0'], [1, '#ff8a24']])}</defs>
    <polygon points="${star(24, 24, 8, 21, 7, -90)}" fill="#ff8a2a" ${line(2.2)}/>
    <polygon points="${star(24, 24, 8, 14, 6, -67.5)}" fill="#ffd040" ${line(1.4)}/>
    <circle cx="24" cy="24" r="6.6" fill="url(#$a)" ${line(2)}/>
    <circle cx="22.4" cy="22.4" r="1.8" fill="#fff"/>`,

  inferno: `<defs>${hot}</defs>
    ${blaze(7, 18, 44, 10, 2)}${blaze(41, 18, 44, 10, 2)}
    ${blaze(15, 9, 44, 13, 2.2)}${blaze(33, 9, 44, 13, 2.2)}
    ${blaze(24, 1, 45, 17)}
    <path d="M2 44.6H46" ${line(2.2)}/>`,

  'sunny-day': `<defs>${sunDef}</defs>${sun(24, 24, 12, 12)}
    <path d="M18.5 26q2 2.4 4 0M25.5 26q2 2.4 4 0" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M20 30.5q4 3.4 8 0" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  'heat-wave': `<defs>${sunDef}</defs>${sun(24, 12, 7, 10)}
    ${tube(sine(4, 44, 26, 2.4, 2.5), 3, '#ff9a30', '#fff0b0')}
    ${tube(sine(4, 44, 34, 2.4, 2.5), 3, '#ff6a2a', '#ffd0a0')}
    ${tube(sine(4, 44, 42, 2.4, 2.5), 3, '#e8401c', '#ffb090')}`,

  'burning-bulwark': `<defs>${hot}${linear('a', [[0, '#e0e4ee'], [1, '#7e86a0']], 1, 1)}</defs>
    ${blaze(9, 6, 28, 10, 2, -15)}${blaze(39, 6, 28, 10, 2, 15)}${blaze(24, 0, 20, 12)}
    <path d="M24 12L40 17V27C40 36 33 42 24 45.5C15 42 8 36 8 27V17Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 12V45.5M8 25H40" stroke="${INK}" stroke-width="1.4" opacity="0.35"/>
    <path d="M12 19.5V26c0 3.4 1 6.4 3 9" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="${flame(24, 24, 38, 9)}" fill="#ff7a2a" ${line(1.6)}/>`,

  'fan-the-flames': `<defs>${hot}${linear('a', [[0, '#ff9ab0'], [1, '#d8406a']], 1, 0)}</defs>
    <path d="M6 42L4 18A22 22 0 0 1 26 6Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M6 42L7.6 15M6 42L12 10.6M6 42L18.6 7.4" stroke="${INK}" stroke-width="1.2" opacity="0.6"/>
    <path d="M7 19A17 17 0 0 1 21 9" stroke="#ffe0e8" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <circle cx="6" cy="42" r="2.4" fill="#ffd040" ${line(1.4)}/>
    <path d="M18 24c4 1 8 1 11-1M17 31c4 1 8 1 11-1" stroke="#9ad8ff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${blaze(37, 8, 44, 17)}`,

  'ash-cloud': `${puffs([[14, 18, 8], [24, 13, 10], [34, 17, 8.5], [10, 25, 6], [38, 25, 6], [20, 25, 8], [29, 25, 8]], SMOKE, SMOKE_LIT)}
    <circle cx="18.5" cy="21" r="1.8" fill="#4a424a"/><circle cx="29.5" cy="21" r="1.8" fill="#4a424a"/>
    ${embers([[12, 37, 1.6], [22, 41, 1.4], [32, 36, 1.8], [40, 42, 1.2], [17, 45, 1], [28, 45.5, 1]], '#ff9a30')}
    <path d="M9 33l-1 3M38 32l-1 3" stroke="#6a626a" stroke-width="1.6" stroke-linecap="round"/>`,

  'heat-haze': `<defs>${linear('a', [[0, '#ffe0a0'], [1, '#ff8a4a']])}</defs>
    <path d="M24 5L39 10V22C39 32 32 39 24 43C16 39 9 32 9 22V10Z" fill="url(#$a)" opacity="0.85" ${line(2.4)}/>
    <path d="M13 12V21c0 3 .7 6 2 8.6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${[13, 21, 29, 37].map((x) => `<path d="M${x} 46C${x - 3} 40 ${x + 3} 34 ${x} 28S${x - 3} 16 ${x} 10" stroke="#fff6e0" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.85"/>`).join('')}`,

  'infernal-parade': (() => {
    const w = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="${flame(0, -14, 8, 13)}" fill="url(#$a)" ${line(2.2 / s)}/>
      <ellipse cx="-2.6" cy="-1" rx="1.4" ry="2" fill="${INK}"/><ellipse cx="2.6" cy="-1" rx="1.4" ry="2" fill="${INK}"/>
      <path d="M-2 3.6q2 1.4 4 0" stroke="${INK}" stroke-width="${f(1.2 / s)}" stroke-linecap="round" fill="none"/></g>`;
    return `<defs>${radial('a', [[0, '#f8e8ff'], [0.5, '#c070ff'], [1, '#6a2ad0']], '50%', '75%', '70%')}</defs>
      ${w(9, 22, 0.8)}${w(39, 22, 0.8)}${w(24, 33, 1.1)}
      <path d="M3 44c6-3 12-3 18 0s12 3 18 0 6-2 6-2" stroke="#a060f0" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.7"/>`;
  })(),

  'blaze-kick': `<defs>${hot}</defs>
    <g transform="rotate(-62 15 22)">${blaze(15, 6, 38, 13, 2.2)}</g><g transform="rotate(-78 14 33)">${blaze(14, 22, 44, 9, 2)}</g>
    ${boot(30, 30, 1.05, -25)}
    <polygon points="${star(42, 21, 6, 5.5, 2.6)}" fill="#ffd040" ${line(1.5)}/>`,

  'steam-engine': `<defs>${linear('a', [[0, '#d8a060'], [1, '#7a4a24']], 1, 1)}</defs>
    ${puffs([[30, 12, 6], [38, 8, 5], [24, 7, 4.4], [42, 16, 3.6]], '#e0e4ec', '#fff')}
    <polygon points="${gear(19, 30, 14, 9)}" fill="url(#$a)" ${line(2.4)}/>
    <circle cx="19" cy="30" r="5.6" fill="#ffb030" ${line(2)}/>
    <circle cx="19" cy="30" r="2" fill="${INK}"/>
    <path d="M10 25a10 10 0 0 1 6-5" stroke="#f0d0a0" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${embers([[37, 34, 1.8], [41, 41, 1.4], [33, 43, 1.2]], '#ff7a2a')}`,

  'flare-blitz': `<defs>${radial('a', [[0, '#fff'], [0.35, '#ffe070'], [1, '#ff6a24']], '62%', '62%', '65%')}${linear('b', [[0, '#ffe070'], [1, '#ff4a1c']], 1, 1)}</defs>
    <path d="M2 5C12 14 20 20 30 24C26 28 24 32 22 36C14 26 8 16 2 5Z" fill="url(#$b)" ${line(2.2)}/>
    <path d="M9 3C18 12 26 17 36 20C34 22 32 23.5 30 24C20 20 14 13 9 3Z" fill="#ffb030" ${line(1.8)}/>
    <circle cx="32" cy="32" r="12" fill="url(#$a)" ${line(2.6)}/>
    <path d="M26 27a8 8 0 0 1 5-3.4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${speed(20, [41, 46], 8)}`,

  'raging-fury': `<defs>${hot}</defs>
    ${blaze(24, 2, 45, 30)}
    <path d="M14 23l7 3.4M34 23l-7 3.4" ${line(2.8)}/>
    <ellipse cx="18.4" cy="29" rx="2.2" ry="2.6" fill="${INK}"/><ellipse cx="29.6" cy="29" rx="2.2" ry="2.6" fill="${INK}"/>
    <path d="M17 38.6Q24 33.4 31 38.6Z" fill="${INK}"/>
    <path d="M19.6 37.6v1.2M24 36.2v2M28.4 37.6v1.2" stroke="#fff" stroke-width="1.2"/>`,

  'temper-flare': `<defs>${radial('a', [[0, '#6a6280'], [1, '#221a34']], '35%', '35%', '70%')}</defs>
    <circle cx="20" cy="29" r="15" fill="url(#$a)" ${line(2.6)}/>
    <rect x="24" y="10" width="9" height="7" rx="1.6" transform="rotate(40 28.5 13.5)" fill="#8a8298" ${line(2)}/>
    <path d="M31.6 10.6C34 7 37 7 38.6 9" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <polygon points="${star(40, 7.6, 8, 6.4, 2.4)}" fill="#ffd040" ${line(1.5)}/>
    <circle cx="40" cy="7.6" r="1.6" fill="#fff"/>
    <path d="M10.6 25a10 10 0 0 1 5-6" stroke="#b8b0c8" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <path d="M13 33l6-2.4M27 33l-6-2.4" ${line(2)} stroke="#ff6a4a"/>`,

  'mind-blown': `<defs>${radial('a', [[0, '#ffffff'], [1, '#d8dce8']], '40%', '40%', '70%')}${hot}</defs>
    ${blaze(12, 1, 22, 9, 2, -25)}${blaze(36, 1, 22, 9, 2, 25)}${blaze(24, 0, 20, 12)}
    <polygon points="${star(24, 17, 10, 11, 6, -90)}" fill="#ffd040" ${line(1.8)}/>
    <path d="M11 22H37V31C37 39 31 45 24 45S11 39 11 31Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M11 22l4 3 4-3 5 3 5-3 4 3 4-3" fill="none" ${line(1.8)}/>
    <circle cx="18.6" cy="33" r="2.6" fill="${INK}"/><circle cx="29.4" cy="33" r="2.6" fill="${INK}"/>
    <circle cx="19.4" cy="32.2" r="0.9" fill="#fff"/><circle cx="30.2" cy="32.2" r="0.9" fill="#fff"/>
    <ellipse cx="24" cy="40" rx="2.4" ry="1.8" fill="${INK}"/>`,

  eruption: `<defs>${linear('a', ROCK)}${linear('b', LAVA)}</defs>
    <path d="M18 18C14 10 18 4 24 2C30 4 34 10 30 18Z" fill="url(#$b)" ${line(2.2)}/>
    <circle cx="10" cy="8" r="3" fill="#ff7a2a" ${line(1.6)}/><circle cx="39" cy="6" r="2.6" fill="#ff9a30" ${line(1.5)}/><circle cx="41" cy="16" r="1.8" fill="#ff7a2a" ${line(1.3)}/>
    <path d="M2 45L17 17H31L46 45Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M17 17C20 21 22 18 24 22C26 18 28 21 31 17Z" fill="#ff7a2a" ${line(1.8)}/>
    <path d="M22.6 21C22 28 16 34 13 44M26.4 22C27 30 30 36 32 44" stroke="#ff8a2a" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M14.6 27L9 38" stroke="#a89490" stroke-width="1.6" stroke-linecap="round"/>`,

  'shell-trap': `<defs>${radial('a', [[0, '#7aa060'], [1, '#2e4a2a']], '45%', '30%', '75%')}${hot}</defs>
    ${blaze(8, 24, 44, 9, 2)}${blaze(40, 24, 44, 9, 2)}${blaze(24, 26, 45, 10, 2)}
    <path d="M5 38C5 22 13 11 24 11S43 22 43 38Z" fill="url(#$a)" ${line(2.6)}/>
    ${[[13, 22], [24, 15.6], [35, 22], [19, 31], [30, 31]].map(([x, y]) => `<polygon points="${x - 3.6},${y + 3} ${x},${y - 6} ${x + 3.6},${y + 3}" fill="#f0e0a0" ${line(1.6)}/>`).join('')}
    <path d="M2 38.5H46" ${line(2.6)}/>
    <path d="M10 26c2-5 6-9 11-10.6" stroke="#b8d8a0" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'fiery-wrath': `<defs>${radial('a', [[0, '#ff6a4a'], [0.45, '#8a1a3a'], [1, '#2a0a24']], '50%', '78%', '70%')}</defs>
    <path d="${flame(24, 3, 45, 28)}" fill="url(#$a)" ${line(2.6)}/>
    <path d="${flame(12, 14, 34, 9)}" fill="#5a1430" ${line(1.8)} transform="rotate(-22 12 34)"/>
    <path d="${flame(36, 14, 34, 9)}" fill="#5a1430" ${line(1.8)} transform="rotate(22 36 34)"/>
    <path d="M16 27l7 3-6 2ZM32 27l-7 3 6 2Z" fill="#ffd040" ${line(1.2)}/>
    <path d="M18 39q6-3 12 0" stroke="#ff6a4a" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  'lava-plume': `<defs>${linear('b', LAVA)}${linear('a', ROCK)}</defs>
    <path d="M19 38C17 26 22 16 24 4C26 16 31 26 29 38Z" fill="url(#$b)" ${line(2.4)}/>
    <path d="M23 34C22 25 23.4 18 24 11" stroke="#fff6c0" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${[[12, 12, 3.2], [37, 9, 3], [8, 24, 2.4], [40, 22, 2.6], [31, 3, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8a2a" ${line(1.5)}/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.35)}" fill="#fff3a0"/>`).join('')}
    <ellipse cx="24" cy="40" rx="21" ry="6" fill="url(#$a)" ${line(2.4)}/>
    <ellipse cx="24" cy="39" rx="15" ry="3.6" fill="#ff7a2a" ${line(1.6)}/>
    <path d="M14 39q4-1.6 8 0" stroke="#ffe070" stroke-width="1.4" stroke-linecap="round" fill="none"/>`,

  'ember-veil': `<defs>${linear('a', [[0, '#ffb060'], [1, '#e8401c']])}</defs>
    <path d="M4 5H44" ${line(3)}/>
    <path d="M6 5C6 20 8 34 5 44C10 41 14 44 18 41C16 30 16 16 16 5ZM32 5C32 16 32 30 30 41C34 44 38 41 43 44C40 34 42 20 42 5Z" fill="url(#$a)" ${line(2.2)} opacity="0.92"/>
    <path d="M16 5C16 18 20 32 24 44C28 32 32 18 32 5Z" fill="#ffd070" ${line(2.2)} opacity="0.85"/>
    <path d="M9 8C9 20 10.4 30 9 38M37 9C37 20 37.6 30 36 38" stroke="#fff0c0" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.8"/>
    ${embers([[12, 22, 1.4], [24, 18, 1.6], [36, 26, 1.4], [20, 33, 1.2], [29, 12, 1.2]], '#fff3a0')}`,

  'inferno-charge': `<defs>${linear('a', [[0, '#e8e4f0'], [1, '#8a8498']], 1, 0)}${hot}</defs>
    <rect x="18" y="4" width="12" height="5" rx="1.6" fill="#8a8498" ${line(2)}/>
    <rect x="9" y="8" width="30" height="37" rx="5" fill="url(#$a)" ${line(2.6)}/>
    <rect x="13" y="25" width="22" height="16" rx="2.4" fill="#ff7a2a" ${line(1.8)}/>
    <rect x="13" y="12" width="22" height="9.6" rx="2.4" fill="#5a5468" opacity="0.4"/>
    ${blaze(24, 13, 39, 13, 2)}
    <path d="M12.4 12v26" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`,

  'flash-fire': `<defs>${hot}</defs>
    ${blaze(24, 3, 45, 28)}
    <path d="M27 14L17 29H24L20 41L32 24H25L29 14Z" fill="#ffe94a" ${line(2.2)}/>
    <path d="M26.4 16.6L20.6 26.4" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,

  'fire-pledge': `<defs>${linear('a', [[0, '#fff3a0'], [0.5, '#ff9a30'], [1, '#e8401c']])}</defs>
    <ellipse cx="24" cy="40" rx="18" ry="5.4" fill="#ff7a2a" ${line(2.2)}/>
    <ellipse cx="24" cy="40" rx="12" ry="3.2" fill="#ffe070"/>
    <path d="M15 40C14 28 18 14 24 2C30 14 34 28 33 40Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M19.5 37C19 28 21 18 24 10" stroke="#fffbe0" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    ${sparkle(9, 14, 3, '#ffe8a0')}${sparkle(40, 20, 2.6, '#ffe8a0')}`,

  stoke: `<defs>${linear('a', [[0, '#5a4a4a'], [1, '#2a2020']])}</defs>
    ${[[11, 38, 6], [22, 40, 6.6], [33, 38.6, 6], [16, 32, 5.4], [28, 32.4, 5.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.2}" fill="${INK}"/>`).join('')}
    ${[[11, 38, 6], [22, 40, 6.6], [33, 38.6, 6], [16, 32, 5.4], [28, 32.4, 5.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$a)"/><path d="M${x - r * 0.5} ${y}l${r * 0.3} ${-r * 0.4} ${r * 0.3} ${r * 0.4}" stroke="#ff7a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('')}
    <path d="M44 4L26 30" ${line(5.4)}/>
    <path d="M44 4L26 30" stroke="#a8a4b0" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M26 30l-3 1 1-3.4" fill="none" ${line(2)}/>
    ${[[18, 18, 2.4], [26, 14, 2], [12, 22, 1.8], [33, 22, 1.6]].map(([x, y, r]) => `<polygon points="${star(x, y, 4, r * 1.6, r * 0.55, -45)}" fill="#ffd040" ${line(1.1)}/>`).join('')}`,

  'white-smoke': `${puffs([[16, 32, 9], [28, 30, 10], [36, 20, 7.6], [22, 18, 8], [12, 22, 6], [32, 10, 5.4]], '#d8dce6', '#ffffff')}
    <circle cx="40" cy="38" r="3" fill="#e8ecf2" ${line(1.4)}/><circle cx="6" cy="38" r="2.2" fill="#e8ecf2" ${line(1.2)}/>`,

  'magma-armor': `<defs>${linear('a', ROCK, 1, 1)}</defs>
    <path d="M8 8C14 6 18 9 24 9S34 6 40 8L42 22C42 34 34 42 24 45C14 42 6 34 6 22Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M24 9L22 17L27 22L23 30L26 38M8 16L15 19L22 17M42 18L34 20L27 22M10 30L18 29L23 30M38 30L31 31L26 38" stroke="#ff7a2a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M24 9L22 17L27 22L23 30L26 38" stroke="#ffe070" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M11 11C14 10 17 11 19 11.4" stroke="#b8a8a4" stroke-width="1.8" stroke-linecap="round"/>`,

  'magma-storm': `<defs>${linear('a', LAVA, 1, 1)}${linear('b', ROCK)}</defs>
    <ellipse cx="24" cy="25" rx="21" ry="10" fill="none" ${line(6.4)}/>
    <ellipse cx="24" cy="25" rx="21" ry="10" fill="none" stroke="url(#$a)" stroke-width="3.8"/>
    <path d="M4 22A21 10 0 0 1 32 15.6" stroke="#fff3a0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    <polygon points="24,9 32,16 31,30 24,38 16,31 15,17" fill="url(#$b)" ${line(2.4)}/>
    <path d="M24 9L23 22L31 30M23 22L16 31" stroke="#ff7a2a" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M4 26A21 10 0 0 0 44 26" fill="none" ${line(6.4)}/>
    <path d="M4 26A21 10 0 0 0 44 26" fill="none" stroke="url(#$a)" stroke-width="3.8" stroke-linecap="round"/>
    ${[[9, 9, 2.4], [40, 40, 2], [38, 8, 1.8]].map(([x, y, r]) => `<polygon points="${x - r},${y} ${x},${y - r * 1.2} ${x + r},${y} ${x},${y + r}" fill="#5a4646" ${line(1.3)}/>`).join('')}`,

  'searing-shot': (() => {
    const s = (x, y, r) => `<path d="M${x - r * 3.6} ${y - r * 0.9}L${x} ${y - r}L${x} ${y + r}L${x - r * 3.6} ${y + r * 0.9}Z" fill="#ff8a2a" ${line(1.6)} opacity="0.95"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#$a)" ${line(1.8)}/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.32)}" fill="#fff"/>`;
    return `<defs>${radial('a', [[0, '#fff'], [0.35, '#ffe070'], [1, '#ff6a24']])}</defs>
      <g transform="rotate(-14 24 24)">${s(40, 12, 5)}${s(32, 26, 5.6)}${s(42, 38, 4.6)}</g>`;
  })(),

  'sizzly-slide': `<defs>${hot}${linear('a', [[0, '#ff4a1c'], [1, '#ffe070']], 1, 0)}</defs>
    <path d="M3 32C14 30 26 29 36 32C30 38 14 38 3 36Z" fill="url(#$a)" ${line(2)}/>
    ${blaze(36, 8, 40, 18, 2.4, 35)}
    <path d="M2 41H46" ${line(2.4)}/>
    ${speed(20, [19, 25], 12)}
    ${embers([[10, 26, 1.3], [18, 22.6, 1.1], [26, 26, 1.2]])}`,

  'hot-coals': (() => {
    const c = [[12, 38, 7], [24, 40, 7.6], [36, 38, 7], [18, 28, 6.4], [30, 28.4, 6.6], [24, 18.6, 5.8]];
    return `<defs>${radial('a', [[0, '#ffe070'], [0.4, '#ff7a2a'], [1, '#6a1a1a']], '50%', '40%', '70%')}</defs>
      ${c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.3}" fill="${INK}"/>`).join('')}
      ${c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#$a)"/><path d="M${f(x - r * 0.5)} ${f(y + r * 0.1)}q${f(r * 0.5)} ${f(-r * 0.6)} ${r} 0" stroke="#fff6c0" stroke-width="1.3" stroke-linecap="round" fill="none"/>`).join('')}
      <path d="M15 12c2-3-1-5 1-8M33 13c2-3-1-5 1-8" stroke="#ff9a30" stroke-width="1.8" stroke-linecap="round" fill="none"/>`;
  })(),

  wildfire: `<defs>${hot}${linear('a', [[0, '#7a4a2a'], [1, '#3a2014']])}</defs>
    <path d="M21 45V30L14 24M21 34L28 27M27 45V32" fill="none" ${line(5.4)}/>
    <path d="M21 45V30L14 24M21 34L28 27M24 45V32" fill="none" stroke="url(#$a)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${puffs([[14, 17, 8], [24, 12, 9.6], [34, 18, 8], [24, 23, 7]], '#2e6a2c', '#4a9a3a')}
    ${blaze(13, 2, 24, 10, 2)}${blaze(24, 0, 20, 12, 2)}${blaze(35, 3, 24, 10, 2)}
    ${blaze(6, 32, 46, 7, 1.8)}${blaze(42, 30, 46, 8, 1.8)}`,

  'armor-cannon': `<defs>${linear('a', [[0, '#d0d4e0'], [0.5, '#8a90a8'], [1, '#4a4e64']], 0, 1)}${radial('b', [[0, '#fff'], [0.35, '#ffe070'], [1, '#ff5a1c']])}</defs>
    <g transform="rotate(-25 18 30)">
      <rect x="4" y="22" width="28" height="15" rx="3" fill="url(#$a)" ${line(2.6)}/>
      <rect x="29" y="19.5" width="6" height="20" rx="2" fill="#6a7088" ${line(2.2)}/>
      <path d="M9 22v15M15 22v15" stroke="${INK}" stroke-width="1.4" opacity="0.4"/>
      <path d="M6 25.6H28" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
    </g>
    <circle cx="39" cy="13" r="7.6" fill="url(#$b)" ${line(2.4)}/>
    <polygon points="${star(39, 13, 8, 12, 8, -70)}" fill="none" ${line(1.4)} stroke-dasharray="2 2"/>
    <circle cx="14" cy="42" r="4" fill="#4a4e64" ${line(2)}/><circle cx="26" cy="42" r="4" fill="#4a4e64" ${line(2)}/>`,

  heatproof: `<defs>${linear('a', [[0, '#d8f0ff'], [1, '#5a9ad8']], 1, 1)}</defs>
    <path d="M24 3L41 8.5V21C41 32 33.5 40 24 44C14.5 40 7 32 7 21V8.5Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="${flame(24, 11, 36, 14)}" fill="#ff8a2a" ${line(2)}/>
    <path d="${flame(24.2, 23, 35, 6)}" fill="#ffe070"/>
    <path d="M13 13L35 35" ${line(5.4)}/><path d="M13 13L35 35" stroke="#e8203a" stroke-width="3" stroke-linecap="round"/>
    <path d="M12 12V21c0 3 .7 6 2 8.6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>`,

  firestorm: `<defs>${linear('a', [[0, '#ffe070'], [0.5, '#ff8a2a'], [1, '#c8261a']])}</defs>
    <path d="M4 7C12 3 36 3 44 7C42 13 34 17 32 22C30 28 28 34 26 44H22C21 36 18 30 15 24C12 18 6 13 4 7Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M8 9.6C16 13 32 13 40 9.6M13 17C20 20 28 20 34 17M17 25C21 27 26 27 30 25M20 33C22 34 25 34 27 33" stroke="#fff3b0" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${embers([[4, 18, 1.6], [44, 22, 1.8], [9, 32, 1.4], [39, 36, 1.4], [13, 42, 1], [35, 44, 1]])}`,

  'flame-blast': `<defs>${radial('a', [[0, '#fff'], [0.25, '#fff3a0'], [0.6, '#ff9a30'], [1, '#e8401c']])}</defs>
    <polygon points="${star(24, 24, 14, 23, 13, -90)}" fill="#e8401c" ${line(2.4)}/>
    <polygon points="${star(24, 24, 14, 17, 10, -77)}" fill="url(#$a)" ${line(1.6)}/>
    <circle cx="24" cy="24" r="6" fill="#fff" opacity="0.9"/>
    ${embers([[5, 6, 1.6], [43, 7, 1.4], [44, 42, 1.6], [4, 41, 1.2]])}`,

  'sacred-fire': `<defs>${linear('a', [[0, '#ffe8ff'], [0.25, '#ffe040'], [0.5, '#ff8a2a'], [0.75, '#f0306a'], [1, '#8a3ad8']])}</defs>
    <path d="${flame(24, 2, 45, 28)}" fill="url(#$a)" ${line(2.6)}/>
    <path d="${flame(24.4, 22, 43, 13)}" fill="#fffbe0"/>
    <g transform="translate(24 32) rotate(-30)">
      <path d="M0 -12C5 -6 5 4 0 11C-5 4 -5 -6 0 -12Z" fill="#40c890" ${line(1.8)}/>
      <path d="M0 -10V10M0 -4l3-3M0 1l3.4-3M0 -4l-3-3M0 1l-3.4-3" stroke="#1d5a3a" stroke-width="1" stroke-linecap="round"/>
    </g>
    ${sparkle(8, 10, 3, '#fff0a0')}${sparkle(41, 14, 2.6, '#ffd8f4')}`,

  drought: `<defs>${sunDef}${linear('a', [[0, '#e8b070'], [1, '#a8683a']])}</defs>
    ${sun(24, 14, 8.6, 12)}
    <path d="M2 30H46V45H2Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M8 30l4 5-3 4 2 6M22 30l-2 5 5 3-1 7M34 30l3 4-4 4 3 7M44 36l-6 1M2 38l6-1" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M5 32.6H20" stroke="#ffd8a0" stroke-width="1.6" stroke-linecap="round"/>`,

  blaze: `<defs>${sunDef}${hot}</defs>
    ${sun(24, 22, 15, 14)}
    ${blaze(24, 12, 34, 13, 2)}
    <path d="M10 45l4-5 4 5M30 45l4-5 4 5" fill="none" ${line(2.4)}/>
    <path d="M10 45l4-5 4 5M30 45l4-5 4 5" fill="none" stroke="#ff6a2a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,

  'burn-up': `<defs>${hot}</defs>
    ${puffs([[17, 10, 5], [25, 7, 5.6], [32, 11, 4.4]], SMOKE, SMOKE_LIT)}
    ${blaze(24, 12, 38, 16)}
    <path d="M7 44C9 36 15 34 24 34S39 36 41 44Z" fill="#3a3038" ${line(2.4)}/>
    <path d="M13 41l3-3M21 40l2-3M30 41l2-3" stroke="#ff7a2a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M12 38.6c2-1.6 4.6-2.4 7-2.6" stroke="#6a6068" stroke-width="1.4" stroke-linecap="round" fill="none"/>`,

  'bitter-blade': `<defs>${hot}${linear('a', [[0, '#ffffff'], [1, '#9aa4c0']], 1, 0)}</defs>
    ${blaze(15, 6, 34, 10, 2, -40)}${blaze(30, 2, 26, 9, 2, 35)}
    <path d="M39 3L43 5L22 30L18 28Z" fill="url(#$a)" ${line(2.2)}/>
    <path d="M40 4.6L20 28.6" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
    <path d="M13 25L25 33" ${line(5)}/><path d="M13 25L25 33" stroke="#ffd040" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M18 31L8 43" ${line(5)}/><path d="M18 31L8 43" stroke="#7a3a2a" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="7" cy="44" r="2.4" fill="#ffd040" ${line(1.5)}/>`,

  'flare-boost': `<defs>${hot}${linear('a', [[0, '#ffffff'], [1, '#c0c8e0']], 1, 0)}</defs>
    <g transform="rotate(180 24 39.5)">${blaze(24, 32, 47, 10, 2)}</g>
    <g transform="translate(0 -1)">
    <path d="M24 4C30 9 32 16 31 30H17C16 16 18 9 24 4Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M17 22L10 31V36L17 31ZM31 22L38 31V36L31 31Z" fill="#e8401c" ${line(2)}/>
    <circle cx="24" cy="17" r="3.4" fill="#5ab8ff" ${line(1.8)}/>
    <path d="M20 9.6C19 13 18.6 17 18.8 22" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M17 30H31" ${line(2)}/></g>
    ${embers([[12, 40, 1.4], [37, 41, 1.6], [8, 30, 1]])}`,

  'v-create': `<defs>${linear('a', [[0, '#fff3a0'], [0.45, '#ff9a30'], [1, '#e8301c']])}</defs>
    <path d="M2 4H15L24 30L33 4H46L28 44H20Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M6 7H12.6L22 34M42 7H35.4L26 34" stroke="#fffbe0" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    ${[[5, 4], [11, 4], [37, 4], [43, 4]].map(([x, y]) => `<path d="${flame(x, y - 3, y + 3, 4)}" fill="#ffd040" ${line(1.2)}/>`).join('')}
    ${sparkle(24, 10, 3.6, '#fff0a0')}`,

  'burning-jealousy': `<defs>${radial('a', [[0, '#f0ffd0'], [0.45, '#9ae040'], [1, '#2e8a2c']], '50%', '78%', '70%')}</defs>
    <path d="${flame(24, 2, 30, 22)}" fill="url(#$a)" ${line(2.4)}/>
    <path d="M24 46C13 38.5 6 33 6 26.6C6 22.4 9.2 19.6 12.8 19.6C16 19.6 18.6 21.6 24 26.6C29.4 21.6 32 19.6 35.2 19.6C38.8 19.6 42 22.4 42 26.6C42 33 35 38.5 24 46Z" fill="#c03a8a" ${line(2.6)}/>
    <path d="M10 25.4c.6-1.8 2-2.8 3.6-2.8" stroke="#ffc0e0" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M17 32l5 2-4 2M31 32l-5 2 4 2" stroke="#ffe070" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M20 40q4-2.4 8 0" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,

  'blue-flare': `<defs>${radial('a', [[0, '#ffffff'], [0.4, '#8ad8ff'], [1, '#2a5ae0']], '50%', '78%', '68%')}</defs>
    <path d="${flame(12, 14, 40, 11)}" fill="url(#$a)" ${line(2)} transform="rotate(-20 12 40)"/>
    <path d="${flame(36, 14, 40, 11)}" fill="url(#$a)" ${line(2)} transform="rotate(20 36 40)"/>
    <path d="${flame(24, 2, 44, 24)}" fill="url(#$a)" ${line(2.6)}/>
    <path d="${flame(24.4, 22, 42, 11)}" fill="#f0fbff"/>
    ${sparkle(8, 8, 2.8, '#d0f0ff')}${sparkle(41, 10, 2.4, '#d0f0ff')}`,

  'torch-song': `<defs>${hot}${linear('a', [[0, '#b8b0c8'], [1, '#5a5268']], 1, 0)}</defs>
    ${blaze(20, 2, 22, 13, 2)}
    <circle cx="20" cy="22" r="8" fill="#3a3448" ${line(2.4)}/>
    <path d="M14.4 19h11.2M13.6 23h12.8M15 27h10" stroke="#8a84a0" stroke-width="1.2"/>
    <path d="M17 30L14 44H26L23 30Z" fill="url(#$a)" ${line(2.2)}/>
    <path d="M34 12V24.6" ${line(2.2)}/><path d="M34 12L41 10V14L34 16Z" fill="${INK}"/>
    <ellipse cx="31.6" cy="25" rx="3.2" ry="2.4" fill="#ffb030" ${line(1.6)}/>
    <path d="M40 28V38" ${line(2.2)}/><ellipse cx="37.8" cy="38.4" rx="3" ry="2.2" fill="#ff7a2a" ${line(1.5)}/>`,

  'pyro-ball': `<defs>${hot}${radial('a', [[0, '#ffffff'], [1, '#d8d8e4']], '40%', '35%', '70%')}</defs>
    ${blaze(24, 1, 30, 22, 2.4)}
    <circle cx="24" cy="31" r="13" fill="url(#$a)" ${line(2.6)}/>
    <polygon points="24,25.4 29,29 27,35 21,35 19,29" fill="${INK}"/>
    <path d="M24 25.4V18.6M29 29L35.4 27M27 35L30.6 40.6M21 35L17.4 40.6M19 29L12.6 27" stroke="${INK}" stroke-width="1.6"/>
    <path d="M15.4 25.6a10 10 0 0 1 4-3.6" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'fusion-flare': `<defs>${radial('a', [[0, '#ffffff'], [0.4, '#fff6e0'], [1, '#ff9a40']])}${linear('b', [[0, '#9ad8ff'], [1, '#ffffff']], 1, 0)}</defs>
    <polygon points="${star(24, 24, 16, 22, 15, -90)}" fill="#ffb060" ${line(2)}/>
    <circle cx="24" cy="24" r="14" fill="url(#$a)" ${line(2.6)}/>
    <ellipse cx="24" cy="24" rx="21" ry="6" fill="none" ${line(4.4)} transform="rotate(-25 24 24)"/>
    <ellipse cx="24" cy="24" rx="21" ry="6" fill="none" stroke="url(#$b)" stroke-width="2.2" transform="rotate(-25 24 24)"/>
    <path d="M15 20a10 10 0 0 1 5-5.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,

  'flame-charge': `<defs>${hot}</defs>
    ${speed(14, [12, 20, 36], 11)}
    <g transform="rotate(68 27 24)">${blaze(27, 5, 43, 20, 2.6)}</g>`,

  'fire-fang': `<defs>${hot}${linear('a', [[0, '#ffffff'], [1, '#c8c4d8']])}</defs>
    ${blaze(24, 14, 44, 24, 2.4)}
    <path d="M6 4H42C42 4 38 8 35 8C33 16 30.6 22 29 24C27 18 26 12 25 8H23C22 12 21 18 19 24C17.4 22 15 16 13 8C10 8 6 4 6 4Z" fill="url(#$a)" ${line(2.4)}/>
    <path d="M14 10C15 14 16.4 17.6 18 20M27 10C28 14 29 17 29.6 19" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    <path d="M6 4H42" ${line(2.6)}/>`,

  'flame-wheel': `<defs>${hot}${linear('a', [[0, '#ffe070'], [1, '#e8401c']], 1, 1)}</defs>
    ${blaze(8, 14, 40, 9, 2, -80)}${blaze(9, 22, 44, 8, 1.8, -95)}
    <circle cx="27" cy="24" r="16" fill="none" ${line(8)}/>
    <circle cx="27" cy="24" r="16" fill="none" stroke="url(#$a)" stroke-width="5"/>
    <path d="M27 8A16 16 0 0 1 43 24" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <circle cx="27" cy="24" r="4" fill="#ffd040" ${line(2)}/>
    <path d="M27 12V20M27 28V36M15 24H23M31 24H39" ${line(2)}/>`,

  incinerate: `<defs>${hot}</defs>
    <path d="M10 6H32L38 12V43H10Z" fill="#f4ecd8" ${line(2.4)}/>
    <path d="M32 6V12H38" fill="#d8cfb8" ${line(1.8)}/>
    <path d="M15 14H28M15 19H33M15 24H30" stroke="#a89a80" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M10 30C14 28 16 33 20 31S26 27 30 31S36 29 38 30V43H10Z" fill="#3a3038" ${line(2)}/>
    ${blaze(16, 18, 36, 10, 2)}${blaze(30, 16, 36, 11, 2)}${blaze(23, 22, 37, 8, 1.8)}
    ${puffs([[8, 26, 2.4], [40, 22, 2.6]], SMOKE, SMOKE_LIT, 1)}`,

  flamethrower: `<defs>${linear('a', [[0, '#fff3a0'], [0.3, '#ffb030'], [1, '#e8401c']], 1, 0)}</defs>
    <path d="M10 24C18 20 26 12 38 6C46 10 47 20 44 28C42 36 36 42 26 44C22 36 16 30 10 28Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M14 25C22 22 30 18 38 14C40 22 36 30 28 36C24 31 20 28 14 27Z" fill="#fff3a0"/>
    <path d="M2 21H12L13 26L12 31H2Z" fill="#8a8498" ${line(2.2)}/>
    <path d="M3 24H11" stroke="#d8d4e4" stroke-width="1.4" stroke-linecap="round"/>
    ${embers([[44, 40, 1.6], [40, 4, 1.2]])}`,

  'fire-blast': `<defs>${linear('a', [[0, '#fff3a0'], [0.45, '#ff9a30'], [1, '#e8301c']], 0, 1)}</defs>
    <path d="M21 3H27V15H44V21H29.6L44 41L39 45L24 25.6L9 45L4 41L18.4 21H4V15H21Z" fill="url(#$a)" ${line(2.6)}/>
    <path d="M23.4 5V16.6M7 17.4H20M28 17.4H41" stroke="#fffbe0" stroke-width="1.6" stroke-linecap="round"/>
    ${embers([[8, 8, 1.6], [40, 8, 1.6], [24, 44, 1.6]])}`,

  overheat: `<defs>${radial('a', [[0, '#fff'], [0.4, '#ffe070'], [1, '#ff4a1c']])}</defs>
    <polygon points="${star(18, 10, 9, 10, 5, -90)}" fill="url(#$a)" ${line(1.8)}/>
    ${thermo(18, 39, 28, 1)}
    <path d="M14.6 18l3 3-2 3 3 2" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    ${puffs([[36, 14, 5.4], [41, 22, 4.4], [33, 6, 3.6]], '#e0e4ec', '#fff')}
    <path d="M30 32c2-3-2-5 0-8M37 36c2-3-2-5 0-8" stroke="#ff7a2a" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  'blast-burn': `<defs>${radial('a', [[0, '#fff'], [0.3, '#ffe070'], [0.65, '#ff7a2a'], [1, '#b8201a']], '50%', '45%', '60%')}</defs>
    ${puffs([[11, 30, 8], [24, 27, 11], [37, 30, 8], [17, 19, 7], [31, 19, 7], [24, 13, 7]], '#e8401c', '#ff9a30', 1.5)}
    <circle cx="24" cy="24" r="9" fill="url(#$a)"/>
    <path d="M2 44C8 38 16 36 24 36S40 38 46 44Z" fill="#5a3a34" ${line(2.4)}/>
    ${[[5, 8, 2.4, 30], [43, 9, 2.6, -25], [44, 30, 1.8, 10], [3, 30, 1.8, -10]].map(([x, y, r, a]) => `<polygon points="${x - r},${y} ${x},${y - r * 1.4} ${x + r},${y} ${x},${y + r}" fill="#6a4a44" ${line(1.3)} transform="rotate(${a} ${x} ${y})"/>`).join('')}`,

  cinder: `<defs>${radial('a', [[0, '#fff3a0'], [0.45, '#ff8a2a'], [1, '#7a1a14']], '45%', '40%', '70%')}</defs>
    <polygon points="12,22 20,10 34,12 40,26 32,38 16,36" fill="url(#$a)" ${line(2.6)}/>
    <path d="M20 10L24 22L34 12M24 22L16 36M24 22L40 26" stroke="#ffe070" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.8"/>
    <path d="M16 18l3-4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M20 8c2-2-1-4 1-6M30 9c2-2-1-4 1-6" stroke="#ff9a30" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    ${embers([[8, 34, 1.4], [40, 40, 1.2], [42, 10, 1.1]])}`,
};

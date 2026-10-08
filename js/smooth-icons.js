/* ============================================================
   smooth-icons.js  -  the title screen's icons as smooth vector art
   (the user's call, 2026-10-06: clean and smooth like the Poké Ball
   signs, no pixels), and since 2026-10-05 the Collection device's
   app icons, and since 2026-10-06 every emoji in it (SMOOTH_EMOJI).
   Every other screen keeps js/icons.js's pixel
   icons; inside an <svg> those are never swapped in.

   smoothIcon(name) returns an inline <svg class="smooth-icon">,
   drawn on a 32x32 grid with a dark outline of its own.
   ============================================================ */

const INK = '#1c1430';

const ART = {
  // New game: a Pokémon Egg, cream with green spots
  egg: `<path d="M16 2.5C9.5 2.5 5 12 5 19.2 5 25.6 9.9 29.5 16 29.5S27 25.6 27 19.2C27 12 22.5 2.5 16 2.5Z" fill="#fbf4dc" stroke="${INK}" stroke-width="2"/>
    <path d="M9.2 16.5c1.6-1.5 4.2-1 4.6 1.2.4 2.4-2.6 3.8-4.9 2.6-1.4-.8-1-2.6.3-3.8Z" fill="#62c050"/>
    <path d="M18.4 9.2c1.6-1.2 3.6-.4 3.6 1.4 0 2-2.4 2.8-3.8 1.7-.9-.7-.7-2.3.2-3.1Z" fill="#62c050"/>
    <path d="M18.6 22.4c1.4-1.6 4.6-1.2 5 .6.4 2.2-1.6 3.8-3.8 3.6-1.8-.2-2.2-2.8-1.2-4.2Z" fill="#62c050"/>
    <ellipse cx="11.4" cy="9.6" rx="2" ry="3.2" transform="rotate(25 11.4 9.6)" fill="#fff" opacity="0.85"/>
    <path d="M24.6 18.5c0 4.6-3 8-7.4 8.8" fill="none" stroke="#d8cca4" stroke-width="2" stroke-linecap="round"/>`,

  // Collection: the red Pokédex, its blue lens and lights
  dex: `<rect x="5" y="3" width="22" height="26" rx="3.5" fill="#e23a2c" stroke="${INK}" stroke-width="2"/>
    <rect x="5" y="3" width="5" height="26" rx="2" fill="#a51e18"/>
    <path d="M10 3v26" stroke="${INK}" stroke-width="1.6"/>
    <circle cx="18.5" cy="11" r="5" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
    <circle cx="18.5" cy="11" r="3.4" fill="#3c8cf0"/>
    <circle cx="17.3" cy="9.8" r="1.2" fill="#d8f0ff"/>
    <circle cx="14.5" cy="20" r="1.5" fill="#f8d030" stroke="${INK}" stroke-width="1"/>
    <circle cx="18.5" cy="20" r="1.5" fill="#62c050" stroke="${INK}" stroke-width="1"/>
    <rect x="13" y="23.5" width="10.5" height="2.6" rx="1.3" fill="#a51e18"/>`,

  // Game Modes: a folded map with a dotted route to a pin
  map: `<path d="M3.5 7.5l8-3 9 3 8-3v20l-8 3-9-3-8 3Z" fill="#f4e2b0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M11.5 4.5v20M20.5 7.5v20" stroke="#c8ac70" stroke-width="1.6"/>
    <path d="M3.5 7.5l8-3v20l-8 3Z" fill="#e4cc90"/>
    <path d="M20.5 7.5l8-3v20l-8 3Z" fill="#e4cc90"/>
    <path d="M3.5 7.5l8-3 9 3 8-3v20l-8 3-9-3-8 3Z" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M7 22c3-1 3-6 7-6s4 3 7 1 1-5 3-7" fill="none" stroke="#d83a2c" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="0.1 3.4"/>
    <path d="M24 3.5c-2.6 0-4.2 2-4.2 4.2 0 3 4.2 7 4.2 7s4.2-4 4.2-7c0-2.2-1.6-4.2-4.2-4.2Z" fill="#e23a2c" stroke="${INK}" stroke-width="1.6"/>
    <circle cx="24" cy="7.7" r="1.5" fill="#fff"/>`,

  // Game Corner: a slot machine on three sevens, its lever up
  corner: `<path d="M26.5 9v7" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M26.5 9v7" stroke="#c8c8d4" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="26.5" cy="7.5" r="2.6" fill="#e23a2c" stroke="${INK}" stroke-width="1.6"/>
    <rect x="3" y="6" width="21" height="22" rx="4" fill="#f0b030" stroke="${INK}" stroke-width="2"/>
    <rect x="3" y="6" width="21" height="6" rx="3" fill="#e23a2c"/>
    <rect x="3" y="6" width="21" height="22" rx="4" fill="none" stroke="${INK}" stroke-width="2"/>
    <rect x="6" y="13.5" width="15" height="8" rx="1.8" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
    <path d="M7.6 15.6h3l-1.8 4.4M12 15.6h3l-1.8 4.4M16.4 15.6h3l-1.8 4.4" fill="none" stroke="#d83a2c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="9" y="23.5" width="9" height="2" rx="1" fill="#a86a10"/>
    <circle cx="7" cy="9" r="1" fill="#ffd8d0"/><circle cx="13.5" cy="9" r="1" fill="#ffd8d0"/><circle cx="20" cy="9" r="1" fill="#ffd8d0"/>`,

  // Sky Pillar: a stone tower in tiers, a green light at its top
  tower: `<path d="M16 1.5l3 5h-6Z" fill="#62c050" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M12 6.5h8l1 7H11Z" fill="#b8c0d8" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M10.5 13.5h11l1.2 7.5H9.3Z" fill="#a0aac8" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M8.5 21h15l1.5 8H7Z" fill="#8892b4" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M14.7 9.5h2.6v2.6h-2.6ZM14.5 16h3v3h-3Z" fill="#ffe080" stroke="${INK}" stroke-width="1"/>
    <path d="M14 29v-3.6a2 2 0 0 1 4 0V29" fill="#3a3458" stroke="${INK}" stroke-width="1.2"/>
    <path d="M12.6 7.6l.6 4.8M11.6 14.8l.8 5M9.8 22.4l.8 5.4" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>`,

  // Trainer Card: in its tier's colours (the .c1 / .c2 / .c3 fills follow the card, css/menus.css)
  card: `<rect x="2" y="6" width="28" height="20" rx="3" class="c1" stroke="${INK}" stroke-width="2"/>
    <path d="M3 9a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v1.8H3Z" class="c2"/>
    <rect x="5" y="13" width="9" height="10" rx="1.6" class="pic" stroke="${INK}" stroke-width="1.2"/>
    <circle cx="9.5" cy="16.6" r="2" class="c3"/>
    <path d="M6.4 22.4a3.2 3.2 0 0 1 6.2 0Z" class="c3"/>
    <rect x="16.5" y="14" width="10" height="1.8" rx="0.9" class="c3"/>
    <rect x="16.5" y="17.6" width="7" height="1.8" rx="0.9" class="c3"/>
    <circle cx="25" cy="22" r="2.2" fill="#ffd040" stroke="${INK}" stroke-width="1.1"/>
    <path d="M5 8.4h16" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`,

  // Back: a round-cornered ◀
  back: `<path d="M22.5 6.5v19a1.6 1.6 0 0 1-2.5 1.3L7.6 17.3a1.6 1.6 0 0 1 0-2.6L20 5.2a1.6 1.6 0 0 1 2.5 1.3Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"/>`,

  // a locked Safari Zone: a Safari Ball, green with darker spots
  safari: `<circle cx="16" cy="16" r="13" fill="#f4f4f6" stroke="${INK}" stroke-width="2"/>
    <path d="M3 16a13 13 0 0 1 26 0Z" fill="#5cb04a"/>
    <path d="M8 9.5c1.2-.8 2.8-.4 3 .9.2 1.4-1.6 2.2-2.9 1.6-.9-.5-.8-1.8-.1-2.5ZM15.4 5.6c1-.6 2.4-.2 2.4.9 0 1.2-1.6 1.6-2.4 1-.6-.4-.6-1.4 0-1.9ZM21.4 9.6c1.2-.6 2.8 0 2.6 1.3-.2 1.2-1.9 1.5-2.8.8-.6-.5-.5-1.6.2-2.1Z" fill="#2e7a2a"/>
    <path d="M3 16h26" stroke="${INK}" stroke-width="2.2"/>
    <circle cx="16" cy="16" r="13" fill="none" stroke="${INK}" stroke-width="2"/>
    <circle cx="16" cy="16" r="4" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <path d="M7.4 7.8a11 11 0 0 1 5-3" fill="none" stroke="#c8f0b0" stroke-width="1.8" stroke-linecap="round"/>`,

  // the cloud save's PC: a monitor, its screen lit
  pc: `<rect x="2.5" y="4" width="27" height="19" rx="2.6" fill="#d8dce8" stroke="${INK}" stroke-width="2"/>
    <rect x="5.5" y="7" width="21" height="13" rx="1.2" fill="#2c64c8"/>
    <path d="M5.5 15l6-4 5 3 4.5-3.4 5.5 4V20H5.5Z" fill="#4a90f0"/>
    <path d="M7.5 9h6" stroke="#a8d0ff" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M13 23l-1.4 4.5h8.8L19 23Z" fill="#b0b6c8" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="8.5" y="27" width="15" height="2.6" rx="1.3" fill="#d8dce8" stroke="${INK}" stroke-width="1.6"/>`,

  // Sound on: a speaker sending out two waves
  sound: `<path d="M4 12.5h5l7-6v19l-7-6H4Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M20.5 11.5a6 6 0 0 1 0 9M24 8a11 11 0 0 1 0 16" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M20.5 11.5a6 6 0 0 1 0 9M24 8a11 11 0 0 1 0 16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,

  // Sound off: the speaker, crossed out in red
  mute: `<path d="M4 12.5h5l7-6v19l-7-6H4Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M20 12l8 8M28 12l-8 8" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M20 12l8 8M28 12l-8 8" stroke="#ff5a4a" stroke-width="2.4" stroke-linecap="round"/>`,

  // How to play: a red question mark
  help: `<path d="M10.5 11a5.5 5.5 0 1 1 8.4 4.7c-1.9 1.2-2.9 2.4-2.9 4.6" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="26.5" r="3.4" fill="${INK}"/>
    <path d="M10.5 11a5.5 5.5 0 1 1 8.4 4.7c-1.9 1.2-2.9 2.4-2.9 4.6" fill="none" stroke="#f04a3a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="26.5" r="1.9" fill="#f04a3a"/>
    <path d="M12.6 9.2a3.6 3.6 0 0 1 2.6-2.2" fill="none" stroke="#ffb0a0" stroke-width="1.2" stroke-linecap="round"/>`,

  // the Safari leaderboard: a gold cup
  trophy: `<path d="M8.5 7H4.5c0 5 2 8 5.5 8.5M23.5 7h4c0 5-2 8-5.5 8.5" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M8.5 7H4.5c0 5 2 8 5.5 8.5M23.5 7h4c0 5-2 8-5.5 8.5" fill="none" stroke="#f8c830" stroke-width="2" stroke-linecap="round"/>
    <path d="M7.5 3.5h17v6c0 6-3.8 9.5-8.5 9.5S7.5 15.5 7.5 9.5Z" fill="#f8c830" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M13.5 19h5l1 4.5h-7Z" fill="#d89a18" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="9" y="23.5" width="14" height="5" rx="1.4" fill="#8a5a2c" stroke="${INK}" stroke-width="1.8"/>
    <rect x="12.5" y="25.2" width="7" height="1.6" rx="0.8" fill="#f8c830"/>
    <path d="M11 6v4c0 2.6 1 4.6 2.6 5.8" fill="none" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round"/>`,

  // the volume rows: music and effects
  music: `<path d="M12 23V7l14-3v15" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M12 23V7l14-3v15" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="8.5" cy="23.5" rx="4.5" ry="3.6" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="22.5" cy="19.5" rx="4.5" ry="3.6" fill="#fff" stroke="${INK}" stroke-width="2"/>`,
  bell: `<path d="M16 4a2 2 0 0 1 2 2v.6c4.2 1 6.6 4.6 6.6 9v4.4l2.4 3.4H5l2.4-3.4v-4.4c0-4.4 2.4-8 6.6-9V6a2 2 0 0 1 2-2Z" fill="#f8c830" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12.6 26.5a3.4 3.4 0 0 0 6.8 0Z" fill="#d89a18" stroke="${INK}" stroke-width="1.8"/>
    <path d="M11 17v-1.4c0-2.6 1.2-4.6 3.2-5.6" fill="none" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round"/>`,

  // Abandon run (the title's plate, the device's Settings): battle's Run, a figure running (the user's second picture), in
  // currentColor so it takes the LCD's ink on the plate (the user's pick, 2026-10-07: it replaced the Escape Rope)
  run: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 9.4L15 18" stroke-width="5"/>
      <path d="M19.4 8.2l-5-.6-4.6 3.6M21 9.6l2.4 5h5.4M15 18l-4.8 4.2H3.8M15.6 18.4l4.8 3.6-3 6" stroke-width="3.4"/>
    </g>
    <circle cx="24" cy="5.4" r="3.4" fill="currentColor"/>`,

  // the old Escape Rope: a coil of rope
  rope: `<ellipse cx="16" cy="17" rx="12" ry="9" fill="none" stroke="${INK}" stroke-width="6"/>
    <ellipse cx="16" cy="17" rx="12" ry="9" fill="none" stroke="#d09a58" stroke-width="3.6"/>
    <ellipse cx="16" cy="17" rx="7" ry="5" fill="none" stroke="${INK}" stroke-width="5.4"/>
    <ellipse cx="16" cy="17" rx="7" ry="5" fill="none" stroke="#e8b878" stroke-width="3"/>
    <ellipse cx="16" cy="17" rx="12" ry="9" fill="none" stroke="#8a5a2c" stroke-width="1" stroke-dasharray="1.4 2.2"/>
    <path d="M26 21c2 2.6 2.4 5.6 1.2 8" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M26 21c2 2.6 2.4 5.6 1.2 8" fill="none" stroke="#d09a58" stroke-width="2.4" stroke-linecap="round"/>`,

  // ---- the Collection device's apps (js/collection.js; the user's call, 2026-10-05) ----

  // Moves: two cards fanned, the front one with a lightning bolt in its art window
  moves: `<rect x="4" y="5" width="15" height="21" rx="2.4" transform="rotate(-12 11.5 15.5)" fill="#3c6cd8" stroke="${INK}" stroke-width="2"/>
    <rect x="7" y="8.4" width="9" height="14.2" rx="1.4" transform="rotate(-12 11.5 15.5)" fill="none" stroke="#8cb4ff" stroke-width="1.2"/>
    <rect x="12" y="5" width="16" height="22.5" rx="2.4" transform="rotate(8 20 16.25)" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <g transform="rotate(8 20 16.25)">
      <rect x="14.2" y="7.4" width="11.6" height="10" rx="1.2" fill="#ffe6a0" stroke="${INK}" stroke-width="1.2"/>
      <path d="M21.2 8.6l-4 5h2.8l-1.4 3.4 4.4-5.2h-2.8Z" fill="#f8c020" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>
      <rect x="14.2" y="19.6" width="11.6" height="1.6" rx="0.8" fill="#c8ccd8"/>
      <rect x="14.2" y="22.6" width="8" height="1.6" rx="0.8" fill="#c8ccd8"/>
    </g>`,

  // Relics: a Fire Stone, the evolution stone with its flame inside
  relics: `<path d="M12 3.5h8.4l6.4 6.2 1.4 9.4-5.2 8.4H9.8l-5.6-7.8 1.2-9.6Z" fill="#f2672a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M27 19.1l-5.2 8.4H9.8l-5.6-7.8c4 2.6 9 3.4 13.6 2.2 3.4-.8 6.6-1.8 9.2-2.8Z" fill="#c23e1a"/>
    <path d="M16.2 7.6c.6 3 3.8 4.6 4.8 7.8 1.2 3.6-.8 7.6-5 7.6s-5.8-3.2-5-6.4c.4-1.6 1.6-2.4 2-4.2 1.2 1 1.6 2.2 1.6 3.4.6-2.6-.2-5.4 1.6-8.2Z" fill="#ffb02a" stroke="#a8300e" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M16.2 14.8c.4 1.6 2.2 2.4 2.2 4.4 0 1.6-1 2.4-2.2 2.4s-2.2-.8-2.2-2.2c0-1.6 1.4-2.4 2.2-4.6Z" fill="#fff0a0"/>
    <path d="M8 10.2l3.6-4.4" stroke="#ffd0b0" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M12 3.5h8.4l6.4 6.2 1.4 9.4-5.2 8.4H9.8l-5.6-7.8 1.2-9.6Z" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,

  // Items: the games' Potion (Bulbapedia's art), a white trigger head with its purple nozzle on a round purple bottle
  items: `<path d="M7.6 20.2C5.4 21.8 4.8 24.2 5.2 26.4c.4 2.2 1.8 3.1 3.8 3.1h12.8c2 0 3.3-1.1 3.3-3.1 0-2.8-2.2-5.6-4.6-7.4Z" fill="#6a5596" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M7.4 21.4C6 22.8 5.8 25 6.2 26.6c.4 1.4 1.4 1.9 2.8 1.9h1.4c-1.6-1.6-2.2-4.4-1.4-7.6Z" fill="#8a7ac6"/>
    <ellipse cx="18" cy="23.4" rx="1.5" ry="1.3" fill="#a898e0"/>
    <path d="M8.4 2.8C11 2 16 1.8 18.6 2.6c2.6.8 3.4 3 2.6 5.4-.6 1.6-1.6 2.4-1.4 3.8.2 1.2 1.8 2 1.8 3.8 0 1.6-.8 2.8-1.6 3.4l-8.6 2.4c-2.4-.4-4.8-1-5.2-2.6-.4-1.8.8-3.4 1.6-5.2.6-1.6-.2-3-.8-4.6L6.8 5.6Z" fill="#f6f4f8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M11.8 9c3.2-.4 7.2.6 8 2.8.2 1.2 1.8 2 1.8 3.8 0 1.6-.8 2.8-1.6 3.4l-8.6 2.4c-.8-3.4-.4-8.4.4-12.4Z" fill="#bab0c4"/>
    <path d="M6.6 17.6c.6 1.6 2.6 2.2 4.8 2.6" fill="none" stroke="#bab0c4" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M13.4 3.6c1.6-.3 3.4-.3 4.6 0" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
    <path d="M8.4 2.8l2.8 2.8c.8 2.4.4 6.4-.8 10-.6 2 .2 4 1 5.8" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M14.2 20.6c.2-3.4.6-6.8 1.2-8 .6-1.2 1.6-1.2 2.2 0 .8 2 1.4 4.6 2.4 6.6Z" fill="#6a5596" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M14.4 20.6c1.6.6 3.6.4 5.2-.8" fill="none" stroke="#3a2e5c" stroke-width="1" stroke-linecap="round"/>
    <ellipse cx="8.6" cy="7.6" rx="2.6" ry="2.8" fill="#8070c8" stroke="${INK}" stroke-width="1.6"/>
    <path d="M9.4 5.6l1.6.4M9.8 7.6h1.6M9.4 9.6l1.6-.4" stroke="#5a4a9e" stroke-width=".9" stroke-linecap="round"/>
    <ellipse cx="7.4" cy="7.8" rx=".9" ry="1.5" fill="#2e2448"/>`,

  // Stats: a little screen with three rising bars
  stats: `<rect x="3" y="4" width="26" height="23" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/>
    <path d="M6.5 23.5h19" stroke="#c8ccd8" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="7.5" y="16" width="4.6" height="7.5" rx="1" fill="#e23a2c" stroke="${INK}" stroke-width="1.4"/>
    <rect x="13.7" y="11.5" width="4.6" height="12" rx="1" fill="#3c8cf0" stroke="${INK}" stroke-width="1.4"/>
    <rect x="19.9" y="7" width="4.6" height="16.5" rx="1" fill="#62c050" stroke="${INK}" stroke-width="1.4"/>`,

  // Record Book: a blue book, a gold star on its cover and a red bookmark
  record: `<path d="M8 3.5h17a1.5 1.5 0 0 1 1.5 1.5v20.5H8.5a2.5 2.5 0 0 0 0 5h18" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M8.5 25.5h18v5h-18a2.5 2.5 0 0 1 0-5Z" fill="#f4ecd4" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M8 3.5h17a1.5 1.5 0 0 1 1.5 1.5v20.5H8.5A2.5 2.5 0 0 0 6 28V6a2.5 2.5 0 0 1 2-2.5Z" fill="#3c5cd0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M9.5 3.5v22" stroke="#24389a" stroke-width="2"/>
    <path d="M18 8.4l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5Z" fill="#f8c830" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M21 25.5v6l2-1.6 2 1.6v-6" fill="#e23a2c" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,

  // Hall of Fame: a gold crown set with jewels
  fame: `<path d="M4 11l6 5.5L16 6l6 10.5 6-5.5-2.4 14H6.4Z" fill="#f8c830" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="6" y="22.5" width="20" height="5.5" rx="1.4" fill="#e0a020" stroke="${INK}" stroke-width="2"/>
    <circle cx="16" cy="25.2" r="1.6" fill="#e23a2c" stroke="${INK}" stroke-width="1"/>
    <circle cx="10.4" cy="25.2" r="1.2" fill="#3c8cf0" stroke="${INK}" stroke-width="1"/>
    <circle cx="21.6" cy="25.2" r="1.2" fill="#62c050" stroke="${INK}" stroke-width="1"/>
    <circle cx="4" cy="10" r="1.8" fill="#f8c830" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="16" cy="4.6" r="1.8" fill="#f8c830" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="28" cy="10" r="1.8" fill="#f8c830" stroke="${INK}" stroke-width="1.4"/>
    <path d="M9 18.5l1.2 2.6M15.2 11.6l-.6 6" stroke="#fff6c0" stroke-width="1.4" stroke-linecap="round"/>`,

  // a locked app: a gold padlock
  lock: `<path d="M10 14v-3.5a6 6 0 0 1 12 0V14" fill="none" stroke="${INK}" stroke-width="5"/>
    <path d="M10 14v-3.5a6 6 0 0 1 12 0V14" fill="none" stroke="#c8ccd8" stroke-width="2.6"/>
    <rect x="6" y="13.5" width="20" height="15" rx="3" fill="#f8c830" stroke="${INK}" stroke-width="2"/>
    <path d="M16 18.5a2 2 0 0 1 1.2 3.6v2.4h-2.4v-2.4a2 2 0 0 1 1.2-3.6Z" fill="${INK}"/>
    <path d="M8.6 16.6v8" stroke="#fff6c0" stroke-width="1.4" stroke-linecap="round"/>`,

  // Settings: a grey cog
  settings: `<path d="M13.8 3h4.4l.7 3.4 2.3 1 2.9-1.9 3.1 3.1-1.9 2.9 1 2.3 3.4.7v4.4l-3.4.7-1 2.3 1.9 2.9-3.1 3.1-2.9-1.9-2.3 1-.7 3.4h-4.4l-.7-3.4-2.3-1-2.9 1.9-3.1-3.1 1.9-2.9-1-2.3L3 18.2v-4.4l3.4-.7 1-2.3-1.9-2.9 3.1-3.1 2.9 1.9 2.3-1Z" fill="#e4e8f0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="16" cy="16" r="4.6" fill="#7a8498" stroke="${INK}" stroke-width="2"/>`,

  // ---- the Pokédex's Rewards (js/pokedex.js) ----
  star: `<path d="M16 3l3.8 7.8 8.6 1.2-6.2 6 1.5 8.5L16 22.4l-7.7 4.1 1.5-8.5-6.2-6 8.6-1.2Z" fill="#f8c830" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14.6 9.6l-1.4 2.8" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round"/>`,

  // a wild fight: two crossed swords
  swords: `<path d="M5 5l16 16M27 5L11 21" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M5 5l16 16M27 5L11 21" stroke="#e4e8f0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M17.5 24.5l7-7M7.5 17.5l7 7" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M17.5 24.5l7-7M7.5 17.5l7 7" stroke="#f8c830" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M22 22l4.6 4.6M10 22l-4.6 4.6" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M22 22l4.6 4.6M10 22l-4.6 4.6" stroke="#a8642c" stroke-width="2.4" stroke-linecap="round"/>`,

  // an Alpha: a skull
  skull: `<path d="M16 3.5c-6.6 0-11 4.6-11 10.5 0 3.6 1.6 6 4 7.4V26a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.6c2.4-1.4 4-3.8 4-7.4 0-5.9-4.4-10.5-11-10.5Z" fill="#f4f4f6" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="11.4" cy="14.6" rx="3" ry="3.4" fill="${INK}"/><ellipse cx="20.6" cy="14.6" rx="3" ry="3.4" fill="${INK}"/>
    <path d="M16 18.6l-1.7 2.8h3.4Z" fill="${INK}"/>
    <path d="M13 24v4M16 24v4M19 24v4" stroke="${INK}" stroke-width="1.4"/>
    <path d="M8.6 9.6c.8-1.6 2-2.6 3.4-3.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,

  // a boss: a red horned face, scowling
  boss: `<path d="M8.5 10L5 2.5l7.4 4M23.5 10L27 2.5l-7.4 4" fill="#f4ecd4" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="16" cy="17.5" r="11.5" fill="#e23a2c" stroke="${INK}" stroke-width="2"/>
    <path d="M8.5 12.5l5.5 2.6M23.5 12.5L18 15.1" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="12" cy="17" r="1.9" fill="#ffe060" stroke="${INK}" stroke-width="1.2"/><circle cx="20" cy="17" r="1.9" fill="#ffe060" stroke="${INK}" stroke-width="1.2"/>
    <path d="M10 22.2c2.4 3 9.6 3 12 0Z" fill="#5a0c12" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M12.4 22.6l1 2.4 1-2.2ZM19.6 22.6l-1 2.4-1-2.2Z" fill="#fff"/>
    <path d="M7.4 14.6c.4-2 1.4-3.6 2.8-4.6" fill="none" stroke="#ff9a8a" stroke-width="1.6" stroke-linecap="round"/>`,

  // PokéCoins: a gold coin
  coin: `<circle cx="16" cy="16" r="12.5" fill="#f8c830" stroke="${INK}" stroke-width="2"/>
    <circle cx="16" cy="16" r="8.6" fill="none" stroke="#c8901a" stroke-width="1.6"/>
    <path d="M13.6 21.5v-11h3.4a3.2 3.2 0 0 1 0 6.4h-3.4" fill="none" stroke="#a86a10" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8.2 12.4a8.6 8.6 0 0 1 4-4.4" fill="none" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round"/>`,

  // Pokédollars: a green coin stamped with ₽, so it never reads as a PokéCoin
  pokedollar: `<circle cx="16" cy="16" r="12.5" fill="#48b060" stroke="${INK}" stroke-width="2"/>
    <circle cx="16" cy="16" r="9" fill="none" stroke="#2e8044" stroke-width="1.4"/>
    <path d="M13.2 22.5V9.5h4.2a3.4 3.4 0 0 1 0 6.8h-4.2M10.6 19.2h6.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8.2 12.4a8.6 8.6 0 0 1 4-4.4" fill="none" stroke="#bff0c8" stroke-width="1.6" stroke-linecap="round"/>`,

  // Mom's Savings: two banknotes
  cash: `<rect x="5" y="5.5" width="24" height="15" rx="2" fill="#5aa848" stroke="${INK}" stroke-width="2"/>
    <rect x="3" y="11" width="24" height="15" rx="2" fill="#8cd070" stroke="${INK}" stroke-width="2"/>
    <rect x="6" y="14" width="18" height="9" rx="1.4" fill="none" stroke="#3a8a3a" stroke-width="1.4"/>
    <circle cx="15" cy="18.5" r="3.2" fill="#f8c830" stroke="${INK}" stroke-width="1.2"/>`,

  // Oak's Advice: a mortarboard and its tassel
  cap: `<path d="M8 15v6c0 2.4 3.6 4 8 4s8-1.6 8-4v-6" fill="#3a3a4a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M2 12l14-7 14 7-14 7Z" fill="#4a4a5c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 12l8.6 2.6V22" fill="none" stroke="#f8c830" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="24.6" cy="23.2" r="1.8" fill="#f8c830" stroke="${INK}" stroke-width="1"/>
    <path d="M9 10.6l6-3" stroke="#8a8aa4" stroke-width="1.4" stroke-linecap="round"/>`,

  // the Crystal Depths: a cut gem
  gem: `<path d="M9 5h14l6 7-13 16L3 12Z" fill="#7ad8f8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M3 12h26M12 12l4-7 4 7M12 12l4 16 4-16M9 5l3 7M23 5l-3 7" fill="none" stroke="#2a78a8" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M9 5h14l6 7-13 16L3 12Z" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M7.4 11l2.4-3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,

  // ---- the types (the Moves app's tabs) ----
  fire: `<path d="M16 2.5c1.2 4.6 6 7 8.4 11.6 2.6 5 .4 13.4-8.4 13.4S5 23.4 7.4 17.8c1.2-2.8 3.4-4 3.6-7.4 2.4 1.8 2.8 4 2.8 5.6.8-3.8-.6-9 2.2-13.5Z" fill="#ff7a2a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 14c.6 2.6 3.6 3.8 3.6 7.2 0 2.6-1.6 4.2-3.6 4.2s-3.6-1.6-3.6-3.8c0-2.4 2.4-3.6 3.6-7.6Z" fill="#ffd23a"/>`,
  grass: `<path d="M5 27C4 14 12 5 27 4c1 14-7 23-22 23Z" fill="#62c050" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M6 26C12 19 17 13 23 8M12 19.5v-5M16 15.6h5" fill="none" stroke="#2e7a30" stroke-width="1.8" stroke-linecap="round"/>`,
  water: `<path d="M16 3c4 6 10 11 10 17a10 10 0 0 1-20 0c0-6 6-11 10-17Z" fill="#3c8cf0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M10.6 19.6c0 2.8 1.6 5 3.8 5.8" fill="none" stroke="#bfe4ff" stroke-width="2" stroke-linecap="round"/>`,
  normal: `<circle cx="16" cy="16" r="12.5" fill="#e4e8f0" stroke="${INK}" stroke-width="2"/>
    <path d="M16 7.4l7.6 13.2H8.4ZM16 24.6L8.4 11.4h15.2Z" fill="#9aa2c8" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`,
  psychic: `<path d="M9 23.5h14l2.4 5H6.6Z" fill="#a8642c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="16" cy="14" r="10.5" fill="#c08af0" stroke="${INK}" stroke-width="2"/>
    <path d="M12 17.6c1.6 2 6 2 8-1.4" fill="none" stroke="#f0d8ff" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="12" cy="10" rx="2.4" ry="3.2" transform="rotate(30 12 10)" fill="#fff" opacity="0.8"/>`,

  // Main menu: a little house
  home: `<path d="M3.5 15.5L16 4.5l12.5 11" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 13.5V28h18V13.5L16 5.6Z" fill="#fff4dc" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M3.5 15.5L16 4.5l12.5 11" fill="none" stroke="#e23a2c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="13" y="19" width="6" height="9" rx="1" fill="#c87a3a" stroke="${INK}" stroke-width="1.6"/>
    <rect x="19.5" y="14" width="3.6" height="3.6" rx="0.6" fill="#8cc8ff" stroke="${INK}" stroke-width="1.2"/>`,

  // Leave a room: an open door, a green arrow walking out of it
  leave: `<path d="M5 28.5V5h14v23.5" fill="#5a3a24" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M5 28.5V5l9 3v23.5Z" fill="#c87a3a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="11.6" cy="18" r="1.2" fill="#ffe08a"/>
    <path d="M17 16.5h8.5M22 12.5l4.2 4-4.2 4" fill="none" stroke="${INK}" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 16.5h8.5M22 12.5l4.2 4-4.2 4" fill="none" stroke="#5ad06a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,

  // Skip a reward: a fast-forward to a bar
  skip: `<path d="M4.5 7.5v17L15 16ZM14.5 7.5v17L25 16Z" fill="#fff4dc" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="24.5" y="7" width="3.6" height="18" rx="1" fill="#fff4dc" stroke="${INK}" stroke-width="2"/>`,

  // ---- the device's text icons (a run's full record, the Pokédex's move kinds, the Safari areas) ----
  heart: `<path d="M16 27.5C9 22.5 3.5 17.6 3.5 11.6c0-4 3.1-7.1 6.9-7.1 2.6 0 4.5 1.4 5.6 3.4 1.1-2 3-3.4 5.6-3.4 3.8 0 6.9 3.1 6.9 7.1 0 6-5.5 10.9-12.5 15.9Z" fill="#f0405a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M7.6 11c.2-1.8 1.4-3 3-3.2" fill="none" stroke="#ffc0cc" stroke-width="2" stroke-linecap="round"/>`,
  turns: `<path d="M25 12.5A9.5 9.5 0 0 0 8 10.5M7 19.5A9.5 9.5 0 0 0 24 21.5" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/>
    <path d="M25 12.5A9.5 9.5 0 0 0 8 10.5M7 19.5A9.5 9.5 0 0 0 24 21.5" fill="none" stroke="#3c8cf0" stroke-width="3" stroke-linecap="round"/>
    <path d="M3.4 6.6l1.8 8.6 8-4.2Z" fill="#3c8cf0" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M28.6 25.4l-1.8-8.6-8 4.2Z" fill="#3c8cf0" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
  burst: `<path d="M16 2l3 7.5 7.5-3.5-3 7.6 7 2.6-7 3 3.4 7.4-7.6-3L16 30l-3-7.4-7.6 3 3.4-7.4-7-3 7-2.6-3-7.6L13 9.5Z" fill="#ff7a2a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 9.5l1.8 4.2 4.2-1.6-1.8 4.2 4 1.8-4.2 1.4 1.6 4.2-4.2-1.8L16 24l-1.6-4.1-4.2 1.8 1.6-4.2-4.2-1.4 4-1.8-1.8-4.2 4.2 1.6Z" fill="#ffd23a"/>`,
  drop: `<path d="M16 3c4 6 10 11 10 17a10 10 0 0 1-20 0c0-6 6-11 10-17Z" fill="#d8283c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M10.6 19.6c0 2.8 1.6 5 3.8 5.8" fill="none" stroke="#ff9aa8" stroke-width="2" stroke-linecap="round"/>`,
  target: `<circle cx="14" cy="18" r="11.5" fill="#e23a2c" stroke="${INK}" stroke-width="2"/>
    <circle cx="14" cy="18" r="7.6" fill="#fff" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="14" cy="18" r="3.8" fill="#e23a2c" stroke="${INK}" stroke-width="1.4"/>
    <path d="M14 18L27 5" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M24.5 3.5l1 3 3 1 2-2-3-1-1-3Z" fill="#3c8cf0" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`,
  // the Poké Mart: its blue awning over a white shop
  mart: `<rect x="5" y="12" width="22" height="16" rx="1.5" fill="#f4f4f6" stroke="${INK}" stroke-width="2"/>
    <path d="M3.5 13l2.6-8.5h19.8l2.6 8.5Z" fill="#3c6cd8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M11.4 4.8l-1.4 8M16 4.8v8M20.6 4.8l1.4 8" stroke="#bcd4ff" stroke-width="1.6"/>
    <rect x="13" y="19" width="6" height="9" fill="#8cc8ff" stroke="${INK}" stroke-width="1.6"/>
    <rect x="7.6" y="16" width="3.6" height="3.6" rx="0.6" fill="#8cc8ff" stroke="${INK}" stroke-width="1.2"/>
    <rect x="20.8" y="16" width="3.6" height="3.6" rx="0.6" fill="#8cc8ff" stroke="${INK}" stroke-width="1.2"/>`,
  // the Pokémon Center: a red roof over a white front with its cross
  center: `<rect x="5" y="12" width="22" height="16" rx="1.5" fill="#fff4f0" stroke="${INK}" stroke-width="2"/>
    <path d="M3 13.5L16 4l13 9.5Z" fill="#e23a2c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 15.5h4v3h3v4h-3v3h-4v-3h-3v-4h3Z" fill="#e23a2c" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`,
  // PP Up: two stat-raise arrows
  ppup: `<path d="M6 17L16 7l10 10M6 27l10-10 10 10" fill="none" stroke="${INK}" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 17L16 7l10 10M6 27l10-10 10 10" fill="none" stroke="#62c050" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  sparkle: `<path d="M13 3c1 6.4 3.6 9 10 10-6.4 1-9 3.6-10 10-1-6.4-3.6-9-10-10 6.4-1 9-3.6 10-10Z" fill="#f8d838" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M24.5 17.5c.5 3 1.8 4.5 5 5-3.2.5-4.5 2-5 5-.5-3-1.8-4.5-5-5 3.2-.5 4.5-2 5-5Z" fill="#fff4a8" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
  shield: `<path d="M16 3l11 4v8c0 7-4.6 12-11 14.5C9.6 27 5 22 5 15V7Z" fill="#8a9ab8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 6.4l8 2.9v5.9c0 5-3.2 8.8-8 10.9Z" fill="#c8d4ec"/>`,
  // Buff: a flexed arm
  muscle: `<path d="M5 27.5c0-7 1.6-12 4.6-16.4L12 6c1-2 3.4-2.6 5-1.2l1.8 1.6c1.2 1 .8 2.8-.6 3.4L15 11l-1 4.8c2.4-2.2 6-2.8 9-1.4 3.4 1.6 5 5 4.4 8.4-.6 3.2-3.4 4.7-6.6 4.7Z" fill="#f8c890" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 15.8c1 2.4 3.8 3.4 6.4 2.4" fill="none" stroke="#c88a50" stroke-width="1.6" stroke-linecap="round"/>`,
  // Status: a grey junk card
  status: `<rect x="7" y="3.5" width="18" height="25" rx="2.6" fill="#b8bcc8" stroke="${INK}" stroke-width="2"/>
    <path d="M11 12.5c2-3 3 3 5 0s3 3 5 0M11 19.5c2-3 3 3 5 0s3 3 5 0" fill="none" stroke="#6a5596" stroke-width="2" stroke-linecap="round"/>`,
  check: `<rect x="3.5" y="3.5" width="25" height="25" rx="5" fill="#4cb84a" stroke="${INK}" stroke-width="2"/>
    <path d="M9 16.5l4.6 4.6L23.5 11" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  trash: `<path d="M12.5 6.5V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" fill="none" stroke="${INK}" stroke-width="2"/>
    <path d="M7.5 10.5h17l-1.6 16a2 2 0 0 1-2 1.8h-9.8a2 2 0 0 1-2-1.8Z" fill="#c8ccd8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="4.5" y="6.5" width="23" height="4.5" rx="1.6" fill="#e4e6ee" stroke="${INK}" stroke-width="2"/>
    <path d="M12.6 14.5l.5 10M16 14.5v10M19.4 14.5l-.5 10" stroke="#7c8090" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 13.2l1.1 11" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`,
  flower: `<g fill="#fff4a8" stroke="${INK}" stroke-width="1.8"><circle cx="24" cy="16" r="5.4"/><circle cx="20" cy="22.9" r="5.4"/><circle cx="12" cy="22.9" r="5.4"/><circle cx="8" cy="16" r="5.4"/><circle cx="12" cy="9.1" r="5.4"/><circle cx="20" cy="9.1" r="5.4"/></g>
    <circle cx="16" cy="16" r="5" fill="#f0a020" stroke="${INK}" stroke-width="1.8"/>`,
  tree: `<rect x="13.5" y="25" width="5" height="5" rx="1" fill="#8a5a2c" stroke="${INK}" stroke-width="1.8"/>
    <path d="M16 2.5l7 9h-3.4l6 7.5h-3.6l5 7H5l5-7H6.4l6-7.5H9Z" fill="#3a9a48" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
  mushroom: `<path d="M11.5 18h9l1 9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 10.5 27Z" fill="#f4ecd4" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M3.5 18.5C3.5 10 9 4 16 4s12.5 6 12.5 14.5c0 1-.8 1.5-1.8 1.5H5.3c-1 0-1.8-.5-1.8-1.5Z" fill="#e23a2c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <g fill="#fff"><circle cx="10.5" cy="12" r="2.4"/><circle cx="19" cy="8.6" r="2"/><circle cx="23" cy="15" r="1.8"/><circle cx="15" cy="15.6" r="1.6"/></g>`,
  mountain: `<path d="M2 27.5L12 8l5 8 3-4.5 10 16Z" fill="#8a94a8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 8.6l-3.4 6.6 2-1 1.6 1.6 1.6-1.6 1.8 1.2Z" fill="#fff"/>
    <path d="M20 12.2l-2.2 3.2 1.2-.4 1 1 1-1 1.2.4Z" fill="#fff"/>`,
  cactus: `<path d="M16 27V7M16 19h-5a2 2 0 0 1-2-2v-4M16 15h5a2 2 0 0 0 2-2V9" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 27V7M16 19h-5a2 2 0 0 1-2-2v-4M16 15h5a2 2 0 0 0 2-2V9" fill="none" stroke="#4caa50" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 29h18" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
};

/* How to play's battle terms and rooms (js/howto.js), each in its term's colour (TERM_KIND in js/ui.js) */
Object.assign(ART, {
  // Weak: a purple fist-arrow pointing down
  weak: `<circle cx="16" cy="16" r="13" fill="#9a5ad8" stroke="${INK}" stroke-width="2"/>
    <path d="M16 7.5v13M10 15.5l6 6.5 6-6.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Vulnerable: a purple heart cracked down the middle
  vulnerable: `<path d="M16 27.5C9 22.5 3.5 17.6 3.5 11.6c0-4 3.1-7.1 6.9-7.1 2.6 0 4.5 1.4 5.6 3.4 1.1-2 3-3.4 5.6-3.4 3.8 0 6.9 3.1 6.9 7.1 0 6-5.5 10.9-12.5 15.9Z" fill="#9a5ad8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 8l-2.6 5.4 4.2 3-3.2 5.2 1.6 5.4" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    <ellipse cx="9.6" cy="10.4" rx="2" ry="2.8" transform="rotate(30 9.6 10.4)" fill="#fff" opacity="0.5"/>`,
  // Tide: a curling blue wave
  tide: `<path d="M2.5 26.5c3-1 4.5-3 5-7C8.6 11 14.4 5 21.4 5.4c4.4.3 7.6 3.6 7.6 7.6 0 3.4-2.4 5.6-5.2 5.6-2.4 0-4-1.6-4-3.6 0-1.6 1.2-2.8 2.6-2.8-2.4-1.8-7.2-.4-8.4 4.6-1 4.2 1 8.2 5.6 9.7Z" fill="#3c8cf0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M2.5 26.5h27" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M10.6 16.5c1-4.4 4.6-8 9.4-8.4" fill="none" stroke="#bfe0ff" stroke-width="2" stroke-linecap="round"/>`,
  // Leech Seed: a sprout out of a seed
  seed: `<path d="M16 26V14" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M16 26V14" stroke="#62c050" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 15.5C15 9 10 5.5 3.5 6c.4 6.6 5 10 12.5 9.5ZM16 13c.8-5.2 4.8-8 10.5-7.6-.3 5.4-4.2 8.2-10.5 7.6Z" fill="#62c050" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="16" cy="26" rx="7" ry="3.8" fill="#a8763c" stroke="${INK}" stroke-width="2"/>`,
  // Treasure: a wooden chest with a gold clasp
  chest: `<path d="M4 14h24v13a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 4 27Z" fill="#b8763a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M4 14v-3a7 7 0 0 1 7-7h10a7 7 0 0 1 7 7v3Z" fill="#d08c46" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M4 14h24M9.5 4.6V28.5M22.5 4.6V28.5" stroke="${INK}" stroke-width="1.6"/>
    <rect x="13" y="11" width="6" height="7.5" rx="1.2" fill="#f8c830" stroke="${INK}" stroke-width="1.8"/>
    <circle cx="16" cy="14.6" r="1.2" fill="${INK}"/>`,
  // PP: a lightning bolt on a blue orb, like the battle's PP pill
  pp: `<circle cx="16" cy="16" r="13" fill="#2c64c8" stroke="${INK}" stroke-width="2"/>
    <circle cx="16" cy="16" r="10" fill="#4a8ef0"/>
    <path d="M18 5.5L9.5 17.5h6l-2 9 9-12.5h-6.2Z" fill="#f8d838" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
});

/* Emoji with a smooth twin. Inside a [data-smooth-icons] part of the page (the Collection device and the windows it
   shares pages with) js/icons.js swaps these in instead of its pixel icons; cards keep theirs, to match battle. */
export const SMOOTH_EMOJI = {
  '⚔': 'swords', '🔁': 'turns', '👑': 'fame', '❤': 'heart', '🔄': 'turns', '🃏': 'moves', '💥': 'burst', '🩸': 'drop', '🎯': 'target',
  '🎒': 'items', '🧴': 'items', '💴': 'pokedollar', '🏪': 'mart', '🏥': 'center', '❓': 'help', '💻': 'pc', '⏫': 'ppup',
  '✨': 'sparkle', '💀': 'skull', '💎': 'gem', '🗼': 'tower', '⭐': 'star', '🏆': 'trophy', '💰': 'coin', '🔒': 'lock',
  '✅': 'check', '🛡': 'shield', '💪': 'muscle', '🗂': 'status', '👹': 'boss', '🎓': 'cap', '🗑': 'trash', '🏃': 'run',
  '🔥': 'fire', '💧': 'water', '🌿': 'grass', '🔯': 'normal', '🔮': 'psychic',
  '🌼': 'flower', '🌲': 'tree', '🍄': 'mushroom', '🏔': 'mountain', '🌵': 'cactus',
};

export function smoothIcon(name, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `smooth-icon si-${name}${className ? ` ${className}` : ''}`);
  svg.innerHTML = ART[name];
  return svg;
}

/** A glyph's raw SVG markup (on the 32x32 grid), for art that sets it on something of its own (js/augment-art.js). */
export const smoothArt = (name) => ART[name];

/* ============================================================
   smooth-icons.js  -  the title screen's icons as smooth vector art
   (the user's call, 2026-10-06: clean and smooth like the Poké Ball
   signs, no pixels), and since 2026-10-05 the Collection device's
   app icons. Every other screen keeps js/icons.js's pixel
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

  // the Escape Rope beside a saved run's nameplate: a coil of rope
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

  // Relics: Leftovers, a bitten red apple with its leaf
  relics: `<path d="M16 9.5c-2.4-1.6-6.4-1.8-8.6.8C5 13.2 5.2 18.6 7.6 22.8c1.8 3.2 4.4 5.4 6.6 4.8.9-.2 1.2-.6 1.8-.6s.9.4 1.8.6c2.2.6 4.8-1.6 6.6-4.8.6-1 1-2 1.4-3.2-1.8.4-3.4-1.4-3-3.2-1.6-.2-2.6-2-2-3.6.4-.9 1-1.4 1.6-1.6-2.4-1.6-5.4-1.4-7.4.3Z" fill="#e23a2c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 9.5c0-2.6.8-4.6 2.4-6" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M17 6.4c1.6-2.6 5-3.4 7.4-2-1.2 2.6-4.4 3.6-7.4 2Z" fill="#62c050" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M9.6 13.2c-1.2 1.6-1.6 3.8-1.2 6" fill="none" stroke="#ffb0a0" stroke-width="1.8" stroke-linecap="round"/>`,

  // Items: a Potion spray, purple with its white nozzle
  items: `<rect x="12.5" y="2.5" width="7" height="4" rx="1" fill="#f0f0f4" stroke="${INK}" stroke-width="1.6"/>
    <path d="M19.5 3.8h3.4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="11" y="6.5" width="10" height="4" rx="1" fill="#c8ccd8" stroke="${INK}" stroke-width="1.6"/>
    <path d="M11.5 10.5h9c3.6 2 6 5.6 6 9.6 0 5-4.4 8.4-10.5 8.4S5.5 25.1 5.5 20.1c0-4 2.4-7.6 6-9.6Z" fill="#9a5ad8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M7.8 19.5h16.4c0 3.6-3.4 6.2-8.2 6.2s-8.2-2.6-8.2-6.2Z" fill="#6a34a8"/>
    <rect x="11" y="15" width="10" height="5.2" rx="1.2" fill="#fff" stroke="${INK}" stroke-width="1.2"/>
    <path d="M16 15.8v3.6M14.2 17.6h3.6" stroke="#e23a2c" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M9 14.6c-1 1-1.6 2.4-1.8 3.6" fill="none" stroke="#e0c4ff" stroke-width="1.6" stroke-linecap="round"/>`,

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

  // Main menu: a little house
  home: `<path d="M3.5 15.5L16 4.5l12.5 11" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 13.5V28h18V13.5L16 5.6Z" fill="#fff4dc" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M3.5 15.5L16 4.5l12.5 11" fill="none" stroke="#e23a2c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="13" y="19" width="6" height="9" rx="1" fill="#c87a3a" stroke="${INK}" stroke-width="1.6"/>
    <rect x="19.5" y="14" width="3.6" height="3.6" rx="0.6" fill="#8cc8ff" stroke="${INK}" stroke-width="1.2"/>`,
};

export function smoothIcon(name, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `smooth-icon si-${name}${className ? ` ${className}` : ''}`);
  svg.innerHTML = ART[name];
  return svg;
}

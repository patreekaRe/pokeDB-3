/* ============================================================
   type-badge.js  -  a type as a round badge: a white glyph on the type's colour, the look of the games' own type
   icons (the user's ask, 2026-10-20: the emoji read badly at chip size). Drawn as SVG, so it stays sharp at any size.
   ============================================================ */

const C = '#fff';
const GLYPHS = {
  normal: `<circle cx="12" cy="12" r="5.3" fill="none" stroke="${C}" stroke-width="2.6"/>`,
  fire: `<path d="M12 4c1 3 5.2 5 5.2 9.6a5.2 5.2 0 0 1-10.4 0c0-2.1 1-3.5 2.1-4.5 0 1.7.8 2.7 1.9 2.9C10.4 9.2 11 6.6 12 4z"/>`,
  water: `<path d="M12 4.3c2.9 3.9 5.1 6.7 5.1 9.5a5.1 5.1 0 0 1-10.2 0c0-2.8 2.2-5.6 5.1-9.5z"/>`,
  grass: `<path d="M6.3 17.7C5.8 10.6 10.4 6 18 6c0 7.6-4.6 12.2-11.7 11.7z"/><path d="M7.2 16.8l7-7" stroke="var(--tb)" stroke-width="1.5" stroke-linecap="round"/>`,
  electric: `<path d="M13.8 3.8L7.2 13.2h4.3l-1.6 7 6.9-9.9h-4.4l1.4-6.5z"/>`,
  ice: `<path d="M12 4.8v14.4M5.8 8.4l12.4 7.2M5.8 15.6l12.4-7.2M9.8 5.9l2.2 1.8 2.2-1.8M9.8 18.1l2.2-1.8 2.2 1.8" fill="none" stroke="${C}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  fighting: `<rect x="6.3" y="7" width="11.4" height="10.4" rx="3.2"/><path d="M9.2 7.6v3.6M12 7.6v3.6M14.8 7.6v3.6M6.8 13.4h6" stroke="var(--tb)" stroke-width="1.3" stroke-linecap="round"/>`,
  poison: `<circle cx="12" cy="10.6" r="5.6"/><rect x="9" y="13.6" width="6" height="4.6" rx="1.4"/><circle cx="9.9" cy="10.6" r="1.4" fill="var(--tb)"/><circle cx="14.1" cy="10.6" r="1.4" fill="var(--tb)"/>`,
  ground: `<path d="M4.8 17.4L8.4 7.4h7.2l3.6 10z"/><path d="M7.4 12.6h9.2" stroke="var(--tb)" stroke-width="1.5"/>`,
  flying: `<path d="M5 15.6C7.6 9.4 12.3 6.3 19 6c-.9 1.8-2.2 2.9-3.7 3.5 1 .2 2 0 3-.4-1.2 2-2.8 3.2-4.8 3.8 1 .2 2 .1 3-.3-2 3.3-5.8 4.9-9.7 4.4-.7-.1-1.3-.6-1.8-1.4z"/>`,
  psychic: `<path d="M12.3 12.5a1.4 1.4 0 1 1 1.3-1.7 3 3 0 1 1-3.4-2.7 4.7 4.7 0 1 1-3.9 5.6" fill="none" stroke="${C}" stroke-width="2.1" stroke-linecap="round"/>`,
  bug: `<ellipse cx="12" cy="13.8" rx="4.6" ry="5"/><circle cx="12" cy="8" r="2.4"/><path d="M12 9.6v9.2" stroke="var(--tb)" stroke-width="1.2"/><path d="M10.6 6.3L9 4.4M13.4 6.3L15 4.4" stroke="${C}" stroke-width="1.4" stroke-linecap="round"/>`,
  rock: `<path d="M7.8 7.1l6.2-1.6 4.2 4.6-1.6 6.6-6.7 1.6L5.6 13z"/><path d="M9.8 11.6l4-2.3M9.8 11.6l.5 4.6" stroke="var(--tb)" stroke-width="1.2" fill="none"/>`,
  ghost: `<path d="M6.8 19.2v-7.6a5.2 5.2 0 0 1 10.4 0v7.6l-1.7-1.4-1.8 1.4-1.7-1.4-1.7 1.4-1.8-1.4z"/><circle cx="10.2" cy="11.6" r="1.3" fill="var(--tb)"/><circle cx="13.8" cy="11.6" r="1.3" fill="var(--tb)"/>`,
  dragon: `<path d="M5.2 17.8c.4-6.6 4.6-11 11.6-12.6-1.6 1.6-2.4 3.2-2.5 4.8 1.4-.8 2.9-1 4.5-.6-2.2 1-3.6 2.4-4.2 4.4 1.1-.2 2.1 0 3 .6-2.7.4-4.6 1.6-5.7 3.4z"/>`,
  dark: `<path d="M15.6 5.1a7.1 7.1 0 1 0 3.4 11.8 6 6 0 0 1-3.4-11.8z"/>`,
  steel: `<path d="M12 4.8l6.2 3.6v7.2L12 19.2l-6.2-3.6V8.4z"/><circle cx="12" cy="12" r="2.6" fill="var(--tb)"/>`,
  fairy: `<path d="M12 4.4l1.9 5.7 5.7 1.9-5.7 1.9-1.9 5.7-1.9-5.7L4.4 12l5.7-1.9z"/>`,
};
/** Each type's colour, the games' icon palette. */
export const TYPE_COLOR = {
  normal: '#919aa2', fire: '#ff9d55', water: '#5090d6', grass: '#63bc5a', electric: '#f4c430', ice: '#5fc9bc',
  fighting: '#ce416b', poison: '#aa6bc8', ground: '#d97845', flying: '#89aae3', psychic: '#fa7179', bug: '#91c12f',
  rock: '#c5b78c', ghost: '#5269ad', dragon: '#0b6dc3', dark: '#5a5465', steel: '#5a8ea2', fairy: '#ec8fe6',
};

/** A type's badge, a span holding its SVG; `label` names it for a screen reader when it stands alone. */
export function typeBadge(type, label = '') {
  const span = document.createElement('span');
  span.className = `type-badge tb-${type}`;
  const color = TYPE_COLOR[type] ?? TYPE_COLOR.normal;
  span.style.setProperty('--tb', color);
  span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="${color}"/><g fill="${C}">${GLYPHS[type] ?? GLYPHS.normal}</g></svg>`;
  if (label) { span.setAttribute('role', 'img'); span.setAttribute('aria-label', label); }
  return span;
}

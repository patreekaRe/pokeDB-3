/* journal-ranks.js  -  the Trainer's Journal's ranks by tasks claimed (js/data/journal.js), kept apart with no imports
   of its own: js/data/badges.js grants a badge per rank, and the Journal counts the badges, so neither can load the
   other first. */

export const JOURNAL_RANKS = [
  { at: 0, name: 'Beginner' }, { at: 5, name: 'Novice' }, { at: 15, name: 'Ace Trainer' }, { at: 30, name: 'Pro Trainer' },
  { at: 50, name: 'Expert' }, { at: 70, name: 'Elite' }, { at: 90, name: 'Grand Champion' },
];

/** Journal tasks claimed so far (save.journal.claimed holds nothing else). */
export const journalClaims = (save) => (save?.journal?.claimed || []).length;

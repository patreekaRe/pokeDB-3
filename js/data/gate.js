// The Sealed Gate (docs/roadmap.md): Mewtwo is trapped behind it, and every won run wears it down. Numbers agreed with the
// user, 2026-10-02: ~11 wins climbing the Levels once, ~13-15 at mixed Levels, ~9 mostly on Level 5.
export const GATE_HP = 1000;
export const GATE_HIT = [40, 50, 60, 75, 90, 120];   // a won run's damage, by Trainer Level
export const GATE_SLIVER = 50;                        // the lowest anything but a Level 5 win can take it
export const GATE_LOSS_CHIP = 15;                     // a run lost at the third biome's boss

/** Where an old save's gate stands: each win already in the Record Book counted once, never past the sliver. */
export function seedGate(saved) {
  if ((saved.unlocked || []).includes('mewtwo')) return 0;
  const dealt = (saved.hallOfFame || [])
    .filter(w => w.starter !== 'mewtwo')
    .reduce((sum, w) => sum + (GATE_HIT[w.level] ?? 0), 0);
  return Math.max(GATE_SLIVER, GATE_HP - dealt);
}

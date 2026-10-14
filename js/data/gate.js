// The Sealed Gate (docs/roadmap-done.md): Mewtwo is trapped behind it, and every won run wears it down. Numbers agreed with the
// user, 2026-10-02: ~11 wins climbing the Levels once, ~13-15 at mixed Levels, ~9 mostly on Level 5.
export const GATE_HP = 1000;
export const GATE_HIT = [40, 50, 60, 75, 90, 120];   // a won run's damage, by Trainer Level
export const GATE_SLIVER = 50;                        // the lowest anything but a Level 5 win can take it
export const GATE_STAGES = [0.75, 0.5, 0.25];         // its art steps down at these shares of its HP (the user's call), then breaks at 0

/** How broken the gate looks: 0 whole, 1-3 past each of GATE_STAGES, 4 broken. */
export const gateStage = (hp) => hp <= 0 ? 4 : GATE_STAGES.filter(s => hp / GATE_HP <= s).length;

/** Where an old save's gate stands: each win already in the Record Book counted once, never past the sliver. */
export function seedGate(saved) {
  if ((saved.unlocked || []).includes('mewtwo')) return 0;
  const dealt = (saved.hallOfFame || [])
    .filter(w => w.starter !== 'mewtwo')
    .reduce((sum, w) => sum + (GATE_HIT[w.level] ?? 0), 0);
  return Math.max(GATE_SLIVER, GATE_HP - dealt);
}

// The Sealed Gate (docs/roadmap-done.md): Mewtwo is trapped behind it, and every won run wears it down. Numbers agreed with the
// user, 2026-10-02: ~11 wins climbing the Levels once, ~13-15 at mixed Levels, ~9 mostly on Level 5.
export const GATE_HP = 1000;
export const GATE_HIT = [40, 50, 60, 75, 90, 120];   // a won run's damage, by Trainer Level
export const GATE_SLIVER = 50;                        // the lowest anything but a Level 5 win can take it
export const GATE_STAGES = [0.75, 0.5, 0.25];         // its art steps down at these shares of its HP (the user's call), then breaks at 0

/** `?gate=NNN`'s HP while playtesting (never saved), or null. */
export function gatePinned() {
  const pin = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('gate');
  return pin !== null && pin !== '' && !Number.isNaN(Number(pin)) ? Math.max(0, Math.min(GATE_HP, Math.round(Number(pin)))) : null;
}

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

/* Mewtwo at the broken gate (Towns step 5, the user's idea, 2026-10-14): with the towns on, a won run's fall no longer
   throws your Pokémon back. Mewtwo stands in the open gate and says what sleeps below, and that it needs the five
   Waystones' energy to beat it; its words follow the stones lit. With all five it holds the way open and the fall drops you
   into the Crystal Depths. Mewtwo's own runs go down without them, as they always have: it is the one holding the door. */
const STORY = [
  'So. The one whose strikes broke my seal.',
  'I did not wait here to thank you. Listen.',
  'Far below this gate sleeps Eternatus. The seal held it down, and held me with it.',
  'Now the seal is broken, and it stirs. If it wakes, the sky goes dark over every land you crossed.',
  'I cannot face it alone. I need the energy of the five Waystones.',
  'They cracked when this gate was shut. Their shards are crystal from down there.',
];

/** What Mewtwo says at the gate: `lit` Waystones burning (0-5), `first` the first time you meet it there. Five lit is the
    way opening; fewer, it holds the way shut and says how many are left. */
export function gateTalk(lit, first = false) {
  const story = first ? STORY : [];
  if (lit >= 5) return [...story, ...(first
    ? ['And all five burn already. Their light reaches all the way down here.', 'It is enough. I will hold the way open.', 'Eternatus waits at the bottom of the Depths. Go down, and end it.']
    : ['All five Waystones burn. The way is open.', 'Go down, and end it.'])];
  if (first) return [...story, lit
    ? `${['', 'One', 'Two', 'Three', 'Four'][lit]} of the five ${lit === 1 ? 'burns' : 'burn'} already. Mend the rest, and I will open the way.`
    : 'The towns at the edge of each land keep them. Mend all five, and I will open the way.'];
  if (!lit) return ['Not one Waystone burns yet. Eternatus stirs below.', 'Mend all five, and I will open the way.'];
  if (lit === 4) return ['Four Waystones burn. One more.', 'Bring the last shard home, and I will open the way.'];
  return [`${['', 'One', 'Two', 'Three'][lit]} of the five Waystones ${lit === 1 ? 'burns' : 'burn'}. I can feel ${lit === 1 ? 'it' : 'them'} from here.`, 'Not enough. Mend the rest, and I will open the way.'];
}

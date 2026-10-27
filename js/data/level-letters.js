/* ============================================================
   level-letters.js  -  the Gym Leaders' letters for a high Level (the roadmap's Level 6-10 reward 10, 2026-10-23):
   your first win on each of Trainer Levels 6-10 brings letters from friends in their own voice (docs/reference/
   gym-leaders.md), every friend once; Level 10's is from all of them, with a signed group photo for the Secret Base
   (`leaderphoto`, js/base-furniture-gym.js, earned by js/data/furniture.js's `master` source). Nothing to claim but
   the reading. `{level}` is the Level's name (LEVELS in js/data/difficulty.js).
   ============================================================ */

export const PHOTO_KIND = 'leaderphoto';

/** [from, title, letter] by Level. */
export const LEVEL_LETTERS = {
  6: [
    ['britt', 'A gold star', 'Level 6, {level}, and you didn\'t even ask for a hall pass. Healing\'s weaker up there. Trust me, I\'m a Sage main. Gold star. Back to your seat. - Britt'],
    ['lawrence', 'You ATE', 'Babe. Level 6?? You ATE and left no crumbs. Daddy\'s so proud. If Britt asks, I was writing this at the library. - Law'],
    ['john', 'Congrats (draft 4)', 'I started this on my Steam Deck, finished it on my Switch 2 and printed it from the Thor. Level 6! It took me longer to pick a handheld. - John'],
  ],
  7: [
    ['jahmes', 'LEVEL 7 LET\'S GOOOO', 'I\'M SCREAMING. LEVEL SEVEN. LESS HP AND YOU STILL WON?? It\'s 10:58 so this letter ends n'],
    ['clarence', 'A private encore', 'Darling, a Level 7 win deserves a show. Not THE show, the show is for the boys. But I did a spin in your honour. - Clarence'],
    ['shaun', 'VOD notes', 'Watched your Level 7 run. Clean. A few misplays on floor 3, we\'ll review. You\'re not hardstuck, which is more than I can say for the boys. - Shaun'],
  ],
  8: [
    ['pat', 'Oh, you read that?', '"♪ Lemonade..." Oh, you read that? Didn\'t know anyone was reading. Level 8, champ. You\'re going in the next verse. - Pat'],
    ['kayl', 'Wait, what was I', 'Congrats on Level 8!! I had a whole thing to say but Spooky knocked my mug off and Reya is screaming for food. Anyway. So proud. Lavender hugs. - Kayl'],
    ['phil', 'From Phil (and JONA)', 'Congratulations on Level 8. I\'m writing fast before she... LEVEL EIGHT. YOUR STRENGTH IS DELICIOUS. I WILL REMEMBER IT. ...Sorry. She\'s gone. Well done. - Phil'],
  ],
  9: [
    ['ricky', 'Sent at 2:14 a.m.', 'Level 9 and no second wind. Respect. I have a standup in seven hours, so four hours of sleep if I stop now. I won\'t. - Ricky'],
    ['machew', 'The next arc', 'So. You\'ve walked the path to Level 9. Few understand. Velvet would nod. I\'d say more but my break\'s over and the manager is behind the pillar. Nothing personnel. - Machew'],
    ['jerome', 'r/GTA6 says congrats', 'Level 9, nice. Unrelated, but someone zoomed into the trailer and counted 41 palm trees. My wife says to mention the baby. The baby says congrats too. - Jerome'],
  ],
  10: [
    ['nietos', 'A POKéMON MASTER!', 'LAW: A Pokémon Master, sweetie! You SERVED. BRITT: Everyone signed the photo. Even Jahmes, at 10:59. LINC: Bababa! BRITT: Hang it in your Secret Base. Love, all of us.'],
  ],
};

/** A Level's letters, its name filled in. */
export const lettersFor = (level, name) => (LEVEL_LETTERS[level] || []).map(([from, title, text]) => ({ from, title, text: text.replace('{level}', name) }));

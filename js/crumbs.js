/* crumbs.js  -  where the game was when the page last went away without closing: an iPhone reloading the tab when it runs
   out of memory (a friend's iPhone 17 Pro still did, 2026-10-18, after three rounds of fixes worked out from guesses at
   where). Every few seconds the place on screen is written down; a page load that finds the last note never closed logs
   it, and Settings' Save group lists the last few, so the next report can say where, how long in, and whether the game
   was on screen or the phone was away from it (iOS lets go of a hidden tab first). */

const NOTE = 'pokedb.crumb', LOG = 'pokedb.reloads', KEEP = 5, EVERY = 5000;

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full or blocked: no note */ } };

const shown = (node) => node && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';

/** The place on screen, in a few words: a 3D place's title, a walk-in room's, or the screen and the biome. */
function where() {
  const named = ['.b3-top h2', '#room-title'].map(s => document.querySelector(s)).find(shown)?.textContent.trim();
  const screen = shown(document.getElementById('title-screen')) ? 'the Clearing' : (document.body.dataset.screen || '').replace(/-screen$/, '');
  const biome = document.getElementById('biome-name')?.textContent.trim();
  const fight = screen === 'battle' ? document.getElementById('enemy-name')?.textContent.trim() : '';
  return [named || screen || 'the title', fight && `vs ${fight}`, biome && !['the Clearing', 'start'].includes(screen) && biome !== named ? biome : ''].filter(Boolean).join(', ').slice(0, 80);
}

let note = null;
function jot(extra = {}) {
  note = { ...note, where: where(), last: Date.now(), hidden: document.hidden, ...extra };
  write(NOTE, note);
}

/** Logs the last page load if it never closed, then starts this one's notes. */
export function startCrumbs() {
  const last = read(NOTE, null);
  if (last && !last.closed && last.last) {
    const log = read(LOG, []);
    log.unshift({ at: last.last, where: last.where, mins: Math.round((last.last - last.start) / 60000), away: !!last.hidden });
    write(LOG, log.slice(0, KEEP));
  }
  note = { start: Date.now(), closed: false };
  jot();
  setInterval(() => { if (!document.hidden) jot(); }, EVERY);
  document.addEventListener('visibilitychange', () => jot());
  addEventListener('pagehide', () => jot({ closed: true }));
  addEventListener('pageshow', (e) => { if (e.persisted) jot({ closed: false }); });
  showLog();
}

function showLog() {
  const box = document.getElementById('reload-log'), lines = document.getElementById('reload-lines');
  const log = read(LOG, []);
  if (!box || !lines || !log.length) return;
  lines.replaceChildren(...log.map(r => {
    const when = new Date(r.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const line = document.createElement('span');
    line.textContent = `${when}: ${r.where}, ${r.mins} min in${r.away ? ', while away from the game' : ''}`;
    return line;
  }));
  box.hidden = false;
}

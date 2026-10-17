/* mall-arcade.js  -  the Poké Mall's Arcade Room, through a doorway in the Game Corner's right wall (2026-10-17, the user's
   call: the arcade machines in a room of their own, so neither room uploads every picture at once on a phone). Twelve
   cabinets along the back wall either side of Porygon's desk, the weekly leaderboard on the wall over it, Whac-a-Diglett
   and four cabinets down the left wall, the five pinball tables down the right, the middle left open for new games.
   Every machine free to play, its prize at Meowth's counter. Painted smooth like the Game Corner (its wallpaper, tubes
   and machines, js/mall-corner.js); js/mall-3d.js walks it, its doormat back out to the Game Corner. */

import { PIECES } from './base-furniture.js';
import { fine, texOf, words, star, GC } from './hub-3d.js';
import { ARCADE_GAMES, arcadeValue } from './data/leaderboard.js';
import { NEON, glow, tube, paper, sideArt, frameArt, machineMaker } from './mall-corner.js';

/* The room: `x` a thing's first tile, `w` its tiles; y 0 is the back wall. */
const COLS = 15, ROWS = 10, DOOR = { x: 7, y: ROWS - 1 };
const DESK = { x: 6, w: 3 };   // Porygon's desk, its front on row 1
/* [kind, x, y, face], `face` as machineMaker()'s: the back wall's twelve, then the left wall, then the right */
const MACHINES = [
  ...['crossingcabinet', 'ekanscabinet', 'pongcabinet', 'invaderscabinet', 'breakoutcabinet', 'gastlymaze'].map((id, x) => [id, x, 0, 0]),
  ...['bowlingcabinet', 'stackercabinet', 'dashcabinet', 'memorycabinet', 'flapcabinet', 'volleycabinet'].map((id, i) => [id, DESK.x + DESK.w + i, 0, 0]),
  ...['whackmachine', 'berrycabinet', 'dittocabinet', 'bubblecabinet', 'pokepuzzle'].map((id, i) => [id, 0, 3 + i, 1]),
  ...['pokepinball', 'gengarpinball', 'lapraspinball', 'volcanopinball', 'skypinball'].map((id, i) => [id, COLS - 1, 3 + i, -1]),
];

/* Porygon keeps the Arcade: a Pokémon made of code, at home among the machines. */
export const ARCADE_KEEPER = {
  id: 'porygon', name: 'Porygon', src: 'assets/pokemon/porygon-front.gif',
  hello: ['Welcome to the Arcade! Every machine is free play. Tap one to hear what it is, tap again to play.', 'Beep! New player detected. Your best scores go up on the board over my desk.', 'Free play on every cabinet, all day. Like one? Meowth\'s prize counter has it to take home.'],
  chat: ['I run on 1s and 0s. Mostly 1s today.', 'The leaderboard over me resets every week. Tap it to see the whole board.', 'Pinball down the right wall, puzzles on the left. I mapped it myself.', 'Leave a game early and your score still counts. I checked the code.', 'Meowth wanted a prize counter in here too. I said the coins stay next door.', 'Psyduck keeps losing at Pong. To itself. I logged it.'],
};

/* ---------- painting ---------- */

/** The arcade carpet: deep navy scattered with neon shapes (squiggles, triangles, rings, stars), a gold border. */
function carpetArt({ cols, rows }) {
  const T = 16, W = cols * T, H = rows * T, f = fine(W, H, 5), { g, rr } = f;
  g.fillStyle = '#100a2a'; g.fillRect(0, 0, W, H);
  const COLS4 = [NEON.cyan, NEON.pink, NEON.lime, NEON.gold, '#8a6ae8'];
  for (let y = 0; y < rows * 2; y++) for (let x = 0; x < cols * 2; x++) {
    const k = (x * 7 + y * 13) % 11, cx = x * T / 2 + T / 4 + ((x * 5 + y * 3) % 4) - 2, cy = y * T / 2 + T / 4 + ((x * 3 + y * 7) % 4) - 2;
    const col = COLS4[(x * 3 + y) % COLS4.length], turn = ((x + y * 2) % 8) * Math.PI / 4;
    g.save(); g.translate(cx, cy); g.rotate(turn);
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 0.7; g.globalAlpha = 0.8;
    if (k < 3) { g.beginPath(); g.moveTo(-3, 0); g.bezierCurveTo(-1.5, -2.4, 0, 2.4, 1.5, 0); g.bezierCurveTo(2.2, -1.2, 3, -0.6, 3.4, 0); g.stroke(); }
    else if (k < 5) { g.beginPath(); g.moveTo(0, -2); g.lineTo(1.8, 1.2); g.lineTo(-1.8, 1.2); g.closePath(); g.stroke(); }
    else if (k < 7) { g.beginPath(); g.arc(0, 0, 1.4, 0, Math.PI * 2); g.stroke(); }
    else if (k < 8) star(g, 0, 0, 1.2);
    else if (k < 9) { g.beginPath(); g.moveTo(-2.4, 0.8); g.lineTo(-1.2, -0.8); g.lineTo(0, 0.8); g.lineTo(1.2, -0.8); g.lineTo(2.4, 0.8); g.stroke(); }
    g.restore();
  }
  rr(0, 0, W, 2, 0, GC.goldDark); rr(0, H - 2, W, 2, 0, GC.goldDark); rr(0, 0, 2, H, 0, GC.goldDark); rr(W - 2, 0, 2, H, 0, GC.goldDark);
  return f.c;
}

/** The back wall: the Game Corner's paper and tubes, ARCADE up high in neon letters between a joystick and a Poké Ball. */
function wallArt({ cols, top: TOP, u: U }) {
  const W = (cols + 0.8) * U, H = TOP * U, f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wx = (t) => (t + 0.4) * U, wy = (y) => (TOP - y) * U;
  paper(f, W, H);
  rr(0, wy(0.9), W, H - wy(0.9), 0, lin(0, wy(0.9), 0, H, ['#24123e', '#140a24']));
  tube(g, s, NEON.cyan, 1.1, (c) => { c.moveTo(0, wy(0.9)); c.lineTo(W, wy(0.9)); });
  tube(g, s, NEON.pink, 1.1, (c) => { c.moveTo(0, wy(5.4)); c.lineTo(W, wy(5.4)); });
  const hy = wy(6.6);
  g.save(); glow(g, NEON.pink, 6); words(g, 'ARCADE', W / 2, hy, 26, NEON.pink); g.restore();
  words(g, 'ARCADE', W / 2, hy, 26, '#ffe8f6'); words(s, 'ARCADE', W / 2, hy, 26, NEON.pink);
  const jx = wx(2.2);   // a joystick
  tube(g, s, NEON.cyan, 1.2, (c) => { c.roundRect(jx - 14, hy + 4, 28, 9, 3); c.moveTo(jx, hy + 4); c.lineTo(jx + 3, hy - 9); });
  tube(g, s, NEON.cyan, 1.2, (c) => { c.arc(jx + 3.6, hy - 12, 4.5, 0, Math.PI * 2); });
  const bx = wx(cols - 2.2);   // a Poké Ball
  tube(g, s, NEON.gold, 1.2, (c) => { c.arc(bx, hy, 15, 0, Math.PI * 2); c.moveTo(bx - 15, hy); c.lineTo(bx - 5, hy); c.moveTo(bx + 5, hy); c.lineTo(bx + 15, hy); });
  tube(g, s, NEON.gold, 1.2, (c) => { c.moveTo(bx + 5, hy); c.arc(bx, hy, 5, 0, Math.PI * 2); });
  return f.c;
}

/** Porygon's desk front, `w` tiles: violet over chrome, FREE PLAY in cyan neon between two coin slots. */
function deskArt(w) {
  const W = Math.round(w * 16), H = 14, f = fine(W, H, 6), { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, W, H, 0, lin(0, 0, 0, H, ['#3a2266', '#1e1038']));
  rr(0, 0, W, 1.4, 0, GC.gold);
  rr(0, H - 1.6, W, 1.6, 0, '#cdc8e0');
  g.save(); glow(g, NEON.cyan, 3); words(g, 'FREE PLAY', W / 2, 7.2, 4.4, NEON.cyan); g.restore();
  words(g, 'FREE PLAY', W / 2, 7.2, 4.4, '#e8ffff'); words(s, 'FREE PLAY', W / 2, 7.2, 4.4, NEON.cyan);
  for (const x of [5, W - 5]) {
    rr(x - 2, 4, 4, 6.4, 1, '#120824'); rr(x - 0.4, 5, 0.8, 4.4, 0.4, '#ff8a5a');
    s.fillStyle = '#ff8a5a'; s.beginPath(); s.roundRect(x - 0.4, 5, 0.8, 4.4, 0.4); s.fill();
  }
  return f.c;
}

/** The leaderboard over Porygon's desk: one ranked game at a time, its name and top three this week. `boards` is
    arcadeTop()'s (null: unreachable, undefined: still loading). */
function boardScreen(c, boards, at) {
  const g = c.getContext('2d'), W = c.width, H = c.height, game = ARCADE_GAMES[at % ARCADE_GAMES.length];
  g.clearRect(0, 0, W, H);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#24123e'); bg.addColorStop(1, '#120824');
  g.fillStyle = bg; g.strokeStyle = GC.gold; g.lineWidth = 8;
  g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 22); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255, 90, 184, 0.55)'; g.lineWidth = 2; g.beginPath(); g.roundRect(16, 16, W - 32, H - 32, 14); g.stroke();
  g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = '800 20px system-ui, sans-serif'; g.fillStyle = '#ffa8dc'; g.shadowColor = '#ff5ab8'; g.shadowBlur = 8;
  g.fillText('🏆 WEEKLY HIGH SCORES 🏆', W / 2, 34);
  g.font = '900 38px system-ui, sans-serif'; g.fillStyle = '#fff8e0'; g.shadowColor = game.b1; g.shadowBlur = 16;
  g.fillText(game.name.toUpperCase(), W / 2, 70, W - 60);
  g.shadowBlur = 0;
  const rows = boards?.find(b => b.id === game.id)?.rows ?? [];
  if (!rows.length) {
    g.font = '800 26px system-ui, sans-serif'; g.fillStyle = '#fffbea';
    g.fillText(boards === undefined ? 'Loading…' : boards === null ? 'Play to beat your best!' : 'No scores yet. Be the first!', W / 2, 140);
  }
  const MEDAL = ['#ffd84a', '#d8d8e8', '#e09858'];
  rows.slice(0, 3).forEach((r, i) => {   // big enough to read from the door (the user's ask, 2026-10-12)
    const y = 112 + i * 38;
    g.fillStyle = r.mine ? 'rgba(255, 216, 74, 0.18)' : 'rgba(255, 255, 255, 0.06)';
    g.beginPath(); g.roundRect(30, y - 17, W - 60, 34, 10); g.fill();
    g.fillStyle = MEDAL[i]; g.beginPath(); g.arc(52, y, 14, 0, Math.PI * 2); g.fill();
    g.font = '900 18px system-ui, sans-serif'; g.fillStyle = '#2a1648'; g.textAlign = 'center'; g.fillText(String(r.rank), 52, y + 1);
    g.font = '800 26px system-ui, sans-serif'; g.textAlign = 'left'; g.fillStyle = r.mine ? '#ffe890' : '#ffffff';
    g.fillText(r.entry.name, 76, y + 1, W - 230);
    g.textAlign = 'right'; g.fillStyle = '#c8ffb8'; g.fillText(arcadeValue(r.entry), W - 44, y + 1);
  });
  g.textAlign = 'center';
  ARCADE_GAMES.forEach((_, i) => {   // which game is up, as dots
    g.fillStyle = i === at % ARCADE_GAMES.length ? '#ffd84a' : 'rgba(255, 255, 255, 0.25)';
    g.beginPath(); g.arc(W / 2 + (i - (ARCADE_GAMES.length - 1) / 2) * 16, H - 16, 4, 0, Math.PI * 2); g.fill();
  });
}

/* ---------- building it ---------- */

/** The Arcade Room. `size` gives the hall's paint units and wall height; the room is its own COLS x ROWS. Returns what
    buildCorner() does: its group, blocked tiles, spots, the gold frame for a picked one, its keeper's place, its size,
    door and a dim light. */
export function buildArcade(THREE, size) {
  const { top: TOP, u: U } = size, cols = COLS, rows = ROWS, room = { cols, rows, top: TOP, u: U };
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [], ticks = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (src, k = 1) => std({ map: texOf(src), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(src.glow ?? src), emissiveIntensity: k, roughness: 0.9 });
  const edge = std({ color: '#1a1028' }), cap = std({ color: '#2a1648' });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(carpetArt(room)), roughness: 0.95 }), edge, std({ color: '#2a1840' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  group.add(floor);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#24143a' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  group.add(plinth);
  const back = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap, lit(wallArt(room), 1.2), cap]);
  back.position.set(0, TOP / 2, -rows / 2 - 0.2);
  back.receiveShadow = true;
  group.add(back);
  const inside = lit(sideArt(room), 1.1);   // one picture for both walls, uploaded once
  for (const sgn of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, rows), sgn < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(sgn * (cols / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    group.add(m);
  }

  // every machine, its Secret Base model, a tap to play
  const machine = machineMaker({ THREE, group, blocked, spots, cols, rows, std });
  for (const [id, x, y, face] of MACHINES) {
    const name = PIECES[id].name;
    machine(id, x, y, face, { name, line: `${name}! Free play, just for fun. Meowth's prize counter next door has one to take home.`,
      open: (done) => import('./home-arcade.js').then(m => m.playAtHome(id, done)) });
  }

  // Porygon's desk between the back wall's cabinets, Porygon behind it
  const keeper = { id: 'keeper', kind: 'keeper', name: ARCADE_KEEPER.name, open: true, step: { x: DESK.x + 1, y: 2 } };
  spots.push(keeper);
  for (let x = DESK.x; x < DESK.x + DESK.w; x++) for (const y of [0, 1]) blocked.add(`${x},${y}`);
  const DW = DESK.w - 0.2, DD = 0.6, deskZ = tileZ(1) + 0.1, violet = std({ color: GC.violetDark, roughness: 0.6 });
  const desk = new THREE.Group();
  desk.position.set(tileX(DESK.x + 1), 0, deskZ);
  const body = new THREE.Mesh(new THREE.BoxGeometry(DW, 0.8, DD), [violet, violet, violet, violet, lit(deskArt(DW), 0.9), violet]);
  body.position.y = 0.4;
  body.castShadow = body.receiveShadow = true;
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.04, 0.08, DD + 0.12), std({ color: GC.gold, metalness: 0.6, roughness: 0.3 }));
  deskTop.position.y = 0.84;
  desk.add(body, deskTop);
  desk.traverse(o => { o.userData.front = keeper; });
  group.add(desk);

  // the arcade leaderboard on the wall over the desk (over Meowth's counter till 2026-10-17): each ranked game in turn,
  // its top three this week; a tap opens the whole board
  const BW = 4.3, BH = 2.05, boardCanvas = new OffscreenCanvas(480, Math.round(480 * BH / BW));
  boardCanvas.fine = 1;
  const boardMap = texOf(boardCanvas), lb = { boards: undefined, at: 0, next: 0, fetched: -Infinity };
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: boardMap, transparent: true, toneMapped: false }));
  board.position.set(tileX(DESK.x + 1), 4.45 - BH / 2, -rows / 2 + 0.03);
  const paintBoard = () => { boardScreen(boardCanvas, lb.boards, lb.at); boardMap.needsUpdate = true; };
  const fetchBoards = () => import('./leaderboard.js').then(m => m.arcadeTop()).then(b => { lb.boards = b; paintBoard(); }).catch(() => {});
  const boardSpot = { id: 'arcade-board', kind: 'game', name: 'Arcade leaderboard', open: true, step: { ...keeper.step },
    frame: { x: board.position.x, y: board.position.y, z: board.position.z + 0.02, w: BW + 0.1, h: BH + 0.1 } };
  boardSpot.line = boardSpot.name;
  boardSpot.game = { name: boardSpot.name, line: 'This week\'s top scores on every machine in here. Tap again to see the whole board.',
    open: (done) => import('./leaderboard.js').then(m => {
      m.openLeaderboard(0, 'arcade');
      const dlg = document.getElementById('board-dialog');
      dlg?.addEventListener('close', () => { lb.fetched = -Infinity; done?.(); }, { once: true });
    }) };
  spots.push(boardSpot);
  board.userData.front = boardSpot;
  group.add(board);
  paintBoard();
  ticks.push((now) => {
    if (now - lb.fetched > 90000) { lb.fetched = now; fetchBoards(); }
    if (now >= lb.next) { if (lb.next) lb.at += 1; lb.next = now + 4500; paintBoard(); }
  });

  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texOf(frameArt()), transparent: true, depthWrite: false }));
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  return {
    group, blocked, spots, frame: ring, top: 4.7, title: 'Arcade', light: 0.6, cols, rows, door: DOOR,
    keeper: { ...ARCADE_KEEPER, x: tileX(DESK.x + 1), z: tileZ(0) + 0.05, lift: 0.5 },
    refresh: paintBoard,
    tick: (now) => ticks.forEach(t => t(now)),
  };
}

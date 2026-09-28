import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const dusk = async (page) => page.route('**/js/title.js', async route => {
  const res = await route.fetch();
  let body = await res.text();
  body = body.replace(/const SKY = \[[^\]]*\];/, "const SKY = ['#1c2360', '#2c3480', '#46479a', '#7258a6', '#b06c9e', '#ec9888'];")
    .replace("HALO = '#6a5a9a'", "HALO = '#9a88d0'")
    .replace("const FAR_HILLS = '#2a2358', NEAR_HILLS = '#1a1740';", "const FAR_HILLS = '#5c4c96', NEAR_HILLS = '#383274';")
    .replace(/const GRASS = \[[^\]]*\];/, "const GRASS = ['#1e4a30', '#2e6e42', '#4c9e58', '#86d470'];");
  route.fulfill({ response: res, body });
});
// the pixel pill: stepped corners (3-2-1 pixels), outline, top light band, bottom shade, glints, block shadow
const STEP = (p) => `polygon(calc(3*${p}) 0, calc(100% - 3*${p}) 0, calc(100% - 3*${p}) ${p}, calc(100% - 2*${p}) ${p}, calc(100% - 2*${p}) calc(2*${p}), calc(100% - ${p}) calc(2*${p}), calc(100% - ${p}) calc(3*${p}), 100% calc(3*${p}), 100% calc(100% - 3*${p}), calc(100% - ${p}) calc(100% - 3*${p}), calc(100% - ${p}) calc(100% - 2*${p}), calc(100% - 2*${p}) calc(100% - 2*${p}), calc(100% - 2*${p}) calc(100% - ${p}), calc(100% - 3*${p}) calc(100% - ${p}), calc(100% - 3*${p}) 100%, calc(3*${p}) 100%, calc(3*${p}) calc(100% - ${p}), calc(2*${p}) calc(100% - ${p}), calc(2*${p}) calc(100% - 2*${p}), ${p} calc(100% - 2*${p}), ${p} calc(100% - 3*${p}), 0 calc(100% - 3*${p}), 0 calc(3*${p}), ${p} calc(3*${p}), ${p} calc(2*${p}), calc(2*${p}) calc(2*${p}), calc(2*${p}) ${p}, calc(3*${p}) ${p})`;
const PILL_CSS = `
.pxb { --p: 3px; --base: #2ea84a; --hi: #62d474; --lo: #1c7a34; --ink: #10301a; --glow: #fff;
  position: relative; display: inline-grid; padding: 0; border: 0; background: none; cursor: pointer;
  filter: drop-shadow(0 var(--p) 0 rgba(20, 10, 30, .55)); transition: translate .08s steps(2); }
.pxb .o { display: grid; background: #181018; clip-path: ${STEP('var(--p)')}; }
.pxb .i { position: relative; margin: var(--p); padding: calc(4 * var(--p)) calc(7 * var(--p)) calc(4 * var(--p));
  background: linear-gradient(var(--hi) 0 calc(2 * var(--p)), var(--base) calc(2 * var(--p)) calc(100% - 2 * var(--p)), var(--lo) calc(100% - 2 * var(--p)));
  clip-path: ${STEP('var(--p)')};
  font: 1rem/1 var(--pixel-font); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); text-align: center;
  display: flex; align-items: center; justify-content: center; gap: 10px; white-space: nowrap; }
.pxb .i::before { content: ''; position: absolute; left: calc(3 * var(--p)); top: calc(2 * var(--p)); width: calc(3 * var(--p)); height: var(--p); background: var(--glow);
  box-shadow: calc(4 * var(--p)) 0 0 0 var(--glow); opacity: .9; }
.pxb .i::after { content: ''; position: absolute; right: calc(3 * var(--p)); bottom: calc(3 * var(--p)); width: calc(3 * var(--p)); height: var(--p); background: var(--glow);
  box-shadow: calc(-2 * var(--p)) 0 0 0 transparent, 0 0 0 0 var(--glow); opacity: .75; }
.pxb.white .i { color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.45); }
.pxb.green  { --base: #2ea84a; --hi: #62d474; --lo: #1c7a34; --ink: #0e2a16; }
.pxb.blue   { --base: #2f7de8; --hi: #6aaaf8; --lo: #1c52b0; }
.pxb.purple { --base: #b43ad8; --hi: #d670f0; --lo: #7a2098; }
.pxb.orange { --base: #f07a1e; --hi: #ffa650; --lo: #b85010; --ink: #3a1a06; }
.pxb.pink   { --base: #f06aa0; --hi: #ff9cc4; --lo: #b83a70; }
.pxb.sky    { --base: #58c0f0; --hi: #98dcff; --lo: #2c86c0; --ink: #0e2a44; }
.pxb.sun    { --base: #f8c858; --hi: #ffe498; --lo: #c08a20; --ink: #3a2606; }
.pxb.red    { --base: #e8483c; --hi: #ff8070; --lo: #a82420; }
.pxb:hover, .pxb.on { translate: 0 -2px; }
.pxb:active { translate: 0 var(--p); filter: none; }
.pxb.on .i { outline: none; }
.pxb.on::after { content: '▶'; position: absolute; left: -26px; top: 50%; translate: 0 -50%; color: #f8e070; font: .8rem var(--pixel-font); text-shadow: 2px 2px 0 #181018; animation: cursorBlink 1s steps(1) infinite; }
.pxb img { width: 28px; height: 28px; margin: -8px 0; image-rendering: pixelated; }
.pxb .sub { font-size: .6rem; opacity: .8; letter-spacing: .04em; text-transform: none; }
`;
const TITLE_CSS = `
.title-screen { background: #1c2360; }
.title-screen .press-start { display: none; }
.title-center { justify-content: flex-start; padding-top: 10vh; gap: 4.5vh; }
.title-big { font-size: clamp(3.2rem, 15vw, 6.4rem); }
.tb-stack { display: grid; gap: 14px; width: min(270px, 74vw); }
.tb-stack .pxb { width: 100%; } .tb-stack .pxb .o { width: 100%; }
.gem-stack { display: grid; gap: 12px; }
.gem { position: relative; width: 272px; height: 64px; border: 0; padding: 0; background: none; cursor: pointer; }
.gem canvas { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
.gem span.lbl { position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; height: 100%; font: 1rem/1 var(--pixel-font); letter-spacing: .12em; color: #fff; text-transform: uppercase; text-shadow: 0 2px 0 rgba(40,10,40,.6); }
.gem .medal { position: absolute; left: -14px; top: 50%; translate: 0 -50%; width: 60px; height: 60px; border-radius: 50%; z-index: 2;
  background: radial-gradient(circle at 40% 35%, #fff8e0 0 20%, #f0e0b8 21% 62%, #d8c090 63%); box-shadow: 0 0 0 3px #7a4a28, 0 0 0 6px #c89060, 0 0 0 9px #2a1408, 0 5px 0 9px rgba(20,10,30,.45);
  display: grid; place-items: center; }
.gem .medal img { width: 60px; height: 60px; object-fit: contain; image-rendering: pixelated; margin-top: -6px; }
.gem .medal .px-icon { width: 34px; height: 34px; }
.gem .medal .emoji-ish { font-size: 30px; }
.gem.iconed span.lbl { padding-left: 44px; }
.gem-stack.iconed { gap: 18px; padding-left: 14px; }
.gem.on::after { content: '▶'; position: absolute; left: -24px; top: 50%; translate: 0 -50%; color: #f8e070; font: .8rem var(--pixel-font); text-shadow: 2px 2px 0 #181018; }
`;
async function title(w, h, kind) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await dusk(page);
  await page.goto('http://localhost:8123/'); await page.waitForTimeout(700);
  await page.addStyleTag({ content: PILL_CSS + TITLE_CSS });
  await page.evaluate((kind) => {
    const m = document.createElement('div');
    if (kind === 'pill') {
      m.className = 'tb-stack';
      m.innerHTML = `
        <button class="pxb green on"><span class="o"><span class="i"><img src="assets/pokemon/charmeleon-front.gif" alt="">Continue</span></span></button>
        <button class="pxb orange"><span class="o"><span class="i">New game</span></span></button>
        <button class="pxb blue white"><span class="o"><span class="i">Collection</span></span></button>
        <button class="pxb purple white"><span class="o"><span class="i">Game Corner</span></span></button>`;
    } else {
      // pixel gems, after the glossy hexagon reference: a bronze frame, pointed ends, a glossy face, drawn at 68x16 and scaled 4x
      const gem = (face, hi, lo) => {
        const W = 68, H = 16, c = document.createElement('canvas'); c.width = W; c.height = H;
        const g = c.getContext('2d');
        const inside = (x, y, inset) => { const cy = (H - 1) / 2; const reach = (W / 2 - inset) - Math.max(0, Math.abs(y - cy) * 0.9 - 0); return y >= inset && y <= H - 1 - inset && Math.abs(x + 0.5 - W / 2) <= reach - Math.abs(y - cy) * 0.0; };
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const cy = (H - 1) / 2, dy = Math.abs(y - cy), half = W / 2 - 1 - dy * 0.75, dx = Math.abs(x + 0.5 - W / 2);
          if (dx > half + 1) continue;
          let col;
          if (dx > half) col = '#2a1408';
          else if (dx > half - 1.5 || y === 0 || y === H - 1) col = '#2a1408';
          else if (dx > half - 3 || y <= 1 || y >= H - 2) col = y < cy ? '#c89060' : '#7a4a28';
          else col = y <= 4 ? hi : y >= H - 5 ? lo : face;
          if (col === face && y === 5 && dx < half - 10 && (x % 7 < 4)) col = hi;
          g.fillStyle = col; g.fillRect(x, y, 1, 1);
        }
        g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(12, 3, 5, 1); g.fillRect(19, 3, 2, 1); g.fillRect(W - 16, H - 5, 4, 1);
        return c;
      };
      m.className = 'gem-stack';
      const items = [['Continue', '#f0a030', '#ffd070', '#c07018', true], ['New game', '#b848d8', '#e088f8', '#7a2098'], ['Collection', '#e8c830', '#fff080', '#b89010'], ['Game Corner', '#f06038', '#ff9870', '#b83018']];
      const icons = { 'Continue': '<img src="assets/pokemon/charmeleon-front.gif" alt="">', 'New game': '<span class="pokeball" style="font-size:52px"></span>', 'Collection': '📕', 'Game Corner': '🎰' };
      const withIcons = kind === 'gem-icons';
      if (withIcons) m.classList.add('iconed');
      for (const [label, face, hi, lo, on] of items) {
        const b = document.createElement('button'); b.className = `gem${on ? ' on' : ''}${withIcons ? ' iconed' : ''}`;
        b.append(gem(face, hi, lo)); const s = document.createElement('span'); s.className = 'lbl'; s.textContent = label; b.append(s);
        if (withIcons) { const md = document.createElement('span'); md.className = 'medal'; md.innerHTML = icons[label]; b.append(md); }
        m.append(b);
      }
    }
    document.querySelector('.title-center').append(m);
  }, kind);
  await page.mouse.move(1, h - 1);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `mock3-title-${kind}-${w}.png` });
  await page.close();
}
async function select(w, h) {
  const CS = readFileSync('cs.css', 'utf8');
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:8123/?levels'); await page.waitForTimeout(600);
  await page.mouse.click(w / 2, h / 2); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  await page.evaluate(() => document.querySelector('.starter-btn').click()); await page.waitForTimeout(400);
  await page.addStyleTag({ content: PILL_CSS + CS });
  await page.evaluate(async () => {
    const { STARTERS } = await import('/js/data/starters.js');
    const cs = document.createElement('div');
    cs.className = 'cs';
    const thumbs = STARTERS.filter(s => !s.legendary && !s.secret).map((s, i) =>
      `<span class="cs-thumb${i === 0 ? ' on' : ''}${i > 2 ? ' locked' : ''}"><img src="assets/pokemon/${s.line[0].id}-front.gif" alt=""></span>`).join('');
    cs.innerHTML = `
      <div class="cs-mon"><img src="assets/pokemon/charmander-front.gif" alt=""></div>
      <div class="cs-info">
        <h2 class="cs-name">Charmander</h2>
        <div class="cs-stats"><span>❤️ 70/70</span><span class="chip type-fire">🔥 Fire</span></div>
        <p class="cs-blurb">Fast, fiery attacks. Hits harder when hurt.</p>
        <div class="cs-ability"><b>Ability: Blaze</b><span>While your HP is below half, your attacks deal +3 damage.</span></div>
        <button class="pxb sun cs-shiny-btn"><span class="o"><span class="i">✨ Shiny</span></span></button>
      </div>
      <button class="pxb blue white cs-back"><span class="o"><span class="i">Back</span></span></button>
      <button class="pxb green cs-go"><span class="o"><span class="i">Choose</span></span></button>
      <div class="cs-strip"><div class="cs-tabs"><button class="pxb orange on-tab"><span class="o"><span class="i">Starters 3/15</span></span></button><button class="pxb purple white off-tab"><span class="o"><span class="i">Legends 0/15</span></span></button></div><div class="cs-thumbs">${thumbs}</div></div>`;
    document.body.append(cs);
  });
  await page.mouse.move(1, 1);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `mock3-select-${w}.png` });
  await page.close();
}
for (const [w, h] of [[390, 844], [1280, 800]]) { await title(w, h, 'gem-icons'); }
await browser.close();

// Renders tools/app-icon.html into assets/icons/ (run from the repo root with a server on :8123).
const { chromium } = await import(process.env.PW || 'playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.goto('http://localhost:8123/tools/app-icon.html');
await page.waitForSelector('body[data-ready]');
for (const size of [512, 192, 180]) {
  await page.evaluate(s => { document.body.style.zoom = s / 512; }, size);
  await page.locator('#icon').screenshot({ path: `assets/icons/icon-${size}.png` });
}
await browser.close();

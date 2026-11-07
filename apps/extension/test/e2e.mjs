// End-to-end test of the built extension in a real Chromium (Playwright).
// Run: npm run build && npm run test:e2e   (from apps/extension)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const extPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.output/chrome-mv3');
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`],
});
const errors = [];
try {
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15000 });
  const id = new URL(worker.url()).host;
  console.log('Service worker running for extension', id);

  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  assert.deepEqual(manifest.permissions.sort(), ['activeTab', 'contextMenus', 'scripting']);

  const popup = await context.newPage();
  popup.on('pageerror', (e) => errors.push(e.message));
  await popup.goto(`chrome-extension://${id}/popup.html`);

  const cases = [
    ['Hiring CSR sa Thailand! ₱80k/month, libre flight. Tourist visa lang muna. Pag tinanong ka ng immigration, sabihin mo bakasyon lang.', 'High risk', 'Trafficking: High'],
    ["You'll get 5 ready-made Facebook profiles and daily talking points to defend the governor from critics. The client is confidential.", 'High risk', 'Troll farm / influence: High'],
    ['Content Moderator, BGC. Remove fake accounts and misinformation according to platform policy. HMO, night differential. Apply via our careers page.', 'No common red flags', 'Job scam: Low'],
  ];
  for (const [text, verdict, pill] of cases) {
    await popup.evaluate(() => { document.getElementById('result').innerHTML = ''; });
    await popup.fill('#text', text);
    await popup.click('#scan-text');
    await popup.waitForSelector('#result .verdict', { timeout: 10000 });
    const result = await popup.innerText('#result');
    assert.ok(result.includes(verdict), `expected "${verdict}" in: ${result.slice(0, 200)}`);
    assert.ok(result.includes(pill), `expected "${pill}" in result`);
    console.log(`✔ ${verdict} | ${pill}`);
  }
  await popup.screenshot({ path: path.resolve(extPath, '../popup-e2e.png') });
  assert.deepEqual(errors, [], 'popup threw errors');
  console.log('All extension checks passed in Chromium', await worker.evaluate(() => navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0]));
} finally {
  await context.close();
}

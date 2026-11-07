// End-to-end test of the extension in real Chromium (Playwright).
// Run: npm run test:e2e (from apps/extension). It builds the shipped extension and a test copy
// (WXT_E2E=true, .output-e2e) that may read 127.0.0.1 pages, then checks:
//   1. the shipped manifest asks for no page access;
//   2. the popup's paste-and-check path;
//   3. "Scan this page" on a real job-post page (the popup's scan message);
//   4. the right-click handler, which injects a result panel into the page.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shipped = JSON.parse(readFileSync(path.join(root, '.output/chrome-mv3/manifest.json'), 'utf8'));
assert.deepEqual([...shipped.permissions].sort(), ['activeTab', 'contextMenus', 'scripting']);
assert.equal(shipped.host_permissions, undefined, 'shipped build must not request page access');
console.log('✔ shipped manifest: activeTab, contextMenus, scripting only');

const JOB_PAGE = `<!doctype html><html><head><title>Jobs</title></head><body>
<nav>Home · Jobs · Messages</nav>
<div class="jobs-description"><h1>Customer Service Representative – Bangkok</h1>
<p>Salary $1,500 per month plus commission. Free flight, food and accommodation. No experience needed.</p>
<p>You will travel on a tourist visa and the company will process the work permit after arrival.
Our driver will pick you up at the airport and take you to the office near the border.
The company keeps your passport for visa processing.</p></div></body></html>`;
const server = createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(JOB_PAGE); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const jobUrl = `http://127.0.0.1:${server.address().port}/job`;

const extPath = path.join(root, '.output-e2e/chrome-mv3');
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
  console.log('✔ service worker running for extension', id);

  // 2. Popup: paste and check.
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
    assert.ok(result.includes(verdict) && result.includes(pill), `popup: expected "${verdict}" / "${pill}" in ${result.slice(0, 200)}`);
    console.log(`✔ popup paste: ${verdict} | ${pill}`);
  }

  // 3. "Scan this page" on a real page: the same message the popup's button sends.
  const job = await context.newPage();
  job.on('pageerror', (e) => errors.push(e.message));
  await job.goto(jobUrl);
  const tabId = await worker.evaluate(async (url) => (await chrome.tabs.query({ url: url + '*' }))[0]?.id, jobUrl);
  assert.ok(tabId, 'job tab found');
  const scan = await popup.evaluate((t) => chrome.runtime.sendMessage({ type: 'hireaware:scan-tab', tabId: t }), tabId);
  assert.ok(scan.text.startsWith('Customer Service Representative'), 'extracted the job description, not the nav');
  assert.equal(scan.analysis.verdict, 'high');
  assert.equal(scan.analysis.topCategory, 'trafficking');
  console.log(`✔ scan this page: read ${scan.text.length} chars of the job description → ${scan.analysis.verdict} / ${scan.analysis.topCategory}`);

  // 4. Right-click handler: injects the result panel into the page.
  const selection = 'Earn ₱3,000 a week by renting out your GCash. We just need your MPIN and the OTP once.';
  const checked = await popup.evaluate(([t, s]) => chrome.runtime.sendMessage({ type: 'hireaware:test-check-selection', tabId: t, text: s }), [tabId, selection]);
  assert.equal(checked.verdict, 'high');
  const panelText = await job.evaluate(() => document.getElementById('hireaware-panel')?.shadowRoot?.textContent ?? '');
  assert.ok(panelText.includes('High risk') && panelText.includes('Job scam: High'), `panel shows the result: ${panelText.slice(0, 160)}`);
  await job.screenshot({ path: path.join(root, '.output-e2e/panel-e2e.png') });
  await job.evaluate(() => document.getElementById('hireaware-panel').shadowRoot.querySelector('button').click());
  assert.equal(await job.evaluate(() => !!document.getElementById('hireaware-panel')), false, 'panel closes');
  console.log('✔ right-click check: panel injected on the page with "High risk / Job scam: High", and closes');

  assert.deepEqual(errors, [], 'no page errors');
  console.log('All extension checks passed in Chromium', await worker.evaluate(() => navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0]));
} finally {
  await context.close();
  server.close();
}

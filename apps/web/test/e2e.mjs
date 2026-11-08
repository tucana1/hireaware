// End-to-end test of the website in real Chromium (Playwright), against `next start`.
// Run: npm run test:e2e (from apps/web; builds first).
//
// WhatsApp (Meta) and Claude need real keys, so this test points both at local stand-in servers that
// record exactly what HireAware sends and reply the way the real APIs do. Twilio is tested with a
// correctly signed request over HTTP. Nothing leaves this machine.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listen = (handler) => new Promise((resolve) => { const s = createServer(handler); s.listen(0, '127.0.0.1', () => resolve(s)); });
const bodyOf = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)); });

// Stand-in for the WhatsApp Cloud API: records outgoing messages.
const sentToMeta = [];
const meta = await listen(async (req, res) => {
  sentToMeta.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(await bodyOf(req)) });
  res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"messages":[{"id":"wamid.test"}]}');
});
// Stand-in for the Claude Messages API: records the request and streams a reply as server-sent events.
const sentToClaude = [];
const claude = await listen(async (req, res) => {
  sentToClaude.push({ url: req.url, beta: req.headers['anthropic-beta'], body: JSON.parse(await bodyOf(req)) });
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  res.end([
    ev('message_start', { message: { id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } }),
    ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }),
    ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'No. A real job abroad needs a work visa ' } }),
    ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'arranged before you fly.' } }),
    ev('content_block_stop', { index: 0 }),
    ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 12 } }),
    ev('message_stop', {}),
  ].join(''));
});

const port = 3100 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${port}`;
const env = {
  ...process.env, PORT: String(port), NEXT_TELEMETRY_DISABLED: '1',
  TWILIO_AUTH_TOKEN: 'twilio-test-token',
  WHATSAPP_VERIFY_TOKEN: 'verify-me', META_APP_SECRET: 'meta-secret', WHATSAPP_ACCESS_TOKEN: 'meta-token', WHATSAPP_PHONE_NUMBER_ID: '123456',
  WHATSAPP_API_BASE: `http://127.0.0.1:${meta.address().port}`,
  ANTHROPIC_API_KEY: 'sk-ant-test', ANTHROPIC_BASE_URL: `http://127.0.0.1:${claude.address().port}`,
};
const server = spawn('npx', ['next', 'start', '-p', String(port)], { cwd: webRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  // Every page renders.
  for (const p of ['/', '/check', '/scan', '/learn', '/regions', '/help', '/tipline', '/about']) {
    const res = await page.goto(BASE + p);
    assert.equal(res.status(), 200, p);
  }
  console.log('✔ all 8 pages render');

  // The header has no quick-exit button.
  await page.goto(BASE + '/help');
  assert.equal(await page.getByRole('button', { name: 'Leave quickly' }).count(), 0);

  // Risk-check chatbot: a Filipino job seeker offered a social media job with provided accounts.
  await page.goto(BASE + '/check');
  const pick = async (label) => { await page.getByRole('button', { name: label }).first().click(); };
  await pick("I've been offered a job");
  await pick('Philippines');
  await pick('Social media, content');
  await pick('Continue');
  await pick('From home (remote)');
  await pick('Yes');
  await pick('Accounts they give me');
  await pick('Elections, candidates');
  await pick('Continue');
  await pick("You'll get scripts");
  await pick("Don't tell anyone who you work for");
  await pick('Continue');
  await pick('None of these');
  await pick('Continue');
  await pick('About normal');
  await pick('Only through WhatsApp');
  await pick('Continue');
  const log = page.getByRole('log');
  await log.getByText('What worried us').waitFor();
  const resultText = await log.innerText();
  for (const s of ['High risk', 'You would post from accounts under other names', 'Will I only post from accounts in my own real name', '1343', 'Worth knowing in Southeast Asia']) {
    assert.ok(resultText.includes(s), `chatbot result should include "${s}"`);
  }
  console.log('✔ chatbot: full situation check → high influence risk, questions, regional notes, Philippine hotlines');

  // Typed question → Claude (stand-in) streamed into the chat.
  await page.fill('#q', 'Is it OK to travel on a tourist visa for this job?');
  await page.getByRole('button', { name: 'Ask' }).click();
  await log.getByText('arranged before you fly.').waitFor({ timeout: 10000 });
  const call = sentToClaude.at(-1);
  assert.equal(call.body.model, 'claude-opus-5-5');
  assert.equal(call.body.fallbacks, 'default');
  assert.equal(call.body.stream, true);
  assert.equal(call.body.output_config.effort, 'low');
  assert.equal(call.body.system[0].cache_control.type, 'ephemeral');
  assert.ok(call.beta.includes('server-side-fallback-2026-07-01'));
  assert.ok(call.body.messages[0].content.includes('[Context from my risk check'));
  assert.ok(!('temperature' in call.body));
  console.log('✔ chatbot question → Claude request (opus 5.5, fallbacks, caching, risk-check context) streamed back into the chat');

  // Scanner.
  await page.goto(BASE + '/scan');
  await page.getByRole('button', { name: 'Customer service abroad (Kenya)' }).click();
  await page.getByText('High risk: this looks like trafficking').waitFor();
  console.log('✔ scanner: Kenyan "Thailand jobs" example → high trafficking risk');

  // Tipline simulator.
  await page.goto(BASE + '/tipline');
  await page.getByRole('button', { name: 'Example forward' }).click();
  await page.getByText('HIGH RISK').first().waitFor();
  console.log('✔ tipline simulator replies to a forwarded Taglish message');

  // Twilio webhook over HTTP with a valid signature.
  const params = { From: 'whatsapp:+254712345678', Body: 'Thailand jobs! Customer care $1,500. Travel on a tourist visa; if immigration asks, say you are on holiday.', NumMedia: '0' };
  const twilioUrl = `${BASE}/api/whatsapp`;
  const sig = createHmac('sha1', 'twilio-test-token').update(Object.keys(params).sort().reduce((a, k) => a + k + params[k], twilioUrl)).digest('base64');
  const tw = await fetch(twilioUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Twilio-Signature': sig }, body: new URLSearchParams(params) });
  const xml = await tw.text();
  assert.equal(tw.status, 200);
  assert.ok(xml.includes('<Response><Message>') && xml.includes('HIGH RISK') && xml.includes('Kenya'), xml.slice(0, 300));
  const bad = await fetch(twilioUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Twilio-Signature': 'forged' }, body: new URLSearchParams(params) });
  assert.equal(bad.status, 403);
  console.log('✔ Twilio webhook: signed request → TwiML reply with Kenyan help; forged signature → 403');

  // Meta WhatsApp Cloud API: verify handshake, then a signed message → reply delivered to the (stand-in) Graph API.
  const hs = await fetch(`${BASE}/api/whatsapp/meta?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=777`);
  assert.equal(await hs.text(), '777');
  const payload = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from: '639171234567', type: 'text', text: { body: 'Hiring! Use the 10 dummy accounts we give you to defend the senator from critics. The client is confidential. ₱500 per day.' } }] } }] }] });
  const metaSig = 'sha256=' + createHmac('sha256', 'meta-secret').update(payload).digest('hex');
  const mr = await fetch(`${BASE}/api/whatsapp/meta`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': metaSig }, body: payload });
  assert.equal(mr.status, 200);
  for (let i = 0; i < 40 && sentToMeta.length === 0; i++) await new Promise((r) => setTimeout(r, 100));
  assert.ok(sentToMeta.length >= 1, 'reply sent to the Graph API');
  const out = sentToMeta[0];
  assert.equal(out.url, '/v23.0/123456/messages');
  assert.equal(out.auth, 'Bearer meta-token');
  assert.equal(out.body.to, '639171234567');
  assert.ok(out.body.text.body.includes('HIGH RISK') && out.body.text.body.includes('troll-farm'), out.body.text.body.slice(0, 200));
  assert.ok(out.body.text.body.includes('1343'), 'Philippine hotline for a +63 sender');
  console.log(`✔ Meta webhook: handshake, signed message → ${sentToMeta.length} reply message(s) delivered to the Graph API with the right number, token and content`);

  assert.deepEqual(errors, [], 'no page errors');
  console.log('All website checks passed in Chromium');
} finally {
  await browser.close();
  server.kill();
  meta.close();
  claude.close();
}

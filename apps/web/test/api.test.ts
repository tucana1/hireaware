import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { POST as analyzePost } from '@/app/api/analyze/route';
import { POST as chatPost } from '@/app/api/chat/route';
import { POST as twilioPost } from '@/app/api/whatsapp/route';
import { GET as metaGet, POST as metaPost } from '@/app/api/whatsapp/meta/route';
import { parseMetaWebhook, twilioSignature, verifyMeta } from '@/lib/whatsapp';

const json = (url: string, body: unknown) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

afterEach(() => vi.unstubAllEnvs());

describe('/api/analyze', () => {
  it('returns an analysis', async () => {
    const res = await analyzePost(json('http://x/api/analyze', { text: 'Travel on a tourist visa to Cambodia for a customer service job. The company keeps your passport.' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verdict).toBe('high');
    expect(body.topCategory).toBe('trafficking');
  });
  it('rejects bad input', async () => {
    expect((await analyzePost(json('http://x/api/analyze', { nope: 1 }))).status).toBe(400);
  });
});

describe('/api/chat without an API key', () => {
  it('answers from the local knowledge base', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const res = await chatPost(json('http://x/api/chat', { messages: [{ role: 'user', content: 'Is it ok to travel on a tourist visa for work?' }] }));
    expect(res.headers.get('X-Answer-Source')).toBe('faq');
    expect(await res.text()).toMatch(/work visa/i);
  });
});

describe('/api/whatsapp (Twilio)', () => {
  const params = { From: 'whatsapp:+639171234567', Body: 'Hiring CSR in Cambodia! Tourist visa lang muna. If immigration asks, say you are on vacation.', NumMedia: '0' };
  const formRequest = (url: string, signature?: string) => new Request(url, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(signature ? { 'X-Twilio-Signature': signature } : {}) },
    body: new URLSearchParams(params).toString(),
  });

  it('replies with TwiML when the signature is valid', async () => {
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
    const url = 'https://example.org/api/whatsapp';
    const res = await twilioPost(formRequest(url, twilioSignature('test-token', url, params)));
    const xml = await res.text();
    expect(res.status).toBe(200);
    expect(xml).toContain('<Response><Message>');
    expect(xml).toContain('HIGH RISK');
    expect(xml).toContain('1343');
  });

  it('rejects a bad signature', async () => {
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
    expect((await twilioPost(formRequest('https://example.org/api/whatsapp', 'bogus'))).status).toBe(403);
  });
});

describe('/api/whatsapp/meta', () => {
  it('verifies the webhook subscription', async () => {
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'abc');
    const res = metaGet(new Request('https://x/api/whatsapp/meta?hub.mode=subscribe&hub.verify_token=abc&hub.challenge=42'));
    expect(await res.text()).toBe('42');
    expect(metaGet(new Request('https://x/api/whatsapp/meta?hub.mode=subscribe&hub.verify_token=no&hub.challenge=42')).status).toBe(403);
  });

  it('is disabled until configured', async () => {
    vi.stubEnv('META_APP_SECRET', '');
    expect((await metaPost(json('https://x/api/whatsapp/meta', {}))).status).toBe(503);
  });

  it('parses messages and checks signatures', () => {
    const payload = { entry: [{ changes: [{ value: { messages: [{ from: '254712345678', text: { body: 'hello' } }] } }] }] };
    expect(parseMetaWebhook(payload)).toEqual([{ from: '+254712345678', text: 'hello', numMedia: 0, mediaTypes: [] }]);
    const raw = JSON.stringify(payload);
    const sig = 'sha256=' + createHmac('sha256', 's3cret').update(raw).digest('hex');
    expect(verifyMeta('s3cret', sig, raw)).toBe(true);
    expect(verifyMeta('s3cret', 'sha256=00', raw)).toBe(false);
  });
});

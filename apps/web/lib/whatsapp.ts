/**
 * WhatsApp transport helpers. Both transports call the same engine handler (handleTiplineMessage).
 *   Twilio (demo / sandbox): form-encoded webhook, reply with TwiML, verify X-Twilio-Signature.
 *   Meta WhatsApp Cloud API (production): JSON webhook, verify X-Hub-Signature-256, reply via Graph API.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Twilio's request signature: base64(HMAC-SHA1(authToken, url + sorted key/value pairs)). */
export function twilioSignature(authToken: string, url: string, params: Record<string, string>): string {
  const data = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url);
  return createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

export function verifyTwilio(authToken: string, signature: string | null, url: string, params: Record<string, string>): boolean {
  if (!signature) return false;
  return safeEqual(twilioSignature(authToken, url, params), signature);
}

/** Meta's signature: "sha256=" + hex(HMAC-SHA256(appSecret, rawBody)). */
export function verifyMeta(appSecret: string, signature: string | null, rawBody: string): boolean {
  if (!signature?.startsWith('sha256=')) return false;
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody, 'utf-8').digest('hex');
  return safeEqual(expected, signature);
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function twiml(messages: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${messages.map((m) => `<Message>${escapeXml(m)}</Message>`).join('')}</Response>`;
}

export interface MetaIncoming {
  from: string;
  text: string;
  numMedia: number;
  mediaTypes: string[];
}

/** Extracts the user messages from a WhatsApp Cloud API webhook payload. */
export function parseMetaWebhook(body: unknown): MetaIncoming[] {
  const out: MetaIncoming[] = [];
  const entries = (body as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<Record<string, any>> } }> }> })?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        const media = ['image', 'audio', 'video', 'document', 'sticker'].filter((k) => m[k]);
        out.push({
          from: `+${m.from ?? ''}`,
          text: m.text?.body ?? m.image?.caption ?? '',
          numMedia: media.length,
          mediaTypes: media.map((k) => m[k]?.mime_type ?? k),
        });
      }
    }
  }
  return out;
}

export async function sendMetaMessages(to: string, messages: string[]): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) throw new Error('WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required');
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  for (const body of messages) {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/^\+/, ''), type: 'text', text: { body, preview_url: false } }),
    });
    if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status}`);
  }
}

import { after } from 'next/server';
import { handleTiplineMessage } from '@hireaware/engine';
import { classifier, MAX_TEXT } from '@/lib/engine';
import { SITE } from '@/lib/site';
import { parseMetaWebhook, sendMetaMessages, verifyMeta } from '@/lib/whatsapp';

/**
 * Meta WhatsApp Cloud API webhook (production). Callback URL: https://<your-domain>/api/whatsapp/meta,
 * verify token = WHATSAPP_VERIFY_TOKEN, subscribe to "messages".
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === expected) {
    return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.META_APP_SECRET;
  if (!secret || !process.env.WHATSAPP_ACCESS_TOKEN) return new Response('WhatsApp Cloud API is not configured', { status: 503 });
  if (!verifyMeta(secret, request.headers.get('x-hub-signature-256'), raw)) return new Response('Invalid signature', { status: 403 });

  let incoming;
  try {
    incoming = parseMetaWebhook(JSON.parse(raw));
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  // Acknowledge at once (Meta retries slow webhooks), then reply.
  after(async () => {
    for (const m of incoming) {
      const reply = handleTiplineMessage({ ...m, text: m.text.slice(0, MAX_TEXT), siteUrl: SITE.url }, { classifier });
      try {
        await sendMetaMessages(m.from, reply.messages);
      } catch (error) {
        console.error('whatsapp/meta: send failed', error instanceof Error ? error.message : error);
      }
    }
  });
  return new Response('OK', { status: 200 });
}

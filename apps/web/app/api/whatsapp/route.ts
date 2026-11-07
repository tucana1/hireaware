import { handleTiplineMessage } from '@hireaware/engine';
import { classifier, MAX_TEXT } from '@/lib/engine';
import { SITE } from '@/lib/site';
import { twiml, verifyTwilio } from '@/lib/whatsapp';

/**
 * Twilio WhatsApp webhook (sandbox or a Twilio WhatsApp sender). In the Twilio console, set
 * "When a message comes in" to POST https://<your-domain>/api/whatsapp.
 *
 * With TWILIO_AUTH_TOKEN set, requests without a valid X-Twilio-Signature are rejected. Set
 * PUBLIC_BASE_URL when running behind a proxy or tunnel so the signed URL matches.
 * Message text is analysed and discarded; nothing is logged or stored.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === 'string') params[key] = value;
  });

  const token = process.env.TWILIO_AUTH_TOKEN;
  if (token) {
    const url = process.env.PUBLIC_BASE_URL
      ? new URL(new URL(request.url).pathname + new URL(request.url).search, process.env.PUBLIC_BASE_URL).toString()
      : request.url;
    if (!verifyTwilio(token, request.headers.get('x-twilio-signature'), url, params)) {
      return new Response('Invalid signature', { status: 403 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return new Response('TWILIO_AUTH_TOKEN is not configured', { status: 503 });
  }

  const numMedia = Number(params.NumMedia ?? 0) || 0;
  const mediaTypes = Array.from({ length: numMedia }, (_, i) => params[`MediaContentType${i}`] ?? '');
  const reply = handleTiplineMessage(
    { text: (params.Body ?? '').slice(0, MAX_TEXT), from: params.From, numMedia, mediaTypes, siteUrl: SITE.url },
    { classifier },
  );
  return new Response(twiml(reply.messages), { headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MAX_TEXT } from '@/lib/engine';
import { SITE } from '@/lib/site';
import { tiplineReply } from '@/lib/tipline';

const Body = z.object({ text: z.string().max(MAX_TEXT), from: z.string().max(40).optional() });

/** The on-site tipline demo: same replies as WhatsApp, no WhatsApp account needed. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Send JSON {"text": "..."}' }, { status: 400 });
  const reply = await tiplineReply({ text: parsed.data.text, from: parsed.data.from, siteUrl: SITE.url });
  return NextResponse.json(reply, { headers: { 'Cache-Control': 'no-store' } });
}

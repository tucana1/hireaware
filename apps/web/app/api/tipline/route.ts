import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleTiplineMessage } from '@hireaware/engine';
import { classifier, MAX_TEXT } from '@/lib/engine';
import { SITE } from '@/lib/site';

const Body = z.object({ text: z.string().max(MAX_TEXT), from: z.string().max(40).optional() });

/** The on-site tipline simulator: same replies as WhatsApp, no WhatsApp account needed. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Send JSON {"text": "..."}' }, { status: 400 });
  const reply = handleTiplineMessage({ text: parsed.data.text, from: parsed.data.from, siteUrl: SITE.url }, { classifier });
  return NextResponse.json({ kind: reply.kind, messages: reply.messages }, { headers: { 'Cache-Control': 'no-store' } });
}

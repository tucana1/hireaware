import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyze } from '@hireaware/engine';
import { classifier, MAX_TEXT } from '@/lib/engine';

const Body = z.object({ text: z.string().min(1).max(MAX_TEXT) });

/** Analyse a job ad or recruiter message. Nothing is stored. Also used by the browser extension (optional). */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: `Send JSON {"text": "..."} with 1 to ${MAX_TEXT} characters.` }, { status: 400 });
  }
  const result = analyze(parsed.data.text, { classifier });
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
}

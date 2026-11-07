import { z } from 'zod';
import { searchFaq } from '@hireaware/engine';
import { claudeConfigured, streamClaudeAnswer } from '@/lib/claude';

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) })).min(1).max(20),
  context: z.string().max(1500).optional(),
});

const NO_MATCH = 'I don\'t have a good answer for that yet. Try asking about tourist visas, fees, fake accounts, how to check a recruiter, or what to do if you are stuck abroad. If you are in danger, the Get help page lists hotlines for your country.';

/**
 * Free-text questions in the chatbot. Streams plain text. With ANTHROPIC_API_KEY set, Claude answers using
 * our knowledge base; without it, the best local FAQ answer is returned. Nothing is stored.
 */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') {
    return new Response('Bad request', { status: 400 });
  }
  const { messages, context } = parsed.data;
  const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };

  if (claudeConfigured()) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamClaudeAnswer(messages, context)) controller.enqueue(encoder.encode(chunk));
        } catch (error) {
          console.error('chat: Claude request failed', error instanceof Error ? error.message : error);
          controller.enqueue(encoder.encode(localAnswer(messages.at(-1)!.content)));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { ...headers, 'X-Answer-Source': 'claude' } });
  }
  return new Response(localAnswer(messages.at(-1)!.content), { headers: { ...headers, 'X-Answer-Source': 'faq' } });
}

function localAnswer(question: string): string {
  const [best] = searchFaq(question, 1);
  if (!best) return NO_MATCH;
  const sources = best.entry.sources?.length ? `\n\nSources: ${best.entry.sources.map((s) => `${s.title} (${s.url})`).join('; ')}` : '';
  return `${best.entry.answer}${sources}`;
}

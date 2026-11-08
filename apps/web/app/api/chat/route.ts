import { z } from 'zod';
import { describeAnswers, getStep, searchFaq } from '@hireaware/engine';
import { answerDuringCheck, claudeConfigured, streamClaudeAnswer } from '@/lib/claude';

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) })).min(1).max(20),
  context: z.string().max(1500).optional(),
  /** The risk-check question on screen when the person typed, and their answers so far. */
  pendingStep: z.string().max(40).optional(),
  answers: z.record(z.string().max(40), z.array(z.string().max(40)).max(20)).optional(),
});

const NO_MATCH = 'I don\'t have a good answer for that yet. Try asking about tourist visas, fees, fake accounts, how to check a recruiter, or what to do if you are stuck abroad. If you are in danger, the Get help page lists hotlines for your country.';

/**
 * Free-text messages in the chatbot. Nothing is stored.
 *
 * - While the risk check is waiting on a question (`pendingStep`), returns JSON `{ reply, answerIds }`:
 *   Claude reads the text as a possible answer, so the check moves on. Without a key, the local FAQ
 *   answers and `answerIds` is empty.
 * - Otherwise streams plain text: Claude with ANTHROPIC_API_KEY set, else the best local FAQ answer.
 */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== 'user') {
    return new Response('Bad request', { status: 400 });
  }
  const { messages, context, pendingStep, answers } = parsed.data;
  const question = messages.at(-1)!.content;
  const headers = { 'Cache-Control': 'no-store' };

  const step = pendingStep ? getStep(pendingStep) : undefined;
  if (pendingStep) {
    if (!step) return new Response('Bad request', { status: 400 });
    if (claudeConfigured()) {
      try {
        const turn = await answerDuringCheck(messages, { prompt: step.prompt, kind: step.kind, options: step.options }, describeAnswers(answers ?? {}));
        return Response.json(turn, { headers: { ...headers, 'X-Answer-Source': 'claude' } });
      } catch (error) {
        console.error('chat: Claude check turn failed', error instanceof Error ? error.message : error);
      }
    }
    return Response.json({ reply: localAnswer(question), answerIds: [] }, { headers: { ...headers, 'X-Answer-Source': 'faq' } });
  }

  const text = { ...headers, 'Content-Type': 'text/plain; charset=utf-8' };
  if (claudeConfigured()) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamClaudeAnswer(messages, context)) controller.enqueue(encoder.encode(chunk));
        } catch (error) {
          console.error('chat: Claude request failed', error instanceof Error ? error.message : error);
          controller.enqueue(encoder.encode(localAnswer(question)));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { ...text, 'X-Answer-Source': 'claude' } });
  }
  return new Response(localAnswer(question), { headers: { ...text, 'X-Answer-Source': 'faq' } });
}

function localAnswer(question: string): string {
  const [best] = searchFaq(question, 1);
  if (!best) return NO_MATCH;
  const sources = best.entry.sources?.length ? `\n\nSources: ${best.entry.sources.map((s) => `${s.title} (${s.url})`).join('; ')}` : '';
  return `${best.entry.answer}${sources}`;
}

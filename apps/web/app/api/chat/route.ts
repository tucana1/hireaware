import { z } from 'zod';
import { STEPS, describeAnswers, getStep, searchFaq } from '@hireaware/engine';
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
 * - While the risk check is waiting on a question (`pendingStep`), returns JSON `{ reply, answers }`:
 *   Claude reads the text as an answer to that question and to any later ones it fully covers, so the
 *   check moves on and skips those. Without a key, the local FAQ answers and `answers` is empty.
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
        const done = answers ?? {};
        // The question on screen first, then every other unanswered one (later answers can make
        // conditional questions relevant, so all are offered).
        const steps = [step, ...STEPS.filter((st) => st.id !== step.id && !done[st.id])]
          .map(({ id, prompt, kind, options }) => ({ id, prompt, kind, options: options.map(({ id: oid, label }) => ({ id: oid, label })) }));
        const turn = await answerDuringCheck(messages, steps, describeAnswers(done));
        return Response.json(turn, { headers: { ...headers, 'X-Answer-Source': 'claude' } });
      } catch (error) {
        console.error('chat: Claude check turn failed', error instanceof Error ? error.message : error);
      }
    }
    return Response.json({ reply: localAnswer(question), answers: {} }, { headers: { ...headers, 'X-Answer-Source': 'faq' } });
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

/**
 * Optional Claude-powered answers for the chatbot's free-text questions. Used only when ANTHROPIC_API_KEY
 * is set; otherwise the chatbot answers from the local knowledge base (packages/engine/src/knowledge.ts).
 */
import Anthropic from '@anthropic-ai/sdk';
import { knowledgeText, REGION_GUIDES } from '@hireaware/engine';

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

export function claudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

// Stable prefix (cached): instructions + knowledge base. Per-request context goes in the messages.
const SYSTEM = `You are the Parakh assistant on a public website that helps people, mostly in the Global South, spot job offers that would make them unknowing workers for troll farms and covert propaganda, or traffic them into online-scam compounds, or are job scams.

How to answer:
- Plain, warm, short answers (under 180 words) that someone reading on a phone in their second language can follow. Answer in the language the person writes in.
- The chat window shows plain text only: no Markdown (no asterisks, no # headings, no bold). For lists, start lines with "- " or "1. ".
- Focus on behaviours and what to do next, never on political parties or candidates. Do not say whether any named real company or person is a criminal; say what to verify and how.
- Prefer the facts and sources in the knowledge base below. If you are not sure, say so and point to the official checks (licence registries, hotlines) instead of guessing. Never invent phone numbers.
- If the person may be in danger now (passport taken, cannot leave, threats, forced to scam), put safety first: only use the phone when safe, contact their embassy or anti-trafficking hotline, beware of paid "rescuers", and remind them that forced-scam victims should be treated as victims.
- Do not ask for or repeat personal details such as full names, ID numbers, account numbers or exact locations.

KNOWLEDGE BASE
${knowledgeText()}

REGIONAL NOTES
${REGION_GUIDES.map((g) => `${g.name}:\n- ${g.points.join('\n- ')}`).join('\n\n')}`;

// Tipline replies: Claude writes the middle of the WhatsApp reply. Our code adds the verdict line before it
// and verified help numbers after it, so the model can't soften a verdict or invent a hotline.
const TIPLINE_SYSTEM = `You write the body of a reply on the Parakh WhatsApp tipline. Someone has forwarded a job ad or a recruiter's message. Our checker has already analysed it; its analysis is authoritative.

Write, in the same language as the forwarded message (English if unsure):
1. "Why" - 2 to 4 short points that point to what this specific message actually says (quote a few words where useful), based on the red flags in the analysis.
2. "Ask them, and insist on written answers" - 4 to 6 strict, specific questions to send back to this recruiter. Start from the suggested questions in the analysis and tailor them to the details in the message (the country, job, pay, platform or fee it mentions).
3. "Next" - 2 or 3 concrete steps, from the analysis's next steps.

Rules:
- Write the three section headings in the message's language too (for Filipino, for example: "Bakit", "Itanong sa kanila, at hingin ang sagot nang nakasulat", "Susunod").
- Plain text for WhatsApp: no Markdown, no asterisks, no emojis. Start list lines with "- " or "1. ". Put a blank line between sections.
- Do not write a verdict line, greeting or sign-off, and do not include phone numbers or links: those are added separately.
- Never contradict or soften the analysis. If its verdict is "low", say that no common red flags were found but that is not a guarantee.
- Describe behaviours, not people: never say a named company or person is a criminal, and never mention political parties.
- Under 1,000 characters in total.`;

export interface TiplineFacts {
  verdict: string;
  summary: string;
  topCategory: string | null;
  redFlags: Array<{ title: string; explain: string; evidence: string }>;
  reassuring: string[];
  questions: string[];
  nextSteps: string[];
}

/** Claude-written middle section of a tipline reply, or throws (caller falls back to the templated reply). */
export async function writeTiplineBody(message: string, facts: TiplineFacts): Promise<string> {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 1200,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: TIPLINE_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `Forwarded message:\n"""\n${message.slice(0, 6000)}\n"""\n\nAnalysis (authoritative):\n${JSON.stringify(facts, null, 1)}`,
    }],
  }, { timeout: 10_000, maxRetries: 0 });
  if (response.stop_reason !== 'end_turn') throw new Error(`tipline reply stopped: ${response.stop_reason}`);
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim();
  if (!text) throw new Error('empty tipline reply');
  return text.replace(/\*\*/g, '').slice(0, 1400);
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Streams Claude's answer as plain text chunks. `context` is a short summary of the person's risk-check
 * answers (never their raw messages), so answers can be specific.
 */
export async function* streamClaudeAnswer(turns: ChatTurn[], context?: string): AsyncGenerator<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));
  if (context && messages[0]?.role === 'user') {
    messages[0] = { role: 'user', content: `[Context from my risk check: ${context}]\n\n${turns[0]!.content}` };
  }
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 1500,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages,
  });
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text;
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') {
    yield '\n\nI can\'t help with that here. For urgent help, see the Get help page for hotlines in your country.';
  }
}

// Free text typed while the risk check is waiting on a question. Claude replies and says which questions
// the text answers: the one on screen and any later ones it fully covers, so the check can skip those
// instead of asking them again.
const CHECK_TURN = `The person is partway through the risk check. Their last message lists the check's remaining questions with option ids; the check is waiting on the first one. Their newest message may answer it, answer later questions as well, ask something of their own, or a mix.

Return JSON:
- answers: for every question id, the option ids their message answers, or [] if it does not answer that question.
  - The waiting question: for a single-choice question give exactly one id; if several fit, pick the one that matters most for their safety (abroad over an office at home, over remote work) and say so in the reply. For a pick-all-that-apply question give every id that fits. Give [] if the message does not answer it or you cannot tell which option fits.
  - Later questions: fill one only when the message clearly and fully answers it, so the check can skip it. Never guess, and never infer "none of these" from what they did not mention. A pick-all-that-apply question about a description (such as what kind of work it is or what they would post about) is answered when the message describes it. A pick-all-that-apply checklist of warning signs (what they were told, asked for, or what is happening now) stays [] unless the message covers the whole list, because not mentioning a sign does not mean it is absent.
- reply: what the chat shows them. If you recorded any answers, one short sentence saying what you recorded (in their words where possible), plus a brief answer only if they also asked something. Nothing else: no extra advice (the check gives advice at the end), no offer to change answers later (the check cannot go back), no invitation to pick an option, and do not ask the next question: the chat shows it by itself. If you recorded nothing, answer their message briefly and, if they seemed to be answering but it was unclear, ask one short question that tells the options apart. Otherwise end by inviting them to pick an option below when ready.`;

export interface CheckStep {
  id: string;
  prompt: string;
  kind: 'single' | 'multi';
  options: Array<{ id: string; label: string }>;
}

export interface CheckTurn {
  /** Step id → chosen option ids, only for the steps the message answered. */
  answers: Record<string, string[]>;
  reply: string;
}

/**
 * One Claude call: a reply plus the answers the typed text gives. `steps[0]` is the question on screen;
 * the rest are the check's other unanswered questions. Throws on failure.
 */
export async function answerDuringCheck(turns: ChatTurn[], steps: CheckStep[], answersSoFar: string): Promise<CheckTurn> {
  const last = turns.at(-1)!;
  const listed = steps.map((st, i) => `${i === 0 ? 'WAITING ON ' : ''}${st.id} (${st.kind === 'single' ? 'pick one' : 'pick all that apply'}): ${st.prompt}\n${st.options.map((o) => `  - ${o.id}: ${o.label}`).join('\n')}`).join('\n\n');
  const framed = `[Risk check so far:\n${answersSoFar || '(nothing yet)'}\n\nRemaining questions:\n${listed}]\n\nMy message: ${last.content}`;
  const properties = Object.fromEntries(steps.map((st) => [st.id, { type: 'array', items: { type: 'string', enum: st.options.map((o) => o.id) } }]));
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            answers: { type: 'object', properties, required: steps.map((st) => st.id), additionalProperties: false },
            reply: { type: 'string' },
          },
          required: ['answers', 'reply'],
          additionalProperties: false,
        },
      },
    },
    system: [
      { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: CHECK_TURN },
    ],
    messages: [...turns.slice(0, -1).map((t) => ({ role: t.role, content: t.content })), { role: 'user', content: framed }],
  }, { timeout: 20_000, maxRetries: 1 });
  if (response.stop_reason === 'refusal') {
    return { answers: {}, reply: 'I can\'t help with that here. For urgent help, see the Get help page for hotlines in your country.' };
  }
  if (response.stop_reason !== 'end_turn') throw new Error(`check turn stopped: ${response.stop_reason}`);
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const parsed = JSON.parse(text) as { answers?: Record<string, unknown>; reply?: unknown };
  return { answers: cleanAnswers(steps, parsed.answers ?? {}), reply: typeof parsed.reply === 'string' ? parsed.reply.replace(/\*\*/g, '').trim() : '' };
}

/** Keeps only real option ids: one for a single-choice step, and "none" only when it stands alone. */
export function cleanAnswers(steps: CheckStep[], raw: Record<string, unknown>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const st of steps) {
    const given = raw[st.id];
    if (!Array.isArray(given)) continue;
    const valid = [...new Set(given.filter((x): x is string => typeof x === 'string' && st.options.some((o) => o.id === x)))];
    const ids = valid.length > 1 ? valid.filter((x) => x !== 'none') : valid;
    if (ids.length) out[st.id] = st.kind === 'single' ? ids.slice(0, 1) : ids;
  }
  return out;
}

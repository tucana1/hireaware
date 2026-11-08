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

// Free text typed while the risk check is waiting on a question. Claude both replies and says which
// option(s), if any, the text answers, so the check moves on instead of asking the same question again.
const CHECK_TURN = `The person is partway through the risk check, and the check is waiting for their answer to one question (shown in their last message, with the option ids). Their newest message may be an answer to it, a question of their own, or both.

Return JSON:
- answer_ids: the option ids their message answers. For a single-choice question give exactly one id; if several fit, pick the one that matters most for their safety (abroad over an office at home, over remote work) and say so in the reply. For a pick-all-that-apply question give every id that fits. Give [] if the message does not answer the question, or if you cannot tell which option fits.
- reply: what the chat shows them. If you gave answer_ids, one short sentence saying how you recorded it (in their words where possible), plus a brief answer only if they also asked something. Nothing else: no extra advice (the check gives advice at the end), no offer to change the answer later (the check cannot go back), no invitation to pick an option, and do not repeat the check's question or ask the next one: the chat shows the next question by itself. If you gave [], answer their message briefly and, if they seemed to be answering but it was unclear, ask one short question that tells the options apart. Otherwise end by inviting them to pick an option below when ready.`;

export interface PendingStep {
  prompt: string;
  kind: 'single' | 'multi';
  options: Array<{ id: string; label: string }>;
}

export interface CheckTurn {
  answerIds: string[];
  reply: string;
}

/** One Claude call: a reply plus the option ids (if any) that the typed text answers. Throws on failure. */
export async function answerDuringCheck(turns: ChatTurn[], step: PendingStep, answersSoFar: string): Promise<CheckTurn> {
  const ids = step.options.map((o) => o.id);
  const last = turns.at(-1)!;
  const framed = `[Risk check so far:\n${answersSoFar || '(nothing yet)'}\n\nWaiting for: "${step.prompt}" (${step.kind === 'single' ? 'pick one' : 'pick all that apply'})\nOptions:\n${step.options.map((o) => `- ${o.id}: ${o.label}`).join('\n')}]\n\nMy message: ${last.content}`;
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 1500,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            answer_ids: { type: 'array', items: { type: 'string', enum: ids } },
            reply: { type: 'string' },
          },
          required: ['answer_ids', 'reply'],
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
    return { answerIds: [], reply: 'I can\'t help with that here. For urgent help, see the Get help page for hotlines in your country.' };
  }
  if (response.stop_reason !== 'end_turn') throw new Error(`check turn stopped: ${response.stop_reason}`);
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const parsed = JSON.parse(text) as { answer_ids?: unknown; reply?: unknown };
  const chosen = Array.isArray(parsed.answer_ids) ? [...new Set(parsed.answer_ids.filter((x): x is string => typeof x === 'string' && ids.includes(x)))] : [];
  // "None of these" only counts on its own; a single-choice question takes one id.
  const cleaned = chosen.length > 1 ? chosen.filter((x) => x !== 'none') : chosen;
  return {
    answerIds: step.kind === 'single' ? cleaned.slice(0, 1) : cleaned,
    reply: typeof parsed.reply === 'string' ? parsed.reply.replace(/\*\*/g, '').trim() : '',
  };
}

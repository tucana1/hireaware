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

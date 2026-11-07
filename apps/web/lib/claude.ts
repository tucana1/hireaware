/**
 * Optional Claude-powered answers for the chatbot's free-text questions. Used only when ANTHROPIC_API_KEY
 * is set; otherwise the chatbot answers from the local knowledge base (packages/engine/src/knowledge.ts).
 */
import Anthropic from '@anthropic-ai/sdk';
import { knowledgeText, REGION_GUIDES } from '@hireaware/engine';

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

export function claudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

// Stable prefix (cached): instructions + knowledge base. Per-request context goes in the messages.
const SYSTEM = `You are the HireAware assistant on a public website that helps people, mostly in the Global South, spot job offers that would make them unknowing workers for troll farms and covert propaganda, or traffic them into online-scam compounds, or are job scams.

How to answer:
- Plain, warm, short answers (under 180 words) that someone reading on a phone in their second language can follow. Answer in the language the person writes in.
- Focus on behaviours and what to do next, never on political parties or candidates. Do not say whether any named real company or person is a criminal; say what to verify and how.
- Prefer the facts and sources in the knowledge base below. If you are not sure, say so and point to the official checks (licence registries, hotlines) instead of guessing. Never invent phone numbers.
- If the person may be in danger now (passport taken, cannot leave, threats, forced to scam), put safety first: only use the phone when safe, contact their embassy or anti-trafficking hotline, beware of paid "rescuers", and remind them that forced-scam victims should be treated as victims.
- Do not ask for or repeat personal details such as full names, ID numbers, account numbers or exact locations.

KNOWLEDGE BASE
${knowledgeText()}

REGIONAL NOTES
${REGION_GUIDES.map((g) => `${g.name}:\n- ${g.points.join('\n- ')}`).join('\n\n')}`;

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

/**
 * Tipline replies for every transport (Twilio, Meta, the on-site demo). The rules and the trained classifier
 * always run and decide the verdict, red flags and questions. When an Anthropic key is set, Claude rewrites
 * the middle of the reply for the specific message, in the sender's language; on any failure or timeout the
 * templated reply is used, so the tipline always answers.
 */
import { composeTiplineReply, handleTiplineMessage, type TiplineInput } from '@hireaware/engine';
import { classifier, MAX_TEXT } from './engine';
import { claudeConfigured, writeTiplineBody } from './claude';

export interface TiplineResult {
  kind: string;
  messages: string[];
  /** Who wrote the body of an analysis reply. */
  writer: 'claude' | 'template';
}

export async function tiplineReply(input: TiplineInput): Promise<TiplineResult> {
  const text = (input.text ?? '').slice(0, MAX_TEXT);
  const base = handleTiplineMessage({ ...input, text }, { classifier });
  if (base.kind !== 'analysis' || !base.analysis || !claudeConfigured()) {
    return { kind: base.kind, messages: base.messages, writer: 'template' };
  }
  const a = base.analysis;
  try {
    const body = await writeTiplineBody(text, {
      verdict: a.verdict,
      summary: a.summary,
      topCategory: a.topCategory,
      redFlags: a.redFlags.slice(0, 5).map((f) => ({ title: f.title, explain: f.explain, evidence: f.evidence })),
      reassuring: a.reassuring.map((f) => f.title),
      questions: a.questions.map((q) => q.text),
      nextSteps: a.nextSteps,
    });
    return { kind: base.kind, messages: composeTiplineReply(a, body, base.country), writer: 'claude' };
  } catch (error) {
    console.error('tipline: AI reply failed, using template', error instanceof Error ? error.message : error);
    return { kind: base.kind, messages: base.messages, writer: 'template' };
  }
}

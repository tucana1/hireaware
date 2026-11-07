/**
 * WhatsApp tipline replies. A person forwards a recruiter's message; we reply with the risk, the reasons
 * and, above all, strict questions to put back to the recruiter. Transport-agnostic: the website's
 * Twilio and Meta webhooks (and the on-site simulator) all call handleTiplineMessage().
 *
 * Kept short for chat: WhatsApp messages are split at ~1,500 characters.
 */
import type { Analysis, Category } from './types';
import { analyze, categoryLabel } from './analyze';
import type { RiskClassifier } from './classifier';
import { GLOBAL_HELP, countryFromPhone, type Country } from './regions';
import { UNIVERSAL_QUESTIONS, questionsFor } from './questions';
import { wordCount } from './text';

export interface TiplineInput {
  text: string;
  /** Sender address, e.g. "whatsapp:+639171234567". Used only to pick local hotlines; never stored. */
  from?: string;
  /** Number of attached media items (images, voice notes). */
  numMedia?: number;
  mediaTypes?: string[];
  siteUrl?: string;
}

export interface TiplineReply {
  messages: string[];
  /** What the handler did, for logs and tests (never includes message text). */
  kind: 'welcome' | 'help' | 'questions' | 'privacy' | 'analysis' | 'media' | 'too_short';
  analysis?: Analysis;
}

const MAX = 1500;
const BADGE: Record<Analysis['verdict'], string> = { high: '🔴 HIGH RISK', caution: '🟠 BE CAREFUL', low: '🟢 NO COMMON RED FLAGS', unclear: '⚪ NOT ENOUGH TO GO ON' };

const COMMANDS: Record<string, TiplineReply['kind']> = {
  hi: 'welcome', hello: 'welcome', start: 'welcome', menu: 'welcome', hola: 'welcome', habari: 'welcome', halo: 'welcome', kumusta: 'welcome', namaste: 'welcome', bonjour: 'welcome', 'olá': 'welcome', ola: 'welcome',
  help: 'help', tulong: 'help', ayuda: 'help', ajuda: 'help', aide: 'help', msaada: 'help', bantuan: 'help', madad: 'help', hotline: 'help', hotlines: 'help',
  questions: 'questions', checklist: 'questions', more: 'questions', tanong: 'questions', preguntas: 'questions', perguntas: 'questions', maswali: 'questions', pertanyaan: 'questions',
  privacy: 'privacy', delete: 'privacy', stop: 'privacy',
};

export function welcomeMessage(siteUrl?: string): string {
  return [
    '👋 This is the HireAware tipline.',
    'Forward me a job ad or a recruiter\'s message (paste the text) and I\'ll tell you what looks risky and what to ask them before you say yes.',
    'I look for signs of troll-farm work, trafficking into scam compounds and job scams. I don\'t store your messages.',
    'Reply HELP for hotlines, QUESTIONS for a checklist, PRIVACY for how your data is handled.',
    siteUrl ? `Full guide and risk check: ${siteUrl}` : '',
  ].filter(Boolean).join('\n\n');
}

function helpMessage(country: Country | undefined): string {
  const lines = ['🆘 Help and reporting'];
  if (country) {
    lines.push(`In ${country.name}:`);
    for (const c of country.help) lines.push(`• ${c.name}${c.phone ? `: ${c.phone}` : ''}${c.verified ? '' : ' (check before relying on it)'}`);
    for (const v of country.verify) lines.push(`• Check a recruiter: ${v.name}${v.url ? ` ${v.url}` : ''}`);
  } else {
    lines.push('Philippines: 1343 Actionline (trafficking, 24/7) · DMW 1348 · NBI (02) 8523-8231', 'India: 1930 · Nigeria: NAPTIP 627 · Ghana: 292 · Sri Lanka: 1989 · Malaysia: 997 · Thailand: 1441');
  }
  lines.push('Anywhere:');
  for (const c of GLOBAL_HELP) lines.push(`• ${c.name}${c.url ? ` ${c.url}` : ''}`);
  lines.push('If you are already somewhere you cannot leave, only use your phone when it is safe. Real embassies and NGOs never charge to help you.');
  return lines.join('\n');
}

function questionsMessage(): string {
  const qs = [...UNIVERSAL_QUESTIONS.slice(0, 3), ...questionsFor('trafficking').slice(0, 3), ...questionsFor('influence').slice(0, 3)];
  return ['📋 Ask any recruiter these, and get the answers in writing:', ...qs.map((q, i) => `${i + 1}. ${q.text}`),
    'A real employer can answer all of them. If they dodge, delay or get angry, treat it as a no.'].join('\n');
}

const PRIVACY = '🔒 I don\'t store the messages you forward. Each one is checked and then discarded. Your number is only used to choose local hotlines and is not saved.';

function splitMessages(text: string): string[] {
  if (text.length <= MAX) return [text];
  const parts: string[] = [];
  let current = '';
  for (const block of text.split('\n\n')) {
    if ((current + '\n\n' + block).length > MAX && current) {
      parts.push(current);
      current = block;
    } else current = current ? `${current}\n\n${block}` : block;
  }
  if (current) parts.push(current);
  return parts.flatMap((p) => (p.length > MAX ? p.match(new RegExp(`[\\s\\S]{1,${MAX}}`, 'g')) ?? [] : [p]));
}

const CATEGORY_EMOJI: Record<Category, string> = { influence: '📢', trafficking: '✈️', scam: '💸' };

export function formatAnalysis(a: Analysis, country?: Country): string {
  const blocks: string[] = [];
  const head = `🔎 HireAware check\n${BADGE[a.verdict]}${a.topCategory ? ` · ${CATEGORY_EMOJI[a.topCategory]} possible ${categoryLabel(a.topCategory)}` : ''}\n${a.summary}`;
  blocks.push(head);
  if (a.redFlags.length) blocks.push(['Why:', ...a.redFlags.slice(0, 4).map((f) => `• ${f.title}`)].join('\n'));
  if (a.reassuring.length && a.verdict !== 'high') blocks.push(['In its favour:', ...a.reassuring.slice(0, 2).map((f) => `• ${f.title}`)].join('\n'));
  blocks.push(['❓ Ask them, and insist on written answers:', ...a.questions.slice(0, 6).map((q, i) => `${i + 1}. ${q.text}`),
    'If they dodge, delay or get angry, treat it as a no.'].join('\n'));
  blocks.push(['Next:', ...a.nextSteps.slice(0, 3).map((s) => `• ${s}`)].join('\n'));
  const local = country?.help[0];
  blocks.push(`${local ? `Help in ${country!.name}: ${local.name}${local.phone ? ` ${local.phone}` : ''}. ` : ''}Reply HELP for hotlines. This is an automated check, not a final verdict.`);
  return blocks.join('\n\n');
}

export function handleTiplineMessage(input: TiplineInput, deps: { classifier?: RiskClassifier | null } = {}): TiplineReply {
  const text = (input.text ?? '').trim();
  const country = countryFromPhone(input.from);
  const command = COMMANDS[text.toLowerCase().replace(/[^\p{L}]/gu, '')];

  if (command && wordCount(text) <= 2) {
    const body = command === 'welcome' ? welcomeMessage(input.siteUrl) : command === 'help' ? helpMessage(country)
      : command === 'questions' ? questionsMessage() : PRIVACY;
    return { kind: command, messages: splitMessages(body) };
  }
  if (!text && (input.numMedia ?? 0) > 0) {
    const audio = (input.mediaTypes ?? []).some((t) => t.startsWith('audio'));
    return {
      kind: 'media',
      messages: [audio
        ? '🎙️ I can\'t listen to voice notes yet. Please type the main points: the job, the country, the pay, and what they asked you to do or pay.'
        : '🖼️ I can\'t read images yet. Please copy and paste the text of the ad or message (long-press the message, then Copy).'],
    };
  }
  if (wordCount(text) < 6) {
    return { kind: 'too_short', messages: [`That's a bit short to check. Paste the whole job ad or recruiter message.\n\n${welcomeMessage(input.siteUrl).split('\n\n').slice(-2).join('\n\n')}`] };
  }
  const analysis = analyze(text, { classifier: deps.classifier, maxQuestions: 6 });
  return { kind: 'analysis', analysis, messages: splitMessages(formatAnalysis(analysis, country)) };
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { assess, matchStepAnswer, nextStep, type Answers, type AssessmentResult, type Category, type Step } from '@hireaware/engine';
import { ArrowRight, ArrowUp, Check, Lock, RotateCcw, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { CATEGORY_NAME, ContactList, LevelMeter } from './ui';
import { LogoMark } from './Logo';

type Msg =
  | { from: 'bot'; kind: 'text'; text: string }
  | { from: 'user'; kind: 'text'; text: string }
  | { from: 'bot'; kind: 'result'; result: AssessmentResult };

const OVERALL = {
  high: { label: 'High risk', icon: ShieldAlert, box: 'bg-high-soft', text: 'text-high' },
  caution: { label: 'Be careful', icon: TriangleAlert, box: 'bg-caution-soft', text: 'text-caution' },
  low: { label: 'No common red flags', icon: ShieldCheck, box: 'bg-low-soft', text: 'text-low' },
} as const;

function summarise(r: AssessmentResult): string {
  const parts = (['influence', 'trafficking', 'scam'] as Category[]).map((c) => `${CATEGORY_NAME[c]}: ${r.levels[c]}`);
  const reasons = Object.values(r.reasons).flat().slice(0, 6);
  return `${parts.join('; ')}. Country: ${r.country?.name ?? 'not given'}. Reasons: ${reasons.join(' ') || 'none'}${r.urgent ? ' The person may be in danger now.' : ''}`;
}

function promptFor(step: Step): Msg {
  return { from: 'bot', kind: 'text', text: step.prompt + (step.hint ? `\n\n${step.hint}` : '') };
}

export function RiskChat() {
  const [answers, setAnswers] = useState<Answers>({});
  const [messages, setMessages] = useState<Msg[]>(() => [promptFor(nextStep({})!)]);
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const log = useRef<HTMLDivElement>(null);
  // Bumped on "Start over", so a reply that arrives after a restart is dropped.
  const run = useRef(0);
  const step: Step | null = useMemo(() => (result ? null : nextStep(answers)), [answers, result]);

  // Keep the newest message in view by scrolling the chat itself, not the page.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, step]);

  /** Records an answer and shows the next question (or the result). `shown` is false when the person typed it. */
  function answer(stepToAnswer: Step, ids: string[], shown = true, base: Answers = answers) {
    if (!ids.length) return;
    const labels = stepToAnswer.options.filter((o) => ids.includes(o.id)).map((o) => o.label).join(', ');
    const next = { ...base, [stepToAnswer.id]: ids };
    if (shown) setMessages((m) => [...m, { from: 'user', kind: 'text', text: labels }]);
    setSelected([]);
    const following = nextStep(next);
    if (following) {
      setMessages((m) => [...m, promptFor(following)]);
    } else {
      const r = assess(next);
      setResult(r);
      setMessages((m) => [...m, { from: 'bot', kind: 'result', result: r }]);
    }
    setAnswers(next);
  }

  function toggle(id: string) {
    setSelected((s) => (id === 'none' ? ['none'] : s.includes(id) ? s.filter((x) => x !== id) : [...s.filter((x) => x !== 'none'), id]));
  }

  function restart() {
    run.current += 1;
    setStreaming(false);
    setAnswers({});
    setMessages([promptFor(nextStep({})!)]);
    setResult(null);
    setSelected([]);
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;
    setInput('');
    const history = messages.filter((m): m is Extract<Msg, { kind: 'text' }> => m.kind === 'text')
      .slice(-8).map((m) => ({ role: m.from === 'user' ? 'user' as const : 'assistant' as const, content: m.text }));
    // The API needs a user message first.
    while (history.length && history[0]!.role !== 'user') history.shift();
    setMessages((m) => [...m, { from: 'user', kind: 'text', text: question }]);

    // A reply that plainly names an option ("Kenya", "no") answers the question on screen.
    const plain = step && matchStepAnswer(step, question);
    if (step && plain) return answer(step, plain, false);

    const thisRun = run.current;
    const pending = step;
    const answeredSoFar = answers;
    const setReply = (text: string) => setMessages((m) => [...m.slice(0, -1), { from: 'bot', kind: 'text', text }]);
    setMessages((m) => [...m, { from: 'bot', kind: 'text', text: '' }]);
    setStreaming(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: question }],
          context: result ? summarise(result) : undefined,
          ...(pending ? { pendingStep: pending.id, answers: answeredSoFar } : {}),
        }),
      });
      if (!res.ok || !res.body) throw new Error();
      if (pending) {
        // While the check is waiting on a question, the reply may also answer it.
        const turn = await res.json() as { reply: string; answerIds: string[] };
        if (run.current !== thisRun) return;
        const ids = turn.answerIds.filter((id) => pending.options.some((o) => o.id === id));
        if (turn.reply) setReply(turn.reply);
        else setMessages((m) => m.slice(0, -1));
        if (ids.length) answer(pending, ids, false, answeredSoFar);
        else if (res.headers.get('X-Answer-Source') !== 'claude') {
          // The local FAQ answer doesn't know about the check, so bring the question back.
          setMessages((m) => [...m, { from: 'bot', kind: 'text', text: `Back to the check: ${pending.prompt}` }]);
        }
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done || run.current !== thisRun) break;
        text += decoder.decode(value, { stream: true });
        setReply(text);
      }
    } catch {
      if (run.current !== thisRun) return;
      setReply('Sorry, I could not answer just now. The Warning signs and Get help pages have the key information.');
      if (pending) setMessages((m) => [...m, { from: 'bot', kind: 'text', text: `Back to the check: ${pending.prompt}` }]);
    } finally {
      if (run.current === thisRun) setStreaming(false);
    }
  }

  return (
    <div className="flex h-[min(80vh,760px)] flex-col overflow-hidden rounded-xl border border-line-strong bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <LogoMark className="size-7" />
          <div>
            <p className="font-medium leading-tight">Parakh assistant</p>
            <p className="flex items-center gap-1 text-xs text-faint"><Lock className="size-3" />Answers stay in your browser</p>
          </div>
        </div>
        <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-paper hover:text-ink">
          <RotateCcw className="size-3.5" />Start over
        </button>
      </div>

      <div ref={log} className="flex-1 space-y-4 overflow-y-auto bg-paper px-4 py-5 sm:px-5" role="log" aria-live="polite">
        {messages.map((m, i) => m.kind === 'result'
          ? <ResultCard key={i} result={m.result} />
          : m.from === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] whitespace-pre-wrap rounded-xl rounded-br-sm bg-accent px-3.5 py-2.5 text-[15px] leading-relaxed text-white">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="flex">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-xl rounded-bl-sm border border-line bg-white px-3.5 py-2.5 text-[15px] leading-relaxed">
                {m.text || <span className="inline-flex gap-1 py-1" aria-label="Typing">{[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: `${d * 150}ms` }} />)}</span>}
              </div>
            </div>
          ))}
      </div>

      {step && (
        <div className={`border-t border-line bg-white px-4 py-4 transition-opacity sm:px-5 ${streaming ? 'pointer-events-none opacity-50' : ''}`} aria-busy={streaming}>
          {step.kind === 'multi' && <p className="mb-2.5 text-xs font-medium text-faint">Pick all that apply</p>}
          <div className="flex flex-wrap gap-2">
            {step.options.map((o) => {
              const on = selected.includes(o.id);
              return step.kind === 'single' ? (
                <button key={o.id} type="button" onClick={() => answer(step, [o.id])}
                  className="rounded-lg border border-line-strong px-3 py-2 text-left text-sm text-ink transition-colors hover:border-accent hover:bg-accent-soft">{o.label}</button>
              ) : (
                <button key={o.id} type="button" onClick={() => toggle(o.id)} aria-pressed={on}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${on ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line-strong text-ink hover:border-accent'}`}>
                  {on && <Check className="size-3.5" />}{o.label}
                </button>
              );
            })}
          </div>
          {step.kind === 'multi' && (
            <button type="button" onClick={() => answer(step, selected)} disabled={!selected.length}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:bg-faint/40">
              Continue<ArrowRight className="size-4" />
            </button>
          )}
        </div>
      )}

      <form onSubmit={ask} className="flex items-center gap-2 border-t border-line bg-white p-3">
        <label htmlFor="q" className="sr-only">Ask a question</label>
        <input id="q" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000}
          placeholder={result ? 'Ask a follow-up question…' : 'Or type a question, e.g. "Is a tourist visa OK?"'}
          className="flex-1 rounded-lg border border-line-strong px-3.5 py-2.5 text-[15px] placeholder:text-faint focus:border-ink focus:outline-none" />
        <button type="submit" disabled={streaming || !input.trim()} aria-label="Ask"
          className="grid size-10 place-items-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-strong disabled:bg-faint/40">
          <ArrowUp className="size-4.5" />
        </button>
      </form>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function Bullets({ items, color = 'bg-accent' }: { items: string[]; color?: string }) {
  return <ul className="space-y-2">{items.map((s) => <li key={s} className="flex gap-2.5 text-[14.5px] leading-relaxed"><span className={`mt-2 size-1.5 shrink-0 rounded-full ${color}`} />{s}</li>)}</ul>;
}

function ResultCard({ result }: { result: AssessmentResult }) {
  const o = OVERALL[result.overall];
  const Icon = o.icon;
  const reasons = (['trafficking', 'influence', 'scam'] as Category[]).flatMap((c) => result.reasons[c]);
  return (
    <div className="space-y-6 rounded-xl border border-line bg-white p-5 sm:p-6">
      {result.urgent && (
        <div className="flex gap-3 rounded-lg bg-high px-4 py-3 text-white">
          <ShieldAlert className="size-5 shrink-0" />
          <p className="text-sm font-medium">You may be in danger. Only use your phone when it is safe. Hotlines are below, and your embassy can help.</p>
        </div>
      )}
      <div>
        <p className={`flex items-center gap-2 rounded-lg px-4 py-3 text-lg font-semibold ${o.box} ${o.text}`}><Icon className="size-5" strokeWidth={2} />{o.label}</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {(['influence', 'trafficking', 'scam'] as Category[]).map((c) => <LevelMeter key={c} label={CATEGORY_NAME[c]} level={result.levels[c]} />)}
        </div>
      </div>
      {reasons.length > 0 && <ResultSection title="What worried us"><Bullets items={reasons} color="bg-high" /></ResultSection>}
      <ResultSection title="What to do"><Bullets items={result.nextSteps} /></ResultSection>
      {result.saferIf.length > 0 && <ResultSection title="It would look safer if"><Bullets items={result.saferIf} color="bg-low" /></ResultSection>}
      <ResultSection title="Ask them, and get it in writing">
        <ol className="space-y-2.5">
          {result.questions.map((q, i) => (
            <li key={q.id} className="flex gap-3 text-[14.5px] leading-snug">
              <span className="w-5 shrink-0 font-semibold tabular-nums text-faint">{i + 1}.</span>{q.text}
            </li>
          ))}
        </ol>
      </ResultSection>
      {result.guide && <ResultSection title={`Worth knowing in ${result.guide.name}`}><Bullets items={result.guide.points.slice(0, 3)} /></ResultSection>}
      <ResultSection title={`Help${result.country ? ` in ${result.country.name}` : ''}`}>
        <ContactList contacts={result.help} />
      </ResultSection>
      <p className="border-t border-line pt-4 text-sm text-muted">
        <Link href="/scan" className="link">Paste the actual message into the scanner</Link> for a second look. You decide what to do; this is guidance, not a verdict.
      </p>
    </div>
  );
}

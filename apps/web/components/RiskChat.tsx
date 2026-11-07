'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { assess, nextStep, type Answers, type AssessmentResult, type Category, type Step } from '@hireaware/engine';
import { CATEGORY_NAME, ContactList, LEVEL_LABEL, Pill, levelTone } from './ui';

type Msg =
  | { from: 'bot'; kind: 'text'; text: string }
  | { from: 'user'; kind: 'text'; text: string }
  | { from: 'bot'; kind: 'result'; result: AssessmentResult };

const OVERALL = { high: { label: 'High risk', tone: 'high' as const }, caution: { label: 'Be careful', tone: 'caution' as const }, low: { label: 'No common red flags', tone: 'low' as const } };

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
  const bottom = useRef<HTMLDivElement>(null);
  const step: Step | null = useMemo(() => (result ? null : nextStep(answers)), [answers, result]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  function answer(stepToAnswer: Step, ids: string[]) {
    if (!ids.length) return;
    const labels = stepToAnswer.options.filter((o) => ids.includes(o.id)).map((o) => o.label).join(', ');
    const next = { ...answers, [stepToAnswer.id]: ids };
    setMessages((m) => [...m, { from: 'user', kind: 'text', text: labels }]);
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
    setMessages((m) => [...m, { from: 'user', kind: 'text', text: question }, { from: 'bot', kind: 'text', text: '' }]);
    setStreaming(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: question }], context: result ? summarise(result) : undefined }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages((m) => [...m.slice(0, -1), { from: 'bot', kind: 'text', text }]);
      }
    } catch {
      setMessages((m) => [...m.slice(0, -1), { from: 'bot', kind: 'text', text: 'Sorry, I could not answer just now. The Warning signs and Get help pages have the key information.' }]);
    } finally {
      setStreaming(false);
      // Re-ask the pending step so the check can continue.
      if (step) setMessages((m) => [...m, { from: 'bot', kind: 'text', text: `Back to the check: ${step.prompt}` }]);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card flex flex-col h-[min(78vh,760px)]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="font-semibold">Risk check</p>
          <p className="text-xs text-muted">Answers stay in your browser. Type a question at any time.</p>
        </div>
        <button type="button" onClick={restart} className="text-sm text-muted hover:text-ink">Start over</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" role="log" aria-live="polite">
        {messages.map((m, i) => m.kind === 'result'
          ? <ResultCard key={i} result={m.result} />
          : (
            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : ''}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${m.from === 'user' ? 'bg-accent text-white rounded-br-sm' : 'bg-paper border border-line rounded-bl-sm'}`}>
                {m.text || <span className="text-muted">…</span>}
              </div>
            </div>
          ))}
        <div ref={bottom} />
      </div>

      {step && (
        <div className="border-t border-line px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {step.options.map((o) => step.kind === 'single' ? (
              <button key={o.id} type="button" onClick={() => answer(step, [o.id])}
                className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-sm text-accent hover:bg-accent hover:text-white">{o.label}</button>
            ) : (
              <button key={o.id} type="button" onClick={() => toggle(o.id)} aria-pressed={selected.includes(o.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${selected.includes(o.id) ? 'bg-accent text-white border-accent' : 'border-line hover:border-accent'}`}>{o.label}</button>
            ))}
          </div>
          {step.kind === 'multi' && (
            <button type="button" onClick={() => answer(step, selected)} disabled={!selected.length}
              className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Continue</button>
          )}
        </div>
      )}

      <form onSubmit={ask} className="border-t border-line p-3 flex gap-2">
        <label htmlFor="q" className="sr-only">Ask a question</label>
        <input id="q" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000}
          placeholder={result ? 'Ask a follow-up question…' : 'Or type a question, e.g. "Is a tourist visa OK?"'}
          className="flex-1 rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none" />
        <button type="submit" disabled={streaming || !input.trim()} className="rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent disabled:opacity-40">Ask</button>
      </form>
    </div>
  );
}

function ResultCard({ result }: { result: AssessmentResult }) {
  const o = OVERALL[result.overall];
  return (
    <div className="rounded-xl border border-line bg-paper p-4 space-y-4">
      {result.urgent && (
        <div className="rounded-lg bg-high-soft border border-high/40 p-3 text-high font-medium">
          You may be in danger. Only use your phone when it is safe. Hotlines are below, and your embassy can help.
        </div>
      )}
      <div>
        <Pill tone={o.tone}>{o.label}</Pill>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(['influence', 'trafficking', 'scam'] as Category[]).map((c) => (
            <div key={c} className="rounded-lg border border-line bg-card px-3 py-2">
              <div className="text-xs text-muted">{CATEGORY_NAME[c]}</div>
              <Pill tone={levelTone(result.levels[c])}>{LEVEL_LABEL[result.levels[c]]}</Pill>
            </div>
          ))}
        </div>
      </div>
      {Object.values(result.reasons).some((r) => r.length) && (
        <div>
          <p className="font-semibold">What worried us</p>
          <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
            {(['trafficking', 'influence', 'scam'] as Category[]).flatMap((c) => result.reasons[c]).map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}
      <div>
        <p className="font-semibold">What to do</p>
        <ul className="list-disc pl-5 text-sm space-y-1 mt-1">{result.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      {result.saferIf.length > 0 && (
        <div>
          <p className="font-semibold">It would look safer if…</p>
          <ul className="list-disc pl-5 text-sm space-y-1 mt-1">{result.saferIf.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
      <div>
        <p className="font-semibold">Ask them, and get it in writing</p>
        <ol className="list-decimal pl-5 text-sm space-y-1 mt-1">{result.questions.map((q) => <li key={q.id}>{q.text}</li>)}</ol>
      </div>
      {result.guide && (
        <div>
          <p className="font-semibold">Worth knowing in {result.guide.name}</p>
          <ul className="list-disc pl-5 text-sm space-y-1 mt-1">{result.guide.points.slice(0, 3).map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      <div>
        <p className="font-semibold mb-1">Help{result.country ? ` in ${result.country.name}` : ''}</p>
        <ContactList contacts={result.help} />
      </div>
      <p className="text-sm">
        <Link href="/scan" className="link">Paste the actual message into the scanner</Link> for a second look. You decide what to do; this is guidance, not a verdict.
      </p>
    </div>
  );
}

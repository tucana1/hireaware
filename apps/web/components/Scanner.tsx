'use client';

import { useState } from 'react';
import type { Analysis } from '@hireaware/engine';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { AnalysisView } from './AnalysisView';

const EXAMPLES = [
  { label: 'Social media job, Philippines', text: "Hi! We're hiring Digital Engagement Associates, work from home. You'll get 5 ready-made Facebook profiles and a daily brief with talking points. Main task: keep the comments under the Governor's live videos positive and reply to critics. ₱450/night via GCash. The client is confidential, so don't tell anyone you're paid." },
  { label: 'Customer service abroad, Kenya', text: 'Thailand jobs!! Customer care agents needed, salary $1,500 + commission, free flight and accommodation. Agency fee KES 120,000 covers ticket and visa. You will travel on a tourist visa; the company processes the work permit after arrival. Our driver picks you up in Bangkok.' },
  { label: 'Task job, Brazil', text: 'Vaga de avaliador de produtos: ganhe R$ 200 por dia curtindo vídeos. Para começar, pague a taxa de ativação de R$ 79 via Pix e fale com nossa recepcionista no Telegram.' },
  { label: 'Content moderator (legitimate)', text: 'Content Moderator (night shift), BGC Taguig. Review flagged posts and remove fake accounts and misinformation according to platform policy. HMO from day one, night differential, wellness support. Apply through our careers page; we never charge applicants.' },
];

/** Paste box + results. "stacked" puts results under the box (home page); "split" puts them beside it. */
export function Scanner({ layout = 'split' }: { layout?: 'split' | 'stacked' }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function scan(value = text) {
    if (!value.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Something went wrong.');
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const input = (
    <div>
      <div className="rounded-xl border border-line-strong bg-white focus-within:border-ink transition-colors">
        <label htmlFor="msg" className="sr-only">Job ad or recruiter&apos;s message</label>
        <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} rows={layout === 'stacked' ? 6 : 11} maxLength={20000}
          placeholder="Paste the job ad or the recruiter's message here. Any language: English, Filipino, Bahasa, Hindi, Swahili, Spanish, Portuguese, French."
          className="block w-full resize-y rounded-t-xl bg-transparent px-4 py-3.5 text-[15px] leading-relaxed placeholder:text-faint focus:outline-none" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5">
          <span className="inline-flex items-center gap-1.5 pl-1 text-[13px] text-faint"><Lock className="size-3.5" />Checked and discarded. Nothing is stored.</span>
          <button type="button" onClick={() => scan()} disabled={busy || !text.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:bg-faint/40">
            {busy ? <><Loader2 className="size-4 animate-spin" />Checking</> : <>Check message<ArrowRight className="size-4" /></>}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        <span className="mr-2 text-muted">Try an example:</span>
        {EXAMPLES.map((ex, i) => (
          <span key={ex.label} className="inline-flex items-center">
            <button type="button" onClick={() => { setText(ex.text); scan(ex.text); }}
              className="text-accent underline decoration-accent/30 underline-offset-[3px] hover:decoration-accent">{ex.label}</button>
            {i < EXAMPLES.length - 1 && <span className="ml-1 text-faint">·</span>}
          </span>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-high">{error}</p>}
    </div>
  );

  if (layout === 'stacked') {
    return (
      <div>
        {input}
        {result && <div className="mt-6 rounded-xl border border-line bg-white p-5 sm:p-7"><AnalysisView analysis={result} /></div>}
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div className="lg:sticky lg:top-20">{input}</div>
      <div>
        {result ? <AnalysisView analysis={result} /> : (
          <div className="rounded-xl border border-dashed border-line-strong p-7">
            <p className="font-medium">What you&apos;ll get</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-muted marker:text-faint">
              <li>A risk level for troll-farm work, trafficking and job scams</li>
              <li>The exact phrases that worried us, and why</li>
              <li>Strict questions to put to the recruiter</li>
              <li>What to do next, and who can help</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

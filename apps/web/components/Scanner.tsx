'use client';

import { useState } from 'react';
import type { Analysis } from '@hireaware/engine';
import { AnalysisView } from './AnalysisView';

const EXAMPLES = [
  { label: 'Social media job (Philippines)', text: "Hi! We're hiring Digital Engagement Associates, work from home. You'll get 5 ready-made Facebook profiles and a daily brief with talking points. Main task: keep the comments under the Governor's live videos positive and reply to critics. ₱450/night via GCash. The client is confidential, so don't tell anyone you're paid." },
  { label: 'Customer service abroad (Kenya)', text: 'Thailand jobs!! Customer care agents needed, salary $1,500 + commission, free flight and accommodation. Agency fee KES 120,000 covers ticket and visa. You will travel on a tourist visa; the company processes the work permit after arrival. Our driver picks you up in Bangkok.' },
  { label: 'Task job (Brazil)', text: 'Vaga de avaliador de produtos: ganhe R$ 200 por dia curtindo vídeos. Para começar, pague a taxa de ativação de R$ 79 via Pix e fale com nossa recepcionista no Telegram.' },
  { label: 'Content moderator (legitimate)', text: 'Content Moderator (night shift), BGC Taguig. Review flagged posts and remove fake accounts and misinformation according to platform policy. HMO from day one, night differential, wellness support. Apply through our careers page; we never charge applicants.' },
];

export function Scanner() {
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
      <div>
        <label htmlFor="msg" className="font-medium">Paste the job ad or the recruiter&apos;s message</label>
        <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} rows={12} maxLength={20000}
          placeholder="Copy the whole message, in any language: English, Filipino, Bahasa, Hindi, Swahili, Spanish, Portuguese, French…"
          className="mt-2 w-full rounded-xl border border-line bg-card p-4 text-base leading-relaxed focus:border-accent focus:outline-none" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => scan()} disabled={busy || !text.trim()}
            className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white disabled:opacity-50 hover:brightness-110">
            {busy ? 'Checking…' : 'Check this message'}
          </button>
          <span className="text-sm text-muted">Analysed and discarded: nothing is stored.</span>
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Or try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex.label} type="button" onClick={() => { setText(ex.text); scan(ex.text); }}
                className="rounded-full border border-line bg-card px-3 py-1.5 text-sm hover:border-accent">{ex.label}</button>
            ))}
          </div>
        </div>
        {error && <p role="alert" className="mt-4 text-high">{error}</p>}
      </div>
      <div>
        {result ? <AnalysisView analysis={result} /> : (
          <div className="rounded-xl border border-dashed border-line p-8 text-muted">
            <p className="font-medium text-ink">What you&apos;ll get</p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
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

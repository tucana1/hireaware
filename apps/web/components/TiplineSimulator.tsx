'use client';

import { useState } from 'react';

type Bubble = { from: 'me' | 'bot'; text: string };

const COUNTRIES = [
  { label: 'Philippines (+63)', value: '+639170000000' },
  { label: 'Kenya (+254)', value: '+254700000000' },
  { label: 'Nigeria (+234)', value: '+2348000000000' },
  { label: 'India (+91)', value: '+919000000000' },
  { label: 'Indonesia (+62)', value: '+628100000000' },
  { label: 'Brazil (+55)', value: '+5511900000000' },
  { label: 'Other', value: '' },
];

/** Looks and behaves like the WhatsApp tipline, using the same reply code. Nothing is stored. */
export function TiplineSimulator() {
  const [from, setFrom] = useState(COUNTRIES[0]!.value);
  const [text, setText] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [busy, setBusy] = useState(false);

  async function send(value = text) {
    if (!value.trim() || busy) return;
    setText('');
    setBusy(true);
    setBubbles((b) => [...b, { from: 'me', text: value }]);
    try {
      const res = await fetch('/api/tipline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value, from }) });
      const data = await res.json();
      setBubbles((b) => [...b, ...(data.messages as string[]).map((t) => ({ from: 'bot' as const, text: t }))]);
    } catch {
      setBubbles((b) => [...b, { from: 'bot', text: 'Could not reach the tipline.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line-strong">
      <div className="flex items-center justify-between gap-2 bg-[#0b5d4f] px-4 py-3 text-white">
        <div>
          <p className="font-medium">HireAware tipline</p>
          <p className="text-xs text-white/70">Demo: the same replies WhatsApp users get</p>
        </div>
        <select aria-label="Pretend to message from" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md bg-white/15 px-2 py-1 text-xs text-white">
          {COUNTRIES.map((c) => <option key={c.label} value={c.value} className="text-ink">{c.label}</option>)}
        </select>
      </div>
      <div className="h-[400px] space-y-2 overflow-y-auto bg-[#efeae2] p-3">
        {bubbles.length === 0 && (
          <div className="mx-auto max-w-[85%] rounded-md bg-white/80 px-3 py-2 text-center text-xs text-muted">Paste a recruiter&apos;s message, or send HI, HELP or QUESTIONS.</div>
        )}
        {bubbles.map((b, i) => (
          <div key={i} className={`flex ${b.from === 'me' ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[13.5px] leading-relaxed ${b.from === 'me' ? 'bg-[#d9fdd3]' : 'bg-white'}`}>{b.text}</div>
          </div>
        ))}
        {busy && <div className="text-xs text-muted">typing…</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line bg-white p-2">
        <label htmlFor="tip" className="sr-only">Message</label>
        <textarea id="tip" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a message…"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="flex-1 resize-none rounded-lg border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none" />
        <button type="submit" disabled={busy || !text.trim()} className="rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:bg-faint/40">Send</button>
      </form>
      <div className="flex flex-wrap gap-1.5 border-t border-line bg-white px-2 py-2">
        {['HI', 'HELP', 'QUESTIONS'].map((c) => (
          <button key={c} type="button" onClick={() => send(c)} className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-accent hover:text-accent">{c}</button>
        ))}
        <button type="button" className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft hover:border-accent hover:text-accent"
          onClick={() => send('Hiring CSR sa Thailand! ₱80k/month, libre flight at hotel. Tourist visa lang muna, kami na bahala sa working visa pagdating. Pag tinanong ka ng immigration, sabihin mo bakasyon lang. Message sa Telegram.')}>Example forward</button>
      </div>
    </div>
  );
}

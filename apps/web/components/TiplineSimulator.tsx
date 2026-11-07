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
    <div className="rounded-2xl overflow-hidden border border-line max-w-md w-full shadow-sm">
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold">HireAware tipline</p>
          <p className="text-xs opacity-80">Simulator: same replies as WhatsApp</p>
        </div>
        <select aria-label="Pretend to message from" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-white/15 text-white text-xs rounded px-2 py-1">
          {COUNTRIES.map((c) => <option key={c.label} value={c.value} className="text-ink">{c.label}</option>)}
        </select>
      </div>
      <div className="bg-[#ece5dd] h-[460px] overflow-y-auto p-3 space-y-2">
        {bubbles.length === 0 && (
          <div className="text-center text-xs text-muted bg-white/70 rounded-lg p-2">Forward (paste) a recruiter message, or send HI, HELP or QUESTIONS.</div>
        )}
        {bubbles.map((b, i) => (
          <div key={i} className={`flex ${b.from === 'me' ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-sm ${b.from === 'me' ? 'bg-[#dcf8c6]' : 'bg-white'}`}>{b.text}</div>
          </div>
        ))}
        {busy && <div className="text-xs text-muted">typing…</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="bg-[#f0f0f0] p-2 flex gap-2">
        <label htmlFor="tip" className="sr-only">Message</label>
        <textarea id="tip" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a message…"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="flex-1 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none" />
        <button type="submit" disabled={busy || !text.trim()} className="rounded-full bg-[#075e54] text-white px-4 text-sm font-semibold disabled:opacity-40">Send</button>
      </form>
      <div className="bg-white px-3 py-2 flex flex-wrap gap-2 border-t border-line">
        {['HI', 'HELP', 'QUESTIONS'].map((c) => (
          <button key={c} type="button" onClick={() => send(c)} className="text-xs rounded-full border border-line px-2.5 py-1 hover:border-accent">{c}</button>
        ))}
        <button type="button" className="text-xs rounded-full border border-line px-2.5 py-1 hover:border-accent"
          onClick={() => send('Hiring CSR sa Thailand! ₱80k/month, libre flight at hotel. Tourist visa lang muna, kami na bahala sa working visa pagdating. Pag tinanong ka ng immigration, sabihin mo bakasyon lang. Message sa Telegram.')}>Example forward</button>
      </div>
    </div>
  );
}

import type { Analysis, Category } from '@hireaware/engine';
import { CircleCheck, CircleHelp, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { CATEGORY_NAME, LevelMeter } from './ui';

const VERDICT = {
  high: { label: 'High risk', icon: ShieldAlert, box: 'bg-high-soft', text: 'text-high' },
  caution: { label: 'Be careful', icon: TriangleAlert, box: 'bg-caution-soft', text: 'text-caution' },
  low: { label: 'No common red flags', icon: ShieldCheck, box: 'bg-low-soft', text: 'text-low' },
  unclear: { label: 'Not enough to go on', icon: CircleHelp, box: 'bg-paper', text: 'text-ink' },
} as const;

const ORDER: Category[] = ['influence', 'trafficking', 'scam'];

/** "High risk: this looks like…" → "This looks like…" (the label is already shown above it). */
function withoutLabel(summary: string): string {
  const rest = summary.replace(/^(High risk|Be careful):\s*/, '');
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function AnalysisView({ analysis }: { analysis: Analysis }) {
  const v = VERDICT[analysis.verdict];
  const Icon = v.icon;
  return (
    <div className="space-y-7" aria-live="polite">
      <div className={`rounded-lg px-5 py-4 ${v.box}`}>
        <p className={`flex items-center gap-2 text-lg font-semibold ${v.text}`}><Icon className="size-5" strokeWidth={2} />{v.label}</p>
        <p className="mt-1 text-ink-soft">{withoutLabel(analysis.summary)}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {ORDER.map((c) => <LevelMeter key={c} label={CATEGORY_NAME[c]} level={analysis.categories[c].level} />)}
      </div>

      {analysis.redFlags.length > 0 && (
        <Section title="Why">
          <ul className="space-y-5">
            {analysis.redFlags.map((f) => (
              <li key={f.id}>
                <p className="font-medium">{f.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{f.explain}</p>
                <p className="mt-2 border-l-2 border-high/60 pl-3 text-[14px] text-ink-soft">&ldquo;{f.evidence}&rdquo;</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {analysis.reassuring.length > 0 && (
        <Section title="In its favour">
          <ul className="space-y-2.5">
            {analysis.reassuring.map((f) => (
              <li key={f.id} className="flex gap-2.5 text-[15px]">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-low" />
                <span><span className="font-medium">{f.title}.</span> <span className="text-muted">{f.explain}</span></span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Ask them, and get the answers in writing">
        <p className="text-[15px] text-muted">A real employer can answer every one of these. If they dodge, delay or get angry, treat it as a no.</p>
        <ol className="mt-4 space-y-4">
          {analysis.questions.map((q, i) => (
            <li key={q.id} className="grid grid-cols-[1.5rem_1fr] gap-x-2">
              <span className="pt-px text-[15px] font-semibold tabular-nums text-faint">{i + 1}.</span>
              <div>
                <p className="font-medium leading-snug">{q.text}</p>
                <p className="mt-1 text-[14.5px] text-muted">{q.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What to do next">
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed marker:text-faint">
          {analysis.nextSteps.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </Section>

      {analysis.model && analysis.model.topTerms.length > 0 && (
        <details className="border-t border-line pt-5 text-sm text-muted">
          <summary className="cursor-pointer font-medium text-ink-soft">What the model noticed</summary>
          <p className="mt-2">Words that pushed the classifier&apos;s score up: {analysis.model.topTerms.map((t) => t.term).join(', ')}.
            Scores are not probabilities; the red flags above carry more weight.</p>
        </details>
      )}
    </div>
  );
}

import type { Analysis, Category } from '@hireaware/engine';
import { CATEGORY_NAME, LEVEL_LABEL, Pill, levelTone, type Tone } from './ui';

const VERDICT: Record<Analysis['verdict'], { label: string; tone: Tone }> = {
  high: { label: 'High risk', tone: 'high' },
  caution: { label: 'Be careful', tone: 'caution' },
  low: { label: 'No common red flags', tone: 'low' },
  unclear: { label: 'Not enough to go on', tone: 'neutral' },
};

const BOX: Record<Tone, string> = {
  high: 'border-high/40 bg-high-soft',
  caution: 'border-caution/40 bg-caution-soft',
  low: 'border-low/40 bg-low-soft',
  neutral: 'border-line bg-card',
};

const ORDER: Category[] = ['influence', 'trafficking', 'scam'];

export function AnalysisView({ analysis }: { analysis: Analysis }) {
  const v = VERDICT[analysis.verdict];
  return (
    <div className="space-y-6" aria-live="polite">
      <div className={`rounded-xl border p-5 ${BOX[v.tone]}`}>
        <Pill tone={v.tone}>{v.label}</Pill>
        <p className="mt-2 text-lg font-medium">{analysis.summary}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {ORDER.map((c) => (
            <div key={c} className="rounded-lg bg-card/80 border border-line px-3 py-2">
              <div className="text-xs text-muted">{CATEGORY_NAME[c]}</div>
              <div className="mt-1"><Pill tone={levelTone(analysis.categories[c].level)}>{LEVEL_LABEL[analysis.categories[c].level]}</Pill></div>
            </div>
          ))}
        </div>
      </div>

      {analysis.redFlags.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-2">Why</h2>
          <ul className="space-y-3">
            {analysis.redFlags.map((f) => (
              <li key={f.id} className="rounded-lg border border-line bg-card p-4">
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-muted mt-1">{f.explain}</p>
                <p className="text-xs mt-2 text-muted">Matched: <q className="italic">{f.evidence}</q></p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis.reassuring.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-2">In its favour</h2>
          <ul className="space-y-2">
            {analysis.reassuring.map((f) => (
              <li key={f.id} className="text-sm"><span className="font-medium">{f.title}.</span> <span className="text-muted">{f.explain}</span></li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold text-lg mb-1">Ask them, and get the answers in writing</h2>
        <p className="text-sm text-muted mb-3">A real employer can answer every one of these. If they dodge, delay or get angry, treat it as a no.</p>
        <ol className="space-y-3 list-decimal pl-5">
          {analysis.questions.map((q) => (
            <li key={q.id}>
              <p className="font-medium">{q.text}</p>
              <p className="text-sm text-muted">{q.why}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">What to do next</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          {analysis.nextSteps.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>

      {analysis.model && analysis.model.topTerms.length > 0 && (
        <details className="text-sm text-muted">
          <summary className="cursor-pointer">What the model noticed</summary>
          <p className="mt-2">Words that pushed the classifier&apos;s score up: {analysis.model.topTerms.map((t) => `"${t.term}"`).join(', ')}.
            Scores are not probabilities; the red flags above carry more weight.</p>
        </details>
      )}
    </div>
  );
}

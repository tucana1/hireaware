import type { Analysis, Category } from '@hireaware/engine';

export const SITE_URL = (import.meta.env.WXT_SITE_URL as string | undefined) || 'http://localhost:3000';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const VERDICT = {
  high: ['High risk', 'high'],
  caution: ['Be careful', 'caution'],
  low: ['No common red flags', 'low'],
  unclear: ['Not enough text', 'neutral'],
} as const;
const NAMES: Record<Category, string> = { influence: 'Troll farm / influence', trafficking: 'Trafficking', scam: 'Job scam' };
const LEVEL = { low: ['Low', 'low'], medium: ['Medium', 'caution'], high: ['High', 'high'] } as const;

export const STYLES = `
.ha{font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#121826}
.ha h2{font-size:13px;margin:14px 0 6px;font-weight:650}
.ha .verdict{border-radius:10px;padding:10px 12px;border:1px solid}
.ha .high{background:#fdecea;color:#b42318;border-color:#f2b8b5}
.ha .caution{background:#fef4e6;color:#b54708;border-color:#f6d3a8}
.ha .low{background:#e8f5ee;color:#18794e;border-color:#b6e0c8}
.ha .neutral{background:#e8edf6;color:#1b2d52;border-color:#c9d3e6}
.ha .summary{color:#121826;margin:4px 0 0;font-weight:500}
.ha .cats{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.ha .pill{display:inline-block;border:1px solid;border-radius:999px;padding:1px 8px;font-size:12px;font-weight:600}
.ha ul,.ha ol{margin:0;padding-left:18px}
.ha li{margin:3px 0}
.ha .muted{color:#5a6273;font-size:12px}
.ha a{color:#1b2d52}
`;

/** "High risk: this looks like…" → "This looks like…" (the label is shown just above). */
function withoutLabel(summary: string): string {
  const rest = summary.replace(/^(High risk|Be careful):\s*/, '');
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

export function renderAnalysis(a: Analysis, opts: { maxFlags?: number; maxQuestions?: number } = {}): string {
  const [label, tone] = VERDICT[a.verdict];
  const cats = (['influence', 'trafficking', 'scam'] as Category[]).map((c) => {
    const [l, t] = LEVEL[a.categories[c].level];
    return `<span class="pill ${t}">${NAMES[c]}: ${l}</span>`;
  }).join('');
  const flags = a.redFlags.slice(0, opts.maxFlags ?? 4).map((f) => `<li><b>${esc(f.title)}</b><br><span class="muted">“${esc(f.evidence)}”</span></li>`).join('');
  const qs = a.questions.slice(0, opts.maxQuestions ?? 5).map((q) => `<li>${esc(q.text)}</li>`).join('');
  return `<div class="ha">
    <div class="verdict ${tone}"><b>${label}</b><p class="summary">${esc(withoutLabel(a.summary))}</p><div class="cats">${cats}</div></div>
    ${flags ? `<h2>Why</h2><ul>${flags}</ul>` : ''}
    <h2>Ask them, in writing</h2><ol>${qs}</ol>
    <p class="muted" style="margin-top:12px">Checked on your device. Nothing was sent anywhere. <a href="${SITE_URL}/help" target="_blank" rel="noopener">Get help</a> · <a href="${SITE_URL}/check" target="_blank" rel="noopener">Full risk check</a></p>
  </div>`;
}

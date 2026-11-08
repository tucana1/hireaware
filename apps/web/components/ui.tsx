import type { Contact } from '@hireaware/engine';
import { ExternalLink, Phone } from 'lucide-react';

export type Tone = 'high' | 'caution' | 'low' | 'neutral';

export const LEVEL_LABEL = { low: 'Low', medium: 'Medium', high: 'High' } as const;
export const CATEGORY_NAME = {
  influence: 'Troll farm / covert influence',
  trafficking: 'Trafficking / forced scam work',
  scam: 'Job scam',
} as const;

const LEVEL_TEXT = { low: 'text-low', medium: 'text-caution', high: 'text-high' } as const;
const LEVEL_FILL = { low: 'bg-low', medium: 'bg-caution', high: 'bg-high' } as const;

/** One risk category: name, level word and a three-step bar. */
export function LevelMeter({ label, level }: { label: string; level: 'low' | 'medium' | 'high' }) {
  const n = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted">{label}</span>
        <span className={`text-[13px] font-semibold ${LEVEL_TEXT[level]}`}>{LEVEL_LABEL[level]}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => <span key={i} className={`h-1 ${i <= n ? LEVEL_FILL[level] : 'bg-line'}`} />)}
      </div>
    </div>
  );
}

export function PageHeader({ label, title, children }: { label?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 max-w-3xl">
      {label && <p className="text-sm font-medium text-accent">{label}</p>}
      <h1 className="mt-2 text-3xl sm:text-[2.6rem] font-semibold leading-[1.1] tracking-[-0.025em] [text-wrap:balance]">{title}</h1>
      {children && <div className="mt-4 text-[17px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function SectionHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em]">{title}</h2>
      {children && <p className="mt-2 text-muted leading-relaxed">{children}</p>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card p-6 ${className}`}>{children}</div>;
}

export function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <ul className="divide-y divide-line">
      {contacts.map((c) => (
        <li key={c.name + (c.phone ?? c.url ?? '')} className="py-2.5 first:pt-0 last:pb-0 text-sm">
          <p className="font-medium text-ink">{c.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            {c.phone && (
              <a className="inline-flex items-center gap-1.5 font-semibold text-accent hover:text-accent-strong tabular-nums" href={`tel:${c.phone.replace(/[^\d+*#]/g, '')}`}>
                <Phone className="size-3.5" strokeWidth={2} />{c.phone}
              </a>
            )}
            {c.url && (
              <a className="inline-flex items-center gap-1 text-muted hover:text-accent break-all" href={c.url} target="_blank" rel="noopener noreferrer">
                {c.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}<ExternalLink className="size-3 shrink-0" />
              </a>
            )}
          </div>
          {c.note && <p className="mt-1 text-muted">{c.note}</p>}
          {!c.verified && <p className="mt-1 text-xs text-caution">Not confirmed on an official site. Check before relying on it.</p>}
        </li>
      ))}
    </ul>
  );
}

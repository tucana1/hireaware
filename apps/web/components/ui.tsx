import type { Contact } from '@hireaware/engine';

export type Tone = 'high' | 'caution' | 'low' | 'neutral';

const TONE: Record<Tone, string> = {
  high: 'bg-high-soft text-high border-high/30',
  caution: 'bg-caution-soft text-caution border-caution/30',
  low: 'bg-low-soft text-low border-low/30',
  neutral: 'bg-accent-soft text-accent border-accent/20',
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>{children}</span>;
}

export function levelTone(level: 'low' | 'medium' | 'high'): Tone {
  return level === 'high' ? 'high' : level === 'medium' ? 'caution' : 'low';
}

export const LEVEL_LABEL = { low: 'Low', medium: 'Medium', high: 'High' } as const;
export const CATEGORY_NAME = {
  influence: 'Covert influence / troll farm',
  trafficking: 'Trafficking / forced scam work',
  scam: 'Job scam',
} as const;

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="text-sm font-medium text-accent mb-1">{eyebrow}</p>}
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="mt-3 text-lg text-muted max-w-3xl">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card p-5 ${className}`}>{children}</div>;
}

export function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <ul className="space-y-2">
      {contacts.map((c) => (
        <li key={c.name + (c.phone ?? c.url ?? '')} className="text-sm">
          <span className="font-medium">{c.name}</span>
          {c.phone && <> · <a className="link font-semibold" href={`tel:${c.phone.replace(/[^\d+*#]/g, '')}`}>{c.phone}</a></>}
          {c.url && <> · <a className="link break-all" href={c.url} target="_blank" rel="noopener noreferrer">{c.url.replace(/^https?:\/\//, '')}</a></>}
          {c.note && <span className="block text-muted">{c.note}</span>}
          {!c.verified && <span className="block text-caution text-xs">Not confirmed on an official site: check before relying on it.</span>}
        </li>
      ))}
    </ul>
  );
}

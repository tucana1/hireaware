import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { NAV, SITE } from '@/lib/site';
import { QuickExit } from '@/components/QuickExit';

export const metadata: Metadata = {
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  referrer: 'no-referrer',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f6e5f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-white">Skip to content</a>
        <header className="border-b border-line bg-card">
          <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
              <span aria-hidden className="inline-grid place-items-center size-7 rounded-md bg-accent text-white text-sm">H</span>
              {SITE.name}
            </Link>
            <nav aria-label="Main" className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>
              ))}
            </nav>
            <div className="ml-auto"><QuickExit /></div>
          </div>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-line bg-card mt-16">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted grid gap-3 sm:grid-cols-2">
            <p>
              {SITE.name} gives automated guidance, not legal advice or a final verdict. Nothing you type in the risk
              check is stored. If you are in danger, contact the hotlines on <Link href="/help" className="link">Get help</Link>.
            </p>
            <p className="sm:text-right">
              <Link href="/about" className="link">How it works, data and limits</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

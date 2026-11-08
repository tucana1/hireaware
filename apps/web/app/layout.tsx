import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';
import { NAV, SITE } from '@/lib/site';
import { SiteHeader } from '@/components/SiteHeader';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  referrer: 'no-referrer',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:bg-white focus:p-2">Skip to content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <footer className="mt-24 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-md text-sm leading-relaxed text-muted">
              {SITE.name} gives automated guidance, not legal advice or a final verdict. Nothing you type is stored.
              If you are in danger, use the hotlines on <Link href="/help" className="link">Get help</Link>.
            </p>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>)}
              <Link href="/about" className="hover:text-ink">How it works</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}

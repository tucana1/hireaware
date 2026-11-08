'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV, SITE } from '@/lib/site';
import { LogoMark } from './Logo';

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-14 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <LogoMark className="size-6" />
          <span className="font-semibold tracking-tight">{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex h-14 items-stretch gap-6 text-sm whitespace-nowrap">
            {NAV.map((n) => {
              const active = path === n.href || path.startsWith(n.href + '/');
              return (
                <li key={n.href} className="flex">
                  <Link href={n.href} aria-current={active ? 'page' : undefined}
                    className={`flex items-center border-b-2 -mb-px transition-colors ${active ? 'border-ink text-ink font-medium' : 'border-transparent text-muted hover:text-ink'}`}>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

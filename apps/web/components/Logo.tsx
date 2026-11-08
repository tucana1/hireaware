/** Parakh mark: a shield with a check. */
export function LogoMark({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2.5 20 5.6v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6l8-3.1Z" fill="var(--color-accent)" />
      <path d="m8.4 12 2.5 2.5 4.8-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

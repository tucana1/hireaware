'use client';

import { useEffect } from 'react';

/** "Leave quickly" for people whose screen may be watched. Escape pressed twice does the same. */
export function QuickExit() {
  const leave = () => {
    window.open('https://www.google.com/search?q=weather', '_self');
    window.location.replace('https://www.google.com/search?q=weather');
  };
  useEffect(() => {
    let last = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      if (now - last < 600) leave();
      last = now;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <button type="button" onClick={leave} title="Leave this site now (or press Esc twice)"
      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-high-soft hover:border-high hover:text-high">
      Leave quickly
    </button>
  );
}

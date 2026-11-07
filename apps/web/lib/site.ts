export const SITE = {
  name: 'HireAware',
  tagline: 'Check the job behind the job offer.',
  description:
    'Free tools to spot job offers that recruit people into troll farms, propaganda work and scam compounds, before they say yes.',
  /** Public URL, used in tipline replies. Set NEXT_PUBLIC_SITE_URL in production. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  /** WhatsApp number people forward messages to, e.g. "+14155238886". Shown on the site when set. */
  tiplineNumber: process.env.NEXT_PUBLIC_TIPLINE_NUMBER ?? '',
};

export const NAV = [
  { href: '/check', label: 'Risk check' },
  { href: '/scan', label: 'Scan a message' },
  { href: '/learn', label: 'Warning signs' },
  { href: '/regions', label: 'By region' },
  { href: '/help', label: 'Get help' },
  { href: '/tipline', label: 'Tipline & extension' },
];

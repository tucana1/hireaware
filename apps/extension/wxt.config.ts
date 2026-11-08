import { defineConfig } from 'wxt';

// Parakh browser extension. Everything runs locally: the red-flag rules and the recruitment-risk
// classifier are bundled from @hireaware/engine, and no page content is sent anywhere.
// WXT_E2E=true builds a test copy into .output-e2e with page access, so the end-to-end test can run the
// "Scan this page" and right-click paths without a human click. Never ship that build.
const e2e = process.env.WXT_E2E === 'true';

export default defineConfig({
  outDir: e2e ? '.output-e2e' : '.output',
  manifest: {
    name: 'Parakh: check job offers',
    description: 'Spots job posts and recruiter messages that recruit for troll farms, scam compounds or job scams. Runs on your device.',
    permissions: ['contextMenus', 'activeTab', 'scripting'],
    ...(e2e ? { host_permissions: ['http://127.0.0.1/*'] } : {}),
    action: { default_title: 'Check this job with Parakh' },
  },
});

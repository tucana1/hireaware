import { defineConfig } from 'wxt';

// HireAware browser extension. Everything runs locally: the red-flag rules and the recruitment-risk
// classifier are bundled from @hireaware/engine, and no page content is sent anywhere.
export default defineConfig({
  manifest: {
    name: 'HireAware: check job offers',
    description: 'Spots job posts and recruiter messages that recruit for troll farms, scam compounds or job scams. Runs on your device.',
    permissions: ['contextMenus', 'activeTab', 'scripting'],
    action: { default_title: 'Check this job with HireAware' },
  },
});

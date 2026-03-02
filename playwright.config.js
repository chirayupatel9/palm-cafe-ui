/**
 * Playwright config for full-stack browser E2E. Real API + real DB; no mocks.
 * Start: npm run test:e2e:browser (starts API + UI via global-setup).
 */
const path = require('path');

module.exports = {
  testDir: path.join(__dirname, 'e2e'),
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'e2e-report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 15000
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ],
  globalSetup: path.join(__dirname, 'e2e', 'global-setup.js'),
  globalTeardown: path.join(__dirname, 'e2e', 'global-teardown.js'),
  timeout: 60000
};

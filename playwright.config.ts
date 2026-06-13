import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Make .env.local (Supabase keys) available to the test process and workers.
if (existsSync('.env.local')) { try { process.loadEnvFile('.env.local'); } catch { /* ignore */ } }

export const BASE_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Normal mode (no COURSE_BYPASS_PAYWALL): the suite exercises the real
    // paywall and logs in a real owner for gated content.
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as dotenv from 'dotenv';

dotenv.config();

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/**/*.ts', 'support/fixtures.ts'],
});

export default defineConfig({
  testDir,

  // Prevent .only() from being committed and silently skipping suites in CI
  forbidOnly: !!process.env.CI,

  // Retry flaky tests in CI only
  retries: process.env.CI ? 2 : 0,

  // API tests are stateless; serialise to avoid rate-limiting the sandbox API
  workers: 1,
  fullyParallel: false,

  timeout: 30_000,

  use: {
    baseURL: process.env.BASE_URL ?? 'https://api.escuelajs.co/api/v1/',
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      detail: true,
      suiteTitle: false,
    }],
    ...(process.env.CI ? ([['github']] as const) : []),
  ],
});

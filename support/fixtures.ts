import { test as base } from 'playwright-bdd';
import { AuthClient } from '../src/api/authClient';

/**
 * Mutable state bag shared across BDD steps within a single test.
 * All steps receive the same object reference so mutations are visible
 * to subsequent steps in the same scenario.
 */
export type AuthState = {
  lastStatus: number;
  lastBody: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
};

export type AuthFixtures = {
  authClient: AuthClient;
  authState: AuthState;
};

export const test = base.extend<AuthFixtures>({
  authClient: async ({ request }, use) => {
    await use(new AuthClient(request));
  },
  // scope:'test' ensures one instance per test so mutations persist across steps
  authState: [async ({}, use) => {
    await use({
      lastStatus: 0,
      lastBody: {},
      accessToken: '',
      refreshToken: '',
    });
  }, { scope: 'test' }],
});

export { createBdd } from 'playwright-bdd';

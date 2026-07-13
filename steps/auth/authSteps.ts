import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../support/fixtures';

const { Given, When, Then } = createBdd(test);

// ─────────────────────────────────────────────────────────────────────────────
// Background
// ─────────────────────────────────────────────────────────────────────────────

Given('the authentication API is available', async ({ request }) => {
  // Lightweight connectivity check — confirm API host is reachable
  const res = await request.get('https://api.escuelajs.co/');
  expect([200, 404]).toContain(res.status());
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared pre-condition
// ─────────────────────────────────────────────────────────────────────────────

Given('I am logged in with valid credentials', async ({ authClient, authState }) => {
  const res = await authClient.login({
    email: process.env.TEST_USERNAME ?? 'john@mail.com',
    password: process.env.TEST_PASSWORD ?? 'changeme',
  });
  expect(res.status()).toBe(201);
  const body = (await res.json()) as { access_token: string; refresh_token: string };
  authState.accessToken = body.access_token;
  authState.refreshToken = body.refresh_token;
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login — When steps
// ─────────────────────────────────────────────────────────────────────────────

When('I send a POST request to {string} with valid credentials', async ({ authClient, authState }, _path: string) => {
  const res = await authClient.login({
    email: process.env.TEST_USERNAME ?? 'john@mail.com',
    password: process.env.TEST_PASSWORD ?? 'changeme',
  });
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
  authState.accessToken = String(authState.lastBody.access_token ?? '');
  authState.refreshToken = String(authState.lastBody.refresh_token ?? '');
});

When(
  'I send a POST request to {string} with email {string} and password {string}',
  async ({ authClient, authState }, _path: string, email: string, password: string) => {
    const res = await authClient.login({ email, password });
    authState.lastStatus = res.status();
    try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/profile — When steps
// ─────────────────────────────────────────────────────────────────────────────

When('I send a GET request to {string}', async ({ authClient, authState }, _path: string) => {
  const res = await authClient.getProfile(authState.accessToken);
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When('I send a GET request to {string} without a token', async ({ authClient, authState }, _path: string) => {
  const res = await authClient.getProfile('');
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When(
  'I send a GET request to {string} with token {string}',
  async ({ authClient, authState }, _path: string, token: string) => {
    const res = await authClient.getProfile(token);
    authState.lastStatus = res.status();
    try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh-token — When steps
// ─────────────────────────────────────────────────────────────────────────────

When('I send a POST request to {string} with the stored refresh token', async ({ authClient, authState }, _path: string) => {
  const res = await authClient.refreshToken({ refreshToken: authState.refreshToken });
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When(
  'I send a POST request to {string} with refreshToken {string}',
  async ({ authClient, authState }, _path: string, refreshToken: string) => {
    const res = await authClient.refreshToken({ refreshToken });
    authState.lastStatus = res.status();
    try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
  },
);

When('I send a POST request to {string} with an empty refresh token', async ({ authClient, authState }, _path: string) => {
  const res = await authClient.refreshToken({ refreshToken: '' });
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared Then assertions
// ─────────────────────────────────────────────────────────────────────────────

Then('the response status should be {int}', async ({ authState }, expected: number) => {
  expect(authState.lastStatus).toBe(expected);
});

Then('the response body should contain an {string}', async ({ authState }, field: string) => {
  expect(authState.lastBody[field], `Expected field "${field}" in response body`).toBeDefined();
});

Then('the response body should contain a {string}', async ({ authState }, field: string) => {
  expect(authState.lastBody[field], `Expected field "${field}" in response body`).toBeDefined();
});

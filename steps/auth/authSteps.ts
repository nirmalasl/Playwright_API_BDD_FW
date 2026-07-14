import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../support/fixtures';
import { authTestData } from '../../src/data/authTestData';

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
  const res = await authClient.login(authTestData.validUser);
  expect(res.status()).toBe(201);
  const body = (await res.json()) as { access_token: string; refresh_token: string };
  authState.accessToken = body.access_token;
  authState.refreshToken = body.refresh_token;
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login — When steps
// ─────────────────────────────────────────────────────────────────────────────

When('I log in with valid credentials', async ({ authClient, authState }) => {
  const res = await authClient.login(authTestData.validUser);
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
  authState.accessToken = String(authState.lastBody.access_token ?? '');
  authState.refreshToken = String(authState.lastBody.refresh_token ?? '');
});

When('I log in with an invalid password', async ({ authClient, authState }) => {
  const res = await authClient.login(authTestData.invalidPassword);
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When('I log in with a non-existent email', async ({ authClient, authState }) => {
  const res = await authClient.login(authTestData.nonExistentUser);
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When('I log in with an empty email', async ({ authClient, authState }) => {
  const res = await authClient.login(authTestData.emptyEmail);
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/profile — When steps
// ─────────────────────────────────────────────────────────────────────────────

When('I request my profile', async ({ authClient, authState }) => {
  const res = await authClient.getProfile(authState.accessToken);
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When('I request my profile without a token', async ({ authClient, authState }) => {
  const res = await authClient.getProfile('');
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When('I request my profile with an invalid access token', async ({ authClient, authState }) => {
  const res = await authClient.getProfile(authTestData.invalidAccessToken);
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh-token — When steps
// ─────────────────────────────────────────────────────────────────────────────

When('I refresh my access token', async ({ authClient, authState }) => {
  const res = await authClient.refreshToken({ refreshToken: authState.refreshToken });
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When('I refresh my access token using an invalid refresh token', async ({ authClient, authState }) => {
  const res = await authClient.refreshToken({ refreshToken: authTestData.invalidRefreshToken });
  authState.lastStatus = res.status();
  try { authState.lastBody = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }
});

When('I refresh my access token using an empty refresh token', async ({ authClient, authState }) => {
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

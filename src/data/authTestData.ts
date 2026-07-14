/**
 * Centralized test data for authentication scenarios.
 *
 * Why this exists: values used to be hardcoded directly inside
 * `features/auth/auth.feature` (e.g. `password "wrongpassword"`). That's an
 * anti-pattern for BDD:
 *   - Gherkin should describe BEHAVIOUR, not carry literal test data —
 *     "with an invalid password" is more readable than a magic string.
 *   - Values were duplicated (the same fallback credentials appeared in
 *     both authSteps.ts and here) with no single source of truth.
 *   - Changing a value (e.g. swapping the "non-existent" email) meant
 *     editing the .feature file, which should only change when the
 *     BUSINESS SCENARIO changes, not when test data changes.
 *
 * Steps look up data from here by semantic key; the .feature file only
 * ever describes intent (see auth.feature).
 */

export const validCredentials = {
  email: process.env.TEST_USERNAME ?? 'john@mail.com',
  password: process.env.TEST_PASSWORD ?? 'changeme',
};

export const authTestData = {
  validUser: validCredentials,

  invalidPassword: {
    email: validCredentials.email,
    password: 'wrongpassword',
  },

  nonExistentUser: {
    email: 'nobody@nowhere.com',
    password: 'doesntmatter',
  },

  emptyEmail: {
    email: '',
    password: validCredentials.password,
  },

  invalidAccessToken: 'invalid.jwt.token',

  invalidRefreshToken: 'bad.token.value',
} as const;

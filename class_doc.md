## `AuthClient` — authClient.ts

**Purpose:** Thin wrapper around Playwright's `APIRequestContext`. Encapsulates all HTTP calls to the `/auth` endpoints so step definitions never construct raw requests directly.

**Constructor**
```ts
new AuthClient(request: APIRequestContext)
```
| Parameter | Type | Description |
|---|---|---|
| `request` | `APIRequestContext` | Injected by the Playwright fixture system |

**Methods**

| Method | Endpoint | Parameters | Returns |
|---|---|---|---|
| `login(payload)` | `POST /auth/login` | `LoginPayload` — `{ email, password }` | `Promise<APIResponse>` |
| `getProfile(accessToken)` | `GET /auth/profile` | `accessToken: string` — sent as `Authorization: Bearer <token>` | `Promise<APIResponse>` |
| `refreshToken(payload)` | `POST /auth/refresh-token` | `RefreshTokenPayload` — `{ refreshToken }` | `Promise<APIResponse>` |

**Supporting interfaces**

| Interface | Shape | Purpose |
|---|---|---|
| `LoginPayload` | `{ email: string; password: string }` | Request body for `login()` |
| `RefreshTokenPayload` | `{ refreshToken: string }` | Request body for `refreshToken()` |
| `TokenPair` | `{ access_token: string; refresh_token: string }` | Typed shape of a successful login/refresh response body |

---

## `AuthState` — fixtures.ts

**Purpose:** A mutable state bag (plain object, not a class) that is shared across all BDD steps within a single test scenario. Because all steps receive the same object reference, mutations made in a `When` step are visible in the subsequent `Then` step.

**Shape**

| Property | Type | Populated by |
|---|---|---|
| `lastStatus` | `number` | Every `When` step after each API call |
| `lastBody` | `Record<string, unknown>` | Every `When` step — parsed JSON response |
| `accessToken` | `string` | Login / refresh steps |
| `refreshToken` | `string` | Login / refresh steps |

**Scope:** `test` — one instance is created per scenario and torn down after it completes.

---

## `AuthFixtures` — fixtures.ts

**Purpose:** Declares the two fixtures that are merged into the `test` object via `base.extend<AuthFixtures>()`. This is the Playwright-BDD fixture contract type.

| Fixture key | Type | Lifetime |
|---|---|---|
| `authClient` | `AuthClient` | Worker (new instance per worker, re-used across tests in that worker) |
| `authState` | `AuthState` | Test (scoped to `'test'`, reset for every scenario) |

**How it wires together**

```
playwright.config.ts
  └─ steps/auth/authSteps.ts  ←  imports `test` and `createBdd`
       └─ support/fixtures.ts  ←  extends base with AuthClient + AuthState
            └─ src/api/authClient.ts  ←  wraps APIRequestContext
```

---

## `authTestData` — src/data/authTestData.ts

**Purpose:** Single source of truth for all credential/token values used across auth scenarios. Steps look up data by semantic key instead of receiving literal values from the `.feature` file — keeps Gherkin readable as behaviour, not data, and de-duplicates the "valid credentials" fallback that used to be repeated in multiple step definitions.

| Key | Shape | Used by |
|---|---|---|
| `validUser` | `{ email, password }` — sourced from `TEST_USERNAME`/`TEST_PASSWORD` env vars, falls back to the public sandbox demo user | Login + "logged in" precondition steps |
| `invalidPassword` | `{ email, password }` | "Login fails with invalid password" |
| `nonExistentUser` | `{ email, password }` | "Login fails with non-existent email" |
| `emptyEmail` | `{ email: '', password }` | "Login fails when email is empty" |
| `invalidAccessToken` | `string` | "Fetch profile with an invalid access token" |
| `invalidRefreshToken` | `string` | "Refresh token fails with an invalid refresh token" |

---

## BDD Step Definitions — authSteps.ts

Not a class, but a module of `Given / When / Then` hooks wired to the fixture system via `createBdd(test)`. All data-bearing steps resolve their values from `authTestData` rather than from Gherkin string parameters (see above).

| Hook | Purpose |
|---|---|
| `Given('the authentication API is available')` | Connectivity smoke-check against the API host |
| `Given('I am logged in with valid credentials')` | Pre-condition — performs a real login with `authTestData.validUser` and stores tokens into `authState` |
| `When('I log in with valid credentials')` | Calls `authClient.login()` with `authTestData.validUser` |
| `When('I log in with an invalid password')` | Calls `authClient.login()` with `authTestData.invalidPassword` |
| `When('I log in with a non-existent email')` | Calls `authClient.login()` with `authTestData.nonExistentUser` |
| `When('I log in with an empty email')` | Calls `authClient.login()` with `authTestData.emptyEmail` |
| `When('I request my profile')` | Calls `authClient.getProfile()` using stored `accessToken` |
| `When('I request my profile without a token')` | Calls `authClient.getProfile('')` — tests unauthenticated access |
| `When('I request my profile with an invalid access token')` | Calls `authClient.getProfile()` with `authTestData.invalidAccessToken` |
| `When('I refresh my access token')` | Calls `authClient.refreshToken()` using stored `refreshToken` |
| `When('I refresh my access token using an invalid refresh token')` | Calls `authClient.refreshToken()` with `authTestData.invalidRefreshToken` |
| `When('I refresh my access token using an empty refresh token')` | Calls `authClient.refreshToken({ refreshToken: '' })` |
| `Then('the response status should be {int}')` | Asserts `authState.lastStatus` equals expected code |
| `Then('the response body should contain an/a {string}')` | Asserts the named key exists in `authState.lastBody` |
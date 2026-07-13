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

## BDD Step Definitions — authSteps.ts

Not a class, but a module of `Given / When / Then` hooks wired to the fixture system via `createBdd(test)`.

| Hook | Purpose |
|---|---|
| `Given('the authentication API is available')` | Connectivity smoke-check against the API host |
| `Given('I am logged in with valid credentials')` | Pre-condition — performs a real login and stores tokens into `authState` |
| `When('I send a POST request to … with valid credentials')` | Calls `authClient.login()` with env-var credentials |
| `When('I send a POST request to … with email … and password …')` | Calls `authClient.login()` with inline Gherkin values |
| `When('I send a GET request to …')` | Calls `authClient.getProfile()` using stored `accessToken` |
| `When('I send a GET request to … without a token')` | Calls `authClient.getProfile('')` — tests unauthenticated access |
| `When('I send a GET request to … with token …')` | Calls `authClient.getProfile()` with an arbitrary inline token |
| `When('I send a POST request to … with the stored refresh token')` | Calls `authClient.refreshToken()` using stored `refreshToken` |
| `When('I send a POST request to … with refreshToken …')` | Calls `authClient.refreshToken()` with an inline value |
| `When('I send a POST request to … with an empty refresh token')` | Calls `authClient.refreshToken({ refreshToken: '' })` |
| `Then('the response status should be {int}')` | Asserts `authState.lastStatus` equals expected code |
| `Then('the response body should contain an/a {string}')` | Asserts the named key exists in `authState.lastBody` |
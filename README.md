# Playwright_API_BDD_FW


A BDD API test automation framework built with [Playwright](https://playwright.dev/) and [playwright-bdd](https://github.com/vitalets/playwright-bdd), targeting the [Platzi Fake Store API](https://api.escuelajs.co/api/v1/).

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev/) | HTTP request execution & assertions |
| [playwright-bdd](https://github.com/vitalets/playwright-bdd) | BDD layer — Gherkin ↔ Playwright glue |
| [TypeScript](https://www.typescriptlang.org/) | Language |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |
| [allure-playwright](https://github.com/allure-framework/allure-js) | Allure reporter — captures results for rich HTML reporting |
| [allure-commandline](https://github.com/allure-framework/allure2) | Generates & auto-opens the Allure report after each run |

---

## Project Structure

```
├── features/
│   └── auth/
│       └── auth.feature        # Gherkin scenarios for the Authentication API
├── src/
│   └── api/
│       └── authClient.ts       # API client wrapper (login, profile, refresh-token)
├── steps/
│   └── auth/
│       └── authSteps.ts        # Step definitions
├── support/
│   └── fixtures.ts             # Playwright-BDD fixtures (AuthClient, AuthState)
├── allure-results/             # Raw Allure results (generated, gitignored)
├── allure-report/              # Generated Allure HTML report (generated, gitignored)
├── scripts/
│   └── run-tests-with-report.js # Cross-platform runner: test → generate → open Allure report
├── playwright.config.ts        # Playwright + BDD configuration (registers the Allure reporter)
├── tsconfig.json
└── package.json
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

---

## Installation

```bash
npm install
npx playwright install
```

---

## Configuration

The framework reads configuration from environment variables. Create a `.env` file in the project root (never commit it):

```env
BASE_URL=https://api.escuelajs.co/api/v1/
TEST_USERNAME=john@mail.com
TEST_PASSWORD=changeme
```

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://api.escuelajs.co/api/v1/` | Base URL for all API requests |
| `TEST_USERNAME` | `john@mail.com` | Login email used in authenticated scenarios |
| `TEST_PASSWORD` | `changeme` | Login password used in authenticated scenarios |

---

## Running Tests

| Command | Description |
|---|---|
| `npm test` | Generate BDD test files, run all tests, then **automatically generate and open the Allure report** |
| `npm run test:smoke` | Run `@smoke` tagged scenarios only, then auto-open the Allure report |
| `npm run test:regression` | Run `@regression` tagged scenarios only, then auto-open the Allure report |
| `npm run test:ci` | CI-friendly run (GitHub reporter) — generates the Allure report but does **not** open a browser |

> The Allure report opens automatically once the run finishes — whether the tests pass or fail — so there's nothing extra to do after `npm test`. See [Viewing the Allure Report](#viewing-the-allure-report) below for details.

---

## Test Tags

| Tag | Scenarios covered |
|---|---|
| `@smoke` | Successful login, profile fetch, token refresh |
| `@regression` | Invalid credentials, missing/invalid tokens, edge-case inputs |
| `@api` | Applied at feature level — marks all scenarios as API tests |

---

## Viewing the Allure Report

Every `npm test` / `npm run test:smoke` / `npm run test:regression` run automatically:

1. Executes the tests using the `allure-playwright` reporter, which writes raw results to `allure-results/`.
2. Runs `allure generate` to build a static HTML report into `allure-report/`.
3. Runs `allure open` to launch a local server and open the report in your default browser — no manual step required.

This is handled by [`scripts/run-tests-with-report.js`](./scripts/run-tests-with-report.js), a small cross-platform Node script (invoked by `npm test`, `npm run test:smoke`, and `npm run test:regression`). It runs Playwright, then **always** runs the Allure generate/open steps afterwards regardless of whether the tests passed or failed, and finally exits with the tests' own exit code (so CI/exit-status checks still work correctly). Plain shell chaining like `playwright test; npm run allure:report` was tried first but breaks on Windows, since `npm` runs scripts through `cmd.exe` there, and `cmd.exe` doesn't treat `;` as a command separator the way bash does — this script avoids that problem entirely by doing the sequencing in Node.js instead of the shell.

This happens whether the run passes or fails, so you always land on the report as soon as the command finishes.

If you ever need to regenerate or reopen the report manually (e.g. after re-running just `playwright test` directly), use:

```bash
npm run allure:report     # generate + open in one step
npm run allure:generate   # generate only
npm run allure:open       # open the last generated report
```

> **Note:** `allure open` starts a small local web server (Allure reports don't render correctly via `file://`). Leave the terminal running while you're viewing the report, and press `Ctrl+C` to stop it when done.

### Playwright HTML Report

The built-in Playwright HTML report is still generated on every run (useful for trace viewing / CI artifacts) but is not opened automatically. View it with:

```bash
npm run report:html
```

The report is saved to `playwright-report/index.html`.

---

## API Coverage

### `POST /auth/login`
- Successful login returns `access_token` + `refresh_token` (201)
- Invalid password → 401
- Non-existent email → 401
- Empty email → 401

### `GET /auth/profile`
- Valid Bearer token → 200 with `id`, `email`, `role`
- No token → 401
- Invalid token → 401

### `POST /auth/refresh-token`
- Valid refresh token → new `access_token` + `refresh_token` (201)
- Invalid refresh token → 401
- Empty refresh token → 400

---

## Architecture

```
Feature file (.feature)
        │
        ▼
  Step definitions (steps/)
        │  uses
        ▼
  Fixtures (support/fixtures.ts)   ← AuthState (shared mutable state per test)
        │  uses
        ▼
  AuthClient (src/api/authClient.ts)  ← thin wrapper around Playwright APIRequestContext
        │
        ▼
  Playwright Test Runner
        │
        ├──▶ allure-results/ (raw results) ──▶ allure generate ──▶ allure-report/ ──▶ allure open (auto-launches browser)
        └──▶ playwright-report/ (HTML, generated but not auto-opened)
```

- **`AuthClient`** — encapsulates all raw HTTP calls. Each method maps to one API endpoint.
- **`AuthState`** — a per-test mutable state bag (`lastStatus`, `lastBody`, `accessToken`, `refreshToken`) that allows `When` steps to write results and `Then` steps to assert them without coupling.
- **`Fixtures`** — Playwright-BDD fixtures that wire `AuthClient` and `AuthState` into every step definition via dependency injection.
- **Allure reporting pipeline** — `allure-playwright` streams results into `allure-results/` during the run; the `test` / `test:smoke` / `test:regression` npm scripts then chain `allure generate` and `allure open` so the HTML report is built and launched automatically at the end of every run, pass or fail.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full diagram, including the reporting pipeline.

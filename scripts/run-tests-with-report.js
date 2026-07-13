#!/usr/bin/env node
/**
 * Cross-platform test runner.
 *
 * Runs `playwright test` (forwarding any extra CLI args, e.g. --grep @smoke),
 * then ALWAYS generates and opens the Allure report afterwards — whether the
 * tests passed or failed — and finally exits with the tests' own exit code.
 *
 * Why this file exists instead of `playwright test; npm run allure:report`:
 * `;` is a bash/zsh command separator. npm runs scripts through cmd.exe on
 * Windows, which does not understand `;` the same way, so the command was
 * being mis-parsed there. Doing the sequencing in plain Node.js works
 * identically on Windows, macOS, and Linux.
 */
const { spawnSync } = require('node:child_process');

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true, // resolves local .bin executables (playwright, allure) on all OSes
  });
  return result.status ?? 1;
}

// Forward any extra args (e.g. --grep @smoke) straight through to Playwright.
// --skip-open is consumed here (used in CI, where there's no browser/display).
const rawArgs = process.argv.slice(2);
const skipOpen = rawArgs.includes('--skip-open');
const extraArgs = rawArgs.filter((arg) => arg !== '--skip-open');

const testExitCode = run('npx', ['playwright', 'test', ...extraArgs]);

console.log('\n📊 Generating Allure report...\n');
run('npx', ['allure', 'generate', './allure-results', '--clean', '-o', './allure-report']);

if (!skipOpen) {
  console.log('\n🌐 Opening Allure report...\n');
  run('npx', ['allure', 'open', './allure-report']);
}

process.exit(testExitCode);

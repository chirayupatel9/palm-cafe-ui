/**
 * Playwright global setup: start API, seed test DB, start UI.
 * Uses dedicated test DB (TEST_DB_NAME / cafe_app_test). No mocks.
 */
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const apiDir = path.join(rootDir, '..', 'palm-cafe-api');
const uiDir = rootDir;

const API_URL = 'http://localhost:5000';
const UI_URL = 'http://localhost:3000';
const statePath = path.join(__dirname, '.e2e-servers.json');

function waitFor(url, label, maxWaitMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryFetch = () => {
      fetch(url, { method: 'GET' }).then((r) => {
        if (r.ok) return resolve();
        if (Date.now() - start > maxWaitMs) return reject(new Error(`${label} not ready in time`));
        setTimeout(tryFetch, 500);
      }).catch(() => {
        if (Date.now() - start > maxWaitMs) return reject(new Error(`${label} not ready in time`));
        setTimeout(tryFetch, 500);
      });
    };
    tryFetch();
  });
}

async function runSeed() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      DB_NAME: process.env.TEST_DB_NAME || 'cafe_app_test',
      TEST_DB_NAME: process.env.TEST_DB_NAME || 'cafe_app_test'
    };
    const child = spawn('node', ['tests/e2e/seedForBrowser.js'], {
      cwd: apiDir,
      env,
      stdio: 'inherit'
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error('Seed exited ' + code))));
  });
}

module.exports = async function () {
  const apiEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: '5000',
    DB_NAME: process.env.TEST_DB_NAME || 'cafe_app_test',
    TEST_DB_NAME: process.env.TEST_DB_NAME || 'cafe_app_test',
    JWT_SECRET: process.env.TEST_JWT_SECRET || process.env.JWT_SECRET || 'test-jwt-secret-e2e',
    LOCKOUT_DURATION_MS: '2000'
  };

  const apiProcess = spawn('node', ['index.js'], {
    cwd: apiDir,
    env: apiEnv,
    stdio: 'pipe'
  });
  apiProcess.stderr.pipe(process.stderr);
  apiProcess.stdout.pipe(process.stdout);

  await waitFor(API_URL + '/api/health', 'API');

  await runSeed();

  const uiEnv = {
    ...process.env,
    REACT_APP_API_URL: API_URL,
    CI: '1',
    BROWSER: 'none'
  };
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const uiProcess = spawn(npmCmd, ['run', 'start'], {
    cwd: uiDir,
    env: uiEnv,
    stdio: 'pipe',
    shell: process.platform === 'win32'
  });
  uiProcess.stderr.pipe(process.stderr);
  uiProcess.stdout.pipe(process.stdout);

  await waitFor(UI_URL, 'UI', 120000);

  fs.writeFileSync(statePath, JSON.stringify({
    apiPid: apiProcess.pid,
    uiPid: uiProcess.pid
  }), 'utf8');
};

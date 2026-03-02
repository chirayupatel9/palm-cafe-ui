/**
 * Playwright global teardown: stop API and UI processes.
 */
const path = require('path');
const fs = require('fs');

const statePath = path.join(__dirname, '.e2e-servers.json');

module.exports = async function () {
  try {
    const data = fs.readFileSync(statePath, 'utf8');
    const { apiPid, uiPid } = JSON.parse(data);
    if (apiPid) try { process.kill(apiPid, 'SIGTERM'); } catch (e) { /* ignore */ }
    if (uiPid) try { process.kill(uiPid, 'SIGTERM'); } catch (e) { /* ignore */ }
    fs.unlinkSync(statePath);
  } catch (e) {
    // No state file or already cleaned
  }
};

#!/usr/bin/env node
// Cross-platform helper: spawn a child Node process with DB env vars cleared
// and run the setup-all script. This avoids PowerShell-specific helpers.

const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = __dirname; // scripts folder
const setupScript = path.join(backendDir, 'setup-all.js');

// Build a clean env: copy process.env and delete DB-related vars
const cleanEnv = Object.assign({}, process.env);
[ 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_ADMIN_USER', 'DB_ADMIN_PASSWORD' ].forEach(k => {
  if (k in cleanEnv) delete cleanEnv[k];
});

console.log('Starting setup-all in a clean environment (DB env vars removed)');

const res = spawnSync(process.execPath, [setupScript], { stdio: 'inherit', env: cleanEnv });
if (res.error) {
  console.error('Failed to run setup-all:', res.error);
  process.exit(1);
}
process.exit(res.status || 0);

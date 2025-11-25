#!/usr/bin/env node
// Aggregator: runs create-db, seed-profiles and seed-projects in sequence.
// Usage: node scripts/setup-all.js

const { spawnSync } = require('child_process');
const path = require('path');

const scriptsDir = __dirname;

function runScript(scriptName) {
  const scriptPath = path.join(scriptsDir, scriptName);
  console.log(`\n=== Running ${scriptName} ===`);
  const res = spawnSync(process.execPath, [scriptPath], { stdio: 'inherit' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`${scriptName} exited with code ${res.status}`);
}

async function main() {
  // Try to create DB using create-db.js (will try admin creds if present)
  try {
    // Prefer dropping entire DB if admin credentials are available
    try {
      runScript('drop-db.js');
      console.log('Dropped existing database (admin mode).');
    } catch (e) {
      console.warn('drop-db failed (no admin privileges?), falling back to dropping tables via clean-db.js');
      try { runScript('clean-db.js'); } catch (err) { console.warn('clean-db also failed:', err && err.message ? err.message : err); }
    }

    // Re-create DB and user
    runScript('create-db.js');
  } catch (err) {
    console.warn('create-db step failed:', err && err.message ? err.message : err);
    console.warn('Trying to continue with seed scripts; if they fail, run create-db manually or provide admin credentials.');
  }

  try {
    // Ensure profiles cleanup (remove empty/duplicate logins) before seeding
    try { runScript('cleanup-profiles.js'); } catch (e) { console.warn('cleanup-profiles failed (continuing):', e && e.message ? e.message : e); }
    runScript('seed-profiles.js');
  } catch (err) {
    console.error('seed-profiles failed:', err && err.message ? err.message : err);
    process.exit(1);
  }

  try {
    runScript('seed-projects.js');
    // Fix any orphaned FK values left from older schemas
    try { runScript('fix-orphans.js'); } catch (e) { console.warn('fix-orphans failed (continuing):', e && e.message ? e.message : e); }
  } catch (err) {
    console.error('seed-projects failed:', err && err.message ? err.message : err);
    process.exit(1);
  }

  console.log('\nAll steps completed successfully.');
}

main();

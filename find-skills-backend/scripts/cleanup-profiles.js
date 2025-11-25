#!/usr/bin/env node
// Cleanup script for `profiles` table:
// - creates a timestamped backup table
// - removes rows with NULL or empty `login`
// - removes duplicate logins keeping the lowest id

const mysql = require('mysql2/promise');
const cfg = require('./db-config');

(async function main() {
  const { host, port, user, password, database } = cfg;
  console.log(`Connecting to ${user}@${host}:${port}/${database} ...`);
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database });
  } catch (err) {
    console.error('Failed to connect:', err && err.message ? err.message : err);
    process.exit(1);
  }

  try {
    // check profiles exists
    const [tables] = await conn.execute("SHOW TABLES LIKE 'profiles'");
    if (!Array.isArray(tables) || tables.length === 0) {
      console.log('No profiles table found — nothing to clean.');
      await conn.end();
      return;
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `profiles_backup_${ts}`;
    console.log('Creating backup table:', backupName);
    await conn.execute(`CREATE TABLE \`${backupName}\` AS SELECT * FROM profiles`);

    console.log('Deleting rows with empty or NULL login...');
    await conn.execute("DELETE FROM profiles WHERE login = '' OR login IS NULL");

    console.log('Removing duplicate logins (keeping lowest id)...');
    await conn.execute(
      `DELETE p1 FROM profiles p1 JOIN profiles p2 ON p1.login = p2.login AND p1.id > p2.id`
    );

    console.log('Cleanup completed. Verify your data or restore from backup if needed:', backupName);
  } catch (e) {
    console.error('Cleanup failed:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try { await conn.end(); } catch (e) {}
  }
})();

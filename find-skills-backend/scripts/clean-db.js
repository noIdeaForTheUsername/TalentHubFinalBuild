#!/usr/bin/env node
// Clean DB script: optionally backup existing tables and drop them in a safe order.
// Usage: node scripts/clean-db.js

const mysql = require('mysql2/promise');
const cfg = require('./db-config');

(async function main() {
  const { host, port, user, password, database } = cfg;
  console.log(`Connecting to ${user}@${host}:${port}/${database} ...`);
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database });
  } catch (err) {
    console.error('Failed to connect to DB for cleanup:', err && err.message ? err.message : err);
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  // Tables must be dropped in dependency order: children first
  const tables = [ 'messages', 'chats', 'comments', 'projects', 'profiles' ];

  try {
    for (const t of tables) {
      // If table exists, create a backup and drop it
      const [rows] = await conn.execute("SHOW TABLES LIKE ?", [t]);
      if (Array.isArray(rows) && rows.length) {
        const backupName = `${t}_backup_${ts}`;
        try {
          console.log(`Creating backup table \`${backupName}\` from \`${t}\`...`);
          await conn.execute(`CREATE TABLE \`${backupName}\` AS SELECT * FROM \`${t}\``);
        } catch (e) {
          console.warn(`Could not create backup for ${t}:`, e && e.message ? e.message : e);
        }
        try {
          console.log(`Dropping table \`${t}\`...`);
          await conn.execute(`SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS \`${t}\`; SET FOREIGN_KEY_CHECKS = 1;`);
        } catch (e) {
          console.warn(`Failed to drop table ${t}:`, e && e.message ? e.message : e);
        }
      } else {
        console.log(`Table \`${t}\` does not exist — skipping.`);
      }
    }

    console.log('Cleanup finished. Backups were created where tables existed.');
  } catch (e) {
    console.error('Cleanup error:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try { await conn.end(); } catch (e) {}
  }
})();

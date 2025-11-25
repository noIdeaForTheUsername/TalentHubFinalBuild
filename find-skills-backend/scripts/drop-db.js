#!/usr/bin/env node
// Drop the configured database (requires admin/root credentials via env vars)
// Usage: set DB_ADMIN_USER & DB_ADMIN_PASSWORD (or DB_ROOT_USER/DB_ROOT_PASSWORD), then:
//   node scripts/drop-db.js

const mysql = require('mysql2/promise');
const cfg = require('./db-config');

(async function main() {
  const adminUser = process.env.DB_ADMIN_USER || process.env.DB_ROOT_USER || 'root';
  const adminPass = process.env.DB_ADMIN_PASSWORD || process.env.DB_ROOT_PASSWORD || '';
  const host = cfg.host;
  const port = cfg.port;

  console.log(`Connecting as admin ${adminUser}@${host}:${port} to drop database ${cfg.database} ...`);
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user: adminUser, password: adminPass });
  } catch (err) {
    console.error('Failed to connect as admin. Provide DB_ADMIN_USER/DB_ADMIN_PASSWORD or drop DB manually.');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }

  try {
    await conn.execute(`DROP DATABASE IF EXISTS \`${cfg.database}\``);
    console.log(`Database \`${cfg.database}\` dropped (if it existed).`);
  } catch (e) {
    console.error('Failed to drop database:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try { await conn.end(); } catch (e) {}
  }
})();

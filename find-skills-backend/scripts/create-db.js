#!/usr/bin/env node
// Create database and user helper.
// Usage:
//  - set DB_ADMIN_USER and DB_ADMIN_PASSWORD (root) in env, or run interactively via mysql client
//  - then run: node scripts/create-db.js
// The script will create the database and grant privileges to the configured DB_USER.

const mysql = require('mysql2/promise');
const cfg = require('./db-config');

async function main() {
  const adminUser = process.env.DB_ADMIN_USER || process.env.DB_ROOT_USER || 'root';
  const adminPass = process.env.DB_ADMIN_PASSWORD || process.env.DB_ROOT_PASSWORD || '';
  const host = cfg.host;
  const port = cfg.port;

  console.log(`Attempting to connect to ${adminUser}@${host}:${port} to create database ${cfg.database} ...`);

  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user: adminUser, password: adminPass });
  } catch (err) {
    console.error('Failed to connect as admin. Provide DB_ADMIN_USER/DB_ADMIN_PASSWORD with sufficient privileges, or create the DB manually.');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }

  try {
    await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database \`${cfg.database}\` ensured.`);

    // Use parameter substitution is not supported for identifiers, build statements carefully.
    const createUserSql = `CREATE USER IF NOT EXISTS '${cfg.user}'@'localhost' IDENTIFIED BY '${cfg.password.replace(/'/g, "\\'")}'`;
    try {
      await conn.execute(createUserSql);
      console.log(`User '${cfg.user}' ensured.`);
    } catch (e) {
      // older MySQL versions may not support IF NOT EXISTS for CREATE USER; ignore if user exists
      if (e && e.code === 'ER_CANNOT_USER') {
        console.warn('Could not create user (may already exist). Continuing.');
      } else {
        // try GRANT anyway
        console.warn('CREATE USER returned:', e.message || e);
      }
    }

    const grantSql = `GRANT ALL PRIVILEGES ON \`${cfg.database}\`.* TO '${cfg.user}'@'localhost'`;
    await conn.execute(grantSql);
    await conn.execute('FLUSH PRIVILEGES');
    console.log(`Granted privileges on \`${cfg.database}\` to '${cfg.user}'.`);

    console.log('Done. You can now run the seed scripts.');
  } catch (err) {
    console.error('Failed to create DB or user:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    try { if (conn) await conn.end(); } catch (e) {}
  }
}

main();

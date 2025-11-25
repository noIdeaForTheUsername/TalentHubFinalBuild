#!/usr/bin/env node
// Fix orphaned foreign keys left from older schemas.
// - set projects.authorId = NULL where profiles.id does not exist
// - set comments.authorId = NULL where profiles.id does not exist
// - delete comments that reference non-existent projects

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
    console.log('Nullifying projects.authorId for missing profiles...');
    await conn.execute(
      `UPDATE \`projects\` p LEFT JOIN \`profiles\` pr ON p.authorId = pr.id SET p.authorId = NULL WHERE p.authorId IS NOT NULL AND pr.id IS NULL`);

    console.log('Nullifying comments.authorId for missing profiles...');
    await conn.execute(
      `UPDATE \`comments\` c LEFT JOIN \`profiles\` pr ON c.authorId = pr.id SET c.authorId = NULL WHERE c.authorId IS NOT NULL AND pr.id IS NULL`
    );

    console.log('Deleting comments referencing missing projects...');
    await conn.execute(
      `DELETE c FROM \`comments\` c LEFT JOIN \`projects\` p ON c.projectId = p.id WHERE p.id IS NULL`
    );

    console.log('Orphan fixes complete.');
  } catch (e) {
    console.error('Fixing orphans failed:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try { await conn.end(); } catch (e) {}
  }
})();

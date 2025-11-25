#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const jsonPath = path.join(repoRoot, 'webauthn-credentials.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('webauthn-credentials.json not found at', jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const obj = JSON.parse(raw || '{}');

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'findskills_user';
  const password = process.env.DB_PASSWORD || 'findskills_pass';
  const database = process.env.DB_NAME || 'findskills_dev';

  const conn = await mysql.createConnection({ host, port, user, password, database });

  const createSql = `CREATE TABLE IF NOT EXISTS \`webauthn_credentials\` (
    \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`profile_id\` INT NULL,
    \`login\` VARCHAR(255) NOT NULL,
    \`credential_id\` VARCHAR(512) NOT NULL,
    \`public_key\` LONGBLOB NOT NULL,
    \`counter\` INT NOT NULL DEFAULT 0,
    \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY \`ux_webauthn_credential_id\` (\`credential_id\`),
    KEY \`idx_webauthn_login\` (\`login\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  await conn.query(createSql);

  const insertSql = `INSERT INTO webauthn_credentials (profile_id, login, credential_id, public_key, counter)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE public_key = VALUES(public_key), counter = VALUES(counter), updated_at = CURRENT_TIMESTAMP`;

  for (const [login, creds] of Object.entries(obj)) {
    if (!Array.isArray(creds)) continue;
    for (const c of creds) {
      const credentialId = c.credentialID;
      let pubBuf = Buffer.alloc(0);
      if (c.publicKey && c.publicKey.type === 'Buffer' && Array.isArray(c.publicKey.data)) {
        pubBuf = Buffer.from(c.publicKey.data);
      } else if (typeof c.publicKey === 'string') {
        try {
          pubBuf = Buffer.from(c.publicKey, 'base64');
        } catch (e) {
          pubBuf = Buffer.from(String(c.publicKey));
        }
      } else {
        pubBuf = Buffer.from(JSON.stringify(c.publicKey || ''));
      }

      const counter = Number(c.counter || 0);

      let profileId = null;
      try {
        const [rows] = await conn.query('SELECT id FROM profiles WHERE login = ? LIMIT 1', [login]);
        if (Array.isArray(rows) && rows.length > 0) profileId = rows[0].id;
      } catch (e) {
        // ignore: profiles table may not exist yet in a fresh DB
      }

      await conn.query(insertSql, [profileId, login, credentialId, pubBuf, counter]);
      console.log('Upserted credential', credentialId, 'for', login);
    }
  }

  await conn.end();
  console.log('Import finished');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});

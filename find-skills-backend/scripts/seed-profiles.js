#!/usr/bin/env node
// Seed script: creates `profiles` table (if missing) and inserts sample users with bcrypt-hashed passwords.
// Usage:
//   npm install --save mysql2 bcryptjs
//   node scripts/seed-profiles.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async function main() {
  const cfg = require('./db-config');
  const { host, port, user, password, database } = cfg;

  console.log(`Connecting to ${user}@${host}:${port}/${database} ...`);
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database });
  } catch (err) {
    if (err && err.code === 'ER_BAD_DB_ERROR') {
      console.log(`Database ${database} not found — attempting to create it using the same DB user...`);
      try {
        const adminConn = await mysql.createConnection({ host, port, user, password });
        await adminConn.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await adminConn.end();
        console.log(`Database ${database} created (or already existed). Reconnecting...`);
        conn = await mysql.createConnection({ host, port, user, password, database });
      } catch (e) {
        console.error('Failed to create database automatically. You may lack privileges.');
        throw e;
      }
    } else {
      throw err;
    }
  }

  // Create table if missing (note: `schoolClass` is a single numeric field)
  await conn.execute(
    "CREATE TABLE IF NOT EXISTS `profiles` (\n" +
      "  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,\n" +
      "  `login` VARCHAR(100) NOT NULL UNIQUE,\n" +
      "  `schoolType` VARCHAR(32) DEFAULT NULL,\n" +
      "  `schoolClass` INT DEFAULT NULL,\n" +
      "  `favoriteSubjects` TEXT DEFAULT NULL,\n" +
      "  `bio` TEXT DEFAULT NULL,\n" +
      "  `city` VARCHAR(100) DEFAULT NULL,\n" +
      "  `passwordHash` VARCHAR(255) DEFAULT NULL\n" +
      ");"
  );

  const samples = [
    { login: 'janek', password: 'password123', schoolType: 'secondary', schoolClass: 3, favoriteSubjects: 'angular,typescript,html,css', bio: 'Fullstack enthusiast. Loves Angular and clean code.', city: 'Warszawa' },
    { login: 'asia', password: 'asiaspass', schoolType: 'university', schoolClass: 1, favoriteSubjects: 'python,machine learning,data science', bio: 'Interested in data and ML.', city: 'Krakow' },
    { login: 'marek', password: 'marekpw', schoolType: 'secondary', schoolClass: 2, favoriteSubjects: 'java,spring,sql', bio: 'Backend dev, likes Java and databases.', city: 'Gdansk' },
    { login: 'ola', password: 'olapass123', schoolType: 'secondary', schoolClass: null, favoriteSubjects: 'html,css,design', bio: 'Interested in UI/UX and frontend.', city: 'Poznan' },
  ];

  for (const s of samples) {
    // compute bcrypt hash
    const hash = await bcrypt.hash(s.password, 8);

    // upsert: if login exists, update; otherwise insert
    const [rows] = await conn.execute('SELECT id FROM `profiles` WHERE login = ?', [s.login]);
    if (Array.isArray(rows) && rows.length) {
      console.log(`Updating user ${s.login}`);
      await conn.execute(
        'UPDATE `profiles` SET schoolType = ?, schoolClass = ?, favoriteSubjects = ?, bio = ?, city = ?, passwordHash = ? WHERE login = ?',
        [s.schoolType, s.schoolClass, s.favoriteSubjects, s.bio, s.city, hash, s.login]
      );
    } else {
      console.log(`Inserting user ${s.login}`);
      await conn.execute(
        'INSERT INTO `profiles` (login, schoolType, schoolClass, favoriteSubjects, bio, city, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s.login, s.schoolType, s.schoolClass, s.favoriteSubjects, s.bio, s.city, hash]
      );
    }
  }

  console.log('Done.');
  await conn.end();
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

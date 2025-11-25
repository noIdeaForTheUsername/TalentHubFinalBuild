#!/usr/bin/env node
// Seed script: creates `projects` table (projects + competitions via `type`) and
// `comments`, `chats`, `messages` tables, then inserts demo rows.
// Usage:
//   npm install --save mysql2
//   node scripts/seed-projects.js

const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

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

  // Ensure `profiles` table exists before creating tables that reference it.
  try {
    const [rows] = await conn.execute("SHOW TABLES LIKE 'profiles'");
    const hasProfiles = Array.isArray(rows) && rows.length;
    if (!hasProfiles) {
      console.log('Profiles table not found — running profiles seed first to ensure FK targets exist...');
      // run seed-profiles to create profiles table + sample users
      execSync('node ./scripts/seed-profiles.js', { stdio: 'inherit' });
    }
  } catch (e) {
    console.warn('Could not verify/create profiles table automatically:', e && e.message ? e.message : e);
  }

  // Create a single projects table (stores both projects and competitions)
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`projects\` (
    \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(255) NOT NULL,
    \`description\` TEXT DEFAULT NULL,
    \`link\` VARCHAR(512) DEFAULT NULL,
    \`authorId\` INT DEFAULT NULL,
    \`type\` ENUM('project','competition') NOT NULL DEFAULT 'project',
    \`remote\` TINYINT(1) DEFAULT 0,
    \`subject\` VARCHAR(255) DEFAULT NULL,
    \`schoolType\` VARCHAR(32) DEFAULT NULL,
    \`minSchoolClass\` INT DEFAULT NULL,
    \`maxSchoolClass\` INT DEFAULT NULL,
    \`city\` VARCHAR(100) DEFAULT NULL,
    \`beginDate\` DATETIME DEFAULT NULL,
    \`endDate\` DATETIME DEFAULT NULL,
    \`minPeople\` INT DEFAULT NULL,
    \`maxPeople\` INT DEFAULT NULL,
    \`currentPeople\` INT DEFAULT NULL,
    \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Comments table (uses camelCase column names to match TypeORM entities)
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`comments\` (
    \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`projectId\` INT NOT NULL,
    \`authorId\` INT NOT NULL,
    \`content\` TEXT NOT NULL,
    \`timestamp\` DATETIME NOT NULL,
    \`parentId\` INT DEFAULT NULL,
    INDEX (\`projectId\`),
    INDEX (\`authorId\`),
    CONSTRAINT \`FK_comments_projects\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Chats and messages
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`chats\` (
    \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`participantA\` INT NOT NULL,
    \`participantB\` INT NOT NULL,
    UNIQUE KEY \`pair_idx\` (\`participantA\`, \`participantB\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await conn.execute(`CREATE TABLE IF NOT EXISTS \`messages\` (
    \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`chatId\` INT NOT NULL,
    \`senderId\` INT NOT NULL,
    \`content\` TEXT NOT NULL,
    \`timestamp\` DATETIME NOT NULL,
    INDEX (\`chatId\`),
    CONSTRAINT \`FK_messages_chats\` FOREIGN KEY (\`chatId\`) REFERENCES \`chats\`(\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Sample projects
  const projects = [
    {
      name: 'FindSkills — frontend demo',
      description: 'A small Angular frontend that demonstrates profile discovery and project cards.',
      link: 'https://github.com/Reiv21/FindSkills-frontend',
      author_login: 'janek',
      type: 'project',
      remote: 1,
      subject: 'Informatyka',
      city: null,
      beginDate: null,
      endDate: null,
      minPeople: 1,
      maxPeople: 6,
      currentPeople: 0,
    },
    {
      name: 'AI-based skill matcher',
      description: 'Prototype service using embeddings to match profiles to projects.',
      link: 'https://example.com/ai-matcher',
      author_login: 'marek',
      type: 'project',
      remote: 0,
      subject: 'Informatyka',
      city: 'Krakow',
      beginDate: null,
      endDate: null,
      minPeople: 1,
      maxPeople: 4,
      currentPeople: 1,
    },
    {
      name: 'Open-source CV parser',
      description: 'Tool to extract skills from resumes and map to normalized subjects.',
      link: null,
      author_login: 'ola',
      type: 'project',
      remote: 1,
      subject: 'Informatyka',
      city: null,
      beginDate: null,
      endDate: null,
      minPeople: 1,
      maxPeople: 5,
      currentPeople: 0,
    },
  ];

  const contests = [
    {
      title: 'Konkurs: Hack the Skills 2026',
      description: 'Two-week online contest for students to build skill-matching apps.',
      link: 'https://example.com/hack-the-skills-2026',
    },
    {
      title: 'Algorytmika Junior 2026',
      description: 'Algorithmic challenge for secondary school students.',
      link: null,
    },
  ];

  // Insert or update projects
  for (const p of projects) {
    let authorId = null;
    try {
      const [profRows] = await conn.execute('SELECT id FROM `profiles` WHERE login = ? LIMIT 1', [p.author_login]);
      if (Array.isArray(profRows) && profRows.length) authorId = profRows[0].id;
    } catch (err) {
      // profiles may not exist yet
    }

    const [rows] = await conn.execute('SELECT id FROM `projects` WHERE name = ? LIMIT 1', [p.name]);
    if (Array.isArray(rows) && rows.length) {
      await conn.execute(
        `UPDATE ` + '`projects`' + ` SET description = ?, link = ?, authorId = ?, type = ?, remote = ?, subject = ?, city = ?, beginDate = ?, endDate = ?, minPeople = ?, maxPeople = ?, currentPeople = ? WHERE name = ?`,
        [p.description, p.link, authorId, p.type, p.remote, p.subject, p.city, p.beginDate, p.endDate, p.minPeople, p.maxPeople, p.currentPeople, p.name]
      );
    } else {
      await conn.execute(
        `INSERT INTO ` + '`projects`' + ` (name, description, link, authorId, type, remote, subject, city, beginDate, endDate, minPeople, maxPeople, currentPeople) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.name, p.description, p.link, authorId, p.type, p.remote, p.subject, p.city, p.beginDate, p.endDate, p.minPeople, p.maxPeople, p.currentPeople]
      );
    }
  }

  // Insert contests as projects with type='competition'
  for (const c of contests) {
    const name = c.title;
    const [rows] = await conn.execute('SELECT id FROM `projects` WHERE name = ? LIMIT 1', [name]);
    if (Array.isArray(rows) && rows.length) {
      await conn.execute('UPDATE `projects` SET description = ?, link = ?, type = ? WHERE name = ?', [c.description, c.link, 'competition', name]);
    } else {
      await conn.execute('INSERT INTO `projects` (name, description, link, type, remote, subject, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, c.description, c.link, 'competition', 0, null, new Date()]);
    }
  }

  console.log('Projects and contests seed complete.');

  // Insert demo comments and chats/messages (only if profiles exist)
  try {
    const [pRows] = await conn.execute('SELECT id FROM `projects` LIMIT 1');
    if (Array.isArray(pRows) && pRows.length) {
      const projectId = pRows[0].id;
      const [profRows] = await conn.execute('SELECT id, login FROM `profiles` WHERE login IN (?, ?) LIMIT 2', ['janek', 'ola']);
      if (Array.isArray(profRows) && profRows.length) {
        for (let i = 0; i < profRows.length; i++) {
          const a = profRows[i];
          await conn.execute('INSERT INTO `comments` (projectId, authorId, content, timestamp) VALUES (?, ?, ?, ?)', [projectId, a.id, `Sample comment ${i + 1} by ${a.login}`, new Date()]);
        }
      }
    }

    const [janek] = await conn.execute('SELECT id FROM `profiles` WHERE login = ? LIMIT 1', ['janek']);
    const [ola] = await conn.execute('SELECT id FROM `profiles` WHERE login = ? LIMIT 1', ['ola']);
    const janekRow = Array.isArray(janek) && janek.length ? janek[0] : null;
    const olaRow = Array.isArray(ola) && ola.length ? ola[0] : null;
    if (janekRow && olaRow) {
      const ja = janekRow.id;
      const ol = olaRow.id;
      const a = Math.min(ja, ol);
      const b = Math.max(ja, ol);
      const [existingChats] = await conn.execute('SELECT id FROM `chats` WHERE participantA = ? AND participantB = ? LIMIT 1', [a, b]);
      let chatId;
      if (Array.isArray(existingChats) && existingChats.length) {
        chatId = existingChats[0].id;
      } else {
        const [res] = await conn.execute('INSERT INTO `chats` (participantA, participantB) VALUES (?, ?)', [a, b]);
        chatId = res.insertId;
      }
      await conn.execute('INSERT INTO `messages` (chatId, senderId, content, timestamp) VALUES (?, ?, ?, ?)', [chatId, ja, 'Cześć Ola! To demo wiadomości', new Date()]);
      await conn.execute('INSERT INTO `messages` (chatId, senderId, content, timestamp) VALUES (?, ?, ?, ?)', [chatId, ol, 'Cześć Janek! Dzięki za wiadomość.', new Date()]);
    }
  } catch (err) {
    console.warn('Could not insert demo comments/chats:', err && err.message ? err.message : err);
  }

  await conn.end();
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

#!/usr/bin/env node
// Seed demo data: 21 profiles (3 cities x 7), posts (0-3 each), comments (0-8 per post),
// demo account with messages and a post. All descriptions in Polish.

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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
      console.log(`Database ${database} not found — attempting to create it...`);
      const adminConn = await mysql.createConnection({ host, port, user, password });
      await adminConn.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await adminConn.end();
      conn = await mysql.createConnection({ host, port, user, password, database });
    } else {
      throw err;
    }
  }

  // Ensure base profiles table and basic sample users exist
  try {
    execSync('node ./scripts/seed-profiles.js', { stdio: 'inherit' });
  } catch (e) {
    console.warn('seed-profiles failed or skipped:', e && e.message ? e.message : e);
  }

  // Helper to upsert profile
  async function upsertProfile(p) {
    const hash = await bcrypt.hash(p.password || 'password', 8);
    const [rows] = await conn.execute('SELECT id FROM `profiles` WHERE login = ? LIMIT 1', [p.login]);
    if (Array.isArray(rows) && rows.length) {
      await conn.execute('UPDATE `profiles` SET schoolType = ?, schoolClass = ?, favoriteSubjects = ?, bio = ?, city = ?, passwordHash = ? WHERE login = ?', [p.schoolType, p.schoolClass, p.favoriteSubjects, p.bio, p.city, hash, p.login]);
      return rows[0].id;
    } else {
      const res = await conn.execute('INSERT INTO `profiles` (login, schoolType, schoolClass, favoriteSubjects, bio, city, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?)', [p.login, p.schoolType, p.schoolClass, p.favoriteSubjects, p.bio, p.city, hash]);
      return res[0].insertId;
    }
  }

  // Cities and users
  const cities = [
    { name: 'Warszawa', names: ['anna', 'bartek', 'czarek', 'dorota', 'ewa', 'filip', 'grzegorz'] },
    { name: 'Krakow', names: ['magda', 'ignacy', 'kasia', 'lukasz', 'marek2', 'ola2', 'pawel'] },
    { name: 'Gdansk', names: ['anka', 'borys', 'celina', 'dawid', 'ewa2', 'franek', 'grazyna'] },
  ];

  const allProfiles = [];

  for (const city of cities) {
    // first 4 similar skills, last 3 different
    for (let i = 0; i < city.names.length; i++) {
      const login = `${city.names[i]}`;
      const similar = i < 4;
      const subjects = similar ? 'html,css,javascript,angular' : (i === 4 ? 'python,data science,ml' : (i === 5 ? 'java,spring,sql' : 'ux,design,html'));
      const bio = similar
        ? `Cześć, jestem ${login}. Zajmuję się frontendem, lubię budować interfejsy i pracować z Angular.`
        : `Cześć, jestem ${login}. Interesuję się ${subjects.replace(/,/g, ', ')}.`;
      const p = { login, password: 'demo123', schoolType: 'secondary', schoolClass: Math.ceil(Math.random()*3), favoriteSubjects: subjects, bio, city: city.name };
      const id = await upsertProfile(p);
      allProfiles.push({ id, login: p.login, city: city.name });
    }
  }

  // Add recommended demo account
  const demo = { login: 'demo_jury', password: 'demo123', schoolType: 'university', schoolClass: 1, favoriteSubjects: 'koordynacja,przeglad,ocena', bio: 'Konto demonstracyjne dla jury — możesz przetestować filtry i wiadomości prywatne.', city: 'Warszawa' };
  const demoId = await upsertProfile(demo);
  allProfiles.push({ id: demoId, login: demo.login, city: demo.city });

  console.log(`Inserted/updated ${allProfiles.length} profiles.`);

  // Insert posts (projects) — 0-3 per user determined by index
  const projectIds = [];
  // detect whether `projects` table has `createdAt` column (schema may vary)
  const [createdAtCol] = await conn.execute("SHOW COLUMNS FROM `projects` LIKE 'createdAt'");
  const hasCreatedAt = Array.isArray(createdAtCol) && createdAtCol.length > 0;
  for (let i = 0; i < allProfiles.length; i++) {
    const prof = allProfiles[i];
    const posts = i % 4; // 0..3
    for (let j = 0; j < posts; j++) {
      const name = `Projekt: ${prof.login} — przykład ${j + 1}`;
      const description = `${prof.login} zaprasza do współpracy przy małym projekcie. Opis po polsku, miasto: ${prof.city}. Umiejętności: ${prof.login.includes('ewa') || prof.login.includes('ewa2') ? 'UX,design' : 'frontend,Angular,TypeScript'}`;
      const link = null;
      const type = 'project';
      const remote = Math.random() > 0.5 ? 1 : 0;
      const subject = 'Informatyka';
      const city = prof.city;
      // Build insert dynamically to accommodate different schemas (createdAt optional)
      const cols = ['name', 'description', 'link', 'authorId', 'type', 'remote', 'subject', 'city'];
      const vals = [name, description, link, prof.id, type, remote, subject, city];
      if (hasCreatedAt) {
        cols.push('createdAt');
        vals.push(new Date());
      }
      cols.push('minPeople', 'maxPeople', 'currentPeople');
      vals.push(1, 6, 1);
      const placeholders = cols.map(() => '?').join(', ');
      const colList = cols.map((c) => `\`${c}\``).join(', ');
      const sql = `INSERT INTO \`projects\` (${colList}) VALUES (${placeholders})`;
      const [res] = await conn.execute(sql, vals);
      projectIds.push({ id: res.insertId, authorId: prof.id });
    }
  }

  console.log(`Inserted ${projectIds.length} projects.`);

  // Insert comments 0-8 per post
  for (let i = 0; i < projectIds.length; i++) {
    const p = projectIds[i];
    const commentsCount = (i * 3) % 9; // 0..8
    for (let c = 0; c < commentsCount; c++) {
      // pick random author
      const author = allProfiles[(i + c + 7) % allProfiles.length];
      const content = `Komentarz ${c + 1} do projektu ${p.id} — napisane po polsku przez ${author.login}.`;
      const ts = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30));
      await conn.execute('INSERT INTO `comments` (projectId, authorId, content, timestamp) VALUES (?, ?, ?, ?)', [p.id, author.id, content, ts]);
    }
  }

  console.log('Inserted comments for projects.');

  // Create some chats and messages — include demo_jury and a few users
  try {
    // pick some pairs
    const pairs = [ [demoId, allProfiles[0].id], [demoId, allProfiles[5].id], [allProfiles[1].id, allProfiles[2].id] ];
    for (const pair of pairs) {
      const a = Math.min(pair[0], pair[1]);
      const b = Math.max(pair[0], pair[1]);
      const [existing] = await conn.execute('SELECT id FROM `chats` WHERE participantA = ? AND participantB = ? LIMIT 1', [a, b]);
      let chatId;
      if (Array.isArray(existing) && existing.length) chatId = existing[0].id;
      else {
        const [res] = await conn.execute('INSERT INTO `chats` (participantA, participantB) VALUES (?, ?)', [a, b]);
        chatId = res.insertId;
      }
      // add some messages
      const msgs = 3 + (a + b) % 3; // 3..5
      for (let m = 0; m < msgs; m++) {
        const sender = m % 2 === 0 ? pair[0] : pair[1];
        const text = sender === demoId ? 'Wiadomość z konta demonstracyjnego.' : `Cześć, test wiadomości ${m + 1}`;
        await conn.execute('INSERT INTO `messages` (chatId, senderId, content, timestamp) VALUES (?, ?, ?, ?)', [chatId, sender, text, new Date(Date.now() - (msgs - m) * 60000)]);
      }
    }
  } catch (e) {
    console.warn('Could not create chats/messages:', e && e.message ? e.message : e);
  }

  console.log('Demo chats/messages created.');

  await conn.end();
  console.log('Demo seed finished.');
})().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});

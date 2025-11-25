// Centralized DB config for scripts.
// Prefer a local JSON file `db-config.local.json` placed next to this file.
// If the local file is missing, sensible defaults are used.
const fs = require('fs');
const path = require('path');

const localPath = path.join(__dirname, 'db-config.local.json');
let local = {};
if (fs.existsSync(localPath)) {
  try {
    local = JSON.parse(fs.readFileSync(localPath, 'utf8')) || {};
  } catch (e) {
    // ignore parse errors and fall back to defaults
    console.warn('Could not parse db-config.local.json, using defaults:', e.message || e);
  }
}

const config = {
  host: local.host || 'localhost',
  port: local.port ? Number(local.port) : 3306,
  user: local.user || 'findskills_user',
  password: local.password || 'findskills_pass',
  database: local.database || 'findskills_dev',
  connectionString() {
    return `${this.user}@${this.host}:${this.port}/${this.database}`;
  },
};

module.exports = config;

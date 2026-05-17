// scripts/inspect-sqlite.js
// Inspects the local SQLite database and prints table structure + sample rows.
'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = 'C:\\Users\\reva3\\Desktop\\ecochicharro.db';

let db;
try {
  db = new Database(DB_PATH, { readonly: true });
} catch (err) {
  console.error('ERROR: Could not open database:', err.message);
  process.exit(1);
}

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('\n=== TABLES ===');
console.log(tables.map(t => t.name).join(', '));

for (const { name } of tables) {
  // Row count
  const { count } = db.prepare(`SELECT COUNT(*) AS count FROM "${name}"`).get();
  console.log(`\n--- Table: ${name} (${count} rows) ---`);

  // Column info
  const cols = db.prepare(`PRAGMA table_info("${name}")`).all();
  console.log('Columns:', cols.map(c => `${c.name} (${c.type})`).join(', '));

  // Sample rows
  const rows = db.prepare(`SELECT * FROM "${name}" LIMIT 3`).all();
  if (rows.length === 0) {
    console.log('(no rows)');
  } else {
    rows.forEach((r, i) => console.log(`  row ${i + 1}:`, JSON.stringify(r)));
  }
}

db.close();
console.log('\n=== DONE ===');

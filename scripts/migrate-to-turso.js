/**
 * Migrate local SQLite data → Turso (remote libSQL)
 *
 * Run from project root:
 *   node scripts/migrate-to-turso.js
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local
 */

const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Cargar .env.local manualmente
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([\w_]+)=['"]?(.*?)['"]?\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), 'data', 'ecochicharro.db');

if (!fs.existsSync(DB_PATH)) {
  console.error(`ERROR: local database not found at ${DB_PATH}`);
  process.exit(1);
}

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('ERROR: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env.local');
  process.exit(1);
}

// ── Open both databases via libSQL ─────────────────────────────────────────────

const local = createClient({ url: `file:${DB_PATH}` });
console.log(`✓ Conectado a SQLite local: ${DB_PATH}`);

const remote = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
console.log(`✓ Conectado a Turso: ${process.env.TURSO_DATABASE_URL}`);

// ── Helpers ────────────────────────────────────────────────────────────────────

function toVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'bigint') return String(Number(v));
  if (typeof v === 'number') return String(v);
  // Escape single quotes for SQL strings
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function createSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
       id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
       display_name TEXT NOT NULL, barrio TEXT NOT NULL DEFAULT '',
       points INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS bins (
       id TEXT PRIMARY KEY, type TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL,
       address TEXT NOT NULL, area TEXT NOT NULL,
       capacity_liters REAL DEFAULT NULL, pto_rec TEXT DEFAULT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS reports (
       id TEXT PRIMARY KEY, code TEXT NOT NULL, user_id TEXT NOT NULL DEFAULT '',
       bin_id TEXT NOT NULL DEFAULT '', photo TEXT NOT NULL DEFAULT '',
       thumbnail TEXT NOT NULL DEFAULT '', lat REAL NOT NULL, lng REAL NOT NULL,
       address TEXT NOT NULL DEFAULT '', area TEXT NOT NULL DEFAULT '',
       container_type TEXT NOT NULL, incident_type TEXT NOT NULL,
       description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pendiente',
       priority TEXT NOT NULL, assignee TEXT NOT NULL DEFAULT '',
       resolution_note TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL,
       updated_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS comments (
       id TEXT PRIMARY KEY, report_id TEXT NOT NULL,
       author_role TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL
     )`,
    `CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_report ON comments(report_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bins_type ON bins(type)`,
    `CREATE INDEX IF NOT EXISTS idx_bins_lat ON bins(lat)`,
  ];
  for (const sql of statements) {
    await remote.execute(sql);
  }
  console.log('  ✓ Schema creado');
}

async function getCols(client, table) {
  const res = await client.execute(`PRAGMA table_info(${table})`);
  return res.rows.map(c => c.name);
}

async function migrateTable(table, batchSize = 100) {
  const cols = await getCols(local, table);
  const all = await (await local.execute(`SELECT * FROM ${table}`)).rows;

  if (all.length === 0) {
    console.log(`  ${table}: 0 filas`);
    return;
  }

  const colList = cols.join(',');
  let total = 0;

  for (let i = 0; i < all.length; i += batchSize) {
    const batch = all.slice(i, i + batchSize);
    const values = batch.map(row =>
      `(${cols.map(c => toVal(row[c])).join(',')})`
    ).join(',\n');
    const sql = `INSERT OR IGNORE INTO ${table} (${colList}) VALUES\n${values}`;
    await remote.execute(sql);
    total += batch.length;
    process.stdout.write(`\r  ${table}: ${total}/${all.length}`);
  }
  process.stdout.write('\n');
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n── Migrando esquema ──');
  await createSchema();

  console.log('\n── Migrando datos ──');
  const tables = ['users', 'bins', 'reports', 'comments'];
  for (const t of tables) {
    await migrateTable(t);
  }

  console.log('\n── Resumen ──');
  for (const t of tables) {
    const res = await remote.execute(`SELECT COUNT(*) AS n FROM ${t}`);
    const count = Number(res.rows[0]?.n ?? 0);
    console.log(`  ${t.padEnd(12)} ${count}`);
  }

  local.close();
  console.log('\n✅ Migración completada.');
}

main().catch(err => {
  console.error('\n❌ Error durante la migración:', err);
  process.exit(1);
});

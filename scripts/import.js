/**
 * EcoChicharro – Import real data from th_basura.db into ecochicharro.db
 *
 * Run once from the project root:
 *   node scripts/import.js
 *
 * What it does:
 *  1. Opens data/th_basura_v2.db (read-only) — real Ayuntamiento de Santa Cruz de Tenerife data (v2)
 *  2. Opens/creates data/ecochicharro.db — our app DB
 *  3. Creates/migrates schema
 *  4. Clears existing bins and reports (keeps María as default user)
 *  5. Imports 12,070 real containers as bins
 *  6. Imports 300 incidents as reports
 *  7. Imports 100 real users (with 'th-' id prefix)
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
const SRC_DB  = path.join(DATA_DIR, 'th_basura_v2.db');
const DST_DB  = path.join(DATA_DIR, 'ecochicharro.db');

if (!fs.existsSync(SRC_DB)) {
  console.error(`ERROR: source database not found at ${SRC_DB}`);
  console.error('Copy th_basura_v2.db into the data/ directory first.');
  process.exit(1);
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const src = new Database(SRC_DB, { readonly: true });
const dst = new Database(DST_DB);
dst.pragma('journal_mode = WAL');

// ── Schema ────────────────────────────────────────────────────────────────────

dst.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bins (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    address TEXT NOT NULL,
    area TEXT NOT NULL,
    capacity_liters REAL DEFAULT NULL,
    pto_rec TEXT DEFAULT NULL
  );
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT '',
    bin_id TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    thumbnail TEXT NOT NULL DEFAULT '',
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    area TEXT NOT NULL DEFAULT '',
    container_type TEXT NOT NULL,
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendiente',
    priority TEXT NOT NULL,
    assignee TEXT NOT NULL DEFAULT '',
    resolution_note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    author_role TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_report ON comments(report_id);
  CREATE INDEX IF NOT EXISTS idx_bins_type ON bins(type);
  CREATE INDEX IF NOT EXISTS idx_bins_lat ON bins(lat);
`);

// Migrate existing DBs
const binCols = dst.prepare('PRAGMA table_info(bins)').all().map(c => c.name);
if (!binCols.includes('capacity_liters')) dst.exec('ALTER TABLE bins ADD COLUMN capacity_liters REAL DEFAULT NULL');
if (!binCols.includes('pto_rec')) dst.exec('ALTER TABLE bins ADD COLUMN pto_rec TEXT DEFAULT NULL');

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTAINER_MAP = {
  papeleras: 'papelera',
  mixtos:    'mixto',
  papel:     'papel',
  vidrio:    'vidrio',
  envases:   'envases',
  ropa:      'ropa',
  aceite:    'aceite',
  electricos:'electrico',
};

const INCIDENT_MAP = {
  bloqueado: 'bloqueado',
  lleno:     'lleno',
  mal_olor:  'mal_olor',
  quemado:   'quemado',
  sucio:     'sucio',
  vertido:   'vertido',
  // fallback unknown → sucio
};

const STATUS_MAP = {
  abierta:    'pendiente',
  en_proceso: 'en_proceso',
  resuelta:   'resuelto',
};

const PRIORITY_MAP = {
  alta:  'alta',
  media: 'media',
  baja:  'baja',
};

/** Derive a rough neighbourhood from GPS coords */
function computeArea(lat, lng) {
  if (lat > 28.490) return 'Anaga';
  if (lat > 28.478 && lng > -16.240) return 'El Sobradillo';
  if (lat > 28.478) return 'Salud';
  if (lat > 28.472 && lng > -16.250) return 'Rambla';
  if (lat > 28.468 && lng > -16.248) return 'Weyler';
  if (lat > 28.465 && lng > -16.252) return 'Centro';
  if (lng < -16.268) return 'La Salle';
  if (lat < 28.458) return 'Ofra';
  return 'Centro';
}

// ── Default user María (must always exist) ────────────────────────────────────

const DEFAULT_USER_ID = 'user-maria';
const DAY = 86400000;

const hasMaría = dst.prepare('SELECT 1 FROM users WHERE id = ?').get(DEFAULT_USER_ID);
if (!hasMaría) {
  dst.prepare('INSERT INTO users (id, username, display_name, created_at) VALUES (?,?,?,?)')
     .run(DEFAULT_USER_ID, 'maria', 'María Domínguez', Date.now() - 120 * DAY);
}

// ── Clear previous imported data (keep user-maria and her reports) ─────────────

console.log('🗑  Clearing old imported data…');
dst.exec(`
  DELETE FROM reports WHERE user_id != '${DEFAULT_USER_ID}' OR user_id = '';
  DELETE FROM bins WHERE id NOT LIKE 'bin-%';
  DELETE FROM users WHERE id LIKE 'th-%';
`);

// ── Import users ──────────────────────────────────────────────────────────────

// Ensure users table has barrio and points columns (migration)
const userCols = dst.prepare('PRAGMA table_info(users)').all().map(c => c.name);
if (!userCols.includes('barrio')) dst.exec("ALTER TABLE users ADD COLUMN barrio TEXT NOT NULL DEFAULT ''");
if (!userCols.includes('points')) dst.exec('ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0');

console.log('👥  Importing users…');
const srcUsers = src.prepare('SELECT * FROM users').all();
const insertUser = dst.prepare(
  'INSERT OR IGNORE INTO users (id, username, display_name, barrio, points, created_at) VALUES (?,?,?,?,?,?)'
);
const importUsers = dst.transaction((users) => {
  for (const u of users) {
    const username = (u.nombre[0] + u.apellido).toLowerCase().replace(/[^a-z0-9]/g, '');
    const displayName = `${u.nombre} ${u.apellido}`;
    const barrio = u.barrio || '';
    const points = u.puntos ?? 0;
    const createdAt = u.created_at ? new Date(u.created_at).getTime() : Date.now() - 30 * DAY;
    insertUser.run(`th-${u.user_id}`, username || `user${u.user_id}`, displayName, barrio, points, createdAt);
  }
});
importUsers(srcUsers);
console.log(`   ✓ ${srcUsers.length} users imported (con barrio y puntos)`);

// ── Import bins (containers) ──────────────────────────────────────────────────

console.log('📦  Importing containers…');
const srcBins = src.prepare('SELECT * FROM recycling_containers').all();
const insertBin = dst.prepare(
  'INSERT OR IGNORE INTO bins (id, type, lat, lng, address, area, capacity_liters, pto_rec) VALUES (?,?,?,?,?,?,?,?)'
);
const importBins = dst.transaction((bins) => {
  for (const b of bins) {
    const type = CONTAINER_MAP[b.tipo_cont] || 'mixto';
    const lat = parseFloat(b.GRAD_Y);
    const lng = parseFloat(b.GRAD_X);
    if (!isFinite(lat) || !isFinite(lng)) continue;
    const address = b.TEXTO || 'Sin dirección';
    const area = computeArea(lat, lng);
    const capacity = b.CAPACIDAD ? parseFloat(b.CAPACIDAD) : null;
    const ptoRec = b.PTO_REC || null;
    insertBin.run(`th-${b.id}`, type, lat, lng, address, area, capacity, ptoRec);
  }
});
importBins(srcBins);
const binCount = dst.prepare("SELECT COUNT(*) n FROM bins WHERE id LIKE 'th-%'").get().n;
console.log(`   ✓ ${binCount} containers imported`);

// ── Import incidents as reports ───────────────────────────────────────────────

console.log('🚨  Importing incidents…');
const srcIncidents = src.prepare(`
  SELECT i.*, c.GRAD_X, c.GRAD_Y, c.TEXTO, c.tipo_cont, c.CAPACIDAD, c.PTO_REC
  FROM incidents i
  LEFT JOIN recycling_containers c ON c.id = i.contenedor_id
`).all();

const insertReport = dst.prepare(`
  INSERT OR IGNORE INTO reports
    (id, code, user_id, bin_id, photo, thumbnail, lat, lng, address, area,
     container_type, incident_type, description, status, priority, assignee,
     resolution_note, created_at, updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

const importReports = dst.transaction((incidents) => {
  let n = 0;
  for (const inc of incidents) {
    const lat = parseFloat(inc.GRAD_Y);
    const lng = parseFloat(inc.GRAD_X);
    if (!isFinite(lat) || !isFinite(lng)) continue;

    const incidentType = INCIDENT_MAP[inc.tipo_incidencia] || 'sucio';
    const containerType = CONTAINER_MAP[inc.tipo_cont] || 'mixto';
    const status = STATUS_MAP[inc.estado] || 'pendiente';
    const priority = PRIORITY_MAP[inc.urgencia] || 'media';
    const area = computeArea(lat, lng);
    const address = inc.TEXTO || 'Sin dirección';
    const userId = `th-${inc.user_id}`;
    const binId = `th-${inc.contenedor_id}`;
    const createdAt = inc.created_at ? new Date(inc.created_at).getTime() : Date.now() - 7 * DAY;
    const updatedAt = inc.resolved_at ? new Date(inc.resolved_at).getTime() : (status !== 'pendiente' ? createdAt + DAY : createdAt);
    const code = `R-TH-${inc.incident_id}`;
    const description = inc.descripcion && inc.descripcion !== 'Incidencia generada automáticamente' ? inc.descripcion : '';

    insertReport.run(
      randomUUID(), code, userId, binId, '', '', lat, lng, address, area,
      containerType, incidentType, description, status, priority, '', '', createdAt, updatedAt
    );
    n++;
  }
  return n;
});
const imported = importReports(srcIncidents);
console.log(`   ✓ ${imported} incidents imported as reports`);

// ── Summary ───────────────────────────────────────────────────────────────────

const totals = {
  bins:    dst.prepare('SELECT COUNT(*) n FROM bins').get().n,
  reports: dst.prepare('SELECT COUNT(*) n FROM reports').get().n,
  users:   dst.prepare('SELECT COUNT(*) n FROM users').get().n,
};

console.log('\n✅  Import complete!');
console.log(`   Total bins    : ${totals.bins.toLocaleString()}`);
console.log(`   Total reports : ${totals.reports.toLocaleString()}`);
console.log(`   Total users   : ${totals.users.toLocaleString()}`);
console.log('\nRestart the dev server to see the real data.');

src.close();
dst.close();

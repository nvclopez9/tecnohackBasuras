/**
 * Migrate local SQLite data → Turso (remote libSQL)
 *
 * NOTE: ecochicharro.db is corrupt (SQLITE_CORRUPT) so we extract data
 * from raw bytes using ASCII string scanning + regex.
 *
 * SQLite schema detected:
 *   recycling_containers (id INTEGER PK AUTO, CAPACIDAD TEXT, GRAD_X TEXT, GRAD_Y TEXT, tipo_cont TEXT)
 *   incidents (incident_id, contenedor_id, user_id, tipo_incidencia, descripcion, urgencia, estado, created_at, resolved_at)
 *   users (user_id INTEGER PK AUTO, nombre, apellido, barrio, puntos, created_at)
 *
 * Turso schema (from db.ts):
 *   bins (id TEXT PK, type, lat, lng, address, area, capacity_liters, pto_rec)
 *   users (id TEXT PK, username, display_name, barrio, points, created_at)
 *   reports (id, code, user_id, bin_id, photo, thumbnail, lat, lng, address, area,
 *            container_type, incident_type, description, status, priority, assignee,
 *            resolution_note, created_at, updated_at)
 *   comments (id, report_id, author_role, text, created_at)
 *
 * Run from project root:  node scripts/migrate-to-turso.js
 */
'use strict';

const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// ── Load .env.local manually ──────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('ERROR: Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local');
  process.exit(1);
}

// ── Connect to Turso ──────────────────────────────────────────────────────────
const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// ── Extract recycling_containers from corrupt SQLite using raw bytes ───────────
const SQLITE_PATH = 'C:\\Users\\reva3\\Desktop\\ecochicharro.db';

// Map SQLite tipo_cont values → Turso type values
const TIPO_MAP = {
  'vidrio':    'vidrio',
  'papel':     'papel',
  'envases':   'envases',
  'ropa':      'ropa',
  'aceite':    'aceite',
  'mixtos':    'mixto',
  'papeleras': 'mixto',
  'electricos':'electrico',
};

function extractContainersFromRaw() {
  console.log(`Reading SQLite file: ${SQLITE_PATH}`);
  const raw = fs.readFileSync(SQLITE_PATH);
  console.log(`File size: ${raw.length} bytes`);

  // Collect ASCII printable strings of length >= 4
  const strings = [];
  let start = -1;
  for (let i = 0; i < raw.length; i++) {
    const b = raw[i];
    if (b >= 0x20 && b <= 0x7e) {
      if (start < 0) start = i;
    } else {
      if (start >= 0 && i - start >= 4) {
        strings.push(raw.toString('ascii', start, i));
      }
      start = -1;
    }
  }
  if (start >= 0 && raw.length - start >= 4) {
    strings.push(raw.toString('ascii', start, raw.length));
  }

  // Pattern in raw pages: (capacity)(-16.xxxxxx)(28.xxxxxx)(tipo_cont)
  // e.g. "2500.0-16.246956003528.5430612282vidrio"
  // GRAD_X = longitude (-16.xxx), GRAD_Y = latitude (28.xxx)
  const pattern = /(\d+(?:\.\d+)?)(-16\.\d{6,})(28\.\d{6,})(\w+)/g;

  const seen = new Set();
  const containers = [];

  for (const str of strings) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(str)) !== null) {
      const [, capStr, lngStr, latStr, tipoRaw] = m;
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const cap = parseFloat(capStr);

      // Validate Tenerife bounding box
      if (lat < 27.5 || lat > 29.0 || lng < -17.5 || lng > -15.5) continue;

      // Normalize tipo: strip trailing digits/garbage
      const tipoClean = tipoRaw.replace(/\d+$/, '').toLowerCase();
      const type = TIPO_MAP[tipoClean];
      if (!type) continue;

      // Dedup by lat+lng (8 decimal places)
      const key = `${lat.toFixed(8)},${lng.toFixed(8)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      containers.push({ lat, lng, capacity: cap, type });
    }
  }

  return containers;
}

// ── Generate a stable, unique ID from type + coordinates ──────────────────────
function makeBinId(type, lat, lng) {
  const latInt = Math.round(Math.abs(lat) * 1e6);
  const lngInt = Math.round(Math.abs(lng) * 1e6);
  const hash = (latInt * 10000000 + lngInt % 10000000).toString(36);
  return `rc-${type.slice(0, 3)}-${hash}`;
}

// ── Main migration ─────────────────────────────────────────────────────────────
async function main() {
  const BATCH_SIZE = 50;

  // 1. Extract containers
  const containers = extractContainersFromRaw();
  console.log(`Extracted ${containers.length} unique containers from SQLite raw bytes`);
  const byType = {};
  for (const c of containers) byType[c.type] = (byType[c.type] || 0) + 1;
  console.log('By type:', JSON.stringify(byType));

  // 2. Insert bins into Turso
  console.log(`\nInserting bins into Turso in batches of ${BATCH_SIZE}...`);
  let insertedBins = 0;
  let errorsBins = 0;

  for (let i = 0; i < containers.length; i += BATCH_SIZE) {
    const batch = containers.slice(i, i + BATCH_SIZE);
    const stmts = batch.map(c => ({
      sql: `INSERT OR IGNORE INTO bins (id, type, lat, lng, address, area, capacity_liters, pto_rec)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [makeBinId(c.type, c.lat, c.lng), c.type, c.lat, c.lng, '', '', c.capacity, null],
    }));

    try {
      const results = await client.batch(stmts, 'write');
      for (const r of results) insertedBins += (r.rowsAffected || 0);
    } catch (batchErr) {
      // Fall back to row-by-row
      for (const stmt of stmts) {
        try {
          const r = await client.execute(stmt);
          insertedBins += (r.rowsAffected || 0);
        } catch {
          errorsBins++;
        }
      }
    }

    if (i % (BATCH_SIZE * 20) === 0) {
      process.stdout.write(`  Progress: ${Math.min(i + BATCH_SIZE, containers.length)}/${containers.length}\r`);
    }
  }
  console.log(`  Progress: ${containers.length}/${containers.length}`);

  // 3. Print summary
  console.log('\n=== MIGRATION RESULTS ===');
  console.log(`SQLite containers extracted:   ${containers.length}`);
  console.log(`Bins newly inserted in Turso:  ${insertedBins}`);
  console.log(`Rows with errors (skipped):    ${errorsBins}`);
  console.log(`Already existed (INSERT IGNORE):${containers.length - insertedBins - errorsBins}`);

  // 4. Current Turso counts
  console.log('\n=== TURSO TABLE COUNTS (after migration) ===');
  for (const table of ['bins', 'users', 'reports', 'comments']) {
    try {
      const res = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
      console.log(`  ${table.padEnd(12)} ${Number(res.rows[0]?.n ?? 0)}`);
    } catch (e) {
      console.log(`  ${table.padEnd(12)} ERROR: ${e.message}`);
    }
  }

  await client.close();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

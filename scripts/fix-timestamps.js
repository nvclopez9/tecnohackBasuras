// Reescribe los timestamps de los reportes del día 17 en adelante
// con fechas pasadas (últimos 14 días) y distribución horaria realista.
// Picos locales: 08-10, 13-15, 20-22 (Hora Canaria = UTC+1 en mayo).

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// ── Leer .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 0) continue;
  const key = t.slice(0, eq).trim();
  let val = t.slice(eq + 1).trim();
  if ((val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
  env[key] = val;
}

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

// ── Distribución horaria ──────────────────────────────────────────────────────
// Pesos por hora LOCAL (UTC+1). Los picos están en 08-10, 13-15 y 20-22.
const HOUR_WEIGHTS = [
  0.4, 0.2, 0.2, 0.1, 0.1, 0.3,   // 00-05 (madrugada, muy bajo)
  1.5, 2.5,                          // 06-07 (mañana temprana)
  6.0, 7.0,                          // 08-09 ★ PICO MAÑANA
  4.0, 3.5, 3.0,                     // 10-12 (media mañana)
  6.5, 7.0,                          // 13-14 ★ PICO MEDIODÍA
  3.0, 2.0, 2.0,                     // 15-17 (tarde baja)
  3.5, 4.5,                          // 18-19 (tarde alta)
  6.5, 7.0,                          // 20-21 ★ PICO NOCHE
  3.5, 2.5,                          // 22-23 (noche media)
];
const TOTAL_W = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);

function randomLocalHour() {
  let r = Math.random() * TOTAL_W;
  for (let h = 0; h < 24; h++) {
    r -= HOUR_WEIGHTS[h];
    if (r <= 0) return h;
  }
  return 9;
}

// Convierte hora local Canaria (UTC+1 en mayo) → UTC restando 1h
function localHourToUtcMs(daysAgo, localHour) {
  const utcHour = (localHour - 1 + 24) % 24;           // UTC = local - 1
  const base = Date.now() - daysAgo * 86_400_000;
  const dayStart = base - (base % 86_400_000);          // inicio del día UTC
  return dayStart + utcHour * 3_600_000 + Math.floor(Math.random() * 3_600_000);
}

function randomPastTs(maxDaysAgo = 13) {
  const daysAgo = Math.floor(Math.random() * maxDaysAgo) + 1; // mín 1 día atrás
  return localHourToUtcMs(daysAgo, randomLocalHour());
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Redistribuir TODOS los reportes — los 307 de la migración quedaron
  // todos a las 15h local (migration corrió a las 14:xx UTC del día 17).
  const { rows } = await client.execute(
    'SELECT id FROM reports ORDER BY rowid'
  );

  console.log(`\nTotal reportes a redistribuir: ${rows.length}`);

  let ok = 0;
  for (const row of rows) {
    const newCat = randomPastTs(13);   // entre hoy-1 y hoy-13
    const newUat = newCat + Math.floor(Math.random() * 3 * 3_600_000); // 0-3h después
    await client.execute({
      sql: 'UPDATE reports SET created_at = ?, updated_at = ? WHERE id = ?',
      args: [newCat, newUat, row.id],
    });
    ok++;
    if (ok % 25 === 0) process.stdout.write(`  ${ok}/${rows.length}...\n`);
  }
  console.log(`\n✓ ${ok} reportes actualizados.\n`);

  // ── Mostrar distribución final ────────────────────────────────────────────
  const all = await client.execute('SELECT created_at FROM reports');
  const counts = new Array(24).fill(0);
  for (const r of all.rows) {
    // Convertir UTC → hora local Canaria (UTC+1)
    const localH = (new Date(Number(r.created_at)).getUTCHours() + 1) % 24;
    counts[localH]++;
  }
  const maxC = Math.max(...counts);
  console.log('Distribución horaria local (hora canaria):');
  const peaks = [8, 9, 13, 14, 20, 21];
  for (let h = 0; h < 24; h++) {
    const bar = '█'.repeat(Math.round(counts[h] / maxC * 30));
    const flag = peaks.includes(h) ? ' ★' : '';
    console.log(`  ${String(h).padStart(2, '0')}h  ${bar.padEnd(30)} ${counts[h]}${flag}`);
  }
  console.log('\nTotal reportes en BD:', all.rows.length);
}

main().catch(err => { console.error(err); process.exit(1); });

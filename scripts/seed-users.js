/**
 * Seed 30 artificial users per barrio into ecochicharro.db
 *
 * Run from project root:
 *   node scripts/seed-users.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'ecochicharro.db');

if (!fs.existsSync(DB_PATH)) {
  console.error(`ERROR: database not found at ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH);

const BARRIOS = [
  'Añaza',
  'Barranco Grande',
  'Barrio Salamanca',
  'Cabo-Llanos',
  'Centro',
  'Chamberí',
  'El Sobradillo',
  'El Toscal',
  'La Salle',
  'Los Gladiolos',
  'Ofra',
  'Santa María del Mar',
  'Taganana',
  'Tincer',
  'Valleseco',
];

const FIRST_NAMES = [
  'Alejandro', 'Alejandra', 'Antonio', 'Ana', 'Alberto', 'Andrea',
  'Álvaro', 'Ángela', 'Beatriz', 'Borja', 'Carlos', 'Carmen',
  'Cristian', 'Cristina', 'Daniel', 'Diana', 'David', 'Dolores',
  'Diego', 'Elena', 'Eduardo', 'Esther', 'Enrique', 'Eva',
  'Fernando', 'Fatima', 'Francisco', 'Gabriela', 'Gabriel', 'Gloria',
  'Héctor', 'Helena', 'Hugo', 'Irene', 'Ignacio', 'Isabel',
  'Iván', 'Julia', 'Javier', 'Juana', 'Jorge', 'Laura',
  'José', 'Lidia', 'Juan', 'Lorena', 'Jesús', 'Lucía',
  'Luis', 'María', 'Manuel', 'Marta', 'Miguel', 'Mónica',
  'Nicolás', 'Nerea', 'Óscar', 'Olga', 'Pablo', 'Patricia',
  'Pedro', 'Paula', 'Rafael', 'Raquel', 'Ramón', 'Rocío',
  'Raúl', 'Sandra', 'Roberto', 'Sara', 'Rubén', 'Silvia',
  'Santiago', 'Sofía', 'Sergio', 'Teresa', 'Samuel', 'Valeria',
  'Víctor', 'Vanesa', 'Vicente', 'Yolanda',
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'Hernández', 'López',
  'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Morales', 'Jiménez', 'Reyes',
  'Cruz', 'Ortiz', 'Moreno', 'Álvarez', 'Romero',
  'Navarro', 'Díaz', 'Castillo', 'Serrano', 'Molina',
  'Delgado', 'Gil', 'Santos', 'Ortega', 'Peña',
  'Vega', 'Marín', 'Campos', 'Suárez', 'Méndez',
  'Cabrera', 'Vargas', 'Gallego', 'Prieto', 'Cano',
  'Aguilar', 'Cortés', 'Benítez', 'Rivas', 'Santiago',
  'Calderón', 'Lara', 'Medina', 'Quintana', 'Arias',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack) {
  const now = Date.now();
  return now - randomInt(0, daysBack * 86400000);
}

function randomPick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateNamePairs(count) {
  const used = new Set();
  const names = [];
  while (names.length < count) {
    const first = randomPick(FIRST_NAMES);
    const last = randomPick(LAST_NAMES);
    const key = `${first}-${last}`;
    if (!used.has(key)) {
      used.add(key);
      names.push({ first, last });
    }
  }
  return names;
}

let userIndex = 0;
const insert = db.prepare(
  'INSERT OR IGNORE INTO users (id, username, display_name, barrio, points, created_at) VALUES (?,?,?,?,?,?)'
);

const seed = db.transaction(() => {
  let total = 0;
  const existing = new Set(
    db.prepare('SELECT username FROM users').all().map(r => r.username)
  );

  for (const barrio of BARRIOS) {
    const names = generateNamePairs(30);
    for (const { first, last } of names) {
      userIndex++;
      const id = `art-${userIndex}`;
      let username = (first[0] + last).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (existing.has(username)) {
        username = `${username}${userIndex}`;
      }
      const displayName = `${first} ${last}`;
      const points = randomInt(0, 2500);
      const createdAt = randomDate(180);
      insert.run(id, username, displayName, barrio, points, createdAt);
      existing.add(username);
      total++;
    }
  }
  return total;
});

const inserted = seed();
console.log(`✓ ${inserted} usuarios insertados (${BARRIOS.length} barrios × 30)`);

const totals = db.prepare('SELECT barrio, COUNT(*) n FROM users GROUP BY barrio ORDER BY n DESC').all();
console.log('\nDistribución por barrio:');
totals.forEach(t => console.log(`  ${t.barrio.padEnd(22)} ${t.n}`));

console.log(`\nTotal de usuarios en DB: ${db.prepare('SELECT COUNT(*) n FROM users').get().n}`);

db.close();

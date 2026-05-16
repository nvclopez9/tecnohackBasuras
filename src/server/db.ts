import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  Report,
  Comment,
  Bin,
  User,
  ContainerType,
  IncidentType,
  ReportStatus,
  Priority,
  Role,
} from '@/types';
import { CONTAINERS } from '@/lib/constants';
import { priorityFor } from '@/lib/priority';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'ecochicharro.db');

export const DEFAULT_USER_ID = 'user-maria';

let db: Database.Database | null = null;

function getDB(): Database.Database {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      barrio TEXT NOT NULL DEFAULT '',
      points INTEGER NOT NULL DEFAULT 0,
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
  const binCols: string[] = (db.prepare('PRAGMA table_info(bins)').all() as { name: string }[]).map(c => c.name);
  if (!binCols.includes('capacity_liters')) db.exec('ALTER TABLE bins ADD COLUMN capacity_liters REAL DEFAULT NULL');
  if (!binCols.includes('pto_rec')) db.exec('ALTER TABLE bins ADD COLUMN pto_rec TEXT DEFAULT NULL');
  const userCols: string[] = (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map(c => c.name);
  if (!userCols.includes('barrio')) db.exec("ALTER TABLE users ADD COLUMN barrio TEXT NOT NULL DEFAULT ''");
  if (!userCols.includes('points')) db.exec('ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0');
  seedDatabase(db);
  return db;
}

// ---------- seed ----------
const DAY = 86400000;

function seedDatabase(conn: Database.Database) {
  const userCount = (conn.prepare('SELECT COUNT(*) n FROM users').get() as { n: number }).n;
  if (userCount === 0) {
    conn.prepare(
      'INSERT INTO users (id, username, display_name, barrio, points, created_at) VALUES (?,?,?,?,?,?)'
    ).run(DEFAULT_USER_ID, 'maria', 'María Domínguez', 'Centro', 1820, Date.now() - 120 * DAY);
  } else {
    // Ensure María always has her barrio and points set (migration from old seed)
    conn.prepare(
      "UPDATE users SET barrio='Centro', points=1820 WHERE id=? AND (barrio='' OR points=0)"
    ).run(DEFAULT_USER_ID);
  }

  const binCount = (conn.prepare('SELECT COUNT(*) n FROM bins').get() as { n: number }).n;
  if (binCount === 0) {
    const insertBin = conn.prepare(
      'INSERT INTO bins (id, type, lat, lng, address, area, capacity_liters, pto_rec) VALUES (?,?,?,?,?,?,?,?)'
    );
    SEED_BINS.forEach(b => insertBin.run(b.id, b.type, b.lat, b.lng, b.address, b.area, b.capacityLiters ?? null, b.ptoRec ?? null));
  }

  const reportCount = (conn.prepare('SELECT COUNT(*) n FROM reports').get() as { n: number }).n;
  if (reportCount === 0) {
    const insertReport = conn.prepare(`
      INSERT INTO reports
        (id, code, user_id, bin_id, photo, thumbnail, lat, lng, address, area,
         container_type, incident_type, description, status, priority, assignee,
         resolution_note, created_at, updated_at)
      VALUES (@id,@code,@userId,@binId,@photo,@thumbnail,@lat,@lng,@address,@area,
         @containerType,@incidentType,@description,@status,@priority,@assignee,
         @resolutionNote,@createdAt,@updatedAt)
    `);
    SEED_REPORTS.forEach(r => insertReport.run(r));

    const insertComment = conn.prepare(
      'INSERT INTO comments (id, report_id, author_role, text, created_at) VALUES (?,?,?,?,?)'
    );
    SEED_COMMENTS.forEach(c =>
      insertComment.run(randomUUID(), c.reportId, c.authorRole, c.text, c.createdAt)
    );
  }
}

const SEED_BINS: Bin[] = [
  { id: 'bin-organico', type: 'organico', lat: 28.4690, lng: -16.2520, address: 'Calle del Castillo, 47', area: 'Centro', capacityLiters: 240, ptoRec: null },
  { id: 'bin-envases', type: 'envases', lat: 28.4677, lng: -16.2511, address: 'Plaza de España', area: 'Centro', capacityLiters: 120, ptoRec: null },
  { id: 'bin-papel', type: 'papel', lat: 28.4725, lng: -16.2575, address: 'Rambla de Santa Cruz, 120', area: 'Salud', capacityLiters: 360, ptoRec: null },
  { id: 'bin-vidrio', type: 'vidrio', lat: 28.4701, lng: -16.2535, address: 'Plaza del Príncipe', area: 'Centro', capacityLiters: 1000, ptoRec: null },
  { id: 'bin-resto', type: 'resto', lat: 28.4625, lng: -16.2565, address: 'Avenida Tres de Mayo, 12', area: 'Cabo', capacityLiters: 1100, ptoRec: null },
  { id: 'bin-ropa', type: 'ropa', lat: 28.4705, lng: -16.2485, address: 'Avenida de Anaga, 22', area: 'Anaga', capacityLiters: 500, ptoRec: null },
  { id: 'bin-aceite', type: 'aceite', lat: 28.4660, lng: -16.2525, address: 'Calle San Sebastián, 75', area: 'Salud', capacityLiters: 120, ptoRec: null },
  { id: 'bin-baterias', type: 'baterias', lat: 28.4728, lng: -16.2548, address: 'Parque García Sanabria', area: 'Centro', capacityLiters: 60, ptoRec: null },
];

interface SeedReportInput {
  code: string; binId: string; lat: number; lng: number; address: string; area: string;
  containerType: ContainerType; incidentType: IncidentType; status: ReportStatus;
  description: string; assignee: string; resolutionNote: string; ageDays: number;
}

const SEED_DEFS: SeedReportInput[] = [
  { code: 'R-2845', binId: 'bin-envases', lat: 28.4679, lng: -16.2513, address: 'Calle Castillo, 47', area: 'Centro', containerType: 'envases', incidentType: 'lleno', status: 'pendiente', description: 'Lleva dos días desbordado.', assignee: '', resolutionNote: '', ageDays: 0.4 },
  { code: 'R-2844', binId: 'bin-organico', lat: 28.4706, lng: -16.2487, address: 'Av. de Anaga, 22', area: 'Anaga', containerType: 'organico', incidentType: 'roto', status: 'en_proceso', description: 'Tapa rota, no cierra.', assignee: 'Equipo Anaga', resolutionNote: '', ageDays: 0.9 },
  { code: 'R-2843', binId: 'bin-vidrio', lat: 28.4700, lng: -16.2536, address: 'Rambla 25 de Julio, 8', area: 'Salud', containerType: 'vidrio', incidentType: 'sucio', status: 'resuelto', description: 'Cristales rotos alrededor.', assignee: 'Equipo Salud-Ofra', resolutionNote: 'Zona limpiada y desinfectada por el Equipo Salud-Ofra. Gracias por avisar.', ageDays: 2.1 },
  { code: 'R-2842', binId: 'bin-papel', lat: 28.4724, lng: -16.2573, address: 'Plaza del Príncipe', area: 'Centro', containerType: 'papel', incidentType: 'lleno', status: 'pendiente', description: '', assignee: '', resolutionNote: '', ageDays: 2.6 },
  { code: 'R-2841', binId: 'bin-baterias', lat: 28.4729, lng: -16.2549, address: 'Av. Tres de Mayo, 12', area: 'Cabo', containerType: 'baterias', incidentType: 'quemado', status: 'en_proceso', description: 'Contenedor quemado durante la noche.', assignee: 'Recogida especial', resolutionNote: '', ageDays: 3.0 },
  { code: 'R-2840', binId: 'bin-resto', lat: 28.4627, lng: -16.2567, address: 'C/ Imeldo Serís, 31', area: 'Centro', containerType: 'resto', incidentType: 'desaparecido', status: 'pendiente', description: 'El contenedor ya no está.', assignee: '', resolutionNote: '', ageDays: 3.4 },
  { code: 'R-2839', binId: 'bin-envases', lat: 28.4711, lng: -16.2502, address: 'Pza. Weyler, 4', area: 'Centro', containerType: 'envases', incidentType: 'roto', status: 'resuelto', description: 'Rueda rota.', assignee: 'Equipo Centro', resolutionNote: 'Se ha sustituido la rueda. Contenedor operativo.', ageDays: 4.2 },
  { code: 'R-2838', binId: 'bin-aceite', lat: 28.4662, lng: -16.2527, address: 'C/ San Sebastián, 75', area: 'Salud', containerType: 'aceite', incidentType: 'lleno', status: 'pendiente', description: '', assignee: '', resolutionNote: '', ageDays: 4.6 },
  { code: 'R-2837', binId: 'bin-ropa', lat: 28.4640, lng: -16.2560, address: 'Av. de la Constitución, 5', area: 'Cabo', containerType: 'ropa', incidentType: 'lleno', status: 'pendiente', description: 'No entra más ropa.', assignee: '', resolutionNote: '', ageDays: 5.1 },
  { code: 'R-2836', binId: 'bin-papel', lat: 28.4688, lng: -16.2518, address: 'C/ El Pilar, 19', area: 'Centro', containerType: 'papel', incidentType: 'sucio', status: 'resuelto', description: '', assignee: 'Equipo Centro', resolutionNote: 'Limpieza realizada.', ageDays: 6.3 },
  { code: 'R-2835', binId: 'bin-organico', lat: 28.4668, lng: -16.2540, address: 'C/ Galcerán, 33', area: 'Salud', containerType: 'organico', incidentType: 'desaparecido', status: 'en_proceso', description: 'Falta desde hace días.', assignee: 'Equipo Salud-Ofra', resolutionNote: '', ageDays: 7.0 },
  { code: 'R-2834', binId: 'bin-vidrio', lat: 28.4676, lng: -16.2509, address: 'Plaza de España', area: 'Centro', containerType: 'vidrio', incidentType: 'quemado', status: 'pendiente', description: 'Vandalizado.', assignee: '', resolutionNote: '', ageDays: 8.4 },
];

const SEED_REPORTS = SEED_DEFS.map(d => {
  const created = Date.now() - d.ageDays * DAY;
  return {
    id: randomUUID(),
    code: d.code,
    userId: DEFAULT_USER_ID,
    binId: d.binId,
    photo: '',
    thumbnail: '',
    lat: d.lat,
    lng: d.lng,
    address: d.address,
    area: d.area,
    containerType: d.containerType,
    incidentType: d.incidentType,
    description: d.description,
    status: d.status,
    priority: priorityFor(d.incidentType),
    assignee: d.assignee,
    resolutionNote: d.resolutionNote,
    createdAt: created,
    updatedAt: d.status === 'pendiente' ? created : created + 0.5 * DAY,
  };
});

const SEED_COMMENTS: { reportId: string; authorRole: Role; text: string; createdAt: number }[] = (() => {
  const byCode = (code: string) => SEED_REPORTS.find(r => r.code === code);
  const out: { reportId: string; authorRole: Role; text: string; createdAt: number }[] = [];
  const r43 = byCode('R-2843');
  if (r43) {
    out.push({ reportId: r43.id, authorRole: 'municipal', text: 'Recibido. Lo asignamos al Equipo Salud-Ofra.', createdAt: r43.createdAt + 0.3 * DAY });
    out.push({ reportId: r43.id, authorRole: 'municipal', text: 'Zona limpiada y desinfectada. Cerramos la incidencia.', createdAt: r43.createdAt + 1.8 * DAY });
  }
  const r41 = byCode('R-2841');
  if (r41) {
    out.push({ reportId: r41.id, authorRole: 'municipal', text: 'En proceso, contenedor de baterías priorizado por seguridad.', createdAt: r41.createdAt + 0.4 * DAY });
  }
  return out;
})();

// ---------- mappers ----------
interface ReportRow {
  id: string; code: string; user_id: string; bin_id: string;
  photo: string; thumbnail: string; lat: number; lng: number;
  address: string; area: string; container_type: string; incident_type: string;
  description: string; status: string; priority: string; assignee: string;
  resolution_note: string; created_at: number; updated_at: number;
}

function rowToReport(r: ReportRow): Report {
  return {
    id: r.id,
    code: r.code,
    userId: r.user_id,
    binId: r.bin_id,
    photo: r.photo,
    thumbnail: r.thumbnail,
    lat: r.lat,
    lng: r.lng,
    address: r.address,
    area: r.area,
    containerType: r.container_type as ContainerType,
    incidentType: r.incident_type as IncidentType,
    description: r.description,
    status: r.status as ReportStatus,
    priority: r.priority as Priority,
    assignee: r.assignee,
    resolutionNote: r.resolution_note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ---------- reports ----------
export interface ReportFilters {
  status?: string;
  containerType?: string;
  incidentType?: string;
  priority?: string;
  area?: string;
  userId?: string;
  ids?: string[];
}

export function listReports(filters: ReportFilters = {}): Report[] {
  const conn = getDB();
  const where: string[] = [];
  const params: unknown[] = [];

  const addEq = (col: string, val?: string) => {
    if (val) { where.push(`${col} = ?`); params.push(val); }
  };
  addEq('status', filters.status);
  addEq('container_type', filters.containerType);
  addEq('incident_type', filters.incidentType);
  addEq('priority', filters.priority);
  addEq('area', filters.area);
  addEq('user_id', filters.userId);

  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    where.push(`id IN (${filters.ids.map(() => '?').join(',')})`);
    params.push(...filters.ids);
  }

  const sql =
    'SELECT * FROM reports' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY created_at DESC';
  return (conn.prepare(sql).all(...params) as ReportRow[]).map(rowToReport);
}

export function getReport(id: string): Report | null {
  const conn = getDB();
  const row = conn.prepare('SELECT * FROM reports WHERE id = ?').get(id) as ReportRow | undefined;
  return row ? rowToReport(row) : null;
}

let codeCounter = 0;
function nextCode(conn: Database.Database): string {
  if (codeCounter === 0) {
    const max = conn.prepare("SELECT code FROM reports ORDER BY created_at DESC LIMIT 1").get() as { code: string } | undefined;
    const parsed = max ? parseInt(max.code.replace(/\D/g, ''), 10) : 2845;
    codeCounter = Number.isFinite(parsed) ? parsed : 2845;
  }
  codeCounter += 1;
  return `R-${codeCounter}`;
}

export interface NewReportInput {
  userId: string;
  binId: string;
  photo: string;
  thumbnail: string;
  lat: number;
  lng: number;
  address: string;
  area: string;
  containerType: ContainerType;
  incidentType: IncidentType;
  description: string;
}

export function insertReport(input: NewReportInput): Report {
  const conn = getDB();
  const now = Date.now();
  const report: Report = {
    id: randomUUID(),
    code: nextCode(conn),
    userId: input.userId,
    binId: input.binId,
    photo: input.photo,
    thumbnail: input.thumbnail,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    area: input.area,
    containerType: input.containerType,
    incidentType: input.incidentType,
    description: input.description,
    status: 'pendiente',
    priority: priorityFor(input.incidentType),
    assignee: '',
    resolutionNote: '',
    createdAt: now,
    updatedAt: now,
  };
  conn.prepare(`
    INSERT INTO reports
      (id, code, user_id, bin_id, photo, thumbnail, lat, lng, address, area,
       container_type, incident_type, description, status, priority, assignee,
       resolution_note, created_at, updated_at)
    VALUES (@id,@code,@userId,@binId,@photo,@thumbnail,@lat,@lng,@address,@area,
       @containerType,@incidentType,@description,@status,@priority,@assignee,
       @resolutionNote,@createdAt,@updatedAt)
  `).run(report);
  return report;
}

export interface ReportChanges {
  status?: ReportStatus;
  assignee?: string;
  resolutionNote?: string;
  containerType?: ContainerType;
  incidentType?: IncidentType;
  description?: string;
}

export function updateReport(id: string, changes: ReportChanges): Report | null {
  const conn = getDB();
  const existing = getReport(id);
  if (!existing) return null;

  const incidentType = changes.incidentType ?? existing.incidentType;
  const priority = changes.incidentType ? priorityFor(changes.incidentType) : existing.priority;

  const next = {
    status: changes.status ?? existing.status,
    assignee: changes.assignee ?? existing.assignee,
    resolutionNote: changes.resolutionNote ?? existing.resolutionNote,
    containerType: changes.containerType ?? existing.containerType,
    incidentType,
    description: changes.description ?? existing.description,
    priority,
    updatedAt: Date.now(),
    id,
  };
  conn.prepare(`
    UPDATE reports SET
      status=@status, assignee=@assignee, resolution_note=@resolutionNote,
      container_type=@containerType, incident_type=@incidentType,
      description=@description, priority=@priority, updated_at=@updatedAt
    WHERE id=@id
  `).run(next);
  return getReport(id);
}

export function deleteReport(id: string): boolean {
  const conn = getDB();
  const exists = conn.prepare('SELECT 1 FROM reports WHERE id = ?').get(id);
  if (!exists) return false;
  conn.prepare('DELETE FROM comments WHERE report_id = ?').run(id);
  conn.prepare('DELETE FROM reports WHERE id = ?').run(id);
  return true;
}

// ---------- bins ----------
interface BinRow {
  id: string; type: string; lat: number; lng: number;
  address: string; area: string;
  capacity_liters: number | null; pto_rec: string | null;
}

function rowToBin(b: BinRow): Bin {
  return {
    id: b.id, type: b.type as ContainerType,
    lat: b.lat, lng: b.lng,
    address: b.address, area: b.area,
    capacityLiters: b.capacity_liters ?? null,
    ptoRec: b.pto_rec ?? null,
  };
}

export interface BinFilters {
  /** one type or comma-separated list of types */
  type?: string;
  types?: string[];
  /** lat_min,lng_min,lat_max,lng_max */
  bbox?: string;
  limit?: number;
  /** return count only */
  countOnly?: boolean;
  /** search by address */
  q?: string;
}

export function countBins(): number {
  const conn = getDB();
  return ((conn.prepare('SELECT COUNT(*) n FROM bins').get()) as { n: number }).n;
}

export function listBins(filters: BinFilters | string = {}): Bin[] {
  const conn = getDB();
  // backwards compat: old callers pass a type string
  if (typeof filters === 'string') filters = { type: filters };

  const where: string[] = [];
  const params: unknown[] = [];

  // support single type, comma-separated types, or types array
  const typeList = filters.types?.length
    ? filters.types
    : filters.type ? filters.type.split(',').map(t => t.trim()).filter(Boolean) : [];
  if (typeList.length === 1) {
    where.push('type = ?'); params.push(typeList[0]);
  } else if (typeList.length > 1) {
    where.push(`type IN (${typeList.map(() => '?').join(',')})`);
    params.push(...typeList);
  }

  if (filters.q) {
    where.push('address LIKE ?'); params.push(`%${filters.q}%`);
  }

  if (filters.bbox) {
    const parts = filters.bbox.split(',').map(Number);
    if (parts.length === 4 && parts.every(isFinite)) {
      const [latMin, lngMin, latMax, lngMax] = parts;
      where.push('lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?');
      params.push(latMin, latMax, lngMin, lngMax);
    }
  }

  const limit = filters.limit;
  const sql =
    'SELECT * FROM bins' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    (typeof limit === 'number' ? ` LIMIT ${limit}` : '');
  return (conn.prepare(sql).all(...params) as BinRow[]).map(rowToBin);
}

export function getBin(id: string): Bin | null {
  const conn = getDB();
  const b = conn.prepare('SELECT * FROM bins WHERE id = ?').get(id) as BinRow | undefined;
  return b ? rowToBin(b) : null;
}

// ---------- users ----------
interface UserRow { id: string; username: string; display_name: string; barrio: string; points: number; created_at: number; }

function rowToUser(u: UserRow): User {
  return { id: u.id, username: u.username, displayName: u.display_name, barrio: u.barrio ?? '', points: u.points ?? 0, createdAt: u.created_at };
}

export function getUser(id: string): User | null {
  const conn = getDB();
  const u = conn.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return u ? rowToUser(u) : null;
}

export function getDefaultUser(): User {
  return getUser(DEFAULT_USER_ID)!;
}

export function listUsers(): User[] {
  const conn = getDB();
  return (conn.prepare('SELECT * FROM users ORDER BY points DESC').all() as UserRow[]).map(rowToUser);
}

// ---------- comments ----------
interface CommentRow { id: string; report_id: string; author_role: string; text: string; created_at: number; }

export function listComments(reportId: string): Comment[] {
  const conn = getDB();
  const rows = conn.prepare(
    'SELECT * FROM comments WHERE report_id = ? ORDER BY created_at ASC'
  ).all(reportId) as CommentRow[];
  return rows.map(c => ({
    id: c.id, reportId: c.report_id, authorRole: c.author_role as Role, text: c.text, createdAt: c.created_at,
  }));
}

export function insertComment(reportId: string, authorRole: Role, text: string): Comment {
  const conn = getDB();
  const comment: Comment = {
    id: randomUUID(), reportId, authorRole, text, createdAt: Date.now(),
  };
  conn.prepare(
    'INSERT INTO comments (id, report_id, author_role, text, created_at) VALUES (?,?,?,?,?)'
  ).run(comment.id, comment.reportId, comment.authorRole, comment.text, comment.createdAt);
  return comment;
}

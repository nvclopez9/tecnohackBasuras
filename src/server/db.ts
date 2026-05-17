import { createClient, Client, InValue, Row } from '@libsql/client';
import { randomUUID } from 'crypto';
import {
  Report, Comment, Bin, User,
  ContainerType, IncidentType, ReportStatus, Priority, Role,
} from '@/types';
import { priorityFor } from '@/lib/priority';

export const DEFAULT_USER_ID = 'user-maria';

// ── Client singleton ──────────────────────────────────────────────────────────
let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return _client;
}

// ── Lazy init (runs once per process) ────────────────────────────────────────
let _ready: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!_ready) _ready = init();
  return _ready;
}

async function init(): Promise<void> {
  const c = getClient();

  // Crear tablas
  await c.batch([
    `CREATE TABLE IF NOT EXISTS users (
       id TEXT PRIMARY KEY,
       username TEXT UNIQUE NOT NULL,
       display_name TEXT NOT NULL,
       barrio TEXT NOT NULL DEFAULT '',
       points INTEGER NOT NULL DEFAULT 0,
       created_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS bins (
       id TEXT PRIMARY KEY,
       type TEXT NOT NULL,
       lat REAL NOT NULL,
       lng REAL NOT NULL,
       address TEXT NOT NULL,
       area TEXT NOT NULL,
       capacity_liters REAL DEFAULT NULL,
       pto_rec TEXT DEFAULT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS reports (
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
     )`,
    `CREATE TABLE IF NOT EXISTS comments (
       id TEXT PRIMARY KEY,
       report_id TEXT NOT NULL,
       author_role TEXT NOT NULL,
       text TEXT NOT NULL,
       created_at INTEGER NOT NULL
     )`,
    `CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_report ON comments(report_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bins_type ON bins(type)`,
    `CREATE INDEX IF NOT EXISTS idx_bins_lat ON bins(lat)`,
  ], 'write');

  // Migraciones idempotentes (ADD COLUMN falla si ya existe → ignorar)
  for (const sql of [
    `ALTER TABLE bins ADD COLUMN capacity_liters REAL DEFAULT NULL`,
    `ALTER TABLE bins ADD COLUMN pto_rec TEXT DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN barrio TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0`,
  ]) {
    try { await c.execute(sql); } catch { /* column already exists */ }
  }

  // Corregir tipos obsoletos
  await c.batch([
    `UPDATE bins SET type = 'mixto' WHERE type IN ('organico', 'resto')`,
    `UPDATE bins SET type = 'electrico' WHERE type = 'baterias'`,
    `UPDATE reports SET container_type = 'mixto' WHERE container_type IN ('organico', 'resto')`,
    `UPDATE reports SET container_type = 'electrico' WHERE container_type = 'baterias'`,
  ], 'write');

}

// ── Helpers de tipo ───────────────────────────────────────────────────────────
function s(v: unknown): string { return String(v ?? ''); }
function n(v: unknown): number {
  if (typeof v === 'bigint') return Number(v);
  return Number(v ?? 0);
}
function nNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'bigint') return Number(v);
  return Number(v);
}

// ── Seed (no-op: all data is now in Turso) ───────────────────────────────────
// Data was migrated from local SQLite via scripts/migrate-to-turso.js

// ── Mappers ───────────────────────────────────────────────────────────────────
function rowToReport(r: Row): Report {
  return {
    id: s(r.id), code: s(r.code), userId: s(r.user_id), binId: s(r.bin_id),
    photo: s(r.photo), thumbnail: s(r.thumbnail),
    lat: n(r.lat), lng: n(r.lng),
    address: s(r.address), area: s(r.area),
    containerType: s(r.container_type) as ContainerType,
    incidentType: s(r.incident_type) as IncidentType,
    description: s(r.description),
    status: s(r.status) as ReportStatus,
    priority: s(r.priority) as Priority,
    assignee: s(r.assignee),
    resolutionNote: s(r.resolution_note),
    createdAt: n(r.created_at),
    updatedAt: n(r.updated_at),
  };
}

function rowToBin(r: Row): Bin {
  return {
    id: s(r.id), type: s(r.type) as ContainerType,
    lat: n(r.lat), lng: n(r.lng),
    address: s(r.address), area: s(r.area),
    capacityLiters: nNull(r.capacity_liters),
    ptoRec: r.pto_rec !== null ? s(r.pto_rec) : null,
  };
}

function rowToUser(r: Row): User {
  return {
    id: s(r.id), username: s(r.username), displayName: s(r.display_name),
    barrio: s(r.barrio), points: n(r.points), createdAt: n(r.created_at),
  };
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface ReportFilters {
  status?: string; containerType?: string; incidentType?: string;
  priority?: string; area?: string; userId?: string; binId?: string;
  ids?: string[];
}

export async function listReports(filters: ReportFilters = {}): Promise<Report[]> {
  await ensureReady();
  const c = getClient();
  const where: string[] = [];
  const args: InValue[] = [];
  const addEq = (col: string, val?: string) => { if (val) { where.push(`${col} = ?`); args.push(val); } };
  addEq('status', filters.status);
  addEq('container_type', filters.containerType);
  addEq('incident_type', filters.incidentType);
  addEq('priority', filters.priority);
  addEq('area', filters.area);
  addEq('user_id', filters.userId);
  addEq('bin_id', filters.binId);
  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    where.push(`id IN (${filters.ids.map(() => '?').join(',')})`);
    args.push(...filters.ids);
  }
  const sql = 'SELECT * FROM reports' + (where.length ? ` WHERE ${where.join(' AND ')}` : '') + ' ORDER BY created_at DESC';
  const result = await c.execute({ sql, args });
  return result.rows.map(rowToReport);
}

export async function getReport(id: string): Promise<Report | null> {
  await ensureReady();
  const c = getClient();
  const result = await c.execute({ sql: 'SELECT * FROM reports WHERE id = ?', args: [id] });
  return result.rows[0] ? rowToReport(result.rows[0]) : null;
}

let codeCounter = 0;
async function nextCode(c: Client): Promise<string> {
  if (codeCounter === 0) {
    const res = await c.execute('SELECT code FROM reports ORDER BY created_at DESC LIMIT 1');
    const maxCode = res.rows[0] ? s(res.rows[0].code) : '';
    const parsed = maxCode ? parseInt(maxCode.replace(/\D/g, ''), 10) : 2845;
    codeCounter = Number.isFinite(parsed) ? parsed : 2845;
  }
  codeCounter += 1;
  return `R-${codeCounter}`;
}

export interface NewReportInput {
  userId: string; binId: string; photo: string; thumbnail: string;
  lat: number; lng: number; address: string; area: string;
  containerType: ContainerType; incidentType: IncidentType; description: string;
}

export async function insertReport(input: NewReportInput): Promise<Report> {
  await ensureReady();
  const c = getClient();
  const now = Date.now();
  const id = randomUUID();
  const code = await nextCode(c);
  const priority = priorityFor(input.incidentType);
  await c.execute({
    sql: `INSERT INTO reports
      (id,code,user_id,bin_id,photo,thumbnail,lat,lng,address,area,
       container_type,incident_type,description,status,priority,assignee,
       resolution_note,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id, code, input.userId, input.binId, input.photo, input.thumbnail,
      input.lat, input.lng, input.address, input.area,
      input.containerType, input.incidentType, input.description,
      'pendiente', priority, '', '', now, now,
    ],
  });
  return (await getReport(id))!;
}

export interface ReportChanges {
  status?: ReportStatus; assignee?: string; resolutionNote?: string;
  containerType?: ContainerType; incidentType?: IncidentType; description?: string;
}

export async function updateReport(id: string, changes: ReportChanges): Promise<Report | null> {
  await ensureReady();
  const c = getClient();
  const existing = await getReport(id);
  if (!existing) return null;
  const incidentType = changes.incidentType ?? existing.incidentType;
  const priority = changes.incidentType ? priorityFor(changes.incidentType) : existing.priority;
  await c.execute({
    sql: `UPDATE reports SET
      status=?,assignee=?,resolution_note=?,container_type=?,incident_type=?,
      description=?,priority=?,updated_at=? WHERE id=?`,
    args: [
      changes.status ?? existing.status,
      changes.assignee ?? existing.assignee,
      changes.resolutionNote ?? existing.resolutionNote,
      changes.containerType ?? existing.containerType,
      incidentType, changes.description ?? existing.description,
      priority, Date.now(), id,
    ],
  });
  return getReport(id);
}

export async function deleteReport(id: string): Promise<boolean> {
  await ensureReady();
  const c = getClient();
  const exists = await c.execute({ sql: 'SELECT 1 FROM reports WHERE id = ?', args: [id] });
  if (!exists.rows.length) return false;
  await c.batch([
    { sql: 'DELETE FROM comments WHERE report_id = ?', args: [id] },
    { sql: 'DELETE FROM reports WHERE id = ?', args: [id] },
  ], 'write');
  return true;
}

// ── Bins ──────────────────────────────────────────────────────────────────────
export interface BinFilters {
  type?: string; types?: string[]; bbox?: string; limit?: number; q?: string;
}

export async function countBins(): Promise<number> {
  await ensureReady();
  const c = getClient();
  const res = await c.execute('SELECT COUNT(*) AS n FROM bins');
  return n(res.rows[0]?.n);
}

export async function listBins(filters: BinFilters | string = {}): Promise<Bin[]> {
  await ensureReady();
  const c = getClient();
  if (typeof filters === 'string') filters = { type: filters };
  const where: string[] = [];
  const args: InValue[] = [];
  const typeList = filters.types?.length
    ? filters.types
    : filters.type ? filters.type.split(',').map(t => t.trim()).filter(Boolean) : [];
  if (typeList.length === 1) { where.push('type = ?'); args.push(typeList[0]); }
  else if (typeList.length > 1) { where.push(`type IN (${typeList.map(() => '?').join(',')})`); args.push(...typeList); }
  if (filters.q) { where.push('address LIKE ?'); args.push(`%${filters.q}%`); }
  if (filters.bbox) {
    const parts = filters.bbox.split(',').map(Number);
    if (parts.length === 4 && parts.every(isFinite)) {
      const [latMin, lngMin, latMax, lngMax] = parts;
      where.push('lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?');
      args.push(latMin, latMax, lngMin, lngMax);
    }
  }
  const limit = filters.limit;
  const sql = 'SELECT * FROM bins'
    + (where.length ? ` WHERE ${where.join(' AND ')}` : '')
    + (typeof limit === 'number' ? ` LIMIT ${limit}` : '');
  const result = await c.execute({ sql, args });
  return result.rows.map(rowToBin);
}

export async function getBin(id: string): Promise<Bin | null> {
  await ensureReady();
  const c = getClient();
  const result = await c.execute({ sql: 'SELECT * FROM bins WHERE id = ?', args: [id] });
  return result.rows[0] ? rowToBin(result.rows[0]) : null;
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getUser(id: string): Promise<User | null> {
  await ensureReady();
  const c = getClient();
  const result = await c.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
  return result.rows[0] ? rowToUser(result.rows[0]) : null;
}

export async function getDefaultUser(): Promise<User> {
  return (await getUser(DEFAULT_USER_ID))!;
}

export async function listUsers(): Promise<User[]> {
  await ensureReady();
  const c = getClient();
  const result = await c.execute('SELECT * FROM users ORDER BY points DESC');
  return result.rows.map(rowToUser);
}

// ── Comments ──────────────────────────────────────────────────────────────────
export async function listComments(reportId: string): Promise<Comment[]> {
  await ensureReady();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM comments WHERE report_id = ? ORDER BY created_at ASC',
    args: [reportId],
  });
  return result.rows.map(r => ({
    id: s(r.id), reportId: s(r.report_id), authorRole: s(r.author_role) as Role,
    text: s(r.text), createdAt: n(r.created_at),
  }));
}

export async function insertComment(reportId: string, authorRole: Role, text: string): Promise<Comment> {
  await ensureReady();
  const c = getClient();
  const id = randomUUID();
  const createdAt = Date.now();
  await c.execute({
    sql: 'INSERT INTO comments (id, report_id, author_role, text, created_at) VALUES (?,?,?,?,?)',
    args: [id, reportId, authorRole, text, createdAt],
  });
  return { id, reportId, authorRole, text, createdAt };
}

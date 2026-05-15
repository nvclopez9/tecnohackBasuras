import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  Report,
  Comment,
  ContainerType,
  IncidentType,
  ReportStatus,
  Priority,
  Role,
} from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'ecochicharro.db');

let db: Database.Database | null = null;

function getDB(): Database.Database {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      photo TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      container_type TEXT NOT NULL,
      incident_type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pendiente',
      priority TEXT NOT NULL,
      assignee TEXT NOT NULL DEFAULT '',
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
  `);
  return db;
}

interface ReportRow {
  id: string;
  photo: string;
  thumbnail: string;
  lat: number;
  lng: number;
  container_type: string;
  incident_type: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  created_at: number;
  updated_at: number;
}

function rowToReport(r: ReportRow): Report {
  return {
    id: r.id,
    photo: r.photo,
    thumbnail: r.thumbnail,
    lat: r.lat,
    lng: r.lng,
    containerType: r.container_type as ContainerType,
    incidentType: r.incident_type as IncidentType,
    description: r.description,
    status: r.status as ReportStatus,
    priority: r.priority as Priority,
    assignee: r.assignee,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface ReportFilters {
  status?: string;
  containerType?: string;
  incidentType?: string;
  priority?: string;
  ids?: string[];
}

export function listReports(filters: ReportFilters = {}): Report[] {
  const conn = getDB();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  if (filters.containerType) {
    where.push('container_type = ?');
    params.push(filters.containerType);
  }
  if (filters.incidentType) {
    where.push('incident_type = ?');
    params.push(filters.incidentType);
  }
  if (filters.priority) {
    where.push('priority = ?');
    params.push(filters.priority);
  }
  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    where.push(`id IN (${filters.ids.map(() => '?').join(',')})`);
    params.push(...filters.ids);
  }

  const sql =
    'SELECT * FROM reports' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY created_at DESC';
  const rows = conn.prepare(sql).all(...params) as ReportRow[];
  return rows.map(rowToReport);
}

export function getReport(id: string): Report | null {
  const conn = getDB();
  const row = conn.prepare('SELECT * FROM reports WHERE id = ?').get(id) as
    | ReportRow
    | undefined;
  return row ? rowToReport(row) : null;
}

export function insertReport(r: Report): Report {
  const conn = getDB();
  conn
    .prepare(
      `INSERT INTO reports
        (id, photo, thumbnail, lat, lng, container_type, incident_type,
         description, status, priority, assignee, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      r.id,
      r.photo,
      r.thumbnail,
      r.lat,
      r.lng,
      r.containerType,
      r.incidentType,
      r.description,
      r.status,
      r.priority,
      r.assignee,
      r.createdAt,
      r.updatedAt
    );
  return r;
}

export function updateReport(
  id: string,
  changes: { status?: ReportStatus; assignee?: string }
): Report | null {
  const conn = getDB();
  const existing = getReport(id);
  if (!existing) return null;
  const status = changes.status ?? existing.status;
  const assignee = changes.assignee ?? existing.assignee;
  conn
    .prepare(
      'UPDATE reports SET status = ?, assignee = ?, updated_at = ? WHERE id = ?'
    )
    .run(status, assignee, Date.now(), id);
  return getReport(id);
}

interface CommentRow {
  id: string;
  report_id: string;
  author_role: string;
  text: string;
  created_at: number;
}

function rowToComment(c: CommentRow): Comment {
  return {
    id: c.id,
    reportId: c.report_id,
    authorRole: c.author_role as Role,
    text: c.text,
    createdAt: c.created_at,
  };
}

export function listComments(reportId: string): Comment[] {
  const conn = getDB();
  const rows = conn
    .prepare(
      'SELECT * FROM comments WHERE report_id = ? ORDER BY created_at ASC'
    )
    .all(reportId) as CommentRow[];
  return rows.map(rowToComment);
}

export function insertComment(c: Comment): Comment {
  const conn = getDB();
  conn
    .prepare(
      `INSERT INTO comments (id, report_id, author_role, text, created_at)
       VALUES (?,?,?,?,?)`
    )
    .run(c.id, c.reportId, c.authorRole, c.text, c.createdAt);
  return c;
}

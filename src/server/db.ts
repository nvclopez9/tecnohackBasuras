import { createClient, Client, InValue, Row } from '@libsql/client';
import { randomUUID } from 'crypto';
import {
  Report, Comment, Bin, User,
  ContainerType, IncidentType, ReportStatus, Priority, Role,
} from '@/types';
import { CONTAINERS } from '@/lib/constants';
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

  await seedDatabase(c);
  await seedSyntheticReports(c);
  await seedSyntheticUsers(c);
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

// ── Seed ─────────────────────────────────────────────────────────────────────
const DAY = 86400000;

const SEED_BINS_DATA = [
  { id: 'bin-organico', type: 'mixto',    lat: 28.4690, lng: -16.2520, address: 'Calle del Castillo, 47',   area: 'Centro', cap: 240  },
  { id: 'bin-envases',  type: 'envases',  lat: 28.4677, lng: -16.2511, address: 'Plaza de España',           area: 'Centro', cap: 120  },
  { id: 'bin-papel',    type: 'papel',    lat: 28.4725, lng: -16.2575, address: 'Rambla de Santa Cruz, 120', area: 'Salud',  cap: 360  },
  { id: 'bin-vidrio',   type: 'vidrio',   lat: 28.4701, lng: -16.2535, address: 'Plaza del Príncipe',        area: 'Centro', cap: 1000 },
  { id: 'bin-resto',    type: 'mixto',    lat: 28.4625, lng: -16.2565, address: 'Avenida Tres de Mayo, 12',  area: 'Cabo',   cap: 1100 },
  { id: 'bin-ropa',     type: 'ropa',     lat: 28.4705, lng: -16.2485, address: 'Avenida de Anaga, 22',      area: 'Anaga',  cap: 500  },
  { id: 'bin-aceite',   type: 'aceite',   lat: 28.4660, lng: -16.2525, address: 'Calle San Sebastián, 75',   area: 'Salud',  cap: 120  },
  { id: 'bin-baterias', type: 'electrico',lat: 28.4728, lng: -16.2548, address: 'Parque García Sanabria',    area: 'Centro', cap: 60   },
];

interface SeedReportDef {
  code: string; binId: string; lat: number; lng: number; address: string; area: string;
  containerType: ContainerType; incidentType: IncidentType; status: ReportStatus;
  description: string; assignee: string; resolutionNote: string; ageDays: number;
}

const SEED_DEFS: SeedReportDef[] = [
  { code:'R-2845', binId:'bin-envases',  lat:28.4679, lng:-16.2513, address:'Calle Castillo, 47',    area:'Centro', containerType:'envases',  incidentType:'lleno',      status:'pendiente',  description:'Lleva dos días desbordado.',          assignee:'',                    resolutionNote:'', ageDays:0.4 },
  { code:'R-2844', binId:'bin-organico', lat:28.4706, lng:-16.2487, address:'Av. de Anaga, 22',       area:'Anaga',  containerType:'mixto',    incidentType:'roto',       status:'en_proceso', description:'Tapa rota, no cierra.',               assignee:'Equipo Anaga',       resolutionNote:'', ageDays:0.9 },
  { code:'R-2843', binId:'bin-vidrio',   lat:28.4700, lng:-16.2536, address:'Rambla 25 de Julio, 8',  area:'Salud',  containerType:'vidrio',   incidentType:'sucio',      status:'resuelto',   description:'Cristales rotos alrededor.',           assignee:'Equipo Salud-Ofra',  resolutionNote:'Zona limpiada y desinfectada por el Equipo Salud-Ofra. Gracias por avisar.', ageDays:2.1 },
  { code:'R-2842', binId:'bin-papel',    lat:28.4724, lng:-16.2573, address:'Plaza del Príncipe',      area:'Centro', containerType:'papel',    incidentType:'lleno',      status:'pendiente',  description:'',                                    assignee:'',                    resolutionNote:'', ageDays:2.6 },
  { code:'R-2841', binId:'bin-baterias', lat:28.4729, lng:-16.2549, address:'Av. Tres de Mayo, 12',   area:'Cabo',   containerType:'electrico', incidentType:'quemado',   status:'en_proceso', description:'Contenedor quemado durante la noche.', assignee:'Recogida especial',  resolutionNote:'', ageDays:3.0 },
  { code:'R-2840', binId:'bin-resto',    lat:28.4627, lng:-16.2567, address:'C/ Imeldo Serís, 31',    area:'Centro', containerType:'mixto',    incidentType:'desaparecido',status:'pendiente', description:'El contenedor ya no está.',             assignee:'',                    resolutionNote:'', ageDays:3.4 },
  { code:'R-2839', binId:'bin-envases',  lat:28.4711, lng:-16.2502, address:'Pza. Weyler, 4',         area:'Centro', containerType:'envases',  incidentType:'roto',       status:'resuelto',   description:'Rueda rota.',                          assignee:'Equipo Centro',      resolutionNote:'Se ha sustituido la rueda. Contenedor operativo.', ageDays:4.2 },
  { code:'R-2838', binId:'bin-aceite',   lat:28.4662, lng:-16.2527, address:'C/ San Sebastián, 75',   area:'Salud',  containerType:'aceite',   incidentType:'lleno',      status:'pendiente',  description:'',                                    assignee:'',                    resolutionNote:'', ageDays:4.6 },
  { code:'R-2837', binId:'bin-ropa',     lat:28.4640, lng:-16.2560, address:'Av. de la Constitución, 5',area:'Cabo',  containerType:'ropa',    incidentType:'lleno',      status:'pendiente',  description:'No entra más ropa.',                  assignee:'',                    resolutionNote:'', ageDays:5.1 },
  { code:'R-2836', binId:'bin-papel',    lat:28.4688, lng:-16.2518, address:'C/ El Pilar, 19',         area:'Centro', containerType:'papel',   incidentType:'sucio',      status:'resuelto',   description:'',                                    assignee:'Equipo Centro',      resolutionNote:'Limpieza realizada.', ageDays:6.3 },
  { code:'R-2835', binId:'bin-organico', lat:28.4668, lng:-16.2540, address:'C/ Galcerán, 33',         area:'Salud',  containerType:'mixto',   incidentType:'desaparecido',status:'en_proceso',description:'Falta desde hace días.',               assignee:'Equipo Salud-Ofra',  resolutionNote:'', ageDays:7.0 },
  { code:'R-2834', binId:'bin-vidrio',   lat:28.4676, lng:-16.2509, address:'Plaza de España',         area:'Centro', containerType:'vidrio',  incidentType:'quemado',    status:'pendiente',  description:'Vandalizado.',                         assignee:'',                    resolutionNote:'', ageDays:8.4 },
];

async function seedDatabase(c: Client) {
  const userRow = await c.execute('SELECT COUNT(*) AS n FROM users');
  const userCount = n(userRow.rows[0]?.n);

  if (userCount === 0) {
    await c.execute({
      sql: 'INSERT INTO users (id, username, display_name, barrio, points, created_at) VALUES (?,?,?,?,?,?)',
      args: [DEFAULT_USER_ID, 'maria', 'María Domínguez', 'Centro', 1820, Date.now() - 120 * DAY],
    });
  } else {
    await c.execute({
      sql: "UPDATE users SET barrio='Centro', points=1820 WHERE id=? AND (barrio='' OR points=0)",
      args: [DEFAULT_USER_ID],
    });
  }

  const binRow = await c.execute('SELECT COUNT(*) AS n FROM bins');
  if (n(binRow.rows[0]?.n) === 0) {
    await c.batch(
      SEED_BINS_DATA.map(b => ({
        sql: 'INSERT INTO bins (id, type, lat, lng, address, area, capacity_liters, pto_rec) VALUES (?,?,?,?,?,?,?,?)',
        args: [b.id, b.type, b.lat, b.lng, b.address, b.area, b.cap, null] as InValue[],
      })),
      'write',
    );
  }

  const repRow = await c.execute('SELECT COUNT(*) AS n FROM reports');
  if (n(repRow.rows[0]?.n) === 0) {
    const reportRows = SEED_DEFS.map(d => {
      const created = Date.now() - d.ageDays * DAY;
      return {
        sql: `INSERT INTO reports
          (id,code,user_id,bin_id,photo,thumbnail,lat,lng,address,area,
           container_type,incident_type,description,status,priority,assignee,
           resolution_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          randomUUID(), d.code, DEFAULT_USER_ID, d.binId, '', '',
          d.lat, d.lng, d.address, d.area,
          d.containerType, d.incidentType, d.description,
          d.status, priorityFor(d.incidentType), d.assignee,
          d.resolutionNote, created,
          d.status === 'pendiente' ? created : created + 0.5 * DAY,
        ] as InValue[],
      };
    });
    await c.batch(reportRows, 'write');
  }
}

// ── Synthetic temporal reports ────────────────────────────────────────────────
const SYN_BIN_DATA: Record<string, { lat: number; lng: number; address: string; area: string; ct: ContainerType }> = {
  'bin-organico': { lat:28.4690, lng:-16.2520, address:'Calle del Castillo, 47',   area:'Centro', ct:'mixto'     },
  'bin-envases':  { lat:28.4677, lng:-16.2511, address:'Plaza de España',           area:'Centro', ct:'envases'   },
  'bin-papel':    { lat:28.4725, lng:-16.2575, address:'Rambla de Santa Cruz, 120', area:'Salud',  ct:'papel'     },
  'bin-vidrio':   { lat:28.4701, lng:-16.2535, address:'Plaza del Príncipe',        area:'Centro', ct:'vidrio'    },
  'bin-resto':    { lat:28.4625, lng:-16.2565, address:'Avenida Tres de Mayo, 12',  area:'Cabo',   ct:'mixto'     },
  'bin-ropa':     { lat:28.4705, lng:-16.2485, address:'Avenida de Anaga, 22',      area:'Anaga',  ct:'ropa'      },
  'bin-aceite':   { lat:28.4660, lng:-16.2525, address:'Calle San Sebastián, 75',   area:'Salud',  ct:'aceite'    },
  'bin-baterias': { lat:28.4728, lng:-16.2548, address:'Parque García Sanabria',    area:'Centro', ct:'electrico' },
};
const SYN_BIN_KEYS = Object.keys(SYN_BIN_DATA);
const SYN_ITS: IncidentType[]  = ['lleno','roto','sucio','desaparecido','quemado'];
const SYN_STS: ReportStatus[]  = ['pendiente','en_proceso','resuelto'];

type SynRaw = [string, number, number, number, number, number];
const SYN_RAW: SynRaw[] = [
  ['01',0,2,10,0,0],['02',2,4,7,2,2],
  ['03',1,6,12,0,0],['04',3,7,5,0,2],['05',4,7,3,1,0],['06',2,7,8,0,1],
  ['07',0,8,0,0,0],['08',1,8,1,1,0],['09',2,8,2,0,1],['10',4,8,13,2,2],
  ['11',0,9,0,0,0],['12',1,9,1,0,0],['13',3,9,3,0,2],['14',2,9,4,1,0],
  ['15',4,9,5,2,0],['16',0,9,6,0,1],['17',1,10,2,0,0],['18',3,10,9,1,2],
  ['19',2,10,1,0,0],['20',0,10,8,2,2],
  ['21',1,11,0,0,0],['22',4,11,3,0,0],['23',2,11,5,1,0],['24',3,11,7,2,2],
  ['25',0,12,2,0,1],['26',1,12,4,1,0],['27',4,12,11,0,2],['28',2,13,1,0,0],
  ['29',0,13,0,0,0],['30',3,13,6,0,0],['31',1,13,9,1,2],
  ['32',4,14,0,0,0],['33',2,14,2,0,0],['34',0,14,3,2,0],
  ['35',3,14,8,0,2],['36',1,14,12,1,1],
  ['37',4,15,1,0,0],['38',2,15,5,0,2],['39',0,15,7,0,0],
  ['40',1,15,3,2,2],['41',3,16,0,1,0],['42',4,16,4,0,0],
  ['43',2,17,2,0,1],['44',0,17,9,0,2],['45',1,18,1,0,0],
  ['46',3,18,3,1,0],['47',4,18,6,0,0],['48',2,19,0,0,0],['49',0,19,1,0,0],
  ['50',1,19,4,0,2],['51',3,19,8,2,0],['52',4,20,2,0,0],['53',2,20,5,1,2],
  ['54',0,20,0,0,0],['55',1,20,1,0,0],['56',3,20,7,0,0],
  ['57',4,21,0,0,0],['58',2,21,2,0,0],['59',0,21,3,2,0],
  ['60',1,21,5,1,2],['61',3,21,10,0,0],
  ['62',4,22,1,0,0],['63',2,22,4,0,2],['64',0,22,6,0,0],
  ['65',1,23,0,0,0],['66',3,23,2,0,2],['67',4,23,3,1,0],
  ['68',2,23,8,0,0],['69',0,23,11,0,0],
];

async function seedSyntheticReports(c: Client) {
  const midnight = Math.floor(Date.now() / 86_400_000) * 86_400_000;
  const stmts = SYN_RAW.map(([sfx, bIdx, hour, daysAgo, itIdx, stIdx]) => {
    const id = `syn-${sfx}`;
    const binKey = SYN_BIN_KEYS[bIdx];
    const b = SYN_BIN_DATA[binKey];
    const it = SYN_ITS[itIdx];
    const st = SYN_STS[stIdx];
    const createdAt = midnight - daysAgo * DAY + hour * 3_600_000;
    return {
      sql: `INSERT OR IGNORE INTO reports
        (id,code,user_id,bin_id,photo,thumbnail,lat,lng,address,area,
         container_type,incident_type,description,status,priority,assignee,
         resolution_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id, `SYN-${sfx}`, DEFAULT_USER_ID, binKey, '', '',
        b.lat, b.lng, b.address, b.area, b.ct, it, '', st,
        priorityFor(it), '', st === 'resuelto' ? 'Incidencia resuelta.' : '',
        createdAt, st === 'pendiente' ? createdAt : createdAt + 0.5 * DAY,
      ] as InValue[],
    };
  });
  // Batch in chunks of 30 to stay within limits
  for (let i = 0; i < stmts.length; i += 30) {
    await c.batch(stmts.slice(i, i + 30), 'write');
  }
}

// ── Synthetic users ───────────────────────────────────────────────────────────
type SynUserTuple = [string, string, string, number, number];
const SYN_USERS: SynUserTuple[] = [
  ['c-01','Carlos Rodríguez Pérez','Centro',2380,180],['c-02','Ana García Martínez','Centro',2145,165],
  ['c-03','Javier Sánchez López','Centro',1650,155],['c-04','Laura Martínez García','Centro',1480,148],
  ['c-05','Pablo González Sánchez','Centro',1320,140],['c-06','Carmen Pérez López','Centro',1180,132],
  ['c-07','Andrés López García','Centro',1050,125],['c-08','Marta Torres Martínez','Centro',940,118],
  ['c-09','Miguel Fernández Pérez','Centro',830,110],['c-10','Lucía Hernández García','Centro',740,102],
  ['c-11','Antonio Ramírez López','Centro',660,95],['c-12','Elena Flores Martínez','Centro',580,88],
  ['c-13','Francisco Moreno García','Centro',510,82],['c-14','Sara Jiménez Pérez','Centro',450,76],
  ['c-15','Jorge Ruiz López','Centro',400,70],['c-16','Isabel Díaz García','Centro',360,64],
  ['c-17','David Romero Martínez','Centro',320,58],['c-18','Cristina Alonso Sánchez','Centro',280,52],
  ['c-19','Sergio Navarro López','Centro',250,47],['c-20','Patricia Suárez García','Centro',210,42],
  ['c-21','Rafael Molina Pérez','Centro',185,37],['c-22','Sofía Castro Martínez','Centro',160,32],
  ['c-23','Alejandro Ortega García','Centro',140,27],['c-24','Beatriz Delgado López','Centro',120,22],
  ['c-25','Marcos Ramos Sánchez','Centro',100,17],['c-26','Natalia Vidal García','Centro',90,13],
  ['c-27','Rubén Medina Pérez','Centro',78,9],['c-28','Pilar Reyes Martínez','Centro',65,5],
  ['s-01','Fernando García Torres','Salud',1940,175],['s-02','Rosa Torres Martínez','Salud',1760,162],
  ['s-03','Álvaro Martínez López','Salud',1580,150],['s-04','Verónica López García','Salud',1420,140],
  ['s-05','Iván Sánchez Pérez','Salud',1270,130],['s-06','Silvia González Martínez','Salud',1130,122],
  ['s-07','Alberto Pérez García','Salud',1000,115],['s-08','Claudia Rodríguez López','Salud',890,108],
  ['s-09','Luis Fernández Sánchez','Salud',780,100],['s-10','Raquel Hernández García','Salud',680,92],
  ['s-11','Diego Torres Martínez','Salud',600,85],['s-12','Alicia Ramírez López','Salud',530,78],
  ['s-13','Pedro Flores García','Salud',465,72],['s-14','Nuria Moreno Pérez','Salud',410,66],
  ['s-15','Juan Jiménez Martínez','Salud',360,60],['s-16','Eva Ruiz García','Salud',315,54],
  ['s-17','Tomás Díaz López','Salud',275,48],['s-18','Esther Romero Sánchez','Salud',240,43],
  ['s-19','Rodrigo Alonso García','Salud',210,38],['s-20','Amparo Navarro Pérez','Salud',185,33],
  ['s-21','Roberto Suárez Martínez','Salud',160,28],['s-22','Dolores Molina García','Salud',140,24],
  ['s-23','Manuel Castro López','Salud',120,20],['s-24','Teresa Ortega Sánchez','Salud',103,16],
  ['s-25','Enrique Delgado García','Salud',88,13],['s-26','Concepción Ramos Pérez','Salud',75,10],
  ['s-27','Gabriel Vidal Martínez','Salud',63,7],['s-28','Irene Medina García','Salud',52,5],
  ['s-29','Guillermo Reyes López','Salud',42,3],['s-30','Manuela Cruz Sánchez','Salud',35,1],
  ['cb-01','Héctor García Romero','Cabo',1790,170],['cb-02','Rosario Martínez López','Cabo',1620,158],
  ['cb-03','Emilio Sánchez García','Cabo',1450,146],['cb-04','Montserrat López Pérez','Cabo',1290,135],
  ['cb-05','Óscar González Martínez','Cabo',1145,125],['cb-06','Consuelo Pérez García','Cabo',1010,116],
  ['cb-07','Daniel Rodríguez López','Cabo',890,107],['cb-08','Marisol Fernández Sánchez','Cabo',785,98],
  ['cb-09','Eduardo Torres García','Cabo',680,90],['cb-10','Adriana Hernández Pérez','Cabo',590,82],
  ['cb-11','Nicolás Ramírez Martínez','Cabo',510,74],['cb-12','Carolina Flores García','Cabo',445,67],
  ['cb-13','Ignacio Moreno López','Cabo',385,61],['cb-14','Mercedes Jiménez Sánchez','Cabo',330,55],
  ['cb-15','Gonzalo Ruiz García','Cabo',285,49],['cb-16','Virginia Díaz Pérez','Cabo',245,43],
  ['cb-17','Mario Romero Martínez','Cabo',210,38],['cb-18','Fernanda Alonso García','Cabo',180,33],
  ['cb-19','Hugo Navarro López','Cabo',155,28],['cb-20','Yolanda Suárez Sánchez','Cabo',132,23],
  ['cb-21','Dario Molina García','Cabo',112,19],['cb-22','Esperanza Castro Pérez','Cabo',95,15],
  ['cb-23','Arturo Ortega Martínez','Cabo',80,12],['cb-24','Mónica Delgado García','Cabo',68,9],
  ['cb-25','César Ramos López','Cabo',57,7],['cb-26','Sandra Vidal Sánchez','Cabo',48,5],
  ['cb-27','Sebastián Medina García','Cabo',40,3],['cb-28','Inés Reyes Pérez','Cabo',33,2],
  ['cb-29','Felipe Cruz Martínez','Cabo',27,1],['cb-30','Lorena Blanco García','Cabo',22,1],
  ['a-01','Adrián García Fuentes','Anaga',1680,168],['a-02','Francisca Martínez López','Anaga',1520,155],
  ['a-03','Vicente Sánchez García','Anaga',1360,143],['a-04','Remedios López Pérez','Anaga',1210,132],
  ['a-05','Germán González Martínez','Anaga',1075,122],['a-06','Encarnación Pérez García','Anaga',950,113],
  ['a-07','Ramón Rodríguez López','Anaga',840,104],['a-08','Magdalena Fernández Sánchez','Anaga',740,95],
  ['a-09','Joaquín Torres García','Anaga',645,87],['a-10','Asunción Hernández Pérez','Anaga',560,79],
  ['a-11','Ernesto Ramírez Martínez','Anaga',485,72],['a-12','Rocío Flores García','Anaga',420,65],
  ['a-13','Aurelio Moreno López','Anaga',360,58],['a-14','Paloma Jiménez Sánchez','Anaga',310,52],
  ['a-15','Leandro Ruiz García','Anaga',265,46],['a-16','Trinidad Díaz Pérez','Anaga',225,40],
  ['a-17','Valentín Romero Martínez','Anaga',190,35],['a-18','Inmaculada Alonso García','Anaga',160,30],
  ['a-19','Salvador Navarro López','Anaga',135,25],['a-20','Aurora Suárez Sánchez','Anaga',112,21],
  ['a-21','Celestino Molina García','Anaga',93,17],['a-22','Concha Castro Pérez','Anaga',76,13],
  ['a-23','Isidro Ortega Martínez','Anaga',62,10],['a-24','Dolores Delgado García','Anaga',50,7],
  ['a-25','Teodoro Ramos López','Anaga',40,5],['a-26','Soledad Vidal Sánchez','Anaga',33,3],
  ['a-27','Maximino Medina García','Anaga',27,2],['a-28','Ángeles Reyes Pérez','Anaga',22,1],
  ['a-29','Prudencio Cruz Martínez','Anaga',18,1],['a-30','Amparo Blanco García','Anaga',14,1],
];

async function seedSyntheticUsers(c: Client) {
  const midnight = Math.floor(Date.now() / 86_400_000) * 86_400_000;
  const stmts = SYN_USERS.map(([suffix, name, barrio, points, daysAgo]) => ({
    sql: 'INSERT OR IGNORE INTO users (id, username, display_name, barrio, points, created_at) VALUES (?,?,?,?,?,?)',
    args: [`usr-${suffix}`, suffix.replace(/-/g, '.'), name, barrio, points, midnight - daysAgo * DAY] as InValue[],
  }));
  for (let i = 0; i < stmts.length; i += 40) {
    await c.batch(stmts.slice(i, i + 40), 'write');
  }
}

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

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Bbox: sur,oeste,norte,este — casco urbano de Santa Cruz de Tenerife
const BBOX = '28.43,-16.30,28.51,-16.20';
const CACHE_PATH = path.join(process.cwd(), 'data', 'streets-cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 día

export interface StreetLine {
  id: string;
  points: { lat: number; lng: number }[];
}

let memCache: { at: number; data: StreetLine[] } | null = null;

async function fetchStreets(): Promise<StreetLine[]> {
  // 1. Caché en memoria
  if (memCache && Date.now() - memCache.at < CACHE_TTL_MS) return memCache.data;

  // 2. Caché en disco
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
      if (raw.at && Date.now() - raw.at < CACHE_TTL_MS) {
        memCache = raw;
        return raw.data;
      }
    }
  } catch {}

  // 3. Overpass
  const query = `[out:json][timeout:30];(way["highway"](${BBOX}););out body;>;out skel qt;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = await res.json();

  // Mapear nodos
  const nodes = new Map<number, { lat: number; lng: number }>();
  (json.elements as any[]).forEach(el => {
    if (el.type === 'node') nodes.set(el.id, { lat: el.lat, lng: el.lon });
  });

  // Construir líneas por way
  const streets: StreetLine[] = [];
  (json.elements as any[]).forEach(el => {
    if (el.type !== 'way') return;
    const points = (el.nodes as number[])
      .map(id => nodes.get(id))
      .filter(Boolean) as { lat: number; lng: number }[];
    if (points.length >= 2) {
      streets.push({ id: String(el.id), points });
    }
  });

  // Guardar caché
  const entry = { at: Date.now(), data: streets };
  memCache = entry;
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(entry));
  } catch {}

  return streets;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const streets = await fetchStreets();
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(streets);
  } catch (err) {
    console.error('streets API error:', err);
    res.status(500).json({ error: 'No se pudo obtener la red viaria' });
  }
}

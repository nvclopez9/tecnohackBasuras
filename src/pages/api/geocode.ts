import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Proxy de geocodificación sobre Nominatim (OpenStreetMap).
 * Nominatim exige una cabecera User-Agent identificable y limita las
 * peticiones; hacerlo desde el servidor lo hace fiable y permite cachear.
 */

export interface GeoResult {
  display: string;
  label: string;     // tipo legible (Calle, Plaza, Edificio…)
  lat: number;
  lng: number;
}

// Caja envolvente aproximada de la isla de Tenerife (sesgo de resultados).
const VIEWBOX = '-16.95,28.00,-16.10,28.60';

// Cache en memoria muy simple (clave = query normalizada).
const cache = new Map<string, { at: number; data: GeoResult[] }>();
const TTL = 10 * 60 * 1000; // 10 min

function labelFor(type: string, cls: string): string {
  const t = (type || '').toLowerCase();
  if (['residential', 'tertiary', 'secondary', 'primary', 'pedestrian', 'living_street', 'road', 'street'].includes(t)) return 'Calle';
  if (t === 'square') return 'Plaza';
  if (cls === 'amenity') return 'Lugar';
  if (cls === 'building') return 'Edificio';
  if (cls === 'place') return 'Zona';
  return 'Ubicación';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 3) return res.status(200).json([]);

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) {
    res.setHeader('Cache-Control', 'public, s-maxage=600');
    return res.status(200).json(hit.data);
  }

  try {
    const url =
      'https://nominatim.openstreetmap.org/search' +
      `?q=${encodeURIComponent(q + ', Santa Cruz de Tenerife')}` +
      '&format=json&limit=6&addressdetails=0' +
      `&countrycodes=es&viewbox=${VIEWBOX}&bounded=1`;

    const r = await fetch(url, {
      headers: {
        'User-Agent': 'EcoChicharro/1.0 (hackathon prototype; contacto@ecochicharro.app)',
        'Accept-Language': 'es',
      },
    });
    if (!r.ok) return res.status(200).json([]);

    const raw = (await r.json()) as {
      display_name: string; lat: string; lon: string; type: string; class: string;
    }[];

    const data: GeoResult[] = raw.map((d) => ({
      display: d.display_name,
      label: labelFor(d.type, d.class),
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));

    cache.set(key, { at: Date.now(), data });
    res.setHeader('Cache-Control', 'public, s-maxage=600');
    return res.status(200).json(data);
  } catch {
    return res.status(200).json([]);
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { listBins, countBins } from '@/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  if (req.query.count === '1') {
    return res.status(200).json({ count: countBins() });
  }

  // ?type=papelera  OR  ?type=papelera,resto,organico
  const rawType = typeof req.query.type === 'string' ? req.query.type : '';
  const types = rawType ? rawType.split(',').map(t => t.trim()).filter(Boolean) : [];

  const bbox = typeof req.query.bbox === 'string' ? req.query.bbox : undefined;
  const rawLimit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
  const limit = Number.isFinite(rawLimit) ? rawLimit : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;

  const bins = listBins({
    types: types.length > 0 ? types : undefined,
    bbox,
    limit,
    q: q || undefined,
  });
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
  return res.status(200).json(bins);
}

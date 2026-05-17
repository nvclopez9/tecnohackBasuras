import type { NextApiRequest, NextApiResponse } from 'next';
import { listBins, countBins } from '@/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  handle(req, res).catch(err => {
    console.error('bins error:', err);
    res.status(500).json({ error: 'Error interno' });
  });
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end();
    return;
  }

  if (req.query.count === '1') {
    const count = await countBins();
    res.status(200).json({ count });
    return;
  }

  const rawType = typeof req.query.type === 'string' ? req.query.type : '';
  const types = rawType ? rawType.split(',').map(t => t.trim()).filter(Boolean) : [];

  const bbox = typeof req.query.bbox === 'string' ? req.query.bbox : undefined;
  const rawLimit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
  const limit = Number.isFinite(rawLimit) ? rawLimit : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;

  const bins = await listBins({
    types: types.length > 0 ? types : undefined,
    bbox,
    limit,
    q: q || undefined,
  });
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
  res.status(200).json(bins);
}

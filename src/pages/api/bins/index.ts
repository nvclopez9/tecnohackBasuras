import type { NextApiRequest, NextApiResponse } from 'next';
import { listBins, countBins } from '@/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  // ?count=1 → return just the total count (for dashboard)
  if (req.query.count === '1') {
    return res.status(200).json({ count: countBins() });
  }

  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const bbox = typeof req.query.bbox === 'string' ? req.query.bbox : undefined;
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;

  const bins = listBins({ type, bbox, limit: Number.isFinite(limit) ? limit : undefined });
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res.status(200).json(bins);
}

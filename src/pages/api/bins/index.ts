import type { NextApiRequest, NextApiResponse } from 'next';
import { listBins } from '@/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  return res.status(200).json(listBins(type));
}

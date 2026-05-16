import type { NextApiRequest, NextApiResponse } from 'next';
import { getBin } from '@/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).end();
  const bin = getBin(id);
  if (!bin) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json(bin);
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { getBin } from '@/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  handle(req, res).catch(err => {
    console.error('bin detail error:', err);
    res.status(500).json({ error: 'Error interno' });
  });
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end();
    return;
  }
  const { id } = req.query;
  if (typeof id !== 'string') { res.status(400).end(); return; }
  const bin = await getBin(id);
  if (!bin) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(200).json(bin);
}

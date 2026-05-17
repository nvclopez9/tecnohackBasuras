import type { NextApiRequest, NextApiResponse } from 'next';
import { getDefaultUser, listReports } from '@/server/db';
import { UserStats } from '@/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  handle(req, res).catch(err => {
    console.error('me error:', err);
    res.status(500).json({ error: 'Error interno' });
  });
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end();
    return;
  }

  const user = await getDefaultUser();
  const reports = await listReports({ userId: user.id });

  const stats: UserStats = {
    enviadas: reports.length,
    resueltas: reports.filter(r => r.status === 'resuelto').length,
    enProceso: reports.filter(r => r.status === 'en_proceso').length,
    pendientes: reports.filter(r => r.status === 'pendiente').length,
  };

  res.status(200).json({ user, stats });
}

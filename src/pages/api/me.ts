import type { NextApiRequest, NextApiResponse } from 'next';
import { getDefaultUser, listReports } from '@/server/db';
import { UserStats } from '@/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const user = getDefaultUser();
  const reports = listReports({ userId: user.id });

  const stats: UserStats = {
    enviadas: reports.length,
    resueltas: reports.filter(r => r.status === 'resuelto').length,
    enProceso: reports.filter(r => r.status === 'en_proceso').length,
    pendientes: reports.filter(r => r.status === 'pendiente').length,
  };

  return res.status(200).json({ user, stats });
}

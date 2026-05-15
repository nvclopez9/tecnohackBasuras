import type { NextApiRequest, NextApiResponse } from 'next';
import { getReport, updateReport } from '@/server/db';
import { STATUSES } from '@/lib/constants';
import { ReportStatus } from '@/types';

const STATUS_VALUES = STATUSES.map(s => s.status);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID no válido' });
  }

  if (req.method === 'GET') {
    const report = getReport(id);
    if (!report) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json(report);
  }

  if (req.method === 'PATCH') {
    const body = req.body ?? {};
    const changes: { status?: ReportStatus; assignee?: string } = {};

    if (body.status !== undefined) {
      if (!STATUS_VALUES.includes(body.status)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }
      changes.status = body.status;
    }
    if (body.assignee !== undefined) {
      if (typeof body.assignee !== 'string') {
        return res.status(400).json({ error: 'Asignado no válido' });
      }
      changes.assignee = body.assignee;
    }

    const updated = updateReport(id, changes);
    if (!updated) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json(updated);
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).end();
}

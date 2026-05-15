import type { NextApiRequest, NextApiResponse } from 'next';
import { listReports } from '@/server/db';
import { CONTAINERS, INCIDENTS, STATUSES } from '@/lib/constants';
import {
  Stats,
  ReportStatus,
  IncidentType,
  ContainerType,
} from '@/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const reports = listReports();

  const byStatus = {} as Record<ReportStatus, number>;
  STATUSES.forEach(s => (byStatus[s.status] = 0));
  const byIncident = {} as Record<IncidentType, number>;
  INCIDENTS.forEach(i => (byIncident[i.type] = 0));
  const byContainer = {} as Record<ContainerType, number>;
  CONTAINERS.forEach(c => (byContainer[c.type] = 0));

  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    byIncident[r.incidentType] = (byIncident[r.incidentType] ?? 0) + 1;
    byContainer[r.containerType] = (byContainer[r.containerType] ?? 0) + 1;
  }

  const stats: Stats = {
    byStatus,
    byIncident,
    byContainer,
    total: reports.length,
    heatmap: reports.map(r => ({ lat: r.lat, lng: r.lng })),
  };
  return res.status(200).json(stats);
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { listReports, countBins } from '@/server/db';
import { CONTAINERS, INCIDENTS, STATUSES } from '@/lib/constants';
import { Stats, ReportStatus, IncidentType, ContainerType } from '@/types';

const DAY = 86400000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const reports = await listReports();
  const totalBins = await countBins();

  const byStatus = {} as Record<ReportStatus, number>;
  STATUSES.forEach(s => (byStatus[s.status] = 0));
  const byIncident = {} as Record<IncidentType, number>;
  INCIDENTS.forEach(i => (byIncident[i.type] = 0));
  const byContainer = {} as Record<ContainerType, number>;
  CONTAINERS.forEach(c => (byContainer[c.type] = 0));
  const areaMap = new Map<string, number>();

  let highPriority = 0;
  let resolvedSum = 0;
  let resolvedCount = 0;

  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    byIncident[r.incidentType] = (byIncident[r.incidentType] ?? 0) + 1;
    byContainer[r.containerType] = (byContainer[r.containerType] ?? 0) + 1;
    areaMap.set(r.area, (areaMap.get(r.area) ?? 0) + 1);
    if (r.priority === 'alta') highPriority += 1;
    if (r.status === 'resuelto') {
      resolvedSum += Math.max(0, r.updatedAt - r.createdAt) / DAY;
      resolvedCount += 1;
    }
  }

  const byArea = [...areaMap.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  const stats: Stats = {
    byStatus,
    byIncident,
    byContainer,
    byArea,
    total: reports.length,
    totalBins,
    avgResolutionDays: resolvedCount ? +(resolvedSum / resolvedCount).toFixed(1) : 0,
    highPriorityPct: reports.length ? Math.round((highPriority / reports.length) * 100) : 0,
    heatmap: reports.map(r => ({ lat: r.lat, lng: r.lng })),
  };
  return res.status(200).json(stats);
}

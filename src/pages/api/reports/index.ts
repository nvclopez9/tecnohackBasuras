import type { NextApiRequest, NextApiResponse } from 'next';
import { listReports, insertReport, getBin, DEFAULT_USER_ID } from '@/server/db';
import { CONTAINERS, INCIDENTS } from '@/lib/constants';
import { ContainerType, IncidentType } from '@/types';

const CONTAINER_TYPES = CONTAINERS.map(c => c.type);
const INCIDENT_TYPES = INCIDENTS.map(i => i.type);

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const q = req.query;
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
    const reports = await listReports({
      status: str(q.status),
      containerType: str(q.containerType),
      incidentType: str(q.incidentType),
      priority: str(q.priority),
      area: str(q.area),
      userId: str(q.userId),
      binId: str(q.binId),
      ids: typeof q.ids === 'string' ? q.ids.split(',').filter(Boolean) : undefined,
    });
    return res.status(200).json(reports);
  }

  if (req.method === 'POST') {
    const b = req.body ?? {};
    const photo = typeof b.photo === 'string' ? b.photo : '';
    const thumbnail = typeof b.thumbnail === 'string' ? b.thumbnail : '';
    if (
      typeof b.lat !== 'number' ||
      typeof b.lng !== 'number' ||
      !CONTAINER_TYPES.includes(b.containerType) ||
      !INCIDENT_TYPES.includes(b.incidentType)
    ) {
      return res.status(400).json({ error: 'Datos de reporte no válidos' });
    }

    let address = typeof b.address === 'string' ? b.address : '';
    let area = typeof b.area === 'string' ? b.area : '';
    const binId = typeof b.binId === 'string' ? b.binId : '';
    if (binId && (!address || !area)) {
      const bin = await getBin(binId);
      if (bin) {
        address = address || bin.address;
        area = area || bin.area;
      }
    }
    if (!area) area = 'Santa Cruz';

    const report = await insertReport({
      userId: DEFAULT_USER_ID,
      binId,
      photo,
      thumbnail,
      lat: b.lat,
      lng: b.lng,
      address,
      area,
      containerType: b.containerType as ContainerType,
      incidentType: b.incidentType as IncidentType,
      description: typeof b.description === 'string' ? b.description : '',
    });
    return res.status(201).json(report);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}

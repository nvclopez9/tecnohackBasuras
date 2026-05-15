import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { listReports, insertReport } from '@/server/db';
import { priorityFor } from '@/lib/priority';
import { CONTAINERS, INCIDENTS } from '@/lib/constants';
import { Report, ContainerType, IncidentType } from '@/types';

const CONTAINER_TYPES = CONTAINERS.map(c => c.type);
const INCIDENT_TYPES = INCIDENTS.map(i => i.type);

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { status, containerType, incidentType, priority, ids } = req.query;
    const reports = listReports({
      status: typeof status === 'string' ? status : undefined,
      containerType:
        typeof containerType === 'string' ? containerType : undefined,
      incidentType:
        typeof incidentType === 'string' ? incidentType : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      ids:
        typeof ids === 'string'
          ? ids.split(',').filter(Boolean)
          : undefined,
    });
    return res.status(200).json(reports);
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    const {
      photo,
      thumbnail,
      lat,
      lng,
      containerType,
      incidentType,
      description,
    } = body;

    if (
      typeof photo !== 'string' ||
      typeof thumbnail !== 'string' ||
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !CONTAINER_TYPES.includes(containerType) ||
      !INCIDENT_TYPES.includes(incidentType)
    ) {
      return res.status(400).json({ error: 'Datos de reporte no válidos' });
    }

    const now = Date.now();
    const report: Report = {
      id: randomUUID(),
      photo,
      thumbnail,
      lat,
      lng,
      containerType: containerType as ContainerType,
      incidentType: incidentType as IncidentType,
      description: typeof description === 'string' ? description : '',
      status: 'pendiente',
      priority: priorityFor(incidentType as IncidentType),
      assignee: '',
      createdAt: now,
      updatedAt: now,
    };
    insertReport(report);
    return res.status(201).json(report);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}

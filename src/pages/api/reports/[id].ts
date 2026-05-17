import type { NextApiRequest, NextApiResponse } from 'next';
import { getReport, updateReport, deleteReport, ReportChanges } from '@/server/db';
import { STATUSES, CONTAINERS, INCIDENTS } from '@/lib/constants';
import { ReportStatus, ContainerType, IncidentType } from '@/types';

const STATUS_VALUES = STATUSES.map(s => s.status);
const CONTAINER_TYPES = CONTAINERS.map(c => c.type);
const INCIDENT_TYPES = INCIDENTS.map(i => i.type);

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  handle(req, res).catch(err => {
    console.error('report detail error:', err);
    res.status(500).json({ error: 'Error interno' });
  });
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'ID no válido' });
    return;
  }

  if (req.method === 'GET') {
    const report = await getReport(id);
    if (!report) { res.status(404).json({ error: 'No encontrado' }); return; }
    res.status(200).json(report);
    return;
  }

  if (req.method === 'PATCH') {
    const b = req.body ?? {};
    const changes: ReportChanges = {};
    if (b.status !== undefined) {
      if (!STATUS_VALUES.includes(b.status)) { res.status(400).json({ error: 'Estado no válido' }); return; }
      changes.status = b.status as ReportStatus;
    }
    if (b.assignee !== undefined) {
      if (typeof b.assignee !== 'string') { res.status(400).json({ error: 'Asignado no válido' }); return; }
      changes.assignee = b.assignee;
    }
    if (b.resolutionNote !== undefined) {
      if (typeof b.resolutionNote !== 'string') { res.status(400).json({ error: 'Nota no válida' }); return; }
      changes.resolutionNote = b.resolutionNote;
    }
    const updated = await updateReport(id, changes);
    if (!updated) { res.status(404).json({ error: 'No encontrado' }); return; }
    res.status(200).json(updated);
    return;
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    const changes: ReportChanges = {};
    if (b.containerType !== undefined) {
      if (!CONTAINER_TYPES.includes(b.containerType)) { res.status(400).json({ error: 'Tipo de contenedor no válido' }); return; }
      changes.containerType = b.containerType as ContainerType;
    }
    if (b.incidentType !== undefined) {
      if (!INCIDENT_TYPES.includes(b.incidentType)) { res.status(400).json({ error: 'Tipo de incidencia no válido' }); return; }
      changes.incidentType = b.incidentType as IncidentType;
    }
    if (b.description !== undefined) {
      if (typeof b.description !== 'string') { res.status(400).json({ error: 'Descripción no válida' }); return; }
      changes.description = b.description;
    }
    const updated = await updateReport(id, changes);
    if (!updated) { res.status(404).json({ error: 'No encontrado' }); return; }
    res.status(200).json(updated);
    return;
  }

  if (req.method === 'DELETE') {
    const ok = await deleteReport(id);
    if (!ok) { res.status(404).json({ error: 'No encontrado' }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE']);
  res.status(405).end();
}

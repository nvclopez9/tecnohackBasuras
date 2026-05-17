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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID no válido' });
  }

  if (req.method === 'GET') {
    const report = await getReport(id);
    if (!report) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json(report);
  }

  // PATCH — gestión municipal (estado, asignación, nota de resolución)
  if (req.method === 'PATCH') {
    const b = req.body ?? {};
    const changes: ReportChanges = {};
    if (b.status !== undefined) {
      if (!STATUS_VALUES.includes(b.status)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }
      changes.status = b.status as ReportStatus;
    }
    if (b.assignee !== undefined) {
      if (typeof b.assignee !== 'string') return res.status(400).json({ error: 'Asignado no válido' });
      changes.assignee = b.assignee;
    }
    if (b.resolutionNote !== undefined) {
      if (typeof b.resolutionNote !== 'string') return res.status(400).json({ error: 'Nota no válida' });
      changes.resolutionNote = b.resolutionNote;
    }
    const updated = await updateReport(id, changes);
    if (!updated) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json(updated);
  }

  // PUT — edición por el ciudadano (tipo de contenedor, incidencia, descripción)
  if (req.method === 'PUT') {
    const b = req.body ?? {};
    const changes: ReportChanges = {};
    if (b.containerType !== undefined) {
      if (!CONTAINER_TYPES.includes(b.containerType)) {
        return res.status(400).json({ error: 'Tipo de contenedor no válido' });
      }
      changes.containerType = b.containerType as ContainerType;
    }
    if (b.incidentType !== undefined) {
      if (!INCIDENT_TYPES.includes(b.incidentType)) {
        return res.status(400).json({ error: 'Tipo de incidencia no válido' });
      }
      changes.incidentType = b.incidentType as IncidentType;
    }
    if (b.description !== undefined) {
      if (typeof b.description !== 'string') return res.status(400).json({ error: 'Descripción no válida' });
      changes.description = b.description;
    }
    const updated = await updateReport(id, changes);
    if (!updated) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const ok = await deleteReport(id);
    if (!ok) return res.status(404).json({ error: 'No encontrado' });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE']);
  return res.status(405).end();
}

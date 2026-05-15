import { IncidentType, Priority } from '@/types';

const PRIORITY_BY_INCIDENT: Record<IncidentType, Priority> = {
  quemado: 'alta',
  desaparecido: 'alta',
  roto: 'media',
  lleno: 'media',
  sucio: 'baja',
};

export function priorityFor(incidentType: IncidentType): Priority {
  return PRIORITY_BY_INCIDENT[incidentType] ?? 'media';
}

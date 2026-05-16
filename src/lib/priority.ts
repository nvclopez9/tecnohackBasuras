import { IncidentType, Priority } from '@/types';

const PRIORITY_BY_INCIDENT: Record<IncidentType, Priority> = {
  quemado: 'alta',
  desaparecido: 'alta',
  vertido: 'alta',
  roto: 'media',
  lleno: 'media',
  bloqueado: 'media',
  sucio: 'baja',
  mal_olor: 'baja',
};

export function priorityFor(incidentType: IncidentType): Priority {
  return PRIORITY_BY_INCIDENT[incidentType] ?? 'media';
}

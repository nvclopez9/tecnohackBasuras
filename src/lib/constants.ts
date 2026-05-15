import {
  ContainerType,
  IncidentType,
  ReportStatus,
  Priority,
} from '@/types';

export interface ContainerMeta {
  type: ContainerType;
  label: string;
  color: string;
}

export const CONTAINERS: ContainerMeta[] = [
  { type: 'organico', label: 'Orgánico', color: '#8d6e3a' },
  { type: 'envases', label: 'Envases', color: '#e3b505' },
  { type: 'papel', label: 'Papel / Cartón', color: '#2f6fb0' },
  { type: 'vidrio', label: 'Vidrio', color: '#3a9d4a' },
  { type: 'resto', label: 'Resto', color: '#7d7d7d' },
  { type: 'ropa', label: 'Ropa', color: '#c2569b' },
  { type: 'aceite', label: 'Aceite', color: '#d97a2b' },
  { type: 'baterias', label: 'Baterías', color: '#b03a3a' },
];

export interface IncidentMeta {
  type: IncidentType;
  label: string;
  icon: string;
}

export const INCIDENTS: IncidentMeta[] = [
  { type: 'lleno', label: 'Lleno / desbordado', icon: '🗑️' },
  { type: 'roto', label: 'Roto / dañado', icon: '🔧' },
  { type: 'sucio', label: 'Sucio / mal olor', icon: '🦨' },
  { type: 'quemado', label: 'Quemado / vandalizado', icon: '🔥' },
  { type: 'desaparecido', label: 'Desaparecido / desplazado', icon: '❓' },
];

export interface StatusMeta {
  status: ReportStatus;
  label: string;
  color: string;
}

export const STATUSES: StatusMeta[] = [
  { status: 'pendiente', label: 'Pendiente', color: '#e3b505' },
  { status: 'en_proceso', label: 'En proceso', color: '#2f6fb0' },
  { status: 'resuelto', label: 'Resuelto', color: '#3a9d4a' },
];

export interface PriorityMeta {
  priority: Priority;
  label: string;
  color: string;
}

export const PRIORITIES: PriorityMeta[] = [
  { priority: 'baja', label: 'Baja', color: '#3a9d4a' },
  { priority: 'media', label: 'Media', color: '#e3b505' },
  { priority: 'alta', label: 'Alta', color: '#b03a3a' },
];

export const TEAMS = [
  'Equipo Norte',
  'Equipo Sur',
  'Equipo Centro',
  'Recogida especial',
];

export function containerMeta(type: ContainerType): ContainerMeta {
  return CONTAINERS.find(c => c.type === type) ?? CONTAINERS[4];
}

export function incidentMeta(type: IncidentType): IncidentMeta {
  return INCIDENTS.find(i => i.type === type) ?? INCIDENTS[0];
}

export function statusMeta(status: ReportStatus): StatusMeta {
  return STATUSES.find(s => s.status === status) ?? STATUSES[0];
}

export function priorityMeta(priority: Priority): PriorityMeta {
  return PRIORITIES.find(p => p.priority === priority) ?? PRIORITIES[0];
}

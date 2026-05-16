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
  icon: string;
}

export const CONTAINERS: ContainerMeta[] = [
  { type: 'organico', label: 'Orgánico', color: '#8C5A2B', icon: 'leaf' },
  { type: 'envases', label: 'Envases', color: '#F2B100', icon: 'bottle' },
  { type: 'papel', label: 'Papel', color: '#1F6FB2', icon: 'news' },
  { type: 'vidrio', label: 'Vidrio', color: '#2E8B57', icon: 'bottle' },
  { type: 'resto', label: 'Resto', color: '#5C6670', icon: 'bag' },
  { type: 'ropa', label: 'Ropa', color: '#E07A2C', icon: 'shirt' },
  { type: 'aceite', label: 'Aceite', color: '#C99700', icon: 'drop' },
  { type: 'baterias', label: 'Baterías', color: '#A4243B', icon: 'battery' },
  { type: 'papelera', label: 'Papelera', color: '#607D8B', icon: 'bag' },
  { type: 'mixto', label: 'Restos', color: '#795548', icon: 'bag' },
  { type: 'electrico', label: 'Eléctrico / RAEE', color: '#FFA000', icon: 'flash' },
];

export interface IncidentMeta {
  type: IncidentType;
  label: string;
  icon: string;
  priority: Priority;
}

export const INCIDENTS: IncidentMeta[] = [
  { type: 'lleno', label: 'Lleno / desbordado', icon: 'bag', priority: 'media' },
  { type: 'roto', label: 'Roto / dañado', icon: 'edit', priority: 'media' },
  { type: 'sucio', label: 'Sucio / mal olor', icon: 'drop', priority: 'baja' },
  { type: 'quemado', label: 'Quemado / vandalizado', icon: 'flame', priority: 'alta' },
  { type: 'desaparecido', label: 'Desaparecido / desplazado', icon: 'question', priority: 'alta' },
  { type: 'bloqueado', label: 'Bloqueado / inaccesible', icon: 'x', priority: 'media' },
  { type: 'mal_olor', label: 'Mal olor persistente', icon: 'drop', priority: 'baja' },
  { type: 'vertido', label: 'Vertido ilegal', icon: 'flame', priority: 'alta' },
];

export interface StatusMeta {
  status: ReportStatus;
  label: string;
  color: string;
}

export const STATUSES: StatusMeta[] = [
  { status: 'pendiente', label: 'Pendiente', color: '#E8A317' },
  { status: 'en_proceso', label: 'En proceso', color: '#005A9C' },
  { status: 'resuelto', label: 'Resuelto', color: '#2E8B57' },
];

export interface PriorityMeta {
  priority: Priority;
  label: string;
  color: string;
}

export const PRIORITIES: PriorityMeta[] = [
  { priority: 'baja', label: 'Baja', color: '#5A8FA8' },
  { priority: 'media', label: 'Media', color: '#E8A317' },
  { priority: 'alta', label: 'Alta', color: '#C0392B' },
];

export const TEAMS = [
  'Equipo Centro',
  'Equipo Anaga',
  'Equipo Salud-Ofra',
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

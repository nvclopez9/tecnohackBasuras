export type ContainerType =
  | 'organico'
  | 'envases'
  | 'papel'
  | 'vidrio'
  | 'resto'
  | 'ropa'
  | 'aceite'
  | 'baterias';

export type IncidentType =
  | 'lleno'
  | 'roto'
  | 'sucio'
  | 'quemado'
  | 'desaparecido';

export type ReportStatus = 'pendiente' | 'en_proceso' | 'resuelto';

export type Priority = 'baja' | 'media' | 'alta';

export type Role = 'ciudadano' | 'municipal';

export interface Bin {
  id: string;
  type: ContainerType;
  lat: number;
  lng: number;
  address: string;
  area: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  createdAt: number;
}

export interface Report {
  id: string;
  code: string;
  userId: string;
  binId: string;
  photo: string;
  thumbnail: string;
  lat: number;
  lng: number;
  address: string;
  area: string;
  containerType: ContainerType;
  incidentType: IncidentType;
  description: string;
  status: ReportStatus;
  priority: Priority;
  assignee: string;
  resolutionNote: string;
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  reportId: string;
  authorRole: Role;
  text: string;
  createdAt: number;
}

export interface UserStats {
  enviadas: number;
  resueltas: number;
  enProceso: number;
  pendientes: number;
}

export interface Stats {
  byStatus: Record<ReportStatus, number>;
  byIncident: Record<IncidentType, number>;
  byContainer: Record<ContainerType, number>;
  byArea: { area: string; count: number }[];
  total: number;
  avgResolutionDays: number;
  highPriorityPct: number;
  heatmap: { lat: number; lng: number }[];
}

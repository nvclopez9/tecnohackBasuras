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

export interface Report {
  id: string;
  photo: string;
  thumbnail: string;
  lat: number;
  lng: number;
  containerType: ContainerType;
  incidentType: IncidentType;
  description: string;
  status: ReportStatus;
  priority: Priority;
  assignee: string;
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

export interface LightboxState {
  isOpen: boolean;
  reportId: string | null;
}

export interface Stats {
  byStatus: Record<ReportStatus, number>;
  byIncident: Record<IncidentType, number>;
  byContainer: Record<ContainerType, number>;
  total: number;
  heatmap: { lat: number; lng: number }[];
}

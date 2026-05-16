import { useState, useEffect, useCallback, useRef } from 'react';
import { Report, ReportStatus, ContainerType, IncidentType } from '@/types';

export interface ReportFilterParams {
  status?: string;
  containerType?: string;
  incidentType?: string;
  priority?: string;
  area?: string;
  userId?: string;
  ids?: string[];
}

function buildQuery(filters: ReportFilterParams): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined) return;
    params.set(k, Array.isArray(v) ? v.join(',') : v);
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

interface Options {
  filters?: ReportFilterParams;
  poll?: boolean;
}

export interface NewReportPayload {
  photo: string;
  thumbnail: string;
  lat: number;
  lng: number;
  containerType: ContainerType;
  incidentType: IncidentType;
  description: string;
  binId?: string;
  address?: string;
  area?: string;
}

export function useReports({ filters = {}, poll = false }: Options = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const query = buildQuery(filters);
  const skip = filters.ids !== undefined && filters.ids.length === 0;

  const load = useCallback(async () => {
    if (skip) {
      setReports([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/reports${query}`);
      setReports(await res.json());
    } catch {
      // reintento en el siguiente poll
    } finally {
      setLoading(false);
    }
  }, [query, skip]);

  const pollRef = useRef(poll);
  pollRef.current = poll;

  useEffect(() => {
    load();
    if (!pollRef.current) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const addReport = useCallback(async (input: NewReportPayload): Promise<Report> => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('No se pudo crear el reporte');
    const report: Report = await res.json();
    setReports(prev => [report, ...prev]);
    return report;
  }, []);

  const updateReport = useCallback(
    async (
      id: string,
      changes: { status?: ReportStatus; assignee?: string; resolutionNote?: string }
    ): Promise<Report> => {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error('No se pudo actualizar el reporte');
      const updated: Report = await res.json();
      setReports(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      return updated;
    },
    []
  );

  const editReport = useCallback(
    async (
      id: string,
      changes: { containerType?: ContainerType; incidentType?: IncidentType; description?: string }
    ): Promise<Report> => {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error('No se pudo editar el reporte');
      const updated: Report = await res.json();
      setReports(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      return updated;
    },
    []
  );

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('No se pudo borrar el reporte');
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  // Mezcla un reporte ya actualizado en el estado local (sin red).
  const mergeReport = useCallback((report: Report) => {
    setReports(prev => prev.map(r => (r.id === report.id ? report : r)));
  }, []);

  return { reports, loading, addReport, updateReport, editReport, deleteReport, mergeReport, reload: load };
}

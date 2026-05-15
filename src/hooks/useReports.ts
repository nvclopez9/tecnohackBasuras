import { useState, useEffect, useCallback, useRef } from 'react';
import { Report, ReportStatus } from '@/types';

export interface ReportFilterParams {
  status?: string;
  containerType?: string;
  incidentType?: string;
  priority?: string;
  ids?: string[];
}

function buildQuery(filters: ReportFilterParams): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.containerType) params.set('containerType', filters.containerType);
  if (filters.incidentType) params.set('incidentType', filters.incidentType);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.ids) params.set('ids', filters.ids.join(','));
  const q = params.toString();
  return q ? `?${q}` : '';
}

interface Options {
  filters?: ReportFilterParams;
  poll?: boolean;
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
      const data = await res.json();
      setReports(data);
    } catch {
      // ignorar fallos de red transitorios; se reintenta en el siguiente poll
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

  const addReport = useCallback(
    async (input: {
      photo: string;
      thumbnail: string;
      lat: number;
      lng: number;
      containerType: string;
      incidentType: string;
      description: string;
    }): Promise<Report> => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('No se pudo crear el reporte');
      const report: Report = await res.json();
      setReports(prev => [report, ...prev]);
      return report;
    },
    []
  );

  const updateReport = useCallback(
    async (
      id: string,
      changes: { status?: ReportStatus; assignee?: string }
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

  return { reports, loading, addReport, updateReport, reload: load };
}

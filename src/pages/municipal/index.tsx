import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useCallback, useEffect } from 'react';
import FilterBar, { Filters } from '@/components/FilterBar';
import ReportDetail from '@/components/ReportDetail';
import { useReports } from '@/hooks/useReports';
import { getRole } from '@/lib/storage';
import { containerMeta, incidentMeta, statusMeta, priorityMeta } from '@/lib/constants';
import { Report } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-mono)',
    }}>
      Cargando mapa…
    </div>
  ),
});

type ViewMode = 'mapa' | 'lista';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

function ListItem({ report, onClick }: { report: Report; onClick: () => void }) {
  const cm = containerMeta(report.containerType);
  const im = incidentMeta(report.incidentType);
  const sm = statusMeta(report.status);
  const pm = priorityMeta(report.priority);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', gap: '10px', padding: '10px 12px',
        background: '#16213e',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `4px solid ${pm.color}`,
        textAlign: 'left', width: '100%',
        transition: 'background 0.1s',
      }}
      className={report.priority === 'alta' ? 'priority-alta' : undefined}
    >
      <img
        src={report.thumbnail} alt=""
        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {im.icon} {im.label}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', flexShrink: 0, marginLeft: '8px' }}>
            {new Date(report.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
          <Badge label={cm.label} color={cm.color} />
          <Badge label={sm.label} color={sm.color} />
          {report.assignee && (
            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,242,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {report.assignee}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

const EMPTY_FILTERS: Filters = { status: '', containerType: '', incidentType: '', priority: '' };

export default function MunicipalPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('mapa');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (getRole() !== 'municipal') router.replace('/');
  }, [router]);

  const { reports, updateReport } = useReports({
    filters: {
      status: filters.status || undefined,
      containerType: filters.containerType || undefined,
      incidentType: filters.incidentType || undefined,
      priority: filters.priority || undefined,
    },
    poll: true,
  });

  const selectedReport = reports.find(r => r.id === selectedId) ?? null;

  const handleUpdate = useCallback(
    async (changes: { status?: import('@/types').ReportStatus; assignee?: string }) => {
      if (!selectedId) return;
      await updateReport(selectedId, changes);
    },
    [selectedId, updateReport]
  );

  return (
    <>
      <Head>
        <title>EcoChicharro · Municipal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--bg)',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.8rem 1rem 0.6rem',
          background: '#0d0f1a',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.1rem', padding: '2px 6px' }}>
              ←
            </button>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.01em', lineHeight: 1 }}>
                Panel Municipal
              </h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                ECOCHICHARRO · actualizando en tiempo real
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => router.push('/municipal/dashboard')}
              style={{
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(47,111,176,0.2)', border: '1px solid rgba(47,111,176,0.4)',
                color: '#2f6fb0', fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              }}
            >
              📊 Dashboard
            </button>
            {/* View toggle */}
            <div style={{ display: 'flex', background: '#1c2a4a', borderRadius: '8px', overflow: 'hidden' }}>
              {(['mapa', 'lista'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 12px', border: 'none',
                    background: view === v ? 'rgba(0,255,136,0.15)' : 'transparent',
                    color: view === v ? 'var(--accent)' : 'var(--muted)',
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                    borderRadius: '8px',
                  }}
                >
                  {v === 'mapa' ? '🗺' : '☰'} {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ flexShrink: 0 }}>
          <FilterBar filters={filters} onChange={setFilters} total={reports.length} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {view === 'mapa' ? (
            <MapView reports={reports} onMarkerClick={id => setSelectedId(id)} />
          ) : (
            <div style={{ height: '100%', overflowY: 'auto' }}>
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                    Sin resultados
                  </p>
                  <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    Ajusta los filtros o espera nuevos reportes.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {reports.map(r => (
                    <ListItem key={r.id} report={r} onClick={() => setSelectedId(r.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedReport && (
        <ReportDetail
          report={selectedReport}
          role="municipal"
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { getMyReportIds, getRole } from '@/lib/storage';
import { containerMeta, incidentMeta, statusMeta, priorityMeta } from '@/lib/constants';
import { Report } from '@/types';
import ReportDetail from '@/components/ReportDetail';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

function ReportCard({ report, onClick }: { report: Report; onClick: () => void }) {
  const cm = containerMeta(report.containerType);
  const im = incidentMeta(report.incidentType);
  const sm = statusMeta(report.status);
  const pm = priorityMeta(report.priority);
  const date = new Date(report.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', gap: '12px', padding: '12px',
        background: '#16213e', borderRadius: '12px',
        border: `1px solid ${cm.color}33`,
        borderLeft: `4px solid ${cm.color}`,
        textAlign: 'left', width: '100%',
        transition: 'background 0.15s',
      }}
    >
      <img
        src={report.thumbnail}
        alt=""
        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {im.icon} {im.label}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', flexShrink: 0, marginLeft: '8px' }}>
            {date}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          <Badge label={cm.label} color={cm.color} />
          <Badge label={sm.label} color={sm.color} />
          <Badge label={pm.label} color={pm.color} />
        </div>
      </div>
    </button>
  );
}

export default function MisReportesPage() {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (getRole() !== 'ciudadano') { router.replace('/'); return; }
    setIds(getMyReportIds());
  }, [router]);

  const { reports, loading, updateReport } = useReports({
    filters: { ids },
  });

  const selected = reports.find(r => r.id === selectedId) ?? null;

  return (
    <>
      <Head>
        <title>EcoChicharro · Mis reportes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="page-scroll" style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem 2rem' }}>

          {/* Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            padding: '1rem 0 0.75rem',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => router.push('/ciudadano')}
                style={{
                  background: 'none', border: 'none', color: 'var(--muted)',
                  fontSize: '1.2rem', padding: '4px',
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '1.5rem', letterSpacing: '-0.01em',
                }}>
                  Mis reportes
                </h1>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)' }}>
                  {ids.length} enviados · toca para ver detalles
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading && ids.length > 0 ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '2rem' }}>
              Cargando…
            </p>
          ) : ids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                Aún no has enviado reportes
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                Usa el botón 📷 en el mapa para reportar un contenedor
              </p>
              <button
                onClick={() => router.push('/ciudadano')}
                style={{
                  marginTop: '1.5rem', padding: '12px 24px',
                  background: 'var(--accent)', color: '#0d0f1a',
                  border: 'none', borderRadius: '12px',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
                }}
              >
                Ir al mapa
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reports.map(r => (
                <ReportCard key={r.id} report={r} onClick={() => setSelectedId(r.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ReportDetail
          report={selected}
          role="ciudadano"
          onClose={() => setSelectedId(null)}
          onUpdate={async (changes) => { await updateReport(selected.id, changes); }}
        />
      )}
    </>
  );
}

import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getRole } from '@/lib/storage';
import { CONTAINERS, INCIDENTS, STATUSES } from '@/lib/constants';
import { Stats } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-mono)',
    }}>
      Cargando mapa…
    </div>
  ),
});

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: '#16213e', borderRadius: '12px',
      padding: '1rem', border: `1px solid ${color}33`,
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
        letterSpacing: '0.08em', color: 'rgba(240,242,255,0.4)',
        textTransform: 'uppercase', marginBottom: '6px',
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: '2rem', color,
      }}>
        {value}
      </p>
    </div>
  );
}

function BarChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{
      background: '#16213e', borderRadius: '12px', padding: '1rem',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
        letterSpacing: '0.08em', color: 'rgba(240,242,255,0.4)',
        textTransform: 'uppercase', marginBottom: '12px',
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(d => (
          <div key={d.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(240,242,255,0.7)' }}>
                {d.label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: d.color, fontWeight: 500 }}>
                {d.value}
              </span>
            </div>
            <div style={{
              height: '6px', background: 'rgba(255,255,255,0.06)',
              borderRadius: '3px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(d.value / max) * 100}%`,
                background: d.color,
                borderRadius: '3px',
                transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (getRole() !== 'municipal') { router.replace('/'); return; }
    const load = () =>
      fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [router]);

  const pendiente = stats?.byStatus.pendiente ?? 0;
  const en_proceso = stats?.byStatus.en_proceso ?? 0;
  const resuelto = stats?.byStatus.resuelto ?? 0;
  const total = stats?.total ?? 0;

  const byIncidentData = INCIDENTS.map(i => ({
    label: `${i.icon} ${i.label}`,
    value: stats?.byIncident[i.type] ?? 0,
    color: '#fff',
  }));

  const byContainerData = CONTAINERS.map(c => ({
    label: c.label,
    value: stats?.byContainer[c.type] ?? 0,
    color: c.color,
  }));

  // Fake heatmap reports (only lat/lng needed, no photo/other fields)
  const heatmapReports = (stats?.heatmap ?? []).map((p, i) => ({
    id: `h${i}`,
    photo: '', thumbnail: '',
    lat: p.lat, lng: p.lng,
    containerType: 'resto' as const,
    incidentType: 'lleno' as const,
    description: '', status: 'pendiente' as const,
    priority: 'baja' as const, assignee: '',
    createdAt: 0, updatedAt: 0,
  }));

  return (
    <>
      <Head>
        <title>EcoChicharro · Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="page-scroll" style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1rem 3rem' }}>

          {/* Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            padding: '1rem 0 0.75rem',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1.2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => router.push('/municipal')}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', padding: '4px' }}
              >
                ←
              </button>
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '1.6rem', letterSpacing: '-0.02em',
                }}>
                  Dashboard
                </h1>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)' }}>
                  ECOCHICHARRO · actualización cada 10 s
                </p>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '1rem' }}>
            <StatCard label="Total reportes" value={total} color="var(--accent)" />
            <StatCard label="Pendientes" value={pendiente} color="#ffc048" />
            <StatCard label="En proceso" value={en_proceso} color="#2f6fb0" />
            <StatCard label="Resueltos" value={resuelto} color="#3a9d4a" />
          </div>

          {/* Status bar */}
          {total > 0 && (
            <div style={{
              background: '#16213e', borderRadius: '12px', padding: '1rem',
              marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                letterSpacing: '0.08em', color: 'rgba(240,242,255,0.4)',
                textTransform: 'uppercase', marginBottom: '10px',
              }}>
                Distribución por estado
              </p>
              <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', gap: '2px' }}>
                {STATUSES.map(s => {
                  const count = stats?.byStatus[s.status] ?? 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return pct > 0 ? (
                    <div
                      key={s.status}
                      title={`${s.label}: ${count}`}
                      style={{
                        height: '100%', width: `${pct}%`,
                        background: s.color, transition: 'width 0.5s',
                      }}
                    />
                  ) : null;
                })}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {STATUSES.map(s => (
                  <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '1rem' }}>
            <BarChart title="Incidencias por tipo" data={byIncidentData} />
            <BarChart title="Por tipo de contenedor" data={byContainerData} />
          </div>

          {/* Heatmap */}
          <div style={{
            background: '#16213e', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '1rem 1rem 0.5rem' }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                letterSpacing: '0.08em', color: 'rgba(240,242,255,0.4)',
                textTransform: 'uppercase',
              }}>
                Mapa de calor · densidad de incidencias
              </p>
            </div>
            <div style={{ height: '280px', position: 'relative' }}>
              {heatmapReports.length > 0 ? (
                <MapView
                  reports={heatmapReports}
                  onMarkerClick={() => {}}
                  showHeatmap={true}
                />
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: 'var(--muted)', fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                }}>
                  Sin datos suficientes para el mapa de calor
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

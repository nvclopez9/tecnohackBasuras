import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button, Badge } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { containerMeta, statusMeta, incidentMeta } from '@/lib/constants';
import { Bin, Report, ReportStatus } from '@/types';

const T = THEME;

function fmtWhen(ts: number): string {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const diff = Math.floor((today.getTime() - new Date(d).setHours(0, 0, 0, 0)) / dayMs);
  const hhmm = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (diff <= 0) return `Hoy ${hhmm}`;
  if (diff === 1) return `Ayer ${hhmm}`;
  if (diff < 7) return `Hace ${diff} días`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function ContenedorDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [bin, setBin] = useState<Bin | null>(null);
  const [incidents, setIncidents] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    Promise.all([
      fetch(`/api/bins/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/reports?binId=${id}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([b, reps]: [Bin | null, Report[]]) => {
        setBin(b);
        setIncidents(Array.isArray(reps) ? reps : []);
      })
      .catch(() => setBin(null))
      .finally(() => setLoading(false));
  }, [id]);

  const addToRoute = () => {
    if (!bin) return;
    let route: Bin[] = [];
    try { route = JSON.parse(sessionStorage.getItem('route') || '[]'); } catch { route = []; }
    if (!route.some((b) => b.id === bin.id)) route.push(bin);
    sessionStorage.setItem('route', JSON.stringify(route));
    router.push('/ciudadano/ruta');
  };

  if (loading) {
    return (
      <CitizenLayout title="Contenedor">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkMid, fontSize: 14 }}>
          Cargando…
        </div>
      </CitizenLayout>
    );
  }

  if (!bin) {
    return (
      <CitizenLayout title="Contenedor no encontrado">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Icon name="question" size={40} color={T.inkLight} />
          <div style={{ color: T.inkMid, fontSize: 14 }}>Contenedor no encontrado</div>
          <Button kind="secondary" onClick={() => router.back()}>Volver</Button>
        </div>
      </CitizenLayout>
    );
  }

  const meta = containerMeta(bin.type);
  const latestStatus: ReportStatus = incidents[0]?.status ?? 'resuelto';
  const openCount = incidents.filter((r) => r.status !== 'resuelto').length;
  const sm = statusMeta(latestStatus);

  return (
    <CitizenLayout title={`Contenedor · ${meta.label}`} hideNav={false}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 200, zIndex: 20,
        background: `linear-gradient(135deg, ${meta.color}DD 0%, ${meta.color}88 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 16, left: 14,
            width: 36, height: 36, borderRadius: 999,
            background: 'rgba(0,0,0,.25)', border: 'none',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="arrow-l" size={20} color="#fff" />
        </button>
        <div style={{
          position: 'absolute', top: 18, right: 14,
          background: 'rgba(0,0,0,.40)', borderRadius: 6,
          padding: '3px 8px', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        }}>
          {bin.id}
        </div>
        <div style={{
          width: 80, height: 80, borderRadius: 999,
          background: 'rgba(255,255,255,.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          border: '2px solid rgba(255,255,255,.35)',
        }}>
          <Icon name={containerIconName(bin.type)} size={42} color="#fff" />
        </div>
      </div>

      {/* Body */}
      <div
        className="thin-scroll"
        style={{
          position: 'absolute', top: 200, left: 0, right: 0, bottom: NAV_HEIGHT + 62,
          overflowY: 'auto', padding: '16px 16px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: meta.color, flex: '0 0 10px', marginTop: 5 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>
              Contenedor de {meta.label.toLowerCase()}
            </div>
          </div>
          {incidents.length > 0 && <Badge color={sm.color} label={sm.label} />}
        </div>

        <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 16, paddingLeft: 18 }}>
          {bin.address} · {bin.area}
        </div>

        {/* Hechos clave */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Hechos clave</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, color: T.inkMid }}>Incidencias registradas</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{incidents.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, color: T.inkMid }}>Sin resolver</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: openCount > 0 ? T.warn : T.success }}>{openCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: T.inkMid }}>Coordenadas</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{bin.lat.toFixed(4)}, {bin.lng.toFixed(4)}</span>
          </div>
        </div>

        {/* Incidencias reales del contenedor */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Incidencias recientes</div>
          {incidents.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.inkMid, fontSize: 12.5 }}>
              <Icon name="check" size={15} color={T.success} />
              Sin incidencias reportadas en este contenedor.
            </div>
          ) : (
            incidents.map((inc, i, a) => {
              const s = statusMeta(inc.status);
              const im = incidentMeta(inc.incidentType);
              return (
                <div
                  key={inc.id}
                  onClick={() => router.push(`/ciudadano/incidencias/${inc.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    paddingBottom: i < a.length - 1 ? 10 : 0,
                    borderBottom: i < a.length - 1 ? `1px solid ${T.borderSoft}` : 'none',
                    marginBottom: i < a.length - 1 ? 10 : 0,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flex: '0 0 8px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.ink }}>{im.label}</div>
                    <div style={{ fontSize: 11, color: T.inkMid }}>{inc.code} · {fmtWhen(inc.createdAt)}</div>
                  </div>
                  <Badge color={s.color} label={s.label} size="sm" />
                </div>
              );
            })
          )}
        </div>
        <div style={{ height: 8 }} />
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT,
        background: T.surface, borderTop: `1px solid ${T.border}`,
        padding: '10px 14px', display: 'flex', gap: 10, zIndex: 30,
      }}>
        <Button
          kind="secondary" size="md" full
          icon={<Icon name="route" size={16} />}
          onClick={addToRoute}
        >
          A ruta
        </Button>
        <Button
          kind="primary" size="md" full
          icon={<Icon name="camera" size={16} />}
          onClick={() => router.push(`/ciudadano/reportar?binId=${bin.id}&containerType=${bin.type}`)}
        >
          Reportar
        </Button>
      </div>
    </CitizenLayout>
  );
}

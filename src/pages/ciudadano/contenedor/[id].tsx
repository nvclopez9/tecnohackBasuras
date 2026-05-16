import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button, Badge } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { containerMeta, statusMeta } from '@/lib/constants';
import { Bin, ContainerType, ReportStatus } from '@/types';

const T = THEME;

// Incidencias mock por tipo
const MOCK_INCIDENTS: Record<ContainerType, { label: string; date: string; status: ReportStatus }[]> = {
  organico: [
    { label: 'Desbordado — restos esparcidos', date: 'Hoy 09:22', status: 'en_proceso' },
    { label: 'Mal olor', date: 'Ayer 15:40', status: 'resuelto' },
    { label: 'Tapa rota', date: 'Hace 3 días', status: 'resuelto' },
  ],
  envases: [
    { label: 'Lleno / desbordado', date: 'Hoy 11:05', status: 'pendiente' },
    { label: 'Bolsas fuera del contenedor', date: 'Ayer 18:30', status: 'resuelto' },
    { label: 'Pintadas en tapa', date: 'Hace 5 días', status: 'resuelto' },
  ],
  papel: [
    { label: 'Lleno, papel en el suelo', date: 'Ayer 08:15', status: 'en_proceso' },
    { label: 'Mojado por lluvia', date: 'Hace 2 días', status: 'resuelto' },
  ],
  vidrio: [
    { label: 'Vidrio roto en el suelo', date: 'Hoy 07:00', status: 'pendiente' },
    { label: 'Ruido excesivo de noche', date: 'Ayer 23:10', status: 'resuelto' },
    { label: 'Lleno', date: 'Hace 4 días', status: 'resuelto' },
  ],
  resto: [
    { label: 'Lleno y desbordado', date: 'Hoy 10:40', status: 'en_proceso' },
    { label: 'Mal olor', date: 'Ayer 14:00', status: 'resuelto' },
    { label: 'Tapa trabada', date: 'Hace 2 días', status: 'resuelto' },
  ],
  ropa: [
    { label: 'Ropa fuera del contenedor', date: 'Hoy 08:30', status: 'pendiente' },
    { label: 'Cerradura rota', date: 'Hace 3 días', status: 'resuelto' },
  ],
  aceite: [
    { label: 'Lleno — boca bloqueada', date: 'Ayer 17:25', status: 'en_proceso' },
    { label: 'Derrame en el suelo', date: 'Hace 6 días', status: 'resuelto' },
  ],
  baterias: [
    { label: 'Sellado incorrecto', date: 'Hace 2 días', status: 'pendiente' },
    { label: 'Lleno', date: 'Hace 7 días', status: 'resuelto' },
  ],
  papelera: [
    { label: 'Llena y desbordada', date: 'Hoy 09:00', status: 'pendiente' },
    { label: 'Pintadas en superficie', date: 'Hace 4 días', status: 'resuelto' },
  ],
  mixto: [
    { label: 'Materiales mezclados incorrectamente', date: 'Ayer 16:00', status: 'en_proceso' },
  ],
  electrico: [
    { label: 'Lleno — no caben más aparatos', date: 'Hace 3 días', status: 'pendiente' },
  ],
};

export default function ContenedorDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [bin, setBin] = useState<Bin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bins/${id}`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then((b: Bin) => setBin(b))
      .catch(() => setBin(null))
      .finally(() => setLoading(false));
  }, [id]);

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
  const incidents = MOCK_INCIDENTS[bin.type] ?? [];
  const latestStatus: ReportStatus = incidents[0]?.status ?? 'pendiente';
  const sm = statusMeta(latestStatus);

  return (
    <CitizenLayout title={`Contenedor · ${meta.label}`} hideNav={false}>
      {/* Header foto */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 200, zIndex: 20,
        background: `linear-gradient(135deg, ${meta.color}DD 0%, ${meta.color}88 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Botón volver */}
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
        {/* Bin ID chip */}
        <div style={{
          position: 'absolute', top: 18, right: 14,
          background: 'rgba(0,0,0,.40)', borderRadius: 6,
          padding: '3px 8px', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        }}>
          {bin.id}
        </div>
        {/* Icon grande */}
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

      {/* Body scrollable */}
      <div
        className="thin-scroll"
        style={{
          position: 'absolute', top: 200, left: 0, right: 0, bottom: NAV_HEIGHT + 62,
          overflowY: 'auto', padding: '16px 16px 0',
        }}
      >
        {/* Título + badge estado */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: meta.color, flex: '0 0 10px', marginTop: 5 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>
              Contenedor de {meta.label.toLowerCase()}
            </div>
          </div>
          <Badge color={sm.color} label={sm.label} />
        </div>

        {/* Dirección */}
        <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 4, paddingLeft: 18 }}>
          {bin.address} · {bin.area}
        </div>
        <div style={{ fontSize: 12, color: T.primarySoft, paddingLeft: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="locate" size={12} color={T.primarySoft} />
          a 120 m de ti
        </div>

        {/* Hechos clave */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Hechos clave</div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12.5, color: T.inkMid }}>Coordenadas</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{bin.lat.toFixed(4)}, {bin.lng.toFixed(4)}</span>
          </div>
        </div>

        {/* Incidencias recientes */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Incidencias recientes</div>
          {incidents.map((inc, i, a) => {
            const s = statusMeta(inc.status);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                paddingBottom: i < a.length - 1 ? 10 : 0,
                borderBottom: i < a.length - 1 ? `1px solid ${T.borderSoft}` : 'none',
                marginBottom: i < a.length - 1 ? 10 : 0,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flex: '0 0 8px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: T.ink }}>{inc.label}</div>
                  <div style={{ fontSize: 11, color: T.inkMid }}>{inc.date}</div>
                </div>
                <Badge color={s.color} label={s.label} size="sm" />
              </div>
            );
          })}
        </div>
        <div style={{ height: 8 }} />
      </div>

      {/* Footer botones */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT,
        background: T.surface, borderTop: `1px solid ${T.border}`,
        padding: '10px 14px', display: 'flex', gap: 10, zIndex: 30,
      }}>
        <Button
          kind="secondary" size="md" full
          icon={<Icon name="route" size={16} />}
          onClick={() => router.push('/ciudadano/ruta')}
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

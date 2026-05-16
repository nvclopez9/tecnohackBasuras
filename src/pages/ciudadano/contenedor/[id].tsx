import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button, Badge } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { containerMeta, statusMeta } from '@/lib/constants';
import { ECO_HOURLY, bestHourTip } from '@/lib/gamification';
import { Bin, ContainerType, ReportStatus } from '@/types';

const T = THEME;

function barColor(v: number): string {
  if (v < 0.35) return T.success;
  if (v < 0.55) return T.primary;
  if (v < 0.75) return T.warn;
  return T.danger;
}

function satLabel(v: number): string {
  if (v >= 0.75) return 'Probablemente lleno en este momento';
  if (v >= 0.55) return 'Bastante ocupado — considera volver más tarde';
  if (v >= 0.35) return 'Con algo de espacio disponible';
  return 'Buen momento para reciclar';
}

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
};

export default function ContenedorDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [bin, setBin] = useState<Bin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/bins')
      .then(r => r.json())
      .then((bins: Bin[]) => {
        const found = bins.find(b => b.id === id);
        setBin(found ?? null);
      })
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
  const hourlyData = ECO_HOURLY[bin.type] ?? ECO_HOURLY.resto;
  const currentHour = new Date().getHours();
  const currentSat = hourlyData[currentHour];
  const { bestHour, peakHour, peakPct } = bestHourTip(bin.type);

  // SVG gauge
  const R = 44;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * (1 - currentSat);
  const gaugeColor = barColor(currentSat);

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

        {/* Gauge de saturación */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={R} stroke={T.border} strokeWidth={8} fill="none" />
            <circle
              cx={50} cy={50} r={R}
              stroke={gaugeColor} strokeWidth={8} fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text x={50} y={46} textAnchor="middle" fontSize={18} fontWeight={700} fill={gaugeColor}>{Math.round(currentSat * 100)}%</text>
            <text x={50} y={62} textAnchor="middle" fontSize={9} fill={T.inkMid}>ahora</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Saturación actual</div>
            <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.4 }}>{satLabel(currentSat)}</div>
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: gaugeColor + '22', borderRadius: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: gaugeColor }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: gaugeColor }}>{barColor(currentSat) === T.success ? 'Buen momento' : barColor(currentSat) === T.danger ? 'Evitar ahora' : 'Ocupación media'}</span>
            </div>
          </div>
        </div>

        {/* Patrón horario */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Patrón horario</div>
          {/* Barras */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 52 }}>
            {hourlyData.map((v, h) => {
              const isCurrent = h === currentHour;
              return (
                <div
                  key={h}
                  style={{
                    flex: 1,
                    height: `${Math.max(8, Math.round(v * 52))}px`,
                    background: barColor(v),
                    borderRadius: 3,
                    opacity: isCurrent ? 1 : 0.65,
                    outline: isCurrent ? `2px solid ${T.ink}` : 'none',
                    outlineOffset: 1,
                  }}
                />
              );
            })}
          </div>
          {/* Labels hora */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {['00', '06', '12', '18', '23'].map(l => (
              <span key={l} style={{ fontSize: 9.5, color: T.inkLight, fontVariantNumeric: 'tabular-nums' }}>{l}</span>
            ))}
          </div>
          {/* Tarjetas mejor/peor */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{
              flex: 1, background: T.success + '15', border: `1px solid ${T.success}40`,
              borderRadius: 8, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: T.success, marginBottom: 2 }}>✓ Suele estar libre</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{String(bestHour).padStart(2, '0')}:00</div>
            </div>
            <div style={{
              flex: 1, background: T.warn + '15', border: `1px solid ${T.warn}40`,
              borderRadius: 8, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: T.warn, marginBottom: 2 }}>⚠ Puede estar lleno</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>~{peakPct}% de capacidad</div>
              <div style={{ fontSize: 11, color: T.inkMid }}>{String(peakHour).padStart(2, '0')}:00</div>
            </div>
          </div>
          {/* Tip de momento actual */}
          <div style={{
            marginTop: 10, padding: '8px 10px',
            background: T.primaryMist, borderRadius: 8,
            fontSize: 12, color: T.primary, fontWeight: 500, lineHeight: 1.4,
          }}>
            A las {currentHour}:00 suele estar al {Math.round(currentSat * 100)}% · {satLabel(currentSat)}
          </div>
        </div>

        {/* Hechos clave */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Hechos clave</div>
          {[
            { label: 'Última recogida', value: 'Hoy 06:14' },
            { label: 'Próx. recogida', value: 'Mañana 06:00' },
            { label: 'Coordenadas', value: `${bin.lat.toFixed(4)}, ${bin.lng.toFixed(4)}` },
            { label: 'Reciclajes esta semana', value: '127' },
          ].map((f, i, a) => (
            <div key={f.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: i < a.length - 1 ? 8 : 0,
              borderBottom: i < a.length - 1 ? `1px solid ${T.borderSoft}` : 'none',
              marginBottom: i < a.length - 1 ? 8 : 0,
            }}>
              <span style={{ fontSize: 12.5, color: T.inkMid }}>{f.label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{f.value}</span>
            </div>
          ))}
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

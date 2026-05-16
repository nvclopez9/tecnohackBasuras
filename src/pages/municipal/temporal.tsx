import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import MunicipalShell, { MuniFilters, EMPTY_FILTERS, applyFilters } from '@/components/municipal/MunicipalShell';
import { Icon } from '@/components/ui/Icon';
import { useReports } from '@/hooks/useReports';
import { useIsMobile } from '@/hooks/useIsMobile';
import { THEME } from '@/lib/theme';
import { CONTAINERS } from '@/lib/constants';

const T = THEME;
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

// ---------- Datos horarios ----------
const ECO_HOURLY: Record<string, number[]> = {
  organico: [0.10,0.08,0.06,0.06,0.08,0.12,0.22,0.35,0.48,0.55,0.62,0.70,0.78,0.85,0.82,0.74,0.62,0.55,0.66,0.78,0.86,0.82,0.62,0.32],
  envases:  [0.18,0.16,0.12,0.10,0.10,0.14,0.22,0.30,0.42,0.55,0.68,0.72,0.85,0.90,0.86,0.74,0.62,0.58,0.72,0.82,0.92,0.88,0.72,0.44],
  papel:    [0.08,0.06,0.05,0.05,0.06,0.10,0.18,0.32,0.48,0.62,0.74,0.78,0.82,0.78,0.68,0.55,0.45,0.42,0.48,0.58,0.65,0.62,0.45,0.22],
  vidrio:   [0.20,0.18,0.16,0.15,0.14,0.14,0.18,0.24,0.32,0.40,0.46,0.52,0.58,0.62,0.60,0.55,0.50,0.55,0.68,0.82,0.94,0.92,0.78,0.46],
  resto:    [0.15,0.12,0.10,0.10,0.12,0.18,0.28,0.42,0.55,0.66,0.75,0.82,0.86,0.88,0.84,0.78,0.72,0.74,0.85,0.92,0.92,0.84,0.65,0.40],
  ropa:     [0.25,0.25,0.24,0.24,0.24,0.26,0.30,0.38,0.45,0.52,0.58,0.62,0.66,0.68,0.66,0.60,0.55,0.52,0.55,0.60,0.62,0.58,0.45,0.32],
  aceite:   [0.22,0.22,0.22,0.22,0.22,0.24,0.26,0.30,0.35,0.40,0.42,0.48,0.52,0.56,0.55,0.50,0.45,0.42,0.48,0.55,0.60,0.55,0.42,0.28],
  baterias: [0.30,0.30,0.30,0.30,0.30,0.32,0.34,0.36,0.40,0.44,0.46,0.48,0.50,0.52,0.52,0.50,0.48,0.46,0.48,0.50,0.52,0.50,0.42,0.34],
};

const TYPES = Object.keys(ECO_HOURLY);

// Saturación media por hora (promedio de todos los tipos)
const HOURLY_AVG: number[] = Array.from({ length: 24 }, (_, h) => {
  const sum = TYPES.reduce((acc, t) => acc + ECO_HOURLY[t][h], 0);
  return sum / TYPES.length;
});

function barColor(v: number): string {
  if (v > 0.75) return T.danger;
  if (v > 0.55) return T.warn;
  if (v > 0.35) return T.primary;
  return T.success;
}

function networkState(avg: number): { label: string; color: string } {
  if (avg >= 0.75) return { label: 'CRÍTICO', color: T.danger };
  if (avg >= 0.55) return { label: 'TENSO', color: T.warn };
  return { label: 'TRANQUILO', color: T.success };
}

function fmt2(h: number): string {
  return String(h).padStart(2, '0');
}

// ---------- Componente principal ----------
export default function MunicipalTemporal() {
  const { reports } = useReports({ poll: true });
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<MuniFilters>(EMPTY_FILTERS);
  const [hour, setHour] = useState<number>(new Date().getHours());
  const [day, setDay] = useState<'Lab' | 'Sab' | 'Dom'>('Lab');
  const [layer, setLayer] = useState<'heatmap' | 'pines'>('heatmap');

  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);

  const currentAvg = HOURLY_AVG[hour];
  const net = networkState(currentAvg);

  // Tipo de contenedores ordenados por saturación desc en la hora activa
  const typesRanked = useMemo(() => {
    return TYPES.map((t) => ({
      key: t,
      value: ECO_HOURLY[t][hour],
      meta: CONTAINERS.find((c) => c.type === t),
    })).sort((a, b) => b.value - a.value);
  }, [hour]);

  // Nº de tipos con saturación alta (>55%)
  const tensionedCount = typesRanked.filter((t) => t.value > 0.55).length;

  return (
    <MunicipalShell
      activeNav="temporal"
      title="EcoChicharro · Análisis Temporal"
      reports={reports}
      filters={filters}
      onFilters={setFilters}
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ===== MAPA ===== */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
          <MapView
            reports={filtered}
            bins={[]}
            showHeatmap={layer === 'heatmap'}
            variant="voyager"
          />

          {/* CABECERA FLOTANTE */}
          <div style={{
            position: 'absolute', top: 16, left: 16, right: 16, zIndex: 500,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            {/* Tarjeta franja horaria */}
            <div style={{
              background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,.08)', flex: '0 0 auto',
            }}>
              <div style={{ color: T.primary }}>
                <Icon name="clock" size={20} color={T.primary} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Franja horaria · {day === 'Lab' ? 'Lunes-Viernes' : day === 'Sab' ? 'Sábado' : 'Domingo'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, lineHeight: 1.1 }}>
                  {fmt2(hour)}:00 – {fmt2((hour + 1) % 24)}:00
                </div>
              </div>
            </div>

            {/* Tarjeta estado red */}
            <div style={{
              background: net.color + '18', border: `1.5px solid ${net.color}`,
              borderRadius: 10, padding: '10px 14px', flex: '0 0 auto',
              boxShadow: '0 2px 8px rgba(0,0,0,.08)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: net.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Estado red
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: net.color }}>{net.label}</div>
              <div style={{ fontSize: 11, color: net.color, fontWeight: 600 }}>
                {Math.round(currentAvg * 100)}% · {tensionedCount} tipos tensionados
              </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Toggle días */}
            <div style={{
              display: 'flex', background: '#fff', border: `1px solid ${T.border}`,
              borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.08)',
            }}>
              {(['Lab', 'Sab', 'Dom'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  style={{
                    padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: day === d ? T.primary : 'transparent',
                    color: day === d ? '#fff' : T.ink,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Toggle capa */}
            <div style={{
              display: 'flex', background: '#fff', border: `1px solid ${T.border}`,
              borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.08)',
            }}>
              {(['heatmap', 'pines'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayer(l)}
                  style={{
                    padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: layer === l ? T.primary : 'transparent',
                    color: layer === l ? '#fff' : T.ink,
                  }}
                >
                  {l === 'heatmap' ? 'Heatmap' : 'Pines'}
                </button>
              ))}
            </div>
          </div>

          {/* BARRA DE HORAS */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 500,
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12,
            padding: '12px 14px', boxShadow: '0 2px 12px rgba(0,0,0,.10)',
          }}>
            {/* Barras clicables */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 44, marginBottom: 6 }}>
              {HOURLY_AVG.map((v, h) => {
                const isActive = h === hour;
                const color = barColor(v);
                const heightPct = Math.max(12, Math.round(v * 100));
                return (
                  <button
                    key={h}
                    onClick={() => setHour(h)}
                    title={`${fmt2(h)}:00 — ${Math.round(v * 100)}%`}
                    style={{
                      flex: 1, height: `${heightPct}%`, borderRadius: 3, border: 'none',
                      cursor: 'pointer', background: color,
                      opacity: isActive ? 1 : 0.38,
                      outline: isActive ? `2px solid ${color}` : 'none',
                      outlineOffset: 1,
                      transition: 'opacity .15s',
                    }}
                  />
                );
              })}
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.primary, margin: '4px 0' }}
            />

            {/* Leyenda */}
            <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
              {[
                { color: T.success, label: '<35%' },
                { color: T.primary, label: '35-55%' },
                { color: T.warn,    label: '55-75%' },
                { color: T.danger,  label: '>75%' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: T.inkMid }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color, display: 'inline-block' }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PANEL DERECHO — escritorio ===== */}
        {!isMobile && (
          <RightPanel hour={hour} typesRanked={typesRanked} />
        )}
      </div>

      {/* RECOMENDACIONES — overlay móvil (bottom-sheet) */}
      {isMobile && (
        <MobileSheet hour={hour} />
      )}
    </MunicipalShell>
  );
}

// ---------- Panel derecho (escritorio) ----------
interface RankedType {
  key: string;
  value: number;
  meta: { type: string; label: string; color: string; icon: string } | undefined;
}

function RightPanel({ hour, typesRanked }: { hour: number; typesRanked: RankedType[] }) {
  return (
    <div style={{
      width: 360, flex: '0 0 360px', background: '#fff',
      borderLeft: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Título */}
        <div style={{ fontSize: 14, fontWeight: 700, color: THEME.ink, marginBottom: 14 }}>
          Tensión por tipo · {fmt2(hour)}:00
        </div>

        {/* Lista ordenada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {typesRanked.map(({ key, value, meta }) => {
            const label = meta?.label ?? key;
            const color = meta?.color ?? THEME.primary;
            const pct = Math.round(value * 100);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flex: '0 0 8px' }} />
                <span style={{ flex: 1, fontSize: 12.5, color: THEME.ink, fontWeight: 500 }}>{label}</span>
                {/* Barra de progreso */}
                <div style={{ width: 80, height: 6, background: THEME.borderSoft, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 3,
                    background: barColor(value),
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: barColor(value), width: 32, textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        <Recommendations />
      </div>
    </div>
  );
}

// ---------- Recomendaciones ----------
function Recommendations() {
  const T = THEME;
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        Recomendaciones operativas
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Naranja — pico crítico */}
        <div style={{
          background: T.warn + '18', border: `1px solid ${T.warn}`,
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.warn, marginBottom: 3 }}>
            Pico crítico de vidrio a las 20:00
          </div>
          <div style={{ fontSize: 11, color: T.ink, lineHeight: 1.5 }}>
            Saturación estimada 94%. Programar recogida adicional antes de las 19:30 en zona Centro y Puerto.
          </div>
        </div>

        {/* Verde — ventana óptima */}
        <div style={{
          background: T.success + '18', border: `1px solid ${T.success}`,
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.success, marginBottom: 3 }}>
            Ventana óptima de mantenimiento 03:00–06:00
          </div>
          <div style={{ fontSize: 11, color: T.ink, lineHeight: 1.5 }}>
            Saturación &lt;15% en todos los tipos. Ideal para revisión y limpieza de contenedores.
          </div>
        </div>

        {/* Azul — ruta sugerida */}
        <div style={{
          background: T.primaryMist, border: `1px solid ${T.primaryTint}`,
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.primary, marginBottom: 3 }}>
            Ruta sugerida para franja actual
          </div>
          <div style={{ fontSize: 11, color: T.ink, lineHeight: 1.5 }}>
            12 paradas en Centro + Anaga · Duración estimada 1h 40min · Prioridad: envases y resto.
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- Bottom-sheet móvil ----------
function MobileSheet({ hour }: { hour: number }) {
  const T = THEME;
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 100, right: 16, zIndex: 600,
          background: T.primary, color: '#fff', border: 'none', borderRadius: 24,
          padding: '10px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,90,156,.4)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <Icon name="clock" size={15} color="#fff" />
        {fmt2(hour)}:00 · Ver análisis
      </button>

      {/* Overlay / bottom-sheet */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '80%', background: '#fff',
              borderRadius: '16px 16px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
            </div>
            <div style={{ padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                Análisis · {fmt2(hour)}:00
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkMid, padding: 4 }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
              <Recommendations />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

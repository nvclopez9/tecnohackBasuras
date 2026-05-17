import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import MunicipalShell, { MuniFilters, EMPTY_FILTERS, applyFilters } from '@/components/municipal/MunicipalShell';
import { Icon } from '@/components/ui/Icon';
import { useReports } from '@/hooks/useReports';
import { useIsMobile } from '@/hooks/useIsMobile';
import { THEME } from '@/lib/theme';
import { CONTAINERS, INCIDENTS } from '@/lib/constants';
import { Report } from '@/types';

const T = THEME;
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

function fmt2(h: number): string {
  return String(h).padStart(2, '0');
}

function ratioColor(ratio: number): string {
  if (ratio > 0.75) return T.danger;
  if (ratio > 0.5) return T.warn;
  if (ratio > 0.25) return T.primary;
  return T.success;
}

function loadState(ratio: number): { label: string; color: string } {
  if (ratio >= 0.75) return { label: 'PICO', color: T.danger };
  if (ratio >= 0.4) return { label: 'ACTIVO', color: T.warn };
  return { label: 'TRANQUILO', color: T.success };
}

// ---------- Componente principal ----------
export default function MunicipalTemporal() {
  const { reports } = useReports({ poll: true });
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<MuniFilters>(EMPTY_FILTERS);
  const [hour, setHour] = useState<number>(new Date().getHours());
  const [layer, setLayer] = useState<'heatmap' | 'pines'>('heatmap');

  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);

  // Conteo REAL de incidencias por hora del día (a partir de createdAt).
  const hourCounts = useMemo(() => {
    const c = new Array(24).fill(0);
    filtered.forEach((r) => { c[new Date(r.createdAt).getHours()] += 1; });
    return c;
  }, [filtered]);
  const maxHour = Math.max(1, ...hourCounts);

  const reportsInHour = useMemo(
    () => filtered.filter((r) => new Date(r.createdAt).getHours() === hour),
    [filtered, hour],
  );

  const currentCount = hourCounts[hour];
  const net = loadState(currentCount / maxHour);

  // Peak hour and best (quietest) hour for the insight line
  const peakH = hourCounts.indexOf(Math.max(...hourCounts));
  const bestH = (() => {
    // Prefer hours that actually have the least reports; break ties towards daytime
    let minV = Infinity; let minH = 4;
    hourCounts.forEach((v, h) => { if (v < minV) { minV = v; minH = h; } });
    return minH;
  })();

  // Tipos de contenedor con más incidencias en la hora seleccionada.
  const typesRanked = useMemo(() => {
    const counts: Record<string, number> = {};
    reportsInHour.forEach((r) => { counts[r.containerType] = (counts[r.containerType] ?? 0) + 1; });
    return CONTAINERS
      .map((c) => ({ key: c.type, value: counts[c.type] ?? 0, meta: c }))
      .sort((a, b) => b.value - a.value);
  }, [reportsInHour]);

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
            reports={reportsInHour}
            bins={[]}
            showHeatmap={layer === 'heatmap'}
            variant="voyager"
          />

          {/* CABECERA FLOTANTE */}
          <div style={{
            position: 'absolute', top: 16, left: 16, right: 16, zIndex: 500,
            display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap',
          }}>
            <div style={{
              background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,.08)', flex: '0 0 auto',
            }}>
              <Icon name="clock" size={20} color={T.primary} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Franja horaria
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, lineHeight: 1.1 }}>
                  {fmt2(hour)}:00 – {fmt2((hour + 1) % 24)}:00
                </div>
              </div>
            </div>

            {/* ── ACTIVIDAD PANEL (expanded) ── */}
            <div style={{
              background: 'rgba(22, 22, 46, 0.90)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: `1.5px solid ${net.color}55`,
              borderRadius: 12, padding: '12px 14px',
              flex: '0 0 220px', width: 220,
              boxShadow: `0 4px 18px rgba(0,0,0,.22), 0 0 0 1px ${net.color}22`,
              transition: 'border-color 0.4s, box-shadow 0.4s',
            }}>
              {/* State badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: net.color + '25',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="clock" size={15} color={net.color} />
                </span>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Actividad
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: net.color, lineHeight: 1.1 }}>
                    {net.label}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', textAlign: 'right', lineHeight: 1.3 }}>
                  {fmt2(hour)}:00<br />
                  <span style={{ color: 'rgba(255,255,255,.3)' }}>{currentCount} rep.</span>
                </div>
              </div>

              {/* Mini sparkline — 24 bars */}
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 2, height: 32,
                marginBottom: 8, paddingBottom: 2,
              }}>
                {hourCounts.map((v, h) => {
                  const barH = Math.round((v / maxHour) * 28) + 2;
                  const isSelected = h === hour;
                  const isPeak = h === peakH && v > 0;
                  const barColor = isSelected ? '#E8A317' : isPeak ? net.color : 'rgba(255,255,255,.28)';
                  return (
                    <button
                      key={h}
                      onClick={() => setHour(h)}
                      title={`${fmt2(h)}:00 — ${v}`}
                      style={{
                        flex: 1, height: barH, borderRadius: 2, border: 'none',
                        background: barColor, cursor: 'pointer', padding: 0,
                        transition: 'height .15s, background .2s',
                        outline: isSelected ? `1.5px solid #E8A317` : 'none',
                        outlineOffset: 1,
                      }}
                    />
                  );
                })}
              </div>

              {/* Insight line */}
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', lineHeight: 1.4 }}>
                Pico <span style={{ color: net.color, fontWeight: 700 }}>{fmt2(peakH)}:00</span>
                {' · '}
                Menor <span style={{ color: T.success, fontWeight: 700 }}>{fmt2(bestH)}:00</span>
              </div>
            </div>

            <div style={{ flex: 1 }} />

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
                    color: layer === l ? '#fff' : T.ink, fontFamily: 'inherit',
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
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
              Incidencias reportadas por hora del día
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 44, marginBottom: 6 }}>
              {hourCounts.map((v, h) => {
                const isActive = h === hour;
                const ratio = v / maxHour;
                const color = ratioColor(ratio);
                const heightPct = Math.max(8, Math.round(ratio * 100));
                return (
                  <button
                    key={h}
                    onClick={() => setHour(h)}
                    title={`${fmt2(h)}:00 — ${v} incidencia${v !== 1 ? 's' : ''}`}
                    style={{
                      flex: 1, height: `${heightPct}%`, borderRadius: 3, border: 'none',
                      cursor: 'pointer', background: v === 0 ? T.borderSoft : color,
                      opacity: isActive ? 1 : 0.4,
                      outline: isActive ? `2px solid ${v === 0 ? T.inkLight : color}` : 'none',
                      outlineOffset: 1,
                      transition: 'opacity .15s',
                    }}
                  />
                );
              })}
            </div>
            <input
              type="range" min={0} max={23} value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.primary, margin: '4px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.inkMid }}>
              <span>00:00</span><span>12:00</span><span>23:00</span>
            </div>
          </div>
        </div>

        {/* ===== PANEL DERECHO — escritorio ===== */}
        {!isMobile && (
          <RightPanel hour={hour} typesRanked={typesRanked} reportsInHour={reportsInHour} hourCounts={hourCounts} filtered={filtered} />
        )}
      </div>

      {/* ANÁLISIS — overlay móvil */}
      {isMobile && (
        <MobileSheet hour={hour} hourCounts={hourCounts} filtered={filtered} />
      )}
    </MunicipalShell>
  );
}

// ---------- Panel derecho (escritorio) ----------
interface RankedType {
  key: string;
  value: number;
  meta: { type: string; label: string; color: string; icon: string };
}

function RightPanel({
  hour, typesRanked, reportsInHour, hourCounts, filtered,
}: {
  hour: number; typesRanked: RankedType[]; reportsInHour: Report[]; hourCounts: number[]; filtered: Report[];
}) {
  const maxVal = Math.max(1, ...typesRanked.map((t) => t.value));
  return (
    <div style={{
      width: 360, flex: '0 0 360px', background: '#fff',
      borderLeft: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: THEME.ink, marginBottom: 14 }}>
          Incidencias por tipo · {fmt2(hour)}:00
        </div>

        {reportsInHour.length === 0 ? (
          <div style={{ fontSize: 12.5, color: THEME.inkMid, marginBottom: 24 }}>
            No se reportaron incidencias en esta franja.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {typesRanked.filter((t) => t.value > 0).map(({ key, value, meta }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, flex: '0 0 8px' }} />
                <span style={{ flex: 1, fontSize: 12.5, color: THEME.ink, fontWeight: 500 }}>{meta.label}</span>
                <div style={{ width: 80, height: 6, background: THEME.borderSoft, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(value / maxVal) * 100}%`, height: '100%', borderRadius: 3, background: meta.color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: THEME.ink, width: 22, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <Insights hourCounts={hourCounts} filtered={filtered} />
      </div>
    </div>
  );
}

// ---------- Recomendaciones derivadas de datos reales ----------
function Insights({ hourCounts, filtered }: { hourCounts: number[]; filtered: Report[] }) {
  const total = filtered.length;
  const busiest = hourCounts.indexOf(Math.max(...hourCounts));
  const busiestN = hourCounts[busiest];

  // Incidencia más frecuente
  const incCounts: Record<string, number> = {};
  filtered.forEach((r) => { incCounts[r.incidentType] = (incCounts[r.incidentType] ?? 0) + 1; });
  const topInc = Object.entries(incCounts).sort((a, b) => b[1] - a[1])[0];
  const topIncMeta = topInc ? INCIDENTS.find((i) => i.type === topInc[0]) : undefined;

  // Mañana vs tarde
  const morning = hourCounts.slice(6, 14).reduce((a, b) => a + b, 0);
  const evening = hourCounts.slice(14, 22).reduce((a, b) => a + b, 0);

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        Hallazgos · datos reales
      </div>
      {total === 0 ? (
        <div style={{ fontSize: 12, color: T.inkMid }}>Sin incidencias registradas con estos filtros.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InsightCard
            color={T.warn}
            title={`Franja con más reportes: ${fmt2(busiest)}:00`}
            body={`Se concentran ${busiestN} de las ${total} incidencias. Conviene reforzar la atención a partir de esa hora.`}
          />
          {topIncMeta && (
            <InsightCard
              color={T.primary}
              title={`Incidencia más frecuente: ${topIncMeta.label}`}
              body={`Representa ${topInc![1]} de ${total} reportes (${Math.round((topInc![1] / total) * 100)}%).`}
            />
          )}
          <InsightCard
            color={morning >= evening ? T.success : T.danger}
            title={morning >= evening ? 'La mañana acumula más reportes' : 'La tarde acumula más reportes'}
            body={`Mañana (06–14h): ${morning} · Tarde (14–22h): ${evening}. Planifica las recogidas hacia el tramo con mayor carga.`}
          />
        </div>
      )}
    </>
  );
}

function InsightCard({ color, title, body }: { color: string; title: string; body: string }) {
  return (
    <div style={{ background: color + '18', border: `1px solid ${color}`, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11, color: T.ink, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

// ---------- Bottom-sheet móvil ----------
function MobileSheet({ hour, hourCounts, filtered }: { hour: number; hourCounts: number[]; filtered: Report[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 100, right: 16, zIndex: 600,
          background: T.primary, color: '#fff', border: 'none', borderRadius: 24,
          padding: '10px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,90,156,.4)',
          display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
        }}
      >
        <Icon name="clock" size={15} color="#fff" />
        {fmt2(hour)}:00 · Ver análisis
      </button>

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
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
            </div>
            <div style={{ padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Análisis temporal</span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkMid, padding: 4 }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
              <Insights hourCounts={hourCounts} filtered={filtered} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import MunicipalShell, { MuniFilters, EMPTY_FILTERS, applyFilters } from '@/components/municipal/MunicipalShell';
import DetailPanel from '@/components/municipal/DetailPanel';
import { MapBtn, Badge, Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useReports } from '@/hooks/useReports';
import { useBins } from '@/hooks/useBins';
import { useIsMobile } from '@/hooks/useIsMobile';
import { THEME } from '@/lib/theme';
import { CONTAINERS, incidentMeta, statusMeta } from '@/lib/constants';
import { Report } from '@/types';
import type { ZoneCircle } from '@/components/MapView';
import { TRUCK_ROUTES, TruckRoute, routeEfficiency } from '@/lib/truckRoutes';

const T = THEME;
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type MapLayer = 'pines' | 'heatmap' | 'zonas' | 'rutas';

/**
 * Agrupa las incidencias en celdas espaciales (~165 m) y devuelve círculos
 * coloreados por intensidad: verde (baja) → ámbar → rojo (alta). Aproxima
 * las "calles con más tráfico de incidencias".
 */
function zonesFromReports(reports: Report[]): ZoneCircle[] {
  const CELL = 0.0016;
  const cells = new Map<string, { lat: number; lng: number; n: number }>();
  reports.forEach((r) => {
    const key = `${Math.round(r.lat / CELL)}:${Math.round(r.lng / CELL)}`;
    const c = cells.get(key);
    if (c) { c.lat += r.lat; c.lng += r.lng; c.n += 1; }
    else cells.set(key, { lat: r.lat, lng: r.lng, n: 1 });
  });
  const arr = [...cells.values()];
  const max = Math.max(1, ...arr.map((c) => c.n));
  return arr.map((c) => {
    const ratio = c.n / max;
    const color = ratio > 0.66 ? T.danger : ratio > 0.33 ? T.warn : T.success;
    return { lat: c.lat / c.n, lng: c.lng / c.n, radius: 70 + ratio * 140, color };
  });
}

export default function MunicipalMapa() {
  const { reports, mergeReport } = useReports({ poll: true });
  const { bins } = useBins();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<MuniFilters>(EMPTY_FILTERS);
  const [layer, setLayer] = useState<MapLayer>('pines');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routesSheetOpen, setRoutesSheetOpen] = useState(false);

  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
  const selected = filtered.find((r) => r.id === selectedId) ?? reports.find((r) => r.id === selectedId) ?? null;
  const zoneCircles = useMemo(() => (layer === 'zonas' ? zonesFromReports(filtered) : []), [layer, filtered]);

  return (
    <MunicipalShell
      activeNav="mapa"
      title="EcoChicharro · Mapa analítico"
      reports={reports}
      filters={filters}
      onFilters={setFilters}
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* MAP */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
          <MapView
            reports={layer === 'rutas' || layer === 'zonas' ? [] : filtered}
            bins={layer === 'pines' ? bins : []}
            showHeatmap={layer === 'heatmap'}
            zoneCircles={zoneCircles}
            truckRoutes={layer === 'rutas' ? TRUCK_ROUTES : []}
            selectedId={selectedId}
            onReportClick={(r) => setSelectedId(r.id)}
            variant="voyager"
          />

          {/* layer toggle */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 500, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <MapBtn icon={<Icon name="pin" size={13} />} label="Pines" active={layer === 'pines'} onClick={() => setLayer('pines')} />
            <MapBtn icon={<Icon name="flame" size={13} />} label="Heatmap" active={layer === 'heatmap'} onClick={() => setLayer('heatmap')} />
            <MapBtn icon={<Icon name="cluster" size={13} />} label="Zonas" active={layer === 'zonas'} onClick={() => setLayer('zonas')} />
            <MapBtn icon={<Icon name="route" size={13} />} label="Rutas" active={layer === 'rutas'} onClick={() => setLayer('rutas')} />
          </div>

          {/* legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 500,
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', minWidth: 190,
          }}>
            {layer === 'rutas' ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                  Rutas de camiones
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {TRUCK_ROUTES.map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.ink }}>
                      <span style={{ width: 20, height: 3, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : layer === 'heatmap' ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                  Densidad de incidencias
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#005A9C,#E8A317,#C0392B)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.inkMid, marginTop: 3 }}>
                  <span>Baja</span><span>Alta</span>
                </div>
              </div>
            ) : layer === 'zonas' ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                  Intensidad por zona
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { c: T.success, l: 'Tráfico bajo de incidencias' },
                    { c: T.warn, l: 'Tráfico medio' },
                    { c: T.danger, l: 'Tráfico alto · zona caliente' },
                  ].map((x) => (
                    <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.ink }}>
                      <span style={{ width: 12, height: 12, borderRadius: 999, background: x.c, opacity: 0.6, border: `1.5px solid ${x.c}`, flexShrink: 0 }} />
                      {x.l}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                  Tipo de contenedor
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {CONTAINERS.map((c) => (
                    <div key={c.type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.ink }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }} />
                      {c.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* count pill — hide on rutas */}
          {layer !== 'rutas' && (
            <div style={{
              position: 'absolute', top: 16, left: 16, zIndex: 500,
              background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: T.ink,
            }}>
              {filtered.length} incidencia{filtered.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* FAB "Ver rutas" en móvil cuando layer === rutas */}
          {isMobile && layer === 'rutas' && (
            <button
              onClick={() => setRoutesSheetOpen(true)}
              style={{
                position: 'absolute', bottom: 80, right: 16, zIndex: 600,
                background: T.primary, color: '#fff',
                border: 'none', borderRadius: 28,
                padding: '12px 18px',
                fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,.22)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon name="route" size={16} />
              Ver rutas
            </button>
          )}
        </div>

        {/* RIGHT PANEL — escritorio */}
        {!isMobile && (
          <div style={{ width: 360, flex: '0 0 360px', background: '#fff', borderLeft: `1px solid ${T.border}`, overflow: 'hidden' }}>
            {layer === 'rutas' ? (
              <TruckRoutesPanel />
            ) : selected ? (
              <DetailPanel
                report={selected}
                onClose={() => setSelectedId(null)}
                onUpdated={mergeReport}
              />
            ) : (
              <RecentList reports={filtered} onSelect={setSelectedId} />
            )}
          </div>
        )}
      </div>

      {/* DETALLE — overlay en móvil (incidencias) */}
      {isMobile && selected && layer !== 'rutas' && (
        <div
          onClick={() => setSelectedId(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '90%', background: '#fff',
              borderRadius: '16px 16px 0 0', overflow: 'hidden',
            }}
          >
            <DetailPanel
              report={selected}
              onClose={() => setSelectedId(null)}
              onUpdated={mergeReport}
            />
          </div>
        </div>
      )}

      {/* RUTAS bottom-sheet — móvil */}
      {isMobile && routesSheetOpen && (
        <div
          onClick={() => setRoutesSheetOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '85%', background: '#fff',
              borderRadius: '16px 16px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <span style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <TruckRoutesPanel />
            </div>
          </div>
        </div>
      )}
    </MunicipalShell>
  );
}

// ---------------------------------------------------------------------------
// TruckRoutesPanel
// ---------------------------------------------------------------------------

function TruckRoutesPanel() {
  const totalStops = TRUCK_ROUTES.reduce((s, r) => s + r.totalStops, 0);
  const completedStops = TRUCK_ROUTES.reduce((s, r) => s + r.completedStops, 0);
  const totalKm = TRUCK_ROUTES.reduce((s, r) => s + r.distanceKm, 0);
  const plannedKm = TRUCK_ROUTES.reduce((s, r) => s + r.plannedDistanceKm, 0);
  const avgEfficiency = totalKm > 0 ? Math.round((plannedKm / totalKm) * 100) : 0;

  return (
    <div className="thin-scroll" style={{ height: '100%', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ paddingBottom: 10, borderBottom: `1px solid ${T.borderSoft}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Rutas de recogida · Hoy</div>
        <div style={{ fontSize: 11.5, color: T.inkMid, marginTop: 2 }}>Eficiencia vs. planificación</div>
      </div>

      {/* Route cards */}
      {TRUCK_ROUTES.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}

      {/* Summary card */}
      <div style={{
        background: T.primaryMist, border: `1px solid ${T.primaryTint}`,
        borderRadius: 10, padding: '14px 16px', marginTop: 4,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Resumen global
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <SummaryKPI label="Paradas" value={`${completedStops}/${totalStops}`} />
          <SummaryKPI label="Km recorridos" value={`${totalKm.toFixed(1)}km`} />
          <SummaryKPI label="Eficiencia" value={totalKm > 0 ? `${avgEfficiency}%` : '—'} accent={efficiencyColor(avgEfficiency)} />
        </div>
        <Button kind="ghost" full icon={<Icon name="route" size={14} />}>
          Proponer nueva ruta
        </Button>
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: TruckRoute }) {
  const eff = routeEfficiency(route);
  const delta = route.distanceKm > 0 ? route.distanceKm - route.plannedDistanceKm : 0;
  const deltaSign = delta > 0 ? '+' : '';

  const statusColor = route.status === 'completada' ? T.success : route.status === 'en_curso' ? T.primary : T.inkMid;
  const statusLabel = route.status === 'completada' ? 'Completada' : route.status === 'en_curso' ? 'En curso' : 'Planificada';

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.border}`,
      borderRadius: 10, overflow: 'hidden',
      borderLeft: `3px solid ${route.color}`,
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Name + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{route.name}</div>
          <Badge color={statusColor} label={statusLabel} size="sm" />
        </div>

        {/* Driver + truck */}
        <div style={{ fontSize: 11.5, color: T.inkMid }}>
          {route.driver} · {route.truck}
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <MetricCell label="Paradas" value={`${route.completedStops}/${route.totalStops}`} />
          <MetricCell
            label="Distancia"
            value={route.distanceKm > 0
              ? `${route.distanceKm}km / ${route.plannedDistanceKm}km plan.`
              : `— / ${route.plannedDistanceKm}km plan.`}
          />
        </div>

        {/* Efficiency bar */}
        {route.distanceKm > 0 && (
          <div>
            <div style={{ height: 6, borderRadius: 3, background: T.borderSoft, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{
                height: '100%',
                width: `${Math.min(eff, 100)}%`,
                background: efficiencyColor(eff),
                borderRadius: 3,
                transition: 'width .4s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: T.inkMid }}>
              <span style={{ fontWeight: 700, color: efficiencyColor(eff) }}>{eff}% eficiencia</span>
              {' · '}
              {deltaSign}{delta.toFixed(1)}km vs. planificado
            </div>
          </div>
        )}
        {route.distanceKm === 0 && (
          <div style={{ fontSize: 11, color: T.inkMid, fontStyle: 'italic' }}>
            Pendiente de inicio · {route.startTime}h
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: T.appBg, borderRadius: 6, padding: '6px 8px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>
        {value}
      </div>
    </div>
  );
}

function SummaryKPI({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: accent ?? T.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function efficiencyColor(eff: number): string {
  if (eff >= 95) return T.success;
  if (eff >= 85) return T.warn;
  return T.danger;
}

// ---------------------------------------------------------------------------
// RecentList
// ---------------------------------------------------------------------------

function RecentList({ reports, onSelect }: { reports: Report[]; onSelect: (id: string) => void }) {
  return (
    <div className="thin-scroll" style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        Incidencias · selecciona una
      </div>
      {reports.map((r) => {
        const im = incidentMeta(r.incidentType);
        const sm = statusMeta(r.status);
        return (
          <div
            key={r.id}
            onClick={() => onSelect(r.id)}
            style={{
              display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${T.borderSoft}`, cursor: 'pointer',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {im.label}
              </div>
              <div style={{ fontSize: 10.5, color: T.inkMid }}>{r.address || r.area} · {r.code}</div>
            </div>
            <Badge color={sm.color} label={sm.label} size="sm" />
          </div>
        );
      })}
      {reports.length === 0 && <div style={{ fontSize: 12, color: T.inkMid }}>Sin incidencias con estos filtros.</div>}
    </div>
  );
}

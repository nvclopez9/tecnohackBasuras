import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useRef } from 'react';
import MunicipalShell, { MuniFilters, EMPTY_FILTERS, applyFilters } from '@/components/municipal/MunicipalShell';
import DetailPanel from '@/components/municipal/DetailPanel';
import { MapBtn, Badge } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useReports } from '@/hooks/useReports';
import { useBins } from '@/hooks/useBins';
import { useIsMobile } from '@/hooks/useIsMobile';
import { THEME } from '@/lib/theme';
import { CONTAINERS, incidentMeta, statusMeta } from '@/lib/constants';
import { Report } from '@/types';

const T = THEME;
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type MapLayer = 'pines' | 'heatmap' | 'calles';

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STREETS_SHIMMER = `
@keyframes streetsShimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
`;

export default function MunicipalMapa() {
  const { reports, mergeReport } = useReports({ poll: true });
  const { bins } = useBins();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<MuniFilters>(EMPTY_FILTERS);
  const [layer, setLayer] = useState<MapLayer>('pines');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBinsOverlay, setShowBinsOverlay] = useState(false);

  const [streetData, setStreetData] = useState<{ id: string; points: { lat: number; lng: number }[] }[]>([]);
  const [streetsLoading, setStreetsLoading] = useState(false);

  useEffect(() => {
    if (layer !== 'calles' || streetData.length > 0 || streetsLoading) return;
    setStreetsLoading(true);
    fetch('/api/streets')
      .then(r => r.json())
      .then(data => { setStreetData(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setStreetsLoading(false));
  }, [layer, streetData.length, streetsLoading]);

  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
  const selected = filtered.find((r) => r.id === selectedId) ?? reports.find((r) => r.id === selectedId) ?? null;

  const streetLines = useMemo(() => {
    if (layer !== 'calles' || streetData.length === 0) return [];
    const NEAR = 35;
    const lines = streetData.map(street => {
      let count = 0;
      filtered.forEach(r => {
        const near = street.points.some(p => haversineM(r.lat, r.lng, p.lat, p.lng) < NEAR);
        if (near) count++;
      });
      return { street, count };
    });
    const max = Math.max(1, ...lines.map(l => l.count));
    return lines
      .filter(l => l.count > 0)
      .map(l => {
        const ratio = l.count / max;
        const color = ratio > 0.66 ? T.danger : ratio > 0.33 ? T.warn : T.success;
        const weight = ratio > 0.66 ? 5 : ratio > 0.33 ? 4 : 3;
        return { points: l.street.points, color, weight };
      });
  }, [layer, streetData, filtered]);

  return (
    <MunicipalShell
      activeNav="mapa"
      title="EcoChicharro · Mapa analítico"
      reports={reports}
      filters={filters}
      onFilters={setFilters}
    >
      <style>{STREETS_SHIMMER}</style>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* MAP */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
          <MapView
            reports={layer === 'calles' ? [] : filtered}
            bins={showBinsOverlay ? bins : []}
            showHeatmap={layer === 'heatmap'}
            zoneCircles={[]}
            streetLines={streetLines}
            selectedId={selectedId}
            onReportClick={(r) => setSelectedId(r.id)}
            variant="voyager"
          />

          {/* Streets loading progress bar */}
          {streetsLoading && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 600, background: 'rgba(26,26,46,0.92)',
              borderRadius: 10, padding: '8px 14px', minWidth: 240, maxWidth: 320,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📡</span> Descargando red viaria de Santa Cruz…
              </div>
              <div style={{
                height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.15)',
                overflow: 'hidden', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                  animation: 'streetsShimmer 1.5s linear infinite',
                }} />
              </div>
            </div>
          )}

          {/* Layer selector */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 500, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <MapBtn icon={<Icon name="pin" size={13} />} label="Pines" active={layer === 'pines'} onClick={() => setLayer('pines')} />
            <MapBtn icon={<Icon name="flame" size={13} />} label="Heatmap" active={layer === 'heatmap'} onClick={() => setLayer('heatmap')} />
            <MapBtn icon={<Icon name="route" size={13} />} label="Calles" active={layer === 'calles'} onClick={() => setLayer('calles')} />
          </div>

          {/* Bins toggle FAB */}
          <button
            onClick={() => setShowBinsOverlay(v => !v)}
            title={showBinsOverlay ? 'Ocultar contenedores' : 'Mostrar contenedores'}
            style={{
              position: 'absolute', bottom: 16, right: 16, zIndex: 500,
              width: 44, height: 44, borderRadius: 999,
              background: showBinsOverlay ? T.primary : 'rgba(26,26,46,0.92)',
              border: `2px solid ${showBinsOverlay ? T.primary : 'rgba(255,255,255,0.18)'}`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <Icon name="pin" size={18} color="#fff" />
          </button>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 500,
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', minWidth: 190,
          }}>
            {layer === 'heatmap' ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                  Densidad de incidencias
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#005A9C,#E8A317,#C0392B)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.inkMid, marginTop: 3 }}>
                  <span>Baja</span><span>Alta</span>
                </div>
              </div>
            ) : layer === 'calles' ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                  {streetsLoading ? 'Cargando red viaria…' : 'Intensidad en calles'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { c: T.success, l: 'Baja densidad' },
                    { c: T.warn, l: 'Densidad media' },
                    { c: T.danger, l: 'Alta densidad' },
                  ].map(x => (
                    <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.ink }}>
                      <span style={{ width: 22, height: 4, borderRadius: 2, background: x.c, flexShrink: 0 }} />
                      {x.l}
                    </div>
                  ))}
                </div>
                {streetLines.length === 0 && !streetsLoading && (
                  <div style={{ fontSize: 10, color: T.inkMid, marginTop: 6 }}>Sin incidencias en calles</div>
                )}
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

          {/* Incidences count pill */}
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 500,
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8,
            padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: T.ink,
          }}>
            {filtered.length} incidencia{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* RIGHT PANEL — desktop */}
        {!isMobile && (
          <div style={{ width: 360, flex: '0 0 360px', background: '#fff', borderLeft: `1px solid ${T.border}`, overflow: 'hidden' }}>
            {selected ? (
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

      {/* DETAIL overlay — mobile */}
      {isMobile && selected && (
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
    </MunicipalShell>
  );
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

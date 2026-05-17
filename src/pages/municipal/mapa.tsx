import dynamic from 'next/dynamic';
import { useState, useMemo, useRef } from 'react';
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
import type { MapVariant } from '@/components/MapView';

const T = THEME;
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type MapLayer = 'pines' | 'heatmap';

const MAP_VARIANTS: { id: MapVariant; label: string; swatch: string }[] = [
  { id: 'voyager',   label: 'Calles',   swatch: 'linear-gradient(135deg,#E7EFE3,#CBD9C9)' },
  { id: 'light',     label: 'Claro',    swatch: 'linear-gradient(135deg,#F4F6F8,#DDE3E8)' },
  { id: 'dark',      label: 'Oscuro',   swatch: 'linear-gradient(135deg,#3A3A48,#1A1A26)' },
  { id: 'satellite', label: 'Satélite', swatch: 'linear-gradient(135deg,#5C6E45,#2E3A24)' },
];

export default function MunicipalMapa() {
  const { reports, mergeReport } = useReports({ poll: true });
  const { bins } = useBins();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<MuniFilters>(EMPTY_FILTERS);
  const [layer, setLayer] = useState<MapLayer>('pines');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBinsOverlay, setShowBinsOverlay] = useState(false);
  const [mapVariant, setMapVariant] = useState<MapVariant>('voyager');
  const [variantOpen, setVariantOpen] = useState(false);

  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
  const selected = filtered.find((r) => r.id === selectedId) ?? reports.find((r) => r.id === selectedId) ?? null;

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
            reports={filtered}
            bins={showBinsOverlay ? bins : []}
            showHeatmap={layer === 'heatmap'}
            zoneCircles={[]}
            selectedId={selectedId}
            onReportClick={(r) => setSelectedId(r.id)}
            variant={mapVariant}
          />

          {/* Layer + style selectors */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 500, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
            <MapBtn icon={<Icon name="pin" size={13} />} label="Pines" active={layer === 'pines'} onClick={() => setLayer('pines')} />
            <MapBtn icon={<Icon name="flame" size={13} />} label="Heatmap" active={layer === 'heatmap'} onClick={() => setLayer('heatmap')} />

            {/* Map style picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setVariantOpen(o => !o)}
                title="Estilo de mapa"
                style={{
                  height: 32, padding: '0 10px', borderRadius: 7,
                  background: variantOpen ? T.primary : '#fff',
                  border: `1px solid ${variantOpen ? T.primary : T.border}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,.12)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: variantOpen ? '#fff' : T.ink,
                }}
              >
                <Icon name="layers" size={13} color={variantOpen ? '#fff' : T.inkMid} />
                {MAP_VARIANTS.find(v => v.id === mapVariant)?.label ?? 'Mapa'}
              </button>
              {variantOpen && (
                <div style={{
                  position: 'absolute', top: 38, right: 0, zIndex: 600,
                  background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10,
                  padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,.14)',
                  display: 'grid', gridTemplateColumns: 'repeat(2, 68px)', gap: 6,
                }}>
                  {MAP_VARIANTS.map(v => {
                    const active = mapVariant === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => { setMapVariant(v.id); setVariantOpen(false); }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          padding: 5, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                          background: active ? T.primaryTint : 'transparent',
                          border: `1px solid ${active ? T.primary : 'transparent'}`,
                        }}
                      >
                        <span style={{ width: '100%', height: 32, borderRadius: 5, background: v.swatch, border: `1px solid ${T.border}` }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: active ? T.primary : T.inkMid }}>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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

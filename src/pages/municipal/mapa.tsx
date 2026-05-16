import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
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

export default function MunicipalMapa() {
  const { reports, mergeReport } = useReports({ poll: true });
  const { bins } = useBins();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<MuniFilters>(EMPTY_FILTERS);
  const [layer, setLayer] = useState<'pines' | 'heatmap'>('pines');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
            bins={layer === 'pines' ? bins : []}
            showHeatmap={layer === 'heatmap'}
            selectedId={selectedId}
            onReportClick={(r) => setSelectedId(r.id)}
            variant="voyager"
          />

          {/* layer toggle */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 500 }}>
            <MapBtn icon={<Icon name="pin" size={13} />} label="Pines" active={layer === 'pines'} onClick={() => setLayer('pines')} />
            <MapBtn icon={<Icon name="flame" size={13} />} label="Heatmap" active={layer === 'heatmap'} onClick={() => setLayer('heatmap')} />
          </div>

          {/* legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 500,
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', minWidth: 190,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
              {layer === 'heatmap' ? 'Densidad de incidencias' : 'Tipo de contenedor'}
            </div>
            {layer === 'heatmap' ? (
              <div>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#005A9C,#E8A317,#C0392B)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.inkMid, marginTop: 3 }}>
                  <span>Baja</span><span>Alta</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {CONTAINERS.map((c) => (
                  <div key={c.type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.ink }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }} />
                    {c.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* count pill */}
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 500,
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8,
            padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: T.ink,
          }}>
            {filtered.length} incidencia{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* RIGHT PANEL — escritorio */}
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

      {/* DETALLE — overlay en móvil */}
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

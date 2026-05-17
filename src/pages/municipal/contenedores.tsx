import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import MunicipalShell from '@/components/municipal/MunicipalShell';
import { Icon } from '@/components/ui/Icon';
import { useBins } from '@/hooks/useBins';
import { useReports } from '@/hooks/useReports';
import { useIsMobile } from '@/hooks/useIsMobile';
import { THEME } from '@/lib/theme';
import { CONTAINERS, containerMeta } from '@/lib/constants';
import { Bin, ContainerType } from '@/types';
import type { MapVariant } from '@/components/MapView';

const T = THEME;
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const MAP_VARIANTS: { id: MapVariant; label: string; swatch: string }[] = [
  { id: 'voyager',   label: 'Calles',   swatch: 'linear-gradient(135deg,#E7EFE3,#CBD9C9)' },
  { id: 'light',     label: 'Claro',    swatch: 'linear-gradient(135deg,#F4F6F8,#DDE3E8)' },
  { id: 'dark',      label: 'Oscuro',   swatch: 'linear-gradient(135deg,#3A3A48,#1A1A26)' },
  { id: 'satellite', label: 'Satélite', swatch: 'linear-gradient(135deg,#5C6E45,#2E3A24)' },
];

function incidentBadge(active: number) {
  if (active === 0) return { bg: T.appBg, border: T.border, color: T.inkLight, label: '—' };
  if (active <= 2)  return { bg: T.warn + '18', border: T.warn + '66', color: T.warn, label: String(active) };
  return { bg: T.danger + '15', border: T.danger + '55', color: T.danger, label: String(active) };
}

// ── Fila de contenedor ────────────────────────────────────────
function BinRow({ bin, active, selected, onClick }: {
  bin: Bin; active: number; selected: boolean; onClick: () => void;
}) {
  const meta = containerMeta(bin.type);
  const badge = incidentBadge(active);
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', cursor: 'pointer',
        background: selected ? T.primaryTint : 'transparent',
        borderLeft: `3px solid ${selected ? T.primary : 'transparent'}`,
        borderBottom: `1px solid ${T.borderSoft}`,
        transition: 'background 0.12s',
      }}
    >
      {/* Tipo */}
      <span style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: meta.color + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: meta.color }} />
      </span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: selected ? T.primary : T.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {bin.address}
        </div>
        <div style={{ fontSize: 11, color: T.inkMid, display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
          <span>{meta.label}</span>
          <span style={{ color: T.border }}>·</span>
          <span>{bin.area}</span>
          {bin.capacityLiters && (
            <><span style={{ color: T.border }}>·</span><span>{bin.capacityLiters}L</span></>
          )}
        </div>
      </div>

      {/* Badge incidencias activas */}
      <span style={{
        minWidth: 26, height: 22, borderRadius: 6, padding: '0 6px',
        background: badge.bg, border: `1px solid ${badge.border}`,
        color: badge.color, fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {badge.label}
      </span>

      <Icon name="chevron-r" size={13} color={T.inkLight} />
    </div>
  );
}

// ── Tarjeta de detalle (superpuesta al mapa) ──────────────────
function BinDetailCard({ bin, active, total, onClose }: {
  bin: Bin; active: number; total: number; onClose: () => void;
}) {
  const meta = containerMeta(bin.type);
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(360px, calc(100% - 32px))',
      zIndex: 500,
      background: '#fff', borderRadius: 14,
      padding: '14px 16px 12px',
      boxShadow: '0 4px 24px rgba(0,0,0,.16)',
      border: `1px solid ${T.borderSoft}`,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: meta.color + '1e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: meta.color }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{meta.label}</div>
          <div style={{ fontSize: 11.5, color: T.inkMid, marginTop: 1 }}>
            {bin.address}{bin.area ? ` · ${bin.area}` : ''}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: T.appBg, border: 'none', borderRadius: 6,
          width: 26, height: 26, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <Icon name="x" size={13} color={T.inkMid} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Capacidad', value: bin.capacityLiters ? `${bin.capacityLiters}L` : '—' },
          { label: 'Inc. activas', value: String(active), accent: active > 0 ? T.warn : undefined },
          { label: 'Inc. totales', value: String(total) },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{
            flex: 1, background: T.appBg, borderRadius: 8,
            padding: '7px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: accent ?? T.ink }}>{value}</div>
            <div style={{ fontSize: 10, color: T.inkMid, marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ContenedoresPage() {
  const { bins, loading: binsLoading } = useBins();
  const { reports } = useReports({ poll: true });
  const isMobile = useIsMobile();

  const [typeFilter, setTypeFilter] = useState<Set<ContainerType>>(new Set());
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [mapVariant, setMapVariant] = useState<MapVariant>('voyager');
  const [variantOpen, setVariantOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // Incidencias por bin
  const incidentsByBin = useMemo(() => {
    const m = new Map<string, { active: number; total: number }>();
    reports.forEach(r => {
      if (!r.binId) return;
      const cur = m.get(r.binId) ?? { active: 0, total: 0 };
      cur.total++;
      if (r.status !== 'resuelto') cur.active++;
      m.set(r.binId, cur);
    });
    return m;
  }, [reports]);

  // Bins filtrados
  const filteredBins = useMemo(() => {
    const q = search.toLowerCase().trim();
    return bins.filter(b => {
      if (typeFilter.size > 0 && !typeFilter.has(b.type)) return false;
      if (areaFilter && b.area !== areaFilter) return false;
      if (q && !b.address.toLowerCase().includes(q) && !b.area.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [bins, typeFilter, areaFilter, search]);

  // Zonas únicas
  const areas = useMemo(() => [...new Set(bins.map(b => b.area))].sort(), [bins]);

  // KPIs globales
  const totalWithIncidents = bins.filter(b => (incidentsByBin.get(b.id)?.active ?? 0) > 0).length;
  const byType = CONTAINERS.map(c => ({ ...c, count: bins.filter(b => b.type === c.type).length }));

  const toggleType = (t: ContainerType) => {
    setTypeFilter(prev => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  };

  const handleSelectBin = (bin: Bin) => {
    setSelectedBin(prev => prev?.id === bin.id ? null : bin);
  };

  const selInc = selectedBin ? (incidentsByBin.get(selectedBin.id) ?? { active: 0, total: 0 }) : null;

  return (
    <MunicipalShell activeNav="contenedores" title="EcoChicharro · Contenedores">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── CABECERA ────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderBottom: `1px solid ${T.border}`,
          padding: '14px 20px 12px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: T.ink, margin: 0 }}>Contenedores</h1>
            <span style={{ fontSize: 12, color: T.inkMid }}>
              {binsLoading ? 'Cargando…' : `${bins.length} registrados · ${totalWithIncidents} con incidencias activas`}
            </span>
          </div>

          {/* KPI por tipo */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {byType.filter(c => c.count > 0).map(c => (
              <button
                key={c.type}
                onClick={() => toggleType(c.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 999,
                  background: typeFilter.has(c.type) ? c.color + '20' : T.appBg,
                  border: `1px solid ${typeFilter.has(c.type) ? c.color : T.border}`,
                  cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
                  color: typeFilter.has(c.type) ? c.color : T.inkMid,
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 999, background: c.color, flexShrink: 0 }} />
                {c.label}
                <span style={{ fontWeight: 700, color: typeFilter.has(c.type) ? c.color : T.ink }}>{c.count}</span>
              </button>
            ))}
            {typeFilter.size > 0 && (
              <button
                onClick={() => setTypeFilter(new Set())}
                style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 11, color: T.inkMid }}
              >
                Limpiar filtros ×
              </button>
            )}
          </div>
        </div>

        {/* ── BARRA DE BÚSQUEDA + ZONA ─────────────────────────── */}
        <div style={{
          background: '#fff', borderBottom: `1px solid ${T.border}`,
          padding: '8px 14px', display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center',
        }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 7,
            background: T.appBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px',
          }}>
            <Icon name="search" size={14} color={T.inkMid} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por dirección o zona…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: T.ink }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Icon name="x" size={13} color={T.inkMid} />
              </button>
            )}
          </div>

          {/* Zona */}
          <select
            value={areaFilter ?? ''}
            onChange={e => setAreaFilter(e.target.value || null)}
            style={{
              border: `1px solid ${areaFilter ? T.primary : T.border}`,
              borderRadius: 8, padding: '7px 10px', fontSize: 12.5,
              color: areaFilter ? T.primary : T.inkMid, background: areaFilter ? T.primaryTint : '#fff',
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit', fontWeight: areaFilter ? 600 : 400,
            }}
          >
            <option value="">Todas las zonas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Móvil: toggle lista/mapa */}
          {isMobile && (
            <button
              onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
              style={{
                height: 36, padding: '0 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: T.ink, display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Icon name={mobileView === 'list' ? 'pin' : 'list'} size={14} color={T.inkMid} />
              {mobileView === 'list' ? 'Mapa' : 'Lista'}
            </button>
          )}
        </div>

        {/* ── CONTENIDO PRINCIPAL ──────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LISTA */}
          {(!isMobile || mobileView === 'list') && (
            <div style={{
              width: isMobile ? '100%' : 400, flex: '0 0 auto',
              borderRight: isMobile ? 'none' : `1px solid ${T.border}`,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* Conteo filtrado */}
              <div style={{
                padding: '6px 14px', fontSize: 11, color: T.inkMid,
                borderBottom: `1px solid ${T.borderSoft}`, flexShrink: 0,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>{filteredBins.length} contenedor{filteredBins.length !== 1 ? 'es' : ''}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: T.warn }} />inc. activas
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: T.appBg, border: `1px solid ${T.border}`, marginLeft: 6 }} />sin alertas
                </span>
              </div>

              <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                {binsLoading && (
                  <div style={{ padding: 24, textAlign: 'center', color: T.inkMid, fontSize: 13 }}>Cargando contenedores…</div>
                )}
                {!binsLoading && filteredBins.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: T.inkMid, fontSize: 13 }}>
                    Sin resultados para la búsqueda actual.
                  </div>
                )}
                {filteredBins.map(bin => (
                  <BinRow
                    key={bin.id}
                    bin={bin}
                    active={incidentsByBin.get(bin.id)?.active ?? 0}
                    selected={selectedBin?.id === bin.id}
                    onClick={() => handleSelectBin(bin)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* MAPA */}
          {(!isMobile || mobileView === 'map') && (
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
              <MapView
                bins={filteredBins}
                selectedId={selectedBin?.id ?? undefined}
                onBinClick={handleSelectBin}
                variant={mapVariant}
              />

              {/* Selector de estilo de mapa */}
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 500 }}>
                <button
                  onClick={() => setVariantOpen(o => !o)}
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

              {/* Tarjeta de detalle del bin seleccionado */}
              {selectedBin && selInc && (
                <BinDetailCard
                  bin={selectedBin}
                  active={selInc.active}
                  total={selInc.total}
                  onClose={() => setSelectedBin(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </MunicipalShell>
  );
}

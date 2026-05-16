import { useState, useMemo } from 'react';
import MunicipalShell, { MuniFilters, EMPTY_FILTERS, applyFilters } from '@/components/municipal/MunicipalShell';
import DetailPanel from '@/components/municipal/DetailPanel';
import { Badge, Button } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { useReports } from '@/hooks/useReports';
import { useIsMobile } from '@/hooks/useIsMobile';
import { THEME } from '@/lib/theme';
import { containerMeta, incidentMeta, statusMeta, priorityMeta } from '@/lib/constants';
import { Report } from '@/types';

const T = THEME;

const COLS = ['Código', 'Tipo', 'Incidencia', 'Estado', 'Prioridad', 'Dirección', 'Zona', 'Fecha'];

export default function MunicipalLista() {
  const { reports, mergeReport } = useReports({ poll: true });
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<MuniFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  return (
    <MunicipalShell
      activeNav="lista"
      title="EcoChicharro · Incidencias"
      reports={reports}
      filters={filters}
      onFilters={setFilters}
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LISTA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{
            padding: isMobile ? '12px 14px' : '14px 20px', borderBottom: `1px solid ${T.border}`,
            background: '#fff', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>Incidencias</h1>
              <div style={{ fontSize: 11.5, color: T.inkMid }}>
                {filtered.length} de {reports.length} · ordenadas por fecha
              </div>
            </div>
            <div style={{ flex: 1 }} />
            {!isMobile && (
              <Button kind="ghost" size="sm" icon={<Icon name="export" size={13} />}>Exportar CSV</Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.inkMid, fontSize: 13 }}>
              Sin incidencias con los filtros seleccionados.
            </div>
          ) : isMobile ? (
            /* ----- Tarjetas (móvil) ----- */
            <div className="thin-scroll" style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((r) => (
                <ReportCard key={r.id} report={r} selected={r.id === selectedId} onClick={() => setSelectedId(r.id)} />
              ))}
            </div>
          ) : (
            /* ----- Tabla (escritorio) ----- */
            <div className="thin-scroll" style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: T.appBg, color: T.inkMid, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {COLS.map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: T.appBg }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const c = containerMeta(r.containerType);
                    const sm = statusMeta(r.status);
                    const pm = priorityMeta(r.priority);
                    const isSel = r.id === selectedId;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        style={{
                          borderBottom: `1px solid ${T.borderSoft}`, cursor: 'pointer',
                          background: isSel ? T.primaryTint : '#fff',
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: T.inkMid, fontSize: 11.5 }}>{r.code}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }} />
                            <span style={{ color: T.ink, fontWeight: 500 }}>{c.label}</span>
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: T.ink, fontWeight: 500 }}>{incidentMeta(r.incidentType).label}</td>
                        <td style={{ padding: '10px 12px' }}><Badge color={sm.color} label={sm.label} size="sm" /></td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: pm.color }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: pm.color }} />
                            {pm.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: T.ink }}>{r.address || '—'}</td>
                        <td style={{ padding: '10px 12px', color: T.inkMid }}>{r.area}</td>
                        <td style={{ padding: '10px 12px', color: T.inkMid, whiteSpace: 'nowrap' }}>
                          {new Date(r.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DETALLE — panel lateral en escritorio */}
        {!isMobile && selected && (
          <div style={{ width: 380, flex: '0 0 380px', background: '#fff', borderLeft: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <DetailPanel report={selected} onClose={() => setSelectedId(null)} onUpdated={mergeReport} />
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
            style={{ width: '100%', maxHeight: '90%', background: '#fff', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}
          >
            <DetailPanel report={selected} onClose={() => setSelectedId(null)} onUpdated={mergeReport} />
          </div>
        </div>
      )}
    </MunicipalShell>
  );
}

function ReportCard({ report, selected, onClick }: { report: Report; selected: boolean; onClick: () => void }) {
  const c = containerMeta(report.containerType);
  const sm = statusMeta(report.status);
  const pm = priorityMeta(report.priority);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, padding: 12, textAlign: 'left', width: '100%',
        background: '#fff', borderRadius: 12, cursor: 'pointer',
        border: `1px solid ${selected ? T.primary : T.border}`,
        borderLeft: `4px solid ${pm.color}`,
      }}
    >
      <span style={{
        width: 44, height: 44, borderRadius: 8, flex: '0 0 44px',
        background: c.color + '22', color: c.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={containerIconName(report.containerType)} size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.inkMid }}>{report.code}</span>
          <Badge color={sm.color} label={sm.label} size="sm" />
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{incidentMeta(report.incidentType).label}</div>
        <div style={{ fontSize: 11.5, color: T.inkMid, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="pin" size={11} />
          {report.address || report.area} · {report.area}
        </div>
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: pm.color, alignSelf: 'flex-start' }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: pm.color }} />
        {pm.label}
      </span>
    </button>
  );
}

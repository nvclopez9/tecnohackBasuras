import { useRouter } from 'next/router';
import { useState } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Chip, Badge, ContainerChip } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { useReports } from '@/hooks/useReports';
import { THEME } from '@/lib/theme';
import { containerMeta, incidentMeta, statusMeta, STATUSES } from '@/lib/constants';
import { Report, ReportStatus } from '@/types';

const T = THEME;

function relativeDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function Thumb({ report }: { report: Report }) {
  const c = containerMeta(report.containerType);
  if (report.thumbnail) {
    return (
      <img
        src={report.thumbnail}
        alt=""
        style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flex: '0 0 64px' }}
      />
    );
  }
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 8, flex: '0 0 64px',
      background: `linear-gradient(135deg, ${c.color}44, ${c.color}18)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color,
    }}>
      <Icon name={containerIconName(report.containerType)} size={26} />
    </div>
  );
}

export default function IncidenciasPage() {
  const router = useRouter();
  const { reports, loading } = useReports({ filters: { userId: 'user-maria' } });
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');

  const shown = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  return (
    <CitizenLayout title="EcoChicharro · Mis reportes">
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
        padding: '18px 16px 12px', background: `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryDark} 100%)`, borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Mis reportes</div>
        <div className="no-scrollbar" style={{ marginTop: 10, display: 'flex', gap: 6, overflowX: 'auto' }}>
          <Chip label={`Todas · ${reports.length}`} active={filter === 'all'} onClick={() => setFilter('all')} size="sm" />
          {STATUSES.map((s) => {
            const n = reports.filter((r) => r.status === s.status).length;
            return (
              <Chip
                key={s.status}
                label={`${s.label} · ${n}`}
                active={filter === s.status}
                onClick={() => setFilter(s.status)}
                size="sm"
              />
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="thin-scroll" style={{ position: 'absolute', inset: `122px 0 ${NAV_HEIGHT}px 0`, overflowY: 'auto', padding: '10px 14px 16px' }}>
        {loading && reports.length === 0 ? (
          <p style={{ textAlign: 'center', color: T.inkMid, padding: 40, fontSize: 13 }}>Cargando…</p>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: T.primaryMist,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Icon name="list" size={28} color={T.primary} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Sin reportes</div>
            <div style={{ fontSize: 12.5, color: T.inkMid, marginTop: 4 }}>
              Usa el botón Reportar para crear el primero.
            </div>
          </div>
        ) : (
          shown.map((r) => {
            const im = incidentMeta(r.incidentType);
            const sm = statusMeta(r.status);
            return (
              <div
                key={r.id}
                onClick={() => router.push(`/ciudadano/incidencias/${r.id}`)}
                style={{
                  background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12,
                  padding: 12, marginBottom: 10, display: 'flex', gap: 12, cursor: 'pointer',
                }}
              >
                <Thumb report={r} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <ContainerChip type={r.containerType} size="sm" />
                    <Badge color={sm.color} label={sm.label} size="sm" />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, lineHeight: 1.25 }}>{im.label}</div>
                  <div style={{ fontSize: 11.5, color: T.inkMid, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="pin" size={11} />
                    {r.address || r.area} · {relativeDate(r.createdAt)}
                  </div>
                </div>
                <Icon name="chevron-r" size={16} color={T.inkLight} />
              </div>
            );
          })
        )}
      </div>
    </CitizenLayout>
  );
}

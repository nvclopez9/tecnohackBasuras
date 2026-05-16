import { useEffect, useState, ReactNode } from 'react';
import MunicipalShell from '@/components/municipal/MunicipalShell';
import { KPI, Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { CONTAINERS, INCIDENTS, STATUSES, containerMeta, incidentMeta } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Stats, Report } from '@/types';

const T = THEME;
const DAY = 86400000;

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: T.inkMid, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function DonutChart({ stats }: { stats: Stats }) {
  const data = STATUSES.map((s) => ({ label: s.label, value: stats.byStatus[s.status] ?? 0, color: s.color }));
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 80, cy = 80, r = 60, sw = 22;
  let a = -Math.PI / 2;
  const arcs = data.filter((d) => d.value > 0).map((d) => {
    const ang = (d.value / total) * Math.PI * 2;
    const a0 = a, a1 = a + ang;
    a = a1;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = ang > Math.PI ? 1 : 0;
    return { d: `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`, color: d.color };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="150" height="150" viewBox="0 0 160 160">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={sw} strokeLinecap="round" />
        ))}
        <text x="80" y="78" textAnchor="middle" fontSize="26" fontWeight="700" fill={T.ink}>{stats.total}</text>
        <text x="80" y="96" textAnchor="middle" fontSize="10" fill={T.inkMid}>total</text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.borderSoft}` }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span style={{ flex: 1, fontSize: 12.5, color: T.ink }}>{d.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{d.value}</span>
            <span style={{ fontSize: 10.5, color: T.inkMid, width: 34, textAlign: 'right' }}>
              {Math.round((d.value / (stats.total || 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarRows({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: d.color, flex: '0 0 8px' }} />
          <span style={{ width: 78, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>{d.label}</span>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.appBg, overflow: 'hidden' }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', background: d.color, borderRadius: 4 }} />
          </div>
          <span style={{ width: 24, textAlign: 'right', color: T.ink, fontWeight: 600 }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function AreaChart({ reports }: { reports: Report[] }) {
  const days = 14;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = today.getTime() - (days - 1) * DAY;
  const counts = new Array(days).fill(0);
  reports.forEach((r) => {
    const idx = Math.floor((r.createdAt - start) / DAY);
    if (idx >= 0 && idx < days) counts[idx] += 1;
  });
  const max = Math.max(...counts, 4);
  const w = 520, h = 170, pl = 26, pr = 10, pt = 10, pb = 22;
  const innerW = w - pl - pr, innerH = h - pt - pb;
  const pts = counts.map((v, i) => [pl + (i / (days - 1)) * innerW, pt + (1 - v / max) * innerH]);
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const area = line + ` L ${pts[days - 1][0]},${pt + innerH} L ${pts[0][0]},${pt + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={170}>
      <defs>
        <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={T.primary} stopOpacity="0.26" />
          <stop offset="100%" stopColor={T.primary} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t, i) => (
        <line key={i} x1={pl} x2={w - pr} y1={pt + t * innerH} y2={pt + t * innerH} stroke={T.border} strokeWidth="1" />
      ))}
      <path d={area} fill="url(#ag)" />
      <path d={line} fill="none" stroke={T.primary} strokeWidth="2.2" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill={T.primary} />)}
      {[0, 7, 13].map((i) => {
        const d = new Date(start + i * DAY);
        return (
          <text key={i} x={pts[i][0]} y={h - 6} fill={T.inkMid} fontSize="9" textAnchor="middle">
            {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </text>
        );
      })}
    </svg>
  );
}

function Hotspots({ stats }: { stats: Stats }) {
  return (
    <div>
      {stats.byArea.slice(0, 6).map((h, i) => (
        <div key={h.area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${T.borderSoft}` }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6,
            background: i < 3 ? T.danger + '18' : T.appBg, color: i < 3 ? T.danger : T.inkMid,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
          }}>{i + 1}</span>
          <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: T.ink }}>{h.area}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{h.count}</div>
        </div>
      ))}
      {stats.byArea.length === 0 && <div style={{ fontSize: 12, color: T.inkMid }}>Sin datos.</div>}
    </div>
  );
}

export default function MunicipalDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const load = () => {
      fetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
      fetch('/api/reports').then((r) => r.json()).then(setReports).catch(() => {});
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <MunicipalShell activeNav="dashboard" title="EcoChicharro · Cuadro de mandos">
      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto', padding: isMobile ? 14 : 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink }}>Cuadro de mandos</h1>
            <div style={{ fontSize: 12.5, color: T.inkMid, marginTop: 2 }}>
              Servicio de recogida · Santa Cruz de Tenerife
            </div>
          </div>
          <Button kind="ghost" size="sm" icon={<Icon name="export" size={14} />}>Exportar</Button>
        </div>

        {!stats ? (
          <div style={{ color: T.inkMid, fontSize: 13 }}>Cargando datos…</div>
        ) : (
          <>
            {/* Real data banner */}
            <div style={{
              background: `linear-gradient(135deg, ${T.primary}10 0%, ${T.primarySky}18 100%)`,
              border: `1px solid ${T.primary}30`, borderRadius: 10,
              padding: '10px 14px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <Icon name="cluster" size={20} color={T.primary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
                  {(stats.totalBins ?? 0).toLocaleString('es')} contenedores registrados en el sistema
                </div>
                <div style={{ fontSize: 11.5, color: T.inkMid }}>
                  Datos reales · Cabildo de Tenerife · Santa Cruz de Tenerife
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.primary, fontVariantNumeric: 'tabular-nums' }}>
                {(stats.totalBins ?? 0).toLocaleString('es')}
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
              <KPI label="Total" value={stats.total} sub="Incidencias" />
              <KPI label="Pendientes" value={stats.byStatus.pendiente} accent={T.warn} />
              <KPI label="En proceso" value={stats.byStatus.en_proceso} accent={T.primary} />
              <KPI label="Resueltas" value={stats.byStatus.resuelto} accent={T.success} />
              <KPI label="T. medio resol." value={`${stats.avgResolutionDays}d`} sub="reportes resueltos" />
              <KPI label="% alta prioridad" value={`${stats.highPriorityPct}%`} accent={T.danger} />
            </div>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
              <ChartCard title="Evolución de incidencias" subtitle="nuevas incidencias · últimos 14 días">
                <AreaChart reports={reports} />
              </ChartCard>
              <ChartCard title="Reparto por estado">
                <DonutChart stats={stats} />
              </ChartCard>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <ChartCard title="Por tipo de contenedor">
                <BarRows data={CONTAINERS.map((c) => ({ label: c.label, value: stats.byContainer[c.type] ?? 0, color: c.color }))} />
              </ChartCard>
              <ChartCard title="Por tipo de incidencia">
                <BarRows data={INCIDENTS.map((i) => ({ label: i.label.split(' / ')[0], value: stats.byIncident[i.type] ?? 0, color: T.primary }))} />
              </ChartCard>
              <ChartCard title="Puntos calientes" subtitle="ranking de zonas">
                <Hotspots stats={stats} />
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </MunicipalShell>
  );
}

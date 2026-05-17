import { useEffect, useState, ReactNode } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  AreaChart as RAreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import MunicipalShell from '@/components/municipal/MunicipalShell';
import { KPI, Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { CONTAINERS, INCIDENTS, STATUSES } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Stats, Report } from '@/types';

const T = THEME;
const DAY = 86400000;

const tooltipStyle = {
  background: '#fff',
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 4px 14px rgba(0,0,0,.1)',
};

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
  const data = STATUSES.map((s) => ({ name: s.label, value: stats.byStatus[s.status] ?? 0, color: s.color }));
  const shown = data.filter((d) => d.value > 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 150, height: 150, position: 'relative', flex: '0 0 150px' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={shown.length ? shown : [{ name: 'Sin datos', value: 1, color: T.border }]}
              dataKey="value" nameKey="name" cx="50%" cy="50%"
              innerRadius={45} outerRadius={68} paddingAngle={2} stroke="none"
              isAnimationActive
            >
              {(shown.length ? shown : [{ color: T.border }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.ink }}>{stats.total}</div>
          <div style={{ fontSize: 10, color: T.inkMid }}>total</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.borderSoft}` }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span style={{ flex: 1, fontSize: 12.5, color: T.ink }}>{d.name}</span>
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
  return (
    <div style={{ width: '100%', height: data.length * 30 + 8 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 18, top: 0, bottom: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category" dataKey="label" width={88}
            tick={{ fontSize: 11, fill: T.ink }} axisLine={false} tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: T.borderSoft }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={13} isAnimationActive>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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
  const data = counts.map((v, i) => ({
    day: new Date(start + i * DAY).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    count: v,
  }));
  return (
    <div style={{ width: '100%', height: 175 }}>
      <ResponsiveContainer>
        <RAreaChart data={data} margin={{ left: -6, right: 10, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={T.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={T.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={T.borderSoft} vertical={false} />
          <XAxis
            dataKey="day" tick={{ fontSize: 9, fill: T.inkMid }}
            axisLine={false} tickLine={false} interval={6} minTickGap={8}
          />
          <YAxis
            tick={{ fontSize: 9, fill: T.inkMid }} axisLine={false} tickLine={false}
            allowDecimals={false} width={30}
          />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: T.inkMid }} />
          <Area
            type="monotone" dataKey="count" name="Incidencias"
            stroke={T.primary} strokeWidth={2.2} fill="url(#ag)" isAnimationActive
          />
        </RAreaChart>
      </ResponsiveContainer>
    </div>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button kind="ghost" size="sm" icon={<Icon name="export" size={14} />}>Exportar</Button>
          </div>
        </div>

        {!stats ? (
          <div style={{ color: T.inkMid, fontSize: 13 }}>Cargando datos…</div>
        ) : (
          <>
<<<<<<< HEAD
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
                  Datos reales · Ayuntamiento de Santa Cruz de Tenerife · Santa Cruz de Tenerife
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

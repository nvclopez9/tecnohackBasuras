// Panel Municipal — desktop views.
// One MunicipalPanel component holds full chrome (topbar + sidebar) and
// renders one of: 'dashboard', 'mapa', 'lista', 'detalle'.

const MUNI_NAV = [
  { id: 'dashboard', label: 'Cuadro de mandos', icon: 'cluster' },
  { id: 'mapa',      label: 'Mapa analítico',   icon: 'pin' },
  { id: 'lista',     label: 'Incidencias',      icon: 'list' },
  { id: 'rutas',     label: 'Rutas',            icon: 'route' },
];

// ---------- chrome ----------
const Topbar = () => (
  <div style={{
    height: 56, background: '#fff', borderBottom: `1px solid ${ECO_TOKENS.border}`,
    display: 'flex', alignItems: 'center', padding: '0 20px', gap: 20, flex: '0 0 56px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6, background: ECO_TOKENS.primary,
        color: '#fff', fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>Ec</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: ECO_TOKENS.ink, lineHeight: 1.05 }}>EcoChicharro</div>
        <div style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid, letterSpacing: 0.6, textTransform: 'uppercase' }}>Panel Municipal</div>
      </div>
    </div>
    <div style={{ height: 24, width: 1, background: ECO_TOKENS.border }}/>
    <div style={{ fontSize: 12.5, color: ECO_TOKENS.inkMid }}>
      Cabildo Insular de Tenerife · <span style={{ color: ECO_TOKENS.ink, fontWeight: 600 }}>Servicios de Limpieza</span>
    </div>
    <div style={{ flex: 1 }}/>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: ECO_TOKENS.appBg, border: `1px solid ${ECO_TOKENS.border}`,
      borderRadius: 8, padding: '7px 12px', minWidth: 280,
    }}>
      <Icon name="search" size={14} color={ECO_TOKENS.inkMid}/>
      <input placeholder="Buscar incidencia, calle, ID…" style={{
        flex: 1, border: 'none', background: 'transparent', outline: 'none',
        fontSize: 12.5, color: ECO_TOKENS.ink, fontFamily: 'inherit',
      }}/>
      <span style={{ fontSize: 10.5, color: ECO_TOKENS.inkLight, fontFamily: 'ui-monospace, monospace' }}>⌘K</span>
    </div>
    <button style={{
      width: 36, height: 36, borderRadius: 8, background: ECO_TOKENS.appBg,
      border: `1px solid ${ECO_TOKENS.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      color: ECO_TOKENS.ink,
    }}><Icon name="bell" size={16}/></button>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px 0 10px', borderLeft: `1px solid ${ECO_TOKENS.border}`, height: 36 }}>
      <div style={{ width: 30, height: 30, borderRadius: 999, background: ECO_TOKENS.primaryTint, color: ECO_TOKENS.primary, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>JM</div>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: ECO_TOKENS.ink }}>Juan Méndez</div>
        <div style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid }}>Coord. recogida</div>
      </div>
    </div>
  </div>
);

const Sidebar = ({ active, onNavigate }) => (
  <div style={{
    width: 280, background: '#fff', borderRight: `1px solid ${ECO_TOKENS.border}`,
    flex: '0 0 280px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
    {/* Nav */}
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 10px 8px' }}>
        Navegación
      </div>
      {MUNI_NAV.map(n => {
        const isActive = active === n.id || (active === 'detalle' && n.id === 'lista');
        return (
          <button key={n.id} onClick={() => onNavigate(n.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 6,
            background: isActive ? ECO_TOKENS.primaryTint : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            color: isActive ? ECO_TOKENS.primary : ECO_TOKENS.ink,
            fontSize: 13, fontWeight: isActive ? 600 : 500,
            marginBottom: 2,
          }}>
            <Icon name={n.icon} size={16}/>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.id === 'lista' && <span style={{ fontSize: 10.5, fontWeight: 600, color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums' }}>{ECO_REPORTS.length}</span>}
          </button>
        );
      })}
    </div>

    <div style={{ height: 1, background: ECO_TOKENS.border, margin: '4px 12px' }}/>

    {/* Filters */}
    <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        Filtros activos · 2
      </div>

      <FilterSection title="Rango de fechas" defaultOpen>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {['7d', '30d', '90d', 'Año'].map((d, i) => (
            <button key={d} style={{
              flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 600,
              borderRadius: 6, border: `1px solid ${i === 1 ? ECO_TOKENS.primary : ECO_TOKENS.border}`,
              background: i === 1 ? ECO_TOKENS.primaryTint : '#fff',
              color: i === 1 ? ECO_TOKENS.primary : ECO_TOKENS.ink,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{d}</button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: ECO_TOKENS.inkMid, fontFamily: 'ui-monospace, monospace' }}>
          15 abr – 15 may
        </div>
      </FilterSection>

      <FilterSection title="Tipo de contenedor">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {Object.keys(ECO_TOKENS.containers).map((k, i) => {
            const c = ECO_TOKENS.containers[k];
            const checked = [0, 1, 3, 4].includes(i);
            return (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: ECO_TOKENS.ink, cursor: 'pointer' }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: `1.5px solid ${checked ? ECO_TOKENS.primary : ECO_TOKENS.inkLight}`,
                  background: checked ? ECO_TOKENS.primary : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>{checked && <Icon name="check" size={10}/>}</span>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }}/>
                <span style={{ flex: 1 }}>{c.label}</span>
                <span style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums' }}>
                  {12 + i * 5}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Estado">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {Object.entries(ECO_TOKENS.statuses).map(([k, v]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: ECO_TOKENS.ink, cursor: 'pointer' }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${ECO_TOKENS.inkLight}`, background: '#fff' }}/>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: v.color }}/>
              <span style={{ flex: 1 }}>{v.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Prioridad">
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {Object.entries(ECO_TOKENS.priorities).map(([k, v], i) => (
            <button key={k} style={{
              flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 600,
              borderRadius: 6, border: `1px solid ${i === 2 ? v.color : ECO_TOKENS.border}`,
              background: i === 2 ? v.color + '15' : '#fff',
              color: i === 2 ? v.color : ECO_TOKENS.ink,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{v.label}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Zona">
        <div style={{ marginTop: 6, fontSize: 12, color: ECO_TOKENS.ink }}>
          {['Centro', 'Anaga', 'Salud', 'Ofra'].map((z, i) => (
            <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: i === 3 ? 'none' : `1px solid ${ECO_TOKENS.borderSoft}` }}>
              <Icon name="pin" size={11} color={ECO_TOKENS.inkMid}/>
              <span style={{ flex: 1 }}>{z}</span>
              <span style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums' }}>{[18, 6, 9, 4][i]}</span>
            </div>
          ))}
        </div>
      </FilterSection>
    </div>

    {/* Footer actions */}
    <div style={{ padding: 12, borderTop: `1px solid ${ECO_TOKENS.border}`, display: 'flex', gap: 8 }}>
      <Button kind="ghost" size="sm" style={{ flex: 1 }}>Limpiar</Button>
      <Button kind="primary" size="sm" style={{ flex: 1 }}>Aplicar</Button>
    </div>
  </div>
);

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14, borderBottom: `1px solid ${ECO_TOKENS.borderSoft}`, paddingBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', width: '100%', padding: 0,
        background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        color: ECO_TOKENS.ink, fontSize: 12.5, fontWeight: 700,
      }}>
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        <Icon name={open ? 'chevron-d' : 'chevron-r'} size={14} color={ECO_TOKENS.inkMid}/>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ---------- DASHBOARD ----------
const ViewDashboard = () => (
  <div style={{ flex: 1, overflow: 'auto', padding: 20, background: ECO_TOKENS.appBg }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: ECO_TOKENS.ink, margin: 0 }}>Cuadro de mandos</h1>
        <div style={{ fontSize: 12.5, color: ECO_TOKENS.inkMid, marginTop: 2 }}>Periodo: últimos 30 días · actualizado hace 4 min</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button kind="ghost" size="sm" icon={<Icon name="export" size={14}/>}>Exportar</Button>
        <Button kind="ghost" size="sm" icon={<Icon name="filter" size={14}/>}>Cambiar periodo</Button>
      </div>
    </div>

    {/* KPI row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
      <KPI label="Total" value="284" sub="Incidencias en periodo" trend={{ dir: 'up', value: '+12%' }}/>
      <KPI label="Pendientes" value="42" sub="14% del total" accent={ECO_TOKENS.warn}/>
      <KPI label="En proceso" value="63" sub="22% del total" accent={ECO_TOKENS.primary}/>
      <KPI label="Resueltas" value="179" sub="63% del total" accent={ECO_TOKENS.success} trend={{ dir: 'up', value: '+8%' }}/>
      <KPI label="T. medio resol." value="1.8d" sub="−0.4 d vs. anterior" trend={{ dir: 'up', value: '−18%' }}/>
      <KPI label="% alta prio." value="17%" sub="48 reportes" accent={ECO_TOKENS.danger}/>
    </div>

    {/* Charts row 1 */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
      <ChartCard title="Evolución de incidencias" subtitle="últimos 30 días, por estado">
        <AreaChart/>
      </ChartCard>
      <ChartCard title="Reparto por estado">
        <DonutChart/>
      </ChartCard>
    </div>

    {/* Charts row 2 */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      <ChartCard title="Por tipo de contenedor">
        <BarChart kind="container"/>
      </ChartCard>
      <ChartCard title="Por tipo de incidencia">
        <BarChart kind="incident"/>
      </ChartCard>
      <ChartCard title="Hot spots" subtitle="ranking de zonas">
        <HotspotsList/>
      </ChartCard>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div style={{ background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 8, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: ECO_TOKENS.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <button style={{ background: 'transparent', border: 'none', color: ECO_TOKENS.inkMid, cursor: 'pointer', padding: 2 }}><Icon name="kebab" size={14}/></button>
    </div>
    {children}
  </div>
);

// Inline area chart (SVG)
const AreaChart = () => {
  const data = [12, 18, 14, 22, 19, 28, 24, 31, 26, 33, 30, 38, 34, 29, 35, 41, 38, 44, 36, 31, 28, 35, 39, 42, 36, 48, 45, 52, 47, 54];
  const max = Math.max(...data);
  const w = 520, h = 180, pl = 30, pr = 8, pt = 8, pb = 22;
  const innerW = w - pl - pr, innerH = h - pt - pb;
  const pts = data.map((v, i) => [pl + (i / (data.length - 1)) * innerW, pt + (1 - v / max) * innerH]);
  const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const areaPath = linePath + ` L ${pts[pts.length - 1][0]},${pt + innerH} L ${pts[0][0]},${pt + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={180}>
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={ECO_TOKENS.primary} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={ECO_TOKENS.primary} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pl} x2={w - pr} y1={pt + t * innerH} y2={pt + t * innerH} stroke={ECO_TOKENS.border} strokeWidth="1"/>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <text key={`l${i}`} x={pl - 5} y={pt + t * innerH + 3} fill={ECO_TOKENS.inkMid} fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="end">{Math.round(max * (1 - t))}</text>
      ))}
      <path d={areaPath} fill="url(#areaGrad)"/>
      <path d={linePath} fill="none" stroke={ECO_TOKENS.primary} strokeWidth="2"/>
      {/* secondary line (resolved) */}
      <path d={pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + (p[1] + 22)).join(' ')} fill="none" stroke={ECO_TOKENS.success} strokeWidth="1.5" strokeDasharray="3 3"/>
      {/* x labels */}
      {[0, 7, 14, 21, 29].map((i) => (
        <text key={`x${i}`} x={pts[i][0]} y={h - 6} fill={ECO_TOKENS.inkMid} fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">
          {`${15 + i > 31 ? (15 + i - 31) : 15 + i} ${15 + i > 31 ? 'may' : 'abr'}`}
        </text>
      ))}
      {/* legend */}
      <g transform={`translate(${w - 180}, 16)`}>
        <circle cx="0" cy="0" r="3" fill={ECO_TOKENS.primary}/>
        <text x="8" y="3" fontSize="10" fill={ECO_TOKENS.inkMid} fontFamily="Inter, sans-serif">Nuevas</text>
        <circle cx="60" cy="0" r="3" fill={ECO_TOKENS.success}/>
        <text x="68" y="3" fontSize="10" fill={ECO_TOKENS.inkMid} fontFamily="Inter, sans-serif">Resueltas</text>
      </g>
    </svg>
  );
};

// Donut chart
const DonutChart = () => {
  const data = [
    { label: 'Resueltas',  value: 179, color: ECO_TOKENS.success },
    { label: 'En proceso', value: 63,  color: ECO_TOKENS.primary },
    { label: 'Pendientes', value: 42,  color: ECO_TOKENS.warn },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 80, cy = 80, r = 60, sw = 22;
  let a = -Math.PI / 2;
  const arcs = data.map(d => {
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
      <svg width="160" height="160" viewBox="0 0 160 160">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={sw}/>
        ))}
        <text x="80" y="78" textAnchor="middle" fontSize="24" fontWeight="700" fill={ECO_TOKENS.ink} fontFamily="Inter, sans-serif">{total}</text>
        <text x="80" y="96" textAnchor="middle" fontSize="10" fill={ECO_TOKENS.inkMid} fontFamily="Inter, sans-serif">total</text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${ECO_TOKENS.borderSoft}` }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }}/>
            <span style={{ flex: 1, fontSize: 12.5, color: ECO_TOKENS.ink }}>{d.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
            <span style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums', width: 32, textAlign: 'right' }}>
              {Math.round(d.value / total * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChart = ({ kind }) => {
  const data = kind === 'container'
    ? Object.entries(ECO_TOKENS.containers).map(([k, v], i) => ({ k, label: v.label, color: v.color, val: [62, 48, 41, 32, 28, 22, 18, 14][i] }))
    : Object.entries(ECO_TOKENS.incidents).map(([k, v], i) => ({ k, label: v.label, color: ECO_TOKENS.primary, val: [88, 54, 42, 28, 21][i] }));
  const max = Math.max(...data.map(d => d.val));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map(d => (
        <div key={d.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: d.color, flex: '0 0 8px' }}/>
          <span style={{ width: 70, color: ECO_TOKENS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>{d.label}</span>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
            <div style={{ width: `${(d.val / max) * 100}%`, height: '100%', background: d.color, borderRadius: 4 }}/>
          </div>
          <span style={{ width: 26, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: ECO_TOKENS.ink, fontWeight: 600 }}>{d.val}</span>
        </div>
      ))}
    </div>
  );
};

const HotspotsList = () => (
  <div>
    {[
      { rank: 1, name: 'Pza. de España', area: 'Centro', count: 28, trend: '+12%' },
      { rank: 2, name: 'C/ Castillo', area: 'Centro', count: 21, trend: '+8%' },
      { rank: 3, name: 'Av. Anaga 20-40', area: 'Anaga', count: 19, trend: '+22%' },
      { rank: 4, name: 'Rambla / Méndez', area: 'Rambla', count: 14, trend: '−4%' },
      { rank: 5, name: 'Tres de Mayo', area: 'Cabo', count: 12, trend: '+2%' },
    ].map(h => (
      <div key={h.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${ECO_TOKENS.borderSoft}` }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: h.rank <= 3 ? ECO_TOKENS.danger + '18' : ECO_TOKENS.appBg, color: h.rank <= 3 ? ECO_TOKENS.danger : ECO_TOKENS.inkMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{h.rank}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: ECO_TOKENS.ink, lineHeight: 1.2 }}>{h.name}</div>
          <div style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid }}>{h.area}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>{h.count}</div>
          <div style={{ fontSize: 10, color: h.trend.startsWith('−') ? ECO_TOKENS.success : ECO_TOKENS.danger, fontWeight: 600 }}>{h.trend}</div>
        </div>
      </div>
    ))}
  </div>
);

// ---------- MAPA ANALÍTICO ----------
const ViewMapa = ({ onSelect }) => {
  const [layer, setLayer] = React.useState('heatmap');  // 'pines' | 'heatmap' | 'rutas'
  const [selected, setSelected] = React.useState(null);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* MAP AREA */}
      <div style={{ flex: 1, background: ECO_TOKENS.appBg, position: 'relative', overflow: 'hidden' }}>
        <SCMap
          width={'100%'} height={'100%'}
          variant="light"
          showStreetNames={true}
          heatmap={layer === 'heatmap'}
          showRoutes={layer === 'rutas'}
          reports={layer !== 'heatmap' ? ECO_REPORTS : []}
          selectedId={selected?.id}
          onPinClick={(r) => { setSelected(r); onSelect && onSelect(r); }}
          showCluster={layer === 'pines'}
          pinSize={26}
        />
        {/* Layer toggle (top-right) */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
          <MapBtn icon={<Icon name="pin" size={13}/>} label="Pines" active={layer === 'pines'} onClick={() => setLayer('pines')}/>
          <MapBtn icon={<Icon name="flame" size={13}/>} label="Heatmap" active={layer === 'heatmap'} onClick={() => setLayer('heatmap')}/>
          <MapBtn icon={<Icon name="route" size={13}/>} label="Rutas" active={layer === 'rutas'} onClick={() => setLayer('rutas')}/>
        </div>
        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MapBtn icon={<Icon name="plus" size={14}/>} onClick={() => {}}/>
          <MapBtn icon={<span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1, display:'inline-block', width: 14, textAlign: 'center' }}>−</span>}/>
          <MapBtn icon={<Icon name="locate" size={14}/>}/>
        </div>
        {/* Legend bottom-left */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 8, padding: '10px 12px', minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            {layer === 'heatmap' ? 'Densidad de incidencias' : 'Tipo de contenedor'}
          </div>
          {layer === 'heatmap' ? (
            <div>
              <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #005A9C 0%, #E8A317 50%, #C0392B 100%)' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: ECO_TOKENS.inkMid, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                <span>0</span><span>5</span><span>10+</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {Object.entries(ECO_TOKENS.containers).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: ECO_TOKENS.ink }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: v.color }}/>
                  {v.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: 360, flex: '0 0 360px', background: '#fff', borderLeft: `1px solid ${ECO_TOKENS.border}`, overflow: 'auto' }}>
        {selected ? <DetallePanel report={selected} onClose={() => setSelected(null)}/> : <DashboardSummary/>}
      </div>
    </div>
  );
};

const DashboardSummary = () => (
  <div style={{ padding: 16 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
      Resumen periodo
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <KPI label="Total" value="284" trend={{ dir: 'up', value: '+12%' }}/>
      <KPI label="Sin atender" value="42" accent={ECO_TOKENS.warn}/>
    </div>
    <div style={{ marginTop: 14, background: ECO_TOKENS.appBg, border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 8 }}>Hot spots actuales</div>
      <HotspotsList/>
    </div>
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 8 }}>Incidencias recientes</div>
      {ECO_REPORTS.slice(0, 4).map(r => (
        <div key={r.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${ECO_TOKENS.borderSoft}` }}>
          <Pin type={r.container} status={r.status} size={22}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: ECO_TOKENS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ECO_TOKENS.incidents[r.incident].label}
            </div>
            <div style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid }}>{r.addr}</div>
          </div>
          <Badge color={ECO_TOKENS.statuses[r.status].color} label={ECO_TOKENS.statuses[r.status].label} size="sm"/>
        </div>
      ))}
    </div>
  </div>
);

const DetallePanel = ({ report, onClose }) => {
  const r = report;
  const cMeta = ECO_TOKENS.containers[r.container];
  const sMeta = ECO_TOKENS.statuses[r.status];
  return (
    <div>
      {/* photo */}
      <div style={{ position: 'relative', height: 180,
        background: `linear-gradient(135deg, ${cMeta.color}66, ${cMeta.color}22)`,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.15) 0 12px, transparent 12px 24px)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cMeta.color, opacity: 0.85 }}>
          {containerIcon(r.container, 60)}
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ECO_TOKENS.ink }}>
          <Icon name="x" size={14}/>
        </button>
        <span style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 10.5, color: '#fff', fontFamily: 'ui-monospace, monospace', background: 'rgba(0,0,0,.45)', padding: '3px 8px', borderRadius: 4 }}>
          {r.id} · captura.jpg
        </span>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <Badge color={sMeta.color} label={sMeta.label}/>
          <PriorityTag priority={r.priority} size="sm"/>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: ECO_TOKENS.ink, lineHeight: 1.2 }}>
          {ECO_TOKENS.incidents[r.incident].label}
        </div>
        <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: cMeta.color, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}/>
          Contenedor de {cMeta.label.toLowerCase()} · {r.addr}
        </div>

        {/* meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 14, borderRadius: 8, overflow: 'hidden', background: ECO_TOKENS.border }}>
          {[
            ['Reportante', r.reporter],
            ['Zona', r.area],
            ['Recibida', r.date],
            ['Equipo', 'Equipo Centro'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#fff', padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</div>
              <div style={{ fontSize: 12.5, color: ECO_TOKENS.ink, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* state actions */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Cambiar estado</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(ECO_TOKENS.statuses).map(([k, v]) => {
              const active = r.status === k;
              return (
                <button key={k} style={{
                  flex: 1, padding: '8px 6px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                  border: `1px solid ${active ? v.color : ECO_TOKENS.border}`,
                  background: active ? v.color + '18' : '#fff',
                  color: active ? v.color : ECO_TOKENS.ink,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{v.label}</button>
              );
            })}
          </div>
        </div>

        {/* resolution comment */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Comentario de resolución</div>
          <textarea placeholder="Describe la acción tomada…" style={{
            width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 8,
            border: `1px solid ${ECO_TOKENS.border}`, fontFamily: 'inherit', fontSize: 12.5,
            color: ECO_TOKENS.ink, resize: 'none', outline: 'none',
          }}/>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Button kind="ghost" size="sm" style={{ flex: 1 }}>Asignar ruta</Button>
          <Button kind="primary" size="sm" style={{ flex: 1 }}>Guardar cambios</Button>
        </div>
      </div>
    </div>
  );
};

// ---------- LISTA / TABLA ----------
const ViewLista = ({ onOpen }) => (
  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    {/* toolbar */}
    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${ECO_TOKENS.border}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: ECO_TOKENS.ink, margin: 0 }}>Incidencias</h1>
        <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid }}>{ECO_REPORTS.length} resultados · ordenadas por fecha</div>
      </div>
      <div style={{ flex: 1 }}/>
      <Button kind="ghost" size="sm" icon={<Icon name="filter" size={13}/>}>Filtros (2)</Button>
      <Button kind="ghost" size="sm" icon={<Icon name="export" size={13}/>}>Exportar CSV</Button>
      <Button kind="primary" size="sm" icon={<Icon name="route" size={13}/>}>Crear ruta (3)</Button>
    </div>

    <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: ECO_TOKENS.appBg, color: ECO_TOKENS.inkMid, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {['', 'ID', 'Tipo', 'Incidencia', 'Estado', 'Prioridad', 'Dirección', 'Zona', 'Reportante', 'Fecha', ''].map((h, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, borderBottom: `1px solid ${ECO_TOKENS.border}`, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ECO_REPORTS.map((r, idx) => {
            const c = ECO_TOKENS.containers[r.container];
            return (
              <tr key={r.id} onClick={() => onOpen && onOpen(r)} style={{
                borderBottom: `1px solid ${ECO_TOKENS.borderSoft}`,
                cursor: 'pointer',
                background: idx === 2 ? ECO_TOKENS.primaryTint + '99' : '#fff',
              }}>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${idx === 2 ? ECO_TOKENS.primary : ECO_TOKENS.inkLight}`, background: idx === 2 ? ECO_TOKENS.primary : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {idx === 2 && <Icon name="check" size={10}/>}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, monospace', color: ECO_TOKENS.inkMid, fontSize: 11.5 }}>{r.id}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }}/>
                    <span style={{ color: ECO_TOKENS.ink, fontWeight: 500 }}>{c.label}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', color: ECO_TOKENS.ink, fontWeight: 500 }}>{ECO_TOKENS.incidents[r.incident].label}</td>
                <td style={{ padding: '10px 12px' }}>
                  <Badge color={ECO_TOKENS.statuses[r.status].color} label={ECO_TOKENS.statuses[r.status].label} size="sm"/>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: ECO_TOKENS.priorities[r.priority].color }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: ECO_TOKENS.priorities[r.priority].color }}/>
                    {ECO_TOKENS.priorities[r.priority].label}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: ECO_TOKENS.ink }}>{r.addr}</td>
                <td style={{ padding: '10px 12px', color: ECO_TOKENS.inkMid }}>{r.area}</td>
                <td style={{ padding: '10px 12px', color: ECO_TOKENS.ink }}>{r.reporter}</td>
                <td style={{ padding: '10px 12px', color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.date}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button style={{ background: 'transparent', border: 'none', color: ECO_TOKENS.inkMid, cursor: 'pointer', padding: 2 }}><Icon name="chevron-r" size={14}/></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* footer pagination */}
    <div style={{ padding: '10px 20px', background: '#fff', borderTop: `1px solid ${ECO_TOKENS.border}`, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: ECO_TOKENS.inkMid }}>
      <span>Mostrando 1–{ECO_REPORTS.length} de 284</span>
      <div style={{ flex: 1 }}/>
      <Button kind="ghost" size="sm">Anterior</Button>
      <Button kind="ghost" size="sm">Siguiente</Button>
    </div>
  </div>
);

// ---------- LISTA + DETALLE (split view) ----------
const ViewListaDetalle = ({ initialReport }) => {
  const [sel, setSel] = React.useState(initialReport || ECO_REPORTS[4]);
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${ECO_TOKENS.border}` }}>
        <ViewLista onOpen={setSel}/>
      </div>
      <div style={{ width: 400, flex: '0 0 400px', background: '#fff', overflow: 'auto' }}>
        <DetallePanel report={sel} onClose={() => {}}/>
      </div>
    </div>
  );
};

// ---------- WRAPPER ----------
const MunicipalPanel = ({ initial = 'dashboard', dataLabel }) => {
  const [view, setView] = React.useState(initial);
  return (
    <div data-screen-label={dataLabel} style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: ECO_TOKENS.appBg, fontFamily: 'inherit', overflow: 'hidden',
    }}>
      <Topbar/>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar active={view} onNavigate={setView}/>
        {view === 'dashboard' && <ViewDashboard/>}
        {view === 'mapa'      && <ViewMapa/>}
        {view === 'lista'     && <ViewLista onOpen={() => setView('detalle')}/>}
        {view === 'detalle'   && <ViewListaDetalle/>}
        {view === 'rutas'     && <ViewMapa/>}
      </div>
    </div>
  );
};

Object.assign(window, {
  Topbar, Sidebar, FilterSection,
  ViewDashboard, ViewMapa, ViewLista, ViewListaDetalle, DetallePanel,
  MunicipalPanel,
});

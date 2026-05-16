// EcoChicharro design system — tokens + shared primitives.
// Component-scoped style objects (NEVER name `styles`).

const ECO_TOKENS = {
  // Brand (overridable via Tweaks)
  primary: '#005A9C',
  primaryDark: '#004B87',
  primaryDeep: '#00345E',
  primarySoft: '#1F6FB2',
  primaryTint: '#D6E6F2',
  primaryMist: '#EEF4F9',
  primarySky: '#4A9BD4',

  // Neutrals
  appBg: '#F6F8FA',
  surface: '#FFFFFF',
  border: '#E2E6EA',
  borderSoft: '#EEF2F5',
  ink: '#1C2530',
  inkMid: '#6B7480',
  inkLight: '#A8B0B8',

  // Status
  success: '#2E8B57',
  warn: '#E8A317',
  danger: '#C0392B',

  // Container types
  containers: {
    organico:  { label: 'Orgánico',    color: '#8C5A2B' },
    envases:   { label: 'Envases',     color: '#F2B100' },
    papel:     { label: 'Papel',       color: '#1F6FB2' },
    vidrio:    { label: 'Vidrio',      color: '#2E8B57' },
    resto:     { label: 'Resto',       color: '#5C6670' },
    ropa:      { label: 'Ropa',        color: '#E07A2C' },
    aceite:    { label: 'Aceite',      color: '#C99700' },
    baterias:  { label: 'Baterías',    color: '#A4243B' },
  },

  // Incident types
  incidents: {
    lleno:        { label: 'Lleno / desbordado', priority: 'media' },
    roto:         { label: 'Roto / dañado',      priority: 'media' },
    sucio:        { label: 'Sucio / mal olor',   priority: 'baja' },
    quemado:      { label: 'Quemado',            priority: 'alta' },
    desaparecido: { label: 'Desaparecido',       priority: 'alta' },
  },

  // Status
  statuses: {
    pendiente:  { label: 'Pendiente',  color: '#E8A317' },
    en_proceso: { label: 'En proceso', color: '#005A9C' },
    resuelto:   { label: 'Resuelto',   color: '#2E8B57' },
  },

  priorities: {
    baja:  { label: 'Baja',  color: '#5A8FA8' },
    media: { label: 'Media', color: '#E8A317' },
    alta:  { label: 'Alta',  color: '#C0392B' },
  },
};

// ---------- icons (single source so they stay consistent) ----------
const Icon = ({ name, size = 18, color = 'currentColor', stroke = 1.7 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home':       return <svg {...props}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>;
    case 'camera':     return <svg {...props}><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg>;
    case 'list':       return <svg {...props}><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'user':       return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>;
    case 'search':     return <svg {...props}><circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/></svg>;
    case 'pin':        return <svg {...props}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'locate':     return <svg {...props}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>;
    case 'layers':     return <svg {...props}><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>;
    case 'filter':     return <svg {...props}><path d="M4 5h16l-6 8v6l-4-2v-4Z"/></svg>;
    case 'chevron-r':  return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-d':  return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'arrow-l':    return <svg {...props}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case 'arrow-r':    return <svg {...props}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'check':      return <svg {...props}><path d="m4 12 5 5L20 6"/></svg>;
    case 'x':          return <svg {...props}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'edit':       return <svg {...props}><path d="M4 20h4l10-10-4-4L4 16Z"/><path d="m13 7 4 4"/></svg>;
    case 'trash':      return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>;
    case 'image':      return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>;
    case 'gallery':    return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>;
    case 'flash':      return <svg {...props}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/></svg>;
    case 'flip':       return <svg {...props}><path d="M3 7h13l-2-2M21 17H8l2 2"/></svg>;
    case 'bell':       return <svg {...props}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 21h4"/></svg>;
    case 'globe':      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/></svg>;
    case 'help':       return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>;
    case 'logout':     return <svg {...props}><path d="M14 4h4v16h-4M4 12h12M11 8l-4 4 4 4"/></svg>;
    case 'route':      return <svg {...props}><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8v3a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4"/></svg>;
    case 'leaf':       return <svg {...props}><path d="M20 4c-9 0-15 6-15 13 0 1.5.5 3 1 4 0-9 7-13 14-13Z"/><path d="M5 21c5-1 9-4 12-9"/></svg>;
    case 'bottle':     return <svg {...props}><path d="M10 2h4v3l1 2v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7l1-2Z"/></svg>;
    case 'flame':      return <svg {...props}><path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 1 3-1 4-2 4-1-2-1-5-3-7-1 4-5 6-5 11 0 3 3 6 7 6Z"/></svg>;
    case 'shirt':      return <svg {...props}><path d="m4 7 4-3 2 2h4l2-2 4 3-2 4h-2v9H8v-9H6Z"/></svg>;
    case 'drop':       return <svg {...props}><path d="M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11Z"/></svg>;
    case 'battery':    return <svg {...props}><rect x="3" y="8" width="16" height="9" rx="1.5"/><path d="M19 11v3h2v-3z"/><path d="M9 4h6v4H9z"/></svg>;
    case 'bag':        return <svg {...props}><path d="M5 8h14l-1 13H6Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>;
    case 'news':       return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M7 9h7M7 13h7M7 17h4"/></svg>;
    case 'question':   return <svg {...props}><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2.5-3 5"/><circle cx="12" cy="18" r=".7" fill="currentColor"/></svg>;
    case 'plus':       return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'export':     return <svg {...props}><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 18v2h16v-2"/></svg>;
    case 'sort':       return <svg {...props}><path d="M8 4v16m-3-3 3 3 3-3M16 20V4m-3 3 3-3 3 3"/></svg>;
    case 'cluster':    return <svg {...props}><circle cx="9" cy="9" r="5"/><circle cx="16" cy="16" r="4"/></svg>;
    case 'dot':        return <svg {...props}><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>;
    case 'menu':       return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'kebab':      return <svg {...props}><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>;
    case 'trophy':     return <svg {...props}><path d="M7 4h10v4a5 5 0 0 1-10 0Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/><path d="M9 14h6l-1 4h-4Z"/><path d="M8 20h8"/></svg>;
    case 'medal':      return <svg {...props}><path d="M8 3h8l-3 6h-2Z"/><circle cx="12" cy="15" r="6"/><path d="M10 14l2 2 3-3"/></svg>;
    case 'clock':      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'star':       return <svg {...props}><path d="m12 3 2.7 5.6 6.3.8-4.6 4.4 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.4l6.3-.8Z"/></svg>;
    case 'sparkle':    return <svg {...props}><path d="M12 4v6M12 14v6M4 12h6M14 12h6"/><path d="M7 7l3 3M14 14l3 3M17 7l-3 3M10 14l-3 3"/></svg>;
    case 'happy':      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2"/><circle cx="9" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="10" r=".9" fill="currentColor"/></svg>;
    case 'meh':        return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5h7"/><circle cx="9" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="10" r=".9" fill="currentColor"/></svg>;
    case 'sad':        return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8 16c1-1.5 2.4-2.2 4-2.2s3 .7 4 2.2"/><circle cx="9" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="10" r=".9" fill="currentColor"/></svg>;
    default: return null;
  }
};

// Icon by container type
const containerIcon = (type, size = 14) => {
  const map = { organico: 'leaf', envases: 'bottle', papel: 'news',
    vidrio: 'bottle', resto: 'bag', ropa: 'shirt', aceite: 'drop', baterias: 'battery' };
  return <Icon name={map[type] || 'bag'} size={size} />;
};

// ---------- primitives ----------

// Chip with optional colored dot (for container type filters)
const Chip = ({ label, dotColor, active, onClick, size = 'md', icon }) => {
  const pad = size === 'sm' ? '4px 10px' : '6px 12px';
  const fs  = size === 'sm' ? 12 : 13;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: pad, fontSize: fs, fontWeight: 500,
      borderRadius: 999, cursor: 'pointer',
      whiteSpace: 'nowrap',
      border: `1px solid ${active ? ECO_TOKENS.primary : ECO_TOKENS.border}`,
      background: active ? ECO_TOKENS.primaryTint : ECO_TOKENS.surface,
      color: active ? ECO_TOKENS.primary : ECO_TOKENS.ink,
      fontFamily: 'inherit',
    }}>
      {dotColor && <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flex: '0 0 auto' }}/>}
      {icon}
      {label}
    </button>
  );
};

// Status / priority badge with tinted bg + colored text
const Badge = ({ color, label, icon, size = 'md' }) => {
  const fs = size === 'sm' ? 10.5 : 11.5;
  const pad = size === 'sm' ? '2px 7px' : '3px 9px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: pad, fontSize: fs, fontWeight: 600,
      letterSpacing: 0.2,
      borderRadius: 6,
      color, background: color + '22',
      textTransform: 'uppercase',
    }}>
      {icon}
      {label}
    </span>
  );
};

// Status dot + label inline
const PriorityTag = ({ priority, size = 'md' }) => {
  const p = ECO_TOKENS.priorities[priority];
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: fs, fontWeight: 500, color: ECO_TOKENS.inkMid }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: p.color }}/>
      Prioridad {p.label.toLowerCase()}
    </span>
  );
};

const Button = ({ kind = 'primary', size = 'md', icon, children, onClick, style, full }) => {
  const palettes = {
    primary:   { bg: ECO_TOKENS.primary,   color: '#fff', border: ECO_TOKENS.primary },
    secondary: { bg: ECO_TOKENS.surface,   color: ECO_TOKENS.primary, border: ECO_TOKENS.primary },
    tertiary:  { bg: 'transparent',        color: ECO_TOKENS.primary, border: 'transparent' },
    ghost:     { bg: ECO_TOKENS.surface,   color: ECO_TOKENS.ink, border: ECO_TOKENS.border },
    danger:    { bg: 'transparent',        color: ECO_TOKENS.danger, border: ECO_TOKENS.danger },
  };
  const p = palettes[kind];
  const sizes = {
    sm: { h: 32, padX: 12, fs: 12.5, gap: 6 },
    md: { h: 40, padX: 16, fs: 14,   gap: 8 },
    lg: { h: 48, padX: 20, fs: 15,   gap: 10 },
  };
  const sz = sizes[size];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sz.gap,
      height: sz.h, padding: `0 ${sz.padX}px`, fontSize: sz.fs, fontWeight: 600,
      borderRadius: 8, border: `1px solid ${p.border}`,
      background: p.bg, color: p.color,
      cursor: 'pointer', fontFamily: 'inherit',
      width: full ? '100%' : 'auto',
      ...style,
    }}>
      {icon}
      {children}
    </button>
  );
};

// Container type chip (small, with color dot + icon + name)
const ContainerChip = ({ type, active, onClick, size = 'md' }) => {
  const c = ECO_TOKENS.containers[type];
  return <Chip label={c.label} dotColor={c.color} active={active} onClick={onClick} size={size} />;
};

// KPI card for dashboard
const KPI = ({ label, value, sub, trend, accent }) => (
  <div style={{
    background: ECO_TOKENS.surface, border: `1px solid ${ECO_TOKENS.border}`,
    borderRadius: 8, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 4,
    minWidth: 0,
  }}>
    <div style={{ fontSize: 11.5, fontWeight: 600, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>
        {value}
      </div>
      {trend && (
        <span style={{ fontSize: 11.5, fontWeight: 600, color: trend.dir === 'up' ? ECO_TOKENS.success : ECO_TOKENS.danger }}>
          {trend.dir === 'up' ? '▲' : '▼'} {trend.value}
        </span>
      )}
    </div>
    {sub && <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid }}>{sub}</div>}
  </div>
);

// Container-type pin (used on map)
// shape: drop with circle that holds the type icon; ring color = state.
const Pin = ({ type, status = 'pendiente', size = 32, selected }) => {
  const c = ECO_TOKENS.containers[type].color;
  const ring = ECO_TOKENS.statuses[status].color;
  const w = size, h = size * 1.25;
  return (
    <div style={{ position: 'relative', width: w, height: h, filter: selected ? 'drop-shadow(0 4px 10px rgba(0,0,0,.25))' : 'drop-shadow(0 2px 4px rgba(0,0,0,.18))' }}>
      <svg viewBox="0 0 32 40" width={w} height={h}>
        <path d="M16 0C7.2 0 0 7 0 15.8c0 9.5 12.5 22 14.5 23.6a2.4 2.4 0 0 0 3 0C19.5 37.8 32 25.3 32 15.8 32 7 24.8 0 16 0Z" fill={c}/>
        <circle cx="16" cy="15.5" r="10" fill="#fff"/>
        {selected && <circle cx="16" cy="15.5" r="12.5" fill="none" stroke={c} strokeWidth="2" opacity="0.4"/>}
      </svg>
      <div style={{ position: 'absolute', top: size * 0.16, left: size * 0.18, width: size * 0.64, height: size * 0.64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c }}>
        {containerIcon(type, size * 0.48)}
      </div>
      {/* state ring */}
      <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 999, background: ring, border: '2px solid #fff' }}/>
    </div>
  );
};

// PinCluster
const PinCluster = ({ count, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: 999,
    background: ECO_TOKENS.primary, color: '#fff',
    border: '3px solid rgba(255,255,255,.85)',
    boxShadow: '0 2px 8px rgba(0,0,0,.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
  }}>{count}</div>
);

// Map control button (white pill / square floating)
const MapBtn = ({ icon, label, onClick, active }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: label ? '8px 12px' : 9,
    background: active ? ECO_TOKENS.primaryTint : '#fff',
    color: active ? ECO_TOKENS.primary : ECO_TOKENS.ink,
    border: `1px solid ${ECO_TOKENS.border}`,
    borderRadius: 8, fontSize: 12.5, fontWeight: 600,
    boxShadow: '0 1px 4px rgba(0,0,0,.08)', cursor: 'pointer',
    fontFamily: 'inherit',
  }}>
    {icon}{label}
  </button>
);

// Sample data — Santa Cruz de Tenerife
const ECO_REPORTS = [
  { id: 'R-2845', container: 'envases',  incident: 'lleno',        status: 'pendiente',  priority: 'media', addr: 'Calle Castillo, 47', area: 'Centro',  date: '14 may · 09:42', reporter: 'María D.', x: 0.42, y: 0.48 },
  { id: 'R-2844', container: 'organico', incident: 'roto',         status: 'en_proceso', priority: 'media', addr: 'Av. de Anaga, 22',   area: 'Anaga',   date: '14 may · 08:15', reporter: 'Jorge P.', x: 0.68, y: 0.62 },
  { id: 'R-2843', container: 'vidrio',   incident: 'sucio',        status: 'resuelto',   priority: 'baja',  addr: 'Rambla 25 Julio, 8', area: 'Rambla',  date: '13 may · 19:08', reporter: 'Lucía M.', x: 0.28, y: 0.36 },
  { id: 'R-2842', container: 'papel',    incident: 'lleno',        status: 'pendiente',  priority: 'media', addr: 'Plaza del Príncipe', area: 'Centro',  date: '13 may · 17:21', reporter: 'Hugo R.',  x: 0.36, y: 0.58 },
  { id: 'R-2841', container: 'baterias', incident: 'quemado',      status: 'en_proceso', priority: 'alta',  addr: 'Av. Tres de Mayo, 12', area: 'Cabo',  date: '13 may · 12:46', reporter: 'Sara N.',  x: 0.18, y: 0.66 },
  { id: 'R-2840', container: 'resto',    incident: 'desaparecido', status: 'pendiente',  priority: 'alta',  addr: 'C/ Imeldo Serís, 31', area: 'Centro',  date: '13 may · 10:02', reporter: 'Iván T.',  x: 0.48, y: 0.42 },
  { id: 'R-2839', container: 'envases',  incident: 'roto',         status: 'resuelto',   priority: 'media', addr: 'Pza. Weyler, 4',     area: 'Weyler',  date: '12 may · 18:30', reporter: 'Ana L.',   x: 0.32, y: 0.28 },
  { id: 'R-2838', container: 'aceite',   incident: 'lleno',        status: 'pendiente',  priority: 'media', addr: 'C/ San Sebastián, 75', area: 'Salud', date: '12 may · 16:14', reporter: 'Carlos V.', x: 0.58, y: 0.34 },
  { id: 'R-2837', container: 'ropa',     incident: 'lleno',        status: 'pendiente',  priority: 'media', addr: 'Av. de la Constitución, 5', area: 'Cabo', date: '12 may · 11:55', reporter: 'Nieves C.', x: 0.16, y: 0.78 },
  { id: 'R-2836', container: 'papel',    incident: 'sucio',        status: 'resuelto',   priority: 'baja',  addr: 'C/ El Pilar, 19',    area: 'Centro',  date: '11 may · 20:11', reporter: 'Pablo G.', x: 0.46, y: 0.52 },
  { id: 'R-2835', container: 'organico', incident: 'desaparecido', status: 'en_proceso', priority: 'alta',  addr: 'C/ Galcerán, 33',    area: 'Salud',   date: '11 may · 14:38', reporter: 'Elena F.', x: 0.62, y: 0.46 },
  { id: 'R-2834', container: 'vidrio',   incident: 'quemado',      status: 'pendiente',  priority: 'alta',  addr: 'Pza. de España',     area: 'Centro',  date: '11 may · 09:27', reporter: 'Miguel A.', x: 0.38, y: 0.62 },
];

Object.assign(window, {
  ECO_TOKENS, ECO_REPORTS,
  Icon, containerIcon,
  Chip, ContainerChip, Badge, PriorityTag, Button, KPI,
  Pin, PinCluster, MapBtn,
});

// Ciudadano (mobile PWA) — 5 screens + interactive nav inside one iPhone bezel.
// Screen names: 'home', 'camara', 'lista', 'detalle', 'cuenta'

// ---------- bottom tab bar ----------
const TabBar = ({ active, onChange, showLabels = true }) => {
  const tabs = [
    { id: 'home',    icon: 'home',   label: 'Inicio' },
    { id: 'ranking', icon: 'trophy', label: 'Ranking' },
    { id: 'camara',  icon: 'camera', label: 'Reportar', center: true },
    { id: 'lista',   icon: 'list',   label: 'Reportes' },
    { id: 'cuenta',  icon: 'user',   label: 'Cuenta' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: '#fff',
      borderTop: `1px solid ${ECO_TOKENS.border}`,
      boxShadow: '0 -2px 12px rgba(0,0,0,.04)',
      paddingBottom: 18, // safe area
      display: 'flex',
      zIndex: 30,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id
          || (active === 'detalle' && t.id === 'lista')
          || (active === 'ruta'    && t.id === 'home');
        const color = isActive ? ECO_TOKENS.primary : ECO_TOKENS.inkMid;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '8px 2px 4px', background: 'transparent', border: 'none',
            cursor: 'pointer', color, fontFamily: 'inherit', minWidth: 0,
          }}>
            {t.center ? (
              <span style={{
                width: 46, height: 46, borderRadius: 999,
                background: isActive ? ECO_TOKENS.primaryDark : ECO_TOKENS.primary,
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -16, boxShadow: '0 4px 12px rgba(0,90,156,.32)',
                border: '3px solid #fff',
              }}>
                <Icon name={t.icon} size={22}/>
              </span>
            ) : (
              <Icon name={t.icon} size={21} color={color}/>
            )}
            {showLabels && (
              <span style={{ fontSize: 9.5, fontWeight: isActive ? 600 : 500, color,
                marginTop: t.center ? -2 : 0, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                {t.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ---------- HOME (map) ----------
const ScreenHome = ({ onPinSelect, mapVariant, chipsLayout }) => {
  const [activeFilters, setActiveFilters] = React.useState(new Set(['all']));
  const [selectedPin, setSelectedPin] = React.useState(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [darkMap, setDarkMap] = React.useState(false);

  // Effective map variant: dark toggle overrides the tweak.
  const effectiveVariant = darkMap ? 'satellite' : mapVariant;
  const isDark = darkMap;

  const toggle = (id) => {
    const next = new Set(activeFilters);
    if (id === 'all') { setActiveFilters(new Set(['all'])); return; }
    next.delete('all');
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) next.add('all');
    setActiveFilters(next);
  };

  const visibleReports = activeFilters.has('all')
    ? ECO_REPORTS
    : ECO_REPORTS.filter(r => activeFilters.has(r.container));

  const activeCount = activeFilters.has('all') ? 0 : activeFilters.size;

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      {/* MAP */}
      <SCMap
        width={390} height={844}
        variant={effectiveVariant}
        showStreetNames={true}
        reports={visibleReports}
        selectedId={selectedPin?.id}
        onPinClick={(r) => setSelectedPin(r)}
        pinSize={32}
      />

      {/* TOP — translucent header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '50px 16px 12px',
        background: isDark
          ? 'linear-gradient(180deg, rgba(20,30,42,.92) 60%, rgba(20,30,42,0))'
          : 'linear-gradient(180deg, rgba(255,255,255,.95) 60%, rgba(255,255,255,0))',
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: ECO_TOKENS.primary,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16,
          }}>Ec</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#fff' : ECO_TOKENS.ink, lineHeight: 1.1 }}>EcoChicharro</div>
            <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,.7)' : ECO_TOKENS.inkMid }}>Santa Cruz · Centro</div>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 999,
            background: isDark ? 'rgba(255,255,255,.12)' : '#fff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,.18)' : ECO_TOKENS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? '#fff' : ECO_TOKENS.ink, cursor: 'pointer',
          }}>
            <Icon name="bell" size={18}/>
          </button>
        </div>

        {/* Search + Filters button */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: isDark ? 'rgba(255,255,255,.95)' : '#fff',
            border: `1px solid ${isDark ? 'transparent' : ECO_TOKENS.border}`,
            borderRadius: 10, padding: '9px 12px',
            boxShadow: '0 1px 3px rgba(0,0,0,.08)',
          }}>
            <Icon name="search" size={16} color={ECO_TOKENS.inkMid}/>
            <input placeholder="Buscar calle, plaza, contenedor…" readOnly style={{
              border: 'none', outline: 'none', flex: 1, fontSize: 13.5,
              color: ECO_TOKENS.ink, background: 'transparent', fontFamily: 'inherit',
            }}/>
          </div>
          <button onClick={() => setFiltersOpen(!filtersOpen)} style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 12px', height: 38,
            borderRadius: 10, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            background: filtersOpen ? ECO_TOKENS.primary : (isDark ? 'rgba(255,255,255,.95)' : '#fff'),
            border: filtersOpen ? `1px solid ${ECO_TOKENS.primary}` : `1px solid ${isDark ? 'transparent' : ECO_TOKENS.border}`,
            color: filtersOpen ? '#fff' : ECO_TOKENS.ink,
            boxShadow: '0 1px 3px rgba(0,0,0,.08)',
          }}>
            <Icon name="filter" size={15}/>
            <span>Filtros</span>
            {activeCount > 0 && (
              <span style={{
                background: filtersOpen ? '#fff' : ECO_TOKENS.primary,
                color: filtersOpen ? ECO_TOKENS.primary : '#fff',
                fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 2,
              }}>{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filters panel — appears below header when open */}
      {filtersOpen && (
        <div style={{
          position: 'absolute', top: 138, left: 12, right: 12, zIndex: 19,
          background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
          borderRadius: 14, padding: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,.16)',
          animation: 'slideDown .2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tipo de contenedor
            </div>
            <button onClick={() => { setActiveFilters(new Set(['all'])); }} style={{
              marginLeft: 'auto', background: 'transparent', border: 'none',
              color: ECO_TOKENS.primary, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Limpiar</button>
          </div>

          {chipsLayout === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {Object.keys(ECO_TOKENS.containers).map(k => {
                const c = ECO_TOKENS.containers[k];
                const active = activeFilters.has(k);
                return (
                  <button key={k} onClick={() => toggle(k)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '8px 4px', borderRadius: 8,
                    background: active ? ECO_TOKENS.primaryTint : ECO_TOKENS.appBg,
                    border: active ? `1px solid ${ECO_TOKENS.primary}` : `1px solid ${ECO_TOKENS.border}`,
                    cursor: 'pointer', fontFamily: 'inherit',
                    color: active ? ECO_TOKENS.primary : ECO_TOKENS.ink,
                  }}>
                    <span style={{ color: c.color }}>{containerIcon(k, 18)}</span>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Chip label="Todos" active={activeFilters.has('all')} onClick={() => toggle('all')} size="sm"/>
              {Object.keys(ECO_TOKENS.containers).map(k => (
                <ContainerChip key={k} type={k}
                  active={activeFilters.has(k)}
                  onClick={() => toggle(k)} size="sm"/>
              ))}
            </div>
          )}

          {/* Status row */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${ECO_TOKENS.borderSoft}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Estado
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(ECO_TOKENS.statuses).map(([k, v]) => (
                <Chip key={k} label={v.label} dotColor={v.color} size="sm"/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating action stack: my location + theme toggle */}
      <div style={{ position: 'absolute', right: 14, bottom: 200, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 18 }}>
        <button onClick={() => setDarkMap(!darkMap)} title={darkMap ? 'Modo claro' : 'Modo oscuro'} style={{
          width: 46, height: 46, borderRadius: 999,
          background: darkMap
            ? 'linear-gradient(135deg, #1F2937 0%, #0B1220 100%)'
            : '#fff',
          border: `1px solid ${darkMap ? 'rgba(255,255,255,.18)' : ECO_TOKENS.border}`,
          boxShadow: darkMap
            ? '0 2px 12px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08)'
            : '0 2px 8px rgba(0,0,0,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: darkMap ? '#F2C94C' : ECO_TOKENS.inkMid,
          fontSize: 20, lineHeight: 1, fontFamily: 'inherit',
          transition: 'all .2s',
        }}>
          {darkMap ? (
            // Sun (when dark, tap to go light)
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          ) : (
            // Moon (when light, tap to go dark)
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" fill="currentColor" fillOpacity="0.15"/>
            </svg>
          )}
        </button>
        <button title="Mi ubicación" style={{
          width: 46, height: 46, borderRadius: 999,
          background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: ECO_TOKENS.primary,
        }}>
          <Icon name="locate" size={20}/>
        </button>
      </div>

      {/* Bottom sheet for selected pin */}
      {selectedPin && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 82,
          background: '#fff', borderRadius: '16px 16px 0 0',
          padding: '14px 18px 18px',
          boxShadow: '0 -6px 22px rgba(0,0,0,.12)',
          zIndex: 22, maxHeight: 540, overflowY: 'auto',
          borderTop: `1px solid ${ECO_TOKENS.border}`,
        }}>
          <div style={{ width: 36, height: 4, background: ECO_TOKENS.border, borderRadius: 999, margin: '0 auto 12px' }}/>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Pin type={selectedPin.container} status={selectedPin.status} size={36}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: ECO_TOKENS.ink }}>
                Contenedor {ECO_TOKENS.containers[selectedPin.container].label.toLowerCase()}
              </div>
              <div style={{ fontSize: 12.5, color: ECO_TOKENS.inkMid, marginTop: 2 }}>
                {selectedPin.addr} · 120 m
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <Badge color={ECO_TOKENS.statuses[selectedPin.status].color}
                       label={ECO_TOKENS.statuses[selectedPin.status].label} size="sm"/>
                <span style={{ fontSize: 11, color: ECO_TOKENS.inkMid, alignSelf: 'center' }}>
                  · 3 reportes activos
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedPin(null)} style={{
              background: 'transparent', border: 'none', color: ECO_TOKENS.inkMid, cursor: 'pointer',
            }}><Icon name="x" size={18}/></button>
          </div>

          {/* Hourly tip */}
          <HourlyMini containerType={selectedPin.container}/>

          {/* Inspect link */}
          <button onClick={() => onPinSelect && onPinSelect(selectedPin, 'inspect')} style={{
            marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 12px', borderRadius: 10,
            background: ECO_TOKENS.appBg, border: `1px solid ${ECO_TOKENS.border}`,
            cursor: 'pointer', fontFamily: 'inherit', color: ECO_TOKENS.ink,
            fontSize: 12.5, fontWeight: 600,
          }}>
            <Icon name="search" size={14} color={ECO_TOKENS.primary}/>
            <span style={{ flex: 1, textAlign: 'left' }}>Inspeccionar este contenedor</span>
            <span style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>Histórico, recogidas, incidencias</span>
            <Icon name="chevron-r" size={14} color={ECO_TOKENS.inkMid}/>
          </button>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button kind="secondary" size="md" full icon={<Icon name="plus" size={15}/>}
                    onClick={() => onPinSelect && onPinSelect(selectedPin, 'ruta')}>
              Añadir a ruta
            </Button>
            <Button kind="primary" size="md" full icon={<Icon name="camera" size={15}/>}
                    onClick={() => onPinSelect && onPinSelect(selectedPin, 'reportar')}>
              Reportar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- CÁMARA (capture + form) ----------
const ScreenCamara = ({ onSubmit, prefilled }) => {
  const [step, setStep] = React.useState(prefilled ? 1 : 0);  // 0=capture 1=form 2=done
  const [container, setContainer] = React.useState(prefilled?.container || 'envases');
  const [incident, setIncident] = React.useState('lleno');
  const [note, setNote] = React.useState('');

  const inc = ECO_TOKENS.incidents[incident];
  const priority = inc.priority;

  if (step === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#0d0d0d', color: '#fff' }}>
        {/* viewfinder background — neutral grid */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, #222 0%, #0a0a0a 75%)' }}/>
        {/* fake subject silhouette */}
        <div style={{
          position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)',
          width: 220, height: 280, borderRadius: 18, opacity: 0.55,
          background: 'linear-gradient(180deg, #2A2A2A 0%, #1a1a1a 100%)',
          boxShadow: 'inset 0 0 0 8px #444',
        }}/>
        {/* grid lines */}
        <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
          <g stroke="rgba(255,255,255,.15)" strokeWidth="1">
            <line x1="130" y1="60" x2="130" y2="784"/>
            <line x1="260" y1="60" x2="260" y2="784"/>
            <line x1="0" y1="280" x2="390" y2="280"/>
            <line x1="0" y1="500" x2="390" y2="500"/>
          </g>
        </svg>

        {/* top bar */}
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(0,0,0,.4)',
            border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={20}/>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(0,0,0,.4)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="flash" size={18}/>
            </button>
            <button style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(0,0,0,.4)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="flip" size={18}/>
            </button>
          </div>
        </div>

        {/* hint */}
        <div style={{ position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,.55)', padding: '8px 14px', borderRadius: 999,
          fontSize: 12, fontWeight: 500 }}>
          Encuadra el contenedor o residuo
        </div>

        {/* GPS pill */}
        <div style={{ position: 'absolute', top: 150, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(46,139,87,.85)', padding: '5px 12px', borderRadius: 999,
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600 }}>
          <Icon name="locate" size={12}/> GPS activo · Pza. de España
        </div>

        {/* shutter row */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 30px' }}>
          <button style={{ width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="gallery" size={22}/>
          </button>
          <button onClick={() => setStep(1)} style={{
            width: 78, height: 78, borderRadius: 999,
            background: '#fff', border: '5px solid rgba(255,255,255,.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ width: 60, height: 60, borderRadius: 999, background: ECO_TOKENS.primary }}/>
          </button>
          <div style={{ width: 48 }}/>
        </div>
      </div>
    );
  }

  // FORM step
  return (
    <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 90,
        padding: '50px 16px 0',
        background: '#fff', borderBottom: `1px solid ${ECO_TOKENS.border}`,
        display: 'flex', alignItems: 'center', gap: 10, zIndex: 5,
      }}>
        <button onClick={() => setStep(0)} style={{ background: 'transparent', border: 'none', padding: 6, color: ECO_TOKENS.ink, cursor: 'pointer' }}>
          <Icon name="arrow-l" size={20}/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: ECO_TOKENS.ink }}>Nuevo reporte</div>
          <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>Paso 2 de 2 · Detalles</div>
        </div>
        {/* progress */}
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ width: 24, height: 4, borderRadius: 2, background: ECO_TOKENS.primary }}/>
          <span style={{ width: 24, height: 4, borderRadius: 2, background: ECO_TOKENS.primary }}/>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ position: 'absolute', inset: '90px 0 82px 0', overflowY: 'auto', padding: 16 }}>
        {/* Photo preview */}
        <div style={{
          height: 140, borderRadius: 12,
          background: 'linear-gradient(135deg, #4a5566 0%, #2a3340 100%)',
          position: 'relative', overflow: 'hidden',
          border: `1px solid ${ECO_TOKENS.border}`,
        }}>
          {/* stripey placeholder */}
          <div style={{ position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 8px, transparent 8px 16px)' }}/>
          <div style={{ position: 'absolute', bottom: 8, left: 10, color: '#fff', fontSize: 11, opacity: 0.7, fontFamily: 'ui-monospace, monospace' }}>
            captura.jpg · 1.2 MB
          </div>
          <button style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,.45)', color: '#fff', border: 'none',
            padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>Volver a tomar</button>
        </div>

        {/* Container type */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 8 }}>Tipo de contenedor</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Object.keys(ECO_TOKENS.containers).map(k => {
              const c = ECO_TOKENS.containers[k];
              const active = container === k;
              return (
                <button key={k} onClick={() => setContainer(k)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 4px', borderRadius: 10,
                  background: active ? ECO_TOKENS.primaryTint : '#fff',
                  border: `1px solid ${active ? ECO_TOKENS.primary : ECO_TOKENS.border}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 999, background: c.color + '22',
                    color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{containerIcon(k, 16)}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: ECO_TOKENS.ink, textAlign: 'center' }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Incident type */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 8 }}>¿Qué ocurre?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(ECO_TOKENS.incidents).map(([k, v]) => {
              const active = incident === k;
              const icons = { lleno: 'bag', roto: 'edit', sucio: 'drop', quemado: 'flame', desaparecido: 'question' };
              return (
                <button key={k} onClick={() => setIncident(k)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10,
                  background: active ? ECO_TOKENS.primaryTint : '#fff',
                  border: `1px solid ${active ? ECO_TOKENS.primary : ECO_TOKENS.border}`,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: active ? ECO_TOKENS.primary : ECO_TOKENS.appBg,
                    color: active ? '#fff' : ECO_TOKENS.inkMid,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name={icons[k]} size={16}/></span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: ECO_TOKENS.ink }}>{v.label}</span>
                  {active && <Icon name="check" size={18} color={ECO_TOKENS.primary}/>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location mini-map */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink }}>Ubicación</div>
            <button style={{ background: 'transparent', border: 'none', color: ECO_TOKENS.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Editar</button>
          </div>
          <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', border: `1px solid ${ECO_TOKENS.border}`, position: 'relative' }}>
            <SCMap width={358} height={120} variant="light" reports={[{ id: 'me', container, status: 'pendiente', x: 0.5, y: 0.55 }]} pinSize={28}/>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: ECO_TOKENS.inkMid }}>
            <Icon name="pin" size={12}/> Calle Castillo, 47 · Centro
          </div>
        </div>

        {/* Comment */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 8 }}>Comentario <span style={{ color: ECO_TOKENS.inkMid, fontWeight: 400 }}>(opcional)</span></div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Lleva 2 días sin recoger y huele fuerte…"
            style={{
              width: '100%', minHeight: 70, padding: '10px 12px',
              border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 10,
              fontFamily: 'inherit', fontSize: 13, color: ECO_TOKENS.ink,
              resize: 'none', background: '#fff', outline: 'none',
            }}/>
        </div>

        {/* Priority pill */}
        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 10,
          background: ECO_TOKENS.priorities[priority].color + '15',
          border: `1px solid ${ECO_TOKENS.priorities[priority].color}40`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: ECO_TOKENS.priorities[priority].color }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: ECO_TOKENS.ink }}>
              Se asignará prioridad <span style={{ color: ECO_TOKENS.priorities[priority].color }}>{ECO_TOKENS.priorities[priority].label.toLowerCase()}</span>
            </div>
            <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, marginTop: 1 }}>Calculada automáticamente según el tipo de incidencia.</div>
          </div>
        </div>

        <div style={{ height: 16 }}/>
      </div>

      {/* Submit footer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 82,
        padding: '12px 16px',
        background: '#fff', borderTop: `1px solid ${ECO_TOKENS.border}`,
        zIndex: 5,
      }}>
        <Button kind="primary" size="lg" full onClick={() => onSubmit && onSubmit()}>
          Enviar incidencia
        </Button>
      </div>
    </div>
  );
};

// ---------- LISTA ----------
const ScreenLista = ({ onOpen }) => {
  const [filter, setFilter] = React.useState('all');
  const filtered = filter === 'all' ? ECO_REPORTS : ECO_REPORTS.filter(r => r.status === filter);
  return (
    <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '50px 16px 12px',
        background: '#fff', borderBottom: `1px solid ${ECO_TOKENS.border}`,
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: ECO_TOKENS.ink }}>Mis reportes</div>
          <button style={{ background: 'transparent', border: 'none', color: ECO_TOKENS.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="sort" size={14}/> Ordenar
          </button>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <Chip label={`Todas · ${ECO_REPORTS.length}`} active={filter === 'all'} onClick={() => setFilter('all')} size="sm"/>
          {['pendiente','en_proceso','resuelto'].map(s => {
            const meta = ECO_TOKENS.statuses[s];
            const n = ECO_REPORTS.filter(r => r.status === s).length;
            return <Chip key={s} label={`${meta.label} · ${n}`} active={filter === s} onClick={() => setFilter(s)} size="sm"/>;
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ position: 'absolute', inset: '136px 0 82px 0', overflowY: 'auto', padding: '10px 14px 16px' }}>
        {filtered.map(r => (
          <div key={r.id} onClick={() => onOpen(r)} style={{
            background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 12, padding: 12, marginBottom: 10,
            display: 'flex', gap: 12, cursor: 'pointer',
          }}>
            {/* photo */}
            <div style={{
              width: 64, height: 64, borderRadius: 8, flex: '0 0 64px',
              background: `linear-gradient(135deg, ${ECO_TOKENS.containers[r.container].color}55, ${ECO_TOKENS.containers[r.container].color}20)`,
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.18) 0 4px, transparent 4px 8px)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ECO_TOKENS.containers[r.container].color }}>
                {containerIcon(r.container, 26)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                <ContainerChip type={r.container} size="sm" active={false}/>
                <Badge color={ECO_TOKENS.statuses[r.status].color}
                       label={ECO_TOKENS.statuses[r.status].label} size="sm"/>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: ECO_TOKENS.ink, lineHeight: 1.25 }}>
                {ECO_TOKENS.incidents[r.incident].label}
              </div>
              <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="pin" size={11}/> {r.addr} · {r.date}
              </div>
            </div>
            <button onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', color: ECO_TOKENS.inkMid, padding: 2, cursor: 'pointer' }}>
              <Icon name="kebab" size={18}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- DETALLE ----------
const ScreenDetalle = ({ report, onBack }) => {
  const r = report || ECO_REPORTS[0];
  const cMeta = ECO_TOKENS.containers[r.container];
  const sMeta = ECO_TOKENS.statuses[r.status];
  const isResolved = r.status === 'resuelto';
  return (
    <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
      {/* Photo header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280,
        background: `linear-gradient(135deg, ${cMeta.color}80, ${cMeta.color}30)`,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.15) 0 12px, transparent 12px 24px)' }}>
        <div style={{ position: 'absolute', top: 50, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.9)', border: 'none', color: ECO_TOKENS.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-l" size={18}/>
          </button>
          <button style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.9)', border: 'none', color: ECO_TOKENS.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="kebab" size={18}/>
          </button>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
          <div style={{ width: 90, height: 90, borderRadius: 999, background: 'rgba(255,255,255,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: cMeta.color }}>
            {containerIcon(r.container, 50)}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 252, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
        <div style={{ background: ECO_TOKENS.appBg, borderRadius: '16px 16px 0 0', padding: 16, minHeight: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={sMeta.color} label={sMeta.label}/>
            <PriorityTag priority={r.priority} size="sm"/>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: ECO_TOKENS.inkMid, fontFamily: 'ui-monospace, monospace' }}>{r.id}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: ECO_TOKENS.ink, margin: '10px 0 4px', lineHeight: 1.2 }}>
            {ECO_TOKENS.incidents[r.incident].label}
          </h1>
          <div style={{ fontSize: 13, color: ECO_TOKENS.inkMid, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: cMeta.color }}/>
            Contenedor de {cMeta.label.toLowerCase()} · {r.addr}
          </div>

          {/* timeline */}
          <div style={{ marginTop: 18, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Historial</div>
            {[
              { t: r.date, label: 'Reporte enviado', sub: 'Por ti · foto adjunta', dot: ECO_TOKENS.statuses.pendiente.color, done: true },
              { t: '14 may · 10:30', label: 'Recibido por el municipio', sub: 'Asignado a Equipo Centro', dot: ECO_TOKENS.statuses.en_proceso.color, done: r.status !== 'pendiente' },
              { t: isResolved ? '15 may · 09:15' : '—', label: isResolved ? 'Resuelto' : 'Resolución pendiente', sub: isResolved ? 'Vaciado completado' : '', dot: ECO_TOKENS.statuses.resuelto.color, done: isResolved },
            ].map((it, i, a) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i === a.length - 1 ? 0 : 14, opacity: it.done ? 1 : 0.45 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: it.done ? it.dot : '#fff', border: `2px solid ${it.dot}` }}/>
                  {i < a.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 24, background: ECO_TOKENS.border, marginTop: 2 }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ECO_TOKENS.ink }}>{it.label}</div>
                  {it.sub && <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, marginTop: 1 }}>{it.sub}</div>}
                  <div style={{ fontSize: 10.5, color: ECO_TOKENS.inkLight, marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>{it.t}</div>
                </div>
              </div>
            ))}
          </div>

          {/* resolution comment */}
          {isResolved && (
            <div style={{ marginTop: 14, background: '#EAF6EE', border: `1px solid ${ECO_TOKENS.success}40`, borderRadius: 12, padding: 14, borderLeft: `4px solid ${ECO_TOKENS.success}` }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: ECO_TOKENS.success, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                Comentario de resolución
              </div>
              <div style={{ fontSize: 13, color: ECO_TOKENS.ink, lineHeight: 1.5 }}>
                «Contenedor limpiado y revisado por el Equipo Centro. Se ha sustituido la tapa rota. Gracias por avisar.»
              </div>
              <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, marginTop: 6 }}>Servicio Municipal de Limpieza · 15 may</div>
            </div>
          )}

          {/* mini-map */}
          <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${ECO_TOKENS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink }}>Ubicación</div>
              <span style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid }}>{r.area}</span>
            </div>
            <SCMap width={358} height={130} variant="light" reports={[{ ...r, x: 0.5, y: 0.55 }]} pinSize={32}/>
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 24 }}>
            <Button kind="secondary" size="md" full icon={<Icon name="edit" size={15}/>}>Editar</Button>
            <Button kind="danger" size="md" icon={<Icon name="trash" size={15}/>}>Borrar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- CUENTA ----------
const ScreenCuenta = () => (
  <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
    {/* header */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      padding: '50px 16px 24px',
      background: `linear-gradient(180deg, ${ECO_TOKENS.primary} 0%, ${ECO_TOKENS.primaryDark} 100%)`,
      color: '#fff', borderRadius: '0 0 18px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: 999, background: 'rgba(255,255,255,.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700,
          border: '2px solid rgba(255,255,255,.4)' }}>MD</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>María Domínguez</div>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>chicharra desde mayo 2025</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
            padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,.18)', fontSize: 11, fontWeight: 600 }}>
            <span>★</span> Nivel 3 · Vecina colaboradora
          </div>
        </div>
      </div>
    </div>

    <div style={{ position: 'absolute', inset: '170px 0 82px 0', overflowY: 'auto', padding: '16px' }}>
      {/* Puntos + gamificación */}
      <CuentaPoints/>

      {/* Stats de reportes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${ECO_TOKENS.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>Enviadas</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>28</div>
          <div style={{ fontSize: 11, color: ECO_TOKENS.success, fontWeight: 600 }}>▲ 4 esta semana</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${ECO_TOKENS.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>Resueltas</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: ECO_TOKENS.success, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>21</div>
          <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>75% de tus reportes</div>
          <div style={{ marginTop: 6, height: 5, borderRadius: 4, background: ECO_TOKENS.border, overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', background: ECO_TOKENS.success }}/>
          </div>
        </div>
      </div>

      {/* Achievement strip */}
      <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Logros</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: '🥇', label: 'Primer reporte' },
            { icon: '🔥', label: '5 en una semana' },
            { icon: '🌿', label: 'Eco-vigilante' },
            { icon: '🔒', label: 'Bloqueado', locked: true },
          ].map((b, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', opacity: b.locked ? 0.35 : 1 }}>
              <div style={{ width: 48, height: 48, borderRadius: 999, margin: '0 auto',
                background: b.locked ? ECO_TOKENS.appBg : ECO_TOKENS.primaryTint,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                border: `1px solid ${ECO_TOKENS.border}` }}>{b.icon}</div>
              <div style={{ fontSize: 10, color: ECO_TOKENS.inkMid, marginTop: 4, lineHeight: 1.2 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings list */}
      <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {[
          { i: 'bell',  label: 'Notificaciones', sub: 'Activas para tus reportes' },
          { i: 'globe', label: 'Idioma',         sub: 'Español' },
          { i: 'help',  label: 'Ayuda y soporte' },
        ].map((it, i, a) => (
          <div key={i} style={{
            padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: i === a.length - 1 ? 'none' : `1px solid ${ECO_TOKENS.borderSoft}`,
            cursor: 'pointer',
          }}>
            <span style={{ color: ECO_TOKENS.primary }}><Icon name={it.i} size={18}/></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: ECO_TOKENS.ink, fontWeight: 600 }}>{it.label}</div>
              {it.sub && <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, marginTop: 1 }}>{it.sub}</div>}
            </div>
            <Icon name="chevron-r" size={16} color={ECO_TOKENS.inkLight}/>
          </div>
        ))}
      </div>

      <Button kind="danger" full size="md" icon={<Icon name="logout" size={15}/>} style={{ marginTop: 14 }}>
        Cerrar sesión
      </Button>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: ECO_TOKENS.inkLight }}>
        EcoChicharro v0.4.2 · Ayuntamiento de Santa Cruz de Tenerife
      </div>
      <div style={{ height: 16 }}/>
    </div>
  </div>
);

// ---------- WRAPPER (manages screen state + chrome) ----------
const CiudadanoApp = ({ initial = 'home', mapVariant = 'light', chipsLayout = 'scroll', showLabels = true, density = 1, dataLabel }) => {
  const [screen, setScreen] = React.useState(initial);
  const [report, setReport] = React.useState(null);

  const onPinSelect = (r, action = 'reportar') => {
    setReport(r);
    if (action === 'ruta')    setScreen('ruta');
    else if (action === 'inspect') setScreen('contenedor');
    else setScreen('camara');
  };

  let body;
  if (screen === 'home')    body = <ScreenHome mapVariant={mapVariant} chipsLayout={chipsLayout} onPinSelect={onPinSelect}/>;
  else if (screen === 'ruta')       body = <ScreenRuta mapVariant={mapVariant}/>;
  else if (screen === 'ranking')    body = <ScreenRanking/>;
  else if (screen === 'contenedor') body = <ScreenContenedor container={report} mapVariant={mapVariant}
                                       onBack={() => setScreen('home')}
                                       onReport={(c) => { setReport(c); setScreen('camara'); }}
                                       onAddRoute={() => setScreen('ruta')}/>;
  else if (screen === 'camara')  body = <ScreenCamara prefilled={report} onSubmit={() => setScreen('lista')}/>;
  else if (screen === 'lista')   body = <ScreenLista onOpen={(r) => { setReport(r); setScreen('detalle'); }}/>;
  else if (screen === 'detalle') body = <ScreenDetalle report={report || ECO_REPORTS[2]} onBack={() => setScreen('lista')}/>;
  else if (screen === 'cuenta')  body = <ScreenCuenta/>;

  return (
    <div data-screen-label={dataLabel} style={{ position: 'absolute', inset: 0, fontSize: 14 * density }}>
      {body}
      {screen !== 'camara' || true /* always show tab bar in this prototype */ ? (
        <TabBar active={screen} onChange={setScreen} showLabels={showLabels}/>
      ) : null}
    </div>
  );
};

Object.assign(window, {
  TabBar, ScreenHome, ScreenCamara, ScreenLista, ScreenDetalle, ScreenCuenta,
  CiudadanoApp,
});

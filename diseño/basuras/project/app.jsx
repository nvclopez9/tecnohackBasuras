// Entry point — composes DesignCanvas with sections of artboards.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "#005A9C",
  "density": 1.0,
  "navLabels": true,
  "mapVariant": "light",
  "chipsLayout": "scroll"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply primary color override globally
  React.useEffect(() => {
    ECO_TOKENS.primary = t.primary;
    // derive darker shade (simple): just darken by a touch
    const hex = t.primary.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const darker = '#' + [r, g, b].map(v => Math.max(0, v - 24).toString(16).padStart(2, '0')).join('');
    ECO_TOKENS.primaryDark = darker;
    // tint with low opacity background derived from primary
    ECO_TOKENS.primaryTint = t.primary + '1F';  // ~12% alpha
    ECO_TOKENS.statuses.en_proceso.color = t.primary;
  }, [t.primary]);

  // Re-render on tweak change by keying the canvas
  const key = `${t.primary}-${t.density}-${t.navLabels}-${t.mapVariant}-${t.chipsLayout}`;

  return (
    <React.Fragment>
      <DesignCanvas key={key} title="EcoChicharro" subtitle="Diseño PWA · App Ciudadano + Panel Municipal">

        <DCSection id="brand" title="Sistema visual"
                   subtitle="Color, tipografía y componentes base (Cabildo de Tenerife · PANTONE 301)">
          <DCArtboard id="brand-tokens" label="Tokens y componentes" width={900} height={520}>
            <BrandSheet/>
          </DCArtboard>
          <DCArtboard id="brand-map-styles" label="Mapas — Variantes" width={620} height={520}>
            <MapStyles/>
          </DCArtboard>
        </DCSection>

        <DCSection id="ciudadano" title="App Ciudadano · PWA móvil"
                   subtitle="iPhone 13/14 — 390 × 844 · La tab bar es navegable, tócala para cambiar de pantalla">
          {[
            { id: 'home',    label: '01 · Inicio (Mapa)' },
            { id: 'contenedor', label: '02 · Inspeccionar contenedor' },
            { id: 'ruta',    label: '03 · Ruta + banner llegada' },
            { id: 'camara',  label: '04 · Cámara + reporte' },
            { id: 'lista',   label: '05 · Mis reportes' },
            { id: 'detalle', label: '06 · Detalle' },
            { id: 'ranking', label: '07 · Ranking semanal' },
            { id: 'cuenta',  label: '08 · Cuenta + puntos' },
          ].map(s => (
            <DCArtboard key={s.id} id={`c-${s.id}`} label={s.label} width={430} height={880}>
              <IOSDevice width={390} height={844}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <CiudadanoApp initial={s.id}
                                mapVariant={t.mapVariant}
                                chipsLayout={t.chipsLayout}
                                showLabels={t.navLabels}
                                density={t.density}
                                dataLabel={`Ciudadano · ${s.label}`}/>
                </div>
              </IOSDevice>
            </DCArtboard>
          ))}
        </DCSection>

        <DCSection id="municipal" title="Panel Municipal · Escritorio"
                   subtitle="1440 × 900 — multipanel, denso, orientado al dato. La sidebar es navegable.">
          {[
            { id: 'dashboard', label: '01 · Cuadro de mandos' },
            { id: 'mapa',      label: '02 · Mapa analítico + heatmap' },
            { id: 'temporal',  label: '03 · Mapa horario + slider' },
            { id: 'lista',     label: '04 · Lista / tabla' },
            { id: 'detalle',   label: '05 · Lista + Detalle' },
          ].map(v => (
            <DCArtboard key={v.id} id={`m-${v.id}`} label={v.label} width={1440} height={900}>
              <MunicipalPanel initial={v.id} dataLabel={`Municipal · ${v.label}`}/>
            </DCArtboard>
          ))}
        </DCSection>

      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Marca">
          <TweakColor label="Color primario"
            value={t.primary}
            onChange={(v) => setTweak('primary', v)}
            options={['#005A9C', '#1F6FB2', '#0E7C66', '#A4243B']}/>
        </TweakSection>

        <TweakSection label="Densidad e idioma">
          <TweakSlider label="Densidad" unit="x"
            value={t.density} min={0.9} max={1.15} step={0.05}
            onChange={(v) => setTweak('density', v)}/>
          <TweakToggle label="Etiquetas en nav"
            value={t.navLabels}
            onChange={(v) => setTweak('navLabels', v)}/>
        </TweakSection>

        <TweakSection label="Mapa">
          <TweakRadio label="Estilo"
            value={t.mapVariant}
            onChange={(v) => setTweak('mapVariant', v)}
            options={[
              { value: 'light',     label: 'Claro' },
              { value: 'positron',  label: 'Suave' },
              { value: 'satellite', label: 'Oscuro' },
            ]}/>
          <TweakRadio label="Filtros"
            value={t.chipsLayout}
            onChange={(v) => setTweak('chipsLayout', v)}
            options={[
              { value: 'scroll', label: 'Tira' },
              { value: 'grid',   label: 'Cuadrícula' },
            ]}/>
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

// ---------- brand sheet artboard ----------
const BrandSheet = () => (
  <div style={{ position: 'absolute', inset: 0, background: '#fff', padding: 24, overflow: 'auto', fontFamily: 'inherit', color: ECO_TOKENS.ink }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20 }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: ECO_TOKENS.primary, color: '#fff', fontWeight: 700, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ec</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>EcoChicharro</div>
        <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, letterSpacing: 0.4, textTransform: 'uppercase' }}>Sistema visual · Inspirado en visores institucionales</div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 22 }}>
      {/* COLORS */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Azules institucionales</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            ['Primary', ECO_TOKENS.primary],
            ['Dark', ECO_TOKENS.primaryDark],
            ['Soft', ECO_TOKENS.primarySoft],
            ['Tint', ECO_TOKENS.primaryTint],
          ].map(([n, c]) => (
            <div key={n}>
              <div style={{ height: 52, background: c, borderRadius: 6, border: `1px solid ${ECO_TOKENS.border}` }}/>
              <div style={{ fontSize: 10.5, marginTop: 4, fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: 9.5, color: ECO_TOKENS.inkMid, fontFamily: 'ui-monospace, monospace' }}>{c}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, margin: '16px 0 10px' }}>Tipos de contenedor</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {Object.entries(ECO_TOKENS.containers).map(([k, v]) => (
            <div key={k}>
              <div style={{ height: 36, background: v.color, borderRadius: 6 }}/>
              <div style={{ fontSize: 10, marginTop: 3, fontWeight: 600 }}>{v.label}</div>
              <div style={{ fontSize: 9, color: ECO_TOKENS.inkMid, fontFamily: 'ui-monospace, monospace' }}>{v.color}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, margin: '16px 0 10px' }}>Estado y prioridad</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(ECO_TOKENS.statuses).map(([k, v]) => (
            <Badge key={k} color={v.color} label={v.label}/>
          ))}
          {Object.entries(ECO_TOKENS.priorities).map(([k, v]) => (
            <PriorityTag key={k} priority={k} size="sm"/>
          ))}
        </div>
      </div>

      {/* TYPE */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Tipografía</div>
        <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, marginBottom: 6 }}>Inter · neutra, institucional</div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.05 }}>Display 32 / 700</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>H1 · 24 / 700</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>H2 · 20 / 600</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>H3 · 16 / 600</div>
        <div style={{ fontSize: 14, marginTop: 4, color: ECO_TOKENS.ink }}>Body 14 / 400. Texto general legible y cómodo.</div>
        <div style={{ fontSize: 12, marginTop: 4, color: ECO_TOKENS.inkMid }}>Caption 12 / 500 · Etiquetas, badges, leyendas</div>
        <div style={{ fontSize: 11, marginTop: 4, color: ECO_TOKENS.inkMid, fontFamily: 'ui-monospace, monospace' }}>Mono 11 / 500 · IDs, coordenadas</div>

        <div style={{ marginTop: 18, padding: 12, background: ECO_TOKENS.primaryMist, borderRadius: 8, fontSize: 12, color: ECO_TOKENS.ink, lineHeight: 1.5 }}>
          <strong>Principios.</strong> El mapa es protagonista. Color usado con intención (estado, tipo, alerta), nunca como decoración. Tarjetas y paneles como contenedores neutros. Densidad opuesta entre ciudadano y municipal.
        </div>
      </div>

      {/* COMPONENTS */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Botones</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button kind="primary" size="sm">Primario</Button>
          <Button kind="secondary" size="sm">Secundario</Button>
          <Button kind="ghost" size="sm">Ghost</Button>
          <Button kind="danger" size="sm">Eliminar</Button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, margin: '14px 0 10px' }}>Pines y clúster</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Pin type="envases" status="pendiente"/>
          <Pin type="papel" status="en_proceso"/>
          <Pin type="vidrio" status="resuelto"/>
          <Pin type="baterias" status="pendiente" selected/>
          <PinCluster count={12}/>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, margin: '14px 0 10px' }}>Chips</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip label="Todos" active size="sm"/>
          <ContainerChip type="envases" active size="sm"/>
          <ContainerChip type="vidrio" size="sm"/>
          <ContainerChip type="organico" size="sm"/>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, margin: '14px 0 10px' }}>KPI card</div>
        <div style={{ width: 160 }}>
          <KPI label="Resueltas" value="179" sub="63% del total" accent={ECO_TOKENS.success} trend={{ dir: 'up', value: '+8%' }}/>
        </div>
      </div>
    </div>
  </div>
);

// ---------- map style variants ----------
const MapStyles = () => (
  <div style={{ position: 'absolute', inset: 0, background: '#fff', padding: 24, fontFamily: 'inherit', overflow: 'auto' }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: ECO_TOKENS.ink }}>Mapa estilizado de Santa Cruz</div>
      <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid }}>Coastline, ejes principales, plazas. Tres variantes — escoge en Tweaks.</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {[
        ['Claro', 'light'],
        ['Suave', 'positron'],
        ['Oscuro', 'satellite'],
      ].map(([label, v]) => (
        <div key={v}>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${ECO_TOKENS.border}` }}>
            <SCMap width={170} height={230} variant={v}
              showStreetNames={false}
              reports={ECO_REPORTS.slice(0, 6)} pinSize={20}/>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: ECO_TOKENS.ink, marginTop: 6 }}>{label}</div>
          <div style={{ fontSize: 10.5, color: ECO_TOKENS.inkMid }}>variant=&quot;{v}&quot;</div>
        </div>
      ))}
    </div>

    <div style={{ marginTop: 18, padding: 12, background: ECO_TOKENS.appBg, border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 8, fontSize: 11.5, color: ECO_TOKENS.inkMid, lineHeight: 1.5 }}>
      Ejes representados: Av. de Anaga (costa), Av. Tres de Mayo, Rambla de Santa Cruz, Calle Castillo (peatonal), Plaza de España, Plaza del Príncipe, Plaza Weyler, Parque García Sanabria, Auditorio. Heatmap y rutas se activan en la vista municipal.
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

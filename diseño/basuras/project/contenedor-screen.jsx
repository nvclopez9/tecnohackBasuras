// ScreenContenedor — full inspection of a single container.
// Photo header, key facts, fullness history (hourly + weekly), recent incidents,
// best/avoid windows, actions (add to route / report / navigate).

const ScreenContenedor = ({ container, onBack, onReport, onAddRoute, mapVariant = 'light' }) => {
  // Default demo container if none provided
  const c = container || {
    id: 'C-501', container: 'envases', status: 'pendiente', priority: 'media',
    addr: 'Calle Castillo, 47', area: 'Centro', x: 0.42, y: 0.48,
    reporter: 'María D.', date: '14 may · 09:42',
  };
  const meta = ECO_TOKENS.containers[c.container];
  const tip = bestHourTip(c.container);
  const hourly = ECO_HOURLY[c.container] || ECO_HOURLY.resto;
  const nowH = 18;
  const nowLevel = hourly[nowH];

  return (
    <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
      {/* Photo header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260,
        background: `linear-gradient(135deg, ${meta.color}99 0%, ${meta.color}33 100%)`,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.15) 0 14px, transparent 14px 28px)' }}>

        <div style={{ position: 'absolute', top: 50, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.95)',
            border: 'none', color: ECO_TOKENS.ink, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.18)',
          }}><Icon name="arrow-l" size={18}/></button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.95)',
              border: 'none', color: ECO_TOKENS.ink, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.18)',
            }}><Icon name="bell" size={16}/></button>
            <button style={{
              width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.95)',
              border: 'none', color: ECO_TOKENS.ink, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.18)',
            }}><Icon name="kebab" size={16}/></button>
          </div>
        </div>

        {/* Big icon */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 110, height: 110, borderRadius: 22,
            background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color,
            boxShadow: '0 8px 28px rgba(0,0,0,.18)',
          }}>
            {containerIcon(c.container, 64)}
          </div>
        </div>

        {/* ID chip */}
        <div style={{
          position: 'absolute', bottom: 18, left: 16,
          background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(6px)',
          padding: '4px 10px', borderRadius: 6,
          color: '#fff', fontSize: 11, fontFamily: 'ui-monospace, monospace', fontWeight: 600,
        }}>
          {c.id}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ position: 'absolute', top: 232, left: 0, right: 0, bottom: 82, overflowY: 'auto' }}>
        <div style={{ background: ECO_TOKENS.appBg, borderRadius: '18px 18px 0 0', padding: 16, minHeight: '100%' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: meta.color }}/>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Contenedor de {meta.label}
            </span>
            <Badge color={ECO_TOKENS.statuses[c.status].color} label={ECO_TOKENS.statuses[c.status].label} size="sm"/>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: ECO_TOKENS.ink, lineHeight: 1.2 }}>{c.addr}</div>
          <div style={{ fontSize: 12.5, color: ECO_TOKENS.inkMid, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="pin" size={12}/> {c.area} · a 120 m de ti
          </div>

          {/* Live fullness gauge */}
          <div style={{
            marginTop: 14, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 14, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Estado actual · {String(nowH).padStart(2, '0')}:00
              </div>
              <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>Estimado</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* circular gauge */}
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="34" stroke={ECO_TOKENS.appBg} strokeWidth="9" fill="none"/>
                <circle cx="42" cy="42" r="34"
                  stroke={nowLevel >= 0.75 ? ECO_TOKENS.danger : nowLevel >= 0.55 ? ECO_TOKENS.warn : nowLevel >= 0.35 ? ECO_TOKENS.primary : ECO_TOKENS.success}
                  strokeWidth="9" fill="none" strokeLinecap="round"
                  strokeDasharray={`${nowLevel * 213.6} 213.6`}
                  transform="rotate(-90 42 42)"/>
                <text x="42" y="44" textAnchor="middle" fontSize="20" fontWeight="700"
                  fill={ECO_TOKENS.ink} fontFamily="Inter, sans-serif" dominantBaseline="middle">
                  {Math.round(nowLevel * 100)}%
                </text>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  color: nowLevel >= 0.75 ? ECO_TOKENS.danger : nowLevel >= 0.55 ? ECO_TOKENS.warn : ECO_TOKENS.success,
                }}>
                  {nowLevel >= 0.75 ? 'Probablemente lleno'
                    : nowLevel >= 0.55 ? 'Empezando a llenarse'
                    : nowLevel >= 0.35 ? 'Con espacio' : 'Casi vacío'}
                </div>
                <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, marginTop: 2, lineHeight: 1.4 }}>
                  Basado en {Math.round(nowLevel * 100)}% de saturación media a esta hora durante las últimas 4 semanas.
                </div>
              </div>
            </div>
          </div>

          {/* Hourly pattern */}
          <div style={{
            marginTop: 12, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 14, padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Patrón por hora
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 56, gap: 2 }}>
              {hourly.map((v, h) => {
                let col = ECO_TOKENS.success;
                if (v >= 0.75) col = ECO_TOKENS.danger;
                else if (v >= 0.55) col = ECO_TOKENS.warn;
                else if (v >= 0.35) col = ECO_TOKENS.primary;
                const isNow = h === nowH;
                return (
                  <div key={h} style={{
                    flex: 1, height: `${Math.max(8, v * 100)}%`,
                    background: col, opacity: isNow ? 1 : 0.6,
                    borderRadius: 2,
                    outline: isNow ? `1.5px solid ${ECO_TOKENS.ink}` : 'none',
                    outlineOffset: 1,
                  }}/>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: ECO_TOKENS.inkMid, marginTop: 6, fontFamily: 'ui-monospace, monospace' }}>
              <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
            </div>

            {/* Two tip cards */}
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: ECO_TOKENS.success + '12', border: `1px solid ${ECO_TOKENS.success}40`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: ECO_TOKENS.success, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                  ✓ Mejor pasar
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {String(tip.bestHour).padStart(2, '0')}:00
                </div>
                <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, marginTop: 2 }}>Suele estar disponible</div>
              </div>
              <div style={{ background: ECO_TOKENS.danger + '12', border: `1px solid ${ECO_TOKENS.danger}40`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: ECO_TOKENS.danger, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                  ⚠ Evita ir
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {String(tip.peakHour).padStart(2, '0')}:00
                </div>
                <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, marginTop: 2 }}>{tip.peakPct}% lleno de media</div>
              </div>
            </div>
          </div>

          {/* Key facts grid */}
          <div style={{
            marginTop: 12, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { i: 'check', label: 'Última recogida', v: 'Hoy, 06:14', sub: 'Equipo Centro · vaciado completo' },
              { i: 'clock',  label: 'Próx. recogida programada', v: 'Mañana, 06:00', sub: 'Frecuencia: diaria L–S' },
              { i: 'pin',    label: 'Coordenadas',  v: '28.4685, −16.2467', sub: 'Calle Castillo, 47 · acera derecha' },
              { i: 'medal',  label: 'Reciclajes esta semana', v: '127', sub: '+18 vs. semana pasada' },
            ].map((f, i, a) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderBottom: i === a.length - 1 ? 'none' : `1px solid ${ECO_TOKENS.borderSoft}`,
              }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8, background: ECO_TOKENS.primaryMist,
                  color: ECO_TOKENS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flex: '0 0 30px',
                }}><Icon name={f.i} size={15}/></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>{f.label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: ECO_TOKENS.ink, marginTop: 1 }}>{f.v}</div>
                  <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, marginTop: 1 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent incidents */}
          <div style={{
            marginTop: 12, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${ECO_TOKENS.borderSoft}`, display: 'flex', alignItems: 'baseline' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink }}>Incidencias recientes</div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: ECO_TOKENS.inkMid }}>Últimos 30 días</div>
            </div>
            {[
              { kind: 'lleno',        date: 'Hace 2h',  who: 'Hugo R.',  status: 'en_proceso' },
              { kind: 'sucio',        date: 'Hace 1 d', who: 'Lucía M.', status: 'resuelto' },
              { kind: 'roto',         date: 'Hace 5 d', who: 'Ana L.',   status: 'resuelto' },
              { kind: 'lleno',        date: 'Hace 12d', who: 'Tú',       status: 'resuelto' },
            ].map((it, i, a) => {
              const stMeta = ECO_TOKENS.statuses[it.status];
              const inc = ECO_TOKENS.incidents[it.kind];
              const ICONS = { lleno: 'bag', roto: 'edit', sucio: 'drop', quemado: 'flame', desaparecido: 'question' };
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                  borderBottom: i === a.length - 1 ? 'none' : `1px solid ${ECO_TOKENS.borderSoft}`,
                }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: stMeta.color + '20', color: stMeta.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flex: '0 0 30px',
                  }}><Icon name={ICONS[it.kind]} size={14}/></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: ECO_TOKENS.ink }}>{inc.label}</div>
                    <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>{it.date} · {it.who}</div>
                  </div>
                  <Badge color={stMeta.color} label={stMeta.label} size="sm"/>
                </div>
              );
            })}
          </div>

          {/* Map preview */}
          <div style={{
            marginTop: 12, background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${ECO_TOKENS.borderSoft}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink }}>Ubicación</div>
              <span style={{ fontSize: 11.5, color: ECO_TOKENS.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="locate" size={12}/> Cómo llegar
              </span>
            </div>
            <SCMap width={358} height={140} variant={mapVariant}
              reports={[{ ...c, x: 0.5, y: 0.55 }]} pinSize={32}/>
          </div>

          <div style={{ height: 24 }}/>
        </div>
      </div>

      {/* Action footer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 82,
        padding: '10px 14px', background: '#fff', borderTop: `1px solid ${ECO_TOKENS.border}`,
        display: 'flex', gap: 8, zIndex: 5,
      }}>
        <Button kind="secondary" size="md" full icon={<Icon name="plus" size={15}/>} onClick={() => onAddRoute && onAddRoute(c)}>
          A ruta
        </Button>
        <Button kind="primary" size="md" full icon={<Icon name="camera" size={15}/>} onClick={() => onReport && onReport(c)}>
          Reportar
        </Button>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenContenedor });

// Vista temporal del Panel Municipal — mapa + slider horario.
// Eje X inferior con horas 0..23. La opacidad/color de los pines y del
// heatmap cambia según la franja seleccionada.

const ViewTemporal = () => {
  const [hour, setHour] = React.useState(20);     // current selected hour
  const [day, setDay]   = React.useState('Lab');  // 'Lab' weekday / 'Sab' / 'Dom'
  const [layer, setLayer] = React.useState('heatmap');  // heatmap | pines

  // average fullness across all containers at this hour
  const avg = Object.values(ECO_HOURLY).reduce((s, arr) => s + arr[hour], 0) / Object.keys(ECO_HOURLY).length;
  const status = avg >= 0.75 ? { label: 'CRÍTICO', color: ECO_TOKENS.danger } :
                 avg >= 0.55 ? { label: 'TENSO',   color: ECO_TOKENS.warn  } :
                                { label: 'TRANQUILO', color: ECO_TOKENS.success };

  // Filter reports by hour-fullness pattern of their container type
  const visible = ECO_REPORTS.filter(r => (ECO_HOURLY[r.container]?.[hour] ?? 0) > 0.55);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* MAP */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <SCMap
          width={'100%'} height={'100%'}
          variant="light"
          showStreetNames
          heatmap={layer === 'heatmap'}
          reports={layer === 'pines' ? visible : []}
          pinSize={24}
        />

        {/* Header overlay */}
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 10, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,.06)',
            minWidth: 240,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={16} color={ECO_TOKENS.primary}/>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Franja horaria · {day === 'Lab' ? 'L–V' : day === 'Sab' ? 'Sábado' : 'Domingo'}
              </div>
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {String(hour).padStart(2, '0')}:00
              </div>
              <span style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>– {String((hour + 1) % 24).padStart(2, '0')}:00</span>
            </div>
          </div>

          <div style={{
            background: status.color + '18', border: `1px solid ${status.color}55`,
            borderRadius: 10, padding: '10px 14px', minWidth: 180,
          }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Estado de la red
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: status.color }}/>
              <div style={{ fontSize: 18, fontWeight: 700, color: status.color }}>{status.label}</div>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(avg * 100)}% medio
              </span>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: ECO_TOKENS.inkMid }}>
              {visible.length} contenedores en zona tensionada
            </div>
          </div>

          <div style={{ flex: 1 }}/>

          {/* Day toggle */}
          <div style={{
            background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 10, padding: 3, display: 'flex', gap: 2, boxShadow: '0 2px 8px rgba(0,0,0,.06)',
          }}>
            {['Lab', 'Sab', 'Dom'].map(d => (
              <button key={d} onClick={() => setDay(d)} style={{
                padding: '6px 12px', borderRadius: 7, border: 'none', fontFamily: 'inherit',
                background: day === d ? ECO_TOKENS.primaryTint : 'transparent',
                color: day === d ? ECO_TOKENS.primary : ECO_TOKENS.ink,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>{d === 'Lab' ? 'L–V' : d === 'Sab' ? 'Sáb' : 'Dom'}</button>
            ))}
          </div>

          {/* Layer toggle */}
          <div style={{
            background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
            borderRadius: 10, padding: 3, display: 'flex', gap: 2, boxShadow: '0 2px 8px rgba(0,0,0,.06)',
          }}>
            <button onClick={() => setLayer('heatmap')} style={{
              padding: '6px 10px', borderRadius: 7, border: 'none', fontFamily: 'inherit',
              background: layer === 'heatmap' ? ECO_TOKENS.primaryTint : 'transparent',
              color: layer === 'heatmap' ? ECO_TOKENS.primary : ECO_TOKENS.ink,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}><Icon name="flame" size={12}/> Heatmap</button>
            <button onClick={() => setLayer('pines')} style={{
              padding: '6px 10px', borderRadius: 7, border: 'none', fontFamily: 'inherit',
              background: layer === 'pines' ? ECO_TOKENS.primaryTint : 'transparent',
              color: layer === 'pines' ? ECO_TOKENS.primary : ECO_TOKENS.ink,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}><Icon name="pin" size={12}/> Pines</button>
          </div>
        </div>

        {/* HOUR TIMELINE — bottom */}
        <div style={{
          position: 'absolute', left: 16, right: 16, bottom: 16,
          background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
          borderRadius: 12, padding: '14px 18px',
          boxShadow: '0 4px 18px rgba(0,0,0,.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ECO_TOKENS.ink }}>
              Saturación media por hora ({day === 'Lab' ? 'L–V' : day === 'Sab' ? 'Sábados' : 'Domingos'})
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 10.5, color: ECO_TOKENS.inkMid }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: ECO_TOKENS.success }}/> &lt;35%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: ECO_TOKENS.primary }}/> 35-55%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: ECO_TOKENS.warn }}/> 55-75%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: ECO_TOKENS.danger }}/> &gt;75%
              </span>
            </div>
          </div>

          {/* Bars */}
          <div style={{ position: 'relative', height: 80, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {[...Array(24)].map((_, h) => {
              const v = Object.values(ECO_HOURLY).reduce((s, arr) => s + arr[h], 0) / 8;
              let col = ECO_TOKENS.success;
              if (v >= 0.75) col = ECO_TOKENS.danger;
              else if (v >= 0.55) col = ECO_TOKENS.warn;
              else if (v >= 0.35) col = ECO_TOKENS.primary;
              const isActive = h === hour;
              return (
                <div key={h} onClick={() => setHour(h)} style={{
                  flex: 1, position: 'relative', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <div style={{
                    width: '100%', height: `${Math.max(8, v * 100)}%`,
                    background: col,
                    opacity: isActive ? 1 : 0.65,
                    borderRadius: '3px 3px 0 0',
                    outline: isActive ? `2px solid ${ECO_TOKENS.ink}` : 'none',
                    outlineOffset: 1,
                    transition: 'opacity .12s',
                  }}/>
                </div>
              );
            })}
            {/* hour axis */}
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
            {[...Array(24)].map((_, h) => (
              <div key={h} style={{
                flex: 1, textAlign: 'center', fontSize: 9,
                color: h === hour ? ECO_TOKENS.ink : ECO_TOKENS.inkMid,
                fontWeight: h === hour ? 700 : 500,
                fontFamily: 'ui-monospace, monospace',
              }}>{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</div>
            ))}
          </div>

          {/* slider input alternative */}
          <input type="range" min="0" max="23" value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            style={{ width: '100%', marginTop: 4, accentColor: ECO_TOKENS.primary }}/>
        </div>
      </div>

      {/* RIGHT PANEL: hotspots in this hour */}
      <div style={{ width: 360, flex: '0 0 360px', background: '#fff', borderLeft: `1px solid ${ECO_TOKENS.border}`, overflow: 'auto', padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Tensión por tipo · {String(hour).padStart(2, '0')}:00
        </div>
        {Object.entries(ECO_HOURLY)
          .map(([k, arr]) => ({ k, label: ECO_TOKENS.containers[k].label, color: ECO_TOKENS.containers[k].color, v: arr[hour] }))
          .sort((a, b) => b.v - a.v)
          .map(d => (
            <div key={d.k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${ECO_TOKENS.borderSoft}` }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: d.color }}/>
              <span style={{ flex: 1, fontSize: 12.5, color: ECO_TOKENS.ink, fontWeight: 500 }}>{d.label}</span>
              <div style={{ width: 80, height: 6, background: ECO_TOKENS.appBg, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${d.v * 100}%`, height: '100%',
                  background: d.v >= 0.75 ? ECO_TOKENS.danger : d.v >= 0.55 ? ECO_TOKENS.warn : d.v >= 0.35 ? ECO_TOKENS.primary : ECO_TOKENS.success }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums', width: 38, textAlign: 'right' }}>
                {Math.round(d.v * 100)}%
              </span>
            </div>
          ))
        }

        <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Recomendaciones operativas
        </div>
        <div style={{
          background: ECO_TOKENS.warn + '15', border: `1px solid ${ECO_TOKENS.warn}40`,
          borderRadius: 8, padding: '10px 12px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icon name="bell" size={14} color={ECO_TOKENS.warn}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink }}>Pico crítico de vidrio a las 20:00</div>
              <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, marginTop: 2, lineHeight: 1.4 }}>
                Programar recogida adicional en zona Centro / Rambla entre las 22:00 y 24:00.
              </div>
            </div>
          </div>
        </div>
        <div style={{
          background: ECO_TOKENS.success + '15', border: `1px solid ${ECO_TOKENS.success}40`,
          borderRadius: 8, padding: '10px 12px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icon name="check" size={14} color={ECO_TOKENS.success}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink }}>Ventana óptima de mantenimiento</div>
              <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, marginTop: 2, lineHeight: 1.4 }}>
                03:00 – 06:00 · saturación &lt; 15% en toda la red. Ideal para limpieza y reparación.
              </div>
            </div>
          </div>
        </div>
        <div style={{
          background: ECO_TOKENS.primaryMist, border: `1px solid ${ECO_TOKENS.border}`,
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icon name="route" size={14} color={ECO_TOKENS.primary}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.ink }}>Ruta sugerida</div>
              <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, marginTop: 2, lineHeight: 1.4 }}>
                12 paradas en Centro + Anaga · 1h 40 min estimadas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ViewTemporal });

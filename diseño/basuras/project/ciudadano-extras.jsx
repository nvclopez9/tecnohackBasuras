// New screens + overlays for the gamification iteration.
// Components added: ScreenRanking, ScreenRuta, BannerArrival (the 2-step
// satisfaction → ¿reciclaste? overlay), CuentaPoints (drop-in block for Cuenta).

// ─────────────────────────────────────────────────────────────
// BannerArrival — 2-step overlay shown when GPS detects arrival
// at a route stop. Step 1: ¿cómo está? (😁/😐/😠) → Step 2: ¿reciclaste? (Sí/No)
// ─────────────────────────────────────────────────────────────
const BannerArrival = ({ stop, onDone, onSkip }) => {
  const [step, setStep] = React.useState(1);
  const [sat, setSat] = React.useState(null);

  if (!stop) return null;
  const c = ECO_TOKENS.containers[stop.container];

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 82,
      zIndex: 40, padding: '0 12px',
      animation: 'slideUp .25s ease-out',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18,
        boxShadow: '0 -8px 28px rgba(0,0,0,.18)',
        border: `1px solid ${ECO_TOKENS.border}`,
        overflow: 'hidden',
      }}>
        {/* Tape */}
        <div style={{
          background: ECO_TOKENS.success, color: '#fff',
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: '#fff',
            boxShadow: '0 0 0 4px rgba(255,255,255,.3)', animation: 'pulse 1.4s infinite' }}/>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Has llegado · Parada {stop.idx ?? 1} de {stop.total ?? 1}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: 999, background: '#fff' }}/>
            <span style={{ width: step === 1 ? 14 : 4, height: 4, borderRadius: 999, background: '#fff' }}/>
            <span style={{ width: step === 2 ? 14 : 4, height: 4, borderRadius: 999, background: '#fff', opacity: step === 2 ? 1 : 0.5 }}/>
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Pin type={stop.container} status="pendiente" size={32}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: ECO_TOKENS.ink }}>
                Contenedor {c.label.toLowerCase()}
              </div>
              <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stop.addr}
              </div>
            </div>
          </div>

          {step === 1 ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 4 }}>
                ¿Cómo está el contenedor?
              </div>
              <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, marginBottom: 12 }}>
                Tu valoración ayuda al servicio · +5 puntos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { id: 'good',    emoji: '😁', label: 'Bien',    color: ECO_TOKENS.success },
                  { id: 'meh',     emoji: '😐', label: 'Regular', color: ECO_TOKENS.warn },
                  { id: 'bad',     emoji: '😠', label: 'Mal',     color: ECO_TOKENS.danger },
                ].map(opt => {
                  const active = sat === opt.id;
                  return (
                    <button key={opt.id} onClick={() => { setSat(opt.id); setTimeout(() => setStep(2), 240); }}
                      style={{
                      padding: '14px 6px 10px', borderRadius: 14,
                      background: active ? opt.color + '18' : ECO_TOKENS.appBg,
                      border: `1.5px solid ${active ? opt.color : ECO_TOKENS.border}`,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'all .15s',
                    }}>
                      <span style={{ fontSize: 34, lineHeight: 1 }}>{opt.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: active ? opt.color : ECO_TOKENS.ink }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={onSkip} style={{
                marginTop: 14, width: '100%', background: 'transparent', border: 'none',
                color: ECO_TOKENS.inkMid, fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 6, fontFamily: 'inherit',
              }}>Omitir esta parada</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 4 }}>
                ¿Has reciclado?
              </div>
              <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, marginBottom: 14 }}>
                Confirma si depositaste residuos · +10 puntos
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button kind="ghost" size="lg" full
                  icon={<Icon name="x" size={16}/>}
                  onClick={() => onDone({ satisfaction: sat, recycled: false, pointsEarned: 5 })}>
                  No esta vez
                </Button>
                <Button kind="primary" size="lg" full
                  icon={<Icon name="check" size={16}/>}
                  onClick={() => onDone({ satisfaction: sat, recycled: true, pointsEarned: 15 })}>
                  Sí, reciclé
                </Button>
              </div>
              <button onClick={() => setStep(1)} style={{
                marginTop: 12, width: '100%', background: 'transparent', border: 'none',
                color: ECO_TOKENS.inkMid, fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 6, fontFamily: 'inherit',
              }}>← Cambiar valoración</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PointsToast — small "+15 puntos" confirmation pill
// ─────────────────────────────────────────────────────────────
const PointsToast = ({ points }) => (
  <div style={{
    position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)',
    background: ECO_TOKENS.success, color: '#fff',
    padding: '10px 16px', borderRadius: 999,
    fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 8px 22px rgba(46,139,87,.4)', zIndex: 50,
  }}>
    <Icon name="star" size={16}/> +{points} puntos · ¡buen trabajo!
  </div>
);

// ─────────────────────────────────────────────────────────────
// HourlyTip — bar showing current hour + best/avoid windows
// ─────────────────────────────────────────────────────────────
const HourlyMini = ({ containerType }) => {
  const data = ECO_HOURLY[containerType] || ECO_HOURLY.resto;
  const now = 18; // demo "current hour"
  const tip = bestHourTip(containerType);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 32, gap: 1.5 }}>
        {data.map((v, h) => {
          let col = '#D6E6F2';
          if (v >= 0.75) col = ECO_TOKENS.danger;
          else if (v >= 0.55) col = ECO_TOKENS.warn;
          else if (v >= 0.35) col = ECO_TOKENS.primary;
          const isNow = h === now;
          return (
            <div key={h} style={{
              flex: 1, height: `${Math.max(8, v * 100)}%`,
              background: col,
              opacity: isNow ? 1 : 0.55,
              borderRadius: 1.5,
              outline: isNow ? `1.5px solid ${ECO_TOKENS.ink}` : 'none',
              outlineOffset: 1,
            }}/>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: ECO_TOKENS.inkMid, marginTop: 4, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace' }}>
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>
      <div style={{
        marginTop: 8, fontSize: 12, color: ECO_TOKENS.ink, display: 'flex', alignItems: 'center', gap: 6,
        background: ECO_TOKENS.primaryMist, padding: '7px 10px', borderRadius: 8,
        border: `1px solid ${ECO_TOKENS.border}`,
      }}>
        <Icon name="clock" size={13} color={ECO_TOKENS.primary}/>
        <span>
          <strong>Mejor pasar a partir de las {String(tip.bestHour).padStart(2,'0')}:00</strong>
          {' '}· suele saturarse a las {String(tip.peakHour).padStart(2,'0')}:00 ({tip.peakPct}%)
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CuentaPoints — points + weekly breakdown block (top of Cuenta)
// ─────────────────────────────────────────────────────────────
const CuentaPoints = () => {
  const u = ECO_USER;
  const progressPct = Math.min(100, Math.round(u.totalPoints / (u.totalPoints + u.pointsToNext) * 100));
  return (
    <div style={{
      background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
      borderRadius: 14, padding: 16, marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Tus puntos
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {u.totalPoints.toLocaleString('es')}
            </div>
            <div style={{ fontSize: 13, color: ECO_TOKENS.success, fontWeight: 600 }}>
              +{u.weeklyPoints} esta sem.
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: ECO_TOKENS.primaryTint, padding: '6px 10px', borderRadius: 10,
        }}>
          <Icon name="trophy" size={18} color={ECO_TOKENS.primary}/>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: ECO_TOKENS.primary, marginTop: 2 }}>#{u.rankWeekly}</div>
          <div style={{ fontSize: 9, color: ECO_TOKENS.primary, opacity: 0.8 }}>de la sem.</div>
        </div>
      </div>

      {/* progress to next level */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: ECO_TOKENS.inkMid, marginBottom: 5 }}>
          <span>Nivel {u.level} · {u.levelLabel}</span>
          <span><strong style={{ color: ECO_TOKENS.ink }}>{u.pointsToNext}</strong> puntos para nivel {u.level + 1}</span>
        </div>
        <div style={{ height: 8, background: ECO_TOKENS.appBg, borderRadius: 4, overflow: 'hidden', border: `1px solid ${ECO_TOKENS.border}` }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: `linear-gradient(90deg, ${ECO_TOKENS.primary}, ${ECO_TOKENS.success})` }}/>
        </div>
      </div>

      {/* Streak */}
      <div style={{
        marginTop: 12, padding: '8px 12px', borderRadius: 10,
        background: ECO_TOKENS.warn + '15', border: `1px solid ${ECO_TOKENS.warn}40`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🔥</span>
        <div style={{ flex: 1, fontSize: 12.5, color: ECO_TOKENS.ink }}>
          <strong>{u.streak} días seguidos</strong> reciclando
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: ECO_TOKENS.warn }}>¡Sigue!</span>
      </div>

      {/* Breakdown */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Esta semana
        </div>
        {u.thisWeekBreakdown.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
            borderBottom: i === u.thisWeekBreakdown.length - 1 ? 'none' : `1px solid ${ECO_TOKENS.borderSoft}`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: b.color }}/>
            <span style={{ flex: 1, fontSize: 12.5, color: ECO_TOKENS.ink }}>{b.label}</span>
            <span style={{ fontSize: 11, color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums' }}>×{b.count}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: b.color, fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right' }}>
              +{b.count * b.each}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ScreenRanking — Top 100 semanal
// ─────────────────────────────────────────────────────────────
const ScreenRanking = () => {
  const [scope, setScope] = React.useState('global');  // 'global' | 'barrios'
  return (
    <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: `linear-gradient(180deg, ${ECO_TOKENS.primary} 0%, ${ECO_TOKENS.primaryDark} 100%)`,
        color: '#fff', padding: '50px 16px 14px',
        borderRadius: '0 0 18px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="trophy" size={22} color="#fff"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>Ranking semanal</div>
            <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>
              Lun 11 – Dom 17 may · cierra en <strong>2d 5h</strong>
            </div>
          </div>
          <span style={{
            background: 'rgba(255,255,255,.18)', padding: '5px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
          }}>S20</span>
        </div>

        {/* scope toggle */}
        <div style={{
          marginTop: 14, display: 'flex', gap: 4,
          background: 'rgba(0,0,0,.18)', borderRadius: 10, padding: 3,
        }}>
          {[
            { id: 'global',  label: 'Personas' },
            { id: 'barrios', label: 'Barrios'  },
          ].map(o => (
            <button key={o.id} onClick={() => setScope(o.id)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 'none',
              background: scope === o.id ? 'rgba(255,255,255,.95)' : 'transparent',
              color: scope === o.id ? ECO_TOKENS.primary : '#fff',
              fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'absolute', inset: '170px 0 82px 0', overflowY: 'auto', padding: 14 }}>
        {scope === 'global' ? <RankingPeople/> : <RankingBarrios/>}
      </div>
    </div>
  );
};

const RankingPeople = () => {
  const podio = ECO_LEADERBOARD.slice(0, 3);
  // top 3 + nearby-me slice
  return (
    <>
      {/* Podio */}
      <div style={{
        background: '#fff', border: `1px solid ${ECO_TOKENS.border}`,
        borderRadius: 14, padding: '16px 12px', marginBottom: 12,
        display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', alignItems: 'end', gap: 10,
      }}>
        {[podio[1], podio[0], podio[2]].map((p, i) => {
          const place = i === 0 ? 2 : i === 1 ? 1 : 3;
          const h = place === 1 ? 82 : place === 2 ? 62 : 48;
          const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
          return (
            <div key={p.rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: place === 1 ? 56 : 44, height: place === 1 ? 56 : 44, borderRadius: 999,
                  background: p.avatar, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: place === 1 ? 16 : 13, fontWeight: 700,
                  border: `3px solid ${place === 1 ? '#FFD23F' : place === 2 ? '#C0C0C0' : '#CD7F32'}`,
                }}>{p.initials}</div>
                <span style={{
                  position: 'absolute', bottom: -4, right: -4, fontSize: 18,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.2))',
                }}>{medal}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.ink, textAlign: 'center', lineHeight: 1.1 }}>
                {p.name.split(' ')[0]}<br/>
                <span style={{ fontWeight: 500, color: ECO_TOKENS.inkMid }}>{p.name.split(' ').slice(1).join(' ')}</span>
              </div>
              <div style={{
                width: '100%', height: h, borderRadius: '6px 6px 0 0',
                background: place === 1 ? `linear-gradient(180deg, ${ECO_TOKENS.primary}, ${ECO_TOKENS.primaryDark})`
                                        : `linear-gradient(180deg, ${ECO_TOKENS.primarySoft}, ${ECO_TOKENS.primary})`,
                color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.pts}</div>
                <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: -2 }}>pts</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 'auto', paddingBottom: 4 }}>{place}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of top */}
      <div style={{ background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {ECO_LEADERBOARD.slice(3, 20).map(p => <RankRow key={p.rank} p={p}/>)}
        <div style={{ padding: '14px 16px', background: ECO_TOKENS.appBg, borderTop: `1px solid ${ECO_TOKENS.border}`, textAlign: 'center', fontSize: 12, color: ECO_TOKENS.inkMid }}>
          ··· 80 más hasta llegar al top 100 ···
        </div>
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 12, padding: '14px 16px', borderRadius: 14,
        background: `linear-gradient(135deg, ${ECO_TOKENS.success}18, ${ECO_TOKENS.primary}18)`,
        border: `1px solid ${ECO_TOKENS.border}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink, marginBottom: 4 }}>
          🚀 Estás a <span style={{ color: ECO_TOKENS.primary }}>76 puntos</span> del Top 10
        </div>
        <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, lineHeight: 1.4 }}>
          Recicla 8 veces más esta semana para subir.
        </div>
      </div>
    </>
  );
};

const RankRow = ({ p }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    background: p.isMe ? ECO_TOKENS.primaryTint : '#fff',
    borderLeft: p.isMe ? `3px solid ${ECO_TOKENS.primary}` : '3px solid transparent',
    borderBottom: `1px solid ${ECO_TOKENS.borderSoft}`,
  }}>
    <div style={{ width: 24, fontSize: 12.5, fontWeight: 700, color: ECO_TOKENS.inkMid, fontVariantNumeric: 'tabular-nums' }}>
      {p.rank}
    </div>
    <div style={{
      width: 36, height: 36, borderRadius: 999, background: p.avatar, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
      border: p.isMe ? `2px solid ${ECO_TOKENS.primary}` : 'none',
    }}>{p.initials}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: p.isMe ? 700 : 600, color: ECO_TOKENS.ink, lineHeight: 1.2 }}>
        {p.name} {p.isMe && <span style={{ fontSize: 10, color: ECO_TOKENS.primary, fontWeight: 700 }}>· tú</span>}
      </div>
      <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>{p.barrio}</div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>
        {p.pts}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600,
        color: p.delta > 0 ? ECO_TOKENS.success : p.delta < 0 ? ECO_TOKENS.danger : ECO_TOKENS.inkMid }}>
        {p.delta > 0 ? `▲ ${p.delta}` : p.delta < 0 ? `▼ ${Math.abs(p.delta)}` : '— 0'}
      </div>
    </div>
  </div>
);

const RankingBarrios = () => {
  const barrios = [
    { rank: 1, name: 'Centro',      pts: 4820, members: 142, color: ECO_TOKENS.primary },
    { rank: 2, name: 'Anaga',       pts: 3210, members: 84,  color: ECO_TOKENS.success },
    { rank: 3, name: 'Salud',       pts: 2980, members: 96,  color: ECO_TOKENS.warn },
    { rank: 4, name: 'Cabo-Llanos', pts: 2540, members: 71,  color: ECO_TOKENS.danger },
    { rank: 5, name: 'Ofra',        pts: 2118, members: 62,  color: '#5A8FA8' },
    { rank: 6, name: 'La Salle',    pts: 1864, members: 48,  color: '#8C5A2B' },
    { rank: 7, name: 'Ifara',       pts: 1622, members: 41,  color: '#C99700' },
    { rank: 8, name: 'El Sobradillo', pts: 1380, members: 39, color: '#E07A2C' },
  ];
  const max = Math.max(...barrios.map(b => b.pts));
  return (
    <>
      <div style={{
        background: ECO_TOKENS.primaryMist, border: `1px solid ${ECO_TOKENS.border}`,
        borderRadius: 10, padding: '10px 12px', marginBottom: 12,
        fontSize: 12, color: ECO_TOKENS.ink, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon name="pin" size={14} color={ECO_TOKENS.primary}/>
        Tu barrio: <strong>Centro</strong> · #1 esta semana 👑
      </div>
      <div style={{ background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {barrios.map((b, i) => {
          const isMine = b.name === 'Centro';
          return (
            <div key={b.name} style={{
              padding: '12px 14px',
              background: isMine ? ECO_TOKENS.primaryTint : '#fff',
              borderLeft: isMine ? `3px solid ${ECO_TOKENS.primary}` : '3px solid transparent',
              borderBottom: i === barrios.length - 1 ? 'none' : `1px solid ${ECO_TOKENS.borderSoft}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: b.color + '22',
                  color: b.color, fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{b.rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: ECO_TOKENS.ink }}>
                    {b.name} {isMine && <span style={{ fontSize: 10, color: ECO_TOKENS.primary, fontWeight: 700 }}>· tu barrio</span>}
                  </div>
                  <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid }}>{b.members} vecinos activos</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: ECO_TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {b.pts.toLocaleString('es')}
                  </div>
                  <div style={{ fontSize: 10, color: ECO_TOKENS.inkMid }}>pts</div>
                </div>
              </div>
              <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
                <div style={{ width: `${(b.pts / max) * 100}%`, height: '100%', background: b.color, borderRadius: 3 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// ScreenRuta — search + route builder, with arrival banner.
// ─────────────────────────────────────────────────────────────
const ScreenRuta = ({ mapVariant = 'light' }) => {
  // demo state: which stop is "current"
  const [stops, setStops] = React.useState(ECO_ROUTE_DEMO.map((s, i) => ({ ...s, idx: i + 1, total: ECO_ROUTE_DEMO.length })));
  const [arrived, setArrived] = React.useState(stops[0]);  // banner active on first stop
  const [toast, setToast] = React.useState(null);
  const [showSearch, setShowSearch] = React.useState(false);

  const onDone = (result) => {
    setToast(result.pointsEarned);
    setArrived(null);
    setTimeout(() => setToast(null), 2200);
  };

  // Map reports = stops with x/y from route data
  const routeReports = stops.map(s => ({ id: s.reportId, container: s.container, status: s.idx === 1 ? 'en_proceso' : 'pendiente', x: s.x, y: s.y }));

  return (
    <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}>
        <SCMap width={390} height={360} variant={mapVariant}
          showStreetNames={false}
          reports={routeReports}
          selectedId={stops[0].reportId}
          pinSize={28}
          showRoutes={false}
        />
        {/* Route line overlay — follows streets (manhattan w/ rounded corners) */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox="0 0 390 360" width="100%" height="100%">
          {/* white casing under line for legibility */}
          <path d={streetPath(stops, 390, 360, { radius: 12 })}
            fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
          <path d={streetPath(stops, 390, 360, { radius: 12 })}
            fill="none" stroke={ECO_TOKENS.primary} strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0"/>
          {/* corner markers */}
          {stops.map((s, i) => (
            <g key={i}>
              <circle cx={s.x * 390} cy={s.y * 360} r="6" fill="#fff" stroke={ECO_TOKENS.primary} strokeWidth="2"/>
              <text x={s.x * 390} y={s.y * 360 + 3.5} textAnchor="middle"
                fontSize="9" fontWeight="700" fill={ECO_TOKENS.primary} fontFamily="Inter, sans-serif">
                {s.idx}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Header back */}
      <div style={{ position: 'absolute', top: 50, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
        <button style={{
          width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.95)',
          border: 'none', color: ECO_TOKENS.ink, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,.12)',
        }}><Icon name="arrow-l" size={18}/></button>
        <button onClick={() => setShowSearch(true)} style={{
          flex: 1, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.95)',
          border: 'none', color: ECO_TOKENS.inkMid, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
          fontFamily: 'inherit', fontSize: 13,
          boxShadow: '0 2px 8px rgba(0,0,0,.12)',
        }}>
          <Icon name="search" size={15}/>
          Añadir contenedor a la ruta…
        </button>
      </div>

      {/* Bottom panel */}
      <div style={{
        position: 'absolute', bottom: 82, left: 0, right: 0, top: 340,
        background: '#fff', borderRadius: '18px 18px 0 0',
        boxShadow: '0 -6px 22px rgba(0,0,0,.1)',
        display: 'flex', flexDirection: 'column',
        zIndex: arrived ? 1 : 5,
      }}>
        <div style={{ width: 36, height: 4, background: ECO_TOKENS.border, borderRadius: 999, margin: '8px auto 0' }}/>
        <div style={{ padding: '8px 18px 4px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: ECO_TOKENS.ink }}>Tu ruta</div>
          <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid }}>· {stops.length} paradas · 15 min</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: ECO_TOKENS.success, fontWeight: 600 }}>
            <Icon name="star" size={12}/> +{stops.length * 15} pts
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 14px' }}>
          {stops.map((s, i) => {
            const c = ECO_TOKENS.containers[s.container];
            const tip = bestHourTip(s.container);
            const isCurrent = i === 0;
            const hotNow = ECO_HOURLY[s.container][18] > 0.75;
            return (
              <div key={s.reportId} style={{
                padding: '10px 12px', marginBottom: 8, borderRadius: 12,
                background: isCurrent ? ECO_TOKENS.primaryTint : ECO_TOKENS.appBg,
                border: `1px solid ${isCurrent ? ECO_TOKENS.primary : ECO_TOKENS.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: isCurrent ? ECO_TOKENS.primary : '#fff',
                    color: isCurrent ? '#fff' : ECO_TOKENS.ink,
                    border: `1.5px solid ${isCurrent ? ECO_TOKENS.primary : ECO_TOKENS.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flex: '0 0 22px',
                  }}>{s.idx}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }}/>
                      <span style={{ fontSize: 13, fontWeight: 700, color: ECO_TOKENS.ink }}>{c.label}</span>
                      {isCurrent && (
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#fff',
                          background: ECO_TOKENS.primary, padding: '1px 7px', borderRadius: 4, letterSpacing: 0.3,
                        }}>EN CURSO</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, marginTop: 2 }}>
                      {s.addr} · {s.distance} · {s.eta}
                    </div>
                    {/* Tips */}
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {hotNow && (
                        <div style={{ fontSize: 11.5, color: ECO_TOKENS.danger, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Icon name="flame" size={11}/> Suele estar lleno a esta hora ({ECO_HOURLY[s.container][18] * 100 | 0}%)
                        </div>
                      )}
                      <div style={{ fontSize: 11.5, color: ECO_TOKENS.inkMid, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="clock" size={11}/> Mejor a las <strong style={{ color: ECO_TOKENS.ink }}>{String(tip.bestHour).padStart(2,'0')}:00</strong>
                      </div>
                      {i === 0 && (
                        <div style={{ fontSize: 11.5, color: ECO_TOKENS.warn, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Icon name="bell" size={11}/> Reporte de «lleno» hace 2h
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${ECO_TOKENS.border}`, display: 'flex', gap: 8 }}>
          <Button kind="ghost" size="md" icon={<Icon name="x" size={15}/>}>Cancelar</Button>
          <Button kind="primary" size="md" full
                  icon={<Icon name="locate" size={15}/>}
                  onClick={() => setArrived(stops[0])}>
            Empezar navegación
          </Button>
        </div>
      </div>

      {/* Banner (overlay) */}
      {arrived && (
        <BannerArrival stop={arrived} onDone={onDone} onSkip={() => setArrived(null)}/>
      )}
      {toast && <PointsToast points={toast}/>}

      {showSearch && <RouteSearchOverlay onClose={() => setShowSearch(false)}/>}
    </div>
  );
};

// Search overlay
const RouteSearchOverlay = ({ onClose }) => {
  const [q, setQ] = React.useState('');
  const results = [
    { container: 'envases',  addr: 'Calle del Pilar, 19',   area: 'Centro', dist: '180 m', tipBest: 21, hot: true },
    { container: 'organico', addr: 'Av. de Anaga, 22',      area: 'Anaga',  dist: '460 m', tipBest: 14, hot: false },
    { container: 'baterias', addr: 'Av. Tres de Mayo, 12',  area: 'Cabo',   dist: '720 m', tipBest: 10, hot: false, special: true },
    { container: 'aceite',   addr: 'C/ San Sebastián, 75',  area: 'Salud',  dist: '910 m', tipBest: 19, hot: false },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, background: ECO_TOKENS.appBg, zIndex: 60 }}>
      {/* search bar */}
      <div style={{ padding: '50px 14px 12px', background: '#fff', borderBottom: `1px solid ${ECO_TOKENS.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 6, color: ECO_TOKENS.ink, cursor: 'pointer' }}>
          <Icon name="arrow-l" size={20}/>
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: ECO_TOKENS.appBg, border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 10, padding: '8px 12px' }}>
          <Icon name="search" size={15} color={ECO_TOKENS.inkMid}/>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Calle, plaza o tipo de contenedor"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5, color: ECO_TOKENS.ink, fontFamily: 'inherit' }}/>
        </div>
      </div>

      {/* quick filters */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 6, overflowX: 'auto', background: '#fff', borderBottom: `1px solid ${ECO_TOKENS.border}` }}>
        <Chip label="Cerca de mí" active size="sm"/>
        {['envases', 'vidrio', 'papel', 'organico', 'baterias'].map(k => (
          <ContainerChip key={k} type={k} size="sm"/>
        ))}
      </div>

      {/* results */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ECO_TOKENS.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Contenedores cercanos
        </div>
        {results.map((r, i) => {
          const c = ECO_TOKENS.containers[r.container];
          return (
            <div key={i} style={{
              background: '#fff', border: `1px solid ${ECO_TOKENS.border}`, borderRadius: 12,
              padding: 12, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <Pin type={r.container} status="pendiente" size={28}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: ECO_TOKENS.ink }}>{c.label}</span>
                  {r.special && <Badge color={ECO_TOKENS.success} label="+15 pts" size="sm"/>}
                </div>
                <div style={{ fontSize: 12, color: ECO_TOKENS.inkMid, marginTop: 1 }}>{r.addr} · {r.dist}</div>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {r.hot && (
                    <div style={{ fontSize: 11, color: ECO_TOKENS.danger, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="flame" size={11}/> Reportado lleno hace 2h
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: ECO_TOKENS.inkMid, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="clock" size={11}/> Suele estar disponible a partir de las {String(r.tipBest).padStart(2,'0')}:00
                  </div>
                </div>
              </div>
              <Button kind="secondary" size="sm" icon={<Icon name="plus" size={13}/>}>Ruta</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, {
  BannerArrival, PointsToast, HourlyMini, CuentaPoints,
  ScreenRanking, ScreenRuta, RouteSearchOverlay,
});

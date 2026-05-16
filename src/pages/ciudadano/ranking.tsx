import { useState } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { ECO_LEADERBOARD, ECO_USER, LeaderboardEntry } from '@/lib/gamification';

const T = THEME;

// ---- Barrios mock ----
interface BarrioEntry {
  name: string;
  pts: number;
  members: number;
  isMe?: boolean;
}

const BARRIOS: BarrioEntry[] = [
  { name: 'Centro',       pts: 4280, members: 142 },
  { name: 'Salud',        pts: 3920, members: 118 },
  { name: 'Anaga',        pts: 3640, members: 97  },
  { name: 'Cabo-Llanos',  pts: 3380, members: 88  },
  { name: 'Ofra',         pts: 2970, members: 74  },
  { name: 'La Salle',     pts: 2710, members: 63  },
  { name: 'Ifara',        pts: 2180, members: 51  },
];

// My barrio: from ECO_USER if available, else hardcode "Centro"
const myBarrio: string = (ECO_USER as unknown as Record<string, unknown>).barrio as string ?? 'Centro';

const maxPts = BARRIOS[0].pts;

// ---- Podio top3 ----
function PodioCol({ entry, height, medal }: { entry: LeaderboardEntry; height: number; medal: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      flex: 1,
    }}>
      <div style={{ fontSize: 22 }}>{medal}</div>
      <div style={{
        width: 48, height: 48, borderRadius: 999,
        background: entry.avatar,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        border: '2px solid #fff',
      }}>
        {entry.initials}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.ink, textAlign: 'center', maxWidth: 72, lineHeight: 1.2 }}>
        {entry.name.split(' ')[0]}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>{entry.pts} pts</div>
      <div style={{
        width: '100%', height, borderRadius: '6px 6px 0 0',
        background: `linear-gradient(180deg, ${entry.avatar}CC 0%, ${entry.avatar} 100%)`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', opacity: 0.9 }}>#{entry.rank}</span>
      </div>
    </div>
  );
}

// ---- Fila de lista ----
function LeaderRow({ e }: { e: LeaderboardEntry }) {
  const isMe = !!e.isMe;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: isMe ? T.primaryTint : T.surface,
      borderLeft: isMe ? `3px solid ${T.primary}` : '3px solid transparent',
      borderBottom: `1px solid ${T.borderSoft}`,
    }}>
      {/* Rank */}
      <div style={{
        width: 26, textAlign: 'right',
        fontSize: 13, fontWeight: 700,
        color: e.rank <= 3 ? T.primary : T.inkMid,
        fontVariantNumeric: 'tabular-nums',
        flex: '0 0 26px',
      }}>
        {e.rank}
      </div>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 999,
        background: e.avatar, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 13, flex: '0 0 36px',
      }}>
        {e.initials}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, display: 'flex', alignItems: 'center', gap: 5 }}>
          {e.name}
          {isMe && <span style={{ fontSize: 10, fontWeight: 500, color: T.primary, background: T.primaryTint, padding: '1px 5px', borderRadius: 4 }}>· tú</span>}
        </div>
        <div style={{ fontSize: 11, color: T.inkMid }}>{e.barrio}</div>
      </div>
      {/* Pts + delta */}
      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
          {e.pts}
        </div>
        {e.delta !== 0 && (
          <div style={{ fontSize: 10.5, fontWeight: 600, color: e.delta > 0 ? T.success : T.danger }}>
            {e.delta > 0 ? `▲ ${e.delta}` : `▼ ${Math.abs(e.delta)}`}
          </div>
        )}
        {e.delta === 0 && <div style={{ fontSize: 10.5, color: T.inkLight }}>—</div>}
      </div>
    </div>
  );
}

export default function RankingPage() {
  const [tab, setTab] = useState<'mibarrio' | 'barrios'>('mibarrio');

  // Filter leaderboard to only my barrio
  const barrioEntries = ECO_LEADERBOARD.filter(e => e.barrio === myBarrio);
  const barrioTop3 = barrioEntries.slice(0, 3);
  const barrioRest = barrioEntries.slice(3);

  // CTA puntos para Top10 del barrio
  const barrioTop1pts = barrioEntries[0]?.pts ?? 0;
  const myPts = ECO_LEADERBOARD.find(e => e.isMe)?.pts ?? 0;
  const ptsToBarrioTop = barrioTop1pts - myPts;

  return (
    <CitizenLayout title="EcoChicharro · Ranking">
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        background: `linear-gradient(135deg, ${T.primaryDeep} 0%, ${T.primary} 60%, ${T.primarySoft} 100%)`,
        padding: '20px 16px 16px', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Icon name="trophy" size={22} color="#fff" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {tab === 'mibarrio' ? `Ranking · ${myBarrio}` : 'Ranking por barrios'}
            </div>
          </div>
          {tab === 'mibarrio' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,.18)', borderRadius: 999,
              padding: '3px 10px', fontSize: 11.5, fontWeight: 600,
            }}>
              <Icon name="pin" size={12} color="#fff" />
              {myBarrio}
            </div>
          )}
        </div>
        {/* Toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,.15)', borderRadius: 8,
          padding: 3, gap: 2,
        }}>
          {(['mibarrio', 'barrios'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? T.primary : 'rgba(255,255,255,.85)',
                fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t === 'mibarrio' ? 'Mi barrio' : 'Barrios'}
            </button>
          ))}
        </div>
      </div>

      {/* Body scrollable */}
      <div
        className="thin-scroll"
        style={{
          position: 'absolute', top: 152, left: 0, right: 0, bottom: NAV_HEIGHT,
          overflowY: 'auto',
        }}
      >
        {tab === 'mibarrio' && (
          <>
            {/* Podio */}
            {barrioTop3.length >= 3 && (
              <div style={{
                background: `linear-gradient(180deg, ${T.primaryDeep} 0%, ${T.primaryMist} 100%)`,
                padding: '16px 12px 0', display: 'flex', alignItems: 'flex-end', gap: 4,
              }}>
                <PodioCol entry={barrioTop3[1]} height={60} medal="🥈" />
                <PodioCol entry={barrioTop3[0]} height={90} medal="🥇" />
                <PodioCol entry={barrioTop3[2]} height={44} medal="🥉" />
              </div>
            )}

            {/* CTA */}
            {ptsToBarrioTop > 0 && (
              <div style={{
                margin: '12px 14px', padding: '10px 14px',
                background: T.primaryTint, border: `1px solid ${T.primary}40`,
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="star" size={16} color={T.primary} />
                <span style={{ fontSize: 13, color: T.primary, fontWeight: 600 }}>
                  Estás a <strong>{ptsToBarrioTop} puntos</strong> del líder de {myBarrio}
                </span>
              </div>
            )}

            {/* Lista resto del barrio */}
            <div style={{ background: T.surface }}>
              {barrioRest.map(e => <LeaderRow key={e.rank} e={e} />)}
            </div>
            <div style={{ height: 16 }} />
          </>
        )}

        {tab === 'barrios' && (
          <div style={{ padding: '14px 14px 0' }}>
            {BARRIOS.map((b, i) => {
              const isMyBarrio = b.name === myBarrio;
              const pct = Math.round((b.pts / maxPts) * 100);
              return (
                <div
                  key={b.name}
                  style={{
                    background: isMyBarrio ? T.primaryTint : T.surface,
                    border: `1px solid ${isMyBarrio ? T.primary : T.border}`,
                    borderRadius: 10, padding: '12px 14px', marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 999, background: T.primary,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flex: '0 0 28px',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                        {b.name}
                        {isMyBarrio && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500, color: T.primary, background: T.primaryTint, padding: '1px 5px', borderRadius: 4 }}>
                            · mi barrio
                          </span>
                        )}
                      </span>
                      <div style={{ fontSize: 11, color: T.inkMid }}>{b.members} vecinos participando</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
                      {b.pts.toLocaleString('es')} pts
                    </div>
                  </div>
                  {/* Barra */}
                  <div style={{ height: 6, background: T.border, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: isMyBarrio
                        ? `linear-gradient(90deg, ${T.primary}, ${T.primarySky})`
                        : T.inkLight,
                      borderRadius: 999,
                    }} />
                  </div>
                </div>
              );
            })}
            <div style={{ height: 16 }} />
          </div>
        )}
      </div>

      {/* My position sticky bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT,
        background: T.primary, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
        zIndex: 30,
      }}>
        <Icon name="trophy" size={14} color="#fff" />
        Tu posición esta semana: #{ECO_USER.rankWeekly} · {ECO_USER.weeklyPoints} pts
      </div>
    </CitizenLayout>
  );
}

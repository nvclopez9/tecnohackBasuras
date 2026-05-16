import { useState, useEffect } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { LeaderboardData, LeaderboardEntry, BarrioRankEntry } from '@/types';

const T = THEME;

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 48 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.33,
      boxShadow: '0 2px 8px rgba(0,0,0,.18)',
      border: '2px solid #fff',
      flex: `0 0 ${size}px`,
    }}>
      {initials}
    </div>
  );
}

// ── Podio ─────────────────────────────────────────────────────────────────────

function PodioCol({ entry, height, medal }: { entry: LeaderboardEntry; height: number; medal: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{ fontSize: 22 }}>{medal}</div>
      <Avatar initials={entry.initials} color={entry.avatar} size={48} />
      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', textAlign: 'center', maxWidth: 72, lineHeight: 1.2 }}>
        {entry.name.split(' ')[0]}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.9)' }}>{entry.pts} pts</div>
      <div style={{
        width: '100%', height, borderRadius: '6px 6px 0 0',
        background: 'rgba(255,255,255,.18)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', opacity: 0.9 }}>#{entry.rank}</span>
      </div>
    </div>
  );
}

// ── Fila lista ────────────────────────────────────────────────────────────────

function LeaderRow({ e }: { e: LeaderboardEntry }) {
  const isMe = e.isMe;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: isMe ? T.primaryTint : '#fff',
      borderLeft: isMe ? `3px solid ${T.primary}` : '3px solid transparent',
      borderBottom: `1px solid ${T.borderSoft}`,
    }}>
      <div style={{
        width: 26, textAlign: 'right', fontSize: 13, fontWeight: 700,
        color: e.rank <= 3 ? T.primary : T.inkMid,
        fontVariantNumeric: 'tabular-nums', flex: '0 0 26px',
      }}>{e.rank}</div>
      <Avatar initials={e.initials} color={e.avatar} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, display: 'flex', alignItems: 'center', gap: 5 }}>
          {e.name}
          {isMe && (
            <span style={{ fontSize: 10, fontWeight: 500, color: T.primary, background: T.primaryTint, padding: '1px 5px', borderRadius: 4 }}>
              · tú
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.inkMid }}>{e.barrio}</div>
      </div>
      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
          {e.pts.toLocaleString('es')}
        </div>
        {e.delta > 0 && <div style={{ fontSize: 10.5, fontWeight: 600, color: T.success }}>▲ {e.delta}</div>}
        {e.delta < 0 && <div style={{ fontSize: 10.5, fontWeight: 600, color: T.danger }}>▼ {Math.abs(e.delta)}</div>}
        {e.delta === 0 && <div style={{ fontSize: 10.5, color: T.inkLight }}>—</div>}
      </div>
    </div>
  );
}

// ── Barrio card ───────────────────────────────────────────────────────────────

function BarrioCard({ b, i, isMyBarrio, maxPts }: { b: BarrioRankEntry; i: number; isMyBarrio: boolean; maxPts: number }) {
  const pct = maxPts > 0 ? Math.round((b.pts / maxPts) * 100) : 0;
  return (
    <div style={{
      background: isMyBarrio ? T.primaryTint : '#fff',
      border: `1px solid ${isMyBarrio ? T.primary : T.border}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999, background: i < 3 ? T.primary : T.inkLight,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flex: '0 0 28px',
        }}>{i + 1}</div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
            {b.name}
            {isMyBarrio && (
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500, color: T.primary, background: T.primaryTint, padding: '1px 5px', borderRadius: 4 }}>
                · mi barrio
              </span>
            )}
          </span>
          <div style={{ fontSize: 11, color: T.inkMid }}>{b.members} vecino{b.members !== 1 ? 's' : ''} participando</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
          {b.pts.toLocaleString('es')} pts
        </div>
      </div>
      <div style={{ height: 6, background: T.border, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 999,
          background: isMyBarrio
            ? `linear-gradient(90deg, ${T.primary}, ${T.primarySky})`
            : T.inkLight,
        }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RankingPage() {
  const [tab, setTab] = useState<'mibarrio' | 'barrios'>('mibarrio');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then((d: LeaderboardData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const myBarrio = data?.myBarrio ?? 'Centro';

  // Entries for "mi barrio" tab: same barrio + global top3 always visible
  const barrioEntries = data
    ? data.entries.filter(e => e.barrio === myBarrio)
    : [];
  const top3 = barrioEntries.slice(0, 3);
  const rest = barrioEntries.slice(3);

  const barrioTop1pts = top3[0]?.pts ?? 0;
  const myPts = data?.myPts ?? 0;
  const ptsToTop = barrioTop1pts - myPts;

  const maxBarrioPts = data?.barrios[0]?.pts ?? 1;

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
          display: 'flex', background: 'rgba(255,255,255,.15)',
          borderRadius: 8, padding: 3, gap: 2,
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

      {/* Body */}
      <div className="thin-scroll" style={{
        position: 'absolute', top: 152, left: 0, right: 0,
        bottom: NAV_HEIGHT + 40, overflowY: 'auto',
      }}>
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: T.inkMid, fontSize: 13 }}>
            Cargando ranking…
          </div>
        )}

        {!loading && tab === 'mibarrio' && (
          <>
            {/* Podio top 3 del barrio */}
            {top3.length >= 3 && (
              <div style={{
                background: `linear-gradient(180deg, ${T.primaryDeep} 0%, ${T.primaryMist} 100%)`,
                padding: '16px 12px 0', display: 'flex', alignItems: 'flex-end', gap: 4,
              }}>
                <PodioCol entry={top3[1]} height={60} medal="🥈" />
                <PodioCol entry={top3[0]} height={90} medal="🥇" />
                <PodioCol entry={top3[2]} height={44} medal="🥉" />
              </div>
            )}
            {top3.length > 0 && top3.length < 3 && (
              <div style={{ padding: '12px 14px 0', background: `linear-gradient(180deg, ${T.primaryDeep} 0%, ${T.primaryMist} 100%)` }}>
                {top3.map(e => <LeaderRow key={e.rank} e={e} />)}
              </div>
            )}

            {/* CTA puntos */}
            {ptsToTop > 0 && (
              <div style={{
                margin: '12px 14px', padding: '10px 14px',
                background: T.primaryTint, border: `1px solid ${T.primary}40`,
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="star" size={16} color={T.primary} />
                <span style={{ fontSize: 13, color: T.primary, fontWeight: 600 }}>
                  Estás a <strong>{ptsToTop.toLocaleString('es')} pts</strong> del líder de {myBarrio}
                </span>
              </div>
            )}
            {ptsToTop <= 0 && barrioEntries.length > 0 && (
              <div style={{
                margin: '12px 14px', padding: '10px 14px',
                background: '#E8F5E9', border: '1px solid #A5D6A7',
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>🏆</span>
                <span style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>
                  ¡Eres la líder de {myBarrio}!
                </span>
              </div>
            )}

            {/* Lista resto */}
            <div style={{ background: '#fff' }}>
              {rest.map(e => <LeaderRow key={e.rank} e={e} />)}
            </div>

            {barrioEntries.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: T.inkMid, fontSize: 13 }}>
                Aún no hay participantes en {myBarrio}.
              </div>
            )}
            <div style={{ height: 16 }} />
          </>
        )}

        {!loading && tab === 'barrios' && (
          <div style={{ padding: '14px 14px 0' }}>
            {data?.barrios.map((b, i) => (
              <BarrioCard
                key={b.name}
                b={b}
                i={i}
                isMyBarrio={b.name === myBarrio}
                maxPts={maxBarrioPts}
              />
            ))}
            <div style={{ height: 16 }} />
          </div>
        )}
      </div>

      {/* My position sticky bar */}
      {data && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT,
          background: T.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '8px 16px', fontSize: 12.5, fontWeight: 600, zIndex: 30,
        }}>
          <Icon name="trophy" size={14} color="#fff" />
          Tu posición: #{data.myRank} de {data.entries.length} · {data.myPts.toLocaleString('es')} pts
        </div>
      )}
    </CitizenLayout>
  );
}

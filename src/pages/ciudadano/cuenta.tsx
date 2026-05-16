import { useRouter } from 'next/router';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon, IconName } from '@/components/ui/Icon';
import { useMe } from '@/hooks/useMe';
import { clearRole } from '@/lib/storage';
import { THEME } from '@/lib/theme';
import { ECO_USER } from '@/lib/gamification';

const T = THEME;

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function CuentaPage() {
  const router = useRouter();
  const { user, stats } = useMe();

  const enviadas = stats?.enviadas ?? 0;
  const resueltas = stats?.resueltas ?? 0;
  const pct = enviadas > 0 ? Math.round((resueltas / enviadas) * 100) : 0;

  const logout = () => {
    clearRole();
    router.push('/');
  };

  return (
    <CitizenLayout title="EcoChicharro · Cuenta">
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '24px 16px 26px',
        background: `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
        color: '#fff', borderRadius: '0 0 18px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 999, background: 'rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 21, fontWeight: 700, border: '2px solid rgba(255,255,255,.4)',
          }}>
            {user ? initials(user.displayName) : '··'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>
              {user?.displayName ?? 'Cargando…'}
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>
              Vecina de Santa Cruz de Tenerife
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,.18)',
                fontSize: 11, fontWeight: 600,
              }}>
                <Icon name="leaf" size={12} color="#fff" /> Vecina colaboradora
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,.15)',
                fontSize: 11, fontWeight: 600, color: '#fff',
                border: '1px solid rgba(255,255,255,.25)',
              }}>
                <Icon name="pin" size={11} color="#fff" /> Centro
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="thin-scroll" style={{ position: 'absolute', inset: `158px 0 ${NAV_HEIGHT}px 0`, overflowY: 'auto', padding: 16 }}>
        {/* CuentaPoints */}
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          {/* Fila superior: puntos + semana + ranking */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {ECO_USER.totalPoints.toLocaleString('es')}
              </div>
              <div style={{ fontSize: 12, color: T.inkMid, marginTop: 2 }}>puntos totales</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.success, marginTop: 3 }}>
                +{ECO_USER.weeklyPoints} esta sem.
              </div>
            </div>
            <div style={{
              background: T.primaryTint, border: `1px solid ${T.primary}40`,
              borderRadius: 10, padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="trophy" size={16} color={T.primary} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.primary }}>#{ECO_USER.rankWeekly}</div>
                <div style={{ fontSize: 10, color: T.primary, opacity: 0.8 }}>de la sem.</div>
              </div>
            </div>
          </div>

          {/* Barra siguiente nivel */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>Nivel {ECO_USER.level} · {ECO_USER.levelLabel}</span>
              <span style={{ fontSize: 11.5, color: T.inkMid }}>{ECO_USER.pointsToNext} pts para nivel {ECO_USER.level + 1}</span>
            </div>
            <div style={{ height: 7, background: T.border, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round((1 - ECO_USER.pointsToNext / 500) * 100)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${T.primary}, ${T.primarySky})`,
                borderRadius: 999,
              }} />
            </div>
          </div>

          {/* Racha */}
          <div style={{
            background: '#FFF3E0', border: '1px solid #FFD180', borderRadius: 8,
            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E65100' }}>
              {ECO_USER.streak} días seguidos reciclando
            </span>
          </div>

          {/* Desglose semanal */}
          <div style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
              Desglose semanal
            </div>
            {ECO_USER.thisWeekBreakdown.map(b => (
              <div key={b.label} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: b.color, flex: '0 0 8px' }} />
                <span style={{ flex: 1, fontSize: 13, color: T.ink }}>{b.label}</span>
                <span style={{ fontSize: 12, color: T.inkMid }}>×{b.count}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: b.color, width: 56, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  +{b.count * b.each} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>Enviadas</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{enviadas}</div>
            <div style={{ fontSize: 11, color: T.inkMid }}>incidencias reportadas</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>Resueltas</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: T.success, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{resueltas}</div>
            <div style={{ fontSize: 11, color: T.inkMid }}>{pct}% de tus reportes</div>
            <div style={{ marginTop: 6, height: 5, borderRadius: 4, background: T.border, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: T.success }} />
            </div>
          </div>
        </div>

        {/* Estado actual */}
        <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>
            Estado de tus incidencias
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Pendientes', value: stats?.pendientes ?? 0, color: T.warn },
              { label: 'En proceso', value: stats?.enProceso ?? 0, color: T.primary },
              { label: 'Resueltas', value: resueltas, color: T.success },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', background: T.appBg, borderRadius: 10, padding: '10px 4px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                <div style={{ fontSize: 10.5, color: T.inkMid, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {([
            { i: 'pin', label: 'Mi barrio', sub: 'Centro' },
            { i: 'bell', label: 'Notificaciones', sub: 'Activas para tus reportes' },
            { i: 'globe', label: 'Idioma', sub: 'Español' },
            { i: 'help', label: 'Ayuda y soporte' },
          ] as { i: IconName; label: string; sub?: string }[]).map((it, i, a) => (
            <div key={it.label} style={{
              padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i === a.length - 1 ? 'none' : `1px solid ${T.borderSoft}`, cursor: 'pointer',
            }}>
              <span style={{ color: T.primary }}><Icon name={it.i} size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>{it.label}</div>
                {it.sub && <div style={{ fontSize: 11.5, color: T.inkMid, marginTop: 1 }}>{it.sub}</div>}
              </div>
              <Icon name="chevron-r" size={16} color={T.inkLight} />
            </div>
          ))}
        </div>

        <Button kind="danger" full size="md" icon={<Icon name="logout" size={15} />} style={{ marginTop: 14 }} onClick={logout}>
          Cerrar sesión
        </Button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: T.inkLight }}>
          EcoChicharro · Cabildo de Tenerife
        </div>
      </div>
    </CitizenLayout>
  );
}

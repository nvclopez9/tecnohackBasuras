import { useRouter } from 'next/router';
import { THEME } from '@/lib/theme';
import { Icon, IconName } from '@/components/ui/Icon';

const T = THEME;

interface Tab {
  id: string;
  icon: IconName;
  label: string;
  href: string;
  center?: boolean;
}

const TABS: Tab[] = [
  { id: 'home', icon: 'home', label: 'Inicio', href: '/ciudadano' },
  { id: 'ranking', icon: 'trophy', label: 'Ranking', href: '/ciudadano/ranking' },
  { id: 'reportar', icon: 'camera', label: 'Reportar', href: '/ciudadano/reportar', center: true },
  { id: 'incidencias', icon: 'list', label: 'Reportes', href: '/ciudadano/incidencias' },
  { id: 'cuenta', icon: 'user', label: 'Cuenta', href: '/ciudadano/cuenta' },
];

function activeId(pathname: string): string {
  if (pathname.startsWith('/ciudadano/ranking')) return 'ranking';
  if (pathname.startsWith('/ciudadano/reportar')) return 'reportar';
  if (pathname.startsWith('/ciudadano/incidencias')) return 'incidencias';
  if (pathname.startsWith('/ciudadano/cuenta')) return 'cuenta';
  return 'home';
}

export default function BottomNav() {
  const router = useRouter();
  const active = activeId(router.pathname);

  return (
    <nav
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
        borderTop: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 -4px 24px rgba(0,16,56,0.16)',
        paddingBottom: 16,
        display: 'flex',
        zIndex: 50,
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        const textColor = isActive ? '#ffffff' : 'rgba(255,255,255,0.72)';
        const iconSize = t.center ? (isActive ? 28 : 24) : isActive ? 24 : 22;
        return (
          <button
            key={t.id}
            onClick={() => router.push(t.href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '10px 4px 4px', background: 'transparent', border: 'none',
              cursor: 'pointer', color: textColor, position: 'relative',
              transition: 'opacity 0.15s',
            }}
          >
            {t.center ? (
              <span
                style={{
                  width: 48, height: 48, borderRadius: 999,
                  background: isActive ? '#0f59a5' : '#0b4a8c',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -18, boxShadow: '0 6px 18px rgba(0,60,120,0.28)',
                  border: '3px solid rgba(255,255,255,0.9)',
                  transition: 'transform 0.2s ease, background 0.2s',
                  transform: isActive ? 'translateY(-1px) scale(1.04)' : 'none',
                }}
              >
                <Icon name={t.icon} size={iconSize} color="#fff" />
              </span>
            ) : (
              <span style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 28,
                transition: 'transform 0.2s ease',
                transform: isActive ? 'translateY(-2px)' : 'none',
              }}>
                {/* Active pill background */}
                {isActive && (
                  <span style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 14, background: 'rgba(255,255,255,0.18)',
                  }} />
                )}
                <Icon name={t.icon} size={iconSize} color="#fff" />
              </span>
            )}
            <span style={{
              fontSize: 10.5, fontWeight: isActive ? 700 : 500,
              color: textColor, marginTop: t.center ? -4 : 0,
              transition: 'font-weight 0.15s',
            }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

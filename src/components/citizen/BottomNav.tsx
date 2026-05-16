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
  { id: 'reportar', icon: 'camera', label: 'Reportar', href: '/ciudadano/reportar', center: true },
  { id: 'incidencias', icon: 'list', label: 'Mis reportes', href: '/ciudadano/incidencias' },
  { id: 'cuenta', icon: 'user', label: 'Cuenta', href: '/ciudadano/cuenta' },
];

function activeId(pathname: string): string {
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
        const iconColor = '#ffffff';
        const textColor = isActive ? '#ffffff' : 'rgba(255,255,255,0.78)';
        const iconSize = t.center ? (isActive ? 28 : 24) : isActive ? 26 : 22;
        return (
          <button
            key={t.id}
            onClick={() => router.push(t.href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '10px 4px 6px', background: 'transparent', border: 'none',
              cursor: 'pointer', color: textColor,
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
                }}
              >
                <Icon name={t.icon} size={iconSize} color={iconColor} />
              </span>
            ) : (
              <Icon name={t.icon} size={iconSize} color={iconColor} />
            )}
            <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, color: textColor, marginTop: t.center ? -4 : 0 }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

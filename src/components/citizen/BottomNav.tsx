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
        background: '#fff',
        borderTop: `1px solid ${T.border}`,
        boxShadow: '0 -2px 12px rgba(0,0,0,.04)',
        paddingBottom: 16,
        display: 'flex',
        zIndex: 50,
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        const color = isActive ? T.primary : T.inkMid;
        return (
          <button
            key={t.id}
            onClick={() => router.push(t.href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '8px 4px 4px', background: 'transparent', border: 'none',
              cursor: 'pointer', color,
            }}
          >
            {t.center ? (
              <span
                style={{
                  width: 44, height: 44, borderRadius: 999,
                  background: isActive ? T.primaryDark : T.primary,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -16, boxShadow: '0 4px 12px rgba(0,90,156,.32)',
                  border: '3px solid #fff',
                }}
              >
                <Icon name={t.icon} size={22} />
              </span>
            ) : (
              <Icon name={t.icon} size={22} color={color} />
            )}
            <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, color, marginTop: t.center ? -2 : 0 }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

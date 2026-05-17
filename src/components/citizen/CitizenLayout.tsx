import { ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getRole } from '@/lib/storage';
import BottomNav from './BottomNav';

// Altura ocupada por la barra inferior (icono + safe area).
export const NAV_HEIGHT = 80;

interface Props {
  children: ReactNode;
  title?: string;
  hideNav?: boolean;
}

const AUTH_ROUTES = ['/ciudadano/login', '/ciudadano/register'];

// Same order as BottomNav TABS
const SWIPE_ROUTES = [
  '/ciudadano',
  '/ciudadano/ranking',
  '/ciudadano/reportar',
  '/ciudadano/incidencias',
  '/ciudadano/cuenta',
];

function currentTabIndex(pathname: string): number {
  if (pathname.startsWith('/ciudadano/cuenta')) return 4;
  if (pathname.startsWith('/ciudadano/incidencias')) return 3;
  if (pathname.startsWith('/ciudadano/reportar')) return 2;
  if (pathname.startsWith('/ciudadano/ranking')) return 1;
  return 0;
}

export default function CitizenLayout({ children, title = 'EcoChicharro', hideNav = false }: Props) {
  const router = useRouter();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    if (AUTH_ROUTES.some(r => router.pathname.startsWith(r))) return;
    if (getRole() !== 'ciudadano') router.replace('/ciudadano/login');
  }, [router]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Require a strongly horizontal swipe (|dx| > 72, |dx| > 2×|dy|)
    if (Math.abs(dx) < 72 || Math.abs(dy) * 2 > Math.abs(dx)) return;
    // Don't swipe if started on a Leaflet map element
    const target = e.target as HTMLElement;
    if (target.closest('.leaflet-container')) return;
    const cur = currentTabIndex(router.pathname);
    if (dx < 0 && cur < SWIPE_ROUTES.length - 1) {
      router.push(SWIPE_ROUTES[cur + 1]);
    } else if (dx > 0 && cur > 0) {
      router.push(SWIPE_ROUTES[cur - 1]);
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
      </Head>
      <div
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', justifyContent: 'center',
          background: '#dde4ea',
        }}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'relative',
            width: '100%', maxWidth: 480, height: '100%',
            background: 'var(--app-bg)',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0,0,0,.12)',
            willChange: 'transform',
          }}
        >
          {children}
          {!hideNav && <BottomNav />}
        </div>
      </div>
    </>
  );
}

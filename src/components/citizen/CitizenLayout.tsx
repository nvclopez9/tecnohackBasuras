import { ReactNode, useEffect } from 'react';
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

export default function CitizenLayout({ children, title = 'EcoChicharro', hideNav = false }: Props) {
  const router = useRouter();

  useEffect(() => {
    // Never redirect from auth pages — they handle their own flow
    if (AUTH_ROUTES.some(r => router.pathname.startsWith(r))) return;
    if (getRole() !== 'ciudadano') router.replace('/ciudadano/login');
  }, [router]);

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
          style={{
            position: 'relative',
            width: '100%', maxWidth: 480, height: '100%',
            background: 'var(--app-bg)',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0,0,0,.12)',
          }}
        >
          {children}
          {!hideNav && <BottomNav />}
        </div>
      </div>
    </>
  );
}

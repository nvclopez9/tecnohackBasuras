import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { setRole } from '@/lib/storage';
import { Role } from '@/types';

export default function RoleSelectorPage() {
  const router = useRouter();

  const choose = useCallback(
    (role: Role) => {
      setRole(role);
      router.push(role === 'ciudadano' ? '/ciudadano' : '/municipal');
    },
    [router]
  );

  return (
    <>
      <Head>
        <title>EcoChicharro</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta
          name="description"
          content="Gestión de incidencias en contenedores de basura"
        />
      </Head>
      <main
        style={{
          width: '100vw',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background:
            'radial-gradient(circle at 50% 0%, #16213e, #1a1a2e 70%)',
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>♻️</div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '0.3rem',
          }}
        >
          EcoChicharro
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.95rem',
            textAlign: 'center',
            marginBottom: '2.5rem',
            maxWidth: '320px',
          }}
        >
          Reporta y gestiona incidencias en los contenedores de basura de tu
          ciudad
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            maxWidth: '360px',
          }}
        >
          <RoleCard
            emoji="📷"
            title="Soy ciudadano"
            subtitle="Reportar un contenedor con problemas"
            accent="#3a9d4a"
            onClick={() => choose('ciudadano')}
          />
          <RoleCard
            emoji="🛠️"
            title="Soy personal municipal"
            subtitle="Gestionar y resolver los reportes"
            accent="#2f6fb0"
            onClick={() => choose('municipal')}
          />
        </div>
      </main>
    </>
  );
}

function RoleCard({
  emoji,
  title,
  subtitle,
  accent,
  onClick,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.2rem',
        background: '#16213e',
        border: `2px solid ${accent}55`,
        borderLeft: `5px solid ${accent}`,
        borderRadius: '14px',
        color: '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        touchAction: 'manipulation',
      }}
    >
      <span style={{ fontSize: '2rem' }}>{emoji}</span>
      <span>
        <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 700 }}>
          {title}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {subtitle}
        </span>
      </span>
    </button>
  );
}

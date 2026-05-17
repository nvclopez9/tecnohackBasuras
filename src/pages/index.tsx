import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ciudadano/login');
  }, [router]);

  return (
    <>
      <Head>
        <title>EcoChicharro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Gestión de incidencias en contenedores de basura · Ayuntamiento de Santa Cruz de Tenerife" />
      </Head>
      <div style={{ position: 'fixed', inset: 0, background: '#F6F8FA' }} />
    </>
  );
}

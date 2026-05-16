import Head from 'next/head';
import { useRouter } from 'next/router';
import { setRole } from '@/lib/storage';
import { THEME } from '@/lib/theme';
import { Icon } from '@/components/ui/Icon';
import { Role } from '@/types';

const T = THEME;

export default function LandingPage() {
  const router = useRouter();

  const choose = (role: Role) => {
    setRole(role);
    router.push(role === 'ciudadano' ? '/ciudadano' : '/municipal');
  };

  return (
    <>
      <Head>
        <title>EcoChicharro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Gestión de incidencias en contenedores de basura · Cabildo de Tenerife" />
      </Head>
      <main
        style={{
          position: 'fixed', inset: 0, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 20px',
          background: `linear-gradient(165deg, ${T.primaryMist} 0%, ${T.appBg} 55%)`,
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: T.primary,
              color: '#fff', fontWeight: 700, fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>Ec</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>EcoChicharro</div>
              <div style={{ fontSize: 11.5, color: T.inkMid, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Cabildo de Tenerife
              </div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.5, margin: '12px 0 28px' }}>
            Gestión ciudadana de incidencias en los contenedores de basura de Santa Cruz de Tenerife.
          </p>

          {/* Role cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <RoleCard
              icon="camera"
              title="Soy ciudadano"
              subtitle="Reporta contenedores con problemas desde el móvil"
              onClick={() => choose('ciudadano')}
            />
            <RoleCard
              icon="cluster"
              title="Soy personal municipal"
              subtitle="Gestiona y analiza las incidencias en el panel de escritorio"
              onClick={() => choose('municipal')}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: 26, fontSize: 11, color: T.inkLight }}>
            EcoChicharro · Hackathon · Santa Cruz de Tenerife
          </div>
        </div>
      </main>
    </>
  );
}

function RoleCard({
  icon, title, subtitle, onClick,
}: { icon: 'camera' | 'cluster'; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 16,
        background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14,
        cursor: 'pointer', textAlign: 'left', width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <span style={{
        width: 46, height: 46, borderRadius: 11, background: T.primaryTint, color: T.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 46px',
      }}>
        <Icon name={icon} size={22} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: T.ink }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: T.inkMid, marginTop: 2, lineHeight: 1.4 }}>{subtitle}</span>
      </span>
      <Icon name="chevron-r" size={18} color={T.inkLight} />
    </button>
  );
}

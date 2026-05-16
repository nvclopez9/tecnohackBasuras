import { useRouter } from 'next/router';
import CitizenLayout from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { setRole } from '@/lib/storage';
import { THEME } from '@/lib/theme';

const T = THEME;

const BARRIOS = [
  'Centro', 'Anaga', 'Salud', 'Cabo-Llanos',
  'Ofra', 'La Salle', 'Ifara', 'El Sobradillo', 'Rambla', 'Weyler',
];

export default function RegisterPage() {
  const router = useRouter();

  const handleRegister = () => {
    setRole('ciudadano');
    router.push('/ciudadano');
  };

  return (
    <CitizenLayout title="EcoChicharro · Crear cuenta">
      <div style={{
        position: 'absolute', inset: 0,
        background: T.appBg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
        overflowY: 'auto',
      }}>
        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: T.primary,
            color: '#fff', fontWeight: 700, fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>Ec</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>EcoChicharro</div>
            <div style={{ fontSize: 11.5, color: T.inkMid, letterSpacing: 0.4 }}>Santa Cruz de Tenerife</div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 380,
          background: '#fff', border: `1px solid ${T.border}`,
          borderRadius: 16, padding: '28px 24px',
          boxShadow: '0 4px 24px rgba(0,0,0,.07)',
          marginTop: 24,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Crear cuenta</div>
          <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 24 }}>
            {'Ún'}ete a la comunidad recicladora
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, display: 'block', marginBottom: 6 }}>
              Nombre completo
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 12px', background: T.appBg,
            }}>
              <Icon name="user" size={16} color={T.inkMid} />
              <input
                type="text"
                placeholder="Tu nombre"
                style={{
                  border: 'none', outline: 'none', flex: 1,
                  fontSize: 14, color: T.ink, background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, display: 'block', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 12px', background: T.appBg,
            }}>
              <Icon name="globe" size={16} color={T.inkMid} />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                style={{
                  border: 'none', outline: 'none', flex: 1,
                  fontSize: 14, color: T.ink, background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, display: 'block', marginBottom: 6 }}>
              Contraseña
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 12px', background: T.appBg,
            }}>
              <Icon name="flash" size={16} color={T.inkMid} />
              <input
                type="password"
                placeholder="••••••••"
                style={{
                  border: 'none', outline: 'none', flex: 1,
                  fontSize: 14, color: T.ink, background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Barrio */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, display: 'block', marginBottom: 6 }}>
              Tu barrio
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 12px', background: T.appBg,
            }}>
              <Icon name="pin" size={16} color={T.inkMid} />
              <select
                defaultValue="Centro"
                style={{
                  border: 'none', outline: 'none', flex: 1,
                  fontSize: 14, color: T.ink, background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {BARRIOS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Register button */}
          <Button kind="primary" size="md" full onClick={handleRegister}>
            Crear cuenta
          </Button>

          {/* Iniciar sesión link */}
          <div style={{ textAlign: 'center', fontSize: 13.5, color: T.inkMid, marginTop: 16 }}>
            {'¿Ya tienes cuenta? '}
            <button
              onClick={() => router.push('/ciudadano/login')}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: T.primary, fontWeight: 700, fontSize: 13.5,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* Nota legal */}
        <div style={{ marginTop: 16, fontSize: 11, color: T.inkLight, textAlign: 'center', maxWidth: 320 }}>
          Al registrarte aceptas los términos del servicio · Cabildo de Tenerife
        </div>
      </div>
    </CitizenLayout>
  );
}

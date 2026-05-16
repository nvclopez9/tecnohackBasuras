import { useState } from 'react';
import { useRouter } from 'next/router';
import CitizenLayout from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { setRole } from '@/lib/storage';
import { THEME } from '@/lib/theme';

const T = THEME;

export default function LoginPage() {
  const router = useRouter();
  const [email] = useState('maria@ecochicharro.es');
  const [password] = useState('••••••••');

  const handleLogin = () => {
    setRole('ciudadano');
    router.push('/ciudadano');
  };

  return (
    <CitizenLayout title="EcoChicharro · Iniciar sesión">
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
          <div style={{ fontSize: 20, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Iniciar sesión</div>
          <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 24 }}>Bienvenida de nuevo</div>

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
              <Icon name="user" size={16} color={T.inkMid} />
              <input
                type="email"
                defaultValue={email}
                style={{
                  border: 'none', outline: 'none', flex: 1,
                  fontSize: 14, color: T.ink, background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 22 }}>
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
                defaultValue={password}
                style={{
                  border: 'none', outline: 'none', flex: 1,
                  fontSize: 14, color: T.ink, background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Login button */}
          <Button kind="primary" size="md" full onClick={handleLogin}>
            Iniciar sesión
          </Button>

          {/* Separador */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: '18px 0', color: T.inkLight, fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            o
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* Crear cuenta */}
          <div style={{ textAlign: 'center', fontSize: 13.5, color: T.inkMid }}>
            {'¿No tienes cuenta? '}
            <button
              onClick={() => router.push('/ciudadano/register')}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: T.primary, fontWeight: 700, fontSize: 13.5,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Crear cuenta
            </button>
          </div>
        </div>

        {/* Nota demo */}
        <div style={{ marginTop: 20, fontSize: 11, color: T.inkLight, textAlign: 'center' }}>
          Demo EcoChicharro · Hackathon TechTenerife 2025
        </div>
      </div>
    </CitizenLayout>
  );
}

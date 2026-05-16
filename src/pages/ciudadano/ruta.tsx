import { useRouter } from 'next/router';
import { useState } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button, ContainerChip } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { containerMeta, CONTAINERS } from '@/lib/constants';
import { ECO_HOURLY, bestHourTip } from '@/lib/gamification';
import { ContainerType } from '@/types';

const T = THEME;

interface Stop {
  num: number;
  type: ContainerType;
  address: string;
  distM: number;
  etaMin: number;
  active?: boolean;
}

const STOPS: Stop[] = [
  { num: 1, type: 'envases',  address: 'Calle Castillo, 47',       distM: 120, etaMin: 2, active: true },
  { num: 2, type: 'vidrio',   address: 'Rambla 25 Julio, 8',       distM: 380, etaMin: 5 },
  { num: 3, type: 'papel',    address: 'Plaza del Príncipe, s/n',   distM: 620, etaMin: 8 },
];

// Mock search results
interface SearchResult {
  id: string;
  type: ContainerType;
  address: string;
  distM: number;
}

const SEARCH_RESULTS: SearchResult[] = [
  { id: 'bin-organico-01', type: 'organico', address: 'Av. de Anaga, 12',       distM: 85  },
  { id: 'bin-vidrio-02',   type: 'vidrio',   address: 'Calle Méndez Núñez, 5', distM: 210 },
  { id: 'bin-papel-03',    type: 'papel',    address: 'Paseo del Tomé, 3',      distM: 340 },
  { id: 'bin-envases-04',  type: 'envases',  address: 'Calle Imeldo Serís, 9', distM: 475 },
];

function StopCard({ stop }: { stop: Stop }) {
  const meta = containerMeta(stop.type);
  const hourlyData = ECO_HOURLY[stop.type] ?? ECO_HOURLY.resto;
  const currentHour = new Date().getHours();
  const currentSat = hourlyData[currentHour];
  const hotNow = currentSat > 0.75;
  const { bestHour } = bestHourTip(stop.type);

  return (
    <div style={{
      background: stop.active ? T.primaryTint : T.surface,
      border: `1px solid ${stop.active ? T.primary : T.border}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Número */}
        <div style={{
          width: 28, height: 28, borderRadius: 999,
          background: stop.active ? T.primary : T.border,
          color: stop.active ? '#fff' : T.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flex: '0 0 28px',
        }}>
          {stop.num}
        </div>
        {/* Dot color */}
        <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, flex: '0 0 8px' }} />
        {/* Tipo y dir */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>
            {meta.label}
            {stop.active && (
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                background: T.primary, color: '#fff', padding: '2px 6px', borderRadius: 4,
                textTransform: 'uppercase',
              }}>
                EN CURSO
              </span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: T.inkMid }}>{stop.address}</div>
        </div>
        {/* Distancia y eta */}
        <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{stop.distM}m</div>
          <div style={{ fontSize: 11, color: T.inkMid }}>{stop.etaMin} min</div>
        </div>
      </div>

      {/* Avisos */}
      {hotNow && (
        <div style={{
          marginTop: 8, padding: '5px 8px',
          background: T.danger + '15', borderRadius: 6,
          fontSize: 11.5, color: T.danger, display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Icon name="flame" size={12} color={T.danger} />
          Suele estar lleno a esta hora
        </div>
      )}
      <div style={{
        marginTop: hotNow ? 4 : 8, padding: '5px 8px',
        background: T.appBg, borderRadius: 6,
        fontSize: 11.5, color: T.inkMid, display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <Icon name="clock" size={12} color={T.inkMid} />
        Mejor a las {String(bestHour).padStart(2, '0')}:00
      </div>
    </div>
  );
}

interface RouteSearchOverlayProps {
  onClose: () => void;
}

function RouteSearchOverlay({ onClose }: RouteSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContainerType | null>(null);

  const filtered = SEARCH_RESULTS.filter(r => {
    const matchType = !typeFilter || r.type === typeFilter;
    const matchQuery = !query || r.address.toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        background: T.surface, borderRadius: '20px 20px 0 0',
        padding: '16px 16px 32px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: T.border, borderRadius: 999, margin: '0 auto 14px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Añadir parada</div>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.appBg, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '9px 12px', marginBottom: 12,
        }}>
          <Icon name="search" size={16} color={T.inkMid} />
          <input
            autoFocus
            placeholder="Buscar calle, contenedor…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13.5, color: T.ink, background: 'transparent' }}
          />
        </div>

        {/* Chips tipo */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14 }}>
          <button
            onClick={() => setTypeFilter(null)}
            style={{
              padding: '5px 12px', borderRadius: 999, border: `1px solid ${!typeFilter ? T.primary : T.border}`,
              background: !typeFilter ? T.primaryTint : T.surface,
              color: !typeFilter ? T.primary : T.inkMid,
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
          >
            Todos
          </button>
          {CONTAINERS.map(c => (
            <ContainerChip
              key={c.type} type={c.type}
              active={typeFilter === c.type}
              onClick={() => setTypeFilter(prev => prev === c.type ? null : c.type)}
              size="sm"
            />
          ))}
        </div>

        {/* Resultados */}
        <div className="thin-scroll" style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.map(r => {
            const meta = containerMeta(r.type);
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: `1px solid ${T.borderSoft}`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, flex: '0 0 8px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{meta.label}</div>
                  <div style={{ fontSize: 11.5, color: T.inkMid }}>{r.address} · {r.distM}m</div>
                </div>
                <Button kind="secondary" size="sm" icon={<Icon name="route" size={13} />} onClick={onClose}>
                  Ruta
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: T.inkMid, fontSize: 13, padding: '20px 0' }}>
              Sin resultados
            </div>
          )}
        </div>

        <Button kind="ghost" full size="md" style={{ marginTop: 14 }} onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export default function RutaPage() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const totalMin = STOPS.reduce((acc, s) => acc + s.etaMin, 0);
  const totalPts = STOPS.length * 10;

  return (
    <CitizenLayout title="EcoChicharro · Ruta">
      {/* Mapa placeholder */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 280, zIndex: 10,
        background: `linear-gradient(135deg, ${T.primaryDeep} 0%, ${T.primary} 50%, ${T.primarySky} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Decorative grid lines */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.1 }} width="100%" height="280">
          {[0, 40, 80, 120, 160, 200, 240, 280].map(y => (
            <line key={y} x1={0} y1={y} x2="100%" y2={y} stroke="#fff" strokeWidth={1} />
          ))}
          {[0, 50, 100, 150, 200, 250, 300, 350, 400].map(x => (
            <line key={x} x1={x} y1={0} x2={x} y2={280} stroke="#fff" strokeWidth={1} />
          ))}
        </svg>
        {/* Route pins */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, position: 'relative', zIndex: 2 }}>
          {STOPS.map(s => {
            const meta = containerMeta(s.type);
            return (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 999,
                  background: meta.color, border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
                }}>
                  <Icon name={containerIconName(s.type)} size={18} color="#fff" />
                </div>
                <div style={{ width: 2, height: 20, background: '#fff', opacity: 0.5 }} />
              </div>
            );
          })}
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 16, left: 14,
            width: 36, height: 36, borderRadius: 999,
            background: 'rgba(0,0,0,.25)', border: 'none',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 5,
          }}
        >
          <Icon name="arrow-l" size={20} color="#fff" />
        </button>

        {/* Search pill */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            position: 'absolute', top: 16, left: 62, right: 14,
            height: 36, borderRadius: 999,
            background: 'rgba(255,255,255,.90)', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 14px', cursor: 'pointer', zIndex: 5,
          }}
        >
          <Icon name="search" size={15} color={T.inkMid} />
          <span style={{ fontSize: 13, color: T.inkMid, fontFamily: 'inherit' }}>Añadir parada…</span>
        </button>
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 260, bottom: NAV_HEIGHT,
        background: T.appBg, borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 18px rgba(0,0,0,.10)',
        overflowY: 'auto', zIndex: 20,
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 }}>
          <div style={{ width: 36, height: 4, background: T.border, borderRadius: 999 }} />
        </div>

        <div style={{ padding: '10px 16px 0' }}>
          {/* Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Tu ruta</div>
              <div style={{ fontSize: 12, color: T.inkMid }}>
                {STOPS.length} paradas · {totalMin} min estimados · +{totalPts} pts
              </div>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                width: 32, height: 32, borderRadius: 999,
                background: T.primary, border: 'none',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name="plus" size={18} color="#fff" />
            </button>
          </div>

          {/* Paradas */}
          <div style={{ marginTop: 10 }}>
            {STOPS.map(stop => <StopCard key={stop.num} stop={stop} />)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT,
        background: T.surface, borderTop: `1px solid ${T.border}`,
        padding: '10px 14px', display: 'flex', gap: 10, zIndex: 30,
      }}>
        <Button kind="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          kind="primary" size="md" full
          icon={<Icon name="locate" size={16} />}
        >
          Empezar navegación
        </Button>
      </div>

      {searchOpen && <RouteSearchOverlay onClose={() => setSearchOpen(false)} />}
    </CitizenLayout>
  );
}

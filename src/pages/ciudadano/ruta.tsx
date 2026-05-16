import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { containerMeta } from '@/lib/constants';
import { ECO_HOURLY, bestHourTip } from '@/lib/gamification';
import { Bin, ContainerType } from '@/types';

const T = THEME;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Stop {
  num: number;
  type: ContainerType;
  address: string;
  lat: number;
  lng: number;
  distM: number;
  etaMin: number;
  active?: boolean;
}

function stopsFromBins(bins: Bin[]): Stop[] {
  return bins.map((b, i) => {
    const prev = i > 0 ? bins[i - 1] : null;
    const distM = prev ? Math.round(haversineM(prev.lat, prev.lng, b.lat, b.lng)) : 0;
    return {
      num: i + 1,
      type: b.type,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      distM,
      etaMin: Math.max(1, Math.round(distM / 83)),
      active: i === 0,
    };
  });
}

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eaeaea', color: T.inkMid, fontSize: 13 }}>
      Cargando mapa…
    </div>
  ),
});

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
        <div style={{
          width: 28, height: 28, borderRadius: 999,
          background: stop.active ? T.primary : T.border,
          color: stop.active ? '#fff' : T.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flex: '0 0 28px',
        }}>
          {stop.num}
        </div>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, flex: '0 0 8px' }} />
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
        <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{stop.distM}m</div>
          <div style={{ fontSize: 11, color: T.inkMid }}>{stop.etaMin} min</div>
        </div>
      </div>

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

export default function RutaPage() {
  const router = useRouter();
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('route');
    if (raw) {
      try {
        const parsed: Bin[] = JSON.parse(raw);
        setStops(stopsFromBins(parsed));
      } catch { setStops([]); }
    }
  }, []);

  const totalMin = stops.reduce((acc, s) => acc + s.etaMin, 0);
  const totalPts = stops.length * 10;
  const routePoints = stops.map(s => ({ lat: s.lat, lng: s.lng, id: `stop-${s.num}` }));

  return (
    <CitizenLayout title="EcoChicharro · Ruta">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, zIndex: 10 }}>
        <MapView
          bins={[]}
          routePoints={routePoints}
          minZoom={13}
          maxZoom={19}
        />
      </div>

      {/* Back button */}
      <div style={{
        position: 'absolute', top: 16, left: 14, zIndex: 15,
        width: 36, height: 36, borderRadius: 999,
        background: 'rgba(0,0,0,.25)', border: 'none',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }} onClick={() => router.back()}>
        <Icon name="arrow-l" size={20} color="#fff" />
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, top: 260, bottom: NAV_HEIGHT,
        background: T.appBg, borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 18px rgba(0,0,0,.10)',
        overflowY: 'auto', zIndex: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 }}>
          <div style={{ width: 36, height: 4, background: T.border, borderRadius: 999 }} />
        </div>

        <div style={{ padding: '10px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Tu ruta</div>
              <div style={{ fontSize: 12, color: T.inkMid }}>
                {stops.length} paradas · {totalMin} min estimados · +{totalPts} pts
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            {stops.length === 0 && (
              <div style={{ textAlign: 'center', color: T.inkMid, fontSize: 13, padding: '40px 0' }}>
                No hay paradas en la ruta. Vuelve al mapa y añade contenedores.
              </div>
            )}
            {stops.map(stop => <StopCard key={stop.num} stop={stop} />)}
          </div>
        </div>
      </div>

      {stops.length > 0 && (
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
      )}
    </CitizenLayout>
  );
}

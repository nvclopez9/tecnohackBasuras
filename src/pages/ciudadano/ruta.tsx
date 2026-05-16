import { useRouter } from 'next/router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { containerMeta } from '@/lib/constants';
import { Bin } from '@/types';
import type { FlyTo } from '@/components/MapView';

const T = THEME;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Leg { distM: number; etaMin: number; }

/** Distancia/ETA de cada parada respecto a la anterior. */
function legsFor(bins: Bin[]): Leg[] {
  return bins.map((b, i) => {
    const prev = i > 0 ? bins[i - 1] : null;
    const distM = prev ? Math.round(haversineM(prev.lat, prev.lng, b.lat, b.lng)) : 0;
    return { distM, etaMin: Math.max(1, Math.round(distM / 83)) };
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

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

interface StopCardProps {
  bin: Bin;
  index: number;
  total: number;
  leg: Leg;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

function StopCard({ bin, index, total, leg, onDelete, onMove }: StopCardProps) {
  const meta = containerMeta(bin.type);
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999, background: T.primary,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flex: '0 0 28px',
        }}>
          {index + 1}
        </div>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, flex: '0 0 8px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{meta.label}</div>
          <div style={{ fontSize: 11.5, color: T.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bin.address || bin.area || 'Santa Cruz de Tenerife'}
          </div>
        </div>
        {index > 0 && (
          <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{fmtDist(leg.distM)}</div>
            <div style={{ fontSize: 11, color: T.inkMid }}>{leg.etaMin} min</div>
          </div>
        )}
      </div>

      {/* Controles de edición */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="Subir parada"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '6px 0', borderRadius: 7, fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600,
            background: T.appBg, border: `1px solid ${T.border}`,
            color: index === 0 ? T.inkLight : T.inkMid,
            cursor: index === 0 ? 'default' : 'pointer',
          }}
        >
          <Icon name="arrow-l" size={13} /> Subir
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="Bajar parada"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '6px 0', borderRadius: 7, fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600,
            background: T.appBg, border: `1px solid ${T.border}`,
            color: index === total - 1 ? T.inkLight : T.inkMid,
            cursor: index === total - 1 ? 'default' : 'pointer',
          }}
        >
          <Icon name="arrow-r" size={13} /> Bajar
        </button>
        <button
          onClick={onDelete}
          aria-label="Quitar parada"
          style={{
            flex: '0 0 38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '6px 0', borderRadius: 7,
            background: '#FDECEA', border: '1px solid #F3C0BA', color: T.danger,
            cursor: 'pointer',
          }}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}

export default function RutaPage() {
  const router = useRouter();
  const [route, setRoute] = useState<Bin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('route');
    if (raw) {
      try { setRoute(JSON.parse(raw) as Bin[]); } catch { setRoute([]); }
    }
    setLoaded(true);
  }, []);

  // Persiste cualquier edición de la ruta.
  useEffect(() => {
    if (loaded) sessionStorage.setItem('route', JSON.stringify(route));
  }, [route, loaded]);

  const legs = useMemo(() => legsFor(route), [route]);
  const totalM = useMemo(() => legs.reduce((a, l) => a + l.distM, 0), [legs]);
  const totalMin = useMemo(() => legs.reduce((a, l) => a + l.etaMin, 0), [legs]);
  const routePoints = useMemo(() => route.map((b) => ({ lat: b.lat, lng: b.lng, id: b.id })), [route]);

  const deleteStop = useCallback((idx: number) => {
    setRoute((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const moveStop = useCallback((idx: number, dir: -1 | 1) => {
    setRoute((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }, []);

  const startNavigation = () => {
    if (route.length === 0) return;
    setNavigating(true);
    setCurrentIdx(0);
    setFlyTo({ lat: route[0].lat, lng: route[0].lng, zoom: 17 });
  };

  const goToStop = (idx: number) => {
    const clamped = Math.max(0, Math.min(route.length - 1, idx));
    setCurrentIdx(clamped);
    setFlyTo({ lat: route[clamped].lat, lng: route[clamped].lng, zoom: 17 });
  };

  const current = route[currentIdx];

  return (
    <CitizenLayout title="EcoChicharro · Ruta">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, zIndex: 10 }}>
        <MapView
          bins={[]}
          routePoints={routePoints}
          flyTo={flyTo}
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
      }} onClick={() => (navigating ? setNavigating(false) : router.back())}>
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
          {/* Modo navegación */}
          {navigating && current ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Parada {currentIdx + 1} de {route.length}
              </div>
              <div style={{
                marginTop: 8, background: T.surface, border: `1px solid ${T.primary}`,
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: 999,
                    background: containerMeta(current.type).color + '22',
                    color: containerMeta(current.type).color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 38px',
                  }}>
                    <Icon name={containerMeta(current.type).icon as Parameters<typeof Icon>[0]['name']} size={20} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{containerMeta(current.type).label}</div>
                    <div style={{ fontSize: 12, color: T.inkMid }}>
                      {current.address || current.area || 'Santa Cruz de Tenerife'}
                    </div>
                  </div>
                </div>
                {currentIdx > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: T.inkMid, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="route" size={13} color={T.inkMid} />
                    {fmtDist(legs[currentIdx].distM)} · {legs[currentIdx].etaMin} min desde la parada anterior
                  </div>
                )}
              </div>

              {/* Progreso */}
              <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                {route.map((_, i) => (
                  <span key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: i <= currentIdx ? T.primary : T.border,
                  }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Tu ruta</div>
                  <div style={{ fontSize: 12, color: T.inkMid }}>
                    {route.length} parada{route.length !== 1 ? 's' : ''}
                    {route.length > 1 && ` · ${fmtDist(totalM)} · ~${totalMin} min`}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                {loaded && route.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 999, background: T.primaryMist,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                    }}>
                      <Icon name="route" size={26} color={T.primary} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Aún no hay paradas</div>
                    <div style={{ fontSize: 12.5, color: T.inkMid, marginTop: 4, lineHeight: 1.5 }}>
                      Vuelve al mapa, abre un contenedor y pulsa<br />“Añadir a ruta”.
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <Button kind="primary" size="md" icon={<Icon name="pin" size={15} />} onClick={() => router.push('/ciudadano')}>
                        Ir al mapa
                      </Button>
                    </div>
                  </div>
                )}
                {route.map((bin, i) => (
                  <StopCard
                    key={bin.id}
                    bin={bin}
                    index={i}
                    total={route.length}
                    leg={legs[i]}
                    onDelete={() => deleteStop(i)}
                    onMove={(dir) => moveStop(i, dir)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer de acciones */}
      {route.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT,
          background: T.surface, borderTop: `1px solid ${T.border}`,
          padding: '10px 14px', display: 'flex', gap: 10, zIndex: 30,
        }}>
          {navigating ? (
            <>
              <Button kind="ghost" size="md" disabled={currentIdx === 0} onClick={() => goToStop(currentIdx - 1)}>
                Anterior
              </Button>
              {currentIdx < route.length - 1 ? (
                <Button kind="primary" size="md" full icon={<Icon name="arrow-r" size={16} />} onClick={() => goToStop(currentIdx + 1)}>
                  Siguiente parada
                </Button>
              ) : (
                <Button kind="primary" size="md" full icon={<Icon name="check" size={16} />} onClick={() => setNavigating(false)}>
                  Finalizar ruta
                </Button>
              )}
            </>
          ) : (
            <>
              <Button kind="ghost" size="md" onClick={() => router.back()}>
                Volver
              </Button>
              <Button
                kind="primary" size="md" full
                icon={<Icon name="locate" size={16} />}
                onClick={startNavigation}
              >
                Empezar navegación
              </Button>
            </>
          )}
        </div>
      )}
    </CitizenLayout>
  );
}

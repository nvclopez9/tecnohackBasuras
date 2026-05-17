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

/** Nearest-neighbor route optimization keeping first stop fixed. */
function optimizeRoute(bins: Bin[]): Bin[] {
  if (bins.length <= 2) return bins;
  const visited = new Set<number>();
  const result: Bin[] = [bins[0]];
  visited.add(0);
  while (result.length < bins.length) {
    const last = result[result.length - 1];
    let bestIdx = -1, bestDist = Infinity;
    bins.forEach((b, i) => {
      if (visited.has(i)) return;
      const d = haversineM(last.lat, last.lng, b.lat, b.lng);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    if (bestIdx >= 0) { visited.add(bestIdx); result.push(bins[bestIdx]); }
  }
  return result;
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

/* ── Animation keyframes injected once ─────────────────────────────── */
const KEYFRAMES = `
@keyframes ecoSlideUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes toastPop {
  0%   { opacity: 0; transform: translateX(-50%) scale(.8); }
  60%  { opacity: 1; transform: translateX(-50%) scale(1.06); }
  100% { opacity: 1; transform: translateX(-50%) scale(1); }
}
`;

/* ── BannerArrival ──────────────────────────────────────────────────── */
function BannerArrival({
  bin, onDone, onSkip,
}: {
  bin: Bin;
  onDone: (r: { recycled: boolean; pointsEarned: number }) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<'rating' | 'recycled'>('rating');
  const meta = containerMeta(bin.type);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.48)', display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', background: '#fff',
        borderRadius: '20px 20px 0 0', padding: '14px 20px 36px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.28)',
        animation: 'ecoSlideUp 0.25s ease-out',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: '#E2E6EA' }} />
        </div>
        {/* Container badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: meta.color + '18', border: `1px solid ${meta.color}44`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12.5, fontWeight: 700, color: meta.color,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, display: 'inline-block' }} />
            {meta.label}
          </span>
        </div>

        {step === 'rating' ? (
          <>
            <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1C2530', margin: '0 0 20px' }}>
              ¿Cómo está el contenedor?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
              {(['😁', '😐', '😠'] as const).map(emoji => (
                <button key={emoji} onClick={() => setStep('recycled')} style={{
                  fontSize: 42, background: 'none', border: 'none', cursor: 'pointer',
                  padding: 8, borderRadius: 14, lineHeight: 1,
                }}>
                  {emoji}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1C2530', margin: '0 0 20px' }}>
              ¿Has reciclado?
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button onClick={() => onDone({ recycled: true, pointsEarned: 10 })} style={{
                flex: 1, height: 50, borderRadius: 12, background: '#2E8B57', color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>✅ Sí <span style={{ fontWeight: 400, fontSize: 12 }}>(+10 pts)</span></button>
              <button onClick={() => onDone({ recycled: false, pointsEarned: 5 })} style={{
                flex: 1, height: 50, borderRadius: 12, background: '#F8F9FA',
                border: '1px solid #E2E6EA', color: '#1C2530',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>No <span style={{ fontWeight: 400, fontSize: 12 }}>(+5 pts)</span></button>
            </div>
            <button onClick={onSkip} style={{
              width: '100%', height: 38, borderRadius: 10, background: 'transparent',
              border: 'none', color: '#6B7480', fontSize: 13, cursor: 'pointer',
            }}>
              Omitir
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── PointsToast ────────────────────────────────────────────────────── */
function PointsToast({ points }: { points: number }) {
  return (
    <div style={{
      position: 'fixed', top: 80, left: '50%',
      transform: 'translateX(-50%)', zIndex: 300,
      background: '#2E8B57', color: '#fff',
      borderRadius: 999, padding: '10px 22px',
      fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(46,139,87,0.45)',
      animation: 'toastPop 0.35s ease-out forwards',
      pointerEvents: 'none',
    }}>
      +{points} puntos · ¡buen trabajo!
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
  const [completed, setCompleted] = useState(false);
  const [completedIdxs, setCompletedIdxs] = useState<Set<number>>(new Set());
  const [arrived, setArrived] = useState<Bin | null>(null);
  const [toast, setToast] = useState<number | null>(null);
  const [earnedPts, setEarnedPts] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem('eco-route');
    if (raw) {
      try { setRoute(JSON.parse(raw) as Bin[]); } catch { setRoute([]); }
    }
    setLoaded(true);
  }, []);

  // Persiste cualquier edición de la ruta.
  useEffect(() => {
    if (loaded) localStorage.setItem('eco-route', JSON.stringify(route));
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

  const goToStop = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(route.length - 1, idx));
    setCurrentIdx(clamped);
    setFlyTo({ lat: route[clamped].lat, lng: route[clamped].lng, zoom: 17 });
  }, [route]);

  const markStop = useCallback((idx: number) => {
    setCompletedIdxs((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    if (idx >= route.length - 1) {
      setCompleted(true);
    } else {
      goToStop(idx + 1);
    }
  }, [route.length, goToStop]);

  const onDone = useCallback((result: { recycled: boolean; pointsEarned: number }) => {
    setEarnedPts(p => p + result.pointsEarned);
    setArrived(null);
    setToast(result.pointsEarned);
    setTimeout(() => setToast(null), 2200);
    markStop(currentIdx);
  }, [markStop, currentIdx]);

  const onSkip = useCallback(() => {
    setArrived(null);
    markStop(currentIdx);
  }, [markStop, currentIdx]);

  const startNavigation = () => {
    if (route.length === 0) return;
    const optimized = optimizeRoute(route);
    setRoute(optimized);
    setNavigating(true);
    setCurrentIdx(0);
    setCompletedIdxs(new Set());
    setCompleted(false);
    setFlyTo({ lat: optimized[0].lat, lng: optimized[0].lng, zoom: 17 });
  };

  const handleOptimize = () => {
    if (route.length <= 2) return;
    setRoute(optimizeRoute(route));
  };

  const current = route[currentIdx];

  /* ── Unique container types for completion screen ─────────────────── */
  const uniqueTypes = useMemo(() => {
    const seen = new Set<string>();
    route.forEach((b) => seen.add(b.type));
    return Array.from(seen) as import('@/types').ContainerType[];
  }, [route]);

  /* ── Completed screen ─────────────────────────────────────────────── */
  if (completed) {
    return (
      <CitizenLayout title="EcoChicharro · Ruta completada">
        <style>{KEYFRAMES}</style>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: T.surface,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '32px 20px',
          animation: 'ecoSlideUp 0.4s ease-out',
        }}>
          {/* Big check */}
          <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, textAlign: 'center' }}>
            ¡Ruta completada!
          </div>
          <div style={{ fontSize: 13.5, color: T.inkMid, marginTop: 6, textAlign: 'center' }}>
            Has contribuido al reciclaje de Santa Cruz
          </div>

          {/* KPI summary card */}
          <div style={{
            width: '100%', maxWidth: 360, marginTop: 28,
            background: T.primaryMist, borderRadius: 16, padding: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.primary }}>{route.length}</div>
                <div style={{ fontSize: 11, color: T.inkMid, marginTop: 2 }}>Paradas</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.primary }}>{fmtDist(totalM)}</div>
                <div style={{ fontSize: 11, color: T.inkMid, marginTop: 2 }}>Distancia</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.primary }}>~{totalMin}</div>
                <div style={{ fontSize: 11, color: T.inkMid, marginTop: 2 }}>Minutos</div>
              </div>
              {earnedPts > 0 && (
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2E8B57' }}>+{earnedPts}</div>
                  <div style={{ fontSize: 11, color: T.inkMid, marginTop: 2 }}>Puntos</div>
                </div>
              )}
            </div>
          </div>

          {/* Impact card */}
          <div style={{
            width: '100%', maxWidth: 360, marginTop: 14,
            background: 'linear-gradient(135deg, #d4edda 0%, #b8dfc7 100%)',
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.success, marginBottom: 12 }}>
              ♻️ Has reciclado
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {uniqueTypes.map((type) => {
                const meta = containerMeta(type);
                return (
                  <span key={type} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: meta.color + '22', border: `1px solid ${meta.color}55`,
                    borderRadius: 20, padding: '4px 10px',
                    fontSize: 12, fontWeight: 600, color: meta.color,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, display: 'inline-block' }} />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Back to map */}
          <div style={{ width: '100%', maxWidth: 360, marginTop: 28 }}>
            <button
              onClick={() => {
                localStorage.removeItem('eco-route');
                router.push('/ciudadano');
              }}
              style={{
                width: '100%', height: 50, borderRadius: 12,
                background: T.primary, color: '#fff',
                border: 'none', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Volver al mapa
            </button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  /* ── Navigation mode (step-by-step, full-screen map) ─────────────── */
  if (navigating && current) {
    const leg = legs[currentIdx];
    const isLast = currentIdx === route.length - 1;

    return (
      <CitizenLayout title="EcoChicharro · Navegando">
        {/* Full-screen map */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
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
          position: 'absolute', top: 16, left: 14, zIndex: 25,
          width: 36, height: 36, borderRadius: 999,
          background: 'rgba(0,0,0,.25)', border: 'none',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }} onClick={() => setNavigating(false)}>
          <Icon name="arrow-l" size={20} color="#fff" />
        </div>

        {/* Floating bottom card */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT, zIndex: 20,
          background: T.surface,
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -6px 32px rgba(0,0,0,.18)',
          padding: '12px 18px 20px',
        }}>
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 32, height: 4, borderRadius: 999, background: T.border }} />
          </div>

          {/* Top row: badge + container indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              background: T.primary + '22', color: T.primary,
              borderRadius: 20, padding: '3px 10px',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              Parada {currentIdx + 1} de {route.length}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: T.inkMid }}>
              <span style={{
                width: 10, height: 10, borderRadius: 999,
                background: containerMeta(current.type).color, display: 'inline-block', flex: '0 0 10px',
              }} />
              {containerMeta(current.type).label}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
            {route.map((_, i) => (
              <span key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: completedIdxs.has(i) || i === currentIdx ? T.primary : T.border,
              }} />
            ))}
          </div>

          {/* Address */}
          <div style={{ fontSize: 12, color: T.inkMid, marginBottom: 8 }}>
            {current.address || current.area || 'Santa Cruz de Tenerife'}
          </div>

          {/* Distance chip (if not first) */}
          {currentIdx > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: T.primaryMist, borderRadius: 20, padding: '4px 10px',
              fontSize: 12, color: T.primary, fontWeight: 600, marginBottom: 14,
            }}>
              <Icon name="route" size={12} color={T.primary} />
              {fmtDist(leg.distM)} · {leg.etaMin} min desde la anterior
            </div>
          )}

          {/* Primary action */}
          <button
            onClick={() => setArrived(current)}
            style={{
              width: '100%', height: 48, borderRadius: 12,
              background: T.success, color: '#fff',
              border: 'none', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', marginTop: currentIdx > 0 ? 0 : 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isLast ? 'Completar ruta 🎉' : 'He llegado ✓'}
          </button>

          {/* Ghost back button */}
          {currentIdx > 0 && (
            <button
              onClick={() => goToStop(currentIdx - 1)}
              style={{
                width: '100%', marginTop: 10, height: 38, borderRadius: 10,
                background: 'transparent', border: `1px solid ${T.border}`,
                color: T.inkMid, fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Anterior
            </button>
          )}
        </div>

        {/* BannerArrival overlay */}
        {arrived && (
          <BannerArrival bin={arrived} onDone={onDone} onSkip={onSkip} />
        )}
        {/* PointsToast */}
        {toast !== null && <PointsToast points={toast} />}
      </CitizenLayout>
    );
  }

  /* ── Planning mode ────────────────────────────────────────────────── */
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

        <div style={{ padding: '10px 16px 0', paddingBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Tu ruta</div>
              <div style={{ fontSize: 12, color: T.inkMid }}>
                {route.length} parada{route.length !== 1 ? 's' : ''}
                {route.length > 1 && ` · ${fmtDist(totalM)} · ~${totalMin} min`}
              </div>
            </div>
            {route.length > 2 && (
              <button
                onClick={handleOptimize}
                style={{
                  background: 'transparent', border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: '5px 10px',
                  fontSize: 12, fontWeight: 600, color: T.primary,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Optimizar orden
              </button>
            )}
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
                  Vuelve al mapa, abre un contenedor y pulsa<br />"Añadir a ruta".
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
        </div>
      </div>

      {/* Footer de acciones */}
      {route.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT,
          background: T.surface, borderTop: `1px solid ${T.border}`,
          padding: '10px 14px', display: 'flex', gap: 10, zIndex: 30,
        }}>
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
        </div>
      )}
    </CitizenLayout>
  );
}

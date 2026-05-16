import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { CONTAINERS, containerMeta } from '@/lib/constants';
import { Bin, ContainerType } from '@/types';
import type { RoutePoint, FlyTo } from '@/components/MapView';

const MIN_ZOOM_BINS = 14;
const MAX_BARRIO_SPAN = 0.058;
const T = THEME;

function bboxFitsBarrio(bbox: string): boolean {
  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) return false;
  const [latMin, lngMin, latMax, lngMax] = parts;
  return Math.abs(latMax - latMin) <= MAX_BARRIO_SPAN && Math.abs(lngMax - lngMin) <= MAX_BARRIO_SPAN;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routeStats(pts: { lat: number; lng: number }[]) {
  let m = 0;
  for (let i = 1; i < pts.length; i++) m += haversineM(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
  return { distM: Math.round(m), walkMin: Math.max(1, Math.round(m / 83)) };
}

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eaeaea', color: T.inkMid, fontSize: 13 }}>
      Cargando mapa…
    </div>
  ),
});

export default function CiudadanoHome() {
  const router = useRouter();
  const [bins, setBins] = useState<Bin[]>([]);
  const [mapZoom, setMapZoom] = useState(17);
  const [isBarrioView, setIsBarrioView] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<Set<ContainerType>>(new Set(['mixto', 'papel', 'envases']));
  const [selected, setSelected] = useState<Bin | null>(null);
  const [route, setRoute] = useState<Bin[]>([]);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);
  const [locating, setLocating] = useState(false);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 17 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const bboxRef = useRef<string | null>(null);
  const zoomRef = useRef<number>(17);
  const filterRef = useRef<Set<ContainerType>>(new Set(['mixto', 'papel', 'envases']));

  useEffect(() => { filterRef.current = filter; }, [filter]);

  const fetchBins = useCallback((bbox: string) => {
    const types = filterRef.current;
    const typeParam = types.size > 0 ? `&type=${[...types].join(',')}` : '';
    fetch(`/api/bins?bbox=${bbox}${typeParam}&limit=400`)
      .then(r => r.json())
      .then((data: Bin[]) => setBins(data))
      .catch(() => {});
  }, []);

  const handleBoundsChange = useCallback((bbox: string, zoom: number) => {
    bboxRef.current = bbox;
    zoomRef.current = zoom;
    setMapZoom(zoom);
    const barrioView = bboxFitsBarrio(bbox);
    setIsBarrioView(barrioView);
    if (zoom >= MIN_ZOOM_BINS && barrioView) fetchBins(bbox);
    else setBins([]);
  }, [fetchBins]);

  useEffect(() => {
    if (bboxRef.current && zoomRef.current >= MIN_ZOOM_BINS && isBarrioView) fetchBins(bboxRef.current);
  }, [filter, fetchBins, isBarrioView]);

  const toggle = (type: ContainerType) => {
    setFilter(prev => { const n = new Set(prev); n.has(type) ? n.delete(type) : n.add(type); return n; });
  };

  const filterSet = useMemo(() => (filter.size === 0 ? null : filter), [filter]);
  const visibleCount = bins.filter(b => !filterSet || filterSet.has(b.type)).length;

  const inRoute = selected ? route.some(b => b.id === selected.id) : false;
  const toggleRoute = () => {
    if (!selected) return;
    setRoute(prev => inRoute ? prev.filter(b => b.id !== selected.id) : [...prev, selected]);
  };

  const routePoints: RoutePoint[] = route.map(b => ({ lat: b.lat, lng: b.lng, id: b.id }));
  const stats = routeStats(routePoints);

  const filterCount = filter.size;

  return (
    <CitizenLayout title="EcoChicharro · Inicio">
      {/* MAP */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView
          bins={bins}
          containerFilter={filterSet}
          selectedId={selected?.id}
          onBinClick={b => setSelected(b)}
          onBoundsChange={handleBoundsChange}
          variant={darkMode ? 'dark' : 'light'}
          routePoints={routePoints}
          flyTo={flyTo}
          minZoom={13}
          maxZoom={19}
        />
        {(!isBarrioView || mapZoom < MIN_ZOOM_BINS) && (
          <div style={{
            position: 'absolute', bottom: NAV_HEIGHT + 80, left: '50%',
            transform: 'translateX(-50%)', zIndex: 25,
            background: 'rgba(0,0,0,.72)', color: '#fff',
            borderRadius: 999, padding: '7px 14px',
            fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <Icon name="pin" size={14} color="#fff" />
            {!isBarrioView
              ? 'Acércate a un barrio para ver los contenedores'
              : 'Acércate el zoom para ver los contenedores'}
          </div>
        )}
      </div>

      {/* TOP HEADER */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '16px 16px 14px',
        background: `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ffffff22', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>Ec</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>EcoChicharro</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Santa Cruz de Tenerife</div>
          </div>
          <button
            style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
            aria-label="Notificaciones"
          >
            <Icon name="bell" size={18} color="#fff" />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <Icon name="search" size={16} color={T.inkMid} />
          <input placeholder="Buscar calle, plaza, contenedor…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13.5, color: T.ink, background: 'transparent' }} />
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div style={{
        position: 'absolute', top: 122, left: 14, right: 14, zIndex: 22,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* Filtros button */}
        <button
          onClick={() => setFilterOpen(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: filterOpen ? T.primary : '#fff',
            border: `1px solid ${filterOpen ? T.primary : T.border}`,
            borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,.10)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            color: filterOpen ? '#fff' : T.ink,
          }}
        >
          <Icon name="search" size={14} color={filterOpen ? '#fff' : T.inkMid} />
          Filtros
          {filterCount > 0 && (
            <span style={{
              background: filterOpen ? 'rgba(255,255,255,.25)' : T.primary,
              color: '#fff', borderRadius: 999,
              width: 18, height: 18, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {filterCount}
            </span>
          )}
        </button>

        <div style={{ flex: 1 }} />

        {/* Mi ubicación */}
        <button
          onClick={locateMe}
          disabled={locating}
          title="Mi ubicación"
          style={{
            width: 38, height: 38, borderRadius: 999,
            background: '#fff',
            border: `1px solid ${T.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', opacity: locating ? 0.6 : 1,
          }}
        >
          <Icon name="locate" size={18} color={T.primary} />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          style={{
            width: 38, height: 38, borderRadius: 999,
            background: darkMode ? '#1a1a2e' : '#fff',
            border: `1px solid ${darkMode ? '#444' : T.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name={darkMode ? 'sun' : 'moon'} size={18} color={darkMode ? '#ffd700' : T.inkMid} />
        </button>
      </div>

      {/* FILTER DROPDOWN PANEL */}
      {filterOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setFilterOpen(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 21 }}
          />
          <div style={{
            position: 'absolute', top: 168, left: 14, right: 14, zIndex: 23,
            background: '#fff', border: `1px solid ${T.border}`,
            borderRadius: 12, padding: '10px 8px 8px',
            boxShadow: '0 4px 16px rgba(0,0,0,.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.inkMid, letterSpacing: 0.5, flex: 1 }}>TIPO DE CONTENEDOR</span>
              {filter.size > 0 && (
                <button onClick={() => setFilter(new Set())} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: T.primary, fontFamily: 'inherit', padding: 0 }}>
                  Ver todos
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {CONTAINERS.filter(c => !['resto', 'organico', 'baterias'].includes(c.type)).map(c => {
                const active = filter.has(c.type);
                const meta = containerMeta(c.type);
                return (
                  <button
                    key={c.type}
                    onClick={() => toggle(c.type)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      padding: '6px 2px', borderRadius: 8,
                      background: active ? T.primaryTint : 'transparent',
                      border: `1px solid ${active ? T.primary : 'transparent'}`,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Icon name={meta.icon as Parameters<typeof Icon>[0]['name']} size={15} color={meta.color} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: active ? T.primary : T.inkMid, textAlign: 'center', lineHeight: 1.2 }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ROUTE SUMMARY BAR */}
      {route.length > 0 && !selected && (
        <div style={{
          position: 'absolute', left: 14, right: 14, bottom: NAV_HEIGHT + 16, zIndex: 30,
          background: T.primary, borderRadius: 14,
          padding: '10px 16px', boxShadow: '0 4px 14px rgba(0,90,156,.35)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="route" size={18} color="#fff" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {route.length} parada{route.length !== 1 ? 's' : ''} en ruta
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>
              {stats.distM >= 1000 ? `${(stats.distM / 1000).toFixed(1)} km` : `${stats.distM} m`} · ~{stats.walkMin} min caminando
            </div>
          </div>
          <button
            onClick={() => router.push('/ciudadano/ruta')}
            style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: T.primary, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Ver ruta
          </button>
          <button
            onClick={() => setRoute([])}
            style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Icon name="x" size={14} color="#fff" />
          </button>
        </div>
      )}

      {/* PLANIFICAR RUTA BUTTON (only when no route and no selection) */}
      {route.length === 0 && !selected && (
        <button
          onClick={() => router.push('/ciudadano/ruta')}
          style={{
            position: 'absolute', right: 14, bottom: NAV_HEIGHT + 16, zIndex: 18,
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: `1.5px solid ${T.primary}`, borderRadius: 999,
            padding: '7px 14px', boxShadow: '0 2px 8px rgba(0,90,156,.15)',
            fontSize: 12.5, fontWeight: 700, color: T.primary,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Icon name="route" size={15} color={T.primary} />
          Planificar ruta
        </button>
      )}

      {/* BOTTOM SHEET */}
      {selected && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: NAV_HEIGHT, zIndex: 40,
          background: '#fff', borderRadius: '16px 16px 0 0',
          padding: '14px 18px 18px', boxShadow: '0 -6px 22px rgba(0,0,0,.12)',
          borderTop: `1px solid ${T.border}`,
        }}>
          <div style={{ width: 36, height: 4, background: T.border, borderRadius: 999, margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{
              width: 40, height: 40, borderRadius: 10,
              background: containerMeta(selected.type).color + '22',
              color: containerMeta(selected.type).color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="pin" size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>
                {containerMeta(selected.type).label}
              </div>
              <div style={{ fontSize: 12.5, color: T.inkMid, marginTop: 2 }}>
                {selected.address} · {selected.area}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: T.inkMid, cursor: 'pointer' }} aria-label="Cerrar">
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Añadir/quitar de ruta */}
          <button
            onClick={toggleRoute}
            style={{
              marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 10,
              background: inRoute ? '#FFF3E0' : T.primaryTint,
              border: `1px solid ${inRoute ? '#F57C00' : T.primary}`,
              color: inRoute ? '#E65100' : T.primary,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Icon name="route" size={16} color={inRoute ? '#E65100' : T.primary} />
            {inRoute ? 'Quitar de la ruta' : `Añadir a ruta ${route.length > 0 ? `(parada ${route.length + 1})` : ''}`}
          </button>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button
              kind="secondary" size="md" full
              icon={<Icon name="list" size={16} />}
              onClick={() => router.push(`/ciudadano/contenedor/${selected.id}`)}
            >
              Ver detalles
            </Button>
            <Button
              kind="primary" size="md" full
              icon={<Icon name="camera" size={16} />}
              onClick={() => router.push(`/ciudadano/reportar?binId=${selected.id}&containerType=${selected.type}`)}
            >
              Reportar incidencia
            </Button>
          </div>
        </div>
      )}
    </CitizenLayout>
  );
}

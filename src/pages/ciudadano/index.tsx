import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { CONTAINERS, containerMeta } from '@/lib/constants';
import { Bin, ContainerType } from '@/types';
import type { RoutePoint, FlyTo, MapVariant, LatLng } from '@/components/MapView';

const MIN_ZOOM_BINS = 14;
const MAX_BARRIO_SPAN = 0.058;
const T = THEME;

const POPUP_KEYFRAMES = `
@keyframes popupSlideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
`;

const MAP_LAYERS: { id: MapVariant; label: string; swatch: string }[] = [
  { id: 'light', label: 'Claro', swatch: 'linear-gradient(135deg,#F4F6F8,#DDE3E8)' },
  { id: 'voyager', label: 'Calles', swatch: 'linear-gradient(135deg,#E7EFE3,#CBD9C9)' },
  { id: 'dark', label: 'Oscuro', swatch: 'linear-gradient(135deg,#3A3A48,#1A1A26)' },
  { id: 'satellite', label: 'Satélite', swatch: 'linear-gradient(135deg,#5C6E45,#2E3A24)' },
];

interface GeoHit { display: string; label: string; lat: number; lng: number; }

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
  const [mapVariant, setMapVariant] = useState<MapVariant>('voyager');
  const [layerOpen, setLayerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<Set<ContainerType>>(new Set(['mixto', 'papel', 'envases']));
  const [selected, setSelected] = useState<Bin | null>(null);
  const [route, setRoute] = useState<Bin[]>([]);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const [binPendingCount, setBinPendingCount] = useState(0);

  // Cargar ruta guardada de localStorage al montar
  useEffect(() => {
    const raw = localStorage.getItem('eco-route');
    if (raw) {
      try { setRoute(JSON.parse(raw) as Bin[]); } catch { /* ignore */ }
    }
  }, []);

  // Persistir ruta en localStorage cuando cambie
  useEffect(() => {
    if (route.length > 0) {
      localStorage.setItem('eco-route', JSON.stringify(route));
    }
  }, [route]);

  // Incidencias pendientes del bin seleccionado
  useEffect(() => {
    if (!selected) { setBinPendingCount(0); return; }
    fetch(`/api/reports?binId=${selected.id}`)
      .then(r => r.json())
      .then((data: { status: string }[]) => {
        if (!Array.isArray(data)) return;
        setBinPendingCount(data.filter(r => r.status !== 'resuelto').length);
      })
      .catch(() => setBinPendingCount(0));
  }, [selected?.id]);

  // Estilo de mapa preferido (persistido).
  useEffect(() => {
    const saved = localStorage.getItem('eco-map-variant') as MapVariant | null;
    if (saved && MAP_LAYERS.some((l) => l.id === saved)) setMapVariant(saved);
  }, []);
  const pickLayer = (id: MapVariant) => {
    setMapVariant(id);
    localStorage.setItem('eco-map-variant', id);
    setLayerOpen(false);
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(here);
        setFlyTo({ ...here, zoom: 17 });
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
    else setBins(prev => prev.filter(b => route.some(r => r.id === b.id)));
  }, [fetchBins, route]);

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

  // debounced geocoding search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    searchTimer.current = setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`)
        .then(r => r.json())
        .then((data: GeoHit[]) => {
          setSearchResults(Array.isArray(data) ? data : []);
          setSearchOpen(true);
        })
        .catch(() => { setSearchResults([]); setSearchOpen(true); });
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const selectSearchResult = (r: GeoHit) => {
    setFlyTo({ lat: r.lat, lng: r.lng, zoom: 17 });
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  return (
    <CitizenLayout title="EcoChicharro · Inicio">
      <style>{POPUP_KEYFRAMES}</style>
      {/* MAP */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView
          bins={bins}
          containerFilter={filterSet}
          selectedId={selected?.id}
          onBinClick={b => setSelected(b)}
          onBoundsChange={handleBoundsChange}
          variant={mapVariant}
          routePoints={routePoints}
          flyTo={flyTo}
          userLocation={userLocation}
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
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <Icon name="search" size={16} color={T.inkMid} />
            <input
              placeholder="Buscar calle, plaza, contenedor…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13.5, color: T.ink, background: 'transparent' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }} style={{ background: 'none', border: 'none', color: T.inkMid, cursor: 'pointer', padding: 0 }}>
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
          {/* Search dropdown */}
          {searchOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10,
              marginTop: 4, boxShadow: '0 4px 16px rgba(0,0,0,.12)',
              overflow: 'hidden',
            }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 12.5, color: T.inkMid }}>
                  Sin resultados para “{searchQuery.trim()}”.
                </div>
              ) : searchResults.map((r, i) => (
                <div key={`${r.display}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '9px 12px', borderBottom: `1px solid ${T.borderSoft}`,
                }} onClick={() => selectSearchResult(r)}>
                  <Icon name="pin" size={14} color={T.primary} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: T.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display}</div>
                  </div>
                  <Icon name="locate" size={14} color={T.primary} />
                </div>
              ))}
            </div>
          )}
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

        {/* Selector de capa de mapa */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLayerOpen(o => !o)}
            title="Estilo de mapa"
            style={{
              width: 38, height: 38, borderRadius: 999,
              background: layerOpen ? T.primary : '#fff',
              border: `1px solid ${layerOpen ? T.primary : T.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon name="layers" size={18} color={layerOpen ? '#fff' : T.inkMid} />
          </button>
          {layerOpen && (
            <div style={{
              position: 'absolute', top: 44, right: 0, zIndex: 24,
              background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,.14)',
              display: 'grid', gridTemplateColumns: 'repeat(2, 64px)', gap: 6,
            }}>
              {MAP_LAYERS.map(l => {
                const active = mapVariant === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => pickLayer(l.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: 5, borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                      background: active ? T.primaryTint : 'transparent',
                      border: `1px solid ${active ? T.primary : 'transparent'}`,
                    }}
                  >
                    <span style={{ width: '100%', height: 34, borderRadius: 6, background: l.swatch, border: `1px solid ${T.border}` }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: active ? T.primary : T.inkMid }}>{l.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
              {CONTAINERS.map(c => {
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
            onClick={() => { localStorage.setItem('eco-route', JSON.stringify(route)); router.push('/ciudadano/ruta'); }}
            style={{ background: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: T.primary, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Ver ruta
          </button>
          <button
            onClick={() => { localStorage.removeItem('eco-route'); setRoute([]); }}
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

      {/* POPUP CARD — compact floating, no full-width sheet */}
      {selected && (
        <>
          {/* Invisible backdrop: click anywhere on map to dismiss */}
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'absolute', inset: 0, zIndex: 39 }}
          />
          <div style={{
            position: 'fixed',
            bottom: `calc(${NAV_HEIGHT}px + 12px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(340px, calc(100vw - 32px))',
            zIndex: 40,
            background: '#fff',
            borderRadius: 16,
            padding: '14px 16px 12px',
            boxShadow: '0 -4px 24px rgba(0,0,0,.14), 0 8px 32px rgba(0,0,0,.10)',
            border: `1px solid ${T.borderSoft}`,
            animation: 'popupSlideUp 0.2s ease-out',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 11 }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: containerMeta(selected.type).color + '1e',
                color: containerMeta(selected.type).color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="pin" size={18} color={containerMeta(selected.type).color} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>
                  {containerMeta(selected.type).label}
                </div>
                <div style={{ fontSize: 11.5, color: T.inkMid, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selected.address}{selected.area ? ` · ${selected.area}` : ''}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: T.appBg, border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Cerrar"
              >
                <Icon name="x" size={14} color={T.inkMid} />
              </button>
            </div>

            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Añadir / Quitar de ruta — flex:2 */}
              <button
                onClick={toggleRoute}
                style={{
                  flex: 2, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  background: inRoute ? '#FFF3E0' : T.primaryTint,
                  border: `1px solid ${inRoute ? '#F57C00' : T.primary}`,
                  color: inRoute ? '#E65100' : T.primary,
                }}
              >
                <Icon name="route" size={14} color={inRoute ? '#E65100' : T.primary} />
                {inRoute ? 'Quitar' : `+ Ruta${route.length > 0 ? ` (${route.length + 1})` : ''}`}
              </button>
              {/* Detalles — flex:1 */}
              <button
                onClick={() => router.push(`/ciudadano/contenedor/${selected.id}`)}
                style={{
                  flex: 1, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: T.appBg, border: `1px solid ${T.border}`, color: T.ink,
                }}
              >
                <Icon name="list" size={13} color={T.inkMid} />
                Info
              </button>
              {/* Incidencias pendientes — flex:1 */}
              <button
                onClick={() => binPendingCount > 0 && router.push(`/ciudadano/contenedor/${selected.id}`)}
                disabled={binPendingCount === 0}
                title={binPendingCount === 0 ? 'Sin incidencias activas' : `Ver ${binPendingCount} incidencia${binPendingCount !== 1 ? 's' : ''} activa${binPendingCount !== 1 ? 's' : ''}`}
                style={{
                  flex: 1, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                  cursor: binPendingCount > 0 ? 'pointer' : 'default',
                  background: binPendingCount > 0 ? T.warn + '18' : T.appBg,
                  border: `1px solid ${binPendingCount > 0 ? T.warn + '66' : T.border}`,
                  color: binPendingCount > 0 ? T.warn : T.inkLight,
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <Icon name="bell" size={13} color={binPendingCount > 0 ? T.warn : T.inkLight} />
                {binPendingCount > 0 ? `${binPendingCount} activa${binPendingCount !== 1 ? 's' : ''}` : 'Sin alertas'}
              </button>
            </div>
          </div>
        </>
      )}
    </CitizenLayout>
  );
}

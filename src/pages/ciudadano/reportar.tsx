import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState, useRef, useCallback, useEffect } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { CONTAINERS, INCIDENTS, containerMeta, priorityMeta } from '@/lib/constants';
import { priorityFor } from '@/lib/priority';
import { compressImage, getGeolocation, Capture, GeoResult } from '@/lib/capture';
import { useReports } from '@/hooks/useReports';
import { Bin, ContainerType, IncidentType } from '@/types';
const T = THEME;

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface NearbyBin { bin: Bin; distM: number; }

export default function ReportarPage() {
  const router = useRouter();
  const { addReport } = useReports();
  const cameraRef = useRef<HTMLInputElement>(null);

  const [booting, setBooting] = useState(true);
  const [fromBubble, setFromBubble] = useState(false);
  const [step, setStep] = useState<'capture' | 'form'>('capture');
  const [busy, setBusy] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const [capture, setCapture] = useState<Capture | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [binId, setBinId] = useState<string | null>(null);

  const [container, setContainer] = useState<ContainerType>('envases');
  const [incident, setIncident] = useState<IncidentType>('lleno');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nearby, setNearby] = useState<NearbyBin[]>([]);
  const [manualType, setManualType] = useState(false);

  const priority = priorityFor(incident);
  const pm = priorityMeta(priority);

  // Arranque: ¿viene de una burbuja del mapa (binId) o de la pestaña Reportar?
  useEffect(() => {
    if (!router.isReady) return;
    const qBin = typeof router.query.binId === 'string' ? router.query.binId : '';
    const qType = router.query.containerType;
    if (typeof qType === 'string' && CONTAINERS.some((c) => c.type === qType)) {
      setContainer(qType as ContainerType);
    }
    if (qBin) {
      // Reporte desde burbuja → sin foto, va directo al formulario.
      setFromBubble(true);
      setBinId(qBin);
      fetch(`/api/bins/${qBin}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((bin: Bin | null) => {
          if (bin) {
            setCoords({ lat: bin.lat, lng: bin.lng });
            setContainer(bin.type);
          }
          setStep('form');
          setBooting(false);
        })
        .catch(() => { setStep('form'); setBooting(false); });
    } else {
      setStep('capture');
      setBooting(false);
    }
  }, [router.isReady, router.query.binId, router.query.containerType]);

  // Contenedores cercanos por GPS (solo flujo cámara, sin binId de burbuja)
  useEffect(() => {
    if (fromBubble || !coords || step !== 'form') return;
    const d = 0.0045;
    const bbox = `${coords.lat - d},${coords.lng - d},${coords.lat + d},${coords.lng + d}`;
    fetch(`/api/bins?bbox=${bbox}&limit=200`)
      .then((r) => r.json())
      .then((bins: Bin[]) => {
        const ranked = bins
          .map((bin) => ({ bin, distM: Math.round(haversineM(coords.lat, coords.lng, bin.lat, bin.lng)) }))
          .sort((a, b) => a.distM - b.distM)
          .slice(0, 5);
        setNearby(ranked);
        if (ranked.length > 0 && !binId) {
          setBinId(ranked[0].bin.id);
          setContainer(ranked[0].bin.type);
        } else if (ranked.length === 0) {
          setManualType(true);
        }
      })
      .catch(() => setManualType(true));
  }, [coords, fromBubble, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const geoMessage = useCallback((geo: GeoResult): string | null => {
    if (geo.precise) return null;
    switch (geo.fallbackReason) {
      case 'denied': return 'Ubicación desactivada: se usará el centro de Santa Cruz. Ajusta el punto si hace falta.';
      case 'timeout': return 'No se pudo obtener tu ubicación a tiempo: se usará el centro de Santa Cruz.';
      case 'unsupported': return 'Este dispositivo no permite geolocalización: se usará el centro de Santa Cruz.';
      default: return 'No se pudo determinar tu ubicación: se usará el centro de Santa Cruz.';
    }
  }, []);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setCaptureError(null);
    try {
      const [{ full, thumb }, geo] = await Promise.all([compressImage(file), getGeolocation()]);
      setCapture({ photo: full, thumbnail: thumb, lat: geo.lat, lng: geo.lng });
      setCoords({ lat: geo.lat, lng: geo.lng });
      setGeoNotice(geoMessage(geo));
      setStep('form');
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'No se pudo procesar la foto. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }, [geoMessage]);

  const submit = useCallback(async () => {
    if (!coords) return;
    setSubmitting(true);
    try {
      // La foto ya está comprimida a base64 (máx 900×900 JPEG 75% ≈ 200 KB).
      // Se envía directamente en el body — sin dependencia de servicios externos.
      await addReport({
        photo: capture?.photo ?? '',
        thumbnail: capture?.thumbnail ?? '',
        lat: coords.lat,
        lng: coords.lng,
        containerType: container,
        incidentType: incident,
        description: note,
        binId: binId ?? undefined,
      });
      router.push('/ciudadano/incidencias');
    } catch (err) {
      console.error(err);
      alert('No se pudo enviar la incidencia. Inténtalo de nuevo.');
      setSubmitting(false);
    }
  }, [coords, capture, container, incident, note, binId, addReport, router]);

  const selectNearby = (n: NearbyBin) => {
    setBinId(n.bin.id);
    setContainer(n.bin.type);
    setManualType(false);
  };

  if (booting) {
    return (
      <CitizenLayout title="EcoChicharro · Reportar">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkMid, fontSize: 13 }}>
          Cargando…
        </div>
      </CitizenLayout>
    );
  }

  // ----- STEP: CAPTURE (solo flujo "Reportar" con cámara) -----
  if (step === 'capture') {
    return (
      <CitizenLayout title="EcoChicharro · Reportar">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <div style={{
          position: 'absolute', inset: `0 0 ${NAV_HEIGHT}px 0`,
          background: 'linear-gradient(180deg, #16314a 0%, #0d1f30 100%)',
          color: '#fff', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            width: 76, height: 76, borderRadius: 20, background: 'rgba(255,255,255,.1)',
            border: '1px solid rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22,
          }}>
            <Icon name="camera" size={36} color="#fff" />
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, textAlign: 'center' }}>Reportar incidencia</h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.65)', textAlign: 'center', marginTop: 8, maxWidth: 280, lineHeight: 1.5 }}>
            Haz una foto del contenedor o el residuo. Se adjuntará tu ubicación automáticamente.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18,
            background: 'rgba(46,139,87,.9)', padding: '5px 12px', borderRadius: 999,
            fontSize: 11.5, fontWeight: 600,
          }}>
            <Icon name="locate" size={12} color="#fff" /> GPS activo · Santa Cruz
          </div>

          <button
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            style={{
              marginTop: 34, width: 84, height: 84, borderRadius: 999,
              background: '#fff', border: '5px solid rgba(255,255,255,.35)',
              cursor: busy ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Tomar foto"
          >
            <span style={{
              width: 62, height: 62, borderRadius: 999, background: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {busy ? <Icon name="dot" size={20} color="#fff" /> : <Icon name="camera" size={26} color="#fff" />}
            </span>
          </button>
          <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
            {busy ? 'Procesando…' : 'Toca para fotografiar el contenedor'}
          </div>

          {captureError && (
            <div style={{
              marginTop: 18, maxWidth: 300, textAlign: 'center',
              background: 'rgba(220,53,69,.18)', border: '1px solid rgba(220,53,69,.4)',
              color: '#ffd9dd', borderRadius: 10, padding: '9px 12px',
              fontSize: 12, lineHeight: 1.5,
            }}>
              {captureError}
            </div>
          )}
        </div>
      </CitizenLayout>
    );
  }

  // ----- STEP: FORM -----
  return (
    <CitizenLayout title="EcoChicharro · Nuevo reporte" hideNav>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 64, zIndex: 5,
        padding: '0 12px', background: '#fff', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={() => (fromBubble ? router.back() : setStep('capture'))}
          style={{ background: 'transparent', border: 'none', padding: 6, color: T.ink, cursor: 'pointer' }}
          aria-label="Volver"
        >
          <Icon name="arrow-l" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: T.ink }}>Nuevo reporte</div>
          <div style={{ fontSize: 11, color: T.inkMid }}>Detalles de la incidencia</div>
        </div>
      </div>

      {/* Body */}
      <div className="thin-scroll" style={{ position: 'absolute', inset: '64px 0 76px 0', overflowY: 'auto', padding: 16 }}>
        {/* Photo preview (solo flujo cámara) */}
        {capture ? (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`, position: 'relative' }}>
            <img src={capture.photo} alt="Foto capturada" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
            <button
              onClick={() => setStep('capture')}
              style={{
                position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.5)', color: '#fff',
                border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
              }}
            >
              Volver a tomar
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px',
            background: T.primaryMist, border: `1px solid ${T.border}`, borderRadius: 10,
          }}>
            <Icon name="pin" size={18} color={T.primary} />
            <div style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.4 }}>
              Reporte rápido sobre el contenedor seleccionado. No hace falta foto.
            </div>
          </div>
        )}

        {/* Contenedores cercanos (flujo cámara) */}
        {!fromBubble && nearby.length > 0 && !manualType && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, flex: 1 }}>Contenedor más cercano</span>
              <button
                onClick={() => { setManualType(true); setBinId(null); }}
                style={{ background: 'transparent', border: 'none', color: T.primary, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              >
                No aparece
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {nearby.map((n) => {
                const active = binId === n.bin.id;
                const meta = containerMeta(n.bin.type);
                return (
                  <button
                    key={n.bin.id}
                    onClick={() => selectNearby(n)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                      background: active ? T.primaryTint : '#fff',
                      border: `1px solid ${active ? T.primary : T.border}`,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{
                      width: 30, height: 30, borderRadius: 999, background: meta.color + '22', color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 30px',
                    }}>
                      <Icon name={meta.icon as Parameters<typeof Icon>[0]['name']} size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: T.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.bin.address}</div>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: active ? T.primary : T.inkMid, flex: '0 0 auto' }}>
                      {n.distM} m
                    </span>
                    {active && <Icon name="check" size={16} color={T.primary} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Container type — manual (burbuja: solo lectura; cámara sin cercanos: rejilla) */}
        {(fromBubble || manualType || nearby.length === 0) && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, flex: 1 }}>Tipo de contenedor</span>
              {!fromBubble && manualType && nearby.length > 0 && (
                <button
                  onClick={() => { setManualType(false); selectNearby(nearby[0]); }}
                  style={{ background: 'transparent', border: 'none', color: T.primary, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                >
                  Ver cercanos
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {CONTAINERS.map((c) => {
                const active = container === c.type;
                return (
                  <button
                    key={c.type}
                    disabled={fromBubble}
                    onClick={() => { setContainer(c.type); if (!fromBubble) setBinId(null); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '10px 4px', borderRadius: 10,
                      background: active ? T.primaryTint : '#fff',
                      border: `1px solid ${active ? T.primary : T.border}`,
                      cursor: fromBubble ? 'default' : 'pointer',
                      opacity: fromBubble && !active ? 0.5 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 999, background: c.color + '22', color: c.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={(c.icon as never)} size={16} />
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: T.ink, textAlign: 'center' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Incident type */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>¿Qué ocurre?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {INCIDENTS.map((inc) => {
              const active = incident === inc.type;
              return (
                <button
                  key={inc.type}
                  onClick={() => setIncident(inc.type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10,
                    background: active ? T.primaryTint : '#fff',
                    border: `1px solid ${active ? T.primary : T.border}`,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: active ? T.primary : T.appBg,
                    color: active ? '#fff' : T.inkMid,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={(inc.icon as never)} size={16} />
                  </span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{inc.label}</span>
                  {active && <Icon name="check" size={18} color={T.primary} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location mini-map */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Ubicación</div>
          <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            {coords && (
              <MapView
                bins={[{ id: 'capture', type: container, lat: coords.lat, lng: coords.lng, address: '', area: '' }]}
              />
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: T.inkMid, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="pin" size={12} />
            {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : ''}
          </div>
          {geoNotice && (
            <div style={{
              marginTop: 6, fontSize: 11.5, lineHeight: 1.5,
              color: '#8a5a00', background: '#fff5e0', border: '1px solid #f0d28a',
              borderRadius: 8, padding: '7px 10px',
            }}>
              {geoNotice}
            </div>
          )}
        </div>

        {/* Comment */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
            Comentario <span style={{ color: T.inkMid, fontWeight: 400 }}>(opcional)</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Añade detalles del problema…"
            style={{
              width: '100%', minHeight: 70, padding: '10px 12px',
              border: `1px solid ${T.border}`, borderRadius: 10,
              fontSize: 13, color: T.ink, resize: 'none', background: '#fff', outline: 'none',
            }}
          />
        </div>

        {/* Priority pill */}
        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 10,
          background: pm.color + '15', border: `1px solid ${pm.color}40`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: pm.color }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>
              Prioridad <span style={{ color: pm.color }}>{pm.label.toLowerCase()}</span>
            </div>
            <div style={{ fontSize: 11, color: T.inkMid }}>Calculada según el tipo de incidencia.</div>
          </div>
        </div>
      </div>

      {/* Submit footer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px',
        background: '#fff', borderTop: `1px solid ${T.border}`, zIndex: 5,
      }}>
        <Button kind="primary" size="lg" full disabled={submitting} onClick={submit}>
          {submitting ? 'Enviando…' : 'Enviar incidencia'}
        </Button>
      </div>
    </CitizenLayout>
  );
}

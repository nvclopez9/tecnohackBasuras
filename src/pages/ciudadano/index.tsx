import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useCallback, useEffect } from 'react';
import CameraButton, { CaptureResult } from '@/components/CameraButton';
import ReportForm from '@/components/ReportForm';
import ReportDetail from '@/components/ReportDetail';
import { useReports } from '@/hooks/useReports';
import { getRole, addMyReportId } from '@/lib/storage';
import { ContainerType, IncidentType, Report } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw', height: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', color: 'var(--muted)',
      fontFamily: 'var(--font-mono)',
    }}>
      Cargando mapa…
    </div>
  ),
});

export default function CiudadanoPage() {
  const router = useRouter();
  const { reports, addReport, updateReport } = useReports({ poll: false });
  const [capture, setCapture] = useState<CaptureResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (getRole() !== 'ciudadano') router.replace('/');
  }, [router]);

  const handleCapture = useCallback((result: CaptureResult) => {
    setCapture(result);
  }, []);

  const handleSubmit = useCallback(
    async (data: {
      photo: string; thumbnail: string;
      lat: number; lng: number;
      containerType: ContainerType; incidentType: IncidentType;
      description: string;
    }) => {
      const report = await addReport(data);
      addMyReportId(report.id);
      setCapture(null);
    },
    [addReport]
  );

  const selectedReport = reports.find(r => r.id === selectedId) ?? null;

  const handleUpdate = useCallback(
    async (changes: { status?: import('@/types').ReportStatus; assignee?: string }) => {
      if (!selectedId) return;
      await updateReport(selectedId, changes);
    },
    [selectedId, updateReport]
  );

  return (
    <>
      <Head>
        <title>EcoChicharro · Ciudadano</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'linear-gradient(to bottom, rgba(13,15,26,0.95), transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '1.3rem', letterSpacing: '-0.01em',
          }}>
            ♻️ EcoChicharro
          </span>
          <span style={{
            display: 'block', fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem', color: 'var(--muted)',
          }}>
            CIUDADANO · {reports.length} reportes activos
          </span>
        </div>
        <button
          onClick={() => router.push('/ciudadano/mis-reportes')}
          style={{
            padding: '6px 14px',
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: '20px', color: 'var(--accent)',
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
            pointerEvents: 'auto',
          }}
        >
          Mis reportes
        </button>
      </div>

      {/* Map */}
      <div style={{ position: 'fixed', inset: 0 }}>
        <MapView
          reports={reports}
          onMarkerClick={id => setSelectedId(id)}
        />
      </div>

      {/* Camera FAB */}
      {!capture && (
        <CameraButton onCapture={handleCapture} />
      )}

      {/* Back to home */}
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'fixed', bottom: '1.8rem', left: '1.5rem', zIndex: 900,
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'rgba(13,15,26,0.8)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(240,242,255,0.6)', fontSize: '1rem',
        }}
        aria-label="Volver"
      >
        ←
      </button>

      {/* Report form modal */}
      {capture && (
        <ReportForm
          capture={capture}
          onSubmit={handleSubmit}
          onCancel={() => setCapture(null)}
        />
      )}

      {/* Report detail modal */}
      {selectedReport && (
        <ReportDetail
          report={selectedReport}
          role="ciudadano"
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}

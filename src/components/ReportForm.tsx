import { useState, useCallback } from 'react';
import { CONTAINERS, INCIDENTS, priorityMeta } from '@/lib/constants';
import { priorityFor } from '@/lib/priority';
import { IncidentType, ContainerType } from '@/types';
import { CaptureResult } from './CameraButton';

interface Props {
  capture: CaptureResult;
  onSubmit: (data: {
    photo: string;
    thumbnail: string;
    lat: number;
    lng: number;
    containerType: ContainerType;
    incidentType: IncidentType;
    description: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    backdropFilter: 'blur(6px)',
  },
  sheet: {
    width: '100%', maxWidth: '540px',
    background: '#16213e',
    borderRadius: '24px 24px 0 0',
    maxHeight: '92dvh',
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.1)',
    borderBottom: 'none',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem', letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'rgba(240,242,255,0.4)',
    marginBottom: '8px',
  },
};

export default function ReportForm({ capture, onSubmit, onCancel }: Props) {
  const [containerType, setContainerType] = useState<ContainerType | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const priority = incidentType ? priorityFor(incidentType) : null;
  const pm = priority ? priorityMeta(priority) : null;

  const canSubmit = containerType && incidentType && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        photo: capture.photo,
        thumbnail: capture.thumbnail,
        lat: capture.lat,
        lng: capture.lng,
        containerType,
        incidentType,
        description,
      });
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, capture, containerType, incidentType, description, onSubmit]);

  return (
    <div style={S.overlay}>
      <div style={S.sheet}>
        {/* Handle + header */}
        <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
          <div style={{
            width: '40px', height: '4px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.2)', margin: '0 auto 14px',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={capture.photo}
              alt="Foto capturada"
              style={{
                width: '60px', height: '60px', objectFit: 'cover',
                borderRadius: '10px', border: '2px solid rgba(0,255,136,0.4)',
              }}
            />
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem', fontWeight: 800, marginBottom: '2px',
              }}>
                Nueva incidencia
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {capture.lat.toFixed(4)}, {capture.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>

          {/* Container type */}
          <div style={{ marginBottom: '1.2rem' }}>
            <p style={S.label}>Tipo de contenedor</p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px',
            }}>
              {CONTAINERS.map(c => {
                const active = containerType === c.type;
                return (
                  <button
                    key={c.type}
                    onClick={() => setContainerType(c.type)}
                    style={{
                      padding: '8px 4px', borderRadius: '10px',
                      border: `2px solid ${active ? c.color : 'transparent'}`,
                      background: active ? `${c.color}22` : '#1c2a4a',
                      color: active ? c.color : 'rgba(240,242,255,0.6)',
                      fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                      lineHeight: 1.3, textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      display: 'block', width: '16px', height: '16px',
                      borderRadius: '50%', background: c.color,
                      margin: '0 auto 4px',
                    }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Incident type */}
          <div style={{ marginBottom: '1.2rem' }}>
            <p style={S.label}>Tipo de incidencia</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {INCIDENTS.map(i => {
                const active = incidentType === i.type;
                const p = priorityFor(i.type);
                const pm2 = priorityMeta(p);
                return (
                  <button
                    key={i.type}
                    onClick={() => setIncidentType(i.type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '10px',
                      border: `1px solid ${active ? pm2.color : 'rgba(255,255,255,0.08)'}`,
                      background: active ? `${pm2.color}15` : '#1c2a4a',
                      color: '#f0f2ff', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{i.icon}</span>
                    <span style={{ flex: 1, fontSize: '0.88rem' }}>{i.label}</span>
                    <span
                      className="badge"
                      style={{
                        background: `${pm2.color}22`,
                        color: pm2.color,
                        border: `1px solid ${pm2.color}55`,
                        fontSize: '0.65rem',
                      }}
                    >
                      {pm2.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={S.label}>Descripción (opcional)</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Añade detalles del problema..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px',
                background: '#0d0f1a', color: '#f0f2ff',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
                fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                resize: 'none',
              }}
            />
          </div>

          {/* Priority preview */}
          {pm && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px', borderRadius: '10px',
              background: `${pm.color}15`, border: `1px solid ${pm.color}33`,
              marginBottom: '1rem',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--muted)' }}>
                PRIORIDAD CALCULADA
              </span>
              <span className="badge" style={{
                background: `${pm.color}22`, color: pm.color, border: `1px solid ${pm.color}55`,
              }}>
                {pm.label}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
                color: 'var(--muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                flex: 2, padding: '14px',
                background: canSubmit ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: '12px',
                color: canSubmit ? '#0d0f1a' : 'var(--muted)',
                fontSize: '0.95rem', fontFamily: 'var(--font-display)',
                fontWeight: 700, letterSpacing: '0.02em',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Enviando…' : 'Enviar reporte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

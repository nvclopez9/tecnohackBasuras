import { useEffect, useCallback, useState } from 'react';
import { Report, Comment, Role } from '@/types';
import {
  containerMeta,
  incidentMeta,
  statusMeta,
  priorityMeta,
  STATUSES,
  TEAMS,
} from '@/lib/constants';

interface Props {
  report: Report;
  role: Role;
  onClose: () => void;
  onUpdate: (changes: { status?: import('@/types').ReportStatus; assignee?: string }) => Promise<void>;
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  sheet: {
    width: '100%', maxWidth: '560px',
    background: '#16213e',
    borderRadius: '20px 20px 0 0',
    maxHeight: '92dvh',
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.1)',
    borderBottom: 'none',
  },
  handle: {
    width: '40px', height: '4px', borderRadius: '2px',
    background: 'rgba(255,255,255,0.2)',
    margin: '12px auto 0',
    flexShrink: 0,
  },
  scrollBody: {
    flex: 1, overflowY: 'auto', padding: '1rem',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem', letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'rgba(240,242,255,0.4)',
    marginBottom: '4px',
  },
  value: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem', fontWeight: 600,
  },
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="badge"
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {label}
    </span>
  );
}

export default function ReportDetail({ report, role, onClose, onUpdate }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const cm = containerMeta(report.containerType);
  const im = incidentMeta(report.incidentType);
  const sm = statusMeta(report.status);
  const pm = priorityMeta(report.priority);

  useEffect(() => {
    fetch(`/api/reports/${report.id}/comments`)
      .then(r => r.json())
      .then(setComments)
      .catch(() => {});
  }, [report.id]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const sendComment = useCallback(async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText, authorRole: role }),
      });
      const c: Comment = await res.json();
      setComments(prev => [...prev, c]);
      setCommentText('');
    } finally {
      setSending(false);
    }
  }, [commentText, report.id, role]);

  const handleStatus = useCallback(
    async (status: import('@/types').ReportStatus) => {
      setUpdating(true);
      await onUpdate({ status });
      setUpdating(false);
    },
    [onUpdate]
  );

  const handleAssign = useCallback(
    async (assignee: string) => {
      setUpdating(true);
      await onUpdate({ assignee });
      setUpdating(false);
    },
    [onUpdate]
  );

  const date = new Date(report.createdAt).toLocaleString('es-ES');

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.handle} />

        {/* Header image strip */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={report.photo}
            alt="Foto del incidente"
            style={{
              width: '100%', maxHeight: '240px',
              objectFit: 'cover', display: 'block',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, #16213e)',
          }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: '50%', width: '32px', height: '32px',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
          {/* Title overlay */}
          <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: '1.4rem',
              letterSpacing: '-0.01em',
              textShadow: '0 1px 8px rgba(0,0,0,0.8)',
              marginBottom: '6px',
            }}>
              {im.icon} {im.label}
            </h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
              <Badge label={cm.label} color={cm.color} />
              <Badge label={sm.label} color={sm.color} />
              <Badge
                label={pm.label}
                color={pm.color}
              />
            </div>
          </div>
        </div>

        <div style={S.scrollBody}>
          {/* Meta */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '12px', marginBottom: '1rem',
          }}>
            <div>
              <p style={S.label}>Fecha</p>
              <p style={{ ...S.value, fontSize: '0.85rem' }}>{date}</p>
            </div>
            <div>
              <p style={S.label}>Coordenadas</p>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: 'rgba(240,242,255,0.7)',
              }}>
                {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
              </p>
            </div>
            {report.assignee && (
              <div>
                <p style={S.label}>Asignado a</p>
                <p style={S.value}>{report.assignee}</p>
              </div>
            )}
            {report.description && (
              <div style={{ gridColumn: '1/-1' }}>
                <p style={S.label}>Descripción</p>
                <p style={{ fontSize: '0.9rem', color: 'rgba(240,242,255,0.8)' }}>
                  {report.description}
                </p>
              </div>
            )}
          </div>

          {/* Municipal controls */}
          {role === 'municipal' && (
            <div style={{
              background: '#1c2a4a', borderRadius: '10px',
              padding: '1rem', marginBottom: '1rem',
            }}>
              <p style={{ ...S.label, marginBottom: '10px' }}>Cambiar estado</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {STATUSES.map(s => (
                  <button
                    key={s.status}
                    disabled={updating || report.status === s.status}
                    onClick={() => handleStatus(s.status)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px',
                      border: `1px solid ${s.color}`,
                      background: report.status === s.status ? `${s.color}33` : 'transparent',
                      color: s.color, fontSize: '0.82rem',
                      opacity: updating ? 0.5 : 1,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <p style={{ ...S.label, marginTop: '12px', marginBottom: '8px' }}>Asignar equipo</p>
              <select
                value={report.assignee}
                disabled={updating}
                onChange={e => handleAssign(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: '#0d0f1a', color: '#f0f2ff',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                }}
              >
                <option value="">Sin asignar</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Comments */}
          <div>
            <p style={{ ...S.label, marginBottom: '10px' }}>
              Historial · {comments.length} comentarios
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {comments.length === 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Sin comentarios todavía.</p>
              )}
              {comments.map(c => (
                <div key={c.id} style={{
                  background: '#0d0f1a', borderRadius: '8px', padding: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.7rem', color: c.authorRole === 'municipal' ? '#2f6fb0' : '#00c96b',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {c.authorRole === 'municipal' ? '🛠 Municipal' : '👤 Ciudadano'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                      {new Date(c.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Añadir comentario..."
                rows={2}
                style={{
                  flex: 1, padding: '8px 12px',
                  background: '#0d0f1a', color: '#f0f2ff',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                  resize: 'none',
                }}
              />
              <button
                onClick={sendComment}
                disabled={sending || !commentText.trim()}
                style={{
                  padding: '8px 14px', borderRadius: '8px',
                  background: commentText.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  color: commentText.trim() ? '#0d0f1a' : 'var(--muted)',
                  border: 'none', fontWeight: 700, fontSize: '0.85rem',
                  alignSelf: 'flex-end',
                }}
              >
                {sending ? '…' : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

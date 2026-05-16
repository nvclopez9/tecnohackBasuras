import { useState, useEffect, useCallback } from 'react';
import { THEME } from '@/lib/theme';
import { Badge, PriorityTag, Button } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { containerMeta, incidentMeta, statusMeta, STATUSES, TEAMS } from '@/lib/constants';
import { Report, Comment, ReportStatus } from '@/types';

const T = THEME;

interface Props {
  report: Report;
  onClose?: () => void;
  onUpdated: (r: Report) => void;
}

export default function DetailPanel({ report, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [assignee, setAssignee] = useState(report.assignee);
  const [note, setNote] = useState(report.resolutionNote);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(report.status);
    setAssignee(report.assignee);
    setNote(report.resolutionNote);
    fetch(`/api/reports/${report.id}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => setComments([]));
  }, [report.id, report.status, report.assignee, report.resolutionNote]);

  const cMeta = containerMeta(report.containerType);
  const sMeta = statusMeta(report.status);
  const iMeta = incidentMeta(report.incidentType);

  const dirty =
    status !== report.status || assignee !== report.assignee || note !== report.resolutionNote;

  const save = useCallback(async () => {
    setSaving(true);
    const res = await fetch(`/api/reports/${report.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assignee, resolutionNote: note }),
    });
    if (res.ok) onUpdated(await res.json());
    setSaving(false);
  }, [report.id, status, assignee, note, onUpdated]);

  const sendComment = useCallback(async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/reports/${report.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText, authorRole: 'municipal' }),
    });
    if (res.ok) {
      const created: Comment = await res.json();
      setComments((prev) => [...prev, created]);
      setCommentText('');
    }
  }, [report.id, commentText]);

  return (
    <div className="thin-scroll" style={{ height: '100%', overflowY: 'auto' }}>
      {/* Photo */}
      <div style={{ position: 'relative', height: 170 }}>
        {report.photo ? (
          <img src={report.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${cMeta.color}66, ${cMeta.color}22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: cMeta.color,
          }}>
            <Icon name={containerIconName(report.containerType)} size={56} />
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 999,
              background: 'rgba(255,255,255,.94)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink,
            }}
            aria-label="Cerrar"
          >
            <Icon name="x" size={14} />
          </button>
        )}
        <span style={{
          position: 'absolute', bottom: 10, left: 12, fontSize: 10.5, color: '#fff', fontWeight: 600,
          background: 'rgba(0,0,0,.5)', padding: '3px 8px', borderRadius: 4,
        }}>
          {report.code}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <Badge color={sMeta.color} label={sMeta.label} />
          <PriorityTag priority={report.priority} size="sm" />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>{iMeta.label}</div>
        <div style={{ fontSize: 12, color: T.inkMid, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: cMeta.color }} />
          Contenedor de {cMeta.label.toLowerCase()} · {report.address || report.area}
        </div>

        {report.description && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: T.ink, background: T.appBg, borderRadius: 8, padding: 10, lineHeight: 1.5 }}>
            {report.description}
          </div>
        )}

        {/* meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 14, borderRadius: 8, overflow: 'hidden', background: T.border }}>
          {[
            ['Zona', report.area],
            ['Recibida', new Date(report.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })],
            ['Coordenadas', `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`],
            ['Última act.', new Date(report.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#fff', padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</div>
              <div style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* status */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            Cambiar estado
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUSES.map((s) => {
              const active = status === s.status;
              return (
                <button
                  key={s.status}
                  onClick={() => setStatus(s.status)}
                  style={{
                    flex: 1, padding: '8px 6px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                    border: `1px solid ${active ? s.color : T.border}`,
                    background: active ? s.color + '18' : '#fff',
                    color: active ? s.color : T.ink, cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* assignee */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            Equipo asignado
          </div>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
              fontSize: 12.5, color: T.ink, background: '#fff', outline: 'none',
            }}
          >
            <option value="">Sin asignar</option>
            {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* resolution note */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            Nota de resolución
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe la acción tomada…"
            style={{
              width: '100%', minHeight: 70, padding: '10px 12px', borderRadius: 8,
              border: `1px solid ${T.border}`, fontSize: 12.5, color: T.ink, resize: 'none', outline: 'none',
            }}
          />
        </div>

        <Button kind="primary" size="md" full disabled={!dirty || saving} onClick={save} style={{ marginTop: 12 }}>
          {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Sin cambios'}
        </Button>

        {/* comments */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Comentarios · {comments.length}
          </div>
          {comments.map((c) => (
            <div key={c.id} style={{ background: T.appBg, borderRadius: 8, padding: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: T.ink, lineHeight: 1.5 }}>{c.text}</div>
              <div style={{ fontSize: 10, color: T.inkMid, marginTop: 4 }}>
                {c.authorRole === 'municipal' ? 'Municipal' : 'Ciudadano'} ·{' '}
                {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendComment(); }}
              placeholder="Añadir comentario…"
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
                fontSize: 12.5, outline: 'none',
              }}
            />
            <Button kind="primary" size="sm" icon={<Icon name="send" size={13} />} onClick={sendComment}>
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

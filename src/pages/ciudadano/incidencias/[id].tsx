import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import CitizenLayout from '@/components/citizen/CitizenLayout';
import { Badge, PriorityTag, Button } from '@/components/ui/primitives';
import { Icon, containerIconName } from '@/components/ui/Icon';
import { THEME } from '@/lib/theme';
import { CONTAINERS, INCIDENTS, containerMeta, incidentMeta, statusMeta } from '@/lib/constants';
import { Report, Comment, ContainerType, IncidentType } from '@/types';

const T = THEME;
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function DetallePage() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async (rid: string) => {
    const res = await fetch(`/api/reports/${rid}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    setReport(await res.json());
    const cres = await fetch(`/api/reports/${rid}/comments`);
    if (cres.ok) setComments(await cres.json());
  }, []);

  useEffect(() => {
    if (typeof id === 'string') load(id);
  }, [id, load]);

  if (notFound) {
    return (
      <CitizenLayout title="EcoChicharro" hideNav>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <p style={{ color: T.inkMid }}>Incidencia no encontrada.</p>
          <Button kind="secondary" size="md" onClick={() => router.push('/ciudadano/incidencias')}>Volver</Button>
        </div>
      </CitizenLayout>
    );
  }

  if (!report) {
    return (
      <CitizenLayout title="EcoChicharro" hideNav>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkMid }}>
          Cargando…
        </div>
      </CitizenLayout>
    );
  }

  const cMeta = containerMeta(report.containerType);
  const sMeta = statusMeta(report.status);
  const iMeta = incidentMeta(report.incidentType);
  const isResolved = report.status === 'resuelto';
  const isProcessing = report.status !== 'pendiente';

  const timeline = [
    {
      label: 'Reporte enviado', sub: 'Incidencia registrada', done: true,
      dot: statusMeta('pendiente').color,
      time: new Date(report.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    },
    {
      label: 'Recibido por el municipio',
      sub: report.assignee ? `Asignado a ${report.assignee}` : 'En revisión',
      done: isProcessing, dot: statusMeta('en_proceso').color,
      time: isProcessing ? new Date(report.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—',
    },
    {
      label: isResolved ? 'Incidencia resuelta' : 'Resolución pendiente',
      sub: isResolved ? 'Actuación completada' : '',
      done: isResolved, dot: statusMeta('resuelto').color,
      time: isResolved ? new Date(report.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—',
    },
  ];

  return (
    <CitizenLayout title={`EcoChicharro · ${report.code}`} hideNav>
      {/* Photo header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}>
        {report.photo ? (
          <img src={report.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${cMeta.color}80, ${cMeta.color}33)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: 999, background: 'rgba(255,255,255,.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: cMeta.color,
            }}>
              <Icon name={containerIconName(report.containerType)} size={46} />
            </div>
          </div>
        )}
        <div style={{ position: 'absolute', top: 16, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.push('/ciudadano/incidencias')}
            style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink }}
            aria-label="Volver"
          >
            <Icon name="arrow-l" size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="thin-scroll" style={{ position: 'absolute', inset: '226px 0 0 0', overflowY: 'auto' }}>
        <div style={{ background: T.appBg, borderRadius: '16px 16px 0 0', padding: 16, minHeight: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={sMeta.color} label={sMeta.label} />
            <PriorityTag priority={report.priority} size="sm" />
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: T.inkMid, fontWeight: 600 }}>{report.code}</span>
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: T.ink, margin: '10px 0 4px', lineHeight: 1.2 }}>
            {iMeta.label}
          </h1>
          <div style={{ fontSize: 13, color: T.inkMid, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: cMeta.color }} />
            Contenedor de {cMeta.label.toLowerCase()} · {report.address || report.area}
          </div>

          {report.description && (
            <div style={{ marginTop: 12, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, fontSize: 13, color: T.ink, lineHeight: 1.5 }}>
              {report.description}
            </div>
          )}

          {/* Timeline */}
          <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>
              Historial
            </div>
            {timeline.map((it, i, a) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i === a.length - 1 ? 0 : 14, opacity: it.done ? 1 : 0.45 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: it.done ? it.dot : '#fff', border: `2px solid ${it.dot}` }} />
                  {i < a.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 24, background: T.border, marginTop: 2 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{it.label}</div>
                  {it.sub && <div style={{ fontSize: 11.5, color: T.inkMid, marginTop: 1 }}>{it.sub}</div>}
                  <div style={{ fontSize: 10.5, color: T.inkLight, marginTop: 2 }}>{it.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                Comentarios del municipio
              </div>
              {comments.map((c) => (
                <div key={c.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>{c.text}</div>
                  <div style={{ fontSize: 10.5, color: T.inkMid, marginTop: 6 }}>
                    {c.authorRole === 'municipal' ? 'Servicio Municipal de Limpieza' : 'Ciudadano'} ·{' '}
                    {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolution note */}
          {isResolved && report.resolutionNote && (
            <div style={{ marginTop: 14, background: '#EAF6EE', border: `1px solid ${T.success}40`, borderLeft: `4px solid ${T.success}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: T.success, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                Comentario de resolución
              </div>
              <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>{report.resolutionNote}</div>
            </div>
          )}

          {/* Mini-map */}
          <div style={{ marginTop: 14, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Ubicación</span>
              <span style={{ fontSize: 11.5, color: T.inkMid }}>{report.area}</span>
            </div>
            <div style={{ height: 140 }}>
              <MapView bins={[{ id: report.id, type: report.containerType, lat: report.lat, lng: report.lng, address: report.address, area: report.area }]} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, margin: '14px 0 30px' }}>
            <Button kind="secondary" size="md" full icon={<Icon name="edit" size={15} />} onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button kind="danger" size="md" icon={<Icon name="trash" size={15} />} onClick={() => setConfirmDelete(true)}>
              Borrar
            </Button>
          </div>
        </div>
      </div>

      {editing && (
        <EditSheet
          report={report}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { setReport(updated); setEditing(false); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDelete
          code={report.code}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await fetch(`/api/reports/${report.id}`, { method: 'DELETE' });
            router.push('/ciudadano/incidencias');
          }}
        />
      )}
    </CitizenLayout>
  );
}

// ---------- Edit bottom sheet ----------
function EditSheet({
  report, onClose, onSaved,
}: { report: Report; onClose: () => void; onSaved: (r: Report) => void }) {
  const [container, setContainer] = useState<ContainerType>(report.containerType);
  const [incident, setIncident] = useState<IncidentType>(report.incidentType);
  const [description, setDescription] = useState(report.description);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/reports/${report.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ containerType: container, incidentType: incident, description }),
    });
    if (res.ok) onSaved(await res.json());
    else setSaving(false);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div
        className="thin-scroll"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', background: '#fff', borderRadius: '18px 18px 0 0', padding: 16, maxHeight: '88%', overflowY: 'auto' }}
      >
        <div style={{ width: 36, height: 4, background: T.border, borderRadius: 999, margin: '0 auto 14px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 14 }}>Editar incidencia</div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Tipo de contenedor</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {CONTAINERS.map((c) => {
            const active = container === c.type;
            return (
              <button key={c.type} onClick={() => setContainer(c.type)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '9px 4px',
                borderRadius: 9, background: active ? T.primaryTint : '#fff',
                border: `1px solid ${active ? T.primary : T.border}`, cursor: 'pointer',
              }}>
                <span style={{ width: 24, height: 24, borderRadius: 999, background: c.color + '22', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={containerIconName(c.type)} size={14} />
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.ink }}>{c.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, margin: '16px 0 8px' }}>Tipo de incidencia</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {INCIDENTS.map((inc) => {
            const active = incident === inc.type;
            return (
              <button key={inc.type} onClick={() => setIncident(inc.type)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9,
                background: active ? T.primaryTint : '#fff', border: `1px solid ${active ? T.primary : T.border}`,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <Icon name={(inc.icon as never)} size={16} color={active ? T.primary : T.inkMid} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.ink }}>{inc.label}</span>
                {active && <Icon name="check" size={16} color={T.primary} />}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, margin: '16px 0 8px' }}>Comentario</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles…"
          style={{ width: '100%', minHeight: 64, padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none' }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button kind="ghost" size="md" full onClick={onClose}>Cancelar</Button>
          <Button kind="primary" size="md" full disabled={saving} onClick={save}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Confirm delete ----------
function ConfirmDelete({
  code, onCancel, onConfirm,
}: { code: string; onCancel: () => void; onConfirm: () => void }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 20, maxWidth: 320, width: '100%' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Borrar incidencia</div>
        <div style={{ fontSize: 13, color: T.inkMid, marginTop: 8, lineHeight: 1.5 }}>
          ¿Seguro que quieres borrar la incidencia {code}? Esta acción no se puede deshacer.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <Button kind="ghost" size="md" full onClick={onCancel}>Cancelar</Button>
          <Button
            kind="danger" size="md" full disabled={deleting}
            onClick={() => { setDeleting(true); onConfirm(); }}
          >
            {deleting ? 'Borrando…' : 'Borrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

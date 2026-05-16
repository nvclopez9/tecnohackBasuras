import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import CitizenLayout, { NAV_HEIGHT } from '@/components/citizen/CitizenLayout';
import { Chip, ContainerChip, Button } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useBins } from '@/hooks/useBins';
import { THEME } from '@/lib/theme';
import { CONTAINERS, containerMeta } from '@/lib/constants';
import { Bin, ContainerType } from '@/types';

const T = THEME;

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#eaeaea', color: T.inkMid, fontSize: 13,
    }}>
      Cargando mapa…
    </div>
  ),
});

export default function CiudadanoHome() {
  const router = useRouter();
  const { bins } = useBins();
  const [filter, setFilter] = useState<Set<ContainerType>>(new Set());
  const [selected, setSelected] = useState<Bin | null>(null);

  const toggle = (type: ContainerType) => {
    setFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filterSet = useMemo(() => (filter.size === 0 ? null : filter), [filter]);

  return (
    <CitizenLayout title="EcoChicharro · Inicio">
      {/* MAP */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView
          bins={bins}
          containerFilter={filterSet}
          selectedId={selected?.id}
          onBinClick={(b) => setSelected(b)}
        />
      </div>

      {/* TOP HEADER */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          padding: '16px 16px 14px',
          background: 'linear-gradient(180deg, rgba(246,248,250,.97) 62%, rgba(246,248,250,0))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: T.primary,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16,
          }}>Ec</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>EcoChicharro</div>
            <div style={{ fontSize: 11, color: T.inkMid }}>Santa Cruz de Tenerife</div>
          </div>
          <button
            style={{
              width: 36, height: 36, borderRadius: 999, background: '#fff',
              border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: T.ink, cursor: 'pointer',
            }}
            aria-label="Notificaciones"
          >
            <Icon name="bell" size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '9px 12px',
          boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        }}>
          <Icon name="search" size={16} color={T.inkMid} />
          <input
            placeholder="Buscar calle, plaza, contenedor…"
            style={{
              border: 'none', outline: 'none', flex: 1, fontSize: 13.5,
              color: T.ink, background: 'transparent',
            }}
          />
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div style={{ position: 'absolute', top: 122, left: 0, right: 0, zIndex: 18, padding: '0 14px' }}>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
          <Chip label="Todos" active={filter.size === 0} onClick={() => setFilter(new Set())} size="sm" />
          {CONTAINERS.map((c) => (
            <ContainerChip key={c.type} type={c.type} active={filter.has(c.type)} onClick={() => toggle(c.type)} size="sm" />
          ))}
        </div>
      </div>

      {/* COUNT PILL */}
      <div style={{
        position: 'absolute', left: 14, bottom: NAV_HEIGHT + (selected ? 0 : 16), zIndex: 18,
        display: selected ? 'none' : 'flex', alignItems: 'center', gap: 6,
        background: '#fff', border: `1px solid ${T.border}`, borderRadius: 999,
        padding: '7px 12px', boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        fontSize: 12, fontWeight: 600, color: T.ink,
      }}>
        <Icon name="pin" size={13} color={T.primary} />
        {bins.filter((b) => !filterSet || filterSet.has(b.type)).length} papeleras
      </div>

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
                Contenedor de {containerMeta(selected.type).label.toLowerCase()}
              </div>
              <div style={{ fontSize: 12.5, color: T.inkMid, marginTop: 2 }}>
                {selected.address} · {selected.area}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'transparent', border: 'none', color: T.inkMid, cursor: 'pointer' }}
              aria-label="Cerrar"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <Button
            kind="primary" size="md" full
            icon={<Icon name="camera" size={16} />}
            style={{ marginTop: 14 }}
            onClick={() =>
              router.push(`/ciudadano/reportar?binId=${selected.id}&containerType=${selected.type}`)
            }
          >
            Reportar incidencia aquí
          </Button>
        </div>
      )}
    </CitizenLayout>
  );
}

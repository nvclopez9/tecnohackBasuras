import { CONTAINERS, INCIDENTS, STATUSES, PRIORITIES } from '@/lib/constants';

export interface Filters {
  status: string;
  containerType: string;
  incidentType: string;
  priority: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
}

function Chip({
  label, active, color, onClick,
}: {
  label: string; active: boolean; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px', borderRadius: '20px',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
        background: active ? `${color}22` : 'transparent',
        color: active ? color : 'rgba(240,242,255,0.5)',
        fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
        whiteSpace: 'nowrap' as const,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

export default function FilterBar({ filters, onChange, total }: Props) {
  function set(key: keyof Filters, val: string) {
    onChange({ ...filters, [key]: filters[key] === val ? '' : val });
  }

  return (
    <div style={{
      background: '#16213e',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 12px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
          letterSpacing: '0.08em', color: 'rgba(240,242,255,0.4)',
          textTransform: 'uppercase',
        }}>
          FILTROS
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)',
        }}>
          {total} reporte{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '6px', width: 'max-content' }}>
          {STATUSES.map(s => (
            <Chip
              key={s.status}
              label={s.label}
              active={filters.status === s.status}
              color={s.color}
              onClick={() => set('status', s.status)}
            />
          ))}
          <span style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
          {PRIORITIES.map(p => (
            <Chip
              key={p.priority}
              label={p.label}
              active={filters.priority === p.priority}
              color={p.color}
              onClick={() => set('priority', p.priority)}
            />
          ))}
          <span style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
          {CONTAINERS.map(c => (
            <Chip
              key={c.type}
              label={c.label}
              active={filters.containerType === c.type}
              color={c.color}
              onClick={() => set('containerType', c.type)}
            />
          ))}
          <span style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
          {INCIDENTS.map(i => (
            <Chip
              key={i.type}
              label={`${i.icon} ${i.label}`}
              active={filters.incidentType === i.type}
              color="#fff"
              onClick={() => set('incidentType', i.type)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

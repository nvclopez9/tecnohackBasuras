import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { THEME } from '@/lib/theme';
import { Icon, IconName } from '@/components/ui/Icon';
import { CONTAINERS, STATUSES, PRIORITIES, containerMeta } from '@/lib/constants';
import { Report, ContainerType, ReportStatus, Priority } from '@/types';
import { setRole } from '@/lib/storage';
import { useIsMobile } from '@/hooks/useIsMobile';

const T = THEME;

export interface MuniFilters {
  containers: ContainerType[];
  statuses: ReportStatus[];
  priorities: Priority[];
  area: string | null;
}

export const EMPTY_FILTERS: MuniFilters = { containers: [], statuses: [], priorities: [], area: null };

export function applyFilters(reports: Report[], f: MuniFilters): Report[] {
  return reports.filter((r) => {
    if (f.containers.length && !f.containers.includes(r.containerType)) return false;
    if (f.statuses.length && !f.statuses.includes(r.status)) return false;
    if (f.priorities.length && !f.priorities.includes(r.priority)) return false;
    if (f.area && r.area !== f.area) return false;
    return true;
  });
}

export function activeFilterCount(f: MuniFilters): number {
  return f.containers.length + f.statuses.length + f.priorities.length + (f.area ? 1 : 0);
}

const NAV: { id: string; label: string; icon: IconName; href: string }[] = [
  { id: 'dashboard', label: 'Cuadro de mandos', icon: 'cluster', href: '/municipal' },
  { id: 'mapa', label: 'Mapa analítico', icon: 'pin', href: '/municipal/mapa' },
  { id: 'lista', label: 'Incidencias', icon: 'list', href: '/municipal/lista' },
];

// ---------- Topbar ----------
function Topbar({ isMobile, onMenu }: { isMobile: boolean; onMenu: () => void }) {
  return (
    <div style={{
      height: 56, background: '#fff', borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', padding: isMobile ? '0 12px' : '0 20px',
      gap: isMobile ? 10 : 18, flex: '0 0 56px',
    }}>
      {isMobile && (
        <button
          onClick={onMenu}
          aria-label="Menú"
          style={{
            width: 38, height: 38, borderRadius: 8, background: T.appBg,
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: T.ink, flex: '0 0 38px',
          }}
        >
          <Icon name="menu" size={18} />
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6, background: T.primary, color: '#fff',
          fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>Ec</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.05 }}>EcoChicharro</div>
          <div style={{ fontSize: 10.5, color: T.inkMid, letterSpacing: 0.6, textTransform: 'uppercase' }}>Panel Municipal</div>
        </div>
      </div>

      {!isMobile && (
        <>
          <div style={{ height: 24, width: 1, background: T.border }} />
          <div style={{ fontSize: 12.5, color: T.inkMid }}>
            Cabildo Insular de Tenerife · <span style={{ color: T.ink, fontWeight: 600 }}>Servicios de Limpieza</span>
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {!isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, background: T.appBg,
          border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', minWidth: 240,
        }}>
          <Icon name="search" size={14} color={T.inkMid} />
          <input placeholder="Buscar incidencia, calle, ID…" style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, color: T.ink,
          }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: isMobile ? 0 : 14, borderLeft: isMobile ? 'none' : `1px solid ${T.border}`, height: 36 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 999, background: T.primaryTint, color: T.primary,
          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 30px',
        }}>JM</div>
        {!isMobile && (
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>Juan Méndez</div>
            <div style={{ fontSize: 10.5, color: T.inkMid }}>Coord. recogida</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- FilterSection ----------
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14, borderBottom: `1px solid ${T.borderSoft}`, paddingBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', width: '100%', padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.ink, fontSize: 12.5, fontWeight: 700,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        <Icon name={open ? 'chevron-d' : 'chevron-r'} size={14} color={T.inkMid} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function CheckRow({
  label, dot, count, checked, onToggle,
}: { label: string; dot?: string; count?: number; checked: boolean; onToggle: () => void }) {
  return (
    <label
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: T.ink, cursor: 'pointer', padding: '3px 0' }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: 3,
        border: `1.5px solid ${checked ? T.primary : T.inkLight}`,
        background: checked ? T.primary : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flex: '0 0 14px',
      }}>
        {checked && <Icon name="check" size={10} color="#fff" />}
      </span>
      {dot && <span style={{ width: 8, height: 8, borderRadius: 999, background: dot, flex: '0 0 8px' }} />}
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 10.5, color: T.inkMid, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      )}
    </label>
  );
}

// ---------- Sidebar ----------
interface SidebarProps {
  activeNav: string;
  reports?: Report[];
  filters?: MuniFilters;
  onFilters?: (f: MuniFilters) => void;
  drawer?: boolean;
  onNavigate?: () => void;
}

function Sidebar({ activeNav, reports, filters, onFilters, drawer, onNavigate }: SidebarProps) {
  const router = useRouter();
  const showFilters = !!filters && !!onFilters && !!reports;

  const countBy = (pred: (r: Report) => boolean) => (reports ?? []).filter(pred).length;

  const toggle = <K extends keyof MuniFilters>(key: K, value: ContainerType | ReportStatus | Priority) => {
    if (!filters || !onFilters) return;
    const arr = filters[key] as unknown as string[];
    const next = arr.includes(value as string)
      ? arr.filter((v) => v !== value)
      : [...arr, value as string];
    onFilters({ ...filters, [key]: next });
  };

  const areas = [...new Set((reports ?? []).map((r) => r.area))];

  const go = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  return (
    <div style={{
      width: drawer ? '100%' : 270, flex: drawer ? '1 1 auto' : '0 0 270px',
      background: '#fff', borderRight: drawer ? 'none' : `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {drawer && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 14px 6px',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Menú</span>
          <button
            onClick={onNavigate}
            aria-label="Cerrar"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkMid, padding: 4 }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      )}
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 10px 8px' }}>
          Navegación
        </div>
        {NAV.map((n) => {
          const isActive = activeNav === n.id;
          return (
            <button
              key={n.id}
              onClick={() => go(n.href)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 6, background: isActive ? T.primaryTint : 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left', color: isActive ? T.primary : T.ink,
                fontSize: 13, fontWeight: isActive ? 600 : 500, marginBottom: 2,
              }}
            >
              <Icon name={n.icon} size={16} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.id === 'lista' && reports && (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: T.inkMid }}>{reports.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ height: 1, background: T.border, margin: '4px 12px' }} />

      {showFilters ? (
        <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Filtros · {activeFilterCount(filters!)}
            </span>
            {activeFilterCount(filters!) > 0 && (
              <button
                onClick={() => onFilters!(EMPTY_FILTERS)}
                style={{ background: 'transparent', border: 'none', color: T.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                Limpiar
              </button>
            )}
          </div>

          <FilterSection title="Tipo de contenedor">
            <div style={{ marginTop: 6 }}>
              {CONTAINERS.map((c) => (
                <CheckRow
                  key={c.type}
                  label={c.label}
                  dot={c.color}
                  count={countBy((r) => r.containerType === c.type)}
                  checked={filters!.containers.includes(c.type)}
                  onToggle={() => toggle('containers', c.type)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Estado">
            <div style={{ marginTop: 6 }}>
              {STATUSES.map((s) => (
                <CheckRow
                  key={s.status}
                  label={s.label}
                  dot={s.color}
                  count={countBy((r) => r.status === s.status)}
                  checked={filters!.statuses.includes(s.status)}
                  onToggle={() => toggle('statuses', s.status)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Prioridad">
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {PRIORITIES.map((p) => {
                const active = filters!.priorities.includes(p.priority);
                return (
                  <button
                    key={p.priority}
                    onClick={() => toggle('priorities', p.priority)}
                    style={{
                      flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                      border: `1px solid ${active ? p.color : T.border}`,
                      background: active ? p.color + '18' : '#fff',
                      color: active ? p.color : T.ink, cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Zona" defaultOpen={false}>
            <div style={{ marginTop: 6 }}>
              {areas.map((z) => (
                <CheckRow
                  key={z}
                  label={z}
                  count={countBy((r) => r.area === z)}
                  checked={filters!.area === z}
                  onToggle={() => onFilters!({ ...filters!, area: filters!.area === z ? null : z })}
                />
              ))}
            </div>
          </FilterSection>
        </div>
      ) : (
        <div style={{ flex: 1, padding: 14 }}>
          <div style={{
            background: T.primaryMist, border: `1px solid ${T.primaryTint}`, borderRadius: 8,
            padding: 12, fontSize: 11.5, color: T.inkMid, lineHeight: 1.5,
          }}>
            Visión general del servicio. Usa <strong style={{ color: T.ink }}>Mapa analítico</strong> o{' '}
            <strong style={{ color: T.ink }}>Incidencias</strong> para filtrar y actuar sobre reportes concretos.
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Shell ----------
interface ShellProps {
  activeNav: string;
  children: ReactNode;
  title?: string;
  reports?: Report[];
  filters?: MuniFilters;
  onFilters?: (f: MuniFilters) => void;
}

export default function MunicipalShell({ activeNav, children, title = 'EcoChicharro · Municipal', reports, filters, onFilters }: ShellProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setRole('municipal');
  }, []);

  // cerrar el drawer al pasar a escritorio
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: T.appBg }}>
        <Topbar isMobile={isMobile} onMenu={() => setDrawerOpen(true)} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
          {!isMobile && (
            <Sidebar activeNav={activeNav} reports={reports} filters={filters} onFilters={onFilters} />
          )}
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>

        {/* Drawer móvil */}
        {isMobile && drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: '84%', maxWidth: 300, height: '100%', background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,.2)' }}
            >
              <Sidebar
                activeNav={activeNav}
                reports={reports}
                filters={filters}
                onFilters={onFilters}
                drawer
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export { containerMeta };

import { CSSProperties, ReactNode } from 'react';
import { THEME } from '@/lib/theme';
import { containerMeta, priorityMeta } from '@/lib/constants';
import { ContainerType, Priority } from '@/types';
import { Icon, containerIconName } from './Icon';

const T = THEME;

// ---------- Chip ----------
interface ChipProps {
  label: ReactNode;
  dotColor?: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Chip({ label, dotColor, active, onClick, size = 'md', icon }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: size === 'sm' ? '4px 10px' : '6px 12px',
        fontSize: size === 'sm' ? 12 : 13, fontWeight: 500,
        borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
        border: `1px solid ${active ? T.primary : T.border}`,
        background: active ? T.primaryTint : T.surface,
        color: active ? T.primary : T.ink,
        fontFamily: 'inherit',
      }}
    >
      {dotColor && <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flex: '0 0 auto' }} />}
      {icon}
      {label}
    </button>
  );
}

export function ContainerChip({
  type, active, onClick, size = 'md',
}: { type: ContainerType; active?: boolean; onClick?: () => void; size?: 'sm' | 'md' }) {
  const c = containerMeta(type);
  return <Chip label={c.label} dotColor={c.color} active={active} onClick={onClick} size={size} />;
}

// ---------- Badge ----------
export function Badge({
  color, label, icon, size = 'md',
}: { color: string; label: ReactNode; icon?: ReactNode; size?: 'sm' | 'md' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      fontSize: size === 'sm' ? 10.5 : 11.5, fontWeight: 600, letterSpacing: 0.2,
      borderRadius: 6, color, background: color + '22', textTransform: 'uppercase',
    }}>
      {icon}
      {label}
    </span>
  );
}

// ---------- PriorityTag ----------
export function PriorityTag({ priority, size = 'md' }: { priority: Priority; size?: 'sm' | 'md' }) {
  const pm = priorityMeta(priority);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 500, color: T.inkMid,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: pm.color }} />
      Prioridad {pm.label.toLowerCase()}
    </span>
  );
}

// ---------- Button ----------
type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';

interface ButtonProps {
  kind?: ButtonKind;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  full?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function Button({
  kind = 'primary', size = 'md', icon, children, onClick, style, full, disabled, type = 'button',
}: ButtonProps) {
  const palettes: Record<ButtonKind, { bg: string; color: string; border: string }> = {
    primary: { bg: T.primary, color: '#fff', border: T.primary },
    secondary: { bg: T.surface, color: T.primary, border: T.primary },
    tertiary: { bg: 'transparent', color: T.primary, border: 'transparent' },
    ghost: { bg: T.surface, color: T.ink, border: T.border },
    danger: { bg: 'transparent', color: T.danger, border: T.danger },
  };
  const pal = palettes[kind];
  const sizes = {
    sm: { h: 32, padX: 12, fs: 12.5, gap: 6 },
    md: { h: 40, padX: 16, fs: 14, gap: 8 },
    lg: { h: 48, padX: 20, fs: 15, gap: 10 },
  };
  const sz = sizes[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sz.gap,
        height: sz.h, padding: `0 ${sz.padX}px`, fontSize: sz.fs, fontWeight: 600,
        borderRadius: 8, border: `1px solid ${pal.border}`,
        background: pal.bg, color: pal.color,
        cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
        width: full ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- KPI ----------
interface KPIProps {
  label: string;
  value: ReactNode;
  sub?: string;
  trend?: { dir: 'up' | 'down'; value: string };
  accent?: string;
}

export function KPI({ label, value, sub, trend, accent }: KPIProps) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkMid, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: accent || T.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>
          {value}
        </div>
        {trend && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: trend.dir === 'up' ? T.success : T.danger }}>
            {trend.dir === 'up' ? '▲' : '▼'} {trend.value}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: T.inkMid }}>{sub}</div>}
    </div>
  );
}

// ---------- MapBtn ----------
export function MapBtn({
  icon, label, onClick, active,
}: { icon: ReactNode; label?: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: label ? '8px 12px' : 9,
        background: active ? T.primaryTint : '#fff',
        color: active ? T.primary : T.ink,
        border: `1px solid ${T.border}`,
        borderRadius: 8, fontSize: 12.5, fontWeight: 600,
        boxShadow: '0 1px 4px rgba(0,0,0,.08)', cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {icon}{label}
    </button>
  );
}

// ---------- ContainerIcon badge (round tinted) ----------
export function ContainerIconBadge({ type, size = 28 }: { type: ContainerType; size?: number }) {
  const c = containerMeta(type);
  return (
    <span style={{
      width: size, height: size, borderRadius: 999, background: c.color + '22',
      color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flex: `0 0 ${size}px`,
    }}>
      <Icon name={containerIconName(type)} size={size * 0.55} />
    </span>
  );
}

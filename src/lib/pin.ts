// Genera el HTML de los pines (divIcon de Leaflet) — pin con forma de gota,
// color por tipo de contenedor, icono dentro y anillo de estado opcional.

import { ContainerType, ReportStatus } from '@/types';
import { containerMeta, statusMeta } from '@/lib/constants';
import { containerIconName } from '@/components/ui/Icon';

const ICON_PATHS: Record<string, string> = {
  leaf: '<path d="M20 4c-9 0-15 6-15 13 0 1.5.5 3 1 4 0-9 7-13 14-13Z"/><path d="M5 21c5-1 9-4 12-9"/>',
  bottle: '<path d="M10 2h4v3l1 2v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7l1-2Z"/>',
  news: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M7 9h7M7 13h7M7 17h4"/>',
  bag: '<path d="M5 8h14l-1 13H6Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  shirt: '<path d="m4 7 4-3 2 2h4l2-2 4 3-2 4h-2v9H8v-9H6Z"/>',
  drop: '<path d="M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11Z"/>',
  battery: '<rect x="3" y="8" width="16" height="9" rx="1.5"/><path d="M19 11v3h2v-3z"/><path d="M9 4h6v4H9z"/>',
};

function iconSvg(name: string, color: string, px: number): string {
  return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none"
    stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    ${ICON_PATHS[name] ?? ICON_PATHS.bag}</svg>`;
}

export interface PinOptions {
  type: ContainerType;
  status?: ReportStatus;
  size?: number;
  selected?: boolean;
  faded?: boolean;
}

export function pinHtml({ type, status, size = 32, selected, faded }: PinOptions): string {
  const c = containerMeta(type).color;
  const ring = status ? statusMeta(status).color : null;
  const w = size;
  const h = size * 1.25;
  const iconPx = size * 0.5;
  const shadow = selected
    ? 'drop-shadow(0 4px 10px rgba(0,0,0,.3))'
    : 'drop-shadow(0 2px 4px rgba(0,0,0,.22))';

  return `<div style="position:relative;width:${w}px;height:${h}px;
      filter:${shadow};opacity:${faded ? 0.45 : 1};">
    <svg viewBox="0 0 32 40" width="${w}" height="${h}">
      <path d="M16 0C7.2 0 0 7 0 15.8c0 9.5 12.5 22 14.5 23.6a2.4 2.4 0 0 0 3 0C19.5 37.8 32 25.3 32 15.8 32 7 24.8 0 16 0Z" fill="${c}"/>
      <circle cx="16" cy="15.5" r="10" fill="#fff"/>
      ${selected ? `<circle cx="16" cy="15.5" r="12.5" fill="none" stroke="${c}" stroke-width="2" opacity="0.4"/>` : ''}
    </svg>
    <div style="position:absolute;top:${size * 0.18}px;left:0;width:${w}px;
        display:flex;align-items:center;justify-content:center;">
      ${iconSvg(containerIconName(type), c, iconPx)}
    </div>
    ${ring ? `<span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;
        border-radius:999px;background:${ring};border:2px solid #fff;"></span>` : ''}
  </div>`;
}

export function clusterHtml(count: number, size = 38): string {
  return `<div style="width:${size}px;height:${size}px;border-radius:999px;
    background:#005A9C;color:#fff;border:3px solid rgba(255,255,255,.85);
    box-shadow:0 2px 8px rgba(0,0,0,.18);display:flex;align-items:center;
    justify-content:center;font-size:${size * 0.36}px;font-weight:700;
    font-family:Inter,sans-serif;">${count}</div>`;
}

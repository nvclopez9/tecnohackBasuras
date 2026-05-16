import { ContainerType } from '@/types';

export type IconName =
  | 'home' | 'camera' | 'list' | 'user' | 'search' | 'pin' | 'locate'
  | 'layers' | 'filter' | 'chevron-r' | 'chevron-d' | 'arrow-l' | 'arrow-r'
  | 'check' | 'x' | 'edit' | 'trash' | 'image' | 'gallery' | 'flash' | 'flip'
  | 'bell' | 'globe' | 'help' | 'logout' | 'route' | 'leaf' | 'bottle'
  | 'flame' | 'shirt' | 'drop' | 'battery' | 'bag' | 'news' | 'question'
  | 'plus' | 'export' | 'sort' | 'cluster' | 'dot' | 'menu' | 'kebab' | 'send'
  | 'trophy' | 'medal' | 'clock' | 'star';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({ name, size = 18, color = 'currentColor', stroke = 1.7 }: Props) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home': return <svg {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>;
    case 'camera': return <svg {...p}><path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13.5" r="3.5" /></svg>;
    case 'list': return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>;
    case 'user': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.3-4.3" /></svg>;
    case 'pin': return <svg {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" /><circle cx="12" cy="9" r="2.5" /></svg>;
    case 'locate': return <svg {...p}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
    case 'layers': return <svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>;
    case 'filter': return <svg {...p}><path d="M4 5h16l-6 8v6l-4-2v-4Z" /></svg>;
    case 'chevron-r': return <svg {...p}><path d="m9 6 6 6-6 6" /></svg>;
    case 'chevron-d': return <svg {...p}><path d="m6 9 6 6 6-6" /></svg>;
    case 'arrow-l': return <svg {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
    case 'arrow-r': return <svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
    case 'check': return <svg {...p}><path d="m4 12 5 5L20 6" /></svg>;
    case 'x': return <svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case 'edit': return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16Z" /><path d="m13 7 4 4" /></svg>;
    case 'trash': return <svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>;
    case 'image':
    case 'gallery': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m4 18 5-5 4 4 3-3 4 4" /></svg>;
    case 'flash': return <svg {...p}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></svg>;
    case 'flip': return <svg {...p}><path d="M3 7h13l-2-2M21 17H8l2 2" /></svg>;
    case 'bell': return <svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z" /><path d="M10 21h4" /></svg>;
    case 'globe': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" /></svg>;
    case 'help': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></svg>;
    case 'logout': return <svg {...p}><path d="M14 4h4v16h-4M4 12h12M11 8l-4 4 4 4" /></svg>;
    case 'route': return <svg {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8v3a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4" /></svg>;
    case 'leaf': return <svg {...p}><path d="M20 4c-9 0-15 6-15 13 0 1.5.5 3 1 4 0-9 7-13 14-13Z" /><path d="M5 21c5-1 9-4 12-9" /></svg>;
    case 'bottle': return <svg {...p}><path d="M10 2h4v3l1 2v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7l1-2Z" /></svg>;
    case 'flame': return <svg {...p}><path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 1 3-1 4-2 4-1-2-1-5-3-7-1 4-5 6-5 11 0 3 3 6 7 6Z" /></svg>;
    case 'shirt': return <svg {...p}><path d="m4 7 4-3 2 2h4l2-2 4 3-2 4h-2v9H8v-9H6Z" /></svg>;
    case 'drop': return <svg {...p}><path d="M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11Z" /></svg>;
    case 'battery': return <svg {...p}><rect x="3" y="8" width="16" height="9" rx="1.5" /><path d="M19 11v3h2v-3z" /><path d="M9 4h6v4H9z" /></svg>;
    case 'bag': return <svg {...p}><path d="M5 8h14l-1 13H6Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></svg>;
    case 'news': return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M7 9h7M7 13h7M7 17h4" /></svg>;
    case 'question': return <svg {...p}><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2.5-3 5" /><circle cx="12" cy="18" r=".7" fill="currentColor" /></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'export': return <svg {...p}><path d="M12 16V4M8 8l4-4 4 4" /><path d="M4 18v2h16v-2" /></svg>;
    case 'sort': return <svg {...p}><path d="M8 4v16m-3-3 3 3 3-3M16 20V4m-3 3 3-3 3 3" /></svg>;
    case 'cluster': return <svg {...p}><circle cx="9" cy="9" r="5" /><circle cx="16" cy="16" r="4" /></svg>;
    case 'dot': return <svg {...p}><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></svg>;
    case 'menu': return <svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case 'kebab': return <svg {...p}><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>;
    case 'send': return <svg {...p}><path d="M4 12 20 4l-6 16-3-7-7-1Z" /></svg>;
    case 'trophy': return <svg {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0Z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /><path d="M9 14h6l-1 4h-4Z" /><path d="M8 20h8" /></svg>;
    case 'medal': return <svg {...p}><path d="M8 3h8l-3 6h-2Z" /><circle cx="12" cy="15" r="6" /><path d="M10 14l2 2 3-3" /></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'star': return <svg {...p}><path d="m12 3 2.7 5.6 6.3.8-4.6 4.4 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.4l6.3-.8Z" /></svg>;
    default: return null;
  }
}

const CONTAINER_ICON: Record<ContainerType, IconName> = {
  organico: 'leaf',
  envases: 'bottle',
  papel: 'news',
  vidrio: 'bottle',
  resto: 'bag',
  ropa: 'shirt',
  aceite: 'drop',
  baterias: 'battery',
};

export function containerIconName(type: ContainerType): IconName {
  return CONTAINER_ICON[type] ?? 'bag';
}

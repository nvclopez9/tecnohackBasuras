import { Role } from '@/types';

const ROLE_KEY = 'eco-role';
const MY_REPORTS_KEY = 'eco-my-reports';

export function getRole(): Role | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(ROLE_KEY);
  return v === 'ciudadano' || v === 'municipal' ? v : null;
}

export function setRole(role: Role): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ROLE_KEY, role);
}

export function getMyReportIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MY_REPORTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addMyReportId(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = getMyReportIds();
  if (!ids.includes(id)) {
    window.localStorage.setItem(MY_REPORTS_KEY, JSON.stringify([id, ...ids]));
  }
}

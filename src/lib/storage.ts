import { Role } from '@/types';

const ROLE_KEY = 'eco-role';

export function getRole(): Role | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(ROLE_KEY);
  return v === 'ciudadano' || v === 'municipal' ? v : null;
}

export function setRole(role: Role): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ROLE_KEY, role);
}

export function clearRole(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ROLE_KEY);
}

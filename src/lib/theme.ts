// EcoChicharro design tokens — Ayuntamiento de Santa Cruz de Tenerife (PANTONE 301).
// Light, institutional aesthetic inspired by government data viewers.

export const THEME = {
  // Brand blues
  primary: '#005A9C',
  primaryDark: '#004B87',
  primaryDeep: '#00345E',
  primarySoft: '#1F6FB2',
  primaryTint: '#D6E6F2',
  primaryMist: '#EEF4F9',
  primarySky: '#4A9BD4',

  // Neutrals
  appBg: '#F6F8FA',
  surface: '#FFFFFF',
  border: '#E2E6EA',
  borderSoft: '#EEF2F5',
  ink: '#1C2530',
  inkMid: '#6B7480',
  inkLight: '#A8B0B8',

  // Status semantics
  success: '#2E8B57',
  warn: '#E8A317',
  danger: '#C0392B',
} as const;

// Map center — Santa Cruz de Tenerife (Plaza de España)
export const SC_TENERIFE = { lat: 28.4682, lng: -16.2546 };

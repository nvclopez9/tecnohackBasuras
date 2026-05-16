import { ContainerType } from '@/types';

// Probabilidad de saturación por hora (0..1) para cada tipo de contenedor
export const ECO_HOURLY: Record<ContainerType, number[]> = {
  organico: [0.10,0.08,0.06,0.06,0.08,0.12,0.22,0.35,0.48,0.55,0.62,0.70,0.78,0.85,0.82,0.74,0.62,0.55,0.66,0.78,0.86,0.82,0.62,0.32],
  envases:  [0.18,0.16,0.12,0.10,0.10,0.14,0.22,0.30,0.42,0.55,0.68,0.72,0.85,0.90,0.86,0.74,0.62,0.58,0.72,0.82,0.92,0.88,0.72,0.44],
  papel:    [0.08,0.06,0.05,0.05,0.06,0.10,0.18,0.32,0.48,0.62,0.74,0.78,0.82,0.78,0.68,0.55,0.45,0.42,0.48,0.58,0.65,0.62,0.45,0.22],
  vidrio:   [0.20,0.18,0.16,0.15,0.14,0.14,0.18,0.24,0.32,0.40,0.46,0.52,0.58,0.62,0.60,0.55,0.50,0.55,0.68,0.82,0.94,0.92,0.78,0.46],
  resto:    [0.15,0.12,0.10,0.10,0.12,0.18,0.28,0.42,0.55,0.66,0.75,0.82,0.86,0.88,0.84,0.78,0.72,0.74,0.85,0.92,0.92,0.84,0.65,0.40],
  ropa:     [0.25,0.25,0.24,0.24,0.24,0.26,0.30,0.38,0.45,0.52,0.58,0.62,0.66,0.68,0.66,0.60,0.55,0.52,0.55,0.60,0.62,0.58,0.45,0.32],
  aceite:   [0.22,0.22,0.22,0.22,0.22,0.24,0.26,0.30,0.35,0.40,0.42,0.48,0.52,0.56,0.55,0.50,0.45,0.42,0.48,0.55,0.60,0.55,0.42,0.28],
  baterias: [0.30,0.30,0.30,0.30,0.30,0.32,0.34,0.36,0.40,0.44,0.46,0.48,0.50,0.52,0.52,0.50,0.48,0.46,0.48,0.50,0.52,0.50,0.42,0.34],
  papelera: [0.12,0.10,0.08,0.08,0.10,0.18,0.30,0.48,0.60,0.72,0.80,0.85,0.88,0.90,0.86,0.78,0.70,0.75,0.85,0.92,0.94,0.88,0.68,0.38],
  mixto:    [0.14,0.12,0.10,0.10,0.12,0.16,0.26,0.40,0.52,0.64,0.72,0.78,0.82,0.84,0.80,0.72,0.65,0.68,0.78,0.86,0.88,0.82,0.62,0.36],
  electrico:[0.28,0.28,0.28,0.28,0.28,0.30,0.32,0.34,0.38,0.42,0.44,0.46,0.48,0.50,0.50,0.48,0.46,0.44,0.46,0.48,0.50,0.48,0.40,0.32],
};

export function bestHourTip(containerType: ContainerType): { peakHour: number; bestHour: number; peakPct: number } {
  const arr = ECO_HOURLY[containerType] || ECO_HOURLY.resto;
  let peakH = 0, peakV = 0;
  arr.forEach((v, h) => { if (v > peakV) { peakV = v; peakH = h; } });
  let bestStart = -1;
  for (let h = peakH + 1; h < peakH + 24; h++) {
    if (arr[h % 24] < 0.35) { bestStart = h % 24; break; }
  }
  if (bestStart < 0) bestStart = (peakH + 6) % 24;
  return { peakHour: peakH, bestHour: bestStart, peakPct: Math.round(peakV * 100) };
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  barrio: string;
  pts: number;
  delta: number;
  initials: string;
  avatar: string;
  isMe?: boolean;
}

export const ECO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1,  name: 'Andrea Hernández',    barrio: 'Centro',      pts: 612, delta: 8,  initials: 'AH', avatar: '#005A9C' },
  { rank: 2,  name: 'Tomás Rivero',        barrio: 'Salud',       pts: 588, delta: -2, initials: 'TR', avatar: '#2E8B57' },
  { rank: 3,  name: 'Lucía Méndez',        barrio: 'Anaga',       pts: 542, delta: 3,  initials: 'LM', avatar: '#A4243B' },
  { rank: 4,  name: 'Diego Cabrera',       barrio: 'Cabo-Llanos', pts: 511, delta: 5,  initials: 'DC', avatar: '#E07A2C' },
  { rank: 5,  name: 'Patricia Acosta',     barrio: 'Centro',      pts: 488, delta: 1,  initials: 'PA', avatar: '#1F6FB2' },
  { rank: 6,  name: 'Jorge Padilla',       barrio: 'Ofra',        pts: 472, delta: -1, initials: 'JP', avatar: '#8C5A2B' },
  { rank: 7,  name: 'Nieves Cabrera',      barrio: 'La Salle',    pts: 455, delta: 4,  initials: 'NC', avatar: '#5A8FA8' },
  { rank: 8,  name: 'Sergio Pérez',        barrio: 'Centro',      pts: 432, delta: 0,  initials: 'SP', avatar: '#C99700' },
  { rank: 9,  name: 'Inés del Río',        barrio: 'Anaga',       pts: 418, delta: 6,  initials: 'IR', avatar: '#2E8B57' },
  { rank: 10, name: 'Pablo González',      barrio: 'Salud',       pts: 405, delta: -3, initials: 'PG', avatar: '#005A9C' },
  { rank: 11, name: 'Carmen Hdez.',        barrio: 'Centro',      pts: 384, delta: 2,  initials: 'CH', avatar: '#A4243B' },
  { rank: 12, name: 'Raúl Martín',         barrio: 'Cabo-Llanos', pts: 361, delta: 1,  initials: 'RM', avatar: '#E07A2C' },
  { rank: 13, name: 'Alba Ferrera',        barrio: 'Ifara',       pts: 348, delta: 7,  initials: 'AF', avatar: '#1F6FB2' },
  { rank: 14, name: 'María Domínguez',     barrio: 'Centro',      pts: 285, delta: 5,  initials: 'MD', avatar: '#005A9C', isMe: true },
  { rank: 15, name: 'Hugo Reyes',          barrio: 'Salud',       pts: 271, delta: -1, initials: 'HR', avatar: '#8C5A2B' },
  { rank: 16, name: 'Sara Navarro',        barrio: 'Centro',      pts: 268, delta: 2,  initials: 'SN', avatar: '#2E8B57' },
  { rank: 17, name: 'Iván Trujillo',       barrio: 'Ofra',        pts: 254, delta: 0,  initials: 'IT', avatar: '#5A8FA8' },
  { rank: 18, name: 'Elena Fariña',        barrio: 'Anaga',       pts: 241, delta: 3,  initials: 'EF', avatar: '#C99700' },
  { rank: 19, name: 'Miguel Acosta',       barrio: 'Salud',       pts: 232, delta: -2, initials: 'MA', avatar: '#A4243B' },
  { rank: 20, name: 'Ana Lozano',          barrio: 'Centro',      pts: 218, delta: 1,  initials: 'AL', avatar: '#1F6FB2' },
];

export const ECO_USER = {
  totalPoints: 1820,
  weeklyPoints: 285,
  level: 3,
  levelLabel: 'Vecina colaboradora',
  pointsToNext: 215,
  rankWeekly: 14,
  streak: 6,
  thisWeekBreakdown: [
    { label: 'He reciclado',         count: 18, each: 10, color: '#2E8B57' },
    { label: 'Reportes válidos',     count: 5,  each: 15, color: '#005A9C' },
    { label: 'Satisfacción banner',  count: 6,  each: 5,  color: '#E8A317' },
  ],
};

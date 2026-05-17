export interface TruckStop {
  binId: string;
  lat: number;
  lng: number;
  address: string;
  containerType: string;
  visitedAt: string; // HH:MM
  durationMin: number; // tiempo en parada
}

export interface TruckRoute {
  id: string;
  name: string;
  color: string;
  truck: string;
  driver: string;
  startTime: string;
  endTime: string;
  totalStops: number;
  completedStops: number;
  distanceKm: number;
  plannedDistanceKm: number;
  status: 'completada' | 'en_curso' | 'planificada';
  stops: TruckStop[];
}

export function routeEfficiency(r: TruckRoute): number {
  if (r.distanceKm === 0) return 0;
  return Math.round((r.plannedDistanceKm / r.distanceKm) * 100);
}

export const TRUCK_ROUTES: TruckRoute[] = [
  {
    id: 'ruta-a',
    name: 'Ruta A · Centro / Rambla',
    color: '#005A9C',
    truck: 'CE-1234',
    driver: 'Pedro García',
    startTime: '06:00',
    endTime: '10:00',
    totalStops: 8,
    completedStops: 5,
    distanceKm: 12.4,
    plannedDistanceKm: 11.0,
    status: 'en_curso',
    stops: [
      { binId: 'a-stop-1', lat: 28.4677, lng: -16.2511, address: 'Plaza de España', containerType: 'envases', visitedAt: '06:14', durationMin: 3 },
      { binId: 'a-stop-2', lat: 28.4695, lng: -16.2530, address: 'Rambla General Franco, 12', containerType: 'mixto', visitedAt: '06:28', durationMin: 4 },
      { binId: 'a-stop-3', lat: 28.4710, lng: -16.2548, address: 'C/ Méndez Núñez, 5', containerType: 'papel', visitedAt: '06:43', durationMin: 3 },
      { binId: 'a-stop-4', lat: 28.4728, lng: -16.2565, address: 'Av. de Anaga, 30', containerType: 'vidrio', visitedAt: '07:01', durationMin: 4 },
      { binId: 'a-stop-5', lat: 28.4742, lng: -16.2580, address: 'C/ Imeldo Serís, 18', containerType: 'mixto', visitedAt: '07:19', durationMin: 3 },
      { binId: 'a-stop-6', lat: 28.4755, lng: -16.2595, address: 'C/ del Castillo, 42', containerType: 'envases', visitedAt: '07:38', durationMin: 4 },
      { binId: 'a-stop-7', lat: 28.4765, lng: -16.2610, address: 'Pl. de la Candelaria, 1', containerType: 'papel', visitedAt: '07:55', durationMin: 3 },
      { binId: 'a-stop-8', lat: 28.4778, lng: -16.2625, address: 'Av. de Bravo Murillo, 7', containerType: 'mixto', visitedAt: '08:12', durationMin: 4 },
    ],
  },
  {
    id: 'ruta-b',
    name: 'Ruta B · Centro / Somosierra',
    color: '#2E8B57',
    truck: 'CE-5678',
    driver: 'Ana Torres',
    startTime: '06:00',
    endTime: '09:30',
    totalStops: 6,
    completedStops: 6,
    distanceKm: 8.2,
    plannedDistanceKm: 8.5,
    status: 'completada',
    stops: [
      { binId: 'b-stop-1', lat: 28.463900532833623, lng: -16.24780544, address: 'C/ Bravo Murillo, 3', containerType: 'organico', visitedAt: '06:10', durationMin: 3 },
      { binId: 'b-stop-2', lat: 28.457502962278877, lng: -16.25146693459997, address: 'Av. La Constitución', containerType: 'general', visitedAt: '06:25', durationMin: 4 },
      { binId: 'b-stop-3', lat: 28.45735065851096, lng: -16.26298437883364, address: 'Av, Manuel Hermoso', containerType: 'vidrio', visitedAt: '06:42', durationMin: 3 },
      { binId: 'b-stop-4', lat: 28.457922459642102, lng: -16.272965058478437, address: 'Somosierra', containerType: 'envases', visitedAt: '06:58', durationMin: 4 },
      { binId: 'b-stop-5', lat: 28.459062808368987, lng: -16.276158922289884, address: 'Tio Pino', containerType: 'papel', visitedAt: '07:14', durationMin: 3 },
      { binId: 'b-stop-6', lat: 28.456608287865844, lng: -16.282641604703272, address: 'CEIFP Cesar Manrique', containerType: 'general', visitedAt: '07:30', durationMin: 4 },
    ],
  },
  {
    id: 'ruta-c',
    name: 'Ruta C · Centro / Teresitas',
    color: '#E8A317',
    truck: 'CE-9012',
    driver: 'Luis Medina',
    startTime: '10:00',
    endTime: '14:00',
    totalStops: 5,
    completedStops: 0,
    distanceKm: 0,
    plannedDistanceKm: 9.1,
    status: 'planificada',
    stops: [
      { binId: 'c-stop-1', lat: 28.47627704204309, lng: -16.24581836146615, address: 'Muelle Norte', containerType: 'general', visitedAt: '10:05', durationMin: 4 },
      { binId: 'c-stop-2', lat: 28.486158984858562, lng: -16.23719185201893, address: 'Valleseco', containerType: 'organico', visitedAt: '10:22', durationMin: 3 },
      { binId: 'c-stop-3', lat: 28.49153588594425, lng: -16.223015879241917, address: 'Dique Este', containerType: 'papel', visitedAt: '10:39', durationMin: 4 },
      { binId: 'c-stop-4', lat: 28.499315224988088, lng: -16.204928740173152, address: 'Darsena Pesquera', containerType: 'vidrio', visitedAt: '10:58', durationMin: 3 },
      { binId: 'c-stop-5', lat: 28.50758575785756, lng: -16.188902046639896, address: 'Teresitas', containerType: 'envases', visitedAt: '11:15', durationMin: 4 },
    ],
  },
];

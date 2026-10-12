// Vuelos de la carga de arranque (TS-005, TS-014).
// Las fechas se calculan desde la fecha de referencia (SEED_REFERENCE_DATE o el día de ejecución)
// para que siempre existan vuelos futuros, incluido el día de la sustentación.
// Cada vuelo sembrado tiene un número de vuelo único: es su clave para que la carga sea idempotente.
// La generación es determinística: misma fecha de referencia, mismos vuelos.
import { FlightClass } from '@prisma/client';

export interface FlightSeed {
  flightNumber: string;
  from: string; // IATA
  to: string; // IATA
  airline: string;
  dayOffset: number; // días desde la fecha de referencia (negativo = vuelo pasado)
  departureUtc: string; // HH:MM
  durationMinutes: number;
  stops: number;
  classType: FlightClass;
  pricePerPerson: number; // soles, ida, por persona
  seatsAvailable: number;
}

interface Carrier {
  code: string;
  name: string;
  stops: number;
}

interface Route {
  to: string;
  carriers: Carrier[];
  basePrice: number; // económica, sin escalas o con la escala habitual de la ruta
  directMinutes: number; // duración sin escalas (o con la escala habitual si no hay directo)
}

const LATAM = 'LATAM';
const AVIANCA = 'Avianca';
const COPA = 'Copa Airlines';

/** Rutas desde Lima. Duraciones y precios son referenciales para la demostración. */
export const ROUTES: Route[] = [
  { to: 'CUN', basePrice: 850, directMinutes: 330, carriers: [{ code: 'CM', name: COPA, stops: 1 }, { code: 'LA', name: LATAM, stops: 1 }, { code: 'AM', name: 'Aeroméxico', stops: 1 }] },
  { to: 'GRU', basePrice: 1100, directMinutes: 300, carriers: [{ code: 'LA', name: LATAM, stops: 0 }, { code: 'AV', name: AVIANCA, stops: 1 }] },
  { to: 'GIG', basePrice: 1250, directMinutes: 330, carriers: [{ code: 'LA', name: LATAM, stops: 0 }, { code: 'CM', name: COPA, stops: 1 }] },
  { to: 'MAD', basePrice: 2950, directMinutes: 750, carriers: [{ code: 'IB', name: 'Iberia', stops: 0 }, { code: 'UX', name: 'Air Europa', stops: 0 }, { code: 'LA', name: LATAM, stops: 1 }] },
  { to: 'SVQ', basePrice: 3400, directMinutes: 870, carriers: [{ code: 'IB', name: 'Iberia', stops: 1 }, { code: 'UX', name: 'Air Europa', stops: 1 }] },
  { to: 'BAQ', basePrice: 680, directMinutes: 270, carriers: [{ code: 'AV', name: AVIANCA, stops: 1 }, { code: 'LA', name: LATAM, stops: 1 }] },
  { to: 'MDE', basePrice: 620, directMinutes: 230, carriers: [{ code: 'AV', name: AVIANCA, stops: 0 }, { code: 'LA', name: LATAM, stops: 0 }, { code: 'CM', name: COPA, stops: 1 }] },
  { to: 'BOG', basePrice: 560, directMinutes: 210, carriers: [{ code: 'AV', name: AVIANCA, stops: 0 }, { code: 'LA', name: LATAM, stops: 0 }, { code: 'CM', name: COPA, stops: 1 }] },
  { to: 'PTY', basePrice: 600, directMinutes: 220, carriers: [{ code: 'CM', name: COPA, stops: 0 }, { code: 'AV', name: AVIANCA, stops: 1 }] },
  { to: 'OAX', basePrice: 920, directMinutes: 480, carriers: [{ code: 'AM', name: 'Aeroméxico', stops: 1 }, { code: 'CM', name: COPA, stops: 1 }] },
];

export const CLASS_FACTOR: Record<FlightClass, number> = {
  ECONOMY: 1,
  PREMIUM_ECONOMY: 1.6,
  BUSINESS: 2.6,
  FIRST_CLASS: 4,
};

/** Fechas de salida: cada 10 días durante los cuatro meses siguientes a la referencia. */
export const OUTBOUND_OFFSETS = [3, 13, 23, 33, 43, 53, 63, 73, 83, 93, 103, 113];
/** El regreso sale 7 días después de la ida. */
export const RETURN_AFTER_DAYS = 7;
const DEPARTURE_TIMES = ['06:15', '09:40', '13:05', '17:30', '21:50', '23:55'];

function round10(n: number): number {
  return Math.round(n / 10) * 10;
}

/** Variación determinística de precio (±10 %) para que haya rangos que filtrar. */
function priceVariation(seed: number): number {
  return 1 + (((seed * 37) % 21) - 10) / 100;
}

function nextNumber(counters: Map<string, number>, code: string): string {
  const n = (counters.get(code) ?? 2000) + 1;
  counters.set(code, n);
  return `${code}${n}`;
}

export function buildFlights(): FlightSeed[] {
  const flights: FlightSeed[] = [];
  const counters = new Map<string, number>();

  ROUTES.forEach((route, r) => {
    OUTBOUND_OFFSETS.forEach((offset, i) => {
      // Dos aerolíneas por fecha (rotando), y clase ejecutiva y premium en fechas alternas.
      const carriers = [route.carriers[i % route.carriers.length], route.carriers[(i + 1) % route.carriers.length]];
      const unique = carriers.filter((c, k) => carriers.findIndex((x) => x.code === c.code) === k);
      const classes: FlightClass[] = ['ECONOMY'];
      if (i % 3 === 0) classes.push('BUSINESS');
      if (i % 3 === 1) classes.push('PREMIUM_ECONOMY');

      unique.forEach((carrier, c) => {
        classes.forEach((classType, k) => {
          if (c > 0 && classType !== 'ECONOMY') return; // la segunda aerolínea solo ofrece económica
          const stopsExtra = carrier.stops > 0 && route.carriers.some((x) => x.stops === 0) ? 150 : 0;
          const duration = route.directMinutes + stopsExtra;
          const stopDiscount = stopsExtra > 0 ? 0.85 : 1;
          const seed = r * 101 + i * 7 + c * 3 + k;
          const price = round10(route.basePrice * CLASS_FACTOR[classType] * stopDiscount * priceVariation(seed));
          const seats = classType === 'ECONOMY' ? 60 + ((seed * 13) % 90) : 8 + ((seed * 5) % 16);
          const time = DEPARTURE_TIMES[(r + i + c) % DEPARTURE_TIMES.length];

          flights.push({
            flightNumber: nextNumber(counters, carrier.code),
            from: 'LIM', to: route.to, airline: carrier.name, dayOffset: offset, departureUtc: time,
            durationMinutes: duration, stops: carrier.stops, classType, pricePerPerson: price, seatsAvailable: seats,
          });
          flights.push({
            flightNumber: nextNumber(counters, carrier.code),
            from: route.to, to: 'LIM', airline: carrier.name, dayOffset: offset + RETURN_AFTER_DAYS,
            departureUtc: DEPARTURE_TIMES[(r + i + c + 3) % DEPARTURE_TIMES.length],
            durationMinutes: duration, stops: carrier.stops, classType, pricePerPerson: price, seatsAvailable: seats,
          });
        });
      });
    });
  });

  return flights;
}

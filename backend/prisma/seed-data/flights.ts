// Vuelos de la carga de arranque. Las fechas se calculan desde la fecha de referencia
// (SEED_REFERENCE_DATE o el día de ejecución) para que siempre existan vuelos futuros.
// Cada vuelo sembrado tiene un número de vuelo único: es su clave para que la carga sea idempotente.
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
  pricePerPerson: number; // soles
  seatsAvailable: number;
}

export function buildFlights(): FlightSeed[] {
  return [
    { flightNumber: 'LA2041', from: 'LIM', to: 'CUN', airline: 'LATAM', dayOffset: 75, departureUtc: '06:00', durationMinutes: 510, stops: 1, classType: 'ECONOMY', pricePerPerson: 850, seatsAvailable: 120 },
    { flightNumber: 'CM441', from: 'LIM', to: 'CUN', airline: 'Copa Airlines', dayOffset: 75, departureUtc: '08:00', durationMinutes: 540, stops: 1, classType: 'ECONOMY', pricePerPerson: 790, seatsAvailable: 80 },
    { flightNumber: 'LA2043', from: 'LIM', to: 'CUN', airline: 'LATAM', dayOffset: 75, departureUtc: '22:00', durationMinutes: 540, stops: 1, classType: 'BUSINESS', pricePerPerson: 2100, seatsAvailable: 20 },
    { flightNumber: 'IB6840', from: 'LIM', to: 'MAD', airline: 'Iberia', dayOffset: 40, departureUtc: '23:59', durationMinutes: 780, stops: 0, classType: 'ECONOMY', pricePerPerson: 3200, seatsAvailable: 60 },
    { flightNumber: 'UX71', from: 'LIM', to: 'MAD', airline: 'Air Europa', dayOffset: 40, departureUtc: '20:00', durationMinutes: 810, stops: 0, classType: 'ECONOMY', pricePerPerson: 2950, seatsAvailable: 45 },
    { flightNumber: 'AV9042', from: 'LIM', to: 'BAQ', airline: 'Avianca', dayOffset: 100, departureUtc: '07:00', durationMinutes: 270, stops: 0, classType: 'ECONOMY', pricePerPerson: 680, seatsAvailable: 95 },
    { flightNumber: 'AV9031', from: 'LIM', to: 'MDE', airline: 'Avianca', dayOffset: 60, departureUtc: '09:00', durationMinutes: 240, stops: 0, classType: 'ECONOMY', pricePerPerson: 620, seatsAvailable: 110 },
    { flightNumber: 'AM781', from: 'LIM', to: 'OAX', airline: 'Aeroméxico', dayOffset: 24, departureUtc: '05:00', durationMinutes: 540, stops: 1, classType: 'ECONOMY', pricePerPerson: 920, seatsAvailable: 70 },
    { flightNumber: 'IB6842', from: 'LIM', to: 'SVQ', airline: 'Iberia', dayOffset: 110, departureUtc: '23:00', durationMinutes: 840, stops: 1, classType: 'ECONOMY', pricePerPerson: 3400, seatsAvailable: 55 },
    { flightNumber: 'LA8050', from: 'LIM', to: 'GRU', airline: 'LATAM', dayOffset: 90, departureUtc: '21:00', durationMinutes: 390, stops: 0, classType: 'ECONOMY', pricePerPerson: 1100, seatsAvailable: 88 },
  ];
}

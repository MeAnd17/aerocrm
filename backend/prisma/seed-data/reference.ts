// Datos de referencia (TS-014): extras con precio, datos de la agencia
// y datos de respaldo de clima y feriados para cuando las APIs externas no respondan.
import { ExtraPricing, ExtraType } from '@prisma/client';

// ── Extras ────────────────────────────────────────────────────────────────────

export interface ExtraSeed {
  type: ExtraType;
  name: string;
  description: string;
  price: number;
  pricing: ExtraPricing;
}

export const EXTRAS: ExtraSeed[] = [
  { type: 'TRASLADO_IDA', name: 'Traslado aeropuerto → hotel', description: 'Recojo en el aeropuerto de destino y traslado privado al hotel.', price: 45, pricing: 'POR_RESERVA' },
  { type: 'TRASLADO_VUELTA', name: 'Traslado hotel → aeropuerto', description: 'Traslado privado del hotel al aeropuerto el día del regreso.', price: 45, pricing: 'POR_RESERVA' },
  { type: 'TRASLADO_COMPLETO', name: 'Traslados ida y vuelta', description: 'Ambos traslados privados aeropuerto-hotel-aeropuerto.', price: 80, pricing: 'POR_RESERVA' },
  { type: 'SEGURO_VIAJE', name: 'Seguro de viaje', description: 'Asistencia médica, equipaje y cancelación durante todo el viaje.', price: 45, pricing: 'POR_PASAJERO' },
];

// ── Agencia ───────────────────────────────────────────────────────────────────
// [COMPLETAR] RUC, dirección, teléfono, correo y logotipo reales de la agencia.
// Mientras no estén confirmados, la carga deja estos valores marcados para que se vean en la demo.

export const AGENCY = {
  legalName: 'Expertia Travel S.A.C.',
  tradeName: 'Expertia Travel',
  ruc: '[COMPLETAR]',
  address: '[COMPLETAR]',
  phone: '[COMPLETAR]',
  email: '[COMPLETAR]',
  logoUrl: null as string | null,
};

// ── Clima promedio por mes (respaldo de OpenWeatherMap) ──────────────────────
// Valores aproximados de normales climáticas, suficientes como respaldo de la demostración.

interface ClimateSeries {
  avg: number[]; // 12 meses, °C
  spread: number; // diferencia típica entre promedio y extremos, °C
  rainyDays: number[]; // 12 meses
}

export const CLIMATE: Record<string, ClimateSeries> = {
  CUN: { avg: [24, 24.5, 25.5, 27, 28, 28.5, 28.5, 28.5, 28, 27, 25.5, 24.5], spread: 4, rainyDays: [6, 4, 3, 3, 5, 9, 8, 9, 13, 13, 9, 7] },
  GRU: { avg: [23, 23.5, 22.5, 21, 18.5, 17.5, 17, 18.5, 19, 20.5, 21.5, 22.5], spread: 5, rainyDays: [16, 14, 13, 9, 8, 6, 6, 5, 8, 11, 12, 15] },
  GIG: { avg: [26.5, 27, 26.5, 25, 23, 22, 21.5, 22, 22.5, 23.5, 24.5, 25.5], spread: 4, rainyDays: [11, 9, 9, 9, 8, 6, 6, 6, 8, 10, 11, 12] },
  MAD: { avg: [6.5, 8, 11, 13, 17, 22.5, 26, 25.5, 21, 15, 10, 7], spread: 6, rainyDays: [6, 5, 5, 7, 7, 3, 2, 2, 4, 7, 7, 7] },
  SVQ: { avg: [11, 12.5, 15.5, 17.5, 21, 25.5, 28.5, 28.5, 25, 20, 15, 12], spread: 7, rainyDays: [6, 5, 5, 6, 4, 1, 0, 1, 2, 6, 6, 7] },
  BAQ: { avg: [27, 27.5, 28, 28.5, 28.5, 28.5, 28.5, 28.5, 28, 27.5, 27.5, 27.5], spread: 4, rainyDays: [0, 0, 1, 3, 7, 8, 6, 8, 10, 13, 8, 3] },
  MDE: { avg: [22, 22.5, 22.5, 22.5, 22.5, 22.5, 22.5, 22.5, 22, 21.5, 21.5, 21.5], spread: 5, rainyDays: [7, 9, 13, 18, 19, 12, 11, 13, 16, 19, 16, 10] },
  BOG: { avg: [14, 14.5, 14.5, 14.5, 14.5, 14, 13.5, 13.5, 14, 14, 14, 14], spread: 6, rainyDays: [9, 11, 15, 20, 19, 15, 14, 14, 14, 19, 18, 13] },
  PTY: { avg: [27, 27.5, 28, 28.5, 28, 27.5, 27.5, 27.5, 27, 26.5, 26.5, 27], spread: 4, rainyDays: [3, 2, 1, 5, 16, 18, 17, 18, 19, 21, 19, 9] },
  OAX: { avg: [18, 19.5, 21.5, 23, 23.5, 22, 21.5, 21.5, 21, 20, 19, 18], spread: 7, rainyDays: [1, 1, 2, 4, 8, 14, 13, 14, 13, 6, 2, 1] },
  LIM: { avg: [23, 24, 23.5, 21.5, 19.5, 18, 17, 16.5, 17, 18, 19.5, 21.5], spread: 3, rainyDays: [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0] },
};

export function climateSummary(avg: number, rainyDays: number): string {
  const temp = avg >= 27 ? 'Caluroso' : avg >= 22 ? 'Cálido' : avg >= 16 ? 'Templado' : avg >= 10 ? 'Fresco' : 'Frío';
  const rain = rainyDays >= 15 ? 'lluvias frecuentes' : rainyDays >= 8 ? 'algunas lluvias' : rainyDays >= 3 ? 'lluvias ocasionales' : 'casi sin lluvias';
  return `${temp}, ${rain}`;
}

// ── Feriados nacionales de fecha fija (respaldo de Calendarific) ─────────────
// Solo feriados de fecha fija. Los móviles (Semana Santa, Carnaval, lunes trasladados)
// los entrega Calendarific cuando responde.

export const HOLIDAYS: { countryCode: string; month: number; day: number; name: string }[] = [
  // Perú
  { countryCode: 'PE', month: 1, day: 1, name: 'Año Nuevo' },
  { countryCode: 'PE', month: 5, day: 1, name: 'Día del Trabajo' },
  { countryCode: 'PE', month: 6, day: 7, name: 'Batalla de Arica y Día de la Bandera' },
  { countryCode: 'PE', month: 6, day: 29, name: 'San Pedro y San Pablo' },
  { countryCode: 'PE', month: 7, day: 23, name: 'Día de la Fuerza Aérea del Perú' },
  { countryCode: 'PE', month: 7, day: 28, name: 'Fiestas Patrias' },
  { countryCode: 'PE', month: 7, day: 29, name: 'Fiestas Patrias' },
  { countryCode: 'PE', month: 8, day: 6, name: 'Batalla de Junín' },
  { countryCode: 'PE', month: 8, day: 30, name: 'Santa Rosa de Lima' },
  { countryCode: 'PE', month: 10, day: 8, name: 'Combate de Angamos' },
  { countryCode: 'PE', month: 11, day: 1, name: 'Día de Todos los Santos' },
  { countryCode: 'PE', month: 12, day: 8, name: 'Inmaculada Concepción' },
  { countryCode: 'PE', month: 12, day: 9, name: 'Batalla de Ayacucho' },
  { countryCode: 'PE', month: 12, day: 25, name: 'Navidad' },
  // México
  { countryCode: 'MX', month: 1, day: 1, name: 'Año Nuevo' },
  { countryCode: 'MX', month: 5, day: 1, name: 'Día del Trabajo' },
  { countryCode: 'MX', month: 9, day: 16, name: 'Día de la Independencia' },
  { countryCode: 'MX', month: 12, day: 25, name: 'Navidad' },
  // Colombia
  { countryCode: 'CO', month: 1, day: 1, name: 'Año Nuevo' },
  { countryCode: 'CO', month: 5, day: 1, name: 'Día del Trabajo' },
  { countryCode: 'CO', month: 7, day: 20, name: 'Día de la Independencia' },
  { countryCode: 'CO', month: 8, day: 7, name: 'Batalla de Boyacá' },
  { countryCode: 'CO', month: 12, day: 8, name: 'Inmaculada Concepción' },
  { countryCode: 'CO', month: 12, day: 25, name: 'Navidad' },
  // España
  { countryCode: 'ES', month: 1, day: 1, name: 'Año Nuevo' },
  { countryCode: 'ES', month: 1, day: 6, name: 'Epifanía del Señor' },
  { countryCode: 'ES', month: 5, day: 1, name: 'Fiesta del Trabajo' },
  { countryCode: 'ES', month: 8, day: 15, name: 'Asunción de la Virgen' },
  { countryCode: 'ES', month: 10, day: 12, name: 'Fiesta Nacional de España' },
  { countryCode: 'ES', month: 11, day: 1, name: 'Todos los Santos' },
  { countryCode: 'ES', month: 12, day: 6, name: 'Día de la Constitución' },
  { countryCode: 'ES', month: 12, day: 8, name: 'Inmaculada Concepción' },
  { countryCode: 'ES', month: 12, day: 25, name: 'Navidad' },
  // Brasil
  { countryCode: 'BR', month: 1, day: 1, name: 'Año Nuevo' },
  { countryCode: 'BR', month: 4, day: 21, name: 'Tiradentes' },
  { countryCode: 'BR', month: 5, day: 1, name: 'Día del Trabajo' },
  { countryCode: 'BR', month: 9, day: 7, name: 'Día de la Independencia' },
  { countryCode: 'BR', month: 10, day: 12, name: 'Nuestra Señora Aparecida' },
  { countryCode: 'BR', month: 11, day: 2, name: 'Día de los Difuntos' },
  { countryCode: 'BR', month: 11, day: 15, name: 'Proclamación de la República' },
  { countryCode: 'BR', month: 11, day: 20, name: 'Día de la Conciencia Negra' },
  { countryCode: 'BR', month: 12, day: 25, name: 'Navidad' },
  // Panamá
  { countryCode: 'PA', month: 1, day: 1, name: 'Año Nuevo' },
  { countryCode: 'PA', month: 1, day: 9, name: 'Día de los Mártires' },
  { countryCode: 'PA', month: 5, day: 1, name: 'Día del Trabajo' },
  { countryCode: 'PA', month: 11, day: 3, name: 'Separación de Panamá de Colombia' },
  { countryCode: 'PA', month: 11, day: 4, name: 'Día de los Símbolos Patrios' },
  { countryCode: 'PA', month: 11, day: 5, name: 'Día de Colón' },
  { countryCode: 'PA', month: 11, day: 10, name: 'Primer Grito de Independencia' },
  { countryCode: 'PA', month: 11, day: 28, name: 'Independencia de Panamá de España' },
  { countryCode: 'PA', month: 12, day: 8, name: 'Día de las Madres' },
  { countryCode: 'PA', month: 12, day: 25, name: 'Navidad' },
];

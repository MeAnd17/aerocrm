import { Pipe, PipeTransform } from '@angular/core';

/**
 * Muestra en español los valores de enum que llegan de la API (ECONOMY, EN_CURSO, AVENTURA...).
 *   {{ flight.classType | label }}  →  Económica
 * Si llega un valor que no está en la lista, se muestra con mayúscula inicial.
 */
const LABELS: Record<string, string> = {
  // Clase de vuelo
  ECONOMY: 'Económica',
  PREMIUM_ECONOMY: 'Económica premium',
  BUSINESS: 'Ejecutiva',
  FIRST_CLASS: 'Primera clase',
  // Estado de reserva
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_CURSO: 'En curso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  // Nivel de membresía
  EXPLORADOR: 'Explorador',
  VIAJERO: 'Viajero',
  FRECUENTE: 'Frecuente',
  ELITE: 'Elite',
  // Tipo de actividad
  AVENTURA: 'Aventura',
  CULTURAL: 'Cultural',
  GASTRONOMICO: 'Gastronómico',
  FAMILIAR: 'Familiar',
  RELAX: 'Relax',
  DEPORTIVO: 'Deportivo',
  // Tipo de destino
  PLAYA: 'Playa',
  CIUDAD: 'Ciudad',
  CULTURA: 'Cultura',
  // Forma de viajar
  SOLO: 'Solo',
  PAREJA: 'En pareja',
  FAMILIA: 'En familia',
  GRUPO: 'En grupo',
  // Extras
  TRASLADO_IDA: 'Traslado de ida',
  TRASLADO_VUELTA: 'Traslado de vuelta',
  TRASLADO_COMPLETO: 'Traslados ida y vuelta',
  SEGURO_VIAJE: 'Seguro de viaje',
  // Festividades
  RELIGIOSO: 'Religiosa',
  MUSICAL: 'Musical',
  CARNAVAL: 'Carnaval',
  NACIONAL: 'Nacional',
  // Historial de puntos
  EARNED: 'Ganados',
  REDEEMED: 'Canjeados',
  EARNED_REFUND: 'Devolución ganados',
  REDEEMED_REFUND: 'Devolución canjeados',
};

@Pipe({ name: 'label', standalone: true })
export class LabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const known = LABELS[value];
    if (known) return known;
    const text = value.replace(/_/g, ' ').toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

// Historial de compras de los clientes de demostración (TS-014).
// Los puntos, el nivel y los saldos NO se escriben aquí: los calcula la carga de arranque
// con el motor de fidelización a partir de este historial, así siempre cuadran (AGENTS.md B7).
import { BookingStatus, ExtraType, FlightClass } from '@prisma/client';

export interface HistoryTrip {
  iata: string;
  dayOffset: number; // salida, en días desde la fecha de referencia
  nights: number;
  passengers: number;
  classType: FlightClass;
  hotel: string; // nombre exacto en catalog.ts
  activities: string[]; // nombres exactos en catalog.ts
  extras: ExtraType[];
  status: BookingStatus;
  redeemPoints?: number;
}

export const HISTORY: Record<string, HistoryTrip[]> = {
  // Cliente sin compras: modo explorador recién registrado.
  nuevo: [],

  // Nivel intermedio (Viajero, 4 viajes completados) con un viaje próximo confirmado.
  viajero: [
    { iata: 'CUN', dayOffset: -330, nights: 6, passengers: 2, classType: 'ECONOMY', hotel: 'Hotel Krystal Grand', activities: ['Snorkel en el Arrecife de Cancún', 'Paseo en Catamarán al Atardecer'], extras: ['TRASLADO_COMPLETO'], status: 'COMPLETADO' },
    { iata: 'MDE', dayOffset: -240, nights: 4, passengers: 2, classType: 'ECONOMY', hotel: 'Hotel Charlee Lifestyle', activities: ['Parapente en Santa Elena'], extras: [], status: 'COMPLETADO' },
    { iata: 'GIG', dayOffset: -150, nights: 5, passengers: 2, classType: 'ECONOMY', hotel: 'Hotel Ipanema Garden', activities: ['Pan de Azúcar en Teleférico'], extras: ['SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'BOG', dayOffset: -60, nights: 3, passengers: 2, classType: 'ECONOMY', hotel: 'Hotel Zona T Express', activities: ['Museo del Oro y Centro Histórico'], extras: [], status: 'COMPLETADO' },
    { iata: 'MAD', dayOffset: 25, nights: 7, passengers: 2, classType: 'ECONOMY', hotel: 'Hotel NH Collection Gran Vía', activities: ['Tour Museo del Prado'], extras: ['SEGURO_VIAJE'], status: 'CONFIRMADO' },
  ],

  // Nivel alto (Elite, 16 viajes completados), viaja en familia, ya canjeó una vez.
  elite: [
    { iata: 'MAD', dayOffset: -1450, nights: 8, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Ibis Madrid Centro', activities: ['Tour Museo del Prado'], extras: ['SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'CUN', dayOffset: -1360, nights: 7, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Hyatt Ziva Cancún', activities: ['Xcaret Parque Temático'], extras: ['TRASLADO_COMPLETO'], status: 'COMPLETADO' },
    { iata: 'PTY', dayOffset: -1270, nights: 4, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Casco Antiguo Boutique', activities: ['Biomuseo de Panamá'], extras: [], status: 'COMPLETADO' },
    { iata: 'MDE', dayOffset: -1180, nights: 5, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Intercontinental Medellín', activities: ['Parque Explora y Acuario'], extras: ['TRASLADO_COMPLETO'], status: 'COMPLETADO' },
    { iata: 'SVQ', dayOffset: -1090, nights: 6, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Meliá Sevilla', activities: ['Isla Mágica', 'Entrada al Real Alcázar de Sevilla'], extras: ['SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'GIG', dayOffset: -1000, nights: 6, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Atlântica Copacabana', activities: ['Pan de Azúcar en Teleférico'], extras: ['TRASLADO_COMPLETO'], status: 'COMPLETADO' },
    { iata: 'OAX', dayOffset: -910, nights: 5, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Quinta Real Oaxaca', activities: ['Taller de Alebrijes en San Martín Tilcajete'], extras: [], status: 'COMPLETADO' },
    { iata: 'BOG', dayOffset: -820, nights: 4, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Usaquén Colonial', activities: ['Catedral de Sal de Zipaquirá'], extras: [], status: 'COMPLETADO' },
    { iata: 'CUN', dayOffset: -730, nights: 7, passengers: 4, classType: 'PREMIUM_ECONOMY', hotel: 'Hotel Hyatt Ziva Cancún', activities: ['Tour a Chichén Itzá'], extras: ['TRASLADO_COMPLETO', 'SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'BAQ', dayOffset: -640, nights: 5, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel El Prado', activities: ['Palco VIP Batalla de Flores'], extras: [], status: 'COMPLETADO' },
    { iata: 'GRU', dayOffset: -550, nights: 5, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Fasano São Paulo', activities: ['Acuario de São Paulo'], extras: ['SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'MAD', dayOffset: -460, nights: 8, passengers: 4, classType: 'PREMIUM_ECONOMY', hotel: 'Hotel Mandarin Oriental Ritz', activities: ['Parque Warner Madrid', 'Show de Flamenco Auténtico'], extras: ['TRASLADO_COMPLETO', 'SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'PTY', dayOffset: -370, nights: 4, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Bahía de Panamá', activities: ['Esclusas de Miraflores del Canal'], extras: [], status: 'COMPLETADO', redeemPoints: 500 },
    { iata: 'MDE', dayOffset: -280, nights: 5, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Intercontinental Medellín', activities: ['Tour de Café en Fincas de Antioquia'], extras: ['TRASLADO_COMPLETO'], status: 'COMPLETADO' },
    { iata: 'CUN', dayOffset: -190, nights: 7, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Krystal Grand', activities: ['Xcaret Parque Temático'], extras: ['TRASLADO_COMPLETO', 'SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'SVQ', dayOffset: -100, nights: 6, passengers: 4, classType: 'PREMIUM_ECONOMY', hotel: 'Hotel Alfonso XIII', activities: ['Tour por la Feria de Abril'], extras: ['SEGURO_VIAJE'], status: 'COMPLETADO' },
    { iata: 'OAX', dayOffset: -40, nights: 4, passengers: 4, classType: 'ECONOMY', hotel: 'Hotel Casa Oaxaca', activities: ['Clase de Cocina Oaxaqueña'], extras: [], status: 'CANCELADO' },
  ],
};

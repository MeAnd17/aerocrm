// Catálogo de la carga de arranque: destinos, hoteles, actividades y festividades.
// Cada registro se identifica por una clave natural (IATA, o destino + nombre) para que la carga sea idempotente (AGENTS.md D5).
import { ActivityType, DestinationType, FestivityCategory } from '@prisma/client';

export interface DestinationSeed { iataCode: string; name: string; country: string; countryCode: string; city: string; description: string; type: DestinationType }
export interface HotelSeed { iata: string; name: string; stars: number; zone: string; description: string; pricePerNight: number }
export interface ActivitySeed { iata: string; name: string; type: ActivityType; durationHours: number; price: number; description: string }
export interface FestivitySeed { iata: string; name: string; description: string; startMonth: number; startDay: number; endMonth: number; endDay: number; category: FestivityCategory }

export const DESTINATIONS: DestinationSeed[] = [
  { iataCode: 'CUN', name: 'Cancún', country: 'México', countryCode: 'MX', city: 'Cancún', description: 'Paraíso caribeño con playas de arena blanca y aguas turquesas.', type: 'PLAYA' },
  { iataCode: 'GRU', name: 'São Paulo', country: 'Brasil', countryCode: 'BR', city: 'São Paulo', description: 'La metrópolis más grande de América del Sur, vibrante y cosmopolita.', type: 'CIUDAD' },
  { iataCode: 'MAD', name: 'Madrid', country: 'España', countryCode: 'ES', city: 'Madrid', description: 'Capital española con arte, gastronomía y vida nocturna incomparables.', type: 'CULTURA' },
  { iataCode: 'BAQ', name: 'Barranquilla', country: 'Colombia', countryCode: 'CO', city: 'Barranquilla', description: 'La ciudad del eterno Carnaval, patrimonio cultural de la humanidad.', type: 'CULTURA' },
  { iataCode: 'OAX', name: 'Oaxaca', country: 'México', countryCode: 'MX', city: 'Oaxaca', description: 'Cultura milenaria, gastronomía única y tradiciones ancestrales.', type: 'CULTURA' },
  { iataCode: 'SVQ', name: 'Sevilla', country: 'España', countryCode: 'ES', city: 'Sevilla', description: 'Flamenco, tapas y la Feria de Abril más famosa del mundo.', type: 'CULTURA' },
  { iataCode: 'MDE', name: 'Medellín', country: 'Colombia', countryCode: 'CO', city: 'Medellín', description: 'La ciudad de la eterna primavera y la Feria de las Flores.', type: 'AVENTURA' },
  { iataCode: 'LIM', name: 'Lima', country: 'Perú', countryCode: 'PE', city: 'Lima', description: 'Capital gastronómica de América Latina con historia milenaria.', type: 'CIUDAD' },
  { iataCode: 'BOG', name: 'Bogotá', country: 'Colombia', countryCode: 'CO', city: 'Bogotá', description: 'Capital cultural y económica de Colombia, a 2600 metros de altura.', type: 'CIUDAD' },
  { iataCode: 'GIG', name: 'Río de Janeiro', country: 'Brasil', countryCode: 'BR', city: 'Río de Janeiro', description: 'Playas legendarias, el Cristo Redentor y el carnaval más famoso del mundo.', type: 'PLAYA' },
  { iataCode: 'PTY', name: 'Ciudad de Panamá', country: 'Panamá', countryCode: 'PA', city: 'Ciudad de Panamá', description: 'Hub de conexiones y ciudad moderna con el famoso canal.', type: 'CIUDAD' },
];

export const HOTELS: HotelSeed[] = [
  { iata: 'CUN', name: 'Hotel Hyatt Ziva Cancún', stars: 5, zone: 'Zona Hotelera', description: 'Todo incluido frente al mar con vistas al Caribe.', pricePerNight: 850 },
  { iata: 'CUN', name: 'Hotel Krystal Grand', stars: 4, zone: 'Zona Hotelera', description: 'Ubicado en la zona hotelera con acceso directo a la playa.', pricePerNight: 520 },
  { iata: 'CUN', name: 'Hotel Centro Cancún', stars: 3, zone: 'Centro', description: 'Opción económica en el centro de la ciudad.', pricePerNight: 220 },
  { iata: 'MAD', name: 'Hotel Mandarin Oriental Ritz', stars: 5, zone: 'Centro', description: 'Lujo histórico en el corazón de Madrid.', pricePerNight: 1800 },
  { iata: 'MAD', name: 'Hotel NH Collection Gran Vía', stars: 4, zone: 'Gran Vía', description: 'Moderno hotel en la arteria principal de Madrid.', pricePerNight: 680 },
  { iata: 'MAD', name: 'Hotel Ibis Madrid Centro', stars: 3, zone: 'Centro', description: 'Cómodo y bien ubicado cerca del Retiro.', pricePerNight: 310 },
  { iata: 'BAQ', name: 'Hotel El Prado', stars: 5, zone: 'El Prado', description: 'Hotel histórico cerca del recorrido del Carnaval.', pricePerNight: 480 },
  { iata: 'BAQ', name: 'Dann Carlton Barranquilla', stars: 4, zone: 'Centro', description: 'Vista al Malecón del Río Magdalena.', pricePerNight: 350 },
  { iata: 'MDE', name: 'Hotel Intercontinental Medellín', stars: 5, zone: 'El Poblado', description: 'El mejor hotel de la ciudad con vista panorámica.', pricePerNight: 620 },
  { iata: 'MDE', name: 'Hotel Charlee Lifestyle', stars: 4, zone: 'El Poblado', description: 'Diseño moderno en el corazón de El Poblado.', pricePerNight: 390 },
  { iata: 'OAX', name: 'Hotel Quinta Real Oaxaca', stars: 5, zone: 'Centro Histórico', description: 'Instalado en un convento del siglo XVII.', pricePerNight: 580 },
  { iata: 'OAX', name: 'Hotel Casa Oaxaca', stars: 4, zone: 'Centro', description: 'Hotel boutique con diseño oaxaqueño auténtico.', pricePerNight: 340 },
  { iata: 'SVQ', name: 'Hotel Alfonso XIII', stars: 5, zone: 'Centro', description: 'Palacio histórico símbolo de la elegancia sevillana.', pricePerNight: 1400 },
  { iata: 'SVQ', name: 'Hotel Meliá Sevilla', stars: 4, zone: 'Centro', description: 'Moderno hotel con piscina en azotea.', pricePerNight: 550 },
  { iata: 'GRU', name: 'Hotel Fasano São Paulo', stars: 5, zone: 'Jardins', description: 'El hotel más icónico de Brasil.', pricePerNight: 1200 },
  { iata: 'GRU', name: 'Hotel Unique', stars: 5, zone: 'Jardim Paulista', description: 'Arquitectura revolucionaria y lujo contemporáneo.', pricePerNight: 980 },
];

export const ACTIVITIES: ActivitySeed[] = [
  { iata: 'CUN', name: 'Snorkel en el Arrecife de Cancún', type: 'AVENTURA', durationHours: 4, price: 180, description: 'Explora el segundo arrecife de coral más grande del mundo.' },
  { iata: 'CUN', name: 'Tour a Chichén Itzá', type: 'CULTURAL', durationHours: 10, price: 280, description: 'Visita una de las 7 maravillas del mundo moderno.' },
  { iata: 'CUN', name: 'Xcaret Parque Temático', type: 'FAMILIAR', durationHours: 8, price: 420, description: 'El parque eco-arqueológico más famoso de México.' },
  { iata: 'CUN', name: 'Paseo en Catamarán al Atardecer', type: 'RELAX', durationHours: 3, price: 220, description: 'Navega por el Caribe con bebidas incluidas.' },
  { iata: 'MAD', name: 'Tour Museo del Prado', type: 'CULTURAL', durationHours: 3, price: 150, description: 'Visita guiada por el museo de arte más importante de España.' },
  { iata: 'MAD', name: 'Tour Gastronómico por el Mercado de San Miguel', type: 'GASTRONOMICO', durationHours: 2, price: 180, description: 'Tapas, vinos y productos gourmet en el mercado más famoso de Madrid.' },
  { iata: 'MAD', name: 'Show de Flamenco Auténtico', type: 'CULTURAL', durationHours: 2, price: 210, description: 'Espectáculo de flamenco en tablao tradicional con cena incluida.' },
  { iata: 'BAQ', name: 'Palco VIP Batalla de Flores', type: 'CULTURAL', durationHours: 5, price: 320, description: 'El desfile más importante del Carnaval con palco premium.' },
  { iata: 'BAQ', name: 'Tour Gastronómico por el Centro', type: 'GASTRONOMICO', durationHours: 3, price: 150, description: 'Sabores auténticos del Caribe colombiano.' },
  { iata: 'BAQ', name: 'Paseo en Lancha por el Río Magdalena', type: 'AVENTURA', durationHours: 2, price: 120, description: 'Recorre el río más importante de Colombia.' },
  { iata: 'MDE', name: 'Desfile de Silleteros - Feria de las Flores', type: 'CULTURAL', durationHours: 4, price: 180, description: 'El desfile más emblemático de Colombia declarado Patrimonio Cultural.' },
  { iata: 'MDE', name: 'Tour por El Poblado y el Centro', type: 'CULTURAL', durationHours: 3, price: 120, description: 'Conoce los barrios más emblemáticos de Medellín.' },
  { iata: 'MDE', name: 'Parapente en Santa Elena', type: 'AVENTURA', durationHours: 2, price: 280, description: 'Vuela sobre el Valle de Aburrá con instructores certificados.' },
  { iata: 'OAX', name: 'Tour Nocturno Día de Muertos en Xoxo', type: 'CULTURAL', durationHours: 4, price: 200, description: 'Visita el cementerio más famoso durante la celebración del Día de Muertos.' },
  { iata: 'OAX', name: 'Clase de Cocina Oaxaqueña', type: 'GASTRONOMICO', durationHours: 3, price: 220, description: 'Aprende a preparar mole negro y tlayudas con chefs locales.' },
  { iata: 'OAX', name: 'Visita a las Ruinas de Monte Albán', type: 'CULTURAL', durationHours: 4, price: 160, description: 'Zona arqueológica zapoteca declarada Patrimonio de la Humanidad.' },
  { iata: 'SVQ', name: 'Entrada al Real Alcázar de Sevilla', type: 'CULTURAL', durationHours: 2, price: 140, description: 'El palacio real más antiguo en uso de Europa.' },
  { iata: 'SVQ', name: 'Tour por la Feria de Abril', type: 'CULTURAL', durationHours: 4, price: 180, description: 'Recorre las casetas y vive el ambiente más auténtico de Sevilla.' },
  { iata: 'SVQ', name: 'Crucero por el Río Guadalquivir', type: 'RELAX', durationHours: 1, price: 110, description: 'Panorámicas únicas de Sevilla desde el agua.' },
  { iata: 'GIG', name: 'Tour Sambódromo y Carnaval', type: 'CULTURAL', durationHours: 5, price: 380, description: 'Vive el Carnaval de Río en el Sambódromo con asiento garantizado.' },
  { iata: 'GRU', name: 'Tour Gastronómico Liberdade (Barrio Japonés)', type: 'GASTRONOMICO', durationHours: 3, price: 160, description: 'El barrio japonés más grande fuera de Japón.' },
];

export const FESTIVITIES: FestivitySeed[] = [
  { iata: 'BAQ', name: 'Carnaval de Barranquilla', description: 'Patrimonio Oral e Inmaterial de la Humanidad. El carnaval más importante de Colombia y uno de los más grandes del mundo.', startMonth: 2, startDay: 28, endMonth: 3, endDay: 3, category: 'CARNAVAL' },
  { iata: 'MDE', name: 'Feria de las Flores', description: 'El evento más representativo de Medellín. El Desfile de Silleteros es declarado Patrimonio Cultural de Colombia.', startMonth: 8, startDay: 1, endMonth: 8, endDay: 10, category: 'CULTURAL' },
  { iata: 'OAX', name: 'Día de Muertos en Oaxaca', description: 'La celebración más auténtica del Día de Muertos en México. Los cementerios se llenan de flores y altares tradicionales.', startMonth: 10, startDay: 31, endMonth: 11, endDay: 2, category: 'CULTURAL' },
  { iata: 'SVQ', name: 'Feria de Abril de Sevilla', description: 'La feria más famosa de España con casetas, flamenco, caballos y trajes típicos durante una semana completa.', startMonth: 4, startDay: 22, endMonth: 4, endDay: 28, category: 'CULTURAL' },
  { iata: 'GIG', name: 'Carnaval de Río de Janeiro', description: 'El mayor espectáculo de la Tierra. El Sambódromo acoge los desfiles de las escuelas de samba más famosas del mundo.', startMonth: 2, startDay: 21, endMonth: 2, endDay: 26, category: 'CARNAVAL' },
  { iata: 'CUN', name: 'Día de Muertos en México', description: 'Festividad declarada Patrimonio Cultural Inmaterial por la UNESCO. Altares, calaveras y ofrendas en todo el país.', startMonth: 10, startDay: 31, endMonth: 11, endDay: 2, category: 'CULTURAL' },
  { iata: 'MAD', name: 'Fiestas de San Isidro', description: 'Las fiestas patronales de Madrid con verbenas, procesiones, corridas de toros y conciertos durante una semana.', startMonth: 5, startDay: 10, endMonth: 5, endDay: 18, category: 'NACIONAL' },
  { iata: 'MAD', name: 'Navidad en Madrid', description: 'Luces navideñas en Gran Vía, mercados de Navidad en la Plaza Mayor y el tradicional sorteo de El Gordo.', startMonth: 12, startDay: 1, endMonth: 1, endDay: 6, category: 'NACIONAL' },
];

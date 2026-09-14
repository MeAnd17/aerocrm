import { PrismaClient, FlightClass, ActivityType, FestivityCategory, MembershipLevel } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── DESTINATIONS ──────────────────────────────────────────────────────────
  const destinations = await Promise.all([
    prisma.destination.upsert({ where: { iataCode: 'CUN' }, update: {}, create: { name: 'Cancún', country: 'México', countryCode: 'MX', city: 'Cancún', iataCode: 'CUN', description: 'Paraíso caribeño con playas de arena blanca y aguas turquesas.', type: 'PLAYA' } }),
    prisma.destination.upsert({ where: { iataCode: 'GRU' }, update: {}, create: { name: 'São Paulo', country: 'Brasil', countryCode: 'BR', city: 'São Paulo', iataCode: 'GRU', description: 'La metrópolis más grande de América del Sur, vibrante y cosmopolita.', type: 'CIUDAD' } }),
    prisma.destination.upsert({ where: { iataCode: 'MAD' }, update: {}, create: { name: 'Madrid', country: 'España', countryCode: 'ES', city: 'Madrid', iataCode: 'MAD', description: 'Capital española con arte, gastronomía y vida nocturna incomparables.', type: 'CULTURA' } }),
    prisma.destination.upsert({ where: { iataCode: 'BAQ' }, update: {}, create: { name: 'Barranquilla', country: 'Colombia', countryCode: 'CO', city: 'Barranquilla', iataCode: 'BAQ', description: 'La ciudad del eterno Carnaval, patrimonio cultural de la humanidad.', type: 'CULTURA' } }),
    prisma.destination.upsert({ where: { iataCode: 'OAX' }, update: {}, create: { name: 'Oaxaca', country: 'México', countryCode: 'MX', city: 'Oaxaca', iataCode: 'OAX', description: 'Cultura milenaria, gastronomía única y tradiciones ancestrales.', type: 'CULTURA' } }),
    prisma.destination.upsert({ where: { iataCode: 'SVQ' }, update: {}, create: { name: 'Sevilla', country: 'España', countryCode: 'ES', city: 'Sevilla', iataCode: 'SVQ', description: 'Flamenco, tapas y la Feria de Abril más famosa del mundo.', type: 'CULTURA' } }),
    prisma.destination.upsert({ where: { iataCode: 'MDE' }, update: {}, create: { name: 'Medellín', country: 'Colombia', countryCode: 'CO', city: 'Medellín', iataCode: 'MDE', description: 'La ciudad de la eterna primavera y la Feria de las Flores.', type: 'AVENTURA' } }),
    prisma.destination.upsert({ where: { iataCode: 'LIM' }, update: {}, create: { name: 'Lima', country: 'Perú', countryCode: 'PE', city: 'Lima', iataCode: 'LIM', description: 'Capital gastronómica de América Latina con historia milenaria.', type: 'CIUDAD' } }),
    prisma.destination.upsert({ where: { iataCode: 'BOG' }, update: {}, create: { name: 'Bogotá', country: 'Colombia', countryCode: 'CO', city: 'Bogotá', iataCode: 'BOG', description: 'Capital cultural y económica de Colombia, a 2600 metros de altura.', type: 'CIUDAD' } }),
    prisma.destination.upsert({ where: { iataCode: 'PTY' }, update: {}, create: { name: 'Ciudad de Panamá', country: 'Panamá', countryCode: 'PA', city: 'Ciudad de Panamá', iataCode: 'PTY', description: 'Hub de conexiones y ciudad moderna con el famoso canal.', type: 'CIUDAD' } }),
  ]);

  const [cancun, sao_paulo, madrid, barranquilla, oaxaca, sevilla, medellin, lima, bogota, panama] = destinations;

  // ─── FLIGHTS ───────────────────────────────────────────────────────────────
  await prisma.flight.createMany({ skipDuplicates: true, data: [
    // Lima → Cancún
    { originId: lima.id, destinationId: cancun.id, airline: 'LATAM', flightNumber: 'LA2041', departureDate: new Date('2026-12-20T06:00:00Z'), arrivalDate: new Date('2026-12-20T14:30:00Z'), durationMinutes: 510, stops: 1, classType: 'ECONOMY', pricePerPerson: 850, currency: 'PEN', seatsAvailable: 120 },
    { originId: lima.id, destinationId: cancun.id, airline: 'Copa Airlines', flightNumber: 'CM441', departureDate: new Date('2026-12-20T08:00:00Z'), arrivalDate: new Date('2026-12-20T17:00:00Z'), durationMinutes: 540, stops: 1, classType: 'ECONOMY', pricePerPerson: 790, currency: 'PEN', seatsAvailable: 80 },
    { originId: lima.id, destinationId: cancun.id, airline: 'LATAM', flightNumber: 'LA2043', departureDate: new Date('2026-12-20T22:00:00Z'), arrivalDate: new Date('2026-12-21T08:00:00Z'), durationMinutes: 540, stops: 1, classType: 'BUSINESS', pricePerPerson: 2100, currency: 'PEN', seatsAvailable: 20 },
    // Lima → Madrid
    { originId: lima.id, destinationId: madrid.id, airline: 'Iberia', flightNumber: 'IB6840', departureDate: new Date('2026-11-15T23:59:00Z'), arrivalDate: new Date('2026-11-16T19:00:00Z'), durationMinutes: 780, stops: 0, classType: 'ECONOMY', pricePerPerson: 3200, currency: 'PEN', seatsAvailable: 60 },
    { originId: lima.id, destinationId: madrid.id, airline: 'Air Europa', flightNumber: 'UX71', departureDate: new Date('2026-11-15T20:00:00Z'), arrivalDate: new Date('2026-11-16T16:30:00Z'), durationMinutes: 810, stops: 0, classType: 'ECONOMY', pricePerPerson: 2950, currency: 'PEN', seatsAvailable: 45 },
    // Lima → Barranquilla
    { originId: lima.id, destinationId: barranquilla.id, airline: 'Avianca', flightNumber: 'AV9042', departureDate: new Date('2027-02-28T07:00:00Z'), arrivalDate: new Date('2027-02-28T12:30:00Z'), durationMinutes: 270, stops: 0, classType: 'ECONOMY', pricePerPerson: 680, currency: 'PEN', seatsAvailable: 95 },
    // Lima → Medellín
    { originId: lima.id, destinationId: medellin.id, airline: 'Avianca', flightNumber: 'AV9031', departureDate: new Date('2027-08-01T09:00:00Z'), arrivalDate: new Date('2027-08-01T13:00:00Z'), durationMinutes: 240, stops: 0, classType: 'ECONOMY', pricePerPerson: 620, currency: 'PEN', seatsAvailable: 110 },
    // Lima → Oaxaca
    { originId: lima.id, destinationId: oaxaca.id, airline: 'Aeroméxico', flightNumber: 'AM781', departureDate: new Date('2026-10-30T05:00:00Z'), arrivalDate: new Date('2026-10-30T14:00:00Z'), durationMinutes: 540, stops: 1, classType: 'ECONOMY', pricePerPerson: 920, currency: 'PEN', seatsAvailable: 70 },
    // Lima → Sevilla
    { originId: lima.id, destinationId: sevilla.id, airline: 'Iberia', flightNumber: 'IB6842', departureDate: new Date('2027-04-10T23:00:00Z'), arrivalDate: new Date('2027-04-11T20:00:00Z'), durationMinutes: 840, stops: 1, classType: 'ECONOMY', pricePerPerson: 3400, currency: 'PEN', seatsAvailable: 55 },
    // Lima → São Paulo
    { originId: lima.id, destinationId: sao_paulo.id, airline: 'LATAM', flightNumber: 'LA8050', departureDate: new Date('2027-02-20T21:00:00Z'), arrivalDate: new Date('2027-02-21T05:30:00Z'), durationMinutes: 390, stops: 0, classType: 'ECONOMY', pricePerPerson: 1100, currency: 'PEN', seatsAvailable: 88 },
  ]});

  // ─── HOTELS ────────────────────────────────────────────────────────────────
  await prisma.hotel.createMany({ skipDuplicates: true, data: [
    // Cancún
    { destinationId: cancun.id, name: 'Hotel Hyatt Ziva Cancún', stars: 5, zone: 'Zona Hotelera', description: 'Todo incluido frente al mar con vistas al Caribe.', pricePerNight: 850, currency: 'PEN' },
    { destinationId: cancun.id, name: 'Hotel Krystal Grand', stars: 4, zone: 'Zona Hotelera', description: 'Ubicado en la zona hotelera con acceso directo a la playa.', pricePerNight: 520, currency: 'PEN' },
    { destinationId: cancun.id, name: 'Hotel Centro Cancún', stars: 3, zone: 'Centro', description: 'Opción económica en el centro de la ciudad.', pricePerNight: 220, currency: 'PEN' },
    // Madrid
    { destinationId: madrid.id, name: 'Hotel Mandarin Oriental Ritz', stars: 5, zone: 'Centro', description: 'Lujo histórico en el corazón de Madrid.', pricePerNight: 1800, currency: 'PEN' },
    { destinationId: madrid.id, name: 'Hotel NH Collection Gran Vía', stars: 4, zone: 'Gran Vía', description: 'Moderno hotel en la arteria principal de Madrid.', pricePerNight: 680, currency: 'PEN' },
    { destinationId: madrid.id, name: 'Hotel Ibis Madrid Centro', stars: 3, zone: 'Centro', description: 'Cómodo y bien ubicado cerca del Retiro.', pricePerNight: 310, currency: 'PEN' },
    // Barranquilla
    { destinationId: barranquilla.id, name: 'Hotel El Prado', stars: 5, zone: 'El Prado', description: 'Hotel histórico cerca del recorrido del Carnaval.', pricePerNight: 480, currency: 'PEN' },
    { destinationId: barranquilla.id, name: 'Dann Carlton Barranquilla', stars: 4, zone: 'Centro', description: 'Vista al Malecón del Río Magdalena.', pricePerNight: 350, currency: 'PEN' },
    // Medellín
    { destinationId: medellin.id, name: 'Hotel Intercontinental Medellín', stars: 5, zone: 'El Poblado', description: 'El mejor hotel de la ciudad con vista panorámica.', pricePerNight: 620, currency: 'PEN' },
    { destinationId: medellin.id, name: 'Hotel Charlee Lifestyle', stars: 4, zone: 'El Poblado', description: 'Diseño moderno en el corazón de El Poblado.', pricePerNight: 390, currency: 'PEN' },
    // Oaxaca
    { destinationId: oaxaca.id, name: 'Hotel Quinta Real Oaxaca', stars: 5, zone: 'Centro Histórico', description: 'Instalado en un convento del siglo XVII.', pricePerNight: 580, currency: 'PEN' },
    { destinationId: oaxaca.id, name: 'Hotel Casa Oaxaca', stars: 4, zone: 'Centro', description: 'Hotel boutique con diseño oaxaqueño auténtico.', pricePerNight: 340, currency: 'PEN' },
    // Sevilla
    { destinationId: sevilla.id, name: 'Hotel Alfonso XIII', stars: 5, zone: 'Centro', description: 'Palacio histórico símbolo de la elegancia sevillana.', pricePerNight: 1400, currency: 'PEN' },
    { destinationId: sevilla.id, name: 'Hotel Meliá Sevilla', stars: 4, zone: 'Centro', description: 'Moderno hotel con piscina en azotea.', pricePerNight: 550, currency: 'PEN' },
    // São Paulo
    { destinationId: sao_paulo.id, name: 'Hotel Fasano São Paulo', stars: 5, zone: 'Jardins', description: 'El hotel más icónico de Brasil.', pricePerNight: 1200, currency: 'PEN' },
    { destinationId: sao_paulo.id, name: 'Hotel Unique', stars: 5, zone: 'Jardim Paulista', description: 'Arquitectura revolucionaria y lujo contemporáneo.', pricePerNight: 980, currency: 'PEN' },
  ]});

  // ─── ACTIVITIES ────────────────────────────────────────────────────────────
  await prisma.activity.createMany({ skipDuplicates: true, data: [
    // Cancún
    { destinationId: cancun.id, name: 'Snorkel en el Arrecife de Cancún', type: 'AVENTURA', durationHours: 4, price: 180, currency: 'PEN', description: 'Explora el segundo arrecife de coral más grande del mundo.' },
    { destinationId: cancun.id, name: 'Tour a Chichén Itzá', type: 'CULTURAL', durationHours: 10, price: 280, currency: 'PEN', description: 'Visita una de las 7 maravillas del mundo moderno.' },
    { destinationId: cancun.id, name: 'Xcaret Parque Temático', type: 'FAMILIAR', durationHours: 8, price: 420, currency: 'PEN', description: 'El parque eco-arqueológico más famoso de México.' },
    { destinationId: cancun.id, name: 'Paseo en Catamarán al Atardecer', type: 'RELAX', durationHours: 3, price: 220, currency: 'PEN', description: 'Navega por el Caribe con bebidas incluidas.' },
    // Madrid
    { destinationId: madrid.id, name: 'Tour Museo del Prado', type: 'CULTURAL', durationHours: 3, price: 150, currency: 'PEN', description: 'Visita guiada por el museo de arte más importante de España.' },
    { destinationId: madrid.id, name: 'Tour Gastronómico por el Mercado de San Miguel', type: 'GASTRONOMICO', durationHours: 2, price: 180, currency: 'PEN', description: 'Tapas, vinos y productos gourmet en el mercado más famoso de Madrid.' },
    { destinationId: madrid.id, name: 'Show de Flamenco Auténtico', type: 'CULTURAL', durationHours: 2, price: 210, currency: 'PEN', description: 'Espectáculo de flamenco en tablao tradicional con cena incluida.' },
    // Barranquilla
    { destinationId: barranquilla.id, name: 'Palco VIP Batalla de Flores', type: 'CULTURAL', durationHours: 5, price: 320, currency: 'PEN', description: 'El desfile más importante del Carnaval con palco premium.' },
    { destinationId: barranquilla.id, name: 'Tour Gastronómico por el Centro', type: 'GASTRONOMICO', durationHours: 3, price: 150, currency: 'PEN', description: 'Sabores auténticos del Caribe colombiano.' },
    { destinationId: barranquilla.id, name: 'Paseo en Lancha por el Río Magdalena', type: 'AVENTURA', durationHours: 2, price: 120, currency: 'PEN', description: 'Recorre el río más importante de Colombia.' },
    // Medellín
    { destinationId: medellin.id, name: 'Desfile de Silleteros - Feria de las Flores', type: 'CULTURAL', durationHours: 4, price: 180, currency: 'PEN', description: 'El desfile más emblemático de Colombia declarado Patrimonio Cultural.' },
    { destinationId: medellin.id, name: 'Tour por El Poblado y el Centro', type: 'CULTURAL', durationHours: 3, price: 120, currency: 'PEN', description: 'Conoce los barrios más emblemáticos de Medellín.' },
    { destinationId: medellin.id, name: 'Parapente en Santa Elena', type: 'AVENTURA', durationHours: 2, price: 280, currency: 'PEN', description: 'Vuela sobre el Valle de Aburrá con instructores certificados.' },
    // Oaxaca
    { destinationId: oaxaca.id, name: 'Tour Nocturno Día de Muertos en Xoxo', type: 'CULTURAL', durationHours: 4, price: 200, currency: 'PEN', description: 'Visita el cementerio más famoso durante la celebración del Día de Muertos.' },
    { destinationId: oaxaca.id, name: 'Clase de Cocina Oaxaqueña', type: 'GASTRONOMICO', durationHours: 3, price: 220, currency: 'PEN', description: 'Aprende a preparar mole negro y tlayudas con chefs locales.' },
    { destinationId: oaxaca.id, name: 'Visita a las Ruinas de Monte Albán', type: 'CULTURAL', durationHours: 4, price: 160, currency: 'PEN', description: 'Zona arqueológica zapoteca declarada Patrimonio de la Humanidad.' },
    // Sevilla
    { destinationId: sevilla.id, name: 'Entrada al Real Alcázar de Sevilla', type: 'CULTURAL', durationHours: 2, price: 140, currency: 'PEN', description: 'El palacio real más antiguo en uso de Europa.' },
    { destinationId: sevilla.id, name: 'Tour por la Feria de Abril', type: 'CULTURAL', durationHours: 4, price: 180, currency: 'PEN', description: 'Recorre las casetas y vive el ambiente más auténtico de Sevilla.' },
    { destinationId: sevilla.id, name: 'Crucero por el Río Guadalquivir', type: 'RELAX', durationHours: 1, price: 110, currency: 'PEN', description: 'Panorámicas únicas de Sevilla desde el agua.' },
    // São Paulo
    { destinationId: sao_paulo.id, name: 'Tour Sambódromo y Carnaval', type: 'CULTURAL', durationHours: 5, price: 380, currency: 'PEN', description: 'Vive el Carnaval de Río en el Sambódromo con asiento garantizado.' },
    { destinationId: sao_paulo.id, name: 'Tour Gastronómico Liberdade (Barrio Japonés)', type: 'GASTRONOMICO', durationHours: 3, price: 160, currency: 'PEN', description: 'El barrio japonés más grande fuera de Japón.' },
  ]});

  // ─── FESTIVITIES ───────────────────────────────────────────────────────────
  await prisma.festivity.createMany({ skipDuplicates: true, data: [
    { destinationId: barranquilla.id, name: 'Carnaval de Barranquilla', description: 'Patrimonio Oral e Inmaterial de la Humanidad. El carnaval más importante de Colombia y uno de los más grandes del mundo.', startMonth: 2, startDay: 28, endMonth: 3, endDay: 3, category: 'CARNAVAL' },
    { destinationId: medellin.id, name: 'Feria de las Flores', description: 'El evento más representativo de Medellín. El Desfile de Silleteros es declarado Patrimonio Cultural de Colombia.', startMonth: 8, startDay: 1, endMonth: 8, endDay: 10, category: 'CULTURAL' },
    { destinationId: oaxaca.id, name: 'Día de Muertos en Oaxaca', description: 'La celebración más auténtica del Día de Muertos en México. Los cementerios se llenan de flores y altares tradicionales.', startMonth: 10, startDay: 31, endMonth: 11, endDay: 2, category: 'CULTURAL' },
    { destinationId: sevilla.id, name: 'Feria de Abril de Sevilla', description: 'La feria más famosa de España con casetas, flamenco, caballos y trajes típicos durante una semana completa.', startMonth: 4, startDay: 22, endMonth: 4, endDay: 28, category: 'CULTURAL' },
    { destinationId: sao_paulo.id, name: 'Carnaval de Río de Janeiro', description: 'El mayor espectáculo de la Tierra. El Sambódromo acoge los desfiles de las escuelas de samba más famosas del mundo.', startMonth: 2, startDay: 21, endMonth: 2, endDay: 26, category: 'CARNAVAL' },
    { destinationId: cancun.id, name: 'Día de Muertos en México', description: 'Festividad declarada Patrimonio Cultural Inmaterial por la UNESCO. Altares, calaveras y ofrendas en todo el país.', startMonth: 10, startDay: 31, endMonth: 11, endDay: 2, category: 'CULTURAL' },
    { destinationId: madrid.id, name: 'Fiestas de San Isidro', description: 'Las fiestas patronales de Madrid con verbenas, procesiones, corridas de toros y conciertos durante una semana.', startMonth: 5, startDay: 10, endMonth: 5, endDay: 18, category: 'NACIONAL' },
    { destinationId: madrid.id, name: 'Navidad en Madrid', description: 'Luces navideñas en Gran Vía, mercados de Navidad en la Plaza Mayor y el tradicional sorteo de El Gordo.', startMonth: 12, startDay: 1, endMonth: 1, endDay: 6, category: 'NACIONAL' },
  ]});

  // ─── DEMO USERS ────────────────────────────────────────────────────────────
  const adminPass = await bcryptjs.hash('Admin1234!', 10);
  const clientPass = await bcryptjs.hash('Cliente1234!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@viajes.com' },
    update: {},
    create: { email: 'admin@viajes.com', password: adminPass, firstName: 'Admin', lastName: 'Sistema' },
  });

  const clientUser1 = await prisma.user.upsert({
    where: { email: 'andrea@demo.com' },
    update: {},
    create: { email: 'andrea@demo.com', password: clientPass, firstName: 'Andrea', lastName: 'García' },
  });

  const clientUser2 = await prisma.user.upsert({
    where: { email: 'carlos@demo.com' },
    update: {},
    create: { email: 'carlos@demo.com', password: clientPass, firstName: 'Carlos', lastName: 'Mendoza' },
  });

  // ─── DEMO CLIENTS ──────────────────────────────────────────────────────────
  await prisma.client.upsert({
    where: { userId: clientUser1.id },
    update: {},
    create: {
      userId: clientUser1.id,
      phone: '+51 987 654 321',
      nationality: 'PE',
      dateOfBirth: new Date('1998-03-15'),
      travelStyle: 'PAREJA',
      destinationType: 'PLAYA',
      totalPoints: 850,
      availablePoints: 850,
      completedTrips: 3,
      membershipLevel: 'VIAJERO',
    },
  });

  await prisma.client.upsert({
    where: { userId: clientUser2.id },
    update: {},
    create: {
      userId: clientUser2.id,
      phone: '+51 912 345 678',
      nationality: 'PE',
      dateOfBirth: new Date('1990-07-22'),
      travelStyle: 'FAMILIA',
      destinationType: 'CULTURA',
      totalPoints: 2400,
      availablePoints: 1200,
      completedTrips: 9,
      membershipLevel: 'FRECUENTE',
    },
  });

  console.log('✅ Seed completado');
  console.log('');
  console.log('👤 Credenciales demo:');
  console.log('   Admin:    admin@viajes.com     / Admin1234!');
  console.log('   Cliente1: andrea@demo.com      / Cliente1234!');
  console.log('   Cliente2: carlos@demo.com      / Cliente1234!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

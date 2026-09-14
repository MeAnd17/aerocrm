import { PrismaClient, FlightStatus, FareClass, AncillaryType, PassengerTier, SupportChannel, TicketPriority, TicketStatus, ReservationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── PERMISSIONS ─────────────────────────────────────────────────────────
  const modules = ['dashboard', 'passengers', 'flights', 'reservations', 'support', 'ai', 'admin'];
  const actions = ['create', 'read', 'update', 'delete'];

  const permissions: any[] = [];
  for (const mod of modules) {
    for (const action of actions) {
      const p = await prisma.permission.upsert({
        where: { module_action: { module: mod, action } },
        update: {},
        create: { module: mod, action },
      });
      permissions.push(p);
    }
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // ─── ROLES ───────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Full system access' },
  });

  const flightAgentRole = await prisma.role.upsert({
    where: { name: 'Flight Agent' },
    update: {},
    create: { name: 'Flight Agent', description: 'Manages flights, passengers and reservations' },
  });

  const supportOperatorRole = await prisma.role.upsert({
    where: { name: 'Support Operator' },
    update: {},
    create: { name: 'Support Operator', description: 'Manages support tickets and AI assistance' },
  });

  // Admin gets all permissions
  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  // Flight Agent permissions
  const flightAgentModules = ['dashboard', 'flights', 'passengers', 'reservations'];
  const flightAgentPerms = permissions.filter(p => flightAgentModules.includes(p.module));
  for (const p of flightAgentPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: flightAgentRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: flightAgentRole.id, permissionId: p.id },
    });
  }

  // Support Operator permissions
  const supportModules = ['dashboard', 'support', 'ai', 'passengers'];
  const supportPerms = permissions.filter(p =>
    supportModules.includes(p.module) &&
    !(p.module === 'passengers' && ['create', 'delete'].includes(p.action))
  );
  for (const p of supportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: supportOperatorRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: supportOperatorRole.id, permissionId: p.id },
    });
  }
  console.log('✅ Roles and permissions assigned');

  // ─── USERS ───────────────────────────────────────────────────────────────
  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aerocrm.com' },
    update: {},
    create: {
      email: 'admin@aerocrm.com',
      password: await hash('Admin1234!'),
      firstName: 'Carlos',
      lastName: 'Administrador',
      userType: 'STAFF',
      mustChangePassword: false,
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@aerocrm.com' },
    update: {},
    create: {
      email: 'agent1@aerocrm.com',
      password: await hash('Agent1234!'),
      firstName: 'María',
      lastName: 'García',
      dni: '12345678A',
      userType: 'STAFF',
      mustChangePassword: false,
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: agent1.id, roleId: flightAgentRole.id } },
    update: {},
    create: { userId: agent1.id, roleId: flightAgentRole.id },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@aerocrm.com' },
    update: {},
    create: {
      email: 'agent2@aerocrm.com',
      password: await hash('Agent1234!'),
      firstName: 'Luis',
      lastName: 'Martínez',
      dni: '87654321B',
      userType: 'STAFF',
      mustChangePassword: false,
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: agent2.id, roleId: flightAgentRole.id } },
    update: {},
    create: { userId: agent2.id, roleId: flightAgentRole.id },
  });

  const support1 = await prisma.user.upsert({
    where: { email: 'support1@aerocrm.com' },
    update: {},
    create: {
      email: 'support1@aerocrm.com',
      password: await hash('Support1234!'),
      firstName: 'Ana',
      lastName: 'López',
      dni: '11223344C',
      userType: 'STAFF',
      mustChangePassword: false,
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: support1.id, roleId: supportOperatorRole.id } },
    update: {},
    create: { userId: support1.id, roleId: supportOperatorRole.id },
  });

  const support2 = await prisma.user.upsert({
    where: { email: 'support2@aerocrm.com' },
    update: {},
    create: {
      email: 'support2@aerocrm.com',
      password: await hash('Support1234!'),
      firstName: 'Pedro',
      lastName: 'Rodríguez',
      dni: '44332211D',
      userType: 'STAFF',
      mustChangePassword: false,
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: support2.id, roleId: supportOperatorRole.id } },
    update: {},
    create: { userId: support2.id, roleId: supportOperatorRole.id },
  });
  console.log('✅ Users created');

  // ─── AIRPORTS ────────────────────────────────────────────────────────────
  const airports = [
    { iataCode: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' },
    { iataCode: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', timezone: 'America/New_York' },
    { iataCode: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
    { iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK', timezone: 'Europe/London' },
    { iataCode: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
    { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin' },
    { iataCode: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
    { iataCode: 'GRU', name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo' },
    { iataCode: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City' },
    { iataCode: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', timezone: 'America/Bogota' },
  ];

  const airportMap: Record<string, any> = {};
  for (const ap of airports) {
    const created = await prisma.airport.upsert({
      where: { iataCode: ap.iataCode },
      update: {},
      create: ap,
    });
    airportMap[ap.iataCode] = created;
  }
  console.log('✅ Airports created');

  // ─── ROUTES ──────────────────────────────────────────────────────────────
  const routeDefs = [
    { from: 'MAD', to: 'JFK', km: 5772 },
    { from: 'MAD', to: 'DXB', km: 5839 },
    { from: 'MAD', to: 'LHR', km: 1264 },
    { from: 'MAD', to: 'CDG', km: 1054 },
    { from: 'JFK', to: 'LHR', km: 5571 },
    { from: 'DXB', to: 'NRT', km: 7960 },
    { from: 'MAD', to: 'GRU', km: 9266 },
    { from: 'MAD', to: 'MEX', km: 9071 },
    { from: 'BOG', to: 'MAD', km: 8671 },
    { from: 'FRA', to: 'DXB', km: 4839 },
  ];

  const routeMap: Record<string, any> = {};
  for (const r of routeDefs) {
    const route = await prisma.route.upsert({
      where: { originId_destinationId: { originId: airportMap[r.from].id, destinationId: airportMap[r.to].id } },
      update: {},
      create: { originId: airportMap[r.from].id, destinationId: airportMap[r.to].id, distanceKm: r.km },
    });
    routeMap[`${r.from}-${r.to}`] = route;
  }
  console.log('✅ Routes created');

  // ─── GATES ───────────────────────────────────────────────────────────────
  const gates = [
    { code: 'A01', terminal: 'T1' }, { code: 'A02', terminal: 'T1' }, { code: 'A03', terminal: 'T1' },
    { code: 'B01', terminal: 'T2' }, { code: 'B02', terminal: 'T2' }, { code: 'B03', terminal: 'T2' },
    { code: 'C01', terminal: 'T3' }, { code: 'C02', terminal: 'T3' }, { code: 'C03', terminal: 'T4' },
    { code: 'D01', terminal: 'T4' },
  ];
  const gateMap: Record<string, any> = {};
  for (const g of gates) {
    const gate = await prisma.gate.upsert({ where: { code: g.code }, update: {}, create: g });
    gateMap[g.code] = gate;
  }
  console.log('✅ Gates created');

  // ─── FLIGHTS ─────────────────────────────────────────────────────────────
  const now = new Date();
  const future = (days: number, hours = 0) => new Date(now.getTime() + (days * 24 + hours) * 3600000);
  const past = (days: number, hours = 0) => new Date(now.getTime() - (days * 24 + hours) * 3600000);

  const flightData = [
    { num: 'AE-1001', route: 'MAD-JFK', gate: 'A01', dep: future(1, 2), arr: future(1, 12), status: FlightStatus.ON_TIME, aircraft: 'Boeing 777-300ER', total: 350, eco: 280, biz: 50, first: 20 },
    { num: 'AE-1002', route: 'MAD-DXB', gate: 'A02', dep: future(1, 4), arr: future(1, 12), status: FlightStatus.DELAYED, aircraft: 'Airbus A380-800', total: 450, eco: 360, biz: 70, first: 20 },
    { num: 'AE-1003', route: 'MAD-LHR', gate: 'B01', dep: future(0, 3), arr: future(0, 5), status: FlightStatus.BOARDING, aircraft: 'Airbus A320neo', total: 180, eco: 156, biz: 24, first: 0 },
    { num: 'AE-1004', route: 'MAD-CDG', gate: 'B02', dep: future(0, 1), arr: future(0, 3), status: FlightStatus.ON_TIME, aircraft: 'Airbus A321', total: 200, eco: 174, biz: 26, first: 0 },
    { num: 'AE-1005', route: 'JFK-LHR', gate: 'C01', dep: future(2, 6), arr: future(2, 14), status: FlightStatus.ON_TIME, aircraft: 'Boeing 787-9', total: 296, eco: 234, biz: 48, first: 14 },
    { num: 'AE-1006', route: 'DXB-NRT', gate: 'C02', dep: future(3), arr: future(3, 10), status: FlightStatus.CANCELLED, aircraft: 'Boeing 777-200LR', total: 314, eco: 252, biz: 48, first: 14 },
    { num: 'AE-1007', route: 'MAD-GRU', gate: 'A03', dep: future(1, 8), arr: future(2, 2), status: FlightStatus.ON_TIME, aircraft: 'Boeing 777-300ER', total: 350, eco: 280, biz: 50, first: 20 },
    { num: 'AE-1008', route: 'MAD-MEX', gate: 'B03', dep: future(4), arr: future(4, 12), status: FlightStatus.ON_TIME, aircraft: 'Airbus A350-900', total: 325, eco: 260, biz: 48, first: 17 },
    { num: 'AE-1009', route: 'BOG-MAD', gate: 'C03', dep: past(0, 2), arr: future(0, 8), status: FlightStatus.DEPARTED, aircraft: 'Boeing 787-9', total: 296, eco: 234, biz: 48, first: 14 },
    { num: 'AE-1010', route: 'FRA-DXB', gate: 'D01', dep: past(1), arr: past(0, 16), status: FlightStatus.LANDED, aircraft: 'Airbus A380-800', total: 450, eco: 360, biz: 70, first: 20 },
    { num: 'AE-1011', route: 'MAD-JFK', gate: 'A01', dep: future(5), arr: future(5, 10), status: FlightStatus.ON_TIME, aircraft: 'Boeing 777-300ER', total: 350, eco: 280, biz: 50, first: 20 },
    { num: 'AE-1012', route: 'MAD-DXB', gate: 'A02', dep: future(6), arr: future(6, 8), status: FlightStatus.ON_TIME, aircraft: 'Airbus A350-900', total: 325, eco: 260, biz: 48, first: 17 },
    { num: 'AE-1013', route: 'MAD-LHR', gate: 'B01', dep: past(2), arr: past(2, -2), status: FlightStatus.LANDED, aircraft: 'Airbus A320neo', total: 180, eco: 156, biz: 24, first: 0 },
    { num: 'AE-1014', route: 'JFK-LHR', gate: 'C01', dep: past(3), arr: past(3, -8), status: FlightStatus.LANDED, aircraft: 'Boeing 787-9', total: 296, eco: 234, biz: 48, first: 14 },
    { num: 'AE-1015', route: 'MAD-CDG', gate: 'B02', dep: future(0, 6), arr: future(0, 8), status: FlightStatus.DELAYED, aircraft: 'Airbus A321', total: 200, eco: 174, biz: 26, first: 0 },
  ];

  const flightMap: Record<string, any> = {};
  for (const f of flightData) {
    const flight = await prisma.flight.upsert({
      where: { flightNumber: f.num },
      update: { status: f.status },
      create: {
        flightNumber: f.num,
        routeId: routeMap[f.route].id,
        gateId: gateMap[f.gate].id,
        scheduledDeparture: f.dep,
        scheduledArrival: f.arr,
        status: f.status,
        aircraft: f.aircraft,
        totalSeats: f.total,
        economySeats: f.eco,
        businessSeats: f.biz,
        firstClassSeats: f.first,
      },
    });
    flightMap[f.num] = flight;
  }
  console.log('✅ Flights created');

  // ─── PASSENGERS ──────────────────────────────────────────────────────────
  const passengersData = [
    { firstName: 'James', lastName: 'Harrison', email: 'j.harrison@email.com', phone: '+1-212-555-0101', nationality: 'US', dob: new Date('1985-03-15'), passport: 'US7845123', passExpiry: new Date('2029-03-15'), ffn: 'AE-GOLD-001', tier: PassengerTier.GOLD, meal: 'standard' },
    { firstName: 'Sofia', lastName: 'Ricci', email: 's.ricci@email.com', phone: '+39-02-555-0202', nationality: 'IT', dob: new Date('1990-07-22'), passport: 'IT8812345', passExpiry: new Date('2028-07-22'), ffn: 'AE-PLAT-001', tier: PassengerTier.PLATINUM, meal: 'vegetarian' },
    { firstName: 'Mohammed', lastName: 'Al-Rashid', email: 'm.alrashid@email.com', phone: '+971-4-555-0303', nationality: 'AE', dob: new Date('1978-11-05'), passport: 'AE6634521', passExpiry: new Date('2027-11-05'), ffn: 'AE-PLAT-002', tier: PassengerTier.PLATINUM, meal: 'halal' },
    { firstName: 'Emma', lastName: 'Thompson', email: 'e.thompson@email.com', phone: '+44-20-555-0404', nationality: 'GB', dob: new Date('1992-04-30'), passport: 'GB9912345', passExpiry: new Date('2030-04-30'), ffn: 'AE-SILV-001', tier: PassengerTier.SILVER, meal: 'standard' },
    { firstName: 'Carlos', lastName: 'Mendoza', email: 'c.mendoza@email.com', phone: '+52-55-555-0505', nationality: 'MX', dob: new Date('1983-09-18'), passport: 'MX7723456', passExpiry: new Date('2026-09-18'), ffn: 'AE-GOLD-002', tier: PassengerTier.GOLD, meal: 'standard' },
    { firstName: 'Yuki', lastName: 'Tanaka', email: 'y.tanaka@email.com', phone: '+81-3-555-0606', nationality: 'JP', dob: new Date('1995-01-25'), passport: 'JP8845678', passExpiry: new Date('2031-01-25'), ffn: 'AE-SILV-002', tier: PassengerTier.SILVER, meal: 'standard' },
    { firstName: 'Isabela', lastName: 'Santos', email: 'i.santos@email.com', phone: '+55-11-555-0707', nationality: 'BR', dob: new Date('1988-06-12'), passport: 'BR6612345', passExpiry: new Date('2029-06-12'), ffn: null, tier: PassengerTier.STANDARD, meal: 'standard' },
    { firstName: 'François', lastName: 'Dubois', email: 'f.dubois@email.com', phone: '+33-1-555-0808', nationality: 'FR', dob: new Date('1975-12-03'), passport: 'FR7734567', passExpiry: new Date('2028-12-03'), ffn: 'AE-GOLD-003', tier: PassengerTier.GOLD, meal: 'standard' },
    { firstName: 'Aisha', lastName: 'Patel', email: 'a.patel@email.com', phone: '+91-22-555-0909', nationality: 'IN', dob: new Date('1991-08-14'), passport: 'IN9956789', passExpiry: new Date('2030-08-14'), ffn: null, tier: PassengerTier.STANDARD, meal: 'vegetarian' },
    { firstName: 'Hans', lastName: 'Mueller', email: 'h.mueller@email.com', phone: '+49-69-555-1010', nationality: 'DE', dob: new Date('1969-02-28'), passport: 'DE5523456', passExpiry: new Date('2027-02-28'), ffn: 'AE-PLAT-003', tier: PassengerTier.PLATINUM, meal: 'standard' },
    { firstName: 'Laura', lastName: 'González', email: 'l.gonzalez@email.com', phone: '+34-91-555-1111', nationality: 'ES', dob: new Date('1993-05-17'), passport: 'ES8834567', passExpiry: new Date('2029-05-17'), ffn: 'AE-SILV-003', tier: PassengerTier.SILVER, meal: 'vegan' },
    { firstName: 'David', lastName: 'Kim', email: 'd.kim@email.com', phone: '+82-2-555-1212', nationality: 'KR', dob: new Date('1987-10-09'), passport: 'KR7745678', passExpiry: new Date('2028-10-09'), ffn: null, tier: PassengerTier.STANDARD, meal: 'standard' },
    { firstName: 'Valentina', lastName: 'Rossi', email: 'v.rossi@email.com', phone: '+39-06-555-1313', nationality: 'IT', dob: new Date('1998-03-21'), passport: 'IT9956789', passExpiry: new Date('2032-03-21'), ffn: null, tier: PassengerTier.STANDARD, meal: 'standard' },
    { firstName: 'Omar', lastName: 'Hassan', email: 'o.hassan@email.com', phone: '+20-2-555-1414', nationality: 'EG', dob: new Date('1980-07-07'), passport: 'EG6612345', passExpiry: new Date('2027-07-07'), ffn: 'AE-GOLD-004', tier: PassengerTier.GOLD, meal: 'halal' },
    { firstName: 'Camila', lastName: 'Restrepo', email: 'c.restrepo@email.com', phone: '+57-1-555-1515', nationality: 'CO', dob: new Date('1994-11-30'), passport: 'CO8823456', passExpiry: new Date('2030-11-30'), ffn: 'AE-SILV-004', tier: PassengerTier.SILVER, meal: 'standard' },
    { firstName: 'Antoine', lastName: 'Martin', email: 'a.martin@email.com', phone: '+33-4-555-1616', nationality: 'FR', dob: new Date('1972-04-15'), passport: 'FR6634567', passExpiry: new Date('2028-04-15'), ffn: 'AE-GOLD-005', tier: PassengerTier.GOLD, meal: 'standard' },
    { firstName: 'Mei', lastName: 'Chen', email: 'm.chen@email.com', phone: '+86-10-555-1717', nationality: 'CN', dob: new Date('1996-09-05'), passport: 'CN9945678', passExpiry: new Date('2031-09-05'), ffn: null, tier: PassengerTier.STANDARD, meal: 'standard' },
    { firstName: 'Patrick', lastName: 'O\'Brien', email: 'p.obrien@email.com', phone: '+353-1-555-1818', nationality: 'IE', dob: new Date('1982-01-20'), passport: 'IE7756789', passExpiry: new Date('2029-01-20'), ffn: 'AE-SILV-005', tier: PassengerTier.SILVER, meal: 'standard' },
    { firstName: 'Nadia', lastName: 'Volkov', email: 'n.volkov@email.com', phone: '+7-495-555-1919', nationality: 'RU', dob: new Date('1989-06-25'), passport: 'RU8867890', passExpiry: new Date('2030-06-25'), ffn: null, tier: PassengerTier.STANDARD, meal: 'standard' },
    { firstName: 'Rodrigo', lastName: 'Alves', email: 'r.alves@email.com', phone: '+55-21-555-2020', nationality: 'BR', dob: new Date('1976-12-10'), passport: 'BR5578901', passExpiry: new Date('2027-12-10'), ffn: 'AE-GOLD-006', tier: PassengerTier.GOLD, meal: 'standard' },
  ];

  const passengerMap: Record<string, any> = {};
  for (const p of passengersData) {
    const passenger = await prisma.passenger.upsert({
      where: { email: p.email },
      update: {},
      create: {
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        nationality: p.nationality,
        dateOfBirth: p.dob,
        passportNumber: p.passport,
        passportExpiry: p.passExpiry,
        frequentFlyerNumber: p.ffn,
        tier: p.tier,
        preferenceMeal: p.meal,
        preferenceWindow: Math.random() > 0.5,
        preferenceAisle: Math.random() > 0.6,
      },
    });
    passengerMap[p.email] = passenger;
  }
  console.log('✅ Passengers created');

  // ─── RESERVATIONS & ANCILLARIES ──────────────────────────────────────────
  const passengersList = Object.values(passengerMap);
  const flightKeys = Object.keys(flightMap);
  const fareClasses = [FareClass.ECONOMY, FareClass.ECONOMY, FareClass.ECONOMY, FareClass.PREMIUM_ECONOMY, FareClass.BUSINESS, FareClass.FIRST_CLASS];
  const basePrices: Record<string, number> = { ECONOMY: 320, PREMIUM_ECONOMY: 650, BUSINESS: 1850, FIRST_CLASS: 4200 };

  let refCounter = 1000;
  for (let i = 0; i < 30; i++) {
    const passenger = passengersList[i % passengersList.length];
    const flightKey = flightKeys[i % flightKeys.length];
    const flight = flightMap[flightKey];
    const fareClass = fareClasses[i % fareClasses.length];
    const price = basePrices[fareClass] + Math.floor(Math.random() * 200);
    const ref = `AE-${++refCounter}`;

    const reservation = await prisma.reservation.upsert({
      where: { bookingReference: ref },
      update: {},
      create: {
        bookingReference: ref,
        passengerId: passenger.id,
        flightId: flight.id,
        fareClass,
        seatNumber: `${Math.floor(Math.random() * 40) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`,
        status: i < 25 ? ReservationStatus.CONFIRMED : ReservationStatus.CHECKED_IN,
        totalPrice: price,
        currency: 'USD',
      },
    });

    // Add ancillaries
    const ancTypes: AncillaryType[] = [AncillaryType.EXTRA_BAGGAGE, AncillaryType.PREFERRED_SEAT, AncillaryType.LOUNGE_ACCESS, AncillaryType.PRIORITY_BOARDING];
    const numAnc = Math.floor(Math.random() * 3);
    for (let j = 0; j < numAnc; j++) {
      const ancType = ancTypes[j % ancTypes.length];
      const unitPrice = ancType === AncillaryType.LOUNGE_ACCESS ? 85 : ancType === AncillaryType.EXTRA_BAGGAGE ? 45 : 25;
      const qty = 1;
      await prisma.ancillary.create({
        data: {
          reservationId: reservation.id,
          type: ancType,
          description: ancType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          quantity: qty,
          unitPrice,
          totalPrice: unitPrice * qty,
        },
      });
    }
  }
  console.log('✅ Reservations and ancillaries created');

  // ─── FLIGHT HISTORY ──────────────────────────────────────────────────────
  const completedFlights = [flightMap['AE-1010'], flightMap['AE-1013'], flightMap['AE-1014']];
  for (const pax of passengersList.slice(0, 10)) {
    for (const flight of completedFlights.slice(0, 2)) {
      if (!flight) continue;
      const existing = await prisma.flightHistory.findFirst({ where: { passengerId: pax.id, flightId: flight.id } });
      if (!existing) {
        await prisma.flightHistory.create({
          data: {
            passengerId: pax.id,
            flightId: flight.id,
            fareClass: FareClass.ECONOMY,
            completedAt: past(Math.floor(Math.random() * 30) + 1),
            milesEarned: Math.floor(Math.random() * 5000) + 500,
          },
        });
      }
    }
  }
  console.log('✅ Flight history created');

  // ─── SUPPORT TICKETS ─────────────────────────────────────────────────────
  const ticketScenarios = [
    { subject: 'Equipaje perdido en vuelo AE-1010', channel: SupportChannel.EMAIL, priority: TicketPriority.URGENT, status: TicketStatus.OPEN, msg: 'Mi maleta no apareció en la cinta de equipajes después del vuelo AE-1010. Contenía artículos personales de gran valor. Necesito ayuda urgente para localizarla.' },
    { subject: 'Solicitud de upgrade a Business Class', channel: SupportChannel.WEB, priority: TicketPriority.LOW, status: TicketStatus.OPEN, msg: 'Buenos días, quisiera conocer las opciones disponibles para hacer upgrade a Business Class en mi próximo vuelo AE-1001. Soy cliente Gold.' },
    { subject: 'Vuelo retrasado - solicito compensación', channel: SupportChannel.TWITTER, priority: TicketPriority.HIGH, status: TicketStatus.IN_PROGRESS, msg: 'Llevo 3 horas esperando en el aeropuerto. El vuelo AE-1002 lleva 2 horas de retraso y nadie nos da información. Exijo compensación según normativa EU261.' },
    { subject: 'Cambio de fecha de reserva AE-1001', channel: SupportChannel.PHONE, priority: TicketPriority.MEDIUM, status: TicketStatus.OPEN, msg: 'Necesito cambiar la fecha de mi reserva AE-1001 para la semana siguiente. Mi número de reserva es AE-1001. ¿Cuál es el cargo por cambio?' },
    { subject: 'Problema con acceso al salón VIP', channel: SupportChannel.WEB, priority: TicketPriority.MEDIUM, status: TicketStatus.RESOLVED, msg: 'Tengo contratado el servicio de lounge access pero en el aeropuerto no me dejan entrar. Mi tarjeta de embarque muestra el servicio contratado. Por favor ayúdenme.' },
    { subject: 'Asiento asignado diferente al reservado', channel: SupportChannel.EMAIL, priority: TicketPriority.HIGH, status: TicketStatus.OPEN, msg: 'Reservé el asiento 12A (ventana) pero me han asignado el 28C (pasillo). Tengo documentación del asiento reservado. Solicito corrección.' },
    { subject: 'Reembolso por cancelación de vuelo AE-1006', channel: SupportChannel.EMAIL, priority: TicketPriority.HIGH, status: TicketStatus.IN_PROGRESS, msg: 'El vuelo AE-1006 fue cancelado y aún no he recibido el reembolso prometido. Han pasado 10 días hábiles. Número de caso: N/A. Necesito resolución urgente.' },
    { subject: 'Necesito silla de ruedas en próximo vuelo', channel: SupportChannel.PHONE, priority: TicketPriority.HIGH, status: TicketStatus.OPEN, msg: 'Mi madre viaja en el vuelo AE-1008 y necesita asistencia con silla de ruedas en el aeropuerto. ¿Cómo puedo solicitar este servicio con anticipación?' },
    { subject: 'Opinión sobre el servicio de a bordo', channel: SupportChannel.WEB, priority: TicketPriority.LOW, status: TicketStatus.CLOSED, msg: 'Quería dejar constancia de mi excelente experiencia en el vuelo de Madrid a Dubai. El servicio fue impecable y la tripulación muy atenta. Seguiré eligiendo AeroCRM.' },
    { subject: 'Error en nombre en el ticket de vuelo', channel: SupportChannel.EMAIL, priority: TicketPriority.URGENT, status: TicketStatus.OPEN, msg: 'Mi nombre aparece mal escrito en el billete. El correcto es François Dubois y aparece como Francois Duboi. El vuelo es mañana y me preocupa tener problemas en el aeropuerto.' },
    { subject: 'Mascotas en cabina - política de la aerolínea', channel: SupportChannel.WEB, priority: TicketPriority.LOW, status: TicketStatus.OPEN, msg: 'Quisiera información sobre la política de viaje con mascotas. Tengo un gato de 4kg y me gustaría llevarlo en cabina si es posible.' },
    { subject: 'Cobro duplicado en tarjeta de crédito', channel: SupportChannel.EMAIL, priority: TicketPriority.URGENT, status: TicketStatus.ESCALATED, msg: 'Noto que me han cobrado dos veces el mismo importe de $1,850 por mi reserva de Business Class. Adjunto extracto bancario. Solicito reembolso inmediato del cargo duplicado.' },
    { subject: 'Información sobre programa de millas', channel: SupportChannel.WEB, priority: TicketPriority.LOW, status: TicketStatus.RESOLVED, msg: '¿Cómo puedo canjear mis millas acumuladas? Tengo 45,000 millas y me gustaría usarlas para un vuelo a Tokyo. ¿Cuántas necesito para un vuelo en Economy?' },
    { subject: 'Menú especial no entregado en vuelo', channel: SupportChannel.EMAIL, priority: TicketPriority.MEDIUM, status: TicketStatus.OPEN, msg: 'Había solicitado menú vegetariano con 72h de anticipación pero en el vuelo me dijeron que no había registro de mi solicitud. Tuve que saltarme la comida.' },
    { subject: 'Factura para empresa no recibida', channel: SupportChannel.EMAIL, priority: TicketPriority.MEDIUM, status: TicketStatus.IN_PROGRESS, msg: 'Necesito la factura con los datos de mi empresa para el viaje del 15 de julio. NIF: B12345678. Empresa: Consultoría Tech SL. Número de reserva AE-1003.' },
    { subject: 'Retraso en entrega de equipaje - 2 días', channel: SupportChannel.TWITTER, priority: TicketPriority.URGENT, status: TicketStatus.ESCALATED, msg: 'Llegué hace 2 días y mi maleta sigue sin aparecer. El reporte fue interpuesto pero nadie me da seguimiento. ¡Necesito mis medicamentos que están en esa maleta!' },
    { subject: 'Solicitud de certificado de vuelo', channel: SupportChannel.WEB, priority: TicketPriority.LOW, status: TicketStatus.OPEN, msg: 'Necesito un certificado oficial de que viajé en el vuelo AE-1014 para presentarlo en mi empresa como comprobante de viaje de negocios.' },
    { subject: 'Wifi no funcionaba en vuelo de larga distancia', channel: SupportChannel.WEB, priority: TicketPriority.LOW, status: TicketStatus.CLOSED, msg: 'El servicio de wifi que pagué durante el vuelo no funcionó durante las primeras 4 horas. Solicito reembolso parcial del costo del servicio.' },
    { subject: 'Niño viajando solo - protocolos', channel: SupportChannel.PHONE, priority: TicketPriority.HIGH, status: TicketStatus.OPEN, msg: 'Mi hijo de 12 años viajará solo a Madrid. ¿Cuáles son los protocolos de menores no acompañados? ¿Hay algún cargo adicional por este servicio?' },
    { subject: 'Actualización de datos de pasajero frecuente', channel: SupportChannel.WEB, priority: TicketPriority.LOW, status: TicketStatus.RESOLVED, msg: 'Necesito actualizar mi número de teléfono y dirección de correo electrónico en mi perfil de viajero frecuente. El acceso a la app no me permite hacerlo.' },
  ];

  const ticketPaxList = Object.values(passengerMap);
  const operatorIds = [support1.id, support2.id];
  let ticketNum = 10000;

  for (let i = 0; i < ticketScenarios.length; i++) {
    const scenario = ticketScenarios[i];
    const pax = ticketPaxList[i % ticketPaxList.length];
    const tNum = `TKT-${++ticketNum}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: tNum,
        passengerId: pax.id,
        assignedToId: scenario.status !== TicketStatus.OPEN ? operatorIds[i % 2] : null,
        subject: scenario.subject,
        channel: scenario.channel,
        status: scenario.status,
        priority: scenario.priority,
        sentimentLabel: scenario.priority === TicketPriority.URGENT ? 'urgent' : scenario.priority === TicketPriority.HIGH ? 'negative' : 'neutral',
        sentimentScore: scenario.priority === TicketPriority.URGENT ? -0.9 : scenario.priority === TicketPriority.HIGH ? -0.6 : 0.0,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000),
        resolvedAt: scenario.status === TicketStatus.RESOLVED || scenario.status === TicketStatus.CLOSED ? new Date() : null,
      },
    });

    // Initial message from passenger
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorType: 'passenger',
        authorName: `${pax.firstName} ${pax.lastName}`,
        content: scenario.msg,
        channel: scenario.channel,
        isInternal: false,
      },
    });

    // Operator response if not open
    if (scenario.status !== TicketStatus.OPEN) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId: operatorIds[i % 2],
          authorType: 'operator',
          authorName: i % 2 === 0 ? 'Ana López' : 'Pedro Rodríguez',
          content: 'Estimado/a pasajero/a, hemos recibido su consulta y estamos trabajando para resolverla a la mayor brevedad posible. Le mantendremos informado/a sobre el progreso. Disculpe las molestias ocasionadas.',
          isInternal: false,
        },
      });
    }

    // Internal note for escalated/urgent
    if (scenario.status === TicketStatus.ESCALATED || scenario.priority === TicketPriority.URGENT) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId: operatorIds[i % 2],
          authorType: 'operator',
          authorName: 'Sistema',
          content: 'Ticket marcado como prioritario. Requiere atención inmediata del supervisor.',
          isInternal: true,
        },
      });
    }
  }
  console.log('✅ Support tickets created');

  console.log('\n✅ ✅ ✅ Seed completed successfully!\n');
  console.log('📋 Login credentials:');
  console.log('  Admin:    admin@aerocrm.com    / Admin1234!');
  console.log('  Agent 1:  agent1@aerocrm.com   / Agent1234!');
  console.log('  Agent 2:  agent2@aerocrm.com   / Agent1234!');
  console.log('  Support 1: support1@aerocrm.com / Support1234!');
  console.log('  Support 2: support2@aerocrm.com / Support1234!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

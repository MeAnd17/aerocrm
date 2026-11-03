import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcryptjs from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { configureApp } from '../src/app.setup';

// Las pruebas e2e nunca tocan la base compartida: PrismaService se reemplaza por un doble.
const prismaFalso = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
  $transaction: jest.fn(),
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  },
  flight: {
    findUnique: jest.fn(),
  },
  booking: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn(),
  },
  client: {
    update: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn(),
    findFirst: jest.fn().mockResolvedValue(null),
    count: jest.fn(),
  },
  pointsHistory: {
    create: jest.fn().mockResolvedValue({}),
  },
  hotel: {
    findUnique: jest.fn(),
  },
  activity: {
    findUnique: jest.fn(),
  },
  extraOption: {
    findFirst: jest.fn(),
  },
  destination: {
    count: jest.fn(),
  },
  contactMessage: {
    create: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-solo-para-pruebas';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaFalso)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health responde 200', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('responde los errores de validación en español', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'no-es-correo', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toEqual(expect.arrayContaining(['Ingresa un correo electrónico válido', 'Ingresa tu contraseña']));
  });

  it('rechaza campos no permitidos con mensaje en español', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'a@b.pe', password: 'x', rol: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('El campo rol no está permitido');
  });

  it('responde en español a una ruta que no existe y a una sesión ausente', async () => {
    const notFound = await request(app.getHttpServer()).get('/api/no-existe');
    expect(notFound.status).toBe(404);
    expect(notFound.body.message).toBe('No encontramos lo que buscas');

    const noSession = await request(app.getHttpServer()).get('/api/loyalty/status');
    expect(noSession.status).toBe(401);
    expect(noSession.body.message).toBe('Tu sesión no es válida o expiró. Inicia sesión de nuevo');
  });

  it('POST /api/bookings/quote rechaza la petición si falta el vuelo de regreso', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/bookings/quote')
      .send({ flightId: 1, passengers: 2 });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/auth/change-password responde 400 con contraseña actual incorrecta', async () => {
    const hashCorrecto = await bcryptjs.hash('Correcta1', 10);
    const usuarioFalso = { id: 99, email: 'usuario@test.pe', password: hashCorrecto, isActive: true, role: 'CLIENT', client: null };
    // JwtStrategy.validate llama findUnique primero; luego AuthService.changePassword lo llama una segunda vez.
    prismaFalso.user.findUnique
      .mockResolvedValueOnce(usuarioFalso)
      .mockResolvedValueOnce(usuarioFalso);
    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: null, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Incorrecta1', newPassword: 'NuevaContraseña2' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La contraseña actual no es correcta');
  });

  it('PATCH /api/auth/change-password responde 200 con credenciales correctas', async () => {
    const hashCorrecto = await bcryptjs.hash('Correcta1', 10);
    const usuarioFalso = { id: 99, email: 'usuario@test.pe', password: hashCorrecto, isActive: true, role: 'CLIENT', client: null };
    // JwtStrategy.validate llama findUnique primero; luego AuthService.changePassword lo llama una segunda vez.
    prismaFalso.user.findUnique
      .mockResolvedValueOnce(usuarioFalso)
      .mockResolvedValueOnce(usuarioFalso);
    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: null, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Correcta1', newPassword: 'NuevaContraseña2' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Contraseña actualizada');
  });

  it('POST /api/auth/register responde 201 con token y role CLIENT', async () => {
    const nuevoUsuario = {
      id: 10,
      email: 'nuevo@test.pe',
      firstName: 'Ana',
      lastName: 'López',
      role: 'CLIENT',
      client: { id: 5, membershipLevel: 'EXPLORADOR', availablePoints: 0, completedTrips: 0 },
    };
    // findUnique retorna null: el correo no existe aún.
    prismaFalso.user.findUnique.mockResolvedValueOnce(null);
    // create retorna el usuario con su cliente anidado.
    prismaFalso.user.create.mockResolvedValueOnce(nuevoUsuario);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'nuevo@test.pe',
        password: 'Segura123',
        firstName: 'Ana',
        lastName: 'López',
        phone: '987654321',
        nationality: 'PE',
      });

    expect(res.status).toBe(201);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.role).toBe('CLIENT');
  });

  it('POST /api/auth/login responde 401 con credenciales incorrectas', async () => {
    // findUnique retorna null: el usuario no existe.
    prismaFalso.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.pe', password: 'Cualquiera1' });

    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login responde 201 con token para credenciales válidas', async () => {
    const hash = await bcryptjs.hash('Valida123', 10);
    const usuarioActivo = {
      id: 20,
      email: 'activo@test.pe',
      password: hash,
      firstName: 'Luis',
      lastName: 'Vera',
      isActive: true,
      role: 'CLIENT',
      client: { id: 8, membershipLevel: 'EXPLORADOR', availablePoints: 0, completedTrips: 0 },
    };
    // JwtStrategy.validate y AuthService.login comparten la misma llamada a findUnique.
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioActivo);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'activo@test.pe', password: 'Valida123' });

    expect(res.status).toBe(201);
    expect(res.body.access_token).toBeDefined();
  });

  it('POST /api/bookings/quote responde 201 con desglose para vuelo de ida y regreso', async () => {
    const vueloBase = {
      id: 1,
      flightNumber: 'LA501',
      airline: 'LATAM',
      departureDate: new Date('2025-06-01T08:00:00Z'),
      pricePerPerson: new Prisma.Decimal('350.00'),
      isActive: true,
      destinationId: 3,
      origin: { id: 1, name: 'Lima' },
      destination: { id: 3, name: 'Cusco' },
    };
    const vueloRegreso = {
      ...vueloBase,
      id: 2,
      flightNumber: 'LA502',
      departureDate: new Date('2025-06-08T16:00:00Z'),
    };
    // Primer findUnique: vuelo de ida. Segundo: vuelo de regreso.
    prismaFalso.flight.findUnique
      .mockResolvedValueOnce(vueloBase)
      .mockResolvedValueOnce(vueloRegreso);

    const res = await request(app.getHttpServer())
      .post('/api/bookings/quote')
      .send({ flightId: 1, returnFlightId: 2, passengers: 2 });

    expect(res.status).toBe(201);
    expect(res.body.breakdown).toBeDefined();
    expect(res.body.breakdown.outboundFlight).toBeDefined();
    expect(res.body.breakdown.returnFlight).toBeDefined();
    expect(res.body.breakdown.total).toBeGreaterThan(0);
  });

  it('POST /api/bookings/quote con pointsToRedeem: 499 devuelve 400 (mínimo 500)', async () => {
    const vueloBase = {
      id: 1, flightNumber: 'LA501', airline: 'LATAM',
      departureDate: new Date('2025-06-01T08:00:00Z'),
      pricePerPerson: new Prisma.Decimal('350.00'),
      isActive: true, destinationId: 3,
      origin: { id: 1, name: 'Lima' }, destination: { id: 3, name: 'Cusco' },
    };
    prismaFalso.flight.findUnique
      .mockResolvedValueOnce(vueloBase)
      .mockResolvedValueOnce({ ...vueloBase, id: 2, flightNumber: 'LA502' });

    const res = await request(app.getHttpServer())
      .post('/api/bookings/quote')
      .send({ flightId: 1, returnFlightId: 2, passengers: 1, pointsToRedeem: 499 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('500');
  });

  it('POST /api/bookings/quote con pointsToRedeem aplica descuento y respeta tope 50 %', async () => {
    // Paquete: S/.350 (ida) + S/.350 (vuelta) = S/.700 subtotal. Tope 50 % = S/.350.
    // Cliente: 1000 puntos disponibles, 0 viajes (Explorador, sin bono de nivel).
    // pointsToRedeem: 1000 → se truncan a los que caben bajo el tope → 3500 / 10 = 350 pts → S/.35 discount.
    // En realidad: 700 * 50% = 350 cents → 350/10 = 35 pts → pero pedimos 1000.
    // Exactamente: tope = Math.floor(700*50/100)=350 (céntimos * 100 = S/.350)
    // pointsThatFit = Math.floor(35000 / 10) = 3500 → pedimos 1000 < 3500, todo entra.
    // discountByRedemption = 1000 * 10 = 10000 céntimos = S/.100.
    // final = S/.700 - S/.100 = S/.600.
    const vueloBase = {
      id: 1, flightNumber: 'LA501', airline: 'LATAM',
      departureDate: new Date('2025-06-01T08:00:00Z'),
      pricePerPerson: new Prisma.Decimal('350.00'),
      isActive: true, destinationId: 3,
      origin: { id: 1, name: 'Lima' }, destination: { id: 3, name: 'Cusco' },
    };
    // JwtStrategy.validate para el token, luego client.findFirst en quote().
    const usuarioFalso = { id: 55, email: 'cliente@test.pe', isActive: true, role: 'CLIENT', client: { id: 9 } };
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioFalso);
    const clienteFalso = { id: 9, availablePoints: 1000, completedTrips: 0 };
    prismaFalso.client.findFirst = jest.fn().mockResolvedValueOnce(clienteFalso);
    prismaFalso.flight.findUnique
      .mockResolvedValueOnce(vueloBase)
      .mockResolvedValueOnce({ ...vueloBase, id: 2, flightNumber: 'LA502' });

    const token = jwtService.sign({ sub: 55, email: 'cliente@test.pe', clientId: 9, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .post('/api/bookings/quote')
      .set('Authorization', `Bearer ${token}`)
      .send({ flightId: 1, returnFlightId: 2, passengers: 1, pointsToRedeem: 1000 });

    expect(res.status).toBe(201);
    expect(res.body.breakdown.discountByRedemption).toBeCloseTo(100, 1);
    expect(res.body.breakdown.pointsDiscountAmount).toBeCloseTo(100, 1);
    expect(res.body.breakdown.levelDiscountAmount).toBeCloseTo(0, 1);
    expect(res.body.breakdown.total).toBeCloseTo(600, 1);
    expect(res.body.pointsToRedeem).toBe(1000);
  });

  it('POST /api/bookings/quote con nivel ELITE aplica bono de nivel al canjear', async () => {
    // Paquete: S/.700. Cliente Elite (16 viajes → 15 % bono).
    // pointsToRedeem: 500 → S/.50 pts discount + S/.700*15% = S/.105 nivel discount.
    // Total discount = S/.155. Total = S/.700 - S/.155 = S/.545.
    const vueloBase = {
      id: 1, flightNumber: 'LA501', airline: 'LATAM',
      departureDate: new Date('2025-06-01T08:00:00Z'),
      pricePerPerson: new Prisma.Decimal('350.00'),
      isActive: true, destinationId: 3,
      origin: { id: 1, name: 'Lima' }, destination: { id: 3, name: 'Cusco' },
    };
    const usuarioFalso = { id: 77, email: 'elite@test.pe', isActive: true, role: 'CLIENT', client: { id: 11 } };
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioFalso);
    const clienteElite = { id: 11, availablePoints: 2524, completedTrips: 16 };
    prismaFalso.client.findFirst = jest.fn().mockResolvedValueOnce(clienteElite);
    prismaFalso.flight.findUnique
      .mockResolvedValueOnce(vueloBase)
      .mockResolvedValueOnce({ ...vueloBase, id: 2, flightNumber: 'LA502' });

    const token = jwtService.sign({ sub: 77, email: 'elite@test.pe', clientId: 11, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .post('/api/bookings/quote')
      .set('Authorization', `Bearer ${token}`)
      .send({ flightId: 1, returnFlightId: 2, passengers: 1, pointsToRedeem: 500 });

    expect(res.status).toBe(201);
    expect(res.body.breakdown.pointsDiscountAmount).toBeCloseTo(50, 1);
    expect(res.body.breakdown.levelDiscountAmount).toBeCloseTo(105, 1);
    expect(res.body.breakdown.discountByRedemption).toBeCloseTo(155, 1);
    expect(res.body.breakdown.total).toBeCloseTo(545, 1);
  });

  it('POST /api/bookings rechaza lista de pasajeros vacía con 400', async () => {
    // JwtStrategy.validate llama findUnique para verificar el token.
    const usuarioBase = { id: 99, email: 'usuario@test.pe', isActive: true, role: 'CLIENT', client: { id: 5 } };
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioBase);
    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: 5, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        passengers: [],
        flights: [{ flightId: 1 }, { flightId: 2 }],
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/bookings crea reserva con pasajeros y devuelve bookingPassengers', async () => {
    const vueloIda = {
      id: 1, flightNumber: 'LA501', airline: 'LATAM',
      departureDate: new Date('2025-08-10T08:00:00Z'),
      pricePerPerson: new Prisma.Decimal('350.00'),
      isActive: true, destinationId: 3,
      origin: { id: 1, name: 'Lima' }, destination: { id: 3, name: 'Cusco' },
    };
    const vueloVuelta = { ...vueloIda, id: 2, flightNumber: 'LA502' };
    const clienteFalso = {
      id: 5, availablePoints: 0, completedTrips: 0,
      membershipLevel: 'EXPLORADOR',
    };
    const usuarioFalso = {
      id: 99, email: 'usuario@test.pe', isActive: true,
      role: 'CLIENT', client: clienteFalso,
    };
    const reservaCreada = {
      id: 'cld123', confirmationCode: 'VJ-ABC123',
      status: 'CONFIRMADO', totalPrice: new Prisma.Decimal('700.00'),
      passengers: 1, bookingFlights: [], bookingHotels: [],
      bookingActivities: [], bookingExtras: [],
      bookingPassengers: [
        { id: 1, bookingId: 'cld123', firstName: 'Ana', lastName: 'López',
          documentNumber: '70000001', birthDate: new Date('1990-01-01'), isHolder: true },
      ],
    };

    // Llamada 1: JwtStrategy.validate. Llamada 2: BookingsService.create (include: { client: true }).
    prismaFalso.user.findUnique
      .mockResolvedValueOnce(usuarioFalso)
      .mockResolvedValueOnce(usuarioFalso);
    prismaFalso.flight.findUnique
      .mockResolvedValueOnce(vueloIda)
      .mockResolvedValueOnce(vueloVuelta);
    prismaFalso.booking.findFirst.mockResolvedValueOnce(null);
    prismaFalso.$transaction.mockImplementationOnce(async (fn: (tx: typeof prismaFalso) => Promise<typeof reservaCreada>) => fn(prismaFalso));
    prismaFalso.booking.create.mockResolvedValueOnce(reservaCreada);

    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: 5, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        passengers: [{ firstName: 'Ana', lastName: 'López', documentType: 'DNI', documentNumber: '70000001', birthDate: '1990-01-01', isHolder: true }],
        flights: [{ flightId: 1 }, { flightId: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.bookingPassengers).toBeDefined();
    expect(res.body.bookingPassengers).toHaveLength(1);
    expect(res.body.bookingPassengers[0].isHolder).toBe(true);
  });

  it('PATCH /api/bookings/:id/status — admin no puede ir de PENDIENTE directo a COMPLETADO (400)', async () => {
    const adminFalso = { id: 1, email: 'admin@aerocrm.com', isActive: true, role: 'ADMIN', client: null };
    prismaFalso.user.findUnique.mockResolvedValueOnce(adminFalso);
    const reservaPendiente = {
      id: 'cld-test-1',
      confirmationCode: 'VJ-TEST01',
      status: 'PENDIENTE',
      userId: 99,
      clientId: 5,
    };
    prismaFalso.booking.findUnique.mockResolvedValueOnce(reservaPendiente);

    const token = jwtService.sign({ sub: 1, email: 'admin@aerocrm.com', clientId: null, role: 'ADMIN' });
    const res = await request(app.getHttpServer())
      .patch('/api/bookings/cld-test-1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'COMPLETADO' });

    expect(res.status).toBe(400);
  });

  it('PATCH /api/bookings/:id/status — admin avanza PENDIENTE a CONFIRMADO (200)', async () => {
    const adminFalso = { id: 1, email: 'admin@aerocrm.com', isActive: true, role: 'ADMIN', client: null };
    prismaFalso.user.findUnique.mockResolvedValueOnce(adminFalso);
    const reservaPendiente = {
      id: 'cld-test-3',
      confirmationCode: 'VJ-TEST03',
      status: 'PENDIENTE',
      userId: 99,
      clientId: 5,
    };
    const reservaConfirmada = { ...reservaPendiente, status: 'CONFIRMADO' };
    prismaFalso.booking.findUnique.mockResolvedValueOnce(reservaPendiente);
    prismaFalso.booking.update.mockResolvedValueOnce(reservaConfirmada);

    const token = jwtService.sign({ sub: 1, email: 'admin@aerocrm.com', clientId: null, role: 'ADMIN' });
    const res = await request(app.getHttpServer())
      .patch('/api/bookings/cld-test-3/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONFIRMADO' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMADO');
  });

  it('GET /api/bookings/:id de otro usuario devuelve 404 con "Reserva no encontrada"', async () => {
    const usuarioOtro = { id: 55, email: 'otro@test.pe', isActive: true, role: 'CLIENT', client: { id: 99 } };
    // JwtStrategy.validate
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioOtro);
    // findOne: busca por id + clientId del usuario que hace la petición; si no es suya devuelve null.
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioOtro);
    prismaFalso.booking.findFirst.mockResolvedValueOnce(null);

    const token = jwtService.sign({ sub: 55, email: 'otro@test.pe', clientId: 99, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .get('/api/bookings/reserva-de-otro-usuario')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Reserva no encontrada');
  });

  it('GET /api/admin/stats con rol CLIENT devuelve 403', async () => {
    const clienteFalso = { id: 55, email: 'cliente@test.pe', isActive: true, role: 'CLIENT', client: { id: 9 } };
    prismaFalso.user.findUnique.mockResolvedValueOnce(clienteFalso);
    const token = jwtService.sign({ sub: 55, email: 'cliente@test.pe', clientId: 9, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/admin/stats con rol ADMIN devuelve 200 con destinos, reservas y clientes', async () => {
    const adminFalso = { id: 1, email: 'admin@aerocrm.com', isActive: true, role: 'ADMIN', client: null };
    prismaFalso.user.findUnique.mockResolvedValueOnce(adminFalso);
    prismaFalso.destination.count.mockResolvedValueOnce(12);
    prismaFalso.booking.count.mockResolvedValueOnce(48);
    prismaFalso.client.count.mockResolvedValueOnce(35);
    const token = jwtService.sign({ sub: 1, email: 'admin@aerocrm.com', clientId: null, role: 'ADMIN' });

    const res = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.destinations).toBe(12);
    expect(res.body.bookings).toBe(48);
    expect(res.body.clients).toBe(35);
  });

  it('PATCH /api/bookings/:id/cancel — cliente cancela reserva PENDIENTE (200)', async () => {
    const usuarioCliente = { id: 99, email: 'cliente@test.pe', isActive: true, role: 'CLIENT', client: { id: 5 } };
    const reservaPendiente = {
      id: 'cld-test-2',
      confirmationCode: 'VJ-TEST02',
      status: 'PENDIENTE',
      userId: 99,
      clientId: 5,
      client: { id: 5, availablePoints: 0 },
      pointsEarned: 0,
      pointsUsed: 0,
    };

    // JwtStrategy.validate
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioCliente);
    // cancelOwn → user.findUnique para obtener client.id
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioCliente);
    // cancelOwn → booking.findFirst (verifica que la reserva pertenece al cliente)
    prismaFalso.booking.findFirst.mockResolvedValueOnce(reservaPendiente);
    // cancel() → booking.findUnique (con include client) antes de la transacción
    prismaFalso.booking.findUnique.mockResolvedValueOnce(reservaPendiente);
    // Transacción
    prismaFalso.$transaction.mockImplementationOnce(
      async (fn: (tx: typeof prismaFalso) => Promise<unknown>) => fn(prismaFalso),
    );
    prismaFalso.booking.update.mockResolvedValueOnce({ ...reservaPendiente, status: 'CANCELADO' });
    // cancel() → tx.booking.findUnique al final de la transacción
    prismaFalso.booking.findUnique.mockResolvedValueOnce({ ...reservaPendiente, status: 'CANCELADO' });

    const token = jwtService.sign({ sub: 99, email: 'cliente@test.pe', clientId: 5, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .patch('/api/bookings/cld-test-2/cancel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('POST /api/contact sin autenticación devuelve 201', async () => {
    prismaFalso.contactMessage.create.mockResolvedValueOnce({});

    const res = await request(app.getHttpServer())
      .post('/api/contact')
      .send({
        name: 'Ana López',
        email: 'ana@test.pe',
        subject: 'Consulta de vuelo',
        message: 'Quisiera información sobre vuelos a Cusco.',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
  });

  it('GET /api/contact/mine con autenticación devuelve 200 con lista', async () => {
    const usuarioFalso = { id: 10, email: 'ana@test.pe', isActive: true, role: 'CLIENT', client: { id: 3 } };
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioFalso);
    prismaFalso.contactMessage.findMany.mockResolvedValueOnce([]);
    const token = jwtService.sign({ sub: 10, email: 'ana@test.pe', clientId: 3, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .get('/api/contact/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/contact sin rol ADMIN devuelve 403', async () => {
    const clienteFalso = { id: 10, email: 'ana@test.pe', isActive: true, role: 'CLIENT', client: { id: 3 } };
    prismaFalso.user.findUnique.mockResolvedValueOnce(clienteFalso);
    const token = jwtService.sign({ sub: 10, email: 'ana@test.pe', clientId: 3, role: 'CLIENT' });

    const res = await request(app.getHttpServer())
      .get('/api/contact')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('PATCH /api/contact/1/attend como admin devuelve 200 con status ATENDIDA', async () => {
    const adminFalso = { id: 1, email: 'admin@aerocrm.com', isActive: true, role: 'ADMIN', client: null };
    prismaFalso.user.findUnique.mockResolvedValueOnce(adminFalso);
    const mensajeExistente = { id: 1, name: 'Ana', email: 'ana@test.pe', subject: 'Consulta', message: 'Texto', status: 'PENDIENTE', attendedAt: null, internalNote: null };
    const mensajeAtendido = { ...mensajeExistente, status: 'ATENDIDA', attendedAt: new Date(), internalNote: 'Respondido por correo' };
    prismaFalso.contactMessage.findUnique.mockResolvedValueOnce(mensajeExistente);
    prismaFalso.contactMessage.update.mockResolvedValueOnce(mensajeAtendido);

    const token = jwtService.sign({ sub: 1, email: 'admin@aerocrm.com', clientId: null, role: 'ADMIN' });
    const res = await request(app.getHttpServer())
      .patch('/api/contact/1/attend')
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Respondido por correo' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ATENDIDA');
  });

  // ─── US-016: Separación create (PENDIENTE) / pay (CONFIRMADO) ───────────────

  it('POST /api/bookings — crea la reserva en estado PENDIENTE (sin mover puntos)', async () => {
    const vueloIda = {
      id: 10, flightNumber: 'LA601', airline: 'LATAM',
      departureDate: new Date('2027-03-01T08:00:00Z'),
      pricePerPerson: new Prisma.Decimal('400.00'),
      isActive: true, destinationId: 3,
      origin: { id: 1, name: 'Lima' }, destination: { id: 3, name: 'Cusco' },
    };
    const vueloVuelta = { ...vueloIda, id: 11, flightNumber: 'LA602' };
    const clienteFalso = { id: 5, availablePoints: 0, completedTrips: 0, membershipLevel: 'EXPLORADOR' };
    const usuarioFalso = { id: 99, email: 'usuario@test.pe', isActive: true, role: 'CLIENT', client: clienteFalso };
    const reservaPendiente = {
      id: 'cld-pend-01', confirmationCode: 'VJ-PEND01',
      status: 'PENDIENTE', totalPrice: new Prisma.Decimal('800.00'),
      passengers: 1, bookingFlights: [], bookingHotels: [],
      bookingActivities: [], bookingExtras: [],
      bookingPassengers: [
        { id: 1, bookingId: 'cld-pend-01', firstName: 'Carlos', lastName: 'Test',
          documentNumber: '70000099', birthDate: new Date('1990-01-01'), isHolder: true },
      ],
    };

    prismaFalso.user.findUnique
      .mockResolvedValueOnce(usuarioFalso)
      .mockResolvedValueOnce(usuarioFalso);
    prismaFalso.flight.findUnique
      .mockResolvedValueOnce(vueloIda)
      .mockResolvedValueOnce(vueloVuelta);
    prismaFalso.booking.findFirst.mockResolvedValueOnce(null);
    prismaFalso.$transaction.mockImplementationOnce(async (fn: (tx: typeof prismaFalso) => Promise<typeof reservaPendiente>) => fn(prismaFalso));
    prismaFalso.booking.create.mockResolvedValueOnce(reservaPendiente);

    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: 5, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        passengers: [{ firstName: 'Carlos', lastName: 'Test', documentType: 'DNI', documentNumber: '70000099', birthDate: '1990-01-01', isHolder: true }],
        flights: [{ flightId: 10 }, { flightId: 11 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDIENTE');
  });

  it('POST /api/bookings/:id/pay — confirma la reserva y devuelve estado CONFIRMADO', async () => {
    const usuarioFalso = { id: 99, email: 'usuario@test.pe', isActive: true, role: 'CLIENT', client: { id: 5 } };
    const reservaPendiente = {
      id: 'cld-pay-01', confirmationCode: 'VJ-PAY001',
      status: 'PENDIENTE', userId: 99, clientId: 5,
      totalPrice: new Prisma.Decimal('800.00'),
      pointsEarned: 8, pointsUsed: 0,
      client: { id: 5, availablePoints: 0, totalPoints: 0 },
      user: { email: 'usuario@test.pe' },
    };
    const reservaConfirmada = { ...reservaPendiente, status: 'CONFIRMADO', bookingFlights: [], bookingPassengers: [] };

    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioFalso);
    prismaFalso.booking.findUnique.mockResolvedValueOnce(reservaPendiente);
    prismaFalso.$transaction.mockImplementationOnce(async (fn: (tx: typeof prismaFalso) => Promise<typeof reservaConfirmada>) => fn(prismaFalso));
    prismaFalso.booking.update.mockResolvedValueOnce(reservaConfirmada);
    prismaFalso.booking.findUnique.mockResolvedValueOnce(reservaConfirmada);

    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: 5, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .post('/api/bookings/cld-pay-01/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'TARJETA' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('CONFIRMADO');
  });

  it('POST /api/bookings/:id/pay — doble canje da 400 si los puntos ya no alcanzan', async () => {
    const usuarioFalso = { id: 99, email: 'usuario@test.pe', isActive: true, role: 'CLIENT', client: { id: 5 } };
    const reservaConCanje = {
      id: 'cld-pay-02', confirmationCode: 'VJ-PAY002',
      status: 'PENDIENTE', userId: 99, clientId: 5,
      totalPrice: new Prisma.Decimal('800.00'),
      pointsEarned: 8, pointsUsed: 600,
      // Disponibles son menos que los canjeados: simula que otra reserva ya consumió los puntos
      client: { id: 5, availablePoints: 400, totalPoints: 400 },
      user: { email: 'usuario@test.pe' },
    };

    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioFalso);
    prismaFalso.booking.findUnique.mockResolvedValueOnce(reservaConCanje);

    const token = jwtService.sign({ sub: 99, email: 'usuario@test.pe', clientId: 5, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .post('/api/bookings/cld-pay-02/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'TRANSFERENCIA' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Tus puntos disponibles cambiaron, vuelve a revisar el resumen');
  });

  it('PATCH /api/bookings/:id/cancel — cancelar desde CONFIRMADO revierte puntos ganados y canjeados', async () => {
    const usuarioCliente = { id: 99, email: 'cliente@test.pe', isActive: true, role: 'CLIENT', client: { id: 5 } };
    const reservaConfirmada = {
      id: 'cld-cancel-02', confirmationCode: 'VJ-CANCEL02',
      status: 'CONFIRMADO', userId: 99, clientId: 5,
      client: { id: 5, availablePoints: 100, totalPoints: 110 },
      pointsEarned: 10, pointsUsed: 0,
    };

    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioCliente);
    prismaFalso.user.findUnique.mockResolvedValueOnce(usuarioCliente);
    prismaFalso.booking.findFirst.mockResolvedValueOnce(reservaConfirmada);
    prismaFalso.booking.findUnique.mockResolvedValueOnce(reservaConfirmada);
    prismaFalso.$transaction.mockImplementationOnce(async (fn: (tx: typeof prismaFalso) => Promise<unknown>) => fn(prismaFalso));
    prismaFalso.booking.update.mockResolvedValueOnce({ ...reservaConfirmada, status: 'CANCELADO' });
    prismaFalso.booking.findUnique.mockResolvedValueOnce({ ...reservaConfirmada, status: 'CANCELADO' });

    const token = jwtService.sign({ sub: 99, email: 'cliente@test.pe', clientId: 5, role: 'CLIENT' });
    const res = await request(app.getHttpServer())
      .patch('/api/bookings/cld-cancel-02/cancel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELADO');
  });
});

import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DestinationsService } from './destinations.service';

describe('DestinationsService.searchFlights', () => {
  const DAY = 86_400_000;

  function setup() {
    const prisma = {
      destination: {
        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
        findFirst: jest.fn().mockResolvedValue({ id: 8 }),
      },
      flight: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new DestinationsService(prisma as unknown as PrismaService, {} as ConfigService);
    const range = () => prisma.flight.findMany.mock.calls[0][0].where.departureDate as { gte: Date; lt: Date };
    return { service, range };
  }

  // Fecha lejana para que el "desde" no lo recorte el día de hoy.
  const requested = '2099-06-15';
  const requestedMs = Date.parse(`${requested}T00:00:00Z`);

  it('sin flexDays busca 3 días antes y 3 después', async () => {
    const { service, range } = setup();
    await service.searchFlights('LIM', 1, requested, 1);
    expect(range().gte.getTime()).toBe(requestedMs - 3 * DAY);
    expect(range().lt.getTime()).toBe(requestedMs + 4 * DAY);
  });

  it('un flexDays inválido (NaN) también usa 3 días', async () => {
    const { service, range } = setup();
    await service.searchFlights('LIM', 1, requested, 1, Number.NaN);
    expect(range().gte.getTime()).toBe(requestedMs - 3 * DAY);
  });

  it('flexDays 0 busca solo ese día y no pasa de 7', async () => {
    const exact = setup();
    await exact.service.searchFlights('LIM', 1, requested, 1, 0);
    expect(exact.range().gte.getTime()).toBe(requestedMs);
    expect(exact.range().lt.getTime()).toBe(requestedMs + DAY);

    const wide = setup();
    await wide.service.searchFlights('LIM', 1, requested, 1, 30);
    expect(wide.range().lt.getTime()).toBe(requestedMs + 8 * DAY);
  });
});

describe('DestinationsService.findAll', () => {
  function setup() {
    const prisma = {
      destination: { findMany: jest.fn() },
      flight: { groupBy: jest.fn() },
    };
    const service = new DestinationsService(prisma as unknown as PrismaService, {} as ConfigService);
    return { service, prisma };
  }

  it('agrega priceFrom del vuelo más barato que llega al destino', async () => {
    const { service, prisma } = setup();
    prisma.destination.findMany.mockResolvedValue([
      { id: 1, name: 'Cancún', type: 'PLAYA' },
      { id: 2, name: 'Lima', type: 'CIUDAD' },
    ]);
    prisma.flight.groupBy.mockResolvedValue([{ destinationId: 1, _min: { pricePerPerson: 850 } }]);
    const result = await service.findAll({});
    expect(result[0].priceFrom).toBe(850);
    expect(result[1].priceFrom).toBeNull();
  });

  it('filtra priceFrom por isActive, plazas disponibles y fecha futura', async () => {
    const { service, prisma } = setup();
    prisma.destination.findMany.mockResolvedValue([]);
    prisma.flight.groupBy.mockResolvedValue([]);
    await service.findAll({});
    const where = prisma.flight.groupBy.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.seatsAvailable.gte).toBe(1);
    expect(where.departureDate.gte).toBeInstanceOf(Date);
    expect(where.departureDate.gte.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
  });

  it('respeta los filtros de type y search en la consulta de destinos', async () => {
    const { service, prisma } = setup();
    prisma.destination.findMany.mockResolvedValue([]);
    prisma.flight.groupBy.mockResolvedValue([]);
    await service.findAll({ type: 'PLAYA', search: 'cancun' });
    const where = prisma.destination.findMany.mock.calls[0][0].where;
    expect(where.type).toBe('PLAYA');
    expect(where.OR).toHaveLength(3);
  });
});

describe('DestinationsService.findOne', () => {
  function setup() {
    const prisma = {
      destination: { findUnique: jest.fn() },
    };
    const service = new DestinationsService(prisma as unknown as PrismaService, {} as ConfigService);
    return { service, prisma };
  }

  it('incluye arrivingFlights y no departingFlights', async () => {
    const { service, prisma } = setup();
    prisma.destination.findUnique.mockResolvedValue({ id: 1, arrivingFlights: [] });
    await service.findOne(1);
    const include = prisma.destination.findUnique.mock.calls[0][0].include;
    expect(include.arrivingFlights).toBeDefined();
    expect(include.departingFlights).toBeUndefined();
  });

  it('filtra arrivingFlights por isActive, plazas y fecha futura', async () => {
    const { service, prisma } = setup();
    prisma.destination.findUnique.mockResolvedValue({ id: 1, arrivingFlights: [] });
    await service.findOne(1);
    const where = prisma.destination.findUnique.mock.calls[0][0].include.arrivingFlights.where;
    expect(where.isActive).toBe(true);
    expect(where.seatsAvailable.gte).toBe(1);
    expect(where.departureDate.gte).toBeInstanceOf(Date);
    expect(where.departureDate.gte.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
  });

  it('limita a 5 vuelos y los ordena por precio ascendente', async () => {
    const { service, prisma } = setup();
    prisma.destination.findUnique.mockResolvedValue({ id: 1, arrivingFlights: [] });
    await service.findOne(1);
    const flightQuery = prisma.destination.findUnique.mock.calls[0][0].include.arrivingFlights;
    expect(flightQuery.take).toBe(5);
    expect(flightQuery.orderBy.pricePerPerson).toBe('asc');
  });

  it('incluye el origen en arrivingFlights', async () => {
    const { service, prisma } = setup();
    prisma.destination.findUnique.mockResolvedValue({ id: 1, arrivingFlights: [] });
    await service.findOne(1);
    const include = prisma.destination.findUnique.mock.calls[0][0].include.arrivingFlights.include;
    expect(include.origin).toBe(true);
  });

  it('lanza NotFoundException si el destino no existe', async () => {
    const { service, prisma } = setup();
    prisma.destination.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow('Destino no encontrado');
  });
});

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

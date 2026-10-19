import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DestinationsService, festivityInTrip, isWithinForecast } from './destinations.service';

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

describe('festivityInTrip (TS-019)', () => {
  const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const anoNuevo = { startMonth: 12, startDay: 28, endMonth: 1, endDay: 3 };

  it('una festividad que cruza de año coincide con un viaje en diciembre', () => {
    expect(festivityInTrip(anoNuevo, d('2026-12-29'), d('2026-12-31'))).toBe(true);
  });

  it('una festividad que cruza de año coincide con un viaje en enero', () => {
    expect(festivityInTrip(anoNuevo, d('2027-01-02'), d('2027-01-05'))).toBe(true);
  });

  it('un viaje que cruza de año coincide con una festividad de enero', () => {
    const reyes = { startMonth: 1, startDay: 6, endMonth: 1, endDay: 6 };
    expect(festivityInTrip(reyes, d('2026-12-30'), d('2027-01-07'))).toBe(true);
  });

  it('no coincide si el viaje no toca la festividad', () => {
    expect(festivityInTrip(anoNuevo, d('2027-02-10'), d('2027-02-17'))).toBe(false);
  });
});

describe('DestinationsService.getContext · clima (TS-019)', () => {
  function setup() {
    const prisma = {
      destination: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1, city: 'Cancún', countryCode: 'MX', festivities: [], hotels: [], activities: [],
        }),
      },
      destinationClimate: {
        findUnique: jest.fn().mockResolvedValue({ summary: 'Soleado y húmedo', minTempC: 22, maxTempC: 29 }),
      },
      holiday: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new DestinationsService(prisma as unknown as PrismaService, config);
    return { service, prisma };
  }

  it('un viaje lejano muestra el clima promedio del mes del viaje, no el de hoy', async () => {
    const { service, prisma } = setup();
    const ctx = await service.getContext(1, '2099-12-20', '2099-12-27');
    expect(prisma.destinationClimate.findUnique.mock.calls[0][0].where.destinationId_month.month).toBe(12);
    expect(ctx.weather?.label).toBe('Clima promedio de diciembre');
    expect(ctx.weather?.forecast[0]).toEqual({ description: 'Soleado y húmedo', temp_min: 22, temp_max: 29 });
  });

  it('isWithinForecast: solo los viajes que empiezan en los próximos 5 días', () => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    expect(isWithinForecast(new Date('2026-10-20T00:00:00Z'), now)).toBe(true);
    expect(isWithinForecast(new Date('2026-12-20T00:00:00Z'), now)).toBe(false);
  });
});

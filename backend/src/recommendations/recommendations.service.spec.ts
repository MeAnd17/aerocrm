import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';

const destinoPlaya = { id: 1, name: 'Cancún', city: 'Cancún', country: 'México', countryCode: 'MX', iataCode: 'CUN', type: 'PLAYA', description: '', imageUrl: null, isActive: true, festivities: [] };
const destinoCultura = { id: 2, name: 'Madrid', city: 'Madrid', country: 'España', countryCode: 'ES', iataCode: 'MAD', type: 'CULTURA', description: '', imageUrl: null, isActive: true, festivities: [] };
const destinoCiudad = { id: 3, name: 'Lima', city: 'Lima', country: 'Perú', countryCode: 'PE', iataCode: 'LIM', type: 'CIUDAD', description: '', imageUrl: null, isActive: true, festivities: [] };

const señalesVacias = { searchSignals: { viewedDestinationTypes: [], priceRangeFilter: null } };
const señalesPlaya  = { searchSignals: { viewedDestinationTypes: ['PLAYA'], priceRangeFilter: null } };

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prismaMock: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prismaMock = {
      destination: { findMany: jest.fn().mockResolvedValue([destinoPlaya, destinoCultura, destinoCiudad]) },
      booking:     { findMany: jest.fn().mockResolvedValue([]) },
      flight:      { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  describe('getRecommendations — visitante sin historial', () => {
    it('devuelve destinos del tipo buscado cuando hay viewedDestinationTypes', async () => {
      const resultado = await service.getRecommendations(null, señalesPlaya);

      const playas = resultado.filter((r) => (r.destination as Record<string, unknown>).type === 'PLAYA');
      expect(playas.length).toBeGreaterThan(0);
      expect(playas[0]).toMatchObject({ reason: expect.stringContaining('Playa') });
    });

    it('devuelve array vacío cuando no hay señales y no hay festividades', async () => {
      const resultado = await service.getRecommendations(null, señalesVacias);

      expect(resultado).toHaveLength(0);
    });

    it('devuelve como máximo 6 recomendaciones aunque haya más destinos', async () => {
      const muchasSenales = {
        searchSignals: { viewedDestinationTypes: ['PLAYA', 'CULTURA', 'CIUDAD', 'AVENTURA'], priceRangeFilter: null },
      };
      const resultado = await service.getRecommendations(null, muchasSenales);

      expect(resultado.length).toBeLessThanOrEqual(6);
    });
  });

  describe('getRecommendations — cliente con historial', () => {
    it('devuelve destino ya visitado con isReturn=true', async () => {
      // El cliente 10 tiene una reserva COMPLETADO hacia Cancún (destinoPlaya, id=1).
      prismaMock.booking.findMany.mockResolvedValue([
        {
          id: 'b1', clientId: 10, status: 'COMPLETADO', createdAt: new Date(),
          bookingFlights: [
            { flight: { destinationId: 1, destination: destinoPlaya } },
          ],
        },
      ]);

      const resultado = await service.getRecommendations(10, señalesVacias);

      const retorno = resultado.find((r) => (r.destination as Record<string, unknown>).iataCode === 'CUN');
      expect(retorno).toBeDefined();
      expect(retorno!.isReturn).toBe(true);
    });

    it('devuelve destino del mismo país con razón en español', async () => {
      // El cliente visitó Madrid (España). Debe recomendar otros destinos de España no visitados
      // si los hubiera. En este mock solo hay un destino de España (Madrid), ya visitado → isReturn.
      prismaMock.booking.findMany.mockResolvedValue([
        {
          id: 'b2', clientId: 10, status: 'COMPLETADO', createdAt: new Date(),
          bookingFlights: [
            { flight: { destinationId: 2, destination: destinoCultura } },
          ],
        },
      ]);

      const resultado = await service.getRecommendations(10, señalesVacias);

      const visitado = resultado.find((r) => (r.destination as Record<string, unknown>).iataCode === 'MAD');
      expect(visitado).toBeDefined();
      expect(visitado!.isReturn).toBe(true);
      expect(visitado!.reason).toContain('Madrid');
    });

    it('no incluye el mismo destino más de una vez', async () => {
      prismaMock.booking.findMany.mockResolvedValue([
        {
          id: 'b3', clientId: 10, status: 'COMPLETADO', createdAt: new Date(),
          bookingFlights: [
            { flight: { destinationId: 1, destination: destinoPlaya } },
          ],
        },
      ]);

      const resultado = await service.getRecommendations(10, señalesPlaya);

      const idsDestinos = resultado.map((r) => (r.destination as Record<string, unknown>).id);
      expect(new Set(idsDestinos).size).toBe(idsDestinos.length);
    });
  });
});

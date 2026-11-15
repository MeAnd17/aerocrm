import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

// Resumen de fidelización que buildStatus devuelve para un cliente sin historial.
const estadoFidelidadFalso = {
  level: 'EXPLORADOR',
  levelLabel: 'Explorador',
  availablePoints: 0,
  availablePointsValue: '0.00',
  totalPoints: 0,
  completedTrips: 0,
  canRedeem: false,
  minRedeemPoints: 500,
  maxRedeemPercent: 50,
  currentDiscount: 0,
  pointsValue: '0 puntos = S/ 0.00',
  nextLevel: { level: 'VIAJERO', label: 'Viajero', tripsNeeded: 3, progressPercent: 0 },
};

const clienteFalso = {
  id: 5,
  userId: 1,
  membershipLevel: 'EXPLORADOR',
  availablePoints: 0,
  totalPoints: 0,
  completedTrips: 0,
  phone: null,
  nationality: null,
  documentType: null,
  documentNumber: null,
  dateOfBirth: null,
  travelStyle: null,
  destinationType: null,
  spendingRange: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const usuarioFalso = {
  id: 1,
  firstName: 'Test',
  lastName: 'Usuario',
  client: clienteFalso,
};

const festividad = {
  id: 1,
  name: 'Feria del Sol',
  destinationId: 7,
  startMonth: 11,
  isActive: true,
  destination: { id: 7, name: 'Cancún', iataCode: 'CUN' },
};

describe('ClientsService', () => {
  let service: ClientsService;
  let prismaMock: Record<string, Record<string, jest.Mock>>;
  let loyaltyMock: { buildStatus: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      user: { findUnique: jest.fn() },
      booking: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      savedDestination: { findMany: jest.fn().mockResolvedValue([]) },
      festivity: { findMany: jest.fn() },
      flight: { findMany: jest.fn() },
      traveler: { findMany: jest.fn().mockResolvedValue([]) },
      client: { update: jest.fn().mockResolvedValue({}) },
    };
    loyaltyMock = { buildStatus: jest.fn().mockReturnValue(estadoFidelidadFalso) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LoyaltyService, useValue: loyaltyMock },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  describe('getHome', () => {
    it('devuelve priceFrom como número cuando hay vuelos futuros al destino de la festividad', async () => {
      prismaMock.user.findUnique.mockResolvedValue(usuarioFalso);
      prismaMock.festivity.findMany.mockResolvedValue([festividad]);
      prismaMock.flight.findMany.mockResolvedValue([
        { destinationId: 7, pricePerPerson: 850 },
        { destinationId: 7, pricePerPerson: 920 }, // el más barato (primero) gana
      ]);

      const resultado = await service.getHome(1);

      expect(resultado.upcomingFestivities).toHaveLength(1);
      expect(resultado.upcomingFestivities[0].priceFrom).toBe(850);
    });

    it('devuelve priceFrom como null cuando no hay vuelos futuros al destino de la festividad', async () => {
      prismaMock.user.findUnique.mockResolvedValue(usuarioFalso);
      prismaMock.festivity.findMany.mockResolvedValue([festividad]);
      prismaMock.flight.findMany.mockResolvedValue([]);

      const resultado = await service.getHome(1);

      expect(resultado.upcomingFestivities).toHaveLength(1);
      expect(resultado.upcomingFestivities[0].priceFrom).toBeNull();
    });

    it('devuelve array vacío de festividades cuando no hay próximas festividades activas', async () => {
      prismaMock.user.findUnique.mockResolvedValue(usuarioFalso);
      prismaMock.festivity.findMany.mockResolvedValue([]);

      const resultado = await service.getHome(1);

      expect(resultado.upcomingFestivities).toHaveLength(0);
      // Sin festividades no se consultan vuelos
      expect(prismaMock.flight.findMany).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el usuario no existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getHome(999)).rejects.toThrow(NotFoundException);
    });

    it('devuelve nivel VIAJERO y puntos para cliente con historial', async () => {
      const estadoViajero = {
        ...estadoFidelidadFalso,
        level: 'VIAJERO',
        levelLabel: 'Viajero',
        availablePoints: 120,
        totalPoints: 150,
        completedTrips: 5,
        nextLevel: { level: 'FRECUENTE', label: 'Frecuente', tripsNeeded: 3, progressPercent: 60 },
      };
      const clienteViajero = { ...clienteFalso, membershipLevel: 'VIAJERO', availablePoints: 120, totalPoints: 150, completedTrips: 5 };
      loyaltyMock.buildStatus.mockReturnValue(estadoViajero);
      prismaMock.user.findUnique.mockResolvedValue({ ...usuarioFalso, client: clienteViajero });
      prismaMock.festivity.findMany.mockResolvedValue([]);

      const resultado = await service.getHome(1);

      expect(resultado.membership.level).toBe('VIAJERO');
      expect(resultado.membership.completedTrips).toBe(5);
      expect(resultado.membership.availablePoints).toBe(120);
    });

    it('devuelve savedDestinations cuando el cliente los tiene guardados', async () => {
      const destinoGuardado = {
        id: 1, clientId: 5, destinationId: 7,
        destination: { id: 7, name: 'Cancún', iataCode: 'CUN' },
      };
      prismaMock.user.findUnique.mockResolvedValue(usuarioFalso);
      prismaMock.savedDestination.findMany.mockResolvedValue([destinoGuardado]);
      prismaMock.festivity.findMany.mockResolvedValue([]);

      const resultado = await service.getHome(1);

      expect(resultado.savedDestinations).toHaveLength(1);
      expect(resultado.savedDestinations[0].destination.name).toBe('Cancún');
    });

    it('devuelve nextBooking cuando hay una reserva activa', async () => {
      const vuelo = { departureDate: new Date(Date.now() + 30 * 86_400_000) };
      const reservaActiva = {
        id: 'booking-99', status: 'CONFIRMADO',
        bookingFlights: [{ flight: vuelo }],
      };
      prismaMock.user.findUnique.mockResolvedValue(usuarioFalso);
      prismaMock.booking.findFirst.mockResolvedValue(reservaActiva);
      prismaMock.festivity.findMany.mockResolvedValue([]);

      const resultado = await service.getHome(1);

      expect(resultado.nextBooking).not.toBeNull();
      expect(resultado.nextBooking!.id).toBe('booking-99');
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { ClientsService } from './clients.service';

/** Devuelve un usuario falso con su cliente asociado. */
function fakeUser(clientId = 10) {
  return { id: 1, client: { id: clientId } };
}

function makeService(overrides: Partial<ConstructorParameters<typeof PrismaService>[0]> = {}) {
  const prisma = {
    user: { findUnique: jest.fn() },
    traveler: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    client: { update: jest.fn() },
    booking: { findFirst: jest.fn() },
    savedDestination: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    festivity: { findMany: jest.fn() },
    ...overrides,
  };
  const loyalty = { buildStatus: jest.fn().mockReturnValue({ level: 'EXPLORADOR', levelLabel: 'Explorador', availablePoints: 0, availablePointsValue: 0, totalPoints: 0, completedTrips: 0, nextLevel: null }) };
  const service = new ClientsService(prisma as unknown as PrismaService, loyalty as unknown as LoyaltyService);
  return { service, prisma };
}

// ── updateProfile ────────────────────────────────────────────────────────────

describe('ClientsService.updateProfile', () => {
  it('actualiza los datos del cliente autenticado', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    prisma.client.update.mockResolvedValue({ id: 10, phone: '999' });

    const result = await service.updateProfile(1, { phone: '999' });

    expect(prisma.client.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10 }, data: expect.objectContaining({ phone: '999' }) }),
    );
    expect(result).toMatchObject({ phone: '999' });
  });

  it('lanza NotFoundException si el usuario no tiene cliente', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({ id: 1, client: null });
    await expect(service.updateProfile(1, {})).rejects.toThrow(NotFoundException);
  });
});

// ── createTraveler ───────────────────────────────────────────────────────────

describe('ClientsService.createTraveler', () => {
  const dto = { firstName: 'Ana', lastName: 'García', documentNumber: 'DOC1', dateOfBirth: '1990-01-01', relation: 'Hija' };

  it('crea un viajero cuando no hay documento duplicado', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    prisma.traveler.findFirst.mockResolvedValue(null);
    prisma.traveler.create.mockResolvedValue({ id: 1, ...dto });

    const result = await service.createTraveler(1, dto);

    expect(prisma.traveler.create).toHaveBeenCalled();
    expect(result).toMatchObject({ firstName: 'Ana' });
  });

  it('lanza BadRequestException con mensaje exacto cuando el documento ya existe', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    prisma.traveler.findFirst.mockResolvedValue({ id: 99, documentNumber: 'DOC1' });

    await expect(service.createTraveler(1, dto)).rejects.toThrow('Ya tienes un viajero con ese documento');
    await expect(service.createTraveler(1, dto)).rejects.toThrow(BadRequestException);
  });
});

// ── updateTraveler ───────────────────────────────────────────────────────────

describe('ClientsService.updateTraveler', () => {
  const existing = { id: 5, clientId: 10, firstName: 'Ana', documentNumber: 'DOC1' };

  it('actualiza el viajero cuando los datos son válidos', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    prisma.traveler.findFirst.mockResolvedValueOnce(existing).mockResolvedValueOnce(null);
    prisma.traveler.update.mockResolvedValue({ ...existing, firstName: 'María' });

    const result = await service.updateTraveler(1, 5, { firstName: 'María' });

    expect(prisma.traveler.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 }, data: expect.objectContaining({ firstName: 'María' }) }),
    );
    expect(result.firstName).toBe('María');
  });

  it('lanza NotFoundException si el viajero no pertenece al cliente', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    // findFirst retorna null → viajero no es del cliente
    prisma.traveler.findFirst.mockResolvedValue(null);

    await expect(service.updateTraveler(1, 99, { firstName: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException si el nuevo documento ya existe en otro viajero', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    // Primera llamada: encontrar el viajero a editar
    prisma.traveler.findFirst.mockResolvedValueOnce(existing);
    // Segunda llamada: verificar duplicado → encuentra otro viajero con ese doc
    prisma.traveler.findFirst.mockResolvedValueOnce({ id: 6, documentNumber: 'DOCNUEVO' });

    await expect(service.updateTraveler(1, 5, { documentNumber: 'DOCNUEVO' })).rejects.toThrow(BadRequestException);
  });

  it('permite guardar el mismo documento del propio viajero', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    // Encontrar el viajero a editar
    prisma.traveler.findFirst.mockResolvedValueOnce(existing);
    // El documento no cambió → no hay consulta de duplicado
    prisma.traveler.update.mockResolvedValue(existing);

    await expect(service.updateTraveler(1, 5, { documentNumber: 'DOC1' })).resolves.not.toThrow();
    // La consulta de duplicado no debe ejecutarse porque el doc es el mismo
    expect(prisma.traveler.findFirst).toHaveBeenCalledTimes(1);
  });
});

// ── deleteTraveler ───────────────────────────────────────────────────────────

describe('ClientsService.deleteTraveler', () => {
  it('elimina un viajero que pertenece al cliente', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser());
    prisma.traveler.delete.mockResolvedValue({ id: 5 });

    await service.deleteTraveler(1, 5);

    expect(prisma.traveler.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5, clientId: 10 } }),
    );
  });

  it('un cliente no puede eliminar el viajero de otro (clientId en el where)', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(fakeUser(10));
    prisma.traveler.delete.mockRejectedValue(new Error('Not found'));

    // Prisma lanzará si el registro no existe; el servicio deja pasar el error
    await expect(service.deleteTraveler(1, 999)).rejects.toThrow();
    expect(prisma.traveler.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clientId: 10 }) }),
    );
  });
});

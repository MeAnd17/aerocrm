/**
 * Pruebas del método register de AuthService — cobertura de US-009 (campo budget).
 * Solo testea la lógica del service con un doble de PrismaService y JwtService.
 * No toca la base de datos compartida.
 */
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const BASE_DTO = {
  email: 'test@demo.pe',
  password: 'Secure1234',
  firstName: 'Ana',
  lastName: 'Pérez',
};

function makeService() {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const jwt = { sign: jest.fn().mockReturnValue('token') };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
  );
  return { service, prisma };
}

describe('AuthService.register', () => {
  it('pasa budget al crear el cliente cuando se envía', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1, email: BASE_DTO.email, firstName: BASE_DTO.firstName, lastName: BASE_DTO.lastName,
      client: { id: 10, membershipLevel: 'EXPLORADOR', budget: '3000' },
    });

    await service.register({ ...BASE_DTO, budget: '3000' });

    const createCall = prisma.user.create.mock.calls[0][0];
    expect(createCall.data.client.create.budget).toBe('3000');
  });

  it('guarda budget como null cuando no se envía', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 2, email: BASE_DTO.email, firstName: BASE_DTO.firstName, lastName: BASE_DTO.lastName,
      client: { id: 11, membershipLevel: 'EXPLORADOR', budget: null },
    });

    await service.register({ ...BASE_DTO });

    const createCall = prisma.user.create.mock.calls[0][0];
    expect(createCall.data.client.create.budget).toBeNull();
  });

  it('lanza ConflictException si el correo ya está registrado', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({ id: 99 });

    await expect(service.register({ ...BASE_DTO })).rejects.toThrow(ConflictException);
  });
});

describe('AuthService.getMe', () => {
  it('incluye budget en la respuesta', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: 1, email: 'a@b.pe', firstName: 'X', lastName: 'Y',
      client: { id: 5, membershipLevel: 'EXPLORADOR', availablePoints: 0, completedTrips: 0, travelStyle: null, destinationType: null, budget: '1500' },
    });

    const result = await service.getMe(1);
    expect(result.budget).toBe('1500');
  });
});

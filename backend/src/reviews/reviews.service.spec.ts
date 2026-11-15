import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

const reservaCompletada = {
  id: 'booking-1',
  clientId: 10,
  status: 'COMPLETADO',
  review: null,
};

const reservaPendiente = {
  id: 'booking-2',
  clientId: 10,
  status: 'PENDIENTE',
  review: null,
};

const reservaDeOtro = {
  id: 'booking-3',
  clientId: 99,
  status: 'COMPLETADO',
  review: null,
};

const reservaConResena = {
  id: 'booking-4',
  clientId: 10,
  status: 'COMPLETADO',
  review: { id: 7, rating: 4, comment: 'Bien', clientId: 10 },
};

const resenaPropia = { id: 7, clientId: 10, rating: 4, comment: 'Bien' };
const resenaAjena  = { id: 8, clientId: 99, rating: 5, comment: 'Genial' };

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaMock: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prismaMock = {
      booking: { findUnique: jest.fn() },
      review: {
        create:     jest.fn().mockResolvedValue({ id: 1, rating: 5, comment: 'Perfecto' }),
        findUnique: jest.fn(),
        update:     jest.fn().mockResolvedValue({ id: 7, rating: 3 }),
        delete:     jest.fn().mockResolvedValue({ id: 7 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('create', () => {
    it('crea la reseña sobre una reserva COMPLETADO propia', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(reservaCompletada);
      const result = await service.create(10, { bookingId: 'booking-1', rating: 5 });
      expect(result).toBeDefined();
      expect(prismaMock.review.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ clientId: 10, rating: 5 }) }),
      );
    });

    it('lanza BadRequestException sobre una reserva que no es COMPLETADO', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(reservaPendiente);
      await expect(service.create(10, { bookingId: 'booking-2', rating: 4 }))
        .rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si la reserva pertenece a otro cliente', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(reservaDeOtro);
      await expect(service.create(10, { bookingId: 'booking-3', rating: 4 }))
        .rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si la reserva ya tiene calificación', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(reservaConResena);
      await expect(service.create(10, { bookingId: 'booking-4', rating: 5 }))
        .rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si la reserva no existe', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);
      await expect(service.create(10, { bookingId: 'no-existe', rating: 5 }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza la calificación propia', async () => {
      prismaMock.review.findUnique.mockResolvedValue(resenaPropia);
      const result = await service.update(10, 7, { rating: 3 });
      expect(result).toBeDefined();
      expect(prismaMock.review.update).toHaveBeenCalled();
    });

    it('lanza ForbiddenException al editar una calificación ajena', async () => {
      prismaMock.review.findUnique.mockResolvedValue(resenaAjena);
      await expect(service.update(10, 8, { rating: 2 }))
        .rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si la calificación no existe', async () => {
      prismaMock.review.findUnique.mockResolvedValue(null);
      await expect(service.update(10, 999, { rating: 3 }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('elimina la calificación propia', async () => {
      prismaMock.review.findUnique.mockResolvedValue(resenaPropia);
      const result = await service.remove(10, 7);
      expect(result).toBeDefined();
      expect(prismaMock.review.delete).toHaveBeenCalled();
    });

    it('lanza ForbiddenException al eliminar una calificación ajena', async () => {
      prismaMock.review.findUnique.mockResolvedValue(resenaAjena);
      await expect(service.remove(10, 8))
        .rejects.toThrow(ForbiddenException);
    });
  });
});

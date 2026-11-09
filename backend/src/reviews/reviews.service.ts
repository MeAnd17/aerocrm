import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /** Crea una reseña. Solo para reservas COMPLETADO del propio cliente. */
  async create(clientId: number, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (booking.clientId !== clientId) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (booking.status !== 'COMPLETADO') {
      throw new BadRequestException('Solo puedes calificar un viaje completado');
    }

    if (booking.review) {
      throw new BadRequestException('Esta reserva ya tiene una calificación');
    }

    return this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        clientId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      },
    });
  }

  /** Actualiza la reseña propia. */
  async update(clientId: number, reviewId: number, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) throw new NotFoundException('Calificación no encontrada');
    if (review.clientId !== clientId) throw new ForbiddenException('No puedes editar esta calificación');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
      },
    });
  }

  /** Elimina la reseña propia. */
  async remove(clientId: number, reviewId: number) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) throw new NotFoundException('Calificación no encontrada');
    if (review.clientId !== clientId) throw new ForbiddenException('No puedes eliminar esta calificación');

    return this.prisma.review.delete({ where: { id: reviewId } });
  }

  /** Lista las reseñas de un destino incluyendo promedio y conteo. */
  async findByDestination(destinationId: number) {
    const reviews = await this.prisma.review.findMany({
      where: {
        booking: {
          bookingFlights: {
            some: {
              flight: { destinationId },
            },
          },
        },
      },
      include: {
        client: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const aggregate = await this.prisma.review.aggregate({
      where: {
        booking: {
          bookingFlights: {
            some: {
              flight: { destinationId },
            },
          },
        },
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      averageRating: aggregate._avg.rating ?? null,
      reviewCount: aggregate._count.id,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        updatedAt: r.updatedAt,
        travelerName: `${r.client.user.firstName} ${r.client.user.lastName}`,
      })),
    };
  }

  /** Obtiene la reseña de una reserva específica (del propio cliente). */
  async findByBooking(clientId: number, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.clientId !== clientId) throw new NotFoundException('Reserva no encontrada');

    const review = await this.prisma.review.findUnique({ where: { bookingId } });
    return review ?? null;
  }
}

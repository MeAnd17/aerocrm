import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  RedemptionError,
  computeRedemption,
  fromCents,
  pointsForPurchase,
  toCents,
} from '../loyalty/loyalty.rules';

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VJ-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, query: any) {
    const { status, page = 1, limit = 10 } = query;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');

    const where: any = { clientId: user.client.id };
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          bookingFlights: { include: { flight: { include: { origin: true, destination: true } } } },
          bookingHotels: { include: { hotel: { include: { destination: true } } } },
          bookingActivities: { include: { activity: true } },
          bookingExtras: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(userId: number, bookingId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, clientId: user.client.id },
      include: {
        bookingFlights: { include: { flight: { include: { origin: true, destination: true } } } },
        bookingHotels: { include: { hotel: { include: { destination: true } } } },
        bookingActivities: { include: { activity: true } },
        bookingExtras: true,
      },
    });
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    return booking;
  }

  async create(userId: number, dto: CreateBookingDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');
    const client = user.client;

    // Total del paquete en céntimos (AGENTS.md B5).
    // Pendiente (deuda, AGENTS.md B6): los precios aún llegan del cliente como priceSnapshot;
    // el cálculo desde el catálogo en el servidor se hace con la historia del resumen del armador.
    const flightsCents = dto.flights.reduce((s, f) => s + toCents(f.priceSnapshot) * dto.passengers, 0);
    const hotelsCents = (dto.hotels ?? []).reduce((s, h) => s + toCents(h.priceSnapshot), 0);
    const activitiesCents = (dto.activities ?? []).reduce((s, a) => s + toCents(a.priceSnapshot) * a.quantity, 0);
    const extrasCents = (dto.extras ?? []).reduce((s, e) => s + toCents(e.price), 0);
    const packageTotalCents = flightsCents + hotelsCents + activitiesCents + extrasCents;

    // Canje y puntos: solo el motor de fidelización decide (AGENTS.md B7).
    let redemption;
    try {
      redemption = computeRedemption({
        packageTotalCents,
        pointsToRedeem: dto.pointsToRedeem ?? 0,
        availablePoints: client.availablePoints,
        completedTrips: client.completedTrips,
      });
    } catch (e) {
      if (e instanceof RedemptionError) throw new BadRequestException(e.message);
      throw e;
    }
    const pointsUsed = redemption.pointsUsed;
    const totalPrice = fromCents(redemption.finalTotalCents);
    const discountAmount = fromCents(redemption.totalDiscountCents);
    const pointsEarned = pointsForPurchase(redemption.finalTotalCents);

    // Generate unique confirmation code
    let confirmationCode = generateConfirmationCode();
    let exists = await this.prisma.booking.findFirst({ where: { confirmationCode } });
    while (exists) {
      confirmationCode = generateConfirmationCode();
      exists = await this.prisma.booking.findFirst({ where: { confirmationCode } });
    }

    // Create booking in transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          confirmationCode,
          userId,
          clientId: client.id,
          totalPrice,
          pointsEarned,
          pointsUsed,
          discountAmount,
          passengers: dto.passengers,
          notes: dto.notes,
          status: 'CONFIRMADO',
          bookingFlights: {
            create: dto.flights.map(f => ({ flightId: f.flightId, priceSnapshot: fromCents(toCents(f.priceSnapshot) * dto.passengers) })),
          },
          bookingHotels: {
            create: (dto.hotels ?? []).map(h => ({
              hotelId: h.hotelId, checkIn: new Date(h.checkIn),
              checkOut: new Date(h.checkOut), nights: h.nights, priceSnapshot: h.priceSnapshot,
            })),
          },
          bookingActivities: {
            // priceSnapshot guarda el total de la línea (precio por persona × cantidad), igual que vuelos y hotel.
            create: (dto.activities ?? []).map(a => ({ activityId: a.activityId, quantity: a.quantity, priceSnapshot: fromCents(toCents(a.priceSnapshot) * a.quantity) })),
          },
          bookingExtras: {
            create: (dto.extras ?? []).map(e => ({ type: e.type, price: e.price, details: e.details })),
          },
        },
        include: {
          bookingFlights: { include: { flight: { include: { origin: true, destination: true } } } },
          bookingHotels: { include: { hotel: true } },
          bookingActivities: { include: { activity: true } },
          bookingExtras: true,
        },
      });

      // Update client points and trips
      await tx.client.update({
        where: { id: client.id },
        data: {
          totalPoints: { increment: pointsEarned },
          availablePoints: { increment: pointsEarned - pointsUsed },
        },
      });

      // Record points history
      if (pointsEarned > 0) {
        await tx.pointsHistory.create({
          data: { clientId: client.id, type: 'EARNED', points: pointsEarned, description: `Compra de paquete ${confirmationCode}`, bookingId: newBooking.id },
        });
      }
      if (pointsUsed > 0) {
        await tx.pointsHistory.create({
          data: { clientId: client.id, type: 'REDEEMED', points: -pointsUsed, description: `Canje en paquete ${confirmationCode}`, bookingId: newBooking.id },
        });
      }

      return newBooking;
    });

    return booking;
  }

  async cancel(userId: number, bookingId: string) {
    const booking = await this.findOne(userId, bookingId);
    if (booking.status === 'CANCELADO') throw new BadRequestException('Esta reserva ya está cancelada');
    if (booking.status === 'COMPLETADO') throw new BadRequestException('No se puede cancelar una reserva completada');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELADO' },
    });
  }
}

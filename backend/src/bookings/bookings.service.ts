import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QuoteDto, QuoteResponseDto } from './dto/quote.dto';
import {
  RedemptionError,
  computeRedemption,
  fromCents,
  pointsForPurchase,
  toCents,
} from '../loyalty/loyalty.rules';

// ── Precios prohibidos en el body ─────────────────────────────────────────────
const PRICE_FIELDS = ['price', 'totalPrice', 'amount', 'priceSnapshot', 'subtotal', 'total'];

function rejectPriceFields(body: Record<string, unknown>) {
  for (const field of PRICE_FIELDS) {
    if (field in body) {
      throw new BadRequestException(
        `El campo "${field}" no está permitido: el precio lo calcula el servidor`,
      );
    }
  }
}

// ── Código de confirmación ────────────────────────────────────────────────────

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VJ-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Utilidad de fechas ────────────────────────────────────────────────────────

/** Número de noches entre checkIn y checkOut (en días UTC enteros). */
function calcNights(checkIn: string, checkOut: string): number {
  const inMs = Date.UTC(
    +checkIn.slice(0, 4),
    +checkIn.slice(5, 7) - 1,
    +checkIn.slice(8, 10),
  );
  const outMs = Date.UTC(
    +checkOut.slice(0, 4),
    +checkOut.slice(5, 7) - 1,
    +checkOut.slice(8, 10),
  );
  return Math.round((outMs - inMs) / 86_400_000);
}

// ── Lógica de cotización (reutilizada por quote y create) ─────────────────────

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  // ─── Métodos públicos ───────────────────────────────────────────────────────

  async findAll(userId: number, query: { status?: string; page?: number | string; limit?: number | string }) {
    const { status, page = 1, limit = 10 } = query;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');

    const where: Prisma.BookingWhereInput = { clientId: user.client.id };
    if (status) where.status = status as BookingStatus;

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

  /** POST /bookings/quote — cotización pública, sin autenticación */
  async quote(dto: QuoteDto, rawBody: Record<string, unknown>): Promise<QuoteResponseDto> {
    rejectPriceFields(rawBody);

    if (!dto.returnFlightId) {
      throw new BadRequestException('El vuelo de regreso es obligatorio');
    }

    // Vuelo de ida
    const outboundFlight = await this.prisma.flight.findUnique({
      where: { id: dto.flightId },
      include: { origin: true, destination: true },
    });
    if (!outboundFlight || !outboundFlight.isActive) {
      throw new NotFoundException('El vuelo seleccionado ya no está disponible');
    }

    const destinationId = outboundFlight.destinationId;
    const passengers = dto.passengers;

    // Vuelo de regreso (obligatorio)
    let returnFlight: typeof outboundFlight | null = null;
    if (dto.returnFlightId) {
      returnFlight = await this.prisma.flight.findUnique({
        where: { id: dto.returnFlightId },
        include: { origin: true, destination: true },
      });
      if (!returnFlight || !returnFlight.isActive) {
        throw new NotFoundException('El vuelo de regreso seleccionado ya no está disponible');
      }
    }

    // Hotel (opcional)
    let hotel: Awaited<ReturnType<typeof this.prisma.hotel.findUnique>> | null = null;
    let nights = 0;
    if (dto.hotelId) {
      hotel = await this.prisma.hotel.findUnique({ where: { id: dto.hotelId } });
      if (!hotel || !hotel.isActive || hotel.destinationId !== destinationId) {
        throw new BadRequestException('El hotel seleccionado no pertenece al destino del vuelo');
      }
      if (!dto.checkIn || !dto.checkOut) {
        throw new BadRequestException('Las fechas del hotel no son válidas');
      }
      nights = calcNights(dto.checkIn, dto.checkOut);
      if (nights <= 0) {
        throw new BadRequestException('Las fechas del hotel no son válidas');
      }
    }

    // Actividades (opcionales)
    const activitiesData: Array<{
      id: number;
      name: string;
      price: Prisma.Decimal;
      quantity: number;
    }> = [];
    for (const item of dto.activities ?? []) {
      const activity = await this.prisma.activity.findUnique({ where: { id: item.activityId } });
      if (!activity || !activity.isActive || activity.destinationId !== destinationId) {
        throw new BadRequestException('Una de las actividades no pertenece al destino del vuelo');
      }
      if (item.quantity < 1 || item.quantity > passengers) {
        throw new BadRequestException(
          `La cantidad de participantes en la actividad "${activity.name}" debe estar entre 1 y ${passengers}`,
        );
      }
      activitiesData.push({
        id: activity.id,
        name: activity.name,
        price: activity.price,
        quantity: item.quantity,
      });
    }

    // Extras (opcionales) — se obtienen del catálogo ExtraOption (B6)
    const extrasData: Array<{
      id: number;
      type: string;
      name: string;
      price: Prisma.Decimal;
      pricing: string;
    }> = [];
    for (const extraId of dto.extras ?? []) {
      const extra = await this.prisma.extraOption.findUnique({ where: { id: extraId } });
      if (!extra || !extra.isActive) {
        throw new BadRequestException('Uno de los extras seleccionados no está disponible');
      }
      extrasData.push({
        id: extra.id,
        type: extra.type,
        name: extra.name,
        price: extra.price,
        pricing: extra.pricing,
      });
    }

    // ── Cálculo con céntimos enteros (B5) ─────────────────────────────────────
    const outboundCents = toCents(outboundFlight.pricePerPerson) * passengers;
    const returnCents = returnFlight ? toCents(returnFlight.pricePerPerson) * passengers : 0;
    const hotelCents = hotel ? toCents(hotel.pricePerNight) * nights : 0;
    const activityCents = activitiesData.map(a => toCents(a.price) * a.quantity);
    const extraCents = extrasData.map(e =>
      e.pricing === 'POR_PASAJERO' ? toCents(e.price) * passengers : toCents(e.price),
    );

    const packageTotalCents =
      outboundCents +
      returnCents +
      hotelCents +
      activityCents.reduce((s, c) => s + c, 0) +
      extraCents.reduce((s, c) => s + c, 0);

    // Canje (sin cliente autenticado, pointsToRedeem == 0 si no se pasa)
    const pointsToRedeem = dto.pointsToRedeem ?? 0;
    let redemption;
    try {
      redemption = computeRedemption({
        packageTotalCents,
        pointsToRedeem,
        // En quote público no conocemos los puntos/viajes: pasamos valores que
        // solo permiten calcular el descuento de puntos puro (sin bono de nivel).
        availablePoints: pointsToRedeem,
        completedTrips: 0,
      });
    } catch (e) {
      if (e instanceof RedemptionError) throw new BadRequestException(e.message);
      throw e;
    }

    const subtotalDecimal = Number(fromCents(packageTotalCents));
    const discountDecimal = Number(fromCents(redemption.totalDiscountCents));
    const totalDecimal = Number(fromCents(redemption.finalTotalCents));
    const pointsToEarn = pointsForPurchase(redemption.finalTotalCents);

    return {
      breakdown: {
        outboundFlight: {
          id: outboundFlight.id,
          flightNumber: outboundFlight.flightNumber,
          airline: outboundFlight.airline,
          departureDate: outboundFlight.departureDate.toISOString(),
          pricePerPerson: Number(outboundFlight.pricePerPerson),
          lineTotal: Number(fromCents(outboundCents)),
        },
        ...(returnFlight && {
          returnFlight: {
            id: returnFlight.id,
            flightNumber: returnFlight.flightNumber,
            airline: returnFlight.airline,
            departureDate: returnFlight.departureDate.toISOString(),
            pricePerPerson: Number(returnFlight.pricePerPerson),
            lineTotal: Number(fromCents(returnCents)),
          },
        }),
        ...(hotel && {
          hotel: {
            id: hotel.id,
            name: hotel.name,
            pricePerNight: Number(hotel.pricePerNight),
            nights,
            lineTotal: Number(fromCents(hotelCents)),
          },
        }),
        activities: activitiesData.map((a, i) => ({
          id: a.id,
          name: a.name,
          pricePerPerson: Number(a.price),
          quantity: a.quantity,
          lineTotal: Number(fromCents(activityCents[i])),
        })),
        extras: extrasData.map((e, i) => ({
          id: e.id,
          type: e.type,
          name: e.name,
          price: Number(e.price),
          lineTotal: Number(fromCents(extraCents[i])),
        })),
        subtotal: subtotalDecimal,
        discountByRedemption: discountDecimal,
        total: totalDecimal,
      },
      pointsToRedeem: redemption.pointsUsed,
      pointsToEarn,
    };
  }

  /** POST /bookings — crea una reserva recalculando el precio en el servidor (B6) */
  async create(userId: number, dto: CreateBookingDto, rawBody: Record<string, unknown>) {
    rejectPriceFields(rawBody);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');
    const client = user.client;

    // ── Recalcular precio desde el catálogo ───────────────────────────────────
    // Vuelos
    const flightRecords = await Promise.all(
      dto.flights.map(f => this.prisma.flight.findUnique({ where: { id: f.flightId }, include: { destination: true } })),
    );
    for (const flight of flightRecords) {
      if (!flight || !flight.isActive) {
        throw new NotFoundException('El vuelo seleccionado ya no está disponible');
      }
    }

    // Destino: lo determina el primer vuelo (vuelo de ida)
    const destinationId = flightRecords[0]!.destinationId;

    const flightLineCents = flightRecords.map(f => toCents(f!.pricePerPerson) * dto.passengers);
    const flightsTotalCents = flightLineCents.reduce((s, c) => s + c, 0);

    // Hotel
    let hotelTotalCents = 0;
    const hotelSnapshots: string[] = [];
    for (const h of dto.hotels ?? []) {
      const hotel = await this.prisma.hotel.findUnique({ where: { id: h.hotelId } });
      if (!hotel || !hotel.isActive || hotel.destinationId !== destinationId) {
        throw new BadRequestException('El hotel seleccionado no pertenece al destino del vuelo');
      }
      const nights = calcNights(h.checkIn, h.checkOut);
      if (nights <= 0) {
        throw new BadRequestException('Las fechas del hotel no son válidas');
      }
      const lineCents = toCents(hotel.pricePerNight) * nights;
      hotelTotalCents += lineCents;
      hotelSnapshots.push(fromCents(lineCents));
    }

    // Actividades
    let activitiesTotalCents = 0;
    const activityLineCents: number[] = [];
    for (const a of dto.activities ?? []) {
      const activity = await this.prisma.activity.findUnique({ where: { id: a.activityId } });
      if (!activity || !activity.isActive || activity.destinationId !== destinationId) {
        throw new BadRequestException('Una de las actividades no pertenece al destino del vuelo');
      }
      if (a.quantity < 1 || a.quantity > dto.passengers) {
        throw new BadRequestException(
          `La cantidad de participantes en la actividad "${activity.name}" debe estar entre 1 y ${dto.passengers}`,
        );
      }
      const lineCents = toCents(activity.price) * a.quantity;
      activitiesTotalCents += lineCents;
      activityLineCents.push(lineCents);
    }

    // Extras (se consulta ExtraOption por tipo)
    let extrasTotalCents = 0;
    const extraLineCents: number[] = [];
    const extraPriceDecimals: string[] = [];
    for (const e of dto.extras ?? []) {
      const extra = await this.prisma.extraOption.findFirst({ where: { type: e.type, isActive: true } });
      if (!extra) {
        throw new BadRequestException(`El extra "${e.type}" no está disponible`);
      }
      const lineCents =
        extra.pricing === 'POR_PASAJERO'
          ? toCents(extra.price) * dto.passengers
          : toCents(extra.price);
      extrasTotalCents += lineCents;
      extraLineCents.push(lineCents);
      extraPriceDecimals.push(fromCents(lineCents));
    }

    const packageTotalCents = flightsTotalCents + hotelTotalCents + activitiesTotalCents + extrasTotalCents;

    // Canje y puntos (solo el motor de fidelización decide — B7)
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

    // Código de confirmación único
    let confirmationCode = generateConfirmationCode();
    let exists = await this.prisma.booking.findFirst({ where: { confirmationCode } });
    while (exists) {
      confirmationCode = generateConfirmationCode();
      exists = await this.prisma.booking.findFirst({ where: { confirmationCode } });
    }

    // Transacción de creación
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
            create: dto.flights.map((f, i) => ({
              flightId: f.flightId,
              priceSnapshot: fromCents(flightLineCents[i]),
            })),
          },
          bookingHotels: {
            create: (dto.hotels ?? []).map((h, i) => ({
              hotelId: h.hotelId,
              checkIn: new Date(h.checkIn),
              checkOut: new Date(h.checkOut),
              nights: h.nights,
              priceSnapshot: hotelSnapshots[i],
            })),
          },
          bookingActivities: {
            create: (dto.activities ?? []).map((a, i) => ({
              activityId: a.activityId,
              quantity: a.quantity,
              priceSnapshot: fromCents(activityLineCents[i]),
            })),
          },
          bookingExtras: {
            create: (dto.extras ?? []).map((e, i) => ({
              type: e.type,
              price: extraPriceDecimals[i],
              details: e.details,
            })),
          },
        },
        include: {
          bookingFlights: { include: { flight: { include: { origin: true, destination: true } } } },
          bookingHotels: { include: { hotel: true } },
          bookingActivities: { include: { activity: true } },
          bookingExtras: true,
        },
      });

      // Actualizar puntos del cliente
      await tx.client.update({
        where: { id: client.id },
        data: {
          totalPoints: { increment: pointsEarned },
          availablePoints: { increment: pointsEarned - pointsUsed },
        },
      });

      // Historial de puntos
      if (pointsEarned > 0) {
        await tx.pointsHistory.create({
          data: {
            clientId: client.id,
            type: 'EARNED',
            points: pointsEarned,
            description: `Compra de paquete ${confirmationCode}`,
            bookingId: newBooking.id,
          },
        });
      }
      if (pointsUsed > 0) {
        await tx.pointsHistory.create({
          data: {
            clientId: client.id,
            type: 'REDEEMED',
            points: -pointsUsed,
            description: `Canje en paquete ${confirmationCode}`,
            bookingId: newBooking.id,
          },
        });
      }

      return newBooking;
    });

    return booking;
  }

  /** GET /bookings/extras — lista los extras activos del catálogo con precio y modo de cobro. */
  async listExtras() {
    return this.prisma.extraOption.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, type: true, name: true, description: true, price: true, pricing: true, currency: true },
    });
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

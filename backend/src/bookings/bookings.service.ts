import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus, DocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QuoteDto, QuoteResponseDto } from './dto/quote.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import {
  RedemptionError,
  computeRedemption,
  fromCents,
  maxRedeemablePointsForPackage,
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

// Transiciones de estado válidas para las reservas.
const TRANSICIONES_VALIDAS: Record<BookingStatus, BookingStatus[]> = {
  PENDIENTE:  [BookingStatus.CONFIRMADO, BookingStatus.CANCELADO],
  CONFIRMADO: [BookingStatus.EN_CURSO,   BookingStatus.CANCELADO],
  EN_CURSO:   [BookingStatus.COMPLETADO],
  COMPLETADO: [],
  CANCELADO:  [],
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private loyaltyService: LoyaltyService,
  ) {}

  // ─── Métodos públicos ───────────────────────────────────────────────────────

  /** GET /admin/bookings — lista todas las reservas con filtros y paginación (US-029). */
  async findAllAdmin(query: {
    status?: BookingStatus;
    search?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.BookingWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { confirmationCode: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          bookingFlights: { include: { flight: { include: { origin: true, destination: true } } } },
          bookingPassengers: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { bookings, total, page: Number(page), limit: Number(limit) };
  }

  /** GET /admin/bookings/:id — detalle completo de cualquier reserva (US-029). */
  async findOneAdmin(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        bookingFlights: { include: { flight: { include: { origin: true, destination: true } } } },
        bookingHotels: { include: { hotel: { include: { destination: true } } } },
        bookingActivities: { include: { activity: true } },
        bookingExtras: true,
        bookingPassengers: true,
      },
    });
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    return booking;
  }

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
          bookingPassengers: true,
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
        bookingPassengers: true,
      },
    });
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    return booking;
  }

  /** POST /bookings/quote — cotización (pública o autenticada, US-020) */
  async quote(dto: QuoteDto, rawBody: Record<string, unknown>, userId?: number): Promise<QuoteResponseDto> {
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

    // Canje — si hay userId (usuario autenticado) se carga su saldo y nivel reales (US-020).
    // Se carga siempre que haya sesión para poder calcular maxRedeemablePoints.
    const pointsToRedeem = dto.pointsToRedeem ?? 0;
    let availablePoints = pointsToRedeem; // fallback público: solo valida que pida lo que tiene
    let completedTrips = 0;
    if (userId) {
      const clienteAuth = await this.prisma.client.findFirst({ where: { userId } });
      if (clienteAuth) {
        availablePoints = clienteAuth.availablePoints;
        completedTrips = clienteAuth.completedTrips;
      }
    }
    let redemption;
    try {
      redemption = computeRedemption({
        packageTotalCents,
        pointsToRedeem,
        availablePoints,
        completedTrips,
      });
    } catch (e) {
      if (e instanceof RedemptionError) throw new BadRequestException(e.message);
      throw e;
    }

    const subtotalDecimal = Number(fromCents(packageTotalCents));
    const discountDecimal = Number(fromCents(redemption.totalDiscountCents));
    const pointsDiscountDecimal = Number(fromCents(redemption.pointsDiscountCents));
    const levelDiscountDecimal = Number(fromCents(redemption.levelDiscountCents));
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
        pointsDiscountAmount: pointsDiscountDecimal,
        levelDiscountAmount: levelDiscountDecimal,
        total: totalDecimal,
      },
      pointsToRedeem: redemption.pointsUsed,
      pointsToEarn,
      maxRedeemablePoints: maxRedeemablePointsForPackage(packageTotalCents, availablePoints, completedTrips),
    };
  }

  /** POST /bookings — crea una reserva recalculando el precio en el servidor (B6) */
  async create(userId: number, dto: CreateBookingDto, rawBody: Record<string, unknown>) {
    rejectPriceFields(rawBody);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');
    const client = user.client;

    // ── Validar que la cantidad de pasajeros en el array cuadre con el conteo ─
    const cantidadPasajeros = dto.passengers.length;

    // ── Validar formato de documentos y rango de fecha de nacimiento ──────────
    const hoy = new Date();
    const anio1900 = new Date('1900-01-01');
    for (const p of dto.passengers) {
      const dniRe = /^\d{8}$/;
      const pasaporteRe = /^[A-Za-z0-9]{6,12}$/;
      if (p.documentType === 'DNI' && !dniRe.test(p.documentNumber)) {
        throw new BadRequestException(`El DNI debe tener exactamente 8 dígitos (pasajero: ${p.firstName})`);
      }
      if (p.documentType === 'PASAPORTE' && !pasaporteRe.test(p.documentNumber)) {
        throw new BadRequestException(`El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos (pasajero: ${p.firstName})`);
      }
      const nacimiento = new Date(p.birthDate);
      if (isNaN(nacimiento.getTime()) || nacimiento >= hoy || nacimiento < anio1900) {
        throw new BadRequestException(`La fecha de nacimiento de ${p.firstName} debe estar entre 1900 y hoy`);
      }
    }

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

    const flightLineCents = flightRecords.map(f => toCents(f!.pricePerPerson) * cantidadPasajeros);
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
      if (a.quantity < 1 || a.quantity > cantidadPasajeros) {
        throw new BadRequestException(
          `La cantidad de participantes en la actividad "${activity.name}" debe estar entre 1 y ${cantidadPasajeros}`,
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
          ? toCents(extra.price) * cantidadPasajeros
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
          passengers: cantidadPasajeros,
          notes: dto.notes,
          status: 'PENDIENTE',
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
          bookingPassengers: {
            create: dto.passengers.map((p) => ({
              firstName: p.firstName,
              lastName: p.lastName,
              documentType: p.documentType,
              documentNumber: p.documentNumber,
              birthDate: new Date(p.birthDate),
              isHolder: p.isHolder ?? false,
            })),
          },
        },
        include: {
          bookingFlights: { include: { flight: { include: { origin: true, destination: true } } } },
          bookingHotels: { include: { hotel: true } },
          bookingActivities: { include: { activity: true } },
          bookingExtras: true,
          bookingPassengers: true,
        },
      });

      // Los puntos se acreditan en pay() al confirmar, no al crear.
      return newBooking;
    });

    return booking;
  }

  /**
   * Actualiza el tipo de documento, número y fecha de nacimiento del perfil solo
   * si esos campos aún están vacíos. No sobreescribe datos que el cliente ya guardó.
   */
  private async _rellenarDocumentoSiVacio(
    clientId: number,
    titular: { documentType: DocumentType; documentNumber: string; birthDate: Date },
  ) {
    const perfil = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { documentType: true, documentNumber: true, dateOfBirth: true },
    });
    if (!perfil) return;
    if (perfil.documentType && perfil.documentNumber && perfil.dateOfBirth) return;
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        documentType: perfil.documentType ?? titular.documentType,
        documentNumber: perfil.documentNumber ?? titular.documentNumber,
        dateOfBirth: perfil.dateOfBirth ?? titular.birthDate,
      },
    });
  }

  /** GET /bookings/extras — lista los extras activos del catálogo con precio y modo de cobro. */
  async listExtras() {
    return this.prisma.extraOption.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, type: true, name: true, description: true, price: true, pricing: true, currency: true },
    });
  }

  // ─── Ciclo de vida ─────────────────────────────────────────────────────────

  /** Avanza el estado de una reserva validando la transición. */
  async advanceStatus(bookingId: string, newStatus: BookingStatus, by: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (!TRANSICIONES_VALIDAS[booking.status].includes(newStatus)) {
      throw new BadRequestException(
        `Esta reserva no puede pasar de ${booking.status} a ${newStatus}`,
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus, statusChangedAt: new Date(), statusChangedBy: by },
    });
  }

  /** Confirma el pago de una reserva PENDIENTE: avanza a CONFIRMADO y registra puntos. */
  async pay(userId: number, bookingId: string, dto: PayBookingDto) {
    // Silencia la variable para el registro contable futuro; el método la acepta como contrato.
    void dto;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, user: true },
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (booking.userId !== userId) throw new NotFoundException('Reserva no encontrada');
    if (booking.status !== 'PENDIENTE') {
      throw new BadRequestException('Solo se puede pagar una reserva en estado PENDIENTE');
    }

    const { pointsEarned, pointsUsed } = booking;
    const client = booking.client;
    const MAX_REDEEM_PERCENT = 50;

    // Revalidar puntos si hay canje
    if (pointsUsed > 0) {
      if (pointsUsed < 500) throw new BadRequestException('El canje mínimo es de 500 puntos');
      if (client.availablePoints < pointsUsed) {
        throw new BadRequestException('Tus puntos disponibles cambiaron, vuelve a revisar el resumen');
      }
      const maxDescuento = Math.floor(Number(booking.totalPrice) * MAX_REDEEM_PERCENT / 100);
      const descuentoReal = pointsUsed * 0.1; // 1 punto = S/ 0.10
      if (descuentoReal > maxDescuento) {
        throw new BadRequestException('Tus puntos disponibles cambiaron, vuelve a revisar el resumen');
      }
    }

    const confirmed = await this.prisma.$transaction(async (tx) => {
      // Avanzar estado
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMADO',
          statusChangedAt: new Date(),
          statusChangedBy: booking.user.email,
        },
      });

      // Actualizar puntos del cliente
      await tx.client.update({
        where: { id: client.id },
        data: {
          totalPoints:     { increment: pointsEarned },
          availablePoints: { increment: pointsEarned - pointsUsed },
        },
      });

      // Historial de puntos ganados
      if (pointsEarned > 0) {
        await tx.pointsHistory.create({
          data: {
            clientId:    client.id,
            type:        'EARNED',
            points:      pointsEarned,
            description: `Puntos ganados por reserva ${booking.confirmationCode}`,
            bookingId,
          },
        });
      }
      // Historial de puntos canjeados
      if (pointsUsed > 0) {
        await tx.pointsHistory.create({
          data: {
            clientId:    client.id,
            type:        'REDEEMED',
            points:      -pointsUsed,
            description: `Puntos canjeados en reserva ${booking.confirmationCode}`,
            bookingId,
          },
        });
      }

      return tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookingFlights:    { include: { flight: true } },
          bookingPassengers: true,
        },
      });
    });

    // Auto-rellena el documento del perfil con los datos del titular si están vacíos (US-009).
    const titular = confirmed?.bookingPassengers.find(p => p.isHolder);
    if (titular) {
      try {
        await this._rellenarDocumentoSiVacio(client.id, titular);
      } catch (err) {
        this.logger.error('No se pudo rellenar el documento del perfil', err);
      }
    }

    return confirmed;
  }

  /** Cancela una reserva PENDIENTE o CONFIRMADA, revirtiendo puntos si corresponde. */
  async cancel(bookingId: string, cancelledBy: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true },
    });

    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (!['PENDIENTE', 'CONFIRMADO'].includes(booking.status)) {
      throw new BadRequestException(`No se puede cancelar una reserva en estado ${booking.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELADO', statusChangedAt: new Date(), statusChangedBy: cancelledBy },
      });

      // Solo se revierten puntos si la reserva ya estaba CONFIRMADA (puntos ya acreditados)
      if (booking.status === 'CONFIRMADO') {
        const { pointsEarned, pointsUsed, client } = booking;

        if (pointsEarned > 0) {
          // US-018: saldo nunca negativo — decrementar solo hasta lo disponible.
          const clientActual = await tx.client.findUnique({
            where: { id: client.id },
            select: { availablePoints: true },
          });
          const actualDecrement = Math.min(pointsEarned, clientActual?.availablePoints ?? 0);
          await tx.client.update({
            where: { id: client.id },
            data: {
              totalPoints:     { decrement: actualDecrement },
              availablePoints: { decrement: actualDecrement },
            },
          });
          await tx.pointsHistory.create({
            data: {
              clientId:    client.id,
              type:        'EARNED_REFUND',
              points:      -actualDecrement,
              description: `Reversión de puntos por cancelación de ${booking.confirmationCode}`,
              bookingId,
            },
          });
          // Si el cliente ya había gastado parte, registrar ajuste informativo.
          if (actualDecrement < pointsEarned) {
            await tx.pointsHistory.create({
              data: {
                clientId:    client.id,
                type:        'EARNED_REFUND' as any,
                points:      0,
                description: `Ajuste: ${pointsEarned - actualDecrement} puntos ya utilizados no devueltos por cancelación de ${booking.confirmationCode}`,
                bookingId,
              },
            });
          }
        }

        if (pointsUsed > 0) {
          await tx.client.update({
            where: { id: client.id },
            data: { availablePoints: { increment: pointsUsed } },
          });
          await tx.pointsHistory.create({
            data: {
              clientId:    client.id,
              type:        'REDEEMED_REFUND',
              points:      pointsUsed,
              description: `Devolución de puntos canjeados por cancelación de ${booking.confirmationCode}`,
              bookingId,
            },
          });
        }
      }
      // Si era PENDIENTE: no hubo movimiento de puntos, no hay nada que revertir.

      return tx.booking.findUnique({ where: { id: bookingId } });
    });
  }

  /** Cancela la reserva propia de un cliente autenticado (desde PENDIENTE o CONFIRMADO). */
  async cancelOwn(userId: number, bookingId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, clientId: user.client.id },
    });
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    // US-018: el cliente puede cancelar desde PENDIENTE o CONFIRMADO.
    if (!['PENDIENTE', 'CONFIRMADO'].includes(booking.status)) {
      throw new BadRequestException('Este viaje ya no se puede cancelar');
    }

    return this.cancel(bookingId, user.email);
  }

  /**
   * Avance automático diario del estado de reservas.
   * CONFIRMADO → EN_CURSO cuando la fecha de salida ya pasó.
   * EN_CURSO → COMPLETADO cuando la fecha de regreso ya pasó; registra el viaje completado.
   */
  async runDailyAdvance() {
    const ahora = new Date();

    // CONFIRMADO → EN_CURSO: vuelo de salida ya ocurrió
    const paraEnCurso = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMADO',
        bookingFlights: { some: { flight: { departureDate: { lte: ahora } } } },
      },
      include: { bookingFlights: { include: { flight: true } } },
    });

    for (const b of paraEnCurso) {
      await this.advanceStatus(b.id, BookingStatus.EN_CURSO, 'sistema');
    }

    // EN_CURSO → COMPLETADO: el último vuelo de regreso ya llegó
    const paraCompletar = await this.prisma.booking.findMany({
      where: { status: 'EN_CURSO' },
      include: {
        bookingFlights: { include: { flight: true } },
        client: { include: { user: true } },
      },
    });

    for (const b of paraCompletar) {
      const maxArrival = Math.max(
        ...b.bookingFlights.map(bf => new Date(bf.flight.arrivalDate).getTime()),
      );
      if (maxArrival <= ahora.getTime()) {
        await this.advanceStatus(b.id, BookingStatus.COMPLETADO, 'sistema');
        await this.loyaltyService.onTripCompleted(b.clientId);
      }
    }
  }
}

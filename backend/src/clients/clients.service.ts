import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipLevel, Prisma } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { UpdateTravelerDto } from './dto/update-traveler.dto';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private loyalty: LoyaltyService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        client: {
          include: {
            travelers: true,
            savedDestinations: { include: { destination: true } },
            pointsHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
      },
    });
    if (!user || !user.client) throw new NotFoundException('Perfil no encontrado');
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      ...user.client,
    };
  }

  async updateProfile(userId: number, dto: UpdateClientDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');

    const data: Prisma.ClientUpdateInput = {
      phone: dto.phone,
      nationality: dto.nationality,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      travelStyle: dto.travelStyle,
      destinationType: dto.destinationType,
    };
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);

    return this.prisma.client.update({
      where: { id: user.client.id },
      data,
    });
  }

  async getHome(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');
    const client = user.client;

    // Próxima reserva confirmada (la de fecha de salida más cercana)
    const nextBookingRaw = await this.prisma.booking.findFirst({
      where: { clientId: client.id, status: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO'] } },
      orderBy: { createdAt: 'desc' }, // fallback; el orden real es por departureDate del vuelo
      include: {
        bookingFlights: {
          include: { flight: { include: { destination: true, origin: true } } },
          orderBy: { id: 'asc' },
        },
        bookingHotels: { include: { hotel: true } },
        bookingActivities: { include: { activity: true } },
      },
    });

    // Reordenar: tomar la reserva activa cuyo vuelo de ida tenga la fecha de salida más próxima
    const activeBookings = await this.prisma.booking.findMany({
      where: { clientId: client.id, status: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO'] } },
      include: {
        bookingFlights: {
          include: { flight: { include: { destination: true, origin: true } } },
          orderBy: { id: 'asc' },
        },
        bookingHotels: { include: { hotel: true } },
        bookingActivities: { include: { activity: true } },
      },
    });

    // Encontrar la reserva con el vuelo de ida (primer vuelo) de departureDate más próxima
    const now = new Date();
    const nextBooking = activeBookings
      .filter((b) => b.bookingFlights.length > 0)
      .sort((a, b) => {
        const dateA = new Date(a.bookingFlights[0].flight.departureDate).getTime();
        const dateB = new Date(b.bookingFlights[0].flight.departureDate).getTime();
        // Preferir fechas futuras más cercanas
        const diffA = Math.abs(dateA - now.getTime());
        const diffB = Math.abs(dateB - now.getTime());
        return diffA - diffB;
      })[0] ?? nextBookingRaw;

    // Puntos y nivel
    const loyalty = this.loyalty.buildStatus(client);

    // Destinos guardados
    const savedDestinations = await this.prisma.savedDestination.findMany({
      where: { clientId: client.id },
      include: { destination: true },
      take: 5,
    });

    // Temporadas próximas (festividades de los próximos 3 meses)
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const upcomingMonths: number[] = [];
    for (let i = 0; i <= 3; i++) {
      upcomingMonths.push(((currentMonth - 1 + i) % 12) + 1);
    }
    const upcomingFestivities = await this.prisma.festivity.findMany({
      where: { isActive: true, startMonth: { in: upcomingMonths } },
      include: { destination: true },
      take: 6,
    });

    return {
      user: { firstName: user.firstName, lastName: user.lastName },
      membership: {
        level: loyalty.level,
        levelLabel: loyalty.levelLabel,
        availablePoints: loyalty.availablePoints,
        availablePointsValue: loyalty.availablePointsValue,
        totalPoints: loyalty.totalPoints,
        completedTrips: loyalty.completedTrips,
        nextLevel: loyalty.nextLevel,
      },
      nextBooking: nextBooking ?? null,
      savedDestinations,
      upcomingFestivities,
    };
  }


  // ── Travelers ────────────────────────────────────────────────────────────
  async getTravelers(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');
    return this.prisma.traveler.findMany({ where: { clientId: user.client.id } });
  }

  async createTraveler(userId: number, dto: CreateTravelerDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');
    const existing = await this.prisma.traveler.findFirst({
      where: { clientId: user.client.id, documentNumber: dto.documentNumber },
    });
    if (existing) throw new BadRequestException('Ya tienes un viajero con ese documento');
    return this.prisma.traveler.create({
      data: { ...dto, dateOfBirth: new Date(dto.dateOfBirth), clientId: user.client.id },
    });
  }

  async updateTraveler(userId: number, travelerId: number, dto: UpdateTravelerDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');

    // Check for duplicate document on update (only when documentNumber changes)
    if (dto.documentNumber) {
      const existing = await this.prisma.traveler.findFirst({
        where: { clientId: user.client.id, documentNumber: dto.documentNumber, NOT: { id: travelerId } },
      });
      if (existing) throw new BadRequestException('Ya tienes un viajero con ese documento');
    }

    const data: Prisma.TravelerUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      relation: dto.relation,
    };
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);

    return this.prisma.traveler.update({
      where: { id: travelerId, clientId: user.client.id },
      data,
    });
  }

  async deleteTraveler(userId: number, travelerId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');
    return this.prisma.traveler.delete({ where: { id: travelerId, clientId: user.client.id } });
  }

  // ── Saved destinations ───────────────────────────────────────────────────
  async saveDestination(userId: number, destinationId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');
    return this.prisma.savedDestination.upsert({
      where: { clientId_destinationId: { clientId: user.client.id, destinationId } },
      update: {},
      create: { clientId: user.client.id, destinationId },
    });
  }

  async removeSavedDestination(userId: number, destinationId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
    if (!user?.client) throw new NotFoundException('Perfil no encontrado');
    return this.prisma.savedDestination.deleteMany({
      where: { clientId: user.client.id, destinationId },
    });
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** Lista todos los clientes con su estado de fidelización; filtra por nivel y búsqueda de texto. */
  async findAllAdmin(query: { level?: MembershipLevel; search?: string }) {
    const where: Prisma.ClientWhereInput = {};

    if (query.level) {
      where.membershipLevel = query.level;
    }

    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const clientes = await this.prisma.client.findMany({
      where,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return clientes.map((c) => ({
      id: c.id,
      userId: c.userId,
      nombre: `${c.user.firstName} ${c.user.lastName}`,
      email: c.user.email,
      nivel: c.membershipLevel,
      puntos: c.availablePoints,
      puntosTotal: c.totalPoints,
      viajes: c.completedTrips,
      fechaRegistro: c.user.createdAt,
    }));
  }

  /** Retorna el perfil completo de un cliente con sus reservas e historial de puntos (admin). */
  async findOneAdmin(clientId: number) {
    const cliente = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true, mustChangePassword: true, createdAt: true } },
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            confirmationCode: true,
            status: true,
            totalPrice: true,
            currency: true,
            pointsEarned: true,
            pointsUsed: true,
            passengers: true,
            createdAt: true,
          },
        },
        pointsHistory: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });

    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    return {
      id: cliente.id,
      userId: cliente.userId,
      email: cliente.user.email,
      firstName: cliente.user.firstName,
      lastName: cliente.user.lastName,
      isActive: cliente.user.isActive,
      mustChangePassword: cliente.user.mustChangePassword,
      phone: cliente.phone,
      nationality: cliente.nationality,
      documentNumber: cliente.documentNumber,
      dateOfBirth: cliente.dateOfBirth,
      travelStyle: cliente.travelStyle,
      destinationType: cliente.destinationType,
      spendingRange: cliente.spendingRange,
      nivel: cliente.membershipLevel,
      puntos: cliente.availablePoints,
      puntosTotal: cliente.totalPoints,
      viajes: cliente.completedTrips,
      fechaRegistro: cliente.user.createdAt,
      reservas: cliente.bookings,
      historialPuntos: cliente.pointsHistory,
    };
  }

  /** Genera una contraseña temporal, la hashea y marca al usuario para que la cambie al iniciar sesión. */
  async resetPassword(clientId: number) {
    const cliente = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const temporal = this.generarPasswordTemporal();
    const hash = await bcryptjs.hash(temporal, 10);

    await this.prisma.user.update({
      where: { id: cliente.userId },
      data: { password: hash, mustChangePassword: true },
    });

    // La contraseña en texto plano se devuelve una sola vez; no se guarda ni se registra.
    return { contrasenaTemporalUnica: temporal };
  }

  /** Genera una contraseña temporal de 10 caracteres con al menos una mayúscula y un número. */
  private generarPasswordTemporal(): string {
    const letrasMin = 'abcdefghijkmnopqrstuvwxyz';
    const letrasMay = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numeros = '23456789';
    const todos = letrasMin + letrasMay + numeros;

    const elegir = (fuente: string) => fuente[Math.floor(Math.random() * fuente.length)];

    // Garantiza al menos una mayúscula y un número
    const partes = [elegir(letrasMay), elegir(numeros)];
    for (let i = partes.length; i < 10; i++) {
      partes.push(elegir(todos));
    }

    // Mezcla con Fisher-Yates para que la mayúscula y el número no siempre queden al inicio
    for (let i = partes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [partes[i], partes[j]] = [partes[j], partes[i]];
    }

    return partes.join('');
  }
}

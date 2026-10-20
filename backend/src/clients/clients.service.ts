import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
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

    const data: any = { ...dto };
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

    // Próxima reserva confirmada
    const nextBooking = await this.prisma.booking.findFirst({
      where: { clientId: client.id, status: { in: ['CONFIRMADO', 'EN_CURSO'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        bookingFlights: { include: { flight: { include: { destination: true, origin: true } } } },
        bookingHotels: { include: { hotel: true } },
        bookingActivities: { include: { activity: true } },
      },
    });

    // Puntos y nivel
    const loyalty = this.loyalty.buildStatus(client);

    // Destinos guardados
    const savedDestinations = await this.prisma.savedDestination.findMany({
      where: { clientId: client.id },
      include: { destination: true },
      take: 5,
    });

    // Temporadas próximas (festividades de los próximos 3 meses)
    const now = new Date();
    const upcomingFestivities = await this.prisma.festivity.findMany({
      where: { isActive: true },
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
}

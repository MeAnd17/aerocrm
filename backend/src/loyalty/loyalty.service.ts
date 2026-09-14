import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LEVEL_RULES = [
  { level: 'ELITE',     minTrips: 15, discount: 15 },
  { level: 'FRECUENTE', minTrips: 8,  discount: 10 },
  { level: 'VIAJERO',   minTrips: 3,  discount: 5  },
  { level: 'EXPLORADOR',minTrips: 0,  discount: 0  },
] as const;

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');
    const client = user.client;

    const currentRule = LEVEL_RULES.find(r => client.completedTrips >= r.minTrips) ?? LEVEL_RULES[3];
    const nextRule = LEVEL_RULES.slice().reverse().find(r => r.minTrips > client.completedTrips);

    return {
      level: client.membershipLevel,
      totalPoints: client.totalPoints,
      availablePoints: client.availablePoints,
      completedTrips: client.completedTrips,
      currentDiscount: currentRule.discount,
      nextLevel: nextRule ? {
        level: nextRule.level,
        tripsNeeded: nextRule.minTrips - client.completedTrips,
        discount: nextRule.discount,
      } : null,
      pointsValue: `${client.availablePoints} puntos = S/.${(client.availablePoints * 0.1).toFixed(2)}`,
      levels: LEVEL_RULES.map(r => ({
        level: r.level,
        minTrips: r.minTrips,
        discount: r.discount,
        reached: client.completedTrips >= r.minTrips,
      })),
    };
  }

  async getPointsHistory(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');

    return this.prisma.pointsHistory.findMany({
      where: { clientId: user.client.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Called after a booking is marked COMPLETADO
  async onTripCompleted(clientId: number) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;

    const newTrips = client.completedTrips + 1;
    const newLevel = LEVEL_RULES.find(r => newTrips >= r.minTrips)?.level ?? 'EXPLORADOR';

    await this.prisma.client.update({
      where: { id: clientId },
      data: { completedTrips: newTrips, membershipLevel: newLevel as any },
    });
  }
}

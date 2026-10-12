import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RedemptionPreviewDto } from './dto/redemption-preview.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  LEVELS,
  MIN_REDEEM_POINTS,
  RedemptionError,
  computeRedemption,
  toCents,
  fromCents,
  levelForTrips,
  levelStatus,
  pointsValueCents,
} from './loyalty.rules';

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

    return this.buildStatus(client);
  }

  /** Resumen de fidelización de un cliente, calculado solo con el motor (B7). */
  buildStatus(client: { totalPoints: number; availablePoints: number; completedTrips: number }) {
    const status = levelStatus(client.completedTrips);
    const valueCents = pointsValueCents(client.availablePoints);
    return {
      level: status.current.level,
      levelLabel: status.current.label,
      totalPoints: client.totalPoints,
      availablePoints: client.availablePoints,
      completedTrips: client.completedTrips,
      currentDiscount: status.current.redeemDiscountPercent,
      canRedeem: client.availablePoints >= MIN_REDEEM_POINTS,
      minRedeemPoints: MIN_REDEEM_POINTS,
      availablePointsValue: fromCents(valueCents),
      pointsValue: `${client.availablePoints} puntos = S/ ${fromCents(valueCents)}`,
      nextLevel: status.next
        ? {
            level: status.next.level,
            levelLabel: status.next.label,
            tripsNeeded: status.next.tripsNeeded,
            discount: status.next.redeemDiscountPercent,
            progressPercent: status.next.progressPercent,
          }
        : null,
      levels: LEVELS.map((r) => ({
        level: r.level,
        levelLabel: r.label,
        minTrips: r.minTrips,
        discount: r.redeemDiscountPercent,
        reached: client.completedTrips >= r.minTrips,
      })),
    };
  }

  /** Calcula el descuento de un canje sin registrar nada, para mostrarlo en el resumen del armador. */
  async previewRedemption(userId: number, dto: RedemptionPreviewDto) {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    try {
      const r = computeRedemption({
        packageTotalCents: toCents(dto.packageTotal),
        pointsToRedeem: dto.pointsToRedeem,
        availablePoints: client.availablePoints,
        completedTrips: client.completedTrips,
      });
      return {
        pointsUsed: r.pointsUsed,
        pointsDiscount: fromCents(r.pointsDiscountCents),
        levelDiscount: fromCents(r.levelDiscountCents),
        totalDiscount: fromCents(r.totalDiscountCents),
        finalTotal: fromCents(r.finalTotalCents),
      };
    } catch (e) {
      if (e instanceof RedemptionError) throw new BadRequestException(e.message);
      throw e;
    }
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

  // Se llama cuando una reserva pasa a COMPLETADO
  async onTripCompleted(clientId: number) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return;

    const newTrips = client.completedTrips + 1;
    await this.prisma.client.update({
      where: { id: clientId },
      data: { completedTrips: newTrips, membershipLevel: levelForTrips(newTrips).level },
    });
  }
}

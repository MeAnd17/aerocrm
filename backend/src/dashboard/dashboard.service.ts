import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [
      flightsToday,
      flightsByStatus,
      activePassengers,
      openTickets,
      urgentTickets,
      ancillaryRevenue,
      checkInsToday,
      sentimentData,
    ] = await Promise.all([
      this.prisma.flight.count({ where: { scheduledDeparture: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.flight.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.passenger.count({ where: { isActive: true } }),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.supportTicket.count({ where: { priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.ancillary.aggregate({ _sum: { totalPrice: true }, where: { status: 'ACTIVE' } }),
      this.prisma.reservation.count({ where: { status: 'CHECKED_IN', updatedAt: { gte: todayStart } } }),
      this.prisma.aIAnalysis.aggregate({ _avg: { sentimentScore: true } }),
    ]);

    const statusMap: Record<string, number> = {};
    flightsByStatus.forEach(s => { statusMap[s.status] = s._count.id; });

    return {
      flightsToday,
      flightsByStatus: statusMap,
      activePassengers,
      openTickets,
      urgentTickets,
      ancillaryRevenue: Number(ancillaryRevenue._sum.totalPrice || 0),
      checkInsToday,
      avgSentiment: Number(sentimentData._avg.sentimentScore?.toFixed(2) || 0),
    };
  }

  async getFlightsTrend() {
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const count = await this.prisma.flight.count({ where: { scheduledDeparture: { gte: d, lte: end } } });
      results.push({ date: d.toISOString().split('T')[0], count });
    }
    return results;
  }

  async getAncillaryBreakdown() {
    const breakdown = await this.prisma.ancillary.groupBy({
      by: ['type'],
      _sum: { totalPrice: true },
      _count: { id: true },
      where: { status: 'ACTIVE' },
      orderBy: { _sum: { totalPrice: 'desc' } },
    });
    return breakdown.map(b => ({ type: b.type, revenue: Number(b._sum.totalPrice || 0), count: b._count.id }));
  }

  async getSentimentTrend() {
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const avg = await this.prisma.aIAnalysis.aggregate({
        _avg: { sentimentScore: true },
        where: { createdAt: { gte: d, lte: end } },
      });
      results.push({ date: d.toISOString().split('T')[0], avgSentiment: Number(avg._avg.sentimentScore?.toFixed(2) || 0) });
    }
    return results;
  }

  async getRecentActivity() {
    const [recentFlightChanges, recentTickets, recentReservations] = await Promise.all([
      this.prisma.flight.findMany({
        orderBy: { updatedAt: 'desc' }, take: 7,
        include: { route: { include: { origin: true, destination: true } } },
        where: { updatedAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
      }),
      this.prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' }, take: 7,
        include: { passenger: { select: { firstName: true, lastName: true } } },
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
      }),
      this.prisma.reservation.findMany({
        orderBy: { createdAt: 'desc' }, take: 6,
        include: {
          passenger: { select: { firstName: true, lastName: true } },
          flight: { select: { flightNumber: true } },
        },
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
      }),
    ]);

    const activities = [
      ...recentFlightChanges.map(f => ({
        type: 'flight_status',
        icon: 'airplane',
        message: `Flight ${f.flightNumber} is now ${f.status.replace('_', ' ')}`,
        timestamp: f.updatedAt,
        meta: { flightId: f.id, status: f.status },
      })),
      ...recentTickets.map(t => ({
        type: 'new_ticket',
        icon: 'chat',
        message: `New ${t.priority.toLowerCase()} ticket: ${t.subject.substring(0, 50)}`,
        timestamp: t.createdAt,
        meta: { ticketId: t.id, priority: t.priority },
      })),
      ...recentReservations.map(r => ({
        type: 'reservation',
        icon: 'ticket',
        message: `${r.passenger.firstName} ${r.passenger.lastName} booked ${r.flight.flightNumber}`,
        timestamp: r.createdAt,
        meta: { reservationId: r.id },
      })),
    ];

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
  }

  async getUpcomingFlights() {
    return this.prisma.flight.findMany({
      where: { scheduledDeparture: { gte: new Date() }, status: { notIn: ['CANCELLED', 'LANDED'] } },
      orderBy: { scheduledDeparture: 'asc' },
      take: 8,
      include: { route: { include: { origin: true, destination: true } }, gate: true },
    });
  }
}

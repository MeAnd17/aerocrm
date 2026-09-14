import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlightsGateway } from './flights.gateway';
import { CreateFlightDto } from './dto/create-flight.dto';
import { UpdateFlightStatusDto } from './dto/update-flight-status.dto';
import { FlightStatus, FareClass } from '@prisma/client';

// Miles multiplier per fare class
const MILES_MULTIPLIER: Record<FareClass, number> = {
  ECONOMY: 1,
  PREMIUM_ECONOMY: 1.25,
  BUSINESS: 1.5,
  FIRST_CLASS: 2,
};

// Tier thresholds
const TIER_RULES = [
  { tier: 'PLATINUM', minFlights: 30, minMiles: 75000 },
  { tier: 'GOLD',     minFlights: 15, minMiles: 25000 },
  { tier: 'SILVER',   minFlights: 5,  minMiles: 5000  },
  { tier: 'STANDARD', minFlights: 0,  minMiles: 0     },
] as const;

function calculateTier(totalFlights: number, totalMiles: number): string {
  for (const rule of TIER_RULES) {
    if (totalFlights >= rule.minFlights || totalMiles >= rule.minMiles) return rule.tier;
  }
  return 'STANDARD';
}

@Injectable()
export class FlightsService {
  constructor(private prisma: PrismaService, private gateway: FlightsGateway) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, status, date, routeId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (routeId) where.routeId = Number(routeId);
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.scheduledDeparture = { gte: d, lt: next };
    }

    const [data, total] = await Promise.all([
      this.prisma.flight.findMany({
        where, skip, take: Number(limit),
        orderBy: { scheduledDeparture: 'asc' },
        include: {
          route: { include: { origin: true, destination: true } },
          gate: true,
          _count: { select: { reservations: true } },
        },
      }),
      this.prisma.flight.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: number) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        route: { include: { origin: true, destination: true } },
        gate: true,
        reservations: {
          include: { passenger: true, ancillaries: true },
          take: 50,
        },
        _count: { select: { reservations: true } },
      },
    });
    if (!flight) throw new NotFoundException(`Flight #${id} not found`);
    return flight;
  }

  async getManifest(id: number) {
    const flight = await this.prisma.flight.findUnique({ where: { id } });
    if (!flight) throw new NotFoundException(`Flight #${id} not found`);
    return this.prisma.reservation.findMany({
      where: { flightId: id, status: { notIn: ['CANCELLED'] } },
      include: { passenger: true, ancillaries: true },
      orderBy: { seatNumber: 'asc' },
    });
  }

  async findRoutes() {
    return this.prisma.route.findMany({ include: { origin: true, destination: true } });
  }

  async findGates() {
    return this.prisma.gate.findMany({ orderBy: { code: 'asc' } });
  }

  async create(dto: CreateFlightDto) {
    const dep = new Date(dto.scheduledDeparture);
    const arr = new Date(dto.scheduledArrival);

    if (arr <= dep) throw new BadRequestException('Scheduled arrival must be after scheduled departure');
    if (dto.economySeats + dto.businessSeats + dto.firstClassSeats > dto.totalSeats)
      throw new BadRequestException('Sum of seat classes cannot exceed total seats');
    if (dto.economySeats < 1) throw new BadRequestException('Economy seats must be at least 1');

    const existing = await this.prisma.flight.findUnique({ where: { flightNumber: dto.flightNumber } });
    if (existing) throw new BadRequestException(`Flight number ${dto.flightNumber} already exists`);

    return this.prisma.flight.create({
      data: {
        flightNumber: dto.flightNumber,
        routeId: dto.routeId,
        gateId: dto.gateId,
        scheduledDeparture: dep,
        scheduledArrival: arr,
        status: dto.status,
        aircraft: dto.aircraft || 'Boeing 737-800',
        totalSeats: dto.totalSeats,
        economySeats: dto.economySeats,
        businessSeats: dto.businessSeats,
        firstClassSeats: dto.firstClassSeats,
      },
      include: { route: { include: { origin: true, destination: true } }, gate: true },
    });
  }

  async update(id: number, dto: any) {
    const flight = await this.findOne(id);
    const data: any = { ...dto };
    if (dto.scheduledDeparture) data.scheduledDeparture = new Date(dto.scheduledDeparture);
    if (dto.scheduledArrival) data.scheduledArrival = new Date(dto.scheduledArrival);

    if (data.scheduledDeparture && data.scheduledArrival) {
      if (data.scheduledArrival <= data.scheduledDeparture)
        throw new BadRequestException('Arrival must be after departure');
    }

    return this.prisma.flight.update({
      where: { id },
      data,
      include: { route: { include: { origin: true, destination: true } }, gate: true },
    });
  }

  async updateStatus(id: number, dto: UpdateFlightStatusDto) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!flight) throw new NotFoundException(`Flight #${id} not found`);

    // Validate logical status transitions
    if (flight.status === FlightStatus.LANDED && dto.status !== FlightStatus.LANDED)
      throw new BadRequestException('Cannot change status of a flight that has already landed');
    if (flight.status === FlightStatus.CANCELLED)
      throw new BadRequestException('Cannot change status of a cancelled flight');

    const data: any = { status: dto.status };
    if (dto.actualDeparture) data.actualDeparture = new Date(dto.actualDeparture);
    if (dto.actualArrival) data.actualArrival = new Date(dto.actualArrival);

    const updated = await this.prisma.flight.update({
      where: { id },
      data,
      include: { route: { include: { origin: true, destination: true } }, gate: true },
    });

    // ── Auto-create FlightHistory when flight LANDS ────────────────────────
    if (dto.status === FlightStatus.LANDED && flight.status !== FlightStatus.LANDED) {
      await this.createFlightHistoryForAllPassengers(flight.id, flight.routeId);
    }

    // Emit WebSocket event
    this.gateway.emitFlightStatusUpdate({
      flightId: id,
      flightNumber: updated.flightNumber,
      status: dto.status,
      reason: dto.reason,
      updatedAt: new Date().toISOString(),
      origin: (updated.route as any).origin?.iataCode,
      destination: (updated.route as any).destination?.iataCode,
    });

    return updated;
  }

  // ── Create FlightHistory entries for all passengers on a landed flight ────
  private async createFlightHistoryForAllPassengers(flightId: number, routeId: number) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    const distanceKm = route?.distanceKm ?? 0;

    // Get all confirmed/checked-in reservations for this flight
    const reservations = await this.prisma.reservation.findMany({
      where: { flightId, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
      select: { passengerId: true, fareClass: true, totalPrice: true },
    });

    for (const res of reservations) {
      // Check if history entry already exists (idempotent)
      const existing = await this.prisma.flightHistory.findFirst({
        where: { passengerId: res.passengerId, flightId },
      });
      if (existing) continue;

      const multiplier = MILES_MULTIPLIER[res.fareClass] ?? 1;
      const milesEarned = Math.round(distanceKm * multiplier);

      await this.prisma.flightHistory.create({
        data: {
          passengerId: res.passengerId,
          flightId,
          fareClass: res.fareClass,
          completedAt: new Date(),
          milesEarned,
        },
      });

      // Recalculate passenger stats and tier
      await this.recalculatePassengerTier(res.passengerId, Number(res.totalPrice));
    }
  }

  // ── Recalculate tier, totalMiles, totalFlights, lifetimeValue ─────────────
  async recalculatePassengerTier(passengerId: number, addedSpend = 0) {
    const history = await this.prisma.flightHistory.findMany({
      where: { passengerId },
      select: { milesEarned: true },
    });

    const totalMiles = history.reduce((sum, h) => sum + h.milesEarned, 0);
    const totalFlights = history.length;
    const newTier = calculateTier(totalFlights, totalMiles);

    // Sum all reservation prices for lifetime value
    const reservations = await this.prisma.reservation.findMany({
      where: { passengerId, status: { notIn: ['CANCELLED'] } },
      select: { totalPrice: true },
    });
    const lifetimeValue = reservations.reduce((sum, r) => sum + Number(r.totalPrice), 0);

    await this.prisma.passenger.update({
      where: { id: passengerId },
      data: { totalMiles, totalFlights, tier: newTier as any, lifetimeValue },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.flight.delete({ where: { id } });
  }
}


@Injectable()
export class FlightsService {
  constructor(private prisma: PrismaService, private gateway: FlightsGateway) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, status, date, routeId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (routeId) where.routeId = Number(routeId);
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.scheduledDeparture = { gte: d, lt: next };
    }

    const [data, total] = await Promise.all([
      this.prisma.flight.findMany({
        where, skip, take: Number(limit),
        orderBy: { scheduledDeparture: 'asc' },
        include: {
          route: { include: { origin: true, destination: true } },
          gate: true,
          _count: { select: { reservations: true } },
        },
      }),
      this.prisma.flight.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: number) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        route: { include: { origin: true, destination: true } },
        gate: true,
        reservations: {
          include: { passenger: true, ancillaries: true },
          take: 50,
        },
        _count: { select: { reservations: true } },
      },
    });
    if (!flight) throw new NotFoundException(`Flight #${id} not found`);
    return flight;
  }

  async getManifest(id: number) {
    const flight = await this.prisma.flight.findUnique({ where: { id } });
    if (!flight) throw new NotFoundException(`Flight #${id} not found`);
    return this.prisma.reservation.findMany({
      where: { flightId: id, status: { notIn: ['CANCELLED'] } },
      include: { passenger: true, ancillaries: true },
      orderBy: { seatNumber: 'asc' },
    });
  }

  async findRoutes() {
    return this.prisma.route.findMany({ include: { origin: true, destination: true } });
  }

  async findGates() {
    return this.prisma.gate.findMany({ orderBy: { code: 'asc' } });
  }

  async create(dto: CreateFlightDto) {
    const dep = new Date(dto.scheduledDeparture);
    const arr = new Date(dto.scheduledArrival);

    if (arr <= dep) throw new BadRequestException('Scheduled arrival must be after scheduled departure');
    if (dto.economySeats + dto.businessSeats + dto.firstClassSeats > dto.totalSeats)
      throw new BadRequestException('Sum of seat classes cannot exceed total seats');
    if (dto.economySeats < 1) throw new BadRequestException('Economy seats must be at least 1');

    const existing = await this.prisma.flight.findUnique({ where: { flightNumber: dto.flightNumber } });
    if (existing) throw new BadRequestException(`Flight number ${dto.flightNumber} already exists`);

    return this.prisma.flight.create({
      data: {
        flightNumber: dto.flightNumber,
        routeId: dto.routeId,
        gateId: dto.gateId,
        scheduledDeparture: dep,
        scheduledArrival: arr,
        status: dto.status,
        aircraft: dto.aircraft || 'Boeing 737-800',
        totalSeats: dto.totalSeats,
        economySeats: dto.economySeats,
        businessSeats: dto.businessSeats,
        firstClassSeats: dto.firstClassSeats,
      },
      include: { route: { include: { origin: true, destination: true } }, gate: true },
    });
  }

  async update(id: number, dto: any) {
    const flight = await this.findOne(id);
    const data: any = { ...dto };
    if (dto.scheduledDeparture) data.scheduledDeparture = new Date(dto.scheduledDeparture);
    if (dto.scheduledArrival) data.scheduledArrival = new Date(dto.scheduledArrival);

    if (data.scheduledDeparture && data.scheduledArrival) {
      if (data.scheduledArrival <= data.scheduledDeparture)
        throw new BadRequestException('Arrival must be after departure');
    }

    return this.prisma.flight.update({
      where: { id },
      data,
      include: { route: { include: { origin: true, destination: true } }, gate: true },
    });
  }

  async updateStatus(id: number, dto: UpdateFlightStatusDto) {
    const flight = await this.prisma.flight.findUnique({ where: { id } });
    if (!flight) throw new NotFoundException(`Flight #${id} not found`);

    // Validate logical status transitions
    if (flight.status === FlightStatus.LANDED && dto.status !== FlightStatus.LANDED)
      throw new BadRequestException('Cannot change status of a flight that has already landed');
    if (flight.status === FlightStatus.CANCELLED)
      throw new BadRequestException('Cannot change status of a cancelled flight');

    const data: any = { status: dto.status };
    if (dto.actualDeparture) data.actualDeparture = new Date(dto.actualDeparture);
    if (dto.actualArrival) data.actualArrival = new Date(dto.actualArrival);

    const updated = await this.prisma.flight.update({
      where: { id },
      data,
      include: { route: { include: { origin: true, destination: true } }, gate: true },
    });

    // Emit WebSocket event
    this.gateway.emitFlightStatusUpdate({
      flightId: id,
      flightNumber: updated.flightNumber,
      status: dto.status,
      reason: dto.reason,
      updatedAt: new Date().toISOString(),
      origin: (updated.route as any).origin?.iataCode,
      destination: (updated.route as any).destination?.iataCode,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.flight.delete({ where: { id } });
  }
}

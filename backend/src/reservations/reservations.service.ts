import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateAncillaryDto } from './dto/create-ancillary.dto';
import { FlightStatus, ReservationStatus } from '@prisma/client';

const ANCILLARY_CATALOG: Record<string, { basePrice: number; maxQuantity: number; description: string }> = {
  EXTRA_BAGGAGE: { basePrice: 45, maxQuantity: 5, description: 'Extra Checked Baggage (23kg)' },
  PREFERRED_SEAT: { basePrice: 25, maxQuantity: 1, description: 'Preferred Seat Selection' },
  LOUNGE_ACCESS: { basePrice: 85, maxQuantity: 4, description: 'Airport Lounge Access' },
  TRAVEL_INSURANCE: { basePrice: 35, maxQuantity: 1, description: 'Travel Insurance' },
  GOURMET_PACKAGE: { basePrice: 55, maxQuantity: 1, description: 'Premium Gourmet Meal Package' },
  PRIORITY_BOARDING: { basePrice: 15, maxQuantity: 1, description: 'Priority Boarding Pass' },
  CAR_RENTAL: { basePrice: 120, maxQuantity: 1, description: 'Car Rental at Destination' },
  HOTEL_PACKAGE: { basePrice: 200, maxQuantity: 7, description: 'Hotel Package (per night)' },
};

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, status, fareClass, passengerId, flightId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (fareClass) where.fareClass = fareClass;
    if (passengerId) where.passengerId = Number(passengerId);
    if (flightId) where.flightId = Number(flightId);

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          passenger: { select: { id: true, firstName: true, lastName: true, email: true, tier: true } },
          flight: { include: { route: { include: { origin: true, destination: true } } } },
          ancillaries: true,
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: number) {
    const r = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        passenger: true,
        flight: { include: { route: { include: { origin: true, destination: true } }, gate: true } },
        ancillaries: true,
      },
    });
    if (!r) throw new NotFoundException(`Reservation #${id} not found`);
    return r;
  }

  async getCatalog() {
    return Object.entries(ANCILLARY_CATALOG).map(([type, info]) => ({ type, ...info }));
  }

  async create(dto: CreateReservationDto) {
    const flight = await this.prisma.flight.findUnique({ where: { id: dto.flightId } });
    if (!flight) throw new NotFoundException(`Flight #${dto.flightId} not found`);
    if (flight.status === FlightStatus.CANCELLED) throw new BadRequestException('Cannot create reservation for a cancelled flight');
    if (flight.status === FlightStatus.DEPARTED || flight.status === FlightStatus.LANDED)
      throw new BadRequestException('Cannot create reservation for a flight that has already departed');

    const passenger = await this.prisma.passenger.findFirst({ where: { id: dto.passengerId, isActive: true } });
    if (!passenger) throw new NotFoundException(`Passenger #${dto.passengerId} not found`);

    // Check duplicate
    const dup = await this.prisma.reservation.findFirst({
      where: { passengerId: dto.passengerId, flightId: dto.flightId, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
    });
    if (dup) throw new ConflictException('Passenger already has a reservation for this flight');

    const ref = `AE-${Date.now().toString().slice(-6)}`;
    const totalPrice = Math.max(0.01, Number(dto.totalPrice));

    return this.prisma.reservation.create({
      data: {
        bookingReference: ref,
        passengerId: dto.passengerId,
        flightId: dto.flightId,
        fareClass: dto.fareClass,
        seatNumber: dto.seatNumber,
        status: ReservationStatus.CONFIRMED,
        totalPrice,
        currency: dto.currency || 'USD',
      },
      include: {
        passenger: true,
        flight: { include: { route: { include: { origin: true, destination: true } } } },
        ancillaries: true,
      },
    });
  }

  async updateStatus(id: number, status: string) {
    const r = await this.findOne(id);
    if (r.status === 'CANCELLED' && status !== 'CANCELLED')
      throw new BadRequestException('Cannot reactivate a cancelled reservation');
    return this.prisma.reservation.update({ where: { id }, data: { status: status as any } });
  }

  async addAncillary(reservationId: number, dto: CreateAncillaryDto) {
    const reservation = await this.findOne(reservationId);
    if (reservation.status === 'CANCELLED') throw new BadRequestException('Cannot add ancillaries to a cancelled reservation');

    const catalog = ANCILLARY_CATALOG[dto.type];
    if (!catalog) throw new BadRequestException(`Unknown ancillary type: ${dto.type}`);

    const qty = Math.max(1, Math.min(dto.quantity, catalog.maxQuantity));
    const existingOfType = reservation.ancillaries.filter((a: any) => a.type === dto.type && a.status === 'ACTIVE');

    if (existingOfType.length >= catalog.maxQuantity)
      throw new BadRequestException(`Maximum ${catalog.maxQuantity} units of ${dto.type} allowed per reservation`);

    const unitPrice = Number(dto.unitPrice) || catalog.basePrice;
    if (unitPrice < 0) throw new BadRequestException('Unit price cannot be negative');

    return this.prisma.ancillary.create({
      data: {
        reservationId,
        type: dto.type as any,
        description: dto.description || catalog.description,
        quantity: qty,
        unitPrice,
        totalPrice: unitPrice * qty,
      },
    });
  }

  async cancelAncillary(reservationId: number, ancillaryId: number) {
    const anc = await this.prisma.ancillary.findFirst({ where: { id: ancillaryId, reservationId } });
    if (!anc) throw new NotFoundException(`Ancillary #${ancillaryId} not found`);
    return this.prisma.ancillary.update({ where: { id: ancillaryId }, data: { status: 'CANCELLED' } });
  }
}

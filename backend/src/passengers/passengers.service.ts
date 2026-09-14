import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePassengerDto } from './dto/create-passenger.dto';
import { UpdatePassengerDto } from './dto/update-passenger.dto';

@Injectable()
export class PassengersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, search, tier } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    if (tier) where.tier = tier;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { passportNumber: { contains: search } },
        { frequentFlyerNumber: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.passenger.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      this.prisma.passenger.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: number) {
    const p = await this.prisma.passenger.findFirst({ where: { id, isActive: true } });
    if (!p) throw new NotFoundException(`Passenger #${id} not found`);
    return p;
  }

  async getProfile360(id: number) {
    const passenger = await this.prisma.passenger.findFirst({
      where: { id, isActive: true },
      include: {
        reservations: {
          include: {
            flight: { include: { route: { include: { origin: true, destination: true } }, gate: true } },
            ancillaries: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        supportTickets: {
          include: { messages: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        flightHistory: {
          include: { flight: { include: { route: { include: { origin: true, destination: true } } } } },
          orderBy: { completedAt: 'desc' },
        },
      },
    });
    if (!passenger) throw new NotFoundException(`Passenger #${id} not found`);

    const totalMiles = passenger.flightHistory.reduce((sum, fh) => sum + fh.milesEarned, 0);
    const totalSpend = passenger.reservations.reduce((sum, r) => sum + Number(r.totalPrice), 0);
    const activeReservations = passenger.reservations.filter(r => ['CONFIRMED', 'CHECKED_IN', 'PENDING'].includes(r.status));

    return {
      ...passenger,
      stats: {
        totalFlights: passenger.flightHistory.length,
        totalMiles,
        totalSpend,
        activeReservations: activeReservations.length,
        openTickets: passenger.supportTickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length,
      },
    };
  }

  async create(dto: CreatePassengerDto) {
    // Validate date of birth: must be past, max 120 years ago
    const dob = new Date(dto.dateOfBirth);
    const now = new Date();
    if (dob >= now) throw new BadRequestException('Date of birth must be in the past');
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 120);
    if (dob < maxAge) throw new BadRequestException('Date of birth cannot be more than 120 years ago');

    // Passport expiry: must be at least 6 months in the future
    const passExpiry = new Date(dto.passportExpiry);
    const minExpiry = new Date();
    minExpiry.setMonth(minExpiry.getMonth() + 6);
    if (passExpiry < minExpiry) throw new BadRequestException('Passport expiry must be at least 6 months from today');

    // Check unique constraints
    const existing = await this.prisma.passenger.findFirst({
      where: { OR: [{ email: dto.email }, { passportNumber: dto.passportNumber }] },
    });
    if (existing) {
      if (existing.email === dto.email) throw new ConflictException('Email already registered');
      throw new ConflictException('Passport number already registered');
    }

    return this.prisma.passenger.create({ data: { ...dto, dateOfBirth: dob, passportExpiry: passExpiry } });
  }

  async update(id: number, dto: UpdatePassengerDto) {
    await this.findOne(id);

    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      if (dob >= new Date()) throw new BadRequestException('Date of birth must be in the past');
    }
    if (dto.passportExpiry) {
      const expiry = new Date(dto.passportExpiry);
      const minExpiry = new Date();
      minExpiry.setMonth(minExpiry.getMonth() + 6);
      if (expiry < minExpiry) throw new BadRequestException('Passport expiry must be at least 6 months from today');
    }

    const data: any = { ...dto };
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.passportExpiry) data.passportExpiry = new Date(dto.passportExpiry);

    return this.prisma.passenger.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.passenger.update({ where: { id }, data: { isActive: false } });
  }
}

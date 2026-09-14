import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  // ─── Shared login (staff + client) ───────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
        passenger: true,
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales incorrectas');
    const valid = await bcryptjs.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = [...new Set(
      user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => `${rp.permission.module}:${rp.permission.action}`))
    )];

    const payload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      mustChangePassword: user.mustChangePassword,
      roles,
      permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      mustChangePassword: user.mustChangePassword,
      userType: user.userType,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        mustChangePassword: user.mustChangePassword,
        passengerId: user.passengerId,
        roles,
        permissions,
      },
    };
  }

  // ─── Client registration ──────────────────────────────────────────────────
  async registerClient(dto: RegisterClientDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Este correo electrónico ya está registrado');

    const hashed = await bcryptjs.hash(dto.password, 10);

    // Try to find matching passenger by email
    let passenger = await this.prisma.passenger.findFirst({ where: { email: dto.email } });

    if (!passenger && (dto.passportNumber || dto.dateOfBirth)) {
      // Only create passenger record if they provided travel document data
      const data: any = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        nationality: dto.nationality || 'PE',
        preferenceMeal: 'standard',
      };

      if (dto.dateOfBirth) {
        const dob = new Date(dto.dateOfBirth);
        if (dob >= new Date()) throw new BadRequestException('La fecha de nacimiento debe ser en el pasado');
        const maxAge = new Date(); maxAge.setFullYear(maxAge.getFullYear() - 120);
        if (dob < maxAge) throw new BadRequestException('La fecha de nacimiento no puede tener más de 120 años');
        data.dateOfBirth = dob;
      } else {
        data.dateOfBirth = new Date('1990-01-01'); // placeholder
      }

      if (dto.passportNumber) {
        const existingPassport = await this.prisma.passenger.findFirst({ where: { passportNumber: dto.passportNumber } });
        if (existingPassport) throw new ConflictException('Este número de pasaporte ya está registrado');
        data.passportNumber = dto.passportNumber;

        if (dto.passportExpiry) {
          const expiry = new Date(dto.passportExpiry);
          const minExpiry = new Date(); minExpiry.setMonth(minExpiry.getMonth() + 1);
          if (expiry < minExpiry) throw new BadRequestException('El pasaporte debe vencer en al menos 1 mes');
          data.passportExpiry = expiry;
        } else {
          data.passportExpiry = new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000);
        }
      } else {
        // No passport — use placeholder
        data.passportNumber = `TEMP-${Date.now()}`;
        data.passportExpiry = new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000);
      }

      passenger = await this.prisma.passenger.create({ data });
    } else if (!passenger) {
      // Minimal passenger record with just name and email
      passenger = await this.prisma.passenger.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          nationality: dto.nationality || 'PE',
          dateOfBirth: new Date('1990-01-01'),
          passportNumber: `TEMP-${Date.now()}`,
          passportExpiry: new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000),
          preferenceMeal: 'standard',
        },
      });
    }

    await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        userType: 'CLIENT',
        mustChangePassword: false,
        passengerId: passenger.id,
        isActive: true,
      },
    });

    return this.login({ email: dto.email, password: dto.password });
  }

  // ─── First-login password change (staff) ─────────────────────────────────
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.mustChangePassword) {
      const validTemp = await bcryptjs.compare(dto.currentPassword, user.password);
      if (!validTemp) throw new UnauthorizedException('La contraseña actual (DNI) es incorrecta');
    } else {
      const valid = await bcryptjs.compare(dto.currentPassword, user.password);
      if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    if (dto.newPassword.length < 8) throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
    if (!/[A-Z]/.test(dto.newPassword)) throw new BadRequestException('La contraseña debe contener al menos una letra mayúscula');
    if (!/[0-9]/.test(dto.newPassword)) throw new BadRequestException('La contraseña debe contener al menos un número');

    const same = await bcryptjs.compare(dto.newPassword, user.password);
    if (same) throw new BadRequestException('La nueva contraseña no puede ser igual a la contraseña temporal');

    const hashed = await bcryptjs.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, mustChangePassword: false },
    });

    // Return fresh token without mustChangePassword flag
    return this.login({ email: user.email, password: dto.newPassword });
  }

  // ─── Get current user ─────────────────────────────────────────────────────
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
        },
        passenger: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = [...new Set(
      user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => `${rp.permission.module}:${rp.permission.action}`))
    )];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      passengerId: user.passengerId,
      passenger: user.passenger,
      roles,
      permissions,
    };
  }

  // ─── Client profile ────────────────────────────────────────────────────────
  async getClientProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { passenger: true },
    });
    if (!user || user.userType !== 'CLIENT') throw new UnauthorizedException();

    if (!user.passengerId) return { user, passenger: null, reservations: [], tickets: [] };

    const [reservations, tickets] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { passengerId: user.passengerId },
        include: {
          flight: { include: { route: { include: { origin: true, destination: true } }, gate: true } },
          ancillaries: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.supportTicket.findMany({
        where: { passengerId: user.passengerId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return { user, passenger: user.passenger, reservations, tickets };
  }
}

import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { client: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Correo o contraseña incorrectos');
    const valid = await bcryptjs.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Correo o contraseña incorrectos');

    await this.prisma.user.update({ where: { id: user.id }, data: { updatedAt: new Date() } });

    const payload = { sub: user.id, email: user.email, clientId: user.client?.id ?? null, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clientId: user.client?.id ?? null,
        membershipLevel: user.client?.membershipLevel ?? null,
        availablePoints: user.client?.availablePoints ?? 0,
        completedTrips: user.client?.completedTrips ?? 0,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Este correo ya está registrado');

    const passwordValid =
      dto.password.length >= 8 &&
      /[A-Z]/.test(dto.password) &&
      /[0-9]/.test(dto.password);
    if (!passwordValid) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
    }

    const hashed = await bcryptjs.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'CLIENT',
        client: {
          create: {
            phone: dto.phone,
            nationality: dto.nationality,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            travelStyle: dto.travelStyle ?? null,
            destinationType: dto.destinationType ?? null,
            spendingRange: dto.spendingRange ?? null,
          },
        },
      },
      include: { client: true },
    });

    const payload = { sub: user.id, email: user.email, clientId: user.client?.id ?? null, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clientId: user.client?.id ?? null,
        membershipLevel: user.client?.membershipLevel ?? 'EXPLORADOR',
        availablePoints: 0,
        completedTrips: 0,
        role: user.role,
      },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const currentMatches = await bcryptjs.compare(dto.currentPassword, user.password);
    if (!currentMatches) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
    }

    const passwordValid =
      dto.newPassword.length >= 8 &&
      /[A-Z]/.test(dto.newPassword) &&
      /[0-9]/.test(dto.newPassword);
    if (!passwordValid) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
    }

    const hashed = await bcryptjs.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, mustChangePassword: false },
    });

    return { message: 'Contraseña actualizada' };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      clientId: user.client?.id ?? null,
      membershipLevel: user.client?.membershipLevel ?? null,
      availablePoints: user.client?.availablePoints ?? 0,
      completedTrips: user.client?.completedTrips ?? 0,
      travelStyle: user.client?.travelStyle ?? null,
      destinationType: user.client?.destinationType ?? null,
      spendingRange: user.client?.spendingRange ?? null,
      role: user.role,
    };
  }
}

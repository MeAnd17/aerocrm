import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── USERS ────────────────────────────────────────────────────────────────
  async getUsers() {
    return this.prisma.user.findMany({
      include: {
        userRoles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async createUser(dto: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    if (!dto.dni || dto.dni.trim().length < 6)
      throw new BadRequestException('DNI must be at least 6 characters');

    // DNI as temporary password
    const password = await bcrypt.hash(dto.dni.trim(), 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dni: dto.dni.trim().toUpperCase(),
        userType: 'STAFF',
        mustChangePassword: true,
        isActive: true,
      },
    });
  }

  async updateUser(id: number, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const data: any = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.dni) data.dni = dto.dni.trim().toUpperCase();
    if (dto.password) {
      if (dto.password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
      data.password = await bcrypt.hash(dto.password, 10);
      data.mustChangePassword = false;
    }

    return this.prisma.user.update({ where: { id }, data });
  }

  async assignRoles(userId: number, roleIds: number[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    if (!roleIds || roleIds.length === 0) throw new BadRequestException('At least one role must be assigned');

    await this.prisma.userRole.deleteMany({ where: { userId } });
    await this.prisma.userRole.createMany({
      data: roleIds.map(roleId => ({ userId, roleId })),
    });
    return this.getUser(userId);
  }

  // ─── ROLES ────────────────────────────────────────────────────────────────
  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        _count: { select: { userRoles: true, rolePermissions: true } },
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async createRole(dto: any) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Role "${dto.name}" already exists`);
    return this.prisma.role.create({ data: { name: dto.name, description: dto.description } });
  }

  async updateRole(id: number, dto: any) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    if ((role as any)._count.userRoles > 0)
      throw new BadRequestException(`Cannot delete role "${role.name}" because it has ${(role as any)._count.userRoles} users assigned`);
    return this.prisma.role.delete({ where: { id } });
  }

  // ─── PERMISSIONS ──────────────────────────────────────────────────────────
  async getPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  async togglePermission(roleId: number, permissionId: number, grant: boolean) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role #${roleId} not found`);
    const perm = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!perm) throw new NotFoundException(`Permission #${permissionId} not found`);

    if (grant) {
      await this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    } else {
      await this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
    }
    return { roleId, permissionId, granted: grant };
  }
}

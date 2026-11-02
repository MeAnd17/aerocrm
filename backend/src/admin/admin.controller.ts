import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

/** Resumen de conteos para el panel de administración. */
class AdminStatsDto {
  @ApiProperty({ example: 12, description: 'Destinos activos' }) destinations: number;
  @ApiProperty({ example: 48, description: 'Reservas totales' }) bookings: number;
  @ApiProperty({ example: 35, description: 'Clientes registrados' }) clients: number;
}

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  /** Estadísticas globales para el panel de administración. Solo accesible para administradores. */
  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estadísticas del panel de administración (solo admin)' })
  @ApiOkResponse({ description: 'Conteos de destinos, reservas y clientes', type: AdminStatsDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o vencido' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden acceder' })
  async stats(): Promise<AdminStatsDto> {
    const [destinations, bookings, clients] = await Promise.all([
      this.prisma.destination.count({ where: { isActive: true } }),
      this.prisma.booking.count(),
      this.prisma.client.count(),
    ]);
    return { destinations, bookings, clients };
  }
}

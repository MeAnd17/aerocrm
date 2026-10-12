import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Salud')
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  /** Salud del servicio: falla con 503 si la base de datos no responde (TS-004). */
  @Get('health')
  @ApiOperation({ summary: 'Estado del servicio y de la base de datos' })
  @ApiServiceUnavailableResponse({ description: 'La base de datos no responde' })
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'sin respuesta' });
    }
    return { status: 'ok', app: 'AeroCRM API', database: 'ok', timestamp: new Date().toISOString() };
  }
}

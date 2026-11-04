import { Controller, Get, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

/** Datos públicos de la agencia devueltos por GET /agency. */
class AgencyInfoDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: 'Expertia Travel S.A.C.' }) legalName: string;
  @ApiProperty({ example: 'Expertia Travel' }) tradeName: string;
  @ApiProperty({ example: '20601234567' }) ruc: string;
  @ApiProperty({ example: 'Av. José Pardo 123, Miraflores, Lima' }) address: string;
  @ApiProperty({ example: '+51 1 234 5678' }) phone: string;
  @ApiProperty({ example: 'contacto@expertiatravel.com' }) email: string;
  @ApiProperty({ example: '/assets/logo.png', required: false }) logoUrl?: string | null;
}

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

  /** Datos públicos de la agencia (registro único id = 1). Usado en confirmaciones e impresión. */
  @Get('agency')
  @ApiOperation({ summary: 'Datos de la agencia (nombre, RUC, contacto)' })
  @ApiOkResponse({ type: AgencyInfoDto })
  @ApiNotFoundResponse({ description: 'Datos de la agencia no configurados' })
  async agency() {
    const info = await this.prisma.agencyInfo.findUnique({ where: { id: 1 } });
    if (!info) throw new NotFoundException('Datos de la agencia no configurados');
    return info;
  }
}

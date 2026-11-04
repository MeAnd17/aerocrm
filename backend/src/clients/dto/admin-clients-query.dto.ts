import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MembershipLevel } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Parámetros de búsqueda y filtro para GET /admin/clients. */
export class AdminClientsQueryDto {
  @ApiPropertyOptional({ enum: MembershipLevel, description: 'Filtra por nivel de membresía' })
  @IsOptional()
  @IsEnum(MembershipLevel)
  level?: MembershipLevel;

  @ApiPropertyOptional({ description: 'Busca por nombre o correo electrónico' })
  @IsOptional()
  @IsString()
  search?: string;
}

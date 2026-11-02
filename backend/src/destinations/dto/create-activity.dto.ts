import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

/** Datos para agregar una actividad a un destino (US-027). */
export class CreateActivityDto {
  @ApiProperty({ example: 'Snorkel en arrecife de coral' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiPropertyOptional({ example: 'Excursión guiada al arrecife de Mesoamérica' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number;

  @ApiProperty({ example: '120.00', description: 'Precio por persona (string decimal)' })
  @IsNumberString()
  price: string;

  @ApiPropertyOptional({ example: 'https://example.com/snorkel.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

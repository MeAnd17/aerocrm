import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExtraPricing, ExtraType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

/** Datos para crear o actualizar una opción de extra (US-027). */
export class CreateExtraDto {
  @ApiProperty({ enum: ExtraType })
  @IsEnum(ExtraType)
  type: ExtraType;

  @ApiProperty({ example: 'Traslado de ida' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Traslado del aeropuerto al hotel' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '85.00', description: 'Precio base (string decimal)' })
  @IsNumberString()
  price: string;

  @ApiProperty({ enum: ExtraPricing })
  @IsEnum(ExtraPricing)
  pricing: ExtraPricing;
}

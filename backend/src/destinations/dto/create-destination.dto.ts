import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DestinationType } from '@prisma/client';

/** Datos para crear un destino nuevo en el catálogo (US-027). */
export class CreateDestinationDto {
  @ApiProperty({ example: 'Cancún' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'México' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'MX', description: 'Código ISO del país' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: 'Cancún' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'CUN', description: 'Código IATA del aeropuerto' })
  @IsString()
  @IsNotEmpty()
  iataCode: string;

  @ApiPropertyOptional({ example: 'Playas de arena blanca y mar turquesa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cancun.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ enum: DestinationType })
  @IsEnum(DestinationType)
  type: DestinationType;
}

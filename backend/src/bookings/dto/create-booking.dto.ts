import { IsNumber, IsOptional, IsString, IsArray, ArrayMinSize, ValidateNested, IsEnum, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExtraType } from '@prisma/client';

// ── Sub-DTOs de cada línea del paquete ────────────────────────────────────────
// Los campos de precio (priceSnapshot, price, etc.) se eliminaron: el servidor
// los calcula a partir del catálogo (AGENTS.md B6).

export class BookingFlightDto {
  @ApiProperty({ description: 'ID del vuelo', example: 5 })
  @IsInt()
  flightId: number;
}

export class BookingHotelDto {
  @ApiProperty({ description: 'ID del hotel', example: 3 })
  @IsInt()
  hotelId: number;

  @ApiProperty({ description: 'Fecha de entrada (ISO date)', example: '2025-08-10' })
  @IsString()
  checkIn: string;

  @ApiProperty({ description: 'Fecha de salida (ISO date)', example: '2025-08-17' })
  @IsString()
  checkOut: string;

  @ApiProperty({ description: 'Número de noches', example: 7 })
  @IsInt()
  @Min(1)
  nights: number;
}

export class BookingActivityDto {
  @ApiProperty({ description: 'ID de la actividad', example: 2 })
  @IsInt()
  activityId: number;

  @ApiProperty({ description: 'Cantidad de participantes', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class BookingExtraDto {
  @ApiProperty({ description: 'Tipo de extra', enum: ExtraType })
  @IsEnum(ExtraType)
  type: ExtraType;

  @ApiPropertyOptional({ description: 'Detalle adicional (p.ej. dirección de recogida)', example: 'Av. Lima 123' })
  @IsOptional()
  @IsString()
  details?: string;
}

// ── DTO principal de creación ─────────────────────────────────────────────────

export class CreateBookingDto {
  @ApiProperty({ description: 'Número de pasajeros', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  passengers: number;

  @ApiPropertyOptional({ description: 'Puntos a canjear (mínimo 500)', example: 500 })
  @IsOptional()
  @IsNumber()
  pointsToRedeem?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales', example: 'Preferencia ventana' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Vuelos incluidos en el paquete (ida y regreso)', type: [BookingFlightDto] })
  @IsArray()
  @ArrayMinSize(2, { message: 'Se requieren al menos dos vuelos (ida y regreso)' })
  @ValidateNested({ each: true })
  @Type(() => BookingFlightDto)
  flights: BookingFlightDto[];

  @ApiPropertyOptional({ description: 'Hotel del paquete', type: [BookingHotelDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingHotelDto)
  hotels?: BookingHotelDto[];

  @ApiPropertyOptional({ description: 'Actividades del paquete', type: [BookingActivityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingActivityDto)
  activities?: BookingActivityDto[];

  @ApiPropertyOptional({ description: 'Extras del paquete (traslados, seguro)', type: [BookingExtraDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingExtraDto)
  extras?: BookingExtraDto[];
}

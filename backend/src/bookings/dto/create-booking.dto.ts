import { IsNumber, IsOptional, IsString, IsArray, ArrayMinSize, ValidateNested, IsEnum, Min, IsInt, IsISO8601, IsBoolean, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, ExtraType } from '@prisma/client';
import { EsDocumentoValido, EsFechaNacimientoValida } from '../../common/validators';

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

export class BookingPassengerDto {
  @ApiProperty({ description: 'Nombre del pasajero (2–50 letras)', example: 'Ana' })
  @Matches(/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s\-']{2,50}$/, {
    message: 'El nombre solo puede contener letras, espacios, guiones y apóstrofos (2–50 caracteres)',
  })
  firstName: string;

  @ApiProperty({ description: 'Apellido del pasajero (2–50 letras)', example: 'López' })
  @Matches(/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s\-']{2,50}$/, {
    message: 'El apellido solo puede contener letras, espacios, guiones y apóstrofos (2–50 caracteres)',
  })
  lastName: string;

  @ApiProperty({ description: 'Tipo de documento', enum: DocumentType, example: 'DNI' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Número de documento (DNI: 8 dígitos; Pasaporte: 6–12 alfanuméricos)', example: '70000001' })
  @IsString()
  @EsDocumentoValido()
  documentNumber: string;

  @ApiProperty({ description: 'Fecha de nacimiento (ISO 8601, entre 1900 y hoy)', example: '1990-05-12' })
  @IsISO8601()
  @EsFechaNacimientoValida()
  birthDate: string;

  @ApiPropertyOptional({ description: '¿Es el titular de la reserva?', example: true })
  @IsBoolean()
  @IsOptional()
  isHolder?: boolean;
}

// ── DTO principal de creación ─────────────────────────────────────────────────

export class CreateBookingDto {
  @ApiProperty({ description: 'Lista de pasajeros (al menos uno)', type: [BookingPassengerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingPassengerDto)
  passengers: BookingPassengerDto[];

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

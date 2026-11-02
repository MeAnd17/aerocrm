import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Entrada ──────────────────────────────────────────────────────────────────

export class QuoteActivityItemDto {
  @ApiProperty({ description: 'ID de la actividad', example: 1 })
  @IsInt()
  activityId: number;

  @ApiProperty({ description: 'Cantidad de participantes (1-pasajeros)', example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class QuoteDto {
  @ApiProperty({ description: 'ID del vuelo de ida', example: 5 })
  @IsInt()
  flightId: number;

  @ApiProperty({ description: 'ID del vuelo de regreso', example: 12 })
  @IsInt()
  returnFlightId: number;

  @ApiProperty({ description: 'Número de pasajeros', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  passengers: number;

  @ApiPropertyOptional({ description: 'ID del hotel', example: 3 })
  @IsOptional()
  @IsInt()
  hotelId?: number;

  @ApiPropertyOptional({ description: 'Fecha de entrada (ISO date, p.ej. 2025-08-10)', example: '2025-08-10' })
  @IsOptional()
  @IsString()
  checkIn?: string;

  @ApiPropertyOptional({ description: 'Fecha de salida (ISO date, p.ej. 2025-08-17)', example: '2025-08-17' })
  @IsOptional()
  @IsString()
  checkOut?: string;

  @ApiPropertyOptional({ description: 'Actividades seleccionadas', type: [QuoteActivityItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteActivityItemDto)
  activities?: QuoteActivityItemDto[];

  @ApiPropertyOptional({
    description: 'IDs de extras seleccionados',
    example: [1, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  extras?: number[];

  @ApiPropertyOptional({ description: 'Puntos a canjear (mínimo 500)', example: 500, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToRedeem?: number;
}

// ── Salida ────────────────────────────────────────────────────────────────────

export class QuoteFlightLineDto {
  @ApiProperty({ example: 5 }) id: number;
  @ApiProperty({ example: 'LA2345' }) flightNumber: string;
  @ApiProperty({ example: 'LATAM Airlines' }) airline: string;
  @ApiProperty({ example: '2025-08-10T08:00:00.000Z' }) departureDate: string;
  @ApiProperty({ example: 450.00 }) pricePerPerson: number;
  @ApiProperty({ example: 900.00 }) lineTotal: number;
}

export class QuoteHotelLineDto {
  @ApiProperty({ example: 3 }) id: number;
  @ApiProperty({ example: 'Hotel Cancún Paradise' }) name: string;
  @ApiProperty({ example: 520.00 }) pricePerNight: number;
  @ApiProperty({ example: 7 }) nights: number;
  @ApiProperty({ example: 3640.00 }) lineTotal: number;
}

export class QuoteActivityLineDto {
  @ApiProperty({ example: 2 }) id: number;
  @ApiProperty({ example: 'Snorkel en el Arrecife' }) name: string;
  @ApiProperty({ example: 180.00 }) pricePerPerson: number;
  @ApiProperty({ example: 2 }) quantity: number;
  @ApiProperty({ example: 360.00 }) lineTotal: number;
}

export class QuoteExtraLineDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: 'TRASLADO_IDA' }) type: string;
  @ApiProperty({ example: 'Traslado de ida al aeropuerto' }) name: string;
  @ApiProperty({ example: 80.00 }) price: number;
  @ApiProperty({ example: 80.00 }) lineTotal: number;
}

export class QuoteBreakdownDto {
  @ApiProperty({ type: QuoteFlightLineDto }) outboundFlight: QuoteFlightLineDto;
  @ApiPropertyOptional({ type: QuoteFlightLineDto }) returnFlight?: QuoteFlightLineDto;
  @ApiPropertyOptional({ type: QuoteHotelLineDto }) hotel?: QuoteHotelLineDto;
  @ApiProperty({ type: [QuoteActivityLineDto] }) activities: QuoteActivityLineDto[];
  @ApiProperty({ type: [QuoteExtraLineDto] }) extras: QuoteExtraLineDto[];
  @ApiProperty({ example: 5000.00 }) subtotal: number;
  @ApiProperty({ example: 50.00 }) discountByRedemption: number;
  @ApiProperty({ example: 4950.00 }) total: number;
}

export class QuoteResponseDto {
  @ApiProperty({ type: QuoteBreakdownDto }) breakdown: QuoteBreakdownDto;
  @ApiProperty({ example: 500 }) pointsToRedeem: number;
  @ApiProperty({ example: 49 }) pointsToEarn: number;
}

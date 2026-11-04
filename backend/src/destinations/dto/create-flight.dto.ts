import { ApiProperty } from '@nestjs/swagger';
import { FlightClass } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumberString, IsString, Min } from 'class-validator';

/** Datos para agregar un vuelo a un destino (US-027). */
export class CreateFlightDto {
  @ApiProperty({ example: 'LATAM Airlines' })
  @IsString()
  @IsNotEmpty()
  airline: string;

  @ApiProperty({ example: 'LA2020' })
  @IsString()
  @IsNotEmpty()
  flightNumber: string;

  @ApiProperty({ example: '2026-12-20T08:00:00Z' })
  @IsDateString()
  departureDate: string;

  @ApiProperty({ example: '2026-12-20T11:30:00Z' })
  @IsDateString()
  arrivalDate: string;

  @ApiProperty({ example: 210 })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  stops: number;

  @ApiProperty({ enum: FlightClass })
  @IsEnum(FlightClass)
  classType: FlightClass;

  @ApiProperty({ example: '450.00', description: 'Precio por pasajero (string decimal)' })
  @IsNumberString()
  pricePerPerson: string;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(1)
  seatsAvailable: number;

  @ApiProperty({ example: 8, description: 'ID del destino de origen (Destination.id)' })
  @IsInt()
  @Min(1)
  originId: number;
}

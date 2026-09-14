import { IsString, IsInt, IsOptional, IsDateString, IsEnum, Min, Max, Matches } from 'class-validator';
import { FlightStatus } from '@prisma/client';

export class CreateFlightDto {
  @IsString() @Matches(/^[A-Z]{2}-\d{3,4}$/, { message: 'Flight number format: XX-1234 (e.g. AE-1001)' })
  flightNumber: string;

  @IsInt() @Min(1, { message: 'Route ID must be a positive integer' })
  routeId: number;

  @IsOptional() @IsInt() @Min(1)
  gateId?: number;

  @IsDateString({}, { message: 'Scheduled departure must be a valid ISO date' })
  scheduledDeparture: string;

  @IsDateString({}, { message: 'Scheduled arrival must be a valid ISO date' })
  scheduledArrival: string;

  @IsOptional() @IsEnum(FlightStatus)
  status?: FlightStatus;

  @IsString() @IsOptional()
  aircraft?: string;

  @IsInt() @Min(1, { message: 'Total seats must be at least 1' }) @Max(1000, { message: 'Total seats cannot exceed 1000' })
  totalSeats: number;

  @IsInt() @Min(1, { message: 'Economy seats must be at least 1' }) @Max(900)
  economySeats: number;

  @IsInt() @Min(0, { message: 'Business seats cannot be negative' }) @Max(400)
  businessSeats: number;

  @IsInt() @Min(0, { message: 'First class seats cannot be negative' }) @Max(100)
  firstClassSeats: number;
}

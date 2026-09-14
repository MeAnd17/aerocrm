import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { FlightStatus } from '@prisma/client';

export class UpdateFlightStatusDto {
  @IsEnum(FlightStatus, { message: 'Status must be a valid flight status' })
  status: FlightStatus;

  @IsOptional() @IsDateString()
  actualDeparture?: string;

  @IsOptional() @IsDateString()
  actualArrival?: string;

  @IsOptional() @IsString()
  reason?: string;
}

import { IsInt, IsEnum, IsOptional, IsString, IsPositive, IsNumber, Min, Matches, Length } from 'class-validator';
import { FareClass } from '@prisma/client';

export class CreateReservationDto {
  @IsInt() @Min(1, { message: 'Passenger ID must be a positive integer' })
  passengerId: number;

  @IsInt() @Min(1, { message: 'Flight ID must be a positive integer' })
  flightId: number;

  @IsEnum(FareClass, { message: 'Fare class must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS' })
  fareClass: FareClass;

  @IsOptional() @IsString() @Matches(/^\d{1,3}[A-F]$/, { message: 'Seat number format: 12A, 34C, etc.' })
  seatNumber?: string;

  @IsNumber() @IsPositive({ message: 'Total price must be a positive number' })
  totalPrice: number;

  @IsOptional() @IsString() @Length(3, 3, { message: 'Currency must be a 3-letter ISO code (e.g. USD)' })
  currency?: string;
}

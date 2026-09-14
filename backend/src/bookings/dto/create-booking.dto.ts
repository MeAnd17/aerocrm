import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsEnum, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ExtraType } from '@prisma/client';

export class BookingFlightDto {
  @IsInt() flightId: number;
  @IsNumber() priceSnapshot: number;
}

export class BookingHotelDto {
  @IsInt() hotelId: number;
  @IsString() checkIn: string;
  @IsString() checkOut: string;
  @IsInt() nights: number;
  @IsNumber() priceSnapshot: number;
}

export class BookingActivityDto {
  @IsInt() activityId: number;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() priceSnapshot: number;
}

export class BookingExtraDto {
  @IsEnum(ExtraType) type: ExtraType;
  @IsNumber() price: number;
  @IsOptional() @IsString() details?: string;
}

export class CreateBookingDto {
  @IsInt() @Min(1) passengers: number;
  @IsOptional() @IsNumber() pointsToRedeem?: number;
  @IsOptional() @IsString() notes?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => BookingFlightDto)
  flights: BookingFlightDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => BookingHotelDto)
  hotels?: BookingHotelDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => BookingActivityDto)
  activities?: BookingActivityDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => BookingExtraDto)
  extras?: BookingExtraDto[];
}

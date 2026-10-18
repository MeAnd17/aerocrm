import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { TravelStyle, DestinationType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsOptional()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(TravelStyle)
  travelStyle?: TravelStyle;

  @IsOptional()
  @IsEnum(DestinationType)
  destinationType?: DestinationType;

  @IsOptional()
  @IsString()
  budget?: string;
}

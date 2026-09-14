import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsEnum, IsBoolean, IsDateString, Matches, IsIn } from 'class-validator';
import { PassengerTier } from '@prisma/client';

export class CreatePassengerDto {
  @IsString() @MinLength(2, { message: 'First name must be at least 2 characters' }) @MaxLength(50)
  firstName: string;

  @IsString() @MinLength(2, { message: 'Last name must be at least 2 characters' }) @MaxLength(50)
  lastName: string;

  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @IsString() @MinLength(2) @MaxLength(3)
  nationality: string;

  @IsDateString({}, { message: 'Date of birth must be a valid date (YYYY-MM-DD)' })
  dateOfBirth: string;

  @IsString() @Matches(/^[A-Z0-9]{6,9}$/, { message: 'Passport number must be 6-9 alphanumeric characters (uppercase)' })
  passportNumber: string;

  @IsDateString({}, { message: 'Passport expiry must be a valid date (YYYY-MM-DD)' })
  passportExpiry: string;

  @IsOptional() @IsString() @MaxLength(20)
  frequentFlyerNumber?: string;

  @IsOptional() @IsEnum(PassengerTier)
  tier?: PassengerTier;

  @IsOptional() @IsBoolean()
  preferenceWindow?: boolean;

  @IsOptional() @IsBoolean()
  preferenceAisle?: boolean;

  @IsOptional() @IsIn(['standard', 'vegetarian', 'vegan', 'halal', 'kosher'], { message: 'Meal preference must be one of: standard, vegetarian, vegan, halal, kosher' })
  preferenceMeal?: string;

  @IsOptional() @IsBoolean()
  preferenceSpecialAssistance?: boolean;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

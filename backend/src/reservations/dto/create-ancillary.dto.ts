import { IsEnum, IsString, IsInt, IsOptional, Min, Max, IsNumber, IsPositive } from 'class-validator';
import { AncillaryType } from '@prisma/client';

export class CreateAncillaryDto {
  @IsEnum(AncillaryType, { message: 'Ancillary type must be valid' })
  type: AncillaryType;

  @IsOptional() @IsString()
  description?: string;

  @IsInt() @Min(1, { message: 'Quantity must be at least 1' }) @Max(10, { message: 'Quantity cannot exceed 10' })
  quantity: number;

  @IsNumber() @IsPositive({ message: 'Unit price must be positive' })
  unitPrice: number;
}

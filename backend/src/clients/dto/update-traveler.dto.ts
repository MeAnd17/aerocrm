import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UpdateTravelerDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() dateOfBirth?: string;
  @IsOptional() @IsString() relation?: string;
}

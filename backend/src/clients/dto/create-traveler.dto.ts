import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateTravelerDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @IsString() @IsNotEmpty() documentNumber: string;
  @IsNotEmpty() dateOfBirth: string;
  @IsString() @IsNotEmpty() relation: string;
}

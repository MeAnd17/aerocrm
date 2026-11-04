import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TravelStyle, DestinationType, DocumentType } from '@prisma/client';

export class UpdateClientDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() dateOfBirth?: string;
  @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsEnum(TravelStyle) travelStyle?: TravelStyle;
  @IsOptional() @IsEnum(DestinationType) destinationType?: DestinationType;
}

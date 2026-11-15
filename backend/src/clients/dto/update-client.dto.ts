import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TravelStyle, DestinationType, DocumentType, SpendingRange } from '@prisma/client';

export class UpdateClientDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() dateOfBirth?: string;
  @IsOptional() @IsEnum(DocumentType) documentType?: DocumentType;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsEnum(TravelStyle) travelStyle?: TravelStyle;
  @IsOptional() @IsEnum(DestinationType) destinationType?: DestinationType;
  @ApiProperty({ enum: SpendingRange, enumName: 'SpendingRange', required: false })
  @IsOptional() @IsEnum(SpendingRange) spendingRange?: SpendingRange;
}

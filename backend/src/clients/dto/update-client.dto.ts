import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TravelStyle, DestinationType } from '@prisma/client';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: '+51 999 888 777' })
  @IsOptional() @IsString() phone?: string;

  @ApiPropertyOptional({ example: 'Peruana' })
  @IsOptional() @IsString() nationality?: string;

  @ApiPropertyOptional({ example: '1990-05-20' })
  @IsOptional() dateOfBirth?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional() @IsString() documentNumber?: string;

  @ApiPropertyOptional({ enum: TravelStyle })
  @IsOptional() @IsEnum(TravelStyle) travelStyle?: TravelStyle;

  @ApiPropertyOptional({ enum: DestinationType })
  @IsOptional() @IsEnum(DestinationType) destinationType?: DestinationType;

  @ApiPropertyOptional({ example: '500' })
  @IsOptional() @IsString() budget?: string;
}

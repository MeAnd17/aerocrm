import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTravelerDto {
  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional() @IsString() @IsNotEmpty() firstName?: string;

  @ApiPropertyOptional({ example: 'García' })
  @IsOptional() @IsString() @IsNotEmpty() lastName?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional() @IsString() @IsNotEmpty() documentNumber?: string;

  @ApiPropertyOptional({ example: '1990-05-20' })
  @IsOptional() dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Hija' })
  @IsOptional() @IsString() @IsNotEmpty() relation?: string;
}

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTravelerDto {
  @ApiProperty({ example: 'Ana' })
  @IsString() @IsNotEmpty() firstName: string;

  @ApiProperty({ example: 'García' })
  @IsString() @IsNotEmpty() lastName: string;

  @ApiProperty({ example: '12345678' })
  @IsString() @IsNotEmpty() documentNumber: string;

  @ApiProperty({ example: '1990-05-20' })
  @IsNotEmpty() dateOfBirth: string;

  @ApiProperty({ example: 'Hija' })
  @IsString() @IsNotEmpty() relation: string;
}

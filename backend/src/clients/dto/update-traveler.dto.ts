import { IsString, IsOptional } from 'class-validator';

export class UpdateTravelerDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() dateOfBirth?: string;
  @IsOptional() @IsString() relation?: string;
}

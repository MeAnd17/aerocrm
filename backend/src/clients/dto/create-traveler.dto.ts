import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTravelerDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsNotEmpty() documentNumber: string;
  @IsNotEmpty() dateOfBirth: string;
  @IsString() @IsNotEmpty() relation: string;
}

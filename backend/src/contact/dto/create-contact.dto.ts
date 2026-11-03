import { IsEmail, IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() @MaxLength(200) subject: string;
  @IsString() @IsNotEmpty() @MinLength(10) @MaxLength(2000) message: string;
}

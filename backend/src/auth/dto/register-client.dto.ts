import { IsEmail, IsString, MinLength, MaxLength, IsDateString, Matches, IsOptional } from 'class-validator';

export class RegisterClientDto {
  @IsString() @MinLength(2) @MaxLength(50)
  firstName: string;

  @IsString() @MinLength(2) @MaxLength(50)
  lastName: string;

  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email: string;

  @IsString() @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(3)
  nationality?: string;

  @IsOptional() @IsDateString({}, { message: 'Fecha de nacimiento debe ser una fecha válida' })
  dateOfBirth?: string;

  @IsOptional() @IsString() @Matches(/^[A-Z0-9]{6,9}$/, { message: 'Número de pasaporte: 6-9 caracteres alfanuméricos en mayúsculas' })
  passportNumber?: string;

  @IsOptional() @IsDateString({}, { message: 'Fecha de vencimiento del pasaporte debe ser válida' })
  passportExpiry?: string;
}

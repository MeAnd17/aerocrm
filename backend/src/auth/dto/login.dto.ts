import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido' })
  email: string;

  // En el login no se valida el largo: solo se compara con la contraseña guardada.
  @IsString({ message: 'Ingresa tu contraseña' })
  @IsNotEmpty({ message: 'Ingresa tu contraseña' })
  password: string;
}

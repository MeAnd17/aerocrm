import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual del usuario', example: 'MiContraseña1' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña (mínimo 8 caracteres, una mayúscula y un número)', example: 'NuevaContraseña2' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

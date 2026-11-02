import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Método de pago simulado para confirmar una reserva PENDIENTE. */
export class PayBookingDto {
  @IsEnum(['TARJETA', 'TRANSFERENCIA', 'BILLETERA_DIGITAL'])
  @ApiProperty({ enum: ['TARJETA', 'TRANSFERENCIA', 'BILLETERA_DIGITAL'], example: 'TARJETA' })
  method: 'TARJETA' | 'TRANSFERENCIA' | 'BILLETERA_DIGITAL';
}

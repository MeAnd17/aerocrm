import { IsInt, IsNumberString, Min } from 'class-validator';

export class RedemptionPreviewDto {
  /** Total del paquete antes del canje, en soles con dos decimales (ej. "2450.50"). */
  @IsNumberString({}, { message: 'El total del paquete debe ser un monto válido' })
  packageTotal: string;

  /** Puntos que el cliente quiere canjear. */
  @IsInt({ message: 'Los puntos deben ser un número entero' })
  @Min(0)
  pointsToRedeem: number;
}

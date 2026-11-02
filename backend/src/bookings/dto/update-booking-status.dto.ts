import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

/** Cuerpo para que el administrador avance el estado de una reserva. */
export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  @ApiProperty({ enum: BookingStatus, example: 'EN_CURSO' })
  status: BookingStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Cambio manual por soporte' })
  reason?: string;
}

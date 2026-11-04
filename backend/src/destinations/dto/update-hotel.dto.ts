import { PartialType } from '@nestjs/swagger';
import { CreateHotelDto } from './create-hotel.dto';

/** Datos para actualizar un hotel (todos los campos son opcionales). */
export class UpdateHotelDto extends PartialType(CreateHotelDto) {}

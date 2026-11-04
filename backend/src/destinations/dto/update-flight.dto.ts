import { PartialType } from '@nestjs/swagger';
import { CreateFlightDto } from './create-flight.dto';

/** Datos para actualizar un vuelo (todos los campos son opcionales). */
export class UpdateFlightDto extends PartialType(CreateFlightDto) {}

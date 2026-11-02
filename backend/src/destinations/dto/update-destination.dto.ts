import { PartialType } from '@nestjs/swagger';
import { CreateDestinationDto } from './create-destination.dto';

/** Datos para actualizar un destino (todos los campos son opcionales). */
export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}

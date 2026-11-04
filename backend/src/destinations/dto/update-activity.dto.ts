import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';

/** Datos para actualizar una actividad (todos los campos son opcionales). */
export class UpdateActivityDto extends PartialType(CreateActivityDto) {}

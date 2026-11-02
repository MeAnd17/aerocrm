import { PartialType } from '@nestjs/swagger';
import { CreateExtraDto } from './create-extra.dto';

/** Datos para actualizar un extra (todos los campos son opcionales). */
export class UpdateExtraDto extends PartialType(CreateExtraDto) {}

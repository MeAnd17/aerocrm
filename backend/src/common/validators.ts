import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Valida el formato del documento según su tipo:
 * - DNI: exactamente 8 dígitos
 * - PASAPORTE: 6 a 12 caracteres alfanuméricos
 * Solo evalúa el formato; si el tipo no es string, deja que @IsString lo reporte.
 */
export function EsDocumentoValido(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'esDocumentoValido',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== 'string') return true;
          const obj = args.object as { documentType?: string };
          if (obj.documentType === 'DNI') return /^\d{8}$/.test(value);
          if (obj.documentType === 'PASAPORTE') return /^[A-Z0-9]{6,12}$/i.test(value);
          return true;
        },
        defaultMessage(): string {
          return 'El número de documento no tiene el formato correcto para el tipo seleccionado (DNI: 8 dígitos; pasaporte: 6–12 alfanuméricos)';
        },
      },
    });
  };
}

/**
 * Valida que la fecha de nacimiento esté entre 1900-01-01 y ayer (nunca futura).
 * Si la fecha no es parseable, deja que @IsISO8601 lo reporte.
 */
export function EsFechaNacimientoValida(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'esFechaNacimientoValida',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return true;
          const fecha = new Date(value);
          if (isNaN(fecha.getTime())) return true;
          const hoy = new Date();
          const minima = new Date('1900-01-01');
          return fecha < hoy && fecha >= minima;
        },
        defaultMessage(): string {
          return 'La fecha de nacimiento debe estar entre el 1 de enero de 1900 y hoy';
        },
      },
    });
  };
}

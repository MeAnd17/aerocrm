import { BadRequestException, ValidationError } from '@nestjs/common';

/**
 * Mensajes de validación en español (AGENTS.md B9).
 *
 * class-validator responde en inglés por defecto ("password must be longer than...").
 * Este traductor convierte esos mensajes al español con el nombre del campo en español.
 * Si un decorador ya trae su propio mensaje, se respeta tal cual.
 */

/** Nombre en español de cada campo que llega en un DTO. Agregar aquí los campos nuevos. */
const FIELD_LABELS: Record<string, string> = {
  email: 'correo electrónico',
  password: 'contraseña',
  currentPassword: 'contraseña actual',
  newPassword: 'nueva contraseña',
  firstName: 'nombre',
  lastName: 'apellido',
  phone: 'teléfono',
  nationality: 'nacionalidad',
  dateOfBirth: 'fecha de nacimiento',
  documentNumber: 'número de documento',
  travelStyle: 'forma de viajar',
  destinationType: 'tipo de destino',
  spendingRange: 'rango de gasto',
  relation: 'parentesco',
  name: 'nombre',
  subject: 'asunto',
  message: 'mensaje',
  passengers: 'pasajeros',
  pointsToRedeem: 'puntos a canjear',
  packageTotal: 'total del paquete',
  notes: 'notas',
  flights: 'vuelos',
  hotels: 'hoteles',
  activities: 'actividades',
  extras: 'extras',
  flightId: 'vuelo',
  hotelId: 'hotel',
  activityId: 'actividad',
  checkIn: 'fecha de entrada',
  checkOut: 'fecha de salida',
  nights: 'noches',
  quantity: 'cantidad',
  priceSnapshot: 'precio',
  price: 'precio',
  type: 'tipo',
  details: 'detalle',
  // Campos del DTO de cotización (QuoteDto)
  returnFlightId: 'vuelo de regreso',
  // Campos de BookingPassengerDto
  birthDate: 'fecha de nacimiento',
  isHolder: 'titular',
};

/** Los mensajes por defecto de class-validator están en inglés y contienen "must" o "should". */
const DEFAULT_ENGLISH = /\b(must|should)\b/;

function label(property: string): string {
  return FIELD_LABELS[property] ?? property;
}

function firstNumber(text: string): string {
  return /(\d+(?:\.\d+)?)/.exec(text)?.[1] ?? '';
}

export function translateConstraint(constraint: string, property: string, original: string): string {
  if (!DEFAULT_ENGLISH.test(original)) return original;
  const campo = label(property);
  const n = firstNumber(original);
  switch (constraint) {
    case 'isNotEmpty':
    case 'isDefined':
      return `El campo ${campo} es obligatorio`;
    case 'isEmail':
      return 'Ingresa un correo electrónico válido';
    case 'isString':
      return `El campo ${campo} debe ser texto`;
    case 'minLength':
      return `El campo ${campo} debe tener al menos ${n} caracteres`;
    case 'maxLength':
      return `El campo ${campo} no puede tener más de ${n} caracteres`;
    case 'isInt':
      return `El campo ${campo} debe ser un número entero`;
    case 'isNumber':
    case 'isNumberString':
      return `El campo ${campo} debe ser un número`;
    case 'min':
      return `El campo ${campo} no puede ser menor que ${n}`;
    case 'max':
      return `El campo ${campo} no puede ser mayor que ${n}`;
    case 'isEnum':
    case 'isIn':
      return `El valor de ${campo} no es una opción válida`;
    case 'isDateString':
    case 'isDate':
      return `El campo ${campo} debe ser una fecha válida`;
    case 'isArray':
      return `El campo ${campo} debe ser una lista`;
    case 'isBoolean':
      return `El campo ${campo} debe ser verdadero o falso`;
    case 'matches':
      return `El campo ${campo} no tiene el formato correcto`;
    case 'whitelistValidation':
      return `El campo ${campo} no está permitido`;
    default:
      return `El campo ${campo} no es válido`;
  }
}

function collect(errors: ValidationError[], out: string[]) {
  for (const error of errors) {
    for (const [constraint, message] of Object.entries(error.constraints ?? {})) {
      out.push(translateConstraint(constraint, error.property, message));
    }
    if (error.children?.length) collect(error.children, out);
  }
}

/** Se usa en el ValidationPipe global (main.ts). Mantiene el formato de respuesta de Nest. */
export function validationExceptionFactory(errors: ValidationError[]) {
  const messages: string[] = [];
  collect(errors, messages);
  return new BadRequestException(messages);
}

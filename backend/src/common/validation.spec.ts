import { ValidationError } from '@nestjs/common';
import { translateConstraint, validationExceptionFactory } from './validation';

describe('Mensajes de validación en español', () => {
  it('traduce el mensaje por defecto de class-validator', () => {
    expect(translateConstraint('minLength', 'password', 'password must be longer than or equal to 8 characters'))
      .toBe('El campo contraseña debe tener al menos 8 caracteres');
    expect(translateConstraint('isEmail', 'email', 'email must be an email')).toBe('Ingresa un correo electrónico válido');
    expect(translateConstraint('whitelistValidation', 'rol', 'property rol should not exist'))
      .toBe('El campo rol no está permitido');
  });

  it('respeta los mensajes escritos en el DTO', () => {
    expect(translateConstraint('isNotEmpty', 'password', 'Ingresa tu contraseña')).toBe('Ingresa tu contraseña');
  });

  it('recorre los errores anidados y mantiene el formato de Nest', () => {
    const errors = [
      {
        property: 'hotels',
        children: [{ property: 'nights', constraints: { isInt: 'nights must be an integer number' }, children: [] }],
      },
    ] as unknown as ValidationError[];
    const body = validationExceptionFactory(errors).getResponse() as { message: string[] };
    expect(body.message).toEqual(['El campo noches debe ser un número entero']);
  });
});

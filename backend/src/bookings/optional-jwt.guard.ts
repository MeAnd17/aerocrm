import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guarda JWT opcional: si no hay token (o es inválido) el request continúa
 * con req.user = undefined. Solo se usa en endpoints que sirven tanto a
 * usuarios autenticados como anónimos (p. ej. POST /bookings/quote, US-020).
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<T = any>(_err: any, user: T): T {
    // No lanzar error si falta o falla el token — req.user quedará undefined.
    return user ?? (undefined as any);
  }
}
